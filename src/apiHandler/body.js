const httpForward = require('../apilib/httpForward');
const fetch = require('../apilib/fetch');

const body = (handle) => async (ctx) => {
  if (typeof handle === 'function') {
    try {
      const data = await handle(
        ctx,
        httpForward,
        (options) => fetch({
          ...options,
          socket: ctx.req.socket,
        }),
      );
      ctx.body = data;
    } catch (error) {
      if (typeof error.status === 'number') {
        throw error;
      } else {
        console.error(error);
        ctx.throw(500);
      }
    }
  } else {
    ctx.body = handle;
  }
};

module.exports = body;
