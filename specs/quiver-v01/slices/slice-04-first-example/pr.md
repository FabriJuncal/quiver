# PR - QUIVER-04 - First Working Example

## Titulo

docs: add examples/01-basic-slice end-to-end

## Resumen

Agrega el primer ejemplo ejecutable del framework: un caso ficticio pero realista que demuestra el flujo completo spec → slice → PR → evidencia. Agnóstico al stack tecnológico.

## Alcance

- `examples/01-basic-slice/` con README, SPEC, EVIDENCE_REPORT y slice completo
- El slice.json del ejemplo tiene status: completed con todos los campos llenos
- El pr.md del ejemplo tiene formato completo en inglés

## Archivos

- `examples/01-basic-slice/README.md`
- `examples/01-basic-slice/SPEC.md`
- `examples/01-basic-slice/EVIDENCE_REPORT.md`
- `examples/01-basic-slice/slices/slice-01/slice.json`
- `examples/01-basic-slice/slices/slice-01/pr.md`

## Cómo Probar (DETALLADO - OBLIGATORIO)

### Entorno Requerido

- bash, node ≥14, git

### Acceso al Worktree

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-04-first-example/slice.json
```

### Levantar el Proyecto

```bash
# No aplica
```

### Casos de Uso

#### Caso 1: Leer el ejemplo como nuevo usuario

1. Abrir `examples/01-basic-slice/README.md`
2. Seguir las instrucciones sin leer ningún otro archivo primero
3. Verificar que el flujo completo se entiende en <5 minutos

**Resultado esperado:** comprensión del flujo spec → slice → PR sin ambigüedad.

---

#### Caso 2: Validar el slice.json del ejemplo

1. `node -e "JSON.parse(require('fs').readFileSync('examples/01-basic-slice/slices/slice-01/slice.json', 'utf8'))" && echo "valid"`
2. Verificar que status es "completed" y tiene started_at, completed_at, actual_hours

**Resultado esperado:** JSON válido, campos de trazabilidad presentes.

---

### Verificación Técnica

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-04-first-example/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-04-first-example/slice.json
node -e "JSON.parse(require('fs').readFileSync('examples/01-basic-slice/slices/slice-01/slice.json','utf8'))" && echo "example slice.json valid"
```

## Evidencia

- [ ] Screenshot o lectura del README del ejemplo
- [ ] Output de validación JSON del slice

## Rollback

1. `git revert <commit-hash>`
2. Verificar que directorio examples/ desaparece

## Riesgos / Notas

- El ejemplo debe depender de slice-03 completado para usar headings en inglés.
