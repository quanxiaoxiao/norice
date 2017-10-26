const config = require('../config');

config.init();

module.exports = ({ port }) => {
  const server = require('../server');
  const app = server();
  app.listen(port, (error) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log(`Listening at port: ${port}`);
  });
};
