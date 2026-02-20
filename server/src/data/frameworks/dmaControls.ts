import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Digital Markets Act (DMA) - Regulation (EU) 2022/1925
 * Controls for gatekeeper platforms ensuring fair competition and contestability
 */
export const DMA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Chapter 1: Gatekeeper Designation =====
  {
    controlId: 'DMA-1.1',
    name: 'Gatekeeper Status Assessment',
    description: 'Organizations must assess whether they meet the quantitative thresholds for gatekeeper designation under Article 3: annual turnover >= EUR 7.5 billion in EEA or market capitalization >= EUR 75 billion, providing core platform service in at least 3 EU Member States, and having >= 45 million monthly active end users and >= 10,000 yearly active business users.',
    category: 'Gatekeeper Designation',
    implementationGuidance: 'Conduct annual assessment of turnover, market capitalization, geographic reach, and user metrics. Document methodology for counting active users. Establish monitoring processes to detect when thresholds are approached or exceeded.',
    evidenceRequirements: [
      'Annual turnover calculations with supporting financial statements',
      'Market capitalization records and methodology',
      'Geographic coverage documentation showing Member States served',
      'Monthly active end user (MAU) metrics and counting methodology',
      'Yearly active business user metrics and verification records'
    ],
    testProcedures: [
      'Review financial statements to verify turnover and market cap calculations',
      'Inspect user counting methodology and validate accuracy through sampling',
      'Verify geographic reach through service availability records',
      'Confirm threshold monitoring processes are operational'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-1.2',
    name: 'Core Platform Service Identification',
    description: 'Identify and document all core platform services (CPS) operated by the organization as defined in Article 2, including online intermediation services, online search engines, online social networking services, video-sharing platform services, number-independent interpersonal communications services, operating systems, web browsers, virtual assistants, cloud computing services, and online advertising services.',
    category: 'Gatekeeper Designation',
    implementationGuidance: 'Maintain comprehensive inventory of all digital services. Map each service against DMA Article 2 definitions. Document service interconnections and dependencies. Update inventory when launching new services or modifying existing ones.',
    evidenceRequirements: [
      'Complete inventory of digital services with DMA classification',
      'Service architecture documentation showing interconnections',
      'Legal analysis mapping services to Article 2 definitions',
      'Change management records for service modifications'
    ],
    testProcedures: [
      'Review service inventory for completeness against actual operations',
      'Verify legal classification analysis is current and accurate',
      'Test change management process for capturing new services',
      'Interview service owners to confirm understanding of CPS status'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-1.3',
    name: 'Notification to European Commission',
    description: 'Gatekeepers must notify the European Commission within 2 months of meeting threshold requirements. Notification must include information on turnover, market capitalization, user numbers, and core platform services operated.',
    category: 'Gatekeeper Designation',
    implementationGuidance: 'Establish threshold monitoring with alerting when 80% of any threshold is reached. Prepare notification templates and gather required supporting documentation. Designate responsible personnel for Commission communications.',
    evidenceRequirements: [
      'Threshold monitoring reports and alert configurations',
      'Draft notification templates with required information',
      'Designated contact records for Commission communications',
      'Historical notification records if applicable'
    ],
    testProcedures: [
      'Verify threshold monitoring alerts are configured and functioning',
      'Review notification template completeness against Article 3 requirements',
      'Confirm designated personnel are trained on notification procedures',
      'Test notification timeline processes'
    ],
    status: 'Not Started'
  },

  // ===== Chapter 2: Obligations for Gatekeepers =====
  {
    controlId: 'DMA-2.1',
    name: 'Anti-Self-Preferencing - Search and Ranking',
    description: 'Under Article 6(5), gatekeepers shall not treat more favorably in ranking and indexing, services and products offered by the gatekeeper itself than similar services or products of third parties. Ranking must be based on fair, non-discriminatory, and transparent conditions.',
    category: 'Fair Competition Obligations',
    implementationGuidance: 'Implement ranking algorithms that apply consistent criteria to own and third-party services. Document ranking parameters and weighting. Conduct regular audits for self-preferencing. Establish third-party complaint mechanisms.',
    evidenceRequirements: [
      'Ranking algorithm documentation and parameter definitions',
      'Algorithm audit reports showing equal treatment analysis',
      'Third-party complaint logs and resolution records',
      'A/B testing results demonstrating fair treatment'
    ],
    testProcedures: [
      'Analyze ranking algorithm for self-preferencing indicators',
      'Compare treatment of own vs. third-party services in sample queries',
      'Review complaint handling for ranking-related issues',
      'Verify ranking transparency disclosures are accurate'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.2',
    name: 'Data Access and Portability for Business Users',
    description: 'Under Article 6(10), gatekeepers shall provide business users with free, high-quality, continuous, and real-time access to aggregated and non-aggregated data generated through their activities on the platform, including data provided by end users in the context of using the products or services.',
    category: 'Data Access Obligations',
    implementationGuidance: 'Develop APIs and data export tools for business users. Define data access scope and format standards. Implement real-time data streaming capabilities. Create documentation and support resources for data access.',
    evidenceRequirements: [
      'API documentation and access credentials management',
      'Data export tool specifications and user guides',
      'Real-time data streaming architecture documentation',
      'Business user data access logs and usage statistics'
    ],
    testProcedures: [
      'Test API functionality and data completeness',
      'Verify real-time data streaming latency meets requirements',
      'Review data format compliance with interoperability standards',
      'Assess business user satisfaction with data access tools'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.3',
    name: 'Data Portability for End Users',
    description: 'Under Article 6(9), gatekeepers shall provide end users with effective portability of data they have provided or generated, including continuous and real-time access through appropriate technical tools, free of charge.',
    category: 'Data Access Obligations',
    implementationGuidance: 'Implement data download tools accessible through user settings. Support common data formats (JSON, CSV, XML). Enable automated data transfer to third-party services through APIs. Provide clear instructions for data portability exercise.',
    evidenceRequirements: [
      'Data portability tool implementation documentation',
      'Supported data formats and transfer mechanisms list',
      'User instructions and help documentation',
      'Portability request logs and completion metrics'
    ],
    testProcedures: [
      'Test data download functionality for completeness',
      'Verify data format compatibility with common tools',
      'Assess user experience through usability testing',
      'Measure portability request completion times'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.4',
    name: 'Prohibition on Cross-Service Data Combination',
    description: 'Under Article 5(2), gatekeepers shall not combine personal data from the core platform service with personal data from other services offered by the gatekeeper or third parties, or sign in end users to other gatekeeper services to combine data, unless consent is obtained per GDPR.',
    category: 'Data Use Restrictions',
    implementationGuidance: 'Implement data siloing between core platform services. Deploy consent management for cross-service data use. Audit data flows to identify unauthorized combination. Train personnel on data separation requirements.',
    evidenceRequirements: [
      'Data flow diagrams showing service separation',
      'Consent management system configuration',
      'Data combination audit reports',
      'Technical controls documentation for data siloing'
    ],
    testProcedures: [
      'Review data flow architecture for separation compliance',
      'Test consent collection and respect mechanisms',
      'Audit database queries for cross-service data combination',
      'Verify technical controls prevent unauthorized data sharing'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.5',
    name: 'Interoperability with Third-Party Services',
    description: 'Under Article 7, gatekeepers providing number-independent interpersonal communications services must enable interoperability with third-party providers upon request, including basic functionalities like text messaging and image/voice/video sharing.',
    category: 'Interoperability Obligations',
    implementationGuidance: 'Develop interoperability APIs and protocols. Establish third-party onboarding process for interoperability requests. Implement end-to-end encryption that works across interoperable services. Document security requirements for third parties.',
    evidenceRequirements: [
      'Interoperability API documentation and specifications',
      'Third-party onboarding process documentation',
      'Encryption implementation ensuring cross-service security',
      'Interoperability request tracking and fulfillment records'
    ],
    testProcedures: [
      'Test interoperability functionality with sample third parties',
      'Verify encryption maintains end-to-end protection',
      'Review third-party onboarding timeline compliance',
      'Assess message delivery reliability across services'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.6',
    name: 'App Store Fair Access',
    description: 'Under Article 6(4), gatekeepers shall allow installation and use of third-party software applications or app stores using or interoperating with the operating system, and allow access to functionalities through those apps or stores.',
    category: 'Platform Access Obligations',
    implementationGuidance: 'Enable sideloading of applications outside the primary app store. Provide API access to OS functionalities for third-party app stores. Document security requirements for alternative distribution. Implement user consent flows for alternative stores.',
    evidenceRequirements: [
      'Sideloading capability implementation documentation',
      'Third-party app store API access documentation',
      'Security requirements for alternative distribution',
      'User consent and warning mechanisms for sideloading'
    ],
    testProcedures: [
      'Test sideloading functionality and user experience',
      'Verify third-party app stores can access required APIs',
      'Review security requirements for reasonableness',
      'Assess user consent flow clarity and compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.7',
    name: 'Default Settings and Choice Screens',
    description: 'Under Article 6(3), gatekeepers shall allow end users to change default settings on operating systems, virtual assistants, and web browsers for services like search engines, and provide choice screens enabling users to select alternatives.',
    category: 'User Choice Obligations',
    implementationGuidance: 'Implement accessible settings interfaces for default changes. Design choice screens presenting alternatives fairly. Ensure default changes persist and are respected throughout the system. Document choice screen design rationale.',
    evidenceRequirements: [
      'Settings interface design documentation',
      'Choice screen implementation and design records',
      'User research validating choice screen effectiveness',
      'Default persistence verification test results'
    ],
    testProcedures: [
      'Test default settings change functionality',
      'Evaluate choice screen for fairness in alternative presentation',
      'Verify default changes persist across system updates',
      'Assess user comprehension through usability testing'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.8',
    name: 'Advertising Transparency',
    description: 'Under Article 5(9) and 5(10), gatekeepers shall provide advertisers and publishers with information on prices and fees for advertising services, and provide access to performance measuring tools and information needed to carry out independent verification.',
    category: 'Transparency Obligations',
    implementationGuidance: 'Develop advertising transparency dashboards. Provide detailed pricing breakdowns including all fees. Enable third-party ad verification tool integration. Create advertiser and publisher reporting portals.',
    evidenceRequirements: [
      'Advertising transparency dashboard documentation',
      'Price and fee disclosure templates and records',
      'Third-party verification tool integration documentation',
      'Advertiser/publisher reporting portal specifications'
    ],
    testProcedures: [
      'Review pricing disclosures for completeness and clarity',
      'Test advertiser access to performance data',
      'Verify third-party verification tool functionality',
      'Assess reporting accuracy through sampling'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-2.9',
    name: 'Anti-Circumvention Measures',
    description: 'Under Article 13, gatekeepers shall not engage in any behavior that undermines effective compliance with DMA obligations, regardless of whether that behavior is of a contractual, commercial, technical, or any other nature.',
    category: 'Compliance Obligations',
    implementationGuidance: 'Establish compliance monitoring for all DMA obligations. Review new features and changes for circumvention risk. Train product and engineering teams on anti-circumvention. Document design decisions showing good-faith compliance.',
    evidenceRequirements: [
      'DMA compliance monitoring program documentation',
      'Feature review process for circumvention assessment',
      'Training records for product and engineering teams',
      'Design decision documentation showing compliance intent'
    ],
    testProcedures: [
      'Review compliance monitoring for effectiveness',
      'Assess feature review process coverage',
      'Verify training completion and comprehension',
      'Evaluate design decisions for circumvention indicators'
    ],
    status: 'Not Started'
  },

  // ===== Chapter 3: Compliance and Enforcement =====
  {
    controlId: 'DMA-3.1',
    name: 'Annual Compliance Report',
    description: 'Under Article 11, gatekeepers shall submit to the Commission an annual report describing the measures implemented to ensure compliance with DMA obligations, including consumer profiling techniques, audits, and data protection officer contact information.',
    category: 'Reporting Obligations',
    implementationGuidance: 'Establish annual compliance report preparation process. Document all compliance measures with supporting evidence. Include required information on profiling, audits, and DPO. Submit within required timeframe.',
    evidenceRequirements: [
      'Annual compliance report and submission records',
      'Supporting documentation for reported measures',
      'Consumer profiling technique descriptions',
      'Third-party audit reports included in submission'
    ],
    testProcedures: [
      'Review compliance report for completeness against Article 11',
      'Verify supporting documentation accuracy',
      'Confirm timely submission to Commission',
      'Assess profiling disclosures for adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-3.2',
    name: 'Independent Audit Function',
    description: 'Gatekeepers must conduct or commission independent audits of consumer profiling techniques and submit audit reports to the Commission. Audits must be performed by auditors independent of the gatekeeper.',
    category: 'Audit Requirements',
    implementationGuidance: 'Select qualified independent auditors. Define audit scope covering all profiling techniques. Establish audit frequency and methodology. Implement audit finding remediation process.',
    evidenceRequirements: [
      'Auditor independence verification documentation',
      'Audit scope and methodology documentation',
      'Audit reports and Commission submissions',
      'Remediation plans and completion records'
    ],
    testProcedures: [
      'Verify auditor independence qualifications',
      'Review audit scope for profiling technique coverage',
      'Assess audit findings and remediation effectiveness',
      'Confirm audit report submission to Commission'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-3.3',
    name: 'Compliance Function Establishment',
    description: 'Under Article 28, gatekeepers must establish a compliance function independent of operational functions, staffed with compliance officers having sufficient authority, resources, and access to senior management.',
    category: 'Governance',
    implementationGuidance: 'Create dedicated DMA compliance function with clear reporting lines. Appoint senior compliance officer with direct board access. Ensure adequate resourcing and independence. Define compliance function mandate and responsibilities.',
    evidenceRequirements: [
      'Compliance function organizational structure',
      'Compliance officer appointment and qualifications',
      'Resource allocation documentation',
      'Compliance function charter and mandate'
    ],
    testProcedures: [
      'Review organizational structure for independence',
      'Verify compliance officer qualifications and authority',
      'Assess resource adequacy for compliance activities',
      'Confirm senior management access and reporting'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-3.4',
    name: 'Complaint Handling Mechanism',
    description: 'Gatekeepers must establish and operate internal complaint handling systems for business users and end users regarding non-compliance with DMA obligations.',
    category: 'Complaint Handling',
    implementationGuidance: 'Implement accessible complaint submission channels. Define complaint handling procedures and timelines. Train personnel on complaint resolution. Report complaint metrics to compliance function.',
    evidenceRequirements: [
      'Complaint handling system documentation',
      'Complaint resolution procedures and SLAs',
      'Complaint logs and resolution records',
      'Complaint metrics and trend analysis reports'
    ],
    testProcedures: [
      'Test complaint submission accessibility',
      'Review complaint handling timeline compliance',
      'Assess complaint resolution quality through sampling',
      'Verify complaint escalation to compliance function'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DMA-3.5',
    name: 'Record Keeping and Documentation',
    description: 'Gatekeepers must maintain records demonstrating compliance with DMA obligations, including data on user metrics, ranking algorithms, pricing, and compliance measures, for at least 5 years.',
    category: 'Documentation Requirements',
    implementationGuidance: 'Implement document retention system with 5-year minimum. Categorize records by DMA obligation area. Establish version control for algorithm documentation. Create audit trail for compliance evidence.',
    evidenceRequirements: [
      'Document retention policy aligned with DMA',
      'Records inventory by obligation category',
      'Version control system for algorithms',
      'Audit trail configuration and sample outputs'
    ],
    testProcedures: [
      'Verify retention policy covers 5-year minimum',
      'Test document retrieval capability',
      'Review algorithm version control completeness',
      'Assess audit trail accuracy and completeness'
    ],
    status: 'Not Started'
  }
];
