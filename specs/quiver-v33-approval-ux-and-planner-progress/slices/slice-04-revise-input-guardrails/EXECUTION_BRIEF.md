# EXECUTION_BRIEF - slice-04 Revise input guardrails

## Context

The requirement explicitly called out incomplete `ai revise --phase technical-plan --input` usage and an accidental trailing `s`. Production review expanded the scope to acceptance revise as well.

## Objective

Make invalid `ai revise --input` usage fail clearly before provider execution for both planner phases.

## Scope

- CLI argument parsing if needed.
- `runRevise` / `runPlan` input validation.
- focused command tests.

## Acceptance Criteria

- Missing `--input` value is detected for acceptance and technical-plan.
- Nonexistent feedback files fail before provider execution.
- Accidental extra arguments are reported or rejected clearly.
- No-TTY/CI never prompts.
- Valid revise commands remain unchanged.

## Technical Plan Summary

Add explicit guardrails at the parser/command boundary, then test command-level behavior with provider execution disabled or asserted absent.

## Suggested Steps

1. Inspect parse behavior for `--input` without value.
2. Add a consistent actionable error.
3. Add nonexistent-file regression coverage.
4. Add accidental extra-arg coverage if parser supports it.
5. Confirm valid revise flows still pass.

## Restrictions

- Do not run a provider when input is invalid.
- Do not auto-create feedback files.

## Risks

- Parser changes can affect other commands that use `--input`.

## Completion Checklist

- [ ] Missing input covered for both phases.
- [ ] Nonexistent input covered.
- [ ] Extra argument behavior covered.
- [ ] Valid revise flow still passes.
