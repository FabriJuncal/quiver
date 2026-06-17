# EXECUTION_BRIEF - slice-01 Document Classification + Merge Engine

## Objective

Implement the deterministic merge engine for analyze-project docs.

## Context

The current `mergeManagedBlock` preserves the whole document and appends/replaces only the `quiver:analyze-project` block. This leaves scaffold placeholders visible above generated content. Slice 01 must solve the core merge contract before any CLI/output integration.

## Scope

- Add explicit critical placeholder detection for EN/ES Quiver scaffold text.
- Add classification for existing docs.
- Preserve parseable frontmatter.
- Replace scaffold primary content with proposed Markdown.
- Preserve human content.
- Replace existing `quiver:analyze-project` block idempotently.
- Remove or supersede scaffold-only `quiver:context-prep` blocks.
- Add merge metadata to write plan items.

## Acceptance Criteria

- Scaffold docs no longer keep critical placeholders as primary visible content.
- Partial scaffold docs preserve human-completed sections.
- Human docs preserve human text.
- Existing analyze-project block is replaced in place.
- Context-prep scaffold does not remain as confusing primary content.
- Same input/proposal produces stable output across repeated merges.
- Unit tests cover the above.

## Expected Files

- `src/create-quiver/lib/ai/analyze-project-docs.js`
- `tests/lib/ai-analyze-project-docs.test.js`
- `specs/quiver-v56-analyze-project-usable-doc-merge/**`

## Validation

```bash
node --test tests/lib/ai-analyze-project-docs.test.js
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Completion Checklist

- Classification helpers implemented and exported for tests.
- Merge engine replaces scaffold primary content safely.
- Merge engine preserves human content.
- Idempotency tests pass.
- Slice closure brief records validation evidence.

## Constraints

- Do not change provider schema.
- Do not widen the analyze-project doc path allowlist.
- Do not change CLI output in this slice except what write plan metadata naturally exposes to tests.
- Do not implement post-write strict placeholder validation here; that belongs to Slice 02.
