import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Financial Sector Frameworks
 * Basel III, SOC 3, SOX ITGC, FFIEC CAT, SWIFT CSP, OSFI B-13, APRA CPS 234, MAS TRM, FCA/PRA
 */

export const BASEL_III_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'BASEL-1.1',
    name: 'Operational Risk Management',
    description: 'Establish comprehensive operational risk management framework covering identification, assessment, monitoring, and control.',
    category: 'Operational Risk',
    implementationGuidance: 'Define operational risk framework. Identify risk categories. Assess and measure risks. Implement controls.',
    evidenceRequirements: ['Risk framework', 'Risk identification', 'Risk assessment', 'Control documentation'],
    testProcedures: ['Review framework', 'Verify identification', 'Test assessment', 'Check controls'],
    status: 'Not Started'
  },
  {
    controlId: 'BASEL-1.2',
    name: 'Cyber Risk Management',
    description: 'Include cyber risk within operational risk framework with specific controls and monitoring.',
    category: 'Operational Risk',
    implementationGuidance: 'Identify cyber risks. Implement cyber controls. Monitor cyber threats. Report cyber incidents.',
    evidenceRequirements: ['Cyber risk identification', 'Control implementation', 'Threat monitoring', 'Incident reporting'],
    testProcedures: ['Review cyber risks', 'Test controls', 'Verify monitoring', 'Check reporting'],
    status: 'Not Started'
  },
  {
    controlId: 'BASEL-2.1',
    name: 'Pillar 3 Disclosure',
    description: 'Provide required disclosures for operational risk including cyber risk exposure.',
    category: 'Disclosure',
    implementationGuidance: 'Prepare Pillar 3 disclosures. Include operational risk. Document cyber exposure. Publish as required.',
    evidenceRequirements: ['Pillar 3 reports', 'Operational risk disclosure', 'Cyber exposure documentation', 'Publication records'],
    testProcedures: ['Review disclosures', 'Verify content', 'Check cyber coverage', 'Confirm publication'],
    status: 'Not Started'
  }
];

/**
 * SOC 3 Trust Services Report Controls (AICPA SSAE 21)
 *
 * SOC 3 reports use the IDENTICAL 2017 Trust Services Criteria (with 2022
 * revised points of focus) as SOC 2. The only differences are scope
 * (general-use vs restricted) and the report deliverable (short attestation
 * + AICPA SOC 3 seal vs detailed Type 1 / Type 2 report).
 *
 * Controls below mirror SOC 2 criteria 1:1 to enable direct cross-mapping
 * via controlCrosswalk.ts.
 */
export const SOC3_CONTROLS: FrameworkControlTemplate[] = [
  // ===== CC1: Control Environment =====
  {
    controlId: 'CC1.1',
    name: 'COSO Principle 1: Demonstrates Commitment to Integrity and Ethical Values',
    description: 'The entity demonstrates a commitment to integrity and ethical values. Management and the board establish standards of conduct, evaluate adherence, and remediate deviations in a timely manner.',
    category: 'Control Environment',
    implementationGuidance: 'Establish a formal code of conduct and ethics policy communicated to all personnel. Implement confidential reporting channels for ethics violations. Conduct annual ethics training with mandatory acknowledgment.',
    evidenceRequirements: ['Signed code of conduct acknowledgments', 'Ethics training completion records', 'Whistleblower hotline activity reports', 'Board minutes documenting ethics oversight'],
    testProcedures: ['Inspect code of conduct distribution', 'Interview employees on ethical reporting awareness', 'Review violation logs for investigation and resolution'],
    status: 'Not Started'
  },
  {
    controlId: 'CC1.2',
    name: 'COSO Principle 2: Board Exercises Oversight Responsibility',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control.',
    category: 'Control Environment',
    implementationGuidance: 'Establish independent audit committee with formal charter. Schedule regular board meetings reviewing risk and internal control effectiveness. Document board independence and conflict-of-interest disclosures.',
    evidenceRequirements: ['Audit committee charters', 'Board meeting minutes and attendance', 'Independence assessments', 'Internal control effectiveness reports'],
    testProcedures: ['Inspect audit committee charter for oversight responsibilities', 'Review minutes for internal-control discussions', 'Verify board independence via COI disclosures'],
    status: 'Not Started'
  },
  {
    controlId: 'CC1.3',
    name: 'COSO Principle 3: Establishes Structure, Authority, and Responsibility',
    description: 'Management establishes structures, reporting lines, and appropriate authorities and responsibilities in pursuit of objectives, with board oversight.',
    category: 'Control Environment',
    implementationGuidance: 'Document organizational structure with reporting lines and roles. Implement RACI matrices for key processes. Maintain delegation-of-authority documentation. Review periodically.',
    evidenceRequirements: ['Organizational charts', 'Job descriptions and role definitions', 'Delegation of authority matrices', 'RACI charts for critical processes'],
    testProcedures: ['Inspect org chart for clear reporting lines and SoD', 'Sample roles and verify job description accuracy', 'Review delegation records for approval limits'],
    status: 'Not Started'
  },
  {
    controlId: 'CC1.4',
    name: 'COSO Principle 4: Demonstrates Commitment to Competence',
    description: 'The entity demonstrates commitment to attract, develop, and retain competent individuals in alignment with objectives.',
    category: 'Control Environment',
    implementationGuidance: 'Define competency requirements for each role. Implement formal hiring, onboarding, training, and performance evaluation processes. Maintain succession plans for key positions.',
    evidenceRequirements: ['Job description competency requirements', 'Training program records', 'Performance evaluation documentation', 'Succession plans for key roles'],
    testProcedures: ['Verify hiring criteria meet competency requirements', 'Review training completion for sample employees', 'Examine performance evaluation evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'CC1.5',
    name: 'COSO Principle 5: Enforces Accountability',
    description: 'The entity holds individuals accountable for their internal control responsibilities in pursuit of objectives. (2022 revision: privacy reporting lines and disciplinary actions addressed.)',
    category: 'Control Environment',
    implementationGuidance: 'Define accountability through performance metrics, incentives, and disciplinary processes. Document accountability for privacy-related responsibilities. Conduct regular performance reviews tied to internal control objectives.',
    evidenceRequirements: ['Performance management policies', 'Disciplinary action records', 'Privacy accountability documentation', 'Incentive plans tied to controls'],
    testProcedures: ['Review performance management for control accountability', 'Inspect disciplinary records for control failures', 'Verify privacy reporting lines'],
    status: 'Not Started'
  },

  // ===== CC2: Communication and Information =====
  {
    controlId: 'CC2.1',
    name: 'COSO Principle 13: Uses Relevant, Quality Information',
    description: 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control. (2022 revision: addresses management, classification, completeness/accuracy, and storage.)',
    category: 'Communication and Information',
    implementationGuidance: 'Identify information needs for internal control. Establish data quality standards covering completeness, accuracy, and timeliness. Implement information classification and storage procedures.',
    evidenceRequirements: ['Information requirements documentation', 'Data quality standards and metrics', 'Classification scheme', 'Storage and retention policies'],
    testProcedures: ['Inspect information requirements vs control needs', 'Test data quality controls', 'Verify classification application'],
    status: 'Not Started'
  },
  {
    controlId: 'CC2.2',
    name: 'COSO Principle 14: Communicates Internally',
    description: 'The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control. (2022 revision: privacy awareness and incident reporting.)',
    category: 'Communication and Information',
    implementationGuidance: 'Establish internal communication channels for policies, procedures, and incident reporting. Document privacy awareness program. Communicate roles and responsibilities for internal control.',
    evidenceRequirements: ['Communication policies and channels', 'Privacy awareness training records', 'Incident reporting procedures', 'Internal communications archive'],
    testProcedures: ['Review communication channel effectiveness', 'Verify training reach and content', 'Test incident reporting paths'],
    status: 'Not Started'
  },
  {
    controlId: 'CC2.3',
    name: 'COSO Principle 15: Communicates Externally',
    description: 'The entity communicates with external parties regarding matters affecting the functioning of internal control. (2022 revision: communicating privacy-related incidents.)',
    category: 'Communication and Information',
    implementationGuidance: 'Establish external communication procedures including customer notifications, regulatory disclosures, and incident communications. Document privacy incident notification procedures meeting jurisdictional requirements.',
    evidenceRequirements: ['External communication policies', 'Customer notification templates', 'Regulatory disclosure procedures', 'Privacy incident notification records'],
    testProcedures: ['Inspect external communication policies', 'Review sample external communications', 'Test privacy notification procedures'],
    status: 'Not Started'
  },

  // ===== CC3: Risk Assessment =====
  {
    controlId: 'CC3.1',
    name: 'COSO Principle 6: Specifies Suitable Objectives',
    description: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to those objectives.',
    category: 'Risk Assessment',
    implementationGuidance: 'Define organizational objectives at strategic, operational, reporting, and compliance levels. Document objectives with measurable criteria. Communicate objectives to relevant personnel.',
    evidenceRequirements: ['Strategic plan with objectives', 'Operational objectives documentation', 'Compliance objectives matrix', 'Objective communication records'],
    testProcedures: ['Inspect objective documentation for clarity', 'Verify objectives align with strategy', 'Confirm communication to personnel'],
    status: 'Not Started'
  },
  {
    controlId: 'CC3.2',
    name: 'COSO Principle 7: Identifies and Analyzes Risk',
    description: 'The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed.',
    category: 'Risk Assessment',
    implementationGuidance: 'Implement formal risk identification process covering operational, financial, compliance, and reputational risks. Analyze likelihood and impact. Document risk assessment methodology.',
    evidenceRequirements: ['Risk assessment methodology', 'Risk register with likelihood/impact', 'Risk treatment plans', 'Periodic risk review meetings'],
    testProcedures: ['Review risk assessment methodology', 'Sample risks for analysis completeness', 'Verify periodic review evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'CC3.3',
    name: 'COSO Principle 8: Assesses Fraud Risk',
    description: 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.',
    category: 'Risk Assessment',
    implementationGuidance: 'Conduct formal fraud risk assessment considering fraudulent reporting, asset misappropriation, and corruption. Document fraud risk factors. Implement anti-fraud controls.',
    evidenceRequirements: ['Fraud risk assessment documentation', 'Anti-fraud policies', 'Fraud risk factor analysis', 'Fraud incident investigation procedures'],
    testProcedures: ['Review fraud risk assessment for completeness', 'Verify anti-fraud controls in place', 'Test fraud reporting mechanisms'],
    status: 'Not Started'
  },
  {
    controlId: 'CC3.4',
    name: 'COSO Principle 9: Identifies and Assesses Changes',
    description: 'The entity identifies and assesses changes that could significantly impact the system of internal control.',
    category: 'Risk Assessment',
    implementationGuidance: 'Monitor for changes in business environment, regulations, technology, personnel, and processes. Assess control implications of identified changes. Update controls as needed.',
    evidenceRequirements: ['Change monitoring procedures', 'Change impact assessments', 'Updated control documentation', 'Change management meeting minutes'],
    testProcedures: ['Inspect change monitoring evidence', 'Review sample changes for impact assessment', 'Verify control updates following changes'],
    status: 'Not Started'
  },

  // ===== CC4: Monitoring Activities =====
  {
    controlId: 'CC4.1',
    name: 'COSO Principle 16: Conducts Ongoing and Separate Evaluations',
    description: 'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.',
    category: 'Monitoring Activities',
    implementationGuidance: 'Implement continuous monitoring of key controls. Conduct periodic separate evaluations including internal audits. Document evaluation methodology and frequency.',
    evidenceRequirements: ['Continuous monitoring procedures', 'Internal audit plans and reports', 'Control testing results', 'Management self-assessments'],
    testProcedures: ['Review monitoring coverage', 'Sample internal audit reports', 'Verify control testing frequency'],
    status: 'Not Started'
  },
  {
    controlId: 'CC4.2',
    name: 'COSO Principle 17: Evaluates and Communicates Deficiencies',
    description: 'The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action.',
    category: 'Monitoring Activities',
    implementationGuidance: 'Establish deficiency identification, evaluation, and communication procedures. Define severity classification. Track remediation through closure. Report material deficiencies to management and the board.',
    evidenceRequirements: ['Deficiency tracking log', 'Remediation plans and status', 'Communication procedures', 'Board/management reports on deficiencies'],
    testProcedures: ['Review deficiency log for completeness', 'Sample deficiencies for timely remediation', 'Verify communication evidence'],
    status: 'Not Started'
  },

  // ===== CC5: Control Activities =====
  {
    controlId: 'CC5.1',
    name: 'COSO Principle 10: Selects and Develops Control Activities',
    description: 'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
    category: 'Control Activities',
    implementationGuidance: 'Map controls to identified risks. Select preventive and detective controls based on risk severity. Document control rationale and design.',
    evidenceRequirements: ['Risk-to-control mapping', 'Control design documentation', 'Control selection rationale', 'Control activity inventory'],
    testProcedures: ['Inspect risk-control mapping completeness', 'Verify control design addresses risk', 'Sample controls for operational effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'CC5.2',
    name: 'COSO Principle 11: Selects and Develops General Controls over Technology',
    description: 'The entity selects and develops general control activities over technology to support the achievement of objectives.',
    category: 'Control Activities',
    implementationGuidance: 'Implement IT general controls covering access management, change management, operations, and system development. Document IT control framework. Test ITGCs regularly.',
    evidenceRequirements: ['IT control framework documentation', 'ITGC testing results', 'Access management controls', 'Change management controls'],
    testProcedures: ['Review IT control framework', 'Test access management controls', 'Verify change management evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'CC5.3',
    name: 'COSO Principle 12: Deploys Through Policies and Procedures',
    description: 'The entity deploys control activities through policies that establish what is expected and procedures that put policies into action.',
    category: 'Control Activities',
    implementationGuidance: 'Document policies establishing control expectations. Develop procedures for control execution. Communicate policies and train personnel. Review and update periodically.',
    evidenceRequirements: ['Policy documentation', 'Procedure documentation', 'Training records', 'Policy review schedule'],
    testProcedures: ['Inspect policies for clarity and completeness', 'Verify procedures support policies', 'Confirm training and acknowledgment'],
    status: 'Not Started'
  },

  // ===== CC6: Logical and Physical Access Controls =====
  {
    controlId: 'CC6.1',
    name: 'Logical Access Security Software, Infrastructure, and Architectures',
    description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Deploy access control systems (IAM, PAM). Implement network segmentation, firewalls, and intrusion prevention. Document security architecture. Apply defense in depth.',
    evidenceRequirements: ['IAM/PAM configuration', 'Network architecture diagrams', 'Firewall rule sets', 'Security architecture documentation'],
    testProcedures: ['Inspect access control system configuration', 'Review network architecture for segmentation', 'Test firewall rule effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.2',
    name: 'New User Registration and Authorization',
    description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Implement formal user provisioning workflow with approval. Verify user identity. Assign role-based access. Document access grants. Maintain user inventory.',
    evidenceRequirements: ['User provisioning procedures', 'Access request approvals', 'User access inventory', 'Identity verification records'],
    testProcedures: ['Sample new users for provisioning evidence', 'Verify approval before access granted', 'Confirm role-based assignments'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.3',
    name: 'Access Rights Authorization, Modification, and Removal',
    description: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Define role-based access control matrix. Implement workflows for access changes and terminations. Conduct periodic access reviews. Promptly remove access for terminated users.',
    evidenceRequirements: ['RBAC matrix', 'Access change records', 'Termination access removal log', 'Periodic access review results'],
    testProcedures: ['Sample terminated users for prompt removal', 'Verify role-based access', 'Review access review evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.4',
    name: 'Physical Access Restrictions',
    description: 'The entity restricts physical access to facilities and protected information assets to authorized personnel.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Implement physical access controls (badges, locks, biometrics). Maintain visitor logs. Restrict access to sensitive areas (data centers, server rooms). Review physical access periodically.',
    evidenceRequirements: ['Physical access control policy', 'Badge/visitor logs', 'Data center access lists', 'Physical access reviews'],
    testProcedures: ['Inspect physical security controls', 'Review access logs for sensitive areas', 'Verify visitor procedures'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.5',
    name: 'Discontinuation of Physical Protections',
    description: 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Implement secure media disposal procedures. Wipe or destroy storage media before disposal. Maintain disposal records. Verify disposal vendor certifications.',
    evidenceRequirements: ['Media disposal policy', 'Disposal records', 'Wiping/destruction certificates', 'Vendor certifications'],
    testProcedures: ['Inspect disposal records', 'Verify media wiping procedures', 'Confirm vendor compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.6',
    name: 'Logical Access Security over External Connections',
    description: 'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Implement perimeter security (firewalls, IPS, WAF). Secure remote access via VPN with MFA. Monitor external connections. Apply zero-trust principles.',
    evidenceRequirements: ['Perimeter security configuration', 'VPN access logs', 'External connection monitoring', 'Zero-trust architecture documentation'],
    testProcedures: ['Inspect perimeter security configuration', 'Review remote access logs', 'Test external connection monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.7',
    name: 'Transmission, Movement, and Removal of Information',
    description: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Encrypt data in transit (TLS 1.2+, SSH). Implement DLP for data movement. Restrict and monitor data exports. Control removable media usage.',
    evidenceRequirements: ['Encryption configuration', 'DLP policies and logs', 'Data export approvals', 'Removable media controls'],
    testProcedures: ['Verify encryption in transit', 'Test DLP rules', 'Review data export records', 'Inspect removable media controls'],
    status: 'Not Started'
  },
  {
    controlId: 'CC6.8',
    name: 'Prevention or Detection of Unauthorized Software',
    description: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.',
    category: 'Logical and Physical Access',
    implementationGuidance: 'Deploy endpoint protection (anti-malware, EDR). Implement application whitelisting. Monitor for unauthorized software. Patch and update regularly.',
    evidenceRequirements: ['Endpoint protection coverage', 'EDR/antimalware logs', 'Application whitelisting', 'Patch management records'],
    testProcedures: ['Inspect endpoint protection coverage', 'Review malware detection logs', 'Verify patch compliance'],
    status: 'Not Started'
  },

  // ===== CC7: System Operations =====
  {
    controlId: 'CC7.1',
    name: 'Detection and Monitoring of Configuration Changes',
    description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations and (2) the introduction of new vulnerabilities.',
    category: 'System Operations',
    implementationGuidance: 'Implement configuration management database (CMDB). Deploy file integrity monitoring (FIM). Conduct regular vulnerability scans. Monitor for unauthorized changes.',
    evidenceRequirements: ['CMDB inventory', 'FIM alert logs', 'Vulnerability scan results', 'Configuration drift reports'],
    testProcedures: ['Inspect CMDB accuracy', 'Review FIM alert response', 'Verify vulnerability scan coverage'],
    status: 'Not Started'
  },
  {
    controlId: 'CC7.2',
    name: 'Monitoring System Components for Anomalies',
    description: 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity\'s ability to meet its objectives; anomalies are analyzed to determine whether they represent security events.',
    category: 'System Operations',
    implementationGuidance: 'Deploy SIEM with security analytics. Implement intrusion detection. Establish baselines and alert on deviations. Investigate anomalies through formal IR process.',
    evidenceRequirements: ['SIEM coverage and rules', 'IDS/IPS logs', 'Baseline documentation', 'Anomaly investigation records'],
    testProcedures: ['Review SIEM coverage and tuning', 'Test alert response', 'Verify investigation procedures'],
    status: 'Not Started'
  },
  {
    controlId: 'CC7.3',
    name: 'Security Event Evaluation',
    description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
    category: 'System Operations',
    implementationGuidance: 'Establish formal incident response plan with severity classification. Train IR team. Conduct tabletop exercises. Document incident timeline and lessons learned.',
    evidenceRequirements: ['Incident response plan', 'IR team training records', 'Tabletop exercise reports', 'Incident postmortems'],
    testProcedures: ['Inspect IR plan completeness', 'Review tabletop exercise results', 'Sample incidents for proper handling'],
    status: 'Not Started'
  },
  {
    controlId: 'CC7.4',
    name: 'Incident Response Procedures',
    description: 'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
    category: 'System Operations',
    implementationGuidance: 'Define incident response procedures (containment, eradication, recovery). Maintain communication templates. Conduct external notifications per legal requirements. Track incidents through closure.',
    evidenceRequirements: ['Incident response procedures', 'Containment evidence', 'External notification records', 'Incident closure documentation'],
    testProcedures: ['Sample incidents for proper containment', 'Verify external notification compliance', 'Review closure documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CC7.5',
    name: 'Recovery from Security Incidents',
    description: 'The entity identifies, develops, and implements activities to recover from identified security incidents.',
    category: 'System Operations',
    implementationGuidance: 'Establish recovery procedures including system restoration, data recovery, and service resumption. Test recovery through exercises. Document recovery time and lessons learned.',
    evidenceRequirements: ['Recovery procedures', 'Recovery exercise results', 'Recovery time metrics', 'Lessons learned reports'],
    testProcedures: ['Inspect recovery procedures', 'Review exercise results', 'Verify recovery time tracking'],
    status: 'Not Started'
  },

  // ===== CC8: Change Management =====
  {
    controlId: 'CC8.1',
    name: 'Change Management Process',
    description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
    category: 'Change Management',
    implementationGuidance: 'Implement formal change management process with CAB approval. Document change requests, risk assessments, testing, and rollback plans. Track changes through CMDB.',
    evidenceRequirements: ['Change management policy', 'Change request records', 'CAB minutes', 'Testing evidence', 'Rollback plans'],
    testProcedures: ['Sample changes for approval evidence', 'Verify testing before production', 'Inspect CAB minutes'],
    status: 'Not Started'
  },

  // ===== CC9: Risk Mitigation =====
  {
    controlId: 'CC9.1',
    name: 'Risk Mitigation Through Business Disruption Recovery',
    description: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
    category: 'Risk Mitigation',
    implementationGuidance: 'Conduct business impact analysis (BIA). Develop business continuity and disaster recovery plans. Test plans through exercises. Maintain alternative processing capabilities.',
    evidenceRequirements: ['BIA documentation', 'BCP/DR plans', 'Exercise results', 'Alternative processing capability evidence'],
    testProcedures: ['Inspect BIA for completeness', 'Review BCP/DR plans', 'Verify exercise frequency and results'],
    status: 'Not Started'
  },
  {
    controlId: 'CC9.2',
    name: 'Vendor and Business Partner Risk Management',
    description: 'The entity assesses and manages risks associated with vendors and business partners. (Added in 2022 revision.)',
    category: 'Risk Mitigation',
    implementationGuidance: 'Implement vendor risk management program. Assess vendors before onboarding. Conduct periodic vendor reviews. Maintain vendor inventory with risk ratings.',
    evidenceRequirements: ['Vendor risk management policy', 'Vendor assessments', 'Vendor inventory with risk ratings', 'Periodic vendor reviews'],
    testProcedures: ['Sample vendors for assessment evidence', 'Verify vendor inventory accuracy', 'Review vendor monitoring activities'],
    status: 'Not Started'
  },

  // ===== A1: Availability =====
  {
    controlId: 'A1.1',
    name: 'Capacity Management',
    description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and enable additional capacity to meet objectives.',
    category: 'Availability',
    implementationGuidance: 'Implement capacity planning and monitoring. Track resource utilization trends. Plan capacity expansion proactively. Define capacity thresholds and alerts.',
    evidenceRequirements: ['Capacity planning documentation', 'Resource utilization metrics', 'Capacity expansion records', 'Alert configurations'],
    testProcedures: ['Inspect capacity planning evidence', 'Verify monitoring thresholds', 'Review expansion decisions'],
    status: 'Not Started'
  },
  {
    controlId: 'A1.2',
    name: 'Environmental Protections, Backup, and Recovery',
    description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.',
    category: 'Availability',
    implementationGuidance: 'Implement data center environmental controls (HVAC, fire suppression, power). Maintain backup procedures with offsite storage. Test recovery regularly.',
    evidenceRequirements: ['Environmental control documentation', 'Backup procedures and logs', 'Offsite storage records', 'Recovery test results'],
    testProcedures: ['Inspect environmental controls', 'Verify backup completion and testing', 'Review recovery exercise results'],
    status: 'Not Started'
  },
  {
    controlId: 'A1.3',
    name: 'Recovery Plan Testing',
    description: 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.',
    category: 'Availability',
    implementationGuidance: 'Schedule and execute recovery plan tests (tabletop, walkthrough, simulation, full). Document test results and gaps. Remediate identified deficiencies.',
    evidenceRequirements: ['Recovery test schedule', 'Test results and gap analysis', 'Remediation tracking', 'Updated recovery procedures'],
    testProcedures: ['Inspect test schedule and execution', 'Review test results for completeness', 'Verify gap remediation'],
    status: 'Not Started'
  },

  // ===== PI1: Processing Integrity =====
  {
    controlId: 'PI1.1',
    name: 'Definition of Processing Specifications',
    description: 'The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing, including definitions of data processed and product and service specifications, to support the use of products and services.',
    category: 'Processing Integrity',
    implementationGuidance: 'Document processing specifications including data definitions, business rules, and output requirements. Communicate specifications to operations and customers.',
    evidenceRequirements: ['Processing specification documentation', 'Data dictionaries', 'Business rule documentation', 'Customer-facing specifications'],
    testProcedures: ['Inspect specification documentation', 'Verify communication to relevant parties', 'Confirm alignment with system implementation'],
    status: 'Not Started'
  },
  {
    controlId: 'PI1.2',
    name: 'System Inputs Are Complete and Accurate',
    description: 'The entity implements policies and procedures over system inputs, including controls over completeness and accuracy, to result in products, services, and reporting to meet the entity\'s objectives.',
    category: 'Processing Integrity',
    implementationGuidance: 'Implement input validation controls (format, range, required fields). Verify data completeness and accuracy at entry. Reject invalid inputs with clear error messages.',
    evidenceRequirements: ['Input validation rules', 'Validation error logs', 'Data quality reports', 'Input control documentation'],
    testProcedures: ['Test input validation effectiveness', 'Review validation error response', 'Verify completeness controls'],
    status: 'Not Started'
  },
  {
    controlId: 'PI1.3',
    name: 'System Processing Produces Complete and Accurate Results',
    description: 'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity\'s objectives.',
    category: 'Processing Integrity',
    implementationGuidance: 'Implement processing controls (transactional integrity, reconciliation, exception handling). Monitor processing for errors. Validate output against expected results.',
    evidenceRequirements: ['Processing control documentation', 'Reconciliation records', 'Exception reports', 'Output validation evidence'],
    testProcedures: ['Test processing controls', 'Verify reconciliation effectiveness', 'Review exception handling'],
    status: 'Not Started'
  },
  {
    controlId: 'PI1.4',
    name: 'System Output is Complete, Accurate, and Timely',
    description: 'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity\'s objectives.',
    category: 'Processing Integrity',
    implementationGuidance: 'Implement output controls including delivery confirmation, format verification, and timing monitoring. Track output delivery SLAs.',
    evidenceRequirements: ['Output control procedures', 'Delivery confirmation records', 'SLA monitoring reports', 'Output validation logs'],
    testProcedures: ['Verify output control execution', 'Review SLA performance', 'Test output delivery'],
    status: 'Not Started'
  },
  {
    controlId: 'PI1.5',
    name: 'System Stores Data Completely, Accurately, and Timely',
    description: 'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with specifications to meet the entity\'s objectives.',
    category: 'Processing Integrity',
    implementationGuidance: 'Implement data storage controls including integrity verification, retention enforcement, and backup. Maintain data lineage. Audit data modifications.',
    evidenceRequirements: ['Data storage policies', 'Integrity verification logs', 'Retention enforcement records', 'Data audit trails'],
    testProcedures: ['Verify data integrity controls', 'Review retention enforcement', 'Inspect audit trails'],
    status: 'Not Started'
  },

  // ===== C1: Confidentiality =====
  {
    controlId: 'C1.1',
    name: 'Identification and Maintenance of Confidential Information',
    description: 'The entity identifies and maintains confidential information to meet the entity\'s objectives related to confidentiality.',
    category: 'Confidentiality',
    implementationGuidance: 'Implement information classification scheme distinguishing confidential data. Tag and label confidential data. Maintain inventory of confidential information assets.',
    evidenceRequirements: ['Classification scheme', 'Data labeling procedures', 'Confidential data inventory', 'Classification training records'],
    testProcedures: ['Sample data for proper classification', 'Verify inventory accuracy', 'Confirm labeling consistency'],
    status: 'Not Started'
  },
  {
    controlId: 'C1.2',
    name: 'Disposal of Confidential Information',
    description: 'The entity disposes of confidential information to meet the entity\'s objectives related to confidentiality.',
    category: 'Confidentiality',
    implementationGuidance: 'Implement secure disposal procedures for confidential data and media. Verify disposal completion. Use certified disposal vendors. Maintain disposal records.',
    evidenceRequirements: ['Disposal procedures', 'Disposal records and certificates', 'Vendor certifications', 'Disposal verification logs'],
    testProcedures: ['Inspect disposal records', 'Verify vendor certifications', 'Test disposal verification process'],
    status: 'Not Started'
  },

  // ===== P1-P8: Privacy =====
  {
    controlId: 'P1.1',
    name: 'Privacy Notice',
    description: 'The entity provides notice to data subjects about its privacy practices to meet the entity\'s objectives related to privacy.',
    category: 'Privacy - Notice',
    implementationGuidance: 'Develop and publish privacy notice covering collection, use, disclosure, and retention. Make notice accessible at data collection points. Update notice when practices change.',
    evidenceRequirements: ['Published privacy notice', 'Notice update history', 'Notice accessibility documentation', 'Data subject communications'],
    testProcedures: ['Review privacy notice for completeness', 'Verify accessibility at collection points', 'Inspect update procedures'],
    status: 'Not Started'
  },
  {
    controlId: 'P2.1',
    name: 'Choice and Consent',
    description: 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information to data subjects and obtains consent.',
    category: 'Privacy - Choice and Consent',
    implementationGuidance: 'Implement consent management platform. Capture and record consent. Provide opt-in/opt-out mechanisms. Honor data subject choices.',
    evidenceRequirements: ['Consent management procedures', 'Consent records', 'Opt-out mechanisms', 'Choice communications'],
    testProcedures: ['Verify consent capture mechanisms', 'Sample consent records', 'Test opt-out functionality'],
    status: 'Not Started'
  },
  {
    controlId: 'P3.1',
    name: 'Personal Information Collection',
    description: 'The entity collects personal information consistent with the entity\'s privacy notice and the criteria of the entity\'s objectives related to privacy.',
    category: 'Privacy - Collection',
    implementationGuidance: 'Limit collection to stated purposes. Validate collection against privacy notice. Document collection sources and purposes. Apply data minimization.',
    evidenceRequirements: ['Collection inventory', 'Purpose limitation documentation', 'Data minimization records', 'Privacy notice alignment'],
    testProcedures: ['Review collection purposes vs notice', 'Verify data minimization', 'Inspect collection records'],
    status: 'Not Started'
  },
  {
    controlId: 'P3.2',
    name: 'Explicit Consent for Sensitive Information',
    description: 'For information requiring explicit consent, the entity communicates the need for such consent, as well as the consequences of a failure to provide consent.',
    category: 'Privacy - Collection',
    implementationGuidance: 'Identify sensitive data categories requiring explicit consent. Implement explicit consent capture (separate from general consent). Document consequences of refusal.',
    evidenceRequirements: ['Sensitive data inventory', 'Explicit consent records', 'Consequence communications', 'Sensitive data handling procedures'],
    testProcedures: ['Verify explicit consent for sensitive data', 'Review consent capture quality', 'Test consequence communication'],
    status: 'Not Started'
  },
  {
    controlId: 'P4.1',
    name: 'Use of Personal Information',
    description: 'The entity limits the use of personal information to the purposes identified in the entity\'s objectives related to privacy.',
    category: 'Privacy - Use, Retention, and Disposal',
    implementationGuidance: 'Map data use to disclosed purposes. Implement use restrictions in systems. Audit data use periodically. Restrict secondary use without consent.',
    evidenceRequirements: ['Use mapping documentation', 'System access restrictions', 'Use audit reports', 'Secondary use approvals'],
    testProcedures: ['Verify use aligns with purposes', 'Review use audit results', 'Sample secondary use approvals'],
    status: 'Not Started'
  },
  {
    controlId: 'P4.2',
    name: 'Retention of Personal Information',
    description: 'The entity retains personal information consistent with the entity\'s objectives related to privacy.',
    category: 'Privacy - Use, Retention, and Disposal',
    implementationGuidance: 'Define retention schedules per data category. Implement automated retention enforcement. Monitor retention compliance. Document retention rationale.',
    evidenceRequirements: ['Retention schedule', 'Retention enforcement logs', 'Compliance monitoring', 'Retention rationale documentation'],
    testProcedures: ['Review retention schedule completeness', 'Verify automated enforcement', 'Sample data for retention compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'P4.3',
    name: 'Disposal of Personal Information',
    description: 'The entity disposes of personal information to meet the entity\'s objectives related to privacy.',
    category: 'Privacy - Use, Retention, and Disposal',
    implementationGuidance: 'Implement secure disposal at end of retention period. Verify disposal across all storage locations including backups. Maintain disposal records.',
    evidenceRequirements: ['Disposal procedures', 'Disposal records', 'Backup disposal verification', 'Cross-system disposal evidence'],
    testProcedures: ['Inspect disposal records', 'Verify backup disposal', 'Test cross-system disposal'],
    status: 'Not Started'
  },
  {
    controlId: 'P5.1',
    name: 'Access to Personal Information',
    description: 'The entity grants identified and authenticated data subjects the ability to access their stored personal information for review and, upon request, provides physical or electronic copies of that information.',
    category: 'Privacy - Access',
    implementationGuidance: 'Implement data subject access request (DSAR) process. Authenticate requestors. Provide data in machine-readable format. Track DSAR response times.',
    evidenceRequirements: ['DSAR procedures', 'DSAR tracking system', 'Authentication procedures', 'Response time metrics'],
    testProcedures: ['Review DSAR procedure completeness', 'Sample DSARs for proper handling', 'Verify authentication strength'],
    status: 'Not Started'
  },
  {
    controlId: 'P5.2',
    name: 'Correction and Amendment of Personal Information',
    description: 'The entity corrects, amends, or appends personal information based on information provided by data subjects and communicates such information to third parties, as committed or required.',
    category: 'Privacy - Access',
    implementationGuidance: 'Implement data correction request process. Propagate corrections to downstream systems and third parties. Document correction decisions and rationale.',
    evidenceRequirements: ['Correction procedures', 'Correction logs', 'Third party notification records', 'Decision rationale documentation'],
    testProcedures: ['Sample corrections for proper handling', 'Verify third-party propagation', 'Review denial rationale'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.1',
    name: 'Disclosure to Third Parties',
    description: 'The entity discloses personal information to third parties with the explicit consent of data subjects, and such consent is obtained prior to disclosure to meet the entity\'s objectives related to privacy.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Inventory third-party data disclosures. Obtain explicit consent before disclosure. Maintain data processing agreements (DPAs). Verify third-party privacy practices.',
    evidenceRequirements: ['Third-party disclosure inventory', 'Consent records for disclosure', 'DPAs and addendums', 'Third-party privacy assessments'],
    testProcedures: ['Sample disclosures for consent evidence', 'Review DPAs for completeness', 'Verify third-party assessments'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.2',
    name: 'Third Party Records of Personal Information Disclosures',
    description: 'The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Maintain centralized disclosure log capturing recipient, data elements, purpose, date, and basis. Retain logs per regulatory requirements.',
    evidenceRequirements: ['Disclosure log', 'Log retention procedures', 'Log access controls', 'Disclosure metrics'],
    testProcedures: ['Review disclosure log completeness', 'Verify log retention', 'Inspect log access controls'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.3',
    name: 'Unauthorized Disclosures of Personal Information',
    description: 'The entity creates and retains a complete, accurate, and timely record of detected or reported unauthorized disclosures (including breaches) of personal information.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Implement breach detection and reporting. Maintain breach log with details. Conduct root cause analysis. Notify affected parties per regulations.',
    evidenceRequirements: ['Breach response procedures', 'Breach log', 'Root cause analyses', 'Notification records'],
    testProcedures: ['Review breach log completeness', 'Sample breaches for proper handling', 'Verify notification timing'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.4',
    name: 'Personal Information Provided to Third Parties',
    description: 'The entity obtains commitments from vendors and other third parties with access to personal information to comply with the entity\'s objectives related to privacy.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Include privacy obligations in third-party contracts. Conduct privacy due diligence on vendors. Monitor vendor privacy practices.',
    evidenceRequirements: ['Vendor privacy clauses', 'Due diligence records', 'Vendor monitoring reports', 'DPAs/BAAs'],
    testProcedures: ['Sample vendor contracts for privacy clauses', 'Review due diligence', 'Verify monitoring evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.5',
    name: 'Third Party Compliance with Privacy Commitments',
    description: 'The entity obtains commitments from vendors and other third parties to report to the entity any actual or suspected unauthorized disclosures.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Require vendor breach notification clauses with timing. Implement vendor incident communication procedures. Track vendor incidents.',
    evidenceRequirements: ['Vendor breach notification clauses', 'Vendor incident reports', 'Vendor incident tracking', 'Vendor communication procedures'],
    testProcedures: ['Review breach notification clauses', 'Sample vendor incident handling', 'Verify communication procedures'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.6',
    name: 'Breach Notification to Affected Data Subjects',
    description: 'The entity provides notification of breaches and incidents to affected data subjects, regulators, and others to meet the entity\'s objectives related to privacy.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Define notification triggers and timing per jurisdiction. Maintain notification templates. Coordinate with legal and PR. Document notifications.',
    evidenceRequirements: ['Notification procedures', 'Notification templates', 'Notification records', 'Regulatory notifications'],
    testProcedures: ['Review notification procedures', 'Sample notifications for timing', 'Verify regulatory compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'P6.7',
    name: 'Accountability for Information Provided to Third Parties',
    description: 'The entity provides data subjects with an accounting of the personal information held and disclosure of the personal information by the entity to meet the entity\'s objectives related to privacy.',
    category: 'Privacy - Disclosure to Third Parties',
    implementationGuidance: 'Implement disclosure accounting capability. Generate disclosure reports on request. Maintain comprehensive disclosure records per regulatory requirements.',
    evidenceRequirements: ['Disclosure accounting procedures', 'Sample disclosure reports', 'Accounting request handling', 'Records retention'],
    testProcedures: ['Test disclosure accounting capability', 'Sample reports for accuracy', 'Verify retention compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'P7.1',
    name: 'Quality of Personal Information',
    description: 'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information to meet the entity\'s objectives related to privacy.',
    category: 'Privacy - Quality',
    implementationGuidance: 'Implement data quality controls including validation, deduplication, and refresh. Allow data subject corrections. Monitor data quality metrics.',
    evidenceRequirements: ['Data quality procedures', 'Quality metrics reports', 'Correction processes', 'Deduplication evidence'],
    testProcedures: ['Inspect quality controls', 'Review quality metrics', 'Verify correction handling'],
    status: 'Not Started'
  },
  {
    controlId: 'P8.1',
    name: 'Privacy Compliance Monitoring and Enforcement',
    description: 'The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects and others.',
    category: 'Privacy - Monitoring and Enforcement',
    implementationGuidance: 'Establish privacy complaint handling process. Provide multiple complaint channels. Track resolution. Conduct periodic privacy audits.',
    evidenceRequirements: ['Complaint handling procedures', 'Complaint logs', 'Resolution tracking', 'Privacy audit reports'],
    testProcedures: ['Review complaint handling procedures', 'Sample complaints for resolution', 'Inspect privacy audit results'],
    status: 'Not Started'
  },

  // ===== SOC 3 specific: General-use reporting + AICPA seal =====
  {
    controlId: 'SOC3-RPT.1',
    name: 'SOC 3 Examination Engagement',
    description: 'The entity engages an independent licensed CPA firm to perform a SOC 3 examination in accordance with AICPA AT-C Section 205, attesting to the suitability of design and operating effectiveness of controls.',
    category: 'Reporting',
    implementationGuidance: 'Engage CPA firm with relevant SOC experience. Define scope (Trust Services Categories). Define examination period (minimum 3 months recommended; 6-12 months typical). Execute examination annually.',
    evidenceRequirements: ['Signed engagement letter', 'Statement of Work defining scope', 'CPA firm independence confirmation', 'Examination kickoff documentation'],
    testProcedures: ['Inspect engagement letter for scope and period', 'Verify CPA independence', 'Confirm examination conducted under AT-C 205'],
    status: 'Not Started'
  },
  {
    controlId: 'SOC3-RPT.2',
    name: 'SOC 3 Report Issuance and AICPA Seal Display',
    description: 'The entity obtains the SOC 3 report and Service Organization Control Trust Services seal from the AICPA and displays them in accordance with AICPA usage requirements.',
    category: 'Reporting',
    implementationGuidance: 'Receive SOC 3 report from CPA. Register seal with AICPA. Display seal only with valid current report. Renew annually. Remove seal upon report expiration.',
    evidenceRequirements: ['Final SOC 3 report', 'AICPA seal authorization', 'Seal usage policy', 'Seal display screenshots/locations'],
    testProcedures: ['Verify report validity dates', 'Inspect seal usage compliance', 'Confirm renewal upon expiration'],
    status: 'Not Started'
  },
  {
    controlId: 'SOC3-RPT.3',
    name: 'Management Assertion and System Description',
    description: 'Management provides a written assertion regarding the suitability of design and operating effectiveness of controls and a short description of the system, both included in the SOC 3 report.',
    category: 'Reporting',
    implementationGuidance: 'Draft management assertion covering control suitability. Prepare system description per DC 200. Sign assertion. Include in SOC 3 report.',
    evidenceRequirements: ['Signed management assertion', 'System description (DC 200)', 'Trust Services Categories covered', 'Boundaries of the system'],
    testProcedures: ['Review assertion for completeness', 'Verify system description accuracy', 'Confirm signed by appropriate management'],
    status: 'Not Started'
  }
];

export const SOX_ITGC_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ITGC-1.1',
    name: 'Access to Programs and Data',
    description: 'Control access to programs and data to ensure only authorized individuals can access financial systems.',
    category: 'Access Controls',
    implementationGuidance: 'Implement access controls. Manage user provisioning. Review access periodically. Document access grants.',
    evidenceRequirements: ['Access control implementation', 'Provisioning records', 'Access reviews', 'Grant documentation'],
    testProcedures: ['Test access controls', 'Verify provisioning', 'Check reviews', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITGC-1.2',
    name: 'Program Changes',
    description: 'Control changes to programs to ensure only authorized changes are made to financial systems.',
    category: 'Change Management',
    implementationGuidance: 'Implement change management. Require approvals. Test changes. Document changes.',
    evidenceRequirements: ['Change management process', 'Approval records', 'Testing records', 'Change documentation'],
    testProcedures: ['Test change management', 'Verify approvals', 'Check testing', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITGC-1.3',
    name: 'Program Development',
    description: 'Control development of new programs to ensure proper authorization and testing.',
    category: 'Development',
    implementationGuidance: 'Implement SDLC. Require authorization. Conduct testing. Document development.',
    evidenceRequirements: ['SDLC documentation', 'Authorization records', 'Testing records', 'Development documentation'],
    testProcedures: ['Review SDLC', 'Verify authorization', 'Check testing', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITGC-1.4',
    name: 'Computer Operations',
    description: 'Control computer operations including job scheduling, backup, and recovery.',
    category: 'Operations',
    implementationGuidance: 'Implement job scheduling. Conduct backups. Test recovery. Monitor operations.',
    evidenceRequirements: ['Job scheduling', 'Backup records', 'Recovery testing', 'Operations monitoring'],
    testProcedures: ['Test scheduling', 'Verify backups', 'Test recovery', 'Check monitoring'],
    status: 'Not Started'
  }
];

export const FFIEC_CAT_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'FFIEC-1.1',
    name: 'Cyber Risk Management',
    description: 'Implement comprehensive cyber risk management program.',
    category: 'Risk Management',
    implementationGuidance: 'Develop risk management program. Identify cyber risks. Assess vulnerabilities. Implement controls.',
    evidenceRequirements: ['Risk management program', 'Risk identification', 'Vulnerability assessment', 'Control implementation'],
    testProcedures: ['Review program', 'Verify identification', 'Test assessment', 'Check controls'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.2',
    name: 'Threat Intelligence and Collaboration',
    description: 'Participate in threat intelligence sharing and collaboration.',
    category: 'Threat Intelligence',
    implementationGuidance: 'Join intelligence sharing groups. Receive threat intelligence. Share information appropriately. Act on intelligence.',
    evidenceRequirements: ['Sharing group membership', 'Intelligence received', 'Information shared', 'Action records'],
    testProcedures: ['Verify membership', 'Check intelligence', 'Review sharing', 'Assess actions'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.3',
    name: 'Cybersecurity Controls',
    description: 'Implement cybersecurity controls appropriate to inherent risk profile.',
    category: 'Controls',
    implementationGuidance: 'Assess inherent risk. Implement appropriate controls. Monitor control effectiveness. Update as needed.',
    evidenceRequirements: ['Risk assessment', 'Control implementation', 'Effectiveness monitoring', 'Update records'],
    testProcedures: ['Review assessment', 'Test controls', 'Verify monitoring', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.4',
    name: 'External Dependency Management',
    description: 'Manage cybersecurity risks from external dependencies and third parties.',
    category: 'Third Party',
    implementationGuidance: 'Identify external dependencies. Assess third-party risks. Implement controls. Monitor relationships.',
    evidenceRequirements: ['Dependency inventory', 'Risk assessment', 'Control documentation', 'Monitoring records'],
    testProcedures: ['Review inventory', 'Test assessment', 'Verify controls', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'FFIEC-1.5',
    name: 'Cyber Incident Management and Resilience',
    description: 'Implement incident management and cyber resilience capabilities.',
    category: 'Incident Response',
    implementationGuidance: 'Develop incident response plan. Test plan regularly. Implement resilience measures. Learn from incidents.',
    evidenceRequirements: ['Response plan', 'Testing records', 'Resilience measures', 'Lessons learned'],
    testProcedures: ['Review plan', 'Verify testing', 'Test resilience', 'Check lessons learned'],
    status: 'Not Started'
  }
];

export const SWIFT_CSP_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'SWIFT-1.1',
    name: 'Restrict Internet Access',
    description: 'Protect the SWIFT environment by restricting internet access.',
    category: 'Secure Environment',
    implementationGuidance: 'Segment SWIFT environment. Restrict internet access. Implement firewalls. Monitor traffic.',
    evidenceRequirements: ['Segmentation documentation', 'Access restrictions', 'Firewall configuration', 'Traffic monitoring'],
    testProcedures: ['Test segmentation', 'Verify restrictions', 'Check firewalls', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-1.2',
    name: 'Reduce Attack Surface',
    description: 'Reduce the attack surface of SWIFT-related systems.',
    category: 'Secure Environment',
    implementationGuidance: 'Harden systems. Remove unnecessary services. Patch regularly. Document configurations.',
    evidenceRequirements: ['Hardening documentation', 'Service inventory', 'Patch records', 'Configuration documentation'],
    testProcedures: ['Test hardening', 'Verify services', 'Check patches', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-2.1',
    name: 'Operator Authentication',
    description: 'Implement strong authentication for SWIFT operators.',
    category: 'Know and Limit Access',
    implementationGuidance: 'Implement MFA. Manage operator accounts. Review access regularly. Enforce separation of duties.',
    evidenceRequirements: ['MFA implementation', 'Account management', 'Access reviews', 'Separation of duties'],
    testProcedures: ['Test MFA', 'Verify account management', 'Check reviews', 'Assess separation'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-3.1',
    name: 'Security Training',
    description: 'Provide security awareness training for SWIFT operators.',
    category: 'Detect and Respond',
    implementationGuidance: 'Develop training program. Train all operators. Track completion. Update training.',
    evidenceRequirements: ['Training program', 'Training records', 'Completion tracking', 'Update records'],
    testProcedures: ['Review program', 'Verify training', 'Check completion', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'SWIFT-3.2',
    name: 'Transaction Monitoring',
    description: 'Monitor SWIFT transactions for anomalies and fraud.',
    category: 'Detect and Respond',
    implementationGuidance: 'Implement transaction monitoring. Define anomaly rules. Alert on suspicious activity. Investigate alerts.',
    evidenceRequirements: ['Monitoring implementation', 'Anomaly rules', 'Alert records', 'Investigation records'],
    testProcedures: ['Test monitoring', 'Verify rules', 'Check alerts', 'Review investigations'],
    status: 'Not Started'
  }
];

export const OSFI_B13_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'OSFI-1.1',
    name: 'Technology and Cyber Risk Governance',
    description: 'Establish governance framework for technology and cyber risk.',
    category: 'Governance',
    implementationGuidance: 'Define governance structure. Assign responsibilities. Report to board. Document framework.',
    evidenceRequirements: ['Governance structure', 'Responsibility assignments', 'Board reporting', 'Framework documentation'],
    testProcedures: ['Review governance', 'Verify responsibilities', 'Check reporting', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'OSFI-1.2',
    name: 'Technology and Cyber Risk Strategy',
    description: 'Develop strategy for managing technology and cyber risk.',
    category: 'Strategy',
    implementationGuidance: 'Develop risk strategy. Align with business strategy. Implement strategy. Review periodically.',
    evidenceRequirements: ['Risk strategy', 'Business alignment', 'Implementation records', 'Review records'],
    testProcedures: ['Review strategy', 'Verify alignment', 'Check implementation', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'OSFI-2.1',
    name: 'Technology and Cyber Risk Management',
    description: 'Implement comprehensive technology and cyber risk management.',
    category: 'Risk Management',
    implementationGuidance: 'Identify risks. Assess risks. Implement controls. Monitor effectiveness.',
    evidenceRequirements: ['Risk identification', 'Risk assessment', 'Control implementation', 'Effectiveness monitoring'],
    testProcedures: ['Review identification', 'Test assessment', 'Verify controls', 'Check monitoring'],
    status: 'Not Started'
  }
];

export const APRA_CPS234_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CPS234-1.1',
    name: 'Information Security Capability',
    description: 'Maintain information security capability commensurate with size and extent of threats.',
    category: 'Security Capability',
    implementationGuidance: 'Assess threat landscape. Build security capability. Maintain resources. Update as threats evolve.',
    evidenceRequirements: ['Threat assessment', 'Capability documentation', 'Resource allocation', 'Update records'],
    testProcedures: ['Review threats', 'Test capability', 'Verify resources', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-1.2',
    name: 'Board and Senior Management Accountability',
    description: 'Ensure board and senior management accountability for information security.',
    category: 'Governance',
    implementationGuidance: 'Define board responsibilities. Establish management accountability. Report to board. Document decisions.',
    evidenceRequirements: ['Board responsibilities', 'Management accountability', 'Board reports', 'Decision records'],
    testProcedures: ['Review responsibilities', 'Verify accountability', 'Check reports', 'Assess decisions'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-2.1',
    name: 'Information Asset Identification',
    description: 'Identify and classify information assets based on criticality and sensitivity.',
    category: 'Asset Management',
    implementationGuidance: 'Identify information assets. Classify by criticality. Document sensitivity. Maintain inventory.',
    evidenceRequirements: ['Asset identification', 'Classification records', 'Sensitivity documentation', 'Asset inventory'],
    testProcedures: ['Review assets', 'Verify classification', 'Check sensitivity', 'Test inventory'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-3.1',
    name: 'Third Party Information Security',
    description: 'Manage information security risks from third party arrangements.',
    category: 'Third Party',
    implementationGuidance: 'Assess third party risks. Include security requirements. Monitor compliance. Address issues.',
    evidenceRequirements: ['Risk assessment', 'Security requirements', 'Compliance monitoring', 'Issue resolution'],
    testProcedures: ['Test assessment', 'Verify requirements', 'Check monitoring', 'Review resolution'],
    status: 'Not Started'
  },
  {
    controlId: 'CPS234-4.1',
    name: 'Incident Notification to APRA',
    description: 'Notify APRA of material information security incidents.',
    category: 'Incident Response',
    implementationGuidance: 'Define materiality criteria. Establish notification process. Notify within timeframes. Document notifications.',
    evidenceRequirements: ['Materiality criteria', 'Notification process', 'Timeline compliance', 'Notification records'],
    testProcedures: ['Review criteria', 'Test process', 'Verify timelines', 'Check records'],
    status: 'Not Started'
  }
];

export const MAS_TRM_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'MAS-1.1',
    name: 'Technology Risk Governance',
    description: 'Establish robust governance for technology risk management.',
    category: 'Governance',
    implementationGuidance: 'Define governance structure. Assign responsibilities. Report to board. Maintain oversight.',
    evidenceRequirements: ['Governance structure', 'Responsibilities', 'Board reports', 'Oversight records'],
    testProcedures: ['Review governance', 'Verify responsibilities', 'Check reports', 'Assess oversight'],
    status: 'Not Started'
  },
  {
    controlId: 'MAS-1.2',
    name: 'Technology Risk Management Framework',
    description: 'Implement comprehensive technology risk management framework.',
    category: 'Risk Management',
    implementationGuidance: 'Develop framework. Identify risks. Assess and prioritize. Implement controls.',
    evidenceRequirements: ['Framework documentation', 'Risk identification', 'Risk assessment', 'Control implementation'],
    testProcedures: ['Review framework', 'Test identification', 'Verify assessment', 'Check controls'],
    status: 'Not Started'
  },
  {
    controlId: 'MAS-2.1',
    name: 'Cyber Security',
    description: 'Implement robust cyber security measures.',
    category: 'Cyber Security',
    implementationGuidance: 'Assess cyber threats. Implement security controls. Monitor for threats. Respond to incidents.',
    evidenceRequirements: ['Threat assessment', 'Security controls', 'Threat monitoring', 'Incident response'],
    testProcedures: ['Review threats', 'Test controls', 'Verify monitoring', 'Check response'],
    status: 'Not Started'
  },
  {
    controlId: 'MAS-3.1',
    name: 'IT Outsourcing Risk Management',
    description: 'Manage risks from IT outsourcing arrangements.',
    category: 'Outsourcing',
    implementationGuidance: 'Assess outsourcing risks. Conduct due diligence. Monitor performance. Address issues.',
    evidenceRequirements: ['Risk assessment', 'Due diligence records', 'Performance monitoring', 'Issue resolution'],
    testProcedures: ['Review assessment', 'Verify due diligence', 'Check monitoring', 'Assess resolution'],
    status: 'Not Started'
  }
];

export const FCA_PRA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'FCA-1.1',
    name: 'Operational Resilience',
    description: 'Ensure operational resilience for important business services.',
    category: 'Operational Resilience',
    implementationGuidance: 'Identify important services. Set impact tolerances. Test resilience. Maintain capabilities.',
    evidenceRequirements: ['Service identification', 'Impact tolerances', 'Testing records', 'Capability documentation'],
    testProcedures: ['Review services', 'Verify tolerances', 'Test resilience', 'Check capabilities'],
    status: 'Not Started'
  },
  {
    controlId: 'FCA-1.2',
    name: 'Outsourcing and Third Party Risk',
    description: 'Manage risks from outsourcing and third party arrangements.',
    category: 'Third Party',
    implementationGuidance: 'Conduct due diligence. Include contractual protections. Monitor performance. Maintain oversight.',
    evidenceRequirements: ['Due diligence records', 'Contract terms', 'Performance monitoring', 'Oversight records'],
    testProcedures: ['Test due diligence', 'Verify contracts', 'Check monitoring', 'Assess oversight'],
    status: 'Not Started'
  },
  {
    controlId: 'FCA-2.1',
    name: 'Senior Managers and Certification Regime',
    description: 'Implement SM&CR for senior management accountability.',
    category: 'Governance',
    implementationGuidance: 'Identify senior managers. Define responsibilities. Maintain statements. Conduct certifications.',
    evidenceRequirements: ['Senior manager identification', 'Responsibility statements', 'Statement records', 'Certification records'],
    testProcedures: ['Review identification', 'Verify statements', 'Check records', 'Assess certifications'],
    status: 'Not Started'
  }
];
