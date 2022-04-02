## Install

```shell
npm install -g norice
```

write config `norice.config.js`

```javascript
const path = require('path');

module.exports = {
  webpackDev: require('./webpack.dev.js'),
  api: {
    '/test': {
      get: {
        body: () => 'hello world!',
      },
    },
  },
};
```

## run

```shell
$ norice -p 3000
```
