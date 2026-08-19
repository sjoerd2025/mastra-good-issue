# good-issue

An agent skill for writing **shining, contribution-ready OSS issues** — with verified minimal reproductions, pinned environments, and root-cause investigation.

> the best way to support OSS is to write good issues! have your agent make good reproductions.
>
> This is the new contribution model.

## Why

Maintainers have 500 open issues and 20 minutes. Issues that are actionable in one read get fixed; issues that require a back-and-forth interrogation get a `needs-more-info` label and die.

Most agents, asked to "file an issue," will draft plausible-sounding text **without executing anything**. This skill flips that: the agent must *investigate* — reproduce the bug itself, minimize the repro by deletion, pin exact versions from the lockfile, search for duplicates, and trace the root cause in the dependency's source before writing a word.

## What the agent does

1. **Understand** — capture symptom, expected vs. actual, and exact resolved versions (from the lockfile, not semver ranges)
2. **Check for duplicates** — search open *and* closed issues, plus the changelog (the fix may already be released)
3. **Build a minimal reproduction** — cut aggressively, then *actually run it*. A repro must fail with the trigger and pass without it
4. **Investigate root cause** — follow the stack trace into the library's source; include file/line refs and a suggested fix when found
5. **Write the issue** — using the project's own template, or the fallback templates in [`references/`](references/)
6. **Review with the user, then file** — via `gh issue create`, with secrets and private code scrubbed

The full quality bar is in [`SKILL.md`](SKILL.md) and [`references/repro-checklist.md`](references/repro-checklist.md).

## Install

Copy this directory into any supported skills path:

```bash
# Global (all projects)
git clone https://github.com/mastra-ai/good-issue ~/.agents/skills/good-issue

# Or per-project
git clone https://github.com/mastra-ai/good-issue .agents/skills/good-issue
```

Also works in `~/.claude/skills/` and `.claude/skills/` for Claude Code.

## Use

Just describe the problem — the skill activates on phrases like:

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
