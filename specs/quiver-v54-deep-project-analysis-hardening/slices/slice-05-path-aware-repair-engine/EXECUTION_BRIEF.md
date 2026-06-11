# EXECUTION_BRIEF - slice-05 path-aware repair engine

## Context

Codex returned useful but schema-invalid fields such as `claim`, `notes`, and `confidence`. Repair must be strictly structural, path-aware, and auditable.

## Objective

Implement a closed repair table for safe provider schema drift.

## Scope

- Remove unsupported `notes`.
- Remove unsupported `confidence`.
- Rename `claim` to `name` only when the path expects a human label, `name` is missing, and `claim` is a safe non-empty string.
- Reject conflicts and unsafe transforms.
- Add max total and per-path-family repair thresholds.
- Record every repair in manifest.

## Acceptance Criteria

- Repairs are allowed only by explicit path/type/action table.
- Conflicting `name` and `claim` does not repair.
- Non-string or empty `claim` does not repair.
- Threshold overflow fails closed.
- Repair manifest lists path, action, source key, destination key when applicable, redacted summary, and reason.
- Repaired output is revalidated.

## Completion Checklist

- [ ] Closed repair table implemented.
- [ ] Repair thresholds implemented.
- [ ] Tests cover allowed, denied, conflict, and threshold cases.
- [ ] Closure brief records chosen thresholds.

## Expected Files To Modify

- `src/create-quiver/lib/ai/analyze-project-repair.js`
- `src/create-quiver/lib/ai/analyze-project-parser.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `tests/lib/ai/analyze-project-repair.test.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/lib/ai/analyze-project-repair.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
git diff --check
```

## Constraints

- Do not relax the schema.
- Do not move `notes` into semantic docs or claims.
- Do not repair ambiguous semantic conflicts.
