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

## Pending Evidence

- `npx create-quiver spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict`
- `npm run package:quiver`
- `npm run smoke:create-quiver`
- `npm pack --dry-run --json`
