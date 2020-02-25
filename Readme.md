## Install

```shell
npm install -g norice
```

norice.config.js

```javascript
const path = require('path');
const photoDisplay = require('photo-display');

module.exports = {
  webpackDev: require('./webpack.dev.js'),
  webpackProd: require('./webpack.prod.js'),
  deployUrl: 'http://demo:2VCap3jg8b0BrFlOvNkQi4Sd7XytKTGq@192.168.0.111:3088/quanresource',
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
