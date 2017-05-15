import test from 'ava';
import { resolve } from 'path';
import parseRouter from '../../src/mock/parseRouter';

function Router(obj) {
  return Object.assign({
    status: [200, 400],
    path: '/',
    method: 'get',
    success: {},
    error: {},
    isProxy: false,
    isFile: false,
    validation: {},
  }, obj);
}

test('parseRouter should throw error', (t) => {
  t.throws(() => parseRouter([]));
  t.throws(() => parseRouter('quan'));
  t.throws(() => parseRouter(5));
  t.throws(() => parseRouter(true));
  t.throws(() => parseRouter(false));
  t.throws(() => parseRouter());
  t.throws(() => parseRouter(/quan/));
  class Obj {}
  t.throws(() => parseRouter(new Obj()));
  t.throws(() => parseRouter(Obj));
});

test('parseRouter should pass or unpass', (t) => {
  t.pass(parseRouter({}));
  t.pass(parseRouter({ '/quan': 'quan' }));
  t.pass(parseRouter({ '/quan': '/quan' }));
  t.pass(parseRouter({ '/quan': './quan' }));
  t.pass(parseRouter({ '/quan': '../quan' }));
  t.pass(parseRouter({ '/quan': '../quan/rice' }));
  t.pass(parseRouter({ '/quan': 'http://quan.com' }));
  t.pass(parseRouter({ '/quan': {} }));
  t.throws(() => parseRouter(5));
  t.throws(() => parseRouter(new Date()));
  t.throws(() => parseRouter(/quan/));
  t.throws(() => parseRouter([]));
});

test('parseRouter string type', (t) => {
  t.deepEqual(
    parseRouter({ '/quan': 'http://quan.com' }),
    [Router({ path: '/quan', isProxy: true, success: 'http://quan.com' })],
  );

  t.deepEqual(
    parseRouter({ '/quan': './data/quan.json' }),
    [Router({ path: '/quan', success: resolve(process.cwd(), './data/quan.json'), isFile: true })],
  );
});

test('parseRouter object type', (t) => {
  t.deepEqual(
    parseRouter({ '/quan': {} }),
    [Router({ path: '/quan' })],
  );

  t.deepEqual(
    parseRouter({ '/quan': { status: 400 } }),
    [Router({ path: '/quan', status: [400, 400] })],
  );

  t.deepEqual(
    parseRouter({ '/quan': { status: [200, 500] } }),
    [Router({ path: '/quan', status: [200, 500] })],
  );
});

test('parseRouter will proxy response', (t) => {
  t.deepEqual(
    parseRouter({ '/quan': { success: 'http://quan.com' } }),
    [Router({ path: '/quan', success: 'http://quan.com', isProxy: true })],
  );
});

test('parseRouter will file response', (t) => {
  t.deepEqual(
    parseRouter({ '/quan': { success: 'data/quan.json' } }),
    [Router({ path: '/quan', success: resolve(process.cwd(), 'data/quan.json'), isFile: true })],
  );
});

test('parseRouter will obj response', (t) => {
  t.deepEqual(
    parseRouter({ '/quan': { success: { name: 'quan' } } }),
    [Router({ path: '/quan', success: { name: 'quan' } })],
  );
});

test('parseRouter compoundMock', (t) => {
  const mock = {
    '/quan': {
      get: 'data/quan.json',
      post: {
        success: { msg: 'success' },
      },
    },
  };
  t.is(parseRouter(mock).length, 2);
  /*
  t.deepEqual(
    parseRouter(mock),
    [
      Router({ path: '/quan', success: resolve(process.cwd(), './data/quan.json'), isFile: true }),
      Router({ path: '/quan', success: { msg: 'success' }, method: 'post' }),
    ],
  );
 */
});
