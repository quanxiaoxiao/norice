const upload = require('./upload');
const remove = require('./remove');
const download = require('./download');

module.exports = {
  uploadFile: upload,
  removeFile: remove,
  downloadFile: download,
};
