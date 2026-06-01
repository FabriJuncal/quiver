const lifecycle = require('./ai/lifecycle');
const planner = require('./ai/planner');
const agents = require('./ai/agents');
const execution = require('./ai/execution');
const inspection = require('./ai/inspection');
const diagnostics = require('./ai/diagnostics');

module.exports = {
  ...lifecycle,
  ...planner,
  ...agents,
  ...execution,
  ...inspection,
  ...diagnostics,
};
