/**
 * Control Mappings Controller
 * Handles cross-framework control mappings
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

class ControlMappingsController {
  // Create a mapping between controls
  createMapping: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sourceControlId, targetControlId, mappingType = 'equivalent', confidence } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!sourceControlId || !targetControlId) {
        throw new AppError('Source and target control IDs are required', 400);
      }

      // Verify both controls exist and belong to organization
      const [sourceControl, targetControl] = await Promise.all([
        prisma.frameworkControl.findFirst({
          where: { id: sourceControlId },
          include: { framework: true },
        }),
        prisma.frameworkControl.findFirst({
          where: { id: targetControlId },
          include: { framework: true },
        }),
      ]);

      if (!sourceControl || sourceControl.framework.organizationId !== organizationId) {
        throw new AppError('Source control not found', 404);
      }

      if (!targetControl || targetControl.framework.organizationId !== organizationId) {
        throw new AppError('Target control not found', 404);
      }

      // Check if mapping already exists (bidirectional check)
      const existing = await prisma.controlMapping.findFirst({
        where: {
          OR: [
            { sourceControlId, targetControlId },
            { sourceControlId: targetControlId, targetControlId: sourceControlId },
          ],
        },
      });

      if (existing) {
        throw new AppError('Mapping already exists', 400);
      }

      // Create mapping using Prisma
      const mapping = await prisma.controlMapping.create({
        data: {
          sourceControlId,
          targetControlId,
          mappingType,
          confidence: confidence || null,
        },
        include: {
          sourceControl: {
            include: {
              framework: true,
            },
          },
          targetControl: {
            include: {
              framework: true,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: `Control mapping created: ${sourceControl.name} <-> ${targetControl.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.status(201).json({ message: 'Mapping created successfully', mapping });
    } catch (error) {
      logger.error('Create mapping error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create mapping', 500);
    }
  };

  // Get mappings for a control
  getMappings: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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

      // Get all mappings for this control (as source or target)
      const mappings = await prisma.controlMapping.findMany({
        where: {
          OR: [
            { sourceControlId: controlId },
            { targetControlId: controlId },
          ],
        },
        include: {
          sourceControl: {
            include: {
              framework: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          targetControl: {
            include: {
              framework: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({ mappings: mappings || [] });
    } catch (error) {
      logger.error('Get mappings error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch mappings', 500);
    }
  };

  // Update a mapping
  updateMapping: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { mappingId } = req.params;
      const { mappingType, confidence, notes, status } = req.body;
      const organizationId = authReq.user!.organizationId;

      // Validate mapping exists and belongs to organization
      const existingMapping = await prisma.controlMapping.findUnique({
        where: { id: mappingId },
        include: {
          sourceControl: {
            include: { framework: true },
          },
          targetControl: {
            include: { framework: true },
          },
        },
      });

      if (!existingMapping) {
        throw new AppError('Control mapping not found', 404);
      }

      // Verify organization access
      if (
        existingMapping.sourceControl.framework.organizationId !== organizationId ||
        existingMapping.targetControl.framework.organizationId !== organizationId
      ) {
        throw new AppError('Unauthorized', 403);
      }

      const updatedMapping = await prisma.controlMapping.update({
        where: { id: mappingId },
        data: {
          ...(mappingType && { mappingType }),
          ...(confidence !== undefined && { confidence }),
          ...(notes !== undefined && { notes }),
          ...(status && { status }),
          updatedAt: new Date(),
        },
        include: {
          sourceControl: {
            include: { framework: { select: { id: true, name: true } } },
          },
          targetControl: {
            include: { framework: { select: { id: true, name: true } } },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_CONTROL_MAPPING',
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          details: JSON.stringify({ mappingId, changes: req.body }),
        },
      });

      res.json({ message: 'Mapping updated successfully', mapping: updatedMapping });
    } catch (error) {
      logger.error('Update mapping error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update mapping', 500);
    }
  };

  // Delete a mapping
  deleteMapping: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { mappingId } = req.params;
      const organizationId = authReq.user!.organizationId;

      // Verify mapping exists and controls belong to organization
      const mapping = await prisma.controlMapping.findUnique({
        where: { id: mappingId },
        include: {
          sourceControl: {
            include: {
              framework: true,
            },
          },
          targetControl: {
            include: {
              framework: true,
            },
          },
        },
      });

      if (!mapping) {
        throw new AppError('Mapping not found', 404);
      }

      // Verify organization access
      if (
        mapping.sourceControl.framework.organizationId !== organizationId ||
        mapping.targetControl.framework.organizationId !== organizationId
      ) {
        throw new AppError('Unauthorized', 403);
      }

      await prisma.controlMapping.delete({
        where: { id: mappingId },
      });

      await prisma.auditLog.create({
        data: {
          action: `Control mapping deleted`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ message: 'Mapping deleted successfully' });
    } catch (error) {
      logger.error('Delete mapping error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete mapping', 500);
    }
  };

  // Export mappings to CSV
  exportMappings: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      // Get all mappings for organization
      const mappings = await prisma.controlMapping.findMany({
        where: {
          OR: [
            {
              sourceControl: {
                framework: {
                  organizationId,
                },
              },
            },
            {
              targetControl: {
                framework: {
                  organizationId,
                },
              },
            },
          ],
        },
        include: {
          sourceControl: {
            include: {
              framework: {
                select: {
                  name: true,
                },
              },
            },
          },
          targetControl: {
            include: {
              framework: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            sourceControl: {
              framework: {
                name: 'asc',
              },
            },
          },
          {
            sourceControl: {
              name: 'asc',
            },
          },
        ],
      });

      // Convert to CSV
      const csvHeader = 'Source Framework,Source Control,Target Framework,Target Control,Mapping Type,Confidence\n';
      const csvRows = mappings.map((m) => 
        `"${m.sourceControl.framework.name || ''}","${m.sourceControl.name || ''}","${m.targetControl.framework.name || ''}","${m.targetControl.name || ''}","${m.mappingType || ''}","${m.confidence || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=control-mappings.csv');
      res.send(csvHeader + csvRows);
    } catch (error) {
      logger.error('Export mappings error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export mappings', 500);
    }
  };
}

export default new ControlMappingsController();

