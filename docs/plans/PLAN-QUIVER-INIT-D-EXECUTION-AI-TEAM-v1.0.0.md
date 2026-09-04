---
artifact_id: "PLAN-QUIVER-INIT-D-EXECUTION-AI-TEAM"
artifact_type: "plan"
document_type: "Initiative Delivery Plan"
version: "1.0.0"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: null
requirements:
  - artifact_id: "REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM"
    version: "1.0.1"
    path: "../requirements/initiatives/REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM-v1.0.1.md"
parent_plan:
  artifact_id: "PLAN-QUIVER-MASTER"
  version: "6.0.10"
  path: "./PLAN-QUIVER-MASTER-v6.0.10.md"
decisions:
  - decision_id: "DEC-20260903-049"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Crear el plan independiente de la iniciativa D con gates de demanda, autoridad y costo"
    reason: "La aprobación de la cadena C habilita planificar Execution y AI Team de forma aislada"
    impact: "Define orden, riesgos, evidencia y rollback; no aprueba G3 ni crea specs, ejecución o código"
---

# Plan de iniciativa D — Execution y equipo IA

## 1. Propósito y estado de aprobación

Este plan convierte los 46 requisitos de la iniciativa D en una secuencia de
entrega verificable para `SPEC-V77` a `SPEC-V81`. Su estado es `proposed` y
requiere aprobación explícita del project owner antes de materializar specs o
iniciar implementación.

La aprobación futura de este documento:

- congelará el orden, los gates y las obligaciones de evidencia de D;
- habilitará materializar specs y slices solo después de cerrar G3 y las
  dependencias técnicas aplicables;
- habilitará continuar documentalmente con el plan de la iniciativa E;
- no aprobará G3/G4 ni iniciará ejecución remota, agentes, integraciones, código,
  release o deploy.

## 2. Alcance y blast radius

### Incluido

- `SPEC-V77`: contrato neutral de AgentRuntime y aislamiento de workspace por run.
- `SPEC-V78`: Permission Envelopes, checkpoints, leases y fencing tokens.
- `SPEC-V79`: equipo dinámico de capacidades de producto e ingeniería.
- `SPEC-V80`: Skills, evals y calidad de modelos/runtimes.
- `SPEC-V81`: presupuestos preventivos y CostController/TraceBudget.
- Las superficies de Engine, Cloud, Studio y adapters declaradas por esos
  requerimientos.
- G3 como decisión comercial separada y obligatoria antes de V77.

### Excluido

- Orquestador durable completo, workflows multi-región y operaciones continuas.
- Builder greenfield, publicación autónoma y producción automática.
- Billing final del SaaS, FinOps cloud completo y arbitraje de suscripciones
  personales.
- Marketplace público, auto-routing opaco o actualización automática de modelos
  críticos.
- Permisos enterprise multi-región, secret manager propio obligatorio y
  sustitución de la autoridad humana en decisiones sensibles.
- Definir APIs, storage, schemas, proveedor secundario, mecanismo de workspace o
  infraestructura sin las specs y fuentes aprobadas de los repositorios
  afectados.
- Implementación como parte de esta aprobación documental.

### Stakeholders y autoridad

- El project owner aprueba el plan, G3 y cualquier ampliación de autoridad,
  presupuesto o acceso productivo.
- Quiver Lead sigue siendo la interfaz principal y accountable de comunicación.
- Los runtimes informan capabilities y resultados; no deciden `DONE` contractual.
- Cada organización conserva autoridad sobre permisos, secretos, producción,
  límites de costo y participación humana.
- Executor, reviewer/QA y capacidades humanas o agentes conservan ownership y
  handoffs explícitos; un agente no amplía su propio scope.

## 3. Línea base verificada

- Las cadenas documentales A, B y C están aprobadas.
- La aprobación documental de C no demuestra ejecución de V71–V76 ni constituye
  `PASS` de G3.
- No hay evidencia en este workspace de que V62, V65, V66 o V76 estén completadas
  con contratos efectivos consumibles por D.
- No existen specs ejecutables V77–V81 en este repositorio.
- Los repositorios objetivo `quiver-cloud` y `tracebudget-adapter` no están
  disponibles como siblings de este workspace al 2026-09-03.
- No existe una decisión documentada de `PASS` para G3.
- `docs/MULTI_AGENT_WORKFLOW.md` y `docs/ai/LESSONS.md` no existen; no se
  infieren reglas desde documentos ausentes ni se confunde el workflow de
  desarrollo con el AI Team del producto.
- La precedencia canónica es
  G3→V77→V78→V79→V80→V81. La ubicación de G3 posterior a V81 en el diagrama v6.0
  es histórica y fue reemplazada por la decisión canónica que lo ubica antes de
  V77.

Estas ausencias no impiden revisar el plan. Sí bloquean materialización o
ejecución de las superficies afectadas hasta cerrar sus gates.

## 4. Gates de entrada P0

Antes de materializar V77:

1. Registrar una decisión explícita de `PASS` de G3, perteneciente al project
   owner, con criterio definido antes de evaluar y evidence refs de demanda
   concreta para ejecutar o retomar trabajo, no solo observarlo.
2. Registrar en G3 la fuente, fecha/período, caso de uso solicitado y alcance de
   la demanda. El project owner define antes de recolectar evidencia el mínimo de
   casos y período; este plan no inventa esos umbrales.
3. Confirmar V62 y V76 completadas, aprobadas y con contratos/evidencia
   consumibles por el runtime.
4. Resolver ubicación y acceso de `quiver-cloud` y leer allí índice, workflow,
   arquitectura, seguridad, comandos y estado aplicables. Antes de V81, hacer lo
   mismo con `tracebudget-adapter` o documentar que todavía no existe.
5. Crear una matriz de trazabilidad para los 46 RQs de D.
6. Declarar trust boundaries y binding organización→proyecto→run→workspace,
   junto con clasificación, retención, redacción y cleanup de datos.
7. Congelar para V77 el output contract, las capabilities observables y la
   autoridad que transforma resultados/evidencia en estado contractual.
8. Seleccionar y autorizar el segundo runtime exigido por V77 antes de declarar
   neutralidad estable; no se asume proveedor, modelo ni capability.
9. Proveer entornos de prueba aislados y credenciales efímeras por referencia,
   con producción y secretos en default deny.
10. Definir límites de runs, cancelación/kill switch y stop conditions antes de
    habilitar ejecución delegada.

Gates posteriores:

- V78 espera V77 efectiva.
- V79 espera V65, V66, V77 y V78 efectivas.
- V80 espera V77 y V79 efectivas.
- V81 espera V77, V79 y V80 efectivas, más un contrato verificable del adapter
  de costo cuando se use TraceBudget.
- G4 pertenece a la iniciativa E y no se evalúa ni aprueba dentro de D.

Si G3 no tiene criterio predeclarado, evidencia suficiente o autoridad
registrada, V77–V81 permanecen bloqueadas. La aprobación de este plan no
constituye `PASS` del gate.

## 5. Orden canónico y entregas

```text
P0: G3 + dependencias + repositorios + trust boundaries
 │
 └─ P1 V77 ─ P2 V78 ─ P3 V79 ─ P4 V80 ─ P5 V81
```

### P1 — SPEC-V77: AgentRuntime Contract & Workspace Isolation

Precondición: G3, V62, V76 y P0 cerrados.

Objetivo: ejecutar el mismo contrato mediante runtimes reemplazables, con
capabilities reales, workspaces aislados y evidencia comparable.

Cobertura: `V77-RQ-01` a `V77-RQ-08`.

Evidencia y gate de salida:

- el mismo slice se ejecuta con Codex y un segundo adapter autorizado bajo el
  mismo output contract;
- cada adapter demuestra `start`, `inspect`, `stream`, `input`, `approval`,
  `cancel` y `collectArtifacts`; `resume` solo se ofrece cuando existe;
- una capability ausente produce estado explícito y nunca una emulación
  silenciosa;
- dos runs, organizaciones o proyectos no comparten directorio mutable ni pueden
  alcanzar paths ajenos mediante rutas relativas, absolutas o enlaces;
- base SHA, branch, runtime, modelo resuelto y environment fingerprint quedan
  vinculados a la evidencia del run;
- eventos normalizados conservan metadata útil de proveedor después de aplicar
  clasificación y redacción;
- el runtime puede reportar resultado, pero solo la autoridad contractual de
  Quiver decide `DONE`;
- cancelar detiene nuevas acciones, revoca credenciales cuando sea posible y
  conserva evidencia diagnóstica permitida;
- cada adapter supera la misma suite de conformance.

### P2 — SPEC-V78: Permission Envelopes, Checkpoints & Leases

Precondición: V77 efectiva.

Objetivo: limitar y reanudar ejecución sin exceder autoridad ni permitir dos
writers válidos sobre el mismo recurso.

Cobertura: `V78-RQ-01` a `V78-RQ-08`.

Evidencia y gate de salida:

- el Permission Envelope inmutable cubre filesystem, commands, network, tools,
  secrets y producción, y se aplica antes de cada side effect;
- producción y secretos permanecen default deny;
- un grant puntual registra scope, actor, razón, expiración y uso acotado sin
  reescribir el envelope original;
- checkpoints vinculan artifacts y evidencia con SHA, slice/spec, envelope,
  configuración y environment relevantes;
- un checkpoint con binding distinto queda stale y no evita repetir validación;
- adquisición/renovación de lease es atómica y cada write verifica fencing token;
- un worker que pierde el lease no puede escribir aunque termine tarde;
- los timeouts de runtime, comando, aprobación y orquestación son distinguibles;
- credenciales efímeras permanecen como referencias y se revocan al cancelar
  cuando el proveedor lo permite.

### P3 — SPEC-V79: Dynamic AI Product & Engineering Team

Precondición: V65, V66, V77 y V78 efectivas.

Objetivo: activar el conjunto mínimo de capacidades verificables para cada tarea
sin convertir la experiencia en múltiples chats ni actividad artificial.

Cobertura: `V79-RQ-01` a `V79-RQ-10`.

Evidencia y gate de salida:

- Quiver Lead conserva la interfaz principal y consolida resultados/decisiones;
- cada capacidad declara inputs, deliverable verificable, autoridad, allowed
  writes, dependencias, owner y criterio de finalización;
- la composición considera tipo de tarea, riesgo, stack, costo y latencia;
- una tarea simple activa el equipo mínimo y una sensible activa seguridad/QA
  proporcionales;
- no se activan todos los roles por defecto ni se simulan conversaciones;
- high-assurance separa executor y reviewer/QA e impide autoaprobación;
- humanos pueden ocupar o compartir roles sin perder ownership;
- cada cambio y handoff conserva owner, estado y evidence refs;
- Studio muestra equipo, resultados y decisiones pendientes, no razonamiento
  interno;
- una capacidad sin deliverable verificable no cuenta como trabajo completado.

### P4 — SPEC-V80: Skills, Evals & Model/Runtime Quality

Precondición: V77 y V79 efectivas.

Objetivo: medir procedimientos, runtimes y modelos con comparaciones
reproducibles antes de ampliar autonomía.

Cobertura: `V80-RQ-01` a `V80-RQ-10`.

Evidencia y gate de salida:

- cada Skill project-scoped fija versión, fuente y lock verificable antes de
  cargarse;
- el conjunto inicial se limita a workflow, triage de requerimientos, execute,
  review, recovery y QA; una ampliación exige repetición real documentada;
- Provider Packs aportan conocimiento y no contienen secretos ni actúan como
  ejecutores;
- escenarios reproducibles derivan de tareas/incidentes reales autorizados y
  redactados;
- se miden activación, outcome, scope violation, costo, turns y Critical failures;
- scorers determinísticos gobiernan hard failures y un model grader no puede
  convertirlos en pass;
- una comparación fija runtime, modelo, Skill, policy, contexto y environment;
- baseline y umbral de regresión se versionan antes de evaluar una actualización;
- routing por clase de tarea solo se habilita después de baselines verificables;
- modelos críticos de high-assurance no se autoactualizan sin eval aprobada.

### P5 — SPEC-V81: Cost Governance & TraceBudget

Precondición: V77, V79 y V80 efectivas.

Objetivo: reservar y limitar costo antes de acciones costosas, reconciliar lo
consumido y detener ejecución cuando no existe presupuesto autorizado.

Cobertura: `V81-RQ-01` a `V81-RQ-10`.

Evidencia y gate de salida:

- cada Feature Delivery/run tiene presupuesto y, cuando haga falta,
  subpresupuestos por fase;
- cada estimación registra unidad/moneda, fuente y versión del precio, timestamp
  y límite máximo usado para reservar;
- ninguna llamada o acción costosa comienza sin reserva autorizada; si no puede
  estimarse un máximo, se bloquea o solicita decisión explícita;
- reservar es atómico e idempotente por acción/intento y evita doble reserva bajo
  concurrencia;
- costo real, cancelaciones, errores y retries se reconcilian sin ocultar
  retrabajo, y la reserva no usada se libera;
- el costo se atribuye a organización, proyecto, feature, role, runtime, modelo y
  resultado;
- el usuario ve acumulado y límite, y al agotarse la ejecución se detiene o
  solicita aumento sin continuar silenciosamente;
- CostController conserva contrato neutral; el fallback local solo satisface
  desarrollo y no reemplaza evidencia del adapter externo cuando este sea
  requerido;
- costo por PR aprobado, feature completada y QA pass conserva provenance;
- ninguna decisión depende de arbitraje de suscripciones personales.

## 6. Paralelismo y coordinación

V77–V81 permanecen seriales por sus dependencias. La existencia de varios
adapters o capacidades no autoriza adelantar una spec posterior.

Dentro de una spec aprobada solo se permite paralelismo cuando write sets,
workspaces, budgets y recursos compartidos sean disjuntos o estén protegidos por
leases/fencing. Cambios sobre contratos de runtime, envelopes, checkpoints,
composición del equipo, locks de Skills y reservas de costo se serializan ante
cualquier solapamiento.

Quiver Lead coordina resultados y decisiones, pero no reemplaza ownership,
independencia de QA/review ni autorización humana. La actividad entre agentes no
es evidencia por sí misma.

## 7. Trazabilidad y evidencia mínima

| Bloque | Requisitos | Dependencias | Evidencia de salida |
|---|---:|---|---|
| V77 | 8 | G3, V62, V76 | Dos adapters conformes y workspaces aislados |
| V78 | 8 | V77 | Envelopes aplicados, resume seguro y fencing |
| V79 | 10 | V65, V66, V77, V78 | Equipo mínimo con deliverables y ownership |
| V80 | 10 | V77, V79 | Evals reproducibles y hard failures gobernados |
| V81 | 10 | V77, V79, V80 | Reserva preventiva, reconciliación y límites |

Total obligatorio: **46 requisitos**, sin duplicados ni requisitos huérfanos.

Cada spec futura debe crear su trazabilidad requirement → acceptance criterion →
slice → validación → evidencia. Un mensaje de agente, costo estimado sin fuente o
resultado de model grader no cuenta por sí solo como evidencia verificada.

## 8. Riesgos, validación temprana y mitigación

| Riesgo | Prob. | Impacto | Validación temprana | Mitigación |
|---|---|---|---|---|
| Construir Execution sin demanda G3 verificable | Alta | Alto | Auditar decisión, criterio y evidence refs | Gate fail-closed antes de V77 |
| Adapter oculta capabilities o genera provider lock-in | Media | Alto | Conformance equivalente en dos runtimes | Capability explícita y contrato neutral |
| Workspace/envelope permite acceso cruzado o side effect no autorizado | Media | Crítico | Casos de escape, tenant cruzado y default deny | Aislamiento, enforcement previo y revocación |
| Checkpoint stale o worker tardío produce doble writer | Media | Crítico | Reanudación con bindings distintos y lease perdido | Invalidación, lease atómico y fencing por write |
| Equipo excesivo o reviewer no independiente degrada entrega | Media | Alto | Tarea simple/sensible y autoaprobación negativa | Composición mínima y separación high-assurance |
| Skill/model degradado convierte hard failure en pass | Media | Crítico | Lock alterado, scorer determinístico y eval comparativa | Rechazo, versión previa y baseline gobernada |
| Carrera de reservas excede presupuesto | Media | Crítico | Reservas simultáneas, retry y cancelación | Operación atómica, idempotencia y hard stop |

## 9. Estrategia de validación proporcional

Antes de implementar cada bloque:

- plan, requirement, spec, slices, dependencias y gate aplicables están
  aprobados y vinculados;
- trust boundaries, authority y recursos compartidos están declarados;
- los RQs tienen criterios y evidence refs planificadas;
- side effects y operaciones prohibidas tienen casos negativos explícitos.

Pruebas unitarias/de contrato e integración dirigidas mínimas:

- V77: ejecutar la misma fixture con dos adapters; verificar capability ausente,
  cancelación, normalización/redacción y aislamiento de path/workspace/tenant.
- V78: negar filesystem/command/network/tool/secret/producción fuera de envelope;
  probar grant expirado, checkpoint con SHA/config distinto, dos claims
  simultáneos, lease perdido, write tardío y timeouts diferenciados.
- V79: comparar tarea simple y sensible; verificar equipo mínimo, seguridad/QA
  proporcional, executor ≠ reviewer en high-assurance, rol humano compartido,
  deliverable, ownership y handoff.
- V80: alterar lock, ejecutar hard failure con model grader favorable, comparar
  dos runtimes con variables fijadas y bloquear una regresión sobre el umbral
  aprobado.
- V81: reservar concurrentemente, agotar presupuesto, cancelar/fallar/reintentar,
  reconciliar costo y probar adapter no disponible sin usar fallback local fuera
  de desarrollo.
- Flujo D: una tarea autorizada atraviesa runtime → envelope/checkpoint → equipo →
  eval → costo conservando run ID, autoridad, budget y evidence refs.

La regresión se limita a contratos y superficies afectadas. Seguridad se valida
de forma dirigida en aislamiento, scopes, secretos, grants y side effects.
Concurrencia se prueba donde los requisitos la introducen: leases, fencing y
reservas. No se exige regresión general, carga, rendimiento, multi-región,
billing final ni producción real salvo evidencia nueva que eleve esos riesgos.

Monitoreo mínimo por spec:

- runs activos/cancelados, capabilities ausentes y fallos de adapters;
- violaciones de workspace/envelope, grants y revocaciones;
- leases expirados, workers stale, fencing rechazado y resume invalidado;
- capacidades activadas, deliverables, handoffs y autoaprobaciones rechazadas;
- locks inválidos, Critical failures y regresiones bloqueadas;
- reservas, costo reconciliado, retries, presupuesto agotado y hard stops.

Las specs definen fórmulas y umbrales con evidencia real; este plan no los
inventa.

## 10. Rollback y stop conditions

Triggers de detención:

- ausencia o invalidación de G3 o de una dependencia efectiva;
- acceso entre organizaciones, proyectos, runs o workspaces;
- side effect fuera del Permission Envelope;
- secreto expuesto, credencial no revocada o acceso productivo no autorizado;
- checkpoint stale aceptado, doble writer o write con fencing token vencido;
- runtime que declara `DONE`, oculta una capability o no responde a cancelación;
- autoaprobación, rol sin deliverable o composición que ignora high-assurance;
- lock inválido, Critical failure convertido en pass o regresión no bloqueada;
- llamada sin reserva, doble reserva o continuidad silenciosa sin presupuesto.

Respuesta proporcional:

1. detener scheduler, adapters y nuevos runs del alcance afectado;
2. cancelar runs activos y revocar credenciales/grants cuando sea posible;
3. invalidar leases, checkpoints, approvals y evidencia afectados sin borrar
   auditoría;
4. deshabilitar el adapter, routing, Skill o composición responsable y volver al
   último contrato/versionado aprobado o al flujo asistido/manual;
5. bloquear nuevas acciones costosas, reconciliar consumo y liberar reservas
   válidamente no usadas;
6. reconstruir desde source-of-truth y repetir con workspace nuevo cuando
   corresponda;
7. revertir únicamente la slice o PR responsable cuando sea seguro;
8. versionar la decisión, plan o spec afectada antes de reanudar.

Criterio de recuperación: aislamiento y default deny restaurados, cero writers
sin lease válido, credenciales revocadas, presupuesto reconciliado y evidencia
nueva que demuestra conformance sin reutilizar checkpoints o approvals stale.

## 11. Decisiones pendientes antes de specs

Las siguientes decisiones pertenecen a las specs y owners indicados; este plan
no las resuelve sin evidencia:

- criterio, período y evidencia mínima de G3, decididos por el project owner;
- ubicación, arquitectura, comandos y estado real de `quiver-cloud`;
- segundo runtime autorizado y mecanismo concreto de workspace para V77;
- enforcement point de envelopes y persistencia/coordinación de checkpoints,
  leases y fencing para V78;
- contrato de capacidades, activación e independencia high-assurance para V79;
- baselines, scorers y umbrales de regresión para V80;
- contrato, pricing source y disponibilidad de `tracebudget-adapter` para V81;
- clasificación, retención, redacción y cleanup de artifacts/evidencia;
- si `docs/MULTI_AGENT_WORKFLOW.md` debe crearse y agregarse al índice como
  contrato de desarrollo independiente del AI Team del producto.

Si una decisión cambia alcance, autoridad o arquitectura, requiere spec/ADR y
aprobación separada antes de implementar.

## 12. Cadena de aprobación propuesta

Para evitar aprobación transitive o ambigua, el project owner debe nombrar los
tres elementos de la cadena y aceptar solamente el binding de D:

1. `REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM@1.0.1`;
2. el binding de D de `PLAN-QUIVER-MASTER@6.0.10`, sin aprobar el roadmap
   completo ni las iniciativas E–G;
3. `PLAN-QUIVER-INIT-D-EXECUTION-AI-TEAM@1.0.0`.

Frase sugerida:

> Apruebo la cadena documental D: REQ-D 1.0.1, binding maestro 6.0.10 y PLAN-D
> 1.0.0.

La aprobación deberá persistirse como sucesores versionados en el orden
requirement → master/catalog binding → plan. No será transitive, no aprobará G3
o G4, no iniciará implementación y no habilitará crear el plan E hasta quedar
registrada en toda la cadena.
