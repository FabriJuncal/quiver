# Execution Plan - Quiver v24

## Wave 0 - Required Foundation

1. `slice-00-spec-foundation`
   - Must land before implementation.
   - Publishes spec, slices, handoffs, execution plan, PR body, and source-of-truth sync.

## Wave 1 - Low-Level Contract Fixes

These can run after `slice-00` and can be parallel if write scopes stay separate:

1. `slice-01-init-template-hygiene`
2. `slice-02-cli-command-routing-version-errors`
3. `slice-07-analyzer-command-map-hardening`

## Wave 2 - Validation and Context Commands

These depend on Wave 1 contracts:

1. `slice-03-doctor-fix-doc-link-checks`
2. `slice-04-prepare-output-ai-context-drafts`
3. `slice-05-local-slice-validation-base-guidance`

## Wave 3 - Planning History and Evidence

1. `slice-06-plan-graph-next-history-views`
2. `slice-08-evidence-run-command`

## Wave 4 - Demo Experience

1. `slice-09-spec-viewer-demo-scaffolding`

## Wave 5 - Release Readiness

1. `slice-10-docs-smokes-release-readiness`

## Parallel Safety Notes

- Do not run two slices in parallel if both modify `src/create-quiver/index.js`.
- Prefer one commit per slice.
- Run `node --test` for touched command/lib areas before marking a slice complete.
- Run package safety and smoke tests only in the final slice unless an earlier slice changes packaging behavior.
