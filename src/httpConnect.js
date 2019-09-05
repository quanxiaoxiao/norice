/* eslint no-use-before-define: 0 */
const http = require('http');

const httpConnect = (
  options,
  onData,
  onResponse,
  onError,
) => {
  const state = {
    isConnect: true,
    isClose: false,
  };

  const { schema = http, body, ...other } = options;

  let proxyRes = null;

  function handleErrorOnProxyReq(error) {
    if (state.isConnect) {
      onError(error);
      state.isConnect = false;
    }
    cleanup();
  }

  function handleCloseOnProxyRes() {
    if (state.isConnect) {
      onData();
      state.isConnect = false;
    }
    cleanup();
  }

  function handleDataOnProxyRes(chunk) {
    if (state.isConnect) {
      onData(chunk);
    }
  }

  function handleResponseOnProxyReq(res) {
    proxyReq.off('response', handleResponseOnProxyReq);
    if (!state.isClose && state.isConnect) {
      proxyRes = res;
      onResponse({
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
      });
      proxyRes.on('data', handleDataOnProxyRes);
      proxyRes.on('end', handleCloseOnProxyRes);
      proxyRes.on('close', handleCloseOnProxyRes);
    }
  }

  const proxyReq = schema.request(other);

  proxyReq.on('error', handleErrorOnProxyReq);

  const connect = () => {
    state.isConnect = false;
    if (!state.isClose) {
      proxyReq.abort();
      state.isClose = true;
    }
    cleanup();
  };

  connect.resume = () => {
    if (state.isConnect && !state.isClose && proxyRes) {
      proxyRes.resume();
    }
  };

  connect.pause = () => {
    if (state.isConnect && !state.isClose && proxyRes) {
      proxyRes.pause();
    }
  };

  if (!state.isClose) {
    proxyReq.on('response', handleResponseOnProxyReq);

    if (body == null) {
      proxyReq.end();
    } else if (body && body.pipe) {
      body.pipe(proxyReq);
    } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
      proxyReq.end(body);
    } else {
      proxyReq.end();
    }
  }

  function cleanup() {
    proxyReq.off('response', handleResponseOnProxyReq);
    if (!state.isClose) {
      state.isClose = true;
    }
    if (state.isConnect) {
      onData();
      state.isConnect = false;
    }
    if (proxyRes) {
      proxyRes.off('data', handleDataOnProxyRes);
      proxyRes.off('close', handleCloseOnProxyRes);
      proxyRes.off('end', handleCloseOnProxyRes);
    }

    proxyReq.off('error', handleErrorOnProxyReq);
  }

  return connect;
};

module.exports = httpConnect;
