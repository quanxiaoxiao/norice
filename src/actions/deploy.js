const path = require('path');
const tar = require('tar');
const qs = require('querystring');
const shelljs = require('shelljs');
const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../lib/compileModle');
const getResourceOptions = require('../lib/getResourceOptions');

module.exports = (configName, message, tag) => {
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'production';
  }
  const mod = compileModle(configName);
  const { exports: config } = mod;
  const { deployUrl } = config;
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
    const options = getResourceOptions(deployUrl);
    const ret = await fetchData({
      url: `${options.protocol}//${options.hostname}:${options.port}${options.prefix}/resource?${params}`,
      headers: options.headers,
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
