# Execution Plan - Quiver v52 Schema, Docs, and Release Hygiene

## Order

1. Execute `slice-00-schema-docs-release-baseline`.
2. Execute `slice-01-json-schema-for-slice-json`.
3. Execute `slice-02-generated-cli-reference`.
4. Execute `slice-03-changelog-package-release-smoke-hygiene`.

## Parallel Execution

- `slice-01` and `slice-02` may run in parallel after `slice-00`.
- `slice-03` must run after `slice-01` and `slice-02` so package/release checks include new schema/docs/scripts.

## Risk Controls

- Validate source of truth before generating schema.
- Protect manual docs content with generated blocks or separated output.
- Validate actual tarball install, not only local source.
- Keep publish automation out of scope unless release secrets and protection are confirmed.

## Required Final Validation

- `npm ci`
- `node --test`
- schema fixture validation
- docs generation drift check
- `npm run package:quiver`
- installed tarball smoke
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`
