const fp = require('lodash/fp');
const filesize = require('filesize');
const moment = require('moment');
const compileModle = require('../../lib/compileModle');
const request = require('../../lib/request');
const getResourceRequestOptions = require('../../lib/getResourceRequestOptions');


module.exports = async (configName, resource) => {
  const mod = compileModle(configName);
  const { exports: config } = mod;
  try {
    const buf = await request({
      ...getResourceRequestOptions(config),
      path: '/resources',
      method: 'GET',
    });
    const ret = fp.compose(
      (_) => ({
        ..._,
        list: fp.compose(
          fp.map((item) => ({
            ...item,
            size: filesize(item.size),
          })),
          fp.orderBy(['size'], ['desc']),
        )(_.list),
      }),
      fp.find((item) => item._id === resource),
      JSON.parse,
    )(buf);
    if (ret) {
      console.log(JSON.stringify({
        ...ret,
        timeCreate: moment(ret.timeCreate).format('YYYY-MM-DD HH:mm:ss'),
      }, null, 2));
    }
  } catch (error) {
    console.log('fail');
  }
};
