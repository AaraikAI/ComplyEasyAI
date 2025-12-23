import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

class FrameworksController {
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

      const framework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
        include: { controls: true },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      res.json(framework);
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
      const { name, region, nextAuditDate } = req.body;

      if (!name || !nextAuditDate) {
        throw new AppError('Name and next audit date are required', 400);
      }

      const framework = await prisma.complianceFramework.create({
        data: {
          name,
          region,
          nextAuditDate: new Date(nextAuditDate),
          organizationId,
        },
      });

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

      const framework = await prisma.complianceFramework.update({
        where: { id },
        data: updateData,
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
      const { name, description, status } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!name) {
        throw new AppError('Control name is required', 400);
      }

      // Verify framework belongs to organization
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: frameworkId, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      const control = await prisma.frameworkControl.create({
        data: {
          name,
          description,
          status: status || 'Pending',
          frameworkId,
        },
      });

      // Update framework progress
      const allControls = await prisma.frameworkControl.findMany({
        where: { frameworkId },
      });
      const compliantCount = allControls.filter(c => c.status === 'Implemented' || c.status === 'Compliant').length;
      const progress = allControls.length > 0 ? Math.round((compliantCount / allControls.length) * 100) : 0;

      await prisma.complianceFramework.update({
        where: { id: frameworkId },
        data: { progress },
      });

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
      throw new AppError('Failed to create control', 500);
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

      const control = await prisma.frameworkControl.update({
        where: { id: controlId },
        data: updateData,
      });

      // Update framework progress
      const allControls = await prisma.frameworkControl.findMany({
        where: { frameworkId },
      });
      const compliantCount = allControls.filter(c => c.status === 'Implemented' || c.status === 'Compliant').length;
      const progress = allControls.length > 0 ? Math.round((compliantCount / allControls.length) * 100) : 0;

      await prisma.complianceFramework.update({
        where: { id: frameworkId },
        data: { progress },
      });

      await prisma.auditLog.create({
        data: {
          action: `Control updated: ${control.name} (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json(control);
    } catch (error) {
      logger.error('Update control error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update control', 500);
    }
  };

  uploadEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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
      });

      if (!control) {
        throw new AppError('Control not found', 404);
      }

      // File should be in req.file (from multer middleware)
      const file = (req as any).file;
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Upload to S3
      const s3Service = (await import('../services/s3Service')).default;
      const uploadResult = await s3Service.uploadFile({
        file,
        userId: authReq.user!.id,
        organizationId,
        folder: `frameworks/${frameworkId}/controls/${controlId}`,
      });

      // Update control with evidence
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

      res.json({
        control: updatedControl,
        file: {
          id: uploadResult.id,
          url: uploadResult.url,
          filename: uploadResult.filename,
        },
      });
    } catch (error) {
      logger.error('Upload evidence error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to upload evidence', 500);
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

      // Use AI to classify the file
      const geminiService = (await import('../services/geminiService')).default;
      const classification = await geminiService.classifyEvidence(file.originalname, authReq.user!.id);

      // Upload to S3
      const s3Service = (await import('../services/s3Service')).default;
      const uploadResult = await s3Service.uploadFile({
        file,
        userId: authReq.user!.id,
        organizationId,
        folder: `frameworks/${frameworkId}/evidence`,
      });

      // Try to find matching control or create new one
      let control = framework.controls.find(c => 
        c.name.toLowerCase().includes(classification.toLowerCase()) ||
        classification.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!control) {
        // Create new control based on AI classification
        control = await prisma.frameworkControl.create({
          data: {
            name: classification,
            description: `Auto-created from uploaded file: ${file.originalname}`,
            status: 'Pending',
            evidence: uploadResult.url,
            frameworkId,
          },
        });
      } else {
        // Update existing control with evidence
        control = await prisma.frameworkControl.update({
          where: { id: control.id },
          data: {
            evidence: uploadResult.url,
          },
        });
      }

      // Update framework progress
      const allControls = await prisma.frameworkControl.findMany({
        where: { frameworkId },
      });
      const compliantCount = allControls.filter(c => c.status === 'Implemented' || c.status === 'Compliant').length;
      const progress = allControls.length > 0 ? Math.round((compliantCount / allControls.length) * 100) : 0;

      await prisma.complianceFramework.update({
        where: { id: frameworkId },
        data: { progress },
      });

      await prisma.auditLog.create({
        data: {
          action: `Smart upload: ${file.originalname} classified as "${classification}" (${framework.name})`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({
        classification,
        control,
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
}

export default new FrameworksController();
