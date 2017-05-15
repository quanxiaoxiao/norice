const _ = require('lodash');
const { isAbsolute, resolve } = require('path');
const {
  isHttpURL,
  getSuccessStatusCode,
  getErrorStatusCode,
  isStringOrPlainObj,
  isCompoundMock,
} = require('./helper');

const NORMAL = 0;
const FILE = 1;
const PROXY = 2;

function createRouteObj(path, {
  status,
  method = 'get',
  success = {},
  error = {},
  isProxy = false,
  isFile = false,
  validation = {},
}) {
  const successStatusCode = getSuccessStatusCode(status);
  const errorStatusCode = getErrorStatusCode(status);
  if (!(isStringOrPlainObj(success) && isStringOrPlainObj(error))) {
    throw new Error('response must string or plain object');
  }
  if (_.isString(success)) {
    if (isHttpURL(success)) {
      isProxy = true;
    } else {
      isFile = true;
      success = resolve(process.cwd(), success);
    }
    if (!isHttpURL(success) && !isAbsolute(success)) {
      throw new Error(`this path ${success} is not support`);
    }
  }
  return {
    path,
    status: [successStatusCode, errorStatusCode],
    method,
    success,
    error,
    isProxy,
    isFile,
    validation,
  };
}

function parseRoute(path, route) {
  if (!isStringOrPlainObj(route)) {
    throw new Error(`${path} key must string or plain object`);
  }
  if (_.isString(route)) {
    route = {
      path,
      success: route,
    };
  }
  if (isCompoundMock(route)) {
    return Object.keys(route).map(key => parseRoute(path, route[key]));
  }
  return [createRouteObj(path, route)];
}

module.exports = function paraseRouter(paths) {
  if (!_.isPlainObject(paths)) {
    throw new Error('`paths` must plain object');
  }
  const keys = Object.keys(paths);
  const router = [];
  for (let i = 0; i < keys.length; i++) {
    const path = keys[i];
    router.push(...parseRoute(path, paths[path]));
  }
  return router;
};
