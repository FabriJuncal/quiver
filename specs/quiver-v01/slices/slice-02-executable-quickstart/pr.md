# PR - QUIVER-02 - Executable Quickstart

## Titulo

feat: add package.template.json and wire npm scripts in init-docs.sh

## Resumen

Crea package.template.json con los 4 scripts npm requeridos por el WORKFLOW. init-docs.sh ahora lo instala en el host (merge si existe package.json, copia si no). El usuario puede ejecutar npm run check:slice inmediatamente después del init.

## Alcance

- `package.template.json` creado con `check:slice`, `check:pr`, `start:slice`, `cleanup:slice`
- `init-docs.sh` mergea o copia package.template.json al host
- `README.md` quickstart actualizado con los comandos npm

## Archivos

- `package.template.json`
- `scripts/init-docs.sh`
- `README.md`

## Cómo Probar (DETALLADO - OBLIGATORIO)

### Entorno Requerido

- bash, node ≥14, git

### Acceso al Worktree

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-02-executable-quickstart/slice.json
```

### Levantar el Proyecto

```bash
# No aplica
```

### Casos de Uso

#### Caso 1: Host sin package.json existente

1. Crear directorio vacío con docs-template/ clonado
2. Ejecutar `bash scripts/init-docs.sh "My Project"`
3. Verificar que se crea `package.json` con los 4 scripts

**Resultado esperado:** package.json con check:slice, check:pr, start:slice, cleanup:slice apuntando a tools/scripts/.

---

#### Caso 2: Host con package.json existente

1. Crear directorio con package.json que tiene scripts propios
2. Ejecutar `bash scripts/init-docs.sh "My Project"`
3. Verificar que scripts propios siguen intactos y los 4 nuevos fueron agregados

**Resultado esperado:** package.json mergeado sin perder scripts existentes.

---

### Verificación Técnica

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-02-executable-quickstart/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-02-executable-quickstart/slice.json
```

## Evidencia

- [ ] Output de init-docs.sh en ambos casos (con y sin package.json previo)
- [ ] `cat package.json` del host resultante

## Rollback

1. `git revert <commit-hash>`
2. Verificar que init-docs.sh ya no toca package.json

## Riesgos / Notas

- El merge de package.json usa Node. Si el host no tiene node instalado aún, init-docs.sh debe degradar a advertencia en vez de error.
