import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';
import { AuditLogger } from '../utils/auditLogger';

// ---------------------------------------------------------------------------
// Type definitions (aligned with Prisma models)
// ---------------------------------------------------------------------------

interface ManagedDeviceRecord {
  id: string;
  organizationId: string;
  deviceName: string;
  deviceType: string;           // Mobile, Tablet, Laptop, Desktop, IoT
  platform: string;             // iOS, Android, Windows, macOS, Linux, ChromeOS
  osVersion: string | null;
  serialNumber: string | null;
  imei: string | null;
  macAddress: string | null;
  enrolledAt: Date;
  lastCheckIn: Date | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  compliance: string;           // Compliant, NonCompliant, Unknown, Pending
  encryptionEnabled: boolean;
  passcodeSet: boolean;
  jailbroken: boolean;
  vpnEnabled: boolean;
  antivirusInstalled: boolean;
  antivirusUpToDate: boolean;
  osUpToDate: boolean;
  firewallEnabled: boolean;
  autoUpdateEnabled: boolean;
  screenLockTimeout: number | null;
  installedApps: unknown | null;
  blockedApps: unknown | null;
  networkProfiles: unknown | null;
  location: unknown | null;
  batteryLevel: number | null;
  storageUsed: number | null;
  storageTotal: number | null;
  status: string;               // Active, etc.
  riskScore: number;
  lastSecurityScan: Date | null;
  policies: unknown | null;
  tags: string[];
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MDMPolicyRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  policyType: string;           // Security, AppManagement, Network, Restriction, Compliance
  platform: string[];           // iOS, Android, Windows, macOS, All
  settings: unknown;            // Policy settings/configurations
  priority: number;
  enforced: boolean;
  assignedGroups: unknown | null;
  assignedDeviceCount: number;
  status: string;               // Active, Inactive, Draft
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceActionRecord {
  id: string;
  deviceId: string;
  actionType: string;           // Lock, Wipe, Locate, Restart, UpdateOS, InstallApp, RemoveApp
  initiatedBy: string;
  status: string;               // Pending, InProgress, Completed, Failed
  result: unknown | null;
  error: string | null;
  scheduledAt: Date | null;
  executedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface DeviceComplianceCheckRecord {
  id: string;
  deviceId: string;
  checkType: string;
  passed: boolean;
  details: string | null;
  checkedAt: Date;
}

interface MDMPolicyRule {
  id: string;
  ruleType: string;             // RequireEncryption, RequirePasscode, BlockApp, RequireUpdate, etc.
  parameter: string;
  value: string;
  severity: string;             // Critical, High, Medium, Low
  enforcementAction: string;    // Warn, Block, Wipe, Notify
}

// ---------------------------------------------------------------------------
// MDM Service
// ---------------------------------------------------------------------------

export class MDMService {

  // =========================================================================
  // Device CRUD
  // =========================================================================

  /**
   * Enroll a new device into MDM.
   * Accepts `enrolledBy` or `userId` for the acting user.
   */
  async enrollDevice(data: {
    organizationId: string;
    deviceName: string;
    deviceType: string;
    platform: string;
    osVersion?: string;
    serialNumber?: string;
    imei?: string;
    assignedUserId?: string;
    assignedUserName?: string;
    macAddress?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    enrolledBy?: string;
    userId?: string;
  }): Promise<ManagedDeviceRecord> {
    const actingUserId = data.enrolledBy || data.userId || 'system';

    const device = await prisma.managedDevice.create({
      data: {
        organizationId: data.organizationId,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        platform: data.platform,
        osVersion: data.osVersion ?? null,
        serialNumber: data.serialNumber ?? null,
        imei: data.imei ?? null,
        assignedUserId: data.assignedUserId ?? null,
        assignedUserName: data.assignedUserName ?? null,
        macAddress: data.macAddress ?? null,
        status: 'Active',
        compliance: 'Unknown',
        encryptionEnabled: false,
        passcodeSet: false,
        firewallEnabled: false,
        antivirusInstalled: false,
        autoUpdateEnabled: false,
        jailbroken: false,
        tags: data.tags ?? [],
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        lastCheckIn: new Date(),
      },
    });

    await AuditLogger.log({
      userId: actingUserId,
      organizationId: data.organizationId,
      action: 'mdm_device.enrolled',
      resourceType: 'ManagedDevice',
      resourceId: device.id,
      metadata: {
        deviceName: data.deviceName,
        platform: data.platform,
        serialNumber: data.serialNumber ?? null,
      },
    });

    logger.info(`[MDM] Device enrolled: ${data.deviceName} (${data.serialNumber ?? 'no-serial'})`);
    return device as unknown as ManagedDeviceRecord;
  }

  /**
   * List devices for an organization with optional filters and pagination.
   */
  async listDevices(
    organizationId: string,
    filters?: {
      status?: string;
      compliance?: string;
      platform?: string;
      deviceType?: string;
      assignedUserId?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<ManagedDeviceRecord[]> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;

    const devices = await prisma.managedDevice.findMany({
      where: {
        organizationId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.compliance ? { compliance: filters.compliance } : {}),
        ...(filters?.platform ? { platform: filters.platform } : {}),
        ...(filters?.deviceType ? { deviceType: filters.deviceType } : {}),
        ...(filters?.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return devices as unknown as ManagedDeviceRecord[];
  }

  /** Backward-compatible alias used by routes. */
  async getDevices(
    organizationId: string,
    filters?: {
      status?: string;
      compliance?: string;
      platform?: string;
      deviceType?: string;
      assignedUserId?: string;
    },
  ): Promise<ManagedDeviceRecord[]> {
    return this.listDevices(organizationId, filters);
  }

  /**
   * Get a single device by ID and organization.
   */
  async getDevice(id: string, organizationId: string): Promise<ManagedDeviceRecord | null> {
    const device = await prisma.managedDevice.findFirst({
      where: { id, organizationId },
      include: { actions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    return device ? (device as unknown as ManagedDeviceRecord) : null;
  }

  /** Backward-compatible alias used by routes. */
  async getDeviceById(id: string, organizationId: string): Promise<ManagedDeviceRecord | null> {
    return this.getDevice(id, organizationId);
  }

  /**
   * Update device fields.
   * Signature matches route usage: (id, userId, organizationId, data).
   */
  async updateDevice(
    id: string,
    userId: string,
    organizationId: string,
    data: Partial<Omit<ManagedDeviceRecord, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<ManagedDeviceRecord | null> {
    const existing = await prisma.managedDevice.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return null;

    // Strip out fields that should not be directly set via update
    const { updatedAt: _u, ...rest } = data as any;

    const updated = await prisma.managedDevice.update({
      where: { id },
      data: {
        ...rest,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'mdm_device.updated',
      resourceType: 'ManagedDevice',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
    });

    return updated as unknown as ManagedDeviceRecord;
  }

  /**
   * Unenroll (retire) a device.
   */
  async unenrollDevice(
    id: string,
    userId: string,
    organizationId: string,
  ): Promise<ManagedDeviceRecord | null> {
    const existing = await prisma.managedDevice.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return null;

    const updated = await prisma.managedDevice.update({
      where: { id },
      data: {
        status: 'Retired',
        compliance: 'Unknown',
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'mdm_device.unenrolled',
      resourceType: 'ManagedDevice',
      resourceId: id,
      metadata: { deviceName: existing.deviceName },
    });

    logger.info(`[MDM] Device unenrolled: ${existing.deviceName}`);
    return updated as unknown as ManagedDeviceRecord;
  }

  /**
   * Permanently delete a device record. Cascading deletes remove
   * associated DeviceAction and DeviceComplianceCheck rows.
   */
  async deleteDevice(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await prisma.managedDevice.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return false;

    await prisma.managedDevice.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'mdm_device.deleted',
      resourceType: 'ManagedDevice',
      resourceId: id,
      metadata: { deviceName: existing.deviceName, serialNumber: existing.serialNumber },
    });

    return true;
  }

  // =========================================================================
  // MDMPolicy CRUD
  // =========================================================================

  /**
   * Create a new MDM policy.
   * Accepts `createdBy` or `userId` for the acting user.
   */
  async createPolicy(data: {
    organizationId: string;
    name: string;
    description?: string;
    policyType: string;
    platform?: string | string[];
    priority?: number;
    settings?: Record<string, unknown>;
    rules?: MDMPolicyRule[];
    assignedGroups?: string[] | Record<string, unknown>;
    metadata?: Record<string, unknown>;
    createdBy?: string;
    userId?: string;
  }): Promise<MDMPolicyRecord> {
    const actingUserId = data.createdBy || data.userId || 'system';

    // Normalize platform to string[] for the Prisma model
    const platformArr: string[] = Array.isArray(data.platform)
      ? data.platform
      : data.platform
        ? [data.platform]
        : ['All'];

    // Store rules inside the JSON settings column
    const settings = {
      ...(data.settings ?? {}),
      rules: (data.rules ?? []).map((r, i) => ({ ...r, id: r.id || `rule_${i}_${Date.now()}` })),
    };

    const policy = await prisma.mDMPolicy.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description ?? null,
        policyType: data.policyType,
        platform: platformArr,
        settings: settings as Prisma.InputJsonValue,
        priority: data.priority ?? 0,
        enforced: true,
        assignedGroups: data.assignedGroups ? (data.assignedGroups as Prisma.InputJsonValue) : Prisma.JsonNull,
        createdBy: actingUserId,
        status: 'Active',
      },
    });

    await AuditLogger.log({
      userId: actingUserId,
      organizationId: data.organizationId,
      action: 'mdm_policy.created',
      resourceType: 'MDMPolicy',
      resourceId: policy.id,
      metadata: {
        policyType: data.policyType,
        platform: platformArr,
        rulesCount: (data.rules ?? []).length,
      },
    });

    logger.info(`[MDM] Policy created: ${data.name}`);
    return policy as unknown as MDMPolicyRecord;
  }

  /**
   * List policies for an organization with optional filters and pagination.
   */
  async listPolicies(
    organizationId: string,
    filters?: {
      policyType?: string;
      platform?: string;
      enforced?: boolean;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<MDMPolicyRecord[]> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;

    const policies = await prisma.mDMPolicy.findMany({
      where: {
        organizationId,
        ...(filters?.policyType ? { policyType: filters.policyType } : {}),
        ...(filters?.platform ? { platform: { has: filters.platform } } : {}),
        ...(filters?.enforced !== undefined ? { enforced: filters.enforced } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return policies as unknown as MDMPolicyRecord[];
  }

  /** Backward-compatible alias used by routes. */
  async getPolicies(
    organizationId: string,
    filters?: { policyType?: string; platform?: string; enforced?: boolean },
  ): Promise<MDMPolicyRecord[]> {
    return this.listPolicies(organizationId, filters);
  }

  /**
   * Get a single policy by ID and organization.
   */
  async getPolicy(id: string, organizationId: string): Promise<MDMPolicyRecord | null> {
    const policy = await prisma.mDMPolicy.findFirst({
      where: { id, organizationId },
    });
    return policy ? (policy as unknown as MDMPolicyRecord) : null;
  }

  /** Backward-compatible alias used by routes. */
  async getPolicyById(id: string, organizationId: string): Promise<MDMPolicyRecord | null> {
    return this.getPolicy(id, organizationId);
  }

  /**
   * Update policy fields.
   * Signature matches route usage: (id, userId, organizationId, data).
   */
  async updatePolicy(
    id: string,
    userId: string,
    organizationId: string,
    data: Partial<Omit<MDMPolicyRecord, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<MDMPolicyRecord | null> {
    const existing = await prisma.mDMPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return null;

    const { updatedAt: _u, ...rest } = data as any;

    // Derive status from enforced flag when it is provided
    const statusOverride: Record<string, string> = {};
    if (rest.enforced === true) statusOverride.status = 'Active';
    if (rest.enforced === false) statusOverride.status = 'Inactive';

    const updated = await prisma.mDMPolicy.update({
      where: { id },
      data: {
        ...rest,
        ...statusOverride,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'mdm_policy.updated',
      resourceType: 'MDMPolicy',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
    });

    return updated as unknown as MDMPolicyRecord;
  }

  /**
   * Delete a policy.
   */
  async deletePolicy(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await prisma.mDMPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return false;

    await prisma.mDMPolicy.delete({ where: { id } });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'mdm_policy.deleted',
      resourceType: 'MDMPolicy',
      resourceId: id,
      metadata: { policyName: existing.name },
    });

    return true;
  }

  // =========================================================================
  // DeviceAction management
  // =========================================================================

  /**
   * Execute (create) a device action.
   * Accepts `action` or `actionType` for the type, and `initiatedBy` or `userId`.
   */
  async executeAction(data: {
    organizationId: string;
    deviceId: string;
    actionType?: string;
    action?: string;
    metadata?: Record<string, unknown>;
    initiatedBy?: string;
    userId?: string;
  }): Promise<DeviceActionRecord> {
    const actingUserId = data.initiatedBy || data.userId || 'system';
    const actionType = data.actionType || data.action || 'Unknown';

    const device = await prisma.managedDevice.findFirst({
      where: { id: data.deviceId, organizationId: data.organizationId },
    });
    if (!device) {
      throw new Error(`Device not found: ${data.deviceId}`);
    }

    const actionRecord = await prisma.deviceAction.create({
      data: {
        deviceId: data.deviceId,
        actionType,
        status: 'Pending',
        initiatedBy: actingUserId,
      },
    });

    // Simulate action execution
    await this.executeDeviceAction(actionRecord as unknown as DeviceActionRecord, device as unknown as ManagedDeviceRecord);

    await AuditLogger.log({
      userId: actingUserId,
      organizationId: data.organizationId,
      action: 'mdm_device_action.created',
      resourceType: 'DeviceAction',
      resourceId: actionRecord.id,
      metadata: { actionType, deviceName: device.deviceName },
    });

    logger.info(`[MDM] Device action initiated: ${actionType} on ${device.deviceName}`);

    // Return the freshly-updated record
    const freshAction = await prisma.deviceAction.findUnique({ where: { id: actionRecord.id } });
    return (freshAction ?? actionRecord) as unknown as DeviceActionRecord;
  }

  /** Backward-compatible alias used by routes. */
  async createDeviceAction(data: {
    organizationId: string;
    deviceId: string;
    actionType?: string;
    action?: string;
    metadata?: Record<string, unknown>;
    initiatedBy?: string;
    userId?: string;
  }): Promise<DeviceActionRecord> {
    return this.executeAction(data);
  }

  /**
   * List device actions with optional filters and pagination.
   */
  async listActions(
    organizationId: string,
    filters?: {
      deviceId?: string;
      actionType?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<DeviceActionRecord[]> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;

    const actions = await prisma.deviceAction.findMany({
      where: {
        device: { organizationId },
        ...(filters?.deviceId ? { deviceId: filters.deviceId } : {}),
        ...(filters?.actionType ? { actionType: filters.actionType } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return actions as unknown as DeviceActionRecord[];
  }

  /** Backward-compatible alias used by routes. */
  async getDeviceActions(
    organizationId: string,
    filters?: { deviceId?: string; actionType?: string; status?: string },
  ): Promise<DeviceActionRecord[]> {
    return this.listActions(organizationId, filters);
  }

  // =========================================================================
  // Compliance
  // =========================================================================

  /**
   * Get the overall compliance status for the organization.
   */
  async getComplianceStatus(organizationId: string) {
    const devices = await prisma.managedDevice.findMany({
      where: {
        organizationId,
        status: { notIn: ['Retired', 'Wiped'] },
      },
    });

    const compliant = devices.filter((d) => d.compliance === 'Compliant').length;
    const nonCompliant = devices.filter((d) => d.compliance === 'NonCompliant').length;
    const unknown = devices.filter((d) => d.compliance === 'Unknown').length;
    const pendingCheck = devices.filter((d) => d.compliance === 'Pending').length;

    return {
      total: devices.length,
      compliant,
      nonCompliant,
      unknown,
      pendingCheck,
      complianceRate: devices.length > 0 ? Math.round((compliant / devices.length) * 100) : 0,
    };
  }

  /** Backward-compatible alias used by routes (GET /compliance). */
  async checkDeviceCompliance(organizationId: string) {
    return this.getComplianceStatus(organizationId);
  }

  /**
   * Run a compliance check for a single device against active policies.
   */
  async runComplianceCheck(
    deviceId: string,
    organizationId: string,
    userId: string,
  ) {
    const device = await prisma.managedDevice.findFirst({
      where: { id: deviceId, organizationId },
    });
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    // Fetch enforced policies that target this device's platform
    const policies = await prisma.mDMPolicy.findMany({
      where: {
        organizationId,
        enforced: true,
        platform: { has: device.platform },
      },
    });

    const complianceResults: Array<{
      policyId: string;
      policyName: string;
      ruleId: string;
      ruleType: string;
      compliant: boolean;
      details: string;
      severity: string;
    }> = [];

    for (const policy of policies) {
      const settings = policy.settings as Record<string, unknown> | null;
      const rules = (settings?.rules ?? []) as MDMPolicyRule[];

      for (const rule of rules) {
        const result = this.evaluateRule(device as unknown as ManagedDeviceRecord, rule);
        complianceResults.push({
          policyId: policy.id,
          policyName: policy.name,
          ruleId: rule.id,
          ruleType: rule.ruleType,
          compliant: result.compliant,
          details: result.details,
          severity: rule.severity,
        });
      }
    }

    const totalRules = complianceResults.length;
    const compliantRules = complianceResults.filter((r) => r.compliant).length;
    const isCompliant = compliantRules === totalRules;
    const compliancePercentage = totalRules > 0 ? Math.round((compliantRules / totalRules) * 100) : 100;

    const overallStatus = isCompliant ? 'Compliant' : 'NonCompliant';
    const violationsList = complianceResults.filter((r) => !r.compliant);

    // Persist the compliance check result
    const complianceCheck = await prisma.deviceComplianceCheck.create({
      data: {
        deviceId,
        checkType: 'FullCompliance',
        passed: isCompliant,
        details: JSON.stringify({
          overallStatus,
          compliancePercentage,
          results: complianceResults,
          violations: violationsList,
        }),
      },
    });

    // Update device compliance status and last check-in
    await prisma.managedDevice.update({
      where: { id: deviceId },
      data: {
        compliance: overallStatus,
        lastCheckIn: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'mdm_compliance_check.completed',
      resourceType: 'DeviceComplianceCheck',
      resourceId: complianceCheck.id,
      metadata: {
        deviceId,
        deviceName: device.deviceName,
        overallStatus,
        compliancePercentage,
      },
    });

    logger.info(
      `[MDM] Compliance check for ${device.deviceName}: ${overallStatus} (${compliancePercentage}%)`,
    );

    return {
      id: complianceCheck.id,
      deviceId,
      deviceName: device.deviceName,
      complianceStatus: overallStatus,
      compliancePercentage,
      totalRules,
      compliantRules,
      nonCompliantRules: totalRules - compliantRules,
      criticalViolations: violationsList.filter((r) => r.severity === 'Critical').length,
      highViolations: violationsList.filter((r) => r.severity === 'High').length,
      results: complianceResults,
      checkedAt: complianceCheck.checkedAt.toISOString(),
    };
  }

  // =========================================================================
  // Bulk Device Action
  // =========================================================================

  async bulkDeviceAction(data: {
    organizationId: string;
    deviceIds: string[];
    actionType?: string;
    action?: string;
    initiatedBy?: string;
    userId?: string;
  }) {
    const actingUserId = data.initiatedBy || data.userId || 'system';
    const actionType = data.actionType || data.action || 'Unknown';

    const results: Array<{
      deviceId: string;
      deviceName: string;
      success: boolean;
      actionId: string | null;
      error: string | null;
    }> = [];

    for (const deviceId of data.deviceIds) {
      try {
        const actionRecord = await this.executeAction({
          organizationId: data.organizationId,
          deviceId,
          actionType,
          initiatedBy: actingUserId,
        });
        // Fetch device name
        const device = await prisma.managedDevice.findUnique({ where: { id: deviceId } });
        results.push({
          deviceId,
          deviceName: device?.deviceName ?? 'Unknown',
          success: true,
          actionId: actionRecord.id,
          error: null,
        });
      } catch (error: any) {
        results.push({
          deviceId,
          deviceName: 'Unknown',
          success: false,
          actionId: null,
          error: error.message,
        });
      }
    }

    const summary = {
      totalDevices: data.deviceIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      actionType,
      results,
    };

    await AuditLogger.log({
      userId: actingUserId,
      organizationId: data.organizationId,
      action: 'mdm_device_action.bulk_executed',
      resourceType: 'DeviceAction',
      resourceId: `bulk_${Date.now()}`,
      metadata: {
        actionType,
        totalDevices: data.deviceIds.length,
        successful: summary.successful,
        failed: summary.failed,
      },
    });

    logger.info(
      `[MDM] Bulk action ${actionType}: ${summary.successful}/${summary.totalDevices} successful`,
    );

    return summary;
  }

  // =========================================================================
  // MDM Dashboard – aggregates real data from the database
  // =========================================================================

  async getDashboard(organizationId: string) {
    // Run all aggregation queries in parallel for best performance
    const [
      totalDevices,
      enrolledCount,
      activeCount,
      nonCompliantStatusCount,
      lostCount,
      retiredCount,
      wipedCount,
      compliantCount,
      nonCompliantComplianceCount,
      unknownComplianceCount,
      pendingCheckCount,
      encryptionEnabledCount,
      firewallEnabledCount,
      antivirusInstalledCount,
      autoUpdateEnabledCount,
      passcodeSetCount,
      jailbrokenCount,
      allDevicesForPlatform,
      totalPolicies,
      enforcedPolicies,
      allPoliciesForType,
      recentActions,
    ] = await Promise.all([
      prisma.managedDevice.count({ where: { organizationId } }),
      prisma.managedDevice.count({ where: { organizationId, status: 'Enrolled' } }),
      prisma.managedDevice.count({ where: { organizationId, status: 'Active' } }),
      prisma.managedDevice.count({ where: { organizationId, status: 'NonCompliant' } }),
      prisma.managedDevice.count({ where: { organizationId, status: 'Lost' } }),
      prisma.managedDevice.count({ where: { organizationId, status: 'Retired' } }),
      prisma.managedDevice.count({ where: { organizationId, status: 'Wiped' } }),
      prisma.managedDevice.count({ where: { organizationId, compliance: 'Compliant', status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, compliance: 'NonCompliant', status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, compliance: 'Unknown', status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, compliance: 'Pending', status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, encryptionEnabled: true, status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, firewallEnabled: true, status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, antivirusInstalled: true, status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, autoUpdateEnabled: true, status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, passcodeSet: true, status: { notIn: ['Retired', 'Wiped'] } } }),
      prisma.managedDevice.count({ where: { organizationId, jailbroken: true, status: { notIn: ['Retired', 'Wiped'] } } }),
      // For platform & deviceType distribution we need the actual records (grouped)
      prisma.managedDevice.findMany({
        where: { organizationId, status: { notIn: ['Retired', 'Wiped'] } },
        select: { platform: true, deviceType: true },
      }),
      prisma.mDMPolicy.count({ where: { organizationId } }),
      prisma.mDMPolicy.count({ where: { organizationId, enforced: true } }),
      prisma.mDMPolicy.findMany({
        where: { organizationId },
        select: { policyType: true },
      }),
      prisma.deviceAction.findMany({
        where: { device: { organizationId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { device: { select: { deviceName: true } } },
      }),
    ]);

    const activeDeviceCount = totalDevices - retiredCount - wipedCount;

    // Build platform distribution
    const platformDistribution: Record<string, number> = {};
    const deviceTypeDistribution: Record<string, number> = {};
    for (const d of allDevicesForPlatform) {
      platformDistribution[d.platform] = (platformDistribution[d.platform] || 0) + 1;
      deviceTypeDistribution[d.deviceType] = (deviceTypeDistribution[d.deviceType] || 0) + 1;
    }

    // Policy type distribution
    const policyByType: Record<string, number> = {};
    for (const p of allPoliciesForType) {
      policyByType[p.policyType] = (policyByType[p.policyType] || 0) + 1;
    }

    // Device statistics
    const deviceStats = {
      total: totalDevices,
      active: activeDeviceCount,
      enrolled: enrolledCount,
      nonCompliant: nonCompliantStatusCount,
      lost: lostCount,
      retired: retiredCount,
      wiped: wipedCount,
    };

    // Compliance overview
    const complianceOverview = {
      compliant: compliantCount,
      nonCompliant: nonCompliantComplianceCount,
      pending: pendingCheckCount,
      unknown: unknownComplianceCount,
      complianceRate: activeDeviceCount > 0
        ? Math.round((compliantCount / activeDeviceCount) * 100)
        : 0,
    };

    // Security posture
    const securityPosture = {
      encryptionEnabled: encryptionEnabledCount,
      firewallEnabled: firewallEnabledCount,
      antivirusInstalled: antivirusInstalledCount,
      autoUpdateEnabled: autoUpdateEnabledCount,
      passcodeSet: passcodeSetCount,
      jailbrokenDevices: jailbrokenCount,
    };

    // Policy stats
    const policyStats = {
      totalPolicies,
      enforcedPolicies,
      byType: policyByType,
    };

    // Recent actions
    const recentActionsList = recentActions.map((a) => ({
      id: a.id,
      deviceName: (a as any).device?.deviceName ?? 'Unknown',
      actionType: a.actionType,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    }));

    return {
      deviceStats,
      complianceOverview,
      platformDistribution,
      deviceTypeDistribution,
      securityPosture,
      policyStats,
      recentActions: recentActionsList,
    };
  }

  /** Backward-compatible alias used by routes. */
  async getMDMDashboard(organizationId: string) {
    return this.getDashboard(organizationId);
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private generateId(prefix: string): string {
    return `mdm_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Simulate MDM command execution and update the action record.
   *
   * NOTE: In production this should integrate with real MDM providers
   * (e.g. Microsoft Intune, Jamf Pro, VMware Workspace ONE) via their
   * respective APIs. The current implementation is a simulation only.
   */
  private async executeDeviceAction(
    action: DeviceActionRecord,
    device: ManagedDeviceRecord,
  ): Promise<void> {
    const now = new Date();
    let result: Record<string, unknown>;
    const deviceUpdate: Record<string, unknown> = {};

    switch (action.actionType) {
      case 'Lock':
      case 'lock':
        deviceUpdate.passcodeSet = true;
        result = { message: 'Device locked successfully' };
        break;
      case 'Wipe':
      case 'wipe':
        deviceUpdate.status = 'Wiped';
        deviceUpdate.compliance = 'Unknown';
        result = { message: 'Device wipe initiated' };
        break;
      case 'Locate':
      case 'locate':
        // NOTE: Simulated coordinates for development/demo purposes.
        // In production, integrate with the MDM provider's locate API
        // (e.g. Intune locateDevice, Jamf sendMDMCommand).
        result = {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
          accuracy: '50m',
          timestamp: now.toISOString(),
        };
        break;
      case 'Restart':
      case 'restart':
        result = { message: 'Restart command sent to device' };
        break;
      case 'UpdateOS':
      case 'updateos':
        deviceUpdate.autoUpdateEnabled = true;
        result = { message: 'OS update initiated' };
        break;
      default:
        result = { message: `Action ${action.actionType} queued for execution` };
    }

    // Update the action record to Completed
    await prisma.deviceAction.update({
      where: { id: action.id },
      data: {
        status: 'Completed',
        result: result as Prisma.InputJsonValue,
        completedAt: now,
      },
    });

    // Apply side-effects to the device if any
    if (Object.keys(deviceUpdate).length > 0) {
      await prisma.managedDevice.update({
        where: { id: device.id },
        data: deviceUpdate,
      });
    }
  }

  /**
   * Evaluate a single policy rule against a device's current state.
   */
  private evaluateRule(
    device: ManagedDeviceRecord,
    rule: MDMPolicyRule,
  ): { compliant: boolean; details: string } {
    switch (rule.ruleType) {
      case 'RequireEncryption':
        return {
          compliant: device.encryptionEnabled,
          details: device.encryptionEnabled
            ? 'Encryption is enabled'
            : 'Encryption is not enabled on this device',
        };
      case 'RequirePasscode':
      case 'RequireScreenLock':
        return {
          compliant: device.passcodeSet,
          details: device.passcodeSet
            ? 'Screen lock / passcode requirements met'
            : 'Device does not meet screen lock / passcode requirements',
        };
      case 'RequireFirewall':
        return {
          compliant: device.firewallEnabled,
          details: device.firewallEnabled
            ? 'Firewall is enabled'
            : 'Firewall is not enabled',
        };
      case 'RequireAntivirus':
        return {
          compliant: device.antivirusInstalled,
          details: device.antivirusInstalled
            ? 'Antivirus is active'
            : 'Antivirus is not installed or not active',
        };
      case 'RequireAutoUpdate':
        return {
          compliant: device.autoUpdateEnabled,
          details: device.autoUpdateEnabled
            ? 'Auto-update is enabled'
            : 'Auto-update is not enabled',
        };
      case 'BlockJailbreak':
        return {
          compliant: !device.jailbroken,
          details: device.jailbroken
            ? 'Device is jailbroken/rooted'
            : 'Device is not jailbroken',
        };
      case 'BlockApp': {
        const apps = (device.installedApps ?? []) as string[];
        const blocked = apps.includes(rule.value);
        return {
          compliant: !blocked,
          details: blocked
            ? `Blocked app "${rule.value}" is installed`
            : `Blocked app "${rule.value}" is not present`,
        };
      }
      case 'RequireOSVersion': {
        const osVersion = device.osVersion ?? '0';
        const meetsVersion = this.compareVersions(osVersion, rule.value) >= 0;
        return {
          compliant: meetsVersion,
          details: meetsVersion
            ? `OS version ${osVersion} meets minimum ${rule.value}`
            : `OS version ${osVersion} is below minimum ${rule.value}`,
        };
      }
      default:
        return { compliant: true, details: `Rule type ${rule.ruleType} not evaluated` };
    }
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    const len = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < len; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }
    return 0;
  }
}

export const mdmService = new MDMService();
export default mdmService;
