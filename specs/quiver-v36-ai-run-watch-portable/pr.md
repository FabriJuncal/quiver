# PR: Quiver v36 Portable AI Run Watch Spec

## Title

docs: add v36 portable AI run watch spec

## Summary

- Adds the approved SDD package for a portable AI run watcher.
- Defines acceptance criteria, execution order, risks, and validation requirements before runtime work starts.
- Creates per-slice handoffs for schema/path safety, event persistence, provider streaming, watcher UX, docs, and readiness validation.
- Does not implement runtime code.

## Scope

- Spec package only: `specs/quiver-v36-ai-run-watch-portable/**`.
- Eight slices with `EXECUTION_BRIEF.md`, `CLOSURE_BRIEF.md`, and `slice.json`.
- Evidence and status files for the spec package.
- PR body aligned with `docs/GITFLOW_PR_GUIDE.md`.

## Files

- `specs/quiver-v36-ai-run-watch-portable/SPEC.md`
- `specs/quiver-v36-ai-run-watch-portable/STATUS.md`
- `specs/quiver-v36-ai-run-watch-portable/EXECUTION_PLAN.md`
- `specs/quiver-v36-ai-run-watch-portable/EVIDENCE_REPORT.md`
- `specs/quiver-v36-ai-run-watch-portable/pr.md`
- `specs/quiver-v36-ai-run-watch-portable/slices/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- `create-quiver` available through the local workspace or `npx`.
- No provider credentials are required because this PR is documentation/spec only.

### Worktree Access

- Branch: `feature/QUIVER-36-ai-run-watch-portable-spec`
- Spec package: `specs/quiver-v36-ai-run-watch-portable/`
- Next executable slice after merge: `slice-01-run-schema-path-safety`

### Run the Project

No runtime command is introduced by this PR. Runtime work must start from the approved slice handoffs after this spec PR is reviewed and merged.

### Use Cases

- Reviewer validates the complete watcher requirement before implementation.
- Executor starts from `slice-01` with explicit scope, allowed files, restrictions, and acceptance criteria.
- Later slices can update their closure briefs and evidence without changing the original spec intent.

### Technical Verification

```bash
node -e "const fs=require('fs'); for (const f of process.argv.slice(1)) JSON.parse(fs.readFileSync(f,'utf8')); console.log('slice json ok')" specs/quiver-v36-ai-run-watch-portable/slices/*/slice.json
npx create-quiver spec validate specs/quiver-v36-ai-run-watch-portable --strict
git diff --check
```

## Evidence

- `slice json ok`
- `npx create-quiver spec validate specs/quiver-v36-ai-run-watch-portable --strict` passed.
- `git diff --check` passed.
- Evidence is recorded in `specs/quiver-v36-ai-run-watch-portable/EVIDENCE_REPORT.md`.

## Rollback

- Revert this PR.
- No runtime migration, generated artifacts, or package publish rollback is required.

## Risks / Notes

- `docs/INDEX.md` is missing in this checkout; `docs/INDEX.md.template` was used as the available navigation fallback.
- `docs/GITFLOW_PR_GUIDE.md` references `develop`, but the remote currently exposes `origin/main` as the available default target.
- This PR intentionally contains no runtime implementation.
