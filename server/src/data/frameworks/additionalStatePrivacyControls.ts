import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Additional US State Privacy Laws
 * Indiana INCDPA, Tennessee TIPA, New Hampshire, Maryland, Minnesota, Nebraska, Rhode Island, Vermont, Kentucky
 */

export const INCDPA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'INCDPA-1.1',
    name: 'Consumer Rights - Access',
    description: 'Provide consumers right to confirm processing and access personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement access request process. Verify consumer identity. Provide data within 45 days. Document request handling.',
    evidenceRequirements: ['Access request procedures', 'Identity verification', 'Response timelines', 'Request documentation'],
    testProcedures: ['Test access process', 'Verify identity checks', 'Review timelines', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'INCDPA-1.2',
    name: 'Consumer Rights - Deletion',
    description: 'Allow consumers to request deletion of personal data provided by or obtained about the consumer.',
    category: 'Consumer Rights',
    implementationGuidance: 'Establish deletion request process. Process deletions completely. Document deletion completion. Handle exceptions appropriately.',
    evidenceRequirements: ['Deletion procedures', 'Deletion execution records', 'Completion documentation', 'Exception handling'],
    testProcedures: ['Test deletion process', 'Verify completeness', 'Check documentation', 'Review exceptions'],
    status: 'Not Started'
  },
  {
    controlId: 'INCDPA-1.3',
    name: 'Consumer Rights - Opt-Out',
    description: 'Provide consumers right to opt out of sale of personal data, targeted advertising, and profiling.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Process opt-out requests. Honor opt-out preferences. Track opt-out status.',
    evidenceRequirements: ['Opt-out mechanisms', 'Request processing records', 'Preference honoring', 'Status tracking'],
    testProcedures: ['Test opt-out functionality', 'Verify processing', 'Check preference honoring', 'Assess tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'INCDPA-2.1',
    name: 'Data Protection Assessment',
    description: 'Conduct data protection assessments for high-risk processing activities.',
    category: 'Assessments',
    implementationGuidance: 'Identify high-risk processing. Conduct assessments. Document findings. Implement safeguards.',
    evidenceRequirements: ['Risk identification', 'Assessment documentation', 'Findings records', 'Safeguard implementation'],
    testProcedures: ['Review risk identification', 'Test assessments', 'Verify findings', 'Check safeguards'],
    status: 'Not Started'
  }
];

export const TIPA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'TIPA-1.1',
    name: 'Consumer Rights - Confirmation and Access',
    description: 'Provide consumers right to confirm processing and access their personal information.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement confirmation and access request process. Verify identity. Respond within 45 days.',
    evidenceRequirements: ['Request procedures', 'Identity verification', 'Response records', 'Timeline tracking'],
    testProcedures: ['Test request process', 'Verify identity checks', 'Review responses', 'Check timelines'],
    status: 'Not Started'
  },
  {
    controlId: 'TIPA-1.2',
    name: 'Consumer Rights - Deletion',
    description: 'Allow consumers to delete personal information provided by them.',
    category: 'Consumer Rights',
    implementationGuidance: 'Establish deletion request handling. Process deletions. Document completion. Apply exceptions.',
    evidenceRequirements: ['Deletion procedures', 'Processing records', 'Completion documentation', 'Exception records'],
    testProcedures: ['Test deletion handling', 'Verify processing', 'Check documentation', 'Review exceptions'],
    status: 'Not Started'
  },
  {
    controlId: 'TIPA-1.3',
    name: 'Consumer Rights - Opt-Out',
    description: 'Provide opt-out rights for sale and targeted advertising.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Honor opt-out preferences. Track compliance.',
    evidenceRequirements: ['Opt-out mechanisms', 'Preference records', 'Compliance tracking'],
    testProcedures: ['Test opt-out', 'Verify preferences', 'Check compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'TIPA-2.1',
    name: 'Controller Obligations',
    description: 'Limit data collection to what is adequate, relevant, and reasonably necessary.',
    category: 'Controller Duties',
    implementationGuidance: 'Implement data minimization. Document necessity. Review collection practices.',
    evidenceRequirements: ['Minimization documentation', 'Necessity records', 'Practice reviews'],
    testProcedures: ['Test minimization', 'Verify necessity', 'Review practices'],
    status: 'Not Started'
  }
];

export const NH_PRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'NH-1.1',
    name: 'Consumer Rights',
    description: 'Provide consumers with access, correction, deletion, portability, and opt-out rights.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement all required consumer rights. Process requests timely. Document compliance.',
    evidenceRequirements: ['Rights implementation', 'Request handling', 'Compliance documentation'],
    testProcedures: ['Test rights functionality', 'Verify request handling', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'NH-1.2',
    name: 'Privacy Notice',
    description: 'Provide clear and accessible privacy notice to consumers.',
    category: 'Transparency',
    implementationGuidance: 'Develop comprehensive privacy notice. Make easily accessible. Update as needed.',
    evidenceRequirements: ['Privacy notice', 'Accessibility verification', 'Update records'],
    testProcedures: ['Review notice content', 'Test accessibility', 'Check updates'],
    status: 'Not Started'
  }
];

export const MD_PRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MD-1.1',
    name: 'Consumer Data Rights',
    description: 'Provide Maryland consumers with comprehensive data rights including access, correction, and deletion.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement consumer rights per Maryland law. Handle requests within required timeframes. Document all actions.',
    evidenceRequirements: ['Rights implementation', 'Request handling records', 'Action documentation'],
    testProcedures: ['Test rights implementation', 'Verify timeframes', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MD-1.2',
    name: 'Sensitive Data Protections',
    description: 'Implement enhanced protections for sensitive personal data categories.',
    category: 'Data Protection',
    implementationGuidance: 'Identify sensitive data. Apply enhanced protections. Obtain consent where required.',
    evidenceRequirements: ['Sensitive data inventory', 'Protection measures', 'Consent records'],
    testProcedures: ['Review data identification', 'Test protections', 'Verify consent'],
    status: 'Not Started'
  }
];

export const MN_PRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MN-1.1',
    name: 'Consumer Rights Implementation',
    description: 'Implement consumer rights for Minnesota residents under the Consumer Data Privacy Act.',
    category: 'Consumer Rights',
    implementationGuidance: 'Establish rights request handling. Verify consumer identity. Respond within statutory timelines.',
    evidenceRequirements: ['Request procedures', 'Identity verification', 'Timeline compliance'],
    testProcedures: ['Test request handling', 'Verify identity checks', 'Review timelines'],
    status: 'Not Started'
  },
  {
    controlId: 'MN-1.2',
    name: 'Data Processing Limitations',
    description: 'Limit processing to disclosed purposes and implement data minimization.',
    category: 'Controller Duties',
    implementationGuidance: 'Document processing purposes. Implement minimization. Align processing with purposes.',
    evidenceRequirements: ['Purpose documentation', 'Minimization records', 'Processing alignment'],
    testProcedures: ['Review purposes', 'Test minimization', 'Verify alignment'],
    status: 'Not Started'
  }
];

export const NE_PRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'NE-1.1',
    name: 'Consumer Data Rights',
    description: 'Provide Nebraska consumers with rights to access, correct, delete, and obtain copies of their data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement consumer rights mechanisms. Handle requests per statutory requirements.',
    evidenceRequirements: ['Rights mechanisms', 'Request handling records', 'Compliance documentation'],
    testProcedures: ['Test rights mechanisms', 'Verify request handling', 'Review compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'NE-1.2',
    name: 'Opt-Out Rights',
    description: 'Provide opt-out rights for sale, targeted advertising, and profiling.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Process opt-out requests. Honor preferences.',
    evidenceRequirements: ['Opt-out mechanisms', 'Request processing', 'Preference honoring'],
    testProcedures: ['Test opt-out', 'Verify processing', 'Check preference compliance'],
    status: 'Not Started'
  }
];

export const RI_PRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'RI-1.1',
    name: 'Data Transparency Requirements',
    description: 'Provide transparency about personal data collection and use practices.',
    category: 'Transparency',
    implementationGuidance: 'Develop transparent privacy notices. Disclose data practices. Update disclosures regularly.',
    evidenceRequirements: ['Privacy notices', 'Practice disclosures', 'Update records'],
    testProcedures: ['Review notices', 'Verify disclosures', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'RI-1.2',
    name: 'Consumer Rights',
    description: 'Implement consumer rights for Rhode Island residents.',
    category: 'Consumer Rights',
    implementationGuidance: 'Establish rights request handling. Respond within required timeframes.',
    evidenceRequirements: ['Request procedures', 'Timeline compliance', 'Response records'],
    testProcedures: ['Test request handling', 'Verify timelines', 'Review responses'],
    status: 'Not Started'
  }
];

export const VT_PRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'VT-1.1',
    name: 'Consumer Data Rights',
    description: 'Provide Vermont consumers with comprehensive privacy rights.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement all required consumer rights. Handle requests appropriately. Document compliance.',
    evidenceRequirements: ['Rights implementation', 'Request handling', 'Compliance documentation'],
    testProcedures: ['Test rights', 'Verify handling', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'VT-1.2',
    name: 'Data Protection Obligations',
    description: 'Implement data protection measures for Vermont consumer data.',
    category: 'Data Protection',
    implementationGuidance: 'Implement appropriate security measures. Protect consumer data. Monitor protections.',
    evidenceRequirements: ['Security measures', 'Protection documentation', 'Monitoring records'],
    testProcedures: ['Test security', 'Verify protections', 'Review monitoring'],
    status: 'Not Started'
  }
];

export const KCDPA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'KCDPA-1.1',
    name: 'Consumer Rights - Access and Confirmation',
    description: 'Provide Kentucky consumers right to confirm processing and access their personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement access request process. Verify consumer identity. Respond within 45 days.',
    evidenceRequirements: ['Access procedures', 'Identity verification', 'Response timelines', 'Request records'],
    testProcedures: ['Test access process', 'Verify identity checks', 'Review timelines', 'Check records'],
    status: 'Not Started'
  },
  {
    controlId: 'KCDPA-1.2',
    name: 'Consumer Rights - Correction and Deletion',
    description: 'Allow consumers to correct inaccuracies and delete personal data.',
    category: 'Consumer Rights',
    implementationGuidance: 'Establish correction and deletion processes. Handle requests timely. Document actions.',
    evidenceRequirements: ['Correction procedures', 'Deletion procedures', 'Action documentation', 'Timeline records'],
    testProcedures: ['Test correction', 'Test deletion', 'Verify documentation', 'Check timelines'],
    status: 'Not Started'
  },
  {
    controlId: 'KCDPA-1.3',
    name: 'Consumer Rights - Opt-Out',
    description: 'Provide opt-out rights for sale of personal data and targeted advertising.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement opt-out mechanisms. Process requests. Honor preferences consistently.',
    evidenceRequirements: ['Opt-out mechanisms', 'Request processing records', 'Preference compliance'],
    testProcedures: ['Test opt-out functionality', 'Verify processing', 'Check compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'KCDPA-2.1',
    name: 'Controller Duties',
    description: 'Implement controller obligations including purpose limitation and data minimization.',
    category: 'Controller Duties',
    implementationGuidance: 'Limit data to necessary purposes. Implement minimization. Document processing.',
    evidenceRequirements: ['Purpose limitation', 'Minimization records', 'Processing documentation'],
    testProcedures: ['Review purpose limitation', 'Test minimization', 'Verify documentation'],
    status: 'Not Started'
  }
];
