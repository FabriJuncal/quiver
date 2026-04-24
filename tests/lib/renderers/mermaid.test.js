const assert = require('node:assert/strict');
const test = require('node:test');

const { renderMermaidGraph } = require('../../../src/create-quiver/lib/renderers/mermaid');

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
        {
          ref: 'spec-b/slice-01-beta',
          title: 'Beta',
          slice_id: 'slice-01-beta',
          status: 'draft',
          hours: 3,
          depends_on: [],
        },
      ],
      [
        {
          ref: 'spec-c/slice-02-gamma',
          title: 'Gamma',
          slice_id: 'slice-02-gamma',
          status: 'draft',
          hours: 4,
          depends_on: ['spec-a/slice-01-alpha'],
        },
      ],
    ],
    conflicts: [
      {
        level: 1,
        files: ['docs/shared.md'],
        slices: ['spec-c/slice-02-gamma'],
      },
    ],
  };
}

test('renderMermaidGraph emits a fenced flowchart with nodes and edges', () => {
  const output = renderMermaidGraph(sampleReport(), { showConflicts: true });

  assert.ok(output.startsWith('```mermaid\nflowchart TD\n'));
  assert.ok(output.includes('n_spec_a_slice_01_alpha["spec-a/slice-01-alpha<br/>Alpha<br/>2h<br/>[draft]"]'));
  assert.ok(output.includes('n_spec_a_slice_01_alpha --> n_spec_c_slice_02_gamma'));
  assert.ok(output.includes('Files: docs/shared.md'));
  assert.ok(output.trimEnd().endsWith('```'));
});
