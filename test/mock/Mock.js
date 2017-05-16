import test from 'ava';
import { resolve } from 'path';
import nock from 'nock';
import PropTypes from 'quan-prop-types';
import { Writable } from 'stream';
import Mock, { PROXY, FILE, NORMAL, UNKOWN } from '../../src/mock/Mock';

test.before(() => {
  nock('http://quan.com')
    .get('/quan')
    .reply(200, { name: 'quan' });
});


test('Mock handleResponse type with file or normal, validate', (t) => {
  let isNextCalled = false;
  const req = {};

  const res = {
    statusCode: -1,
    status(code) {
      this.statusCode = code;
    },
    sendFile(fileName) {
      t.is(fileName, resolve(process.cwd(), './data/quan.json'));
    },
    json(data) {
      t.deepEqual(data, { msg: 'error' });
    },
  };
  const next = () => {
    isNextCalled = true;
  };

  let mock = new Mock('/quan', {
    success: './data/quan.json',
    error: { msg: 'error' },
  });
  mock.handleResponse(req, res, next);
  t.true(mock.isSuccess);
  t.is(mock.type, FILE);
  t.is(res.mock, mock);
  t.is(res.statusCode, 200);

  mock = new Mock('/quan', {
    status: [200, 500],
    validate: {
      name: PropTypes.isRequired,
    },
    success: './data/quan.json',
    error: () => {},
  });
  mock.handleResponse(req, res, next);
  t.false(mock.isSuccess);
  t.is(mock.type, NORMAL);
  t.is(res.statusCode, 500);
  t.false(isNextCalled);

  mock = new Mock('/quan', {});
  mock.handleResponse(req, res, next);
  t.true(mock.isSuccess);
  t.is(res.statusCode, 200);
  t.true(isNextCalled);
  t.is(mock.type, UNKOWN);
});

test('Mock handleResponse type proxy', (t) => {
  const req = { url: '/quan' };

  const res = Writable();
  res.status = () => { };
  res._write = () => {};
  const next = () => {};

  const mock = new Mock('/quan', 'http://quan.com');
  mock.handleResponse(req, res, next);
  t.true(mock.isSuccess);
  t.is(mock.type, PROXY);
});
