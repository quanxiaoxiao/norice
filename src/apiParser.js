const chalk = require('chalk');
const _ = require('lodash');
const handler = require('./handle');
const { isSubset } = require('./set');

const METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'];


module.exports = api => Object.entries(api)
  .filter(([pathname, value]) => {
    if (!/^\/.*/.test(pathname) || !_.isPlainObject(value) || _.isEmpty(pathname)) {
      console.error(chalk.red(`pathname: ${pathname} invalid`));
      return false;
    }
    return true;
  })
  .map(([pathname, value]) => {
    if (value.all != null) {
      return [pathname, METHODS.reduce((acc, method) => ({
        ...acc,
        [method.toLowerCase()]: value.all,
      }), {})];
    }
    return [pathname, value];
  })
  .reduce((acc, [pathname, value]) => {
    if (isSubset(new Set(Object.keys(value)
      .map(method => method.toUpperCase())), new Set(METHODS))) {
      return [
        ...acc,
        ...Object.entries(value)
          .map(([method, handle]) => ({
            pathname,
            method: method.toUpperCase(),
            handle,
          }))];
    }
    return [...acc, {
      pathname,
      method: 'GET',
      handle: value,
    }];
  }, [])
  .filter((item) => {
    if (!Object.keys(handler).some(handleName => item.handle[handleName] !== undefined)) {
      console.error(chalk.red(`path: ${item.pathname}, method:${item.method} handle invalid`));
      return false;
    }
    return true;
  })
  .map((item) => {
    const handleNames = Object.keys(handler);
    const handleType = handleNames.find(handleName => item.handle[handleName] !== undefined);
    return {
      pathname: item.pathname,
      method: item.method,
      handleType,
      handle: handler[handleType](item.handle[handleType]),
    };
  });
