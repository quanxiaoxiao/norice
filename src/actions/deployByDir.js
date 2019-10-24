const tar = require('tar');
const qs = require('querystring');
const http = require('http');
const https = require('https');
const shelljs = require('shelljs');
const compileModle = require('../lib/compileModle');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');

module.exports = (configName, dir, message, tag) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  const { deploy: deployConfig } = config;
  if (!deployConfig) {
    console.error('deploy config is not set');
    shelljs.exec(1);
  }
  if (!shelljs.test('-d', dir)) {
    console.error(`directory: ${dir} not exist`);
    shelljs.exec(1);
  }
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
    [dir],
  ).pipe(req);
};
