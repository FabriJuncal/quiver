#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
fixture_root="$repo_root/tests/fixtures/workflow-gates"
smoke_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-gates.XXXXXX")"

slice_rel="specs/quiver-v03-adoption-verification/slices/slice-02-workflow-gate-fixtures/slice.json"
pr_rel="specs/quiver-v03-adoption-verification/slices/slice-02-workflow-gate-fixtures/pr.md"

cleanup() {
  rm -rf "$smoke_root"
}

trap cleanup EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

assert_contains() {
  local haystack="$1"
  local needle="$2"

  if [[ "$haystack" != *"$needle"* ]]; then
    fail "Expected output to contain: $needle"
  fi
}

copy_repo() {
  local src="$1"
  local dest="$2"

  git clone --quiet "$src" "$dest" >/dev/null
  rsync -a --delete --exclude '.git' "$src"/ "$dest"/
}

prepare_scope_repo() {
  local scope_repo="$smoke_root/scope-repo"

  copy_repo "$repo_root" "$scope_repo"
  git -C "$scope_repo" config user.name "Quiver Smoke"
  git -C "$scope_repo" config user.email "smoke@example.com"
  git -C "$scope_repo" remote set-url origin "$scope_repo"
  mkdir -p "$scope_repo/specs/quiver-v03-adoption-verification"
  cp "$repo_root/specs/quiver-v03-adoption-verification/SPEC.md" "$scope_repo/specs/quiver-v03-adoption-verification/SPEC.md"
  cp "$repo_root/specs/quiver-v03-adoption-verification/STATUS.md" "$scope_repo/specs/quiver-v03-adoption-verification/STATUS.md"
  cp "$repo_root/specs/quiver-v03-adoption-verification/EVIDENCE_REPORT.md" "$scope_repo/specs/quiver-v03-adoption-verification/EVIDENCE_REPORT.md"
  git -C "$scope_repo" branch -m sandbox/quiver-gates

  mkdir -p "$scope_repo/$(dirname "$slice_rel")"
  cp "$fixture_root/slice-ready.json" "$scope_repo/$slice_rel"
  cp "$fixture_root/pr-good.md" "$scope_repo/$pr_rel"

  git -C "$scope_repo" add \
    .github/workflows/ci.yml \
    scripts/ci/smoke-workflow-gates.sh \
    tests/fixtures/workflow-gates/pr-bad.md \
    tests/fixtures/workflow-gates/pr-good.md \
    tests/fixtures/workflow-gates/slice-ready.json \
    "$slice_rel" \
    "$pr_rel"

  git -C "$scope_repo" commit -m "feat(QUIVER-02): workflow gate fixtures" >/dev/null
  git -C "$scope_repo" branch develop HEAD

  printf '%s\n' "$scope_repo"
}

prepare_gate_repo() {
  local gate_repo="$smoke_root/gate-repo"

  copy_repo "$repo_root" "$gate_repo"
  git -C "$gate_repo" config user.name "Quiver Smoke"
  git -C "$gate_repo" config user.email "smoke@example.com"
  git -C "$gate_repo" remote set-url origin "$gate_repo"
  mkdir -p "$gate_repo/specs/quiver-v03-adoption-verification"
  cp "$repo_root/specs/quiver-v03-adoption-verification/SPEC.md" "$gate_repo/specs/quiver-v03-adoption-verification/SPEC.md"
  cp "$repo_root/specs/quiver-v03-adoption-verification/STATUS.md" "$gate_repo/specs/quiver-v03-adoption-verification/STATUS.md"
  cp "$repo_root/specs/quiver-v03-adoption-verification/EVIDENCE_REPORT.md" "$gate_repo/specs/quiver-v03-adoption-verification/EVIDENCE_REPORT.md"
  git -C "$gate_repo" branch -m sandbox/quiver-gates

  mkdir -p "$gate_repo/$(dirname "$slice_rel")"
  cp "$fixture_root/slice-ready.json" "$gate_repo/$slice_rel"
  git -C "$gate_repo" add "$slice_rel"
  git -C "$gate_repo" commit -m "feat(QUIVER-02): workflow gate fixtures base" >/dev/null
  git -C "$gate_repo" update-ref refs/remotes/origin/develop HEAD

  cp "$fixture_root/pr-good.md" "$gate_repo/$pr_rel"
  git -C "$gate_repo" add \
    .github/workflows/ci.yml \
    scripts/ci/smoke-workflow-gates.sh \
    tests/fixtures/workflow-gates/pr-bad.md \
    tests/fixtures/workflow-gates/pr-good.md \
    tests/fixtures/workflow-gates/slice-ready.json \
    "$pr_rel"
  git -C "$gate_repo" commit -m "feat(QUIVER-02): workflow gate fixtures" >/dev/null
  git -C "$gate_repo" branch develop HEAD
  git -C "$gate_repo" branch -f feature/QUIVER-02-workflow-gate-fixtures HEAD

  printf '%s\n' "$gate_repo"
}

run_start_slice_remote() {
  local scope_repo="$1"
  local repo="$smoke_root/with-remote"

  copy_repo "$scope_repo" "$repo"
  git -C "$repo" config user.name "Quiver Smoke"
  git -C "$repo" config user.email "smoke@example.com"
  git -C "$repo" branch -D develop >/dev/null 2>&1 || true

  output="$(
    cd "$repo" && SLICE_WORKTREES_DIR="$smoke_root/worktrees-remote" bash scripts/start-slice.sh "$slice_rel"
  )"

  assert_contains "$output" "Slice listo para trabajar."
  assert_contains "$output" "Alias: QUI-02"
  assert_contains "$output" "Base: develop"
  pass "start-slice.sh works with origin available"
}

run_start_slice_no_remote() {
  local scope_repo="$1"
  local repo="$smoke_root/no-remote"

  copy_repo "$scope_repo" "$repo"
  git -C "$repo" config user.name "Quiver Smoke"
  git -C "$repo" config user.email "smoke@example.com"
  git -C "$repo" branch develop HEAD >/dev/null 2>&1 || true
  git -C "$repo" remote remove origin

  output="$(
    cd "$repo" && SLICE_WORKTREES_DIR="$smoke_root/worktrees-no-remote" bash scripts/start-slice.sh "$slice_rel"
  )"

  assert_contains "$output" "Slice listo para trabajar."
  assert_contains "$output" "Alias: QUI-02"
  assert_contains "$output" "Base: develop"
  pass "start-slice.sh works without origin"
}

run_check_slice_ready() {
  local gate_repo="$1"
  local repo="$smoke_root/check-slice-ready"

  copy_repo "$gate_repo" "$repo"
  repo="$(cd "$repo" && pwd -P)"
  git -C "$repo" config user.name "Quiver Smoke"
  git -C "$repo" config user.email "smoke@example.com"
  [[ -f "$repo/specs/quiver-v03-adoption-verification/SPEC.md" ]] || fail "copy_repo no trajo SPEC.md al repo de check-slice-ready"

  output="$(cd "$repo" && bash scripts/check-slice-readiness.sh "$slice_rel" --gate ready)"
  assert_contains "$output" "PASS: Gate ready"
  pass "check-slice-readiness ready gate passes on happy path"

  node - "$repo/$slice_rel" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const json = JSON.parse(fs.readFileSync(path, 'utf8'));
json.status = 'draft';
fs.writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
NODE

  if cd "$repo" && bash scripts/check-slice-readiness.sh "$slice_rel" --gate ready >/tmp/quiver-slice-ready.out 2>/tmp/quiver-slice-ready.err; then
    fail "check-slice-readiness should fail for draft slices"
  fi

  error_output="$(cat /tmp/quiver-slice-ready.err)"
  assert_contains "$error_output" "status=ready"
  pass "check-slice-readiness rejects draft slices"
}

run_check_pr_readiness() {
  local gate_repo="$1"
  local repo="$smoke_root/check-pr-ready"

  copy_repo "$gate_repo" "$repo"
  repo="$(cd "$repo" && pwd -P)"
  git -C "$repo" config user.name "Quiver Smoke"
  git -C "$repo" config user.email "smoke@example.com"
  git -C "$repo" checkout feature/QUIVER-02-workflow-gate-fixtures >/dev/null
  git -C "$repo" reset --hard >/dev/null
  git -C "$repo" clean -fd >/dev/null

  node - "$repo/$slice_rel" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const json = JSON.parse(fs.readFileSync(path, 'utf8'));
json.status = 'completed';
json.started_at = '2026-04-20T00:00:00Z';
json.completed_at = '2026-04-20T00:00:00Z';
json.actual_hours = 5;
fs.writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
NODE

  git -C "$repo" add "$slice_rel"
  git -C "$repo" commit -m "test: promote slice to completed" >/dev/null

  output="$(cd "$repo" && bash scripts/check-pr-readiness.sh "$slice_rel")"
  assert_contains "$output" "PASS: Gate PR listo"
  pass "check-pr-readiness passes with a valid pr.md"

  local failure_repo="$smoke_root/check-pr-failure"

  copy_repo "$repo" "$failure_repo"
  failure_repo="$(cd "$failure_repo" && pwd -P)"
  git -C "$failure_repo" config user.name "Quiver Smoke"
  git -C "$failure_repo" config user.email "smoke@example.com"
  git -C "$failure_repo" checkout feature/QUIVER-02-workflow-gate-fixtures >/dev/null
  git -C "$failure_repo" reset --hard >/dev/null
  git -C "$failure_repo" clean -fd >/dev/null
  cp "$fixture_root/pr-bad.md" "$failure_repo/$pr_rel"
  git -C "$failure_repo" add "$pr_rel"
  git -C "$failure_repo" commit -m "test: malformed pr fixture" >/dev/null

  if cd "$failure_repo" && bash scripts/check-pr-readiness.sh "$slice_rel" >/tmp/quiver-pr-ready.out 2>/tmp/quiver-pr-ready.err; then
    fail "check-pr-readiness should fail when pr.md is missing required headings"
  fi

  error_output="$(cat /tmp/quiver-pr-ready.err)"
  assert_contains "$error_output" "Falta la seccion obligatoria"
  pass "check-pr-readiness rejects malformed pr.md"
}

run_check_scope() {
  local scope_repo="$1"
  local happy_repo="$smoke_root/scope-happy"
  local failure_repo="$smoke_root/scope-failure"

  copy_repo "$scope_repo" "$happy_repo"
  happy_repo="$(cd "$happy_repo" && pwd -P)"
  git -C "$happy_repo" config user.name "Quiver Smoke"
  git -C "$happy_repo" config user.email "smoke@example.com"
  output="$(cd "$happy_repo" && bash scripts/check-scope.sh "$slice_rel")"
  assert_contains "$output" "PASS: Todos los archivos tocados"
  pass "check-scope passes on the happy path"

  copy_repo "$scope_repo" "$failure_repo"
  failure_repo="$(cd "$failure_repo" && pwd -P)"
  git -C "$failure_repo" config user.name "Quiver Smoke"
  git -C "$failure_repo" config user.email "smoke@example.com"
  mkdir -p "$failure_repo/scripts/ci"
  printf 'out of scope\n' > "$failure_repo/scripts/ci/out-of-scope.txt"
  git -C "$failure_repo" add scripts/ci/out-of-scope.txt
  git -C "$failure_repo" commit -m "chore: out of scope fixture" >/dev/null

  if cd "$failure_repo" && bash scripts/check-scope.sh "$slice_rel" --strict >/tmp/quiver-scope.out 2>/tmp/quiver-scope.err; then
    fail "check-scope should fail when the branch touches an undeclared file"
  fi

  error_output="$(cat /tmp/quiver-scope.err)"
  assert_contains "$error_output" "fuera del scope"
  pass "check-scope rejects out-of-scope files"
}

main() {
  local scope_repo gate_repo
  scope_repo="$(prepare_scope_repo)"
  gate_repo="$(prepare_gate_repo)"

  run_start_slice_remote "$scope_repo"
  run_start_slice_no_remote "$scope_repo"
  run_check_slice_ready "$gate_repo"
  run_check_pr_readiness "$gate_repo"
  run_check_scope "$scope_repo"

  printf 'workflow gate fixture suite passed\n'
}

main "$@"
