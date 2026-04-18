# Docs Template

Template de documentación para proyectos de software con IA agents.

## Quick Start

### Opción 1: Usar Script de Inicialización (Recomendado)

```bash
# Desde la raíz de tu proyecto
./docs-template/scripts/init-docs.sh "Nombre de Tu Proyecto"
```

Esto automáticamente:
- Crea estructura de directorios
- Copia templates con placeholders
- Reemplaza `{{PROJECT_NAME}}` con tu proyecto
- Crea archivos core listos para editar
- Copia `tools/scripts/start-slice.sh` para bootstrap de ramas/worktrees por slice
- Copia `check-slice-readiness.sh`, `check-pr-readiness.sh` y `cleanup-slice.sh` para enforcement del workflow

### Opción 2: Copiar Manualmente

```bash
# Copiar templates
cp -r docs-template/docs ../mi-proyecto/docs
cp -r docs-template/specs ../mi-proyecto/specs
cp -r docs-template/scripts ../mi-proyecto/scripts

# Editar archivos core
# (ver docs-template/TEMPLATE.md)
```

### Opción 3: Usar como Package NPM (Futuro)

```bash
# Próximamente
npx create-sdd-docs@latest "Mi Proyecto"
```

## Estructura

```
docs-template/
├── README.md                  ← Este archivo
├── TEMPLATE.md                ← Guía de personalización
│
├── docs/                      ← Documentación core
│   ├── INDEX.md.template      ← Índice maestro
│   ├── CONTEXTO.md.template   ← Contexto del proyecto
│   ├── STATUS.md.template     ← Estado (opcional)
│   ├── WORKFLOW.md.template   ← Workflow de implementación
│   ├── DOCUMENTATION_GUIDE.md ← Guía de documentación
│   ├── GITFLOW_PR_GUIDE.md    ← Git + PR guide
│   ├── UI_STANDARDS.md        ← Estándares UI
│   ├── MOCK_DATA_GUIDE.md     ← Guía de mock data
│   ├── TESTING_GUIDE_FOR_AI.md.template ← Testing para IA
│   └── ai/                    ← Configuración de IA
│       ├── PRINCIPLES.md      ← 4 principios fundamentales
│       ├── RULES.yaml         ← Reglas de comportamiento
│       └── LESSONS.md.template← Aprendizaje (vacío)
│
├── specs/                     ← Especificaciones
│   └── [project-name]/
│       ├── SPEC.md.template   ← Template de especificación
│       └── slices/
│           └── slice-template/
│               ├── slice.json
│               └── pr.md.template
│
├── specs-fix/                 ← Fixes de bugs (se crea cuando hay errores)
│   └── [fix-name]/
│       ├── SPEC.md.template   ← Especificación del fix
│       └── slices/
│           └── slice-XX-fix-*/
│               ├── slice.json
│               └── pr.md
│
└── scripts/                   ← Scripts de utilidad
    ├── init-docs.sh           ← Inicialización
    ├── start-slice.sh         ← Bootstrap de rama/worktree por slice
    ├── check-slice-readiness.sh ← Gate de ejecución/validación del slice
    ├── check-pr-readiness.sh  ← Gate de apertura de PR
    ├── check-scope.sh         ← Detecta archivos fuera del scope declarado en slice.json
    ├── cleanup-slice.sh       ← Cleanup / congelado de worktrees
    ├── refresh-active-slices.sh ← Tablero local de slices activos
    └── migrate-project.sh     ← Migración
```

## Archivos Obligatorios vs Opcionales

### Obligatorios (Core)
- `INDEX.md` - Índice maestro
- `CONTEXTO.md` - Contexto del proyecto
- `WORKFLOW.md` - Workflow de implementación
- `ai/PRINCIPLES.md` - Principios de IA
- `ai/RULES.yaml` - Reglas de IA
- `TESTING_GUIDE_FOR_AI.md` - Guía de testing para IA

### Opcionales (Según Proyecto)
- `STATUS.md` - Estado del proyecto (recomendado para MVP+)
- `ai/LESSONS.md` - Lessons aprendidos (si usás IA agents)
- `tools/` - Documentación de herramientas (Playwright, ESLint, etc.)
- `api/` - API Reference (si tenés backend)
- `specs-fix/` - Fixes de bugs (se crea cuando hay errores)
- `docs/BUGS_FOUND/` - Bugs encontrados (se crea cuando hay errores)

## Personalización

Ver **[TEMPLATE.md](./TEMPLATE.md)** para guía completa de personalización.

## Uso con IA Agents

Este template está diseñado para ser leído por IA agents (Qwen Code, Claude Code, Cursor).

### Para IA Agents

**Guía específica:** [README_FOR_AI.md](./README_FOR_AI.md)

Esta guía incluye:
- Cómo inicializar un proyecto nuevo
- Qué archivos son genéricos vs específicos
- Reglas críticas para IA
- Placeholders y reemplazos
- Ejemplos por tipo de proyecto
- **Testing guide:** Cómo ejecutar tests y generar specs-fix para errores ⭐

### Flujo de Testing para IA

```
1. Leer SPEC del slice
   ↓
2. Implementar cambios
   ↓
3. Ejecutar tests (smoke + específicos)
   ↓
4. ¿Tests pasaron?
   ├─ SÍ → Actualizar documentación
   └─ NO → Generar spec-fix
       ├─ Documentar bug en docs/BUGS_FOUND/
       ├─ Crear spec-fix en specs-fix/[proyecto-fix]/
       └─ Actualizar STATUS.md
   ↓
5. Actualizar STATUS.md y evidencias
```

**Ver:** `docs/TESTING_GUIDE_FOR_AI.md.template` para guía completa de testing.

### Para Humanos

**Orden de lectura recomendado:**
1. `docs/ai/PRINCIPLES.md` - Principios fundamentales
2. `docs/ai/RULES.yaml` - Reglas de comportamiento
3. `docs/CONTEXTO.md` - Contexto del proyecto
4. `docs/STATUS.md` - Estado actual
5. `docs/TESTING_GUIDE_FOR_AI.md` - Guía de testing ⭐
6. `specs/[project]/slices/[slice-id]/slice.json` - Slice actual
7. `tools/scripts/start-slice.sh specs/[project]/slices/[slice-id]/slice.json` - Crear rama + worktree del slice
8. `tools/scripts/check-slice-readiness.sh specs/[project]/slices/[slice-id]/slice.json --gate execution` - Gate previo a ejecución
9. `tools/scripts/check-pr-readiness.sh specs/[project]/slices/[slice-id]/slice.json` - Gate previo a PR

## Licencia

MIT
