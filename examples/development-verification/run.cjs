const { reviewDemo } = require('./host.cjs');
async function main() {
  if (process.argv.length !== 3 || !['search', 'wrong'].includes(process.argv[2])) {
    throw new Error('Usage: node examples/development-verification/run.cjs search|wrong');
  }
  const session = reviewDemo({ variant: process.argv[2] });
  // Fixture consent for authored code only; never a production approval service.
  const result = await session.execute((review) => ({ approved: true, binding: review.binding, approval_id: 'explicit-authored-demo' }));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.evidence.status === 'passed' ? 0 : 1;
  // Keep returned temporary evidence for inspection. The source remains unchanged.
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
