# Slice JSON Schema

Quiver publishes a JSON Schema for executable `slice.json` files:

- Schema file: [`../schema/slice.schema.json`](../schema/slice.schema.json)
- Check command: `npm run schema:slice:check`

## Source Of Truth

The schema follows the current runtime contract instead of an aspirational model:

- `src/create-quiver/commands/spec.js` validates spec and slice structure.
- `src/create-quiver/lib/slice.js` reads slice metadata for lifecycle commands.
- `src/create-quiver/lib/readiness.js` validates local execution and PR readiness.
- `src/create-quiver/lib/ai/spec-generator.js` generates and validates generated slice JSON.

`check-slice --local` still requires a non-empty `files` array. Newer scope tooling can prefer `allowed_write_paths` when it is present, but `files` remains part of the executable contract for now.

## Validate Local Slices

Run:

```bash
npm run schema:slice:check
```

The check validates runtime-valid `specs/**/slices/**/slice.json` and `examples/**/slices/**/slice.json` fixtures, skips placeholder templates, and verifies representative invalid fixtures fail.

## Editor Usage

Use this schema in editors or external validation tools by pointing them at:

```txt
docs/schema/slice.schema.json
```

The schema rejects unsafe path values such as absolute paths, `file:` URLs, drive-root paths, and `..` traversal segments.
