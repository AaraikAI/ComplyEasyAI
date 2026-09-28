# DRAFT - PENDING LEGAL REVIEW

> **Status:** internal draft, prepared from the product's code and deployment configuration on
> 2026-09-27. It is **not published, not linked and not routed** on www.complyeasyai.com. Every
> statement below is limited to controls that can be verified in the code or the hosting
> configuration; items marked **[TO CONFIRM]** must be checked before publication. It doubles as
> Annex II (technical and organisational measures) of the draft
> [Data Processing Agreement](./data-processing-agreement.md).

# ComplyEasyAI Security Overview

## Attestations

- **SOC 2 Type I audit in progress.** ComplyEasyAI does not yet hold a SOC 2 report.
  [TO CONFIRM the audit firm and expected report date before stating either.]
- ComplyEasyAI does **not** hold ISO/IEC 27001 or any other certification.
- The frameworks named on the website (SOC 2, ISO 27001, GDPR, HIPAA, the EU AI Act and others)
  are standards the platform helps customers prepare for. They are not certifications held by
  ComplyEasyAI.

## Where data is hosted

- **Single region: United States, AWS us-east-1.** The application runs on Amazon ECS; the
  PostgreSQL database is a managed Supabase instance in us-east-1; files and backups are stored
  in Amazon S3 in us-east-1.
- The website and application assets are delivered through Amazon CloudFront, which serves
  cached public assets from edge locations worldwide. Customer data is not cached at the edge
  [TO CONFIRM the CloudFront cache behaviours for /api/* remain uncached].
- There is no multi-region replication and no regional data isolation option today.

## Encryption

- **In transit:** TLS for all traffic between browsers and the service, and between the service
  and its database (certificate verification is enforced in production).
- **At rest:** the database (Supabase) and object storage (Amazon S3) are encrypted at rest by the
  hosting providers.
- **Integration credentials** that customers enter to connect their systems (API keys, tokens,
  secrets) are additionally encrypted by the application with AES-256-GCM before they are stored,
  using a per-record salt and HKDF-SHA256 key derivation.
- Application secrets (database credentials, signing keys, provider keys) are held in AWS Secrets
  Manager and injected at runtime, not stored in the code.

## Identity and access

- **Multi-factor authentication** (time-based one-time codes) is available to every user.
- Passwords, when used, are hashed with PBKDF2-SHA256 at 600,000 iterations. Passwordless
  sign-in by one-time email link is also supported.
- Sessions use httpOnly cookies with SameSite protection, and state-changing requests require a
  CSRF token.
- Role-based access control inside each customer workspace (for example admin, editor and viewer
  roles), and every record is scoped to its customer organization in the application layer.
- Authentication endpoints are rate-limited.
- [TO CONFIRM and describe: who at ComplyEasyAI can access production systems and how that access
  is granted, reviewed and revoked.]

## Logging and monitoring

- **Audit logging:** security-relevant actions in the platform (for example sign-in, integration
  connect and sync, and administrative changes) are written to an audit log with the user,
  timestamp, IP address and user agent.
- A public status page (/status) reports live availability from the production health check.
- [TO CONFIRM: centralised log retention period and alerting.]

## Backups and recovery

- The database is backed up nightly (03:00 UTC) to a private Amazon S3 bucket; backups are kept
  for 30 days.
- [TO CONFIRM: restore testing frequency, and recovery time and recovery point objectives.]

## Software development

- Code changes go through pull requests with automated checks: type checking, unit and
  integration tests, dependency vulnerability audits, static analysis (CodeQL) and secret
  scanning (GitLeaks).
- Third-party GitHub Actions are pinned to commit SHAs.

## Things this overview deliberately does not claim

- Database row-level security is present in the schema but is **not** the enforced isolation
  control today; customer isolation is enforced in the application layer.
- Zero-knowledge proofs, bring-your-own-key encryption and blockchain anchoring are product
  features for customers and are not described here as controls protecting ComplyEasyAI's own
  infrastructure.
- Uptime SLAs with service credits, 24/7 support and on-premises packaging are available on
  request and agreed per contract; none is a default commitment.

## Reporting a vulnerability

Email security@complyeasyai.com [TO CONFIRM the mailbox]. Please include steps to reproduce. We
ask that you give us reasonable time to fix an issue before disclosing it. [TO CONFIRM: publish a
`/.well-known/security.txt` file with the same contact when this page goes live.]

---

### Facts to confirm before publication
1. SOC 2 Type I audit firm and expected report date.
2. Production access process for ComplyEasyAI staff.
3. CloudFront cache behaviour for API paths.
4. Log retention and alerting.
5. Backup restore testing, RTO and RPO.
6. Security mailbox and security.txt.
