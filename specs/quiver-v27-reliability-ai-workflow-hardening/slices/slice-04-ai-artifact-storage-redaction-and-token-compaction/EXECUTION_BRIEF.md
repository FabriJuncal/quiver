# EXECUTION BRIEF - slice-04: AI artifact storage, redaction, and token compaction

## Context

Pixel Quiver showed drafts polluted with provider logs and `ai revise` failures caused by very large accumulated context. This slice hardens AI artifact persistence and token control.

## Objective

Persist clean drafts, store raw logs separately, redact sensitive values, and compact oversized feedback safely.

## Scope

- AI provider/output handling
- Approval draft persistence
- Raw log storage
- Redaction and package safety
- Token compaction for revise/review flows

## Acceptance Criteria

- Drafts contain clean useful AI output.
- Raw logs are separated and redacted.
- Oversized inputs are compacted or rejected before provider execution.
- Approved version metadata remains explicit.
- Package safety covers raw AI artifacts.

## Technical Plan Summary

Add output extraction, raw transcript storage, redaction, size checks, compaction logic, and regression tests.

## Suggested Execution Steps

1. Inspect AI provider and approval persistence paths.
2. Add clean/raw separation.
3. Add redaction and package-safety rules.
4. Add size checks and compaction.
5. Test contaminated provider output and long feedback inputs.

## Restrictions

- Do not store credentials.
- Do not weaken approval gates.

## Risks

- Over-compaction can remove important constraints; preserve decisions, risks, files, and criteria.

## Completion Checklist

- [ ] Clean draft behavior implemented.
- [ ] Raw logs separated and redacted.
- [ ] Compaction covered by tests.
- [ ] Package safety updated.
- [ ] Validation commands passed.

