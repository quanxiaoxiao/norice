const moment = require('moment');
const request = require('../lib/request');
const compileModle = require('../lib/compileModle');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');

module.exports = async (configName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const buf = await request({
      ...getResourceRequestOptions(config),
      path: '/resource',
      method: 'GET',
    });
    const data = JSON.parse(buf);
    const ret = {
      ...data,
      timeCreate: moment(data.timeCreate).format('YYYY-MM-DD HH:mm'),
      list: data.list,
    };
    console.log(JSON.stringify(ret, null, 2));
  } catch (error) {
    console.log('fail');
  }
};
