// Optional IO boundary. The pure planner never imports this module.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { types } = require('node:util');
const { prepareDevelopmentProposal } = require('./dry-run');

const LIMIT = 1024 * 1024;
const digest = (bytes) => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
const fail = (code) => { throw Object.assign(new Error(code), { code }); };
const clone = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function regularPath(root, relative) {
  // Reject Windows aliases as well as traversal on every platform.
  const parts = relative.split('/');
  if (!/^[A-Za-z0-9._/-]+$/.test(relative) || parts.some((part) =>
    !part || part === '.' || part === '..' || part.endsWith('.')
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) fail('UNSAFE_PATH');
  let current = root;
  for (let i = 0; i < parts.length; i += 1) {
    current = path.join(current, parts[i]);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) fail('UNSAFE_FILE');
  }
  return current;
}

function readBoundFile(root, resource) {
  const filename = regularPath(root, resource.path);
  const before = fs.lstatSync(filename);
  if (before.nlink !== 1 || before.size > LIMIT) fail('UNSAFE_FILE');
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== before.dev || opened.ino !== before.ino) fail('FILE_CHANGED');
    // Bounded read even if the file grows after stat.
    const buffer = Buffer.alloc(Math.min(LIMIT, resource.size_bytes) + 1);
    let used = 0;
    while (used < buffer.length) {
      const count = fs.readSync(fd, buffer, used, buffer.length - used, null);
      if (count === 0) break;
      used += count;
    }
    const bytes = buffer.subarray(0, used);
    const after = fs.fstatSync(fd);
    const linked = fs.lstatSync(regularPath(root, resource.path));
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs
      || linked.dev !== opened.dev || linked.ino !== opened.ino || linked.nlink !== 1) fail('FILE_CHANGED');
    if (bytes.length !== resource.size_bytes || digest(bytes) !== resource.sha256) fail('BASE_MISMATCH');
    return Buffer.from(bytes);
  } finally {
    fs.closeSync(fd);
  }
}

// Called only after the existing proposal parser accepts the modification-only diff.
function applyExact(bytes, diff) {
  const text = bytes.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(bytes) || /[\r\0]/.test(text)
    || (text.length > 0 && !text.endsWith('\n'))) fail('UNSUPPORTED_TEXT');
  const source = text.length ? text.slice(0, -1).split('\n') : [];
  const lines = diff.slice(0, -1).split('\n');
  let cursor = lines[0].startsWith('diff --git ') ? 3 : 2;
  let sourceIndex = 0;
  const output = [];
  while (cursor < lines.length) {
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@$/.exec(lines[cursor++]);
    const oldCount = Number(match[2] ?? 1);
    const offset = Number(match[1]) - (oldCount === 0 ? 0 : 1);
    if (offset < sourceIndex || offset + oldCount > source.length) fail('PATCH_NOT_APPLICABLE');
    for (const line of source.slice(sourceIndex, offset)) output.push(line);
    sourceIndex = offset;
    while (cursor < lines.length && !lines[cursor].startsWith('@@ ')) {
      const line = lines[cursor++];
      if (line[0] !== '+') {
        if (source[sourceIndex++] !== line.slice(1)) fail('PATCH_NOT_APPLICABLE');
      }
      if (line[0] !== '-') output.push(line.slice(1));
    }
  }
  for (const line of source.slice(sourceIndex)) output.push(line);
  const result = Buffer.from(output.length ? `${output.join('\n')}\n` : '');
  if (result.length > LIMIT) fail('OUTPUT_BUDGET_EXCEEDED');
  return result;
}

/**
 * Trusted host API, not an authentication service or an OS sandbox.
 * Review reads source files only. execute calls a host-owned authorization
 * function, rechecks all inputs, then writes only a fresh private temp directory.
 * No proposed code/commands run; no source files or existing artifacts change.
 */
function reviewDevelopmentWorkspace(sourceRoot, request) {
  if (!request || typeof request !== 'object' || types.isProxy(request)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(request))) fail('INVALID_REQUEST');
  const keys = Reflect.ownKeys(request);
  if (keys.length !== 3 || !['task', 'trusted_context', 'proposal_input'].every((key) =>
    keys.includes(key) && Object.hasOwn(Object.getOwnPropertyDescriptor(request, key), 'value'))) fail('INVALID_REQUEST');
  const proposal = prepareDevelopmentProposal(request.task, request.trusted_context, request.proposal_input);
  if (proposal.status !== 'prepared') fail('PROPOSAL_NOT_PREPARED');
  const snapshot = freeze(clone(request));
  if (typeof sourceRoot !== 'string' || !path.isAbsolute(sourceRoot)) fail('ABSOLUTE_ROOT_REQUIRED');
  // Pin the canonical host-supplied root; never accept a symlink as the root itself.
  // Remove trailing separators/dot segments before lstat, which may otherwise
  // dereference a directory link on some platforms.
  const rootEntry = path.resolve(sourceRoot);
  const entryStat = fs.lstatSync(rootEntry);
  if (!entryStat.isDirectory() || entryStat.isSymbolicLink()) fail('UNSAFE_ROOT');
  const root = fs.realpathSync(rootEntry);
  const tempRoot = fs.realpathSync(os.tmpdir());
  const tempRelative = path.relative(root, tempRoot);
  if (tempRelative === '' || (!tempRelative.startsWith(`..${path.sep}`)
    && tempRelative !== '..' && !path.isAbsolute(tempRelative))) fail('TEMP_WITHIN_SOURCE');
  const rootStat = fs.statSync(root);
  const used = new Set(snapshot.task.inputs.map((input) => input.resource_id));
  const resources = snapshot.trusted_context.resources.filter((resource) => used.has(resource.resource_id));
  if (resources.reduce((sum, resource) => sum + resource.size_bytes, 0) > LIMIT) fail('INPUT_BUDGET_EXCEEDED');
  if (new Set(resources.map((resource) => resource.path.toLowerCase())).size !== resources.length) fail('DUPLICATE_INPUT_PATH');
  const before = new Map(resources.map((resource) => [resource.resource_id, readBoundFile(root, resource)]));
  const outputs = proposal.files.map((file) => ({ file, bytes: applyExact(before.get(file.resource_id), file.unified_diff) }));
  if (outputs.reduce((sum, output) => sum + output.bytes.length, 0) > LIMIT) fail('OUTPUT_BUDGET_EXCEEDED');
  const manifest = {
    schema_version: 1, adapter_revision: 'supervised-workspace-v1',
    task: proposal.task, proposal_binding: proposal.proposal_binding,
    scope: proposal.scope, files: outputs.map(({ file, bytes }) => ({
      path: file.path, before_sha256: file.before_sha256, patch_sha256: file.patch_sha256,
      after_sha256: digest(bytes), size_bytes: bytes.length, unified_diff: file.unified_diff,
    })),
    inputs: resources.map(({ resource_id, path: resourcePath, sha256, size_bytes }) => ({ resource_id, path: resourcePath, sha256, size_bytes })),
    proposed_tests: proposal.proposed_tests,
    destination: 'new-private-temporary-workspace', source_modified: false,
    execution_authorized: false, executed: false, accepted: false,
    verification: clone(proposal.verification),
  };
  // Binding pins the actual source root as well, without exposing its absolute path.
  const binding = digest(JSON.stringify({ root, manifest }));
  const review = freeze({ ...manifest, binding });
  let consumed = false;
  return Object.freeze({
    review,
    execute(authorize) {
      if (consumed) fail('SESSION_CONSUMED');
      consumed = true;
      if (typeof authorize !== 'function') fail('HOST_AUTHORIZATION_REQUIRED');
      const approval = authorize(review);
      if (!approval || approval.approved !== true || approval.binding !== binding
        || typeof approval.approval_id !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(approval.approval_id)) fail('AUTHORIZATION_DENIED');
      if (fs.realpathSync(rootEntry) !== root || fs.lstatSync(rootEntry).isSymbolicLink()) fail('ROOT_CHANGED');
      const currentRoot = fs.statSync(root);
      if (currentRoot.dev !== rootStat.dev || currentRoot.ino !== rootStat.ino) fail('ROOT_CHANGED');
      // Re-read every input after the approval boundary, including non-targets.
      for (const resource of resources) readBoundFile(root, resource);
      const workspace = fs.mkdtempSync(path.join(tempRoot, 'quiver-supervised-'));
      try {
        fs.chmodSync(workspace, 0o700);
        const artifactRoot = path.join(workspace, 'files');
        fs.mkdirSync(artifactRoot);
        for (const { file, bytes } of outputs) {
          const target = path.join(artifactRoot, file.path);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });
          if (!fs.readFileSync(target).equals(bytes)) fail('READBACK_MISMATCH');
        }
        const evidence = {
          schema_version: 1, binding, approval_id: approval.approval_id,
          task: review.task, proposal_binding: review.proposal_binding,
          status: 'applied-to-temporary-workspace', execution_authorized: true, executed: true,
          source_modified: false, accepted: false, scope: review.scope,
          inputs: review.inputs,
          files: review.files.map(({ unified_diff, ...file }) => ({ ...file, readback: 'passed' })),
          tests: { status: 'not-performed', reason: 'Proposed commands are not executable authority.' },
          verification: review.verification,
        };
        const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
        fs.writeFileSync(path.join(workspace, 'evidence.json'), serialized, { flag: 'wx', mode: 0o600 });
        return { workspace, evidence: clone(evidence), evidence_sha256: digest(serialized) };
      } catch (error) {
        // This directory was created exclusively by this call, never caller-supplied.
        fs.rmSync(workspace, { recursive: true, force: true });
        throw error;
      }
    },
  });
}

module.exports = { reviewDevelopmentWorkspace };
