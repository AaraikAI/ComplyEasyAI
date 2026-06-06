# NPM Audit – Remaining Advisories

**Last updated:** 2026-06-06 (reconciled against the authoritative baseline in `.claude/CLAUDE.md`).

> The previous version of this file (root 13 / server 11, listing `aws-sdk` region
> validation and `path-to-regexp` as HIGH) was stale and has been corrected. The
> single source of truth for the unfixable set is the **"Known unfixable upstream
> vulnerabilities"** table in `.claude/CLAUDE.md`; this file only summarizes the
> counts and points there.

## Current baseline

| Package | Vulnerabilities | Breakdown |
|---------|-----------------|-----------|
| **Root** (complyeasy-ai frontend + tooling) | **0** | none |
| **Server** (complyeasy-server) | **29** | 0 critical, 0 high, 15 moderate, 14 low |

Both advisories that were previously HIGH on the server (`dompurify` and `tmp`) are
now **fixed** — see the "Fixed this pass" notes in `.claude/CLAUDE.md`. There are
no remaining critical or high advisories in either package.

## Remaining server advisories (all moderate/low, breaking-major to fix)

Every remaining server advisory requires a breaking **major** upgrade of a toolchain
dependency (`npm audit fix --force` → ethers v6 / aws-sdk v3 / circom / fabric-network /
exceljs / jest-junit majors), which is out-of-scope dependency-replacement work rather
than a code fix. The full per-package reasoning lives in the known-unfixable table in
`.claude/CLAUDE.md`; the roots are:

- `elliptic *` (via `fabric-network` → `fabric-common`)
- `ws 8.0.0–8.20.0`, `@ethersproject/*` / `ethers` v5 (fix = ethers v6)
- `aws-sdk` v2 → `uuid` (v3 migration is a separately tracked project)
- `uuid` via `@azure/ms-rest-js`, `exceljs`, `jest-junit`
- `serialize-javascript`, `circom` / `circom_runtime` / `ffjavascript` / `mocha`
- `fabric-common` / `fabric-network` (Hyperledger SDK)

## Checklist

- [x] `npm audit` in server and root reconciled against `.claude/CLAUDE.md`.
- [x] Confirm no critical/high advisories remain (root 0, server 0 high).
- [ ] Re-run `npm audit` after any dependency upgrade and update this file.
- [ ] Track the breaking-major migrations (ethers v6, aws-sdk v3, circom major) as
      separate change requests.
