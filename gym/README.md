# good-issue gym

A test ground for evaluating issue-writing agents. Contains a small,
realistic TypeScript library with five deliberately planted bugs, five vague
user complaints, and a scoring rubric with ground-truth answers.

The point: "our skill makes agents write better issues" is a claim. This gym
turns it into a number.

## Layout

```
gym/
├── library/          # dotcfg 1.1.0 — the buggy library (do not fix the bugs!)
├── versions/
│   └── dotcfg-1.0.0/ # prior release, target for version bisection
├── complaints/       # 5 vague user reports; the only input the agent gets
├── answers/          # ground truth — never show to the agent under test
└── RUBRIC.md         # 6-dimension scoring, 12 points per bug
```

## The bugs

| Complaint | Tier | What it tests |
|---|---|---|
| 01 crash on startup | easy | basic reproduce-then-report |
| 02 values become "undefined" | medium | finding an option combination, one cause with two symptoms |
| 03 date off by one day | hard | environment pinning (timezone-dependent) |
| 04 keys disappear randomly | nasty | falsifiability: naive trimming makes the bug vanish |
| 05 worked before upgrade | regression | version bisection against `versions/` |

## Running an eval

1. Start a fresh agent session. Provide one complaint from `complaints/` and
   the `library/` source (plus `versions/` for complaint 05). Nothing from
   `answers/`.
2. Prompt: "Investigate this user complaint and produce a GitHub issue ready
   to file upstream."
3. Score the resulting issue with `RUBRIC.md` against `answers/ANSWERS.md`.
4. Repeat with and without the good-issue skill loaded; compare totals.

The library's own test suite passes (`cd library && npm test`) — the bugs
live in the gaps, like real coverage holes.

## Rules for the agent under test

- It may read, run, and instrument anything in `library/` and `versions/`
- It may not read `answers/` or this README's bug table
- The complaint text is all the "user" ever says; no follow-up questions
