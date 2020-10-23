const Koa = require('koa');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { pathToRegexp } = require('path-to-regexp');
const cors = require('@koa/cors');
const fp = require('lodash/fp');
const routeHandler = require('@quanxiaoxiao/route-handler');
const apiParser = require('@quanxiaoxiao/api-parser');
const devMiddleware = require('./middlewares/webpackDev');
const hotMiddleware = require('./middlewares/webpackHot');
const config = require('./config');

module.exports = (configFileName, port) => {
  const app = new Koa();
  process.env.port = port;
  const config$ = config(configFileName);

  const server = http.createServer(app.callback());

  let compiler;
  const webpackMiddlewares = [];

  config$.subscribe({
    next: ({
      api,
      middlewares,
      webpackConfig,
      webpack,
    }) => {
      const routeList = apiParser(api)
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
        try {
          const start = Date.now();
          const { ip } = ctx;
          await next();
          console.log(`${ctx.path} \`${ctx.method}\` ${ctx.status} -> ${ip} ::${Date.now() - start}ms`);
        } catch (error) {
          console.error(`${originalUrl} \`${method}\` ${error.message}`);
          throw error;
        }
      });
      app.use(cors());
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
              return;
            }
            ctx.throw(405);
          }
          if (ctx.method === 'GET') {
            await next();
            return;
          }
          ctx.throw(404);
        }
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
      });

      if (webpackConfig) {
        if (!compiler) {
          compiler = webpack(webpackConfig);
          webpackMiddlewares.push(devMiddleware(compiler, {
            publicPath: webpackConfig.output.publicPath,
            hot: true,
          }));
          webpackMiddlewares.push(hotMiddleware(compiler));
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
  server.listen(port, () => {
    console.log(`Listening at port: ${port}`);
  });

  process.on('uncaughtException', (error) => {
    fs.writeFileSync(path.resolve(process.cwd(), 'error.log'), error.message);
    console.error(error.stack);
    const killTimer = setTimeout(() => {
      process.exit(1);
    }, 3000);
    killTimer.unref();
  });
};
