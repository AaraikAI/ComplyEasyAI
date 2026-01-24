/**
 * Examples: Using New Pages Models (Learn, Community, Status)
 * 
 * This file demonstrates how to use the new Prisma models for:
 * - Learn Page (Courses, Tutorials, Webinars, Certifications)
 * - Community Page (Forum, Events, Resources)
 * - Status Page (Service Status, Incidents, Maintenance)
 */

import prisma from '../config/database';
import { EnrollmentStatus, ForumPostStatus, ServiceStatusType, IncidentSeverity } from '@prisma/client';
import logger from '../config/logger';

// ============================================
// LEARN PAGE EXAMPLES
// ============================================

/**
 * Example 1: Create a course enrollment
 */
export async function createCourseEnrollment(userId: string, courseId: string) {
  try {
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.enrolled, // Using enum
        progress: 0,
        completedLessons: [],
      },
      include: {
        course: {
          select: {
            title: true,
            category: true,
            durationMinutes: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Course enrollment created: ${enrollment.id}`);
    return enrollment;
  } catch (error: any) {
    logger.error('Error creating course enrollment:', error);
    throw error;
  }
}

/**
 * Example 2: Update course progress
 */
export async function updateCourseProgress(
  enrollmentId: string,
  lessonId: string,
  progress: number
) {
  try {
    const enrollment = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        completedLessons: {
          push: lessonId, // Add lesson to completed array
        },
        currentLessonId: lessonId,
        lastAccessedAt: new Date(),
        status: progress === 100 ? EnrollmentStatus.completed : EnrollmentStatus.in_progress,
      },
    });

    return enrollment;
  } catch (error: any) {
    logger.error('Error updating course progress:', error);
    throw error;
  }
}

/**
 * Example 3: Register for a webinar
 */
export async function registerForWebinar(
  webinarId: string,
  userId: string | null,
  email: string,
  name: string
) {
  try {
    const registration = await prisma.webinarRegistration.create({
      data: {
        webinarId,
        userId,
        email,
        name,
        attended: false,
      },
      include: {
        webinar: {
          select: {
            title: true,
            scheduledAt: true,
            meetingUrl: true,
          },
        },
      },
    });

    // Update webinar registration count
    await prisma.webinar.update({
      where: { id: webinarId },
      data: {
        registrationCount: {
          increment: 1,
        },
      },
    });

    return registration;
  } catch (error: any) {
    logger.error('Error registering for webinar:', error);
    throw error;
  }
}

/**
 * Example 4: Get user's certifications
 */
export async function getUserCertifications(userId: string) {
  try {
    const certifications = await prisma.userCertification.findMany({
      where: {
        userId,
        status: {
          in: ['passed', 'in_progress'], // Filter active certifications
        },
      },
      include: {
        certification: {
          select: {
            name: true,
            category: true,
            badgeUrl: true,
            validityMonths: true,
          },
        },
      },
      orderBy: {
        passedAt: 'desc',
      },
    });

    return certifications;
  } catch (error: any) {
    logger.error('Error fetching user certifications:', error);
    throw error;
  }
}

// ============================================
// COMMUNITY PAGE EXAMPLES
// ============================================

/**
 * Example 5: Create a forum post
 */
export async function createForumPost(
  categoryId: string,
  authorId: string,
  title: string,
  content: string,
  tags: string[] = []
) {
  try {
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const post = await prisma.forumPost.create({
      data: {
        categoryId,
        authorId,
        title,
        slug,
        content,
        status: ForumPostStatus.published,
        tags,
        isPinned: false,
        isSolved: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update category post count
    await prisma.forumCategory.update({
      where: { id: categoryId },
      data: {
        postCount: {
          increment: 1,
        },
      },
    });

    return post;
  } catch (error: any) {
    logger.error('Error creating forum post:', error);
    throw error;
  }
}

/**
 * Example 6: Add a comment to a forum post
 */
export async function addForumComment(
  postId: string,
  authorId: string,
  content: string,
  parentCommentId?: string
) {
  try {
    const comment = await prisma.forumComment.create({
      data: {
        postId,
        authorId,
        parentCommentId,
        content,
        isAcceptedAnswer: false,
        likeCount: 0,
        isEdited: false,
        isHidden: false,
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update post comment count
    await prisma.forumPost.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
        lastActivityAt: new Date(),
      },
    });

    return comment;
  } catch (error: any) {
    logger.error('Error adding forum comment:', error);
    throw error;
  }
}

/**
 * Example 7: Vote on a forum post or comment
 */
export async function voteOnForumContent(
  userId: string,
  postId?: string,
  commentId?: string,
  voteType: number = 1 // 1 for upvote, -1 for downvote
) {
  try {
    if (!postId && !commentId) {
      throw new Error('Either postId or commentId must be provided');
    }

    const vote = await prisma.forumVote.upsert({
      where: postId
        ? { userId_postId: { userId, postId } }
        : { userId_commentId: { userId, commentId: commentId! } },
      create: {
        userId,
        postId,
        commentId,
        voteType,
      },
      update: {
        voteType, // Update existing vote
      },
    });

    // Update like count on post or comment
    if (postId) {
      await prisma.forumPost.update({
        where: { id: postId },
        data: {
          likeCount: {
            increment: voteType,
          },
        },
      });
    } else if (commentId) {
      await prisma.forumComment.update({
        where: { id: commentId },
        data: {
          likeCount: {
            increment: voteType,
          },
        },
      });
    }

    return vote;
  } catch (error: any) {
    logger.error('Error voting on forum content:', error);
    throw error;
  }
}

/**
 * Example 8: Share a resource
 */
export async function shareResource(
  authorId: string,
  title: string,
  description: string,
  resourceType: string,
  fileUrl?: string,
  externalUrl?: string
) {
  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const resource = await prisma.sharedResource.create({
      data: {
        authorId,
        title,
        slug,
        description,
        resourceType: resourceType as any, // Cast to ResourceType enum
        fileUrl,
        externalUrl,
        downloadCount: 0,
        viewCount: 0,
        likeCount: 0,
        rating: 0,
        reviewCount: 0,
        isFeatured: false,
        isVerified: false,
        isPublished: true,
        tags: [],
        compatibility: [],
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update user contribution points
    await updateUserContribution(authorId, 'resource_shared', 10, resource.id, 'resource');

    return resource;
  } catch (error: any) {
    logger.error('Error sharing resource:', error);
    throw error;
  }
}

/**
 * Example 9: Update user contribution points
 */
export async function updateUserContribution(
  userId: string,
  activityType: string,
  points: number,
  referenceId?: string,
  referenceType?: string
) {
  try {
    // Create or update user contribution record
    const contribution = await prisma.userContribution.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: points,
        forumPosts: activityType === 'post_created' ? 1 : 0,
        forumComments: activityType === 'comment_added' ? 1 : 0,
        acceptedAnswers: activityType === 'answer_accepted' ? 1 : 0,
        resourcesShared: activityType === 'resource_shared' ? 1 : 0,
        eventsAttended: activityType === 'event_attended' ? 1 : 0,
        helpfulVotes: activityType === 'helpful_vote' ? 1 : 0,
        lastActivityAt: new Date(),
      },
      update: {
        totalPoints: {
          increment: points,
        },
        forumPosts: activityType === 'post_created' ? { increment: 1 } : undefined,
        forumComments: activityType === 'comment_added' ? { increment: 1 } : undefined,
        acceptedAnswers: activityType === 'answer_accepted' ? { increment: 1 } : undefined,
        resourcesShared: activityType === 'resource_shared' ? { increment: 1 } : undefined,
        eventsAttended: activityType === 'event_attended' ? { increment: 1 } : undefined,
        helpfulVotes: activityType === 'helpful_vote' ? { increment: 1 } : undefined,
        lastActivityAt: new Date(),
      },
    });

    // Log the activity
    await prisma.contributionActivity.create({
      data: {
        userId,
        activityType,
        points,
        referenceId,
        referenceType,
        description: `${activityType} - ${points} points`,
      },
    });

    return contribution;
  } catch (error: any) {
    logger.error('Error updating user contribution:', error);
    throw error;
  }
}

// ============================================
// STATUS PAGE EXAMPLES
// ============================================

/**
 * Example 10: Update service status
 */
export async function updateServiceStatus(
  serviceId: string,
  status: ServiceStatusType,
  uptimePercent?: number,
  responseTimeMs?: number
) {
  try {
    const service = await prisma.serviceStatus.update({
      where: { id: serviceId },
      data: {
        status,
        uptimePercent,
        responseTimeMs,
        lastHealthCheck: new Date(),
      },
    });

    // Record status history (for 90-day chart)
    await prisma.statusHistory.upsert({
      where: {
        serviceId_date: {
          serviceId,
          date: new Date(),
        },
      },
      create: {
        serviceId,
        status,
        uptimePercent,
        responseTimeMs,
        date: new Date(),
      },
      update: {
        status,
        uptimePercent,
        responseTimeMs,
      },
    });

    return service;
  } catch (error: any) {
    logger.error('Error updating service status:', error);
    throw error;
  }
}

/**
 * Example 11: Create an incident
 */
export async function createIncident(
  title: string,
  severity: IncidentSeverity,
  description: string,
  affectedServices: string[],
  createdBy: string
) {
  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const incident = await prisma.incident.create({
      data: {
        title,
        slug,
        severity,
        status: 'investigating', // Using string literal (enum value)
        description,
        affectedServices,
        startedAt: new Date(),
        isPublic: true,
        notificationsSent: false,
        createdBy,
      },
    });

    // Create initial update
    await prisma.incidentUpdate.create({
      data: {
        incidentId: incident.id,
        status: 'investigating',
        message: 'Incident created. Investigation in progress.',
        isInternal: false,
        createdBy,
      },
    });

    // Update affected services
    await prisma.serviceStatus.updateMany({
      where: {
        id: {
          in: affectedServices,
        },
      },
      data: {
        status: severity === 'critical' ? 'major_outage' : 'degraded_performance',
        lastIncidentAt: new Date(),
      },
    });

    return incident;
  } catch (error: any) {
    logger.error('Error creating incident:', error);
    throw error;
  }
}

/**
 * Example 12: Add incident update
 */
export async function addIncidentUpdate(
  incidentId: string,
  status: string,
  message: string,
  createdBy: string,
  isInternal: boolean = false
) {
  try {
    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId,
        status: status as any,
        message,
        isInternal,
        createdBy,
      },
    });

    // Update incident status if changed
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: status as any,
        ...(status === 'resolved' && { resolvedAt: new Date() }),
        ...(status === 'identified' && { identifiedAt: new Date() }),
      },
    });

    return update;
  } catch (error: any) {
    logger.error('Error adding incident update:', error);
    throw error;
  }
}

/**
 * Example 13: Create maintenance window
 */
export async function createMaintenanceWindow(
  title: string,
  description: string,
  affectedServices: string[],
  scheduledStart: Date,
  scheduledEnd: Date,
  createdBy: string
) {
  try {
    const maintenance = await prisma.maintenanceWindow.create({
      data: {
        title,
        description,
        affectedServices,
        status: 'scheduled',
        scheduledStart,
        scheduledEnd,
        notificationsSent: false,
        reminderSent: false,
        createdBy,
      },
    });

    return maintenance;
  } catch (error: any) {
    logger.error('Error creating maintenance window:', error);
    throw error;
  }
}

/**
 * Example 14: Subscribe to status updates
 */
export async function subscribeToStatusUpdates(
  email: string,
  userId: string | null,
  services: string[] = [],
  notifyIncidents: boolean = true,
  notifyMaintenance: boolean = true
) {
  try {
    const unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    const subscription = await prisma.statusSubscription.create({
      data: {
        email,
        userId,
        services,
        notifyIncidents,
        notifyMaintenance,
        notifyResolutions: true,
        isVerified: false,
        verificationToken,
        unsubscribeToken,
      },
    });

    // TODO: Send verification email with verificationToken

    return subscription;
  } catch (error: any) {
    logger.error('Error creating status subscription:', error);
    throw error;
  }
}

// ============================================
// QUERY EXAMPLES
// ============================================

/**
 * Example 15: Get featured courses
 */
export async function getFeaturedCourses(limit: number = 8) {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
      },
      take: limit,
      orderBy: {
        enrollmentCount: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        thumbnailUrl: true,
        category: true,
        level: true,
        durationMinutes: true,
        rating: true,
        reviewCount: true,
        enrollmentCount: true,
        isFree: true,
        price: true,
      },
    });

    return courses;
  } catch (error: any) {
    logger.error('Error fetching featured courses:', error);
    throw error;
  }
}

/**
 * Example 16: Get forum posts with pagination
 */
export async function getForumPosts(
  categoryId?: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where: {
          ...(categoryId && { categoryId }),
          status: 'published',
        },
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { lastActivityAt: 'desc' },
        ],
        include: {
          author: {
            select: {
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.forumPost.count({
        where: {
          ...(categoryId && { categoryId }),
          status: 'published',
        },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error('Error fetching forum posts:', error);
    throw error;
  }
}

/**
 * Example 17: Get service status with 90-day history
 */
export async function getServiceStatusWithHistory(serviceId: string) {
  try {
    const [service, history] = await Promise.all([
      prisma.serviceStatus.findUnique({
        where: { id: serviceId },
      }),
      prisma.statusHistory.findMany({
        where: {
          serviceId,
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
        orderBy: {
          date: 'asc',
        },
      }),
    ]);

    return {
      service,
      history,
    };
  } catch (error: any) {
    logger.error('Error fetching service status:', error);
    throw error;
  }
}
