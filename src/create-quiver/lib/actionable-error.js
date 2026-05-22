function formatActionableError({ failure, impact, fix, nextCommand } = {}) {
  const lines = [`create-quiver: ${String(failure || 'operation failed').trim()}`];

  if (impact) {
    lines.push(`Impact: ${String(impact).trim()}`);
  }
  if (fix) {
    lines.push(`Fix: ${String(fix).trim()}`);
  }
  if (nextCommand) {
    lines.push(`Next command: ${String(nextCommand).trim()}`);
  }

  return lines.join('\n');
}

function createActionableError(code, fields = {}, details = {}) {
  const error = new Error(formatActionableError(fields));
  error.code = code;
  error.details = details;
  return error;
}

module.exports = {
  createActionableError,
  formatActionableError,
};
