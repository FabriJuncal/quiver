# PR - QUIVER-04 - First Working Example

## Title

docs: add `examples/01-basic-slice/` end to end

## Summary

Adds the first reproducible example that shows the spec → slice → PR → evidence loop in a realistic but stack-agnostic way.

## Scope

- Example README
- Example SPEC
- Example evidence report
- Example slice JSON and PR note

## Files

- `examples/01-basic-slice/README.md`
- `examples/01-basic-slice/SPEC.md`
- `examples/01-basic-slice/EVIDENCE_REPORT.md`
- `examples/01-basic-slice/slices/slice-01/slice.json`
- `examples/01-basic-slice/slices/slice-01/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node
- macOS or Linux

### Worktree Access

```bash
npm run start-slice -- specs/quiver-v01/slices/slice-04-first-example/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: Read the example as a new user

1. Open `examples/01-basic-slice/README.md`
2. Follow the steps without reading anything else first

**Expected result:** The workflow is understandable in under five minutes.

#### Case 2: Validate the example slice JSON

1. Parse `examples/01-basic-slice/slices/slice-01/slice.json`
2. Confirm `status`, `actual_hours`, `started_at`, and `completed_at` are present

**Expected result:** The JSON is valid and complete.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-04-first-example/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-04-first-example/slice.json
node -e "JSON.parse(require('fs').readFileSync('examples/01-basic-slice/slices/slice-01/slice.json','utf8'))" && echo "example slice.json valid"
```

## Evidence

- Example README content
- JSON validation output

## Rollback

1. `git revert <commit-hash>`
2. Remove the `examples/` directory if needed

## Risks / Notes

- The example should stay stack-agnostic.
