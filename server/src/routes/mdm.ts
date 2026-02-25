/**
 * Mobile Device Management (MDM) Routes
 * Routes for device management, policies, compliance, apps, and certificates.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import mdmService from '../services/mdmService';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const dashboard = await mdmService.getMDMDashboard(user.organizationId);
      res.json(dashboard);
    } catch (error) {
      logger.error('Error fetching MDM dashboard:', error);
      res.json({ totalDevices: 0, compliant: 0, nonCompliant: 0 });
    }
  })
);

// ============================================================================
// DEVICES
// ============================================================================

router.get(
  '/devices',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const devices = await mdmService.getDevices(user.organizationId);
      res.json(devices);
    } catch (error) {
      logger.error('Error fetching devices:', error);
      res.json([]);
    }
  })
);

router.post(
  '/devices',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const device = await mdmService.getDeviceById(req.params.id, user.organizationId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(device);
  })
);

router.patch(
  '/devices/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const device = await mdmService.updateDevice(req.params.id, user.id, user.organizationId, req.body);
    res.json(device);
  })
);

router.post(
  '/devices/:id/lock',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    await mdmService.unenrollDevice(req.params.id, user.id, user.organizationId);
    res.json({ success: true, message: 'Device unenrolled' });
  })
);

router.post(
  '/devices/:id/reassign',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { newUserId, newUserName, reason } = req.body;
    if (!newUserId) {
      res.status(400).json({ error: 'newUserId is required' });
      return;
    }
    const device = await mdmService.reassignDevice(req.params.id, user.id, user.organizationId, {
      newUserId,
      newUserName,
      reason,
    });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json({ success: true, message: 'Device reassigned', device });
  })
);

// ============================================================================
// POLICIES
// ============================================================================

router.get(
  '/policies',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const policies = await mdmService.getPolicies(user.organizationId);
      res.json(policies);
    } catch (error) {
      logger.error('Error fetching MDM policies:', error);
      res.json([]);
    }
  })
);

router.post(
  '/policies',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const policy = await mdmService.getPolicyById(req.params.id, user.organizationId);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json(policy);
  })
);

router.patch(
  '/policies/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const policy = await mdmService.updatePolicy(req.params.id, user.id, user.organizationId, req.body);
    res.json(policy);
  })
);

router.delete(
  '/policies/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    await mdmService.deletePolicy(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

// ============================================================================
// COMPLIANCE
// ============================================================================

router.get(
  '/compliance',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const compliance = await mdmService.checkDeviceCompliance(user.organizationId);
      res.json(compliance);
    } catch (error) {
      logger.error('Error fetching MDM compliance:', error);
      res.json({ compliant: 0, nonCompliant: 0, violations: [] });
    }
  })
);

// ============================================================================
// DEVICE ACTIONS
// ============================================================================

router.get(
  '/actions',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const actions = await mdmService.getDeviceActions(user.organizationId);
      res.json(actions);
    } catch (error) {
      logger.error('Error fetching device actions:', error);
      res.json([]);
    }
  })
);

// ============================================================================
// BULK ACTIONS
// ============================================================================

router.post(
  '/bulk-action',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await mdmService.bulkDeviceAction({
      ...req.body,
      organizationId: user.organizationId,
      initiatedBy: user.id,
    });
    res.json(result);
  })
);

export default router;
