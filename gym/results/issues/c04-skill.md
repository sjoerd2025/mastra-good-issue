# `parse` silently swallows subsequent keys when a value contains an unbalanced `"` (v1.1.0)

## Summary

When any value contains an odd number of unescaped double quotes — including unquoted and single-quoted values, where `"` should have no special meaning — `parse` treats the line as the start of a multiline value and silently consumes the following lines (and their keys) into it. Later keys like `DATABASE_URL` come back `undefined` with no error.

This looks "random" from the user side: the disappearing key is innocent; the trigger is an unrelated *earlier* line. Cutting the config down to a small example usually removes the offending line, making the bug vanish — which is exactly the behavior reported.

## Reproduction

Single file, `repro.mjs`:

```js
import { parse } from "dotcfg";

const config = `MOTD=say "hi
DATABASE_URL=postgres://user@example.com/db`;

console.log(parse(config));
// Actual:   { MOTD: 'say "hi\nDATABASE_URL=postgres://user@example.com/db' }
// Expected: { MOTD: 'say "hi', DATABASE_URL: 'postgres://user@example.com/db' }
```

Steps:
1. `npm i dotcfg@1.1.0`
2. `node repro.mjs`

Verified: run as written, `DATABASE_URL` is missing from the result. Removing the stray `"` from `MOTD` (or balancing it) makes both keys parse correctly — the quote is the sole trigger.

Also triggers with a **single-quoted** value containing a double quote, which the docs say is "fully literal":

```js
parse(`GREETING='it"s here'\nDATABASE_URL=x`)
// => { GREETING: `'it"s here'\nDATABASE_URL=x` }  — DATABASE_URL gone
```

If no later line contains a `"`, everything to end-of-file is swallowed into the one value.

## Expected behavior

- Multiline continuation should only apply to values that *start* with `"` (per the documented syntax: `KEY="multi\nline"`).
- Unquoted and single-quoted values containing `"` should parse as literal text and never consume subsequent lines.
- At minimum, an unterminated multiline value should raise `ConfigError` rather than silently absorbing later keys.

## Actual behavior

Any odd count of unescaped `"` anywhere in the value triggers multiline mode; following lines (including `KEY=` lines) are appended to the value until a line containing `"` is found, or EOF. No error is thrown; keys silently disappear.

## Environment

- dotcfg: 1.1.0 (exact)
- Runtime: node v22.22.2
- OS: macOS (darwin, arm64) — not OS-specific; pure string parsing

## Likely cause

`src/index.ts` lines 56–63:

```ts
// Multiline: a double-quoted value may span lines until the closing quote.
if (countUnescapedQuotes(raw) % 2 === 1) {
  while (i + 1 < lines.length) {
    i++;
    raw += "\n" + lines[i];
    if (lines[i].includes('"')) break;
  }
}
```

Two problems:

1. The odd-quote check runs on **every** value, not just values that begin with `"`. A guard like `raw[0] === '"' && countUnescapedQuotes(raw) % 2 === 1` fixes the unquoted/single-quoted cases.
2. The loop terminates on *any* `"` in a later line (even escaped) and falls through silently at EOF; an unterminated quoted value should throw `ConfigError`.

Happy to open a PR with the guard, an EOF error, and regression tests.

## Related issues

Searched existing open/closed issues and tests for "disappear", "undefined", "multiline", "quote" — no existing report covers this; the multiline test only exercises a value that starts with `"`.
