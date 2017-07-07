## Install

```bash
$ npm install -g norice
```

Requires Node 8+

## run
norice or norice -p 3001

default port is 3000

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
      const someOptions = {}; // reference https://github.com/request/request
      proxy('http://localhost:3001', convertor, someOptions);
    },
    '/ggg'({ file }) {
      function convertor(data) {
          return data.filter(a => a.id === 1);
      }
      file('./data/local-file.json', convertor);
    },
    '/hhh': {
      get: {
        success: {
          msg: 'get method',
        }
      },
      post: {
        success: {
          msg: 'post method',
        },        
      },
      put({ json }) {
        json({
          msg: 'put method',
        });
      },
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

### Verify the field
```javascript
const PropTypes = require('quan-prop-types');

module.exports = {
  paths: {
    '/aaa': {
      status: [200, 400],
      validate: {
        name: PropTypes.isRequired,
        age: PropTypes.match(/^[1-9]([0-9])?$/).isRequired,
        birthday: PropTypes.date('YYYY-MM-DD'),
      },
      success: {
        msg: 'ok',  
      },
      error: {
        msg: 'validate error',
      },
    },
    '/bbb': {
      validate: {
        age: PropTypes.number,
      },
    },
  },
  handle: {
    success({ json }) {
      json({
        msg: 'this is global success handle',
      });
    },
    error: {
      msg: 'this is global error handle',
    },
  },
};
```
