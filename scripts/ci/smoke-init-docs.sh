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
rm -rf "$target_repo/docs-template"
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
  "AGENTS.md"
  "README.md"
  "LICENSE"
  "CONTRIBUTING.md"
  "CODE_OF_CONDUCT.md"
  "SECURITY.md"
  "CHANGELOG.md"
  "ROADMAP.md"
  "docs/INDEX.md"
  "docs/COMMANDS.md"
  "docs/ai/QUICK.md"
  "docs/ai/STANDARD.md"
  "docs/ai/DEEP.md"
  "docs/ai/LESSONS.md"
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
  "specs/$project_slug/slices/slice-template/slice.json"
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

assert_contains "AGENTS.md" "## Reading Budget"
assert_contains "AGENTS.md" "## Reading Order"
assert_contains "AGENTS.md" "## Output Policy"
assert_contains "AGENTS.md" "## Slice Execution Rules"
assert_contains "AGENTS.md" "QUICK"
assert_contains "docs/COMMANDS.md" "| Command | Purpose | OS | Since | Example |"
assert_contains "docs/COMMANDS.md" "\`quiver:plan\`"
assert_contains "docs/COMMANDS.md" "\`quiver:graph\`"
assert_contains "docs/COMMANDS.md" "Mermaid"
assert_contains "docs/COMMANDS.md" "DOT"
assert_contains "docs/COMMANDS.md" "docs/examples/plan.md"
assert_contains "docs/COMMANDS.md" "docs/examples/graph.md"
assert_file "docs/examples/plan.md"
assert_file "docs/examples/graph.md"
assert_contains "docs/COMMANDS.md" "src/create-quiver/lib/slice-graph.js"
assert_contains "docs/examples/graph.md" '```mermaid'
assert_contains "docs/examples/graph.md" "digraph QuiverGraph"
assert_contains "docs/examples/graph.md" "GitHub renders Mermaid"
assert_contains "docs/SUPPORT_MATRIX.md" "## Cross-Platform Authoring Rules"
assert_contains "docs/SUPPORT_MATRIX.md" "No shell invocations for logic"
assert_contains "docs/SUPPORT_MATRIX.md" "Optional external tools"
assert_front_matter "docs/AI_CONTEXT.md"
assert_front_matter "docs/AI_ONBOARDING_PROMPT.md"
assert_front_matter "docs/CONTEXTO.md"
assert_front_matter "docs/STATUS.md"
assert_front_matter "docs/WORKFLOW.md"
assert_front_matter "docs/ai/QUICK.md"
assert_front_matter "docs/ai/STANDARD.md"
assert_front_matter "docs/ai/DEEP.md"
assert_front_matter "docs/ai/LESSONS.md"
assert_front_matter "docs/ai/PRINCIPLES.md"

for file in README.md docs/INDEX.md docs/WORKFLOW.md docs/SEARCH.md; do
  assert_contains "$file" "Support Matrix"
  assert_contains "$file" "Troubleshooting"
done

assert_contains "README.md" "Decision Log"
assert_contains "docs/INDEX.md" "Decision Log"
assert_contains "docs/INDEX.md" "DECISIONS.md"
assert_contains "docs/INDEX.md" "./ai/QUICK.md"
assert_contains "docs/INDEX.md" "./ai/STANDARD.md"
assert_contains "docs/INDEX.md" "./ai/DEEP.md"
assert_contains "docs/INDEX.md" "Project Map"

assert_contains "README.md" "npx create-quiver analyze"
assert_contains "README.md" "npx create-quiver doctor"
assert_contains "README.md" "AI Onboarding Prompt"
assert_contains "README.md" "docs/PROJECT_MAP.md"
assert_contains "README.md" "AGENTS.md"
assert_contains "README.md" "Do not install it globally"
assert_contains "README.md" "Cross-Platform Support"
assert_contains "README.md" "Windows PowerShell/CMD"
assert_contains "README.md" "npm install --save-dev create-quiver"
assert_contains "README.md" "npm run quiver:plan"
assert_contains "README.md" "npm run quiver:graph"
assert_contains "README.md" "graph --format mermaid"
assert_contains "README.md" "graph --format dot"
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
assert_contains "docs/AI_CONTEXT.md" "docs/PROJECT_MAP.md"
assert_contains "docs/AI_CONTEXT.md" "DECISIONS.md"
assert_contains "docs/AI_CONTEXT.md" "Project Map"
assert_contains "docs/DECISIONS.md" "Decision Log"
assert_contains "docs/DECISIONS.md" "| Date | Decision | Reason | Alternatives | Impact |"
assert_contains "docs/CONTEXTO.md" "docs/PROJECT_MAP.md"
assert_contains "docs/STATUS.md" "docs/PROJECT_MAP.md"
assert_contains "docs/WORKFLOW.md" "docs/PROJECT_MAP.md"
assert_contains "docs/ai/QUICK.md" "Quick Context"
assert_contains "docs/ai/QUICK.md" "docs/PROJECT_MAP.md"
assert_contains "docs/ai/STANDARD.md" "Standard Context"
assert_contains "docs/ai/STANDARD.md" "V13 Mode Guidance"
assert_contains "docs/ai/DEEP.md" "Deep Context"
assert_contains "docs/ai/DEEP.md" "What Belongs Here"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "AI Onboarding Prompt"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "docs/PROJECT_SCAN.json"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "docs/PROJECT_MAP.md"
assert_contains "docs/AI_ONBOARDING_PROMPT.md" "Do not modify product source code"
assert_contains "specs/$project_slug/slices/slice-template/slice.json" "// \"depends_on\": ["
assert_contains "specs/$project_slug/slices/slice-template/slice.json" "// \"parallel_safe\": \"never\""
assert_contains "specs/$project_slug/slices/slice-template/slice.json" "// \"parallel_safe_reason\": \"Explain why this slice cannot run in parallel.\""

quick_lines="$(awk 'NF' docs/ai/QUICK.md | wc -l | awk '{ print $1 }')"
standard_lines="$(awk 'NF' docs/ai/STANDARD.md | wc -l | awk '{ print $1 }')"

if [ "$quick_lines" -gt 50 ]; then
  echo "docs/ai/QUICK.md exceeds 50 non-empty lines: $quick_lines" >&2
  exit 1
fi

if [ "$standard_lines" -gt 300 ]; then
  echo "docs/ai/STANDARD.md exceeds 300 non-empty lines: $standard_lines" >&2
  exit 1
fi

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
