# Execution Plan - Quiver v47 CLI Loop Closure Commands

## Order

1. Execute `slice-00-loop-closure-foundation`.
2. Execute `slice-01-status-command`.
3. Execute `slice-02-evidence-list-show`.
4. Execute `slice-03-changelog-contract`.
5. Execute `slice-04-demo-spec-viewer-alias`.
6. Execute `slice-05-config-contract-decision`.
7. Execute `slice-06-docs-tests-release-readiness`.

## Risk Controls

- Keep all new commands read-only unless explicitly documented otherwise.
- Reject unsafe paths for evidence display.
- Preserve existing aliases and command paths.
- Avoid changing parser internals beyond the minimum routing needed.

## Required Final Validation

- `node --test`
- `npm run package:quiver`
- package-installed smoke for `status`, `evidence list/show`, `changelog`, and `demo spec-viewer`
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v47-cli-loop-closure-commands`
