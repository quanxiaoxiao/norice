import test from 'ava';
import apiParser from '../src/apiParser';

test('', (t) => {
  let api = {
    '/quan': {
      body: { name: 'quan' },
    },
  };
  let list = apiParser(api);
  t.is(list.length, 1);

  api = {
    '/quan': {
      get: {
        body: { name: 'quan' },
      },
      post: {
        body: { name: 'quan' },
      },
    },
  };

  list = apiParser(api);
  t.is(list.length, 2);

  api = {
    '/quan': {
      get: {
        body: { name: 'quan' },
      },
      post: {
        body: { name: 'quan' },
      },
    },
    '/rice': {
      body: '8888',
    },
    '/foo': {
      get: {
        body: '8888',
      },
    },
  };
  list = apiParser(api);
  t.is(list.length, 4);

  api = {
    '/quan': {
      get: {
        body: { name: 'quan' },
      },
      post: {
        foo: { name: 'quan' },
      },
    },
  };
  list = apiParser(api);
  t.is(list.length, 1);

  api = {
    '/quan': {
      all: {
        body: { name: 'quan' },
      },
    },
  };
  list = apiParser(api);
  t.is(list.length, 5);
});
