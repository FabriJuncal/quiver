# CLOSURE BRIEF - slice-06: Production plan review

## Resumen de lo realizado

Se agrego la fase `ai review-plan` para revisar el draft del plan tecnico antes de aprobarlo y antes de generar specs. El review usa el perfil `reviewer`, imprime metadata en dry-run, persiste el resultado en `.quiver/approvals/plan-review/` y bloquea la generacion de spec si el plan tecnico no esta revisado y aprobado.

## Validacion contra criterios de aceptacion

- [x] Review generado.
- [x] Review persistido.
- [x] Bloqueos aplicados.
- [x] Tests pasan.

## Cambios relevantes

- Nuevo modulo `src/create-quiver/lib/ai/plan-review.js`.
- Nuevo subcomando `npx create-quiver ai review-plan`.
- `flow` ahora guia al usuario a revisar el plan tecnico antes de aprobarlo.
- `ai approvals` muestra el estado `plan-review`.
- La generacion de spec exige plan tecnico revisado y aprobado.
- README, templates, generated docs y smokes quedaron alineados con el nuevo paso.

## Pendientes

- La UX futura podria simplificar `--version <n>` para el plan tecnico revisado, pero no bloquea este slice.

## Riesgos remanentes

- El comando usa CLIs locales de proveedores; en automatizacion se debe seguir usando `--dry-run` o mocks para evitar llamadas pagas.

## Recomendaciones futuras

- En `slice-07`, hacer que la experiencia de creacion de spec explique claramente que la entrada valida es el plan tecnico revisado y aprobado.
