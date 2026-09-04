---
artifact_id: "PLAN-QUIVER-INIT-B-STUDIO-ALPHA"
artifact_type: "plan"
document_type: "Initiative Delivery Plan"
version: "1.0.2"
status: "Aprobado"
lifecycle_status: "approved"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./PLAN-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.1.md"
requirements:
  - artifact_id: "REQ-QUIVER-INIT-B-STUDIO-ALPHA"
    version: "1.0.2"
    path: "../requirements/initiatives/REQ-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.2.md"
parent_plan:
  artifact_id: "PLAN-QUIVER-MASTER"
  version: "6.0.6"
  path: "./PLAN-QUIVER-MASTER-v6.0.6.md"
decisions:
  - decision_id: "DEC-20260903-026"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Crear el plan independiente de la iniciativa B con secuencia guiada por riesgo"
    reason: "La aprobación de la cadena A habilita planificar B de forma aislada"
    impact: "Define orden, gates, evidencia y rollback; no crea specs, código ni aprobación de G1"
  - decision_id: "DEC-20260903-030"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Resolver PLAN-B-REV-01, PLAN-B-REV-02 y PLAN-B-REV-03"
    reason: "Cerrar los gaps de policy, aislamiento organizacional y eventos de release detectados en revisión"
    impact: "Agrega gates y pruebas dirigidas sin cambiar los 80 requisitos ni ampliar el alcance"
  - decision_id: "DEC-20260903-035"
    date: "2026-09-03"
    actor: "project-owner"
    change: "Aprobar el plan de la iniciativa B"
    reason: "Aprobación explícita de REQ-B 1.0.1, binding maestro 6.0.5 y PLAN-B 1.0.1"
    impact: "Crea PLAN-B 1.0.2 aprobado y habilita planificar C; no inicia implementación ni aprueba G1"
---

# Plan de iniciativa B — Quiver Studio Alpha

## 1. Propósito y estado de aprobación

Este plan convierte los 80 requisitos de la iniciativa B en una secuencia de
entrega verificable para `SPEC-V63` a `SPEC-V70`. Su estado es `approved` por
decisión explícita del project owner.

La aprobación registrada de este documento:

- congela el orden, los gates y las obligaciones de evidencia de B;
- habilita que B sea materializada mediante specs y slices cuando también se
  cumplan sus precondiciones de ejecución;
- habilita continuar documentalmente con el plan de la iniciativa C;
- no aprueba G1 ni inicia código, release, deploy o publicación.

## 2. Alcance y blast radius

### Incluido

- `SPEC-V63`: Quiver Studio Alpha y foundation mínima de Quiver Cloud.
- `SPEC-V64`: onboarding de proyectos existentes y modo Quiver Rescue.
- `SPEC-V65`: Quiver Lead, Feature Brief y Decision Inbox.
- `SPEC-V66`: workspace de Product/UX y evidencia de diseño.
- `SPEC-V67`: flujo asistido de Feature Delivery.
- `SPEC-V68`: QA independiente y Definition of Done fuerte.
- `SPEC-V69`: entrega mediante GitHub, preview de Vercel y PR.
- `SPEC-V70`: reconciliación continua de Project Brain y compatibilidad con
  Obsidian.
- Las superficies compartidas de Studio, Cloud, Engine, CLI, GitHub, Vercel y
  Project Brain declaradas por esos requerimientos.
- La evaluación de G1 después de V70, sin asumir su resultado.

### Excluido

- Producción automática, merge automático y release productivo.
- Billing complejo, administración enterprise y Enterprise SSO.
- Editor visual completo o reemplazo de Figma.
- Autonomía general 24/7 y el Orchestrator durable final.
- Observer/Control, Execution/AI Team, Builder y las iniciativas C–G.
- Definir arquitectura interna, stack Cloud, estructura de carpetas, schemas,
  design tokens o estilos sin sus fuentes aprobadas.
- Implementación como parte de esta aprobación documental.

### Stakeholders y autoridad

- El project owner aprueba el plan, sus cambios de alcance y los gates humanos.
- Los mantenedores de `quiver` y del repositorio objetivo `quiver-cloud`
  materializan las specs aprobadas dentro del workflow de cada repositorio.
- Los design partners validan onboarding, entregas repetidas y valor de
  QA/Project Brain sin recibir autoridad técnica implícita.
- Los proveedores externos conservan autoridad sobre permisos y estados de sus
  integraciones; una señal externa no reemplaza evidencia canónica de Quiver.

## 3. Línea base verificada

- La cadena documental A está aprobada como
  `REQ-QUIVER-INIT-A-ENGINE-TRUST@1.0.3`, binding A de
  `PLAN-QUIVER-MASTER@6.0.4` y
  `PLAN-QUIVER-INIT-A-ENGINE-TRUST@1.0.2`.
- Esa aprobación es documental: no afirma que V60, V61 o V62 estén
  implementadas, aprobadas operativamente o respaldadas por evidencia.
- No existen specs ejecutables V63–V70 en este repositorio.
- El repositorio objetivo `quiver-cloud` no está disponible como sibling de
  este workspace al 2026-09-03.
- `docs/INDEX.md` no identifica una guía visual concreta para este producto;
  una plantilla no constituye estado ni decisión visual aprobada.
- El roadmap fuente ordena B de forma serial V63→V64→V65→V66→V67→V68→V69→V70
  y ubica G1 después de V70.

Estas ausencias no impiden revisar este plan. Sí impiden iniciar las superficies
afectadas hasta resolver los gates de entrada correspondientes.

## 4. Gates de entrada P0

Antes de materializar la primera spec de B:

1. Crear una matriz de trazabilidad para los 80 RQs de B, sin duplicados ni
   requisitos huérfanos.
2. Confirmar que V60 y V62 están completadas, aprobadas y respaldadas por
   evidencia consumible por V63.
3. Resolver la ubicación y acceso del repositorio `quiver-cloud`, leer allí su
   índice, workflow y arquitectura aplicables, y registrar cualquier conflicto.
4. Definir los entornos de integración y permisos mínimos para GitHub/Vercel,
   sin credenciales ni datos productivos.
5. Identificar la fuente visual y de design system aprobada para el producto
   antes de implementar UI; no derivarla de una plantilla genérica.
6. Confirmar que ninguna spec de B redefine contratos que pertenecen a
   V60–V62.

Gates adicionales por dependencia:

- V64 espera V60, V61 y V63 efectivas.
- V65 espera V61, V63 y V64 efectivas.
- V66 espera V65 efectiva.
- V67 espera V62, V65 y V66 efectivas.
- V68 espera V65 y V67 efectivas.
- V69 espera V62, V67 y V68 efectivas.
- V70 espera V60 y V67–V69 efectivas.

Gate de decisiones condicionadas por policy:

- antes de materializar V65, V66 o V68, cada spec aplicable debe vincular una
  policy aprobada o declarar explícitamente sus entradas, resultado y autoridad
  de decisión para el perfil de assurance, la activación de Product/UX y la
  exigencia de QA independiente;
- ninguna condición expresada como “cuando corresponda” permite omitir el
  control si esa regla todavía no está resuelta.

Si una dependencia no tiene contrato y evidencia aprobados, el bloque que la
consume no comienza aunque su documento de plan esté aprobado.

## 5. Orden canónico y entregas

```text
P0: foundation y precondiciones de ejecución
 │
 └─ P1 V63 ─ P2 V64 ─ P3 V65 ─ P4 V66
                                      │
                                      └─ P5 V67 ─ P6 V68 ─ P7 V69 ─ P8 V70
                                                                            │
                                                                            └─ G1
```

### P1 — SPEC-V63: Studio Alpha & Cloud Foundation

Precondición: V60, V62 y los gates universales de P0 cerrados.

Objetivo: crear la experiencia primaria simple de Studio y la foundation mínima
de organizaciones, proyectos y miembros, manteniendo los detalles técnicos en
una consola secundaria.

Cobertura: `V63-RQ-01` a `V63-RQ-10`.

Evidencia y gate de salida:

- un usuario de prueba completa onboarding sin documentación WDD/SDD;
- proyecto, actividad, decisiones y Project Brain conducen a una siguiente
  acción clara;
- progressive disclosure conserva una única fuente de estado;
- `claimed` nunca se presenta como `verified`;
- la instrumentación demuestra que no captura código o secretos innecesarios;
- registro, organización, proyecto y miembros operan con permisos mínimos.

### P2 — SPEC-V64: Existing Project Onboarding & Quiver Rescue

Precondición: V60, V61 y V63 efectivas.

Objetivo: conectar un proyecto existente, producir un Project Brain inicial y
un Rescue Report basado en evidencia antes de proponer cambios amplios.

Cobertura: `V64-RQ-01` a `V64-RQ-10`.

Evidencia y gate de salida:

- un repositorio real se analiza sin modificarlo por defecto;
- GitHub usa permisos mínimos y existe fallback local/manual;
- hechos, inferencias y desconocidos conservan su estado de evidencia;
- el usuario corrige inferencias sin editar Markdown;
- Dependency/Exit Report y Rescue priorizan impacto sin prometer migración;
- datos del cliente fuera de alcance no ingresan al contexto.

### P3 — SPEC-V65: Quiver Lead, Feature Brief & Decision Inbox

Precondición: V61, V63 y V64 efectivas.

Objetivo: convertir un pedido en un Feature Brief entendible y concentrar las
intervenciones humanas relevantes en una Decision Inbox única.

Cobertura: `V65-RQ-01` a `V65-RQ-10`.

Evidencia y gate de salida:

- alcance, no alcance, resultado, usuarios, riesgo e impacto son verificables;
- las preguntas se limitan a respuestas que cambian una dimensión declarada;
- supuestos críticos permanecen visibles y separados de decisiones;
- ninguna decisión sensible se resuelve por una asunción de agente;
- cada decisión expone recomendación, alternativas, impacto y reversibilidad;
- el brief aprobado queda vinculado al contrato interno y Project Brain.

### P4 — SPEC-V66: Product & UX Design Workspace

Precondición: V65 efectiva y fuente visual aprobada disponible.

Objetivo: incorporar flujo, wireframes, feedback y aprobación de diseño cuando
la naturaleza y policy del cambio lo requieran, antes del código.

Cobertura: `V66-RQ-01` a `V66-RQ-10`.

Evidencia y gate de salida:

- Product/UX solo se activa cuando corresponde al cambio;
- los cambios de interacción relevantes tienen flujo y estado aprobados;
- se reutilizan componentes del design system antes de crear variantes;
- identidad, referencias y restricciones de marca tienen fuente trazable;
- responsive y accesibilidad básica forman parte de la definición afectada;
- el feedback se convierte en propuesta trazable vinculada a implementación;
- ninguna herramienta visual se convierte en fuente de reglas de negocio.

### P5 — SPEC-V67: Assisted Feature Delivery Loop

Precondición: V62, V65 y V66 efectivas.

Objetivo: llevar una Feature Delivery desde brief y diseño hasta implementación
verificable, con GitHub como fuente del código y aislamiento por entrega.

Cobertura: `V67-RQ-01` a `V67-RQ-10`.

Evidencia y gate de salida:

- una funcionalidad real recorre el flujo completo con branch/worktree aislado;
- brief, diseño, ejecución, QA y PR conservan el mismo identity chain;
- scope y cambios fuera del pedido se detectan antes del PR;
- checkpoints, actores, herramientas, archivos y verificación son auditables;
- un fallo de push se distingue de un fallo funcional;
- la intervención humana Alpha es visible sin prometer autonomía total.

### P6 — SPEC-V68: Independent QA & Strong Definition of Done

Precondición: V65 y V67 efectivas.

Objetivo: derivar QA de requirements y acceptance criteria, separando evidencia
determinística, revisión independiente y límites no probados.

Cobertura: `V68-RQ-01` a `V68-RQ-10`.

Evidencia y gate de salida:

- validadores determinísticos corren antes de revisión semántica;
- QA/revisión independiente aplica cuando la policy del cambio lo requiere;
- build, typecheck, lint, tests, browser y visuales se ejecutan solo según stack,
  policy y alcance;
- una regresión crítica impide declarar listo;
- `passed`, `partially-validated`, `blocked`, `failed` y `not-tested` no se
  colapsan;
- el veredicto simple y las evidence refs técnicas derivan del mismo estado.

### P7 — SPEC-V69: GitHub + Vercel Preview & PR Delivery

Precondición: V62, V67 y V68 efectivas; integración no productiva habilitada.

Objetivo: entregar un PR y una preview navegable cuya identidad corresponda al
mismo commit que fue validado por QA.

Cobertura: `V69-RQ-01` a `V69-RQ-10`.

Evidencia y gate de salida:

- `PR HEAD = deployment source SHA = QA source SHA` antes de aprobar preview;
- un cambio de HEAD o deployment invalida QA y aprobación anteriores;
- PR y preview conservan objetivo, alcance, checks, riesgos y findings;
- feedback de preview produce una propuesta trazable;
- aprobar una versión no equivale a publicarla;
- producción, merge automático, credenciales y datos productivos permanecen
  deshabilitados.

### P8 — SPEC-V70: Project Brain Continuous Reconciliation

Precondición: V60 y V67–V69 efectivas.

Objetivo: reconciliar conocimiento verificable después de entregas y preservar
una proyección abierta compatible con Obsidian, con autoridad single-writer.

Cobertura: `V70-RQ-01` a `V70-RQ-10`.

Evidencia y gate de salida:

- merges, verificaciones y eventos de release permitidos actualizan hechos
  verificables de forma determinística e idempotente;
- inferencias y cambios de intención ingresan como proposals aprobables;
- drift, frescura, contradicciones y decisiones stale permanecen visibles;
- requirement, decisión, diseño, cambio, QA, PR y release conservan enlaces;
- exportar y reabrir el vault conserva IDs y enlaces sin plugin obligatorio;
- cambios externos vuelven con diff como proposals, nunca como policy efectiva;
- no existe sincronización multi-writer implícita entre herramientas.

## 6. Paralelismo y coordinación multi-agente

No se prevé paralelismo entre V63–V70: el grafo de dependencias y el roadmap
fuente forman una secuencia serial. Una spec posterior no puede usar un contrato
provisional de la anterior para adelantar implementación.

El trabajo multi-agente solo puede aplicarse dentro de una spec aprobada a
documentación, validaciones o write sets demostrablemente independientes. Antes
de delegar deben quedar definidos ownership, inputs/outputs, archivos permitidos,
gates y mecanismo de integración. Cualquier solapamiento serializa el trabajo.

## 7. Trazabilidad y evidencia mínima

| Bloque | Requisitos | Dependencias | Evidencia de salida |
|---|---:|---|---|
| V63 | 10 | V60, V62 | Onboarding simple, permisos y estados confiables |
| V64 | 10 | V60, V61, V63 | Brain/Rescue observables, read-only y minimización |
| V65 | 10 | V61, V63, V64 | Brief y decisiones sin supuestos críticos ocultos |
| V66 | 10 | V65 | Diseño aprobado, reusable, responsive y trazable |
| V67 | 10 | V62, V65, V66 | Feature Delivery aislada y auditable |
| V68 | 10 | V65, V67 | QA independiente y veredicto no ambiguo |
| V69 | 10 | V62, V67, V68 | Identidad SHA y preview no productiva |
| V70 | 10 | V60, V67–V69 | Brain/vault reconciliados con single-writer |

Total obligatorio: **80 requisitos**, sin duplicados ni requisitos huérfanos.

Cada spec futura debe crear su trazabilidad requirement → acceptance criterion →
slice → validación → evidencia. Una afirmación de agente o proveedor no cuenta
como evidencia ejecutada.

## 8. Riesgos, validación temprana y mitigación

| Riesgo | Prob. | Impacto | Validación temprana | Mitigación |
|---|---|---|---|---|
| Ejecutar B antes de tener V60–V62 efectivas | Alta | Alto | Auditar status, contratos y evidencia antes de cada spec | Gate fail-closed por dependencia |
| Repositorio Cloud o workflow/arquitectura no disponibles | Alta | Alto | Resolver acceso antes de V63 | Detener diseño técnico; navegar docs del repo real |
| Ausencia de baseline visual concreta produce design drift | Alta | Medio | Identificar fuente y componentes aprobados | Bloquear UI hasta tener baseline; reutilizar antes de crear |
| Código, secretos o datos del cliente exceden permisos/contexto | Media | Alto | Fixtures de permisos, telemetría y previews | Minimización, entornos no productivos y bloqueo ante fuga |
| SHA de PR, QA y preview divergen y generan false green | Media | Alto | Comparar identidades en cada cambio | Invalidación automática y aprobación fail-closed |
| Una acción Alpha llega a producción o hace merge automático | Baja | Alto | Negative tests de publicación y permisos | Controles explícitos y credenciales sin alcance productivo |
| Project Brain recibe múltiples writers o cambios no autorizados | Media | Alto | Reconciliación repetida y edición externa | Single-writer; cambios externos solo como proposal |

## 9. Estrategia de validación proporcional

Antes de implementar cada bloque:

- plan, requirement, spec y slices aplicables están aprobados y vinculados;
- dependencias efectivas y P0 están cerrados con evidencia;
- permisos, repositorio, workflow y fuentes visuales requeridos están disponibles;
- los RQs del bloque tienen criterios y evidence refs planificadas.

E2E e integraciones dirigidos mínimos:

- V63: onboarding, organización/proyecto/miembro, siguiente acción, progressive
  disclosure, estados de evidencia y telemetría sin contenido sensible; incluir
  un caso negativo donde un usuario autenticado no miembro no puede leer ni
  modificar un proyecto de otra organización.
- V64: repo real en modo read-only, fallback local, Project Brain/Rescue Report,
  corrección de inferencia y minimización de datos.
- V65: pedido → brief → supuesto/decisión → aprobación → vínculos, incluyendo una
  decisión sensible que no puede resolverse en silencio.
- Policy condicional: usar al menos un caso que active high-assurance,
  Product/UX y QA independiente, y otro que no los active; ambos deben conservar
  la regla aplicada, el resultado y la autoridad que lo decidió.
- V66: cambio de interacción relevante desde flow/wireframe hasta feedback y
  aprobación, verificando componente reutilizado, responsive y accesibilidad
  básica solo en las vistas afectadas.
- V67: una Feature Delivery real con branch/worktree aislado, scope verificable,
  checkpoints y distinción entre fallo operativo de push y fallo funcional.
- V68: acceptance criteria → validadores determinísticos → revisión
  independiente → veredicto/evidencia, incluyendo estados no verdes.
- V69: PR y preview del mismo SHA validado, invalidación por nuevo commit y
  rechazo de producción, credenciales o datos no permitidos.
- V70: reconciliación repetible e idempotente de Brain/vault, drift visible,
  edición externa convertida en proposal y enforcement de single-writer;
  incluir un evento de release simulado/no productivo que actualice hechos y
  enlaces de forma determinística e idempotente.

La regresión se limita a los flujos y contratos afectados. Seguridad se valida
de forma dirigida en permisos, secretos, datos de cliente, previews y autoridad
de writers. No se exige regresión general, carga, rendimiento, certificación de
seguridad ni E2E universal salvo evidencia nueva que eleve el riesgo real.

## 10. Gate G1 — Product Value / Paid Repeat Use

G1 se evalúa solo después de cerrar V70. Antes de ampliar Observer/Control debe
existir evidencia de:

- al menos 5 design partners con repos reales;
- al menos 3 equipos que pidieron una segunda o tercera Feature Delivery;
- QA/Project Brain identificados como valor real y no como burocracia;
- al menos un piloto pago o compromiso equivalente;
- onboarding que no exija aprender WDD/SDD;
- tasa de rescate humano conocida y aceptable.

El cierre técnico de V70 no implica `PASS` de G1. Si G1 falla, se mantiene el
OSS/Studio asistido o se pivotea mensaje/ICP; no se compensa construyendo más
infraestructura ni se inicia automáticamente la iniciativa C.

## 11. Rollback y stop conditions

Triggers de detención:

- dependencia V60–V62 o contrato previo inexistente, stale o no aprobado;
- acceso, workflow o arquitectura del repositorio objetivo no resueltos;
- lectura o persistencia de secretos/datos fuera del alcance permitido;
- acceso productivo, publicación o merge no autorizado;
- divergencia entre PR HEAD, deployment source SHA y QA source SHA;
- evidencia stale o incompleta presentada como `verified`;
- mutación no autorizada o multi-writer de Project Brain;
- pérdida de lineage entre brief, diseño, código, QA, PR y conocimiento.

Respuesta proporcional:

1. detener nuevos writers, integraciones y bloques dependientes;
2. deshabilitar o revocar la integración afectada dentro de su alcance;
3. invalidar approvals/evidencia asociadas al SHA o estado stale;
4. preservar GitHub, artifacts, history y evidence refs para diagnóstico;
5. revertir únicamente la slice o PR responsable cuando sea seguro;
6. crear una nueva versión del artifact afectado con decisión, motivo e impacto
   antes de reanudar.

No se permite operar producción para probar recuperación, borrar historia,
ocultar intervención humana ni degradar evidencia no verificable a estado verde.
Cada spec futura debe congelar su rollback concreto antes de implementar.

## 12. Cadena de aprobación registrada

El project owner aprobó explícitamente la cadena propuesta:

1. `REQ-QUIVER-INIT-B-STUDIO-ALPHA@1.0.1`, persistido como sucesor aprobado
   `1.0.2`;
2. el binding de B de `PLAN-QUIVER-MASTER@6.0.5`, actualizado en `6.0.6` sin
   aprobar el roadmap completo ni las iniciativas C–G;
3. `PLAN-QUIVER-INIT-B-STUDIO-ALPHA@1.0.1`, persistido como este sucesor
   aprobado `1.0.2`.

La aprobación habilita crear el plan C. No inicia código, specs, release ni
deploy, no aprueba G1 y no afirma que las dependencias de ejecución de C estén
completadas.

## 13. Cierre de revisión v1.0.0

| Hallazgo obligatorio | Resolución en v1.0.1 |
|---|---|
| `PLAN-B-REV-01` | Gate explícito para policy/perfil, Product/UX y QA independiente, con casos positivo y negativo |
| `PLAN-B-REV-02` | Caso negativo dirigido de aislamiento entre organización y proyecto |
| `PLAN-B-REV-03` | Evento de release simulado y no productivo en la validación de V70 |
