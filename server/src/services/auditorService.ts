/**
 * Auditor Collaboration Hub Service
 *
 * Manages auditor profiles, audit engagements, findings, workpapers,
 * audit requests, dashboard statistics, and bundled auditor matching.
 *
 * Data is stored via the RegulationModuleData model with module = 'auditor'
 * and dataType distinguishing each entity collection.
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditorProfile {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  firm?: string;
  phone?: string;
  bio?: string;
  certifications: string[];
  specializations: string[];
  frameworks: string[];
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  isBundled: boolean;
  rating?: number;
  completedEngagements: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface AuditEngagement {
  id: string;
  organizationId: string;
  auditorId: string;
  title: string;
  description?: string;
  framework: string;
  engagementType: 'internal' | 'external' | 'regulatory' | 'certification';
  status: 'planned' | 'in_progress' | 'fieldwork' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate?: string;
  plannedEndDate?: string;
  scope?: string;
  objectives?: string[];
  leadAuditor?: string;
  teamMembers?: string[];
  budget?: number;
  actualCost?: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFinding {
  id: string;
  organizationId: string;
  engagementId: string;
  title: string;
  description: string;
  findingType: 'observation' | 'non_conformity' | 'major_non_conformity' | 'opportunity_for_improvement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'open' | 'in_remediation' | 'resolved' | 'closed' | 'accepted_risk';
  controlReference?: string;
  recommendation?: string;
  remediationPlan?: string;
  remediationDueDate?: string;
  remediationOwner?: string;
  remediationProgress: number;
  evidence?: string[];
  rootCause?: string;
  impact?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditWorkpaper {
  id: string;
  organizationId: string;
  engagementId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  category: 'planning' | 'fieldwork' | 'testing' | 'evidence' | 'report' | 'correspondence' | 'other';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
  version: number;
  uploadedBy: string;
  reviewedBy?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditRequest {
  id: string;
  organizationId: string;
  engagementId?: string;
  requestType: 'document_request' | 'information_request' | 'access_request' | 'meeting_request' | 'clarification';
  title: string;
  description: string;
  requestedBy: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  responseNotes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditorDashboardStats {
  activeEngagements: number;
  openFindings: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: 'engagement' | 'finding' | 'request';
    dueDate: string;
  }>;
  findingsBySeverity: Record<string, number>;
  engagementsByStatus: Record<string, number>;
  pendingRequests: number;
  pendingWorkpaperReviews: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const MODULE_NAME = 'auditor';

type DataType =
  | 'profiles'
  | 'engagements'
  | 'findings'
  | 'workpapers'
  | 'requests';

/**
 * Retrieve stored records for a given data type within the auditor module.
 */
async function getRecords<T>(organizationId: string, dataType: DataType): Promise<T[]> {
  const record = await prisma.regulationModuleData.findUnique({
    where: {
      organizationId_module_dataType: {
        organizationId,
        module: MODULE_NAME,
        dataType,
      },
    },
  });
  return (record?.data as T[] | undefined) ?? [];
}

/**
 * Persist records for a given data type within the auditor module.
 */
async function saveRecords<T>(organizationId: string, dataType: DataType, records: T[]): Promise<void> {
  await prisma.regulationModuleData.upsert({
    where: {
      organizationId_module_dataType: {
        organizationId,
        module: MODULE_NAME,
        dataType,
      },
    },
    create: {
      organizationId,
      module: MODULE_NAME,
      dataType,
      data: records as any,
    },
    update: {
      data: records as any,
      updatedAt: new Date(),
    },
  });
}

// ============================================================================
// AUDITOR SERVICE CLASS
// ============================================================================

class AuditorService {

  // ==========================================================================
  // AUDITOR PROFILE CRUD
  // ==========================================================================

  /**
   * Create a new auditor profile
   */
  async createAuditorProfile(
    organizationId: string,
    data: Omit<AuditorProfile, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'completedEngagements'>
  ): Promise<AuditorProfile> {
    const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');

    const now = new Date().toISOString();
    const profile: AuditorProfile = {
      id: uuidv4(),
      organizationId,
      completedEngagements: 0,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    profiles.push(profile);
    await saveRecords(organizationId, 'profiles', profiles);

    logger.info(`Auditor profile created: ${profile.id} for org ${organizationId}`);
    return profile;
  }

  /**
   * List all auditor profiles for an organization
   */
  async listAuditorProfiles(
    organizationId: string,
    filters?: {
      status?: string;
      framework?: string;
      certification?: string;
      availability?: string;
      isBundled?: boolean;
    }
  ): Promise<AuditorProfile[]> {
    let profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');

    if (filters?.status) {
      profiles = profiles.filter((p) => p.status === filters.status);
    }
    if (filters?.framework) {
      profiles = profiles.filter((p) => p.frameworks.includes(filters.framework!));
    }
    if (filters?.certification) {
      profiles = profiles.filter((p) => p.certifications.includes(filters.certification!));
    }
    if (filters?.availability) {
      profiles = profiles.filter((p) => p.availability === filters.availability);
    }
    if (filters?.isBundled !== undefined) {
      profiles = profiles.filter((p) => p.isBundled === filters.isBundled);
    }

    return profiles;
  }

  /**
   * Get a single auditor profile by ID
   */
  async getAuditorProfile(organizationId: string, profileId: string): Promise<AuditorProfile> {
    const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) {
      throw new Error('Auditor profile not found');
    }
    return profile;
  }

  /**
   * Update an auditor profile
   */
  async updateAuditorProfile(
    organizationId: string,
    profileId: string,
    data: Partial<Omit<AuditorProfile, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AuditorProfile> {
    const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index === -1) {
      throw new Error('Auditor profile not found');
    }

    profiles[index] = {
      ...profiles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await saveRecords(organizationId, 'profiles', profiles);
    logger.info(`Auditor profile updated: ${profileId}`);
    return profiles[index];
  }

  /**
   * Delete an auditor profile
   */
  async deleteAuditorProfile(organizationId: string, profileId: string): Promise<void> {
    const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');
    const filtered = profiles.filter((p) => p.id !== profileId);
    if (filtered.length === profiles.length) {
      throw new Error('Auditor profile not found');
    }
    await saveRecords(organizationId, 'profiles', filtered);
    logger.info(`Auditor profile deleted: ${profileId}`);
  }

  // ==========================================================================
  // AUDIT ENGAGEMENT CRUD
  // ==========================================================================

  /**
   * Create a new audit engagement
   */
  async createEngagement(
    organizationId: string,
    data: Omit<AuditEngagement, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'completionPercentage'>
  ): Promise<AuditEngagement> {
    const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');

    // Validate auditor exists
    const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');
    const auditor = profiles.find((p) => p.id === data.auditorId);
    if (!auditor) {
      throw new Error('Auditor profile not found');
    }

    const now = new Date().toISOString();
    const engagement: AuditEngagement = {
      id: uuidv4(),
      organizationId,
      completionPercentage: 0,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    engagements.push(engagement);
    await saveRecords(organizationId, 'engagements', engagements);

    logger.info(`Audit engagement created: ${engagement.id} for org ${organizationId}`);
    return engagement;
  }

  /**
   * List audit engagements for an organization
   */
  async listEngagements(
    organizationId: string,
    filters?: {
      status?: string;
      auditorId?: string;
      framework?: string;
      engagementType?: string;
      priority?: string;
    }
  ): Promise<AuditEngagement[]> {
    let engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');

    if (filters?.status) {
      engagements = engagements.filter((e) => e.status === filters.status);
    }
    if (filters?.auditorId) {
      engagements = engagements.filter((e) => e.auditorId === filters.auditorId);
    }
    if (filters?.framework) {
      engagements = engagements.filter((e) => e.framework === filters.framework);
    }
    if (filters?.engagementType) {
      engagements = engagements.filter((e) => e.engagementType === filters.engagementType);
    }
    if (filters?.priority) {
      engagements = engagements.filter((e) => e.priority === filters.priority);
    }

    return engagements.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get a single audit engagement
   */
  async getEngagement(organizationId: string, engagementId: string): Promise<AuditEngagement> {
    const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');
    const engagement = engagements.find((e) => e.id === engagementId);
    if (!engagement) {
      throw new Error('Audit engagement not found');
    }
    return engagement;
  }

  /**
   * Update an audit engagement
   */
  async updateEngagement(
    organizationId: string,
    engagementId: string,
    data: Partial<Omit<AuditEngagement, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AuditEngagement> {
    const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');
    const index = engagements.findIndex((e) => e.id === engagementId);
    if (index === -1) {
      throw new Error('Audit engagement not found');
    }

    engagements[index] = {
      ...engagements[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to completed, increment auditor's completed engagements
    if (data.status === 'completed' && engagements[index].status !== 'completed') {
      const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');
      const auditorIdx = profiles.findIndex((p) => p.id === engagements[index].auditorId);
      if (auditorIdx !== -1) {
        profiles[auditorIdx].completedEngagements += 1;
        profiles[auditorIdx].updatedAt = new Date().toISOString();
        await saveRecords(organizationId, 'profiles', profiles);
      }
    }

    await saveRecords(organizationId, 'engagements', engagements);
    logger.info(`Audit engagement updated: ${engagementId}`);
    return engagements[index];
  }

  /**
   * Delete an audit engagement
   */
  async deleteEngagement(organizationId: string, engagementId: string): Promise<void> {
    const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');
    const filtered = engagements.filter((e) => e.id !== engagementId);
    if (filtered.length === engagements.length) {
      throw new Error('Audit engagement not found');
    }
    await saveRecords(organizationId, 'engagements', filtered);
    logger.info(`Audit engagement deleted: ${engagementId}`);
  }

  // ==========================================================================
  // AUDIT FINDING CRUD
  // ==========================================================================

  /**
   * Create a new audit finding
   */
  async createFinding(
    organizationId: string,
    data: Omit<AuditFinding, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'remediationProgress'>
  ): Promise<AuditFinding> {
    const findings = await getRecords<AuditFinding>(organizationId, 'findings');

    // Validate engagement exists
    const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');
    const engagement = engagements.find((e) => e.id === data.engagementId);
    if (!engagement) {
      throw new Error('Audit engagement not found');
    }

    const now = new Date().toISOString();
    const finding: AuditFinding = {
      id: uuidv4(),
      organizationId,
      remediationProgress: 0,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    findings.push(finding);
    await saveRecords(organizationId, 'findings', findings);

    logger.info(`Audit finding created: ${finding.id} for engagement ${data.engagementId}`);
    return finding;
  }

  /**
   * List audit findings for an organization, optionally filtered by engagement
   */
  async listFindings(
    organizationId: string,
    filters?: {
      engagementId?: string;
      status?: string;
      severity?: string;
      findingType?: string;
    }
  ): Promise<AuditFinding[]> {
    let findings = await getRecords<AuditFinding>(organizationId, 'findings');

    if (filters?.engagementId) {
      findings = findings.filter((f) => f.engagementId === filters.engagementId);
    }
    if (filters?.status) {
      findings = findings.filter((f) => f.status === filters.status);
    }
    if (filters?.severity) {
      findings = findings.filter((f) => f.severity === filters.severity);
    }
    if (filters?.findingType) {
      findings = findings.filter((f) => f.findingType === filters.findingType);
    }

    return findings.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get a single audit finding
   */
  async getFinding(organizationId: string, findingId: string): Promise<AuditFinding> {
    const findings = await getRecords<AuditFinding>(organizationId, 'findings');
    const finding = findings.find((f) => f.id === findingId);
    if (!finding) {
      throw new Error('Audit finding not found');
    }
    return finding;
  }

  /**
   * Update an audit finding
   */
  async updateFinding(
    organizationId: string,
    findingId: string,
    data: Partial<Omit<AuditFinding, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AuditFinding> {
    const findings = await getRecords<AuditFinding>(organizationId, 'findings');
    const index = findings.findIndex((f) => f.id === findingId);
    if (index === -1) {
      throw new Error('Audit finding not found');
    }

    findings[index] = {
      ...findings[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await saveRecords(organizationId, 'findings', findings);
    logger.info(`Audit finding updated: ${findingId}`);
    return findings[index];
  }

  /**
   * Delete an audit finding
   */
  async deleteFinding(organizationId: string, findingId: string): Promise<void> {
    const findings = await getRecords<AuditFinding>(organizationId, 'findings');
    const filtered = findings.filter((f) => f.id !== findingId);
    if (filtered.length === findings.length) {
      throw new Error('Audit finding not found');
    }
    await saveRecords(organizationId, 'findings', filtered);
    logger.info(`Audit finding deleted: ${findingId}`);
  }

  // ==========================================================================
  // AUDIT WORKPAPER MANAGEMENT
  // ==========================================================================

  /**
   * Upload / create a workpaper record
   */
  async createWorkpaper(
    organizationId: string,
    data: Omit<AuditWorkpaper, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<AuditWorkpaper> {
    const workpapers = await getRecords<AuditWorkpaper>(organizationId, 'workpapers');

    // Validate engagement exists
    const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');
    const engagement = engagements.find((e) => e.id === data.engagementId);
    if (!engagement) {
      throw new Error('Audit engagement not found');
    }

    const now = new Date().toISOString();
    const workpaper: AuditWorkpaper = {
      id: uuidv4(),
      organizationId,
      version: 1,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    workpapers.push(workpaper);
    await saveRecords(organizationId, 'workpapers', workpapers);

    logger.info(`Workpaper created: ${workpaper.id} for engagement ${data.engagementId}`);
    return workpaper;
  }

  /**
   * List workpapers for an organization, optionally filtered by engagement
   */
  async listWorkpapers(
    organizationId: string,
    filters?: {
      engagementId?: string;
      status?: string;
      category?: string;
    }
  ): Promise<AuditWorkpaper[]> {
    let workpapers = await getRecords<AuditWorkpaper>(organizationId, 'workpapers');

    if (filters?.engagementId) {
      workpapers = workpapers.filter((w) => w.engagementId === filters.engagementId);
    }
    if (filters?.status) {
      workpapers = workpapers.filter((w) => w.status === filters.status);
    }
    if (filters?.category) {
      workpapers = workpapers.filter((w) => w.category === filters.category);
    }

    return workpapers.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get a single workpaper
   */
  async getWorkpaper(organizationId: string, workpaperId: string): Promise<AuditWorkpaper> {
    const workpapers = await getRecords<AuditWorkpaper>(organizationId, 'workpapers');
    const workpaper = workpapers.find((w) => w.id === workpaperId);
    if (!workpaper) {
      throw new Error('Workpaper not found');
    }
    return workpaper;
  }

  /**
   * Update a workpaper (e.g. review, approve, reject)
   */
  async updateWorkpaper(
    organizationId: string,
    workpaperId: string,
    data: Partial<Omit<AuditWorkpaper, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AuditWorkpaper> {
    const workpapers = await getRecords<AuditWorkpaper>(organizationId, 'workpapers');
    const index = workpapers.findIndex((w) => w.id === workpaperId);
    if (index === -1) {
      throw new Error('Workpaper not found');
    }

    const now = new Date().toISOString();
    const updateData: Partial<AuditWorkpaper> = {
      ...data,
      updatedAt: now,
    };

    // Track approvals
    if (data.status === 'approved' && data.approvedBy) {
      updateData.approvedAt = now;
    }

    // Increment version when file content changes
    if (data.fileUrl && data.fileUrl !== workpapers[index].fileUrl) {
      updateData.version = workpapers[index].version + 1;
    }

    workpapers[index] = {
      ...workpapers[index],
      ...updateData,
    };

    await saveRecords(organizationId, 'workpapers', workpapers);
    logger.info(`Workpaper updated: ${workpaperId}`);
    return workpapers[index];
  }

  /**
   * Delete a workpaper
   */
  async deleteWorkpaper(organizationId: string, workpaperId: string): Promise<void> {
    const workpapers = await getRecords<AuditWorkpaper>(organizationId, 'workpapers');
    const filtered = workpapers.filter((w) => w.id !== workpaperId);
    if (filtered.length === workpapers.length) {
      throw new Error('Workpaper not found');
    }
    await saveRecords(organizationId, 'workpapers', filtered);
    logger.info(`Workpaper deleted: ${workpaperId}`);
  }

  // ==========================================================================
  // AUDIT REQUEST MANAGEMENT
  // ==========================================================================

  /**
   * Create an audit request
   */
  async createRequest(
    organizationId: string,
    data: Omit<AuditRequest, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
  ): Promise<AuditRequest> {
    const requests = await getRecords<AuditRequest>(organizationId, 'requests');

    // If linked to an engagement, validate it exists
    if (data.engagementId) {
      const engagements = await getRecords<AuditEngagement>(organizationId, 'engagements');
      const engagement = engagements.find((e) => e.id === data.engagementId);
      if (!engagement) {
        throw new Error('Audit engagement not found');
      }
    }

    const now = new Date().toISOString();
    const request: AuditRequest = {
      id: uuidv4(),
      organizationId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    requests.push(request);
    await saveRecords(organizationId, 'requests', requests);

    logger.info(`Audit request created: ${request.id} for org ${organizationId}`);
    return request;
  }

  /**
   * List audit requests
   */
  async listRequests(
    organizationId: string,
    filters?: {
      engagementId?: string;
      status?: string;
      requestType?: string;
      assignedTo?: string;
      priority?: string;
    }
  ): Promise<AuditRequest[]> {
    let requests = await getRecords<AuditRequest>(organizationId, 'requests');

    if (filters?.engagementId) {
      requests = requests.filter((r) => r.engagementId === filters.engagementId);
    }
    if (filters?.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }
    if (filters?.requestType) {
      requests = requests.filter((r) => r.requestType === filters.requestType);
    }
    if (filters?.assignedTo) {
      requests = requests.filter((r) => r.assignedTo === filters.assignedTo);
    }
    if (filters?.priority) {
      requests = requests.filter((r) => r.priority === filters.priority);
    }

    return requests.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get a single audit request
   */
  async getRequest(organizationId: string, requestId: string): Promise<AuditRequest> {
    const requests = await getRecords<AuditRequest>(organizationId, 'requests');
    const request = requests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error('Audit request not found');
    }
    return request;
  }

  /**
   * Update an audit request (respond, complete, cancel)
   */
  async updateRequest(
    organizationId: string,
    requestId: string,
    data: Partial<Omit<AuditRequest, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AuditRequest> {
    const requests = await getRecords<AuditRequest>(organizationId, 'requests');
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new Error('Audit request not found');
    }

    requests[index] = {
      ...requests[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await saveRecords(organizationId, 'requests', requests);
    logger.info(`Audit request updated: ${requestId}`);
    return requests[index];
  }

  /**
   * Delete an audit request
   */
  async deleteRequest(organizationId: string, requestId: string): Promise<void> {
    const requests = await getRecords<AuditRequest>(organizationId, 'requests');
    const filtered = requests.filter((r) => r.id !== requestId);
    if (filtered.length === requests.length) {
      throw new Error('Audit request not found');
    }
    await saveRecords(organizationId, 'requests', filtered);
    logger.info(`Audit request deleted: ${requestId}`);
  }

  // ==========================================================================
  // DASHBOARD STATS
  // ==========================================================================

  /**
   * Get auditor collaboration hub dashboard statistics
   */
  async getDashboardStats(organizationId: string): Promise<AuditorDashboardStats> {
    const [engagements, findings, requests, workpapers] = await Promise.all([
      getRecords<AuditEngagement>(organizationId, 'engagements'),
      getRecords<AuditFinding>(organizationId, 'findings'),
      getRecords<AuditRequest>(organizationId, 'requests'),
      getRecords<AuditWorkpaper>(organizationId, 'workpapers'),
    ]);

    const now = new Date();

    // Active engagements (not completed or cancelled)
    const activeEngagements = engagements.filter(
      (e) => e.status !== 'completed' && e.status !== 'cancelled'
    );

    // Open findings (not resolved, closed, or accepted_risk)
    const openFindings = findings.filter(
      (f) => f.status !== 'resolved' && f.status !== 'closed' && f.status !== 'accepted_risk'
    );

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines: AuditorDashboardStats['upcomingDeadlines'] = [];

    for (const engagement of activeEngagements) {
      const endDate = engagement.plannedEndDate || engagement.endDate;
      if (endDate) {
        const d = new Date(endDate);
        if (d >= now && d <= thirtyDaysFromNow) {
          upcomingDeadlines.push({
            id: engagement.id,
            title: engagement.title,
            type: 'engagement',
            dueDate: endDate,
          });
        }
      }
    }

    for (const finding of openFindings) {
      if (finding.remediationDueDate) {
        const d = new Date(finding.remediationDueDate);
        if (d >= now && d <= thirtyDaysFromNow) {
          upcomingDeadlines.push({
            id: finding.id,
            title: finding.title,
            type: 'finding',
            dueDate: finding.remediationDueDate,
          });
        }
      }
    }

    for (const request of requests) {
      if (request.dueDate && request.status !== 'completed' && request.status !== 'cancelled') {
        const d = new Date(request.dueDate);
        if (d >= now && d <= thirtyDaysFromNow) {
          upcomingDeadlines.push({
            id: request.id,
            title: request.title,
            type: 'request',
            dueDate: request.dueDate,
          });
        }
      }
    }

    // Sort deadlines by date
    upcomingDeadlines.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // Findings by severity
    const findingsBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const finding of openFindings) {
      findingsBySeverity[finding.severity] = (findingsBySeverity[finding.severity] || 0) + 1;
    }

    // Engagements by status
    const engagementsByStatus: Record<string, number> = {};
    for (const engagement of engagements) {
      engagementsByStatus[engagement.status] = (engagementsByStatus[engagement.status] || 0) + 1;
    }

    // Pending requests
    const pendingRequests = requests.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    ).length;

    // Pending workpaper reviews
    const pendingWorkpaperReviews = workpapers.filter(
      (w) => w.status === 'submitted' || w.status === 'under_review'
    ).length;

    // Recent activity (latest 10 items based on updatedAt across all entities)
    const allItems = [
      ...engagements.map((e) => ({
        type: 'engagement',
        description: `Engagement "${e.title}" - ${e.status}`,
        timestamp: e.updatedAt,
      })),
      ...findings.map((f) => ({
        type: 'finding',
        description: `Finding "${f.title}" - ${f.status}`,
        timestamp: f.updatedAt,
      })),
      ...requests.map((r) => ({
        type: 'request',
        description: `Request "${r.title}" - ${r.status}`,
        timestamp: r.updatedAt,
      })),
      ...workpapers.map((w) => ({
        type: 'workpaper',
        description: `Workpaper "${w.title}" - ${w.status}`,
        timestamp: w.updatedAt,
      })),
    ];

    const recentActivity = allItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      activeEngagements: activeEngagements.length,
      openFindings: openFindings.length,
      upcomingDeadlines,
      findingsBySeverity,
      engagementsByStatus,
      pendingRequests,
      pendingWorkpaperReviews,
      recentActivity,
    };
  }

  // ==========================================================================
  // BUNDLED AUDITOR MATCHING
  // ==========================================================================

  /**
   * Match auditors to framework needs based on certifications, specializations,
   * framework expertise, availability, and rating.
   */
  async matchAuditors(
    organizationId: string,
    criteria: {
      frameworks?: string[];
      certifications?: string[];
      specializations?: string[];
      maxHourlyRate?: number;
      requiredAvailability?: 'available' | 'busy';
    }
  ): Promise<Array<AuditorProfile & { matchScore: number; matchReasons: string[] }>> {
    const profiles = await getRecords<AuditorProfile>(organizationId, 'profiles');

    // Only consider active, bundled auditors
    const candidates = profiles.filter(
      (p) => p.status === 'active' && p.isBundled
    );

    const scored = candidates.map((auditor) => {
      let matchScore = 0;
      const matchReasons: string[] = [];

      // Framework match (highest weight)
      if (criteria.frameworks && criteria.frameworks.length > 0) {
        const frameworkMatches = criteria.frameworks.filter((f) =>
          auditor.frameworks.includes(f)
        );
        if (frameworkMatches.length > 0) {
          const frameworkScore = (frameworkMatches.length / criteria.frameworks.length) * 40;
          matchScore += frameworkScore;
          matchReasons.push(`Frameworks: ${frameworkMatches.join(', ')}`);
        }
      }

      // Certification match
      if (criteria.certifications && criteria.certifications.length > 0) {
        const certMatches = criteria.certifications.filter((c) =>
          auditor.certifications.includes(c)
        );
        if (certMatches.length > 0) {
          const certScore = (certMatches.length / criteria.certifications.length) * 25;
          matchScore += certScore;
          matchReasons.push(`Certifications: ${certMatches.join(', ')}`);
        }
      }

      // Specialization match
      if (criteria.specializations && criteria.specializations.length > 0) {
        const specMatches = criteria.specializations.filter((s) =>
          auditor.specializations.includes(s)
        );
        if (specMatches.length > 0) {
          const specScore = (specMatches.length / criteria.specializations.length) * 15;
          matchScore += specScore;
          matchReasons.push(`Specializations: ${specMatches.join(', ')}`);
        }
      }

      // Availability bonus
      if (auditor.availability === 'available') {
        matchScore += 10;
        matchReasons.push('Currently available');
      }

      // Rating bonus (up to 10 points)
      if (auditor.rating) {
        const ratingScore = (auditor.rating / 5) * 10;
        matchScore += ratingScore;
        matchReasons.push(`Rating: ${auditor.rating}/5`);
      }

      // Budget check (filter, not scored)
      if (criteria.maxHourlyRate && auditor.hourlyRate && auditor.hourlyRate > criteria.maxHourlyRate) {
        matchScore = 0;
        matchReasons.length = 0;
        matchReasons.push('Exceeds budget');
      }

      // Availability filter
      if (criteria.requiredAvailability === 'available' && auditor.availability !== 'available') {
        matchScore = 0;
        matchReasons.length = 0;
        matchReasons.push('Not currently available');
      }

      return {
        ...auditor,
        matchScore: Math.round(matchScore * 100) / 100,
        matchReasons,
      };
    });

    // Sort by match score descending, then by rating, then by completed engagements
    return scored
      .filter((a) => a.matchScore > 0)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
        return b.completedEngagements - a.completedEngagements;
      });
  }
}

export default new AuditorService();
