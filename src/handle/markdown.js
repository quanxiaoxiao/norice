const fs = require('fs');
const showdown = require('showdown');

const getFilePath = require('../utils/getFilePath');

const converter = new showdown.Converter({
  tables: true,
  tasklists: true,
  smartIndentationFix: true,
  completeHTMLDocument: true,
});

converter.setFlavor('github');

const mapType = {
  string: pathname => (ctx) => {
    ctx.type = 'html';
    const text = fs.readFileSync(getFilePath(pathname), 'utf-8');
    ctx.body = converter.makeHtml(text);
  },
  function: fn => async (ctx) => {
    const pathname = await fn(ctx);
    ctx.type = 'html';
    const text = fs.readFileSync(getFilePath(pathname), 'utf-8');
    ctx.body = converter.makeHtml(text);
  },
};

const render = (obj) => {
  if (obj == null) {
    return obj;
  }
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  return mapType[type] && mapType[type](obj);
};

module.exports = render;
