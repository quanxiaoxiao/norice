import test from 'ava';
import getOutgoing from '../../src/http-proxy/getOutgoing';

const ctx = {
  method: 'GET',
  path: '/quan',
  headers: {
    host: 'quan.com',
    'user-agent': 'quan',
  },
  querystring: 'name=888',
};

test('null', (t) => {
  let options = getOutgoing({});
  t.is(options, null);
  options = getOutgoing(ctx, '');
  t.is(options, null);
  options = getOutgoing(ctx, '/aaa/bbb');
  t.is(options, null);
  options = getOutgoing(ctx, {});
  t.is(options, null);
  options = getOutgoing(ctx, {
    url: '/aaa/bbb',
  });
  t.is(options, null);
});

test('options is string', (t) => {
  let options = getOutgoing(ctx, 'http://127.0.0.1');
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/quan?name=888',
    port: 80,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, 'http://127.0.0.1/rice');
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/rice?name=888',
    port: 80,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, 'http://127.0.0.1/rice?name=aaa');
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/rice?name=aaa',
    port: 80,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, 'http://127.0.0.1:8080/rice?name=aaa');
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/rice?name=aaa',
    port: 8080,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
});

test('options is plainObject', (t) => {
  let options = getOutgoing(ctx, {
    url: 'http://127.0.0.1',
  });
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/quan?name=888',
    port: 80,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, {
    url: 'http://127.0.0.1:8080/rice?name=aaa',
  });
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/rice?name=aaa',
    port: 8080,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, {
    url: 'http://127.0.0.1:8080/rice?name=aaa',
    path: '/cover?name=cover',
  });
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/cover?name=cover',
    port: 8080,
    method: 'GET',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, {
    url: 'http://127.0.0.1:8080/rice?name=aaa',
    path: '/cover?name=cover',
    method: 'POST',
  });
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/cover?name=cover',
    port: 8080,
    method: 'POST',
    headers: {
      'user-agent': 'quan',
    },
  });
  options = getOutgoing(ctx, {
    url: 'http://127.0.0.1',
    path: '/',
    headers: {
      host: 'rice.cn',
    },
  });
  t.deepEqual(options, {
    hostname: '127.0.0.1',
    path: '/',
    port: 80,
    method: 'GET',
    headers: {
      host: 'rice.cn',
    },
  });
});
