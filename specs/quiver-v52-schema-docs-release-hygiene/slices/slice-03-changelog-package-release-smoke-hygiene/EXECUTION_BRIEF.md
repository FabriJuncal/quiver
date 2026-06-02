# EXECUTION_BRIEF - slice-03 changelog, package, and release smoke hygiene

## Context

Release confidence requires validating the actual npm tarball and installed CLI, not only local source. New schema/docs/scripts must be included or excluded deliberately.

## Objective

Formalize changelog handling and validate actual npm package installation behavior.

## Scope

- `[Unreleased]` changelog handling.
- `.npmignore`.
- Package safety.
- Tarball contents.
- Installed tarball smoke.
- Release script dry-run gates.

## Acceptance Criteria

- Package smoke validates required public files.
- Package smoke rejects forbidden local artifacts.
- Tarball installs in a temporary project.
- Installed CLI runs `--version`, `--help`, and one safe dry-run command.
- Changelog process is documented.
- npm publish automation remains out of scope unless prerequisites are explicit.

## Expected Files To Modify

- `CHANGELOG.md`
- `.npmignore`
- `scripts/package-quiver.sh`
- `scripts/release-quiver.sh`
- `scripts/ci/**`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`

## Validations Required

- `npm ci`
- `node --test`
- `npm run package:quiver`
- installed tarball smoke
- `git diff --check`

## Risks

- Publishing local audit artifacts or PDFs.
- Excluding required public schema/docs.
- Release script relying on local-only files.

## Dependencies

- Depends on `slice-01-json-schema-for-slice-json`.
- Depends on `slice-02-generated-cli-reference`.

## Instructions For Executor

1. Update package checks after schema/docs decisions are known.
2. Validate the installed tarball, not only source checkout.
3. Keep publish steps manual unless prerequisites are explicitly present.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Release/package checks catch missing required files and forbidden local artifacts before publish.
