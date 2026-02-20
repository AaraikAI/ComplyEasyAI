import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Automotive & IoT Controls
 * UNECE WP.29, ETSI EN 303 645, IEC 62443-4-1, Matter Protocol Security
 */

export const UNECE_WP29_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'WP29-CSMS-1.1',
    name: 'Cybersecurity Management System',
    description: 'Establish cybersecurity management system for vehicle manufacturers.',
    category: 'CSMS',
    implementationGuidance: 'Define CSMS scope. Assign responsibilities. Implement processes. Document system.',
    evidenceRequirements: ['CSMS scope', 'Responsibility assignments', 'Process documentation', 'System documentation'],
    testProcedures: ['Review scope', 'Verify responsibilities', 'Check processes', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WP29-CSMS-1.2',
    name: 'Risk Assessment for Vehicles',
    description: 'Conduct risk assessment for vehicle cybersecurity.',
    category: 'Risk Management',
    implementationGuidance: 'Identify vehicle assets. Assess threats. Evaluate risks. Document assessment.',
    evidenceRequirements: ['Asset identification', 'Threat assessment', 'Risk evaluation', 'Assessment documentation'],
    testProcedures: ['Review assets', 'Verify threats', 'Check risks', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WP29-CSMS-2.1',
    name: 'Security by Design',
    description: 'Implement security by design in vehicle development.',
    category: 'Design Security',
    implementationGuidance: 'Integrate security in design. Apply security controls. Verify implementation. Document design.',
    evidenceRequirements: ['Security integration', 'Control application', 'Implementation verification', 'Design documentation'],
    testProcedures: ['Review integration', 'Test controls', 'Verify implementation', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WP29-CSMS-2.2',
    name: 'Threat Intelligence',
    description: 'Maintain awareness of cybersecurity threats to vehicles.',
    category: 'Threat Intelligence',
    implementationGuidance: 'Monitor threat landscape. Analyze threats. Share intelligence. Document threats.',
    evidenceRequirements: ['Threat monitoring', 'Threat analysis', 'Intelligence sharing', 'Threat documentation'],
    testProcedures: ['Review monitoring', 'Verify analysis', 'Check sharing', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WP29-CSMS-3.1',
    name: 'Incident Response for Vehicles',
    description: 'Establish incident response capabilities for vehicle cybersecurity.',
    category: 'Incident Response',
    implementationGuidance: 'Define incident procedures. Establish response team. Conduct exercises. Document incidents.',
    evidenceRequirements: ['Incident procedures', 'Response team', 'Exercise records', 'Incident documentation'],
    testProcedures: ['Review procedures', 'Verify team', 'Check exercises', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WP29-SUMS-1.1',
    name: 'Software Update Management System',
    description: 'Establish software update management system for vehicles.',
    category: 'SUMS',
    implementationGuidance: 'Define update process. Secure updates. Verify integrity. Document updates.',
    evidenceRequirements: ['Update process', 'Update security', 'Integrity verification', 'Update documentation'],
    testProcedures: ['Review process', 'Test security', 'Verify integrity', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WP29-SUMS-1.2',
    name: 'OTA Update Security',
    description: 'Secure over-the-air updates for vehicles.',
    category: 'Update Security',
    implementationGuidance: 'Implement secure OTA. Authenticate updates. Verify integrity. Enable rollback.',
    evidenceRequirements: ['OTA implementation', 'Update authentication', 'Integrity verification', 'Rollback capability'],
    testProcedures: ['Test OTA', 'Verify authentication', 'Check integrity', 'Test rollback'],
    status: 'Not Started'
  }
];

export const ETSI_EN_303_645_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ETSI-1',
    name: 'No Universal Default Passwords',
    description: 'Eliminate universal default passwords.',
    category: 'Authentication',
    implementationGuidance: 'Use unique passwords. Require password change. Prevent simple passwords. Document approach.',
    evidenceRequirements: ['Unique password implementation', 'Password change requirement', 'Password complexity', 'Approach documentation'],
    testProcedures: ['Test uniqueness', 'Verify change requirement', 'Check complexity', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-2',
    name: 'Vulnerability Disclosure Policy',
    description: 'Implement means to manage reports of vulnerabilities.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Create disclosure policy. Provide contact point. Acknowledge reports. Act on reports.',
    evidenceRequirements: ['Disclosure policy', 'Contact point', 'Acknowledgment process', 'Action records'],
    testProcedures: ['Review policy', 'Verify contact', 'Check acknowledgment', 'Assess actions'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-3',
    name: 'Keep Software Updated',
    description: 'Keep software securely updated.',
    category: 'Software Updates',
    implementationGuidance: 'Implement update mechanism. Secure updates. Notify users. Document policy.',
    evidenceRequirements: ['Update mechanism', 'Update security', 'User notifications', 'Policy documentation'],
    testProcedures: ['Test mechanism', 'Verify security', 'Check notifications', 'Review policy'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-4',
    name: 'Securely Store Credentials',
    description: 'Securely store sensitive security parameters.',
    category: 'Credential Storage',
    implementationGuidance: 'Protect credentials. Use secure storage. Encrypt sensitive data. Document storage.',
    evidenceRequirements: ['Credential protection', 'Secure storage', 'Encryption implementation', 'Storage documentation'],
    testProcedures: ['Test protection', 'Verify storage', 'Check encryption', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-5',
    name: 'Communicate Securely',
    description: 'Communicate securely using appropriate technologies.',
    category: 'Communications',
    implementationGuidance: 'Implement secure protocols. Encrypt communications. Validate certificates. Document security.',
    evidenceRequirements: ['Secure protocols', 'Communication encryption', 'Certificate validation', 'Security documentation'],
    testProcedures: ['Test protocols', 'Verify encryption', 'Check validation', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-6',
    name: 'Minimize Attack Surface',
    description: 'Minimize exposed attack surfaces.',
    category: 'Attack Surface',
    implementationGuidance: 'Disable unused features. Close unused ports. Remove debug interfaces. Document configuration.',
    evidenceRequirements: ['Feature configuration', 'Port configuration', 'Debug interface status', 'Configuration documentation'],
    testProcedures: ['Verify features', 'Check ports', 'Test debug interfaces', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-7',
    name: 'Ensure Software Integrity',
    description: 'Ensure integrity of software using secure boot or other mechanisms.',
    category: 'Software Integrity',
    implementationGuidance: 'Implement secure boot. Verify software integrity. Detect tampering. Document mechanisms.',
    evidenceRequirements: ['Secure boot', 'Integrity verification', 'Tamper detection', 'Mechanism documentation'],
    testProcedures: ['Test secure boot', 'Verify integrity', 'Test detection', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-8',
    name: 'Ensure Personal Data Protection',
    description: 'Ensure that personal data is protected.',
    category: 'Data Protection',
    implementationGuidance: 'Identify personal data. Protect data. Enable data deletion. Document protection.',
    evidenceRequirements: ['Data identification', 'Data protection', 'Deletion capability', 'Protection documentation'],
    testProcedures: ['Review identification', 'Test protection', 'Verify deletion', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ETSI-9',
    name: 'Make Systems Resilient to Outages',
    description: 'Make systems resilient to outages.',
    category: 'Resilience',
    implementationGuidance: 'Design for resilience. Handle connection loss. Recover gracefully. Document behavior.',
    evidenceRequirements: ['Resilience design', 'Connection handling', 'Recovery mechanisms', 'Behavior documentation'],
    testProcedures: ['Test resilience', 'Verify handling', 'Check recovery', 'Review documentation'],
    status: 'Not Started'
  }
];

export const IEC_62443_4_1_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'IEC62443-4-1-SM',
    name: 'Security Management',
    description: 'Establish security management for product development.',
    category: 'Security Management',
    implementationGuidance: 'Define security policy. Assign responsibilities. Allocate resources. Document management.',
    evidenceRequirements: ['Security policy', 'Responsibility assignments', 'Resource allocation', 'Management documentation'],
    testProcedures: ['Review policy', 'Verify responsibilities', 'Check resources', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62443-4-1-SR',
    name: 'Specification of Security Requirements',
    description: 'Specify security requirements for products.',
    category: 'Requirements',
    implementationGuidance: 'Define security requirements. Derive from threats. Document requirements. Trace to design.',
    evidenceRequirements: ['Security requirements', 'Threat analysis', 'Requirement documentation', 'Traceability matrix'],
    testProcedures: ['Review requirements', 'Verify threats', 'Check documentation', 'Assess traceability'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62443-4-1-SD',
    name: 'Secure by Design',
    description: 'Implement secure design practices.',
    category: 'Design',
    implementationGuidance: 'Apply secure design principles. Conduct threat modeling. Document design decisions. Review security.',
    evidenceRequirements: ['Design principles', 'Threat models', 'Design documentation', 'Security reviews'],
    testProcedures: ['Review principles', 'Verify modeling', 'Check documentation', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62443-4-1-SI',
    name: 'Secure Implementation',
    description: 'Implement secure coding practices.',
    category: 'Implementation',
    implementationGuidance: 'Apply secure coding standards. Review code. Use static analysis. Document practices.',
    evidenceRequirements: ['Coding standards', 'Code reviews', 'Static analysis', 'Practice documentation'],
    testProcedures: ['Review standards', 'Verify reviews', 'Check analysis', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62443-4-1-SVV',
    name: 'Security Verification and Validation',
    description: 'Verify and validate security requirements.',
    category: 'Verification',
    implementationGuidance: 'Plan security testing. Execute tests. Document results. Address findings.',
    evidenceRequirements: ['Test plans', 'Test execution', 'Result documentation', 'Finding remediation'],
    testProcedures: ['Review plans', 'Verify execution', 'Check documentation', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62443-4-1-DM',
    name: 'Defect Management',
    description: 'Manage security defects throughout lifecycle.',
    category: 'Defect Management',
    implementationGuidance: 'Track security defects. Prioritize remediation. Verify fixes. Document process.',
    evidenceRequirements: ['Defect tracking', 'Remediation prioritization', 'Fix verification', 'Process documentation'],
    testProcedures: ['Review tracking', 'Verify prioritization', 'Check verification', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'IEC62443-4-1-SUM',
    name: 'Security Update Management',
    description: 'Manage security updates for products.',
    category: 'Update Management',
    implementationGuidance: 'Define update process. Develop updates. Test updates. Deploy securely.',
    evidenceRequirements: ['Update process', 'Update development', 'Update testing', 'Deployment records'],
    testProcedures: ['Review process', 'Verify development', 'Check testing', 'Assess deployment'],
    status: 'Not Started'
  }
];

export const MATTER_PROTOCOL_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MATTER-1.1',
    name: 'Device Attestation',
    description: 'Implement device attestation for Matter devices.',
    category: 'Attestation',
    implementationGuidance: 'Implement DAC. Use certified attestation. Validate attestation. Document process.',
    evidenceRequirements: ['DAC implementation', 'Attestation certificates', 'Validation process', 'Process documentation'],
    testProcedures: ['Test DAC', 'Verify certificates', 'Check validation', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MATTER-1.2',
    name: 'Secure Commissioning',
    description: 'Implement secure commissioning process.',
    category: 'Commissioning',
    implementationGuidance: 'Implement PASE. Support commissioning methods. Validate devices. Document commissioning.',
    evidenceRequirements: ['PASE implementation', 'Commissioning methods', 'Device validation', 'Commissioning documentation'],
    testProcedures: ['Test PASE', 'Verify methods', 'Check validation', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MATTER-2.1',
    name: 'Secure Communication',
    description: 'Implement secure communication between Matter devices.',
    category: 'Communication',
    implementationGuidance: 'Implement CASE. Use encryption. Validate sessions. Document security.',
    evidenceRequirements: ['CASE implementation', 'Encryption configuration', 'Session validation', 'Security documentation'],
    testProcedures: ['Test CASE', 'Verify encryption', 'Check sessions', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MATTER-2.2',
    name: 'Access Control',
    description: 'Implement access control for Matter devices.',
    category: 'Access Control',
    implementationGuidance: 'Define ACL. Implement permissions. Enforce controls. Document access control.',
    evidenceRequirements: ['ACL definition', 'Permission implementation', 'Control enforcement', 'Access control documentation'],
    testProcedures: ['Review ACL', 'Test permissions', 'Verify enforcement', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MATTER-3.1',
    name: 'Fabric Management',
    description: 'Manage Matter fabric securely.',
    category: 'Fabric Management',
    implementationGuidance: 'Manage fabric membership. Control fabric operations. Secure fabric data. Document management.',
    evidenceRequirements: ['Membership management', 'Operation controls', 'Data security', 'Management documentation'],
    testProcedures: ['Review membership', 'Test operations', 'Verify security', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MATTER-3.2',
    name: 'OTA Updates for Matter',
    description: 'Implement secure OTA updates for Matter devices.',
    category: 'Updates',
    implementationGuidance: 'Implement Matter OTA. Verify update integrity. Secure distribution. Document process.',
    evidenceRequirements: ['OTA implementation', 'Integrity verification', 'Distribution security', 'Process documentation'],
    testProcedures: ['Test OTA', 'Verify integrity', 'Check distribution', 'Review documentation'],
    status: 'Not Started'
  }
];
