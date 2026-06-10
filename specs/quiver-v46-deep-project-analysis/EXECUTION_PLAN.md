# Execution Plan - Quiver v46 Deep Project Analysis

## Order

1. `slice-00-analysis-contract-foundation`
2. `slice-01-stack-agnostic-discovery-sampling`
3. `slice-02-provider-analysis-json-contract`
4. `slice-03-doc-proposal-review-safe-writes`
5. `slice-04-validation-docs-release-readiness`

## Dependency Rules

- Do not implement provider execution before deterministic discovery and privacy preflight exist.
- Do not implement writes before schema validation and evidence validation exist.
- Do not document public usage as stable until dry-run, safety, write, and validation tests exist.

## Validation Gates

- Each slice must pass its own listed checks.
- Every JSON slice file must parse.
- `node bin/create-quiver.js spec validate specs/quiver-v46-deep-project-analysis --strict` should pass before closing the spec.

## Rollback

- Runtime changes should be reverted by slice-specific commits.
- Generated doc writes from the final feature must be recoverable from `.quiver/runs/run-.../snapshots/...` and manifest hashes.
