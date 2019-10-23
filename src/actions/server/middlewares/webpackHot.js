const hotMiddleware = require('webpack-hot-middleware');
const { PassThrough } = require('stream');

module.exports = (compiler, options) => {
  const expressMiddleware = hotMiddleware(compiler, options);
  return async (ctx, next) => {
    const stream = new PassThrough();
    ctx.body = stream;
    await expressMiddleware(ctx.req, {
      write: (chunk) => {
        stream.push(chunk);
      },
      writeHead: (status, headers) => {
        ctx.status = status;
        ctx.set(headers);
      },
      end: () => {
        stream.end();
      },
    }, next);
  };
};
