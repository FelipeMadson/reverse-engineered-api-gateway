import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ReverseEngineeredGateway } from './gateway.js';
import { CircuitBreaker } from './circuit-breaker.js';

describe('ReverseEngineeredGateway Suite', () => {
  test('should route requests and enforce rate limits', async () => {
    const gw = new ReverseEngineeredGateway();
    gw.registerRoute({
      pathPrefix: '/api/v1/users',
      targetUrl: 'http://user-service:8080',
      rateLimitPerMinute: 2,
      circuitBreakerThreshold: 3,
      requiresAuth: false
    });

    const req = { path: '/api/v1/users/123', method: 'GET', headers: {}, ip: '192.168.1.1' };
    
    // First 2 requests pass
    const res1 = await gw.handle(req);
    assert.equal(res1.status, 200);

    const res2 = await gw.handle(req);
    assert.equal(res2.status, 200);

    // 3rd request is rate-limited
    const res3 = await gw.handle(req);
    assert.equal(res3.status, 429);
  });

  test('should reject unauthorized requests when requiresAuth is true', async () => {
    const gw = new ReverseEngineeredGateway();
    gw.registerRoute({
      pathPrefix: '/api/v1/secure',
      targetUrl: 'http://secure-service:8080',
      rateLimitPerMinute: 100,
      circuitBreakerThreshold: 3,
      requiresAuth: true
    });

    const unauthRes = await gw.handle({ path: '/api/v1/secure/data', method: 'GET', headers: {}, ip: '10.0.0.1' });
    assert.equal(unauthRes.status, 401);

    const authRes = await gw.handle({ path: '/api/v1/secure/data', method: 'GET', headers: { authorization: 'Bearer secret_token' }, ip: '10.0.0.1' });
    assert.equal(authRes.status, 200);
  });

  test('should trip circuit breaker after failure threshold', () => {
    const cb = new CircuitBreaker(2, 5000);
    assert.equal(cb.isAvailable(), true);

    cb.recordFailure();
    assert.equal(cb.isAvailable(), true);

    cb.recordFailure(); // Threshold reached
    assert.equal(cb.isAvailable(), false);
    assert.equal(cb.getState(), 'OPEN');
  });
});
