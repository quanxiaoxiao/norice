import test from 'ava';
import Route from '../../src/router/Route';

test('Route', (t) => {
  let route = new Route('/quan', './data/quan.json');
  t.is(route.type, Route.HANDLE_TYPE_FILE);
  t.is(route.path, '/quan');
  t.is(route.method, 'get');

  route = new Route('/quan', 'http://quan.com');
  t.is(route.type, Route.HANDLE_TYPE_PROXY);

  route = new Route('/quan', {});
  t.is(route.type, Route.HANDLE_TYPE_JSON);

  route = new Route('/quan', () => {});
  t.is(route.type, Route.HANDLE_TYPE_FUNCTION);
});
