# EXECUTION BRIEF - slice-01: Init profiles and dry-run planner

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-01-init-profiles-dry-run
**Tipo:** feature

## Contexto

Antes de cambiar archivos generados, Quiver necesita una superficie explicita para init y un plan testeable que permita previews seguros.

## Objetivo

Agregar el comando `init`, perfiles de generacion y `--dry-run` sin cambiar todavia la escritura real.

## Alcance

- Parser CLI.
- Alias compatible `npx create-quiver --name`.
- Nuevo modulo puro para calcular operaciones de layout.
- Tests del parser y del planner.

## Criterios de aceptacion

- `init --dry-run` no escribe archivos.
- `--name` sigue funcionando como alias.
- Flags invalidos fallan antes de escribir.
- El planner devuelve operaciones estructuradas.

## Plan tecnico resumido

Agregar `init` a `parseArgs`, normalizar flags en un objeto de perfil y crear `lib/init-layout.js` con funciones puras. Conectar dry-run para imprimir el plan y salir.

## Pasos sugeridos de ejecucion

1. Agregar `init` a comandos soportados.
2. Parsear flags de perfil.
3. Implementar validacion de combinaciones.
4. Implementar layout planner sin I/O.
5. Conectar `--dry-run`.
6. Agregar tests unitarios y CLI.

## Restricciones

- No cambiar todavia el set de archivos generado por init normal.
- No mover templates.
- No tocar docs salvo status/evidence del slice.

## Riesgos

- Romper compatibilidad del comando historico.
- Duplicar logica entre parser y planner.
- Hacer dry-run parcial que igual escriba algo.

## Checklist de finalizacion

- [ ] Tests del parser pasan.
- [ ] Tests del planner pasan.
- [ ] Dry-run deja `git status` limpio en fixture.
- [ ] Comandos existentes siguen funcionando.
