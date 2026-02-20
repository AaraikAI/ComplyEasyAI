import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Industrial Controls
 * GSMA NESAS, 3GPP Security, IEC 62351, TSA Pipeline Security
 */

export const GSMA_NESAS_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'NESAS-1.1',
    name: 'Secure Development Lifecycle',
    description: 'Implement secure development lifecycle for network equipment.',
    category: 'Development',
    implementationGuidance: 'Define SDL process. Integrate security activities. Document practices. Obtain assessment.',
    evidenceRequirements: ['SDL process', 'Security activities', 'Practice documentation', 'Assessment records'],
    testProcedures: ['Review SDL', 'Verify activities', 'Check documentation', 'Assess assessment'],
    status: 'Not Started'
  },
  {
    controlId: 'NESAS-1.2',
    name: 'Security Requirements',
    description: 'Define security requirements for network products.',
    category: 'Requirements',
    implementationGuidance: 'Define security requirements. Derive from threats. Document requirements. Trace to implementation.',
    evidenceRequirements: ['Security requirements', 'Threat derivation', 'Requirement documentation', 'Traceability'],
    testProcedures: ['Review requirements', 'Verify derivation', 'Check documentation', 'Assess traceability'],
    status: 'Not Started'
  },
  {
    controlId: 'NESAS-2.1',
    name: 'Vulnerability Handling',
    description: 'Implement vulnerability handling process.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Define vulnerability process. Track vulnerabilities. Remediate timely. Communicate to customers.',
    evidenceRequirements: ['Vulnerability process', 'Tracking records', 'Remediation records', 'Customer communications'],
    testProcedures: ['Review process', 'Verify tracking', 'Check remediation', 'Assess communications'],
    status: 'Not Started'
  },
  {
    controlId: 'NESAS-2.2',
    name: 'Product Security Testing',
    description: 'Conduct security testing of network products.',
    category: 'Testing',
    implementationGuidance: 'Define test methodology. Conduct security tests. Document results. Address findings.',
    evidenceRequirements: ['Test methodology', 'Testing records', 'Result documentation', 'Finding remediation'],
    testProcedures: ['Review methodology', 'Verify testing', 'Check documentation', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'NESAS-3.1',
    name: 'NESAS Audit Preparation',
    description: 'Prepare for NESAS audit and certification.',
    category: 'Audit',
    implementationGuidance: 'Prepare evidence. Support auditors. Address findings. Obtain certification.',
    evidenceRequirements: ['Audit evidence', 'Auditor support', 'Finding resolution', 'Certification'],
    testProcedures: ['Review evidence', 'Verify support', 'Check resolution', 'Assess certification'],
    status: 'Not Started'
  }
];

export const THREE_GPP_SECURITY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: '3GPP-33.501',
    name: '5G Security Architecture',
    description: 'Implement 5G security architecture per 3GPP 33.501.',
    category: 'Architecture',
    implementationGuidance: 'Implement security architecture. Configure authentication. Enable encryption. Protect signaling.',
    evidenceRequirements: ['Architecture implementation', 'Authentication configuration', 'Encryption configuration', 'Signaling protection'],
    testProcedures: ['Review architecture', 'Test authentication', 'Verify encryption', 'Check signaling'],
    status: 'Not Started'
  },
  {
    controlId: '3GPP-33.117',
    name: 'Network Element Security',
    description: 'Secure network elements per 3GPP 33.117.',
    category: 'Network Security',
    implementationGuidance: 'Harden network elements. Secure interfaces. Implement logging. Monitor security.',
    evidenceRequirements: ['Element hardening', 'Interface security', 'Logging implementation', 'Security monitoring'],
    testProcedures: ['Test hardening', 'Verify interfaces', 'Check logging', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: '3GPP-33.310',
    name: 'PKI for Network Security',
    description: 'Implement PKI for network security per 3GPP 33.310.',
    category: 'PKI',
    implementationGuidance: 'Deploy PKI infrastructure. Manage certificates. Secure key management. Validate certificates.',
    evidenceRequirements: ['PKI deployment', 'Certificate management', 'Key management', 'Certificate validation'],
    testProcedures: ['Review PKI', 'Verify certificates', 'Check key management', 'Test validation'],
    status: 'Not Started'
  },
  {
    controlId: '3GPP-33.512',
    name: '5G Security Assurance',
    description: 'Achieve 5G security assurance per SCAS requirements.',
    category: 'Assurance',
    implementationGuidance: 'Apply SCAS requirements. Conduct security evaluation. Document compliance. Maintain assurance.',
    evidenceRequirements: ['SCAS application', 'Security evaluation', 'Compliance documentation', 'Assurance maintenance'],
    testProcedures: ['Review SCAS', 'Verify evaluation', 'Check documentation', 'Assess maintenance'],
    status: 'Not Started'
  }
];

export const IEC_62351_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'IEC62351-3',
    name: 'Communication Security',
    description: 'Secure communications using TLS per IEC 62351-3.',
    category: 'Communications',
    implementationGuidance: 'Implement TLS. Configure certificates. Manage cipher suites. Monitor connections.',
    evidenceRequirements: ['TLS implementation', 'Certificate configuration', 'Cipher suite management', 'Connection monitoring'],
    testProcedures: ['Test TLS', 'Verify certificates', 'Check ciphers', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62351-4',
    name: 'MMS Protocol Security',
    description: 'Secure MMS protocol per IEC 62351-4.',
    category: 'Protocol Security',
    implementationGuidance: 'Implement MMS security. Configure authentication. Enable encryption. Document configuration.',
    evidenceRequirements: ['MMS security', 'Authentication configuration', 'Encryption configuration', 'Configuration documentation'],
    testProcedures: ['Test MMS security', 'Verify authentication', 'Check encryption', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62351-5',
    name: 'IEC 60870-5 Security',
    description: 'Secure IEC 60870-5 protocols per IEC 62351-5.',
    category: 'Protocol Security',
    implementationGuidance: 'Implement protocol security. Configure authentication. Implement integrity checks. Document security.',
    evidenceRequirements: ['Protocol security', 'Authentication', 'Integrity checks', 'Security documentation'],
    testProcedures: ['Test protocol', 'Verify authentication', 'Check integrity', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62351-7',
    name: 'Data Object Security',
    description: 'Implement data object security per IEC 62351-7.',
    category: 'Data Security',
    implementationGuidance: 'Secure data objects. Implement access control. Enable monitoring. Document configuration.',
    evidenceRequirements: ['Data object security', 'Access control', 'Monitoring', 'Configuration documentation'],
    testProcedures: ['Test security', 'Verify access control', 'Check monitoring', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62351-8',
    name: 'Role-Based Access Control',
    description: 'Implement RBAC per IEC 62351-8.',
    category: 'Access Control',
    implementationGuidance: 'Define roles. Assign permissions. Implement RBAC. Document role assignments.',
    evidenceRequirements: ['Role definitions', 'Permission assignments', 'RBAC implementation', 'Assignment documentation'],
    testProcedures: ['Review roles', 'Verify permissions', 'Test RBAC', 'Check documentation'],
    status: 'Not Started'
  }
];

export const TSA_PIPELINE_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'TSA-1.1',
    name: 'Cybersecurity Implementation Plan',
    description: 'Develop and implement cybersecurity implementation plan.',
    category: 'Planning',
    implementationGuidance: 'Develop implementation plan. Identify critical systems. Define security measures. Document plan.',
    evidenceRequirements: ['Implementation plan', 'Critical systems', 'Security measures', 'Plan documentation'],
    testProcedures: ['Review plan', 'Verify systems', 'Check measures', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'TSA-1.2',
    name: 'Cybersecurity Coordinator',
    description: 'Designate cybersecurity coordinator.',
    category: 'Governance',
    implementationGuidance: 'Designate coordinator. Define responsibilities. Ensure availability. Document designation.',
    evidenceRequirements: ['Coordinator designation', 'Responsibility definition', 'Availability evidence', 'Designation documentation'],
    testProcedures: ['Verify designation', 'Review responsibilities', 'Check availability', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'TSA-2.1',
    name: 'Network Segmentation',
    description: 'Implement network segmentation for OT systems.',
    category: 'Network Security',
    implementationGuidance: 'Segment IT and OT networks. Control traffic. Monitor connections. Document architecture.',
    evidenceRequirements: ['Network segmentation', 'Traffic controls', 'Connection monitoring', 'Architecture documentation'],
    testProcedures: ['Test segmentation', 'Verify controls', 'Check monitoring', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'TSA-2.2',
    name: 'Access Control',
    description: 'Implement access control for critical systems.',
    category: 'Access Control',
    implementationGuidance: 'Define access policies. Implement controls. Monitor access. Review access regularly.',
    evidenceRequirements: ['Access policies', 'Control implementation', 'Access monitoring', 'Access reviews'],
    testProcedures: ['Review policies', 'Test controls', 'Check monitoring', 'Verify reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'TSA-3.1',
    name: 'Incident Detection and Response',
    description: 'Implement incident detection and response capabilities.',
    category: 'Incident Response',
    implementationGuidance: 'Deploy detection capabilities. Define response procedures. Conduct exercises. Report incidents.',
    evidenceRequirements: ['Detection capabilities', 'Response procedures', 'Exercise records', 'Incident reports'],
    testProcedures: ['Test detection', 'Verify procedures', 'Review exercises', 'Assess reports'],
    status: 'Not Started'
  },
  {
    controlId: 'TSA-3.2',
    name: 'TSA Reporting Requirements',
    description: 'Meet TSA cybersecurity incident reporting requirements.',
    category: 'Reporting',
    implementationGuidance: 'Understand reporting requirements. Define reporting process. Report within timeframes. Maintain records.',
    evidenceRequirements: ['Reporting requirements', 'Reporting process', 'Report submissions', 'Record maintenance'],
    testProcedures: ['Review requirements', 'Verify process', 'Check submissions', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'TSA-4.1',
    name: 'Cybersecurity Assessment',
    description: 'Conduct cybersecurity assessments.',
    category: 'Assessment',
    implementationGuidance: 'Conduct assessments. Identify gaps. Develop remediation plans. Track progress.',
    evidenceRequirements: ['Assessment records', 'Gap identification', 'Remediation plans', 'Progress tracking'],
    testProcedures: ['Review assessments', 'Verify gaps', 'Check plans', 'Assess tracking'],
    status: 'Not Started'
  }
];
