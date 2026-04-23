# Quiver v0.14 Evidence Report

**Spec:** quiver-v14-tiered-context-pack
**Date:** 2026-04-23
**Status:** Completed

## Summary

This spec materializes the v13 token-efficient modes into concrete, stratified artifacts. A freshly generated project gets a three-tier context pack (QUICK, STANDARD, DEEP), a single `AGENTS.md` router, an auto-generated `ACTIVE_SLICE.md` during slice work, structured YAML front-matter on every context file, and deduplicated stack information so only `PROJECT_MAP.md` owns that data.

The primary measurable outcome is a reduction in default token loadout for execution-mode tasks from roughly 8k tokens (reading the current flat pack) to under 1k tokens (reading only QUICK + ACTIVE_SLICE).

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | `docs/QUICK.md.template`, `docs/STANDARD.md.template`, and `docs/DEEP.md.template` now exist; init and migrate render them into `docs/ai/QUICK.md`, `docs/ai/STANDARD.md`, and `docs/ai/DEEP.md`; `docs/INDEX.md.template` links to the new tiers |
| slice-02 | Completed | Root `AGENTS.md.template` now exists; init and migrate render `AGENTS.md` at the project root and preserve an existing file on rerun; generated README and `README_FOR_AI.md` now point agents to `AGENTS.md` first; doctor and smokes validate the new router |
| slice-03 | Completed | `docs/ai/ACTIVE_SLICE.md` is created by `start-slice`, rewritten when a stale active brief exists, and removed by `cleanup-slice`; `WORKTREE_CONTEXT.md` now points to the active brief path; legacy Bash wrappers delegate to the Node CLI |
| slice-04 | Completed | Front-matter helper added in `src/create-quiver/lib/init-docs.js`; generated context docs now get YAML front matter idempotently; `docs/AI_CONTEXT.md`, `docs/CONTEXTO.md`, `docs/STATUS.md`, `docs/WORKFLOW.md`, `docs/AI_ONBOARDING_PROMPT.md`, `docs/ai/QUICK.md`, `docs/ai/STANDARD.md`, `docs/ai/DEEP.md`, `docs/ai/LESSONS.md`, and `docs/ai/PRINCIPLES.md` are validated; `docs/PROJECT_MAP.md` is now the only generated file carrying the package manager/command surface |
| slice-05 | Completed | `src/create-quiver/lib/doctor.js` now warns on oversize QUICK/STANDARD files, missing AGENTS sections, missing front matter, orphaned ACTIVE_SLICE briefs, and duplicated stack info; `scripts/ci/smoke-tiered-pack.sh` validates the tiered pack, lifecycle, and warning scenarios; CI matrix now runs the new smoke on macOS, Linux, and Windows; `specs/[project-name]/EVIDENCE_REPORT.md.template` now asks for summarized evidence |

## Required Final Evidence

- A freshly generated project contains `docs/ai/QUICK.md`, `docs/ai/STANDARD.md`, `docs/ai/DEEP.md`, and root `AGENTS.md`
- `docs/ai/QUICK.md` is ≤ 50 lines, `docs/ai/STANDARD.md` is ≤ 300 lines
- `AGENTS.md` declares: reading budget per task mode, output policy forbidding restating and summarizing, and routing rules pointing to QUICK first
- Running `start-slice <slice.json>` creates `docs/ai/ACTIVE_SLICE.md` with objective, allowed_files, tests, DoD, and prohibition clause
- Running `cleanup-slice <slice.json>` removes `docs/ai/ACTIVE_SLICE.md`
- Every file in `docs/ai/` declares YAML front-matter with `purpose`, `applies_when`, `token_cost`, `last_updated`, and `supersedes`
- `PROJECT_MAP.md` is the only generated file containing the detected stack table and command table
- `doctor` prints warnings when QUICK exceeds 50 lines, STANDARD exceeds 300 lines, or any `docs/ai/` file is missing front-matter
- Smoke tests in CI verify tier bounds, AGENTS.md required sections, ACTIVE_SLICE lifecycle, and absence of duplicated stack information across context files
- Smoke tests also verify that `docs/DECISIONS.md` exists, that `PROJECT_MAP.md` includes a `Suggested Reading Order` section, that generated guidance names all four AI modes, and that `EVIDENCE_REPORT.md.template` prefers summarized command evidence over pasted long logs
- `migrate` on a project generated before v14 adds the new artifacts additively without deleting or overwriting existing content

## Validation Checkpoint (Post-Merge)

- The maintainer uses v14 in at least one real project for at least one week
- A before/after measurement of execution-mode token loadout is recorded (heuristic: 4 chars per token)
- At least one external user installs the tiered pack and reports whether it helps or adds friction
- Decision to scope v15 is made based on this evidence, not on the original plan
