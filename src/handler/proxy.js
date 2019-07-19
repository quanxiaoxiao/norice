const { PassThrough } = require('stream');
const getOutgoing = require('../getOutgoing');
const forward = require('../httpForward');

const proxy = (handle) => {
  const type = typeof handle;
  if (type === 'function') {
    return async (ctx) => {
      const ret = await handle(ctx);
      const outgoing = getOutgoing(ctx, ret);
      if (!outgoing) {
        ctx.throw(500);
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
    };
  }
  if (type === 'string') {
    return (ctx) => {
      const outgoing = getOutgoing(ctx, handle);
      if (!outgoing) {
        ctx.throw(500);
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
    };
  }
  return (ctx) => {
    ctx.throw(500);
  };
};

module.exports = proxy;
