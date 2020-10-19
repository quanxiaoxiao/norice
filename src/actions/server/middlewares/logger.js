const logger = require('koa-logger');

function ignoreAssects(mw) {
  return async function filter(ctx, next) {
    ctx.logger = {
      info: console.log,
      error: console.error,
    };
    await mw.call(this, ctx, next);
  };
}

module.exports = ignoreAssects(logger());
