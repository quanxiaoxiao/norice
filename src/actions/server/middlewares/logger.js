const logger = require('koa-logger');

function ignoreAssects(mw) {
  return async function filter(ctx, next) {
    if (/\.(js|png|jpg|css)$/.test(ctx.path)) {
      await next();
    } else {
      await mw.call(this, ctx, next);
    }
  };
}

module.exports = ignoreAssects(logger());
