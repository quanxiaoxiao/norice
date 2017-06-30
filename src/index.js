const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const config = require('./config');

// const mockMiddleware = require('./middlewares/mockMiddleware');
const Router = require('./router');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const webpackMiddleware = require('./middlewares/webpackMiddleware');


config.init();

const port = config.getListenerPort() || 3000;

const app = express();
const server = new http.Server(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(loggerMiddleware);
// app.use(mockMiddleware());
app.use(Router());

const wss = require('./webSocket')(server);

app.post('/socket', (req, res) => {
  const chucks = [];
  req.on('data', (chuck) => {
    chucks.push(chuck);
  });
  req.on('end', () => {
    wss.emit('broadcast', Buffer.concat(chucks).toString('utf-8'));
    res.status(204);
    res.end();
  });
});

const webpackPath = config.getWebpack();
if (webpackPath) {
  app.use(webpackMiddleware(webpackPath));
}

server.listen(port, (error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log(`Listening at port: ${port}`);
});
