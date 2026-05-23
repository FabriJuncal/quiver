# EXECUTION BRIEF - slice-04: Local validation and brief contracts

## Context

The npm smoke test found that `check-slice --local` still failed before validation in a non-Git folder and then failed on a valid dependency from `slice-01` to a completed `slice-00-docs-foundation`. It also found that `check-handoff` only accepts the older global `HANDOFF.md` shape.

## Objective

Make local validation useful for new projects and align validation with current slice-local briefs.

## Scope

- `check-slice --local`.
- Dependency resolution for completed slices.
- Brief/handoff validators.
- Fixtures and docs.

## Acceptance Criteria

- Local structural validation does not fatally require Git.
- Completed documentary slices can satisfy dependencies.
- `EXECUTION_BRIEF.md` and `CLOSURE_BRIEF.md` validation is supported.
- Existing `HANDOFF.md` validation remains supported.

## Technical Plan Summary

Separate structural validation from Git/remote validation in local mode, resolve dependencies from the full slice set, and extend validation contracts for slice briefs.

## Suggested Execution Steps

1. Reproduce no-Git local validation failure.
2. Reproduce completed `slice-00` dependency failure.
3. Split local structural checks from Git checks.
4. Add brief validators or route support.
5. Add regression fixtures and tests.

## Restrictions

- Do not weaken normal PR/base validation outside `--local`.
- Do not remove global handoff compatibility.

## Risks

- Dependency resolution changes can affect `plan`, `graph`, or `next`; run focused graph tests.

## Completion Checklist

- [ ] No-Git fixture covered.
- [ ] Completed dependency covered.
- [ ] Brief validation covered.
- [ ] Handoff compatibility covered.

