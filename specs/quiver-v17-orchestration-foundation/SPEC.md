# Quiver v0.17 - Orchestration Foundation

**Date:** 2026-04-23
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Lay the cross-platform foundation and shared graph library required by every subsequent orchestration command (`plan`, `graph`, `next`, `status`, `estimate`, `lint-spec`, `cost`, `diff-pack`, `replay`, `archive`, `blame-slice`). No user-facing command is shipped here; this spec exists to make the following specs cheap to build and safe on macOS, Linux, and Windows.

## Context

The orchestration roadmap (v18–v22) introduces ~13 new commands that all need to read slices, infer dependencies, compute execution levels, and detect file conflicts. Without a shared library those commands re-implement the same logic three or four times. Without a verified cross-platform CI matrix, any new command is fragile on Windows. This spec consolidates both concerns into one foundation.

## Scope

### Included

- Verify or introduce a CI matrix that runs macOS, Linux, and Windows for all Quiver tests
- Create `src/create-quiver/lib/slice-graph.js` with a stable API: `readAllSlices`, `inferDependencies`, `buildGraph`, `topoSort`, `computeLevels`, `detectFileConflicts`
- Support optional `depends_on` and `parallel_safe` fields in `slice.json`, with heuristic inference as the fallback
- Extend `check-slice` to validate `depends_on` when declared (existence, no cycles, reason when `parallel_safe: "never"`)
- Create `docs/COMMANDS.md` as the canonical command reference table, initially empty beyond the plan row
- Publish cross-platform authoring rules in `docs/SUPPORT_MATRIX.md` for all subsequent commands

### Excluded

- Any user-facing orchestration command (deferred to v18)
- A full slice JSON Schema file (only the new optional fields are validated)
- Parallelism enforcement or locking (library returns groups; commands decide)
- Any change to existing slice contents beyond optional new fields

## Cross-Platform Authoring Rules

Every subsequent orchestration command must follow these rules, enforced by code review and CI:

- No shell invocations for logic — Node.js `fs`, `path`, and `child_process` with `shell: false`
- Paths use `path.join` and `path.sep`; output may normalize to `/` for human readability
- Write files with `\n`; read tolerating `\r\n`
- `--json` is the primary contract; human output is cortesy and may vary
- Colors only when `process.stdout.isTTY && !process.env.NO_COLOR`
- Unicode glyphs only when `process.env.LANG` includes `UTF-8` or the user passes `--unicode`; ASCII fallback otherwise
- Optional external tools (`gh`, `graphviz`) detected with a cross-platform probe; degrade with a clear message if absent

## Graph Library Contract

`src/create-quiver/lib/slice-graph.js` exports:

```js
readAllSlices(rootDir)            // → Slice[] (from specs/*/slices/*/slice.json)
inferDependencies(slices)         // → Slice[] with implicit depends_on[]
buildGraph(slices)                // → { nodes, edges, cycles: [] }
topoSort(graph)                   // → Slice[] (throws on cycle)
computeLevels(graph)              // → Slice[][] (each level is a parallel lot)
detectFileConflicts(slicesInLevel)// → ConflictGroup[]
```

Dependency inference rule: within a single spec, `slice-NN` implicitly depends on all lower-numbered slices in the same spec that share at least one entry in `files[]`. An explicit `depends_on` array in `slice.json` overrides the heuristic.

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Cross-Platform CI Matrix Verified | Completed | [slice-01](./slices/slice-01-ci-matrix-verified/slice.json) |
| 02 | Slice Graph Library | Completed | [slice-02](./slices/slice-02-slice-graph-library/slice.json) |
| 03 | Optional `depends_on` Validation | Draft | [slice-03](./slices/slice-03-depends-on-validation/slice.json) |

## Definition of Done

- `.github/workflows/ci.yml` runs tests on `macos-latest`, `ubuntu-latest`, and `windows-latest` and is green on all three
- `src/create-quiver/lib/slice-graph.js` exists with the six documented exports and tests for each
- `check-slice` rejects `depends_on` entries pointing at nonexistent slices and cycles
- `docs/COMMANDS.md` exists with a header table and a row reserved for the plan command
- `docs/SUPPORT_MATRIX.md` documents the cross-platform authoring rules above

## Validation Checkpoint

Before v18 is started, the graph library must pass its own unit tests on all three OS targets, and a dry-run of `readAllSlices(repoRoot)` against the current Quiver repo must return every existing slice without throwing.
