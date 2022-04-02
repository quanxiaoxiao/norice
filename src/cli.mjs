import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import run from './server/run.mjs';

const pkg = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf-8'));

const { argv } = yargs(hideBin(process.argv))
  .options({
    config: {
      alias: 'c',
      description: 'config file name default is norice.config.js',
      default: 'norice.config.js',
      type: 'string',
    },
    port: {
      alias: 'p',
      description: 'listen port default is 3000',
      type: 'number',
      default: 3000,
    },
  })
  .version(pkg.version)
  .alias('version', 'v');

if (argv.port < 1 || argv.port > 65535) {
  console.error(`port \`${argv.port}\` invalid`);
  process.exit(1);
}

run(argv.config, argv.port);
