## Title

QUIVER-51: CLI Ergonomics and Automation Contracts planning baseline

## Summary

Adds the Quiver v51 CLI Ergonomics and Automation Contracts spec package and closes its `slice-00` baseline.

The baseline freezes current CLI contracts for implemented commands and routes partial gaps to later slices: `flow --json` additive compatibility, dashboard section i18n, base branch policy, evidence robustness, and Windows script portability.

## Scope

- Adds the v51 spec documentation, status, evidence report, slices, and per-slice handoff briefs.
- Marks `slice-00-cli-contract-baseline` as completed.
- Records current CLI command contracts and compatibility constraints.
- Does not modify runtime code.

## Files

- `specs/quiver-v51-cli-ergonomics-automation-contracts/SPEC.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/pr.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js available locally.
- Repository checkout with Quiver CLI scripts available.
- GitHub CLI is not required to validate the spec contents.

### Worktree Access

- Checkout this PR branch.
- Confirm no runtime source files are changed by this PR.

### Run the Project

No application runtime needs to be started; this PR is documentation/spec planning only.

### Use Cases

- Review the v51 CLI baseline table in `SPEC.md`.
- Confirm implemented findings are evidence-only.
- Confirm partial gaps are routed to `slice-01` through `slice-06`.

### Technical Verification

```bash
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts
```

## Evidence

- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.
- Runtime code was not modified.

## Rollback

Remove `specs/quiver-v51-cli-ergonomics-automation-contracts/` and revert the commit.

## Risks / Notes

- This PR intentionally excludes local audit inputs, PDFs, copy docs, and other root-level untracked files.
- Follow-up implementation must start from `slice-01-flow-json-compatibility`.
