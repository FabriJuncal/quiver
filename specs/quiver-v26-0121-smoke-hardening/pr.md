## Title
Quiver v26 - 0.12.1 Smoke Hardening

## Summary

- Hardens the `0.12.0` AI-first workflow based on a clean npm smoke test.
- Fixes CLI discoverability, version output, generated docs, AI review guidance, local validation, brief validation, and demo readiness.
- Prepares `0.12.1` release evidence before the next real dogfooding project.

## Scope

- Product implementation for v26 slices from `slice-01` through `slice-07`.
- Documentation, tests, smoke coverage, candidate package validation, and source-of-truth sync.
- No npm publication is included in the PR itself.

## Files

- `README.md`
- `README_FOR_AI.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`
- `src/create-quiver/**`
- `docs/**`
- `scripts/ci/**`
- `specs/quiver-v25-ai-first-lifecycle-orchestrator/STATUS.md`
- `specs/quiver-v26-0121-smoke-hardening/**`
- `tests/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Git checkout with the v26 branch.
- No AI provider credentials are required for dry-run and prompt-only validation.

### Worktree Access

- Run commands from the repository root.
- Candidate package smoke should run from `/private/tmp` or another clean directory outside the repo.

### Run the Project

```bash
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run smoke:guided-workflow
npm run smoke:doctor-fixtures
git diff --check
```

### Use Cases

- Print package version with top-level `--version`.
- Discover commands with `--help`, `help`, and local `quiver --help`.
- Initialize a clean project and run `analyze`, `doctor`, and `flow`.
- Validate local slices and slice briefs without remote/base assumptions.
- Generate and validate the `spec-viewer` demo.
- Run scoped `plan` and `graph` without OOM in this repo.

### Technical Verification

```bash
npm --cache /private/tmp/quiver-npm-cache pack --pack-destination /private/tmp/quiver-v26-tarball-smoke
cd /private/tmp/quiver-v26-tarball-project-0121
npm --cache /private/tmp/quiver-npm-cache install -D /private/tmp/quiver-v26-tarball-smoke/create-quiver-0.12.1.tgz
npx create-quiver --version
npx create-quiver --help
npx create-quiver init --name "Tarball Smoke Project" --skip-install
npx create-quiver analyze
npx create-quiver doctor
npx create-quiver flow
npx create-quiver ai onboard --dry-run
npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
npx create-quiver demo create spec-viewer --dir ./demo
cd demo
node scripts/validate-demo.js
```

## Evidence

- See `specs/quiver-v26-0121-smoke-hardening/EVIDENCE_REPORT.md`.

## Rollback

- Revert the v26 slice commits in reverse order.
- No npm publication occurs as part of the PR.

## Risks / Notes

- Top-level `--version` must not break AI draft approvals.
- Help output should be covered by tests to prevent command drift.
- Demo port fallback must work cross-platform or provide clear cross-platform instructions.
- Standard `npm pack` failed locally because `~/.npm` contains root-owned cache files; candidate package validation passed with an isolated temp cache.
