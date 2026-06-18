# PR - slice-02 Budget + Command Recommendation

## Summary

- Adds budget calculation for safe missing evidence.
- Adds recovery caps and `scope_required` fallback.
- Adds one-line command builder that preserves relevant flags and drops transient flags.
- Keeps unsafe and metadata-only evidence out of budget expansion.

## Validation

- PASS `node --test tests/lib/ai-analyze-project-recovery.test.js`
