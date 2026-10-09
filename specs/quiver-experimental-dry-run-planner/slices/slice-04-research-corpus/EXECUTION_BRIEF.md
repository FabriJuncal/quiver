# Execution Brief: bounded Research corpus

## Context

The Research planner has only an outline. This increment retrieves literal
occurrences from supplied text while preserving eligibility-only Core semantics.

## Objective

Implement the RC-01 through RC-07 criteria in slice.json.

## Scope

Use exactly the fifteen declared paths. Work from main 688ae68c; preserve merged PR152 unchanged. No new dependencies or modification to dry-run.js.

## Steps

Validate plan/binding and supplied bytes before literal comparisons. Return
source hashes and line locations by default, with explicit truncation and
provenance; verbatim text requires separate host opt-in.
Keep criteria unverified. Exercise authored local corpus and adversarial cases,
then the declared gates. Preserve logs outside the repository.

## Stop conditions

Do not acquire sources, invoke providers, execute supplied commands/code, publish
a PR, merge or deploy. A temporary directory is not an OS sandbox.

## Acceptance Criteria

- RC-01: Recompute the unchanged planner and require an exact binding, research.compare, prepare phase and low-risk eligible actions.
- RC-02: Verify the exact supplied source set, actual UTF-8 hashes and sizes before retrieval; reject hostile data and budget excess atomically.
- RC-03: Return deterministic case-sensitive literal line matches for every query/source pair in its authorized action, with source hashes and line citations.
- RC-04: Mark absent matches only as not-found-in-supplied-source; disclose bounded excerpts and total matching-line counts.
- RC-05: Preserve unverified criteria, false external execution/acceptance flags and explicit caller-supplied provenance; do not infer truth or semantic support.
- RC-06: Keep Core unchanged and acquire no filesystem, network, process, provider, model or caller callbacks in the library.
- RC-07: Demonstrate actual retrieval from two authored corpus documents and adversarial tests, without claiming a complete Research harness or MVP.

## Completion Checklist

- [x] Implement the fifteen-path scope with unchanged Core.
- [x] Validate authored corpus and hostile data without providers or code execution.
- [x] Record focused tests and package/documentary gates.
- [ ] Obtain separate authorization for any future publication.
