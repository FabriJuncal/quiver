# EXECUTION BRIEF - slice-06: Production plan review

## Objetivo

Formalizar el prompt de revision del plan como una fase antes de crear specs.

## Alcance

- Nuevo comando o fase de review.
- Prompt mantenido por Quiver.
- Persistencia de resultado.
- Bloqueo opcional/obligatorio para spec creation.

## Criterios de aceptacion

- Detecta supuestos fragiles, huecos, ambiguedades y riesgos.
- No cuestiona el alcance aprobado.
- No modifica codigo.
- Tests pasan.

## Restricciones

- No implementar fixes.
- No abrir nuevas preguntas si la ambiguedad no bloquea; documentar supuestos.

## Checklist de finalizacion

- [ ] Review command probado.
- [ ] Estado persistido.
- [ ] Tests pasan.
