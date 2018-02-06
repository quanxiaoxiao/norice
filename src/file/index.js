const shelljs = require('shelljs');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const upload = require('./upload');
const remove = require('./remove');
const download = require('./download');

let fileRecord;
const RECORD_FILENAME = '_quan_file.json';

const getFileRecord = (filePath) => {
  if (fileRecord) {
    return fileRecord;
  }
  const filePathName = path.resolve(filePath, RECORD_FILENAME);
  if (!shelljs.test('-f', filePathName)) {
    shelljs.mkdir('-p', filePath);
    fileRecord = {};
    fs.writeFileSync(filePathName, JSON.stringify(fileRecord));
  } else {
    fileRecord = JSON.parse(fs.readFileSync(filePathName));
  }
  return fileRecord;
};

const recordFile = () => {
  const filePath = process.cwd();
  const filePathName = path.resolve(filePath, RECORD_FILENAME);
  const _files = getFileRecord(filePath);
  return {
    add: ({ id, etag }) => {
      if (!_files[etag]) {
        _files[etag] = [id];
      } else {
        _files[etag] = [..._files[etag], id];
      }
      fs.writeFileSync(filePathName, JSON.stringify(_files));
    },

    remove: (id) => {
      const etag = Object.keys(_files).find(key => _files[key].indexOf(id) !== -1);
      if (etag) {
        const ids = _files[etag].filter(a => a !== id);
        if (_.isEmpty(ids)) {
          delete _files[etag];
        } else {
          _files[etag] = ids;
        }
        fs.writeFileSync(filePathName, JSON.stringify(_files));
      }
      return etag;
    },

    getIdsByEtag: etag => _files[etag],

    getEtagById: id =>
      Object.keys(_files).find(etag => _files[etag].indexOf(id) !== -1),
  };
};

module.exports = {
  uploadFile: upload,
  removeFile: remove,
  downloadFile: download,
  recordFile,
};
