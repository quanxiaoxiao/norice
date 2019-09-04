const path = require('path');
const {
  bindNodeCallback,
  Subject,
} = require('rxjs');
const { Module } = require('module');
const fs = require('fs');
const {
  tap,
  debounceTime,
  map,
  switchMap,
  scan,
  retryWhen,
  share,
} = require('rxjs/operators');
const watch = require('node-watch');
const chalk = require('chalk');
const apiParser = require('./apiParser');

const configFile = 'norice.config.js';
const configDir = process.cwd();
const configPath = path.join(configDir, configFile);

const subject = new Subject().pipe(share());

watch(configPath)
  .on('change', () => {
    subject.next();
  });

module.exports = subject
  .pipe(
    tap(() => {
      console.log('generate api ...');
    }),
    debounceTime(1200),
    switchMap(() => bindNodeCallback(fs.readFile)(configPath, 'utf-8')),
    scan((prevConfigModule, script) => {
      if (prevConfigModule) {
        prevConfigModule.children.forEach((item) => {
          if (!/^webpack\./.test(path.basename(item.filename))) {
            delete require.cache[item.id];
          }
        });
        delete require.cache[prevConfigModule.id];
      }
      const newConfigModule = new Module(configPath, null);
      newConfigModule.paths = Module._nodeModulePaths(configDir);
      if (!newConfigModule.filename) {
        newConfigModule.filename = configPath;
      }
      newConfigModule._compile(script, configPath);
      return newConfigModule;
    }, null),
    map(configModule => configModule.exports),
    map(({ api = {}, middlewares = [], webpackDev: webpack }) => ({
      middlewares,
      webpack,
      api: apiParser(api),
    })),
    tap(({ api }) => {
      console.log('generate api list ---------------------------');
      const info = api.map(item => `${chalk.gray('pathname:')} ${item.pathname}, `
        + `${chalk.gray('method:')} ${chalk.bold(item.method.toUpperCase())}, `
        + `${chalk.gray('type:')} ${item.handlerName}`)
        .join('\n');
      console.log(info);
      console.log('---------------------------------------------');
    }),
    retryWhen(errors => errors.pipe(
      tap((error) => {
        console.error(error);
      }),
    )),
  );

setTimeout(() => {
  subject.next();
}, 200);
