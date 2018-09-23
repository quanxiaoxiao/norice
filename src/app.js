const Koa = require('koa');
const Router = require('koa-router');
const http = require('http');
const path = require('path');
const url = require('url');
const webpack = require('webpack');
const devMiddleware = require('./middlewares/webpackDev');
const hotMiddleware = require('./middlewares/webpackHot');
const config$ = require('./config');
const logger = require('./middlewares/logger');

const app = new Koa();

const server = http.createServer(app.callback());

let compiler;
const webpackMiddlewares = [];
let isAddSocketUpgradeEvent = false;

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
  api.forEach(({ method, pathname, handle }) => {
    router[method](pathname, handle);
  });
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

  if (!isAddSocketUpgradeEvent) {
    isAddSocketUpgradeEvent = true;
    server.on('upgrade', (req, socket, head) => {
      const { pathname } = url.parse(req.url);
      const upgrade = api.find(item => item.pathname === pathname
        && item.method === 'GET'
        && item.handleType === 'socket');
      if (upgrade) {
        console.log('socket connection:', socket.remoteAddress);
        upgrade.handle(req, socket, head);
      } else {
        console.log('socket destory:', socket.remoteAddress);
        socket.destroy();
      }
    });
  }
});

module.exports = (port) => {
  server.listen(port, () => {
    console.log(`Listening at port: ${port}`);
  });
};
