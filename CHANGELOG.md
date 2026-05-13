# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.8.0] - 2026-05-13

### Added

- `quiver:plan` — lists all pending slices in dependency order with estimated hours, status, and critical path
- `quiver:graph` — visualizes the slice dependency graph in ASCII tree, Mermaid, and DOT formats
- `quiver:next` — suggests the next ready slice; supports `--all-ready`, `--json`, and `--auto-start`
- Slice graph library — `readAllSlices`, `buildGraph`, `topoSort`, `computeLevels`, `detectFileConflicts` for programmatic graph access
- `depends_on` and `parallel_safe` fields with validation in `check-slice`
- JSON-with-comments support for slice templates
- Cross-platform CI matrix covering macOS, Linux, and Windows for the Node-native runtime
- Node-native generated project npm scripts and additive migration support for existing projects

### Fixed

- `quiver:plan` no longer crashes on repos with legacy bare spec names in the `dependencies` field (e.g. `"quiver-v01"`) — these are silently dropped instead of throwing `MISSING_DEPENDENCY`

## [0.4.0] - 2026-04-21

### Added

- `create-quiver` CLI installer surface
- Post-init `doctor` validation mode
- Release helper script and packaged-installer smoke checks

## [0.1.0] - 2026-04-20

### Added

- MIT license
- Portable `init-docs.sh`
- `package.template.json`
- English canonical documentation
- `examples/01-basic-slice/`
- Community health docs and CI
