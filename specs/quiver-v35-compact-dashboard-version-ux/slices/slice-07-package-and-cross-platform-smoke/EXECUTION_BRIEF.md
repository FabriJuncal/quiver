# EXECUTION_BRIEF - slice-07 Package and cross-platform smoke

## Context

Repo-local `node bin/create-quiver.js` can pass while an installed package or binary alias fails. This slice closes that production-like gap.

## Objective

Validate compact dashboard and version UX from an installed tarball using both `create-quiver` and `quiver`.

## Scope

- package smoke scripts
- cross-platform smoke script
- package contents validation
- final evidence updates

## Acceptance Criteria

- Installed `create-quiver version` works.
- Installed `quiver version` works.
- Installed `create-quiver --version` remains semver-only.
- Installed `dashboard` and `dashboard --json` work in a temp project.
- Package contents are intentional if `docs/INDEX.md` or `.npmignore` changed.
- Evidence records exact commands and outcomes.

## Technical Plan Summary

Extend existing package-installed smoke coverage so it exercises new command behavior and binary aliases, not only repo-local Node execution.

## Suggested Steps

1. Build local tarball.
2. Install tarball into a temp installer root.
3. Execute installed `create-quiver` and `quiver` binaries.
4. Validate version and dashboard outputs.
5. Validate package contents.
6. Record evidence.

## Restrictions

- Do not publish npm.
- Do not rely only on repo-local `node bin/create-quiver.js`.

## Completion Checklist

- [ ] Installed package smoke added.
- [ ] Binary alias validated.
- [ ] Package contents validated.
