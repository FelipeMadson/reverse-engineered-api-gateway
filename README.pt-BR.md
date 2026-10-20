# Gateway de API Resiliente de Engenharia Reversa

[![CI](https://github.com/FelipeMadson/reverse-engineered-api-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/FelipeMadson/reverse-engineered-api-gateway/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v1.0.0-green.svg)](https://github.com/FelipeMadson/reverse-engineered-api-gateway/releases)

Gateway de API corporativo de alta resiliência reconstruído através de engenharia reversa clean-room em TypeScript. Desenvolvido com zero dependências de produção, Circuit Breaker nativo e controle de taxa Token Bucket.

## Diagrama de Sequência

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant GW as Gateway de API
    participant Limiter as Limitador TokenBucket
    participant Breaker as Disjuntor (Circuit Breaker)
    participant Destino as Microsserviço Alvo

    Cliente->>GW: Requisição HTTP
    GW->>Limiter: Verifica Limite de Taxa
    alt Taxa Excedida
        Limiter-->>GW: Rejeitado
        GW-->>Cliente: HTTP 429 Too Many Requests
    else Taxa Permitida
        Limiter-->>GW: OK
        GW->>Breaker: Verifica Disponibilidade (CLOSED?)
        alt Disjuntor ABERTO
            Breaker-->>GW: Falha Rápida (Fast-Fail)
            GW-->>Cliente: HTTP 503 Service Unavailable
        else Disjuntor FECHADO
            Breaker-->>GW: Disponível
            GW->>Destino: Encaminha Requisição
            Destino-->>GW: Resposta do Serviço
            GW-->>Cliente: HTTP 200 OK
        end
    end
```

## Destaques de Engenharia

- **Reconstrução Clean-Room**: Especificação arquitetural completa documentada em [ARCHITECTURE_RECONSTRUCTION.md](ARCHITECTURE_RECONSTRUCTION.md).
- **Disjuntor Tri-State**: Estados `CLOSED`, `OPEN` e `HALF_OPEN` com tempo de recuperação automático.
- **Zero Dependências Externas**: Máxima auditabilidade e segurança contra ataques de cadeia de suprimentos.

## Compilação e Testes

```bash
npm install
npm run build
npm test
```

## Autor

Desenvolvido por **[Felipe Madison](https://github.com/FelipeMadson)**.
