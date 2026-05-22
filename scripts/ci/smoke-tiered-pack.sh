#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cli="$repo_root/bin/create-quiver.js"
smoke_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-tiered-pack.XXXXXX")"
project_root="$smoke_root/project"
project_name="Tiered Pack Smoke"
project_slug="$(printf '%s' "$project_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')"
git_repo="$smoke_root/repo"
worktrees_root="$smoke_root/worktrees"

cleanup() {
  rm -rf "$smoke_root"
}

trap cleanup EXIT

assert_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing expected file: $path" >&2
    exit 1
  fi
}

assert_contains() {
  local path="$1"
  local needle="$2"
  if ! grep -Fq "$needle" "$path"; then
    echo "Missing expected content in $path: $needle" >&2
    exit 1
  fi
}

assert_text_contains() {
  local text="$1"
  local needle="$2"
  if [[ "$text" != *"$needle"* ]]; then
    echo "Missing expected content in doctor output: $needle" >&2
    exit 1
  fi
}

assert_not_contains() {
  local text="$1"
  local needle="$2"
  if [[ "$text" == *"$needle"* ]]; then
    echo "Unexpected content found: $needle" >&2
    exit 1
  fi
}

assert_front_matter() {
  local path="$1"

  if [[ "$(head -n 1 "$path")" != "---" ]]; then
    echo "Missing front matter start in: $path" >&2
    exit 1
  fi

  local marker_count
  marker_count="$(grep -c '^---$' "$path")"
  if [[ "$marker_count" -ne 2 ]]; then
    echo "Expected exactly one front matter block in $path, found $marker_count markers" >&2
    exit 1
  fi
}

assert_count_bounds() {
  local path="$1"
  local max_lines="$2"
  local count
  count="$(awk 'NF' "$path" | wc -l | awk '{ print $1 }')"
  if [[ "$count" -gt "$max_lines" ]]; then
    echo "File exceeds the expected line budget: $path ($count > $max_lines)" >&2
    exit 1
  fi
}

init_project() {
  mkdir -p "$project_root"
  node "$cli" init --name "$project_name" --dir "$project_root" --full --skip-install >/dev/null
}

make_git_repo() {
  mkdir -p "$git_repo"
  cp -R "$project_root"/. "$git_repo"
  cd "$git_repo"
  git init >/dev/null
  git config user.name "Quiver Smoke"
  git config user.email "smoke@example.com"
  git add .
  git commit -m "chore: baseline tiered pack smoke" >/dev/null
  git branch -M develop
}

run_doctor() {
  (cd "$project_root" && node "$cli" doctor)
}

run_analyze() {
  (cd "$project_root" && node "$cli" analyze >/dev/null)
}

init_project
run_analyze

doctor_output="$(run_doctor)"
assert_text_contains "$doctor_output" "Warning: missing local docs link"
assert_text_contains "$doctor_output" "Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it."
assert_text_contains "$doctor_output" "Create real specs and slices only after acceptance criteria are approved and the technical plan is reviewed and approved."

assert_file "$project_root/AGENTS.md"
assert_file "$project_root/docs/DECISIONS.md"
assert_file "$project_root/docs/PROJECT_MAP.md"
assert_file "$project_root/docs/AI_CONTEXT.md"
assert_file "$project_root/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$project_root/docs/ai/QUICK.md"
assert_file "$project_root/docs/ai/STANDARD.md"
assert_file "$project_root/docs/ai/DEEP.md"
assert_file "$project_root/docs/ai/LESSONS.md"
assert_file "$project_root/docs/ai/PRINCIPLES.md"
assert_contains "$project_root/docs/PROJECT_MAP.md" "## Suggested Reading Order"
assert_contains "$project_root/docs/PROJECT_MAP.md" "## Entry Points"
assert_contains "$project_root/docs/PROJECT_MAP.md" "## Primary Config Files"
assert_contains "$project_root/docs/PROJECT_MAP.md" "## Likely Test Commands"
assert_contains "$project_root/docs/PROJECT_MAP.md" "## High-Signal Files"
assert_contains "$project_root/docs/PROJECT_MAP.md" "## Do Not Read First"
assert_contains "$project_root/docs/AI_ONBOARDING_PROMPT.md" "Onboarding"
assert_contains "$project_root/docs/AI_ONBOARDING_PROMPT.md" "Implementación"
assert_contains "$project_root/docs/AI_ONBOARDING_PROMPT.md" "Review"
assert_contains "$project_root/docs/AI_ONBOARDING_PROMPT.md" "Debug"
assert_contains "$project_root/AGENTS.md" "## Reading Budget"
assert_contains "$project_root/AGENTS.md" "## Reading Order"
assert_contains "$project_root/AGENTS.md" "## Output Policy"
assert_contains "$project_root/AGENTS.md" "## Slice Execution Rules"
assert_contains "$project_root/AGENTS.md" "## Links"
assert_front_matter "$project_root/docs/AI_CONTEXT.md"
assert_front_matter "$project_root/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$project_root/docs/CONTEXTO.md"
assert_front_matter "$project_root/docs/STATUS.md"
assert_front_matter "$project_root/docs/WORKFLOW.md"
assert_front_matter "$project_root/docs/ai/QUICK.md"
assert_front_matter "$project_root/docs/ai/STANDARD.md"
assert_front_matter "$project_root/docs/ai/DEEP.md"
assert_front_matter "$project_root/docs/ai/LESSONS.md"
assert_front_matter "$project_root/docs/ai/PRINCIPLES.md"
assert_count_bounds "$project_root/docs/ai/QUICK.md" 50
assert_count_bounds "$project_root/docs/ai/STANDARD.md" 300

slice00_dir="$project_root/specs/$project_slug/slices/slice-00-docs-foundation"
mkdir -p "$slice00_dir"
node - "$slice00_dir/slice.json" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
fs.writeFileSync(file, `${JSON.stringify({
  slice_id: 'slice-00-docs-foundation',
  title: 'Documentation foundation',
  status: 'completed'
}, null, 2)}\n`);
NODE

make_git_repo
export SLICE_WORKTREES_DIR="$worktrees_root"

slice_path="$git_repo/specs/$project_slug/slices/slice-template/slice.json"
start_output="$(cd "$git_repo" && node "$cli" start-slice --allow-draft "$slice_path")"
assert_text_contains "$start_output" "Slice listo para trabajar."
assert_file "$git_repo/docs/ai/ACTIVE_SLICE.md"
assert_front_matter "$git_repo/docs/ai/ACTIVE_SLICE.md"

cleanup_output="$(cd "$git_repo" && node "$cli" cleanup-slice --discard "$slice_path")"
assert_text_contains "$cleanup_output" "PASS: Cleanup finalizado"
assert_text_contains "$cleanup_output" "PASS: ACTIVE_SLICE.md eliminado"
if [[ -f "$git_repo/docs/ai/ACTIVE_SLICE.md" ]]; then
  echo "ACTIVE_SLICE.md should be removed after cleanup" >&2
  exit 1
fi

orphan_project="$smoke_root/orphan"
cp -R "$project_root"/. "$orphan_project"
printf '# Orphan Active Slice\n\nThis file should be cleaned up.\n' > "$orphan_project/docs/ai/ACTIVE_SLICE.md"
orphan_doctor="$(cd "$orphan_project" && node "$cli" doctor)"
assert_text_contains "$orphan_doctor" "ACTIVE_SLICE.md exists without an active slice worktree"

long_quick_project="$smoke_root/long-quick"
cp -R "$project_root"/. "$long_quick_project"
for i in $(seq 1 30); do
  printf '\nExtra line %s\n' "$i" >> "$long_quick_project/docs/ai/QUICK.md"
done
long_quick_doctor="$(cd "$long_quick_project" && node "$cli" doctor)"
assert_text_contains "$long_quick_doctor" "QUICK.md exceeds the 50 non-empty line budget"

missing_agents_project="$smoke_root/missing-agents"
cp -R "$project_root"/. "$missing_agents_project"
node - "$missing_agents_project/AGENTS.md" <<'NODE'
const fs = require('fs');
const filePath = process.argv[2];
const text = fs.readFileSync(filePath, 'utf8');
const next = text.replace(/## Reading Budget[\s\S]*?## Reading Order\r?\n/, '## Reading Order\n');
fs.writeFileSync(filePath, next);
NODE
missing_agents_doctor="$(cd "$missing_agents_project" && node "$cli" doctor)"
assert_text_contains "$missing_agents_doctor" "AGENTS.md is missing required sections"
assert_text_contains "$missing_agents_doctor" "Reading Budget"

missing_front_matter_project="$smoke_root/missing-front-matter"
cp -R "$project_root"/. "$missing_front_matter_project"
node - "$missing_front_matter_project/docs/ai/STANDARD.md" <<'NODE'
const fs = require('fs');
const filePath = process.argv[2];
const text = fs.readFileSync(filePath, 'utf8');
const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n\r?\n?/, '');
fs.writeFileSync(filePath, body);
NODE
missing_front_matter_doctor="$(cd "$missing_front_matter_project" && node "$cli" doctor)"
assert_text_contains "$missing_front_matter_doctor" "docs/ai/STANDARD.md is missing YAML front matter"

duplicate_stack_project="$smoke_root/duplicate-stack"
cp -R "$project_root"/. "$duplicate_stack_project"
printf '\nPackage manager: npm\n' >> "$duplicate_stack_project/docs/AI_CONTEXT.md"
duplicate_stack_doctor="$(cd "$duplicate_stack_project" && node "$cli" doctor)"
assert_text_contains "$duplicate_stack_doctor" "stack information appears outside docs/PROJECT_MAP.md"

printf 'tiered pack smoke test passed for %s\n' "$project_name"
