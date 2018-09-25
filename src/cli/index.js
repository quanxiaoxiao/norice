const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

module.exports = () => {
  const { argv } = yargs.options({
    port: {
      alias: 'p',
      description: 'Set port',
      default: 3000,
    },
  })
    .version(pkg.version).alias('version', 'v');
  require('../app')(argv.port);

  process.on('uncaughtException', (error) => {
    fs.writeFileSync(path.resolve(process.cwd(), 'error.log'), error.toString());
    const killTimer = setTimeout(() => {
      process.exit(1);
    }, 3000);
    killTimer.unref();
  });
};
