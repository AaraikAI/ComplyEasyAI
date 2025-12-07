import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '../utils/auditLogger';

const prisma = new PrismaClient();

/**
 * Personnel & Identity Management Service
 * Handles onboarding, offboarding, access reviews, and compliance tracking
 */
export class PersonnelService {
  /**
   * Create personnel record during onboarding
   */
  async createPersonnel(data: {
    userId: string;
    organizationId: string;
    systemAccess?: any;
    dataAccess?: any;
    physicalAccess?: any;
    backgroundCheck?: boolean;
    backgroundCheckDate?: Date;
    securityTraining?: boolean;
    trainingDate?: Date;
  }) {
    const personnel = await prisma.personnel.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        onboardingStatus: 'In_Progress',
        onboardingDate: new Date(),
        systemAccess: data.systemAccess || {},
        dataAccess: data.dataAccess || {},
        physicalAccess: data.physicalAccess || {},
        backgroundCheck: data.backgroundCheck || false,
        backgroundCheckDate: data.backgroundCheckDate,
        securityTraining: data.securityTraining || false,
        trainingDate: data.trainingDate,
      },
      include: {
        user: true,
      },
    });

    // Log onboarding started
    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'personnel.onboarding.started',
      resourceType: 'Personnel',
      resourceId: personnel.id,
      metadata: { status: 'In_Progress' },
    });

    return personnel;
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(
    personnelId: string,
    userId: string,
    organizationId: string
  ) {
    const personnel = await prisma.personnel.update({
      where: { id: personnelId },
      data: {
        onboardingStatus: 'Completed',
        onboardingDate: new Date(),
      },
      include: {
        user: true,
      },
    });

    // Update user to active
    await prisma.user.update({
      where: { id: personnel.userId },
      data: { active: true },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'personnel.onboarding.completed',
      resourceType: 'Personnel',
      resourceId: personnelId,
      metadata: { completedAt: new Date() },
    });

    return personnel;
  }

  /**
   * Start offboarding process
   */
  async startOffboarding(
    personnelId: string,
    reason: string,
    userId: string,
    organizationId: string
  ) {
    const personnel = await prisma.personnel.update({
      where: { id: personnelId },
      data: {
        onboardingStatus: 'Offboarding',
        offboardingDate: new Date(),
        offboardingReason: reason,
      },
      include: {
        user: true,
      },
    });

    // Deactivate user
    await prisma.user.update({
      where: { id: personnel.userId },
      data: {
        active: false,
        endDate: new Date(),
      },
    });

    // Trigger access review
    await this.createAccessReview({
      personnelId,
      reviewType: 'Offboarding',
      reviewerId: userId,
      organizationId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'personnel.offboarding.started',
      resourceType: 'Personnel',
      resourceId: personnelId,
      metadata: { reason },
    });

    return personnel;
  }

  /**
   * Create access review
   */
  async createAccessReview(data: {
    personnelId: string;
    reviewType: string;
    reviewerId: string;
    organizationId: string;
    dueDate: Date;
    scope?: any;
  }) {
    const review = await prisma.accessReview.create({
      data: {
        personnelId: data.personnelId,
        reviewType: data.reviewType,
        reviewerId: data.reviewerId,
        organizationId: data.organizationId,
        dueDate: data.dueDate,
        scope: data.scope || {},
        status: 'Pending',
      },
      include: {
        personnel: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
    });

    await AuditLogger.log({
      userId: data.reviewerId,
      organizationId: data.organizationId,
      action: 'access_review.created',
      resourceType: 'AccessReview',
      resourceId: review.id,
      metadata: { reviewType: data.reviewType },
    });

    return review;
  }

  /**
   * Complete access review
   */
  async completeAccessReview(
    reviewId: string,
    data: {
      findings: any;
      accessChanges: any;
      approved: boolean;
    },
    userId: string,
    organizationId: string
  ) {
    const review = await prisma.accessReview.update({
      where: { id: reviewId },
      data: {
        status: 'Completed',
        completedAt: new Date(),
        findings: data.findings,
        accessChanges: data.accessChanges,
      },
      include: {
        personnel: {
          include: {
            user: true,
          },
        },
      },
    });

    // Apply access changes to personnel record
    if (data.accessChanges && data.approved) {
      await prisma.personnel.update({
        where: { id: review.personnelId },
        data: {
          systemAccess: data.accessChanges.systemAccess,
          dataAccess: data.accessChanges.dataAccess,
          physicalAccess: data.accessChanges.physicalAccess,
        },
      });
    }

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'access_review.completed',
      resourceType: 'AccessReview',
      resourceId: reviewId,
      metadata: {
        approved: data.approved,
        changesApplied: data.approved,
      },
    });

    return review;
  }

  /**
   * Get personnel by organization
   */
  async getPersonnelByOrganization(organizationId: string) {
    return await prisma.personnel.findMany({
      where: { organizationId },
      include: {
        user: true,
        accessReviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { onboardingDate: 'desc' },
    });
  }

  /**
   * Get pending access reviews
   */
  async getPendingAccessReviews(organizationId: string, reviewerId?: string) {
    return await prisma.accessReview.findMany({
      where: {
        organizationId,
        status: 'Pending',
        ...(reviewerId && { reviewerId }),
      },
      include: {
        personnel: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get overdue access reviews
   */
  async getOverdueAccessReviews(organizationId: string) {
    const now = new Date();

    return await prisma.accessReview.findMany({
      where: {
        organizationId,
        status: 'Pending',
        dueDate: { lt: now },
      },
      include: {
        personnel: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Update personnel access
   */
  async updatePersonnelAccess(
    personnelId: string,
    access: {
      systemAccess?: any;
      dataAccess?: any;
      physicalAccess?: any;
    },
    userId: string,
    organizationId: string
  ) {
    const personnel = await prisma.personnel.update({
      where: { id: personnelId },
      data: {
        systemAccess: access.systemAccess,
        dataAccess: access.dataAccess,
        physicalAccess: access.physicalAccess,
      },
      include: {
        user: true,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'personnel.access.updated',
      resourceType: 'Personnel',
      resourceId: personnelId,
      metadata: { accessUpdate: access },
    });

    return personnel;
  }

  /**
   * Update compliance training status
   */
  async updateTrainingStatus(
    personnelId: string,
    trainingCompleted: boolean,
    userId: string,
    organizationId: string
  ) {
    const personnel = await prisma.personnel.update({
      where: { id: personnelId },
      data: {
        securityTraining: trainingCompleted,
        trainingDate: trainingCompleted ? new Date() : null,
      },
      include: {
        user: true,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'personnel.training.updated',
      resourceType: 'Personnel',
      resourceId: personnelId,
      metadata: { completed: trainingCompleted },
    });

    return personnel;
  }

  /**
   * Get personnel compliance summary
   */
  async getComplianceSummary(organizationId: string) {
    const personnel = await prisma.personnel.findMany({
      where: { organizationId },
      include: {
        user: true,
      },
    });

    const summary = {
      total: personnel.length,
      active: personnel.filter((p) => {
        return p.onboardingStatus === 'Completed';
      }).length,
      pendingOnboarding: personnel.filter((p) => {
        return p.onboardingStatus === 'In_Progress';
      }).length,
      offboarding: personnel.filter((p) => {
        return p.onboardingStatus === 'Offboarding';
      }).length,
      backgroundChecksCompleted: personnel.filter((p) => p.backgroundCheck)
        .length,
      securityTrainingCompleted: personnel.filter((p) => p.securityTraining)
        .length,
      complianceRate:
        personnel.length > 0
          ? Math.round(
              (personnel.filter((p) => p.backgroundCheck && p.securityTraining)
                .length /
                personnel.length) *
                100
            )
          : 0,
    };

    return summary;
  }
}

export default new PersonnelService();
