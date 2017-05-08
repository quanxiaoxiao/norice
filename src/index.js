const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const config = require('./config');

const mockMiddleware = require('./middlewares/mockMiddleware');

config.init();
const port = 3000;

const app = express();
const server = new http.Server(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(mockMiddleware());


server.listen(port, (error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log(`Listening at port: ${port}`);
});
