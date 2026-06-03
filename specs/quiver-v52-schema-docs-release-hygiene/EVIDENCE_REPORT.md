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

## slice-01-json-schema-for-slice-json

- `docs/schema/slice.schema.json`: adds a public JSON Schema Draft-07 contract for executable `slice.json` files.
- Source-of-truth decision: schema is maintained manually from current runtime validation and generation behavior in `src/create-quiver/commands/spec.js`, `src/create-quiver/lib/slice.js`, `src/create-quiver/lib/readiness.js`, and `src/create-quiver/lib/ai/spec-generator.js`.
- `scripts/ci/check-slice-schema.js`: adds an AJV-backed validation script that compiles the schema, validates runtime-valid real fixtures, skips placeholder templates and one historical non-runtime fixture, and asserts representative invalid fixtures fail.
- `tests/schema/slice-schema.test.js` and `tests/fixtures/slice-schema/invalid/*.json`: cover schema declaration, real fixture validation, and invalid fixture rejection.
- `docs/reference/slice-schema.md` and `docs/INDEX.md`: document schema usage, source-of-truth boundaries, and the local check command.
- `package.json` and `package-lock.json`: add `schema:slice:check` and direct dev dependency `ajv`.
- `scripts/package-quiver.sh`: requires the public schema and schema reference doc in package smoke.
- `npm run schema:slice:check`: passed; 266 runtime-valid fixtures validated, 1 historical/non-runtime fixture skipped, 4 invalid fixtures rejected.
- `node --test tests/schema/slice-schema.test.js`: passed, 2 tests.
- `npm run docs:check`: passed, 21 files in docs scope.
- `npm run package:quiver`: passed and required `package/docs/schema/slice.schema.json` plus `package/docs/reference/slice-schema.md`.
- `npm ci`: passed on a clean dependency install.
- `node --test`: passed, 648 tests.
- `git diff --check`: passed.

## slice-02-generated-cli-reference

- `scripts/ci/check-command-reference.js`: adds deterministic CLI command reference generation and drift checking without new dependencies.
- Source-of-truth decision: generated command rows are read from `COMMAND_HELP_GROUPS` in `src/create-quiver/index.js` and checked against `node bin/create-quiver.js --lang en --help --no-color`.
- `docs/reference/commands.md`: adds a protected generated block inside `<!-- quiver:generated-cli-reference:start -->` / `<!-- quiver:generated-cli-reference:end -->`; curated documentation outside markers remains manual.
- `package.json`: adds `docs:commands:write`, `docs:commands:check`, and wires `docs:commands:check` into `docs:check` so docs drift can fail CI/release checks without rewriting files.
- `tests/docs/command-reference.test.js`: covers runtime-help consistency, current docs synchronization, and preservation of manual content outside generated markers.
- `npm run docs:commands:write`: passed; generated 7 groups and 59 commands.
- `npm run docs:commands:check`: passed; generated block is synchronized.
- `node --test tests/docs/command-reference.test.js`: passed, 3 tests.
- `node bin/create-quiver.js --help`: passed.
- `npm run docs:check`: passed, including markdown lint, link check, and generated CLI reference drift check.
- `npm ci`: passed; 165 packages installed/audited, 0 vulnerabilities reported.
- `node --test`: passed, 651 tests.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/slice.json --local --gate validation`: passed.

## slice-03-changelog-package-release-smoke-hygiene

- `CHANGELOG.md`: documents v52 schema/docs/release hygiene work under `[Unreleased]`.
- `scripts/ci/check-changelog.js`: adds a no-dependency changelog gate requiring a categorized `[Unreleased]` entry.
- `tests/ci/changelog.test.js`: covers `[Unreleased]` extraction, categorized entries, and failure cases.
- `scripts/package-quiver.sh`: now requires `docs/reference/commands.md`, rejects local audit files, PDFs, tests, examples, worktree/tool state, credentials, key-like files, and CI-only scripts, installs the generated tarball, and verifies installed `--version`, `--help`, and `init --dry-run`.
- `.npmignore`: explicitly excludes local audit inputs, generated PDFs, key-like files, SSH folders, and local noise.
- `scripts/release-quiver.sh`: dry-run now runs changelog, docs, schema, installer, package, and installed CLI gates; publish flags require `QUIVER_ALLOW_NPM_PUBLISH=1`.
- `.github/workflows/ci.yml`: docs job now runs `npm run docs:check`, including generated command-reference drift detection.
- `CONTRIBUTING.md` and `README.md`: document package boundary, changelog, release dry-run, and publish guard expectations.
- `npm run changelog:check`: passed; 22 `[Unreleased]` entries detected.
- `node --test tests/ci/changelog.test.js`: passed, 3 tests.
- `bash -n scripts/package-quiver.sh scripts/release-quiver.sh`: passed.
- `shellcheck scripts/package-quiver.sh scripts/release-quiver.sh`: passed.
- `npm run package:quiver`: passed; generated `create-quiver-0.15.3.tgz` and installed CLI smoke passed.
- `npm run docs:check`: passed, including generated CLI reference drift check.
- `npm run schema:slice:check`: passed; 266 runtime-valid fixtures validated, 1 historical/non-runtime fixture skipped, 4 invalid fixtures rejected.
- `npm ci`: passed; 165 packages installed/audited, 0 vulnerabilities reported.
- `node --test`: passed, 654 tests.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/slice.json --local --gate validation`: passed.
- `npm run release:quiver`: passed; changelog, docs, schema, installer smoke, package smoke, and installed CLI smoke passed before printing manual publish guidance.
