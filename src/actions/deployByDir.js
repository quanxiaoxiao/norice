const tar = require('tar');
const qs = require('querystring');
const shelljs = require('shelljs');
const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../lib/compileModle');
const getResourceOptions = require('../lib/getResourceOptions');

module.exports = async (configName, dir, message, tag) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  const { deployUrl } = config;
  if (!deployUrl) {
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
  const options = getResourceOptions(deployUrl);
  const ret = await fetchData({
    url: `${options.protocol}//${options.hostname}:${options.port}${options.prefix}/resource?${params}`,
    headers: options.headers,
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
