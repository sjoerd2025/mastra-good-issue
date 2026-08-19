# Keys silently disappear when a preceding value contains an odd number of `"` characters

## Summary

`parse()` silently swallows subsequent lines — including entire `KEY=value`
definitions — whenever an *earlier* line's value contains an odd number of
double-quote characters. The following keys never appear in the result; their
text is instead concatenated into the previous key's value.

This explains the "keys randomly disappear" reports: the missing key
(`DATABASE_URL` in the original report) is not the broken line. The trigger is
some *earlier, unrelated* line, so minimizing the config by deleting lines
around the missing key makes the bug vanish — which is exactly why small
repros "work fine".

## Reproduction

```ts
import { parse } from "dotcfg";

parse(`GREETING='say "hello'
DATABASE_URL=postgres://localhost/db
OTHER=1`);
// => { GREETING: "'say \"hello'\nDATABASE_URL=postgres://localhost/db\nOTHER=1" }
// DATABASE_URL and OTHER are gone.
```

Variant with an unquoted value containing a stray `"`:

```ts
parse(`MOTD=Rock "n Roll
DATABASE_URL=postgres://localhost/db
APP_NAME="my app"
PORT=5432`);
// => {
//   MOTD: "Rock \"n Roll\nDATABASE_URL=...\nAPP_NAME=\"my app\"",
//   PORT: "5432"
// }
// Lines are consumed until the next line that happens to contain a ",
// so *which* keys vanish depends on unrelated nearby lines.
```

## Expected

- `DATABASE_URL` etc. are parsed as normal keys.
- Multiline continuation should only engage for values that actually *start*
  with an unterminated double-quoted string (e.g. `KEY="multi\nline"`), never
  for single-quoted or unquoted values that merely contain a `"`.

## Root cause

In `src/index.ts` (`parse`, lines 56–63), multiline mode is entered whenever
the raw value contains an odd count of unescaped `"` characters:

```ts
if (countUnescapedQuotes(raw) % 2 === 1) {
  while (i + 1 < lines.length) {
    i++;
    raw += "\n" + lines[i];
    if (lines[i].includes('"')) break;
  }
}
```

Problems:

1. The check fires for values that are not double-quoted at all — a `"` inside
   a single-quoted value (`'say "hello'`) or an unquoted value (`Rock "n Roll`)
   triggers continuation, consuming following lines as part of this value.
2. The consumed lines are lost silently — no error, no warning; the keys just
   never appear in the result.
3. The `break` condition (`lines[i].includes('"')`) stops at *any* quote,
   including escaped `\"`, and if no later line contains a quote it silently
   consumes to EOF instead of raising an unterminated-string error.

## Suggested fix

Only enter multiline mode when `raw` starts with `"` and the quote count is
odd; throw a `ConfigError` for an unterminated double-quoted value at EOF, and
terminate continuation on an *unescaped* closing quote rather than any `"`.

## Environment

- dotcfg @ current `main` (`src/index.ts`)
- Node 22, default `ParseOptions`
