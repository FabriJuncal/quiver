#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  bash tools/scripts/cleanup-slice.sh <ruta-al-slice.json> [--close-baseline] [--discard] [--force] [--dry-run]

Politica:
- slice-00: queda congelado por default; no se elimina salvo --close-baseline
- slice-01+: se elimina despues de merge/rechazo/reemplazo segun la politica del repo

Opciones:
  --close-baseline  Permite cerrar y eliminar un slice-00 congelado
  --discard         Permite cerrar un slice no mergeado (descartado/reemplazado)
  --force           Fuerza git worktree remove --force y git branch -D
  --dry-run         Solo informa que haria, no ejecuta cambios
EOF
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

close_baseline="false"
discard="false"
force_delete="false"
dry_run="false"
slice_input=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --close-baseline)
      close_baseline="true"
      ;;
    --discard)
      discard="true"
      ;;
    --force)
      force_delete="true"
      ;;
    --dry-run)
      dry_run="true"
      ;;
    -*)
      fail "Opcion desconocida: $1"
      ;;
    *)
      if [[ -n "$slice_input" ]]; then
        fail "Solo se acepta un slice por ejecucion."
      fi
      slice_input="$1"
      ;;
  esac
  shift
done

[[ -n "$slice_input" ]] || {
  usage
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git no esta disponible en PATH."
command -v node >/dev/null 2>&1 || fail "node no esta disponible en PATH."

repo_root="$(git rev-parse --show-toplevel)"

[[ -f "$slice_input" ]] || fail "No existe el slice '$slice_input'."

slice_abs="$(cd "$(dirname "$slice_input")" && pwd)/$(basename "$slice_input")"

slice_meta=()
while IFS= read -r line; do
  slice_meta+=("$line")
done < <(node - "$slice_abs" "$repo_root" <<'NODE'
const fs = require('fs');
const path = require('path');

const [slicePath, repoRoot] = process.argv.slice(2);
const json = JSON.parse(fs.readFileSync(slicePath, 'utf8'));

const branchName = String(json.git?.branch_name || '').trim();
const sliceId = String(json.slice_id || '').trim();
const isBaseline = sliceId.startsWith('slice-00');
const repoName = path.basename(repoRoot);
const repoParent = path.dirname(repoRoot);
const worktreesRoot = process.env.SLICE_WORKTREES_DIR || path.join(repoParent, '.worktrees', repoName);
const safeBranchName = branchName.replace(/[^A-Za-z0-9._-]/g, '-');
const worktreePath = path.join(worktreesRoot, safeBranchName);

console.log(branchName);
console.log(sliceId);
console.log(isBaseline ? 'true' : 'false');
console.log(worktreePath);
NODE
)

[[ ${#slice_meta[@]} -eq 4 ]] || fail "No se pudo leer la metadata de cleanup del slice."

branch_name="${slice_meta[0]}"
slice_id="${slice_meta[1]}"
is_baseline="${slice_meta[2]}"
worktree_path="${slice_meta[3]}"

[[ -n "$branch_name" ]] || fail "Falta git.branch_name en el slice."

if [[ "$is_baseline" == "true" && "$close_baseline" != "true" ]]; then
  echo "INFO: '$slice_id' es baseline. El worktree queda congelado por default."
  echo "INFO: Usa --close-baseline solo cuando la primera ola del spec ya este estable o mergeada."
  exit 0
fi

current_branch="$(git branch --show-current)"

if [[ "$discard" != "true" ]]; then
  [[ "$current_branch" == "develop" ]] || fail "El cleanup normal debe correrse desde develop. Rama actual: $current_branch"
  [[ -z "$(git status --porcelain)" ]] || fail "El checkout actual no esta limpio. Limpialo antes del cleanup."

  git fetch origin develop >/dev/null 2>&1 || true

  local_develop_sha="$(git rev-parse HEAD)"
  remote_develop_sha="$(git rev-parse origin/develop)"
  [[ "$local_develop_sha" == "$remote_develop_sha" ]] || fail "develop local no esta actualizado. Ejecuta git pull --ff-only antes del cleanup."

  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    git merge-base --is-ancestor "$branch_name" "origin/develop" || fail "La rama '$branch_name' no esta mergeada en origin/develop. Usa --discard si el slice se descarta."
  fi
fi

worktree_exists="false"
branch_exists="false"

[[ -d "$worktree_path" ]] && worktree_exists="true"
git show-ref --verify --quiet "refs/heads/$branch_name" && branch_exists="true"

[[ "$worktree_exists" == "true" || "$branch_exists" == "true" ]] || fail "No existe worktree ni rama local para '$slice_id'."

remove_worktree_cmd=(git worktree remove "$worktree_path")
remove_branch_cmd=(git branch -d "$branch_name")

if [[ "$force_delete" == "true" || "$discard" == "true" ]]; then
  remove_worktree_cmd=(git worktree remove --force "$worktree_path")
  remove_branch_cmd=(git branch -D "$branch_name")
fi

if [[ "$dry_run" == "true" ]]; then
  echo "DRY RUN: slice=$slice_id branch=$branch_name"
  [[ "$worktree_exists" == "true" ]] && echo "DRY RUN: ${remove_worktree_cmd[*]}"
  [[ "$branch_exists" == "true" ]] && echo "DRY RUN: ${remove_branch_cmd[*]}"
  exit 0
fi

if [[ "$worktree_exists" == "true" ]]; then
  "${remove_worktree_cmd[@]}"
  pass "Worktree eliminado: $worktree_path"
fi

if [[ "$branch_exists" == "true" ]]; then
  "${remove_branch_cmd[@]}"
  pass "Rama local eliminada: $branch_name"
fi

if [[ -x "$repo_root/tools/scripts/refresh-active-slices.sh" ]]; then
  "$repo_root/tools/scripts/refresh-active-slices.sh" >/dev/null 2>&1 || true
fi

pass "Cleanup finalizado para '$slice_id'."
