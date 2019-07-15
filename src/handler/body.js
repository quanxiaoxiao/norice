const _ = require('lodash');
const httpForward = require('../httpForward');

const body = obj => async (ctx) => {
  if (_.isFunction(obj)) {
    const data = await obj(ctx, httpForward);
    ctx.body = data;
  } else {
    ctx.body = obj;
  }
};

module.exports = body;
