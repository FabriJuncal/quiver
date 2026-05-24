const { runAnalyze } = require('../index');

function analyzeProject(targetDir, options = {}) {
  return runAnalyze(targetDir, options);
}

module.exports = {
  analyzeProject,
};
