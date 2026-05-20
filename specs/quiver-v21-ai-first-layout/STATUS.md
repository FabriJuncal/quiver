# Quiver v21 - AI-First Layout Status

## Status

Draft.

## Summary

This spec defines the cleanup of Quiver's generated project layout. The default init should become AI-first and small, while `.quiver/` owns internal machinery and optional legacy/full assets move behind explicit flags.

## Slice Status

| Slice | Name | Status | Depends On |
| --- | --- | --- | --- |
| slice-00 | Spec foundation | Completed | - |
| slice-01 | Init profiles and dry-run planner | Completed | slice-00 |
| slice-02 | Internal layout and template resolver | Completed | slice-01 |
| slice-03 | Generation profiles and visible contract | Completed | slice-02 |
| slice-04 | Analyze scan relocation | Draft | slice-02 |
| slice-05 | Empty specs and layout doctor | Draft | slice-03, slice-04 |
| slice-06 | Legacy migration and optional assets | Draft | slice-03, slice-04 |
| slice-07 | Documentation and guidance alignment | Draft | slice-05, slice-06 |
| slice-08 | Smokes and release readiness | Draft | slice-07 |

## Current Evidence

- Acceptance criteria approved by user.
- Technical plan approved by user.
- `slice-00` completed with documentation-only artifacts.
- `slice-01` completed with init dry-run planner, explicit init/profile flags, and compatibility alias tests.
- `slice-02` completed with `.quiver/` internal layout helpers and template resolver support.
- `slice-03` completed with profile-aware generation for default, minimal, full, legacy scripts, and template export.
