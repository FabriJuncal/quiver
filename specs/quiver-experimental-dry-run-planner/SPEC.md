# Experimental Development and Research Dry-run Planner

Date: 2026-10-07
Status: Documentary foundation operationally reviewed; no Director approval recorded

## Objective

Add a small headless planning module under the existing CommonJS library. Two
closed, deterministic adapters translate structured Development and Research
requests into outlines governed by one pure controller. This experiment does
not replace the CLI, planner, executor, pipeline, or any historical spec gate.

## Scope

- Version 1 JSON task and separate trusted policy/permission snapshots
- Objective, task/run/action IDs, revision, criteria, input references and hashes
- Literal resource allowlists, closed capabilities, and preventive planning budgets
- Action-level risk decisions, reasons, approval requirements, and content binding
- Deterministic examples, adversarial tests, and reproducible evidence

No filesystem or network operations, subprocesses, state creation, runtime
agents, providers, models, dynamic loaders, new dependencies, UI, commands,
execution, approval consumption, merge, deployment, or release are included.

## Contract and authority

The API is `planDryRun(task, trustedContext)`. Both arguments must contain JSON
data only. Unknown fields and malformed values fail closed. Task text and claimed
risk are untrusted. The caller is responsible for supplying authentic, current
policy, permission, resource hash/size, and classification snapshots separately;
the module does not authenticate them or read current resource contents.

Task fields: `schema_version`, `task_id`, `run_id`, `revision`, `domain`,
`objective`, `criteria`, `inputs`, `actions`, and `budgets`. Each action contains
`action_id`, `capability`, `resource_id`, `input_ids`, `criterion_ids`, `phase`,
and `claimed_risk`. Criteria have `id` and `text`; input references have `id`,
`resource_id`, and `sha256`. Arrays have unique IDs and valid internal references. Every task input and
criterion must be referenced by at least one action; unused declarations fail
closed.

Trusted context fields: `schema_version`, `policy_id`, `policy_revision`,
`task_id`, `run_id`, `task_revision`, `resources`, `allowed_capabilities`,
`permissions`, and `budgets`. Resource entries contain `resource_id`, `path`,
`classification`, `sha256`, and `size_bytes`. Permission snapshots contain
`snapshot_id`, `revision`, and exact capability/resource grants. No wildcard or
implicit grant exists. All input resources and the action resource need grants.

The adapters support only `development.inspect`, `development.propose-change`,
`research.compare`, and `research.propose-report`, within their named domain.
They return outlines, never execute the capabilities. Inspect/compare have a
low baseline; proposed changes/reports have an intermediate baseline. Resource
classification can raise this to shared/intermediate, critical, or unknown.
Critical classes are production, data, permissions, credentials, payments,
deletion, core-architecture, and external-commitment. The model's risk claim
never lowers this classification. A higher claimed risk elevates caution; a claimed
`unknown` always requires approval even when trusted resource classification is
low. Claimed risk cannot create permissions. An invalid risk label is a malformed
contract.

Low means eligibility within the supplied snapshots only. Intermediate means
preparation only with review required before apply. Critical and unknown require
approval before the contemplated action. Missing grants, unsafe paths, missing
resources, unsupported capabilities, stale identity/hash bindings, or exceeded
budgets deny eligibility. Approval cannot override these denials.

Planning budgets are maximum action count and aggregate referenced input bytes;
each action counts its inputs, including repeated use across actions. Effective
limits are the minimum of requested and trusted limits. They are estimates from
supplied sizes, never spent-cost counters or durable reservations.

All outputs and action decisions carry `execution_authorized: false`,
`executed: false`, and `accepted: false`. Invalid contracts return stable issues
and no plan. Valid contracts expose a normalized task, closed adapter ID,
action decisions/outlines, and SHA-256 content bindings. Verification is always
`not-performed`, with every criterion `not-verified`. Planning, verification,
and human acceptance remain different states.

Binding covers normalized task content, full trusted context, controller and
adapter revisions, adapter semantics, and decisions. Object key order does not
matter; array order remains significant. Any protected content change requires
a different binding. A digest is not authentication, consent, or an execution
token. No approval store exists. Future behavioral changes must revise the
controller contract; a future executor needs separately approved safeguards.

## Acceptance criteria

- AC-01: Both domain examples pass the same controller with domain-specific outlines
- AC-02: Unknown fields, malformed/non-JSON data, duplicate IDs, and broken references fail closed
- AC-03: Missing permissions and forged low-risk claims cannot grant eligibility; critical and unknown require approval
- AC-04: Missing resources, path escapes, sensitive paths, cross-domain/unknown capabilities, and stale bindings deny
- AC-05: Requested and trusted budgets both cap all actions; aggregate overflow cannot bypass a limit
- AC-06: Deterministic content/action bindings change with protected inputs and ignore object key ordering
- AC-07: Calls do not mutate inputs and imports/calls perform zero application IO or runtime dispatch
- AC-08: All flags remain false, including eligible paths; verification and acceptance are never inferred
- AC-09: Existing tests, spec/docs/package gates pass or report exact verified blockers

## Reuse and provenance

Source baseline: Quiver `ea95409f151310f7496d99cefa2ffd9a72dd515f`.
Reuse the pure `ai/safety.js` path-exclusion helper after stricter canonical-path
validation. Reuse existing CommonJS, Zod strict-schema, Node-test, and spec/slice
conventions. The controller carries forward Quiver's default-deny and canonical
content-binding invariants without importing stateful governance modules.
`review-governance.js` reads package metadata on import; approval projection and
draft helpers create directories. Those paths are deliberately excluded.

Selected V2 provenance is the separation of proposed work, evidence-backed
verification, and acceptance, and the refusal to treat unknown results as
success. The reference is the
[V2 checker](https://github.com/FabriJuncal/quiver-v2/blob/44dcd3fd914a7344edd26c2c6c10575a2469fa5e/scripts/lib/check_execution.py).
No V2 runtime or schema compatibility is claimed and no external code is copied.

## Limits

This is a pure planner for cooperative JSON callers, not a sandbox, permission
service, content verifier, approval authority, or durable orchestrator. Paths are
checked lexically; symlinks, hardlinks, live filesystem races, and actual bytes
cannot be checked without IO. Policy freshness and authenticity are caller
obligations. There is no resource read, output artifact write, evidence ledger,
retry, reconciliation, concurrency, cancellation, or exactly-once claim.

## Slices

- `slice-00-planning-contract`: documentary foundation and operational review
- `slice-01-headless-planner`: bounded implementation, tests, examples, and evidence

One commit and draft PR per slice. Slice 01 depends on the reviewed documentary
foundation. Repository merge, Director approval, and product acceptance are not
asserted by local validation or operational review.


## Propuestas Development: extensión DP v1

Plan acotado revisado operacionalmente el 2026-10-07 antes de implementar.
API: `prepareDevelopmentProposal(task, trustedContext, proposalInput)`. Recalcula
`planDryRun` y contrasta `expected_plan_binding`; no acepta un plan externo como
autoridad. La semántica nueva tiene revisión propia y no altera planDryRun.

`proposalInput` es JSON cerrado: `schema_version: 1`, `expected_plan_binding`,
`patches` (`action_id`, `unified_diff`), `proposed_tests` (`test_id`, `action_id`,
`criterion_ids`, `description`) y `evidence_references` (`evidence_id`,
`input_id`, `criterion_ids`). Las referencias pueden estar vacías. Cada criterio
de cada acción requiere una prueba propuesta; ninguna prueba o referencia
constituye evidencia ejecutada o verificada.

Solo Development, exclusivamente acciones `development.propose-change` en fase
`prepare` cuya decisión recalculada sea `prepare-only`. Un parche por acción,
un destino existente por acción, entre uno y diez destinos exactos. El destino
debe estar entre las entradas de esa acción con hash coincidente. Sin acciones,
recursos o parches extra, destinos duplicados ni colisiones case-insensitive.

El formato admite cabeceras `--- a/ruta` y `+++ b/ruta` idénticas y cabecera
opcional `diff --git a/ruta b/ruta`. No admite `index` ni otras cabeceras Git.
Rutas compuestas por letras ASCII, números, punto, guion, guion bajo y `/`,
además de las exclusiones existentes; no espacios, escapes ni comillas.
Saltos LF, con LF final obligatorio. Hunks `@@ -inicio[,cantidad]
+inicio[,cantidad] @@` sin sufijo: enteros seguros, recuentos exactos, posiciones
ordenadas y sin solapamientos en ambos lados. Los huecos entre hunks deben
coincidir en ambos lados. Se exige al menos una adición o eliminación y consumo
completo; cabeceras aparentes con prefijo de contenido no se reinterpretan.
No se admite el marcador de falta de salto final, NUL, CR ni sustitutos UTF-16 aislados. No hay creación,
borrado, renombrado, copia, modos, enlaces, binarios o diff combinado.

Se conservan el preflight JSON endurecido y sus límites: 8.000 unidades UTF-16
por cadena, 20 niveles, 20.000 nodos por argumento, 1 MiB canónico agregado para
los tres argumentos y hasta 64 KiB UTF-8 agregados de parches.

`status` puede ser `prepared`, `denied` o `invalid`. Una propuesta preparada
incluye identidad/revisión de tarea, binding recalculado del plan y sus acciones,
archivos exactos con `before_sha256`, `patch_sha256` y parche original, fuentes,
alcance, pruebas propuestas y referencias no verificadas. Su `proposal_binding`
incluye revisión semántica, plan, alcance, parches, pruebas y referencias.
El orden de objetos no importa; el de arrays sí. Todo rechazo es atómico.

Sin bytes base no se verifica aplicabilidad: `patch_applicability: not-checked`.
No se calcula `after_sha256`. La revisión antes de aplicar siempre está
insatisfecha; ejecución/autorización/aceptación son falsas y verificación sigue
`not-performed`, con criterios `not-verified`. No hay IO, CLI, dispatch, Git,
proveedores, modelos ni cambios de dependencias. Los snapshots siguen siendo
responsabilidad del consumidor; el parser no comprueba filesystem ni tipo real.

### Criterios de aceptación de la extensión

- DP-01: Una propuesta válida devuelve exactamente los archivos y parches suministrados, sin mutar argumentos.
- DP-02: Binding desactualizado, plan denegado, Research, inspección, apply y riesgo crítico o desconocido impiden preparar.
- DP-03: Permisos ausentes, destino sin entrada base y diferencias de hash mantienen el rechazo del controlador.
- DP-04: Rutas extra, destinos duplicados, escapes, /dev/null, cambios de modo y formatos no soportados fallan cerrados.
- DP-05: Hunks truncados, recuentos falsos, solapamientos, desbordamientos y basura final se rechazan.
- DP-06: Referencias inexistentes o ajenas a una acción y criterios sin pruebas propuestas se rechazan.
- DP-07: Cambios en revisión, contexto, alcance, parche, pruebas o evidencia cambian el binding.
- DP-08: JSON hostil, getters, proxies, ciclos, aliases dentro de cada argumento y presupuestos excesivos se rechazan sin callbacks.
- DP-09: Importar y llamar a ambas APIs no adquiere FS, red, procesos, timers, proveedores ni ejecutores.
- DP-10: Todas las salidas mantienen ejecución y aceptación falsas; revisión insatisfecha y verificación no realizada.
- DP-11: Los ejemplos Development/Research y sus bindings previos permanecen idénticos.
- DP-12: La guía española incluye un caso preparado y tres rechazados, distinguiendo pruebas propuestas de resultados.

### Secuencia de la extensión

`slice-02-development-proposal` depende del slice 01. Se documenta primero,
se implementa dentro del alcance exacto, se valida congelado, se revisa de forma
independiente y se publica en un PR draft separado. No autoriza merge ni deploy.


## Optional supervised IO adapter (slice-03)

The existing planner and proposal APIs retain their pure, non-executing contract.
A separate optional module reads real bytes and applies approved modification-only
patches to a new private temporary workspace. This is not a change to Core flags.
See [supervised workspace contract](../../docs/reference/supervised-workspace.md).

- SW-01: Review recomputes the existing pure proposal and reads exact declared inputs without writes.
- SW-02: Actual hashes/sizes and exact diff context/offsets are checked; malformed, stale or non-applicable inputs fail closed.
- SW-03: A synchronous trusted-host approval must match the reviewed binding; sessions are single-use and inputs are rechecked after approval.
- SW-04: Application writes only a fresh private temporary workspace, verifies readback and never changes source files.
- SW-05: Evidence records task/scope/approval and before/after hashes; project tests and human acceptance remain unperformed.
- SW-06: Real hardlinks/junctions and unsafe paths are rejected; byte budgets and UTF-8/LF restrictions are enforced.
- SW-07: Existing planner/proposal results remain unchanged; no provider, shell, model or proposed command execution is introduced.


## Controlled Development verification demo (slice-05)

Separate demo host around the unchanged supervised adapter. Exact authored
catalog variants and fixed host tests demonstrate real red/green verification.
The tests cannot be changed by the proposed application patch. This is not
an arbitrary-project executor, sandbox or human-acceptance authority.
See [controlled demo contract](../../docs/reference/controlled-development-verification.md).

- DV-01: Only the exact authored catalog and fixed host test assets can execute; supplied commands are never dispatch authority.
- DV-02: Approval binds the exact source, patch, candidate, test suite, command, runtime, environment and limits; sessions are single-use.
- DV-03: Real baseline search failures become six passing checks after the correct patch; the incorrect patch remains failed while regressions pass.
- DV-04: Changed reviewed source, baseline, test or candidate bytes block execution or further verification.
- DV-05: Evidence records hashes, approval, commands, environment, duration, exit codes and results; timeout/cancellation never imply success.
- DV-06: Original files and Core remain unchanged; verification of authored-demo criteria never implies human acceptance or arbitrary-project isolation.
