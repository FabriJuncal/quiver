---
artifact_id: "PLAN-QUIVER-INIT-C-OBSERVER-CONTROL"
artifact_type: "plan"
document_type: "Initiative Delivery Plan"
version: "1.0.2"
status: "Aprobado"
lifecycle_status: "approved"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./PLAN-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.1.md"
requirements:
  - artifact_id: "REQ-QUIVER-INIT-C-OBSERVER-CONTROL"
    version: "1.0.2"
    path: "../requirements/initiatives/REQ-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.2.md"
parent_plan:
  artifact_id: "PLAN-QUIVER-MASTER"
  version: "6.0.9"
  path: "./PLAN-QUIVER-MASTER-v6.0.9.md"
decisions:
  - decision_id: "DEC-20260903-039"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Crear el plan independiente de la iniciativa C con progresión read-only antes de enforcement"
    reason: "La aprobación de la cadena B habilita planificar Observer y Control de forma aislada"
    impact: "Define orden, gates, evidencia y rollback; no aprueba G1/G2 ni crea specs o código"
  - decision_id: "DEC-20260903-040"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Resolver PLAN-C-REV-01 a PLAN-C-REV-03 de la revisión de producción"
    reason: "Cerrar autenticidad de eventos, contrato de policy V72 y evidencia real autorizada V74"
    impact: "Agrega gates y pruebas dirigidas sin cambiar los 48 requisitos ni aprobar G1/G2"
  - decision_id: "DEC-20260903-045"
    date: "2026-09-03"
    actor: "project-owner"
    change: "Aprobar el plan de la iniciativa C"
    reason: "Aprobación explícita de REQ-C 1.0.1, binding maestro 6.0.8 y PLAN-C 1.0.1"
    impact: "Crea PLAN-C 1.0.2 aprobado y habilita planificar D; no inicia implementación ni aprueba G1/G2"
---

# Plan de iniciativa C — Observer y Control

## 1. Propósito y estado de aprobación

Este plan convierte los 48 requisitos de la iniciativa C en una secuencia de
entrega verificable para `SPEC-V71` a `SPEC-V76`. Su estado es `approved` por
decisión explícita del project owner.

La aprobación registrada de este documento:

- congela el orden, los gates y las obligaciones de evidencia de C;
- habilita materializar specs y slices solo después de cerrar sus dependencias
  técnicas y comerciales;
- habilita continuar documentalmente con el plan de la iniciativa D;
- no aprueba G1 o G2 ni inicia código, integraciones, enforcement, release o
  deploy.

## 2. Alcance y blast radius

### Incluido

- `SPEC-V71`: Observer read-only de provenance en GitHub.
- `SPEC-V72`: correlación read-only de trabajo en Linear.
- `SPEC-V73`: Project Health y findings accionables.
- `SPEC-V74`: provenance productiva read-only mediante Vercel y Sentry.
- `SPEC-V75`: policies versionadas y GitHub Checks seleccionados.
- `SPEC-V76`: EvidenceBundle unificado y decisiones de actores autorizados.
- Las superficies compartidas de Cloud, Protocol, Engine, Studio e integraciones
  declaradas por esos requerimientos.
- Los gates G1 y G2 como decisiones separadas, sin asumir su resultado.

### Excluido

- Merge, branch management remoto y escritura de PRs durante Observer.
- Creación o cambio automático de estados/issues de Linear.
- Autofix, rollback automático y promoción a producción.
- Producción autónoma y policies enterprise completas.
- Attestation externa universal y compliance formal.
- Ejecución remota, AI Team y las iniciativas D–G.
- Definir APIs, storage, schemas, arquitectura Cloud o permisos concretos sin las
  specs y fuentes aprobadas de los repositorios afectados.
- Implementación como parte de esta aprobación documental.

### Stakeholders y autoridad

- El project owner aprueba el plan, G1, G2 y cualquier ampliación de autoridad.
- Cada organización opta explícitamente por enforcement y por permisos GitHub
  adicionales; el plan no presume ese consentimiento.
- GitHub, Linear, Vercel y Sentry siguen siendo source-of-truth de sus datos.
- Quiver proyecta, correlaciona y evidencia; no reescribe estado externo salvo
  la escritura limitada que una spec posterior autorice para GitHub Checks.

## 3. Línea base verificada

- Las cadenas documentales A, B y C están aprobadas.
- La aprobación documental de B no demuestra ejecución de V63–V70 ni constituye
  `PASS` de G1.
- No hay evidencia en este workspace de que V62, V68 o V69 estén completadas con
  contratos efectivos consumibles por C.
- No existen specs ejecutables V71–V76 en este repositorio.
- El repositorio objetivo `quiver-cloud` no está disponible como sibling de este
  workspace al 2026-09-03.
- No existe una decisión documentada de `PASS` para G1 o G2.
- La precedencia canónica es V71→V72→V73→V74→G2→V75→V76, después de G1.

Estas ausencias no impiden revisar el plan. Sí bloquean materialización o
ejecución de las superficies afectadas hasta cerrar sus gates.

## 4. Gates de entrada P0

Antes de materializar V71:

1. Registrar una decisión explícita de `PASS` de G1 con las evidence refs
   requeridas por el roadmap.
2. Confirmar V62 y V69 completadas, aprobadas y con contratos/evidencia
   consumibles por Observer.
3. Resolver ubicación y acceso de `quiver-cloud`, y leer allí su índice,
   workflow, arquitectura y reglas de seguridad aplicables.
4. Crear una matriz de trazabilidad para los 48 RQs de C.
5. Declarar source-of-truth y single-writer por propiedad observada de GitHub,
   Linear, Vercel y Sentry.
6. Definir clasificación, retención y redacción de datos antes de ingerir datos
   de repositorios, trabajo o producción.
7. Proveer credenciales de prueba con permisos mínimos y revocables; no usar
   secretos ni datos productivos para validar el plan.
8. Definir para cada canal de eventos GitHub el mecanismo oficial de autenticidad
   y origen que validará la spec —firma, token o equivalente soportado— y el
   binding esperado de instalación/cuenta, organización y repositorio. La
   validación ocurre antes de aceptar o correlacionar un evento.

Gates posteriores:

- V72 espera G1 y V71 efectivas.
- V73 espera V71 y V72 efectivas.
- V74 espera G1 y V73 efectivas.
- G2 se evalúa después de V74 y antes de ampliar autoridad con V75.
- V75 espera `PASS` explícito de G2 y V73 efectiva.
- V76 espera V62, V68 y V75 efectivas.

Antes de materializar V72, su spec debe vincular una policy aprobada o declarar
el contrato versionado mínimo que rige `V72-RQ-05`: inputs, resultado cuando la
regla está activa o inactiva y autoridad que puede activarla. Sin esa fuente no
se puede emitir el finding por trabajo sin issue/requirement.

Antes de cerrar V74, la organización debe autorizar explícitamente el acceso
read-only a Vercel y Sentry, con scopes, clasificación, redacción y retención
registrados. La validación de aceptación debe identificar un incidente histórico
real autorizado y sus evidence refs; si no está disponible, V74 permanece
bloqueada y un fixture sintético no sustituye ese criterio.

La credencial read-only de Observer no puede reutilizarse silenciosamente como
credencial de escritura. V75 requiere consentimiento organizacional y una
concesión separada de permisos para las reglas seleccionadas.

## 5. Orden canónico y entregas

```text
P0: G1 + contratos + repositorios + permisos read-only
 │
 └─ P1 V71 ─ P2 V72 ─ P3 V73 ─ P4 V74 ─ G2
                                                │
                                                └─ P5 V75 ─ P6 V76
```

### P1 — SPEC-V71: GitHub Read-only Provenance Observer

Precondición: G1, V62, V69 y P0 cerrados.

Objetivo: observar GitHub continuamente y construir provenance sin modificar el
repositorio ni presentar una proyección como source-of-truth.

Cobertura: `V71-RQ-01` a `V71-RQ-08`.

Evidencia y gate de salida:

- GitHub opera con permisos mínimos de lectura por repositorio;
- el origen y la autenticidad se validan antes de ingerir, incluyendo el binding
  de instalación/cuenta, organización y repositorio esperado;
- un evento con firma/token inválido, origen no confiable o binding distinto se
  rechaza sin crear ni actualizar provenance, findings o evidencia;
- commits, PRs, reviews, checks y merge SHAs se ingieren con idempotencia;
- eventos duplicados no duplican findings;
- una reconciliación recupera webhooks perdidos e interrupciones;
- Feature Delivery, requirement y artifact lineage conservan correlación;
- PR sin requirement, requirement sin PR, HEAD no verificado y evidencia stale
  mantienen estados distinguibles;
- ningún flujo crea PRs, comentarios, checks, merges o branches;
- desconectar/revocar detiene acceso sin afectar el código del cliente.

### P2 — SPEC-V72: Linear Read-only Work Correlation

Precondición: G1 y V71 efectiva.

Objetivo: correlacionar issues/subissues de Linear con trabajo y evidencia sin
crear loops ni escribir estados externos.

Cobertura: `V72-RQ-01` a `V72-RQ-08`.

Evidencia y gate de salida:

- Linear permanece read-only y no mueve estados;
- cada propiedad declara su source-of-truth y single-writer;
- Done sin evidencia y PR abierto conservan su condición real;
- el finding por trabajo sin issue/requirement referencia la versión de la
  policy y solo se emite cuando la regla está activa; inactiva no genera finding;
- IDs y timestamps externos sostienen provenance;
- una actualización externa marca proyecciones stale cuando corresponde;
- workspaces con otra granularidad no reciben subissues inventados;
- la correlación divergente se muestra sin mutar Linear o GitHub.

### P3 — SPEC-V73: Observer Project Health & Actionable Findings

Precondición: V71 y V72 efectivas.

Objetivo: convertir observaciones correlacionadas en Project Health y findings
accionables, priorizados y reconciliables.

Cobertura: `V73-RQ-01` a `V73-RQ-08`.

Evidencia y gate de salida:

- `healthy`, `attention`, `blocked` y `unknown` no se colapsan;
- cada finding conserva impacto, confianza, fase, causa y siguiente acción;
- findings repetidos con la misma identidad se reconcilian en lugar de generar
  cascadas;
- deuda heredada, problema nuevo, unknown y capability unavailable se
  distinguen;
- resolver, aceptar, transferir o descartar exige actor y razón;
- falsos positivos y tasa de findings accionables se miden con provenance;
- ruido no aceptable impide ampliar integraciones o avanzar a enforcement.

### P4 — SPEC-V74: Production Provenance — Vercel + Sentry

Precondición: G1 y V73 efectiva.

Objetivo: observar deployments e incidentes y trazarlos hacia el cambio exacto,
sin promover, reparar ni revertir producción.

Cobertura: `V74-RQ-01` a `V74-RQ-08`.

Evidencia y gate de salida:

- la organización autorizó scopes read-only de Vercel y Sentry y quedaron
  registradas clasificación, redacción y retención de la evidencia;
- un incidente histórico real autorizado se traza hasta su cambio, conservando
  evidence refs sin exponer datos sensibles;
- deployments de Vercel se correlacionan con commit SHA en modo lectura;
- issues/releases de Sentry se correlacionan solo cuando la evidencia lo permite;
- preview, staging y estados productivos no se presumen existentes;
- deployment y release completo permanecen conceptos distintos;
- una regresión puede trazarse a release, PR, Feature Delivery y Project Brain;
- contradicciones de runtime reabren/crean finding sin ejecutar autofix;
- correlación no demostrable queda `unknown`;
- no existe rollback, promoción o escritura sobre producción.

## 6. Gate G2 — Trust / Enforcement

G2 se evalúa después de V74 y antes de V75. La decisión pertenece al project
owner y debe registrar fuentes, período observado y criterio aplicado. Antes de
`PASS` debe existir evidencia de:

- precisión aceptable de los findings del Observer;
- al menos dos clientes que soliciten enforcement;
- policies activas en `warn` con falsos positivos medidos;
- aceptación explícita de permisos GitHub adicionales.

La definición de “aceptable” y la evidencia mínima del período deben quedar
registradas antes de evaluar el gate; no pueden ser decididas silenciosamente
por un agente. Las policies en `warn` deben provenir de una capacidad ya
disponible o de una validación separadamente autorizada: este plan no permite
implementar V75 antes de aprobar G2. Si esa fuente no existe, el gate queda
bloqueado y se reporta el conflicto documental. Si G2 falla, V75 y V76 no
comienzan y no se compensa agregando más autoridad o integraciones.

### P5 — SPEC-V75: Policy Engine & GitHub Checks

Precondición: G2 y V73 efectivas, con permisos adicionales consentidos.

Objetivo: aplicar policies versionadas en `observe`, `warn` o `enforce`, y
publicar únicamente los GitHub Checks seleccionados.

Cobertura: `V75-RQ-01` a `V75-RQ-08`.

Evidencia y gate de salida:

- cada rule ID conserva versión, inputs, decisión y remediaciones;
- una policy puede permanecer en `warn` antes de `enforce`;
- solo reglas seleccionadas publican checks y no reemplazan CI existente;
- un bloqueo exige opt-in de la organización y evidencia suficiente;
- un deny explica la remediación exacta;
- excepciones registran scope, actor, razón y expiración sin desactivar auditoría;
- cambios de configuración marcan la policy stale;
- falsos positivos se miden antes de ampliar enforcement.

### P6 — SPEC-V76: Unified Evidence Bundle & Actor Decisions

Precondición: V62, V68 y V75 efectivas.

Objetivo: producir evidencia portable y tamper-evident que vincule identidades
de código, resultados y decisiones de actores autorizados.

Cobertura: `V76-RQ-01` a `V76-RQ-08`.

Evidencia y gate de salida:

- cada Feature Delivery/release produce un bundle con checksums y refs;
- `claimed`, `observed` y `verified` permanecen separados;
- base, final, tested y reviewed SHA aplican la policy de identidad;
- approvals, risk acceptance y excepciones exigen actor autenticado y
  autorización, no solo display name;
- un bundle autocontenido puede verificarse offline;
- redacción/clasificación impiden persistir secretos;
- modificar evidencia rompe su verificación y queda registrado en un mecanismo
  append-only o equivalente;
- Studio y Engineering Console derivan su resumen/detalle del mismo bundle;
- una versión nueva marca stale la evidencia anterior.

## 7. Paralelismo y coordinación

V71–V76 permanecen seriales por la precedencia del maestro y sus gates. Aunque
V75 declare dependencia directa de V73, no adelanta G2 ni omite el cierre de V74.

Dentro de una spec aprobada solo se permite paralelismo entre validaciones o
write sets demostrablemente independientes. Integraciones, identity mapping,
policy decisions y writers de GitHub Checks se serializan ante cualquier
solapamiento.

## 8. Trazabilidad y evidencia mínima

| Bloque | Requisitos | Dependencias | Evidencia de salida |
|---|---:|---|---|
| V71 | 8 | G1, V62, V69 | GitHub read-only, idempotencia y reconciliación |
| V72 | 8 | G1, V71 | Linear read-only y correlación sin loops |
| V73 | 8 | V71, V72 | Health/findings accionables y no duplicados |
| V74 | 8 | G1, V73 | Provenance productiva sin acciones productivas |
| V75 | 8 | G2, V73 | Policies graduales y checks consentidos |
| V76 | 8 | V62, V68, V75 | Bundle portable, autorizado y tamper-evident |

Total obligatorio: **48 requisitos**, sin duplicados ni requisitos huérfanos.

Cada spec futura debe crear su trazabilidad requirement → acceptance criterion →
slice → validación → evidencia. Un webhook, display name o afirmación de agente
no cuenta por sí solo como evidencia verificada.

## 9. Riesgos, validación temprana y mitigación

| Riesgo | Prob. | Impacto | Validación temprana | Mitigación |
|---|---|---|---|---|
| Ejecutar C sin G1/G2 o dependencias efectivas | Alta | Alto | Auditar decisions, status y evidence refs | Gate fail-closed por spec |
| Integración read-only obtiene o ejerce escritura | Media | Crítico | Negative tests de scopes y operaciones | Credenciales separadas, revocables y mínimo privilegio |
| Eventos duplicados/perdidos generan provenance incorrecta | Alta | Alto | Replay, desorden e interrupción controlada | Idempotencia y reconciliación periódica |
| Evento falsificado o de otro tenant altera provenance | Media | Crítico | Firma/token y binding inválidos o cruzados | Rechazar antes de ingerir y no mutar estado |
| V72 emite finding sin policy gobernada | Media | Alto | Casos con regla activa e inactiva | Binding versionado y autoridad explícita |
| Telemetría productiva se usa sin autorización | Media | Crítico | Auditar scopes y evidence refs del incidente | Acceso read-only, redacción y gate bloqueado |
| Correlación entre proveedores vincula SHA/issue equivocado | Media | Alto | Fixtures con identidades ambiguas | Mantener `unknown`; no inferir vínculo como verified |
| Findings ruidosos erosionan confianza | Alta | Alto | Medir precisión y accionabilidad con partners | Deduplicar y detener expansión antes de G2 |
| Enforcement o policy stale bloquea trabajo válido | Media | Crítico | Período warn, config drift y casos de excepción | Opt-in, fail-closed de evidencia y rollback a warn/observe |
| Bundle filtra secretos o acepta actor/evidencia falsificados | Media | Crítico | Tamper, autorización y redacción dirigidos | Rechazo, revocación y evidencia append-only |

## 10. Estrategia de validación proporcional

Antes de implementar cada bloque:

- plan, requirement, spec, slices, dependencias y gate aplicables están
  aprobados y vinculados;
- permisos y source-of-truth están declarados por integración;
- los RQs tienen criterios y evidence refs planificadas;
- las operaciones prohibidas tienen casos negativos explícitos.

Integraciones y E2E dirigidos mínimos:

- V71: duplicar, desordenar y omitir eventos GitHub; probar firma/token u origen
  inválido y binding cruzado de instalación/organización/repositorio; reconciliar
  el estado y comprobar que los rechazos no mutan estado ni habilitan escritura.
- V72: correlacionar Linear↔GitHub con granularidad distinta, actualización
  externa y divergencia; probar la regla de `V72-RQ-05` activa e inactiva con
  referencia a su policy, sin loops ni writes.
- V73: producir una causa repetida, reconciliar un único finding y recorrer
  resolución/aceptación/descarte con actor y razón.
- V74: con autorización organizacional y scopes read-only registrados, trazar un
  incidente histórico real hasta su SHA y mantener `unknown` cuando source maps
  o release no lo demuestran; comprobar que no hay rollback, promoción ni write.
- V75: recorrer `observe → warn → enforce` con opt-in, evidencia suficiente,
  policy stale y excepción expirada; comprobar que CI externo sigue vigente.
- V76: verificar/exportar offline, alterar evidencia, cambiar una SHA, intentar
  actor no autorizado y aplicar redacción de un secreto fixture.
- Flujo C: un cambio observado atraviesa provenance → health/finding → policy →
  EvidenceBundle conservando IDs, autoridad y estados no verdes.

La regresión se limita a contratos e integraciones afectados. Seguridad se
valida de forma dirigida en scopes, aislamiento organizacional, actores,
secretos y operaciones de escritura. No se exige regresión general, carga,
rendimiento, compliance formal ni acciones sobre producción salvo evidencia
nueva que eleve esos riesgos.

Monitoreo mínimo por integración/spec:

- retraso y errores de ingesta/reconciliación;
- rechazos por autenticidad, origen o binding sin registrar secretos;
- eventos duplicados, findings reconciliados y estado `unknown`;
- precisión/accionabilidad y falsos positivos antes de G2;
- decisiones de checks, excepciones y policies stale después de V75;
- fallos de verificación/redacción del bundle después de V76.

Las specs definen fórmulas y umbrales con evidencia real; este plan no los
inventa.

## 11. Rollback y stop conditions

Triggers de detención:

- ausencia o invalidación de G1/G2 o de una dependencia efectiva;
- operación de escritura durante una fase declarada read-only;
- permisos mayores que los consentidos o credencial no revocable;
- aceptación de un evento con autenticidad/origen inválido o binding cruzado;
- uso de telemetría productiva sin autorización o fuera de scopes read-only;
- tormenta de duplicados, pérdida de eventos o correlación falsa presentada como
  verificada;
- findings con ruido que impide medir precisión/accionabilidad;
- bloqueo sin opt-in, evidencia suficiente o con policy stale;
- actor no autorizado, bundle alterado o secreto persistido;
- acción de rollback, promoción o mutación productiva no autorizada.

Respuesta proporcional:

1. detener el consumidor/writer y los bloques dependientes;
2. revocar o reducir la credencial afectada;
3. deshabilitar la regla/check por organización y volver `enforce → warn` o
   `warn → observe` sin borrar auditoría;
4. marcar correlaciones, findings, approvals y bundles afectados como stale o
   no verificados;
5. reconciliar desde el proveedor source-of-truth y preservar el historial;
6. revertir únicamente la slice o PR responsable cuando sea seguro;
7. versionar la decisión, plan o spec afectada antes de reanudar.

Criterio de recuperación: permisos mínimos restaurados, cero writers no
autorizados, estado reconciliado desde fuentes externas y evidencia nueva que no
reutiliza approvals stale.

## 12. Cierre de revisión de PLAN-C 1.0.0

| Hallazgo obligatorio | Resolución en 1.0.1 | Criterio verificable |
|---|---|---|
| `PLAN-C-REV-01` | Gate de autenticidad/origen y binding de GitHub antes de ingerir | Eventos inválidos o cruzados se rechazan sin mutar estado |
| `PLAN-C-REV-02` | Binding o contrato versionado de policy para `V72-RQ-05` | Casos activo/inactivo producen resultados distintos y trazables |
| `PLAN-C-REV-03` | Autorización read-only y un incidente histórico real para V74 | El incidente autorizado se traza; sin él V74 no cierra |

Los tres ajustes son obligatorios para las specs afectadas. No amplían el
alcance, no sustituyen G1/G2 y no habilitan implementación por sí solos.

## 13. Cadena de aprobación registrada

El project owner aprobó explícitamente la cadena propuesta:

1. `REQ-QUIVER-INIT-C-OBSERVER-CONTROL@1.0.1`, persistido como sucesor aprobado
   `1.0.2`;
2. el binding de C de `PLAN-QUIVER-MASTER@6.0.8`, actualizado en `6.0.9` sin
   aprobar el roadmap completo, las iniciativas D–G, G1 o G2;
3. `PLAN-QUIVER-INIT-C-OBSERVER-CONTROL@1.0.1`, persistido como este sucesor
   aprobado `1.0.2`.

La aprobación habilita crear el plan D. No inicia código, specs, integraciones,
enforcement, release o deploy, no aprueba G1/G2 y no afirma que las dependencias
de ejecución de D estén completadas.
