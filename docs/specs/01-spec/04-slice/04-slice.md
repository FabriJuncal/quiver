# 04-slice - Matriz de extraccion por rama

## 1. Nombre del slice

Matriz de extraccion por rama.

## 2. Objetivo del slice

Determinar que partes de ramas conflictivas se deben extraer como codigo, concepto, rehacer o descartar.

## 3. Problema puntual que resuelve

Evita merges parciales improvisados y cherry-picks grandes desde ramas viejas.

## 4. Valor observable que entrega

Una matriz de decisiones por rama, archivo, comando o concepto con riesgo y proxima accion.

## 5. Alcance especifico

Analisis documental de ramas candidatas, especialmente `feature/QUIVER-46-49-cli-modernization`.

## 6. Que incluye

- Lista de ramas candidatas.
- Cambios por modulo.
- Clasificacion: extraer codigo, extraer concepto, rehacer, descartar.
- Riesgo textual, semantico y de contrato.
- Dependencias entre extracciones.
- Exclusiones explicitas.

## 7. Que no incluye

- Aplicar cambios.
- Resolver conflictos.
- Cherry-pick.
- Modificar package/version.

## 8. Actores involucrados

Tech Lead, reviewer e implementador futuro.

## 9. Precondiciones

`03-slice` aprobado y baseline disponible.

## 10. Entradas necesarias

Diffs, logs, merge-tree, baseline, contrato de no regresion y analisis de ramas.

## 11. Flujo operativo paso a paso

1. Seleccionar ramas candidatas.
2. Agrupar cambios por comportamiento o modulo.
3. Comparar contra baseline.
4. Clasificar cada hallazgo.
5. Registrar riesgos y dependencias.
6. Excluir cambios de version/package salvo slice futuro dedicado.
7. Proponer orden de extraccion.

## 12. Salidas esperadas

Matriz de extraccion y backlog de slices tecnicos futuros.

## 13. Reglas de negocio aplicables

- No mergear rama completa si mezcla riesgos.
- No cherry-pick de commits grandes sin separar hallazgos.
- Codigo viejo puede convertirse en concepto a rehacer.
- Cambios sin mejora verificable se descartan.

## 14. Validaciones

- Cada hallazgo tiene clasificacion.
- Cada riesgo indica tipo: textual, semantico o contrato.
- Cada exclusion tiene motivo.
- Cada extraccion referencia baseline afectado.

## 15. Manejo de errores o edge cases

- Si una rama tiene valor historico pero codigo obsoleto, clasificar como concepto.
- Si un archivo ya existe en `origin/main` con contenido distinto, marcar conflicto de contrato.
- Si falta evidencia, marcar revision manual con dato faltante.

## 16. Criterios de aceptacion

- `feature/QUIVER-46-49-cli-modernization` no queda como merge completo.
- Cada cambio candidato tiene decision concreta.
- Package/version queda fuera salvo slice dedicado.
- No hay hallazgos marcados utiles sin validacion o pregunta abierta.
- La matriz permite planificar slices tecnicos pequenos.

## 17. Dependencias tecnicas, funcionales o externas

Git read-only y baseline aprobado.

## 18. Depende de slices

`03-slice`.

## 19. Riesgos / decisiones abiertas

La clasificacion puede requerir conocimiento funcional de comandos.

## 20. Pendientes / preguntas abiertas

Definir si se revisaran primero todas las ramas conflictivas o solo `QUIVER-46-49`.
