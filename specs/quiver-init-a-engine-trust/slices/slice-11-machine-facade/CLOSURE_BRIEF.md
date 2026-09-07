# CLOSURE_BRIEF — slice-11-machine-facade

Status: SPEC_DRAFT. Runtime status: not-tested. Cycles: 0.

## Summary

Publish the canonical Engine facade and machine command results. Implementation and validation pending.

## Delivered

Contract only; no runtime or test success claimed.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/engine.test.js tests/commands/engine-contract.test.js`: not executed for this slice.
- `git diff --check`: not executed for this slice.

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

## Risks and pending work

- Not verified: Facade methods share same canonical values as human/JSON CLI; JSON keys unaffected by locale.
- Not verified: All error classes mapped reproducibly with actual negative cases and exits.
- Not verified: Cloud-style caller cannot choose authenticated actor by request body; resolver context binds identity.
- Not verified: Legacy commands preserve existing tests and exit expectations.

## Definition of done

Acceptance passes, independent review closes, evidence captured, one logical
commit exists and the initiative's final integration evidence includes the slice.
