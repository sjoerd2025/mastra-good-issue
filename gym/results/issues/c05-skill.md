# `parse` no longer expands `\n`/`\t` escapes in double-quoted values (regression in v1.1.0, worked in v1.0.0)

## Summary

Since v1.1.0, double-quoted values containing the two-character escape
sequences `\n` / `\t` are returned with the literal characters
backslash-`n` / backslash-`t` instead of being expanded to a newline/tab,
even though the documented syntax still promises expansion. v1.0.0 expanded
them correctly.

## Reproduction

Single file, no options, no other dependencies:

```js
// repro.mjs
import { parse } from "dotcfg";

// Config file content: GREETING="Hello\nWorld"
const cfg = parse('GREETING="Hello\\nWorld"');
console.log(JSON.stringify(cfg.GREETING));
```

Steps:
1. `npm i dotcfg@1.1.0`
2. `node repro.mjs`

Output on **1.1.0** (bad): `"Hello\\nWorld"` — literal backslash + `n`
Output on **1.0.0** (good): `"Hello\nWorld"` — real newline

Falsifiability checks (run on 1.1.0):
- Same value in single quotes stays literal on **both** versions — expected,
  since single quotes are documented as "fully literal, no escapes".
- Actual multiline double-quoted values (`A="x<newline>y"`) still work on
  1.1.0, so this is specifically the `\n`/`\t` escape expansion that regressed.

## Expected behavior

Per the `parse` doc comment in `src/index.ts`:

> `KEY="value"` — double-quoted: preserves inner whitespace, **expands `\n` and `\t` escapes**

`parse('GREETING="Hello\\nWorld"').GREETING` should be `"Hello\nWorld"`
(a real newline), as in v1.0.0.

## Actual behavior

The value is `"Hello\\nWorld"` — the two characters `\` and `n` are kept
verbatim. No error is thrown; the value is silently wrong (e.g. rendered
email templates print literal `\n`).

## Environment

- dotcfg: 1.1.0 (bad) / 1.0.0 (last known good — bisected, boundary is the
  1.1.0 "multiline values" release)
- Runtime: Node v22.22.2
- OS: macOS 15.6 (arm64) — not believed to be OS-specific

## Likely cause

The v1.1.0 multiline refactor rewrote `unquote()` and dropped the escape
expansion:

- v1.0.0 `src/index.ts` (`unquote`, ~line 68–72): for double-quoted values it
  returned
  ```js
  inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  ```
- v1.1.0 `src/index.ts` lines 91–100: `unquote()` now returns
  `raw.slice(1, -1)` for both quote styles — the `.replace()` calls for
  double-quoted values are gone.

Suggested fix: restore the double-quote branch in `unquote()`:

```js
function unquote(raw) {
  if (raw.length >= 2 && (raw[0] === '"' || raw[0] === "'") && raw[raw.length - 1] === raw[0]) {
    const inner = raw.slice(1, -1);
    if (raw[0] === '"') return inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    return inner;
  }
  return raw;
}
```

Note the current test suite passes on 1.1.0 — no test covers escape
expansion, which is how the regression slipped through. A fix should add e.g.
`assert.equal(parse('A="x\\ny"').A, "x\ny")`. Happy to open a PR with the fix
and regression test.

## Related issues

Searched open and closed issues for "escape", "\n", "newline", "literal
backslash", and "unquote" — no existing report of this regression found.
