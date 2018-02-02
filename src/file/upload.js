const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const shelljs = require('shelljs');
const calcEtag = require('./etag');
const { swapFile, getFilePath } = require('./helper');

const MAX_FILE_SIZE = 1024 * 1024 * 10;

module.exports = config => ({ req, res }) => {
  const {
    maxSize = MAX_FILE_SIZE,
    dir,
  } = config;
  const fileSize = req.headers['content-length'];
  if (fileSize > maxSize) {
    res.status(413);
    res.json({
      msg: `file exceed max size: ${MAX_FILE_SIZE}`,
    });
    return;
  }

  const filePath = getFilePath(dir, req);

  if (!shelljs.test('-d', filePath)) {
    shelljs.mkdir('-p', filePath);
  }

  const tempFilePath = path.resolve(filePath, `temp__${Date.now()}_${_.uniqueId()}`);
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
    setTimeout(() => swapFile(tempFilePath, path.resolve(filePath, etag)), 10);
    res.json({
      etag,
    });
    if (config.success) {
      config.success({
        etag,
        query: req.query,
        type: 'upload',
      });
    }
  });

  res.on('error', () => {
    write.end();
    setTimeout(() => fs.unlinkSync(tempFilePath), 10);
  });
};
