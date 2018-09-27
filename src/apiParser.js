const chalk = require('chalk');
const _ = require('lodash');
const handler = require('./handler');

const METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'];

module.exports = api => Object.entries(api)
  .filter(([pathname, value]) => {
    if (!/^\/.*/.test(pathname) || !_.isPlainObject(value) || _.isEmpty(value)) {
      console.error(chalk.red(`pathname: ${pathname} invalid`));
      return false;
    }
    return true;
  })
  .map(([pathname, route]) => {
    const routeKeys = Object.keys(route);
    if (routeKeys.length >= 2) {
      if (routeKeys.every(method => METHODS.includes(method.toUpperCase()))) {
        return routeKeys.map((method) => {
          const handlerName = Object.keys(route[method])[0];
          return {
            pathname,
            method: method.toUpperCase(),
            handlerName,
            handlerValue: route[method][handlerName],
          };
        });
      }
      console.error(chalk.red(`pathname: ${pathname} invalid`));
      return [];
    }
    if (routeKeys[0] === 'all') {
      const handlerName = Object.keys(route.all)[0];
      const handlerValue = route.all[handlerName];
      return METHODS.map(method => ({
        pathname,
        method,
        handlerName,
        handlerValue,
      }));
    }
    if (METHODS.includes(routeKeys[0].toUpperCase())) {
      const handlerName = Object.keys(route[routeKeys[0]])[0];
      const handlerValue = route[routeKeys[0]][handlerName];
      return [{
        pathname,
        method: routeKeys[0].toUpperCase(),
        handlerName,
        handlerValue,
      }];
    }
    if (handler[routeKeys[0]]) {
      const handlerName = routeKeys[0];
      const handlerValue = route[handlerName];
      return [{
        pathname,
        method: 'GET',
        handlerName,
        handlerValue,
      }];
    }
    console.error(chalk.red(`pathname: ${pathname} invalid`));
    return [];
  })
  .reduce((acc, cur) => [...acc, ...cur], [])
  .filter((item) => {
    if (!item.handlerValue || !handler[item.handlerName]) {
      console.error(chalk.red(`path: ${item.pathname}, method:${item.method}, handler: ${item.handlerName} invalid`));
      return false;
    }
    return true;
  })
  .map(item => ({
    pathname: item.pathname,
    method: item.method,
    handlerName: item.handlerName,
    handler: handler[item.handlerName](item.handlerValue),
  }));
