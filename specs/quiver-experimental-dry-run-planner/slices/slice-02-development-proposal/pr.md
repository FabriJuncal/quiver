## Title

Propuestas Development revisables sin ejecución

## Summary

Preparar parches aportados como objetos revisables mediante el controlador puro.

## PR Policy

Un slice, un commit, un PR draft dependiente de la rama experimental de #148.

## Scope

Los trece archivos exactos del [contrato](slice.json).

## Files

Una extensión del módulo, pruebas nuevas, ejemplo JSON, guía española,
changelog y documentos del slice y spec.

## How to Test (DETAILED - REQUIRED)

Ejecutar los comandos enumerados en slice.json contra el candidato congelado.

## Evidence

Ver [evidencia](../../EVIDENCE_REPORT.md). Suite completa: 1.244 aprobadas,
cero fallos/skips. Focalizadas: 277 aprobadas (139 nuevas). Revisión independiente
sin bloqueantes: 500 planes equivalentes a la base, 2.000 parches válidos y
2.000 variantes rechazadas, probes de proxies y aliases. Gates documentales,
schema, alcance exacto y package/CLI smoke correctos. CI remoto se comprobará
para el commit exacto; no se anticipa su resultado.

## Rollback

Revertir el commit aditivo del slice; no existe persistencia que migrar.

## Risks / Notes

La estructura del parche se valida; su aplicabilidad real no se comprueba.
No hay after_sha256, ejecución, aceptación humana, merge, release ni deploy.
