# CLOSURE_BRIEF - 06-slice

## Resultado

Completado como plan de comandos/wrappers.

## Evidencia

Plan por comando/namespace:

| Comando/namespace | Estado en `origin/main` | Decision |
|---|---|---|
| `slice ...` | Ya existe como namespace canonico en help | No re-agregar; comparar gaps antes de tocar |
| `handoff ...` | Ya existe como namespace canonico en help | No re-agregar; comparar gaps antes de tocar |
| `evidence list/show` | Ya existe en help | No importar version vieja sin diff contractual |
| `doctor` | Ya existe | Solo mejoras puntuales con antes/despues |
| `init` | Ya existe | Solo mejoras puntuales con side effects controlados |
| `analyze` | Ya existe y escribe docs/.quiver | Requiere sandbox/dry-run antes de cambios |
| `status` top-level | No aparece como top-level en baseline; existe `ai status` y `spec status` | Candidato nuevo solo si no colisiona y mejora es verificable |
| `changelog` top-level | No aparece como top-level en baseline; hay scripts/checks | Candidato nuevo separado, sin package/version |
| `ai` subcommands | Amplios y provider-aware | Separar por subcomando; depende de baseline adicional |

Reglas para cada implementacion futura:

- Un comando por unidad de cambio salvo dependencia justificada.
- Antes/despues obligatorio.
- Si cambia stdout/stderr, JSON, exit code o side effect, requiere aprobacion explicita.
- No tocar package/version.

## Cambios de comportamiento

Ninguno. Solo plan tecnico.

## Regresiones detectadas

Ninguna.

## Riesgos residuales

- `status` y `changelog` requieren decision de producto para evitar colision de UX.
- Comandos write-capable necesitan baseline adicional en sandbox antes de implementarse.

## Decision sobre ramas

Mantener ramas fuente hasta cerrar comparacion por comando. No importar wrappers en bloque.
