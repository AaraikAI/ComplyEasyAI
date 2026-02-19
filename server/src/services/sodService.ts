import prisma from '../config/database';
import logger from '../config/logger';
import { AuditLogger } from '../utils/auditLogger';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface SoDRule {
  id: string;
  organizationId: string;
  ruleId: string;               // e.g. "SOD-FIN-001"
  name: string;
  description: string;
  conflictingRoleA: string;     // e.g. "AP_Create"
  conflictingRoleB: string;     // e.g. "AP_Approve"
  conflictingFunctionA: string;
  conflictingFunctionB: string;
  system: string;               // SAP, Oracle, Workday, Custom
  riskLevel: string;            // Critical, High, Medium, Low
  riskDescription: string;
  businessProcess: string;      // Procure-to-Pay, Order-to-Cash, Record-to-Report
  regulatoryRef: string;        // SOX, GDPR, PCI-DSS
  enabled: boolean;
  mitigatingControlRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SoDViolation {
  id: string;
  organizationId: string;
  ruleId: string;
  ruleName: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleA: string;
  roleB: string;
  functionA: string;
  functionB: string;
  system: string;
  riskLevel: string;
  status: string;               // Open, Mitigated, Accepted, Remediated
  detectedAt: string;
  resolvedAt: string | null;
  mitigatingControl: string | null;
  acceptanceJustification: string | null;
  acceptedBy: string | null;
  remediationAction: string | null;
  remediatedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// SoD Analysis Service
// ---------------------------------------------------------------------------

export class SoDService {

  // =========================================================================
  // SoDRule CRUD
  // =========================================================================

  async createSoDRule(data: {
    organizationId: string;
    ruleId: string;
    name: string;
    description: string;
    conflictingRoleA: string;
    conflictingRoleB: string;
    conflictingFunctionA: string;
    conflictingFunctionB: string;
    system: string;
    riskLevel: string;
    riskDescription: string;
    businessProcess: string;
    regulatoryRef?: string;
    mitigatingControlRef?: string;
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<SoDRule> {
    const now = new Date().toISOString();
    const id = this.generateId('rule');

    const rule: SoDRule = {
      id,
      organizationId: data.organizationId,
      ruleId: data.ruleId,
      name: data.name,
      description: data.description,
      conflictingRoleA: data.conflictingRoleA,
      conflictingRoleB: data.conflictingRoleB,
      conflictingFunctionA: data.conflictingFunctionA,
      conflictingFunctionB: data.conflictingFunctionB,
      system: data.system,
      riskLevel: data.riskLevel,
      riskDescription: data.riskDescription,
      businessProcess: data.businessProcess,
      regulatoryRef: data.regulatoryRef || 'SOX',
      enabled: true,
      mitigatingControlRef: data.mitigatingControlRef || null,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'SoDRule',
        name: data.name,
        status: 'Active',
        data: rule as unknown as Record<string, unknown>,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'sod_rule.created',
      resourceType: 'SoDRule',
      resourceId: id,
      metadata: { ruleId: data.ruleId, system: data.system },
    });

    logger.info(`[SoD] Rule created: ${data.ruleId} - ${data.name}`);
    return rule;
  }

  async getSoDRules(
    organizationId: string,
    filters?: {
      system?: string;
      riskLevel?: string;
      businessProcess?: string;
      enabled?: boolean;
    }
  ): Promise<SoDRule[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'SoDRule',
      },
      orderBy: { createdAt: 'desc' },
    });

    let rules = objects.map((o) => o.data as unknown as SoDRule);

    if (filters?.system) {
      rules = rules.filter((r) => r.system === filters.system);
    }
    if (filters?.riskLevel) {
      rules = rules.filter((r) => r.riskLevel === filters.riskLevel);
    }
    if (filters?.businessProcess) {
      rules = rules.filter((r) => r.businessProcess === filters.businessProcess);
    }
    if (filters?.enabled !== undefined) {
      rules = rules.filter((r) => r.enabled === filters.enabled);
    }

    return rules;
  }

  async getSoDRuleById(id: string, organizationId: string): Promise<SoDRule | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'SoDRule' },
    });
    return obj ? (obj.data as unknown as SoDRule) : null;
  }

  async updateSoDRule(
    id: string,
    data: Partial<Omit<SoDRule, 'id' | 'organizationId' | 'createdAt'>>,
    userId: string,
    organizationId: string
  ): Promise<SoDRule | null> {
    const existing = await this.getSoDRuleById(id, organizationId);
    if (!existing) return null;

    const updated: SoDRule = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id },
      data: {
        name: updated.name,
        status: updated.enabled ? 'Active' : 'Inactive',
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_rule.updated',
      resourceType: 'SoDRule',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  }

  async deleteSoDRule(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getSoDRuleById(id, organizationId);
    if (!existing) return false;

    await prisma.gRCObject.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_rule.deleted',
      resourceType: 'SoDRule',
      resourceId: id,
      metadata: { ruleId: existing.ruleId },
    });

    logger.info(`[SoD] Rule deleted: ${existing.ruleId}`);
    return true;
  }

  // =========================================================================
  // SoDViolation CRUD
  // =========================================================================

  async createSoDViolation(data: {
    organizationId: string;
    ruleId: string;
    ruleName: string;
    userId: string;
    userName: string;
    userEmail: string;
    roleA: string;
    roleB: string;
    functionA: string;
    functionB: string;
    system: string;
    riskLevel: string;
    metadata?: Record<string, unknown>;
    detectedByUserId: string;
  }): Promise<SoDViolation> {
    const now = new Date().toISOString();
    const id = this.generateId('viol');

    const violation: SoDViolation = {
      id,
      organizationId: data.organizationId,
      ruleId: data.ruleId,
      ruleName: data.ruleName,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      roleA: data.roleA,
      roleB: data.roleB,
      functionA: data.functionA,
      functionB: data.functionB,
      system: data.system,
      riskLevel: data.riskLevel,
      status: 'Open',
      detectedAt: now,
      resolvedAt: null,
      mitigatingControl: null,
      acceptanceJustification: null,
      acceptedBy: null,
      remediationAction: null,
      remediatedBy: null,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'SoDViolation',
        name: `Violation: ${data.ruleName} - ${data.userName}`,
        status: 'Open',
        data: violation as unknown as Record<string, unknown>,
      },
    });

    await AuditLogger.log({
      userId: data.detectedByUserId,
      organizationId: data.organizationId,
      action: 'sod_violation.detected',
      resourceType: 'SoDViolation',
      resourceId: id,
      metadata: {
        ruleId: data.ruleId,
        affectedUser: data.userName,
        riskLevel: data.riskLevel,
      },
    });

    logger.warn(`[SoD] Violation detected: ${data.ruleName} for user ${data.userName}`);
    return violation;
  }

  async getSoDViolations(
    organizationId: string,
    filters?: {
      status?: string;
      riskLevel?: string;
      system?: string;
      userId?: string;
    }
  ): Promise<SoDViolation[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'SoDViolation',
        status: filters?.status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    let violations = objects.map((o) => o.data as unknown as SoDViolation);

    if (filters?.riskLevel) {
      violations = violations.filter((v) => v.riskLevel === filters.riskLevel);
    }
    if (filters?.system) {
      violations = violations.filter((v) => v.system === filters.system);
    }
    if (filters?.userId) {
      violations = violations.filter((v) => v.userId === filters.userId);
    }

    return violations;
  }

  async getSoDViolationById(id: string, organizationId: string): Promise<SoDViolation | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'SoDViolation' },
    });
    return obj ? (obj.data as unknown as SoDViolation) : null;
  }

  // =========================================================================
  // Run SoD Analysis
  // =========================================================================

  async runSoDAnalysis(organizationId: string, userId: string) {
    logger.info(`[SoD] Starting SoD analysis for organization ${organizationId}`);

    // Fetch all enabled rules
    const rules = await this.getSoDRules(organizationId, { enabled: true });
    if (rules.length === 0) {
      return {
        analysisDate: new Date().toISOString(),
        rulesEvaluated: 0,
        usersScanned: 0,
        violationsFound: 0,
        newViolations: [],
        message: 'No enabled SoD rules found. Import or create rules first.',
      };
    }

    // Fetch all users with roles in the organization
    const users = await prisma.user.findMany({
      where: { organizationId, active: true },
      select: { id: true, name: true, email: true, role: true },
    });

    // Fetch existing open violations to avoid duplicates
    const existingViolations = await this.getSoDViolations(organizationId, { status: 'Open' });
    const existingViolationKeys = new Set(
      existingViolations.map((v) => `${v.ruleId}-${v.userId}`)
    );

    const newViolations: SoDViolation[] = [];
    let usersScanned = 0;

    for (const user of users) {
      usersScanned++;
      const userRoles = this.expandUserRoles(user.role);

      for (const rule of rules) {
        const hasRoleA = userRoles.some(
          (r) => r === rule.conflictingRoleA || r.includes(rule.conflictingRoleA)
        );
        const hasRoleB = userRoles.some(
          (r) => r === rule.conflictingRoleB || r.includes(rule.conflictingRoleB)
        );

        if (hasRoleA && hasRoleB) {
          const violationKey = `${rule.id}-${user.id}`;
          if (!existingViolationKeys.has(violationKey)) {
            const violation = await this.createSoDViolation({
              organizationId,
              ruleId: rule.id,
              ruleName: rule.name,
              userId: user.id,
              userName: user.name || user.email,
              userEmail: user.email,
              roleA: rule.conflictingRoleA,
              roleB: rule.conflictingRoleB,
              functionA: rule.conflictingFunctionA,
              functionB: rule.conflictingFunctionB,
              system: rule.system,
              riskLevel: rule.riskLevel,
              detectedByUserId: userId,
            });
            newViolations.push(violation);
          }
        }
      }
    }

    const result = {
      analysisDate: new Date().toISOString(),
      rulesEvaluated: rules.length,
      usersScanned,
      violationsFound: newViolations.length,
      newViolations: newViolations.map((v) => ({
        id: v.id,
        ruleName: v.ruleName,
        userName: v.userName,
        roleA: v.roleA,
        roleB: v.roleB,
        riskLevel: v.riskLevel,
        system: v.system,
      })),
      existingOpenViolations: existingViolations.length,
    };

    logger.info(
      `[SoD] Analysis complete: ${rules.length} rules, ${usersScanned} users, ${newViolations.length} new violations`
    );

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_analysis.completed',
      resourceType: 'SoDAnalysis',
      resourceId: `analysis_${Date.now()}`,
      metadata: {
        rulesEvaluated: rules.length,
        usersScanned,
        violationsFound: newViolations.length,
      },
    });

    return result;
  }

  // =========================================================================
  // SoD Dashboard
  // =========================================================================

  async getSoDDashboard(organizationId: string) {
    const [rules, violations] = await Promise.all([
      this.getSoDRules(organizationId),
      this.getSoDViolations(organizationId),
    ]);

    const openViolations = violations.filter((v) => v.status === 'Open');
    const mitigatedViolations = violations.filter((v) => v.status === 'Mitigated');
    const acceptedViolations = violations.filter((v) => v.status === 'Accepted');
    const remediatedViolations = violations.filter((v) => v.status === 'Remediated');

    // Risk distribution
    const riskDistribution = {
      critical: openViolations.filter((v) => v.riskLevel === 'Critical').length,
      high: openViolations.filter((v) => v.riskLevel === 'High').length,
      medium: openViolations.filter((v) => v.riskLevel === 'Medium').length,
      low: openViolations.filter((v) => v.riskLevel === 'Low').length,
    };

    // System distribution
    const systemDistribution: Record<string, number> = {};
    violations.forEach((v) => {
      systemDistribution[v.system] = (systemDistribution[v.system] || 0) + 1;
    });

    // Top violators (users with most violations)
    const userViolationMap: Record<string, { userName: string; count: number; riskLevels: string[] }> = {};
    openViolations.forEach((v) => {
      if (!userViolationMap[v.userId]) {
        userViolationMap[v.userId] = { userName: v.userName, count: 0, riskLevels: [] };
      }
      userViolationMap[v.userId].count++;
      userViolationMap[v.userId].riskLevels.push(v.riskLevel);
    });
    const topViolators = Object.entries(userViolationMap)
      .map(([uid, data]) => ({ userId: uid, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Business process distribution
    const businessProcessDistribution: Record<string, number> = {};
    rules.forEach((r) => {
      businessProcessDistribution[r.businessProcess] = (businessProcessDistribution[r.businessProcess] || 0) + 1;
    });

    return {
      summary: {
        totalRules: rules.length,
        enabledRules: rules.filter((r) => r.enabled).length,
        totalViolations: violations.length,
        openViolations: openViolations.length,
        mitigatedViolations: mitigatedViolations.length,
        acceptedViolations: acceptedViolations.length,
        remediatedViolations: remediatedViolations.length,
      },
      riskDistribution,
      systemDistribution,
      businessProcessDistribution,
      topViolators,
      recentViolations: openViolations.slice(0, 10).map((v) => ({
        id: v.id,
        ruleName: v.ruleName,
        userName: v.userName,
        riskLevel: v.riskLevel,
        system: v.system,
        detectedAt: v.detectedAt,
      })),
      resolutionRate: violations.length > 0
        ? Math.round(
            ((mitigatedViolations.length + remediatedViolations.length) / violations.length) * 100
          )
        : 0,
    };
  }

  // =========================================================================
  // Mitigate, Accept, Remediate Violations
  // =========================================================================

  async mitigateViolation(
    violationId: string,
    data: { mitigatingControl: string },
    userId: string,
    organizationId: string
  ): Promise<SoDViolation | null> {
    const existing = await this.getSoDViolationById(violationId, organizationId);
    if (!existing) return null;

    const updated: SoDViolation = {
      ...existing,
      status: 'Mitigated',
      mitigatingControl: data.mitigatingControl,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id: violationId },
      data: {
        status: 'Mitigated',
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_violation.mitigated',
      resourceType: 'SoDViolation',
      resourceId: violationId,
      metadata: { mitigatingControl: data.mitigatingControl },
    });

    logger.info(`[SoD] Violation ${violationId} mitigated with control: ${data.mitigatingControl}`);
    return updated;
  }

  async acceptViolation(
    violationId: string,
    data: { justification: string },
    userId: string,
    organizationId: string
  ): Promise<SoDViolation | null> {
    const existing = await this.getSoDViolationById(violationId, organizationId);
    if (!existing) return null;

    const updated: SoDViolation = {
      ...existing,
      status: 'Accepted',
      acceptanceJustification: data.justification,
      acceptedBy: userId,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id: violationId },
      data: {
        status: 'Accepted',
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_violation.accepted',
      resourceType: 'SoDViolation',
      resourceId: violationId,
      metadata: { justification: data.justification },
    });

    logger.info(`[SoD] Violation ${violationId} accepted by ${userId}`);
    return updated;
  }

  async remediateViolation(
    violationId: string,
    data: { remediationAction: string },
    userId: string,
    organizationId: string
  ): Promise<SoDViolation | null> {
    const existing = await this.getSoDViolationById(violationId, organizationId);
    if (!existing) return null;

    const updated: SoDViolation = {
      ...existing,
      status: 'Remediated',
      remediationAction: data.remediationAction,
      remediatedBy: userId,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id: violationId },
      data: {
        status: 'Remediated',
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_violation.remediated',
      resourceType: 'SoDViolation',
      resourceId: violationId,
      metadata: { remediationAction: data.remediationAction },
    });

    logger.info(`[SoD] Violation ${violationId} remediated by ${userId}`);
    return updated;
  }

  // =========================================================================
  // SoD Matrix
  // =========================================================================

  async getSoDMatrix(organizationId: string, system?: string) {
    const rules = await this.getSoDRules(organizationId, {
      enabled: true,
      system,
    });
    const violations = await this.getSoDViolations(organizationId);

    // Build a matrix of conflicting roles
    const roles = new Set<string>();
    rules.forEach((r) => {
      roles.add(r.conflictingRoleA);
      roles.add(r.conflictingRoleB);
    });

    const roleList = Array.from(roles).sort();

    // Initialize matrix
    const matrix: Record<string, Record<string, {
      hasConflict: boolean;
      ruleId: string | null;
      ruleName: string | null;
      riskLevel: string | null;
      violationCount: number;
    }>> = {};

    roleList.forEach((roleA) => {
      matrix[roleA] = {};
      roleList.forEach((roleB) => {
        matrix[roleA][roleB] = {
          hasConflict: false,
          ruleId: null,
          ruleName: null,
          riskLevel: null,
          violationCount: 0,
        };
      });
    });

    // Fill in conflicts from rules
    rules.forEach((rule) => {
      if (matrix[rule.conflictingRoleA] && matrix[rule.conflictingRoleA][rule.conflictingRoleB]) {
        matrix[rule.conflictingRoleA][rule.conflictingRoleB] = {
          hasConflict: true,
          ruleId: rule.id,
          ruleName: rule.name,
          riskLevel: rule.riskLevel,
          violationCount: violations.filter(
            (v) => v.ruleId === rule.id && v.status === 'Open'
          ).length,
        };
        // Mirror the conflict
        matrix[rule.conflictingRoleB][rule.conflictingRoleA] = {
          hasConflict: true,
          ruleId: rule.id,
          ruleName: rule.name,
          riskLevel: rule.riskLevel,
          violationCount: violations.filter(
            (v) => v.ruleId === rule.id && v.status === 'Open'
          ).length,
        };
      }
    });

    return {
      roles: roleList,
      matrix,
      totalConflicts: rules.length,
      systems: [...new Set(rules.map((r) => r.system))],
    };
  }

  // =========================================================================
  // Bulk Import SoD Rules
  // =========================================================================

  async importSoDRules(
    organizationId: string,
    system: string,
    userId: string
  ): Promise<{ imported: number; rules: SoDRule[] }> {
    const templates = this.getSystemRuleTemplates(system);
    if (templates.length === 0) {
      return { imported: 0, rules: [] };
    }

    const importedRules: SoDRule[] = [];

    for (const template of templates) {
      const rule = await this.createSoDRule({
        organizationId,
        ruleId: template.ruleId,
        name: template.name,
        description: template.description,
        conflictingRoleA: template.conflictingRoleA,
        conflictingRoleB: template.conflictingRoleB,
        conflictingFunctionA: template.conflictingFunctionA,
        conflictingFunctionB: template.conflictingFunctionB,
        system,
        riskLevel: template.riskLevel,
        riskDescription: template.riskDescription,
        businessProcess: template.businessProcess,
        regulatoryRef: 'SOX',
        userId,
      });
      importedRules.push(rule);
    }

    logger.info(`[SoD] Imported ${importedRules.length} rules for system: ${system}`);

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_rules.bulk_imported',
      resourceType: 'SoDRule',
      resourceId: `import_${Date.now()}`,
      metadata: { system, count: importedRules.length },
    });

    return { imported: importedRules.length, rules: importedRules };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private generateId(prefix: string): string {
    return `sod_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private expandUserRoles(role: string): string[] {
    // Expand a single role string into component roles for SoD checking
    // In a real system this would query an IAM system; here we simulate
    const roleMap: Record<string, string[]> = {
      admin: [
        'admin', 'AP_Create', 'AP_Approve', 'AR_Create', 'AR_Approve',
        'JE_Create', 'JE_Post', 'GL_Close', 'User_Create', 'User_Modify',
        'PO_Create', 'PO_Approve', 'Vendor_Create', 'Payment_Process',
      ],
      editor: [
        'editor', 'AP_Create', 'AR_Create', 'JE_Create', 'PO_Create',
        'Vendor_Create',
      ],
      viewer: ['viewer'],
      auditor: ['auditor', 'GL_View', 'AP_View', 'AR_View'],
    };

    return roleMap[role] || [role];
  }

  private getSystemRuleTemplates(system: string) {
    const templates: Record<string, Array<{
      ruleId: string;
      name: string;
      description: string;
      conflictingRoleA: string;
      conflictingRoleB: string;
      conflictingFunctionA: string;
      conflictingFunctionB: string;
      riskLevel: string;
      riskDescription: string;
      businessProcess: string;
    }>> = {
      SAP: [
        {
          ruleId: 'SAP-P2P-001',
          name: 'PO Creation vs PO Approval',
          description: 'User should not be able to both create and approve purchase orders',
          conflictingRoleA: 'PO_Create',
          conflictingRoleB: 'PO_Approve',
          conflictingFunctionA: 'Create Purchase Order',
          conflictingFunctionB: 'Approve Purchase Order',
          riskLevel: 'High',
          riskDescription: 'Risk of unauthorized purchases without proper oversight',
          businessProcess: 'Procure-to-Pay',
        },
        {
          ruleId: 'SAP-P2P-002',
          name: 'Vendor Creation vs Payment Processing',
          description: 'User should not be able to both create vendors and process payments',
          conflictingRoleA: 'Vendor_Create',
          conflictingRoleB: 'Payment_Process',
          conflictingFunctionA: 'Create Vendor Master',
          conflictingFunctionB: 'Process Vendor Payment',
          riskLevel: 'Critical',
          riskDescription: 'Risk of creating fictitious vendors and processing fraudulent payments',
          businessProcess: 'Procure-to-Pay',
        },
        {
          ruleId: 'SAP-AP-001',
          name: 'AP Invoice Entry vs AP Payment',
          description: 'User should not be able to both enter AP invoices and process payments',
          conflictingRoleA: 'AP_Create',
          conflictingRoleB: 'AP_Approve',
          conflictingFunctionA: 'Enter AP Invoice',
          conflictingFunctionB: 'Approve AP Payment',
          riskLevel: 'High',
          riskDescription: 'Risk of creating and approving fictitious invoices',
          businessProcess: 'Procure-to-Pay',
        },
        {
          ruleId: 'SAP-GL-001',
          name: 'Journal Entry Creation vs Journal Entry Posting',
          description: 'User should not be able to both create and post journal entries',
          conflictingRoleA: 'JE_Create',
          conflictingRoleB: 'JE_Post',
          conflictingFunctionA: 'Create Journal Entry',
          conflictingFunctionB: 'Post Journal Entry',
          riskLevel: 'High',
          riskDescription: 'Risk of unauthorized adjustments to financial records',
          businessProcess: 'Record-to-Report',
        },
        {
          ruleId: 'SAP-SEC-001',
          name: 'User Administration vs Financial Transactions',
          description: 'User administrators should not have access to financial transaction processing',
          conflictingRoleA: 'User_Create',
          conflictingRoleB: 'Payment_Process',
          conflictingFunctionA: 'Create/Modify Users',
          conflictingFunctionB: 'Process Financial Transactions',
          riskLevel: 'Critical',
          riskDescription: 'Risk of creating unauthorized users with financial access',
          businessProcess: 'IT-General',
        },
      ],
      Oracle: [
        {
          ruleId: 'ORA-P2P-001',
          name: 'Requisition vs PO Approval',
          description: 'User should not be able to both create requisitions and approve purchase orders',
          conflictingRoleA: 'PO_Create',
          conflictingRoleB: 'PO_Approve',
          conflictingFunctionA: 'Create Requisition',
          conflictingFunctionB: 'Approve Purchase Order',
          riskLevel: 'High',
          riskDescription: 'Risk of self-approving purchases',
          businessProcess: 'Procure-to-Pay',
        },
        {
          ruleId: 'ORA-AP-001',
          name: 'Supplier Maintenance vs Invoice Processing',
          description: 'User should not be able to both maintain suppliers and process invoices',
          conflictingRoleA: 'Vendor_Create',
          conflictingRoleB: 'AP_Create',
          conflictingFunctionA: 'Maintain Supplier Records',
          conflictingFunctionB: 'Process AP Invoices',
          riskLevel: 'Critical',
          riskDescription: 'Risk of creating shell suppliers for fraudulent invoicing',
          businessProcess: 'Procure-to-Pay',
        },
        {
          ruleId: 'ORA-GL-001',
          name: 'Journal Entry vs Period Close',
          description: 'User should not be able to both create journal entries and close periods',
          conflictingRoleA: 'JE_Create',
          conflictingRoleB: 'GL_Close',
          conflictingFunctionA: 'Create Journal Entry',
          conflictingFunctionB: 'Close GL Period',
          riskLevel: 'High',
          riskDescription: 'Risk of post-close adjustments without oversight',
          businessProcess: 'Record-to-Report',
        },
      ],
      Workday: [
        {
          ruleId: 'WD-HR-001',
          name: 'Employee Setup vs Payroll Processing',
          description: 'User should not be able to both set up employees and process payroll',
          conflictingRoleA: 'User_Create',
          conflictingRoleB: 'Payment_Process',
          conflictingFunctionA: 'Create Employee Record',
          conflictingFunctionB: 'Process Payroll',
          riskLevel: 'Critical',
          riskDescription: 'Risk of creating ghost employees for payroll fraud',
          businessProcess: 'Hire-to-Retire',
        },
        {
          ruleId: 'WD-FIN-001',
          name: 'Expense Report vs Expense Approval',
          description: 'User should not be able to both submit and approve expense reports',
          conflictingRoleA: 'AP_Create',
          conflictingRoleB: 'AP_Approve',
          conflictingFunctionA: 'Submit Expense Report',
          conflictingFunctionB: 'Approve Expense Report',
          riskLevel: 'High',
          riskDescription: 'Risk of self-approving personal expenses',
          businessProcess: 'Procure-to-Pay',
        },
      ],
    };

    return templates[system] || [];
  }
}

export default new SoDService();
