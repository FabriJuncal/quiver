# EXECUTION BRIEF - slice-01: Init and generated template hygiene

## Contexto

Dogfooding showed that a generated project can start with noisy or inaccurate metadata: missing root `.gitignore`, `package.json.name` set to `quiver-docs-template`, and docs links to absent optional files.

## Objetivo

Make `init` output clean, profile-aware, and non-destructive.

## Alcance

- Root `.gitignore` creation and merge.
- Generated package name from project slug.
- Profile-aware `docs/INDEX.md`.
- Generated script contract check against supported command surface.
- Tests for empty and existing projects.

## Criterios de aceptación

- Empty project init creates correct package name.
- Empty project init creates root `.gitignore`.
- Existing `.gitignore` is preserved and merged.
- Generated docs do not contain profile-inconsistent local links.
- Generated scripts match available commands.

## Plan técnico resumido

Extend init rendering helpers and tests. Keep all writes additive and idempotent.

## Pasos sugeridos de ejecución

1. Locate init layout/rendering helpers.
2. Add root `.gitignore` handling with merge semantics.
3. Fix package name derivation.
4. Render docs index based on selected profile.
5. Add tests and smoke coverage.

## Restricciones

- Do not overwrite user-owned files.
- Do not change default init scope beyond approved hygiene fixes.

## Riesgos

- Package names must remain valid npm names.
- Existing projects may have intentional `.gitignore` content; preserve it.

## Checklist de finalización

- [ ] Init tests added.
- [ ] Existing-project preservation tested.
- [ ] Smoke passes.
