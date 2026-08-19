# Minimal Reproduction Checklist

A repro is the single highest-leverage artifact in an issue. Hold it to this bar.

## Minimal
- [ ] Every line is load-bearing: removing any line makes the bug disappear
- [ ] No unrelated dependencies — only the target library + whatever is strictly
      required to trigger the bug
- [ ] No frameworks unless the bug is framework-specific
- [ ] Default config wherever possible; only non-default options that trigger the bug
- [ ] Fits in a single file if at all possible; a tiny repo otherwise

## Verified
- [ ] You (the agent) ran it and saw it fail
- [ ] The failure matches the user's original symptom (same error/behavior)
- [ ] Falsifiability: removing/changing the suspected trigger makes it pass
- [ ] Fresh-environment check: works from a clean install
      (`rm -rf node_modules && npm ci`, fresh venv, etc.)
- [ ] Runs with exactly one command, stated in the issue (e.g. `npm i && node repro.js`)

## Pinned
- [ ] Exact dependency versions (from lockfile, not semver ranges)
- [ ] Runtime version (`node -v`, `python --version`, ...)
- [ ] OS and arch if plausibly relevant
- [ ] If version-specific: last-good and first-bad versions identified

## Safe to publish
- [ ] No secrets, tokens, API keys, or credentials
- [ ] No private/internal URLs, hostnames, or proprietary code
- [ ] Placeholder data only (`example.com`, `user@example.com`, lorem values)

## Bisection tips
- Bisect library versions: install last-good/first-bad until you find the boundary,
  then check the changelog/commits between them — often finds the cause directly.
- Bisect the user's code: delete half, re-run, repeat. Faster than reasoning
  about what "should" matter.
