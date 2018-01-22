const path = require('path');
const shelljs = require('shelljs');

module.exports = config => ({ req, res }) => {
  const { id } = req.params;
  const filePath = path.resolve(config.dir, id);
  if (!shelljs.test('-f', filePath)) {
    res.status(404);
    res.json({ msg: 'file is not exists' });
    return;
  }
  const { fileName } = req.query;
  if (fileName) {
    res.download(filePath, fileName);
  } else {
    res.download(filePath);
  }
  if (config.done) {
    config.done({
      etag: filePath,
      query: req.query,
      type: 'send',
    });
  }
};
