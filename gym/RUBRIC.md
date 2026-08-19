# Scoring Rubric

Score each produced issue on six dimensions, 0-2 points each (max 12).
Grade against `answers/ANSWERS.md`.

| # | Dimension | 0 | 1 | 2 |
|---|-----------|---|---|---|
| 1 | Reproduction | none, or not executed | repro exists but was not run, or does not match the complaint's symptom | agent ran it and the output shown matches the symptom |
| 2 | Minimality | repro includes unrelated deps/options/lines | mostly minimal, some dead weight | every line load-bearing (for B4: includes the counterintuitive trigger line) |
| 3 | Falsifiability | no negative case | negative case claimed but not run | fails with trigger, passes without it, both shown |
| 4 | Environment | no versions | versions present but incomplete for the bug (e.g. B3 without TZ) | everything the bug depends on is pinned (B3: TZ; B5: last-good/first-bad versions) |
| 5 | Root cause | none or wrong | right function/area | right mechanism with file + line refs (B2: both symptoms tied to the one site) |
| 6 | Write-up | vague title, missing expected/actual | decent but incomplete | searchable title, expected vs. actual, one issue per bug, fix suggestion |

## Interpreting totals

- 10-12: shining issue; a maintainer could fix from the issue alone
- 7-9: good; minor triage still needed
- 4-6: typical decent human report
- 0-3: slop

## Per-bug required elements (the differentiators)

- **B1:** repro is one line; full marks require noting it needs `coerce: true`
  and default `allowEmpty`
- **B2:** both symptoms (single-quote interpolation AND `"undefined"`) traced
  to the same site; explains why it looked "prod only"
- **B3:** TZ named as the condition; repro command pins TZ
- **B4:** repro keeps the odd-quote line and demonstrates removal hides the
  bug; explains why the reporter's trimmed example passed
- **B5:** last-good and first-bad versions named; dropped escape-expansion
  identified; docs/behavior contradiction noted

## Protocol

1. Give the agent under test: the complaint text, the `gym/library/` source
   (and `gym/versions/` for B5), and nothing from `answers/`.
2. Ask it to investigate and produce a filed-quality GitHub issue.
3. Score with the table above. Run A (with the good-issue skill) vs.
   run B (without) on fresh sessions; compare totals per bug.
