# Quiver v0.14 Spec Status

**Spec:** quiver-v14-tiered-context-pack
**Last updated:** 2026-04-23

Slice numbering is local to this spec. The first slice is `slice-01`.

## Status

| Slice | Title | Status | PR | Estimated hours | Actual hours |
|-------|-------|--------|----|-----------------|--------------|
| slice-01 | Tiered Context Pack | Completed | - | 4 | 4 |
| slice-02 | AGENTS.md Router | Completed | #38 | 3 | 3 |
| slice-03 | Active Slice Lifecycle | Completed | - | 4 | 4 |
| slice-04 | Dedup and Front-Matter | Completed | - | 4 | 5 |
| slice-05 | Doctor and Smokes for Tiered Pack | Completed | - | 4 | 5 |

## Progress

- Completed slices: 5 / 5
- Estimated hours: 23
- Actual hours: 21

## Blockers

| Slice | Blocker | Since | Action needed |
|-------|---------|-------|---------------|
| - | - | - | - |

## Dependencies

- slice-02 depends on slice-01 (AGENTS.md routes to the tiers created in slice-01)
- slice-03 depends on slice-02 (ACTIVE_SLICE is referenced from AGENTS.md)
- slice-04 depends on slice-01 (front-matter is applied to the tiered files)
- slice-05 depends on slices 01-04 (validates the full pack)
