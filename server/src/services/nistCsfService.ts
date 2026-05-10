/**
 * NIST Cybersecurity Framework (CSF) v2.0 Workflow Service
 *
 * Three responsibilities, all org-scoped:
 *   1. Profile management (Current vs Target) per NIST CSF 2.0 §3 — a Profile
 *      aligns Subcategories with the organization's mission, threat model,
 *      regulatory drivers, risk tolerance, and budget.
 *   2. Subcategory assessment with Implementation Tiers (1 Partial,
 *      2 Risk Informed, 3 Repeatable, 4 Adaptive). Tiers are scored per
 *      Subcategory; the function-level score is a weighted average (Critical
 *      priority = 3x, High = 2x, Moderate = 1x, Low = 0.5x).
 *   3. Gap analysis — comparing a Current Profile to a Target Profile yields
 *      per-Function deltas and a list of "critical gaps" (target Tier 4 vs
 *      current Tier ≤ 2). Persisted as NistCsfGapAnalysis rows for audit
 *      trail and dashboard rollups.
 *
 * The canonical CSF 2.0 catalog (6 Functions, 22 Categories, ~55 Subcategories)
 * is embedded in `CSF_2_0_CATALOG` and seeded on demand via
 * bulkSeedSubcategories.
 */

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import logger from '../config/logger';
import realTimeComplianceService from './realTimeComplianceService';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type CsfFunction = 'Govern' | 'Identify' | 'Protect' | 'Detect' | 'Respond' | 'Recover';
export type ProfileType = 'Current' | 'Target';
export type ProfileStatus = 'Draft' | 'Active' | 'Archived';
export type RiskTolerance = 'Low' | 'Moderate' | 'High';
export type Priority = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ImplementationStatus =
  | 'NotImplemented'
  | 'PartiallyImplemented'
  | 'Implemented'
  | 'Optimized';
export type ActionStatus = 'Open' | 'InProgress' | 'Blocked' | 'Completed' | 'Cancelled';
export type Tier = 1 | 2 | 3 | 4;

export const CSF_FUNCTIONS: readonly CsfFunction[] = [
  'Govern',
  'Identify',
  'Protect',
  'Detect',
  'Respond',
  'Recover',
] as const;

interface CatalogSubcategory {
  ref: string;            // GV.OC-01
  title: string;          // paraphrased description
  category: string;       // GV.OC
  function: CsfFunction;
  defaultPriority: Priority;
  informativeReferences: {
    iso27001?: string[];
    nist80053?: string[];
    cis?: string[];
  };
}

export interface CreateProfileInput {
  organizationId: string;
  userId: string;
  name: string;
  profileType: ProfileType;
  profileYear: number;
  businessContext?: Record<string, unknown>;
  missionObjectives?: string;
  riskTolerance?: RiskTolerance;
  regulatoryDrivers?: string[];
  targetCompletionDate?: Date;
  status?: ProfileStatus;
  ownerId?: string;
}

export interface UpsertAssessmentInput {
  organizationId: string;
  userId: string;
  profileId: string;
  function: CsfFunction;
  category: string;
  subcategoryRef: string;
  subcategoryTitle: string;
  currentTier?: Tier;
  targetTier?: Tier;
  priority?: Priority;
  implementationStatus?: ImplementationStatus;
  informativeReferences?: Record<string, unknown>;
  evidenceRefs?: string[];
  notes?: string;
}

export interface CreateActionItemInput {
  organizationId: string;
  userId: string;
  profileId: string;
  subcategoryAssessmentId?: string;
  title: string;
  description?: string;
  priority?: Priority;
  assignedTo?: string;
  status?: ActionStatus;
  dueDate?: Date;
  dependencies?: string[];
  estimatedEffort?: string;
  estimatedCost?: number;
}

export interface NistCsfDashboard {
  organizationId: string;
  activeProfiles: { current: number; target: number };
  currentVsTargetByFunction: Array<{
    function: CsfFunction;
    currentAvgTier: number | null;
    targetAvgTier: number | null;
    deltaTier: number | null;
  }>;
  openActionItemsByPriority: Record<Priority, number>;
  criticalGaps: number;
  overallMaturityTier: number | null;
  generatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical CSF 2.0 Catalog (paraphrased; refs are authoritative)
// ─────────────────────────────────────────────────────────────────────────────

const CSF_2_0_CATALOG: readonly CatalogSubcategory[] = [
  // ── GOVERN ─────────────────────────────────────────────────────────────
  // GV.OC — Organizational Context
  { ref: 'GV.OC-01', category: 'GV.OC', function: 'Govern', defaultPriority: 'High',
    title: 'The organizational mission is understood and informs cybersecurity risk management.',
    informativeReferences: { iso27001: ['A.5.1', 'A.5.2'], nist80053: ['PM-1', 'PM-11'] } },
  { ref: 'GV.OC-02', category: 'GV.OC', function: 'Govern', defaultPriority: 'High',
    title: 'Internal and external stakeholders are understood, and their needs and expectations are documented.',
    informativeReferences: { iso27001: ['A.5.1'], nist80053: ['PM-1', 'PM-11'] } },
  { ref: 'GV.OC-03', category: 'GV.OC', function: 'Govern', defaultPriority: 'High',
    title: 'Legal, regulatory, and contractual requirements regarding cybersecurity are managed.',
    informativeReferences: { iso27001: ['A.5.31', 'A.5.32', 'A.5.33', 'A.5.34'], nist80053: ['PM-8'] } },
  { ref: 'GV.OC-04', category: 'GV.OC', function: 'Govern', defaultPriority: 'Moderate',
    title: 'Critical objectives, capabilities, and services that stakeholders depend on are identified.',
    informativeReferences: { iso27001: ['A.5.30'], nist80053: ['CP-2', 'PM-11'] } },
  { ref: 'GV.OC-05', category: 'GV.OC', function: 'Govern', defaultPriority: 'Moderate',
    title: 'Outcomes, capabilities, and services the organization depends on are determined.',
    informativeReferences: { iso27001: ['A.5.30', 'A.5.21'], nist80053: ['SA-12', 'CP-2'] } },
  // GV.RM — Risk Management Strategy
  { ref: 'GV.RM-01', category: 'GV.RM', function: 'Govern', defaultPriority: 'Critical',
    title: 'Risk management objectives are established and agreed to by organizational stakeholders.',
    informativeReferences: { iso27001: ['A.5.1', 'A.6.1'], nist80053: ['PM-9'] } },
  { ref: 'GV.RM-02', category: 'GV.RM', function: 'Govern', defaultPriority: 'High',
    title: 'Risk appetite and risk tolerance statements are established, communicated, and maintained.',
    informativeReferences: { iso27001: ['A.6.1'], nist80053: ['PM-9'] } },
  { ref: 'GV.RM-03', category: 'GV.RM', function: 'Govern', defaultPriority: 'High',
    title: 'Cybersecurity risk management activities and outcomes are included in enterprise risk management.',
    informativeReferences: { iso27001: ['A.6.1'], nist80053: ['PM-9'] } },
  // GV.RR — Roles, Responsibilities, and Authorities
  { ref: 'GV.RR-01', category: 'GV.RR', function: 'Govern', defaultPriority: 'High',
    title: 'Organizational leadership is responsible and accountable for cybersecurity risk.',
    informativeReferences: { iso27001: ['A.5.2', 'A.5.4'], nist80053: ['PM-2'] } },
  { ref: 'GV.RR-02', category: 'GV.RR', function: 'Govern', defaultPriority: 'High',
    title: 'Roles, responsibilities, and authorities for cybersecurity are established and communicated.',
    informativeReferences: { iso27001: ['A.5.2', 'A.5.3'], nist80053: ['PM-2', 'AC-5'] } },
  { ref: 'GV.RR-03', category: 'GV.RR', function: 'Govern', defaultPriority: 'Moderate',
    title: 'Adequate resources are allocated commensurate with cybersecurity risk strategy.',
    informativeReferences: { iso27001: ['A.5.4'], nist80053: ['PM-3'] } },
  // GV.PO — Policy
  { ref: 'GV.PO-01', category: 'GV.PO', function: 'Govern', defaultPriority: 'High',
    title: 'Policy for managing cybersecurity risks is established, communicated, and enforced.',
    informativeReferences: { iso27001: ['A.5.1'], nist80053: ['PL-1', 'PM-1'] } },
  { ref: 'GV.PO-02', category: 'GV.PO', function: 'Govern', defaultPriority: 'Moderate',
    title: 'Policy is reviewed, updated, and reissued to reflect changes in requirements, threats, and mission.',
    informativeReferences: { iso27001: ['A.5.1'], nist80053: ['PL-1'] } },
  // GV.OV — Oversight
  { ref: 'GV.OV-01', category: 'GV.OV', function: 'Govern', defaultPriority: 'Moderate',
    title: 'Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy.',
    informativeReferences: { iso27001: ['A.5.36'], nist80053: ['PM-9', 'CA-7'] } },
  { ref: 'GV.OV-02', category: 'GV.OV', function: 'Govern', defaultPriority: 'Moderate',
    title: 'Cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of requirements.',
    informativeReferences: { iso27001: ['A.5.36'], nist80053: ['PM-9'] } },
  // GV.SC — Cybersecurity Supply Chain Risk Management
  { ref: 'GV.SC-01', category: 'GV.SC', function: 'Govern', defaultPriority: 'High',
    title: 'A cybersecurity supply chain risk management program, strategy, objectives, and policies are established.',
    informativeReferences: { iso27001: ['A.5.19', 'A.5.20', 'A.5.21'], nist80053: ['SR-1', 'SR-2'] } },
  { ref: 'GV.SC-02', category: 'GV.SC', function: 'Govern', defaultPriority: 'High',
    title: 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established.',
    informativeReferences: { iso27001: ['A.5.19', 'A.5.20'], nist80053: ['SR-2'] } },
  { ref: 'GV.SC-03', category: 'GV.SC', function: 'Govern', defaultPriority: 'High',
    title: 'Supply chain risk management is integrated into cybersecurity and enterprise risk management.',
    informativeReferences: { iso27001: ['A.5.19'], nist80053: ['SR-3'] } },

  // ── IDENTIFY ───────────────────────────────────────────────────────────
  // ID.AM — Asset Management
  { ref: 'ID.AM-01', category: 'ID.AM', function: 'Identify', defaultPriority: 'High',
    title: 'Inventories of hardware managed by the organization are maintained.',
    informativeReferences: { iso27001: ['A.5.9', 'A.8.1'], nist80053: ['CM-8'], cis: ['1.1', '1.2'] } },
  { ref: 'ID.AM-02', category: 'ID.AM', function: 'Identify', defaultPriority: 'High',
    title: 'Inventories of software, services, and systems managed by the organization are maintained.',
    informativeReferences: { iso27001: ['A.5.9', 'A.8.1'], nist80053: ['CM-8'], cis: ['2.1', '2.2'] } },
  { ref: 'ID.AM-03', category: 'ID.AM', function: 'Identify', defaultPriority: 'Moderate',
    title: 'Representations of the organization\'s authorized network communication and data flows are maintained.',
    informativeReferences: { iso27001: ['A.8.20', 'A.8.21'], nist80053: ['AC-4', 'CA-9'] } },
  { ref: 'ID.AM-04', category: 'ID.AM', function: 'Identify', defaultPriority: 'Moderate',
    title: 'Inventories of services provided by suppliers are maintained.',
    informativeReferences: { iso27001: ['A.5.19', 'A.5.21'], nist80053: ['SA-9', 'SR-2'] } },
  { ref: 'ID.AM-05', category: 'ID.AM', function: 'Identify', defaultPriority: 'High',
    title: 'Assets are prioritized based on classification, criticality, resources, and impact on the mission.',
    informativeReferences: { iso27001: ['A.5.12', 'A.5.13'], nist80053: ['RA-2', 'CP-2'] } },
  { ref: 'ID.AM-07', category: 'ID.AM', function: 'Identify', defaultPriority: 'Moderate',
    title: 'Inventories of data and corresponding metadata for designated data types are maintained.',
    informativeReferences: { iso27001: ['A.5.12', 'A.5.13'], nist80053: ['CM-8'] } },
  { ref: 'ID.AM-08', category: 'ID.AM', function: 'Identify', defaultPriority: 'Moderate',
    title: 'Systems, hardware, software, services, and data are managed throughout their lifecycles.',
    informativeReferences: { iso27001: ['A.5.37', 'A.8.32'], nist80053: ['SA-3', 'CM-8'] } },
  // ID.RA — Risk Assessment
  { ref: 'ID.RA-01', category: 'ID.RA', function: 'Identify', defaultPriority: 'Critical',
    title: 'Vulnerabilities in assets are identified, validated, and recorded.',
    informativeReferences: { iso27001: ['A.8.8'], nist80053: ['RA-5', 'CA-2'], cis: ['7.1'] } },
  { ref: 'ID.RA-02', category: 'ID.RA', function: 'Identify', defaultPriority: 'High',
    title: 'Cyber threat intelligence is received from information sharing forums and sources.',
    informativeReferences: { iso27001: ['A.5.7'], nist80053: ['PM-16', 'SI-5'] } },
  { ref: 'ID.RA-03', category: 'ID.RA', function: 'Identify', defaultPriority: 'High',
    title: 'Internal and external threats to the organization are identified and recorded.',
    informativeReferences: { iso27001: ['A.5.7'], nist80053: ['RA-3'] } },
  { ref: 'ID.RA-04', category: 'ID.RA', function: 'Identify', defaultPriority: 'High',
    title: 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded.',
    informativeReferences: { iso27001: ['A.6.1'], nist80053: ['RA-3'] } },
  { ref: 'ID.RA-05', category: 'ID.RA', function: 'Identify', defaultPriority: 'High',
    title: 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and prioritize responses.',
    informativeReferences: { iso27001: ['A.6.1'], nist80053: ['RA-2', 'RA-3'] } },
  // ID.IM — Improvement
  { ref: 'ID.IM-01', category: 'ID.IM', function: 'Identify', defaultPriority: 'Moderate',
    title: 'Improvements are identified from evaluations.',
    informativeReferences: { iso27001: ['A.5.36'], nist80053: ['CA-7', 'PM-31'] } },
  { ref: 'ID.IM-02', category: 'ID.IM', function: 'Identify', defaultPriority: 'Moderate',
    title: 'Improvements are identified from security tests and exercises, including those done in coordination with suppliers and partners.',
    informativeReferences: { iso27001: ['A.5.30', 'A.8.32'], nist80053: ['CP-4', 'IR-3'] } },

  // ── PROTECT ────────────────────────────────────────────────────────────
  // PR.AA — Identity Management, Authentication, and Access Control
  { ref: 'PR.AA-01', category: 'PR.AA', function: 'Protect', defaultPriority: 'Critical',
    title: 'Identities and credentials for authorized users, services, and hardware are managed.',
    informativeReferences: { iso27001: ['A.5.16', 'A.5.17'], nist80053: ['IA-2', 'IA-4'], cis: ['5.1', '5.2'] } },
  { ref: 'PR.AA-02', category: 'PR.AA', function: 'Protect', defaultPriority: 'High',
    title: 'Identities are proofed and bound to credentials based on the context of interactions.',
    informativeReferences: { iso27001: ['A.5.16'], nist80053: ['IA-12'] } },
  { ref: 'PR.AA-03', category: 'PR.AA', function: 'Protect', defaultPriority: 'Critical',
    title: 'Users, services, and hardware are authenticated.',
    informativeReferences: { iso27001: ['A.5.17', 'A.8.5'], nist80053: ['IA-2', 'IA-3'], cis: ['6.3', '6.4'] } },
  { ref: 'PR.AA-04', category: 'PR.AA', function: 'Protect', defaultPriority: 'High',
    title: 'Identity assertions are protected, conveyed, and verified.',
    informativeReferences: { iso27001: ['A.8.5'], nist80053: ['IA-5', 'IA-8'] } },
  { ref: 'PR.AA-05', category: 'PR.AA', function: 'Protect', defaultPriority: 'Critical',
    title: 'Access permissions, entitlements, and authorizations are defined, managed, enforced, and reviewed.',
    informativeReferences: { iso27001: ['A.5.15', 'A.5.18', 'A.8.2', 'A.8.3'], nist80053: ['AC-2', 'AC-3', 'AC-6'], cis: ['6.1', '6.2'] } },
  { ref: 'PR.AA-06', category: 'PR.AA', function: 'Protect', defaultPriority: 'High',
    title: 'Physical access to assets is managed, monitored, and enforced commensurate with risk.',
    informativeReferences: { iso27001: ['A.7.1', 'A.7.2', 'A.7.3'], nist80053: ['PE-2', 'PE-3'] } },
  // PR.AT — Awareness and Training
  { ref: 'PR.AT-01', category: 'PR.AT', function: 'Protect', defaultPriority: 'High',
    title: 'Personnel are provided with awareness and training so they possess knowledge and skills to perform tasks securely.',
    informativeReferences: { iso27001: ['A.6.3'], nist80053: ['AT-2', 'AT-3'], cis: ['14.1'] } },
  { ref: 'PR.AT-02', category: 'PR.AT', function: 'Protect', defaultPriority: 'Moderate',
    title: 'Individuals in specialized roles are provided with awareness and training so they possess knowledge and skills to perform relevant tasks.',
    informativeReferences: { iso27001: ['A.6.3'], nist80053: ['AT-3', 'AT-4'] } },
  // PR.DS — Data Security
  { ref: 'PR.DS-01', category: 'PR.DS', function: 'Protect', defaultPriority: 'Critical',
    title: 'The confidentiality, integrity, and availability of data-at-rest are protected.',
    informativeReferences: { iso27001: ['A.8.24', 'A.8.10'], nist80053: ['SC-28', 'MP-4'], cis: ['3.6', '3.11'] } },
  { ref: 'PR.DS-02', category: 'PR.DS', function: 'Protect', defaultPriority: 'Critical',
    title: 'The confidentiality, integrity, and availability of data-in-transit are protected.',
    informativeReferences: { iso27001: ['A.8.24', 'A.8.20'], nist80053: ['SC-8', 'SC-13'], cis: ['3.10'] } },
  { ref: 'PR.DS-10', category: 'PR.DS', function: 'Protect', defaultPriority: 'High',
    title: 'The confidentiality, integrity, and availability of data-in-use are protected.',
    informativeReferences: { iso27001: ['A.8.11', 'A.8.12'], nist80053: ['SC-39', 'AC-4'] } },
  { ref: 'PR.DS-11', category: 'PR.DS', function: 'Protect', defaultPriority: 'High',
    title: 'Backups of data are created, protected, maintained, and tested.',
    informativeReferences: { iso27001: ['A.8.13'], nist80053: ['CP-9'], cis: ['11.1', '11.4'] } },
  // PR.PS — Platform Security
  { ref: 'PR.PS-01', category: 'PR.PS', function: 'Protect', defaultPriority: 'High',
    title: 'Configuration management practices are established and applied.',
    informativeReferences: { iso27001: ['A.8.9'], nist80053: ['CM-2', 'CM-6'], cis: ['4.1'] } },
  { ref: 'PR.PS-02', category: 'PR.PS', function: 'Protect', defaultPriority: 'High',
    title: 'Software is maintained, replaced, and removed commensurate with risk.',
    informativeReferences: { iso27001: ['A.8.8', 'A.8.32'], nist80053: ['SI-2', 'CM-11'], cis: ['7.3', '7.4'] } },
  { ref: 'PR.PS-03', category: 'PR.PS', function: 'Protect', defaultPriority: 'High',
    title: 'Hardware is maintained, replaced, and removed commensurate with risk.',
    informativeReferences: { iso27001: ['A.7.13', 'A.8.10'], nist80053: ['MA-2', 'MA-6'] } },
  { ref: 'PR.PS-04', category: 'PR.PS', function: 'Protect', defaultPriority: 'High',
    title: 'Log records are generated and made available for continuous monitoring.',
    informativeReferences: { iso27001: ['A.8.15', 'A.8.16'], nist80053: ['AU-2', 'AU-12'], cis: ['8.1', '8.2'] } },
  { ref: 'PR.PS-05', category: 'PR.PS', function: 'Protect', defaultPriority: 'High',
    title: 'Installation and execution of unauthorized software are prevented.',
    informativeReferences: { iso27001: ['A.8.19'], nist80053: ['CM-7', 'CM-10'], cis: ['2.5', '2.6'] } },
  { ref: 'PR.PS-06', category: 'PR.PS', function: 'Protect', defaultPriority: 'High',
    title: 'Secure software development practices are integrated, and their performance is monitored throughout the SDLC.',
    informativeReferences: { iso27001: ['A.8.25', 'A.8.28'], nist80053: ['SA-3', 'SA-15', 'SA-11'] } },
  // PR.IR — Technology Infrastructure Resilience
  { ref: 'PR.IR-01', category: 'PR.IR', function: 'Protect', defaultPriority: 'High',
    title: 'Networks and environments are protected from unauthorized logical access and usage.',
    informativeReferences: { iso27001: ['A.8.20', 'A.8.21', 'A.8.22'], nist80053: ['SC-7', 'AC-4'], cis: ['12.1', '12.2'] } },
  { ref: 'PR.IR-03', category: 'PR.IR', function: 'Protect', defaultPriority: 'High',
    title: 'Mechanisms are implemented to achieve resilience requirements in normal and adverse situations.',
    informativeReferences: { iso27001: ['A.5.30', 'A.8.14'], nist80053: ['CP-7', 'CP-10'] } },
  { ref: 'PR.IR-04', category: 'PR.IR', function: 'Protect', defaultPriority: 'Moderate',
    title: 'Adequate resource capacity to ensure availability is maintained.',
    informativeReferences: { iso27001: ['A.8.6'], nist80053: ['CP-2', 'SC-5'] } },

  // ── DETECT ─────────────────────────────────────────────────────────────
  // DE.CM — Continuous Monitoring
  { ref: 'DE.CM-01', category: 'DE.CM', function: 'Detect', defaultPriority: 'High',
    title: 'Networks and network services are monitored to find potentially adverse events.',
    informativeReferences: { iso27001: ['A.8.16', 'A.8.20'], nist80053: ['SI-4', 'SC-7'], cis: ['13.1', '13.6'] } },
  { ref: 'DE.CM-02', category: 'DE.CM', function: 'Detect', defaultPriority: 'High',
    title: 'The physical environment is monitored to find potentially adverse events.',
    informativeReferences: { iso27001: ['A.7.4'], nist80053: ['PE-6'] } },
  { ref: 'DE.CM-03', category: 'DE.CM', function: 'Detect', defaultPriority: 'High',
    title: 'Personnel activity and technology usage are monitored to find potentially adverse events.',
    informativeReferences: { iso27001: ['A.8.16'], nist80053: ['AU-12', 'CA-7'] } },
  { ref: 'DE.CM-06', category: 'DE.CM', function: 'Detect', defaultPriority: 'Moderate',
    title: 'External service provider activities and services are monitored to find potentially adverse events.',
    informativeReferences: { iso27001: ['A.5.22'], nist80053: ['SA-9', 'CA-7'] } },
  { ref: 'DE.CM-09', category: 'DE.CM', function: 'Detect', defaultPriority: 'High',
    title: 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.',
    informativeReferences: { iso27001: ['A.8.16'], nist80053: ['SI-4'], cis: ['10.1'] } },
  // DE.AE — Adverse Event Analysis
  { ref: 'DE.AE-02', category: 'DE.AE', function: 'Detect', defaultPriority: 'High',
    title: 'Potentially adverse events are analyzed to better understand associated activities.',
    informativeReferences: { iso27001: ['A.5.25', 'A.5.27'], nist80053: ['IR-4', 'AU-6'] } },
  { ref: 'DE.AE-03', category: 'DE.AE', function: 'Detect', defaultPriority: 'High',
    title: 'Information is correlated from multiple sources.',
    informativeReferences: { iso27001: ['A.8.15', 'A.8.16'], nist80053: ['AU-6', 'IR-4'] } },
  { ref: 'DE.AE-04', category: 'DE.AE', function: 'Detect', defaultPriority: 'Moderate',
    title: 'The estimated impact and scope of adverse events are understood.',
    informativeReferences: { iso27001: ['A.5.25'], nist80053: ['IR-4'] } },
  { ref: 'DE.AE-06', category: 'DE.AE', function: 'Detect', defaultPriority: 'High',
    title: 'Information on adverse events is provided to authorized staff and tools.',
    informativeReferences: { iso27001: ['A.5.25', 'A.5.26'], nist80053: ['IR-6', 'IR-4'] } },
  { ref: 'DE.AE-07', category: 'DE.AE', function: 'Detect', defaultPriority: 'Moderate',
    title: 'Cyber threat intelligence and other contextual information are integrated into the analysis.',
    informativeReferences: { iso27001: ['A.5.7'], nist80053: ['SI-5', 'PM-16'] } },
  { ref: 'DE.AE-08', category: 'DE.AE', function: 'Detect', defaultPriority: 'High',
    title: 'Incidents are declared when adverse events meet the defined incident criteria.',
    informativeReferences: { iso27001: ['A.5.25'], nist80053: ['IR-4', 'IR-8'] } },

  // ── RESPOND ────────────────────────────────────────────────────────────
  // RS.MA — Incident Management
  { ref: 'RS.MA-01', category: 'RS.MA', function: 'Respond', defaultPriority: 'Critical',
    title: 'The incident response plan is executed in coordination with relevant third parties once an incident is declared.',
    informativeReferences: { iso27001: ['A.5.24', 'A.5.26'], nist80053: ['IR-4', 'IR-8'] } },
  { ref: 'RS.MA-02', category: 'RS.MA', function: 'Respond', defaultPriority: 'High',
    title: 'Incident reports are triaged and validated.',
    informativeReferences: { iso27001: ['A.5.25'], nist80053: ['IR-4'] } },
  { ref: 'RS.MA-03', category: 'RS.MA', function: 'Respond', defaultPriority: 'High',
    title: 'Incidents are categorized and prioritized.',
    informativeReferences: { iso27001: ['A.5.25'], nist80053: ['IR-4', 'IR-8'] } },
  { ref: 'RS.MA-04', category: 'RS.MA', function: 'Respond', defaultPriority: 'Moderate',
    title: 'Incidents are escalated or elevated as needed.',
    informativeReferences: { iso27001: ['A.5.24'], nist80053: ['IR-4', 'IR-6'] } },
  { ref: 'RS.MA-05', category: 'RS.MA', function: 'Respond', defaultPriority: 'High',
    title: 'The criteria for initiating incident recovery are applied.',
    informativeReferences: { iso27001: ['A.5.24'], nist80053: ['IR-4', 'CP-10'] } },
  // RS.AN — Incident Analysis
  { ref: 'RS.AN-03', category: 'RS.AN', function: 'Respond', defaultPriority: 'High',
    title: 'Analysis is performed to establish what has taken place during an incident and the root cause of the incident.',
    informativeReferences: { iso27001: ['A.5.27'], nist80053: ['IR-4'] } },
  { ref: 'RS.AN-06', category: 'RS.AN', function: 'Respond', defaultPriority: 'High',
    title: 'Actions performed during an investigation are recorded, and their integrity and provenance are preserved.',
    informativeReferences: { iso27001: ['A.5.28'], nist80053: ['AU-10', 'IR-4'] } },
  { ref: 'RS.AN-07', category: 'RS.AN', function: 'Respond', defaultPriority: 'Moderate',
    title: 'Incident data and metadata are collected, and their integrity and provenance are preserved.',
    informativeReferences: { iso27001: ['A.5.28'], nist80053: ['AU-9', 'AU-10'] } },
  { ref: 'RS.AN-08', category: 'RS.AN', function: 'Respond', defaultPriority: 'Moderate',
    title: 'An incident\'s magnitude is estimated and validated.',
    informativeReferences: { iso27001: ['A.5.25'], nist80053: ['IR-4'] } },
  // RS.CO — Incident Response Reporting and Communication
  { ref: 'RS.CO-02', category: 'RS.CO', function: 'Respond', defaultPriority: 'High',
    title: 'Internal and external stakeholders are notified of incidents.',
    informativeReferences: { iso27001: ['A.5.5', 'A.5.26'], nist80053: ['IR-6'] } },
  { ref: 'RS.CO-03', category: 'RS.CO', function: 'Respond', defaultPriority: 'High',
    title: 'Information is shared with designated internal and external stakeholders.',
    informativeReferences: { iso27001: ['A.5.6', 'A.5.26'], nist80053: ['IR-6'] } },
  // RS.MI — Incident Mitigation
  { ref: 'RS.MI-01', category: 'RS.MI', function: 'Respond', defaultPriority: 'Critical',
    title: 'Incidents are contained.',
    informativeReferences: { iso27001: ['A.5.26'], nist80053: ['IR-4'] } },
  { ref: 'RS.MI-02', category: 'RS.MI', function: 'Respond', defaultPriority: 'Critical',
    title: 'Incidents are eradicated.',
    informativeReferences: { iso27001: ['A.5.26'], nist80053: ['IR-4'] } },

  // ── RECOVER ────────────────────────────────────────────────────────────
  // RC.RP — Incident Recovery Plan Execution
  { ref: 'RC.RP-01', category: 'RC.RP', function: 'Recover', defaultPriority: 'Critical',
    title: 'The recovery portion of the incident response plan is executed once initiated from the incident response process.',
    informativeReferences: { iso27001: ['A.5.29', 'A.5.30'], nist80053: ['CP-10', 'IR-4'] } },
  { ref: 'RC.RP-02', category: 'RC.RP', function: 'Recover', defaultPriority: 'High',
    title: 'Recovery actions are selected, scoped, prioritized, and performed.',
    informativeReferences: { iso27001: ['A.5.29'], nist80053: ['CP-10'] } },
  { ref: 'RC.RP-03', category: 'RC.RP', function: 'Recover', defaultPriority: 'High',
    title: 'The integrity of backups and other restoration assets is verified before using them for restoration.',
    informativeReferences: { iso27001: ['A.8.13'], nist80053: ['CP-9', 'CP-10'] } },
  { ref: 'RC.RP-04', category: 'RC.RP', function: 'Recover', defaultPriority: 'High',
    title: 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms.',
    informativeReferences: { iso27001: ['A.5.30'], nist80053: ['CP-2', 'CP-10'] } },
  { ref: 'RC.RP-05', category: 'RC.RP', function: 'Recover', defaultPriority: 'High',
    title: 'The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed.',
    informativeReferences: { iso27001: ['A.5.30'], nist80053: ['CP-10'] } },
  // RC.CO — Incident Recovery Communication
  { ref: 'RC.CO-03', category: 'RC.CO', function: 'Recover', defaultPriority: 'Moderate',
    title: 'Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders.',
    informativeReferences: { iso27001: ['A.5.6', 'A.5.26'], nist80053: ['IR-6', 'CP-2'] } },
  { ref: 'RC.CO-04', category: 'RC.CO', function: 'Recover', defaultPriority: 'Moderate',
    title: 'Public updates on incident recovery are shared using approved methods and messaging.',
    informativeReferences: { iso27001: ['A.5.5'], nist80053: ['IR-6'] } },
];

// Priority-weighted average for tier scoring.
const PRIORITY_WEIGHT: Record<Priority, number> = {
  Critical: 3,
  High: 2,
  Moderate: 1,
  Low: 0.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class NistCsfService {

  // ═══════════════════════════════════════════════════════════════════════
  //  PROFILES
  // ═══════════════════════════════════════════════════════════════════════

  async createProfile(input: CreateProfileInput) {
    if (input.profileYear < 2020 || input.profileYear > 2100) {
      throw new AppError('profileYear must be between 2020 and 2100', 400);
    }

    const profile = await prisma.nistCsfProfile.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        profileType: input.profileType,
        profileYear: input.profileYear,
        businessContext: (input.businessContext ?? undefined) as never,
        missionObjectives: input.missionObjectives,
        riskTolerance: input.riskTolerance ?? 'Moderate',
        regulatoryDrivers: (input.regulatoryDrivers ?? undefined) as never,
        targetCompletionDate: input.targetCompletionDate,
        status: input.status ?? 'Draft',
        ownerId: input.ownerId,
      },
    });

    await AuditLogger.log({
      userId: input.userId,
      organizationId: input.organizationId,
      action: 'nist_csf.profile.created',
      resourceType: 'NistCsfProfile',
      resourceId: profile.id,
      metadata: {
        profileType: profile.profileType,
        profileYear: profile.profileYear,
        riskTolerance: profile.riskTolerance,
      },
    });

    return profile;
  }

  async updateProfile(
    id: string,
    organizationId: string,
    userId: string,
    patch: Partial<Omit<CreateProfileInput, 'organizationId' | 'userId' | 'profileType'>>
  ) {
    const existing = await prisma.nistCsfProfile.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('NIST CSF profile not found', 404);
    if (existing.status === 'Archived') {
      throw new AppError('Archived profiles cannot be modified', 409);
    }

    const updated = await prisma.nistCsfProfile.update({
      where: { id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.profileYear !== undefined && { profileYear: patch.profileYear }),
        ...(patch.businessContext !== undefined && { businessContext: patch.businessContext as never }),
        ...(patch.missionObjectives !== undefined && { missionObjectives: patch.missionObjectives }),
        ...(patch.riskTolerance !== undefined && { riskTolerance: patch.riskTolerance }),
        ...(patch.regulatoryDrivers !== undefined && { regulatoryDrivers: patch.regulatoryDrivers as never }),
        ...(patch.targetCompletionDate !== undefined && { targetCompletionDate: patch.targetCompletionDate }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.ownerId !== undefined && { ownerId: patch.ownerId }),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nist_csf.profile.updated',
      resourceType: 'NistCsfProfile',
      resourceId: id,
      metadata: { fields: Object.keys(patch) },
    });

    return updated;
  }

  async listProfiles(
    organizationId: string,
    filter?: { profileType?: ProfileType; status?: ProfileStatus; profileYear?: number }
  ) {
    return prisma.nistCsfProfile.findMany({
      where: {
        organizationId,
        ...(filter?.profileType && { profileType: filter.profileType }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.profileYear && { profileYear: filter.profileYear }),
      },
      orderBy: [{ profileYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getProfile(id: string, organizationId: string) {
    const profile = await prisma.nistCsfProfile.findFirst({
      where: { id, organizationId },
      include: {
        subcategoryAssessments: {
          orderBy: [{ function: 'asc' }, { subcategoryRef: 'asc' }],
        },
        actionItems: { where: { status: { not: 'Completed' } }, orderBy: { priority: 'desc' } },
      },
    });
    if (!profile) throw new AppError('NIST CSF profile not found', 404);
    return profile;
  }

  async archiveProfile(id: string, organizationId: string, userId: string) {
    const existing = await prisma.nistCsfProfile.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('NIST CSF profile not found', 404);
    if (existing.status === 'Archived') {
      throw new AppError('Profile is already archived', 409);
    }

    const updated = await prisma.nistCsfProfile.update({
      where: { id },
      data: { status: 'Archived' },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nist_csf.profile.archived',
      resourceType: 'NistCsfProfile',
      resourceId: id,
      metadata: { previousStatus: existing.status },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SUBCATEGORY ASSESSMENTS
  // ═══════════════════════════════════════════════════════════════════════

  async upsertSubcategoryAssessment(input: UpsertAssessmentInput) {
    if (!CSF_FUNCTIONS.includes(input.function)) {
      throw new AppError(`Invalid CSF function: ${input.function}`, 400);
    }
    if (input.currentTier !== undefined && (input.currentTier < 1 || input.currentTier > 4)) {
      throw new AppError('currentTier must be between 1 and 4', 400);
    }
    if (input.targetTier !== undefined && (input.targetTier < 1 || input.targetTier > 4)) {
      throw new AppError('targetTier must be between 1 and 4', 400);
    }

    const profile = await prisma.nistCsfProfile.findFirst({
      where: { id: input.profileId, organizationId: input.organizationId },
      select: { id: true, status: true },
    });
    if (!profile) throw new AppError('NIST CSF profile not found', 404);
    if (profile.status === 'Archived') {
      throw new AppError('Cannot modify assessments on an archived profile', 409);
    }

    const assessment = await prisma.nistCsfSubcategoryAssessment.upsert({
      where: {
        profileId_subcategoryRef: {
          profileId: input.profileId,
          subcategoryRef: input.subcategoryRef,
        },
      },
      create: {
        organizationId: input.organizationId,
        profileId: input.profileId,
        function: input.function,
        category: input.category,
        subcategoryRef: input.subcategoryRef,
        subcategoryTitle: input.subcategoryTitle,
        currentTier: input.currentTier,
        targetTier: input.targetTier,
        priority: input.priority ?? 'Moderate',
        implementationStatus: input.implementationStatus ?? 'NotImplemented',
        informativeReferences: (input.informativeReferences ?? undefined) as never,
        evidenceRefs: (input.evidenceRefs ?? undefined) as never,
        notes: input.notes,
        lastAssessedAt: new Date(),
      },
      update: {
        function: input.function,
        category: input.category,
        subcategoryTitle: input.subcategoryTitle,
        ...(input.currentTier !== undefined && { currentTier: input.currentTier }),
        ...(input.targetTier !== undefined && { targetTier: input.targetTier }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.implementationStatus !== undefined && { implementationStatus: input.implementationStatus }),
        ...(input.informativeReferences !== undefined && { informativeReferences: input.informativeReferences as never }),
        ...(input.evidenceRefs !== undefined && { evidenceRefs: input.evidenceRefs as never }),
        ...(input.notes !== undefined && { notes: input.notes }),
        lastAssessedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: input.userId,
      organizationId: input.organizationId,
      action: 'nist_csf.assessment.upserted',
      resourceType: 'NistCsfSubcategoryAssessment',
      resourceId: assessment.id,
      metadata: {
        profileId: input.profileId,
        subcategoryRef: input.subcategoryRef,
        currentTier: input.currentTier,
        targetTier: input.targetTier,
      },
    });

    return assessment;
  }

  /**
   * Seed the canonical CSF 2.0 catalog into the given profile. Idempotent —
   * existing rows for the same (profileId, subcategoryRef) are left alone.
   * Wraps the inserts in a single transaction so partial seeds never persist.
   */
  async bulkSeedSubcategories(profileId: string, organizationId: string, userId: string) {
    const profile = await prisma.nistCsfProfile.findFirst({
      where: { id: profileId, organizationId },
      select: { id: true, status: true },
    });
    if (!profile) throw new AppError('NIST CSF profile not found', 404);
    if (profile.status === 'Archived') {
      throw new AppError('Cannot seed assessments on an archived profile', 409);
    }

    const existing = await prisma.nistCsfSubcategoryAssessment.findMany({
      where: { profileId, organizationId },
      select: { subcategoryRef: true },
    });
    const existingRefs = new Set(existing.map((e) => e.subcategoryRef));

    const toInsert = CSF_2_0_CATALOG.filter((c) => !existingRefs.has(c.ref));
    if (toInsert.length === 0) {
      logger.info('NIST CSF catalog already seeded for profile', { profileId, organizationId });
      return { inserted: 0, skipped: existing.length, total: CSF_2_0_CATALOG.length };
    }

    await prisma.$transaction(
      toInsert.map((c) =>
        prisma.nistCsfSubcategoryAssessment.create({
          data: {
            organizationId,
            profileId,
            function: c.function,
            category: c.category,
            subcategoryRef: c.ref,
            subcategoryTitle: c.title,
            priority: c.defaultPriority,
            implementationStatus: 'NotImplemented',
            informativeReferences: c.informativeReferences as never,
          },
        })
      )
    );

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nist_csf.catalog.seeded',
      resourceType: 'NistCsfProfile',
      resourceId: profileId,
      metadata: { inserted: toInsert.length, skipped: existing.length, total: CSF_2_0_CATALOG.length },
    });

    return { inserted: toInsert.length, skipped: existing.length, total: CSF_2_0_CATALOG.length };
  }

  async listSubcategoryAssessments(
    organizationId: string,
    profileId: string,
    filter?: {
      function?: CsfFunction;
      category?: string;
      priority?: Priority;
      implementationStatus?: ImplementationStatus;
    }
  ) {
    const profile = await prisma.nistCsfProfile.findFirst({
      where: { id: profileId, organizationId },
      select: { id: true },
    });
    if (!profile) throw new AppError('NIST CSF profile not found', 404);

    return prisma.nistCsfSubcategoryAssessment.findMany({
      where: {
        organizationId,
        profileId,
        ...(filter?.function && { function: filter.function }),
        ...(filter?.category && { category: filter.category }),
        ...(filter?.priority && { priority: filter.priority }),
        ...(filter?.implementationStatus && { implementationStatus: filter.implementationStatus }),
      },
      orderBy: [{ function: 'asc' }, { subcategoryRef: 'asc' }],
    });
  }

  /**
   * Compute the priority-weighted average current and target Tier across all
   * assessed Subcategories within a single Function. Returns null counts/avgs
   * when the Function has no assessments yet.
   */
  async scoreFunction(profileId: string, organizationId: string, fn: CsfFunction) {
    if (!CSF_FUNCTIONS.includes(fn)) {
      throw new AppError(`Invalid CSF function: ${fn}`, 400);
    }

    const profile = await prisma.nistCsfProfile.findFirst({
      where: { id: profileId, organizationId },
      select: { id: true },
    });
    if (!profile) throw new AppError('NIST CSF profile not found', 404);

    const rows = await prisma.nistCsfSubcategoryAssessment.findMany({
      where: { profileId, organizationId, function: fn },
      select: { currentTier: true, targetTier: true, priority: true, subcategoryRef: true },
    });

    return {
      function: fn,
      profileId,
      subcategoryCount: rows.length,
      currentAvgTier: this.weightedAvg(rows.map((r) => ({ tier: r.currentTier, priority: r.priority as Priority }))),
      targetAvgTier: this.weightedAvg(rows.map((r) => ({ tier: r.targetTier, priority: r.priority as Priority }))),
      assessedSubcategories: rows.filter((r) => r.currentTier !== null).length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  GAP ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Compute Current vs Target gaps per Function. A "gap" exists when the
   * delta between target and current weighted-average tier is > 0.5. A
   * "critical gap" is any Subcategory where target = 4 and current ≤ 2.
   * Persists one NistCsfGapAnalysis row per Function plus a "Total" row.
   */
  async generateGapAnalysis(
    currentProfileId: string,
    targetProfileId: string,
    organizationId: string,
    userId: string
  ) {
    if (currentProfileId === targetProfileId) {
      throw new AppError('Current and Target profiles must be different', 400);
    }

    const [current, target] = await Promise.all([
      prisma.nistCsfProfile.findFirst({
        where: { id: currentProfileId, organizationId },
        select: { id: true, profileType: true },
      }),
      prisma.nistCsfProfile.findFirst({
        where: { id: targetProfileId, organizationId },
        select: { id: true, profileType: true },
      }),
    ]);
    if (!current) throw new AppError('Current profile not found', 404);
    if (!target) throw new AppError('Target profile not found', 404);
    if (current.profileType !== 'Current') {
      throw new AppError('currentProfileId must reference a Current-type profile', 400);
    }
    if (target.profileType !== 'Target') {
      throw new AppError('targetProfileId must reference a Target-type profile', 400);
    }

    const [currentRows, targetRows] = await Promise.all([
      prisma.nistCsfSubcategoryAssessment.findMany({
        where: { profileId: currentProfileId, organizationId },
        select: { subcategoryRef: true, function: true, currentTier: true, priority: true },
      }),
      prisma.nistCsfSubcategoryAssessment.findMany({
        where: { profileId: targetProfileId, organizationId },
        select: { subcategoryRef: true, function: true, targetTier: true, priority: true },
      }),
    ]);

    const targetByRef = new Map(targetRows.map((r) => [r.subcategoryRef, r]));
    const generatedAt = new Date();

    type FnSummary = {
      function: CsfFunction | 'Total';
      currentAvgTier: number | null;
      targetAvgTier: number | null;
      deltaTier: number | null;
      gapCount: number;
      criticalGapCount: number;
      subcategories: Array<{
        subcategoryRef: string;
        currentTier: number | null;
        targetTier: number | null;
        gap: number | null;
        critical: boolean;
      }>;
    };

    const perFunction: Record<CsfFunction, FnSummary> = {
      Govern: this.emptyFnSummary('Govern'),
      Identify: this.emptyFnSummary('Identify'),
      Protect: this.emptyFnSummary('Protect'),
      Detect: this.emptyFnSummary('Detect'),
      Respond: this.emptyFnSummary('Respond'),
      Recover: this.emptyFnSummary('Recover'),
    };

    let totalCriticalGaps = 0;
    let totalGaps = 0;

    for (const row of currentRows) {
      const fn = row.function as CsfFunction;
      const target = targetByRef.get(row.subcategoryRef);
      const currentTier = row.currentTier ?? null;
      const targetTier = target?.targetTier ?? null;
      const gap = currentTier !== null && targetTier !== null ? targetTier - currentTier : null;
      const critical = targetTier === 4 && currentTier !== null && currentTier <= 2;

      if (gap !== null && gap > 0) {
        perFunction[fn].gapCount += 1;
        totalGaps += 1;
      }
      if (critical) {
        perFunction[fn].criticalGapCount += 1;
        totalCriticalGaps += 1;
      }
      perFunction[fn].subcategories.push({
        subcategoryRef: row.subcategoryRef,
        currentTier,
        targetTier,
        gap,
        critical,
      });
    }

    // Compute weighted averages per Function.
    for (const fn of CSF_FUNCTIONS) {
      const fnCurrentRows = currentRows.filter((r) => r.function === fn);
      const fnTargetRows = targetRows.filter((r) => r.function === fn);
      perFunction[fn].currentAvgTier = this.weightedAvg(
        fnCurrentRows.map((r) => ({ tier: r.currentTier, priority: r.priority as Priority }))
      );
      perFunction[fn].targetAvgTier = this.weightedAvg(
        fnTargetRows.map((r) => ({ tier: r.targetTier, priority: r.priority as Priority }))
      );
      const c = perFunction[fn].currentAvgTier;
      const t = perFunction[fn].targetAvgTier;
      perFunction[fn].deltaTier = c !== null && t !== null ? Number((t - c).toFixed(2)) : null;
    }

    const totalCurrentAvg = this.weightedAvg(
      currentRows.map((r) => ({ tier: r.currentTier, priority: r.priority as Priority }))
    );
    const totalTargetAvg = this.weightedAvg(
      targetRows.map((r) => ({ tier: r.targetTier, priority: r.priority as Priority }))
    );
    const totalDelta = totalCurrentAvg !== null && totalTargetAvg !== null
      ? Number((totalTargetAvg - totalCurrentAvg).toFixed(2))
      : null;

    // Persist per-Function rows + Total row in a single transaction. profileId
    // anchors all rows to the Target profile (the "where we want to be").
    const persisted = await prisma.$transaction([
      ...CSF_FUNCTIONS.map((fn) =>
        prisma.nistCsfGapAnalysis.create({
          data: {
            organizationId,
            profileId: targetProfileId,
            currentProfileId,
            targetProfileId,
            function: fn,
            gapCount: perFunction[fn].gapCount,
            criticalGapCount: perFunction[fn].criticalGapCount,
            summary: {
              currentAvgTier: perFunction[fn].currentAvgTier,
              targetAvgTier: perFunction[fn].targetAvgTier,
              deltaTier: perFunction[fn].deltaTier,
              subcategories: perFunction[fn].subcategories,
            } as never,
            generatedAt,
            generatedBy: userId,
          },
        })
      ),
      prisma.nistCsfGapAnalysis.create({
        data: {
          organizationId,
          profileId: targetProfileId,
          currentProfileId,
          targetProfileId,
          function: 'Total',
          gapCount: totalGaps,
          criticalGapCount: totalCriticalGaps,
          summary: {
            currentAvgTier: totalCurrentAvg,
            targetAvgTier: totalTargetAvg,
            deltaTier: totalDelta,
            functionBreakdown: CSF_FUNCTIONS.map((fn) => ({
              function: fn,
              currentAvgTier: perFunction[fn].currentAvgTier,
              targetAvgTier: perFunction[fn].targetAvgTier,
              deltaTier: perFunction[fn].deltaTier,
              gapCount: perFunction[fn].gapCount,
              criticalGapCount: perFunction[fn].criticalGapCount,
            })),
          } as never,
          generatedAt,
          generatedBy: userId,
        },
      }),
    ]);

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nist_csf.gap_analysis.generated',
      resourceType: 'NistCsfGapAnalysis',
      resourceId: persisted[persisted.length - 1].id,
      metadata: {
        currentProfileId,
        targetProfileId,
        totalGaps,
        totalCriticalGaps,
      },
    });

    if (totalCriticalGaps > 0) {
      realTimeComplianceService.publishComplianceEvent(organizationId, {
        type: 'nist_csf.critical_gaps_detected',
        severity: totalCriticalGaps >= 5 ? 'Critical' : 'High',
        payload: {
          currentProfileId,
          targetProfileId,
          totalGaps,
          totalCriticalGaps,
        },
      });
    }

    return {
      generatedAt,
      currentProfileId,
      targetProfileId,
      perFunction: CSF_FUNCTIONS.map((fn) => perFunction[fn]),
      total: {
        function: 'Total' as const,
        currentAvgTier: totalCurrentAvg,
        targetAvgTier: totalTargetAvg,
        deltaTier: totalDelta,
        gapCount: totalGaps,
        criticalGapCount: totalCriticalGaps,
      },
    };
  }

  async listGapAnalyses(
    organizationId: string,
    filter?: {
      profileId?: string;
      currentProfileId?: string;
      targetProfileId?: string;
      function?: CsfFunction | 'Total';
    }
  ) {
    return prisma.nistCsfGapAnalysis.findMany({
      where: {
        organizationId,
        ...(filter?.profileId && { profileId: filter.profileId }),
        ...(filter?.currentProfileId && { currentProfileId: filter.currentProfileId }),
        ...(filter?.targetProfileId && { targetProfileId: filter.targetProfileId }),
        ...(filter?.function && { function: filter.function }),
      },
      orderBy: { generatedAt: 'desc' },
      take: 200,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ACTION ITEMS
  // ═══════════════════════════════════════════════════════════════════════

  async createActionItem(input: CreateActionItemInput) {
    const profile = await prisma.nistCsfProfile.findFirst({
      where: { id: input.profileId, organizationId: input.organizationId },
      select: { id: true, status: true },
    });
    if (!profile) throw new AppError('NIST CSF profile not found', 404);
    if (profile.status === 'Archived') {
      throw new AppError('Cannot add action items to an archived profile', 409);
    }

    if (input.subcategoryAssessmentId) {
      const sub = await prisma.nistCsfSubcategoryAssessment.findFirst({
        where: {
          id: input.subcategoryAssessmentId,
          organizationId: input.organizationId,
          profileId: input.profileId,
        },
        select: { id: true },
      });
      if (!sub) throw new AppError('Linked subcategory assessment not found in this profile', 404);
    }

    const item = await prisma.nistCsfActionItem.create({
      data: {
        organizationId: input.organizationId,
        profileId: input.profileId,
        subcategoryAssessmentId: input.subcategoryAssessmentId,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 'Moderate',
        assignedTo: input.assignedTo,
        status: input.status ?? 'Open',
        dueDate: input.dueDate,
        dependencies: (input.dependencies ?? undefined) as never,
        estimatedEffort: input.estimatedEffort,
        estimatedCost: input.estimatedCost,
      },
    });

    await AuditLogger.log({
      userId: input.userId,
      organizationId: input.organizationId,
      action: 'nist_csf.action_item.created',
      resourceType: 'NistCsfActionItem',
      resourceId: item.id,
      metadata: {
        profileId: input.profileId,
        priority: item.priority,
        assignedTo: item.assignedTo,
      },
    });

    return item;
  }

  async updateActionItem(
    id: string,
    organizationId: string,
    userId: string,
    patch: Partial<Omit<CreateActionItemInput, 'organizationId' | 'userId' | 'profileId' | 'subcategoryAssessmentId'>>
  ) {
    const existing = await prisma.nistCsfActionItem.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('NIST CSF action item not found', 404);

    const updated = await prisma.nistCsfActionItem.update({
      where: { id },
      data: {
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.priority !== undefined && { priority: patch.priority }),
        ...(patch.assignedTo !== undefined && { assignedTo: patch.assignedTo }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.dueDate !== undefined && { dueDate: patch.dueDate }),
        ...(patch.dependencies !== undefined && { dependencies: patch.dependencies as never }),
        ...(patch.estimatedEffort !== undefined && { estimatedEffort: patch.estimatedEffort }),
        ...(patch.estimatedCost !== undefined && { estimatedCost: patch.estimatedCost }),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nist_csf.action_item.updated',
      resourceType: 'NistCsfActionItem',
      resourceId: id,
      metadata: { fields: Object.keys(patch), previousStatus: existing.status },
    });

    return updated;
  }

  async listActionItems(
    organizationId: string,
    profileId: string | undefined,
    filter?: { status?: ActionStatus; priority?: Priority; assignedTo?: string }
  ) {
    return prisma.nistCsfActionItem.findMany({
      where: {
        organizationId,
        ...(profileId && { profileId }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.priority && { priority: filter.priority }),
        ...(filter?.assignedTo && { assignedTo: filter.assignedTo }),
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async completeActionItem(id: string, organizationId: string, userId: string) {
    const existing = await prisma.nistCsfActionItem.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('NIST CSF action item not found', 404);
    if (existing.status === 'Completed') {
      throw new AppError('Action item is already completed', 409);
    }

    const updated = await prisma.nistCsfActionItem.update({
      where: { id },
      data: { status: 'Completed', completedAt: new Date() },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nist_csf.action_item.completed',
      resourceType: 'NistCsfActionItem',
      resourceId: id,
      metadata: { previousStatus: existing.status },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  async getDashboard(organizationId: string): Promise<NistCsfDashboard> {
    const now = new Date();

    const [profiles, assessments, openItems, latestGapTotals] = await Promise.all([
      prisma.nistCsfProfile.findMany({
        where: { organizationId, status: { not: 'Archived' } },
        select: { id: true, profileType: true, status: true },
      }),
      prisma.nistCsfSubcategoryAssessment.findMany({
        where: {
          organizationId,
          profile: { status: { not: 'Archived' } },
        },
        select: {
          function: true,
          currentTier: true,
          targetTier: true,
          priority: true,
          profile: { select: { profileType: true } },
        },
      }),
      prisma.nistCsfActionItem.findMany({
        where: {
          organizationId,
          status: { in: ['Open', 'InProgress', 'Blocked'] },
        },
        select: { priority: true },
      }),
      prisma.nistCsfGapAnalysis.findMany({
        where: { organizationId, function: 'Total' },
        orderBy: { generatedAt: 'desc' },
        take: 1,
        select: { criticalGapCount: true },
      }),
    ]);

    const activeProfiles = {
      current: profiles.filter((p) => p.profileType === 'Current').length,
      target: profiles.filter((p) => p.profileType === 'Target').length,
    };

    const currentVsTargetByFunction = CSF_FUNCTIONS.map((fn) => {
      const currentForFn = assessments.filter(
        (a) => a.function === fn && a.profile.profileType === 'Current'
      );
      const targetForFn = assessments.filter(
        (a) => a.function === fn && a.profile.profileType === 'Target'
      );
      const currentAvgTier = this.weightedAvg(
        currentForFn.map((r) => ({ tier: r.currentTier, priority: r.priority as Priority }))
      );
      const targetAvgTier = this.weightedAvg(
        targetForFn.map((r) => ({ tier: r.targetTier, priority: r.priority as Priority }))
      );
      const deltaTier = currentAvgTier !== null && targetAvgTier !== null
        ? Number((targetAvgTier - currentAvgTier).toFixed(2))
        : null;
      return { function: fn, currentAvgTier, targetAvgTier, deltaTier };
    });

    const openActionItemsByPriority: Record<Priority, number> = {
      Critical: 0, High: 0, Moderate: 0, Low: 0,
    };
    for (const it of openItems) {
      const p = it.priority as Priority;
      openActionItemsByPriority[p] = (openActionItemsByPriority[p] ?? 0) + 1;
    }

    const overallMaturityTier = this.weightedAvg(
      assessments
        .filter((a) => a.profile.profileType === 'Current')
        .map((r) => ({ tier: r.currentTier, priority: r.priority as Priority }))
    );

    return {
      organizationId,
      activeProfiles,
      currentVsTargetByFunction,
      openActionItemsByPriority,
      criticalGaps: latestGapTotals[0]?.criticalGapCount ?? 0,
      overallMaturityTier,
      generatedAt: now,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Internals
  // ═══════════════════════════════════════════════════════════════════════

  private weightedAvg(rows: Array<{ tier: number | null; priority: Priority }>): number | null {
    let sum = 0;
    let weightTotal = 0;
    for (const r of rows) {
      if (r.tier === null || r.tier === undefined) continue;
      const w = PRIORITY_WEIGHT[r.priority] ?? 1;
      sum += r.tier * w;
      weightTotal += w;
    }
    if (weightTotal === 0) return null;
    return Number((sum / weightTotal).toFixed(2));
  }

  private emptyFnSummary(fn: CsfFunction) {
    return {
      function: fn as CsfFunction | 'Total',
      currentAvgTier: null as number | null,
      targetAvgTier: null as number | null,
      deltaTier: null as number | null,
      gapCount: 0,
      criticalGapCount: 0,
      subcategories: [] as Array<{
        subcategoryRef: string;
        currentTier: number | null;
        targetTier: number | null;
        gap: number | null;
        critical: boolean;
      }>,
    };
  }
}

const nistCsfService = new NistCsfService();
export default nistCsfService;
