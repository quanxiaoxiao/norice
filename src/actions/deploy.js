const path = require('path');
const tar = require('tar');
const qs = require('querystring');
const shelljs = require('shelljs');
const { fetchData } = require('@quanxiaoxiao/about-http');
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

  compiler.hooks.afterEmit.tap('AfterEmitPlugin', async () => {
    if (!shelljs.test('-d', webpackConfig.output.path)) {
      shelljs.exec(1);
    }
    process.chdir(path.resolve(webpackConfig.output.path, '..'));
    const params = qs.stringify({
      message,
      tag,
    });
    const ret = await fetchData({
      url: `http://${config.deploy.hostname}:${config.deploy.port}/resource?${params}`,
      headers: config.deploy.headers,
      method: 'POST',
      body: tar.c(
        {
          gzip: true,
        },
        [path.basename(webpackConfig.output.path)],
      ),
      match: (statusCode) => statusCode === 200,
    });
    console.log(ret.toString());
  });
};
