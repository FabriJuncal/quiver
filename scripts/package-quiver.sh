#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-pack.XXXXXX")"
pack_dir="$temp_root/pack"
npm_cache="$temp_root/npm-cache"

cleanup() {
  rm -rf "$temp_root"
}

trap cleanup EXIT

mkdir -p "$pack_dir"
mkdir -p "$npm_cache"

pack_json="$(
  cd "$repo_root" && npm_config_cache="$npm_cache" npm pack --json --pack-destination "$pack_dir"
)"

tarball_name="$(
  node -e 'const data = JSON.parse(process.argv[1]); process.stdout.write(data[0].filename);' "$pack_json"
)"
tarball_path="$pack_dir/$tarball_name"

if [[ ! -f "$tarball_path" ]]; then
  echo "FAIL: no se encontró el tarball generado en $tarball_path" >&2
  exit 1
fi

contents="$(
  tar -tzf "$tarball_path"
)"

require_present() {
  local path="$1"

  if ! printf '%s\n' "$contents" | grep -Fxq "$path"; then
    echo "FAIL: falta '$path' en el paquete" >&2
    exit 1
  fi
}

require_absent() {
  local path="$1"

  if printf '%s\n' "$contents" | grep -Fxq "$path"; then
    echo "FAIL: '$path' no debería publicarse en el paquete" >&2
    exit 1
  fi
}

required_paths=(
  "package/package.json"
  "package/bin/create-quiver.js"
  "package/src/create-quiver/index.js"
  "package/README.md"
  "package/README_FOR_AI.md"
  "package/AGENTS.md.template"
  "package/docs/QUICK.md.template"
  "package/docs/STANDARD.md.template"
  "package/docs/DEEP.md.template"
  "package/docs/DECISIONS.md.template"
  "package/docs/AI_CONTEXT.md.template"
  "package/docs/AI_ONBOARDING_PROMPT.md.template"
  "package/TEMPLATE.md"
  "package/LICENSE"
  "package/CONTRIBUTING.md"
  "package/CODE_OF_CONDUCT.md"
  "package/SECURITY.md"
  "package/CHANGELOG.md"
  "package/ROADMAP.md"
  "package/.github/pull_request_template.md"
  "package/.github/ISSUE_TEMPLATE/bug_report.md"
  "package/.github/ISSUE_TEMPLATE/feature_request.md"
  "package/.github/workflows/ci.yml"
  "package/docs/INDEX.md.template"
  "package/docs/DOCUMENTATION_GUIDE.md.template"
  "package/docs/WORKFLOW.md.template"
  "package/docs/SUPPORT_MATRIX.md.template"
  "package/docs/TROUBLESHOOTING.md.template"
  "package/docs/TESTING_GUIDE_FOR_AI.md.template"
  "package/docs/ai/PRINCIPLES.md"
  "package/docs/ai/RULES.yaml"
  "package/docs/ai/LESSONS.md.template"
  "package/specs/[project-name]/SPEC.md.template"
  "package/specs/[project-name]/STATUS.md.template"
  "package/specs/[project-name]/EVIDENCE_REPORT.md.template"
  "package/specs/[project-name]/slices/pr.md.template"
  "package/specs/[project-name]/slices/slice-template/slice.json"
  "package/scripts/init-docs.sh"
  "package/scripts/start-slice.sh"
  "package/scripts/check-slice-readiness.sh"
  "package/scripts/check-pr-readiness.sh"
  "package/scripts/check-scope.sh"
  "package/scripts/cleanup-slice.sh"
  "package/scripts/release-quiver.sh"
  "package/scripts/refresh-active-slices.sh"
  "package/scripts/migrate-project.sh"
  "package/scripts/package-quiver.sh"
  "package/i18n/es/README.md"
  "package/i18n/es/README_FOR_AI.md"
  "package/i18n/es/TEMPLATE.md"
)

for path in "${required_paths[@]}"; do
  require_present "$path"
done

excluded_paths=(
  "package/package-lock.json"
  "package/tests/"
  "package/examples/"
  "package/.worktrees/"
  "package/specs/quiver-v01/"
  "package/specs/quiver-v02-bootstrap-hardening/"
  "package/specs/quiver-v03-adoption-verification/"
  "package/specs/quiver-v04-zero-friction-installation/"
  "package/scripts/ci/"
)

for path in "${excluded_paths[@]}"; do
  if printf '%s\n' "$contents" | grep -Fq "$path"; then
    echo "FAIL: el paquete incluye contenido fuera del contrato: $path" >&2
    exit 1
  fi
done

printf 'Package smoke passed: %s\n' "$tarball_name"
