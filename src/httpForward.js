/* eslint no-use-before-define: 0 */
const httpConnect = require('./httpConnect');

const httpForward = (
  options,
  req,
  res,
) => {
  const bufList = [];

  const isConcatData = typeof res === 'function';

  const state = {
    isClose: false,
    isConnect: false,
  };

  const connect = httpConnect(
    options,
    onData,
    onResponse,
  );

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
    } else {
      res.writeHead(ret.statusCode, ret.headers);
    }
  }

  function onData(error, chunk) {
    if (!state.isConnect || state.isClose) {
      return;
    }
    if (error) {
      state.isConnect = false;
      if (isConcatData) {
        res(error);
      } else {
        res.destroy();
      }
      cleanup();
      return;
    }
    if (chunk == null) {
      state.isConnect = false;
      if (isConcatData) {
        res(null, Buffer.concat(bufList));
      } else {
        res.end();
      }
      cleanup();
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

  function handleCloseOnReq() {
    state.isClose = true;
    cleanup();
  }

  function handleDrainOnRes() {
    connect.resume();
  }

  req.on('close', handleCloseOnReq);
  if (!isConcatData) {
    res.on('drain', handleDrainOnRes);
  }

  function cleanup() {
    if (!state.isClose) {
      state.isClose = true;
    }
    if (state.isConnect) {
      connect();
      state.isConnect = false;
    }
    req.off('close', handleCloseOnReq);
    if (!isConcatData) {
      res.off('drain', handleDrainOnRes);
    }
  }
};

module.exports = httpForward;
