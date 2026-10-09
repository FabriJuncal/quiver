# Execution Brief: supervised temporary workspace

## Context

Human continuation authorizes local implementation and validation only. Base main:
`1c47ccdd1ed0f126024163895c4d6ac986e515f2`, after human merges of #148/#150/#151.
Existing checkouts remain untouched. No new publication or security changes.

## Objective

Read and validate actual base bytes, review an exact patch and apply only to a
new temporary directory after host-owned authorization bound to that review.

## Acceptance Criteria

SW-01 through SW-07 in slice.json. Keep the pure planner unchanged. No arbitrary
command execution or claims of project-test success from byte readback.

## Completion Checklist

- [x] Implement bounded adapter and adversarial tests
- [x] Complete final focused, documentation, schema, spec and package gates
- [x] Record limitations and final evidence
- [ ] Obtain separate publication approval for this new slice
