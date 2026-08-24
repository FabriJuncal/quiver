# PR — QUIVER-58-04 Digest-bound Approvals

Status: Preimplementation template

## Objective

Make governed approval exact, actor-bound, run-bound, and atomic.

## Scope checklist

- [ ] Explicit run approval candidate.
- [ ] Complete binding validation under lock.
- [ ] Current actor authorization.
- [ ] Atomic decision and phase transition.
- [ ] Representation mismatch detection.
- [ ] Stable machine contract.
- [ ] Canonical approval show, verify, and export.

## Reviewer checks

- [ ] No pre-lock-only digest validation remains authoritative.
- [ ] Failure leaves no partial state.
- [ ] Counts come from canonical collections.
- [ ] AC-08, AC-09, and AC-12 evidence is linked.

## Validation evidence

Populate from executed commands in CLOSURE_BRIEF.md. No result is asserted before implementation.
