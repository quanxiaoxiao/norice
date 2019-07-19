const httpForward = require('../httpForward');

const body = handle => async (ctx) => {
  if (typeof handle === 'function') {
    const data = await handle(ctx, httpForward);
    ctx.body = data;
  } else {
    ctx.body = handle;
  }
};

module.exports = body;
