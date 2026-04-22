const { runDoctor } = require('../index');

function doctorProject(targetDir) {
  return runDoctor(targetDir);
}

module.exports = {
  doctorProject,
};
