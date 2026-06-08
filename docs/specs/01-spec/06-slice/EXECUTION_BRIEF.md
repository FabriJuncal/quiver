# EXECUTION_BRIEF - 06-slice

## Objetivo

Planificar extraccion de comandos/wrappers por unidad independiente.

## Base segura

`origin/main` con baseline, contrato y matriz aprobados.

## Archivos candidatos

Archivos de comando especificos autorizados por la matriz.

## Archivos excluidos

Parser global salvo dependencia aprobada, package files y version/release files.

## Funcionalidad existente afectada

Solo comandos listados explicitamente en la matriz del slice.

## Matriz antes/despues

Obligatoria por comando: flags, aliases, help, JSON, exit code, stdout/stderr, side effects.

## Validaciones

- Un comando por unidad de implementacion futura.
- Mejora verificable.
- No se pierden aliases/flags.

## Riesgos

Duplicar comandos existentes o cambiar UX sin evidencia.

## Rollback

Revertir comando afectado y validar baseline de ese comando.
