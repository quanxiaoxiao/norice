/* eslint no-use-before-define: 0 */
const httpConnect = require('./httpConnect');

const httpForward = (
  options,
  socket,
  res,
) => {
  const bufList = [];

  const isConcatData = typeof res === 'function';

  const state = {
    isClose: false,
    isConnect: false,
    sendHeader: false,
  };

  const connect = httpConnect(
    options,
    onData,
    onResponse,
    onError,
  );

  function onError(error) {
    if (state.isClose) {
      return;
    }
    state.isConnect = false;
    if (isConcatData) {
      res(error);
    } else {
      console.log(error);
      if (!state.sendHeader) {
        res.writeHead(502, {});
        state.sendHeader = true;
      }
      res.end();
      state.isClose = true;
    }
    cleanup();
  }

  function onResponse(ret) {
    if (state.isClose) {
      return;
    }
    state.isConnect = true;
    if (isConcatData) {
      res(null, ret);
    } else if (ret.statusCode > 299 && ret.statusCode < 400) {
      const { location = '' } = ret.headers;
      const matchs = location.match(/(https?:\/\/)([^/]+)(\/.+)/);
      if (matchs) {
        res.writeHead(ret.statusCode, {
          ...ret.headers,
          location: matchs[3],
        });
      } else {
        res.writeHead(ret.statusCode, ret.headers);
      }
      state.sendHeader = true;
    } else {
      res.writeHead(ret.statusCode, ret.headers);
      state.sendHeader = true;
    }
  }

  function onData(chunk) {
    if (!state.isConnect || state.isClose) {
      return;
    }
    if (chunk == null) {
      state.isConnect = false;
      if (isConcatData) {
        res(null, Buffer.concat(bufList));
        cleanup();
      } else {
        res.end();
        state.isClose = true;
        cleanup();
      }
      return;
    }

    if (isConcatData) {
      bufList.push(chunk);
      return;
    }

    const ret = res.write(chunk);
    if (!ret) {
      connect.pause();
    }
  }

  function handleCloseOnSocket() {
    state.isClose = true;
    cleanup();
  }

  function handleDrainOnRes() {
    if (state.isClose || !state.isConnect) {
      return;
    }
    connect.resume();
  }

  socket.on('close', handleCloseOnSocket);
  if (!isConcatData) {
    res.on('drain', handleDrainOnRes);
  }

  function cleanup() {
    if (!state.isClose) {
      if (!isConcatData) {
        res.end();
      }
      state.isClose = true;
    }
    if (state.isConnect) {
      connect();
      state.isConnect = false;
    }
    socket.off('close', handleCloseOnSocket);
    if (!isConcatData) {
      res.off('drain', handleDrainOnRes);
    }
  }
};

module.exports = httpForward;
