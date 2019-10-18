const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const file = (handle) => {
  const type = typeof handle;
  if (type === 'string') {
    return (ctx) => {
      ctx.type = path.extname(handle);
      ctx.body = fs.createReadStream(path.resolve(__dirname, '..', handle));
    };
  }
  if (type === 'function') {
    return async (ctx) => {
      const pathname = await handle(ctx);
      if (!_.isString(pathname)) {
        ctx.trhow(500);
      }
      ctx.type = path.extname(pathname);
      ctx.body = fs.createReadStream(path.resolve(__dirname, '..', pathname));
    };
  }
  return (ctx) => {
    ctx.throw(500);
  };
};

module.exports = file;
