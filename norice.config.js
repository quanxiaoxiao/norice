module.exports = {
  paths: {
    '/quan': {
      status: [200, 400],
      success: {
        code: 0,
        msg: 'quans',
      },
    },

    '/rice': {
      get: {
        success: {
          code: 0,
          msg: 'get rice ok',
        },
      },

      post: {
        success: {
          code: 0,
          msg: 'post rice',
        },
      },
    },

    '/foo': {
      success: './data/foo.json',
    },

    '/big': './data/big.json',

    '/manage/dev/list': 'proxy:http://60.190.29.126:6006',

  },
};
