/* eslint func-names:0 */
const gaze = require('gaze');
const EventEmitter = require('events');
const { resolve } = require('path');


const emitter = new EventEmitter();
const path = resolve(process.cwd(), 'norice.config.js');
let cfg = {};

function exec() {
  const module = require.cache[path];
  if (module && module.parent) {
    module.parent.children.splice(module.parent.children.indexOf(module), 1);
  }
  require.cache[path] = null;
  cfg = require(path); // eslint-disable-line import/no-dynamic-require
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

exports.getGlobalMock = function () {
  return Object.assign({
    success: { status: 'ok' },
    error: { status: 'error' },
  }, cfg.global);
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
