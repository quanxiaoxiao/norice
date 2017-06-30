const { Router } = require('express');
const parseRoutes = require('./parseRoutes');
const config = require('../config');

function createRoutes(router, routes) {
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    router[route.method](route.path, route.handleResponse.bind(route));
  }
  return router;
}

module.exports = () => {
  const router = new Router();

  const paths = config.getPaths();
  const routes = parseRoutes(paths);

  config.onChange((cfg) => {
    router.stack = [];
    createRoutes(router, parseRoutes(cfg.paths));
  });

  return createRoutes(router, routes);
};
