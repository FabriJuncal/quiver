# CLOSURE_BRIEF - slice-01 runtime minimum and package metadata

## Summary

Declared the supported Node runtime minimum as `>=20.12.0`, synchronized package metadata and lockfile, documented the requirement, and added CI coverage for the exact minimum.

## Validation

- [x] `npm ci`
- [x] `node --test`
- [x] `npx -y node@20.12.0 --test`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`

## Closure Conditions

- [x] Node minimum verified.
- [x] Package metadata and lockfile synchronized.
- [x] Docs updated.
- [x] Evidence recorded.

## Open Items

- None.
