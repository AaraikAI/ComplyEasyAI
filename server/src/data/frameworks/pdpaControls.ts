/**
 * PDPA - Personal Data Protection Act (Singapore)
 *
 * Singapore's comprehensive data protection law governing collection,
 * use, disclosure, and care of personal data.
 */

import type { FrameworkControlTemplate } from './soc2Controls';

export const PDPA_CONTROLS: FrameworkControlTemplate[] = [
  // Consent Obligation
  {
    controlId: 'PDPA-13',
    name: 'Consent Requirement',
    description: 'Obtain consent before collecting, using, or disclosing personal data, unless an exception applies.',
    category: 'Consent Obligation',
    implementationGuidance: 'Implement consent mechanisms. Inform of purposes. Document consent. Enable withdrawal.',
    evidenceRequirements: [
      'Consent mechanisms',
      'Purpose notification',
      'Consent records',
      'Withdrawal procedures',
    ],
    testProcedures: [
      'Test consent collection',
      'Verify purpose notification',
      'Check records',
      'Test withdrawal',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-14',
    name: 'Deemed Consent',
    description: 'Treat consent as deemed when individual voluntarily provides data for stated purpose.',
    category: 'Consent Obligation',
    implementationGuidance: 'Identify deemed consent scenarios. Document purpose statements. Track deemed consent. Maintain records.',
    evidenceRequirements: [
      'Deemed consent scenarios',
      'Purpose statements',
      'Consent tracking',
      'Records documentation',
    ],
    testProcedures: [
      'Review scenarios',
      'Verify purpose statements',
      'Check tracking',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-16',
    name: 'Consent Withdrawal',
    description: 'Allow individuals to withdraw consent with reasonable notice.',
    category: 'Consent Obligation',
    implementationGuidance: 'Implement withdrawal mechanism. Process withdrawals. Inform of consequences. Document withdrawals.',
    evidenceRequirements: [
      'Withdrawal mechanism',
      'Processing records',
      'Consequence notifications',
      'Withdrawal documentation',
    ],
    testProcedures: [
      'Test withdrawal mechanism',
      'Verify processing',
      'Check notifications',
      'Audit documentation',
    ],
    status: 'Not Started',
  },

  // Purpose Limitation
  {
    controlId: 'PDPA-18',
    name: 'Purpose Notification',
    description: 'Notify individuals of the purposes for which personal data will be collected, used, or disclosed.',
    category: 'Purpose Limitation',
    implementationGuidance: 'Document purposes. Notify before collection. Ensure clarity. Update as needed.',
    evidenceRequirements: [
      'Purpose documentation',
      'Notification records',
      'Clarity assessment',
      'Update records',
    ],
    testProcedures: [
      'Review purposes',
      'Verify notifications',
      'Assess clarity',
      'Check updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-18.1',
    name: 'Reasonable Purpose',
    description: 'Ensure purposes are what a reasonable person would consider appropriate.',
    category: 'Purpose Limitation',
    implementationGuidance: 'Assess purpose reasonableness. Document assessments. Review periodically. Update purposes.',
    evidenceRequirements: [
      'Reasonableness assessments',
      'Assessment documentation',
      'Review records',
      'Purpose updates',
    ],
    testProcedures: [
      'Review assessments',
      'Verify documentation',
      'Check reviews',
      'Audit updates',
    ],
    status: 'Not Started',
  },

  // Notification Obligation
  {
    controlId: 'PDPA-20',
    name: 'Collection Notification',
    description: 'Inform individuals of purposes at or before time of collection or as soon as practicable.',
    category: 'Notification Obligation',
    implementationGuidance: 'Provide timely notification. Include all purposes. Use clear language. Document notifications.',
    evidenceRequirements: [
      'Notification timing',
      'Purpose inclusion',
      'Language clarity',
      'Notification records',
    ],
    testProcedures: [
      'Verify timing',
      'Check purposes',
      'Assess clarity',
      'Audit records',
    ],
    status: 'Not Started',
  },

  // Access and Correction
  {
    controlId: 'PDPA-21',
    name: 'Access Right',
    description: 'Provide individuals access to their personal data upon request.',
    category: 'Access and Correction',
    implementationGuidance: 'Implement access mechanism. Verify identity. Provide data. Document access.',
    evidenceRequirements: [
      'Access mechanism',
      'Identity verification',
      'Data provision',
      'Access records',
    ],
    testProcedures: [
      'Test access mechanism',
      'Verify identity checks',
      'Check data provision',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-22',
    name: 'Correction Right',
    description: 'Correct personal data that is inaccurate or incomplete upon request.',
    category: 'Access and Correction',
    implementationGuidance: 'Implement correction mechanism. Process requests. Notify third parties. Document corrections.',
    evidenceRequirements: [
      'Correction mechanism',
      'Request processing',
      'Third-party notifications',
      'Correction records',
    ],
    testProcedures: [
      'Test correction mechanism',
      'Verify processing',
      'Check notifications',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-23',
    name: 'Response Timeframe',
    description: 'Respond to access and correction requests within 30 days or provide extension notice.',
    category: 'Access and Correction',
    implementationGuidance: 'Track request timing. Respond within timeframe. Notify of extensions. Document responses.',
    evidenceRequirements: [
      'Timing tracking',
      'Response records',
      'Extension notifications',
      'Response documentation',
    ],
    testProcedures: [
      'Review tracking',
      'Verify responses',
      'Check notifications',
      'Audit documentation',
    ],
    status: 'Not Started',
  },

  // Accuracy Obligation
  {
    controlId: 'PDPA-23.1',
    name: 'Data Accuracy',
    description: 'Make reasonable effort to ensure personal data is accurate and complete when making decisions or disclosing to other organizations.',
    category: 'Accuracy Obligation',
    implementationGuidance: 'Implement accuracy measures. Verify data before use. Update as needed. Document efforts.',
    evidenceRequirements: [
      'Accuracy measures',
      'Verification procedures',
      'Update records',
      'Effort documentation',
    ],
    testProcedures: [
      'Review measures',
      'Test verification',
      'Check updates',
      'Audit documentation',
    ],
    status: 'Not Started',
  },

  // Protection Obligation
  {
    controlId: 'PDPA-24',
    name: 'Data Protection',
    description: 'Protect personal data with reasonable security arrangements against unauthorized access, collection, use, disclosure, copying, modification, or disposal.',
    category: 'Protection Obligation',
    implementationGuidance: 'Implement security controls. Address physical and technical measures. Document protection. Review effectiveness.',
    evidenceRequirements: [
      'Security controls',
      'Protection measures',
      'Protection documentation',
      'Review records',
    ],
    testProcedures: [
      'Test security controls',
      'Verify measures',
      'Check documentation',
      'Audit reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-24.1',
    name: 'Risk-Based Security',
    description: 'Implement security measures appropriate to the nature and sensitivity of the personal data.',
    category: 'Protection Obligation',
    implementationGuidance: 'Assess data sensitivity. Implement proportionate controls. Document risk assessments. Review regularly.',
    evidenceRequirements: [
      'Sensitivity assessments',
      'Proportionate controls',
      'Risk documentation',
      'Review records',
    ],
    testProcedures: [
      'Review assessments',
      'Verify proportionality',
      'Check documentation',
      'Audit reviews',
    ],
    status: 'Not Started',
  },

  // Retention Limitation
  {
    controlId: 'PDPA-25',
    name: 'Retention Limitation',
    description: 'Cease retention or remove means of association when personal data is no longer necessary for purposes.',
    category: 'Retention Limitation',
    implementationGuidance: 'Define retention periods. Implement deletion. Remove identifiers. Document disposal.',
    evidenceRequirements: [
      'Retention periods',
      'Deletion procedures',
      'De-identification records',
      'Disposal documentation',
    ],
    testProcedures: [
      'Review retention periods',
      'Test deletion',
      'Verify de-identification',
      'Audit disposal',
    ],
    status: 'Not Started',
  },

  // Transfer Limitation
  {
    controlId: 'PDPA-26',
    name: 'Transfer Limitation',
    description: 'Transfer personal data outside Singapore only to countries with comparable protection or with appropriate safeguards.',
    category: 'Transfer Limitation',
    implementationGuidance: 'Assess destination protection. Implement safeguards. Document transfers. Monitor compliance.',
    evidenceRequirements: [
      'Protection assessments',
      'Safeguard documentation',
      'Transfer records',
      'Compliance monitoring',
    ],
    testProcedures: [
      'Review assessments',
      'Verify safeguards',
      'Check records',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-26.1',
    name: 'Transfer Consent',
    description: 'Obtain consent for overseas transfer when individual consents to transfer to recipient in specific country.',
    category: 'Transfer Limitation',
    implementationGuidance: 'Obtain specific consent. Document consent. Track transfers. Maintain records.',
    evidenceRequirements: [
      'Transfer consent',
      'Consent documentation',
      'Transfer tracking',
      'Records maintenance',
    ],
    testProcedures: [
      'Verify consent',
      'Check documentation',
      'Review tracking',
      'Audit records',
    ],
    status: 'Not Started',
  },

  // Data Protection Officer
  {
    controlId: 'PDPA-11',
    name: 'Data Protection Officer',
    description: 'Designate one or more individuals as Data Protection Officer to ensure PDPA compliance.',
    category: 'Accountability',
    implementationGuidance: 'Appoint DPO. Define responsibilities. Publish contact details. Ensure accessibility.',
    evidenceRequirements: [
      'DPO appointment',
      'Responsibility documentation',
      'Contact publication',
      'Accessibility measures',
    ],
    testProcedures: [
      'Verify appointment',
      'Review responsibilities',
      'Check contact details',
      'Test accessibility',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-12',
    name: 'Policies and Practices',
    description: 'Develop and implement policies and practices to meet PDPA obligations.',
    category: 'Accountability',
    implementationGuidance: 'Develop policies. Implement practices. Train staff. Monitor compliance.',
    evidenceRequirements: [
      'Policies documentation',
      'Practice implementation',
      'Training records',
      'Compliance monitoring',
    ],
    testProcedures: [
      'Review policies',
      'Verify practices',
      'Check training',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-12.1',
    name: 'Complaint Handling',
    description: 'Establish process to receive and address complaints about data protection practices.',
    category: 'Accountability',
    implementationGuidance: 'Implement complaint process. Track complaints. Resolve timely. Document outcomes.',
    evidenceRequirements: [
      'Complaint process',
      'Tracking records',
      'Resolution documentation',
      'Outcome records',
    ],
    testProcedures: [
      'Test complaint process',
      'Review tracking',
      'Verify resolutions',
      'Audit outcomes',
    ],
    status: 'Not Started',
  },

  // Data Breach Notification
  {
    controlId: 'PDPA-26D',
    name: 'Breach Assessment',
    description: 'Assess data breaches to determine if notification to PDPC is required.',
    category: 'Data Breach Notification',
    implementationGuidance: 'Implement breach assessment. Evaluate significance. Document assessments. Determine notification.',
    evidenceRequirements: [
      'Assessment procedures',
      'Significance evaluation',
      'Assessment documentation',
      'Notification determination',
    ],
    testProcedures: [
      'Test assessment process',
      'Verify evaluation',
      'Check documentation',
      'Review determination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-26D.1',
    name: 'PDPC Notification',
    description: 'Notify PDPC of notifiable data breaches within 3 calendar days of assessment.',
    category: 'Data Breach Notification',
    implementationGuidance: 'Establish notification process. Notify within timeframe. Include required information. Document notification.',
    evidenceRequirements: [
      'Notification process',
      'Timing records',
      'Required information',
      'Notification documentation',
    ],
    testProcedures: [
      'Test notification process',
      'Verify timing',
      'Check information',
      'Audit documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-26D.2',
    name: 'Individual Notification',
    description: 'Notify affected individuals of data breaches likely to result in significant harm.',
    category: 'Data Breach Notification',
    implementationGuidance: 'Assess individual impact. Notify affected individuals. Provide required information. Document notifications.',
    evidenceRequirements: [
      'Impact assessment',
      'Individual notifications',
      'Information provided',
      'Notification records',
    ],
    testProcedures: [
      'Review assessment',
      'Verify notifications',
      'Check information',
      'Audit records',
    ],
    status: 'Not Started',
  },

  // Do Not Call Registry
  {
    controlId: 'PDPA-DNC-1',
    name: 'DNC Registry Check',
    description: 'Check Do Not Call Registry before sending marketing messages to Singapore telephone numbers.',
    category: 'Do Not Call',
    implementationGuidance: 'Implement registry check. Check before sending. Document checks. Maintain records.',
    evidenceRequirements: [
      'Registry check implementation',
      'Pre-send verification',
      'Check documentation',
      'Record maintenance',
    ],
    testProcedures: [
      'Test registry check',
      'Verify pre-send process',
      'Check documentation',
      'Audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PDPA-DNC-2',
    name: 'Marketing Message Requirements',
    description: 'Include sender identification and contact information in marketing messages.',
    category: 'Do Not Call',
    implementationGuidance: 'Include sender ID. Provide contact information. Document compliance. Monitor messages.',
    evidenceRequirements: [
      'Sender identification',
      'Contact information',
      'Compliance documentation',
      'Message monitoring',
    ],
    testProcedures: [
      'Verify sender ID',
      'Check contact info',
      'Review compliance',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
];
