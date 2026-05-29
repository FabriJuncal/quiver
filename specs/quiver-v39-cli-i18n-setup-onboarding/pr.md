# PR - Quiver v39 CLI i18n Setup and Onboarding

## Title

feat: complete v39 setup and onboarding i18n

## Summary

- Adds interactive init language selection for `en` and `es`, persisted in `.quiver/config.json`.
- Localizes setup and onboarding human output for `init`, `analyze`, `migrate`, `ai prepare-context`, `demo`, `evidence`, and `ai onboard`.
- Keeps JSON output, command snippets, paths, prompt delimiters, and generated prompt/doc contents stable.

## Scope

- Included: setup-facing human CLI messages, dry-run flows, configured project language resolution, and regression coverage.
- Excluded: full generated documentation localization and provider-backed planning/execution localization beyond setup wrappers.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/analyze.js`
- `src/create-quiver/commands/demo.js`
- `src/create-quiver/commands/evidence.js`
- `src/create-quiver/commands/migrate.js`
- `src/create-quiver/lib/demo.js`
- `src/create-quiver/lib/i18n/**`
- `src/create-quiver/lib/init-layout.js`
- `tests/commands/**`
- `tests/lib/**`
- `docs/reference/commands.md`
- `specs/quiver-v39-cli-i18n-setup-onboarding/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node and npm available.
- Local checkout on this branch.
- No provider credentials required for dry-run and smoke coverage.

### Worktree Access

```bash
git checkout feature/QUIVER-39-01-v39-init-interactive-language
```

### Run the Project

```bash
npm run package:quiver
npm run smoke:create-quiver
```

### Use Cases

```bash
node bin/create-quiver.js --lang es init --name demo --dry-run
node bin/create-quiver.js --lang es analyze --dry-run
node bin/create-quiver.js --lang es migrate --dry-run
node bin/create-quiver.js --lang es ai prepare-context --dry-run
node bin/create-quiver.js --lang es demo create spec-viewer --dry-run
node bin/create-quiver.js --lang es evidence run --output evidence.md -- node -e "console.log('ok')"
node bin/create-quiver.js --lang es ai onboard --provider claude --role planner --context full --dry-run
```

Configured-language smoke without repeated `--lang`:

```bash
TMPDIR_QU="$(mktemp -d)"
QUIVER_REPO="$(pwd)"
mkdir -p "$TMPDIR_QU/.quiver"
printf '{\n  "language": "es"\n}\n' > "$TMPDIR_QU/.quiver/config.json"
(cd "$TMPDIR_QU" && node "$QUIVER_REPO/bin/create-quiver.js" demo create spec-viewer --dry-run)
rm -rf "$TMPDIR_QU"
```

### Technical Verification

```bash
node --test tests/**/*.test.js
node bin/create-quiver.js spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict
node bin/create-quiver.js check-slice specs/quiver-v39-cli-i18n-setup-onboarding/slices/slice-04-setup-tests-smokes/slice.json --local
git diff --check
```

## Evidence

- `node --test tests/**/*.test.js`: 574 passing.
- `node bin/create-quiver.js spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict`: passed.
- `npm run package:quiver`: passed, produced `create-quiver-0.15.3.tgz`.
- `npm run smoke:create-quiver`: passed.
- Configured-language smoke with `.quiver/config.json` language `es`: passed.
- `git diff --check`: passed.

## Rollback

- Revert this spec branch commits for v39.
- Existing English behavior remains the default fallback if `.quiver/config.json`, `QUIVER_LANG`, and `--lang` are absent.

## Risks / Notes

- Generated documentation templates remain intentionally mostly English; v42 owns full template localization.
- Provider-backed live output localization is out of this spec except setup wrapper text.
