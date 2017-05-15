import test from 'ava';
import {
  isCompoundMock,
  getSuccessStatusCode,
  getErrorStatusCode,
  isHttpURL,
  isStringOrPlainObj,
} from '../../src/mock/helper';

test('isCompoundMock', (t) => {
  t.true(isCompoundMock({ get: {} }));
  t.true(isCompoundMock({ get: '' }));
  t.true(isCompoundMock({ get: {}, post: {} }));
  t.true(isCompoundMock({ get: {}, post: '' }));
  t.true(isCompoundMock({ get: {}, post: {}, delete: {}, patch: {} }));
  t.false(isCompoundMock({ get: {}, post: {}, delete: {}, patch: {}, quan: {} }));
  t.false(isCompoundMock({ '/quan': {} }));
  t.false(isCompoundMock({ quan: {} }));
  t.false(isCompoundMock({ get: {}, quan: 'aa' }));
  t.false(isCompoundMock({ '/get': {} }));
});

test('getSuccessStatusCode', (t) => {
  t.is(getSuccessStatusCode(), 200);
  t.is(getSuccessStatusCode(200), 200);
  t.is(getSuccessStatusCode([200]), 200);
  t.is(getSuccessStatusCode([200, 400]), 200);
  t.is(getSuccessStatusCode(204), 204);
  t.is(getSuccessStatusCode([]), 200);
});

test('getErrorStatusCode', (t) => {
  t.is(getErrorStatusCode(), 400);
  t.is(getErrorStatusCode(500), 500);
  t.is(getErrorStatusCode([500]), 500);
  t.is(getErrorStatusCode([500, 401]), 401);
  t.is(getErrorStatusCode([]), 400);
});

test('isHttpURL', (t) => {
  t.true(isHttpURL('http://quan.com'));
  t.true(isHttpURL('https://quan.com'));
  t.false(isHttpURL('/quan'));
  t.false(isHttpURL('./quan'));
  t.false(isHttpURL('../quan'));
  t.false(isHttpURL('quan'));
  t.false(isHttpURL(1));
  t.false(isHttpURL({}));
  t.false(isHttpURL([]));
});

test('isStringOrPlainObj', (t) => {
  t.true(isStringOrPlainObj({}));
  t.true(isStringOrPlainObj('quan'));
  t.false(isStringOrPlainObj(1));
  t.false(isStringOrPlainObj(new Date()));
  t.false(isStringOrPlainObj([]));
});
