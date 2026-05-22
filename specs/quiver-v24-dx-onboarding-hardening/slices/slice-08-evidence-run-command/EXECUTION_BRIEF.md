# EXECUTION BRIEF - slice-08: Evidence run command

## Contexto

Evidence was captured manually during dogfooding. Quiver should help record validation evidence in a repeatable way while preserving failures.

## Objetivo

Add a small evidence runner for command execution summaries.

## Alcance

- `evidence run -- <command>` command.
- Evidence formatting and output target.
- Exit code preservation.
- Output truncation and basic redaction.
- Tests and docs.

## Criterios de aceptación

- Success and failure are recorded.
- Failure exits non-zero.
- Long output is truncated.
- Common secrets are redacted.

## Plan técnico resumido

Implement a command wrapper around child process execution with structured evidence rendering and safe output limits.

## Pasos sugeridos de ejecución

1. Add evidence command routing.
2. Add library for command execution/evidence formatting.
3. Implement redaction/truncation.
4. Write command and library tests.
5. Update command docs.

## Restricciones

- Do not upload evidence.
- Do not claim complete secret scanning.

## Riesgos

- Redaction is best effort. Docs must say users remain responsible for reviewing output.

## Checklist de finalización

- [ ] Success test.
- [ ] Failure test.
- [ ] Redaction test.
- [ ] Docs updated.
