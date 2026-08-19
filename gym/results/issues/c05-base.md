# Regression in 1.1.0: `\n` / `\t` escapes no longer expanded in double-quoted values

## Summary

Since v1.1.0, double-quoted values containing `\n` (or `\t`) are returned with the
literal two-character sequence backslash-n instead of a real newline. This is a
regression from v1.0.0 and contradicts the library's own doc comment on `parse()`:

> `KEY="value"` — double-quoted: preserves inner whitespace, **expands \n and \t escapes**

Reported downstream by a user whose email templates started printing literal `\n`
after upgrading; downgrading to 1.0.0 fixes it, but they need 1.1.0 for multiline values.

## Reproduction

```ts
import { parse } from "dotcfg";

parse('MSG="hi\\nthere"');
// v1.0.0 → { MSG: "hi\nthere" }   (real newline)
// v1.1.0 → { MSG: "hi\\nthere" }  (literal backslash + n)  ← regression
```

## Root cause

The 1.1.0 multiline-values refactor rewrote `unquote()` and dropped the escape
expansion for double-quoted strings.

v1.0.0 (`src/index.ts`, `unquote`):

```ts
const inner = raw.slice(1, -1);
if (raw[0] === '"') {
  return inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}
return inner;
```

v1.1.0 (`src/index.ts:91-100`):

```ts
function unquote(raw: string): string {
  if (
    raw.length >= 2 &&
    (raw[0] === '"' || raw[0] === "'") &&
    raw[raw.length - 1] === raw[0]
  ) {
    return raw.slice(1, -1);   // escapes no longer expanded
  }
  return raw;
}
```

## Expected behavior

Double-quoted values expand `\n` and `\t` (as in 1.0.0 and as documented).
Single-quoted values remain fully literal.

## Suggested fix

Restore escape expansion for the double-quote branch in `unquote()`:

```ts
const inner = raw.slice(1, -1);
if (raw[0] === '"') {
  return inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}
return inner;
```

Plus a regression test, e.g.:

```ts
assert.deepEqual(parse('MSG="a\\nb"'), { MSG: "a\nb" });
assert.deepEqual(parse("MSG='a\\nb'"), { MSG: "a\\nb" }); // single quotes stay literal
```

## Environment

- dotcfg 1.1.0 (regression introduced here); last good: 1.0.0
- Behavior verified by running `parse()` from both source snapshots
