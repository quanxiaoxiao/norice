const _ = require('lodash');

const METHODS = ['get', 'post', 'delete', 'put', 'patch'];
const { isSubset } = require('../utils/set');

const DEFAULT_SUCCESS_CODE = 200;
const DEFAULT_ERROR_CODE = 400;

exports.isCompoundPath = function isCompoundPath(path) {
  return isSubset(new Set(Object.keys(path)), new Set(METHODS));
};

function getStatusCode(defaultCode, pos) {
  return (status) => {
    if (Array.isArray(status)) {
      return status[pos] || status[0] || defaultCode;
    }
    if (status) {
      return status;
    }
    return defaultCode;
  };
}

exports.getSuccessStatusCode = getStatusCode(DEFAULT_SUCCESS_CODE, 0);
exports.getErrorStatusCode = getStatusCode(DEFAULT_ERROR_CODE, 1);

exports.isHttpURL = function isHttpURL(str) {
  if (typeof str !== 'string') {
    return false;
  }
  return /^https?:\/\//.test(str);
};

exports.isStringOrPlainObj = function isStringOrPlainObj(obj) {
  return _.isString(obj) || _.isPlainObject(obj);
};

exports.isValidatePath = path => path.indexOf('/') === 0;

exports.isValidateHandle = (path, handle) => {
  if (_.isString(handle)) {
    return true;
  }
  if (_.isFunction(handle)) {
    return true;
  }
  if (_.isPlainObject(handle)) {
    const method = handle.method;
    if (typeof method !== 'undefined' &&
      !['all', 'get', 'post', 'delete', 'patch'].includes(method)) {
      console.error(`path: ${path} can't support this method ${method}`);
      return false;
    }
    return true;
  }
  console.error(`path: ${path} is invalidate handle`);
  return false;
};
