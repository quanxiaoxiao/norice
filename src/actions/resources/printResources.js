const fp = require('lodash/fp');
const moment = require('moment');
const { table } = require('table');
const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../../lib/compileModle');
const getResourceOptions = require('../../lib/getResourceOptions');


module.exports = async (configName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const options = getResourceOptions(config.deployUrl);
    const currentBuf = await fetchData({
      url: `${options.protocol}//${options.hostname}:${options.port}${options.prefix}/resource`,
      headers: options.headers,
    });
    const { _id } = JSON.parse(currentBuf);
    const buf = await fetchData({
      url: `${options.protocol}//${options.hostname}:${options.port}${options.prefix}/resources`,
      headers: options.headers,
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
    console.log(error);
    console.log('fail');
  }
};
