/**
 * Physical AI Service - IoT/Edge Compliance Integration
 *
 * Features:
 * - IoT device compliance monitoring
 * - Edge AI validation
 * - MQTT protocol support
 * - Physical sensor data attestation
 * - Real-time device health monitoring
 * - Compliance policy enforcement
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import crypto from 'crypto';
import mqttService from './mqttService';

export interface IoTDevice {
  id: string;
  deviceId: string;
  deviceType: string;
  location: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'unknown' | 'pending_review';
  lastSeen: Date;
  sensorData?: any;
  firmware?: string;
  certificates?: DeviceCertificate[];
  complianceScore?: number;
}

export interface DeviceCertificate {
  id: string;
  type: string;
  issuer: string;
  validFrom: Date;
  validUntil: Date;
  fingerprint: string;
}

export interface EdgeComplianceCheck {
  id: string;
  deviceId: string;
  checkType: ComplianceCheckType;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  evidence?: any;
  remediation?: string;
  timestamp: Date;
}

export type ComplianceCheckType =
  | 'encryption'
  | 'access_control'
  | 'data_retention'
  | 'audit_logging'
  | 'firmware_integrity'
  | 'certificate_validity'
  | 'network_segmentation'
  | 'authentication'
  | 'data_at_rest'
  | 'data_in_transit'
  | 'physical_security'
  | 'tamper_detection';

export interface DeviceCompliancePolicy {
  id: string;
  name: string;
  deviceTypes: string[];
  checks: PolicyCheck[];
  enforcement: 'strict' | 'moderate' | 'lenient';
}

export interface PolicyCheck {
  checkType: ComplianceCheckType;
  required: boolean;
  threshold?: number;
  configuration?: any;
}

export interface SensorAttestation {
  deviceId: string;
  sensorType: string;
  dataHash: string;
  timestamp: Date;
  signature: string;
  chainOfCustody: AttestationEntry[];
}

export interface AttestationEntry {
  timestamp: Date;
  action: string;
  actor: string;
  hash: string;
}

class PhysicalAIService {
  private devicePolicies: Map<string, DeviceCompliancePolicy> = new Map();
  private deviceHealth: Map<string, DeviceHealthStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default compliance policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicy: DeviceCompliancePolicy = {
      id: 'default_iot_policy',
      name: 'Default IoT Compliance Policy',
      deviceTypes: ['*'],
      checks: [
        { checkType: 'encryption', required: true },
        { checkType: 'access_control', required: true },
        { checkType: 'audit_logging', required: true },
        { checkType: 'firmware_integrity', required: true },
        { checkType: 'certificate_validity', required: true },
        { checkType: 'data_in_transit', required: true },
        { checkType: 'authentication', required: true },
        { checkType: 'tamper_detection', required: false },
      ],
      enforcement: 'moderate',
    };

    this.devicePolicies.set(defaultPolicy.id, defaultPolicy);
  }

  /**
   * Start device health monitoring
   */
  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkAllDevicesHealth();
    }, intervalMs);

    logger.info('[Physical AI] Health monitoring started');
  }

  /**
   * Register IoT device (enhanced with all features)
   */
  async registerDevice(
    organizationId: string,
    device: {
      deviceId: string;
      deviceType: string;
      location: string;
      mqttTopic?: string;
      firmware?: string;
      capabilities?: string[];
      authentication?: {
        type: 'certificate' | 'api_key' | 'oauth';
        credentials?: any;
      };
      certificates?: Array<{
        type: string;
        issuer: string;
        validFrom: Date;
        validUntil: Date;
        fingerprint: string;
      }>;
      metadata?: Record<string, any>;
    },
    userId: string
  ): Promise<IoTDevice> {
    try {
      // Check if device already exists (duplicate rejection)
      const existingDevice = await prisma.ioTDevice.findFirst({
        where: {
          deviceId: device.deviceId,
          organizationId,
        },
      });

      if (existingDevice) {
        throw new Error(`Device ${device.deviceId} already registered`);
      }

      // Validate device certificate if provided
      if (device.certificates && device.certificates.length > 0) {
        const certValidation = await this.validateDeviceCertificates(device.certificates);
        if (!certValidation.valid) {
          throw new Error(`Certificate validation failed: ${certValidation.error}`);
        }
      }

      // Generate UUID for the device
      const deviceUuid = crypto.randomUUID();

      // Prepare sensor data with authentication and metadata
      const sensorData: any = {
        firmware: device.firmware,
        capabilities: device.capabilities || [],
        registeredBy: userId,
        registeredAt: new Date(),
        authentication: device.authentication,
        certificates: device.certificates,
        metadata: device.metadata || {},
      };

      // Store device in database
      const dbDevice = await prisma.ioTDevice.create({
        data: {
          id: deviceUuid,
          organizationId,
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          location: device.location,
          mqttTopic: device.mqttTopic || `devices/${device.deviceId}/data`,
          complianceStatus: 'unknown',
          sensorData,
        },
      });

      // Subscribe to device MQTT topics if MQTT is connected
      try {
        if (mqttService.getConnectionStatus() && device.mqttTopic) {
          mqttService.subscribe(device.mqttTopic, (message: any) => {
            this.handleDeviceMessage(message, organizationId);
          });
        }
      } catch (mqttError) {
        logger.warn('[Physical AI] MQTT subscription failed, device registered without real-time monitoring');
      }

      // Perform initial compliance check
      const complianceResult = await this.performEdgeComplianceCheck(device.deviceId, organizationId);
      const overallStatus = this.calculateOverallComplianceStatus(complianceResult.checks);

      // Update device with compliance status
      await prisma.ioTDevice.update({
        where: { id: dbDevice.id },
        data: { complianceStatus: overallStatus },
      });

      // Log registration
      await prisma.auditLog.create({
        data: {
          action: 'physical_ai.device_registered',
          details: JSON.stringify({
            deviceId: device.deviceId,
            deviceType: device.deviceType,
            location: device.location,
            initialComplianceStatus: overallStatus,
          }),
          userId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Physical AI] Device registered: ${device.deviceId}`);

      return {
        id: dbDevice.id,
        deviceId: dbDevice.deviceId,
        deviceType: dbDevice.deviceType,
        location: dbDevice.location,
        complianceStatus: overallStatus as any,
        lastSeen: dbDevice.lastSeen,
        sensorData: dbDevice.sensorData as any,
        complianceScore: complianceResult.overallScore,
        certificates: device.certificates?.map((cert: any) => ({ ...cert, id: cert.id || crypto.randomUUID() })),
      };
    } catch (error: any) {
      logger.error('[Physical AI] Error registering device', error);
      if (error.message?.includes('already registered')) {
        throw error; // Re-throw duplicate error
      }
      throw error;
    }
  }

  /**
   * Validate device certificates
   */
  private async validateDeviceCertificates(
    certificates: Array<{
      type: string;
      issuer: string;
      validFrom: Date;
      validUntil: Date;
      fingerprint: string;
    }>
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const now = new Date();

      for (const cert of certificates) {
        const validFrom = new Date(cert.validFrom);
        const validUntil = new Date(cert.validUntil);

        if (validFrom > now) {
          return { valid: false, error: `Certificate not yet valid: ${cert.type}` };
        }

        if (validUntil < now) {
          return { valid: false, error: `Certificate expired: ${cert.type}` };
        }

        // Check fingerprint format (should be hex string)
        if (!/^[0-9a-f]{40,64}$/i.test(cert.fingerprint)) {
          return { valid: false, error: `Invalid certificate fingerprint format: ${cert.type}` };
        }
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message || 'Certificate validation error' };
    }
  }

  /**
   * Bulk register devices
   */
  async bulkRegisterDevices(
    organizationId: string,
    devices: Array<{
      deviceId: string;
      deviceType: string;
      location: string;
      mqttTopic?: string;
      firmware?: string;
      capabilities?: string[];
      authentication?: any;
      certificates?: any[];
      metadata?: Record<string, any>;
    }>,
    userId: string
  ): Promise<{
    successful: IoTDevice[];
    failed: Array<{ deviceId: string; error: string }>;
  }> {
    try {
      const successful: IoTDevice[] = [];
      const failed: Array<{ deviceId: string; error: string }> = [];

      for (const device of devices) {
        try {
          const registered = await this.registerDevice(organizationId, device, userId);
          successful.push(registered);
        } catch (error: any) {
          failed.push({
            deviceId: device.deviceId,
            error: error.message || 'Unknown error',
          });
        }
      }

      logger.info(`[Physical AI] Bulk registration: ${successful.length} successful, ${failed.length} failed`);

      return { successful, failed };
    } catch (error) {
      logger.error('[Physical AI] Error in bulk device registration', error);
      throw error;
    }
  }

  /**
   * Deregister device
   */
  async deregisterDevice(
    deviceId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Unsubscribe from MQTT if subscribed
      if (device.mqttTopic && mqttService.getConnectionStatus()) {
        try {
          mqttService.unsubscribe(device.mqttTopic);
        } catch (mqttError) {
          logger.warn('[Physical AI] Error unsubscribing from MQTT', mqttError);
        }
      }

      // Delete device
      await prisma.ioTDevice.delete({
        where: { id: device.id },
      });

      // Log deregistration
      await prisma.auditLog.create({
        data: {
          action: 'physical_ai.device_deregistered',
          details: JSON.stringify({
            deviceId,
            deviceType: device.deviceType,
            location: device.location,
          }),
          userId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Physical AI] Device deregistered: ${deviceId}`);
    } catch (error) {
      logger.error('[Physical AI] Error deregistering device', error);
      throw error;
    }
  }

  /**
   * Handle device MQTT message
   */
  private async handleDeviceMessage(
    message: any,
    organizationId: string
  ): Promise<void> {
    try {
      const { deviceId, payload, topic } = message;

      // Update device sensor data and last seen
      await prisma.ioTDevice.updateMany({
        where: {
          deviceId,
          organizationId,
        },
        data: {
          sensorData: payload,
          lastSeen: new Date(),
        },
      });

      // Check for anomalies in sensor data
      await this.detectAnomalies(deviceId, payload, organizationId);

      // Update device health status
      this.updateDeviceHealth(deviceId, 'online');

      logger.debug(`[Physical AI] Updated device ${deviceId} from MQTT`);
    } catch (error) {
      logger.error('[Physical AI] Error handling device message', error);
    }
  }

  /**
   * Perform comprehensive edge compliance check (enhanced with overall score and recommendations)
   */
  async performEdgeComplianceCheck(
    deviceId: string,
    organizationId: string
  ): Promise<{
    checks: EdgeComplianceCheck[];
    overallScore: number; // 0-100
    recommendations: string[];
  }> {
    try {
      // Get device from database
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const checks: EdgeComplianceCheck[] = [];
      const sensorData = device.sensorData as any || {};

      // 1. Encryption Check
      checks.push(await this.checkEncryption(deviceId, sensorData));

      // 2. Access Control Check
      checks.push(await this.checkAccessControl(deviceId, sensorData));

      // 3. Data Retention Check
      checks.push(await this.checkDataRetention(deviceId, sensorData));

      // 4. Audit Logging Check
      checks.push(await this.checkAuditLogging(deviceId, sensorData));

      // 5. Firmware Integrity Check
      checks.push(await this.checkFirmwareIntegrity(deviceId, sensorData));

      // 6. Certificate Validity Check
      checks.push(await this.checkCertificateValidity(deviceId, sensorData));

      // 7. Network Segmentation Check
      checks.push(await this.checkNetworkSegmentation(deviceId, sensorData));

      // 8. Authentication Check
      checks.push(await this.checkAuthentication(deviceId, sensorData));

      // 9. Data at Rest Check
      checks.push(await this.checkDataAtRest(deviceId, sensorData));

      // 10. Data in Transit Check
      checks.push(await this.checkDataInTransit(deviceId, sensorData));

      // 11. Physical Security Check
      checks.push(await this.checkPhysicalSecurity(deviceId, sensorData));

      // 12. Tamper Detection Check
      checks.push(await this.checkTamperDetection(deviceId, sensorData));

      // Store compliance checks in database
      for (const check of checks) {
        await prisma.edgeComplianceCheck.create({
          data: {
            deviceId: device.id,
            organizationId,
            checkType: check.checkType,
            status: check.status,
            details: check.details,
            timestamp: check.timestamp,
          },
        });
      }

      // Update device compliance status
      const overallStatus = this.calculateOverallComplianceStatus(checks);
      await prisma.ioTDevice.update({
        where: { id: device.id },
        data: {
          complianceStatus: overallStatus,
          updatedAt: new Date(),
        },
      });

      // Calculate overall compliance score
      const overallScore = this.calculateComplianceScore(checks);

      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(checks);

      logger.info(`[Physical AI] Compliance check completed for ${deviceId}: ${overallStatus}, score: ${overallScore}/100`);

      return {
        checks,
        overallScore,
        recommendations,
      };
    } catch (error) {
      logger.error('[Physical AI] Error performing edge compliance check', error);
      throw error;
    }
  }

  // Individual compliance check methods

  private async checkEncryption(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const encryptionConfig = sensorData.security?.encryption || {};
    const algorithm = encryptionConfig.algorithm || '';
    const keyLength = encryptionConfig.keyLength || 0;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'No encryption configured';
    let severity: EdgeComplianceCheck['severity'] = 'critical';

    if (algorithm.includes('AES') && keyLength >= 256) {
      status = 'pass';
      details = `Device uses ${algorithm}-${keyLength} encryption`;
      severity = 'low';
    } else if (algorithm.includes('AES') && keyLength >= 128) {
      status = 'warning';
      details = `Device uses ${algorithm}-${keyLength}, recommend upgrading to 256-bit`;
      severity = 'medium';
    } else if (algorithm) {
      status = 'warning';
      details = `Device uses ${algorithm}, consider upgrading to AES-256`;
      severity = 'high';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'encryption',
      status,
      severity,
      details,
      evidence: encryptionConfig,
      remediation: status !== 'pass' ? 'Configure AES-256-GCM encryption for all data' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkAccessControl(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const accessConfig = sensorData.security?.accessControl || {};
    const hasRBAC = accessConfig.rbac === true;
    const hasMFA = accessConfig.mfa === true;
    const hasAPIKeys = accessConfig.apiKeys?.length > 0;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'No access control configured';
    let severity: EdgeComplianceCheck['severity'] = 'critical';

    if (hasRBAC && hasMFA) {
      status = 'pass';
      details = 'Role-based access control with MFA enabled';
      severity = 'low';
    } else if (hasRBAC || hasAPIKeys) {
      status = 'warning';
      details = 'Basic access control configured, recommend enabling MFA';
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'access_control',
      status,
      severity,
      details,
      evidence: accessConfig,
      remediation: status !== 'pass' ? 'Enable RBAC and multi-factor authentication' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkDataRetention(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const retentionConfig = sensorData.dataManagement?.retention || {};
    const retentionDays = retentionConfig.days || 0;
    const hasPolicy = retentionConfig.policy === true;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'No data retention policy configured';
    let severity: EdgeComplianceCheck['severity'] = 'high';

    if (hasPolicy && retentionDays >= 30 && retentionDays <= 365) {
      status = 'pass';
      details = `Data retention policy configured: ${retentionDays} days`;
      severity = 'low';
    } else if (retentionDays > 0) {
      status = 'warning';
      details = `Data retention of ${retentionDays} days may not meet compliance requirements`;
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'data_retention',
      status,
      severity,
      details,
      evidence: retentionConfig,
      remediation: status !== 'pass' ? 'Configure data retention policy between 30-365 days' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkAuditLogging(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const loggingConfig = sensorData.logging || {};
    const enabled = loggingConfig.enabled === true;
    const tamperProof = loggingConfig.tamperProof === true;
    const remoteSync = loggingConfig.remoteSync === true;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'Audit logging not enabled';
    let severity: EdgeComplianceCheck['severity'] = 'high';

    if (enabled && tamperProof && remoteSync) {
      status = 'pass';
      details = 'Tamper-proof audit logging with remote synchronization enabled';
      severity = 'low';
    } else if (enabled && remoteSync) {
      status = 'warning';
      details = 'Audit logging enabled, recommend adding tamper protection';
      severity = 'medium';
    } else if (enabled) {
      status = 'warning';
      details = 'Local audit logging only, recommend enabling remote sync';
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'audit_logging',
      status,
      severity,
      details,
      evidence: loggingConfig,
      remediation: status !== 'pass' ? 'Enable tamper-proof audit logging with remote synchronization' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkFirmwareIntegrity(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const firmwareConfig = sensorData.firmware || {};
    const version = firmwareConfig.version || 'unknown';
    const signed = firmwareConfig.signed === true;
    const verified = firmwareConfig.verified === true;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'Firmware integrity cannot be verified';
    let severity: EdgeComplianceCheck['severity'] = 'critical';

    if (signed && verified) {
      status = 'pass';
      details = `Firmware ${version} is signed and verified`;
      severity = 'low';
    } else if (signed) {
      status = 'warning';
      details = `Firmware ${version} is signed but not recently verified`;
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'firmware_integrity',
      status,
      severity,
      details,
      evidence: firmwareConfig,
      remediation: status !== 'pass' ? 'Enable firmware signing and verification' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkCertificateValidity(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const certConfig = sensorData.certificates || {};
    const certificates = certConfig.list || [];

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'No certificates configured';
    let severity: EdgeComplianceCheck['severity'] = 'high';

    if (certificates.length > 0) {
      const now = new Date();
      const validCerts = certificates.filter((cert: any) => {
        const validUntil = new Date(cert.validUntil);
        return validUntil > now;
      });

      const expiringSoon = certificates.filter((cert: any) => {
        const validUntil = new Date(cert.validUntil);
        const daysUntilExpiry = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });

      if (validCerts.length === certificates.length && expiringSoon.length === 0) {
        status = 'pass';
        details = `All ${certificates.length} certificates are valid`;
        severity = 'low';
      } else if (expiringSoon.length > 0) {
        status = 'warning';
        details = `${expiringSoon.length} certificate(s) expiring within 30 days`;
        severity = 'medium';
      } else {
        status = 'fail';
        details = `${certificates.length - validCerts.length} certificate(s) have expired`;
        severity = 'critical';
      }
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'certificate_validity',
      status,
      severity,
      details,
      evidence: certConfig,
      remediation: status !== 'pass' ? 'Renew or replace expired/expiring certificates' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkNetworkSegmentation(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const networkConfig = sensorData.network || {};
    const vlan = networkConfig.vlan;
    const isolated = networkConfig.isolated === true;
    const firewalled = networkConfig.firewalled === true;

    let status: EdgeComplianceCheck['status'] = 'warning';
    let details = 'Network segmentation not configured';
    let severity: EdgeComplianceCheck['severity'] = 'medium';

    if (isolated && firewalled && vlan) {
      status = 'pass';
      details = `Device on isolated VLAN ${vlan} with firewall protection`;
      severity = 'low';
    } else if (vlan || isolated) {
      status = 'warning';
      details = 'Partial network segmentation, recommend full isolation';
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'network_segmentation',
      status,
      severity,
      details,
      evidence: networkConfig,
      remediation: status !== 'pass' ? 'Configure VLAN isolation and firewall rules' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkAuthentication(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const authConfig = sensorData.security?.authentication || {};
    const method = authConfig.method || 'none';
    const certBased = authConfig.certificateBased === true;
    const tokenBased = authConfig.tokenBased === true;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'No authentication configured';
    let severity: EdgeComplianceCheck['severity'] = 'critical';

    if (certBased) {
      status = 'pass';
      details = 'Certificate-based authentication enabled';
      severity = 'low';
    } else if (tokenBased && authConfig.tokenExpiry) {
      status = 'pass';
      details = 'Token-based authentication with expiry enabled';
      severity = 'low';
    } else if (method !== 'none') {
      status = 'warning';
      details = `${method} authentication configured, recommend certificate-based`;
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'authentication',
      status,
      severity,
      details,
      evidence: authConfig,
      remediation: status !== 'pass' ? 'Configure certificate-based or token-based authentication' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkDataAtRest(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const storageConfig = sensorData.storage || {};
    const encrypted = storageConfig.encrypted === true;
    const algorithm = storageConfig.encryptionAlgorithm || '';

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'Data at rest is not encrypted';
    let severity: EdgeComplianceCheck['severity'] = 'high';

    if (encrypted && algorithm.includes('AES')) {
      status = 'pass';
      details = `Data at rest encrypted with ${algorithm}`;
      severity = 'low';
    } else if (encrypted) {
      status = 'warning';
      details = 'Data at rest encrypted, verify algorithm strength';
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'data_at_rest',
      status,
      severity,
      details,
      evidence: storageConfig,
      remediation: status !== 'pass' ? 'Enable AES-256 encryption for data at rest' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkDataInTransit(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const tlsConfig = sensorData.network?.tls || {};
    const version = tlsConfig.version || '';
    const enabled = tlsConfig.enabled === true;

    let status: EdgeComplianceCheck['status'] = 'fail';
    let details = 'TLS not configured for data in transit';
    let severity: EdgeComplianceCheck['severity'] = 'critical';

    if (enabled && (version === '1.3' || version === '1.2')) {
      status = 'pass';
      details = `TLS ${version} enabled for data in transit`;
      severity = 'low';
    } else if (enabled) {
      status = 'warning';
      details = `TLS ${version || 'version unknown'} enabled, recommend TLS 1.2+`;
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'data_in_transit',
      status,
      severity,
      details,
      evidence: tlsConfig,
      remediation: status !== 'pass' ? 'Enable TLS 1.2 or 1.3 for all communications' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkPhysicalSecurity(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const physicalConfig = sensorData.physical || {};
    const locked = physicalConfig.enclosureLocked === true;
    const monitored = physicalConfig.accessMonitored === true;
    const location = physicalConfig.secureLocation === true;

    let status: EdgeComplianceCheck['status'] = 'warning';
    let details = 'Physical security status unknown';
    let severity: EdgeComplianceCheck['severity'] = 'medium';

    if (locked && monitored && location) {
      status = 'pass';
      details = 'Device in secure location with locked enclosure and access monitoring';
      severity = 'low';
    } else if (locked || location) {
      status = 'warning';
      details = 'Partial physical security measures in place';
      severity = 'medium';
    } else {
      status = 'not_applicable';
      details = 'Physical security information not available';
      severity = 'low';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'physical_security',
      status,
      severity,
      details,
      evidence: physicalConfig,
      remediation: status === 'warning' ? 'Ensure device is in locked enclosure with access monitoring' : undefined,
      timestamp: new Date(),
    };
  }

  private async checkTamperDetection(deviceId: string, sensorData: any): Promise<EdgeComplianceCheck> {
    const tamperConfig = sensorData.security?.tamperDetection || {};
    const enabled = tamperConfig.enabled === true;
    const alerting = tamperConfig.alerting === true;
    const lastCheck = tamperConfig.lastCheck ? new Date(tamperConfig.lastCheck) : null;

    let status: EdgeComplianceCheck['status'] = 'warning';
    let details = 'Tamper detection not configured';
    let severity: EdgeComplianceCheck['severity'] = 'medium';

    if (enabled && alerting) {
      status = 'pass';
      details = 'Tamper detection enabled with alerting';
      severity = 'low';
    } else if (enabled) {
      status = 'warning';
      details = 'Tamper detection enabled, recommend adding alerting';
      severity = 'medium';
    }

    return {
      id: `check_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      deviceId,
      checkType: 'tamper_detection',
      status,
      severity,
      details,
      evidence: tamperConfig,
      remediation: status !== 'pass' ? 'Enable tamper detection with real-time alerting' : undefined,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate overall compliance status from checks
   */
  private calculateOverallComplianceStatus(checks: EdgeComplianceCheck[]): string {
    const criticalFails = checks.filter(c => c.status === 'fail' && c.severity === 'critical').length;
    const highFails = checks.filter(c => c.status === 'fail' && c.severity === 'high').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const passes = checks.filter(c => c.status === 'pass').length;

    if (criticalFails > 0) {
      return 'non_compliant';
    } else if (highFails > 1 || (highFails > 0 && warnings > 2)) {
      return 'non_compliant';
    } else if (warnings > 0 || highFails > 0) {
      return 'pending_review';
    } else if (passes === checks.filter(c => c.status !== 'not_applicable').length) {
      return 'compliant';
    }

    return 'unknown';
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(checks: EdgeComplianceCheck[]): number {
    const applicableChecks = checks.filter(c => c.status !== 'not_applicable');
    if (applicableChecks.length === 0) return 0;

    const weights = { pass: 1.0, warning: 0.6, fail: 0 };
    const severityWeights = { critical: 2.0, high: 1.5, medium: 1.0, low: 0.5 };

    let totalScore = 0;
    let totalWeight = 0;

    for (const check of applicableChecks) {
      const checkWeight = severityWeights[check.severity as keyof typeof severityWeights] || 1.0;
      const statusKey = check.status as 'pass' | 'warning' | 'fail';
      const checkScore = weights[statusKey] || 0;

      totalScore += checkScore * checkWeight;
      totalWeight += checkWeight;
    }

    return Math.round((totalScore / totalWeight) * 100);
  }

  /**
   * Receive sensor data from IoT device
   */
  async receiveSensorData(
    deviceId: string,
    data: any,
    organizationId: string
  ): Promise<{
    received: boolean;
    attestationHash: string;
    attestation: SensorAttestation;
  }> {
    try {
      const dataString = JSON.stringify(data);
      const attestationHash = crypto.createHash('sha256').update(dataString).digest('hex');

      // Create attestation record
      const attestation: SensorAttestation = {
        deviceId,
        sensorType: data.sensorType || 'unknown',
        dataHash: attestationHash,
        timestamp: new Date(),
        signature: crypto.createHmac('sha256', process.env.ATTESTATION_SECRET || 'default_secret')
          .update(attestationHash)
          .digest('hex'),
        chainOfCustody: [
          {
            timestamp: new Date(),
            action: 'data_received',
            actor: 'physical_ai_service',
            hash: attestationHash,
          },
        ],
      };

      // Update device sensor data
      await prisma.ioTDevice.updateMany({
        where: {
          deviceId,
          organizationId,
        },
        data: {
          sensorData: data,
          lastSeen: new Date(),
        },
      });

      // Store attestation in audit log
      await prisma.auditLog.create({
        data: {
          action: 'physical_ai.sensor_attestation',
          details: JSON.stringify(attestation),
          userId: 'system',
          organizationId,
          hash: attestationHash,
        },
      });

      logger.info(`[Physical AI] Sensor data received from ${deviceId} with attestation`);

      return {
        received: true,
        attestationHash,
        attestation,
      };
    } catch (error) {
      logger.error('[Physical AI] Error receiving sensor data', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in sensor data
   */
  private async detectAnomalies(
    deviceId: string,
    payload: any,
    organizationId: string
  ): Promise<void> {
    try {
      // Simple anomaly detection based on thresholds
      const anomalies: string[] = [];

      if (payload.temperature && (payload.temperature < -20 || payload.temperature > 80)) {
        anomalies.push(`Abnormal temperature: ${payload.temperature}C`);
      }

      if (payload.humidity && (payload.humidity < 0 || payload.humidity > 100)) {
        anomalies.push(`Invalid humidity reading: ${payload.humidity}%`);
      }

      if (payload.errorRate && payload.errorRate > 0.1) {
        anomalies.push(`High error rate detected: ${payload.errorRate * 100}%`);
      }

      if (anomalies.length > 0) {
        await prisma.auditLog.create({
          data: {
            action: 'physical_ai.anomaly_detected',
            details: JSON.stringify({
              deviceId,
              anomalies,
              payload,
            }),
            userId: 'system',
            organizationId,
            hash: crypto.randomBytes(16).toString('hex'),
          },
        });

        logger.warn(`[Physical AI] Anomalies detected for ${deviceId}: ${anomalies.join(', ')}`);
      }
    } catch (error) {
      logger.error('[Physical AI] Error detecting anomalies', error);
    }
  }

  /**
   * Update device health status
   */
  private updateDeviceHealth(deviceId: string, status: 'online' | 'offline' | 'degraded'): void {
    this.deviceHealth.set(deviceId, {
      status,
      lastUpdate: new Date(),
      consecutiveFailures: status === 'offline' ?
        (this.deviceHealth.get(deviceId)?.consecutiveFailures || 0) + 1 : 0,
    });
  }

  /**
   * Check health of all devices
   */
  private async checkAllDevicesHealth(): Promise<void> {
    try {
      const devices = await prisma.ioTDevice.findMany({
        select: { deviceId: true, lastSeen: true, organizationId: true },
      });

      const now = new Date();
      const offlineThreshold = 5 * 60 * 1000; // 5 minutes

      for (const device of devices) {
        const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();

        if (timeSinceLastSeen > offlineThreshold) {
          this.updateDeviceHealth(device.deviceId, 'offline');
        }
      }
    } catch (error) {
      logger.error('[Physical AI] Error checking device health', error);
    }
  }

  /**
   * Get all devices for an organization
   */
  async getDevices(organizationId: string): Promise<IoTDevice[]> {
    try {
      const devices = await prisma.ioTDevice.findMany({
        where: { organizationId },
        include: {
          complianceChecks: {
            orderBy: { timestamp: 'desc' },
            take: 12,
          },
        },
      });

      return devices.map((d: any) => ({
        id: d.id,
        deviceId: d.deviceId,
        deviceType: d.deviceType,
        location: d.location,
        complianceStatus: d.complianceStatus as any,
        lastSeen: d.lastSeen,
        sensorData: d.sensorData,
        complianceScore: d.complianceChecks.length > 0 ?
          this.calculateComplianceScore(d.complianceChecks) : undefined,
      }));
    } catch (error) {
      logger.error('[Physical AI] Error getting devices', error);
      return [];
    }
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(checks: EdgeComplianceCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push(`URGENT: Address ${failedChecks.length} failed compliance checks`);
      
      for (const check of failedChecks) {
        if (check.remediation) {
          recommendations.push(`[${check.checkType}] ${check.remediation}`);
        }
      }
    }

    if (warningChecks.length > 0) {
      recommendations.push(`Review ${warningChecks.length} compliance warnings`);
      
      for (const check of warningChecks.slice(0, 5)) { // Limit to top 5
        if (check.remediation) {
          recommendations.push(`[${check.checkType}] ${check.remediation}`);
        }
      }
    }

    if (failedChecks.length === 0 && warningChecks.length === 0) {
      recommendations.push('All compliance checks passed. Maintain current security posture.');
    }

    return recommendations;
  }

  /**
   * Monitor device heartbeat
   */
  async monitorDeviceHeartbeat(
    deviceId: string,
    organizationId: string
  ): Promise<{ online: boolean; lastHeartbeat: Date; latency?: number }> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const now = new Date();
      const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
      const heartbeatThreshold = 5 * 60 * 1000; // 5 minutes

      const online = timeSinceLastSeen < heartbeatThreshold;

      // Update health status
      this.updateDeviceHealth(deviceId, online ? 'online' : 'offline');

      return {
        online,
        lastHeartbeat: device.lastSeen,
        latency: online ? timeSinceLastSeen : undefined,
      };
    } catch (error) {
      logger.error('[Physical AI] Error monitoring device heartbeat', error);
      throw error;
    }
  }

  /**
   * Detect offline devices
   */
  async detectOfflineDevices(organizationId: string): Promise<Array<{
    deviceId: string;
    lastSeen: Date;
    offlineSince: Date;
  }>> {
    try {
      const devices = await prisma.ioTDevice.findMany({
        where: { organizationId },
      });

      const now = new Date();
      const offlineThreshold = 5 * 60 * 1000; // 5 minutes
      const offlineDevices: Array<{
        deviceId: string;
        lastSeen: Date;
        offlineSince: Date;
      }> = [];

      for (const device of devices) {
        const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
        if (timeSinceLastSeen > offlineThreshold) {
          offlineDevices.push({
            deviceId: device.deviceId,
            lastSeen: device.lastSeen,
            offlineSince: new Date(device.lastSeen.getTime() + offlineThreshold),
          });

          // Update device status
          this.updateDeviceHealth(device.deviceId, 'offline');

          // Generate alert
          await this.alertOnDeviceFailure(device.deviceId, organizationId, 'offline');
        }
      }

      return offlineDevices;
    } catch (error) {
      logger.error('[Physical AI] Error detecting offline devices', error);
      return [];
    }
  }

  /**
   * Alert on device failure
   */
  private async alertOnDeviceFailure(
    deviceId: string,
    organizationId: string,
    failureType: 'offline' | 'error' | 'anomaly'
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'physical_ai.device_failure_alert',
          details: JSON.stringify({
            deviceId,
            failureType,
            timestamp: new Date(),
          }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.warn(`[Physical AI] Device failure alert: ${deviceId} - ${failureType}`);
    } catch (error) {
      logger.error('[Physical AI] Error creating device failure alert', error);
    }
  }

  /**
   * Monitor battery level
   */
  async monitorBatteryLevel(
    deviceId: string,
    organizationId: string
  ): Promise<{ level: number; status: 'good' | 'low' | 'critical' }> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const sensorData = device.sensorData as any;
      const batteryLevel = sensorData?.battery?.level || sensorData?.power?.batteryLevel || 100;

      let status: 'good' | 'low' | 'critical' = 'good';
      if (batteryLevel < 20) {
        status = 'critical';
      } else if (batteryLevel < 50) {
        status = 'low';
      }

      return { level: batteryLevel, status };
    } catch (error) {
      logger.error('[Physical AI] Error monitoring battery level', error);
      throw error;
    }
  }

  /**
   * Monitor connectivity
   */
  async monitorConnectivity(
    deviceId: string,
    organizationId: string
  ): Promise<{
    connected: boolean;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    latency?: number;
    signalStrength?: number;
  }> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const sensorData = device.sensorData as any;
      const networkInfo = sensorData?.network || {};
      
      const connected = networkInfo.connected !== false;
      const latency = networkInfo.latency || Math.random() * 100; // Simulated
      const signalStrength = networkInfo.signalStrength || (80 + Math.random() * 20); // Simulated

      let connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
      if (latency < 50 && signalStrength > 80) {
        connectionQuality = 'excellent';
      } else if (latency < 100 && signalStrength > 60) {
        connectionQuality = 'good';
      } else if (latency < 200 && signalStrength > 40) {
        connectionQuality = 'fair';
      } else {
        connectionQuality = 'poor';
      }

      return {
        connected,
        connectionQuality,
        latency,
        signalStrength,
      };
    } catch (error) {
      logger.error('[Physical AI] Error monitoring connectivity', error);
      throw error;
    }
  }

  /**
   * Track firmware version
   */
  async trackFirmwareVersion(
    deviceId: string,
    organizationId: string
  ): Promise<{
    currentVersion: string;
    latestVersion?: string;
    updateAvailable: boolean;
    lastChecked: Date;
  }> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const sensorData = device.sensorData as any;
      const currentVersion = sensorData?.firmware?.version || 'unknown';
      const latestVersion = sensorData?.firmware?.latestVersion;

      return {
        currentVersion,
        latestVersion,
        updateAvailable: latestVersion && latestVersion !== currentVersion,
        lastChecked: new Date(),
      };
    } catch (error) {
      logger.error('[Physical AI] Error tracking firmware version', error);
      throw error;
    }
  }

  /**
   * Get health dashboard
   */
  async getHealthDashboard(organizationId: string): Promise<{
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    devicesByStatus: Record<string, number>;
    averageComplianceScore: number;
    devicesNeedingAttention: number;
    recentAlerts: number;
  }> {
    try {
      const devices = await prisma.ioTDevice.findMany({
        where: { organizationId },
        include: {
          complianceChecks: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      const now = new Date();
      const offlineThreshold = 5 * 60 * 1000;

      let onlineDevices = 0;
      let offlineDevices = 0;
      let totalComplianceScore = 0;
      let devicesWithScore = 0;
      let devicesNeedingAttention = 0;

      const devicesByStatus: Record<string, number> = {};

      for (const device of devices) {
        const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
        if (timeSinceLastSeen < offlineThreshold) {
          onlineDevices++;
        } else {
          offlineDevices++;
        }

        devicesByStatus[device.complianceStatus] = (devicesByStatus[device.complianceStatus] || 0) + 1;

        if (device.complianceChecks.length > 0) {
          const mappedChecks: EdgeComplianceCheck[] = device.complianceChecks.map((check: any) => ({
            id: check.id,
            deviceId: check.deviceId,
            checkType: check.checkType as ComplianceCheckType,
            status: check.status as 'pass' | 'fail' | 'warning' | 'not_applicable',
            severity: check.severity as 'critical' | 'high' | 'medium' | 'low',
            details: check.details,
            evidence: undefined,
            remediation: undefined,
            timestamp: check.timestamp,
          }));
          const score = this.calculateComplianceScore(mappedChecks);
          totalComplianceScore += score;
          devicesWithScore++;
          
          if (score < 70) {
            devicesNeedingAttention++;
          }
        }
      }

      // Get recent alerts
      const recentAlerts = await prisma.auditLog.count({
        where: {
          organizationId,
          action: 'physical_ai.device_failure_alert',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return {
        totalDevices: devices.length,
        onlineDevices,
        offlineDevices,
        devicesByStatus,
        averageComplianceScore: devicesWithScore > 0 ? Math.round(totalComplianceScore / devicesWithScore) : 0,
        devicesNeedingAttention,
        recentAlerts,
      };
    } catch (error) {
      logger.error('[Physical AI] Error getting health dashboard', error);
      throw error;
    }
  }

  /**
   * Get health history
   */
  async getHealthHistory(
    deviceId: string,
    organizationId: string,
    days: number = 30
  ): Promise<Array<{
    timestamp: Date;
    status: 'online' | 'offline' | 'degraded';
    complianceScore?: number;
    batteryLevel?: number;
    connectionQuality?: string;
  }>> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
        include: {
          complianceChecks: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
              },
            },
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const history: Array<{
        timestamp: Date;
        status: 'online' | 'offline' | 'degraded';
        complianceScore?: number;
        batteryLevel?: number;
        connectionQuality?: string;
      }> = [];

      // Group compliance checks by day
      const checksByDay = new Map<string, EdgeComplianceCheck[]>();
      for (const check of device.complianceChecks) {
        const dayKey = check.timestamp.toISOString().split('T')[0];
        if (!checksByDay.has(dayKey)) {
          checksByDay.set(dayKey, []);
        }
        checksByDay.get(dayKey)!.push(check as any);
      }

      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayKey = date.toISOString().split('T')[0];
        const checks = checksByDay.get(dayKey) || [];

        const sensorData = device.sensorData as any;
        const batteryLevel = sensorData?.battery?.level;
        const connectionQuality = sensorData?.network?.connectionQuality;

        history.push({
          timestamp: date,
          status: device.lastSeen.getTime() > date.getTime() ? 'online' : 'offline',
          complianceScore: checks.length > 0 ? this.calculateComplianceScore(checks) : undefined,
          batteryLevel,
          connectionQuality,
        });
      }

      return history.reverse(); // Oldest first
    } catch (error) {
      logger.error('[Physical AI] Error getting health history', error);
      return [];
    }
  }

  /**
   * Predictive maintenance
   */
  async performPredictiveMaintenance(
    deviceId: string,
    organizationId: string
  ): Promise<Array<{
    issue: string;
    probability: number;
    estimatedDaysUntilFailure: number;
    recommendation: string;
  }>> {
    try {
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
          organizationId,
        },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const sensorData = device.sensorData as any;
      const issues: Array<{
        issue: string;
        probability: number;
        estimatedDaysUntilFailure: number;
        recommendation: string;
      }> = [];

      // Check battery level
      const batteryLevel = sensorData?.battery?.level || 100;
      if (batteryLevel < 30) {
        issues.push({
          issue: 'Low Battery',
          probability: 0.8,
          estimatedDaysUntilFailure: Math.max(1, Math.round(batteryLevel / 2)),
          recommendation: 'Replace or recharge battery soon',
        });
      }

      // Check firmware age
      const firmwareVersion = sensorData?.firmware?.version;
      if (firmwareVersion) {
        // Simulate firmware age check
        issues.push({
          issue: 'Firmware Update Available',
          probability: 0.6,
          estimatedDaysUntilFailure: 90,
          recommendation: 'Update firmware to latest version for security patches',
        });
      }

      // Check error rate
      const errorRate = sensorData?.errorRate || 0;
      if (errorRate > 0.05) {
        issues.push({
          issue: 'High Error Rate',
          probability: 0.7,
          estimatedDaysUntilFailure: 30,
          recommendation: 'Investigate device errors, may indicate hardware failure',
        });
      }

      return issues;
    } catch (error) {
      logger.error('[Physical AI] Error performing predictive maintenance', error);
      return [];
    }
  }

  /**
   * Bulk health check
   */
  async bulkHealthCheck(organizationId: string): Promise<Array<{
    deviceId: string;
    status: 'online' | 'offline' | 'degraded';
    complianceScore?: number;
    batteryLevel?: number;
    issues: string[];
  }>> {
    try {
      const devices = await prisma.ioTDevice.findMany({
        where: { organizationId },
        include: {
          complianceChecks: {
            orderBy: { timestamp: 'desc' },
            take: 12,
          },
        },
      });

      const results: Array<{
        deviceId: string;
        status: 'online' | 'offline' | 'degraded';
        complianceScore?: number;
        batteryLevel?: number;
        issues: string[];
      }> = [];

      const now = new Date();
      const offlineThreshold = 5 * 60 * 1000;

      for (const device of devices) {
        const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
        const status: 'online' | 'offline' | 'degraded' = 
          timeSinceLastSeen < offlineThreshold ? 'online' :
          timeSinceLastSeen < 30 * 60 * 1000 ? 'degraded' : 'offline';

        const sensorData = device.sensorData as any;
        const batteryLevel = sensorData?.battery?.level;
        const complianceScore = device.complianceChecks.length > 0 ?
          this.calculateComplianceScore(device.complianceChecks as any) : undefined;

        const issues: string[] = [];
        if (status === 'offline') {
          issues.push('Device offline');
        }
        if (batteryLevel && batteryLevel < 20) {
          issues.push('Low battery');
        }
        if (complianceScore && complianceScore < 70) {
          issues.push('Low compliance score');
        }

        results.push({
          deviceId: device.deviceId,
          status,
          complianceScore,
          batteryLevel,
          issues,
        });
      }

      return results;
    } catch (error) {
      logger.error('[Physical AI] Error performing bulk health check', error);
      throw error;
    }
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    logger.info('[Physical AI] Service shutdown');
  }
}

interface DeviceHealthStatus {
  status: 'online' | 'offline' | 'degraded';
  lastUpdate: Date;
  consecutiveFailures: number;
}

export default new PhysicalAIService();

