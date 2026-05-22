# EXECUTION BRIEF - slice-04: Prepare output and AI context preparation drafts

## Contexto

`prepare --dry-run` currently reports missing root `README_FOR_AI.md` in generated projects, which can look like project debt. Users also expect a command that prepares context docs after analysis.

## Objetivo

Clarify prepare output and add safe docs-only context preparation for IA onboarding.

## Alcance

- Prepare report wording.
- `ai prepare-context --dry-run`.
- Optional write mode for context docs only.
- Assumptions, risks, omitted paths, and uncertainty markers.

## Criterios de aceptación

- No false `README_FOR_AI.md` debt.
- Dry-run writes nothing.
- Write mode only touches approved docs.
- Product code is untouched.

## Plan técnico resumido

Reuse existing context-pack and onboarding planning helpers where possible. Add a command path that renders proposed docs and tracks uncertainty.

## Pasos sugeridos de ejecución

1. Adjust prepare source wording.
2. Add command routing for `ai prepare-context`.
3. Build proposed context doc outputs from project map and existing docs.
4. Add no-write and docs-only write tests.
5. Update templates and docs.

## Restricciones

- Do not invent confirmed facts.
- Do not read dependency folders or local AI state.

## Riesgos

- Generated context can become too verbose; keep summaries concise and traceable.

## Checklist de finalización

- [ ] Prepare wording test.
- [ ] `ai prepare-context --dry-run` test.
- [ ] Docs-only write test.
