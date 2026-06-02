# EXECUTION_BRIEF - slice-07 CI and documentation lint baseline

## Context

CI exists but must be hardened for production-quality PR validation without introducing flaky docs gates.

## Objective

Harden CI with portable tests, docs lint, link checks, and Windows PowerShell coverage.

## Scope

- GitHub Actions.
- `npm ci`.
- Portable test runner.
- OS matrix and Windows `pwsh`.
- Markdown lint/link check baseline.
- Local check documentation.

## Acceptance Criteria

- CI runs `npm ci`.
- Tests run without shell glob expansion.
- Windows `pwsh` validates a portable path.
- Docs lint/link checks have controlled, non-flaky scope.
- `package-lock.json` is synchronized.
- Local equivalent commands are documented.

## Expected Files To Modify

- `.github/workflows/ci.yml`
- `.markdownlint.json`
- `.markdown-link-check.json`
- `package.json`
- `package-lock.json`
- `CONTRIBUTING.md`
- `scripts/ci/**`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`

## Validations Required

- `npm ci`
- `node --test`
- `npm run package:quiver`
- `git diff --check`

## Risks

- Flaky external link checks.
- PowerShell path failures.
- Unsynchronized lockfile.
- Large unrelated markdown churn.

## Dependencies

- Depends on `slice-01-runtime-minimum-and-package-metadata`.
- Depends on `slice-06-contributor-and-architecture-docs`.

## Instructions For Executor

1. Prefer portable Node-based scripts over shell-specific globs.
2. Keep docs lint scope small and explicit.
3. Document any non-blocking external link check decision.
4. Verify lockfile sync.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- CI is a trustworthy gate without becoming noisy or flaky.
