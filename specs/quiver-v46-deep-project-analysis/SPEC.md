# Quiver v46 - Deep Project Analysis

**Date:** 2026-06-10
**Status:** Planned
**Source:** User-approved acceptance criteria and production review for generic AI-assisted project analysis.

## Problem

Quiver can initialize documentation and generate a deterministic project map, but it does not yet provide a production-safe way to infer a project's real product context, domain model, architecture, features, and risks from source code evidence. Existing `analyze` output is intentionally technical and conservative. Existing `ai prepare-context --with-planner` primarily works from documentation and the project map, so projects with boilerplate docs or stale package names can keep placeholder context.

Users need an explicit command that can inspect representative source, docs, and configuration across stacks, produce evidence-backed conclusions, and update context documentation only after review.

## Objective

Add a safe, generic, stack-agnostic `ai analyze-project` workflow that transforms an existing repository into an operational AI context by discovering product/domain/architecture signals from evidence, validating AI output, and updating docs only through reviewable, auditable writes.

The default behavior must be read-only. Sending context to a provider and writing files must be explicit, privacy-checked, and reviewable.

## Scope

### Included

- New `npx create-quiver ai analyze-project` command.
- Read-only default and `--dry-run` behavior with no filesystem writes and no provider execution.
- Flags:
  - `--deep`
  - `--dry-run`
  - `--review`
  - `--json`
  - `--strict`
  - `--max-files <n>`
  - `--max-bytes <n>`
  - `--include-source`
  - `--include-tests`
  - `--include-db`
  - `--scope <path-or-workspace>`
  - `--input <requirements.md>`
- Stack-agnostic source discovery with optional adapter hooks.
- Semantic sampling with budgets, exclusions, symlink policy, and selected/omitted reporting.
- Provider prompt and schema for evidence-backed JSON analysis.
- Confidence model for claims:
  - `confirmed`
  - `inferred`
  - `unknown`
  - `conflict`
- Privacy preflight before provider execution.
- Content-based secret detection and redaction/blocking.
- Review workflow with editable proposal, schema revalidation, final diff, and explicit confirmation.
- Safe writes only to approved docs paths and `.quiver/runs`.
- Snapshots, manifests, hashes, raw/redacted provider artifacts, and restore guidance.
- Post-write validation for schema, placeholders, doc conflicts, and strict mode.
- Public docs, command reference, tests, fixtures, and release readiness evidence.

### Excluded

- Implementing product features in analyzed projects.
- Modifying application source code in target projects.
- Sending entire repositories to providers.
- Full AST indexing for every language.
- Guaranteeing perfect domain understanding from insufficient evidence.
- Editing `docs/PROJECT_MAP.md` with free-form AI inference. `PROJECT_MAP.md` remains deterministic; any AI-generated insights must live in managed blocks or other docs.
- Following symlinks outside the repository.
- Persisting unredacted secrets in `.quiver/runs`.

## Approved Acceptance Criteria

1. `npx create-quiver ai analyze-project` exists and is read-only by default.
2. `--dry-run` never writes files, never runs a provider, and shows stack, roots, selected files, omitted files, budgets, safety exclusions, and next commands.
3. Provider execution requires an explicit non-dry-run mode and a privacy preflight that lists files/snippets to be sent.
4. Writes require `--review` plus explicit confirmation, or an equivalent explicit write mode added by implementation with the same safety guarantees.
5. Discovery works with known and unknown stacks using generic signals for frontend, APIs, services, models, schemas, tests, DB/migrations, and configs.
6. Sampling respects `--max-files`, `--max-bytes`, `--include-source`, `--include-tests`, `--include-db`, and `--scope`.
7. Secrets are excluded by path and scanned by content before provider execution and before artifact persistence.
8. Symlinks are not followed by default; followed symlinks must resolve inside the repo.
9. Monorepos and workspaces report analyzed roots and support scope selection.
10. The provider response is valid JSON against a schema before any write.
11. Every meaningful claim includes confidence and validated evidence paths.
12. Claims based on truncated files cannot be marked `confirmed`.
13. Conflicts are reported and not hidden.
14. `doc_updates` can only target approved Markdown docs and must respect size/path limits.
15. `docs/PROJECT_MAP.md` stays deterministic; AI updates are constrained to managed blocks or other approved docs.
16. Review opens an editable proposal, revalidates the edited JSON, shows a final diff, and allows approve/cancel.
17. Canceling review leaves the repository unchanged.
18. Every write creates `.quiver/runs/run-...` snapshots, manifest, before/after hashes, and redacted provider artifacts.
19. Post-write validation checks schema, placeholders, deterministic-doc conflicts, evidence paths, and strict-mode warnings/errors.
20. `--json` only changes output formatting and never implies provider execution or writes.
21. Non-TTY behavior never opens an editor or waits indefinitely; unsupported interactive modes fail with actionable guidance.
22. Tests cover dry-run no-write, privacy preflight, secret redaction, invalid JSON no-write, review cancel no-write, safe write snapshots, monorepo scope, symlinks, truncation, unknown stack, and JSON cleanliness.

## Approved Technical Plan

1. Add `ai analyze-project` parser support, help text, and read-only default behavior.
2. Build a deterministic analysis plan that reports selected roots, files, omissions, budgets, safety exclusions, and provider/write next steps.
3. Implement stack-agnostic discovery and sampling modules with adapter contracts and generic fallback.
4. Add privacy and content safety preflight before provider execution.
5. Create the provider prompt and JSON schema for project analysis.
6. Parse and validate provider JSON, normalize evidence, validate paths, and enforce confidence rules.
7. Convert validated analysis into doc update proposals for approved paths.
8. Implement review/edit/final-diff/confirm flow and safe writes with snapshots.
9. Add post-write validation, restore guidance, public docs, tests, fixtures, and release evidence.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Analysis contract foundation | completed | none |
| slice-01 | Stack-agnostic discovery and sampling | planned | slice-00 |
| slice-02 | Provider analysis JSON contract | planned | slice-01 |
| slice-03 | Doc proposal review and safe writes | planned | slice-02 |
| slice-04 | Validation, docs, fixtures, and release readiness | planned | slice-03 |

## Validation Strategy

```bash
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run package:quiver
node bin/create-quiver.js ai analyze-project --dry-run
node bin/create-quiver.js ai analyze-project --dry-run --json
node bin/create-quiver.js spec validate specs/quiver-v46-deep-project-analysis --strict
git diff --check
```

## Production Guardrails

- Default command must be read-only.
- Provider execution must be explicitly gated by privacy preflight.
- Writes must be explicitly gated by review or a future equivalent explicit write mode.
- Evidence paths must be validated against existing sampled files.
- `.quiver/runs` artifacts must be redacted and ignored from git.
- `PROJECT_MAP.md` remains deterministic.
- Monorepo analysis must identify scope to avoid mixing unrelated apps/packages.
- Missing product evidence must produce questions and `unknown`/`needs_confirmation`, not polished guesses.

## Risks

- Secret leakage if content scanning misses hardcoded credentials.
- False confidence if evidence validation is weak.
- Poor product summaries if the selected sample is too small or skewed.
- Monorepo scope mistakes can blend domains.
- Review UX can be confusing if JSON editing and final diff are not clear.
- Snapshot restore can be unreliable without hashes and manifest discipline.

## Resolved Decisions

- `ai analyze-project` is separate from `ai prepare-context`.
- Dry-run/read-only is the safe default.
- Provider execution and writes are distinct gates.
- AI output is schema-first JSON, not Markdown free-form.
- `docs/PROJECT_MAP.md` stays deterministic.
- Docs are updated through managed proposals and review.

## Open Questions

- Whether a future non-interactive write mode should be named `--write`, `--yes`, or use an explicit proposal input file.
- Whether restore should be implemented in this spec as a command or documented as manifest-guided manual recovery.
- Which stack adapters ship first beyond the generic fallback.
