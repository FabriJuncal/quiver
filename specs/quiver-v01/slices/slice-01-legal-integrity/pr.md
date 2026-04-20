# PR - QUIVER-01 - Legal + Integrity

## Titulo

chore: add LICENSE, fix broken refs, clean orphans, fix init-docs.sh bugs

## Resumen

Agrega LICENSE MIT, elimina referencias rotas (./GITFLOW.md, MIGRATION_SUMMARY.md), borra slice-template.json huérfano, renombra pr-template.md → pr.md.template y corrige dos bugs en init-docs.sh (TESTING_GUIDE no copiado, date macOS-only).

## Alcance

- LICENSE MIT creado
- Referencias rotas eliminadas
- slice-template.json huérfano borrado
- pr-template.md → pr.md.template (+ init-docs.sh actualizado)
- init-docs.sh: copy TESTING_GUIDE + date portable vía Node

## Archivos

- `LICENSE`
- `README_FOR_AI.md`
- `docs/WORKFLOW.md.template`
- `specs/[project-name]/slices/pr.md.template`
- `scripts/init-docs.sh`

## Cómo Probar (DETALLADO - OBLIGATORIO)

### Entorno Requerido

- bash, node (cualquier versión ≥14), git
- macOS o Linux

### Acceso al Worktree

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-01-legal-integrity/slice.json
```

### Levantar el Proyecto

```bash
# No aplica — framework de documentación, sin servidor
```

### Casos de Uso

#### Caso 1: Verificar LICENSE

1. `cat LICENSE`
2. Verificar que contiene texto MIT con año 2026 y autor correcto.

**Resultado esperado:** LICENSE con texto MIT válido.

---

#### Caso 2: Verificar init-docs.sh en Linux/macOS

1. Ejecutar `bash scripts/init-docs.sh "Test Project"` en un directorio vacío
2. Verificar que se crea `docs/TESTING_GUIDE_FOR_AI.md`
3. Verificar que los placeholders de fecha `{{FECHA_PROXIMA}}` tienen fecha real (no igual a `{{FECHA}}`)

**Resultado esperado:** TESTING_GUIDE copiado; fechas +7d y +30d correctas en ambos OS.

---

### Verificación Técnica

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-01-legal-integrity/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-01-legal-integrity/slice.json
grep -r "GITFLOW\|MIGRATION_SUMMARY" . --include="*.md" --include="*.sh" | grep -v ".git"
```

## Evidencia

- [ ] Screenshot o output de init-docs.sh en Linux
- [ ] `cat LICENSE` output

## Rollback

1. `git revert <commit-hash>`
2. Verificar que LICENSE desaparece y refs vuelven

## Riesgos / Notas

- La portabilidad de date vía Node asume node en PATH. Documentar como prerequisito si no estaba antes.
