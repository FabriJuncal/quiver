const { selectOption } = require('../cli/selectors');
const { createUx, resolveUxMode } = require('../cli/ux');
const { createTranslator } = require('../i18n/catalog');
const { formatAnalyzeProjectDiffPreview } = require('./analyze-project-docs');

const APPLY_ACTION = 'apply';
const VIEW_DIFF_ACTION = 'view-diff';
const SAVE_ACTION = 'save-proposal';
const EDIT_ACTION = 'edit-proposal';
const CANCEL_ACTION = 'cancel';

function canUseAnalyzeProjectInteractiveSelector(options = {}) {
  const mode = resolveUxMode({
    interactive: true,
    json: options.json,
    noColor: options.noColor,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
  }, options.env || process.env, {
    input: options.inputStream || process.stdin,
    output: options.outputStream || process.stdout,
    error: options.errorStream || process.stderr,
  });
  return mode.usePrompts === true;
}

function changedItems(writePlan = []) {
  return (Array.isArray(writePlan) ? writePlan : []).filter((item) => item.action && item.action !== 'skip');
}

function selectRecommendedAction(writePlan = []) {
  const changed = changedItems(writePlan);
  const higherRisk = changed.some((item) => item.dirty === true || item.action === 'update');
  return higherRisk ? VIEW_DIFF_ACTION : APPLY_ACTION;
}

function withRecommendation(label, recommended, translator) {
  return recommended ? `${label} (${translator.t('ai.analyze_project.apply.recommended')})` : label;
}

function buildAnalyzeProjectApplyChoices(translator, recommendedAction, options = {}) {
  const includeDiff = options.includeDiff !== false;
  const applyChoice = {
    label: withRecommendation(translator.t('ai.analyze_project.apply.option.apply.label'), recommendedAction === APPLY_ACTION, translator),
    value: APPLY_ACTION,
    hint: translator.t('ai.analyze_project.apply.option.apply.hint'),
    default: recommendedAction === APPLY_ACTION,
  };
  const diffChoice = {
    label: withRecommendation(translator.t('ai.analyze_project.apply.option.view_diff.label'), recommendedAction === VIEW_DIFF_ACTION, translator),
    value: VIEW_DIFF_ACTION,
    hint: translator.t('ai.analyze_project.apply.option.view_diff.hint'),
    default: recommendedAction === VIEW_DIFF_ACTION,
  };
  const choices = [];

  if (includeDiff && recommendedAction === VIEW_DIFF_ACTION) {
    choices.push(diffChoice, applyChoice);
  } else {
    choices.push(applyChoice);
    if (includeDiff) {
      choices.push(diffChoice);
    }
  }

  choices.push(
    {
      label: translator.t('ai.analyze_project.apply.option.save.label'),
      value: SAVE_ACTION,
      hint: translator.t('ai.analyze_project.apply.option.save.hint'),
    },
    {
      label: translator.t('ai.analyze_project.apply.option.edit.label'),
      value: EDIT_ACTION,
      hint: translator.t('ai.analyze_project.apply.option.edit.hint'),
    },
    {
      label: translator.t('ai.analyze_project.apply.option.cancel.label'),
      value: CANCEL_ACTION,
      hint: translator.t('ai.analyze_project.apply.option.cancel.hint'),
    },
  );

  return choices;
}

function formatAnalyzeProjectApplySummary(report = {}, proposal = {}, writePlan = [], options = {}) {
  const translator = createTranslator(options.language);
  const changed = changedItems(writePlan);
  const dirty = changed.filter((item) => item.dirty === true);
  const docs = Array.isArray(proposal?.docs) ? proposal.docs : [];
  const lines = [
    translator.t('ai.analyze_project.apply.completed'),
    translator.t('ai.analyze_project.apply.generated'),
    '',
    translator.t('ai.analyze_project.apply.proposed_files'),
  ];

  if (docs.length === 0) {
    lines.push(`- ${translator.t('common.none')}`);
  } else {
    for (const doc of docs) {
      const plan = writePlan.find((item) => item.path === doc.path);
      lines.push(`- ${doc.path}${plan?.action ? ` (${plan.action})` : ''}`);
    }
  }

  lines.push(
    '',
    translator.t('ai.analyze_project.apply.counts', {
      changed: changed.length,
      dirty: dirty.length,
    }),
  );

  if (report.analysis_validation?.repaired === true || report.analysis_validation?.repair_manifest) {
    lines.push(translator.t('ai.analyze_project.apply.repair', {
      value: report.analysis_validation.repair_manifest?.path || report.analysis_validation.repair_manifest || translator.t('common.yes'),
    }));
  }
  if (report.selected_context_manifest) {
    lines.push(translator.t('ai.analyze_project.apply.context_artifact', {
      path: report.selected_context_manifest.path || report.selected_context_manifest,
    }));
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatBoundedAnalyzeProjectDiff(writePlan = [], options = {}) {
  const translator = createTranslator(options.language);
  const maxLines = Number.isInteger(options.maxDiffLines) ? Math.max(1, options.maxDiffLines) : 80;
  const maxChars = Number.isInteger(options.maxDiffChars) ? Math.max(500, options.maxDiffChars) : 8_000;
  const rawLines = formatAnalyzeProjectDiffPreview(writePlan);
  const lines = rawLines.slice(0, maxLines);
  let text = lines.join('\n');
  let truncated = rawLines.length > lines.length;

  if (text.length > maxChars) {
    text = text.slice(0, maxChars).replace(/\s+$/g, '');
    truncated = true;
  }

  if (truncated) {
    text = `${text}\n${translator.t('ai.analyze_project.apply.diff_truncated')}`;
  }

  return `${translator.t('ai.analyze_project.apply.diff_title')}\n${text}\n`;
}

async function chooseAnalyzeProjectApplyAction(message, choices, options = {}) {
  return selectOption(message, choices, {
    name: 'ai analyze-project apply action',
    flag: '--apply-docs',
    interactive: true,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    noColor: options.noColor,
    env: options.env,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    input: options.inputStream,
    output: options.outputStream,
    error: options.errorStream,
  });
}

async function runAnalyzeProjectInteractiveApplySelector(context = {}) {
  const options = context.options || {};
  const translator = createTranslator(options.language);
  const ux = createUx({ ...options, interactive: true });

  if (!canUseAnalyzeProjectInteractiveSelector(options)) {
    throw new Error([
      'create-quiver: ai analyze-project --apply-docs requires an interactive TTY unless --yes is passed.',
      'Next safe step: use `npx create-quiver ai analyze-project --deep --apply-docs --yes --provider <provider> --model <model>` for automation, or rerun from an interactive terminal.',
    ].join('\n'));
  }

  const recommendedAction = selectRecommendedAction(context.writePlan);
  process.stdout.write(formatAnalyzeProjectApplySummary(context.report, context.proposal, context.writePlan, options));

  const first = await chooseAnalyzeProjectApplyAction(
    translator.t('ai.analyze_project.apply.question'),
    buildAnalyzeProjectApplyChoices(translator, recommendedAction),
    options,
  );

  if (first.value === APPLY_ACTION) {
    return context.actions.apply({ allowDirtyDocs: true, interactiveAction: APPLY_ACTION });
  }
  if (first.value === SAVE_ACTION) {
    return context.actions.save({ interactiveAction: SAVE_ACTION });
  }
  if (first.value === EDIT_ACTION) {
    return context.actions.edit({ interactiveAction: EDIT_ACTION });
  }
  if (first.value === CANCEL_ACTION) {
    return context.actions.cancel({ interactiveAction: CANCEL_ACTION });
  }

  const savedReport = await context.actions.save({ interactiveAction: VIEW_DIFF_ACTION, silent: true });
  ux.section(translator.t('ai.analyze_project.apply.full_diff_artifact', {
    path: savedReport.proposal_artifacts?.proposal_diff || translator.t('common.none'),
  }));
  process.stdout.write(formatBoundedAnalyzeProjectDiff(context.writePlan, options));

  const second = await chooseAnalyzeProjectApplyAction(
    translator.t('ai.analyze_project.apply.after_diff_question'),
    buildAnalyzeProjectApplyChoices(translator, APPLY_ACTION, { includeDiff: false }),
    options,
  );

  if (second.value === APPLY_ACTION) {
    return context.actions.apply({ allowDirtyDocs: true, interactiveAction: APPLY_ACTION });
  }
  if (second.value === SAVE_ACTION) {
    return context.actions.save({ interactiveAction: SAVE_ACTION, savedReport });
  }
  if (second.value === EDIT_ACTION) {
    return context.actions.edit({ interactiveAction: EDIT_ACTION });
  }
  return context.actions.cancel({ interactiveAction: CANCEL_ACTION, savedReport });
}

module.exports = {
  APPLY_ACTION,
  CANCEL_ACTION,
  EDIT_ACTION,
  SAVE_ACTION,
  VIEW_DIFF_ACTION,
  buildAnalyzeProjectApplyChoices,
  canUseAnalyzeProjectInteractiveSelector,
  formatAnalyzeProjectApplySummary,
  formatBoundedAnalyzeProjectDiff,
  runAnalyzeProjectInteractiveApplySelector,
  selectRecommendedAction,
};
