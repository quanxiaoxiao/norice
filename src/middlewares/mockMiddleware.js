/* eslint  no-param-reassign:0 */
const { Router } = require('express');
const { resolve } = require('path');
const _ = require('lodash');
const request = require('request');
const config = require('../config');


const METHODS = ['get', 'post', 'delete', 'put', 'patch'];

function isCompoundMock(mock) {
  const mockKeys = new Set(Object.keys(mock));
  const intersection = new Set(METHODS.filter(x => mockKeys.has(x)));
  return intersection.size === mockKeys.size && mockKeys.size !== 0;
}

function parseResponse({ req, res }, str) {
  const matches = str.match(/^proxy:(.+)/);
  if (matches) {
    // proxy support only get method
    const options = {
      url: `${matches[1]}${req.url}`,
      headers: Object.assign({}, req.headers),
    };
    request.get(options).pipe(res);
  } else {
    res.sendFile(resolve(process.cwd(), str));
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
      req.isMockRequest = true;
      const response = _.isString(mock) ? mock : mock.success;
      if (_.isFunction(response)) {
        response(req, res, next);
      } else if (_.isObject(response)) {
        res.json(response);
      } else if (_.isString(response)) {
        parseResponse({ req, res, next }, response);
      } else {
        next(new Error(`not support type ${typeof response}`));
      }
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
  process.on('mockPathsChange', (newPaths) => {
    createRouter(router, newPaths);
  });
  createRouter(router, paths);
  return router;
};
