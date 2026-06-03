# Quiver v52 - Schema, Docs, and Release Hygiene

**Date:** 2026-06-01
**Status:** In Progress
**Source:** User-approved plan v4 derived from `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

The audit identified DX and release-process gaps: no published JSON Schema for `slice.json`, manually maintained command reference, changelog/release hygiene gaps, and package/tarball validation that must stay current as docs and scripts evolve.

## Objective

Reduce documentation and release drift without over-automating risky publish steps:

- Identify the real source of truth for `slice.json`.
- Publish a schema aligned with runtime behavior.
- Generate or validate command reference from a safe source without overwriting curated content.
- Formalize changelog and release smoke hygiene.
- Validate npm package contents and installed CLI behavior.

## Scope

### Included

- Schema/docs/release baseline.
- `docs/schema/slice.schema.json`.
- Schema generation or documented source-of-truth process.
- Generated CLI reference with protected manual content.
- Changelog `[Unreleased]` hygiene.
- Package smoke updates for tarball contents and installed CLI.
- `.npmignore` and package safety updates where required.

### Excluded

- Automatic npm publish without secrets, branch protection, and CI maturity.
- Rewriting the docs site.
- Replacing all docs with generated output.
- Changing runtime slice semantics just to match an aspirational schema.

## Approved Acceptance Criteria

1. Schema source of truth is identified before schema generation.
2. `slice.schema.json` validates real valid fixtures and rejects representative invalid fixtures.
3. The schema does not promise fields unsupported by runtime validation/generation.
4. CLI command reference generation protects manual content.
5. CI or release checks detect drift between runtime help and generated command reference.
6. `[Unreleased]` changelog process is coherent and documented.
7. Package smoke validates tarball contents and installed CLI behavior.
8. Local audit files, PDFs, tests, worktrees, secrets, `.DS_Store`, and tool state do not enter the npm package.

## Execution Baseline - slice-00

| Finding | Current state | Evidence | Action |
|---|---|---|---|
| `slice.json` schema source of truth | partial | `src/create-quiver/commands/spec.js` validates `slice.json` through runtime rules; `src/create-quiver/lib/ai/spec-generator.js` validates/generates a related subset. No single versioned JSON Schema is present. | `slice-01` must derive the schema from current runtime validation/generation behavior and avoid aspirational unsupported fields. |
| Published / repo-only / generated classification | partial | `.npmignore` and `scripts/package-quiver.sh` define the practical npm boundary; classification is not documented as a reusable contract. | `slice-03` must formalize package boundaries and keep package smoke aligned. |
| Existing package and release smoke | implemented | `scripts/package-quiver.sh` validates package contents; `scripts/release-quiver.sh` requires a clean worktree and runs smoke/package checks before publish guidance. | Preserve this as baseline and extend only where schema/docs changes require it. |
| Current command reference | partial | `docs/reference/commands.md` is manually maintained; no generator or drift check is defined in `package.json` scripts. | `slice-02` must add generated reference or drift check without overwriting curated content. |
| Generated docs strategy | missing | No generated block markers, generated source, or docs drift command exists today. | Use protected generated blocks inside `docs/reference/commands.md`; keep curated sections outside markers and fail drift checks when help output changes. |
| Changelog `[Unreleased]` hygiene | partial | Release script exists, but the changelog process details remain open in this spec. | `slice-03` must document/validate the `[Unreleased]` process without adding unsafe publish automation. |

### Package Boundary Baseline

| Class | Current examples | Baseline decision |
|---|---|---|
| Published | `bin/create-quiver.js`, runtime `src/create-quiver/**`, packaged docs/templates required by `scripts/package-quiver.sh`, `package.json`, `.npmignore`, README/license files. | Keep published files limited to runtime CLI, required docs/templates, and package metadata. |
| Repo-only | `tests/**`, `examples/**`, local audit inputs, generated PDFs, `.github/**`, `scripts/ci/**`, worktrees, tool state, secrets, `package-lock.json`. | Continue excluding repo-only validation, local planning, and local artifacts from the npm package. |
| Generated | Future `docs/schema/slice.schema.json` and generated command-reference block(s). | Generated files must have a deterministic source and drift check before they are treated as release artifacts. |

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Schema/docs/release baseline | completed | none |
| slice-01 | JSON Schema for slice.json | completed | slice-00 |
| slice-02 | Generated CLI reference | completed | slice-00 |
| slice-03 | Changelog, package, and release smoke hygiene | planned | slice-01, slice-02 |

## Guardrails

- Do not generate schemas before confirming the real runtime contract.
- Do not overwrite curated docs outside generated blocks.
- Do not make flaky external links or network publish steps required for local release validation.
- Do not publish local audit artifacts or generated PDFs.
- Do not implement npm publish automation unless secrets and branch protection are explicitly available.

## Required Production Gates

- schema fixture validation
- generated docs drift check
- `npm ci`
- `node --test`
- `npm pack` or `npm run package:quiver`
- install tarball into a temp project
- execute installed `create-quiver --version`, `--help`, and at least one safe dry-run command
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`

## Open Decisions

- Exact source of truth for `slice.json` schema: resolved in `slice-01`. The published schema is maintained manually from current runtime validation and generation behavior in `src/create-quiver/commands/spec.js`, `src/create-quiver/lib/slice.js`, `src/create-quiver/lib/readiness.js`, and `src/create-quiver/lib/ai/spec-generator.js`, then checked with `npm run schema:slice:check`.
- Command reference generation script: resolved in `slice-02` with `scripts/ci/check-command-reference.js`, `npm run docs:commands:write`, and `npm run docs:commands:check`.
- Generated command reference location: resolved in `slice-02` with a protected block inside `docs/reference/commands.md`, preserving curated content outside markers.
- Changelog process details.
- Which new files must be published to npm.
