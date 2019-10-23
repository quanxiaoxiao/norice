const moment = require('moment');
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
    const list = data.map((item) => ({
      ...item,
      timeCreate: moment(item.timeCreate).format('YYYY-MM-DD HH:mm'),
      list: item.list,
    }));
    console.log(JSON.stringify(list, null, 2));
  } catch (error) {
    console.log('fail');
  }
};
