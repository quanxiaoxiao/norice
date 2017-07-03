const _ = require('lodash');
const Route = require('./Route');
const {
  isCompoundPath,
  isValidatePath,
  isValidateHandle,
} = require('./helper');

module.exports = function parseRoutes(paths) {
  if (!_.isPlainObject(paths)) {
    console.error('`paths` must plain object');
    paths = {};
  }
  const pathKeys = Object.keys(paths);
  const routes = [];
  for (let i = 0; i < pathKeys.length; i++) {
    const key = pathKeys[i];
    const handle = paths[key];
    if (isValidatePath(key)) {
      if (isCompoundPath(handle)) {
        const methods = Object.keys(handle);
        for (let j = 0; j < methods.length; j++) {
          const method = methods[j];
          if (isValidateHandle(key, handle[method])) {
            routes.push(new Route(key, handle[method], method));
          }
        }
      } else if (isValidateHandle(key, handle)) {
        routes.push(new Route(key, handle, handle.method));
      }
    } else {
      console.error(`path: ${key} is invalidate path`);
    }
  }
  return routes;
};
