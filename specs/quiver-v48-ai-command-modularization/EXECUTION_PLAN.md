# Execution Plan - Quiver v48 AI Command Modularization

## Order

1. Execute `slice-00-ai-modularization-foundation`.
2. Execute `slice-01-ai-dispatch-contract-baseline`.
3. Execute `slice-02-ai-lifecycle-namespace-alias`.
4. Execute `slice-03-ai-alias-deprecations`.
5. Execute `slice-04-ai-domain-module-split`.
6. Execute `slice-05-ai-help-advanced-surface`.
7. Execute `slice-06-docs-tests-release-readiness`.

## Risk Controls

- Do not split modules before dispatch golden tests exist.
- Alias warnings must follow v46 policy.
- Keep provider commands in dry-run tests unless explicit live-provider tests are approved separately.

## Required Final Validation

- AI command-focused tests
- `node --test`
- `npm run package:quiver`
- package-installed AI help/alias smoke
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v48-ai-command-modularization`
