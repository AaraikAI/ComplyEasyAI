/**
 * Auditor Collaboration Hub Routes
 * Routes for auditor profiles, engagements, findings, workpapers, requests,
 * dashboard statistics, and bundled auditor matching.
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import auditorService from '../services/auditorService';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const stats = await auditorService.getDashboardStats(organizationId);
    res.json(stats);
  })
);

// ============================================================================
// BUNDLED AUDITOR MATCHING
// ============================================================================

router.post(
  '/match',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const matches = await auditorService.matchAuditors(organizationId, req.body);
    res.json(matches);
  })
);

// ============================================================================
// AUDITOR PROFILES
// ============================================================================

router.get(
  '/profiles',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const profiles = await auditorService.listAuditorProfiles(organizationId, req.query as any);
    res.json(profiles);
  })
);

router.post(
  '/profiles',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const profile = await auditorService.createAuditorProfile(organizationId, req.body);
    res.status(201).json(profile);
  })
);

router.get(
  '/profiles/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const profile = await auditorService.getAuditorProfile(organizationId, req.params.id);
    res.json(profile);
  })
);

router.patch(
  '/profiles/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const profile = await auditorService.updateAuditorProfile(organizationId, req.params.id, req.body);
    res.json(profile);
  })
);

router.delete(
  '/profiles/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await auditorService.deleteAuditorProfile(organizationId, req.params.id);
    res.json({ success: true });
  })
);

// ============================================================================
// AUDIT ENGAGEMENTS
// ============================================================================

router.get(
  '/engagements',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const engagements = await auditorService.listEngagements(organizationId, req.query as any);
    res.json(engagements);
  })
);

router.post(
  '/engagements',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const engagement = await auditorService.createEngagement(organizationId, req.body);
    res.status(201).json(engagement);
  })
);

router.get(
  '/engagements/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const engagement = await auditorService.getEngagement(organizationId, req.params.id);
    res.json(engagement);
  })
);

router.patch(
  '/engagements/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const engagement = await auditorService.updateEngagement(organizationId, req.params.id, req.body);
    res.json(engagement);
  })
);

router.delete(
  '/engagements/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await auditorService.deleteEngagement(organizationId, req.params.id);
    res.json({ success: true });
  })
);

// ============================================================================
// AUDIT FINDINGS
// ============================================================================

router.get(
  '/findings',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const findings = await auditorService.listFindings(organizationId, req.query as any);
    res.json(findings);
  })
);

router.post(
  '/findings',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const finding = await auditorService.createFinding(organizationId, {
      ...req.body,
      createdBy: authReq.user!.id,
    });
    res.status(201).json(finding);
  })
);

router.get(
  '/findings/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const finding = await auditorService.getFinding(organizationId, req.params.id);
    res.json(finding);
  })
);

router.patch(
  '/findings/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const finding = await auditorService.updateFinding(organizationId, req.params.id, req.body);
    res.json(finding);
  })
);

router.delete(
  '/findings/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await auditorService.deleteFinding(organizationId, req.params.id);
    res.json({ success: true });
  })
);

// ============================================================================
// AUDIT WORKPAPERS
// ============================================================================

router.get(
  '/workpapers',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const workpapers = await auditorService.listWorkpapers(organizationId, req.query as any);
    res.json(workpapers);
  })
);

router.post(
  '/workpapers',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const workpaper = await auditorService.createWorkpaper(organizationId, {
      ...req.body,
      uploadedBy: authReq.user!.id,
    });
    res.status(201).json(workpaper);
  })
);

router.get(
  '/workpapers/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const workpaper = await auditorService.getWorkpaper(organizationId, req.params.id);
    res.json(workpaper);
  })
);

router.patch(
  '/workpapers/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const workpaper = await auditorService.updateWorkpaper(organizationId, req.params.id, req.body);
    res.json(workpaper);
  })
);

router.delete(
  '/workpapers/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await auditorService.deleteWorkpaper(organizationId, req.params.id);
    res.json({ success: true });
  })
);

// ============================================================================
// AUDIT REQUESTS
// ============================================================================

router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const requests = await auditorService.listRequests(organizationId, req.query as any);
    res.json(requests);
  })
);

router.post(
  '/requests',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const request = await auditorService.createRequest(organizationId, {
      ...req.body,
      requestedBy: authReq.user!.id,
    });
    res.status(201).json(request);
  })
);

router.get(
  '/requests/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const request = await auditorService.getRequest(organizationId, req.params.id);
    res.json(request);
  })
);

router.patch(
  '/requests/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const request = await auditorService.updateRequest(organizationId, req.params.id, req.body);
    res.json(request);
  })
);

router.delete(
  '/requests/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    await auditorService.deleteRequest(organizationId, req.params.id);
    res.json({ success: true });
  })
);

export default router;
