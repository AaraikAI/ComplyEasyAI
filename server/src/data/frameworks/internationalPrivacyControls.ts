import { FrameworkControlTemplate } from './soc2Controls';

/**
 * International Privacy Frameworks
 * PDPA Malaysia, PIPL China, Privacy Shield, APEC CBPR (India DPDPA moved to indiaDpdpaControls.ts)
 */

export const PDPA_MALAYSIA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'PDPA-MY-1.1',
    name: 'General Principle',
    description: 'Process personal data only for lawful purposes directly related to the data user\'s activities and in a manner not incompatible with the purpose.',
    category: 'Data Processing Principles',
    implementationGuidance: 'Define lawful processing purposes. Document relationship to activities. Ensure processing compatibility. Review purposes periodically.',
    evidenceRequirements: ['Purpose documentation', 'Activity relationship records', 'Compatibility assessment', 'Review records'],
    testProcedures: ['Review purposes', 'Verify activity relationship', 'Test compatibility', 'Check reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'PDPA-MY-1.2',
    name: 'Notice and Choice Principle',
    description: 'Inform data subjects of the purpose of processing and their right to access and correct data.',
    category: 'Data Processing Principles',
    implementationGuidance: 'Provide clear notice of processing purposes. Inform of rights. Offer choice where applicable. Document notice provision.',
    evidenceRequirements: ['Notice content', 'Rights disclosure', 'Choice mechanisms', 'Notice records'],
    testProcedures: ['Review notice content', 'Verify rights disclosure', 'Test choice mechanisms', 'Check records'],
    status: 'Not Started'
  },
  {
    controlId: 'PDPA-MY-1.3',
    name: 'Disclosure Principle',
    description: 'Not disclose personal data for purposes other than the purpose disclosed at collection without consent.',
    category: 'Data Processing Principles',
    implementationGuidance: 'Limit disclosures to stated purposes. Obtain consent for new purposes. Track disclosures. Document consent.',
    evidenceRequirements: ['Disclosure controls', 'Consent records', 'Disclosure tracking', 'Documentation'],
    testProcedures: ['Test disclosure controls', 'Verify consent', 'Review tracking', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PDPA-MY-1.4',
    name: 'Security Principle',
    description: 'Take practical steps to protect personal data from loss, misuse, unauthorized access, modification, or disclosure.',
    category: 'Data Security',
    implementationGuidance: 'Implement security measures. Protect against identified risks. Monitor security controls. Update measures as needed.',
    evidenceRequirements: ['Security measures', 'Risk protection', 'Monitoring records', 'Update records'],
    testProcedures: ['Test security measures', 'Verify risk protection', 'Review monitoring', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'PDPA-MY-1.5',
    name: 'Retention Principle',
    description: 'Not retain personal data longer than necessary for the purpose for which it was collected.',
    category: 'Data Retention',
    implementationGuidance: 'Define retention periods. Implement retention enforcement. Delete data when purpose fulfilled. Document retention practices.',
    evidenceRequirements: ['Retention periods', 'Enforcement records', 'Deletion records', 'Practice documentation'],
    testProcedures: ['Review retention periods', 'Test enforcement', 'Verify deletions', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PDPA-MY-1.6',
    name: 'Data Integrity Principle',
    description: 'Take reasonable steps to ensure personal data is accurate, complete, not misleading, and kept up to date.',
    category: 'Data Quality',
    implementationGuidance: 'Implement data accuracy controls. Enable data correction. Verify data quality. Update records appropriately.',
    evidenceRequirements: ['Accuracy controls', 'Correction mechanisms', 'Quality verification', 'Update records'],
    testProcedures: ['Test accuracy controls', 'Verify correction process', 'Review quality', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'PDPA-MY-1.7',
    name: 'Access Principle',
    description: 'Give data subjects access to their personal data and the right to correct data that is inaccurate.',
    category: 'Data Subject Rights',
    implementationGuidance: 'Implement access request process. Enable correction requests. Respond within statutory timeframes.',
    evidenceRequirements: ['Access procedures', 'Correction procedures', 'Response records', 'Timeline compliance'],
    testProcedures: ['Test access process', 'Verify correction process', 'Review responses', 'Check timelines'],
    status: 'Not Started'
  }
];

export const PIPL_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'PIPL-1.1',
    name: 'Lawful Basis for Processing',
    description: 'Establish lawful basis for processing personal information including consent, contract necessity, legal obligation, public interest, or legitimate interests.',
    category: 'Lawful Processing',
    implementationGuidance: 'Identify lawful basis for each processing activity. Document legal basis. Obtain consent where required. Review basis periodically.',
    evidenceRequirements: ['Lawful basis documentation', 'Consent records', 'Legal basis mapping', 'Review records'],
    testProcedures: ['Review legal basis', 'Verify consent', 'Test mapping accuracy', 'Check reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'PIPL-1.2',
    name: 'Separate Consent for Sensitive Information',
    description: 'Obtain separate consent for processing sensitive personal information including biometrics, religious beliefs, health, financial accounts, and location.',
    category: 'Consent',
    implementationGuidance: 'Identify sensitive personal information. Implement separate consent mechanisms. Document consent. Track consent status.',
    evidenceRequirements: ['Sensitive data inventory', 'Consent mechanisms', 'Consent documentation', 'Status tracking'],
    testProcedures: ['Review sensitive data', 'Test consent mechanisms', 'Verify documentation', 'Check tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'PIPL-1.3',
    name: 'Personal Information Rights',
    description: 'Provide individuals with rights to know, access, correct, delete, obtain copy, and withdraw consent regarding their personal information.',
    category: 'Individual Rights',
    implementationGuidance: 'Implement all required rights. Establish request handling procedures. Respond within 15 days. Document all actions.',
    evidenceRequirements: ['Rights implementation', 'Request procedures', 'Response records', 'Action documentation'],
    testProcedures: ['Test rights functionality', 'Verify procedures', 'Review response times', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PIPL-1.4',
    name: 'Cross-Border Transfer Requirements',
    description: 'Meet requirements for cross-border transfer including security assessment, certification, standard contract, or other approved mechanisms.',
    category: 'Data Transfers',
    implementationGuidance: 'Identify cross-border transfers. Apply required transfer mechanism. Conduct assessments where required. Document transfers.',
    evidenceRequirements: ['Transfer identification', 'Mechanism implementation', 'Assessment records', 'Transfer documentation'],
    testProcedures: ['Review transfers', 'Verify mechanisms', 'Test assessments', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PIPL-1.5',
    name: 'Personal Information Impact Assessment',
    description: 'Conduct personal information protection impact assessments for sensitive processing, automated decision-making, and cross-border transfers.',
    category: 'Assessments',
    implementationGuidance: 'Identify high-risk processing. Conduct impact assessments. Document findings. Implement safeguards.',
    evidenceRequirements: ['High-risk identification', 'Assessment documentation', 'Finding records', 'Safeguard implementation'],
    testProcedures: ['Review risk identification', 'Test assessments', 'Verify findings', 'Check safeguards'],
    status: 'Not Started'
  },
  {
    controlId: 'PIPL-1.6',
    name: 'Data Localization',
    description: 'Store personal information collected in China within China, with limited exceptions for cross-border transfer.',
    category: 'Data Storage',
    implementationGuidance: 'Identify data collection in China. Store locally. Document storage locations. Justify any transfers.',
    evidenceRequirements: ['Collection identification', 'Storage location records', 'Location documentation', 'Transfer justification'],
    testProcedures: ['Review collection', 'Verify storage', 'Check documentation', 'Assess justifications'],
    status: 'Not Started'
  }
];

export const PRIVACY_SHIELD_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'PS-1.1',
    name: 'Notice',
    description: 'Provide notice to individuals about data collection purposes, third-party disclosures, rights, and contact information.',
    category: 'Privacy Principles',
    implementationGuidance: 'Develop comprehensive privacy notice. Include all required elements. Make notice accessible. Update as needed.',
    evidenceRequirements: ['Privacy notice', 'Required elements checklist', 'Accessibility verification', 'Update records'],
    testProcedures: ['Review notice content', 'Verify required elements', 'Test accessibility', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'PS-1.2',
    name: 'Choice',
    description: 'Offer choice regarding disclosure to third parties or use for materially different purposes.',
    category: 'Privacy Principles',
    implementationGuidance: 'Implement opt-out mechanisms. Apply before disclosure. Honor choices consistently.',
    evidenceRequirements: ['Opt-out mechanisms', 'Pre-disclosure implementation', 'Choice honoring records'],
    testProcedures: ['Test opt-out', 'Verify timing', 'Check choice compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'PS-1.3',
    name: 'Accountability for Onward Transfer',
    description: 'Ensure third parties receiving data provide same level of protection.',
    category: 'Privacy Principles',
    implementationGuidance: 'Contract with third parties. Require equivalent protection. Monitor compliance.',
    evidenceRequirements: ['Third party contracts', 'Protection requirements', 'Compliance monitoring'],
    testProcedures: ['Review contracts', 'Verify requirements', 'Test monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'PS-1.4',
    name: 'Security',
    description: 'Take reasonable precautions to protect personal data from loss, misuse, unauthorized access, disclosure, alteration, and destruction.',
    category: 'Privacy Principles',
    implementationGuidance: 'Implement security measures. Protect against identified risks. Monitor effectiveness.',
    evidenceRequirements: ['Security measures', 'Risk protection', 'Monitoring records'],
    testProcedures: ['Test security', 'Verify protection', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'PS-1.5',
    name: 'Data Integrity and Purpose Limitation',
    description: 'Limit data to relevant purposes and ensure accuracy.',
    category: 'Privacy Principles',
    implementationGuidance: 'Limit collection to necessary data. Maintain accuracy. Enable correction.',
    evidenceRequirements: ['Collection limitation', 'Accuracy controls', 'Correction mechanisms'],
    testProcedures: ['Test limitation', 'Verify accuracy', 'Check corrections'],
    status: 'Not Started'
  },
  {
    controlId: 'PS-1.6',
    name: 'Access',
    description: 'Provide individuals with access to their personal data and ability to correct, amend, or delete inaccurate data.',
    category: 'Privacy Principles',
    implementationGuidance: 'Implement access request process. Enable corrections. Respond timely.',
    evidenceRequirements: ['Access procedures', 'Correction capability', 'Response records'],
    testProcedures: ['Test access', 'Verify corrections', 'Check responses'],
    status: 'Not Started'
  },
  {
    controlId: 'PS-1.7',
    name: 'Recourse, Enforcement, Liability',
    description: 'Provide mechanisms for handling complaints and disputes.',
    category: 'Privacy Principles',
    implementationGuidance: 'Establish complaint handling. Provide dispute resolution. Cooperate with authorities.',
    evidenceRequirements: ['Complaint procedures', 'Dispute resolution', 'Authority cooperation'],
    testProcedures: ['Test complaint handling', 'Verify resolution', 'Check cooperation'],
    status: 'Not Started'
  }
];

export const APEC_CBPR_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CBPR-1.1',
    name: 'Preventing Harm',
    description: 'Recognize the interests of individuals in preventing misuse of personal information and design privacy protections to prevent harm.',
    category: 'Core Principles',
    implementationGuidance: 'Identify potential harms. Design protective measures. Implement harm prevention. Monitor effectiveness.',
    evidenceRequirements: ['Harm identification', 'Protective measures', 'Prevention implementation', 'Monitoring records'],
    testProcedures: ['Review harm identification', 'Test measures', 'Verify implementation', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.2',
    name: 'Notice',
    description: 'Provide clear and easily accessible statements about privacy practices and policies.',
    category: 'Core Principles',
    implementationGuidance: 'Develop clear privacy statements. Make easily accessible. Cover required topics. Update regularly.',
    evidenceRequirements: ['Privacy statements', 'Accessibility verification', 'Topic coverage', 'Update records'],
    testProcedures: ['Review statements', 'Test accessibility', 'Verify coverage', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.3',
    name: 'Collection Limitation',
    description: 'Limit collection of personal information to that which is relevant to the purposes of collection.',
    category: 'Core Principles',
    implementationGuidance: 'Define collection purposes. Limit to relevant information. Document collection practices. Review periodically.',
    evidenceRequirements: ['Purpose definitions', 'Collection limitations', 'Practice documentation', 'Review records'],
    testProcedures: ['Review purposes', 'Test limitations', 'Verify documentation', 'Check reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.4',
    name: 'Uses of Personal Information',
    description: 'Use personal information only for purposes that fulfill the purposes of collection or compatible purposes.',
    category: 'Core Principles',
    implementationGuidance: 'Use data for stated purposes. Assess compatibility for new uses. Document purpose changes. Notify when appropriate.',
    evidenceRequirements: ['Purpose compliance', 'Compatibility assessments', 'Change documentation', 'Notification records'],
    testProcedures: ['Verify purpose compliance', 'Test compatibility', 'Review documentation', 'Check notifications'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.5',
    name: 'Choice',
    description: 'Provide individuals with choice regarding collection, use, and disclosure of personal information.',
    category: 'Core Principles',
    implementationGuidance: 'Offer meaningful choices. Implement choice mechanisms. Honor choices. Track preferences.',
    evidenceRequirements: ['Choice offerings', 'Choice mechanisms', 'Honoring records', 'Preference tracking'],
    testProcedures: ['Review choices', 'Test mechanisms', 'Verify honoring', 'Check tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.6',
    name: 'Integrity of Personal Information',
    description: 'Maintain accuracy, completeness, and currency of personal information to the extent necessary for purposes of use.',
    category: 'Core Principles',
    implementationGuidance: 'Implement data quality controls. Enable individual corrections. Verify accuracy. Update as needed.',
    evidenceRequirements: ['Quality controls', 'Correction mechanisms', 'Accuracy verification', 'Update records'],
    testProcedures: ['Test quality controls', 'Verify corrections', 'Check accuracy', 'Review updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.7',
    name: 'Security Safeguards',
    description: 'Protect personal information with appropriate safeguards proportional to the likelihood and severity of harm.',
    category: 'Core Principles',
    implementationGuidance: 'Assess risks. Implement proportional safeguards. Monitor effectiveness. Update for changes.',
    evidenceRequirements: ['Risk assessments', 'Safeguard implementation', 'Effectiveness monitoring', 'Update records'],
    testProcedures: ['Review assessments', 'Test safeguards', 'Verify monitoring', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.8',
    name: 'Access and Correction',
    description: 'Provide individuals with access to their personal information and ability to seek correction.',
    category: 'Core Principles',
    implementationGuidance: 'Implement access mechanisms. Enable correction requests. Respond timely. Document actions.',
    evidenceRequirements: ['Access mechanisms', 'Correction capability', 'Response records', 'Action documentation'],
    testProcedures: ['Test access', 'Verify corrections', 'Check responses', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CBPR-1.9',
    name: 'Accountability',
    description: 'Be accountable for complying with privacy principles and for providing remedies when privacy protections fail.',
    category: 'Core Principles',
    implementationGuidance: 'Establish accountability measures. Implement compliance monitoring. Provide remedies. Document accountability.',
    evidenceRequirements: ['Accountability measures', 'Compliance monitoring', 'Remedy mechanisms', 'Accountability documentation'],
    testProcedures: ['Review measures', 'Test monitoring', 'Verify remedies', 'Check documentation'],
    status: 'Not Started'
  }
];
