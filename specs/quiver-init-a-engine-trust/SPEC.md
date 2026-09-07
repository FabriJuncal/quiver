# SPEC-INIT-A — Engine and trust foundation

Version: 1.0.3. State: READY_FOR_IMPLEMENTATION.

Normative request/result schemas, P0 command scope, lock order, transitions and
crash recovery are specified in [CONTRACTS.md](./CONTRACTS.md). These details
resolve readiness findings without changing the 46 source requirements.

Source plan: [PLAN-A 1.0.2](../../docs/plans/PLAN-QUIVER-INIT-A-ENGINE-TRUST-v1.0.2.md).
Exact requirement: [REQ-A 1.0.3](../../docs/requirements/initiatives/REQ-QUIVER-INIT-A-ENGINE-TRUST-v1.0.3.md).
Program decisions: [QUIVER-PROGRAM-V6](../../docs/programs/quiver-v6/PROGRAM.md).

## Problem and current state

The existing CLI has immutable planner draft files and v58 digest-bound approvals,
but savePlannerDraft replaces current on every successful write, candidate checks
restrict historical versions, context packs select static files, and no typed
Project Brain or public Engine facade exists. V58 is completed at baseline
75fef298 through previously merged PR #144; it is inherited, not reimplemented.

## Expected behavior

Users can recover valid drafts without losing history; new projects gain governed
portable knowledge; task context is small, explainable and stale-aware; external
consumers use stable canonical values instead of parsing human CLI output.
All 46 RQs retain an explicit primary slice owner below.

## Scope and exclusions

Includes V58 baseline verification and all V59–V62 behaviors, tests, CLI surfaces,
additive storage, offline compatibility and package boundary validation.
Excludes Studio/Cloud implementation, production publication, Obsidian plugins,
enterprise graphs, general remote runtimes and replacement of v58 governance.
The final integration slice checks readiness but does not claim consumer plans
have passed before an independent cross-plan integration audit.

## Normative architecture and data ownership

### Draft integrity and effective contracts

Existing phase approvals and their locks remain the single authority. Immutable
version artifacts stay under the existing approval drafts directory. Metadata
adds lifecycle and selected current identity; next version remains max(history)+1,
not current+1. Current is a selection, not an unconditional approval status.
Selecting an earlier version revalidates exact input and artifact digests and
uses existing actor, review, findings and budget gates for subsequent approval.
A corrupted candidate remains inspectable but cannot become current. The previous
valid version remains eligible unless its own inputs or bytes are stale/corrupt.

Content preservation uses stable IDs, required structured collections and their
references. Fewer words alone is not a failure. Recognized Markdown identities
include requirement/acceptance/slice identifiers; JSON compares explicit identity
collections. Unsupported free-text semantics remain unknown. Required IDs cannot
be deleted silently: an amendment must enumerate removals and verify remaining
references. Addenda bind parent digest and inputs, preserve parent bytes and
produce deterministic effective content. Structured amendments support add,
replace and remove by stable ID in supported collections only. Parent cycles,
ambiguous paths, duplicate IDs and broken references fail closed.

Phase-local mutations use the existing phase lock and v58 compatibility writer
check; combined mutations acquire run lock before phase lock. Multi-file
projection updates use a validated recovery marker; readers
must not observe a partially committed selection. Recovery is deterministic and
preserves historical bytes. A technical retry retains request/input identity;
semantic changes use existing v58 review ledger classification and budget.

### Project Brain and open vault

Canonical knowledge is an append-only typed record store in the project-owned
Quiver internal root, physically separate from run state and any disposable
index. New project init creates an empty usable Brain; legacy initialization is
additive. Each record includes schema version, id, type, text/structured payload,
source refs with digests, created_at, authority, validity, supersedes and
provenance. Types: verified-fact, requirement, decision, assumption, risk, finding,
constraint, learning, release, incident. A record tagged verified-fact requires
referenced verifiable evidence; caller-supplied labels do not prove facts.

Authority ordering is policy > approved-decision > requirement > authorized-input
> agent-assumption. Conflicting authority is not silently resolved by latest time.
Supersession links preserve history and remove replaced records from active
projections. Appends, replacements and index maintenance share one lock-protected
writer; store updates use atomic rename and validated recovery. A cache never
becomes authority if the canonical store is missing or invalid.

Secret-bearing input and operational leases/tool traces are rejected before any
write, including temporary files and logs; use existing secret detection plus
structured credential-field checks. Path traversal and symlink escapes are
rejected. The threat model covers recognized fixture secrets and structured
credential fields, not a claim to identify all possible secrets in arbitrary text.
Vault export uses portable UTF-8 Markdown, YAML front matter and safe relative
links; manifest IDs/digests preserve full history, authority and validity.
External edits are import proposals with diff and no authority until reviewed.
Explicit delete quarantines only the validated Brain store and reports its
recoverable location; export/dry-run follows CONTRACTS.md. No Obsidian
installation, service or proprietary database is necessary to read the vault.

### Context and impact

Context uses explicit task requirements, module refs and graph relationships.
Every selected or excluded source has a reason; selected entries bind digest,
authority, confidence and validity. Mandatory policy/contract sources precede
optional context. Budget bytes are exact, any token estimate is labeled.
Mandatory overflow blocks rather than truncates. Trusted instructions and
untrusted content are separate structured fields and delimited in provider
prompts. Content claiming to be system instructions cannot grant authority.

Contradictions use explicit subject/predicate/value claims and observed source
refs. Irreconcilable relevant contractual claims yield a decision-needed result
with both sources. Prose that cannot be deterministically compared remains
unknown; optional semantic proposals cannot silently settle policy. A resolution
must be authorized and bind the exact conflicting source digests. Typed impact
nodes relate requirements, modules, data, permissions, APIs, UI, tests and
integrations. Observed/inferred edges stay distinct. The summary names affected,
excluded and unknown areas plus checks required before changing them.

Before provider execution or writes, verify manifest source digests and required
contracts. Changed or missing relevant contractual sources return CONTEXT_STALE.
This check is consumed by the existing executor, not merely an inspection helper.
Receipt-backed approval is revalidated through the trusted source resolver even
when content digests are unchanged; revoked/stale authority cannot enter trusted
instructions or resolve a contradiction. Historical provenance is retained.

### Artifact Envelope and canonical result

The contract envelope is immutable and separated from mutable execution state.
Fields include schema_version, id, type, version, digest, parents, inputs, actor,
status and evidence_status. Relations are derives-from, supersedes, amends,
verifies, executes, approves, deploys; identity alone cannot claim verification.
Canonical digest: recursively sort object keys, preserve array order, serialize
JSON UTF-8 without whitespace, exclude only the envelope's own digest field.
Reject undefined, non-finite numbers, cycles and non-JSON values.

Offline verification validates content available to the verifier. A missing
external parent produces explicit unverified evidence, never false verified.
Legacy reading is non-mutating and preserves its unverifiable limitations.
New decisions reuse v58 identity and default-deny authorization, binding actor,
action, target/version/digest and effective policy. Cloud clients cannot submit
trusted actor/grants by merely choosing request fields.

Canonical service results use:

```json
{"schema_version":1,"status":"passed","code":"OK","data":{},"errors":[],"evidence_status":"verified"}
```

Example only: a successful structural check is not automatically verified
business acceptance. Actual status/evidence reflect the operation. Error objects
contain code, message and safe details; no raw secret inputs. New command exit
classes: success 0, validation 2, policy 3, capability 4, runtime 5, security 6,
conflict 7, budget 8. Existing CLI exits remain compatible. Both human and JSON
views consume the same canonical value; machine enums/keys are not translated.

### Stable integration facade for B–G

`src/create-quiver/lib/engine.js` exports
`createEngine({projectRoot, actorResolver, evidenceResolver, clock})` returning version `1` and:

- envelopes.create(input), envelopes.verify(envelope)
- policy.explain(request), policy.authorize(request)
- brain.append(record, context), brain.query(filter), brain.exportVault(options),
  brain.importProposal(proposal, context)
- context.select(task), context.impact(task), context.verify(manifest)

Methods return the canonical result object. A trusted injected actorResolver
resolves identity; the default v58 local identity remains unverified and cannot
grant new Brain authority. No authority comes from arbitrary input.
Cloud accesses this facade through one adapter and core never imports Cloud.
The optional read-only evidenceResolver validates immutable scoped Cloud decision
receipts per CONTRACTS.md; existing v58 approval verification stays intact.
policy.authorize is still a no-ledger oracle. B owns its decision receipts and
outbox, A owns Brain writes, and neither fabricates the other's authority.
The trusted resolver supplies project-scoped grants for every operation; no
global shared project cache. Tests freeze this port before B starts implementation.

## Acceptance and requirement ownership

Each listed requirement is normative as written in the pinned source. Its owning
slice defines positive and negative executable cases. A final E2E may cover
multiple owners without duplicating ownership.

| Requirement | Primary slice | Required behavior |
|---|---|---|
| V58-RQ-01 | slice-00-foundation | Conservar los perfiles fast-delivery y high-assurance con rigurosidad proporcional al riesgo. |
| V58-RQ-02 | slice-00-foundation | Mantener findings estructurados con severidad, categoría, fase responsable, evidencia y disposición. |
| V58-RQ-03 | slice-00-foundation | Bloquear una fase solamente por findings que pertenecen realmente a esa fase según policy. |
| V58-RQ-04 | slice-00-foundation | Limitar las revisiones semánticas y detener loops con una decisión humana explícita. |
| V58-RQ-05 | slice-00-foundation | Soportar approved-with-conditions sin presentarlo como aprobación incondicional. |
| V58-RQ-06 | slice-00-foundation | Vincular decisiones a actor, versión, digest, findings y policy exactos. |
| V58-RQ-07 | slice-00-foundation | Transferir findings a spec, slice, PR o follow-up sin perder identidad ni trazabilidad. |
| V58-RQ-08 | slice-00-foundation | Cerrar la migración, compatibilidad, documentación y evidencia de las slices restantes sin iniciar v59 desde la rama de v58. |
| V59-RQ-01 | slice-01-draft-integrity | Definir estados explícitos de draft: draft, current, reviewed, approved, approved-with-conditions, rejected, superseded y corrupted. |
| V59-RQ-06 | slice-01-draft-integrity | Detectar content loss mediante IDs, colecciones requeridas, referencias y preservación estructural. |
| V59-RQ-07 | slice-01-draft-integrity | Marcar una versión defectuosa como corrupted sin invalidar automáticamente la anterior. |
| V59-RQ-02 | slice-02-draft-recovery | Permitir seleccionar, revisar y aprobar una versión anterior si sus inputs siguen vigentes. |
| V59-RQ-03 | slice-02-draft-recovery | Permitir rollback del puntero current sin eliminar ninguna versión histórica. |
| V59-RQ-04 | slice-03-effective-amendments | Crear addendums de primera clase para cambios acotados sin regenerar artefactos extensos. |
| V59-RQ-05 | slice-03-effective-amendments | Agregar amendments determinísticos para cambios estructurados cuando el formato lo permita. |
| V59-RQ-08 | slice-03-effective-amendments | Separar retry técnico de nueva revisión semántica y conservar lineage completo. |
| V60-RQ-01 | slice-05-brain-store | Crear automáticamente un Project Brain para cada proyecto Quiver. |
| V60-RQ-02 | slice-05-brain-store | Representar conocimiento como registros tipados: hecho verificado, requirement, decisión, supuesto, riesgo, finding, restricción, aprendizaje, release e incidente. |
| V60-RQ-03 | slice-05-brain-store | Cada registro debe conservar fuente, fecha, estado de vigencia, autoridad, reemplazo y provenance. |
| V60-RQ-04 | slice-05-brain-store | Definir precedencia explícita: policy > decisión aprobada > requirement > input autorizado > supuesto del agente. |
| V60-RQ-05 | slice-05-brain-store | Prohibir secretos y estado operativo efímero dentro del Project Brain. |
| V60-RQ-09 | slice-05-brain-store | Distinguir la fuente canónica de conocimiento del cache o índice usado para búsquedas. |
| V60-RQ-06 | slice-06-brain-vault | Generar una representación abierta en Markdown + YAML + enlaces, denominada Open Knowledge Vault. |
| V60-RQ-07 | slice-06-brain-vault | El formato del vault debe poder abrirse con Obsidian, pero Quiver no debe depender de Obsidian, Obsidian Sync ni Obsidian Headless. |
| V60-RQ-08 | slice-06-brain-vault | Permitir exportar el Project Brain completo sin perder IDs, relaciones, fuentes y vigencia. |
| V60-RQ-10 | slice-06-brain-vault | Mostrar al usuario qué memoria está activa, qué guarda, qué excluye y cómo eliminarla o exportarla. |
| V61-RQ-01 | slice-07-context-selection | Crear un Context Manifest por tarea con fuentes, digest, autoridad, confianza, vigencia y razón de inclusión. |
| V61-RQ-02 | slice-07-context-selection | Seleccionar contexto por tarea en lugar de enviar el Project Brain completo. |
| V61-RQ-07 | slice-07-context-selection | Aplicar presupuesto de contexto y divulgación progresiva; nunca truncar contratos obligatorios en silencio. |
| V61-RQ-09 | slice-07-context-selection | Separar instrucciones confiables de contenido no confiable para evitar prompt injection. |
| V61-RQ-10 | slice-07-context-selection | Permitir consultar por qué una pieza de contexto fue incluida o excluida. |
| V61-RQ-03 | slice-08-context-impact | Detectar contradicciones entre requirements, decisiones, policy, documentación y comportamiento observado. |
| V61-RQ-04 | slice-08-context-impact | Elevar contradicciones relevantes en vez de elegir una interpretación silenciosamente. |
| V61-RQ-05 | slice-08-context-impact | Construir un grafo de impacto que relacione requirements, módulos, datos, permisos, APIs, UI, tests e integraciones. |
| V61-RQ-06 | slice-08-context-impact | Presentar un resumen comprensible de impacto: qué cambia, qué puede romperse, qué queda fuera y qué debe verificarse. |
| V61-RQ-08 | slice-08-context-impact | Marcar el contexto como stale cuando cambie una fuente contractual relevante. |
| V62-RQ-01 | slice-09-artifact-envelopes | Separar artefacto contractual de estado mutable de ejecución. |
| V62-RQ-02 | slice-09-artifact-envelopes | Definir Artifact Envelope común con ID, tipo, versión, digest, parents, inputs, actor y estado. |
| V62-RQ-03 | slice-09-artifact-envelopes | Definir relaciones de lineage: derives-from, supersedes, amends, verifies, executes, approves y deploys. |
| V62-RQ-07 | slice-09-artifact-envelopes | Permitir validación determinística offline cuando el artefacto lo permita. |
| V62-RQ-10 | slice-09-artifact-envelopes | Mantener compatibilidad de lectura con artifacts legacy sin elevarlos a verified. |
| V62-RQ-08 | slice-10-actor-policy | Introducir actor ID y autorización verificable para nuevas decisiones de governance. |
| V62-RQ-09 | slice-10-actor-policy | Incorporar policy explain/dry-run para que todo bloqueo tenga regla, motivo y remediación. |
| V62-RQ-04 | slice-11-machine-facade | Ofrecer salida JSON estable, versionada y sin banners para comandos P0. |
| V62-RQ-05 | slice-11-machine-facade | Definir códigos de error y clases de exit estables para validación, policy, capability, runtime, seguridad, conflicto y presupuesto. |
| V62-RQ-06 | slice-11-machine-facade | Hacer que la salida humana derive del mismo resultado canónico que JSON. |

## Dependencies, ordering and conflicts

V58 proof precedes drafts and Brain. V59 slices 01–04 and V60 slice 05 can be
investigated and implemented in separate worktrees. CLI integration 04/06 shares
dispatcher and registry, so those edits are serialized. V61 waits for Brain;
V62 waits for all effective draft/context inputs. Core facade, package metadata,
CLI dispatcher and documentation index each have one writer at a time.

## Risk and rollback

Critical risks are draft data loss, forged authority, secret persistence,
contradictions hidden by selection, stale execution and legacy false green.
Reject unsafe writes, preserve immutable history, verify digests and authorization
at mutation boundaries, and test fault recovery. On a failed invariant stop new
writers; retain artifacts for diagnosis; revert the responsible code commit only
when its readers remain compatible. Existing v58 read-only writer mode remains
available; no destructive schema downgrade or history deletion is permitted.

## Verification and expected evidence

Use targeted node --test commands per slice, English locale for baseline
compatibility, and four directed CLI E2Es from PLAN-A. Final A validation includes
existing tests, docs, schema, package safety and facade compatibility. Evidence
records command, revision, start/end/duration, exit, observed counts, test cases
and review/fix cycles. New test file paths below are planned until implemented.
No cloud login, production deployment, npm publication or customer gate is
asserted by A. Reports distinguish actual, inferred and unverified results.

## Decisions

- 2026-09-06, revision 1.0.3, DEC-A-009: new cross-boundary finding X03 requires
  an additive trusted receipt resolver for B-approved knowledge. Exact scope,
  digest, actor/policy, revocation and crash/replay behavior are frozen in
  CONTRACTS.md. A05/07/08/10/11 own the affected implementation/tests; closed
  A01–A05 audit risk coverage and all source requirements remain unchanged.
- 2026-09-06, revision 1.0.2: close residual A01/A04 with exact Envelope/Context
  Manifest schemas and the slice-05 scoped authority adapter. Default unverified
  local identity fails closed; positive authority fixtures do not claim live proof.
- 2026-09-06, revision 1.0.1: resolve A readiness audit with CONTRACTS.md,
  supported package import, P0 coverage, trusted Brain authority, explicit
  transition/crash protocols and required artifact-family envelopes. Historical
  v4 numeric contracts were confirmed noncanonical and impose no new requirement.
- 2026-09-06: aggregate V58–62 in one initiative package to satisfy the user's
  one-plan/one-spec/one-PR rule while preserving source IDs and criteria.
- 2026-09-06: reuse existing phase locks and v58 governance to prevent a second
  approval authority; introduce a narrow Engine facade for later Cloud consumers.
- 2026-09-06: use deterministic structural checks and explicit claims for context;
  unsupported semantics remain unknown instead of requiring an opaque LLM gate.
