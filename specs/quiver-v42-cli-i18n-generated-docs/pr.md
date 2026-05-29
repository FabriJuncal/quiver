# PR - Quiver v42 CLI i18n Generated Docs

## Title

QUIVER-42 - CLI i18n generated docs

## Summary

Adds language routing for generated human documentation and templates so `init` can emit English or Spanish docs from the configured project language or an explicit `--lang` override.

Keeps machine-readable artifacts stable and non-localized.

## Scope

- Adds generated-doc template language resolution with explicit fallback to the base English template.
- Adds Spanish variants for `init` human docs and onboarding templates.
- Routes `init` generated human docs through the resolved project language.
- Documents generated-doc language behavior, `--lang` overrides, and machine artifact exclusions.
- Closes v42 evidence with full tests, package smoke, create-quiver smoke, and manual `en/es` generated-doc smoke.

Out of scope:

- Runtime CLI output migration already covered by v37-v41.
- Translating JSON, JSONL, package metadata, `slice.json`, commands, flags, routes, providers, or models.

## Files

- `src/create-quiver/lib/i18n/templates.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/index.js`
- `tests/lib/i18n-templates.test.js`
- `tests/commands/init-profiles.test.js`
- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `docs/getting-started/installation.md`
- `AGENTS.md.es.template`
- `docs/*.es.template`
- `docs/ai/LESSONS.md.es.template`
- `specs/quiver-v42-cli-i18n-generated-docs/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Repository dependencies installed with `npm ci`.
- Run commands from the v42 worktree root.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver-v42
git status --short --branch
```

Expected: branch `feature/QUIVER-42-01-v42-template-language-routing` and a clean working tree.

### Run the Project

Package and smoke the CLI:

```bash
npm run package:quiver
npm run smoke:create-quiver
```

Expected: both commands finish successfully.

### Use Cases

Generate English and Spanish temporary projects:

```bash
repo_root="$PWD"
tmp="$(mktemp -d)"
node "$repo_root/bin/create-quiver.js" --lang en init --name "Lang Demo" --dir "$tmp/en-project" --full --skip-install
node "$repo_root/bin/create-quiver.js" --lang es init --name "Lang Demo" --dir "$tmp/es-project" --full --skip-install
grep -F "# Lang Demo Documentation Index" "$tmp/en-project/docs/INDEX.md"
grep -F "# Indice de documentacion de Lang Demo" "$tmp/es-project/docs/INDEX.md"
cmp -s "$tmp/en-project/package.json" "$tmp/es-project/package.json"
cmp -s "$tmp/en-project/specs/lang-demo/slices/slice-template/slice.json" "$tmp/es-project/specs/lang-demo/slices/slice-template/slice.json"
```

Expected:

- English docs contain `# Lang Demo Documentation Index`.
- Spanish docs contain `# Indice de documentacion de Lang Demo`.
- `package.json` and `slice.json` are identical across languages.

### Technical Verification

```bash
node --test tests/**/*.test.js
node bin/create-quiver.js spec validate specs/quiver-v42-cli-i18n-generated-docs --strict
node bin/create-quiver.js check-slice specs/quiver-v42-cli-i18n-generated-docs/slices/slice-04-generated-docs-tests-smokes/slice.json --local
git diff --check
```

Expected:

- Full test suite passes.
- Spec validation passes.
- Slice gate passes in local mode.
- Diff check reports no whitespace errors.

## Evidence

- PASS `node --test tests/**/*.test.js` - 608 tests, 0 failures.
- PASS `npm run package:quiver`.
- PASS `npm run smoke:create-quiver`.
- PASS manual generated-doc language smoke for `--lang en` and `--lang es`.
- PASS `node bin/create-quiver.js spec validate specs/quiver-v42-cli-i18n-generated-docs --strict`.
- PASS `git diff --check`.

## Rollback

Revert this PR. The rollback removes generated-doc template routing, Spanish generated-doc templates, related docs updates, and v42 spec evidence.

No migrations or external state changes are required.

## Risks / Notes

- Template fallback is intentional: missing Spanish human templates fall back to the base English template.
- Machine-readable artifacts are intentionally not localized.
- `package.template.json`, `slice.json`, commands, flags, routes, providers, and models must stay stable for automation compatibility.
