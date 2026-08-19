# good-issue

An agent skill for writing contribution-ready OSS issues. Verified minimal reproductions, pinned environments, root cause investigation.

## Why

Maintainers have 500 open issues and 20 minutes. Issues that are actionable in one read get fixed. Issues that need a round of follow-up questions get a `needs-more-info` label and die.

Ask most agents to "file an issue" and they'll draft plausible-sounding text without running anything. This skill makes the agent do the work first: reproduce the bug itself, cut the repro down until every line matters, pin exact versions from the lockfile, search for duplicates, and read the library source before writing a word.

## What the agent does

1. Capture the symptom, expected vs. actual behavior, and exact resolved versions (from the lockfile, not semver ranges)
2. Search open and closed issues for duplicates, and check the changelog in case the fix already shipped
3. Build a minimal reproduction and actually run it. It has to fail with the trigger and pass without it
4. Follow the stack trace into the library source and include file/line refs, plus a suggested fix when there is one
5. Write the issue using the project's own template, or the fallbacks in [`references/`](references/)
6. Show you the draft, then file it with `gh issue create`. Secrets and private code get scrubbed first

The full quality bar is in [`SKILL.md`](SKILL.md) and [`references/repro-checklist.md`](references/repro-checklist.md).

## Install

Clone into any supported skills path:

```bash
# Global (all projects)
git clone https://github.com/mastra-ai/good-issue ~/.agents/skills/good-issue

# Or per-project
git clone https://github.com/mastra-ai/good-issue .agents/skills/good-issue
```

Also works in `~/.claude/skills/` and `.claude/skills/` for Claude Code.

## Use

Just describe the problem. The skill kicks in on things like:

- "this npm package is throwing an error, can you report it?"
- "I think I found a bug in `<library>`, file an issue upstream"
- "help me write a good issue for this"

## Structure

```
good-issue/
├── SKILL.md                       # workflow + quality bar
└── references/
    ├── repro-checklist.md         # minimal / verified / pinned / safe-to-publish
    ├── bug-report.md              # fallback bug template + title guidance
    └── feature-request.md         # problem-first feature template
```

## License

MIT
