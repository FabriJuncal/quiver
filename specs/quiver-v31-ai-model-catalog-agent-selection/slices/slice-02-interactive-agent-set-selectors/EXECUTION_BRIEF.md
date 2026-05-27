# EXECUTION_BRIEF - slice-02 Interactive agent set provider and model selectors

## Context

Agent setup currently requires users to know provider ids and exact model ids. v30 added selector primitives; v31 uses them to guide agent model setup.

## Objective

Make `ai agent set <role>` interactive in TTY mode when provider/model data is missing.

## Scope

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/cli/selectors.js`
- `src/create-quiver/lib/agent-profiles.js`
- related tests

## Acceptance Criteria

- TTY setup shows provider and model selectors.
- No-TTY/CI without required flags fails clearly.
- Existing profiles are summarized before changes.
- Users can update current, create new, change default, or cancel.
- Custom model flow collects technical id and display name.
- Cancellation writes no files.

## Technical Plan Summary

Reuse catalog helpers from slice-01 and selector helpers from v30. Keep prompt logic injectable for tests.

## Suggested Steps

1. Add a resolver for interactive agent setup options.
2. Add provider selector with CLI install status.
3. Add model selector ordered by role recommendations.
4. Add summary before writes.
5. Add no-TTY guardrails.
6. Add tests for TTY, no-TTY, cancellation, and custom.

## Restrictions

- Do not implement agent doctor/repair here.
- Do not force live validation.
- Do not break scripted `--provider --model` usage.

## Risks

- Interactive tests can be brittle if logic is not separated from rendering.
- Existing profile overwrite must be explicit.

## Completion Checklist

- [ ] TTY flow implemented.
- [ ] No-TTY safety tested.
- [ ] Existing profile flow tested.
- [ ] Custom model flow tested.
