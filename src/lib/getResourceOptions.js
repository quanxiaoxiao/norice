const url = require('url');

module.exports = (deployUrl) => {
  if (!/^https?:\/\/\w+/.test(deployUrl)) {
    throw new Error('deployUrl invalid');
  }
  const parser = url.parse(deployUrl);
  if (!parser.auth) {
    throw new Error('not have auth');
  }
  const result = {
    port: parser.port // eslint-disable-line
      ? parseInt(parser.port, 10)
      : (parser.protocol === 'https:' ? 443 : 80),
    prefix: parser.path === '/' ? '' : parser.path,
    hostname: parser.hostname,
    protocol: parser.protocol,
    headers: {
      'x-quan-name': parser.auth.split(':')[0],
      'x-quan-key': parser.auth.split(':')[1],
      'accept-encoding': 'identity',
    },
  };
  return result;
};
