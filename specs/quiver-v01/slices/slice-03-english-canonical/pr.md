# PR - QUIVER-03 - English Canonical

## Title

docs: translate the template documentation to English and move Spanish copies to `i18n/es/`

## Summary

Makes English the canonical language for the documentation templates and updates the PR gate so English `pr.md` files pass.

## Scope

- Root docs translated to English
- Template docs translated to English
- PR readiness gate headings updated to English
- Spanish copies preserved in `i18n/es/`

## Files

- `README.md`
- `README_FOR_AI.md`
- `TEMPLATE.md`
- `docs/*.template`
- `docs/ai/PRINCIPLES.md`
- `docs/ai/RULES.yaml`
- `scripts/check-pr-readiness.sh`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node
- macOS or Linux

### Worktree Access

```bash
npm run start-slice -- specs/quiver-v01/slices/slice-03-english-canonical/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: PR gate with English headings

1. Create a `pr.md` that uses English headings
2. Run `npm run check:pr -- <slice.json>`

**Expected result:** The PR gate passes.

#### Case 2: Spanish copies available

1. Open `i18n/es/`
2. Confirm the translated docs are present

**Expected result:** Spanish copies are available for reference.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-03-english-canonical/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-03-english-canonical/slice.json
grep -c "How to Test" scripts/check-pr-readiness.sh
```

## Evidence

- `check-pr-readiness.sh` output
- `i18n/es/` listing

## Rollback

1. `git revert <commit-hash>`
2. Confirm the gate headings return to the previous state

## Risks / Notes

- The translated docs must stay aligned with the generated templates.
