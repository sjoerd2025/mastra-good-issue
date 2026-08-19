# `parse` with `interpolate: true` rewrites single-quoted values and expands unknown `${VAR}` to the string `"undefined"` (v1.1.0)

## Summary

When `interpolate: true` is set, `parse()` performs `${VAR}` interpolation inside **single-quoted** values — which the docs state are "fully literal, no escapes, no interpolation" — and any reference to an undefined key is replaced with the literal string `"undefined"` instead of being left alone (or erroring). Both symptoms come from the same interpolation block, so they're reported together; happy to split into two issues if you prefer.

## Reproduction

Single file, `repro.mjs`:

```js
import { parse } from "dotcfg";

const src = [
  `NAME=world`,
  `LITERAL='hi \${NAME}'`,          // bug 1: single-quoted, docs say fully literal — gets rewritten
  `NOTE="total: \${AMOUNT} USD"`,   // bug 2: undefined var becomes the string "undefined"
].join("\n");

console.log(parse(src, { interpolate: true }));
```

Steps:
1. `npm i dotcfg@1.1.0`
2. `node repro.mjs`

Output:

```
{ NAME: 'world', LITERAL: 'hi world', NOTE: 'total: undefined USD' }
```

Falsifiability: with `interpolate: false` (the default) both values are returned verbatim:

```
{ NAME: 'world', LITERAL: 'hi ${NAME}', NOTE: 'total: ${AMOUNT} USD' }
```

This is why the bug typically only bites in environments where interpolation is enabled.

## Expected behavior

Per the syntax docs in `src/index.ts`:

> `KEY='value'`  single-quoted: fully literal, no escapes, no interpolation

1. `LITERAL='hi ${NAME}'` should parse to `hi ${NAME}` even with `interpolate: true`.
2. `${AMOUNT}` referencing an undefined key should not silently become the string `"undefined"` — it should either be left as-is, expand to the empty string, or throw a `ConfigError` (any of these is defensible; silent `"undefined"` is not).

## Actual behavior

1. Single-quoted values are interpolated: `LITERAL` becomes `hi world`.
2. Undefined references become the literal text `undefined`: `NOTE` becomes `total: undefined USD`.

No error is thrown; corrupted values propagate silently (in our case into a billing display).

## Environment

- dotcfg: 1.1.0
- Runtime: Node.js v22.22.2
- OS: macOS (darwin, arm64) — not platform-specific; pure string handling
- Reproduces on a fresh install; behavior is deterministic

## Likely cause

`src/index.ts`:

- Line 65: `unquote(raw)` strips the quotes and **discards the quote style**, so by the time interpolation runs there is no way to know the value was single-quoted.
- Lines 71–75: interpolation is applied unconditionally to every value:

  ```ts
  if (interpolate) {
    value = value.replace(/\$\{(\w+)\}/g, (_, name: string) =>
      String(result[name]),
    );
  }
  ```

  `String(result[name])` is also what produces `"undefined"` when `name` isn't a defined key.

Suggested fix: have `unquote` return (or the caller detect) whether the raw value was single-quoted, and skip interpolation for single-quoted values; in the replacer, handle missing keys explicitly (e.g. `name in result ? String(result[name]) : match`, or throw a `ConfigError`). Happy to open a PR for either or both.

## Related issues

Searched open and closed issues for "undefined", "interpolate", "single quote", "literal" — no existing report found.
