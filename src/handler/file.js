const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const getFilePath = require('../utils/getFilePath');

const file = (handle) => {
  const type = typeof handle;
  if (type === 'string') {
    return (ctx) => {
      ctx.type = path.extname(handle);
      ctx.body = fs.createReadStream(getFilePath(handle));
    };
  }
  if (type === 'function') {
    return async (ctx) => {
      const pathname = await handle(ctx);
      if (!_.isString(pathname)) {
        ctx.trhow(500);
      }
      ctx.type = path.extname(pathname);
      ctx.body = fs.createReadStream(getFilePath(pathname));
    };
  }
  return (ctx) => {
    ctx.throw(500);
  };
};

module.exports = file;
