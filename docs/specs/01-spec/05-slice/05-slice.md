# 05-slice - Parser y command registry

## 1. Nombre del slice

Parser y command registry.

## 2. Objetivo del slice

Planificar la recuperacion segura de parser y command registry como cambio transversal de alto riesgo.

## 3. Problema puntual que resuelve

Evita tratar parser/registry como refactor pequeno cuando afecta la entrada de toda la CLI.

## 4. Valor observable que entrega

Plan tecnico futuro con compatibilidad total contra baseline, archivos candidatos/excluidos y rollback.

## 5. Alcance especifico

Planificacion de extraccion o rehacer de `command-registry` y `parser` sin implementacion.

## 6. Que incluye

- Analisis de archivos candidatos.
- Matriz de comandos afectados.
- Gates de compatibilidad.
- Criterios para conservar aliases, flags y outputs.
- Rollback futuro.

## 7. Que no incluye

- Implementar parser.
- Cambiar dispatch CLI.
- Modificar `package.json` o version.
- Eliminar comportamiento existente.

## 8. Actores involucrados

Tech Lead, implementador futuro, reviewer y usuarios CLI.

## 9. Precondiciones

`04-slice` debe identificar parser/registry como candidato con decision aprobada.

## 10. Entradas necesarias

Matriz de extraccion, baseline, contrato de no regresion y diffs de rama fuente.

## 11. Flujo operativo paso a paso

1. Confirmar decision: extraer codigo, extraer concepto o rehacer.
2. Listar comandos afectados por parser.
3. Definir compatibilidad obligatoria.
4. Excluir package/version.
5. Definir validaciones por comando.
6. Definir rollback.
7. Preparar handoff para implementacion futura.

## 12. Salidas esperadas

Plan tecnico listo para una rama futura desde `origin/main`.

## 13. Reglas de negocio aplicables

- Parser/registry es alto riesgo.
- Ningun alias, flag o exit code puede desaparecer sin aprobacion.
- Cambios de salida JSON requieren contrato explicito.
- No se mezcla con bump de version.

## 14. Validaciones

- Todos los comandos del baseline estan mapeados.
- Cada diferencia propuesta tiene motivo y mejora.
- Rollback definido.
- No hay archivos package/version en alcance.

## 15. Manejo de errores o edge cases

- Si un comando no tiene baseline, parser queda bloqueado para ese comando.
- Si un alias no puede preservarse, requiere aprobacion.
- Si el codigo viejo no encaja, se rehace el concepto.

## 16. Criterios de aceptacion

- El plan no permite merge/cherry-pick amplio.
- Parser/registry se tratan como cambio transversal.
- Existe matriz de compatibilidad por comando.
- Package/version quedan fuera.
- Rollback y evidencia estan definidos.

## 17. Dependencias tecnicas, funcionales o externas

Baseline, contrato y matriz de extraccion.

## 18. Depende de slices

`04-slice`.

## 19. Riesgos / decisiones abiertas

La compatibilidad total puede requerir tests adicionales antes de implementar.

## 20. Pendientes / preguntas abiertas

Definir si se extrae codigo exacto o se reimplementa concepto desde cero.
