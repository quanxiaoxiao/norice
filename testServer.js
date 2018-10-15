const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/test') {
    res.write('3333\n');
    setTimeout(() => {
      console.log('response');
      res.write('asdfdf\n');
      setTimeout(() => {
        console.log('end');
        res.end('888888888\n');
      }, 3000);
    }, 2000);
  }
});

server.listen(8088);
