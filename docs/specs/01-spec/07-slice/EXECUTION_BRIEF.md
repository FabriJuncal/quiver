# EXECUTION_BRIEF - 07-slice

## Objetivo

Definir evidencia minima para que docs, tests y CLI no diverjan.

## Base segura

Usar baseline y contrato aprobados.

## Archivos candidatos

Documentos de checklist/evidencia dentro del spec.

## Archivos excluidos

Tests reales, docs reales generadas y codigo fuente.

## Funcionalidad existente afectada

Ninguna durante este slice.

## Matriz antes/despues

Debe requerirse en implementaciones futuras que cambien comandos o docs.

## Validaciones

- Evidencia minima por tipo de cambio.
- Cobertura equivalente si se reemplazan tests.
- Gate CLI/docs.

## Riesgos

Falsa seguridad si se registran validaciones pendientes como exitos.

## Rollback

Corregir el contrato de evidencia antes de autorizar implementacion.
