# CLOSURE BRIEF - slice-01: Init and generated template hygiene

## Resumen de lo realizado

- `init` ahora crea o mergea un `.gitignore` raíz con defaults seguros sin borrar entradas existentes.
- El `package.json` generado usa el slug del proyecto como `name`; los proyectos existentes conservan su nombre y solo reciben uno si estaba vacío.
- `docs/INDEX.md.template` quedó limpio para el perfil default y el perfil `--full` agrega un apéndice con los extras reales que genera.
- El plan de init muestra `.gitignore` como archivo creado/actualizado y los tests cubren scripts `quiver:*` contra comandos soportados.

## Validación contra criterios de aceptación

- [x] Package name uses project slug.
- [x] Root `.gitignore` is created or merged.
- [x] Docs index is profile-aware.
- [x] Generated scripts match command surface.

## Cambios relevantes

- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/lib/init-layout.js`
- `docs/INDEX.md.template`
- `package.template.json`
- `README.md`
- `README_FOR_AI.md`
- `tests/commands/init-profiles.test.js`
- `tests/lib/init-layout.test.js`

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

La normalización del `.gitignore` evita duplicados simples entre `node_modules` y `node_modules/`, pero no intenta resolver patrones avanzados de negación o reglas específicas de cada repo.

## Recomendaciones futuras

Mantener futuros fixes de `init` como operaciones aditivas y fáciles de auditar con `--dry-run`.
