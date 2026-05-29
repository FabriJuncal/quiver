# Quiver v43 - CLI i18n Audit and Release Readiness

**Date:** 2026-05-28
**Status:** In progress
**Source:** Final audit stage of the approved CLI i18n program.

## Problem

Partial i18n migrations are easy to miss because command output varies by language, mode, TTY, JSON, CI, and error state. The program needs a final audit before release.

## Objective

Validate that Quiver has complete Spanish and English support across the documented CLI surface without regressing automation or packaging.

## Scope

### Included

- Command x language x mode audit matrix.
- Public string audit for hardcoded human English/Spanish outside catalogs.
- Cross-platform smoke plan for macOS, Linux, Windows PowerShell, Git Bash/WSL, and paths with spaces.
- Package and release-readiness validation.
- Documentation of any explicitly accepted temporary exceptions.

### Excluded

- Implementing missing command localization directly inside the audit slice; gaps must be fixed in the owning earlier spec or a new targeted slice.
- Live provider credential tests.

## Acceptance Criteria

1. Every documented command is classified in a command x language x mode matrix.
2. All critical command/mode/language cells are covered by automated tests or documented smoke evidence.
3. Hardcoded human output outside i18n catalogs is either removed, localized, or explicitly approved as a literal/stable token.
4. JSON/JSONL outputs are verified as stable and parseable.
5. Cross-platform smoke evidence covers macOS, Linux, Windows PowerShell, Git Bash/WSL, and paths with spaces where feasible.
6. Package dry-run and smoke pass.
7. Release notes document user-facing language behavior.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Audit foundation | completed | none |
| slice-01 | Command language mode matrix | completed | v37-v42 complete |
| slice-02 | Public string audit | completed | slice-01 |
| slice-03 | Cross-platform smokes | planned | slice-02 |
| slice-04 | Package release readiness | planned | slice-03 |

## Guardrails

- Do not hide gaps as warnings if they affect configured-language UX.
- Prefer fixing missing localization in the owning spec/slice rather than adding one-off patches in the audit.
- Keep release readiness evidence reproducible.
