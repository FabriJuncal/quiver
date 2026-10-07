// Experimental headless planner. Never import state, providers, or executors here.
const crypto = require('node:crypto');
const { types } = require('node:util');
const { z } = require('zod');
const { getContextPathExclusionReason } = require('../ai/safety');

const PLANNER_SCHEMA_VERSION = 1;
const CONTROLLER_REVISION = 'dry-run-controller-v1';
const RISKS = ['low', 'intermediate', 'critical', 'unknown'];
const CRITICAL_CLASSES = [
  'production', 'data', 'permissions', 'credentials', 'payments', 'deletion',
  'core-architecture', 'external-commitment',
];
const ADAPTERS = Object.freeze({
  development: Object.freeze({
    id: 'development-planning-v1',
    verification_kind: 'test-evidence',
    capabilities: Object.freeze({
      'development.inspect': Object.freeze({ risk: 'low', artifact: 'inspection-outline' }),
      'development.propose-change': Object.freeze({ risk: 'intermediate', artifact: 'change-outline' }),
    }),
  }),
  research: Object.freeze({
    id: 'research-planning-v1',
    verification_kind: 'source-support',
    capabilities: Object.freeze({
      'research.compare': Object.freeze({ risk: 'low', artifact: 'comparison-outline' }),
      'research.propose-report': Object.freeze({ risk: 'intermediate', artifact: 'report-outline' }),
    }),
  }),
});

const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const text = z.string().min(1).max(8000).refine((value) => value.trim().length > 0);
const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const budget = z.object({ max_actions: revision, max_input_bytes: revision }).strict();
const ids = z.array(id).min(1).max(100);
const taskSchema = z.object({
  schema_version: z.literal(PLANNER_SCHEMA_VERSION),
  task_id: id,
  run_id: id,
  revision,
  domain: z.enum(['development', 'research']),
  objective: text,
  criteria: z.array(z.object({ id, text }).strict()).min(1).max(100),
  inputs: z.array(z.object({ id, resource_id: id, sha256: digest }).strict()).min(1).max(100),
  actions: z.array(z.object({
    action_id: id,
    capability: id,
    resource_id: id,
    input_ids: ids,
    criterion_ids: ids,
    phase: z.enum(['prepare', 'apply']),
    claimed_risk: z.enum(RISKS),
  }).strict()).min(1).max(100),
  budgets: budget,
}).strict();
const contextSchema = z.object({
  schema_version: z.literal(PLANNER_SCHEMA_VERSION),
  policy_id: id,
  policy_revision: revision,
  task_id: id,
  run_id: id,
  task_revision: revision,
  resources: z.array(z.object({
    resource_id: id,
    path: z.string().min(1).max(2000),
    classification: z.enum(['ordinary', 'shared', ...CRITICAL_CLASSES, 'unknown']),
    sha256: digest,
    size_bytes: revision,
  }).strict()).max(100),
  allowed_capabilities: z.array(id).max(100),
  permissions: z.object({
    snapshot_id: id,
    revision,
    grants: z.array(z.object({ capability: id, resource_id: id }).strict()).max(1000),
  }).strict(),
  budgets: budget,
}).strict();

// JSON data only: reject accessors without invoking them. There are no callbacks,
// coercions, toJSON hooks, implicit defaults, or caller-supplied executable code.
function isJsonData(value, seen = new Set(), depth = 0, work = { nodes: 0, bytes: 0 }) {
  work.nodes += 1;
  if (depth > 20 || work.nodes > 20000) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') {
    if (value.length > 8000) return false;
    work.bytes += Buffer.byteLength(JSON.stringify(value), 'utf8');
    return work.bytes <= 1024 * 1024;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || types.isProxy(value) || seen.has(value)) return false;
  const array = Array.isArray(value);
  if (array && Object.getPrototypeOf(value) !== Array.prototype) return false;
  if (!array && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 2001) return false;
  if (array) {
    if (keys.length !== value.length + 1) return false;
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, String(index))) return false;
    }
  }
  seen.add(value);
  for (const key of keys) {
    if (array && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || key.length > 128 || key === '__proto__' || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')
        || !isJsonData(descriptor.value, seen, depth + 1, work)) return false;
  }
  // Reject aliases too: a small shared graph must not expand during hashing.
  return true;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value) {
  return `sha256:${crypto.createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

function invalid(code, path = []) {
  return {
    schema_version: PLANNER_SCHEMA_VERSION,
    controller_revision: CONTROLLER_REVISION,
    mode: 'dry-run',
    status: 'invalid',
    contract: null,
    adapter_id: null,
    actions: [],
    issues: [{ code, path }],
    binding: null,
    execution_authorized: false,
    executed: false,
    accepted: false,
    verification: { status: 'not-performed', criteria: [] },
  };
}

function unique(values) {
  return new Set(values).size === values.length;
}

function validateReferences(task, context) {
  for (const [path, values] of [
    ['criteria', task.criteria.map((item) => item.id)],
    ['inputs', task.inputs.map((item) => item.id)],
    ['actions', task.actions.map((item) => item.action_id)],
    ['resources', context.resources.map((item) => item.resource_id)],
    ['allowed_capabilities', context.allowed_capabilities],
    ['permissions.grants', context.permissions.grants.map((item) => `${item.capability}/${item.resource_id}`)],
  ]) {
    if (!unique(values)) return invalid('DUPLICATE_ID', [path]);
  }
  for (const action of task.actions) {
    if (!unique(action.input_ids) || !unique(action.criterion_ids)
        || action.input_ids.some((ref) => !task.inputs.some((input) => input.id === ref))
        || action.criterion_ids.some((ref) => !task.criteria.some((criterion) => criterion.id === ref))) {
      return invalid('INVALID_ACTION_REFERENCES', ['actions', action.action_id]);
    }
  }
  if (task.inputs.some((input) => !task.actions.some((action) => action.input_ids.includes(input.id)))
      || task.criteria.some((criterion) => !task.actions.some((action) => action.criterion_ids.includes(criterion.id)))) {
    return invalid('UNREFERENCED_TASK_INPUT_OR_CRITERION');
  }
  return null;
}

function safePath(value) {
  // Canonical, literal repository-relative paths only; never resolve against disk.
  const segments = value.split('/');
  return value === value.trim()
    && !/[\\:%*?\[\]{}\u0000-\u001f\u007f]/.test(value)
    && !segments.some((segment) => !segment || segment === '.' || segment === '..' || segment !== segment.trim()
      || segment.endsWith('.') || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))
    && !segments.some((segment) => segment.toLowerCase() === '.quiver')
    && getContextPathExclusionReason(value.toLowerCase()) === null;
}

function classify(capability, resources, claimedRisk) {
  if (claimedRisk === 'unknown' || resources.some((resource) => resource.classification === 'unknown')) return 'unknown';
  if (claimedRisk === 'critical' || resources.some((resource) => CRITICAL_CLASSES.includes(resource.classification))) return 'critical';
  if (claimedRisk === 'intermediate' || capability.risk === 'intermediate' || resources.some((resource) => resource.classification === 'shared')) return 'intermediate';
  return 'low';
}

// Both adapters provide descriptions only. Every decision goes through this
// controller; the registry cannot be extended by task data or trusted context.
function assessAction(task, context, adapter, action) {
  const reasons = [];
  const capability = Object.hasOwn(adapter.capabilities, action.capability) ? adapter.capabilities[action.capability] : null;
  const inputRefs = action.input_ids.map((ref) => task.inputs.find((input) => input.id === ref));
  const resourceIds = [...new Set([action.resource_id, ...inputRefs.map((input) => input.resource_id)])];
  const resources = resourceIds.map((ref) => context.resources.find((resource) => resource.resource_id === ref));
  if (!capability) reasons.push('UNSUPPORTED_ACTION');
  if (!context.allowed_capabilities.includes(action.capability)) reasons.push('CAPABILITY_NOT_ALLOWED');
  if (resources.some((resource) => !resource)) reasons.push('RESOURCE_NOT_ALLOWED');
  if (resources.some((resource) => resource && !safePath(resource.path))) reasons.push('UNSAFE_RESOURCE_PATH');
  if (resourceIds.some((resourceId) => !context.permissions.grants.some((grant) =>
    grant.capability === action.capability && grant.resource_id === resourceId))) reasons.push('PERMISSION_MISSING');
  if (inputRefs.some((input) => {
    const resource = context.resources.find((item) => item.resource_id === input.resource_id);
    return !resource || input.sha256 !== resource.sha256;
  })) reasons.push('INPUT_BINDING_MISMATCH');
  const risk = capability && resources.every(Boolean) ? classify(capability, resources, action.claimed_risk) : 'unknown';
  // Cap each sum before addition so hostile safe integers cannot overflow.
  let inputBytes = 0;
  for (const input of inputRefs) {
    const resource = context.resources.find((item) => item.resource_id === input.resource_id);
    inputBytes = Math.min(Number.MAX_SAFE_INTEGER, inputBytes + (resource ? resource.size_bytes : 0));
  }
  const denied = reasons.length > 0;
  if (!denied) reasons.push(risk === 'low' ? 'LOW_RISK_ELIGIBILITY_ONLY'
    : risk === 'intermediate' ? 'REVIEW_BEFORE_SHARED_CHANGE'
      : risk === 'critical' ? 'CRITICAL_REQUIRES_APPROVAL' : 'UNCERTAIN_REQUIRES_APPROVAL');
  return {
    ...action,
    effective_risk: risk,
    decision: denied ? 'denied' : risk === 'low' ? 'eligible' : risk === 'intermediate' && action.phase === 'prepare' ? 'prepare-only' : 'approval-required',
    reasons,
    approval_requirement: {
      required: risk !== 'low',
      scope: risk === 'intermediate' ? 'before-apply' : risk === 'low' ? 'none' : 'before-action',
      satisfied: false,
    },
    outline: !denied ? {
      artifact_kind: capability.artifact,
      objective: task.objective,
      target_path: resources[0].path,
      sources: inputRefs.map((input) => ({ ...input,
        path: context.resources.find((resource) => resource.resource_id === input.resource_id).path })),
      proposed_checks: action.criterion_ids.map((ref) => ({
        criterion_id: ref,
        criterion: task.criteria.find((criterion) => criterion.id === ref).text,
        evidence_kind: adapter.verification_kind,
        status: 'not-performed',
      })),
    } : null,
    planned_input_bytes: inputBytes,
    execution_authorized: false,
    executed: false,
    accepted: false,
  };
}

function planDryRun(taskInput, trustedContext) {
  if (!isJsonData(taskInput) || !isJsonData(trustedContext)) return invalid('JSON_DATA_REQUIRED');
  // Hard ceiling before schema work; domain budgets below are independent.
  if (Buffer.byteLength(canonicalJson([taskInput, trustedContext]), 'utf8') > 1024 * 1024) return invalid('CONTRACT_TOO_LARGE');
  const taskResult = taskSchema.safeParse(taskInput);
  const contextResult = contextSchema.safeParse(trustedContext);
  if (!taskResult.success || !contextResult.success) {
    const issue = (!taskResult.success ? taskResult : contextResult).error.issues[0];
    return invalid('CONTRACT_INVALID', [!taskResult.success ? 'task' : 'trusted_context', ...issue.path]);
  }
  const task = taskResult.data;
  const context = contextResult.data;
  const referenceError = validateReferences(task, context);
  if (referenceError) return referenceError;
  const adapter = ADAPTERS[task.domain];
  const actions = task.actions.map((action) => assessAction(task, context, adapter, action));
  const globalReasons = [];
  if (task.task_id !== context.task_id || task.run_id !== context.run_id || task.revision !== context.task_revision) globalReasons.push('TASK_BINDING_MISMATCH');
  const inputBytes = task.actions.reduce((sum, action) => sum + action.input_ids.reduce((subtotal, ref) => {
    const input = task.inputs.find((item) => item.id === ref);
    const resource = context.resources.find((item) => item.resource_id === input.resource_id);
    return subtotal + BigInt(resource ? resource.size_bytes : 0);
  }, 0n), 0n);
  if (actions.length > Math.min(task.budgets.max_actions, context.budgets.max_actions)) globalReasons.push('ACTION_BUDGET_EXCEEDED');
  if (inputBytes > BigInt(Math.min(task.budgets.max_input_bytes, context.budgets.max_input_bytes))) globalReasons.push('INPUT_BUDGET_EXCEEDED');
  if (globalReasons.length) {
    for (const action of actions) {
      action.decision = 'denied';
      action.reasons = [...globalReasons, ...action.reasons.filter((reason) => !reason.endsWith('_ONLY'))];
    }
  }
  const binding = hash({
    schema_version: PLANNER_SCHEMA_VERSION,
    controller_revision: CONTROLLER_REVISION,
    adapter,
    task,
    trusted_context: context,
    actions,
  });
  return {
    schema_version: PLANNER_SCHEMA_VERSION,
    controller_revision: CONTROLLER_REVISION,
    mode: 'dry-run',
    status: actions.some((action) => action.decision === 'denied') ? 'denied' : 'planned',
    contract: task,
    adapter_id: adapter.id,
    actions: actions.map((action) => ({ ...action, binding: hash({ plan_binding: binding, action }) })),
    issues: [],
    binding,
    execution_authorized: false,
    executed: false,
    accepted: false,
    verification: { status: 'not-performed', criteria: task.criteria.map((criterion) => ({ criterion_id: criterion.id, status: 'not-verified' })) },
  };
}

module.exports = { PLANNER_SCHEMA_VERSION, CONTROLLER_REVISION, planDryRun };
