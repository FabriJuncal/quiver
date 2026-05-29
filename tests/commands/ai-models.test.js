const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runCli(args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('ai models list groups models by provider in human output', () => {
  const output = runCli(['ai', 'models', 'list']);

  assert.match(output, /AI models known by Quiver/);
  assert.match(output, /Catalog version:/);
  assert.match(output, /Codex \(codex\)/);
  assert.match(output, /Claude \(claude\)/);
  assert.match(output, /Gemini \(gemini\)/);
  assert.match(output, /gpt-5\.5 \(GPT 5\.5\)/);
  assert.match(output, /roles: planner, reviewer/);
  assert.doesNotMatch(output, /\bavailable\b/i);
});

test('ai models list filters by provider', () => {
  const output = runCli(['ai', 'models', 'list', '--provider', 'codex']);

  assert.match(output, /Codex \(codex\)/);
  assert.match(output, /gpt-5\.5/);
  assert.doesNotMatch(output, /Claude \(claude\)/);
  assert.doesNotMatch(output, /Gemini \(gemini\)/);
});

test('ai models list --json emits clean parseable catalog metadata', () => {
  const output = runCli(['ai', 'models', 'list', '--json']);
  const parsed = JSON.parse(output);

  assert.equal(typeof parsed.catalogVersion, 'number');
  assert.equal(parsed.lastUpdated, '2026-05-27');
  assert.equal(parsed.providers.length, 3);
  assert.equal(parsed.providers[0].id, 'codex');
  assert.equal(parsed.providers[0].models.some((model) => model.id === 'gpt-5.5'), true);
  assert.doesNotMatch(output, /AI models known by Quiver/);
});

test('ai models list localizes Spanish human output without changing JSON', () => {
  const output = runCli(['--lang', 'es', 'ai', 'models', 'list', '--provider', 'codex']);

  assert.match(output, /Modelos de IA conocidos por Quiver/);
  assert.match(output, /Version del catalogo:/);
  assert.match(output, /Ultima actualizacion:/);
  assert.match(output, /Codex \(codex\)/);
  assert.match(output, /gpt-5\.5 \(GPT 5\.5\)/);
  assert.match(output, /roles: planner, reviewer/);
  assert.doesNotMatch(output, /AI models known by Quiver/);

  const json = runCli(['--lang', 'es', 'ai', 'models', 'list', '--json']);
  const parsed = JSON.parse(json);
  assert.equal(parsed.providers[0].id, 'codex');
  assert.equal(parsed.providers[0].models.some((model) => model.id === 'gpt-5.5'), true);
  assert.doesNotMatch(json, /Modelos de IA conocidos por Quiver/);
});

test('ai models list rejects unsupported provider filters with guidance', () => {
  assert.throws(
    () => runCli(['ai', 'models', 'list', '--provider', 'openai']),
    /unsupported provider filter 'openai'. Supported providers: codex, claude, gemini\./,
  );
});

test('ai models list rejects unsupported provider filters in Spanish', () => {
  assert.throws(
    () => runCli(['--lang', 'es', 'ai', 'models', 'list', '--provider', 'openai']),
    /filtro de provider no soportado 'openai'. Providers soportados: codex, claude, gemini\./,
  );
});
