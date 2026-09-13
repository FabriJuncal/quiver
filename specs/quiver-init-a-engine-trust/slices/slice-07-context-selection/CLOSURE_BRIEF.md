# CLOSURE_BRIEF — slice-07-context-selection

Status: DONE for slice scope. Runtime status: tested. Author/review/fix cycles: 3.
Independent review: APPROVED.

## Summary

Implemented bounded, deterministic and explainable context selection over the
authorized Brain snapshot, plus a manifest-aware context-pack adapter that keeps
trusted instructions separate from injection-safe untrusted content.

## Delivered

- Strict Task and Context Manifest validation, canonical digest, exact payload
  byte accounting and mandatory-first budget enforcement.
- Structural relevance from exact requirement IDs/module paths; every canonical
  record is selected or excluded once with a deterministic reason and ordering.
- Current policy, requirement and receipt-backed decision authority can enter
  trusted instructions. Assumptions and other content remain untrusted;
  noncurrent optional receipt knowledge is excluded and mandatory knowledge
  blocks with its safe authority reason.
- Existing synchronous context packs retain their exact legacy shape. The new
  async Result-v1 adapter accepts only selector-branded manifests and falls back
  only for a safely verified absent Brain, never corruption, quarantine or policy
  failure.
- The private selector brand binds digest, canonical project root and Brain
  project UUID. Cross-project sync/async pack reuse is denied before project scan
  reads; raw, cloned and post-selection-mutated manifests are also denied.
- Full rationale and the agreed one-clock-call timestamp semantics are recorded
  in [the author decision log](../../evidence/slice-07-author-decisions.md).

## Validation

- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-context.test.js tests/lib/ai-context-packs.test.js`: PASS, 16/16, 0 skipped. Evidence: [author final retest](../../evidence/slice-07-author-targeted-03.md).
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/project-scan.test.js tests/commands/ai-onboard.test.js tests/commands/analyze.test.js tests/commands/ai-execute-slice.test.js tests/commands/ai-plan.test.js tests/lib/ai-executor.test.js`: PASS, 89/89, 0 skipped. Evidence: [consumer final author retest](../../evidence/slice-07-author-consumers-02.md).
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH node --check src/create-quiver/lib/brain/context.js` and the matching `context-packs.js` check: PASS.
- `git diff --check`: PASS.
- ROOT-A07-01 and ROOT-A07-02 were closed by static inspection; ROOT-A07-03 was
  independently reproduced and runtime-closed. Evidence: [before](../../evidence/slice-07-project-binding-before.md) and [after](../../evidence/slice-07-project-binding-after.md).

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

## Risks and pending work

- [Independent frozen-source review](../../evidence/slice-07-independent-review.md)
  is APPROVED; [focal and consumer QA](../../evidence/slice-07-independent-final.md)
  passed 105/105 with zero failures/skips, 8,882 ms. [Combined CI with A03](../../evidence/slice-07-integration-with-slice-03.md)
  passed 1014/1014 with zero failures/skips/cancellations/todo, 100,232 ms.
  One combined full-CI attempt was executed. Rebase was conflict-free and all
  four source/test SHA-256 fingerprints were unchanged.
- A08 owns contradiction/impact analysis, persisted manifest verification and the
  executor pre-provider stale check. A07 exposes the strict selection and pack
  seam but does not claim those later behaviors.
- Receipt tests use explicitly trusted fixtures and verify current/revoked/
  unavailable transitions; they do not claim a live Cloud resolver.

## Definition of done

Declared A07 acceptance, independent review and combined CI are satisfied.
This completed slice closure belongs to its single logical commit, identified
by `Slice: quiver-init-a-engine-trust/slice-07-context-selection`.
Whole-initiative and cross-plan integration remain later obligations.
