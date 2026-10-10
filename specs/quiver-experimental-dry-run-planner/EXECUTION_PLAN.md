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


## Slice-03: supervised workspace

1. Pin current main and inspect its new CI, preserving previous checkouts.
2. Read MASTER MultiHarness V3 vision and the v6 plan status.
3. Add an optional bounded IO adapter, keeping Core unchanged.
4. Validate real bytes, exact patch context, host approval and input freshness.
5. Write only a new temporary copy with evidence and explicit verification limits.
6. Run focused adversarial tests and relevant gates; present scope for publication.

MASTER V3 (Library libfile_9bb70c1f7d508191921c402934900fde, opening vision/MVP
sections) prioritizes functional Development plus a second Research harness and
chat-first orchestration, while marking its architecture as a hypothesis. The
repo's PLAN-QUIVER-MASTER-v6.0.22 is a broader initiative roadmap; neither that
plan nor this continuation activates Studio, Cloud or V59. Reuse remains the
existing task/policy/proposal Core and V2's separation of verification/acceptance;
no new OSS runtime is adopted for this bounded file operation.


## Slice-05: controlled Development verification

1. Pin current main 688ae68c69b1a31cb70cee0af85a20fa1f5a80cc in a new branch; PR153 remains unmerged at start and is untouched.
2. Reuse supervised application; bind fixed authored app/tests and host command to review.
3. Prove actual baseline failure, corrected success and incorrect-patch rejection.
4. Exercise stale approval/bytes, cancellation, timeout and original preservation.
5. Run sequential gates, full-suite evidence and independent read-only review.
6. Report local results. Publication requires separate specific authorization.

Existing evidence command was inspected for reuse; it accepts general commands
and is not a closed authored-fixture host. No new general execution capability
or dependency is introduced. Hash-pinned fixtures require LF across checkouts.
