# EXECUTION_BRIEF - slice-02 Event writer and redacted logs

## Context

Provider output can contain secrets, ANSI redraw controls, and large logs. The writer must make persisted artifacts safe before provider streaming and watch are wired.

## Objective

Implement append-only event and log writing with redaction, sanitization, monotonic sequence numbers, concurrent-read tolerance, and log truncation.

## Scope

- Event writer module
- Redacted stdout/stderr log appenders
- Chunk-aware redaction
- ANSI/control character sanitization
- Log caps and `log_truncated` events
- Tests for concurrent/partial reads and split secrets

## Acceptance Criteria

- Event `seq` is monotonic per run.
- Events are append-only JSONL.
- Watchers can read while the writer appends.
- Secrets split across chunks are redacted before persistence.
- ANSI and unsafe control chars are sanitized.
- Log caps produce `log_truncated`.

## Technical Plan Summary

Build the persistence layer independent of provider execution so later slices can reuse it.

## Restrictions

- Do not modify provider execution yet.
- Do not implement watcher CLI yet.

## Completion Checklist

- [ ] Event writer added.
- [ ] Redacted log appenders added.
- [ ] Split secret tests pass.
- [ ] Partial JSONL read tests pass.
