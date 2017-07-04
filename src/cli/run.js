const config = require('../config');

config.init();

module.exports = (argv) => {
  const server = require('../server');
  const app = server();
  const port = argv.port;
  app.listen(port, (error) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log(`Listening at port: ${port}`);
  });
};
