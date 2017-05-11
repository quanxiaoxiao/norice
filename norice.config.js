const { PropTypes } = require('quan-prop-types');

module.exports = {
  success: {
    aaa: 'new glogaa success',
  },
  paths: {
    '/quan': {
      status: [200, 400],
      query: {
        name: PropTypes.isRequired,
        age: PropTypes.number,
      },
      success(req, res) {
        res.json({ msg: 'quan function success' });
      },
      error: { msg: 'quan error' },
    },

    '/rice': {
      get: {
        success: {
          code: 0,
          msg: 'get rice ok',
        },
      },

      post: {
        body: {
          name: PropTypes.isRequired,
          age: PropTypes.number,
        },
        success: {
          code: 0,
          msg: 'post rice',
        },
      },
    },

    '/bar': {
    },

    '/foo': {
      success: './data/foo.json',
    },

    '/big': './data/big.json',

    '/manage/dev/list': 'proxy:http://60.190.29.126:6006',

  },
};
