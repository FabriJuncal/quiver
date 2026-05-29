# Quiver v42 - CLI i18n Generated Docs

**Date:** 2026-05-28
**Status:** In progress
**Source:** Continuation of the approved CLI i18n program.

## Problem

CLI output localization is not enough if Quiver-generated project docs and templates remain locked to one language. Generated docs need explicit language routing without changing machine artifacts.

## Objective

Add Spanish and English support to generated human documentation and templates, using the configured project language by default.

## Scope

### Included

- Generated docs from `init`, `spec create`, demos, and onboarding helpers where content is intended for humans.
- Template language routing for `en` and `es`.
- Docs/reference updates explaining language behavior.
- Tests proving generated docs follow configured language while machine artifacts remain stable.

### Excluded

- Runtime CLI command output already covered by v37-v41.
- Translating JSON, `slice.json`, package metadata, lockfiles, provider prompts, or code comments.

## Acceptance Criteria

1. Generated human docs can be emitted in `en` or `es`.
2. Project config language is used by default.
3. `--lang` can override generated human docs for supported commands.
4. Machine artifacts remain stable and non-localized.
5. Existing templates are not duplicated unnecessarily when shared fragments can be parameterized safely.
6. Docs explain which artifacts are localized and which are intentionally stable.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Generated docs foundation | completed | none |
| slice-01 | Template language routing | completed | v37 complete |
| slice-02 | Init docs and i18n assets | completed | slice-01 |
| slice-03 | Docs reference and guides | planned | slice-01 |
| slice-04 | Generated docs tests and smokes | planned | slice-02, slice-03 |

## Guardrails

- Do not translate schema-like generated files.
- Keep template routing explicit and testable.
- Avoid uncontrolled duplication of large templates.
