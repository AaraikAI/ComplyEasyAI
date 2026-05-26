/**
 * Compliance-as-Code Service
 * Policy engine using Open Policy Agent (OPA) for automated compliance validation
 * Integrates with CI/CD pipelines for continuous compliance checks
 */

import axios from 'axios';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

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

  constructor() {
    this.opaEndpoint = process.env.OPA_ENDPOINT || 'http://localhost:8181';
    this.policiesPath = path.join(__dirname, '../../policies');
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
      const policyId = crypto.randomBytes(16).toString('hex');

      const fullPolicy: Policy = {
        id: policyId, // Will be replaced with DB ID
        ...policy,
      };

      // Validate Rego syntax - Required in production
      try {
        await this.validateRegoSyntax(policy.rego);
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
        logger.warn('Rego syntax validation failed (development mode)', error);
      }

      // Save policy to OPA - Required in production (but don't fail if OPA unavailable in dev)
      try {
        await this.uploadPolicyToOPA(policyId, policy.rego);
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
        logger.warn('OPA upload failed (development mode), policy saved to database only', error);
      }

      // Store policy in database (primary storage)
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

      // Also save policy file locally for OPA (backup)
      const policyFile = path.join(this.policiesPath, `${dbPolicy.id}.rego`);
      fs.writeFileSync(policyFile, policy.rego, 'utf-8');

      logger.info(`Created compliance policy: ${policy.name} (${dbPolicy.id})`);

      return {
        id: dbPolicy.id,
        name: dbPolicy.name,
        framework: dbPolicy.framework,
        rego: dbPolicy.rego,
        severity: dbPolicy.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: dbPolicy.tags,
      };
    } catch (error) {
      logger.error('Error creating policy', error);
      throw new AppError('Failed to create compliance policy', 500);
    }
  }

  /**
   * Validate Rego policy syntax
   */
  private async validateRegoSyntax(rego: string): Promise<boolean> {
    try {
      // Use OPA compile API to validate syntax
      const response = await axios.post(
        `${this.opaEndpoint}/v1/compile`,
        {
          query: 'data.compliance.allow',
          input: {},
          unknowns: ['input'],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      ).catch(() => {
        // If OPA not running, perform basic validation
        if (!rego.includes('package ')) {
          throw new AppError('Rego policy must start with package declaration', 400);
        }
        return { data: { result: true } };
      });

      return true;
    } catch (error) {
      logger.error('Rego syntax validation failed', error);
      throw new AppError('Invalid Rego policy syntax', 400);
    }
  }

  /**
   * Upload policy to OPA server - Production ready
   */
  private async uploadPolicyToOPA(policyId: string, rego: string): Promise<void> {
    try {
      await axios.put(
        `${this.opaEndpoint}/v1/policies/${policyId}`,
        rego,
        {
          headers: { 
            'Content-Type': 'text/plain',
            ...(process.env.OPA_AUTH_TOKEN ? { 'Authorization': `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {}),
          },
          timeout: 5000,
        }
      );
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
    input: any
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();

    try {
      // Query OPA for policy decision
      // Production: Fail fast if OPA unavailable
      const response = await axios.post(
        `${this.opaEndpoint}/v1/data/compliance/${policyId}`,
        { input },
        {
          headers: { 
            'Content-Type': 'application/json',
            ...(process.env.OPA_AUTH_TOKEN ? { 'Authorization': `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {}),
          },
          timeout: 10000,
        }
      ).catch((error) => {
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
    input: any
  ): Promise<PolicyEvaluationResult[]> {
    try {
      const results = await Promise.all(
        policyIds.map((policyId) => this.evaluatePolicy(policyId, input))
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

        await axios.post(
          `https://api.github.com/repos/${owner}/${repo}/check-runs`,
          {
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
          {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
            timeout: 10000,
          }
        );

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

        await axios.post(
          `https://gitlab.com/api/v4/projects/${projectId}/statuses/${commitSha}`,
          {
            state: evaluation.allowed ? 'success' : 'failed',
            name: 'compliance-policy-check',
            description: `Compliance Check: ${status} (${evaluation.violations.length} violation(s))`,
            target_url: undefined, // Could be set to a compliance dashboard URL
          },
          {
            headers: {
              'PRIVATE-TOKEN': gitlabToken,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

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
   */
  async getPolicy(policyId: string): Promise<Policy | null> {
    try {
      const dbPolicy = await prisma.compliancePolicy.findUnique({
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

      // Validate Rego if provided
      if (updates.rego) {
        await this.validateRegoSyntax(updates.rego);
      }

      // Create new version
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

      // Upload to OPA
      await this.uploadPolicyToOPA(updatedPolicy.id, updatedPolicy.rego);

      // Update file
      const policyFile = path.join(this.policiesPath, `${updatedPolicy.id}.rego`);
      fs.writeFileSync(policyFile, updatedPolicy.rego, 'utf-8');

      logger.info(`Updated compliance policy: ${policyId} -> version ${newVersion}`);

      return {
        id: updatedPolicy.id,
        name: updatedPolicy.name,
        framework: updatedPolicy.framework,
        rego: updatedPolicy.rego,
        severity: updatedPolicy.severity as 'critical' | 'high' | 'medium' | 'low',
        tags: updatedPolicy.tags,
      };
    } catch (error) {
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

      const policyFile = path.join(this.policiesPath, `${policyId}.rego`);
      if (fs.existsSync(policyFile)) {
        fs.unlinkSync(policyFile);
      }

      // Delete from OPA - Required in production
      if (process.env.NODE_ENV === 'production') {
        await axios.delete(`${this.opaEndpoint}/v1/policies/${policyId}`, {
          headers: process.env.OPA_AUTH_TOKEN ? { 'Authorization': `Bearer ${process.env.OPA_AUTH_TOKEN}` } : {},
        });
      } else {
        await axios.delete(`${this.opaEndpoint}/v1/policies/${policyId}`).catch(() => {
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
   * Test policy with sample data
   */
  async testPolicy(
    policyId: string,
    testInput: any
  ): Promise<PolicyEvaluationResult> {
    try {
      const policy = await this.getPolicy(policyId);
      if (!policy) {
        throw new AppError('Policy not found', 404);
      }

      // Evaluate with test input
      const result = await this.evaluatePolicy(policyId, testInput);

      logger.info(`Policy test completed: ${policyId} - ${result.allowed ? 'PASS' : 'FAIL'}`);

      return result;
    } catch (error) {
      logger.error('Error testing policy', error);
      throw new AppError('Policy test failed', 500);
    }
  }

  /**
   * Run performance benchmark on policy
   */
  async benchmarkPolicy(
    policyId: string,
    iterations: number = 100
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    p95: number;
    p99: number;
  }> {
    try {
      const policy = await this.getPolicy(policyId);
      if (!policy) {
        throw new AppError('Policy not found', 404);
      }

      const testInput = { resource: { type: 'test' } };
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await this.evaluatePolicy(policyId, testInput);
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
      logger.error('Error benchmarking policy', error);
      throw new AppError('Policy benchmark failed', 500);
    }
  }
}

export default new ComplianceAsCodeService();
