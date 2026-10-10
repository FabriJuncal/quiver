// Fixed host-owned suite. Never included in the proposed application patch.
const assert = require('node:assert/strict');
const app = require(process.argv[2]);
const cases = [
  ['regression-list', () => assert.deepEqual(app.list().map((p) => p.id), [1, 2, 3])],
  ['regression-by-id', () => assert.deepEqual(app.byId(2), { id: 2, name: 'Luis Perez' })],
  ['regression-copy', () => { const list = app.list(); list[0].name = 'changed'; assert.equal(app.byId(1).name, 'Ana Torres'); }],
  ['search-name', () => assert.deepEqual(app.search(' aNA ').map((p) => p.id), [1, 3])],
  ['search-absent', () => assert.deepEqual(app.search('Nobody'), [])],
  ['search-empty', () => assert.deepEqual(app.search('').map((p) => p.id), [1, 2, 3])],
];
const results = cases.map(([id, run]) => {
  try { run(); return { id, passed: true }; }
  catch { return { id, passed: false }; }
});
process.stdout.write(JSON.stringify({ results }));
process.exitCode = results.every((item) => item.passed) ? 0 : 1;
