import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '../utils/auditLogger';

const prisma = new PrismaClient();

/**
 * Trust Center & External Audit Portal Service
 * Manages public compliance status, certifications, and audit reports
 */
export class TrustCenterService {
  /**
   * Create trust certificate
   */
  async createCertificate(data: {
    organizationId: string;
    certificationType: string;
    issuer: string;
    issuedDate: Date;
    expiryDate: Date;
    certificateUrl?: string;
    scope?: string;
    publiclyVisible?: boolean;
    userId: string;
  }) {
    const certificate = await prisma.trustCertificate.create({
      data: {
        organizationId: data.organizationId,
        certificationType: data.certificationType,
        issuer: data.issuer,
        issuedDate: data.issuedDate,
        expiryDate: data.expiryDate,
        certificateUrl: data.certificateUrl,
        scope: data.scope,
        status: 'Active',
        publiclyVisible: data.publiclyVisible ?? true,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'trust_certificate.created',
      resourceType: 'TrustCertificate',
      resourceId: certificate.id,
      metadata: { certificationType: data.certificationType },
    });

    return certificate;
  }

  /**
   * Get public trust center data
   */
  async getPublicTrustCenter(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get active public certifications
    const certificates = await prisma.trustCertificate.findMany({
      where: {
        organizationId,
        status: 'Active',
        publiclyVisible: true,
      },
      select: {
        id: true,
        certificationType: true,
        issuer: true,
        issuedDate: true,
        expiryDate: true,
        scope: true,
      },
    });

    // Get public frameworks
    const frameworks = await prisma.framework.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        controls: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Calculate compliance metrics
    const complianceMetrics = frameworks.map((f) => ({
      framework: f.name,
      totalControls: f.controls.length,
      implementedControls: f.controls.filter((c) => c.status === 'Implemented')
        .length,
      complianceRate:
        f.controls.length > 0
          ? Math.round(
              (f.controls.filter((c) => c.status === 'Implemented').length /
                f.controls.length) *
                100
            )
          : 0,
    }));

    return {
      organization: {
        name: organization.name,
      },
      certifications: certificates,
      frameworks: frameworks.map((f) => ({
        name: f.name,
        controlsCount: f.controls.length,
      })),
      complianceMetrics,
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate compliance certificate
   */
  async generateComplianceCertificate(
    organizationId: string,
    frameworkId: string,
    userId: string
  ) {
    const framework = await prisma.framework.findFirst({
      where: {
        id: frameworkId,
        organizationId,
      },
      include: {
        controls: true,
        organization: true,
      },
    });

    if (!framework) {
      throw new Error('Framework not found');
    }

    const implementedControls = framework.controls.filter(
      (c) => c.status === 'Implemented'
    ).length;
    const totalControls = framework.controls.length;
    const complianceRate = Math.round(
      (implementedControls / totalControls) * 100
    );

    // Create certificate record
    const certificate = await this.createCertificate({
      organizationId,
      certificationType: `${framework.name} Compliance`,
      issuer: 'ComplyEasy AI',
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      scope: `${implementedControls}/${totalControls} controls implemented (${complianceRate}%)`,
      publiclyVisible: true,
      userId,
    });

    return {
      certificate,
      framework: framework.name,
      complianceRate,
      implementedControls,
      totalControls,
    };
  }

  /**
   * Get certificates by organization
   */
  async getCertificatesByOrganization(organizationId: string) {
    return await prisma.trustCertificate.findMany({
      where: { organizationId },
      orderBy: { issuedDate: 'desc' },
    });
  }

  /**
   * Update certificate status
   */
  async updateCertificateStatus(
    certificateId: string,
    status: string,
    userId: string,
    organizationId: string
  ) {
    const certificate = await prisma.trustCertificate.update({
      where: { id: certificateId },
      data: { status },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'trust_certificate.status_updated',
      resourceType: 'TrustCertificate',
      resourceId: certificateId,
      metadata: { status },
    });

    return certificate;
  }
}

export default new TrustCenterService();
