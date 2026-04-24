# Quiver v0.16 Evidence Report

**Spec:** quiver-v16-handoff-contract
**Date:** 2026-04-23
**Status:** Completed

## Summary

This spec will standardize Quiver handoffs as a lightweight artifact for exceptional context transfers. The target outcome is a documented contract with minimal automation, not a new workflow layer.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | A canonical `specs/[project-name]/HANDOFF.md.template` now exists, `init-docs` and `scripts/init-docs.sh` copy it into `specs/<project-slug>/HANDOFF.md`, and the docs explain when to use a handoff versus updating a spec or slice directly |
| slice-02 | Completed | `create-quiver check-handoff <path>` validates path and required sections, returns non-zero on malformed handoffs, and smoke coverage proves both valid and invalid examples |
| slice-03 | Completed | `create-quiver new-handoff <spec-slug>` generates `specs/<spec-slug>/HANDOFF.md` from the template without overwriting an existing handoff and stays aligned with the validator contract |

## Required Final Evidence

- A canonical `HANDOFF.md.template` exists under `specs/[project-name]/`
- Documentation defines the canonical location, lifecycle, and required sections
- `check-handoff` fails clearly for missing files, wrong paths, and missing required sections
- A valid `HANDOFF.md` passes validation
- If `new-handoff` is implemented, it generates a valid handoff in the correct location and refuses accidental overwrite
- The contract remains separate from `slice.json` types and from `doctor`
