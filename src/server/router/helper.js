const _ = require('lodash');
const qs = require('querystring');
const contentType = require('content-type');
const getRawBody = require('raw-body');

const METHODS = ['get', 'post', 'delete', 'put', 'patch'];
const { isSubset } = require('../../utils/set');

const DEFAULT_SUCCESS_CODE = 200;
const DEFAULT_ERROR_CODE = 400;

exports.isCompoundPath = function isCompoundPath(handle) {
  if (!_.isPlainObject(handle) || _.isEmpty(handle)) {
    return false;
  }
  return isSubset(new Set(Object.keys(handle)), new Set(METHODS));
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
    const { method } = handle;
    if (typeof method !== 'undefined' &&
      !['all', ...METHODS].includes(method)) {
      console.error(`path: ${path} can't support this method ${method}`);
      return false;
    }
    return true;
  }
  console.error(`path: ${path} is invalidate handle`);
  return false;
};

const calNameByParams = (obj) => {
  if (!_.isPlainObject(obj)) {
    throw new Error(typeof obj);
  }
  if (_.isEmpty(obj)) {
    return '';
  }
  return qs.stringify(Object.keys(obj)
    .sort((a, b) => {
      const aName = a.toLowerCase();
      const bName = b.toLowerCase();
      if (aName < bName) {
        return -1;
      }
      if (aName > bName) {
        return 1;
      }
      return 0;
    })
    .reduce((acc, key) => ({
      ...acc,
      [key]: obj[key],
    }), {}));
};

const getParamsByReq = (req) => {
  const method = req.method.toLowerCase();
  switch (method) {
    case 'get':
    case 'delete':
      return req.query;
    case 'post':
    case 'put':
    case 'patch':
      return req.body;
    default: return {};
  }
};

const getRequestRawBody = (req) => {
  const { type } = contentType.parse(req);
  if (type === 'application/json') {
    return Promise.resolve(JSON.stringify(req.body));
  } else if (type === 'application/x-www-form-urlencoded') {
    return Promise.resolve(qs.stringify(req.body));
  }
  return getRawBody(req);
};

exports.getRequestRawBody = getRequestRawBody;

exports.getParamsByReq = getParamsByReq;


exports.getRecordNameByReq = (req) => {
  const method = req.method.toLowerCase();
  return `${method.toLowerCase()}_${calNameByParams(getParamsByReq(req))}`;
};
