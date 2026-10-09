const fs = require('node:fs');

// Keep the real security-boundary test. Never silently skip it when Windows
// refuses a file symlink; report the missing capability as a test failure.
function requiredSymlink(target, link, type) {
  try {
    fs.symlinkSync(target, link, type);
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      error.message += '\nThis test requires real Windows symlink privileges. Run in an authorized symlink-capable environment; do not replace the link with a copy or skip the assertion.';
    }
    throw error;
  }
}

module.exports = { requiredSymlink };
