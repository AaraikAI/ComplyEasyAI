import { FrameworkControlTemplate } from './soc2Controls';

/**
 * EU Cyber Resilience Act (CRA) - Regulation (EU) 2024/2847
 * Cybersecurity requirements for products with digital elements
 */
export const EU_CRA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Chapter I: Essential Cybersecurity Requirements =====
  {
    controlId: 'CRA-1.1',
    name: 'Security by Design and Default',
    description: 'Products with digital elements must be designed, developed, and produced to ensure appropriate level of cybersecurity based on risks. Security must be built into products from inception and enabled by default.',
    category: 'Essential Requirements',
    implementationGuidance: 'Integrate security requirements into product design phase. Conduct threat modeling during development. Enable secure default configurations. Document security design decisions.',
    evidenceRequirements: [
      'Security requirements documentation in product specifications',
      'Threat modeling reports for product development',
      'Default configuration security analysis',
      'Security design decision records'
    ],
    testProcedures: [
      'Review product specifications for security requirements',
      'Verify threat modeling was conducted during development',
      'Test default configurations for security posture',
      'Assess security design decision documentation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-1.2',
    name: 'Vulnerability Management',
    description: 'Manufacturers must identify and document vulnerabilities and components in products, address vulnerabilities through security updates, and apply effective vulnerability handling and disclosure.',
    category: 'Essential Requirements',
    implementationGuidance: 'Establish vulnerability identification and tracking process. Maintain software bill of materials (SBOM). Implement security update development and distribution. Create coordinated vulnerability disclosure process.',
    evidenceRequirements: [
      'Vulnerability tracking system and records',
      'Software bill of materials (SBOM) for products',
      'Security update development and release records',
      'Vulnerability disclosure policy and records'
    ],
    testProcedures: [
      'Review vulnerability tracking system effectiveness',
      'Verify SBOM completeness and accuracy',
      'Test security update distribution mechanism',
      'Assess vulnerability disclosure process compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-1.3',
    name: 'Protection Against Unauthorized Access',
    description: 'Products must protect confidentiality and integrity of stored, transmitted, and processed data against unauthorized access. Implement appropriate authentication, authorization, and access control mechanisms.',
    category: 'Essential Requirements',
    implementationGuidance: 'Implement strong authentication mechanisms. Apply encryption for data at rest and in transit. Implement role-based access control. Monitor for unauthorized access attempts.',
    evidenceRequirements: [
      'Authentication mechanism documentation',
      'Encryption implementation specifications',
      'Access control policy and configuration',
      'Unauthorized access monitoring records'
    ],
    testProcedures: [
      'Test authentication mechanism strength',
      'Verify encryption implementation correctness',
      'Review access control configuration adequacy',
      'Assess monitoring and alerting effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-1.4',
    name: 'Availability and Resilience',
    description: 'Products must minimize negative impact on availability of services provided by other devices or networks. Products should be resilient against denial of service attacks and recover appropriately.',
    category: 'Essential Requirements',
    implementationGuidance: 'Design products for service resilience. Implement DoS protection mechanisms. Enable graceful degradation under attack. Provide recovery mechanisms and documentation.',
    evidenceRequirements: [
      'Resilience design documentation',
      'DoS protection implementation records',
      'Graceful degradation testing results',
      'Recovery procedure documentation'
    ],
    testProcedures: [
      'Test product resilience under stress',
      'Verify DoS protection effectiveness',
      'Assess graceful degradation behavior',
      'Test recovery procedure functionality'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-1.5',
    name: 'Data Minimization',
    description: 'Products must process only data that is necessary for their intended purpose. Personal data processing must comply with data minimization principles.',
    category: 'Essential Requirements',
    implementationGuidance: 'Document data processing purposes and justification. Implement data collection limitations. Review data processing for necessity. Enable user control over data collection.',
    evidenceRequirements: [
      'Data processing purpose documentation',
      'Data minimization implementation records',
      'Data necessity review documentation',
      'User data control feature documentation'
    ],
    testProcedures: [
      'Review data collection against stated purposes',
      'Verify data minimization implementation',
      'Assess data necessity justification adequacy',
      'Test user data control functionality'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-1.6',
    name: 'Secure Default Configuration',
    description: 'Products must be delivered with secure default configurations, including the ability to restore products to original secure state. Default passwords or credentials must not be used.',
    category: 'Essential Requirements',
    implementationGuidance: 'Define secure default configuration standards. Eliminate default passwords and credentials. Implement secure factory reset capability. Document secure configuration requirements.',
    evidenceRequirements: [
      'Secure default configuration documentation',
      'Default credential elimination verification',
      'Factory reset procedure and security',
      'Configuration hardening guidelines'
    ],
    testProcedures: [
      'Review default configuration against security standards',
      'Verify no default passwords exist',
      'Test factory reset security',
      'Assess configuration documentation completeness'
    ],
    status: 'Not Started'
  },

  // ===== Chapter II: Manufacturer Obligations =====
  {
    controlId: 'CRA-2.1',
    name: 'Conformity Assessment',
    description: 'Manufacturers must carry out conformity assessment to demonstrate products meet essential requirements. Assessment methods depend on product criticality classification.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Determine product classification (default, important, critical). Select appropriate conformity assessment procedure. Conduct assessment and document results. Maintain conformity documentation.',
    evidenceRequirements: [
      'Product classification determination',
      'Conformity assessment procedure selection',
      'Assessment results and documentation',
      'Conformity declaration'
    ],
    testProcedures: [
      'Verify correct product classification',
      'Review conformity assessment procedure appropriateness',
      'Assess assessment documentation completeness',
      'Verify conformity declaration accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-2.2',
    name: 'Technical Documentation',
    description: 'Manufacturers must prepare technical documentation demonstrating product compliance with essential requirements before placing on market. Documentation must be kept for 10 years.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Create comprehensive technical documentation covering essential requirements. Include design, development, and production information. Implement document retention for 10-year period. Update documentation when products change.',
    evidenceRequirements: [
      'Technical documentation package',
      'Design and development records',
      'Production process documentation',
      'Document retention and version control records'
    ],
    testProcedures: [
      'Review technical documentation completeness',
      'Verify documentation covers all essential requirements',
      'Assess retention system compliance',
      'Test documentation update process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-2.3',
    name: 'CE Marking and Declaration',
    description: 'Products meeting essential requirements must bear CE marking. Manufacturers must prepare EU declaration of conformity with specified content.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Implement CE marking process and placement. Prepare EU declaration of conformity with required elements. Ensure marking visibility and legibility. Maintain declaration records.',
    evidenceRequirements: [
      'CE marking application procedure',
      'EU declaration of conformity',
      'Marking placement verification records',
      'Declaration maintenance records'
    ],
    testProcedures: [
      'Verify CE marking placement and format',
      'Review declaration content completeness',
      'Assess marking visibility compliance',
      'Verify declaration accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-2.4',
    name: 'Security Update Provision',
    description: 'Manufacturers must ensure security vulnerabilities are handled effectively and provide security updates free of charge for support period of at least 5 years.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Define product support period (minimum 5 years). Establish security update development pipeline. Implement free update distribution mechanism. Track update deployment status.',
    evidenceRequirements: [
      'Product support period documentation',
      'Security update development process',
      'Update distribution system documentation',
      'Update deployment tracking records'
    ],
    testProcedures: [
      'Verify support period meets minimum requirement',
      'Review update development pipeline effectiveness',
      'Test update distribution mechanism',
      'Assess update deployment tracking accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-2.5',
    name: 'Vulnerability Notification to ENISA',
    description: 'Manufacturers must notify ENISA of actively exploited vulnerabilities and incidents within 24 hours of becoming aware. Full notification required within 72 hours.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Establish vulnerability and incident detection process. Define notification trigger criteria. Implement ENISA notification workflow. Track notification compliance.',
    evidenceRequirements: [
      'Vulnerability detection process documentation',
      'Notification criteria and thresholds',
      'ENISA notification procedures',
      'Notification records and timeline tracking'
    ],
    testProcedures: [
      'Test vulnerability detection effectiveness',
      'Review notification criteria accuracy',
      'Verify notification timeline compliance',
      'Assess notification content completeness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-2.6',
    name: 'User Information and Instructions',
    description: 'Manufacturers must provide users with information necessary for secure installation, operation, and maintenance, including security properties, secure configuration, and update installation.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Create comprehensive user security documentation. Include secure installation instructions. Document security features and configuration. Provide update installation guidance.',
    evidenceRequirements: [
      'User security documentation',
      'Secure installation guide',
      'Security feature descriptions',
      'Update installation instructions'
    ],
    testProcedures: [
      'Review user documentation completeness',
      'Test installation instructions accuracy',
      'Verify security feature documentation',
      'Assess update guidance clarity'
    ],
    status: 'Not Started'
  },

  // ===== Chapter III: Importer and Distributor Obligations =====
  {
    controlId: 'CRA-3.1',
    name: 'Importer Due Diligence',
    description: 'Importers must ensure products comply with essential requirements, have conformity assessment, bear CE marking, and are accompanied by required documentation before placing on market.',
    category: 'Importer Obligations',
    implementationGuidance: 'Establish product compliance verification process. Check conformity documentation completeness. Verify CE marking presence and format. Maintain importer verification records.',
    evidenceRequirements: [
      'Product compliance verification procedures',
      'Conformity documentation review records',
      'CE marking verification records',
      'Importer due diligence documentation'
    ],
    testProcedures: [
      'Review compliance verification process effectiveness',
      'Test conformity documentation review thoroughness',
      'Verify CE marking verification accuracy',
      'Assess due diligence documentation completeness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-3.2',
    name: 'Distributor Verification',
    description: 'Distributors must verify products bear CE marking, are accompanied by required documentation, and that manufacturer and importer have complied with their obligations.',
    category: 'Distributor Obligations',
    implementationGuidance: 'Implement distributor verification checklist. Train distribution staff on CRA requirements. Maintain verification records. Establish non-compliance escalation process.',
    evidenceRequirements: [
      'Distributor verification procedures',
      'Staff training records',
      'Product verification records',
      'Non-compliance escalation documentation'
    ],
    testProcedures: [
      'Review verification procedure adequacy',
      'Verify staff training completion',
      'Test verification record accuracy',
      'Assess escalation process effectiveness'
    ],
    status: 'Not Started'
  },

  // ===== Chapter IV: Product Classification and Assessment =====
  {
    controlId: 'CRA-4.1',
    name: 'Important Product Classification',
    description: 'Products listed in Annex III as important (Class I or Class II) require specific conformity assessment procedures. Class II products require third-party assessment.',
    category: 'Product Classification',
    implementationGuidance: 'Review product against Annex III categories. Determine Class I or Class II designation. Select appropriate conformity assessment. Engage notified body for Class II products.',
    evidenceRequirements: [
      'Product classification analysis',
      'Annex III mapping documentation',
      'Conformity assessment selection rationale',
      'Notified body engagement records (Class II)'
    ],
    testProcedures: [
      'Verify classification analysis accuracy',
      'Review Annex III mapping completeness',
      'Assess conformity assessment appropriateness',
      'Verify notified body qualification (Class II)'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-4.2',
    name: 'Critical Product Assessment',
    description: 'Products listed in Annex IV as critical require European cybersecurity certification under cybersecurity certification schemes.',
    category: 'Product Classification',
    implementationGuidance: 'Review product against Annex IV categories. Identify applicable certification schemes. Obtain required European cybersecurity certification. Maintain certification status.',
    evidenceRequirements: [
      'Critical product classification analysis',
      'Applicable certification scheme identification',
      'Cybersecurity certification documentation',
      'Certification maintenance records'
    ],
    testProcedures: [
      'Verify critical product classification',
      'Review certification scheme applicability',
      'Verify certification validity',
      'Assess certification maintenance process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-4.3',
    name: 'Software Bill of Materials (SBOM)',
    description: 'Manufacturers must identify and document components contained in products, including open source components, and make SBOM available to users and authorities.',
    category: 'Product Documentation',
    implementationGuidance: 'Implement SBOM generation in development pipeline. Track all software components including dependencies. Update SBOM when components change. Provide SBOM access to authorized parties.',
    evidenceRequirements: [
      'SBOM generation process documentation',
      'Complete SBOM for each product',
      'Component tracking and update records',
      'SBOM access provision documentation'
    ],
    testProcedures: [
      'Test SBOM generation accuracy',
      'Verify SBOM completeness against actual components',
      'Review SBOM update process effectiveness',
      'Assess SBOM access mechanisms'
    ],
    status: 'Not Started'
  },

  // ===== Chapter V: Market Surveillance =====
  {
    controlId: 'CRA-5.1',
    name: 'Product Registration',
    description: 'Manufacturers must register products with digital elements in the European database before placing on market, providing required product information.',
    category: 'Market Compliance',
    implementationGuidance: 'Establish product registration process. Gather required registration information. Complete registration before market placement. Update registration when products change.',
    evidenceRequirements: [
      'Product registration procedures',
      'Registration information compilation',
      'Registration confirmation records',
      'Registration update records'
    ],
    testProcedures: [
      'Verify registration process compliance',
      'Review registration information completeness',
      'Confirm registration timing compliance',
      'Test registration update process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-5.2',
    name: 'Cooperation with Market Surveillance Authorities',
    description: 'Economic operators must cooperate with market surveillance authorities, provide requested information, and take corrective action when required.',
    category: 'Market Compliance',
    implementationGuidance: 'Establish authority communication protocols. Designate contact points for market surveillance. Implement information request response process. Create corrective action procedures.',
    evidenceRequirements: [
      'Authority communication procedures',
      'Designated contact point records',
      'Information request response records',
      'Corrective action documentation'
    ],
    testProcedures: [
      'Review communication protocol adequacy',
      'Verify contact point availability',
      'Test information response timeliness',
      'Assess corrective action effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CRA-5.3',
    name: 'Non-Compliance Remediation',
    description: 'When products do not comply with essential requirements, economic operators must take immediate corrective action, including withdrawal or recall where necessary.',
    category: 'Market Compliance',
    implementationGuidance: 'Establish non-compliance detection process. Define remediation action procedures. Implement withdrawal and recall capabilities. Track remediation completion.',
    evidenceRequirements: [
      'Non-compliance detection procedures',
      'Remediation action plans',
      'Withdrawal and recall procedures',
      'Remediation tracking records'
    ],
    testProcedures: [
      'Test non-compliance detection effectiveness',
      'Review remediation plan adequacy',
      'Verify withdrawal/recall capability',
      'Assess remediation tracking accuracy'
    ],
    status: 'Not Started'
  }
];
