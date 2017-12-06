const _ = require('lodash');
const { resolve } = require('path');
const fs = require('fs');
const request = require('request');
const qs = require('querystring');
const { checkPropTypes } = require('quan-prop-types');
const { isHttpURL, getSuccessStatusCode, getErrorStatusCode } = require('./helper');
const config = require('../../config');

function proxy(href, options = {}) {
  return (req, res) => {
    const method = req.method.toLowerCase();
    let { url } = req;
    if (_.isPlainObject(options.pathRewrite)) {
      Object.keys(options.pathRewrite).forEach((key) => {
        const reg = new RegExp(key);
        if (reg.test(url)) {
          url = url.replace(reg, options.pathRewrite[key]);
        }
      });
    }
    request[method](`${href}${url}`, {
      ..._.omit(options, ['pathRewrite', 'headers']),
      headers: {
        ..._.omit(req.headers, ['host', 'Host', 'cookie', 'Cookie', 'referer', 'Referer']),
        ...(options.headers || {}),
      },
    })
      .on('error', (error) => {
        console.error(error.message);
        res.status(500);
        res.json({
          error: error.message,
        });
      })
      .pipe(res);
  };
}

function file(path) {
  return (req, res) => {
    const filePath = resolve(process.cwd(), path);
    fs.accessSync(filePath);
    res.sendFile(filePath);
  };
}

function json(data) {
  return (req, res) => {
    res.json(data);
  };
}

function fanction(handle) {
  return (req, res) => {
    handle({
      req,
      json: data => res.json(data),
      proxy: (url, dataConvertor = _.identity, options = {}) => {
        const method = req.method.toLowerCase();
        const proxyUrl = _.isEmpty(req.query) ? url : `${url}?${qs.stringify(req.query)}`;
        request[method](proxyUrl, options, (error, _res, body) => {
          if (error) {
            res.status(500);
            res.json({
              error: error.message,
            });
            return;
          }
          try {
            const data = JSON.parse(body);
            res.json(dataConvertor(data));
          } catch (e) {
            res.status(500);
            res.json({
              error: e.message,
            });
          }
        });
      },
      file: (path, dataConvertor = _.identity) => {
        const data = JSON.parse(fs.readFileSync(path));
        res.json(dataConvertor(data));
      },
    });
  };
}


class Route {
  constructor(path, handle, method = 'get') {
    this.path = path;
    this.method = method;
    if (_.isPlainObject(handle)) {
      if (handle.validate) {
        this.validate = handle.validate;
      }
      this.options = handle.options || {};
      this.makeResponse(handle.success || config.getGlobalResponseHandle().success);
    } else {
      this.makeResponse(handle);
    }
    this.successStatusCode = getSuccessStatusCode(handle.status);
    this.errorStatusCode = getErrorStatusCode(handle.status);
  }

  makeResponse(handle) {
    const { path } = this;
    if (_.isString(handle)) {
      if (isHttpURL(handle)) {
        this.response = proxy(handle, this.options);
      } else {
        this.response = file(handle);
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
        method,
        response,
      } = this;
      if (validate) {
        const params = (method === 'get' || method === 'delete') ? req.query : req.body;
        const msg = checkPropTypes(validate, params);
        const isValid = msg === '';
        if (!isValid) {
          res.status(this.errorStatusCode);
          res.json({ error: msg });
        } else {
          res.status(this.successStatusCode);
          response(req, res);
        }
      } else {
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
