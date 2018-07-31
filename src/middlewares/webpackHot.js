const hotMiddleware = require('webpack-hot-middleware');
const { PassThrough } = require('stream');

module.exports = (compiler, options) => {
  const expressMiddleware = hotMiddleware(compiler, options);
  return async (ctx, next) => {
    const stream = new PassThrough();
    ctx.body = stream;
    ctx.req.once('close', () => {
      stream.end();
    });
    await expressMiddleware(ctx.req, {
      write: (chunk) => {
        if (ctx.res) {
          ctx.res.write(chunk);
        }
      },
      writeHead: (status, headers) => {
        ctx.status = status;
        ctx.set(headers);
      },
    }, next);
  };
};
