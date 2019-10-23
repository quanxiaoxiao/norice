const path = require('path');
const tar = require('tar');
const qs = require('querystring');
const http = require('http');
const https = require('https');
const shelljs = require('shelljs');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');
const compileModle = require('../lib/compileModle');

module.exports = (configName, message, tag) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  const { deploy: deployConfig } = config;
  if (!deployConfig) {
    throw new Error('deploy config is not set');
  }
  const webpack = mod.require('webpack');
  const { webpackProd: webpackConfig } = config;
  const compiler = webpack(webpackConfig, (error, stats) => {
    if (error) {
      console.error(error.message);
    }
    if (stats) {
      console.log(stats.toString());
    }
  });

  compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
    if (!shelljs.test('-d', webpackConfig.output.path)) {
      shelljs.exec(1);
    }
    process.chdir(path.resolve(webpackConfig.output.path, '..'));
    const params = qs.stringify({
      message,
      tag,
    });
    const req = (deployConfig.port === 443 ? https : http)
      .request({
        ...getResourceRequestOptions(config),
        path: `/resource?${params}`,
        method: 'POST',
      });
    req.on('response', (res) => {
      if (res.statusCode !== 200) {
        console.error(`statusCode: ${res.statusCode} deploy fail`);
      } else {
        console.log('deploy success');
      }
    });
    req.on('error', (error) => {
      console.error(error.message);
    });
    tar.c(
      {
        gzip: true,
      },
      [path.basename(webpackConfig.output.path)],
    ).pipe(req);
  });
};
