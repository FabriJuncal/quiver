# PR — QUIVER-58-05 Finding Disposition and Transfer

## Title

QUIVER-58-05: preserve governed findings through spec and PR gates

## Summary

Adds authorized, atomic pre-decision finding transfer and an immutable digest-bound governance manifest. Spec, destination-slice, root-PR, human, JSON, and readiness projections preserve the same canonical identity and fail closed on stale source parity, broken criterion bindings, unresolved targets, or missing conditions.

## PR policy

- Source: `feature/QUIVER-58-05-v58-finding-disposition-transfer`.
- Target: `main`.
- One functional slice, one commit, and one PR.
- Human review and merge are mandatory; auto-merge is not authorized.
- Slice-06 must not start before this PR is merged.

## Scope

- Individual `findings transfer` and atomic `findings disposition` batch commands.
- Pre-decision `transfer-blocker` authorization, explicit supersession, and post-decision mutation rejection.
- Exact acceptance-reference/content/source/digest criterion bindings plus evidence obligations.
- Exact-one phase and slice target resolution with canonical normalization.
- Primary-checkout run-store parity and immutable, self-digesting `GOVERNANCE_MANIFEST.json` generation.
- SPEC traceability, exact destination-slice blocks, complete root-PR traceability, and `phase:pr-review` operational gating.
- Fail-closed slice/PR checks for missing, omitted, orphaned, unknown, reordered, stale, or unresolved governance state.
- Shared redaction plus stable human and clean JSON contracts.
- Generated command-reference synchronization and directed/full regression coverage.

Out of scope: compatibility migration, package rollback/read mode, generalized artifact graphs, release/deploy, v59, and v60.

## Files

Production:

- `src/create-quiver/commands/findings.js`, `commands/spec.js`, and `commands/ai.js`
- `src/create-quiver/lib/ai/spec-governance.js`, `spec-generator.js`, and `spec-templates.js`
- `src/create-quiver/lib/ai/review-governance.js` and `review-governance.schema.js`
- `src/create-quiver/lib/readiness.js`, `lib/cli/command-registry.js`, and `src/create-quiver/index.js`

Validation and handoff:

- Finding, governance, spec-generation, readiness, namespace, PR, and CLI tests declared by `slice.json`.
- Generated command reference in `docs/reference/commands.md`.
- Spec, status, execution, closure, evidence, and PR artifacts under `specs/quiver-v58-risk-aware-review-governance/**`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`, npm, Git, and a Unix-compatible shell.
- Install the committed dependency tree with `npm ci`.
- No live provider or GitHub identity is required; directed tests use isolated repositories and injected identity boundaries.

### Worktree Access

```bash
git fetch origin feature/QUIVER-58-05-v58-finding-disposition-transfer
git worktree add --detach ../quiver-58-05-review origin/feature/QUIVER-58-05-v58-finding-disposition-transfer
cd ../quiver-58-05-review
npm ci
```

### Run the Project

Quiver exposes a CLI rather than a long-running service:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js findings transfer --help
node bin/create-quiver.js findings disposition --help
```

### Use Cases

#### Case 1: Transfer, manifest, projection, and gates

```bash
node --test tests/lib/ai-spec-generator.test.js tests/lib/ai-review-governance.test.js tests/lib/check-slice.test.js tests/commands/spec-create.test.js tests/commands/slice-namespace.test.js tests/commands/ai-pr.test.js tests/commands/findings.test.js tests/commands/cli-contract.test.js
```

Expected: 135 tests pass, including exact-byte transfer, both batch shapes, authorization, supersession, target resolution, canonical parity, immutable manifest, projections, broken-reference gates, and redaction.

#### Case 2: Portable regression

```bash
npm test
```

Expected: 935 tests pass with no failures.

### Technical Verification

```bash
node --check src/create-quiver/commands/ai.js
node --check src/create-quiver/commands/findings.js
node --check src/create-quiver/commands/spec.js
node --check src/create-quiver/index.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/spec-generator.js
node --check src/create-quiver/lib/ai/spec-governance.js
node --check src/create-quiver/lib/ai/spec-templates.js
node --check src/create-quiver/lib/cli/command-registry.js
node --check src/create-quiver/lib/readiness.js
npm run schema:slice:check
npm run docs:check
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-05-finding-disposition-transfer/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
node bin/create-quiver.js slice scope specs/quiver-v58-risk-aware-review-governance/slices/slice-05-finding-disposition-transfer/slice.json --base main
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-05-finding-disposition-transfer/slice.json
git diff --check
```

## Evidence

- Directed slice suite: 135 passed, 0 failed.
- Full portable regression: 935 passed, 0 failed.
- Generated-reference/schema regression: 5 passed, 0 failed.
- JavaScript syntax and slice-schema gates passed.
- Final slice, strict-spec, docs, Markdown, scope, PR-readiness, and whitespace evidence is recorded in `CLOSURE_BRIEF.md`.
- Independent focused reviews closed the concrete integrity, projection, legacy-downgrade, and output-redaction gaps found before publication; terminal re-review approved the final amendment.

## Reviewer checks

- Confirm transfer and batch commands reject final decisions and revalidate authorization, criterion, target, supersession, and complete batch state under lock.
- Confirm exact criterion bytes and digest survive mutation and match the final technical-plan artifact.
- Confirm linked-worktree generation resolves the primary checkout's canonical run store and fails closed when unavailable or stale.
- Tamper source digest, manifest digest, SPEC rows, slice blocks, PR blocks, finding order, target, criterion, and disposition; verify the relevant gate fails.
- Confirm exact-slice findings appear only in their destination slice while the root PR retains all findings and operationally gates only `phase:pr-review`.
- Insert secret-like criterion, evidence, target, issue, or manifest values and confirm no write or unsafe output occurs.
- Confirm JSON stdout remains one parseable non-localized document and failures exit nonzero.

## Rollback

After merge, revert the merge or squash commit without rewriting history:

```bash
git revert <merge-or-squash-commit-sha>
```

Do not manually rewrite `.quiver/runs/**` evidence or generated governance manifests. Slice-06 owns compatibility migration and package rollback/read-mode policy.

## Risks / Notes

- Human merge is required; no release, publish, deployment, or auto-merge is included.
- Canonical run state remains the only mutable authority; generated manifests and Markdown are immutable projections.
- Slice-06 remains responsible for legacy migration, downgrade guard integration, and final cross-command/documentation convergence.
