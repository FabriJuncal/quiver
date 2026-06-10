# EXECUTION_BRIEF - slice-04 Validation, docs, fixtures, and release readiness

## Context

The feature can discover, analyze, review, and safely write docs after slices 01-03. This final slice makes the behavior releasable and documented.

## Objective

Add post-write validation, public docs, fixtures, smokes, and final release-readiness evidence.

## Acceptance Criteria

- Post-write validation checks schema, placeholders, evidence paths, deterministic-doc conflicts, and strict-mode behavior.
- `--strict` turns important conflicts into errors.
- Public docs explain read-only default, privacy preflight, review/write gates, budgets, scope, limitations, and JSON output.
- Fixtures cover Next/Supabase, unknown stack, monorepo, secrets, binaries, large repo, no package manager, symlinks, truncation, and invalid provider JSON.
- Package and smoke validation pass.
- v46 evidence report and status are updated.

## Production Guardrails

- Do not claim perfect project understanding.
- Document insufficient-evidence behavior and `--input <requirements.md>` usage.
- Preserve clean automation output.

## Completion Checklist

- [ ] Validation module added.
- [ ] Docs updated.
- [ ] Fixtures and smokes added.
- [ ] Final evidence captured.
- [ ] Spec marked ready/completed as appropriate.
