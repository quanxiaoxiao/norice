const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../../lib/compileModle');


module.exports = async (configName, typeName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const buf = await fetchData({
      url: `http://${config.deploy.hostname}:${config.deploy.port}/resource/${typeName}`,
      headers: config.deploy.headers,
      method: 'PUT',
    });
    console.log(buf.toString());
  } catch (error) {
    console.log('fail');
  }
};
