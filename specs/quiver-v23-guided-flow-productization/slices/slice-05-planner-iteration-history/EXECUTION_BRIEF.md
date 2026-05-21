# EXECUTION BRIEF - slice-05: Planner iteration history

## Objetivo

Guardar versiones de criterios y planes para que el usuario pueda iterar y aprobar una version concreta.

## Alcance

- Estado de drafts y approvals.
- Comandos de listado/status.
- Reglas de bloqueo para fases posteriores.

## Criterios de aceptacion

- Varias iteraciones conviven.
- La aprobacion apunta a una version concreta.
- Las fases usan aprobados por defecto.
- Tests pasan.

## Restricciones

- No crear specs sin plan aprobado.
- No borrar historial sin comando explicito.

## Checklist de finalizacion

- [ ] Historial persistido.
- [ ] Estado mostrado.
- [ ] Tests pasan.
