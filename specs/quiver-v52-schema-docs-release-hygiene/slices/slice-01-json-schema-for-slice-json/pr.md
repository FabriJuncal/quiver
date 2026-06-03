# PR - QUIVER-52-01 - JSON Schema for slice.json

## Title

QUIVER-52-01 JSON Schema for slice.json

## Summary

Publishes a Draft-07 JSON Schema for executable Quiver `slice.json` files and adds an AJV-backed validation check. The schema is derived from current runtime validation/generation behavior, validates real runtime-valid fixtures, rejects representative invalid fixtures, and is required in package smoke as a public artifact.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: schema artifact, validation script, tests, docs, package smoke, and slice metadata.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Add `docs/schema/slice.schema.json` as JSON Schema Draft-07.
- Add `npm run schema:slice:check`.
- Add AJV as a direct devDependency and synchronize `package-lock.json`.
- Validate runtime-valid real fixtures from `specs/**` and `examples/**`.
- Reject representative invalid fixtures.
- Document schema usage and runtime source-of-truth boundaries.
- Require the public schema and schema reference doc in package smoke.
- Update v52 status, evidence, closure, slice metadata, and PR body.

## Files

- `docs/INDEX.md`
- `docs/reference/slice-schema.md`
- `docs/schema/slice.schema.json`
- `package.json`
- `package-lock.json`
- `scripts/ci/check-slice-schema.js`
- `scripts/package-quiver.sh`
- `tests/fixtures/slice-schema/invalid/empty-files.json`
- `tests/fixtures/slice-schema/invalid/missing-git-field.json`
- `tests/fixtures/slice-schema/invalid/missing-slice-id.json`
- `tests/fixtures/slice-schema/invalid/unsafe-allowed-write-path.json`
- `tests/schema/slice-schema.test.js`
- `specs/quiver-v52-schema-docs-release-hygiene/SPEC.md`
- `specs/quiver-v52-schema-docs-release-hygiene/STATUS.md`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-01-json-schema-for-slice-json/slice.json`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-01-json-schema-for-slice-json/CLOSURE_BRIEF.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-01-json-schema-for-slice-json/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-52-01-v52-slice-json-schema
```

### Run the Project

No runtime server is required. This is schema, validation tooling, docs, tests, package smoke, and spec evidence.

### Use Cases

#### Case 1: validate real slice fixtures

1. Run `npm run schema:slice:check`.
2. Inspect the summary.

**Expected result:** runtime-valid `specs/**` and `examples/**` fixtures pass, placeholder templates are skipped, and representative invalid fixtures fail.

#### Case 2: use schema in docs

1. Open `docs/reference/slice-schema.md`.
2. Confirm it links to `docs/schema/slice.schema.json`.
3. Run `npm run docs:check`.

**Expected result:** docs lint and link checks pass with the schema reference included.

#### Case 3: package includes public schema

1. Run `npm run package:quiver`.
2. Inspect the package smoke output.

**Expected result:** package smoke passes and requires `package/docs/schema/slice.schema.json` plus `package/docs/reference/slice-schema.md`.

#### Case 4: representative invalid fixture rejection

1. Run `node --test tests/schema/slice-schema.test.js`.
2. Inspect the invalid fixtures under `tests/fixtures/slice-schema/invalid`.

**Expected result:** missing `slice_id`, missing git metadata, empty `files`, and unsafe traversal path fixtures are rejected by AJV.

### Technical Verification

```bash
npm ci
npm run schema:slice:check
node --test tests/schema/slice-schema.test.js
npm run docs:check
npm run package:quiver
node --test
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene
node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-01-json-schema-for-slice-json/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v52-schema-docs-release-hygiene/slices/slice-01-json-schema-for-slice-json/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v52-schema-docs-release-hygiene/slices/slice-01-json-schema-for-slice-json/slice.json --base main
```

## Evidence

- `npm run schema:slice:check`: passed; 266 runtime-valid fixtures validated, 1 historical/non-runtime fixture skipped, 4 invalid fixtures rejected.
- `node --test tests/schema/slice-schema.test.js`: passed, 2 tests.
- `npm run docs:check`: passed, 21 files in docs scope.
- `npm run package:quiver`: passed and required the public schema/doc paths.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm `docs/schema/slice.schema.json`, `schema:slice:check`, AJV dependency changes, schema docs, package smoke requirements, and schema tests are removed.

## Risks / Notes

- The schema is maintained manually from current runtime behavior because Quiver does not yet have a single schema source generator.
- `check-slice --local` still requires non-empty `files`; the schema reflects that stricter executable contract even though newer scope tooling can prefer `allowed_write_paths`.
- Placeholder template slice files are intentionally skipped by schema validation because they contain scaffolding placeholders, not executable slice contracts.
- One historical v18 slice is skipped as non-runtime-valid because it lacks current required execution metadata.
