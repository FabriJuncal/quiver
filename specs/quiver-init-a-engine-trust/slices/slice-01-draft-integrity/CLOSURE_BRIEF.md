# CLOSURE_BRIEF — slice-01-draft-integrity

State: DONE for slice scope. Implementation/review cycles: 5. Full CI cycles: 2.

## Summary

Implemented immutable planner draft history, structural identity preservation,
explicit selection metadata and recoverable atomic current projections. Defective
or unsupported candidates remain inspectable without silently replacing the last
valid current draft, and existing planner writers advance run state only for a
selected candidate.

## Delivered

- Added stable structural extraction for requirement, acceptance and slice IDs in
  JSON, Markdown and fenced JSON, with collection/reference preservation,
  duplicate detection and explicit-removal comparison.
- Added immutable version publication, lifecycle events, selected-version
  metadata and a validated phase-local roll-forward journal for `meta.json` and
  `draft.md`.
- Hardened v1 readers against malformed/unknown metadata, invalid selection,
  projection tamper, unsafe paths, symlinks and pending recovery markers.
- Preserved the selected current projection during historical run-owned approval,
  and enforced v58 writer mode before save, approval and recovery writes.
- Updated only affected success/invalid-shape fixtures with real stable IDs; no
  assertion was removed or narrowed.

## Validation

- [Targeted integrity tests](../../evidence/slice-01-targeted-tests.md): 24/24 pass.
- [Affected consumer regressions](../../evidence/slice-01-consumer-regression.md):
  command exit 0; 122/122 pass in the final visible run.
- [Spec-create invalid-shape regression](../../evidence/slice-01-spec-create-regression.md):
  1/1 pass with the original no-write assertion.
- [Independent Node 22 CI cycle 1](../../evidence/slice-01-independent-ci-cycle-1.md):
  retained failure evidence, 956/958 pass. It exposed the governed JSON fixture
  shape and the additional `spec-create` automatic-selection fixture.
- [Independent Node 22 CI cycle 2](../../evidence/slice-01-independent-ci-cycle-2.md):
  958/958 pass, no failures or skips, 82,328 ms.
- `git diff --check`: pass on the independently reviewed frozen tree.
- [Independent code review](../../evidence/slice-01-independent-review.md):
  approved with CR-A01-01 through CR-A01-07 closed.

## Failure and retest record

- Cycle 1 established the executable baseline after linking the existing local
  dependency install; early test loading could not resolve `zod` before that
  environment-only symlink, which is excluded from the commit.
- Cycle 2 made the core executable and exposed four consumer regressions: three
  fixtures lacked stable identity/input binding and historical approval replaced
  the wrong current metadata projection. All four were fixed without weakening
  assertions.
- Cycle 3 closed independent findings for metadata/projection invariants, unsafe
  traversal/symlink previews and recovery writes in read-only mode.
- Cycle 4 closed duplicate-ID handling, unknown schema fail-close, future
  acknowledged-unsupported selection compatibility and valid governed isolation
  fixture structure. The frozen targeted/consumer matrix passed 146/146.
- Cycle 5 retained the first full Node 22 failure, added the coordinator-authorized
  stable ID to the invalid `spec-create` fixture, and passed the clean 958-test
  Node 22 rerun.

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

## Risks and pending work

- Slice 02 still owns compare/select/reject/restore CLI operations and explicit
  acknowledged selection of unsupported content. This reader intentionally allows
  future non-corrupt acknowledged selection but approval eligibility remains
  integrity-preserved only.
- Slice 03 still owns first-class addenda/amendments and wires explicit structural
  removal declarations into effective-contract operations. A01 verifies the
  deterministic comparator contract only.
- Windows records `best-effort` directory durability instead of claiming POSIX
  fsync guarantees.

## Definition of done

All A01 acceptance cases pass, independent review is terminal approved, evidence
is captured and the slice is ready for its one logical commit. Initiative-wide
integration and dependent lifecycle operations remain with their declared slices.
