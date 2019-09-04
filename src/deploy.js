const path = require('path');
const fs = require('fs');
const http = require('http');
const { Module } = require('module');
const shelljs = require('shelljs');
const { spawn } = require('child_process');

module.exports = (configName) => {
  const configPathName = path.resolve(process.cwd(), configName);
  const mod = new Module(configPathName, null);
  mod.paths = Module._nodeModulePaths(path.dirname(configPathName));
  if (!mod.filename) {
    mod.filename = configPathName;
  }
  const script = fs.readFileSync(configPathName, 'utf-8');
  mod._compile(script, configPathName);
  const { exports: config } = mod;
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
    const tar = spawn('tar', ['-cf', '-', path.basename(webpackConfig.output.path)]);
    const buf = [];
    tar.stdout.on('data', (chunk) => {
      buf.push(chunk);
    });
    tar.once('close', () => {
      shelljs.rm('-r', webpackConfig.output.path);
      const req = http.request({
        hostname: config.deploy.hostname,
        port: config.deploy.port,
        path: config.deploy.path,
        headers: {
          'x-basename': path.basename(webpackConfig.output.path),
          ...config.deploy.headers,
        },
        method: 'POST',
      });
      req.on('response', (res) => {
        if (res.statusCode !== 200) {
          console.error(`statusCode: ${res.statusCode} deploy fail`);
        } else {
          console.log('deploy success');
        }
      });
      req.write(Buffer.concat(buf));
      req.end();
    });
  });
};
