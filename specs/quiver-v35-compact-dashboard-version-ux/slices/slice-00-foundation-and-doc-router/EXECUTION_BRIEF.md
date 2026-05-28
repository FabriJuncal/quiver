# EXECUTION_BRIEF - slice-00 Foundation and doc router decision

## Objective

Create the v35 spec package for compact dashboard and version UX without product-code implementation.

## Context

The user approved acceptance criteria and a hardened technical plan. The repository's expected `docs/INDEX.md` is missing in this checkout, but `docs/INDEX.md.template` exists. The repo's real spec convention is `specs/quiver-vNN-*`.

## Scope

- `specs/quiver-v35-compact-dashboard-version-ux/SPEC.md`
- `STATUS.md`
- `EXECUTION_PLAN.md`
- `EVIDENCE_REPORT.md`
- `pr.md`
- all slice directories and handoff files

## Acceptance Criteria

- Spec package exists under `specs/quiver-v35-compact-dashboard-version-ux`.
- Each slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- `STATUS.md` marks this slice completed and the next implementation slice ready.
- No product code is modified.
- Validation is attempted and any blocker is documented.

## Restrictions

- Do not create dashboard or version implementation.
- Do not create or modify root `docs/INDEX.md` in this slice.
- Do not publish npm.

## Completion Checklist

- [x] Spec package created.
- [x] Slice handoffs created.
- [x] JSON and spec validation run.
