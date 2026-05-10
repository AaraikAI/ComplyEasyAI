import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, Plus, Trash2, Edit3, Save, Download, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, Play, Square, Diamond, Circle,
  FileText, Database, GitBranch, Users, Shield, Link2, Layers,
  ArrowRight, ArrowDown, Search, Filter, BarChart3, ClipboardList,
  Workflow, Settings, Eye, Copy, Move, Lock, Unlock, Info, X, Brain, Loader2
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NodeKind = 'start' | 'activity' | 'decision' | 'subprocess' | 'end' | 'datastore' | 'document';
type ProcessCategory = 'Business Operations' | 'HR' | 'Finance' | 'IT' | 'Legal' | 'Compliance';
type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
type ComplianceTag = 'GDPR' | 'CSRD' | 'CRA' | 'NIS2' | 'EU AI Act' | 'ISO 27001' | 'SOC 2';

interface ProcessNode {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  x: number;
  y: number;
  riskLevel: RiskLevel;
  complianceTags: ComplianceTag[];
  controls: string[];
  dataFlows: string[];
  owner: string;
  raciR: string;
  raciA: string;
  raciC: string;
  raciI: string;
}

interface ProcessEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  condition?: string;
}

interface ProcessMap {
  id: string;
  name: string;
  description: string;
  category: ProcessCategory;
  version: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Archived';
  owner: string;
  lastModified: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
}

interface RACIEntry {
  activity: string;
  responsible: string;
  accountable: string;
  consulted: string;
  informed: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NODE_KINDS: { kind: NodeKind; label: string; color: string; icon: React.ReactNode }[] = [
  { kind: 'start', label: 'Start', color: 'bg-green-500', icon: <Play size={14} /> },
  { kind: 'activity', label: 'Activity', color: 'bg-blue-500', icon: <Square size={14} /> },
  { kind: 'decision', label: 'Decision', color: 'bg-amber-500', icon: <Diamond size={14} /> },
  { kind: 'subprocess', label: 'Subprocess', color: 'bg-purple-500', icon: <Layers size={14} /> },
  { kind: 'end', label: 'End', color: 'bg-red-500', icon: <Circle size={14} /> },
  { kind: 'datastore', label: 'Data Store', color: 'bg-cyan-500', icon: <Database size={14} /> },
  { kind: 'document', label: 'Document', color: 'bg-orange-500', icon: <FileText size={14} /> },
];

const CATEGORIES: ProcessCategory[] = ['Business Operations', 'HR', 'Finance', 'IT', 'Legal', 'Compliance'];
const RISK_LEVELS: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low', 'None'];
const COMPLIANCE_TAGS: ComplianceTag[] = ['GDPR', 'CSRD', 'CRA', 'NIS2', 'EU AI Act', 'ISO 27001', 'SOC 2'];

const riskColor = (r: RiskLevel) => {
  switch (r) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Low': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

const nodeShapeCls = (kind: NodeKind) => {
  switch (kind) {
    case 'start': return 'rounded-full bg-green-50 border-green-400';
    case 'end': return 'rounded-full bg-red-50 border-red-400';
    case 'decision': return 'rotate-45 bg-amber-50 border-amber-400';
    case 'subprocess': return 'rounded-lg bg-purple-50 border-purple-400 border-double border-4';
    case 'datastore': return 'rounded-b-lg rounded-t-none bg-cyan-50 border-cyan-400';
    case 'document': return 'rounded-lg bg-orange-50 border-orange-400';
    default: return 'rounded-lg bg-blue-50 border-blue-400';
  }
};

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

const makeDemoProcesses = (): ProcessMap[] => [
  {
    id: 'proc-1',
    name: 'Customer Data Processing',
    description: 'End-to-end flow for collecting, processing, and storing customer personal data across CRM and analytics systems.',
    category: 'Business Operations',
    version: '2.1',
    status: 'Approved',
    owner: 'Jane Smith',
    lastModified: '2026-02-10',
    nodes: [
      { id: 'n1', kind: 'start', label: 'Customer Contact', description: 'Customer initiates contact via web form or phone', x: 60, y: 200, riskLevel: 'Low', complianceTags: ['GDPR'], controls: ['Consent collection'], dataFlows: ['PII Input'], owner: 'Sales Team', raciR: 'Sales Rep', raciA: 'Sales Manager', raciC: 'DPO', raciI: 'Marketing' },
      { id: 'n2', kind: 'activity', label: 'Collect Personal Data', description: 'Gather name, email, phone, address via intake form', x: 240, y: 200, riskLevel: 'High', complianceTags: ['GDPR', 'CSRD'], controls: ['Data minimization', 'Purpose limitation'], dataFlows: ['PII to CRM'], owner: 'Sales Team', raciR: 'Sales Rep', raciA: 'Sales Manager', raciC: 'DPO', raciI: 'IT Security' },
      { id: 'n3', kind: 'decision', label: 'Consent Valid?', description: 'Verify explicit consent has been obtained for data processing purposes', x: 440, y: 200, riskLevel: 'Critical', complianceTags: ['GDPR'], controls: ['Consent verification', 'Age verification'], dataFlows: [], owner: 'Legal', raciR: 'Legal Counsel', raciA: 'DPO', raciC: 'IT', raciI: 'Sales' },
      { id: 'n4', kind: 'activity', label: 'Store in CRM', description: 'Encrypted storage in Salesforce CRM with access controls', x: 640, y: 120, riskLevel: 'Medium', complianceTags: ['GDPR', 'ISO 27001'], controls: ['Encryption at rest', 'Access controls', 'Audit logging'], dataFlows: ['CRM Database'], owner: 'IT', raciR: 'IT Admin', raciA: 'CTO', raciC: 'DPO', raciI: 'Sales' },
      { id: 'n5', kind: 'datastore', label: 'Analytics DB', description: 'Anonymized data warehouse for business intelligence', x: 640, y: 300, riskLevel: 'Medium', complianceTags: ['GDPR', 'CSRD'], controls: ['Pseudonymization', 'Purpose limitation'], dataFlows: ['Anonymized metrics'], owner: 'Data Engineering', raciR: 'Data Engineer', raciA: 'CTO', raciC: 'DPO', raciI: 'Marketing' },
      { id: 'n6', kind: 'document', label: 'Privacy Notice', description: 'Generate and present privacy notice to customer', x: 440, y: 380, riskLevel: 'Low', complianceTags: ['GDPR'], controls: ['Transparency', 'Right to information'], dataFlows: [], owner: 'Legal', raciR: 'Legal Counsel', raciA: 'DPO', raciC: 'Marketing', raciI: 'Sales' },
      { id: 'n7', kind: 'end', label: 'Processing Complete', description: 'Data successfully processed and stored', x: 850, y: 200, riskLevel: 'None', complianceTags: [], controls: [], dataFlows: [], owner: 'System', raciR: 'System', raciA: 'Sales Manager', raciC: '', raciI: 'Audit' },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', label: 'Initiates' },
      { id: 'e2', from: 'n2', to: 'n3', label: 'Validate' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'Yes', condition: 'consent === true' },
      { id: 'e4', from: 'n3', to: 'n6', label: 'No', condition: 'consent === false' },
      { id: 'e5', from: 'n4', to: 'n5', label: 'Sync' },
      { id: 'e6', from: 'n4', to: 'n7', label: 'Complete' },
      { id: 'e7', from: 'n6', to: 'n1', label: 'Re-collect' },
    ],
  },
  {
    id: 'proc-2',
    name: 'Employee Onboarding',
    description: 'HR process for onboarding new hires including background checks, system provisioning, and compliance training.',
    category: 'HR',
    version: '1.4',
    status: 'In Review',
    owner: 'Maria Gonzalez',
    lastModified: '2026-02-14',
    nodes: [
      { id: 'h1', kind: 'start', label: 'Offer Accepted', description: 'Candidate accepts employment offer', x: 60, y: 180, riskLevel: 'Low', complianceTags: ['GDPR'], controls: ['Lawful basis - contract'], dataFlows: ['Candidate PII'], owner: 'HR', raciR: 'HR Specialist', raciA: 'HR Director', raciC: 'Hiring Manager', raciI: 'IT' },
      { id: 'h2', kind: 'activity', label: 'Background Check', description: 'Execute criminal, credit, and reference checks', x: 240, y: 180, riskLevel: 'High', complianceTags: ['GDPR'], controls: ['Purpose limitation', 'Data minimization', 'Third-party DPA'], dataFlows: ['PII to Background Vendor'], owner: 'HR', raciR: 'HR Specialist', raciA: 'HR Director', raciC: 'Legal', raciI: 'Hiring Manager' },
      { id: 'h3', kind: 'decision', label: 'Check Passed?', description: 'Review background check results', x: 440, y: 180, riskLevel: 'Medium', complianceTags: ['GDPR'], controls: ['Fair processing', 'Right to explanation'], dataFlows: [], owner: 'HR', raciR: 'HR Director', raciA: 'VP People', raciC: 'Legal', raciI: 'Hiring Manager' },
      { id: 'h4', kind: 'activity', label: 'Provision Systems', description: 'Create accounts in AD, email, Slack, VPN, development tools', x: 640, y: 100, riskLevel: 'Medium', complianceTags: ['ISO 27001', 'NIS2'], controls: ['Least privilege', 'MFA enrollment', 'Asset management'], dataFlows: ['Identity data to IdP'], owner: 'IT', raciR: 'IT Admin', raciA: 'CTO', raciC: 'HR', raciI: 'Hiring Manager' },
      { id: 'h5', kind: 'activity', label: 'Compliance Training', description: 'Mandatory GDPR, security awareness, code of conduct training', x: 640, y: 260, riskLevel: 'Low', complianceTags: ['GDPR', 'NIS2', 'ISO 27001'], controls: ['Training records', 'Completion tracking'], dataFlows: ['Training completion data'], owner: 'Compliance', raciR: 'Compliance Officer', raciA: 'CISO', raciC: 'HR', raciI: 'Line Manager' },
      { id: 'h6', kind: 'document', label: 'Employment Contract', description: 'DPA clauses, confidentiality, acceptable use policy', x: 440, y: 340, riskLevel: 'Low', complianceTags: ['GDPR'], controls: ['Contractual safeguards'], dataFlows: [], owner: 'Legal', raciR: 'Legal Counsel', raciA: 'Legal Director', raciC: 'HR', raciI: 'Employee' },
      { id: 'h7', kind: 'end', label: 'Onboarding Complete', description: 'Employee fully onboarded and productive', x: 850, y: 180, riskLevel: 'None', complianceTags: [], controls: [], dataFlows: [], owner: 'HR', raciR: 'HR Specialist', raciA: 'HR Director', raciC: '', raciI: 'Audit' },
    ],
    edges: [
      { id: 'he1', from: 'h1', to: 'h2', label: 'Initiate' },
      { id: 'he2', from: 'h2', to: 'h3', label: 'Results' },
      { id: 'he3', from: 'h3', to: 'h4', label: 'Passed' },
      { id: 'he4', from: 'h3', to: 'h6', label: 'Failed' },
      { id: 'he5', from: 'h4', to: 'h5', label: 'Training' },
      { id: 'he6', from: 'h5', to: 'h7', label: 'Complete' },
      { id: 'he7', from: 'h6', to: 'h1', label: 'Restart' },
    ],
  },
  {
    id: 'proc-3',
    name: 'Incident Response',
    description: 'Security and data breach incident handling from detection through containment, eradication, recovery, and post-incident review.',
    category: 'IT',
    version: '3.0',
    status: 'Approved',
    owner: 'David Kim',
    lastModified: '2026-01-28',
    nodes: [
      { id: 'i1', kind: 'start', label: 'Incident Detected', description: 'Automated alert or manual report of security incident', x: 60, y: 200, riskLevel: 'High', complianceTags: ['NIS2', 'ISO 27001'], controls: ['SIEM monitoring', 'IDS/IPS alerts'], dataFlows: ['Alert data'], owner: 'SOC', raciR: 'SOC Analyst', raciA: 'CISO', raciC: 'IT Ops', raciI: 'Management' },
      { id: 'i2', kind: 'activity', label: 'Triage & Classify', description: 'Assess severity, scope, and classify incident type', x: 240, y: 200, riskLevel: 'High', complianceTags: ['NIS2', 'ISO 27001'], controls: ['Incident classification matrix', 'Severity scoring'], dataFlows: ['Classification data'], owner: 'SOC', raciR: 'SOC Lead', raciA: 'CISO', raciC: 'Legal', raciI: 'DPO' },
      { id: 'i3', kind: 'decision', label: 'Data Breach?', description: 'Determine if personal data is affected', x: 440, y: 200, riskLevel: 'Critical', complianceTags: ['GDPR', 'NIS2'], controls: ['Breach assessment criteria', 'DPA notification threshold'], dataFlows: [], owner: 'DPO', raciR: 'DPO', raciA: 'CEO', raciC: 'Legal', raciI: 'Board' },
      { id: 'i4', kind: 'activity', label: 'Contain & Eradicate', description: 'Isolate affected systems, remove threat, patch vulnerabilities', x: 640, y: 120, riskLevel: 'High', complianceTags: ['NIS2', 'ISO 27001', 'CRA'], controls: ['Containment playbook', 'Forensic preservation'], dataFlows: ['Forensic evidence'], owner: 'IT Security', raciR: 'Security Engineer', raciA: 'CISO', raciC: 'IT Ops', raciI: 'Management' },
      { id: 'i5', kind: 'activity', label: 'Notify DPA (72h)', description: 'GDPR Article 33 notification to supervisory authority within 72 hours', x: 640, y: 300, riskLevel: 'Critical', complianceTags: ['GDPR', 'NIS2'], controls: ['72-hour notification SLA', 'DPA notification template'], dataFlows: ['Breach notification'], owner: 'DPO', raciR: 'DPO', raciA: 'CEO', raciC: 'Legal', raciI: 'Board' },
      { id: 'i6', kind: 'activity', label: 'Recovery & Review', description: 'Restore services, conduct post-incident review, update playbooks', x: 850, y: 200, riskLevel: 'Medium', complianceTags: ['NIS2', 'ISO 27001'], controls: ['Recovery procedures', 'Lessons learned'], dataFlows: ['Incident report'], owner: 'IT Security', raciR: 'CISO', raciA: 'CTO', raciC: 'All Stakeholders', raciI: 'Board' },
      { id: 'i7', kind: 'end', label: 'Incident Closed', description: 'Incident fully resolved and documented', x: 1050, y: 200, riskLevel: 'None', complianceTags: [], controls: [], dataFlows: [], owner: 'CISO', raciR: 'CISO', raciA: 'CTO', raciC: '', raciI: 'Audit' },
    ],
    edges: [
      { id: 'ie1', from: 'i1', to: 'i2', label: 'Triage' },
      { id: 'ie2', from: 'i2', to: 'i3', label: 'Classify' },
      { id: 'ie3', from: 'i3', to: 'i4', label: 'No - Contain' },
      { id: 'ie4', from: 'i3', to: 'i5', label: 'Yes - Notify' },
      { id: 'ie5', from: 'i4', to: 'i6', label: 'Recover' },
      { id: 'ie6', from: 'i5', to: 'i4', label: 'Then Contain' },
      { id: 'ie7', from: 'i6', to: 'i7', label: 'Close' },
    ],
  },
  {
    id: 'proc-4',
    name: 'Vendor Due Diligence',
    description: 'Third-party risk assessment and vendor onboarding including DPA execution, security questionnaire, and ongoing monitoring.',
    category: 'Compliance',
    version: '1.2',
    status: 'Draft',
    owner: 'Sarah Chen',
    lastModified: '2026-02-16',
    nodes: [
      { id: 'v1', kind: 'start', label: 'Vendor Requested', description: 'Business unit requests new vendor engagement', x: 60, y: 200, riskLevel: 'Low', complianceTags: [], controls: ['Vendor request form'], dataFlows: [], owner: 'Business Unit', raciR: 'Requestor', raciA: 'Department Head', raciC: 'Procurement', raciI: 'Compliance' },
      { id: 'v2', kind: 'activity', label: 'Risk Assessment', description: 'Evaluate vendor risk profile including data handling, security posture, and compliance certifications', x: 260, y: 200, riskLevel: 'High', complianceTags: ['GDPR', 'NIS2', 'ISO 27001'], controls: ['Vendor risk scoring', 'Security questionnaire'], dataFlows: ['Vendor info'], owner: 'Compliance', raciR: 'Compliance Analyst', raciA: 'CISO', raciC: 'Legal', raciI: 'Procurement' },
      { id: 'v3', kind: 'decision', label: 'Acceptable Risk?', description: 'Does the vendor meet minimum risk threshold?', x: 480, y: 200, riskLevel: 'High', complianceTags: ['GDPR'], controls: ['Risk acceptance criteria'], dataFlows: [], owner: 'CISO', raciR: 'CISO', raciA: 'CRO', raciC: 'Legal', raciI: 'Business Unit' },
      { id: 'v4', kind: 'document', label: 'Execute DPA', description: 'Data Processing Agreement per GDPR Article 28', x: 680, y: 120, riskLevel: 'Medium', complianceTags: ['GDPR'], controls: ['Standard contractual clauses', 'Sub-processor provisions'], dataFlows: ['Contract data'], owner: 'Legal', raciR: 'Legal Counsel', raciA: 'DPO', raciC: 'Procurement', raciI: 'Business Unit' },
      { id: 'v5', kind: 'end', label: 'Vendor Rejected', description: 'Vendor does not meet risk requirements', x: 680, y: 320, riskLevel: 'None', complianceTags: [], controls: [], dataFlows: [], owner: 'Compliance', raciR: 'Compliance Analyst', raciA: 'CISO', raciC: '', raciI: 'Business Unit' },
      { id: 'v6', kind: 'end', label: 'Vendor Approved', description: 'Vendor onboarded with monitoring schedule', x: 880, y: 120, riskLevel: 'None', complianceTags: [], controls: ['Periodic review schedule'], dataFlows: [], owner: 'Procurement', raciR: 'Procurement Lead', raciA: 'CFO', raciC: 'Compliance', raciI: 'Audit' },
    ],
    edges: [
      { id: 've1', from: 'v1', to: 'v2', label: 'Assess' },
      { id: 've2', from: 'v2', to: 'v3', label: 'Score' },
      { id: 've3', from: 'v3', to: 'v4', label: 'Yes' },
      { id: 've4', from: 'v3', to: 'v5', label: 'No' },
      { id: 've5', from: 'v4', to: 'v6', label: 'Onboard' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: unique ID                                                  */
/* ------------------------------------------------------------------ */
let _uid = 1000;
const uid = (prefix = 'id') => `${prefix}-${++_uid}`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ProcessMapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useI18n();
  /* ---- state ---- */
  const [processes, setProcesses] = useState<ProcessMap[]>(makeDemoProcesses);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'raci' | 'gaps' | 'export'>('canvas');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProcessCategory | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [addingNodeKind, setAddingNodeKind] = useState<NodeKind | null>(null);
  const [showEdgeCreator, setShowEdgeCreator] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<string>('');
  const [edgeTo, setEdgeTo] = useState<string>('');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [newProcess, setNewProcess] = useState({ name: '', description: '', category: 'Business Operations' as ProcessCategory, owner: '' });
  const [showComplianceLayer, setShowComplianceLayer] = useState(true);
  const [showRiskLayer, setShowRiskLayer] = useState(true);

  /* ---- derived ---- */
  const selectedProcess = useMemo(() => processes.find(p => p.id === selectedProcessId) ?? null, [processes, selectedProcessId]);
  const selectedNode = useMemo(() => selectedProcess?.nodes.find(n => n.id === selectedNodeId) ?? null, [selectedProcess, selectedNodeId]);

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
      if (filterCategory !== 'All' && p.category !== filterCategory) return false;
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [processes, search, filterCategory, filterStatus]);

  /* ---- RACI matrix ---- */
  const raciMatrix = useMemo<RACIEntry[]>(() => {
    if (!selectedProcess) return [];
    return selectedProcess.nodes
      .filter(n => n.kind !== 'start' && n.kind !== 'end')
      .map(n => ({
        activity: n.label,
        responsible: n.raciR,
        accountable: n.raciA,
        consulted: n.raciC,
        informed: n.raciI,
      }));
  }, [selectedProcess]);

  /* ---- gap analysis ---- */
  const gaps = useMemo(() => {
    if (!selectedProcess) return [];
    const items: { nodeLabel: string; issue: string; severity: RiskLevel; recommendation: string }[] = [];
    selectedProcess.nodes.forEach(n => {
      if (n.kind === 'activity' && n.controls.length === 0) items.push({ nodeLabel: n.label, issue: 'No compliance controls mapped', severity: 'High', recommendation: 'Map at least one compliance control to this activity.' });
      if (n.kind === 'activity' && n.complianceTags.length === 0) items.push({ nodeLabel: n.label, issue: 'No compliance framework tagged', severity: 'Medium', recommendation: 'Tag relevant compliance frameworks (GDPR, CSRD, etc.).' });
      if (n.kind === 'activity' && !n.owner) items.push({ nodeLabel: n.label, issue: 'No process owner assigned', severity: 'High', recommendation: 'Assign a process owner for accountability.' });
      if (n.kind === 'datastore' && !n.complianceTags.includes('GDPR')) items.push({ nodeLabel: n.label, issue: 'Data store not tagged for GDPR', severity: 'Critical', recommendation: 'Evaluate if this data store contains personal data and tag accordingly.' });
      if (n.kind === 'decision' && n.riskLevel === 'Critical' && n.controls.length < 2) items.push({ nodeLabel: n.label, issue: 'Critical decision with insufficient controls', severity: 'High', recommendation: 'Add additional controls to this critical decision point.' });
      if ((n.raciR === '' || n.raciA === '') && n.kind !== 'start' && n.kind !== 'end') items.push({ nodeLabel: n.label, issue: 'RACI matrix incomplete', severity: 'Medium', recommendation: 'Ensure Responsible and Accountable roles are assigned.' });
    });
    const connectedNodes = new Set<string>();
    selectedProcess.edges.forEach(e => { connectedNodes.add(e.from); connectedNodes.add(e.to); });
    selectedProcess.nodes.forEach(n => {
      if (!connectedNodes.has(n.id) && selectedProcess.nodes.length > 1) items.push({ nodeLabel: n.label, issue: 'Orphan node - not connected to any edge', severity: 'High', recommendation: 'Connect this node to the process flow.' });
    });
    return items;
  }, [selectedProcess]);

  /* ---- callbacks ---- */
  const updateProcess = useCallback((updater: (p: ProcessMap) => ProcessMap) => {
    setProcesses(prev => prev.map(p => p.id === selectedProcessId ? updater(p) : p));
  }, [selectedProcessId]);

  const updateNode = useCallback((nodeId: string, updater: (n: ProcessNode) => ProcessNode) => {
    updateProcess(p => ({ ...p, nodes: p.nodes.map(n => n.id === nodeId ? updater(n) : n), lastModified: new Date().toISOString().split('T')[0] }));
  }, [updateProcess]);

  const addNode = useCallback((kind: NodeKind) => {
    const id = uid('node');
    const maxX = selectedProcess ? Math.max(0, ...selectedProcess.nodes.map(n => n.x)) : 0;
    const newNode: ProcessNode = {
      id, kind, label: NODE_KINDS.find(k => k.kind === kind)?.label ?? 'Node',
      description: '', x: maxX + 180, y: 200,
      riskLevel: 'None', complianceTags: [], controls: [], dataFlows: [],
      owner: '', raciR: '', raciA: '', raciC: '', raciI: '',
    };
    updateProcess(p => ({ ...p, nodes: [...p.nodes, newNode], lastModified: new Date().toISOString().split('T')[0] }));
    setSelectedNodeId(id);
    setShowNodeEditor(true);
    setAddingNodeKind(null);
  }, [selectedProcess, updateProcess]);

  const deleteNode = useCallback((nodeId: string) => {
    updateProcess(p => ({
      ...p,
      nodes: p.nodes.filter(n => n.id !== nodeId),
      edges: p.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
      lastModified: new Date().toISOString().split('T')[0],
    }));
    if (selectedNodeId === nodeId) { setSelectedNodeId(null); setShowNodeEditor(false); }
  }, [selectedNodeId, updateProcess]);

  const addEdge = useCallback(() => {
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) return;
    const id = uid('edge');
    updateProcess(p => ({ ...p, edges: [...p.edges, { id, from: edgeFrom, to: edgeTo, label: edgeLabel || '' }], lastModified: new Date().toISOString().split('T')[0] }));
    setEdgeFrom(''); setEdgeTo(''); setEdgeLabel(''); setShowEdgeCreator(false);
  }, [edgeFrom, edgeTo, edgeLabel, updateProcess]);

  const deleteEdge = useCallback((edgeId: string) => {
    updateProcess(p => ({ ...p, edges: p.edges.filter(e => e.id !== edgeId), lastModified: new Date().toISOString().split('T')[0] }));
  }, [updateProcess]);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load process maps from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api.modules.processMaps.list();
        if (data && data.length > 0) {
          setProcesses(data.map((m: any) => ({
            id: m.id,
            name: m.name,
            description: m.description || '',
            category: m.category || 'Business Operations',
            version: String(m.version || '1.0'),
            status: m.status === 'draft' ? 'Draft' : m.status === 'approved' ? 'Approved' : m.status === 'archived' ? 'Archived' : 'In Review',
            owner: '',
            lastModified: m.updatedAt ? new Date(m.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            nodes: (m.nodes || []) as ProcessNode[],
            edges: (m.edges || []) as ProcessEdge[],
          })));
        }
        setLoadError(null);
      } catch {
        setLoadError('Unable to connect to server. Showing demo data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Save process map to backend
  const saveToBackend = useCallback(async (proc: ProcessMap) => {
    setIsSaving(true);
    try {
      const payload = {
        name: proc.name,
        description: proc.description,
        category: proc.category.toLowerCase().replace(/\s+/g, '_'),
        status: proc.status.toLowerCase().replace(/\s+/g, '_'),
        nodes: proc.nodes,
        edges: proc.edges,
        raciMatrix: proc.nodes.filter(n => n.kind !== 'start' && n.kind !== 'end').map(n => ({
          activity: n.label, responsible: n.raciR, accountable: n.raciA, consulted: n.raciC, informed: n.raciI,
        })),
      };
      // Check if this is a backend-generated ID (UUID) or local ID
      if (proc.id.startsWith('proc-')) {
        await api.modules.processMaps.create(payload);
      } else {
        await api.modules.processMaps.update(proc.id, payload);
      }
    } catch {
      // Silently fail — data is still in local state
    } finally {
      setIsSaving(false);
    }
  }, []);

  const addNewProcess = useCallback(() => {
    if (!newProcess.name.trim()) return;
    const id = uid('proc');
    const proc: ProcessMap = {
      id, name: newProcess.name, description: newProcess.description,
      category: newProcess.category, version: '1.0', status: 'Draft',
      owner: newProcess.owner, lastModified: new Date().toISOString().split('T')[0],
      nodes: [], edges: [],
    };
    setProcesses(prev => [...prev, proc]);
    setSelectedProcessId(id);
    setShowAddProcess(false);
    setNewProcess({ name: '', description: '', category: 'Business Operations', owner: '' });
  }, [newProcess]);

  const removeProcess = useCallback(async (id: string) => {
    const isLocalOnly = id.startsWith('proc-');
    setProcesses(prev => prev.filter(p => p.id !== id));
    if (selectedProcessId === id) setSelectedProcessId(null);
    if (isLocalOnly) return;
    try {
      await api.modules.processMaps.delete(id);
    } catch (err) {
      setLoadError('Failed to delete process map on the server. It will reappear on reload.');
    }
  }, [selectedProcessId]);

  const aiGenerateProcess = useCallback(async () => {
    if (!newProcess.name.trim() && !newProcess.description.trim()) return;
    setIsAiGenerating(true);
    setAiError(null);

    try {
      const result = await api.ai.analyzeProcess(
        `${newProcess.name}: ${newProcess.description}`,
        newProcess.category,
        ['GDPR', 'SOC 2', 'ISO 27001']
      );

      const id = uid('proc');
      const proc: ProcessMap = {
        id,
        name: newProcess.name || 'AI Generated Process',
        description: newProcess.description || result.summary || '',
        category: newProcess.category,
        version: '1.0',
        status: 'Draft',
        owner: newProcess.owner || 'AI Generated',
        lastModified: new Date().toISOString().split('T')[0],
        nodes: (result.nodes || []).map((n: any) => ({
          id: n.id || uid('node'),
          kind: n.kind || 'activity',
          label: n.label || '',
          description: n.description || '',
          x: n.x || 100,
          y: n.y || 200,
          riskLevel: n.riskLevel || 'none',
          complianceTags: n.complianceTags || [],
          controls: n.controls || [],
          dataFlows: [],
          owner: n.owner || '',
        })),
        edges: (result.edges || []).map((e: any) => ({
          id: e.id || uid('edge'),
          from: e.from,
          to: e.to,
          label: e.label || '',
          condition: e.condition,
        })),
      };

      setProcesses(prev => [...prev, proc]);
      setSelectedProcessId(id);
      setShowAddProcess(false);
      setNewProcess({ name: '', description: '', category: 'Business Operations', owner: '' });
    } catch (error: any) {
      console.error('AI process generation error:', error);
      setAiError(error?.message || 'Failed to generate process with AI. Try creating manually.');
    } finally {
      setIsAiGenerating(false);
    }
  }, [newProcess]);

  const exportJSON = useCallback(() => {
    if (!selectedProcess) return;
    const blob = new Blob([JSON.stringify(selectedProcess, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedProcess.name.replace(/\s+/g, '_')}_process_map.json`; a.click();
    URL.revokeObjectURL(url);
  }, [selectedProcess]);

  // BPMN 2.0 XML Export
  const exportBPMN = useCallback(() => {
    if (!selectedProcess) return;
    const ns = 'http://www.omg.org/spec/BPMN/20100524/MODEL';
    const diNs = 'http://www.omg.org/spec/BPMN/20100524/DI';
    const dcNs = 'http://www.omg.org/spec/DD/20100524/DC';
    const processId = `Process_${selectedProcess.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const bpmnNodeType = (kind: NodeKind) => {
      switch (kind) {
        case 'start': return 'startEvent';
        case 'end': return 'endEvent';
        case 'decision': return 'exclusiveGateway';
        case 'subprocess': return 'subProcess';
        case 'datastore': return 'dataStoreReference';
        case 'document': return 'dataObjectReference';
        default: return 'task';
      }
    };

    const nodeElements = selectedProcess.nodes.map(n => {
      const tag = bpmnNodeType(n.kind);
      const nodeId = `Node_${n.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const docStr = n.description ? `\n        <bpmn:documentation>${n.description.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</bpmn:documentation>` : '';
      return `      <bpmn:${tag} id="${nodeId}" name="${n.label.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${docStr}\n      </bpmn:${tag}>`;
    }).join('\n');

    const flowElements = selectedProcess.edges.map(e => {
      const flowId = `Flow_${e.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const sourceId = `Node_${e.from.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const targetId = `Node_${e.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const nameAttr = e.label ? ` name="${e.label.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"` : '';
      return `      <bpmn:sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}"${nameAttr} />`;
    }).join('\n');

    const shapes = selectedProcess.nodes.map(n => {
      const nodeId = `Node_${n.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const w = n.kind === 'start' || n.kind === 'end' ? 36 : n.kind === 'decision' ? 50 : 100;
      const h = n.kind === 'start' || n.kind === 'end' ? 36 : n.kind === 'decision' ? 50 : 80;
      return `        <bpmndi:BPMNShape id="${nodeId}_di" bpmnElement="${nodeId}">\n          <dc:Bounds x="${n.x}" y="${n.y}" width="${w}" height="${h}" />\n        </bpmndi:BPMNShape>`;
    }).join('\n');

    const edgesDi = selectedProcess.edges.map(e => {
      const flowId = `Flow_${e.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const src = selectedProcess.nodes.find(n => n.id === e.from);
      const tgt = selectedProcess.nodes.find(n => n.id === e.to);
      if (!src || !tgt) return '';
      return `        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">\n          <di:waypoint x="${src.x + 50}" y="${src.y + 40}" />\n          <di:waypoint x="${tgt.x}" y="${tgt.y + 40}" />\n        </bpmndi:BPMNEdge>`;
    }).filter(Boolean).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="${ns}" xmlns:bpmndi="${diNs}" xmlns:dc="${dcNs}" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://complyeasy.ai/bpmn">
    <bpmn:process id="${processId}" name="${selectedProcess.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" isExecutable="false">
${nodeElements}
${flowElements}
    </bpmn:process>
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
      <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
${shapes}
${edgesDi}
      </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedProcess.name.replace(/\s+/g, '_')}.bpmn`; a.click();
    URL.revokeObjectURL(url);
  }, [selectedProcess]);

  // Save current process to backend
  const handleSaveProcess = useCallback(async () => {
    if (!selectedProcess) return;
    await saveToBackend(selectedProcess);
  }, [selectedProcess, saveToBackend]);

  /* ---- status badge ---- */
  const statusBadge = (s: string) => {
    const m: Record<string, string> = { Draft: 'bg-gray-100 text-gray-700', 'In Review': 'bg-blue-100 text-blue-700', Approved: 'bg-green-100 text-green-700', Archived: 'bg-yellow-100 text-yellow-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>;
  };

  /* ================================================================ */
  /*  RENDER — Process list (no process selected)                      */
  /* ================================================================ */
  if (!selectedProcess) {
    return (
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Business Process Mapper</h2>
              <p className="text-sm text-gray-500">Map, visualize, and annotate compliance-relevant business processes (BPMN-style)</p>
            </div>
          </div>
          <button onClick={() => setShowAddProcess(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
            <Plus size={16} /> New Process
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">Loading process maps...</span>
          </div>
        )}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">{loadError}</span>
            <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search processes..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="All">All Statuses</option>
            {['Draft', 'In Review', 'Approved', 'Archived'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Processes', value: processes.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Workflow size={20} /> },
            { label: 'Approved', value: processes.filter(p => p.status === 'Approved').length, color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle size={20} /> },
            { label: 'In Review', value: processes.filter(p => p.status === 'In Review').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Eye size={20} /> },
            { label: 'Gaps Found', value: processes.reduce((acc, p) => {
              const nodeGaps = p.nodes.filter(n => n.kind === 'activity' && n.controls.length === 0).length;
              return acc + nodeGaps;
            }, 0), color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle size={20} /> },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${s.bg} ${s.color}`}>{s.icon}</div>
              <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Process cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProcesses.map(p => (
            <div key={p.id} onClick={() => setSelectedProcessId(p.id)} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer relative group">
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(`Delete process map "${p.name}"? This cannot be undone.`)) {
                    void removeProcess(p.id);
                  }
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white border border-gray-200 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
                title="Delete process map"
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 size={14} />
              </button>
              <div className="flex justify-between items-start mb-2 pr-8">
                <h3 className="font-semibold text-gray-900 text-lg">{p.name}</h3>
                {statusBadge(p.status)}
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{p.category}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">v{p.version}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{p.nodes.length} nodes</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{p.edges.length} edges</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Owner: {p.owner}</span>
                <span>Modified: {p.lastModified}</span>
              </div>
              {/* Mini risk summary */}
              <div className="mt-3 flex gap-1">
                {p.nodes.filter(n => n.riskLevel === 'Critical').length > 0 && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">{p.nodes.filter(n => n.riskLevel === 'Critical').length} Critical</span>}
                {p.nodes.filter(n => n.riskLevel === 'High').length > 0 && <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">{p.nodes.filter(n => n.riskLevel === 'High').length} High</span>}
                {p.nodes.filter(n => n.riskLevel === 'Medium').length > 0 && <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">{p.nodes.filter(n => n.riskLevel === 'Medium').length} Medium</span>}
              </div>
            </div>
          ))}
        </div>

        {filteredProcesses.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Workflow size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No processes match your filters</p>
            <p className="text-sm">Try adjusting your search or category filter.</p>
          </div>
        )}

        {/* Add Process Modal */}
        {showAddProcess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Create New Process Map</h3>
                <button onClick={() => setShowAddProcess(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Process Name *</label>
                <input value={newProcess.name} onChange={e => setNewProcess(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., Customer Complaint Handling" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newProcess.description} onChange={e => setNewProcess(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Describe the business process..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={newProcess.category} onChange={e => setNewProcess(p => ({ ...p, category: e.target.value as ProcessCategory }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Process Owner</label>
                  <input value={newProcess.owner} onChange={e => setNewProcess(p => ({ ...p, owner: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Name" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddProcess(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
                <button onClick={addNewProcess} disabled={!newProcess.name.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Create Process</button>
                <button onClick={aiGenerateProcess} disabled={!newProcess.name.trim() || isAiGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                  {isAiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                  {isAiGenerating ? 'Generating...' : 'AI Generate'}
                </button>
                {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER — Process detail view                                     */
  /* ================================================================ */
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => { setSelectedProcessId(null); setSelectedNodeId(null); setShowNodeEditor(false); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProcess.name}</h2>
              {statusBadge(selectedProcess.status)}
              <span className="text-xs text-gray-400">v{selectedProcess.version}</span>
            </div>
            <p className="text-sm text-gray-500">{selectedProcess.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSaveProcess} disabled={isSaving} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={exportJSON} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"><Download size={14} /> JSON</button>
          <button onClick={exportBPMN} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"><Download size={14} /> BPMN</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'canvas', label: 'Process Canvas', icon: <GitBranch size={14} /> },
          { key: 'raci', label: 'RACI Matrix', icon: <Users size={14} /> },
          { key: 'gaps', label: `Gap Analysis${gaps.length > 0 ? ` (${gaps.length})` : ''}`, icon: <AlertTriangle size={14} /> },
          { key: 'export', label: 'Details & Edges', icon: <Settings size={14} /> },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ---- CANVAS TAB ---- */}
      {activeTab === 'canvas' && (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Toolbar */}
          <div className="w-48 shrink-0 bg-white rounded-xl border border-gray-200 p-3 space-y-3 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Node</p>
            {NODE_KINDS.map(nk => (
              <button key={nk.kind} onClick={() => addNode(nk.kind)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                <span className={`flex items-center justify-center w-6 h-6 rounded ${nk.color} text-white`}>{nk.icon}</span>
                {nk.label}
              </button>
            ))}
            <hr className="my-2" />
            <button onClick={() => setShowEdgeCreator(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
              <ArrowRight size={16} className="text-gray-500" /> Add Edge
            </button>
            <hr className="my-2" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Layers</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showComplianceLayer} onChange={e => setShowComplianceLayer(e.target.checked)} className="rounded" />
              <Shield size={14} className="text-blue-500" /> Compliance
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showRiskLayer} onChange={e => setShowRiskLayer(e.target.checked)} className="rounded" />
              <AlertTriangle size={14} className="text-orange-500" /> Risk
            </label>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-auto relative" style={{ minHeight: 500 }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {selectedProcess.edges.map(edge => {
                const fromNode = selectedProcess.nodes.find(n => n.id === edge.from);
                const toNode = selectedProcess.nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + 70; const y1 = fromNode.y + 30;
                const x2 = toNode.x + 70; const y2 = toNode.y + 30;
                const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
                return (
                  <g key={edge.id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arrow)" />
                    {edge.label && (
                      <text x={mx} y={my - 6} textAnchor="middle" className="text-xs fill-gray-500 font-medium" fontSize={11}>{edge.label}</text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="relative" style={{ zIndex: 2, minWidth: 1200, minHeight: 500 }}>
              {selectedProcess.nodes.map(node => (
                <div
                  key={node.id}
                  onClick={() => { setSelectedNodeId(node.id); setShowNodeEditor(true); }}
                  className={`absolute cursor-pointer group border-2 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg ${nodeShapeCls(node.kind)} ${selectedNodeId === node.id ? 'ring-2 ring-brand-500 shadow-md' : ''}`}
                  style={{ left: node.x, top: node.y, width: 140, height: 60, zIndex: selectedNodeId === node.id ? 10 : 2 }}
                >
                  <span className={`text-xs font-semibold ${node.kind === 'decision' ? '-rotate-45' : ''}`}>{node.label}</span>
                  {/* Risk badge */}
                  {showRiskLayer && node.riskLevel !== 'None' && (
                    <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${riskColor(node.riskLevel)}`}>
                      {node.riskLevel[0]}
                    </span>
                  )}
                  {/* Compliance tags */}
                  {showComplianceLayer && node.complianceTags.length > 0 && (
                    <div className={`absolute -bottom-5 left-0 flex gap-0.5 ${node.kind === 'decision' ? '-rotate-45' : ''}`}>
                      {node.complianceTags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1 py-0 rounded bg-blue-100 text-blue-700 text-[8px] font-medium">{tag}</span>
                      ))}
                      {node.complianceTags.length > 3 && <span className="text-[8px] text-gray-400">+{node.complianceTags.length - 3}</span>}
                    </div>
                  )}
                  {/* Delete on hover */}
                  <button onClick={e => { e.stopPropagation(); deleteNode(node.id); }} className="absolute -top-2 -left-2 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs"><X size={10} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Node Editor Panel */}
          {showNodeEditor && selectedNode && (
            <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 p-4 space-y-3 overflow-y-auto max-h-[700px]">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 text-sm">Edit Node</h4>
                <button onClick={() => setShowNodeEditor(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
              </div>
              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <input value={selectedNode.label} onChange={e => updateNode(selectedNode.id, n => ({ ...n, label: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={selectedNode.description} onChange={e => updateNode(selectedNode.id, n => ({ ...n, description: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              {/* Risk Level */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Risk Level</label>
                <select value={selectedNode.riskLevel} onChange={e => updateNode(selectedNode.id, n => ({ ...n, riskLevel: e.target.value as RiskLevel }))} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* Compliance Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Compliance Tags</label>
                <div className="flex flex-wrap gap-1">
                  {COMPLIANCE_TAGS.map(tag => (
                    <button key={tag} onClick={() => updateNode(selectedNode.id, n => ({ ...n, complianceTags: n.complianceTags.includes(tag) ? n.complianceTags.filter(ct => ct !== tag) : [...n.complianceTags, tag] }))}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${selectedNode.complianceTags.includes(tag) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              {/* Controls */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Controls (comma-separated)</label>
                <input value={selectedNode.controls.join(', ')} onChange={e => updateNode(selectedNode.id, n => ({ ...n, controls: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., Encryption, Access Control" />
              </div>
              {/* Data Flows */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Flows (comma-separated)</label>
                <input value={selectedNode.dataFlows.join(', ')} onChange={e => updateNode(selectedNode.id, n => ({ ...n, dataFlows: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., PII to CRM, Logs to SIEM" />
              </div>
              {/* Owner */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Owner</label>
                <input value={selectedNode.owner} onChange={e => updateNode(selectedNode.id, n => ({ ...n, owner: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              {/* RACI */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RACI</label>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-gray-400">Responsible</label><input value={selectedNode.raciR} onChange={e => updateNode(selectedNode.id, n => ({ ...n, raciR: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="text-[10px] text-gray-400">Accountable</label><input value={selectedNode.raciA} onChange={e => updateNode(selectedNode.id, n => ({ ...n, raciA: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="text-[10px] text-gray-400">Consulted</label><input value={selectedNode.raciC} onChange={e => updateNode(selectedNode.id, n => ({ ...n, raciC: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="text-[10px] text-gray-400">Informed</label><input value={selectedNode.raciI} onChange={e => updateNode(selectedNode.id, n => ({ ...n, raciI: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></div>
                </div>
              </div>
              {/* Position */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-gray-400">X</label><input type="number" value={selectedNode.x} onChange={e => updateNode(selectedNode.id, n => ({ ...n, x: +e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="text-[10px] text-gray-400">Y</label><input type="number" value={selectedNode.y} onChange={e => updateNode(selectedNode.id, n => ({ ...n, y: +e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></div>
                </div>
              </div>
              <button onClick={() => deleteNode(selectedNode.id)} className="w-full flex items-center justify-center gap-1 text-sm text-red-600 hover:bg-red-50 rounded-lg py-2 transition-colors"><Trash2 size={14} /> Delete Node</button>
            </div>
          )}
        </div>
      )}

      {/* ---- RACI TAB ---- */}
      {activeTab === 'raci' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Activity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700"><span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-blue-500 text-white text-xs flex items-center justify-center font-bold">R</span> Responsible</span></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700"><span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-red-500 text-white text-xs flex items-center justify-center font-bold">A</span> Accountable</span></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700"><span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-amber-500 text-white text-xs flex items-center justify-center font-bold">C</span> Consulted</span></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700"><span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-green-500 text-white text-xs flex items-center justify-center font-bold">I</span> Informed</span></th>
              </tr>
            </thead>
            <tbody>
              {raciMatrix.map((entry, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{entry.activity}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.responsible || <span className="text-gray-300 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.accountable || <span className="text-gray-300 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.consulted || <span className="text-gray-300 italic">-</span>}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.informed || <span className="text-gray-300 italic">-</span>}</td>
                </tr>
              ))}
              {raciMatrix.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No activities in this process yet. Add nodes on the Canvas tab.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- GAP ANALYSIS TAB ---- */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {gaps.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-semibold text-gray-900">No Gaps Detected</p>
              <p className="text-sm text-gray-500 mt-1">All process nodes have adequate compliance mappings and ownership.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Gap Summary</h3>
                  <span className="ml-auto text-sm text-gray-500">{gaps.length} gap{gaps.length !== 1 ? 's' : ''} found</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {(['Critical', 'High', 'Medium', 'Low'] as RiskLevel[]).map(level => {
                    const count = gaps.filter(g => g.severity === level).length;
                    return (
                      <div key={level} className={`rounded-lg border px-3 py-2 text-center ${riskColor(level)}`}>
                        <p className="text-xl font-bold">{count}</p>
                        <p className="text-xs">{level}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              {gaps.map((gap, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{gap.nodeLabel}</p>
                      <p className="text-sm text-gray-600">{gap.issue}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${riskColor(gap.severity)}`}>{gap.severity}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Recommendation</p>
                    <p className="text-sm text-gray-700">{gap.recommendation}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ---- DETAILS & EDGES TAB ---- */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          {/* Process metadata */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Process Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs">Category</p><p className="font-medium">{selectedProcess.category}</p></div>
              <div><p className="text-gray-500 text-xs">Owner</p><p className="font-medium">{selectedProcess.owner}</p></div>
              <div><p className="text-gray-500 text-xs">Version</p><p className="font-medium">{selectedProcess.version}</p></div>
              <div><p className="text-gray-500 text-xs">Last Modified</p><p className="font-medium">{selectedProcess.lastModified}</p></div>
              <div><p className="text-gray-500 text-xs">Status</p>{statusBadge(selectedProcess.status)}</div>
              <div><p className="text-gray-500 text-xs">Total Nodes</p><p className="font-medium">{selectedProcess.nodes.length}</p></div>
              <div><p className="text-gray-500 text-xs">Total Edges</p><p className="font-medium">{selectedProcess.edges.length}</p></div>
              <div><p className="text-gray-500 text-xs">Compliance Frameworks</p><p className="font-medium">{[...new Set(selectedProcess.nodes.flatMap(n => n.complianceTags))].join(', ') || 'None'}</p></div>
            </div>
          </div>
          {/* Edges table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Edges / Connections</h3>
              <button onClick={() => setShowEdgeCreator(true)} className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"><Plus size={14} /> Add Edge</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">From</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">To</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Label</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedProcess.edges.map(edge => {
                  const fromNode = selectedProcess.nodes.find(n => n.id === edge.from);
                  const toNode = selectedProcess.nodes.find(n => n.id === edge.to);
                  return (
                    <tr key={edge.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{fromNode?.label ?? edge.from}</td>
                      <td className="px-4 py-2 text-gray-900">{toNode?.label ?? edge.to}</td>
                      <td className="px-4 py-2 text-gray-600">{edge.label || '-'}</td>
                      <td className="px-4 py-2 text-right"><button onClick={() => deleteEdge(edge.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button></td>
                    </tr>
                  );
                })}
                {selectedProcess.edges.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No edges defined. Connect your nodes by adding edges.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Nodes summary table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
            <div className="p-4 border-b"><h3 className="font-semibold text-gray-900">All Nodes</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Label</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Risk</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Compliance</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Controls</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Owner</th>
                </tr>
              </thead>
              <tbody>
                {selectedProcess.nodes.map(n => (
                  <tr key={n.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveTab('canvas'); setSelectedNodeId(n.id); setShowNodeEditor(true); }}>
                    <td className="px-4 py-2 font-medium text-gray-900">{n.label}</td>
                    <td className="px-4 py-2 capitalize text-gray-600">{n.kind}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskColor(n.riskLevel)}`}>{n.riskLevel}</span></td>
                    <td className="px-4 py-2"><div className="flex flex-wrap gap-1">{n.complianceTags.map(ct => <span key={ct} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{ct}</span>)}</div></td>
                    <td className="px-4 py-2 text-gray-600 text-xs">{n.controls.join(', ') || '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{n.owner || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edge Creator Modal */}
      {showEdgeCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add Connection</h3>
              <button onClick={() => setShowEdgeCreator(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Node</label>
              <select value={edgeFrom} onChange={e => setEdgeFrom(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select source node...</option>
                {selectedProcess.nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.kind})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Node</label>
              <select value={edgeTo} onChange={e => setEdgeTo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select target node...</option>
                {selectedProcess.nodes.filter(n => n.id !== edgeFrom).map(n => <option key={n.id} value={n.id}>{n.label} ({n.kind})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
              <input value={edgeLabel} onChange={e => setEdgeLabel(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., Yes, No, Next Step" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEdgeCreator(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={addEdge} disabled={!edgeFrom || !edgeTo} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add Edge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessMapper;
