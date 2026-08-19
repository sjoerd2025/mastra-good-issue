# `parse` with `coerce: true` returns a timezone-dependent Date for `YYYY-MM-DD` values — date shifts to the previous day (v1.1.0)

## Summary

When `coerce: true` turns a `YYYY-MM-DD` value into a `Date`, it is constructed
at **local** midnight (`new Date(\`${v}T00:00:00\`)`), so the resulting instant
depends on the host machine's timezone. On any machine in a UTC-positive
timezone, UTC-based rendering (`toISOString()`, `getUTCDate()`, JSON
serialization, DB storage) shows the **previous calendar day** — e.g.
`LAUNCH_DATE=2024-06-01` displays as May 31. The same code and config file
produce different results on machines in different timezones, which makes this
look like data corruption to users ("my coworker gets June 1st, I get May 31st").

## Reproduction

Single file, no options beyond the trigger (`coerce: true`):

```js
// repro.mjs
import { parse } from "dotcfg";

const { LAUNCH_DATE } = parse("LAUNCH_DATE=2024-06-01", { coerce: true });
console.log("TZ =", process.env.TZ ?? "(system)");
console.log(LAUNCH_DATE.toISOString());
```

Steps:

1. `npm i dotcfg@1.1.0`
2. `TZ=Asia/Tokyo node repro.mjs` → fails (previous day)
3. `TZ=UTC node repro.mjs` → passes (control)

Observed output:

```
TZ = Asia/Tokyo
2024-05-31T15:00:00.000Z      ← "May 31st"

TZ = UTC
2024-06-01T00:00:00.000Z

TZ = America/New_York
2024-06-01T04:00:00.000Z      ← different instant again; same *local* day only by luck
```

Falsifiability: removing `coerce: true` (value stays a string) or constructing
the date without the `T00:00:00` suffix (`new Date("2024-06-01")` is UTC
midnight per the ECMAScript date-time string format) makes the output identical
on every machine.

## Expected behavior

A bare `YYYY-MM-DD` config value should coerce to the same instant on every
machine — most reasonably UTC midnight, matching JavaScript's own behavior for
date-only strings (`new Date("2024-06-01")` → `2024-06-01T00:00:00.000Z`).
Parsing a static config file should be deterministic regardless of host
timezone.

## Actual behavior

The coerced `Date` is local midnight, so the underlying instant varies with the
host timezone. Any UTC-based read of it (`toISOString`, `getUTC*`, JSON
serialization) reports the previous day on machines east of UTC. No error is
thrown; the date is silently off by up to one day.

## Environment

- dotcfg: 1.1.0 (exact)
- Runtime: Node.js v22.22.2
- OS: reproduced on macOS 15.6 (arm64); behavior is TZ-dependent, not
  OS-dependent — any machine with a UTC-positive system timezone reproduces it

## Likely cause

`src/index.ts`, `coerceValue`, lines 109–111:

```ts
if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
  return new Date(`${v}T00:00:00`);
}
```

Appending `T00:00:00` (no offset) makes the string a *date-time* form, which
ECMAScript parses in **local time**. A bare date-only string is parsed as UTC.

Suggested fix (one-line):

```ts
return new Date(`${v}T00:00:00Z`);  // or simply: new Date(v)
```

Happy to open a PR with the fix plus a regression test that runs the parse
under two `TZ` values and asserts identical `getTime()`.

## Related issues

None found — searched the tracker (open and closed) for "timezone", "Date",
"off by one", "previous day", and "coerce"; also checked the changelog through
v1.1.0 for a fix. Nothing matches.
