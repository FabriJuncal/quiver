---
artifact_id: "REQ-QUIVER-INIT-A-ENGINE-TRUST"
artifact_type: "requirements"
version: "1.0.3"
status: "Aprobado"
lifecycle_status: "approved"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./REQ-QUIVER-INIT-A-ENGINE-TRUST-v1.0.2.md"
catalog:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0.4"
  path: "../REQ-QUIVER-PRODUCT-CATALOG-v6.0.4.md"
derived_from:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0"
  path: "../Quiver_Especificaciones_Requerimientos_v6.md"
source_specs:
  - "SPEC-V58"
  - "SPEC-V59"
  - "SPEC-V60"
  - "SPEC-V61"
  - "SPEC-V62"
source_section_sha256: "5303381600fd6b8e5865bcb1a7ee3ab9fe474ef0eafcb304dde4699fce4e84fe"
related_plans:
  - artifact_id: "PLAN-QUIVER-MASTER"
    catalog_path: "../../plans/README.md"
  - artifact_id: "PLAN-QUIVER-INIT-A-ENGINE-TRUST"
    catalog_path: "../../plans/README.md"
decisions:
  - decision_id: "DEC-20260903-003"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Extraer SPEC-V58–SPEC-V62 como iniciativa A"
    reason: "Reducir el contexto por tarea sin duplicar el rol de las specs ejecutables"
    impact: "Crea una iniciativa versionable con 5 specs y 46 requisitos; no cambia alcance"
  - decision_id: "DEC-20260903-013"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Agregar el plan específico de la iniciativa A como relación durable"
    reason: "Cumplir la trazabilidad bidireccional antes de solicitar aprobación del plan"
    impact: "Actualiza metadata y bindings; no cambia los 46 requisitos ni sus criterios"
  - decision_id: "DEC-20260903-017"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Reconciliar el estado de SPEC-V58 con el merge verificado de PR #144"
    reason: "Resolver PLAN-A-REV-02 y eliminar contradicciones de readiness"
    impact: "Actualiza estado y bindings documentales; no cambia requisitos ni criterios"
  - decision_id: "DEC-20260903-021"
    date: "2026-09-03"
    actor: "project-owner"
    change: "Aprobar la baseline de requerimientos de la iniciativa A"
    reason: "Aprobación explícita de la cadena documental A sobre REQ-A 1.0.2"
    impact: "Crea la revisión aprobada 1.0.3; habilita aprobar PLAN-A sin iniciar implementación"
---

# Iniciativa A — Quiver Engine y fundamentos de confianza

## Objetivo de la iniciativa

Consolidar governance, integridad de drafts, Project Brain, selección de contexto y contratos de máquina antes de construir Studio.

## Alcance y secuencia

- **Hito:** Hito A — Quiver Engine confiable.
- **Specs incluidas:** `SPEC-V58`, `SPEC-V59`, `SPEC-V60`, `SPEC-V61`, `SPEC-V62`.
- **Requisitos incluidos:** 46.
- **Gate canónico:** Sin gate comercial de entrada; las dependencias por spec siguen siendo obligatorias.
- Las dependencias declaradas dentro de cada spec conservan precedencia.
- Independiente significa versionable y planificable como unidad; no autoriza
  ejecutar una spec antes de cerrar sus dependencias y gates.

## Contratos compartidos

- [Catálogo segmentado v6.0.4](../REQ-QUIVER-PRODUCT-CATALOG-v6.0.4.md)
- [Plan maestro efectivo v6.0.4](../../plans/PLAN-QUIVER-MASTER-v6.0.4.md)
- [Plan aprobado de la iniciativa A v1.0.2](../../plans/PLAN-QUIVER-INIT-A-ENGINE-TRUST-v1.0.2.md)
- [Trazabilidad completa RQ v4 → SPEC v6](../traceability/TRACE-QUIVER-V4-TO-V6-v1.0.0.md)

## Especificaciones incluidas

## SPEC-V58 — Risk-aware Review Governance

**Versión:** `v58`<br>
**Slug sugerido:** `quiver-v58-risk-aware-review-governance`<br>
**Componente:** Quiver Engine<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 0 — Trabajo comprometido<br>
**Estado:** `COMPLETED`<br>
**Dependencias:** Ninguna nueva; continuar la SPEC existente

### Problema / objetivo

Cerrar la gobernanza de revisión sensible al riesgo ya aprobada, sin ampliar su alcance.

### Resultado que debe percibir el usuario

Quiver distingue qué problemas deben bloquear ahora, cuáles pueden transferirse y qué aprobación humana cubre exactamente cada decisión.

### Dolor(es) del catálogo de builders que ataca

Secciones: `04, 10, 11, 12, 69–73, 129–134, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-001–RQ-009; RQ-029; límite de identidad de RQ-100

### Requerimientos

#### V58-RQ-01

Conservar los perfiles fast-delivery y high-assurance con rigurosidad proporcional al riesgo.

#### V58-RQ-02

Mantener findings estructurados con severidad, categoría, fase responsable, evidencia y disposición.

#### V58-RQ-03

Bloquear una fase solamente por findings que pertenecen realmente a esa fase según policy.

#### V58-RQ-04

Limitar las revisiones semánticas y detener loops con una decisión humana explícita.

#### V58-RQ-05

Soportar approved-with-conditions sin presentarlo como aprobación incondicional.

#### V58-RQ-06

Vincular decisiones a actor, versión, digest, findings y policy exactos.

#### V58-RQ-07

Transferir findings a spec, slice, PR o follow-up sin perder identidad ni trazabilidad.

#### V58-RQ-08

Cerrar la migración, compatibilidad, documentación y evidencia de las slices restantes sin iniciar v59 desde la rama de v58.

### Criterios de aceptación

- Slices 00–06 cerradas con evidencia y revisión humana donde corresponda.
- Ningún finding desaparece sin disposición.
- Una revisión agotada no regenera indefinidamente el plan.
- Las salidas humana y machine-readable representan la misma decisión.

### Fuera de alcance

- Builder visual
- Project Brain
- Quiver Cloud
- AgentRuntime general
- Orquestación durable

---

## SPEC-V59 — Draft Integrity & Effective Contracts

**Versión:** `v59`<br>
**Slug sugerido:** `quiver-v59-draft-integrity-effective-contracts`<br>
**Componente:** Quiver Engine + CLI<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V58

### Problema / objetivo

Evitar pérdida de contenido al revisar artefactos y permitir volver a una versión válida sin hacks manuales.

### Resultado que debe percibir el usuario

El usuario puede comparar, rechazar, recuperar y complementar una versión sin perder decisiones anteriores.

### Dolor(es) del catálogo de builders que ataca

Secciones: `02–06, 10, 117–119, 143–148` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-010–RQ-019; RQ-022; RQ-024

### Requerimientos

#### V59-RQ-01

Definir estados explícitos de draft: draft, current, reviewed, approved, approved-with-conditions, rejected, superseded y corrupted.

#### V59-RQ-02

Permitir seleccionar, revisar y aprobar una versión anterior si sus inputs siguen vigentes.

#### V59-RQ-03

Permitir rollback del puntero current sin eliminar ninguna versión histórica.

#### V59-RQ-04

Crear addendums de primera clase para cambios acotados sin regenerar artefactos extensos.

#### V59-RQ-05

Agregar amendments determinísticos para cambios estructurados cuando el formato lo permita.

#### V59-RQ-06

Detectar content loss mediante IDs, colecciones requeridas, referencias y preservación estructural.

#### V59-RQ-07

Marcar una versión defectuosa como corrupted sin invalidar automáticamente la anterior.

#### V59-RQ-08

Separar retry técnico de nueva revisión semántica y conservar lineage completo.

### Criterios de aceptación

- Un draft con pérdida de contenido no puede convertirse en current silenciosamente.
- Una versión válida anterior puede recuperarse sin editar metadata manualmente.
- Un addendum produce un contrato efectivo verificable.
- La comparación muestra qué cambió y qué se preservó.

### Fuera de alcance

- Editor visual de documentos
- Sincronización con Obsidian
- Nuevos agentes o runtimes

---

## SPEC-V60 — Project Brain & Open Knowledge Vault Foundation

**Versión:** `v60`<br>
**Slug sugerido:** `quiver-v60-project-brain-open-knowledge-vault`<br>
**Componente:** Quiver Protocol + Engine + CLI<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V58; puede avanzar en paralelo con parte de SPEC-V59

### Problema / objetivo

Crear una memoria estructurada, durable, trazable y abierta por proyecto, sin convertir el historial de chat ni Obsidian en fuente de verdad.

### Resultado que debe percibir el usuario

Quiver recuerda qué es el producto, qué decisiones siguen vigentes y por qué, sin que el usuario deba documentar manualmente.

### Dolor(es) del catálogo de builders que ataca

Secciones: `02–06, 65–68, 116–124, 139–149, 183–185, 200–204` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Amplía RQ-075, RQ-093, RQ-096 y P-20 de v4; incorpora nuevos contratos de Project Brain

### Requerimientos

#### V60-RQ-01

Crear automáticamente un Project Brain para cada proyecto Quiver.

#### V60-RQ-02

Representar conocimiento como registros tipados: hecho verificado, requirement, decisión, supuesto, riesgo, finding, restricción, aprendizaje, release e incidente.

#### V60-RQ-03

Cada registro debe conservar fuente, fecha, estado de vigencia, autoridad, reemplazo y provenance.

#### V60-RQ-04

Definir precedencia explícita: policy > decisión aprobada > requirement > input autorizado > supuesto del agente.

#### V60-RQ-05

Prohibir secretos y estado operativo efímero dentro del Project Brain.

#### V60-RQ-06

Generar una representación abierta en Markdown + YAML + enlaces, denominada Open Knowledge Vault.

#### V60-RQ-07

El formato del vault debe poder abrirse con Obsidian, pero Quiver no debe depender de Obsidian, Obsidian Sync ni Obsidian Headless.

#### V60-RQ-08

Permitir exportar el Project Brain completo sin perder IDs, relaciones, fuentes y vigencia.

#### V60-RQ-09

Distinguir la fuente canónica de conocimiento del cache o índice usado para búsquedas.

#### V60-RQ-10

Mostrar al usuario qué memoria está activa, qué guarda, qué excluye y cómo eliminarla o exportarla.

### Criterios de aceptación

- Un proyecto nuevo obtiene un Brain utilizable sin instalar Obsidian.
- Una decisión reemplazada no aparece como vigente.
- El vault puede abrirse como carpeta Obsidian sin conversión propietaria.
- Ningún secreto de fixtures de seguridad queda persistido en el vault.

### Fuera de alcance

- Plugin de Obsidian
- Obsidian Sync obligatorio
- Base de datos operacional dentro de Markdown
- Memoria que modifica contratos sin aprobación

---

## SPEC-V61 — Context Selection, Contradictions & Impact Graph

**Versión:** `v61`<br>
**Slug sugerido:** `quiver-v61-context-selection-impact-graph`<br>
**Componente:** Quiver Engine<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60

### Problema / objetivo

Transformar el Project Brain y el repositorio en contexto mínimo y relevante, detectando contradicciones e impacto antes de cambiar software.

### Resultado que debe percibir el usuario

Antes de construir, Quiver explica qué entendió, qué puede verse afectado y qué decisión falta.

### Dolor(es) del catálogo de builders que ataca

Secciones: `03, 04, 07, 08, 14–16, 111–119, 139–150, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-093–RQ-096; RQ-118; amplía dependency/code/semantic graph de dolores 139–142

### Requerimientos

#### V61-RQ-01

Crear un Context Manifest por tarea con fuentes, digest, autoridad, confianza, vigencia y razón de inclusión.

#### V61-RQ-02

Seleccionar contexto por tarea en lugar de enviar el Project Brain completo.

#### V61-RQ-03

Detectar contradicciones entre requirements, decisiones, policy, documentación y comportamiento observado.

#### V61-RQ-04

Elevar contradicciones relevantes en vez de elegir una interpretación silenciosamente.

#### V61-RQ-05

Construir un grafo de impacto que relacione requirements, módulos, datos, permisos, APIs, UI, tests e integraciones.

#### V61-RQ-06

Presentar un resumen comprensible de impacto: qué cambia, qué puede romperse, qué queda fuera y qué debe verificarse.

#### V61-RQ-07

Aplicar presupuesto de contexto y divulgación progresiva; nunca truncar contratos obligatorios en silencio.

#### V61-RQ-08

Marcar el contexto como stale cuando cambie una fuente contractual relevante.

#### V61-RQ-09

Separar instrucciones confiables de contenido no confiable para evitar prompt injection.

#### V61-RQ-10

Permitir consultar por qué una pieza de contexto fue incluida o excluida.

### Criterios de aceptación

- Una tarea pequeña recibe contexto acotado y explicable.
- Un requirement contradictorio bloquea o solicita decisión antes de implementar.
- Quiver puede enumerar áreas afectadas antes del cambio.
- Un cambio del requirement vuelve stale una ejecución todavía no iniciada.

### Fuera de alcance

- Indexar toda herramienta externa
- Knowledge graph empresarial multi-repo
- Memoria opaca no exportable

---

## SPEC-V62 — Machine Contract & Provenance Foundation

**Versión:** `v62`<br>
**Slug sugerido:** `quiver-v62-machine-contract-provenance-foundation`<br>
**Componente:** Quiver Protocol + Engine + CLI<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V58; integra con SPEC-V59–V61

### Problema / objetivo

Estabilizar los contratos de máquina, lineage y separación contrato/estado que consumirán Studio y Cloud.

### Resultado que debe percibir el usuario

Quiver puede demostrar de forma consistente qué versión, requisito, decisión y evidencia corresponde a cada resultado.

### Dolor(es) del catálogo de builders que ataca

Secciones: `11–12, 34–37, 65–80, 117–134, 195–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-020–RQ-021; RQ-096–RQ-100; RQ-117–RQ-118

### Requerimientos

#### V62-RQ-01

Separar artefacto contractual de estado mutable de ejecución.

#### V62-RQ-02

Definir Artifact Envelope común con ID, tipo, versión, digest, parents, inputs, actor y estado.

#### V62-RQ-03

Definir relaciones de lineage: derives-from, supersedes, amends, verifies, executes, approves y deploys.

#### V62-RQ-04

Ofrecer salida JSON estable, versionada y sin banners para comandos P0.

#### V62-RQ-05

Definir códigos de error y clases de exit estables para validación, policy, capability, runtime, seguridad, conflicto y presupuesto.

#### V62-RQ-06

Hacer que la salida humana derive del mismo resultado canónico que JSON.

#### V62-RQ-07

Permitir validación determinística offline cuando el artefacto lo permita.

#### V62-RQ-08

Introducir actor ID y autorización verificable para nuevas decisiones de governance.

#### V62-RQ-09

Incorporar policy explain/dry-run para que todo bloqueo tenga regla, motivo y remediación.

#### V62-RQ-10

Mantener compatibilidad de lectura con artifacts legacy sin elevarlos a verified.

### Criterios de aceptación

- Studio y Cloud pueden consumir Quiver sin parsear texto libre.
- Se puede trazar un artefacto a sus padres e inputs.
- El mismo estado no diverge entre CLI humano y JSON.
- Un artifact legacy conserva su historia y limitaciones.

### Fuera de alcance

- Cloud multiusuario
- Orquestación remota
- MCP general

---
