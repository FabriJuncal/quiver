# 08-slice - Limpieza controlada de ramas

## 1. Nombre del slice

Limpieza controlada de ramas.

## 2. Objetivo del slice

Proponer cierre o eliminacion de ramas solo cuando exista evidencia y aprobacion explicita.

## 3. Problema puntual que resuelve

Evita borrar ramas utiles, protegidas, historicas o con PRs abiertos por una clasificacion incompleta.

## 4. Valor observable que entrega

Lista final de acciones sugeridas por rama, con aprobacion requerida y sin ejecutar ninguna accion.

## 5. Alcance especifico

Plan documental de limpieza. No elimina ramas.

## 6. Que incluye

- Clasificacion final de ramas.
- Distincion local/remota/protegida/historica.
- Dependencias con extracciones pendientes.
- Recomendacion: mantener, cerrar, eliminar con aprobacion, revisar.
- Comandos seguros sugeridos.

## 7. Que no incluye

- Ejecutar delete local/remoto.
- Cerrar PRs.
- Push.
- Cambiar protecciones.

## 8. Actores involucrados

Maintainer, Tech Lead y usuario aprobador.

## 9. Precondiciones

Slices de extraccion completados o decision explicita de no extraer mas valor.

## 10. Entradas necesarias

Inventario de ramas, matriz de extraccion, decisiones de cierre y aprobaciones.

## 11. Flujo operativo paso a paso

1. Revisar ramas sin delta.
2. Revisar ramas usadas como fuente de extraccion.
3. Marcar protegidas/historicas/no tocar.
4. Verificar freshness remota antes de accion final.
5. Agrupar recomendaciones.
6. Pedir aprobacion explicita antes de eliminar.

## 12. Salidas esperadas

Plan de limpieza con acciones pendientes de aprobacion.

## 13. Reglas de negocio aplicables

- No eliminar sin aprobacion explicita.
- `cerrar` y `eliminar` son acciones distintas.
- Ramas historicas/protegidas se conservan salvo decision explicita.
- Ramas fuente se conservan hasta cerrar extracciones.

## 14. Validaciones

- Cada rama tiene accion propuesta y motivo.
- Cada eliminacion requiere aprobacion.
- Local/remota/protegida/historica estan diferenciadas.
- No quedan extracciones pendientes antes de limpiar fuente.

## 15. Manejo de errores o edge cases

- Si hay PR abierto, marcar revision manual.
- Si rama remota no existe, registrar stale ref.
- Si rama es backup, confirmar si se conserva como historica.

## 16. Criterios de aceptacion

- No se ejecuta ninguna eliminacion.
- Toda accion destructiva queda como pendiente de aprobacion.
- Ramas usadas como fuente no se eliminan prematuramente.
- Estados `sin delta`, `cerrable` y `eliminable` no se mezclan.
- El plan incluye comandos seguros sugeridos.

## 17. Dependencias tecnicas, funcionales o externas

Inventario actualizado y decisiones de extraccion.

## 18. Depende de slices

`01-slice` y `04-slice`; idealmente despues de `05-slice` y `06-slice`.

## 19. Riesgos / decisiones abiertas

Puede requerir verificacion remota o politica externa de proteccion de ramas.

## 20. Pendientes / preguntas abiertas

Definir si la aprobacion sera por rama o por grupo de ramas claramente listado.
