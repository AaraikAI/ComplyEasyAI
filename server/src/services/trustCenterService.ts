import { Prisma } from '../generated/prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';


interface ControlStatus {
  status: string;
}

interface FrameworkWithControls {
  id: string;
  name: string;
  controls: ControlStatus[];
}

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
    certificateType: string;
    issuer: string;
    issueDate: Date;
    expiryDate: Date;
    documentUrl?: string;
    metadata?: Prisma.InputJsonValue;
    publiclyVisible?: boolean;
    userId: string;
  }) {
    const certificate = await prisma.trustCertificate.create({
      data: {
        organizationId: data.organizationId,
        certificateType: data.certificateType,
        issuer: data.issuer,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        documentUrl: data.documentUrl,
        metadata: data.metadata,
        status: 'Valid',
        publiclyVisible: data.publiclyVisible ?? true,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'trust_certificate.created',
      resourceType: 'TrustCertificate',
      resourceId: certificate.id,
      metadata: { certificateType: data.certificateType },
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
      throw new AppError('Organization not found', 404);
    }

    // Get active public certifications
    const certificates = await prisma.trustCertificate.findMany({
      where: {
        organizationId,
        status: 'Valid',
        publiclyVisible: true,
      },
      select: {
        id: true,
        certificateType: true,
        issuer: true,
        issueDate: true,
        expiryDate: true,
        metadata: true,
      },
    });

    // Get public frameworks
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        controls: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Calculate compliance metrics
    const complianceMetrics = frameworks.map((f) => ({
      framework: f.name,
      totalControls: f.controls.length,
      implementedControls: f.controls.filter((c) => c.status === 'Implemented').length,
      complianceRate:
        f.controls.length > 0
          ? Math.round(
              (f.controls.filter((c) => c.status === 'Implemented').length / f.controls.length) * 100
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
    const framework = await prisma.complianceFramework.findFirst({
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
      throw new AppError('Framework not found', 404);
    }

    const implementedControls = framework.controls.filter((c) => c.status === 'Implemented').length;
    const totalControls = framework.controls.length;
    const complianceRate = totalControls > 0
      ? Math.round((implementedControls / totalControls) * 100)
      : 0;

    // Create certificate record
    const certificate = await this.createCertificate({
      organizationId,
      certificateType: `${framework.name} Compliance`,
      issuer: 'ComplyEasy AI',
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        scope: `${implementedControls}/${totalControls} controls implemented (${complianceRate}%)`,
      },
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
      orderBy: { issueDate: 'desc' },
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
    const existing = await prisma.trustCertificate.findFirst({
      where: { id: certificateId, organizationId },
    });
    if (!existing) {
      throw new AppError('Certificate not found', 404);
    }

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
