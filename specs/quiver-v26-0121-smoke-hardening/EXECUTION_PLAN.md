# Execution Plan - Quiver v26

## Wave 0 - Required Foundation

1. `slice-00-docs-foundation`
   - Must land first.
   - Publishes the spec, slices, briefs, PR body, execution plan, and source-of-truth sync.

## Wave 1 - CLI Discovery Contract

Run sequentially:

1. `slice-01-cli-help-version-contract`

This slice owns the command surface that later guidance and smoke tests depend on.

## Wave 2 - Guidance and AI State

Can run in parallel after Wave 1 only if write scopes do not overlap:

1. `slice-02-init-doc-links-and-flow-guidance`
2. `slice-03-ai-approval-review-consistency`

If both need to modify shared help/flow code, run them sequentially in the listed order.

## Wave 3 - Validation and Demo

Run after Wave 2:

1. `slice-04-local-validation-brief-contracts`
2. `slice-05-demo-scaffold-readiness`

These can run in parallel only if `slice-05` does not need changes in shared validation helpers touched by `slice-04`.

## Wave 4 - Plan/Graph Scope Performance

Run after Wave 3:

1. `slice-06-plan-graph-scope-performance`

This slice must prove that scoped `plan` and `graph` commands do not scan or retain unrelated historical specs in a way that can OOM.

## Wave 5 - Release Readiness

Run last:

1. `slice-07-smoke-release-readiness`

This slice validates the full package, prepares version metadata, records evidence, and confirms the candidate flow before publication.

## Parallel Safety Notes

- `slice-00` must be committed before implementation slices.
- Keep one commit per slice.
- Do not run slices in parallel if `allowed_write_paths` overlap.
- Prefer focused tests during each slice and full smokes in `slice-06`.
- Do not publish npm from any slice except the post-merge release step.
