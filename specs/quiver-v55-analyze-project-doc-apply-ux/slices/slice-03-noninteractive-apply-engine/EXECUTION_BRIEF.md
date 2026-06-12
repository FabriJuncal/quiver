# EXECUTION_BRIEF - slice-03 non-interactive apply engine

## Context

Automation needs a safe direct apply path. This must not depend on selector UI and must reuse existing write plan, snapshot, and post-write validation behavior.

## Objective

Implement the non-interactive apply engine for `--apply-docs --yes`.

## Scope

- Save proposal artifacts before applying.
- Build write plan from normalized proposal.
- Detect dirty/stale target docs.
- Block dirty docs in `--yes` unless `--allow-dirty-docs` is passed.
- Create snapshot before writes.
- Write docs through existing safe write path.
- Save write manifest.
- Run post-write validation.
- Support `--apply-docs --yes --json`.

## Acceptance Criteria

- `--apply-docs --yes` writes only allowed docs when proposal is valid.
- `--apply-docs --yes` blocks on invalid proposal.
- `--apply-docs --yes` blocks on dirty docs unless explicitly allowed.
- Snapshot and write manifest are created before/after writes as appropriate.
- JSON output includes run id, proposal artifacts, write plan, snapshot, written docs, validation, and artifacts.
- Existing `--review` behavior remains unchanged.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-apply.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/lib/ai-analyze-project-validation.test.js`
- this slice closure/status/evidence files

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/ai-analyze-project-validation.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Completion Checklist

- Non-interactive apply engine uses validated proposals only.
- Dirty/stale docs guardrails covered by tests.
- Snapshot and write manifest behavior verified.
- JSON output includes apply artifacts and validation status.
- Slice closure brief updated with evidence.

## Constraints

- Do not implement selector UI in this slice.
- Do not allow product code writes.
- Do not let `--yes` approve anything beyond validated doc updates.
