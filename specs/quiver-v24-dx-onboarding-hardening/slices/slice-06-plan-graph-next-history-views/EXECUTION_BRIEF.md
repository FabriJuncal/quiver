# EXECUTION BRIEF - slice-06: Historical plan, graph, and next views

## Contexto

Completed demo specs currently produce "No pending slices found", which is accurate but not useful for explaining or auditing a completed flow.

## Objetivo

Add historical view flags while keeping normal work-planning behavior unchanged.

## Alcance

- `--include-completed` flag handling.
- Human and JSON output updates.
- Status semantics for history views.
- Consistent `--spec <slug>` filtering across plan, graph, and next.
- Ticket propagation in planning output.
- Tests for plan, graph, and next.

## Criterios de aceptación

- Defaults remain pending-only.
- Completed slices can be displayed explicitly.
- JSON remains parseable.
- `next` does not accidentally suggest completed work as actionable.
- `--spec` filters do not leak slices from other specs.
- Tickets from `slice.json` appear in plan output.

## Plan técnico resumido

Extend slice selection options rather than changing the graph library's default filtering semantics.

## Pasos sugeridos de ejecución

1. Add CLI option parsing.
2. Extend plan collection filters.
3. Reuse or pass options into graph/next.
4. Update formatters and JSON.
5. Add tests for defaults and history mode.

## Restricciones

- Do not break existing `--only-ready`, `--all-ready`, `--format`, or `--json`.

## Riesgos

- Status terminology can confuse users; label history output clearly.

## Checklist de finalización

- [ ] Default behavior tests pass.
- [ ] History mode tests pass.
- [ ] JSON output tests pass.
