/**
 * US State Privacy Law Controls
 *
 * Combined controls for major US state privacy laws:
 * - VCDPA (Virginia Consumer Data Protection Act)
 * - CPA (Colorado Privacy Act)
 * - CTDPA (Connecticut Data Privacy Act)
 * - UCPA (Utah Consumer Privacy Act)
 * - TDPSA (Texas Data Privacy and Security Act)
 */

import type { FrameworkControlTemplate } from './soc2Controls';

// Virginia Consumer Data Protection Act (VCDPA)
export const VCDPA_CONTROLS: FrameworkControlTemplate[] = [
  // Consumer Rights
  {
    controlId: 'VCDPA-CR-1',
    name: 'Right to Access',
    description: 'Enable consumers to confirm whether a controller is processing their personal data and to access such personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement data access request mechanism. Verify consumer identity. Provide data in portable format. Respond within 45 days.',
    evidenceRequirements: [
      'Access request procedures',
      'Identity verification process',
      'Data export capabilities',
      'Response tracking',
    ],
    testProcedures: [
      'Test access request process',
      'Verify identity verification',
      'Check data portability',
      'Audit response times',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CR-2',
    name: 'Right to Correction',
    description: 'Enable consumers to correct inaccuracies in their personal data, taking into account the nature of the data and purposes of processing.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement correction request mechanism. Verify consumer identity. Process corrections. Notify third parties of corrections.',
    evidenceRequirements: [
      'Correction request procedures',
      'Verification process',
      'Correction records',
      'Third-party notifications',
    ],
    testProcedures: [
      'Test correction process',
      'Verify identity checks',
      'Review correction records',
      'Check notifications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CR-3',
    name: 'Right to Deletion',
    description: 'Enable consumers to delete personal data provided by or obtained about the consumer.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement deletion request mechanism. Verify consumer identity. Execute deletions. Document exceptions.',
    evidenceRequirements: [
      'Deletion request procedures',
      'Identity verification',
      'Deletion records',
      'Exception documentation',
    ],
    testProcedures: [
      'Test deletion process',
      'Verify identity checks',
      'Confirm data removal',
      'Review exceptions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CR-4',
    name: 'Right to Data Portability',
    description: 'Provide consumers with personal data in a portable and readily usable format that allows transmission to another controller.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement data export functionality. Use machine-readable formats. Enable direct transmission when feasible. Document formats used.',
    evidenceRequirements: [
      'Export procedures',
      'Format documentation',
      'Transmission capabilities',
      'Export records',
    ],
    testProcedures: [
      'Test export functionality',
      'Verify format usability',
      'Check transmission options',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CR-5',
    name: 'Right to Opt Out of Targeted Advertising',
    description: 'Allow consumers to opt out of the processing of personal data for purposes of targeted advertising.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanism. Honor opt-out requests. Maintain opt-out records. Cease targeted advertising after opt-out.',
    evidenceRequirements: [
      'Opt-out mechanism',
      'Request processing records',
      'Opt-out status tracking',
      'Compliance verification',
    ],
    testProcedures: [
      'Test opt-out mechanism',
      'Verify request processing',
      'Check status tracking',
      'Confirm compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CR-6',
    name: 'Right to Opt Out of Sale',
    description: 'Allow consumers to opt out of the sale of their personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement sale opt-out mechanism. Honor opt-out requests. Cease data sales after opt-out. Maintain records.',
    evidenceRequirements: [
      'Opt-out mechanism',
      'Processing procedures',
      'Sale cessation verification',
      'Opt-out records',
    ],
    testProcedures: [
      'Test opt-out mechanism',
      'Verify processing',
      'Confirm sale cessation',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CR-7',
    name: 'Right to Opt Out of Profiling',
    description: 'Allow consumers to opt out of profiling in furtherance of decisions that produce legal or similarly significant effects.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement profiling opt-out mechanism. Identify profiling activities. Honor opt-out requests. Document decisions.',
    evidenceRequirements: [
      'Opt-out mechanism',
      'Profiling activity inventory',
      'Request processing',
      'Decision documentation',
    ],
    testProcedures: [
      'Test opt-out mechanism',
      'Review profiling inventory',
      'Verify request processing',
      'Audit decisions',
    ],
    status: 'Not Started',
  },

  // Controller Duties
  {
    controlId: 'VCDPA-CD-1',
    name: 'Data Minimization',
    description: 'Limit the collection of personal data to what is adequate, relevant, and reasonably necessary for the disclosed purposes.',
    category: 'Controller Duties',
    implementationGuidance: 'Assess data collection necessity. Limit collection to necessary data. Document justifications. Review periodically.',
    evidenceRequirements: [
      'Data collection assessments',
      'Collection limitation controls',
      'Justification documentation',
      'Review records',
    ],
    testProcedures: [
      'Review collection practices',
      'Verify limitations',
      'Check justifications',
      'Audit reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CD-2',
    name: 'Purpose Limitation',
    description: 'Process personal data only for purposes that are adequate, relevant, and reasonably necessary and that are disclosed to the consumer.',
    category: 'Controller Duties',
    implementationGuidance: 'Document processing purposes. Limit processing to disclosed purposes. Obtain consent for new purposes. Track purpose changes.',
    evidenceRequirements: [
      'Purpose documentation',
      'Processing limitations',
      'Consent records',
      'Change tracking',
    ],
    testProcedures: [
      'Review purpose documentation',
      'Verify processing limitations',
      'Check consent records',
      'Audit changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CD-3',
    name: 'Security Practices',
    description: 'Establish, implement, and maintain reasonable administrative, technical, and physical data security practices.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement security program. Address administrative, technical, and physical safeguards. Document security measures. Conduct regular assessments.',
    evidenceRequirements: [
      'Security program documentation',
      'Safeguard implementations',
      'Security measures documentation',
      'Assessment records',
    ],
    testProcedures: [
      'Review security program',
      'Test safeguards',
      'Verify documentation',
      'Audit assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-CD-4',
    name: 'Non-Discrimination',
    description: 'Not discriminate against a consumer for exercising any of the consumer rights provided under VCDPA.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement non-discrimination policy. Train staff on requirements. Monitor for discrimination. Document compliance.',
    evidenceRequirements: [
      'Non-discrimination policy',
      'Training records',
      'Monitoring records',
      'Compliance documentation',
    ],
    testProcedures: [
      'Review policy',
      'Verify training',
      'Check monitoring',
      'Audit compliance',
    ],
    status: 'Not Started',
  },

  // Sensitive Data
  {
    controlId: 'VCDPA-SD-1',
    name: 'Sensitive Data Consent',
    description: 'Obtain consumer consent before processing sensitive data including racial/ethnic origin, religious beliefs, health data, genetic/biometric data, and precise geolocation.',
    category: 'Sensitive Data',
    implementationGuidance: 'Identify sensitive data processing. Obtain explicit consent. Document consent. Enable consent withdrawal.',
    evidenceRequirements: [
      'Sensitive data inventory',
      'Consent mechanisms',
      'Consent records',
      'Withdrawal procedures',
    ],
    testProcedures: [
      'Review data inventory',
      'Test consent mechanism',
      'Verify consent records',
      'Check withdrawal process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'VCDPA-SD-2',
    name: 'Children Data Consent',
    description: 'Process personal data concerning a known child only with verifiable parental consent in compliance with COPPA.',
    category: 'Sensitive Data',
    implementationGuidance: 'Implement age verification. Obtain parental consent for children. Comply with COPPA requirements. Document consent.',
    evidenceRequirements: [
      'Age verification mechanisms',
      'Parental consent procedures',
      'COPPA compliance documentation',
      'Consent records',
    ],
    testProcedures: [
      'Test age verification',
      'Verify consent procedures',
      'Check COPPA compliance',
      'Audit records',
    ],
    status: 'Not Started',
  },

  // Privacy Notice
  {
    controlId: 'VCDPA-PN-1',
    name: 'Privacy Notice Requirements',
    description: 'Provide consumers with a reasonably accessible, clear, and meaningful privacy notice that discloses categories of data processed, purposes, consumer rights, and third-party sharing.',
    category: 'Privacy Notice',
    implementationGuidance: 'Develop comprehensive privacy notice. Include all required disclosures. Make notice accessible. Update as needed.',
    evidenceRequirements: [
      'Privacy notice',
      'Disclosure checklist',
      'Accessibility verification',
      'Update records',
    ],
    testProcedures: [
      'Review notice content',
      'Verify disclosures',
      'Test accessibility',
      'Check updates',
    ],
    status: 'Not Started',
  },

  // Data Protection Assessment
  {
    controlId: 'VCDPA-DPA-1',
    name: 'Data Protection Assessments',
    description: 'Conduct and document data protection assessments for processing activities presenting heightened risk of harm to consumers.',
    category: 'Data Protection Assessment',
    implementationGuidance: 'Identify high-risk processing. Conduct assessments. Document findings. Implement safeguards.',
    evidenceRequirements: [
      'High-risk processing inventory',
      'Assessment documentation',
      'Findings reports',
      'Safeguard implementations',
    ],
    testProcedures: [
      'Review processing inventory',
      'Verify assessments',
      'Check findings',
      'Audit safeguards',
    ],
    status: 'Not Started',
  },

  // Processor Requirements
  {
    controlId: 'VCDPA-PR-1',
    name: 'Processor Contracts',
    description: 'Establish contracts with processors that govern processing instructions, nature and purpose, data types, duration, and obligations.',
    category: 'Processor Requirements',
    implementationGuidance: 'Develop processor contract requirements. Include mandatory terms. Execute contracts. Monitor compliance.',
    evidenceRequirements: [
      'Contract requirements',
      'Contract templates',
      'Executed contracts',
      'Compliance monitoring',
    ],
    testProcedures: [
      'Review requirements',
      'Check contract terms',
      'Verify execution',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
];

// Colorado Privacy Act (CPA)
export const CPA_CONTROLS: FrameworkControlTemplate[] = [
  // Consumer Rights
  {
    controlId: 'CPA-CR-1',
    name: 'Right to Opt Out',
    description: 'Provide consumers with the right to opt out of the processing of personal data for targeted advertising, sale, or profiling.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement universal opt-out mechanism. Recognize opt-out signals. Process requests timely. Maintain records.',
    evidenceRequirements: [
      'Opt-out mechanism',
      'Signal recognition',
      'Request processing',
      'Record keeping',
    ],
    testProcedures: [
      'Test opt-out mechanism',
      'Verify signal recognition',
      'Check processing',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CPA-CR-2',
    name: 'Right to Access and Portability',
    description: 'Enable consumers to access their personal data and obtain it in a portable and, to the extent technically feasible, readily usable format.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement access mechanism. Provide data in portable format. Verify consumer identity. Respond within timeframe.',
    evidenceRequirements: [
      'Access procedures',
      'Data export functionality',
      'Identity verification',
      'Response tracking',
    ],
    testProcedures: [
      'Test access mechanism',
      'Verify portability',
      'Check verification',
      'Audit responses',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CPA-CR-3',
    name: 'Right to Correction',
    description: 'Enable consumers to correct inaccuracies in their personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement correction mechanism. Verify identity. Process corrections. Propagate corrections.',
    evidenceRequirements: [
      'Correction procedures',
      'Identity verification',
      'Processing records',
      'Propagation records',
    ],
    testProcedures: [
      'Test correction process',
      'Verify identity checks',
      'Review processing',
      'Check propagation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CPA-CR-4',
    name: 'Right to Deletion',
    description: 'Enable consumers to delete personal data held by the controller.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement deletion mechanism. Verify identity. Execute deletions. Document exceptions.',
    evidenceRequirements: [
      'Deletion procedures',
      'Identity verification',
      'Deletion records',
      'Exception documentation',
    ],
    testProcedures: [
      'Test deletion process',
      'Verify identity checks',
      'Confirm deletions',
      'Review exceptions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CPA-CR-5',
    name: 'Appeal Rights',
    description: 'Establish an internal appeal process for consumers to appeal refusal of consumer rights requests.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement appeal mechanism. Process appeals timely. Document decisions. Inform consumers of AG complaint option.',
    evidenceRequirements: [
      'Appeal procedures',
      'Appeal records',
      'Decision documentation',
      'Consumer notifications',
    ],
    testProcedures: [
      'Test appeal process',
      'Review processing',
      'Check decisions',
      'Verify notifications',
    ],
    status: 'Not Started',
  },

  // Controller Duties
  {
    controlId: 'CPA-CD-1',
    name: 'Purpose Specification and Limitation',
    description: 'Specify purposes for which personal data is collected and processed and limit processing to those purposes.',
    category: 'Controller Duties',
    implementationGuidance: 'Document processing purposes. Implement purpose limitations. Obtain consent for new purposes. Monitor compliance.',
    evidenceRequirements: [
      'Purpose documentation',
      'Processing limitations',
      'Consent records',
      'Compliance monitoring',
    ],
    testProcedures: [
      'Review purposes',
      'Verify limitations',
      'Check consent',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CPA-CD-2',
    name: 'Data Minimization',
    description: 'Collect only personal data that is adequate, relevant, and limited to what is reasonably necessary for the specified purposes.',
    category: 'Controller Duties',
    implementationGuidance: 'Assess data necessity. Implement collection limits. Document justifications. Review periodically.',
    evidenceRequirements: [
      'Necessity assessments',
      'Collection controls',
      'Justification documentation',
      'Review records',
    ],
    testProcedures: [
      'Review assessments',
      'Test collection limits',
      'Check justifications',
      'Audit reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CPA-CD-3',
    name: 'Security Measures',
    description: 'Implement appropriate technical and organizational measures to secure personal data from unauthorized access.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement security controls. Document measures. Assess effectiveness. Update as needed.',
    evidenceRequirements: [
      'Security controls',
      'Documentation',
      'Effectiveness assessments',
      'Update records',
    ],
    testProcedures: [
      'Test security controls',
      'Review documentation',
      'Verify assessments',
      'Check updates',
    ],
    status: 'Not Started',
  },

  // Sensitive Data
  {
    controlId: 'CPA-SD-1',
    name: 'Sensitive Data Processing',
    description: 'Obtain consent before processing sensitive data including personal data revealing racial/ethnic origin, religious beliefs, mental/physical health, sex life, sexual orientation, citizenship, or genetic/biometric data.',
    category: 'Sensitive Data',
    implementationGuidance: 'Identify sensitive data. Obtain opt-in consent. Document consent. Enable withdrawal.',
    evidenceRequirements: [
      'Sensitive data inventory',
      'Consent mechanisms',
      'Consent records',
      'Withdrawal procedures',
    ],
    testProcedures: [
      'Review inventory',
      'Test consent mechanism',
      'Verify records',
      'Check withdrawal',
    ],
    status: 'Not Started',
  },

  // Privacy Notice
  {
    controlId: 'CPA-PN-1',
    name: 'Privacy Notice',
    description: 'Provide a reasonably accessible and clear privacy notice that includes categories of personal data collected, purposes, consumer rights, categories of third parties, and contact information.',
    category: 'Privacy Notice',
    implementationGuidance: 'Develop privacy notice. Include required elements. Make accessible. Update regularly.',
    evidenceRequirements: [
      'Privacy notice',
      'Element checklist',
      'Accessibility verification',
      'Update records',
    ],
    testProcedures: [
      'Review notice',
      'Verify elements',
      'Test accessibility',
      'Check updates',
    ],
    status: 'Not Started',
  },

  // Universal Opt-Out
  {
    controlId: 'CPA-UO-1',
    name: 'Universal Opt-Out Mechanism',
    description: 'Recognize and honor universal opt-out mechanisms established by the Colorado Attorney General for targeted advertising, sale, and profiling.',
    category: 'Universal Opt-Out',
    implementationGuidance: 'Implement universal opt-out recognition. Honor opt-out preferences. Document compliance. Monitor for updates.',
    evidenceRequirements: [
      'Opt-out recognition implementation',
      'Preference honoring',
      'Compliance documentation',
      'Update monitoring',
    ],
    testProcedures: [
      'Test opt-out recognition',
      'Verify preference honoring',
      'Check documentation',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
];

// Connecticut Data Privacy Act (CTDPA)
export const CTDPA_CONTROLS: FrameworkControlTemplate[] = [
  // Consumer Rights
  {
    controlId: 'CTDPA-CR-1',
    name: 'Right to Know',
    description: 'Confirm whether a controller is processing consumer personal data and provide access to such data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement access request mechanism. Verify consumer identity. Provide confirmation and data. Respond within 45 days.',
    evidenceRequirements: [
      'Access request procedures',
      'Identity verification',
      'Response documentation',
      'Response tracking',
    ],
    testProcedures: [
      'Test access process',
      'Verify identity checks',
      'Review responses',
      'Audit timing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CTDPA-CR-2',
    name: 'Right to Correct',
    description: 'Enable consumers to correct inaccuracies in their personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement correction mechanism. Process corrections. Notify third parties. Document corrections.',
    evidenceRequirements: [
      'Correction procedures',
      'Processing records',
      'Third-party notifications',
      'Documentation',
    ],
    testProcedures: [
      'Test correction process',
      'Verify processing',
      'Check notifications',
      'Audit documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CTDPA-CR-3',
    name: 'Right to Delete',
    description: 'Enable consumers to delete personal data provided by or obtained about the consumer.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement deletion mechanism. Execute deletions. Notify third parties. Document deletions.',
    evidenceRequirements: [
      'Deletion procedures',
      'Execution records',
      'Third-party notifications',
      'Documentation',
    ],
    testProcedures: [
      'Test deletion process',
      'Verify execution',
      'Check notifications',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CTDPA-CR-4',
    name: 'Right to Portability',
    description: 'Provide personal data in a portable and readily usable format.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement data export. Use machine-readable formats. Enable transmission. Document exports.',
    evidenceRequirements: [
      'Export functionality',
      'Format documentation',
      'Transmission capabilities',
      'Export records',
    ],
    testProcedures: [
      'Test export',
      'Verify formats',
      'Check transmission',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CTDPA-CR-5',
    name: 'Opt-Out Rights',
    description: 'Allow consumers to opt out of processing for targeted advertising, sale of personal data, and profiling.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Process requests. Honor preferences. Recognize universal opt-out.',
    evidenceRequirements: [
      'Opt-out mechanisms',
      'Request processing',
      'Preference records',
      'Universal opt-out compliance',
    ],
    testProcedures: [
      'Test opt-out',
      'Verify processing',
      'Check preferences',
      'Audit universal opt-out',
    ],
    status: 'Not Started',
  },

  // Controller Duties
  {
    controlId: 'CTDPA-CD-1',
    name: 'Transparency',
    description: 'Provide meaningful and accessible privacy notice with required disclosures.',
    category: 'Controller Duties',
    implementationGuidance: 'Develop privacy notice. Include required elements. Ensure accessibility. Update as needed.',
    evidenceRequirements: [
      'Privacy notice',
      'Required elements',
      'Accessibility compliance',
      'Update records',
    ],
    testProcedures: [
      'Review notice',
      'Verify elements',
      'Test accessibility',
      'Check updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CTDPA-CD-2',
    name: 'Purpose Limitation',
    description: 'Limit collection and processing to what is reasonably necessary for disclosed purposes.',
    category: 'Controller Duties',
    implementationGuidance: 'Document purposes. Limit collection. Implement processing controls. Monitor compliance.',
    evidenceRequirements: [
      'Purpose documentation',
      'Collection limits',
      'Processing controls',
      'Compliance monitoring',
    ],
    testProcedures: [
      'Review purposes',
      'Test limits',
      'Verify controls',
      'Audit compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CTDPA-CD-3',
    name: 'Security',
    description: 'Establish appropriate administrative, technical, and physical safeguards.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement comprehensive security. Address all safeguard types. Document measures. Assess effectiveness.',
    evidenceRequirements: [
      'Security program',
      'Safeguard documentation',
      'Measure documentation',
      'Assessment records',
    ],
    testProcedures: [
      'Review security',
      'Verify safeguards',
      'Check measures',
      'Audit assessments',
    ],
    status: 'Not Started',
  },

  // Sensitive Data
  {
    controlId: 'CTDPA-SD-1',
    name: 'Sensitive Data Consent',
    description: 'Obtain consent before processing sensitive data.',
    category: 'Sensitive Data',
    implementationGuidance: 'Identify sensitive data. Implement consent mechanisms. Obtain explicit consent. Document consent.',
    evidenceRequirements: [
      'Sensitive data inventory',
      'Consent mechanisms',
      'Consent records',
      'Documentation',
    ],
    testProcedures: [
      'Review inventory',
      'Test consent',
      'Verify records',
      'Audit documentation',
    ],
    status: 'Not Started',
  },

  // Data Protection Assessment
  {
    controlId: 'CTDPA-DPA-1',
    name: 'Data Protection Impact Assessment',
    description: 'Conduct assessments for processing that presents heightened risk including targeted advertising, sale, profiling, and sensitive data processing.',
    category: 'Data Protection Assessment',
    implementationGuidance: 'Identify high-risk processing. Conduct assessments. Document findings. Implement mitigations.',
    evidenceRequirements: [
      'Processing inventory',
      'Assessment documentation',
      'Findings reports',
      'Mitigation records',
    ],
    testProcedures: [
      'Review inventory',
      'Verify assessments',
      'Check findings',
      'Audit mitigations',
    ],
    status: 'Not Started',
  },
];

// Utah Consumer Privacy Act (UCPA)
export const UCPA_CONTROLS: FrameworkControlTemplate[] = [
  // Consumer Rights
  {
    controlId: 'UCPA-CR-1',
    name: 'Right to Access',
    description: 'Enable consumers to confirm processing and access personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement access mechanism. Verify identity. Provide data. Respond within 45 days.',
    evidenceRequirements: [
      'Access procedures',
      'Identity verification',
      'Data provision',
      'Response tracking',
    ],
    testProcedures: [
      'Test access',
      'Verify identity checks',
      'Review data provision',
      'Audit timing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'UCPA-CR-2',
    name: 'Right to Delete',
    description: 'Enable consumers to delete personal data provided by the consumer.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement deletion mechanism. Process requests. Execute deletions. Document actions.',
    evidenceRequirements: [
      'Deletion procedures',
      'Request processing',
      'Deletion records',
      'Documentation',
    ],
    testProcedures: [
      'Test deletion',
      'Verify processing',
      'Confirm deletions',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'UCPA-CR-3',
    name: 'Right to Portability',
    description: 'Provide personal data in portable format to extent technically feasible.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement data export. Use portable formats. Enable transmission. Document exports.',
    evidenceRequirements: [
      'Export functionality',
      'Format documentation',
      'Transmission options',
      'Export records',
    ],
    testProcedures: [
      'Test export',
      'Verify formats',
      'Check transmission',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'UCPA-CR-4',
    name: 'Opt-Out Rights',
    description: 'Allow consumers to opt out of targeted advertising and sale of personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Honor requests. Cease processing. Maintain records.',
    evidenceRequirements: [
      'Opt-out mechanisms',
      'Request records',
      'Processing cessation',
      'Documentation',
    ],
    testProcedures: [
      'Test opt-out',
      'Verify honoring',
      'Confirm cessation',
      'Audit records',
    ],
    status: 'Not Started',
  },

  // Controller Duties
  {
    controlId: 'UCPA-CD-1',
    name: 'Privacy Notice',
    description: 'Provide reasonably accessible privacy notice with required disclosures.',
    category: 'Controller Duties',
    implementationGuidance: 'Develop privacy notice. Include required elements. Make accessible. Update regularly.',
    evidenceRequirements: [
      'Privacy notice',
      'Required elements',
      'Accessibility',
      'Update records',
    ],
    testProcedures: [
      'Review notice',
      'Verify elements',
      'Test accessibility',
      'Check updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'UCPA-CD-2',
    name: 'Security',
    description: 'Establish reasonable administrative, technical, and physical security practices.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement security program. Address all safeguard types. Document measures. Review regularly.',
    evidenceRequirements: [
      'Security program',
      'Safeguards',
      'Documentation',
      'Review records',
    ],
    testProcedures: [
      'Review security',
      'Test safeguards',
      'Check documentation',
      'Audit reviews',
    ],
    status: 'Not Started',
  },

  // Sensitive Data
  {
    controlId: 'UCPA-SD-1',
    name: 'Sensitive Data',
    description: 'Obtain consent before processing sensitive data and present clear notice to consumer.',
    category: 'Sensitive Data',
    implementationGuidance: 'Identify sensitive data processing. Provide notice. Obtain consent. Document consent.',
    evidenceRequirements: [
      'Sensitive data inventory',
      'Notice provision',
      'Consent records',
      'Documentation',
    ],
    testProcedures: [
      'Review inventory',
      'Verify notice',
      'Check consent',
      'Audit documentation',
    ],
    status: 'Not Started',
  },
];

// Texas Data Privacy and Security Act (TDPSA)
export const TDPSA_CONTROLS: FrameworkControlTemplate[] = [
  // Consumer Rights
  {
    controlId: 'TDPSA-CR-1',
    name: 'Right to Confirm and Access',
    description: 'Enable consumers to confirm processing and access personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement access mechanism. Verify identity. Provide confirmation and data. Respond within 45 days.',
    evidenceRequirements: [
      'Access procedures',
      'Identity verification',
      'Response documentation',
      'Response tracking',
    ],
    testProcedures: [
      'Test access',
      'Verify identity',
      'Review responses',
      'Audit timing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'TDPSA-CR-2',
    name: 'Right to Correct',
    description: 'Enable consumers to correct inaccuracies in personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement correction mechanism. Process requests. Execute corrections. Document actions.',
    evidenceRequirements: [
      'Correction procedures',
      'Request processing',
      'Correction records',
      'Documentation',
    ],
    testProcedures: [
      'Test corrections',
      'Verify processing',
      'Confirm corrections',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'TDPSA-CR-3',
    name: 'Right to Delete',
    description: 'Enable consumers to delete personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement deletion mechanism. Process requests. Execute deletions. Document actions.',
    evidenceRequirements: [
      'Deletion procedures',
      'Request processing',
      'Deletion records',
      'Documentation',
    ],
    testProcedures: [
      'Test deletions',
      'Verify processing',
      'Confirm deletions',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'TDPSA-CR-4',
    name: 'Right to Portability',
    description: 'Provide personal data in portable and readily usable format.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement data export. Use portable formats. Enable transmission. Document exports.',
    evidenceRequirements: [
      'Export functionality',
      'Format documentation',
      'Transmission options',
      'Export records',
    ],
    testProcedures: [
      'Test export',
      'Verify formats',
      'Check transmission',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'TDPSA-CR-5',
    name: 'Opt-Out Rights',
    description: 'Allow consumers to opt out of targeted advertising, sale of personal data, and profiling.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Honor universal opt-out. Process requests. Maintain records.',
    evidenceRequirements: [
      'Opt-out mechanisms',
      'Universal opt-out support',
      'Request records',
      'Documentation',
    ],
    testProcedures: [
      'Test opt-out',
      'Verify universal support',
      'Review requests',
      'Audit records',
    ],
    status: 'Not Started',
  },

  // Controller Duties
  {
    controlId: 'TDPSA-CD-1',
    name: 'Purpose Limitation',
    description: 'Limit collection to what is adequate, relevant, and reasonably necessary for disclosed purposes.',
    category: 'Controller Duties',
    implementationGuidance: 'Document purposes. Implement collection limits. Monitor compliance. Update as needed.',
    evidenceRequirements: [
      'Purpose documentation',
      'Collection limits',
      'Compliance monitoring',
      'Update records',
    ],
    testProcedures: [
      'Review purposes',
      'Test limits',
      'Verify monitoring',
      'Check updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'TDPSA-CD-2',
    name: 'Security',
    description: 'Establish reasonable administrative, technical, and physical data security practices.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement security program. Address all safeguard types. Document measures. Assess effectiveness.',
    evidenceRequirements: [
      'Security program',
      'Safeguards',
      'Documentation',
      'Assessments',
    ],
    testProcedures: [
      'Review security',
      'Test safeguards',
      'Check documentation',
      'Audit assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'TDPSA-CD-3',
    name: 'Privacy Notice',
    description: 'Provide clear and accessible privacy notice with required disclosures.',
    category: 'Controller Duties',
    implementationGuidance: 'Develop privacy notice. Include required elements. Ensure accessibility. Update regularly.',
    evidenceRequirements: [
      'Privacy notice',
      'Required elements',
      'Accessibility verification',
      'Update records',
    ],
    testProcedures: [
      'Review notice',
      'Verify elements',
      'Test accessibility',
      'Check updates',
    ],
    status: 'Not Started',
  },

  // Sensitive Data
  {
    controlId: 'TDPSA-SD-1',
    name: 'Sensitive Data Consent',
    description: 'Obtain consent before processing sensitive data.',
    category: 'Sensitive Data',
    implementationGuidance: 'Identify sensitive data. Implement consent mechanisms. Obtain consent. Document consent.',
    evidenceRequirements: [
      'Sensitive data inventory',
      'Consent mechanisms',
      'Consent records',
      'Documentation',
    ],
    testProcedures: [
      'Review inventory',
      'Test consent',
      'Verify records',
      'Audit documentation',
    ],
    status: 'Not Started',
  },

  // Data Protection Assessment
  {
    controlId: 'TDPSA-DPA-1',
    name: 'Data Protection Assessment',
    description: 'Conduct data protection assessments for processing presenting heightened risk of harm.',
    category: 'Data Protection Assessment',
    implementationGuidance: 'Identify high-risk processing. Conduct assessments. Document findings. Implement mitigations.',
    evidenceRequirements: [
      'Processing inventory',
      'Assessment documentation',
      'Findings reports',
      'Mitigation records',
    ],
    testProcedures: [
      'Review inventory',
      'Verify assessments',
      'Check findings',
      'Audit mitigations',
    ],
    status: 'Not Started',
  },

  // Small Business Exemption
  {
    controlId: 'TDPSA-SB-1',
    name: 'Small Business Compliance',
    description: 'Small businesses have 30-day cure period and reduced data protection assessment requirements.',
    category: 'Small Business',
    implementationGuidance: 'Determine small business status. Document qualification. Apply appropriate requirements. Maintain documentation.',
    evidenceRequirements: [
      'Business size documentation',
      'Qualification evidence',
      'Applied requirements',
      'Documentation',
    ],
    testProcedures: [
      'Verify status',
      'Check qualification',
      'Review requirements',
      'Audit documentation',
    ],
    status: 'Not Started',
  },
];
