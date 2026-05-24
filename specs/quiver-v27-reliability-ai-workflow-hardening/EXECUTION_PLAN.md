# Execution Plan - Quiver v27

## Wave 0 - Required Foundation

1. `slice-00-docs-audit-coverage-and-contracts` - completed
   - Must run first.
   - Audits docs/code/tests against Pixel Quiver evidence.
   - Defines the contracts that prevent partial fixes.

## Wave 1 - Shared Model

Run sequentially:

1. `slice-01-core-state-resolver-and-canonical-statuses` - completed

This slice owns the state model used by later command fixes.

## Wave 2 - Export and Spec Generation

Run after Wave 1. Prefer sequential order:

1. `slice-02-json-export-contract-and-machine-output` - completed
2. `slice-03-approved-plan-to-spec-create` - completed

These touch shared AI/spec data contracts and should not run in parallel unless file scopes are proven independent.

## Wave 3 - AI Artifacts and Worktrees

Can run in parallel after Wave 1 if write scopes do not overlap:

1. `slice-04-ai-artifact-storage-redaction-and-token-compaction` - completed
2. `slice-05-worktree-lifecycle-locks-and-recovery` - completed

Status: Wave 3 is complete.

## Wave 4 - Validation Gates

Run after Wave 3:

1. `slice-06-validation-gates-and-scope-safety` - completed

Status: Wave 4 is complete.

## Wave 5 - Context and DX

Run after Wave 4:

1. `slice-07-context-analysis-and-doctor-flow` - completed
2. `slice-08-cross-platform-help-auth-and-dx` - completed

`slice-08` depends on `slice-07` because help/auth guidance should reference the hardened diagnostics contract.

Status: Wave 5 is complete.

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
