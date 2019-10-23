/* eslint no-use-before-define: 0 */
const url = require('url');
const http = require('http');
const https = require('https');
const _ = require('lodash');
const createHttpHeader = require('../apilib/createHttpHeader');

const getOutgoing = (req, options) => {
  if (_.isEmpty(options)) {
    return null;
  }

  let target;
  if (_.isString(options)) {
    target = options;
    options = {};
  } else {
    target = options.url;
    options = _.omit(options, ['url']);
  }
  if (!target || !/^wss?:\/\/\w+/.test(target)) {
    return null;
  }
  const {
    hostname,
    port,
    query,
    pathname,
  } = url.parse(target);
  let path;
  if (pathname === '/' || !pathname) {
    path = req.url;
  } else {
    path = `${pathname}?${query}`;
  }
  return {
    hostname,
    path,
    schema: /^wss:/.test(target) ? https : http,
    port: parseInt(port, 10) || (/^wss:/.test(target) ? 443 : 80),
    method: 'GET',
    headers: _.omit(req.headers, ['host']),
    ...options,
  };
};

const stream = (socket, outgoing, server) => {
  const { schema, ...options } = outgoing;
  const proxyReq = schema.request(options);
  socket.setTimeout(0);
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 0);
  const handleProxyReqResponse = (res) => {
    if (!res.upgrade) {
      res.pipe(socket);
      socket.destroy();
    }
  };
  const handleProxyReqUpgrade = (proxyRes, proxySocket) => {
    socket.on('error', handleSocketError);
    proxySocket.on('error', () => {});

    socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));

    function handleSocketClose() {
      cleanupSocket();
    }

    function handleSocketError(error) {
      server.emit('error', error);
      if (!socket.destroyed) {
        socket.destroy();
      }
      cleanupSocket();
    }

    function cleanupSocket() {
      socket.off('close', handleSocketClose);
      socket.off('end', handleSocketClose);
      // socket.off('error', handleSocketError);
    }

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);

    socket.on('close', handleSocketClose);
    socket.on('end', handleSocketClose);
  };

  proxyReq.on('response', handleProxyReqResponse);
  proxyReq.on('upgrade', handleProxyReqUpgrade);
  proxyReq.on('end', handleProxyReqClose);
  proxyReq.on('close', handleProxyReqClose);
  proxyReq.on('error', handleProxyReqError);

  function handleProxyReqError(error) {
    server.emit('error', error);
    socket.end();
    cleanup();
  }

  function handleProxyReqClose() {
    cleanup();
  }

  function cleanup() {
    proxyReq.off('response', handleProxyReqResponse);
    proxyReq.off('upgrade', handleProxyReqUpgrade);
    proxyReq.off('end', handleProxyReqClose);
    proxyReq.off('close', handleProxyReqClose);
    proxyReq.off('error', handleProxyReqError);
  }

  proxyReq.end();
};

const ws = (handle) => {
  const type = typeof handle;
  if (type === 'function') {
    return async (req, socket, server) => {
      const ret = await handle(req);
      const outgoing = getOutgoing(req, ret);
      if (!outgoing) {
        socket.destroy();
      } else {
        stream(socket, outgoing, server);
      }
    };
  }
  if (type === 'string') {
    return (req, socket, server) => {
      const outgoing = getOutgoing(req, handle);
      if (!outgoing) {
        socket.destroy();
      } else {
        stream(socket, outgoing, server);
      }
    };
  }
  return (req, socket) => {
    socket.destroy();
  };
};

module.exports = ws;
