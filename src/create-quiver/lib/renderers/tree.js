const { formatStatus, translatorForHuman } = require('../i18n/read-only-format');

function isUnicodeEnabled(options = {}) {
  if (options.unicode === true) {
    return true;
  }

  const locale = `${process.env.LANG || ''} ${process.env.LC_ALL || ''} ${process.env.LC_CTYPE || ''}`;
  return /UTF-8/i.test(locale);
}

function toConflictMap(conflicts) {
  const map = new Map();

  for (const conflict of Array.isArray(conflicts) ? conflicts : []) {
    for (const ref of Array.isArray(conflict.slices) ? conflict.slices : []) {
      map.set(ref, {
        files: Array.isArray(conflict.files) ? conflict.files : [],
        slices: Array.isArray(conflict.slices) ? conflict.slices : [],
      });
    }
  }

  return map;
}

function countParallelLots(level, conflicts) {
  const conflictRefs = new Set((Array.isArray(conflicts) ? conflicts : []).flatMap((group) => group.slices || []));
  const seen = new Set();

  let lots = Array.isArray(conflicts) ? conflicts.length : 0;

  for (const slice of Array.isArray(level) ? level : []) {
    if (seen.has(slice.ref)) {
      continue;
    }

    if (!conflictRefs.has(slice.ref)) {
      lots += 1;
      seen.add(slice.ref);
      continue;
    }

    const group = (Array.isArray(conflicts) ? conflicts : []).find((entry) => Array.isArray(entry.slices) && entry.slices.includes(slice.ref));
    if (!group) {
      continue;
    }

    for (const ref of group.slices || []) {
      seen.add(ref);
    }
  }

  return Math.max(lots, 1);
}

function formatLevelHeader(levelIndex, level, conflicts, options = {}) {
  const translator = translatorForHuman(options);
  const label = translator.t('graph.level', { level: levelIndex });
  const lotCount = countParallelLots(level, conflicts);
  return `${label} (${translator.t('graph.slices_count', { count: level.length })}, ${translator.t('graph.lots_count', { count: lotCount })})`;
}

function formatConflictSuffix(conflict, options = {}) {
  if (!conflict || !Array.isArray(conflict.files) || conflict.files.length === 0) {
    return '';
  }

  if (options.showConflicts) {
    return ` [${conflict.files.join(', ')}]`;
  }

  return '';
}

function renderTreeGraph(report, options = {}) {
  const unicode = isUnicodeEnabled(options);
  const translator = translatorForHuman(options);
  const branch = unicode ? '├─' : '+--';
  const lastBranch = unicode ? '└─' : '\\--';
  const pipe = unicode ? '│ ' : '| ';
  const conflictMap = toConflictMap(report.conflicts);
  const lines = [];

  if (!Array.isArray(report.levels) || report.levels.length === 0) {
    return `${translator.t('graph.empty.pending')}\n`;
  }

  lines.push(translator.t('graph.title'));

  report.levels.forEach((level, levelIndex) => {
    const levelConflicts = Array.isArray(report.conflicts)
      ? report.conflicts.filter((conflict) => conflict.level === levelIndex)
      : [];
    lines.push(formatLevelHeader(levelIndex, level, levelConflicts, options));

    level.forEach((slice, sliceIndex) => {
      const connector = sliceIndex === level.length - 1 ? lastBranch : branch;
      const conflict = conflictMap.get(slice.ref);
      const marker = conflict ? (unicode ? '⚠' : '!') : ' ';
      const sharedPaths = conflict && options.showConflicts ? ` ${formatConflictSuffix(conflict, options)}` : '';
      const title = slice.title ? ` ${slice.title}` : '';
      const hours = typeof slice.hours === 'number' ? ` (${slice.hours}h)` : '';
      const status = slice.status ? ` [${formatStatus(slice.status, translator)}]` : '';
      lines.push(`${connector} ${marker} ${slice.ref}${title}${hours}${status}${sharedPaths}`.replace(/\s+/g, ' ').trimEnd());
    });

    if (levelIndex < report.levels.length - 1) {
      lines.push(unicode ? pipe.trimEnd() : '|');
    }
  });

  return `${lines.join('\n')}\n`;
}

module.exports = {
  renderTreeGraph,
  isUnicodeEnabled,
};
