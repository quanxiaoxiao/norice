const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

module.exports = () => {
  yargs // eslint-disable-line
    .command(
      'server',
      'startup http server',
      y => y.option('port', {
        alias: 'p',
        description: 'listen port default is 3000',
        default: 3000,
      }),
      (argv) => {
        require('../app')(argv.port);
      },
    )
    .options({
      port: {
        alias: 'p',
        description: 'Set port',
        default: 3000,
      },
    })
    .command(
      'deploy',
      'deploy static file to server',
      {
        config: {
          alias: 'c',
          description: 'config file path default is norice.config.js',
          default: 'norice.config.js',
        },
        message: {
          alias: 'm',
          default: '',
        },
        tag: {
          alias: 't',
        },
      },
      (argv) => {
        require('../deploy')(argv.config, argv.message, argv.tag);
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
