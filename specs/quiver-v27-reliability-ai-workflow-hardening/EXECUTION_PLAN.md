# Execution Plan - Quiver v27

## Wave 0 - Required Foundation

1. `slice-00-docs-audit-coverage-and-contracts` - completed
   - Must run first.
   - Audits docs/code/tests against Pixel Quiver evidence.
   - Defines the contracts that prevent partial fixes.

## Wave 1 - Shared Model

Run sequentially:

1. `slice-01-core-state-resolver-and-canonical-statuses` - next

This slice owns the state model used by later command fixes.

## Wave 2 - Export and Spec Generation

Run after Wave 1. Prefer sequential order:

1. `slice-02-json-export-contract-and-machine-output`
2. `slice-03-approved-plan-to-spec-create`

These touch shared AI/spec data contracts and should not run in parallel unless file scopes are proven independent.

## Wave 3 - AI Artifacts and Worktrees

Can run in parallel after Wave 1 if write scopes do not overlap:

1. `slice-04-ai-artifact-storage-redaction-and-token-compaction`
2. `slice-05-worktree-lifecycle-locks-and-recovery`

## Wave 4 - Validation Gates

Run after Wave 3:

1. `slice-06-validation-gates-and-scope-safety`

This slice depends on the resolver and worktree decisions.

## Wave 5 - Context and DX

Run after Wave 4:

1. `slice-07-context-analysis-and-doctor-flow`
2. `slice-08-cross-platform-help-auth-and-dx`

`slice-08` depends on `slice-07` because help/auth guidance should reference the hardened diagnostics contract.

## Wave 6 - Final Readiness

Run last:

1. `slice-09-fixtures-smoke-docs-and-release-readiness`

This slice validates the whole package from source and tarball.

## Parallel Safety Notes

- Keep one commit per slice.
- Do not run slices in parallel when `allowed_write_paths` overlap.
- `slice-00`, `slice-01`, `slice-02`, `slice-03`, `slice-06`, and `slice-09` are sequential checkpoints.
- `slice-04` and `slice-05` are the main candidates for parallel execution after `slice-01`.
- Do not publish npm from this spec.
