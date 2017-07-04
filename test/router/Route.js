import test from 'ava';
import Route from '../../src/server/router/Route';

test('Route', (t) => {
  let route = new Route('/quan', './data/quan.json');
  t.is(route.path, '/quan');
  t.is(route.method, 'get');

  route = new Route('/quan', 'http://quan.com');

  route = new Route('/quan', {});

  route = new Route('/quan', () => {});
});
