import test from 'ava';
import { resolve } from 'path';
import Mock, { PROXY, FILE, NORMAL } from '../../src/mock/Mock';

test('Mock -> file', (t) => {
  let mock = new Mock('/quan', './data/quan.json');
  t.is(mock.type, FILE);
  t.is(mock.path, '/quan');
  t.is(mock.success, resolve(process.cwd(), './data/quan.json'));

  mock = new Mock('/quan', {
    success: './data/quan.json',
  });
  t.is(mock.type, FILE);
  t.is(mock.path, '/quan');
  t.is(mock.success, resolve(process.cwd(), './data/quan.json'));
  t.deepEqual(mock.status, [200, 400]);
});

test('Mock -> proxy', (t) => {
  let mock = new Mock('/quan', 'http://quan.com');
  t.is(mock.type, PROXY);
  t.is(mock.success, 'http://quan.com');

  mock = new Mock('/quan', {
    success: 'http://quan.com',
  });
  t.is(mock.path, '/quan');
  t.is(mock.type, PROXY);
  t.is(mock.success, 'http://quan.com');
  t.deepEqual(mock.status, [200, 400]);
});

test('Mock -> normal', (t) => {
  let mock = new Mock('/quan', {});
  t.is(mock.type, NORMAL);
  t.deepEqual(mock.success, {});
  t.is(mock.method, 'get');
  t.deepEqual(mock.status, [200, 400]);

  mock = new Mock('/quan', {
    method: 'post',
    status: [201, 500],
    success: { msg: 'quan' },
  });
  t.is(mock.method, 'post');
  t.deepEqual(mock.success, { msg: 'quan' });
  t.deepEqual(mock.status, [201, 500]);
});
