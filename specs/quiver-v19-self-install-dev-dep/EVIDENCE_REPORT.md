# Quiver v19 — Evidence Report

**Spec:** quiver-v19-self-install-dev-dep
**Date:** 2026-05-14
**Status:** Completed

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | PR #60 merged 2026-05-14. 40/40 tests pass. Smoke: `--skip-install` no instala, sin flag instala `create-quiver@0.9.0` + `devDependencies: {"create-quiver":"^0.9.0"}`. `npx create-quiver plan` exit 0 sin `@version`. Published as `create-quiver@0.9.0`. |

## Required Final Evidence

- `npx create-quiver --name "test-project" --dir /tmp/test-project` → `cat /tmp/test-project/package.json | grep create-quiver` returns a devDependency entry
- `ls /tmp/test-project/node_modules/create-quiver` → directory exists
- `npx create-quiver plan` inside `/tmp/test-project` → exits 0 without `@version`
- `npx create-quiver --skip-install --name "ci-project" --dir /tmp/ci-project` → no `node_modules/create-quiver`
- `node --test tests/**/*.test.js` → all pass
