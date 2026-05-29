# EXECUTION_BRIEF - slice-01 Template language routing

## Context

Generated docs need a routing layer that chooses the correct human-language template or fragment.

## Objective

Add template language routing for `en` and `es`.

## Acceptance Criteria

- Routing uses the same language resolution as CLI output.
- Missing localized templates fall back predictably to `en` and are detected by tests.
- Machine artifacts are excluded from localization.
- Template ownership and naming conventions are documented.

## Completion Checklist

- [ ] Routing helper added.
- [ ] Template convention documented.
- [ ] Missing-template tests added.
