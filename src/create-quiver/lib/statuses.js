const CANONICAL_STATUSES = Object.freeze({
  spec: Object.freeze(['draft', 'planned', 'approved', 'in-progress', 'blocked', 'review', 'done', 'archived']),
  slice: Object.freeze(['planned', 'ready', 'in-progress', 'blocked', 'review', 'completed', 'skipped']),
  run: Object.freeze(['draft', 'waiting-approval', 'approved', 'running', 'blocked', 'done', 'failed']),
  approval: Object.freeze(['pending', 'approved', 'rejected', 'superseded']),
  agent: Object.freeze(['idle', 'planning', 'reading', 'coding', 'reviewing', 'blocked', 'waiting-approval', 'done']),
  dataset: Object.freeze(['ready', 'partial', 'empty', 'error']),
});

const STATUS_ALIASES = Object.freeze({
  spec: Object.freeze({
    active: 'in-progress',
    complete: 'done',
    completed: 'done',
    closed: 'done',
    done: 'done',
    in_progress: 'in-progress',
    pending: 'planned',
  }),
  slice: Object.freeze({
    active: 'in-progress',
    cancelled: 'skipped',
    canceled: 'skipped',
    closed: 'completed',
    complete: 'completed',
    done: 'completed',
    draft: 'planned',
    in_progress: 'in-progress',
    pending: 'planned',
  }),
  run: Object.freeze({
    active: 'running',
    closed: 'done',
    complete: 'done',
    completed: 'done',
    in_progress: 'running',
    pending: 'draft',
    stale: 'draft',
  }),
  approval: Object.freeze({
    draft: 'pending',
    review: 'pending',
    reviewed: 'pending',
    stale: 'pending',
    unapproved: 'pending',
  }),
  agent: Object.freeze({
    active: 'coding',
    complete: 'done',
    completed: 'done',
    in_progress: 'coding',
    waiting_approval: 'waiting-approval',
  }),
  dataset: Object.freeze({
    ok: 'ready',
    warning: 'partial',
    missing: 'empty',
    failed: 'error',
  }),
});

function normalizeStatusToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
}

function normalizeStatus(kind, status, fallback = 'planned') {
  const family = String(kind || '').trim().toLowerCase();
  const catalog = CANONICAL_STATUSES[family];
  if (!catalog) {
    return normalizeStatusToken(status) || normalizeStatusToken(fallback);
  }

  const normalized = normalizeStatusToken(status) || normalizeStatusToken(fallback);
  const aliasKey = normalized.replace(/-/g, '_');
  const aliases = STATUS_ALIASES[family] || {};
  const canonical = aliases[normalized] || aliases[aliasKey] || normalized;

  if (catalog.includes(canonical)) {
    return canonical;
  }

  const fallbackStatus = normalizeStatusToken(fallback);
  return catalog.includes(fallbackStatus) ? fallbackStatus : catalog[0];
}

function isCompletedStatus(kind, status) {
  const family = String(kind || '').trim().toLowerCase();
  const canonical = normalizeStatus(family, status, family === 'slice' ? 'planned' : 'draft');

  if (family === 'slice') {
    return canonical === 'completed';
  }

  if (family === 'spec' || family === 'run' || family === 'agent') {
    return canonical === 'done';
  }

  return canonical === 'approved';
}

function isBlockedStatus(kind, status, record = {}) {
  return normalizeStatus(kind, status, 'planned') === 'blocked' || Boolean(record?.blocked_reason || record?.json?.blocked_reason);
}

module.exports = {
  CANONICAL_STATUSES,
  isBlockedStatus,
  isCompletedStatus,
  normalizeStatus,
};

