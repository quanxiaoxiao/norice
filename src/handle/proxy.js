const request = require('request');
const fp = require('lodash/fp');
const _ = require('lodash');

const apiRequest = options =>
  new Promise((resolve, reject) => {
    request(options, (error, res, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });

const mapType = {
  string: host => (ctx) => {
    ctx.type = 'application/json;charset=UTF-8';
    ctx.body = request({
      url: `${host}${ctx.url}`,
      method: ctx.method.toLowerCase(),
    });
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let options = {
      method: ctx.method.toLowerCase(),
    };
    if (_.isString(first)) {
      options.url = `${first}${ctx.url}`;
    } else if (_.isFunction(first)) {
      const result = await first(ctx);
      options = {
        ...options,
        ..._.isString(result) ? {
          url: result,
        } : result,
      };
    } else if (_.isPlainObject(first)) {
      options = {
        ...options,
        ...first,
      };
    }
    const body = await apiRequest(options);
    ctx.body = fp.compose(...other.reverse())(body, ctx);
  },
  function: fn => async (ctx) => {
    const result = await fn(ctx);
    const options = {
      method: ctx.method.toLowerCase(),
      ..._.isString(result) ? {
        url: result,
      } : result,
    };
    ctx.body = request(options);
  },
  object: options => (ctx) => {
    ctx.body = request(options);
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
