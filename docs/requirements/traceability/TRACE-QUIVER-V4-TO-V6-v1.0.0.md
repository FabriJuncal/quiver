---
artifact_id: "TRACE-QUIVER-V4-TO-V6"
artifact_type: "traceability"
version: "1.0.0"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-03"
derived_from:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0"
  path: "../Quiver_Especificaciones_Requerimientos_v6.md"
catalog:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0.1"
  path: "../REQ-QUIVER-PRODUCT-CATALOG-v6.0.1.md"
source_section_sha256: "a49408922b791a1f5d0692b0c4bb78bde4ca4d1f643578d371b28aaa59277307"
decisions:
  - decision_id: "DEC-20260903-010"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Extraer la trazabilidad v4 → v6 como artefacto compartido"
    reason: "Evitar duplicar 119 mappings en las siete iniciativas"
    impact: "Preserva la trazabilidad completa y reduce el contexto de lectura por iniciativa"
---

# Trazabilidad técnica Quiver v4 → v6

Este artefacto soporta las siete iniciativas del
[catálogo segmentado v6.0.1](../REQ-QUIVER-PRODUCT-CATALOG-v6.0.1.md).

## Apéndice E — Trazabilidad completa de RQ v4 → SPEC v6

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
