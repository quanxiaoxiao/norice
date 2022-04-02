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

module.exports = (configFileName) => {
  const configDir = process.cwd();
  const configPathName = path.join(configDir, configFileName);
  const subject = new Subject().pipe(share());

  watch(configPathName, { recursive: false })
    .on('change', () => {
      subject.next();
    });

  setTimeout(() => {
    subject.next();
  }, 200);

  return subject
    .pipe(
      tap(() => {
        console.log('generate api ...');
      }),
      debounceTime(1200),
      switchMap(() => bindNodeCallback(fs.readFile)(configFileName, 'utf-8')),
      scan((prevConfigModule, script) => {
        if (prevConfigModule) {
          prevConfigModule.children.forEach((item) => {
            if (!/^webpack\./.test(path.basename(item.filename))) {
              delete require.cache[item.id];
            }
          });
          delete require.cache[prevConfigModule.id];
        }
        const newConfigModule = new Module(configPathName, null);
        newConfigModule.paths = Module._nodeModulePaths(configDir);
        if (!newConfigModule.filename) {
          newConfigModule.filename = configPathName;
        }
        newConfigModule._compile(script, configPathName);
        return newConfigModule;
      }, null),
      map((mod) => {
        const {
          exports: {
            api = {},
            middlewares = [],
            webpackDev,
          },
        } = mod;
        if (webpackDev) {
          return {
            webpack: mod.require('webpack'),
            middlewares,
            webpackConfig: webpackDev,
            api,
          };
        }
        return {
          middlewares,
          api,
        };
      }),
      retryWhen((errors) => errors.pipe(
        tap((error) => {
          console.error(error);
        }),
      )),
    );
};
