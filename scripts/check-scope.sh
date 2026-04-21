#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  bash tools/scripts/check-scope.sh <ruta-al-slice.json> [--strict]

Compara los archivos tocados en la rama del slice contra los declarados
en slice.json.files. Detecta scope creep: archivos modificados fuera del
alcance declarado.

Opciones:
  --strict   Convierte cualquier archivo fuera de scope en error (default: warning)
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

strict="false"
slice_input=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --strict)
      strict="true"
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

[[ -n "$slice_input" ]] || fail "Debes indicar la ruta del slice."

command -v git >/dev/null 2>&1 || fail "git no esta disponible en PATH."
command -v node >/dev/null 2>&1 || fail "node no esta disponible en PATH."

repo_root="$(git rev-parse --show-toplevel)"
[[ -f "$slice_input" ]] || fail "No existe el slice '$slice_input'."
slice_abs="$(cd "$(dirname "$slice_input")" && pwd)/$(basename "$slice_input")"

# Leer archivos declarados en slice.json
declared_b64=$(node - "$slice_abs" <<'NODE'
const fs = require('fs');
let json;
try {
  json = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
} catch (e) {
  process.stderr.write('Error: No se pudo parsear slice.json: ' + e.message + '\n');
  process.exit(1);
}
const files = Array.isArray(json.files) ? json.files : [];
process.stdout.write(Buffer.from(JSON.stringify(files)).toString('base64'));
NODE
)

# Obtener archivos tocados en la rama respecto de origin/develop
touched_raw=""
if git rev-parse --verify "origin/develop" >/dev/null 2>&1; then
  touched_raw=$(git diff --name-only "origin/develop...HEAD" 2>/dev/null || echo "")
elif git rev-parse --verify "develop" >/dev/null 2>&1; then
  touched_raw=$(git diff --name-only "develop...HEAD" 2>/dev/null || echo "")
else
  warn "No se encontro rama origin/develop ni develop. Saltando check de scope."
  exit 0
fi

if [[ -z "$touched_raw" ]]; then
  warn "No se encontraron archivos modificados respecto de develop."
  exit 0
fi

touched_b64=$(echo "$touched_raw" | base64)

# Comparar con node
scope_result=$(node - "$declared_b64" "$touched_b64" <<'NODE'
const declared = JSON.parse(Buffer.from(process.argv[2], 'base64').toString('utf8'));
const touched  = Buffer.from(process.argv[3], 'base64').toString('utf8')
  .trim().split('\n').filter(Boolean);

// Archivos generados automaticamente por el workflow — siempre permitidos
const autoAllowed = [
  /^specs\//,
  /^docs\//,
  /^\.worktrees\//,
  /WORKTREE_CONTEXT\.md$/,
  /EVIDENCE_REPORT\.md$/,
  /STATUS\.md$/,
  /SPEC\.md$/,
  /\/pr\.md$/,
  /\/slice\.json$/,
];

const outOfScope = touched.filter(file => {
  if (declared.includes(file)) return false;
  if (autoAllowed.some(re => re.test(file))) return false;
  return true;
});

process.stdout.write(outOfScope.join('\n'));
NODE
)

if [[ -z "$scope_result" ]]; then
  pass "Todos los archivos tocados estan dentro del scope declarado en slice.json."
  exit 0
fi

violation_count=0
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  violation_count=$((violation_count + 1))
  if [[ "$strict" == "true" ]]; then
    echo "FAIL: Archivo fuera de scope: $file" >&2
  else
    warn "Archivo fuera de scope: $file"
  fi
done <<< "$scope_result"

if [[ "$violation_count" -gt 0 ]]; then
  if [[ "$strict" == "true" ]]; then
    fail "$violation_count archivo(s) fuera del scope declarado. Actualiza slice.json.files o revierte los cambios fuera de alcance."
  else
    warn "$violation_count archivo(s) fuera del scope declarado. Considera actualizar slice.json.files o revertir los cambios no previstos."
  fi
fi
