const _ = require('lodash');
const { resolve } = require('path');
const through = require('through2');
const shelljs = require('shelljs');
const fs = require('fs');
const concatStream = require('concat-stream');
const { parse: urlParse } = require('url');
const request = require('request');
const qs = require('querystring');
const contentType = require('content-type');
const { checkPropTypes } = require('quan-prop-types');
const {
  isHttpURL,
  getSuccessStatusCode,
  getErrorStatusCode,
  getParamsByReq,
  getRecordNameByReq,
} = require('./helper');
const config = require('../../config');

function proxy(host, proxyOptions = {}, record) {
  return (req, res) => {
    const chunks = [];
    const method = req.method.toLowerCase();
    const {
      pathname,
      search,
    } = urlParse(req.url);
    const {
      pathRewrite = {},
      headers = {},
      ...other
    } = proxyOptions;
    const path = Object.keys(pathRewrite).reduce((acc, key) => {
      const reg = new RegExp(key);
      return reg.test(acc) ? acc.replace(reg, pathRewrite[key]) : acc;
    }, pathname);

    const requestOptions = {
      ...other,
      url: `${host}${path || ''}${search || ''}`,
      method,
      headers: {
        ..._.omit(req.headers, ['host', 'cookie', 'referer']),
        ...headers,
      },
    };

    if (method === 'post' || method === 'patch' || method === 'put') {
      const { type } = contentType.parse(req);
      if (type === 'application/json') {
        requestOptions.body = JSON.stringify(req.body);
      } else if (type === 'application/x-www-form-urlencoded') {
        requestOptions.body = qs.stringify(req.body);
      }
    }

    request(requestOptions)
      .on('error', (error) => {
        res.status(500);
        res.json({ error: error.message });
      })
      .pipe(through(function _through(chunk, encode, cb) {
        if (record) {
          chunks.push(chunk);
        }
        this.push(chunk);
        cb();
      }))
      .pipe(res)
      .on('finish', () => {
        if (record && !_.isEmpty(chunks)) {
          const recordFilePath = resolve(process.cwd(), record, path.substring(1));
          if (!shelljs.test('-d', recordFilePath)) {
            shelljs.mkdir('-p', recordFilePath);
          }
          fs.writeFileSync(resolve(recordFilePath, getRecordNameByReq(req)), Buffer.concat(chunks));
        }
      });
  };
}

function file(filePath, record) {
  return (req, res) => {
    if (record) {
      const { path } = req;
      const recordFilePath = resolve(process.cwd(), filePath, record, path.substring(1));
      res.sendFile(resolve(recordFilePath, getRecordNameByReq(req)));
    } else {
      res.sendFile(resolve(process.cwd(), filePath));
    }
  };
}

function json(data) {
  return (req, res) => res.json(data);
}

function fanction(handle) {
  return (req, res, next) => {
    handle({
      req,
      res,
      next,
      json: data => res.json(data),
      proxy: (url, proxyOptions = {}, convert) => {
        const method = req.method.toLowerCase();
        const requestOptions = {
          ...proxyOptions,
          url: (_.isEmpty(req.query) && url) || `${url}?${qs.stringify(req.query)}`,
          method,
        };
        const requestStream = request(requestOptions)
          .on('error', (error) => {
            res.status(500);
            res.json({ error: error.message });
          });
        if (convert) {
          requestStream.pipe(concatStream((chunks) => {
            const data = convert(chunks);
            if (_.isPlainObject(data)) {
              res.json(data);
            } else {
              res.end(data);
            }
          }));
        } else {
          requestStream.pipe(res);
        }
      },
      file: (path, convert) => {
        const filePath = resolve(process.cwd(), path);
        const readStream = fs.createReadStream(filePath);
        if (convert) {
          readStream.pipe(concatStream((chunks) => {
            const data = convert(chunks);
            if (_.isPlainObject(data)) {
              res.json(data);
            } else {
              res.end(data);
            }
          }));
        } else {
          readStream.pipe(res);
        }
      },
    });
  };
}


class Route {
  constructor(path, handle, method = 'get') {
    this.path = path;
    this.method = method;
    if (_.isPlainObject(handle)) {
      const {
        validate,
        record,
        headers,
        success,
        options,
      } = handle;
      this.validate = validate;
      this.record = record;
      this.headers = headers;
      this.options = options;
      this.makeResponse(success == null ?
        config.getGlobalResponseHandle().success : success);
    } else {
      this.makeResponse(handle);
    }
    this.successStatusCode = getSuccessStatusCode(handle.status);
    this.errorStatusCode = getErrorStatusCode(handle.status);
  }

  setHeaders(res) {
    const { headers = {} } = this;
    Object.keys(headers)
      .forEach((key) => {
        res.set(key, headers[key]);
      });
  }

  makeResponse(handle) {
    const { path, options, record } = this;
    if (_.isString(handle)) {
      if (isHttpURL(handle)) {
        this.response = proxy(handle, options, record);
      } else {
        this.response = file(handle, record);
      }
    } else if (_.isFunction(handle)) {
      this.response = fanction(handle);
    } else if (_.isPlainObject(handle) || _.isArray(handle)) {
      this.response = json(handle);
    } else {
      this.response = (req, res) => {
        const msg = `path: ${path}, can't handle this type ${typeof handle}`;
        console.error(msg);
        res.status(500);
        res.json({
          error: msg,
        });
      };
    }
  }

  handleResponse(req, res) {
    try {
      const {
        validate,
        response,
      } = this;
      if (validate) {
        const params = getParamsByReq(req);
        const msg = checkPropTypes(validate, params);
        const isValid = msg === '';
        if (!isValid) {
          res.status(this.errorStatusCode);
          res.json({ error: msg });
        } else {
          this.setHeaders(res);
          res.status(this.successStatusCode);
          response(req, res);
        }
      } else {
        this.setHeaders(res);
        res.status(this.successStatusCode);
        response(req, res);
      }
    } catch (e) {
      res.status(500);
      res.json({
        error: e.message,
      });
    }
  }
}

module.exports = Route;
