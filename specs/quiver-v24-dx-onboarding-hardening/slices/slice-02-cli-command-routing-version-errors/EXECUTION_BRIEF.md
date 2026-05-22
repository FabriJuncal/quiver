# EXECUTION BRIEF - slice-02: CLI command routing and version mismatch errors

## Contexto

During dogfooding, a modern command executed through an older installed package was interpreted as a project name. This is high-friction because it makes `prepare` look like an init request.

## Objetivo

Make command routing fail safe and make version/script mismatches understandable.

## Alcance

- Unknown subcommand handling.
- Legacy `--name` alias preservation.
- Version/script mismatch diagnostics in doctor/flow where appropriate.
- Tests for ambiguous commands.

## Criterios de aceptación

- Unknown subcommands fail clearly.
- Modern command names are not treated as project names.
- Legacy `--name` remains valid.
- Diagnostics suggest update/help actions.

## Plan técnico resumido

Tighten argument parsing and add tests around command mode resolution. Prefer small helpers over parser rewrites.

## Pasos sugeridos de ejecución

1. Locate command mode parsing.
2. Add explicit unknown-command path.
3. Preserve compatibility alias only for no-command plus `--name`.
4. Add mismatch diagnostics where command surfaces are checked.
5. Test success and failure cases.

## Restricciones

- Do not remove supported commands.
- Do not require network access to detect version mismatch.

## Riesgos

- Parser changes can regress documented examples.

## Checklist de finalización

- [ ] Parser tests added.
- [ ] Legacy alias tested.
- [ ] Error copy reviewed.
