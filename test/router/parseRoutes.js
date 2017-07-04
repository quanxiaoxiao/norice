import test from 'ava';
import parseRoutes from '../../src/server/router/parseRoutes';

test('parseRoutes', (t) => {
  t.deepEqual(parseRoutes({}), []);
  t.is(parseRoutes({
    quan: './data/aaa.json',
    '/quan': './data/aaa.json',
  }).length, 1);

  t.is(
    parseRoutes({
      '/quan': './data/aaa.json',
      '/foo': 111,
      '/rice': {
        get: './data/qqq.json',
        post: './data/bbb.json',
      },
    }).length,
    3,
  );
});
