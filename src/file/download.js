const path = require('path');
const shelljs = require('shelljs');
const { getFilePath } = require('./helper');

module.exports = config => ({ req, res }) => {
  const { id } = req.params;
  const {
    success,
    fileRecord,
    dir,
  } = config;
  const etag = fileRecord.getEtagById(id);
  if (!etag) {
    res.status(404);
    res.json({ msg: 'file is not exists' });
    return;
  }
  const filePathName = path.resolve(getFilePath(dir, req), etag);
  if (!shelljs.test('-f', filePathName)) {
    res.status(404);
    res.json({ msg: 'file is not exists' });
    return;
  }
  const { fileName } = req.query;
  if (fileName) {
    res.download(filePathName, fileName);
  } else {
    res.download(filePathName);
  }
  if (success) {
    success({
      id,
      query: req.query,
      type: 'download',
    });
  }
};
