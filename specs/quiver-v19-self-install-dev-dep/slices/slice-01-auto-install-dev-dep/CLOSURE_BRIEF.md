# CLOSURE BRIEF — slice-01: Auto-install create-quiver as dev dependency

**Spec:** quiver-v19-self-install-dev-dep
**Slice:** slice-01-auto-install-dev-dep

---

## Checklist antes de abrir el PR

- [ ] `node --test tests/**/*.test.js` → exit 0, todos los tests pasan incluyendo los 7 nuevos en `init-docs.test.js`
- [ ] Smoke con `--skip-install` → `node_modules/create-quiver` NO existe en el proyecto destino
- [ ] Smoke sin `--skip-install` → `node_modules/create-quiver` SÍ existe y `npx create-quiver plan` funciona sin `@version`
- [ ] Smoke con `devDependencies` preexistente → el step se saltea, no hay doble install
- [ ] `git diff --stat HEAD` muestra exactamente 3 archivos: `src/create-quiver/lib/init-docs.js`, `src/create-quiver/index.js`, `tests/lib/init-docs.test.js`

## Checklist del PR

- [ ] Branch: `feature/QUIVER-01-auto-install-dev-dep` → `main`
- [ ] Título: `feat(QUIVER-01): auto-install create-quiver as dev dependency after init`
- [ ] Body sigue las secciones del `docs/GITFLOW_PR_GUIDE.md.template`
- [ ] En "Evidence": output del smoke test mostrando `node_modules/create-quiver` creado y `npx create-quiver plan` funcionando
- [ ] En "Risks / Notes": mencionar que en entornos sin red el install falla silenciosamente (expected behavior) y documentar el `--skip-install` flag

## Post-merge

- [ ] Actualizar `specs/quiver-v19-self-install-dev-dep/STATUS.md`: slice-01 → `Completed`, agregar PR y `actual_hours`
- [ ] Actualizar `specs/quiver-v19-self-install-dev-dep/EVIDENCE_REPORT.md`: registrar evidencia
- [ ] Actualizar `slice.json`: `status: completed`, `actual_hours`, timestamps
- [ ] Evaluar si se publica `0.9.0` o si se acumula con otros cambios
