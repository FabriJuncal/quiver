# EXECUTION_BRIEF - slice-04 UX flag matrix and compatibility guardrails

## Context

Quiver needs standard UX flags without making every command accept every flag.

## Objective

Centralize and enforce command support for `--with-planner`, `--interactive`, and `--review`.

## Scope

- Add a command/flag matrix.
- Add parser validation for UX flags.
- Add incompatible-combination errors.
- Add tests for CI/no-TTY/JSON behavior.

## Acceptance Criteria

- Unsupported flags fail before side effects.
- Supported flags are discoverable in help/docs.
- Machine modes are never decorated.

## Suggested Steps

1. Add central flag support matrix.
2. Extend arg parsing for new flags.
3. Validate unsupported and incompatible combinations early.
4. Add command contract tests.
5. Confirm existing commands keep passing.

## Restrictions

- Do not implement planner proposal writes here.
- Do not add prompts to commands in this slice.

## Risks

- Over-strict validation can break existing scripts if flags were previously ignored. Make errors clear and only reject new UX flags.

## Completion Checklist

- [ ] Matrix exists in code.
- [ ] Matrix is tested.
- [ ] CI/no-TTY/JSON behavior is protected.
- [ ] Unsupported flags produce actionable output.
