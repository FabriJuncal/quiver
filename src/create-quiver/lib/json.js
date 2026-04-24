function stripJsonComments(text) {
  return String(text || '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseJsonWithComments(text) {
  return JSON.parse(stripJsonComments(text));
}

module.exports = {
  parseJsonWithComments,
  stripJsonComments,
};
