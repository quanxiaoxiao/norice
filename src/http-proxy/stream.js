const { PassThrough } = require('stream');
const http = require('http');

module.exports = (ctx, options, emitError, setOutgoing = true) => {
  if (!options || !options.hostname) {
    ctx.throw(404);
  }
  console.log(`proxy: ${JSON.stringify(options)}`);
  const passThrough = new PassThrough();
  const { req } = ctx;
  const proxyReq = http.request(options);

  let proxyRes;

  req.pipe(proxyReq)
    .on('response', (res) => {
      proxyRes = res;
      if (!ctx.res.finished) {
        if (setOutgoing) {
          ctx.status = proxyRes.statusCode;
          ctx.set(proxyRes.headers);
        }
        proxyRes.pipe(passThrough);
      }
      proxyRes.on('error', () => {
        if (!ctx.res.finished) {
          passThrough.end();
        }
      });
    })
    .on('error', (error) => {
      console.log(error);
      if (proxyRes) {
        proxyRes.unpipe(passThrough);
      }
      if (emitError) {
        passThrough.emit('error', error);
      } else if (!ctx.res.finished) {
        ctx.status = 500;
        passThrough.end();
      }
    });

  req.on('error', () => {
    proxyReq.abort();
  });

  req.on('aborted', () => {
    proxyReq.abort();
  });
  return passThrough;
};
