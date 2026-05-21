# EXECUTION BRIEF - slice-01: Short command and flow entrypoint

## Contexto

Quiver actualmente se ejecuta como `npx create-quiver`. El objetivo de producto es que el usuario pueda pensar en `quiver` como la experiencia principal sin romper compatibilidad.

## Objetivo

Crear la superficie inicial de comando corto y flujo guiado.

## Alcance

- Revisar `package.json` y `bin/`.
- Agregar o documentar el alias `quiver`.
- Agregar entrypoint inicial de `flow`.
- Actualizar docs y tests.

## Criterios de aceptacion

- `create-quiver` sigue funcionando.
- La decision sobre `quiver` queda documentada.
- El nuevo entrypoint no llama proveedores ni escribe estado inesperado.
- Tests y `git diff --check` pasan.

## Restricciones

- No implementar perfiles de agentes.
- No introducir breaking changes.

## Checklist de finalizacion

- [ ] Comando probado.
- [ ] Docs actualizadas.
- [ ] Tests actualizados.
- [ ] Evidencia registrada.
