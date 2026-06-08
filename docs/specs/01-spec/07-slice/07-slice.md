# 07-slice - Docs, tests y evidencia

## 1. Nombre del slice

Docs, tests y evidencia.

## 2. Objetivo del slice

Planificar como validar y documentar cambios futuros para que CLI, docs y tests no diverjan.

## 3. Problema puntual que resuelve

Evita que tests nuevos den falsa seguridad o que docs generadas no coincidan con la CLI real.

## 4. Valor observable que entrega

Contrato de evidencia para futuras implementaciones: pruebas minimas, docs afectadas y criterios de cierre.

## 5. Alcance especifico

Plan documental de validacion, no ejecucion de tests ni cambios de docs.

## 6. Que incluye

- Mapa de cobertura existente.
- Reglas para no reemplazar cobertura sin equivalencia.
- Gate CLI/docs.
- Evidencia minima por tipo de cambio.
- Registro de validaciones pendientes.

## 7. Que no incluye

- Ejecutar tests.
- Modificar tests.
- Regenerar docs.
- Cambiar codigo.

## 8. Actores involucrados

Reviewer, implementador futuro, maintainer y usuarios CLI.

## 9. Precondiciones

Contrato de no regresion aprobado y planes de extraccion definidos.

## 10. Entradas necesarias

Baseline, matriz de comandos, tests existentes y docs actuales.

## 11. Flujo operativo paso a paso

1. Mapear tests actuales por comportamiento.
2. Identificar docs que describen comandos.
3. Definir evidencia minima por cambio.
4. Definir gate CLI/docs.
5. Definir criterios para cobertura reemplazada.
6. Definir reporte de cierre.

## 12. Salidas esperadas

Checklist de validacion y evidencia para implementaciones futuras.

## 13. Reglas de negocio aplicables

- No se elimina cobertura sin reemplazo equivalente.
- Docs deben reflejar CLI real.
- Evidencia no ejecutada se marca pendiente, no aprobada.
- Cambios de JSON/exit code requieren pruebas especificas.

## 14. Validaciones

- Cada tipo de cambio tiene evidencia minima.
- Hay criterio para docs generadas.
- Hay criterio para tests reemplazados.
- Hay formato de riesgos residuales.

## 15. Manejo de errores o edge cases

- Si una validacion no puede ejecutarse, registrar motivo y riesgo.
- Si docs se generan automaticamente, validar fuente y output.
- Si test viejo se borra, exigir mapeo de cobertura.

## 16. Criterios de aceptacion

- Existe checklist de evidencia por tipo de cambio.
- Existe gate CLI/docs.
- Existe regla de cobertura equivalente.
- Validaciones pendientes no se confunden con exitos.
- Cierre requiere riesgos residuales explicitos.

## 17. Dependencias tecnicas, funcionales o externas

Baseline, contrato y planes de extraccion.

## 18. Depende de slices

`03-slice`, `05-slice` y `06-slice` como insumos para tipos de cambio.

## 19. Riesgos / decisiones abiertas

Puede haber docs generadas cuyo proceso no este documentado.

## 20. Pendientes / preguntas abiertas

Definir si evidencia minima sera manual, automatizada o ambas.
