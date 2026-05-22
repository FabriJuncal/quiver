## Title
Quiver v25 - AI-First Lifecycle Orchestrator

## Summary

- Adds the planning package for the next Quiver AI-first lifecycle spec.
- Defines the production-ready workflow from onboarding docs through planner approvals, spec/slice generation, controlled slice execution, commits, PR creation, merge cleanup, validation, and migration.
- Introduces slices for CLI compatibility, persistent run state, phase locks, safe AI onboarding docs, provider adapters, approval gates, artifact generation, execution planning, controlled execution, worktrees/PRs, hardening, export, and migration.

## Scope

- Documentation and planning artifacts only in `slice-00`.
- Future implementation slices cover CLI, state, AI adapters, validation, worktrees, PRs, and export.
- No product code is changed by the foundation slice.
- No package release is included.

## Files

- `README_FOR_AI.md`
- `ROADMAP.md`
- `specs/quiver-v25-ai-first-lifecycle-orchestrator/**`

## How to Test

```bash
git diff --check
find specs/quiver-v25-ai-first-lifecycle-orchestrator -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;
```

## Evidence

- Update `specs/quiver-v25-ai-first-lifecycle-orchestrator/EVIDENCE_REPORT.md` after validation.

## Rollback

- Revert the documentation commit for `slice-00`.
- No product behavior changes should need rollback.

## Risks / Notes

- This spec is large by design. Implementation must stay sliced and phase-gated.
- Provider execution should start in prompt-only or dry-run mode before automatic execution is trusted.
- Source-of-truth docs should not claim npm publication unless publication has been verified.
