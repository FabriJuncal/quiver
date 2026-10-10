// Optional pure retrieval: supplied text is data, never instructions or code.
const crypto = require('node:crypto');
const { types } = require('node:util');
const { z } = require('zod');
const { planDryRun } = require('./dry-run');

const CORPUS_LIMIT = 64 * 1024;
const OUTPUT_LIMIT = 128 * 1024;
const MATCHES_PER_SOURCE = 5;
const fail = (code) => { throw Object.assign(new Error(code), { code }); };
const digest = (text) => `sha256:${crypto.createHash('sha256').update(text, 'utf8').digest('hex')}`;
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

// Inspect descriptors before schema parsing: never invoke getters/proxy traps,
// coercion hooks or toJSON. Bound traversal as well as the final corpus size.
function jsonData(value, seen = new Set(), depth = 0, work = { nodes: 0, bytes: 0 }) {
  if (++work.nodes > 5000 || depth > 8) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') {
    if (value.length > 8000) return false;
    work.bytes += Buffer.byteLength(value, 'utf8');
    return work.bytes <= 256 * 1024;
  }
  if (typeof value !== 'object' || types.isProxy(value) || seen.has(value)) return false;
  const array = Array.isArray(value);
  const proto = Object.getPrototypeOf(value);
  if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 129 || (array && keys.length !== value.length + 1)) return false;
  seen.add(value);
  for (const key of keys) {
    if (array && key === 'length') continue;
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || key.length > 128 || key === '__proto__' || !d.enumerable
      || !Object.hasOwn(d, 'value') || !jsonData(d.value, seen, depth + 1, work)) return false;
  }
  if (array) for (let i = 0; i < value.length; i += 1) if (!Object.hasOwn(value, String(i))) return false;
  return true;
}

const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const inputSchema = z.object({
  schema_version: z.literal(1),
  expected_plan_binding: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  documents: z.array(z.object({ resource_id: id, text: z.string().max(8000) }).strict()).min(1).max(32),
  queries: z.array(z.object({
    id, action_id: id, criterion_id: id,
    term: z.string().min(1).max(128).refine((s) => s.trim().length > 0),
  }).strict()).min(1).max(20),
}).strict();
const hostOptionsSchema = z.object({ include_quotes: z.boolean() }).strict();
const unique = (values) => new Set(values).size === values.length;
const supportedText = (text) => !/\r(?!\n)|\0/.test(text) && Buffer.from(text, 'utf8').toString('utf8') === text;

/**
 * Hash-verified literal comparisons of caller-supplied source snapshots.
 * Acquires no files/network/processes. Eligibility is not execution authority.
 * A matching line is an occurrence, not proof of truth or semantic support.
 */
function retrieveResearchCorpus(task, trustedContext, corpusInput, hostOptions) {
  const plan = planDryRun(task, trustedContext);
  if (plan.status !== 'planned') fail('PLAN_NOT_ELIGIBLE');
  if (plan.contract.domain !== 'research' || plan.actions.some((a) =>
    a.capability !== 'research.compare' || a.phase !== 'prepare'
    || a.decision !== 'eligible' || a.effective_risk !== 'low')) fail('RESEARCH_COMPARE_ONLY');
  if (!jsonData(corpusInput)) fail('JSON_DATA_REQUIRED');
  const parsed = inputSchema.safeParse(corpusInput);
  if (!parsed.success) fail('CORPUS_CONTRACT_INVALID');
  const input = parsed.data;
  const optionsInput = hostOptions === undefined ? { include_quotes: false } : hostOptions;
  if (!jsonData(optionsInput)) fail('HOST_OPTIONS_INVALID');
  const optionsResult = hostOptionsSchema.safeParse(optionsInput);
  if (!optionsResult.success) fail('HOST_OPTIONS_INVALID');
  const options = optionsResult.data;
  if (input.expected_plan_binding !== plan.binding) fail('STALE_PLAN_BINDING');
  if (!unique(input.documents.map((d) => d.resource_id)) || !unique(input.queries.map((q) => q.id))
    || !unique(plan.contract.inputs.map((i) => i.resource_id))) fail('DUPLICATE_REFERENCE');
  const expected = plan.contract.inputs.map((i) => i.resource_id);
  if (input.documents.length !== expected.length || input.documents.some((d) => !expected.includes(d.resource_id))) fail('SOURCE_SET_MISMATCH');
  if (plan.actions.some((a) => !a.outline.sources.some((s) => s.resource_id === a.resource_id))) fail('TARGET_INPUT_REQUIRED');
  const documents = new Map();
  let totalBytes = 0;
  const sources = plan.contract.inputs.map((ref) => {
    const resource = trustedContext.resources.find((r) => r.resource_id === ref.resource_id);
    const document = input.documents.find((d) => d.resource_id === ref.resource_id);
    if (!supportedText(document.text)) fail('UNSUPPORTED_TEXT');
    const lines = document.text === '' ? [] : document.text.split(/\r?\n/);
    if (document.text.endsWith('\n')) lines.pop();
    if (lines.some((line) => line.length > 1000)) fail('SOURCE_LINE_TOO_LONG');
    const size = Buffer.byteLength(document.text, 'utf8');
    totalBytes += size;
    if (size !== resource.size_bytes || digest(document.text) !== ref.sha256) fail('SOURCE_BYTES_MISMATCH');
    documents.set(ref.resource_id, lines);
    return { resource_id: ref.resource_id, path: resource.path, sha256: ref.sha256,
      size_bytes: size, provenance: 'caller-supplied-snapshot' };
  });
  if (totalBytes > CORPUS_LIMIT || totalBytes > Math.min(plan.contract.budgets.max_input_bytes, trustedContext.budgets.max_input_bytes)) fail('CORPUS_BUDGET_EXCEEDED');
  if (!unique(sources.map((s) => s.path.toLowerCase()))) fail('DUPLICATE_SOURCE_PATH');
  for (const query of input.queries) {
    if (!supportedText(query.term) || /[\r\n]/.test(query.term)) fail('UNSUPPORTED_TERM');
    const action = plan.actions.find((a) => a.action_id === query.action_id);
    if (!action || !action.criterion_ids.includes(query.criterion_id)) fail('QUERY_SCOPE_MISMATCH');
  }
  if (plan.actions.some((a) => a.criterion_ids.some((id) => !input.queries.some((q) => q.action_id === a.action_id && q.criterion_id === id)))
    || plan.contract.criteria.some((c) => !input.queries.some((q) => q.criterion_id === c.id))) fail('QUERY_COVERAGE_REQUIRED');

  const comparisons = input.queries.map((query) => {
    const action = plan.actions.find((a) => a.action_id === query.action_id);
    return { ...query, sources: action.outline.sources.map((ref) => {
      const matches = [];
      let count = 0;
      documents.get(ref.resource_id).forEach((line, index) => {
        if (line.includes(query.term)) {
          count += 1;
          if (matches.length < MATCHES_PER_SOURCE) matches.push(options.include_quotes
            ? { line: index + 1, quote: line } : { line: index + 1 });
        }
      });
      return { resource_id: ref.resource_id, source_sha256: ref.sha256,
        status: count ? 'literal-match' : 'not-found-in-supplied-source',
        matched_line_count: count, excerpts_truncated: count > matches.length, matches };
    }) };
  });
  const report = {
    schema_version: 1, adapter_revision: 'research-corpus-v1', status: 'retrieved',
    task: { task_id: plan.contract.task_id, run_id: plan.contract.run_id, revision: plan.contract.revision },
    plan_binding: plan.binding,
    request_binding: digest(canonical({ plan_binding: plan.binding, input, host_options: options })),
    retrieval: { status: 'performed', method: 'case-sensitive-literal-line-match',
      source_integrity: 'verified', input_bytes: totalBytes, max_excerpts_per_source: MATCHES_PER_SOURCE,
      excerpt_policy: options.include_quotes ? 'host-opted-in-verbatim' : 'locations-only' },
    sources, comparisons,
    execution_authorized: false, executed: false, accepted: false,
    verification: plan.verification,
    limitations: ['No external source acquisition or code execution.',
      'Literal presence is not semantic support, factual truth, completeness or freshness.',
      'Source provenance and permission snapshot authenticity remain host responsibilities.',
      'Queries and metadata are not redacted; counts and hashes are not anonymization.',
      'Verbatim quotations require explicit host opt-in and may contain sensitive source content.'],
  };
  report.report_binding = digest(canonical(report));
  if (Buffer.byteLength(canonical(report), 'utf8') > OUTPUT_LIMIT) fail('OUTPUT_BUDGET_EXCEEDED');
  return freeze(report);
}

module.exports = { retrieveResearchCorpus };
