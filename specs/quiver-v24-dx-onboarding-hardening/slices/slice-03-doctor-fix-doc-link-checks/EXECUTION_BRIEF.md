# EXECUTION BRIEF - slice-03: Doctor fixes and documentation link checks

## Contexto

Init hygiene can still leave older projects with missing `.gitignore`, stale scripts, or generated docs links. Users need a safe way to see and apply repairs.

## Objetivo

Add previewable, idempotent repair behavior and docs link validation.

## Alcance

- `doctor --fix --dry-run`.
- `doctor --fix` for safe non-destructive repairs.
- Local Markdown link checks for generated docs.
- Tests for idempotency and no-write dry-run.

## Criterios de aceptación

- Dry-run writes nothing.
- Fix mode is idempotent.
- User-owned content is preserved.
- Missing generated-doc links are detected.

## Plan técnico resumido

Extend doctor report generation with a repair plan, then execute only approved safe operations when `--fix` is provided.

## Pasos sugeridos de ejecución

1. Model fix candidates separately from applying fixes.
2. Render the fix plan in doctor output.
3. Apply safe fixes only when not dry-run.
4. Add docs link validation.
5. Test idempotency and failure output.

## Restricciones

- No destructive writes.
- No link checking over dependency folders or generated caches.

## Riesgos

- Link checker could over-report optional docs. Keep optional handling explicit.

## Checklist de finalización

- [ ] Dry-run no-write test.
- [ ] Idempotency test.
- [ ] Link-check test.
