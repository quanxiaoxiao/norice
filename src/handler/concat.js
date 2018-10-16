const fs = require('fs');
const _ = require('lodash');
const stream2Promise = require('../utils/stream2Promise');
const HttpProxy = require('../http-proxy/HttpProxy');
const getOutgoing = require('../http-proxy/getOutgoing');
const getFilePath = require('../utils/getFilePath');

const handlerMap = {
  file: async (pathname, ctx) => {
    if (_.isFunction(pathname)) {
      pathname = await pathname(ctx);
    }
    if (!_.isString(pathname)) {
      return Promise.reject();
    }
    return fs.readFileSync(getFilePath(pathname));
  },
  proxy: async (options, ctx) => {
    if (_.isFunction(options)) {
      options = await options(ctx);
    }
    const outgoing = getOutgoing(ctx, options);
    if (!outgoing) {
      return Promise.reject();
    }
    return stream2Promise(new HttpProxy(ctx, {
      ...outgoing,
      body: outgoing.body || null,
    }));
  },
  body: async (body, ctx) => {
    if (_.isFunction(body)) {
      body = await body(ctx);
    }
    return body;
  },
};

const concat = arr => async (ctx) => {
  if (!Array.isArray(arr) || _.isEmpty(arr)) {
    ctx.trhow(404);
  }
  const last = _.last(arr);
  const handlerList = arr.filter(handler => handler !== last);
  const resultList = await Promise.all(handlerList.map(async (item) => {
    const handlerName = Object.keys(item)[0];
    const handlerValue = item[handlerName];
    const ret = await handlerMap[handlerName](handlerValue, ctx);
    return ret;
  }));
  const ret = await last(resultList, ctx);
  ctx.body = ret;
};

module.exports = concat;
