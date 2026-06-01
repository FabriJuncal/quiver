## Title

Modernize Quiver CLI surface, loop-closure commands, AI modules, and parser readiness

## Summary

- Adds the v46-v49 CLI modernization specs and closure evidence.
- Improves CLI command surface, localized errors, namespace aliases, status/evidence/changelog/demo flows, AI command modularization, and parser modernization.
- Introduces parser contract tests, a command registry, and a parser adapter while preserving existing invocation behavior.
- Annotates global help option ownership with `scope` and documents that v49 does not generate shell completions.

## Scope

- CLI UX/DX hardening for read-only and write commands.
- Slice and handoff namespace compatibility with legacy aliases preserved.
- Loop-closure commands: `status`, `evidence list/show`, `changelog`, demo alias, and config contract docs.
- AI command modularization and compatibility aliases.
- Parser inventory, golden tests, internal registry decision, adapter boundary, help scoping, and release-readiness evidence.

## Files

- `specs/quiver-v46-cli-surface-ergonomics/**`
- `specs/quiver-v47-cli-loop-closure-commands/**`
- `specs/quiver-v48-ai-command-modularization/**`
- `specs/quiver-v49-parser-modernization/**`
- `src/create-quiver/index.js`
- `src/create-quiver/commands/**`
- `src/create-quiver/lib/cli/command-registry.js`
- `src/create-quiver/lib/cli/parser.js`
- `src/create-quiver/lib/i18n/messages/**`
- `docs/**`
- `tests/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js compatible with the current Quiver test suite.
- npm available.
- `gh` installed and authenticated.
- SSH host alias: `github-personal`.
- Identity file: `~/ssh/github-personal`.

### Worktree Access

- Branch: `feature/QUIVER-46-49-cli-modernization`
- Base: `main`
- Remote: `origin` (`git@github-personal:FabriJuncal/quiver.git`)

### Run the Project

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js version --json
node bin/create-quiver.js status --json
```

### Use Cases

- Verify legacy namespace aliases still work and warn only on `stderr` in human mode.
- Verify `--lang` works before and after command names.
- Verify `--version` and `-V` still print semver-only output at root.
- Verify `evidence run -- <command>` passes command flags through after `--`.
- Verify global help annotates scoped flags with `[scope: ...]`.
- Verify no docs claim shell completion support in v49.

### Technical Verification

```bash
node --test tests/commands/parser-contract.test.js
node --test tests/commands/cli-contract.test.js
node --test
npm run package:quiver
bash scripts/ci/smoke-create-quiver.sh
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics
node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands
node bin/create-quiver.js spec validate specs/quiver-v48-ai-command-modularization
node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization
```

## Evidence

- `node --test`: passed, 665 tests.
- `npm run package:quiver`: passed, `Package smoke passed: create-quiver-0.15.4.tgz`.
- `bash scripts/ci/smoke-create-quiver.sh`: passed, `create-quiver smoke test passed`.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`: passed.

## Rollback

- Revert this PR commit to restore the previous CLI parser/help/module structure.
- No external parser dependency was added, so rollback does not require lockfile or package dependency cleanup.
- Compatibility aliases are preserved by this PR; rollback should only be needed if a downstream CLI contract regression is found.

## Risks / Notes

- This PR intentionally groups v46-v49 because the current local changes are sequential and interdependent.
- `develop` is behind `main`; this PR targets `main` to avoid including historical `main` changes in the diff.
- Three local files were intentionally excluded from the PR: `CLI_ANALYSIS.md`, `auditoria-ux-ui-performance-documentacion.md`, and `copys-landing-page.md`.
