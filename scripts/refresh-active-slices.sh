#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
output_path="$repo_root/ACTIVE_SLICES.md"

append_unique_line() {
  local file_path="$1"
  local line="$2"

  touch "$file_path"

  if ! grep -Fxq "$line" "$file_path"; then
    printf '%s\n' "$line" >> "$file_path"
  fi
}

exclude_path="$(git -C "$repo_root" rev-parse --git-path info/exclude)"
append_unique_line "$exclude_path" "ACTIVE_SLICES.md"

node - "$repo_root" "$output_path" <<'NODE'
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const [repoRoot, outputPath] = process.argv.slice(2);

function run(cmd) {
  return cp.execSync(cmd, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
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
      const relPath = path.relative(repoRoot, fullPath);
      const parts = relPath.split(path.sep);
      const specFamily = parts[0];
      const specSlug = parts[1];
      const branchName = json.git?.branch_name;
      if (!branchName) {
        continue;
      }

      acc.set(branchName, {
        specFamily,
        specSlug,
        relPath,
        sliceId: json.slice_id || path.basename(path.dirname(fullPath)),
        title: json.title || json.slice_id || path.basename(path.dirname(fullPath)),
        ticket: json.ticket || '',
        status: json.status || 'pending'
      });
    }
  }
}

function parseWorktrees(text) {
  const entries = [];
  const chunks = text.trim().split('\n\n').filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split('\n');
    const entry = {};
    for (const line of lines) {
      const idx = line.indexOf(' ');
      if (idx === -1) {
        continue;
      }
      const key = line.slice(0, idx);
      const value = line.slice(idx + 1);
      entry[key] = value;
    }
    entries.push(entry);
  }
  return entries;
}

function toAlias(ticket) {
  const parts = String(ticket || '').split('-').filter(Boolean);
  const domain = (parts[1] || 'GEN').toUpperCase();
  const suffix = (parts[parts.length - 1] || '00').toUpperCase();
  const short = domain.length <= 3 ? domain : domain.slice(0, 3);
  return `${short}-${suffix}`;
}

function mdEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

const sliceMap = new Map();
walkSlices(path.join(repoRoot, 'specs'), sliceMap);
walkSlices(path.join(repoRoot, 'specs-fix'), sliceMap);

const worktrees = parseWorktrees(run('git worktree list --porcelain'));

const primary = [];
const active = [];
const frozen = [];
const auxiliary = [];

for (const entry of worktrees) {
  const worktreePath = entry.worktree;
  const branchRef = entry.branch || '';
  const branchName = branchRef.replace('refs/heads/', '');

  if (worktreePath === repoRoot) {
    primary.push({
      branch: branchName || '(detached)',
      path: worktreePath
    });
    continue;
  }

  const slice = sliceMap.get(branchName);
  if (!slice) {
    auxiliary.push({
      branch: branchName || '(detached)',
      path: worktreePath
    });
    continue;
  }

  let liveStatus = slice.status;
  const liveSlicePath = path.join(worktreePath, slice.relPath);
  if (fs.existsSync(liveSlicePath)) {
    try {
      const liveJson = JSON.parse(fs.readFileSync(liveSlicePath, 'utf8'));
      liveStatus = liveJson.status || liveStatus;
    } catch {}
  }

  const row = {
    alias: toAlias(slice.ticket),
    spec: slice.specSlug,
    slice: slice.sliceId,
    branch: branchName,
    path: worktreePath,
    status: liveStatus,
    title: slice.title
  };

  if (slice.sliceId.startsWith('slice-00')) {
    frozen.push(row);
  } else {
    active.push(row);
  }
}

active.sort((a, b) => a.alias.localeCompare(b.alias));
frozen.sort((a, b) => a.alias.localeCompare(b.alias));
auxiliary.sort((a, b) => a.branch.localeCompare(b.branch));

const lines = [
  '# Active Slices',
  '',
  '> Archivo local generado por `tools/scripts/refresh-active-slices.sh`.',
  '> No se trackea en git.',
  '',
  `**Actualizado:** ${new Date().toISOString()}`,
  '',
  '## Convencion',
  '',
  '- `Alias`: identificador corto para hablar del slice sin ambiguedad',
  '- `Spec`: directorio del spec',
  '- `slice-00`: baseline congelado, solo referencia',
  '- `slice-01+`: implementacion o revalidacion',
  '',
  '## Checkout Principal',
  '',
  '| Branch | Path |',
  '|--------|------|'
];

for (const row of primary) {
  lines.push(`| ${mdEscape(row.branch)} | ${mdEscape(row.path)} |`);
}

lines.push('', '## Implementacion Activa', '', '| Alias | Spec | Slice | Branch | Estado | Path |', '|-------|------|-------|--------|--------|------|');
if (active.length === 0) {
  lines.push('| - | - | - | - | - | - |');
} else {
  for (const row of active) {
    lines.push(`| ${mdEscape(row.alias)} | ${mdEscape(row.spec)} | ${mdEscape(row.slice)} | ${mdEscape(row.branch)} | ${mdEscape(row.status)} | ${mdEscape(row.path)} |`);
  }
}

lines.push('', '## Baselines Congelados', '', '| Alias | Spec | Slice | Branch | Estado | Path |', '|-------|------|-------|--------|--------|------|');
if (frozen.length === 0) {
  lines.push('| - | - | - | - | - | - |');
} else {
  for (const row of frozen) {
    lines.push(`| ${mdEscape(row.alias)} | ${mdEscape(row.spec)} | ${mdEscape(row.slice)} | ${mdEscape(row.branch)} | congelado | ${mdEscape(row.path)} |`);
  }
}

lines.push('', '## Worktrees Auxiliares', '', '| Branch | Path |', '|--------|------|');
if (auxiliary.length === 0) {
  lines.push('| - | - |');
} else {
  for (const row of auxiliary) {
    lines.push(`| ${mdEscape(row.branch)} | ${mdEscape(row.path)} |`);
  }
}

lines.push(
  '',
  '## Recomendacion Operativa',
  '',
  '- En VS Code, dejar visibles solo `develop` y la tabla de `Implementacion Activa`.',
  '- Tratar la tabla de `Baselines Congelados` como solo lectura.',
  '- Cerrar visualmente los `Worktrees Auxiliares` salvo cuando estes trabajando ese PR o esa tarea de proceso.'
);

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
NODE

printf 'Active slices refreshed: %s\n' "$output_path"
