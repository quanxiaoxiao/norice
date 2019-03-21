const _ = require('lodash');
const { PassThrough } = require('stream');
const isStream = require('is-stream');
const onFinished = require('on-finished');

class HttpProxy extends PassThrough {
  constructor(ctx, options = {}) {
    super();
    this.options = options;
    this.ctx = ctx;
    this.handleProxyReqAborted = this.handleProxyReqAborted.bind(this);
    this.handleProxyReqError = this.handleProxyReqError.bind(this);
    this.handleProxyReqResponse = this.handleProxyReqResponse.bind(this);
    this.attachReqEvents();
    process.nextTick(this.connection.bind(this));
  }

  connection() {
    if (this.ctx.req.finished) {
      this.cleanupReqEvents();
      return;
    }
    const { schema, body, ...proxyRequestOptions } = this.options;
    console.log(JSON.stringify(proxyRequestOptions));
    const proxyReq = schema.request(proxyRequestOptions);

    this.proxyReq = proxyReq;

    proxyReq.on('error', this.handleProxyReqError);
    proxyReq.on('response', this.handleProxyReqResponse);

    if (body === null) {
      proxyReq.end();
      return;
    }

    if (isStream(body)) {
      body.pipe(proxyReq);
      return;
    }

    if (_.isString(body) || Buffer.isBuffer(body)) {
      proxyReq.write(body);
      proxyReq.end();
      return;
    }

    this.ctx.req.pipe(proxyReq);
  }

  attachReqEvents() {
    const { req } = this.ctx;
    req.on('error', this.handleProxyReqAborted);
    req.on('close', this.handleProxyReqAborted);
    req.on('aborted', this.handleProxyReqAborted);
  }

  handleProxyReqAborted() {
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
    this.cleanupReqEvents();
  }

  cleanupReqEvents() {
    const { req } = this.ctx;
    req.off('error', this.handleProxyReqAborted);
    req.off('close', this.handleProxyReqAborted);
    req.off('aborted', this.handleProxyReqAborted);
  }

  cleanupProxyReqEvents() {
    if (this.proxyReq) {
      this.proxyReq.off('error', this.handleProxyReqError);
      this.proxyReq.off('response', this.handleProxyReqResponse);
    }
  }

  handleProxyReqError(error) {
    console.error(error);
    this.cleanupProxyReqEvents();
    this.proxyReq = null;
    this.cleanupReqEvents();
    if (!this.ctx.res.finished) {
      this.ctx.status = 502;
      this.end();
    }
  }

  handleProxyReqResponse(proxyRes) {
    if (!this.ctx.res.finished) {
      this.ctx.status = proxyRes.statusCode;
      this.ctx.set(proxyRes.headers);

      proxyRes.pipe(this);

      onFinished(proxyRes, (error) => {
        if (error) {
          proxyRes.unpipe(this);
          this.end();
        }
        this.cleanupProxyReqEvents();
        this.cleanupReqEvents();
        this.proxyReq = null;
      });
    }
  }
}

module.exports = HttpProxy;
