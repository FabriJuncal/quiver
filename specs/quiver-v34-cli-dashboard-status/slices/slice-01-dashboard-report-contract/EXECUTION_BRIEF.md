# EXECUTION_BRIEF - slice-01 Dashboard report contract

## Context

`ai export --format json` already exposes lifecycle state and a `dashboard` subobject, but the new public dashboard needs a compact purpose-built contract. It must not become a second source of truth.

## Objective

Create the dashboard report model that future command rendering can consume.

## Scope

- `src/create-quiver/lib/dashboard.js`
- compatible helper extraction in `src/create-quiver/lib/ai/export-state.js` if needed
- focused model tests

## Acceptance Criteria

- Report includes `dashboard_schema_version: 1`.
- Report includes `summary`, `global_progress`, `visible_progress`, `next_ready`, `specs`, `slices`, `agents`, `approvals`, `active_slice`, `blockers`, `warnings`, and `next_steps`.
- Global progress includes completed slices even when visible work hides them.
- Visible progress respects `--spec` and `--include-completed`.
- Evidence and run details are summarized without raw logs or evidence values.
- Missing data is represented with stable nulls/empty arrays rather than crashes.

## Technical Plan Summary

Build pure dashboard helpers on top of existing lifecycle export and project-state resolver data. Keep CLI routing and formatting out of this slice.

## Suggested Steps

1. Define the compact report shape.
2. Add report construction from existing export state.
3. Add global vs visible progress calculation.
4. Add safe evidence/run summaries.
5. Add next-ready derivation where graph data allows it.
6. Add model tests for default, include-completed, spec filter, missing data, and evidence safety.

## Restrictions

- Do not add top-level command routing.
- Do not add prompts, spinners, writes, providers, or shell-outs.
- Do not return the full lifecycle export as dashboard JSON.

## Risks

- Progress can be misleading if global and visible counts are collapsed into one number.

## Completion Checklist

- [ ] Report contract implemented.
- [ ] Focused tests added.
- [ ] Existing `ai export` tests still pass.
