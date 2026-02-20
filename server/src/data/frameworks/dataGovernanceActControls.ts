import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Data Governance Act (DGA) - Regulation (EU) 2022/868
 * Framework for data sharing and reuse across the EU
 */
export const DATA_GOVERNANCE_ACT_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Chapter II: Re-use of Public Sector Data =====
  {
    controlId: 'DGA-1.1',
    name: 'Protected Data Re-use Conditions',
    description: 'Public sector bodies allowing re-use of protected data categories must apply conditions ensuring data protection, confidentiality, and intellectual property rights while enabling re-use.',
    category: 'Public Sector Data',
    implementationGuidance: 'Establish conditions for protected data re-use. Implement technical measures for data protection. Define access procedures for re-users. Document condition compliance verification.',
    evidenceRequirements: [
      'Re-use condition documentation',
      'Technical protection measures',
      'Access procedure documentation',
      'Compliance verification records'
    ],
    testProcedures: [
      'Review re-use conditions adequacy',
      'Test technical protection effectiveness',
      'Verify access procedure implementation',
      'Assess compliance verification process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-1.2',
    name: 'Secure Processing Environment',
    description: 'Re-use of protected data may be provided through secure processing environments controlled by public sector body, ensuring data cannot be extracted.',
    category: 'Public Sector Data',
    implementationGuidance: 'Design secure processing environment with access controls. Implement data extraction prevention. Enable authorized analysis within environment. Audit environment usage.',
    evidenceRequirements: [
      'Secure environment design documentation',
      'Extraction prevention controls',
      'Authorized analysis capability documentation',
      'Environment usage audit logs'
    ],
    testProcedures: [
      'Test environment security controls',
      'Verify extraction prevention effectiveness',
      'Assess analysis capability adequacy',
      'Review audit log completeness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-1.3',
    name: 'Single Information Point',
    description: 'Member States must designate single information point to provide information and assistance regarding conditions for re-use of protected data.',
    category: 'Public Sector Data',
    implementationGuidance: 'Designate single information point contact. Develop information resources for re-users. Establish assistance procedures. Track information requests.',
    evidenceRequirements: [
      'Information point designation',
      'Information resource documentation',
      'Assistance procedures',
      'Request tracking records'
    ],
    testProcedures: [
      'Verify designation compliance',
      'Review information resource adequacy',
      'Test assistance procedures',
      'Assess request tracking accuracy'
    ],
    status: 'Not Started'
  },

  // ===== Chapter III: Data Intermediation Services =====
  {
    controlId: 'DGA-2.1',
    name: 'Data Intermediary Notification',
    description: 'Data intermediation service providers must notify competent authority before commencing activity, providing required information about services and organizational structure.',
    category: 'Data Intermediation',
    implementationGuidance: 'Prepare notification documentation. Submit notification to competent authority. Maintain notification records. Update authority on material changes.',
    evidenceRequirements: [
      'Notification documentation',
      'Submission confirmation',
      'Notification records',
      'Change notification records'
    ],
    testProcedures: [
      'Review notification completeness',
      'Verify submission timing',
      'Assess record maintenance',
      'Test change notification process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-2.2',
    name: 'Data Intermediary Neutrality',
    description: 'Data intermediaries must remain neutral regarding exchanged data, not using data for other purposes. Services must be provided in fair, transparent, and non-discriminatory manner.',
    category: 'Data Intermediation',
    implementationGuidance: 'Implement data neutrality policies. Prohibit data use for other purposes. Apply fair and transparent service terms. Monitor for discriminatory practices.',
    evidenceRequirements: [
      'Neutrality policy documentation',
      'Data use restriction records',
      'Service term documentation',
      'Non-discrimination monitoring records'
    ],
    testProcedures: [
      'Review neutrality policy adequacy',
      'Test data use restriction enforcement',
      'Verify service term fairness',
      'Assess monitoring effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-2.3',
    name: 'Data Intermediary Security',
    description: 'Data intermediaries must implement appropriate technical, organizational, and legal measures to prevent unauthorized transfer or access to non-personal data.',
    category: 'Data Intermediation',
    implementationGuidance: 'Implement security measures for data handling. Apply access controls and encryption. Establish legal safeguards. Conduct security assessments.',
    evidenceRequirements: [
      'Security measure documentation',
      'Access control and encryption records',
      'Legal safeguard documentation',
      'Security assessment reports'
    ],
    testProcedures: [
      'Test security measure effectiveness',
      'Verify access control implementation',
      'Review legal safeguard adequacy',
      'Assess security assessment findings'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-2.4',
    name: 'Interoperability Standards',
    description: 'Data intermediaries must take measures to ensure interoperability with other data intermediation services, using commonly used open standards where available.',
    category: 'Data Intermediation',
    implementationGuidance: 'Adopt open interoperability standards. Implement standard APIs. Enable data portability between services. Document interoperability capabilities.',
    evidenceRequirements: [
      'Standard adoption documentation',
      'API implementation records',
      'Portability capability documentation',
      'Interoperability documentation'
    ],
    testProcedures: [
      'Verify standard adoption',
      'Test API functionality',
      'Assess portability capability',
      'Review interoperability documentation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-2.5',
    name: 'Data Subject Rights Support',
    description: 'Data intermediaries must support data subjects in exercising their rights under GDPR, including providing tools for consent management and data portability.',
    category: 'Data Intermediation',
    implementationGuidance: 'Implement consent management tools. Enable data subject rights exercise. Provide portability mechanisms. Document rights support capabilities.',
    evidenceRequirements: [
      'Consent management tool documentation',
      'Rights exercise mechanisms',
      'Portability mechanism documentation',
      'Capability documentation'
    ],
    testProcedures: [
      'Test consent management functionality',
      'Verify rights exercise capability',
      'Assess portability mechanism effectiveness',
      'Review capability documentation'
    ],
    status: 'Not Started'
  },

  // ===== Chapter IV: Data Altruism =====
  {
    controlId: 'DGA-3.1',
    name: 'Data Altruism Organization Registration',
    description: 'Organizations seeking to collect and process data for general interest purposes (data altruism) must register with competent authority and meet specified requirements.',
    category: 'Data Altruism',
    implementationGuidance: 'Prepare registration application. Document general interest purposes. Demonstrate non-profit structure. Submit registration to authority.',
    evidenceRequirements: [
      'Registration application',
      'General interest purpose documentation',
      'Non-profit structure verification',
      'Registration confirmation'
    ],
    testProcedures: [
      'Review application completeness',
      'Verify purpose documentation',
      'Confirm non-profit status',
      'Test registration process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-3.2',
    name: 'Data Altruism Consent Form',
    description: 'Data altruism organizations must use European data altruism consent form for collecting personal data, ensuring data subjects understand processing purposes.',
    category: 'Data Altruism',
    implementationGuidance: 'Adopt European data altruism consent form. Implement consent collection process. Maintain consent records. Enable consent withdrawal.',
    evidenceRequirements: [
      'Consent form implementation',
      'Consent collection procedures',
      'Consent records',
      'Withdrawal mechanism documentation'
    ],
    testProcedures: [
      'Review consent form compliance',
      'Test consent collection process',
      'Verify consent record accuracy',
      'Assess withdrawal mechanism'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-3.3',
    name: 'Data Altruism Transparency',
    description: 'Registered data altruism organizations must publish annual activity reports including general interest purposes pursued, data subjects involved, and data processing summary.',
    category: 'Data Altruism',
    implementationGuidance: 'Prepare annual activity reports. Document purposes and data subject categories. Summarize data processing activities. Publish reports as required.',
    evidenceRequirements: [
      'Annual activity reports',
      'Purpose documentation',
      'Data subject category records',
      'Publication records'
    ],
    testProcedures: [
      'Review report completeness',
      'Verify purpose documentation accuracy',
      'Assess data subject documentation',
      'Confirm publication compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-3.4',
    name: 'Data Altruism Rulebook',
    description: 'Data altruism organizations must implement rulebook setting out information requirements, technical and security requirements, and communication formats.',
    category: 'Data Altruism',
    implementationGuidance: 'Develop organizational rulebook. Include information requirements. Specify technical and security requirements. Define communication formats.',
    evidenceRequirements: [
      'Organizational rulebook',
      'Information requirement documentation',
      'Technical/security requirements',
      'Communication format specifications'
    ],
    testProcedures: [
      'Review rulebook comprehensiveness',
      'Test information requirement implementation',
      'Verify technical/security compliance',
      'Assess communication format adherence'
    ],
    status: 'Not Started'
  },

  // ===== Chapter V: European Data Innovation Board =====
  {
    controlId: 'DGA-4.1',
    name: 'Cross-Border Data Sharing Facilitation',
    description: 'Organizations involved in cross-border data sharing must follow guidelines and best practices issued by the European Data Innovation Board.',
    category: 'Cross-Border Data Sharing',
    implementationGuidance: 'Monitor EDIB guidance issuances. Implement relevant guidelines. Update practices based on best practices. Document guideline compliance.',
    evidenceRequirements: [
      'EDIB guidance monitoring records',
      'Guideline implementation documentation',
      'Best practice adoption records',
      'Compliance documentation'
    ],
    testProcedures: [
      'Verify guidance monitoring process',
      'Test guideline implementation',
      'Review best practice adoption',
      'Assess compliance documentation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-4.2',
    name: 'Common European Data Spaces Participation',
    description: 'Organizations participating in Common European Data Spaces must adhere to sector-specific data sharing standards and interoperability requirements.',
    category: 'Cross-Border Data Sharing',
    implementationGuidance: 'Identify relevant data space participation. Adopt sector-specific standards. Implement interoperability requirements. Participate in data space governance.',
    evidenceRequirements: [
      'Data space participation records',
      'Sector standard adoption documentation',
      'Interoperability implementation records',
      'Governance participation records'
    ],
    testProcedures: [
      'Verify participation compliance',
      'Test standard adoption',
      'Assess interoperability implementation',
      'Review governance participation'
    ],
    status: 'Not Started'
  },

  // ===== Chapter VI: International Data Access =====
  {
    controlId: 'DGA-5.1',
    name: 'Third Country Transfer Safeguards',
    description: 'Public sector bodies, data intermediaries, and data altruism organizations must implement measures to prevent third-country government access conflicting with EU law.',
    category: 'International Data Access',
    implementationGuidance: 'Assess third-country access risks. Implement technical safeguards. Establish legal protections. Document safeguard measures.',
    evidenceRequirements: [
      'Risk assessment documentation',
      'Technical safeguard records',
      'Legal protection documentation',
      'Safeguard documentation'
    ],
    testProcedures: [
      'Review risk assessment adequacy',
      'Test technical safeguard effectiveness',
      'Verify legal protection compliance',
      'Assess safeguard documentation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DGA-5.2',
    name: 'Government Access Request Handling',
    description: 'Organizations must challenge government access requests from third countries that conflict with EU law and notify relevant EU authorities.',
    category: 'International Data Access',
    implementationGuidance: 'Establish government request handling procedures. Define challenge criteria based on EU law. Implement notification procedures. Document request handling.',
    evidenceRequirements: [
      'Request handling procedures',
      'Challenge criteria documentation',
      'Notification procedures',
      'Request handling records'
    ],
    testProcedures: [
      'Test handling procedure effectiveness',
      'Review challenge criteria accuracy',
      'Verify notification process',
      'Assess handling record completeness'
    ],
    status: 'Not Started'
  }
];
