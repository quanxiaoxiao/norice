const webSocket = require('ws');

const wss = new webSocket.Server({
  noServer: true,
});

module.exports = cb => (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    cb(ws, wss);
  });
};
