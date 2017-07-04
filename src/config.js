/* eslint func-names:0 */
const gaze = require('gaze');
const EventEmitter = require('events');
const { resolve } = require('path');


const emitter = new EventEmitter();
const path = resolve(process.cwd(), 'norice.config.js');
let cfg = {};


function exec() {
  const prevModule = require.cache[path];
  let index = -1;
  if (prevModule) {
    if (prevModule.parent) {
      index = prevModule.parent.children.indexOf(prevModule);
      prevModule.parent.children.splice(index, 1);
    }
    if (prevModule.children) {
      prevModule.children.forEach(({ id }) => {
        require.cache[id] = null;
      });
    }
  }
  require.cache[path] = null;
  try {
    cfg = require(path); // eslint-disable-line import/no-dynamic-require
  } catch (e) {
    require.cache[path] = prevModule;
    if (index !== -1) {
      prevModule.parent.children.splice(index, 0, prevModule);
    }
    if (prevModule.children) {
      prevModule.children.forEach((child) => {
        require.cache[child.id] = child;
      });
    }
  }
}

function watch() {
  gaze(path, { interval: 2000 }, function (error) {
    if (error) {
      throw error;
    }
    this.on('changed', () => {
      exec();
      console.log('norice configuration reloaded!');
      emitter.emit('fileChange', cfg);
    });
    this.on('error', () => {
      // ignore
    });
  });
}


exports.init = function () {
  exec();
  watch();
};

exports.onChange = function (cb) {
  emitter.on('fileChange', cb);
};

exports.getPaths = function () {
  return cfg.paths;
};

exports.getGlobalResponseHandle = function () {
  return Object.assign({
    success: { status: 'ok' },
    error: { status: 'error' },
  }, cfg.handle);
};

exports.getWebpack = function () {
  return cfg.webpack ? resolve(process.cwd(), cfg.webpack) : null;
};

exports.getListenerPort = function () {
  return cfg.port || 3000;
};

exports.getWebSocketConfig = function () {
  return cfg.ws;
};
