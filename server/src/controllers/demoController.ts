/**
 * Demo Request Controller
 *
 * Handles demo booking requests, lead capture, and welcome email automation.
 * Integrates with webhooks/Zapier for email automation.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import webhookService from '../services/webhookService';
import emailService from '../services/emailService';
import { DemoRequestStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface DemoRequestInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle?: string;
  phone?: string;
  companySize?: string;
  industry?: string;
  country?: string;
  interestedTier?: string;
  currentChallenge?: string;
  howDidYouHear?: string;
  message?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ============================================================================
// CONTROLLER
// ============================================================================

class DemoController {
  /**
   * Submit a demo request (public endpoint)
   */
  async submitDemoRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const input: DemoRequestInput = req.body;

      // Validate required fields
      if (!input.firstName || !input.lastName || !input.email || !input.company) {
        throw new AppError('First name, last name, email, and company are required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new AppError('Invalid email format', 400);
      }

      // Check for duplicate request in last 24 hours
      const existingRequest = await prisma.demoRequest.findFirst({
        where: {
          email: input.email.toLowerCase(),
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingRequest) {
        throw new AppError('A demo request with this email was already submitted recently', 409);
      }

      // Get request metadata
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const referrer = req.headers.referer || req.headers.referrer || '';

      // Create demo request
      const demoRequest = await prisma.demoRequest.create({
        data: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.toLowerCase().trim(),
          company: input.company.trim(),
          jobTitle: input.jobTitle?.trim(),
          phone: input.phone?.trim(),
          companySize: input.companySize,
          industry: input.industry,
          country: input.country,
          interestedTier: input.interestedTier,
          currentChallenge: input.currentChallenge?.trim(),
          howDidYouHear: input.howDidYouHear,
          message: input.message?.trim(),
          source: input.source || 'pricing_page',
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          ipAddress,
          userAgent,
          referrer: referrer as string,
          status: 'pending',
        },
      });

      logger.info(`Demo request submitted: ${demoRequest.email} (${demoRequest.company})`);

      // Send email notification to contact@complyeasyai.com
      await this.sendDemoRequestEmail(demoRequest);

      // Dispatch webhook event for welcome email automation
      await this.dispatchWelcomeEmail(demoRequest);

      // Dispatch webhook event for new demo request notification
      await this.dispatchDemoRequestNotification(demoRequest);

      res.status(201).json({
        success: true,
        message: 'Demo request submitted successfully! We\'ll be in touch soon.',
        requestId: demoRequest.id,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all demo requests (admin only)
   */
  async getAllDemoRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        status,
        tier,
        startDate,
        endDate,
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (tier) {
        where.interestedTier = tier;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [demoRequests, total] = await Promise.all([
        prisma.demoRequest.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy as string]: sortOrder },
        }),
        prisma.demoRequest.count({ where }),
      ]);

      res.json({
        demoRequests,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          pages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single demo request (admin only)
   */
  async getDemoRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
      });

      if (!demoRequest) {
        throw new AppError('Demo request not found', 404);
      }

      res.json({ demoRequest });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update demo request status (admin only)
   */
  async updateDemoRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, scheduledAt, assignedTo, notes } = req.body;

      const existing = await prisma.demoRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Demo request not found', 404);
      }

      const updateData: any = {};

      if (status) {
        updateData.status = status as DemoRequestStatus;

        // Set completedAt if status is completed
        if (status === 'completed' && !existing.completedAt) {
          updateData.completedAt = new Date();
        }
      }

      if (scheduledAt !== undefined) {
        updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      }

      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const demoRequest = await prisma.demoRequest.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Demo request updated: ${id} - Status: ${status}`);

      // Dispatch status change webhook
      await this.dispatchStatusChangeWebhook(demoRequest, existing.status);

      res.json({ demoRequest });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule a demo (admin only)
   */
  async scheduleDemo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { scheduledAt, assignedTo, sendConfirmation = true } = req.body;

      if (!scheduledAt) {
        throw new AppError('Scheduled date/time is required', 400);
      }

      const existing = await prisma.demoRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Demo request not found', 404);
      }

      const demoRequest = await prisma.demoRequest.update({
        where: { id },
        data: {
          status: 'scheduled',
          scheduledAt: new Date(scheduledAt),
          assignedTo,
        },
      });

      logger.info(`Demo scheduled for ${demoRequest.email} at ${scheduledAt}`);

      // Send confirmation email via webhook
      if (sendConfirmation) {
        await this.dispatchScheduleConfirmation(demoRequest);
      }

      res.json({
        success: true,
        message: 'Demo scheduled successfully',
        demoRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark demo as converted (admin only)
   */
  async markAsConverted(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const existing = await prisma.demoRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Demo request not found', 404);
      }

      const demoRequest = await prisma.demoRequest.update({
        where: { id },
        data: {
          status: 'converted',
          convertedToUserId: userId,
          convertedAt: new Date(),
        },
      });

      logger.info(`Demo request converted: ${id} -> User ${userId}`);

      // Dispatch conversion webhook
      await this.dispatchConversionWebhook(demoRequest);

      res.json({
        success: true,
        message: 'Demo request marked as converted',
        demoRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get demo request statistics (admin only)
   */
  async getDemoStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      // Get counts by status
      const statusCounts = await prisma.demoRequest.groupBy({
        by: ['status'],
        _count: true,
        where,
      });

      // Get counts by tier interest
      const tierCounts = await prisma.demoRequest.groupBy({
        by: ['interestedTier'],
        _count: true,
        where,
      });

      // Get counts by source
      const sourceCounts = await prisma.demoRequest.groupBy({
        by: ['source'],
        _count: true,
        where,
      });

      // Get total and daily counts
      const total = await prisma.demoRequest.count({ where });

      // Get counts for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dailyCounts = await prisma.demoRequest.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Calculate conversion rate
      const convertedCount = statusCounts.find(s => s.status === 'converted')?._count || 0;
      const conversionRate = total > 0 ? (convertedCount / total * 100).toFixed(2) : 0;

      res.json({
        total,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        tierBreakdown: tierCounts.reduce((acc, item) => {
          if (item.interestedTier) {
            acc[item.interestedTier] = item._count;
          }
          return acc;
        }, {} as Record<string, number>),
        sourceBreakdown: sourceCounts.reduce((acc, item) => {
          if (item.source) {
            acc[item.source] = item._count;
          }
          return acc;
        }, {} as Record<string, number>),
        conversionRate: `${conversionRate}%`,
        recentTrend: dailyCounts.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a demo request (admin only)
   */
  async deleteDemoRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.demoRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Demo request not found', 404);
      }

      await prisma.demoRequest.delete({
        where: { id },
      });

      logger.info(`Demo request deleted: ${id}`);

      res.json({
        success: true,
        message: 'Demo request deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // EMAIL NOTIFICATIONS
  // ============================================================================

  /**
   * Send demo request notification email to contact@complyeasyai.com
   */
  private async sendDemoRequestEmail(demoRequest: any) {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
            .label { font-weight: bold; color: #0284c7; }
            .value { color: #333; margin-top: 5px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Demo Request</h1>
            </div>
            <div class="content">
              <p><strong>A new demo request has been submitted:</strong></p>
              
              <div class="info-row">
                <div class="label">Name:</div>
                <div class="value">${demoRequest.firstName} ${demoRequest.lastName}</div>
              </div>
              
              <div class="info-row">
                <div class="label">Email:</div>
                <div class="value">${demoRequest.email}</div>
              </div>
              
              <div class="info-row">
                <div class="label">Company:</div>
                <div class="value">${demoRequest.company}</div>
              </div>
              
              ${demoRequest.jobTitle ? `
              <div class="info-row">
                <div class="label">Job Title:</div>
                <div class="value">${demoRequest.jobTitle}</div>
              </div>
              ` : ''}
              
              ${demoRequest.phone ? `
              <div class="info-row">
                <div class="label">Phone:</div>
                <div class="value">${demoRequest.phone}</div>
              </div>
              ` : ''}
              
              ${demoRequest.companySize ? `
              <div class="info-row">
                <div class="label">Company Size:</div>
                <div class="value">${demoRequest.companySize}</div>
              </div>
              ` : ''}
              
              ${demoRequest.industry ? `
              <div class="info-row">
                <div class="label">Industry:</div>
                <div class="value">${demoRequest.industry}</div>
              </div>
              ` : ''}
              
              ${demoRequest.country ? `
              <div class="info-row">
                <div class="label">Country:</div>
                <div class="value">${demoRequest.country}</div>
              </div>
              ` : ''}
              
              ${demoRequest.interestedTier ? `
              <div class="info-row">
                <div class="label">Interested Plan:</div>
                <div class="value">${demoRequest.interestedTier}</div>
              </div>
              ` : ''}
              
              ${demoRequest.currentChallenge ? `
              <div class="info-row">
                <div class="label">Main Challenge:</div>
                <div class="value">${demoRequest.currentChallenge}</div>
              </div>
              ` : ''}
              
              ${demoRequest.howDidYouHear ? `
              <div class="info-row">
                <div class="label">How did they hear about us:</div>
                <div class="value">${demoRequest.howDidYouHear}</div>
              </div>
              ` : ''}
              
              ${demoRequest.message ? `
              <div class="info-row">
                <div class="label">Additional Message:</div>
                <div class="value">${demoRequest.message}</div>
              </div>
              ` : ''}
              
              <div class="info-row">
                <div class="label">Source:</div>
                <div class="value">${demoRequest.source || 'Unknown'}</div>
              </div>
              
              <div class="info-row">
                <div class="label">Request ID:</div>
                <div class="value">${demoRequest.id}</div>
              </div>
              
              <div class="info-row">
                <div class="label">Submitted At:</div>
                <div class="value">${new Date(demoRequest.createdAt).toLocaleString()}</div>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from ComplyEasyAI.</p>
                <p>Please respond to this demo request within 24 hours.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: 'contact@complyeasyai.com',
        subject: `New Demo Request: ${demoRequest.firstName} ${demoRequest.lastName} from ${demoRequest.company}`,
        html: emailHtml,
        text: `
New Demo Request

Name: ${demoRequest.firstName} ${demoRequest.lastName}
Email: ${demoRequest.email}
Company: ${demoRequest.company}
${demoRequest.jobTitle ? `Job Title: ${demoRequest.jobTitle}` : ''}
${demoRequest.phone ? `Phone: ${demoRequest.phone}` : ''}
${demoRequest.companySize ? `Company Size: ${demoRequest.companySize}` : ''}
${demoRequest.industry ? `Industry: ${demoRequest.industry}` : ''}
${demoRequest.country ? `Country: ${demoRequest.country}` : ''}
${demoRequest.interestedTier ? `Interested Plan: ${demoRequest.interestedTier}` : ''}
${demoRequest.currentChallenge ? `Main Challenge: ${demoRequest.currentChallenge}` : ''}
${demoRequest.howDidYouHear ? `How did they hear about us: ${demoRequest.howDidYouHear}` : ''}
${demoRequest.message ? `Additional Message: ${demoRequest.message}` : ''}
Source: ${demoRequest.source || 'Unknown'}
Request ID: ${demoRequest.id}
Submitted At: ${new Date(demoRequest.createdAt).toLocaleString()}
        `.trim(),
      });

      logger.info(`Demo request email sent to contact@complyeasyai.com for ${demoRequest.email}`);
    } catch (error: any) {
      logger.error('Failed to send demo request email', error);
      // Log detailed error for debugging
      if (error.message) {
        logger.error(`Email error details: ${error.message}`);
      }
      // Don't throw - this is a non-critical operation, but log it for admin awareness
      // The demo request is still saved successfully
    }
  }

  // ============================================================================
  // WEBHOOK DISPATCHERS
  // ============================================================================

  /**
   * Dispatch welcome email webhook
   */
  private async dispatchWelcomeEmail(demoRequest: any) {
    try {
      // Dispatch to all organizations that have webhooks subscribed to demo.request.welcome
      // For now, we'll dispatch a global webhook event
      const webhookPayload = {
        eventType: 'demo.request.welcome',
        timestamp: new Date().toISOString(),
        data: {
          id: demoRequest.id,
          firstName: demoRequest.firstName,
          lastName: demoRequest.lastName,
          fullName: `${demoRequest.firstName} ${demoRequest.lastName}`,
          email: demoRequest.email,
          company: demoRequest.company,
          jobTitle: demoRequest.jobTitle,
          interestedTier: demoRequest.interestedTier,
          source: demoRequest.source,
        },
      };

      // Find all organizations with webhooks subscribed to demo events
      const webhooks = await prisma.webhook.findMany({
        where: {
          enabled: true,
          events: {
            has: 'demo.request.welcome',
          },
        },
      });

      for (const webhook of webhooks) {
        await webhookService.dispatchEvent(
          webhook.organizationId,
          'demo.request.welcome',
          webhookPayload.data
        );
      }

      // Update the demo request to mark welcome email as sent
      await prisma.demoRequest.update({
        where: { id: demoRequest.id },
        data: { welcomeEmailSentAt: new Date() },
      });

      logger.info(`Welcome email webhook dispatched for ${demoRequest.email}`);
    } catch (error) {
      logger.error('Failed to dispatch welcome email webhook', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Dispatch new demo request notification webhook
   */
  private async dispatchDemoRequestNotification(demoRequest: any) {
    try {
      const webhookPayload = {
        eventType: 'demo.request.new',
        timestamp: new Date().toISOString(),
        data: {
          id: demoRequest.id,
          firstName: demoRequest.firstName,
          lastName: demoRequest.lastName,
          fullName: `${demoRequest.firstName} ${demoRequest.lastName}`,
          email: demoRequest.email,
          company: demoRequest.company,
          jobTitle: demoRequest.jobTitle,
          phone: demoRequest.phone,
          companySize: demoRequest.companySize,
          industry: demoRequest.industry,
          interestedTier: demoRequest.interestedTier,
          currentChallenge: demoRequest.currentChallenge,
          message: demoRequest.message,
          source: demoRequest.source,
          createdAt: demoRequest.createdAt,
        },
      };

      const webhooks = await prisma.webhook.findMany({
        where: {
          enabled: true,
          events: {
            has: 'demo.request.new',
          },
        },
      });

      for (const webhook of webhooks) {
        await webhookService.dispatchEvent(
          webhook.organizationId,
          'demo.request.new',
          webhookPayload.data
        );
      }

      logger.info(`Demo request notification webhook dispatched for ${demoRequest.email}`);
    } catch (error) {
      logger.error('Failed to dispatch demo request notification webhook', error);
    }
  }

  /**
   * Dispatch status change webhook
   */
  private async dispatchStatusChangeWebhook(demoRequest: any, previousStatus: string) {
    try {
      const webhookPayload = {
        eventType: 'demo.request.status_changed',
        timestamp: new Date().toISOString(),
        data: {
          id: demoRequest.id,
          email: demoRequest.email,
          company: demoRequest.company,
          previousStatus,
          newStatus: demoRequest.status,
          scheduledAt: demoRequest.scheduledAt,
          assignedTo: demoRequest.assignedTo,
        },
      };

      const webhooks = await prisma.webhook.findMany({
        where: {
          enabled: true,
          events: {
            has: 'demo.request.status_changed',
          },
        },
      });

      for (const webhook of webhooks) {
        await webhookService.dispatchEvent(
          webhook.organizationId,
          'demo.request.status_changed',
          webhookPayload.data
        );
      }
    } catch (error) {
      logger.error('Failed to dispatch status change webhook', error);
    }
  }

  /**
   * Dispatch schedule confirmation webhook
   */
  private async dispatchScheduleConfirmation(demoRequest: any) {
    try {
      const webhookPayload = {
        eventType: 'demo.request.scheduled',
        timestamp: new Date().toISOString(),
        data: {
          id: demoRequest.id,
          firstName: demoRequest.firstName,
          lastName: demoRequest.lastName,
          email: demoRequest.email,
          company: demoRequest.company,
          scheduledAt: demoRequest.scheduledAt,
          assignedTo: demoRequest.assignedTo,
        },
      };

      const webhooks = await prisma.webhook.findMany({
        where: {
          enabled: true,
          events: {
            has: 'demo.request.scheduled',
          },
        },
      });

      for (const webhook of webhooks) {
        await webhookService.dispatchEvent(
          webhook.organizationId,
          'demo.request.scheduled',
          webhookPayload.data
        );
      }

      logger.info(`Schedule confirmation webhook dispatched for ${demoRequest.email}`);
    } catch (error) {
      logger.error('Failed to dispatch schedule confirmation webhook', error);
    }
  }

  /**
   * Dispatch conversion webhook
   */
  private async dispatchConversionWebhook(demoRequest: any) {
    try {
      const webhookPayload = {
        eventType: 'demo.request.converted',
        timestamp: new Date().toISOString(),
        data: {
          id: demoRequest.id,
          email: demoRequest.email,
          company: demoRequest.company,
          convertedToUserId: demoRequest.convertedToUserId,
          convertedAt: demoRequest.convertedAt,
          interestedTier: demoRequest.interestedTier,
          source: demoRequest.source,
        },
      };

      const webhooks = await prisma.webhook.findMany({
        where: {
          enabled: true,
          events: {
            has: 'demo.request.converted',
          },
        },
      });

      for (const webhook of webhooks) {
        await webhookService.dispatchEvent(
          webhook.organizationId,
          'demo.request.converted',
          webhookPayload.data
        );
      }

      logger.info(`Conversion webhook dispatched for ${demoRequest.email}`);
    } catch (error) {
      logger.error('Failed to dispatch conversion webhook', error);
    }
  }
}

export const demoController = new DemoController();
export default demoController;
