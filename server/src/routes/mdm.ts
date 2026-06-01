/**
 * Mobile Device Management (MDM) Routes
 * Routes for device management, policies, compliance, apps, and certificates.
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  enrollDeviceSchema, updateDeviceSchema, reassignDeviceSchema,
  createMdmPolicySchema, updateMdmPolicySchema, bulkDeviceActionSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler, AuthenticatedRequest } from '../types/express';
import mdmService from '../services/mdmService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    try {
      const dashboard = await mdmService.getMDMDashboard(user.organizationId);
      res.json(dashboard);
    } catch (error) {
      logger.error('Error fetching MDM dashboard:', error);
      // Surface the failure to the global error handler/Sentry instead of masking an outage as zeroed data.
      throw new AppError('Failed to load MDM dashboard', 500);
    }
  })
);

// ============================================================================
// DEVICES
// ============================================================================

router.get(
  '/devices',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    try {
      const devices = await mdmService.getDevices(user.organizationId);
      res.json(devices);
    } catch (error) {
      logger.error('Error fetching devices:', error);
      // Re-throw so a real query/DB failure is reported rather than presented as an empty device list.
      throw new AppError('Failed to load devices', 500);
    }
  })
);

router.post(
  '/devices',
  authorize('admin', 'editor'),
  validateBody(enrollDeviceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const device = await mdmService.enrollDevice({
      ...req.body,
      organizationId: user.organizationId,
      enrolledBy: user.id,
    });
    res.status(201).json(device);
  })
);

router.get(
  '/devices/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const device = await mdmService.getDeviceById(req.params.id, user.organizationId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }
    res.json(device);
  })
);

router.patch(
  '/devices/:id',
  authorize('admin', 'editor'),
  validateBody(updateDeviceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const device = await mdmService.updateDevice(req.params.id, user.id, user.organizationId, req.body);
    res.json(device);
  })
);

router.post(
  '/devices/:id/lock',
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    await mdmService.createDeviceAction({
      deviceId: req.params.id,
      action: 'lock',
      organizationId: user.organizationId,
      initiatedBy: user.id,
    });
    res.json({ success: true, message: 'Device lock command sent' });
  })
);

router.post(
  '/devices/:id/wipe',
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    await mdmService.createDeviceAction({
      deviceId: req.params.id,
      action: 'wipe',
      organizationId: user.organizationId,
      initiatedBy: user.id,
    });
    res.json({ success: true, message: 'Device wipe command sent' });
  })
);

router.post(
  '/devices/:id/unenroll',
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    await mdmService.unenrollDevice(req.params.id, user.id, user.organizationId);
    res.json({ success: true, message: 'Device unenrolled' });
  })
);

router.post(
  '/devices/:id/reassign',
  authorize('admin', 'editor'),
  validateBody(reassignDeviceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { newUserId, newUserName, reason } = req.body;
    if (!newUserId) {
      throw new AppError('newUserId is required', 400);
    }
    const device = await mdmService.reassignDevice(req.params.id, user.id, user.organizationId, {
      newUserId,
      newUserName,
      reason,
    });
    if (!device) {
      throw new AppError('Device not found', 404);
    }
    res.json({ success: true, message: 'Device reassigned', device });
  })
);

// ============================================================================
// POLICIES
// ============================================================================

router.get(
  '/policies',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    try {
      const policies = await mdmService.getPolicies(user.organizationId);
      res.json(policies);
    } catch (error) {
      logger.error('Error fetching MDM policies:', error);
      // Re-throw so a real failure is reported rather than presented as an empty policy list.
      throw new AppError('Failed to load MDM policies', 500);
    }
  })
);

router.post(
  '/policies',
  authorize('admin', 'editor'),
  validateBody(createMdmPolicySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const policy = await mdmService.createPolicy({
      ...req.body,
      organizationId: user.organizationId,
      createdBy: user.id,
    });
    res.status(201).json(policy);
  })
);

router.get(
  '/policies/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const policy = await mdmService.getPolicyById(req.params.id, user.organizationId);
    if (!policy) {
      throw new AppError('Policy not found', 404);
    }
    res.json(policy);
  })
);

router.patch(
  '/policies/:id',
  authorize('admin', 'editor'),
  validateBody(updateMdmPolicySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const policy = await mdmService.updatePolicy(req.params.id, user.id, user.organizationId, req.body);
    res.json(policy);
  })
);

router.delete(
  '/policies/:id',
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    await mdmService.deletePolicy(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

// ============================================================================
// COMPLIANCE
// ============================================================================

router.get(
  '/compliance',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    try {
      const compliance = await mdmService.checkDeviceCompliance(user.organizationId);
      res.json(compliance);
    } catch (error) {
      logger.error('Error fetching MDM compliance:', error);
      // Re-throw so a real failure is reported rather than masked as a fully-compliant zeroed result.
      throw new AppError('Failed to evaluate MDM compliance', 500);
    }
  })
);

// ============================================================================
// DEVICE ACTIONS
// ============================================================================

router.get(
  '/actions',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    try {
      const actions = await mdmService.getDeviceActions(user.organizationId);
      res.json(actions);
    } catch (error) {
      logger.error('Error fetching device actions:', error);
      // Re-throw so a real failure is reported rather than presented as an empty action history.
      throw new AppError('Failed to load device actions', 500);
    }
  })
);

// ============================================================================
// BULK ACTIONS
// ============================================================================

router.post(
  '/bulk-action',
  authorize('admin'),
  validateBody(bulkDeviceActionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const result = await mdmService.bulkDeviceAction({
      ...req.body,
      organizationId: user.organizationId,
      initiatedBy: user.id,
    });
    res.json(result);
  })
);

export default router;
