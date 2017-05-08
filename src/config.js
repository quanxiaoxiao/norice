/* eslint func-names:0 */
const vm = require('vm');
const gaze = require('gaze');
const { readFileSync } = require('fs');
const { resolve } = require('path');

let _str;

const path = resolve(__dirname, '../norice.config.js');
let cfg = {};

function exec(str) {
  if (str === _str) {
    return false;
  }
  _str = str;
  const script = new vm.Script(str);
  const module = {};
  script.runInNewContext({ module });
  if (!module.exports) {
    throw new Error('Error reading configuration: `module.exports` not set');
  }
  const _cfg = module.exports;
  if (!_cfg.paths) {
    throw new Error('Error reading configuration: `paths` key is missing');
  }
  cfg = _cfg;
  return true;
}

function watch() {
  gaze(path, { interval: 2000 }, function (error) {
    if (error) {
      throw error;
    }
    this.on('changed', () => {
      if (exec(readFileSync(path, 'utf-8'))) {
        console.log('norice configuration reloaded!');
        process.emit('mockPathsChange', cfg.paths);
      }
    });
    this.on('error', () => {
      // ignore
    });
  });
}


exports.init = function () {
  exec(readFileSync(path, 'utf-8'));
  watch();
};

exports.getPaths = function () {
  return cfg.paths;
};
