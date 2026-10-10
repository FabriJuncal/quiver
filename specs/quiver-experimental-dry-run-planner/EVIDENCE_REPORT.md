# Experimental Planner Evidence

## slice-00-planning-contract

Documentary foundation operationally reviewed on 2026-10-07. Clarification:
higher or unknown claimed risk can raise caution and never reduce it. There is
no Director approval, product acceptance, repository merge, or real execution.

Validation on Linux / Node v24.19.0 (all exit 0):

- `node bin/create-quiver.js spec validate specs/quiver-experimental-dry-run-planner --strict`: two valid slices, no warnings
- `npm run schema:slice:check`: pass; one existing legacy v18 fixture skipped
- `node bin/create-quiver.js slice check --local specs/quiver-experimental-dry-run-planner/slices/slice-00-planning-contract/slice.json`: pass
- `node_modules/.bin/markdownlint-cli2 'specs/quiver-experimental-dry-run-planner/**/*.md'`: 11 files, zero errors
- `git diff --check`: pass

## slice-01-headless-planner

Candidate implementation validation on Linux / Node v24.19.0:

- `node --test tests/lib/planning-dry-run.test.js`: 138 passed, zero failed
- Independent read-only review: 21 adversarial probes passed, including 116 risk/budget combinations; original malformed-array, proxy, reserved-key, and expansion repros are now covered by integrated regression tests
- `npm run docs:check`: exit 0; Markdown, local links, and 62-command reference synchronized
- `npm run changelog:check`: exit 0
- Explicit Markdown checks across this spec and the API reference: 12 files, zero errors
- `npm run schema:slice:check`: exit 0; existing legacy v18 fixture remains skipped
- `npm run package:quiver`: exit 0; package boundary and installed CLI smoke passed
- `git diff --check`: exit 0

First full-suite run: 1,104 passed, one migration-idempotence failure. Repository
documentation was being edited concurrently, so that run is not final evidence.
The unchanged isolated migration-idempotence test then passed. The next frozen full-suite run passed all runtime tests but found a slice
metadata enum mistake: `in_progress` is unsupported. The metadata was corrected
to `ready` during validation and is now `completed` for implementation closure.
The final frozen full-suite run passed: 1,105 tests, zero failures or skips,
exit 0 (`npm run test:ci`). The final source and test files are identical to
the independently reviewed candidate.
The scope check also required exact example filenames rather than a glob in
the legacy readiness checker; the slice now declares both exact paths.

The isolated import test allows only Node crypto/util/path, installed Zod, and
the existing pure safety helper. It cannot import filesystem, network, process,
providers, executors, state, or timers. Both domain calls pass in that isolated
context. Host process/dependencies remain trusted; this is not an OS sandbox.

All task output execution and acceptance flags remain false. Test success
verifies this module's behavior, not the example tasks or supplied file bytes.
No provider, model, network research, runtime task execution, merge, deployment,
or release was performed.


## Final candidate review and traceability

Independent review found no remaining blocking findings after regression fixes.
The runtime source SHA-256 is
`d0fe5e776ceb9ea8c23b8efa8f624c088519359575361b814f9f31cd1dea5389`;
the integrated test SHA-256 is
`87c1f94d94c95461584183fb312ea7806fab29a88e4368528727290835eaec5e`.

- AC-01: both example domains and all four capabilities use the shared controller
- AC-02: strict fields, proxies, accessors, custom/sparse arrays, aliases, reserved keys, duplicate IDs, and reference coverage fail closed
- AC-03: every critical classification, unknown/higher claims, prepare/apply phases, and missing grants are covered
- AC-04: unsafe paths, absent resources, cross-domain/unknown capabilities, and stale identity/hash bindings deny
- AC-05: both budget sources, aggregate repeated inputs, and integer overflow are covered
- AC-06: protected-field mutation, object-key order, array order, and action identity binding tests pass
- AC-07: deep-frozen input/alias tests and isolated import/call checks pass
- AC-08: all execution/acceptance flags remain false and verification remains unperformed
- AC-09: focused/full suite, schema, strict spec, scope, docs, Markdown, changelog, and installed package smoke pass

Documentary PR [#148](https://github.com/FabriJuncal/quiver/pull/148) remains draft.
Its exact SHA `f2c20206434e12806fec3cad7de5f9b6254b93f6` passed all seven CI jobs
in [run 37629498311](https://github.com/FabriJuncal/quiver/actions/runs/37629498311).
Implementation publication and remote CI are recorded separately in its draft
PR; this source commit does not predict a future remote result.


## Reproducible user smoke guide

The API reference includes an isolated-checkout guide for the exact experimental
branch and a five-case command covering Development, Research, intermediate
risk, unknown risk, and missing permissions. The command was extracted verbatim
from the Markdown and executed against the final library. Its five JSON lines
matched the documented expected output exactly. Source/test hashes did not
change. Setup creates a separate checkout/dependencies/cache; the planner and
manual cases do not modify user projects or perform the contemplated tasks.


## slice-02-development-proposal: preparación

Plan y alcance revisados operacionalmente el 2026-10-07 antes del código.
Checkout cloud aislado; la selección de entornos remotos no estuvo disponible.
Se continuó en un checkout separado, sin operar el equipo del usuario. PR #148 seguía draft abierto en
`569a6690649237a6b9b71b711a8dbfa4d1907d22`; main no cambió desde
`ea95409f151310f7496d99cefa2ffd9a72dd515f`.

Validaciones funcionales pendientes. El primer `npm ci --ignore-scripts` falló
al intentar usar la caché predeterminada fuera del workspace. Reintento con
caché explícita en `/tmp`; no se cambiaron dependencias ni lockfile.


### Validación inicial del candidato Development

Linux / Node v24.19.0, 2026-10-07. Dependencias instaladas desde el lockfile
existente con `npm ci --ignore-scripts --cache /tmp/quiver-proposals-npm-cache`
(exit 0). No se modificaron package.json ni package-lock.json.

- Pruebas focalizadas de ambos archivos: 277 aprobadas, cero fallos/skips (138 previas y 139 nuevas)
- `npm run test:ci`: 1.244 aprobadas, cero fallos/skips, exit 0; árbol congelado durante toda la ejecución
- `npm run docs:check`: exit 0; Markdown, enlaces locales y referencia de 62 comandos sincronizados
- Markdown explícito de spec y guía: 15 archivos, cero errores
- `npm run changelog:check`: exit 0
- `npm run schema:slice:check`: exit 0; 312 fixtures válidos y un fixture legacy v18 omitido por la regla previa
- `node bin/create-quiver.js spec validate specs/quiver-experimental-dry-run-planner --strict`: tres slices válidos, exit 0
- Validación local del slice: exit 0; modo local no comprueba documentación en la base remota ni superposición de worktrees
- `npm run package:quiver`: exit 0; frontera del paquete y smoke del CLI instalado correctos
- `git diff --check`: exit 0
- Comandos de ambas guías extraídos literalmente del Markdown y ejecutados: cinco casos del planificador y cuatro de propuesta coinciden exactamente con el JSON documentado

El gate CLI de scope solo compara commits; antes del commit no detecta los
cambios de trabajo. Además, su argumento `--base` acepta nombre de rama sin
`origin/`, no un SHA literal. Los dos primeros intentos devolvieron advertencias,
no constituyen validación. Se corrigió el comando declarado y se contrastaron
por separado todos los archivos tracked/untracked contra la base congelada:
exactamente trece rutas, iguales al allowlist, sin excepciones implícitas.
El gate CLI se repetirá tras el commit. La primera validación documental también
señaló secciones ausentes en el cierre aún pendiente; se completaron antes de
validar e implementar y la spec pasó sin advertencias.

El controlador y helpers previos permanecen byte por byte iguales al prefijo del
archivo base. Los hashes de los planes de los dos ejemplos previos permanecen
idénticos; todas sus 138 pruebas pasan. La nueva prueba VM limita dependencias a
crypto, util, path, Zod y el helper puro existente; no proporciona FS, red,
subprocesos, temporizadores, providers, ejecutores ni estado.

Hashes SHA-256 del candidato funcional congelado:

- Módulo: `381a7deeaf788ea7ff004554ebfc12ac076c11925770d2a7a03bf2a0888850ca`
- Pruebas nuevas: `905dea6732f4b51925ca57b2f01a8e35eed5ef15dcf20dd398f739b5fff54316`

Revisión independiente completada sin bloqueantes; CI del commit publicado
se verifica y registra por separado en el PR.
Los tests de esta biblioteca no ejecutan las pruebas propuestas, comprueban
bytes de los archivos sintéticos, ni aceptan la tarea. La aplicabilidad real
sigue explícitamente sin comprobar; no se emite after_sha256.


### Revisión independiente y trazabilidad Development

Una revisión de solo lectura reejecutó las 277 pruebas focalizadas y un probe
separado con 500 planes comparados profundamente contra el módulo base,
2.000 parches multi-hunk preparados y sus 2.000 variantes con basura final
rechazadas. También verificó proxies en los tres argumentos sin ejecutar traps
y que las mutaciones anidadas de salida no cambian los argumentos.
No se encontró un bloqueo técnico. La observación menor sobre aliases se resolvió
precisando su alcance por argumento en contrato, slice y guía, sin cambiar código.
Los hashes funcionales anteriores permanecen iguales.

- DP-01: ejemplo exacto, hashes del parche, fuentes, determinismo y entradas congeladas
- DP-02: binding obsoleto, plan denegado, Research, inspección, apply y cada clase crítica/incierta
- DP-03: permisos, revisiones y hashes inválidos, presupuestos y destino sin entrada base
- DP-04: rutas fuera de alcance, duplicados y alias case-insensitive, formatos y operaciones no admitidas
- DP-05: recuentos, truncado, solapamientos, offsets inconsistentes, ceros, enteros inseguros y basura final
- DP-06: IDs duplicados, referencias inexistentes/ajenas y cobertura de cada criterio por acción
- DP-07: revisión semántica propia, contexto, identidad, fuentes, alcance, parches, pruebas, referencias y orden de arrays protegidos
- DP-08: preflight hostil sin callbacks, profundidad, recorrido, strings, 64 KiB de parches y 1 MiB total
- DP-09: importación/call aislados con dependencias puras cerradas; sin dispatch ni IO de aplicación
- DP-10: flags falsos, revisión insatisfecha, pruebas no realizadas, evidencia no verificada y aplicabilidad no comprobada
- DP-11: controlador previo idéntico, 138 pruebas anteriores, hashes golden y 500 comparaciones independientes
- DP-12: guía española con preparado y tres rechazos; nueve salidas de las dos guías verificadas literalmente

La revisión es técnica, no aceptación del Director. El consumidor conserva la
responsabilidad por procedencia y vigencia de snapshots; no se inspeccionan bytes
base, symlinks o tipos del recurso. No hay nuevos modelos, proveedores, FS,
comandos, configuraciones, dependencias, merge, release ni deploy.


## Slice-03 local validation (2026-10-09)

Base: main 1c47ccdd1ed0f126024163895c4d6ac986e515f2.
Initial focused run: sandbox spawn EPERM, no test bodies executed.
Normal non-admin subprocess retry: 23/23 passed, zero skips.
Pre-review focused run: 306/306 pass, zero fail/cancel/skip, exit 0 (1101.988 ms).
Final reviewed run: 309/309 pass, zero fail/cancel/skip, exit 0 (1245.5412 ms).
Command: node --test --test-concurrency=1 tests/lib/planning-supervised-workspace.test.js
tests/lib/planning-dry-run.test.js tests/lib/planning-development-proposal.test.js.
This is 277 existing planner/proposal cases plus 32 adapter cases, not a full suite.
Tests cover real file application/readback and evidence hashes; all declared
inputs rechecked after approval; stale hashes/sizes; exact context and hunk bounds;
empty/insertion/deletion/multiple hunks; missing/incorrect/replayed authorization;
different roots; getters/proxies; real hardlinks/junction escapes; unsupported
bytes; immutable snapshots; and no evaluation of supplied code.

Final gates: docs:check, changelog:check, schema:slice:check, strict spec validation,
local slice check and package:quiver (including installed CLI smoke) all exit 0.
Initial schema/spec exit 1 findings were documentary: unsupported `in-progress`
status and a case-sensitive slice reference. Corrected to `ready` and the exact
slice ID; reruns passed. Initial failure logs remain retained outside the repo.
Dependency tree reused from the verified same-lockfile Windows checkout; no new
runtime/dependency/credential installation. Core and lockfile diffs are empty.

Base main CI was separately verified: run 37985078803, exact main SHA above,
completed success with all seven jobs. This is baseline evidence, not CI for the
new slice. The Windows full suite ran with Node 24.19.0, ordinary non-admin
permissions, via node scripts/ci/run-node-tests.js (npm run test:ci entrypoint).
It ran 2026-10-09 20:25:21 to 20:37:45 UTC, duration 743890.4349 ms, exit 1:
1,275 total, 1,262 passed, 3 failed, 10 skipped, zero cancelled.
The tested tree was 9f3d271c749a1e79530fc40ec90459d38761976f, before the final
root normalization and three additive regression cases. It is not a full pass
or a full-suite result for that final refinement. Logs are retained externally.

The three failures are unchanged real-symlink EPERM limitations:
- tests/commands/ai-review-plan.test.js:683, conditioned approval candidate;
- tests/lib/ai-analyze-project-discovery.test.js:132, discovery symlink coverage;
- tests/lib/evidence.test.js:114, evidence symlink output/read escapes.
The ten existing platform/capability skips remain in existing tests. This slice
adds no skips and changes no existing assertions. No privilege elevation was used.
Final focused coverage includes the refinement; exact-SHA remote CI must be
reported separately in the draft PR, not inferred from baseline CI.

MASTER MultiHarness V3 vision/MVP sections were read from Library
libfile_9bb70c1f7d508191921c402934900fde, alongside the v6.0.22 plan and current spec.
They support a small functional increment, not activation of Studio/Cloud/V59.
Local self-review found and fixed the case where the temp directory would lie
inside the source root. Independent read-only review covered all twelve scoped
paths and the final module/test delta. It found no concrete remaining defect
within the cooperative-host contract. A possible root-link trailing-separator
case was tested with three real junction variants: all three already rejected
on Windows before refinement (exit 0, zero skips). Root paths are now normalized
before lstat in both review and execute, with three additive regression cases.
This is preventive cross-platform hardening, not a Windows-reproduced bug.

No source-project tests or proposed commands are executed by the new adapter.
The API validates patch application and output bytes; evidence explicitly keeps
project tests, criteria verification and acceptance unperformed. Source roots are
host-controlled/cooperative, not an OS isolation boundary against concurrent
malicious filesystem processes. Host approval authenticity and freshness remain
host duties. Separate authorization permits this slice draft PR and CI only;
merge, deployment, project execution and human acceptance remain unapproved.


## Slice-04 Research corpus: reviewed local result

Base main 688ae68c69b1a31cb70cee0af85a20fa1f5a80cc includes the human merge of
PR152. Its CI run 37990502284 completed success, seven jobs; that validates only
the base. The first Research checkout/tree/patch are preserved; the new copy
inherits PR152 unchanged and adds only fifteen declared Research paths.

The name and contract describe literal comparisons with hash/line citations,
not semantic research, truth verification or a complete MVP. Sources are supplied
UTF-8 snapshots. Quotes are omitted by default; explicit separate hostOptions
include_quotes true is required to disclose source text. Query/metadata fields
remain visible; hashes/counts are not anonymization or authorization.

## Slice-04 independent review and corrections

Independent read-only review found a P1: full-line default quotes could expose a
credential embedded in an ordinary source. A synthetic canary regression failed
before correction (exit 1). Default matches now contain only line locations.
Strict host options are separate from corpus input and included in both bindings;
tests check absence of the canary from the entire default JSON, option injection,
getters/proxies and sensitive paths. The example explicitly opts in for its two
authored public fixtures. The required PR Title heading was also corrected.
Reviewer rechecked the implementation and contract on tree cd4b31ffbfd4ef703b89f39f696c5b4a59a061cd,
reporting no concrete remaining functional defect. A minor Execution Brief
sentence was aligned afterward with the same default. Reviewer ran no tests.

## Slice-04 validation commands and outcomes

node --test --test-concurrency=1 tests/lib/planning-research-corpus.test.js
tests/lib/planning-dry-run.test.js tests/lib/planning-development-proposal.test.js
tests/lib/planning-supervised-workspace.test.js

351/351 pass, zero fail/cancel/skip, exit 0 (1675.1168 ms): 42 Research tests plus
309 existing cases. Coverage includes real example source citations, LF/CRLF
preserving hashes, Unicode, missing/extra/stale data, size/output limits, literal
case semantics, source/criterion scope, truncation, stable bindings, hostile JSON,
dependency isolation and the default disclosure policy. Core stays byte-identical.

Full repository command: node scripts/ci/run-node-tests.js (npm run test:ci entrypoint).
Final full Windows execution used Node 24.19.0, local existing dependencies and
ordinary non-admin permissions; NODE_PATH unset. Start 2026-10-09T21:17:29.1905266Z; finish
2026-10-09T21:31:09.3343307Z. Tested tree cd4b31ffbfd4ef703b89f39f696c5b4a59a061cd.
Result: 1,320 tests; 1,307 pass; 3 fail; 10 existing skips; zero cancelled; exit 1.
This is a complete suite execution, not a passing suite. Exact failing locations:
- tests\commands\ai-review-plan.test.js:683:1
- tests\lib\ai-analyze-project-discovery.test.js:132:1
- tests\lib\evidence.test.js:114:1

All three failed at real symlink creation with EPERM, matching existing Windows
capability limitations. No new skips, privileges, weaker assertions or test
substitutions. Final evidence-only documentation updates do not alter tested code.

An initial full run with borrowed NODE_PATH dependencies had 1,297 pass, 13 fail,
10 skips (exit 1): ten ESM @clack/prompts resolution failures plus the same three
symlink failures. Existing node_modules were copied into the isolated checkout
with identical lockfile SHA256 AA2D04B58401016559A00E44DA02D61C4C71CF146E7B324266D396EAD281539F.
No package/software installation occurred. The full suite was repeated on the
identical tree; both logs/metadata remain preserved outside the repo.

The earlier 33-case fixture failure and strict brief-heading validation failure
were corrected without weakening Core rules or assertions. Their logs remain.
Final example/docs/changelog/schema/spec/slice/package reruns are recorded in
research-evidence/reviewed-gates.json. The example performs actual reads of two
authored fictional documents, 370 bytes total: TypeScript [1,0], Node.js [1,1],
PostgreSQL [0,0]. Counts are matching lines in Alpha/Beta, not semantic findings.

No CI for this local delta, publication, merge, deployment or project-code
execution. The remaining Windows symlink coverage needs an already capable
environment; no elevation was attempted. Source acquisition, semantic evaluation,
synthesis and chat orchestration remain open MVP work. A temporary copy is not
an OS sandbox; executing proposed project code requires a separate safe contract.

## Slice-05 local verification evidence

Initial new integration suite: 20/20, zero skips, exit 0. Final results follow.


## Slice-05 final local validation

Base: 688ae68c69b1a31cb70cee0af85a20fa1f5a80cc. Full-suite tested tree: 366ad14df18f480b283d7a31978c79e3841fa364.
Command: node scripts/ci/run-node-tests.js (npm test:ci entrypoint), Node 24.19.0, non-admin Windows.
Started 2026-10-09T23:19:43.8529184Z; finished 2026-10-09T23:30:49.2292617Z.

- Focused: 329/329, zero failures/skips, exit 0 (20 new + 309 existing).
- Correct demo: baseline exit 1 (4/6 pass), modified exit 0 (6/6 pass).
- Incorrect demo: baseline exit 1, modified exit 1 (5/6 pass); search criterion fails, regressions pass.
- Documentation, changelog, schema, strict spec, local slice and package/installed CLI gates: exit 0.
- Independent implementation and documentary review: no blocking findings within authored-fixture scope.
- Full Windows suite: 1298 total, 1285 passed, 3 existing real-symlink EPERM failures, 10 existing skips, zero cancelled; exit 1. This is not a full-suite pass.

Windows failures: tests/commands/ai-review-plan.test.js:683, tests/lib/ai-analyze-project-discovery.test.js:132,
tests/lib/evidence.test.js:114. All fail creating actual symlinks (EPERM). No new skips or privileged tests.
Initial docs gate failed on Windows checkout CRLF; unchanged tracked files were restored to exact Git bytes.
Initial schema gate rejected in_progress; changed to supported ready and rechecked. Initial logs retained.
Dependencies were copied from the existing identical-lockfile checkout (line endings aside); no installation.
Local logs and JSON receipts: ../development-tests-evidence relative to this checkout.
Only documentary evidence/closure changes follow the tested tree; functional code remains identical.
No remote CI or publication for this slice. PR153 remained open/unmerged at the latest read.
No complete MVP, arbitrary-project sandbox, provider, human acceptance, merge or deployment claimed.


## PR153 integration with merged PR154: 2026-10-10

Earlier local sections describe their respective pre-publication snapshots.
PR153 original head a5ca94bd9e6555cd29c81325f916e748528ac970 passed CI run37996017591.
PR154 was human-merged as main 01c5dc2c2a8a298f05007fb0cd490c116e635b31;
main CI run38011851076 passed seven jobs, with 1298/1298 on each full Linux suite.

Five content conflicts were confined to CHANGELOG.md, SPEC.md, EXECUTION_PLAN.md,
STATUS.md and this evidence report. Both appended slice sections and changelog
entries are retained. Source, tests, examples, per-slice contracts, Core and
package metadata are inherited unchanged. No product decision or expanded
capability is introduced. Combined local validation and independent review are recorded below;
prior CI is not evidence for the new merged tree. Existing Windows EPERM limits
remain explicit. No force push, PR153 merge or deployment.


## PR153 combined local validation before branch update

Full-suite tested tree: 5a38159f3a347cb582e4e804d38a4dd6866f93a3.
Parents: Research a5ca94bd9e6555cd29c81325f916e748528ac970 and main
01c5dc2c2a8a298f05007fb0cd490c116e635b31. Node 24.19.0, non-admin Windows.
Command: node scripts/ci/run-node-tests.js. Started 2026-10-10T01:20:13.6465009Z;
finished 2026-10-10T01:31:24.3780213Z.

- Focused combined suite: 371/371 passed, no failures/cancellations/skips, exit 0.
- Full Windows suite: 1340 total, 1327 passed, 3 existing symlink EPERM failures,
  10 existing skips, zero cancelled, exit 1. This is not a full-suite pass.
- Failures remain tests/commands/ai-review-plan.test.js:683,
  tests/lib/ai-analyze-project-discovery.test.js:132 and tests/lib/evidence.test.js:114.
- Research example and both slice checks, docs, changelog, schema, strict spec,
  package and installed CLI smoke: exit 0.
- Correct Development demo: exit 0; deliberately incorrect demo: expected exit 1.
- Independent read-only integration review: no findings. All 1627 paths form the
  union of both parents; all functional blobs and per-slice contracts are unchanged.
  Only five shared Markdown files required conflict resolution. The PR delta from
  main remains the original 15 Research paths.

No tests were disabled or weakened. No software installation, administrator session,
new provider, merge of PR153 or deployment. Existing dependencies were copied from
an identical-lockfile checkout. Logs and receipts: ../research-integration-evidence.
Only evidence documentation changed after the tested tree; relevant documentary
gates are rerun before publication. Exact-head remote CI is required after updating
the existing branch; historical CI does not establish the new commit's result.
