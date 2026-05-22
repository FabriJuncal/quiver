const assert = require('node:assert/strict');
const test = require('node:test');

const { parseJsonWithComments, stripJsonComments } = require('../../src/create-quiver/lib/json');

test('stripJsonComments preserves comment-like markers inside strings', () => {
  const parsed = parseJsonWithComments(`{
    // real line comment
    "files": ["src/create-quiver/**", "https://example.com/a//b", "literal /* keep */ value"],
    /* real block comment */
    "status": "planned"
  }`);

  assert.deepEqual(parsed.files, [
    'src/create-quiver/**',
    'https://example.com/a//b',
    'literal /* keep */ value',
  ]);
  assert.equal(parsed.status, 'planned');
});

test('stripJsonComments removes comments outside strings', () => {
  const output = stripJsonComments('{\n  "ok": true, // comment\n  /* block */\n  "next": 1\n}');

  assert.doesNotMatch(output, /comment/);
  assert.doesNotMatch(output, /block/);
  assert.equal(JSON.parse(output).next, 1);
});
