import { RouteRule, GatewayRequest, GatewayResponse } from './types.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { TokenBucketLimiter } from './rate-limiter.js';

export class ReverseEngineeredGateway {
  private routes: RouteRule[] = [];
  private breakers = new Map<string, CircuitBreaker>();
  private limiters = new Map<string, TokenBucketLimiter>();

  public registerRoute(rule: RouteRule): void {
    this.routes.push(rule);
    this.breakers.set(rule.pathPrefix, new CircuitBreaker(rule.circuitBreakerThreshold));
  }

  public async handle(req: GatewayRequest): Promise<GatewayResponse> {
    const matched = this.routes.find(r => req.path.startsWith(r.pathPrefix));
    if (!matched) {
      return { status: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Route not found' }) };
    }

    // Rate Limiting
    const limiterKey = `${req.ip}:${matched.pathPrefix}`;
    let limiter = this.limiters.get(limiterKey);
    if (!limiter) {
      limiter = new TokenBucketLimiter(matched.rateLimitPerMinute, matched.rateLimitPerMinute / 60);
      this.limiters.set(limiterKey, limiter);
    }

    if (!limiter.allow()) {
      return { status: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Too many requests' }) };
    }

    // Circuit Breaker
    const breaker = this.breakers.get(matched.pathPrefix)!;
    if (!breaker.isAvailable()) {
      return { status: 503, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Service temporarily unavailable (Circuit Breaker OPEN)' }) };
    }

    // Auth verification
    if (matched.requiresAuth) {
      const auth = req.headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) {
        return { status: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized: Bearer token missing' }) };
      }
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Gateway-Route': matched.pathPrefix },
      body: JSON.stringify({ message: 'Request proxied successfully', target: matched.targetUrl, path: req.path })
    };
  }
}
