# Service Level Agreement — Per-Operation Targets

This document publishes per-operation latency targets that complement the
generic API SLA in `PERFORMANCE_TESTING.md` and `MONITORING_SETUP.md`.

## Blockchain Anchor (Evidence Truth Layer)

| Metric | Target |
|--------|-------:|
| P50    | 15 s   |
| P95    | 60 s   |

**Definition.** Latency of a single `blockchainService.anchorEvidenceHash`
attempt — from when the service receives the call to when the on-chain
transaction hash is returned. Excludes retry tail (BullMQ retry attempts
appear as separate samples).

**Live values.** `GET /api/acos/evidence/anchor-sla` (admin) returns the
current `{ p50, p95, p99, sampleCount, totalRecorded, target, withinTarget }`
over the last 1000 anchor attempts in the calling process.

**Source of truth.** `server/src/services/monitoring/anchorSLA.ts`.

**Limitations.**
- Per-process ring buffer (in-memory). Multi-replica deployments see one
  window per replica; aggregate via the admin endpoint per host.
- Window capacity 1000 samples. Older samples evict.
- Retries (samples beyond the first inline attempt) are recorded by the
  blockchain anchor retry worker.
