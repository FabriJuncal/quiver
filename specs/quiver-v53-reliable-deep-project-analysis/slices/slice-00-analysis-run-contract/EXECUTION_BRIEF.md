# EXECUTION_BRIEF - slice-00 analysis run contract

## Context

`ai analyze-project` needs a production contract before repair, retry, and audit logic are implemented. The command must separate read-only planning, provider execution, audit writes, review, and final documentation writes.

## Objective

Define the reliable analysis run contract for Quiver v53.

## Scope

- Mode behavior for `--dry-run`, provider execution, `--json`, `--review`, and non-TTY.
- Run state names.
- Manifest artifact names.
- Error taxonomy.
- Write boundaries.

## Acceptance Criteria

- Mode behavior is explicit and testable.
- Invalid final JSON guarantees 0 final docs writes.
- `.quiver/runs` audit writes are clearly distinguished from docs writes.
- Later slices can implement against this contract without reinterpreting behavior.

## Expected Files To Modify

- `specs/quiver-v53-reliable-deep-project-analysis/SPEC.md`
- `specs/quiver-v53-reliable-deep-project-analysis/EXECUTION_PLAN.md`
- `specs/quiver-v53-reliable-deep-project-analysis/STATUS.md`
- `specs/quiver-v53-reliable-deep-project-analysis/EVIDENCE_REPORT.md`
- this slice directory

## Validations Required

- `node bin/create-quiver.js spec validate specs/quiver-v53-reliable-deep-project-analysis --strict`
- `npm run schema:slice:check`
- `git diff --check`

## Risks

- Ambiguous mode contract creates inconsistent implementations.
- Audit writes may be mistaken for docs writes unless named explicitly.

## Dependencies

- None.

## Instructions For Executor

1. Keep this slice docs-only.
2. Do not implement runtime code here.
3. Update the closure brief with final contract decisions and validation evidence.

## Completion Checklist

- [ ] Contract sections are complete.
- [ ] Slice JSON status is updated.
- [ ] Closure brief is filled.

## Conditions Of Closure

- The spec has an unambiguous contract for every later slice.
