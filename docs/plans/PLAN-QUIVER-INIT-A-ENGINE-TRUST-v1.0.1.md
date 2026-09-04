---
artifact_id: "PLAN-QUIVER-INIT-A-ENGINE-TRUST"
artifact_type: "plan"
document_type: "Initiative Delivery Plan"
version: "1.0.1"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./PLAN-QUIVER-INIT-A-ENGINE-TRUST-v1.0.0.md"
requirements:
  - artifact_id: "REQ-QUIVER-INIT-A-ENGINE-TRUST"
    version: "1.0.2"
    path: "../requirements/initiatives/REQ-QUIVER-INIT-A-ENGINE-TRUST-v1.0.2.md"
parent_plan:
  artifact_id: "PLAN-QUIVER-MASTER"
  version: "6.0.3"
  path: "./PLAN-QUIVER-MASTER-v6.0.3.md"
decisions:
  - decision_id: "DEC-20260903-016"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Crear el plan independiente de la iniciativa A con secuencia guiada por riesgo"
    reason: "Permitir aprobación aislada de V58–V62 antes de planificar la iniciativa B"
    impact: "Define orden, gates y evidencia; no crea specs nuevas ni autoriza implementación"
  - decision_id: "DEC-20260903-020"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Resolver PLAN-A-REV-01, PLAN-A-REV-02 y PLAN-A-REV-03"
    reason: "Cerrar la revisión técnica-funcional de producción sin ampliar alcance"
    impact: "Explicita aprobación, estado canónico y E2E dirigidos; el plan continúa propuesto"
---

# Plan de iniciativa A — Quiver Engine y fundamentos de confianza

## 1. Propósito y estado de aprobación

Este plan convierte los 46 requisitos de la iniciativa A en una secuencia de
entrega verificable para `SPEC-V58` a `SPEC-V62`. Su estado es `proposed` y
requiere aprobación explícita del project owner.

La aprobación de este documento:

- congela el orden, los gates y las obligaciones de evidencia de la iniciativa;
- habilita que A sea materializada mediante specs y slices cuando se autorice su
  ejecución;
- habilita continuar documentalmente con el plan de la iniciativa B;
- no inicia implementación, release, deploy ni publicación.

La aprobación no es transitiva por silencio. Debe nombrar explícitamente el
requerimiento revisado, el binding maestro y este plan según la sección 11.

## 2. Alcance y blast radius

### Incluido

- `SPEC-V58`: cierre verificable de Risk-aware Review Governance.
- `SPEC-V59`: integridad, recuperación y contratos efectivos de drafts.
- `SPEC-V60`: Project Brain y Open Knowledge Vault.
- `SPEC-V61`: selección de contexto, contradicciones y grafo de impacto.
- `SPEC-V62`: contratos de máquina, lineage y provenance.
- Quiver Engine, Protocol y CLI en los límites declarados por cada requerimiento.
- Compatibilidad, migración y evidencia necesarias para evitar false green.

### Excluido

- Quiver Studio, Quiver Cloud, Builder, AgentRuntime y orquestación remota.
- Obsidian como dependencia obligatoria o backend operacional.
- Release, distribución, deploy u OTA.
- Decisiones de storage, índices, schemas internos o APIs todavía no aprobadas en
  una spec ejecutable.
- Implementación como parte de esta aprobación documental.

### Stakeholders y autoridad

- El project owner aprueba el plan y cualquier cambio de alcance o arquitectura.
- Los mantenedores de Quiver materializan y ejecutan las specs aprobadas.
- Los consumidores de CLI, artifacts y Project Brain reciben los contratos
  resultantes, sin perder compatibilidad ni provenance.

## 3. Línea base verificada

- `SPEC-V58` tiene sus siete slices completadas.
- PR [#144](https://github.com/FabriJuncal/quiver/pull/144) fue fusionado en
  `main` el 2026-08-31 con commit
  `2f0afd8cbfdc000faea7747fd7ab8a26c9950d55`.
- Las proyecciones canónicas raíz de V58 y
  `REQ-QUIVER-INIT-A-ENGINE-TRUST@1.0.2` fueron reconciliadas con ese merge.
  `specs/quiver-v58-risk-aware-review-governance/STATUS.md` es la fuente
  operativa de estado; el requerimiento conserva la baseline de alcance.
- No existen specs ejecutables para V59, V60, V61 o V62.
- El cierre de V58 no implica release ni deploy y no autoriza trabajar desde su
  rama histórica.

## 4. Dependencias y orden canónico

```text
P0: reconciliar cierre V58 y baseline
                 │
                 ├── P1a: V59 Draft Integrity
                 └── P1b: V60 Project Brain
                              │
                              └── P2: V61 Context & Impact
P1a + P1b + P2 ──────────────────── P3: V62 Machine Contract
```

- V59 depende de V58 cerrada.
- V60 depende de V58 y puede avanzar en paralelo con parte de V59.
- V61 no comienza antes de estabilizar V60.
- V62 es la convergencia de V59–V61 y no puede declarar contratos efectivos
  hasta consumir versiones aprobadas de esas specs.
- No existe gate comercial de entrada para A; las dependencias técnicas y gates
  humanos siguen siendo obligatorios.

## 5. Plan priorizado por riesgo

### P0 — Reconciliación y foundation gate

Objetivo: evitar que las siguientes specs se construyan sobre estado documental
stale o contratos de governance no verificados.

Acciones:

1. Verificar que `STATUS.md`, `SPEC.md`, `EXECUTION_PLAN.md`,
   `EVIDENCE_REPORT.md` y `REQ-QUIVER-INIT-A-ENGINE-TRUST@1.0.2` continúan
   consistentes con #144.
2. Bloquear el avance si la fuente operativa y el requerimiento vuelven a
   divergir; la evidencia de merge prevalece sobre proyecciones stale.
3. Verificar que las siete slices continúan completas y que no existe trabajo
   de release/deploy presentado como cerrado.
4. Inventariar las superficies v58 que V59–V62 deben consumir sin redefinir:
   approvals, findings, digests, provenance, migración y machine output.
5. Crear una matriz de trazabilidad para los 46 RQs de A antes de materializar
   la primera spec nueva.
6. Confirmar que V59 y V60 parten desde `main` actualizado y nunca desde la rama
   histórica de V58.

Gate de salida:

- merge y evidencia de V58 reconciliados;
- cero contradicciones abiertas sobre el estado de V58;
- límites heredados identificados, sin introducir arquitectura nueva.

### P1a — SPEC-V59: Draft Integrity & Effective Contracts

Objetivo: impedir pérdida silenciosa de contenido y permitir recuperación,
addendums y amendments con lineage verificable.

Cobertura: `V59-RQ-01` a `V59-RQ-08`.

Entregables posteriores a la aprobación de ejecución:

1. Spec ejecutable con estados de draft, puntero `current`, rollback no
   destructivo y clasificación de retry/revisión.
2. Slices definidas por la spec, con cada write set y validación declarados.
3. Evidencia de content-loss detection, recuperación de versión, addendum,
   amendment, corrupción y lineage.
4. Contrato de salida que V62 pueda integrar sin reinterpretar texto humano.

Gate de salida:

- los ocho RQs tienen criterios y evidencia trazables;
- ninguna operación elimina versiones históricas;
- una versión defectuosa no invalida silenciosamente la última válida.

### P1b — SPEC-V60: Project Brain & Open Knowledge Vault Foundation

Objetivo: crear memoria durable, abierta y trazable, separada del historial de
chat y sin dependencia obligatoria de Obsidian.

Cobertura: `V60-RQ-01` a `V60-RQ-10`.

Entregables posteriores a la aprobación de ejecución:

1. Spec ejecutable para registros tipados, precedencia, vigencia, provenance,
   exportación y exclusión de secretos.
2. Contrato de Open Knowledge Vault en Markdown + YAML + enlaces.
3. Slices y pruebas para creación automática, reemplazo de decisiones,
   portabilidad y ausencia de secretos.
4. Contrato estable de entrada para V61.

Gate de salida:

- los diez RQs tienen criterios y evidencia trazables;
- el vault puede abrirse sin conversión propietaria;
- secretos y estado operacional efímero permanecen excluidos;
- Obsidian continúa siendo opcional.

### P2 — SPEC-V61: Context Selection, Contradictions & Impact Graph

Precondición: V60 aprobada y con contrato estable para Project Brain.

Objetivo: entregar contexto mínimo, explicable y vigente, detectando
contradicciones e impacto antes de modificar software.

Cobertura: `V61-RQ-01` a `V61-RQ-10`.

Entregables posteriores a la aprobación de ejecución:

1. Spec ejecutable para Context Manifest, presupuesto, autoridad, confianza y
   estado stale.
2. Contrato de contradicciones que eleva decisiones en vez de resolverlas en
   silencio.
3. Grafo y resumen de impacto limitados al alcance aprobado por la spec.
4. Pruebas de selección/exclusión explicable y separación de contenido no
   confiable.

Gate de salida:

- los diez RQs tienen criterios y evidencia trazables;
- una contradicción relevante bloquea o solicita decisión;
- ningún contrato obligatorio se trunca silenciosamente.

### P3 — SPEC-V62: Machine Contract & Provenance Foundation

Precondición: V59, V60 y V61 aprobadas con sus contratos efectivos disponibles.

Objetivo: estabilizar envelopes, lineage, errores y proyecciones humanas/JSON
que consumirán iniciativas posteriores.

Cobertura: `V62-RQ-01` a `V62-RQ-10`.

Entregables posteriores a la aprobación de ejecución:

1. Spec ejecutable que integre los contratos aprobados de V59–V61.
2. Artifact Envelope y relaciones de lineage versionados según el requerimiento.
3. Salida JSON estable, códigos de error, paridad humana y validación offline.
4. Compatibilidad de lectura legacy sin elevar evidencia a `verified`.

Gate de salida:

- los diez RQs tienen criterios y evidencia trazables;
- CLI humano y JSON derivan del mismo resultado canónico;
- artifacts legacy conservan historia y limitaciones;
- Studio y Cloud pueden consumir el contrato sin parsear texto libre.

## 6. Paralelismo permitido

El único paralelismo previsto es entre parte de V59 y V60, después de P0.

Condiciones obligatorias:

- specs y branches separadas;
- write sets sin solapamiento;
- dependencias explícitas y contracts compartidos congelados antes de escribir;
- ninguna de las dos specs asume decisiones que pertenecen a V62;
- si aparece una colisión de schemas, persistencia, IDs o migración, se serializa
  V59 antes de continuar V60.

V61 y V62 permanecen seriales por dependencia. La coordinación multi-agente
solo aplica cuando los write sets sean independientes y exista una ganancia
demostrable.

## 7. Trazabilidad y evidencia mínima

| Bloque | Requisitos | Dependencia | Evidencia de salida |
|---|---:|---|---|
| V58 | 8 | Ninguna nueva | Merge/evidencia reconciliados y estado no ambiguo |
| V59 | 8 | V58 | Integridad, recuperación y lineage verificables |
| V60 | 10 | V58 | Brain portable, vigente y sin secretos |
| V61 | 10 | V60 | Contexto explicable, contradicciones e impacto |
| V62 | 10 | V59–V61 | Paridad machine/human, lineage y compatibilidad |

Total obligatorio: **46 requisitos**, sin duplicados ni requisitos huérfanos.

Cada spec futura debe crear su propia trazabilidad requirement → acceptance
criterion → slice → validación → evidencia. Una afirmación de agente no cuenta
como evidencia ejecutada.

## 8. Riesgos, validación temprana y mitigación

| Riesgo | Prob. | Impacto | Validación temprana | Mitigación |
|---|---|---|---|---|
| Drift futuro entre proyecciones de V58 | Media | Alto | Comparar fuentes raíz con merge #144 | STATUS operativo, bloqueo ante divergencia |
| Drift entre contratos V59, V60 y V62 | Media | Alto | Revisar interfaces y lineage en cada slice-00 | Congelar límites y hacer V62 convergente |
| Colisión por paralelismo V59/V60 | Media | Alto | Comparar write sets antes de ejecutar | Serializar ante cualquier solapamiento |
| Pérdida o corrupción de drafts | Media | Alto | Fixtures de content loss y rollback de puntero | Historial inmutable y fail closed |
| Secretos o estado efímero en Brain | Media | Crítico | Fixtures de seguridad y exportación | Bloquear persistencia insegura; no sanitizar en silencio |
| False green en artifacts legacy o JSON | Media | Alto | Paridad, códigos estables y casos legacy | Conservar estado no verificado y bloquear avance |

## 9. Estrategia de validación

Antes de implementación:

- plan aprobado y requirement versionado vinculado en ambos sentidos;
- P0 cerrado con evidencia;
- spec y slices aprobadas para el bloque que se ejecutará;
- no existen decisiones críticas marcadas como `TODO` implícito.

Durante cada spec:

- checks de schema, Markdown, links y diff;
- tests unitarios/integración dirigidos por sus criterios;
- evidencia machine-readable y humana derivada del mismo estado;
- revisión humana en los gates declarados;
- actualización de status sin adelantar release o deploy.

E2E dirigidos mínimos, sin regresión general:

- V59: crear versiones, detectar pérdida estructural y recuperar el puntero
  `current` conservando historial y lineage;
- V60: crear Project Brain, exportar el Open Knowledge Vault y comprobar
  portabilidad y ausencia de secretos/estado efímero;
- V61: generar contexto, modificar una fuente contractual y comprobar estado
  stale, contradicción elevada y aislamiento de contenido no confiable;
- V62: proyectar el mismo estado por CLI humano y JSON, y leer un artifact legacy
  sin elevarlo a `verified`.

Las specs pueden precisar fixtures y comandos, pero no omitir el flujo completo
correspondiente sin una revisión versionada del plan. No se exige regresión
completa, carga o rendimiento salvo evidencia nueva de un riesgo real.

Al cerrar la iniciativa:

- 46/46 RQs trazados;
- V58–V62 cerradas en orden válido;
- V62 integra versiones efectivas de V59–V61;
- no quedan contradicciones, findings bloqueantes ni evidencia stale;
- cualquier release o deploy continúa como trabajo separado.

## 10. Rollback y stop conditions

Triggers de detención:

- pérdida de contenido o lineage;
- divergencia entre representación humana y JSON;
- secreto persistido o exportado;
- migración destructiva o incompatibilidad no prevista;
- contradicción contractual entre specs;
- evidencia stale presentada como válida.

Respuesta:

1. detener nuevos writers y no avanzar dependencias;
2. conservar artifacts y evidencia para diagnóstico;
3. revertir únicamente la slice o PR responsable cuando sea seguro;
4. mantener lectores y gates fail-closed;
5. crear una nueva versión del requirement/plan/spec con decisión, motivo e
   impacto antes de reanudar.

No se permite borrar historia, reescribir datos para simular compatibilidad ni
bajar evidencia no verificable a estado verde. Cada spec futura debe congelar
su rollback concreto antes de implementar.

## 11. Cadena y criterios de aprobación

La declaración del project owner debe aceptar explícitamente, en una sola
instrucción o en instrucciones separadas:

1. el contenido de `REQ-QUIVER-INIT-A-ENGINE-TRUST@1.0.2` como baseline de
   aceptación;
2. el binding de A dentro de `PLAN-QUIVER-MASTER@6.0.3`, sin aprobar por ello el
   roadmap completo ni las iniciativas B–G;
3. `PLAN-QUIVER-INIT-A-ENGINE-TRUST@1.0.1` como plan de A.

La persistencia respeta ese orden: primero se registra el sucesor aprobado del
requerimiento y luego el sucesor aprobado del plan apuntando a esa versión
exacta. El binding maestro se actualiza en la misma transición documental. Una
aprobación genérica que no identifica esta cadena requiere confirmación y no
habilita ejecución ni el plan B.

El plan puede aprobarse cuando el project owner confirma que:

- la baseline de requerimiento anterior queda aprobada y versionada;
- el binding maestro exacto queda confirmado solo para la iniciativa A;
- el alcance continúa limitado a V58–V62;
- el orden P0 → P1a/P1b → P2 → P3 es correcto;
- el paralelismo V59/V60 queda condicionado a write sets independientes;
- riesgos, stop conditions y rollback son suficientes;
- aprobar A habilita crear el plan B, pero no ejecutar código automáticamente.

Hasta esa confirmación, este documento permanece `proposed` y no se crea el plan
de la iniciativa B. Una confirmación válida puede expresarse como: “Apruebo la
cadena documental A: REQ-A 1.0.2, binding maestro 6.0.3 y PLAN-A 1.0.1”.

## 12. Cierre de revisión v1.0.0

| Hallazgo obligatorio | Resolución en v1.0.1 |
|---|---|
| `PLAN-A-REV-01` | Cadena, alcance y orden de aprobación explícitos |
| `PLAN-A-REV-02` | Estado V58 reconciliado y fuente operativa declarada |
| `PLAN-A-REV-03` | Un E2E dirigido y proporcional por spec nueva |
