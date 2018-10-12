const fs = require('fs');
const _ = require('lodash');
const http = require('http');
const getOutgoing = require('../http-proxy/getOutgoing');
const getFilePath = require('../utils/getFilePath');

const proxyRequest = options => new Promise((resolve, reject) => {
  const outgoing = _.omit(options, ['body']);
  console.log(`concat proxy: ${JSON.stringify(outgoing)}`);
  const proxyReq = http.request(outgoing);
  proxyReq
    .once('response', (res) => {
      const buf = [];
      let size = 0;
      const handleEnd = () => {
        if (res.statusCode !== 200) {
          reject(Buffer.concat(buf, size).toString());
        } else {
          resolve(Buffer.concat(buf, size));
        }
      };
      res.once('end', handleEnd);
      res.once('error', () => {
        res.off('end', handleEnd);
      });
      res.on('data', (chunk) => {
        size += chunk.length;
        buf.push(chunk);
      });
    })
    .once('error', (error) => {
      reject(error);
    });
  if (options.body != null) {
    if (options.body.pipe) {
      options.body.pipe(proxyReq);
    } else {
      proxyReq.write(options.body);
      proxyReq.end();
    }
  } else {
    proxyReq.end();
  }
});

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
    return proxyRequest(outgoing);
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
