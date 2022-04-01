const yargs = require('yargs');
const pkg = require('../package.json');

yargs // eslint-disable-line
  .option('config', {
    alias: 'c',
    description: 'config file name default is norice.config.js',
    default: 'norice.config.js',
    type: 'string',
  })
  .command(
    'server',
    'startup http server',
    (_) => _.option('port', {
      alias: 'p',
      description: 'listen port default is 3000',
      type: 'number',
      default: 3000,
    }),
    (argv) => {
      require('./server')(argv.config, argv.port);
    },
  )
  .version(pkg.version)
  .alias('version', 'v')
  .argv;
