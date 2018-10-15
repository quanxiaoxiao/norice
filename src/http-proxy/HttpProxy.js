const _ = require('lodash');
const { PassThrough } = require('stream');
const http = require('http');
const isStream = require('is-stream');

class HttpProxy extends PassThrough {
  constructor(ctx, options = {}) {
    super();
    this.options = options;
    this.ctx = ctx;
    this.handleError = this.handleError.bind(this);
    this.handleAborted = this.handleAborted.bind(this);
    this.handleResEnd = this.handleResEnd.bind(this);
    this.handleProxyReqError = this.handleProxyReqError.bind(this);
    this.handleProxyReqResponse = this.handleProxyReqResponse.bind(this);
    this.attachResEvents();
    this.attachReqEvents();
    process.nextTick(this.connection.bind(this));
  }

  connection() {
    if (this.ctx.req.finished) {
      return;
    }
    const proxyReq = http.request(_.omit(this.options, ['body']));

    this.proxyReq = proxyReq;

    proxyReq.on('error', this.handleProxyReqError);

    proxyReq.on('response', this.handleProxyReqResponse);

    if (this.options.body && isStream(this.options.body)) {
      this.options.body.pipe(proxyReq);
    } else if (_.isString(this.options.body) || this.options.body instanceof Buffer) {
      proxyReq.write(this.options.body);
      proxyReq.end();
    } else {
      proxyReq.end();
    }
  }

  attachResEvents() {
    const { res } = this.ctx;
    res.on('close', this.handleResEnd);
    res.on('finished', this.handleResEnd);
    res.on('error', this.handleError);
  }

  attachReqEvents() {
    const { req } = this.ctx;
    req.on('error', this.handleError);
    req.on('aborted', this.handleAborted);
  }

  handleAborted() {
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
  }

  handleError() {
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
  }

  handleResEnd() {
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
    this.cleanup();
  }

  handleProxyReqError() {
    if (!this.ctx.res.finished) {
      this.ctx.res.writeHead(500);
      this.end();
    }
  }

  handleProxyReqResponse(proxyRes) {
    if (!this.ctx.res.finished) {
      this.ctx.res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(this);
    }
  }

  cleanup() {
    const { res, req } = this.ctx;
    res.removeListener('close', this.handleResEnd);
    res.removeListener('finished', this.handleResEnd);
    res.removeListener('error', this.handleError);
    req.removeListener('error', this.handleError);
    req.removeListener('aborted', this.handleAborted);
    if (this.proxyReq) {
      this.proxyReq.removeListener('error', this.handleProxyReqError);
      this.proxyReq.removeListener('response', this.handleProxyReqResponse);
    }
  }
}

module.exports = HttpProxy;
