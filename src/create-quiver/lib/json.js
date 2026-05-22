function stripJsonComments(text) {
  const input = String(text || '');
  let output = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < input.length && input[index] !== '\n') {
        index += 1;
      }
      if (index < input.length) {
        output += '\n';
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) {
        if (input[index] === '\n') {
          output += '\n';
        }
        index += 1;
      }
      index += 1;
      continue;
    }

    output += char;
  }

  return output;
}

function parseJsonWithComments(text) {
  return JSON.parse(stripJsonComments(text));
}

module.exports = {
  parseJsonWithComments,
  stripJsonComments,
};
