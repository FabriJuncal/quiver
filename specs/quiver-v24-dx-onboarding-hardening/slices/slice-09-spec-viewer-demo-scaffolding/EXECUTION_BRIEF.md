# EXECUTION BRIEF - slice-09: Spec Viewer demo scaffolding

## Contexto

Quiver Spec Viewer proved useful as a small dogfooding app. A maintained demo command can make first evaluation easier without turning Quiver into a UI product.

## Objetivo

Add optional demo scaffolding for a lightweight Spec Viewer project.

## Alcance

- `demo create spec-viewer --dry-run`.
- Real demo creation for safe targets.
- Lightweight app files and validation scripts.
- Demo spec/slice artifacts.
- Non-destructive behavior and tests.

## Criterios de aceptación

- Dry-run writes nothing.
- Real run creates a runnable small demo.
- Existing files are preserved or skipped.
- No heavy dependencies are introduced.

## Plan técnico resumido

Add a demo command and packaged demo templates or renderer. Reuse init non-destructive helpers where possible.

## Pasos sugeridos de ejecución

1. Define command routing for `demo create`.
2. Implement dry-run planning.
3. Implement non-destructive writes.
4. Add demo validation scripts.
5. Add tests and package safety checks.

## Restricciones

- Demo remains optional.
- Do not include a persistent server with command execution.

## Riesgos

- Demo scope can grow. Keep it intentionally small and educational.

## Checklist de finalización

- [ ] Dry-run test.
- [ ] Real-run smoke.
- [ ] Package safety checked.
