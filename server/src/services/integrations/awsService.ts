/**
 * AWS Integration Service
 * Handles IAM credential management and AWS service integration
 * Note: AWS uses IAM access keys instead of OAuth 2.0
 */

import AWS from 'aws-sdk';
import { Prisma } from '../../generated/prisma/client';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

// Security fix for GHSA-j965-2qgj-vjmq: Validate AWS region parameter
const validateRegion = (region: string): string => {
  if (!region || typeof region !== 'string') {
    throw new AppError('AWS region must be a non-empty string', 400);
  }
  // Basic validation - allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(region)) {
    throw new AppError('Invalid AWS region format', 400);
  }
  return region;
};

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

interface CloudTrailEvent {
  eventId: string;
  eventName: string;
  eventSource: string;
  eventTime: string;
  username: string;
  awsRegion: string;
  sourceIPAddress: string;
  userAgent: string;
  errorCode?: string;
  errorMessage?: string;
}

class AWSService {
  /**
   * Validate AWS credentials
   */
  async validateCredentials(credentials: AWSCredentials): Promise<{
    valid: boolean;
    accountId?: string;
    error?: string;
  }> {
    try {
      const sts = new AWS.STS({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: validateRegion(credentials.region),
        sessionToken: credentials.sessionToken,
      });

      const identity = await sts.getCallerIdentity().promise();

      return {
        valid: true,
        accountId: identity.Account,
      };
    } catch (error: any) {
      logger.error('Error validating AWS credentials', error);
      return {
        valid: false,
        error: error.message || 'Invalid credentials',
      };
    }
  }

  /**
   * Save AWS integration
   */
  async saveIntegration(
    organizationId: string,
    credentials: AWSCredentials,
    accountId: string
  ): Promise<void> {
    try {
      // Encrypt credentials using KMS or similar service
      await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'aws',
          },
        },
        create: {
          organizationId,
          name: 'AWS',
          category: 'cloud',
          provider: 'aws',
          connected: true,
          config: {
            accountId,
            region: credentials.region,
            // Encrypt these with KMS or similar service when available
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
          },
          lastSync: new Date(),
        },
        update: {
          connected: true,
          config: {
            accountId,
            region: credentials.region,
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
          },
          lastSync: new Date(),
        },
      });

      logger.info(`AWS integration saved for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error saving AWS integration', error);
      throw new AppError('Failed to save integration', 500);
    }
  }

  /**
   * Get integration from database
   */
  async getIntegration(organizationId: string) {
    return prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'aws',
        },
      },
    });
  }

  /**
   * Get AWS credentials from integration
   */
  private async getCredentials(organizationId: string): Promise<AWSCredentials> {
    const integration = await this.getIntegration(organizationId);

    if (!integration || !integration.connected) {
      throw new AppError('AWS integration not connected', 400);
    }

    const config = integration.config as any;

    return {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region || 'us-east-1',
      sessionToken: config.sessionToken,
    };
  }

  /**
   * Get CloudTrail events
   */
  async getCloudTrailEvents(
    organizationId: string,
    startTime?: Date,
    endTime?: Date,
    maxResults: number = 100
  ): Promise<CloudTrailEvent[]> {
    try {
      const credentials = await this.getCredentials(organizationId);

      const cloudtrail = new AWS.CloudTrail({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: validateRegion(credentials.region),
        sessionToken: credentials.sessionToken,
      });

      const params: AWS.CloudTrail.LookupEventsRequest = {
        MaxResults: maxResults,
        StartTime: startTime,
        EndTime: endTime,
      };

      const response = await cloudtrail.lookupEvents(params).promise();
      const events = response.Events || [];

      logger.info(`Fetched ${events.length} CloudTrail events for org ${organizationId}`);

      return events.map((event) => ({
        eventId: event.EventId!,
        eventName: event.EventName!,
        eventSource: event.EventSource || '',
        eventTime: event.EventTime!.toISOString(),
        username: event.Username || 'Unknown',
        awsRegion: event.CloudTrailEvent ? JSON.parse(event.CloudTrailEvent).awsRegion : credentials.region,
        sourceIPAddress: event.CloudTrailEvent
          ? JSON.parse(event.CloudTrailEvent).sourceIPAddress
          : '',
        userAgent: event.CloudTrailEvent ? JSON.parse(event.CloudTrailEvent).userAgent : '',
        errorCode: event.CloudTrailEvent ? JSON.parse(event.CloudTrailEvent).errorCode : undefined,
        errorMessage: event.CloudTrailEvent
          ? JSON.parse(event.CloudTrailEvent).errorMessage
          : undefined,
      }));
    } catch (error: any) {
      if (error.code === 'InvalidClientTokenId' || error.code === 'SignatureDoesNotMatch') {
        throw new AppError('Authentication failed. Please reconnect AWS integration.', 403);
      }
      logger.error('Error fetching CloudTrail events', error);
      throw new AppError('Failed to fetch CloudTrail events', 500);
    }
  }

  /**
   * Get S3 bucket security status
   */
  async getS3BucketSecurity(organizationId: string): Promise<any[]> {
    try {
      const credentials = await this.getCredentials(organizationId);

      const s3 = new AWS.S3({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: validateRegion(credentials.region),
        sessionToken: credentials.sessionToken,
      });

      const bucketsResponse = await s3.listBuckets().promise();
      const buckets = bucketsResponse.Buckets || [];

      const securityStatus = [];

      for (const bucket of buckets.slice(0, 50)) {
        // Limit to 50 buckets
        try {
          const [encryption, publicAccess, versioning] = await Promise.all([
            s3
              .getBucketEncryption({ Bucket: bucket.Name! })
              .promise()
              .then(() => true)
              .catch(() => false),
            s3
              .getPublicAccessBlock({ Bucket: bucket.Name! })
              .promise()
              .then((data) => data.PublicAccessBlockConfiguration)
              .catch(() => null),
            s3
              .getBucketVersioning({ Bucket: bucket.Name! })
              .promise()
              .then((data) => data.Status === 'Enabled')
              .catch(() => false),
          ]);

          securityStatus.push({
            name: bucket.Name,
            encrypted: encryption,
            publicAccessBlocked:
              publicAccess?.BlockPublicAcls &&
              publicAccess?.BlockPublicPolicy &&
              publicAccess?.IgnorePublicAcls &&
              publicAccess?.RestrictPublicBuckets,
            versioningEnabled: versioning,
            createdAt: bucket.CreationDate,
          });
        } catch (error) {
          logger.warn(`Error checking security for bucket ${bucket.Name}`, error);
        }
      }

      logger.info(`Checked security for ${securityStatus.length} S3 buckets for org ${organizationId}`);

      return securityStatus;
    } catch (error) {
      logger.error('Error checking S3 bucket security', error);
      throw new AppError('Failed to check S3 bucket security', 500);
    }
  }

  /**
   * Get IAM users and their access keys
   */
  async getIAMUsers(organizationId: string): Promise<any[]> {
    try {
      const credentials = await this.getCredentials(organizationId);

      const iam = new AWS.IAM({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: validateRegion(credentials.region),
        sessionToken: credentials.sessionToken,
      });

      const usersResponse = await iam.listUsers().promise();
      const users = usersResponse.Users || [];

      const userDetails = [];

      for (const user of users.slice(0, 100)) {
        // Limit to 100 users
        try {
          const accessKeys = await iam.listAccessKeys({ UserName: user.UserName }).promise();
          const mfaDevices = await iam.listMFADevices({ UserName: user.UserName }).promise();

          userDetails.push({
            username: user.UserName,
            userId: user.UserId,
            arn: user.Arn,
            createdAt: user.CreateDate,
            passwordLastUsed: user.PasswordLastUsed,
            accessKeyCount: accessKeys.AccessKeyMetadata?.length || 0,
            mfaEnabled: (mfaDevices.MFADevices?.length || 0) > 0,
            accessKeys: accessKeys.AccessKeyMetadata?.map((key) => ({
              id: key.AccessKeyId,
              status: key.Status,
              createdAt: key.CreateDate,
            })),
          });
        } catch (error) {
          logger.warn(`Error fetching details for IAM user ${user.UserName}`, error);
        }
      }

      logger.info(`Fetched ${userDetails.length} IAM users for org ${organizationId}`);

      return userDetails;
    } catch (error) {
      logger.error('Error fetching IAM users', error);
      throw new AppError('Failed to fetch IAM users', 500);
    }
  }

  /**
   * Get AWS Config compliance summary
   */
  async getConfigComplianceSummary(organizationId: string): Promise<any> {
    try {
      const credentials = await this.getCredentials(organizationId);

      const configService = new AWS.ConfigService({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: validateRegion(credentials.region),
        sessionToken: credentials.sessionToken,
      });

      const response = await configService.describeComplianceByConfigRule().promise();
      const rules = response.ComplianceByConfigRules || [];

      const summary = {
        totalRules: rules.length,
        compliant: 0,
        nonCompliant: 0,
        notApplicable: 0,
        insufficientData: 0,
        rules: [] as any[],
      };

      for (const rule of rules) {
        const status = rule.Compliance?.ComplianceType || 'INSUFFICIENT_DATA';

        if (status === 'COMPLIANT') summary.compliant++;
        else if (status === 'NON_COMPLIANT') summary.nonCompliant++;
        else if (status === 'NOT_APPLICABLE') summary.notApplicable++;
        else summary.insufficientData++;

        summary.rules.push({
          name: rule.ConfigRuleName,
          status,
        });
      }

      logger.info(`Fetched AWS Config compliance summary for org ${organizationId}`);

      return summary;
    } catch (error: any) {
      if (error.code === 'ConfigurationRecorderNotAvailableException') {
        logger.warn('AWS Config is not enabled in this account');
        return {
          totalRules: 0,
          compliant: 0,
          nonCompliant: 0,
          notApplicable: 0,
          insufficientData: 0,
          rules: [],
          error: 'AWS Config is not enabled',
        };
      }
      logger.error('Error fetching AWS Config compliance', error);
      throw new AppError('Failed to fetch AWS Config compliance', 500);
    }
  }

  /**
   * Get Security Hub findings
   */
  async getSecurityHubFindings(organizationId: string, maxResults: number = 100): Promise<any[]> {
    try {
      const credentials = await this.getCredentials(organizationId);

      const securityhub = new AWS.SecurityHub({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: validateRegion(credentials.region),
        sessionToken: credentials.sessionToken,
      });

      const response = await securityhub
        .getFindings({
          MaxResults: maxResults,
          Filters: {
            RecordState: [{ Value: 'ACTIVE', Comparison: 'EQUALS' }],
          },
        })
        .promise();

      const findings = response.Findings || [];

      logger.info(`Fetched ${findings.length} Security Hub findings for org ${organizationId}`);

      return findings.map((finding) => ({
        id: finding.Id,
        title: finding.Title,
        description: finding.Description,
        severity: finding.Severity?.Label,
        severityScore: finding.Severity?.Normalized,
        productArn: finding.ProductArn,
        generatorId: finding.GeneratorId,
        awsAccountId: finding.AwsAccountId,
        resourceType: finding.Resources?.[0]?.Type,
        resourceId: finding.Resources?.[0]?.Id,
        compliance: finding.Compliance?.Status,
        createdAt: finding.CreatedAt,
        updatedAt: finding.UpdatedAt,
      }));
    } catch (error: any) {
      if (error.code === 'InvalidAccessException') {
        logger.warn('AWS Security Hub is not enabled or accessible');
        return [];
      }
      logger.error('Error fetching Security Hub findings', error);
      throw new AppError('Failed to fetch Security Hub findings', 500);
    }
  }

  /**
   * Run comprehensive AWS compliance scan
   */
  async runComplianceScan(organizationId: string): Promise<any> {
    try {
      logger.info(`Starting AWS compliance scan for org ${organizationId}`);

      const [s3Security, iamUsers, configCompliance, securityFindings] = await Promise.all([
        this.getS3BucketSecurity(organizationId).catch((err) => {
          logger.warn('S3 scan failed', err);
          return [];
        }),
        this.getIAMUsers(organizationId).catch((err) => {
          logger.warn('IAM scan failed', err);
          return [];
        }),
        this.getConfigComplianceSummary(organizationId).catch((err) => {
          logger.warn('Config scan failed', err);
          return null;
        }),
        this.getSecurityHubFindings(organizationId).catch((err) => {
          logger.warn('Security Hub scan failed', err);
          return [];
        }),
      ]);

      const issues = {
        s3: {
          unencryptedBuckets: s3Security.filter((b) => !b.encrypted).length,
          publicBuckets: s3Security.filter((b) => !b.publicAccessBlocked).length,
          noVersioning: s3Security.filter((b) => !b.versioningEnabled).length,
        },
        iam: {
          usersWithoutMFA: iamUsers.filter((u) => !u.mfaEnabled).length,
          oldAccessKeys: iamUsers.filter(
            (u) =>
              u.accessKeys?.some(
                (k: any) =>
                  k.status === 'Active' &&
                  new Date().getTime() - new Date(k.createdAt).getTime() > 90 * 24 * 60 * 60 * 1000
              )
          ).length,
        },
        config: configCompliance,
        securityHub: {
          criticalFindings: securityFindings.filter((f) => f.severity === 'CRITICAL').length,
          highFindings: securityFindings.filter((f) => f.severity === 'HIGH').length,
          totalFindings: securityFindings.length,
        },
      };

      logger.info(`Completed AWS compliance scan for org ${organizationId}`);

      return {
        scannedAt: new Date(),
        issues,
        details: {
          s3Security,
          iamUsers,
          securityFindings: securityFindings.slice(0, 20), // Limit to 20 findings
        },
      };
    } catch (error) {
      logger.error('Error running AWS compliance scan', error);
      throw new AppError('Failed to run compliance scan', 500);
    }
  }

  /**
   * Disconnect integration
   */
  async disconnect(organizationId: string): Promise<void> {
    try {
      await prisma.integration.update({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'aws',
          },
        },
        data: {
          connected: false,
          config: Prisma.DbNull,
          lastSync: null,
        },
      });

      logger.info(`AWS integration disconnected for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error disconnecting AWS integration', error);
      throw new AppError('Failed to disconnect AWS integration', 500);
    }
  }
}

export default new AWSService();
