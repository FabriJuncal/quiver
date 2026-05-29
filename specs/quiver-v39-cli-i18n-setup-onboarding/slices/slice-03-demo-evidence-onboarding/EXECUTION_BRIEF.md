# EXECUTION_BRIEF - slice-03 Demo, evidence, and onboarding messages

## Context

Remaining onboarding surfaces should not leave users with mixed-language setup feedback.

## Objective

Localize demo, evidence, and onboarding helper outputs that are human-facing CLI messages.

## Acceptance Criteria

- Human-facing demo/onboarding messages render in `en` and `es`.
- Generated artifact contents are changed only when they are explicitly command output templates.
- Suggested commands remain exact.
- Tests cover both configured language and `--lang` override.

## Completion Checklist

- [ ] Human-facing onboarding strings cataloged.
- [ ] Tests added or updated.
- [ ] Generated artifacts left for v42 unless explicitly in scope.
