# Guía de Personalización del Template

**Propósito:** Cómo adaptar este template a tu proyecto específico

---

## 📋 Flujo de Personalización

### Paso 1: Ejecutar Script de Inicialización

```bash
./scripts/init-docs.sh "Nombre de Tu Proyecto"
```

Esto automáticamente:
- Copia templates a tu proyecto
- Reemplaza placeholders (`{{PROJECT_NAME}}`, etc.)
- Crea estructura de directorios base

### Paso 2: Editar Archivos Core

#### 1. `docs/CONTEXTO.md`

**Qué editar:**
```markdown
# {{PROJECT_NAME}} - Contexto

**Fecha:** {{FECHA}}
**Estado:** {{ESTADO}}

## ¿Qué es {{PROJECT_NAME}}?
[Completar con descripción de tu proyecto]

### Propuesta de Valor
> "[Tu tagline]"

## Target
[Describir usuario principal]
```

**Tiempo:** 15-30 min

---

#### 2. `docs/STATUS.md`

**Qué editar:**
```markdown
# {{PROJECT_NAME}} Status

**Última actualización:** {{FECHA}}

## Estado General
**Progreso:** {{X}}% completo
**Próximo hito:** [Descripción]

## Slices/Tareas
| ID | Título | Estado | Progreso |
|----|--------|--------|----------|
| 01 | [Nombre] | ✅ | 100% |
```

**Tiempo:** 10 min

---

#### 3. `docs/WORKFLOW.md`

**Qué editar:**
- Sección de "Stack Tecnológico"
- Comandos específicos de tu proyecto
- Estructura de directorios

**Tiempo:** 20-30 min

---

#### 4. `specs/[project-name]/SPEC.md`

**Qué editar:**
```markdown
# {{PROJECT_NAME}}

## Objetivo
[Objetivo general del proyecto]

## Alcance
- ✅ [Feature 1]
- ✅ [Feature 2]
- ❌ [Feature excluido]

## Timeline
- [Fase 1]: [Fecha]
- [Fase 2]: [Fecha]
```

**Tiempo:** 15 min

---

### Paso 3: Configurar IA (Opcional)

Si usás IA agents (Qwen Code, Claude Code, Cursor):

#### 1. `docs/ai/PRINCIPLES.md`

**Recomendación:** Mantener los 4 principios base, agregar específicos de tu proyecto.

---

#### 2. `docs/ai/RULES.yaml`

**Recomendación:** Personalizar reglas según tu workflow.

---

#### 3. `docs/ai/LESSONS.md`

**Recomendación:** Empezar vacío. Se llena con el tiempo.

---

### Paso 4: Archivos Opcionales

#### Agregar si corresponde:

| Archivo | Cuándo Agregar |
|---------|----------------|
| `docs/api/README.md` | Si tenés backend/API |
| `docs/tools/playwright/` | Si usás Playwright |
| `specs/[project]/slices/[slice-id]/pr.md` | Para archivar el PR de cada slice |
| `docs/STATUS.md` | Si el proyecto es MVP+ |

#### Eliminar si no corresponde:

| Archivo | Cuándo Eliminar |
|---------|-----------------|
| `docs/UI_STANDARDS.md` | Si no tenés UI |
| `docs/MOCK_DATA_GUIDE.md` | Si no usás mocks |
| `docs/tools/` | Si no usás esas herramientas |

---

## 🎯 Checklist de Personalización

### Setup Inicial (30 min)

```markdown
- [ ] Ejecutar `./scripts/init-docs.sh "Nombre Proyecto"`
- [ ] Editar `docs/CONTEXTO.md`
- [ ] Editar `docs/STATUS.md` (si aplica)
- [ ] Editar `specs/[project]/SPEC.md`
- [ ] Crear primer directorio de slice en `specs/[project]/slices/[slice-id]/`
```

### Configuración de IA (15 min, opcional)

```markdown
- [ ] Revisar `docs/ai/PRINCIPLES.md`
- [ ] Personalizar `docs/ai/RULES.yaml`
- [ ] Dejar `docs/ai/LESSONS.md` vacío (se llena solo)
```

### Archivos Específicos (variable)

```markdown
- [ ] Agregar `docs/api/` si hay backend
- [ ] Agregar `docs/tools/` si hay herramientas específicas
- [ ] Eliminar archivos no relevantes
```

---

## 📊 Tiempos Estimados

| Tarea | Tiempo |
|-------|--------|
| **Setup inicial** | 30 min |
| **Configurar IA** | 15 min |
| **Primer slice** | 20 min |
| **TOTAL** | ~1 hora |

---

## ⚠️ Errores Comunes

### 1. Sobrecargar CONTEXTO.md

**Mal:**
```markdown
# Contexto (5000 líneas)
- Historia del proyecto
- Análisis de competencia
- Cada decisión técnica
```

**Bien:**
```markdown
# Contexto (200 líneas máximo)
- Qué es el proyecto
- Target
- Stack tecnológico
```

---

### 2. Ignorar STATUS.md

**Mal:**
- STATUS.md desactualizado por 3 meses
- Nadie sabe el estado real

**Bien:**
- STATUS.md actualizado por slice
- Estado visible en 10 segundos

---

### 3. Templates vs Implementación

**Mal:**
- Mezclar template con contenido específico
- No saber qué es portable

**Bien:**
- `docs-template/` = templates portables
- `docs/` = contenido específico del proyecto

---

## 🔗 Recursos

| Recurso | Ubicación |
|---------|-----------|
| **Template Principal** | `./README.md` |
| **Scripts** | `./scripts/` |
| **Ejemplo Real** | `../docs/` (project-specific) |

---

**Fin de la guía**
