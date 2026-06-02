# Execution Plan - Quiver v51 CLI Ergonomics and Automation Contracts

## Order

1. Execute `slice-00-cli-contract-baseline`.
2. Execute `slice-01-flow-json-compatibility`.
3. Execute `slice-02-dashboard-section-validation-i18n`.
4. Execute `slice-03-base-branch-resolution-policy`.
5. Execute `slice-04-next-plan-graph-ux-edge-cases`.
6. Execute `slice-05-evidence-robustness-path-safety`.
7. Execute `slice-06-namespace-compatibility-windows-scripts`.

## Parallel Execution

- `slice-01`, `slice-02`, `slice-04`, and `slice-05` can run in parallel after `slice-00` if they coordinate i18n catalog changes.
- `slice-03` should be isolated because it touches shared Git/base behavior.
- `slice-06` should run after or alongside CI hardening from v50 when Windows `pwsh` evidence is available.

## Risk Controls

- Preserve existing JSON fields.
- Validate stdout/stderr separation for every warning and JSON change.
- Add tests before or with behavior changes.
- Close already-implemented findings with evidence instead of refactor.

## Required Final Validation

- `node --test`
- `node bin/create-quiver.js --help`
- Windows `pwsh` CI evidence or documented blocker
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`
