const getOutgoing = require('../http-proxy/getOutgoing');
const HttpProxy = require('../http-proxy/HttpProxy');

const handlerType = {
  string: target => (ctx) => {
    const outgoing = getOutgoing(ctx, target);
    if (!outgoing) {
      ctx.throw(404);
    }
    ctx.body = new HttpProxy(ctx, outgoing);
  },
  function: fn => async (ctx) => {
    const ret = await fn(ctx);
    const outgoing = getOutgoing(ctx, ret);
    if (!outgoing) {
      ctx.throw(404);
    }
    ctx.body = new HttpProxy(ctx, outgoing);
  },
  object: obj => (ctx) => {
    const outgoing = getOutgoing(ctx, obj);
    if (!outgoing) {
      ctx.throw(404);
    }
    ctx.body = new HttpProxy(ctx, outgoing);
  },
};

const proxy = (obj) => {
  if (obj == null) {
    return (ctx) => {
      ctx.throw(404);
    };
  }
  const handlerName = Array.isArray(obj) ? 'array' : typeof obj;
  const handler = handlerType[handlerName];
  if (!handler) {
    return (ctx) => {
      ctx.throw(404);
    };
  }
  return handler(obj);
};

module.exports = proxy;
