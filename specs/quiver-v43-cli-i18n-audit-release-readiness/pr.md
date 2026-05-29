## Title

QUIVER-43: CLI i18n audit and release readiness

## Summary

- Completes the final audit stage for Quiver CLI English/Spanish support.
- Adds a documented command x language x mode matrix, closes remaining public string gaps, reinforces cross-platform i18n smokes, and records package release-readiness evidence.
- Confirms human output follows configured language while JSON/JSONL, commands, flags, paths, ids, providers, and models stay stable for automation.

## Scope

Included:

- v43 command coverage matrix for every documented command.
- Public human string audit and fixes for remaining catalog bypasses.
- Cross-platform smoke coverage for configured language, `--lang`, `QUIVER_LANG`, JSON parseability, and paths with spaces.
- Final package/readiness validation and release-note language summary.

Excluded:

- npm publication.
- Live provider credential tests.
- Translating machine-readable JSON/JSONL contracts or provider prompts.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/lib/ai/executor.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `src/create-quiver/lib/lifecycle.js`
- `scripts/ci/smoke-cross-platform.js`
- `scripts/ci/smoke-create-quiver.sh`
- `tests/commands/i18n-audit-matrix.test.js`
- `tests/lib/ai-executor.test.js`
- `tests/lib/lifecycle.test.js`
- `docs/reference/commands.md`
- `specs/quiver-v43-cli-i18n-audit-release-readiness/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available in PATH.
- Git available in PATH.
- No live AI provider credentials are required.
- Optional for PR creation only: `gh` authenticated and SSH key available.

### Worktree Access

```bash
cd "/Users/fabrijk/Documents/Work/Proyectos Personales/nika/frameworks/quiver-v43"
git status --short --branch
```

Expected:

- Branch is `feature/QUIVER-43-01-v43-command-language-mode-matrix`.
- Working tree is clean after this PR commit.

### Run the Project

The CLI is exercised directly from the repository:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js version --json
node bin/create-quiver.js dashboard --lang es --limit 1
```

Expected:

- Help and dashboard render human text in the selected language.
- `version --json` prints parseable JSON and keeps machine fields stable.

### Use Cases

1. Verify the i18n audit matrix stays synchronized with documented commands:

   ```bash
   node --test tests/commands/i18n-audit-matrix.test.js
   ```

2. Verify public string fixes for executor and lifecycle output:

   ```bash
   node --test tests/lib/lifecycle.test.js tests/lib/i18n-catalog.test.js tests/lib/ai-executor.test.js tests/commands/ai-execute-slice.test.js
   ```

3. Verify cross-platform i18n smoke behavior:

   ```bash
   node scripts/ci/smoke-cross-platform.js
   npm run smoke:create-quiver
   ```

4. Verify final package readiness:

   ```bash
   npm run package:quiver
   npm pack --dry-run --json
   ```

### Technical Verification

Run the full gate:

```bash
node --test tests/**/*.test.js
node bin/create-quiver.js spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict
npm run package:quiver
npm run smoke:create-quiver
npm pack --dry-run --json
git diff --check
```

Expected:

- Full tests pass.
- Spec validation passes.
- Package smoke passes.
- `npm pack --dry-run --json` exits 0 and reports `create-quiver@0.15.3`.
- `git diff --check` has no output.

## Evidence

- PASS `node --test tests/**/*.test.js` (612 passed)
- PASS `node bin/create-quiver.js spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict`
- PASS `npm run package:quiver`
- PASS `npm run smoke:create-quiver`
- PASS `npm pack --dry-run --json`
- PASS `git diff --check`
- PASS `node scripts/ci/smoke-cross-platform.js`
- PASS `node bin/create-quiver.js check-slice specs/quiver-v43-cli-i18n-audit-release-readiness/slices/slice-04-package-release-readiness/slice.json --local`

## Rollback

Revert the PR commits in reverse order:

```bash
git revert 68b55e9 008aefd fe89318 1150bed
```

Rollback impact:

- Removes v43 audit evidence and test additions.
- Restores previous executor/lifecycle human output behavior.
- Removes i18n-specific cross-platform smoke additions.

## Risks / Notes

- Linux and Windows shell execution were documented as approved local-environment exceptions because Docker daemon and `pwsh` were unavailable locally; win32 and Git Bash path behavior is covered by automated tests and reproducible smoke commands are recorded in the spec.
- JSON/JSONL and other machine-readable tokens intentionally remain in stable technical English.
- This PR does not publish to npm.
