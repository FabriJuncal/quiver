# EXECUTION_BRIEF - slice-02 Init docs and i18n assets

## Context

Init-generated docs are the first generated artifacts users see in a new or existing project.

## Objective

Localize init/onboarding human documentation templates and assets.

## Acceptance Criteria

- Init-generated human docs follow configured language.
- `--lang` overrides generated language where supported.
- Machine artifacts such as JSON and package metadata remain stable.
- Existing project docs are not overwritten unexpectedly.

## Completion Checklist

- [ ] Init templates routed.
- [ ] Spanish and English generated-doc tests added.
- [ ] Overwrite behavior preserved.
