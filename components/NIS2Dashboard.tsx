/**
 * NIS2 Directive Dashboard
 *
 * Comprehensive management interface for NIS2 compliance:
 * - Entity classification (Essential vs Important)
 * - Sector categorization (energy, transport, banking, health, digital infrastructure, etc.)
 * - Cybersecurity risk management measures (Article 21)
 * - Incident reporting workflow (24hr, 72hr, 1 month)
 * - Supply chain security assessment
 * - Business continuity management
 * - Encryption and MFA requirements
 * - Management body accountability
 * - Penalty risk calculator
 *
 * Reference: Directive (EU) 2022/2555
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import {
  Shield, AlertTriangle, CheckCircle, X, Plus, FileText, Clock,
  Search, Download, Lock, Cpu, ChevronRight, BarChart3, Calendar,
  Bell, Eye, Edit, AlertCircle, ArrowUpRight, Users, Network,
  Server, Key, Activity, Truck, Building2, Zap, Heart,
  Globe, Wifi, Database, HardDrive, MonitorSmartphone, Factory
} from 'lucide-react';

// ── Data Models ──────────────────────────────────────────────────────────

type EntityType = 'essential' | 'important';
type Sector = 'energy' | 'transport' | 'banking' | 'financial_market' | 'health' | 'drinking_water' | 'waste_water' | 'digital_infrastructure' | 'ict_service_management' | 'public_administration' | 'space' | 'postal_courier' | 'waste_management' | 'chemicals' | 'food' | 'manufacturing' | 'digital_providers' | 'research';
type IncidentStatus = 'detected' | 'early_warning_sent' | 'notification_sent' | 'final_report_pending' | 'closed';
type IncidentSeverity = 'critical' | 'significant' | 'minor';
type MeasureStatus = 'implemented' | 'in_progress' | 'planned' | 'not_started';
type SupplierRiskLevel = 'low' | 'medium' | 'high' | 'critical';
type TabKey = 'overview' | 'classification' | 'measures' | 'incidents' | 'supply_chain' | 'compliance';

interface NIS2Entity {
  id: string;
  name: string;
  entityType: EntityType;
  sector: Sector;
  subSector: string;
  memberState: string;
  employeeCount: number;
  annualTurnover: number;
  balanceSheet: number;
  registeredWithAuthority: boolean;
  competentAuthority: string;
  managementTrainingCompleted: boolean;
  lastSecurityAudit: string;
  nextSecurityAudit: string;
}

interface SecurityMeasure {
  id: string;
  article21Ref: string;
  category: string;
  measure: string;
  description: string;
  status: MeasureStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  responsiblePerson: string;
  implementationDate: string | null;
  nextReviewDate: string;
  evidence: string[];
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedDate: string;
  earlyWarningDeadline: string;
  earlyWarningSentDate: string | null;
  notificationDeadline: string;
  notificationSentDate: string | null;
  finalReportDeadline: string;
  finalReportSentDate: string | null;
  affectedServices: string[];
  affectedUsers: number;
  crossBorderImpact: boolean;
  rootCause: string;
  containmentActions: string[];
  remediationActions: string[];
}

interface SupplyChainAssessment {
  id: string;
  supplierName: string;
  service: string;
  riskLevel: SupplierRiskLevel;
  lastAssessment: string;
  nextAssessment: string;
  contractualSecurityClauses: boolean;
  incidentNotificationClause: boolean;
  accessToAuditRights: boolean;
  securityCertifications: string[];
  criticalDependency: boolean;
  alternativeSuppliers: number;
  countryOfOrigin: string;
}

interface BusinessContinuityPlan {
  id: string;
  name: string;
  scope: string;
  lastTested: string;
  nextTest: string;
  rto: number;
  rpo: number;
  backupFrequency: string;
  disasterRecoveryReady: boolean;
  crisisTeamDefined: boolean;
  communicationPlan: boolean;
}

// ── Default Template Data ─────────────────────────────────────────────────

const SECTOR_LABELS: Record<Sector, string> = {
  energy: 'Energy', transport: 'Transport', banking: 'Banking', financial_market: 'Financial Market Infrastructure',
  health: 'Health', drinking_water: 'Drinking Water', waste_water: 'Waste Water',
  digital_infrastructure: 'Digital Infrastructure', ict_service_management: 'ICT Service Management (B2B)',
  public_administration: 'Public Administration', space: 'Space',
  postal_courier: 'Postal & Courier Services', waste_management: 'Waste Management',
  chemicals: 'Manufacture/Production of Chemicals', food: 'Food Production/Distribution',
  manufacturing: 'Manufacturing', digital_providers: 'Digital Providers', research: 'Research',
};

const ESSENTIAL_SECTORS: Sector[] = ['energy', 'transport', 'banking', 'financial_market', 'health', 'drinking_water', 'waste_water', 'digital_infrastructure', 'ict_service_management', 'public_administration', 'space'];
const IMPORTANT_SECTORS: Sector[] = ['postal_courier', 'waste_management', 'chemicals', 'food', 'manufacturing', 'digital_providers', 'research'];

const DEFAULT_ENTITY: NIS2Entity = {
  id: 'ent-001', name: 'TechSecure Infrastructure GmbH', entityType: 'essential',
  sector: 'digital_infrastructure', subSector: 'Cloud computing service provider',
  memberState: 'Germany', employeeCount: 850, annualTurnover: 125000000, balanceSheet: 95000000,
  registeredWithAuthority: true, competentAuthority: 'BSI (Federal Office for Information Security)',
  managementTrainingCompleted: true, lastSecurityAudit: '2025-09-15', nextSecurityAudit: '2026-09-15',
};

const DEFAULT_MEASURES: SecurityMeasure[] = [
  { id: 'sm-001', article21Ref: 'Art. 21(2)(a)', category: 'Risk Analysis', measure: 'Policies on risk analysis and information system security', description: 'Comprehensive risk assessment framework covering all critical information systems and networks.', status: 'implemented', priority: 'critical', responsiblePerson: 'CISO', implementationDate: '2025-06-01', nextReviewDate: '2026-06-01', evidence: ['Risk Assessment Report Q3 2025', 'ISO 27001 Certificate'] },
  { id: 'sm-002', article21Ref: 'Art. 21(2)(b)', category: 'Incident Handling', measure: 'Incident handling procedures', description: 'Procedures for detecting, responding to, and recovering from security incidents including CSIRT integration.', status: 'implemented', priority: 'critical', responsiblePerson: 'SOC Manager', implementationDate: '2025-05-15', nextReviewDate: '2026-05-15', evidence: ['Incident Response Plan v3.2', 'CSIRT registration'] },
  { id: 'sm-003', article21Ref: 'Art. 21(2)(c)', category: 'Business Continuity', measure: 'Business continuity and crisis management', description: 'BCP including backup management, disaster recovery, and crisis management procedures.', status: 'implemented', priority: 'critical', responsiblePerson: 'CTO', implementationDate: '2025-07-01', nextReviewDate: '2026-07-01', evidence: ['BCP Document v2.1', 'DR Test Report Nov 2025'] },
  { id: 'sm-004', article21Ref: 'Art. 21(2)(d)', category: 'Supply Chain Security', measure: 'Supply chain security', description: 'Security measures for relationships with direct suppliers and service providers.', status: 'in_progress', priority: 'high', responsiblePerson: 'Procurement Lead', implementationDate: null, nextReviewDate: '2026-03-01', evidence: ['Vendor Security Questionnaire Template'] },
  { id: 'sm-005', article21Ref: 'Art. 21(2)(e)', category: 'Acquisition Security', measure: 'Security in network and information systems acquisition', description: 'Security requirements for acquisition, development, and maintenance of network and information systems including vulnerability handling.', status: 'in_progress', priority: 'high', responsiblePerson: 'Engineering Lead', implementationDate: null, nextReviewDate: '2026-04-01', evidence: ['Secure SDLC Policy Draft'] },
  { id: 'sm-006', article21Ref: 'Art. 21(2)(f)', category: 'Vulnerability Management', measure: 'Policies and procedures for assessing cybersecurity risk-management effectiveness', description: 'Framework to assess whether the cybersecurity measures are effective, including vulnerability assessments and penetration testing.', status: 'implemented', priority: 'high', responsiblePerson: 'CISO', implementationDate: '2025-08-01', nextReviewDate: '2026-02-01', evidence: ['Pentest Report Q4 2025', 'Vulnerability Scan Results'] },
  { id: 'sm-007', article21Ref: 'Art. 21(2)(g)', category: 'Cybersecurity Training', measure: 'Basic cyber hygiene practices and training', description: 'Cybersecurity awareness training for all employees and specific training for management bodies.', status: 'implemented', priority: 'medium', responsiblePerson: 'HR / CISO', implementationDate: '2025-04-01', nextReviewDate: '2026-04-01', evidence: ['Training completion records 94%', 'Management briefing slides'] },
  { id: 'sm-008', article21Ref: 'Art. 21(2)(h)', category: 'Cryptography', measure: 'Policies on the use of cryptography and encryption', description: 'Encryption policies for data at rest and in transit, key management procedures, and approved algorithms.', status: 'implemented', priority: 'high', responsiblePerson: 'Security Architect', implementationDate: '2025-06-15', nextReviewDate: '2026-06-15', evidence: ['Encryption Policy v2.0', 'Key Management SOP'] },
  { id: 'sm-009', article21Ref: 'Art. 21(2)(i)', category: 'Human Resources', measure: 'Human resources security, access control, and asset management', description: 'Background checks, access control policies, privileged access management, and comprehensive asset inventory.', status: 'in_progress', priority: 'high', responsiblePerson: 'IT Director', implementationDate: null, nextReviewDate: '2026-05-01', evidence: ['PAM implementation 60% complete'] },
  { id: 'sm-010', article21Ref: 'Art. 21(2)(j)', category: 'Multi-factor Authentication', measure: 'Multi-factor authentication and continuous authentication', description: 'MFA for all critical systems, secured voice/video/text communications, and emergency communication systems.', status: 'in_progress', priority: 'critical', responsiblePerson: 'IT Director', implementationDate: null, nextReviewDate: '2026-03-15', evidence: ['MFA rollout 80% complete'] },
];

const DEFAULT_INCIDENTS: SecurityIncident[] = [
  {
    id: 'inc-001', title: 'Ransomware Attack on File Storage', description: 'Ransomware variant detected encrypting files on secondary NAS cluster. Isolated before spreading to production systems.',
    severity: 'significant', status: 'final_report_pending',
    detectedDate: '2026-01-20T03:45:00Z',
    earlyWarningDeadline: '2026-01-21T03:45:00Z', earlyWarningSentDate: '2026-01-20T08:30:00Z',
    notificationDeadline: '2026-01-23T03:45:00Z', notificationSentDate: '2026-01-22T14:00:00Z',
    finalReportDeadline: '2026-02-20T03:45:00Z', finalReportSentDate: null,
    affectedServices: ['File Storage', 'Backup Systems'], affectedUsers: 320, crossBorderImpact: false,
    rootCause: 'Phishing email with malicious macro targeting finance department.',
    containmentActions: ['Isolated NAS cluster', 'Blocked malicious IPs', 'Revoked compromised credentials'],
    remediationActions: ['Restored from clean backup', 'Enhanced email filtering rules', 'Mandatory security re-training'],
  },
  {
    id: 'inc-002', title: 'DDoS Attack on Customer Portal', description: 'Volumetric DDoS attack targeting customer-facing web portal, causing 4-hour service degradation.',
    severity: 'significant', status: 'closed',
    detectedDate: '2025-11-05T14:20:00Z',
    earlyWarningDeadline: '2025-11-06T14:20:00Z', earlyWarningSentDate: '2025-11-05T16:00:00Z',
    notificationDeadline: '2025-11-08T14:20:00Z', notificationSentDate: '2025-11-07T10:00:00Z',
    finalReportDeadline: '2025-12-05T14:20:00Z', finalReportSentDate: '2025-12-03T09:00:00Z',
    affectedServices: ['Customer Portal', 'API Gateway'], affectedUsers: 15000, crossBorderImpact: true,
    rootCause: 'Coordinated botnet attack exploiting unprotected API endpoints.',
    containmentActions: ['Activated DDoS mitigation service', 'Implemented rate limiting', 'Geo-blocking of attack source countries'],
    remediationActions: ['Deployed WAF rules', 'Enhanced CDN configuration', 'API endpoint hardening'],
  },
  {
    id: 'inc-003', title: 'Unauthorized Access to Admin Panel', description: 'Suspicious login to admin panel from unknown IP. Investigation revealed credential stuffing using leaked credentials.',
    severity: 'minor', status: 'early_warning_sent',
    detectedDate: '2026-02-16T22:10:00Z',
    earlyWarningDeadline: '2026-02-17T22:10:00Z', earlyWarningSentDate: '2026-02-17T06:30:00Z',
    notificationDeadline: '2026-02-19T22:10:00Z', notificationSentDate: null,
    finalReportDeadline: '2026-03-16T22:10:00Z', finalReportSentDate: null,
    affectedServices: ['Admin Panel'], affectedUsers: 1, crossBorderImpact: false,
    rootCause: 'Credential stuffing attack using breached passwords from third-party data breach.',
    containmentActions: ['Forced password reset for affected account', 'Blocked source IP range', 'Enabled account lockout policy'],
    remediationActions: ['Mandatory MFA enforcement for all admin accounts', 'Deploy credential monitoring service'],
  },
];

const DEFAULT_SUPPLIERS: SupplyChainAssessment[] = [
  { id: 'sup-001', supplierName: 'CloudBase EU', service: 'IaaS - Primary cloud infrastructure', riskLevel: 'high', lastAssessment: '2025-10-01', nextAssessment: '2026-04-01', contractualSecurityClauses: true, incidentNotificationClause: true, accessToAuditRights: true, securityCertifications: ['ISO 27001', 'SOC 2 Type II', 'CSA STAR'], criticalDependency: true, alternativeSuppliers: 2, countryOfOrigin: 'Netherlands' },
  { id: 'sup-002', supplierName: 'SecureComm AG', service: 'Managed SOC services', riskLevel: 'medium', lastAssessment: '2025-08-15', nextAssessment: '2026-02-15', contractualSecurityClauses: true, incidentNotificationClause: true, accessToAuditRights: true, securityCertifications: ['ISO 27001', 'SOC 2 Type II'], criticalDependency: false, alternativeSuppliers: 3, countryOfOrigin: 'Germany' },
  { id: 'sup-003', supplierName: 'DataPipe Networks', service: 'Network connectivity and CDN', riskLevel: 'high', lastAssessment: '2025-09-20', nextAssessment: '2026-03-20', contractualSecurityClauses: true, incidentNotificationClause: false, accessToAuditRights: false, securityCertifications: ['ISO 27001'], criticalDependency: true, alternativeSuppliers: 1, countryOfOrigin: 'France' },
  { id: 'sup-004', supplierName: 'OfficeTools SaaS', service: 'Productivity and collaboration tools', riskLevel: 'low', lastAssessment: '2025-07-01', nextAssessment: '2026-07-01', contractualSecurityClauses: true, incidentNotificationClause: true, accessToAuditRights: false, securityCertifications: ['SOC 2 Type II'], criticalDependency: false, alternativeSuppliers: 5, countryOfOrigin: 'Ireland' },
  { id: 'sup-005', supplierName: 'SinoTech Components', service: 'Hardware components for edge devices', riskLevel: 'critical', lastAssessment: '2025-11-10', nextAssessment: '2026-05-10', contractualSecurityClauses: false, incidentNotificationClause: false, accessToAuditRights: false, securityCertifications: [], criticalDependency: true, alternativeSuppliers: 0, countryOfOrigin: 'China' },
];

const DEFAULT_BCP: BusinessContinuityPlan[] = [
  { id: 'bcp-001', name: 'Core Platform Continuity Plan', scope: 'Primary cloud infrastructure and customer-facing services', lastTested: '2025-11-15', nextTest: '2026-05-15', rto: 4, rpo: 1, backupFrequency: 'Hourly', disasterRecoveryReady: true, crisisTeamDefined: true, communicationPlan: true },
  { id: 'bcp-002', name: 'Internal IT Systems BCP', scope: 'Corporate email, HR, finance, and internal tools', lastTested: '2025-09-01', nextTest: '2026-03-01', rto: 24, rpo: 4, backupFrequency: 'Daily', disasterRecoveryReady: true, crisisTeamDefined: true, communicationPlan: true },
  { id: 'bcp-003', name: 'Data Center Failover Plan', scope: 'Physical data center operations and connectivity', lastTested: '2025-06-20', nextTest: '2026-06-20', rto: 2, rpo: 0.5, backupFrequency: 'Real-time replication', disasterRecoveryReady: true, crisisTeamDefined: true, communicationPlan: false },
];

// ── Helper Functions ─────────────────────────────────────────────────────

const formatDate = (d: string | null): string => { if (!d) return '--'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
const formatCurrency = (n: number): string => new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const formatNumber = (n: number): string => n.toLocaleString('en-US');

const riskColor = (level: SupplierRiskLevel): string => {
  switch (level) { case 'critical': return 'bg-red-100 text-red-800'; case 'high': return 'bg-orange-100 text-orange-800'; case 'medium': return 'bg-yellow-100 text-yellow-800'; case 'low': return 'bg-green-100 text-green-800'; }
};

const measureStatusColor = (s: MeasureStatus): string => {
  switch (s) { case 'implemented': return 'bg-green-100 text-green-800'; case 'in_progress': return 'bg-blue-100 text-blue-800'; case 'planned': return 'bg-yellow-100 text-yellow-800'; case 'not_started': return 'bg-gray-100 text-gray-600'; }
};

const incidentSeverityColor = (s: IncidentSeverity): string => {
  switch (s) { case 'critical': return 'bg-red-100 text-red-800'; case 'significant': return 'bg-orange-100 text-orange-800'; case 'minor': return 'bg-yellow-100 text-yellow-800'; }
};

const incidentStatusColor = (s: IncidentStatus): string => {
  switch (s) { case 'detected': return 'bg-red-100 text-red-800'; case 'early_warning_sent': return 'bg-orange-100 text-orange-800'; case 'notification_sent': return 'bg-yellow-100 text-yellow-800'; case 'final_report_pending': return 'bg-blue-100 text-blue-800'; case 'closed': return 'bg-green-100 text-green-800'; }
};

const hoursRemaining = (deadline: string): number => Math.max(0, (new Date(deadline).getTime() - Date.now()) / 3600000);

const renderScoreBar = (score: number, max: number = 100) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div className={`h-2.5 rounded-full ${score / max >= 0.8 ? 'bg-green-500' : score / max >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
      style={{ width: `${Math.min(100, (score / max) * 100)}%` }} />
  </div>
);

// ── Component ────────────────────────────────────────────────────────────

export const NIS2Dashboard: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  // Server is the source of truth. DEFAULT_* values are reference fixtures used only when
  // the API is unreachable so empty arrays don't get masked by static data.
  const [entity, setEntity] = useState<NIS2Entity>(DEFAULT_ENTITY);
  const [measures, setMeasures] = useState<SecurityMeasure[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [suppliers, setSuppliers] = useState<SupplyChainAssessment[]>([]);
  const [bcps, setBcps] = useState<BusinessContinuityPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean>(true);

  // Load data from backend, fall back to defaults when the server is unreachable
  useEffect(() => {
    (async () => {
      try {
        const saved = await api.regulationData.getAll('nis2');
        if (saved && typeof saved === 'object') {
          if (saved.entity) setEntity(saved.entity);
          setMeasures(Array.isArray(saved.measures) ? saved.measures : []);
          setIncidents(Array.isArray(saved.incidents) ? saved.incidents : []);
          setSuppliers(Array.isArray(saved.suppliers) ? saved.suppliers : []);
          setBcps(Array.isArray(saved.bcps) ? saved.bcps : []);
        }
        setServerReachable(true);
      } catch (err: any) {
        setServerReachable(false);
        setLoadError('Unable to connect to server. Showing reference template data.');
        setEntity(DEFAULT_ENTITY);
        setMeasures(DEFAULT_MEASURES);
        setIncidents(DEFAULT_INCIDENTS);
        setSuppliers(DEFAULT_SUPPLIERS);
        setBcps(DEFAULT_BCP);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Auto-save when data changes (debounced)
  useEffect(() => {
    if (isLoading || !serverReachable) return;
    const timer = setTimeout(() => {
      Promise.all([
        api.regulationData.save('nis2', 'entity', entity),
        api.regulationData.save('nis2', 'measures', measures),
        api.regulationData.save('nis2', 'incidents', incidents),
        api.regulationData.save('nis2', 'suppliers', suppliers),
        api.regulationData.save('nis2', 'bcps', bcps),
      ]).catch(() => {
        setLoadError('Failed to save changes. Please retry.');
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [entity, measures, incidents, suppliers, bcps, isLoading, serverReachable]);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);

  const [incidentForm, setIncidentForm] = useState({
    title: '', description: '', severity: 'significant' as IncidentSeverity,
    affectedServices: '', affectedUsers: 0, crossBorderImpact: false,
  });

  // ── Computed ──

  const implementedMeasures = useMemo(() => measures.filter(m => m.status === 'implemented').length, [measures]);
  const measureComplianceRate = useMemo(() => measures.length > 0 ? Math.round((implementedMeasures / measures.length) * 100) : 0, [implementedMeasures, measures]);
  const openIncidents = useMemo(() => incidents.filter(i => i.status !== 'closed').length, [incidents]);
  const criticalSuppliers = useMemo(() => suppliers.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length, [suppliers]);

  const penaltyRisk = useMemo(() => {
    if (entity.entityType === 'essential') {
      return { maxFine: Math.max(10000000, entity.annualTurnover * 0.02), percentage: '2%', fixedMax: '10,000,000' };
    } else {
      return { maxFine: Math.max(7000000, entity.annualTurnover * 0.014), percentage: '1.4%', fixedMax: '7,000,000' };
    }
  }, [entity]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.description.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [incidents, searchTerm]);

  // ── Handlers ──

  // NIS2 Article 23 records are legally mandated, so persist incident changes
  // immediately (awaited) rather than relying only on the debounced auto-save.
  const persistIncidents = useCallback(async (next: SecurityIncident[]): Promise<boolean> => {
    if (!serverReachable) {
      setLoadError('Server unreachable: the incident record could not be saved. Please reconnect and retry.');
      return false;
    }
    try {
      await api.regulationData.save('nis2', 'incidents', next);
      return true;
    } catch {
      setLoadError('Failed to save the incident record. The change is not persisted — please retry.');
      return false;
    }
  }, [serverReachable]);

  const handleReportIncident = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const newIncident: SecurityIncident = {
      id: `inc-${Date.now()}`, title: incidentForm.title, description: incidentForm.description,
      severity: incidentForm.severity, status: 'detected', detectedDate: now.toISOString(),
      earlyWarningDeadline: new Date(now.getTime() + 24 * 3600000).toISOString(), earlyWarningSentDate: null,
      notificationDeadline: new Date(now.getTime() + 72 * 3600000).toISOString(), notificationSentDate: null,
      finalReportDeadline: new Date(now.getTime() + 30 * 24 * 3600000).toISOString(), finalReportSentDate: null,
      affectedServices: incidentForm.affectedServices.split(',').map(s => s.trim()).filter(Boolean),
      affectedUsers: incidentForm.affectedUsers, crossBorderImpact: incidentForm.crossBorderImpact,
      rootCause: '', containmentActions: [], remediationActions: [],
    };
    const next = [newIncident, ...incidents];
    setIncidents(next);
    const ok = await persistIncidents(next);
    if (!ok) return;
    setShowIncidentModal(false);
    setIncidentForm({ title: '', description: '', severity: 'significant', affectedServices: '', affectedUsers: 0, crossBorderImpact: false });
  }, [incidentForm, incidents, persistIncidents]);

  const handleSendEarlyWarning = useCallback(async (incId: string) => {
    const next = incidents.map(i => i.id === incId ? { ...i, status: 'early_warning_sent' as IncidentStatus, earlyWarningSentDate: new Date().toISOString() } : i);
    setIncidents(next);
    await persistIncidents(next);
  }, [incidents, persistIncidents]);

  const handleSendNotification = useCallback(async (incId: string) => {
    const next = incidents.map(i => i.id === incId ? { ...i, status: 'notification_sent' as IncidentStatus, notificationSentDate: new Date().toISOString() } : i);
    setIncidents(next);
    await persistIncidents(next);
  }, [incidents, persistIncidents]);

  const handleDownloadReport = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(), reportType: 'NIS2 Compliance Report',
      entity: { name: entity.name, type: entity.entityType, sector: entity.sector },
      measureCompliance: measureComplianceRate + '%', openIncidents, criticalSuppliers,
      measures: measures.map(m => ({ ref: m.article21Ref, measure: m.measure, status: m.status })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nis2-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [entity, measureComplianceRate, openIncidents, criticalSuppliers, measures]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: t('common.overview'), icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'classification', label: 'Classification', icon: <Building2 className="w-4 h-4" /> },
    { key: 'measures', label: 'Risk Measures', icon: <Shield className="w-4 h-4" /> },
    { key: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'supply_chain', label: 'Supply Chain', icon: <Truck className="w-4 h-4" /> },
    { key: 'compliance', label: 'Compliance', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  // ── Tab: Overview ──

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Entity Type</p><p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{entity.entityType}</p></div>
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{SECTOR_LABELS[entity.sector]}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Security Measures</p><p className="text-2xl font-bold text-gray-900 mt-1">{measureComplianceRate}%</p></div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">{renderScoreBar(measureComplianceRate)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Open Incidents</p><p className="text-2xl font-bold text-gray-900 mt-1">{openIncidents}</p></div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{incidents.length} total incidents tracked</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">High-Risk Suppliers</p><p className="text-2xl font-bold text-gray-900 mt-1">{criticalSuppliers}</p></div>
            <Truck className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{suppliers.length} total suppliers assessed</p>
        </div>
      </div>

      {/* Urgent Incident Alerts */}
      {incidents.filter(i => i.status === 'detected').length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2"><Bell className="w-5 h-5 text-red-600" /><h4 className="font-semibold text-red-800">Urgent: 24-Hour Early Warning Required</h4></div>
          {incidents.filter(i => i.status === 'detected').map(inc => (
            <div key={inc.id} className="flex items-center justify-between bg-white rounded p-3 mt-2 border border-red-200">
              <div>
                <p className="font-medium text-gray-900">{inc.title}</p>
                <p className="text-sm text-red-700"><Clock className="w-3 h-3 inline mr-1" />{hoursRemaining(inc.earlyWarningDeadline).toFixed(1)}h remaining</p>
              </div>
              <button onClick={() => handleSendEarlyWarning(inc.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> Send Early Warning</button>
            </div>
          ))}
        </div>
      )}

      {/* Penalty Risk */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Penalty Risk Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600">Maximum Penalty</p>
            <p className="text-2xl font-bold text-red-800">{formatCurrency(penaltyRisk.maxFine)}</p>
            <p className="text-xs text-red-600 mt-1">{entity.entityType === 'essential' ? '10M or 2% of turnover' : '7M or 1.4% of turnover'} (whichever is higher)</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600">Non-Compliance Areas</p>
            <p className="text-2xl font-bold text-orange-800">{measures.filter(m => m.status !== 'implemented').length}</p>
            <p className="text-xs text-orange-600 mt-1">measures not yet implemented</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">Management Liability</p>
            <p className="text-2xl font-bold text-yellow-800">{entity.managementTrainingCompleted ? 'Training Complete' : 'Training Required'}</p>
            <p className="text-xs text-yellow-600 mt-1">Art. 20 - Management bodies personally accountable</p>
          </div>
        </div>
      </div>

      {/* Article 21 Measures Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Article 21 - Cybersecurity Risk Measures</h3>
        <div className="space-y-2">
          {measures.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <span className={`w-3 h-3 rounded-full ${m.status === 'implemented' ? 'bg-green-500' : m.status === 'in_progress' ? 'bg-blue-500' : m.status === 'planned' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500 w-24 font-mono">{m.article21Ref}</span>
              <span className="text-sm text-gray-900 flex-1">{m.measure}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${measureStatusColor(m.status)}`}>{m.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Classification ──

  const renderClassification = () => (
    <div className="space-y-6">
      {/* Entity Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Classification</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className="text-sm font-medium text-gray-500">Entity Name</label><p className="text-gray-900 font-medium">{entity.name}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Entity Type</label><p className="mt-1"><span className={`px-3 py-1 rounded-full text-sm font-medium ${entity.entityType === 'essential' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{entity.entityType.toUpperCase()}</span></p></div>
          <div><label className="text-sm font-medium text-gray-500">Sector</label><p className="text-gray-900">{SECTOR_LABELS[entity.sector]}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Sub-Sector</label><p className="text-gray-900">{entity.subSector}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Member State</label><p className="text-gray-900">{entity.memberState}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Competent Authority</label><p className="text-gray-900">{entity.competentAuthority}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Employees</label><p className="text-gray-900">{formatNumber(entity.employeeCount)}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Annual Turnover</label><p className="text-gray-900">{formatCurrency(entity.annualTurnover)}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Balance Sheet</label><p className="text-gray-900">{formatCurrency(entity.balanceSheet)}</p></div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-sm">{entity.registeredWithAuthority ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />} Registered with Authority</span>
          <span className="flex items-center gap-2 text-sm">{entity.managementTrainingCompleted ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />} Management Training Complete</span>
        </div>
      </div>

      {/* Sector Classification Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-red-600" /> Essential Entities (Annex I)</h3>
          <p className="text-sm text-gray-600 mb-3">Entities in sectors of high criticality. Subject to proactive supervision and higher penalties.</p>
          <div className="space-y-1">
            {ESSENTIAL_SECTORS.map(s => (
              <div key={s} className={`flex items-center gap-2 p-2 rounded text-sm ${entity.sector === s ? 'bg-red-50 border border-red-200 font-medium' : 'hover:bg-gray-50'}`}>
                {entity.sector === s && <ChevronRight className="w-4 h-4 text-red-600" />}
                <span>{SECTOR_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-yellow-600" /> Important Entities (Annex II)</h3>
          <p className="text-sm text-gray-600 mb-3">Entities in other critical sectors. Subject to reactive supervision and lower penalties.</p>
          <div className="space-y-1">
            {IMPORTANT_SECTORS.map(s => (
              <div key={s} className={`flex items-center gap-2 p-2 rounded text-sm ${entity.sector === s ? 'bg-yellow-50 border border-yellow-200 font-medium' : 'hover:bg-gray-50'}`}>
                {entity.sector === s && <ChevronRight className="w-4 h-4 text-yellow-600" />}
                <span>{SECTOR_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Size Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Classification Thresholds</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Criterion</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Medium (min)</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Large (min)</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Your Entity</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-3 text-sm">Employees</td><td className="px-4 py-3 text-sm">50+</td><td className="px-4 py-3 text-sm">250+</td><td className="px-4 py-3 text-sm font-medium">{formatNumber(entity.employeeCount)}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">In Scope</span></td></tr>
              <tr><td className="px-4 py-3 text-sm">Annual Turnover</td><td className="px-4 py-3 text-sm">10M+</td><td className="px-4 py-3 text-sm">50M+</td><td className="px-4 py-3 text-sm font-medium">{formatCurrency(entity.annualTurnover)}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">In Scope</span></td></tr>
              <tr><td className="px-4 py-3 text-sm">Balance Sheet</td><td className="px-4 py-3 text-sm">10M+</td><td className="px-4 py-3 text-sm">43M+</td><td className="px-4 py-3 text-sm font-medium">{formatCurrency(entity.balanceSheet)}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">In Scope</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Tab: Risk Measures ──

  const renderMeasures = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['implemented', 'in_progress', 'planned', 'not_started'] as MeasureStatus[]).map(status => (
          <div key={status} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{measures.filter(m => m.status === status).length}</p>
            <p className="text-sm text-gray-500 capitalize">{status.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200"><h4 className="font-semibold text-gray-900">Article 21 - Cybersecurity Risk-Management Measures</h4></div>
        <div className="divide-y divide-gray-100">
          {measures.map(m => (
            <div key={m.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{m.article21Ref}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.priority === 'critical' ? 'bg-red-100 text-red-800' : m.priority === 'high' ? 'bg-orange-100 text-orange-800' : m.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{m.priority.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${measureStatusColor(m.status)}`}>{m.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <span className="text-xs text-gray-500">Responsible: {m.responsiblePerson}</span>
              </div>
              <h5 className="font-medium text-gray-900 mb-1">{m.measure}</h5>
              <p className="text-sm text-gray-600 mb-2">{m.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.implementationDate ? `Implemented: ${formatDate(m.implementationDate)}` : `Next Review: ${formatDate(m.nextReviewDate)}`}</span>
                {m.evidence.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {m.evidence.length} evidence doc{m.evidence.length > 1 ? 's' : ''}</span>}
              </div>
              {m.evidence.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{m.evidence.map((e, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{e}</span>)}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Incidents ──

  const renderIncidents = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search incidents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setShowIncidentModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Report Incident</button>
      </div>

      {/* Reporting Timeline Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">NIS2 Incident Reporting Timeline (Article 23)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Clock className="w-5 h-5 text-red-600" /></div>
            <div><p className="font-medium text-gray-900 text-sm">24 Hours</p><p className="text-xs text-gray-600">Early warning to CSIRT/competent authority</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Clock className="w-5 h-5 text-orange-600" /></div>
            <div><p className="font-medium text-gray-900 text-sm">72 Hours</p><p className="text-xs text-gray-600">Incident notification with assessment and IoCs</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div><p className="font-medium text-gray-900 text-sm">1 Month</p><p className="text-xs text-gray-600">Final report with root cause and remediation</p></div>
          </div>
        </div>
      </div>

      {/* Incident List */}
      {filteredIncidents.map(inc => (
        <div key={inc.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-gray-900">{inc.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${incidentSeverityColor(inc.severity)}`}>{inc.severity.toUpperCase()}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${incidentStatusColor(inc.status)}`}>{inc.status.replace('_', ' ').toUpperCase()}</span>
                {inc.crossBorderImpact && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">CROSS-BORDER</span>}
              </div>
              <p className="text-sm text-gray-600">{inc.description}</p>
            </div>
            <button onClick={() => { setSelectedIncident(inc); setShowDetailModal(true); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"><Eye className="w-4 h-4" /></button>
          </div>

          {/* Reporting Milestones */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={`p-3 rounded-lg border ${inc.earlyWarningSentDate ? 'bg-green-50 border-green-200' : hoursRemaining(inc.earlyWarningDeadline) <= 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className="text-xs font-medium text-gray-700">24h Early Warning</p>
              {inc.earlyWarningSentDate ? (
                <p className="text-xs text-green-700 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Sent {formatDate(inc.earlyWarningSentDate)}</p>
              ) : (
                <div>
                  <p className="text-xs text-orange-700 mt-1">{hoursRemaining(inc.earlyWarningDeadline).toFixed(1)}h remaining</p>
                  <button onClick={() => handleSendEarlyWarning(inc.id)} className="mt-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Send</button>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg border ${inc.notificationSentDate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-medium text-gray-700">72h Notification</p>
              {inc.notificationSentDate ? (
                <p className="text-xs text-green-700 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Sent {formatDate(inc.notificationSentDate)}</p>
              ) : inc.earlyWarningSentDate ? (
                <div>
                  <p className="text-xs text-gray-600 mt-1">{hoursRemaining(inc.notificationDeadline).toFixed(1)}h remaining</p>
                  <button onClick={() => handleSendNotification(inc.id)} className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Send</button>
                </div>
              ) : <p className="text-xs text-gray-400 mt-1">Awaiting early warning</p>}
            </div>
            <div className={`p-3 rounded-lg border ${inc.finalReportSentDate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-medium text-gray-700">1 Month Final Report</p>
              {inc.finalReportSentDate ? (
                <p className="text-xs text-green-700 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Sent {formatDate(inc.finalReportSentDate)}</p>
              ) : <p className="text-xs text-gray-600 mt-1">Due: {formatDate(inc.finalReportDeadline)}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Tab: Supply Chain ──

  const renderSupplyChain = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p><p className="text-sm text-gray-500">Total Suppliers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{suppliers.filter(s => s.riskLevel === 'critical').length}</p><p className="text-sm text-gray-500">Critical Risk</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{suppliers.filter(s => s.contractualSecurityClauses).length}</p><p className="text-sm text-gray-500">With Security Clauses</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{suppliers.filter(s => s.criticalDependency && s.alternativeSuppliers === 0).length}</p><p className="text-sm text-gray-500">Single Point of Failure</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200"><h4 className="font-semibold text-gray-900">Supply Chain Security Assessment (Art. 21(2)(d))</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Supplier</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Service</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Risk</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Security Clauses</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Incident Clause</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Audit Rights</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Certifications</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Critical</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Alt. Suppliers</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Country</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.supplierName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{s.service}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor(s.riskLevel)}`}>{s.riskLevel.toUpperCase()}</span></td>
                  <td className="px-4 py-3 text-center">{s.contractualSecurityClauses ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{s.incidentNotificationClause ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{s.accessToAuditRights ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-red-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-sm"><div className="flex flex-wrap gap-1">{s.securityCertifications.length > 0 ? s.securityCertifications.map(c => <span key={c} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c}</span>) : <span className="text-gray-400 text-xs">None</span>}</div></td>
                  <td className="px-4 py-3 text-center">{s.criticalDependency ? <AlertTriangle className="w-4 h-4 text-red-600 mx-auto" /> : <span className="text-gray-400 text-xs">No</span>}</td>
                  <td className="px-4 py-3 text-center text-sm">{s.alternativeSuppliers}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.countryOfOrigin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Continuity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Continuity Plans (Art. 21(2)(c))</h3>
        <div className="space-y-4">
          {bcps.map(bcp => (
            <div key={bcp.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div><h4 className="font-medium text-gray-900">{bcp.name}</h4><p className="text-sm text-gray-600">{bcp.scope}</p></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                <div><span className="text-gray-500 text-xs">RTO</span><p className="font-medium">{bcp.rto}h</p></div>
                <div><span className="text-gray-500 text-xs">RPO</span><p className="font-medium">{bcp.rpo}h</p></div>
                <div><span className="text-gray-500 text-xs">Backup</span><p className="font-medium">{bcp.backupFrequency}</p></div>
                <div><span className="text-gray-500 text-xs">Last Tested</span><p className="font-medium">{formatDate(bcp.lastTested)}</p></div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs">{bcp.disasterRecoveryReady ? <CheckCircle className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />} DR Ready</span>
                <span className="flex items-center gap-1 text-xs">{bcp.crisisTeamDefined ? <CheckCircle className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />} Crisis Team</span>
                <span className="flex items-center gap-1 text-xs">{bcp.communicationPlan ? <CheckCircle className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />} Comms Plan</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Compliance ──

  // True when the Article 21 measure with the given id is marked implemented.
  const isMeasureImplemented = useCallback(
    (measureId: string) => measures.some(m => m.id === measureId && m.status === 'implemented'),
    [measures]
  );
  // Cross-border process counts as exercised once an incident flagged cross-border
  // has reached the notification-sent stage (or beyond).
  const crossBorderProcessTested = useMemo(
    () => incidents.some(i => i.crossBorderImpact && (i.notificationSentDate !== null || i.finalReportSentDate !== null)),
    [incidents]
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div><h3 className="text-xl font-semibold">NIS2 Compliance Score</h3><p className="text-indigo-200">Based on Article 21 measures implementation, incident handling, and supply chain readiness</p></div>
          <div className="text-right"><p className="text-5xl font-bold">{measureComplianceRate}%</p><p className="text-indigo-200">measures implemented</p></div>
        </div>
        <div className="mt-4"><div className="w-full bg-indigo-800 rounded-full h-3"><div className="bg-white rounded-full h-3" style={{ width: `${measureComplianceRate}%` }} /></div></div>
      </div>

      {/* Penalty Calculator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Penalty Risk Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">Essential Entities</h4>
            <p className="text-3xl font-bold text-red-900">{formatCurrency(10000000)}</p>
            <p className="text-sm text-red-700">or 2% of total worldwide annual turnover</p>
            <p className="text-xs text-red-600 mt-2">Whichever is higher. Your exposure: {formatCurrency(penaltyRisk.maxFine)}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-2">Important Entities</h4>
            <p className="text-3xl font-bold text-orange-900">{formatCurrency(7000000)}</p>
            <p className="text-sm text-orange-700">or 1.4% of total worldwide annual turnover</p>
            <p className="text-xs text-orange-600 mt-2">Whichever is higher. Additional: management body personal accountability.</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Management Accountability (Art. 20):</strong> Members of management bodies can be held personally liable for NIS2 non-compliance. They must approve cybersecurity measures, oversee implementation, and undergo regular cybersecurity training.
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">NIS2 Compliance Checklist</h3>
        <div className="space-y-3">
          {[
            { label: 'Entity registered with competent authority', done: entity.registeredWithAuthority },
            { label: 'Management body cybersecurity training completed', done: entity.managementTrainingCompleted },
            { label: 'All Article 21 cybersecurity measures implemented', done: measures.length > 0 && measureComplianceRate === 100 },
            // Incident reporting (Art. 21(2)(b)) → sm-002 incident handling
            { label: 'Incident reporting procedures established (24h/72h/1mo)', done: isMeasureImplemented('sm-002') },
            { label: 'Supply chain security assessments completed', done: suppliers.length > 0 && suppliers.every(s => s.contractualSecurityClauses) },
            { label: 'Business continuity plans tested', done: bcps.length > 0 && bcps.every(b => b.disasterRecoveryReady) },
            // MFA (Art. 21(2)(j)) → sm-010
            { label: 'MFA deployed for all critical systems', done: isMeasureImplemented('sm-010') },
            // Cryptography (Art. 21(2)(h)) → sm-008
            { label: 'Encryption policies implemented', done: isMeasureImplemented('sm-008') },
            // Acquisition/vulnerability handling (Art. 21(2)(e)) → sm-005
            { label: 'Vulnerability handling and disclosure process active', done: isMeasureImplemented('sm-005') },
            // Effectiveness assessment / pentests (Art. 21(2)(f)) → sm-006
            { label: 'Regular security audits conducted', done: isMeasureImplemented('sm-006') },
            // CSIRT integration is part of incident handling (Art. 21(2)(b)) → sm-002
            { label: 'CSIRT integration verified', done: isMeasureImplemented('sm-002') },
            { label: 'Cross-border incident notification process tested', done: crossBorderProcessTested },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <input type="checkbox" checked={item.done} readOnly className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className={`text-sm ${item.done ? 'text-gray-900 line-through' : 'text-gray-700'}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Main Render ──

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('euRegulations.nis2')}</h2>
          <p className="text-gray-600 mt-1">Network and Information Security Directive (EU) 2022/2555</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPenaltyModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Penalty Risk</button>
          <button onClick={handleDownloadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Download className="w-4 h-4" /> Export Report</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-700 flex-1">{loadError}</span>
          <button onClick={() => setLoadError(null)} className="text-amber-500 hover:text-amber-700"><X className="w-3 h-3" /></button>
        </div>
      )}

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'classification' && renderClassification()}
      {activeTab === 'measures' && renderMeasures()}
      {activeTab === 'incidents' && renderIncidents()}
      {activeTab === 'supply_chain' && renderSupplyChain()}
      {activeTab === 'compliance' && renderCompliance()}

      {/* ── Report Incident Modal ── */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Report Security Incident</h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReportIncident} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <strong>NIS2 Article 23:</strong> Significant incidents must be reported within 24 hours (early warning), 72 hours (notification), and 1 month (final report).
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Incident Title *</label><input type="text" required value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea required value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label><select value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as IncidentSeverity })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="critical">Critical</option><option value="significant">Significant</option><option value="minor">Minor</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Affected Users</label><input type="number" min={0} value={incidentForm.affectedUsers} onChange={(e) => setIncidentForm({ ...incidentForm, affectedUsers: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Affected Services (comma-separated)</label><input type="text" value={incidentForm.affectedServices} onChange={(e) => setIncidentForm({ ...incidentForm, affectedServices: e.target.value })} placeholder="e.g., Customer Portal, API Gateway" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={incidentForm.crossBorderImpact} onChange={(e) => setIncidentForm({ ...incidentForm, crossBorderImpact: e.target.checked })} className="rounded border-gray-300 text-red-600" /><span className="text-sm text-gray-700">Cross-border impact (affects other EU member states)</span></label>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Report Incident</button>
                <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Incident Detail Modal ── */}
      {showDetailModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedIncident.title}</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedIncident(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">{selectedIncident.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-500">Severity</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${incidentSeverityColor(selectedIncident.severity)}`}>{selectedIncident.severity.toUpperCase()}</span></p></div>
                <div><label className="text-sm font-medium text-gray-500">Status</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${incidentStatusColor(selectedIncident.status)}`}>{selectedIncident.status.replace('_', ' ').toUpperCase()}</span></p></div>
                <div><label className="text-sm font-medium text-gray-500">Detected</label><p className="text-sm mt-1">{formatDate(selectedIncident.detectedDate)}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Affected Users</label><p className="text-sm mt-1">{formatNumber(selectedIncident.affectedUsers)}</p></div>
              </div>
              {selectedIncident.rootCause && <div><label className="text-sm font-medium text-gray-500">Root Cause</label><p className="text-sm mt-1">{selectedIncident.rootCause}</p></div>}
              {selectedIncident.containmentActions.length > 0 && <div><label className="text-sm font-medium text-gray-500">Containment Actions</label><ul className="list-disc list-inside text-sm mt-1">{selectedIncident.containmentActions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
              {selectedIncident.remediationActions.length > 0 && <div><label className="text-sm font-medium text-gray-500">Remediation Actions</label><ul className="list-disc list-inside text-sm mt-1">{selectedIncident.remediationActions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
              {selectedIncident.affectedServices.length > 0 && <div><label className="text-sm font-medium text-gray-500">Affected Services</label><div className="flex flex-wrap gap-1 mt-1">{selectedIncident.affectedServices.map(s => <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s}</span>)}</div></div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Penalty Risk Modal ── */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Penalty Risk Assessment</h3>
              <button onClick={() => setShowPenaltyModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-gray-700">Based on your entity classification as <strong>{entity.entityType}</strong> with annual turnover of <strong>{formatCurrency(entity.annualTurnover)}</strong>:</p>
                <p className="text-3xl font-bold text-red-800 mt-2">Maximum: {formatCurrency(penaltyRisk.maxFine)}</p>
                <p className="text-sm text-red-700 mt-1">= max({formatCurrency(entity.entityType === 'essential' ? 10000000 : 7000000)}, {penaltyRisk.percentage} x {formatCurrency(entity.annualTurnover)})</p>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Compliance gaps that increase penalty risk:</strong></p>
                <ul className="list-disc list-inside">{measures.filter(m => m.status !== 'implemented').map(m => <li key={m.id}>{m.article21Ref}: {m.measure}</li>)}</ul>
              </div>
              <button onClick={() => setShowPenaltyModal(false)} className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
