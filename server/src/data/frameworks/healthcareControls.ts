import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Healthcare Frameworks
 * EU MDR, EU IVDR, ICH Guidelines, GAMP 5, HL7 FHIR Security, FDA 21 CFR Part 820, GxP
 */

export const EU_MDR_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MDR-1.1',
    name: 'Quality Management System',
    description: 'Establish QMS for medical device design, manufacture, and post-market surveillance.',
    category: 'Quality Management',
    implementationGuidance: 'Implement QMS per Annex IX. Document procedures. Establish quality objectives. Conduct management reviews.',
    evidenceRequirements: ['QMS documentation', 'Quality procedures', 'Quality objectives', 'Management review records'],
    testProcedures: ['Review QMS', 'Verify procedures', 'Check objectives', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'MDR-1.2',
    name: 'Technical Documentation',
    description: 'Prepare technical documentation demonstrating conformity with MDR requirements.',
    category: 'Documentation',
    implementationGuidance: 'Compile technical file. Include design documentation. Document risk management. Maintain clinical evidence.',
    evidenceRequirements: ['Technical file', 'Design documentation', 'Risk management file', 'Clinical evidence'],
    testProcedures: ['Review technical file', 'Verify design docs', 'Check risk file', 'Assess clinical evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'MDR-2.1',
    name: 'Risk Management',
    description: 'Implement risk management throughout device lifecycle per ISO 14971.',
    category: 'Risk Management',
    implementationGuidance: 'Establish risk management process. Identify hazards. Assess risks. Implement controls. Monitor effectiveness.',
    evidenceRequirements: ['Risk management plan', 'Hazard identification', 'Risk assessment', 'Control implementation'],
    testProcedures: ['Review process', 'Verify hazards', 'Check assessments', 'Test controls'],
    status: 'Not Started'
  },
  {
    controlId: 'MDR-2.2',
    name: 'Clinical Evaluation',
    description: 'Conduct clinical evaluation demonstrating safety and performance.',
    category: 'Clinical Evidence',
    implementationGuidance: 'Plan clinical evaluation. Collect clinical data. Analyze data. Document conclusions.',
    evidenceRequirements: ['Clinical evaluation plan', 'Clinical data', 'Data analysis', 'Clinical evaluation report'],
    testProcedures: ['Review plan', 'Verify data', 'Check analysis', 'Assess report'],
    status: 'Not Started'
  },
  {
    controlId: 'MDR-3.1',
    name: 'Post-Market Surveillance',
    description: 'Establish post-market surveillance system for ongoing safety monitoring.',
    category: 'Post-Market',
    implementationGuidance: 'Implement PMS system. Collect field data. Analyze trends. Update risk management.',
    evidenceRequirements: ['PMS plan', 'Field data collection', 'Trend analysis', 'Risk updates'],
    testProcedures: ['Review PMS', 'Verify collection', 'Check analysis', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'MDR-3.2',
    name: 'Vigilance Reporting',
    description: 'Report serious incidents and field safety corrective actions.',
    category: 'Vigilance',
    implementationGuidance: 'Establish reporting procedures. Train staff. Report incidents timely. Document FSCAs.',
    evidenceRequirements: ['Reporting procedures', 'Training records', 'Incident reports', 'FSCA documentation'],
    testProcedures: ['Review procedures', 'Verify training', 'Check reports', 'Assess FSCAs'],
    status: 'Not Started'
  },
  {
    controlId: 'MDR-4.1',
    name: 'UDI System',
    description: 'Implement Unique Device Identification system.',
    category: 'Identification',
    implementationGuidance: 'Assign UDIs. Apply UDI carriers. Submit to EUDAMED. Maintain UDI database.',
    evidenceRequirements: ['UDI assignments', 'UDI carriers', 'EUDAMED submissions', 'UDI database'],
    testProcedures: ['Verify UDIs', 'Check carriers', 'Review submissions', 'Assess database'],
    status: 'Not Started'
  }
];

export const EU_IVDR_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'IVDR-1.1',
    name: 'IVD Quality Management System',
    description: 'Establish QMS for in vitro diagnostic medical device compliance.',
    category: 'Quality Management',
    implementationGuidance: 'Implement QMS for IVDs. Document procedures. Address IVD-specific requirements. Conduct reviews.',
    evidenceRequirements: ['IVD QMS documentation', 'IVD procedures', 'Specific requirements', 'Review records'],
    testProcedures: ['Review QMS', 'Verify procedures', 'Check requirements', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'IVDR-1.2',
    name: 'Performance Evaluation',
    description: 'Conduct performance evaluation for IVD devices.',
    category: 'Performance',
    implementationGuidance: 'Plan performance evaluation. Conduct analytical performance. Assess clinical performance. Document results.',
    evidenceRequirements: ['Performance plan', 'Analytical studies', 'Clinical studies', 'Performance report'],
    testProcedures: ['Review plan', 'Verify analytical', 'Check clinical', 'Assess report'],
    status: 'Not Started'
  },
  {
    controlId: 'IVDR-2.1',
    name: 'IVD Classification',
    description: 'Correctly classify IVD devices according to risk classification rules.',
    category: 'Classification',
    implementationGuidance: 'Apply classification rules. Document rationale. Verify classification. Update as needed.',
    evidenceRequirements: ['Classification analysis', 'Rationale documentation', 'Verification records', 'Update records'],
    testProcedures: ['Review classification', 'Verify rationale', 'Check verification', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'IVDR-2.2',
    name: 'Companion Diagnostics',
    description: 'Address requirements for companion diagnostic devices.',
    category: 'Companion Diagnostics',
    implementationGuidance: 'Identify companion diagnostic use. Coordinate with drug development. Demonstrate clinical utility. Document linkage.',
    evidenceRequirements: ['CDx identification', 'Drug coordination', 'Clinical utility', 'Linkage documentation'],
    testProcedures: ['Verify CDx status', 'Check coordination', 'Review utility', 'Assess linkage'],
    status: 'Not Started'
  }
];

export const ICH_GUIDELINES_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ICH-Q1',
    name: 'Stability Testing',
    description: 'Conduct stability testing per ICH Q1 guidelines.',
    category: 'Quality',
    implementationGuidance: 'Design stability studies. Establish storage conditions. Test samples. Analyze results.',
    evidenceRequirements: ['Study protocols', 'Storage conditions', 'Test results', 'Analysis reports'],
    testProcedures: ['Review protocols', 'Verify conditions', 'Check results', 'Assess reports'],
    status: 'Not Started'
  },
  {
    controlId: 'ICH-Q2',
    name: 'Analytical Validation',
    description: 'Validate analytical procedures per ICH Q2 guidelines.',
    category: 'Quality',
    implementationGuidance: 'Identify validation parameters. Conduct validation. Document results. Maintain validation status.',
    evidenceRequirements: ['Validation parameters', 'Validation studies', 'Result documentation', 'Status records'],
    testProcedures: ['Review parameters', 'Verify studies', 'Check documentation', 'Assess status'],
    status: 'Not Started'
  },
  {
    controlId: 'ICH-Q7',
    name: 'GMP for APIs',
    description: 'Implement GMP for Active Pharmaceutical Ingredients per ICH Q7.',
    category: 'Manufacturing',
    implementationGuidance: 'Establish API GMP system. Control starting materials. Validate processes. Document manufacturing.',
    evidenceRequirements: ['GMP system', 'Material controls', 'Process validation', 'Manufacturing records'],
    testProcedures: ['Review GMP', 'Verify controls', 'Check validation', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'ICH-Q9',
    name: 'Quality Risk Management',
    description: 'Implement quality risk management per ICH Q9.',
    category: 'Risk Management',
    implementationGuidance: 'Establish QRM process. Identify quality risks. Assess and control risks. Monitor effectiveness.',
    evidenceRequirements: ['QRM process', 'Risk identification', 'Risk assessments', 'Monitoring records'],
    testProcedures: ['Review process', 'Verify identification', 'Check assessments', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ICH-Q10',
    name: 'Pharmaceutical Quality System',
    description: 'Implement Pharmaceutical Quality System per ICH Q10.',
    category: 'Quality System',
    implementationGuidance: 'Establish PQS. Define quality objectives. Implement CAPA. Enable continual improvement.',
    evidenceRequirements: ['PQS documentation', 'Quality objectives', 'CAPA system', 'Improvement records'],
    testProcedures: ['Review PQS', 'Verify objectives', 'Check CAPA', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'ICH-E6',
    name: 'Good Clinical Practice',
    description: 'Conduct clinical trials per ICH E6 GCP guidelines.',
    category: 'Clinical',
    implementationGuidance: 'Implement GCP. Obtain informed consent. Ensure data integrity. Protect subject rights.',
    evidenceRequirements: ['GCP implementation', 'Consent forms', 'Data integrity', 'Subject protection'],
    testProcedures: ['Review GCP', 'Verify consent', 'Check integrity', 'Assess protection'],
    status: 'Not Started'
  }
];

export const GAMP5_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'GAMP-1.1',
    name: 'Software Categorization',
    description: 'Categorize software according to GAMP 5 categories.',
    category: 'Categorization',
    implementationGuidance: 'Assess software type. Assign GAMP category. Document rationale. Determine validation approach.',
    evidenceRequirements: ['Software assessment', 'Category assignment', 'Rationale documentation', 'Validation approach'],
    testProcedures: ['Review assessment', 'Verify category', 'Check rationale', 'Assess approach'],
    status: 'Not Started'
  },
  {
    controlId: 'GAMP-1.2',
    name: 'Risk-Based Approach',
    description: 'Apply risk-based approach to computerized system validation.',
    category: 'Risk Management',
    implementationGuidance: 'Assess system risks. Determine validation extent. Focus on critical aspects. Document risk decisions.',
    evidenceRequirements: ['Risk assessment', 'Validation extent', 'Critical aspects', 'Risk decisions'],
    testProcedures: ['Review risks', 'Verify extent', 'Check focus', 'Assess decisions'],
    status: 'Not Started'
  },
  {
    controlId: 'GAMP-2.1',
    name: 'Validation Planning',
    description: 'Develop validation plan for computerized systems.',
    category: 'Validation',
    implementationGuidance: 'Define validation scope. Plan validation activities. Assign responsibilities. Define acceptance criteria.',
    evidenceRequirements: ['Validation plan', 'Activity schedule', 'Responsibility matrix', 'Acceptance criteria'],
    testProcedures: ['Review plan', 'Verify activities', 'Check responsibilities', 'Assess criteria'],
    status: 'Not Started'
  },
  {
    controlId: 'GAMP-2.2',
    name: 'Specification Development',
    description: 'Develop specifications per GAMP 5 guidance.',
    category: 'Specification',
    implementationGuidance: 'Define user requirements. Develop functional specifications. Create design specifications. Trace requirements.',
    evidenceRequirements: ['User requirements', 'Functional specs', 'Design specs', 'Traceability matrix'],
    testProcedures: ['Review URS', 'Verify FS', 'Check DS', 'Assess traceability'],
    status: 'Not Started'
  },
  {
    controlId: 'GAMP-3.1',
    name: 'Testing and Qualification',
    description: 'Execute testing and qualification activities.',
    category: 'Testing',
    implementationGuidance: 'Execute IQ/OQ/PQ. Document results. Address deviations. Obtain approval.',
    evidenceRequirements: ['IQ protocol/report', 'OQ protocol/report', 'PQ protocol/report', 'Deviation records'],
    testProcedures: ['Review IQ', 'Verify OQ', 'Check PQ', 'Assess deviations'],
    status: 'Not Started'
  },
  {
    controlId: 'GAMP-4.1',
    name: 'Operational Controls',
    description: 'Implement operational controls for validated systems.',
    category: 'Operations',
    implementationGuidance: 'Implement change control. Establish incident management. Conduct periodic reviews. Maintain validation status.',
    evidenceRequirements: ['Change control', 'Incident management', 'Periodic reviews', 'Validation status'],
    testProcedures: ['Test change control', 'Verify incidents', 'Check reviews', 'Assess status'],
    status: 'Not Started'
  }
];

export const HL7_FHIR_SECURITY_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'FHIR-SEC-1.1',
    name: 'SMART on FHIR Authorization',
    description: 'Implement SMART on FHIR authorization for secure access.',
    category: 'Authorization',
    implementationGuidance: 'Implement OAuth 2.0. Support SMART scopes. Handle authorization flows. Validate tokens.',
    evidenceRequirements: ['OAuth implementation', 'Scope configuration', 'Flow implementation', 'Token validation'],
    testProcedures: ['Test OAuth', 'Verify scopes', 'Check flows', 'Assess validation'],
    status: 'Not Started'
  },
  {
    controlId: 'FHIR-SEC-1.2',
    name: 'Transport Security',
    description: 'Secure FHIR API communications using TLS.',
    category: 'Transport',
    implementationGuidance: 'Require TLS 1.2+. Configure certificates. Implement HSTS. Validate connections.',
    evidenceRequirements: ['TLS configuration', 'Certificate management', 'HSTS implementation', 'Connection validation'],
    testProcedures: ['Test TLS', 'Verify certificates', 'Check HSTS', 'Assess connections'],
    status: 'Not Started'
  },
  {
    controlId: 'FHIR-SEC-2.1',
    name: 'Resource Authorization',
    description: 'Implement resource-level access control for FHIR resources.',
    category: 'Access Control',
    implementationGuidance: 'Define access policies. Implement resource authorization. Filter responses. Audit access.',
    evidenceRequirements: ['Access policies', 'Authorization implementation', 'Response filtering', 'Access audit'],
    testProcedures: ['Review policies', 'Test authorization', 'Verify filtering', 'Check audit'],
    status: 'Not Started'
  },
  {
    controlId: 'FHIR-SEC-2.2',
    name: 'Audit Logging',
    description: 'Implement FHIR AuditEvent logging.',
    category: 'Audit',
    implementationGuidance: 'Log all access. Create AuditEvent resources. Protect audit logs. Enable analysis.',
    evidenceRequirements: ['Access logging', 'AuditEvent creation', 'Log protection', 'Analysis capability'],
    testProcedures: ['Test logging', 'Verify AuditEvents', 'Check protection', 'Assess analysis'],
    status: 'Not Started'
  },
  {
    controlId: 'FHIR-SEC-3.1',
    name: 'Consent Management',
    description: 'Implement FHIR Consent resource for patient consent management.',
    category: 'Consent',
    implementationGuidance: 'Support Consent resource. Enforce consent decisions. Track consent changes. Respect patient wishes.',
    evidenceRequirements: ['Consent support', 'Enforcement mechanism', 'Change tracking', 'Patient preferences'],
    testProcedures: ['Test Consent', 'Verify enforcement', 'Check tracking', 'Assess preferences'],
    status: 'Not Started'
  }
];

export const FDA_21_CFR_820_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: '820.20',
    name: 'Management Responsibility',
    description: 'Establish quality policy and ensure QMS implementation.',
    category: 'Management',
    implementationGuidance: 'Define quality policy. Assign responsibilities. Provide resources. Conduct management reviews.',
    evidenceRequirements: ['Quality policy', 'Responsibility assignments', 'Resource allocation', 'Management review records'],
    testProcedures: ['Review policy', 'Verify responsibilities', 'Check resources', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: '820.22',
    name: 'Quality Audit',
    description: 'Conduct quality audits to ensure QMS compliance.',
    category: 'Audit',
    implementationGuidance: 'Plan audits. Conduct internal audits. Document findings. Track corrective actions.',
    evidenceRequirements: ['Audit plan', 'Audit reports', 'Finding documentation', 'Corrective action tracking'],
    testProcedures: ['Review plan', 'Verify audits', 'Check findings', 'Assess actions'],
    status: 'Not Started'
  },
  {
    controlId: '820.30',
    name: 'Design Controls',
    description: 'Implement design controls throughout device development.',
    category: 'Design',
    implementationGuidance: 'Plan design activities. Define inputs/outputs. Conduct reviews. Verify and validate design.',
    evidenceRequirements: ['Design plan', 'Design inputs/outputs', 'Design reviews', 'V&V records'],
    testProcedures: ['Review plan', 'Verify I/O', 'Check reviews', 'Assess V&V'],
    status: 'Not Started'
  },
  {
    controlId: '820.50',
    name: 'Purchasing Controls',
    description: 'Ensure purchased products meet requirements.',
    category: 'Purchasing',
    implementationGuidance: 'Evaluate suppliers. Define requirements. Verify products. Maintain supplier records.',
    evidenceRequirements: ['Supplier evaluation', 'Purchase requirements', 'Product verification', 'Supplier records'],
    testProcedures: ['Review suppliers', 'Verify requirements', 'Check verification', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: '820.70',
    name: 'Production and Process Controls',
    description: 'Control production processes to ensure product quality.',
    category: 'Production',
    implementationGuidance: 'Document processes. Validate processes. Monitor production. Control environment.',
    evidenceRequirements: ['Process documentation', 'Validation records', 'Monitoring data', 'Environmental controls'],
    testProcedures: ['Review processes', 'Verify validation', 'Check monitoring', 'Assess environment'],
    status: 'Not Started'
  },
  {
    controlId: '820.90',
    name: 'Nonconforming Product',
    description: 'Control nonconforming product to prevent unintended use.',
    category: 'Quality',
    implementationGuidance: 'Identify nonconforming product. Segregate product. Evaluate for disposition. Document actions.',
    evidenceRequirements: ['Identification records', 'Segregation evidence', 'Evaluation records', 'Action documentation'],
    testProcedures: ['Verify identification', 'Check segregation', 'Review evaluation', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: '820.100',
    name: 'CAPA',
    description: 'Implement corrective and preventive action procedures.',
    category: 'CAPA',
    implementationGuidance: 'Analyze quality data. Identify root causes. Implement corrections. Verify effectiveness.',
    evidenceRequirements: ['Data analysis', 'Root cause analysis', 'Corrective actions', 'Effectiveness verification'],
    testProcedures: ['Review analysis', 'Verify root causes', 'Check actions', 'Assess verification'],
    status: 'Not Started'
  },
  {
    controlId: '820.180',
    name: 'Device Master Record',
    description: 'Maintain device master record with complete specifications.',
    category: 'Documentation',
    implementationGuidance: 'Compile specifications. Document processes. Include labeling. Maintain current version.',
    evidenceRequirements: ['DMR contents', 'Process documents', 'Labeling specifications', 'Version control'],
    testProcedures: ['Review DMR', 'Verify processes', 'Check labeling', 'Assess version control'],
    status: 'Not Started'
  },
  {
    controlId: '820.184',
    name: 'Device History Record',
    description: 'Maintain device history record for manufactured devices.',
    category: 'Documentation',
    implementationGuidance: 'Document manufacturing history. Include dates. Record quantities. Track acceptance.',
    evidenceRequirements: ['DHR records', 'Manufacturing dates', 'Quantity records', 'Acceptance records'],
    testProcedures: ['Review DHR', 'Verify dates', 'Check quantities', 'Assess acceptance'],
    status: 'Not Started'
  }
];

export const GXP_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'GxP-1.1',
    name: 'Documentation Practices',
    description: 'Implement Good Documentation Practices across GxP activities.',
    category: 'Documentation',
    implementationGuidance: 'Define documentation standards. Train personnel. Control documents. Maintain records.',
    evidenceRequirements: ['Documentation standards', 'Training records', 'Document control', 'Record retention'],
    testProcedures: ['Review standards', 'Verify training', 'Check control', 'Assess retention'],
    status: 'Not Started'
  },
  {
    controlId: 'GxP-1.2',
    name: 'Personnel Qualification',
    description: 'Ensure personnel are qualified for GxP activities.',
    category: 'Personnel',
    implementationGuidance: 'Define qualifications. Train personnel. Document competency. Maintain training records.',
    evidenceRequirements: ['Qualification requirements', 'Training program', 'Competency records', 'Training documentation'],
    testProcedures: ['Review qualifications', 'Verify training', 'Check competency', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'GxP-2.1',
    name: 'Equipment Qualification',
    description: 'Qualify equipment used in GxP operations.',
    category: 'Equipment',
    implementationGuidance: 'Qualify equipment. Calibrate instruments. Maintain equipment. Document activities.',
    evidenceRequirements: ['Qualification protocols', 'Calibration records', 'Maintenance records', 'Activity documentation'],
    testProcedures: ['Review qualification', 'Verify calibration', 'Check maintenance', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'GxP-2.2',
    name: 'Facility Controls',
    description: 'Control facilities used in GxP operations.',
    category: 'Facilities',
    implementationGuidance: 'Design appropriate facilities. Control environment. Monitor conditions. Document controls.',
    evidenceRequirements: ['Facility design', 'Environmental controls', 'Monitoring data', 'Control documentation'],
    testProcedures: ['Review design', 'Verify controls', 'Check monitoring', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'GxP-3.1',
    name: 'Data Integrity',
    description: 'Ensure data integrity per ALCOA+ principles.',
    category: 'Data Integrity',
    implementationGuidance: 'Implement ALCOA+ controls. Validate systems. Control data access. Maintain audit trails.',
    evidenceRequirements: ['ALCOA+ implementation', 'System validation', 'Access controls', 'Audit trails'],
    testProcedures: ['Review ALCOA+', 'Verify validation', 'Check access', 'Assess trails'],
    status: 'Not Started'
  },
  {
    controlId: 'GxP-3.2',
    name: 'Change Control',
    description: 'Implement change control for GxP systems and processes.',
    category: 'Change Control',
    implementationGuidance: 'Define change process. Assess impact. Approve changes. Document implementation.',
    evidenceRequirements: ['Change process', 'Impact assessments', 'Approval records', 'Implementation documentation'],
    testProcedures: ['Review process', 'Verify assessments', 'Check approvals', 'Assess documentation'],
    status: 'Not Started'
  }
];
