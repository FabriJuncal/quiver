const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  RECOVERY_CLASSIFICATION,
  RECOVERY_REASON,
  buildAnalyzeProjectRecoveryCommand,
  buildEvidenceRecoveryPayload,
  calculateRecoveryBudget,
  classifyEvidencePath,
  classifyEvidenceRecoveryIssues,
  extractEvidencePathFromIssue,
  isMetadataOnlyPath,
  normalizeRelativeEvidencePath,
} = require('../../src/create-quiver/lib/ai/analyze-project-recovery');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-recovery-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('normalizes project-relative evidence paths and rejects outside-scope paths', () => {
  assert.deepEqual(normalizeRelativeEvidencePath('src\\app.ts'), {
    ok: true,
    input_path: 'src\\app.ts',
    path: 'src/app.ts',
    path_issue: null,
  });

  const traversal = normalizeRelativeEvidencePath('../secret.txt');
  assert.equal(traversal.ok, false);
  assert.equal(traversal.classification, RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE);
  assert.equal(traversal.reason, RECOVERY_REASON.OUTSIDE_SCOPE);
  assert.equal(traversal.path_issue, 'path-traversal');

  const fileUrl = normalizeRelativeEvidencePath('file:///tmp/secret.txt');
  assert.equal(fileUrl.ok, false);
  assert.equal(fileUrl.classification, RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE);
  assert.equal(fileUrl.path_issue, 'file-url');

  const absolute = normalizeRelativeEvidencePath('/tmp/secret.txt');
  assert.equal(absolute.ok, false);
  assert.equal(absolute.classification, RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE);
  assert.equal(absolute.path_issue, 'absolute-path');
});

test('classifies env examples as metadata-only and real env files as security-excluded', () => {
  const repo = makeRepo({
    '.env': 'TOKEN=secret\n',
    '.env.example': 'NEXT_PUBLIC_URL=https://example.com\n',
  });

  try {
    const env = classifyEvidencePath(repo.root, '.env');
    assert.equal(env.classification, RECOVERY_CLASSIFICATION.SECURITY_EXCLUDED);
    assert.equal(env.reason, RECOVERY_REASON.SECURITY_EXCLUDED);
    assert.equal(env.safe_to_include, false);
    assert.equal(env.content_allowed, false);

    const example = classifyEvidencePath(repo.root, '.env.example');
    assert.equal(example.classification, RECOVERY_CLASSIFICATION.METADATA_ONLY);
    assert.equal(example.reason, RECOVERY_REASON.METADATA_ONLY);
    assert.equal(example.safe_to_include, false);
    assert.equal(example.content_allowed, false);
    assert.equal(example.metadata_only, true);
  } finally {
    repo.cleanup();
  }
});

test('recognizes metadata-only env template names', () => {
  assert.equal(isMetadataOnlyPath('.env.example'), true);
  assert.equal(isMetadataOnlyPath('.env.local.example'), true);
  assert.equal(isMetadataOnlyPath('.env.production.sample'), true);
  assert.equal(isMetadataOnlyPath('.env'), false);
  assert.equal(isMetadataOnlyPath('.env.local'), false);
});

test('classifies generated dependency paths and binary files as excluded', () => {
  const repo = makeRepo({
    'node_modules/pkg/index.js': 'module.exports = {}\n',
    'dist/bundle.js': 'console.log("built")\n',
    'src/logo.png': Buffer.from([0, 1, 2, 3]),
    'src/binary.dat': Buffer.from([65, 0, 66]),
  });

  try {
    const dependency = classifyEvidencePath(repo.root, 'node_modules/pkg/index.js');
    assert.equal(dependency.classification, RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY);
    assert.equal(dependency.safe_to_include, false);

    const dist = classifyEvidencePath(repo.root, 'dist/bundle.js');
    assert.equal(dist.classification, RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY);
    assert.equal(dist.safe_to_include, false);

    const png = classifyEvidencePath(repo.root, 'src/logo.png');
    assert.equal(png.classification, RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY);
    assert.equal(png.safe_to_include, false);

    const binary = classifyEvidencePath(repo.root, 'src/binary.dat');
    assert.equal(binary.classification, RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY);
    assert.equal(binary.safe_to_include, false);
  } finally {
    repo.cleanup();
  }
});

test('classifies omitted budget files as safe-to-include without reading content', () => {
  const repo = makeRepo({
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    const item = classifyEvidencePath(repo.root, 'src/routes/users.ts', {
      omittedFiles: [
        {
          path: 'src/routes/users.ts',
          bytes: 24,
          reason: 'budget:max-bytes',
        },
      ],
    });

    assert.equal(item.classification, RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE);
    assert.equal(item.reason, RECOVERY_REASON.BUDGET_LIMITED);
    assert.equal(item.safe_to_include, true);
    assert.equal(item.content_allowed, true);
    assert.equal(item.bytes, 24);
    assert.equal(item.effective_prompt_bytes, 24);
    assert.equal(item.omitted_reason, 'budget:max-bytes');
    assert.equal(item.source, 'omitted-files');
  } finally {
    repo.cleanup();
  }
});

test('classifies lockfile omissions as metadata-only', () => {
  const repo = makeRepo({
    'package-lock.json': '{"lockfileVersion":3}\n',
  });

  try {
    const item = classifyEvidencePath(repo.root, 'package-lock.json', {
      omittedFiles: [
        {
          path: 'package-lock.json',
          bytes: 22,
          reason: 'sampling:lockfile-metadata',
        },
      ],
    });

    assert.equal(item.classification, RECOVERY_CLASSIFICATION.METADATA_ONLY);
    assert.equal(item.reason, RECOVERY_REASON.METADATA_ONLY);
    assert.equal(item.safe_to_include, false);
    assert.equal(item.content_allowed, false);
    assert.equal(item.metadata_only, true);
    assert.equal(item.effective_prompt_bytes, 0);
  } finally {
    repo.cleanup();
  }
});

test('classifies omitted binary-file records as generated dependency exclusions', () => {
  const repo = makeRepo({
    'assets/logo.png': Buffer.from([0, 1, 2, 3]),
  });

  try {
    const item = classifyEvidencePath(repo.root, 'assets/logo.png', {
      omittedFiles: [
        {
          path: 'assets/logo.png',
          reason: 'binary-file',
        },
      ],
    });

    assert.equal(item.classification, RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY);
    assert.equal(item.reason, RECOVERY_REASON.GENERATED_OR_DEPENDENCY);
    assert.equal(item.safe_to_include, false);
  } finally {
    repo.cleanup();
  }
});

test('classifies missing and not-discovered safe text files without throwing', () => {
  const repo = makeRepo({
    'src/lib/client.ts': 'export const client = {};\n',
  });

  try {
    const missing = classifyEvidencePath(repo.root, 'src/missing.ts');
    assert.equal(missing.classification, RECOVERY_CLASSIFICATION.MISSING_FILE);
    assert.equal(missing.reason, RECOVERY_REASON.MISSING_FILE);
    assert.equal(missing.safe_to_include, false);

    const notDiscovered = classifyEvidencePath(repo.root, 'src/lib/client.ts');
    assert.equal(notDiscovered.classification, RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE);
    assert.equal(notDiscovered.reason, RECOVERY_REASON.NOT_DISCOVERED);
    assert.equal(notDiscovered.safe_to_include, true);
    assert.equal(notDiscovered.bytes, 26);
  } finally {
    repo.cleanup();
  }
});

test('classifies evidence-not-selected issues deterministically and deduplicates paths', () => {
  const repo = makeRepo({
    'app/test/page.tsx': 'export default function TestPage() { return null }\n',
    '.env.example': 'NEXT_PUBLIC_URL=https://example.com\n',
  });
  const issues = [
    {
      path: 'questions.5',
      issue: 'evidence-not-selected',
      message: 'evidence path is not in the selected sample: app/test/page.tsx',
    },
    {
      path: 'risks.5',
      issue: 'evidence-not-selected',
      message: 'evidence path is not in the selected sample: .env.example',
    },
    {
      path: 'features.0',
      issue: 'evidence-not-selected',
      message: 'evidence path is not in the selected sample: app/test/page.tsx',
    },
  ];

  try {
    const result = classifyEvidenceRecoveryIssues(repo.root, issues, {
      omittedFiles: [
        {
          path: 'app/test/page.tsx',
          bytes: 48,
          reason: 'budget:max-files',
        },
      ],
    });

    assert.equal(result.schema_version, 1);
    assert.deepEqual(result.classifications.map((item) => item.path), ['.env.example', 'app/test/page.tsx']);
    assert.equal(result.classifications[0].classification, RECOVERY_CLASSIFICATION.METADATA_ONLY);
    assert.equal(result.classifications[1].classification, RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE);
    assert.deepEqual(result.classifications[1].issue_paths, ['features.0', 'questions.5']);
    assert.deepEqual(result.summary, {
      metadata_only: 1,
      safe_to_include: 1,
    });
  } finally {
    repo.cleanup();
  }
});

test('extracts evidence path from provider validation issue message', () => {
  assert.equal(extractEvidencePathFromIssue({
    message: 'evidence path is not in the selected sample: eslint.config.mjs',
  }), 'eslint.config.mjs');
  assert.equal(extractEvidencePathFromIssue({ evidence_path: 'src/app.ts' }), 'src/app.ts');
  assert.equal(extractEvidencePathFromIssue({ message: 'other issue' }), '');
});

test('calculates recovery budgets from safe classified evidence only', () => {
  const budget = calculateRecoveryBudget({
    classifications: [
      {
        path: 'src/routes/users.ts',
        classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
        safe_to_include: true,
        selected: false,
        bytes: 20_000,
        effective_prompt_bytes: 20_000,
        omitted_reason: 'budget:max-bytes',
      },
      {
        path: '.env.example',
        classification: RECOVERY_CLASSIFICATION.METADATA_ONLY,
        safe_to_include: false,
        metadata_only: true,
        bytes: 10_000,
        effective_prompt_bytes: 0,
      },
      {
        path: '.env',
        classification: RECOVERY_CLASSIFICATION.SECURITY_EXCLUDED,
        safe_to_include: false,
        bytes: 10_000,
        effective_prompt_bytes: 0,
      },
    ],
  }, {
    budgets: {
      max_files: 80,
      max_bytes: 300_000,
      selected_files: 75,
      selected_bytes: 280_000,
    },
  });

  assert.equal(budget.safe_missing_files, 1);
  assert.equal(budget.safe_missing_bytes, 20_000);
  assert.equal(budget.safety_margin_bytes, 50_000);
  assert.equal(budget.recommended_max_files, 96);
  assert.equal(budget.recommended_max_bytes, 350_000);
  assert.equal(budget.recommendation_type, 'increase_budget');
  assert.equal(budget.exceeds_caps, false);
});

test('never lowers existing budgets and detects category flags from omission reasons', () => {
  const budget = calculateRecoveryBudget({
    classifications: [
      {
        path: 'src/__tests__/users.test.ts',
        classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
        safe_to_include: true,
        selected: false,
        bytes: 2000,
        effective_prompt_bytes: 2000,
        omitted_reason: 'option:tests-disabled',
      },
    ],
  }, {
    budgets: {
      max_files: 120,
      max_bytes: 500_000,
      selected_files: 10,
      selected_bytes: 20_000,
    },
    includeTests: false,
  });

  assert.equal(budget.recommended_max_files, 120);
  assert.equal(budget.recommended_max_bytes, 500_000);
  assert.deepEqual(budget.recommended_flags, ['--include-tests']);
});

test('returns scope-required when recommendation exceeds recovery caps', () => {
  const budget = calculateRecoveryBudget({
    classifications: [
      {
        path: 'src/large.ts',
        classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
        safe_to_include: true,
        selected: false,
        bytes: 600_000,
        effective_prompt_bytes: 600_000,
        omitted_reason: 'budget:max-bytes',
      },
    ],
  }, {
    budgets: {
      max_files: 80,
      max_bytes: 300_000,
      selected_files: 80,
      selected_bytes: 1_000_000,
    },
    caps: {
      maxFiles: 100,
      maxBytes: 1_200_000,
    },
  });

  assert.equal(budget.recommendation_type, 'scope_required');
  assert.equal(budget.exceeds_caps, true);
});

test('builds one-line recovery command preserving relevant flags and dropping transient flags', () => {
  const recommendation = calculateRecoveryBudget({
    classifications: [
      {
        path: 'app/test/page.tsx',
        classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
        safe_to_include: true,
        selected: false,
        bytes: 48,
        effective_prompt_bytes: 48,
        omitted_reason: 'budget:max-files',
      },
    ],
  }, {
    budgets: {
      max_files: 80,
      max_bytes: 300_000,
      selected_files: 80,
      selected_bytes: 299_900,
    },
  });

  const command = buildAnalyzeProjectRecoveryCommand(recommendation, {
    deep: true,
    dryRun: true,
    json: true,
    provider: 'codex',
    model: 'gpt-5.5',
    lang: 'es',
    strict: true,
  });

  assert.equal(command, 'npx --yes create-quiver@latest ai analyze-project --deep --max-files 101 --max-bytes 350000 --provider codex --model gpt-5.5 --lang es --strict');
  assert.equal(command.includes('--dry-run'), false);
  assert.equal(command.includes('--json'), false);
});

test('builds recovery payload with command or safe fallback warning', () => {
  const payload = buildEvidenceRecoveryPayload({
    classifications: [
      {
        path: 'src/large.ts',
        classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
        safe_to_include: true,
        selected: false,
        bytes: 600_000,
        effective_prompt_bytes: 600_000,
        omitted_reason: 'budget:max-bytes',
      },
    ],
    summary: {
      safe_to_include: 1,
    },
  }, {
    budgets: {
      max_files: 80,
      max_bytes: 300_000,
      selected_files: 80,
      selected_bytes: 1_000_000,
    },
    caps: {
      maxFiles: 100,
      maxBytes: 1_200_000,
    },
    deep: true,
    provider: 'codex',
    model: 'gpt-5.5',
  });

  assert.equal(payload.available, false);
  assert.equal(payload.recommendation_type, 'scope_required');
  assert.equal(payload.command, '');
  assert.deepEqual(payload.evidence_summary, { safe_to_include: 1 });
  assert.equal(payload.warnings.length, 1);
});
