# Quiver v0.22 Spec Status

**Spec:** quiver-v22-deferred-tooling
**Last updated:** 2026-04-23

Slice numbering is local to this spec. The first slice is `slice-01`.

## Status

| Slice | Title | Status | PR | Estimated hours | Actual hours |
|-------|-------|--------|----|-----------------|--------------|
| slice-01 | `quiver:fork-slice` Command | Draft (deferred) | - | 3 | - |
| slice-02 | `quiver:squash-spec` Command | Draft (deferred) | - | 3 | - |
| slice-03 | `quiver:share` Command | Draft (deferred) | - | 4 | - |

## Progress

- Completed slices: 0 / 3
- Estimated hours: 10
- Actual hours: -

## Blockers

| Slice | Blocker | Since | Action needed |
|-------|---------|-------|---------------|
| slice-01 | Needs ≥1 real case of a slice that grew too big | 2026-04-23 | Record occurrences in BACKLOG.md |
| slice-02 | Needs ≥1 archived spec large enough to warrant squashing | 2026-04-23 | Wait for v21 to land and the archive to fill |
| slice-03 | Needs ≥1 real handoff that required packaging beyond `HANDOFF.md` | 2026-04-23 | Record occurrences in BACKLOG.md |

## Dependencies

- slice-03 depends on `quiver-v20-context-diagnostics/slice-03-replay-command`
- slice-02 depends on `quiver-v21-slice-archaeology/slice-01-archive-command`
