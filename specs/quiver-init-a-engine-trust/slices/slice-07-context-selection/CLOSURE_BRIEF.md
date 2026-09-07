# CLOSURE_BRIEF — slice-07-context-selection

Status: SPEC_DRAFT. Runtime status: not-tested. Cycles: 0.

## Summary

Select bounded explainable and trust-separated context. Implementation and validation pending.

## Delivered

Contract only; no runtime or test success claimed.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-context.test.js tests/lib/ai-context-packs.test.js`: not executed for this slice.
- `git diff --check`: not executed for this slice.

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

## Risks and pending work

- Not verified: Small task excludes unrelated records with explanations; repeat request deterministic.
- Not verified: Mandatory contract above budget fails, optional record omitted with reason.
- Not verified: Malicious source text stays untrusted; invalid confidence/authority rejected.
- Not verified: Legacy project context pack remains compatible and never labeled Brain-verified.

## Definition of done

Acceptance passes, independent review closes, evidence captured, one logical
commit exists and the initiative's final integration evidence includes the slice.
