const url = require('url');
const http = require('http');
const _ = require('lodash');
const createHttpHeader = require('../utils/createHttpHeader');

const getOutgoing = (req, options) => {
  if (options == null) {
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
  if (pathname === '/') {
    path = req.url;
  } else {
    path = `${pathname}?${query}`;
  }
  const headers = {
    ..._.omit(req.headers, ['host']),
    ...(options.headers || {}),
  };
  return {
    hostname,
    path,
    port: Number(port) || 80,
    method: 'GET',
    ...options,
    headers,
  };
};

const stream = (socket, outgoing, server) => {
  const proxyReq = http.request(outgoing);
  console.log(`ws proxy: ${JSON.stringify(outgoing)}`);
  socket.setTimeout(0);
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 0);
  proxyReq.once('response', (res) => {
    if (!res.upgrade) {
      res.pipe(socket);
      socket.destroy();
    }
  });
  proxyReq.once('upgrade', (proxyRes, proxySocket) => {
    socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));

    socket.once('error', (error) => {
      server.emit('error', error);
      proxyReq.end();
    });

    proxySocket.once('error', (error) => {
      server.emit('error', error);
      socket.end();
    });

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.once('error', (error) => {
    server.emit('error', error);
    socket.end();
  });
  proxyReq.end();
};


const handleMap = {
  string: target => (req, socket, server) => {
    const outgoing = getOutgoing(req, target);
    if (!outgoing) {
      socket.destroy();
    } else {
      stream(socket, outgoing, server);
    }
  },
  function: fn => async (req, socket, server) => {
    const ret = await fn(req);
    const outgoing = getOutgoing(req, ret);
    if (!outgoing) {
      socket.destroy();
    } else {
      stream(socket, outgoing, server);
    }
  },
  object: obj => (req, socket, server) => {
    const outgoing = getOutgoing(req, obj);
    if (!outgoing) {
      socket.destroy();
    } else {
      stream(socket, outgoing, server);
    }
  },
};

const ws = (obj) => {
  if (obj == null) {
    return (req, socket) => {
      socket.destroy();
    };
  }
  const handleName = typeof obj;
  const handle = handleMap[handleName];
  if (!handle) {
    return (req, socket) => {
      socket.destroy();
    };
  }
  return handle(obj);
};

module.exports = ws;
