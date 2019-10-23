const fs = require('fs');
const path = require('path');
const { Module } = require('module');


module.exports = (configName) => {
  const configPathName = path.resolve(process.cwd(), configName);
  const mod = new Module(configPathName, null);
  mod.paths = Module._nodeModulePaths(path.dirname(configPathName));
  if (!mod.filename) {
    mod.filename = configPathName;
  }
  const script = fs.readFileSync(configPathName, 'utf-8');
  mod._compile(script, configPathName);
  return mod;
};
