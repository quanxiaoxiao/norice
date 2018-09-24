const http = require('http');
const { PassThrough } = require('stream');

const upgradeShim = proxyReq => new Promise((resolve, reject) => {
  proxyReq.once('response', (res) => {
    if (!res.upgrade) {
      reject(res);
    }
  });

  proxyReq.once('upgrade', (proxyRes, proxySocket) => {
    resolve({
      proxyRes,
      proxySocket,
    });
  });

  proxyReq.end();
});

module.exports = cb => async (ctx) => {
  if (!ctx.headers.upgrade || ctx.headers.upgrade.toLowerCase() !== 'websocket') {
    ctx.req.socket.destroy();
    return;
  }
  const passThrough = new PassThrough();
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/socket',
    headers: ctx.headers,
  });
  const { proxyRes, proxySocket } = await upgradeShim(proxyReq);
  ctx.status = 101;
  ctx.set(proxyRes.headers);
  proxySocket.pipe(passThrough);

  ctx.body = passThrough;
};
