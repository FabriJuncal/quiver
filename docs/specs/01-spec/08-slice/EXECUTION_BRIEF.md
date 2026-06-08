# EXECUTION_BRIEF - 08-slice

## Objetivo

Preparar recomendaciones de limpieza sin ejecutar ninguna accion destructiva.

## Base segura

Usar inventario actualizado y decisiones de extraccion cerradas.

## Archivos candidatos

Documentos de plan de limpieza.

## Archivos excluidos

Refs Git, ramas locales/remotas, PRs y configuracion remota.

## Funcionalidad existente afectada

Ninguna durante este slice.

## Matriz antes/despues

No aplica a comportamiento de CLI. Debe existir matriz de estado por rama.

## Validaciones

- Cada rama tiene accion y motivo.
- Eliminaciones requieren aprobacion explicita.
- Fuentes de extraccion no se eliminan antes de cierre.

## Riesgos

Borrar una rama historica, protegida o con PR abierto si no se verifica correctamente.

## Rollback

No ejecutar delete. Si una recomendacion es incorrecta, corregir el plan antes de pedir aprobacion.
