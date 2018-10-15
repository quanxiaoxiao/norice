const http = require('http');
const HttpProxy = require('./src/http-proxy/HttpProxy');

const server = http.createServer((req, res) => {
  const aa = new HttpProxy({ req, res }, {
    hostname: '127.0.0.1',
    port: 8088,
    path: '/test',
    method: 'GET',
  });
  aa.pipe(res);
});

server.listen(3001);
