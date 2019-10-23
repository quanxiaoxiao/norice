const { PassThrough } = require('stream');
const http = require('http');
const https = require('https');
const url = require('url');
const _ = require('lodash');
const forward = require('../apilib/httpForward');

const getOutgoing = (ctx, options) => {
  if (_.isEmpty(options)) {
    return null;
  }

  let target;
  if (_.isString(options)) {
    target = options;
    options = {};
  } else {
    target = options.url;
    options = _.omit(options, ['url']);
  }
  if (!target || !/^https?:\/\/\w+/.test(target)) {
    return null;
  }
  const {
    hostname,
    port,
    query,
    pathname,
  } = url.parse(target);
  let path;
  if (pathname === '/' || !pathname) {
    path = ctx.originalUrl;
  } else {
    path = `${pathname}?${query || ctx.querystring}`;
  }
  return {
    schema: /^https/.test(target) ? https : http,
    hostname,
    path,
    port: parseInt(port, 10) || (/^https/.test(target) ? 443 : 80),
    method: ctx.method,
    headers: _.omit(ctx.headers, ['host']),
    ...options,
  };
};

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
