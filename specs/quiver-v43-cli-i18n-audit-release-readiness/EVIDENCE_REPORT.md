# Evidence Report - Quiver v43 CLI i18n Audit and Release Readiness

## slice-00-audit-foundation

- Created this spec package and slice handoffs.
- Runtime implementation intentionally not started.

## slice-01-command-language-mode-matrix

- Added `command-language-mode-matrix.json` as the v43 command x language x mode coverage artifact.
- Added `tests/commands/i18n-audit-matrix.test.js` to keep the matrix synchronized with `docs/reference/commands.md`.
- Covered 67 documented commands from `docs/reference/commands.md`.
- All critical command cells are marked `pass`.
- Accepted exceptions are explicit and scoped to live provider credentials and external GitHub PR creation.
- No release blockers were found in the command matrix.

Coverage profile summary:

| Profile | Language/mode status |
|---|---|
| top-level-help | en/es human pass; CI/no-TTY pass; no-color pass |
| version-report | en/es human pass; JSON pass; CI/no-TTY pass; no-color pass |
| version-json | JSON pass; CI/no-TTY pass |
| language-config-human | en/es human pass; CI/no-TTY pass; no-color pass |
| language-config-json | JSON pass; CI/no-TTY pass |
| init-write | en/es human pass; dry-run pass; CI/no-TTY pass; no-color pass |
| init-interactive | en/es human pass; dry-run pass; interactive pass; CI/no-TTY rejects safely |
| migrate | en/es human pass; dry-run pass; CI/no-TTY pass; no-color pass |
| read-only-human | en/es human pass; CI/no-TTY pass; no-color pass |
| doctor-json | JSON pass; CI/no-TTY pass |
| dashboard-human | en/es human pass; CI/no-TTY pass; no-color pass |
| dashboard-json | JSON pass; CI/no-TTY pass |
| ai-prepare-context | en/es human pass; dry-run pass; interactive/review pass |
| ai-prepare-context-planner | en/es human pass; dry-run/print-prompt/review/interactive pass; live provider accepted exception |
| ai-models-human | en/es human pass; CI/no-TTY pass |
| ai-models-json | JSON pass; CI/no-TTY pass |
| ai-agent-profile | en/es human pass; dry-run pass; interactive pass; CI/no-TTY pass |
| ai-agent-json | JSON pass; CI/no-TTY pass |
| ai-agent-repair | en/es human pass; dry-run pass |
| ai-run-lifecycle | en/es human pass; CI/no-TTY pass |
| ai-planner-provider | en/es human pass; dry-run/print-prompt/review/interactive pass; live provider accepted exception |
| ai-approve | en/es human pass; interactive pass; CI/no-TTY explicit-version behavior pass |
| spec-create | en/es human pass; dry-run/review/interactive pass |
| spec-workflow | en/es human pass; dry-run pass where supported; CI/no-TTY pass |
| plan-graph-next | en/es human pass; JSON pass; CI/no-TTY pass |
| ai-executor | en/es human pass; JSON pass; dry-run/interactive pass; live provider accepted exception |
| ai-pr | en/es human pass; dry-run/review/interactive pass; GitHub create accepted exception |
| ai-export-inspection | en/es human pass; JSON pass; CI/no-TTY pass |

Command matrix:

| Command | Profile | Critical |
|---|---|---|
| `--help` | top-level-help | pass |
| `--version` | version-report | pass |
| `version` | version-report | pass |
| `version --json` | version-json | pass |
| `config language show` | language-config-human | pass |
| `config language show --json` | language-config-json | pass |
| `config language set es` | language-config-human | pass |
| `config language set en --global` | language-config-human | pass |
| `init --name "Proyecto"` | init-write | pass |
| `init --interactive` | init-interactive | pass |
| `migrate --dry-run` | migrate | pass |
| `migrate` | migrate | pass |
| `analyze` | read-only-human | pass |
| `doctor` | read-only-human | pass |
| `doctor --json` | doctor-json | pass |
| `flow` | read-only-human | pass |
| `dashboard` | dashboard-human | pass |
| `dashboard --details` | dashboard-human | pass |
| `dashboard --section <name>` | dashboard-human | pass |
| `dashboard --limit <n>` | dashboard-human | pass |
| `ai prepare-context --dry-run` | ai-prepare-context | pass |
| `ai prepare-context` | ai-prepare-context | pass |
| `ai prepare-context --with-planner --dry-run` | ai-prepare-context-planner | pass |
| `ai prepare-context --with-planner --print-prompt` | ai-prepare-context-planner | pass |
| `ai prepare-context --with-planner --review --interactive` | ai-prepare-context-planner | pass |
| `ai models list` | ai-models-human | pass |
| `ai models list --provider codex` | ai-models-human | pass |
| `ai models list --json` | ai-models-json | pass |
| `ai agent set <role>` | ai-agent-profile | pass |
| `ai agent set <role> --provider <provider> --model <model-id>` | ai-agent-profile | pass |
| `ai agent set planner --provider codex --model gpt-5.5 --dry-run` | ai-agent-profile | pass |
| `ai agent doctor` | ai-agent-profile | pass |
| `ai agent doctor --json` | ai-agent-json | pass |
| `ai agent repair --dry-run` | ai-agent-repair | pass |
| `ai run create --input <file>` | ai-run-lifecycle | pass |
| `ai status` | ai-run-lifecycle | pass |
| `ai plan --phase acceptance --input <file>` | ai-planner-provider | pass |
| `ai plan --phase acceptance --review --interactive --input <file>` | ai-planner-provider | pass |
| `ai revise --phase acceptance --input <feedback.md>` | ai-planner-provider | pass |
| `ai approve --phase acceptance` | ai-approve | pass |
| `ai approve --phase acceptance --version <n>` | ai-approve | pass |
| `ai plan --phase technical-plan` | ai-planner-provider | pass |
| `ai revise --phase technical-plan --input <feedback.md>` | ai-planner-provider | pass |
| `ai review-plan` | ai-planner-provider | pass |
| `ai repair-plan` | ai-planner-provider | pass |
| `ai approve --phase technical-plan` | ai-approve | pass |
| `ai approve --phase technical-plan --version <n>` | ai-approve | pass |
| `ai approvals` | ai-run-lifecycle | pass |
| `spec create --dry-run` | spec-create | pass |
| `spec create` | spec-create | pass |
| `spec create --review --interactive` | spec-create | pass |
| `spec create --interactive` | spec-create | pass |
| `spec validate specs/<spec> --strict` | spec-workflow | pass |
| `spec start specs/<spec>` | spec-workflow | pass |
| `plan --spec <spec>` | plan-graph-next | pass |
| `dashboard --spec <spec>` | dashboard-human | pass |
| `dashboard --section slices --spec <spec>` | dashboard-human | pass |
| `graph --spec <spec>` | plan-graph-next | pass |
| `next --all-ready --spec <spec>` | plan-graph-next | pass |
| `ai prompt-slice --slice <slice.json> --dry-run` | ai-executor | pass |
| `ai execute-slice --slice <slice.json> --commit` | ai-executor | pass |
| `ai execute-plan --execute --commit --mode delegated` | ai-executor | pass |
| `ai pr --dry-run --input specs/<spec>/pr.md` | ai-pr | pass |
| `ai pr --review --dry-run --input specs/<spec>/pr.md` | ai-pr | pass |
| `ai pr --create --input specs/<spec>/pr.md` | ai-pr | pass |
| `spec close specs/<spec> --dry-run` | spec-workflow | pass |
| `spec close specs/<spec>` | spec-workflow | pass |

Validation:

- PASS `node --test tests/commands/i18n-audit-matrix.test.js`
- PASS `node --test tests/**/*.test.js`
- PASS `git diff --check`

## slice-02-public-string-audit

- Audited public output call sites with `rg -n "console\\.(log|error|warn)|process\\.(stdout|stderr)\\.write|throw new Error|formatError\\(|prompt(Label|Text|Confirm)|label:|message:" src/create-quiver`.
- Localized `ai execute-slice` interactive selector labels and progress messages through the i18n catalog.
- Localized `cleanup-slice` dry-run, success, baseline, stale branch, dirty tree, missing worktree, and unmerged branch messages through the i18n catalog.
- Passed configured language from the CLI entrypoint into `cleanup-slice`.
- Added regression tests for English `ai execute-slice` interactive output, Spanish `ai execute-slice` interactive progress, and English `cleanup-slice` dry-run output.

Stable literal exceptions:

| Literal class | Reason |
|---|---|
| Commands, flags, branch names, paths, provider ids, model ids | Stable technical tokens; translating them would break copy/paste workflows or machine contracts. |
| JSON/JSONL field names and enum values | Machine-readable contract; covered by JSON tests and excluded from human translation. |
| Provider prompts under `src/create-quiver/lib/ai/prompts.js` | Explicitly out of scope for this audit slice; these are model instructions, not user-facing CLI strings. |
| Generated local worktree docs such as `WORKTREE_CONTEXT.md` and `docs/ai/ACTIVE_SLICES.md` | Operational artifacts with existing Spanish convention; not command status output. |
| Test fixtures, fixture package metadata, and synthetic command output | Non-public test data used to verify behavior. |

Validation:

- PASS `node --test tests/lib/lifecycle.test.js tests/lib/i18n-catalog.test.js tests/lib/ai-executor.test.js tests/commands/ai-execute-slice.test.js`
- PASS `node --test tests/**/*.test.js`
- PASS `git diff --check`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict`
- PASS `node bin/create-quiver.js check-slice specs/quiver-v43-cli-i18n-audit-release-readiness/slices/slice-02-public-string-audit/slice.json --local`
- PASS focused source audit for removed executor Spanish literals; only catalog entries remain.
- PASS focused source audit for removed lifecycle cleanup Spanish literals; only catalog entries remain.

## slice-03-cross-platform-smokes

- Added i18n-specific checks to `scripts/ci/smoke-cross-platform.js`.
- Covered configured project language without repeated flags by setting project language to `es` in a path with spaces and running `dashboard` without `--lang`.
- Covered `--lang` override by forcing English over the Spanish project config.
- Covered `QUIVER_LANG` override by forcing English over the Spanish project config.
- Covered parseable JSON by parsing `config language show --json` and `dashboard --json`.
- Covered paths with spaces through `ai path project`, `language home`, and `requirements with spaces.md`.
- Updated `scripts/ci/smoke-create-quiver.sh` to make cleanup wrapper language expectations explicit with `QUIVER_LANG=es`.
- Recorded cross-platform command matrix and platform exceptions in `cross-platform-smoke-matrix.md`.

Platform evidence:

| Platform or shell | Status | Evidence |
|---|---|---|
| macOS Darwin arm64 | PASS | Executed locally. |
| Linux Bash | Approved exception | Docker CLI exists, but Docker daemon was unavailable locally; reproducible commands are recorded for CI/Linux runner execution. |
| Windows PowerShell | Approved exception | `pwsh` is unavailable locally; win32 path behavior is covered by tests and shell commands are recorded. |
| Windows Git Bash/WSL | Approved exception | Git Bash/WSL is unavailable locally; Git Bash drive path behavior is covered by tests and shell commands are recorded. |

Validation:

- PASS `node scripts/ci/smoke-cross-platform.js`
- PASS `npm run smoke:create-quiver`
- PASS `node --test tests/lib/paths.test.js tests/commands/config-language.test.js tests/commands/dashboard.test.js`
- PASS `git diff --check`

## slice-04-package-release-readiness

- Added release-note language behavior summary to `docs/reference/commands.md`.
- Confirmed the command matrix, string audit, cross-platform smoke evidence, package smoke, and pack dry-run all pass.
- Confirmed no critical i18n release gaps remain open in this spec.

Validation:

- PASS `node --test tests/**/*.test.js` (612 passed)
- PASS `node bin/create-quiver.js spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict`
- PASS `npm run package:quiver`
- PASS `npm run smoke:create-quiver`
- PASS `npm pack --dry-run --json`
- PASS `git diff --check`

Package evidence:

| Check | Result |
|---|---|
| Package script | `Package smoke passed: create-quiver-0.15.3.tgz` |
| Pack dry-run | `create-quiver@0.15.3`, `create-quiver-0.15.3.tgz`, 980 entries |
