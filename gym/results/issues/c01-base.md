# `parse()` crashes with `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` when `coerce: true` and a value is empty

## Summary

When `parse()` is called with `{ coerce: true }` and the config contains any key with an empty value (`KEY=` or `KEY=""`), the library throws an uncaught `TypeError` instead of returning the parsed config or a proper `ConfigError`. This crashes the consuming app at startup.

Empty values are valid input: `allowEmpty` defaults to `true`, and the same file parses fine without `coerce` (and with dotenv), which is why users report their config as "totally normal".

## Reproduction

```js
const { parse } = require("dotcfg");

parse("EMPTY=", { coerce: true });
// TypeError: Cannot read properties of undefined (reading 'toLowerCase')
//     at coerceValue (dist/index.js:74)
//     at parse (dist/index.js:53)
```

Also triggered by:

```js
parse('EMPTY=""', { coerce: true });   // quoted empty value — same crash
parse("EMPTY=", {});                   // OK: { EMPTY: '' }  (works without coerce)
```

## Root cause

`coerceValue()` in `src/index.ts` assumes the value is non-empty:

```ts
function coerceValue(v: string): ConfigValue {
  const first = v[0].toLowerCase(); // v[0] is undefined when v === ""
  ...
}
```

For an empty string, `v[0]` is `undefined`, so `.toLowerCase()` throws. The empty value reaches `coerceValue` because `allowEmpty` defaults to `true`, so the `allowEmpty` guard doesn't reject it.

## Expected behavior

`parse("EMPTY=", { coerce: true })` should return `{ EMPTY: "" }` — an empty string has nothing to coerce. If empty values are meant to be rejected, users should get a `ConfigError` (opt-in via `allowEmpty: false`), never a raw `TypeError`.

## Suggested fix

Guard for the empty string in `coerceValue`:

```ts
function coerceValue(v: string): ConfigValue {
  if (v === "") return v;
  const first = v[0].toLowerCase();
  ...
}
```

(or use `v[0]?.toLowerCase()`).

## Environment

- dotcfg: current `main` (`src/index.ts`)
- Node.js: any (pure JS bug, reproduced on v22)
- Only occurs when `coerce: true`; `interpolate`/`allowEmpty` irrelevant except that `allowEmpty: false` masks it by throwing `ConfigError` first.
