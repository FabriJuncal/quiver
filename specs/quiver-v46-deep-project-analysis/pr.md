# Quiver v46 - Deep Project Analysis

## Title

Implement production-safe `ai analyze-project`

## Summary

This PR adds a new `ai analyze-project` workflow that can inspect an existing repository, build a bounded evidence sample, run optional provider-backed analysis, and turn validated results into reviewed documentation updates.

The safe default is read-only: `--dry-run` reports what Quiver would read, why each file was selected or omitted, the applied budgets, and security exclusions without calling a provider or writing files.

## Scope

- Adds `ai analyze-project` CLI routing, help text, analysis flags, human output, and JSON output.
- Adds stack-agnostic discovery and semantic sampling for source, tests, DB/schema, configs, docs, monorepos, unknown stacks, symlinks, binaries, secrets, caches, dependencies, and build outputs.
- Adds provider-backed JSON analysis with schema validation, evidence validation, confidence levels, truncation downgrade rules, prompt redaction, and no-write failure paths.
- Adds review/edit/final-diff/confirm flow for approved documentation updates only.
- Adds safe writes with managed blocks, snapshots, manifests, before/after hashes, restore hints, and redacted raw artifacts.
- Adds post-write validation for schema, evidence paths, placeholders, managed blocks, snapshot manifests, and deterministic doc conflicts with `--strict`.
- Updates README, command reference, CLI UX guide, AI guidance, fixture matrix, i18n command matrix, and package ignore rules.

## Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/ai/analyze-project-*.js`
- `tests/commands/ai-analyze-project*.test.js`
- `tests/lib/ai-analyze-project*.test.js`
- `tests/fixtures/ai-analyze-project/matrix.json`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `README.md`
- `README_FOR_AI.md`
- `.npmignore`
- `specs/quiver-v46-deep-project-analysis/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- GitHub CLI available for PR creation.
- Authenticated `gh` session.
- SSH host alias: `github-personal`.
- Identity file: `~/ssh/github-personal`.

### Worktree Access

From the repository root:

```bash
git status --short --branch
git remote -v
```

Expected remote shape:

```text
origin git@github-personal:FabriJuncal/quiver.git
```

### Run the Project

No dev server is required. This is a CLI feature.

### Use Cases

1. Preview analysis without writes:

```bash
node bin/create-quiver.js ai analyze-project --deep --dry-run
node bin/create-quiver.js ai analyze-project --deep --dry-run --json
```

2. Run provider-backed analysis in tests through fake providers:

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
```

3. Validate review and safe-write behavior:

```bash
node --test tests/commands/ai-analyze-project-review.test.js tests/lib/ai-analyze-project-validation.test.js
```

### Technical Verification

Commands run:

```bash
node --test tests/docs/command-reference.test.js tests/commands/cli-contract.test.js tests/commands/i18n-audit-matrix.test.js tests/commands/parser-contract.test.js
# pass: 22 tests

node --test tests/commands/cli-contract.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/ai-analyze-project-validation.test.js tests/lib/ai-analyze-project-discovery.test.js tests/commands/ai-analyze-project-review.test.js tests/commands/ai-analyze-project-provider.test.js tests/lib/ai-analyze-project-parser.test.js tests/lib/ai-analyze-project-schema.test.js
# pass: 41 tests

node --test
# pass: 686 tests

npm run smoke:create-quiver
# pass: create-quiver smoke test passed

npm run package:quiver
# pass: Package smoke passed: create-quiver-0.16.0.tgz

node bin/create-quiver.js spec validate specs/quiver-v46-deep-project-analysis --strict
# pass: spec validation passed

git diff --check
# pass
```

## Evidence

- `specs/quiver-v46-deep-project-analysis/EVIDENCE_REPORT.md`
- `specs/quiver-v46-deep-project-analysis/STATUS.md`
- `specs/quiver-v46-deep-project-analysis/slices/*/CLOSURE_BRIEF.md`
- `tests/fixtures/ai-analyze-project/matrix.json`

## Rollback

Revert the PR commit. The feature is additive and isolated behind the new `ai analyze-project` command path. Runtime doc writes created by the command include snapshots and restore hints under `.quiver/runs/<run-id>/snapshots/`.

## Risks / Notes

- `ai analyze-project` human output is currently English-only; JSON output is stable. This is recorded as an accepted i18n follow-up in the v43 command matrix.
- Stack-specific adapters such as Rails, Django, Laravel, NestJS, Spring, and mobile are deferred. Generic heuristics remain the fallback and keep the same schema.
- `--dry-run` intentionally never writes and never executes provider CLIs.
- `.quiver/` is excluded from npm packaging to avoid publishing local AI run state.
