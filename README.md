## 安装

```bash
$ npm install -g norice
```

版本要求 Node v8.8.1+

## 启动
norice 或者 norice -p 3001

---

在我目前工作环境下，服务端给个接口，我再根据接口所需要传入的参数和返回的数据格式，来调整前端业务逻辑，有时候碰到服务端跑不起来，手头上的工作就没法再继续了，所以我要有个mock server，首先想到的是[json-server](https://github.com/typicode/json-server)，但是我们服务端接口并不是标准的REST API，而且生成自己想要的数据还是太麻烦，也找不到别的更好的工具了，所以自己动手就写个吧。

我的思路是这样的，启动一个服务，然后会读取相关的配置文件，能够根据配置文件上的url，能够有这些处理：
- 根据url关联到相应的json文件，比如请求路径/aaa，返回./data/aaa.json文件里的数据
- 有代理功能，比如请求路径/bbb?name=aa&age=11，能够代理到http://xxxx.com/aaa?name=aa&age=11
- 能够结合mockjs，faker等这样的工具
- 可以根据请求参数，做出特定的响应
- 对请求参数有校验功能，如果请求参数不匹配，能够通知到客户端
- 能够结合webpack，这样每次新建项目的时候就不用再写webpack server了
- 可以自定义插件(中间件功能)
- 能够热加载
- 能够建立webSocket，并能手动推送消息到客户端

有了需求后，接下来就是实现了
启动项目的时候总有个命令名吧，那就叫norice好了，所以配置文件叫norice.config.js

### 根据url关联到相应的json文件
```javascript
module.exports = {
    paths: {
        '/aaa': './data/.json',    
    },
};
```
---

### 代理功能
```javascript
module.exports = {
    paths: {
        '/aaa': 'http://proxy-path.com',
    },
};
```
可以对特定的路径做出相应的代理，并能够自定义header
```javascript
module.exports = {
    paths: {
        '/aaa/*': {
            options: {
                pathRewrite: {
                    '^/aaa': '',
                },
                headers: {
                    Cookie: 'JSESSIONID=2342342DE234234',
                },
            },
            success: 'http://propx-path.com',
        },
    },  
};
```
这样可以把http://localhost:3000/aaa/111/222，代理到http://proxy-path.com/111/222

---
### 结合mockjs，faker
```javascript
const mock = require('mock');
const faker = require('faker');
const _ = require('lodash');
module.exports = {
    paths: {
        '/faker': ({ json }) => json(_.times(faker.random.number({ min:10, max: 20 }), i => ({
            index: i,
            name: faker.name.findName(),  
        }))),
        '/mockjs': ({ json }) => json(mock.mock({
            'list|1-10': [{
                'id|+1': 1,
            }],
        })),
    },
};
```

### 可以自定义状态码
```javascript
module.exports = {
    paths: {
        '/aaa': {
            status: 400,
            success: {
                msg: 'params error',
            },
        },
    },
};
```
---

### 根据请求参数，做出特定的响应
```javascript
module.exports = {
    paths: {
        '/aaa': ({ json, file, proxy, req }) => {
            const { name } = req.query;
            if (name === 'aaa') {
                json({ name: 'aaa' });
            } else if (name === 'bbb') {
                const convertor = d => ({ ...d, age: 11 });
                file('./data/file.json', convertor);
            } else if (name === 'ccc') {
                const convertor = d => ({ ...d, age: 22 });
                proxy('http://proxy-path.com/some/path', convertor);
            } else {
                throw new Error('no handle');
            }
        },
    },
};
```
---

### 对请求参数有校验的功能
```javascript
module.exports = {
    paths: {
        '/aaa': {
            validate: {
                name: Proptypes.oneOf(['quan', 'rice', 'foo']).isRequired,
                age: Proptypes.number,
                phone: Proptypes.match(/^1\d{10}$/),
                birthday: Proptypes.date('YYYY-MM-DD'), // 格式参考 http://momentjs.com/docs/#/parsing/string-format/
                address: Proptypes.isRequired,
            },
            success: { msg: 'success' },
            error: { msg: 'invalidate' },
        },
    },
};
```
---

### 结合webpack
```javascript
module.exports = {
    webpack: './webpack.config.development.js', // webpack配置参考 https://github.com/glenjamin/webpack-hot-middleware 和 https://github.com/webpack/webpack-dev-middleware
    paths: {},
};
```

---

### 建立webSocket，并能手动推送消息到客户端
![socket](https://user-gold-cdn.xitu.io/2017/11/2/789232d76b99d4517e3523386240b17d)

---

### 热加载
![hot load](https://user-gold-cdn.xitu.io/2017/11/2/233825febe77befb04e1d7558166a9c1)

---

### 自定义插件(中间件功能)
```javascript
const express = require('express');
const compression = rquire('compression');
module.exports = {
    middlewares: [
        compression(),
        express.static(path.resolve(__dirname, 'dist')),
    ],
    paths: {
        '/': './dist/index.html',
        '/quan': './dist/index.html',
        '/rice': {
            success: {
                name: 'rice',
            },
        },
    },
};
```