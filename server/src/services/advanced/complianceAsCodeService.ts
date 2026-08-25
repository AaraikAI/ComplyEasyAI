/**
 * Compliance-as-Code Service
 * Policy engine using Open Policy Agent (OPA) for automated compliance validation
 * Integrates with CI/CD pipelines for continuous compliance checks
 */

import crypto from 'crypto';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { isUrlSafe, safeAxios } from '../../utils/urlValidator';

const execFileAsync = promisify(execFile);

interface Policy {
  id: string;
  name: string;
  framework: string; // SOC2, ISO27001, HIPAA, etc.
  rego: string; // OPA Rego policy code
  severity: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
}

interface PolicyEvaluationResult {
  allowed: boolean;
  violations: PolicyViolation[];
  metadata: {
    policyId: string;
    evaluationTime: number;
    timestamp: Date;
  };
}

interface PolicyViolation {
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  resource?: string;
  remediation?: string;
}

interface CIIntegration {
  provider: 'github' | 'gitlab' | 'jenkins' | 'circleci';
  webhookUrl: string;
  secret: string;
  events: string[];
}

interface ComplianceReport {
  organizationId: string;
  framework: string;
  totalPolicies: number;
  passedPolicies: number;
  failedPolicies: number;
  violations: PolicyViolation[];
  score: number;
  timestamp: Date;
}

/**
 * Compliance-as-Code Service using Open Policy Agent
 *
 * Features:
 * 1. Policy authoring in Rego (OPA language)
 * 2. Real-time policy evaluation
 * 3. CI/CD integration (GitHub Actions, GitLab CI, etc.)
 * 4. Automated compliance checks on infrastructure changes
 * 5. Policy versioning and rollback
 */
class ComplianceAsCodeService {
  private opaEndpoint: string;
  private policiesPath: string;
  private opaBinary: string;

  constructor() {
    this.opaEndpoint = process.env.OPA_ENDPOINT || 'http://localhost:8181';
    this.policiesPath = path.join(__dirname, '../../policies');
    // Local `opa` binary used to compile/check submitted Rego before persistence.
    // Falls back to the OPA HTTP API when the binary is unavailable.
    this.opaBinary = process.env.OPA_BINARY || path.join(this.policiesPath, 'bin', 'opa');
    this.ensurePoliciesDirectory();
  }

  /**
   * Ensure policies directory exists
   */
  private ensurePoliciesDirectory(): void {
    if (!fs.existsSync(this.policiesPath)) {
      fs.mkdirSync(this.policiesPath, { recursive: true });
    }
  }

  /**
   * Create a new compliance policy in Rego
   */
  async createPolicy(
    organizationId: string,
    policy: Omit<Policy, 'id'>
  ): Promise<Policy> {
    try {
      // Create the database record first so the policy's canonical id is known.
      // The id determines the OPA package namespace (data.compliance.<id>) that
      // the evaluator queries, so validation and the persisted Rego must be
      // bound to it. The submitted Rego is stored provisionally and replaced
      // below with the validated, package-normalized source.
      const dbPolicy = await prisma.compliancePolicy.create({
        data: {
          organizationId,
          name: policy.name,
          framework: policy.framework,
          rego: policy.rego,
          severity: policy.severity,
          tags: policy.tags,
          version: 1,
          enabled: true,
        },
      });

      // Validate the SUBMITTED Rego and bind it to this policy's namespace.
      // A non-compiling policy is rejected (AppError 400) and the provisional
      // record is removed so invalid stubs are never persisted.
      let normalizedRego: string;
      try {
        normalizedRego = await this.validateRegoSyntax(policy.rego, dbPolicy.id);
      } catch (error) {
        await prisma.compliancePolicy
          .delete({ where: { id: dbPolicy.id } })
          .catch(() => {
            // Ignore cleanup failure of the provisional record.
          });
        throw error;
      }

      // Persist the validated, package-normalized Rego (DB is primary storage).
      const persisted = await prisma.compliancePolicy.update({
        where: { id: dbPolicy.id },
        data: { rego: normalizedRego },
      });

      // Upload to OPA under the canonical id - Required in production.
      try {
        await this.uploadPolicyToOPA(persisted.id, normalizedRego);
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
        logger.warn('OPA upload failed (development mode), policy saved to database only', error);
      }

      // Also save policy file locally for OPA (backup).
      const policyFile = path.join(this.policiesPath, `${this.assertSafeFileId(persisted.id)}.rego`);
      fs.writeFileSync(policyFile, normalizedRego, 'utf-8');

      logger.info(`Created compliance policy: ${this.sanitizeForLog(policy.name)} (${persisted.id})`);

      return {
        id: persisted.id,
        name: persisted.name,
        framework: persisted.framework,
        rego: persisted.rego,
        severity: persisted.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: persisted.tags,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating policy', error);
      throw new AppError('Failed to create compliance policy', 500);
    }
  }

  /**
   * Validate a SUBMITTED Rego policy and return its normalized source.
   *
   * This actually compiles the policy the caller supplied (not a hardcoded
   * query) and enforces the contract the evaluator depends on:
   *   - the policy must declare the package `compliance.<policyId>`, i.e. it
   *     must resolve to the data path `data.compliance.<policyId>` that
   *     evaluatePolicy() queries. When a policyId is provided, a missing or
   *     incorrect package header is rewritten to the correct one.
   *   - it must contain `default allow = false` (deny-by-default), and
   *   - it must define an `allow` rule and a `violation` rule.
   *
   * Compilation is performed with the local `opa` binary when present,
   * otherwise by PUTting to the OPA policy API (OPA parses and compiles on
   * upload). A policy that does not compile is rejected with AppError 400 so
   * that non-compiling stubs can never be persisted.
   *
   * Returns the (possibly package-corrected) Rego source to persist.
   */
  private async validateRegoSyntax(rego: string, policyId?: string): Promise<string> {
    if (typeof rego !== 'string' || rego.trim().length === 0) {
      throw new AppError('Rego policy must be a non-empty string', 400);
    }

    // Enforce / auto-correct the package so the persisted file matches the
    // exact namespace the evaluator queries (data.compliance.<policyId>).
    let normalized = rego;
    if (policyId) {
      normalized = this.enforcePackageHeader(rego, policyId);
    } else if (!this.hasPackageDeclaration(rego)) {
      throw new AppError('Rego policy must start with a package declaration', 400);
    }

    // Contract checks required by the evaluator (allow / violations consumers).
    // Parsing is line-based (split/trim/startsWith) rather than regex-based so
    // that user-supplied Rego cannot trigger catastrophic regex backtracking.
    const lines = normalized.split('\n').map((line) => line.trim());

    if (!lines.some((line) => this.isDenyByDefaultLine(line))) {
      throw new AppError(
        'Rego policy must declare a deny-by-default rule: default allow = false',
        400
      );
    }
    if (!lines.some((line) => this.startsWithWord(line, 'allow'))) {
      throw new AppError('Rego policy must define an "allow" rule', 400);
    }
    if (!lines.some((line) => line.includes('violation'))) {
      throw new AppError('Rego policy must define a "violation" rule', 400);
    }

    // Compile the submitted policy. Prefer the local binary; fall back to OPA.
    const compiled = await this.compileRego(normalized);
    if (!compiled.ok) {
      logger.warn('Submitted Rego policy failed to compile', { error: compiled.error });
      throw new AppError(`Invalid Rego policy: ${compiled.error}`, 400);
    }

    return normalized;
  }

  /**
   * Whether a trimmed line begins with the bare word `word` followed by a
   * boundary (whitespace, `(`, `[`, `{`, `:`, `=`, or end-of-line) rather than
   * being a longer identifier such as `allowList`. Implemented with string ops
   * so it is linear in the line length and cannot backtrack.
   */
  private startsWithWord(line: string, word: string): boolean {
    if (!line.startsWith(word)) {
      return false;
    }
    if (line.length === word.length) {
      return true;
    }
    const next = line.charAt(word.length);
    // A subsequent identifier character means this is a longer word.
    return !/[A-Za-z0-9_]/.test(next);
  }

  /**
   * Guard a policy id before it is used as a filesystem path component.
   * Ids are server-generated, but this validates the charset as defense-in-depth
   * against path traversal and neutralizes the tainted-path data flow.
   */
  private assertSafeFileId(id: string): string {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
      throw new AppError('Invalid policy identifier', 400);
    }
    return id;
  }

  /** Strip CR/LF/tabs from a value before interpolating it into a log line. */
  private sanitizeForLog(value: string): string {
    return String(value).replace(/[\r\n\t]+/g, ' ').slice(0, 200);
  }

  /**
   * Whether a trimmed line is a deny-by-default declaration, i.e.
   * `default allow = false` / `default allow := false` (tolerant of spacing).
   * Token-based parsing avoids the unbounded-quantifier regex CodeQL flags.
   */
  private isDenyByDefaultLine(line: string): boolean {
    if (!this.startsWithWord(line, 'default')) {
      return false;
    }
    // Collapse runs of whitespace to single spaces, then compare tokens.
    const compact = line.replace(/\s+/g, ' ').replace(':=', '=').replace(/\s*=\s*/, ' = ');
    return compact === 'default allow = false';
  }

  /**
   * Whether the source declares a package, scanning line by line.
   */
  private hasPackageDeclaration(rego: string): boolean {
    return rego.split('\n').some((line) => this.startsWithWord(line.trim(), 'package'));
  }

  /**
   * Ensure the policy declares `package compliance.<policyId>`.
   * The id is emitted as a bracket-quoted segment because policy ids are not
   * guaranteed to be bare Rego identifiers (they may start with a digit or
   * contain hyphens). `compliance["<id>"]` resolves to the same REST data path
   * `/v1/data/compliance/<id>` used by evaluatePolicy().
   *
   * Parsing is line-based (split/trim/startsWith) to avoid running an
   * unbounded-quantifier regex over user-supplied policy text.
   */
  private enforcePackageHeader(rego: string, policyId: string): string {
    const expectedPackage = `package compliance[${JSON.stringify(policyId)}]`;
    const lines = rego.split('\n');
    const packageIndex = lines.findIndex((line) => this.startsWithWord(line.trim(), 'package'));
    if (packageIndex >= 0) {
      lines[packageIndex] = expectedPackage;
      return lines.join('\n');
    }
    return `${expectedPackage}\n\n${rego}`;
  }

  /**
   * Compile Rego, returning a structured result. Uses the local `opa check`
   * binary when available, otherwise PUTs to the OPA policy API which parses
   * and compiles on upload (a non-2xx response means the policy is invalid).
   */
  private async compileRego(rego: string): Promise<{ ok: boolean; error?: string }> {
    // Path 1: local opa binary (`opa check`).
    if (this.opaBinary && fs.existsSync(this.opaBinary)) {
      // Write the candidate policy into a freshly created, randomly named
      // private directory (0700 by default) and the file itself with mode 0600.
      // This avoids predictable temp paths and symlink/pre-creation races.
      let tmpDir: string | undefined;
      try {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rego-'));
        const tmpFile = path.join(tmpDir, 'policy.rego');
        fs.writeFileSync(tmpFile, rego, { encoding: 'utf-8', mode: 0o600 });
        await execFileAsync(this.opaBinary, ['check', tmpFile], { timeout: 10000 });
        return { ok: true };
      } catch (error: any) {
        const message = (error?.stderr || error?.stdout || error?.message || 'compilation failed')
          .toString()
          .trim();
        return { ok: false, error: message };
      } finally {
        if (tmpDir) {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {
            // Ignore cleanup failures for the temporary policy directory.
          }
        }
      }
    }

    // Path 2: OPA policy API. OPA parses and compiles on PUT; a failed upload
    // (4xx) indicates the submitted policy is invalid.
    const validationId = `validation/${crypto.randomBytes(8).toString('hex')}`;
    const policyUrl = `${this.opaEndpoint}/v1/policies/${encodeURIComponent(validationId)}`;
    if (!isUrlSafe(policyUrl)) {
      throw new AppError('OPA policy URL is unsafe', 400);
    }
    try {
      await safeAxios({
        headers: {
          'Content-Type': 'text/plain',
          ...(process.env.OPA_AUTH_TOKEN ? { Authorization: `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {}),
        },
        timeout: 5000,
        url: policyUrl,
        method: 'put',
        data: rego,
      }, 'OPA policy API');
      // Remove the throwaway validation policy (best-effort).
      await safeAxios({
        headers: process.env.OPA_AUTH_TOKEN ? { Authorization: `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {},
        timeout: 5000,
        url: policyUrl,
        method: 'delete',
      }, 'OPA policy API').catch(() => {
        // Ignore cleanup failures for the temporary validation policy.
      });
      return { ok: true };
    } catch (error: any) {
      const status = error?.response?.status;
      // A 4xx means OPA rejected the policy (invalid). Network/availability
      // errors (no status) cannot confirm validity: in production this is a
      // hard failure; otherwise allow the contract checks above to stand.
      if (status && status >= 400 && status < 500) {
        const detail = error?.response?.data?.message
          || JSON.stringify(error?.response?.data?.errors || error?.response?.data || {});
        return { ok: false, error: detail };
      }
      if (process.env.NODE_ENV === 'production') {
        logger.error('OPA unavailable for Rego compilation in production', error);
        throw new AppError('OPA server is required to validate policies in production', 500);
      }
      logger.warn('OPA unavailable for Rego compilation; relying on structural checks (development mode)');
      return { ok: true };
    }
  }

  /**
   * Upload policy to OPA server - Production ready
   */
  private async uploadPolicyToOPA(policyId: string, rego: string): Promise<void> {
    try {
      const policyUrl = `${this.opaEndpoint}/v1/policies/${encodeURIComponent(policyId)}`;
      if (!isUrlSafe(policyUrl)) {
        throw new AppError('OPA policy URL is unsafe', 400);
      }
      await safeAxios({
        headers: {
          'Content-Type': 'text/plain',
          ...(process.env.OPA_AUTH_TOKEN ? { 'Authorization': `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {}),
        },
        timeout: 5000,
        url: policyUrl,
        method: 'put',
        data: rego,
      }, 'OPA policy API');
      logger.info(`Uploaded policy ${policyId} to OPA`);
    } catch (error: any) {
      // Production: Fail if OPA unavailable
      if (process.env.NODE_ENV === 'production') {
        logger.error('OPA server unavailable in production', error);
        throw new AppError('OPA server is required for policy management in production', 500);
      }
      // Development: Warn but continue
      logger.warn('OPA server not available, policy saved to database only (development mode)', error);
    }
  }

  /**
   * Evaluate data against compliance policies
   */
  async evaluatePolicy(
    policyId: string,
    input: any,
    organizationId?: string
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();

    try {
      // When organization context is provided, verify the policy belongs to
      // the caller's organization before evaluating it. This prevents one
      // tenant from evaluating (and inferring the contents of) another
      // tenant's policy by ID.
      if (organizationId) {
        const owned = await this.getPolicy(policyId, organizationId);
        if (!owned) {
          throw new AppError('Policy not found', 404);
        }
      }

      // Query OPA for policy decision
      // Production: Fail fast if OPA unavailable
      const dataUrl = `${this.opaEndpoint}/v1/data/compliance/${encodeURIComponent(policyId)}`;
      if (!isUrlSafe(dataUrl)) {
        throw new AppError('OPA data URL is unsafe', 400);
      }
      const response = await safeAxios({
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.OPA_AUTH_TOKEN ? { 'Authorization': `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {}),
        },
        timeout: 10000,
        url: dataUrl,
        method: 'post',
        data: { input },
      }, 'OPA policy API').catch((error) => {
        // Production: Fail if OPA unavailable
        if (process.env.NODE_ENV === 'production') {
          logger.error('OPA server unavailable in production', error);
          throw new AppError('OPA server is required for policy evaluation in production', 500);
        }
        // Development: Allow fallback with warning
        logger.warn('OPA server unavailable, using fallback (development mode only)');
        return this.evaluatePolicyLocally(policyId, input);
      });

      const result = response.data.result || {};
      const allowed = result.allow === true;
      const violations: PolicyViolation[] = result.violations || [];

      const evaluationTime = Date.now() - startTime;

      logger.info(`Policy evaluation: ${policyId} - ${allowed ? 'PASS' : 'FAIL'} (${evaluationTime}ms)`);

      return {
        allowed,
        violations,
        metadata: {
          policyId,
          evaluationTime,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      // Preserve typed errors (e.g. 404 ownership failures) so callers see the
      // correct status instead of a generic 500.
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error evaluating policy', error);
      throw new AppError('Policy evaluation failed', 500);
    }
  }

  /**
   * Fallback: Evaluate policy locally (development only)
   * Production: This should never be called
   */
  private async evaluatePolicyLocally(
    policyId: string,
    input: any
  ): Promise<any> {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Local policy evaluation is not allowed in production', 400);
    }

    // Development: Return deny by default (safer than allow all)
    logger.warn('Using local policy evaluation fallback (development only)');

    return {
      data: {
        result: {
          allow: false,
          violations: [{
            rule: 'opa_unavailable',
            severity: 'high',
            message: 'OPA server unavailable - policy evaluation skipped (development mode)',
          }],
        },
      },
    };
  }

  /**
   * Evaluate multiple policies (batch evaluation)
   */
  async evaluateMultiplePolicies(
    policyIds: string[],
    input: any,
    organizationId?: string
  ): Promise<PolicyEvaluationResult[]> {
    try {
      const results = await Promise.all(
        policyIds.map((policyId) => this.evaluatePolicy(policyId, input, organizationId))
      );

      return results;
    } catch (error) {
      logger.error('Error in batch policy evaluation', error);
      throw new AppError('Batch policy evaluation failed', 500);
    }
  }

  /**
   * Generate compliance report for organization
   */
  async generateComplianceReport(
    organizationId: string,
    framework: string
  ): Promise<ComplianceReport> {
    try {
      // Get all policies for framework
      const policies = await this.getPoliciesByFramework(organizationId, framework);

      // Get organization data for evaluation
      const orgData = await this.getOrganizationComplianceData(organizationId);

      // Evaluate all policies
      const evaluations = await Promise.all(
        policies.map((policy) => this.evaluatePolicy(policy.id, orgData))
      );

      const passedPolicies = evaluations.filter((e) => e.allowed).length;
      const failedPolicies = evaluations.length - passedPolicies;

      const allViolations = evaluations.flatMap((e) => e.violations);

      const score = Math.round((passedPolicies / evaluations.length) * 100);

      logger.info(`Generated compliance report for ${organizationId}: ${score}% (${framework})`);

      return {
        organizationId,
        framework,
        totalPolicies: evaluations.length,
        passedPolicies,
        failedPolicies,
        violations: allViolations,
        score,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error generating compliance report', error);
      throw new AppError('Compliance report generation failed', 500);
    }
  }

  /**
   * Setup CI/CD webhook integration
   */
  async setupCIIntegration(
    organizationId: string,
    integration: CIIntegration
  ): Promise<string> {
    try {
      const webhookId = crypto.randomBytes(16).toString('hex');

      // Store webhook configuration
      await prisma.auditLog.create({
        data: {
          action: `CI/CD Integration: ${integration.provider}`,
          organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            webhookId,
            provider: integration.provider,
            events: integration.events,
          }),
        },
      });

      logger.info(`Setup CI/CD integration: ${integration.provider} for org ${organizationId}`);

      return webhookId;
    } catch (error) {
      logger.error('Error setting up CI integration', error);
      throw new AppError('CI/CD integration setup failed', 500);
    }
  }

  /**
   * Handle CI/CD webhook event
   */
  async handleCIWebhook(
    webhookId: string,
    provider: string,
    payload: any,
    signature: string
  ): Promise<PolicyEvaluationResult> {
    try {
      logger.info(`Received CI/CD webhook from ${provider}`);

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(provider, payload, signature);
      if (!isValid) {
        throw new AppError('Invalid webhook signature', 400);
      }

      // Extract infrastructure/config changes from payload
      const changes = this.extractChangesFromPayload(provider, payload);

      // Evaluate policies against changes
      const evaluation = await this.evaluatePolicy('ci_cd_compliance', changes);

      // Post status back to CI/CD provider
      await this.postStatusToCICD(provider, payload, evaluation);

      logger.info(`CI/CD webhook processed: ${evaluation.allowed ? 'PASS' : 'FAIL'}`);

      return evaluation;
    } catch (error) {
      logger.error('Error handling CI webhook', error);
      throw new AppError('CI/CD webhook handling failed', 500);
    }
  }

  /**
   * Verify webhook signature - Production Implementation
   */
  private verifyWebhookSignature(
    provider: string,
    payload: any,
    signature: string
  ): boolean {
    try {
      const secret = this.getWebhookSecret(provider);
      if (!secret) {
        logger.error(`Webhook secret not configured for ${provider}`);
        return false;
      }

      // GitHub: HMAC SHA256
      if (provider === 'github') {
        const hmac = crypto.createHmac('sha256', secret);
        const expected = hmac.update(JSON.stringify(payload)).digest('hex');
        const expectedSignature = `sha256=${expected}`;
        
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );
      }

      // GitLab: X-Gitlab-Token header
      if (provider === 'gitlab') {
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(secret)
        );
      }

      // Jenkins: Basic token comparison
      if (provider === 'jenkins') {
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(secret)
        );
      }

      // CircleCI: HMAC SHA256
      if (provider === 'circleci') {
        const hmac = crypto.createHmac('sha256', secret);
        const expected = hmac.update(JSON.stringify(payload)).digest('hex');
        
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expected)
        );
      }

      logger.warn(`Unknown webhook provider: ${provider}`);
      return false;
    } catch (error) {
      logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Get webhook secret from environment or configuration
   */
  private getWebhookSecret(provider: string): string | null {
    const envKey = `${provider.toUpperCase()}_WEBHOOK_SECRET`;
    return process.env[envKey] || null;
  }

  /**
   * Extract changes from CI/CD payload
   */
  private extractChangesFromPayload(provider: string, payload: any): any {
    switch (provider) {
      case 'github':
        return {
          repository: payload.repository?.full_name,
          branch: payload.ref,
          commits: payload.commits || [],
          files_changed: payload.commits?.[0]?.modified || [],
        };

      case 'gitlab':
        return {
          repository: payload.project?.path_with_namespace,
          branch: payload.ref,
          commits: payload.commits || [],
        };

      default:
        return payload;
    }
  }

  /**
   * Post compliance status back to CI/CD provider
   * Integrates with GitHub Checks API and GitLab Pipeline API
   */
  private async postStatusToCICD(
    provider: string,
    payload: any,
    evaluation: PolicyEvaluationResult
  ): Promise<void> {
    const status = evaluation.allowed ? 'PASS' : 'FAIL';
    const violationSummary = evaluation.violations.length > 0
      ? evaluation.violations.map(v => `- [${v.severity}] ${v.message}`).join('\n')
      : 'No violations found.';

    try {
      if (provider === 'github') {
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
          logger.warn('[ComplianceAsCode] GITHUB_TOKEN not configured - skipping GitHub check run status post');
          return;
        }

        const repoFullName = payload.repository?.full_name;
        const headSha = payload.head_commit?.id || payload.after;

        if (!repoFullName || !headSha) {
          logger.warn('[ComplianceAsCode] GitHub payload missing repository or commit SHA - skipping status post', {
            hasRepo: !!repoFullName,
            hasSha: !!headSha,
          });
          return;
        }

        const [owner, repo] = repoFullName.split('/');
        const githubCheckUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/check-runs`;
        if (!isUrlSafe(githubCheckUrl)) {
          logger.warn('[ComplianceAsCode] Rejected unsafe GitHub check-run URL', { owner, repo });
          return;
        }

        await safeAxios({
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          timeout: 10000,
          url: githubCheckUrl,
          method: 'post',
          data: {
            name: 'Compliance Policy Check',
            head_sha: headSha,
            status: 'completed',
            conclusion: evaluation.allowed ? 'success' : 'failure',
            output: {
              title: `Compliance Check: ${status}`,
              summary: `Policy evaluation completed with ${evaluation.violations.length} violation(s).`,
              text: violationSummary,
            },
            completed_at: new Date().toISOString(),
          },
        }, 'OPA policy API');

        logger.info(`[ComplianceAsCode] Posted check run to GitHub ${repoFullName}@${headSha}: ${status}`);
      } else if (provider === 'gitlab') {
        const gitlabToken = process.env.GITLAB_TOKEN;
        if (!gitlabToken) {
          logger.warn('[ComplianceAsCode] GITLAB_TOKEN not configured - skipping GitLab pipeline status post');
          return;
        }

        const projectId = payload.project?.id;
        const commitSha = payload.checkout_sha || payload.after;

        if (!projectId || !commitSha) {
          logger.warn('[ComplianceAsCode] GitLab payload missing project ID or commit SHA - skipping status post', {
            hasProjectId: !!projectId,
            hasSha: !!commitSha,
          });
          return;
        }

        const gitlabStatusUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(String(projectId))}/statuses/${encodeURIComponent(String(commitSha))}`;
        if (!isUrlSafe(gitlabStatusUrl)) {
          logger.warn('[ComplianceAsCode] Rejected unsafe GitLab status URL', { projectId, commitSha });
          return;
        }

        await safeAxios({
          headers: {
            'PRIVATE-TOKEN': gitlabToken,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
          url: gitlabStatusUrl,
          method: 'post',
          data: {
            state: evaluation.allowed ? 'success' : 'failed',
            name: 'compliance-policy-check',
            description: `Compliance Check: ${status} (${evaluation.violations.length} violation(s))`,
            target_url: undefined, // Could be set to a compliance dashboard URL
          },
        }, 'OPA policy API');

        logger.info(`[ComplianceAsCode] Posted commit status to GitLab project ${projectId}@${commitSha}: ${status}`);
      } else {
        // Jenkins, CircleCI, and other providers: log status only
        // These providers typically pull status rather than receive pushes
        logger.info(`[ComplianceAsCode] Compliance status for ${provider}: ${status} (no API integration for this provider)`);
      }
    } catch (error: any) {
      // Log error but don't throw - status posting is best-effort and should not
      // fail the webhook processing pipeline
      logger.error(`[ComplianceAsCode] Error posting compliance status to ${provider}`, {
        error: error.message || error,
        status: error.response?.status,
        responseData: error.response?.data,
        provider,
        evaluationResult: status,
      });
    }
  }

  /**
   * Generate example SOC2 policies
   */
  generateSOC2Policies(): string {
    return `# SOC2 Compliance Policies

package compliance.soc2

# Policy: Encryption at Rest
default encryption_at_rest = false

encryption_at_rest {
    input.resource.type == "database"
    input.resource.encrypted == true
    input.resource.encryption_algorithm in ["AES-256", "AES-256-GCM"]
}

violation[msg] {
    input.resource.type == "database"
    not encryption_at_rest
    msg := "Database must have encryption at rest enabled (SOC2 CC6.1)"
}

# Policy: Access Controls
default proper_access_controls = false

proper_access_controls {
    input.resource.type == "user"
    input.resource.mfa_enabled == true
    input.resource.password_policy.min_length >= 12
}

violation[msg] {
    input.resource.type == "user"
    not proper_access_controls
    msg := "User must have MFA enabled and strong password policy (SOC2 CC6.2)"
}

# Policy: Audit Logging
default audit_logging_enabled = false

audit_logging_enabled {
    input.resource.audit_logs == true
    input.resource.log_retention_days >= 365
}

violation[msg] {
    not audit_logging_enabled
    msg := "Audit logging must be enabled with 365+ days retention (SOC2 CC7.2)"
}

# Main allow rule
default allow = false

allow {
    encryption_at_rest
    proper_access_controls
    audit_logging_enabled
    count(violation) == 0
}
`;
  }

  /**
   * Generate example ISO 27001 policies
   */
  generateISO27001Policies(): string {
    return `# ISO 27001 Compliance Policies

package compliance.iso27001

# A.9.2.1 User Registration
default user_registration_compliant = false

user_registration_compliant {
    input.user.verified_email == true
    input.user.verified_identity == true
    input.user.approval_status == "approved"
}

violation[msg] {
    not user_registration_compliant
    msg := "User registration must include email verification and approval (ISO 27001 A.9.2.1)"
}

# A.10.1.1 Cryptographic Controls
default crypto_controls = false

crypto_controls {
    input.data.encryption_algorithm in ["AES-256", "ChaCha20-Poly1305"]
    input.data.key_length >= 256
    input.data.tls_version >= 1.3
}

violation[msg] {
    not crypto_controls
    msg := "Cryptographic controls must use approved algorithms (ISO 27001 A.10.1.1)"
}

# A.12.4.1 Event Logging
default event_logging = false

event_logging {
    input.system.event_logging == true
    input.system.log_types[_] == "security"
    input.system.log_integrity_protection == true
}

violation[msg] {
    not event_logging
    msg := "Event logging must be enabled with integrity protection (ISO 27001 A.12.4.1)"
}

# Main allow rule
default allow = false

allow {
    user_registration_compliant
    crypto_controls
    event_logging
    count(violation) == 0
}
`;
  }

  /**
   * Get policies by framework - Database-backed
   */
  async getPoliciesByFramework(
    organizationId: string,
    framework?: string
  ): Promise<Policy[]> {
    try {
      const where: any = {
        organizationId,
        enabled: true,
      };

      if (framework) {
        where.framework = framework;
      }

      const dbPolicies = await prisma.compliancePolicy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return dbPolicies.map(p => ({
        id: p.id,
        name: p.name,
        framework: p.framework,
        rego: p.rego,
        severity: p.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: p.tags,
      }));
    } catch (error) {
      logger.error('Error getting policies by framework', error);
      return [];
    }
  }

  /**
   * Get organization compliance data for OPA policy evaluation
   * Queries all relevant compliance resources from the database and structures
   * them for consumption by Rego policies.
   */
  async getOrganizationComplianceData(organizationId: string): Promise<any> {
    try {
      // Query all compliance-relevant data in parallel for performance
      const [
        org,
        frameworks,
        policies,
        risks,
        evidenceAnalyses,
        compliancePolicies,
      ] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            users: {
              select: {
                id: true,
                email: true,
                role: true,
                twoFactorEnabled: true,
                lastLogin: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.complianceFramework.findMany({
          where: { organizationId },
          include: {
            controls: {
              select: {
                id: true,
                name: true,
                status: true,
                category: true,
                evidenceRequired: true,
                evidenceVersions: {
                  where: { isCurrent: true },
                  select: {
                    id: true,
                    fileName: true,
                    uploadedAt: true,
                    versionNumber: true,
                  },
                },
              },
            },
          },
        }),
        prisma.policy.findMany({
          where: { organizationId },
          select: {
            id: true,
            title: true,
            category: true,
            framework: true,
            status: true,
            version: true,
            effectiveDate: true,
            reviewDate: true,
            nextReviewDate: true,
          },
        }),
        prisma.riskItem.findMany({
          where: { organizationId },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            category: true,
            likelihood: true,
            impact: true,
            riskScore: true,
            mitigationPlan: true,
            targetDate: true,
          },
        }),
        prisma.evidenceAnalysis.findMany({
          where: { organizationId },
          select: {
            id: true,
            evidenceId: true,
            overallConfidence: true,
            verificationStatus: true,
            analyzedAt: true,
          },
          orderBy: { analyzedAt: 'desc' },
          take: 200,
        }),
        prisma.compliancePolicy.findMany({
          where: { organizationId, enabled: true },
          select: {
            id: true,
            name: true,
            framework: true,
            severity: true,
            version: true,
          },
        }),
      ]);

      // Structure data for OPA policy evaluation
      // OPA Rego policies can access this data via input.resources.<type>
      const controlsByStatus = {
        total: 0,
        implemented: 0,
        pending: 0,
        notApplicable: 0,
      };

      const evidenceCoverage = {
        total: 0,
        withEvidence: 0,
        withoutEvidence: 0,
      };

      for (const framework of frameworks) {
        for (const control of framework.controls) {
          controlsByStatus.total++;
          if (control.status === 'Implemented' || control.status === 'Compliant') {
            controlsByStatus.implemented++;
          } else if (control.status === 'Not Applicable') {
            controlsByStatus.notApplicable++;
          } else {
            controlsByStatus.pending++;
          }

          if (control.evidenceRequired) {
            evidenceCoverage.total++;
            if (control.evidenceVersions.length > 0) {
              evidenceCoverage.withEvidence++;
            } else {
              evidenceCoverage.withoutEvidence++;
            }
          }
        }
      }

      return {
        organization: {
          id: org?.id,
          name: org?.name,
          plan: org?.plan,
        },
        resources: {
          users: (org as any)?.users?.map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            mfa_enabled: u.twoFactorEnabled,
            last_login: u.lastLogin,
          })) || [],
          frameworks: frameworks.map(f => ({
            id: f.id,
            name: f.name,
            status: f.status,
            progress: f.progress,
            next_audit_date: f.nextAuditDate,
            controls_count: f.controls.length,
            controls: f.controls.map(c => ({
              id: c.id,
              name: c.name,
              status: c.status,
              category: c.category,
              evidence_required: c.evidenceRequired,
              has_evidence: c.evidenceVersions.length > 0,
            })),
          })),
          policies: policies.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            framework: p.framework,
            status: p.status,
            version: p.version,
            effective_date: p.effectiveDate,
            review_date: p.reviewDate,
            next_review_date: p.nextReviewDate,
          })),
          risks: risks.map(r => ({
            id: r.id,
            title: r.title,
            severity: r.severity,
            status: r.status,
            category: r.category,
            likelihood: r.likelihood,
            impact: r.impact,
            risk_score: r.riskScore,
            has_mitigation: !!r.mitigationPlan,
            target_date: r.targetDate,
          })),
          evidence: evidenceAnalyses.map(e => ({
            id: e.id,
            evidence_id: e.evidenceId,
            confidence: e.overallConfidence,
            verification_status: e.verificationStatus,
            analyzed_at: e.analyzedAt,
          })),
          compliance_policies: compliancePolicies.map(cp => ({
            id: cp.id,
            name: cp.name,
            framework: cp.framework,
            severity: cp.severity,
            version: cp.version,
          })),
        },
        summary: {
          controls: controlsByStatus,
          evidence_coverage: evidenceCoverage,
          total_frameworks: frameworks.length,
          total_policies: policies.length,
          total_risks: risks.length,
          open_risks: risks.filter(r => r.status === 'Open').length,
          critical_risks: risks.filter(r => r.severity === 'Critical').length,
        },
      };
    } catch (error) {
      logger.error('[ComplianceAsCode] Error fetching organization compliance data', error);
      throw new AppError('Failed to fetch organization compliance data for policy evaluation', 500);
    }
  }

  /**
   * Get policy by ID - Database-backed
   *
   * When an organizationId is supplied the lookup is scoped to that
   * organization so a caller cannot read another tenant's policy (and its
   * Rego source) by guessing an ID. Callers that already hold the request's
   * organization context must always pass it.
   */
  async getPolicy(policyId: string, organizationId?: string): Promise<Policy | null> {
    try {
      const dbPolicy = organizationId
        ? await prisma.compliancePolicy.findFirst({
            where: { id: policyId, organizationId },
          })
        : await prisma.compliancePolicy.findUnique({
            where: { id: policyId },
          });

      if (!dbPolicy) {
        return null;
      }

      return {
        id: dbPolicy.id,
        name: dbPolicy.name,
        framework: dbPolicy.framework,
        rego: dbPolicy.rego,
        severity: dbPolicy.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: dbPolicy.tags,
      };
    } catch (error) {
      logger.error('Error getting policy', error);
      return null;
    }
  }

  /**
   * Update policy - Creates new version with rollback capability
   */
  async updatePolicy(
    policyId: string,
    organizationId: string,
    updates: Partial<Policy>
  ): Promise<Policy> {
    try {
      const existing = await prisma.compliancePolicy.findUnique({
        where: { id: policyId },
      });

      if (!existing || existing.organizationId !== organizationId) {
        throw new AppError('Policy not found', 404);
      }

      // Create the new version first so its canonical id (and therefore its OPA
      // package namespace) is known. The Rego is validated and re-namespaced to
      // this new id below before it is persisted/uploaded.
      const newVersion = existing.version + 1;
      const updatedPolicy = await prisma.compliancePolicy.create({
        data: {
          organizationId,
          name: updates.name || existing.name,
          framework: updates.framework || existing.framework,
          rego: updates.rego || existing.rego,
          severity: (updates.severity || existing.severity) as 'critical' | 'high' | 'medium' | 'low',
          tags: updates.tags || existing.tags,
          version: newVersion,
          previousVersionId: policyId,
          enabled: true,
        },
      });

      // Validate the SUBMITTED (or carried-over) Rego and bind it to the new
      // version's namespace. Reject + remove the provisional record on failure.
      let normalizedRego: string;
      try {
        normalizedRego = await this.validateRegoSyntax(
          updates.rego || existing.rego,
          updatedPolicy.id
        );
      } catch (error) {
        await prisma.compliancePolicy
          .delete({ where: { id: updatedPolicy.id } })
          .catch(() => {
            // Ignore cleanup failure of the provisional record.
          });
        throw error;
      }

      const persisted = await prisma.compliancePolicy.update({
        where: { id: updatedPolicy.id },
        data: { rego: normalizedRego },
      });

      // Upload to OPA
      await this.uploadPolicyToOPA(persisted.id, normalizedRego);

      // Update file
      const policyFile = path.join(this.policiesPath, `${this.assertSafeFileId(persisted.id)}.rego`);
      fs.writeFileSync(policyFile, normalizedRego, 'utf-8');

      logger.info(`Updated compliance policy: ${policyId} -> version ${newVersion}`);

      return {
        id: persisted.id,
        name: persisted.name,
        framework: persisted.framework,
        rego: persisted.rego,
        severity: persisted.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: persisted.tags,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating policy', error);
      throw new AppError('Failed to update compliance policy', 500);
    }
  }

  /**
   * Rollback policy to previous version
   */
  async rollbackPolicy(policyId: string, organizationId: string): Promise<Policy> {
    try {
      const current = await prisma.compliancePolicy.findUnique({
        where: { id: policyId },
        include: { previousVersion: true },
      });

      if (!current || current.organizationId !== organizationId) {
        throw new AppError('Policy not found', 404);
      }

      if (!current.previousVersion) {
        throw new AppError('No previous version to rollback to', 404);
      }

      // Create new version from previous
      const rolledBack = await prisma.compliancePolicy.create({
        data: {
          organizationId,
          name: current.previousVersion.name,
          framework: current.previousVersion.framework,
          rego: current.previousVersion.rego,
          severity: current.previousVersion.severity as 'critical' | 'high' | 'medium' | 'low',
          tags: current.previousVersion.tags,
          version: current.version + 1,
          previousVersionId: policyId,
          enabled: true,
        },
      });

      // Upload to OPA
      await this.uploadPolicyToOPA(rolledBack.id, rolledBack.rego);

      logger.info(`Rolled back policy: ${policyId} to version ${rolledBack.version}`);

      return {
        id: rolledBack.id,
        name: rolledBack.name,
        framework: rolledBack.framework,
        rego: rolledBack.rego,
        severity: rolledBack.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: rolledBack.tags,
      };
    } catch (error) {
      logger.error('Error rolling back policy', error);
      throw new AppError('Failed to rollback policy', 500);
    }
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string, organizationId: string): Promise<void> {
    try {
      // Verify ownership before any side effects
      const existingPolicy = await prisma.compliancePolicy.findFirst({
        where: { id: policyId, organizationId },
      });
      if (!existingPolicy) {
        throw new AppError('Compliance policy not found', 404);
      }

      const policyFile = path.join(this.policiesPath, `${this.assertSafeFileId(policyId)}.rego`);
      if (fs.existsSync(policyFile)) {
        fs.unlinkSync(policyFile);
      }

      // Delete from OPA - Required in production
      const deleteUrl = `${this.opaEndpoint}/v1/policies/${encodeURIComponent(policyId)}`;
      if (!isUrlSafe(deleteUrl)) {
        throw new AppError('OPA policy delete URL is unsafe', 400);
      }
      if (process.env.NODE_ENV === 'production') {
        await safeAxios({
          headers: process.env.OPA_AUTH_TOKEN ? { 'Authorization': `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {},
          url: deleteUrl,
          method: 'delete',
        }, 'OPA policy API');
      } else {
        await safeAxios({
          url: deleteUrl,
          method: 'delete',
        }, 'OPA policy API').catch(() => {
          logger.warn('OPA server not available, policy deleted from database only');
        });
      }

      // Delete from database
      await prisma.compliancePolicy.update({
        where: { id: policyId },
        data: { enabled: false },
      });

      await prisma.auditLog.create({
        data: {
          action: `Policy Deleted: ${policyId}`,
          organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({ policyId }),
        },
      });

      logger.info(`Deleted compliance policy: ${policyId}`);
    } catch (error) {
      logger.error('Error deleting policy', error);
      throw new AppError('Failed to delete compliance policy', 500);
    }
  }

  /**
   * Detect policy drift
   */
  async detectDrift(policyId: string, organizationId: string): Promise<{
    hasDrift: boolean;
    violations: PolicyViolation[];
    timestamp: Date;
  }> {
    try {
      const orgData = await this.getOrganizationComplianceData(organizationId);
      const evaluation = await this.evaluatePolicy(policyId, orgData);

      return {
        hasDrift: !evaluation.allowed,
        violations: evaluation.violations,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error detecting drift', error);
      throw new AppError('Drift detection failed', 500);
    }
  }

  /**
   * Test a policy against one or more sample inputs.
   *
   * The policy is first resolved scoped to the caller's organization so a
   * tenant cannot test (and thereby probe) another tenant's policy by ID.
   * Each test case is evaluated and compared against its expected result.
   */
  async testPolicy(
    policyId: string,
    organizationId: string,
    testCases: Array<{ input: any; expectedResult?: boolean }>
  ): Promise<{
    policyId: string;
    total: number;
    passed: number;
    failed: number;
    results: Array<{
      input: any;
      expectedResult?: boolean;
      actualAllowed: boolean;
      matched: boolean;
      violations: PolicyViolation[];
    }>;
  }> {
    try {
      // Org-scoped ownership check (404 if the policy is not the org's).
      const policy = await this.getPolicy(policyId, organizationId);
      if (!policy) {
        throw new AppError('Policy not found', 404);
      }

      const cases = Array.isArray(testCases) ? testCases : [];
      const results = [] as Array<{
        input: any;
        expectedResult?: boolean;
        actualAllowed: boolean;
        matched: boolean;
        violations: PolicyViolation[];
      }>;

      for (const testCase of cases) {
        const evaluation = await this.evaluatePolicy(policyId, testCase.input, organizationId);
        const matched = testCase.expectedResult === undefined
          ? true
          : evaluation.allowed === testCase.expectedResult;
        results.push({
          input: testCase.input,
          expectedResult: testCase.expectedResult,
          actualAllowed: evaluation.allowed,
          matched,
          violations: evaluation.violations,
        });
      }

      const passed = results.filter(r => r.matched).length;
      logger.info(`Policy test completed: ${policyId} - ${passed}/${results.length} cases matched`);

      return {
        policyId,
        total: results.length,
        passed,
        failed: results.length - passed,
        results,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error testing policy', error);
      throw new AppError('Policy test failed', 500);
    }
  }

  /**
   * Run performance benchmark on policy
   */
  async benchmarkPolicy(
    policyId: string,
    organizationId: string,
    iterations: number = 100
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    p95: number;
    p99: number;
  }> {
    try {
      // Org-scoped ownership check before running the benchmark.
      const policy = await this.getPolicy(policyId, organizationId);
      if (!policy) {
        throw new AppError('Policy not found', 404);
      }

      const testInput = { resource: { type: 'test' } };
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await this.evaluatePolicy(policyId, testInput, organizationId);
        times.push(Date.now() - start);
      }

      times.sort((a, b) => a - b);
      const sum = times.reduce((a, b) => a + b, 0);
      const avg = sum / times.length;
      const p95 = times[Math.floor(times.length * 0.95)];
      const p99 = times[Math.floor(times.length * 0.99)];

      return {
        averageTime: avg,
        minTime: times[0],
        maxTime: times[times.length - 1],
        p95,
        p99,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error benchmarking policy', error);
      throw new AppError('Policy benchmark failed', 500);
    }
  }
}

export default new ComplianceAsCodeService();
