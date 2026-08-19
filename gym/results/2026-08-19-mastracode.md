# Eval run — 2026-08-19

- Agent under test: `mastracode -p` headless, fresh thread + isolated
  `--resource-id` per run, `--dangerously`-free defaults, build mode
- Arms: **skill** (prompt requires reading SKILL.md + references first) vs.
  **base** (identical prompt, no skill)
- Grader: scored by hand against `answers/ANSWERS.md` using `RUBRIC.md`
- Artifacts: `/tmp/gym-eval/c{01..05}-{skill,base}/ISSUE.md`

## Scores (0–2 per dimension, max 12)

| Bug | Arm | Repro | Minimal | Falsify | Env | Root cause | Write-up | Total |
|---|---|---|---|---|---|---|---|---|
| B1 crash | base | 2 | 2 | 2 | 1 | 2 | 2 | **11** |
| B1 crash | skill | 2 | 2 | 2 | 2 | 2 | 2 | **12** |
| B2 undefined | base | 2 | 2 | 1 | 1 | 2 | 2 | **10** |
| B2 undefined | skill | 2 | 2 | 2 | 2 | 2 | 2 | **12** |
| B3 date shift | base | 2 | 2 | 2 | 1 | 2 | 2 | **11** |
| B3 date shift | skill | 2 | 2 | 2 | 2 | 2 | 2 | **12** |
| B4 heisenbug | base | 2 | 2 | 1 | 1 | 2 | 2 | **10** |
| B4 heisenbug | skill | 2 | 2 | 2 | 2 | 2 | 2 | **12** |
| B5 regression | base | 2 | 2 | 2 | 2 | 2 | 2 | **12** |
| B5 regression | skill | 2 | 2 | 2 | 2 | 2 | 2 | **12** |

**Totals: skill 60/60, base 54/60.**

## Where the skill made the difference

Both arms found the correct root cause on all five bugs — the base model is
strong, and this library is small. The consistent deltas:

1. **Environment pinning (4/5 bugs):** every skill run pinned the exact
   library version (1.1.0), Node version, and OS, plus install/run steps
   (`npm i dotcfg@1.1.0`). Base runs said "current `main`" and omitted the
   library version on B1–B4.
2. **Executed falsification (B2, B4):** skill runs showed the negative case
   *run with output* (`interpolate: false` verbatim result; "removing the
   stray quote makes both keys parse — verified"). Base runs claimed the
   condition but didn't demonstrate it.
3. **Duplicate search:** every skill issue included a "Related issues"
   section listing the search terms used. No base issue did.
4. **Test-gap analysis:** skill runs on B4/B5 noted *why* the suite passes
   (multiline test only covers values starting with `"`; no escape-expansion
   test) — directly useful for the fixing PR.

## Caveats

- Same underlying model in both arms; deltas measure the skill, not the model,
  but a weaker model would likely show a larger gap.
- Grader (me) authored the bugs — knows the answers; scores on repro/falsify/
  env are mostly objective (present/absent/executed), root-cause less so.
- n=1 per cell. Rerun for variance before quoting numbers publicly.
- dotcfg is ~150 lines; real-repo advantages (bisection across git history,
  duplicate search against a live tracker) are under-tested here.
