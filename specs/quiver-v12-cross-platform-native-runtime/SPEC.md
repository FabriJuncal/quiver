# Quiver v0.12 - Cross-Platform Native Runtime

**Date:** 2026-04-22
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make Quiver run natively on macOS, Linux, and Windows by moving the framework runtime from Bash scripts to Node.js CLI commands.

## Scope

### Included

- Define the official cross-platform support contract for macOS, Linux, Windows PowerShell, and Windows CMD
- Remove Bash as a required runtime dependency for user-facing Quiver commands
- Port generated project initialization and migration from shell scripts to Node.js
- Add Node-native commands for slice lifecycle and readiness gates
- Update generated `package.json` scripts to call `create-quiver` directly
- Keep existing `.sh` scripts as legacy Unix wrappers where useful
- Add cross-platform CI coverage for Linux, macOS, and Windows
- Update docs, support matrix, troubleshooting, and generated project guidance

### Excluded

- Auto-installing Bash, Git Bash, MSYS2, or WSL
- Removing existing Bash wrappers in this spec
- Changing the one slice = one commit or one spec = one PR workflow
- Integrating AI provider execution into the CLI
- Publishing a release as part of this spec

## Target Native Flow

From any supported OS, inside the target project root:

```bash
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
npx create-quiver start-slice specs/app/slices/slice-01/slice.json
npx create-quiver check-slice specs/app/slices/slice-01/slice.json
npx create-quiver check-pr specs/app/slices/slice-01/slice.json
```

`--dir` remains available for explicit out-of-project targeting, but it is not the primary developer path.

## Support Contract

Quiver should support:

- macOS with Terminal shells
- Linux with standard shell environments
- Windows with PowerShell
- Windows with CMD
- Node.js LTS and npm
- Git with `worktree` support

Quiver should not require:

- Bash on Windows
- WSL for normal Windows usage
- executable bits for user-facing commands
- POSIX-only path behavior in generated project workflows

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Cross-Platform Support Contract | Completed | [slice-01](./slices/slice-01-cross-platform-support-contract/slice.json) |
| 02 | Node Init Docs Runtime | Completed | [slice-02](./slices/slice-02-node-init-docs-runtime/slice.json) |
| 03 | Node Migrate, Analyze, and Doctor Flow | Completed | [slice-03](./slices/slice-03-node-migrate-analyze-doctor-flow/slice.json) |
| 04 | Node Slice Lifecycle Commands | Completed | [slice-04](./slices/slice-04-node-slice-lifecycle-commands/slice.json) |
| 05 | Generated Project Scripts and Migration | Draft | [slice-05](./slices/slice-05-generated-project-scripts-and-migration/slice.json) |
| 06 | Cross-Platform CI and Release Readiness | Draft | [slice-06](./slices/slice-06-cross-platform-ci-release-readiness/slice.json) |

## Definition of Done

- New Quiver projects can be initialized without invoking Bash
- Existing Quiver projects can migrate without invoking Bash
- Analyzer and doctor work from PowerShell, CMD, macOS, and Linux
- Slice lifecycle commands have Node-native CLI entrypoints
- Generated `package.json` scripts use `create-quiver` commands instead of `bash tools/scripts/*.sh`
- Existing Unix wrappers still work or clearly point to the new CLI commands
- CI validates core workflows on `ubuntu-latest`, `macos-latest`, and `windows-latest`
- README and generated docs describe Windows native support accurately
