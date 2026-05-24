# CLOSURE BRIEF - slice-02: JSON export contract and machine output

## Summary

Implemented the v27 machine-readable lifecycle export contract.

`ai export --format json` now emits schema v2 lifecycle data with source metadata, warnings, approvals, blockers, evidence, next steps, lifecycle details, aggregates, and canonical statuses while preserving existing fields for compatibility.

## Validation Against Acceptance Criteria

- `ai export --format json` emits parseable JSON only on stdout.
- Successful JSON export keeps stderr empty.
- Unsupported formats fail non-zero and write the actionable error to stderr.
- Completed slices are exported when `--include-completed` is used.
- Export includes source metadata, warnings, aggregates, approvals, blockers, evidence, next steps, lifecycle, specs, slices, agents, and runs.
- Arrays used by specs, slices, evidence, and resolver-backed state remain deterministically ordered by existing resolver ordering.

## Changes

- Updated `src/create-quiver/lib/ai/export-state.js`.
- Updated `tests/lib/ai-export-state.test.js`.
- Updated `tests/commands/ai-export.test.js`.
- Updated v27 spec status, execution plan, evidence, and this closure brief.

## Remaining Risks

- The export contract is additive, but downstream users that hard-code `schema_version: 1` will need to accept schema v2.
- The schema is asserted by tests, but there is not yet a separate JSON Schema artifact; that can be added in a later hardening slice if needed.
- Some approval and evidence fields may remain empty in projects that have not used the AI lifecycle yet.

## Follow-up Recommendations

- Execute `slice-03-approved-plan-to-spec-create` next because it depends on stable resolver/export behavior.
- Keep any future export changes additive unless a new schema version and migration note are explicitly added.
