const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const shelljs = require('shelljs');
const uuid = require('uuid');
const calcEtag = require('./etag');
const { swapFile, getFilePath } = require('./helper');

const MAX_FILE_SIZE = 1024 * 1024 * 10;

module.exports = config => ({ req, res }) => {
  const {
    maxSize = MAX_FILE_SIZE,
    dir,
    fileRecord,
    success,
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

  const tempFileNamePath = path.resolve(process.cwd(), filePath, `temp__${Date.now()}_${_.uniqueId()}`);
  const write = fs.createWriteStream(tempFileNamePath);
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
    const id = uuid();
    fileRecord.add({ etag, id });
    setTimeout(() => swapFile(tempFileNamePath, path.resolve(process.cwd(), filePath, etag)), 10);
    res.json({ id });
    if (success) {
      success({
        id,
        query: req.query,
        type: 'upload',
      });
    }
  });

  req.on('error', (error) => {
    write.end();
    setTimeout(() => fs.unlinkSync(tempFileNamePath), 10);
    res.status(500);
    res.end(error);
  });
};
