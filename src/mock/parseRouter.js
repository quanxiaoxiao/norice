const _ = require('lodash');
const Mock = require('./Mock');
const {
  isCompoundMock,
} = require('./helper');


module.exports = function paraseRouter(paths) {
  if (!_.isPlainObject(paths)) {
    console.error('`paths` must plain object');
    paths = {};
  }
  const keys = Object.keys(paths);
  const mocks = [];
  for (let i = 0; i < keys.length; i++) {
    const path = keys[i];
    const mock = paths[path];
    if (isCompoundMock(mock)) {
      const methods = Object.keys(mock);
      for (let j = 0; j < methods.length; j++) {
        mocks.push(new Mock(path, Object.assign({}, mock[methods[j]], {
          method: methods[j],
        })));
      }
    } else {
      mocks.push(new Mock(path, mock));
    }
  }
  return mocks;
};
