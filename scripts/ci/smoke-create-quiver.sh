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

assert_contains() {
  local path="$1"
  local needle="$2"

  if ! grep -Fq "$needle" "$path"; then
    echo "Missing expected content in $path: $needle" >&2
    exit 1
  fi
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
existing_target="$temp_root/existing-project"
legacy_target="$temp_root/legacy-project"
release_target="$temp_root/release-project"
installer_root="$temp_root/installer"

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

(
  cd "$new_target"
  node "$cli" analyze >/dev/null
)
doctor_after_analyze="$(cd "$new_target" && node "$cli" doctor)"

if [[ "$doctor_after_analyze" != *"Read docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Doctor output did not point to the AI onboarding prompt after analyze" >&2
  exit 1
fi

assert_file "$new_target/README.md"
assert_file "$new_target/docs/INDEX.md"
assert_file "$new_target/docs/AI_CONTEXT.md"
assert_file "$new_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$new_target/docs/PROJECT_SCAN.json"
assert_file "$new_target/docs/PROJECT_MAP.md"
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

assert_contains "$new_target/docs/AI_CONTEXT.md" "AI Context Pack"
assert_contains "$new_target/docs/AI_CONTEXT.md" "Read First"
assert_contains "$new_target/docs/AI_ONBOARDING_PROMPT.md" "AI Onboarding Prompt"
assert_contains "$new_target/docs/AI_ONBOARDING_PROMPT.md" "docs/PROJECT_SCAN.json"
assert_contains "$new_target/README.md" "Do not install it globally"
assert_contains "$new_target/README.md" "npm install --save-dev create-quiver"
assert_contains "$new_target/README.md" "Upgrading Existing Projects"
assert_contains "$new_target/README.md" "npx create-quiver migrate"
assert_contains "$new_target/README.md" "npm install --save-dev create-quiver@latest"
assert_contains "$new_target/docs/PROJECT_MAP.md" "Project Map"
assert_contains "$new_target/docs/PROJECT_MAP.md" "## Stack"
assert_contains "$new_target/docs/PROJECT_MAP.md" "## Commands"
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (data.scripts?.migrate !== "bash tools/scripts/migrate-project.sh") { throw new Error("migrate script missing from generated package.json"); }' "$new_target/package.json"
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

assert_file "$existing_target/keep.txt"
assert_file "$existing_target/README.md"
assert_file "$existing_target/docs/INDEX.md"
assert_file "$existing_target/docs/AI_CONTEXT.md"
assert_file "$existing_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$existing_target/docs/PROJECT_SCAN.json"
assert_file "$existing_target/docs/PROJECT_MAP.md"
assert_file "$existing_target/.quiver/state.json"
assert_file "$existing_target/docs/SUPPORT_MATRIX.md"
assert_file "$existing_target/docs/TROUBLESHOOTING.md"
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (data.scripts?.migrate !== "bash tools/scripts/migrate-project.sh") { throw new Error("migrate script missing from existing project package.json"); }' "$existing_target/package.json"

node "$cli" --name "Legacy Project" --dir "$legacy_target" >/dev/null
printf 'keep me\n' >> "$legacy_target/docs/SEARCH.md"
rm "$legacy_target/.quiver/state.json"
rm "$legacy_target/docs/AI_ONBOARDING_PROMPT.md"
rm "$legacy_target/tools/scripts/migrate-project.sh"

doctor_before_migrate_output="$(cd "$legacy_target" && node "$cli" doctor 2>&1 || true)"

if [[ "$doctor_before_migrate_output" != *"Run migration first: npx create-quiver migrate"* ]]; then
  echo "Doctor output did not recommend migration for legacy project" >&2
  exit 1
fi

migrate_output="$(cd "$legacy_target" && node "$cli" migrate)"

if [[ "$migrate_output" != *"Quiver migration completed for"* ]]; then
  echo "Migrate output did not report completion" >&2
  exit 1
fi

assert_contains "$legacy_target/docs/SEARCH.md" "keep me"
assert_file "$legacy_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$legacy_target/tools/scripts/migrate-project.sh"
assert_file "$legacy_target/.quiver/state.json"
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (data.scripts?.migrate !== "bash tools/scripts/migrate-project.sh") { throw new Error("migrate script missing after migrate"); }' "$legacy_target/package.json"
CLI_VERSION="$cli_version" node -e 'const fs = require("fs"); const expected = process.env.CLI_VERSION; const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (data.migrated_version !== expected || !data.last_migration_at) { throw new Error("migration metadata missing"); }' "$legacy_target/.quiver/state.json"

(
  cd "$legacy_target"
  node "$cli" analyze >/dev/null
)
node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!data.last_analysis_at) { throw new Error("analysis metadata missing after analyze"); }' "$legacy_target/.quiver/state.json"

doctor_after_migrate_output="$(cd "$legacy_target" && node "$cli" doctor)"

if [[ "$doctor_after_migrate_output" != *"Read docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Doctor output did not point to the AI onboarding prompt after migrate and analyze" >&2
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

if [[ "$release_doctor_output" != *"Read docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Packaged doctor output did not point to the AI onboarding prompt after analyze" >&2
  exit 1
fi

assert_file "$release_target/docs/AI_CONTEXT.md"
assert_file "$release_target/docs/AI_ONBOARDING_PROMPT.md"
assert_file "$release_target/docs/PROJECT_SCAN.json"
assert_file "$release_target/docs/PROJECT_MAP.md"

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
release_doctor_after_migrate="$(cd "$release_target" && node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" doctor)"

if [[ "$release_doctor_after_migrate" != *"Read docs/AI_ONBOARDING_PROMPT.md and execute it."* ]]; then
  echo "Packaged doctor output did not point to the AI onboarding prompt after migrate" >&2
  exit 1
fi

printf 'create-quiver smoke test passed\n'
