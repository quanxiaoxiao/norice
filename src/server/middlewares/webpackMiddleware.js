const webpack = require('webpack');
const path = require('path');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

function webpackMiddleware(webpackFilePath) {
  const webpackConfig = require(webpackFilePath); // eslint-disable-line
  const compiler = webpack(webpackConfig);
  const result = [];

  result.push(webpackDevMiddleware(compiler, {
    logLevel: 'warn',
    publicPath: webpackConfig.output.publicPath,
  }));

  result.push(webpackHotMiddleware(compiler, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
  }));

  result.push((req, res, next) => {
    compiler.outputFileSystem.readFile(path.resolve(webpackConfig.output.path, 'index.html'), (err, indexHtmlTemplate) => {
      if (err) {
        next(err);
        return;
      }
      res.set('Content-Type', 'text/html');
      res.send(indexHtmlTemplate);
    });
  });

  return result;
}

module.exports = webpackMiddleware;
