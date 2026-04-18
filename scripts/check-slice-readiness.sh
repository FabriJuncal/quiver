#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  bash tools/scripts/check-slice-readiness.sh <ruta-al-slice.json> [--gate execution|validation] [--strict-overlap]

Valida que un slice tenga las precondiciones mínimas para ejecutarse o pasar a validación.

Opciones:
  --gate <mode>       Gate a validar. Default: execution
                      ready      -> requiere status=ready (gate entre Track 1 y Track 2)
                      execution  -> metadata, spec base mergeado y overlap
                      validation -> execution + estado completado y timestamps
  --strict-overlap    Convierte overlap con worktrees activos en error
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

gate="execution"
strict_overlap="false"
slice_input=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --gate)
      shift
      [[ $# -gt 0 ]] || fail "Falta valor para --gate."
      gate="$1"
      ;;
    --strict-overlap)
      strict_overlap="true"
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

case "$gate" in
  ready|execution|validation) ;;
  *) fail "Gate invalido: $gate. Usa ready, execution o validation." ;;
esac

command -v git >/dev/null 2>&1 || fail "git no esta disponible en PATH."
command -v node >/dev/null 2>&1 || fail "node no esta disponible en PATH."

repo_root="$(git rev-parse --show-toplevel)"

[[ -f "$slice_input" ]] || fail "No existe el slice '$slice_input'."

slice_abs="$(cd "$(dirname "$slice_input")" && pwd)/$(basename "$slice_input")"
slice_rel="${slice_abs#$repo_root/}"

slice_meta=()
while IFS= read -r line; do
  slice_meta+=("$line")
done < <(node - "$slice_abs" "$slice_rel" <<'NODE'
const fs = require('fs');
const path = require('path');

const [slicePath, sliceRel] = process.argv.slice(2);

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
const sliceId = typeof json.slice_id === 'string' ? json.slice_id.trim() : '';
const branchName = typeof json.git?.branch_name === 'string' ? json.git.branch_name.trim() : '';
const files = Array.isArray(json.files) ? json.files : [];
const acceptance = Array.isArray(json.acceptance) ? json.acceptance : [];
const specDir = path.dirname(path.dirname(path.dirname(sliceRel)));

if (!sliceId) {
  fail('Falta "slice_id" en el slice.');
}

if (!ticket) {
  fail('Falta "ticket" en el slice.');
}

if (!branchName) {
  fail('Falta "git.branch_name" en el slice.');
}

if (files.length === 0) {
  fail('El slice debe declarar al menos un archivo en "files".');
}

if (acceptance.length === 0) {
  fail('El slice debe declarar criterios en "acceptance".');
}

console.log(sliceId);
console.log(ticket);
console.log(branchName);
console.log(json.status || 'pending');
console.log(sliceId.startsWith('slice-00') ? 'true' : 'false');
console.log(specDir);
console.log(Buffer.from(JSON.stringify(files)).toString('base64'));
console.log(String(json.actual_hours ?? ''));
console.log(json.started_at ?? '');
console.log(json.completed_at ?? '');
NODE
)

[[ ${#slice_meta[@]} -eq 10 ]] || fail "No se pudo leer la metadata del slice."

slice_id="${slice_meta[0]}"
ticket="${slice_meta[1]}"
branch_name="${slice_meta[2]}"
slice_status="${slice_meta[3]}"
is_baseline="${slice_meta[4]}"
spec_dir_rel="${slice_meta[5]}"
files_b64="${slice_meta[6]}"
actual_hours="${slice_meta[7]}"
started_at="${slice_meta[8]}"
completed_at="${slice_meta[9]}"

for spec_file in SPEC.md STATUS.md EVIDENCE_REPORT.md; do
  [[ -f "$repo_root/$spec_dir_rel/$spec_file" ]] || fail "Falta '$spec_dir_rel/$spec_file'."
done
pass "El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md."

if git cat-file -e "origin/develop:$slice_rel" 2>/dev/null; then
  pass "El slice ya existe en origin/develop (PR base documental mergeado)."
else
  if [[ "$gate" == "validation" ]]; then
    warn "El slice no existe todavia en origin/develop. El PR base documental sigue pendiente de merge. Podes abrir el PR del slice igual — el humano mergea en orden."
  else
    fail "El slice no existe en origin/develop. Mergea primero el PR base documental."
  fi
fi

overlap_output="$(node - "$repo_root" "$branch_name" "$files_b64" <<'NODE'
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const [repoRoot, currentBranch, currentFilesB64] = process.argv.slice(2);
const currentFiles = JSON.parse(Buffer.from(currentFilesB64, 'base64').toString('utf8'));

function run(cmd, cwd = repoRoot) {
  try {
    return cp.execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch {
    return '';
  }
}

function walkSlices(rootDir, acc) {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkSlices(fullPath, acc);
      continue;
    }

    if (entry.isFile() && entry.name === 'slice.json' && fullPath.includes(`${path.sep}slices${path.sep}`)) {
      const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const branchName = json.git?.branch_name;
      if (!branchName) {
        continue;
      }

      acc.set(branchName, {
        sliceId: json.slice_id || '',
        files: Array.isArray(json.files) ? json.files : []
      });
    }
  }
}

function parseWorktrees(text) {
  const entries = [];
  const chunks = text.trim().split('\n\n').filter(Boolean);

  for (const chunk of chunks) {
    const entry = {};
    for (const line of chunk.split('\n')) {
      const idx = line.indexOf(' ');
      if (idx === -1) {
        continue;
      }
      entry[line.slice(0, idx)] = line.slice(idx + 1);
    }
    entries.push(entry);
  }

  return entries;
}

const sliceMap = new Map();
walkSlices(path.join(repoRoot, 'specs'), sliceMap);
walkSlices(path.join(repoRoot, 'specs-fix'), sliceMap);

const worktrees = parseWorktrees(run('git worktree list --porcelain'));
const warnings = [];

for (const entry of worktrees) {
  const worktreePath = entry.worktree;
  const branchRef = entry.branch || '';
  const branchName = branchRef.replace('refs/heads/', '');

  if (!branchName || branchName === currentBranch || worktreePath === repoRoot) {
    continue;
  }

  const meta = sliceMap.get(branchName);
  if (!meta || meta.sliceId.startsWith('slice-00')) {
    continue;
  }

  const dirty = run('git status --porcelain', worktreePath) !== '';
  const aheadCount = Number(run('git rev-list --count origin/develop..HEAD', worktreePath) || '0');
  const active = dirty || aheadCount > 0;

  if (!active) {
    continue;
  }

  const overlap = currentFiles.filter((item) => meta.files.includes(item));
  if (overlap.length > 0) {
    warnings.push(`${branchName}|${overlap.join(', ')}`);
  }
}

process.stdout.write(warnings.join('\n'));
NODE
)"

if [[ -n "$overlap_output" ]]; then
  while IFS= read -r overlap_line; do
    [[ -n "$overlap_line" ]] || continue
    overlap_branch="${overlap_line%%|*}"
    overlap_files="${overlap_line#*|}"
    if [[ "$strict_overlap" == "true" ]]; then
      fail "Overlap con worktree activo '$overlap_branch': $overlap_files"
    fi
    warn "Overlap con worktree activo '$overlap_branch': $overlap_files"
  done <<< "$overlap_output"
else
  pass "No se detecto overlap con worktrees activos."
fi

case "$gate" in
  ready)
    [[ "$slice_status" == "ready" ]] || fail "Gate ready: slice.json debe estar en status=ready. Estado actual: $slice_status. Completa la especificacion en el Track 1 antes de pasar a ejecucion."
    pass "Gate ready: el slice esta marcado como ready para ejecucion."
    ;;
  execution)
    if [[ "$slice_status" == "blocked" ]]; then
      fail "El slice esta bloqueado (status=blocked). Resolve el bloqueante antes de ejecutar."
    fi
    if [[ "$slice_status" == "cancelled" ]]; then
      fail "El slice esta cancelado (status=cancelled)."
    fi
    if [[ "$slice_status" == "completed" ]]; then
      warn "El slice ya figura como completed. Revisa si realmente corresponde reejecutarlo."
    fi
    if [[ "$slice_status" == "draft" ]]; then
      warn "El slice esta en estado 'draft'. Considera marcarlo como 'ready' antes de ejecutar."
    fi
    pass "Gate execution: metadata y precondiciones minimas OK."
    ;;
  validation)
    [[ "$slice_status" == "completed" ]] || fail "Para gate validation, slice.json debe estar en status=completed."
    [[ -n "$completed_at" ]] || fail "Para gate validation, slice.json debe tener completed_at."
    [[ -n "$started_at" ]] || fail "Para gate validation, slice.json debe tener started_at."
    if [[ -z "$actual_hours" ]] || ! node -e "process.exit(Number(process.argv[1]) > 0 ? 0 : 1)" "$actual_hours" >/dev/null 2>&1; then
      fail "Para gate validation, slice.json debe tener actual_hours > 0."
    fi
    pass "Gate validation: slice marcado como completado y con trazabilidad minima."
    ;;
esac
