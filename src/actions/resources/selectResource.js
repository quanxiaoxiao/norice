const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../../lib/compileModle');
const getResourceOptions = require('../../lib/getResourceOptions');

module.exports = async (configName, typeName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const options = getResourceOptions(config.deployUrl);
    const buf = await fetchData({
      url: `${options.protocol}//${options.hostname}:${options.port}${options.prefix}/resource/${typeName}`,
      headers: options.headers,
      method: 'PUT',
    });
    console.log(buf.toString());
  } catch (error) {
    console.log('fail');
  }
};
