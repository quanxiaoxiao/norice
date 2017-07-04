const WebSocket = require('ws');
const config = require('../config');

module.exports = function webSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      console.log('message', data);
    });

    ws.on('close', () => {
      console.log('socket close');
    });
  });

  wss.on('broadcast', (msg) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  const webSocketConfig = config.getWebSocketConfig();
  if (webSocketConfig) {
    let proxyHost;
    if (typeof webSocketConfig === 'string') {
      proxyHost = webSocketConfig;
    } else {
      proxyHost = webSocketConfig.url;
    }
    const ws = new WebSocket(proxyHost, webSocketConfig.options || {});
    ws.on('open', () => {
      console.log(`socket host: ${proxyHost} open`);
    });

    ws.on('close', () => {
      console.log(`socket host: ${proxyHost} close`);
    });

    ws.on('error', (error) => {
      console.log(`socket host: ${proxyHost} error ${error.message}`);
    });

    ws.on('message', (message) => {
      console.log(`receive: ${message}`);
      wss.emit('broadcast', message);
    });
  }

  return wss;
};
