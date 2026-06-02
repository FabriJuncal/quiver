# EXECUTION_BRIEF - slice-01 runtime minimum and package metadata

## Context

The audit requires `engines.node`, but declaring it without evidence can reject valid users or accept unsupported runtimes.

## Objective

Verify and declare the real minimum supported Node.js version.

## Scope

- Node minimum validation.
- `engines.node`.
- Lockfile synchronization.
- Installation docs.
- CI coverage for the minimum where feasible.

## Acceptance Criteria

- The declared Node minimum is backed by validation evidence.
- `package.json` and `package-lock.json` are synchronized.
- `npm ci` passes.
- Installation docs mention the supported Node version.
- CI covers the minimum Node version or records an explicit blocker.

## Expected Files To Modify

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/getting-started/installation.md`
- `.github/workflows/ci.yml`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`

## Validations Required

- `npm ci`
- `node --test`
- `git diff --check`

## Risks

- Declaring an unverified runtime minimum.
- Forgetting lockfile updates.
- CI using only a newer Node version.

## Dependencies

- Depends on `slice-00-audit-baseline-and-resolved-findings`.

## Instructions For Executor

1. Determine the lowest Node version that actually supports the project.
2. Only then add `engines.node`.
3. Update docs and lockfile together.
4. Record validation evidence.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Runtime metadata is truthful and reproducible.
