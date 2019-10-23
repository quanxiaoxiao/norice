const path = require('path');
const tar = require('tar');
const qs = require('querystring');
const http = require('http');
const https = require('https');
const shelljs = require('shelljs');
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
      console.error(error);
    }
    console.log(stats.toString());
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
        hostname: deployConfig.hostname,
        port: deployConfig.port,
        path: `/resource?${params}`,
        headers: deployConfig.headers,
        method: 'POST',
      });
    req.on('response', (res) => {
      if (res.statusCode !== 200) {
        console.error(`statusCode: ${res.statusCode} deploy fail`);
      } else {
        console.log('deploy success');
      }
    });
    tar.c(
      {
        gzip: true,
      },
      [path.basename(webpackConfig.output.path)],
    ).pipe(req);
  });
};
