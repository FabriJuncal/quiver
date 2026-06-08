# 02-slice - Baseline de comportamiento actual

## 1. Nombre del slice

Baseline de comportamiento actual.

## 2. Objetivo del slice

Documentar el comportamiento actual que no debe romperse antes de cualquier extraccion o refactor.

## 3. Problema puntual que resuelve

Sin baseline, la regla de no quitar funcionalidad no es verificable.

## 4. Valor observable que entrega

Matriz de comportamiento actual para comandos, flags, aliases, outputs, JSON, exit codes, side effects, exports, scripts, templates y docs generadas.

## 5. Alcance especifico

Crear un contrato de observacion del estado actual. No cambia codigo ni tests.

## 6. Que incluye

- Inventario de comandos visibles.
- Aliases y flags.
- `--help` y `--json`.
- Exit codes para exito/error.
- Stdout/stderr esperados.
- Archivos generados y rutas.
- Scripts CI relevantes.
- Exports internos usados por tests o consumidores.
- Templates y docs generadas.

## 7. Que no incluye

- Cambios de parser.
- Cambios de comandos.
- Bumps de version.
- Reemplazo de tests.

## 8. Actores involucrados

Tech Lead, reviewer, usuarios CLI y automatizaciones.

## 9. Precondiciones

`01-slice` completado o snapshot de base aprobado.

## 10. Entradas necesarias

CLI actual sobre `origin/main`, documentacion actual y tests existentes.

## 11. Flujo operativo paso a paso

1. Enumerar comandos y aliases actuales.
2. Registrar flags por comando.
3. Capturar comportamiento de ayuda.
4. Registrar contratos JSON cuando existan.
5. Registrar exit codes y streams.
6. Registrar archivos generados y side effects.
7. Registrar scripts y exports relevantes.
8. Identificar areas sin evidencia.

## 12. Salidas esperadas

Matriz de baseline y lista de gaps que bloquean extracciones futuras.

## 13. Reglas de negocio aplicables

- Ningun slice tecnico puede avanzar sin baseline suficiente.
- `--json`, exit codes y side effects son contrato funcional.
- Falta de evidencia se documenta como riesgo, no se asume seguro.

## 14. Validaciones

- Cada comando critico tiene entrada en la matriz.
- Cada cambio futuro puede referenciar baseline.
- Los gaps estan marcados explicitamente.

## 15. Manejo de errores o edge cases

- Si un comando no puede ejecutarse sin side effects, registrar precondiciones y no forzarlo.
- Si no existe JSON mode, registrar como no soportado.
- Si hay outputs variables, registrar partes estables.

## 16. Criterios de aceptacion

- Existe matriz baseline antes de extraer codigo.
- Baseline cubre comandos, flags, aliases, help, JSON, exit codes y side effects.
- Las areas no cubiertas estan listadas como riesgos.
- Ningun cambio futuro puede declararse no regresivo sin comparar contra este baseline.

## 17. Dependencias tecnicas, funcionales o externas

Snapshot aprobado y acceso a CLI/documentacion actual.

## 18. Depende de slices

`01-slice`.

## 19. Riesgos / decisiones abiertas

Puede ser costoso cubrir todos los comandos; si se prioriza, debe quedar explicito.

## 20. Pendientes / preguntas abiertas

Definir comandos criticos minimos si el baseline completo requiere varias iteraciones.
