const isStream = require('is-stream');
const http = require('http');
const _ = require('lodash');
const { Readable } = require('stream');

class Outgoing extends Readable {
  constructor(ctx, options = {}) {
    super();
    this.statusCode = 200;
    this.options = options;
    if (options.body) {
      if (isStream(options.body)) {
        this.incoming = options.body;
      }
    } else {
      this.incoming = options.req;
    }
    this.handleIncomingError = this.handleIncomingError.bind(this);
    this.handleIncomingAbort = this.handleIncomingAbort.bind(this);
    this.handleProxyReqError = this.handleProxyReqError.bind(this);
    this.handleProxyResponse = this.handleProxyResponse.bind(this);
    this.ctx = ctx;
    this.attachEvents();
    process.nextTick(this.request.bind(this));
  }

  _read(data) {
    if (!this.readable) {
      return false;
    }
    return this.push(data);
  }

  attachEvents() {
    if (this.incoming) {
      this.incoming.on('error', this.handleIncomingError);
      this.incoming.on('aborted', this.handleIncomingAbort);
    }
  }

  request() {
    if (!this.readable) {
      return;
    }
    const proxyReq = http.request(_.omit(this.options, ['body']));
    proxyReq.on('error', this.handleProxyReqError);
    proxyReq.on('response', this.handleProxyResponse);
    if (this.incoming && this.incoming.readable) {
      this.incoming.pipe(proxyReq);
    } else if (_.isString(this.options.body)) {
      proxyReq.write(this.options.body);
      proxyReq.end();
    } else {
      proxyReq.end();
    }
    this.proxyReq = proxyReq;
  }

  handleProxyResponse(res) {
    if (!this.ctx.res.writable) {
      return;
    }
    this.proxyRes = res;
  }

  handleIncomingError(error) {
    if (this.ctx.req.socket.destroyed && error.code === 'ECONNRESET'
      && this.proxyReq
    ) {
      this.proxyReq.abort();
    }
  }

  handleIncomingAbort() {
    if (this.proxyReq) {
      this.proxyReq.abort();
    }
  }
}

module.exports = Outgoing;
