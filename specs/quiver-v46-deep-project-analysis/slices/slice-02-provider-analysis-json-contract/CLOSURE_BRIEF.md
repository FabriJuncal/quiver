# CLOSURE_BRIEF - slice-02 Provider analysis JSON contract

## Summary

Implemented provider-backed analysis for `ai analyze-project` without documentation writes. Live mode builds a redacted evidence prompt, runs privacy preflight before provider execution, requires JSON-only output, validates schema, validates evidence paths against the selected sample, downgrades confirmed claims backed by truncated files, and returns a redacted size-limited provider artifact in memory/stdout.

## Validation

- [x] `node --test tests/commands/ai-analyze-project-provider.test.js`
- [x] `node --test tests/lib/ai-analyze-project-schema.test.js`
- [x] `node --test tests/lib/ai-analyze-project-parser.test.js`
- [x] `node --test`
- [x] `git diff --check`

## Closure Notes

- Provider failure, timeout-style non-ok results, malformed JSON, invalid schema, invalid evidence paths, and unapproved doc update paths fail before any filesystem write.
- `confirmed`, `inferred`, and `conflict` conclusions require evidence from the selected sample. `unknown` may omit evidence.
- Claims citing truncated files cannot remain `confirmed`; they are downgraded to `inferred` with validation warnings.
- Provider artifacts are redacted and size-limited but not persisted in this slice. Persistence/snapshots are deferred to slice-03.
- Doc update proposal content is validated as JSON data only; converting it into files is deferred to slice-03.
