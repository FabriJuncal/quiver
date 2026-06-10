# EXECUTION_BRIEF - slice-02 Provider analysis JSON contract

## Context

The command can already plan discovery and sampling in read-only mode after slice-01. This slice adds provider-backed analysis but must still not write documentation.

## Objective

Run the provider only after privacy preflight, then parse and validate evidence-backed JSON analysis.

## Acceptance Criteria

- Provider execution requires privacy preflight approval.
- Provider prompt requires JSON only.
- JSON schema validates product, domain, architecture, features, risks, questions, claims, and doc update proposals.
- Evidence paths exist in the selected sample or are rejected/downgraded.
- Truncated-file claims cannot be `confirmed`.
- Invalid JSON, invalid schema, provider failure, timeout, or privacy failure writes no files.
- Artifacts are redacted and size-limited.

## Production Guardrails

- Do not persist unredacted provider output.
- Do not convert JSON into docs yet.
- Do not mark weak or missing evidence as confirmed.
- Keep `--json` output clean.

## Completion Checklist

- [ ] Prompt added.
- [ ] Schema added.
- [ ] Parser and evidence validator added.
- [ ] Privacy preflight wired before provider execution.
- [ ] Provider tests added.
