#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/quiver-pack.XXXXXX")"
pack_dir="$temp_root/pack"
npm_cache="$temp_root/npm-cache"
install_root="$temp_root/install-root"
dry_run_target="$temp_root/dry-run-project"
cli_version="$(node -p 'require(process.argv[1]).version' "$repo_root/package.json")"

cleanup() {
  rm -rf "$temp_root"
}

trap cleanup EXIT

mkdir -p "$pack_dir"
mkdir -p "$npm_cache"
mkdir -p "$install_root"

pack_json="$(
  cd "$repo_root" && npm_config_cache="$npm_cache" npm pack --json --pack-destination "$pack_dir"
)"

tarball_name="$(
  printf '%s\n' "$pack_json" | node -e 'const fs = require("node:fs"); const data = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(data[0].filename);'
)"
tarball_path="$pack_dir/$tarball_name"

if [[ ! -f "$tarball_path" ]]; then
  echo "FAIL: no se encontró el tarball generado en $tarball_path" >&2
  exit 1
fi

contents="$(
  tar -tzf "$tarball_path"
)"

cd "$repo_root"
# shellcheck disable=SC2016
printf '%s\n' "$contents" | node -e '
  const fs = require("node:fs");
  const { assertPackageSafety } = require("./src/create-quiver/lib/package-safety");

  const paths = fs.readFileSync(0, "utf8").split(/\r?\n/).filter(Boolean);

  try {
    assertPackageSafety(paths);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
'

require_present() {
  local path="$1"

  if ! grep -Fxq "$path" <<<"$contents"; then
    echo "FAIL: falta '$path' en el paquete" >&2
    exit 1
  fi
}

require_absent() {
  local path="$1"

  if grep -Fxq "$path" <<<"$contents"; then
    echo "FAIL: '$path' no debería publicarse en el paquete" >&2
    exit 1
  fi
}

reject_forbidden_content_patterns() {
  local path

  while IFS= read -r path; do
    case "$path" in
      package/package-lock.json|\
      package/CLI_ANALYSIS.md|\
      package/REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md|\
      package/Documentation_Report.pdf|\
      package/WORKTREE_CONTEXT.md|\
      package/.DS_Store|\
      package/*/.DS_Store|\
      package/*.pdf|\
      package/.env|\
      package/.env.*|\
      package/.npmrc|\
      package/.npm/*|\
      package/.ssh/*|\
      package/ssh/*|\
      package/*.pem|\
      package/*.key|\
      package/.claude/*|\
      package/.codex/*|\
      package/.quiver/*|\
      package/.worktrees/*|\
      package/tests/*|\
      package/examples/*|\
      package/scripts/ci/*)
        echo "FAIL: el paquete incluye contenido fuera del contrato: $path" >&2
        exit 1
        ;;
    esac
  done <<<"$contents"
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
  "package/docs/reference/commands.md"
  "package/docs/schema/slice.schema.json"
  "package/docs/reference/slice-schema.md"
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
  "package/CLI_ANALYSIS.md"
  "package/REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md"
  "package/Documentation_Report.pdf"
  "package/.DS_Store"
  "package/WORKTREE_CONTEXT.md"
  "package/tests/"
  "package/examples/"
  "package/.claude/"
  "package/.codex/"
  "package/.quiver/"
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

reject_forbidden_content_patterns

npm_config_cache="$npm_cache" npm install --prefix "$install_root" "$tarball_path" --ignore-scripts --no-audit --no-fund >/dev/null
installed_cli="$install_root/node_modules/create-quiver/bin/create-quiver.js"

if [[ ! -f "$installed_cli" ]]; then
  echo "FAIL: no se encontró el CLI instalado en $installed_cli" >&2
  exit 1
fi

installed_semver="$(node "$installed_cli" --version)"
if [[ "$installed_semver" != "$cli_version" ]]; then
  echo "FAIL: el CLI instalado devolvió versión '$installed_semver', esperada '$cli_version'" >&2
  exit 1
fi

installed_help="$(node "$installed_cli" --help)"
if [[ "$installed_help" != *"version [--json]"* ]] \
  || [[ "$installed_help" != *"spec create"* ]] \
  || [[ "$installed_help" != *"slice start|check|pr|scope|cleanup|refresh-active"* ]]; then
  echo "FAIL: la ayuda del CLI instalado no expone comandos públicos esperados" >&2
  exit 1
fi

node "$installed_cli" init --dry-run --name "Package Smoke" --dir "$dry_run_target" --skip-install >/dev/null
if [[ -e "$dry_run_target" ]]; then
  echo "FAIL: init --dry-run del CLI instalado escribió en $dry_run_target" >&2
  exit 1
fi

printf 'Package smoke passed: %s (installed CLI smoke passed)\n' "$tarball_name"
