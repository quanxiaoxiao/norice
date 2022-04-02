/* eslint no-use-before-define: 0 */
import http from 'node:http';
import path from 'node:path';
import url from 'node:url';
import Koa from 'koa';
import { pathToRegexp } from 'path-to-regexp';
import fp from 'lodash/fp.js'; // eslint-disable-line import/extensions
/* eslint-disable import/no-unresolved */
import routeHandler from '@quanxiaoxiao/route-handler';
import { webSocketConnect } from '@quanxiaoxiao/about-http';
import apiParser from '@quanxiaoxiao/api-parser';
/* eslint-enable import/no-unresolved */
import devMiddleware from './middlewares/webpackDev.mjs';
import config from './config.mjs';

export default (configFileName, port) => {
  const app = new Koa();
  process.env.port = port;
  const config$ = config(configFileName);

  const server = http.createServer(app.callback());

  let compiler;
  const webpackMiddlewares = [];
  let routeList = [];

  config$.subscribe({
    next: ({
      api,
      middlewares,
      webpackConfig,
      webpack,
    }) => {
      routeList = apiParser(api)
        .map((item) => ({
          ...item,
          regexp: pathToRegexp(item.pathname),
        }));
      console.log('---------routerList---------');
      console.log(routeList.map((item) => `${item.pathname} \`${item.method}\``).join('\n'));
      console.log('---------routerList---------');
      while (app.middleware.length) {
        app.middleware.pop();
      }
      app.use(async (ctx, next) => {
        const { method, originalUrl } = ctx;
        ctx.logger = {
          error: console.error,
          info: console.log,
        };
        const start = Date.now();
        const { ip } = ctx;
        function handleClose() {
          ctx.logger.info(`${ctx.path} \`${ctx.method}\` x-> ${ip}`);
          ctx.res.off('finish', handleFinish);
        }

        function handleFinish() {
          ctx.logger.info(`${ctx.path} \`${ctx.method}\` -> ${ip} ${Date.now() - start}ms`);
          ctx.res.off('close', handleClose);
        }

        ctx.res.once('close', handleClose);
        ctx.res.once('finish', handleFinish);
        try {
          await next();
        } catch (error) {
          console.error(`${originalUrl} \`${method}\` ${error.message}`);
          ctx.res.off('close', handleClose);
          ctx.res.off('finish', handleFinish);
          throw error;
        }
      });

      middlewares.forEach((middleware) => {
        app.use(middleware);
      });

      app.use(async (ctx, next) => {
        const routerItem = routeList
          .find((item) => item.regexp.exec(ctx.path) && item.method === ctx.method);
        if (!routerItem) {
          const list = routeList.filter((item) => item.regexp.exec(ctx.path));
          if (list.length !== 0) {
            if (ctx.method === 'OPTIONS') {
              ctx.status = 204;
              ctx.set(
                'Access-Control-Allow-Methods',
                ['OPTIONS', ...list.map((item) => item.method)].join(','),
              );
              ctx.body = null;
            } else {
              ctx.throw(405);
            }
          } else if (ctx.method === 'GET') { // webpack output index.html
            await next();
          }
        } else {
          const handleName = fp.compose(
            fp.first,
            fp.filter((key) => !['method', 'pathname', 'regexp'].includes(key)),
            fp.keys,
          )(routerItem);
          if (!handleName) {
            console.error(`${ctx.path} \`${ctx.method}\` [[${routerItem.pathname}]] handler is not exist`);
            ctx.throw(500);
          }
          const handler = routeHandler[handleName];
          if (!handler) {
            console.error(`${ctx.path} \`${ctx.method}\` [[${routerItem.pathname}]] handler @${handleName} is not register`);
            ctx.throw(500);
          }
          console.log(`${ctx.path} \`${ctx.method}\` [[${routerItem.pathname}]] @${handleName}`);
          ctx.matchs = routerItem.regexp.exec(ctx.path);
          await handler(routerItem[handleName])(ctx, next);
        }
      });

      if (webpackConfig) {
        if (!compiler) {
          compiler = webpack(webpackConfig);
          webpackMiddlewares.push(devMiddleware(compiler, {
            publicPath: webpackConfig.output.publicPath || '/',
            hot: true,
          }));
          webpackMiddlewares.push(async (ctx) => {
            if (ctx.method === 'GET') {
              const indexHtml = await new Promise((resolve, reject) => {
                compiler.outputFileSystem.readFile(path.resolve(webpackConfig.output.path, 'index.html'), (err, indexHtmlTemplate) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(indexHtmlTemplate);
                  }
                });
              });
              ctx.type = 'text/html';
              ctx.body = indexHtml;
            } else {
              ctx.throw(404);
            }
          });
        }
        webpackMiddlewares.forEach((middleware) => {
          app.use(middleware);
        });
      }
    },
  });

  server.on('error', (error) => {
    console.error(error);
  });

  server.on('upgrade', (request, socket) => {
    const { pathname, search } = url.parse(request.url);
    const routerItem = routeList
      .find((item) => item.regexp.exec(pathname) && item.method === 'GET' && item.proxy);
    if (!routerItem) {
      socket.destroy();
    } else {
      const options = typeof routerItem.proxy === 'function'
        ? routerItem.proxy(request)
        : {
          url: routerItem.proxy,
        };
      if (typeof options.url !== 'string' || !/^wss?:\/\//.test(options.url)) {
        socket.destroy();
      } else {
        if (typeof routerItem.proxy === 'string' && !/^wss?:\/\/[^/]+\//.test(options.url)) {
          options.url = `${options.url}${pathname}${search || ''}`;
        }

        webSocketConnect(
          {
            ...options,
            logger: {
              error: console.error,
              info: console.log,
            },
          },
          request,
          socket,
        );
      }
    }
  });

  server.listen(port, () => {
    console.log(`Listening at port: ${port}`);
  });

  process.on('uncaughtException', (error) => {
    console.error(error.stack);
    const killTimer = setTimeout(() => {
      process.exit(1);
    }, 3000);
    killTimer.unref();
  });
};
