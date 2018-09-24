const path = require('path');
const {
  Subject,
  bindNodeCallback,
} = require('rxjs');
const { Module } = require('module');
const fs = require('fs');
const {
  tap,
  debounceTime,
  map,
  catchError,
  switchMap,
} = require('rxjs/operators');
const watch = require('node-watch');
const chalk = require('chalk');
const apiParser = require('./apiParser');

const configFile = 'norice.config.js';
const configDir = process.cwd();
const configPath = path.join(configDir, configFile);
const configWatch = watch(configPath);
const subject = new Subject();

let prevModule;

module.exports = subject
  .pipe(
    tap(() => {
      if (prevModule) {
        prevModule.children.forEach((item) => {
          if (!/^webpack\./.test(path.basename(item.filename))) {
            delete require.cache[item.id];
          }
        });
        delete require.cache[prevModule.id];
      }
      console.log('generate api ...');
    }),
    debounceTime(2000),
    switchMap(() => bindNodeCallback(fs.readFile)(configPath, 'utf-8')),
    map((script) => {
      const mod = new Module(configPath, null);
      mod.paths = Module._nodeModulePaths(configDir);
      if (!mod.filename) {
        mod.filename = configPath;
      }
      mod._compile(script, configPath);
      prevModule = mod;
      return mod.exports;
    }),
    map(({ api = {}, middlewares = [], webpack }) => ({
      middlewares,
      webpack,
      api: apiParser(api),
    })),
    tap(({ api }) => {
      console.log('generate api list ---------------------------');
      const info = api.map(item => `${chalk.gray('pathname:')} ${item.pathname}, `
        + `${chalk.gray('method:')} ${chalk.bold(item.method.toUpperCase())}, `
        + `${chalk.gray('type:')} ${item.type}`)
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
