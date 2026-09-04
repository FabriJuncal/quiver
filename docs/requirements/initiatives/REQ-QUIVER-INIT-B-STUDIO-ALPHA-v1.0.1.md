---
artifact_id: "REQ-QUIVER-INIT-B-STUDIO-ALPHA"
artifact_type: "requirements"
version: "1.0.1"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./REQ-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.0.md"
catalog:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0.4"
  path: "../REQ-QUIVER-PRODUCT-CATALOG-v6.0.4.md"
derived_from:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0"
  path: "../Quiver_Especificaciones_Requerimientos_v6.md"
source_specs:
  - "SPEC-V63"
  - "SPEC-V64"
  - "SPEC-V65"
  - "SPEC-V66"
  - "SPEC-V67"
  - "SPEC-V68"
  - "SPEC-V69"
  - "SPEC-V70"
source_section_sha256: "da107993b800cd0a6ddf9f7f5f8535fb2ed005930cac420af337806d27cf668d"
related_plans:
  - artifact_id: "PLAN-QUIVER-MASTER"
    catalog_path: "../../plans/README.md"
  - artifact_id: "PLAN-QUIVER-INIT-B-STUDIO-ALPHA"
    catalog_path: "../../plans/README.md"
decisions:
  - decision_id: "DEC-20260903-004"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Extraer SPEC-V63–SPEC-V70 como iniciativa B"
    reason: "Reducir el contexto por tarea sin duplicar el rol de las specs ejecutables"
    impact: "Crea una iniciativa versionable con 8 specs y 80 requisitos; no cambia alcance"
  - decision_id: "DEC-20260903-027"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Agregar el plan específico de la iniciativa B como relación durable"
    reason: "La cadena A fue aprobada y el workflow habilita planificar B"
    impact: "Actualiza metadata y bindings; no cambia los 80 requisitos ni sus criterios"
---

# Iniciativa B — Quiver Studio Alpha

## Objetivo de la iniciativa

Validar la primera experiencia vendible: conectar un proyecto, entender, diseñar, implementar, verificar, previsualizar y reconciliar memoria.

## Alcance y secuencia

- **Hito:** Hito B — Quiver Studio Alpha.
- **Specs incluidas:** `SPEC-V63`, `SPEC-V64`, `SPEC-V65`, `SPEC-V66`, `SPEC-V67`, `SPEC-V68`, `SPEC-V69`, `SPEC-V70`.
- **Requisitos incluidos:** 80.
- **Gate canónico:** G1 se evalúa después de SPEC-V70 y antes de ampliar Observer/Control.
- Las dependencias declaradas dentro de cada spec conservan precedencia.
- Independiente significa versionable y planificable como unidad; no autoriza
  ejecutar una spec antes de cerrar sus dependencias y gates.

## Contratos compartidos

- [Catálogo segmentado v6.0.4](../REQ-QUIVER-PRODUCT-CATALOG-v6.0.4.md)
- [Plan maestro efectivo v6.0.4](../../plans/PLAN-QUIVER-MASTER-v6.0.4.md)
- [Plan de la iniciativa B v1.0.0](../../plans/PLAN-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.0.md)
- [Trazabilidad completa RQ v4 → SPEC v6](../traceability/TRACE-QUIVER-V4-TO-V6-v1.0.0.md)

## Especificaciones incluidas

## SPEC-V63 — Quiver Studio Alpha & Cloud Foundation

**Versión:** `v63`<br>
**Slug sugerido:** `quiver-v63-studio-alpha-cloud-foundation`<br>
**Componente:** Quiver Studio + Quiver Cloud Core<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60, SPEC-V62

### Problema / objetivo

Crear la experiencia simple y central del usuario, separada de la consola técnica, con organizaciones y proyectos mínimos.

### Resultado que debe percibir el usuario

El usuario entra a Quiver y entiende qué hacer sin aprender WDD, SDD, slices, digests ni comandos.

### Dolor(es) del catálogo de builders que ataca

Secciones: `84–89, 132–134, 149–154, 190–194` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Nueva capa de producto sobre los contratos v5.1; aprovecha P-25 de v4

### Requerimientos

#### V63-RQ-01

Crear Quiver Studio como experiencia primaria y una Engineering Console avanzada como vista secundaria.

#### V63-RQ-02

Permitir registro, organización, proyecto y miembros básicos sin construir todavía administración enterprise.

#### V63-RQ-03

La pantalla inicial debe ofrecer dos caminos: mejorar producto existente y crear producto nuevo; el segundo puede permanecer limitado o marcado como beta.

#### V63-RQ-04

El usuario debe interactuar principalmente con Quiver Lead, no con múltiples chats de agentes.

#### V63-RQ-05

Traducir lenguaje interno a términos simples: objetivo, pasos, problema, comprobación, decisión y publicación.

#### V63-RQ-06

Cada pantalla debe responder qué ocurre, por qué importa y qué debe hacer el usuario.

#### V63-RQ-07

Aplicar progressive disclosure: detalles técnicos ocultos por defecto pero accesibles.

#### V63-RQ-08

Incluir panel de proyecto, actividad, decisiones pendientes y Project Brain.

#### V63-RQ-09

No presentar resultados claimed como verified.

#### V63-RQ-10

Instrumentar métricas de activación y uso sin capturar código o secretos innecesarios.

### Criterios de aceptación

- Un usuario de prueba completa onboarding sin documentación técnica.
- La interfaz no exige conocer la metodología Quiver.
- Existe un camino claro desde proyecto hasta siguiente acción.
- Los detalles técnicos se pueden abrir sin cambiar la fuente de estado.

### Fuera de alcance

- Editor visual completo
- Producción automática
- Billing complejo
- Enterprise SSO

---

## SPEC-V64 — Existing Project Onboarding & Quiver Rescue

**Versión:** `v64`<br>
**Slug sugerido:** `quiver-v64-existing-project-onboarding-rescue`<br>
**Componente:** Quiver Studio + Engine + CLI<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60, SPEC-V61, SPEC-V63

### Problema / objetivo

Entrar por proyectos existentes y proyectos “graduados” de builders, generando un diagnóstico y Project Brain antes de pedir grandes cambios.

### Resultado que debe percibir el usuario

Conecto mi repositorio y Quiver me explica qué producto tengo, qué riesgos ve y qué necesita confirmar antes de trabajar.

### Dolor(es) del catálogo de builders que ataca

Secciones: `57–68, 84–89, 101–108, 184–190` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-031; RQ-061; RQ-072–RQ-073; RQ-084; RQ-115

### Requerimientos

#### V64-RQ-01

Conectar GitHub inicialmente con permisos mínimos y soportar importación local/manual como fallback.

#### V64-RQ-02

Analizar estructura, stack, funcionalidades principales, documentación, tests, entornos y dependencias relevantes.

#### V64-RQ-03

Crear o enriquecer automáticamente el Project Brain a partir de evidencia observada.

#### V64-RQ-04

Distinguir hechos detectados de inferencias y pedir confirmación solo sobre ambigüedades importantes.

#### V64-RQ-05

Detectar señales de lock-in de builders o SDKs administrados y producir un Dependency/Exit Report sin obligar a migrar.

#### V64-RQ-06

Ofrecer un modo Rescue que clasifique riesgos de mantenibilidad, seguridad, deuda, pruebas y portabilidad.

#### V64-RQ-07

Mostrar valor antes de exigir conectar Linear, Sentry, Vercel u otras herramientas.

#### V64-RQ-08

Proponer un plan de estabilización priorizado por impacto, no una lista indiscriminada de problemas.

#### V64-RQ-09

Mantener los datos de cliente fuera del contexto cuando no son necesarios.

#### V64-RQ-10

Registrar qué partes del análisis son verified, observed, inferred o unknown.

### Criterios de aceptación

- Un repositorio real produce un Project Brain inicial y un Rescue Report.
- El usuario puede corregir una inferencia sin editar Markdown.
- El análisis no modifica el repo por defecto.
- Un proyecto de builder puede identificar dependencias de plataforma sin prometer migración automática.

### Fuera de alcance

- Migración automática general de Base44/Lovable/Bolt
- Escritura en proveedores
- Producción

---

## SPEC-V65 — Quiver Lead, Feature Brief & Decision Inbox

**Versión:** `v65`<br>
**Slug sugerido:** `quiver-v65-quiver-lead-feature-brief-decision-inbox`<br>
**Componente:** Quiver Studio + Engine<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V61, SPEC-V63, SPEC-V64

### Problema / objetivo

Convertir un pedido informal en un brief claro, un plan simple y pocas decisiones importantes antes de construir.

### Resultado que debe percibir el usuario

Pido una funcionalidad en lenguaje natural; Quiver confirma qué entendió, qué no incluye, qué puede afectar y qué necesita que decida.

### Dolor(es) del catálogo de builders que ataca

Secciones: `04–08, 50–54, 111–118, 129–154, 190–194` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Reutiliza RQ-003–RQ-007, RQ-063–RQ-064 y RQ-118; agrega UX de Quiver Lead

### Requerimientos

#### V65-RQ-01

Quiver Lead debe reformular el pedido en objetivos, alcance, no alcance y resultado esperado.

#### V65-RQ-02

Hacer preguntas únicamente cuando la respuesta pueda cambiar negocio, riesgo, UX, datos, costo o reversibilidad.

#### V65-RQ-03

Registrar supuestos importantes como supuestos, nunca como decisiones implícitas.

#### V65-RQ-04

Mostrar un Feature Brief simple con usuarios afectados, pasos, riesgo, impacto y definición de listo.

#### V65-RQ-05

Recomendar fast-delivery o high-assurance sin exponer taxonomía compleja al usuario común.

#### V65-RQ-06

Presentar qué capacidades del equipo se activarán para el cambio y por qué.

#### V65-RQ-07

Crear una Decision Inbox única para decisiones de producto, riesgo, costo y publicación.

#### V65-RQ-08

Cada decisión debe mostrar recomendación, alternativas, impacto y si es reversible.

#### V65-RQ-09

Ninguna decisión sensible se resuelve solo porque un agente la asumió.

#### V65-RQ-10

Una vez aprobado, el brief debe quedar vinculado al contrato interno y al Project Brain.

### Criterios de aceptación

- Un usuario puede entender y aprobar el cambio sin abrir SPEC.md.
- Las preguntas se mantienen acotadas y medibles.
- No hay supuestos críticos ocultos en el plan.
- La Decision Inbox concentra las intervenciones humanas.

### Fuera de alcance

- Gestor de tareas general
- Chat entre agentes
- Estimación contractual de fechas

---

## SPEC-V66 — Product & UX Design Workspace

**Versión:** `v66`<br>
**Slug sugerido:** `quiver-v66-product-ux-design-workspace`<br>
**Componente:** Quiver Studio + Design capability<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V65

### Problema / objetivo

Incorporar producto y UX/UI antes de programar cuando el cambio lo necesita, evitando que la IA solo agregue features sin criterio.

### Resultado que debe percibir el usuario

Antes de construir una experiencia nueva puedo ver el flujo, la propuesta visual y qué decisión de diseño necesito aprobar.

### Dolor(es) del catálogo de builders que ataca

Secciones: `94–100, 132–134, 149–159, 190–194` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Nuevo; relacionado con principios de evidence y risk de v4

### Requerimientos

#### V66-RQ-01

Activar Product/UX únicamente cuando la naturaleza del cambio lo justifique.

#### V66-RQ-02

Generar user flows y wireframes antes de código para cambios de interacción relevantes.

#### V66-RQ-03

Reutilizar el design system existente y detectar design drift antes de inventar variantes.

#### V66-RQ-04

Permitir cargar identidad visual, referencias y restricciones de marca.

#### V66-RQ-05

Usar v0 u otra herramienta visual como adapter opcional, no como fuente de reglas de negocio.

#### V66-RQ-06

Permitir comentar o señalar una preview de diseño y convertir el feedback en una propuesta trazable.

#### V66-RQ-07

Incluir responsive y accesibilidad básica en la definición de diseño.

#### V66-RQ-08

Aprobar el diseño o flujo antes de iniciar implementación cuando la policy lo exija.

#### V66-RQ-09

Registrar decisiones de UX durables en Project Brain.

#### V66-RQ-10

No construir todavía un editor visual full drag-and-drop.

### Criterios de aceptación

- Una nueva pantalla tiene flujo y estado aprobado antes de implementación cuando corresponde.
- Los componentes existentes se prefieren a variantes nuevas.
- La evidencia de diseño se puede relacionar con la implementación.
- El usuario puede dar feedback sin tocar código.

### Fuera de alcance

- Figma replacement
- Editor visual completo
- Generación de cualquier estilo sin restricciones

---

## SPEC-V67 — Assisted Feature Delivery Loop

**Versión:** `v67`<br>
**Slug sugerido:** `quiver-v67-assisted-feature-delivery-loop`<br>
**Componente:** Quiver Studio + Engine + CLI<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V62, SPEC-V65, SPEC-V66

### Problema / objetivo

Cerrar el primer recorrido comercial pedido → plan → implementación → resultado, usando el runtime actual y permitiendo asistencia humana detrás de escena.

### Resultado que debe percibir el usuario

Veo cómo mi cambio avanza por etapas y recibo una versión real del software, no solo una respuesta de chat.

### Dolor(es) del catálogo de builders que ataca

Secciones: `07–18, 50–54, 63–68, 111–137, 175–179, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Reutiliza capabilities actuales de v20–v57; prepara RQ-085+ sin exigir runtime general todavía

### Requerimientos

#### V67-RQ-01

Crear una unidad de Feature Delivery ligada a Feature Brief, diseño, branch, ejecución, QA y PR.

#### V67-RQ-02

Usar GitHub como fuente del código y una rama/worktree aislada para cada entrega.

#### V67-RQ-03

Permitir Codex como executor principal inicial y adapters adicionales solo cuando aporten valor.

#### V67-RQ-04

Mostrar progreso por resultados: definido, diseñado, implementando, verificando, listo para revisar.

#### V67-RQ-05

No mostrar cadenas internas de razonamiento ni conversaciones ficticias entre roles.

#### V67-RQ-06

Respetar scope y detectar cambios fuera del pedido antes del PR.

#### V67-RQ-07

Conservar checkpoints funcionales de la entrega aunque todavía no exista el Orchestrator durable final.

#### V67-RQ-08

Permitir intervención humana/concierge en Alpha sin presentarla como autonomía total.

#### V67-RQ-09

Registrar actor/agente, herramientas usadas, archivos cambiados y estado de verificación.

#### V67-RQ-10

Actualizar el Feature Delivery con fallos operativos distintos de fallos funcionales.

### Criterios de aceptación

- Una funcionalidad real puede atravesar el flujo completo sin coordinación manual visible para el usuario.
- Los cambios viven en GitHub y son revisables.
- Un error de push no se presenta como fallo de implementación.
- El usuario ve avance sin administrar agentes individuales.

### Fuera de alcance

- Autonomía 24/7
- Multi-agent concurrente general
- Producción automática

---

## SPEC-V68 — Independent QA & Strong Definition of Done

**Versión:** `v68`<br>
**Slug sugerido:** `quiver-v68-independent-qa-strong-definition-of-done`<br>
**Componente:** Quiver Engine + Studio<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V65, SPEC-V67

### Problema / objetivo

Convertir “terminado” en un estado verificable derivado de requisitos y evidencia independiente.

### Resultado que debe percibir el usuario

Quiver me dice qué fue comprobado, qué no, qué riesgos quedan y si la versión está realmente lista para revisar.

### Dolor(es) del catálogo de builders que ataca

Secciones: `07, 09–12, 37–49, 88–95, 120–137, 169–170, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-018–RQ-019; RQ-027; RQ-044; RQ-097; RQ-102–RQ-106

### Requerimientos

#### V68-RQ-01

Derivar casos de prueba de acceptance criteria y reglas de negocio, no solo de la implementación generada.

#### V68-RQ-02

Exigir revisión o QA independiente del executor en cambios que lo requieran.

#### V68-RQ-03

Ejecutar validadores determinísticos antes de un reviewer semántico.

#### V68-RQ-04

Incluir build/typecheck/lint/tests según stack y policy.

#### V68-RQ-05

Agregar browser/smoke tests para recorridos relevantes y controles visuales básicos cuando corresponda.

#### V68-RQ-06

Convertir bugs corregidos en regresiones permanentes cuando sea razonable.

#### V68-RQ-07

Distinguir passed, partially-validated, blocked, failed y not-tested.

#### V68-RQ-08

Presentar un informe no técnico de comprobaciones, límites y riesgos restantes.

#### V68-RQ-09

No permitir que la afirmación “resuelto” del executor se convierta sola en verified.

#### V68-RQ-10

Registrar evidence refs que puedan ser auditados en la consola avanzada.

### Criterios de aceptación

- Un test que confirma una implementación incorrecta no es suficiente si contradice un requirement.
- El informe de QA identifica explícitamente lo no probado.
- Una regresión crítica impide declarar listo.
- La vista simple y la evidencia técnica representan el mismo verdict.

### Fuera de alcance

- Cobertura 100% universal
- E2E en cada cambio sin policy
- Certificación formal de seguridad

---

## SPEC-V69 — GitHub + Vercel Preview & PR Delivery

**Versión:** `v69`<br>
**Slug sugerido:** `quiver-v69-github-vercel-preview-pr-delivery`<br>
**Componente:** Quiver Studio + Integration Shared<br>
**Repositorio objetivo:** `quiver-cloud + quiver`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V62, SPEC-V67, SPEC-V68

### Problema / objetivo

Entregar cada cambio en una preview identificable y un PR profesional sin automatizar producción.

### Resultado que debe percibir el usuario

Puedo probar exactamente la versión que fue verificada, comparar cambios, aprobarla y recibir un PR listo.

### Dolor(es) del catálogo de builders que ataca

Secciones: `41–42, 62, 65–68, 74–78, 88–95, 104–110, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-037; RQ-039–RQ-044; parte read/write mínima de RQ-048–RQ-052

### Requerimientos

#### V69-RQ-01

Relacionar Feature Delivery con branch y PR de GitHub.

#### V69-RQ-02

Crear o detectar Preview de Vercel para el HEAD exacto del PR.

#### V69-RQ-03

Exigir identidad PR HEAD = deployment source SHA = QA source SHA para aprobar la preview.

#### V69-RQ-04

Mostrar una preview navegable y comparación con la versión anterior cuando sea posible.

#### V69-RQ-05

Permitir comentarios del usuario sobre la versión y convertirlos en feedback trazable.

#### V69-RQ-06

Separar “aprobar esta versión” de “publicar esta versión”.

#### V69-RQ-07

Mantener producción deshabilitada en esta fase.

#### V69-RQ-08

Prohibir credenciales y datos productivos no permitidos en previews.

#### V69-RQ-09

Crear PR con resumen de objetivo, alcance, checks, riesgos, evidencia y findings pendientes.

#### V69-RQ-10

Marcar QA/aprobación stale si cambia el HEAD o deployment.

### Criterios de aceptación

- El usuario prueba el mismo SHA que QA validó.
- El PR contiene contexto de negocio y evidencia suficiente.
- Un nuevo commit invalida la aprobación anterior.
- Quiver no publica a producción.

### Fuera de alcance

- Merge automático
- Staging compartido
- Release productivo

---

## SPEC-V70 — Project Brain Continuous Reconciliation & Obsidian Compatibility

**Versión:** `v70`<br>
**Slug sugerido:** `quiver-v70-project-brain-continuous-reconciliation-obsidian`<br>
**Componente:** Project Brain + Studio + Engine<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 2 — Primera experiencia vendible<br>
**Estado:** `PLANNED`<br>
**Dependencias:** SPEC-V60, SPEC-V67, SPEC-V68, SPEC-V69

### Problema / objetivo

Cerrar el ciclo de memoria: cada entrega actualiza conocimiento, detecta drift y mantiene un vault abierto sin exigir trabajo documental al usuario.

### Resultado que debe percibir el usuario

Después de cada cambio, Quiver recuerda automáticamente qué se decidió y qué quedó pendiente; puedo exportarlo o abrirlo en Obsidian si quiero.

### Dolor(es) del catálogo de builders que ataca

Secciones: `02–06, 116–124, 139–149, 183–185, 200–204` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-075; RQ-093–RQ-096; RQ-115; nuevo adapter Obsidian-compatible

### Requerimientos

#### V70-RQ-01

Actualizar automáticamente hechos verificables del Project Brain después de merges, verificaciones y releases.

#### V70-RQ-02

Transformar inferencias o cambios de intención en propuestas que requieren aprobación antes de modificar conocimiento autorizado.

#### V70-RQ-03

Detectar documentation/spec drift frente a código y estado observado.

#### V70-RQ-04

Mantener links entre requirement, decisión, diseño, cambio, QA, PR y release.

#### V70-RQ-05

Generar y actualizar Open Knowledge Vault de forma determinística.

#### V70-RQ-06

Permitir descargar el vault o abrirlo en Obsidian sin instalar un plugin.

#### V70-RQ-07

Permitir importar cambios realizados en el vault únicamente como proposals con diff y aprobación.

#### V70-RQ-08

No utilizar Obsidian Sync o Headless como dependencia del servicio Quiver.

#### V70-RQ-09

No sincronizar bidireccionalmente el mismo estado con Notion/Obsidian/Linear sin single-writer explícito.

#### V70-RQ-10

Medir frescura del Brain, contradicciones detectadas y decisiones stale.

### Criterios de aceptación

- Una feature aprobada actualiza su conocimiento relevante sin intervención manual.
- Editar un Markdown fuera de Quiver no modifica una policy automáticamente.
- El vault exportado conserva IDs y enlaces.
- La UI muestra documentación potencialmente desactualizada.

### Fuera de alcance

- Plugin oficial de Obsidian
- Obsidian Headless
- Notion bidireccional general

---
