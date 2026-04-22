const { runAnalyze } = require('../index');

function analyzeProject(targetDir) {
  return runAnalyze(targetDir);
}

module.exports = {
  analyzeProject,
};
