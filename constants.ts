
import { ComplianceFramework, ComplianceStatus, FrameworkType, RiskItem, AuditLog, User, Integration } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Connor',
    email: 'sarah@complyeasy.ai',
    role: 'admin',
    avatar: 'SC',
    organizationId: 'org1'
  },
  {
    id: 'u2',
    name: 'Mike Ross',
    email: 'mike@complyeasy.ai',
    role: 'editor',
    avatar: 'MR',
    organizationId: 'org1'
  },
  {
    id: 'u3',
    name: 'Jane Doe',
    email: 'jane@complyeasy.ai',
    role: 'viewer',
    avatar: 'JD',
    organizationId: 'org1'
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
  // Core Frameworks
  { name: FrameworkType.SOC2, region: 'Global', description: 'Service Organization Control 2 - Trust services criteria' },
  { name: FrameworkType.GDPR, region: 'EU', description: 'General Data Protection Regulation - EU data privacy' },
  { name: FrameworkType.HIPAA, region: 'US', description: 'Health Insurance Portability and Accountability Act - Healthcare data protection' },
  { name: FrameworkType.ISO27001, region: 'Global', description: 'ISO/IEC 27001 - Information security management system' },
  { name: FrameworkType.PCI_DSS, region: 'Global', description: 'Payment Card Industry Data Security Standard' },
  { name: FrameworkType.CCPA, region: 'US-CA', description: 'California Consumer Privacy Act' },
  { name: FrameworkType.NIST, region: 'US', description: 'NIST 800-53 - Federal information systems security' },
  
  // Additional Compliance Frameworks
  { name: 'ISO 27017', region: 'Global', description: 'Cloud security controls and guidelines' },
  { name: 'ISO 27018', region: 'Global', description: 'Protection of personally identifiable information in public clouds' },
  { name: 'ISO 27701', region: 'Global', description: 'Privacy Information Management System (PIMS)' },
  { name: 'ISO 22301', region: 'Global', description: 'Business Continuity Management System' },
  { name: 'ISO 9001', region: 'Global', description: 'Quality Management System' },
  { name: 'ISO 14001', region: 'Global', description: 'Environmental Management System' },
  { name: 'ISO 45001', region: 'Global', description: 'Occupational Health and Safety Management' },
  
  // US-Specific Frameworks
  { name: 'FISMA', region: 'US', description: 'Federal Information Security Management Act' },
  { name: 'FedRAMP', region: 'US', description: 'Federal Risk and Authorization Management Program' },
  { name: 'CMMC', region: 'US', description: 'Cybersecurity Maturity Model Certification' },
  { name: 'NYDFS', region: 'US-NY', description: 'New York Department of Financial Services Cybersecurity Regulation' },
  { name: 'GLBA', region: 'US', description: 'Gramm-Leach-Bliley Act - Financial privacy' },
  { name: 'SOX', region: 'US', description: 'Sarbanes-Oxley Act - Financial reporting controls' },
  { name: 'FERPA', region: 'US', description: 'Family Educational Rights and Privacy Act' },
  { name: 'COPPA', region: 'US', description: 'Children\'s Online Privacy Protection Act' },
  
  // EU/International Frameworks
  { name: 'ePrivacy Directive', region: 'EU', description: 'EU ePrivacy Directive - Electronic communications privacy' },
  { name: 'PIPEDA', region: 'CA', description: 'Personal Information Protection and Electronic Documents Act (Canada)' },
  { name: 'LGPD', region: 'BR', description: 'Lei Geral de Proteção de Dados (Brazil GDPR)' },
  { name: 'PDPA (Singapore)', region: 'SG', description: 'Personal Data Protection Act (Singapore)' },
  { name: 'PDPA (Malaysia)', region: 'MY', description: 'Personal Data Protection Act (Malaysia)' },
  { name: 'PIPL (China)', region: 'CN', description: 'Personal Information Protection Law (China)' },
  { name: 'APPI', region: 'JP', description: 'Act on the Protection of Personal Information (Japan)' },
  { name: 'POPIA', region: 'ZA', description: 'Protection of Personal Information Act (South Africa)' },
  
  // Industry-Specific Frameworks
  { name: 'HITRUST CSF', region: 'US', description: 'Health Information Trust Alliance Common Security Framework' },
  { name: 'HITECH', region: 'US', description: 'Health Information Technology for Economic and Clinical Health Act' },
  { name: '21 CFR Part 11', region: 'US', description: 'FDA Electronic Records and Signatures' },
  { name: 'GxP', region: 'Global', description: 'Good Practice Guidelines for Life Sciences' },
  { name: 'IEC 62443', region: 'Global', description: 'Industrial Automation and Control Systems Security' },
  { name: 'NERC CIP', region: 'US', description: 'North American Electric Reliability Corporation Critical Infrastructure Protection' },
  { name: 'CJIS', region: 'US', description: 'Criminal Justice Information Services Security Policy' },
  
  // Cloud & Technology Frameworks
  { name: 'CSA CCM', region: 'Global', description: 'Cloud Security Alliance Cloud Controls Matrix' },
  { name: 'CIS Controls', region: 'Global', description: 'Center for Internet Security Critical Security Controls' },
  { name: 'OWASP Top 10', region: 'Global', description: 'Open Web Application Security Project Top 10 Risks' },
  { name: 'ASVS', region: 'Global', description: 'Application Security Verification Standard' },
  
  // Financial Frameworks
  { name: 'Basel III', region: 'Global', description: 'International banking regulations' },
  { name: 'MiFID II', region: 'EU', description: 'Markets in Financial Instruments Directive II' },
  { name: 'PSD2', region: 'EU', description: 'Payment Services Directive 2' },
  { name: 'PCI DSS v4.0', region: 'Global', description: 'Payment Card Industry Data Security Standard v4.0' },
  
  // Data Protection & Privacy (removed duplicate PIPL - already listed above)
  { name: 'PDPB', region: 'IN', description: 'Personal Data Protection Bill (India)' },
  { name: 'Privacy Shield', region: 'US-EU', description: 'EU-US Privacy Shield Framework' },
  
  // Security Standards
  { name: 'NIST CSF', region: 'US', description: 'NIST Cybersecurity Framework' },
  { name: 'NIST 800-171', region: 'US', description: 'Protecting Controlled Unclassified Information' },
  { name: 'NIST 800-63', region: 'US', description: 'Digital Identity Guidelines' },
  { name: 'ENISA', region: 'EU', description: 'European Union Agency for Cybersecurity Guidelines' },
  
  // Quality & Process Frameworks
  { name: 'ITIL', region: 'Global', description: 'IT Infrastructure Library - IT service management' },
  { name: 'COBIT', region: 'Global', description: 'Control Objectives for Information and Related Technologies' },
  { name: 'CMMI', region: 'Global', description: 'Capability Maturity Model Integration' },
  
  // Regional Compliance
  { name: 'APEC CBPR', region: 'APAC', description: 'Asia-Pacific Economic Cooperation Cross-Border Privacy Rules' },
  { name: 'Adequacy Decision', region: 'EU', description: 'EU Adequacy Decision for data transfers' },
  
  // EU Digital Regulations (2022-2025)
  { name: FrameworkType.EU_AI_ACT, region: 'EU', description: 'EU AI Act (Regulation 2024/1689) - World\'s first comprehensive AI law regulating artificial intelligence systems with risk-based classification' },
  { name: FrameworkType.DMA, region: 'EU', description: 'Digital Markets Act (Regulation 2022/1925) - Rules for gatekeeper platforms and core platform services to ensure fair competition' },
  { name: FrameworkType.DSA, region: 'EU', description: 'Digital Services Act (Regulation 2022/2065) - Rules for online platforms, content moderation, transparency, and user protection' },
];

export const MOCK_RISKS: RiskItem[] = [
  {
    id: 'r1',
    severity: 'High',
    description: 'Unencrypted S3 Bucket detected in production environment.',
    category: 'Infrastructure',
    detectedAt: '2 hours ago',
    status: 'Open',
  },
  {
    id: 'r2',
    severity: 'Medium',
    description: '3 employees have not completed mandatory security training.',
    category: 'Personnel',
    detectedAt: '1 day ago',
    status: 'Open',
  },
  {
    id: 'r3',
    severity: 'Medium',
    description: 'Vendor "AnalyticsCorp" DPA missing signature.',
    category: 'Vendor Management',
    detectedAt: '3 days ago',
    status: 'Open',
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
    price: 'Contact Us',
    period: '/mo',
    features: ['Core reports', '5 Frameworks', '20 Integrations', 'Email Support'],
    target: 'Small Teams',
    recommended: false,
  },
  {
    name: 'Pro',
    price: 'Contact Us',
    //period: '/mo',
    features: ['Predictive AI', 'Vendor Management', '50+ Integrations', 'Priority Support'],
    target: 'Mid-SMBs',
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    //period: '/mo',
    features: ['Custom AI Agents', 'Unlimited Integrations', 'Dedicated Support', 'White-label'],
    target: 'Large SMBs/MSPs',
    recommended: false,
  },
];
