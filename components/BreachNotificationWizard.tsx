import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, ArrowRight, AlertTriangle, Shield, ShieldAlert, ShieldCheck,
  Clock, Globe, FileText, Send, CheckCircle, XCircle, Mail, Phone,
  Building2, Calendar, Search, Plus, Download, Eye, Edit3, Trash2,
  ChevronDown, ChevronUp, Copy, Loader2, Users, MapPin, Database,
  Lock, Unlock, AlertOctagon, Bell, BookOpen, Archive, ExternalLink,
  BarChart3, Activity, Zap, Timer, ClipboardList, MessageSquare, X,
  Sparkles, Brain, Scale, Landmark, Flag, Hash, Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BreachType = 'data_breach' | 'security_incident' | 'vulnerability_disclosure' | 'cyber_attack';
type BreachSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type MainTab = 'wizard' | 'history' | 'templates' | 'contacts';

interface BreachClassification {
  type: BreachType;
  subType: string;
  description: string;
  discoveryDate: string;
  discoveryMethod: string;
  isOngoing: boolean;
  containmentStatus: 'not_started' | 'in_progress' | 'contained' | 'eradicated';
}

interface ImpactAssessment {
  recordsAffected: number;
  dataTypesAffected: string[];
  geographicScope: string[];
  affectedSystems: string[];
  encryptionStatus: 'encrypted' | 'partially_encrypted' | 'unencrypted';
  financialImpact: string;
  reputationalImpact: string;
  operationalImpact: string;
}

interface JurisdictionRequirement {
  jurisdiction: string;
  regulation: string;
  authority: string;
  timeframe: string;
  deadlineHours: number;
  notifyAuthority: boolean;
  notifySubjects: boolean;
  subjectTimeframe: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface NotificationDeadline {
  jurisdiction: string;
  regulation: string;
  authority: string;
  authorityDeadline: Date;
  subjectDeadline: Date | null;
  hoursRemaining: number;
  status: 'on_track' | 'at_risk' | 'overdue';
}

interface NotificationTemplate {
  id: string;
  name: string;
  jurisdiction: string;
  regulation: string;
  type: 'authority' | 'data_subject' | 'media' | 'internal';
  content: string;
  lastUpdated: string;
}

interface BreachRecord {
  id: string;
  title: string;
  type: BreachType;
  severity: BreachSeverity;
  discoveryDate: string;
  status: 'active' | 'contained' | 'resolved' | 'closed';
  recordsAffected: number;
  jurisdictions: string[];
  notificationsSent: number;
  lessonsLearned: string;
  riskScore: number;
}

interface RegulatoryContact {
  id: string;
  name: string;
  type: 'DPA' | 'AG_Office' | 'Sector_Regulator' | 'CERT' | 'Law_Enforcement';
  jurisdiction: string;
  email: string;
  phone: string;
  website: string;
  portalUrl: string;
  notes: string;
}

interface SubmissionRecord {
  id: string;
  jurisdiction: string;
  authority: string;
  sentDate: string;
  method: string;
  status: 'sent' | 'delivered' | 'acknowledged' | 'under_review' | 'closed';
  referenceNumber: string;
  responseDate: string | null;
  responseNotes: string;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const BREACH_TYPES: { value: BreachType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'data_breach', label: 'Data Breach', icon: <Database className="w-5 h-5" />, description: 'Unauthorized access or disclosure of personal data' },
  { value: 'security_incident', label: 'Security Incident', icon: <ShieldAlert className="w-5 h-5" />, description: 'Security event that compromises confidentiality, integrity, or availability' },
  { value: 'vulnerability_disclosure', label: 'Vulnerability Disclosure', icon: <Unlock className="w-5 h-5" />, description: 'Discovery of exploitable vulnerability in systems or software' },
  { value: 'cyber_attack', label: 'Cyber Attack', icon: <AlertOctagon className="w-5 h-5" />, description: 'Malicious attempt to damage, disrupt, or gain unauthorized access' },
];

const BREACH_SUB_TYPES: Record<BreachType, string[]> = {
  data_breach: ['Unauthorized Access', 'Accidental Disclosure', 'Lost/Stolen Device', 'Insider Threat', 'Third-Party Breach', 'Misconfiguration'],
  security_incident: ['Malware Infection', 'Phishing Attack', 'DDoS Attack', 'Unauthorized Modification', 'System Compromise', 'Privilege Escalation'],
  vulnerability_disclosure: ['Zero-Day Vulnerability', 'Known CVE', 'Configuration Weakness', 'Software Bug', 'Supply Chain Vulnerability'],
  cyber_attack: ['Ransomware', 'APT/Targeted Attack', 'Supply Chain Attack', 'Credential Stuffing', 'SQL Injection', 'Cross-Site Scripting'],
};

const DATA_TYPES = [
  'Names', 'Email Addresses', 'Phone Numbers', 'Physical Addresses', 'Social Security Numbers',
  'Financial Data (Bank Accounts)', 'Credit Card Numbers', 'Health Records', 'Biometric Data',
  'Login Credentials', 'IP Addresses', 'Device Identifiers', 'Location Data', 'Employment Records',
  'Tax Information', 'Insurance Information', 'Genetic Data', 'Political Opinions', 'Religious Beliefs',
  'Trade Union Membership', 'Sexual Orientation', 'Criminal Records',
];

const GEOGRAPHIC_REGIONS = [
  'European Union', 'United Kingdom', 'United States - California', 'United States - Colorado',
  'United States - Connecticut', 'United States - Virginia', 'United States - Other States',
  'Canada', 'Australia', 'Brazil', 'Japan', 'South Korea', 'India', 'China',
  'Singapore', 'South Africa', 'Israel', 'Switzerland', 'Mexico',
];

const DISCOVERY_METHODS = [
  'Internal Monitoring', 'Employee Report', 'Customer Report', 'Law Enforcement Notification',
  'Third-Party Notification', 'Security Audit', 'Penetration Test', 'Automated Alert',
  'Media Report', 'Dark Web Monitoring', 'Bug Bounty Program',
];

const DEMO_BREACH_HISTORY: BreachRecord[] = [
  {
    id: 'BR-2025-001', title: 'Customer Database Unauthorized Access', type: 'data_breach',
    severity: 'High', discoveryDate: '2025-11-15', status: 'closed', recordsAffected: 15420,
    jurisdictions: ['European Union', 'United Kingdom', 'United States - California'],
    notificationsSent: 8, lessonsLearned: 'Implemented additional access controls and MFA for all database connections. Enhanced monitoring with real-time anomaly detection.',
    riskScore: 78,
  },
  {
    id: 'BR-2025-002', title: 'Ransomware Attack - File Server', type: 'cyber_attack',
    severity: 'Critical', discoveryDate: '2025-09-22', status: 'closed', recordsAffected: 52000,
    jurisdictions: ['European Union', 'United States - Colorado', 'Canada'],
    notificationsSent: 12, lessonsLearned: 'Strengthened endpoint detection and response (EDR) capabilities. Implemented network segmentation and improved backup procedures.',
    riskScore: 92,
  },
  {
    id: 'BR-2025-003', title: 'API Vulnerability in Mobile App', type: 'vulnerability_disclosure',
    severity: 'Medium', discoveryDate: '2025-12-01', status: 'resolved', recordsAffected: 0,
    jurisdictions: ['European Union'], notificationsSent: 2,
    lessonsLearned: 'Enhanced API security testing in CI/CD pipeline. Added rate limiting and input validation.',
    riskScore: 45,
  },
  {
    id: 'BR-2026-001', title: 'Phishing Campaign - Employee Credentials', type: 'security_incident',
    severity: 'High', discoveryDate: '2026-01-10', status: 'contained', recordsAffected: 3200,
    jurisdictions: ['European Union', 'United States - Virginia', 'Australia'],
    notificationsSent: 5, lessonsLearned: 'Launched enhanced phishing awareness training. Deployed anti-phishing email gateway.',
    riskScore: 68,
  },
  {
    id: 'BR-2026-002', title: 'Third-Party Vendor Data Exposure', type: 'data_breach',
    severity: 'High', discoveryDate: '2026-02-03', status: 'active', recordsAffected: 8750,
    jurisdictions: ['European Union', 'United Kingdom', 'United States - Connecticut', 'Brazil'],
    notificationsSent: 3, lessonsLearned: '',
    riskScore: 82,
  },
];

const DEMO_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'TPL-001', name: 'GDPR DPA Notification', jurisdiction: 'European Union', regulation: 'GDPR',
    type: 'authority', lastUpdated: '2026-01-15',
    content: 'Dear Data Protection Authority,\n\nWe are writing to notify you of a personal data breach pursuant to Article 33 of the General Data Protection Regulation (GDPR).\n\n1. Nature of the breach: [BREACH_TYPE]\n2. Date of discovery: [DISCOVERY_DATE]\n3. Categories of data subjects affected: [DATA_SUBJECTS]\n4. Approximate number of records: [RECORD_COUNT]\n5. Categories of personal data: [DATA_TYPES]\n6. Likely consequences: [CONSEQUENCES]\n7. Measures taken: [MEASURES]\n8. Data Protection Officer contact: [DPO_CONTACT]\n\nWe remain available for any further information you may require.',
  },
  {
    id: 'TPL-002', name: 'GDPR Data Subject Notification', jurisdiction: 'European Union', regulation: 'GDPR',
    type: 'data_subject', lastUpdated: '2026-01-15',
    content: 'Dear [SUBJECT_NAME],\n\nWe are writing to inform you of a personal data breach that may affect your personal data, in accordance with Article 34 of the GDPR.\n\nWhat happened: [BREACH_DESCRIPTION]\nWhen it happened: [BREACH_DATE]\nWhat data was affected: [DATA_TYPES]\nWhat we are doing: [REMEDIATION_STEPS]\nWhat you can do: [SUBJECT_ACTIONS]\n\nOur Data Protection Officer can be contacted at: [DPO_CONTACT]',
  },
  {
    id: 'TPL-003', name: 'EU CRA ENISA Vulnerability Report', jurisdiction: 'European Union', regulation: 'EU CRA',
    type: 'authority', lastUpdated: '2026-01-20',
    content: 'ENISA Vulnerability Notification\n\nProduct: [PRODUCT_NAME]\nVulnerability ID: [CVE_ID]\nSeverity: [SEVERITY]\nDiscovery Date: [DISCOVERY_DATE]\nExploitability: [EXPLOITABILITY]\nAffected Versions: [VERSIONS]\nMitigation Available: [MITIGATION]\nPatch Timeline: [PATCH_TIMELINE]\n\nThis notification is submitted within 24 hours of discovery pursuant to EU Cyber Resilience Act requirements.',
  },
  {
    id: 'TPL-004', name: 'HIPAA Breach Notification to HHS', jurisdiction: 'United States', regulation: 'HIPAA',
    type: 'authority', lastUpdated: '2025-12-10',
    content: 'U.S. Department of Health and Human Services\nOffice for Civil Rights\n\nBreach Notification Report\n\nCovered Entity: [ENTITY_NAME]\nBreach Discovery Date: [DISCOVERY_DATE]\nType of Breach: [BREACH_TYPE]\nLocation of Breached Information: [LOCATION]\nIndividuals Affected: [INDIVIDUAL_COUNT]\nTypes of Information Involved: [PHI_TYPES]\nDescription of Breach: [DESCRIPTION]\nSafeguards in Place: [SAFEGUARDS]\nActions Taken: [ACTIONS]\n\nSubmitted pursuant to 45 CFR 164.408.',
  },
  {
    id: 'TPL-005', name: 'NIS2 Incident Early Warning', jurisdiction: 'European Union', regulation: 'NIS2',
    type: 'authority', lastUpdated: '2026-02-01',
    content: 'CSIRT Early Warning Notification (NIS2 Article 23)\n\nEntity: [ENTITY_NAME]\nSector: [SECTOR]\nIncident Detection: [DETECTION_TIME]\nIncident Type: [INCIDENT_TYPE]\nSuspected Cause: [CAUSE]\nCross-border Impact: [CROSS_BORDER]\nInitial Assessment: [ASSESSMENT]\n\nThis early warning is submitted within 24 hours of incident detection. A full incident notification will follow within 72 hours.',
  },
  {
    id: 'TPL-006', name: 'California AG Breach Notification', jurisdiction: 'United States - California', regulation: 'CCPA/CPRA',
    type: 'authority', lastUpdated: '2025-11-20',
    content: 'California Attorney General\nData Breach Notification\n\nEntity: [ENTITY_NAME]\nDate of Breach: [BREACH_DATE]\nDate of Discovery: [DISCOVERY_DATE]\nCalifornians Affected: [CA_COUNT]\nTypes of Information: [DATA_TYPES]\nDescription: [DESCRIPTION]\nRemediation: [REMEDIATION]\nContact for Questions: [CONTACT]\n\nSubmitted pursuant to California Civil Code Section 1798.82.',
  },
];

const DEMO_CONTACTS: RegulatoryContact[] = [
  { id: 'RC-001', name: 'European Data Protection Board (EDPB)', type: 'DPA', jurisdiction: 'European Union', email: 'edpb@edpb.europa.eu', phone: '+32 2 283 19 00', website: 'https://edpb.europa.eu', portalUrl: 'https://edpb.europa.eu/our-work-tools/notifications_en', notes: 'Coordination body for EU DPAs' },
  { id: 'RC-002', name: 'CNIL (France)', type: 'DPA', jurisdiction: 'France', email: 'notification@cnil.fr', phone: '+33 1 53 73 22 22', website: 'https://www.cnil.fr', portalUrl: 'https://www.cnil.fr/en/data-breach-notifications', notes: 'French DPA - 72 hour notification via online portal' },
  { id: 'RC-003', name: 'BfDI (Germany)', type: 'DPA', jurisdiction: 'Germany', email: 'poststelle@bfdi.bund.de', phone: '+49 228 997799-0', website: 'https://www.bfdi.bund.de', portalUrl: 'https://www.bfdi.bund.de/EN/Home/home_node.html', notes: 'German Federal DPA' },
  { id: 'RC-004', name: 'ICO (United Kingdom)', type: 'DPA', jurisdiction: 'United Kingdom', email: 'casework@ico.org.uk', phone: '+44 303 123 1113', website: 'https://ico.org.uk', portalUrl: 'https://ico.org.uk/for-organisations/report-a-breach/', notes: 'UK Information Commissioner - online reporting tool' },
  { id: 'RC-005', name: 'California Attorney General', type: 'AG_Office', jurisdiction: 'United States - California', email: 'privacy@doj.ca.gov', phone: '+1 916-210-6276', website: 'https://oag.ca.gov', portalUrl: 'https://oag.ca.gov/ecrime/databreach/report-a-breach', notes: 'Online submission required for breaches affecting 500+ residents' },
  { id: 'RC-006', name: 'Colorado Attorney General', type: 'AG_Office', jurisdiction: 'United States - Colorado', email: 'attorney.general@coag.gov', phone: '+1 720-508-6000', website: 'https://coag.gov', portalUrl: 'https://coag.gov/data-protection/', notes: '30-day notification requirement' },
  { id: 'RC-007', name: 'HHS Office for Civil Rights', type: 'Sector_Regulator', jurisdiction: 'United States', email: 'ocrmail@hhs.gov', phone: '+1 800-368-1019', website: 'https://www.hhs.gov/ocr', portalUrl: 'https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf', notes: 'HIPAA breach notification - 60 day deadline for 500+ individuals' },
  { id: 'RC-008', name: 'ENISA (EU Agency for Cybersecurity)', type: 'CERT', jurisdiction: 'European Union', email: 'info@enisa.europa.eu', phone: '+30 2814 409710', website: 'https://www.enisa.europa.eu', portalUrl: 'https://www.enisa.europa.eu/topics/incident-reporting', notes: 'EU CRA vulnerability reporting - 24 hour deadline' },
  { id: 'RC-009', name: 'OAIC (Australia)', type: 'DPA', jurisdiction: 'Australia', email: 'enquiries@oaic.gov.au', phone: '+61 1300 363 992', website: 'https://www.oaic.gov.au', portalUrl: 'https://www.oaic.gov.au/privacy/notifiable-data-breaches', notes: 'Notifiable Data Breaches scheme - 30 day deadline' },
  { id: 'RC-010', name: 'ANPD (Brazil)', type: 'DPA', jurisdiction: 'Brazil', email: 'anpd@anpd.gov.br', phone: '+55 61 2025-8900', website: 'https://www.gov.br/anpd', portalUrl: 'https://www.gov.br/anpd/pt-br', notes: 'LGPD breach notification - reasonable timeframe' },
];

const JURISDICTION_REGULATIONS: Record<string, JurisdictionRequirement[]> = {
  'European Union': [
    { jurisdiction: 'European Union', regulation: 'GDPR Art.33/34', authority: 'Lead Supervisory Authority / DPA', timeframe: '72 hours to DPA', deadlineHours: 72, notifyAuthority: true, notifySubjects: true, subjectTimeframe: 'Without undue delay (high risk)', status: 'pending' },
    { jurisdiction: 'European Union', regulation: 'NIS2 Art.23', authority: 'National CSIRT', timeframe: '24h early warning, 72h notification, 1-month report', deadlineHours: 24, notifyAuthority: true, notifySubjects: false, subjectTimeframe: 'N/A', status: 'pending' },
    { jurisdiction: 'European Union', regulation: 'EU CRA', authority: 'ENISA', timeframe: '24 hours for vulnerabilities', deadlineHours: 24, notifyAuthority: true, notifySubjects: false, subjectTimeframe: 'N/A', status: 'pending' },
  ],
  'United Kingdom': [
    { jurisdiction: 'United Kingdom', regulation: 'UK GDPR', authority: 'ICO', timeframe: '72 hours', deadlineHours: 72, notifyAuthority: true, notifySubjects: true, subjectTimeframe: 'Without undue delay (high risk)', status: 'pending' },
  ],
  'United States - California': [
    { jurisdiction: 'United States - California', regulation: 'CCPA/CPRA', authority: 'California AG', timeframe: 'Most expedient time possible', deadlineHours: 720, notifyAuthority: true, notifySubjects: true, subjectTimeframe: 'Most expedient time possible', status: 'pending' },
  ],
  'United States - Colorado': [
    { jurisdiction: 'United States - Colorado', regulation: 'CPA', authority: 'Colorado AG', timeframe: '30 days', deadlineHours: 720, notifyAuthority: true, notifySubjects: true, subjectTimeframe: '30 days', status: 'pending' },
  ],
  'United States - Connecticut': [
    { jurisdiction: 'United States - Connecticut', regulation: 'CTDPA', authority: 'Connecticut AG', timeframe: '60 days', deadlineHours: 1440, notifyAuthority: true, notifySubjects: true, subjectTimeframe: '60 days', status: 'pending' },
  ],
  'United States - Virginia': [
    { jurisdiction: 'United States - Virginia', regulation: 'VCDPA', authority: 'Virginia AG', timeframe: '60 days', deadlineHours: 1440, notifyAuthority: true, notifySubjects: true, subjectTimeframe: '60 days', status: 'pending' },
  ],
  'Canada': [
    { jurisdiction: 'Canada', regulation: 'PIPEDA', authority: 'OPC', timeframe: 'As soon as feasible', deadlineHours: 720, notifyAuthority: true, notifySubjects: true, subjectTimeframe: 'As soon as feasible', status: 'pending' },
  ],
  'Australia': [
    { jurisdiction: 'Australia', regulation: 'NDB Scheme', authority: 'OAIC', timeframe: '30 days', deadlineHours: 720, notifyAuthority: true, notifySubjects: true, subjectTimeframe: '30 days', status: 'pending' },
  ],
  'Brazil': [
    { jurisdiction: 'Brazil', regulation: 'LGPD', authority: 'ANPD', timeframe: 'Reasonable timeframe', deadlineHours: 720, notifyAuthority: true, notifySubjects: true, subjectTimeframe: 'Reasonable timeframe', status: 'pending' },
  ],
};

// HIPAA and PCI DSS apply regardless of geography when relevant data types are involved
const SECTOR_REGULATIONS: JurisdictionRequirement[] = [
  { jurisdiction: 'United States', regulation: 'HIPAA', authority: 'HHS OCR', timeframe: '60 days to HHS, 60 days to individuals', deadlineHours: 1440, notifyAuthority: true, notifySubjects: true, subjectTimeframe: '60 days', status: 'pending' },
  { jurisdiction: 'Global', regulation: 'PCI DSS', authority: 'Card Brands / Acquirer', timeframe: '72 hours', deadlineHours: 72, notifyAuthority: true, notifySubjects: false, subjectTimeframe: 'N/A', status: 'pending' },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
const calculateRiskScore = (
  classification: BreachClassification,
  impact: ImpactAssessment
): { score: number; severity: BreachSeverity; factors: string[] } => {
  let score = 0;
  const factors: string[] = [];

  // Records affected
  if (impact.recordsAffected > 100000) { score += 30; factors.push('Very high volume of records (100K+)'); }
  else if (impact.recordsAffected > 10000) { score += 22; factors.push('High volume of records (10K+)'); }
  else if (impact.recordsAffected > 1000) { score += 15; factors.push('Moderate volume of records (1K+)'); }
  else if (impact.recordsAffected > 0) { score += 8; factors.push('Low volume of records'); }

  // Data sensitivity
  const sensitiveTypes = ['Social Security Numbers', 'Financial Data (Bank Accounts)', 'Credit Card Numbers', 'Health Records', 'Biometric Data', 'Genetic Data', 'Criminal Records'];
  const sensitiveCount = impact.dataTypesAffected.filter(t => sensitiveTypes.includes(t)).length;
  if (sensitiveCount >= 3) { score += 25; factors.push('Multiple highly sensitive data types'); }
  else if (sensitiveCount >= 1) { score += 18; factors.push('Sensitive data types involved'); }
  else if (impact.dataTypesAffected.length > 3) { score += 10; factors.push('Multiple data types affected'); }

  // Encryption
  if (impact.encryptionStatus === 'unencrypted') { score += 15; factors.push('Data was unencrypted'); }
  else if (impact.encryptionStatus === 'partially_encrypted') { score += 8; factors.push('Data partially encrypted'); }

  // Geographic scope
  if (impact.geographicScope.length >= 4) { score += 15; factors.push('Wide geographic scope (4+ jurisdictions)'); }
  else if (impact.geographicScope.length >= 2) { score += 10; factors.push('Multiple jurisdictions affected'); }

  // Breach type
  if (classification.type === 'cyber_attack') { score += 10; factors.push('Malicious cyber attack'); }
  else if (classification.type === 'data_breach') { score += 8; factors.push('Personal data breach'); }

  // Containment
  if (classification.containmentStatus === 'not_started') { score += 10; factors.push('Breach not yet contained'); }
  else if (classification.containmentStatus === 'in_progress') { score += 5; factors.push('Containment in progress'); }

  // Ongoing
  if (classification.isOngoing) { score += 8; factors.push('Breach is ongoing'); }

  const clampedScore = Math.min(100, score);
  let severity: BreachSeverity = 'Low';
  if (clampedScore >= 80) severity = 'Critical';
  else if (clampedScore >= 60) severity = 'High';
  else if (clampedScore >= 35) severity = 'Medium';

  return { score: clampedScore, severity, factors };
};

const severityColor = (s: BreachSeverity) => {
  switch (s) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Low': return 'bg-green-100 text-green-800 border-green-300';
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'active': case 'overdue': return 'bg-red-100 text-red-800';
    case 'contained': case 'at_risk': case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': case 'on_track': case 'completed': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-700';
    case 'pending': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface BreachNotificationWizardProps {
  onBack: () => void;
}

export const BreachNotificationWizard: React.FC<BreachNotificationWizardProps> = ({ onBack }) => {
  const { t } = useI18n();
  // Tab state
  const [activeTab, setActiveTab] = useState<MainTab>('wizard');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [classification, setClassification] = useState<BreachClassification>({
    type: 'data_breach', subType: '', description: '', discoveryDate: new Date().toISOString().split('T')[0],
    discoveryMethod: '', isOngoing: false, containmentStatus: 'not_started',
  });
  const [impact, setImpact] = useState<ImpactAssessment>({
    recordsAffected: 0, dataTypesAffected: [], geographicScope: [], affectedSystems: [],
    encryptionStatus: 'unencrypted', financialImpact: '', reputationalImpact: '', operationalImpact: '',
  });
  const [detectedJurisdictions, setDetectedJurisdictions] = useState<JurisdictionRequirement[]>([]);
  const [deadlines, setDeadlines] = useState<NotificationDeadline[]>([]);
  const [draftedLetters, setDraftedLetters] = useState<{ jurisdiction: string; content: string }[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // History / templates / contacts state — initialized with demos, replaced by API data on load
  const [breachHistory, setBreachHistory] = useState<BreachRecord[]>(DEMO_BREACH_HISTORY);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEMO_TEMPLATES);
  const [contacts, setContacts] = useState<RegulatoryContact[]>(DEMO_CONTACTS);

  const [historySearch, setHistorySearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedContact, setSelectedContact] = useState<RegulatoryContact | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [newSystemInput, setNewSystemInput] = useState('');

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load breach data from API
  useEffect(() => {
    (async () => {
      try {
        const [incidents, apiTemplates, apiContacts] = await Promise.all([
          api.modules.breach.listIncidents(),
          api.modules.breach.listTemplates(),
          api.modules.breach.listContacts(),
        ]);
        if (incidents && incidents.length > 0) {
          setBreachHistory(incidents.map((inc: any) => ({
            id: inc.id,
            title: inc.title || inc.description || 'Untitled Incident',
            type: inc.breachType || inc.type || 'data_breach',
            severity: (inc.severity ? (inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1).toLowerCase()) : 'Medium') as BreachRecord['severity'],
            discoveryDate: (inc.discoveryDate || inc.discoveredAt || inc.createdAt || '').toString().slice(0, 10),
            status: (inc.status || 'active') as BreachRecord['status'],
            recordsAffected: inc.affectedRecords ?? inc.recordsAffected ?? 0,
            jurisdictions: Array.isArray(inc.affectedJurisdictions)
              ? inc.affectedJurisdictions
              : Array.isArray(inc.jurisdictions) ? inc.jurisdictions : [],
            notificationsSent: Array.isArray(inc.notifications) ? inc.notifications.filter((n: any) => n.sentAt || n.status === 'sent').length : (inc.notificationsSent || 0),
            lessonsLearned: inc.lessonsLearned || '',
            riskScore: inc.impactAssessment?.riskScore ?? inc.riskScore ?? 0,
          })));
        }
        if (apiTemplates && apiTemplates.length > 0) {
          setTemplates(apiTemplates.map((t: any) => ({
            id: t.id, name: t.name, jurisdiction: t.jurisdiction || '',
            regulation: t.regulation || '', type: t.type || 'authority',
            content: t.content || '', lastUpdated: t.updatedAt || t.lastUpdated || '',
          })));
        }
        if (apiContacts && apiContacts.length > 0) {
          setContacts(apiContacts.map((c: any) => ({
            id: c.id, name: c.name, type: c.type || 'DPA',
            jurisdiction: c.jurisdiction || '', email: c.email || '',
            phone: c.phone || '', website: c.website || '',
            portalUrl: c.portalUrl || '', notes: c.notes || '',
          })));
        }
        setLoadError(null);
      } catch (err: any) {
        setLoadError('Unable to connect to server. Showing local data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Risk score
  const riskResult = useMemo(() => calculateRiskScore(classification, impact), [classification, impact]);

  // Jurisdiction detection
  const detectJurisdictions = useCallback(() => {
    const requirements: JurisdictionRequirement[] = [];
    impact.geographicScope.forEach(region => {
      const regs = JURISDICTION_REGULATIONS[region];
      if (regs) requirements.push(...regs);
    });

    // Sector-specific regulations
    const hasHealthData = impact.dataTypesAffected.some(t => t === 'Health Records');
    const hasCreditCards = impact.dataTypesAffected.some(t => t === 'Credit Card Numbers');
    if (hasHealthData) {
      requirements.push(SECTOR_REGULATIONS[0]); // HIPAA
    }
    if (hasCreditCards) {
      requirements.push(SECTOR_REGULATIONS[1]); // PCI DSS
    }

    setDetectedJurisdictions(requirements);
  }, [impact]);

  const generateDeadlines = useCallback(() => {
    const discoveryTime = new Date(classification.discoveryDate + 'T00:00:00');
    const generated: NotificationDeadline[] = detectedJurisdictions.map(req => {
      const deadline = new Date(discoveryTime.getTime() + req.deadlineHours * 60 * 60 * 1000);
      const now = new Date();
      const hoursRemaining = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
      let status: 'on_track' | 'at_risk' | 'overdue' = 'on_track';
      if (hoursRemaining <= 0) status = 'overdue';
      else if (hoursRemaining < 12) status = 'at_risk';

      return {
        jurisdiction: req.jurisdiction,
        regulation: req.regulation,
        authority: req.authority,
        authorityDeadline: deadline,
        subjectDeadline: req.notifySubjects ? new Date(discoveryTime.getTime() + Math.max(req.deadlineHours, 720) * 60 * 60 * 1000) : null,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        status,
      };
    });
    setDeadlines(generated.sort((a, b) => a.hoursRemaining - b.hoursRemaining));
  }, [classification.discoveryDate, detectedJurisdictions]);

  const generateLetters = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const letters = detectedJurisdictions.map(req => {
        const matchingTemplate = templates.find(t => t.regulation === req.regulation.split(' ')[0] || t.jurisdiction === req.jurisdiction);
        let content = matchingTemplate?.content || `[AI-Generated Notification for ${req.regulation}]\n\nDear ${req.authority},\n\nWe are writing to notify you of a ${classification.type.replace('_', ' ')} discovered on ${classification.discoveryDate}.\n\nAffected records: ${impact.recordsAffected.toLocaleString()}\nData types: ${impact.dataTypesAffected.join(', ')}\nGeographic scope: ${impact.geographicScope.join(', ')}\n\nThis notification is submitted in accordance with ${req.regulation}.`;
        content = content
          .replace('[BREACH_TYPE]', classification.type.replace('_', ' '))
          .replace('[DISCOVERY_DATE]', classification.discoveryDate)
          .replace('[RECORD_COUNT]', impact.recordsAffected.toLocaleString())
          .replace('[DATA_TYPES]', impact.dataTypesAffected.join(', '))
          .replace('[DESCRIPTION]', classification.description || 'See attached incident report')
          .replace('[BREACH_DESCRIPTION]', classification.description || 'A security incident has been identified')
          .replace('[BREACH_DATE]', classification.discoveryDate)
          .replace('[DATA_SUBJECTS]', `Approximately ${impact.recordsAffected.toLocaleString()} individuals`)
          .replace('[CONSEQUENCES]', `Potential exposure of ${impact.dataTypesAffected.join(', ')}`)
          .replace('[MEASURES]', `Containment status: ${classification.containmentStatus}. Investigation is ongoing.`)
          .replace('[INDIVIDUAL_COUNT]', impact.recordsAffected.toLocaleString())
          .replace('[CA_COUNT]', Math.round(impact.recordsAffected * 0.3).toLocaleString())
          .replace('[REMEDIATION]', 'Immediate containment measures implemented. Full remediation plan in progress.')
          .replace('[REMEDIATION_STEPS]', 'We have taken immediate steps to contain the breach and are conducting a thorough investigation.')
          .replace('[SUBJECT_ACTIONS]', 'We recommend monitoring your accounts and changing passwords as a precaution.');
        return { jurisdiction: `${req.jurisdiction} - ${req.regulation}`, content };
      });
      setDraftedLetters(letters);
      setIsGenerating(false);
    }, 2000);
  }, [detectedJurisdictions, classification, impact, templates]);

  // Persists a notification submission against the active breach incident. If no
  // breach record exists yet (the wizard wasn't opened on an existing incident),
  // an incident row is created first so the notification has a parent FK.
  const [activeBreachId, setActiveBreachId] = useState<string | null>(null);
  const ensureBreachIncident = useCallback(async (): Promise<string | null> => {
    if (activeBreachId) return activeBreachId;
    try {
      const created = await api.modules.breach.createIncident({
        title: classification.description?.slice(0, 80) || `Breach ${classification.discoveryDate}`,
        breachType: classification.type,
        severity: (impact.recordsAffected > 10000 ? 'critical' : impact.recordsAffected > 1000 ? 'high' : 'medium'),
        status: 'investigating',
        discoveryDate: new Date(classification.discoveryDate + 'T00:00:00').toISOString(),
        description: classification.description,
        affectedRecords: impact.recordsAffected,
        affectedDataTypes: impact.dataTypesAffected,
        affectedJurisdictions: impact.geographicScope,
        impactAssessment: { riskScore: riskResult.score, factors: riskResult.factors },
      });
      if (created?.id) {
        setActiveBreachId(created.id);
        return created.id;
      }
    } catch {
      setLoadError('Failed to persist breach incident; submission saved locally.');
    }
    return null;
  }, [activeBreachId, classification, impact, riskResult]);

  const addSubmission = useCallback(async (jurisdiction: string) => {
    const authority = detectedJurisdictions.find(j => j.jurisdiction === jurisdiction.split(' - ')[0])?.authority || 'Unknown';
    // The official acknowledgement reference is assigned by the regulator/backend on
    // receipt — it is not fabricated client-side. Until the server returns one the
    // submission shows "Pending" rather than a locally invented value.
    const newSub: SubmissionRecord = {
      id: `SUB-${Date.now()}`, jurisdiction,
      authority,
      sentDate: new Date().toISOString(), method: 'Online Portal',
      status: 'sent', referenceNumber: '',
      responseDate: null, responseNotes: '',
    };
    setSubmissions(prev => [...prev, newSub]);

    const breachId = await ensureBreachIncident();
    if (!breachId) return;
    try {
      const created = await api.modules.breach.createNotification({
        breachId,
        recipientType: 'dpa',
        jurisdiction: jurisdiction.split(' - ')[0],
        authority,
        sentAt: newSub.sentDate,
        status: 'sent',
      });
      if (created?.id) {
        const serverRef = created.acknowledgement?.referenceNumber ?? created.referenceNumber ?? '';
        setSubmissions(prev => prev.map(s => s.id === newSub.id
          ? { ...s, id: created.id, referenceNumber: serverRef, status: created.status || s.status }
          : s));
      }
    } catch {
      setLoadError('Submission recorded locally; failed to persist notification on server.');
    }
  }, [detectedJurisdictions, ensureBreachIncident]);

  // ---------------------------------------------------------------------------
  // Copy / download / edit + create handlers (templates, contacts, letters)
  // ---------------------------------------------------------------------------
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
    } catch {
      setLoadError('Unable to copy to clipboard.');
    }
  }, []);

  const downloadText = useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Letter inline editing
  const [editingLetterIndex, setEditingLetterIndex] = useState<number | null>(null);
  const [letterDraft, setLetterDraft] = useState('');

  const startEditLetter = (index: number) => {
    setEditingLetterIndex(index);
    setLetterDraft(draftedLetters[index]?.content || '');
  };
  const saveEditLetter = (index: number) => {
    setDraftedLetters(prev => prev.map((l, i) => i === index ? { ...l, content: letterDraft } : l));
    setEditingLetterIndex(null);
  };

  // Template create/edit modal
  const emptyTemplateForm = { name: '', jurisdiction: '', regulation: '', type: 'authority' as NotificationTemplate['type'], content: '' };
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(emptyTemplateForm);
    setShowTemplateModal(true);
  };
  const openEditTemplate = (tpl: NotificationTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({ name: tpl.name, jurisdiction: tpl.jurisdiction, regulation: tpl.regulation, type: tpl.type, content: tpl.content });
    setShowTemplateModal(true);
  };
  const saveTemplate = async () => {
    if (!templateForm.name.trim()) { setLoadError('Template name is required.'); return; }
    setSavingTemplate(true);
    const nowIso = new Date().toISOString();
    try {
      if (editingTemplate) {
        const updated = await api.modules.breach.updateTemplate(editingTemplate.id, templateForm);
        setTemplates(prev => prev.map(tp => tp.id === editingTemplate.id
          ? { ...tp, ...templateForm, lastUpdated: updated?.updatedAt || nowIso }
          : tp));
      } else {
        const created = await api.modules.breach.createTemplate(templateForm);
        setTemplates(prev => [{
          id: created?.id || `TPL-${Date.now()}`,
          ...templateForm,
          lastUpdated: created?.updatedAt || nowIso,
        }, ...prev]);
      }
      setShowTemplateModal(false);
    } catch {
      setLoadError(editingTemplate ? 'Failed to update template on server.' : 'Failed to create template on server.');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Contact create modal
  const emptyContactForm = { name: '', type: 'DPA' as RegulatoryContact['type'], jurisdiction: '', email: '', phone: '', website: '', portalUrl: '', notes: '' };
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [savingContact, setSavingContact] = useState(false);

  const openCreateContact = () => {
    setContactForm(emptyContactForm);
    setShowContactModal(true);
  };
  const saveContact = async () => {
    if (!contactForm.name.trim()) { setLoadError('Contact name is required.'); return; }
    if (contactForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      setLoadError('Contact email must be a valid email address.');
      return;
    }
    setSavingContact(true);
    try {
      const created = await api.modules.breach.createContact(contactForm);
      setContacts(prev => [{ id: created?.id || `RC-${Date.now()}`, ...contactForm }, ...prev]);
      setShowContactModal(false);
    } catch {
      setLoadError('Failed to create contact on server.');
    } finally {
      setSavingContact(false);
    }
  };

  // Filtered data
  const filteredHistory = useMemo(() =>
    breachHistory.filter(b =>
      b.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      b.id.toLowerCase().includes(historySearch.toLowerCase())
    ), [breachHistory, historySearch]);

  const filteredTemplates = useMemo(() =>
    templates.filter(t =>
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.jurisdiction.toLowerCase().includes(templateSearch.toLowerCase())
    ), [templates, templateSearch]);

  const filteredContacts = useMemo(() =>
    contacts.filter(c =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.jurisdiction.toLowerCase().includes(contactSearch.toLowerCase())
    ), [contacts, contactSearch]);

  // Steps config
  const steps = [
    { num: 1, label: 'Classification', icon: <ShieldAlert className="w-4 h-4" /> },
    { num: 2, label: 'Impact', icon: <BarChart3 className="w-4 h-4" /> },
    { num: 3, label: 'Jurisdictions', icon: <Globe className="w-4 h-4" /> },
    { num: 4, label: 'Timelines', icon: <Clock className="w-4 h-4" /> },
    { num: 5, label: 'Letters', icon: <FileText className="w-4 h-4" /> },
    { num: 6, label: 'Tracking', icon: <Send className="w-4 h-4" /> },
  ];

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 1: return !!classification.type && !!classification.subType && !!classification.discoveryDate;
      case 2: return impact.recordsAffected >= 0 && impact.dataTypesAffected.length > 0 && impact.geographicScope.length > 0;
      case 3: return detectedJurisdictions.length > 0;
      case 4: return deadlines.length > 0;
      case 5: return draftedLetters.length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 2) detectJurisdictions();
    if (currentStep === 3) generateDeadlines();
    if (currentStep < 6) setCurrentStep((currentStep + 1) as WizardStep);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep);
  };

  const toggleDataType = (dt: string) => {
    setImpact(prev => ({
      ...prev,
      dataTypesAffected: prev.dataTypesAffected.includes(dt)
        ? prev.dataTypesAffected.filter(t => t !== dt)
        : [...prev.dataTypesAffected, dt],
    }));
  };

  const toggleRegion = (region: string) => {
    setImpact(prev => ({
      ...prev,
      geographicScope: prev.geographicScope.includes(region)
        ? prev.geographicScope.filter(r => r !== region)
        : [...prev.geographicScope, region],
    }));
  };

  // ---------------------------------------------------------------------------
  // Render: Wizard Steps
  // ---------------------------------------------------------------------------
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breach Classification</h3>
        <p className="text-sm text-gray-600 mb-4">Select the type of incident and provide initial details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BREACH_TYPES.map(bt => (
          <button key={bt.value} onClick={() => setClassification(prev => ({ ...prev, type: bt.value, subType: '' }))}
            className={`p-4 rounded-lg border-2 text-left transition-all ${classification.type === bt.value ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={classification.type === bt.value ? 'text-blue-600' : 'text-gray-500'}>{bt.icon}</span>
              <span className="font-medium text-gray-900">{bt.label}</span>
            </div>
            <p className="text-xs text-gray-500">{bt.description}</p>
          </button>
        ))}
      </div>

      {classification.type && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Type</label>
          <div className="flex flex-wrap gap-2">
            {BREACH_SUB_TYPES[classification.type].map(sub => (
              <button key={sub} onClick={() => setClassification(prev => ({ ...prev, subType: sub }))}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${classification.subType === sub ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discovery Date</label>
          <input type="date" value={classification.discoveryDate}
            onChange={e => setClassification(prev => ({ ...prev, discoveryDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discovery Method</label>
          <select value={classification.discoveryMethod}
            onChange={e => setClassification(prev => ({ ...prev, discoveryMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select method...</option>
            {DISCOVERY_METHODS.map(dm => <option key={dm} value={dm}>{dm}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={classification.description} rows={3}
          onChange={e => setClassification(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Provide a brief description of the incident..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Is the breach ongoing?</label>
          <div className="flex gap-3">
            <button onClick={() => setClassification(prev => ({ ...prev, isOngoing: true }))}
              className={`px-4 py-2 rounded-lg border ${classification.isOngoing ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}>
              Yes - Active
            </button>
            <button onClick={() => setClassification(prev => ({ ...prev, isOngoing: false }))}
              className={`px-4 py-2 rounded-lg border ${!classification.isOngoing ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              No - Contained
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Containment Status</label>
          <select value={classification.containmentStatus}
            onChange={e => setClassification(prev => ({ ...prev, containmentStatus: e.target.value as BreachClassification['containmentStatus'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="contained">Contained</option>
            <option value="eradicated">Eradicated</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Impact Assessment</h3>
        <p className="text-sm text-gray-600 mb-4">Assess the scope and severity of the breach.</p>
      </div>

      {/* Risk Score Card */}
      <div className={`p-4 rounded-lg border-2 ${severityColor(riskResult.severity)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Risk Score</span>
          <span className="text-2xl font-bold">{riskResult.score}/100</span>
        </div>
        <div className="w-full bg-white/50 rounded-full h-3 mb-3">
          <div className={`h-3 rounded-full transition-all ${riskResult.score >= 80 ? 'bg-red-500' : riskResult.score >= 60 ? 'bg-orange-500' : riskResult.score >= 35 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${riskResult.score}%` }} />
        </div>
        {riskResult.factors.length > 0 && (
          <div className="space-y-1">
            {riskResult.factors.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Records Affected</label>
          <input type="number" min={0} value={impact.recordsAffected}
            onChange={e => setImpact(prev => ({ ...prev, recordsAffected: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Status</label>
          <select value={impact.encryptionStatus}
            onChange={e => setImpact(prev => ({ ...prev, encryptionStatus: e.target.value as ImpactAssessment['encryptionStatus'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="encrypted">Fully Encrypted</option>
            <option value="partially_encrypted">Partially Encrypted</option>
            <option value="unencrypted">Unencrypted</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Data Types Affected ({impact.dataTypesAffected.length} selected)</label>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
          {DATA_TYPES.map(dt => (
            <button key={dt} onClick={() => toggleDataType(dt)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${impact.dataTypesAffected.includes(dt) ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-300'}`}>
              {dt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Geographic Scope ({impact.geographicScope.length} selected)</label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
          {GEOGRAPHIC_REGIONS.map(region => (
            <button key={region} onClick={() => toggleRegion(region)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${impact.geographicScope.includes(region) ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-300'}`}>
              <Globe className="w-3 h-3 inline mr-1" />{region}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('incidents.affectedSystems')}</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={newSystemInput} onChange={e => setNewSystemInput(e.target.value)}
            placeholder="Add affected system..." onKeyDown={e => { if (e.key === 'Enter' && newSystemInput.trim()) { setImpact(prev => ({ ...prev, affectedSystems: [...prev.affectedSystems, newSystemInput.trim()] })); setNewSystemInput(''); } }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <button onClick={() => { if (newSystemInput.trim()) { setImpact(prev => ({ ...prev, affectedSystems: [...prev.affectedSystems, newSystemInput.trim()] })); setNewSystemInput(''); } }}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {impact.affectedSystems.map((sys, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
              {sys}
              <button onClick={() => setImpact(prev => ({ ...prev, affectedSystems: prev.affectedSystems.filter((_, idx) => idx !== i) }))}
                className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Financial Impact</label>
          <select value={impact.financialImpact} onChange={e => setImpact(prev => ({ ...prev, financialImpact: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select...</option>
            <option value="minimal">Minimal (&lt;$10K)</option>
            <option value="moderate">Moderate ($10K-$100K)</option>
            <option value="significant">Significant ($100K-$1M)</option>
            <option value="severe">Severe (&gt;$1M)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reputational Impact</label>
          <select value={impact.reputationalImpact} onChange={e => setImpact(prev => ({ ...prev, reputationalImpact: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select...</option>
            <option value="minimal">Minimal</option>
            <option value="moderate">Moderate</option>
            <option value="significant">Significant</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operational Impact</label>
          <select value={impact.operationalImpact} onChange={e => setImpact(prev => ({ ...prev, operationalImpact: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select...</option>
            <option value="minimal">Minimal</option>
            <option value="moderate">Moderate</option>
            <option value="significant">Significant</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Jurisdiction Detection</h3>
        <p className="text-sm text-gray-600 mb-4">Based on affected data subjects' locations, the following regulatory obligations have been identified.</p>
      </div>

      {detectedJurisdictions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No jurisdictions detected yet.</p>
          <p className="text-sm text-gray-400">Jurisdictions are detected automatically when you proceed from Step 2.</p>
          <button onClick={detectJurisdictions} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Sparkles className="w-4 h-4 inline mr-1" />Detect Now
          </button>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">AI Jurisdiction Analysis</span>
            </div>
            <p className="text-sm text-blue-700">
              Detected <strong>{detectedJurisdictions.length}</strong> regulatory requirements across{' '}
              <strong>{new Set(detectedJurisdictions.map(j => j.jurisdiction)).size}</strong> jurisdictions.
              {impact.dataTypesAffected.includes('Health Records') && ' HIPAA obligations apply due to health data involvement.'}
              {impact.dataTypesAffected.includes('Credit Card Numbers') && ' PCI DSS obligations apply due to payment card data involvement.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Jurisdiction</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Regulation</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Authority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Timeframe</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Notify Authority</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Notify Subjects</th>
                </tr>
              </thead>
              <tbody>
                {detectedJurisdictions.map((req, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{req.jurisdiction}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{req.regulation}</td>
                    <td className="px-4 py-3 text-gray-600">{req.authority}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${req.deadlineHours <= 24 ? 'bg-red-100 text-red-800' : req.deadlineHours <= 72 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        <Timer className="w-3 h-3" />
                        {req.timeframe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.notifyAuthority ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.notifySubjects ? (
                        <div className="text-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          <span className="text-xs text-gray-500">{req.subjectTimeframe}</span>
                        </div>
                      ) : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline Generator</h3>
        <p className="text-sm text-gray-600 mb-4">Auto-calculated notification deadlines based on discovery date and applicable regulations.</p>
      </div>

      {deadlines.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Deadlines will be generated automatically when you proceed from Step 3.</p>
          <button onClick={generateDeadlines} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Generate Deadlines
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{deadlines.filter(d => d.status === 'overdue').length}</div>
              <div className="text-sm text-red-600">Overdue</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{deadlines.filter(d => d.status === 'at_risk').length}</div>
              <div className="text-sm text-yellow-600">At Risk</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{deadlines.filter(d => d.status === 'on_track').length}</div>
              <div className="text-sm text-green-600">On Track</div>
            </div>
          </div>

          <div className="space-y-3">
            {deadlines.map((dl, i) => (
              <div key={i} className={`p-4 rounded-lg border-2 ${dl.status === 'overdue' ? 'border-red-300 bg-red-50' : dl.status === 'at_risk' ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${dl.status === 'overdue' ? 'bg-red-200' : dl.status === 'at_risk' ? 'bg-yellow-200' : 'bg-green-200'}`}>
                      {dl.status === 'overdue' ? <AlertOctagon className="w-4 h-4 text-red-700" /> : dl.status === 'at_risk' ? <AlertTriangle className="w-4 h-4 text-yellow-700" /> : <CheckCircle className="w-4 h-4 text-green-700" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{dl.jurisdiction}</div>
                      <div className="text-sm text-gray-600">{dl.regulation} - {dl.authority}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${dl.status === 'overdue' ? 'text-red-700' : dl.status === 'at_risk' ? 'text-yellow-700' : 'text-green-700'}`}>
                      {dl.hoursRemaining > 0 ? `${dl.hoursRemaining}h remaining` : 'OVERDUE'}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(dl.status)}`}>
                      {dl.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Authority Deadline:</span>
                    <span className="ml-2 font-medium">{dl.authorityDeadline.toLocaleString()}</span>
                  </div>
                  {dl.subjectDeadline && (
                    <div>
                      <span className="text-gray-500">Subject Deadline:</span>
                      <span className="ml-2 font-medium">{dl.subjectDeadline.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Letter Drafter</h3>
        <p className="text-sm text-gray-600 mb-4">AI-generated notification templates for each applicable jurisdiction.</p>
      </div>

      {draftedLetters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Generate notification letters for all identified jurisdictions.</p>
          <button onClick={generateLetters} disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate All Letters</>}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{draftedLetters.length} letters generated</span>
            <button onClick={generateLetters} disabled={isGenerating}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-1">
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Regenerate All
            </button>
          </div>
          {draftedLetters.map((letter, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">{letter.jurisdiction}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyText(letter.content, `letter-${i}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Copy">
                    {copiedKey === `letter-${i}` ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => downloadText(letter.content, `${letter.jurisdiction.replace(/[^a-z0-9]+/gi, '-')}.txt`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  {editingLetterIndex === i ? (
                    <button onClick={() => saveEditLetter(i)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Save">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => startEditLetter(i)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {editingLetterIndex === i ? (
                <textarea value={letterDraft} onChange={e => setLetterDraft(e.target.value)}
                  className="w-full p-4 text-sm text-gray-700 bg-white max-h-64 overflow-y-auto font-sans leading-relaxed border-0 focus:ring-2 focus:ring-blue-500" rows={12} />
              ) : (
                <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap bg-white max-h-64 overflow-y-auto font-sans leading-relaxed">
                  {letter.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Tracker</h3>
        <p className="text-sm text-gray-600 mb-4">Track sent notifications, delivery confirmations, and regulatory responses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <Send className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-700">{submissions.filter(s => s.status === 'sent').length}</div>
          <div className="text-xs text-blue-600">Sent</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-700">{submissions.filter(s => s.status === 'delivered' || s.status === 'acknowledged').length}</div>
          <div className="text-xs text-green-600">Confirmed</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <Eye className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-700">{submissions.filter(s => s.status === 'under_review').length}</div>
          <div className="text-xs text-yellow-600">Under Review</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <Archive className="w-6 h-6 text-gray-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-gray-700">{submissions.filter(s => s.status === 'closed').length}</div>
          <div className="text-xs text-gray-600">Closed</div>
        </div>
      </div>

      {/* Quick send from jurisdictions */}
      <div className="border border-gray-200 rounded-lg">
        <div className="bg-gray-50 px-4 py-3 border-b font-medium text-sm text-gray-700">Pending Notifications</div>
        <div className="divide-y divide-gray-100">
          {detectedJurisdictions.filter(j => !submissions.some(s => s.jurisdiction.startsWith(j.jurisdiction))).map((j, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-sm">{j.jurisdiction} - {j.regulation}</div>
                <div className="text-xs text-gray-500">{j.authority}</div>
              </div>
              <button onClick={() => addSubmission(j.jurisdiction + ' - ' + j.regulation)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center gap-1">
                <Send className="w-3 h-3" />{t('common.submit')}
              </button>
            </div>
          ))}
          {detectedJurisdictions.filter(j => !submissions.some(s => s.jurisdiction.startsWith(j.jurisdiction))).length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">All jurisdictions have been notified.</div>
          )}
        </div>
      </div>

      {/* Submitted notifications */}
      {submissions.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b font-medium text-sm text-gray-700">Submitted Notifications</div>
          <div className="divide-y divide-gray-100">
            {submissions.map(sub => (
              <div key={sub.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{sub.jurisdiction}</div>
                    <div className="text-xs text-gray-500">{sub.authority} | Ref: {sub.referenceNumber || 'Pending'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(sub.status)}`}>
                    {sub.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span><Calendar className="w-3 h-3 inline mr-1" />Sent: {new Date(sub.sentDate).toLocaleString()}</span>
                  <span><Mail className="w-3 h-3 inline mr-1" />Method: {sub.method}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Tab Content
  // ---------------------------------------------------------------------------
  const renderWizardTab = () => (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <button onClick={() => setCurrentStep(step.num as WizardStep)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${currentStep === step.num ? 'bg-blue-600 text-white shadow-sm' : currentStep > step.num ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === step.num ? 'bg-white/20' : currentStep > step.num ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
                {currentStep > step.num ? <CheckCircle className="w-4 h-4" /> : step.num}
              </span>
              <span className="hidden lg:inline">{step.label}</span>
              {step.icon}
            </button>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.num ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrev} disabled={currentStep === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />Previous
        </button>
        <div className="text-sm text-gray-500">Step {currentStep} of 6</div>
        {currentStep < 6 ? (
          <button onClick={handleNext} disabled={!canAdvance()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 inline-flex items-center gap-2">
            Next<ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => { setActiveTab('history'); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />Complete & Archive
          </button>
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Breach History</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
            placeholder="Search breaches..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{breachHistory.filter(b => b.status === 'active').length}</div>
          <div className="text-sm text-red-600">Active</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{breachHistory.filter(b => b.status === 'contained').length}</div>
          <div className="text-sm text-yellow-600">Contained</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{breachHistory.filter(b => b.status === 'resolved').length}</div>
          <div className="text-sm text-green-600">Resolved</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{breachHistory.filter(b => b.status === 'closed').length}</div>
          <div className="text-sm text-gray-600">Closed</div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredHistory.map(breach => (
          <div key={breach.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedHistory(expandedHistory === breach.id ? null : breach.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${severityColor(breach.severity)}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{breach.title}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-3">
                      <span>{breach.id}</span>
                      <span><Calendar className="w-3 h-3 inline mr-1" />{formatDate(breach.discoveryDate)}</span>
                      <span><Users className="w-3 h-3 inline mr-1" />{breach.recordsAffected.toLocaleString()} records</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(breach.status)}`}>
                    {breach.status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${severityColor(breach.severity)}`}>
                    {breach.severity}
                  </span>
                  {expandedHistory === breach.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
            </div>
            {expandedHistory === breach.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <div className="text-sm font-medium capitalize">{breach.type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Notifications Sent</div>
                    <div className="text-sm font-medium">{breach.notificationsSent}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Risk Score</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div className={`h-2 rounded-full ${breach.riskScore >= 80 ? 'bg-red-500' : breach.riskScore >= 60 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                          style={{ width: `${breach.riskScore}%` }} />
                      </div>
                      <span className="text-sm font-bold">{breach.riskScore}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Jurisdictions</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {breach.jurisdictions.map(j => (
                      <span key={j} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{j}</span>
                    ))}
                  </div>
                </div>
                {breach.lessonsLearned && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Lessons Learned</div>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">{breach.lessonsLearned}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notification Templates</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
              placeholder="Search templates..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={openCreateTemplate} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center gap-1">
            <Plus className="w-4 h-4" />New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map(tpl => (
          <div key={tpl.id} className={`bg-white border rounded-lg overflow-hidden cursor-pointer transition-all ${selectedTemplate?.id === tpl.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => setSelectedTemplate(selectedTemplate?.id === tpl.id ? null : tpl)}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">{tpl.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tpl.type === 'authority' ? 'bg-purple-100 text-purple-700' : tpl.type === 'data_subject' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {tpl.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span><Globe className="w-3 h-3 inline mr-1" />{tpl.jurisdiction}</span>
                <span><Scale className="w-3 h-3 inline mr-1" />{tpl.regulation}</span>
                <span><Calendar className="w-3 h-3 inline mr-1" />{formatDate(tpl.lastUpdated)}</span>
              </div>
            </div>
            {selectedTemplate?.id === tpl.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                  {tpl.content}
                </pre>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button onClick={e => { e.stopPropagation(); copyText(tpl.content, `tpl-${tpl.id}`); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1">
                    {copiedKey === `tpl-${tpl.id}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy
                  </button>
                  <button onClick={e => { e.stopPropagation(); openEditTemplate(tpl); }} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />{t('common.edit')}
                  </button>
                  <button onClick={e => { e.stopPropagation(); downloadText(tpl.content, `${tpl.name.replace(/[^a-z0-9]+/gi, '-')}.txt`); }} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1">
                    <Download className="w-3 h-3" />{t('common.export')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContactsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Regulatory Contacts</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
              placeholder="Search contacts..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={openCreateContact} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center gap-1">
            <Plus className="w-4 h-4" />Add Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div key={contact.id} className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${selectedContact?.id === contact.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
            onClick={() => setSelectedContact(selectedContact?.id === contact.id ? null : contact)}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${contact.type === 'DPA' ? 'bg-blue-100 text-blue-600' : contact.type === 'AG_Office' ? 'bg-purple-100 text-purple-600' : contact.type === 'CERT' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                {contact.type === 'DPA' ? <Shield className="w-5 h-5" /> : contact.type === 'AG_Office' ? <Landmark className="w-5 h-5" /> : contact.type === 'CERT' ? <ShieldAlert className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">{contact.name}</div>
                <div className="text-xs text-gray-500">{contact.type.replace('_', ' ')} - {contact.jurisdiction}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /><span className="truncate">{contact.email}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /><span>{contact.phone}</span></div>
              <div className="flex items-center gap-2"><Globe className="w-3 h-3 text-gray-400" /><a href={contact.website} className="text-blue-600 hover:underline truncate">{contact.website}</a></div>
            </div>
            {selectedContact?.id === contact.id && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Reporting Portal</div>
                  <a href={contact.portalUrl} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                    {contact.portalUrl}<ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Notes</div>
                  <p className="text-xs text-gray-700">{contact.notes}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  const tabs: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: 'wizard', label: 'Active Wizard', icon: <Zap className="w-4 h-4" /> },
    { key: 'history', label: 'Breach History', icon: <Archive className="w-4 h-4" /> },
    { key: 'templates', label: 'Notification Templates', icon: <FileText className="w-4 h-4" /> },
    { key: 'contacts', label: 'Regulatory Contacts', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{t('incidents.breachNotification')}</h1>
                  <p className="text-xs text-gray-500">AI-Powered Incident Response & Regulatory Notification</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColor(riskResult.severity)}`}>
                Risk: {riskResult.severity} ({riskResult.score})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error Banner */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('common.loading')}</span>
        </div>
      )}
      {loadError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">{loadError}</span>
            <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'wizard' && renderWizardTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'contacts' && renderContactsTab()}
      </div>

      {/* Template Create/Edit Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingTemplate ? 'Edit Template' : 'New Notification Template'}</h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={templateForm.name} onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g., GDPR DPA Notification" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                  <input type="text" value={templateForm.jurisdiction} onChange={e => setTemplateForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="European Union" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regulation</label>
                  <input type="text" value={templateForm.regulation} onChange={e => setTemplateForm(prev => ({ ...prev, regulation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="GDPR" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={templateForm.type} onChange={e => setTemplateForm(prev => ({ ...prev, type: e.target.value as NotificationTemplate['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="authority">Authority</option>
                    <option value="data_subject">Data Subject</option>
                    <option value="media">Media</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={templateForm.content} onChange={e => setTemplateForm(prev => ({ ...prev, content: e.target.value }))} rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:ring-2 focus:ring-blue-500" placeholder="Template body with [PLACEHOLDERS]..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
              <button onClick={saveTemplate} disabled={savingTemplate || !templateForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
                {savingTemplate && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTemplate ? t('common.save') : t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Create Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Regulatory Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g., ICO (United Kingdom)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={contactForm.type} onChange={e => setContactForm(prev => ({ ...prev, type: e.target.value as RegulatoryContact['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="DPA">DPA</option>
                    <option value="AG_Office">AG Office</option>
                    <option value="Sector_Regulator">Sector Regulator</option>
                    <option value="CERT">CERT</option>
                    <option value="Law_Enforcement">Law Enforcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                  <input type="text" value={contactForm.jurisdiction} onChange={e => setContactForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="United Kingdom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="casework@ico.org.uk" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={contactForm.phone} onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="+44 303 123 1113" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="text" value={contactForm.website} onChange={e => setContactForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="https://ico.org.uk" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Portal URL</label>
                  <input type="text" value={contactForm.portalUrl} onChange={e => setContactForm(prev => ({ ...prev, portalUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="https://ico.org.uk/for-organisations/report-a-breach/" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={contactForm.notes} onChange={e => setContactForm(prev => ({ ...prev, notes: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="72 hour notification via online portal" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowContactModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
              <button onClick={saveContact} disabled={savingContact || !contactForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
                {savingContact && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreachNotificationWizard;
