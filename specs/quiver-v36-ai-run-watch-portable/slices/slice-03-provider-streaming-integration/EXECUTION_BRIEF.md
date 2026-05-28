# EXECUTION_BRIEF - slice-03 Provider streaming integration

## Context

Quiver currently runs providers through adapter code. This slice wires the safe writer into live provider execution without changing dry-run, print-prompt, JSON, CI, or no-TTY behavior.

## Objective

Stream provider stdout/stderr into events/logs for planner-oriented live commands.

## Scope

- Provider runner streaming hooks
- Run creation for live provider execution
- Heartbeat and stage events
- Redacted `prompt.md`
- `result.md` when applicable
- Tests with simulated provider output

## Acceptance Criteria

- Live provider execution creates a run directory and run id.
- Provider stdout/stderr stream to events and redacted logs.
- Heartbeat or updated timestamps keep active runs observable.
- Existing dry-run, print-prompt, JSON, CI, and no-TTY behavior stays clean.
- Provider/model validation behavior is not weakened.

## Technical Plan Summary

Integrate through provider runner options or a narrow wrapper so AI commands do not duplicate streaming logic.

## Restrictions

- Do not implement watcher CLI in this slice.
- Do not add required external terminal tools.

## Completion Checklist

- [ ] Provider streaming hooks added.
- [ ] Planner-oriented live commands produce run artifacts.
- [ ] Simulated streaming tests pass.
