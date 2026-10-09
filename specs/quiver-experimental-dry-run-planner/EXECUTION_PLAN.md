# Experimental Planner Execution Plan

1. Validate and operationally review slice-00-planning-contract
2. Publish its documentation-only commit as a draft PR
3. Implement slice-01-headless-planner on a dependent branch
4. Run focused adversarial tests and full existing tests, spec, docs, and package gates
5. Obtain independent implementation review and resolve findings
6. Publish only reviewed files in a separate dependent draft PR
7. Monitor checks for the exact remote commit to a terminal result

No automated merge or deployment. The dependency is documentary operational
review; the older v58 spec's particular human-merge gate is not imported here.


## Extensión Development

1. Revisar operacionalmente el contrato DP-01 a DP-12 y documentar slice-02
2. Revalidar PR #148/main y congelar base; preservar checkouts anteriores
3. Reutilizar helpers puros dentro de dry-run.js sin refactorizar planDryRun
4. Implementar parser acotado, API, pruebas adversariales y ejemplo sintético
5. Verificar guía española, tests, gates y revisión independiente sin edición concurrente
6. Crear un commit y PR draft dependiente; comprobar CI para el SHA exacto

Base verificada el 2026-10-07: #148 draft abierto en
`569a6690649237a6b9b71b711a8dbfa4d1907d22`; main en
`ea95409f151310f7496d99cefa2ffd9a72dd515f`. Sin merge ni deploy.
