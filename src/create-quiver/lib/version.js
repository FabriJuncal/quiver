const fs = require('node:fs');
const path = require('node:path');

const { resolveTheme } = require('./cli/theme');
const { createTranslator } = require('./i18n/catalog');

const VERSION_SCHEMA_VERSION = 1;
const PACKAGE_ROOT = path.resolve(__dirname, '../../..');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function parsePackageManagerField(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const [name, version] = text.split('@');
  return {
    name: name || null,
    version: version || null,
    source: 'package.json',
  };
}

function parseUserAgent(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const first = text.split(/\s+/)[0] || '';
  const [name, version] = first.split('/');
  if (!name) return null;
  return {
    name,
    version: version || null,
    source: 'npm_config_user_agent',
  };
}

function detectPackageManager(projectRoot, env = process.env) {
  const packageJson = readJsonIfExists(path.join(projectRoot, 'package.json'));
  const packageManagerField = parsePackageManagerField(packageJson?.packageManager);
  if (packageManagerField) return packageManagerField;

  const signals = [
    ['bun', 'bun.lockb'],
    ['bun', 'bun.lock'],
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['npm', 'package-lock.json'],
  ];

  for (const [name, filename] of signals) {
    if (fs.existsSync(path.join(projectRoot, filename))) {
      return { name, version: null, source: filename };
    }
  }

  return parseUserAgent(env.npm_config_user_agent) || {
    name: 'unknown',
    version: null,
    source: 'none',
  };
}

function collectProjectInfo(projectRoot) {
  const packageJson = readJsonIfExists(path.join(projectRoot, 'package.json'));
  const state = readJsonIfExists(path.join(projectRoot, '.quiver', 'state.json'));
  const hasProjectSignals = Boolean(packageJson || state);

  if (!hasProjectSignals) {
    return {
      name: null,
      path: null,
      quiver_initialized: false,
      quiver_version: null,
    };
  }

  return {
    name: packageJson?.name || state?.project_name || path.basename(projectRoot),
    path: projectRoot,
    quiver_initialized: Boolean(state?.initialized_version || state?.quiver_version),
    quiver_version: state?.quiver_version || state?.initialized_version || null,
  };
}

function collectVersionReport(projectRoot = process.cwd(), options = {}) {
  return {
    version_schema_version: VERSION_SCHEMA_VERSION,
    cli: {
      name: PACKAGE_JSON.name || 'create-quiver',
      version: options.cliVersion || PACKAGE_JSON.version || '0.0.0',
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    package_manager: detectPackageManager(projectRoot, options.env || process.env),
    project: collectProjectInfo(projectRoot),
  };
}

function formatPackageManager(packageManager, translator = createTranslator()) {
  if (!packageManager?.name || packageManager.name === 'unknown') {
    return translator.t('common.unknown');
  }
  return packageManager.version ? `${packageManager.name}@${packageManager.version}` : packageManager.name;
}

function quiverBanner(theme) {
  const lines = [
    '  ___        _                ',
    ' / _ \\ _   _(_)_   _____ _ __ ',
    '| | | | | | | \\ \\ / / _ \\ \'__|',
    '| |_| | |_| | |\\ V /  __/ |   ',
    ' \\__\\_\\\\__,_|_| \\_/ \\___|_|   ',
  ];
  const colors = ['sky', 'blue', 'periwinkle', 'violet', 'magenta'];
  return lines.map((line, index) => theme.colorize(line, colors[index])).join('\n');
}

function formatHumanVersionReport(report, options = {}) {
  const translator = createTranslator(options.language);
  const theme = resolveTheme({ noColor: options.noColor }, options.env || process.env, {
    stdout: options.stdoutIsTTY ?? Boolean(process.stdout.isTTY),
  });
  const project = report.project?.name
    ? `${report.project.name}${report.project.quiver_initialized ? ` (${translator.t('version.project.quiver')})` : ''}`
    : translator.t('common.none');
  const lines = [
    quiverBanner(theme),
    '',
    `${translator.t('version.label.cli')}: ${report.cli.version}`,
    `${translator.t('version.label.node')}: ${report.runtime.node}`,
    `${translator.t('version.label.package_manager')}: ${formatPackageManager(report.package_manager, translator)}`,
    `${translator.t('version.label.os')}: ${report.runtime.platform} ${report.runtime.arch}`,
    `${translator.t('version.label.project')}: ${project}`,
    '',
  ];

  return `${lines.join('\n')}`;
}

module.exports = {
  VERSION_SCHEMA_VERSION,
  collectVersionReport,
  detectPackageManager,
  formatHumanVersionReport,
  quiverBanner,
};
