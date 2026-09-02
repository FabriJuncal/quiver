## Title

docs: add versioned requirements and plans workflow

## Summary

Adds the canonical documentation contract for durable requirements under
`docs/requirements/` and durable plans under `docs/plans/`. Artifacts now use
stable IDs, explicit versions, bidirectional relationships, immutable approved
versions, and a mandatory decision record with change, reason, and impact.

The PR dogfoods the contract with `REQ-WORKFLOW-001` and
`PLAN-WORKFLOW-001`, then imports the complete Quiver requirements catalog v6
and its related master roadmap v6 without changing their proposed status.

## PR Policy

- Docs-only, low-risk change with no runtime or production configuration impact.
- One documentation contract and its directly related imports in one commit.
- Target: `main`, the canonical remote branch; `origin/develop` does not exist.
- Human merge remains required.
- No assisted auto-merge requested.

## Scope

Included:

- Canonical requirements/plans workflow and directory catalogs.
- Versioning, relationship, lifecycle, and decision-record rules.
- Alignment of AI, full workflow, existing-project workflow, and templates.
- Import of 35 v6 specs, 314 v6 requirements, and the 35-spec roadmap.
- Provenance hashes and normalized cross-document links.

Excluded:

- CLI automation that publishes approved plans into `docs/plans/`.
- Changes to Quiver runtime behavior or generated command contracts.
- Approval of the imported v6 proposal.
- Expansion of the frozen `SPEC-V58` scope.
- Migration of historical v3/v4 requirement documents.

## Files

- `docs/workflows/requirements-and-plans.md`
- `docs/requirements/README.md`
- `docs/plans/README.md`
- `docs/requirements/REQ-WORKFLOW-001-v1.0.0.md`
- `docs/plans/PLAN-WORKFLOW-001-v1.0.0.md`
- `docs/requirements/Quiver_Especificaciones_Requerimientos_v6.md`
- `docs/plans/Quiver_Roadmap_Maestro_v6.md`
- `docs/INDEX.md`
- `docs/workflows/full-ai-spec-to-pr.md`
- `docs/workflows/existing-project-ai-quiver-setup.md`
- `docs/WORKFLOW.md.template`
- `docs/DOCUMENTATION_GUIDE.md.template`
- `README_FOR_AI.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`
- npm dependencies installed
- Git checkout at the PR branch root
- No environment variables or external services are required

### Worktree Access

```bash
git switch feature/QUIVER-versioned-requirements-plans
git status -sb
```

Confirm that the branch contains only the documented PR commit. Local
`.quiver/` files and the untracked v4 requirements file are not part of the PR.

### Run the Project

No application runtime is changed. Run the documentation validation suite:

```bash
npm run docs:check
```

Expected result: Markdown lint, links, and generated command-reference checks
all pass.

### Use Cases

1. Open `docs/INDEX.md` and follow the requirements/plans workflow link.
2. Confirm `REQ-WORKFLOW-001` links to `PLAN-WORKFLOW-001` by stable ID.
3. Confirm the plan pins `REQ-WORKFLOW-001@1.0.0` exactly.
4. Confirm the imported requirements catalog links to `PLAN-QUIVER-MASTER`.
5. Confirm the roadmap pins `REQ-QUIVER-PRODUCT-CATALOG@6.0`.
6. Confirm both imported documents remain `lifecycle_status: proposed`.
7. Confirm workflow examples use `docs/requirements/` and persist approved
   plans under `docs/plans/`.

### Technical Verification

```bash
./node_modules/.bin/markdownlint-cli2 \
  docs/requirements/README.md \
  docs/plans/README.md \
  docs/requirements/REQ-WORKFLOW-001-v1.0.0.md \
  docs/plans/PLAN-WORKFLOW-001-v1.0.0.md

git diff --check origin/main...HEAD

rg -c '^# SPEC-V[0-9]+' \
  docs/requirements/Quiver_Especificaciones_Requerimientos_v6.md

rg -c '^### V[0-9]+-RQ-[0-9]+' \
  docs/requirements/Quiver_Especificaciones_Requerimientos_v6.md

rg -c '^\| \*\*SPEC-V[0-9]+' \
  docs/plans/Quiver_Roadmap_Maestro_v6.md
```

Expected counts: `35`, `314`, and `35` respectively.

## Evidence

- `npm run docs:check`: passed.
- Markdownlint for the four new governance/catalog artifacts: passed.
- `git diff --check`: passed.
- Imported requirements catalog: 35 specs and 314 requirements.
- Imported roadmap: 35 spec rows.
- Source comparison confirms semantic content is preserved; differences are
  governance metadata, normalized relative links, and `<br>` replacements for
  source hard breaks that used trailing spaces.
- GitHub CLI authentication: active account `FabriJuncal` with `repo` scope.
- SSH host alias: `github-personal`.
- Identity file: `/Users/fabrijk/ssh/github-personal` present.

## Rollback

Revert the single PR commit. This removes the new workflow, catalogs, imports,
and aligned documentation without changing runtime code, `.quiver/`, or the
pre-existing untracked v4 requirement file.

## Risks / Notes

- The CLI does not yet materialize approved plans automatically; the workflow
  explicitly records the manual persistence step.
- The v6 requirements and roadmap remain proposals. Import is not approval.
- Historical requirements remain legacy until separately reviewed and migrated.
- The imported master documents preserve their historical multi-H1 taxonomy;
  they are outside the repository's official Markdown lint scope. The new
  workflow, catalogs, and governance artifacts pass lint.
- Requirement-to-plan links use stable plan IDs while each plan pins exact
  requirement versions, avoiding recursive version churn.
- `SPEC-V58` remains unchanged and closed to scope expansion.
