# EXECUTION_BRIEF - slice-02 safe context boundary

## Context

Provider output is not the only untrusted input. Repository content can contain secrets or prompt-injection instructions. Quiver must redact and frame context before sending it to a provider.

## Objective

Add a safe context boundary before provider execution.

## Scope

- Pre-provider redaction.
- Prompt-injection guardrails.
- Selected-context manifest.
- Existing path exclusions and size budgets.
- `--dry-run` no-write preservation.

## Acceptance Criteria

- Secret-like content is redacted before provider execution.
- Repository content is delimited and described as data, not instructions.
- Unsafe paths are still excluded.
- Provider runs save a selected-context manifest.
- `--dry-run` writes 0 files.

## Expected Files To Modify

- `src/create-quiver/lib/ai/analyze-project-discovery.js`
- `src/create-quiver/lib/ai/analyze-project-sampling.js`
- `src/create-quiver/lib/ai/analyze-project-prompts.js`
- `src/create-quiver/lib/ai/safety.js`
- analyze-project tests/fixtures

## Validations Required

- `node --test tests/commands/ai-analyze-project.test.js`
- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `npm run smoke:create-quiver`
- `git diff --check`

## Risks

- Redaction after provider execution is too late.
- Over-redaction can reduce analysis quality.
- Prompt-injection guardrails can be weakened if repo content is interpolated carelessly.

## Dependencies

- Depends on `slice-00-analysis-run-contract`.
- Depends on `slice-01-provider-fixture-harness`.

## Instructions For Executor

1. Keep redaction deterministic and testable.
2. Do not rely on provider obedience for safety.
3. Keep the context manifest free of unredacted secret values.

## Completion Checklist

- [ ] Redaction tests pass.
- [ ] Prompt boundary is explicit.
- [ ] Dry-run no-write behavior is preserved.
- [ ] Closure brief records evidence.

## Conditions Of Closure

- Quiver can prove that selected context is safe before provider execution.
