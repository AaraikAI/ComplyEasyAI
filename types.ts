
export enum ComplianceStatus {
  COMPLIANT = 'Compliant',
  AT_RISK = 'At Risk',
  NON_COMPLIANT = 'Non-Compliant',
  IN_REVIEW = 'In Review'
}

export enum FrameworkType {
  SOC2 = 'SOC 2 Type II',
  GDPR = 'GDPR',
  HIPAA = 'HIPAA',
  ISO27001 = 'ISO 27001',
  PCI_DSS = 'PCI DSS',
  CCPA = 'CCPA',
  NIST = 'NIST 800-53'
}

export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface RiskItem {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  category: string;
  detectedAt: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Ignored';
  assignedTo?: string; // User Name
  assignedAvatar?: string;
  aiPriorityScore?: number; // 0-100
  aiRationale?: string;
  mitigationPlan?: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  status: ComplianceStatus;
  progress: number;
  nextAuditDate: string;
  region?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  hash: string; // Blockchain hash simulation
  verified: boolean;
}

export interface Integration {
  id: string;
  name: string;
  category: 'Cloud' | 'HR' | 'Dev' | 'Security';
  connected: boolean;
  lastSync: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export type ViewState = 
  | 'landing' 
  | 'dashboard' 
  | 'reports' 
  | 'frameworks' 
  | 'framework-details' 
  | 'settings' 
  | 'audit' 
  | 'risks'
  | 'ai-policy'
  | 'ai-contract'
  | 'ai-gap'
  | 'ai-rfp'
  | 'ai-phishing'
  | 'ai-vendor'
  | 'ai-data-map'
  | 'ai-bcp';
