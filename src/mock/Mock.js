const _ = require('lodash');
const request = require('request');
const { resolve } = require('path');
const {
  isHttpURL,
  getSuccessStatusCode,
  getErrorStatusCode,
} = require('./helper');

const NORMAL = 0;
const FILE = 1;
const PROXY = 2;

class Mock {
  constructor(path, mock, req, res) {
    this.path = path;
    this.res = res;
    this.req = req;
    if (_.isString(mock)) {
      mock = {
        success: mock,
      };
    }
    this.parse(mock);
  }

  parse(mock) {
    const { status, options = {}, method = 'get' } = mock;
    let success = mock.success;
    this.status = [getSuccessStatusCode(status), getErrorStatusCode(status)];
    this.method = method;
    this.options = options;
    if (_.isString(success)) {
      if (isHttpURL(success)) {
        this.type = PROXY;
      } else {
        this.type = FILE;
        success = resolve(process.cwd(), success);
      }
    } else {
      this.type = NORMAL;
    }
    this.success = success || {};
  }

  handleResponse() {
    if (this.type === FILE) {
      this.res.sendFile(this.success);
    } else if (this.type === PROXY) {
      const req = this.req;
      const options = {
        url: `${this.success}${req.url}`,
        headers: Object.assign({}, req.headers),
      };
      request.get(options).pipe(this.res);
    } else {
      this.res.json(this.success);
    }
  }
}

module.exports = Mock;

Mock.NORMAL = NORMAL;
Mock.FILE = FILE;
Mock.PROXY = PROXY;
