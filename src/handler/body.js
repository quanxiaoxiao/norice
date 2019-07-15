const _ = require('lodash');

const body = obj => async (ctx) => {
  if (_.isFunction(obj)) {
    const data = await obj(ctx);
    ctx.body = data;
  } else {
    ctx.body = obj;
  }
};

module.exports = body;
