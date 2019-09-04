const url = require('url');
const http = require('http');
const https = require('https');
const _ = require('lodash');

module.exports = (ctx, options) => {
  if (_.isEmpty(options)) {
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
  if (pathname === '/' || !pathname) {
    path = ctx.originalUrl;
  } else {
    path = `${pathname}?${query || ctx.querystring}`;
  }
  return {
    schema: /^https/.test(target) ? https : http,
    hostname,
    path,
    port: parseInt(port, 10) || (/^https/.test(target) ? 443 : 80),
    method: ctx.method,
    headers: _.omit(ctx.headers, ['host']),
    ...options,
  };
};
