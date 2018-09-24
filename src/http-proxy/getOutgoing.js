const url = require('url');
const _ = require('lodash');

module.exports = (ctx, options) => {
  if (options == null) {
    return null;
  }

  let target;
  if (_.isString(options)) {
    target = options;
    options = {};
  } else {
    target = options.url;
    options = _.omit(options, ['url']);
  }
  if (!target || !/^https?:\/\/\w+/.test(target)) {
    return null;
  }
  const {
    hostname,
    port,
    query,
    pathname,
  } = url.parse(target);
  let path;
  if (pathname === '/') {
    path = `${ctx.path}?${ctx.querystring}`;
  } else {
    path = `${pathname}?${query || ctx.querystring}`;
  }
  return {
    hostname,
    path,
    port: Number(port) || 80,
    method: ctx.method,
    headers: _.omit(ctx.headers, ['host']),
    ...options,
  };
};
