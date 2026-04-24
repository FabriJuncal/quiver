#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cli="$repo_root/bin/create-quiver.js"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-create-smoke.XXXXXX")"
cli_version="$(node -p 'require(process.argv[1]).version' "$repo_root/package.json")"

cleanup() {
  rm -rf "$temp_root"
}

trap cleanup EXIT

assert_file() {
  local path="$1"

  if [[ ! -f "$path" ]]; then
    echo "Missing expected file: $path" >&2
    exit 1
  fi
}

assert_missing() {
  local path="$1"

  if [[ -e "$path" ]]; then
    echo "Path should not exist: $path" >&2
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

assert_front_matter() {
  local path="$1"

  if [[ "$(head -n 1 "$path")" != "---" ]]; then
    echo "Missing front matter start in: $path" >&2
    exit 1
  fi

  local block_count
  block_count="$(grep -c '^---$' "$path")"
  if [[ "$block_count" -ne 2 ]]; then
    echo "Expected exactly one front matter block in $path, found $block_count markers" >&2
    exit 1
  fi

  for field in purpose applies_when token_cost last_updated supersedes; do
    if ! grep -Fq "$field:" "$path"; then
      echo "Missing front matter field '$field' in: $path" >&2
      exit 1
    fi
  done
}

assert_project_map_sections() {
  local path="$1"

  assert_contains "$path" "## Suggested Reading Order"
  assert_contains "$path" "## Entry Points"
  assert_contains "$path" "## Primary Config Files"
  assert_contains "$path" "## Likely Test Commands"
  assert_contains "$path" "## High-Signal Files"
  assert_contains "$path" "## Do Not Read First"
}

assert_package_scripts() {
  local package_json="$1"
  local label="$2"
  shift 2

  node - "$package_json" "$label" "$@" <<'NODE'
const fs = require('fs');

const file = process.argv[2];
const label = process.argv[3];
const expected = process.argv.slice(4);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
const missing = expected.filter((name) => typeof pkg.scripts?.[name] !== 'string');

if (missing.length > 0) {
  console.error(`${label}: missing npm scripts: ${missing.join(', ')}`);
  process.exit(1);
}
NODE
}

pack_installer() {
  local pack_dir="$temp_root/package-pack"
  local npm_cache="$temp_root/npm-cache"
  mkdir -p "$pack_dir" "$npm_cache"

  local pack_json
  pack_json="$(
    cd "$repo_root" && npm_config_cache="$npm_cache" npm pack --json --pack-destination "$pack_dir"
  )"

  local tarball_name
  tarball_name="$(
    node -e 'const data = JSON.parse(process.argv[1]); process.stdout.write(data[0].filename);' "$pack_json"
  )"

  printf '%s/%s' "$pack_dir" "$tarball_name"
}

new_target="$temp_root/new-project"
plain_target="$temp_root/plain-project"
malformed_target="$temp_root/malformed-project"
space_target="$temp_root/space project"
existing_target="$temp_root/existing-project"
legacy_target="$temp_root/legacy-project"
release_target="$temp_root/release-project"
installer_root="$temp_root/installer"

mkdir -p "$plain_target"
node -e 'const fs = require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({ name: "plain-project", private: true }, null, 2));' "$plain_target/package.json"

if plain_migrate_output="$(cd "$plain_target" && node "$cli" migrate 2>&1)"; then
  echo "Migrate should fail before a project is initialized with Quiver" >&2
  exit 1
fi

if [[ "$plain_migrate_output" != *'Run: npx create-quiver --name "Project Name"'* ]]; then
  echo "Migrate failure did not recommend initializing Quiver first" >&2
  exit 1
fi

if plain_doctor_output="$(cd "$plain_target" && node "$cli" doctor 2>&1)"; then
  echo "Doctor should fail before a project is initialized with Quiver" >&2
  exit 1
fi

if [[ "$plain_doctor_output" != *'Run init first: npx create-quiver --name "Project Name"'* ]]; then
  echo "Doctor failure did not recommend initializing Quiver first" >&2
  exit 1
fi

assert_missing "$plain_target/docs"
assert_missing "$plain_target/docs-template"
assert_missing "$plain_target/.quiver"

mkdir -p "$malformed_target/.quiver"
node -e 'const fs = require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({ name: "malformed-project", private: true }, null, 2)); fs.writeFileSync(process.argv[2], JSON.stringify({ migrated_version: "0.7.0" }, null, 2));' "$malformed_target/package.json" "$malformed_target/.quiver/state.json"

if malformed_migrate_output="$(cd "$malformed_target" && node "$cli" migrate 2>&1)"; then
  echo "Migrate should fail when Quiver state is incomplete and there is no legacy evidence" >&2
  exit 1
fi

if [[ "$malformed_migrate_output" != *'Run: npx create-quiver --name "Project Name"'* ]]; then
  echo "Malformed migrate failure did not recommend initializing Quiver first" >&2
  exit 1
fi

if malformed_doctor_output="$(cd "$malformed_target" && node "$cli" doctor 2>&1)"; then
  echo "Doctor should fail when Quiver state is incomplete and there is no legacy evidence" >&2
  exit 1
fi

if [[ "$malformed_doctor_output" != *'Run init first: npx create-quiver --name "Project Name"'* ]]; then
  echo "Malformed doctor failure did not recommend initializing Quiver first" >&2
  exit 1
fi

assert_missing "$malformed_target/docs"
assert_missing "$malformed_target/docs-template"

node "$cli" --name "Smoke Project" --dir "$new_target" >/dev/null
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!data.initialized_version || !data.last_initialized_at) { throw new Error("initial metadata missing from new project state"); } if (data.last_analysis_at) { throw new Error("new project state should not have analysis metadata yet"); }' "$new_target/.quiver/state.json"
doctor_before_analyze="$(cd "$new_target" && node "$cli" doctor)"

if [[ "$doctor_before_analyze" != *"npx create-quiver analyze"* ]]; then
  echo "Doctor output did not recommend analyze first" >&2
  exit 1
fi

if [[ "$doctor_before_analyze" == *"Run "* ]]; then
  echo "Doctor output still contains the word Run" >&2
  exit 1
fi
if [[ "$doctor_before_analyze" == *"bash "* ]]; then
  echo "Doctor output still references bash" >&2
  exit 1
fi

(
  cd "$new_target"
  node "$cli" analyze >/dev/null
)
doctor_after_analyze="$(cd "$new_target" && node "$cli" doctor)"

if [[ "$doctor_after_analyze" != *"Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Doctor output did not point to AGENTS.md before the onboarding prompt" >&2
  exit 1
fi
if [[ "$doctor_after_analyze" != *"npx create-quiver start-slice"* ]]; then
  echo "Doctor output did not use the Node slice command" >&2
  exit 1
fi
if [[ "$doctor_after_analyze" == *"bash "* ]]; then
  echo "Doctor output still references bash after analyze" >&2
  exit 1
fi

assert_file "$new_target/README.md"
assert_file "$new_target/AGENTS.md"
assert_file "$new_target/docs/INDEX.md"
assert_file "$new_target/docs/COMMANDS.md"
assert_file "$new_target/docs/ai/QUICK.md"
assert_file "$new_target/docs/ai/STANDARD.md"
assert_file "$new_target/docs/ai/DEEP.md"
assert_file "$new_target/docs/ai/LESSONS.md"
assert_file "$new_target/docs/ai/PRINCIPLES.md"
assert_file "$new_target/docs/DECISIONS.md"
assert_file "$new_target/docs/AI_CONTEXT.md"
assert_file "$new_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$new_target/docs/PROJECT_SCAN.json"
assert_file "$new_target/docs/PROJECT_MAP.md"
assert_file "$new_target/specs/smoke-project/HANDOFF.md"
assert_project_map_sections "$new_target/docs/PROJECT_MAP.md"
assert_file "$new_target/.quiver/state.json"
assert_file "$new_target/docs/SUPPORT_MATRIX.md"
assert_file "$new_target/docs/TROUBLESHOOTING.md"
assert_file "$new_target/tools/scripts/start-slice.sh"
assert_file "$new_target/tools/scripts/migrate-project.sh"
assert_file "$new_target/specs/smoke-project/SPEC.md"
assert_file "$new_target/docs-template/scripts/init-docs.sh"

for file in "$new_target/README.md" "$new_target/docs/INDEX.md" "$new_target/docs/WORKFLOW.md"; do
  assert_contains "$file" "Support Matrix"
  assert_contains "$file" "Troubleshooting"
done

assert_contains "$new_target/README.md" "Decision Log"
assert_contains "$new_target/docs/INDEX.md" "Decision Log"
assert_contains "$new_target/docs/INDEX.md" "DECISIONS.md"
assert_contains "$new_target/docs/INDEX.md" "COMMANDS.md"
assert_contains "$new_target/docs/INDEX.md" "./ai/QUICK.md"
assert_contains "$new_target/docs/INDEX.md" "./ai/STANDARD.md"
assert_contains "$new_target/docs/INDEX.md" "./ai/DEEP.md"

assert_contains "$new_target/docs/AI_CONTEXT.md" "AI Context Pack"
assert_contains "$new_target/docs/AI_CONTEXT.md" "Read First"
assert_contains "$new_target/docs/AI_CONTEXT.md" "DECISIONS.md"
assert_contains "$new_target/docs/AI_CONTEXT.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/docs/CONTEXTO.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/docs/STATUS.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/docs/WORKFLOW.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/docs/AI_ONBOARDING_PROMPT.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/docs/DECISIONS.md" "Decision Log"
assert_contains "$new_target/docs/DECISIONS.md" "| Date | Decision | Reason | Alternatives | Impact |"
assert_contains "$new_target/docs/COMMANDS.md" "| Command | Purpose | OS | Since |"
assert_contains "$new_target/docs/COMMANDS.md" "\`quiver:plan\`"
assert_contains "$new_target/docs/COMMANDS.md" "src/create-quiver/lib/slice-graph.js"
assert_contains "$new_target/docs/SUPPORT_MATRIX.md" "## Cross-Platform Authoring Rules"
assert_contains "$new_target/docs/SUPPORT_MATRIX.md" "No shell invocations for logic"
assert_contains "$new_target/docs/SUPPORT_MATRIX.md" "Optional external tools"
assert_contains "$new_target/docs/ai/QUICK.md" "Quick Context"
assert_contains "$new_target/docs/ai/QUICK.md" "Read Next"
assert_contains "$new_target/docs/ai/QUICK.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/docs/ai/STANDARD.md" "Standard Context"
assert_contains "$new_target/docs/ai/STANDARD.md" "V13 Mode Guidance"
assert_contains "$new_target/docs/ai/DEEP.md" "Deep Context"
assert_contains "$new_target/docs/ai/DEEP.md" "What Belongs Here"
assert_front_matter "$new_target/docs/AI_CONTEXT.md"
assert_front_matter "$new_target/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$new_target/docs/CONTEXTO.md"
assert_front_matter "$new_target/docs/STATUS.md"
assert_front_matter "$new_target/docs/WORKFLOW.md"
assert_front_matter "$new_target/docs/ai/QUICK.md"
assert_front_matter "$new_target/docs/ai/STANDARD.md"
assert_front_matter "$new_target/docs/ai/DEEP.md"
assert_front_matter "$new_target/docs/ai/LESSONS.md"
assert_front_matter "$new_target/docs/ai/PRINCIPLES.md"
assert_contains "$new_target/docs/AI_ONBOARDING_PROMPT.md" "AI Onboarding Prompt"
assert_contains "$new_target/docs/AI_ONBOARDING_PROMPT.md" "docs/PROJECT_SCAN.json"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Background"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## What you will change"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Validation checklist"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Out of scope"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Expected deliverable"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Constraints"
assert_contains "$new_target/AGENTS.md" "## Reading Budget"
assert_contains "$new_target/AGENTS.md" "## Reading Order"
assert_contains "$new_target/AGENTS.md" "## Output Policy"
assert_contains "$new_target/AGENTS.md" "## Slice Execution Rules"
assert_contains "$new_target/README.md" "Do not install it globally"
assert_contains "$new_target/README.md" "AGENTS.md"
assert_contains "$new_target/README.md" "Cross-Platform Support"
assert_contains "$new_target/README.md" "Windows PowerShell/CMD"
assert_contains "$new_target/README.md" "npm install --save-dev create-quiver"
assert_contains "$new_target/README.md" "docs/PROJECT_MAP.md"
assert_contains "$new_target/README.md" "Upgrading Existing Projects"
assert_contains "$new_target/README.md" "npx create-quiver migrate"
assert_contains "$new_target/README.md" "only for projects that were already initialized by Quiver"
assert_contains "$new_target/README.md" 'do not use `migrate` as bootstrap'
assert_contains "$new_target/README.md" "npm install --save-dev create-quiver@latest"
assert_contains "$new_target/docs/PROJECT_MAP.md" "Project Map"
assert_contains "$new_target/docs/PROJECT_MAP.md" "## Stack"
assert_contains "$new_target/docs/PROJECT_MAP.md" "## Commands"
check_handoff_output="$(cd "$new_target" && node "$cli" check-handoff "specs/smoke-project/HANDOFF.md")"
if [[ "$check_handoff_output" != *"PASS: Handoff validated at specs/smoke-project/HANDOFF.md"* ]]; then
  echo "check-handoff did not validate the canonical handoff" >&2
  exit 1
fi

if node "$cli" check-handoff "specs/missing-project/HANDOFF.md" >/dev/null 2>&1; then
  echo "check-handoff should fail for a missing handoff file" >&2
  exit 1
fi

cp "$new_target/specs/smoke-project/HANDOFF.md" "$new_target/docs/HANDOFF.md"
if node "$cli" check-handoff "docs/HANDOFF.md" >/dev/null 2>&1; then
  echo "check-handoff should fail for a handoff outside the canonical specs path" >&2
  exit 1
fi

new_handoff_output="$(cd "$new_target" && node "$cli" new-handoff sample-spec)"
if [[ "$new_handoff_output" != *"PASS: Handoff scaffolded at specs/sample-spec/HANDOFF.md"* ]]; then
  echo "new-handoff did not scaffold the canonical handoff" >&2
  exit 1
fi

assert_file "$new_target/specs/sample-spec/HANDOFF.md"
assert_contains "$new_target/specs/sample-spec/HANDOFF.md" "## Background"
assert_contains "$new_target/specs/sample-spec/HANDOFF.md" "## What you will change"
assert_contains "$new_target/specs/sample-spec/HANDOFF.md" "## Validation checklist"
assert_contains "$new_target/specs/sample-spec/HANDOFF.md" "## Out of scope"
assert_contains "$new_target/specs/sample-spec/HANDOFF.md" "## Expected deliverable"
assert_contains "$new_target/specs/sample-spec/HANDOFF.md" "## Constraints"

new_handoff_hash_before="$(shasum "$new_target/specs/sample-spec/HANDOFF.md" | awk '{print $1}')"
if (cd "$new_target" && node "$cli" new-handoff sample-spec) >/dev/null 2>&1; then
  echo "new-handoff should fail when the handoff already exists" >&2
  exit 1
fi
new_handoff_hash_after="$(shasum "$new_target/specs/sample-spec/HANDOFF.md" | awk '{print $1}')"
if [[ "$new_handoff_hash_before" != "$new_handoff_hash_after" ]]; then
  echo "new-handoff should preserve the existing handoff" >&2
  exit 1
fi

bad_handoff_root="$temp_root/bad-handoff-project"
mkdir -p "$bad_handoff_root/specs/smoke-project"
cp "$new_target/specs/smoke-project/HANDOFF.md" "$bad_handoff_root/specs/smoke-project/HANDOFF.md"
node - "$bad_handoff_root/specs/smoke-project/HANDOFF.md" <<'NODE'
const fs = require('fs');
const filePath = process.argv[2];
const text = fs.readFileSync(filePath, 'utf8');
const next = text.replace(/\n## Validation checklist[\s\S]*?## Out of scope\n/, '\n## Out of scope\n');
fs.writeFileSync(filePath, next);
NODE
if node "$cli" check-handoff "$bad_handoff_root/specs/smoke-project/HANDOFF.md" >/dev/null 2>&1; then
  echo "check-handoff should fail when a required section is missing" >&2
  exit 1
fi
if grep -R -nF "Package manager:" "$new_target/docs" | grep -v "docs/PROJECT_MAP.md" >/dev/null 2>&1; then
  echo "Package manager should only be documented in docs/PROJECT_MAP.md" >&2
  exit 1
fi
assert_package_scripts "$new_target/package.json" "new project" \
  quiver:analyze quiver:doctor quiver:migrate quiver:start-slice quiver:check-slice quiver:check-pr quiver:check-handoff check-handoff quiver:cleanup-slice quiver:check-scope quiver:refresh-active-slices

assert_file "$new_target/specs/smoke-project/HANDOFF.md"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Background"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## What you will change"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Validation checklist"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Out of scope"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Expected deliverable"
assert_contains "$new_target/specs/smoke-project/HANDOFF.md" "## Constraints"

check_handoff_output="$(cd "$new_target" && node "$cli" check-handoff "specs/smoke-project/HANDOFF.md")"
if [[ "$check_handoff_output" != *"PASS: Handoff validated at specs/smoke-project/HANDOFF.md"* ]]; then
  echo "check-handoff did not validate the canonical handoff" >&2
  exit 1
fi

if node "$cli" check-handoff "specs/missing-project/HANDOFF.md" >/dev/null 2>&1; then
  echo "check-handoff should fail for a missing handoff file" >&2
  exit 1
fi

cp "$new_target/specs/smoke-project/HANDOFF.md" "$new_target/docs/HANDOFF.md"
if node "$cli" check-handoff "docs/HANDOFF.md" >/dev/null 2>&1; then
  echo "check-handoff should fail for a handoff outside the canonical specs path" >&2
  exit 1
fi

bad_handoff_root="$temp_root/bad-handoff-project"
mkdir -p "$bad_handoff_root/specs/smoke-project"
cp "$new_target/specs/smoke-project/HANDOFF.md" "$bad_handoff_root/specs/smoke-project/HANDOFF.md"
node - "$bad_handoff_root/specs/smoke-project/HANDOFF.md" <<'NODE'
const fs = require('fs');
const filePath = process.argv[2];
const text = fs.readFileSync(filePath, 'utf8');
const next = text.replace(/\n## Validation checklist[\s\S]*?## Out of scope\n/, '\n## Out of scope\n');
fs.writeFileSync(filePath, next);
NODE
if node "$cli" check-handoff "$bad_handoff_root/specs/smoke-project/HANDOFF.md" >/dev/null 2>&1; then
  echo "check-handoff should fail when a required section is missing" >&2
  exit 1
fi

git -C "$new_target" init >/dev/null
git -C "$new_target" config user.name "Quiver Smoke"
git -C "$new_target" config user.email "smoke@example.com"
git -C "$new_target" add .
git -C "$new_target" commit -m "test: init generated project" >/dev/null
git -C "$new_target" branch develop HEAD

npm install --prefix "$new_target" --save-dev "$repo_root" --ignore-scripts --no-audit --no-fund >/dev/null

start_output="$(cd "$new_target" && SLICE_WORKTREES_DIR="$temp_root/worktrees-shell" bash tools/scripts/start-slice.sh --allow-draft specs/smoke-project/slices/slice-template/slice.json)"
if [[ "$start_output" != *"Slice listo para trabajar."* ]]; then
  echo "Missing expected output from start-slice wrapper: Slice listo para trabajar." >&2
  exit 1
fi
assert_file "$new_target/docs/ai/ACTIVE_SLICE.md"
assert_front_matter "$new_target/docs/ai/ACTIVE_SLICE.md"
assert_contains "$new_target/docs/ai/ACTIVE_SLICE.md" "## allowed_files"
assert_contains "$new_target/docs/ai/ACTIVE_SLICE.md" "Definition of Done"

start_again_output="$(cd "$new_target" && SLICE_WORKTREES_DIR="$temp_root/worktrees-shell" bash tools/scripts/start-slice.sh --allow-draft specs/smoke-project/slices/slice-template/slice.json)"
if [[ "$start_again_output" != *"Reemplazando docs/ai/ACTIVE_SLICE.md existente."* ]]; then
  echo "Missing replacement message from start-slice wrapper" >&2
  exit 1
fi

cleanup_output="$(cd "$new_target" && SLICE_WORKTREES_DIR="$temp_root/worktrees-shell" bash tools/scripts/cleanup-slice.sh --discard specs/smoke-project/slices/slice-template/slice.json)"
if [[ "$cleanup_output" != *"PASS: Cleanup finalizado"* ]]; then
  echo "Missing cleanup completion message from wrapper" >&2
  exit 1
fi
if [[ "$cleanup_output" != *"PASS: ACTIVE_SLICE.md eliminado"* ]]; then
  echo "Missing ACTIVE_SLICE.md removal message from wrapper" >&2
  exit 1
fi
if [ -f "$new_target/docs/ai/ACTIVE_SLICE.md" ]; then
  echo "ACTIVE_SLICE.md should be removed after cleanup" >&2
  exit 1
fi

start_missing_output="$(cd "$new_target" && SLICE_WORKTREES_DIR="$temp_root/worktrees-shell" bash tools/scripts/start-slice.sh --allow-draft specs/smoke-project/slices/slice-template/slice.json)"
if [[ "$start_missing_output" != *"Slice listo para trabajar."* ]]; then
  echo "Missing expected output from second start-slice wrapper" >&2
  exit 1
fi
rm "$new_target/docs/ai/ACTIVE_SLICE.md"
cleanup_missing_output="$(cd "$new_target" && SLICE_WORKTREES_DIR="$temp_root/worktrees-shell" bash tools/scripts/cleanup-slice.sh --discard specs/smoke-project/slices/slice-template/slice.json)"
if [[ "$cleanup_missing_output" != *"PASS: Cleanup finalizado"* ]]; then
  echo "Missing cleanup completion message when ACTIVE_SLICE.md was already absent" >&2
  exit 1
fi
if [ -f "$new_target/docs/ai/ACTIVE_SLICE.md" ]; then
  echo "ACTIVE_SLICE.md should stay removed after cleanup without file" >&2
  exit 1
fi

node - <<'NODE'
const path = require('path');
const { resolveTargetRoot, relativePosixPath } = require('./src/create-quiver/lib/paths');

const resolved = resolveTargetRoot('C:\\Users\\Fabricio\\repo', 'folder with spaces', path.win32);
if (!resolved.includes('folder with spaces')) {
  throw new Error('Windows-style path resolution did not preserve the target folder name');
}

const relative = relativePosixPath('C:\\Users\\Fabricio\\repo', 'C:\\Users\\Fabricio\\repo\\docs\\PROJECT_SCAN.json', path.win32);
if (relative !== 'docs/PROJECT_SCAN.json') {
  throw new Error(`Expected portable relative path, got ${relative}`);
}
NODE
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!data.last_analysis_at) { throw new Error("analysis metadata missing after analyze"); }' "$new_target/.quiver/state.json"

node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!data.project || !data.stack || !data.commands || !data.structure || !data.ci || !data.docs || !Array.isArray(data.risks) || !Array.isArray(data.skipped_paths)) { throw new Error("invalid project scan shape"); }' "$new_target/docs/PROJECT_SCAN.json"

mkdir -p "$existing_target"
printf 'keep me\n' > "$existing_target/keep.txt"

node "$cli" --name "Existing Repo" --dir "$existing_target" >/dev/null
(
  cd "$existing_target"
  node "$cli" analyze >/dev/null
  node "$cli" doctor >/dev/null
)

node "$cli" --name "Space Project" --dir "$space_target" >/dev/null
(
  cd "$space_target"
  node "$cli" analyze >/dev/null
  node "$cli" doctor >/dev/null
)

assert_file "$existing_target/keep.txt"
assert_file "$existing_target/AGENTS.md"
assert_file "$existing_target/README.md"
assert_file "$existing_target/docs/INDEX.md"
assert_file "$existing_target/docs/COMMANDS.md"
assert_file "$existing_target/docs/ai/QUICK.md"
assert_file "$existing_target/docs/ai/STANDARD.md"
assert_file "$existing_target/docs/ai/DEEP.md"
assert_file "$existing_target/docs/ai/LESSONS.md"
assert_file "$existing_target/docs/ai/PRINCIPLES.md"
assert_file "$existing_target/docs/DECISIONS.md"
assert_file "$existing_target/docs/AI_CONTEXT.md"
assert_file "$existing_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$existing_target/docs/PROJECT_SCAN.json"
assert_file "$existing_target/docs/PROJECT_MAP.md"
assert_file "$existing_target/specs/existing-repo/HANDOFF.md"
assert_project_map_sections "$existing_target/docs/PROJECT_MAP.md"
assert_file "$existing_target/.quiver/state.json"
assert_file "$existing_target/docs/SUPPORT_MATRIX.md"
assert_file "$existing_target/docs/TROUBLESHOOTING.md"
assert_front_matter "$existing_target/docs/AI_CONTEXT.md"
assert_front_matter "$existing_target/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$existing_target/docs/CONTEXTO.md"
assert_front_matter "$existing_target/docs/STATUS.md"
assert_front_matter "$existing_target/docs/WORKFLOW.md"
assert_front_matter "$existing_target/docs/ai/QUICK.md"
assert_front_matter "$existing_target/docs/ai/STANDARD.md"
assert_front_matter "$existing_target/docs/ai/DEEP.md"
assert_front_matter "$existing_target/docs/ai/LESSONS.md"
assert_front_matter "$existing_target/docs/ai/PRINCIPLES.md"
assert_contains "$existing_target/docs/COMMANDS.md" "| Command | Purpose | OS | Since |"
assert_contains "$existing_target/docs/SUPPORT_MATRIX.md" "## Cross-Platform Authoring Rules"
assert_contains "$existing_target/docs/COMMANDS.md" "src/create-quiver/lib/slice-graph.js"
assert_package_scripts "$existing_target/package.json" "existing project" \
  quiver:analyze quiver:doctor quiver:migrate quiver:start-slice quiver:check-slice quiver:check-pr quiver:check-handoff check-handoff quiver:cleanup-slice quiver:check-scope quiver:refresh-active-slices
assert_file "$space_target/README.md"
assert_file "$space_target/AGENTS.md"
assert_file "$space_target/docs/PROJECT_SCAN.json"
assert_file "$space_target/docs/PROJECT_MAP.md"
assert_file "$space_target/docs/COMMANDS.md"
assert_file "$space_target/docs/ai/QUICK.md"
assert_file "$space_target/docs/ai/STANDARD.md"
assert_file "$space_target/docs/ai/DEEP.md"
assert_file "$space_target/docs/ai/LESSONS.md"
assert_file "$space_target/docs/ai/PRINCIPLES.md"
assert_file "$space_target/specs/space-project/HANDOFF.md"
assert_project_map_sections "$space_target/docs/PROJECT_MAP.md"
assert_file "$space_target/docs/DECISIONS.md"
assert_contains "$space_target/docs/COMMANDS.md" "\`quiver:plan\`"
assert_contains "$space_target/docs/COMMANDS.md" "src/create-quiver/lib/slice-graph.js"
assert_contains "$space_target/docs/SUPPORT_MATRIX.md" "## Cross-Platform Authoring Rules"
assert_front_matter "$space_target/docs/AI_CONTEXT.md"
assert_front_matter "$space_target/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$space_target/docs/CONTEXTO.md"
assert_front_matter "$space_target/docs/STATUS.md"
assert_front_matter "$space_target/docs/WORKFLOW.md"
assert_front_matter "$space_target/docs/ai/QUICK.md"
assert_front_matter "$space_target/docs/ai/STANDARD.md"
assert_front_matter "$space_target/docs/ai/DEEP.md"
assert_front_matter "$space_target/docs/ai/LESSONS.md"
assert_front_matter "$space_target/docs/ai/PRINCIPLES.md"

node "$cli" --name "Legacy Project" --dir "$legacy_target" >/dev/null
printf 'keep me\n' > "$legacy_target/AGENTS.md"
printf 'keep me\n' >> "$legacy_target/docs/SEARCH.md"
node - "$legacy_target/package.json" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

delete pkg.scripts['quiver:migrate'];
delete pkg.scripts['quiver:analyze'];
delete pkg.scripts['quiver:doctor'];
delete pkg.scripts['quiver:start-slice'];
delete pkg.scripts['quiver:check-slice'];
delete pkg.scripts['quiver:check-pr'];
delete pkg.scripts['quiver:cleanup-slice'];
delete pkg.scripts['quiver:check-scope'];
delete pkg.scripts['quiver:refresh-active-slices'];
pkg.scripts.lint = 'echo lint';

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
NODE
rm "$legacy_target/.quiver/state.json"
rm "$legacy_target/docs/AI_ONBOARDING_PROMPT.md"
rm "$legacy_target/tools/scripts/migrate-project.sh"

doctor_before_migrate_output="$(cd "$legacy_target" && node "$cli" doctor 2>&1 || true)"

if [[ "$doctor_before_migrate_output" != *"Run migration first: npx create-quiver migrate"* ]]; then
  echo "Doctor output did not recommend migration for legacy project" >&2
  exit 1
fi

if [[ "$doctor_before_migrate_output" == *'Run init first: npx create-quiver --name "Project Name"'* ]]; then
  echo "Doctor should not recommend init first for a legacy Quiver project" >&2
  exit 1
fi

migrate_output="$(cd "$legacy_target" && node "$cli" migrate)"

if [[ "$migrate_output" != *"Quiver migration completed for"* ]]; then
  echo "Migrate output did not report completion" >&2
  exit 1
fi

assert_contains "$legacy_target/docs/SEARCH.md" "keep me"
assert_contains "$legacy_target/AGENTS.md" "keep me"
assert_file "$legacy_target/docs/COMMANDS.md"
assert_file "$legacy_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$legacy_target/docs/DECISIONS.md"
assert_file "$legacy_target/docs/ai/QUICK.md"
assert_file "$legacy_target/docs/ai/STANDARD.md"
assert_file "$legacy_target/docs/ai/DEEP.md"
assert_file "$legacy_target/docs/ai/LESSONS.md"
assert_file "$legacy_target/docs/ai/PRINCIPLES.md"
assert_file "$legacy_target/tools/scripts/migrate-project.sh"
assert_file "$legacy_target/.quiver/state.json"
assert_file "$legacy_target/specs/legacy-project/HANDOFF.md"
assert_contains "$legacy_target/docs/COMMANDS.md" "| Command | Purpose | OS | Since |"
assert_contains "$legacy_target/docs/COMMANDS.md" "src/create-quiver/lib/slice-graph.js"
assert_contains "$legacy_target/docs/SUPPORT_MATRIX.md" "## Cross-Platform Authoring Rules"
assert_front_matter "$legacy_target/docs/AI_CONTEXT.md"
assert_front_matter "$legacy_target/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$legacy_target/docs/CONTEXTO.md"
assert_front_matter "$legacy_target/docs/STATUS.md"
assert_front_matter "$legacy_target/docs/WORKFLOW.md"
assert_front_matter "$legacy_target/docs/ai/QUICK.md"
assert_front_matter "$legacy_target/docs/ai/STANDARD.md"
assert_front_matter "$legacy_target/docs/ai/DEEP.md"
assert_front_matter "$legacy_target/docs/ai/LESSONS.md"
assert_front_matter "$legacy_target/docs/ai/PRINCIPLES.md"
assert_package_scripts "$legacy_target/package.json" "legacy project after migrate" \
  quiver:analyze quiver:doctor quiver:migrate quiver:start-slice quiver:check-slice quiver:check-pr quiver:check-handoff check-handoff quiver:cleanup-slice quiver:check-scope quiver:refresh-active-slices
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (data.scripts?.lint !== "echo lint") { throw new Error("custom user script was not preserved during migrate"); }' "$legacy_target/package.json"
CLI_VERSION="$cli_version" node -e 'const fs = require("fs"); const expected = process.env.CLI_VERSION; const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (data.migrated_version !== expected || !data.last_migration_at) { throw new Error("migration metadata missing"); }' "$legacy_target/.quiver/state.json"

(
  cd "$legacy_target"
  node "$cli" analyze >/dev/null
)
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!data.last_analysis_at) { throw new Error("analysis metadata missing after analyze"); }' "$legacy_target/.quiver/state.json"

doctor_after_migrate_output="$(cd "$legacy_target" && node "$cli" doctor)"

if [[ "$doctor_after_migrate_output" != *"Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Doctor output did not point to AGENTS.md before the onboarding prompt after migrate and analyze" >&2
  exit 1
fi

tarball_path="$(pack_installer)"

mkdir -p "$installer_root"
npm_config_cache="$temp_root/npm-cache" npm install --prefix "$installer_root" "$tarball_path" --ignore-scripts --no-audit --no-fund >/dev/null

node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" --name "Packaged Project" --dir "$release_target" >/dev/null
(
  cd "$release_target"
  node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" analyze >/dev/null
)
release_doctor_output="$(cd "$release_target" && node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" doctor)"

if [[ "$release_doctor_output" != *"Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Packaged doctor output did not point to AGENTS.md before the onboarding prompt after analyze" >&2
  exit 1
fi

assert_file "$release_target/docs/AI_CONTEXT.md"
assert_file "$release_target/AGENTS.md"
assert_file "$release_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$release_target/docs/DECISIONS.md"
assert_file "$release_target/docs/ai/QUICK.md"
assert_file "$release_target/docs/ai/STANDARD.md"
assert_file "$release_target/docs/ai/DEEP.md"
assert_file "$release_target/docs/ai/LESSONS.md"
assert_file "$release_target/docs/ai/PRINCIPLES.md"
assert_file "$release_target/docs/PROJECT_SCAN.json"
assert_file "$release_target/docs/PROJECT_MAP.md"
assert_file "$release_target/specs/packaged-project/HANDOFF.md"
assert_project_map_sections "$release_target/docs/PROJECT_MAP.md"
assert_front_matter "$release_target/docs/AI_CONTEXT.md"
assert_front_matter "$release_target/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$release_target/docs/CONTEXTO.md"
assert_front_matter "$release_target/docs/STATUS.md"
assert_front_matter "$release_target/docs/WORKFLOW.md"
assert_front_matter "$release_target/docs/ai/QUICK.md"
assert_front_matter "$release_target/docs/ai/STANDARD.md"
assert_front_matter "$release_target/docs/ai/DEEP.md"
assert_front_matter "$release_target/docs/ai/LESSONS.md"
assert_front_matter "$release_target/docs/ai/PRINCIPLES.md"

quick_lines="$(awk 'NF' "$new_target/docs/ai/QUICK.md" | wc -l | awk '{ print $1 }')"
standard_lines="$(awk 'NF' "$new_target/docs/ai/STANDARD.md" | wc -l | awk '{ print $1 }')"

if [[ "$quick_lines" -gt 50 ]]; then
  echo "QUICK.md exceeds 50 non-empty lines: $quick_lines" >&2
  exit 1
fi

if [[ "$standard_lines" -gt 300 ]]; then
  echo "STANDARD.md exceeds 300 non-empty lines: $standard_lines" >&2
  exit 1
fi
assert_package_scripts "$release_target/package.json" "packaged project" \
  quiver:analyze quiver:doctor quiver:migrate quiver:start-slice quiver:check-slice quiver:check-pr quiver:check-handoff check-handoff quiver:cleanup-slice quiver:check-scope quiver:refresh-active-slices

printf 'keep me\n' >> "$release_target/docs/SEARCH.md"
rm "$release_target/docs/AI_ONBOARDING_PROMPT.md"
rm "$release_target/tools/scripts/migrate-project.sh"

release_migrate_output="$(cd "$release_target" && node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" migrate)"

if [[ "$release_migrate_output" != *"Quiver migration completed for"* ]]; then
  echo "Packaged migrate output did not report completion" >&2
  exit 1
fi

assert_contains "$release_target/docs/SEARCH.md" "keep me"
assert_file "$release_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$release_target/tools/scripts/migrate-project.sh"
assert_front_matter "$release_target/docs/AI_CONTEXT.md"
assert_front_matter "$release_target/docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "$release_target/docs/CONTEXTO.md"
assert_front_matter "$release_target/docs/STATUS.md"
assert_front_matter "$release_target/docs/WORKFLOW.md"
assert_front_matter "$release_target/docs/ai/QUICK.md"
assert_front_matter "$release_target/docs/ai/STANDARD.md"
assert_front_matter "$release_target/docs/ai/DEEP.md"
assert_front_matter "$release_target/docs/ai/LESSONS.md"
assert_front_matter "$release_target/docs/ai/PRINCIPLES.md"
release_doctor_after_migrate="$(cd "$release_target" && node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" doctor)"

if [[ "$release_doctor_after_migrate" != *"Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Packaged doctor output did not point to AGENTS.md before the onboarding prompt after migrate" >&2
  exit 1
fi

printf 'create-quiver smoke test passed\n'
