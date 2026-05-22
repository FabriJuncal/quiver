# EXECUTION BRIEF - slice-00: Spec foundation and source-of-truth sync

## Contexto

This slice publishes the v24 planning package generated from the approved acceptance criteria and production-reviewed technical plan.

## Objetivo

Create the durable spec foundation for Quiver v24 without changing product behavior.

## Alcance

- Create `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, `EXECUTION_PLAN.md`, and `pr.md`.
- Create every slice folder with `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Update `README_FOR_AI.md` and `ROADMAP.md` so the source of truth mentions v24 as planned.

## Criterios de aceptación

- Spec folder exists.
- Mandatory `slice-00` exists.
- Every slice has the required handoff files.
- Every `slice.json` parses.
- No product code is modified.

## Plan técnico resumido

Write documentation only, following the existing `specs/quiver-v23-guided-flow-productization/` structure.

## Pasos sugeridos de ejecución

1. Create the spec folder and top-level spec files.
2. Create all slice folders and handoffs.
3. Sync `README_FOR_AI.md` and `ROADMAP.md`.
4. Validate JSON and diff whitespace.

## Restricciones

- Do not edit CLI source.
- Do not modify tests.
- Do not publish or open a PR from this slice.

## Riesgos

- Source-of-truth docs could accidentally imply v24 is implemented. Keep wording as planned only.

## Checklist de finalización

- [x] Spec files created.
- [x] Slice handoffs created.
- [x] Source-of-truth docs synced.
- [x] JSON parse validation captured.
- [x] `git diff --check` captured.
