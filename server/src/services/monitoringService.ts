import { MonitorStatus } from '@prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import geminiService from './geminiService';


/**
 * Continuous Monitoring & Automated Testing Service
 * Infrastructure, cloud, identity, and device monitoring with auto-remediation
 */
export class MonitoringService {
  /**
   * Create continuous monitor
   */
  async createMonitor(data: {
    organizationId: string;
    name: string;
    monitorType: string;
    integrationId?: string;
    configuration: any;
    testScript?: string;
    frequency?: string;
    userId: string;
  }) {
    const monitor = await prisma.continuousMonitor.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        monitorType: data.monitorType,
        integrationId: data.integrationId,
        configuration: data.configuration,
        testScript: data.testScript,
        frequency: data.frequency || 'Daily',
        status: 'Unknown',
        active: true,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'monitor.created',
      resourceType: 'ContinuousMonitor',
      resourceId: monitor.id,
      metadata: { monitorType: data.monitorType },
    });

    return monitor;
  }

  /**
   * Execute monitor
   */
  async executeMonitor(
    monitorId: string,
    userId: string,
    organizationId: string
  ) {
    const monitor = await prisma.continuousMonitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      throw new Error('Monitor not found');
    }

    // Execute the monitor based on type
    const result = await this.runMonitorTests(monitor);

    // Create monitor result record
    const monitorResult = await prisma.monitorResult.create({
      data: {
        monitorId: monitor.id,
        status: result.status,
        passedTests: result.passedTests,
        failedTests: result.failedTests,
        findings: result.findings,
        evidence: result.evidence,
        autoRemediated: result.autoRemediated,
        remediationActions: result.remediationActions,
      },
    });

    // Update monitor status and last run
    await prisma.continuousMonitor.update({
      where: { id: monitorId },
      data: {
        status: result.status,
        lastRun: new Date(),
        nextRun: this.calculateNextRun(monitor.frequency),
        findings: result.findings,
        alerts: result.alerts,
      },
    });

    // If critical failures, create an issue
    if (result.failedTests > 0 && result.status === 'Failing') {
      await this.createIssueFromFailure(
        monitor,
        monitorResult,
        userId,
        organizationId
      );
    }

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'monitor.executed',
      resourceType: 'ContinuousMonitor',
      resourceId: monitorId,
      metadata: {
        status: result.status,
        passedTests: result.passedTests,
        failedTests: result.failedTests,
      },
    });

    return monitorResult;
  }

  /**
   * Private helper: Run monitor tests
   */
  private async runMonitorTests(monitor: any): Promise<{
    status: MonitorStatus;
    passedTests: number;
    failedTests: number;
    findings: any;
    evidence: any;
    autoRemediated: boolean;
    remediationActions: any;
    alerts: any;
  }> {
    // Simulate test execution based on monitor type
    const testResults = {
      Infrastructure: {
        tests: [
          'SSL Certificate Valid',
          'Firewall Rules Configured',
          'Security Patches Updated',
          'Backup System Operational',
        ],
        passRate: 0.85,
      },
      Cloud: {
        tests: [
          'IAM Policies Compliant',
          'Encryption Enabled',
          'Logging Active',
          'Multi-Region Backup',
        ],
        passRate: 0.9,
      },
      Identity: {
        tests: [
          'MFA Enforced',
          'Password Policy Compliant',
          'Inactive Accounts Disabled',
          'Privileged Access Reviewed',
        ],
        passRate: 0.75,
      },
      Device: {
        tests: [
          'Antivirus Updated',
          'Disk Encryption Enabled',
          'OS Patched',
          'Screen Lock Enabled',
        ],
        passRate: 0.8,
      },
      Code: {
        tests: [
          'Dependency Vulnerabilities Scanned',
          'Static Code Analysis Passed',
          'Secrets Not Hardcoded',
          'Security Headers Configured',
        ],
        passRate: 0.95,
      },
    };

    const config =
      testResults[monitor.monitorType as keyof typeof testResults] ||
      testResults.Infrastructure;

    const totalTests = config.tests.length;
    const passedTests = Math.floor(totalTests * config.passRate);
    const failedTests = totalTests - passedTests;

    const status: MonitorStatus =
      failedTests === 0
        ? 'Passing'
        : failedTests > totalTests * 0.3
        ? 'Failing'
        : 'Warning';

    const findings = config.tests.map((test, index) => ({
      test,
      passed: index < passedTests,
      severity: index >= passedTests ? (index % 2 === 0 ? 'High' : 'Medium') : null,
    }));

    // Auto-remediation for simple failures
    const autoRemediated = failedTests > 0 && failedTests <= 2;
    const remediationActions = autoRemediated
      ? findings
          .filter((f) => !f.passed)
          .map((f) => ({
            test: f.test,
            action: `Automatically ${f.test.toLowerCase()}`,
            status: 'Applied',
          }))
      : null;

    const alerts = {
      count: failedTests,
      critical: failedTests > totalTests * 0.5 ? failedTests : 0,
      warnings: failedTests <= totalTests * 0.5 ? failedTests : 0,
    };

    return {
      status,
      passedTests,
      failedTests,
      findings,
      evidence: {
        timestamp: new Date(),
        testDetails: config.tests,
      },
      autoRemediated,
      remediationActions,
      alerts,
    };
  }

  /**
   * Private helper: Create issue from monitor failure
   */
  private async createIssueFromFailure(
    monitor: any,
    result: any,
    userId: string,
    organizationId: string
  ) {
    const failedFindings = result.findings.findings?.filter(
      (f: any) => !f.passed
    ) || [];

    await prisma.issue.create({
      data: {
        organizationId,
        title: `Monitor Failure: ${monitor.name}`,
        description: `Continuous monitor "${monitor.name}" has detected ${result.failedTests} failed tests.\n\nFailed Tests:\n${failedFindings.map((f: any) => `- ${f.test}`).join('\n')}`,
        issueType: 'Compliance',
        category: monitor.monitorType,
        priority: result.status === 'Failing' ? 'High' : 'Medium',
        status: 'Open',
        createdById: userId,
        slaTarget: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        slaStatus: 'On_Track',
      },
    });
  }

  /**
   * Private helper: Calculate next run time
   */
  private calculateNextRun(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'Hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'Daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'Weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'Monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get monitors by organization
   */
  async getMonitorsByOrganization(
    organizationId: string,
    filters?: {
      monitorType?: string;
      status?: MonitorStatus;
      active?: boolean;
    }
  ) {
    return await prisma.continuousMonitor.findMany({
      where: {
        organizationId,
        ...(filters?.monitorType && { monitorType: filters.monitorType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.active !== undefined && { active: filters.active }),
      },
      include: {
        results: {
          orderBy: { runDate: 'desc' },
          take: 10,
        },
      },
      orderBy: { lastRun: 'desc' },
    });
  }

  /**
   * Get monitoring dashboard
   */
  async getMonitoringDashboard(organizationId: string) {
    const monitors = await prisma.continuousMonitor.findMany({
      where: { organizationId },
      include: {
        results: {
          orderBy: { runDate: 'desc' },
          take: 1,
        },
      },
    });

    return {
      totalMonitors: monitors.length,
      activeMonitors: monitors.filter((m) => m.active).length,
      statusDistribution: {
        passing: monitors.filter((m) => m.status === 'Passing').length,
        warning: monitors.filter((m) => m.status === 'Warning').length,
        failing: monitors.filter((m) => m.status === 'Failing').length,
        unknown: monitors.filter((m) => m.status === 'Unknown').length,
      },
      typeDistribution: {
        infrastructure: monitors.filter((m) => m.monitorType === 'Infrastructure').length,
        cloud: monitors.filter((m) => m.monitorType === 'Cloud').length,
        identity: monitors.filter((m) => m.monitorType === 'Identity').length,
        device: monitors.filter((m) => m.monitorType === 'Device').length,
        code: monitors.filter((m) => m.monitorType === 'Code').length,
      },
      totalAlerts: monitors.reduce(
        (sum, m) => sum + ((m.alerts as any)?.count || 0),
        0
      ),
      criticalAlerts: monitors.reduce(
        (sum, m) => sum + ((m.alerts as any)?.critical || 0),
        0
      ),
      autoRemediatedCount: monitors.reduce(
        (sum, m) =>
          sum +
          (m.results[0]?.autoRemediated ? 1 : 0),
        0
      ),
      failingMonitors: monitors
        .filter((m) => m.status === 'Failing')
        .map((m) => ({
          id: m.id,
          name: m.name,
          monitorType: m.monitorType,
          lastRun: m.lastRun,
          alerts: m.alerts,
        })),
    };
  }

  /**
   * Toggle monitor active status
   */
  async toggleMonitorActive(
    monitorId: string,
    active: boolean,
    userId: string,
    organizationId: string
  ) {
    const monitor = await prisma.continuousMonitor.update({
      where: { id: monitorId },
      data: { active },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: active ? 'monitor.activated' : 'monitor.deactivated',
      resourceType: 'ContinuousMonitor',
      resourceId: monitorId,
      metadata: { active },
    });

    return monitor;
  }

  /**
   * Get a single monitor by ID
   */
  async getMonitorById(monitorId: string, organizationId: string) {
    const monitor = await prisma.continuousMonitor.findFirst({
      where: { id: monitorId, organizationId },
      include: {
        results: {
          orderBy: { runDate: 'desc' },
          take: 30,
        },
      },
    });

    if (!monitor) {
      throw new Error('Monitor not found');
    }

    return monitor;
  }

  /**
   * Update a monitor
   */
  async updateMonitor(
    monitorId: string,
    data: {
      name?: string;
      monitorType?: string;
      configuration?: any;
      testScript?: string;
      frequency?: string;
      active?: boolean;
    },
    userId: string,
    organizationId: string
  ) {
    const monitor = await prisma.continuousMonitor.update({
      where: { id: monitorId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'monitor.updated',
      resourceType: 'ContinuousMonitor',
      resourceId: monitorId,
      metadata: { fields: Object.keys(data) },
    });

    return monitor;
  }

  /**
   * Delete a monitor
   */
  async deleteMonitor(monitorId: string, userId: string, organizationId: string) {
    await prisma.monitorResult.deleteMany({ where: { monitorId } });
    await prisma.continuousMonitor.delete({ where: { id: monitorId } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'monitor.deleted',
      resourceType: 'ContinuousMonitor',
      resourceId: monitorId,
      metadata: {},
    });

    return { success: true };
  }

  /**
   * Get monitor execution results
   */
  async getMonitorResults(monitorId: string, limit = 30) {
    return prisma.monitorResult.findMany({
      where: { monitorId },
      orderBy: { runDate: 'desc' },
      take: limit,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AI-POWERED METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * AI: Analyze monitor trends - predict failures and identify root causes
   */
  async analyzeMonitorTrends(monitorId: string, userId: string, organizationId: string) {
    const monitor = await this.getMonitorById(monitorId, organizationId);
    const results = monitor.results || [];

    const resultsSummary = results.map((r: any) => ({
      date: r.runDate,
      status: r.status,
      passed: r.passedTests,
      failed: r.failedTests,
      autoRemediated: r.autoRemediated,
    }));

    const prompt = `You are a compliance monitoring AI analyst. Analyze the following continuous monitor execution history and provide insights.

Monitor: "${monitor.name}"
Type: ${monitor.monitorType}
Frequency: ${monitor.frequency}
Current Status: ${monitor.status}
Active: ${monitor.active}

Last ${results.length} execution results (newest first):
${JSON.stringify(resultsSummary, null, 2)}

Provide your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "trendDirection": "improving" | "degrading" | "stable",
  "trendSummary": "Brief 1-2 sentence summary of the trend",
  "predictedNextFailureWindow": "e.g., 'Within 48 hours' or 'Low risk in next 7 days'",
  "failureRiskScore": 0-100,
  "rootCauseAnalysis": ["array of identified root causes"],
  "recommendedActions": ["array of specific recommended actions"],
  "anomalies": ["array of unusual patterns detected"],
  "healthScore": 0-100
}`;

    const aiResponse = await geminiService.chatWithBot(prompt, userId);

    try {
      const parsed = JSON.parse(aiResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return parsed;
    } catch {
      return {
        trendDirection: 'stable',
        trendSummary: aiResponse,
        predictedNextFailureWindow: 'Unable to determine',
        failureRiskScore: 50,
        rootCauseAnalysis: [],
        recommendedActions: [],
        anomalies: [],
        healthScore: 50,
      };
    }
  }

  /**
   * AI: Suggest monitors based on compliance frameworks and risk profile
   */
  async suggestMonitors(organizationId: string, userId: string) {
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      select: { name: true, frameworkType: true },
    });

    const existingMonitors = await prisma.continuousMonitor.findMany({
      where: { organizationId },
      select: { name: true, monitorType: true },
    });

    const frameworkNames = frameworks.map((f: any) => f.name || f.frameworkType).join(', ') || 'General compliance';
    const existingNames = existingMonitors.map((m: any) => m.name).join(', ') || 'None';

    const prompt = `Based on these compliance frameworks: ${frameworkNames} and the existing monitors (${existingNames}), suggest the most critical continuous monitors to set up. For each, provide: name, type (Infrastructure/Cloud/Identity/Device/Code), frequency, and why it's needed.

Return ONLY valid JSON in this format (no markdown):
{
  "suggestions": [
    {
      "name": "Monitor name",
      "monitorType": "Infrastructure|Cloud|Identity|Device|Code",
      "frequency": "Hourly|Daily|Weekly|Monthly",
      "reason": "Why this monitor is important",
      "priority": "Critical|High|Medium",
      "configuration": {
        "description": "What this monitor checks",
        "tests": ["test1", "test2"]
      }
    }
  ],
  "summary": "Brief overall recommendation summary"
}`;

    const aiResponse = await geminiService.chatWithBot(prompt, userId);

    try {
      const parsed = JSON.parse(aiResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return parsed;
    } catch {
      return {
        suggestions: [],
        summary: aiResponse,
      };
    }
  }

  /**
   * AI: Triage alerts by prioritizing and categorizing them
   */
  async triageAlerts(organizationId: string, userId: string) {
    const failingMonitors = await prisma.continuousMonitor.findMany({
      where: {
        organizationId,
        status: { in: ['Failing', 'Warning'] },
      },
      include: {
        results: {
          orderBy: { runDate: 'desc' },
          take: 5,
        },
      },
    });

    if (failingMonitors.length === 0) {
      return {
        triageResult: [],
        summary: 'No failing or warning monitors to triage.',
        totalAlerts: 0,
      };
    }

    const alertsSummary = failingMonitors.map((m: any) => ({
      monitorId: m.id,
      name: m.name,
      type: m.monitorType,
      status: m.status,
      alerts: m.alerts,
      findings: m.findings,
      lastRun: m.lastRun,
      recentResults: m.results.map((r: any) => ({
        status: r.status,
        failed: r.failedTests,
        passed: r.passedTests,
        date: r.runDate,
      })),
    }));

    const prompt = `You are a compliance monitoring triage specialist. Analyze these failing/warning monitors and prioritize them by business impact.

Current alerts:
${JSON.stringify(alertsSummary, null, 2)}

Provide triage results in this JSON format (return ONLY valid JSON, no markdown):
{
  "triageResult": [
    {
      "monitorId": "id",
      "monitorName": "name",
      "priority": 1,
      "severity": "Critical|High|Medium|Low",
      "businessImpact": "Description of business impact",
      "category": "Security|Compliance|Operational|Data Protection",
      "suggestedRemediation": "Step-by-step remediation",
      "estimatedEffort": "Quick Fix|Hours|Days",
      "relatedMonitors": ["names of related monitors if any"]
    }
  ],
  "summary": "Overall triage summary",
  "remediationOrder": ["ordered list of monitor names to fix first"],
  "groupedAlerts": {
    "Security": ["monitor names"],
    "Compliance": ["monitor names"],
    "Operational": ["monitor names"]
  }
}`;

    const aiResponse = await geminiService.chatWithBot(prompt, userId);

    try {
      const parsed = JSON.parse(aiResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return { ...parsed, totalAlerts: failingMonitors.length };
    } catch {
      return {
        triageResult: [],
        summary: aiResponse,
        totalAlerts: failingMonitors.length,
        remediationOrder: [],
        groupedAlerts: {},
      };
    }
  }
}

export default new MonitoringService();
