const _ = require('lodash');

const body = (obj) => {
  if (obj == null) {
    return obj;
  }
  if (_.isFunction(obj)) {
    return async (ctx) => {
      const data = await obj(ctx);
      ctx.body = data;
    };
  }
  return async (ctx) => {
    ctx.body = obj;
  };
};

module.exports = body;
