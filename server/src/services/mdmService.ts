import prisma from '../config/database';
import logger from '../config/logger';
import { AuditLogger } from '../utils/auditLogger';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface ManagedDevice {
  id: string;
  organizationId: string;
  deviceName: string;
  deviceType: string;           // Laptop, Desktop, Mobile, Tablet, Server
  platform: string;             // Windows, macOS, iOS, Android, Linux
  osVersion: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  enrollmentDate: string;
  lastCheckIn: string;
  status: string;               // Enrolled, Active, NonCompliant, Lost, Retired, Wiped
  complianceStatus: string;     // Compliant, NonCompliant, Unknown, Pending
  encryptionEnabled: boolean;
  firewallEnabled: boolean;
  antivirusEnabled: boolean;
  autoUpdateEnabled: boolean;
  screenLockEnabled: boolean;
  jailbroken: boolean;
  storageEncrypted: boolean;
  passcodeCompliant: boolean;
  ipAddress: string | null;
  macAddress: string | null;
  location: { latitude: number; longitude: number } | null;
  installedApps: string[];
  appliedPolicies: string[];
  riskScore: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface MDMPolicy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  policyType: string;           // Security, Configuration, Restriction, Compliance
  platform: string;             // All, Windows, macOS, iOS, Android, Linux
  priority: number;
  enabled: boolean;
  rules: MDMPolicyRule[];
  assignedGroups: string[];
  deviceCount: number;
  complianceRate: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface MDMPolicyRule {
  id: string;
  ruleType: string;             // RequireEncryption, RequirePasscode, BlockApp, RequireUpdate, etc.
  parameter: string;
  value: string;
  severity: string;             // Critical, High, Medium, Low
  enforcementAction: string;    // Warn, Block, Wipe, Notify
}

interface DeviceAction {
  id: string;
  organizationId: string;
  deviceId: string;
  deviceName: string;
  actionType: string;           // Lock, Wipe, Locate, Restart, UpdateOS, InstallApp, RemoveApp
  status: string;               // Pending, InProgress, Completed, Failed, Cancelled
  initiatedBy: string;
  initiatedAt: string;
  completedAt: string | null;
  result: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// MDM Service
// ---------------------------------------------------------------------------

export class MDMService {

  // =========================================================================
  // ManagedDevice CRUD
  // =========================================================================

  async enrollDevice(data: {
    organizationId: string;
    deviceName: string;
    deviceType: string;
    platform: string;
    osVersion: string;
    serialNumber: string;
    model: string;
    manufacturer: string;
    assignedUserId?: string;
    assignedUserName?: string;
    macAddress?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<ManagedDevice> {
    const now = new Date().toISOString();
    const id = this.generateId('dev');

    const device: ManagedDevice = {
      id,
      organizationId: data.organizationId,
      deviceName: data.deviceName,
      deviceType: data.deviceType,
      platform: data.platform,
      osVersion: data.osVersion,
      serialNumber: data.serialNumber,
      model: data.model,
      manufacturer: data.manufacturer,
      assignedUserId: data.assignedUserId || null,
      assignedUserName: data.assignedUserName || null,
      enrollmentDate: now,
      lastCheckIn: now,
      status: 'Enrolled',
      complianceStatus: 'Pending',
      encryptionEnabled: false,
      firewallEnabled: false,
      antivirusEnabled: false,
      autoUpdateEnabled: false,
      screenLockEnabled: false,
      jailbroken: false,
      storageEncrypted: false,
      passcodeCompliant: false,
      ipAddress: null,
      macAddress: data.macAddress || null,
      location: null,
      installedApps: [],
      appliedPolicies: [],
      riskScore: 50,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'ManagedDevice',
        name: data.deviceName,
        status: 'Enrolled',
        data: device as unknown as Record<string, unknown>,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'mdm_device.enrolled',
      resourceType: 'ManagedDevice',
      resourceId: id,
      metadata: {
        deviceName: data.deviceName,
        platform: data.platform,
        serialNumber: data.serialNumber,
      },
    });

    logger.info(`[MDM] Device enrolled: ${data.deviceName} (${data.serialNumber})`);
    return device;
  }

  async getDevices(
    organizationId: string,
    filters?: {
      status?: string;
      complianceStatus?: string;
      platform?: string;
      deviceType?: string;
      assignedUserId?: string;
    }
  ): Promise<ManagedDevice[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'ManagedDevice',
        status: filters?.status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    let devices = objects.map((o) => o.data as unknown as ManagedDevice);

    if (filters?.complianceStatus) {
      devices = devices.filter((d) => d.complianceStatus === filters.complianceStatus);
    }
    if (filters?.platform) {
      devices = devices.filter((d) => d.platform === filters.platform);
    }
    if (filters?.deviceType) {
      devices = devices.filter((d) => d.deviceType === filters.deviceType);
    }
    if (filters?.assignedUserId) {
      devices = devices.filter((d) => d.assignedUserId === filters.assignedUserId);
    }

    return devices;
  }

  async getDeviceById(id: string, organizationId: string): Promise<ManagedDevice | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'ManagedDevice' },
    });
    return obj ? (obj.data as unknown as ManagedDevice) : null;
  }

  async updateDevice(
    id: string,
    data: Partial<Omit<ManagedDevice, 'id' | 'organizationId' | 'createdAt'>>,
    userId: string,
    organizationId: string
  ): Promise<ManagedDevice | null> {
    const existing = await this.getDeviceById(id, organizationId);
    if (!existing) return null;

    const updated: ManagedDevice = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id },
      data: {
        name: updated.deviceName,
        status: updated.status,
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
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

    return updated;
  }

  async unenrollDevice(
    id: string,
    userId: string,
    organizationId: string
  ): Promise<ManagedDevice | null> {
    const existing = await this.getDeviceById(id, organizationId);
    if (!existing) return null;

    const updated: ManagedDevice = {
      ...existing,
      status: 'Retired',
      complianceStatus: 'Unknown',
      updatedAt: new Date().toISOString(),
    };

    await prisma.gRCObject.update({
      where: { id },
      data: {
        status: 'Retired',
        data: updated as unknown as Record<string, unknown>,
        updatedAt: new Date(),
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
    return updated;
  }

  async deleteDevice(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getDeviceById(id, organizationId);
    if (!existing) return false;

    await prisma.gRCObject.delete({ where: { id } });

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

  async createPolicy(data: {
    organizationId: string;
    name: string;
    description: string;
    policyType: string;
    platform: string;
    priority?: number;
    rules: MDMPolicyRule[];
    assignedGroups?: string[];
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<MDMPolicy> {
    const now = new Date().toISOString();
    const id = this.generateId('pol');

    const policy: MDMPolicy = {
      id,
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      policyType: data.policyType,
      platform: data.platform,
      priority: data.priority || 100,
      enabled: true,
      rules: data.rules.map((r, i) => ({ ...r, id: `rule_${i}_${Date.now()}` })),
      assignedGroups: data.assignedGroups || [],
      deviceCount: 0,
      complianceRate: 0,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'MDMPolicy',
        name: data.name,
        status: 'Active',
        data: policy as unknown as Record<string, unknown>,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'mdm_policy.created',
      resourceType: 'MDMPolicy',
      resourceId: id,
      metadata: { policyType: data.policyType, platform: data.platform, rulesCount: data.rules.length },
    });

    logger.info(`[MDM] Policy created: ${data.name}`);
    return policy;
  }

  async getPolicies(
    organizationId: string,
    filters?: { policyType?: string; platform?: string; enabled?: boolean }
  ): Promise<MDMPolicy[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'MDMPolicy',
      },
      orderBy: { createdAt: 'desc' },
    });

    let policies = objects.map((o) => o.data as unknown as MDMPolicy);

    if (filters?.policyType) {
      policies = policies.filter((p) => p.policyType === filters.policyType);
    }
    if (filters?.platform) {
      policies = policies.filter((p) => p.platform === filters.platform || p.platform === 'All');
    }
    if (filters?.enabled !== undefined) {
      policies = policies.filter((p) => p.enabled === filters.enabled);
    }

    return policies.sort((a, b) => a.priority - b.priority);
  }

  async getPolicyById(id: string, organizationId: string): Promise<MDMPolicy | null> {
    const obj = await prisma.gRCObject.findFirst({
      where: { id, organizationId, objectType: 'MDMPolicy' },
    });
    return obj ? (obj.data as unknown as MDMPolicy) : null;
  }

  async updatePolicy(
    id: string,
    data: Partial<Omit<MDMPolicy, 'id' | 'organizationId' | 'createdAt'>>,
    userId: string,
    organizationId: string
  ): Promise<MDMPolicy | null> {
    const existing = await this.getPolicyById(id, organizationId);
    if (!existing) return null;

    const updated: MDMPolicy = {
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
      action: 'mdm_policy.updated',
      resourceType: 'MDMPolicy',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  }

  async deletePolicy(id: string, userId: string, organizationId: string): Promise<boolean> {
    const existing = await this.getPolicyById(id, organizationId);
    if (!existing) return false;

    await prisma.gRCObject.delete({ where: { id } });

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

  async createDeviceAction(data: {
    organizationId: string;
    deviceId: string;
    actionType: string;
    metadata?: Record<string, unknown>;
    userId: string;
  }): Promise<DeviceAction> {
    const device = await this.getDeviceById(data.deviceId, data.organizationId);
    if (!device) {
      throw new Error(`Device not found: ${data.deviceId}`);
    }

    const now = new Date().toISOString();
    const id = this.generateId('act');

    const action: DeviceAction = {
      id,
      organizationId: data.organizationId,
      deviceId: data.deviceId,
      deviceName: device.deviceName,
      actionType: data.actionType,
      status: 'Pending',
      initiatedBy: data.userId,
      initiatedAt: now,
      completedAt: null,
      result: null,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await prisma.gRCObject.create({
      data: {
        id,
        organizationId: data.organizationId,
        objectType: 'DeviceAction',
        name: `${data.actionType} - ${device.deviceName}`,
        status: 'Pending',
        data: action as unknown as Record<string, unknown>,
      },
    });

    // Simulate action execution
    await this.executeDeviceAction(action, device, data.organizationId, data.userId);

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'mdm_device_action.created',
      resourceType: 'DeviceAction',
      resourceId: id,
      metadata: { actionType: data.actionType, deviceName: device.deviceName },
    });

    logger.info(`[MDM] Device action initiated: ${data.actionType} on ${device.deviceName}`);
    return action;
  }

  async getDeviceActions(
    organizationId: string,
    filters?: { deviceId?: string; actionType?: string; status?: string }
  ): Promise<DeviceAction[]> {
    const objects = await prisma.gRCObject.findMany({
      where: {
        organizationId,
        objectType: 'DeviceAction',
        status: filters?.status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    let actions = objects.map((o) => o.data as unknown as DeviceAction);

    if (filters?.deviceId) {
      actions = actions.filter((a) => a.deviceId === filters.deviceId);
    }
    if (filters?.actionType) {
      actions = actions.filter((a) => a.actionType === filters.actionType);
    }

    return actions;
  }

  // =========================================================================
  // Device Compliance Check
  // =========================================================================

  async checkDeviceCompliance(
    deviceId: string,
    organizationId: string,
    userId: string
  ) {
    const device = await this.getDeviceById(deviceId, organizationId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const policies = await this.getPolicies(organizationId, {
      enabled: true,
      platform: device.platform,
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
      for (const rule of policy.rules) {
        const result = this.evaluateRule(device, rule);
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

    // Update device compliance status
    const complianceStatus = isCompliant ? 'Compliant' : 'NonCompliant';
    await this.updateDevice(
      deviceId,
      {
        complianceStatus,
        lastCheckIn: new Date().toISOString(),
        riskScore: this.getDeviceRiskScore(device, complianceResults),
      },
      userId,
      organizationId
    );

    const checkResult = {
      deviceId,
      deviceName: device.deviceName,
      complianceStatus,
      compliancePercentage,
      totalRules,
      compliantRules,
      nonCompliantRules: totalRules - compliantRules,
      criticalViolations: complianceResults.filter((r) => !r.compliant && r.severity === 'Critical').length,
      highViolations: complianceResults.filter((r) => !r.compliant && r.severity === 'High').length,
      results: complianceResults,
      riskScore: this.getDeviceRiskScore(device, complianceResults),
      checkedAt: new Date().toISOString(),
    };

    logger.info(
      `[MDM] Compliance check for ${device.deviceName}: ${complianceStatus} (${compliancePercentage}%)`
    );

    return checkResult;
  }

  // =========================================================================
  // Bulk Device Action
  // =========================================================================

  async bulkDeviceAction(data: {
    organizationId: string;
    deviceIds: string[];
    actionType: string;
    userId: string;
  }) {
    const results: Array<{
      deviceId: string;
      deviceName: string;
      success: boolean;
      actionId: string | null;
      error: string | null;
    }> = [];

    for (const deviceId of data.deviceIds) {
      try {
        const action = await this.createDeviceAction({
          organizationId: data.organizationId,
          deviceId,
          actionType: data.actionType,
          userId: data.userId,
        });
        results.push({
          deviceId,
          deviceName: action.deviceName,
          success: true,
          actionId: action.id,
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
      actionType: data.actionType,
      results,
    };

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'mdm_device_action.bulk_executed',
      resourceType: 'DeviceAction',
      resourceId: `bulk_${Date.now()}`,
      metadata: {
        actionType: data.actionType,
        totalDevices: data.deviceIds.length,
        successful: summary.successful,
        failed: summary.failed,
      },
    });

    logger.info(
      `[MDM] Bulk action ${data.actionType}: ${summary.successful}/${summary.totalDevices} successful`
    );

    return summary;
  }

  // =========================================================================
  // MDM Dashboard
  // =========================================================================

  async getMDMDashboard(organizationId: string) {
    const [devices, policies, actions] = await Promise.all([
      this.getDevices(organizationId),
      this.getPolicies(organizationId),
      this.getDeviceActions(organizationId),
    ]);

    const activeDevices = devices.filter((d) => d.status !== 'Retired' && d.status !== 'Wiped');

    // Device statistics
    const deviceStats = {
      total: devices.length,
      active: activeDevices.length,
      enrolled: devices.filter((d) => d.status === 'Enrolled').length,
      nonCompliant: devices.filter((d) => d.complianceStatus === 'NonCompliant').length,
      lost: devices.filter((d) => d.status === 'Lost').length,
      retired: devices.filter((d) => d.status === 'Retired').length,
      wiped: devices.filter((d) => d.status === 'Wiped').length,
    };

    // Compliance overview
    const compliantDevices = activeDevices.filter((d) => d.complianceStatus === 'Compliant').length;
    const complianceOverview = {
      compliant: compliantDevices,
      nonCompliant: activeDevices.filter((d) => d.complianceStatus === 'NonCompliant').length,
      pending: activeDevices.filter((d) => d.complianceStatus === 'Pending').length,
      unknown: activeDevices.filter((d) => d.complianceStatus === 'Unknown').length,
      complianceRate: activeDevices.length > 0
        ? Math.round((compliantDevices / activeDevices.length) * 100)
        : 0,
    };

    // Platform distribution
    const platformDistribution: Record<string, number> = {};
    activeDevices.forEach((d) => {
      platformDistribution[d.platform] = (platformDistribution[d.platform] || 0) + 1;
    });

    // Device type distribution
    const deviceTypeDistribution: Record<string, number> = {};
    activeDevices.forEach((d) => {
      deviceTypeDistribution[d.deviceType] = (deviceTypeDistribution[d.deviceType] || 0) + 1;
    });

    // Security posture
    const securityPosture = {
      encryptionEnabled: activeDevices.filter((d) => d.encryptionEnabled).length,
      firewallEnabled: activeDevices.filter((d) => d.firewallEnabled).length,
      antivirusEnabled: activeDevices.filter((d) => d.antivirusEnabled).length,
      autoUpdateEnabled: activeDevices.filter((d) => d.autoUpdateEnabled).length,
      screenLockEnabled: activeDevices.filter((d) => d.screenLockEnabled).length,
      jailbrokenDevices: activeDevices.filter((d) => d.jailbroken).length,
    };

    // Policy stats
    const policyStats = {
      totalPolicies: policies.length,
      enabledPolicies: policies.filter((p) => p.enabled).length,
      byType: this.groupBy(policies, 'policyType'),
    };

    // Recent actions
    const recentActions = actions.slice(0, 10).map((a) => ({
      id: a.id,
      deviceName: a.deviceName,
      actionType: a.actionType,
      status: a.status,
      initiatedAt: a.initiatedAt,
    }));

    // Average risk score
    const avgRiskScore = activeDevices.length > 0
      ? Math.round(activeDevices.reduce((sum, d) => sum + d.riskScore, 0) / activeDevices.length)
      : 0;

    // High risk devices
    const highRiskDevices = activeDevices
      .filter((d) => d.riskScore >= 70)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
      .map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        platform: d.platform,
        riskScore: d.riskScore,
        complianceStatus: d.complianceStatus,
        assignedUserName: d.assignedUserName,
      }));

    return {
      deviceStats,
      complianceOverview,
      platformDistribution,
      deviceTypeDistribution,
      securityPosture,
      policyStats,
      recentActions,
      averageRiskScore: avgRiskScore,
      highRiskDevices,
    };
  }

  // =========================================================================
  // Get Device Risk Score
  // =========================================================================

  getDeviceRiskScore(
    device: ManagedDevice,
    complianceResults?: Array<{ compliant: boolean; severity: string }>
  ): number {
    let score = 0;

    // Base risk from device state
    if (!device.encryptionEnabled) score += 15;
    if (!device.firewallEnabled) score += 10;
    if (!device.antivirusEnabled) score += 12;
    if (!device.autoUpdateEnabled) score += 8;
    if (!device.screenLockEnabled) score += 10;
    if (device.jailbroken) score += 25;
    if (!device.storageEncrypted) score += 12;
    if (!device.passcodeCompliant) score += 8;

    // Risk from compliance check results
    if (complianceResults) {
      const violations = complianceResults.filter((r) => !r.compliant);
      violations.forEach((v) => {
        switch (v.severity) {
          case 'Critical': score += 15; break;
          case 'High': score += 10; break;
          case 'Medium': score += 5; break;
          case 'Low': score += 2; break;
        }
      });
    }

    // Check-in freshness
    if (device.lastCheckIn) {
      const hoursSinceCheckIn =
        (Date.now() - new Date(device.lastCheckIn).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCheckIn > 168) score += 15;       // More than 7 days
      else if (hoursSinceCheckIn > 72) score += 8;    // More than 3 days
      else if (hoursSinceCheckIn > 24) score += 3;    // More than 1 day
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private generateId(prefix: string): string {
    return `mdm_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async executeDeviceAction(
    action: DeviceAction,
    device: ManagedDevice,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Simulate action execution and update status
    const now = new Date().toISOString();
    let deviceUpdate: Partial<ManagedDevice> = {};

    switch (action.actionType) {
      case 'Lock':
        deviceUpdate = { screenLockEnabled: true };
        action.result = 'Device locked successfully';
        break;
      case 'Wipe':
        deviceUpdate = { status: 'Wiped', complianceStatus: 'Unknown' };
        action.result = 'Device wipe initiated';
        break;
      case 'Locate':
        action.result = JSON.stringify({
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
          accuracy: '50m',
          timestamp: now,
        });
        break;
      case 'Restart':
        action.result = 'Restart command sent to device';
        break;
      case 'UpdateOS':
        deviceUpdate = { autoUpdateEnabled: true };
        action.result = 'OS update initiated';
        break;
      default:
        action.result = `Action ${action.actionType} queued for execution`;
    }

    action.status = 'Completed';
    action.completedAt = now;
    action.updatedAt = now;

    await prisma.gRCObject.update({
      where: { id: action.id },
      data: {
        status: 'Completed',
        data: action as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    if (Object.keys(deviceUpdate).length > 0) {
      await this.updateDevice(device.id, deviceUpdate, userId, organizationId);
    }
  }

  private evaluateRule(
    device: ManagedDevice,
    rule: MDMPolicyRule
  ): { compliant: boolean; details: string } {
    switch (rule.ruleType) {
      case 'RequireEncryption':
        return {
          compliant: device.encryptionEnabled && device.storageEncrypted,
          details: device.encryptionEnabled
            ? 'Encryption is enabled'
            : 'Encryption is not enabled on this device',
        };
      case 'RequirePasscode':
        return {
          compliant: device.passcodeCompliant && device.screenLockEnabled,
          details: device.passcodeCompliant
            ? 'Passcode requirements met'
            : 'Device does not meet passcode requirements',
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
          compliant: device.antivirusEnabled,
          details: device.antivirusEnabled
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
      case 'RequireScreenLock':
        return {
          compliant: device.screenLockEnabled,
          details: device.screenLockEnabled
            ? 'Screen lock is enabled'
            : 'Screen lock is not configured',
        };
      case 'BlockApp':
        const blocked = device.installedApps.includes(rule.value);
        return {
          compliant: !blocked,
          details: blocked
            ? `Blocked app "${rule.value}" is installed`
            : `Blocked app "${rule.value}" is not present`,
        };
      case 'RequireOSVersion': {
        const meetsVersion = this.compareVersions(device.osVersion, rule.value) >= 0;
        return {
          compliant: meetsVersion,
          details: meetsVersion
            ? `OS version ${device.osVersion} meets minimum ${rule.value}`
            : `OS version ${device.osVersion} is below minimum ${rule.value}`,
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

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    const result: Record<string, number> = {};
    items.forEach((item) => {
      const value = String(item[key] || 'Unknown');
      result[value] = (result[value] || 0) + 1;
    });
    return result;
  }
}

export default new MDMService();
