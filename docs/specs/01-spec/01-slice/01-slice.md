# 01-slice - Snapshot verificable de ramas

## 1. Nombre del slice

Snapshot verificable de ramas.

## 2. Objetivo del slice

Crear un inventario auditable de ramas locales y remotas con base, SHA, fecha, ahead/behind, frescura del dato y clasificacion inicial.

## 3. Problema puntual que resuelve

Evita tomar decisiones sobre ramas usando informacion incompleta, stale o ambigua.

## 4. Valor observable que entrega

Un reporte de ramas que permite decidir que revisar, extraer, cerrar o conservar sin modificar el repo.

## 5. Alcance especifico

Incluye analisis read-only de refs y clasificacion documental. No ejecuta acciones destructivas.

## 6. Que incluye

- Rama base probable.
- SHA de base y de cada rama.
- Fecha de ultimo commit.
- Autor principal.
- Ahead/behind.
- Tipo local/remota.
- Frescura del snapshot.
- Clasificacion inicial.

## 7. Que no incluye

- Fetch sin aprobacion.
- Merge, rebase, push o delete.
- Implementacion de codigo.
- Limpieza de ramas.

## 8. Actores involucrados

Tech Lead, maintainer, reviewer e implementador futuro.

## 9. Precondiciones

Repositorio Git disponible y refs locales/remotos presentes en el snapshot local.

## 10. Entradas necesarias

Refs de Git, `origin/HEAD`, `origin/main`, logs y metadatos de commits.

## 11. Flujo operativo paso a paso

1. Detectar rama base desde `origin/HEAD` o convenciones conocidas.
2. Listar refs locales y remotos.
3. Calcular SHA, fecha, ahead/behind y merge-base.
4. Identificar si el dato remoto requiere verificacion de frescura.
5. Clasificar cada rama con estado no destructivo.
6. Registrar riesgos y dudas por rama.

## 12. Salidas esperadas

Inventario de ramas con clasificacion y evidencia suficiente para planificar slices posteriores.

## 13. Reglas de negocio aplicables

- `ahead=0` significa sin delta pendiente, no eliminable automaticamente.
- `main` local divergida no es base segura.
- Toda recomendacion de eliminacion queda pendiente de aprobacion.

## 14. Validaciones

- Cada rama tiene SHA, fecha y base probable.
- Cada rama local/remota esta diferenciada.
- Cada estado de limpieza distingue cerrable, eliminable, protegida e historica.

## 15. Manejo de errores o edge cases

- Si no hay `origin/HEAD`, usar candidato documentado y marcar supuesto.
- Si una rama no tiene merge-base, marcar `requiere revision manual`.
- Si refs remotos estan stale, marcar `requiere verificacion remota`.

## 16. Criterios de aceptacion

- Todas las ramas abiertas aparecen en el inventario.
- Ninguna rama se clasifica como eliminable sin condicion de aprobacion.
- El reporte incluye fecha y SHA del snapshot.
- Las ramas con `ahead=0` quedan como `sin delta`, no como borrables.
- Las ramas conflictivas quedan marcadas para analisis posterior.

## 17. Dependencias tecnicas, funcionales o externas

Git local y refs existentes.

## 18. Depende de slices

Ninguno.

## 19. Riesgos / decisiones abiertas

El snapshot puede quedar obsoleto si no se actualizan refs remotos.

## 20. Pendientes / preguntas abiertas

Definir si se autorizara `fetch` antes de tomar decisiones remotas finales.
