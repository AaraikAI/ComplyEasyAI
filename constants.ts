import { ComplianceFramework, ComplianceStatus, FrameworkType, RiskItem, AuditLog, User, Integration } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Connor',
    email: 'sarah@complyeasy.ai',
    role: 'admin',
    avatar: 'SC'
  },
  {
    id: 'u2',
    name: 'Mike Ross',
    email: 'mike@complyeasy.ai',
    role: 'editor',
    avatar: 'MR'
  },
  {
    id: 'u3',
    name: 'Jane Doe',
    email: 'jane@complyeasy.ai',
    role: 'viewer',
    avatar: 'JD'
  }
];

export const INITIAL_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: '1',
    name: FrameworkType.SOC2,
    status: ComplianceStatus.COMPLIANT,
    progress: 100,
    nextAuditDate: '2024-11-15',
    region: 'Global'
  },
  {
    id: '2',
    name: FrameworkType.GDPR,
    status: ComplianceStatus.AT_RISK,
    progress: 85,
    nextAuditDate: '2024-06-30',
    region: 'EU'
  },
];

export const AVAILABLE_FRAMEWORKS = [
  { name: FrameworkType.HIPAA, region: 'US', description: 'Healthcare data protection' },
  { name: FrameworkType.ISO27001, region: 'Global', description: 'Information security management' },
  { name: FrameworkType.PCI_DSS, region: 'Global', description: 'Payment card industry security' },
  { name: FrameworkType.CCPA, region: 'US-CA', description: 'California consumer privacy' },
  { name: FrameworkType.NIST, region: 'US', description: 'Federal information systems security' },
];

export const MOCK_RISKS: RiskItem[] = [
  {
    id: 'r1',
    severity: 'High',
    description: 'Unencrypted S3 Bucket detected in production environment.',
    category: 'Infrastructure',
    detectedAt: '2 hours ago',
  },
  {
    id: 'r2',
    severity: 'Medium',
    description: '3 employees have not completed mandatory security training.',
    category: 'Personnel',
    detectedAt: '1 day ago',
  },
  {
    id: 'r3',
    severity: 'Medium',
    description: 'Vendor "AnalyticsCorp" DPA missing signature.',
    category: 'Vendor Management',
    detectedAt: '3 days ago',
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l1',
    action: 'Policy Updated: Data Retention',
    user: 'Sarah Connor (CISO)',
    timestamp: '2024-05-20 10:42 AM',
    hash: '0x8f2...9a1',
    verified: true
  },
  {
    id: 'l2',
    action: 'Evidence Uploaded: Penetration Test Report',
    user: 'System Agent (AI)',
    timestamp: '2024-05-20 09:15 AM',
    hash: '0x7b3...c2d',
    verified: true
  },
  {
    id: 'l3',
    action: 'Access Review Completed',
    user: 'John Smith (Admin)',
    timestamp: '2024-05-19 04:30 PM',
    hash: '0x1a9...e4f',
    verified: true
  },
  {
    id: 'l4',
    action: 'Integration Added: AWS Production',
    user: 'Mike Ross',
    timestamp: '2024-05-18 02:15 PM',
    hash: '0x3c4...b2a',
    verified: true
  }
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'i1', name: 'AWS', category: 'Cloud', connected: true, lastSync: '5 mins ago', icon: 'cloud' },
  { id: 'i2', name: 'Google Workspace', category: 'HR', connected: true, lastSync: '1 hour ago', icon: 'users' },
  { id: 'i3', name: 'GitHub', category: 'Dev', connected: true, lastSync: '10 mins ago', icon: 'code' },
  { id: 'i4', name: 'Jira', category: 'Dev', connected: false, lastSync: 'Never', icon: 'trello' },
  { id: 'i5', name: 'Slack', category: 'Dev', connected: true, lastSync: 'Real-time', icon: 'message-square' },
];

export const PRICING_TIERS = [
  {
    name: 'Basic',
    price: '$75',
    period: '/mo',
    features: ['Core reports', '5 Frameworks', '20 Integrations', 'Email Support'],
    target: 'Small Teams',
    recommended: false,
  },
  {
    name: 'Pro',
    price: '$200',
    period: '/mo',
    features: ['Predictive AI', 'Vendor Management', '50+ Integrations', 'Priority Support'],
    target: 'Mid-SMBs',
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: '$500',
    period: '/mo',
    features: ['Custom AI Agents', 'Unlimited Integrations', 'Dedicated Support', 'White-label'],
    target: 'Large SMBs/MSPs',
    recommended: false,
  },
];
