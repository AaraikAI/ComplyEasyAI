/**
 * ISO 27018:2019 - Code of Practice for Protection of PII in Public Clouds
 *
 * ISO/IEC 27018 provides guidelines for cloud service providers (CSPs)
 * acting as PII processors. It extends ISO 27002 with cloud-specific controls.
 */

import type { FrameworkControlTemplate } from './soc2Controls';

export const ISO27018_CONTROLS: FrameworkControlTemplate[] = [
  // Consent and Choice
  {
    controlId: 'A.1.1',
    name: 'Obligation to Cooperate with PII Principals',
    description: 'The public cloud PII processor should provide the cloud service customer, in a timely manner, with the means to fulfill their obligation to facilitate the exercise of PII principals\' rights in accordance with applicable legislation and/or regulation.',
    category: 'Consent and Choice',
    implementationGuidance: 'Implement mechanisms to support data subject access requests. Provide tools for customers to locate and extract PII. Document procedures for responding to data subject requests. Establish SLAs for request response times.',
    evidenceRequirements: [
      'Data subject request procedures',
      'Customer support documentation',
      'Response time SLAs',
      'Tool documentation for PII extraction',
    ],
    testProcedures: [
      'Review data subject request handling procedures',
      'Test PII extraction capabilities',
      'Verify response time compliance',
      'Review customer portal for self-service options',
    ],
    status: 'Not Started',
  },

  // Purpose Legitimacy and Specification
  {
    controlId: 'A.2.1',
    name: 'Restricted Purpose for PII Processing',
    description: 'The public cloud PII processor should only process PII for the purposes expressed in the contract with the cloud service customer, unless otherwise agreed to in writing.',
    category: 'Purpose Legitimacy and Specification',
    implementationGuidance: 'Document processing purposes in contracts. Implement technical controls to prevent unauthorized processing. Maintain audit logs of all PII processing activities. Require written approval for any processing changes.',
    evidenceRequirements: [
      'Customer contracts with processing purposes',
      'Technical controls preventing unauthorized processing',
      'Audit logs of PII processing',
      'Change approval records',
    ],
    testProcedures: [
      'Review customer contract templates',
      'Test technical controls for purpose limitation',
      'Audit processing logs against stated purposes',
      'Verify approval process for processing changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.2.2',
    name: 'Marketing and Advertising Restrictions',
    description: 'The public cloud PII processor should not use PII processed under a contract for purposes of marketing and advertising without express consent. Such consent should not be a condition of receiving the service.',
    category: 'Purpose Legitimacy and Specification',
    implementationGuidance: 'Implement technical barriers preventing marketing use of PII. Establish clear policies prohibiting marketing without consent. Maintain evidence of explicit consent when marketing is permitted. Separate marketing consent from service agreements.',
    evidenceRequirements: [
      'Marketing restriction policies',
      'Technical controls preventing unauthorized marketing use',
      'Consent records for marketing',
      'Separation of service and marketing agreements',
    ],
    testProcedures: [
      'Review marketing use policies',
      'Test technical barriers',
      'Audit marketing consent records',
      'Verify consent is not bundled with service',
    ],
    status: 'Not Started',
  },

  // Collection Limitation
  {
    controlId: 'A.3.1',
    name: 'Temporary Files',
    description: 'The public cloud PII processor should ensure that temporary files and documents that might contain PII are disposed of in accordance with documented procedures within a specified, documented period.',
    category: 'Collection Limitation',
    implementationGuidance: 'Define retention periods for temporary files. Implement automated deletion mechanisms. Maintain logs of temporary file creation and deletion. Include secure erasure procedures for temporary data.',
    evidenceRequirements: [
      'Temporary file retention policy',
      'Automated deletion configurations',
      'Deletion logs',
      'Secure erasure procedures',
    ],
    testProcedures: [
      'Review temporary file policies',
      'Test automated deletion mechanisms',
      'Audit temporary file retention',
      'Verify secure erasure effectiveness',
    ],
    status: 'Not Started',
  },

  // Data Minimization
  {
    controlId: 'A.4.1',
    name: 'Return, Transfer, and Disposal of PII',
    description: 'The public cloud PII processor should provide the ability to return, transfer and/or dispose of PII in a manner that ensures it cannot be reconstructed. The cloud service customer and/or PII principal should be able to initiate these procedures.',
    category: 'Data Minimization',
    implementationGuidance: 'Implement secure data export capabilities. Provide certified data destruction procedures. Document data transfer mechanisms. Enable customer-initiated data operations.',
    evidenceRequirements: [
      'Data export procedures',
      'Data destruction certificates',
      'Transfer mechanism documentation',
      'Customer self-service capabilities',
    ],
    testProcedures: [
      'Test data export functionality',
      'Verify destruction certificates',
      'Audit data transfer security',
      'Test customer-initiated operations',
    ],
    status: 'Not Started',
  },

  // Use, Retention, and Disclosure Limitation
  {
    controlId: 'A.5.1',
    name: 'PII Disclosure Notification',
    description: 'The public cloud PII processor should notify the cloud service customer of any legally binding request for disclosure of PII by a law enforcement authority unless otherwise prohibited.',
    category: 'Use, Retention, and Disclosure Limitation',
    implementationGuidance: 'Establish law enforcement request handling procedures. Implement notification mechanisms to customers. Document legal obligations and prohibitions. Maintain records of all disclosure requests.',
    evidenceRequirements: [
      'Law enforcement request procedures',
      'Customer notification mechanisms',
      'Legal review documentation',
      'Disclosure request records',
    ],
    testProcedures: [
      'Review law enforcement procedures',
      'Test notification mechanisms',
      'Verify legal compliance',
      'Audit disclosure records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.5.2',
    name: 'Recording of PII Disclosures',
    description: 'The public cloud PII processor should record PII disclosures to third parties, including what PII has been disclosed, to whom, and at what time.',
    category: 'Use, Retention, and Disclosure Limitation',
    implementationGuidance: 'Implement disclosure logging mechanisms. Record all mandatory disclosure details. Maintain searchable disclosure records. Establish retention periods for disclosure logs.',
    evidenceRequirements: [
      'Disclosure logging system',
      'Disclosure records with required details',
      'Search capabilities',
      'Retention policy for logs',
    ],
    testProcedures: [
      'Review disclosure logging',
      'Test log completeness',
      'Verify searchability',
      'Audit retention compliance',
    ],
    status: 'Not Started',
  },

  // Accuracy and Quality
  {
    controlId: 'A.6.1',
    name: 'PII Accuracy and Quality Notification',
    description: 'The public cloud PII processor should provide the cloud service customer with the means to assist the cloud service customer with their obligation to keep PII accurate and up-to-date.',
    category: 'Accuracy and Quality',
    implementationGuidance: 'Provide data correction interfaces. Implement mechanisms for accuracy verification. Enable customer updates to PII. Document data quality procedures.',
    evidenceRequirements: [
      'Data correction interfaces',
      'Accuracy verification tools',
      'Customer update capabilities',
      'Data quality procedures',
    ],
    testProcedures: [
      'Test correction interfaces',
      'Verify accuracy tools',
      'Test customer update functions',
      'Review quality procedures',
    ],
    status: 'Not Started',
  },

  // Openness, Transparency, and Notice
  {
    controlId: 'A.7.1',
    name: 'Disclosure of Sub-Processors',
    description: 'The public cloud PII processor should disclose to the cloud service customer, before use, the identities and locations of all sub-contracted PII processors.',
    category: 'Openness, Transparency, and Notice',
    implementationGuidance: 'Maintain current sub-processor list. Notify customers before engaging new sub-processors. Document sub-processor locations and processing activities. Implement prior notification mechanisms.',
    evidenceRequirements: [
      'Sub-processor registry',
      'Prior notification records',
      'Location documentation',
      'Notification mechanisms',
    ],
    testProcedures: [
      'Review sub-processor list',
      'Verify notification procedures',
      'Audit location accuracy',
      'Test notification mechanisms',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.7.2',
    name: 'PII Processing Locations',
    description: 'The public cloud PII processor should inform the cloud service customer, in advance, of the intended country or countries in which PII may be processed.',
    category: 'Openness, Transparency, and Notice',
    implementationGuidance: 'Document all processing locations. Notify customers of location changes. Implement data residency controls. Maintain processing location records.',
    evidenceRequirements: [
      'Processing location documentation',
      'Customer notifications',
      'Data residency configurations',
      'Location change records',
    ],
    testProcedures: [
      'Review location documentation',
      'Verify notification compliance',
      'Test data residency controls',
      'Audit location records',
    ],
    status: 'Not Started',
  },

  // Individual Participation and Access
  {
    controlId: 'A.8.1',
    name: 'Use of Sub-Processors',
    description: 'Use of sub-processors should only be performed on the basis of the cloud service customer\'s consent, subject to sub-processors providing equivalent controls.',
    category: 'Individual Participation and Access',
    implementationGuidance: 'Obtain customer consent for sub-processors. Ensure sub-processor contractual obligations. Verify sub-processor security controls. Maintain consent records.',
    evidenceRequirements: [
      'Customer consent records',
      'Sub-processor contracts',
      'Security control assessments',
      'Consent documentation',
    ],
    testProcedures: [
      'Review consent records',
      'Audit sub-processor contracts',
      'Verify security controls',
      'Test consent processes',
    ],
    status: 'Not Started',
  },

  // Accountability
  {
    controlId: 'A.9.1',
    name: 'Notification of Data Breach',
    description: 'The public cloud PII processor should promptly notify the cloud service customer in case of any unauthorized access to PII or unauthorized access to processing equipment or facilities.',
    category: 'Accountability',
    implementationGuidance: 'Implement breach detection mechanisms. Establish notification procedures. Define notification timeframes. Document breach response processes.',
    evidenceRequirements: [
      'Breach detection systems',
      'Notification procedures',
      'Timeframe documentation',
      'Breach response records',
    ],
    testProcedures: [
      'Test breach detection',
      'Review notification procedures',
      'Verify timeframe compliance',
      'Audit breach response',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.9.2',
    name: 'Breach Response Coordination',
    description: 'The public cloud PII processor should coordinate breach investigation and provide assistance to the cloud service customer in meeting their breach notification obligations.',
    category: 'Accountability',
    implementationGuidance: 'Establish coordination procedures. Provide investigation support. Document communication protocols. Maintain evidence collection procedures.',
    evidenceRequirements: [
      'Coordination procedures',
      'Support documentation',
      'Communication protocols',
      'Evidence handling procedures',
    ],
    testProcedures: [
      'Review coordination procedures',
      'Test support capabilities',
      'Verify communication protocols',
      'Audit evidence handling',
    ],
    status: 'Not Started',
  },

  // Information Security Policies
  {
    controlId: 'A.10.1',
    name: 'Confidentiality and Non-Disclosure',
    description: 'Persons authorized to access PII should be subject to confidentiality obligations.',
    category: 'Information Security Policies',
    implementationGuidance: 'Implement confidentiality agreements. Train staff on obligations. Monitor compliance with NDAs. Maintain agreement records.',
    evidenceRequirements: [
      'Confidentiality agreements',
      'Training records',
      'Compliance monitoring',
      'Agreement documentation',
    ],
    testProcedures: [
      'Review confidentiality agreements',
      'Verify training completion',
      'Audit compliance',
      'Test agreement enforcement',
    ],
    status: 'Not Started',
  },

  // Human Resources
  {
    controlId: 'A.11.1',
    name: 'Background Checks',
    description: 'Personnel who have access to PII should be subject to appropriate background screening before their employment commences.',
    category: 'Human Resources',
    implementationGuidance: 'Define screening requirements. Conduct background checks. Document screening results. Implement periodic rescreening.',
    evidenceRequirements: [
      'Screening requirements',
      'Background check records',
      'Screening documentation',
      'Rescreening schedule',
    ],
    testProcedures: [
      'Review screening requirements',
      'Verify background checks',
      'Audit documentation',
      'Test rescreening process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.11.2',
    name: 'Security Awareness Training',
    description: 'Personnel with access to PII should receive training specific to their roles regarding handling PII.',
    category: 'Human Resources',
    implementationGuidance: 'Develop role-specific training. Track training completion. Update training materials regularly. Assess training effectiveness.',
    evidenceRequirements: [
      'Training materials',
      'Completion records',
      'Update history',
      'Effectiveness assessments',
    ],
    testProcedures: [
      'Review training content',
      'Verify completion rates',
      'Check update frequency',
      'Assess effectiveness',
    ],
    status: 'Not Started',
  },

  // Asset Management
  {
    controlId: 'A.12.1',
    name: 'PII Inventory',
    description: 'The public cloud PII processor should maintain a record of PII processing activities.',
    category: 'Asset Management',
    implementationGuidance: 'Maintain data processing inventory. Document processing activities. Update inventory regularly. Include all PII categories and purposes.',
    evidenceRequirements: [
      'Processing inventory',
      'Activity documentation',
      'Update records',
      'Category documentation',
    ],
    testProcedures: [
      'Review inventory completeness',
      'Verify documentation',
      'Test update process',
      'Audit categorization',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.12.2',
    name: 'Secure Disposal',
    description: 'PII should be securely disposed of when no longer required, using methods that render the data unrecoverable.',
    category: 'Asset Management',
    implementationGuidance: 'Implement secure disposal procedures. Use certified destruction methods. Document disposal activities. Verify destruction completion.',
    evidenceRequirements: [
      'Disposal procedures',
      'Destruction certificates',
      'Disposal logs',
      'Verification records',
    ],
    testProcedures: [
      'Review disposal procedures',
      'Verify certificates',
      'Audit disposal logs',
      'Test verification process',
    ],
    status: 'Not Started',
  },

  // Access Control
  {
    controlId: 'A.13.1',
    name: 'Segregation of Duties',
    description: 'Ensure appropriate segregation of duties for persons with access to PII processing systems.',
    category: 'Access Control',
    implementationGuidance: 'Define role separation requirements. Implement access controls enforcing segregation. Review access regularly. Document exceptions.',
    evidenceRequirements: [
      'Segregation requirements',
      'Access control configurations',
      'Review records',
      'Exception documentation',
    ],
    testProcedures: [
      'Review segregation policies',
      'Test access controls',
      'Audit review compliance',
      'Verify exception handling',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.13.2',
    name: 'Administrator Access',
    description: 'Administrative access to systems processing PII should be restricted, logged, and reviewed.',
    category: 'Access Control',
    implementationGuidance: 'Limit administrator accounts. Log all administrative actions. Review logs regularly. Implement just-in-time access.',
    evidenceRequirements: [
      'Administrator account inventory',
      'Administrative action logs',
      'Review records',
      'JIT access records',
    ],
    testProcedures: [
      'Audit administrator accounts',
      'Review logging completeness',
      'Verify review frequency',
      'Test JIT access controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.13.3',
    name: 'System Administrator Identification',
    description: 'System administrators shall be uniquely identifiable and their activities audited.',
    category: 'Access Control',
    implementationGuidance: 'Assign unique identifiers to administrators. Prohibit shared accounts. Log all activities by identifier. Maintain administrator registry.',
    evidenceRequirements: [
      'Unique identifier assignments',
      'Shared account prohibition policy',
      'Activity logs by identifier',
      'Administrator registry',
    ],
    testProcedures: [
      'Verify unique identifiers',
      'Test for shared accounts',
      'Review activity logs',
      'Audit registry accuracy',
    ],
    status: 'Not Started',
  },

  // Cryptography
  {
    controlId: 'A.14.1',
    name: 'Encryption of PII',
    description: 'PII transmitted over public data-transmission networks should be encrypted.',
    category: 'Cryptography',
    implementationGuidance: 'Implement transport encryption (TLS 1.2+). Use strong cipher suites. Monitor encryption compliance. Document encryption standards.',
    evidenceRequirements: [
      'Encryption configurations',
      'Cipher suite documentation',
      'Compliance monitoring',
      'Standards documentation',
    ],
    testProcedures: [
      'Test encryption strength',
      'Verify cipher suites',
      'Review monitoring',
      'Audit standard compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.14.2',
    name: 'PII at Rest Encryption',
    description: 'PII stored in persistent storage should be encrypted using industry-accepted encryption algorithms.',
    category: 'Cryptography',
    implementationGuidance: 'Implement encryption at rest. Use AES-256 or equivalent. Manage encryption keys securely. Document encryption coverage.',
    evidenceRequirements: [
      'Encryption at rest configurations',
      'Algorithm documentation',
      'Key management procedures',
      'Coverage documentation',
    ],
    testProcedures: [
      'Verify encryption at rest',
      'Test algorithm strength',
      'Review key management',
      'Audit coverage',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.14.3',
    name: 'Key Management',
    description: 'Encryption keys should be managed securely throughout their lifecycle.',
    category: 'Cryptography',
    implementationGuidance: 'Implement key management system. Define key lifecycle procedures. Implement key rotation. Secure key storage.',
    evidenceRequirements: [
      'Key management system',
      'Lifecycle procedures',
      'Rotation records',
      'Storage security',
    ],
    testProcedures: [
      'Review key management',
      'Test lifecycle procedures',
      'Verify rotation',
      'Audit storage security',
    ],
    status: 'Not Started',
  },

  // Physical and Environmental Security
  {
    controlId: 'A.15.1',
    name: 'Secure Disposal of Physical Media',
    description: 'Physical media containing PII should be securely disposed of using methods ensuring data is unrecoverable.',
    category: 'Physical and Environmental Security',
    implementationGuidance: 'Implement media destruction procedures. Use certified destruction services. Maintain destruction certificates. Track media through destruction.',
    evidenceRequirements: [
      'Destruction procedures',
      'Service certifications',
      'Destruction certificates',
      'Media tracking records',
    ],
    testProcedures: [
      'Review destruction procedures',
      'Verify certifications',
      'Audit certificates',
      'Test tracking process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.15.2',
    name: 'Equipment Reuse',
    description: 'Equipment used to process or store PII should have all data securely removed before reuse or disposal.',
    category: 'Physical and Environmental Security',
    implementationGuidance: 'Implement data wiping procedures. Verify data removal. Document reuse processes. Use certified wiping tools.',
    evidenceRequirements: [
      'Wiping procedures',
      'Verification records',
      'Reuse documentation',
      'Tool certifications',
    ],
    testProcedures: [
      'Review wiping procedures',
      'Verify removal',
      'Audit documentation',
      'Test tool effectiveness',
    ],
    status: 'Not Started',
  },

  // Operations Security
  {
    controlId: 'A.16.1',
    name: 'Protection from Malware',
    description: 'Systems processing PII should be protected from malware.',
    category: 'Operations Security',
    implementationGuidance: 'Deploy anti-malware solutions. Maintain current signatures. Monitor for threats. Implement endpoint protection.',
    evidenceRequirements: [
      'Anti-malware deployment',
      'Signature update records',
      'Threat monitoring',
      'Endpoint protection coverage',
    ],
    testProcedures: [
      'Verify deployment',
      'Check signature currency',
      'Review monitoring',
      'Audit coverage',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.16.2',
    name: 'Logging and Monitoring',
    description: 'Actions that could affect PII should be logged and monitored.',
    category: 'Operations Security',
    implementationGuidance: 'Implement comprehensive logging. Monitor access to PII. Retain logs appropriately. Protect log integrity.',
    evidenceRequirements: [
      'Logging configurations',
      'Monitoring procedures',
      'Retention records',
      'Integrity controls',
    ],
    testProcedures: [
      'Review logging scope',
      'Test monitoring',
      'Verify retention',
      'Audit integrity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.16.3',
    name: 'Backup and Recovery',
    description: 'Backup copies of PII should be protected to the same level as the original data.',
    category: 'Operations Security',
    implementationGuidance: 'Encrypt backup data. Apply access controls to backups. Test recovery procedures. Maintain backup inventory.',
    evidenceRequirements: [
      'Backup encryption',
      'Access controls',
      'Recovery test results',
      'Backup inventory',
    ],
    testProcedures: [
      'Verify encryption',
      'Test access controls',
      'Review recovery tests',
      'Audit inventory',
    ],
    status: 'Not Started',
  },

  // Communications Security
  {
    controlId: 'A.17.1',
    name: 'Network Segmentation',
    description: 'Networks should be segregated to protect PII from unauthorized access.',
    category: 'Communications Security',
    implementationGuidance: 'Implement network segmentation. Control inter-segment traffic. Monitor network boundaries. Document network architecture.',
    evidenceRequirements: [
      'Network diagrams',
      'Segmentation configurations',
      'Traffic controls',
      'Monitoring procedures',
    ],
    testProcedures: [
      'Review network architecture',
      'Test segmentation',
      'Verify traffic controls',
      'Audit monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.17.2',
    name: 'Transfer Security',
    description: 'PII transfers between systems should be secured.',
    category: 'Communications Security',
    implementationGuidance: 'Use secure transfer protocols. Verify transfer integrity. Log transfers. Implement transfer controls.',
    evidenceRequirements: [
      'Protocol configurations',
      'Integrity verification',
      'Transfer logs',
      'Control documentation',
    ],
    testProcedures: [
      'Test protocol security',
      'Verify integrity checks',
      'Review logs',
      'Audit controls',
    ],
    status: 'Not Started',
  },

  // Supplier Relationships
  {
    controlId: 'A.18.1',
    name: 'Third-Party Contracts',
    description: 'Contracts with sub-processors should include appropriate PII protection requirements.',
    category: 'Supplier Relationships',
    implementationGuidance: 'Include PII protection clauses. Specify security requirements. Define breach notification obligations. Require compliance evidence.',
    evidenceRequirements: [
      'Contract templates',
      'Security requirements',
      'Notification clauses',
      'Compliance evidence',
    ],
    testProcedures: [
      'Review contract templates',
      'Verify security clauses',
      'Check notification terms',
      'Audit compliance evidence',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.18.2',
    name: 'Third-Party Assessments',
    description: 'Sub-processors should be assessed for their ability to protect PII.',
    category: 'Supplier Relationships',
    implementationGuidance: 'Conduct due diligence assessments. Review security certifications. Monitor ongoing compliance. Document assessment results.',
    evidenceRequirements: [
      'Assessment records',
      'Certification reviews',
      'Monitoring records',
      'Documentation',
    ],
    testProcedures: [
      'Review assessments',
      'Verify certifications',
      'Audit monitoring',
      'Check documentation',
    ],
    status: 'Not Started',
  },

  // Incident Management
  {
    controlId: 'A.19.1',
    name: 'Incident Response Procedures',
    description: 'Procedures should be established for responding to PII-related security incidents.',
    category: 'Incident Management',
    implementationGuidance: 'Define incident response procedures. Train response team. Test procedures regularly. Document lessons learned.',
    evidenceRequirements: [
      'Response procedures',
      'Training records',
      'Test results',
      'Lessons learned',
    ],
    testProcedures: [
      'Review procedures',
      'Verify training',
      'Audit test results',
      'Check documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.19.2',
    name: 'Incident Classification',
    description: 'Security incidents involving PII should be classified based on severity and impact.',
    category: 'Incident Management',
    implementationGuidance: 'Define classification criteria. Implement classification procedures. Document severity levels. Train staff on classification.',
    evidenceRequirements: [
      'Classification criteria',
      'Procedures',
      'Severity documentation',
      'Training records',
    ],
    testProcedures: [
      'Review criteria',
      'Test procedures',
      'Verify documentation',
      'Audit training',
    ],
    status: 'Not Started',
  },

  // Business Continuity
  {
    controlId: 'A.20.1',
    name: 'Availability of PII',
    description: 'The public cloud PII processor should ensure the availability of PII in accordance with the cloud service customer\'s requirements.',
    category: 'Business Continuity',
    implementationGuidance: 'Define availability SLAs. Implement redundancy. Test recovery capabilities. Monitor availability.',
    evidenceRequirements: [
      'SLA documentation',
      'Redundancy configurations',
      'Recovery test results',
      'Availability metrics',
    ],
    testProcedures: [
      'Review SLAs',
      'Verify redundancy',
      'Test recovery',
      'Audit metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.20.2',
    name: 'Recovery Planning',
    description: 'Recovery procedures should be documented and tested to ensure PII can be restored.',
    category: 'Business Continuity',
    implementationGuidance: 'Document recovery procedures. Define RPO/RTO objectives. Test recovery regularly. Maintain recovery records.',
    evidenceRequirements: [
      'Recovery procedures',
      'RPO/RTO documentation',
      'Test records',
      'Recovery logs',
    ],
    testProcedures: [
      'Review procedures',
      'Verify objectives',
      'Audit test records',
      'Check logs',
    ],
    status: 'Not Started',
  },

  // Compliance
  {
    controlId: 'A.21.1',
    name: 'Independent Audits',
    description: 'The public cloud PII processor should conduct regular independent audits of their PII protection controls.',
    category: 'Compliance',
    implementationGuidance: 'Schedule regular audits. Engage independent auditors. Document audit findings. Implement remediation.',
    evidenceRequirements: [
      'Audit schedule',
      'Auditor qualifications',
      'Audit reports',
      'Remediation records',
    ],
    testProcedures: [
      'Review schedule',
      'Verify auditor independence',
      'Audit report findings',
      'Check remediation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'A.21.2',
    name: 'Regulatory Compliance',
    description: 'The public cloud PII processor should comply with all applicable PII protection laws and regulations.',
    category: 'Compliance',
    implementationGuidance: 'Identify applicable regulations. Assess compliance status. Implement required controls. Monitor regulatory changes.',
    evidenceRequirements: [
      'Regulatory register',
      'Compliance assessments',
      'Control implementations',
      'Change monitoring',
    ],
    testProcedures: [
      'Review regulations',
      'Verify assessments',
      'Audit controls',
      'Check monitoring',
    ],
    status: 'Not Started',
  },
];
