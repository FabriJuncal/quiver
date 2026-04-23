#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
project_name="${1:-Smoke Project}"

project_slug="$(printf '%s' "$project_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')"
smoke_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-init-smoke.XXXXXX")"
target_repo="$smoke_root/target"
cli="$repo_root/bin/create-quiver.js"

cleanup() {
  rm -rf "$smoke_root"
}

trap cleanup EXIT

mkdir -p "$target_repo"
node "$cli" --name "$project_name" --dir "$target_repo" >/dev/null
cd "$target_repo"

assert_file() {
  local path="$1"

  if [[ ! -f "$path" ]]; then
    echo "Missing expected file: $path" >&2
    exit 1
  fi
}

assert_executable() {
  local path="$1"

  if [[ ! -x "$path" ]]; then
    echo "Missing expected executable file: $path" >&2
    exit 1
  fi
}

required_files=(
  "README.md"
  "LICENSE"
  "CONTRIBUTING.md"
  "CODE_OF_CONDUCT.md"
  "SECURITY.md"
  "CHANGELOG.md"
  "ROADMAP.md"
  "docs/INDEX.md"
  "docs/DECISIONS.md"
  "docs/AI_CONTEXT.md"
  "docs/AI_ONBOARDING_PROMPT.md"
  "docs/CONTEXTO.md"
  "docs/WORKFLOW.md"
  "docs/SUPPORT_MATRIX.md"
  "docs/TROUBLESHOOTING.md"
  "docs/TESTING_GUIDE_FOR_AI.md"
  "docs/SEARCH.md"
  ".quiver/state.json"
  "docs/ai/PRINCIPLES.md"
  "docs/ai/RULES.yaml"
  "specs/$project_slug/SPEC.md"
  "specs/$project_slug/STATUS.md"
  "specs/$project_slug/EVIDENCE_REPORT.md"
  ".github/pull_request_template.md"
  ".github/ISSUE_TEMPLATE/bug_report.md"
  ".github/ISSUE_TEMPLATE/feature_request.md"
  ".github/workflows/ci.yml"
  "package.json"
)

for file in "${required_files[@]}"; do
  assert_file "$file"
done

assert_contains() {
  local path="$1"
  local needle="$2"

  if ! grep -Fq "$needle" "$path"; then
    echo "Missing expected content in $path: $needle" >&2
    exit 1
  fi
}

for file in README.md docs/INDEX.md docs/WORKFLOW.md docs/SEARCH.md; do
  assert_contains "$file" "Support Matrix"
  assert_contains "$file" "Troubleshooting"
done

assert_contains "README.md" "Decision Log"
assert_contains "docs/INDEX.md" "Decision Log"
assert_contains "docs/INDEX.md" "DECISIONS.md"

assert_contains "README.md" "npx create-quiver analyze"
assert_contains "README.md" "npx create-quiver doctor"
assert_contains "README.md" "AI Onboarding Prompt"
assert_contains "README.md" "Do not install it globally"
assert_contains "README.md" "Cross-Platform Support"
assert_contains "README.md" "Windows PowerShell/CMD"
assert_contains "README.md" "npm install --save-dev create-quiver"
assert_contains "README.md" "Read docs/AI_ONBOARDING_PROMPT.md and execute it."
assert_contains "README.md" "Context docs were reviewed before the first slice"
assert_contains "README.md" "Upgrading Existing Projects"
assert_contains "README.md" "npx create-quiver migrate"
assert_contains "README.md" "npm install --save-dev create-quiver@latest"

if grep -Fq "npx create-quiver analyze --dir ." README.md; then
  echo "README.md still uses --dir in the main analyze flow" >&2
  exit 1
fi

assert_contains "docs/AI_CONTEXT.md" "AI Context Pack"
assert_contains "docs/AI_CONTEXT.md" "Read First"
assert_contains "docs/AI_CONTEXT.md" "DECISIONS.md"
assert_contains "docs/DECISIONS.md" "Decision Log"
assert_contains "docs/DECISIONS.md" "| Date | Decision | Reason | Alternatives | Impact |"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "AI Onboarding Prompt"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "docs/PROJECT_SCAN.json"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "Do not modify product source code"

required_scripts=(
  "tools/scripts/start-slice.sh"
  "tools/scripts/check-slice-readiness.sh"
  "tools/scripts/check-pr-readiness.sh"
  "tools/scripts/cleanup-slice.sh"
  "tools/scripts/check-scope.sh"
)

for file in "${required_scripts[@]}"; do
  assert_executable "$file"
done

node - "$project_slug" <<'NODE'
const fs = require('fs');

const projectSlug = process.argv[2];
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const required = [
  'quiver:analyze',
  'quiver:doctor',
  'quiver:migrate',
  'quiver:start-slice',
  'quiver:check-slice',
  'quiver:check-pr',
  'quiver:cleanup-slice',
  'quiver:check-scope',
  'quiver:refresh-active-slices',
];
const missing = required.filter((name) => typeof pkg.scripts?.[name] !== 'string');

if (missing.length > 0) {
  console.error(`Missing npm scripts: ${missing.join(', ')}`);
  process.exit(1);
}

const legacy = ['check:slice', 'check:pr', 'start:slice', 'cleanup:slice', 'check:scope', 'refresh:active-slices', 'migrate'];
const missingLegacy = legacy.filter((name) => typeof pkg.scripts?.[name] !== 'string');

if (missingLegacy.length > 0) {
  console.error(`Missing legacy compatibility scripts: ${missingLegacy.join(', ')}`);
  process.exit(1);
}

const expected = [
  `specs/${projectSlug}/SPEC.md`,
  `specs/${projectSlug}/STATUS.md`,
  `specs/${projectSlug}/EVIDENCE_REPORT.md`
];

for (const relPath of expected) {
  if (!fs.existsSync(relPath)) {
    console.error(`Missing expected generated path: ${relPath}`);
    process.exit(1);
  }
}

console.log('package.json and generated spec files are present');
NODE

printf 'init-docs smoke test passed for %s\n' "$project_name"
