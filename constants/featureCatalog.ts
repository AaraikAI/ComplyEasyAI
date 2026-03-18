/**
 * Static catalog of all ComplyEasyAI features.
 * Maps each feature to its hub route + tab param for navigation.
 * Used by FeatureLibrary, GlobalSearch, and HomeOS pinned features.
 */
import {
  LayoutDashboard, ShieldAlert, ShieldCheck, AlertTriangle, Users, FileCheck,
  Brain, Shield, Leaf, Network, Recycle, MapPin, Globe,
  UserCheck, Landmark, ScanSearch, Package, Monitor, FileText, Activity,
  PieChart, Fingerprint, Eye, ClipboardList, UserX, Building2, Lock,
  Calendar, Gauge, Layers, Briefcase, Bot, Scale, BookOpen,
  Crosshair, BarChart3, DollarSign, Radar, TestTube, Satellite,
  GitBranch, FileCode, Smartphone, Target, TrendingUp, MessageSquare,
  Workflow, Award, Boxes, Key, FileWarning, BadgeCheck, Trash2, TreePine,
  AlertOctagon
} from 'lucide-react';

export type FeatureCategory = 'Governance' | 'Risk' | 'Compliance' | 'Audits' | 'Vendors' | 'Privacy' | 'Reporting';

export interface CatalogFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: FeatureCategory;
  path: string;
  minimumTier: 'Foundation' | 'Essentials' | 'Growth' | 'Visionary';
  tags: string[];
}

export const FEATURE_CATALOG: CatalogFeature[] = [
  // ── Governance ──────────────────────────────────────────────────────
  { id: 'governance-overview', name: 'Governance Overview', description: 'Centralized governance management dashboard', icon: UserCheck, category: 'Governance', path: '/governance?tab=overview', minimumTier: 'Essentials', tags: ['governance', 'overview', 'management'] },
  { id: 'process-mapper', name: 'Process Mapper', description: 'Visual process mapping and documentation', icon: Workflow, category: 'Governance', path: '/governance?tab=process-mapper', minimumTier: 'Essentials', tags: ['process', 'mapping', 'workflow'] },
  { id: 'workflow-builder', name: 'Workflow Builder', description: 'Custom approval and automation workflows', icon: GitBranch, category: 'Governance', path: '/governance?tab=workflow-builder', minimumTier: 'Growth', tags: ['workflow', 'automation', 'approval'] },
  { id: 'automation-rules', name: 'Automation Rules', description: 'Automated compliance task orchestration', icon: Satellite, category: 'Governance', path: '/governance?tab=automation', minimumTier: 'Growth', tags: ['automation', 'rules', 'orchestration'] },
  { id: 'sod-analysis', name: 'Segregation of Duties', description: 'SoD conflict detection and resolution', icon: Scale, category: 'Governance', path: '/governance?tab=sod', minimumTier: 'Visionary', tags: ['sod', 'segregation', 'duties', 'conflicts'] },
  { id: 'sox-compliance', name: 'SOX Compliance', description: 'Sarbanes-Oxley compliance management', icon: Landmark, category: 'Governance', path: '/governance/sox', minimumTier: 'Essentials', tags: ['sox', 'sarbanes', 'oxley', 'financial'] },
  { id: 'policy-management', name: 'Policy Management', description: 'Create, version, and distribute policies', icon: FileCheck, category: 'Governance', path: '/policies?tab=policies', minimumTier: 'Foundation', tags: ['policy', 'document', 'version'] },
  { id: 'ai-policy-generator', name: 'AI Policy Generator', description: 'Generate policies using AI from templates', icon: Bot, category: 'Governance', path: '/policies?tab=ai-generator', minimumTier: 'Growth', tags: ['ai', 'policy', 'generator', 'template'] },

  // ── Risk ────────────────────────────────────────────────────────────
  { id: 'risk-register', name: 'Risk Register', description: 'Comprehensive risk identification and tracking', icon: ShieldAlert, category: 'Risk', path: '/risks?tab=register', minimumTier: 'Foundation', tags: ['risk', 'register', 'tracking'] },
  { id: 'risk-heatmap', name: 'Risk Heat Map', description: 'Visual risk matrix with likelihood vs impact', icon: Target, category: 'Risk', path: '/risks?tab=heatmap', minimumTier: 'Essentials', tags: ['risk', 'heatmap', 'matrix', 'visual'] },
  { id: 'my-tasks', name: 'My Tasks', description: 'Personal task queue for risk mitigation', icon: ClipboardList, category: 'Risk', path: '/risks?tab=tasks', minimumTier: 'Foundation', tags: ['tasks', 'queue', 'mitigation'] },
  { id: 'issue-management', name: 'Issue Management', description: 'Track and resolve compliance issues', icon: AlertTriangle, category: 'Risk', path: '/issues?tab=issues', minimumTier: 'Foundation', tags: ['issues', 'tracking', 'resolution'] },
  { id: 'incident-management', name: 'Incident Management', description: 'Incident response and escalation workflows', icon: AlertOctagon, category: 'Risk', path: '/issues?tab=incidents', minimumTier: 'Essentials', tags: ['incident', 'response', 'escalation'] },
  { id: 'breach-notification', name: 'Breach Notification', description: 'Guided breach notification workflow', icon: AlertTriangle, category: 'Risk', path: '/issues?tab=breach', minimumTier: 'Growth', tags: ['breach', 'notification', 'wizard', 'gdpr'] },

  // ── Compliance ──────────────────────────────────────────────────────
  { id: 'frameworks', name: 'Compliance Frameworks', description: 'Manage SOC2, ISO 27001, GDPR and more', icon: ShieldCheck, category: 'Compliance', path: '/frameworks', minimumTier: 'Foundation', tags: ['frameworks', 'soc2', 'iso', 'gdpr'] },
  { id: 'nist-ai-rmf', name: 'NIST AI RMF', description: 'AI risk management framework assessment', icon: Brain, category: 'Compliance', path: '/ai-rmf', minimumTier: 'Essentials', tags: ['nist', 'ai', 'rmf', 'assessment'] },
  { id: 'eu-ai-act', name: 'EU AI Act', description: 'EU AI regulation compliance tracking', icon: ShieldCheck, category: 'Compliance', path: '/regulations/eu-ai-act', minimumTier: 'Essentials', tags: ['eu', 'ai', 'act', 'regulation'] },
  { id: 'eu-cra', name: 'EU Cyber Resilience Act', description: 'CRA product security compliance', icon: Shield, category: 'Compliance', path: '/regulations/eu-cra', minimumTier: 'Growth', tags: ['eu', 'cra', 'cyber', 'resilience'] },
  { id: 'csrd', name: 'CSRD / ESG', description: 'Corporate sustainability reporting', icon: Leaf, category: 'Compliance', path: '/regulations/csrd', minimumTier: 'Growth', tags: ['csrd', 'esg', 'sustainability'] },
  { id: 'ecodesign', name: 'Ecodesign', description: 'EU Ecodesign for Sustainable Products', icon: Recycle, category: 'Compliance', path: '/regulations/ecodesign', minimumTier: 'Growth', tags: ['ecodesign', 'sustainable', 'products'] },
  { id: 'nis2', name: 'NIS2 Directive', description: 'Network and information security compliance', icon: Network, category: 'Compliance', path: '/regulations/nis2', minimumTier: 'Growth', tags: ['nis2', 'network', 'security'] },
  { id: 'dma', name: 'Digital Markets Act', description: 'DMA gatekeeper obligations management', icon: ShieldCheck, category: 'Compliance', path: '/regulations/dma', minimumTier: 'Visionary', tags: ['dma', 'digital', 'markets', 'gatekeeper'] },
  { id: 'dsa', name: 'Digital Services Act', description: 'DSA platform compliance management', icon: ShieldCheck, category: 'Compliance', path: '/regulations/dsa', minimumTier: 'Visionary', tags: ['dsa', 'digital', 'services', 'platform'] },
  { id: 'us-privacy', name: 'US Privacy Laws', description: 'CCPA, CPRA and state privacy tracking', icon: MapPin, category: 'Compliance', path: '/regulations/us-privacy', minimumTier: 'Essentials', tags: ['us', 'privacy', 'ccpa', 'cpra'] },
  { id: 'dora', name: 'DORA', description: 'Digital Operational Resilience Act', icon: Shield, category: 'Compliance', path: '/regulations/dora', minimumTier: 'Growth', tags: ['dora', 'resilience', 'financial'] },
  { id: 'regulatory-changes', name: 'Regulatory Changes', description: 'Track regulatory updates and changes', icon: Globe, category: 'Compliance', path: '/regulations/regulatory-changes', minimumTier: 'Essentials', tags: ['regulatory', 'changes', 'updates', 'tracking'] },
  { id: 'cross-framework-mapper', name: 'Cross-Framework Mapper', description: 'AI-powered control mapping across frameworks', icon: Crosshair, category: 'Compliance', path: '/ai/compliance-tools?tab=cross-mapper', minimumTier: 'Growth', tags: ['ai', 'cross', 'framework', 'mapping'] },
  { id: 'gap-analysis', name: 'Gap Analysis', description: 'AI compliance gap analysis engine', icon: ScanSearch, category: 'Compliance', path: '/ai/document-tools?tab=gap', minimumTier: 'Essentials', tags: ['ai', 'gap', 'analysis'] },
  { id: 'auto-remediation', name: 'Auto-Remediation', description: 'AI-driven compliance remediation plans', icon: Radar, category: 'Compliance', path: '/ai/compliance-tools?tab=remediation', minimumTier: 'Growth', tags: ['ai', 'remediation', 'auto', 'plans'] },
  { id: 'compliance-query', name: 'Compliance Query', description: 'Natural language compliance questions', icon: MessageSquare, category: 'Compliance', path: '/ai/compliance-tools?tab=query', minimumTier: 'Growth', tags: ['ai', 'query', 'natural', 'language'] },

  // ── Audits ──────────────────────────────────────────────────────────
  { id: 'audit-trail', name: 'Audit Trail', description: 'Comprehensive audit log with filtering', icon: Activity, category: 'Audits', path: '/audit?tab=trail', minimumTier: 'Foundation', tags: ['audit', 'trail', 'log'] },
  { id: 'audit-preparation', name: 'Audit Preparation', description: 'AI-assisted audit readiness assistant', icon: BookOpen, category: 'Audits', path: '/audit?tab=preparation', minimumTier: 'Essentials', tags: ['audit', 'preparation', 'readiness'] },
  { id: 'audit-simulator', name: 'Audit Simulator', description: 'Simulate audits before the real thing', icon: TestTube, category: 'Audits', path: '/audit?tab=simulator', minimumTier: 'Growth', tags: ['audit', 'simulator', 'practice'] },
  { id: 'auditor-hub', name: 'Auditor Hub', description: 'Secure portal for external auditors', icon: Key, category: 'Audits', path: '/audit?tab=auditor', minimumTier: 'Growth', tags: ['auditor', 'portal', 'external'] },
  { id: 'control-testing', name: 'Control Testing', description: 'Automated control effectiveness testing', icon: BadgeCheck, category: 'Audits', path: '/audit?tab=testing', minimumTier: 'Growth', tags: ['control', 'testing', 'effectiveness'] },
  { id: 'evidence-collection', name: 'Evidence Collection', description: 'Automated evidence gathering rules', icon: ScanSearch, category: 'Audits', path: '/evidence?tab=collection', minimumTier: 'Essentials', tags: ['evidence', 'collection', 'automated'] },
  { id: 'evidence-checker', name: 'Evidence Completeness', description: 'AI evidence completeness checker', icon: FileWarning, category: 'Audits', path: '/evidence?tab=checker', minimumTier: 'Growth', tags: ['evidence', 'completeness', 'checker', 'ai'] },
  { id: 'exception-management', name: 'Exception Management', description: 'Track and manage compliance exceptions', icon: FileText, category: 'Audits', path: '/evidence?tab=exceptions', minimumTier: 'Essentials', tags: ['exception', 'management', 'tracking'] },

  // ── Vendors ─────────────────────────────────────────────────────────
  { id: 'vendor-management', name: 'Vendor Management', description: 'Third-party vendor risk lifecycle', icon: Users, category: 'Vendors', path: '/vendors?tab=vendors', minimumTier: 'Foundation', tags: ['vendor', 'management', 'third-party'] },
  { id: 'vendor-monitoring', name: 'Continuous Monitoring', description: 'Real-time vendor risk monitoring', icon: Monitor, category: 'Vendors', path: '/vendors?tab=monitoring', minimumTier: 'Essentials', tags: ['vendor', 'monitoring', 'continuous'] },
  { id: 'vendor-risk-assessment', name: 'Risk Assessment', description: 'AI-powered vendor risk scoring', icon: Gauge, category: 'Vendors', path: '/vendors?tab=risk-assessment', minimumTier: 'Essentials', tags: ['vendor', 'risk', 'assessment', 'scoring'] },
  { id: 'agentic-vendor-risk', name: 'Agentic Risk Analysis', description: 'Autonomous AI vendor risk analysis', icon: Bot, category: 'Vendors', path: '/vendors?tab=agentic-risk', minimumTier: 'Visionary', tags: ['ai', 'agentic', 'vendor', 'autonomous'] },
  { id: 'contract-analyzer', name: 'Contract Analyzer', description: 'AI contract clause analysis', icon: FileCode, category: 'Vendors', path: '/vendors?tab=contract-analyzer', minimumTier: 'Growth', tags: ['ai', 'contract', 'analyzer', 'clause'] },
  { id: 'questionnaires', name: 'Questionnaires', description: 'Vendor security questionnaire management', icon: ClipboardList, category: 'Vendors', path: '/questionnaires', minimumTier: 'Essentials', tags: ['questionnaire', 'security', 'vendor'] },

  // ── Privacy ─────────────────────────────────────────────────────────
  { id: 'privacy-platform', name: 'Privacy Platform', description: 'Comprehensive privacy management', icon: Fingerprint, category: 'Privacy', path: '/privacy', minimumTier: 'Essentials', tags: ['privacy', 'management', 'platform'] },
  { id: 'dpia', name: 'DPIA Workflow', description: 'Data protection impact assessments', icon: Eye, category: 'Privacy', path: '/privacy/dpia', minimumTier: 'Essentials', tags: ['dpia', 'data', 'protection', 'impact'] },
  { id: 'ropa', name: 'RoPA Management', description: 'Records of processing activities', icon: ClipboardList, category: 'Privacy', path: '/privacy/ropa', minimumTier: 'Essentials', tags: ['ropa', 'records', 'processing'] },
  { id: 'privacy-notices', name: 'Privacy Notices', description: 'Privacy notice generation and serving', icon: FileText, category: 'Privacy', path: '/privacy/notices', minimumTier: 'Growth', tags: ['privacy', 'notices', 'generation'] },
  { id: 'account-deletion', name: 'Data Deletion', description: 'GDPR/CCPA data deletion workflows', icon: UserX, category: 'Privacy', path: '/privacy/account-deletion', minimumTier: 'Growth', tags: ['deletion', 'gdpr', 'ccpa', 'data'] },
  { id: 'data-mapper', name: 'Data Mapper', description: 'AI-powered data flow mapping', icon: Crosshair, category: 'Privacy', path: '/ai/compliance-tools?tab=data-mapper', minimumTier: 'Growth', tags: ['ai', 'data', 'mapper', 'flow'] },
  { id: 'phishing-simulator', name: 'Phishing Simulator', description: 'AI phishing awareness training', icon: Crosshair, category: 'Privacy', path: '/ai/compliance-tools?tab=phishing', minimumTier: 'Growth', tags: ['phishing', 'simulator', 'training'] },

  // ── Reporting ───────────────────────────────────────────────────────
  { id: 'reports', name: 'Reports', description: 'Standard compliance reports library', icon: FileText, category: 'Reporting', path: '/reports?tab=reports', minimumTier: 'Foundation', tags: ['reports', 'compliance', 'library'] },
  { id: 'report-builder', name: 'Report Builder', description: 'Custom drag-and-drop report builder', icon: Boxes, category: 'Reporting', path: '/reports?tab=builder', minimumTier: 'Essentials', tags: ['report', 'builder', 'custom'] },
  { id: 'ai-report-generator', name: 'AI Report Generator', description: 'AI-generated compliance reports', icon: Bot, category: 'Reporting', path: '/reports?tab=ai-generator', minimumTier: 'Growth', tags: ['ai', 'report', 'generator'] },
  { id: 'esg-reports', name: 'ESG Reports', description: 'Environmental, social, governance reporting', icon: Leaf, category: 'Reporting', path: '/reports?tab=esg', minimumTier: 'Growth', tags: ['esg', 'environmental', 'social', 'governance'] },
  { id: 'executive-dashboard', name: 'Executive Dashboard', description: 'Board-ready executive compliance view', icon: PieChart, category: 'Reporting', path: '/executive', minimumTier: 'Essentials', tags: ['executive', 'dashboard', 'board'] },
  { id: 'live-monitoring', name: 'Live Monitoring', description: 'Real-time compliance monitoring', icon: Monitor, category: 'Reporting', path: '/monitoring?tab=monitoring', minimumTier: 'Essentials', tags: ['monitoring', 'real-time', 'live'] },
  { id: 'analytics', name: 'Analytics', description: 'Advanced compliance analytics', icon: BarChart3, category: 'Reporting', path: '/monitoring?tab=analytics', minimumTier: 'Essentials', tags: ['analytics', 'advanced', 'data'] },
  { id: 'compliance-forecasting', name: 'Score Forecasting', description: 'AI compliance score predictions', icon: TrendingUp, category: 'Reporting', path: '/monitoring?tab=forecasting', minimumTier: 'Growth', tags: ['ai', 'forecasting', 'predictions'] },
  { id: 'cost-analytics', name: 'Cost Analytics', description: 'Compliance cost tracking and ROI', icon: DollarSign, category: 'Reporting', path: '/monitoring?tab=costs', minimumTier: 'Growth', tags: ['cost', 'analytics', 'roi'] },

  // ── Enterprise (accessible via Feature Library / Cmd+K) ─────────────
  { id: 'product-lifecycle', name: 'Product Lifecycle', description: 'Product compliance lifecycle tracking', icon: Package, category: 'Compliance', path: '/products?tab=lifecycle', minimumTier: 'Essentials', tags: ['product', 'lifecycle', 'tracking'] },
  { id: 'ce-marking', name: 'CE Marking', description: 'CE marking compliance workflow', icon: Award, category: 'Compliance', path: '/products?tab=ce-marking', minimumTier: 'Growth', tags: ['ce', 'marking', 'eu'] },
  { id: 'digital-passport', name: 'Digital Product Passport', description: 'EU digital product passport management', icon: Fingerprint, category: 'Compliance', path: '/products?tab=digital-passport', minimumTier: 'Growth', tags: ['digital', 'passport', 'product'] },
  { id: 'sbom-manager', name: 'SBOM Manager', description: 'Software bill of materials management', icon: FileCode, category: 'Compliance', path: '/products?tab=sbom', minimumTier: 'Growth', tags: ['sbom', 'software', 'bill'] },
  { id: 'it-assets', name: 'IT Asset Management', description: 'IT asset inventory and compliance', icon: Boxes, category: 'Governance', path: '/enterprise-ops?tab=assets', minimumTier: 'Essentials', tags: ['it', 'assets', 'inventory'] },
  { id: 'mdm', name: 'Mobile Device Management', description: 'Mobile device compliance policies', icon: Smartphone, category: 'Governance', path: '/enterprise-ops?tab=mdm', minimumTier: 'Growth', tags: ['mdm', 'mobile', 'device'] },
  { id: 'cicd-gates', name: 'CI/CD Security Gates', description: 'Pipeline compliance gate configuration', icon: GitBranch, category: 'Governance', path: '/enterprise-ops?tab=cicd', minimumTier: 'Growth', tags: ['cicd', 'pipeline', 'gates', 'security'] },
  { id: 'security-training', name: 'Security Training', description: 'Employee security awareness training', icon: BookOpen, category: 'Governance', path: '/enterprise-ops?tab=training', minimumTier: 'Essentials', tags: ['security', 'training', 'awareness'] },
  { id: 'rfp-responder', name: 'RFP Responder', description: 'AI-powered RFP response automation', icon: Briefcase, category: 'Compliance', path: '/ai/document-tools?tab=rfp', minimumTier: 'Growth', tags: ['ai', 'rfp', 'responder', 'automation'] },
  { id: 'bcp-generator', name: 'BCP Generator', description: 'AI business continuity plan generator', icon: Shield, category: 'Risk', path: '/ai/document-tools?tab=bcp', minimumTier: 'Growth', tags: ['ai', 'bcp', 'business', 'continuity'] },
  { id: 'maturity-assessment', name: 'Maturity Assessment', description: 'GRC maturity level assessment', icon: Gauge, category: 'Governance', path: '/maturity', minimumTier: 'Essentials', tags: ['maturity', 'assessment', 'level'] },
  { id: 'compliance-calendar', name: 'Compliance Calendar', description: 'Deadlines, audits and regulatory dates', icon: Calendar, category: 'Governance', path: '/calendar', minimumTier: 'Foundation', tags: ['calendar', 'deadlines', 'dates'] },
  { id: 'integrations', name: 'Integrations', description: 'Connect Jira, Slack, AWS and more', icon: Layers, category: 'Governance', path: '/integrations', minimumTier: 'Essentials', tags: ['integrations', 'jira', 'slack', 'aws'] },
  { id: 'workspaces', name: 'Workspaces', description: 'Multi-tenant workspace management', icon: Building2, category: 'Governance', path: '/workspaces', minimumTier: 'Growth', tags: ['workspaces', 'multi-tenant'] },
  { id: 'acos', name: 'ACOS Goals', description: 'AI compliance objectives and KPIs', icon: Brain, category: 'Governance', path: '/acos', minimumTier: 'Growth', tags: ['acos', 'objectives', 'kpi'] },
  { id: 'post-market-surveillance', name: 'Post-Market Surveillance', description: 'Post-market product monitoring', icon: ScanSearch, category: 'Compliance', path: '/post-market-surveillance', minimumTier: 'Growth', tags: ['post-market', 'surveillance', 'monitoring'] },
  { id: 'bia', name: 'Business Impact Analysis', description: 'Business impact assessment and planning', icon: TrendingUp, category: 'Risk', path: '/enterprise-ops?tab=bia', minimumTier: 'Growth', tags: ['bia', 'business', 'impact', 'analysis'] },
];

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  'Governance', 'Risk', 'Compliance', 'Audits', 'Vendors', 'Privacy', 'Reporting'
];
