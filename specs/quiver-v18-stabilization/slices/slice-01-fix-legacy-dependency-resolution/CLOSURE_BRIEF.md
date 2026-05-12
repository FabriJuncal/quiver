# CLOSURE BRIEF — slice-01: Fix legacy dependency resolution

**Spec:** quiver-v18-stabilization
**Slice:** slice-01-fix-legacy-dependency-resolution

---

## Checklist antes de abrir el PR

- [ ] `node --test tests/` → exit 0, sin tests en rojo.
- [ ] `node bin/create-quiver.js plan` → exit 0, imprime el plan del repo.
- [ ] `node bin/create-quiver.js plan --json` → JSON válido con `plan`, `critical_path`, `total_hours`.
- [ ] `git diff --stat` muestra exactamente dos archivos: `src/create-quiver/lib/slice-graph.js` y el archivo de test.
- [ ] El test nuevo cubre: (a) legacy bare dep no tira error, (b) nuevo formato `depends_on` sigue funcionando.
- [ ] El commit tiene un mensaje que explica el *por qué* (ver EXECUTION_BRIEF).

## Checklist del PR

- [ ] Branch: `bugfix/QUIVER-01-fix-legacy-dependency-resolution` → `main`.
- [ ] Título del PR: `bugfix(QUIVER-01): ignore legacy bare spec deps in normalizeDependencyRef`.
- [ ] Body del PR sigue las secciones del `docs/GITFLOW_PR_GUIDE.md.template`: Title, Summary, Scope, Files, How to Test, Evidence, Rollback, Risks / Notes.
- [ ] En "Evidence": incluir la salida de `npx create-quiver plan` (primeras líneas) y `npx create-quiver plan --json | head`.
- [ ] En "Rollback": `git revert HEAD --no-edit` es suficiente.
- [ ] En "Risks / Notes": mencionar que el drop silencioso es intencional y que los slices legacy ya están completados.

## Post-merge

- [ ] Actualizar `specs/quiver-v18-stabilization/STATUS.md`: slice-01 → `Completed`, agregar número de PR y `actual_hours`.
- [ ] Actualizar `specs/quiver-v18-stabilization/EVIDENCE_REPORT.md`: registrar evidencia del slice.
