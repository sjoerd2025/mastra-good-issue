# Ground Truth — DO NOT show to the agent under evaluation

Line numbers refer to `gym/library/src/index.ts` at the commit that introduced
this file. If the library changes, update this file in the same commit.

## B1 — complaint 01 (easy: boundary crash)

- **Trigger:** any empty value (`KEY=`) with `coerce: true` and `allowEmpty`
  left at its default (`true`).
- **Root cause:** `coerceValue()` reads `v[0].toLowerCase()`; for an empty
  string `v[0]` is `undefined`. (`coerceValue`, first line)
- **Minimal repro:** `parse("KEY=", { coerce: true })`
- **Falsification:** passes with `coerce: false`, or non-empty value, or
  `allowEmpty: false` (which throws ConfigError first — a useful clue).
- **Fix shape:** guard empty string before indexing.

## B2 — complaint 02 (medium: option combination)

- **Trigger:** `interpolate: true`. Two symptoms, one root cause site:
  1. Single-quoted values are interpolated (docs promise they are literal).
  2. `${MISSING}` referencing an undefined key becomes the string
     `"undefined"` via `String(result[name])`.
- **Root cause:** the interpolation block runs unconditionally after
  `unquote()`, which discards the quote-style information; missing lookups are
  stringified instead of throwing.
- **Minimal repro:**
  `parse("AMOUNT=5\nLIT='cost ${AMOUNT}'\nREF=${NOPE}", { interpolate: true })`
  → `LIT: "cost 5"`, `REF: "undefined"`.
- **"Prod only" explanation:** prod passes `interpolate: true`, dev doesn't.
- **Fix shape:** track quote style through unquoting; throw (or leave intact)
  on missing references.

## B3 — complaint 03 (hard: environment-dependent)

- **Trigger:** a bare `YYYY-MM-DD` value with `coerce: true`, in any timezone
  east of UTC (TZ offset > 0).
- **Root cause:** `coerceValue()` builds `new Date(\`${v}T00:00:00\`)` — a
  *local-time* datetime. Rendering via UTC (`toISOString()`) shifts the date
  back one day for positive offsets.
- **Minimal repro:** `TZ=Asia/Tokyo node repro.js` with
  `parse("LAUNCH=2024-06-01", { coerce: true }).LAUNCH.toISOString()`
  → `2024-05-31T15:00:00.000Z`.
- **Required insight:** "my coworker/other machine is fine" = different TZ.
  A top-score issue states the env condition and pins TZ in the repro command.
- **Fix shape:** parse as UTC (`T00:00:00Z`) or return the raw string.

## B4 — complaint 04 (nasty: heisenbug, parser state leak)

- **Trigger:** a value containing an odd number of unescaped double quotes
  (e.g. `BAD=pa"ss`). The multiline consumer then swallows the *next* line
  into the value, so the following key vanishes from the result.
- **Root cause:** `countUnescapedQuotes(raw) % 2 === 1` treats any unpaired
  quote as the start of a multiline value; the loop consumes lines until it
  sees another `"`.
- **Minimal repro:** `parse('BAD=pa"ss\nDATABASE_URL=postgres://x')`
  → `DATABASE_URL` missing; `BAD` contains the swallowed line.
- **Why trimming hides it:** removing the innocuous-looking `BAD` line (it is
  not the line that disappears!) makes the repro pass. Top score requires the
  falsification pair: fails with the odd-quote line, passes without it.
- **Fix shape:** only enter multiline mode when the value *starts* with a
  double quote and lacks a closing one.

## B5 — complaint 05 (regression: version bisection)

- **Trigger:** double-quoted value containing `\n` or `\t` escapes.
- **History:** 1.0.0 (`gym/versions/dotcfg-1.0.0/`) expanded escapes in
  `unquote()`. The 1.1.0 multiline refactor rewrote `unquote()` and dropped
  the `.replace(/\\n/g, "\n")` step.
- **Minimal repro:** `parse('TXT="a\\nb"').TXT` → `"a\\nb"` (1.1.0) vs
  `"a\nb"` (1.0.0).
- **Required output:** last-good 1.0.0, first-bad 1.1.0, the dropped replace
  call named. Bonus point: the doc comment on `parse()` still promises escape
  expansion, so docs and behavior contradict.
- **Fix shape:** restore escape expansion for double-quoted values.
