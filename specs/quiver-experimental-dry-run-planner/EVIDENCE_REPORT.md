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
