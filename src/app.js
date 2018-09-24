const Koa = require('koa');
const Router = require('koa-router');
const http = require('http');
const path = require('path');
const webpack = require('webpack');
const devMiddleware = require('./middlewares/webpackDev');
const hotMiddleware = require('./middlewares/webpackHot');
const config$ = require('./config');
const createHttpHeader = require('./utils/createHttpHeader');
const logger = require('./middlewares/logger');

const app = new Koa();

const server = http.createServer(app.callback());

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

server.on('upgrade', (req, socket) => {
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/socket',
    headers: req.headers,
  });
  proxyReq.once('response', (res) => {
    if (!res.upgrade) {
      res.pipe(socket);
      socket.destroy();
    }
  });
  proxyReq.once('upgrade', (proxyRes, proxySocket) => {
    socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);

    socket.once('error', () => {
      proxyReq.end();
    });

    proxySocket.once('error', () => {
      socket.end();
    });
  });

  proxyReq.once('error', () => {
    socket.end();
  });
  proxyReq.end();
});

module.exports = (port) => {
  server.listen(port, () => {
    console.log(`Listening at port: ${port}`);
  });
};
