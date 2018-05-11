const path = require('path');
const { Subject } = require('rxjs');
const {
  tap,
  debounceTime,
  map,
  catchError,
} = require('rxjs/operators');
const _ = require('lodash');
const watch = require('node-watch');
const chalk = require('chalk');
const { isSubset } = require('./set');
const handler = require('./handle');
const fs = require('fs');
const vm = require('vm');

const configFile = 'norice.config.js';
const configDir = process.cwd();

const configPath = path.join(configDir, configFile);

const configWatch = watch(configPath);

const subject = new Subject();

const METHODS = ['get', 'post', 'delete', 'put', 'patch'];


module.exports = subject
  .pipe(
    tap(() => console.log('generate api ...')),
    debounceTime(2000),
    map(() => {
      const cfg = fs.readFileSync(configPath, 'utf-8');
      return new vm.Script(cfg, {
        filename: 'norice.config.js',
        displayErrors: true,
      });
    }),
    map((script) => {
      const _module = Object.create(module);
      _module.exports = null;
      _module.paths.unshift(path.resolve(configDir, 'node_modules'));
      script.runInNewContext({
        module: _module,
        require: _module.require,
        __dirname: process.cwd(),
        __filename: configPath,
        console,
      });
      if (!_module.exports) {
        throw new Error('Error reading configuration: `module.exports` not set');
      }
      return _module.exports;
    }),
    map(({ api = {}, middlewares = [], webpack }) => ({
      middlewares,
      webpack,
      api: Object.entries(api)
        .filter(([pathname, value]) => {
          if (!/^\/.*/.test(pathname) || !_.isPlainObject(value) || _.isEmpty(pathname)) {
            console.error(chalk.red(`pathname: ${pathname} invalid`));
            return false;
          }
          return true;
        })
        .reduce((acc, [pathname, value]) => {
          if (isSubset(new Set(Object.keys(value)), new Set(METHODS))) {
            return [...acc, ...Object.entries(value).map(([method, handle]) => ({
              pathname,
              method,
              handle,
            }))];
          }
          return [...acc, {
            pathname,
            method: 'get',
            handle: value,
          }];
        }, [])
        .map((item) => {
          const [type, handle] = Object.entries(item.handle)[0];
          if (!handler[type]) {
            console.error(chalk.red(`${item.pathname}: handle invalid`));
            return null;
          }
          return {
            ...item,
            type,
            handle: handler[type](handle),
          };
        })
        .filter(item => item),
    })),
    tap(({ api }) => {
      console.log('generate api list ---------------------------');
      const info = api.map(item =>
        `${chalk.gray('pathname:')} ${item.pathname}, ` +
        `${chalk.gray('method:')} ${chalk.bold(item.method.toUpperCase())}, ` +
        `${chalk.gray('type:')} ${item.type}`)
        .join('\n');
      console.log(info);
      console.log('---------------------------------------------');
    }),
    catchError((error, source$) => {
      console.log(error);
      return source$;
    }),
  );


configWatch.on('change', () => {
  subject.next();
});

setTimeout(() => {
  subject.next();
}, 200);

