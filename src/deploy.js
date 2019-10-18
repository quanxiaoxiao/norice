const path = require('path');
const tar = require('tar');
const fs = require('fs');
const qs = require('querystring');
const http = require('http');
const https = require('https');
const url = require('url');
const { Module } = require('module');
const shelljs = require('shelljs');

module.exports = (configName, message, tag) => {
  const configPathName = path.resolve(process.cwd(), configName);
  const mod = new Module(configPathName, null);
  mod.paths = Module._nodeModulePaths(path.dirname(configPathName));
  if (!mod.filename) {
    mod.filename = configPathName;
  }
  const script = fs.readFileSync(configPathName, 'utf-8');
  mod._compile(script, configPathName);
  const { exports: config } = mod;
  if (!config.deploy.url || !/^https?:\/\/.+/.test(config.deploy.url)) {
    throw new Error('deploy url invalid');
  }
  const { webpackProd: webpackConfig } = config;
  const webpack = mod.require('webpack');
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
    const {
      hostname,
      port,
      pathname,
      protocol,
    } = url.parse(config.deploy.url);
    const params = qs.stringify({
      message,
      tag,
    });
    const req = (protocol === 'https:' ? https : http)
      .request({
        hostname,
        port: parseInt(port, 10) || (protocol === 'https:' ? 443 : 80),
        path: `${pathname}?${params}`,
        headers: config.deploy.headers,
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
