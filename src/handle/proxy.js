const fp = require('lodash/fp');
const _ = require('lodash');
const getOutgoing = require('../http-proxy/getOutgoing');
const stream = require('../http-proxy/stream');
const stream2Promise = require('../utils/stream2Promise');

const mapType = {
  string: target => (ctx) => {
    const outgoing = getOutgoing(ctx, target);
    if (!outgoing) {
      ctx.throw(404);
    }
    ctx.body = stream(ctx, outgoing);
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let options = first;
    if (_.isFunction(options)) {
      options = await first(ctx);
    }
    const outgoing = getOutgoing(ctx, options);
    if (!outgoing) {
      ctx.throw(404);
    }
    try {
      const buf = await stream2Promise(stream(ctx, outgoing, true, false));
      ctx.body = fp.compose(...other.reverse())(buf, ctx);
    } catch (error) {
      console.log(error);
      ctx.throw(500);
    }
  },
  function: fn => async (ctx) => {
    const ret = await fn(ctx);
    const outgoing = getOutgoing(ret);
    if (!outgoing) {
      ctx.throw(404);
    }
    ctx.body = stream(ctx, outgoing);
  },
  object: obj => (ctx) => {
    const outgoing = getOutgoing(obj);
    if (!outgoing) {
      ctx.throw(404);
    }
    ctx.body = stream(ctx, outgoing);
  },
};

const proxy = (obj) => {
  if (obj == null) {
    return obj;
  }
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  return mapType[type] && mapType[type](obj);
};

module.exports = proxy;
