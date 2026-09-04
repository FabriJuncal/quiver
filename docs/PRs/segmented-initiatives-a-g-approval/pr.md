## Title

docs: approve segmented requirements and initiative plans A-G

## Summary

Segments the Quiver v6 product requirements into seven independently readable
initiatives and records their complete version history, exact plan bindings,
review adjustments, and explicit approvals. The master catalogs remain
proposed manifests while every initiative requirement and plan is approved.

The change also reconciles the v58 documentation with the verified merge of
PR #144. It does not modify runtime behavior, create V59, satisfy commercial
gates, or authorize release or deployment.

## PR Policy

- Documentation-only change with no runtime or production configuration impact.
- One cohesive documentary baseline in one commit because requirement, catalog,
  master-plan, and initiative-plan bindings must remain atomic.
- Target: `main`; the branch starts from the current `origin/main` commit.
- Human review and merge are required.
- No assisted auto-merge is requested.

## Scope

Included:

- Canonical workflow for versioned requirements and plans.
- Seven initiative requirements covering V58-V92, with immutable version
  history and decision records.
- Seven approved initiative plans with proportional review adjustments.
- Versioned requirements catalog through `6.0.16` and master plan through
  `6.0.22`.
- Bidirectional requirement/plan navigation and exact plan-to-requirement
  bindings.
- Documentation indexes and AI workflow guidance.
- Reconciliation of the final v58 status with merged PR #144.

Excluded:

- Runtime source, tests, dependencies, configuration, schemas, or CLI behavior.
- Creation or implementation of V59-V92 specs and slices.
- Approval of the complete master roadmap or satisfaction of G1-G5 and the
  conditional gates for V89-V92.
- Release, package publication, deployment, or OTA work.
- Local `.quiver/` temporary state and the unrelated untracked v4 source file.

## Files

- `docs/workflows/requirements-and-plans.md`
- `docs/requirements/README.md`
- `docs/requirements/REQ-QUIVER-PRODUCT-CATALOG-v6.0.*.md`
- `docs/requirements/initiatives/*.md`
- `docs/requirements/traceability/*.md`
- `docs/plans/README.md`
- `docs/plans/PLAN-QUIVER-MASTER-v6.0.*.md`
- `docs/plans/PLAN-QUIVER-INIT-*.md`
- `docs/INDEX.md`
- `README_FOR_AI.md`
- `docs/WORKFLOW.md.template`
- `specs/quiver-v58-risk-aware-review-governance/{SPEC.md,STATUS.md,EXECUTION_PLAN.md,EVIDENCE_REPORT.md,pr.md}`
- `docs/PRs/segmented-initiatives-a-g-approval/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`.
- Repository dependencies installed.
- Git checkout at the PR branch root.
- No external service or application runtime is required.

### Worktree Access

```bash
git switch feature/QUIVER-segment-v6-requirements
git status -sb
```

Confirm that `.quiver/` and
`docs/requirements/Quiver_Requerimiento_Maestro_v4_Runtime_Evidence_Evals.md`
are not part of the staged or committed PR diff.

### Run the Project

No application runtime is changed. Run the documentation suite:

```bash
npm run docs:check
```

Expected result: Markdown lint, link checks, and generated command-reference
checks pass.

### Use Cases

1. Open `docs/INDEX.md` and follow the current requirements and plans links.
2. Confirm that the requirements catalog contains seven initiatives, 35 unique
   specs, and 314 unique requirements.
3. Confirm that current initiative requirements A-G are `approved`.
4. Confirm that current initiative plans A-G are `approved` and pin their exact
   requirement versions.
5. Confirm that `PLAN-QUIVER-MASTER@6.0.22` references all current requirement
   and plan versions while remaining `proposed`.
6. Confirm that every successor declares `supersedes` and a decision with
   change, reason, and impact.
7. Confirm that v58 records PR #144 as merged and makes no release or deployment
   claim.
8. Confirm that no executable V59 spec was added.

### Technical Verification

```bash
npx markdownlint-cli2 \
  'docs/requirements/initiatives/*.md' \
  'docs/requirements/REQ-QUIVER-PRODUCT-CATALOG-v6.0.*.md' \
  'docs/plans/PLAN-QUIVER-INIT-*.md' \
  'docs/plans/PLAN-QUIVER-MASTER-v6.0.*.md'

npm run docs:check

git diff --check origin/main...HEAD
```

Expected results:

- 83 versioned requirement/plan files linted with zero errors.
- Seven current initiatives, 35 unique specs, and 314 unique requirements.
- Seven approved initiative requirements and seven approved initiative plans.
- Zero stale v58 markers claiming that PR #144 is pending.
- No whitespace errors.

## Evidence

- `npm run docs:check`: passed.
- Versioned requirements/plans markdownlint: 83 files, 0 errors.
- Current catalog: 7 initiatives, 35 unique specs, 314 unique requirements.
- Current lifecycle states: 7 approved requirements and 7 approved plans.
- v58 stale pending-merge markers: 0.
- REQ-G preserves 32 unique requirements after approval versioning.
- SSH remote uses host alias `github-personal`; the requested identity file is
  present at `~/ssh/github-personal`.

## Rollback

Revert the single documentation commit. This restores the pre-segmentation
catalog and pre-approval indexes without modifying runtime behavior or deleting
historical source documents.

## Risks / Notes

- The PR is large because approved and superseded documentary versions are
  intentionally immutable; splitting the bindings would create intermediate
  inconsistent states.
- The product requirements catalog and master roadmap remain `proposed` because
  initiative binding approvals are not a transitive approval of future scope.
- V89-V92 remain conditional and require their documented demand evidence.
- The v58 files only reconcile already-verified merge state; they do not alter
  its accepted contract or implementation.
- V59 must begin later from updated `main` in a separate spec branch and PR.
