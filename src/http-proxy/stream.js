const { PassThrough } = require('stream');
const _ = require('lodash');
const http = require('http');

module.exports = (ctx, options, emitError, setOutgoing = true) => {
  if (!options || !options.hostname) {
    ctx.throw(404);
  }
  console.log(`proxy: ${JSON.stringify(options)}`);
  const passThrough = new PassThrough();
  const proxyReq = http.request(_.omit(options, ['body']));

  let proxyRes;

  proxyReq.on('response', (res) => {
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
  });

  proxyReq.on('error', (error) => {
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

  if (options.body) {
    if (options.body.pipe) {
      const req = options.body;
      req.pipe(proxyReq);
      req.on('error', () => {
        proxyReq.abort();
      });

      req.on('aborted', () => {
        proxyReq.abort();
      });
    } else {
      proxyReq.write(options.body);
      proxyReq.end();
    }
  } else {
    const { req } = ctx;
    req.pipe(proxyReq);
    req.on('error', () => {
      proxyReq.abort();
    });

    req.on('aborted', () => {
      proxyReq.abort();
    });
  }

  return passThrough;
};
