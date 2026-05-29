## Title

Quiver v37 CLI i18n foundation

## Summary

- Adds the shared foundation for Spanish and English CLI output.
- Persists the configured language so users do not need flags after setup.
- Keeps JSON output stable and non-localized.
- Adds the approved follow-up i18n specs v38-v43 as the program roadmap.

## Scope

- Language resolution and config persistence.
- Message catalogs and translation helpers.
- `config language` commands.
- Localized help/parser/early errors.
- Docs and validation for the i18n foundation.
- Roadmap specs for read-only commands, setup/onboarding, spec/slice workflows, AI lifecycle, generated docs, and release readiness.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/config.js`
- `src/create-quiver/lib/i18n/**`
- `tests/commands/cli-contract.test.js`
- `tests/commands/config-language.test.js`
- `tests/lib/i18n-catalog.test.js`
- `tests/lib/i18n-language.test.js`
- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `docs/INDEX.md`
- `specs/quiver-v37-cli-i18n-foundation/**`
- `specs/quiver-v38-cli-i18n-read-only-commands/**`
- `specs/quiver-v39-cli-i18n-setup-onboarding/**`
- `specs/quiver-v40-cli-i18n-spec-slice-workflows/**`
- `specs/quiver-v41-cli-i18n-ai-lifecycle/**`
- `specs/quiver-v42-cli-i18n-generated-docs/**`
- `specs/quiver-v43-cli-i18n-audit-release-readiness/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Repository checked out on macOS, Linux, or Windows-compatible shell.

### Worktree Access

- This PR is based on `main`.
- No external services are required for local validation.

### Run the Project

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js --lang es --help
node bin/create-quiver.js config language show
node bin/create-quiver.js config language set es --json
node bin/create-quiver.js version --json
```

### Use Cases

1. Run `node bin/create-quiver.js --lang es --help` and verify headings/descriptions are in Spanish while commands and flags remain exact.
2. Run `QUIVER_LANG=es node bin/create-quiver.js --unknown-flag` and verify the early parser error is localized.
3. Run `node bin/create-quiver.js version --json --lang es` and verify stdout remains parseable JSON with stable field names.
4. Run `node bin/create-quiver.js config language set es` in a temp project and verify `.quiver/config.json` stores `language: "es"` without deleting existing keys.

### Technical Verification

```bash
node --test tests/**/*.test.js
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict
npm run package:quiver
npm run smoke:create-quiver
```

## Evidence

- `node --test tests/**/*.test.js` passed with 549 tests.
- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict` passed.
- `npm run package:quiver` passed.
- `npm run smoke:create-quiver` passed.

## Rollback

- Revert this PR.
- Remove `.quiver/config.json` language entries only if a local project used the new `config language set` command during manual testing.

## Risks / Notes

- Parser-level errors can bypass command-local i18n if the foundation is not wired before dispatch.
- JSON contracts must remain stable across languages.
- v38-v43 are specs only in this PR; command-specific migrations remain pending by design.
