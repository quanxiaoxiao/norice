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
const logger = require('./middlewares/logger');


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
      console.log(routeList.map((item) => `${item.method} ${item.pathname}`).join('\n'));
      console.log('---------routerList---------');
      while (app.middleware.length) {
        app.middleware.pop();
      }
      app.use(logger);
      app.use(cors());
      middlewares.forEach((middleware) => {
        app.use(middleware);
      });

      app.use(async (ctx, next) => {
        const routerItem = routeList.find((item) => item.method === ctx.method
          && item.regexp.exec(ctx.path));
        if (!routerItem) {
          await next();
          return;
        }
        ctx.matchs = routerItem.regexp.exec(ctx.path);
        const handleName = fp.compose(
          fp.filter((key) => !['method', 'pathname', 'regexp'].includes(key)),
          fp.keys,
        )(routerItem);
        if (!handleName) {
          console.error(`pathname: ${routerItem.pathname} cant handle`);
          ctx.throw(500);
        }
        await routeHandler[handleName](routerItem[handleName])(ctx, next);
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
