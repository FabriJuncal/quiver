# Experimental Dry-run Planner

This internal CommonJS API prepares deterministic Development or Research
outlines. It is not connected to the CLI or executor. Every result says
`execution_authorized: false`, `executed: false`, and `accepted: false`.

## Try the supplied examples

From a source checkout:

```bash
node -e "const {planDryRun}=require('./src/create-quiver/lib/planning/dry-run'); const x=require('./examples/planning-dry-run/development.json'); console.log(JSON.stringify(planDryRun(x.task,x.trusted_context),null,2));"
node -e "const {planDryRun}=require('./src/create-quiver/lib/planning/dry-run'); const x=require('./examples/planning-dry-run/research.json'); console.log(JSON.stringify(planDryRun(x.task,x.trusted_context),null,2));"
```

The examples use synthetic hashes, sizes, resources, and permissions. They do
not read the named files or verify those snapshots. The example caller loads
JSON and prints output; the planner itself performs no application IO. Examples
and tests are repository-only; the library ships through the existing package
boundary. This is experimental, not a supported new CLI command.

## Version 1 contract

Call `planDryRun(task, trustedContext)` using objects parsed from JSON. The
[experimental spec](../../specs/quiver-experimental-dry-run-planner/SPEC.md)
defines every field and its authority. Unknown fields, including own
`__proto__` keys, are rejected. IDs, criteria, input references, and action IDs
must be unique, and each declared input and criterion must be used by an action.

Objects must be plain or null-prototype data objects; arrays must be native,
dense data arrays. Accessors, custom array prototypes, proxies (including
revoked proxies), functions, symbols, non-finite numbers, cycles, shared object
identities, and serialization hooks are rejected. Parse cross-realm objects or
shared graphs as JSON in the planner's realm first. Preflight bounds depth to 20,
traversal to 20,000 values per argument, strings to 8,000 code units, and object
keys to 128 code units; additional schemas cap counts and field lengths. The
combined canonical contract must be at most 1 MiB. No arbitrary value is coerced
into an error message.

Task text and `claimed_risk` cannot grant capabilities or resource access.
Trusted context must be supplied separately by a trusted caller. It names the
exact task/run/revision, versioned policy, allowlisted resources, permitted
capabilities, and an explicit permission snapshot. Every target and input needs
an exact capability/resource grant. There are no wildcard grants or defaults.

Only four capabilities are registered:

- `development.inspect`: inspection outline; baseline low
- `development.propose-change`: change outline; baseline intermediate
- `research.compare`: comparison outline; baseline low
- `research.propose-report`: report outline; baseline intermediate

An outline identifies its target, supplied sources and hashes, and proposed
criterion checks. Development requests test evidence; Research requests source
support. It contains no generated patch, executed test, factual research claim,
ranking, arbitrary command, or callable adapter. Both domains use one controller.

## Decisions and budgets

- `eligible`: low-risk eligibility within the supplied snapshots only
- `prepare-only`: intermediate-risk preparation; review required before apply
- `approval-required`: intermediate apply, critical, or unknown risk
- `denied`: missing permission/resource, unsupported capability, unsafe path,
  stale task/hash binding, or exhausted planning budget

Trusted resource classification can elevate baseline risk. Production, data,
permissions, credentials, payments, deletion, core architecture, and external
commitments are critical. A higher `claimed_risk` also raises caution; claimed
`unknown` always requires approval. A lower claim cannot reduce risk. Unknown
risk labels are invalid. Approval requirements are descriptive and always
unsatisfied; this module never consumes an approval or creates permission.

Effective budgets are the smaller of requested and trusted limits. Each action
counts once. Bytes count per input reference per action, including two IDs for the same
resource and reuse across actions. Whole-plan overages deny every action. Safe-integer bounds and
exact aggregate comparisons prevent numeric overflow from bypassing limits.
These are planning estimates from supplied sizes, not actual read/model costs.

## Result and binding

`status` is `planned`, `denied`, or `invalid`. Valid contracts return a cloned
normalized task, adapter ID, action decisions, reasons, outline, approval
requirements, and SHA-256 plan/action bindings. Invalid contracts have no plan
or binding and expose only a stable issue code and path.

Bindings include the full normalized task, trusted context, controller and
adapter revisions/semantics, and resulting decisions. Reordering object keys
preserves a binding; changing protected content or array order changes it.
Change `CONTROLLER_REVISION` when control semantics change. A binding does not
authenticate its caller and cannot authorize future execution.

Verification stays `not-performed`; criteria stay `not-verified`. Input hashes
are only compared with the supplied trusted hashes, never with filesystem
bytes. A successful planner test is not verification or acceptance of the task.

## Limits and provenance

The host process and installed dependencies remain trusted. The module is not
an OS sandbox, approval service, filesystem verifier, or orchestrator. Resource
paths are lexically canonical and filtered with Quiver's existing pure safety
helper; symlinks, hardlinks, resource freshness, and race conditions require a
separately approved live boundary. No retry, persistence, locking, reconciliation,
provider, network, subprocess, or executor path is reachable from this module.

The [spec's provenance](../../specs/quiver-experimental-dry-run-planner/SPEC.md#reuse-and-provenance)
records selected Quiver and V2 invariants. Existing stateful approval/governance
helpers are deliberately not imported. No V2 runtime/schema compatibility is
claimed. A future executor needs its own authorization and safeguards.

## Validate

```bash
node --test tests/lib/planning-dry-run.test.js
npm run test:ci
npm run docs:check
npm run package:quiver
node bin/create-quiver.js spec validate specs/quiver-experimental-dry-run-planner --strict
```

## Guía breve para probarlo sin tocar tus proyectos

Versión: contrato experimental `schema_version: 1`, controlador
`dry-run-controller-v1`. Rama exacta: `feature/QUIVER-EXP-01-headless-planner`.
Todavía no es una nueva versión publicada en npm: instalar `create-quiver@latest`
no selecciona este incremento. La rama está propuesta mediante un PR draft.

Prerequisitos: Git, Node.js 20.12 o posterior, npm y acceso al repositorio. Usá
una carpeta nueva dedicada a esta prueba, fuera de tus proyectos. La preparación
crea ese checkout, sus dependencias y la caché de npm; no es una operación de cero escrituras.
El planner que vas a probar solo recibe datos y devuelve un objeto en memoria.

```bash
git clone --branch feature/QUIVER-EXP-01-headless-planner --single-branch https://github.com/FabriJuncal/quiver.git quiver-planner-demo
cd quiver-planner-demo
git branch --show-current
git rev-parse HEAD
npm ci --ignore-scripts
node --test tests/lib/planning-dry-run.test.js
```

Resultado esperado: la rama indicada y 138 tests aprobados, sin fallos. El SHA
mostrado debe coincidir con el head del PR que estés revisando. La suite enfocada
usa fixtures sintéticos y no lee ni modifica los archivos nombrados por ellos.
No ejecutes la preparación dentro de otro proyecto ni cambies sus configuraciones.

### Cinco casos, un único comando

El siguiente comando funciona como una prueba manual de lectura: carga los dos
JSON incluidos, cambia copias en memoria e imprime cinco resultados. No genera
archivos ni llama a modelos, proveedores, redes o ejecutores.

```bash
node -e '
const {planDryRun} = require("./src/create-quiver/lib/planning/dry-run");
const fixtures = {
  development: require("./examples/planning-dry-run/development.json"),
  research: require("./examples/planning-dry-run/research.json")
};
const cases = [
  ["development", "development", "base"],
  ["research", "research", "base"],
  ["intermediate", "development", "shared"],
  ["unknown", "research", "unknown"],
  ["permission-missing", "development", "deny"]
];
for (const [name, domain, change] of cases) {
  const x = structuredClone(fixtures[domain]);
  if (change === "shared") x.trusted_context.resources[0].classification = "shared";
  if (change === "unknown") x.task.actions[0].claimed_risk = "unknown";
  if (change === "deny") x.trusted_context.permissions.grants = [];
  const r = planDryRun(x.task, x.trusted_context);
  const a = r.actions[0];
  console.log(JSON.stringify({
    case: name, status: r.status, decision: a.decision,
    risk: a.effective_risk, approval_required: a.approval_requirement.required,
    execution_authorized: r.execution_authorized,
    executed: r.executed, accepted: r.accepted
  }));
}
'
```

Salidas esperadas, en ese orden:

```json
{"case":"development","status":"planned","decision":"eligible","risk":"low","approval_required":false,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"research","status":"planned","decision":"eligible","risk":"low","approval_required":false,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"intermediate","status":"planned","decision":"prepare-only","risk":"intermediate","approval_required":true,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"unknown","status":"planned","decision":"approval-required","risk":"unknown","approval_required":true,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"permission-missing","status":"denied","decision":"denied","risk":"low","approval_required":false,"execution_authorized":false,"executed":false,"accepted":false}
```

- Development identifica un archivo y la evidencia de tests que haría falta;
  no escribe un patch ni ejecuta esos tests propuestos
- Research planifica qué fuentes y criterios usar para comparar; no realiza la
  comparación, consulta fuentes, confirma afirmaciones ni produce un ranking
- Intermedio permite describir preparación, con revisión antes de aplicar
- Unknown exige aprobación aunque la clasificación del recurso parezca baja
- Sin permiso se deniega: una aprobación no crea el permiso que falta

Los 138 tests comprueban el comportamiento del planner. La revisión humana
consiste en leer sus límites, decisiones, criterios y fuentes propuestos; no la
sustituyen esos tests. Ningún resultado acepta la tarea ni autoriza ejecutarla.
