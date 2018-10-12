const fp = require('lodash/fp');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const getFilePath = require('../utils/getFilePath');

const mapType = {
  string: pathname => (ctx) => {
    ctx.type = path.extname(pathname);
    ctx.body = fs.createReadStream(getFilePath(pathname));
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let pathname = first;
    if (_.isFunction(first)) {
      pathname = await pathname(ctx);
    }
    if (!_.isString(pathname)) {
      ctx.trhow(500);
    }
    ctx.type = path.extname(pathname);
    ctx.body = fp.compose(...other.reverse())(fs.readFileSync(getFilePath(pathname)));
  },
  function: fn => async (ctx) => {
    const pathname = await fn(ctx);
    if (!_.isString(pathname)) {
      ctx.trhow(500);
    }
    ctx.type = path.extname(pathname);
    ctx.body = fs.createReadStream(getFilePath(pathname));
  },
};

const file = (obj) => {
  if (obj == null) {
    return (ctx) => {
      ctx.throw(404);
    };
  }
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  const handler = mapType[type];
  if (!handler) {
    return (ctx) => {
      ctx.throw(404);
    };
  }
  return handler(obj);
};

module.exports = file;
