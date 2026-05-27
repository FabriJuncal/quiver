# EXECUTION_BRIEF - slice-04 Shared model preflight and provider error extraction

## Context

The real dogfooding failure surfaced as `provider run failed` even though Codex emitted a useful invalid-model error. Live AI commands need shared preflight and better error extraction.

## Objective

Apply model resolution before live provider execution and surface actionable provider errors.

## Scope

- `src/create-quiver/lib/ai/providers.js`
- `src/create-quiver/lib/ai/executor.js`
- `src/create-quiver/lib/ai/execution-plan.js`
- `src/create-quiver/commands/ai.js`
- related tests

## Acceptance Criteria

- Live commands block before provider execution for known bad display aliases.
- CLI `--model "GPT 5.5"` is normalized or blocked with guidance.
- Dry-runs show the real command and technical model id.
- Invalid model errors are prioritized over secondary MCP/tool noise.
- Secrets are redacted from provider errors.

## Technical Plan Summary

Create one shared provider/model resolution path and one provider-error extraction path, then adopt them across planner, reviewer, executor, and execution-plan flows.

## Suggested Steps

1. Add shared model preflight helper.
2. Add provider error extractor.
3. Adopt helper in planner/reviewer commands.
4. Adopt helper in executor/execution-plan flows.
5. Add tests with fake provider output.

## Restrictions

- Do not require real provider auth in tests.
- Do not change provider prompt content except for validation/preflight.
- Do not remove custom model support.

## Risks

- Over-eager blocking can prevent legitimate custom models.
- Provider stderr formats can change.

## Completion Checklist

- [ ] Shared preflight implemented.
- [ ] Provider error extraction implemented.
- [ ] Planner and executor paths adopted.
- [ ] Regression test covers `GPT 5.5`.
