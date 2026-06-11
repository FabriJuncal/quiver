# EXECUTION_BRIEF - slice-08 structural map hardening

## Context

After reliability is stable, context quality can improve by giving the provider a deterministic structural map. This should reduce drift and tokens without adding risky full-language parsing.

## Objective

Add a bounded, generic structural map to analyze-project context.

## Scope

- Imports/exports where cheaply detectable.
- Routes and entrypoints.
- Components and contexts.
- Configs and scripts.
- Prompt integration.
- Dry-run JSON reporting.

## Acceptance Criteria

- Dry-run reports structural map metadata.
- Provider prompt includes compact structural map context.
- Unknown stacks still work.
- Extraction failures do not block analysis.
- Unsafe paths remain excluded.

## Expected Files To Modify

- `src/create-quiver/lib/ai/analyze-project-discovery.js`
- `src/create-quiver/lib/ai/analyze-project-sampling.js`
- `src/create-quiver/lib/ai/analyze-project-prompts.js`
- analyze-project tests/fixtures

## Validations Required

- `node --test tests/commands/ai-analyze-project.test.js`
- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `npm run smoke:create-quiver`
- `git diff --check`

## Risks

- Structural extraction can become overengineered.
- Regex-based parsing can misclassify files.
- Extra context can increase token usage if not bounded.

## Dependencies

- Depends on `slice-07-semantic-validation-docs`.

## Instructions For Executor

1. Keep extraction best-effort and bounded.
2. Prefer generic signals over framework-specific assumptions.
3. Do not change repair/retry behavior in this slice.

## Completion Checklist

- [ ] Structural map generated.
- [ ] Prompt integration tested.
- [ ] Dry-run output updated.
- [ ] Closure brief updated.

## Conditions Of Closure

- Analyze-project has better deterministic context without weakening reliability or safety.
