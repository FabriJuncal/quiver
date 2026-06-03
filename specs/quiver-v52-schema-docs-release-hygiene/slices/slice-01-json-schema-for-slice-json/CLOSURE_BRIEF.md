# CLOSURE_BRIEF - slice-01 JSON Schema for slice.json

## Summary

Published a real `slice.json` schema and validation path aligned with current runtime behavior.

- Added `docs/schema/slice.schema.json` as JSON Schema Draft-07.
- Added `npm run schema:slice:check` backed by AJV.
- Validated runtime-valid real fixtures under `specs/**` and `examples/**`.
- Added representative invalid fixtures for missing required fields, empty `files`, incomplete git metadata, and unsafe paths.
- Documented schema usage in `docs/reference/slice-schema.md` and linked it from `docs/INDEX.md`.
- Required the public schema and reference doc in package smoke.

## Validation

- [x] `npm run schema:slice:check`
- [x] `node --test tests/schema/slice-schema.test.js`
- [x] `npm run docs:check`
- [x] `npm run package:quiver`
- [x] `npm ci`
- [x] `node --test`
- [x] `git diff --check`

## Closure Conditions

- [x] Schema created and valid.
- [x] Fixtures validate/reject correctly.
- [x] Docs and package smoke updated.
- [x] Schema source-of-truth decision documented.
- [x] Package smoke includes the public schema.

## Open Items

- None.
