# `parse` throws `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` on empty values when `coerce: true` (v1.1.0)

## Summary

When `parse()` is called with `{ coerce: true }` and the config contains an empty value (`KEY=` or `KEY=""`), it crashes with `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` instead of returning the empty string (or raising a proper `ConfigError`).

This is easy to hit in the wild: `.env`-style files commonly contain placeholder lines like `API_KEY=`. The same file parses fine with `dotenv` (which never coerces), which is why users perceive it as "my normal config crashes your library".

## Reproduction

Single file, no dependencies beyond `dotcfg`:

```js
// repro.js
import { parse } from "dotcfg";

parse("FOO=", { coerce: true }); // crashes
```

Steps:
1. `npm i dotcfg@1.1.0`
2. `node repro.js`

Output:

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at coerceValue (dotcfg/dist/index.js:74:24)
    at Module.parse (dotcfg/dist/index.js:53:32)
```

Falsifiability checks (both verified):
- `parse("FOO=")` (no `coerce`) → `{ FOO: '' }` ✅
- `parse("FOO=bar", { coerce: true })` → `{ FOO: 'bar' }` ✅
- `parse('FOO=""', { coerce: true })` also crashes (quoted empty value) ❌

## Expected behavior

An empty value with `coerce: true` should return `""` unchanged (there is nothing to coerce). The docs say `allowEmpty` defaults to `true`, so empty values are explicitly supported; if a user wants empties rejected, `allowEmpty: false` already throws a descriptive `ConfigError`. A raw `TypeError` from library internals should never escape.

## Actual behavior

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at coerceValue (dist/index.js:74:24)
    at Module.parse (dist/index.js:53:32)
```

## Environment

- dotcfg: 1.1.0
- Runtime: Node v22.22.2
- OS: macOS 15.6 (arm64)
- Options involved: `coerce: true` (default `allowEmpty: true`)

## Likely cause

`src/index.ts`, `coerceValue()`, line 103:

```ts
function coerceValue(v: string): ConfigValue {
  const first = v[0].toLowerCase(); // v[0] is undefined when v === ""
  ...
}
```

When `v === ""`, `v[0]` is `undefined`, so `.toLowerCase()` throws. `parse()` calls `coerceValue(value)` unconditionally at line 77 whenever `coerce` is set, and empty values are allowed by default (`allowEmpty: true`), so any `KEY=` line triggers it.

Suggested fix (one line):

```ts
function coerceValue(v: string): ConfigValue {
  if (v === "") return v;
  const first = v[0].toLowerCase();
  ...
}
```

(or `const first = v[0]?.toLowerCase();`). Happy to send a PR with the fix plus a regression test for `parse("FOO=", { coerce: true })` and `parse('FOO=""', { coerce: true })`.

## Related issues

No duplicate found — searched the tracker (open and closed) for `toLowerCase`, `coerce`, `empty value`, and `TypeError`. Not mentioned in the changelog; reproduced on the latest release (1.1.0).
