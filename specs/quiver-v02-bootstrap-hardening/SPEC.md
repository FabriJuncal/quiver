# Quiver v0.2 - Bootstrap Hardening

**Date:** 2026-04-20
**Status:** Ready

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make the current Quiver bootstrap flow reliable in a freshly initialized repo: no hidden remote or path assumptions, no unresolved project placeholders, and a generated project that matches the documented contract.

## Scope

### Included

- Canonical path handling in bootstrap scripts
- `start-slice.sh` support for repos with and without `origin`
- Generated project completeness for legal, OSS, and PR workflow assets
- Placeholder rendering cleanup in generated docs and templates
- Workflow guardrail alignment across scripts and docs

### Excluded

- One-command installation via `npx create-quiver`
- Hosted docs site
- JSON Schema and editor integrations
- Release automation beyond the current git workflow

## Slices

| Slice | Title | Status |
|-------|-------|--------|
| 01 | Canonical Paths + Remote-Safe Bootstrap | Ready |
| 02 | Generated Project Contract | Ready |
| 03 | Placeholder Rendering Cleanup | Ready |
| 04 | Workflow Guardrails Alignment | Ready |

## Definition of Done

- `init-docs.sh` and `start-slice.sh` work in a fresh repo with and without `origin`
- The generated project matches the files promised by the onboarding docs
- No project-scoped placeholders remain unresolved in generated docs
- Scripts and docs agree on readiness gates and the documentation-PR-before-spec-PR workflow
