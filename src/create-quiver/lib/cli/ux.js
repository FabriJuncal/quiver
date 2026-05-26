const { resolveTheme, isTruthy } = require('./theme');

function resolveUxMode(options = {}, env = process.env, io = {}) {
  const isTTY = {
    stdin: options.stdinIsTTY ?? Boolean((io.input || process.stdin).isTTY),
    stdout: options.stdoutIsTTY ?? Boolean((io.output || process.stdout).isTTY),
    stderr: options.stderrIsTTY ?? Boolean((io.error || process.stderr).isTTY),
  };
  const json = options.json === true;
  const ci = isTruthy(env.CI);
  const noColor = options.noColor === true || Boolean(env.NO_COLOR);
  const interactive = options.interactive === true;
  const decoration = !json && !ci && isTTY.stdout;
  const usePrompts = decoration && interactive && isTTY.stdin;
  const useSpinners = decoration && options.spinner !== false;
  const theme = resolveTheme({ ...options, json, noColor }, env, {
    stdout: isTTY.stdout,
  });

  return {
    ci,
    decoration,
    interactive,
    isTTY,
    json,
    noColor,
    theme,
    usePrompts,
    useSpinners,
  };
}

async function loadClack(injected) {
  if (injected) return injected;
  return import('@clack/prompts');
}

function createUx(options = {}) {
  const env = options.env || process.env;
  const io = {
    input: options.input || process.stdin,
    output: options.output || process.stdout,
    error: options.error || process.stderr,
  };
  const mode = resolveUxMode(options, env, io);
  const write = options.write || ((text) => io.output.write(text));

  function line(text = '') {
    write(`${text}\n`);
  }

  function formatStatus(status, text) {
    const symbol = mode.theme.symbols[status] || mode.theme.symbols.bullet;
    return mode.theme.status(status, `${symbol} ${text}`);
  }

  function heading(text) {
    if (mode.json) return;
    if (!mode.decoration) {
      line(text);
      return;
    }
    const prefix = mode.theme.symbols.start;
    line(mode.theme.status('planner', `${prefix} ${text}`));
  }

  function section(text) {
    if (mode.json) return;
    if (!mode.decoration) {
      line(text);
      return;
    }
    const prefix = mode.theme.symbols.section || mode.theme.symbols.start;
    line(mode.theme.status('command', `${prefix} ${text}`));
  }

  function writeStatus(status, text) {
    if (mode.json) return;
    if (!mode.decoration) {
      line(text);
      return;
    }
    line(formatStatus(status, text));
  }

  function check(text) {
    writeStatus('success', text);
  }

  function warning(text) {
    writeStatus('warning', text);
  }

  function error(text) {
    writeStatus('error', text);
  }

  function info(text) {
    writeStatus('info', text);
  }

  function summary(items = [], summaryOptions = {}) {
    if (mode.json) return;
    const title = summaryOptions.title || 'Summary';
    section(title);
    for (const item of items) {
      if (typeof item === 'string') {
        line(mode.decoration ? mode.theme.status('muted', `  ${mode.theme.symbols.bullet} ${item}`) : `- ${item}`);
        continue;
      }
      if (item && typeof item === 'object') {
        const label = item.label || item.key || '';
        const value = item.value == null ? '' : String(item.value);
        const text = label ? `${label}: ${value}` : value;
        line(mode.decoration ? mode.theme.status(item.status || 'muted', `  ${mode.theme.symbols.bullet} ${text}`) : `- ${text}`);
      }
    }
  }

  function nextSteps(steps = [], stepOptions = {}) {
    if (mode.json || !Array.isArray(steps) || steps.length === 0) return;
    section(stepOptions.title || 'Next steps');
    for (const step of steps) {
      line(mode.decoration ? mode.theme.status('command', `  ${mode.theme.symbols.bullet} ${step}`) : `- ${step}`);
    }
  }

  async function withSpinner(message, task, spinnerOptions = {}) {
    if (!mode.useSpinners) {
      if (!mode.json && spinnerOptions.echo !== false) {
        if (mode.decoration) {
          writeStatus('info', message);
        } else {
          line(message);
        }
      }
      return task();
    }

    const clack = await loadClack(options.prompts);
    const spinner = clack.spinner();
    let stopped = false;
    function stop(message, code) {
      if (stopped) return;
      stopped = true;
      spinner.stop(message, code);
    }
    spinner.start(message);
    try {
      const result = await task();
      stop(spinnerOptions.successMessage || message);
      return result;
    } catch (error) {
      stop(spinnerOptions.failureMessage || `Failed: ${message}`, 1);
      throw error;
    }
  }

  async function taskGroup(title, stages = []) {
    heading(title);
    const results = [];
    for (const stage of stages) {
      const run = typeof stage === 'function' ? stage : stage.run;
      const message = typeof stage === 'function' ? stage.name || 'Running task' : stage.message;
      const successMessage = stage.successMessage || message;
      const useSpinner = stage.spinner === true;
      if (typeof run !== 'function') {
        throw new Error('create-quiver: taskGroup stage requires a run function.');
      }
      const result = useSpinner
        ? await withSpinner(message, run, {
          successMessage,
          failureMessage: stage.failureMessage,
          echo: stage.echo,
        })
        : await run();
      if (!useSpinner) {
        check(successMessage);
      }
      results.push(result);
    }
    return results;
  }

  async function promptConfirm(message, promptOptions = {}) {
    if (!mode.usePrompts) {
      throw new Error('create-quiver: interactive confirmation requires an interactive TTY. Pass the equivalent flags or rerun with --interactive.');
    }
    if (options.promptConfirm) {
      return options.promptConfirm(message, promptOptions);
    }
    const clack = await loadClack(options.prompts);
    const result = await clack.confirm({
      message,
      initialValue: promptOptions.initialValue === true,
    });
    if (clack.isCancel && clack.isCancel(result)) {
      throw new Error('create-quiver: interactive confirmation canceled.');
    }
    return result === true;
  }

  return {
    check,
    error,
    heading,
    info,
    line,
    mode,
    nextSteps,
    promptConfirm,
    section,
    summary,
    taskGroup,
    theme: mode.theme,
    warning,
    withSpinner,
    writeStatus,
  };
}

module.exports = {
  createUx,
  resolveUxMode,
};
