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
    this.on('error', () => {});
    process.nextTick(this.connection.bind(this));
  }

  connection() {
    if (this.ctx.req.finished) {
      return;
    }
    const options = _.omit(this.options, ['body']);
    console.log(`proxy: ${JSON.stringify(options)}`);
    const proxyReq = http.request(options);

    this.proxyReq = proxyReq;

    proxyReq.on('error', this.handleProxyReqError);

    proxyReq.on('response', this.handleProxyReqResponse);

    if (this.options.body && isStream(this.options.body)) {
      this.options.body.pipe(proxyReq);
    } else if (_.isString(this.options.body) || this.options.body instanceof Buffer) {
      proxyReq.write(this.options.body);
      proxyReq.end();
    } else if (this.options.body === null) {
      proxyReq.end();
    } else {
      this.ctx.req.pipe(proxyReq);
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

  handleError(error) {
    console.error(error);
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
  }

  handleResEnd() {
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
  }

  handleProxyReqError(error) {
    console.error(error);
    if (!this.ctx.res.finished) {
      this.ctx.status = 500;
      this.end();
    }
  }

  handleProxyReqResponse(proxyRes) {
    if (!this.ctx.res.finished) {
      this.ctx.status = proxyRes.statusCode;
      this.ctx.set(proxyRes.headers);
      proxyRes.pipe(this);
    }
  }
}

module.exports = HttpProxy;
