# Bug Report Template

Use when the target project has no issue template. Fill every section; delete none.

```markdown
## Summary

<!-- One sentence: symptom + trigger. Same content as the title, slightly expanded. -->

## Reproduction

<!-- Link to minimal repro repo/sandbox, or inline the full code if it fits in one file. -->

Steps:
1. `git clone <repro-url> && cd repro`
2. `npm ci`
3. `node repro.js`

## Expected behavior

<!-- What should happen, per the docs or reasonable expectation. Cite docs if possible. -->

## Actual behavior

<!-- What happens instead. Include the full error output / stack trace in a code block. -->

## Environment

- <library>: x.y.z (exact, from lockfile)
- Runtime: node x.y.z / python x.y.z
- OS: macOS 15.x / Ubuntu 24.04 / Windows 11
- Last known good version (if bisected): x.y.z

## Likely cause (optional)

<!-- Only if actually traced. File path + line numbers in the library source,
     what goes wrong, and a suggested fix if obvious. Offer a PR if willing. -->

## Related issues

<!-- Links to similar/closed issues found during duplicate search, and why this is different. -->
```

## Title guidance

- Format: `<symptom> when <trigger>` — include the function/API name and version.
- Good: `` `parseConfig` throws TypeError when env value contains `=` (v3.2.1) ``
- Bad: `config broken`, `bug in parser`, `URGENT: doesn't work`
