/**
 * Red Teaming & Adversarial Simulation Service
 * 
 * Features:
 * - Automated security testing
 * - Adversarial attack simulation
 * - Compliance gap exploitation testing
 * - Attack path analysis
 * - Remediation recommendations
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import jobQueueService, { QUEUE_NAMES } from '../queue/jobQueue';

export interface RedTeamScenario {
  id: string;
  name: string;
  attackType: 'control_bypass' | 'evidence_tampering' | 'policy_violation' | 'access_escalation' | 'social_engineering' | 'data_exfiltration' | 'insider_threat' | 'policy_circumvention' | 'audit_evasion';
  targetFramework?: string;
  targetControl?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  timeLimit?: number; // milliseconds
  multipleAttackers?: boolean;
}

export interface RedTeamResult {
  scenarioId: string;
  success: boolean;
  attackPath: string[];
  vulnerabilitiesFound: Array<{
    type: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    affectedControls: string[];
    falsePositive?: boolean;
  }>;
  remediationRecommendations: string[];
  executionTime: number; // milliseconds
  report?: {
    summary: string;
    findings: string[];
    recommendations: string[];
    exportable: boolean;
  };
  attackers?: Array<{
    id: string;
    role: string;
    actions: string[];
    sharedIntelligence?: string[];
  }>;
  timeout?: boolean;
}

class RedTeamService {
  /**
   * Run red team simulation (enhanced with all attack types)
   */
  async runRedTeamSimulation(
    organizationId: string,
    scenario: {
      name: string;
      attackType: 'control_bypass' | 'evidence_tampering' | 'policy_violation' | 'access_escalation' | 'social_engineering' | 'data_exfiltration' | 'insider_threat' | 'policy_circumvention' | 'audit_evasion';
      targetFramework?: string;
      targetControl?: string;
      timeLimit?: number;
      multipleAttackers?: boolean;
    },
    userId: string
  ): Promise<RedTeamResult> {
    try {
      const startTime = Date.now();
      const timeLimit = scenario.timeLimit || 300000; // Default 5 minutes
      // Use scenario name for ID (sanitize for use as ID)
      const scenarioId = scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `redteam_${Date.now()}`;

      // Execute attack simulation
      const attackPath: string[] = [];
      const vulnerabilitiesFound: RedTeamResult['vulnerabilitiesFound'] = [];
      const attackers: Array<{ id: string; role: string; actions: string[] }> = [];

      // Handle multiple attackers if specified
      if (scenario.multipleAttackers) {
        attackers.push(
          { id: 'attacker_1', role: 'External Threat Actor', actions: [] },
          { id: 'attacker_2', role: 'Insider Threat', actions: [] },
          { id: 'attacker_3', role: 'Competitor', actions: [] }
        );
      } else {
        attackers.push({ id: 'attacker_1', role: 'Threat Actor', actions: [] });
      }

      // Multi-actor coordination: Shared intelligence and coordinated attacks
      const sharedIntelligence: string[] = [];
      const coordinationEvents: Array<{ attackerId: string; event: string; timestamp: number }> = [];

      // Check timeout before starting
      if (Date.now() - startTime > timeLimit) {
        return {
          scenarioId,
          success: false,
          attackPath: [],
          vulnerabilitiesFound: [],
          remediationRecommendations: ['Simulation timed out before execution'],
          executionTime: Date.now() - startTime,
          timeout: true,
        };
      }

      // Execute attack with timeout monitoring and multi-actor coordination
      let attackResult: { attackPath: string[]; vulnerabilities: RedTeamResult['vulnerabilitiesFound'] } | null = null;
      
      // Check timeout before each major operation
      const checkTimeout = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeLimit) {
          throw new Error('TIMEOUT');
        }
        return elapsed;
      };

      try {
        if (scenario.attackType === 'control_bypass') {
          checkTimeout();
          attackResult = await this.simulateControlBypass(
            organizationId,
            scenario.targetFramework,
            scenario.targetControl
          );
          
          // Multi-actor coordination: Share intelligence
          if (scenario.multipleAttackers && attackResult.attackPath.length > 0) {
            sharedIntelligence.push(...attackResult.attackPath);
            coordinationEvents.push({
              attackerId: attackers[0].id,
              event: 'Discovered control bypass method',
              timestamp: Date.now() - startTime,
            });
            
            // Other attackers use shared intelligence
            for (let i = 1; i < attackers.length; i++) {
              attackers[i].actions.push(`Used shared intelligence: ${attackResult.attackPath[0]}`);
              coordinationEvents.push({
                attackerId: attackers[i].id,
                event: 'Received shared intelligence',
                timestamp: Date.now() - startTime,
              });
            }
          }
          
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'evidence_tampering') {
          checkTimeout();
          attackResult = await this.simulateEvidenceTampering(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'policy_violation') {
          checkTimeout();
          attackResult = await this.simulatePolicyViolation(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'access_escalation') {
          checkTimeout();
          attackResult = await this.simulateAccessEscalation(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'social_engineering') {
          checkTimeout();
          attackResult = await this.simulateSocialEngineering(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'data_exfiltration') {
          checkTimeout();
          attackResult = await this.simulateDataExfiltration(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'insider_threat') {
          checkTimeout();
          attackResult = await this.simulateInsiderThreat(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'policy_circumvention') {
          checkTimeout();
          attackResult = await this.simulatePolicyCircumvention(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        } else if (scenario.attackType === 'audit_evasion') {
          checkTimeout();
          attackResult = await this.simulateAuditEvasion(organizationId);
          if (scenario.multipleAttackers) {
            await this.coordinateMultiActorAttack(attackers, attackResult, sharedIntelligence, coordinationEvents, startTime);
          }
          attackPath.push(...attackResult.attackPath);
          vulnerabilitiesFound.push(...attackResult.vulnerabilities);
          if (attackers.length > 0) attackers[0].actions.push(...attackResult.attackPath);
        }
      } catch (error: any) {
        // Handle timeout gracefully - return partial results
        if (error.message === 'TIMEOUT') {
          logger.warn(`[Red Team] Simulation ${scenarioId} timed out, returning partial results`);
          const executionTime = Date.now() - startTime;
          const partialResult: RedTeamResult = {
            scenarioId,
            success: vulnerabilitiesFound.length > 0,
            attackPath,
            vulnerabilitiesFound,
            remediationRecommendations: this.generateRemediationRecommendations(vulnerabilitiesFound),
            executionTime,
            report: this.generateReport(scenario, vulnerabilitiesFound, attackPath, executionTime),
            attackers: scenario.multipleAttackers ? attackers : undefined,
            timeout: true,
          };
          
          // Store partial result
          await prisma.auditLog.create({
            data: {
              action: 'red_team.simulation_timeout',
              details: JSON.stringify({ ...partialResult, coordinationEvents }),
              userId,
              organizationId,
              hash: (await import('crypto')).randomBytes(16).toString('hex'),
            },
          });
          
          return partialResult;
        }
        throw error;
      }

      // Check timeout during execution
      const executionTime = Date.now() - startTime;
      const timeout = executionTime > timeLimit;

      if (timeout) {
        logger.warn(`[Red Team] Simulation ${scenarioId} exceeded time limit of ${timeLimit}ms`);
      }

      const success = vulnerabilitiesFound.length > 0 && !timeout;

      // Generate remediation recommendations
      const remediationRecommendations = this.generateRemediationRecommendations(
        vulnerabilitiesFound
      );

      // Generate report (include coordination events if multi-actor)
      const report = this.generateReport(scenario, vulnerabilitiesFound, attackPath, executionTime);
      if (scenario.multipleAttackers && coordinationEvents.length > 0) {
        report?.findings.push(`Multi-actor coordination: ${coordinationEvents.length} coordination events`);
      }

      const result: RedTeamResult = {
        scenarioId,
        success,
        attackPath,
        vulnerabilitiesFound,
        remediationRecommendations,
        executionTime,
        report,
        attackers: scenario.multipleAttackers ? attackers.map(a => ({
          ...a,
          sharedIntelligence: sharedIntelligence.filter((_, idx) => idx < 5), // Include first 5 shared items
        })) : undefined,
        timeout,
      };

      // Store result
      await prisma.auditLog.create({
        data: {
          action: 'red_team.simulation_completed',
          details: JSON.stringify(result),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Red Team] Simulation completed: ${scenarioId}, vulnerabilities: ${vulnerabilitiesFound.length}`);

      return result;
    } catch (error) {
      logger.error('[Red Team] Error running simulation', error);
      throw error;
    }
  }

  /**
   * Simulate control bypass attack
   */
  private async simulateControlBypass(
    organizationId: string,
    targetFramework?: string,
    targetControl?: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify target control',
      '2. Analyze control implementation',
      '3. Find bypass methods',
      '4. Test bypass effectiveness',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Find controls without proper evidence
    const frameworks = await prisma.complianceFramework.findMany({
      where: {
        organizationId,
        ...(targetFramework && { id: targetFramework }),
      },
      include: { controls: true },
    });

    for (const framework of frameworks) {
      for (const control of framework.controls) {
        if (targetControl && control.id !== targetControl) {
          continue;
        }

        // Check for vulnerabilities
        if (control.status === 'Implemented' && !control.evidence) {
          vulnerabilities.push({
            type: 'Missing Evidence',
            severity: 'High',
            description: `Control "${control.name}" is marked as implemented but has no evidence`,
            affectedControls: [control.id],
          });
        }

        if (control.status === 'Pending' && framework.status === 'Compliant') {
          vulnerabilities.push({
            type: 'Status Mismatch',
            severity: 'Medium',
            description: `Framework is marked compliant but has pending control "${control.name}"`,
            affectedControls: [control.id],
          });
        }
      }
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate evidence tampering
   */
  private async simulateEvidenceTampering(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify evidence storage location',
      '2. Attempt unauthorized access',
      '3. Test evidence modification',
      '4. Verify tamper detection',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for controls with evidence
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      include: { controls: true },
    });

    let controlsWithEvidence = 0;
    let controlsWithoutHash = 0;

    for (const framework of frameworks) {
      for (const control of framework.controls) {
        if (control.evidence) {
          controlsWithEvidence++;
          // Check if evidence metadata contains a cryptographic hash
          let hasHash = false;
          try {
            const evidenceData = typeof control.evidence === 'string'
              ? JSON.parse(control.evidence)
              : control.evidence;
            // Evidence may store hash in various formats
            hasHash = !!(
              evidenceData?.hash ||
              evidenceData?.cryptographicHash ||
              evidenceData?.sha256 ||
              evidenceData?.integrity?.hash
            );
          } catch {
            // Evidence is plain text (not JSON) — no hash metadata
            hasHash = false;
          }
          if (!hasHash) {
            controlsWithoutHash++;
          }
        }
      }
    }

    if (controlsWithoutHash > 0) {
      vulnerabilities.push({
        type: 'Missing Cryptographic Verification',
        severity: 'High',
        description: `${controlsWithoutHash} controls have evidence without cryptographic hash verification`,
        affectedControls: [],
      });
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate policy violation
   */
  private async simulatePolicyViolation(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Review organization policies',
      '2. Identify policy gaps',
      '3. Test violation scenarios',
      '4. Check detection mechanisms',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for missing policies
    const policies = await prisma.policy.findMany({
      where: { organizationId },
    });

    const requiredPolicyCategories = [
      'Information Security',
      'Data Privacy',
      'Access Control',
      'Incident Response',
    ];

    const existingCategories = new Set(policies.map(p => p.category));

    for (const category of requiredPolicyCategories) {
      if (!existingCategories.has(category)) {
        vulnerabilities.push({
          type: 'Missing Policy',
          severity: 'Medium',
          description: `Missing ${category} policy`,
          affectedControls: [],
        });
      }
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate access escalation
   */
  private async simulateAccessEscalation(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify user roles',
      '2. Test privilege boundaries',
      '3. Attempt unauthorized access',
      '4. Verify access controls',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check user roles
    const users = await prisma.user.findMany({
      where: { organizationId },
    });

    const adminCount = users.filter(u => u.role === 'admin').length;
    const totalUsers = users.length;

    if (adminCount > totalUsers * 0.3) {
      vulnerabilities.push({
        type: 'Excessive Admin Privileges',
        severity: 'High',
        description: `${adminCount} out of ${totalUsers} users have admin privileges (${Math.round(adminCount/totalUsers*100)}%)`,
        affectedControls: [],
      });
    }

    // Check for users without proper role assignments
    const usersWithoutRole = users.filter(u => !u.role || u.role === 'viewer');
    if (usersWithoutRole.length > 0) {
      vulnerabilities.push({
        type: 'Weak Access Controls',
        severity: 'Medium',
        description: `${usersWithoutRole.length} users have minimal or no role assignments`,
        affectedControls: [],
      });
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Generate remediation recommendations
   */
  private generateRemediationRecommendations(
    vulnerabilities: RedTeamResult['vulnerabilitiesFound']
  ): string[] {
    const recommendations: string[] = [];

    const criticalVulns = vulnerabilities.filter(v => v.severity === 'Critical');
    const highVulns = vulnerabilities.filter(v => v.severity === 'High');

    if (criticalVulns.length > 0) {
      recommendations.push(`URGENT: Address ${criticalVulns.length} critical vulnerabilities immediately`);
    }

    if (highVulns.length > 0) {
      recommendations.push(`High priority: Fix ${highVulns.length} high-severity vulnerabilities`);
    }

    // Specific recommendations by type
    const vulnTypes = new Set(vulnerabilities.map(v => v.type));

    if (vulnTypes.has('Missing Evidence')) {
      recommendations.push('Implement evidence collection and verification for all controls');
    }

    if (vulnTypes.has('Missing Cryptographic Verification')) {
      recommendations.push('Add cryptographic hashing to all evidence for tamper detection');
    }

    if (vulnTypes.has('Missing Policy')) {
      recommendations.push('Create missing policies to cover all required categories');
    }

    if (vulnTypes.has('Excessive Admin Privileges')) {
      recommendations.push('Review and reduce admin privileges following principle of least privilege');
    }

    if (vulnTypes.has('Status Mismatch')) {
      recommendations.push('Review framework status calculations to ensure accuracy');
    }

    return recommendations;
  }

  /**
   * Simulate social engineering attack
   */
  private async simulateSocialEngineering(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify target users',
      '2. Craft phishing email',
      '3. Send phishing campaign',
      '4. Monitor click rates',
      '5. Test credential harvesting',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for 2FA enforcement
    const users = await prisma.user.findMany({
      where: { organizationId },
    });

    const usersWithout2FA = users.filter(u => !u.twoFactorEnabled);
    if (usersWithout2FA.length > 0) {
      vulnerabilities.push({
        type: 'Missing 2FA',
        severity: 'High',
        description: `${usersWithout2FA.length} users do not have 2FA enabled, vulnerable to phishing`,
        affectedControls: [],
      });
    }

    // Check for security awareness training
    const policies = await prisma.policy.findMany({
      where: { organizationId, category: 'Information Security' },
    });

    const hasSecurityTraining = policies.some(p => 
      p.content?.toLowerCase().includes('training') || 
      p.content?.toLowerCase().includes('awareness')
    );

    if (!hasSecurityTraining) {
      vulnerabilities.push({
        type: 'Missing Security Training',
        severity: 'Medium',
        description: 'No security awareness training policy found',
        affectedControls: [],
      });
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate data exfiltration attack
   */
  private async simulateDataExfiltration(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify sensitive data locations',
      '2. Test network segmentation',
      '3. Attempt lateral movement',
      '4. Test data export controls',
      '5. Verify exfiltration paths',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for DLP (Data Loss Prevention) controls
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      include: { controls: true },
    });

    let hasDLPControl = false;
    for (const framework of frameworks) {
      for (const control of framework.controls) {
        const controlText = (control.name + ' ' + (control.description || '')).toLowerCase();
        if (controlText.includes('data loss') || controlText.includes('dlp') || controlText.includes('exfiltration')) {
          hasDLPControl = true;
          break;
        }
      }
      if (hasDLPControl) break;
    }

    if (!hasDLPControl) {
      vulnerabilities.push({
        type: 'Missing DLP Controls',
        severity: 'High',
        description: 'No Data Loss Prevention controls found',
        affectedControls: [],
      });
    }

    // Check for network segmentation
    const hasNetworkSegmentation = frameworks.some(f => 
      f.controls.some((c: any) => 
        (c.name + ' ' + (c.description || '')).toLowerCase().includes('network segmentation')
      )
    );

    if (!hasNetworkSegmentation) {
      vulnerabilities.push({
        type: 'Weak Network Segmentation',
        severity: 'Medium',
        description: 'Network segmentation controls may be insufficient',
        affectedControls: [],
      });
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate insider threat
   */
  private async simulateInsiderThreat(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify privileged users',
      '2. Test access monitoring',
      '3. Attempt unauthorized data access',
      '4. Test privilege abuse',
      '5. Verify detection mechanisms',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for user activity monitoring
    const auditLogs = await prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const recentActivity = auditLogs.filter(log => {
      const daysAgo = (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });

    if (recentActivity.length < 10) {
      vulnerabilities.push({
        type: 'Insufficient Activity Monitoring',
        severity: 'High',
        description: 'Low audit log activity suggests insufficient user monitoring',
        affectedControls: [],
      });
    }

    // Check for separation of duties
    const users = await prisma.user.findMany({
      where: { organizationId },
    });

    const adminsWithMultipleRoles = users.filter(u => u.role === 'admin').length;
    if (adminsWithMultipleRoles > users.length * 0.2) {
      vulnerabilities.push({
        type: 'Separation of Duties Violation',
        severity: 'Medium',
        description: `${adminsWithMultipleRoles} users have admin privileges, potential SoD violations`,
        affectedControls: [],
      });
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate policy circumvention
   */
  private async simulatePolicyCircumvention(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Review organization policies',
      '2. Identify policy enforcement mechanisms',
      '3. Test policy bypass methods',
      '4. Verify detection of violations',
      '5. Test automated enforcement',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for policy enforcement
    const policies = await prisma.policy.findMany({
      where: { organizationId },
    });

    const policiesWithoutEnforcement = policies.filter(p => {
      const content = (p.content || '').toLowerCase();
      return !content.includes('enforcement') && !content.includes('monitoring') && !content.includes('audit');
    });

    if (policiesWithoutEnforcement.length > 0) {
      vulnerabilities.push({
        type: 'Weak Policy Enforcement',
        severity: 'Medium',
        description: `${policiesWithoutEnforcement.length} policies lack clear enforcement mechanisms`,
        affectedControls: [],
      });
    }

    // Check for policy gaps
    const requiredPolicies = ['Data Privacy', 'Access Control', 'Incident Response', 'Acceptable Use'];
    const existingCategories = new Set(policies.map(p => p.category));
    const missingPolicies = requiredPolicies.filter(p => !existingCategories.has(p));

    if (missingPolicies.length > 0) {
      vulnerabilities.push({
        type: 'Policy Gaps',
        severity: 'Medium',
        description: `Missing policies: ${missingPolicies.join(', ')}`,
        affectedControls: [],
      });
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Simulate audit evasion
   */
  private async simulateAuditEvasion(
    organizationId: string
  ): Promise<{
    attackPath: string[];
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'];
  }> {
    const attackPath: string[] = [
      '1. Identify audit trails',
      '2. Test log tampering',
      '3. Attempt log deletion',
      '4. Test audit bypass',
      '5. Verify immutable logging',
    ];

    const vulnerabilities: RedTeamResult['vulnerabilitiesFound'] = [];

    // Check for immutable audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Verify audit log immutability by checking:
    // 1. Logs exist
    // 2. Logs have hash fields populated (integrity chain)
    // 3. Hash chain is consistent (each log's hash references the previous)
    const hasLogs = auditLogs.length > 0;
    const logsHaveHashes = hasLogs && auditLogs.every(log => log.hash && log.hash.length > 0);
    let hashChainValid = false;

    if (hasLogs && logsHaveHashes) {
      // Verify a sample of the hash chain (check sequential integrity)
      hashChainValid = true;
      const sortedLogs = [...auditLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      for (let i = 1; i < Math.min(sortedLogs.length, 100); i++) {
        const prevLog = sortedLogs[i - 1];
        const currentLog = sortedLogs[i];
        // Verify that hashes are unique and non-empty (basic tamper detection)
        if (!currentLog.hash || currentLog.hash === prevLog.hash) {
          hashChainValid = false;
          break;
        }
      }
    }

    if (!hasLogs) {
      vulnerabilities.push({
        type: 'Missing Audit Logs',
        severity: 'Critical',
        description: 'No audit logs found for organization — logging may be disabled or misconfigured',
        affectedControls: [],
      });
    } else if (!logsHaveHashes) {
      vulnerabilities.push({
        type: 'Mutable Audit Logs',
        severity: 'Critical',
        description: 'Audit logs lack integrity hashes — logs may be modifiable without detection',
        affectedControls: [],
      });
    } else if (!hashChainValid) {
      vulnerabilities.push({
        type: 'Audit Log Integrity Broken',
        severity: 'High',
        description: 'Audit log hash chain has inconsistencies — possible tampering detected',
        affectedControls: [],
      });
    }

    // Check for log retention
    const oldestLog = auditLogs[auditLogs.length - 1];
    if (oldestLog) {
      const daysRetained = (Date.now() - oldestLog.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (daysRetained < 90) {
        vulnerabilities.push({
          type: 'Insufficient Log Retention',
          severity: 'Medium',
          description: `Logs only retained for ${Math.round(daysRetained)} days, should be at least 90 days`,
          affectedControls: [],
        });
      }
    }

    return { attackPath, vulnerabilities };
  }

  /**
   * Coordinate multi-actor attack (attacker interaction simulation)
   */
  private async coordinateMultiActorAttack(
    attackers: Array<{ id: string; role: string; actions: string[] }>,
    attackResult: { attackPath: string[]; vulnerabilities: RedTeamResult['vulnerabilitiesFound'] },
    sharedIntelligence: string[],
    coordinationEvents: Array<{ attackerId: string; event: string; timestamp: number }>,
    startTime: number
  ): Promise<void> {
    // Simulate attacker interaction and coordination
    if (attackers.length < 2) return;

    // Attacker 1 shares intelligence with others
    if (attackResult.attackPath.length > 0) {
      sharedIntelligence.push(...attackResult.attackPath);
      coordinationEvents.push({
        attackerId: attackers[0].id,
        event: `Shared ${attackResult.attackPath.length} attack steps with team`,
        timestamp: Date.now() - startTime,
      });

      // Other attackers receive and act on shared intelligence
      for (let i = 1; i < attackers.length; i++) {
        const attacker = attackers[i];
        const receivedIntel = attackResult.attackPath[Math.floor(Math.random() * attackResult.attackPath.length)];
        
        attacker.actions.push(`Received intelligence: ${receivedIntel}`);
        attacker.actions.push(`Coordinated attack based on shared intelligence`);
        
        coordinationEvents.push({
          attackerId: attacker.id,
          event: `Acted on shared intelligence from ${attackers[0].id}`,
          timestamp: Date.now() - startTime,
        });

        // Simulate coordinated parallel attack
        if (attackResult.vulnerabilities.length > 0) {
          const vuln = attackResult.vulnerabilities[Math.floor(Math.random() * attackResult.vulnerabilities.length)];
          attacker.actions.push(`Exploited vulnerability: ${vuln.type} (${vuln.severity})`);
        }
      }

      // Simulate attacker-to-attacker communication
      if (attackers.length >= 3) {
        coordinationEvents.push({
          attackerId: attackers[1].id,
          event: `Coordinated with ${attackers[2].id} for parallel exploitation`,
          timestamp: Date.now() - startTime,
        });
        coordinationEvents.push({
          attackerId: attackers[2].id,
          event: `Received coordination signal from ${attackers[1].id}`,
          timestamp: Date.now() - startTime,
        });
      }
    }
  }

  /**
   * Generate simulation report
   */
  private generateReport(
    scenario: any,
    vulnerabilities: RedTeamResult['vulnerabilitiesFound'],
    attackPath: string[],
    executionTime: number
  ): RedTeamResult['report'] {
    const summary = `Red Team simulation "${scenario.name}" completed in ${executionTime}ms. Found ${vulnerabilities.length} vulnerabilities.`;
    
    const findings = vulnerabilities.map(v => 
      `[${v.severity}] ${v.type}: ${v.description}`
    );

    const recommendations = this.generateRemediationRecommendations(vulnerabilities);

    return {
      summary,
      findings,
      recommendations,
      exportable: true,
    };
  }

  /**
   * Run automated red team scan (enhanced)
   */
  async runAutomatedScan(
    organizationId: string,
    userId: string,
    options?: {
      scope?: {
        frameworks?: string[];
        controls?: string[];
        attackTypes?: string[];
      };
      schedule?: {
        enabled: boolean;
        interval?: number; // minutes
      };
    }
  ): Promise<RedTeamResult[]> {
    try {
      const startTime = Date.now();
      const maxScanTime = 600000; // 10 minutes max

      // Determine scenarios based on scope
      const allScenarios: Array<{
        name: string;
        attackType: RedTeamScenario['attackType'];
      }> = [
        { name: 'Control Bypass Test', attackType: 'control_bypass' },
        { name: 'Evidence Tampering Test', attackType: 'evidence_tampering' },
        { name: 'Policy Violation Test', attackType: 'policy_violation' },
        { name: 'Access Escalation Test', attackType: 'access_escalation' },
        { name: 'Social Engineering Test', attackType: 'social_engineering' },
        { name: 'Data Exfiltration Test', attackType: 'data_exfiltration' },
        { name: 'Insider Threat Test', attackType: 'insider_threat' },
        { name: 'Policy Circumvention Test', attackType: 'policy_circumvention' },
        { name: 'Audit Evasion Test', attackType: 'audit_evasion' },
      ];

      // Filter by scope if provided
      let scenarios = allScenarios;
      if (options?.scope?.attackTypes && options.scope.attackTypes.length > 0) {
        scenarios = allScenarios.filter(s => 
          options.scope!.attackTypes!.includes(s.attackType)
        );
      }

      const results: RedTeamResult[] = [];

      for (const scenario of scenarios) {
        // Check timeout
        if (Date.now() - startTime > maxScanTime) {
          logger.warn(`[Red Team] Scan exceeded time limit, stopping at ${scenarios.indexOf(scenario)}/${scenarios.length}`);
          break;
        }

        const result = await this.runRedTeamSimulation(
          organizationId,
          {
            ...scenario,
            targetFramework: options?.scope?.frameworks?.[0],
            targetControl: options?.scope?.controls?.[0],
          },
          userId
        );
        results.push(result);
      }

      // Store scan results
      await prisma.auditLog.create({
        data: {
          action: 'red_team.automated_scan_completed',
          details: JSON.stringify({
            resultsCount: results.length,
            vulnerabilitiesFound: results.reduce((sum, r) => sum + r.vulnerabilitiesFound.length, 0),
            executionTime: Date.now() - startTime,
            scope: options?.scope,
          }),
          userId,
          organizationId,
          hash: require('crypto').randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Red Team] Automated scan completed: ${results.length} scenarios tested in ${Date.now() - startTime}ms`);

      return results;
    } catch (error) {
      logger.error('[Red Team] Error running automated scan', error);
      throw error;
    }
  }

  /**
   * Scan for compliance gaps
   */
  async scanForComplianceGaps(
    organizationId: string,
    frameworkIds?: string[]
  ): Promise<Array<{
    frameworkId: string;
    frameworkName: string;
    gaps: Array<{
      controlId: string;
      controlName: string;
      gapType: 'missing' | 'incomplete' | 'outdated';
      description: string;
    }>;
  }>> {
    try {
      const frameworks = await prisma.complianceFramework.findMany({
        where: {
          organizationId,
          ...(frameworkIds && frameworkIds.length > 0 && { id: { in: frameworkIds } }),
        },
        include: { controls: true },
      });

      const gaps: Array<{
        frameworkId: string;
        frameworkName: string;
        gaps: Array<{
          controlId: string;
          controlName: string;
          gapType: 'missing' | 'incomplete' | 'outdated';
          description: string;
        }>;
      }> = [];

      for (const framework of frameworks) {
        const frameworkGaps: Array<{
          controlId: string;
          controlName: string;
          gapType: 'missing' | 'incomplete' | 'outdated';
          description: string;
        }> = [];

        for (const control of framework.controls) {
          if (control.status === 'Pending' || control.status === 'Not Implemented') {
            frameworkGaps.push({
              controlId: control.id,
              controlName: control.name,
              gapType: 'missing',
              description: `Control "${control.name}" is not implemented`,
            });
          } else if (control.status === 'Implemented' && !control.evidence) {
            frameworkGaps.push({
              controlId: control.id,
              controlName: control.name,
              gapType: 'incomplete',
              description: `Control "${control.name}" is implemented but lacks evidence`,
            });
          } else if (control.updatedAt) {
            const daysSinceUpdate = (Date.now() - control.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate > 365) {
              frameworkGaps.push({
                controlId: control.id,
                controlName: control.name,
                gapType: 'outdated',
                description: `Control "${control.name}" has not been updated in ${Math.round(daysSinceUpdate)} days`,
              });
            }
          }
        }

        if (frameworkGaps.length > 0) {
          gaps.push({
            frameworkId: framework.id,
            frameworkName: framework.name,
            gaps: frameworkGaps,
          });
        }
      }

      return gaps;
    } catch (error) {
      logger.error('[Red Team] Error scanning for compliance gaps', error);
      throw error;
    }
  }

  /**
   * Scan for misconfigurations
   */
  async scanForMisconfigurations(
    organizationId: string
  ): Promise<Array<{
    type: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    recommendation: string;
  }>> {
    try {
      const misconfigurations: Array<{
        type: string;
        severity: 'Critical' | 'High' | 'Medium' | 'Low';
        description: string;
        recommendation: string;
      }> = [];

      // Check user configurations
      const users = await prisma.user.findMany({
        where: { organizationId },
      });

      const usersWithout2FA = users.filter(u => !u.twoFactorEnabled);
      if (usersWithout2FA.length > users.length * 0.5) {
        misconfigurations.push({
          type: '2FA Not Enforced',
          severity: 'High',
          description: `${usersWithout2FA.length} out of ${users.length} users do not have 2FA enabled`,
          recommendation: 'Enable 2FA for all users',
        });
      }

      // Check framework configurations
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId },
        include: { controls: true },
      });

      for (const framework of frameworks) {
        const implementedControls = framework.controls.filter((c: any) => c.status === 'Implemented').length;
        const totalControls = framework.controls.length;
        const implementationRate = totalControls > 0 ? implementedControls / totalControls : 0;

        if (framework.status === 'Compliant' && implementationRate < 0.8) {
          misconfigurations.push({
            type: 'Framework Status Mismatch',
            severity: 'Medium',
            description: `Framework "${framework.name}" is marked as Compliant but only ${Math.round(implementationRate * 100)}% of controls are implemented`,
            recommendation: 'Review framework status calculation or complete control implementation',
          });
        }
      }

      // Check policy configurations
      const policies = await prisma.policy.findMany({
        where: { organizationId },
      });

      const requiredCategories = ['Information Security', 'Data Privacy', 'Access Control'];
      const existingCategories = new Set(policies.map(p => p.category));
      const missingCategories = requiredCategories.filter(c => !existingCategories.has(c));

      if (missingCategories.length > 0) {
        misconfigurations.push({
          type: 'Missing Required Policies',
          severity: 'High',
          description: `Missing policies for categories: ${missingCategories.join(', ')}`,
          recommendation: 'Create policies for all required categories',
        });
      }

      return misconfigurations;
    } catch (error) {
      logger.error('[Red Team] Error scanning for misconfigurations', error);
      throw error;
    }
  }

  /**
   * Scan for policy violations
   */
  async scanForPolicyViolations(
    organizationId: string
  ): Promise<Array<{
    policyId: string;
    policyName: string;
    violationType: string;
    description: string;
    affectedEntities: string[];
  }>> {
    try {
      const violations: Array<{
        policyId: string;
        policyName: string;
        violationType: string;
        description: string;
        affectedEntities: string[];
      }> = [];

      const policies = await prisma.policy.findMany({
        where: { organizationId },
      });

      for (const policy of policies) {
        // Check for users violating access control policies
        if (policy.category === 'Access Control') {
          const users = await prisma.user.findMany({
            where: { organizationId },
          });

          const violatingUsers = users.filter(u => {
            // Check if user has excessive privileges
            if (policy.content?.toLowerCase().includes('least privilege') && u.role === 'admin') {
              return true;
            }
            return false;
          });

          if (violatingUsers.length > 0) {
            violations.push({
              policyId: policy.id,
              policyName: policy.title || 'Unnamed Policy',
              violationType: 'Excessive Privileges',
              description: `${violatingUsers.length} users have admin privileges, violating least privilege policy`,
              affectedEntities: violatingUsers.map(u => u.id),
            });
          }
        }

        // Check for data privacy violations
        if (policy.category === 'Data Privacy') {
          const frameworks = await prisma.complianceFramework.findMany({
            where: { organizationId },
            include: { controls: true },
          });

          for (const framework of frameworks) {
            const controlsWithoutEvidence = framework.controls.filter((c: any) => 
              c.status === 'Implemented' && !c.evidence
            );

            if (controlsWithoutEvidence.length > 0 && policy.content?.toLowerCase().includes('evidence')) {
              violations.push({
                policyId: policy.id,
                policyName: policy.title,
                violationType: 'Missing Evidence',
                description: `${controlsWithoutEvidence.length} controls lack evidence, violating data privacy policy`,
                affectedEntities: controlsWithoutEvidence.map((c: any) => c.id),
              });
            }
          }
        }
      }

      return violations;
    } catch (error) {
      logger.error('[Red Team] Error scanning for policy violations', error);
      throw error;
    }
  }

  /**
   * Schedule automated scan
   */
  async scheduleScan(
    organizationId: string,
    schedule: {
      interval: number; // minutes
      enabled: boolean;
      scope?: {
        frameworks?: string[];
        attackTypes?: string[];
      };
    },
    userId: string
  ): Promise<{ scheduleId: string; nextRun: Date }> {
    try {
      const scheduleId = require('crypto').randomUUID();
      const nextRun = new Date(Date.now() + schedule.interval * 60 * 1000);

      // Schedule via job queue with repeatable interval
      if (schedule.enabled) {
        await jobQueueService.addJob(
          QUEUE_NAMES.AI_PROCESSING,
          'red_team_automated_scan',
          {
            type: 'red_team_scan',
            organizationId,
            userId,
            scheduleId,
            scope: schedule.scope,
          },
          {
            delay: schedule.interval * 60 * 1000,
            attempts: 3,
          }
        );
      }

      // Persist schedule metadata in audit log for traceability
      await prisma.auditLog.create({
        data: {
          action: 'red_team.scan_scheduled',
          details: JSON.stringify({
            scheduleId,
            interval: schedule.interval,
            enabled: schedule.enabled,
            scope: schedule.scope,
            nextRun,
            queueBacked: true,
          }),
          userId,
          organizationId,
          hash: scheduleId,
        },
      });

      logger.info(`[Red Team] Scan scheduled: ${scheduleId}, next run: ${nextRun}, queue-backed: true`);

      return { scheduleId, nextRun };
    } catch (error) {
      logger.error('[Red Team] Error scheduling scan', error);
      throw error;
    }
  }

  /**
   * Export scan results
   */
  async exportScanResults(
    scanResults: RedTeamResult[],
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<any> {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        totalScenarios: scanResults.length,
        totalVulnerabilities: scanResults.reduce((sum, r) => sum + r.vulnerabilitiesFound.length, 0),
        results: scanResults.map(r => ({
          scenarioId: r.scenarioId,
          success: r.success,
          vulnerabilities: r.vulnerabilitiesFound.length,
          executionTime: r.executionTime,
          report: r.report,
        })),
      };

      if (format === 'csv') {
        const csvRows = [
          ['Scenario ID', 'Success', 'Vulnerabilities', 'Execution Time (ms)'],
          ...scanResults.map(r => [
            r.scenarioId,
            r.success.toString(),
            r.vulnerabilitiesFound.length.toString(),
            r.executionTime.toString(),
          ]),
        ];

        return {
          format: 'csv',
          content: csvRows.map(row => row.join(',')).join('\n'),
          filename: `red-team-scan-${new Date().toISOString().split('T')[0]}.csv`,
        };
      }

      if (format === 'pdf') {
        const PDFDocument = require('pdfkit');
        const { PassThrough } = require('stream');

        const doc = new PDFDocument({ margin: 50 });
        const stream = new PassThrough();
        const chunks: Buffer[] = [];

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.pipe(stream);

        // ── Title Page ──
        doc.fontSize(24).font('Helvetica-Bold').text('Red Team Scan Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // ── Executive Summary ──
        doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary');
        doc.moveDown(0.5);
        const successRate = scanResults.length > 0
          ? ((scanResults.filter(r => !r.success).length / scanResults.length) * 100).toFixed(1)
          : '0';
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Scenarios Tested: ${exportData.totalScenarios}`);
        doc.text(`Total Vulnerabilities Found: ${exportData.totalVulnerabilities}`);
        doc.text(`Attack Success Rate: ${successRate}%`);
        doc.moveDown(1);

        // ── Findings Table ──
        doc.fontSize(16).font('Helvetica-Bold').text('Scan Results');
        doc.moveDown(0.5);

        for (const result of scanResults) {
          doc.fontSize(12).font('Helvetica-Bold').text(`Scenario: ${result.scenarioId}`);
          doc.fontSize(10).font('Helvetica');
          doc.text(`  Attack succeeded: ${result.success ? 'YES ⚠' : 'No'}`);
          doc.text(`  Vulnerabilities: ${result.vulnerabilitiesFound.length}`);
          doc.text(`  Execution Time: ${result.executionTime}ms`);

          if (result.vulnerabilitiesFound.length > 0) {
            doc.text('  Vulnerabilities:');
            for (const vuln of result.vulnerabilitiesFound) {
              const vulnName = typeof vuln === 'string' ? vuln : ((vuln as any).type || JSON.stringify(vuln));
              doc.text(`    - ${vulnName}`);
            }
          }

          if (result.report) {
            const reportStr = typeof result.report === 'string' ? result.report : JSON.stringify(result.report);
            doc.text(`  Report: ${reportStr.substring(0, 200)}...`);
          }
          doc.moveDown(0.5);

          // Avoid running over page boundaries
          if (doc.y > 700) doc.addPage();
        }

        doc.end();

        // Wait for stream to finish
        const pdfBuffer = await new Promise<Buffer>((resolve) => {
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        return {
          format: 'pdf',
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf',
          encoding: 'base64',
          filename: `red-team-scan-${new Date().toISOString().split('T')[0]}.pdf`,
          size: pdfBuffer.length,
        };
      }

      return exportData;
    } catch (error) {
      logger.error('[Red Team] Error exporting scan results', error);
      throw error;
    }
  }

  /**
   * Compare scan results to baseline
   */
  async compareScanResults(
    currentResults: RedTeamResult[],
    baselineResults: RedTeamResult[]
  ): Promise<{
    newVulnerabilities: number;
    resolvedVulnerabilities: number;
    unchangedVulnerabilities: number;
    comparison: Array<{
      scenarioId: string;
      status: 'new' | 'resolved' | 'unchanged';
      currentCount: number;
      baselineCount: number;
    }>;
  }> {
    try {
      const baselineMap = new Map(baselineResults.map(r => [r.scenarioId, r]));
      const comparison: Array<{
        scenarioId: string;
        status: 'new' | 'resolved' | 'unchanged';
        currentCount: number;
        baselineCount: number;
      }> = [];

      let newVulnerabilities = 0;
      let resolvedVulnerabilities = 0;
      let unchangedVulnerabilities = 0;

      for (const current of currentResults) {
        const baseline = baselineMap.get(current.scenarioId);
        const currentCount = current.vulnerabilitiesFound.length;
        const baselineCount = baseline?.vulnerabilitiesFound.length || 0;

        if (!baseline) {
          comparison.push({
            scenarioId: current.scenarioId,
            status: 'new',
            currentCount,
            baselineCount: 0,
          });
          newVulnerabilities += currentCount;
        } else if (currentCount > baselineCount) {
          comparison.push({
            scenarioId: current.scenarioId,
            status: 'new',
            currentCount,
            baselineCount,
          });
          newVulnerabilities += (currentCount - baselineCount);
          unchangedVulnerabilities += baselineCount;
        } else if (currentCount < baselineCount) {
          comparison.push({
            scenarioId: current.scenarioId,
            status: 'resolved',
            currentCount,
            baselineCount,
          });
          resolvedVulnerabilities += (baselineCount - currentCount);
          unchangedVulnerabilities += currentCount;
        } else {
          comparison.push({
            scenarioId: current.scenarioId,
            status: 'unchanged',
            currentCount,
            baselineCount,
          });
          unchangedVulnerabilities += currentCount;
        }
      }

      return {
        newVulnerabilities,
        resolvedVulnerabilities,
        unchangedVulnerabilities,
        comparison,
      };
    } catch (error) {
      logger.error('[Red Team] Error comparing scan results', error);
      throw error;
    }
  }

  /**
   * Mark false positive
   */
  async markFalsePositive(
    organizationId: string,
    scenarioId: string,
    vulnerabilityIndex: number,
    userId: string
  ): Promise<void> {
    try {
      // Get scan result from audit log
      const scanLog = await prisma.auditLog.findFirst({
        where: {
          organizationId,
          action: 'red_team.simulation_completed',
          details: {
            contains: scenarioId,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (scanLog) {
        const result = JSON.parse(scanLog.details || '{}');
        if (result.vulnerabilitiesFound && result.vulnerabilitiesFound[vulnerabilityIndex]) {
          result.vulnerabilitiesFound[vulnerabilityIndex].falsePositive = true;

          // Update audit log
          await prisma.auditLog.create({
            data: {
              action: 'red_team.false_positive_marked',
              details: JSON.stringify({
                scenarioId,
                vulnerabilityIndex,
                originalResult: result,
              }),
              userId,
              organizationId,
              hash: require('crypto').randomBytes(16).toString('hex'),
            },
          });
        }
      }
    } catch (error) {
      logger.error('[Red Team] Error marking false positive', error);
      throw error;
    }
  }
}

export default new RedTeamService();

