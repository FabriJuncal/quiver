# EXECUTION BRIEF - slice-00: Docs foundation and source-of-truth sync

## Context

`create-quiver@0.12.0` was published, but a clean npm smoke test found first-use frictions and stale source-of-truth docs. This slice creates the hotfix planning package before implementation starts.

## Objective

Publish the v26 spec, slices, briefs, execution plan, PR body, evidence report, and source-of-truth sync.

## Scope

- `specs/quiver-v26-0121-smoke-hardening/**`
- `README_FOR_AI.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `specs/quiver-v25-ai-first-lifecycle-orchestrator/STATUS.md`

## Acceptance Criteria

- The v26 spec folder exists.
- Every slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Every `slice.json` parses successfully.
- Source-of-truth docs no longer describe v25 as planned or pending release.
- No product code is modified.

## Technical Plan Summary

Create documentation-only artifacts and update release/source-of-truth references. Leave implementation for later slices.

## Suggested Execution Steps

1. Create the v26 spec folder and slice folders.
2. Write `SPEC.md`, `STATUS.md`, `EXECUTION_PLAN.md`, `EVIDENCE_REPORT.md`, and `pr.md`.
3. Write each slice's `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
4. Sync source-of-truth docs.
5. Validate JSON and whitespace.

## Restrictions

- Do not change product code.
- Do not bump package version in this slice unless required by release docs.
- Do not publish npm.

## Risks

- Source docs can become stale again if release state is not updated in final slice.

## Completion Checklist

- [ ] Spec artifacts created.
- [ ] Source-of-truth docs synced.
- [ ] JSON validation passed.
- [ ] `git diff --check` passed.

