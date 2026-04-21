#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cli="$repo_root/bin/create-quiver.js"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-create-smoke.XXXXXX")"

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
release_target="$temp_root/release-project"
installer_root="$temp_root/installer"

node "$cli" --name "Smoke Project" --dir "$new_target" >/dev/null
node "$cli" doctor --dir "$new_target" >/dev/null

assert_file "$new_target/README.md"
assert_file "$new_target/docs/INDEX.md"
assert_file "$new_target/docs/SUPPORT_MATRIX.md"
assert_file "$new_target/docs/TROUBLESHOOTING.md"
assert_file "$new_target/tools/scripts/start-slice.sh"
assert_file "$new_target/specs/smoke-project/SPEC.md"
assert_file "$new_target/docs-template/scripts/init-docs.sh"

for file in "$new_target/README.md" "$new_target/docs/INDEX.md" "$new_target/docs/WORKFLOW.md"; do
  assert_contains "$file" "Support Matrix"
  assert_contains "$file" "Troubleshooting"
done

mkdir -p "$existing_target"
printf 'keep me\n' > "$existing_target/keep.txt"

node "$cli" --name "Existing Repo" --dir "$existing_target" >/dev/null
node "$cli" doctor --dir "$existing_target" >/dev/null

assert_file "$existing_target/keep.txt"
assert_file "$existing_target/README.md"
assert_file "$existing_target/docs/INDEX.md"
assert_file "$existing_target/docs/SUPPORT_MATRIX.md"
assert_file "$existing_target/docs/TROUBLESHOOTING.md"

tarball_path="$(pack_installer)"

mkdir -p "$installer_root"
npm_config_cache="$temp_root/npm-cache" npm install --prefix "$installer_root" "$tarball_path" --ignore-scripts --no-audit --no-fund >/dev/null

node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" --name "Packaged Project" --dir "$release_target" >/dev/null
node "$installer_root/node_modules/create-quiver/bin/create-quiver.js" doctor --dir "$release_target" >/dev/null

printf 'create-quiver smoke test passed\n'
