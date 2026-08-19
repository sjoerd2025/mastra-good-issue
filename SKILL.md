---
name: good-issue
description: Guide the user's agent to write a high-quality, contribution-ready GitHub issue for an OSS project — with a verified minimal reproduction, environment details, and root-cause investigation. Use when the user hits a bug in a dependency, wants to file an issue upstream, or asks to report a problem to an open-source project.
---

# good-issue

## Philosophy

The best way to support OSS is to write good issues. A shining issue does the
maintainer's triage work for them: it is actionable in one read, has a
**verified minimal reproduction**, and ideally points at the root cause.
Issue creators who do this well become de-facto co-contributors.

Your job as the agent: don't just transcribe the user's complaint — **investigate
it**. Reproduce the bug yourself, minimize it, and dig into the dependency's
source before writing a word of the issue.

## Workflow

### 1. Understand the problem
- Get the exact failing behavior from the user: what they did, what happened,
  what they expected.
- Identify the target project and collect versions: the library, the runtime
  (node/python/etc.), OS, and package manager. Read the user's lockfile to get
  *exact* resolved versions — never trust semver ranges.

### 2. Check for duplicates (mandatory)
- Search the project's existing issues (open AND closed) for the error message,
  symptom keywords, and related function names.
- If a duplicate exists: don't file. Instead, offer to add a 👍 + a comment with
  the user's repro/environment if it adds new signal.
- Also check the project's CHANGELOG/releases — the bug may already be fixed in
  a newer version. Try upgrading first.

### 3. Build a minimal reproduction (the core of this skill)
- Start from the user's failing code and **cut aggressively**: remove every
  dependency, config option, and line that isn't required to trigger the bug.
- Target: a single file or a tiny repo scaffold (`npm init`-level) that fails
  with one command.
- **Actually run it.** A repro you haven't executed is a hypothesis, not a repro.
  Confirm it fails for the stated reason, and confirm it passes when the
  suspected trigger is removed (falsifiability check).
- If the bug is version-specific, bisect: find the last good and first bad
  version and say so in the issue.
- See `references/repro-checklist.md` for the full quality bar.

### 4. Investigate root cause (best effort)
- Read the dependency's source in `node_modules` (or clone it). Follow the
  stack trace to the responsible function.
- If you can identify the faulty line(s), include a "Likely cause" section with
  file paths and line numbers, and — if obvious — a suggested fix or PR offer.
- Don't guess. If you're not sure, say "I traced it as far as X" rather than
  asserting a wrong cause.

### 5. Write the issue
- Follow the project's issue template if one exists (`.github/ISSUE_TEMPLATE/`).
  Fill every field; never leave template placeholders in.
- Otherwise use `references/bug-report.md` or `references/feature-request.md`.
- Title format: symptom + trigger, searchable. E.g.
  `` `parseConfig` throws TypeError when env value contains `=` (v3.2.1) ``
- One issue per issue. If you found two bugs, write two issues.

### 6. Review with the user, then file
- Show the user the final draft and the repro before submitting anything.
- Offer to file via `gh issue create` and, if the repro warrants it, push the
  repro to a public repo (StackBlitz/CodeSandbox link or a minimal GitHub repo)
  with the user's approval. Never publish anything containing user secrets,
  private code, or internal URLs — scrub the repro.

## Quality bar (all must be true before filing)

- [ ] Repro executed and confirmed failing by the agent, not just the user
- [ ] Repro is minimal — nothing can be removed without the bug disappearing
- [ ] Exact versions listed (library, runtime, OS)
- [ ] Expected vs. actual behavior stated explicitly
- [ ] Duplicate search done (link related issues if any)
- [ ] Title is searchable and specific
- [ ] No secrets or private code in the issue or repro
