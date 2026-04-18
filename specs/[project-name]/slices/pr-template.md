# PR - [TICKET] - [Título del slice]

## Titulo

[Titulo corto y claro del cambio]

## Resumen

[Resumen breve del cambio: qué se implementó y por qué]

## Alcance

- [Cambio incluido 1]
- [Cambio incluido 2]
- [Exclusión relevante si aplica]

## Archivos

- `[archivo 1]`
- `[archivo 2]`

## Cómo Probar (DETALLADO - OBLIGATORIO)

### Entorno Requerido

- Node: [versión, ej: 20.x]
- [Prerequisito adicional: Android Studio, emulador levantado, dispositivo físico, etc.]
- [Variable de entorno o flag necesario si aplica]

### Acceso al Worktree

```bash
# Navegar al worktree del slice (si ya existe)
cd ../.worktrees/[repo-name]/[branch-name-sanitizado]

# O crear el worktree desde cero
npm run start:slice -- specs/[project-slug]/slices/[slice-id]/slice.json
```

### Levantar el Proyecto

```bash
# Web con build + Chrome en modo móvil (emulación, sin dispositivo — opción más rápida)
npm run web

# Web en modo dev (hot reload, sin emulación automática)
npm start

# Android (build + sync + abre Android Studio)
npm run android

# iOS (build + sync + abre Xcode — solo macOS)
npm run ios
```

### Casos de Uso

#### Caso 1: [Nombre descriptivo del caso]

**Prerequisito:** [estado inicial necesario — sesión activa, mock activado, dato específico, etc.]

1. [Paso exacto 1 — ruta, botón o acción]
2. [Paso exacto 2]
3. [Paso exacto 3]

**Resultado esperado:** [qué debe verse o suceder]

---

#### Caso 2: [Nombre descriptivo del caso]

**Prerequisito:** [estado inicial]

1. [Paso exacto 1]
2. [Paso exacto 2]

**Resultado esperado:** [qué debe verse o suceder]

---

### Verificación Técnica

```bash
# Gate de validación del slice (status, timestamps, acceptance)
npm run check:slice -- specs/[project-slug]/slices/[slice-id]/slice.json --gate validation

# Gate PR (incluye check-scope, pr.md, worktree limpio)
npm run check:pr -- specs/[project-slug]/slices/[slice-id]/slice.json

# Whitespace y conflictos
git diff --check

# Build sin errores
npm run build
```

1. [Chequeo adicional específico del slice si aplica — test, lint, etc.]

## Evidencia

- [Captura, log o señal verificable 1]
- [Captura, log o señal verificable 2]

## Rollback

1. `git revert [commit-hash]`
2. [Validar que el rollback quedó aplicado]
3. [Paso documental si el rollback afecta el estado del slice]

## Riesgos / Notas

- [Riesgo, limitación o siguiente hito]
