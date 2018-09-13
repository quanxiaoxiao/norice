const url = require('url');
const { PassThrough } = require('stream');
const http = require('http');
const fp = require('lodash/fp');
const _ = require('lodash');

const requestShim = (ctx, options) => {
  const passThrough = new PassThrough();
  console.log(`proxy: ${JSON.stringify(options)}`);
  if (!options.hostname) {
    ctx.throw(404);
  }
  ctx.req.pipe(http.request(options))
    .once('response', (res) => {
      ctx.status = res.statusCode;
      ctx.set(res.headers);
      res.pipe(passThrough);
    })
    .once('error', (error) => {
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
  let path;
  if (pathname === '/') {
    if (other.isRaw) {
      path = '/';
    } else {
      path = `${ctx.path}?${ctx.querystring}`;
    }
  } else {
    path = `${pathname}?${query || ctx.querystring}`;
  }
  const options = {
    hostname,
    path,
    port: Number(port) || 80,
    method: ctx.method,
    headers: _.omit(ctx.headers, ['host']),
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
    if (!options.hostname) {
      ctx.throw(404);
    }
    const passThrough = new PassThrough();
    const buf = [];
    let size = 0;
    ctx.req.pipe(http.request(options))
      .once('response', (res) => {
        ctx.status = res.statusCode;
        ctx.set(_.omit(res.headers, ['host', 'content-length', 'content-type']));
        ctx.type = 'json';
        const handleData = (chunk) => {
          size += chunk.length;
          buf.push(chunk);
        };
        res
          .on('data', handleData)
          .once('end', () => {
            res.off('data', handleData);
            passThrough.end(fp.compose(...other.reverse())(Buffer.concat(buf, size), ctx));
          })
          .once('error', (error) => {
            res.off('data', handleData);
            passThrough.emit('error', error);
          });
      })
      .once('error', (error) => {
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
