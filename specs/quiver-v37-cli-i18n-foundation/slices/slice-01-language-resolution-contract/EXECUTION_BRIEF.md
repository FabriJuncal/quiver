# EXECUTION_BRIEF - slice-01 Language resolution contract

## Context

Users should configure language once and then receive CLI responses in that language without repeating flags.

## Objective

Implement the language resolution contract and config read/write primitives for `en` and `es`.

## Acceptance Criteria

- Resolution order is `--lang`, `QUIVER_LANG`, project config, global config, locale, `en`.
- `--lang` works before and after the command name.
- Project config is `.quiver/config.json`.
- Global config is `~/.quiver/config.json` resolved with `os.homedir()`.
- Locale detection reads `LC_ALL`, `LC_MESSAGES`, `LANG`, `LANGUAGE`, and `Intl.DateTimeFormat().resolvedOptions().locale`.
- `es_AR`, `es-AR`, `en_US`, and `en-US` normalize correctly.
- Unsupported values fall back to `en` with human-mode guidance.
- `--json` remains stable and does not include localized prose unless an existing schema explicitly allows it.

## Completion Checklist

- [x] Resolver helper implemented.
- [x] Config read/write helper implemented.
- [x] Global flag parser supports before/after command.
- [x] Unit tests cover precedence and locale normalization.
