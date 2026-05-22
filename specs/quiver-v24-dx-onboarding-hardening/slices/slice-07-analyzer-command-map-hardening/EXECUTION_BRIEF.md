# EXECUTION BRIEF - slice-07: Analyzer command map hardening

## Contexto

Dogfooding a vanilla Node/JavaScript app produced `Primary: unknown`, duplicated language values, and under-highlighted custom validation scripts.

## Objetivo

Make `analyze` produce a more accurate and useful `PROJECT_MAP.md` for small projects.

## Alcance

- Node/JavaScript fallback classification.
- Language deduplication.
- Command summary improvements.
- Tests for vanilla JS/Node fixtures.

## Criterios de aceptación

- Simple Node/JS project is recognized.
- Languages are unique.
- `validate` scripts are surfaced.
- Existing framework detection remains stable.

## Plan técnico resumido

Improve analyzer heuristics with conservative fallback rules based on package.json, source extensions, and entrypoint scripts.

## Pasos sugeridos de ejecución

1. Review current scan structure.
2. Add deduplication where language signals are collected.
3. Add Node/JS fallback detection.
4. Expand command/script patterns.
5. Add fixtures/tests.

## Restricciones

- Do not over-classify projects with weak signals.
- Do not execute user scripts during analysis.

## Riesgos

- Primary labels may become too broad. Prefer conservative names.

## Checklist de finalización

- [ ] Vanilla JS fixture test.
- [ ] Script summary test.
- [ ] Existing framework tests pass.
