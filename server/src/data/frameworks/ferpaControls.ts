import { FrameworkControlTemplate } from './soc2Controls';

/**
 * FERPA - Family Educational Rights and Privacy Act
 * Privacy protection for student education records
 */
export const FERPA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Student Rights =====
  {
    controlId: 'FERPA-1.1',
    name: 'Right to Inspect and Review Records',
    description: 'Eligible students and parents have the right to inspect and review education records maintained by the school within 45 days of request.',
    category: 'Student Rights',
    implementationGuidance: 'Establish record access request process. Respond within 45 days. Maintain access logs. Accommodate reasonable access requests.',
    evidenceRequirements: ['Access request procedures', 'Response timeline tracking', 'Access logs', 'Accommodation records'],
    testProcedures: ['Test request process', 'Verify 45-day compliance', 'Review access logs', 'Assess accommodations'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-1.2',
    name: 'Right to Request Amendment',
    description: 'Parents/students have right to request amendment of education records they believe are inaccurate, misleading, or in violation of privacy rights.',
    category: 'Student Rights',
    implementationGuidance: 'Establish amendment request process. Review requests promptly. Provide hearing opportunity if denied. Document decisions.',
    evidenceRequirements: ['Amendment procedures', 'Request tracking', 'Hearing records', 'Decision documentation'],
    testProcedures: ['Test amendment process', 'Verify request handling', 'Review hearing procedures', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-1.3',
    name: 'Right to Consent to Disclosures',
    description: 'Schools must obtain written consent before disclosing personally identifiable information from education records, except as permitted by FERPA exceptions.',
    category: 'Student Rights',
    implementationGuidance: 'Implement consent collection process. Document consent for disclosures. Apply consent requirements consistently. Maintain consent records.',
    evidenceRequirements: ['Consent procedures', 'Consent forms', 'Disclosure records', 'Exception documentation'],
    testProcedures: ['Verify consent process', 'Test consent documentation', 'Review disclosure records', 'Assess exception application'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-1.4',
    name: 'Right to File Complaint',
    description: 'Parents/students have right to file complaint with Department of Education concerning alleged failures to comply with FERPA.',
    category: 'Student Rights',
    implementationGuidance: 'Inform parents/students of complaint rights. Provide complaint information in annual notification. Document complaint handling.',
    evidenceRequirements: ['Complaint information documentation', 'Annual notification records', 'Internal complaint handling', 'Response documentation'],
    testProcedures: ['Verify information provision', 'Test notification compliance', 'Review complaint handling', 'Assess responses'],
    status: 'Not Started'
  },

  // ===== Notice Requirements =====
  {
    controlId: 'FERPA-2.1',
    name: 'Annual Notification',
    description: 'Schools must annually notify parents/eligible students of their FERPA rights including right to inspect records, seek amendments, consent to disclosures, and file complaints.',
    category: 'Notice Requirements',
    implementationGuidance: 'Prepare comprehensive annual notification. Distribute to all parents/eligible students. Document distribution. Update notification annually.',
    evidenceRequirements: ['Annual notification content', 'Distribution records', 'Acknowledgment tracking', 'Update records'],
    testProcedures: ['Review notification completeness', 'Verify distribution', 'Test acknowledgment tracking', 'Assess annual updates'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-2.2',
    name: 'Directory Information Notice',
    description: 'If school designates directory information, must provide notice of categories designated and give parents/students opportunity to opt out.',
    category: 'Notice Requirements',
    implementationGuidance: 'Define directory information categories. Provide opt-out notice. Process opt-out requests. Track opt-out status.',
    evidenceRequirements: ['Directory information definitions', 'Opt-out notice', 'Opt-out request records', 'Status tracking'],
    testProcedures: ['Review category definitions', 'Verify notice provision', 'Test opt-out process', 'Assess status tracking'],
    status: 'Not Started'
  },

  // ===== Disclosure Requirements =====
  {
    controlId: 'FERPA-3.1',
    name: 'School Official Exception',
    description: 'Schools may disclose education records without consent to school officials with legitimate educational interest as defined in annual notification.',
    category: 'Disclosure',
    implementationGuidance: 'Define legitimate educational interest. Identify school officials. Implement access controls. Document access grants.',
    evidenceRequirements: ['Legitimate interest definition', 'School official identification', 'Access control documentation', 'Access records'],
    testProcedures: ['Review interest definition', 'Verify official identification', 'Test access controls', 'Review access records'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-3.2',
    name: 'Transfer to Other Schools',
    description: 'Schools may disclose records to officials at other schools where student seeks or intends to enroll, provided notification requirements are met.',
    category: 'Disclosure',
    implementationGuidance: 'Implement transfer procedures. Notify parent/student of transfer. Document transfer requests. Maintain transfer records.',
    evidenceRequirements: ['Transfer procedures', 'Notification records', 'Transfer request documentation', 'Transfer logs'],
    testProcedures: ['Test transfer process', 'Verify notification', 'Review request documentation', 'Assess transfer logs'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-3.3',
    name: 'Health and Safety Emergency',
    description: 'Schools may disclose information to appropriate parties in connection with health or safety emergency when knowledge is necessary to protect student or others.',
    category: 'Disclosure',
    implementationGuidance: 'Define emergency disclosure criteria. Train staff on emergency exceptions. Document emergency disclosures. Review emergency decisions.',
    evidenceRequirements: ['Emergency criteria documentation', 'Staff training records', 'Emergency disclosure logs', 'Decision review records'],
    testProcedures: ['Review emergency criteria', 'Verify staff training', 'Test disclosure documentation', 'Assess decision reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-3.4',
    name: 'Disclosure Recordkeeping',
    description: 'Schools must maintain record of each request for access and each disclosure of personally identifiable information from education records.',
    category: 'Disclosure',
    implementationGuidance: 'Implement disclosure tracking system. Record all requests and disclosures. Maintain records with education records. Enable parent/student access.',
    evidenceRequirements: ['Disclosure tracking system', 'Request records', 'Disclosure records', 'Access provision'],
    testProcedures: ['Test tracking system', 'Verify request recording', 'Review disclosure records', 'Test access provision'],
    status: 'Not Started'
  },

  // ===== Record Security =====
  {
    controlId: 'FERPA-4.1',
    name: 'Education Record Security',
    description: 'Schools must implement reasonable methods to ensure that school officials obtain access only to education records in which they have legitimate educational interest.',
    category: 'Record Security',
    implementationGuidance: 'Implement access controls based on roles. Restrict access to legitimate interest. Monitor access patterns. Conduct access reviews.',
    evidenceRequirements: ['Access control implementation', 'Role-based access documentation', 'Access monitoring records', 'Access review records'],
    testProcedures: ['Test access controls', 'Verify role-based access', 'Review monitoring', 'Assess access reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-4.2',
    name: 'Third Party Access Controls',
    description: 'When disclosing to third parties, schools must ensure recipients understand they cannot redisclose without consent unless exception applies.',
    category: 'Record Security',
    implementationGuidance: 'Include redisclosure restrictions in agreements. Communicate restrictions clearly. Monitor third party compliance. Address violations.',
    evidenceRequirements: ['Agreement redisclosure terms', 'Communication records', 'Compliance monitoring', 'Violation response records'],
    testProcedures: ['Review agreement terms', 'Test communication', 'Verify monitoring', 'Assess violation handling'],
    status: 'Not Started'
  },

  // ===== Institutional Compliance =====
  {
    controlId: 'FERPA-5.1',
    name: 'FERPA Compliance Program',
    description: 'Establish comprehensive FERPA compliance program including policies, procedures, training, and monitoring.',
    category: 'Compliance',
    implementationGuidance: 'Develop FERPA policies and procedures. Train all staff handling records. Monitor compliance. Update program as needed.',
    evidenceRequirements: ['FERPA policies', 'Procedures documentation', 'Training records', 'Compliance monitoring records'],
    testProcedures: ['Review policy completeness', 'Verify procedures', 'Test training completion', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-5.2',
    name: 'FERPA Training',
    description: 'Provide regular training to all staff who access or handle student education records on FERPA requirements.',
    category: 'Compliance',
    implementationGuidance: 'Develop FERPA training curriculum. Train all relevant staff. Track training completion. Provide refresher training.',
    evidenceRequirements: ['Training curriculum', 'Training delivery records', 'Completion tracking', 'Refresher training records'],
    testProcedures: ['Review curriculum coverage', 'Test training delivery', 'Verify completion tracking', 'Assess refresher frequency'],
    status: 'Not Started'
  },
  {
    controlId: 'FERPA-5.3',
    name: 'Outsourcing and Contractors',
    description: 'When using contractors or third parties with access to education records, ensure they meet school official criteria and are under direct control.',
    category: 'Compliance',
    implementationGuidance: 'Include FERPA requirements in contracts. Designate contractors as school officials. Maintain direct control. Monitor contractor compliance.',
    evidenceRequirements: ['Contract FERPA terms', 'School official designation', 'Control documentation', 'Compliance monitoring'],
    testProcedures: ['Review contract terms', 'Verify designation', 'Test control adequacy', 'Assess monitoring'],
    status: 'Not Started'
  }
];
