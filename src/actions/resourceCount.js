const compileModle = require('../lib/compileModle');
const request = require('../lib/request');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');


module.exports = async (configName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const buf = await request({
      ...getResourceRequestOptions(config),
      path: '/resources',
      method: 'GET',
    });
    const data = JSON.parse(buf);
    console.log(data.length);
  } catch (error) {
    console.log('fail');
  }
};
