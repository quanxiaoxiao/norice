/* eslint  no-param-reassign:0 */
const { Router } = require('express');
const { resolve } = require('path');
const { checkPropTypes } = require('quan-prop-types');
const _ = require('lodash');
const request = require('request');

const config = require('../config');
const {
  isCompoundMock,
  getErrorStatusCode,
  getSuccessStatusCode,
} = require('../mock/helper');

function handleMockResponse(req, res, next, mockResponse, mock) {
  switch (typeof mockResponse) {
    case 'function':
      mockResponse(req, res, next);
      break;
    case 'object':
      res.json(mockResponse);
      break;
    case 'string': {
      if (/^https?:\/\//.test(mockResponse)) {
        const proxyHost = mockResponse;
        let url = req.url;
        if (_.isPlainObject(mock.pathRewrite)) {
          Object.keys(mock.pathRewrite).forEach((key) => {
            const reg = new RegExp(key);
            if (reg.test(url)) {
              url = url.replace(reg, mock.pathRewrite[key]);
            }
          });
        }

        const options = {
          url: `${proxyHost}${url}`,
          headers: Object.assign({}, req.headers),
        };
        request.get(options).pipe(res);
      } else {
        res.sendFile(resolve(process.cwd(), mockResponse));
      }
      break;
    }
    case 'undefined': {
      const { success: successResponse, error: errorResponse } = config.getGlobalHandles();
      handleMockResponse(
        req, res, next, req.isMockRequestSuccess ? successResponse : errorResponse, mock);
      break;
    }
    default:
      next(new Error(`not support type ${typeof mockResponse}`));
      break;
  }
}

function createRoute(mock, path, router) {
  if (isCompoundMock(mock)) {
    Object.keys(mock).forEach((key) => {
      createRoute(Object.assign({}, mock[key], { medhod: key }), path, router);
    });
  } else {
    const requestMethod = mock.medhod || 'get';
    router[requestMethod](path, (req, res, next) => {
      let isSuccess = true;
      req.isMockRequest = true;
      switch (requestMethod) {
        case 'get':
        case 'delete': {
          if (mock.query && !checkPropTypes(mock.query, req.query, requestMethod, path)) {
            isSuccess = false;
          }
          break;
        }
        case 'post':
        case 'put':
        case 'patch': {
          if (mock.body && !checkPropTypes(mock.body, req.body, requestMethod, path)) {
            isSuccess = false;
          }
          break;
        }
        default: break;
      }
      req.isMockRequestSuccess = isSuccess;
      res.status(isSuccess ? getSuccessStatusCode(mock.status) : getErrorStatusCode(mock.status));
      let mockResponse;
      if (_.isString(mock)) {
        mockResponse = mock;
      } else {
        mockResponse = isSuccess ? mock.success : mock.error;
      }
      handleMockResponse(req, res, next, mockResponse, mock);
    });
  }
}

function createRouter(router, paths) {
  router.stack = [];
  Object.keys(paths).forEach(path => createRoute(paths[path], path, router));
}

module.exports = function mockMiddleware() {
  const paths = config.getPaths();
  const router = new Router();
  createRouter(router, paths);
  config.onChange((cfg) => {
    createRouter(router, cfg.paths);
  });
  return router;
};
