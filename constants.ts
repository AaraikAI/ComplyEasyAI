
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
  // =========================================================================
  // Core Frameworks
  // =========================================================================
  { name: FrameworkType.SOC2, region: 'Global', description: 'Service Organization Control 2 - Trust services criteria' },
  { name: FrameworkType.GDPR, region: 'EU', description: 'General Data Protection Regulation - EU data privacy' },
  { name: FrameworkType.HIPAA, region: 'US', description: 'Health Insurance Portability and Accountability Act - Healthcare data protection' },
  { name: FrameworkType.ISO27001, region: 'Global', description: 'ISO/IEC 27001 - Information security management system' },
  { name: FrameworkType.PCI_DSS, region: 'Global', description: 'Payment Card Industry Data Security Standard' },
  { name: FrameworkType.CCPA, region: 'US-CA', description: 'California Consumer Privacy Act' },
  { name: FrameworkType.NIST, region: 'US', description: 'NIST 800-53 - Federal information systems security' },

  // =========================================================================
  // EU Digital Regulations (2022-2025)
  // =========================================================================
  { name: FrameworkType.EU_AI_ACT, region: 'EU', description: 'EU AI Act (Regulation 2024/1689) - World\'s first comprehensive AI law regulating artificial intelligence systems with risk-based classification' },
  { name: FrameworkType.DMA, region: 'EU', description: 'Digital Markets Act (Regulation 2022/1925) - Rules for gatekeeper platforms and core platform services to ensure fair competition' },
  { name: FrameworkType.DSA, region: 'EU', description: 'Digital Services Act (Regulation 2022/2065) - Rules for online platforms, content moderation, transparency, and user protection' },
  { name: FrameworkType.EU_CRA, region: 'EU', description: 'Cybersecurity requirements for products with digital elements' },
  { name: FrameworkType.CSRD, region: 'EU', description: 'Corporate Sustainability Reporting Directive for ESG reporting' },
  { name: FrameworkType.ECODESIGN, region: 'EU', description: 'Environmental requirements for sustainable products' },
  { name: FrameworkType.NIS2, region: 'EU', description: 'Network and Information Security Directive 2 for critical infrastructure' },
  { name: 'DORA', region: 'EU', description: 'Digital Operational Resilience Act for financial sector' },
  { name: 'Data Act', region: 'EU', description: 'EU Data Act for fair access to and use of data' },
  { name: 'Data Governance Act', region: 'EU', description: 'Framework for data sharing across the EU' },
  { name: 'EU Whistleblower Directive', region: 'EU', description: 'Protection for persons reporting EU law breaches' },
  { name: 'EU Product Liability Directive', region: 'EU', description: 'Updated product liability rules including AI and digital' },
  { name: 'Machinery Regulation', region: 'EU', description: 'Safety of machinery including AI components' },
  { name: 'ePrivacy Directive', region: 'EU', description: 'EU ePrivacy Directive - Electronic communications privacy' },
  { name: 'MiFID II', region: 'EU', description: 'Markets in Financial Instruments Directive II' },
  { name: 'PSD2', region: 'EU', description: 'Payment Services Directive 2' },
  { name: 'ENISA', region: 'EU', description: 'European Union Agency for Cybersecurity Guidelines' },
  { name: 'Adequacy Decision', region: 'EU', description: 'EU Adequacy Decision for data transfers' },

  // =========================================================================
  // ISO Standards
  // =========================================================================
  { name: 'ISO 27017', region: 'Global', description: 'Cloud security controls and guidelines' },
  { name: 'ISO 27018', region: 'Global', description: 'Protection of personally identifiable information in public clouds' },
  { name: 'ISO 27701', region: 'Global', description: 'Privacy Information Management System (PIMS)' },
  { name: 'ISO 22301', region: 'Global', description: 'Business Continuity Management System' },
  { name: 'ISO 9001', region: 'Global', description: 'Quality Management System' },
  { name: 'ISO 14001', region: 'Global', description: 'Environmental Management System' },
  { name: 'ISO 45001', region: 'Global', description: 'Occupational Health and Safety Management' },
  { name: 'ISO 27002:2022', region: 'Global', description: 'Information Security Controls updated 2022' },
  { name: 'ISO 27005', region: 'Global', description: 'Information Security Risk Management' },
  { name: 'ISO 31000', region: 'Global', description: 'Risk Management Guidelines' },
  { name: 'ISO 27035', region: 'Global', description: 'Information Security Incident Management' },
  { name: 'ISO 27032', region: 'Global', description: 'Cybersecurity Guidelines' },
  { name: 'ISO 27799', region: 'Global', description: 'Health informatics information security management' },
  { name: 'ISO 22301:2019', region: 'Global', description: 'Business Continuity Management Systems' },
  { name: 'ISO 20000-1', region: 'Global', description: 'IT Service Management' },
  { name: 'ISO 42001', region: 'Global', description: 'AI Management System' },

  // =========================================================================
  // US Federal Frameworks
  // =========================================================================
  { name: 'FISMA', region: 'US', description: 'Federal Information Security Management Act' },
  { name: 'FedRAMP', region: 'US', description: 'Federal Risk and Authorization Management Program' },
  { name: 'CMMC', region: 'US', description: 'Cybersecurity Maturity Model Certification' },
  { name: 'NYDFS', region: 'US-NY', description: 'New York Department of Financial Services Cybersecurity Regulation' },
  { name: 'GLBA', region: 'US', description: 'Gramm-Leach-Bliley Act - Financial privacy' },
  { name: 'SOX', region: 'US', description: 'Sarbanes-Oxley Act - Financial reporting controls' },
  { name: 'FERPA', region: 'US', description: 'Family Educational Rights and Privacy Act' },
  { name: 'COPPA', region: 'US', description: 'Children\'s Online Privacy Protection Act' },
  { name: 'CJIS', region: 'US', description: 'Criminal Justice Information Services Security Policy' },

  // =========================================================================
  // US State Privacy Laws
  // =========================================================================
  { name: 'California CPRA', region: 'US-CA', description: 'California Privacy Rights Act (successor to CCPA)' },
  { name: 'Colorado CPA', region: 'US-CO', description: 'Colorado Privacy Act' },
  { name: 'Connecticut CTDPA', region: 'US-CT', description: 'Connecticut Data Privacy Act' },
  { name: 'Virginia VCDPA', region: 'US-VA', description: 'Virginia Consumer Data Protection Act' },
  { name: 'Utah UCPA', region: 'US-UT', description: 'Utah Consumer Privacy Act' },
  { name: 'Iowa ICDPA', region: 'US-IA', description: 'Iowa Consumer Data Protection Act' },
  { name: 'Indiana INCDPA', region: 'US-IN', description: 'Indiana Consumer Data Protection Act' },
  { name: 'Tennessee TIPA', region: 'US-TN', description: 'Tennessee Information Protection Act' },
  { name: 'Montana MCDPA', region: 'US-MT', description: 'Montana Consumer Data Privacy Act' },
  { name: 'Texas TDPSA', region: 'US-TX', description: 'Texas Data Privacy and Security Act' },
  { name: 'Oregon OCPA', region: 'US-OR', description: 'Oregon Consumer Privacy Act' },
  { name: 'Delaware DPDPA', region: 'US-DE', description: 'Delaware Personal Data Privacy Act' },
  { name: 'New Hampshire Privacy Act', region: 'US-NH', description: 'New Hampshire privacy law' },
  { name: 'New Jersey NJDPA', region: 'US-NJ', description: 'New Jersey Data Privacy Act' },
  { name: 'Maryland Online Data Privacy Act', region: 'US-MD', description: 'Maryland privacy law' },
  { name: 'Minnesota Consumer Data Privacy Act', region: 'US-MN', description: 'Minnesota privacy law' },
  { name: 'Nebraska Data Privacy Act', region: 'US-NE', description: 'Nebraska privacy law' },
  { name: 'Rhode Island Data Transparency Act', region: 'US-RI', description: 'Rhode Island privacy law' },
  { name: 'Vermont Data Privacy Act', region: 'US-VT', description: 'Vermont privacy law' },
  { name: 'Kentucky KCDPA', region: 'US-KY', description: 'Kentucky Consumer Data Protection Act' },

  // =========================================================================
  // International Privacy & Data Protection
  // =========================================================================
  { name: 'PIPEDA', region: 'CA', description: 'Personal Information Protection and Electronic Documents Act (Canada)' },
  { name: 'LGPD', region: 'BR', description: 'Lei Geral de Proteção de Dados (Brazil GDPR)' },
  { name: 'PDPA (Singapore)', region: 'SG', description: 'Personal Data Protection Act (Singapore)' },
  { name: 'PDPA (Malaysia)', region: 'MY', description: 'Personal Data Protection Act (Malaysia)' },
  { name: 'PIPL (China)', region: 'CN', description: 'Personal Information Protection Law (China)' },
  { name: 'APPI', region: 'JP', description: 'Act on the Protection of Personal Information (Japan)' },
  { name: 'POPIA', region: 'ZA', description: 'Protection of Personal Information Act (South Africa)' },
  { name: 'PDPB', region: 'IN', description: 'Personal Data Protection Bill (India)' },
  { name: 'Privacy Shield', region: 'US-EU', description: 'EU-US Privacy Shield Framework' },
  { name: 'APEC CBPR', region: 'APAC', description: 'Asia-Pacific Economic Cooperation Cross-Border Privacy Rules' },

  // =========================================================================
  // Security Standards & NIST
  // =========================================================================
  { name: 'NIST CSF', region: 'US', description: 'NIST Cybersecurity Framework' },
  { name: 'NIST CSF 2.0', region: 'US', description: 'Cybersecurity Framework version 2.0' },
  { name: 'NIST 800-171', region: 'US', description: 'Protecting Controlled Unclassified Information' },
  { name: 'NIST 800-63', region: 'US', description: 'Digital Identity Guidelines' },
  { name: 'NIST SP 800-207', region: 'US', description: 'Zero Trust Architecture' },
  { name: 'NIST SP 800-218', region: 'US', description: 'Secure Software Development Framework (SSDF)' },
  { name: 'NIST SP 800-53 Rev 5', region: 'US', description: 'Security and Privacy Controls' },
  { name: 'NIST SP 800-172', region: 'US', description: 'Enhanced security for CUI' },
  { name: 'FIPS 140-3', region: 'US', description: 'Security requirements for cryptographic modules' },

  // =========================================================================
  // Cloud & Technology Frameworks
  // =========================================================================
  { name: 'CSA CCM', region: 'Global', description: 'Cloud Security Alliance Cloud Controls Matrix' },
  { name: 'CSA STAR', region: 'Global', description: 'Cloud Security Alliance Security Trust Assurance Registry' },
  { name: 'CIS Controls', region: 'Global', description: 'Center for Internet Security Critical Security Controls' },
  { name: 'CIS RAM', region: 'Global', description: 'CIS Risk Assessment Method' },
  { name: 'OWASP Top 10', region: 'Global', description: 'Open Web Application Security Project Top 10 Risks' },
  { name: 'OWASP SAMM', region: 'Global', description: 'Software Assurance Maturity Model' },
  { name: 'ASVS', region: 'Global', description: 'Application Security Verification Standard' },
  { name: 'MITRE ATT&CK', region: 'Global', description: 'Knowledge base of adversary tactics' },
  { name: 'MITRE D3FEND', region: 'Global', description: 'Knowledge base of cybersecurity countermeasures' },
  { name: 'SANS Top 20', region: 'Global', description: 'SANS Critical Security Controls' },
  { name: 'BSIMM', region: 'Global', description: 'Building Security In Maturity Model' },
  { name: 'IEEE P2675', region: 'Global', description: 'DevOps standard' },
  { name: 'Common Criteria (ISO 15408)', region: 'Global', description: 'IT security evaluation criteria' },

  // =========================================================================
  // Healthcare & Life Sciences
  // =========================================================================
  { name: 'HITRUST CSF v11', region: 'US', description: 'Health Information Trust Alliance latest version' },
  { name: 'HITECH', region: 'US', description: 'Health Information Technology for Economic and Clinical Health Act' },
  { name: '21 CFR Part 11', region: 'US', description: 'FDA Electronic Records and Signatures' },
  { name: 'FDA 21 CFR Part 820', region: 'US', description: 'Quality System Regulation for medical devices' },
  { name: 'GxP', region: 'Global', description: 'Good Practice Guidelines for Life Sciences' },
  { name: 'EU MDR', region: 'EU', description: 'Medical Device Regulation' },
  { name: 'EU IVDR', region: 'EU', description: 'In Vitro Diagnostic Regulation' },
  { name: 'ICH Guidelines', region: 'Global', description: 'International Council for Harmonisation' },
  { name: 'GAMP 5', region: 'Global', description: 'Good Automated Manufacturing Practice' },
  { name: 'HL7 FHIR Security', region: 'Global', description: 'Healthcare data exchange security' },

  // =========================================================================
  // Financial Services
  // =========================================================================
  { name: 'Basel III', region: 'Global', description: 'International banking regulations' },
  { name: 'PCI DSS v4.0', region: 'Global', description: 'Payment Card Industry Data Security Standard v4.0' },
  { name: 'AICPA SOC 1', region: 'US', description: 'Service Organization Controls for financial reporting' },
  { name: 'AICPA SOC 3', region: 'US', description: 'SOC for Service Organizations Trust Services Report' },
  { name: 'SOX ITGC', region: 'US', description: 'IT General Controls for Sarbanes-Oxley' },
  { name: 'FFIEC CAT', region: 'US', description: 'Cybersecurity Assessment Tool for financial institutions' },
  { name: 'SWIFT CSP', region: 'Global', description: 'SWIFT Customer Security Programme' },
  { name: 'OSFI B-13', region: 'CA', description: 'Technology and Cyber Risk Management' },
  { name: 'APRA CPS 234', region: 'AU', description: 'Information Security regulation for financial institutions' },
  { name: 'MAS TRM', region: 'SG', description: 'Technology Risk Management Guidelines' },
  { name: 'FCA/PRA', region: 'UK', description: 'Financial regulatory compliance' },

  // =========================================================================
  // Government & Defense
  // =========================================================================
  { name: 'ITAR', region: 'US', description: 'International Traffic in Arms Regulations' },
  { name: 'EAR', region: 'US', description: 'Export Administration Regulations' },
  { name: 'DFARS', region: 'US', description: 'Defense Federal Acquisition Regulation Supplement' },
  { name: 'NATO STANAG', region: 'Global', description: 'NATO standardization agreements' },
  { name: 'UK Cyber Essentials', region: 'UK', description: 'UK government-backed cybersecurity certification' },
  { name: 'Cyber Essentials Plus', region: 'UK', description: 'Enhanced UK cyber certification' },
  { name: 'IRAP', region: 'AU', description: 'Information Security Registered Assessors Program' },
  { name: 'PROTECTED (Australia)', region: 'AU', description: 'Australian government security classification' },

  // =========================================================================
  // Industrial, Telecom & Energy
  // =========================================================================
  { name: 'IEC 62443', region: 'Global', description: 'Industrial Automation and Control Systems Security' },
  { name: 'NERC CIP', region: 'US', description: 'North American Electric Reliability Corporation Critical Infrastructure Protection' },
  { name: 'NERC CIP v7', region: 'US', description: 'Critical Infrastructure Protection latest' },
  { name: 'GSMA NESAS', region: 'Global', description: 'Network Equipment Security Assurance Scheme' },
  { name: '3GPP Security', region: 'Global', description: '3rd Generation Partnership Project security' },
  { name: 'IEC 62351', region: 'Global', description: 'Power systems management security' },
  { name: 'TSA Pipeline Security', region: 'US', description: 'TSA cybersecurity directive for pipelines' },

  // =========================================================================
  // Automotive & IoT
  // =========================================================================
  { name: 'ISO/SAE 21434', region: 'Global', description: 'Automotive cybersecurity engineering' },
  { name: 'UNECE WP.29', region: 'Global', description: 'Vehicle cybersecurity regulations' },
  { name: 'ETSI EN 303 645', region: 'EU', description: 'IoT cybersecurity standard' },
  { name: 'IEC 62443-4-1', region: 'Global', description: 'Product security development lifecycle' },
  { name: 'Matter Protocol', region: 'Global', description: 'Smart home connectivity standard security' },

  // =========================================================================
  // Quality & Process Frameworks
  // =========================================================================
  { name: 'ITIL', region: 'Global', description: 'IT Infrastructure Library - IT service management' },
  { name: 'COBIT', region: 'Global', description: 'Control Objectives for Information and Related Technologies' },
  { name: 'CMMI', region: 'Global', description: 'Capability Maturity Model Integration' },
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
