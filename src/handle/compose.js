const fs = require('fs');
const http = require('http');
const url = require('url');
const _ = require('lodash');
const { getFilePath } = require('../utils');

const handlerMap = {
  file: async (pathname, ctx) => {
    if (_.isString(pathname)) {
      return fs.readFileSync(getFilePath(pathname));
    }
    const filePathName = await pathname(ctx);
    return fs.readFileSync(getFilePath(filePathName));
  },
  proxy: async (proxyUrl, ctx) => {
    let options = {};
    if (_.isFunction(proxyUrl)) {
      const ret = await proxyUrl(ctx);
      if (_.isString(ret)) {
        options.url = ret;
      } else {
        options = ret;
      }
    } else if (_.isPlainObject(proxyUrl)) {
      options = proxyUrl;
    } else {
      options.url = proxyUrl;
    }
    const {
      hostname,
      port,
      path,
    } = url.parse(options.url);
    if (!hostname) {
      ctx.throw(404);
    }
    const proxyRequest = http.request({
      hostname,
      path,
      port: Number(port) || 80,
      ..._.omit(options, ['url', 'body']),
    });
    if (options.body) {
      proxyRequest.write(options.body);
    }
    proxyRequest.end();
    return new Promise((resolve, reject) => {
      proxyRequest.once('error', (error) => {
        reject(error);
      });
      proxyRequest.once('response', (res) => {
        const buf = [];
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
          buf.push(chunk);
        });
        res.on('error', (error) => {
          reject(error);
        });
        res.on('end', () => {
          resolve(Buffer.concat(buf, size));
        });
      });
    });
  },
  body: async (body, ctx) => {
    if (_.isFunction(body)) {
      const data = await body(ctx);
      return data;
    }
    return body;
  },
};

const compose = arr => async (ctx) => {
  const last = _.last(arr);
  const handlerList = arr.filter(handler => handler !== last);
  const resultList = await Promise.all(handlerList.map(async (item) => {
    const [type, handler] = Object.entries(item)[0];
    const result = await handlerMap[type](handler, ctx);
    return result;
  }));
  const result = await last(resultList, ctx);
  ctx.body = result;
};

module.exports = compose;
