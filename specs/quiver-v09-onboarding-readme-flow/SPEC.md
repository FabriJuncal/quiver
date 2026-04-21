# Quiver v0.9 - Onboarding README Flow

**Date:** 2026-04-21
**Status:** In progress

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make the README and generated onboarding docs explain the full developer and AI onboarding path so a new project can prepare context before the first implementation slice.

## Scope

### Included

- Reorder the root README around the developer onboarding flow
- Update the generated project README so it explains analysis, AI context preparation, and review before slices
- Make the AI handoff explicit without embedding the full prompt in the README
- Update `doctor` and AI guidance so the CLI points users to the generated prompt after analysis
- Extend smoke checks so README onboarding guidance and doctor output stay covered

### Excluded

- Changing the analyzer behavior
- Adding provider-specific AI integrations
- Changing release publishing behavior
- Reworking Windows-specific shell support
- Changing the one-slice-one-commit and one-spec-one-PR rules

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Developer README Onboarding Flow | Completed | [slice-01](./slices/slice-01-developer-readme-onboarding-flow/slice.json) |
| 02 | AI Handoff and Doctor Guidance | Pending | [slice-02-ai-handoff-doctor-guidance/slice.json](./slices/slice-02-ai-handoff-doctor-guidance/slice.json) |

## Definition of Done

- The root README shows the full install, analyze, doctor, AI handoff, review, and first-slice flow
- The generated project README gives the same operational onboarding path
- The README tells the developer exactly what to ask the AI agent to do
- `doctor` points to the generated onboarding prompt once the project has scan artifacts
- Smoke tests cover the README and doctor onboarding guidance
- The spec is completed with one commit per slice and one PR for the spec
