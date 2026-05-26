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

  function heading(text) {
    if (mode.json) return;
    if (!mode.decoration) {
      line(text);
      return;
    }
    const prefix = mode.theme.symbols.start;
    line(mode.theme.status('planner', `${prefix} ${text}`));
  }

  function writeStatus(status, text) {
    if (mode.json) return;
    if (!mode.decoration) {
      line(text);
      return;
    }
    const symbol = mode.theme.symbols[status] || mode.theme.symbols.bullet;
    const body = mode.theme.status(status, `${symbol} ${text}`);
    line(body);
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
    spinner.start(message);
    try {
      const result = await task();
      spinner.stop(spinnerOptions.successMessage || message);
      return result;
    } catch (error) {
      spinner.stop(spinnerOptions.failureMessage || `Failed: ${message}`, 1);
      throw error;
    }
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
    heading,
    line,
    mode,
    promptConfirm,
    theme: mode.theme,
    withSpinner,
    writeStatus,
  };
}

module.exports = {
  createUx,
  resolveUxMode,
};
