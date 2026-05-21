#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

node --test \
  tests/commands/flow.test.js \
  tests/commands/prepare.test.js \
  tests/commands/ai-agent.test.js \
  tests/commands/ai-onboard.test.js \
  tests/commands/ai-plan.test.js \
  tests/commands/ai-plan-spec-phase.test.js \
  tests/commands/ai-review-plan.test.js \
  tests/commands/ai-execute-slice.test.js \
  tests/commands/ai-execute-plan.test.js \
  tests/commands/ai-pr.test.js \
  tests/commands/spec-create.test.js \
  tests/commands/spec-worktree.test.js \
  tests/commands/spec-close.test.js \
  tests/lib/approvals.test.js \
  tests/lib/ai-executor.test.js \
  tests/lib/ai-execution-plan.test.js \
  tests/lib/ai-github.test.js \
  tests/lib/package-safety.test.js

bash scripts/package-quiver.sh

printf 'Guided workflow smoke passed\n'
