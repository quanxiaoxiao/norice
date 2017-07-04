const _ = require('lodash');
const { resolve } = require('path');
const fs = require('fs');
const request = require('request');
const { checkPropTypes } = require('quan-prop-types');
const { isHttpURL, getSuccessStatusCode, getErrorStatusCode } = require('./helper');
const config = require('../../config');

const HANDLE_TYPE_JSON = Symbol('json');
const HANDLE_TYPE_FILE = Symbol('file');
const HANDLE_TYPE_PROXY = Symbol('proxy');
const HANDLE_TYPE_FUNCTION = Symbol('function');

class Route {
  constructor(path, handle, method = 'get') {
    this.path = path;
    this.handle = handle;
    this.method = method;
  }

  setType() {
    const response = this.response;
    if (_.isPlainObject(response) || Array.isArray(response)) {
      this.type = HANDLE_TYPE_JSON;
    } else if (_.isFunction(response)) {
      this.type = HANDLE_TYPE_FUNCTION;
    } else if (isHttpURL(response)) {
      this.type = HANDLE_TYPE_PROXY;
    } else {
      this.type = HANDLE_TYPE_FILE;
    }
  }

  setResponse(req, res) {
    const method = this.method;
    const handle = this.handle;
    let isSuccess = true;
    let status;
    if (_.isPlainObject(handle)) {
      const validate = handle.validate || {};
      this.options = handle.options || {};
      status = handle.status;
      if (method === 'get' || method === 'delete') {
        isSuccess = checkPropTypes(validate, req.query);
      } else {
        isSuccess = checkPropTypes(validate, req.body);
      }
      if (isSuccess) {
        this.response = this.handle.success || config.getGlobalResponseHandle().success;
      } else {
        this.response = this.handle.error || config.getGlobalResponseHandle().error;
      }
    } else {
      this.response = this.handle;
    }

    if (isSuccess) {
      res.status(getSuccessStatusCode(status));
    } else {
      res.status(getErrorStatusCode(status));
    }
  }

  handleJsonResponse(req, res) {
    res.json(this.response);
  }

  handleFileResponse(req, res) {
    res.sendFile(resolve(process.cwd(), this.response));
  }

  handleProxyResponse(req, res) {
    let url = req.url;
    const options = this.options || {};
    if (_.isPlainObject(options.pathRewrite)) {
      Object.keys(options.pathRewrite).forEach((key) => {
        const reg = new RegExp(key);
        if (reg.test(url)) {
          url = url.replace(reg, options.pathRewrite[key]);
        }
      });
    }
    const method = req.method.toLowerCase();
    const proxyOptions = Object.assign(
      {},
      _.omit(options, ['pathRewrite', 'headers']),
      {
        headers: Object.assign({}, req.headers, options.headers),
      },
    );
    request[method](`${this.response}${url}`, proxyOptions)
      .on('error', (error) => {
        console.error(error);
        res.send(error.msg);
      })
      .pipe(res);
  }

  handleFunctionResponse(req, res) {
    this.response.call(req, {
      json: data => res.json(data),
      proxy: (url, dataConvertor = _.identity, options = {}) => {
        const method = req.method.toLowerCase();
        request[method](url, options, (error, _res, body) => {
          if (error) {
            res.send(error.msg);
          } else {
            try {
              const data = JSON.parse(body);
              res.json(dataConvertor(data));
            } catch (e) {
              console.error(e);
              res.send(`path: ${this.path} parse json error`);
            }
          }
        });
      },
      file: (path, dataConvertor = _.identity) => {
        try {
          const data = JSON.parse(fs.readFileSync(path));
          res.json(dataConvertor(data));
        } catch (e) {
          console.error(e);
          res.send(`path: ${this.path} parse json error`);
        }
      },
    });
  }

  handleResponse(req, res, next) {
    this.setResponse(req, res);
    this.setType();
    const map = {
      [HANDLE_TYPE_JSON]: 'handleJsonResponse',
      [HANDLE_TYPE_FILE]: 'handleFileResponse',
      [HANDLE_TYPE_PROXY]: 'handleProxyResponse',
      [HANDLE_TYPE_FUNCTION]: 'handleFunctionResponse',
    };
    const handleType = map[this.type];
    this[handleType](req, res, next);
  }
}

module.exports = Route;


Route.HANDLE_TYPE_JSON = HANDLE_TYPE_JSON;
Route.HANDLE_TYPE_FILE = HANDLE_TYPE_FILE;
Route.HANDLE_TYPE_PROXY = HANDLE_TYPE_PROXY;
Route.HANDLE_TYPE_FUNCTION = HANDLE_TYPE_FUNCTION;
