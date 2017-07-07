## Install

```bash
$ npm install -g json-server
```

Requires Node 8+

## Example

Create a `norice.config.json` file

```javascript
const Mock = require('mockjs');
const faker = require('faker');
const _ = require('lodash');

module.exports = {
  paths: {
    '/aaa': {
      success: { msg: 'aaa get request' },
    },
    '/bbb': {
      method: 'post', // support method: get, post, put, delete
      success: { msg: 'bbb post request'},
    },
    '/ccc': './data/local-file.json',
    '/ddd': 'http://localhost:3003',
    '/eee': {
      method: 'all',
      success({ json }) {
        json({
            msg: `request method ${this.method}`,
        });
      },
    },
    '/fff'({ proxy }) {
      function convertor(data) {
          return data.filter(a => a.id === 1);
      }
      proxy('http://localhost:3001', convertor);
    },
    '/ggg'({ file }) {
      function convertor(data) {
          return data.filter(a => a.id === 1);
      }
      file('./data/local-file.json', convertor);
    },
    '/mockjs'({ json }) {
      json(Mock.mock({
        'list|1-10': [{
          'id|+1': 1,
        }],
      }));
    },
    '/faker'({ json }) {
      json(_.times(faker.random.number({ min:10, max: 20 }), (i) => ({
        id: i,
        name: faker.name.findName(),    
      })));
    },
    '/api/*': {
        options: {
            '^/api': '',
        },
        success: 'http://localhot:3001',
    } 
  },
};
```