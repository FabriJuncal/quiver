# EXECUTION_BRIEF - slice-05 apply saved proposal

## Context

Saving a proposal is only useful if users can later apply it without re-running the provider. This flow has a higher trust boundary because proposal artifacts may be stale or manually edited.

## Objective

Implement `ai analyze-project apply --run <run-id>` to apply saved proposals without provider execution.

## Scope

- Resolve and validate run id.
- Load proposal manifest and normalized JSON.
- Revalidate proposal schema and allowed paths.
- Recalculate target doc hashes.
- Detect stale/dirty docs before writing.
- Apply through the same apply engine from slice-03.
- Support `--yes`, `--strict`, `--allow-dirty-docs`, and `--json` where safe.
- Optionally support `--run latest` only in TTY and never with `--yes`.

## Acceptance Criteria

- `apply --run <run-id>` does not execute provider and does not require provider/model.
- Invalid or missing run id fails with actionable guidance.
- Missing/invalid proposal manifest fails without docs writes.
- Stale or dirty docs block non-interactive apply unless explicitly allowed.
- Manual proposal edits are accepted only after full revalidation and recorded as edited.
- `--run latest --yes` is rejected.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-apply.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/lib/ai-analyze-project-proposal.test.js`
- this slice closure/status/evidence files

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/ai-analyze-project-proposal.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Completion Checklist

- Saved proposal apply path never executes provider.
- Proposal manifest and normalized JSON are revalidated before writes.
- Stale/dirty target docs behavior is tested.
- Edited proposal audit metadata is recorded.
- Slice closure brief updated with evidence.

## Constraints

- Do not execute provider in `apply --run`.
- Do not trust saved artifacts without revalidation.
- Do not allow ambiguous `latest` in automation.
