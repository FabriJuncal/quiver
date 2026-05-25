# EXECUTION BRIEF - slice-07: Context analysis and doctor flow

## Context

Pixel Quiver showed analyzer stack mistakes, `analyze --dry-run` writes, placeholder-heavy `prepare-context`, stale docs, and doctor examples pointing to the wrong spec. This slice hardens context commands and first-use guidance.

## Objective

Make context analysis and doctor/flow guidance evidence-based, read-only where promised, and accurate.

## Scope

- `analyze`
- project scan
- `ai prepare-context`
- `flow`
- `doctor`
- fixtures and tests

## Acceptance Criteria

- `analyze --dry-run` writes nothing.
- React + Vite detection is correct.
- `prepare-context` is conservative and evidence-based.
- `flow` reports source/staleness.
- `doctor` does not suggest commands for the wrong spec.

## Technical Plan Summary

Improve scan heuristics, dry-run behavior, docs contradiction detection, active context selection, and test fixtures.

## Suggested Execution Steps

1. Inspect analyze/project-scan behavior.
2. Add no-write dry-run guard and tests.
3. Improve stack detection.
4. Improve prepare-context contradiction output.
5. Improve flow/doctor state source and example selection.
6. Add fixtures and evidence.

## Restrictions

- Do not overwrite human-authored docs without snapshots/review.
- Do not execute providers.

## Risks

- Analyzer heuristics can regress other stacks; add representative fixtures.

## Completion Checklist

- [ ] Dry-run no-write test added.
- [ ] React/Vite fixture added.
- [ ] prepare-context evidence behavior covered.
- [ ] flow/doctor guidance covered.
- [ ] Validation commands passed.

