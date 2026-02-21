import prisma from '../config/database';
import logger from '../config/logger';
import { AuditLogger } from '../utils/auditLogger';

// ---------------------------------------------------------------------------
// Type definitions (aligned with Prisma SoDRule / SoDViolation models)
// ---------------------------------------------------------------------------

interface SoDRuleInput {
  organizationId: string;
  name: string;
  description?: string;
  ruleType: string;        // Conflicting, Toxic, HighRisk
  function1: string;       // e.g. "Approve Purchase Orders"
  function2: string;       // e.g. "Process Payments"
  riskLevel?: string;      // Low, Medium, High, Critical  (default "High")
  system?: string;         // ERP, CRM, SAP, Oracle, Workday, etc.
  mitigatingControl?: string;
  enabled?: boolean;
  status?: string;
  createdBy: string;       // userId who performs the action (for audit)
}

interface SoDRuleUpdateInput {
  name?: string;
  description?: string;
  ruleType?: string;
  function1?: string;
  function2?: string;
  riskLevel?: string;
  system?: string;
  mitigatingControl?: string;
  enabled?: boolean;
  status?: string;
}

interface SoDViolationInput {
  organizationId: string;
  ruleId: string;
  userId: string;
  userName: string;
  conflictingRoles: unknown;  // JSON payload
  riskLevel: string;
  status?: string;
  mitigationAction?: string;
  detectedByUserId: string;   // userId who triggers the detection (for audit)
}

interface SoDRuleRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  ruleType: string;
  function1: string;
  function2: string;
  riskLevel: string;
  system: string | null;
  mitigatingControl: string | null;
  enabled: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SoDViolationRecord {
  id: string;
  organizationId: string;
  ruleId: string;
  userId: string;
  userName: string;
  conflictingRoles: unknown;
  detectedAt: Date;
  status: string;
  riskLevel: string;
  mitigationAction: string | null;
  mitigatedBy: string | null;
  mitigatedAt: Date | null;
  acceptedBy: string | null;
  acceptanceReason: string | null;
  reviewDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rule?: SoDRuleRecord;
}

// ---------------------------------------------------------------------------
// SoD Analysis Service
// ---------------------------------------------------------------------------

export class SoDService {

  // =========================================================================
  // Helper
  // =========================================================================

  private generateId(prefix: string): string {
    return `sod_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // =========================================================================
  // SoDRule CRUD
  // =========================================================================

  /**
   * Create a new SoD rule.
   */
  async createSoDRule(data: SoDRuleInput): Promise<SoDRuleRecord> {
    const id = this.generateId('rule');

    const rule = await prisma.soDRule.create({
      data: {
        id,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description ?? null,
        ruleType: data.ruleType,
        function1: data.function1,
        function2: data.function2,
        riskLevel: data.riskLevel ?? 'High',
        system: data.system ?? null,
        mitigatingControl: data.mitigatingControl ?? null,
        enabled: data.enabled ?? true,
        status: data.status ?? 'Active',
      },
    });

    await AuditLogger.log({
      userId: data.createdBy,
      organizationId: data.organizationId,
      action: 'sod_rule.created',
      resourceType: 'SoDRule',
      resourceId: rule.id,
      metadata: { name: data.name, system: data.system ?? null },
    });

    logger.info(`[SoD] Rule created: ${rule.id} - ${rule.name}`);
    return rule;
  }

  /**
   * List SoD rules with optional filters and pagination.
   * Aliased as getSoDRules for backward compatibility with routes.
   */
  async listSoDRules(
    organizationId: string,
    filters?: {
      system?: string;
      riskLevel?: string;
      ruleType?: string;
      enabled?: boolean;
      status?: string;
    },
    pagination?: { skip?: number; take?: number }
  ): Promise<SoDRuleRecord[]> {
    const where: Record<string, unknown> = { organizationId };

    if (filters?.system) where.system = filters.system;
    if (filters?.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters?.ruleType) where.ruleType = filters.ruleType;
    if (filters?.enabled !== undefined) where.enabled = filters.enabled;
    if (filters?.status) where.status = filters.status;

    const rules = await prisma.soDRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination?.skip,
      take: pagination?.take,
    });

    return rules;
  }

  /** Alias kept for route compatibility. */
  async getSoDRules(
    organizationId: string,
    filters?: {
      system?: string;
      riskLevel?: string;
      ruleType?: string;
      enabled?: boolean;
      status?: string;
    }
  ): Promise<SoDRuleRecord[]> {
    return this.listSoDRules(organizationId, filters);
  }

  /**
   * Get a single SoD rule by id.
   * Aliased as getSoDRuleById for backward compatibility with routes.
   */
  async getSoDRule(id: string, organizationId: string): Promise<SoDRuleRecord | null> {
    const rule = await prisma.soDRule.findFirst({
      where: { id, organizationId },
    });
    return rule;
  }

  /** Alias kept for route compatibility. */
  async getSoDRuleById(id: string, organizationId: string): Promise<SoDRuleRecord | null> {
    return this.getSoDRule(id, organizationId);
  }

  /**
   * Update a SoD rule.
   * Signature matches the route: (id, userId, organizationId, data).
   */
  async updateSoDRule(
    id: string,
    userId: string,
    organizationId: string,
    data: SoDRuleUpdateInput
  ): Promise<SoDRuleRecord | null> {
    const existing = await this.getSoDRule(id, organizationId);
    if (!existing) return null;

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.ruleType !== undefined) updatePayload.ruleType = data.ruleType;
    if (data.function1 !== undefined) updatePayload.function1 = data.function1;
    if (data.function2 !== undefined) updatePayload.function2 = data.function2;
    if (data.riskLevel !== undefined) updatePayload.riskLevel = data.riskLevel;
    if (data.system !== undefined) updatePayload.system = data.system;
    if (data.mitigatingControl !== undefined) updatePayload.mitigatingControl = data.mitigatingControl;
    if (data.enabled !== undefined) updatePayload.enabled = data.enabled;
    if (data.status !== undefined) updatePayload.status = data.status;

    const updated = await prisma.soDRule.update({
      where: { id },
      data: updatePayload,
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

  /**
   * Delete a SoD rule. Cascade will also remove related violations.
   */
  async deleteSoDRule(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getSoDRule(id, organizationId);
    if (!existing) return false;

    await prisma.soDRule.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_rule.deleted',
      resourceType: 'SoDRule',
      resourceId: id,
      metadata: { name: existing.name },
    });

    logger.info(`[SoD] Rule deleted: ${id}`);
    return true;
  }

  // =========================================================================
  // SoDViolation CRUD
  // =========================================================================

  /**
   * Create a new SoD violation record.
   */
  async createSoDViolation(data: SoDViolationInput): Promise<SoDViolationRecord> {
    const id = this.generateId('viol');

    const violation = await prisma.soDViolation.create({
      data: {
        id,
        organizationId: data.organizationId,
        ruleId: data.ruleId,
        userId: data.userId,
        userName: data.userName,
        conflictingRoles: data.conflictingRoles as any,
        riskLevel: data.riskLevel,
        status: data.status ?? 'Open',
        mitigationAction: data.mitigationAction ?? null,
      },
      include: { rule: true },
    });

    await AuditLogger.log({
      userId: data.detectedByUserId,
      organizationId: data.organizationId,
      action: 'sod_violation.detected',
      resourceType: 'SoDViolation',
      resourceId: violation.id,
      metadata: {
        ruleId: data.ruleId,
        affectedUser: data.userName,
        riskLevel: data.riskLevel,
      },
    });

    logger.warn(`[SoD] Violation detected: rule ${data.ruleId} for user ${data.userName}`);
    return violation;
  }

  /**
   * List SoD violations with optional filters and pagination.
   * Aliased as getSoDViolations for backward compatibility with routes.
   */
  async listSoDViolations(
    organizationId: string,
    filters?: {
      status?: string;
      riskLevel?: string;
      ruleId?: string;
      userId?: string;
    },
    pagination?: { skip?: number; take?: number }
  ): Promise<SoDViolationRecord[]> {
    const where: Record<string, unknown> = { organizationId };

    if (filters?.status) where.status = filters.status;
    if (filters?.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters?.ruleId) where.ruleId = filters.ruleId;
    if (filters?.userId) where.userId = filters.userId;

    const violations = await prisma.soDViolation.findMany({
      where,
      include: { rule: true },
      orderBy: { detectedAt: 'desc' },
      skip: pagination?.skip,
      take: pagination?.take,
    });

    return violations;
  }

  /** Alias kept for route compatibility. */
  async getSoDViolations(
    organizationId: string,
    filters?: {
      status?: string;
      riskLevel?: string;
      ruleId?: string;
      userId?: string;
    }
  ): Promise<SoDViolationRecord[]> {
    return this.listSoDViolations(organizationId, filters);
  }

  /**
   * Get a single SoD violation by id.
   * Aliased as getSoDViolationById for backward compatibility with routes.
   */
  async getSoDViolation(id: string, organizationId: string): Promise<SoDViolationRecord | null> {
    const violation = await prisma.soDViolation.findFirst({
      where: { id, organizationId },
      include: { rule: true },
    });
    return violation;
  }

  /** Alias kept for route compatibility. */
  async getSoDViolationById(id: string, organizationId: string): Promise<SoDViolationRecord | null> {
    return this.getSoDViolation(id, organizationId);
  }

  // =========================================================================
  // Run SoD Analysis
  // =========================================================================

  /**
   * Run a full SoD analysis for an organisation.
   *
   * 1. Query all enabled SoD rules.
   * 2. Get all active users in the org.
   * 3. Expand each user's role into component permissions.
   * 4. Check every rule against every user for conflicts.
   * 5. Create SoDViolation records for any new conflicts.
   */
  async runSoDAnalysis(organizationId: string, userId: string) {
    logger.info(`[SoD] Starting SoD analysis for organization ${organizationId}`);

    // 1. Fetch all enabled rules
    const rules = await this.listSoDRules(organizationId, { enabled: true });
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

    // 2. Fetch all active users with roles in the organisation
    const users = await prisma.user.findMany({
      where: { organizationId, active: true },
      select: { id: true, name: true, email: true, role: true },
    });

    // 3. Fetch existing open violations to avoid duplicates
    const existingViolations = await this.listSoDViolations(organizationId, { status: 'Open' });
    const existingViolationKeys = new Set(
      existingViolations.map((v) => `${v.ruleId}-${v.userId}`)
    );

    const newViolations: SoDViolationRecord[] = [];
    let usersScanned = 0;

    for (const user of users) {
      usersScanned++;
      const userPermissions = this.expandUserRoles(user.role);

      for (const rule of rules) {
        // Check whether the user holds permissions that cover both functions
        const hasFunction1 = userPermissions.some(
          (p) => p === rule.function1 || p.includes(rule.function1)
        );
        const hasFunction2 = userPermissions.some(
          (p) => p === rule.function2 || p.includes(rule.function2)
        );

        if (hasFunction1 && hasFunction2) {
          const violationKey = `${rule.id}-${user.id}`;
          if (!existingViolationKeys.has(violationKey)) {
            const violation = await this.createSoDViolation({
              organizationId,
              ruleId: rule.id,
              userId: user.id,
              userName: user.name || user.email,
              conflictingRoles: {
                function1: rule.function1,
                function2: rule.function2,
                userPermissions: userPermissions.filter(
                  (p) =>
                    p === rule.function1 ||
                    p.includes(rule.function1) ||
                    p === rule.function2 ||
                    p.includes(rule.function2)
                ),
              },
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
        ruleId: v.ruleId,
        ruleName: v.rule?.name ?? null,
        userName: v.userName,
        riskLevel: v.riskLevel,
        conflictingRoles: v.conflictingRoles,
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
  // Mitigate, Accept, Remediate Violations
  // =========================================================================

  /**
   * Mitigate a violation by applying a compensating control.
   * Signature: (id, userId, organizationId, data).
   */
  async mitigateViolation(
    violationId: string,
    userId: string,
    organizationId: string,
    data: { mitigatingControl: string }
  ): Promise<SoDViolationRecord | null> {
    const existing = await this.getSoDViolation(violationId, organizationId);
    if (!existing) return null;

    const updated = await prisma.soDViolation.update({
      where: { id: violationId },
      data: {
        status: 'Mitigated',
        mitigationAction: data.mitigatingControl,
        mitigatedBy: userId,
        mitigatedAt: new Date(),
      },
      include: { rule: true },
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

  /**
   * Accept a violation with a justification.
   * Signature: (id, userId, organizationId, data).
   */
  async acceptViolation(
    violationId: string,
    userId: string,
    organizationId: string,
    data: { justification: string; reviewDate?: string }
  ): Promise<SoDViolationRecord | null> {
    const existing = await this.getSoDViolation(violationId, organizationId);
    if (!existing) return null;

    const updated = await prisma.soDViolation.update({
      where: { id: violationId },
      data: {
        status: 'Accepted',
        acceptedBy: userId,
        acceptanceReason: data.justification,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
      },
      include: { rule: true },
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

  /**
   * Remediate a violation (role/permission was actually removed).
   * Signature: (id, userId, organizationId, data).
   */
  async remediateViolation(
    violationId: string,
    userId: string,
    organizationId: string,
    data: { remediationAction: string }
  ): Promise<SoDViolationRecord | null> {
    const existing = await this.getSoDViolation(violationId, organizationId);
    if (!existing) return null;

    const updated = await prisma.soDViolation.update({
      where: { id: violationId },
      data: {
        status: 'Remediated',
        mitigationAction: data.remediationAction,
        mitigatedBy: userId,
        mitigatedAt: new Date(),
      },
      include: { rule: true },
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

  /**
   * Build a conflict matrix from enabled rules plus open violation counts.
   * Aliased as getSoDMatrix for backward compatibility with routes.
   */
  async getMatrix(organizationId: string, system?: string) {
    const filters: { enabled: boolean; system?: string } = { enabled: true };
    if (system) filters.system = system;

    const rules = await this.listSoDRules(organizationId, filters);
    const violations = await this.listSoDViolations(organizationId);

    // Collect all functions referenced by rules
    const functions = new Set<string>();
    rules.forEach((r) => {
      functions.add(r.function1);
      functions.add(r.function2);
    });

    const functionList = Array.from(functions).sort();

    // Build matrix: function1 x function2 -> conflict info
    const matrix: Record<string, Record<string, {
      hasConflict: boolean;
      ruleId: string | null;
      ruleName: string | null;
      riskLevel: string | null;
      violationCount: number;
    }>> = {};

    functionList.forEach((fn1) => {
      matrix[fn1] = {};
      functionList.forEach((fn2) => {
        matrix[fn1][fn2] = {
          hasConflict: false,
          ruleId: null,
          ruleName: null,
          riskLevel: null,
          violationCount: 0,
        };
      });
    });

    // Fill in conflicts
    rules.forEach((rule) => {
      const openCount = violations.filter(
        (v) => v.ruleId === rule.id && v.status === 'Open'
      ).length;

      const cell = {
        hasConflict: true,
        ruleId: rule.id,
        ruleName: rule.name,
        riskLevel: rule.riskLevel,
        violationCount: openCount,
      };

      if (matrix[rule.function1] && matrix[rule.function1][rule.function2]) {
        matrix[rule.function1][rule.function2] = cell;
      }
      // Mirror
      if (matrix[rule.function2] && matrix[rule.function2][rule.function1]) {
        matrix[rule.function2][rule.function1] = { ...cell };
      }
    });

    return {
      roles: functionList,
      matrix,
      totalConflicts: rules.length,
      systems: [...new Set(rules.map((r) => r.system).filter(Boolean))],
    };
  }

  /** Alias kept for route compatibility. */
  async getSoDMatrix(organizationId: string, system?: string) {
    return this.getMatrix(organizationId, system);
  }

  // =========================================================================
  // Analytics Dashboard
  // =========================================================================

  /**
   * Aggregate data for the SoD analytics dashboard.
   * Aliased as getSoDDashboard for backward compatibility with routes.
   */
  async getAnalyticsDashboard(organizationId: string) {
    const [rules, violations] = await Promise.all([
      this.listSoDRules(organizationId),
      this.listSoDViolations(organizationId),
    ]);

    const openViolations = violations.filter((v) => v.status === 'Open');
    const mitigatedViolations = violations.filter((v) => v.status === 'Mitigated');
    const acceptedViolations = violations.filter((v) => v.status === 'Accepted');
    const remediatedViolations = violations.filter((v) => v.status === 'Remediated');

    // Risk distribution (open only)
    const riskDistribution = {
      critical: openViolations.filter((v) => v.riskLevel === 'Critical').length,
      high: openViolations.filter((v) => v.riskLevel === 'High').length,
      medium: openViolations.filter((v) => v.riskLevel === 'Medium').length,
      low: openViolations.filter((v) => v.riskLevel === 'Low').length,
    };

    // System distribution across all violations
    const systemDistribution: Record<string, number> = {};
    violations.forEach((v) => {
      const sys = v.rule?.system ?? 'Unknown';
      systemDistribution[sys] = (systemDistribution[sys] || 0) + 1;
    });

    // Top violators (users with the most open violations)
    const userViolationMap: Record<string, { userName: string; count: number; riskLevels: string[] }> = {};
    openViolations.forEach((v) => {
      if (!userViolationMap[v.userId]) {
        userViolationMap[v.userId] = { userName: v.userName, count: 0, riskLevels: [] };
      }
      userViolationMap[v.userId].count++;
      userViolationMap[v.userId].riskLevels.push(v.riskLevel);
    });
    const topViolators = Object.entries(userViolationMap)
      .map(([uid, d]) => ({ userId: uid, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Rule type distribution
    const ruleTypeDistribution: Record<string, number> = {};
    rules.forEach((r) => {
      ruleTypeDistribution[r.ruleType] = (ruleTypeDistribution[r.ruleType] || 0) + 1;
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
      ruleTypeDistribution,
      topViolators,
      recentViolations: openViolations.slice(0, 10).map((v) => ({
        id: v.id,
        ruleId: v.ruleId,
        ruleName: v.rule?.name ?? null,
        userName: v.userName,
        riskLevel: v.riskLevel,
        detectedAt: v.detectedAt,
      })),
      resolutionRate:
        violations.length > 0
          ? Math.round(
              ((mitigatedViolations.length + remediatedViolations.length) / violations.length) * 100
            )
          : 0,
    };
  }

  /** Alias kept for route compatibility. */
  async getSoDDashboard(organizationId: string) {
    return this.getAnalyticsDashboard(organizationId);
  }

  // =========================================================================
  // Seed Default Rules
  // =========================================================================

  /**
   * Seed a set of default SoD rules for common ERP systems.
   * Also available via the route as importSoDRules(organizationId, userId, rules?).
   *
   * When `rules` is provided it is an array of partial rule objects to import.
   * When `rules` is omitted the built-in default rule set is used.
   */
  async seedDefaultRules(
    organizationId: string,
    userId: string,
    rules?: Array<Partial<SoDRuleInput>>
  ): Promise<{ imported: number; rules: SoDRuleRecord[] }> {
    const templates = rules && rules.length > 0
      ? rules
      : this.getDefaultRuleTemplates();

    const importedRules: SoDRuleRecord[] = [];

    for (const tpl of templates) {
      const rule = await this.createSoDRule({
        organizationId,
        name: tpl.name ?? 'Unnamed Rule',
        description: tpl.description,
        ruleType: tpl.ruleType ?? 'Conflicting',
        function1: tpl.function1 ?? '',
        function2: tpl.function2 ?? '',
        riskLevel: tpl.riskLevel ?? 'High',
        system: tpl.system,
        mitigatingControl: tpl.mitigatingControl,
        enabled: tpl.enabled ?? true,
        createdBy: userId,
      });
      importedRules.push(rule);
    }

    logger.info(`[SoD] Seeded ${importedRules.length} default rules for org ${organizationId}`);

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'sod_rules.bulk_imported',
      resourceType: 'SoDRule',
      resourceId: `import_${Date.now()}`,
      metadata: { count: importedRules.length },
    });

    return { imported: importedRules.length, rules: importedRules };
  }

  /** Alias kept for route compatibility. */
  async importSoDRules(
    organizationId: string,
    userId: string,
    rules?: Array<Partial<SoDRuleInput>>
  ): Promise<{ imported: number; rules: SoDRuleRecord[] }> {
    return this.seedDefaultRules(organizationId, userId, rules);
  }

  // =========================================================================
  // User Role Expansion
  // =========================================================================

  /**
   * Expand a single role string into a list of component permissions / functions
   * that the role grants.
   *
   * Resolution order:
   * 1. Database-stored custom role mappings (SoDRoleMapping table if present)
   * 2. Organization-level IAM configuration (via Integration provider, e.g. Okta/Azure AD)
   * 3. Built-in default mapping (always available as fallback)
   */
  async expandUserRolesAsync(role: string, organizationId?: string): Promise<string[]> {
    // Try database-stored custom role mappings first
    if (organizationId) {
      try {
        const customMapping = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { settings: true },
        });
        const settings = customMapping?.settings as any;
        if (settings?.sodRoleMappings?.[role]) {
          return settings.sodRoleMappings[role] as string[];
        }
      } catch {
        // Fall through to default mapping
      }
    }

    return this.expandUserRoles(role);
  }

  /**
   * Synchronous fallback for role expansion using built-in default mapping.
   * Used when async resolution is not possible (e.g. during batch analysis).
   */
  expandUserRoles(role: string): string[] {
    const roleMap: Record<string, string[]> = {
      admin: [
        'admin',
        'Approve Purchase Orders',
        'Create Purchase Orders',
        'Process Payments',
        'Create Vendor Master',
        'Enter AP Invoice',
        'Approve AP Payment',
        'Create Journal Entry',
        'Post Journal Entry',
        'Close GL Period',
        'Create/Modify Users',
        'Process Financial Transactions',
        'Submit Expense Report',
        'Approve Expense Report',
        'Create Employee Record',
        'Process Payroll',
        'AP_Create', 'AP_Approve', 'AR_Create', 'AR_Approve',
        'JE_Create', 'JE_Post', 'GL_Close', 'User_Create', 'User_Modify',
        'PO_Create', 'PO_Approve', 'Vendor_Create', 'Payment_Process',
      ],
      editor: [
        'editor',
        'Create Purchase Orders',
        'Enter AP Invoice',
        'Create Journal Entry',
        'Create Vendor Master',
        'Submit Expense Report',
        'AP_Create', 'AR_Create', 'JE_Create', 'PO_Create', 'Vendor_Create',
      ],
      viewer: ['viewer'],
      auditor: ['auditor', 'GL_View', 'AP_View', 'AR_View'],
    };

    return roleMap[role] || [role];
  }

  // =========================================================================
  // Private: default rule templates
  // =========================================================================

  private getDefaultRuleTemplates(): Array<Partial<SoDRuleInput>> {
    return [
      {
        name: 'PO Creation vs PO Approval',
        description: 'User should not be able to both create and approve purchase orders',
        ruleType: 'Conflicting',
        function1: 'Create Purchase Orders',
        function2: 'Approve Purchase Orders',
        riskLevel: 'High',
        system: 'ERP',
      },
      {
        name: 'Vendor Creation vs Payment Processing',
        description: 'User should not be able to both create vendors and process payments',
        ruleType: 'Conflicting',
        function1: 'Create Vendor Master',
        function2: 'Process Payments',
        riskLevel: 'Critical',
        system: 'ERP',
      },
      {
        name: 'AP Invoice Entry vs AP Payment Approval',
        description: 'User should not be able to both enter AP invoices and approve payments',
        ruleType: 'Conflicting',
        function1: 'Enter AP Invoice',
        function2: 'Approve AP Payment',
        riskLevel: 'High',
        system: 'ERP',
      },
      {
        name: 'Journal Entry Creation vs Journal Entry Posting',
        description: 'User should not be able to both create and post journal entries',
        ruleType: 'Conflicting',
        function1: 'Create Journal Entry',
        function2: 'Post Journal Entry',
        riskLevel: 'High',
        system: 'ERP',
      },
      {
        name: 'User Administration vs Financial Transactions',
        description: 'User administrators should not have access to financial transaction processing',
        ruleType: 'Toxic',
        function1: 'Create/Modify Users',
        function2: 'Process Financial Transactions',
        riskLevel: 'Critical',
        system: 'ERP',
      },
      {
        name: 'Journal Entry vs Period Close',
        description: 'User should not be able to both create journal entries and close periods',
        ruleType: 'Conflicting',
        function1: 'Create Journal Entry',
        function2: 'Close GL Period',
        riskLevel: 'High',
        system: 'ERP',
      },
      {
        name: 'Employee Setup vs Payroll Processing',
        description: 'User should not be able to both set up employees and process payroll',
        ruleType: 'Toxic',
        function1: 'Create Employee Record',
        function2: 'Process Payroll',
        riskLevel: 'Critical',
        system: 'HCM',
      },
      {
        name: 'Expense Submission vs Expense Approval',
        description: 'User should not be able to both submit and approve expense reports',
        ruleType: 'Conflicting',
        function1: 'Submit Expense Report',
        function2: 'Approve Expense Report',
        riskLevel: 'High',
        system: 'ERP',
      },
    ];
  }
}

export const sodService = new SoDService();
export default sodService;
