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

  let proxySocket = null;
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


  function handleErrorOnProxySocket(error) {
    if (state.isConnect) {
      onError(error);
      state.isConnect = false;
    }
    cleanup();
  }

  function handleCloseOnProxySocket() {
    if (state.isConnect) {
      onData();
      state.isConnect = false;
    }
    cleanup();
  }


  function handleSocketOnProxyReq(socket) {
    proxySocket = socket;
    proxySocket.on('close', handleCloseOnProxySocket);
    proxySocket.on('error', handleErrorOnProxySocket);
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
    proxyReq.on('socket', handleSocketOnProxyReq);
    proxyReq.on('response', handleResponseOnProxyReq);

    if (body == null) {
      proxyReq.end();
    } else if (body && body.pipe) {
      body.pipe(proxyReq);
    } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
      proxyReq.end(body);
    }
  }

  function cleanup() {
    proxyReq.off('response', handleResponseOnProxyReq);
    proxyReq.off('socket', handleSocketOnProxyReq);
    if (!state.isClose) {
      state.isClose = true;
    }
    if (state.isConnect) {
      onData();
      state.isConnect = false;
    }
    if (proxySocket) {
      proxySocket.off('close', handleCloseOnProxySocket);
    }
    if (proxyRes) {
      proxyRes.off('data', handleDataOnProxyRes);
      proxyRes.off('close', handleCloseOnProxyRes);
      proxyRes.off('end', handleCloseOnProxyRes);
    }
    if (proxySocket) {
      proxySocket.off('error', handleErrorOnProxySocket);
    }
    proxyReq.off('error', handleErrorOnProxyReq);
  }

  return connect;
};

module.exports = httpConnect;
