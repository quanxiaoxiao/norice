const { PassThrough } = require('stream');
const getOutgoing = require('../getOutgoing');
const forward = require('../httpForward');

const handlerType = {
  string: target => (ctx) => {
    const outgoing = getOutgoing(ctx, target);
    if (!outgoing) {
      ctx.throw(404);
    }
    const passThrough = new PassThrough();
    passThrough.writeHead = (statusCode, headers) => {
      ctx.status = statusCode;
      Object
        .keys(headers)
        .forEach((key) => {
          ctx.set(key, headers[key]);
        });
    };
    forward({
      ...outgoing,
      body: ctx.req,
    }, ctx.req.socket, passThrough);
    ctx.body = passThrough;
  },
  function: fn => async (ctx) => {
    const ret = await fn(ctx);
    const outgoing = getOutgoing(ctx, ret);
    if (!outgoing) {
      ctx.throw(404);
    }
    const passThrough = new PassThrough();
    passThrough.writeHead = (statusCode, headers) => {
      ctx.status = statusCode;
      Object
        .keys(headers)
        .forEach((key) => {
          ctx.set(key, headers[key]);
        });
    };
    forward(outgoing, ctx.req.socket, passThrough);
    ctx.body = passThrough;
  },
  object: obj => (ctx) => {
    const outgoing = getOutgoing(ctx, obj);
    if (!outgoing) {
      ctx.throw(404);
    }
    const passThrough = new PassThrough();
    passThrough.writeHead = (statusCode, headers) => {
      ctx.status = statusCode;
      Object
        .keys(headers)
        .forEach((key) => {
          ctx.set(key, headers[key]);
        });
    };
    forward(outgoing, ctx.req.socket, passThrough);
    ctx.body = passThrough;
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
