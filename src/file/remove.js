const path = require('path');
const shelljs = require('shelljs');
const { getFilePath } = require('./helper');

module.exports = config => ({ req, res }) => {
  const { id } = req.params;
  const filePath = path.resolve(getFilePath(config.dir, req), id);
  if (shelljs.test('-f', filePath)) {
    shelljs.rm('-f', filePath);
  }
  if (config.success) {
    config.success({
      etag: filePath,
      query: req.query,
      type: 'remove',
    });
  }
  res.json({ msg: 'ok', etag: id });
};
