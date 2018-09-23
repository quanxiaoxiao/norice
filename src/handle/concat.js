const fs = require('fs');
const _ = require('lodash');
const getOutgoing = require('../http-proxy/getOutgoing');
const stream = require('../http-proxy/stream');
const stream2Promise = require('../utils/stream2Promise');
const { getFilePath } = require('../utils');

const handlerMap = {
  file: async (pathname, ctx) => {
    if (_.isFunction(pathname)) {
      pathname = await pathname(ctx);
    }
    if (!_.isString(pathname)) {
      ctx.throw(404);
    }
    return fs.readFileSync(getFilePath(pathname));
  },
  proxy: async (options, ctx) => {
    if (_.isFunction(options)) {
      options = await options(ctx);
    }
    const outgoing = getOutgoing(ctx, options);
    if (!outgoing) {
      return null;
    }
    const buf = await stream2Promise(stream(ctx, outgoing, true, false));
    return buf;
  },
  body: async (body, ctx) => {
    if (_.isFunction(body)) {
      body = await body(ctx);
    }
    return body;
  },
};

const compose = arr => async (ctx) => {
  if (!Array.isArray(arr) || _.isEmpty(arr)) {
    ctx.trhow(404);
  }
  const last = _.last(arr);
  const handlerList = arr.filter(handler => handler !== last);
  const resultList = await Promise.all(handlerList.map(async (item) => {
    const [handlerName, handler] = Object.entries(item)[0];
    const ret = await handlerMap[handlerName](handler, ctx);
    return ret;
  }));
  const ret = await last(resultList, ctx);
  ctx.body = ret;
};

module.exports = compose;
