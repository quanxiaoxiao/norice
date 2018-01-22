const path = require('path');
const shelljs = require('shelljs');

module.exports = config => ({ req, res }) => {
  const { id } = req.params;
  const filePath = path.resolve(config.dir, id);
  if (shelljs.test('-f', filePath)) {
    shelljs.rm('-f', filePath);
  }
  if (config.done) {
    config.done({
      etag: filePath,
      query: req.query,
      type: 'remove',
    });
  }
  res.json({ msg: 'ok', etag: id });
};
