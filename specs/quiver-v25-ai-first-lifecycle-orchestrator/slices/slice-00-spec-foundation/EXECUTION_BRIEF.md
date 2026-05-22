# EXECUTION BRIEF - slice-00: Spec foundation and source-of-truth sync

## Context

This slice publishes the v25 planning package generated from approved acceptance criteria and a production-readiness review.

## Objective

Create the durable spec foundation for Quiver v25 without changing product behavior.

## Scope

- Create `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, `EXECUTION_PLAN.md`, and `pr.md`.
- Create every slice folder with `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Update `README_FOR_AI.md` and `ROADMAP.md` so source-of-truth docs mention v25 as planned work.

## Acceptance Criteria

- Spec folder exists.
- Mandatory `slice-00` exists.
- Every slice has required handoff files.
- Every `slice.json` parses.
- No product code is modified.

## Technical Plan Summary

Write documentation only, following the existing `specs/quiver-v24-dx-onboarding-hardening/` structure.

## Suggested Execution Steps

1. Create the spec folder and top-level spec files.
2. Create all slice folders and handoffs.
3. Sync source-of-truth planning docs.
4. Validate JSON and whitespace.

## Restrictions

- Do not edit CLI source.
- Do not modify tests.
- Do not publish or open a PR from this slice.

## Risks

- Source-of-truth docs could accidentally imply v25 is implemented. Keep wording as planned only.

## Completion Checklist

- [x] Spec files created.
- [x] Slice handoffs created.
- [x] Source-of-truth docs synced.
- [x] JSON parse validation captured.
- [x] `git diff --check` captured.
