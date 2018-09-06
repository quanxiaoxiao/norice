const url = require('url');
const { PassThrough } = require('stream');
const http = require('http');
const fp = require('lodash/fp');
const _ = require('lodash');

const requestShim = (ctx, options) => {
  const passThrough = new PassThrough();
  console.log(`proxy: ${JSON.stringify(options)}`);
  ctx.req.pipe(http.request(options))
    .on('response', (res) => {
      ctx.code = res.statusCode;
      ctx.set(res.headers);
      res.pipe(passThrough);
    })
    .on('error', (error) => {
      passThrough.emit('error', error);
    });

  return passThrough;
};

const getProxyOptions = (ctx, proxyUrl, other = {}) => {
  const {
    hostname,
    port,
    query,
    pathname,
  } = url.parse(proxyUrl);
  const options = {
    hostname,
    path: pathname !== '/' ? `${pathname}?${query || ctx.querystring}` : `${ctx.path}?${ctx.querystring}`,
    port: Number(port) || 80,
    method: ctx.method,
    headers: ctx.headers,
    ...other,
  };
  return options;
};

const mapType = {
  string: proxyUrl => (ctx) => {
    ctx.body = requestShim(ctx, getProxyOptions(ctx, proxyUrl));
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let options;
    if (_.isString(first)) {
      options = getProxyOptions(ctx, first);
    } else if (_.isFunction(first)) {
      const obj = await first(ctx);
      options = getProxyOptions(ctx, obj.url || obj, _.isString(obj) ? {} : _.omit(obj, ['url']));
    } else if (_.isPlainObject(first)) {
      options = getProxyOptions(ctx, first.url, _.omit(first, ['url']));
    }
    if (_.isEmpty(options)) {
      console.log('options is empty');
      ctx.throw(500);
    }
    const passThrough = new PassThrough();
    const buf = [];
    let size = 0;
    ctx.req.pipe(http.request(options))
      .on('response', (res) => {
        ctx.code = res.statusCode;
        ctx.set(_.omit(res.headers, ['content-length', 'content-type']));
        ctx.type = 'json';
        res
          .on('data', (chunk) => {
            size += chunk.length;
            buf.push(chunk);
          })
          .on('end', () => {
            passThrough.end(fp.compose(...other.reverse())(Buffer.concat(buf, size), ctx));
          })
          .on('error', (error) => {
            passThrough.emit('error', error);
          });
      })
      .on('error', (error) => {
        passThrough.emit('error', error);
      });
    ctx.body = passThrough;
  },
  function: fn => async (ctx) => {
    const options = await fn(ctx);
    ctx.body = requestShim(ctx, getProxyOptions(ctx, options.url || options, _.isString(options) ? {} : _.omit(options, ['url'])));
  },
  object: options => (ctx) => {
    ctx.body = requestShim(ctx, getProxyOptions(ctx, options.url, _.omit(options, ['url'])));
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
