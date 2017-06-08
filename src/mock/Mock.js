const _ = require('lodash');
const request = require('request');
const { checkPropTypes } = require('quan-prop-types');
const { resolve } = require('path');
const {
  isHttpURL,
  getSuccessStatusCode,
  getErrorStatusCode,
} = require('./helper');

const NORMAL = 0;
const FILE = 1;
const PROXY = 2;
const UNKOWN = 3;

class Mock {
  constructor(path, mock) {
    this.path = path;
    this.mock = mock;
    this.method = 'get';
    if (_.isPlainObject(mock) && mock.method) {
      this.method = mock.method;
    }
  }

  parseResponse(_mock) {
    const mock = _mock || this.mock;
    let response;
    if (_.isString(mock)) {
      response = mock;
    } else {
      const { error, success } = mock;
      if (!this.isSuccess) {
        response = error;
      } else {
        response = success;
      }
    }

    switch (typeof response) {
      case 'string': {
        if (isHttpURL(response)) {
          this.type = PROXY;
        } else {
          this.type = FILE;
          response = resolve(process.cwd(), response);
        }
        break;
      }
      case 'object':
      case 'function': {
        this.type = NORMAL;
        break;
      }
      default:
        this.type = UNKOWN;
        break;
    }
    return response;
  }

  response(req, res, next, response) {
    const type = this.type;
    const { options = {} } = this.mock;
    if (type === UNKOWN) {
      next();
    } else {
      switch (type) {
        case FILE:
          res.sendFile(response);
          break;
        case PROXY: {
          let url = req.url;
          if (_.isPlainObject(options.pathRewrite)) {
            Object.keys(options.pathRewrite).forEach((key) => {
              const reg = new RegExp(key);
              if (reg.test(url)) {
                url = url.replace(reg, options.pathRewrite[key]);
              }
            });
          }
          request.get({
            url: `${response}${url}`,
            headers: Object.assign({}, options.headers, req.headers),
          }).pipe(res).on('error', () => {});
          break;
        }
        case NORMAL: {
          if (_.isFunction(response)) {
            this.req = req;
            this.res = res;
            response.call(res, (data) => {
              res.json(data);
            });
          } else {
            res.json(response);
          }
          break;
        }
        default: break;
      }
    }
  }

  handleResponse(req, res, next) {
    const method = this.method;
    const { validate = {}, status } = this.mock;
    if (method === 'get' || method === 'delete') {
      this.isSuccess = checkPropTypes(validate, req.query);
    } else {
      this.isSuccess = checkPropTypes(validate, req.body);
    }

    if (this.isSuccess) {
      res.status(getSuccessStatusCode(status));
    } else {
      res.status(getErrorStatusCode(status));
    }

    res.mock = this;

    const response = this.parseResponse();
    this.response(req, res, next, response);
  }

  _handleResponse(req, res, next, mock) {
    const { status } = mock;
    const response = this.parseResponse(mock);
    if (this.isSuccess) {
      res.status(getSuccessStatusCode(status));
    } else {
      res.status(getErrorStatusCode(status));
    }
    this.response(req, res, next, response);
  }
}

module.exports = Mock;

Mock.NORMAL = NORMAL;
Mock.FILE = FILE;
Mock.PROXY = PROXY;
Mock.UNKOWN = UNKOWN;
