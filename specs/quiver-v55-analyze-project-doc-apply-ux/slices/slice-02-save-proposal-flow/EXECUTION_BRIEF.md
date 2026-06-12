# EXECUTION_BRIEF - slice-02 save proposal flow

## Context

Users need a way to keep the generated documentation proposal without applying final docs. This must work in automation and must not require an editor.

## Objective

Implement `--save-proposal` so Quiver persists a validated, normalized proposal and audit summary without writing final documentation.

## Scope

- Build proposal from `buildAnalyzeProjectDocProposal(parsed.analysis)`.
- Save:
  - normalized proposal JSON;
  - compact Markdown summary;
  - full diff artifact;
  - manifest with hashes and events.
- Support `--save-proposal --json`.
- Do not create snapshots or write final docs.
- Update run status with proposal artifact metadata.

## Acceptance Criteria

- `--save-proposal` runs provider, validates/repairs JSON, and saves proposal artifacts.
- Final docs are not modified.
- no-TTY mode works without prompting.
- `--json` emits clean machine-readable proposal result.
- Invalid final JSON does not create usable proposal artifacts.
- Proposal Markdown summary is compact and does not embed full doc contents by default.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/lib/ai-analyze-project-proposal.test.js`
- this slice closure/status/evidence files

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai-analyze-project-proposal.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Completion Checklist

- Save-only proposal flow implemented without final docs writes.
- Proposal JSON, Markdown, diff, and manifest artifacts covered by tests.
- `--json` output contract verified.
- Invalid JSON failure path verified.
- Slice closure brief updated with evidence.

## Constraints

- Do not write docs final.
- Do not create snapshots for save-only flows.
- Do not re-run provider when only formatting artifacts.
