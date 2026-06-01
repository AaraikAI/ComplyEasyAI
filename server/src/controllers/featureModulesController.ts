/**
 * Feature Modules Controller
 * CRUD operations for all feature module entities:
 * - Governance Manager (bodies, meetings, decisions, escalation paths, DPO)
 * - Breach Notification (incidents, notifications, templates, contacts)
 * - CE Marking Workflow (products)
 * - Digital Product Passport (passports)
 * - ESG Reporting (metrics, materiality assessments)
 * - SBOM Manager (entries, repositories)
 * - Post-Market Surveillance (plans, incidents, recalls)
 * - Product Decommissioning (products)
 * - Environmental Lifecycle (assessments)
 * - Product Lifecycle Tracker (products)
 * - Process Mapper (maps)
 */

import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { logControllerAction } from '../services/auditLogService';
import { assertOrgOwned, assertOwnedByOrg } from '../utils/orgOwnership';

// Helper to get org ID from request
const getOrgId = (req: Request): string => (req as AuthRequest).user!.organizationId;

// ============================================================================
// GOVERNANCE MANAGER
// ============================================================================

// --- Governance Bodies ---
export const listGovernanceBodies: RequestHandler = async (req, res) => {
  const bodies = await prisma.governanceBody.findMany({
    where: { organizationId: getOrgId(req) },
    include: { meetings: { take: 5, orderBy: { date: 'desc' } }, decisions: { take: 5, orderBy: { createdAt: 'desc' } }, escalationPaths: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bodies);
};

export const createGovernanceBody: RequestHandler = async (req, res) => {
  const { name, type, charter, meetingFrequency, members } = req.body;
  if (!name || !type) throw new AppError('name and type are required', 400);
  const body = await prisma.governanceBody.create({
    data: { organizationId: getOrgId(req), name, type, charter, meetingFrequency, members, status: 'active' },
    include: { meetings: true, decisions: true, escalationPaths: true },
  });
  await logControllerAction(req, 'governance.body_created', { ip: req.ip });
  res.status(201).json(body);
};

export const updateGovernanceBody: RequestHandler = async (req, res) => {
  const { id } = req.params;
  await assertOrgOwned('governanceBody', id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const body = await prisma.governanceBody.update({
    where: { id },
    data,
    include: { meetings: true, decisions: true, escalationPaths: true },
  });
  await logControllerAction(req, 'governance.body_updated', { ip: req.ip });
  res.json(body);
};

export const deleteGovernanceBody: RequestHandler = async (req, res) => {
  await assertOrgOwned('governanceBody', req.params.id, getOrgId(req));
  await prisma.governanceBody.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'governance.body_deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- Governance Meetings ---
export const createMeeting: RequestHandler = async (req, res) => {
  const { governanceBodyId, title, date, duration, agenda, attendees } = req.body;
  if (!governanceBodyId || !title || !date) throw new AppError('governanceBodyId, title, and date are required', 400);
  await assertOrgOwned('governanceBody', governanceBodyId, getOrgId(req));
  const meeting = await prisma.governanceMeeting.create({
    data: { governanceBodyId, title, date: new Date(date), duration, agenda, attendees, status: 'scheduled' },
  });
  await logControllerAction(req, 'governance.meeting_created', { ip: req.ip });
  res.status(201).json(meeting);
};

export const updateMeeting: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('governanceMeeting', req.params.id, { governanceBody: { organizationId: getOrgId(req) } });
  const data = { ...req.body };
  if (data.date) data.date = new Date(data.date);
  delete data.governanceBodyId;
  const meeting = await prisma.governanceMeeting.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'governance.meeting_updated', { ip: req.ip });
  res.json(meeting);
};

export const deleteMeeting: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('governanceMeeting', req.params.id, { governanceBody: { organizationId: getOrgId(req) } });
  await prisma.governanceMeeting.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'governance.meeting_deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- Governance Decisions ---
export const createDecision: RequestHandler = async (req, res) => {
  const { governanceBodyId, title, description, decisionType } = req.body;
  if (!governanceBodyId || !title || !decisionType) throw new AppError('governanceBodyId, title, and decisionType are required', 400);
  await assertOrgOwned('governanceBody', governanceBodyId, getOrgId(req));
  const decision = await prisma.governanceDecision.create({
    data: { governanceBodyId, title, description, decisionType, status: 'proposed', ...req.body },
  });
  await logControllerAction(req, 'governance.decision_created', { ip: req.ip });
  res.status(201).json(decision);
};

export const updateDecision: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('governanceDecision', req.params.id, { governanceBody: { organizationId: getOrgId(req) } });
  const data = { ...req.body };
  if (data.effectiveDate) data.effectiveDate = new Date(data.effectiveDate);
  if (data.reviewDate) data.reviewDate = new Date(data.reviewDate);
  delete data.governanceBodyId;
  const decision = await prisma.governanceDecision.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'governance.decision_updated', { ip: req.ip });
  res.json(decision);
};

// --- Escalation Paths ---
export const createEscalationPath: RequestHandler = async (req, res) => {
  const { governanceBodyId, name, triggerCriteria, levels } = req.body;
  if (!governanceBodyId || !name) throw new AppError('governanceBodyId and name are required', 400);
  await assertOrgOwned('governanceBody', governanceBodyId, getOrgId(req));
  const path = await prisma.escalationPath.create({
    data: { governanceBodyId, name, triggerCriteria: triggerCriteria || [], levels: levels || [] },
  });
  await logControllerAction(req, 'governance.escalation_path_created', { ip: req.ip });
  res.status(201).json(path);
};

export const updateEscalationPath: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('escalationPath', req.params.id, { governanceBody: { organizationId: getOrgId(req) } });
  const data = { ...req.body };
  delete data.governanceBodyId;
  const path = await prisma.escalationPath.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'governance.escalation_path_updated', { ip: req.ip });
  res.json(path);
};

export const deleteEscalationPath: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('escalationPath', req.params.id, { governanceBody: { organizationId: getOrgId(req) } });
  await prisma.escalationPath.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'governance.escalation_path_deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- DPO Profile ---
export const getDPOProfile: RequestHandler = async (req, res) => {
  const profile = await prisma.dPOProfile.findUnique({ where: { organizationId: getOrgId(req) } });
  res.json(profile || null);
};

export const upsertDPOProfile: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { name, email, phone, certifications, appointmentDate, registeredWithDPA, dpaRegistrationRef, tasks, activityLog } = req.body;
  if (!name || !email) throw new AppError('name and email are required', 400);
  const profile = await prisma.dPOProfile.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, name, email, phone, certifications, appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined, registeredWithDPA, dpaRegistrationRef, tasks, activityLog },
    update: { name, email, phone, certifications, appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined, registeredWithDPA, dpaRegistrationRef, tasks, activityLog },
  });
  await logControllerAction(req, 'governance.dpo_profile_upserted', { ip: req.ip });
  res.json(profile);
};

// ============================================================================
// BREACH NOTIFICATION
// ============================================================================

export const listBreachIncidents: RequestHandler = async (req, res) => {
  const incidents = await prisma.breachIncident.findMany({
    where: { organizationId: getOrgId(req) },
    include: { notifications: true },
    orderBy: { discoveryDate: 'desc' },
  });
  res.json(incidents);
};

export const createBreachIncident: RequestHandler = async (req, res) => {
  const { title, breachType, severity, discoveryDate, description, discoveryMethod } = req.body;
  if (!title || !breachType || !severity || !discoveryDate) {
    throw new AppError('title, breachType, severity, and discoveryDate are required', 400);
  }
  const { affectedRecords, affectedDataTypes, affectedJurisdictions } = req.body;
  const incident = await prisma.breachIncident.create({
    data: {
      organizationId: getOrgId(req), title, breachType, severity,
      discoveryDate: new Date(discoveryDate), description, discoveryMethod,
      status: 'detected', affectedRecords, affectedDataTypes, affectedJurisdictions,
    },
    include: { notifications: true },
  });
  await logControllerAction(req, 'breach.incident_created', { ip: req.ip });
  res.status(201).json(incident);
};

export const getBreachIncident: RequestHandler = async (req, res) => {
  const incident = await prisma.breachIncident.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
    include: { notifications: true },
  });
  if (!incident) throw new AppError('Breach incident not found', 404);
  res.json(incident);
};

export const updateBreachIncident: RequestHandler = async (req, res) => {
  await assertOrgOwned('breachIncident', req.params.id, getOrgId(req));
  const data = { ...req.body };
  if (data.discoveryDate) data.discoveryDate = new Date(data.discoveryDate);
  delete data.organizationId;
  const incident = await prisma.breachIncident.update({
    where: { id: req.params.id },
    data,
    include: { notifications: true },
  });
  await logControllerAction(req, 'breach.incident_updated', { ip: req.ip });
  res.json(incident);
};

export const deleteBreachIncident: RequestHandler = async (req, res) => {
  await assertOrgOwned('breachIncident', req.params.id, getOrgId(req));
  await prisma.breachIncident.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'breach.incident_deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- Breach Notifications ---
export const createBreachNotification: RequestHandler = async (req, res) => {
  const { breachId, recipientType, jurisdiction, authority, content, dueDate } = req.body;
  if (!breachId || !recipientType) throw new AppError('breachId and recipientType are required', 400);
  await assertOrgOwned('breachIncident', breachId, getOrgId(req));
  const notification = await prisma.breachNotification.create({
    data: { breachId, recipientType, jurisdiction, authority, content, dueDate: dueDate ? new Date(dueDate) : undefined, status: 'draft' },
  });
  await logControllerAction(req, 'breach.notification_created', { ip: req.ip });
  res.status(201).json(notification);
};

export const updateBreachNotification: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('breachNotification', req.params.id, { breach: { organizationId: getOrgId(req) } });
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.sentAt) data.sentAt = new Date(data.sentAt);
  delete data.breachId;
  const notification = await prisma.breachNotification.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'breach.notification_updated', { ip: req.ip });
  res.json(notification);
};

// --- Breach Templates ---
export const listBreachTemplates: RequestHandler = async (req, res) => {
  const templates = await prisma.breachTemplate.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(templates);
};

export const createBreachTemplate: RequestHandler = async (req, res) => {
  const { name, jurisdiction, recipientType, subject, body, variables } = req.body;
  if (!name || !jurisdiction || !recipientType || !body) {
    throw new AppError('name, jurisdiction, recipientType, and body are required', 400);
  }
  const template = await prisma.breachTemplate.create({
    data: { organizationId: getOrgId(req), name, jurisdiction, recipientType, subject, body, variables },
  });
  await logControllerAction(req, 'breach.template_created', { ip: req.ip });
  res.status(201).json(template);
};

export const updateBreachTemplate: RequestHandler = async (req, res) => {
  await assertOrgOwned('breachTemplate', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const template = await prisma.breachTemplate.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'breach.template_updated', { ip: req.ip });
  res.json(template);
};

export const deleteBreachTemplate: RequestHandler = async (req, res) => {
  await assertOrgOwned('breachTemplate', req.params.id, getOrgId(req));
  await prisma.breachTemplate.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'breach.template_deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- Regulatory Contacts ---
export const listRegulatoryContacts: RequestHandler = async (req, res) => {
  const contacts = await prisma.regulatoryContact.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { jurisdiction: 'asc' },
  });
  res.json(contacts);
};

export const createRegulatoryContact: RequestHandler = async (req, res) => {
  const { name, authority, jurisdiction } = req.body;
  if (!name || !authority || !jurisdiction) {
    throw new AppError('name, authority, and jurisdiction are required', 400);
  }
  const contact = await prisma.regulatoryContact.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'breach.regulatory_contact_created', { ip: req.ip });
  res.status(201).json(contact);
};

export const updateRegulatoryContact: RequestHandler = async (req, res) => {
  await assertOrgOwned('regulatoryContact', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const contact = await prisma.regulatoryContact.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'breach.regulatory_contact_updated', { ip: req.ip });
  res.json(contact);
};

export const deleteRegulatoryContact: RequestHandler = async (req, res) => {
  await assertOrgOwned('regulatoryContact', req.params.id, getOrgId(req));
  await prisma.regulatoryContact.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'breach.regulatory_contact_deleted', { ip: req.ip });
  res.json({ success: true });
};

// ============================================================================
// CE MARKING WORKFLOW
// ============================================================================

export const listCEProducts: RequestHandler = async (req, res) => {
  try {
    const products = await prisma.cEProduct.findMany({
      where: { organizationId: getOrgId(req) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    logger.error('Error fetching CE products:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch CE products', 500);
  }
};

export const createCEProduct: RequestHandler = async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) throw new AppError('name and category are required', 400);
  const product = await prisma.cEProduct.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'ce_marking.product_created', { ip: req.ip });
  res.status(201).json(product);
};

export const getCEProduct: RequestHandler = async (req, res) => {
  const product = await prisma.cEProduct.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!product) throw new AppError('CE product not found', 404);
  res.json(product);
};

export const updateCEProduct: RequestHandler = async (req, res) => {
  await assertOrgOwned('cEProduct', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  if (data.ceMarkedDate) data.ceMarkedDate = new Date(data.ceMarkedDate);
  if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
  const product = await prisma.cEProduct.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'ce_marking.product_updated', { ip: req.ip });
  res.json(product);
};

export const deleteCEProduct: RequestHandler = async (req, res) => {
  await assertOrgOwned('cEProduct', req.params.id, getOrgId(req));
  await prisma.cEProduct.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'ce_marking.product_deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- CE Marking Supporting Data ---
export const listCENotifiedBodies: RequestHandler = async (_req, res) => {
  const bodies = [
    { id: 'nb-0123', name: 'TÜV SÜD Product Service', number: '0123', country: 'Germany', scope: 'Machinery, Medical Devices, PPE' },
    { id: 'nb-0044', name: 'BSI Group', number: '0044', country: 'United Kingdom', scope: 'Medical Devices, PPE, Construction Products' },
    { id: 'nb-0197', name: 'SGS Fimko', number: '0197', country: 'Finland', scope: 'Electrical Equipment, Machinery' },
    { id: 'nb-0035', name: 'DEKRA Testing & Certification', number: '0035', country: 'Germany', scope: 'Automotive, Medical, Machinery' },
    { id: 'nb-0402', name: 'Intertek Testing Services', number: '0402', country: 'Belgium', scope: 'PPE, Pressure Equipment, Medical Devices' },
  ];
  res.json(bodies);
};

export const listCERequirements: RequestHandler = async (_req, res) => {
  const requirements = [
    { id: 'req-1', directive: 'Machinery Directive 2006/42/EC', description: 'Essential health & safety requirements for machinery', category: 'Machinery', mandatory: true },
    { id: 'req-2', directive: 'Low Voltage Directive 2014/35/EU', description: 'Safety objectives for electrical equipment', category: 'Electrical', mandatory: true },
    { id: 'req-3', directive: 'EMC Directive 2014/30/EU', description: 'Electromagnetic compatibility requirements', category: 'EMC', mandatory: true },
    { id: 'req-4', directive: 'Medical Devices Regulation (EU) 2017/745', description: 'Requirements for medical devices', category: 'Medical', mandatory: true },
    { id: 'req-5', directive: 'PPE Regulation (EU) 2016/425', description: 'Personal protective equipment requirements', category: 'PPE', mandatory: true },
    { id: 'req-6', directive: 'Radio Equipment Directive 2014/53/EU', description: 'Radio equipment requirements', category: 'Radio', mandatory: true },
  ];
  res.json(requirements);
};

export const listCEDocuments: RequestHandler = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const products = await prisma.cEProduct.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, technicalFile: true, testResults: true, ceMarkingStatus: true }
    });
    const documents = products.flatMap(p => {
      const docs: any[] = [];
      // Technical file document
      if (p.technicalFile) {
        docs.push({
          id: `tf-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: 'Technical File',
          ...((typeof p.technicalFile === 'object' && p.technicalFile) || {})
        });
      }
      // Generate Declaration of Conformity entry if product is CE marked
      if (p.ceMarkingStatus === 'marked' || p.ceMarkingStatus === 'approved') {
        docs.push({
          id: `dec-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: 'Declaration of Conformity',
          status: 'active',
        });
      }
      return docs;
    });
    res.json(documents);
  } catch (error) {
    logger.error('Error fetching CE documents:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch CE documents', 500);
  }
};

export const listCERiskItems: RequestHandler = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const products = await prisma.cEProduct.findMany({ where: { organizationId: orgId }, select: { id: true, name: true, riskAssessment: true } });
    const items = products.flatMap(p => {
      if (!Array.isArray(p.riskAssessment)) return [];
      return (p.riskAssessment as any[]).map((r: any, i: number) => ({ id: `risk-${p.id}-${i}`, productId: p.id, productName: p.name, ...r }));
    });
    res.json(items);
  } catch (error) {
    logger.error('Error fetching CE risk items:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch CE risk items', 500);
  }
};

export const listCESurveillanceChecks: RequestHandler = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    // Query products and extract surveillance data from riskAssessment or testResults if available
    const products = await prisma.cEProduct.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, testResults: true, ceMarkingStatus: true, expiryDate: true }
    });
    const checks = products.flatMap(p => {
      const surveillanceItems: any[] = [];
      // Generate surveillance checks based on CE marking status and test results
      if (p.ceMarkingStatus === 'marked' || p.ceMarkingStatus === 'approved') {
        surveillanceItems.push({
          id: `surv-${p.id}-annual`,
          productId: p.id,
          productName: p.name,
          type: 'Annual Review',
          status: 'scheduled',
          dueDate: p.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }
      // Add test result surveillance items
      if (Array.isArray(p.testResults)) {
        (p.testResults as any[]).forEach((t: any, i: number) => {
          if (t.nextReview) {
            surveillanceItems.push({
              id: `surv-${p.id}-test-${i}`,
              productId: p.id,
              productName: p.name,
              type: 'Test Revalidation',
              testName: t.test,
              status: 'scheduled',
              dueDate: t.nextReview,
            });
          }
        });
      }
      return surveillanceItems;
    });
    res.json(checks);
  } catch (error) {
    logger.error('Error fetching CE surveillance checks:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch CE surveillance checks', 500);
  }
};

// ============================================================================
// DIGITAL PRODUCT PASSPORT
// ============================================================================

export const listDPPs: RequestHandler = async (req, res) => {
  try {
    const passports = await prisma.digitalProductPassport.findMany({
      where: { organizationId: getOrgId(req) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(passports);
  } catch (error) {
    logger.error('Error fetching digital product passports:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch digital product passports', 500);
  }
};

export const createDPP: RequestHandler = async (req, res) => {
  const { productName } = req.body;
  if (!productName) throw new AppError('productName is required', 400);
  const passport = await prisma.digitalProductPassport.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'dpp.created', { ip: req.ip });
  res.status(201).json(passport);
};

export const getDPP: RequestHandler = async (req, res) => {
  const passport = await prisma.digitalProductPassport.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!passport) throw new AppError('Digital Product Passport not found', 404);

  // Map JSON fields to the sub-resource keys the frontend expects
  const result: Record<string, any> = { ...passport };
  result.materials = Array.isArray(passport.materialComposition) ? passport.materialComposition : [];
  result.carbonFootprint = (() => {
    const cf = passport.carbonFootprint as any;
    if (!cf) return [];
    // If stored as stages array, return directly
    if (Array.isArray(cf)) return cf;
    // If stored as { total, stages: [...] }, extract stages
    if (cf.stages && Array.isArray(cf.stages)) return cf.stages;
    return [];
  })();
  result.supplyChain = Array.isArray(passport.supplyChain) ? passport.supplyChain : [];

  res.json(result);
};

export const updateDPP: RequestHandler = async (req, res) => {
  await assertOrgOwned('digitalProductPassport', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  if (data.manufacturingDate) data.manufacturingDate = new Date(data.manufacturingDate);
  const passport = await prisma.digitalProductPassport.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'dpp.updated', { ip: req.ip });
  res.json(passport);
};

export const deleteDPP: RequestHandler = async (req, res) => {
  await assertOrgOwned('digitalProductPassport', req.params.id, getOrgId(req));
  await prisma.digitalProductPassport.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'dpp.deleted', { ip: req.ip });
  res.json({ success: true });
};

/**
 * Returns the material composition for a given DPP record.
 * Reads from the materialComposition JSON field.
 */
export const getDPPMaterials: RequestHandler = async (req, res) => {
  try {
    const passport = await prisma.digitalProductPassport.findFirst({
      where: { id: req.params.id, organizationId: getOrgId(req) },
      select: { materialComposition: true },
    });
    if (!passport) throw new AppError('Digital Product Passport not found', 404);
    const materials = Array.isArray(passport.materialComposition) ? passport.materialComposition : [];
    res.json(materials);
  } catch (error) {
    logger.error('Error fetching DPP materials:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch DPP materials', 500);
  }
};

/**
 * Returns the carbon footprint breakdown for a given DPP record.
 * Reads from the carbonFootprint JSON field.
 */
export const getDPPCarbon: RequestHandler = async (req, res) => {
  try {
    const passport = await prisma.digitalProductPassport.findFirst({
      where: { id: req.params.id, organizationId: getOrgId(req) },
      select: { carbonFootprint: true },
    });
    if (!passport) throw new AppError('Digital Product Passport not found', 404);
    const cf = passport.carbonFootprint as any;
    let stages: any[] = [];
    if (Array.isArray(cf)) stages = cf;
    else if (cf && Array.isArray(cf.stages)) stages = cf.stages;
    res.json(stages);
  } catch (error) {
    logger.error('Error fetching DPP carbon data:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch DPP carbon data', 500);
  }
};

/**
 * Returns the supply chain nodes for a given DPP record.
 * Reads from the supplyChain JSON field.
 */
export const getDPPSupplyChain: RequestHandler = async (req, res) => {
  try {
    const passport = await prisma.digitalProductPassport.findFirst({
      where: { id: req.params.id, organizationId: getOrgId(req) },
      select: { supplyChain: true },
    });
    if (!passport) throw new AppError('Digital Product Passport not found', 404);
    const chain = Array.isArray(passport.supplyChain) ? passport.supplyChain : [];
    res.json(chain);
  } catch (error) {
    logger.error('Error fetching DPP supply chain:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch DPP supply chain', 500);
  }
};

/**
 * Returns the sustainability/circularity metrics for a given DPP record.
 * Reads from the circularityMetrics JSON field.
 */
export const getDPPSustainability: RequestHandler = async (req, res) => {
  try {
    const passport = await prisma.digitalProductPassport.findFirst({
      where: { id: req.params.id, organizationId: getOrgId(req) },
      select: { circularityMetrics: true, recyclabilityScore: true, repairabilityScore: true, durabilityRating: true, energyClass: true },
    });
    if (!passport) throw new AppError('Digital Product Passport not found', 404);
    const metrics = (passport.circularityMetrics as any) || {};
    res.json({
      ...metrics,
      recyclabilityScore: passport.recyclabilityScore,
      repairabilityScore: passport.repairabilityScore,
      durabilityRating: passport.durabilityRating,
      energyClass: passport.energyClass,
    });
  } catch (error) {
    logger.error('Error fetching DPP sustainability:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch DPP sustainability', 500);
  }
};

/**
 * Returns compliance and certification status for a given DPP record.
 */
export const getDPPCertifications: RequestHandler = async (req, res) => {
  try {
    const passport = await prisma.digitalProductPassport.findFirst({
      where: { id: req.params.id, organizationId: getOrgId(req) },
      select: { complianceStatus: true, passportVersion: true, publicUrl: true, qrCodeData: true },
    });
    if (!passport) throw new AppError('Digital Product Passport not found', 404);
    res.json(passport);
  } catch (error) {
    logger.error('Error fetching DPP certifications:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch DPP certifications', 500);
  }
};

// ============================================================================
// ESG REPORTING
// ============================================================================

export const listESGMetrics: RequestHandler = async (req, res) => {
  const { category, reportingPeriod } = req.query;
  const where: any = { organizationId: getOrgId(req) };
  if (category) where.category = category;
  if (reportingPeriod) where.reportingPeriod = reportingPeriod;
  const metrics = await prisma.eSGMetric.findMany({ where, orderBy: [{ category: 'asc' }, { subcategory: 'asc' }] });
  res.json(metrics);
};

export const getESGMetric: RequestHandler = async (req, res) => {
  const metric = await prisma.eSGMetric.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!metric) throw new AppError('ESG metric not found', 404);
  res.json(metric);
};

export const createESGMetric: RequestHandler = async (req, res) => {
  const { category, subcategory, name, value, unit } = req.body;
  if (!category || !subcategory || !name || value === undefined || !unit) {
    throw new AppError('category, subcategory, name, value, and unit are required', 400);
  }
  const metric = await prisma.eSGMetric.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'esg.metric_created', { ip: req.ip });
  res.status(201).json(metric);
};

export const updateESGMetric: RequestHandler = async (req, res) => {
  await assertOrgOwned('eSGMetric', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const metric = await prisma.eSGMetric.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'esg.metric_updated', { ip: req.ip });
  res.json(metric);
};

export const deleteESGMetric: RequestHandler = async (req, res) => {
  await assertOrgOwned('eSGMetric', req.params.id, getOrgId(req));
  await prisma.eSGMetric.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'esg.metric_deleted', { ip: req.ip });
  res.json({ success: true });
};

export const listMaterialityAssessments: RequestHandler = async (req, res) => {
  const assessments = await prisma.materialityAssessment.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assessments);
};

export const createMaterialityAssessment: RequestHandler = async (req, res) => {
  const { topic } = req.body;
  if (!topic) throw new AppError('topic is required', 400);
  const assessment = await prisma.materialityAssessment.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'esg.materiality_assessment_created', { ip: req.ip });
  res.status(201).json(assessment);
};

export const updateMaterialityAssessment: RequestHandler = async (req, res) => {
  await assertOrgOwned('materialityAssessment', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const assessment = await prisma.materialityAssessment.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'esg.materiality_assessment_updated', { ip: req.ip });
  res.json(assessment);
};

export const getMaterialityAssessment: RequestHandler = async (req, res) => {
  const assessment = await prisma.materialityAssessment.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!assessment) throw new AppError('Materiality assessment not found', 404);
  res.json(assessment);
};

export const deleteMaterialityAssessment: RequestHandler = async (req, res) => {
  await assertOrgOwned('materialityAssessment', req.params.id, getOrgId(req));
  await prisma.materialityAssessment.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'esg.materiality_assessment_deleted', { ip: req.ip });
  res.json({ success: true });
};

// Generates a synthetic ESG report by aggregating metrics + materiality for the
// requested period. Reports are not persisted as a separate row — they're
// computed on demand from authoritative metric data and returned for download.
export const generateESGReport: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const type = (req.body?.type as string) || 'annual';
  const periodStart = req.body?.periodStart as string | undefined;
  const periodEnd = req.body?.periodEnd as string | undefined;

  const metrics = await prisma.eSGMetric.findMany({ where: { organizationId: orgId } });
  const materiality = await prisma.materialityAssessment.findMany({ where: { organizationId: orgId } });

  const totals = {
    metricsCount: metrics.length,
    verifiedMetrics: metrics.filter(m => m.verified).length,
    materialTopics: materiality.filter(m => m.isMaterial).length,
    environmental: metrics.filter(m => m.category === 'environmental').length,
    social: metrics.filter(m => m.category === 'social').length,
    governance: metrics.filter(m => m.category === 'governance').length,
  };

  const report = {
    id: `RPT-${Date.now()}`,
    organizationId: orgId,
    type,
    periodStart: periodStart || new Date(new Date().getFullYear(), 0, 1).toISOString(),
    periodEnd: periodEnd || new Date(new Date().getFullYear(), 11, 31).toISOString(),
    generatedAt: new Date().toISOString(),
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} ESG Report`,
    framework: 'ESRS / GRI',
    summary: totals,
    metrics: metrics.map(m => ({
      id: m.id,
      category: m.category,
      subcategory: m.subcategory,
      name: m.name,
      value: m.value,
      unit: m.unit,
      esrsStandard: m.esrsStandard,
      reportingPeriod: m.reportingPeriod,
      verified: m.verified,
    })),
    materiality: materiality.map(mt => ({
      id: mt.id,
      topic: mt.topic,
      esrsStandard: mt.esrsStandard,
      isMaterial: mt.isMaterial,
      financialImpact: mt.financialImpact,
      impactOnSociety: mt.impactOnSociety,
    })),
  };

  await logControllerAction(req, 'esg.report_generated', { ip: req.ip });
  res.status(201).json(report);
};

// Returns recently generated reports (currently a synthetic listing built from
// the most recent metrics; surfaces the same shape generateESGReport returns
// so the UI can render either source identically).
export const listESGReports: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const recent = await prisma.eSGMetric.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: 'desc' },
    take: 1,
  });
  if (recent.length === 0) {
    res.json([]);
    return;
  }
  const year = new Date(recent[0].updatedAt).getFullYear();
  res.json([
    {
      id: `RPT-${year}-annual`,
      organizationId: orgId,
      type: 'annual',
      title: `${year} Annual ESG Report`,
      generatedAt: recent[0].updatedAt,
      framework: 'ESRS / GRI',
    },
  ]);
};

// ============================================================================
// SBOM MANAGER
// ============================================================================

export const listSBOMEntries: RequestHandler = async (req, res) => {
  const { repositoryName, licenseRisk } = req.query;
  const where: any = { organizationId: getOrgId(req) };
  if (repositoryName) where.repositoryName = repositoryName;
  if (licenseRisk) where.licenseRisk = licenseRisk;
  const entries = await prisma.sBOMEntry.findMany({ where, orderBy: { componentName: 'asc' } });
  res.json(entries);
};

export const createSBOMEntry: RequestHandler = async (req, res) => {
  const { componentName, componentVersion } = req.body;
  if (!componentName || !componentVersion) {
    throw new AppError('componentName and componentVersion are required', 400);
  }
  const entry = await prisma.sBOMEntry.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'sbom.entry_created', { ip: req.ip });
  res.status(201).json(entry);
};

export const updateSBOMEntry: RequestHandler = async (req, res) => {
  await assertOrgOwned('sBOMEntry', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const entry = await prisma.sBOMEntry.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'sbom.entry_updated', { ip: req.ip });
  res.json(entry);
};

export const deleteSBOMEntry: RequestHandler = async (req, res) => {
  await assertOrgOwned('sBOMEntry', req.params.id, getOrgId(req));
  await prisma.sBOMEntry.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'sbom.entry_deleted', { ip: req.ip });
  res.json({ success: true });
};

export const bulkCreateSBOMEntries: RequestHandler = async (req, res) => {
  const { entries } = req.body;
  if (!entries || !Array.isArray(entries)) throw new AppError('entries array is required', 400);
  const orgId = getOrgId(req);
  const result = await prisma.sBOMEntry.createMany({
    data: entries.map((e: any) => ({ ...e, organizationId: orgId })),
    skipDuplicates: true,
  });
  await logControllerAction(req, 'sbom.entries_bulk_created', { ip: req.ip });
  res.status(201).json({ created: result.count });
};

export const listSBOMRepositories: RequestHandler = async (req, res) => {
  const repos = await prisma.sBOMRepository.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(repos);
};

export const createSBOMRepository: RequestHandler = async (req, res) => {
  const { name } = req.body;
  if (!name) throw new AppError('name is required', 400);
  const repo = await prisma.sBOMRepository.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'sbom.repository_created', { ip: req.ip });
  res.status(201).json(repo);
};

export const updateSBOMRepository: RequestHandler = async (req, res) => {
  await assertOrgOwned('sBOMRepository', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const repo = await prisma.sBOMRepository.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'sbom.repository_updated', { ip: req.ip });
  res.json(repo);
};

export const deleteSBOMRepository: RequestHandler = async (req, res) => {
  await assertOrgOwned('sBOMRepository', req.params.id, getOrgId(req));
  await prisma.sBOMRepository.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'sbom.repository_deleted', { ip: req.ip });
  res.json({ success: true });
};

/**
 * Aggregates license data from SBOM entries, grouping by license name and
 * computing component counts, risk levels, and compatibility data.
 */
export const listSBOMLicenses: RequestHandler = async (req, res) => {
  try {
    const entries = await prisma.sBOMEntry.findMany({
      where: { organizationId: getOrgId(req) },
      select: { license: true, licenseRisk: true },
    });

    // License classification reference data
    const LICENSE_DB: Record<string, { spdxId: string; name: string; category: string; obligations: string[]; compatible: boolean; notes: string }> = {
      'MIT': { spdxId: 'MIT', name: 'MIT License', category: 'Permissive', obligations: ['Include copyright notice', 'Include license text'], compatible: true, notes: 'Most permissive. No issues for commercial use.' },
      'Apache-2.0': { spdxId: 'Apache-2.0', name: 'Apache License 2.0', category: 'Permissive', obligations: ['Include copyright notice', 'Include license text', 'State changes', 'Include NOTICE file'], compatible: true, notes: 'Patent grant included. Compatible with most other licenses.' },
      'LGPL-2.1': { spdxId: 'LGPL-2.1', name: 'GNU Lesser General Public License v2.1', category: 'Weak Copyleft', obligations: ['Provide source for LGPL components', 'Allow relinking', 'Include license text', 'State changes'], compatible: true, notes: 'Dynamic linking generally acceptable. Static linking may trigger copyleft.' },
      'GPL-3.0': { spdxId: 'GPL-3.0', name: 'GNU General Public License v3.0', category: 'Copyleft', obligations: ['Provide complete source code', 'Include license text', 'State changes', 'No additional restrictions', 'Preserve installation information'], compatible: false, notes: 'Strong copyleft. May require full source disclosure of derivative works.' },
      'BSD-3-Clause': { spdxId: 'BSD-3-Clause', name: 'BSD 3-Clause License', category: 'Permissive', obligations: ['Include copyright notice', 'Include license text'], compatible: true, notes: 'Very permissive. No endorsement clause.' },
      'ISC': { spdxId: 'ISC', name: 'ISC License', category: 'Permissive', obligations: ['Include copyright notice'], compatible: true, notes: 'Functionally equivalent to MIT.' },
    };

    // Group entries by license
    const licenseMap = new Map<string, { count: number; risk: string }>();
    for (const entry of entries) {
      const lic = entry.license || 'Unknown';
      const existing = licenseMap.get(lic);
      if (existing) {
        existing.count += 1;
        // Keep the highest risk level
        const riskRank: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 };
        if ((riskRank[entry.licenseRisk || 'None'] || 0) > (riskRank[existing.risk] || 0)) {
          existing.risk = entry.licenseRisk || 'None';
        }
      } else {
        licenseMap.set(lic, { count: 1, risk: entry.licenseRisk || 'None' });
      }
    }

    const licenses = Array.from(licenseMap.entries()).map(([license, data], idx) => {
      const ref = LICENSE_DB[license];
      return {
        id: `L${String(idx + 1).padStart(3, '0')}`,
        spdxId: ref?.spdxId || license,
        name: ref?.name || license,
        category: ref?.category || 'Proprietary',
        risk: data.risk,
        componentCount: data.count,
        obligations: ref?.obligations || ['Comply with specific license terms'],
        compatible: ref?.compatible ?? false,
        notes: ref?.notes || 'Review specific license terms.',
      };
    });

    res.json(licenses);
  } catch (error) {
    logger.error('Error aggregating SBOM licenses:', error);
    throw error instanceof AppError ? error : new AppError('Failed to aggregate SBOM licenses', 500);
  }
};

// ============================================================================
// POST-MARKET SURVEILLANCE
// ============================================================================

export const listSurveillancePlans: RequestHandler = async (req, res) => {
  try {
    const plans = await prisma.surveillancePlan.findMany({
      where: { organizationId: getOrgId(req) },
      include: { incidents: { orderBy: { reportedDate: 'desc' }, take: 10 } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (error) {
    logger.error('Error fetching surveillance plans:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch surveillance plans', 500);
  }
};

export const createSurveillancePlan: RequestHandler = async (req, res) => {
  const { productName, planType, frequency } = req.body;
  if (!productName || !planType || !frequency) {
    throw new AppError('productName, planType, and frequency are required', 400);
  }
  const plan = await prisma.surveillancePlan.create({
    data: { organizationId: getOrgId(req), ...req.body, nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined },
    include: { incidents: true },
  });
  await logControllerAction(req, 'surveillance.plan_created', { ip: req.ip });
  res.status(201).json(plan);
};

export const updateSurveillancePlan: RequestHandler = async (req, res) => {
  await assertOrgOwned('surveillancePlan', req.params.id, getOrgId(req));
  const data = { ...req.body };
  if (data.lastReviewDate) data.lastReviewDate = new Date(data.lastReviewDate);
  if (data.nextReviewDate) data.nextReviewDate = new Date(data.nextReviewDate);
  delete data.organizationId;
  const plan = await prisma.surveillancePlan.update({
    where: { id: req.params.id }, data,
    include: { incidents: true },
  });
  await logControllerAction(req, 'surveillance.plan_updated', { ip: req.ip });
  res.json(plan);
};

export const deleteSurveillancePlan: RequestHandler = async (req, res) => {
  await assertOrgOwned('surveillancePlan', req.params.id, getOrgId(req));
  await prisma.surveillancePlan.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'surveillance.plan_deleted', { ip: req.ip });
  res.json({ success: true });
};

export const createSurveillanceIncident: RequestHandler = async (req, res) => {
  const { planId, type, severity, title, reportedDate } = req.body;
  if (!planId || !type || !severity || !title || !reportedDate) {
    throw new AppError('planId, type, severity, title, and reportedDate are required', 400);
  }
  await assertOrgOwned('surveillancePlan', planId, getOrgId(req));
  const incident = await prisma.surveillanceIncident.create({
    data: { ...req.body, reportedDate: new Date(reportedDate) },
  });
  await logControllerAction(req, 'surveillance.incident_created', { ip: req.ip });
  res.status(201).json(incident);
};

export const updateSurveillanceIncident: RequestHandler = async (req, res) => {
  await assertOwnedByOrg('surveillanceIncident', req.params.id, { plan: { organizationId: getOrgId(req) } });
  const data = { ...req.body };
  if (data.reportedDate) data.reportedDate = new Date(data.reportedDate);
  delete data.planId;
  const incident = await prisma.surveillanceIncident.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'surveillance.incident_updated', { ip: req.ip });
  res.json(incident);
};

// --- Product Recalls ---
export const listProductRecalls: RequestHandler = async (req, res) => {
  try {
    const recalls = await prisma.productRecall.findMany({
      where: { organizationId: getOrgId(req) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(recalls);
  } catch (error) {
    logger.error('Error fetching product recalls:', error);
    throw error instanceof AppError ? error : new AppError('Failed to fetch product recalls', 500);
  }
};

export const createProductRecall: RequestHandler = async (req, res) => {
  const { productName, recallType, reason } = req.body;
  if (!productName || !recallType || !reason) {
    throw new AppError('productName, recallType, and reason are required', 400);
  }
  const recall = await prisma.productRecall.create({
    data: {
      organizationId: getOrgId(req), ...req.body,
      notificationDate: req.body.notificationDate ? new Date(req.body.notificationDate) : undefined,
    },
  });
  await logControllerAction(req, 'recall.created', { ip: req.ip });
  res.status(201).json(recall);
};

export const updateProductRecall: RequestHandler = async (req, res) => {
  await assertOrgOwned('productRecall', req.params.id, getOrgId(req));
  const data = { ...req.body };
  if (data.notificationDate) data.notificationDate = new Date(data.notificationDate);
  if (data.completionDate) data.completionDate = new Date(data.completionDate);
  delete data.organizationId;
  const recall = await prisma.productRecall.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'recall.updated', { ip: req.ip });
  res.json(recall);
};

// ============================================================================
// PRODUCT DECOMMISSIONING
// ============================================================================

export const listProductDecommissions: RequestHandler = async (req, res) => {
  const products = await prisma.productDecommission.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
};

export const createProductDecommission: RequestHandler = async (req, res) => {
  const { productName } = req.body;
  if (!productName) throw new AppError('productName is required', 400);
  const product = await prisma.productDecommission.create({
    data: {
      organizationId: getOrgId(req), ...req.body,
      endOfSaleDate: req.body.endOfSaleDate ? new Date(req.body.endOfSaleDate) : undefined,
      endOfSupportDate: req.body.endOfSupportDate ? new Date(req.body.endOfSupportDate) : undefined,
      endOfLifeDate: req.body.endOfLifeDate ? new Date(req.body.endOfLifeDate) : undefined,
      decommissionDate: req.body.decommissionDate ? new Date(req.body.decommissionDate) : undefined,
    },
  });
  await logControllerAction(req, 'decommission.created', { ip: req.ip });
  res.status(201).json(product);
};

export const updateProductDecommission: RequestHandler = async (req, res) => {
  await assertOrgOwned('productDecommission', req.params.id, getOrgId(req));
  const data = { ...req.body };
  for (const dateField of ['endOfSaleDate', 'endOfSupportDate', 'endOfLifeDate', 'decommissionDate']) {
    if (data[dateField]) data[dateField] = new Date(data[dateField]);
  }
  delete data.organizationId;
  const product = await prisma.productDecommission.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'decommission.updated', { ip: req.ip });
  res.json(product);
};

export const deleteProductDecommission: RequestHandler = async (req, res) => {
  await assertOrgOwned('productDecommission', req.params.id, getOrgId(req));
  await prisma.productDecommission.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'decommission.deleted', { ip: req.ip });
  res.json({ success: true });
};

// --- Product Decommission Customer Notifications ---
//
// Notifications are stored inside each ProductDecommission row's customerNotifications
// JSON array rather than a dedicated table. Each notification carries the owning
// productId and a stable id; ids absent on legacy rows are generated and backfilled on
// the next write so updates can target a specific entry.

type DecommissionNotification = Record<string, unknown> & { id?: string; productId?: string };

const asNotificationArray = (value: unknown): DecommissionNotification[] =>
  Array.isArray(value) ? (value as DecommissionNotification[]) : [];

export const listDecommissionNotifications: RequestHandler = async (req, res) => {
  const { productId } = req.query;
  const where: any = { organizationId: getOrgId(req) };
  if (productId) where.id = productId as string;
  const products = await prisma.productDecommission.findMany({
    where,
    select: { id: true, customerNotifications: true },
  });

  const flattened: DecommissionNotification[] = [];
  for (const product of products) {
    for (const notification of asNotificationArray(product.customerNotifications)) {
      flattened.push({
        ...notification,
        id: notification.id || uuidv4(),
        productId: product.id,
      });
    }
  }
  res.json(flattened);
};

export const createDecommissionNotification: RequestHandler = async (req, res) => {
  const { productId, ...rest } = req.body;
  if (!productId) throw new AppError('productId is required', 400);
  await assertOrgOwned('productDecommission', productId, getOrgId(req));

  const product = await prisma.productDecommission.findUnique({
    where: { id: productId },
    select: { customerNotifications: true },
  });
  if (!product) throw new AppError('Decommission record not found', 404);

  const notifications = asNotificationArray(product.customerNotifications);
  const notification: DecommissionNotification = {
    ...rest,
    id: uuidv4(),
    productId,
    status: rest.status || 'draft',
    createdAt: new Date().toISOString(),
  };

  await prisma.productDecommission.update({
    where: { id: productId },
    data: { customerNotifications: [...notifications, notification] as any },
  });
  await logControllerAction(req, 'decommission.notification_created', { ip: req.ip });
  res.status(201).json(notification);
};

export const updateDecommissionNotification: RequestHandler = async (req, res) => {
  const { productId, ...patch } = req.body;
  if (!productId) throw new AppError('productId is required', 400);
  await assertOrgOwned('productDecommission', productId, getOrgId(req));

  const product = await prisma.productDecommission.findUnique({
    where: { id: productId },
    select: { customerNotifications: true },
  });
  if (!product) throw new AppError('Decommission record not found', 404);

  const notifications = asNotificationArray(product.customerNotifications);
  let updated: DecommissionNotification | null = null;
  const next = notifications.map((notification) => {
    const notificationId = notification.id || uuidv4();
    if (notificationId === req.params.id) {
      updated = { ...notification, ...patch, id: notificationId, productId };
      return updated;
    }
    // Backfill a stable id onto any legacy entry that lacks one.
    return { ...notification, id: notificationId };
  });

  if (!updated) throw new AppError('Notification not found', 404);

  await prisma.productDecommission.update({
    where: { id: productId },
    data: { customerNotifications: next as any },
  });
  await logControllerAction(req, 'decommission.notification_updated', { ip: req.ip });
  res.json(updated);
};

// ============================================================================
// ENVIRONMENTAL LIFECYCLE ASSESSMENT
// ============================================================================

export const listLifecycleAssessments: RequestHandler = async (req, res) => {
  const assessments = await prisma.lifecycleAssessment.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assessments);
};

export const createLifecycleAssessment: RequestHandler = async (req, res) => {
  const { productName } = req.body;
  if (!productName) throw new AppError('productName is required', 400);
  const assessment = await prisma.lifecycleAssessment.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'lifecycle.assessment_created', { ip: req.ip });
  res.status(201).json(assessment);
};

export const getLifecycleAssessment: RequestHandler = async (req, res) => {
  const assessment = await prisma.lifecycleAssessment.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!assessment) throw new AppError('Assessment not found', 404);
  res.json(assessment);
};

export const updateLifecycleAssessment: RequestHandler = async (req, res) => {
  await assertOrgOwned('lifecycleAssessment', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const assessment = await prisma.lifecycleAssessment.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'lifecycle.assessment_updated', { ip: req.ip });
  res.json(assessment);
};

export const deleteLifecycleAssessment: RequestHandler = async (req, res) => {
  await assertOrgOwned('lifecycleAssessment', req.params.id, getOrgId(req));
  await prisma.lifecycleAssessment.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'lifecycle.assessment_deleted', { ip: req.ip });
  res.json({ success: true });
};

// ============================================================================
// PRODUCT LIFECYCLE TRACKER
// ============================================================================

export const listProductLifecycles: RequestHandler = async (req, res) => {
  const { currentStage } = req.query;
  const where: any = { organizationId: getOrgId(req) };
  if (currentStage) where.currentStage = currentStage;
  const products = await prisma.productLifecycle.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(products);
};

export const createProductLifecycle: RequestHandler = async (req, res) => {
  const { productName } = req.body;
  if (!productName) throw new AppError('productName is required', 400);
  const product = await prisma.productLifecycle.create({
    data: {
      organizationId: getOrgId(req), ...req.body,
      marketEntry: req.body.marketEntry ? new Date(req.body.marketEntry) : undefined,
      marketExit: req.body.marketExit ? new Date(req.body.marketExit) : undefined,
    },
  });
  await logControllerAction(req, 'lifecycle.product_created', { ip: req.ip });
  res.status(201).json(product);
};

export const getProductLifecycle: RequestHandler = async (req, res) => {
  const product = await prisma.productLifecycle.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
};

export const updateProductLifecycle: RequestHandler = async (req, res) => {
  await assertOrgOwned('productLifecycle', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  if (data.marketEntry) data.marketEntry = new Date(data.marketEntry);
  if (data.marketExit) data.marketExit = new Date(data.marketExit);
  const product = await prisma.productLifecycle.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'lifecycle.product_updated', { ip: req.ip });
  res.json(product);
};

export const deleteProductLifecycle: RequestHandler = async (req, res) => {
  await assertOrgOwned('productLifecycle', req.params.id, getOrgId(req));
  await prisma.productLifecycle.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'lifecycle.product_deleted', { ip: req.ip });
  res.json({ success: true });
};

// ============================================================================
// PROCESS MAPPER
// ============================================================================

export const listProcessMaps: RequestHandler = async (req, res) => {
  const { category } = req.query;
  const where: any = { organizationId: getOrgId(req) };
  if (category) where.category = category;
  const maps = await prisma.processMap.findMany({ where, orderBy: { updatedAt: 'desc' } });
  res.json(maps);
};

export const createProcessMap: RequestHandler = async (req, res) => {
  const { name, nodes, edges } = req.body;
  if (!name || !nodes || !edges) throw new AppError('name, nodes, and edges are required', 400);
  const map = await prisma.processMap.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  await logControllerAction(req, 'process_map.created', { ip: req.ip });
  res.status(201).json(map);
};

export const getProcessMap: RequestHandler = async (req, res) => {
  const map = await prisma.processMap.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!map) throw new AppError('Process map not found', 404);
  res.json(map);
};

export const updateProcessMap: RequestHandler = async (req, res) => {
  await assertOrgOwned('processMap', req.params.id, getOrgId(req));
  const data = { ...req.body };
  delete data.organizationId;
  const map = await prisma.processMap.update({ where: { id: req.params.id }, data });
  await logControllerAction(req, 'process_map.updated', { ip: req.ip });
  res.json(map);
};

export const deleteProcessMap: RequestHandler = async (req, res) => {
  await assertOrgOwned('processMap', req.params.id, getOrgId(req));
  await prisma.processMap.delete({ where: { id: req.params.id } });
  await logControllerAction(req, 'process_map.deleted', { ip: req.ip });
  res.json({ success: true });
};

// ============================================================================
// INTER-MODULE DATA SYNC
// ============================================================================

/**
 * Sync SBOM data to product decommissioning and lifecycle modules.
 * When SBOM vulnerabilities change, affected products get flagged.
 */
export const syncSBOMToModules: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);

  // Get all SBOM entries with critical/high vulnerabilities
  const criticalEntries = await prisma.sBOMEntry.findMany({
    where: {
      organizationId: orgId,
      OR: [
        { licenseRisk: 'critical' },
        { licenseRisk: 'high' },
      ],
    },
  });

  // Get all product lifecycles
  const products = await prisma.productLifecycle.findMany({
    where: { organizationId: orgId },
  });

  // Get all product decommissions
  const decommissions = await prisma.productDecommission.findMany({
    where: { organizationId: orgId },
  });

  const updates: string[] = [];

  // Update product lifecycles with SBOM vulnerability info
  for (const product of products) {
    const productSBOM = criticalEntries.filter(e =>
      e.repositoryName && product.productName.toLowerCase().includes(e.repositoryName.toLowerCase())
    );
    if (productSBOM.length > 0) {
      const reqs = (product.regulatoryRequirements as any[]) || [];
      const sbomReq = {
        framework: 'SBOM',
        requirement: `${productSBOM.length} critical/high vulnerability components detected`,
        status: 'action_required',
        lastSync: new Date().toISOString(),
      };
      const updatedReqs = [...reqs.filter((r: any) => r.framework !== 'SBOM'), sbomReq];
      // Org-scope the write so the mutation enforces tenant ownership directly,
      // independent of the source query that produced this id.
      await prisma.productLifecycle.updateMany({
        where: { id: product.id, organizationId: orgId },
        data: { regulatoryRequirements: updatedReqs },
      });
      updates.push(`Updated ${product.productName} with SBOM data`);
    }
  }

  // Flag decommissioning products that have unresolved SBOM vulnerabilities
  for (const decom of decommissions) {
    if (decom.lifecycleStage !== 'decommissioned') {
      const productSBOM = criticalEntries.filter(e =>
        e.repositoryName && decom.productName.toLowerCase().includes(e.repositoryName.toLowerCase())
      );
      if (productSBOM.length > 0) {
        const patches = (decom.securityPatches as any) || {};
        patches.sbomVulnerabilities = productSBOM.length;
        patches.lastSBOMSync = new Date().toISOString();
        await prisma.productDecommission.updateMany({
          where: { id: decom.id, organizationId: orgId },
          data: { securityPatches: patches },
        });
        updates.push(`Flagged ${decom.productName} decommission with SBOM vulnerabilities`);
      }
    }
  }

  await logControllerAction(req, 'sync.sbom_to_modules', { ip: req.ip });
  res.json({ success: true, updates, syncedAt: new Date().toISOString() });
};

/**
 * Sync breach data to surveillance and governance modules.
 */
export const syncBreachToModules: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);

  const activeBreaches = await prisma.breachIncident.findMany({
    where: {
      organizationId: orgId,
      status: { in: ['detected', 'investigating', 'contained'] },
    },
  });

  const updates: string[] = [];

  // Create surveillance incidents for active breaches
  const plans = await prisma.surveillancePlan.findMany({
    where: { organizationId: orgId, status: 'active' },
  });

  // Both `plans` and `activeBreaches` are filtered by organizationId above, so every
  // plan.id / breach.id referenced below is guaranteed to belong to the caller's org.
  for (const breach of activeBreaches) {
    for (const plan of plans) {
      const existingIncident = await prisma.surveillanceIncident.findFirst({
        where: { planId: plan.id, capaId: breach.id },
      });
      if (!existingIncident) {
        await prisma.surveillanceIncident.create({
          data: {
            planId: plan.id,
            type: 'safety_incident',
            severity: breach.severity,
            title: `Breach: ${breach.title}`,
            description: breach.description,
            reportedDate: breach.discoveryDate,
            investigationStatus: 'open',
            capaId: breach.id,
          },
        });
        updates.push(`Created surveillance incident for breach: ${breach.title}`);
      }
    }
  }

  await logControllerAction(req, 'sync.breach_to_modules', { ip: req.ip });
  res.json({ success: true, updates, syncedAt: new Date().toISOString() });
};

// ============================================================================
// CONNECTION TESTING
// ============================================================================

export const testIntegrationConnection: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { provider } = req.params;

  const integration = await prisma.integration.findFirst({
    where: { organizationId: orgId, provider, connected: true },
  });

  if (!integration) {
    res.status(404).json({ connected: false, error: `No active ${provider} integration found` });
    return;
  }

  // Check token expiry
  if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
    res.json({ connected: true, healthy: false, error: 'Token expired — needs refresh', provider, lastSync: integration.lastSync });
    return;
  }

  // Token exists and not expired
  res.json({
    connected: true,
    healthy: true,
    provider,
    lastSync: integration.lastSync,
    expiresAt: integration.expiresAt,
    hasAccessToken: !!integration.accessToken,
    hasRefreshToken: !!integration.refreshToken,
  });
};

// ============================================================================
// REGULATION MODULE DATA (NIS2, US Privacy, Ecodesign, EU CRA, CSRD)
// ============================================================================

export const getRegulationModuleData: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { module, dataType } = req.params;
  const record = await prisma.regulationModuleData.findUnique({
    where: { organizationId_module_dataType: { organizationId: orgId, module, dataType } },
  });
  res.json(record?.data ?? null);
};

export const getAllRegulationModuleData: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { module } = req.params;
  const records = await prisma.regulationModuleData.findMany({
    where: { organizationId: orgId, module },
    orderBy: { updatedAt: 'desc' },
  });
  const result: Record<string, any> = {};
  for (const r of records) result[r.dataType] = r.data;
  res.json(result);
};

export const upsertRegulationModuleData: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { module, dataType } = req.params;
  const { data } = req.body;
  if (!data) throw new AppError('data field is required', 400);
  const record = await prisma.regulationModuleData.upsert({
    where: { organizationId_module_dataType: { organizationId: orgId, module, dataType } },
    create: { organizationId: orgId, module, dataType, data },
    update: { data, updatedAt: new Date() },
  });
  await logControllerAction(req, 'regulation_module.data_upserted', { ip: req.ip });
  res.json(record.data);
};

export const deleteRegulationModuleData: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { module, dataType } = req.params;
  await prisma.regulationModuleData.deleteMany({
    where: { organizationId: orgId, module, dataType },
  });
  await logControllerAction(req, 'regulation_module.data_deleted', { ip: req.ip });
  res.json({ success: true });
};

// ============================================================================
// METRICS HISTORY (for RealTime Analytics)
// ============================================================================

export const recordMetric: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { metricType, value, metadata } = req.body;
  if (!metricType || value === undefined) throw new AppError('metricType and value are required', 400);
  const record = await prisma.metricsHistory.create({
    data: { organizationId: orgId, metricType, value: parseFloat(value), metadata: metadata || undefined },
  });
  res.status(201).json(record);
};

export const getMetricsHistory: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const { metricType } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const records = await prisma.metricsHistory.findMany({
    where: { organizationId: orgId, metricType, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
    take: 1000,
  });
  res.json(records);
};

export const getLatestMetrics: RequestHandler = async (req, res) => {
  const orgId = getOrgId(req);
  const metricTypes = ['compliance-score', 'risks-detected', 'controls-passed', 'active-users', 'frameworks-active'];
  const latest: Record<string, any> = {};
  for (const mt of metricTypes) {
    const record = await prisma.metricsHistory.findFirst({
      where: { organizationId: orgId, metricType: mt },
      orderBy: { recordedAt: 'desc' },
    });
    latest[mt] = record || null;
  }
  res.json(latest);
};
