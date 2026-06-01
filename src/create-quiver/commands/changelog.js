const fs = require('fs');
const path = require('path');

function parseChangelog(content) {
  const lines = String(content || '').split(/\r?\n/);
  const entries = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+\[?([^\]\n]+)\]?(?:\s+-\s+(.+))?$/);
    if (heading) {
      if (current) {
        current.body = current.body.trim();
        entries.push(current);
      }
      current = {
        version: heading[1].trim(),
        date: heading[2]?.trim() || null,
        body: '',
      };
      continue;
    }

    if (current) {
      current.body += `${line}\n`;
    }
  }

  if (current) {
    current.body = current.body.trim();
    entries.push(current);
  }

  return entries;
}

function readChangelog(packageRoot) {
  const changelogPath = path.join(packageRoot, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    return {
      path: changelogPath,
      entries: [],
      missing: true,
    };
  }

  const content = fs.readFileSync(changelogPath, 'utf8');
  return {
    path: changelogPath,
    entries: parseChangelog(content),
    missing: false,
  };
}

function formatHumanChangelog(report) {
  if (report.missing) {
    return 'Quiver changelog\n\nNo local CHANGELOG.md was found in the installed package.\n';
  }

  const entries = report.entries.slice(0, 3);
  if (entries.length === 0) {
    return 'Quiver changelog\n\nLocal CHANGELOG.md did not contain parseable release entries.\n';
  }

  const lines = ['Quiver changelog', ''];
  for (const entry of entries) {
    lines.push(`## ${entry.version}${entry.date ? ` - ${entry.date}` : ''}`);
    if (entry.body) {
      lines.push(entry.body);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function runChangelog(options = {}) {
  const packageRoot = options.packageRoot || path.resolve(__dirname, '../..', '..');
  const report = readChangelog(packageRoot);
  const payload = {
    schema_version: 1,
    source: report.path,
    missing: report.missing,
    entries: report.entries.slice(0, 10),
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return payload;
  }

  process.stdout.write(formatHumanChangelog(report));
  return payload;
}

module.exports = {
  formatHumanChangelog,
  parseChangelog,
  readChangelog,
  runChangelog,
};
