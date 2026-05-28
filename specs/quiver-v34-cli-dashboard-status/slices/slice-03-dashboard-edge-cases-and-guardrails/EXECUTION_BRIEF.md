# EXECUTION_BRIEF - slice-03 Dashboard edge cases and guardrails

## Context

The dashboard command exists after slice-02. This slice prevents partial-fix behavior in states that real projects hit frequently: old layouts, missing specs, invalid graphs, and sensitive evidence.

## Objective

Make dashboard output trustworthy and resilient across edge cases.

## Scope

- dashboard report helpers
- dashboard command formatting/error handling
- focused fixture tests

## Acceptance Criteria

- Missing explicit `--spec` fails actionably.
- Invalid graph state does not crash the whole dashboard.
- No specs/no slices still produce useful next steps.
- Legacy/incomplete layouts show migration guidance.
- Evidence/log contents are not printed.
- JSON and human modes stay separate and clean.
- No-color/CI/no-TTY behavior is readable and prompt-free.

## Technical Plan Summary

Add guardrails and tests around the report/command layers without changing workflow semantics or slice graph internals.

## Suggested Steps

1. Add missing-spec validation.
2. Add graph-error fallback tests.
3. Add no-spec/no-slice fixture tests.
4. Add legacy/incomplete layout fixture tests.
5. Add evidence/log redaction tests.
6. Add no-color/CI/no-TTY tests.

## Restrictions

- Do not alter persisted project state.
- Do not relax existing graph validation semantics outside dashboard fallback behavior.
- Do not print raw evidence values.

## Risks

- Over-hardening the dashboard can diverge from `ai export`; keep source-of-truth alignment explicit.

## Completion Checklist

- [ ] Edge-case tests pass.
- [ ] JSON remains parseable.
- [ ] Sensitive summaries remain bounded.
