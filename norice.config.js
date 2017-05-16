const ProTypes = require('quan-prop-types');

const paths = {
  '/quan': {
    status: [200, 500],
    validate: {
      name: ProTypes.isRequired,
      age: ProTypes.number,
    },
    success: {
      code: 0,
      msg: 'quan',
    },
    error: {
      code: 50,
      msg: 'error',
    },
  },

  '/rice': {
    get: {
      stauts: 200,
      validate: {
        name: ProTypes.isRequired,
      },
      success(done) {
        console.log(this.req.path);
        done({ msg: 'rice' });
      },
    },

    post: {
      body: {
        name: ProTypes.isRequired,
        age: ProTypes.number,
      },
      stauts: 200,
      success: { name: 'post rice --------' },
      error: {
        code: 50,
        msg: 'error',
      },
    },
  },

  '/foo': {
    success: './data/quan.json',
  },

  '/big': {
    validate: {
      name: ProTypes.isRequired,
    },

  },
  '/api/*': {
    options: {
      pathRewrite: {
        '^/api/': '/',
      },
      headers: {
        Cookie: 'JSESSIONID=730486B33542CA24EE1BC1418D79304E',
      },
    },
    success: 'http://60.190.29.126:6006',
  },

};

module.exports = {
  paths,
  global: {
    status: [201, 501],
    success: './data/global-success.json',
    error: {
      msg: 'global error',
    },
  },
};
