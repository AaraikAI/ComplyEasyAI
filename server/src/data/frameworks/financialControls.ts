import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Financial Sector Frameworks
 * Basel III, SOC 3, SOX ITGC, FFIEC CAT, SWIFT CSP, OSFI B-13, APRA CPS 234, MAS TRM, FCA/PRA
 */

export const BASEL_III_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'BASEL-1.1',
    name: 'Operational Risk Management',
    description: 'Establish comprehensive operational risk management framework covering identification, assessment, monitoring, and control.',
    category: 'Operational Risk',
    implementationGuidance: 'Define operational risk framework. Identify risk categories. Assess and measure risks. Implement controls.',
    evidenceRequirements: ['Risk framework', 'Risk identification', 'Risk assessment', 'Control documentation'],
    testProcedures: ['Review framework', 'Verify identification', 'Test assessment', 'Check controls'],
    status: 'Not Started'
  },
  {
    controlId: 'BASEL-1.2',
    name: 'Cyber Risk Management',
    description: 'Include cyber risk within operational risk framework with specific controls and monitoring.',
    category: 'Operational Risk',
    implementationGuidance: 'Identify cyber risks. Implement cyber controls. Monitor cyber threats. Report cyber incidents.',
    evidenceRequirements: ['Cyber risk identification', 'Control implementation', 'Threat monitoring', 'Incident reporting'],
    testProcedures: ['Review cyber risks', 'Test controls', 'Verify monitoring', 'Check reporting'],
    status: 'Not Started'
  },
  {
    controlId: 'BASEL-2.1',
    name: 'Pillar 3 Disclosure',
    description: 'Provide required disclosures for operational risk including cyber risk exposure.',
    category: 'Disclosure',
    implementationGuidance: 'Prepare Pillar 3 disclosures. Include operational risk. Document cyber exposure. Publish as required.',
    evidenceRequirements: ['Pillar 3 reports', 'Operational risk disclosure', 'Cyber exposure documentation', 'Publication records'],
    testProcedures: ['Review disclosures', 'Verify content', 'Check cyber coverage', 'Confirm publication'],
    status: 'Not Started'
  }
];

export const SOC3_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'SOC3-1.1',
    name: 'Trust Services Criteria - Security',
    description: 'Implement controls to protect information and systems from unauthorized access.',
    category: 'Security',
    implementationGuidance: 'Implement security controls. Protect system boundaries. Control access. Monitor security.',
    evidenceRequirements: ['Security controls', 'Boundary protection', 'Access controls', 'Security monitoring'],
    testProcedures: ['Test security', 'Verify boundaries', 'Check access', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SOC3-1.2',
    name: 'Trust Services Criteria - Availability',
    description: 'Ensure systems are available for operation and use as committed.',
    category: 'Availability',
    implementationGuidance: 'Define availability commitments. Implement redundancy. Monitor availability. Respond to incidents.',
    evidenceRequirements: ['Availability commitments', 'Redundancy implementation', 'Availability monitoring', 'Incident response'],
    testProcedures: ['Review commitments', 'Test redundancy', 'Check monitoring', 'Assess response'],
    status: 'Not Started'
  },
  {
    controlId: 'SOC3-1.3',
    name: 'Trust Services Criteria - Confidentiality',
    description: 'Protect confidential information as committed.',
    category: 'Confidentiality',
    implementationGuidance: 'Classify information. Protect confidential data. Control access. Monitor for breaches.',
    evidenceRequirements: ['Classification scheme', 'Data protection', 'Access controls', 'Breach monitoring'],
    testProcedures: ['Review classification', 'Test protection', 'Verify access', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SOC3-1.4',
    name: 'SOC 3 Report Seal',
    description: 'Obtain and display SOC 3 seal demonstrating compliance.',
    category: 'Reporting',
    implementationGuidance: 'Complete SOC 2 examination. Obtain SOC 3 report. Display seal appropriately. Maintain compliance.',
    evidenceRequirements: ['SOC 2 examination', 'SOC 3 report', 'Seal display', 'Compliance maintenance'],
    testProcedures: ['Verify examination', 'Review report', 'Check seal display', 'Assess maintenance'],
    status: 'Not Started'
  }
];

export const SOX_ITGC_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ITGC-1.1',
    name: 'Access to Programs and Data',
    description: 'Control access to programs and data to ensure only authorized individuals can access financial systems.',
    category: 'Access Controls',
    implementationGuidance: 'Implement access controls. Manage user provisioning. Review access periodically. Document access grants.',
    evidenceRequirements: ['Access control implementation', 'Provisioning records', 'Access reviews', 'Grant documentation'],
    testProcedures: ['Test access controls', 'Verify provisioning', 'Check reviews', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITGC-1.2',
    name: 'Program Changes',
    description: 'Control changes to programs to ensure only authorized changes are made to financial systems.',
    category: 'Change Management',
    implementationGuidance: 'Implement change management. Require approvals. Test changes. Document changes.',
    evidenceRequirements: ['Change management process', 'Approval records', 'Testing records', 'Change documentation'],
    testProcedures: ['Test change management', 'Verify approvals', 'Check testing', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITGC-1.3',
    name: 'Program Development',
    description: 'Control development of new programs to ensure proper authorization and testing.',
    category: 'Development',
    implementationGuidance: 'Implement SDLC. Require authorization. Conduct testing. Document development.',
    evidenceRequirements: ['SDLC documentation', 'Authorization records', 'Testing records', 'Development documentation'],
    testProcedures: ['Review SDLC', 'Verify authorization', 'Check testing', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITGC-1.4',
    name: 'Computer Operations',
    description: 'Control computer operations including job scheduling, backup, and recovery.',
    category: 'Operations',
    implementationGuidance: 'Implement job scheduling. Conduct backups. Test recovery. Monitor operations.',
    evidenceRequirements: ['Job scheduling', 'Backup records', 'Recovery testing', 'Operations monitoring'],
    testProcedures: ['Test scheduling', 'Verify backups', 'Test recovery', 'Check monitoring'],
    status: 'Not Started'
  }
];

export const FFIEC_CAT_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'FFIEC-1.1',
    name: 'Cyber Risk Management',
    description: 'Implement comprehensive cyber risk management program.',
    category: 'Risk Management',
    implementationGuidance: 'Develop risk management program. Identify cyber risks. Assess vulnerabilities. Implement controls.',
    evidenceRequirements: ['Risk management program', 'Risk identification', 'Vulnerability assessment', 'Control implementation'],
    testProcedures: ['Review program', 'Verify identification', 'Test assessment', 'Check controls'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.2',
    name: 'Threat Intelligence and Collaboration',
    description: 'Participate in threat intelligence sharing and collaboration.',
    category: 'Threat Intelligence',
    implementationGuidance: 'Join intelligence sharing groups. Receive threat intelligence. Share information appropriately. Act on intelligence.',
    evidenceRequirements: ['Sharing group membership', 'Intelligence received', 'Information shared', 'Action records'],
    testProcedures: ['Verify membership', 'Check intelligence', 'Review sharing', 'Assess actions'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.3',
    name: 'Cybersecurity Controls',
    description: 'Implement cybersecurity controls appropriate to inherent risk profile.',
    category: 'Controls',
    implementationGuidance: 'Assess inherent risk. Implement appropriate controls. Monitor control effectiveness. Update as needed.',
    evidenceRequirements: ['Risk assessment', 'Control implementation', 'Effectiveness monitoring', 'Update records'],
    testProcedures: ['Review assessment', 'Test controls', 'Verify monitoring', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.4',
    name: 'External Dependency Management',
    description: 'Manage cybersecurity risks from external dependencies and third parties.',
    category: 'Third Party',
    implementationGuidance: 'Identify external dependencies. Assess third-party risks. Implement controls. Monitor relationships.',
    evidenceRequirements: ['Dependency inventory', 'Risk assessment', 'Control documentation', 'Monitoring records'],
    testProcedures: ['Review inventory', 'Test assessment', 'Verify controls', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.5',
    name: 'Cyber Incident Management and Resilience',
    description: 'Implement incident management and cyber resilience capabilities.',
    category: 'Incident Response',
    implementationGuidance: 'Develop incident response plan. Test plan regularly. Implement resilience measures. Learn from incidents.',
    evidenceRequirements: ['Response plan', 'Testing records', 'Resilience measures', 'Lessons learned'],
    testProcedures: ['Review plan', 'Verify testing', 'Test resilience', 'Check lessons learned'],
    status: 'Not Started'
  }
];

export const SWIFT_CSP_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'SWIFT-1.1',
    name: 'Restrict Internet Access',
    description: 'Protect the SWIFT environment by restricting internet access.',
    category: 'Secure Environment',
    implementationGuidance: 'Segment SWIFT environment. Restrict internet access. Implement firewalls. Monitor traffic.',
    evidenceRequirements: ['Segmentation documentation', 'Access restrictions', 'Firewall configuration', 'Traffic monitoring'],
    testProcedures: ['Test segmentation', 'Verify restrictions', 'Check firewalls', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-1.2',
    name: 'Reduce Attack Surface',
    description: 'Reduce the attack surface of SWIFT-related systems.',
    category: 'Secure Environment',
    implementationGuidance: 'Harden systems. Remove unnecessary services. Patch regularly. Document configurations.',
    evidenceRequirements: ['Hardening documentation', 'Service inventory', 'Patch records', 'Configuration documentation'],
    testProcedures: ['Test hardening', 'Verify services', 'Check patches', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-2.1',
    name: 'Operator Authentication',
    description: 'Implement strong authentication for SWIFT operators.',
    category: 'Know and Limit Access',
    implementationGuidance: 'Implement MFA. Manage operator accounts. Review access regularly. Enforce separation of duties.',
    evidenceRequirements: ['MFA implementation', 'Account management', 'Access reviews', 'Separation of duties'],
    testProcedures: ['Test MFA', 'Verify account management', 'Check reviews', 'Assess separation'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-3.1',
    name: 'Security Training',
    description: 'Provide security awareness training for SWIFT operators.',
    category: 'Detect and Respond',
    implementationGuidance: 'Develop training program. Train all operators. Track completion. Update training.',
    evidenceRequirements: ['Training program', 'Training records', 'Completion tracking', 'Update records'],
    testProcedures: ['Review program', 'Verify training', 'Check completion', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-3.2',
    name: 'Transaction Monitoring',
    description: 'Monitor SWIFT transactions for anomalies and fraud.',
    category: 'Detect and Respond',
    implementationGuidance: 'Implement transaction monitoring. Define anomaly rules. Alert on suspicious activity. Investigate alerts.',
    evidenceRequirements: ['Monitoring implementation', 'Anomaly rules', 'Alert records', 'Investigation records'],
    testProcedures: ['Test monitoring', 'Verify rules', 'Check alerts', 'Review investigations'],
    status: 'Not Started'
  }
];

export const OSFI_B13_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'OSFI-1.1',
    name: 'Technology and Cyber Risk Governance',
    description: 'Establish governance framework for technology and cyber risk.',
    category: 'Governance',
    implementationGuidance: 'Define governance structure. Assign responsibilities. Report to board. Document framework.',
    evidenceRequirements: ['Governance structure', 'Responsibility assignments', 'Board reporting', 'Framework documentation'],
    testProcedures: ['Review governance', 'Verify responsibilities', 'Check reporting', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'OSFI-1.2',
    name: 'Technology and Cyber Risk Strategy',
    description: 'Develop strategy for managing technology and cyber risk.',
    category: 'Strategy',
    implementationGuidance: 'Develop risk strategy. Align with business strategy. Implement strategy. Review periodically.',
    evidenceRequirements: ['Risk strategy', 'Business alignment', 'Implementation records', 'Review records'],
    testProcedures: ['Review strategy', 'Verify alignment', 'Check implementation', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'OSFI-2.1',
    name: 'Technology and Cyber Risk Management',
    description: 'Implement comprehensive technology and cyber risk management.',
    category: 'Risk Management',
    implementationGuidance: 'Identify risks. Assess risks. Implement controls. Monitor effectiveness.',
    evidenceRequirements: ['Risk identification', 'Risk assessment', 'Control implementation', 'Effectiveness monitoring'],
    testProcedures: ['Review identification', 'Test assessment', 'Verify controls', 'Check monitoring'],
    status: 'Not Started'
  }
];

export const APRA_CPS234_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CPS234-1.1',
    name: 'Information Security Capability',
    description: 'Maintain information security capability commensurate with size and extent of threats.',
    category: 'Security Capability',
    implementationGuidance: 'Assess threat landscape. Build security capability. Maintain resources. Update as threats evolve.',
    evidenceRequirements: ['Threat assessment', 'Capability documentation', 'Resource allocation', 'Update records'],
    testProcedures: ['Review threats', 'Test capability', 'Verify resources', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-1.2',
    name: 'Board and Senior Management Accountability',
    description: 'Ensure board and senior management accountability for information security.',
    category: 'Governance',
    implementationGuidance: 'Define board responsibilities. Establish management accountability. Report to board. Document decisions.',
    evidenceRequirements: ['Board responsibilities', 'Management accountability', 'Board reports', 'Decision records'],
    testProcedures: ['Review responsibilities', 'Verify accountability', 'Check reports', 'Assess decisions'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-2.1',
    name: 'Information Asset Identification',
    description: 'Identify and classify information assets based on criticality and sensitivity.',
    category: 'Asset Management',
    implementationGuidance: 'Identify information assets. Classify by criticality. Document sensitivity. Maintain inventory.',
    evidenceRequirements: ['Asset identification', 'Classification records', 'Sensitivity documentation', 'Asset inventory'],
    testProcedures: ['Review assets', 'Verify classification', 'Check sensitivity', 'Test inventory'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-3.1',
    name: 'Third Party Information Security',
    description: 'Manage information security risks from third party arrangements.',
    category: 'Third Party',
    implementationGuidance: 'Assess third party risks. Include security requirements. Monitor compliance. Address issues.',
    evidenceRequirements: ['Risk assessment', 'Security requirements', 'Compliance monitoring', 'Issue resolution'],
    testProcedures: ['Test assessment', 'Verify requirements', 'Check monitoring', 'Review resolution'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-4.1',
    name: 'Incident Notification to APRA',
    description: 'Notify APRA of material information security incidents.',
    category: 'Incident Response',
    implementationGuidance: 'Define materiality criteria. Establish notification process. Notify within timeframes. Document notifications.',
    evidenceRequirements: ['Materiality criteria', 'Notification process', 'Timeline compliance', 'Notification records'],
    testProcedures: ['Review criteria', 'Test process', 'Verify timelines', 'Check records'],
    status: 'Not Started'
  }
];

export const MAS_TRM_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MAS-1.1',
    name: 'Technology Risk Governance',
    description: 'Establish robust governance for technology risk management.',
    category: 'Governance',
    implementationGuidance: 'Define governance structure. Assign responsibilities. Report to board. Maintain oversight.',
    evidenceRequirements: ['Governance structure', 'Responsibilities', 'Board reports', 'Oversight records'],
    testProcedures: ['Review governance', 'Verify responsibilities', 'Check reports', 'Assess oversight'],
    status: 'Not Started'
  },
  {
    controlId: 'MAS-1.2',
    name: 'Technology Risk Management Framework',
    description: 'Implement comprehensive technology risk management framework.',
    category: 'Risk Management',
    implementationGuidance: 'Develop framework. Identify risks. Assess and prioritize. Implement controls.',
    evidenceRequirements: ['Framework documentation', 'Risk identification', 'Risk assessment', 'Control implementation'],
    testProcedures: ['Review framework', 'Test identification', 'Verify assessment', 'Check controls'],
    status: 'Not Started'
  },
  {
    controlId: 'MAS-2.1',
    name: 'Cyber Security',
    description: 'Implement robust cyber security measures.',
    category: 'Cyber Security',
    implementationGuidance: 'Assess cyber threats. Implement security controls. Monitor for threats. Respond to incidents.',
    evidenceRequirements: ['Threat assessment', 'Security controls', 'Threat monitoring', 'Incident response'],
    testProcedures: ['Review threats', 'Test controls', 'Verify monitoring', 'Check response'],
    status: 'Not Started'
  },
  {
    controlId: 'MAS-3.1',
    name: 'IT Outsourcing Risk Management',
    description: 'Manage risks from IT outsourcing arrangements.',
    category: 'Outsourcing',
    implementationGuidance: 'Assess outsourcing risks. Conduct due diligence. Monitor performance. Address issues.',
    evidenceRequirements: ['Risk assessment', 'Due diligence records', 'Performance monitoring', 'Issue resolution'],
    testProcedures: ['Review assessment', 'Verify due diligence', 'Check monitoring', 'Assess resolution'],
    status: 'Not Started'
  }
];

export const FCA_PRA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'FCA-1.1',
    name: 'Operational Resilience',
    description: 'Ensure operational resilience for important business services.',
    category: 'Operational Resilience',
    implementationGuidance: 'Identify important services. Set impact tolerances. Test resilience. Maintain capabilities.',
    evidenceRequirements: ['Service identification', 'Impact tolerances', 'Testing records', 'Capability documentation'],
    testProcedures: ['Review services', 'Verify tolerances', 'Test resilience', 'Check capabilities'],
    status: 'Not Started'
  },
  {
    controlId: 'FCA-1.2',
    name: 'Outsourcing and Third Party Risk',
    description: 'Manage risks from outsourcing and third party arrangements.',
    category: 'Third Party',
    implementationGuidance: 'Conduct due diligence. Include contractual protections. Monitor performance. Maintain oversight.',
    evidenceRequirements: ['Due diligence records', 'Contract terms', 'Performance monitoring', 'Oversight records'],
    testProcedures: ['Test due diligence', 'Verify contracts', 'Check monitoring', 'Assess oversight'],
    status: 'Not Started'
  },
  {
    controlId: 'FCA-2.1',
    name: 'Senior Managers and Certification Regime',
    description: 'Implement SM&CR for senior management accountability.',
    category: 'Governance',
    implementationGuidance: 'Identify senior managers. Define responsibilities. Maintain statements. Conduct certifications.',
    evidenceRequirements: ['Senior manager identification', 'Responsibility statements', 'Statement records', 'Certification records'],
    testProcedures: ['Review identification', 'Verify statements', 'Check records', 'Assess certifications'],
    status: 'Not Started'
  }
];
