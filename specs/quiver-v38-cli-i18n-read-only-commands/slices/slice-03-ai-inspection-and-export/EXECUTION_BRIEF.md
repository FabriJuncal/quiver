# EXECUTION_BRIEF - slice-03 AI inspection and export read-only commands

## Context

AI inspection commands expose run/spec state without writing files. They should match the same language behavior as other read-only commands.

## Objective

Localize AI read-only commands such as `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, `ai trace report`, and `ai approvals`.

## Acceptance Criteria

- Human output supports `en` and `es`.
- JSON and export payloads remain stable and non-localized.
- Run ids, spec ids, slice ids, providers, and models remain unchanged.
- Missing/empty state messages are localized.

## Completion Checklist

- [x] AI read-only human strings cataloged.
- [x] JSON/export tests preserved.
- [x] Empty/missing-state tests added.
