const httpForward = require('./httpForward');

const fetch = async ({
  hostname,
  path,
  port,
  socket,
  ...other
}) => {
  const data = await new Promise((resolve, reject) => {
    let isHandle = false;
    httpForward({
      hostname,
      path,
      port,
      ...other,
    }, socket, (error, ret) => {
      if (isHandle) {
        return;
      }
      if (error) {
        reject();
        isHandle = true;
      } else if (Buffer.isBuffer(ret)) {
        try {
          resolve(ret);
        } catch (err) {
          reject(err);
        } finally {
          isHandle = true;
        }
      } else if (ret.statusCode !== 200) {
        reject();
        isHandle = true;
      }
    });
  });
  return data;
};

module.exports = fetch;
