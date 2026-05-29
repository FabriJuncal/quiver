# EXECUTION_BRIEF - slice-03 AI planner, approvals, and review

## Context

Planner commands are provider-backed and use review/approval gates. Quiver wrapper messages can be localized, but provider prompts and generated drafts remain stable unless explicitly changed.

## Objective

Localize `ai plan`, `ai revise`, `ai review-plan`, `ai repair-plan`, `ai approve`, and approval status surfaces.

## Acceptance Criteria

- Human wrapper output supports `en` and `es`.
- Provider prompt text printed by `--print-prompt` remains exact.
- Approval candidates, review summaries, and blocking messages are localized.
- Draft paths, phase names, version ids, and commands remain exact.
- JSON/status artifacts remain stable.

## Completion Checklist

- [ ] Planner wrapper strings cataloged.
- [ ] Approval/review strings cataloged.
- [ ] `--print-prompt` regression tests preserved.
