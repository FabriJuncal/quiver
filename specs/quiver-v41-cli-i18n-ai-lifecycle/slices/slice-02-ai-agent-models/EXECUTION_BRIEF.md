# EXECUTION_BRIEF - slice-02 AI agents and models

## Context

Agent/model commands mix human labels with technical provider/model identifiers.

## Objective

Localize `ai agent set`, `ai agent doctor`, `ai agent repair`, and `ai models list`.

## Acceptance Criteria

- Human labels render in `en` and `es`.
- Provider names, model ids, and custom model ids remain exact.
- `--json` output remains stable.
- Interactive selectors localize prompts and choices without changing stored values.

## Completion Checklist

- [ ] Agent/model messages cataloged.
- [ ] Selector prompts tested.
- [ ] Stored profile regression tests preserved.
