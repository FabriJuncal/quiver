# Evidence Report - Quiver v47 CLI Loop Closure Commands

## Planning Evidence

- Source analysis: `CLI_ANALYSIS.md`.
- Production-readiness review required formalizing loop-closure commands instead of leaving them as informal future notes.

## Validation Evidence

- `slice-00-loop-closure-foundation` documented explicit contracts for `status`, `evidence list`, `evidence show`, `changelog`, `demo spec-viewer`, and the v47 config-surface decision.
- v46 dependencies recorded: canonical command preference, stderr-only compatibility warnings, JSON stdout cleanliness, i18n ownership, and read-only no-write tests.
- Runtime implementation remains deferred to slices 01-05.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`: passed.

## slice-01-status-command - Execution Evidence

- Added `src/create-quiver/commands/status.js` as a read-only command module composed from the existing flow-state detector.
- Added top-level parser/help routing for `status` and `status --json`.
- Human output reports state, source, next safe command, optional specs/blockers, and an explicit read-only safety line.
- JSON output uses schema version 1 and exposes `state`, `source`, `next_command`, blockers, specs, and selected facts without human prose.
- Added localized EN/ES status labels.
- Added `tests/commands/status.test.js` covering no-write behavior, next command visibility, parseable JSON, and Spanish labels.
- `node --test tests/commands/status.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`: passed.

## slice-02-evidence-list-show - Execution Evidence

- Added evidence artifact discovery under `.quiver/evidence/` with Markdown-only filtering and newest-first stable ordering.
- Added safe evidence artifact resolution that accepts project-relative or absolute paths only when they resolve inside `.quiver/evidence/`.
- Added `evidence list` human output and schema v1 JSON output.
- Added `evidence show <path>` human output and schema v1 JSON output.
- Preserved `evidence run -- <command>` parsing and existing output behavior.
- Added command and library tests for stable ordering, safe display, unsafe path rejection, JSON parsing, and existing `evidence run` compatibility.
- `node --test tests/lib/evidence.test.js tests/commands/evidence.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`: passed.

## slice-03-changelog-contract - Execution Evidence

- Added `src/create-quiver/commands/changelog.js` to parse and display local `CHANGELOG.md` content without network access.
- Added top-level `changelog` parser/help routing and schema v1 JSON output.
- Updated `migrate --dry-run` and live `migrate` warning guidance to point users to `npx create-quiver changelog` in addition to dry-run preview.
- Added tests for normal changelog output, JSON output, malformed local content parsing, and missing local changelog behavior.
- Updated CLI contract and migrate tests for the new command/guidance.
- `node --test tests/commands/changelog.test.js tests/commands/cli-contract.test.js tests/commands/init-profiles.test.js tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed.
- `git diff --check`: passed.

## slice-04-demo-spec-viewer-alias - Execution Evidence

- Added parser support for `demo spec-viewer` as a simplified alias of `demo create spec-viewer`.
- Preserved `demo create spec-viewer` compatibility behavior, dry-run behavior, default target behavior, language handling, and live write behavior.
- Updated help/CLI contract to document both forms.
- Added tests proving dry-run output equality and live scaffold behavior for the simplified form.
- `node --test tests/commands/demo.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed.
- `git diff --check`: passed.

## slice-05-config-contract-decision - Execution Evidence

- Documented the v47 config decision in `SPEC.md`: `config language show|set` remains canonical, no generic `config get|set` runtime surface is added in v47, and any future simplification must be additive.
- Updated `docs/reference/commands.md` with a config contract note.
- Updated `docs/CLI_UX_GUIDE.md` to treat `config language show|set` as the canonical configuration contract.
- No runtime code was modified for this documentation-only slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`: passed.

## slice-06-docs-tests-release-readiness - Execution Evidence

- Updated public command docs and generated command templates to include `status`, `changelog`, `evidence list`, `evidence show`, and `demo spec-viewer`.
- Updated AI-facing docs to prefer `demo spec-viewer` while preserving `demo create spec-viewer` as the compatibility form.
- Updated the command i18n audit matrix so the documented v47 command surface is covered by command-mode validation.
- Focused validation: `node --test tests/commands/status.test.js tests/commands/evidence.test.js tests/lib/evidence.test.js tests/commands/changelog.test.js tests/commands/demo.test.js tests/commands/cli-contract.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js`: passed.
- Full validation: `node --test`: passed, 647 tests, 0 failures.
- Package validation: `npm run package:quiver`: passed, including package smoke for `create-quiver-0.15.4.tgz`.
- Package-installed smoke from `npm pack` tarball: passed for `create-quiver --version`, `quiver --version`, `status --json`, `changelog --json`, `evidence run`, `evidence list --json`, `evidence show`, and `demo spec-viewer --dry-run`.
- Final `git diff --check`: passed.
- Final `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`: passed.
