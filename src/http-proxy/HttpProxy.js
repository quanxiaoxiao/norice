const _ = require('lodash');
const http = require('http');
const isStream = require('is-stream');

class HttpProxy {
  constructor(ctx, options = {}) {
    this.statusCode = 200;
    this.options = options;
    this.isClose = false;
    if (options.body) {
      if (isStream(options.body)) {
        this.incoming = options.body;
      }
    }
    this.ctx = ctx;
    this.attachResEvents();
    this.attachReqEvents();
    this.connection();
  }

  connection() {
    const proxyReq = http.request(_.omit(this.options, ['body']));

    this.proxyReq = proxyReq;

    proxyReq.on('error', (error) => {
      if (error.CODE !== 'ECONNRESET') {
        this.ctx.res.writeHead(500);
        this.ctx.res.end();
      }
    });

    proxyReq.on('response', (res) => {
      this.ctx.res.writeHead(res.statusCode, res.headers);
      this.proxyReq = proxyReq;
      this.proxyRes = res;
      this.attachProxyResEvents();
    });

    if (this.incoming && this.incoming.readable) {
      this.incoming.pipe(proxyReq);
    } else if (_.isString(this.options.body)) {
      proxyReq.write(this.options.body);
      proxyReq.end();
    } else {
      proxyReq.end();
    }
  }

  attachResEvents() {
    const { res } = this.ctx;
    res.on('error', () => {
      console.log('-------------------------res error');
    });
    res.on('close', () => {
      if (this.proxyReq) {
        this.proxyReq.abort();
      }
    });
  }

  attachReqEvents() {
    const { req } = this.ctx;
    req.on('error', () => {
      console.log('-----------------req error');
    });
    req.on('aborted', () => {
      if (this.proxyReq) {
        this.proxyReq.abort();
      }
    });
  }

  attachProxyResEvents() {
    const { proxyRes, ctx: { res } } = this;
    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });

    proxyRes.on('end', () => {
      console.log('proxyRes end');
      res.end();
    });
  }
}

module.exports = HttpProxy;
