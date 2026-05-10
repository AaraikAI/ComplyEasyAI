import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  ArrowLeft, ArrowDown, ArrowRight, Plus, Trash2, Edit3, Save, Download, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, X, Search, Filter, Eye, Copy,
  Users, Shield, UserCheck, Bell, Clock, ArrowUpRight, Calendar,
  FileText, Mail, Phone, Building2, Award, Briefcase, ClipboardList,
  GitBranch, Layers, Settings, BarChart3, Vote, BookOpen, MessageSquare,
  Timer, Zap, AlertCircle, ArrowUp, ChevronUp, Link2, User, Hash
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DPOProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  qualifications: string[];
  certifications: string[];
  appointmentDate: string;
  status: 'Active' | 'Pending Approval' | 'Inactive';
  conflictOfInterestCheck: 'Passed' | 'Under Review' | 'Failed' | 'Not Assessed';
  reportingTo: string;
  registeredWithDPA: boolean;
  dpaRegistrationDate: string;
  dpaReference: string;
  tasks: DPOTask[];
  activityLog: DPOActivity[];
}

interface DPOTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  category: string;
}

interface DPOActivity {
  id: string;
  date: string;
  action: string;
  details: string;
  category: 'Advisory' | 'Monitoring' | 'Training' | 'Investigation' | 'Reporting' | 'Meeting';
}

type CommitteeType = 'Privacy Committee' | 'Security Committee' | 'Risk Committee' | 'Ethics Committee' | 'ESG Committee';
type MemberRole = 'Chair' | 'Secretary' | 'Member' | 'Observer';

interface CommitteeMember {
  id: string;
  name: string;
  role: MemberRole;
  department: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'On Leave' | 'Rotated Out';
}

interface MeetingMinutes {
  id: string;
  date: string;
  title: string;
  attendees: string[];
  agenda: string[];
  decisions: string[];
  actionItems: { item: string; owner: string; dueDate: string; status: string }[];
  nextMeetingDate: string;
}

interface DecisionRecord {
  id: string;
  date: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  outcome: 'Approved' | 'Rejected' | 'Deferred' | 'Amended';
  rationale: string;
}

interface Committee {
  id: string;
  type: CommitteeType;
  charter: string;
  meetingFrequency: string;
  members: CommitteeMember[];
  meetings: MeetingMinutes[];
  decisions: DecisionRecord[];
  status: 'Active' | 'Forming' | 'Inactive';
  nextMeetingDate: string;
}

type EscalationLevel = 'L1' | 'L2' | 'L3' | 'Executive' | 'Board';

interface EscalationStep {
  id: string;
  level: EscalationLevel;
  title: string;
  responsible: string;
  email: string;
  slaMinutes: number;
  notificationChannels: ('Email' | 'SMS' | 'Slack' | 'Teams' | 'Phone' | 'PagerDuty')[];
  autoEscalate: boolean;
  autoEscalateAfterMinutes: number;
}

interface EscalationTrigger {
  id: string;
  name: string;
  type: 'SLA Breach' | 'Risk Threshold' | 'Incident Severity' | 'Audit Finding' | 'Regulatory Deadline';
  condition: string;
  startsAtLevel: EscalationLevel;
}

interface EscalationPath {
  id: string;
  name: string;
  scenario: 'Data Breach' | 'Audit Finding' | 'Vendor Incident' | 'Regulatory Inquiry' | 'Security Incident' | 'Compliance Violation' | 'Custom';
  description: string;
  status: 'Active' | 'Draft' | 'Archived';
  steps: EscalationStep[];
  triggers: EscalationTrigger[];
  lastUpdated: string;
}

/* ------------------------------------------------------------------ */
/*  ID helper                                                          */
/* ------------------------------------------------------------------ */
let _uid = 5000;
const uid = (prefix = 'id') => `${prefix}-${++_uid}`;

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

const demoDPO: DPOProfile = {
  id: 'dpo-1',
  name: 'Dr. Elena Fischer',
  email: 'elena.fischer@company.eu',
  phone: '+49 30 12345678',
  department: 'Legal & Compliance',
  qualifications: [
    'CIPP/E (Certified Information Privacy Professional/Europe)',
    'CIPM (Certified Information Privacy Manager)',
    'LLM in European Data Protection Law',
    '10+ years privacy law experience',
  ],
  certifications: ['CIPP/E', 'CIPM', 'ISO 27001 Lead Auditor', 'CDPSE'],
  appointmentDate: '2024-03-15',
  status: 'Active',
  conflictOfInterestCheck: 'Passed',
  reportingTo: 'Chief Executive Officer (Board level)',
  registeredWithDPA: true,
  dpaRegistrationDate: '2024-04-01',
  dpaReference: 'DPA-2024-EU-08472',
  tasks: [
    { id: 't1', title: 'Annual DPIA Review', description: 'Review all Data Protection Impact Assessments for current processing activities', dueDate: '2026-03-15', priority: 'High', status: 'In Progress', category: 'Monitoring' },
    { id: 't2', title: 'Data Breach Response Drill', description: 'Coordinate quarterly tabletop exercise for breach notification process', dueDate: '2026-02-28', priority: 'Critical', status: 'Open', category: 'Training' },
    { id: 't3', title: 'Vendor DPA Audit', description: 'Audit all third-party data processing agreements for Article 28 compliance', dueDate: '2026-04-01', priority: 'High', status: 'Open', category: 'Monitoring' },
    { id: 't4', title: 'Privacy Policy Update', description: 'Update privacy notice to reflect new marketing analytics processing', dueDate: '2026-02-20', priority: 'Medium', status: 'In Progress', category: 'Advisory' },
    { id: 't5', title: 'Staff Privacy Training Q1', description: 'Deliver mandatory GDPR awareness training for all employees', dueDate: '2026-03-31', priority: 'Medium', status: 'Open', category: 'Training' },
    { id: 't6', title: 'Subject Access Request Backlog', description: 'Clear pending DSARs within statutory 30-day deadline', dueDate: '2026-02-25', priority: 'Critical', status: 'In Progress', category: 'Investigation' },
  ],
  activityLog: [
    { id: 'a1', date: '2026-02-17', action: 'Reviewed DPIA for AI chatbot deployment', details: 'Identified high-risk processing requiring enhanced safeguards. Recommended additional consent mechanisms and algorithmic transparency measures.', category: 'Advisory' },
    { id: 'a2', date: '2026-02-15', action: 'Attended Privacy Committee meeting', details: 'Presented quarterly compliance dashboard. Discussed upcoming CSRD reporting requirements and their intersection with GDPR.', category: 'Meeting' },
    { id: 'a3', date: '2026-02-14', action: 'Investigated data subject complaint', details: 'Customer complained about marketing emails after withdrawal of consent. Traced issue to delayed sync between CRM and email platform. Remediation completed.', category: 'Investigation' },
    { id: 'a4', date: '2026-02-12', action: 'Delivered training to Engineering team', details: 'Privacy by Design workshop covering data minimization, pseudonymization, and secure development lifecycle.', category: 'Training' },
    { id: 'a5', date: '2026-02-10', action: 'Submitted DPA annual report', details: 'Filed annual processing activities report with national supervisory authority as per Article 30 requirements.', category: 'Reporting' },
    { id: 'a6', date: '2026-02-08', action: 'Monitored cross-border transfer compliance', details: 'Reviewed updated adequacy decisions post-EU-US Data Privacy Framework. Verified all SCCs remain current.', category: 'Monitoring' },
  ],
};

const demoCommittees: Committee[] = [
  {
    id: 'com-1', type: 'Privacy Committee', charter: 'Oversee organizational data protection strategy, review DPIAs, approve privacy policies, monitor compliance with GDPR and related regulations.', meetingFrequency: 'Monthly', status: 'Active', nextMeetingDate: '2026-03-01',
    members: [
      { id: 'cm1', name: 'Dr. Elena Fischer', role: 'Chair', department: 'Legal & Compliance', email: 'elena.fischer@company.eu', joinDate: '2024-03-15', status: 'Active' },
      { id: 'cm2', name: 'Marcus Wei', role: 'Secretary', department: 'Legal & Compliance', email: 'marcus.wei@company.eu', joinDate: '2024-04-01', status: 'Active' },
      { id: 'cm3', name: 'Sarah Johnson', role: 'Member', department: 'Engineering', email: 'sarah.johnson@company.eu', joinDate: '2024-04-01', status: 'Active' },
      { id: 'cm4', name: 'Hans Mueller', role: 'Member', department: 'Marketing', email: 'hans.mueller@company.eu', joinDate: '2024-06-01', status: 'Active' },
      { id: 'cm5', name: 'Priya Patel', role: 'Member', department: 'HR', email: 'priya.patel@company.eu', joinDate: '2024-04-01', status: 'Active' },
      { id: 'cm6', name: 'Thomas Berg', role: 'Observer', department: 'Internal Audit', email: 'thomas.berg@company.eu', joinDate: '2025-01-01', status: 'Active' },
    ],
    meetings: [
      {
        id: 'mt1', date: '2026-02-01', title: 'Monthly Privacy Committee Meeting', attendees: ['Dr. Elena Fischer', 'Marcus Wei', 'Sarah Johnson', 'Hans Mueller', 'Priya Patel'],
        agenda: ['Q4 DSAR metrics review', 'AI chatbot DPIA approval', 'Vendor DPA renewal schedule', 'CSRD privacy alignment'],
        decisions: ['Approved AI chatbot DPIA with conditions', 'Deferred CSRD alignment to next meeting pending ESG Committee input'],
        actionItems: [
          { item: 'Implement AI chatbot consent mechanism', owner: 'Sarah Johnson', dueDate: '2026-02-28', status: 'In Progress' },
          { item: 'Schedule joint session with ESG Committee', owner: 'Marcus Wei', dueDate: '2026-02-15', status: 'Completed' },
          { item: 'Audit vendor DPAs expiring Q1', owner: 'Dr. Elena Fischer', dueDate: '2026-03-15', status: 'Open' },
        ],
        nextMeetingDate: '2026-03-01',
      },
    ],
    decisions: [
      { id: 'd1', date: '2026-02-01', title: 'AI Chatbot DPIA Approval', description: 'Approve deployment of customer-facing AI chatbot with enhanced consent and transparency requirements.', votesFor: 4, votesAgainst: 0, votesAbstain: 1, outcome: 'Approved', rationale: 'DPIA demonstrates adequate safeguards. Conditions: explicit consent for profiling, algorithmic transparency notice, human-in-the-loop for complaints.' },
      { id: 'd2', date: '2026-01-05', title: 'Marketing Analytics Platform Migration', description: 'Migrate from legacy analytics to privacy-preserving server-side analytics.', votesFor: 5, votesAgainst: 0, votesAbstain: 0, outcome: 'Approved', rationale: 'Server-side analytics eliminates third-party cookie dependency and reduces cross-border transfer risks.' },
    ],
  },
  {
    id: 'com-2', type: 'Security Committee', charter: 'Govern information security strategy, incident response preparedness, vulnerability management, and security architecture reviews. Ensure compliance with ISO 27001 and NIS2.', meetingFrequency: 'Bi-weekly', status: 'Active', nextMeetingDate: '2026-02-24',
    members: [
      { id: 'sc1', name: 'David Kim', role: 'Chair', department: 'IT Security', email: 'david.kim@company.eu', joinDate: '2024-01-10', status: 'Active' },
      { id: 'sc2', name: 'Alex Rivera', role: 'Secretary', department: 'IT Security', email: 'alex.rivera@company.eu', joinDate: '2024-02-01', status: 'Active' },
      { id: 'sc3', name: 'Sarah Johnson', role: 'Member', department: 'Engineering', email: 'sarah.johnson@company.eu', joinDate: '2024-02-01', status: 'Active' },
      { id: 'sc4', name: 'James O\'Brien', role: 'Member', department: 'IT Operations', email: 'james.obrien@company.eu', joinDate: '2024-02-01', status: 'Active' },
      { id: 'sc5', name: 'Dr. Elena Fischer', role: 'Observer', department: 'Legal & Compliance', email: 'elena.fischer@company.eu', joinDate: '2024-03-15', status: 'Active' },
    ],
    meetings: [
      {
        id: 'mt2', date: '2026-02-10', title: 'Bi-weekly Security Review', attendees: ['David Kim', 'Alex Rivera', 'Sarah Johnson', 'James O\'Brien'],
        agenda: ['Vulnerability scan results', 'Penetration test findings', 'NIS2 incident reporting readiness', 'SOC 2 Type II audit prep'],
        decisions: ['Prioritize critical CVE patching within 48 hours'],
        actionItems: [
          { item: 'Patch critical CVEs on production servers', owner: 'James O\'Brien', dueDate: '2026-02-12', status: 'Completed' },
          { item: 'Update incident response playbook for NIS2', owner: 'David Kim', dueDate: '2026-02-28', status: 'In Progress' },
        ],
        nextMeetingDate: '2026-02-24',
      },
    ],
    decisions: [
      { id: 'sd1', date: '2026-02-10', title: 'Emergency Patching Protocol', description: 'Mandate 48-hour SLA for critical CVE patches on production systems.', votesFor: 4, votesAgainst: 0, votesAbstain: 0, outcome: 'Approved', rationale: 'NIS2 Article 21 requires timely vulnerability handling. Critical CVEs pose immediate exploitation risk.' },
    ],
  },
  {
    id: 'com-3', type: 'Ethics Committee', charter: 'Oversee ethical AI development and deployment, review algorithmic bias assessments, ensure compliance with EU AI Act, and manage AI risk register.', meetingFrequency: 'Monthly', status: 'Active', nextMeetingDate: '2026-03-05',
    members: [
      { id: 'ec1', name: 'Prof. Anna Lindqvist', role: 'Chair', department: 'External Advisory', email: 'anna.lindqvist@university.eu', joinDate: '2025-01-01', status: 'Active' },
      { id: 'ec2', name: 'Dr. Elena Fischer', role: 'Member', department: 'Legal & Compliance', email: 'elena.fischer@company.eu', joinDate: '2025-01-01', status: 'Active' },
      { id: 'ec3', name: 'Raj Kapoor', role: 'Member', department: 'AI/ML Engineering', email: 'raj.kapoor@company.eu', joinDate: '2025-01-01', status: 'Active' },
      { id: 'ec4', name: 'Lisa Chang', role: 'Secretary', department: 'Product', email: 'lisa.chang@company.eu', joinDate: '2025-02-01', status: 'Active' },
    ],
    meetings: [],
    decisions: [
      { id: 'ed1', date: '2026-01-10', title: 'High-Risk AI System Classification', description: 'Classify customer credit scoring model as high-risk under EU AI Act Annex III.', votesFor: 3, votesAgainst: 0, votesAbstain: 1, outcome: 'Approved', rationale: 'Credit scoring falls under EU AI Act Annex III point 5(b). Requires conformity assessment, transparency obligations, and human oversight.' },
    ],
  },
  {
    id: 'com-4', type: 'Risk Committee', charter: 'Enterprise risk management oversight including operational, financial, regulatory, and strategic risk assessment and mitigation.', meetingFrequency: 'Quarterly', status: 'Active', nextMeetingDate: '2026-04-01',
    members: [
      { id: 'rc1', name: 'Katherine Wells', role: 'Chair', department: 'Risk Management', email: 'katherine.wells@company.eu', joinDate: '2023-06-01', status: 'Active' },
      { id: 'rc2', name: 'Michael Torres', role: 'Member', department: 'Finance', email: 'michael.torres@company.eu', joinDate: '2023-06-01', status: 'Active' },
      { id: 'rc3', name: 'David Kim', role: 'Member', department: 'IT Security', email: 'david.kim@company.eu', joinDate: '2024-01-10', status: 'Active' },
      { id: 'rc4', name: 'Sophie Martin', role: 'Secretary', department: 'Risk Management', email: 'sophie.martin@company.eu', joinDate: '2024-01-01', status: 'Active' },
    ],
    meetings: [],
    decisions: [],
  },
  {
    id: 'com-5', type: 'ESG Committee', charter: 'Govern Environmental, Social, and Governance reporting strategy. Ensure CSRD compliance, manage sustainability KPIs, and oversee ESG risk integration.', meetingFrequency: 'Monthly', status: 'Forming',  nextMeetingDate: '2026-03-10',
    members: [
      { id: 'esg1', name: 'Isabelle Dupont', role: 'Chair', department: 'Sustainability', email: 'isabelle.dupont@company.eu', joinDate: '2025-09-01', status: 'Active' },
      { id: 'esg2', name: 'Michael Torres', role: 'Member', department: 'Finance', email: 'michael.torres@company.eu', joinDate: '2025-10-01', status: 'Active' },
    ],
    meetings: [],
    decisions: [],
  },
];

const demoEscalationPaths: EscalationPath[] = [
  {
    id: 'esc-1', name: 'Data Breach Escalation', scenario: 'Data Breach', description: 'Escalation path for personal data breaches requiring GDPR Article 33/34 notification within 72 hours.', status: 'Active', lastUpdated: '2026-01-20',
    steps: [
      { id: 'es1', level: 'L1', title: 'SOC Analyst / First Responder', responsible: 'SOC Team', email: 'soc@company.eu', slaMinutes: 30, notificationChannels: ['Email', 'Slack', 'PagerDuty'], autoEscalate: true, autoEscalateAfterMinutes: 30 },
      { id: 'es2', level: 'L2', title: 'Security Manager / Incident Commander', responsible: 'David Kim', email: 'david.kim@company.eu', slaMinutes: 60, notificationChannels: ['Email', 'Phone', 'Slack'], autoEscalate: true, autoEscalateAfterMinutes: 60 },
      { id: 'es3', level: 'L3', title: 'DPO / CISO Joint Assessment', responsible: 'Dr. Elena Fischer & David Kim', email: 'dpo@company.eu', slaMinutes: 120, notificationChannels: ['Email', 'Phone', 'SMS'], autoEscalate: true, autoEscalateAfterMinutes: 240 },
      { id: 'es4', level: 'Executive', title: 'CEO / General Counsel', responsible: 'CEO Office', email: 'ceo@company.eu', slaMinutes: 480, notificationChannels: ['Email', 'Phone'], autoEscalate: true, autoEscalateAfterMinutes: 1440 },
      { id: 'es5', level: 'Board', title: 'Board of Directors Emergency Session', responsible: 'Board Chair', email: 'board@company.eu', slaMinutes: 2880, notificationChannels: ['Email', 'Phone'], autoEscalate: false, autoEscalateAfterMinutes: 0 },
    ],
    triggers: [
      { id: 'tr1', name: 'Confirmed personal data exposure', type: 'Incident Severity', condition: 'Severity >= High AND data_type == personal_data', startsAtLevel: 'L2' },
      { id: 'tr2', name: '72-hour GDPR deadline approaching', type: 'Regulatory Deadline', condition: 'Hours remaining < 24 AND notification_not_sent', startsAtLevel: 'L3' },
      { id: 'tr3', name: 'Mass data subject impact (>1000)', type: 'Risk Threshold', condition: 'affected_subjects > 1000', startsAtLevel: 'Executive' },
    ],
  },
  {
    id: 'esc-2', name: 'Audit Finding Escalation', scenario: 'Audit Finding', description: 'Escalation path for internal and external audit findings requiring remediation tracking.', status: 'Active', lastUpdated: '2026-02-05',
    steps: [
      { id: 'af1', level: 'L1', title: 'Control Owner / Process Owner', responsible: 'Assigned Owner', email: 'compliance@company.eu', slaMinutes: 1440, notificationChannels: ['Email'], autoEscalate: true, autoEscalateAfterMinutes: 4320 },
      { id: 'af2', level: 'L2', title: 'Compliance Manager', responsible: 'Compliance Team', email: 'compliance.mgr@company.eu', slaMinutes: 2880, notificationChannels: ['Email', 'Slack'], autoEscalate: true, autoEscalateAfterMinutes: 10080 },
      { id: 'af3', level: 'L3', title: 'Head of Compliance / DPO', responsible: 'Dr. Elena Fischer', email: 'dpo@company.eu', slaMinutes: 7200, notificationChannels: ['Email', 'Phone'], autoEscalate: true, autoEscalateAfterMinutes: 20160 },
      { id: 'af4', level: 'Executive', title: 'Chief Risk Officer', responsible: 'Katherine Wells', email: 'cro@company.eu', slaMinutes: 14400, notificationChannels: ['Email', 'Phone'], autoEscalate: false, autoEscalateAfterMinutes: 0 },
    ],
    triggers: [
      { id: 'at1', name: 'Critical audit finding', type: 'Audit Finding', condition: 'finding_severity == Critical', startsAtLevel: 'L2' },
      { id: 'at2', name: 'Remediation SLA breach', type: 'SLA Breach', condition: 'days_overdue > 0 AND finding_open', startsAtLevel: 'L2' },
      { id: 'at3', name: 'Repeat finding (3rd occurrence)', type: 'Audit Finding', condition: 'occurrence_count >= 3', startsAtLevel: 'L3' },
    ],
  },
  {
    id: 'esc-3', name: 'Vendor Incident Escalation', scenario: 'Vendor Incident', description: 'Escalation path for third-party/vendor security incidents or compliance failures.', status: 'Active', lastUpdated: '2026-02-12',
    steps: [
      { id: 'vi1', level: 'L1', title: 'Vendor Manager / Procurement', responsible: 'Procurement Team', email: 'procurement@company.eu', slaMinutes: 60, notificationChannels: ['Email', 'Slack'], autoEscalate: true, autoEscalateAfterMinutes: 120 },
      { id: 'vi2', level: 'L2', title: 'IT Security / Compliance', responsible: 'Security & Compliance', email: 'security@company.eu', slaMinutes: 240, notificationChannels: ['Email', 'Slack', 'Phone'], autoEscalate: true, autoEscalateAfterMinutes: 480 },
      { id: 'vi3', level: 'L3', title: 'DPO / CISO / Legal', responsible: 'Leadership Triad', email: 'incident@company.eu', slaMinutes: 480, notificationChannels: ['Email', 'Phone'], autoEscalate: true, autoEscalateAfterMinutes: 1440 },
      { id: 'vi4', level: 'Executive', title: 'CFO / CEO', responsible: 'C-Suite', email: 'executive@company.eu', slaMinutes: 1440, notificationChannels: ['Email', 'Phone'], autoEscalate: false, autoEscalateAfterMinutes: 0 },
    ],
    triggers: [
      { id: 'vt1', name: 'Vendor data breach notification', type: 'Incident Severity', condition: 'vendor_reported_breach == true', startsAtLevel: 'L2' },
      { id: 'vt2', name: 'Critical vendor SLA breach', type: 'SLA Breach', condition: 'vendor_sla_breached AND vendor_criticality >= High', startsAtLevel: 'L2' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

const priorityColor = (p: string) => {
  switch (p) {
    case 'Critical': return 'bg-red-100 text-red-800';
    case 'High': return 'bg-orange-100 text-orange-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Pending Approval': return 'bg-amber-100 text-amber-700';
    case 'Forming': return 'bg-blue-100 text-blue-700';
    case 'Inactive': case 'Archived': return 'bg-gray-100 text-gray-600';
    case 'Open': return 'bg-blue-100 text-blue-700';
    case 'In Progress': return 'bg-amber-100 text-amber-700';
    case 'Completed': return 'bg-green-100 text-green-700';
    case 'Overdue': return 'bg-red-100 text-red-700';
    case 'Draft': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const levelColor = (l: EscalationLevel) => {
  switch (l) {
    case 'L1': return 'bg-blue-500';
    case 'L2': return 'bg-amber-500';
    case 'L3': return 'bg-orange-500';
    case 'Executive': return 'bg-red-500';
    case 'Board': return 'bg-purple-600';
    default: return 'bg-gray-500';
  }
};

const formatMinutes = (m: number) => {
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const GovernanceManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'dpo' | 'committees' | 'escalation'>('dpo');

  /* ---- DPO state ---- */
  const [dpo, setDpo] = useState<DPOProfile>(demoDPO);
  const [dpoSubTab, setDpoSubTab] = useState<'profile' | 'tasks' | 'activity' | 'reporting'>('profile');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'Medium' as DPOTask['priority'], category: 'Advisory' });

  /* ---- Committee state ---- */
  const [committees, setCommittees] = useState<Committee[]>(demoCommittees);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(null);
  const [committeeSubTab, setCommitteeSubTab] = useState<'members' | 'meetings' | 'decisions' | 'charter'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'Member' as MemberRole, department: '', email: '' });

  /* ---- Escalation state ---- */
  const [escalationPaths, setEscalationPaths] = useState<EscalationPath[]>(demoEscalationPaths);
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [showAddPath, setShowAddPath] = useState(false);
  const [newPath, setNewPath] = useState({ name: '', scenario: 'Custom' as EscalationPath['scenario'], description: '' });
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStep, setNewStep] = useState({ level: 'L1' as EscalationLevel, title: '', responsible: '', email: '', slaMinutes: 60, notificationChannels: ['Email'] as EscalationStep['notificationChannels'] });
  const [showAddTrigger, setShowAddTrigger] = useState(false);
  const [newTrigger, setNewTrigger] = useState({ name: '', type: 'Incident Severity' as EscalationTrigger['type'], condition: '', startsAtLevel: 'L1' as EscalationLevel });

  /* ---- loading / error state ---- */
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ---- derived ---- */
  const selectedCommittee = useMemo(() => committees.find(c => c.id === selectedCommitteeId) ?? null, [committees, selectedCommitteeId]);
  const selectedEscalation = useMemo(() => escalationPaths.find(e => e.id === selectedEscalationId) ?? null, [escalationPaths, selectedEscalationId]);

  /* ---- load from API ---- */
  useEffect(() => {
    (async () => {
      try {
        const [bodies, dpoData] = await Promise.all([
          api.modules.governance.listBodies(),
          api.modules.governance.getDPO(),
        ]);
        if (bodies && bodies.length > 0) {
          setCommittees(bodies.map((b: any) => ({
            id: b.id, type: b.name as CommitteeType, charter: b.charter || '',
            meetingFrequency: b.meetingFrequency || 'Monthly',
            members: (b.members || []) as CommitteeMember[],
            meetings: (b.meetings || []).map((m: any) => ({
              id: m.id, date: m.date, title: m.title,
              attendees: (m.attendees || []).map((a: any) => a.name || a),
              agenda: (m.agenda || []).map((a: any) => a.topic || a),
              decisions: [], actionItems: m.actionItems || [], nextMeetingDate: '',
            })),
            decisions: (b.decisions || []).map((d: any) => ({
              id: d.id, date: d.createdAt, title: d.title, description: d.description || '',
              votesFor: 0, votesAgainst: 0, votesAbstain: 0,
              outcome: d.status === 'approved' ? 'Approved' : 'Deferred',
              rationale: d.rationale || '',
            })),
            status: b.status === 'active' ? 'Active' : 'Inactive',
            nextMeetingDate: '',
          })));
          setEscalationPaths(prev => {
            const apiPaths = (bodies.flatMap((b: any) => b.escalationPaths || []) as any[]).map((p: any) => ({
              id: p.id, name: p.name, scenario: 'Custom' as const, description: '',
              status: p.status === 'active' ? 'Active' as const : 'Draft' as const,
              steps: (p.levels || []) as EscalationStep[],
              triggers: (p.triggerCriteria || []) as EscalationTrigger[],
              lastUpdated: p.updatedAt || new Date().toISOString(),
            }));
            return apiPaths.length > 0 ? apiPaths : prev;
          });
        }
        if (dpoData) {
          setDpo(prev => ({ ...prev, name: dpoData.name, email: dpoData.email, phone: dpoData.phone || prev.phone, tasks: dpoData.tasks || prev.tasks, activityLog: dpoData.activityLog || prev.activityLog }));
        }
        setLoadError(null);
      } catch (err: any) {
        setLoadError('Unable to connect to server. Showing local data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /* ---- API persistence helpers ---- */
  // Locally-generated ids start with a recognized prefix and have not yet been persisted.
  const isLocalId = (id: string) => /^(esc|cm|step|trig|task|gov|com)-/.test(id);

  const persistDpo = useCallback(async (next: DPOProfile) => {
    try {
      await api.modules.governance.upsertDPO({
        name: next.name,
        email: next.email,
        phone: next.phone,
        appointmentDate: next.appointmentDate,
        certifications: next.certifications,
        tasks: next.tasks,
        activityLog: next.activityLog,
      });
    } catch {
      setLoadError('Server failed to save DPO change. Local state retained.');
    }
  }, []);

  const persistCommittee = useCallback(async (committee: Committee) => {
    try {
      const payload = {
        name: committee.type,
        charter: committee.charter,
        meetingFrequency: committee.meetingFrequency,
        members: committee.members,
        status: committee.status?.toLowerCase(),
      };
      if (isLocalId(committee.id)) {
        const created = await api.modules.governance.createBody({ ...payload, name: committee.type });
        if (created?.id) {
          setCommittees(prev => prev.map(c => c.id === committee.id ? { ...c, id: created.id } : c));
          if (selectedCommitteeId === committee.id) setSelectedCommitteeId(created.id);
        }
      } else {
        await api.modules.governance.updateBody(committee.id, payload);
      }
    } catch {
      setLoadError('Server failed to save committee change. Local state retained.');
    }
  }, [selectedCommitteeId]);

  const persistEscalation = useCallback(async (path: EscalationPath, opts?: { create?: boolean }) => {
    try {
      const payload = {
        name: path.name,
        levels: path.steps,
        triggerCriteria: path.triggers,
        status: path.status?.toLowerCase(),
      };
      if (opts?.create || isLocalId(path.id)) {
        const created = await api.modules.governance.createEscalationPath(payload);
        if (created?.id) {
          setEscalationPaths(prev => prev.map(e => e.id === path.id ? { ...e, id: created.id } : e));
          if (selectedEscalationId === path.id) setSelectedEscalationId(created.id);
        }
      } else {
        await api.modules.governance.updateEscalationPath(path.id, payload);
      }
    } catch {
      setLoadError('Server failed to save escalation path. Local state retained.');
    }
  }, [selectedEscalationId]);

  /* ---- DPO callbacks ---- */
  const addDPOTask = useCallback(() => {
    if (!newTask.title.trim()) return;
    const task: DPOTask = { id: uid('task'), ...newTask, status: 'Open' };
    setDpo(prev => {
      const next = { ...prev, tasks: [...prev.tasks, task] };
      void persistDpo(next);
      return next;
    });
    setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium', category: 'Advisory' });
    setShowAddTask(false);
  }, [newTask, persistDpo]);

  const updateTaskStatus = useCallback((taskId: string, status: DPOTask['status']) => {
    setDpo(prev => {
      const next = { ...prev, tasks: prev.tasks.map(tk => tk.id === taskId ? { ...tk, status } : tk) };
      void persistDpo(next);
      return next;
    });
  }, [persistDpo]);

  /* ---- Committee callbacks ---- */
  const updateCommittee = useCallback((updater: (c: Committee) => Committee, persist = true) => {
    setCommittees(prev => {
      let touched: Committee | null = null;
      const next = prev.map(c => {
        if (c.id === selectedCommitteeId) {
          const u = updater(c);
          touched = u;
          return u;
        }
        return c;
      });
      if (persist && touched) void persistCommittee(touched);
      return next;
    });
  }, [selectedCommitteeId, persistCommittee]);

  const addCommitteeMember = useCallback(() => {
    if (!newMember.name.trim() || !selectedCommitteeId) return;
    const member: CommitteeMember = { id: uid('cm'), ...newMember, joinDate: new Date().toISOString().split('T')[0], status: 'Active' };
    updateCommittee(c => ({ ...c, members: [...c.members, member] }));
    setNewMember({ name: '', role: 'Member', department: '', email: '' });
    setShowAddMember(false);
  }, [newMember, selectedCommitteeId, updateCommittee]);

  const removeCommitteeMember = useCallback((memberId: string) => {
    updateCommittee(c => ({ ...c, members: c.members.filter(m => m.id !== memberId) }));
  }, [updateCommittee]);

  /* ---- Escalation callbacks ---- */
  const addEscalationPath = useCallback(() => {
    if (!newPath.name.trim()) return;
    const path: EscalationPath = { id: uid('esc'), ...newPath, status: 'Draft', steps: [], triggers: [], lastUpdated: new Date().toISOString().split('T')[0] };
    setEscalationPaths(prev => [...prev, path]);
    setSelectedEscalationId(path.id);
    setNewPath({ name: '', scenario: 'Custom', description: '' });
    setShowAddPath(false);
    void persistEscalation(path, { create: true });
  }, [newPath, persistEscalation]);

  const removeEscalationPath = useCallback(async (pathId: string) => {
    setEscalationPaths(prev => prev.filter(e => e.id !== pathId));
    if (selectedEscalationId === pathId) setSelectedEscalationId(null);
    if (isLocalId(pathId)) return;
    try {
      await api.modules.governance.deleteEscalationPath(pathId);
    } catch {
      setLoadError('Failed to delete escalation path on server. It may reappear on reload.');
    }
  }, [selectedEscalationId]);

  const updateEscalation = useCallback((updater: (e: EscalationPath) => EscalationPath, persist = true) => {
    setEscalationPaths(prev => {
      let touched: EscalationPath | null = null;
      const next = prev.map(e => {
        if (e.id === selectedEscalationId) {
          const u = updater(e);
          touched = u;
          return u;
        }
        return e;
      });
      if (persist && touched) void persistEscalation(touched);
      return next;
    });
  }, [selectedEscalationId, persistEscalation]);

  const addEscalationStep = useCallback(() => {
    if (!newStep.title.trim()) return;
    const step: EscalationStep = { id: uid('step'), ...newStep, autoEscalate: true, autoEscalateAfterMinutes: newStep.slaMinutes * 2 };
    updateEscalation(e => ({ ...e, steps: [...e.steps, step], lastUpdated: new Date().toISOString().split('T')[0] }));
    setNewStep({ level: 'L1', title: '', responsible: '', email: '', slaMinutes: 60, notificationChannels: ['Email'] });
    setShowAddStep(false);
  }, [newStep, updateEscalation]);

  const removeEscalationStep = useCallback((stepId: string) => {
    updateEscalation(e => ({ ...e, steps: e.steps.filter(s => s.id !== stepId), lastUpdated: new Date().toISOString().split('T')[0] }));
  }, [updateEscalation]);

  const addEscalationTrigger = useCallback(() => {
    if (!newTrigger.name.trim()) return;
    const trigger: EscalationTrigger = { id: uid('trig'), ...newTrigger };
    updateEscalation(e => ({ ...e, triggers: [...e.triggers, trigger], lastUpdated: new Date().toISOString().split('T')[0] }));
    setNewTrigger({ name: '', type: 'Incident Severity', condition: '', startsAtLevel: 'L1' });
    setShowAddTrigger(false);
  }, [newTrigger, updateEscalation]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Governance Manager</h2>
          <p className="text-sm text-gray-500">DPO management, committee oversight, and escalation path design</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Loading governance data...</span>
        </div>
      )}
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700">{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'dpo' as const, label: 'DPO Management', icon: <UserCheck size={15} /> },
          { key: 'committees' as const, label: 'Committees', icon: <Users size={15} /> },
          { key: 'escalation' as const, label: 'Escalation Paths', icon: <ArrowUpRight size={15} /> },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* DPO TAB                                                       */}
      {/* ============================================================ */}
      {activeTab === 'dpo' && (
        <div className="space-y-4">
          {/* DPO Sub-tabs */}
          <div className="flex gap-2">
            {(['profile', 'tasks', 'activity', 'reporting'] as const).map(st => (
              <button key={st} onClick={() => setDpoSubTab(st)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dpoSubTab === st ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          {/* Profile */}
          {dpoSubTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main profile card */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl">{dpo.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{dpo.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(dpo.status)}`}>{dpo.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">Data Protection Officer</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Mail size={13} /> {dpo.email}</span>
                      <span className="flex items-center gap-1"><Phone size={13} /> {dpo.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 text-xs font-medium mb-1">Department</p><p className="text-gray-900">{dpo.department}</p></div>
                  <div><p className="text-gray-500 text-xs font-medium mb-1">Appointment Date</p><p className="text-gray-900">{dpo.appointmentDate}</p></div>
                  <div><p className="text-gray-500 text-xs font-medium mb-1">Reports To</p><p className="text-gray-900">{dpo.reportingTo}</p></div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Conflict of Interest</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dpo.conflictOfInterestCheck === 'Passed' ? 'bg-green-100 text-green-700' : dpo.conflictOfInterestCheck === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{dpo.conflictOfInterestCheck}</span>
                  </div>
                </div>
                <hr className="my-4" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Qualifications</p>
                  <ul className="space-y-1">
                    {dpo.qualifications.map((q, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />{q}</li>)}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {dpo.certifications.map((c, i) => <span key={i} className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200">{c}</span>)}
                  </div>
                </div>
              </div>

              {/* DPA Registration */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={18} className="text-blue-600" />
                    <h4 className="font-semibold text-gray-900">DPA Registration</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">GDPR Articles 37-39 require DPO registration with the supervisory authority.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Registered</span><span className={`font-medium ${dpo.registeredWithDPA ? 'text-green-600' : 'text-red-600'}`}>{dpo.registeredWithDPA ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Registration Date</span><span className="font-medium">{dpo.dpaRegistrationDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-medium font-mono text-xs">{dpo.dpaReference}</span></div>
                  </div>
                </div>

                {/* Task summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">Task Summary</h4>
                  <div className="space-y-2">
                    {(['Critical', 'High', 'Medium', 'Low'] as const).map(p => {
                      const count = dpo.tasks.filter(tk => tk.priority === p && tk.status !== 'Completed').length;
                      return (
                        <div key={p} className="flex justify-between items-center text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor(p)}`}>{p}</span>
                          <span className="font-medium text-gray-900">{count} open</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GDPR Articles reference */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-1"><BookOpen size={14} /> GDPR DPO Requirements</h4>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li><strong>Art. 37:</strong> Designation of DPO</li>
                    <li><strong>Art. 38:</strong> Position of DPO (independence, resources, no instructions)</li>
                    <li><strong>Art. 39:</strong> Tasks (monitoring, advising, cooperating with DPA)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tasks */}
          {dpoSubTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">DPO Tasks ({dpo.tasks.length})</h3>
                <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-brand-700"><Plus size={14} /> Add Task</button>
              </div>
              <div className="space-y-3">
                {dpo.tasks.map(task => (
                  <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor(task.priority)}`}>{task.priority}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(task.status)}`}>{task.status}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar size={12} /> Due: {task.dueDate}</span>
                          <span className="flex items-center gap-1"><ClipboardList size={12} /> {task.category}</span>
                        </div>
                      </div>
                      <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value as DPOTask['status'])} className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-brand-500 outline-none">
                        {['Open', 'In Progress', 'Completed', 'Overdue'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Modal */}
              {showAddTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">New DPO Task</h3><button onClick={() => setShowAddTask(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as any }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{['Advisory', 'Monitoring', 'Training', 'Investigation', 'Reporting', 'Meeting'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowAddTask(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button onClick={addDPOTask} disabled={!newTask.title.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add Task</button></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Log */}
          {dpoSubTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">DPO Activity Log</h3>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {dpo.activityLog.map(act => (
                    <div key={act.id} className="relative pl-14">
                      <div className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${act.category === 'Advisory' ? 'bg-blue-500' : act.category === 'Investigation' ? 'bg-red-500' : act.category === 'Training' ? 'bg-green-500' : act.category === 'Monitoring' ? 'bg-amber-500' : act.category === 'Reporting' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                        {act.category[0]}
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{act.action}</h4>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{act.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{act.details}</p>
                        <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${act.category === 'Advisory' ? 'bg-blue-50 text-blue-700' : act.category === 'Investigation' ? 'bg-red-50 text-red-700' : act.category === 'Training' ? 'bg-green-50 text-green-700' : act.category === 'Monitoring' ? 'bg-amber-50 text-amber-700' : act.category === 'Reporting' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'}`}>{act.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reporting Structure */}
          {dpoSubTab === 'reporting' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">DPO Reporting Structure</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-6">Per GDPR Article 38(3), the DPO shall directly report to the highest management level of the controller or processor.</p>
                {/* Visual reporting chain */}
                <div className="flex flex-col items-center gap-2">
                  {[
                    { title: 'Board of Directors', subtitle: 'Ultimate oversight', bg: 'bg-purple-50 border-purple-300' },
                    { title: 'Chief Executive Officer', subtitle: dpo.reportingTo.includes('CEO') ? 'Direct report line' : 'Executive oversight', bg: 'bg-red-50 border-red-300' },
                    { title: dpo.name, subtitle: 'Data Protection Officer (DPO)', bg: 'bg-brand-50 border-brand-400', highlight: true },
                  ].map((level, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ArrowUp size={20} className="text-gray-400" />}
                      <div className={`w-full max-w-md rounded-xl border-2 p-4 text-center ${level.bg} ${level.highlight ? 'ring-2 ring-brand-400' : ''}`}>
                        <p className="font-semibold text-gray-900">{level.title}</p>
                        <p className="text-xs text-gray-500">{level.subtitle}</p>
                      </div>
                    </React.Fragment>
                  ))}
                  <ArrowDown size={20} className="text-gray-400" />
                  <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
                    {['Privacy Committee', 'All Business Units', 'Data Subjects'].map(unit => (
                      <div key={unit} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-3 text-center">
                        <p className="font-medium text-gray-700 text-sm">{unit}</p>
                        <p className="text-xs text-gray-400">Advisory / Support</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 bg-amber-50 rounded-lg border border-amber-200 p-4">
                  <p className="text-sm text-amber-800 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span><strong>Independence Requirement:</strong> The DPO must not receive any instructions regarding the exercise of their tasks (Art. 38(3)). The DPO cannot be dismissed or penalized for performing their tasks.</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* COMMITTEES TAB                                                */}
      {/* ============================================================ */}
      {activeTab === 'committees' && !selectedCommittee && (
        <div className="space-y-4">
          {/* Committee stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {committees.map(c => (
              <div key={c.id} onClick={() => setSelectedCommitteeId(c.id)} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{c.type}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p className="flex items-center gap-1"><Users size={12} /> {c.members.length} members</p>
                  <p className="flex items-center gap-1"><Calendar size={12} /> {c.meetingFrequency}</p>
                  <p className="flex items-center gap-1"><Vote size={12} /> {c.decisions.length} decisions</p>
                  <p className="flex items-center gap-1"><Clock size={12} /> Next: {c.nextMeetingDate}</p>
                </div>
              </div>
            ))}
          </div>

          {/* All members overview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
            <div className="p-4 border-b"><h3 className="font-semibold text-gray-900">All Governance Members</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b"><th className="px-4 py-2 text-left font-medium text-gray-600">Name</th><th className="px-4 py-2 text-left font-medium text-gray-600">Committees</th><th className="px-4 py-2 text-left font-medium text-gray-600">Roles</th><th className="px-4 py-2 text-left font-medium text-gray-600">Department</th></tr></thead>
              <tbody>
                {(() => {
                  const memberMap = new Map<string, { committees: { type: string; role: string }[]; dept: string }>();
                  committees.forEach(c => c.members.forEach(m => {
                    const existing = memberMap.get(m.name) || { committees: [], dept: m.department };
                    existing.committees.push({ type: c.type, role: m.role });
                    memberMap.set(m.name, existing);
                  }));
                  return Array.from(memberMap.entries()).map(([name, info]) => (
                    <tr key={name} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{name}</td>
                      <td className="px-4 py-2"><div className="flex flex-wrap gap-1">{info.committees.map((c, i) => <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-700">{c.type.replace(' Committee', '')}</span>)}</div></td>
                      <td className="px-4 py-2"><div className="flex flex-wrap gap-1">{info.committees.map((c, i) => <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${c.role === 'Chair' ? 'bg-brand-100 text-brand-700' : c.role === 'Secretary' ? 'bg-purple-100 text-purple-700' : c.role === 'Observer' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{c.role}</span>)}</div></td>
                      <td className="px-4 py-2 text-gray-600">{info.dept}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Committee Detail */}
      {activeTab === 'committees' && selectedCommittee && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedCommitteeId(null)} className="p-1.5 hover:bg-gray-200 rounded-full"><ArrowLeft size={16} /></button>
            <h3 className="text-lg font-bold text-gray-900">{selectedCommittee.type}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selectedCommittee.status)}`}>{selectedCommittee.status}</span>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2">
            {(['members', 'meetings', 'decisions', 'charter'] as const).map(st => (
              <button key={st} onClick={() => setCommitteeSubTab(st)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${committeeSubTab === st ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          {/* Members */}
          {committeeSubTab === 'members' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{selectedCommittee.members.length} member{selectedCommittee.members.length !== 1 ? 's' : ''}</p>
                <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-brand-700"><Plus size={14} /> Add Member</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedCommittee.members.map(m => (
                  <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">{m.name.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.department}</p>
                        </div>
                      </div>
                      <button onClick={() => removeCommitteeMember(m.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.role === 'Chair' ? 'bg-brand-100 text-brand-700' : m.role === 'Secretary' ? 'bg-purple-100 text-purple-700' : m.role === 'Observer' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{m.role}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(m.status)}`}>{m.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} /> {m.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Joined: {m.joinDate}</p>
                  </div>
                ))}
              </div>
              {/* Add Member Modal */}
              {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Add Member</h3><button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value as MemberRole }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{(['Chair', 'Secretary', 'Member', 'Observer'] as MemberRole[]).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input value={newMember.department} onChange={e => setNewMember(p => ({ ...p, department: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                    <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowAddMember(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button onClick={addCommitteeMember} disabled={!newMember.name.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add</button></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meetings */}
          {committeeSubTab === 'meetings' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center gap-3">
                <Calendar size={18} className="text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Next Meeting: {selectedCommittee.nextMeetingDate}</p>
                  <p className="text-xs text-blue-700">Frequency: {selectedCommittee.meetingFrequency}</p>
                </div>
              </div>
              {selectedCommittee.meetings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-40" />
                  <p>No meeting minutes recorded yet.</p>
                </div>
              ) : (
                selectedCommittee.meetings.map(meeting => (
                  <div key={meeting.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div><h4 className="font-semibold text-gray-900">{meeting.title}</h4><p className="text-xs text-gray-500">{meeting.date} | Attendees: {meeting.attendees.join(', ')}</p></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Agenda</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">{meeting.agenda.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Decisions</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">{meeting.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Action Items</p>
                      <div className="space-y-2">
                        {meeting.actionItems.map((ai, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div><p className="text-sm text-gray-900">{ai.item}</p><p className="text-xs text-gray-500">Owner: {ai.owner} | Due: {ai.dueDate}</p></div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(ai.status)}`}>{ai.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Decisions */}
          {committeeSubTab === 'decisions' && (
            <div className="space-y-3">
              {selectedCommittee.decisions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                  <Vote size={36} className="mx-auto mb-2 opacity-40" />
                  <p>No decisions recorded yet.</p>
                </div>
              ) : (
                selectedCommittee.decisions.map(dec => (
                  <div key={dec.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div><h4 className="font-semibold text-gray-900">{dec.title}</h4><p className="text-xs text-gray-400">{dec.date}</p></div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dec.outcome === 'Approved' ? 'bg-green-100 text-green-700' : dec.outcome === 'Rejected' ? 'bg-red-100 text-red-700' : dec.outcome === 'Deferred' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{dec.outcome}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{dec.description}</p>
                    <div className="flex gap-4 mb-3">
                      <div className="flex items-center gap-1 text-sm"><CheckCircle size={14} className="text-green-500" /> <span className="font-medium">{dec.votesFor}</span> <span className="text-gray-400">For</span></div>
                      <div className="flex items-center gap-1 text-sm"><XCircle size={14} className="text-red-500" /> <span className="font-medium">{dec.votesAgainst}</span> <span className="text-gray-400">Against</span></div>
                      <div className="flex items-center gap-1 text-sm"><span className="w-3.5 h-3.5 rounded-full bg-gray-300 inline-block" /> <span className="font-medium">{dec.votesAbstain}</span> <span className="text-gray-400">Abstain</span></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Rationale</p>
                      <p className="text-sm text-gray-700">{dec.rationale}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Charter */}
          {committeeSubTab === 'charter' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4"><BookOpen size={18} className="text-brand-600" /><h4 className="font-semibold text-gray-900">Charter / Terms of Reference</h4></div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">{selectedCommittee.charter}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500 text-xs font-medium mb-1">Meeting Frequency</p><p className="text-gray-900">{selectedCommittee.meetingFrequency}</p></div>
                <div><p className="text-gray-500 text-xs font-medium mb-1">Quorum</p><p className="text-gray-900">Majority of members ({Math.ceil(selectedCommittee.members.filter(m => m.role !== 'Observer').length / 2)}+)</p></div>
                <div><p className="text-gray-500 text-xs font-medium mb-1">Chair</p><p className="text-gray-900">{selectedCommittee.members.find(m => m.role === 'Chair')?.name ?? 'Not assigned'}</p></div>
                <div><p className="text-gray-500 text-xs font-medium mb-1">Secretary</p><p className="text-gray-900">{selectedCommittee.members.find(m => m.role === 'Secretary')?.name ?? 'Not assigned'}</p></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ESCALATION PATHS TAB                                          */}
      {/* ============================================================ */}
      {activeTab === 'escalation' && !selectedEscalation && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{escalationPaths.length} escalation path{escalationPaths.length !== 1 ? 's' : ''} configured</p>
            <button onClick={() => setShowAddPath(true)} className="flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-brand-700"><Plus size={14} /> New Path</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalationPaths.map(path => (
              <div key={path.id} onClick={() => setSelectedEscalationId(path.id)} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer relative group">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm(`Delete escalation path "${path.name}"?`)) {
                      void removeEscalationPath(path.id);
                    }
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white border border-gray-200 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
                  aria-label={`Delete ${path.name}`}
                >
                  <Trash2 size={12} />
                </button>
                <div className="flex items-start justify-between mb-2 pr-7">
                  <h4 className="font-semibold text-gray-900">{path.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(path.status)}`}>{path.status}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{path.description}</p>
                <div className="flex items-center gap-1 mb-3">
                  {path.steps.map((step, i) => (
                    <React.Fragment key={step.id}>
                      {i > 0 && <ArrowRight size={12} className="text-gray-300" />}
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${levelColor(step.level)}`}>{step.level}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Zap size={11} /> {path.triggers.length} triggers</span>
                  <span className="flex items-center gap-1"><Layers size={11} /> {path.steps.length} levels</span>
                  <span>{path.scenario}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Path Modal */}
          {showAddPath && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-lg font-bold">New Escalation Path</h3><button onClick={() => setShowAddPath(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={newPath.name} onChange={e => setNewPath(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., Regulatory Inquiry Escalation" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label><select value={newPath.scenario} onChange={e => setNewPath(p => ({ ...p, scenario: e.target.value as any }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{['Data Breach', 'Audit Finding', 'Vendor Incident', 'Regulatory Inquiry', 'Security Incident', 'Compliance Violation', 'Custom'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newPath.description} onChange={e => setNewPath(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowAddPath(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button onClick={addEscalationPath} disabled={!newPath.name.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Create</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Escalation Detail */}
      {activeTab === 'escalation' && selectedEscalation && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedEscalationId(null)} className="p-1.5 hover:bg-gray-200 rounded-full"><ArrowLeft size={16} /></button>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900">{selectedEscalation.name}</h3><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selectedEscalation.status)}`}>{selectedEscalation.status}</span></div>
              <p className="text-sm text-gray-500">{selectedEscalation.description}</p>
            </div>
          </div>

          {/* Visual escalation chain */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Escalation Chain</h4>
            <div className="flex items-start gap-3 overflow-x-auto pb-4">
              {selectedEscalation.steps.map((step, i) => (
                <React.Fragment key={step.id}>
                  {i > 0 && (
                    <div className="flex flex-col items-center justify-center shrink-0 pt-6">
                      <ArrowRight size={24} className="text-gray-400" />
                      {step.autoEscalate && (
                        <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">Auto: {formatMinutes(step.autoEscalateAfterMinutes)}</span>
                      )}
                    </div>
                  )}
                  <div className="min-w-[200px] shrink-0">
                    <div className={`${levelColor(step.level)} text-white px-3 py-1.5 rounded-t-xl text-center font-bold text-sm`}>{step.level}</div>
                    <div className="border-2 border-t-0 border-gray-200 rounded-b-xl p-3 bg-white">
                      <p className="font-medium text-gray-900 text-sm mb-1">{step.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{step.responsible}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-gray-600"><Clock size={11} /> SLA: {formatMinutes(step.slaMinutes)}</div>
                        <div className="flex items-center gap-1 text-gray-600"><Mail size={11} /> {step.email}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step.notificationChannels.map(ch => (
                            <span key={ch} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">{ch}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => removeEscalationStep(step.id)} className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={10} /> Remove</button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
              {/* Add step button */}
              <div className="min-w-[140px] shrink-0 flex flex-col items-center justify-center">
                {selectedEscalation.steps.length > 0 && <ArrowRight size={24} className="text-gray-300 mb-2" />}
                <button onClick={() => setShowAddStep(true)} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors flex flex-col items-center gap-1">
                  <Plus size={20} />
                  <span className="text-xs">Add Level</span>
                </button>
              </div>
            </div>
          </div>

          {/* Triggers */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-1"><Zap size={16} className="text-amber-500" /> Escalation Triggers</h4>
              <button onClick={() => setShowAddTrigger(true)} className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"><Plus size={14} /> Add Trigger</button>
            </div>
            {selectedEscalation.triggers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No triggers configured. Add triggers to define when escalation starts.</p>
            ) : (
              <div className="space-y-2">
                {selectedEscalation.triggers.map(trigger => (
                  <div key={trigger.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{trigger.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">{trigger.type}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${levelColor(trigger.startsAtLevel)}`}>Starts at {trigger.startsAtLevel}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">{trigger.condition}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Step Modal */}
          {showAddStep && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Add Escalation Level</h3><button onClick={() => setShowAddStep(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Level</label><select value={newStep.level} onChange={e => setNewStep(p => ({ ...p, level: e.target.value as EscalationLevel }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{(['L1', 'L2', 'L3', 'Executive', 'Board'] as EscalationLevel[]).map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">SLA (minutes)</label><input type="number" value={newStep.slaMinutes} onChange={e => setNewStep(p => ({ ...p, slaMinutes: +e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input value={newStep.title} onChange={e => setNewStep(p => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., Security Operations Center" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Responsible</label><input value={newStep.responsible} onChange={e => setNewStep(p => ({ ...p, responsible: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={newStep.email} onChange={e => setNewStep(p => ({ ...p, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Email', 'SMS', 'Slack', 'Teams', 'Phone', 'PagerDuty'] as const).map(ch => (
                      <button key={ch} onClick={() => setNewStep(p => ({ ...p, notificationChannels: p.notificationChannels.includes(ch) ? p.notificationChannels.filter(c => c !== ch) : [...p.notificationChannels, ch] }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${newStep.notificationChannels.includes(ch) ? 'bg-brand-100 text-brand-700 border-brand-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowAddStep(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button onClick={addEscalationStep} disabled={!newStep.title.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add Level</button></div>
              </div>
            </div>
          )}

          {/* Add Trigger Modal */}
          {showAddTrigger && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Add Escalation Trigger</h3><button onClick={() => setShowAddTrigger(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Trigger Name *</label><input value={newTrigger.name} onChange={e => setNewTrigger(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., Critical vulnerability detected" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={newTrigger.type} onChange={e => setNewTrigger(p => ({ ...p, type: e.target.value as any }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{['SLA Breach', 'Risk Threshold', 'Incident Severity', 'Audit Finding', 'Regulatory Deadline'].map(typ => <option key={typ} value={typ}>{typ}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Starts at Level</label><select value={newTrigger.startsAtLevel} onChange={e => setNewTrigger(p => ({ ...p, startsAtLevel: e.target.value as EscalationLevel }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">{(['L1', 'L2', 'L3', 'Executive', 'Board'] as EscalationLevel[]).map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Condition</label><input value={newTrigger.condition} onChange={e => setNewTrigger(p => ({ ...p, condition: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., severity >= Critical AND impact >= High" /></div>
                <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowAddTrigger(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button onClick={addEscalationTrigger} disabled={!newTrigger.name.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add Trigger</button></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GovernanceManager;
