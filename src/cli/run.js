const http = require('http');
const WebSocket = require('ws');

module.exports = ({ port }) => {
  const app = require('../app');
  const server = http.createServer(app.callback());

  const wss = new WebSocket.Server({ server });
  wss.on('error', () => {});
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      console.log('message', data);
    });

    ws.on('close', () => {
      console.log('socket close');
    });

    ws.on('error', () => {});
  });

  server.listen(port, () => {
    console.log(`Listening at port: ${port}`);
  });
};
