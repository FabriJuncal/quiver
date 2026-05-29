# Quiver v39 - CLI i18n Setup and Onboarding

**Date:** 2026-05-28
**Status:** Planned
**Source:** Continuation of the approved CLI i18n program.

## Problem

Setup commands define how a project starts using Quiver. Language selection must be easy during init and then persist automatically.

## Objective

Localize setup and onboarding commands while making `init --interactive` the primary place to choose project language.

## Scope

### Included

- `init`, especially `init --interactive`.
- `migrate`, `analyze`, and `ai prepare-context`.
- Demo/evidence onboarding outputs when they are human-facing CLI messages.
- Human output, `--dry-run`, no-TTY/CI, `--no-color`, and supported `--json` behavior.

### Excluded

- Full generated documentation localization; v42 owns that.
- Provider-backed planning/execution; v41 owns that.

## Acceptance Criteria

1. `init --interactive` asks for language when language is not already configured.
2. The selected language is stored in `.quiver/config.json`.
3. Subsequent commands use the configured language without `--lang`.
4. `init`, `migrate`, `analyze`, and `ai prepare-context` human outputs support `en` and `es`.
5. Dry-run output remains localized but does not write files.
6. JSON output remains schema-stable and non-localized.
7. Non-interactive setup never blocks waiting for language input.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Setup foundation | completed | none |
| slice-01 | Init interactive language | planned | v37 complete |
| slice-02 | Analyze, migrate, and prepare-context | planned | slice-01 |
| slice-03 | Demo, evidence, and onboarding messages | planned | slice-01 |
| slice-04 | Setup tests and smokes | planned | slice-02, slice-03 |

## Guardrails

- Do not prompt in CI/no-TTY unless `--interactive` is explicitly valid and a TTY exists.
- Do not overwrite existing config keys when storing language.
- Keep generated docs routing separate from command output.
