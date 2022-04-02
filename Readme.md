## Install

```shell
npm install -g norice
```

norice.config.js

```javascript
const path = require('path');

module.exports = {
  webpackDev: require('./webpack.dev.js'),
  api: {
    '/uis': {
      get: {
        body: () => {
          const base = path.resolve(__dirname, 'uis');
          return photoDisplay(base, '/ui');
        },
      },
    },
    '/ui/(.*)': {
      get: {
        file: (ctx) => path.resolve(__dirname, 'uis', decodeURIComponent(ctx.matchs[1])),
      },
    },
  },
};
```
