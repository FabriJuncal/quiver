## Title

Quiver v40 - CLI i18n for spec and slice workflow commands

## Summary

- Localizes `spec create/start/status/validate/close`, slice lifecycle gates, handoff validation, `check-slice`, `check-pr`, `check-scope`, and `ai execute-slice` wrapper output for `en` and `es`.
- Preserves generated spec artifacts, JSON contracts, provider prompts, command snippets, paths, ids, statuses, and branch/model/provider identifiers.
- Closes the v40 spec with full test, package, smoke, and strict spec validation evidence.

## Scope

- In scope: human-facing wrappers and reports for spec/slice workflow commands covered by `specs/quiver-v40-cli-i18n-spec-slice-workflows`.
- Out of scope: generated template localization, provider prompt translation, model/provider access behavior, and unrelated v44 TUI work.

## Files

- `src/create-quiver/commands/spec.js`
- `src/create-quiver/lib/spec-worktrees.js`
- `src/create-quiver/lib/handoff.js`
- `src/create-quiver/lib/lifecycle.js`
- `src/create-quiver/lib/readiness.js`
- `src/create-quiver/lib/ai/executor.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `src/create-quiver/index.js`
- `tests/**`
- `scripts/ci/smoke-create-quiver.sh`
- `scripts/ci/smoke-cross-platform.js`
- `scripts/ci/smoke-tiered-pack.sh`
- `specs/quiver-v40-cli-i18n-spec-slice-workflows/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js 22+
- npm
- Git CLI available

### Worktree Access

- Worktree: `quiver-v40`
- Branch: `feature/QUIVER-40-01-v40-spec-create-start-status`

### Run the Project

```bash
node bin/create-quiver.js --help
```

### Use Cases

#### Case 1: Spec workflow command localization

Run `spec create`, `spec start`, `spec status`, `spec validate`, and `spec close` paths in `en` and `es`; verify human labels change while paths, commands, ids, and JSON stay stable.

#### Case 2: Slice lifecycle and handoff localization

Run `start-slice`, `check-slice`, `check-pr`, `check-handoff`, and `ai execute-slice --dry-run`; verify wrappers localize while `ai prompt-slice` remains prompt-only.

### Technical Verification

```bash
node --test tests/**/*.test.js
node bin/create-quiver.js spec validate specs/quiver-v40-cli-i18n-spec-slice-workflows --strict
npm run package:quiver
npm run smoke:create-quiver
node scripts/ci/smoke-cross-platform.js
bash scripts/ci/smoke-tiered-pack.sh
git diff --check
```

## Evidence

- `node --test tests/**/*.test.js` passed: 587 tests.
- `node bin/create-quiver.js spec validate specs/quiver-v40-cli-i18n-spec-slice-workflows --strict` passed.
- `npm run package:quiver` passed and produced `create-quiver-0.15.3.tgz`.
- `npm run smoke:create-quiver` passed.
- `node scripts/ci/smoke-cross-platform.js` passed.
- `bash scripts/ci/smoke-tiered-pack.sh` passed.
- `git diff --check` passed.

## Rollback

```bash
git revert --no-commit origin/main..HEAD
git commit -m "revert: Quiver v40 CLI i18n workflow commands"
```

## Risks / Notes

- `ai prompt-slice` intentionally remains payload-only to avoid polluting provider/executor prompt content.
- Smokes now set `QUIVER_LANG=es` explicitly where they assert Spanish workflow wrapper output.
