const fp = require('lodash/fp');
const moment = require('moment');
const { table } = require('table');
const { fetchData } = require('@quanxiaoxiao/about-http');
const compileModle = require('../../lib/compileModle');


module.exports = async (configName) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const currentBuf = await fetchData({
      url: `http://${config.deploy.hostname}:${config.deploy.port}/resource`,
      headers: config.deploy.headers,
    });
    const { _id } = JSON.parse(currentBuf);
    const buf = await fetchData({
      url: `http://${config.deploy.hostname}:${config.deploy.port}/resources`,
      headers: config.deploy.headers,
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
