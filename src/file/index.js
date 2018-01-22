const create = require('./create');
const remove = require('./remove');
const send = require('./send');

module.exports = {
  createFile: create,
  removeFile: remove,
  sendFile: send,
};
