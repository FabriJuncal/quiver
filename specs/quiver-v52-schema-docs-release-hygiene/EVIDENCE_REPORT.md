# Evidence Report - Quiver v52 Schema, Docs, and Release Hygiene

## Planning Evidence

- Source requirements: `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.
- Approved plan: user-approved technical plan v4.
- Existing package smoke: `scripts/package-quiver.sh`.
- Existing release script: `scripts/release-quiver.sh`.
- Existing npm package boundary: `.npmignore`.

## Baseline Evidence To Capture During Execution

- `npm pack --dry-run` or `npm run package:quiver`
- package tarball contents
- install tarball in temporary project
- current `docs/reference/commands.md` vs `node bin/create-quiver.js --help`
- current slice JSON validation/generation source
- current changelog `[Unreleased]` state

## Validation Evidence

## slice-00-schema-docs-release-baseline

- `src/create-quiver/commands/spec.js`: current runtime spec/slice validation contains the primary executable checks for `slice.json`.
- `src/create-quiver/lib/ai/spec-generator.js`: current spec generation validates/generates a related subset of `slice.json` fields, so schema behavior is split rather than centralized.
- `docs/reference/commands.md`: current command reference is manually maintained; no generator/drift command exists in `package.json`.
- `.npmignore`: excludes local artifacts such as PDFs, tests, examples, package lock, CI scripts, and common local noise from the npm package.
- `scripts/package-quiver.sh`: current package smoke validates required package contents and rejects unsafe contents.
- `scripts/release-quiver.sh`: current release script requires a clean worktree and runs smoke/package checks before publish guidance.
- `scripts/ci/smoke-create-quiver.sh`: current smoke builds/installs a tarball and validates installed CLI behavior.
- Baseline decision: `slice-01` must derive `slice.schema.json` from current runtime behavior, not from aspirational fields.
- Baseline decision: `slice-02` should use protected generated blocks inside `docs/reference/commands.md`, keeping curated content outside markers.
- Baseline decision: `slice-03` should formalize package boundaries and changelog hygiene without adding automatic npm publish.
- Runtime code was not modified for this baseline slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`: passed.
