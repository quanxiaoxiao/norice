const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const shelljs = require('shelljs');
const calcEtag = require('./etag');
const { swapFile } = require('./helpler');

const MAX_FILE_SIZE = 1024 * 1024 * 10;

module.exports = config => ({ req, res }) => {
  const {
    maxSize = MAX_FILE_SIZE,
    dir,
  } = config;
  console.log(req.headers['content-type'], req.headers['content-length']);
  const fileSize = req.headers['content-length'];
  if (fileSize > maxSize) {
    res.status(413);
    res.json({
      msg: `file exceed max size: ${MAX_FILE_SIZE}`,
    });
    return;
  }

  if (!shelljs.test('-d', dir)) {
    shelljs.mkdir('-p', dir);
  }

  const tempFilePath = path.resolve(config.dir, `temp__${Date.now()}_${_.uniqueId()}`);
  const write = fs.createWriteStream(tempFilePath);
  const chunks = [];
  let size = 0;

  req.on('data', (data) => {
    chunks.push(data);
    write.write(data);
    size += data.length;
  });

  req.on('end', () => {
    write.end();
    const etag = calcEtag(Buffer.concat(chunks, size));
    setTimeout(() => swapFile(tempFilePath, path.resolve(config.dir, etag)), 10);
    res.json({
      etag,
    });
    if (config.done) {
      config.done({
        etag,
        query: req.query,
        type: 'create',
      });
    }
  });

  res.on('error', () => {
    write.end();
    setTimeout(() => fs.unlinkSync(tempFilePath), 10);
  });
};
