# EXECUTION_BRIEF - slice-03 Agent profile doctor and repair dry-run

## Context

Projects can already have misconfigured profiles. New selectors only help future setup, so existing profiles need diagnostics and safe repair previews.

## Objective

Add `ai agent doctor` and `ai agent repair --dry-run`.

## Scope

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/agent-profiles.js`
- `src/create-quiver/lib/ai/model-catalog.js`
- related tests

## Acceptance Criteria

- Doctor evaluates all profiles and identifies defaults.
- Findings use `error`, `warning`, and `info`.
- Unsupported providers are errors.
- Custom unvalidated models are warnings.
- Display aliases stored in `model` are detected.
- Repair dry-run shows before/after changes without writes.
- Human output uses `Checks` and `Suggested fixes`; JSON is clean.

## Technical Plan Summary

Build profile diagnostics as pure data first, then render human/JSON outputs from that shared report.

## Suggested Steps

1. Add profile issue classifier.
2. Add doctor report builder.
3. Add human and JSON renderers.
4. Add repair proposal builder.
5. Wire commands.
6. Add fixture tests for legacy bad profiles.

## Restrictions

- Do not auto-write repairs by default.
- Do not install provider CLIs.
- Do not mark catalog models as available without live validation.

## Risks

- Doctor can become noisy if severities are weak.
- Repair must preserve legitimate custom values.

## Completion Checklist

- [ ] Doctor command implemented.
- [ ] Repair dry-run implemented.
- [ ] JSON outputs tested.
- [ ] Legacy bad-profile fixture tested.
