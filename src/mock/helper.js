const _ = require('lodash');

const METHODS = ['get', 'post', 'delete', 'put', 'patch'];

const DEFAULT_SUCCESS_CODE = 200;
const DEFAULT_ERROR_CODE = 400;

exports.isCompoundMock = function isCompoundMock(mock) {
  const mockKeys = new Set(Object.keys(mock));
  const intersection = new Set(METHODS.filter(x => mockKeys.has(x)));
  return intersection.size === mockKeys.size && mockKeys.size !== 0;
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
