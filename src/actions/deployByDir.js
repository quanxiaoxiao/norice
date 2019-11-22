const tar = require('tar');
const qs = require('querystring');
const shelljs = require('shelljs');
const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../lib/compileModle');

module.exports = async (configName, dir, message, tag) => {
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
  const ret = await fetchData({
    url: `http://${config.deploy.hostname}:${config.deploy.port}/resource?${params}`,
    headers: config.deploy.headers,
    method: 'POST',
    body: tar.c(
      {
        gzip: true,
      },
      [dir],
    ),
    match: (statusCode) => statusCode === 200,
  });
  console.log(ret.toString());
};
