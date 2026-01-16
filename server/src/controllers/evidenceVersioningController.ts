/**
 * Evidence Versioning Controller
 * Handles evidence version history
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

class EvidenceVersioningController {
  // Get version history for a control
  getVersions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { controlId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify control exists and belongs to organization
      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId },
        include: { framework: true },
      });

      if (!control || control.framework.organizationId !== organizationId) {
        throw new AppError('Control not found', 404);
      }

      // Get version history using Prisma
      const versions = await prisma.evidenceVersion.findMany({
        where: { controlId },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          versionNumber: 'desc',
        },
      });

      res.json({ versions });
    } catch (error: any) {
      const { controlId } = req.params;
      logger.error('Get versions error', { error: error.message, stack: error.stack, controlId: controlId });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to fetch versions: ${error.message || 'Unknown error'}`, 500);
    }
  };

  // Create new version (called when evidence is uploaded)
  createVersion: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { controlId } = req.params;
      const { fileUrl, fileName, fileSize, mimeType } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!fileUrl || !fileName) {
        throw new AppError('File URL and name are required', 400);
      }

      // Verify control exists
      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId },
        include: { framework: true },
      });

      if (!control || control.framework.organizationId !== organizationId) {
        throw new AppError('Control not found', 404);
      }

      // Get current max version number
      const maxVersion = await prisma.evidenceVersion.findFirst({
        where: { controlId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      const nextVersion = (maxVersion?.versionNumber || 0) + 1;

      // Mark all previous versions as not current
      await prisma.evidenceVersion.updateMany({
        where: { controlId },
        data: { isCurrent: false },
      });

      // Create new version using Prisma
      const version = await prisma.evidenceVersion.create({
        data: {
          controlId,
          versionNumber: nextVersion,
          fileUrl,
          fileName,
          uploadedBy: authReq.user!.id,
          fileSize: fileSize ? BigInt(fileSize) : null,
          mimeType: mimeType || null,
          isCurrent: true,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: `Evidence version ${nextVersion} created for control: ${control.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.status(201).json({ version });
    } catch (error) {
      logger.error('Create version error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create version', 500);
    }
  };

  // Restore a previous version
  restoreVersion: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { controlId, versionId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify control exists
      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId },
        include: { framework: true },
      });

      if (!control || control.framework.organizationId !== organizationId) {
        throw new AppError('Control not found', 404);
      }

      // Get version to restore
      const version = await prisma.evidenceVersion.findFirst({
        where: {
          id: versionId,
          controlId,
        },
      });

      if (!version) {
        throw new AppError('Version not found', 404);
      }

      // Mark all versions as not current
      await prisma.evidenceVersion.updateMany({
        where: { controlId },
        data: { isCurrent: false },
      });

      // Mark this version as current
      await prisma.evidenceVersion.update({
        where: { id: versionId },
        data: { isCurrent: true },
      });

      // Update control with restored evidence
      await prisma.frameworkControl.update({
        where: { id: controlId },
        data: {
          evidence: version.fileUrl,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: `Evidence version ${version.versionNumber} restored for control: ${control.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ message: 'Version restored successfully' });
    } catch (error) {
      logger.error('Restore version error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to restore version', 500);
    }
  };

  // Delete a version
  deleteVersion: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { controlId, versionId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify control exists
      const control = await prisma.frameworkControl.findFirst({
        where: { id: controlId },
        include: { framework: true },
      });

      if (!control || control.framework.organizationId !== organizationId) {
        throw new AppError('Control not found', 404);
      }

      // Get version
      const version = await prisma.evidenceVersion.findFirst({
        where: {
          id: versionId,
          controlId,
        },
      });

      if (!version) {
        throw new AppError('Version not found', 404);
      }

      // Don't allow deleting current version
      if (version.isCurrent) {
        throw new AppError('Cannot delete current version. Restore another version first.', 400);
      }

      await prisma.evidenceVersion.delete({
        where: { id: versionId },
      });

      await prisma.auditLog.create({
        data: {
          action: `Evidence version ${version.versionNumber} deleted for control: ${control.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ message: 'Version deleted successfully' });
    } catch (error) {
      logger.error('Delete version error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete version', 500);
    }
  };
}

export default new EvidenceVersioningController();

