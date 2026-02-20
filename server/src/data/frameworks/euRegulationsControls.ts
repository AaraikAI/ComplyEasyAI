import { FrameworkControlTemplate } from './soc2Controls';

/**
 * EU Regulations Controls
 * EU Whistleblower Directive, EU Product Liability Directive, Machinery Regulation,
 * ePrivacy Directive, MiFID II, PSD2, ENISA Guidelines, Adequacy Decision
 */

export const EU_WHISTLEBLOWER_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'WB-1.1',
    name: 'Internal Reporting Channels',
    description: 'Establish secure internal reporting channels for whistleblowers.',
    category: 'Reporting Channels',
    implementationGuidance: 'Create reporting channels. Ensure confidentiality. Allow anonymous reports. Document channel procedures.',
    evidenceRequirements: ['Channel documentation', 'Confidentiality measures', 'Anonymous reporting capability', 'Channel procedures'],
    testProcedures: ['Test channels', 'Verify confidentiality', 'Check anonymity', 'Review procedures'],
    status: 'Not Started'
  },
  {
    controlId: 'WB-1.2',
    name: 'Whistleblower Protection',
    description: 'Protect whistleblowers from retaliation.',
    category: 'Protection',
    implementationGuidance: 'Define protection measures. Prohibit retaliation. Train managers. Document protection.',
    evidenceRequirements: ['Protection measures', 'Anti-retaliation policy', 'Manager training', 'Protection documentation'],
    testProcedures: ['Review measures', 'Verify policy', 'Check training', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'WB-2.1',
    name: 'Report Handling',
    description: 'Process and investigate whistleblower reports.',
    category: 'Investigation',
    implementationGuidance: 'Acknowledge reports. Investigate thoroughly. Provide feedback. Document outcomes.',
    evidenceRequirements: ['Acknowledgment records', 'Investigation records', 'Feedback documentation', 'Outcome records'],
    testProcedures: ['Verify acknowledgment', 'Review investigations', 'Check feedback', 'Assess outcomes'],
    status: 'Not Started'
  },
  {
    controlId: 'WB-2.2',
    name: 'Record Keeping',
    description: 'Maintain records of whistleblower reports and actions.',
    category: 'Documentation',
    implementationGuidance: 'Record all reports. Maintain confidential records. Retain appropriately. Secure records.',
    evidenceRequirements: ['Report records', 'Confidential storage', 'Retention schedule', 'Security measures'],
    testProcedures: ['Review records', 'Verify confidentiality', 'Check retention', 'Assess security'],
    status: 'Not Started'
  }
];

export const EU_PRODUCT_LIABILITY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'PL-1.1',
    name: 'Product Safety Assessment',
    description: 'Assess products for safety defects.',
    category: 'Safety',
    implementationGuidance: 'Conduct safety assessments. Identify defects. Document assessments. Address findings.',
    evidenceRequirements: ['Safety assessments', 'Defect identification', 'Assessment documentation', 'Finding remediation'],
    testProcedures: ['Review assessments', 'Verify defects', 'Check documentation', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'PL-1.2',
    name: 'Product Documentation',
    description: 'Maintain product documentation for liability purposes.',
    category: 'Documentation',
    implementationGuidance: 'Document design decisions. Record testing. Maintain specifications. Archive records.',
    evidenceRequirements: ['Design documentation', 'Testing records', 'Product specifications', 'Archived records'],
    testProcedures: ['Review design docs', 'Verify testing', 'Check specs', 'Assess archives'],
    status: 'Not Started'
  },
  {
    controlId: 'PL-2.1',
    name: 'Defect Tracking',
    description: 'Track and address product defects.',
    category: 'Defect Management',
    implementationGuidance: 'Track reported defects. Investigate causes. Implement corrections. Document actions.',
    evidenceRequirements: ['Defect tracking', 'Cause investigation', 'Correction implementation', 'Action documentation'],
    testProcedures: ['Review tracking', 'Verify investigation', 'Check corrections', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PL-2.2',
    name: 'Software Component Tracking',
    description: 'Track software components in products for liability.',
    category: 'Software',
    implementationGuidance: 'Inventory software components. Track versions. Document dependencies. Maintain SBOMs.',
    evidenceRequirements: ['Component inventory', 'Version tracking', 'Dependency documentation', 'SBOM records'],
    testProcedures: ['Review inventory', 'Verify versions', 'Check dependencies', 'Assess SBOMs'],
    status: 'Not Started'
  }
];

export const MACHINERY_REGULATION_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MR-1.1',
    name: 'Essential Health and Safety Requirements',
    description: 'Meet essential health and safety requirements for machinery.',
    category: 'Safety Requirements',
    implementationGuidance: 'Identify applicable EHSRs. Implement requirements. Document compliance. Conduct conformity assessment.',
    evidenceRequirements: ['EHSR identification', 'Requirement implementation', 'Compliance documentation', 'Conformity assessment'],
    testProcedures: ['Review EHSRs', 'Verify implementation', 'Check documentation', 'Assess conformity'],
    status: 'Not Started'
  },
  {
    controlId: 'MR-1.2',
    name: 'Risk Assessment for Machinery',
    description: 'Conduct risk assessment for machinery design.',
    category: 'Risk Assessment',
    implementationGuidance: 'Identify hazards. Assess risks. Implement controls. Document risk reduction.',
    evidenceRequirements: ['Hazard identification', 'Risk assessment', 'Control implementation', 'Risk reduction documentation'],
    testProcedures: ['Review hazards', 'Verify assessment', 'Check controls', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MR-2.1',
    name: 'Software Safety for Machinery',
    description: 'Ensure safety of software controlling machinery.',
    category: 'Software Safety',
    implementationGuidance: 'Assess software safety. Implement safety functions. Test safety software. Document software safety.',
    evidenceRequirements: ['Safety assessment', 'Safety function implementation', 'Testing records', 'Safety documentation'],
    testProcedures: ['Review assessment', 'Test functions', 'Check testing', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'MR-2.2',
    name: 'Technical File',
    description: 'Prepare technical file for machinery.',
    category: 'Documentation',
    implementationGuidance: 'Compile technical documentation. Include risk assessment. Document safety measures. Maintain file.',
    evidenceRequirements: ['Technical file', 'Risk assessment documentation', 'Safety measures', 'File maintenance'],
    testProcedures: ['Review file', 'Verify risk assessment', 'Check safety measures', 'Assess maintenance'],
    status: 'Not Started'
  }
];

export const EPRIVACY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ePD-1.1',
    name: 'Cookie Consent',
    description: 'Obtain consent for cookies and similar technologies.',
    category: 'Consent',
    implementationGuidance: 'Implement cookie consent. Provide clear information. Allow granular control. Document consent.',
    evidenceRequirements: ['Consent mechanism', 'Information provision', 'Control options', 'Consent records'],
    testProcedures: ['Test consent', 'Verify information', 'Check controls', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'ePD-1.2',
    name: 'Communication Confidentiality',
    description: 'Ensure confidentiality of electronic communications.',
    category: 'Confidentiality',
    implementationGuidance: 'Protect communications. Implement encryption. Control access. Monitor compliance.',
    evidenceRequirements: ['Communication protection', 'Encryption implementation', 'Access controls', 'Compliance monitoring'],
    testProcedures: ['Test protection', 'Verify encryption', 'Check controls', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ePD-2.1',
    name: 'Direct Marketing Consent',
    description: 'Obtain consent for direct marketing communications.',
    category: 'Marketing',
    implementationGuidance: 'Obtain marketing consent. Provide opt-out. Track preferences. Document consent.',
    evidenceRequirements: ['Marketing consent', 'Opt-out mechanism', 'Preference tracking', 'Consent documentation'],
    testProcedures: ['Verify consent', 'Test opt-out', 'Check tracking', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ePD-2.2',
    name: 'Traffic Data Handling',
    description: 'Handle traffic and location data appropriately.',
    category: 'Data Handling',
    implementationGuidance: 'Identify traffic data. Process only as permitted. Anonymize when possible. Document handling.',
    evidenceRequirements: ['Traffic data identification', 'Processing procedures', 'Anonymization records', 'Handling documentation'],
    testProcedures: ['Review identification', 'Verify processing', 'Check anonymization', 'Assess documentation'],
    status: 'Not Started'
  }
];

export const MIFID_II_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MiFID-1.1',
    name: 'Client Classification',
    description: 'Classify clients per MiFID II requirements.',
    category: 'Client Classification',
    implementationGuidance: 'Classify clients. Document classification. Notify clients. Review classifications.',
    evidenceRequirements: ['Client classification', 'Classification documentation', 'Client notifications', 'Review records'],
    testProcedures: ['Verify classification', 'Check documentation', 'Review notifications', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'MiFID-1.2',
    name: 'Suitability Assessment',
    description: 'Conduct suitability assessments for investment advice.',
    category: 'Suitability',
    implementationGuidance: 'Gather client information. Assess suitability. Document assessments. Provide suitability reports.',
    evidenceRequirements: ['Client information', 'Suitability assessments', 'Assessment documentation', 'Suitability reports'],
    testProcedures: ['Review information', 'Verify assessments', 'Check documentation', 'Assess reports'],
    status: 'Not Started'
  },
  {
    controlId: 'MiFID-2.1',
    name: 'Best Execution',
    description: 'Ensure best execution of client orders.',
    category: 'Best Execution',
    implementationGuidance: 'Define execution policy. Monitor execution. Report execution quality. Review policy.',
    evidenceRequirements: ['Execution policy', 'Monitoring records', 'Execution reports', 'Policy reviews'],
    testProcedures: ['Review policy', 'Verify monitoring', 'Check reports', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'MiFID-2.2',
    name: 'Transaction Reporting',
    description: 'Report transactions to competent authorities.',
    category: 'Reporting',
    implementationGuidance: 'Capture transaction data. Report accurately. Report timely. Maintain records.',
    evidenceRequirements: ['Transaction data', 'Report accuracy', 'Reporting timeliness', 'Record retention'],
    testProcedures: ['Verify data', 'Check accuracy', 'Review timeliness', 'Assess retention'],
    status: 'Not Started'
  },
  {
    controlId: 'MiFID-3.1',
    name: 'Record Keeping Requirements',
    description: 'Maintain records per MiFID II requirements.',
    category: 'Record Keeping',
    implementationGuidance: 'Identify record requirements. Maintain records. Ensure accessibility. Retain appropriately.',
    evidenceRequirements: ['Record requirements', 'Record maintenance', 'Accessibility evidence', 'Retention compliance'],
    testProcedures: ['Review requirements', 'Verify maintenance', 'Check accessibility', 'Assess retention'],
    status: 'Not Started'
  }
];

export const PSD2_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'PSD2-1.1',
    name: 'Strong Customer Authentication',
    description: 'Implement strong customer authentication for payment transactions.',
    category: 'Authentication',
    implementationGuidance: 'Implement SCA. Use two or more factors. Apply exemptions appropriately. Document SCA.',
    evidenceRequirements: ['SCA implementation', 'Factor configuration', 'Exemption application', 'SCA documentation'],
    testProcedures: ['Test SCA', 'Verify factors', 'Check exemptions', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PSD2-1.2',
    name: 'Dynamic Linking',
    description: 'Implement dynamic linking for remote payment transactions.',
    category: 'Transaction Security',
    implementationGuidance: 'Link authentication to amount and payee. Display transaction details. Protect authentication code. Document linking.',
    evidenceRequirements: ['Dynamic linking', 'Detail display', 'Code protection', 'Linking documentation'],
    testProcedures: ['Test linking', 'Verify display', 'Check protection', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PSD2-2.1',
    name: 'Third Party Provider Access',
    description: 'Enable access for authorized third party providers.',
    category: 'Open Banking',
    implementationGuidance: 'Implement APIs. Authenticate TPPs. Control access. Log transactions.',
    evidenceRequirements: ['API implementation', 'TPP authentication', 'Access controls', 'Transaction logs'],
    testProcedures: ['Test APIs', 'Verify authentication', 'Check controls', 'Review logs'],
    status: 'Not Started'
  },
  {
    controlId: 'PSD2-2.2',
    name: 'Consent Management for TPPs',
    description: 'Manage customer consent for third party provider access.',
    category: 'Consent',
    implementationGuidance: 'Obtain customer consent. Track consent status. Enable revocation. Document consent.',
    evidenceRequirements: ['Consent collection', 'Status tracking', 'Revocation mechanism', 'Consent documentation'],
    testProcedures: ['Test consent', 'Verify tracking', 'Check revocation', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'PSD2-3.1',
    name: 'Fraud Monitoring',
    description: 'Implement fraud monitoring for payment transactions.',
    category: 'Fraud Prevention',
    implementationGuidance: 'Monitor transactions. Detect anomalies. Block suspicious activity. Document monitoring.',
    evidenceRequirements: ['Transaction monitoring', 'Anomaly detection', 'Activity blocking', 'Monitoring documentation'],
    testProcedures: ['Test monitoring', 'Verify detection', 'Check blocking', 'Review documentation'],
    status: 'Not Started'
  }
];

export const ENISA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ENISA-1.1',
    name: 'Risk Assessment Methodology',
    description: 'Apply ENISA risk assessment methodology.',
    category: 'Risk Assessment',
    implementationGuidance: 'Adopt ENISA methodology. Identify assets. Assess threats. Document risks.',
    evidenceRequirements: ['Methodology adoption', 'Asset identification', 'Threat assessment', 'Risk documentation'],
    testProcedures: ['Review methodology', 'Verify assets', 'Check threats', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ENISA-1.2',
    name: 'Security Measures Implementation',
    description: 'Implement ENISA recommended security measures.',
    category: 'Security Measures',
    implementationGuidance: 'Review ENISA recommendations. Implement applicable measures. Document implementation. Monitor effectiveness.',
    evidenceRequirements: ['Recommendation review', 'Measure implementation', 'Implementation documentation', 'Effectiveness monitoring'],
    testProcedures: ['Review recommendations', 'Verify implementation', 'Check documentation', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ENISA-2.1',
    name: 'Incident Reporting',
    description: 'Report significant incidents per ENISA guidelines.',
    category: 'Incident Reporting',
    implementationGuidance: 'Define significant incidents. Report appropriately. Document incidents. Analyze trends.',
    evidenceRequirements: ['Incident definitions', 'Reporting records', 'Incident documentation', 'Trend analysis'],
    testProcedures: ['Review definitions', 'Verify reporting', 'Check documentation', 'Assess analysis'],
    status: 'Not Started'
  },
  {
    controlId: 'ENISA-2.2',
    name: 'Threat Intelligence',
    description: 'Utilize ENISA threat intelligence.',
    category: 'Threat Intelligence',
    implementationGuidance: 'Subscribe to ENISA intelligence. Analyze threats. Apply intelligence. Document usage.',
    evidenceRequirements: ['Intelligence subscription', 'Threat analysis', 'Intelligence application', 'Usage documentation'],
    testProcedures: ['Verify subscription', 'Review analysis', 'Check application', 'Assess documentation'],
    status: 'Not Started'
  }
];

export const ADEQUACY_DECISION_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'AD-1.1',
    name: 'Transfer Mechanism Compliance',
    description: 'Ensure data transfers comply with adequacy decision requirements.',
    category: 'Data Transfers',
    implementationGuidance: 'Identify covered transfers. Verify adequacy scope. Document transfer basis. Monitor compliance.',
    evidenceRequirements: ['Transfer identification', 'Adequacy verification', 'Transfer documentation', 'Compliance monitoring'],
    testProcedures: ['Review transfers', 'Verify scope', 'Check documentation', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'AD-1.2',
    name: 'Third Country Data Handling',
    description: 'Handle data transferred to adequate third countries appropriately.',
    category: 'Data Handling',
    implementationGuidance: 'Apply adequacy decision. Maintain protections. Monitor changes. Document handling.',
    evidenceRequirements: ['Adequacy application', 'Protection maintenance', 'Change monitoring', 'Handling documentation'],
    testProcedures: ['Verify application', 'Check protections', 'Review monitoring', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'AD-2.1',
    name: 'Adequacy Decision Monitoring',
    description: 'Monitor for changes to adequacy decisions.',
    category: 'Monitoring',
    implementationGuidance: 'Track adequacy decisions. Monitor changes. Plan for changes. Update procedures.',
    evidenceRequirements: ['Decision tracking', 'Change monitoring', 'Contingency plans', 'Procedure updates'],
    testProcedures: ['Review tracking', 'Verify monitoring', 'Check plans', 'Assess updates'],
    status: 'Not Started'
  }
];
