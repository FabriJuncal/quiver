# 03-slice - Contrato de no regresion

## 1. Nombre del slice

Contrato de no regresion.

## 2. Objetivo del slice

Definir reglas verificables para modificar o extraer funcionalidad sin quitar comportamiento existente.

## 3. Problema puntual que resuelve

Evita que cambios futuros se aprueben por intencion general en vez de evidencia contra baseline.

## 4. Valor observable que entrega

Un contrato que obliga matriz antes/despues, aprobacion explicita de cambios incompatibles y rollback por slice.

## 5. Alcance especifico

Formalizar reglas de compatibilidad y criterios de cierre.

## 6. Que incluye

- Definicion de funcionalidad existente.
- Matriz antes/despues obligatoria.
- Categorias de cambio compatible, incompatible y aprobado.
- Reglas para JSON, exit codes, streams, aliases y side effects.
- Requisitos de rollback.

## 7. Que no incluye

- Cambios de comandos.
- Ejecucion de tests.
- Implementacion de parser.

## 8. Actores involucrados

Tech Lead, reviewer, maintainer e implementador futuro.

## 9. Precondiciones

`02-slice` debe existir o estar aprobado como baseline suficiente.

## 10. Entradas necesarias

Baseline, criterios aprobados y riesgos del plan.

## 11. Flujo operativo paso a paso

1. Definir funcionalidad existente en terminos verificables.
2. Definir matriz antes/despues obligatoria.
3. Definir criterios para cambios compatibles.
4. Definir aprobacion para cambios incompatibles.
5. Definir rollback y evidencia minima.
6. Definir condiciones anti-fix parcial.

## 12. Salidas esperadas

Contrato de no regresion reusable por todos los slices tecnicos futuros.

## 13. Reglas de negocio aplicables

- Ningun comportamiento inventariado puede desaparecer sin aprobacion.
- Todo cambio de comando debe explicar que hacia antes y que mejora.
- `--json`, exit codes y side effects requieren validacion explicita.
- Refactor y bump de version no se mezclan.

## 14. Validaciones

- El contrato cubre comandos, API interna, scripts, docs y tests.
- Hay criterios para cierre completo, parcial, bloqueado y descartado.
- Cada regla es verificable.

## 15. Manejo de errores o edge cases

- Si la mejora no es verificable, no se aprueba como mejora.
- Si una regresion es intencional, requiere aprobacion explicita.
- Si falta baseline para un comando, el cambio queda bloqueado.

## 16. Criterios de aceptacion

- Existe definicion formal de funcionalidad existente.
- Existe formato obligatorio de matriz antes/despues.
- Existe regla anti-fix parcial.
- Existe requerimiento de rollback por slice implementable.
- Cambios incompatibles requieren aprobacion explicita.

## 17. Dependencias tecnicas, funcionales o externas

Baseline del `02-slice`.

## 18. Depende de slices

`02-slice`.

## 19. Riesgos / decisiones abiertas

El contrato puede ser demasiado laxo si no enumera outputs y side effects.

## 20. Pendientes / preguntas abiertas

Definir si cambios de texto humano menor requieren aprobacion o solo evidencia.
