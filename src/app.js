const Koa = require('koa');
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

config$.subscribe({
  next: ({ api, middlewares, webpack: webpackConfig }) => {
    while (app.middleware.length) {
      app.middleware.pop();
    }
    app.use(logger);
    middlewares.forEach((middleware) => {
      app.use(middleware);
    });

    app.use(async (ctx, next) => {
      const routerItem = api.find(item => item.method === ctx.method
        && item.handlerName !== 'wsProxy'
        && item.regexp.exec(ctx.path));
      if (!routerItem) {
        await next();
        return;
      }
      ctx.matchs = routerItem.regexp.exec(ctx.path);
      await routerItem.handler(ctx, next);
    });

    wsRouteList = api.filter(item => item.handlerName === 'wsProxy');

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
  },
});

server.on('upgrade', (req, socket) => {
  const { pathname } = url.parse(req.url);
  const upgrade = wsRouteList.find(item => item.handlerName === 'wsProxy'
    && item.method === 'GET'
    && item.regexp.exec(pathname));
  if (upgrade) {
    console.log('websocket connection:', socket.remoteAddress);
    upgrade.handler(req, socket, server);
  } else {
    console.log('websocket deny:', socket.remoteAddress);
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
