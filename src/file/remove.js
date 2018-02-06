const _ = require('lodash');
const shelljs = require('shelljs');
const { getFilePath } = require('./helper');
const path = require('path');

module.exports = config => ({ req, res }) => {
  const { id } = req.params;
  const {
    success,
    fileRecord,
    dir,
  } = config;
  const etag = fileRecord.remove(id);
  if (etag) {
    res.json({ msg: 'ok' });
    const ids = fileRecord.getIdsByEtag(etag);
    const filePathName = path.resolve(getFilePath(dir, req), etag);
    if (success) {
      success({
        id,
        query: req.query,
        type: 'remove',
      });
    }
    if (_.isEmpty(ids)) {
      shelljs.rm('-f', filePathName);
    }
  } else {
    res.status(400);
    res.json({ msg: 'fail' });
  }
};
