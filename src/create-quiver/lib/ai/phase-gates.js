const PLANNER_PHASES = Object.freeze(['acceptance', 'technical-plan', 'spec']);

class PlannerPhaseError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PlannerPhaseError';
    this.code = code;
    this.details = details;
  }
}

const PHASE_DETAILS = Object.freeze({
  acceptance: Object.freeze({
    phase: 'acceptance',
    label: 'Acceptance criteria',
    contextPack: 'planning',
    allowsWrites: false,
    requiresInput: true,
  }),
  'technical-plan': Object.freeze({
    phase: 'technical-plan',
    label: 'Technical plan',
    contextPack: 'planning',
    allowsWrites: false,
    requiresInput: true,
  }),
  spec: Object.freeze({
    phase: 'spec',
    label: 'Spec generation',
    contextPack: 'planning',
    allowsWrites: true,
    requiresInput: true,
  }),
});

function formatPlannerPhaseList() {
  return PLANNER_PHASES.join(', ');
}

function normalizePlannerPhase(phase) {
  const normalized = String(phase || '').trim().toLowerCase();

  if (!normalized || !Object.prototype.hasOwnProperty.call(PHASE_DETAILS, normalized)) {
    throw new PlannerPhaseError(
      'UNSUPPORTED_PLANNER_PHASE',
      `Unsupported planner phase '${phase}'. Supported phases: ${formatPlannerPhaseList()}.`,
      { phase, supportedPhases: PLANNER_PHASES.slice() },
    );
  }

  return normalized;
}

function getPlannerPhaseDetails(phase) {
  return PHASE_DETAILS[normalizePlannerPhase(phase)];
}

function assertPlannerPhaseReady(phase) {
  const normalized = normalizePlannerPhase(phase);

  return PHASE_DETAILS[normalized];
}

module.exports = {
  PHASE_DETAILS,
  PLANNER_PHASES,
  PlannerPhaseError,
  assertPlannerPhaseReady,
  formatPlannerPhaseList,
  getPlannerPhaseDetails,
  normalizePlannerPhase,
};
