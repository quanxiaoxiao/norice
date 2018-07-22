const fp = require('lodash/fp');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const { getFilePath } = require('../utils');

const mapType = {
  string: pathname => (ctx) => {
    ctx.type = path.extname(pathname);
    ctx.body = fs.createReadStream(getFilePath(pathname));
  },
  array: arr => async (ctx) => {
    const [first, ...other] = arr;
    let pathname;
    if (_.isString(first)) {
      pathname = first;
    } else {
      pathname = await first(ctx);
    }
    ctx.type = path.extname(pathname);
    ctx.body = fp.compose(...other.reverse())(fs.readFileSync(getFilePath(pathname)));
  },
  function: fn => async (ctx) => {
    const pathname = await fn(ctx);
    ctx.type = path.extname(pathname);
    ctx.body = fs.createReadStream(getFilePath(pathname));
  },
};

const file = (obj) => {
  if (obj == null) {
    return obj;
  }
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  return mapType[type] && mapType[type](obj);
};

module.exports = file;
