# PR - EXAMPLE-01 - Onboarding Flow Documentation

## Title

docs: add a completed onboarding-flow slice example

## Summary

Shows a fully completed example slice for a fictional onboarding flow so new contributors can copy the structure.

## Scope

- Completed example spec
- Completed slice JSON
- Completed PR note
- Evidence report

## Files

- `examples/01-basic-slice/README.md`
- `examples/01-basic-slice/SPEC.md`
- `examples/01-basic-slice/EVIDENCE_REPORT.md`
- `examples/01-basic-slice/slices/slice-01/slice.json`
- `examples/01-basic-slice/slices/slice-01/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node 18+

### Worktree Access

```bash
# Not required for the example docs
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: Read the example as documentation

1. Open the example README.
2. Review the SPEC.
3. Review the slice JSON.
4. Review the PR note.

**Expected result:** The workflow is easy to follow.

### Technical Verification

```bash
node -e "JSON.parse(require('fs').readFileSync('examples/01-basic-slice/slices/slice-01/slice.json', 'utf8'))"
```

## Evidence

- JSON parse output
- Example README and PR note

## Rollback

1. `git revert <commit-hash>`
2. Remove the example directory if needed

## Risks / Notes

- The example should stay framework-agnostic.
