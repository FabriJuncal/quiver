# CLOSURE BRIEF - slice-05: Approval gates and planner iterations

## Summary of Work

Implemented versioned planner approval gates for acceptance and technical-plan phases. `ai revise` now creates a new draft version from human feedback without approving or advancing the phase, while `ai approve` requires an explicit current draft version. Technical-plan approval now requires a production-readiness review for the current draft before spec generation can proceed.

## Validation Against Acceptance Criteria

- [x] Criteria revision flow verified.
- [x] Criteria approval verified.
- [x] Plan revision flow verified.
- [x] Plan approval verified.
- [x] Premature spec generation blocked.

## Relevant Changes

- Added `npx create-quiver ai revise`.
- Changed `ai approve` to approve saved draft versions only with `--version <n>`.
- Blocked approval of missing or non-current draft versions.
- Required current production-readiness review before technical-plan approval.
- Updated flow guidance, README, generated docs, init templates, and command reference.
- Added regression tests for revise, approval versioning, stale review blocking, and spec generation gates.

## Pending

None for this slice.

## Remaining Risks

- Technical-plan review checks are local state based; external provider quality still depends on the configured reviewer prompt and model.

## Future Recommendations

- Keep approval messages concise and cite the approved draft version.
