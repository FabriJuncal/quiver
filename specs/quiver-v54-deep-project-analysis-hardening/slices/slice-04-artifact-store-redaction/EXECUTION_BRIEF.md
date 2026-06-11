# EXECUTION_BRIEF - slice-04 artifact store redaction

## Context

Provider stdout/stderr and manifests can contain sensitive or huge data. Redaction and size limits must happen before persistence, not as a later reporting step.

## Objective

Create a bounded, redacted artifact store for analyze-project provider runs.

## Scope

- Redact raw provider stdout/stderr before writing.
- Store head/tail, original size, persisted size, hash, truncation flag, command/options, `run_id`, `kind`, `schema_version`, timestamps, and status metadata.
- Ensure manifests and logs do not leak secrets.
- Keep artifacts under `.quiver/runs`.

## Acceptance Criteria

- Secret-like strings are redacted before artifact persistence.
- Oversized raw output is bounded with head/tail and hash.
- Artifacts include versioned metadata.
- Provider stderr is stored separately from schema validation details.
- Existing invalid-output docs-write guarantees remain intact.

## Completion Checklist

- [ ] Artifact helper or store implemented.
- [ ] Redaction tests added.
- [ ] Truncation tests added.
- [ ] Closure brief records artifact paths and limits.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-artifacts.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/lib/ai-safety.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai-safety.test.js
git diff --check
```

## Constraints

- Redact before writing to disk.
- Do not mix provider stderr with validation issue manifests.
- Do not implement final write gate changes here.
