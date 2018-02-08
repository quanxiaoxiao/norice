const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const compression = require('compression');
const { getWebpack, getMiddlewares } = require('../config');

const Router = require('./router');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const webpackMiddleware = require('./middlewares/webpackMiddleware');

module.exports = () => {
  const app = express();
  const server = new http.Server(app);

  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(loggerMiddleware);
  app.use(compression());
  const middlewares = getMiddlewares();
  if (middlewares) {
    middlewares.forEach((middleware) => {
      if (Array.isArray(middleware)) {
        app.use(...middleware);
      } else {
        app.use(middleware);
      }
    });
  }
  const wss = require('./webSocket')(server);

  app.post('/socket', (req, res) => {
    const chucks = [];
    req.on('data', (chuck) => {
      chucks.push(chuck);
    });
    req.on('end', () => {
      const msg = Buffer.concat(chucks).toString('utf-8');
      wss.emit('broadcast', msg);
      res.status(204);
      res.set('Content-Length', '0');
      res.end();
    });
  });

  app.use(Router());

  const webpackPath = getWebpack();
  if (webpackPath) {
    app.use(webpackMiddleware(webpackPath));
  }

  server.on('error', (error) => {
    console.error('server error', error);
  });

  return server;
};
