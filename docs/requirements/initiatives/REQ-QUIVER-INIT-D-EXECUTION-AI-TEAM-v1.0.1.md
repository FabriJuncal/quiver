---
artifact_id: "REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM"
artifact_type: "requirements"
version: "1.0.1"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM-v1.0.0.md"
catalog:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0.8"
  path: "../REQ-QUIVER-PRODUCT-CATALOG-v6.0.8.md"
derived_from:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0"
  path: "../Quiver_Especificaciones_Requerimientos_v6.md"
source_specs:
  - "SPEC-V77"
  - "SPEC-V78"
  - "SPEC-V79"
  - "SPEC-V80"
  - "SPEC-V81"
source_section_sha256: "eef345a5cd36b9a0867a194fc53d88fbafbc65cedf5bf8450202190670b82a73"
related_plans:
  - artifact_id: "PLAN-QUIVER-MASTER"
    catalog_path: "../../plans/README.md"
  - artifact_id: "PLAN-QUIVER-INIT-D-EXECUTION-AI-TEAM"
    catalog_path: "../../plans/README.md"
decisions:
  - decision_id: "DEC-20260903-006"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Extraer SPEC-V77–SPEC-V81 como iniciativa D"
    reason: "Reducir el contexto por tarea sin duplicar el rol de las specs ejecutables"
    impact: "Crea una iniciativa versionable con 5 specs y 46 requisitos; no cambia alcance"
  - decision_id: "DEC-20260903-046"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Agregar el plan específico de la iniciativa D como relación durable"
    reason: "La cadena C fue aprobada y el workflow habilita planificar D"
    impact: "Actualiza metadata y bindings; no cambia los 46 requisitos ni sus criterios"
---

# Iniciativa D — Execution y equipo IA

## Objetivo de la iniciativa

Habilitar runtimes reemplazables, aislamiento, permisos, equipo dinámico, evals y gobernanza preventiva de costos.

## Alcance y secuencia

- **Hito:** Hito D — Quiver Execution Team.
- **Specs incluidas:** `SPEC-V77`, `SPEC-V78`, `SPEC-V79`, `SPEC-V80`, `SPEC-V81`.
- **Requisitos incluidos:** 46.
- **Gate canónico:** G3 precede SPEC-V77.
- Las dependencias declaradas dentro de cada spec conservan precedencia.
- Independiente significa versionable y planificable como unidad; no autoriza
  ejecutar una spec antes de cerrar sus dependencias y gates.

## Contratos compartidos

- [Catálogo segmentado v6.0.8](../REQ-QUIVER-PRODUCT-CATALOG-v6.0.8.md)
- [Plan maestro efectivo v6.0.10](../../plans/PLAN-QUIVER-MASTER-v6.0.10.md)
- [Plan de la iniciativa D v1.0.0](../../plans/PLAN-QUIVER-INIT-D-EXECUTION-AI-TEAM-v1.0.0.md)
- [Trazabilidad completa RQ v4 → SPEC v6](../traceability/TRACE-QUIVER-V4-TO-V6-v1.0.0.md)

## Especificaciones incluidas

## SPEC-V77 — AgentRuntime Contract & Workspace Isolation

**Versión:** `v77`<br>
**Slug sugerido:** `quiver-v77-agent-runtime-workspace-isolation`<br>
**Componente:** Quiver Engine + Cloud / Execution<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G3 + SPEC-V62 + SPEC-V76

### Problema / objetivo

Generalizar la ejecución para que Quiver pueda cambiar de agente/runtime sin perder contratos, aislamiento ni evidencia.

### Resultado que debe percibir el usuario

Quiver puede elegir o cambiar el ejecutor sin que el proyecto dependa de un único proveedor.

### Dolor(es) del catálogo de builders que ataca

Secciones: `63–68, 111–115, 135–142, 168–179, 182–183` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-085–RQ-088; RQ-099

### Requerimientos

#### V77-RQ-01

Definir AgentRuntime neutral con start, inspect, stream, input, approval, cancel y collectArtifacts; resume solo cuando capability exista.

#### V77-RQ-02

Implementar adapters iniciales para Codex y al menos un segundo runtime antes de declarar neutralidad estable.

#### V77-RQ-03

Detectar capabilities reales en vez de asumir pause, resume, network o tools.

#### V77-RQ-04

Crear workspace aislado por run mediante worktree, clone, container o workspace remoto.

#### V77-RQ-05

Registrar base SHA, branch, runtime, modelo resuelto y environment fingerprint.

#### V77-RQ-06

No permitir que el runtime decida el estado DONE contractual.

#### V77-RQ-07

Normalizar eventos sin descartar payload/provider metadata necesarios para debug.

#### V77-RQ-08

Conformance tests para cada adapter.

### Criterios de aceptación

- El mismo slice puede ejecutarse con dos adapters bajo el mismo output contract.
- Dos runs no comparten directorio mutable.
- Una capability ausente produce un estado explícito.

### Fuera de alcance

- Orchestrator durable completo
- Producción

---

## SPEC-V78 — Permission Envelopes, Checkpoints & Leases

**Versión:** `v78`<br>
**Slug sugerido:** `quiver-v78-permission-checkpoint-leases`<br>
**Componente:** Quiver Engine + Cloud / Execution<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77

### Problema / objetivo

Hacer la ejecución resumible, limitada y segura bajo concurrencia.

### Resultado que debe percibir el usuario

Cada agente recibe solo los permisos necesarios; si se interrumpe, Quiver continúa sin empezar todo de cero.

### Dolor(es) del catálogo de builders que ataca

Secciones: `23, 63, 69–80, 105–115, 135–137, 168, 176–179` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-087–RQ-090; RQ-111

### Requerimientos

#### V78-RQ-01

Emitir Permission Envelope inmutable con filesystem, commands, network, tools, secrets y producción.

#### V78-RQ-02

Aplicar default deny a producción y secretos.

#### V78-RQ-03

Permitir grants puntuales con scope, actor, razón, expiración y uso acotado.

#### V78-RQ-04

Crear checkpoints de pasos completados, artifacts, SHA y findings.

#### V78-RQ-05

Reanudar desde checkpoint sin repetir evidencia válida contra el mismo estado.

#### V78-RQ-06

Usar leases/fencing tokens para resources compartidos y detectar workers stale.

#### V78-RQ-07

Distinguir timeout de runtime, comando, aprobación y orquestación.

#### V78-RQ-08

Usar credenciales efímeras por referencia y revocarlas al cancelar cuando sea posible.

### Criterios de aceptación

- Un agente no escribe fuera de scope.
- Un run interrumpido puede reanudarse.
- Dos agentes no toman el mismo slice sin policy explícita.
- Los secretos no aparecen en evidence.

### Fuera de alcance

- Permisos enterprise multi-región
- Secret manager propio obligatorio

---

## SPEC-V79 — Dynamic AI Product & Engineering Team

**Versión:** `v79`<br>
**Slug sugerido:** `quiver-v79-dynamic-ai-product-engineering-team`<br>
**Componente:** Quiver Studio + Cloud / Execution<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V65, SPEC-V66, SPEC-V77, SPEC-V78

### Problema / objetivo

Materializar la promesa de “equipo completo” como capacidades coordinadas, no como personajes artificiales o múltiples chats.

### Resultado que debe percibir el usuario

Siento que producto, diseño, desarrollo, QA, seguridad y release están cubiertos, pero sigo hablando con una sola interfaz.

### Dolor(es) del catálogo de builders que ataca

Secciones: `64–68, 84–89, 111–115, 129–154, 175–179, 190–194` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Combina roles de RQ-038, Skills RQ-062–RQ-074 y nueva UX de equipo dinámico

### Requerimientos

#### V79-RQ-01

Quiver Lead debe seguir siendo la interfaz principal y accountable de comunicación.

#### V79-RQ-02

Definir capacidades: Product, UX/UI, Architecture, Frontend, Backend, Data, QA, Security, DevOps/Release, Reviewer e Incident.

#### V79-RQ-03

Activar el equipo mínimo necesario según tipo de tarea, riesgo y stack.

#### V79-RQ-04

No ejecutar todos los roles por defecto ni simular conversaciones para crear sensación de actividad.

#### V79-RQ-05

Cada capacidad debe producir un deliverable verificable, no solo texto narrativo.

#### V79-RQ-06

Separar executor y reviewer/QA en high-assurance.

#### V79-RQ-07

Permitir que humanos ocupen o compartan roles junto a agentes.

#### V79-RQ-08

Mostrar al usuario equipo activado, resultado de cada capacidad y decisiones pendientes, no razonamiento interno.

#### V79-RQ-09

La composición del equipo debe considerar costo y latencia.

#### V79-RQ-10

Registrar ownership de cada cambio y handoff.

### Criterios de aceptación

- Una tarea simple no activa un equipo costoso.
- Una tarea sensible activa seguridad/QA apropiados.
- El usuario no necesita coordinar agentes individuales.
- Cada rol visible tiene un resultado tangible.

### Fuera de alcance

- Avatares/personas obligatorias
- Reuniones de agentes visibles
- Organigrama fijo

---

## SPEC-V80 — Skills, Evals & Model/Runtime Quality

**Versión:** `v80`<br>
**Slug sugerido:** `quiver-v80-skills-evals-model-runtime-quality`<br>
**Componente:** Quiver Engine + Cloud / Execution Reliability<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77, SPEC-V79

### Problema / objetivo

Medir procedimientos, modelos y runtimes con regresiones reales antes de expandir autonomía.

### Resultado que debe percibir el usuario

Quiver usa la combinación adecuada para el trabajo y puede demostrar si una actualización mejoró o empeoró la calidad.

### Dolor(es) del catálogo de builders que ataca

Secciones: `53–54, 114–115, 165–179, 182–183, 197` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-053–RQ-067; RQ-076–RQ-084; RQ-102–RQ-106; RQ-119

### Requerimientos

#### V80-RQ-01

Mantener Skills project-scoped, versionadas, portables y con supply-chain lock.

#### V80-RQ-02

Comenzar con un conjunto pequeño: workflow, requirement triage, execute, review, recovery y QA; ampliar solo por repetición real.

#### V80-RQ-03

Mantener Provider Packs como conocimiento, no como ejecutores con secretos.

#### V80-RQ-04

Crear eval scenarios reproducibles derivados de tareas e incidentes reales.

#### V80-RQ-05

Medir activación, outcome, scope violation, costo, turns y Critical failures.

#### V80-RQ-06

Priorizar scorers determinísticos; model graders no pueden convertir un hard failure en pass.

#### V80-RQ-07

Comparar experimentos fijando runtime, modelo, Skill, policy, contexto y environment.

#### V80-RQ-08

Bloquear actualizaciones que regresan por encima del umbral.

#### V80-RQ-09

Permitir routing simple basado en clase de tarea solo después de tener baselines.

#### V80-RQ-10

No autoactualizar modelos críticos en high-assurance sin eval.

### Criterios de aceptación

- Una Skill degradada no se distribuye silenciosamente.
- La misma suite compara dos runtimes.
- Los Critical failures permanecen visibles aunque el promedio sea bueno.

### Fuera de alcance

- Marketplace público
- Auto-routing opaco y altamente dinámico

---

## SPEC-V81 — Cost Governance & TraceBudget

**Versión:** `v81`<br>
**Slug sugerido:** `quiver-v81-cost-governance-tracebudget`<br>
**Componente:** Quiver Cloud / Execution Economics<br>
**Repositorio objetivo:** `quiver-cloud + tracebudget-adapter`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77, SPEC-V79, SPEC-V80

### Problema / objetivo

Hacer predecible y preventivo el costo de un equipo de agentes.

### Resultado que debe percibir el usuario

Antes de ejecutar sé el rango y límite; Quiver no consume indefinidamente arreglando sus propios errores.

### Dolor(es) del catálogo de builders que ataca

Secciones: `10, 50–56, 106–109, 138, 173–179` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-107–RQ-109; TraceBudget de v4

### Requerimientos

#### V81-RQ-01

Definir presupuesto por Feature Delivery/run y subpresupuestos por fase cuando haga falta.

#### V81-RQ-02

Estimar y reservar costo máximo antes de una llamada o acción costosa.

#### V81-RQ-03

Reconciliar costo real y liberar reserva no usada.

#### V81-RQ-04

Evitar doble reserva bajo concurrencia.

#### V81-RQ-05

Atribuir costo a organización, proyecto, feature, role, runtime, modelo y resultado.

#### V81-RQ-06

Mostrar al usuario costo acumulado y límite sin exponer complejidad de tokens si no la pide.

#### V81-RQ-07

Al agotarse, detener o solicitar aumento; no continuar silenciosamente.

#### V81-RQ-08

Integrar TraceBudget mediante CostController neutral, con fallback local para desarrollo.

#### V81-RQ-09

Medir costo por PR aprobado, feature completada y QA pass.

#### V81-RQ-10

No basar el negocio en arbitraje de suscripciones personales de proveedores de IA.

### Criterios de aceptación

- Un run no supera su presupuesto configurado silenciosamente.
- Se puede explicar qué parte del equipo consumió costo.
- Una reparación repetida aparece como costo de retrabajo.

### Fuera de alcance

- Billing final del SaaS
- FinOps cloud completo

---
