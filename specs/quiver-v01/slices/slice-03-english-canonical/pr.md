# PR - QUIVER-03 - English Canonical

## Titulo

docs: translate all documentation to English; move Spanish to i18n/es/

## Resumen

Traduce toda la documentación del framework al inglés como idioma canónico. Actualiza los headings obligatorios en check-pr-readiness.sh. El español se preserva en i18n/es/ para usuarios hispanohablantes.

## Alcance

- Todos los .md y .md.template en inglés
- check-pr-readiness.sh con headings en inglés
- i18n/es/ con copias en español
- Excluye comentarios internos de scripts bash

## Archivos

- `README.md`, `README_FOR_AI.md`, `TEMPLATE.md`
- `docs/*.md.template`, `docs/ai/PRINCIPLES.md`, `docs/ai/RULES.yaml`
- `scripts/check-pr-readiness.sh`
- `specs/[project-name]/slices/pr.md.template`
- `i18n/es/` (nuevo)

## Cómo Probar (DETALLADO - OBLIGATORIO)

### Entorno Requerido

- bash, node ≥14, git

### Acceso al Worktree

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-03-english-canonical/slice.json
```

### Levantar el Proyecto

```bash
# No aplica
```

### Casos de Uso

#### Caso 1: Gate con pr.md en inglés

1. Crear un pr.md con headings en inglés (ej: `## How to Test (DETAILED - REQUIRED)`)
2. Ejecutar `npm run check:pr -- <slice.json>`
3. Verificar que el gate pasa sin errores

**Resultado esperado:** PASS en todos los checks de headings.

---

#### Caso 2: Verificar i18n/es/

1. `ls i18n/es/`
2. Verificar que existen al menos README.md, WORKFLOW.md y CONTRIBUTING.md en español

**Resultado esperado:** archivos en español intactos en i18n/es/.

---

### Verificación Técnica

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-03-english-canonical/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-03-english-canonical/slice.json
grep -c "Cómo Probar" scripts/check-pr-readiness.sh  # debe ser 0
```

## Evidencia

- [ ] Output de check-pr-readiness.sh con pr.md en inglés
- [ ] `ls i18n/es/` output

## Rollback

1. `git revert <commit-hash>`
2. Verificar que check-pr-readiness.sh vuelve a headings en español

## Riesgos / Notas

- PRs 01 y 02 fueron mergeados con pr.md en español — no necesitan actualizarse (ya merged).
- Después de este merge, todos los nuevos pr.md deben usar headings en inglés.
