## Title

Quiver v21 - AI-First Layout

## Summary

Redesign Quiver's generated project layout so the default init is small, visible, and AI-first while internal machinery moves under `.quiver/`.

## Scope

- Add init profiles and `init --dry-run`.
- Move internal templates, state, scans, and runtime folders under `.quiver/`.
- Stop generating `docs-template/`, `tools/scripts/`, and placeholder specs by default.
- Preserve full/legacy behavior behind explicit flags.
- Keep `docs/PROJECT_MAP.md` visible while moving raw scan output to `.quiver/scans/PROJECT_SCAN.json`.
- Update doctor, no-spec command behavior, documentation, and smokes.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/init-layout.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/lib/project-scan.js`
- `src/create-quiver/lib/paths.js`
- `src/create-quiver/lib/slice.js`
- `src/create-quiver/lib/doctor.js`
- `src/create-quiver/lib/state.js`
- `src/create-quiver/lib/ai/context-packs.js`
- `scripts/*.sh`
- `scripts/ci/*`
- `tests/**/*.test.js`
- `README.md`
- `README_FOR_AI.md`
- `docs/*.template`
- `specs/quiver-v21-ai-first-layout/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js 22.x recommended.
- npm.
- Git with worktree support.
- macOS/Linux shell for local smokes.
- Windows behavior is covered by `smoke-cross-platform`.

### Worktree Access

Use the dedicated spec branch/worktree:

```bash
git switch docs/QUIVER-21-ai-first-layout
```

### Run the Project

```bash
node bin/create-quiver.js --help
```

### Use Cases

#### Case 1: Default AI-first init

Run `npx create-quiver init --name "Smoke Project"` and confirm it creates the visible onboarding contract without root `docs-template/`, `tools/scripts/`, or placeholder specs.

#### Case 2: Explicit compatibility profiles

Run init with `--minimal`, `--full`, `--legacy-scripts`, and `--include-templates` in isolated directories and confirm each profile creates only its intended assets.

#### Case 3: Analyze and no-spec lifecycle

Run `analyze`, `doctor`, `plan`, `graph`, and `next` on a project with no specs yet. Confirm the raw scan is under `.quiver/scans/PROJECT_SCAN.json`, the visible map stays at `docs/PROJECT_MAP.md`, and lifecycle commands return valid no-spec output.

#### Case 4: Legacy compatibility

Run migrate/doctor against a legacy layout and confirm `docs-template/`, `tools/scripts/`, and legacy `docs/PROJECT_SCAN.json` are preserved or reported as compatibility paths.

### Technical Verification

- `node --test tests/**/*.test.js` passed: 143 tests.
- `npm run smoke:create-quiver` passed.
- `bash scripts/ci/smoke-init-docs.sh` passed.
- `node scripts/ci/smoke-cross-platform.js` passed.
- `npm run smoke:tiered-pack` passed.
- `git diff --check` passed.
- GitHub Actions CI passed on validate, macOS, Ubuntu, and Windows: run `26196340530`.

## Evidence

- Default/minimal init coverage asserts no root `docs-template/`, no `tools/scripts/`, and no placeholder spec.
- Evidence details are recorded in `specs/quiver-v21-ai-first-layout/EVIDENCE_REPORT.md`.
- Slice status is recorded in `specs/quiver-v21-ai-first-layout/STATUS.md`.
- Windows/Git Bash path handling is covered by `tests/lib/paths.test.js`.

## Rollback

- Revert this PR to restore the previous generated layout behavior:

```bash
git revert <merge-commit-sha>
```

- Existing projects can continue using legacy-compatible paths via `migrate`, `--full`, `--legacy-scripts`, or `--include-templates`.

## Risks / Notes

- Existing projects that depend on legacy generated paths should use `migrate`, `--full`, `--legacy-scripts`, or `--include-templates` intentionally.
- npm publication should happen only after this PR is merged.
