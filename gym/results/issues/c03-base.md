# `coerce: true` parses date-only values as *local* midnight, making results depend on the machine's timezone

## Summary

When `parse()` is called with `{ coerce: true }`, a value matching `YYYY-MM-DD` is turned into a `Date` by appending a local-time suffix:

```ts
// src/index.ts, coerceValue()
if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
  return new Date(`${v}T00:00:00`);   // ← no timezone designator → interpreted as LOCAL time
}
```

Because the string has no timezone designator, the resulting `Date` represents midnight **in the local timezone of whatever machine parses the config**. The same config file therefore yields a different point in time on different machines, and any UTC-based consumption of the value (`toISOString()`, `getUTCDate()`, JSON serialization, storing in a DB) shows the **previous day** in every timezone east of UTC.

## Reproduction

```ts
import { parse } from "dotcfg";
const { LAUNCH } = parse("LAUNCH=2024-06-01", { coerce: true });
console.log(LAUNCH.toISOString());
```

Same code, same file, different machines:

| TZ of machine       | `LAUNCH.toISOString()`     | UTC calendar day |
|---------------------|----------------------------|------------------|
| UTC                 | `2024-06-01T00:00:00.000Z` | June 1           |
| America/Los_Angeles | `2024-06-01T07:00:00.000Z` | June 1           |
| Asia/Tokyo          | `2024-05-31T15:00:00.000Z` | **May 31**       |
| Australia/Sydney    | `2024-05-31T14:00:00.000Z` | **May 31**       |

This exactly matches a user report we received: the config says `2024-06-01`, but their app displays "May 31st", while a coworker running identical code and config sees "June 1st", and the reporter's own other machine also sees "June 1st". The only variable is the host timezone (reporter's affected machine is in a UTC+N zone; the value is serialized/rendered via UTC downstream).

## Expected behavior

Parsing a config file should be deterministic: the same input should produce the same value on every machine. A bare `YYYY-MM-DD` should be anchored to a fixed instant — most reasonably UTC midnight (matching how ECMAScript itself treats date-only ISO strings: `new Date("2024-06-01")` is UTC).

## Actual behavior

The value is local midnight, so the underlying instant shifts by up to ±14 hours depending on the parsing machine, and date-only values render as the wrong calendar day whenever the producer/consumer timezones straddle UTC.

## Suggested fix

Use an explicit UTC anchor:

```ts
return new Date(`${v}T00:00:00Z`);
```

(or `new Date(v)`, which the spec already treats as UTC). If local-time interpretation was intentional for some use case, it should be opt-in and documented — the current behavior is a silent portability trap.

## Environment

- dotcfg current `main` (`src/index.ts`, `coerceValue`)
- Reproduced on Node 22 across TZ=UTC / America/Los_Angeles / Asia/Tokyo / Australia/Sydney
