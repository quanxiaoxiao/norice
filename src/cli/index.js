const yargs = require('yargs');
const run = require('./run');
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

  run(argv);
};
