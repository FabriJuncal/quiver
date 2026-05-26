const { z } = require('zod');

const CONTEXT_PROPOSAL_SCHEMA_VERSION = 1;
const MAX_DOC_CONTENT_LENGTH = 400_000;

const contextProposalDocSchema = z.object({
  path: z.string().trim().min(1, 'doc path is required'),
  action: z.enum(['create', 'update', 'skip']).default('update'),
  content: z.string().max(MAX_DOC_CONTENT_LENGTH).default(''),
  reason: z.string().trim().max(2_000).default('Planner proposed this documentation update.'),
  assumptions: z.array(z.string().trim().min(1)).default([]),
  risks: z.array(z.string().trim().min(1)).default([]),
});

const contextProposalSchema = z.object({
  schema_version: z.literal(CONTEXT_PROPOSAL_SCHEMA_VERSION).default(CONTEXT_PROPOSAL_SCHEMA_VERSION),
  kind: z.literal('quiver-context-proposal').default('quiver-context-proposal'),
  summary: z.string().trim().max(4_000).default(''),
  assumptions: z.array(z.string().trim().min(1)).default([]),
  risks: z.array(z.string().trim().min(1)).default([]),
  docs: z.array(contextProposalDocSchema).min(1, 'at least one docs update is required'),
  omitted_paths: z.array(z.string().trim().min(1)).default([]),
  next_steps: z.array(z.string().trim().min(1)).default([]),
}).strict();

module.exports = {
  CONTEXT_PROPOSAL_SCHEMA_VERSION,
  MAX_DOC_CONTENT_LENGTH,
  contextProposalDocSchema,
  contextProposalSchema,
};
