import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { ComplianceStatus } from '../generated/prisma/client';
import controlTemplatesService from '../services/euRegulations/controlTemplatesService';

// FrameworkType enum values - matching frontend types.ts
enum FrameworkType {
  SOC2 = 'SOC 2 Type II',
  GDPR = 'GDPR',
  HIPAA = 'HIPAA',
  ISO27001 = 'ISO 27001',
  PCI_DSS = 'PCI DSS',
  CCPA = 'CCPA',
  NIST = 'NIST 800-53',
  EU_AI_ACT = 'EU AI Act',
  DMA = 'Digital Markets Act (DMA)',
  DSA = 'Digital Services Act (DSA)'
}

class FrameworksController {
  // Sanitize input to prevent XSS
  private sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return input || '';
    // Remove script tags and event handlers while preserving Unicode
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<object/gi, '&lt;object')
      .replace(/<embed/gi, '&lt;embed')
      .trim();
  }

  list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId },
        include: {
          controls: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(frameworks);
    } catch (error) {
      logger.error('List frameworks error', error);
      throw new AppError('Failed to fetch frameworks', 500);
    }
  };

  getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;
      const { search, page = '1', limit = '50' } = req.query;

      const framework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Build controls query with search and pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      const controlsWhere: any = { frameworkId: id };
      if (search && typeof search === 'string') {
        controlsWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [controls, totalControls] = await Promise.all([
        prisma.frameworkControl.findMany({
          where: controlsWhere,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.frameworkControl.count({ where: controlsWhere }),
      ]);

      res.json({
        ...framework,
        controls,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalControls,
          totalPages: Math.ceil(totalControls / limitNum),
        },
      });
    } catch (error) {
      logger.error('Get framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch framework', 500);
    }
  };

  create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { name, region, nextAuditDate, notes } = req.body;

      if (!name || !nextAuditDate) {
        throw new AppError('Name and next audit date are required', 400);
      }

      // Sanitize inputs to prevent XSS
      const sanitizedName = this.sanitizeInput(name);
      const sanitizedRegion = region ? this.sanitizeInput(region) : null;
      const sanitizedNotes = notes ? this.sanitizeInput(notes) : null;

      const framework = await prisma.complianceFramework.create({
        data: {
          name: sanitizedName,
          region: sanitizedRegion,
          nextAuditDate: new Date(nextAuditDate),
          notes: sanitizedNotes,
          version: 1,
          lastModifiedBy: authReq.user!.id,
          organizationId,
        },
      });

      // Auto-create controls for EU regulations frameworks
      const euFrameworkTypes = [FrameworkType.EU_AI_ACT, FrameworkType.DMA, FrameworkType.DSA];
      if (euFrameworkTypes.includes(sanitizedName as FrameworkType)) {
        try {
          const controlTemplates = controlTemplatesService.getControlsForFramework(sanitizedName);
          const controlsCreated = await Promise.all(
            controlTemplates.map(template =>
              prisma.frameworkControl.create({
                data: {
                  frameworkId: framework.id,
                  name: template.name,
                  description: template.description,
                  category: template.category,
                  evidenceRequired: template.evidenceRequired,
                  status: template.status,
                  mappedControls: template.mappedControls,
                },
              })
            )
          );
          logger.info(`Auto-created ${controlsCreated.length} controls for EU framework: ${sanitizedName}`, {
            frameworkId: framework.id,
            organizationId,
          });
        } catch (controlError) {
          logger.error(`Failed to auto-create controls for EU framework: ${sanitizedName}`, controlError);
          // Don't fail framework creation if control creation fails
        }
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Framework Added: ${name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.status(201).json(framework);
      logger.info(`Framework created: ${framework.id}`);
    } catch (error) {
      logger.error('Create framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create framework', 500);
    }
  };

  update: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;
      const updateData = req.body;

      const existingFramework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
      });

      if (!existingFramework) {
        throw new AppError('Framework not found', 404);
      }

      // CONCURRENT EDIT CONFLICT RESOLUTION (ENHANCED with conflict details)
      if (updateData.version !== undefined && updateData.version !== existingFramework.version) {
        // If resolutionStrategy is provided, handle it
        if (updateData.resolutionStrategy === 'overwrite') {
          // Overwrite: proceed with update, ignoring version mismatch
          delete updateData.resolutionStrategy;
          // Continue to update below
        } else if (updateData.resolutionStrategy === 'merge') {
          // Merge: combine existing and new data (simplified merge)
          const mergedData = {
            ...existingFramework,
            ...updateData,
          };
          delete mergedData.resolutionStrategy;
          delete mergedData.version; // Will be incremented below
          Object.assign(updateData, mergedData);
          // Continue to update below
        } else {
          // No resolution strategy: return conflict details for UI
          const lastModifier = existingFramework.lastModifiedBy
            ? await prisma.user.findUnique({
                where: { id: existingFramework.lastModifiedBy },
                select: { id: true, name: true, email: true },
              })
            : null;

          // Return conflict details for UI as a structured response body
          // (rather than serializing JSON into an error message string).
          const conflictDetails = {
            message: 'Framework was modified by another user',
            currentVersion: existingFramework.version,
            submittedVersion: updateData.version,
            lastModifiedBy: lastModifier?.name || lastModifier?.email || 'Unknown',
            lastModifiedAt: existingFramework.lastModifiedAt || existingFramework.updatedAt,
            conflictingFields: this.detectConflictingFields(existingFramework, updateData),
          };

          res.status(409).json({ error: 'conflict', conflict: conflictDetails });
          return;
        }
      }

      // Validate nextAuditDate if being updated
      if (updateData.nextAuditDate) {
        const auditDate = new Date(updateData.nextAuditDate);
        if (isNaN(auditDate.getTime())) {
          throw new AppError('Invalid audit date format', 400);
        }
        // Note: We allow past dates but log a warning
        if (auditDate < new Date()) {
          logger.warn(`Framework ${id} audit date set to past date: ${auditDate.toISOString()}`);
        }
        updateData.nextAuditDate = auditDate;
      }

      // Remove resolutionStrategy from update payload if present
      const { resolutionStrategy, ...cleanUpdateData } = updateData;
      
      // Increment version for concurrent edit tracking
      const updatePayload: any = {
        ...cleanUpdateData,
        version: existingFramework.version + 1,
        lastModifiedBy: authReq.user!.id,
        lastModifiedAt: new Date(),
      };

      const framework = await prisma.complianceFramework.update({
        where: { id },
        data: updatePayload,
      });

      await prisma.auditLog.create({
        data: {
          action: `Framework Updated: ${framework.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json(framework);
    } catch (error) {
      logger.error('Update framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update framework', 500);
    }
  };

  /**
   * Detect conflicting fields between existing and new data
   */
  private detectConflictingFields(existing: any, updateData: any): string[] {
    const conflictingFields: string[] = [];
    const fieldsToCheck = ['name', 'region', 'status', 'notes', 'nextAuditDate'];

    for (const field of fieldsToCheck) {
      if (updateData[field] !== undefined && existing[field] !== updateData[field]) {
        conflictingFields.push(field);
      }
    }

    return conflictingFields;
  }

  /**
   * Resolve conflict with last-write-wins (ENHANCED with notification)
   */
  resolveConflict: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const { resolution, forceUpdate } = req.body; // resolution: 'keep_mine' | 'keep_theirs' | 'merge'
      const organizationId = authReq.user!.organizationId;

      const existingFramework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
      });

      if (!existingFramework) {
        throw new AppError('Framework not found', 404);
      }

      let finalData: any;

      if (resolution === 'keep_mine' || forceUpdate) {
        // Last-write-wins: Use submitted data
        finalData = req.body.updateData || req.body;
        delete finalData.version; // Remove version check for forced update
        finalData.version = existingFramework.version + 1;
        finalData.lastModifiedBy = authReq.user!.id;
        finalData.lastModifiedAt = new Date();
      } else if (resolution === 'keep_theirs') {
        // Keep existing data, just refresh
        finalData = existingFramework;
      } else {
        // Merge: Combine both (simplified - can be enhanced with more sophisticated merge strategies)
        finalData = {
          ...existingFramework,
          ...(req.body.updateData || req.body),
          version: existingFramework.version + 1,
          lastModifiedBy: authReq.user!.id,
          lastModifiedAt: new Date(),
        };
      }

      const framework = await prisma.complianceFramework.update({
        where: { id },
        data: finalData,
      });

      // Send notification to last modifier if different user
      if (existingFramework.lastModifiedBy && existingFramework.lastModifiedBy !== authReq.user!.id) {
        try {
          const notificationService = await import('../services/notificationService');
          if (notificationService.default) {
            await notificationService.default.sendNotification(
              authReq.user!.id,
              organizationId,
              {
                type: 'info',
                category: 'framework.conflict_resolved',
                title: 'Framework Conflict Resolved',
                message: `${authReq.user!.name || authReq.user!.email} resolved a conflict in framework "${framework.name}"`,
                link: `/frameworks/${id}`,
                channels: ['email', 'websocket'],
              }
            );
          }
        } catch (notifError) {
          logger.warn('[Framework] Notification service not available', notifError);
        }
      }

      await prisma.auditLog.create({
        data: {
          action: `Framework Conflict Resolved: ${framework.name}`,
          details: JSON.stringify({ resolution, conflictResolvedBy: authReq.user!.id }),
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json(framework);
    } catch (error) {
      logger.error('Resolve conflict error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to resolve conflict', 500);
    }
  };

  delete: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      const framework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      await prisma.complianceFramework.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          action: `Framework Deleted: ${framework.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ message: 'Framework deleted successfully' });
    } catch (error) {
      logger.error('Delete framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete framework', 500);
    }
  };

  exportControl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId, controlId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Get control
      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId, frameworkId },
      });

      if (!control) {
        throw new AppError('Control not found', 404);
      }

      // Get all related data for the report
      const report = {
        framework: {
          id: framework.id,
          name: framework.name,
          status: framework.status,
          progress: framework.progress,
          nextAuditDate: framework.nextAuditDate,
        },
        control: {
          id: control.id,
          name: control.name,
          description: control.description,
          status: control.status,
          evidence: control.evidence,
          createdAt: control.createdAt,
          updatedAt: control.updatedAt,
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: authReq.user!.id,
          organizationId,
        },
      };

      // Log export action
      await prisma.auditLog.create({
        data: {
          action: `Exported control report: ${control.name} (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json(report);
    } catch (error) {
      logger.error('Export control error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export control report', 500);
    }
  };

  createControl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const { name, description, status, ownerId, category } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!name || typeof name !== 'string' || !name.trim()) {
        throw new AppError('Control name is required', 400);
      }

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Sanitize inputs to prevent XSS
      const sanitizedName = this.sanitizeInput(name);
      const sanitizedDescription = description && typeof description === 'string' ? this.sanitizeInput(description) : null;
      const sanitizedCategory = category && typeof category === 'string' ? this.sanitizeInput(category) : null;

      // Prepare control data - only include description if provided
      const controlData: any = {
        name: sanitizedName,
        status: (status && typeof status === 'string') ? status : 'Pending',
        frameworkId,
      };

      // Only include description if it's provided and not empty
      if (sanitizedDescription) {
        controlData.description = sanitizedDescription;
      }

      if (ownerId && typeof ownerId === 'string') {
        controlData.ownerId = ownerId;
      }

      if (sanitizedCategory) {
        controlData.category = sanitizedCategory;
      }

      const control = await prisma.frameworkControl.create({
        data: controlData,
      });

      // Recalculate framework progress
      await this.recalculateFrameworkProgress(frameworkId, organizationId);

      await prisma.auditLog.create({
        data: {
          action: `Control created: ${name} (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.status(201).json(control);
    } catch (error) {
      logger.error('Create control error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create control: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  };

  updateControl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId, controlId } = req.params;
      const updateData = req.body;
      const organizationId = authReq.user!.organizationId;

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Verify the control belongs to the org-scoped framework before mutating
      const existingControl = await prisma.frameworkControl.findFirst({
        where: { id: controlId, frameworkId },
        select: { ownerId: true, evidenceRequired: true, status: true },
      });

      if (!existingControl) {
        throw new AppError('Control not found', 404);
      }

      // Filter out undefined/null values and only include valid fields
      const cleanUpdateData: any = {};
      if (updateData.status !== undefined) cleanUpdateData.status = updateData.status;
      if (updateData.description !== undefined) cleanUpdateData.description = updateData.description;
      if (updateData.evidence !== undefined) cleanUpdateData.evidence = updateData.evidence;
      if (updateData.evidenceRequired !== undefined) cleanUpdateData.evidenceRequired = Boolean(updateData.evidenceRequired);
      if (updateData.ownerId !== undefined) cleanUpdateData.ownerId = updateData.ownerId || null;
      if (updateData.category !== undefined) cleanUpdateData.category = updateData.category;

      const control = await prisma.frameworkControl.update({
        where: { id: controlId },
        data: cleanUpdateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Recalculate framework progress if status changed
      if (updateData.status) {
        await this.recalculateFrameworkProgress(frameworkId, organizationId);
        
        // Update confidence for all control loops associated with this control
        try {
          const acosService = (await import('../services/advanced/acosService')).default;
          await acosService.updateControlLoopConfidence(controlId, organizationId);
        } catch (acosError) {
          logger.warn('Failed to update control loop confidence', acosError);
          // Don't fail the request if confidence update fails
        }
      }

      // Send notification if owner was assigned/changed
      if (updateData.ownerId && updateData.ownerId !== existingControl?.ownerId) {
        try {
          const notificationService = (await import('../services/notificationService')).default;
          await notificationService.sendNotification(
            updateData.ownerId,
            organizationId,
            {
              type: 'info',
              category: 'compliance',
              title: `Control Assigned: ${control.name}`,
              message: `You have been assigned as the owner of control "${control.name}" in framework "${framework.name}".`,
              link: `/frameworks/${frameworkId}/controls/${controlId}`,
              channels: ['email', 'websocket'],
            }
          );
        } catch (notificationError) {
          logger.warn('Failed to send owner assignment notification', notificationError);
          // Don't fail the request if notification fails
        }
      }

      // Warn if evidence is required but not uploaded when status is updated
      if (updateData.status && control.evidenceRequired && !control.evidence) {
        logger.warn(`Control ${control.id} status updated to ${updateData.status} but evidence is required and not uploaded`);
      }

      // Log status change in audit trail
      const statusChanged = updateData.status && updateData.status !== existingControl.status;
      const auditAction = statusChanged 
        ? `Control status changed: ${control.name} from "${existingControl.status}" to "${updateData.status}" (${framework.name})`
        : `Control updated: ${control.name} (${framework.name})`;

      await prisma.auditLog.create({
        data: {
          action: auditAction,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          metadata: statusChanged ? {
            controlId: control.id,
            controlName: control.name,
            oldStatus: existingControl.status,
            newStatus: updateData.status,
            timestamp: new Date().toISOString(),
          } : undefined,
        },
      });

      res.json(control);
    } catch (error) {
      logger.error('Update control error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update control', 500);
    }
  };

  bulkUpdateControls: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const { controlIds, status, evidenceRequired } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!Array.isArray(controlIds) || controlIds.length === 0) {
        throw new AppError('Control IDs array is required', 400);
      }

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Update only controls that belong to this org-scoped framework
      const updateData: any = { status };
      if (evidenceRequired !== undefined) {
        updateData.evidenceRequired = evidenceRequired;
      }

      const { count } = await prisma.frameworkControl.updateMany({
        where: { id: { in: controlIds }, frameworkId },
        data: updateData,
      });

      // Reject if any supplied id does not belong to this framework (cross-tenant attempt)
      if (count !== controlIds.length) {
        throw new AppError('One or more controls do not belong to this framework', 404);
      }

      const updatedControls = await prisma.frameworkControl.findMany({
        where: { id: { in: controlIds }, frameworkId },
      });

      // Recalculate framework progress
      await this.recalculateFrameworkProgress(frameworkId, organizationId);

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Bulk updated ${controlIds.length} controls to ${status} (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ 
        message: `Successfully updated ${updatedControls.length} controls`,
        controls: updatedControls 
      });
    } catch (error) {
      logger.error('Bulk update controls error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to bulk update controls', 500);
    }
  };

  uploadEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId, controlId } = req.params;
      const organizationId = authReq.user!.organizationId;

      logger.info(`Upload evidence request: frameworkId=${frameworkId}, controlId=${controlId}, organizationId=${organizationId}`);

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        logger.warn(`Framework not found: ${frameworkId} for organization ${organizationId}`);
        throw new AppError('Framework not found', 404);
      }

      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId, frameworkId },
      });

      if (!control) {
        logger.warn(`Control not found: ${controlId} for framework ${frameworkId}`);
        throw new AppError('Control not found', 404);
      }

      // File should be in req.file (from multer middleware)
      const file = (req as any).file;
      if (!file) {
        logger.warn('No file uploaded in request');
        throw new AppError('No file uploaded. Please select a file to upload.', 400);
      }

      logger.info(`File received: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

      // Upload to S3
      let uploadResult;
      try {
        const s3Service = (await import('../services/s3Service')).default;
        uploadResult = await s3Service.uploadFile({
          file,
          userId: authReq.user!.id,
          organizationId,
          folder: `frameworks/${frameworkId}/controls/${controlId}`,
        });
        logger.info(`File uploaded to S3: ${uploadResult.url}`);
      } catch (s3Error: any) {
        logger.error('S3 upload error', s3Error);
        const errorMessage = s3Error.message || 'Failed to upload file to storage';
        throw new AppError(`File storage error: ${errorMessage}. Please check your storage configuration.`, 500);
      }

      // Create evidence version
      try {
        const evidenceVersioningController = (await import('./evidenceVersioningController')).default;
        const versionReq = {
          params: { controlId },
          body: {
            fileUrl: uploadResult.url,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
          user: authReq.user,
        } as any;
        const versionRes = {
          json: (data: any) => data,
          status: (code: number) => ({ json: (data: any) => data }),
        } as any;
        await evidenceVersioningController.createVersion(versionReq, versionRes, () => {});
      } catch (versionError) {
        logger.warn('Failed to create evidence version', versionError);
        // Don't fail the upload if versioning fails
      }

      // Update control with evidence
      try {
        const updatedControl = await prisma.frameworkControl.update({
          where: { id: controlId },
          data: {
            evidence: uploadResult.url,
          },
        });

        await prisma.auditLog.create({
          data: {
            action: `Evidence uploaded for control: ${control.name} (${framework.name})`,
            userId: authReq.user!.id,
            organizationId,
            hash: uuidv4(),
          },
        });

        logger.info(`Evidence updated for control: ${controlId}`);

        res.json({
          control: updatedControl,
          file: {
            id: uploadResult.id,
            url: uploadResult.url,
            filename: uploadResult.filename,
          },
        });
      } catch (dbError: any) {
        logger.error('Database update error', dbError);
        throw new AppError(`Failed to update control with evidence: ${dbError.message}`, 500);
      }
    } catch (error) {
      logger.error('Upload evidence error', error);
      if (error instanceof AppError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(`Failed to upload evidence: ${errorMessage}`, 500);
    }
  };

  getEvidenceUrl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId, controlId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId, frameworkId },
        select: { evidence: true },
      });

      if (!control || !control.evidence) {
        throw new AppError('Evidence not found', 404);
      }

      // Extract S3 key from URL or use the URL as-is
      let s3Key = control.evidence;
      
      // If it's already a full URL, extract the key
      if (control.evidence.includes('amazonaws.com/') || control.evidence.includes('s3.')) {
        // Extract key from S3 URL (format: https://bucket.s3.region.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key)
        try {
          const url = new URL(control.evidence);
          // Remove leading slash from pathname
          s3Key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
        } catch {
          // If URL parsing fails, try manual extraction
          const urlParts = control.evidence.split('/');
          const bucketIndex = urlParts.findIndex(part => part.includes('.s3.') || part.includes('amazonaws.com'));
          if (bucketIndex >= 0 && bucketIndex < urlParts.length - 1) {
            s3Key = urlParts.slice(bucketIndex + 1).join('/');
          }
        }
      }
      
      // If s3Key is still a full URL, it might be stored as just the key path
      // Remove any query parameters
      if (s3Key.includes('?')) {
        s3Key = s3Key.split('?')[0];
      }

      // Generate signed URL
      try {
        const s3Service = (await import('../services/s3Service')).default;
        const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
        res.json({ url: signedUrl });
      } catch (s3Error: any) {
        logger.error('Failed to generate signed URL', s3Error);
        // If signed URL generation fails, try to return the original URL
        // But log the error for debugging
        logger.error('S3 Key used:', s3Key);
        logger.error('Original evidence URL:', control.evidence);
        throw new AppError(`Failed to generate signed URL: ${s3Error.message}`, 500);
      }
    } catch (error) {
      logger.error('Get evidence URL error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get evidence URL', 500);
    }
  };

  smartUpload: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
        include: { controls: true },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      const file = (req as any).file;
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Use AI to classify the file and get confidence score
      const geminiService = (await import('../services/geminiService')).default;
      const classificationResult = await geminiService.classifyEvidence(file.originalname, authReq.user!.id);
      const classification = classificationResult.classification;
      const confidence = classificationResult.confidence;
      const aiDescription = classificationResult.description;

      // Upload to S3
      const s3Service = (await import('../services/s3Service')).default;
      const uploadResult = await s3Service.uploadFile({
        file,
        userId: authReq.user!.id,
        organizationId,
        folder: `frameworks/${frameworkId}/evidence`,
      });

      // Check if matching control exists
      const existingControl = framework.controls.find(c => 
        c.name.toLowerCase().includes(classification.toLowerCase()) ||
        classification.toLowerCase().includes(c.name.toLowerCase())
      );

      if (existingControl) {
        // If control exists, update it with evidence directly (no suggestion needed)
        const updatedControl = await prisma.frameworkControl.update({
          where: { id: existingControl.id },
          data: {
            evidence: uploadResult.url,
          },
        });

        // Recalculate framework progress
        await this.recalculateFrameworkProgress(frameworkId, organizationId);

        await prisma.auditLog.create({
          data: {
            action: `Smart upload: ${file.originalname} added to existing control "${existingControl.name}" (${framework.name})`,
            userId: authReq.user!.id,
            organizationId,
            hash: uuidv4(),
          },
        });

        res.json({
          classification,
          confidence,
          control: updatedControl,
          file: {
            id: uploadResult.id,
            url: uploadResult.url,
            filename: uploadResult.filename,
          },
        });
        return;
      }

      // Extract s3Key from URL if possible, otherwise use URL
      // S3 URLs typically look like: https://bucket.s3.region.amazonaws.com/key
      let s3Key = uploadResult.url;
      try {
        const urlObj = new URL(uploadResult.url);
        // Remove leading slash and bucket name from pathname
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 1) {
          s3Key = pathParts.slice(1).join('/'); // Skip bucket name, get the rest
        } else if (pathParts.length === 1) {
          s3Key = pathParts[0];
        }
      } catch {
        // If URL parsing fails, use the full URL
        s3Key = uploadResult.url;
      }

      // No matching control found - create AI suggestion for user to accept/reject
      const suggestion = await prisma.aISuggestion.create({
        data: {
          frameworkId,
          fileName: file.originalname,
          fileUrl: uploadResult.url,
          s3Key: s3Key,
          classification,
          description: aiDescription || `Auto-suggested from uploaded file: ${file.originalname}`,
          confidence,
          status: 'pending',
          suggestedBy: authReq.user!.id,
          organizationId,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: `Smart upload: AI suggestion created for "${classification}" from ${file.originalname} (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({
        suggestion: {
          id: suggestion.id,
          classification,
          description: suggestion.description,
          confidence,
          fileName: suggestion.fileName,
          fileUrl: suggestion.fileUrl,
        },
        file: {
          id: uploadResult.id,
          url: uploadResult.url,
          filename: uploadResult.filename,
        },
      });
    } catch (error) {
      logger.error('Smart upload error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process smart upload', 500);
    }
  };

  acceptSuggestion: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { suggestionId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Get suggestion
      const suggestion = await prisma.aISuggestion.findFirst({
        where: {
          id: suggestionId,
          organizationId,
          status: 'pending',
        },
      });

      if (!suggestion) {
        throw new AppError('Suggestion not found or already processed', 404);
      }

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: suggestion.frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Create control from suggestion
      const control = await prisma.frameworkControl.create({
        data: {
          name: suggestion.classification,
          description: suggestion.description || `Auto-created from AI suggestion: ${suggestion.fileName}`,
          status: 'Pending',
          evidence: suggestion.fileUrl,
          frameworkId: suggestion.frameworkId,
        },
      });

      // Update suggestion status
      await prisma.aISuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'accepted',
          controlId: control.id,
        },
      });

      // Recalculate framework progress
      await this.recalculateFrameworkProgress(suggestion.frameworkId, organizationId);

      await prisma.auditLog.create({
        data: {
          action: `AI suggestion accepted: Created control "${control.name}" from "${suggestion.fileName}" (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({
        message: 'Suggestion accepted and control created',
        control,
      });
    } catch (error) {
      logger.error('Accept suggestion error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to accept suggestion', 500);
    }
  };

  rejectSuggestion: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { suggestionId } = req.params;
      const { feedback } = req.body;
      const organizationId = authReq.user!.organizationId;

      // Get suggestion
      const suggestion = await prisma.aISuggestion.findFirst({
        where: {
          id: suggestionId,
          organizationId,
          status: 'pending',
        },
      });

      if (!suggestion) {
        throw new AppError('Suggestion not found or already processed', 404);
      }

      // Update suggestion status with feedback
      await prisma.aISuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'rejected',
          feedback: feedback || 'No feedback provided',
        },
      });

      await prisma.auditLog.create({
        data: {
          action: `AI suggestion rejected: "${suggestion.classification}" from "${suggestion.fileName}"`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          metadata: feedback ? { feedback } : undefined,
        },
      });

      res.json({
        message: 'Suggestion rejected',
      });
    } catch (error) {
      logger.error('Reject suggestion error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject suggestion', 500);
    }
  };

  getSuggestions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Get pending suggestions for this framework
      const suggestions = await prisma.aISuggestion.findMany({
        where: {
          frameworkId,
          organizationId,
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          suggester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({ suggestions });
    } catch (error) {
      logger.error('Get suggestions error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get suggestions', 500);
    }
  };

  deleteControl: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId, controlId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      // Verify control exists and belongs to framework
      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId, frameworkId },
      });

      if (!control) {
        throw new AppError('Control not found', 404);
      }

      // Delete the control
      await prisma.frameworkControl.delete({
        where: { id: controlId },
      });

      // Recalculate framework progress
      await this.recalculateFrameworkProgress(frameworkId, organizationId);

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Control Deleted: ${control.name} from framework ${framework.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ message: 'Control deleted successfully' });
    } catch (error) {
      logger.error('Delete control error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete control', 500);
    }
  };

  private async recalculateFrameworkProgress(frameworkId: string, organizationId: string): Promise<void> {
    const controls = await prisma.frameworkControl.findMany({
      where: { frameworkId },
    });

    if (controls.length === 0) {
      await prisma.complianceFramework.update({
        where: { id: frameworkId },
        data: { progress: 0, status: ComplianceStatus.In_Review },
      });
      return;
    }

    const compliantCount = controls.filter(
      (c) => c.status === 'Implemented' || c.status === 'Compliant'
    ).length;
    const progress = Math.round((compliantCount / controls.length) * 100);

    let status: ComplianceStatus = ComplianceStatus.In_Review;
    if (progress === 100) {
      status = ComplianceStatus.Compliant;
    } else if (controls.some(c => c.status === 'At Risk' || c.status === 'Failed')) {
      status = ComplianceStatus.At_Risk;
    }

    await prisma.complianceFramework.update({
      where: { id: frameworkId },
      data: { progress, status },
    });
  }
}

export default new FrameworksController();
