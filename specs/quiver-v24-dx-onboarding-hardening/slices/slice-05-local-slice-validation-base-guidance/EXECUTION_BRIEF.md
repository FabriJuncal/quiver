# EXECUTION BRIEF - slice-05: Local slice validation and base branch guidance

## Contexto

`check-slice` currently assumes a remote/base branch and can fail in a brand-new local repo with a misleading `origin/develop` message.

## Objetivo

Allow local structural validation while preserving stricter PR/base validation.

## Alcance

- `check-slice --local`.
- Base/remote guidance.
- Omitted-checks reporting.
- Tests for local repos and remote-less repos.

## Criterios de aceptación

- Local mode passes without remote when slice structure is valid.
- Local output lists omitted remote/base checks.
- Normal mode recommends recovery steps when remote/base is missing.

## Plan técnico resumido

Split readiness checks into local structural checks and remote/base checks. Route `--local` through the structural subset.

## Pasos sugeridos de ejecución

1. Identify readiness checks that require Git remote/base.
2. Add local-mode option.
3. Add output section for omitted validations.
4. Add explicit base guidance.
5. Test both modes.

## Restricciones

- Do not weaken default PR readiness checks.
- Do not assume `develop` when `main` is the only local base.

## Riesgos

- Users may confuse local readiness with PR readiness; output must distinguish them.

## Checklist de finalización

- [ ] Local mode test.
- [ ] Missing remote guidance test.
- [ ] Existing default behavior test.
