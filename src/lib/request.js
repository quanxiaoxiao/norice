const http = require('http');
const https = require('https');

module.exports = ({
  hostname,
  port = 80,
  headers,
  method = 'GET',
  path,
}) => new Promise((resolve, reject) => {
  const req = (port === 443 ? https : http)
    .request({
      hostname,
      port,
      path,
      headers,
      method,
    });

  const handleResposne = (res) => {
    if (res.statusCode === 200) {
      const buf = [];
      res.on('data', (chunk) => {
        buf.push(chunk);
      });
      res.once('end', () => {
        resolve(Buffer.concat(buf));
      });
    } else {
      reject();
    }
  };

  req.once('response', handleResposne);

  req.once('error', () => {
    req.off('response', handleResposne);
    reject();
  });

  req.end();
});
