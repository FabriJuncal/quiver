# PR - Quiver v41 CLI i18n AI Lifecycle

## Title

QUIVER-41: CLI i18n for AI lifecycle commands

## Summary

- Localizes AI lifecycle command wrappers in English and Spanish across run state, agent/model configuration, planner approvals, execution, and PR flows.
- Preserves provider prompts, prompt-only output, JSON/JSONL surfaces, run ids, provider/model ids, command snippets, git/gh behavior, artifacts, and secret redaction.
- Closes the v41 spec with full test, package smoke, spec validation, and evidence.

## Scope

- Included: `ai run create`, `ai run close`, `ai status`, `ai resume`, `ai approvals`, `ai agent`, `ai models`, `ai plan`, `ai revise`, `ai review-plan`, `ai repair-plan`, `ai approve`, `ai execute-slice`, `ai execute-plan`, and `ai pr`.
- Included: human output, progress checks, selector prompts, dry-run reports, actionable errors, review wrappers, and no-TTY guidance.
- Excluded: provider-generated content translation, provider adapter changes, credential behavior changes, and full `ai run watch` runtime implementation owned by v36.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/execution-plan.js`
- `src/create-quiver/lib/ai/github.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/ai-*.test.js`
- `tests/lib/i18n-catalog.test.js`
- `specs/quiver-v41-cli-i18n-ai-lifecycle/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm supported by this repository.
- Local checkout of this branch.
- No live AI provider credentials are required for the automated tests; provider-backed flows use dry-run, print-prompt, or injected provider runners.
- `gh` is only needed for PR preflight/create flows, not for the full unit suite.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver-v41
git status --short --branch
```

Expected: branch `feature/QUIVER-41-01-v41-ai-run-status-resume` with no uncommitted changes.

### Run the Project

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js --version
node bin/create-quiver.js version --lang es
```

Expected: CLI starts normally; Spanish human version output is localized while semver surfaces remain stable.

### Use Cases

```bash
node bin/create-quiver.js ai models list --lang es
node bin/create-quiver.js ai agent doctor --lang es --dry-run
node bin/create-quiver.js ai plan --phase acceptance --input requirements.md --dry-run --lang es
node bin/create-quiver.js ai execute-plan --dry-run --lang es
node bin/create-quiver.js ai pr --dry-run --lang es --ssh-host-alias github-personal --identity-file ~/ssh/github-personal --input specs/quiver-v41-cli-i18n-ai-lifecycle/pr.md
```

Expected: human wrappers are localized; commands, paths, provider ids, model ids, and machine-readable outputs remain exact. The `requirements.md` command requires an existing input file if run outside the test fixtures.

### Technical Verification

```bash
node --test tests/**/*.test.js
npm run package:quiver
npm run smoke:create-quiver
node bin/create-quiver.js spec validate specs/quiver-v41-cli-i18n-ai-lifecycle --strict
node bin/create-quiver.js check-slice specs/quiver-v41-cli-i18n-ai-lifecycle/slices/slice-05-ai-tests-smokes/slice.json --local
git diff --check
```

Expected: all commands pass.

## Evidence

- PASS `node --test tests/**/*.test.js` (`599/599`)
- PASS `npm run package:quiver` (`create-quiver-0.15.3.tgz`)
- PASS `npm run smoke:create-quiver`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v41-cli-i18n-ai-lifecycle --strict`
- PASS `node bin/create-quiver.js check-slice specs/quiver-v41-cli-i18n-ai-lifecycle/slices/slice-05-ai-tests-smokes/slice.json --local`
- PASS `node bin/create-quiver.js check-slice specs/quiver-v41-cli-i18n-ai-lifecycle/slices/slice-06-ai-prepare-context-progress-i18n-fix/slice.json --local`
- PASS `git diff --check`

## Rollback

- Revert this PR to restore the previous AI lifecycle human output behavior.
- No migrations, external service changes, provider credential changes, or package manager changes are included.

## Risks / Notes

- Blast radius is the human CLI UX around AI lifecycle commands; automation contracts are covered by JSON/JSONL and prompt stability tests.
- Full `ai run watch` runtime remains outside v41 and is tracked by `specs/quiver-v36-ai-run-watch-portable`.
- The final validation found and fixed mixed-language progress in `ai onboard` / `ai prepare-context --with-planner` under `QUIVER-41-06`.
