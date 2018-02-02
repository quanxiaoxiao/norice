/* eslint no-continue: 0 */
const _ = require('lodash');
const Route = require('./Route');
const {
  isCompoundPath,
  isValidatePath,
  isValidateHandle,
} = require('./helper');

const {
  uploadFile,
  downloadFile,
  removeFile,
} = require('../../file');

module.exports = function parseRoutes(paths) {
  if (!_.isPlainObject(paths)) {
    console.error('`paths` must plain object');
    paths = {};
  }
  const pathKeys = Object.keys(paths);
  const routes = [];
  for (let i = 0; i < pathKeys.length; i++) {
    const key = pathKeys[i];
    if (!isValidatePath(key)) {
      console.error(`path: ${key} is invalidate path`);
      continue;
    }
    const handle = paths[key];
    if (isCompoundPath(handle)) {
      const methods = Object.keys(handle);
      for (let j = 0; j < methods.length; j++) {
        const method = methods[j];
        if (isValidateHandle(key, handle[method])) {
          routes.push(new Route(key, handle[method], method));
        }
      }
    } else if (isValidateHandle(key, handle)) {
      if (handle.dir) {
        routes.push(new Route(`${key}/:id`, downloadFile(handle), 'get'));
        routes.push(new Route(key, uploadFile(handle), 'post'));
        routes.push(new Route(`${key}/:id`, removeFile(handle), 'delete'));
      } else {
        routes.push(new Route(key, handle, handle.method));
      }
    }
  }
  return routes;
};
