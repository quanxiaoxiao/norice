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

const stream = (socket, outgoing) => {
  const proxyReq = http.request(outgoing);
  proxyReq.once('response', (res) => {
    if (!res.upgrade) {
      res.pipe(socket);
      socket.destroy();
    }
  });
  proxyReq.once('upgrade', (proxyRes, proxySocket) => {
    socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);

    socket.once('error', () => {
      proxyReq.end();
    });

    proxySocket.once('error', () => {
      socket.end();
    });
  });

  proxyReq.once('error', () => {
    socket.end();
  });
  proxyReq.end();
};


const handlerMap = {
  string: target => (req, socket) => {
    stream(socket, getOutgoing(req, target));
  },
  array: arr => () => {
  },
  function: fn => () => {
  },
  object: obj => () => {
  },
};

const ws = () => {
};

module.exports = ws;
