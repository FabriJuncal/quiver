# EXECUTION_BRIEF - slice-01 Recovery Contract + Security Classifier

## Objective

Implement the recovery contract and secure evidence path classifier for final `evidence-not-selected` failures.

## Context

`ai analyze-project` can fail when the provider cites paths outside the selected sample. This slice must not change CLI output or budget recommendation yet. It creates the safe classification layer that later slices will consume.

## Scope

- Add recovery data contract helpers.
- Normalize and validate evidence paths as repo-relative paths.
- Classify missing evidence paths without reading unsafe content.
- Reuse or mirror existing analyze-project exclusion rules.
- Detect safe, metadata-only, security-excluded, generated/dependency, missing, outside-scope, and unknown paths.
- Produce deterministic, manifest-ready classification output.
- Add focused unit tests.

## Acceptance Criteria

- Unsafe paths are never marked safe to include.
- `.env`, `.git`, `node_modules`, `.next`, caches, dumps, and binaries are classified as excluded.
- `.env.example` is classified as metadata-only/redacted, not content-safe.
- Missing paths are classified without throwing.
- Absolute paths, traversal paths, and paths outside the repo are rejected or classified as outside-scope.
- Classification output is deterministic.
- Unit tests cover safe, metadata-only, unsafe, missing, binary, generated, and traversal cases.

## Expected Files

- `src/create-quiver/lib/ai/analyze-project-recovery.js`
- `tests/lib/ai-analyze-project-recovery.test.js`
- `specs/quiver-v57-evidence-budget-recovery-ux/**`

## Validation

```bash
node --test tests/lib/ai-analyze-project-recovery.test.js
node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict
git diff --check
```

## Completion Checklist

- Recovery module exists and exports classifier helpers.
- Unsafe paths are covered by tests.
- Metadata-only env templates are covered by tests.
- Missing, generated, dependency, binary, traversal, and budget-omitted paths are covered by tests.
- Slice closure brief records validation evidence.

## Constraints

- Do not alter provider schema validation.
- Do not alter CLI rendering in this slice.
- Do not calculate final recommended budgets in this slice.
- Do not read unsafe files to classify them.
