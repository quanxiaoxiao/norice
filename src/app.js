const Koa = require('koa');
const Router = require('koa-router');
const http = require('http');
const url = require('url');
const path = require('path');
const webpack = require('webpack');
const devMiddleware = require('./middlewares/webpackDev');
const hotMiddleware = require('./middlewares/webpackHot');
const config$ = require('./config');
const logger = require('./middlewares/logger');

const app = new Koa();

const server = http.createServer(app.callback());

let compiler;
const webpackMiddlewares = [];

let wsRouteList = [];

config$.subscribe(({ api, middlewares, webpack: webpackConfig }) => {
  while (app.middleware.length) {
    app.middleware.pop();
  }
  app.use(logger);
  middlewares.forEach((middleware) => {
    app.use(middleware);
  });
  const router = new Router();

  app.use(router.routes());
  app.use(router.allowedMethods());

  api
    .filter(item => !/^ws/.test(item.handleType))
    .forEach(({ method, pathname, handle }) => {
      router[method.toLowerCase()](pathname, handle);
    });

  wsRouteList = api.filter(item => /^ws/.test(item.handleType));

  router.get('/apis', (ctx) => {
    ctx.body = api.map(item => ({
      pathname: item.pathname,
      method: item.method,
    }));
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
      });
    }
    webpackMiddlewares.forEach((middleware) => {
      app.use(middleware);
    });
  }
});

server.on('upgrade', (req, socket) => {
  const { pathname } = url.parse(req.url);
  const upgrade = wsRouteList.find(item => item.pathname === pathname);
  if (upgrade) {
    upgrade.handle(req, socket, server);
  } else {
    socket.destroy();
  }
});

server.on('error', (error) => {
  console.error(error);
});

module.exports = (port) => {
  server.listen(port, () => {
    console.log(`Listening at port: ${port}`);
  });
};
