const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { openEditor } = require('../cli/editor');
const { createUx } = require('../cli/ux');
const { parseAnalyzeProjectDocProposal } = require('./analyze-project-docs');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function makeReviewError(message, reviewPath, cause) {
  const error = new Error(formatError(`${message}\nReview artifact: ${reviewPath}\nNext safe step: rerun with --review in an interactive terminal or provide a valid edited proposal.`));
  error.code = cause?.code || 'AI_ANALYZE_PROJECT_REVIEW_FAILED';
  error.cause = cause;
  error.reviewPath = reviewPath;
  return error;
}

function createAnalyzeProjectReviewFile(proposal, options = {}) {
  const reviewDir = options.reviewDir || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-analyze-project-review-'));
  const reviewPath = path.join(reviewDir, 'analyze-project-doc-proposal.json');
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(reviewPath, `${JSON.stringify(proposal, null, 2)}\n`);
  return reviewPath;
}

async function reviewAnalyzeProjectDocProposal(repoRoot, proposal, options = {}) {
  const reviewPath = createAnalyzeProjectReviewFile(proposal, options);
  const hasEditorRunner = typeof options.openEditorFn === 'function';
  const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));

  if (!canOpenEditor) {
    throw makeReviewError('ai analyze-project --review requires an interactive terminal or an injected editor runner.', reviewPath);
  }

  const editorResult = hasEditorRunner
    ? options.openEditorFn(reviewPath, { cwd: repoRoot, env: options.env || process.env })
    : openEditor(reviewPath, { cwd: repoRoot, env: options.env || process.env });

  if (!editorResult || editorResult.ok !== true) {
    throw makeReviewError(editorResult?.reason || 'ai analyze-project review was canceled before applying docs.', reviewPath);
  }

  try {
    return {
      proposal: parseAnalyzeProjectDocProposal(fs.readFileSync(reviewPath, 'utf8')),
      reviewPath,
    };
  } catch (error) {
    throw makeReviewError('edited analyze-project doc proposal is invalid after review.', reviewPath, error);
  }
}

async function confirmAnalyzeProjectWrites(writePlan, options = {}) {
  if (options.force === true) {
    return { confirmed: true, mode: 'force' };
  }

  const hasPrompt = typeof options.promptConfirm === 'function'
    || options.stdinIsTTY === true
    || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));
  if (!hasPrompt) {
    const error = new Error(formatError('ai analyze-project --review requires final confirmation in an interactive terminal. No files were written.'));
    error.code = 'AI_ANALYZE_PROJECT_CONFIRMATION_REQUIRED';
    throw error;
  }

  const changed = writePlan.filter((item) => item.action !== 'skip').length;
  const dirty = writePlan.filter((item) => item.dirty).length;
  const message = `Apply ${changed} analyze-project doc update${changed === 1 ? '' : 's'}${dirty > 0 ? ` including ${dirty} existing doc${dirty === 1 ? '' : 's'}` : ''}?`;
  const promptOptions = {
    initialValue: false,
  };
  const confirmed = typeof options.promptConfirm === 'function'
    ? await options.promptConfirm(message, promptOptions)
    : await (options.ux || createUx({
      interactive: true,
      stdinIsTTY: options.stdinIsTTY,
      stdoutIsTTY: options.stdoutIsTTY,
      stderrIsTTY: options.stderrIsTTY,
      write: options.write,
    })).promptConfirm(message, promptOptions);

  if (!confirmed) {
    const error = new Error(formatError('ai analyze-project review confirmation declined. No files were written.'));
    error.code = 'AI_ANALYZE_PROJECT_CONFIRMATION_DECLINED';
    throw error;
  }

  return { confirmed: true, mode: 'prompt' };
}

module.exports = {
  confirmAnalyzeProjectWrites,
  createAnalyzeProjectReviewFile,
  reviewAnalyzeProjectDocProposal,
};
