module.exports = stream => new Promise((resolve, reject) => {
  const buf = [];
  let size = 0;
  stream.on('data', (chunk) => {
    buf.push(chunk);
    size += chunk.length;
  });

  const handleEnd = () => {
    resolve(Buffer.concat(buf, size));
  };

  stream.once('end', handleEnd);
  stream.once('error', (error) => {
    stream.off('end', handleEnd);
    stream.destroy();
    reject(error);
  });
});
