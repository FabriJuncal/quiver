#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  bash tools/scripts/start-slice.sh <ruta-al-slice.json>

Lee la metadata git del slice, valida la rama declarada y crea un worktree
afuera de la raiz trackeada del repo.

Variables opcionales:
  SLICE_WORKTREES_DIR  Directorio base para los worktrees.
                       Default: <repo-parent>/.worktrees/<repo-name>
EOF
}

append_unique_line() {
  local file_path="$1"
  local line="$2"

  touch "$file_path"

  if ! grep -Fxq "$line" "$file_path"; then
    printf '%s\n' "$line" >> "$file_path"
  fi
}

ensure_local_exclude() {
  local workdir="$1"
  local pattern="$2"
  local exclude_path

  exclude_path="$(git -C "$workdir" rev-parse --git-path info/exclude)"
  append_unique_line "$exclude_path" "$pattern"
}

write_worktree_context() {
  local target_worktree="$1"
  local target_branch="$2"

  ensure_local_exclude "$target_worktree" "WORKTREE_CONTEXT.md"

  node - "$slice_abs" "$target_worktree" "$target_branch" "$spec_family" "$spec_slug" <<'NODE' > "$target_worktree/WORKTREE_CONTEXT.md"
const fs = require('fs');

const [slicePath, worktreePath, branchName, specFamily, specSlug] = process.argv.slice(2);
const slice = JSON.parse(fs.readFileSync(slicePath, 'utf8'));

function toAlias(ticket) {
  const parts = String(ticket || '').split('-').filter(Boolean);
  const domain = (parts[1] || 'GEN').toUpperCase();
  const suffix = (parts[parts.length - 1] || '00').toUpperCase();
  const short = domain.length <= 3 ? domain : domain.slice(0, 3);
  return `${short}-${suffix}`;
}

function listBlock(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '- n/a';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

const alias = toAlias(slice.ticket);
const status = slice.status || 'pending';
const title = slice.title || slice.slice_id;
const objective = slice.objective || 'Sin objetivo declarado.';

const lines = [
  '# Worktree Context',
  '',
  '> Archivo generado localmente por `tools/scripts/start-slice.sh`.',
  '> No se trackea en git.',
  '',
  `**Alias:** ${alias}`,
  `**Spec:** ${specSlug}`,
  `**Spec family:** ${specFamily}`,
  `**Slice:** ${slice.slice_id}`,
  `**Ticket:** ${slice.ticket}`,
  `**Branch:** ${branchName}`,
  `**Worktree:** ${worktreePath}`,
  `**Status:** ${status}`,
  '',
  '## Title',
  '',
  title,
  '',
  '## Objective',
  '',
  objective,
  '',
  '## Routes',
  '',
  listBlock(slice.ui_scope?.routes),
  '',
  '## Components',
  '',
  listBlock(slice.ui_scope?.components),
  '',
  '## Allowed Files',
  '',
  listBlock(slice.files),
  '',
  '## Constraints',
  '',
  listBlock(slice.not_included),
  '',
  '## Expected Validation',
  '',
  listBlock(slice.acceptance),
  ''
];

process.stdout.write(`${lines.join('\n')}\n`);
NODE
}

refresh_active_slices_board() {
  if [[ -x "$repo_root/tools/scripts/refresh-active-slices.sh" ]]; then
    "$repo_root/tools/scripts/refresh-active-slices.sh" >/dev/null 2>&1 || true
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git no esta disponible en PATH." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node no esta disponible en PATH." >&2
  exit 1
fi

slice_input="$1"
repo_root="$(git rev-parse --show-toplevel)"

if [[ ! -f "$slice_input" ]]; then
  echo "Error: no existe el slice '$slice_input'." >&2
  exit 1
fi

slice_abs="$(cd "$(dirname "$slice_input")" && pwd)/$(basename "$slice_input")"
slice_rel="${slice_abs#$repo_root/}"

case "$slice_rel" in
  specs-fix/*/slices/*/slice.json)
    spec_family="specs-fix"
    spec_slug="$(printf '%s\n' "$slice_rel" | cut -d/ -f2)"
    ;;
  specs/*/slices/*/slice.json)
    spec_family="specs"
    spec_slug="$(printf '%s\n' "$slice_rel" | cut -d/ -f2)"
    ;;
  *)
    echo "Error: el slice debe vivir dentro de specs/ o specs-fix/." >&2
    exit 1
    ;;
esac

slice_meta=()
while IFS= read -r line; do
  slice_meta+=("$line")
done < <(node - "$slice_abs" <<'NODE'
const fs = require('fs');

const slicePath = process.argv[2];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

let json;
try {
  json = JSON.parse(fs.readFileSync(slicePath, 'utf8'));
} catch (error) {
  fail(`No se pudo parsear '${slicePath}' como JSON: ${error.message}`);
}

const ticket = typeof json.ticket === 'string' ? json.ticket.trim() : '';
const git = json.git ?? {};
const branchType = typeof git.branch_type === 'string' ? git.branch_type.trim() : '';
const baseBranch = typeof git.base_branch === 'string' ? git.base_branch.trim() : '';
const branchSlug = typeof git.branch_slug === 'string' ? git.branch_slug.trim() : '';
const branchName = typeof git.branch_name === 'string' ? git.branch_name.trim() : '';
const sliceId = typeof json.slice_id === 'string' ? json.slice_id.trim() : '';

if (!sliceId) {
  fail('Falta "slice_id" en el slice.');
}

if (!ticket) {
  fail('Falta "ticket" en el slice.');
}

if (!branchType || !baseBranch || !branchSlug || !branchName) {
  fail('El bloque "git" debe incluir "branch_type", "base_branch", "branch_slug" y "branch_name".');
}

const expectedBaseByType = {
  feature: 'develop',
  bugfix: 'develop',
  hotfix: 'main'
};

if (!expectedBaseByType[branchType]) {
  fail(`git.branch_type invalido: "${branchType}". Usa "feature", "bugfix" o "hotfix".`);
}

const expectedBaseBranch = expectedBaseByType[branchType];
if (baseBranch !== expectedBaseBranch) {
  fail(`git.base_branch invalido para ${branchType}. Esperado: "${expectedBaseBranch}".`);
}

const expectedBranchName = `${branchType}/${ticket}-${branchSlug}`;
if (branchName !== expectedBranchName) {
  fail(`git.branch_name invalido. Esperado: "${expectedBranchName}".`);
}

console.log(sliceId);
console.log(ticket);
console.log(branchType);
console.log(baseBranch);
console.log(branchSlug);
console.log(branchName);
console.log(String(json.status || 'draft'));
NODE
)

if [[ ${#slice_meta[@]} -ne 7 ]]; then
  echo "Error: no se pudo leer la metadata git del slice." >&2
  exit 1
fi

slice_id="${slice_meta[0]}"
ticket="${slice_meta[1]}"
branch_type="${slice_meta[2]}"
base_branch="${slice_meta[3]}"
branch_slug="${slice_meta[4]}"
branch_name="${slice_meta[5]}"
slice_status="${slice_meta[6]}"

if [[ "$slice_status" == "blocked" ]]; then
  echo "Error: el slice esta bloqueado (status=blocked). Resolve el bloqueante antes de iniciar." >&2
  exit 1
fi

if [[ "$slice_status" == "cancelled" ]]; then
  echo "Error: el slice esta cancelado (status=cancelled)." >&2
  exit 1
fi

if [[ "$slice_status" == "completed" ]]; then
  echo "WARN: el slice ya figura como completed. Si realmente corresponde reejecutarlo, cambia el status a in_progress."
fi

if [[ "$slice_status" == "draft" ]]; then
  echo "WARN: el slice esta en estado 'draft'. Considera marcarlo como 'ready' en slice.json antes de ejecutar."
fi

repo_name="$(basename "$repo_root")"
repo_parent="$(dirname "$repo_root")"
worktrees_root="${SLICE_WORKTREES_DIR:-$repo_parent/.worktrees/$repo_name}"
safe_branch_name="$(printf '%s' "$branch_name" | sed 's#[^A-Za-z0-9._-]#-#g')"
worktree_path="$worktrees_root/$safe_branch_name"

existing_worktree_path="$(
  git worktree list --porcelain | awk -v branch="refs/heads/$branch_name" '
    $1 == "worktree" { path = $2 }
    $1 == "branch" && $2 == branch { print path }
  '
)"

if [[ -n "$existing_worktree_path" ]]; then
  write_worktree_context "$existing_worktree_path" "$branch_name"
  refresh_active_slices_board
  cat <<EOF
La rama ya tiene un worktree asociado.
Alias: $(printf '%s\n' "$ticket" | awk -F- '{ domain=toupper($2); suffix=toupper($NF); short=length(domain)<=3?domain:substr(domain,1,3); print short "-" suffix }')
Spec: $spec_slug
Slice: $slice_id
Ticket: $ticket
Rama: $branch_name
Base: $base_branch
Worktree: $existing_worktree_path
EOF
  exit 0
fi

if [[ -e "$worktree_path" && ! -f "$worktree_path/.git" && ! -d "$worktree_path/.git" ]]; then
  echo "Error: la ruta '$worktree_path' ya existe y no parece un worktree git." >&2
  exit 1
fi

mkdir -p "$worktrees_root"

git fetch origin --prune >/dev/null 2>&1 || true

if git show-ref --verify --quiet "refs/heads/$branch_name"; then
  git worktree add "$worktree_path" "$branch_name"
elif git ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
  git fetch origin "$branch_name:$branch_name" >/dev/null 2>&1
  git worktree add "$worktree_path" "$branch_name"
else
  git fetch origin "$base_branch" >/dev/null 2>&1
  git worktree add -b "$branch_name" "$worktree_path" "origin/$base_branch"
fi

write_worktree_context "$worktree_path" "$branch_name"
refresh_active_slices_board

cat <<EOF
Slice listo para trabajar.
Alias: $(printf '%s\n' "$ticket" | awk -F- '{ domain=toupper($2); suffix=toupper($NF); short=length(domain)<=3?domain:substr(domain,1,3); print short "-" suffix }')
Spec: $spec_slug
Slice: $slice_id
Ticket: $ticket
Tipo de rama: $branch_type
Base: $base_branch
Slug: $branch_slug
Rama: $branch_name
Worktree: $worktree_path
Contexto: $worktree_path/WORKTREE_CONTEXT.md
EOF
