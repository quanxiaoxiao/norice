/* eslint no-use-before-define: 0 */

const onFinished = require('on-finished');

const fromReadable = (stream) => {
  if (!stream.readable) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    if (!stream.readable) {
      resolve([]);
      return;
    }
    let arr = [];
    let size = 0;

    stream.on('data', onData);
    stream.on('error', onEnd);
    stream.on('end', onEnd);
    stream.on('close', onClose);

    function onData(chunk) {
      size += chunk.length;
      arr.push(chunk);
    }

    function onEnd(error) {
      if (error) {
        reject(error);
      } else {
        resolve(Buffer.concat(arr, size));
      }
      cleanup();
    }

    function onClose() {
      resolve(Buffer.concat(arr, size));
      cleanup();
    }

    function cleanup() {
      arr = null;
      size = 0;
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onEnd);
      stream.removeListener('close', onClose);
    }
  });
};

const fromWritable = stream => new Promise((resolve, reject) => {
  onFinished(stream, (err) => {
    (err ? reject : resolve)(err);
  });
});


module.exports = (stream) => {
  if (stream.readable) {
    return fromReadable(stream);
  } if (stream.writable) {
    return fromWritable(stream);
  }
  return Promise.resolve();
};
