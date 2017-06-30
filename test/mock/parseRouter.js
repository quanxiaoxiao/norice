import test from 'ava';
import parseRouter from '../../src/mock/parseRouter';

test('parseRouter should pass or unpass', (t) => {
  t.pass(parseRouter({}));
  t.pass(parseRouter({ '/quan': 'quan' }));
  t.pass(parseRouter({ '/quan': '/quan' }));
  t.pass(parseRouter({ '/quan': './quan' }));
  t.pass(parseRouter({ '/quan': '../quan' }));
  t.pass(parseRouter({ '/quan': '../quan/rice' }));
  t.pass(parseRouter({ '/quan': 'http://quan.com' }));
  t.pass(parseRouter({ '/quan': {} }));

  t.is(
    parseRouter({ '/quan': './data/quan.json' }).length,
    1,
  );
  t.is(
    parseRouter({ '/quan': './data/quan.json', '/rice': './data/rice.json' }).length,
    2,
  );

  const mocks = parseRouter({
    '/quan': './data/quan.json',
    '/rice': {
      get: {},
      post: {},
    },
  });

  t.is(
    mocks.length,
    3,
  );

  t.is(mocks[2].method, 'post');
  t.is(mocks[2].path, '/rice');
  t.is(mocks[1].method, 'get');
  t.is(mocks[1].path, '/rice');
});

