const { Router } = require('express');

const parseRouter = require('../mock/parseRouter');
const config = require('../config');

module.exports = function mockMiddleware() {
  const router = new Router();

  function createRoute(mocks) {
    for (let i = 0; i < mocks.length; i++) {
      const mock = mocks[i];
      if (mock.path.indexOf('/') !== 0) {
        console.error(`path: ${mock.path} is invalidate`);
        continue; // eslint-disable-line
      }
      router[mock.method](mock.path, (req, res, next) => {
        mock.handleResponse(req, res, next);
      });
    }
  }

  createRoute(parseRouter(config.getPaths()));

  config.onChange((cfg) => {
    router.stack = [];
    createRoute(parseRouter(cfg.paths));
  });

  function handleNext(req, res, next) {
    if (res.mock) {
      const globalMock = config.getGlobalMock();
      res.mock._handleResponse(req, res, next, globalMock);
    } else {
      next();
    }
  }

  return [router, handleNext];
};
