export interface RouteRule {
  pathPrefix: string;
  targetUrl: string;
  rateLimitPerMinute: number;
  circuitBreakerThreshold: number;
  requiresAuth: boolean;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface GatewayRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  ip: string;
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}
