const http = require('http');

const request = http.request({
  hostname: '192.168.0.189',
  port: 25804,
  path: '/api/types',
});

request.on('response', (res) => {
  console.log(res.statusCode);
  console.log(res.headers);
});

request.on('error', (error) => {
  console.log(error.toString());
});

request.on('close', () => {
  console.log('close');
});

request.end();
