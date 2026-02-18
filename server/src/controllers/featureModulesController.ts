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
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

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
  if (!name || !type) { res.status(400).json({ error: 'name and type are required' }); return; }
  const body = await prisma.governanceBody.create({
    data: { organizationId: getOrgId(req), name, type, charter, meetingFrequency, members, status: 'active' },
    include: { meetings: true, decisions: true, escalationPaths: true },
  });
  res.status(201).json(body);
};

export const updateGovernanceBody: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const body = await prisma.governanceBody.update({
    where: { id },
    data: req.body,
    include: { meetings: true, decisions: true, escalationPaths: true },
  });
  res.json(body);
};

export const deleteGovernanceBody: RequestHandler = async (req, res) => {
  await prisma.governanceBody.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

// --- Governance Meetings ---
export const createMeeting: RequestHandler = async (req, res) => {
  const { governanceBodyId, title, date, duration, agenda, attendees } = req.body;
  if (!governanceBodyId || !title || !date) { res.status(400).json({ error: 'governanceBodyId, title, and date are required' }); return; }
  const meeting = await prisma.governanceMeeting.create({
    data: { governanceBodyId, title, date: new Date(date), duration, agenda, attendees, status: 'scheduled' },
  });
  res.status(201).json(meeting);
};

export const updateMeeting: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.date) data.date = new Date(data.date);
  const meeting = await prisma.governanceMeeting.update({ where: { id: req.params.id }, data });
  res.json(meeting);
};

export const deleteMeeting: RequestHandler = async (req, res) => {
  await prisma.governanceMeeting.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

// --- Governance Decisions ---
export const createDecision: RequestHandler = async (req, res) => {
  const { governanceBodyId, title, description, decisionType } = req.body;
  if (!governanceBodyId || !title || !decisionType) { res.status(400).json({ error: 'governanceBodyId, title, and decisionType are required' }); return; }
  const decision = await prisma.governanceDecision.create({
    data: { governanceBodyId, title, description, decisionType, status: 'proposed', ...req.body },
  });
  res.status(201).json(decision);
};

export const updateDecision: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.effectiveDate) data.effectiveDate = new Date(data.effectiveDate);
  if (data.reviewDate) data.reviewDate = new Date(data.reviewDate);
  const decision = await prisma.governanceDecision.update({ where: { id: req.params.id }, data });
  res.json(decision);
};

// --- Escalation Paths ---
export const createEscalationPath: RequestHandler = async (req, res) => {
  const { governanceBodyId, name, triggerCriteria, levels } = req.body;
  if (!governanceBodyId || !name) { res.status(400).json({ error: 'governanceBodyId and name are required' }); return; }
  const path = await prisma.escalationPath.create({
    data: { governanceBodyId, name, triggerCriteria: triggerCriteria || [], levels: levels || [] },
  });
  res.status(201).json(path);
};

export const updateEscalationPath: RequestHandler = async (req, res) => {
  const path = await prisma.escalationPath.update({ where: { id: req.params.id }, data: req.body });
  res.json(path);
};

export const deleteEscalationPath: RequestHandler = async (req, res) => {
  await prisma.escalationPath.delete({ where: { id: req.params.id } });
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
  if (!name || !email) { res.status(400).json({ error: 'name and email are required' }); return; }
  const profile = await prisma.dPOProfile.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, name, email, phone, certifications, appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined, registeredWithDPA, dpaRegistrationRef, tasks, activityLog },
    update: { name, email, phone, certifications, appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined, registeredWithDPA, dpaRegistrationRef, tasks, activityLog },
  });
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
    res.status(400).json({ error: 'title, breachType, severity, and discoveryDate are required' }); return;
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
  res.status(201).json(incident);
};

export const getBreachIncident: RequestHandler = async (req, res) => {
  const incident = await prisma.breachIncident.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
    include: { notifications: true },
  });
  if (!incident) { res.status(404).json({ error: 'Breach incident not found' }); return; }
  res.json(incident);
};

export const updateBreachIncident: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.discoveryDate) data.discoveryDate = new Date(data.discoveryDate);
  delete data.organizationId;
  const incident = await prisma.breachIncident.update({
    where: { id: req.params.id },
    data,
    include: { notifications: true },
  });
  res.json(incident);
};

export const deleteBreachIncident: RequestHandler = async (req, res) => {
  await prisma.breachIncident.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

// --- Breach Notifications ---
export const createBreachNotification: RequestHandler = async (req, res) => {
  const { breachId, recipientType, jurisdiction, authority, content, dueDate } = req.body;
  if (!breachId || !recipientType) { res.status(400).json({ error: 'breachId and recipientType are required' }); return; }
  const notification = await prisma.breachNotification.create({
    data: { breachId, recipientType, jurisdiction, authority, content, dueDate: dueDate ? new Date(dueDate) : undefined, status: 'draft' },
  });
  res.status(201).json(notification);
};

export const updateBreachNotification: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.sentAt) data.sentAt = new Date(data.sentAt);
  const notification = await prisma.breachNotification.update({ where: { id: req.params.id }, data });
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
    res.status(400).json({ error: 'name, jurisdiction, recipientType, and body are required' }); return;
  }
  const template = await prisma.breachTemplate.create({
    data: { organizationId: getOrgId(req), name, jurisdiction, recipientType, subject, body, variables },
  });
  res.status(201).json(template);
};

export const updateBreachTemplate: RequestHandler = async (req, res) => {
  const template = await prisma.breachTemplate.update({ where: { id: req.params.id }, data: req.body });
  res.json(template);
};

export const deleteBreachTemplate: RequestHandler = async (req, res) => {
  await prisma.breachTemplate.delete({ where: { id: req.params.id } });
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
    res.status(400).json({ error: 'name, authority, and jurisdiction are required' }); return;
  }
  const contact = await prisma.regulatoryContact.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(contact);
};

export const updateRegulatoryContact: RequestHandler = async (req, res) => {
  const contact = await prisma.regulatoryContact.update({ where: { id: req.params.id }, data: req.body });
  res.json(contact);
};

export const deleteRegulatoryContact: RequestHandler = async (req, res) => {
  await prisma.regulatoryContact.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

// ============================================================================
// CE MARKING WORKFLOW
// ============================================================================

export const listCEProducts: RequestHandler = async (req, res) => {
  const products = await prisma.cEProduct.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
};

export const createCEProduct: RequestHandler = async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) { res.status(400).json({ error: 'name and category are required' }); return; }
  const product = await prisma.cEProduct.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(product);
};

export const getCEProduct: RequestHandler = async (req, res) => {
  const product = await prisma.cEProduct.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!product) { res.status(404).json({ error: 'CE product not found' }); return; }
  res.json(product);
};

export const updateCEProduct: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  delete data.organizationId;
  if (data.ceMarkedDate) data.ceMarkedDate = new Date(data.ceMarkedDate);
  if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
  const product = await prisma.cEProduct.update({ where: { id: req.params.id }, data });
  res.json(product);
};

export const deleteCEProduct: RequestHandler = async (req, res) => {
  await prisma.cEProduct.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

// ============================================================================
// DIGITAL PRODUCT PASSPORT
// ============================================================================

export const listDPPs: RequestHandler = async (req, res) => {
  const passports = await prisma.digitalProductPassport.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(passports);
};

export const createDPP: RequestHandler = async (req, res) => {
  const { productName } = req.body;
  if (!productName) { res.status(400).json({ error: 'productName is required' }); return; }
  const passport = await prisma.digitalProductPassport.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(passport);
};

export const getDPP: RequestHandler = async (req, res) => {
  const passport = await prisma.digitalProductPassport.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!passport) { res.status(404).json({ error: 'Digital Product Passport not found' }); return; }
  res.json(passport);
};

export const updateDPP: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  delete data.organizationId;
  if (data.manufacturingDate) data.manufacturingDate = new Date(data.manufacturingDate);
  const passport = await prisma.digitalProductPassport.update({ where: { id: req.params.id }, data });
  res.json(passport);
};

export const deleteDPP: RequestHandler = async (req, res) => {
  await prisma.digitalProductPassport.delete({ where: { id: req.params.id } });
  res.json({ success: true });
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

export const createESGMetric: RequestHandler = async (req, res) => {
  const { category, subcategory, name, value, unit } = req.body;
  if (!category || !subcategory || !name || value === undefined || !unit) {
    res.status(400).json({ error: 'category, subcategory, name, value, and unit are required' }); return;
  }
  const metric = await prisma.eSGMetric.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(metric);
};

export const updateESGMetric: RequestHandler = async (req, res) => {
  const metric = await prisma.eSGMetric.update({ where: { id: req.params.id }, data: req.body });
  res.json(metric);
};

export const deleteESGMetric: RequestHandler = async (req, res) => {
  await prisma.eSGMetric.delete({ where: { id: req.params.id } });
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
  if (!topic) { res.status(400).json({ error: 'topic is required' }); return; }
  const assessment = await prisma.materialityAssessment.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(assessment);
};

export const updateMaterialityAssessment: RequestHandler = async (req, res) => {
  const assessment = await prisma.materialityAssessment.update({ where: { id: req.params.id }, data: req.body });
  res.json(assessment);
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
    res.status(400).json({ error: 'componentName and componentVersion are required' }); return;
  }
  const entry = await prisma.sBOMEntry.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(entry);
};

export const updateSBOMEntry: RequestHandler = async (req, res) => {
  const entry = await prisma.sBOMEntry.update({ where: { id: req.params.id }, data: req.body });
  res.json(entry);
};

export const deleteSBOMEntry: RequestHandler = async (req, res) => {
  await prisma.sBOMEntry.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

export const bulkCreateSBOMEntries: RequestHandler = async (req, res) => {
  const { entries } = req.body;
  if (!entries || !Array.isArray(entries)) { res.status(400).json({ error: 'entries array is required' }); return; }
  const orgId = getOrgId(req);
  const result = await prisma.sBOMEntry.createMany({
    data: entries.map((e: any) => ({ ...e, organizationId: orgId })),
    skipDuplicates: true,
  });
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
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const repo = await prisma.sBOMRepository.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(repo);
};

export const updateSBOMRepository: RequestHandler = async (req, res) => {
  const repo = await prisma.sBOMRepository.update({ where: { id: req.params.id }, data: req.body });
  res.json(repo);
};

export const deleteSBOMRepository: RequestHandler = async (req, res) => {
  await prisma.sBOMRepository.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

// ============================================================================
// POST-MARKET SURVEILLANCE
// ============================================================================

export const listSurveillancePlans: RequestHandler = async (req, res) => {
  const plans = await prisma.surveillancePlan.findMany({
    where: { organizationId: getOrgId(req) },
    include: { incidents: { orderBy: { reportedDate: 'desc' }, take: 10 } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(plans);
};

export const createSurveillancePlan: RequestHandler = async (req, res) => {
  const { productName, planType, frequency } = req.body;
  if (!productName || !planType || !frequency) {
    res.status(400).json({ error: 'productName, planType, and frequency are required' }); return;
  }
  const plan = await prisma.surveillancePlan.create({
    data: { organizationId: getOrgId(req), ...req.body, nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined },
    include: { incidents: true },
  });
  res.status(201).json(plan);
};

export const updateSurveillancePlan: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.lastReviewDate) data.lastReviewDate = new Date(data.lastReviewDate);
  if (data.nextReviewDate) data.nextReviewDate = new Date(data.nextReviewDate);
  delete data.organizationId;
  const plan = await prisma.surveillancePlan.update({
    where: { id: req.params.id }, data,
    include: { incidents: true },
  });
  res.json(plan);
};

export const deleteSurveillancePlan: RequestHandler = async (req, res) => {
  await prisma.surveillancePlan.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};

export const createSurveillanceIncident: RequestHandler = async (req, res) => {
  const { planId, type, severity, title, reportedDate } = req.body;
  if (!planId || !type || !severity || !title || !reportedDate) {
    res.status(400).json({ error: 'planId, type, severity, title, and reportedDate are required' }); return;
  }
  const incident = await prisma.surveillanceIncident.create({
    data: { ...req.body, reportedDate: new Date(reportedDate) },
  });
  res.status(201).json(incident);
};

export const updateSurveillanceIncident: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.reportedDate) data.reportedDate = new Date(data.reportedDate);
  const incident = await prisma.surveillanceIncident.update({ where: { id: req.params.id }, data });
  res.json(incident);
};

// --- Product Recalls ---
export const listProductRecalls: RequestHandler = async (req, res) => {
  const recalls = await prisma.productRecall.findMany({
    where: { organizationId: getOrgId(req) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(recalls);
};

export const createProductRecall: RequestHandler = async (req, res) => {
  const { productName, recallType, reason } = req.body;
  if (!productName || !recallType || !reason) {
    res.status(400).json({ error: 'productName, recallType, and reason are required' }); return;
  }
  const recall = await prisma.productRecall.create({
    data: {
      organizationId: getOrgId(req), ...req.body,
      notificationDate: req.body.notificationDate ? new Date(req.body.notificationDate) : undefined,
    },
  });
  res.status(201).json(recall);
};

export const updateProductRecall: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  if (data.notificationDate) data.notificationDate = new Date(data.notificationDate);
  if (data.completionDate) data.completionDate = new Date(data.completionDate);
  delete data.organizationId;
  const recall = await prisma.productRecall.update({ where: { id: req.params.id }, data });
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
  if (!productName) { res.status(400).json({ error: 'productName is required' }); return; }
  const product = await prisma.productDecommission.create({
    data: {
      organizationId: getOrgId(req), ...req.body,
      endOfSaleDate: req.body.endOfSaleDate ? new Date(req.body.endOfSaleDate) : undefined,
      endOfSupportDate: req.body.endOfSupportDate ? new Date(req.body.endOfSupportDate) : undefined,
      endOfLifeDate: req.body.endOfLifeDate ? new Date(req.body.endOfLifeDate) : undefined,
      decommissionDate: req.body.decommissionDate ? new Date(req.body.decommissionDate) : undefined,
    },
  });
  res.status(201).json(product);
};

export const updateProductDecommission: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  for (const dateField of ['endOfSaleDate', 'endOfSupportDate', 'endOfLifeDate', 'decommissionDate']) {
    if (data[dateField]) data[dateField] = new Date(data[dateField]);
  }
  delete data.organizationId;
  const product = await prisma.productDecommission.update({ where: { id: req.params.id }, data });
  res.json(product);
};

export const deleteProductDecommission: RequestHandler = async (req, res) => {
  await prisma.productDecommission.delete({ where: { id: req.params.id } });
  res.json({ success: true });
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
  if (!productName) { res.status(400).json({ error: 'productName is required' }); return; }
  const assessment = await prisma.lifecycleAssessment.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(assessment);
};

export const getLifecycleAssessment: RequestHandler = async (req, res) => {
  const assessment = await prisma.lifecycleAssessment.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!assessment) { res.status(404).json({ error: 'Assessment not found' }); return; }
  res.json(assessment);
};

export const updateLifecycleAssessment: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  delete data.organizationId;
  const assessment = await prisma.lifecycleAssessment.update({ where: { id: req.params.id }, data });
  res.json(assessment);
};

export const deleteLifecycleAssessment: RequestHandler = async (req, res) => {
  await prisma.lifecycleAssessment.delete({ where: { id: req.params.id } });
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
  if (!productName) { res.status(400).json({ error: 'productName is required' }); return; }
  const product = await prisma.productLifecycle.create({
    data: {
      organizationId: getOrgId(req), ...req.body,
      marketEntry: req.body.marketEntry ? new Date(req.body.marketEntry) : undefined,
      marketExit: req.body.marketExit ? new Date(req.body.marketExit) : undefined,
    },
  });
  res.status(201).json(product);
};

export const getProductLifecycle: RequestHandler = async (req, res) => {
  const product = await prisma.productLifecycle.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(product);
};

export const updateProductLifecycle: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  delete data.organizationId;
  if (data.marketEntry) data.marketEntry = new Date(data.marketEntry);
  if (data.marketExit) data.marketExit = new Date(data.marketExit);
  const product = await prisma.productLifecycle.update({ where: { id: req.params.id }, data });
  res.json(product);
};

export const deleteProductLifecycle: RequestHandler = async (req, res) => {
  await prisma.productLifecycle.delete({ where: { id: req.params.id } });
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
  if (!name || !nodes || !edges) { res.status(400).json({ error: 'name, nodes, and edges are required' }); return; }
  const map = await prisma.processMap.create({
    data: { organizationId: getOrgId(req), ...req.body },
  });
  res.status(201).json(map);
};

export const getProcessMap: RequestHandler = async (req, res) => {
  const map = await prisma.processMap.findFirst({
    where: { id: req.params.id, organizationId: getOrgId(req) },
  });
  if (!map) { res.status(404).json({ error: 'Process map not found' }); return; }
  res.json(map);
};

export const updateProcessMap: RequestHandler = async (req, res) => {
  const data = { ...req.body };
  delete data.organizationId;
  const map = await prisma.processMap.update({ where: { id: req.params.id }, data });
  res.json(map);
};

export const deleteProcessMap: RequestHandler = async (req, res) => {
  await prisma.processMap.delete({ where: { id: req.params.id } });
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
      await prisma.productLifecycle.update({
        where: { id: product.id },
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
        await prisma.productDecommission.update({
          where: { id: decom.id },
          data: { securityPatches: patches },
        });
        updates.push(`Flagged ${decom.productName} decommission with SBOM vulnerabilities`);
      }
    }
  }

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
