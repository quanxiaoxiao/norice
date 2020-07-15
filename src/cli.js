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
    (y) => y.option('port', {
      alias: 'p',
      description: 'listen port default is 3000',
      type: 'number',
      default: 3000,
    }),
    (argv) => {
      require('./actions/server')(argv.config, argv.port);
    },
  )
  .command(
    'deploy',
    'deploy static file to server',
    {
      message: {
        alias: 'm',
        default: '',
        type: 'string',
      },
      tag: {
        alias: 't',
        type: 'string',
      },
      dir: {
        alias: 'd',
        type: 'string',
      },
    },
    (argv) => {
      if (argv.dir) {
        require('./actions/deployByDir')(argv.config, argv.dir, argv.message, argv.tag);
      } else {
        require('./actions/deploy')(argv.config, argv.message, argv.tag);
      }
    },
  )
  .command(
    'resource',
    'resource operation [action](show|select|fetch)',
    {},
    (argv) => {
      const [, action, name] = argv._;
      if (action === 'show') {
        if (name) {
          require('./actions/resources/printResource')(argv.config, name);
        } else {
          require('./actions/resources/printResources')(argv.config);
        }
      } else if (action === 'select' && name) {
        require('./actions/resources/selectResource')(argv.config, name);
      } else if (action === 'fetch') {
        require('./actions/resources/fetchResource')(argv.config, name);
      }
    },
  )
  .version(pkg.version)
  .alias('version', 'v')
  .argv;
