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
  deploy: {
    hostname: 'localhost',
    port: 3099,
    headers: {
      'x-quan-name': 'demo',
      'x-quan-key': '2VCap3jg8b0BrFlOvNkQi4Sd7XytKTGq',
    },
  },
  api: {
    '/uis': {
      body: () => {
        const base = path.resolve(__dirname, 'uis');
        return photoDisplay(base, '/ui');
      },
    },
    '/ui/(.*)': {
      file: (ctx) => path.resolve(__dirname, 'uis', decodeURIComponent(ctx.matchs[1])),
    },
  },
};
```
