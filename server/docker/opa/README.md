# OPA Server Deployment

## Quick Start

```bash
cd server/docker/opa
docker-compose up -d
```

## High Availability Setup

The docker-compose file includes:
- Primary OPA server on port 8181
- Replica OPA server on port 8182
- Shared data volume for policy synchronization
- Health checks for automatic restart

## Configuration

Set environment variables:
- `OPA_ENDPOINT=http://localhost:8181` (or use load balancer)
- `OPA_AUTH_TOKEN=<optional>` (if authentication enabled)

## Monitoring

Health check endpoint: `http://localhost:8181/health`

## Backup/Restore

Policies are stored in `./policies` directory. Backup by copying this directory.

Restore by placing policies in `./policies` and restarting containers.

