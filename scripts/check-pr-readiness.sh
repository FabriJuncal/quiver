#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  bash tools/scripts/check-pr-readiness.sh <ruta-al-slice.json>

Valida que un slice este listo para abrir PR:
- gate de validacion del slice
- pr.md con secciones obligatorias
- secciones detalladas de "Cómo Probar"
- rollback explicito
- branch del slice limpio y con diferencias contra develop
EOF
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

warn() {
  echo "WARN: $1"
}

[[ $# -eq 1 ]] || {
  usage
  exit 1
}

slice_input="$1"

command -v git >/dev/null 2>&1 || fail "git no esta disponible en PATH."
command -v node >/dev/null 2>&1 || fail "node no esta disponible en PATH."

repo_root="$(git rev-parse --show-toplevel)"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ -f "$slice_input" ]] || fail "No existe el slice '$slice_input'."

slice_abs="$(cd "$(dirname "$slice_input")" && pwd)/$(basename "$slice_input")"

"$script_dir/check-slice-readiness.sh" "$slice_abs" --gate validation
"$script_dir/check-scope.sh" "$slice_abs"

slice_meta=()
while IFS= read -r line; do
  slice_meta+=("$line")
done < <(node - "$slice_abs" <<'NODE'
const fs = require('fs');
const path = require('path');

const slicePath = process.argv[2];
const json = JSON.parse(fs.readFileSync(slicePath, 'utf8'));

const branchName = String(json.git?.branch_name || '').trim();
const sliceId = String(json.slice_id || '').trim();
const prPath = path.join(path.dirname(slicePath), 'pr.md');

console.log(branchName);
console.log(sliceId);
console.log(prPath);
NODE
)

[[ ${#slice_meta[@]} -eq 3 ]] || fail "No se pudo leer la metadata del PR del slice."

branch_name="${slice_meta[0]}"
slice_id="${slice_meta[1]}"
pr_abs="${slice_meta[2]}"

[[ -n "$branch_name" ]] || fail "Falta git.branch_name en el slice."
[[ -f "$pr_abs" ]] || fail "Falta pr.md junto al slice."

current_branch="$(git branch --show-current)"
[[ "$current_branch" == "$branch_name" ]] || fail "Debes ejecutar este check desde la rama del slice. Actual: $current_branch Esperada: $branch_name"
pass "La rama actual coincide con la rama declarada por el slice."

if [[ -n "$(git status --porcelain)" ]]; then
  fail "El worktree no esta limpio. Cerra la implementacion antes de abrir el PR."
fi
pass "El worktree esta limpio."

ahead_count="$(git rev-list --count origin/develop..HEAD)"
if [[ "$ahead_count" -le 0 ]]; then
  if git merge-base --is-ancestor HEAD origin/develop; then
    fail "La rama ya fue absorbida por origin/develop. Este gate aplica antes del merge."
  fi
  fail "La rama no tiene commits propios respecto de origin/develop."
fi
pass "La rama tiene commits propios contra origin/develop."

for heading in \
  "## Titulo" \
  "## Resumen" \
  "## Alcance" \
  "## Archivos" \
  "## Cómo Probar (DETALLADO - OBLIGATORIO)" \
  "## Evidencia" \
  "## Rollback" \
  "## Riesgos / Notas"
do
  grep -Fxq "$heading" "$pr_abs" || fail "Falta la seccion obligatoria '$heading' en pr.md."
done
pass "pr.md contiene las secciones obligatorias."

for subheading in \
  "### Entorno Requerido" \
  "### Acceso al Worktree" \
  "### Levantar el Proyecto" \
  "### Casos de Uso" \
  "### Verificación Técnica"
do
  grep -Fxq "$subheading" "$pr_abs" || fail "Falta la subseccion '$subheading' dentro de Cómo Probar."
done
pass "Cómo Probar incluye entorno, acceso al worktree, arranque, casos de uso y verificación técnica."

grep -Eq '#### Caso [0-9]+:' "$pr_abs" || fail "Cómo Probar debe tener al menos un caso de uso documentado (#### Caso 1: ...)."
pass "Al menos un caso de uso documentado."

grep -Eq 'git revert ' "$pr_abs" || fail "Rollback debe incluir al menos un comando git revert."
pass "Rollback incluye comando git revert."

grep -Eiq '^\s*-\s*`manual review`$|^\s*-\s*`revisión manual`$|^\s*-\s*`probar en la pantalla`$|^\s*-\s*`validar visualmente`$' "$pr_abs" && fail "Cómo Probar no puede apoyarse solo en frases genericas."

node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$slice_abs" >/dev/null
pass "slice.json parsea correctamente."

git diff --check >/dev/null
pass "git diff --check no reporta problemas."

echo "PASS: Gate PR listo para '$slice_id'."
