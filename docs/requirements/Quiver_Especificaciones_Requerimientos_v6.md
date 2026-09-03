---
title: "Quiver — Especificaciones y Requerimientos v6"
document_type: "Product Specifications & Requirements Catalog"
artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
artifact_type: "requirements"
version: "6.0"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-01"
roadmap: "../plans/Quiver_Roadmap_Maestro_v6.md"
related_plans:
  - artifact_id: "PLAN-QUIVER-MASTER"
    catalog_path: "../plans/README.md"
supersedes: null
source_provenance:
  imported_on: "2026-09-02"
  source_filename: "Quiver_Especificaciones_Requerimientos_v6.md"
  source_sha256: "a3b10543d36302322a125a4e515682ce537ee616ace3df092971c6461e11aead"
decisions:
  - decision_id: "DEC-20260902-004"
    date: "2026-09-02"
    actor: "technical-agent"
    change: "Incorporar el catálogo maestro v6, normalizar su enlace al roadmap y reemplazar hard breaks con espacios por <br>"
    reason: "Establecer el catálogo leído como requerimiento durable, versionado y relacionado con su roadmap"
    impact: "Conserva contenido y renderizado sin whitespace inválido; no aprueba specs ni reemplaza sus SPEC.md ejecutables"
source_baseline:
  - "Quiver_Requerimiento_Maestro_v4_Runtime_Evidence_Evals.md"
  - "Quiver_Requerimiento_Maestro_v5_1_Estrategia_Producto_Arquitectura_Roadmap.md"
  - "dolores_actuales_ai_builders(1).md"
---

# Quiver — Especificaciones y Requerimientos v6

## 0. Cómo usar este documento

Este archivo es el catálogo maestro de las especificaciones que aparecen en el Roadmap v6.

Cada spec tiene:

- un ID `SPEC-VNN`;
- un slug recomendado;
- un componente canónico;
- un repositorio objetivo;
- dependencias;
- dolores que ataca del archivo de AI builders;
- relación con requerimientos técnicos v4 cuando corresponde;
- requisitos propios `VNN-RQ-xx`;
- criterios de aceptación;
- fuera de alcance.

Cuando una spec sea aprobada para ejecución, debe materializarse como su propia `SPEC.md` y dividirse en slices. Este archivo no reemplaza la SPEC ejecutable congelada de una versión en curso.

**Regla especial:** `SPEC-V58` referencia y preserva la SPEC ya existente de `quiver-v58-risk-aware-review-governance`. No debe reabrirse su alcance por este documento.

## 1. Principios globales de producto

### GP-01 — La metodología debe ser invisible por defecto

El usuario común no necesita aprender WDD, SDD, findings, digests o manifests para completar el flujo principal.

### GP-02 — Una interfaz principal

Quiver Lead es la interfaz principal. Las capacidades internas no se convierten en chats separados obligatorios.

### GP-03 — El equipo es dinámico

Producto, UX, frontend, backend, QA, seguridad, DevOps, reviewer e incident se activan solo cuando aportan valor.

### GP-04 — Evidence over claims

Una afirmación de un agente no es evidencia suficiente para marcar una entrega como verificada.

### GP-05 — Project Brain no es chat history

El conocimiento durable debe tener fuente, vigencia, autoridad y lineage.

### GP-06 — Obsidian es opcional

Quiver mantiene su Project Brain. El Open Knowledge Vault es compatible con Obsidian, pero Obsidian no es backend obligatorio.

### GP-07 — Propiedad del cliente

Código, artifacts exportables y conocimiento deben poder salir de Quiver en formatos estándar.

### GP-08 — Read-only before write

Cada integración remota comienza con la menor autoridad posible.

### GP-09 — Seguridad proporcional al riesgo

Copy y auth no usan el mismo workflow.

### GP-10 — No false green

`unknown`, `not-tested`, `capability-unavailable` y `failed` son estados diferentes.

### GP-11 — Simple primero, técnico bajo demanda

Studio muestra resultado, riesgo y acción; Engineering Console expone evidencia, IDs, digests, tools y logs.

### GP-12 — No construir por anticipación

Una spec condicional requiere el gate del roadmap o evidencia equivalente.

### GP-13 — GitHub como fuente del código

Quiver no debe mantener una copia propietaria como única fuente del producto.

### GP-14 — Single writer por dato mutable

Una integración puede reflejar información de otra, pero no existirán múltiples escritores silenciosos del mismo estado.

### GP-15 — Determinístico antes que generativo

Schemas, hashes, invariantes, permisos y state transitions deben validarse con código cuando sea posible.

### GP-16 — Producción es una etapa distinta

Preview, aprobación y publicación no son sinónimos.

### GP-17 — Equipo completo no significa reemplazo humano absoluto

Quiver puede ejecutar roles, pero el humano conserva decisiones sensibles y puede ocupar cualquier rol.

### GP-18 — Coste forma parte de la calidad

Un workflow que funciona pero cuesta demasiado o entra en loops no es una mejora.

### GP-19 — Contexto mínimo y relevante

Más memoria almacenada no implica más contexto enviado a cada agente.

### GP-20 — Los dolores son hipótesis de producto

El archivo de dolores orienta prioridades, pero frecuencia y willingness-to-pay se validan con usuarios reales.

## 2. Convenciones de aceptación

Una spec no se considera cerrada por “la IA terminó”. Debe existir, como aplique:

- criterios de aceptación ejecutados;
- tests/validators;
- evidencia;
- revisión independiente según riesgo;
- documentación actualizada;
- decisión humana cuando la policy la exige;
- ausencia de scope violation no resuelta.

---

# SPEC-V58 — Risk-aware Review Governance

**Versión:** `v58`<br>
**Slug sugerido:** `quiver-v58-risk-aware-review-governance`<br>
**Componente:** Quiver Engine<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 0 — Trabajo comprometido<br>
**Estado:** `IN_PROGRESS`<br>
**Dependencias:** Ninguna nueva; continuar la SPEC existente

## Problema / objetivo

Cerrar la gobernanza de revisión sensible al riesgo ya aprobada, sin ampliar su alcance.

## Resultado que debe percibir el usuario

Quiver distingue qué problemas deben bloquear ahora, cuáles pueden transferirse y qué aprobación humana cubre exactamente cada decisión.

## Dolor(es) del catálogo de builders que ataca

Secciones: `04, 10, 11, 12, 69–73, 129–134, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-001–RQ-009; RQ-029; límite de identidad de RQ-100

## Requerimientos

### V58-RQ-01

Conservar los perfiles fast-delivery y high-assurance con rigurosidad proporcional al riesgo.

### V58-RQ-02

Mantener findings estructurados con severidad, categoría, fase responsable, evidencia y disposición.

### V58-RQ-03

Bloquear una fase solamente por findings que pertenecen realmente a esa fase según policy.

### V58-RQ-04

Limitar las revisiones semánticas y detener loops con una decisión humana explícita.

### V58-RQ-05

Soportar approved-with-conditions sin presentarlo como aprobación incondicional.

### V58-RQ-06

Vincular decisiones a actor, versión, digest, findings y policy exactos.

### V58-RQ-07

Transferir findings a spec, slice, PR o follow-up sin perder identidad ni trazabilidad.

### V58-RQ-08

Cerrar la migración, compatibilidad, documentación y evidencia de las slices restantes sin iniciar v59 desde la rama de v58.

## Criterios de aceptación

- Slices 00–06 cerradas con evidencia y revisión humana donde corresponda.
- Ningún finding desaparece sin disposición.
- Una revisión agotada no regenera indefinidamente el plan.
- Las salidas humana y machine-readable representan la misma decisión.

## Fuera de alcance

- Builder visual
- Project Brain
- Quiver Cloud
- AgentRuntime general
- Orquestación durable

---

# SPEC-V59 — Draft Integrity & Effective Contracts

**Versión:** `v59`<br>
**Slug sugerido:** `quiver-v59-draft-integrity-effective-contracts`<br>
**Componente:** Quiver Engine + CLI<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V58

## Problema / objetivo

Evitar pérdida de contenido al revisar artefactos y permitir volver a una versión válida sin hacks manuales.

## Resultado que debe percibir el usuario

El usuario puede comparar, rechazar, recuperar y complementar una versión sin perder decisiones anteriores.

## Dolor(es) del catálogo de builders que ataca

Secciones: `02–06, 10, 117–119, 143–148` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-010–RQ-019; RQ-022; RQ-024

## Requerimientos

### V59-RQ-01

Definir estados explícitos de draft: draft, current, reviewed, approved, approved-with-conditions, rejected, superseded y corrupted.

### V59-RQ-02

Permitir seleccionar, revisar y aprobar una versión anterior si sus inputs siguen vigentes.

### V59-RQ-03

Permitir rollback del puntero current sin eliminar ninguna versión histórica.

### V59-RQ-04

Crear addendums de primera clase para cambios acotados sin regenerar artefactos extensos.

### V59-RQ-05

Agregar amendments determinísticos para cambios estructurados cuando el formato lo permita.

### V59-RQ-06

Detectar content loss mediante IDs, colecciones requeridas, referencias y preservación estructural.

### V59-RQ-07

Marcar una versión defectuosa como corrupted sin invalidar automáticamente la anterior.

### V59-RQ-08

Separar retry técnico de nueva revisión semántica y conservar lineage completo.

## Criterios de aceptación

- Un draft con pérdida de contenido no puede convertirse en current silenciosamente.
- Una versión válida anterior puede recuperarse sin editar metadata manualmente.
- Un addendum produce un contrato efectivo verificable.
- La comparación muestra qué cambió y qué se preservó.

## Fuera de alcance

- Editor visual de documentos
- Sincronización con Obsidian
- Nuevos agentes o runtimes

---

# SPEC-V60 — Project Brain & Open Knowledge Vault Foundation

**Versión:** `v60`<br>
**Slug sugerido:** `quiver-v60-project-brain-open-knowledge-vault`<br>
**Componente:** Quiver Protocol + Engine + CLI<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V58; puede avanzar en paralelo con parte de SPEC-V59

## Problema / objetivo

Crear una memoria estructurada, durable, trazable y abierta por proyecto, sin convertir el historial de chat ni Obsidian en fuente de verdad.

## Resultado que debe percibir el usuario

Quiver recuerda qué es el producto, qué decisiones siguen vigentes y por qué, sin que el usuario deba documentar manualmente.

## Dolor(es) del catálogo de builders que ataca

Secciones: `02–06, 65–68, 116–124, 139–149, 183–185, 200–204` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Amplía RQ-075, RQ-093, RQ-096 y P-20 de v4; incorpora nuevos contratos de Project Brain

## Requerimientos

### V60-RQ-01

Crear automáticamente un Project Brain para cada proyecto Quiver.

### V60-RQ-02

Representar conocimiento como registros tipados: hecho verificado, requirement, decisión, supuesto, riesgo, finding, restricción, aprendizaje, release e incidente.

### V60-RQ-03

Cada registro debe conservar fuente, fecha, estado de vigencia, autoridad, reemplazo y provenance.

### V60-RQ-04

Definir precedencia explícita: policy > decisión aprobada > requirement > input autorizado > supuesto del agente.

### V60-RQ-05

Prohibir secretos y estado operativo efímero dentro del Project Brain.

### V60-RQ-06

Generar una representación abierta en Markdown + YAML + enlaces, denominada Open Knowledge Vault.

### V60-RQ-07

El formato del vault debe poder abrirse con Obsidian, pero Quiver no debe depender de Obsidian, Obsidian Sync ni Obsidian Headless.

### V60-RQ-08

Permitir exportar el Project Brain completo sin perder IDs, relaciones, fuentes y vigencia.

### V60-RQ-09

Distinguir la fuente canónica de conocimiento del cache o índice usado para búsquedas.

### V60-RQ-10

Mostrar al usuario qué memoria está activa, qué guarda, qué excluye y cómo eliminarla o exportarla.

## Criterios de aceptación

- Un proyecto nuevo obtiene un Brain utilizable sin instalar Obsidian.
- Una decisión reemplazada no aparece como vigente.
- El vault puede abrirse como carpeta Obsidian sin conversión propietaria.
- Ningún secreto de fixtures de seguridad queda persistido en el vault.

## Fuera de alcance

- Plugin de Obsidian
- Obsidian Sync obligatorio
- Base de datos operacional dentro de Markdown
- Memoria que modifica contratos sin aprobación

---

# SPEC-V61 — Context Selection, Contradictions & Impact Graph

**Versión:** `v61`<br>
**Slug sugerido:** `quiver-v61-context-selection-impact-graph`<br>
**Componente:** Quiver Engine<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60

## Problema / objetivo

Transformar el Project Brain y el repositorio en contexto mínimo y relevante, detectando contradicciones e impacto antes de cambiar software.

## Resultado que debe percibir el usuario

Antes de construir, Quiver explica qué entendió, qué puede verse afectado y qué decisión falta.

## Dolor(es) del catálogo de builders que ataca

Secciones: `03, 04, 07, 08, 14–16, 111–119, 139–150, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-093–RQ-096; RQ-118; amplía dependency/code/semantic graph de dolores 139–142

## Requerimientos

### V61-RQ-01

Crear un Context Manifest por tarea con fuentes, digest, autoridad, confianza, vigencia y razón de inclusión.

### V61-RQ-02

Seleccionar contexto por tarea en lugar de enviar el Project Brain completo.

### V61-RQ-03

Detectar contradicciones entre requirements, decisiones, policy, documentación y comportamiento observado.

### V61-RQ-04

Elevar contradicciones relevantes en vez de elegir una interpretación silenciosamente.

### V61-RQ-05

Construir un grafo de impacto que relacione requirements, módulos, datos, permisos, APIs, UI, tests e integraciones.

### V61-RQ-06

Presentar un resumen comprensible de impacto: qué cambia, qué puede romperse, qué queda fuera y qué debe verificarse.

### V61-RQ-07

Aplicar presupuesto de contexto y divulgación progresiva; nunca truncar contratos obligatorios en silencio.

### V61-RQ-08

Marcar el contexto como stale cuando cambie una fuente contractual relevante.

### V61-RQ-09

Separar instrucciones confiables de contenido no confiable para evitar prompt injection.

### V61-RQ-10

Permitir consultar por qué una pieza de contexto fue incluida o excluida.

## Criterios de aceptación

- Una tarea pequeña recibe contexto acotado y explicable.
- Un requirement contradictorio bloquea o solicita decisión antes de implementar.
- Quiver puede enumerar áreas afectadas antes del cambio.
- Un cambio del requirement vuelve stale una ejecución todavía no iniciada.

## Fuera de alcance

- Indexar toda herramienta externa
- Knowledge graph empresarial multi-repo
- Memoria opaca no exportable

---

# SPEC-V62 — Machine Contract & Provenance Foundation

**Versión:** `v62`<br>
**Slug sugerido:** `quiver-v62-machine-contract-provenance-foundation`<br>
**Componente:** Quiver Protocol + Engine + CLI<br>
**Repositorio objetivo:** `quiver`<br>
**Fase:** 1 — Fundamentos de confianza<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V58; integra con SPEC-V59–V61

## Problema / objetivo

Estabilizar los contratos de máquina, lineage y separación contrato/estado que consumirán Studio y Cloud.

## Resultado que debe percibir el usuario

Quiver puede demostrar de forma consistente qué versión, requisito, decisión y evidencia corresponde a cada resultado.

## Dolor(es) del catálogo de builders que ataca

Secciones: `11–12, 34–37, 65–80, 117–134, 195–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-020–RQ-021; RQ-096–RQ-100; RQ-117–RQ-118

## Requerimientos

### V62-RQ-01

Separar artefacto contractual de estado mutable de ejecución.

### V62-RQ-02

Definir Artifact Envelope común con ID, tipo, versión, digest, parents, inputs, actor y estado.

### V62-RQ-03

Definir relaciones de lineage: derives-from, supersedes, amends, verifies, executes, approves y deploys.

### V62-RQ-04

Ofrecer salida JSON estable, versionada y sin banners para comandos P0.

### V62-RQ-05

Definir códigos de error y clases de exit estables para validación, policy, capability, runtime, seguridad, conflicto y presupuesto.

### V62-RQ-06

Hacer que la salida humana derive del mismo resultado canónico que JSON.

### V62-RQ-07

Permitir validación determinística offline cuando el artefacto lo permita.

### V62-RQ-08

Introducir actor ID y autorización verificable para nuevas decisiones de governance.

### V62-RQ-09

Incorporar policy explain/dry-run para que todo bloqueo tenga regla, motivo y remediación.

### V62-RQ-10

Mantener compatibilidad de lectura con artifacts legacy sin elevarlos a verified.

## Criterios de aceptación

- Studio y Cloud pueden consumir Quiver sin parsear texto libre.
- Se puede trazar un artefacto a sus padres e inputs.
- El mismo estado no diverge entre CLI humano y JSON.
- Un artifact legacy conserva su historia y limitaciones.

## Fuera de alcance

- Cloud multiusuario
- Orquestación remota
- MCP general

---

# SPEC-V63 — Quiver Studio Alpha & Cloud Foundation

**Versión:** `v63`<br>
**Slug sugerido:** `quiver-v63-studio-alpha-cloud-foundation`<br>
**Componente:** Quiver Studio + Quiver Cloud Core<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60, SPEC-V62

## Problema / objetivo

Crear la experiencia simple y central del usuario, separada de la consola técnica, con organizaciones y proyectos mínimos.

## Resultado que debe percibir el usuario

El usuario entra a Quiver y entiende qué hacer sin aprender WDD, SDD, slices, digests ni comandos.

## Dolor(es) del catálogo de builders que ataca

Secciones: `84–89, 132–134, 149–154, 190–194` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Nueva capa de producto sobre los contratos v5.1; aprovecha P-25 de v4

## Requerimientos

### V63-RQ-01

Crear Quiver Studio como experiencia primaria y una Engineering Console avanzada como vista secundaria.

### V63-RQ-02

Permitir registro, organización, proyecto y miembros básicos sin construir todavía administración enterprise.

### V63-RQ-03

La pantalla inicial debe ofrecer dos caminos: mejorar producto existente y crear producto nuevo; el segundo puede permanecer limitado o marcado como beta.

### V63-RQ-04

El usuario debe interactuar principalmente con Quiver Lead, no con múltiples chats de agentes.

### V63-RQ-05

Traducir lenguaje interno a términos simples: objetivo, pasos, problema, comprobación, decisión y publicación.

### V63-RQ-06

Cada pantalla debe responder qué ocurre, por qué importa y qué debe hacer el usuario.

### V63-RQ-07

Aplicar progressive disclosure: detalles técnicos ocultos por defecto pero accesibles.

### V63-RQ-08

Incluir panel de proyecto, actividad, decisiones pendientes y Project Brain.

### V63-RQ-09

No presentar resultados claimed como verified.

### V63-RQ-10

Instrumentar métricas de activación y uso sin capturar código o secretos innecesarios.

## Criterios de aceptación

- Un usuario de prueba completa onboarding sin documentación técnica.
- La interfaz no exige conocer la metodología Quiver.
- Existe un camino claro desde proyecto hasta siguiente acción.
- Los detalles técnicos se pueden abrir sin cambiar la fuente de estado.

## Fuera de alcance

- Editor visual completo
- Producción automática
- Billing complejo
- Enterprise SSO

---

# SPEC-V64 — Existing Project Onboarding & Quiver Rescue

**Versión:** `v64`<br>
**Slug sugerido:** `quiver-v64-existing-project-onboarding-rescue`<br>
**Componente:** Quiver Studio + Engine + CLI<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60, SPEC-V61, SPEC-V63

## Problema / objetivo

Entrar por proyectos existentes y proyectos “graduados” de builders, generando un diagnóstico y Project Brain antes de pedir grandes cambios.

## Resultado que debe percibir el usuario

Conecto mi repositorio y Quiver me explica qué producto tengo, qué riesgos ve y qué necesita confirmar antes de trabajar.

## Dolor(es) del catálogo de builders que ataca

Secciones: `57–68, 84–89, 101–108, 184–190` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-031; RQ-061; RQ-072–RQ-073; RQ-084; RQ-115

## Requerimientos

### V64-RQ-01

Conectar GitHub inicialmente con permisos mínimos y soportar importación local/manual como fallback.

### V64-RQ-02

Analizar estructura, stack, funcionalidades principales, documentación, tests, entornos y dependencias relevantes.

### V64-RQ-03

Crear o enriquecer automáticamente el Project Brain a partir de evidencia observada.

### V64-RQ-04

Distinguir hechos detectados de inferencias y pedir confirmación solo sobre ambigüedades importantes.

### V64-RQ-05

Detectar señales de lock-in de builders o SDKs administrados y producir un Dependency/Exit Report sin obligar a migrar.

### V64-RQ-06

Ofrecer un modo Rescue que clasifique riesgos de mantenibilidad, seguridad, deuda, pruebas y portabilidad.

### V64-RQ-07

Mostrar valor antes de exigir conectar Linear, Sentry, Vercel u otras herramientas.

### V64-RQ-08

Proponer un plan de estabilización priorizado por impacto, no una lista indiscriminada de problemas.

### V64-RQ-09

Mantener los datos de cliente fuera del contexto cuando no son necesarios.

### V64-RQ-10

Registrar qué partes del análisis son verified, observed, inferred o unknown.

## Criterios de aceptación

- Un repositorio real produce un Project Brain inicial y un Rescue Report.
- El usuario puede corregir una inferencia sin editar Markdown.
- El análisis no modifica el repo por defecto.
- Un proyecto de builder puede identificar dependencias de plataforma sin prometer migración automática.

## Fuera de alcance

- Migración automática general de Base44/Lovable/Bolt
- Escritura en proveedores
- Producción

---

# SPEC-V65 — Quiver Lead, Feature Brief & Decision Inbox

**Versión:** `v65`<br>
**Slug sugerido:** `quiver-v65-quiver-lead-feature-brief-decision-inbox`<br>
**Componente:** Quiver Studio + Engine<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V61, SPEC-V63, SPEC-V64

## Problema / objetivo

Convertir un pedido informal en un brief claro, un plan simple y pocas decisiones importantes antes de construir.

## Resultado que debe percibir el usuario

Pido una funcionalidad en lenguaje natural; Quiver confirma qué entendió, qué no incluye, qué puede afectar y qué necesita que decida.

## Dolor(es) del catálogo de builders que ataca

Secciones: `04–08, 50–54, 111–118, 129–154, 190–194` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Reutiliza RQ-003–RQ-007, RQ-063–RQ-064 y RQ-118; agrega UX de Quiver Lead

## Requerimientos

### V65-RQ-01

Quiver Lead debe reformular el pedido en objetivos, alcance, no alcance y resultado esperado.

### V65-RQ-02

Hacer preguntas únicamente cuando la respuesta pueda cambiar negocio, riesgo, UX, datos, costo o reversibilidad.

### V65-RQ-03

Registrar supuestos importantes como supuestos, nunca como decisiones implícitas.

### V65-RQ-04

Mostrar un Feature Brief simple con usuarios afectados, pasos, riesgo, impacto y definición de listo.

### V65-RQ-05

Recomendar fast-delivery o high-assurance sin exponer taxonomía compleja al usuario común.

### V65-RQ-06

Presentar qué capacidades del equipo se activarán para el cambio y por qué.

### V65-RQ-07

Crear una Decision Inbox única para decisiones de producto, riesgo, costo y publicación.

### V65-RQ-08

Cada decisión debe mostrar recomendación, alternativas, impacto y si es reversible.

### V65-RQ-09

Ninguna decisión sensible se resuelve solo porque un agente la asumió.

### V65-RQ-10

Una vez aprobado, el brief debe quedar vinculado al contrato interno y al Project Brain.

## Criterios de aceptación

- Un usuario puede entender y aprobar el cambio sin abrir SPEC.md.
- Las preguntas se mantienen acotadas y medibles.
- No hay supuestos críticos ocultos en el plan.
- La Decision Inbox concentra las intervenciones humanas.

## Fuera de alcance

- Gestor de tareas general
- Chat entre agentes
- Estimación contractual de fechas

---

# SPEC-V66 — Product & UX Design Workspace

**Versión:** `v66`<br>
**Slug sugerido:** `quiver-v66-product-ux-design-workspace`<br>
**Componente:** Quiver Studio + Design capability<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V65

## Problema / objetivo

Incorporar producto y UX/UI antes de programar cuando el cambio lo necesita, evitando que la IA solo agregue features sin criterio.

## Resultado que debe percibir el usuario

Antes de construir una experiencia nueva puedo ver el flujo, la propuesta visual y qué decisión de diseño necesito aprobar.

## Dolor(es) del catálogo de builders que ataca

Secciones: `94–100, 132–134, 149–159, 190–194` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Nuevo; relacionado con principios de evidence y risk de v4

## Requerimientos

### V66-RQ-01

Activar Product/UX únicamente cuando la naturaleza del cambio lo justifique.

### V66-RQ-02

Generar user flows y wireframes antes de código para cambios de interacción relevantes.

### V66-RQ-03

Reutilizar el design system existente y detectar design drift antes de inventar variantes.

### V66-RQ-04

Permitir cargar identidad visual, referencias y restricciones de marca.

### V66-RQ-05

Usar v0 u otra herramienta visual como adapter opcional, no como fuente de reglas de negocio.

### V66-RQ-06

Permitir comentar o señalar una preview de diseño y convertir el feedback en una propuesta trazable.

### V66-RQ-07

Incluir responsive y accesibilidad básica en la definición de diseño.

### V66-RQ-08

Aprobar el diseño o flujo antes de iniciar implementación cuando la policy lo exija.

### V66-RQ-09

Registrar decisiones de UX durables en Project Brain.

### V66-RQ-10

No construir todavía un editor visual full drag-and-drop.

## Criterios de aceptación

- Una nueva pantalla tiene flujo y estado aprobado antes de implementación cuando corresponde.
- Los componentes existentes se prefieren a variantes nuevas.
- La evidencia de diseño se puede relacionar con la implementación.
- El usuario puede dar feedback sin tocar código.

## Fuera de alcance

- Figma replacement
- Editor visual completo
- Generación de cualquier estilo sin restricciones

---

# SPEC-V67 — Assisted Feature Delivery Loop

**Versión:** `v67`<br>
**Slug sugerido:** `quiver-v67-assisted-feature-delivery-loop`<br>
**Componente:** Quiver Studio + Engine + CLI<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V62, SPEC-V65, SPEC-V66

## Problema / objetivo

Cerrar el primer recorrido comercial pedido → plan → implementación → resultado, usando el runtime actual y permitiendo asistencia humana detrás de escena.

## Resultado que debe percibir el usuario

Veo cómo mi cambio avanza por etapas y recibo una versión real del software, no solo una respuesta de chat.

## Dolor(es) del catálogo de builders que ataca

Secciones: `07–18, 50–54, 63–68, 111–137, 175–179, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Reutiliza capabilities actuales de v20–v57; prepara RQ-085+ sin exigir runtime general todavía

## Requerimientos

### V67-RQ-01

Crear una unidad de Feature Delivery ligada a Feature Brief, diseño, branch, ejecución, QA y PR.

### V67-RQ-02

Usar GitHub como fuente del código y una rama/worktree aislada para cada entrega.

### V67-RQ-03

Permitir Codex como executor principal inicial y adapters adicionales solo cuando aporten valor.

### V67-RQ-04

Mostrar progreso por resultados: definido, diseñado, implementando, verificando, listo para revisar.

### V67-RQ-05

No mostrar cadenas internas de razonamiento ni conversaciones ficticias entre roles.

### V67-RQ-06

Respetar scope y detectar cambios fuera del pedido antes del PR.

### V67-RQ-07

Conservar checkpoints funcionales de la entrega aunque todavía no exista el Orchestrator durable final.

### V67-RQ-08

Permitir intervención humana/concierge en Alpha sin presentarla como autonomía total.

### V67-RQ-09

Registrar actor/agente, herramientas usadas, archivos cambiados y estado de verificación.

### V67-RQ-10

Actualizar el Feature Delivery con fallos operativos distintos de fallos funcionales.

## Criterios de aceptación

- Una funcionalidad real puede atravesar el flujo completo sin coordinación manual visible para el usuario.
- Los cambios viven en GitHub y son revisables.
- Un error de push no se presenta como fallo de implementación.
- El usuario ve avance sin administrar agentes individuales.

## Fuera de alcance

- Autonomía 24/7
- Multi-agent concurrente general
- Producción automática

---

# SPEC-V68 — Independent QA & Strong Definition of Done

**Versión:** `v68`<br>
**Slug sugerido:** `quiver-v68-independent-qa-strong-definition-of-done`<br>
**Componente:** Quiver Engine + Studio<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V65, SPEC-V67

## Problema / objetivo

Convertir “terminado” en un estado verificable derivado de requisitos y evidencia independiente.

## Resultado que debe percibir el usuario

Quiver me dice qué fue comprobado, qué no, qué riesgos quedan y si la versión está realmente lista para revisar.

## Dolor(es) del catálogo de builders que ataca

Secciones: `07, 09–12, 37–49, 88–95, 120–137, 169–170, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-018–RQ-019; RQ-027; RQ-044; RQ-097; RQ-102–RQ-106

## Requerimientos

### V68-RQ-01

Derivar casos de prueba de acceptance criteria y reglas de negocio, no solo de la implementación generada.

### V68-RQ-02

Exigir revisión o QA independiente del executor en cambios que lo requieran.

### V68-RQ-03

Ejecutar validadores determinísticos antes de un reviewer semántico.

### V68-RQ-04

Incluir build/typecheck/lint/tests según stack y policy.

### V68-RQ-05

Agregar browser/smoke tests para recorridos relevantes y controles visuales básicos cuando corresponda.

### V68-RQ-06

Convertir bugs corregidos en regresiones permanentes cuando sea razonable.

### V68-RQ-07

Distinguir passed, partially-validated, blocked, failed y not-tested.

### V68-RQ-08

Presentar un informe no técnico de comprobaciones, límites y riesgos restantes.

### V68-RQ-09

No permitir que la afirmación “resuelto” del executor se convierta sola en verified.

### V68-RQ-10

Registrar evidence refs que puedan ser auditados en la consola avanzada.

## Criterios de aceptación

- Un test que confirma una implementación incorrecta no es suficiente si contradice un requirement.
- El informe de QA identifica explícitamente lo no probado.
- Una regresión crítica impide declarar listo.
- La vista simple y la evidencia técnica representan el mismo verdict.

## Fuera de alcance

- Cobertura 100% universal
- E2E en cada cambio sin policy
- Certificación formal de seguridad

---

# SPEC-V69 — GitHub + Vercel Preview & PR Delivery

**Versión:** `v69`<br>
**Slug sugerido:** `quiver-v69-github-vercel-preview-pr-delivery`<br>
**Componente:** Quiver Studio + Integration Shared<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V62, SPEC-V67, SPEC-V68

## Problema / objetivo

Entregar cada cambio en una preview identificable y un PR profesional sin automatizar producción.

## Resultado que debe percibir el usuario

Puedo probar exactamente la versión que fue verificada, comparar cambios, aprobarla y recibir un PR listo.

## Dolor(es) del catálogo de builders que ataca

Secciones: `41–42, 62, 65–68, 74–78, 88–95, 104–110, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-037; RQ-039–RQ-044; parte read/write mínima de RQ-048–RQ-052

## Requerimientos

### V69-RQ-01

Relacionar Feature Delivery con branch y PR de GitHub.

### V69-RQ-02

Crear o detectar Preview de Vercel para el HEAD exacto del PR.

### V69-RQ-03

Exigir identidad PR HEAD = deployment source SHA = QA source SHA para aprobar la preview.

### V69-RQ-04

Mostrar una preview navegable y comparación con la versión anterior cuando sea posible.

### V69-RQ-05

Permitir comentarios del usuario sobre la versión y convertirlos en feedback trazable.

### V69-RQ-06

Separar “aprobar esta versión” de “publicar esta versión”.

### V69-RQ-07

Mantener producción deshabilitada en esta fase.

### V69-RQ-08

Prohibir credenciales y datos productivos no permitidos en previews.

### V69-RQ-09

Crear PR con resumen de objetivo, alcance, checks, riesgos, evidencia y findings pendientes.

### V69-RQ-10

Marcar QA/aprobación stale si cambia el HEAD o deployment.

## Criterios de aceptación

- El usuario prueba el mismo SHA que QA validó.
- El PR contiene contexto de negocio y evidencia suficiente.
- Un nuevo commit invalida la aprobación anterior.
- Quiver no publica a producción.

## Fuera de alcance

- Merge automático
- Staging compartido
- Release productivo

---

# SPEC-V70 — Project Brain Continuous Reconciliation & Obsidian Compatibility

**Versión:** `v70`<br>
**Slug sugerido:** `quiver-v70-project-brain-continuous-reconciliation-obsidian`<br>
**Componente:** Project Brain + Studio + Engine<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60, SPEC-V67, SPEC-V68, SPEC-V69

## Problema / objetivo

Cerrar el ciclo de memoria: cada entrega actualiza conocimiento, detecta drift y mantiene un vault abierto sin exigir trabajo documental al usuario.

## Resultado que debe percibir el usuario

Después de cada cambio, Quiver recuerda automáticamente qué se decidió y qué quedó pendiente; puedo exportarlo o abrirlo en Obsidian si quiero.

## Dolor(es) del catálogo de builders que ataca

Secciones: `02–06, 116–124, 139–149, 183–185, 200–204` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-075; RQ-093–RQ-096; RQ-115; nuevo adapter Obsidian-compatible

## Requerimientos

### V70-RQ-01

Actualizar automáticamente hechos verificables del Project Brain después de merges, verificaciones y releases.

### V70-RQ-02

Transformar inferencias o cambios de intención en propuestas que requieren aprobación antes de modificar conocimiento autorizado.

### V70-RQ-03

Detectar documentation/spec drift frente a código y estado observado.

### V70-RQ-04

Mantener links entre requirement, decisión, diseño, cambio, QA, PR y release.

### V70-RQ-05

Generar y actualizar Open Knowledge Vault de forma determinística.

### V70-RQ-06

Permitir descargar el vault o abrirlo en Obsidian sin instalar un plugin.

### V70-RQ-07

Permitir importar cambios realizados en el vault únicamente como proposals con diff y aprobación.

### V70-RQ-08

No utilizar Obsidian Sync o Headless como dependencia del servicio Quiver.

### V70-RQ-09

No sincronizar bidireccionalmente el mismo estado con Notion/Obsidian/Linear sin single-writer explícito.

### V70-RQ-10

Medir frescura del Brain, contradicciones detectadas y decisiones stale.

## Criterios de aceptación

- Una feature aprobada actualiza su conocimiento relevante sin intervención manual.
- Editar un Markdown fuera de Quiver no modifica una policy automáticamente.
- El vault exportado conserva IDs y enlaces.
- La UI muestra documentación potencialmente desactualizada.

## Fuera de alcance

- Plugin oficial de Obsidian
- Obsidian Headless
- Notion bidireccional general

---

# SPEC-V71 — GitHub Read-only Provenance Observer

**Versión:** `v71`<br>
**Slug sugerido:** `quiver-v71-github-read-only-provenance-observer`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G1 + SPEC-V62 + SPEC-V69

## Problema / objetivo

Observar GitHub de forma continua para construir provenance sin modificar el repositorio.

## Resultado que debe percibir el usuario

Quiver detecta PRs, commits y checks que no encajan con el trabajo declarado aunque nadie ejecute un comando manual.

## Dolor(es) del catálogo de builders que ataca

Secciones: `62–68, 111–134, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-037; RQ-048–RQ-052; subset read-only de RQ-109

## Requerimientos

### V71-RQ-01

Usar una GitHub App o mecanismo equivalente con permisos mínimos de lectura por repositorio.

### V71-RQ-02

Ingerir commits, PRs, reviews, checks y merge SHAs con idempotencia.

### V71-RQ-03

Correlacionar esos eventos con Project, Feature Delivery, requirement y artifact lineage.

### V71-RQ-04

Diferenciar proveedor source-of-truth de proyección Quiver.

### V71-RQ-05

Detectar PR sin requirement, requirement sin PR, HEAD no verificado y evidencia stale.

### V71-RQ-06

Mantener modo read-only: no crear PR, comentarios ni checks.

### V71-RQ-07

Registrar permisos y desconexión/revocación de la integración.

### V71-RQ-08

Reconciliar periódicamente para corregir webhooks perdidos.

## Criterios de aceptación

- Eventos duplicados no generan findings duplicados.
- Quiver reconstruye provenance después de una interrupción.
- La integración puede revocarse sin perder el código del cliente.

## Fuera de alcance

- GitHub Checks de escritura
- Merge
- Branch management remoto

---

# SPEC-V72 — Linear Read-only Work Correlation

**Versión:** `v72`<br>
**Slug sugerido:** `quiver-v72-linear-read-only-work-correlation`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G1 + SPEC-V71

## Problema / objetivo

Relacionar el trabajo declarado en Linear con el trabajo real de GitHub/Quiver sin introducir loops de estado.

## Resultado que debe percibir el usuario

Quiver muestra cuando una tarea de Linear y el código real dicen cosas distintas.

## Dolor(es) del catálogo de builders que ataca

Secciones: `64–68, 104, 111–119, 162–163` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-032–RQ-036; RQ-050–RQ-051

## Requerimientos

### V72-RQ-01

Conectar Linear inicialmente en modo lectura.

### V72-RQ-02

Relacionar issues/subissues con requirements, Feature Deliveries, branches y PRs.

### V72-RQ-03

Mantener source-of-truth y single-writer explícitos por propiedad.

### V72-RQ-04

Detectar trabajo marcado Done sin evidencia o con PR todavía abierto.

### V72-RQ-05

Detectar trabajo ejecutado sin issue/requirement cuando la policy lo exija.

### V72-RQ-06

No mover estados de Linear automáticamente en esta spec.

### V72-RQ-07

Conservar IDs externos y timestamps para provenance.

### V72-RQ-08

Tolerar workspaces que no utilicen la granularidad recomendada sin inventar subissues.

## Criterios de aceptación

- No hay loops de estado.
- Quiver puede mostrar divergencia Linear ↔ GitHub.
- Un issue externo actualizado marca projections stale cuando corresponde.

## Fuera de alcance

- Creación de issues
- Automatización bidireccional
- Reemplazar Linear

---

# SPEC-V73 — Observer Project Health & Actionable Findings

**Versión:** `v73`<br>
**Slug sugerido:** `quiver-v73-observer-project-health-findings`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V71, SPEC-V72

## Problema / objetivo

Convertir señales distribuidas en un panel de salud y findings accionables, no en otra colección de logs.

## Resultado que debe percibir el usuario

Veo qué necesita mi atención y por qué, con pocas alertas de alto valor.

## Dolor(es) del catálogo de builders que ataca

Secciones: `07–12, 38–42, 63–68, 84–89, 111–134, 193–204` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Amplía RQ-003, RQ-030, RQ-098 y métricas de v4

## Requerimientos

### V73-RQ-01

Crear Project Health con estados comprensibles: healthy, attention, blocked y unknown.

### V73-RQ-02

Priorizar findings por impacto, confianza, fase y acción recomendada.

### V73-RQ-03

Detectar trabajo bloqueado iniciado, scopes superpuestos, evidencia stale, PR huérfano y documentación divergente.

### V73-RQ-04

Distinguir problema nuevo, deuda heredada, unknown y capacidad no disponible.

### V73-RQ-05

Evitar findings duplicados mediante identity/reconciliation.

### V73-RQ-06

Permitir resolver, aceptar, transferir o descartar falsos positivos con razón.

### V73-RQ-07

Medir precisión percibida y tasa de findings accionables.

### V73-RQ-08

No ampliar integraciones si el Observer produce demasiado ruido.

## Criterios de aceptación

- Los design partners pueden señalar findings que realmente evitaron retrabajo.
- La misma causa no produce una cascada de alertas redundantes.
- Cada finding explica qué ocurrió, por qué importa y la siguiente acción.

## Fuera de alcance

- Bloqueos automáticos
- Ejecutar agentes
- Producción

---

# SPEC-V74 — Production Provenance: Vercel + Sentry

**Versión:** `v74`<br>
**Slug sugerido:** `quiver-v74-production-provenance-vercel-sentry`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G1 + SPEC-V73

## Problema / objetivo

Cerrar la trazabilidad hasta producción e incidentes antes de permitir que Quiver opere producción.

## Resultado que debe percibir el usuario

Cuando algo falla sé qué versión, PR, requirement y decisión están relacionados.

## Dolor(es) del catálogo de builders que ataca

Secciones: `38–42, 74–80, 88–95, 104–110, 120–121, 193–204` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-039–RQ-049; RQ-074; RQ-082; RQ-109

## Requerimientos

### V74-RQ-01

Ingerir deployments de Vercel en modo lectura y correlacionarlos con commit SHA.

### V74-RQ-02

Ingerir issues/releases de Sentry en modo lectura y correlacionarlos con deployment/commit.

### V74-RQ-03

Modelar estados PR_PREVIEW, SHARED_STAGING, PRODUCTION_STAGED y PRODUCTION_CURRENT sin asumir que todos existen.

### V74-RQ-04

Distinguir deployment de release completo.

### V74-RQ-05

Relacionar una regresión con release, PR, Feature Delivery y Project Brain.

### V74-RQ-06

Reabrir o crear finding cuando el runtime contradice una assumption/acceptance relevante.

### V74-RQ-07

No ejecutar rollback ni promoción.

### V74-RQ-08

Marcar unknown cuando la correlación de source maps/release no pueda demostrarse.

## Criterios de aceptación

- Un incidente real puede trazarse hacia atrás hasta su cambio.
- Vercel READY no implica release verified.
- Sentry no se usa como autoridad de aprobación.

## Fuera de alcance

- Autofix
- Rollback automático
- Promoción a producción

---

# SPEC-V75 — Policy Engine & GitHub Checks

**Versión:** `v75`<br>
**Slug sugerido:** `quiver-v75-control-policy-engine-github-checks`<br>
**Componente:** Quiver Engine + Cloud / Control<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G2 + SPEC-V73

## Problema / objetivo

Pasar de observar a aplicar reglas con rollout progresivo y explicable.

## Resultado que debe percibir el usuario

Quiver puede advertir o bloquear un cambio inseguro y explicarme exactamente qué regla se incumplió.

## Dolor(es) del catálogo de builders que ataca

Secciones: `19–28, 36–37, 69–80, 129–134, 187–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-001–RQ-007; RQ-034; RQ-037; RQ-118

## Requerimientos

### V75-RQ-01

Definir policies versionadas con rule IDs, inputs, decisión y remediaciones.

### V75-RQ-02

Soportar modos observe, warn y enforce por policy/regla.

### V75-RQ-03

Publicar GitHub Check para reglas seleccionadas sin reemplazar CI del proyecto.

### V75-RQ-04

Bloquear únicamente cuando la organización activó enforcement y existe evidencia suficiente.

### V75-RQ-05

Permitir excepciones auditables con alcance, actor, razón y expiración.

### V75-RQ-06

Mantener fast-delivery/high-assurance como defaults simples.

### V75-RQ-07

Detectar policy stale frente a cambios de configuración.

### V75-RQ-08

Medir falsos positivos antes de expandir enforcement.

## Criterios de aceptación

- Una regla puede operar semanas en warn antes de enforce.
- Un deny muestra la remediación exacta.
- Una excepción no desactiva auditoría.
- Quiver no sustituye required checks externos sin configuración.

## Fuera de alcance

- Producción autónoma
- Policies enterprise completas

---

# SPEC-V76 — Unified Evidence Bundle & Actor Decisions

**Versión:** `v76`<br>
**Slug sugerido:** `quiver-v76-evidence-bundle-actor-decisions`<br>
**Componente:** Quiver Protocol + Engine + Cloud / Control<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V62, SPEC-V68, SPEC-V75

## Problema / objetivo

Crear evidencia portable y decisiones humanas autenticadas como base de confianza antes de la ejecución remota.

## Resultado que debe percibir el usuario

Puedo demostrar qué se pidió, quién lo aprobó, qué se probó y qué versión exacta fue revisada.

## Dolor(es) del catálogo de builders que ataca

Secciones: `11–12, 65–80, 120–134, 193–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-008–RQ-009; RQ-097–RQ-101; RQ-110

## Requerimientos

### V76-RQ-01

Producir EvidenceBundle por Feature Delivery y release con checksums y refs.

### V76-RQ-02

Distinguir claimed, observed y verified dentro del bundle.

### V76-RQ-03

Registrar base_sha, final_sha, tested_sha y reviewed_sha y aplicar policy de identidad.

### V76-RQ-04

Registrar actor autenticado y autorización para approvals, risk acceptance y excepciones.

### V76-RQ-05

Permitir verificar el bundle offline cuando sea autocontenido.

### V76-RQ-06

Aplicar clasificación/redacción y no persistir secretos.

### V76-RQ-07

Agregar append-only event ledger o mecanismo equivalente de tamper evidence.

### V76-RQ-08

Exponer el resumen de evidencia en Studio y el detalle en Engineering Console.

## Criterios de aceptación

- Modificar evidencia rompe su verificación.
- Un display name no basta para high-assurance.
- Una versión nueva vuelve stale la evidencia anterior.
- El bundle se puede exportar sin depender del runtime que lo creó.

## Fuera de alcance

- Attestation externa obligatoria para todos
- Compliance formal

---

# SPEC-V77 — AgentRuntime Contract & Workspace Isolation

**Versión:** `v77`<br>
**Slug sugerido:** `quiver-v77-agent-runtime-workspace-isolation`<br>
**Componente:** Quiver Engine + Cloud / Execution<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G3 + SPEC-V62 + SPEC-V76

## Problema / objetivo

Generalizar la ejecución para que Quiver pueda cambiar de agente/runtime sin perder contratos, aislamiento ni evidencia.

## Resultado que debe percibir el usuario

Quiver puede elegir o cambiar el ejecutor sin que el proyecto dependa de un único proveedor.

## Dolor(es) del catálogo de builders que ataca

Secciones: `63–68, 111–115, 135–142, 168–179, 182–183` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-085–RQ-088; RQ-099

## Requerimientos

### V77-RQ-01

Definir AgentRuntime neutral con start, inspect, stream, input, approval, cancel y collectArtifacts; resume solo cuando capability exista.

### V77-RQ-02

Implementar adapters iniciales para Codex y al menos un segundo runtime antes de declarar neutralidad estable.

### V77-RQ-03

Detectar capabilities reales en vez de asumir pause, resume, network o tools.

### V77-RQ-04

Crear workspace aislado por run mediante worktree, clone, container o workspace remoto.

### V77-RQ-05

Registrar base SHA, branch, runtime, modelo resuelto y environment fingerprint.

### V77-RQ-06

No permitir que el runtime decida el estado DONE contractual.

### V77-RQ-07

Normalizar eventos sin descartar payload/provider metadata necesarios para debug.

### V77-RQ-08

Conformance tests para cada adapter.

## Criterios de aceptación

- El mismo slice puede ejecutarse con dos adapters bajo el mismo output contract.
- Dos runs no comparten directorio mutable.
- Una capability ausente produce un estado explícito.

## Fuera de alcance

- Orchestrator durable completo
- Producción

---

# SPEC-V78 — Permission Envelopes, Checkpoints & Leases

**Versión:** `v78`<br>
**Slug sugerido:** `quiver-v78-permission-checkpoint-leases`<br>
**Componente:** Quiver Engine + Cloud / Execution<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77

## Problema / objetivo

Hacer la ejecución resumible, limitada y segura bajo concurrencia.

## Resultado que debe percibir el usuario

Cada agente recibe solo los permisos necesarios; si se interrumpe, Quiver continúa sin empezar todo de cero.

## Dolor(es) del catálogo de builders que ataca

Secciones: `23, 63, 69–80, 105–115, 135–137, 168, 176–179` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-087–RQ-090; RQ-111

## Requerimientos

### V78-RQ-01

Emitir Permission Envelope inmutable con filesystem, commands, network, tools, secrets y producción.

### V78-RQ-02

Aplicar default deny a producción y secretos.

### V78-RQ-03

Permitir grants puntuales con scope, actor, razón, expiración y uso acotado.

### V78-RQ-04

Crear checkpoints de pasos completados, artifacts, SHA y findings.

### V78-RQ-05

Reanudar desde checkpoint sin repetir evidencia válida contra el mismo estado.

### V78-RQ-06

Usar leases/fencing tokens para resources compartidos y detectar workers stale.

### V78-RQ-07

Distinguir timeout de runtime, comando, aprobación y orquestación.

### V78-RQ-08

Usar credenciales efímeras por referencia y revocarlas al cancelar cuando sea posible.

## Criterios de aceptación

- Un agente no escribe fuera de scope.
- Un run interrumpido puede reanudarse.
- Dos agentes no toman el mismo slice sin policy explícita.
- Los secretos no aparecen en evidence.

## Fuera de alcance

- Permisos enterprise multi-región
- Secret manager propio obligatorio

---

# SPEC-V79 — Dynamic AI Product & Engineering Team

**Versión:** `v79`<br>
**Slug sugerido:** `quiver-v79-dynamic-ai-product-engineering-team`<br>
**Componente:** Quiver Studio + Cloud / Execution<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V65, SPEC-V66, SPEC-V77, SPEC-V78

## Problema / objetivo

Materializar la promesa de “equipo completo” como capacidades coordinadas, no como personajes artificiales o múltiples chats.

## Resultado que debe percibir el usuario

Siento que producto, diseño, desarrollo, QA, seguridad y release están cubiertos, pero sigo hablando con una sola interfaz.

## Dolor(es) del catálogo de builders que ataca

Secciones: `64–68, 84–89, 111–115, 129–154, 175–179, 190–194` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Combina roles de RQ-038, Skills RQ-062–RQ-074 y nueva UX de equipo dinámico

## Requerimientos

### V79-RQ-01

Quiver Lead debe seguir siendo la interfaz principal y accountable de comunicación.

### V79-RQ-02

Definir capacidades: Product, UX/UI, Architecture, Frontend, Backend, Data, QA, Security, DevOps/Release, Reviewer e Incident.

### V79-RQ-03

Activar el equipo mínimo necesario según tipo de tarea, riesgo y stack.

### V79-RQ-04

No ejecutar todos los roles por defecto ni simular conversaciones para crear sensación de actividad.

### V79-RQ-05

Cada capacidad debe producir un deliverable verificable, no solo texto narrativo.

### V79-RQ-06

Separar executor y reviewer/QA en high-assurance.

### V79-RQ-07

Permitir que humanos ocupen o compartan roles junto a agentes.

### V79-RQ-08

Mostrar al usuario equipo activado, resultado de cada capacidad y decisiones pendientes, no razonamiento interno.

### V79-RQ-09

La composición del equipo debe considerar costo y latencia.

### V79-RQ-10

Registrar ownership de cada cambio y handoff.

## Criterios de aceptación

- Una tarea simple no activa un equipo costoso.
- Una tarea sensible activa seguridad/QA apropiados.
- El usuario no necesita coordinar agentes individuales.
- Cada rol visible tiene un resultado tangible.

## Fuera de alcance

- Avatares/personas obligatorias
- Reuniones de agentes visibles
- Organigrama fijo

---

# SPEC-V80 — Skills, Evals & Model/Runtime Quality

**Versión:** `v80`<br>
**Slug sugerido:** `quiver-v80-skills-evals-model-runtime-quality`<br>
**Componente:** Quiver Engine + Cloud / Execution Reliability<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77, SPEC-V79

## Problema / objetivo

Medir procedimientos, modelos y runtimes con regresiones reales antes de expandir autonomía.

## Resultado que debe percibir el usuario

Quiver usa la combinación adecuada para el trabajo y puede demostrar si una actualización mejoró o empeoró la calidad.

## Dolor(es) del catálogo de builders que ataca

Secciones: `53–54, 114–115, 165–179, 182–183, 197` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-053–RQ-067; RQ-076–RQ-084; RQ-102–RQ-106; RQ-119

## Requerimientos

### V80-RQ-01

Mantener Skills project-scoped, versionadas, portables y con supply-chain lock.

### V80-RQ-02

Comenzar con un conjunto pequeño: workflow, requirement triage, execute, review, recovery y QA; ampliar solo por repetición real.

### V80-RQ-03

Mantener Provider Packs como conocimiento, no como ejecutores con secretos.

### V80-RQ-04

Crear eval scenarios reproducibles derivados de tareas e incidentes reales.

### V80-RQ-05

Medir activación, outcome, scope violation, costo, turns y Critical failures.

### V80-RQ-06

Priorizar scorers determinísticos; model graders no pueden convertir un hard failure en pass.

### V80-RQ-07

Comparar experimentos fijando runtime, modelo, Skill, policy, contexto y environment.

### V80-RQ-08

Bloquear actualizaciones que regresan por encima del umbral.

### V80-RQ-09

Permitir routing simple basado en clase de tarea solo después de tener baselines.

### V80-RQ-10

No autoactualizar modelos críticos en high-assurance sin eval.

## Criterios de aceptación

- Una Skill degradada no se distribuye silenciosamente.
- La misma suite compara dos runtimes.
- Los Critical failures permanecen visibles aunque el promedio sea bueno.

## Fuera de alcance

- Marketplace público
- Auto-routing opaco y altamente dinámico

---

# SPEC-V81 — Cost Governance & TraceBudget

**Versión:** `v81`<br>
**Slug sugerido:** `quiver-v81-cost-governance-tracebudget`<br>
**Componente:** Quiver Cloud / Execution Economics<br>
**Repositorio objetivo:** `quiver-cloud + tracebudget-adapter`<br>
**Fase:** 4 — Execution y equipo IA<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77, SPEC-V79, SPEC-V80

## Problema / objetivo

Hacer predecible y preventivo el costo de un equipo de agentes.

## Resultado que debe percibir el usuario

Antes de ejecutar sé el rango y límite; Quiver no consume indefinidamente arreglando sus propios errores.

## Dolor(es) del catálogo de builders que ataca

Secciones: `10, 50–56, 106–109, 138, 173–179` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-107–RQ-109; TraceBudget de v4

## Requerimientos

### V81-RQ-01

Definir presupuesto por Feature Delivery/run y subpresupuestos por fase cuando haga falta.

### V81-RQ-02

Estimar y reservar costo máximo antes de una llamada o acción costosa.

### V81-RQ-03

Reconciliar costo real y liberar reserva no usada.

### V81-RQ-04

Evitar doble reserva bajo concurrencia.

### V81-RQ-05

Atribuir costo a organización, proyecto, feature, role, runtime, modelo y resultado.

### V81-RQ-06

Mostrar al usuario costo acumulado y límite sin exponer complejidad de tokens si no la pide.

### V81-RQ-07

Al agotarse, detener o solicitar aumento; no continuar silenciosamente.

### V81-RQ-08

Integrar TraceBudget mediante CostController neutral, con fallback local para desarrollo.

### V81-RQ-09

Medir costo por PR aprobado, feature completada y QA pass.

### V81-RQ-10

No basar el negocio en arbitraje de suscripciones personales de proveedores de IA.

## Criterios de aceptación

- Un run no supera su presupuesto configurado silenciosamente.
- Se puede explicar qué parte del equipo consumió costo.
- Una reparación repetida aparece como costo de retrabajo.

## Fuera de alcance

- Billing final del SaaS
- FinOps cloud completo

---

# SPEC-V82 — New Product Builder Foundation

**Versión:** `v82`<br>
**Slug sugerido:** `quiver-v82-new-product-builder-foundation`<br>
**Componente:** Quiver Studio + Cloud / Builder<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 5 — Builder de producto nuevo<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G4 + SPEC-V65–V81

## Problema / objetivo

Extender Quiver desde evolucionar apps existentes hacia crear productos nuevos, con un alcance deliberadamente limitado.

## Resultado que debe percibir el usuario

Puedo describir un SaaS o sistema interno y Quiver convierte la idea en una primera versión profesional y mantenible.

## Dolor(es) del catálogo de builders que ataca

Secciones: `04–06, 15, 84–89, 149–159, 180–190` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Nueva capa builder; reutiliza governance/evidence de v4

## Requerimientos

### V82-RQ-01

Soportar greenfield inicialmente solo para SaaS B2B, dashboards, portales y sistemas internos.

### V82-RQ-02

Stack inicial recomendado: Next.js + Supabase + Vercel + GitHub; otros stacks requieren spec posterior.

### V82-RQ-03

Convertir idea en Product Brief, usuarios, alcance MVP, no-goals y roadmap inicial.

### V82-RQ-04

Ofrecer plantillas de dominio como aceleradores, no como arquitecturas ocultas imposibles de extraer.

### V82-RQ-05

Crear repo propiedad del cliente o transferible desde el inicio.

### V82-RQ-06

Crear Project Brain desde el primer brief.

### V82-RQ-07

Usar el mismo Feature Delivery Loop para construir el MVP por incrementos.

### V82-RQ-08

No prometer “cualquier app” ni mobile nativo en esta etapa.

### V82-RQ-09

Permitir salir de Quiver conservando código y Knowledge Vault.

### V82-RQ-10

Medir cuánto rescate humano requiere cada proyecto antes de ampliar autonomía.

## Criterios de aceptación

- Un producto limitado puede crearse sin decisiones críticas ocultas.
- El código queda en GitHub estándar.
- El usuario conserva la memoria del producto.

## Fuera de alcance

- Apps móviles nativas
- Juegos
- Cualquier framework
- Marketplace de plantillas público

---

# SPEC-V83 — Managed Backend, Data & Security Builder

**Versión:** `v83`<br>
**Slug sugerido:** `quiver-v83-managed-backend-data-security-builder`<br>
**Componente:** Quiver Cloud / Builder + Engine<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 5 — Builder de producto nuevo<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V82

## Problema / objetivo

Automatizar backend común sin repetir los fallos de seguridad, RLS, migraciones y multi-tenancy de los builders actuales.

## Resultado que debe percibir el usuario

Quiver configura usuarios, datos, archivos y backend con controles visibles y pruebas, no como magia opaca.

## Dolor(es) del catálogo de builders que ataca

Secciones: `17–37, 42–49, 105–110, 157–168` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-027; RQ-046; RQ-069–RQ-071; RQ-080; RQ-090; RQ-110–RQ-111

## Requerimientos

### V83-RQ-01

Modelar datos y reglas de negocio antes de generar cambios de schema sensibles.

### V83-RQ-02

Soportar Supabase inicialmente para database, auth, storage y edge functions bajo adapters claros.

### V83-RQ-03

Aplicar high-assurance automáticamente a auth, RLS, roles, billing, destructive migrations y datos sensibles.

### V83-RQ-04

Exigir migrations forward, compatibilidad y plan de backfill/cutover cuando corresponda.

### V83-RQ-05

Generar tests negativos de permisos y tenant isolation.

### V83-RQ-06

Separar ambientes y prohibir production credentials/datos no permitidos en preview.

### V83-RQ-07

Tratar webhooks, pagos, jobs e idempotencia como contratos explícitos cuando se incorporen.

### V83-RQ-08

Detectar dependencias vulnerables y deuda sin ejecutar fixes destructivos automáticos.

### V83-RQ-09

Registrar backend dependencies en Exit/Portability manifest.

### V83-RQ-10

No ocultar que algunas capacidades dependen del proveedor elegido.

## Criterios de aceptación

- Un tenant no puede leer otro en la matriz de pruebas.
- Una migración destructiva no se ejecuta como cambio UI.
- Preview y production usan perfiles de datos separados.

## Fuera de alcance

- Soporte universal de DB
- Migración automática de cualquier proveedor

---

# SPEC-V84 — Visual Editor & Design System Governance

**Versión:** `v84`<br>
**Slug sugerido:** `quiver-v84-visual-editor-design-system`<br>
**Componente:** Quiver Studio / Builder<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 5 — Builder de producto nuevo<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V66, SPEC-V82

## Problema / objetivo

Acercar la experiencia a builders visuales sin sacrificar design system, accesibilidad ni trazabilidad.

## Resultado que debe percibir el usuario

Puedo seleccionar una parte de la app y pedir cambios visuales sin destruir consistencia ni tocar código manualmente.

## Dolor(es) del catálogo de builders que ataca

Secciones: `94–100, 132–134, 149–155, 181` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

Nuevo; complementa evidence/lineage existente

## Requerimientos

### V84-RQ-01

Permitir seleccionar elementos en preview y describir cambios.

### V84-RQ-02

Resolver cada cambio visual contra componentes/tokens existentes antes de crear variantes.

### V84-RQ-03

Mantener design system, responsive y accesibilidad como constraints.

### V84-RQ-04

Mostrar diff visual o comparación antes/después cuando sea viable.

### V84-RQ-05

Relacionar feedback visual con Feature Delivery y requirement.

### V84-RQ-06

Permitir edición de contenido y propiedades seguras sin exponer implementación.

### V84-RQ-07

Escalar cambios estructurales al flujo de producto/desarrollo en vez de mutar UI sin análisis.

### V84-RQ-08

Registrar decisiones de diseño durables en Project Brain.

### V84-RQ-09

Soportar v0 como adapter de generación visual si mejora calidad/velocidad, manteniendo GitHub como source.

### V84-RQ-10

No convertirse en un editor de diseño generalista tipo Figma.

## Criterios de aceptación

- Cambios repetidos no producen drift evidente de componentes.
- Una edición visual sensible pasa por impacto/QA.
- El usuario puede revertir una versión visual.

## Fuera de alcance

- Editor vectorial
- Animación avanzada universal
- Canvas generalista

---

# SPEC-V85 — Release, Production Readiness & Recovery

**Versión:** `v85`<br>
**Slug sugerido:** `quiver-v85-release-production-readiness-recovery`<br>
**Componente:** Quiver Cloud / Delivery<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 5 — Builder de producto nuevo<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V74, SPEC-V76, SPEC-V78, SPEC-V83

## Problema / objetivo

Cerrar la brecha demo → producción con releases compuestos, aprobación y recuperación honesta.

## Resultado que debe percibir el usuario

Quiver no me dice “está publicado” si faltan migraciones, seguridad o monitoreo; me muestra qué está realmente listo.

## Dolor(es) del catálogo de builders que ataca

Secciones: `17–18, 38–49, 74–80, 88–95, 105–110, 189–200` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-040–RQ-047; RQ-070; RQ-099; RQ-101

## Requerimientos

### V85-RQ-01

Modelar release compuesto con web, database, edge/functions, flags, jobs y webhooks cuando sean required.

### V85-RQ-02

Distinguir PR preview, shared staging, production staged y production current.

### V85-RQ-03

Para high-assurance, preferir probar y promover el mismo deployment cuando el proveedor lo permita.

### V85-RQ-04

Exigir QA/release manifest con staleness e identidad de artifact.

### V85-RQ-05

Definir rollback/forward-fix por componente; nunca asumir que rollback de web revierte datos.

### V85-RQ-06

Verificar health/smoke post-release y poder activar rollback o incidente.

### V85-RQ-07

Mantener human approval por defecto para producción sensible.

### V85-RQ-08

Mostrar Production Readiness en lenguaje simple: listo, faltante, riesgo y recuperación.

### V85-RQ-09

Registrar release e incident knowledge en Project Brain.

### V85-RQ-10

No habilitar producción totalmente autónoma por defecto.

## Criterios de aceptación

- Un release web READY con DB pending no aparece como listo.
- Existe estrategia de recuperación por componente.
- La versión servida puede relacionarse con la aprobada.

## Fuera de alcance

- Cero intervención humana universal
- Infraestructura cloud universal

---

# SPEC-V86 — Orchestrator Gap Analysis

**Versión:** `v86`<br>
**Slug sugerido:** `quiver-v86-orchestrator-gap-analysis`<br>
**Componente:** Quiver Cloud / Architecture<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 6 — Orquestación y operación continua<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V77–V81 + evidencia de demanda

## Problema / objetivo

Decidir con evidencia si Quiver debe adoptar, adaptar, extender o construir un orchestrator durable.

## Resultado que debe percibir el usuario

No visible como feature; evita gastar meses duplicando infraestructura que ya existe.

## Dolor(es) del catálogo de builders que ataca

Secciones: `114–115, 175–183` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-091; RQ-092; P-15 y decisión v4

## Requerimientos

### V86-RQ-01

Comparar requisitos reales de Quiver contra orchestrators/runtimes disponibles al momento del spike.

### V86-RQ-02

Evaluar al menos workspace isolation, resume, concurrency, events, approvals, security, evidence, cost, multi-repo y integrations.

### V86-RQ-03

Mantener opciones ADOPT, ADAPT, EXTEND, FORK, BUILD_NATIVE y DO_NOT_BUILD.

### V86-RQ-04

Incluir costo de mantenimiento y riesgo de proveedor, no solo cobertura funcional.

### V86-RQ-05

Construcción nativa requiere gaps no resolubles mediante adapters con demanda paga.

### V86-RQ-06

Registrar decisión como ADR/Project Brain y volver a evaluarla si cambia el mercado.

## Criterios de aceptación

- Existe capability matrix y decisión explícita.
- BUILD_NATIVE no puede ser el default.

## Fuera de alcance

- Implementar orchestrator dentro de este mismo spec

---

# SPEC-V87 — Durable Orchestrator Workflows

**Versión:** `v87`<br>
**Slug sugerido:** `quiver-v87-durable-orchestrator-workflows`<br>
**Componente:** Quiver Cloud / Orchestrator<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 6 — Orquestación y operación continua<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G5 + SPEC-V86

## Problema / objetivo

Automatizar de forma durable el equipo y las integraciones únicamente si el gap analysis lo justifica.

## Resultado que debe percibir el usuario

Quiver puede dejar tareas trabajando, esperar aprobaciones, retomar y coordinar herramientas sin que yo supervise cada paso.

## Dolor(es) del catálogo de builders que ataca

Secciones: `32–35, 46–47, 63–68, 111–115, 135–137, 175–179` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-049–RQ-052; RQ-087–RQ-092; RQ-113

## Requerimientos

### V87-RQ-01

Procesar intents idempotentes y eventos canónicos con retry/reconciliation.

### V87-RQ-02

Coordinar Linear/GitHub/runtime/Vercel mediante adapters y single-writer.

### V87-RQ-03

Persistir workflow/run state durable separado de artifacts contractuales.

### V87-RQ-04

Esperar approvals sin consumir worker activo.

### V87-RQ-05

Reanudar tras reinicio usando checkpoints y provider handles.

### V87-RQ-06

Propagar cancellation y recovery de forma auditable.

### V87-RQ-07

No elevar provider completion a Quiver verified sin evidence.

### V87-RQ-08

Mantener backend reemplazable por OrchestratorAdapter.

## Criterios de aceptación

- Un workflow sobrevive a reinicio.
- Un evento duplicado no ejecuta una acción dos veces.
- Una aprobación pendiente se retoma correctamente.

## Fuera de alcance

- Producción autónoma sin gates
- Dependencia contractual del orchestrator elegido

---

# SPEC-V88 — Continuous Operations & Incident Team

**Versión:** `v88`<br>
**Slug sugerido:** `quiver-v88-continuous-operations-incident-team`<br>
**Componente:** Quiver Cloud / Operations<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 6 — Orquestación y operación continua<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V74, SPEC-V79, SPEC-V85, opcional SPEC-V87

## Problema / objetivo

Hacer que la promesa de equipo continúe después del deploy: observar, explicar, proponer y verificar correcciones.

## Resultado que debe percibir el usuario

Cuando algo falla, Quiver me explica el impacto, prepara una corrección y me pide decidir solo lo necesario.

## Dolor(es) del catálogo de builders que ataca

Secciones: `38–42, 84–89, 120–121, 135–137, 184–194` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-074; RQ-082; RQ-109

## Requerimientos

### V88-RQ-01

Ingerir incidentes y clasificarlos por impacto, regresión, ruta y usuarios afectados.

### V88-RQ-02

Relacionar incidente con release, PR, Feature Delivery, decisions y evidence.

### V88-RQ-03

Activar dinámicamente Incident/Development/QA/Release capabilities según severidad.

### V88-RQ-04

Traducir errores técnicos a explicación y acción para usuario no técnico.

### V88-RQ-05

Preparar fix/hotfix bajo el mismo Feature Delivery Loop.

### V88-RQ-06

No auto-rollback ni auto-merge cambios sensibles sin policy.

### V88-RQ-07

Convertir incidentes relevantes en regression tests/evals y conocimiento durable.

### V88-RQ-08

Medir time-to-detect, time-to-explain y time-to-verified-fix.

## Criterios de aceptación

- Un incidente puede producir una corrección trazable y regresión.
- La explicación no exige leer logs.
- El fix no pierde la relación con la causa.

## Fuera de alcance

- NOC autónomo universal
- SLA enterprise todavía

---

# SPEC-V89 — Team Collaboration & Multi-repository Change Sets

**Versión:** `v89`<br>
**Slug sugerido:** `quiver-v89-team-collaboration-multi-repo`<br>
**Componente:** Quiver Cloud / Collaboration<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 7 — Escala y ecosistema<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V75–V88 + demanda real

## Problema / objetivo

Coordinar humanos y agentes a través de equipos, proyectos y varios repositorios sin perder ownership.

## Resultado que debe percibir el usuario

Mi equipo puede trabajar en paralelo y Quiver muestra dependencias, colisiones y qué conjunto de cambios forma una feature.

## Dolor(es) del catálogo de builders que ataca

Secciones: `62–68, 101–104, 111–116, 129, 157–163` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-035; RQ-089; RQ-116

## Requerimientos

### V89-RQ-01

Soportar roles humanos y agentes dentro de un mismo workflow.

### V89-RQ-02

Mostrar ownership, bloqueos, dependencias y scopes activos.

### V89-RQ-03

Modelar Change Set con varios repos, SHAs, PRs, integration checks y merge order.

### V89-RQ-04

No declarar DONE si falta un repo/componente required.

### V89-RQ-05

Detectar scopes incompatibles antes y durante ejecución.

### V89-RQ-06

Permitir compatibilidad transitoria solo mediante contract/policy.

### V89-RQ-07

Compartir Project Brain y decisiones con permisos apropiados.

### V89-RQ-08

Mantener audit trail de handoffs y cambios de owner.

## Criterios de aceptación

- Una feature multi-repo se puede trazar end-to-end.
- Dos trabajos incompatibles se detectan antes del merge.
- Humano y agente comparten la misma fuente de estado.

## Fuera de alcance

- Portfolio enterprise completo
- Cross-company collaboration pública

---

# SPEC-V90 — Enterprise Governance, Security & Data Protection

**Versión:** `v90`<br>
**Slug sugerido:** `quiver-v90-enterprise-governance-data-protection`<br>
**Componente:** Quiver Cloud / Enterprise<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 7 — Escala y ecosistema<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** Clientes enterprise concretos

## Problema / objetivo

Agregar controles empresariales solo cuando el proceso de compra los exija.

## Resultado que debe percibir el usuario

La empresa puede gobernar acceso, datos, auditabilidad y ejecución sin renunciar a la velocidad de Quiver.

## Dolor(es) del catálogo de builders que ataca

Secciones: `19–26, 69–83, 187–189` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-090, RQ-100–RQ-101, RQ-110–RQ-111; P-23

## Requerimientos

### V90-RQ-01

Agregar SSO/SCIM cuando exista cliente que lo requiera.

### V90-RQ-02

RBAC/ABAC por organización, proyecto, environment y acción.

### V90-RQ-03

Data classification, retention, deletion y export con policy por organización.

### V90-RQ-04

Opciones de workers privados/VPC/self-hosted solo por demanda.

### V90-RQ-05

Audit log durable de decisiones y acciones sensibles.

### V90-RQ-06

Two-person rule y break-glass para acciones críticas configurables.

### V90-RQ-07

Requisitos de residencia/privacidad se modelan explícitamente; no prometer compliance no certificado.

### V90-RQ-08

Security review del producto y proceso de vulnerability reporting maduro.

## Criterios de aceptación

- Las capacidades enterprise se activan por plan/policy sin cambiar contratos básicos.
- Quiver no afirma certificaciones que no posee.

## Fuera de alcance

- Construir todas las certificaciones anticipadamente
- On-prem universal sin cliente

---

# SPEC-V91 — Interoperability, MCP & Planning Adapters

**Versión:** `v91`<br>
**Slug sugerido:** `quiver-v91-interop-mcp-planning-adapters`<br>
**Componente:** Quiver Protocol + Cloud / Ecosystem<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 7 — Escala y ecosistema<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** Demanda + contratos estables

## Problema / objetivo

Integrarse con metodologías y herramientas sin convertir Quiver en un ecosistema cerrado.

## Resultado que debe percibir el usuario

Puedo traer specs o herramientas existentes y Quiver las gobierna sin obligarme a empezar de cero.

## Dolor(es) del catálogo de builders que ataca

Secciones: `57–68, 103–119, 182–185` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-112–RQ-115; RQ-117; RQ-119

## Requerimientos

### V91-RQ-01

Mantener Planning Artifact Adapter para Quiver native, generic Markdown y Spec Kit; ampliar solo con fixtures reales.

### V91-RQ-02

Importar no equivale a aprobar; conservar provenance e IDs externos.

### V91-RQ-03

Crear MCP Capability Registry con tools mínimas por intent.

### V91-RQ-04

Discovery de tool no implica autorización.

### V91-RQ-05

Soportar MCP Tasks como provider handle sin reemplazar Quiver Run ID cuando sea útil.

### V91-RQ-06

Mantener stable JSON/exit codes para integradores.

### V91-RQ-07

Provider/Skill supply chain debe estar lockeada y verificable.

### V91-RQ-08

No reemplazar artifacts, policy o evidence por MCP.

## Criterios de aceptación

- Una spec externa entra con gaps visibles.
- Una tool MCP de escritura no autorizada no se expone.
- El ecosistema puede cambiar sin cambiar el dominio de Quiver.

## Fuera de alcance

- Soportar todos los estándares
- Marketplace abierto sin trust model

---

# SPEC-V92 — Ecosystem & Optional Knowledge Adapters

**Versión:** `v92`<br>
**Slug sugerido:** `quiver-v92-ecosystem-knowledge-adapters-obsidian-plugin`<br>
**Componente:** Quiver Cloud / Ecosystem + Project Brain<br>
**Repositorio objetivo:** `quiver-cloud + plugins`<br>
**Fase:** 7 — Escala y ecosistema<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** Demanda demostrada

## Problema / objetivo

Agregar extensiones de conocimiento y distribución sin convertir integraciones opcionales en dependencias de Quiver.

## Resultado que debe percibir el usuario

Puedo trabajar con el conocimiento de Quiver desde herramientas que ya uso, sin perder la fuente ni quedar encerrado.

## Dolor(es) del catálogo de builders que ataca

Secciones: `57–60, 116–124, 143–147, 183–185` de `dolores_actuales_ai_builders(1).md`.

## Relación con requerimientos v4

RQ-075; RQ-083; ideas diferidas de v5.1

## Requerimientos

### V92-RQ-01

Crear plugin oficial de Obsidian solo si suficientes usuarios usan el Open Knowledge Vault fuera de Quiver.

### V92-RQ-02

El plugin puede navegar Brain, capturar ideas, proponer requirements, revisar decisiones y abrir previews.

### V92-RQ-03

Todo cambio desde Obsidian entra como propuesta; no modifica policy/decisiones aprobadas silenciosamente.

### V92-RQ-04

Evaluar Obsidian Headless/Sync como adapter opt-in solo después de revisar límites, seguridad y condiciones comerciales vigentes.

### V92-RQ-05

Notion puede funcionar como adapter de knowledge durable, con single-writer y sin duplicar todo el Project Brain.

### V92-RQ-06

Permitir SDK/API para partners sobre schemas estables.

### V92-RQ-07

Marketplace de Skills/Adapters requiere firmas, lockfiles, evals y revocation antes de abrirse.

### V92-RQ-08

Mantener exportación abierta aunque el usuario no use ninguna integración.

## Criterios de aceptación

- Desinstalar el plugin de Obsidian no afecta Quiver.
- Un cambio externo sensible requiere aprobación.
- El cliente siempre puede exportar Brain y código.

## Fuera de alcance

- Obsidian como backend obligatorio
- Obsidian por detrás de cada proyecto como instancia administrada
- Marketplace sin supply-chain trust

---

# Apéndice A — Resumen del alcance inicial

El primer producto que debe ponerse frente a usuarios reales comprende **SPEC-V58 a SPEC-V70**, con ejecución parcialmente asistida si hace falta.

La experiencia objetivo del Alpha es:

```text
Conectar proyecto
→ Project Brain automático
→ Quiver Lead entiende pedido
→ impacto y decisiones
→ UX cuando corresponde
→ desarrollo
→ QA independiente
→ Vercel Preview
→ aprobación
→ PR
→ Brain actualizado
```

No hace falta que Observer, Runtime neutral, equipo multiagente durable o producción automática estén terminados para validar esta experiencia.

# Apéndice B — Definición del producto final

Cuando las specs condicionales estén justificadas, Quiver puede llegar a ofrecer:

- creación y evolución de software por lenguaje natural;
- Project Brain automático y exportable;
- Product/UX/Frontend/Backend/Data/QA/Security/DevOps dinámicos;
- análisis de impacto antes de cambiar;
- edición visual gobernada;
- backend y datos con políticas y pruebas;
- colaboración humano + IA;
- QA/evidence independiente;
- provenance requirement → release → incidente;
- policies y approvals;
- runtimes reemplazables;
- workspaces, permisos, checkpoints y leases;
- costos preventivos;
- preview, staging, release y recovery;
- operación continua e incidentes;
- multi-repo y enterprise governance;
- interoperabilidad con MCP y planning externo;
- Obsidian/Notion como adapters opcionales de conocimiento.

La promesa final no debe ser “más agentes”. Debe ser:

> **Una experiencia simple de equipo completo, respaldada por memoria, control y evidencia profesional.**

# Apéndice C — Reglas específicas para Project Brain / Obsidian

1. Quiver crea un Project Brain automáticamente por proyecto.
2. El Project Brain es una capacidad propia de Quiver.
3. El Open Knowledge Vault usa formatos abiertos.
4. Obsidian puede abrir el vault, pero no es requisito de uso.
5. No se crea una “instancia de Obsidian” oculta por proyecto.
6. Obsidian Sync/Headless no se usan como backend por defecto.
7. Cambios externos en el vault son propuestas hasta ser validados.
8. Secrets, locks, billing, runs y permisos nunca viven en el vault.
9. El usuario puede exportar o eliminar su Brain.
10. Un plugin oficial pertenece a SPEC-V92 y requiere demanda demostrada.

# Apéndice D — Reglas para convertir este catálogo en SPEC ejecutable

Antes de crear `specs/quiver-vNN-<slug>/SPEC.md`:

1. confirmar que las dependencias estén cerradas;
2. confirmar el gate comercial cuando la spec sea condicional;
3. revisar el estado real del repo y evitar reimplementar capacidades existentes;
4. reconciliar los RQs v4 relacionados;
5. definir alcance y no-alcance congelados;
6. dividir en slices pequeños y verificables;
7. definir evidence rules por slice;
8. mantener el lenguaje del usuario separado del contrato interno;
9. agregar kill/pivot criteria cuando la spec sea una apuesta de producto;
10. cerrar con evidencia de uso real cuando corresponda.

# Apéndice E — Trazabilidad completa de RQ v4 → SPEC v6

Esta tabla preserva los 119 requerimientos técnicos del documento v4. La asignación **no implica compromiso inmediato**: indica dónde se conserva el problema y bajo qué disposición.

| RQ v4 | Título original | Spec(s) v6 | Disposición | Decisión v6 |
|---|---|---|---|---|
| RQ-001 | Perfil `fast-delivery` | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-002 | Perfil `high-assurance` | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-003 | Findings estructurados | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-004 | Política de bloqueo consciente de fase | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-005 | Aprobación con condiciones | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-006 | Review budget y circuit breaker | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-007 | Transferencia de findings | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-008 | Aprobaciones vinculadas a digest | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-009 | Detección de representación divergente | SPEC-V58 | `COMMITTED` | Se conserva dentro de la SPEC v58 vigente. |
| RQ-010 | Estados explícitos de drafts | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-011 | Seleccionar, revisar y aprobar una versión anterior | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-012 | Rollback del draft actual | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-013 | Addendums como artefactos de primera clase | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-014 | Amendments determinísticos | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-015 | Detección automática de content loss | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-016 | Niveles de detalle por fase | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-017 | Presupuesto de complejidad del artefacto | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-018 | Pipeline previo al reviewer IA | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-019 | Reviewer semántico acotado | SPEC-V59 | `EARLY` | Integridad de drafts, amendments, preservación y review acotado. |
| RQ-020 | Separar contrato de estado | SPEC-V62 | `EARLY` | Separación contrato/estado y contrato machine-readable. |
| RQ-021 | Governance transition separada | SPEC-V62 | `EARLY` | Separación contrato/estado y contrato machine-readable. |
| RQ-022 | Importar review externo | SPEC-V76 | `DEFER_CONDITIONAL` | Import de review externo solo cuando exista evidencia/adapter real. |
| RQ-023 | Target-aware execution bundle | SPEC-V67 + SPEC-V77 | `SPLIT` | Bundle acotado en Feature Delivery; generalización con AgentRuntime. |
| RQ-024 | Timeout y retry policy | SPEC-V59 + SPEC-V78 | `SPLIT` | Retry semántico/técnico temprano; lifecycle durable después. |
| RQ-025 | Capability discovery | SPEC-V69 + SPEC-V71 + SPEC-V77 | `SPLIT` | Capabilities se detectan por integración/runtime; no se asumen. |
| RQ-026 | Evidence provider interface | SPEC-V76 | `CONDITIONAL` | Evidence provider después del EvidenceBundle portable. |
| RQ-027 | Vulnerability delta | SPEC-V68 + SPEC-V75 + SPEC-V83 | `SPLIT` | Delta de vulnerabilidad se usa en QA, Control y backend sensible. |
| RQ-028 | Doctor con scope | SPEC-V64 | `REFRAME` | Doctor scoped se integra al Rescue/Audit del proyecto. |
| RQ-029 | Spec desde plan condicionado | SPEC-V58 | `COMMITTED` | Plan condicionado ya forma parte de la gobernanza vigente. |
| RQ-030 | Métricas mínimas | SPEC-V63 + SPEC-V73 + SPEC-V81 | `SPLIT` | Métricas de UX, findings y costo; no solo métricas internas. |
| RQ-031 | Compatibilidad con specs existentes | SPEC-V62 + SPEC-V64 | `EARLY` | Compatibilidad de artifacts y onboarding de proyectos existentes. |
| RQ-032 | Platform Role Registry | SPEC-V71 + SPEC-V72 + SPEC-V75 | `REFRAME_READ_ONLY` | Roles/estado/single-writer comienzan read-only y luego Control. |
| RQ-033 | Canonical Workflow State Model | SPEC-V71 + SPEC-V72 + SPEC-V75 | `REFRAME_READ_ONLY` | Roles/estado/single-writer comienzan read-only y luego Control. |
| RQ-034 | Source of Truth and Single Writer Policy | SPEC-V71 + SPEC-V72 + SPEC-V75 | `REFRAME_READ_ONLY` | Roles/estado/single-writer comienzan read-only y luego Control. |
| RQ-035 | Linear Work Item Methodology | SPEC-V72 | `REFRAME_READ_ONLY` | Linear inicia como correlación, no como escritor automático. |
| RQ-036 | Linear Approval and Attachment Contract | SPEC-V72 | `REFRAME_READ_ONLY` | Linear inicia como correlación, no como escritor automático. |
| RQ-037 | GitHub Delivery Methodology | SPEC-V69 + SPEC-V71 | `SPLIT` | Entrega GitHub en Studio y provenance continuo en Observer. |
| RQ-038 | Codex Cloud Execution Methodology | SPEC-V67 + SPEC-V77 | `SPLIT` | Ejecución inicial asistida; contrato runtime neutral posterior. |
| RQ-039 | Vercel Environment Model | SPEC-V69 + SPEC-V74 + SPEC-V85 | `SPLIT` | Preview primero; provenance productivo y delivery después. |
| RQ-040 | Deployment Strategy Policy | SPEC-V69 + SPEC-V85 | `SPLIT` | Preview-only temprano; políticas de producción más tarde. |
| RQ-041 | PR Preview Contract | SPEC-V69 | `EARLY` | Identidad exacta de PR Preview necesaria en Alpha. |
| RQ-042 | Shared Staging Contract | SPEC-V85 | `DEFER_CONDITIONAL` | Staging y production strategy solo tras validar producto/Control. |
| RQ-043 | Production Release Strategy | SPEC-V85 | `DEFER_CONDITIONAL` | Staging y production strategy solo tras validar producto/Control. |
| RQ-044 | QA Manifest and Deployment Identity | SPEC-V69 + SPEC-V85 | `SPLIT` | QA manifest mínimo temprano; release identity completo en Delivery. |
| RQ-045 | Multi-component Release Manifest | SPEC-V85 | `DEFER_CONDITIONAL` | Release compuesto antes de producción automatizada. |
| RQ-046 | Environment Data Isolation Policy | SPEC-V69 + SPEC-V83 + SPEC-V85 | `SPLIT` | Aislamiento de datos desde Preview hasta producción. |
| RQ-047 | Composite Rollback Contract | SPEC-V85 | `DEFER_CONDITIONAL` | Rollback por componente cuando exista producción administrada. |
| RQ-048 | Provider Capability Profile | SPEC-V69 + SPEC-V74 + SPEC-V77 | `SPLIT` | Capabilities por preview, observabilidad y runtime. |
| RQ-049 | Provider Intents | SPEC-V71 + SPEC-V72 + SPEC-V74 + SPEC-V87 | `SPLIT` | Intents/events/sync se vuelven activos con Orchestrator; antes solo correlación. |
| RQ-050 | State Synchronization and Conflict Avoidance | SPEC-V71 + SPEC-V72 + SPEC-V74 + SPEC-V87 | `SPLIT` | Intents/events/sync se vuelven activos con Orchestrator; antes solo correlación. |
| RQ-051 | Platform Event Contract and Idempotency | SPEC-V71 + SPEC-V72 + SPEC-V74 + SPEC-V87 | `SPLIT` | Intents/events/sync se vuelven activos con Orchestrator; antes solo correlación. |
| RQ-052 | Native Integration Preference | SPEC-V69 + SPEC-V71 + SPEC-V72 + SPEC-V74 | `PRINCIPLE` | Preferir integraciones nativas siempre que no tomen el estado canónico. |
| RQ-053 | Agent Skills Distribution | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-054 | Project Scope por defecto | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-055 | Canonical Skill Catalog | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-056 | Portable Skill Contract y extensiones vendor-specific | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-057 | Managed Skill Manifest | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-058 | Protección de modificaciones locales | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-059 | Skill Lifecycle CLI | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-060 | Skill Security and Trust Model | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-061 | Skill Activation Policy | SPEC-V80 | `CONDITIONAL` | Skills/Provider Packs solo con Runtime y evals; catálogo inicial reducido. |
| RQ-062 | `quiver-workflow` | SPEC-V80 | `CONDITIONAL` | Core Skills se materializan como procedimientos evaluados, no como prompts gigantes. |
| RQ-063 | `quiver-requirement-triage` | SPEC-V80 | `CONDITIONAL` | Core Skills se materializan como procedimientos evaluados, no como prompts gigantes. |
| RQ-064 | `quiver-review-plan` | SPEC-V80 | `CONDITIONAL` | Core Skills se materializan como procedimientos evaluados, no como prompts gigantes. |
| RQ-065 | `quiver-execute-slice` | SPEC-V80 | `CONDITIONAL` | Core Skills se materializan como procedimientos evaluados, no como prompts gigantes. |
| RQ-066 | `quiver-review-pr` | SPEC-V80 | `CONDITIONAL` | Core Skills se materializan como procedimientos evaluados, no como prompts gigantes. |
| RQ-067 | `quiver-recovery` | SPEC-V80 | `CONDITIONAL` | Core Skills se materializan como procedimientos evaluados, no como prompts gigantes. |
| RQ-068 | `quiver-preview-qa` | SPEC-V68 + SPEC-V69 + SPEC-V85 | `SPLIT` | QA/ambientes/release como capacidades; Skills formales después. |
| RQ-069 | `quiver-environment-audit` | SPEC-V68 + SPEC-V69 + SPEC-V85 | `SPLIT` | QA/ambientes/release como capacidades; Skills formales después. |
| RQ-070 | `quiver-release-safety` | SPEC-V68 + SPEC-V69 + SPEC-V85 | `SPLIT` | QA/ambientes/release como capacidades; Skills formales después. |
| RQ-071 | `quiver-supabase-change-safety` | SPEC-V83 | `CONDITIONAL` | Supabase safety forma parte del builder/backend sensible. |
| RQ-072 | `quiver-platform-migration` | SPEC-V64 + SPEC-V91 | `DEFER_CONDITIONAL` | Rescue detecta lock-in; migración general/adapters solo con casos reales. |
| RQ-073 | `quiver-base44-independence` | SPEC-V64 + SPEC-V91 | `DEFER_CONDITIONAL` | Rescue detecta lock-in; migración general/adapters solo con casos reales. |
| RQ-074 | `quiver-incident-triage` | SPEC-V88 | `CONDITIONAL` | Incident triage cuando existe observación productiva. |
| RQ-075 | `quiver-decision-memory` | SPEC-V60 + SPEC-V70 + SPEC-V92 | `REFRAME` | Decision memory pasa a Project Brain; Notion/Obsidian son adapters opcionales. |
| RQ-076 | Provider Pack Contract | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-077 | GitHub Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-078 | Linear Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-079 | Vercel Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-080 | Supabase Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-081 | Base44 Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-082 | Sentry Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-083 | Notion Provider Pack | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-084 | Skill and Provider Auto-Detection | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Packs/autodetection/ecosystem se implementan gradualmente según stack y demanda. |
| RQ-085 | Agent Runtime Contract | SPEC-V77 | `CONDITIONAL_G3` | Runtime neutral solo después de demanda de Execution. |
| RQ-086 | Runtime Adapter Contract y modos de integración | SPEC-V77 | `CONDITIONAL_G3` | Runtime neutral solo después de demanda de Execution. |
| RQ-087 | Run lifecycle, checkpoints y reanudación | SPEC-V78 | `CONDITIONAL_G3` | Lifecycle durable/checkpoints después del Runtime contract. |
| RQ-088 | Workspace aislado por run | SPEC-V77 | `CONDITIONAL_G3` | Workspace aislado es requisito de Execution general. |
| RQ-089 | Execution leases y control de concurrencia | SPEC-V78 | `CONDITIONAL_G3` | Leases y permission envelope para ejecución concurrente/segura. |
| RQ-090 | Permission Envelope y sandbox policy | SPEC-V78 | `CONDITIONAL_G3` | Leases y permission envelope para ejecución concurrente/segura. |
| RQ-091 | Orchestrator Adapter Contract y compatibilidad con OpenAI Symphony | SPEC-V86 + SPEC-V87 | `CONDITIONAL` | Gap analysis antes de adoptar/construir Orchestrator. |
| RQ-092 | Repository Workflow Contract | SPEC-V87 | `CONDITIONAL` | Workflow durable se materializa con el backend/orchestrator elegido. |
| RQ-093 | Context Manifest e input provenance | SPEC-V61 + SPEC-V77 | `SPLIT` | Context Manifest sirve desde impacto; ejecución agrega runtime provenance. |
| RQ-094 | Context budget, progressive disclosure y compaction | SPEC-V61 | `EARLY` | Context budget y progressive disclosure son parte del Project Brain útil. |
| RQ-095 | Instruction trust boundary y defensa contra prompt injection | SPEC-V61 + SPEC-V78 | `SPLIT` | Trust boundary temprano; enforcement de tools/secrets en Execution. |
| RQ-096 | Artifact Envelope y lineage graph | SPEC-V62 + SPEC-V76 | `SPLIT` | Envelope/lineage temprano; evidencia completa después. |
| RQ-097 | Unified Evidence Bundle | SPEC-V76 | `CONDITIONAL` | EvidenceBundle/ledger al pasar de QA local a Control compartido. |
| RQ-098 | Append-only Run Ledger y tamper evidence | SPEC-V76 | `CONDITIONAL` | EvidenceBundle/ledger al pasar de QA local a Control compartido. |
| RQ-099 | Execution Environment Fingerprint | SPEC-V77 + SPEC-V85 | `SPLIT` | Environment fingerprint para execution y release identity. |
| RQ-100 | Identidad y autorización del actor de governance | SPEC-V58 + SPEC-V76 + SPEC-V90 | `SPLIT` | Identidad mínima en v58; decisiones verificables y enterprise después. |
| RQ-101 | Break-glass formal | SPEC-V75 + SPEC-V85 + SPEC-V90 | `DEFER_CONDITIONAL` | Break-glass solo con enforcement/producción sensible. |
| RQ-102 | Quiver Eval Scenario Contract | SPEC-V80 | `CONDITIONAL` | Evals y regression gates antes de routing/autonomía amplia. |
| RQ-103 | Skill activation y behavior evals | SPEC-V80 | `CONDITIONAL` | Evals y regression gates antes de routing/autonomía amplia. |
| RQ-104 | Experiment Matrix para runtimes, modelos y policies | SPEC-V80 | `CONDITIONAL` | Evals y regression gates antes de routing/autonomía amplia. |
| RQ-105 | Scorers determinísticos y model graders | SPEC-V80 | `CONDITIONAL` | Evals y regression gates antes de routing/autonomía amplia. |
| RQ-106 | Regression gates para runtime, Skills, policies y modelos | SPEC-V80 | `CONDITIONAL` | Evals y regression gates antes de routing/autonomía amplia. |
| RQ-107 | Per-run budget reservation y enforcement | SPEC-V81 | `CONDITIONAL` | Budget y TraceBudget cuando Quiver administra ejecución costosa. |
| RQ-108 | Cost attribution y adapter de TraceBudget | SPEC-V81 | `CONDITIONAL` | Budget y TraceBudget cuando Quiver administra ejecución costosa. |
| RQ-109 | OpenTelemetry y correlación cross-platform | SPEC-V74 + SPEC-V88 + SPEC-V90 | `SPLIT` | Correlación mínima primero; observabilidad/enterprise según escala. |
| RQ-110 | Data classification, redaction y retention | SPEC-V60 + SPEC-V76 + SPEC-V90 | `SPLIT` | Clasificación del conocimiento/evidence desde temprano; retención enterprise después. |
| RQ-111 | Secret broker y credenciales efímeras | SPEC-V78 + SPEC-V90 | `CONDITIONAL_WRITE` | Secret broker solo cuando existen acciones remotas de escritura. |
| RQ-112 | MCP Capability Registry y exposición mínima de tools | SPEC-V91 | `DEFER_CONDITIONAL` | MCP/planning interop después de estabilizar el núcleo del producto. |
| RQ-113 | MCP Tasks bridge | SPEC-V91 | `DEFER_CONDITIONAL` | MCP/planning interop después de estabilizar el núcleo del producto. |
| RQ-114 | MCP Apps como superficie de aprobación | SPEC-V91 | `DEFER_CONDITIONAL` | MCP/planning interop después de estabilizar el núcleo del producto. |
| RQ-115 | Planning Artifact Adapters | SPEC-V91 | `DEFER_CONDITIONAL` | MCP/planning interop después de estabilizar el núcleo del producto. |
| RQ-116 | Multi-repository Change Set | SPEC-V89 | `DEFER_CONDITIONAL` | Multi-repo solo después de single-repo y demanda repetida. |
| RQ-117 | Stable Machine Interface, schemas y exit codes | SPEC-V62 | `EARLY` | Stable machine interface es fundación para Studio/Cloud. |
| RQ-118 | Policy explain y dry-run | SPEC-V75 | `CONTROL` | Policy explain/dry-run es requisito para enforcement comprensible. |
| RQ-119 | Supply-chain trust para Skills y Provider Packs | SPEC-V80 + SPEC-V91 + SPEC-V92 | `CONDITIONAL` | Supply-chain trust antes de catálogo/marketplace amplio. |
