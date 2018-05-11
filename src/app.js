const Koa = require('koa');
const Router = require('koa-router');
const path = require('path');
const webpack = require('webpack');
const devMiddleware = require('./middlewares/webpackDev');
const hotMiddleware = require('./middlewares/webpackHot');
const config$ = require('./config');
const logger = require('./middlewares/logger');

const app = new Koa();


let compiler;
const webpackMiddlewares = [];

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
});

module.exports = app;
