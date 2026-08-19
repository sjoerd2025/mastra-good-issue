# Interpolation corrupts values: undefined refs become the string "undefined", and single-quoted values are interpolated despite being documented as literal

## Summary

When `parse()` is called with `interpolate: true`, two related bugs corrupt values:

1. A `${VAR}` reference to a key that is not (yet) defined is replaced with the
   literal string `"undefined"` instead of erroring or being left alone.
2. Single-quoted values are interpolated, even though the docs (JSDoc on
   `parse`) state: `KEY='value'  single-quoted: fully literal, no escapes, no interpolation`.

These only manifest when `interpolate: true` is enabled, which explains
"happens in prod only" reports — environments that don't enable interpolation
are unaffected.

## Reproduction

```js
import { parse } from "dotcfg";

const src = [
  "GREETING=hello ${MISSING}",
  "PRICE_TEMPLATE='Total: ${AMOUNT} USD'",
  "AMOUNT=5",
  "LATER=${AMOUNT}",
].join("\n");

console.log(parse(src, { interpolate: true }));
```

### Actual output

```json
{
  "GREETING": "hello undefined",
  "PRICE_TEMPLATE": "Total: undefined USD",
  "AMOUNT": "5",
  "LATER": "5"
}
```

### Expected output

```json
{
  "GREETING": "hello ${MISSING}",          // or a ConfigError for the unknown key
  "PRICE_TEMPLATE": "Total: ${AMOUNT} USD", // single-quoted → fully literal
  "AMOUNT": "5",
  "LATER": "5"
}
```

Note `PRICE_TEMPLATE` hits both bugs at once: it should not be interpolated at
all (single quotes), and because `AMOUNT` is defined *after* it, the reference
resolves to `undefined` — so a template intended to be rendered later by the
application comes out as `Total: undefined USD`. This is exactly the kind of
value that ends up on a billing display.

## Root cause

In `src/index.ts` (`parse`, lines 65–77):

```ts
let value = unquote(raw);          // quote style is discarded here
...
if (interpolate) {
  value = value.replace(/\$\{(\w+)\}/g, (_, name: string) =>
    String(result[name]),          // String(undefined) === "undefined"
  );
}
```

- `unquote()` strips the quotes without recording whether the value was
  single-quoted, so the interpolation step cannot honor the documented
  "single quotes are literal" rule.
- `String(result[name])` stringifies `undefined` for unknown keys instead of
  handling the miss.

## Suggested fix

1. Track quote style before unquoting and skip interpolation entirely for
   single-quoted values.
2. For unknown keys, either throw a `ConfigError` naming the key and line, or
   leave the `${...}` token untouched (pick one and document it). Silently
   substituting `"undefined"` is never correct.

A related edge to consider while fixing: with `coerce: true`, interpolating a
previously coerced value stringifies it (e.g. a `Date` becomes its full
`toString()` output), which may also surprise users.

## Environment

- dotcfg current `main` (`src/index.ts`)
- Node.js v22, TypeScript 5.x
- Reproduces deterministically with the snippet above
