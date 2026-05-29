# Cross-Platform Smoke Matrix - Quiver v43

## Scope

This matrix defines the reproducible i18n smoke commands for supported shells and records what was executed in this environment.

## Commands

| Platform or shell | Commands |
|---|---|
| macOS Bash/zsh | `node scripts/ci/smoke-cross-platform.js`; `npm run smoke:create-quiver` |
| Linux Bash | `node scripts/ci/smoke-cross-platform.js`; `npm run smoke:create-quiver` |
| Windows PowerShell | `node .\scripts\ci\smoke-cross-platform.js`; `npm run smoke:create-quiver` |
| Windows Git Bash/WSL | `node scripts/ci/smoke-cross-platform.js`; `npm run smoke:create-quiver` |

## Coverage Requirements

| Requirement | Coverage |
|---|---|
| Project config language without repeated flags | `smoke-cross-platform.js` sets project language to `es` and runs `dashboard` without `--lang`. |
| `--lang` override | `smoke-cross-platform.js` runs `dashboard --lang en` over an `es` project config. |
| `QUIVER_LANG` override | `smoke-cross-platform.js` runs `dashboard` and `config language show --json` with `QUIVER_LANG=en`. |
| Paths with spaces | `smoke-cross-platform.js` creates `ai path project`, `language home`, and `requirements with spaces.md`. |
| JSON parseability | `smoke-cross-platform.js` parses `config language show --json` and `dashboard --json`. |
| Windows path behavior | `smoke-cross-platform.js` calls the Windows separator guard; `tests/lib/paths.test.js` covers win32, extended path, and Git Bash drive path normalization. |

## Executed Evidence

| Environment | Status | Evidence |
|---|---|---|
| macOS Darwin arm64 | PASS | `node scripts/ci/smoke-cross-platform.js`; `npm run smoke:create-quiver`; `node --test tests/lib/paths.test.js tests/commands/config-language.test.js tests/commands/dashboard.test.js` |
| Linux Bash | Approved exception | Docker CLI is installed, but Docker daemon was unavailable in this environment. Same smoke commands are defined above for CI or a Linux runner. |
| Windows PowerShell | Approved exception | `pwsh` is not installed in this macOS environment. Path behavior is covered by Node win32 tests; shell execution commands are defined above. |
| Windows Git Bash/WSL | Approved exception | Git Bash/WSL is not available in this macOS environment. Git Bash path behavior is covered by `tests/lib/paths.test.js`; shell execution commands are defined above. |

