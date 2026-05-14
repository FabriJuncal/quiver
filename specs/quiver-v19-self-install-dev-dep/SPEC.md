# Quiver v19 — Self-Install as Dev Dependency

**Date:** 2026-05-14
**Status:** Active

Slice numbering resets here. This spec starts at `slice-01`.

## Problem

`npx create-quiver` uses the global npx cache. After init, commands like `quiver:plan`, `quiver:graph`, and `quiver:next` in the target project may silently run the cached version instead of the latest — or fail entirely if the version in cache predates those commands. The user has no `create-quiver` in their `node_modules` unless they install it manually.

## Objective

After `npx create-quiver --name "foo"` (init) or `npx create-quiver migrate`, the target project's `package.json` has `create-quiver` in `devDependencies` and it is installed in `node_modules`. Subsequent `npx create-quiver` invocations in that project resolve to the local version — no cache issues, reproducible across machines.

## Scope

### Included

- Detect the package manager in use (yarn, pnpm, bun, npm) by checking lockfiles
- Run the appropriate install command (`npm install -D`, `yarn add -D`, `pnpm add -D`, `bun add -d`) with the exact running version
- Skip if `create-quiver` is already present in `devDependencies`
- Skip gracefully if no `package.json` exists in the target project
- Add `--skip-install` flag to the CLI for CI environments
- Apply to both `init` and `migrate` flows
- Tests for `detectPackageManager` and `installSelfAsDevDep`

### Excluded

- Changing any other part of the init/migrate scaffold output
- Supporting non-standard registries or private npm configurations
- Auto-updating an existing create-quiver devDependency to a newer version

## Acceptance Criteria

1. After init, `cat package.json | jq .devDependencies` shows `"create-quiver": "^X.Y.Z"`
2. `node_modules/create-quiver` exists in the target project after init
3. `npx create-quiver plan` (no `@version`) works immediately after init
4. If target project has no `package.json` → no crash, warning printed, init continues
5. If `create-quiver` already in `devDependencies` → step skipped, no duplicate install
6. `npx create-quiver --skip-install --name "foo"` → installs Quiver docs but skips npm install
7. `npx create-quiver migrate --skip-install` → same skip behavior
8. yarn/pnpm/bun projects get the right install command
9. If install fails (no network, etc.) → warning printed, init completes without crashing
10. `node --test tests/**/*.test.js` passes

## Slices

| Slice | Title | Status |
|-------|-------|--------|
| slice-01 | Auto-install create-quiver as dev dependency | Ready |
