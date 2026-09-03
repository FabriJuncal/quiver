---
title: "Quiver — Roadmap Maestro v6: Engine, Project Brain, Studio y Cloud"
document_type: "Master Product & Engineering Roadmap"
artifact_id: "PLAN-QUIVER-MASTER"
artifact_type: "plan"
version: "6.0"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-01"
supersedes:
  - "Quiver_Roadmap_Maestro_v5_1.md"
related_spec_catalog: "../requirements/Quiver_Especificaciones_Requerimientos_v6.md"
requirements:
  - artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
    version: "6.0"
    path: "../requirements/Quiver_Especificaciones_Requerimientos_v6.md"
source_provenance:
  imported_on: "2026-09-02"
  source_filename: "Quiver_Roadmap_Maestro_v6.md"
  source_sha256: "b322e034d15b86d3a45457b82b3bfb99ae50da13da467bcfa47a865b964e8157"
decisions:
  - decision_id: "DEC-20260902-005"
    date: "2026-09-02"
    actor: "technical-agent"
    change: "Incorporar el roadmap maestro v6 en docs/plans y normalizar su enlace al catálogo"
    reason: "Mantener relación bidireccional y versionada con el catálogo de requerimientos v6"
    impact: "No cambia gates, dependencias ni estado; conserva lifecycle_status proposed"
---

# Quiver — Roadmap Maestro v6

## 0. Propósito

Este roadmap reorganiza Quiver alrededor de una visión de producto más clara:

> **Quiver debe sentirse como trabajar con un equipo completo de producto y desarrollo con IA, pero sin obligar al usuario a coordinar agentes ni aprender la metodología interna.**

La experiencia visible se construye en **Quiver Studio**. La rigurosidad vive debajo en **Quiver Protocol, Engine, Project Brain y los módulos de Quiver Cloud**.

El roadmap incorpora dos fuentes principales:

- el catálogo técnico de Quiver v4, que contiene contratos de governance, runtime, evidence, Skills, costos e interoperabilidad;
- el análisis de 204 dolores actuales de AI App Builders, donde el problema raíz pasa de generar código a mantener intención, coherencia, seguridad, evidencia, producción y conocimiento a través del tiempo.

No se convierten 204 dolores en 204 features. Se agrupan en capacidades que puedan producir una ventaja visible.

## 1. Regla de numeración

Las futuras especificaciones usan un ID estable:

```text
SPEC-V58
SPEC-V59
...
SPEC-V92
```

Cuando una spec se materialice en el repositorio OSS, el slug recomendado será:

```text
specs/quiver-vNN-<slug>/
```

En `quiver-cloud`, el ID `SPEC-VNN` sigue siendo canónico aunque la estructura física del repo sea diferente.

Cada requisito dentro de una spec usa:

```text
VNN-RQ-01
VNN-RQ-02
...
```

El archivo `Quiver_Especificaciones_Requerimientos_v6.md` es la autoridad para esos requisitos.

## 2. Arquitectura de producto final

```text
QUIVER
│
├── Quiver Protocol — OSS
│   └── schemas, IDs, envelopes, eventos y contratos de máquina
│
├── Quiver Engine — OSS
│   └── WDD/SDD, policies, findings, impacto, validators, evidence y governance
│
├── Quiver CLI — OSS
│   └── interfaz local, CI, audit, integración con repos y modo offline
│
├── Quiver Project Brain
│   ├── memoria estructurada y trazable
│   └── Open Knowledge Vault compatible con Markdown/Obsidian
│
└── Quiver Cloud — SaaS
    │
    ├── Quiver Studio
    │   └── experiencia simple para pedir, revisar, decidir y ver resultados
    │
    ├── Observer
    │   └── correlación, provenance, findings y salud del proyecto
    │
    ├── Control
    │   └── policies, approvals, checks y enforcement
    │
    ├── Execution
    │   └── runtimes, workspaces, permisos, equipo IA y costos
    │
    ├── Builder
    │   └── creación de nuevos productos y edición visual
    │
    ├── Orchestrator
    │   └── coordinación durable de agentes y plataformas
    │
    ├── Delivery / Operations
    │   └── releases, producción, recovery e incidentes
    │
    └── Enterprise / Ecosystem
        └── seguridad avanzada, multi-repo, MCP e integraciones opcionales
```

## 3. Principios de secuencia

1. **Experiencia simple, motor riguroso.** La metodología debe quedar detrás de Quiver Studio.
2. **Apps existentes antes que “creá cualquier app”.** El wedge inicial es mejorar software real y proyectos que empiezan a superar a los builders.
3. **Project Brain temprano.** La memoria confiable es parte del producto inicial, no una feature enterprise.
4. **QA independiente antes que autonomía.** El usuario debe poder confiar antes de delegar producción.
5. **Read-only antes que write.** Observer precede a Control y Control precede a Execution remota.
6. **Equipo dinámico, no teatro multiagente.** Se activan capacidades necesarias; no se muestran reuniones ficticias de bots.
7. **GitHub y formatos abiertos son propiedad del cliente.** Quiver debe ser valioso, no un lock-in artificial.
8. **Obsidian compatible, no Obsidian-dependiente.** Quiver crea el conocimiento; Obsidian puede ser una interfaz opcional.
9. **Gates comerciales antes de infra costosa.** No se construye Orchestrator, enterprise o marketplace por anticipación.
10. **Cada spec debe dogfoodearse con Quiver y cerrar con evidencia.**

## 4. Roadmap visual

```text
ACTUAL
SPEC-V58  Risk-aware Governance
   │
   ├──────────────┐
   ▼              ▼
SPEC-V59       SPEC-V60
Draft          Project Brain
Integrity      Foundation
   │              │
   └──────┬───────┘
          ▼
       SPEC-V61  Context + Impact
          │
          ▼
       SPEC-V62  Machine Contract + Provenance
          │
          ▼
════════════════ QUIVER STUDIO ALPHA ════════════════
SPEC-V63 → V64 → V65 → V66 → V67 → V68 → V69 → V70
 Cloud     Rescue  Lead   Design Delivery  QA   Preview Brain sync
Foundation        Brief                              + Obsidian-compatible
          │
          ▼
       G1 — PRODUCT VALUE / PAID REPEAT USE
          │
          ├─ FAIL → mantener OSS/Studio asistido, pivotear mensaje o ICP
          └─ PASS
               ▼
════════════════ OBSERVER + CONTROL ═════════════════
SPEC-V71 → V72 → V73 → V74 → V75 → V76
 GitHub     Linear  Health Prod    Policy Evidence
 Observer   corr.   findings provenance checks actors
               │
               ▼
            G2 — TRUST / ENFORCEMENT
               │
               └─ PASS
                    ▼
════════════════ EXECUTION + AI TEAM ════════════════
SPEC-V77 → V78 → V79 → V80 → V81
 Runtime    Perms   Dynamic  Skills  Cost
 Workspace  Resume  Team     Evals   Governance
                    │
                    ▼
                 G3 — EXECUTION DEMAND
                    │
                    ▼
════════════════ BUILDER / GREENFIELD ═══════════════
SPEC-V82 → V83 → V84 → V85
 New app    Backend Visual  Release /
 builder    safety  editor  Production
                    │
                    ▼
                 G4 — BUILDER RETENTION
                    │
                    ▼
════════════ ORCHESTRATION + OPERATIONS ═════════════
SPEC-V86 → G5 → SPEC-V87 → SPEC-V88
 Gap analysis       Durable      Continuous
                    workflows    operations
                          │
                          ▼
════════════════ SCALE / ECOSYSTEM ══════════════════
SPEC-V89 → V90 → V91 → V92
 Multi-repo Enterprise Interop Ecosystem/Obsidian plugin
```

## 5. Qué se implementa al principio

La primera apuesta de producto termina en **SPEC-V70**. El objetivo no es tener el Quiver final, sino demostrar este recorrido:

```text
Conectar proyecto existente
→ crear Project Brain
→ pedir una funcionalidad
→ confirmar intención e impacto
→ diseñar cuando haga falta
→ implementar
→ QA independiente
→ Vercel Preview
→ aprobar versión
→ crear PR
→ actualizar automáticamente la memoria
```

El usuario debe sentir que trabajó con producto + diseño + desarrollo + QA, aunque internamente la Alpha todavía pueda tener asistencia humana y usar Codex/v0 de manera acotada.

## 6. Tabla maestra de especificaciones

| Spec | Nombre | Parte de Quiver | Repo | Estado | Dependencias |
|---|---|---|---|---|---|
| **SPEC-V58** | Risk-aware Review Governance | Quiver Engine | `quiver` | IN_PROGRESS | Ninguna nueva; continuar la SPEC existente |
| **SPEC-V59** | Draft Integrity & Effective Contracts | Quiver Engine + CLI | `quiver` | PLANNED | SPEC-V58 |
| **SPEC-V60** | Project Brain & Open Knowledge Vault Foundation | Quiver Protocol + Engine + CLI | `quiver` | PLANNED | SPEC-V58; puede avanzar en paralelo con parte de SPEC-V59 |
| **SPEC-V61** | Context Selection, Contradictions & Impact Graph | Quiver Engine | `quiver` | PLANNED | SPEC-V60 |
| **SPEC-V62** | Machine Contract & Provenance Foundation | Quiver Protocol + Engine + CLI | `quiver` | PLANNED | SPEC-V58; integra con SPEC-V59–V61 |
| **SPEC-V63** | Quiver Studio Alpha & Cloud Foundation | Quiver Studio + Quiver Cloud Core | `quiver-cloud` | PLANNED | SPEC-V60, SPEC-V62 |
| **SPEC-V64** | Existing Project Onboarding & Quiver Rescue | Quiver Studio + Engine + CLI | `quiver-cloud + quiver` | PLANNED | SPEC-V60, SPEC-V61, SPEC-V63 |
| **SPEC-V65** | Quiver Lead, Feature Brief & Decision Inbox | Quiver Studio + Engine | `quiver-cloud + quiver` | PLANNED | SPEC-V61, SPEC-V63, SPEC-V64 |
| **SPEC-V66** | Product & UX Design Workspace | Quiver Studio + Design capability | `quiver-cloud` | PLANNED | SPEC-V65 |
| **SPEC-V67** | Assisted Feature Delivery Loop | Quiver Studio + Engine + CLI | `quiver-cloud + quiver` | PLANNED | SPEC-V62, SPEC-V65, SPEC-V66 |
| **SPEC-V68** | Independent QA & Strong Definition of Done | Quiver Engine + Studio | `quiver + quiver-cloud` | PLANNED | SPEC-V65, SPEC-V67 |
| **SPEC-V69** | GitHub + Vercel Preview & PR Delivery | Quiver Studio + Integration Shared | `quiver-cloud + quiver` | PLANNED | SPEC-V62, SPEC-V67, SPEC-V68 |
| **SPEC-V70** | Project Brain Continuous Reconciliation & Obsidian Compatibility | Project Brain + Studio + Engine | `quiver + quiver-cloud` | PLANNED | SPEC-V60, SPEC-V67, SPEC-V68, SPEC-V69 |
| **SPEC-V71** | GitHub Read-only Provenance Observer | Quiver Cloud / Observer | `quiver-cloud` | CONDITIONAL | G1 + SPEC-V62 + SPEC-V69 |
| **SPEC-V72** | Linear Read-only Work Correlation | Quiver Cloud / Observer | `quiver-cloud` | CONDITIONAL | G1 + SPEC-V71 |
| **SPEC-V73** | Observer Project Health & Actionable Findings | Quiver Cloud / Observer | `quiver-cloud` | CONDITIONAL | SPEC-V71, SPEC-V72 |
| **SPEC-V74** | Production Provenance: Vercel + Sentry | Quiver Cloud / Observer | `quiver-cloud` | CONDITIONAL | G1 + SPEC-V73 |
| **SPEC-V75** | Policy Engine & GitHub Checks | Quiver Engine + Cloud / Control | `quiver + quiver-cloud` | CONDITIONAL | G2 + SPEC-V73 |
| **SPEC-V76** | Unified Evidence Bundle & Actor Decisions | Quiver Protocol + Engine + Cloud / Control | `quiver + quiver-cloud` | CONDITIONAL | SPEC-V62, SPEC-V68, SPEC-V75 |
| **SPEC-V77** | AgentRuntime Contract & Workspace Isolation | Quiver Engine + Cloud / Execution | `quiver + quiver-cloud` | CONDITIONAL | G3 + SPEC-V62 + SPEC-V76 |
| **SPEC-V78** | Permission Envelopes, Checkpoints & Leases | Quiver Engine + Cloud / Execution | `quiver + quiver-cloud` | CONDITIONAL | SPEC-V77 |
| **SPEC-V79** | Dynamic AI Product & Engineering Team | Quiver Studio + Cloud / Execution | `quiver-cloud` | CONDITIONAL | SPEC-V65, SPEC-V66, SPEC-V77, SPEC-V78 |
| **SPEC-V80** | Skills, Evals & Model/Runtime Quality | Quiver Engine + Cloud / Execution Reliability | `quiver + quiver-cloud` | CONDITIONAL | SPEC-V77, SPEC-V79 |
| **SPEC-V81** | Cost Governance & TraceBudget | Quiver Cloud / Execution Economics | `quiver-cloud + tracebudget-adapter` | CONDITIONAL | SPEC-V77, SPEC-V79, SPEC-V80 |
| **SPEC-V82** | New Product Builder Foundation | Quiver Studio + Cloud / Builder | `quiver-cloud` | CONDITIONAL | G4 + SPEC-V65–V81 |
| **SPEC-V83** | Managed Backend, Data & Security Builder | Quiver Cloud / Builder + Engine | `quiver-cloud + quiver` | CONDITIONAL | SPEC-V82 |
| **SPEC-V84** | Visual Editor & Design System Governance | Quiver Studio / Builder | `quiver-cloud` | CONDITIONAL | SPEC-V66, SPEC-V82 |
| **SPEC-V85** | Release, Production Readiness & Recovery | Quiver Cloud / Delivery | `quiver-cloud + quiver` | CONDITIONAL | SPEC-V74, SPEC-V76, SPEC-V78, SPEC-V83 |
| **SPEC-V86** | Orchestrator Gap Analysis | Quiver Cloud / Architecture | `quiver-cloud` | CONDITIONAL | SPEC-V77–V81 + evidencia de demanda |
| **SPEC-V87** | Durable Orchestrator Workflows | Quiver Cloud / Orchestrator | `quiver-cloud` | CONDITIONAL | G5 + SPEC-V86 |
| **SPEC-V88** | Continuous Operations & Incident Team | Quiver Cloud / Operations | `quiver-cloud` | CONDITIONAL | SPEC-V74, SPEC-V79, SPEC-V85, opcional SPEC-V87 |
| **SPEC-V89** | Team Collaboration & Multi-repository Change Sets | Quiver Cloud / Collaboration | `quiver-cloud + quiver` | CONDITIONAL | SPEC-V75–V88 + demanda real |
| **SPEC-V90** | Enterprise Governance, Security & Data Protection | Quiver Cloud / Enterprise | `quiver-cloud + quiver` | CONDITIONAL | Clientes enterprise concretos |
| **SPEC-V91** | Interoperability, MCP & Planning Adapters | Quiver Protocol + Cloud / Ecosystem | `quiver + quiver-cloud` | CONDITIONAL | Demanda + contratos estables |
| **SPEC-V92** | Ecosystem & Optional Knowledge Adapters | Quiver Cloud / Ecosystem + Project Brain | `quiver-cloud + plugins` | CONDITIONAL | Demanda demostrada |

## 7. Gates de negocio y producto

### G1 — Product Value / Paid Repeat Use

Se evalúa después de SPEC-V70. Antes de ampliar Observer/Control debe existir evidencia como:

- al menos 5 design partners con repos reales;
- al menos 3 equipos que pidieron una segunda o tercera Feature Delivery;
- QA/Project Brain identificados como valor real y no como burocracia;
- al menos un piloto pago o compromiso equivalente;
- onboarding que no exija aprender WDD/SDD;
- tasa de rescate humano conocida y aceptable.

Si falla, no se compensa construyendo más infraestructura.

### G2 — Trust / Enforcement

Antes de pasar de Observer a Control fuerte o ejecución remota:

- los findings del Observer tienen precisión aceptable;
- al menos dos clientes quieren que Quiver haga enforcement;
- existen políticas activas en warn con falsos positivos medidos;
- el cliente acepta permisos adicionales de GitHub.

### G3 — Execution Demand

Antes de SPEC-V77+ debe existir demanda concreta de que Quiver ejecute/retome trabajo, no solo lo observe.

### G4 — Builder Retention

Antes de ampliar el builder greenfield:

- los usuarios existentes vuelven a pedir features;
- la calidad de entrega requiere poco rescate humano;
- el stack inicial cubre un segmento claro;
- la promesa “equipo completo” genera pago, no solo demos.

### G5 — Orchestrator Decision

SPEC-V86 puede concluir:

```text
ADOPT
ADAPT
EXTEND
FORK
BUILD_NATIVE
DO_NOT_BUILD
```

`BUILD_NATIVE` requiere gaps verificables y demanda paga.

## 8. Dolor → ventaja competitiva → spec

| Dolor raíz | Fortaleza Quiver | Specs principales |
|---|---|---|
| Pérdida de contexto e intención | Project Brain con vigencia, fuentes y precedencia | V60, V61, V70 |
| Ambigüedad de prompts | Quiver Lead + Feature Brief + Decision Inbox | V65 |
| Cambios que rompen otras cosas | Impact Graph + QA de regresión | V61, V68 |
| “Listo” sin demostrarlo | Strong Definition of Done + Evidence | V68, V76 |
| Loops de reparación | Review budgets, checkpoints y recovery | V58, V59, V78 |
| Deuda/design drift | Rescue + UX governance + Project Health | V64, V66, V73, V84 |
| Seguridad/RLS/datos | Risk-aware Control + Backend Safety | V58, V75, V83, V90 |
| Lock-in / graduation problem | GitHub + open vault + adapters | V60, V64, V82, V91, V92 |
| Humanos y agentes se pisan | Ownership + leases + dynamic team | V73, V78, V79, V89 |
| Producción parece lista pero no lo está | Production Readiness + composite release | V74, V85 |
| Costos impredecibles | Presupuesto preventivo y equipo mínimo | V79, V81 |
| Soporte “no-code until it breaks” | Incident Team + explicaciones accionables | V88 |

## 9. Política para Obsidian

El roadmap **no** crea una instancia de Obsidian por proyecto.

La decisión canónica es:

```text
Quiver Project Brain
→ almacenamiento/contratos propios de Quiver
→ Open Knowledge Vault (Markdown + YAML + links)
→ compatible con Obsidian
```

Etapas:

1. **SPEC-V60:** formato compatible, automático y exportable.
2. **SPEC-V70:** actualización continua e importación como proposal.
3. **SPEC-V92:** plugin/Headless/Sync opcionales solo si existe demanda y revisión de condiciones vigentes.

Obsidian nunca es la fuente de estado operativo, permisos, runs, billing, locks o secretos.

## 10. Qué no se construye al inicio

- “Creá cualquier app” desde un único prompt.
- Mobile nativo.
- Editor visual generalista.
- Producción automática.
- Multi-repo general.
- Orchestrator propietario sin gap analysis.
- Marketplace de Skills.
- Obsidian obligatorio o invisible como backend.
- Notion + Obsidian + Linear escribiendo el mismo estado.
- Equipo fijo de diez agentes premium.
- Personalidades/avatares como sustituto de capacidades reales.
- Claims de “sin bugs”, “sin lock-in” o “enterprise-ready” sin evidencia.

## 11. Hitos de producto

### Hito A — Quiver Engine confiable

SPEC-V58–V62.

### Hito B — Quiver Studio Alpha

SPEC-V63–V70.

Resultado comercial que se busca validar:

> **“Pedí una funcionalidad para tu producto y recibí una versión entendida, diseñada, construida, probada, documentada y lista para revisar.”**

### Hito C — Quiver Observer / Control

SPEC-V71–V76.

### Hito D — Quiver Execution Team

SPEC-V77–V81.

### Hito E — Quiver Builder

SPEC-V82–V85.

### Hito F — Quiver Operating Team

SPEC-V86–V88.

### Hito G — Quiver at Scale

SPEC-V89–V92.

## 12. Regla final

> **La meta no es completar todos los specs. La meta es demostrar, spec por spec, que cada nueva capa reduce trabajo, riesgo o costo suficiente para justificar su complejidad.**
