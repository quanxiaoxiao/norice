import webpackDevMiddleware from 'webpack-dev-middleware';

export default (compiler, options) => {
  const expressMiddleware = webpackDevMiddleware(compiler, options);
  async function middleware(ctx, next) {
    let isNextRun = false;
    const runNext = () => {
      isNextRun = true;
    };
    await expressMiddleware(ctx.req, {
      end: (content) => {
        ctx.body = content;
      },
      setHeader: (name, value) => {
        ctx.set(name, value);
      },
      getHeader: (name) => ctx.get(name),
    }, runNext);
    if (isNextRun) {
      await next();
    }
  }
  middleware.getFilenameFromUrl = expressMiddleware.getFilenameFromUrl;
  middleware.waitUntilValid = expressMiddleware.waitUntilValid;
  middleware.invalidate = expressMiddleware.invalidate;
  middleware.close = expressMiddleware.close;
  middleware.fileSystem = expressMiddleware.fileSystem;
  return middleware;
};
