const webpack = require('webpack');
const path = require('path');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

function webpackMiddleware(webpackFilePath) {
  const webpackConfig = require(webpackFilePath); // eslint-disable-line
  const compiler = webpack(webpackConfig);
  const result = [];

  result.push(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publickPath || '/',
  }));

  result.push(webpackHotMiddleware(compiler));

  result.push((req, res, next) => {
    const indexFilePath = path.resolve(webpackConfig.output.path, 'index.html');
    compiler.outputFileSystem.readFile(indexFilePath, (err, indexHtmlTemplate) => {
      if (err) {
        next(err);
        return;
      }
      res.set('Content-type', 'text/html');
      res.end(indexHtmlTemplate);
    });
  });

  return result;
}

module.exports = webpackMiddleware;
