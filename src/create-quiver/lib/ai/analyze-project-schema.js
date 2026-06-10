const { z } = require('zod');

const ANALYZE_PROJECT_SCHEMA_VERSION = 1;
const ANALYZE_PROJECT_KIND = 'quiver-project-analysis';
const MAX_ANALYZE_DOC_UPDATE_LENGTH = 400_000;
const CONFIDENCE_LEVELS = ['confirmed', 'inferred', 'unknown', 'conflict'];
const ALLOWED_ANALYZE_DOC_UPDATE_PATHS = [
  'docs/CONTEXTO.md',
  'docs/AI_CONTEXT.md',
  'docs/ARCHITECTURE.md',
  'docs/STATUS.md',
  'docs/DECISIONS.md',
  'docs/PROJECT_MAP.md',
];

const confidenceSchema = z.enum(CONFIDENCE_LEVELS);
const evidencePathSchema = z.string().trim().min(1, 'evidence path is required');

const evidenceClaimSchema = z.object({
  claim: z.string().trim().min(1, 'claim is required').max(4_000),
  confidence: confidenceSchema,
  evidence: z.array(evidencePathSchema).default([]),
  notes: z.string().trim().max(2_000).default(''),
}).strict();

const namedFindingSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(500),
  summary: z.string().trim().max(4_000).default(''),
  confidence: confidenceSchema.default('unknown'),
  evidence: z.array(evidencePathSchema).default([]),
}).strict();

const productSchema = z.object({
  name: namedFindingSchema.optional(),
  type: namedFindingSchema.optional(),
  summary: z.string().trim().max(4_000).default(''),
  claims: z.array(evidenceClaimSchema).default([]),
}).strict().default({});

const domainSchema = z.object({
  roles: z.array(namedFindingSchema).default([]),
  entities: z.array(namedFindingSchema).default([]),
  actions: z.array(namedFindingSchema).default([]),
  flows: z.array(namedFindingSchema).default([]),
  incomplete_or_suspicious: z.array(namedFindingSchema).default([]),
  claims: z.array(evidenceClaimSchema).default([]),
}).strict().default({});

const architectureSchema = z.object({
  frontend: z.array(namedFindingSchema).default([]),
  backend: z.array(namedFindingSchema).default([]),
  auth: z.array(namedFindingSchema).default([]),
  persistence: z.array(namedFindingSchema).default([]),
  integrations: z.array(namedFindingSchema).default([]),
  state: z.array(namedFindingSchema).default([]),
  api: z.array(namedFindingSchema).default([]),
  testing: z.array(namedFindingSchema).default([]),
  deploy: z.array(namedFindingSchema).default([]),
  risks: z.array(namedFindingSchema).default([]),
  claims: z.array(evidenceClaimSchema).default([]),
}).strict().default({});

const questionSchema = z.object({
  question: z.string().trim().min(1, 'question is required').max(2_000),
  reason: z.string().trim().max(2_000).default(''),
  evidence: z.array(evidencePathSchema).default([]),
}).strict();

const analyzeProjectSchema = z.object({
  schema_version: z.literal(ANALYZE_PROJECT_SCHEMA_VERSION).default(ANALYZE_PROJECT_SCHEMA_VERSION),
  kind: z.literal(ANALYZE_PROJECT_KIND).default(ANALYZE_PROJECT_KIND),
  product: productSchema,
  domain: domainSchema,
  architecture: architectureSchema,
  features: z.array(namedFindingSchema).default([]),
  risks: z.array(namedFindingSchema).default([]),
  questions: z.array(questionSchema).default([]),
  claims: z.array(evidenceClaimSchema).default([]),
  doc_updates: z.record(z.string().trim().min(1), z.string().max(MAX_ANALYZE_DOC_UPDATE_LENGTH)).default({}),
}).strict();

module.exports = {
  ALLOWED_ANALYZE_DOC_UPDATE_PATHS,
  ANALYZE_PROJECT_KIND,
  ANALYZE_PROJECT_SCHEMA_VERSION,
  CONFIDENCE_LEVELS,
  MAX_ANALYZE_DOC_UPDATE_LENGTH,
  analyzeProjectSchema,
  confidenceSchema,
  evidenceClaimSchema,
  namedFindingSchema,
};
