import { FrameworkControlTemplate } from './soc2Controls';

/**
 * COPPA - Children's Online Privacy Protection Act
 * Privacy protection for children under 13 online
 */
export const COPPA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Notice Requirements =====
  {
    controlId: 'COPPA-1.1',
    name: 'Privacy Policy Requirements',
    description: 'Operators must post clear, comprehensive privacy policy on website or online service homepage and each area where personal information is collected from children.',
    category: 'Notice',
    implementationGuidance: 'Develop child-focused privacy policy. Post policy prominently. Link from collection points. Update policy as practices change.',
    evidenceRequirements: ['Privacy policy document', 'Website posting verification', 'Collection point links', 'Update records'],
    testProcedures: ['Review policy completeness', 'Verify prominent posting', 'Test link functionality', 'Assess update frequency'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-1.2',
    name: 'Direct Notice to Parents',
    description: 'Before collecting personal information from children, operators must provide direct notice to parents describing information practices and seeking consent.',
    category: 'Notice',
    implementationGuidance: 'Develop direct notice content. Deliver notice before collection. Include all required disclosures. Obtain acknowledgment.',
    evidenceRequirements: ['Direct notice content', 'Delivery records', 'Required disclosure checklist', 'Acknowledgment records'],
    testProcedures: ['Review notice completeness', 'Verify delivery timing', 'Test disclosure coverage', 'Assess acknowledgment'],
    status: 'Not Started'
  },

  // ===== Parental Consent =====
  {
    controlId: 'COPPA-2.1',
    name: 'Verifiable Parental Consent',
    description: 'Obtain verifiable parental consent before collecting, using, or disclosing personal information from children using approved methods.',
    category: 'Consent',
    implementationGuidance: 'Implement FTC-approved consent methods. Verify parent identity. Document consent. Maintain consent records.',
    evidenceRequirements: ['Consent method documentation', 'Identity verification records', 'Consent documentation', 'Consent record retention'],
    testProcedures: ['Test consent method effectiveness', 'Verify identity verification', 'Review consent documentation', 'Assess record retention'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-2.2',
    name: 'Consent Method Verification',
    description: 'Use consent methods reasonably designed to ensure person providing consent is child\'s parent including credit card, government ID, knowledge-based questions, or video conference.',
    category: 'Consent',
    implementationGuidance: 'Select appropriate consent verification methods. Implement verification procedures. Document verification attempts. Track verification success.',
    evidenceRequirements: ['Verification method selection', 'Verification procedures', 'Verification attempt logs', 'Success rate tracking'],
    testProcedures: ['Review method appropriateness', 'Test verification procedures', 'Review attempt logs', 'Assess success rates'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-2.3',
    name: 'Consent Exceptions',
    description: 'Understand and apply consent exceptions for internal operations, single contact, safety purposes, and other limited circumstances.',
    category: 'Consent',
    implementationGuidance: 'Document applicable consent exceptions. Apply exceptions correctly. Limit use to permitted purposes. Monitor exception usage.',
    evidenceRequirements: ['Exception documentation', 'Exception application records', 'Purpose limitation documentation', 'Usage monitoring'],
    testProcedures: ['Review exception application', 'Verify purpose limitation', 'Test monitoring', 'Assess compliance'],
    status: 'Not Started'
  },

  // ===== Data Collection Practices =====
  {
    controlId: 'COPPA-3.1',
    name: 'Data Minimization',
    description: 'Operators shall not condition child\'s participation on disclosure of more personal information than reasonably necessary to participate in activity.',
    category: 'Data Collection',
    implementationGuidance: 'Assess necessity of each data element. Limit collection to necessary information. Do not condition participation on excess data. Document necessity determinations.',
    evidenceRequirements: ['Necessity assessments', 'Collection limitation documentation', 'Participation requirements', 'Determination records'],
    testProcedures: ['Review necessity assessments', 'Test collection limitations', 'Verify participation terms', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-3.2',
    name: 'Age Screening',
    description: 'Implement age screening mechanisms before collecting personal information to identify users under 13.',
    category: 'Data Collection',
    implementationGuidance: 'Implement neutral age gate. Do not encourage false age entry. Block repeat attempts. Trigger COPPA protections for under-13.',
    evidenceRequirements: ['Age gate implementation', 'Neutrality verification', 'Repeat attempt blocking', 'Protection trigger documentation'],
    testProcedures: ['Test age gate neutrality', 'Verify repeat blocking', 'Review protection triggers', 'Assess effectiveness'],
    status: 'Not Started'
  },

  // ===== Parental Rights =====
  {
    controlId: 'COPPA-4.1',
    name: 'Parental Review Right',
    description: 'Provide parents the opportunity to review personal information collected from their child upon request.',
    category: 'Parental Rights',
    implementationGuidance: 'Establish review request process. Verify requestor is parent. Provide information access. Maintain request records.',
    evidenceRequirements: ['Review request procedures', 'Parent verification records', 'Information access logs', 'Request tracking'],
    testProcedures: ['Test request process', 'Verify parent verification', 'Review access provision', 'Assess tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-4.2',
    name: 'Parental Deletion Right',
    description: 'Allow parents to request deletion of child\'s personal information and cease further collection or use.',
    category: 'Parental Rights',
    implementationGuidance: 'Establish deletion request process. Process deletions completely. Cease collection and use. Confirm deletion to parent.',
    evidenceRequirements: ['Deletion procedures', 'Deletion execution records', 'Collection cessation verification', 'Confirmation records'],
    testProcedures: ['Test deletion process', 'Verify complete deletion', 'Test collection cessation', 'Review confirmations'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-4.3',
    name: 'Consent Withdrawal',
    description: 'Allow parents to refuse further collection or use and request deletion at any time, while operator may terminate service access.',
    category: 'Parental Rights',
    implementationGuidance: 'Implement consent withdrawal process. Process withdrawals promptly. Communicate service implications. Document withdrawals.',
    evidenceRequirements: ['Withdrawal procedures', 'Processing records', 'Service implication communications', 'Withdrawal documentation'],
    testProcedures: ['Test withdrawal process', 'Verify prompt processing', 'Review communications', 'Assess documentation'],
    status: 'Not Started'
  },

  // ===== Data Security and Retention =====
  {
    controlId: 'COPPA-5.1',
    name: 'Confidentiality and Security',
    description: 'Maintain confidentiality, security, and integrity of personal information collected from children through reasonable procedures.',
    category: 'Security',
    implementationGuidance: 'Implement security measures appropriate to data sensitivity. Protect against unauthorized access. Monitor security controls. Update security as needed.',
    evidenceRequirements: ['Security measure documentation', 'Access control records', 'Security monitoring', 'Update records'],
    testProcedures: ['Test security measures', 'Verify access controls', 'Review monitoring', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-5.2',
    name: 'Data Retention Limitations',
    description: 'Retain personal information collected from children only as long as reasonably necessary to fulfill purpose for which it was collected.',
    category: 'Security',
    implementationGuidance: 'Define retention periods based on purpose. Implement retention enforcement. Delete data when purpose fulfilled. Document retention practices.',
    evidenceRequirements: ['Retention period definitions', 'Enforcement documentation', 'Deletion records', 'Practice documentation'],
    testProcedures: ['Review retention periods', 'Test enforcement', 'Verify deletions', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-5.3',
    name: 'Third Party Security',
    description: 'Take reasonable steps to release children\'s personal information only to parties capable of maintaining confidentiality and security.',
    category: 'Security',
    implementationGuidance: 'Assess third party security capabilities. Include security requirements in agreements. Monitor third party compliance. Address security issues.',
    evidenceRequirements: ['Third party assessments', 'Agreement security terms', 'Compliance monitoring', 'Issue resolution records'],
    testProcedures: ['Review assessments', 'Test agreement terms', 'Verify monitoring', 'Assess issue resolution'],
    status: 'Not Started'
  },

  // ===== Safe Harbor Programs =====
  {
    controlId: 'COPPA-6.1',
    name: 'Safe Harbor Participation',
    description: 'Consider participation in FTC-approved COPPA safe harbor program that provides industry guidelines and independent enforcement.',
    category: 'Compliance',
    implementationGuidance: 'Evaluate safe harbor programs. Apply if appropriate. Comply with program requirements. Maintain program membership.',
    evidenceRequirements: ['Program evaluation', 'Application records', 'Compliance documentation', 'Membership verification'],
    testProcedures: ['Review program participation', 'Verify compliance', 'Test program requirements', 'Assess membership status'],
    status: 'Not Started'
  },

  // ===== Compliance Program =====
  {
    controlId: 'COPPA-7.1',
    name: 'COPPA Compliance Program',
    description: 'Establish comprehensive COPPA compliance program including policies, procedures, training, and auditing.',
    category: 'Compliance',
    implementationGuidance: 'Develop COPPA policies. Train staff on requirements. Implement compliance monitoring. Conduct periodic audits.',
    evidenceRequirements: ['COPPA policies', 'Training records', 'Monitoring documentation', 'Audit reports'],
    testProcedures: ['Review policies', 'Verify training', 'Test monitoring', 'Assess audit findings'],
    status: 'Not Started'
  },
  {
    controlId: 'COPPA-7.2',
    name: 'Vendor COPPA Compliance',
    description: 'Ensure vendors and service providers with access to children\'s personal information comply with COPPA requirements.',
    category: 'Compliance',
    implementationGuidance: 'Include COPPA requirements in vendor contracts. Assess vendor compliance. Monitor vendor practices. Address non-compliance.',
    evidenceRequirements: ['Contract COPPA terms', 'Compliance assessments', 'Monitoring records', 'Non-compliance remediation'],
    testProcedures: ['Review contract terms', 'Test assessments', 'Verify monitoring', 'Assess remediation'],
    status: 'Not Started'
  }
];
