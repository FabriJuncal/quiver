# EXECUTION BRIEF - slice-03: Agent profiles

## Objetivo

Permitir que el usuario guarde perfiles reutilizables para planner, executor, reviewer y researcher.

## Alcance

- Estado local bajo `.quiver/`.
- Comandos para set/list/show.
- Integracion basica con providers existentes.

## Criterios de aceptacion

- Perfiles persistidos sin secretos.
- Provider validado.
- Modelos guardados como etiquetas/configuracion.
- Tests unitarios y CLI.

## Restricciones

- No prometer disponibilidad real de modelos.
- No llamar APIs externas.

## Checklist de finalizacion

- [ ] Estado definido.
- [ ] CLI documentado.
- [ ] Tests pasan.
