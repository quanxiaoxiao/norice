const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

module.exports = () => {
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
        require('../app')(argv.config, argv.port);
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
      },
      (argv) => {
        require('../actions/deploy')(argv.config, argv.message, argv.tag);
      },
    )
    .command(
      'resource',
      'resource operation [action](count|prev|list|last|select)',
      {
        message: {
          alias: 'm',
          type: 'string',
          description: 'display resources from message',
        },
        tag: {
          alias: 't',
          type: 'string',
          description: 'display resources from tag',
        },
        resource: {
          alias: 'r',
          type: 'string',
          description: 'set current resource by id',
        },
      },
      (argv) => {
        const [, action] = argv._;
        const map = {
          prev: (config) => require('../actions/resourcePrev')(config),
          last: (config) => require('../actions/resourceLast')(config),
          list: (config) => require('../actions/resources')(config),
          count: (config) => require('../actions/resourceCount')(config),
        };
        if (['prev', 'last', 'list', 'count'].includes(action)) {
          map[action](argv.config);
        } else if (!action) {
          if (argv.resource) {
            require('../actions/resourceSelect')(argv.config, argv.resource);
          } else if (argv.message || argv.tag) {
            require('../actions/resourceSearch')(argv.config, argv.message, argv.tag);
          } else {
            require('../actions/resourceCurrent')(argv.config);
          }
        }
      },
    )
    .version(pkg.version)
    .alias('version', 'v')
    .argv;

  process.on('uncaughtException', (error) => {
    fs.writeFileSync(path.resolve(process.cwd(), 'error.log'), error.message);
    console.error(error.stack);
    const killTimer = setTimeout(() => {
      process.exit(1);
    }, 3000);
    killTimer.unref();
  });
};
