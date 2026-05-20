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
- `src/create-quiver/lib/doctor.js`
- `src/create-quiver/lib/state.js`
- `src/create-quiver/lib/ai/context-packs.js`
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

- Default init creates the AI-first visible contract without root `docs-template/`, `tools/scripts/`, or placeholder specs.
- `--minimal` creates only the essential onboarding contract.
- `--full` preserves broad legacy-compatible assets explicitly.
- `--legacy-scripts` adds Bash wrappers intentionally.
- `--include-templates` exports templates under `.quiver/templates/`.
- `analyze` writes `.quiver/scans/PROJECT_SCAN.json` and keeps `docs/PROJECT_MAP.md` visible.
- `doctor`, `plan`, `graph`, and `next` handle projects with no specs yet.
- Legacy scan and layout paths remain readable or migratable.

### Technical Verification

- `node --test tests/**/*.test.js` passed: 136 tests.
- `npm run smoke:create-quiver` passed.
- `bash scripts/ci/smoke-init-docs.sh` passed.
- `node scripts/ci/smoke-cross-platform.js` passed.
- `npm run smoke:tiered-pack` passed.
- `git diff --check` passed.

## Evidence

- Default/minimal init coverage asserts no root `docs-template/`, no `tools/scripts/`, and no placeholder spec.
- Evidence details are recorded in `specs/quiver-v21-ai-first-layout/EVIDENCE_REPORT.md`.
- Slice status is recorded in `specs/quiver-v21-ai-first-layout/STATUS.md`.

## Rollback

- Revert this PR to restore the previous generated layout behavior.
- Existing projects can continue using legacy-compatible paths via `migrate`, `--full`, `--legacy-scripts`, or `--include-templates`.

## Risks / Notes

- Existing projects that depend on legacy generated paths should use `migrate`, `--full`, `--legacy-scripts`, or `--include-templates` intentionally.
- CI is still the final multi-OS verification gate before npm publication.
- Do not publish npm until this PR is merged and CI is green.
