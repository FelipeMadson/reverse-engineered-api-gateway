# Reverse-Engineered Resilient API Gateway

[![CI](https://github.com/FelipeMadson/reverse-engineered-api-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/FelipeMadson/reverse-engineered-api-gateway/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v1.0.0-green.svg)](https://github.com/FelipeMadson/reverse-engineered-api-gateway/releases)

Clean-room reverse-engineered resilient API gateway in TypeScript. Engineered from first principles with zero external runtime dependencies, native Circuit Breaker, Token Bucket rate limiting, and Bearer authentication.

## Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant GW as Reverse-Engineered Gateway
    participant Limiter as TokenBucket Limiter
    participant Breaker as Circuit Breaker
    participant Upstream as Target Microservice

    Client->>GW: HTTP Request (Method, Path, Headers)
    GW->>Limiter: Check Rate Budget (IP/Prefix)
    alt Rate Budget Exceeded
        Limiter-->>GW: Rejected
        GW-->>Client: HTTP 429 Too Many Requests
    else Budget Allowed
        Limiter-->>GW: OK
        GW->>Breaker: Check Health State (CLOSED?)
        alt Circuit OPEN
            Breaker-->>GW: Trip Fast-Fail
            GW-->>Client: HTTP 503 Service Unavailable
        else Circuit CLOSED
            Breaker-->>GW: Available
            GW->>Upstream: Forward Request
            Upstream-->>GW: Upstream Response
            GW-->>Client: HTTP 200 OK
        end
    end
```

## Key Engineering Highlights

- **Clean-Room Design**: Decoupled from legacy gateway bloatware. Detailed in [ARCHITECTURE_RECONSTRUCTION.md](ARCHITECTURE_RECONSTRUCTION.md).
- **Circuit Breaker State Machine**: Tri-state resilience (`CLOSED`, `OPEN`, `HALF_OPEN`) with automatic cooldown reset.
- **Zero Production Dependencies**: Minimal attack surface, zero supply chain vulnerabilities.

## Build & Test

```bash
npm install
npm run build
npm test
```

## Author

Developed by **[Felipe Madison](https://github.com/FelipeMadson)**.
