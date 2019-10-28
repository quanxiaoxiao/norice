const fp = require('lodash/fp');
const moment = require('moment');
const { table } = require('table');
const compileModle = require('../lib/compileModle');
const request = require('../lib/request');
const getResourceRequestOptions = require('../lib/getResourceRequestOptions');


module.exports = async (configName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const currentBuf = await request({
      ...getResourceRequestOptions(config),
      path: '/resource',
      method: 'GET',
    });
    const { _id } = JSON.parse(currentBuf);
    const buf = await request({
      ...getResourceRequestOptions(config),
      path: '/resources',
      method: 'GET',
    });
    fp.compose(
      console.log,
      (_) => table(
        [
          ['id', 'message', 'tag', 'file count', 'timeCreate'],
          ..._,
        ],
        {},
      ),
      fp.map((item) => [
        _id === item._id ? `* ${item._id}` : `  ${item._id}`,
        item.message,
        item.tag,
        item.list.length,
        moment(item.timeCreate).format('YYYY-MM-DD HH:mm'),
      ]),
      fp.orderBy(['timeCreate'], ['desc']),
      JSON.parse,
    )(buf);
  } catch (error) {
    console.log('fail');
  }
};
