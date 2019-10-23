const moment = require('moment');
const compileModle = require('../lib/compileModle');
const request = require('../lib/request');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');
const { escapeString } = require('../utils');


module.exports = async (configName, message, tag) => {
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
    }))
      .filter((item) => {
        if (!message && !tag) {
          return true;
        }
        if (message && !tag) {
          const reg = new RegExp(escapeString(message), 'i');
          return reg.test(item.message);
        }
        if (!message && tag) {
          const reg = new RegExp(escapeString(tag), 'i');
          return reg.test(item.tag);
        }
        const messageReg = new RegExp(escapeString(message), 'i');
        const tagReg = new RegExp(escapeString(tag), 'i');
        return messageReg.test(item.message) && tagReg.test(item.tag);
      });
    console.log(JSON.stringify(list, null, 2));
  } catch (error) {
    console.log('fail');
  }
};
