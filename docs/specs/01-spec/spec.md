# Spec 01 - Recuperacion segura de ramas y extraccion incremental sin regresiones

## 1. Resumen general

Esta spec define el proceso para analizar ramas abiertas, recuperar valor tecnico de ramas antiguas o conflictivas y evitar que la integracion rompa el proyecto. La iniciativa no implementa codigo por si misma. Establece criterios, gates y handoffs para que cualquier implementacion futura sea incremental, verificable y reversible.

La base operativa segura es `origin/main`, sujeta a verificacion de frescura del snapshot antes de ejecutar acciones finales. La rama local `main` no debe usarse como base mientras continue divergida de `origin/main`.

La rama `feature/QUIVER-46-49-cli-modernization` se considera fuente de extraccion parcial, no candidata a merge completo. Cualquier rama con `ahead=0` debe tratarse como sin delta pendiente, pero no como automaticamente eliminable.

## 2. Objetivo

Crear un marco de decision y ejecucion para:

- Clasificar ramas locales y remotas sin modificar el working tree.
- Evitar merges grandes, cherry-picks amplios o cambios disruptivos.
- Preservar toda funcionalidad existente.
- Documentar cualquier modificacion de comportamiento con matriz antes/despues.
- Extraer valor de ramas conflictivas en slices pequenos, revisables y testeables.
- Requerir aprobacion explicita antes de eliminar ramas o implementar codigo.

## 3. Contexto

El repositorio tiene multiples ramas locales y remotas abiertas. Varias ramas ya estan incluidas en `origin/main`, otras estan atrasadas, algunas contienen backups, drafts o cambios conflictivos. El analisis inicial identifico que `feature/QUIVER-46-49-cli-modernization` contiene una modernizacion amplia de CLI con conflictos textuales y riesgo semantico.

La prioridad es evitar fixes parciales. Antes de modificar parser, comandos, documentacion generada, tests o scripts, debe existir un baseline verificable del comportamiento actual.

## 4. Problema u oportunidad que se aborda

El problema es que integrar ramas antiguas o grandes puede:

- Reintroducir decisiones obsoletas.
- Romper comandos existentes sin conflicto textual.
- Cambiar salidas `--json`, exit codes, aliases, flags o side effects.
- Generar documentacion inconsistente con la CLI real.
- Mezclar refactors con bumps de version o cambios de package.
- Eliminar ramas utiles por interpretar `ahead=0` como eliminable.

La oportunidad es convertir el estado de ramas en un backlog controlado, con extraccion selectiva y evidencia por slice.

## 5. Alcance

Incluye:

- Snapshot verificable de ramas.
- Clasificacion de ramas con estados diferenciados.
- Baseline de comportamiento actual.
- Contrato de no regresion.
- Matriz de extraccion desde ramas conflictivas.
- Plan de parser y command registry con compatibilidad completa.
- Plan de extraccion de comandos y wrappers.
- Plan de docs, tests y evidencia.
- Plan de limpieza controlada de ramas con aprobacion explicita.
- Handoffs por slice: `EXECUTION_BRIEF.md` y `CLOSURE_BRIEF.md`.

## 6. Fuera de alcance

No incluye:

- Implementar codigo.
- Hacer merge, rebase, push o cherry-pick.
- Eliminar ramas.
- Cambiar `package.json`, `package-lock.json` o version durante los slices de extraccion inicial.
- Resolver conflictos automaticamente.
- Ejecutar acciones destructivas.
- Tomar decisiones remotas finales sin verificar frescura del snapshot.

## 7. Actores involucrados

- Tech Lead: define criterios, riesgos y aprobaciones.
- Implementador futuro: ejecuta slices aprobados.
- Reviewer: valida no regresion y coherencia de cambios.
- Maintainer del repo: aprueba limpieza de ramas y cambios de comportamiento.
- Usuarios de CLI: consumidores directos de comandos, flags, salidas y archivos generados.
- Automatizaciones/CI: consumidores de exit codes, `--json`, scripts y outputs estables.

## 8. Requerimientos funcionales

- FR-01: El proceso debe identificar rama base, SHA base, fecha del snapshot y frescura del dato.
- FR-02: Cada rama debe clasificarse como `sin delta`, `merge candidata`, `extraccion candidata`, `cerrable`, `eliminable con aprobacion`, `protegida/no tocar`, `historica` o `requiere revision`.
- FR-03: Toda rama conflictiva debe distinguir conflicto textual, semantico y de contrato.
- FR-04: Antes de extraer codigo debe existir baseline de comportamiento actual.
- FR-05: El baseline debe cubrir comandos, aliases, flags, `--help`, `--json`, exit codes, stdout, stderr, archivos generados, scripts, exports internos, templates y docs generadas.
- FR-06: Ninguna funcionalidad existente puede quitarse sin aprobacion explicita.
- FR-07: Si una funcionalidad se modifica, debe documentarse que hacia antes, por que cambia, cual es la mejora y como se valida.
- FR-08: La extraccion desde ramas viejas debe clasificar cada hallazgo como `extraer codigo`, `extraer concepto`, `rehacer` o `descartar`.
- FR-09: Parser y command registry deben tratarse como cambios transversales de alto riesgo.
- FR-10: Cualquier limpieza de ramas requiere aprobacion explicita por rama o grupo claramente listado.

## 9. Requerimientos no funcionales

- NFR-01: El proceso debe ser auditable y reproducible.
- NFR-02: Los slices deben ser pequenos, revisables y con gates claros.
- NFR-03: Los comandos Git sugeridos deben ser read-only salvo aprobacion explicita.
- NFR-04: La documentacion debe ser apta para humanos y agentes.
- NFR-05: La implementacion futura debe ser reversible mediante rollback definido por slice.
- NFR-06: La evidencia debe distinguir validado, no validado y pendiente.

## 10. Reglas de negocio

- BR-01: `origin/main` es la unica base recomendada para nuevas ramas, sujeto a snapshot fresco.
- BR-02: `main` local divergida no es base segura.
- BR-03: `ahead=0` no autoriza eliminacion.
- BR-04: `merge-tree` no es suficiente para declarar una rama segura.
- BR-05: Cambios de parser, package, i18n, docs generadas, CI o tests son riesgo alto aunque no haya conflicto textual.
- BR-06: No se deben mezclar refactors con bumps de version.
- BR-07: No se debe hacer cherry-pick completo de commits grandes sin analisis previo.
- BR-08: Cada cambio de comando requiere matriz antes/despues.
- BR-09: Cada slice debe poder cerrarse con evidencia o quedar explicitamente bloqueado.
- BR-10: Implementar codigo requiere pedido explicito posterior.

## 11. Flujo general

1. Tomar snapshot verificable de ramas y base.
2. Clasificar ramas con evidencia y riesgo.
3. Construir baseline del comportamiento actual.
4. Definir contrato de no regresion.
5. Evaluar ramas candidatas para extraccion parcial.
6. Planificar parser/command registry contra baseline.
7. Planificar comandos/wrappers con matriz antes/despues.
8. Alinear docs, tests y evidencia.
9. Proponer limpieza de ramas sin ejecutarla.

## 12. Entradas y salidas relevantes

Entradas:

- Refs locales y remotos.
- `origin/main` y su SHA.
- Resultado de `git diff`, `git log`, `git cherry`, `git merge-base` y `git merge-tree`.
- Baseline de comandos CLI.
- Requerimientos aprobados por el usuario.

Salidas:

- Inventario de ramas clasificado.
- Baseline de comportamiento actual.
- Contrato de no regresion.
- Matriz de extraccion.
- Handoffs por slice.
- Recomendaciones de limpieza pendientes de aprobacion.

## 13. Dependencias

- Git disponible localmente.
- Refs remotos presentes en el repo local.
- Posible `fetch` futuro si se aprueba verificar frescura remota.
- Conocimiento de comandos CLI actuales.
- Tests existentes y documentacion del repo.

## 14. Riesgos, restricciones o consideraciones

- Snapshot remoto puede estar desactualizado.
- Algunas ramas pueden ser historicas o protegidas.
- Ramas antiguas pueden contener ideas utiles con codigo obsoleto.
- Parser/registry puede romper toda la CLI.
- Tests nuevos pueden reemplazar cobertura vieja sin equivalencia.
- Docs generadas pueden divergir de la CLI real.
- Cambios de `--json`, exit codes o side effects pueden romper automatizaciones.

## 15. Estrategia de slicing

La estrategia prioriza reduccion de riesgo antes de extraccion tecnica. Primero se documenta el estado de ramas, despues se establece el baseline de comportamiento, luego el contrato de no regresion y recien despues se planifican extracciones.

Los slices son documentales y preparatorios. No implementan codigo. Cada slice incluye handoffs para ejecucion futura.

## 16. Roadmap de slices

| Slice | Nombre | Objetivo |
|---|---|---|
| `01-slice` | Snapshot verificable de ramas | Crear inventario confiable y clasificable. |
| `02-slice` | Baseline de comportamiento actual | Saber que no se puede romper. |
| `03-slice` | Contrato de no regresion | Convertir compatibilidad en reglas verificables. |
| `04-slice` | Matriz de extraccion por rama | Decidir que rescatar, rehacer o descartar. |
| `05-slice` | Parser y command registry | Planificar cambio transversal con gates completos. |
| `06-slice` | Comandos y wrappers | Planificar extraccion por comando con antes/despues. |
| `07-slice` | Docs, tests y evidencia | Alinear pruebas y documentacion con comportamiento real. |
| `08-slice` | Limpieza controlada de ramas | Proponer cierre/eliminacion solo con aprobacion. |

## 17. Supuestos, pendientes y preguntas abiertas

Supuestos:

- El snapshot actual sirve para planificar, pero acciones finales requieren verificacion de frescura.
- La prioridad es estabilidad sobre velocidad de integracion.
- No se implementara codigo hasta una instruccion explicita posterior.

Pendientes:

- Confirmar si se permitira `fetch` antes de acciones remotas finales.
- Definir si hay ramas protegidas por politica externa al repo local.
- Definir comandos criticos de CLI si el baseline no puede cubrir todos en una primera pasada.

Preguntas abiertas:

- Que ramas deben conservarse como historicas aunque no tengan delta?
- Que nivel de evidencia se exigira para aprobar cambios en `--json`?
