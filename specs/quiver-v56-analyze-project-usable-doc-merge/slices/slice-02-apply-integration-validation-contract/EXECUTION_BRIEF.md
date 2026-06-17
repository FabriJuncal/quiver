# EXECUTION_BRIEF - slice-02 Apply Integration + Validation Contract

## Context

Slice 02 depends on the Slice 01 merge engine and wires it into every analyze-project write path.

## Objective

Integrate the Slice 01 merge engine across all analyze-project write paths and validation reports.

## Acceptance Criteria

- Live auto-apply and `apply --run` use the same merge logic.
- `--save-proposal` persists merge metadata or final estimated diff.
- `--review` shows final post-merge diff.
- `--json` includes merge strategy/warnings without breaking existing fields.
- `--strict` fails on critical visible placeholders.

## Constraints

- Do not change provider schema.
- Do not widen path allowlist.
- Do not implement final nika-erp smoke here.

## Validation

```bash
node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/ai-analyze-project-docs.test.js tests/lib/ai-analyze-project-validation.test.js
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Completion Checklist

- Live apply and apply --run use the same merge engine.
- JSON reports expose merge metadata without breaking existing fields.
- Strict validation handles critical visible placeholders.
- Review diff reflects final post-merge content.
