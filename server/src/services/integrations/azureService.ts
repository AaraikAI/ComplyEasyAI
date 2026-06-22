/**
 * Azure Integration Service
 * Handles Azure AD, Resource Manager, Security Center, and Policy integrations
 * Uses Azure SDK for JavaScript
 */

import { ClientSecretCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { SubscriptionClient } from '@azure/arm-subscriptions';
import { SecurityCenter } from '@azure/arm-security';
import { PolicyClient } from '@azure/arm-policy';
import { GraphRbacManagementClient } from '@azure/graph';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { decryptField } from '../../utils/credentialEncryption';

interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
}

interface AzureResource {
  id: string;
  name: string;
  type: string;
  location: string;
  tags?: Record<string, string>;
  provisioningState?: string;
}

interface SecurityRecommendation {
  id: string;
  name: string;
  severity: string;
  state: string;
  description: string;
  remediationDescription?: string;
  resourceId?: string;
}

interface ComplianceResult {
  policyDefinitionId: string;
  policyDefinitionName: string;
  complianceState: string;
  resourceId?: string;
  timestamp: string;
}

interface AzureUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  accountEnabled: boolean;
  createdDateTime?: string;
  lastSignInDateTime?: string;
}

class AzureService {
  /**
   * Get integration from database
   */
  async getIntegration(organizationId: string) {
    return prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure',
        },
      },
    });
  }

  /**
   * Get Azure credentials from integration
   */
  private async getCredentials(organizationId: string): Promise<AzureCredentials> {
    const integration = await this.getIntegration(organizationId);

    if (!integration || !integration.connected) {
      throw new AppError('Azure integration not connected', 400);
    }

    const config = integration.config as any;

    if (!config.tenantId || !config.clientId || !config.clientSecret || !config.subscriptionId) {
      throw new AppError('Azure credentials incomplete. Please reconnect.', 400);
    }

    return {
      tenantId: config.tenantId,
      clientId: config.clientId,
      // clientSecret is encrypted at rest; decryptField is a no-op on legacy plaintext.
      clientSecret: config.clientSecret ? decryptField(config.clientSecret) : config.clientSecret,
      subscriptionId: config.subscriptionId,
    };
  }

  /**
   * Create Azure credential object for SDK clients
   */
  private createCredential(creds: AzureCredentials): ClientSecretCredential {
    return new ClientSecretCredential(
      creds.tenantId,
      creds.clientId,
      creds.clientSecret
    );
  }

  /**
   * Validate Azure credentials
   */
  async validateCredentials(credentials: AzureCredentials): Promise<{
    valid: boolean;
    subscriptionName?: string;
    error?: string;
  }> {
    try {
      const credential = this.createCredential(credentials);
      const subscriptionClient = new SubscriptionClient(credential);

      // Try to get the subscription to validate credentials
      const subscription = await (subscriptionClient as any).subscriptions.get(credentials.subscriptionId);

      return {
        valid: true,
        subscriptionName: subscription.displayName || credentials.subscriptionId,
      };
    } catch (error: any) {
      logger.error('Error validating Azure credentials', error);
      return {
        valid: false,
        error: error.message || 'Invalid credentials',
      };
    }
  }

  /**
   * Get Azure resources
   */
  async getResources(
    organizationId: string,
    resourceType?: string,
    limit: number = 100
  ): Promise<AzureResource[]> {
    // ARM resource-type names are limited to alphanumerics and . _ / - characters.
    // Validate before building the OData filter to reject injection attempts.
    let filter: string | undefined;
    if (resourceType) {
      if (!/^[A-Za-z0-9._/-]+$/.test(resourceType)) {
        throw new AppError('Invalid resourceType', 400);
      }
      filter = `resourceType eq '${resourceType}'`;
    }
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);
      const resourceClient = new ResourceManagementClient(credential, credentials.subscriptionId);

      const resources: AzureResource[] = [];

      for await (const resource of resourceClient.resources.list({ filter })) {
        if (resources.length >= limit) break;
        
        resources.push({
          id: resource.id || '',
          name: resource.name || '',
          type: resource.type || '',
          location: resource.location || '',
          tags: resource.tags,
          provisioningState: resource.provisioningState,
        });
      }

      logger.info(`Fetched ${resources.length} Azure resources for org ${organizationId}`);

      // Update last sync
      await this.updateLastSync(organizationId);

      return resources;
    } catch (error: any) {
      logger.error('Error fetching Azure resources', error);
      if (error.statusCode === 401 || error.code === 'AuthenticationError') {
        throw new AppError('Authentication failed. Please reconnect Azure integration.', 403);
      }
      throw new AppError(`Failed to fetch Azure resources: ${error.message}`, 500);
    }
  }

  /**
   * Get Azure resource groups
   */
  async getResourceGroups(organizationId: string): Promise<any[]> {
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);
      const resourceClient = new ResourceManagementClient(credential, credentials.subscriptionId);

      const resourceGroups: any[] = [];

      for await (const rg of resourceClient.resourceGroups.list()) {
        resourceGroups.push({
          id: rg.id,
          name: rg.name,
          location: rg.location,
          provisioningState: rg.properties?.provisioningState,
          tags: rg.tags,
        });
      }

      logger.info(`Fetched ${resourceGroups.length} resource groups for org ${organizationId}`);
      return resourceGroups;
    } catch (error: any) {
      logger.error('Error fetching Azure resource groups', error);
      throw new AppError(`Failed to fetch resource groups: ${error.message}`, 500);
    }
  }

  /**
   * Get Security Center recommendations
   */
  async getSecurityRecommendations(organizationId: string): Promise<SecurityRecommendation[]> {
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);
      const securityClient = new SecurityCenter(credential, credentials.subscriptionId);

      const recommendations: SecurityRecommendation[] = [];

      // Get security assessments
      for await (const assessment of securityClient.assessments.list(`/subscriptions/${credentials.subscriptionId}`)) {
        recommendations.push({
          id: assessment.id || '',
          name: assessment.displayName || assessment.name || '',
          severity: assessment.metadata?.severity || 'Unknown',
          state: assessment.status?.code || 'Unknown',
          description: assessment.metadata?.description || '',
          remediationDescription: assessment.metadata?.remediationDescription,
          resourceId: assessment.resourceDetails?.source,
        });
      }

      logger.info(`Fetched ${recommendations.length} security recommendations for org ${organizationId}`);
      return recommendations;
    } catch (error: any) {
      logger.error('Error fetching security recommendations', error);
      // Return empty array if Security Center is not enabled
      if (error.statusCode === 404 || error.code === 'ResourceNotFound') {
        return [];
      }
      throw new AppError(`Failed to fetch security recommendations: ${error.message}`, 500);
    }
  }

  /**
   * Get Security Center alerts
   */
  async getSecurityAlerts(organizationId: string): Promise<any[]> {
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);
      const securityClient = new SecurityCenter(credential, credentials.subscriptionId);

      const alerts: any[] = [];

      for await (const alert of securityClient.alerts.list()) {
        alerts.push({
          id: alert.id,
          name: alert.alertDisplayName || alert.name,
          severity: alert.severity,
          status: alert.status,
          description: alert.description,
          alertType: alert.alertType,
          compromisedEntity: alert.compromisedEntity,
          startTimeUtc: alert.startTimeUtc,
          endTimeUtc: alert.endTimeUtc,
          remediationSteps: alert.remediationSteps,
        });
      }

      logger.info(`Fetched ${alerts.length} security alerts for org ${organizationId}`);
      return alerts;
    } catch (error: any) {
      logger.error('Error fetching security alerts', error);
      if (error.statusCode === 404) {
        return [];
      }
      throw new AppError(`Failed to fetch security alerts: ${error.message}`, 500);
    }
  }

  /**
   * Get policy compliance status
   */
  async getPolicyCompliance(organizationId: string): Promise<ComplianceResult[]> {
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);
      const policyClient = new PolicyClient(credential, credentials.subscriptionId);

      const complianceResults: ComplianceResult[] = [];

      // Get policy assignments
      for await (const assignment of policyClient.policyAssignments.list()) {
        complianceResults.push({
          policyDefinitionId: assignment.policyDefinitionId || '',
          policyDefinitionName: assignment.displayName || assignment.name || '',
          complianceState: 'Unknown', // Would need policy insights API for actual state
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(`Fetched ${complianceResults.length} policy assignments for org ${organizationId}`);
      return complianceResults;
    } catch (error: any) {
      logger.error('Error fetching policy compliance', error);
      throw new AppError(`Failed to fetch policy compliance: ${error.message}`, 500);
    }
  }

  /**
   * Get Azure AD users (requires appropriate Graph API permissions)
   */
  async getUsers(organizationId: string): Promise<AzureUser[]> {
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);

      // Note: For Graph API, we need Microsoft Graph client
      // This is a simplified implementation
      const graphClient = new GraphRbacManagementClient(credential as any, credentials.tenantId);

      const users: AzureUser[] = [];

      for await (const user of graphClient.users.list() as any) {
        users.push({
          id: user.objectId || '',
          displayName: user.displayName || '',
          userPrincipalName: user.userPrincipalName || '',
          accountEnabled: user.accountEnabled ?? true,
        });
      }

      logger.info(`Fetched ${users.length} Azure AD users for org ${organizationId}`);
      return users;
    } catch (error: any) {
      logger.error('Error fetching Azure AD users', error);
      // Return empty if Graph API access not granted
      if (error.statusCode === 403) {
        logger.warn('Graph API access denied - ensure app has Directory.Read.All permission');
        return [];
      }
      throw new AppError(`Failed to fetch Azure AD users: ${error.message}`, 500);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(organizationId: string): Promise<any> {
    try {
      const credentials = await this.getCredentials(organizationId);
      const credential = this.createCredential(credentials);
      const subscriptionClient = new SubscriptionClient(credential);

      const subscription = await (subscriptionClient as any).subscriptions.get(credentials.subscriptionId);

      return {
        id: subscription.subscriptionId,
        displayName: subscription.displayName,
        state: subscription.state,
        tenantId: subscription.tenantId,
        authorizationSource: subscription.authorizationSource,
      };
    } catch (error: any) {
      logger.error('Error fetching subscription details', error);
      throw new AppError(`Failed to fetch subscription details: ${error.message}`, 500);
    }
  }

  /**
   * Run compliance scan (aggregate all data)
   */
  async runComplianceScan(organizationId: string): Promise<{
    resources: number;
    securityRecommendations: number;
    securityAlerts: number;
    policyAssignments: number;
    overallRisk: string;
    scanTimestamp: string;
    findings: any[];
    scanComplete: boolean;
    degradedSources: string[];
  }> {
    try {
      logger.info(`Starting Azure compliance scan for org ${organizationId}`);

      // Fetch all data in parallel. A failed source must NOT be silently swallowed
      // to an empty list — that would let the scan report a clean "Low" posture for
      // data it never actually retrieved (a false compliance attestation). Track
      // and log each failure so the result can be marked degraded below.
      const degradedSources: string[] = [];
      const safeSource = async (name: string, p: Promise<any[]>): Promise<any[]> => {
        try {
          return await p;
        } catch (error) {
          logger.error(`Azure compliance scan: source "${name}" failed for org ${organizationId}`, error);
          degradedSources.push(name);
          return [];
        }
      };
      const [resources, recommendations, alerts, policies] = await Promise.all([
        safeSource('resources', this.getResources(organizationId)),
        safeSource('securityRecommendations', this.getSecurityRecommendations(organizationId)),
        safeSource('securityAlerts', this.getSecurityAlerts(organizationId)),
        safeSource('policyCompliance', this.getPolicyCompliance(organizationId)),
      ]);

      // Calculate risk level based on findings
      const highSeverityCount = recommendations.filter(r =>
        r.severity?.toLowerCase() === 'high'
      ).length + alerts.filter(a => a.severity?.toLowerCase() === 'high').length;

      let overallRisk = 'Low';
      if (highSeverityCount > 10) overallRisk = 'Critical';
      else if (highSeverityCount > 5) overallRisk = 'High';
      else if (highSeverityCount > 0) overallRisk = 'Medium';

      // A partial scan must not present as a clean/Low posture — surface it.
      const scanComplete = degradedSources.length === 0;
      if (!scanComplete) {
        overallRisk = 'Unknown';
        logger.warn(
          `Azure compliance scan DEGRADED for org ${organizationId}; sources failed: ${degradedSources.join(', ')} — risk reported as "Unknown" (not "Low").`,
        );
      }

      // Compile findings
      const findings = [
        ...recommendations.filter(r => r.state !== 'Healthy').slice(0, 20).map(r => ({
          type: 'security_recommendation',
          severity: r.severity,
          title: r.name,
          description: r.description,
        })),
        ...alerts.filter(a => a.status !== 'Resolved').slice(0, 20).map(a => ({
          type: 'security_alert',
          severity: a.severity,
          title: a.name,
          description: a.description,
        })),
      ];

      // Update last sync
      await this.updateLastSync(organizationId);

      const result = {
        resources: resources.length,
        securityRecommendations: recommendations.length,
        securityAlerts: alerts.length,
        policyAssignments: policies.length,
        overallRisk,
        scanTimestamp: new Date().toISOString(),
        findings,
        scanComplete,
        degradedSources,
      };

      logger.info(`Azure compliance scan completed for org ${organizationId}`, {
        resources: result.resources,
        recommendations: result.securityRecommendations,
        alerts: result.securityAlerts,
        risk: result.overallRisk,
      });

      return result;
    } catch (error: any) {
      logger.error('Error running Azure compliance scan', error);
      throw new AppError(`Failed to run compliance scan: ${error.message}`, 500);
    }
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSync(organizationId: string): Promise<void> {
    try {
      await prisma.integration.update({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'azure',
          },
        },
        data: {
          lastSync: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating Azure last sync', error);
    }
  }

  /**
   * Disconnect Azure integration
   */
  async disconnect(organizationId: string): Promise<void> {
    try {
      await prisma.integration.updateMany({
        where: {
          organizationId,
          provider: 'azure',
        },
        data: {
          connected: false,
          accessToken: null,
          refreshToken: null,
          config: undefined,
        },
      });

      logger.info(`Azure integration disconnected for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error disconnecting Azure', error);
      throw new AppError('Failed to disconnect Azure integration', 500);
    }
  }
}

export default new AzureService();
