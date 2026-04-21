# PR - QUIVER-04 - Workflow Guardrails Alignment

## Title

feat: enforce workflow guardrails in slice bootstrap

## Summary

Aligns the bootstrap scripts and the onboarding docs with the canonical workflow: documentation PR first, ready slices by default, and a readable alias model for worktree artifacts.

## Scope

- `scripts/start-slice.sh` rejects `draft` slices unless `--allow-draft` or `ALLOW_DRAFT_SLICE=1` is provided
- `scripts/start-slice.sh` and `scripts/refresh-active-slices.sh` use a human-readable alias format derived from the ticket prefix
- `README_FOR_AI.md`, `docs/WORKFLOW.md.template`, and `docs/GITFLOW_PR_GUIDE.md.template` describe the actual execution order and the explicit draft escape hatch

## Files

- `scripts/start-slice.sh`
- `scripts/refresh-active-slices.sh`
- `README_FOR_AI.md`
- `docs/WORKFLOW.md.template`
- `docs/GITFLOW_PR_GUIDE.md.template`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v02-bootstrap-hardening/slices/slice-04-workflow-guardrails-alignment/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: Draft slice without override

1. Copy the slice JSON and set `status` to `draft`
2. Run `bash scripts/start-slice.sh <draft-slice.json>`

**Expected result:** The script exits with an error before creating the worktree.

#### Case 2: Draft slice with override

1. Copy the slice JSON and set `status` to `draft`
2. Run `bash scripts/start-slice.sh --allow-draft <draft-slice.json>`

**Expected result:** The script prints a warning and boots the slice intentionally.

#### Case 3: Alias readability

1. Run a slice with ticket `QUIVER-04`
2. Run a slice with ticket `DEM-001`

**Expected result:** The alias in the worktree context is readable and stable for both formats.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v02-bootstrap-hardening/slices/slice-04-workflow-guardrails-alignment/slice.json --gate validation
npm run check:pr -- specs/quiver-v02-bootstrap-hardening/slices/slice-04-workflow-guardrails-alignment/slice.json
git diff --check
```

## Evidence

- Draft gate smoke test
- Alias smoke test for representative tickets

## Rollback

1. `git revert <commit-hash>`
2. Confirm `draft` slices can bootstrap again only through the previous contract

## Risks / Notes

- The explicit `--allow-draft` escape hatch should only be used for intentional replays or recovery work.

