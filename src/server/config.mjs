import path from 'node:path';
import { Module, createRequire } from 'node:module';
import { readFile, statSync } from 'node:fs';
import {
  bindNodeCallback,
  Subject,
} from 'rxjs';
import {
  tap,
  debounceTime,
  map,
  switchMap,
  scan,
  retryWhen,
  share,
} from 'rxjs/operators';
import watch from 'node-watch';

const require = createRequire(import.meta.url);

export default (configFileName) => {
  const configDir = process.cwd();
  const configPathName = path.join(configDir, configFileName);

  try {
    const stats = statSync(configPathName);
    if (!stats.isFile()) {
      throw new Error('config is not file');
    }
  } catch (error) {
    console.error(`config \`${configPathName}\` not fout`);
    process.exit(1);
  }

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
      switchMap(() => bindNodeCallback(readFile)(configFileName, 'utf-8')),
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
