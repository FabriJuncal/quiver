# CLOSURE BRIEF - slice-03: Approved plan to spec create

## Summary

Implemented strict approved-plan to spec generation.

`spec create` and the spec-phase generator now require structured slice data from the reviewed and approved technical plan. They preserve every approved implementation slice, generate the mandatory `slice-00-spec-foundation`, and fail before writing when the plan is not structurally safe.

## Validation Against Acceptance Criteria

- A plan with 8 approved implementation slices produces those 8 slices plus the mandatory `slice-00-spec-foundation`.
- Plans without a structured slices array fail before writing files.
- Duplicate slice IDs fail before writing files.
- Missing dependencies fail before writing files.
- Circular dependencies fail before writing files.
- Fenced JSON slice blocks inside Markdown plans are supported.
- Failed `spec create --dry-run` does not create a spec directory.

## Changes

- Updated `src/create-quiver/lib/ai/spec-generator.js`.
- Updated `src/create-quiver/lib/ai/spec-templates.js`.
- Updated `tests/lib/ai-spec-generator.test.js`.
- Updated `tests/commands/spec-create.test.js`.
- Updated v27 spec status, execution plan, evidence, and this closure brief.

## Remaining Risks

- Free-form technical plans without structured slice data now fail intentionally; users need to revise the planner prompt or add a fenced JSON slice block.
- The structured contract is currently documented through the error message and tests, not a standalone schema file.
- Generated spec execution is still not performed in this slice.

## Follow-up Recommendations

- Update planner prompts in later slices so technical plans always include the structured slice block.
- Execute `slice-04` and `slice-05` next; they can proceed in parallel only if write scopes remain independent.
