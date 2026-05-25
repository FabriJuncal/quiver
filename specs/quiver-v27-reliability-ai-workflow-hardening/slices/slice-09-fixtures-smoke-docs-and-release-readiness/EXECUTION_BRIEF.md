# EXECUTION BRIEF - slice-09: Fixtures, smoke, docs, and release readiness

## Context

After all v27 implementation slices, Quiver needs full regression evidence from source and packaged CLI behavior. This slice closes the spec without publishing npm.

## Objective

Validate v27 end to end with sanitized fixtures, tests, smokes, tarball/package smoke, docs sync, and release readiness evidence.

## Scope

- Regression fixtures
- Smoke scripts and evidence
- README/README_FOR_AI/ROADMAP/CHANGELOG
- v27 status/evidence/closure

## Acceptance Criteria

- Every QP/QIS is fixed, validated, or documented as remaining risk.
- Sanitized fixtures cover real production cases.
- Full tests and smokes pass.
- Package/tarball smoke validates installed behavior.
- Docs reflect implemented behavior only.

## Technical Plan Summary

Add fixtures, run full validation, smoke the packaged CLI from outside the repo, update docs and evidence, and mark the spec release-ready without publishing.

## Suggested Execution Steps

1. Add sanitized fixtures from dogfooding cases.
2. Run full test and smoke suite.
3. Package and smoke the tarball outside the repo.
4. Update README, README_FOR_AI, ROADMAP, CHANGELOG, STATUS, and EVIDENCE_REPORT.
5. Record remaining risks.

## Restrictions

- Do not publish npm.
- Do not commit private local paths or credentials.
- Do not claim release until package smoke passes.

## Risks

- Tarball smoke may reveal package-only issues; fix or document before closure.

## Completion Checklist

- [ ] Fixtures sanitized.
- [ ] Full tests passed.
- [ ] Smokes passed.
- [ ] Tarball smoke passed.
- [ ] Docs synced.
- [ ] Spec evidence completed.

