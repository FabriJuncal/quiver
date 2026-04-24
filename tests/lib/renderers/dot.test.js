const assert = require('node:assert/strict');
const test = require('node:test');

const { renderDotGraph } = require('../../../src/create-quiver/lib/renderers/dot');

function sampleReport() {
  return {
    levels: [
      [
        {
          ref: 'spec-a/slice-01-alpha',
          title: 'Alpha',
          slice_id: 'slice-01-alpha',
          status: 'draft',
          hours: 2,
          depends_on: [],
        },
      ],
      [
        {
          ref: 'spec-b/slice-02-beta',
          title: 'Beta',
          slice_id: 'slice-02-beta',
          status: 'draft',
          hours: 5,
          depends_on: ['spec-a/slice-01-alpha'],
        },
      ],
    ],
    conflicts: [
      {
        level: 1,
        files: ['docs/shared.md'],
        slices: ['spec-b/slice-02-beta'],
      },
    ],
  };
}

test('renderDotGraph emits valid DOT source with nodes and edges', () => {
  const output = renderDotGraph(sampleReport(), { showConflicts: true });

  assert.ok(output.startsWith('digraph QuiverGraph {\n'));
  assert.ok(output.includes('rankdir=TB;'));
  assert.ok(output.includes('n_spec_a_slice_01_alpha [label="spec-a/slice-01-alpha\\nAlpha\\n2h\\n[draft]"]'));
  assert.ok(output.includes('n_spec_a_slice_01_alpha -> n_spec_b_slice_02_beta;'));
  assert.ok(output.includes('Files: docs/shared.md'));
  assert.ok(output.trimEnd().endsWith('}'));
});
