const { PassThrough } = require('stream');
const path = require('path');
const shelljs = require('shelljs');
const { fetchData } = require('@quanxiaoxiao/about-http');
const tar = require('tar');
const compileModle = require('../../lib/compileModle');
const getResourceOptions = require('../../lib/getResourceOptions');

module.exports = async (configName, resource) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const options = getResourceOptions(config.deployUrl);
    const buf = await fetchData({
      url: `${options.protocol}//${options.hostname}:${options.port}${options.prefix}/pack${resource ? `/${resource}` : ''}`,
      headers: options.headers,
    });

    const passThrough = new PassThrough();

    const dirname = config.distDir || path.join(process.cwd(), 'dist');

    if (!shelljs.test('-d', dirname)) {
      shelljs.mkdir('-p', dirname);
    }

    passThrough.pipe(tar.x({
      C: dirname,
    }));

    passThrough.end(buf);
  } catch (error) {
    console.error(error.message);
  }
};
