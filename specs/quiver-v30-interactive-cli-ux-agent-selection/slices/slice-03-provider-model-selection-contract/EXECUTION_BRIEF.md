# EXECUTION_BRIEF - slice-03 Provider model selection contract

## Context

The UX must not show `GPT 5.5` or `OPUS 4.7` as selected if the real provider command cannot receive or enforce that model choice.

## Objective

Make provider/model selection honest, testable, and safe.

## Scope

- Provider adapter metadata for model support.
- Model argument construction where supported.
- Live-mode blocking for unsupported model selection.
- Dry-run visibility for provider/profile/model behavior.
- Tests around provider invocations and unsupported combinations.

## Acceptance Criteria

- Selected models affect real provider invocation when supported.
- Unsupported model selection blocks live execution with next steps.
- Prompt-only and dry-run flows stay provider-auth-free where applicable.
- Existing provider usage without model remains compatible.

## Plan tecnico resumido

Extend provider definitions with model support metadata and validate selected profiles before spawning provider CLIs.

## Suggested Steps

1. Inspect provider CLI capabilities already assumed by Quiver.
2. Add adapter metadata and model arg builder.
3. Wire selected profiles into provider invocation.
4. Add blocking error for unsupported model selection.
5. Add tests for supported, unsupported, dry-run, and prompt-only paths.

## Restrictions

- Do not add credentials or secret storage.
- Do not add unsupported providers.
- Do not silently ignore configured models in live mode.

## Risks

- Provider CLI model flags can differ by installed version.
- Over-blocking can frustrate users if a provider supports model selection through config but not CLI flags.

## Completion Checklist

- [ ] Provider metadata implemented.
- [ ] Model invocation tests pass.
- [ ] Unsupported model blocking tested.
- [ ] Docs explain provider/model limits.
