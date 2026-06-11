# EXECUTION_BRIEF - slice-02 safe discovery sampling

## Context

The live smoke selected `package-lock.json` and generated Quiver docs too heavily. Sampling must protect privacy, cost, and product-source coverage.

## Objective

Make discovery and sampling deterministic, safe, and source-prioritized.

## Scope

- Add lockfile summaries instead of full lockfile inclusion by default.
- Add source/docs/config/lockfile quotas.
- Exclude unsafe symlinks, secrets, caches, dumps, generated outputs, binaries, dependency folders, and `.quiver`.
- Preserve `--scope` and monorepo behavior.

## Acceptance Criteria

- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, and comparable known lockfiles are summarized by default.
- Sampling reserves product-source budget and caps Quiver-generated docs.
- Unsafe symlinks are not followed.
- Denylisted files are omitted with a clear reason.
- `--dry-run --json` reports lock summaries, quotas, selected files, omitted files, and safety exclusions.

## Completion Checklist

- [ ] Sampling rules implemented.
- [ ] Discovery tests updated.
- [ ] `nika-erp` fixture/sample shows product source prioritized.
- [ ] Closure brief records budget evidence.

## Expected Files To Modify

- `src/create-quiver/lib/ai/analyze-project-discovery.js`
- `src/create-quiver/lib/ai/analyze-project-prompts.js`
- `tests/lib/ai-analyze-project-discovery.test.js`
- `tests/commands/ai-analyze-project.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/lib/ai-analyze-project-discovery.test.js
node --test tests/commands/ai-analyze-project.test.js
git diff --check
```

## Constraints

- Do not weaken secret exclusions.
- Do not read huge lockfiles fully when metadata is sufficient.
- Do not alter provider retry or repair behavior.
