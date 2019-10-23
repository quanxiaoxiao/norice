const request = require('../lib/request');
const compileModle = require('../lib/compileModle');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');


module.exports = async (configName, id) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const buf = await request({
      ...getResourceRequestOptions(config),
      path: `/resource/${id}`,
      method: 'PUT',
    });
    console.log(buf.toString());
  } catch (error) {
    console.log('fail');
  }
};
