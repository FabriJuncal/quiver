const path = require('path');
const readline = require('readline');
const { collectPlan } = require('./plan');
const { formatStatus, translatorForHuman } = require('../lib/i18n/read-only-format');
const { startSlice } = require('../lib/lifecycle');

function toStartSliceCommand(slicePath) {
  return `npx create-quiver start-slice "${slicePath}"`;
}

function collectNext(repoRoot, options = {}) {
  const report = collectPlan(repoRoot, {
    onlyReady: true,
    specSlug: options.specSlug,
  });
  const historyReport = options.includeCompleted
    ? collectPlan(repoRoot, {
        includeCompleted: true,
        specSlug: options.specSlug,
      })
    : null;

  const allReady = report.plan.filter((item) => String(item.status || '').toLowerCase() !== 'blocked');
  const next = allReady.length > 0 ? allReady[0] : null;
  const history = historyReport
    ? historyReport.plan.filter((item) => String(item.status || '').toLowerCase() === 'completed')
    : [];

  return {
    all_ready: allReady,
    history,
    include_completed: options.includeCompleted === true,
    next,
  };
}

function formatHumanNext(report, options = {}) {
  const translator = translatorForHuman(options);
  const lines = [options.allReady ? translator.t('next.title.ready') : translator.t('next.title.next')];

  if (!report.next) {
    lines.push(translator.t('next.empty.ready'));
    if (report.include_completed && report.history.length > 0) {
      lines.push('');
      lines.push(`${translator.t('next.history_title')}:`);
      for (const item of report.history) {
        lines.push(`- ${item.ref} (${formatStatus(item.status, translator)})`);
      }
    }
    return `${lines.join('\n')}\n`;
  }

  const items = options.allReady ? report.all_ready : [report.next];

  for (const [index, item] of items.entries()) {
    const command = toStartSliceCommand(item.slice_path);
    if (options.allReady) {
      lines.push('');
      lines.push(`[${index + 1}] ${item.ref}`);
      lines.push(`${translator.t('next.label.title')}: ${item.title}`);
      lines.push(`${translator.t('next.label.status')}: ${formatStatus(item.status, translator)}`);
      lines.push(`${translator.t('next.label.start')}: ${command}`);
    } else {
      lines.push(`${translator.t('next.label.slice')}: ${item.ref}`);
      lines.push(`${translator.t('next.label.title')}: ${item.title}`);
      lines.push(`${translator.t('next.label.status')}: ${formatStatus(item.status, translator)}`);
      lines.push(`${translator.t('next.label.start')}: ${command}`);
      if (report.all_ready.length > 1) {
        lines.push(translator.t('next.also_ready_more', {
          command: 'npx create-quiver next --all-ready',
          count: report.all_ready.length - 1,
        }));
      }
    }
  }

  if (report.include_completed && report.history.length > 0) {
    lines.push('');
    lines.push(`${translator.t('next.history_title')}:`);
    for (const item of report.history) {
      lines.push(`- ${item.ref} (${formatStatus(item.status, translator)})`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function promptConfirm(message, io = {}) {
  const input = io.input || process.stdin;
  const output = io.output || process.stdout;

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input,
      output,
    });

    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(String(answer || '').trim()));
    });

    rl.on('SIGINT', () => {
      rl.close();
      reject(new Error('create-quiver: confirmation aborted.'));
    });
  });
}

async function runNext(repoRoot, options = {}) {
  const report = collectNext(repoRoot, options);
  const translator = translatorForHuman(options);
  const isTTY = options.isTTY || {
    stdin: Boolean(process.stdin.isTTY),
    stdout: Boolean(process.stdout.isTTY),
  };

  if (options.autoStart) {
    if (!isTTY.stdin || !isTTY.stdout) {
      throw new Error('create-quiver: --auto-start requires an interactive TTY.');
    }

    if (!report.next) {
      process.stdout.write(`${translator.t('next.empty.ready')}\n`);
      return report;
    }

    const confirmed = await (options.promptConfirm || promptConfirm)(translator.t('next.prompt.start', { ref: report.next.ref }));
    if (confirmed) {
      const slicePath = path.resolve(repoRoot, report.next.slice_path);
      await Promise.resolve((options.startSliceFn || startSlice)(slicePath, { allowDraft: true }));
      process.stdout.write(`${translator.t('next.started', { ref: report.next.ref })}\n`);
    } else {
      process.stdout.write(`${translator.t('next.aborted')}\n`);
    }
    return report;
  }

  if (options.json) {
    const payload = {
      all_ready: report.all_ready.map((item) => ({
        ...item,
        start_slice_command: toStartSliceCommand(item.slice_path),
      })),
      history: report.history,
      include_completed: report.include_completed,
      next: report.next
        ? {
            ...report.next,
            start_slice_command: toStartSliceCommand(report.next.slice_path),
          }
        : null,
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return payload;
  }

  process.stdout.write(formatHumanNext(report, options));
  return report;
}

module.exports = {
  collectNext,
  formatHumanNext,
  promptConfirm,
  runNext,
  toStartSliceCommand,
};
