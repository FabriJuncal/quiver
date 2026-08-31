# PR — QUIVER-58-06 Integration, Migration, and Documentation

## Title

QUIVER-58-06: close v58 compatibility, rollback, and shared projections

## Summary

Completes the v58 implementation with one canonical governance projection, additive verified migration, fail-closed read-only rollback, supported writer downgrade protection, stable machine contracts, and operator documentation. Legacy reads remain nonmutating and cannot invent evidence or report false advancement.

## PR Policy

- Source: `feature/QUIVER-58-06-v58-integration-migration-docs`.
- Target: `main`, following the approved v58 package exception recorded and human-accepted in slice-00.
- One functional slice, one commit, and one PR.
- Human review and merge are mandatory; auto-merge is not authorized.
- Release, package publication, deployment, and OTA are not included.

## Scope

- Schema-validated `governance.compatibility` metadata and monotonic minimum writer version.
- Canonical compatibility and governance projection across approval, flow, status, resume, export, generation, and readiness boundaries.
- Stable nonlocalized compatibility codes, machine keys, statuses, enums, exits, and clean JSON stdout.
- Legacy-unverified, no-write read behavior with unavailable counts kept null.
- Existing-command migration dry-run, verified apply, independent doctor verification, and no-write idempotent reapply.
- Tracked read-only rollback with readers available, gates fail-closed, and writers blocked without data downgrade.
- Older active writer and older declared dependency rejection.
- Exact prepared-WAL recovery before the rollback guard without permitting a new write.
- Directed and full regression coverage plus focused CLI, troubleshooting, migration, rollback, legacy, and onboarding documentation.

Out of scope: destructive downgrade, general migration framework, untracked pre-guard binaries, release/deploy, v59, and v60.

## Files

Production:

- `src/create-quiver/index.js` and `src/create-quiver/commands/flow.js`
- `src/create-quiver/lib/state.js` and `src/create-quiver/lib/init-docs.js`
- Governance state, schema, projection, export, demo, and i18n modules declared by `slice.json`

Validation and handoff:

- Direct command and library tests plus `scripts/ci/smoke-cross-platform.js`, all declared by `slice.json`.
- CLI, command-reference, troubleshooting, legacy-project, full-workflow, and AI-onboarding documentation.
- Spec, status, execution, closure, evidence, and PR artifacts under `specs/quiver-v58-risk-aware-review-governance/**`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`, npm, Git, and a Unix-compatible shell.
- Install the committed dependency tree with `npm ci`.
- No live provider or GitHub identity is required; directed tests use isolated repositories and injected boundaries.

### Worktree Access

```bash
git fetch origin feature/QUIVER-58-06-v58-integration-migration-docs
git worktree add --detach ../quiver-58-06-review origin/feature/QUIVER-58-06-v58-integration-migration-docs
cd ../quiver-58-06-review
npm ci
```

### Run the Project

Quiver exposes a CLI rather than a long-running service:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js migrate --help
node bin/create-quiver.js doctor --help
node bin/create-quiver.js ai status --help
```

### Use Cases

#### Case 1: Compatibility, projection, migration, and rollback

```bash
node --test tests/commands/ai-export.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js tests/commands/doctor.test.js tests/commands/flow.test.js tests/commands/init-profiles.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/ai-export-state.test.js tests/lib/ai-run-state.test.js tests/lib/ai-review-governance.test.js tests/lib/doctor.test.js tests/lib/init-docs.test.js tests/lib/init-layout.test.js tests/lib/i18n-catalog.test.js
```

Expected: 201 tests pass, including clean human/JSON projection, legacy no-write behavior, migration, rollback, downgrade, pre-write drift rejection, recovery, and i18n contracts.

#### Case 2: Directly affected cross-slice boundaries

```bash
node --test tests/lib/ai-review-budget.test.js tests/lib/ai-spec-generator.test.js tests/lib/check-slice.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-pr.test.js tests/commands/analyze.test.js tests/commands/demo.test.js tests/commands/findings.test.js tests/commands/spec-create.test.js
```

Expected: 185 tests pass with no failures.

#### Case 3: Cross-platform migration smoke

```bash
node scripts/ci/smoke-cross-platform.js
```

Expected: the portable init/migrate workflow passes with a true legacy fixture that lacks both v58 state and compatibility metadata.

#### Case 4: Portable repository regression

```bash
npm test -- --test-reporter=tap
```

Expected: 944 tests pass with no failures.

### Technical Verification

```bash
node --check src/create-quiver/index.js
node --check src/create-quiver/commands/flow.js
node --check src/create-quiver/lib/ai/export-state.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/run-state.js
node --check src/create-quiver/lib/demo.js
node --check src/create-quiver/lib/i18n/messages/en.js
node --check src/create-quiver/lib/i18n/messages/es.js
node --check src/create-quiver/lib/init-docs.js
node --check src/create-quiver/lib/state.js
npm run schema:slice:check
npm run docs:check
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
node bin/create-quiver.js slice scope specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json --base main
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json
git diff --check
```

## Evidence

- Primary slice suite: 201 passed, 0 failed.
- Expanded affected-boundary suite: 185 passed, 0 failed.
- Cross-platform migration smoke: passed locally after the true-legacy fixture correction.
- Full portable regression: 944 passed, 0 failed.
- All changed JavaScript modules passed syntax validation.
- Migration, rollback, downgrade, WAL recovery, tamper, no-write, and JSON-cleanliness outcomes are recorded in `CLOSURE_BRIEF.md`.
- Independent command-boundary review ended approved with no material blockers.
- Final schema, docs, slice, strict-spec, scope, PR-readiness, and whitespace results are recorded in `CLOSURE_BRIEF.md`.

## Rollback

After merge, revert the merge or squash commit without rewriting history:

```bash
git revert <merge-or-squash-commit-sha>
```

For an operational writer stop without code rollback, set the tracked `governance.compatibility.writer_mode` to `read-only` through reviewed configuration change. Do not rewrite `.quiver/runs/**`, decision ledgers, approval projections, or generated governance manifests into legacy shapes.

## Risks / Notes

- Human merge is required; no release, publish, deployment, OTA, or auto-merge is included.
- The writer guard covers the supported current CLI path and tracked dependency declaration. Operators must prevent deliberate execution of an untracked older binary.
- `main` is the accepted v58 package base/target exception; the generic Git guide still documents `develop` for ordinary feature work.
- Canonical run state remains the mutable authority; Markdown and generated manifests remain projections.
