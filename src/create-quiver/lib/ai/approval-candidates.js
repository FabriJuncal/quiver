const { buildPlannerApprovalCandidates } = require('../approvals');
const { buildTechnicalPlanApprovalCandidates } = require('./plan-review');

function buildApprovalCandidateReport(projectRoot, phase) {
  return phase === 'technical-plan'
    ? buildTechnicalPlanApprovalCandidates(projectRoot)
    : buildPlannerApprovalCandidates(projectRoot, phase);
}

function formatReviewSummary(review) {
  if (!review || !review.recommendation) {
    return '';
  }

  const parts = [`review=${review.recommendation}`];
  if (review.blocking) {
    parts.push('blocking');
  }
  if (review.required_fixes_count) {
    parts.push(`required fixes=${review.required_fixes_count}`);
  }
  if (review.optional_hardening_count) {
    parts.push(`optional=${review.optional_hardening_count}`);
  }
  if (review.risks_count) {
    parts.push(`risks=${review.risks_count}`);
  }
  return parts.join(', ');
}

function formatCandidateSummary(candidate) {
  if (!candidate) {
    return '';
  }

  const parts = [
    candidate.label,
    candidate.current ? 'current' : 'history',
    candidate.approvable ? 'approvable' : 'blocked',
    candidate.reason,
    formatReviewSummary(candidate.review),
  ].filter(Boolean);
  return parts.join(', ');
}

function approvalCandidateCommand(report, fallback = 'npx create-quiver ai approvals') {
  if (report?.recommended?.next_command) {
    return report.recommended.next_command;
  }
  if (report?.current?.next_command) {
    return report.current.next_command;
  }
  return report?.next_command || fallback;
}

function formatApprovalDecisionLines(report) {
  const lines = [];
  if (!report || !Array.isArray(report.candidates)) {
    return lines;
  }

  lines.push(`Candidates: ${report.candidates.length}`);
  if (report.latest_version) {
    lines.push(`Latest draft: v${report.latest_version}`);
  }
  if (report.current) {
    lines.push(`Current candidate: ${formatCandidateSummary(report.current)}`);
  }
  if (report.recommended) {
    lines.push(`Recommended approval: ${report.recommended.next_command}`);
  } else if (report.next_command) {
    lines.push(`Recommended next command: ${report.next_command}`);
  }
  if (report.review?.status) {
    lines.push(`Review status: ${report.review.status}`);
  }
  return lines;
}

module.exports = {
  approvalCandidateCommand,
  buildApprovalCandidateReport,
  formatApprovalDecisionLines,
  formatCandidateSummary,
  formatReviewSummary,
};
