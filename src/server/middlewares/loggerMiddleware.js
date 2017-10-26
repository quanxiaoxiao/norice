const moment = require('moment');
const _ = require('lodash');

function loggerMiddleware(req, res, next) {
  const time = moment().format('HH:mm:ss');
  const {
    hostname: host,
    query,
    method,
    body,
    path,
  } = req;

  let logger = `host:${host} method:${method} -- path:${path}`;
  if (!_.isEmpty(query)) {
    logger = `${logger} -- query:${JSON.stringify(query)}`;
  }
  if (!_.isEmpty(body)) {
    logger = `${logger} -- body:${JSON.stringify(body)}`;
  }

  res.on('finish', () => {
    console.log(`time:${time} -- status:${res.statusCode} -- ${logger}`);
  });

  next();
}

module.exports = loggerMiddleware;
