# Evidence Report - Quiver v50 Audit Trust Foundation

## Planning Evidence

- Source requirements: `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.
- Approved plan: user-approved technical plan v4.
- Repository convention inspected from `specs/quiver-v49-parser-modernization`.

## Baseline Evidence To Capture During Execution

- `node bin/create-quiver.js --help`
- `node --test`
- `npm ci`
- `.github/workflows/ci.yml`
- `package.json` and `package-lock.json`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `docs/CLI_UX_GUIDE.md`
- current command behavior for `migrate`, `init`, `analyze`, i18n errors, JSON/no-TTY/CI flows.

## Validation Evidence

## slice-00-audit-baseline-and-resolved-findings

- `node bin/create-quiver.js --help`: captured current public command surface, compatibility aliases, scoped options, and `--yes` scope.
- `node bin/create-quiver.js migrate --help`: current help falls back to global help and lists `migrate` as dry-run capable.
- `package.json`: no `engines` field is declared; `package-lock.json` exists and must remain synchronized when package metadata changes.
- `src/create-quiver/index.js`: `runMigrate` supports `--dry-run` and emits write warnings, but non-dry-run performs write side effects without an explicit confirmation prompt.
- `SECURITY.md`: asks for private reporting but does not name a concrete private channel.
- `CONTRIBUTING.md`: current contributor guidance is minimal.
- `ARCHITECTURE.md` and `docs/ARCHITECTURE.md`: absent.
- `.github/workflows/ci.yml`: CI runs `npm ci`, ShellCheck, slice-template validation, cross-platform smoke, and tiered pack smoke, but does not yet include full portable `node --test`, docs lint/link checks, or explicit Windows `pwsh` coverage.
- `src/create-quiver/lib/i18n/messages/{en,es}.js`: EN/ES catalogs exist; direct user-facing English errors remain in command paths and libraries for later audit.
- `src/create-quiver/lib/cli/ux.js`, `src/create-quiver/commands/init.js`, and `src/create-quiver/commands/analyze.js`: UX primitives and summaries exist; safe progress/spinner use is not yet consistently applied to `init`/`analyze`.
- Runtime code was not modified for this baseline slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.

## slice-01-runtime-minimum-and-package-metadata

- `package-lock.json` dependency metadata shows `@clack/core@1.3.1` and `@clack/prompts@1.4.0` both require Node `>= 20.12.0`, so the project cannot truthfully declare a lower supported minimum while keeping current dependencies.
- `npx -y node@20.12.0 --version`: passed, returned `v20.12.0`.
- `package.json` declares `engines.node: >=20.12.0`.
- `package-lock.json` root package metadata includes the same `engines.node` value.
- `README.md` and `docs/getting-started/installation.md` document Node `>=20.12.0`.
- `.github/workflows/ci.yml` adds a `minimum-node` job using Node `20.12.0`, `npm ci`, and `node --test`.
- `npm ci`: passed, added 7 packages and found 0 vulnerabilities.
- `node --test`: passed, 612 tests, 0 failures.
- `npx -y node@20.12.0 --test`: passed, 612 tests, 0 failures. Local npm emitted a compatibility warning because npm `11.12.1` does not support Node `20.12.0`, but the Node 20.12.0 runtime test suite completed successfully.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
