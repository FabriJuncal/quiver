# EXECUTION BRIEF - slice-04: Agent profiles and provider adapters

## Context

Quiver must support different model CLIs without hard-coding one provider or storing credentials.

## Objective

Add provider-agnostic agent profiles and adapter contracts, starting with prompt-only behavior.

## Scope

- Planner, executor, reviewer, and doctor profiles.
- Provider command validation.
- Prompt rendering.
- Structured command result capture.
- Secret redaction for adapter logs.

## Acceptance Criteria

- Profiles store labels and command preferences, not secrets.
- Prompt-only mode works.
- Missing CLI errors are actionable.
- Execution metadata is captured when execution is enabled.

## Technical Plan Summary

Build a small adapter layer around external CLIs with explicit input/output contracts and dry-run-safe behavior.

## Suggested Execution Steps

1. Inspect current agent profile code.
2. Define adapter interface.
3. Implement prompt-only path.
4. Add CLI availability checks.
5. Add structured result capture and redaction.
6. Test with mocked provider commands.

## Restrictions

- Do not require real provider credentials in tests.
- Do not store API keys or tokens.

## Risks

- Provider CLIs differ substantially. Keep the first contract conservative.

## Completion Checklist

- [ ] Profile schema updated.
- [ ] Prompt-only path validated.
- [ ] Missing CLI errors tested.
- [ ] Redaction tested.
- [ ] Evidence appended.
