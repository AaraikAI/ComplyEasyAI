export interface FrameworkControlTemplate {
  controlId: string;
  name: string;
  description: string;
  category: string;
  implementationGuidance: string;
  evidenceRequirements: string[];
  testProcedures: string[];
  status: string;
}

export const GDPR_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // Lawful Basis & Consent (Articles 5-9)
  // ============================================================
  {
    controlId: 'GDPR-5.1a',
    name: 'Principle of Lawfulness, Fairness, and Transparency',
    description:
      'Personal data shall be processed lawfully, fairly, and in a transparent manner in relation to the data subject.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Identify and document the lawful basis for every processing activity before it begins. Publish clear and accessible privacy notices that explain what data is collected, why it is processed, and who it is shared with. Conduct regular reviews to ensure processing remains fair and does not produce unexpected or detrimental effects on data subjects. Maintain an internal register mapping each processing purpose to its lawful basis.',
    evidenceRequirements: [
      'Privacy notice published on all data collection points',
      'Lawful basis assessment documentation for each processing activity',
      'Records mapping processing purposes to their legal bases',
      'Fairness assessment reports demonstrating no adverse impact on data subjects',
    ],
    testProcedures: [
      'Review privacy notices for completeness and plain-language clarity',
      'Verify each processing activity has a documented lawful basis',
      'Sample data collection points and confirm privacy information is presented before or at the time of collection',
      'Interview staff to confirm awareness of lawfulness requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1b',
    name: 'Purpose Limitation',
    description:
      'Personal data shall be collected for specified, explicit, and legitimate purposes and not further processed in a manner incompatible with those purposes.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Define and document purposes before any data collection begins. Implement technical controls that restrict data usage to stated purposes. Before any secondary use of data, conduct a compatibility assessment considering the relationship between original and new purposes, the context of collection, the nature of the data, possible consequences, and the existence of appropriate safeguards. Maintain version-controlled purpose statements in the Record of Processing Activities.',
    evidenceRequirements: [
      'Documented purpose statements for every processing activity',
      'Compatibility assessments for any secondary use of personal data',
      'Technical access controls restricting data to authorized purposes',
      'Change management records showing purpose review before new processing',
    ],
    testProcedures: [
      'Review the Record of Processing Activities for explicit purpose statements',
      'Select a sample of processing activities and verify data is used only for stated purposes',
      'Examine any instances of secondary processing and confirm compatibility assessments were completed',
      'Test technical controls to confirm data cannot be accessed for unauthorized purposes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1c',
    name: 'Data Minimization',
    description:
      'Personal data shall be adequate, relevant, and limited to what is necessary in relation to the purposes for which they are processed.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Conduct data minimization reviews for every processing activity to verify that only necessary fields are collected. Implement form validation and schema enforcement that prevents collection of extraneous data. Apply pseudonymization or anonymization where full identification is not required. Schedule periodic audits of databases and data stores to identify and remove unnecessary personal data fields.',
    evidenceRequirements: [
      'Data minimization assessment reports for each processing activity',
      'Schema documentation showing only necessary fields are captured',
      'Evidence of pseudonymization or anonymization where applicable',
      'Periodic audit reports confirming removal of unnecessary data fields',
    ],
    testProcedures: [
      'Compare collected data fields against documented purpose requirements',
      'Review database schemas and data collection forms for unnecessary fields',
      'Verify pseudonymization or anonymization techniques are applied where identification is not required',
      'Inspect audit logs for periodic data minimization reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1d',
    name: 'Accuracy',
    description:
      'Personal data shall be accurate and, where necessary, kept up to date. Every reasonable step must be taken to ensure that inaccurate data is erased or rectified without delay.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Implement validation checks at the point of data entry to reduce errors. Provide self-service portals or processes that allow data subjects to review and update their personal data. Establish scheduled data quality checks and define procedures for correcting or deleting inaccurate records. Maintain audit trails for all corrections made to personal data.',
    evidenceRequirements: [
      'Data quality policy and procedures documentation',
      'Input validation rules implemented at data collection points',
      'Self-service mechanism or documented process for data subjects to update their data',
      'Scheduled data quality review reports with correction actions',
    ],
    testProcedures: [
      'Test input validation controls at data collection forms',
      'Verify data subjects can request corrections and that corrections are processed promptly',
      'Review data quality audit reports and sample correction records',
      'Confirm audit trails exist for all data modifications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1e',
    name: 'Storage Limitation',
    description:
      'Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the data is processed.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Define and document retention periods for every category of personal data based on legal requirements and business necessity. Implement automated retention enforcement mechanisms that flag or delete data once the retention period expires. Establish an exception process for data that must be retained beyond standard periods (e.g., for legal holds). Conduct annual retention schedule reviews to ensure periods remain appropriate.',
    evidenceRequirements: [
      'Data retention policy with defined periods per data category',
      'Automated retention enforcement configuration or scheduled deletion logs',
      'Exception and legal hold procedures documentation',
      'Annual retention review reports',
    ],
    testProcedures: [
      'Review the data retention schedule for completeness across all data categories',
      'Test automated deletion or archival processes against defined retention periods',
      'Verify that expired data is actually deleted or anonymized on schedule',
      'Check for any data retained beyond its defined period without a documented exception',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1f',
    name: 'Integrity and Confidentiality',
    description:
      'Personal data shall be processed in a manner that ensures appropriate security, including protection against unauthorized or unlawful processing and against accidental loss, destruction, or damage, using appropriate technical or organizational measures.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Implement encryption for personal data at rest and in transit. Deploy access controls based on the principle of least privilege. Establish logging and monitoring for access to personal data stores. Conduct regular vulnerability assessments and penetration tests. Maintain incident response procedures for security events involving personal data.',
    evidenceRequirements: [
      'Encryption configurations for data at rest and in transit',
      'Access control policies and role-based access matrix',
      'Security monitoring and logging configurations',
      'Vulnerability assessment and penetration test reports',
      'Incident response plan and test results',
    ],
    testProcedures: [
      'Verify encryption is enabled on all personal data stores and transmission channels',
      'Review access control lists to confirm least-privilege enforcement',
      'Inspect logging configurations and confirm logs capture access to personal data',
      'Review recent vulnerability assessment and penetration test findings',
      'Conduct a tabletop exercise of the incident response plan',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.2',
    name: 'Accountability',
    description:
      'The controller shall be responsible for, and be able to demonstrate compliance with, the data processing principles.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Establish a comprehensive data protection governance framework with clear roles, responsibilities, and reporting lines. Maintain documented evidence of compliance for all processing activities, including policies, procedures, training records, and audit results. Implement a data protection management system that centralizes compliance artifacts. Conduct regular internal audits and management reviews of the data protection program.',
    evidenceRequirements: [
      'Data protection governance framework documentation',
      'Compliance evidence repository with organized artifacts',
      'Internal audit reports and management review minutes',
      'Staff training records and awareness program materials',
      'Policy version control and approval records',
    ],
    testProcedures: [
      'Review the governance framework for defined roles, responsibilities, and escalation paths',
      'Inspect the compliance evidence repository for completeness and currency',
      'Verify internal audits are conducted at defined intervals',
      'Sample training records to confirm staff have completed required data protection training',
      'Review management meeting minutes for data protection agenda items',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-6',
    name: 'Lawful Basis for Processing',
    description:
      'Processing shall be lawful only if and to the extent that at least one of the six lawful bases applies: consent, contract, legal obligation, vital interests, public task, or legitimate interests.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'For each processing activity, identify and document the most appropriate lawful basis before processing begins. Where legitimate interests is relied upon, conduct and document a Legitimate Interests Assessment (LIA) including a necessity test and balancing test. Ensure consent mechanisms meet GDPR requirements when consent is the chosen basis. Implement processes to re-evaluate the lawful basis when processing activities change.',
    evidenceRequirements: [
      'Lawful basis register mapping each processing activity to its legal basis',
      'Legitimate Interests Assessments for all processing relying on Art. 6(1)(f)',
      'Consent records where consent is the lawful basis',
      'Legal obligation references where Art. 6(1)(c) is relied upon',
      'Contractual necessity documentation where Art. 6(1)(b) applies',
    ],
    testProcedures: [
      'Review the lawful basis register for completeness against the Record of Processing Activities',
      'Examine Legitimate Interests Assessments for thoroughness of balancing test',
      'Verify consent records include timestamp, scope, and method of consent',
      'Confirm legal obligation references are current and accurately cited',
      'Test that changes to processing activities trigger a lawful basis re-evaluation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-7',
    name: 'Conditions for Consent',
    description:
      'Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented. Consent must be freely given, specific, informed, and unambiguous. The data subject shall have the right to withdraw consent at any time.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Design consent mechanisms that require a clear affirmative action (no pre-ticked boxes). Present consent requests in clear, plain language, separate from other terms and conditions. Implement granular consent options so data subjects can consent to specific purposes independently. Provide an easily accessible mechanism to withdraw consent that is as simple as giving it. Maintain timestamped consent records including the version of the privacy notice presented.',
    evidenceRequirements: [
      'Consent collection interface screenshots or designs showing affirmative action requirement',
      'Consent text reviewed for plain language and specificity',
      'Granular consent options documentation',
      'Withdrawal mechanism documentation and user flow',
      'Consent records database with timestamps, scope, and notice version',
    ],
    testProcedures: [
      'Test consent forms to confirm no pre-ticked boxes or bundled consent',
      'Review consent language for clarity, specificity, and separation from other terms',
      'Verify data subjects can provide granular consent per purpose',
      'Test the consent withdrawal process end-to-end and confirm processing ceases',
      'Inspect consent records for completeness of timestamp, scope, and notice version',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-8',
    name: "Children\'s Consent",
    description:
      'Where consent applies to information society services offered directly to a child, processing is lawful only if the child is at least 16 years old (or the age set by Member State law, not below 13). Below that age, consent must be given or authorized by the holder of parental responsibility.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Implement age verification mechanisms appropriate to the risk level of the service. Design parental consent workflows that verify the identity of the parent or guardian. Ensure privacy notices directed at children use age-appropriate language. Determine the applicable age threshold for each Member State where the service operates. Regularly review and update age verification and parental consent mechanisms.',
    evidenceRequirements: [
      'Age verification mechanism documentation and implementation evidence',
      'Parental consent workflow documentation',
      'Child-friendly privacy notice versions',
      'Member State age threshold mapping',
      'Review records for age verification and parental consent mechanisms',
    ],
    testProcedures: [
      'Test the age verification mechanism to confirm it prevents underage users from consenting independently',
      'Verify the parental consent process obtains verifiable authorization',
      'Review child-facing privacy notices for age-appropriate language',
      'Confirm the correct age threshold is applied per Member State',
      'Attempt to bypass age verification controls and document results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-9',
    name: 'Processing of Special Categories of Data',
    description:
      'Processing of personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic data, biometric data, health data, or data concerning sex life or sexual orientation shall be prohibited unless a specific exception applies.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Maintain an inventory of all special category data processed by the organization. For each instance, document the applicable Art. 9(2) exception (e.g., explicit consent, employment law, vital interests, public health). Apply enhanced security controls to special category data including additional encryption, stricter access controls, and segregated storage where feasible. Conduct Data Protection Impact Assessments for any new processing of special category data. Train staff who handle special category data on the additional requirements.',
    evidenceRequirements: [
      'Inventory of special category data processing activities',
      'Documented Art. 9(2) exception for each processing activity',
      'Enhanced security controls documentation for special category data',
      'DPIA reports for special category data processing',
      'Training records for staff handling special category data',
    ],
    testProcedures: [
      'Review the special category data inventory against actual data stores',
      'Verify each processing activity has a valid and documented Art. 9(2) exception',
      'Test enhanced security controls applied to special category data',
      'Confirm DPIAs have been completed for all special category data processing',
      'Sample training records for staff with access to special category data',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Data Subject Rights (Articles 12-22)
  // ============================================================
  {
    controlId: 'GDPR-12',
    name: 'Transparent Communication',
    description:
      'The controller shall take appropriate measures to provide information relating to processing and any communications regarding data subject rights in a concise, transparent, intelligible, and easily accessible form, using clear and plain language.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop layered privacy notices that provide a summary at the first layer and detailed information in subsequent layers. Use plain language readability tools to verify notices are written at an appropriate reading level. Provide notices in all languages relevant to the data subjects served. Establish response templates for data subject rights requests that use clear, non-legalistic language. Define and enforce response timelines (one month, extendable by two months for complex requests) with tracking mechanisms.',
    evidenceRequirements: [
      'Layered privacy notice structure documentation',
      'Readability assessment results for privacy notices',
      'Multi-language privacy notice versions where applicable',
      'Data subject rights response templates',
      'Response timeline tracking system configuration and reports',
    ],
    testProcedures: [
      'Review privacy notices for plain language and layered presentation',
      'Conduct readability scoring on all public-facing privacy communications',
      'Verify notices are available in required languages',
      'Submit a test data subject rights request and evaluate the response for clarity and timeliness',
      'Review the tracking system to confirm all requests are logged with response deadlines',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-13',
    name: 'Information Provided at Collection',
    description:
      'Where personal data are collected from the data subject, the controller shall provide identity and contact details of the controller, DPO contact, purposes and lawful basis, recipients, transfer details, retention period, data subject rights, right to withdraw consent, right to lodge a complaint, and whether provision of data is statutory or contractual.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Create a comprehensive privacy notice checklist based on Art. 13 requirements and use it to validate all data collection points. Integrate privacy notices into data collection workflows so they are presented at or before the point of collection. Maintain a central register of all data collection points and the privacy notice version deployed at each. Implement version control for privacy notices and require sign-off before deployment.',
    evidenceRequirements: [
      'Art. 13 checklist applied to all privacy notices',
      'Screenshots or evidence of privacy notice presentation at each collection point',
      'Register of data collection points with associated privacy notice versions',
      'Privacy notice version control and approval records',
    ],
    testProcedures: [
      'Audit each data collection point against the Art. 13 information requirements checklist',
      'Verify the privacy notice is presented at or before the moment of data collection',
      'Confirm the register of collection points is complete and current',
      'Review version control logs for privacy notice updates and approvals',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-14',
    name: 'Information Where Data Not Obtained from Data Subject',
    description:
      'Where personal data have not been obtained from the data subject, the controller shall provide the Art. 13 information plus the categories of personal data and the source from which the data originate, within a reasonable period and no later than one month.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Identify all processing activities where data is obtained from third parties, public sources, or other indirect means. Develop notification procedures to inform data subjects within one month of obtaining their data, or at the time of first communication if the data is used to contact them. Document the source and categories of data obtained for each indirect collection activity. Implement automated notification workflows where feasible to ensure timely compliance.',
    evidenceRequirements: [
      'Inventory of processing activities involving indirectly obtained data',
      'Notification procedures and templates for indirect data collection',
      'Source and category documentation for indirectly obtained data',
      'Notification delivery records with timestamps',
      'Exception documentation where Art. 14(5) exemptions are relied upon',
    ],
    testProcedures: [
      'Review the inventory of indirect data collection activities for completeness',
      'Verify notification templates include all Art. 14 required information',
      'Check notification delivery records to confirm data subjects were informed within one month',
      'Validate any claimed Art. 14(5) exemptions against the regulation requirements',
      'Test automated notification workflows for accuracy and timeliness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-15',
    name: 'Right of Access',
    description:
      'The data subject shall have the right to obtain from the controller confirmation as to whether personal data concerning them are being processed, and if so, access to the personal data and supplementary information including purposes, categories, recipients, retention period, rights, source, and automated decision-making details.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Implement a Subject Access Request (SAR) intake process with identity verification procedures. Develop data discovery capabilities to locate all personal data across systems for a given data subject. Create standardized response packages that include all Art. 15 supplementary information. Establish a secure delivery mechanism for providing copies of personal data. Define escalation procedures for complex requests and train frontline staff on the SAR process.',
    evidenceRequirements: [
      'SAR intake procedure documentation with identity verification steps',
      'Data discovery tool configuration or manual search procedures',
      'Standardized SAR response template with Art. 15 supplementary information',
      'Secure data delivery mechanism documentation',
      'SAR processing log with response timelines',
    ],
    testProcedures: [
      'Submit a test SAR and verify the identity verification process is followed',
      'Confirm data discovery locates personal data across all relevant systems',
      'Review the SAR response for completeness of Art. 15 supplementary information',
      'Test the secure delivery mechanism for confidentiality and integrity',
      'Review the SAR log for compliance with the one-month response deadline',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-16',
    name: 'Right to Rectification',
    description:
      'The data subject shall have the right to obtain from the controller without undue delay the rectification of inaccurate personal data and, taking into account the purposes of the processing, the right to have incomplete personal data completed.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Provide accessible channels for data subjects to submit rectification requests (online form, email, in-person). Implement identity verification before processing rectification requests. Develop procedures to propagate corrections to all systems where the data is stored and to any third parties to whom the data was disclosed. Establish timelines for processing rectification requests within one month. Maintain records of all rectification actions taken.',
    evidenceRequirements: [
      'Rectification request intake channels documentation',
      'Identity verification procedures for rectification requests',
      'Data propagation procedures for corrections across systems and third parties',
      'Rectification request log with processing timelines',
      'Notification records to third-party recipients of corrected data',
    ],
    testProcedures: [
      'Submit a test rectification request and verify the intake and identity verification process',
      'Confirm the correction is propagated to all relevant systems',
      'Verify third parties who received the data are notified of the correction',
      'Review the rectification log for compliance with response timelines',
      'Check that the data subject is informed of the rectification outcome',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-17',
    name: 'Right to Erasure (Right to Be Forgotten)',
    description:
      'The data subject shall have the right to obtain from the controller the erasure of personal data without undue delay where one of several grounds applies, including withdrawal of consent, data no longer necessary, unlawful processing, or objection to processing.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop an erasure request intake and assessment procedure that evaluates each request against the Art. 17 grounds and exemptions. Implement technical capabilities to permanently delete personal data from all systems including backups, logs, and archives, or document where deletion from backups is technically infeasible and implement compensating controls. Establish procedures to notify third-party recipients of the erasure. Where data has been made public, take reasonable steps to inform other controllers processing the data to erase links, copies, or replications. Maintain an erasure log that records actions taken without retaining the deleted personal data.',
    evidenceRequirements: [
      'Erasure request assessment procedure documentation',
      'Technical deletion capability documentation across all systems',
      'Backup and archive deletion or compensation control procedures',
      'Third-party notification procedures for erasure',
      'Erasure log with actions taken and grounds assessed',
    ],
    testProcedures: [
      'Submit a test erasure request and trace the assessment and execution process',
      'Verify data is deleted from primary systems, backups, and archives',
      'Confirm third-party recipients are notified of the erasure',
      'Review the erasure log for complete and accurate documentation',
      'Test that exemption assessments are properly documented when erasure is refused',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-18',
    name: 'Right to Restriction of Processing',
    description:
      'The data subject shall have the right to obtain from the controller restriction of processing where the accuracy is contested, the processing is unlawful, the controller no longer needs the data, or the data subject has objected pending verification.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Implement technical mechanisms to restrict processing of personal data (e.g., flagging records, moving data to a segregated store, temporarily suspending automated processing). Define procedures for evaluating restriction requests against the four Art. 18 grounds. Establish a process to inform the data subject before lifting any restriction. Ensure restricted data is only processed with the data subject consent, for legal claims, for the protection of another person rights, or for important public interest reasons.',
    evidenceRequirements: [
      'Technical restriction mechanism documentation',
      'Restriction request assessment procedures',
      'Restricted data register showing currently restricted records',
      'Notification procedures for lifting restrictions',
      'Access control evidence showing restricted data cannot be processed without authorization',
    ],
    testProcedures: [
      'Submit a test restriction request and verify the technical restriction is applied',
      'Confirm restricted data cannot be processed through normal workflows',
      'Verify the data subject is notified before any restriction is lifted',
      'Review the restricted data register for accuracy and completeness',
      'Test that only authorized processing of restricted data is possible',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-19',
    name: 'Notification Obligation Regarding Rectification, Erasure, or Restriction',
    description:
      'The controller shall communicate any rectification, erasure, or restriction of processing to each recipient to whom the personal data have been disclosed, unless this proves impossible or involves disproportionate effort. The controller shall inform the data subject about those recipients if the data subject requests it.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Maintain a register of all recipients to whom personal data has been disclosed for each data subject. Implement notification procedures triggered automatically when rectification, erasure, or restriction actions occur. Document the rationale where notification to a specific recipient is deemed impossible or disproportionately burdensome. Establish a process to respond to data subject requests for recipient information.',
    evidenceRequirements: [
      'Recipient register per data subject or processing activity',
      'Automated or manual notification procedures for rectification, erasure, and restriction',
      'Notification delivery records to recipients',
      'Disproportionate effort assessments where notification was not made',
      'Process documentation for responding to recipient information requests',
    ],
    testProcedures: [
      'Review the recipient register for completeness and currency',
      'Trigger a rectification or erasure action and verify recipient notifications are sent',
      'Review notification delivery records for timeliness and completeness',
      'Verify disproportionate effort assessments are reasonable and documented',
      'Submit a test request for recipient information and verify the response',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-20',
    name: 'Right to Data Portability',
    description:
      'The data subject shall have the right to receive their personal data in a structured, commonly used, and machine-readable format and have the right to transmit that data to another controller without hindrance, where processing is based on consent or contract and is carried out by automated means.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Implement data export functionality that generates personal data in structured, machine-readable formats (e.g., JSON, CSV, XML). Where technically feasible, implement direct controller-to-controller transfer capabilities. Limit the scope of portable data to data provided by the data subject and processed by automated means under consent or contract. Define identity verification procedures for portability requests. Test export formats to ensure interoperability.',
    evidenceRequirements: [
      'Data export functionality documentation and supported formats',
      'Controller-to-controller transfer capability documentation or feasibility assessment',
      'Scope definition for portable data per processing activity',
      'Identity verification procedures for portability requests',
      'Export format interoperability test results',
    ],
    testProcedures: [
      'Submit a test portability request and verify the data export is generated in a machine-readable format',
      'Validate the exported data contains only in-scope data provided by the data subject',
      'Test the controller-to-controller transfer mechanism if implemented',
      'Verify identity verification is performed before releasing the export',
      'Import the exported data into a different system to confirm interoperability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-21',
    name: 'Right to Object',
    description:
      'The data subject shall have the right to object at any time to processing of their personal data based on legitimate interests or public task, including profiling. The controller shall cease processing unless compelling legitimate grounds are demonstrated. For direct marketing, the data subject has an absolute right to object.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Implement clear and accessible objection mechanisms separate from other communications. For direct marketing, implement immediate opt-out processing with no assessment required. For legitimate interest or public task objections, establish an assessment procedure to weigh the data subject grounds against the controller compelling legitimate grounds. Present the right to object explicitly at the point of first communication and in the privacy notice. Maintain an objection register and configure systems to enforce processing cessation.',
    evidenceRequirements: [
      'Objection mechanism documentation and user interface evidence',
      'Direct marketing opt-out processing workflow and system configuration',
      'Objection assessment procedure for legitimate interest and public task processing',
      'Privacy notice and first communication evidence showing right to object information',
      'Objection register with assessment outcomes and processing cessation records',
    ],
    testProcedures: [
      'Submit a test objection to direct marketing and verify immediate cessation of marketing communications',
      'Submit a test objection to legitimate interest processing and verify the assessment procedure is followed',
      'Review the privacy notice for explicit right to object information',
      'Inspect the objection register for complete and accurate records',
      'Verify systems enforce processing cessation after a successful objection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-22',
    name: 'Automated Individual Decision-Making and Profiling',
    description:
      'The data subject shall have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects or similarly significantly affects them, unless it is necessary for a contract, authorized by law, or based on explicit consent.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Inventory all automated decision-making and profiling activities. For each, assess whether decisions produce legal effects or similarly significant effects on data subjects. Where Art. 22(2) exceptions apply, implement suitable safeguards including the right to obtain human intervention, express a point of view, and contest the decision. Provide meaningful information about the logic involved, significance, and envisaged consequences in privacy notices. Prohibit automated decision-making on special category data unless Art. 9(2)(a) or (g) applies with suitable safeguards.',
    evidenceRequirements: [
      'Inventory of automated decision-making and profiling activities',
      'Impact assessments for automated decisions producing legal or significant effects',
      'Human intervention mechanism documentation',
      'Privacy notice sections explaining automated decision-making logic',
      'Safeguard implementation evidence for Art. 22(2) exceptions',
    ],
    testProcedures: [
      'Review the automated decision-making inventory for completeness',
      'Test the human intervention mechanism for accessibility and effectiveness',
      'Verify privacy notices explain the logic, significance, and consequences of automated decisions',
      'Submit a test request to contest an automated decision and trace the process',
      'Confirm special category data is not used in automated decision-making without valid exceptions',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Controller Obligations (Articles 24-39)
  // ============================================================
  {
    controlId: 'GDPR-24',
    name: 'Responsibility of the Controller',
    description:
      'The controller shall implement appropriate technical and organizational measures to ensure and be able to demonstrate that processing is performed in accordance with the GDPR, taking into account the nature, scope, context, and purposes of processing, as well as the risks to the rights and freedoms of natural persons.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Establish a data protection management framework with defined policies, procedures, roles, and governance structures. Implement technical measures proportionate to processing risks, including access controls, encryption, monitoring, and incident management. Conduct regular risk assessments to evaluate the effectiveness of implemented measures. Maintain comprehensive documentation to demonstrate compliance. Implement and regularly review data protection policies, and ensure they are communicated to all relevant personnel.',
    evidenceRequirements: [
      'Data protection management framework documentation',
      'Technical measures implementation records proportionate to risk',
      'Risk assessment reports and treatment plans',
      'Policy documentation with communication and acknowledgment records',
      'Governance meeting minutes demonstrating oversight',
    ],
    testProcedures: [
      'Review the data protection framework for comprehensiveness and risk proportionality',
      'Verify technical measures are implemented as documented',
      'Assess risk assessment methodology and review recent reports',
      'Confirm policies are communicated and acknowledged by relevant personnel',
      'Review governance meeting records for regular data protection oversight',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-25',
    name: 'Data Protection by Design and by Default',
    description:
      'The controller shall implement appropriate technical and organizational measures designed to implement data protection principles effectively and integrate necessary safeguards into the processing. By default, only personal data necessary for each specific purpose shall be processed.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Integrate privacy requirements into the software development lifecycle (SDLC) and project management processes. Implement privacy-by-design checklists for new projects, systems, and features. Configure systems to collect and process the minimum personal data needed by default (e.g., default privacy settings set to most restrictive). Conduct privacy design reviews before launch of new processing activities. Maintain design documentation showing how data protection principles are embedded into architecture decisions.',
    evidenceRequirements: [
      'Privacy-by-design integration into SDLC documentation',
      'Privacy design review checklists and completed assessments',
      'Default configuration evidence showing minimum data collection',
      'Architecture documentation demonstrating embedded data protection principles',
      'Project approval records requiring privacy-by-design sign-off',
    ],
    testProcedures: [
      'Review the SDLC for privacy-by-design integration points',
      'Inspect completed privacy design reviews for recent projects',
      'Verify default system configurations minimize personal data processing',
      'Review architecture documentation for data protection principle integration',
      'Confirm new projects cannot proceed without privacy-by-design assessment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-26',
    name: 'Joint Controllers',
    description:
      'Where two or more controllers jointly determine the purposes and means of processing, they shall in a transparent manner determine their respective responsibilities for compliance with the GDPR, in particular regarding the exercise of data subject rights and provision of information.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Identify all joint controller relationships through processing activity reviews. Negotiate and execute joint controller agreements that clearly define each party responsibilities for GDPR compliance, including data subject rights handling, information provision, and breach notification. Make the essence of the arrangement available to data subjects. Establish communication channels between joint controllers for coordinated compliance. Review joint controller agreements periodically and when processing changes.',
    evidenceRequirements: [
      'Inventory of joint controller relationships',
      'Executed joint controller agreements with responsibility allocation',
      'Data subject-facing summary of joint controller arrangements',
      'Communication protocols between joint controllers',
      'Periodic review records for joint controller agreements',
    ],
    testProcedures: [
      'Review the inventory of joint controller relationships for completeness',
      'Examine joint controller agreements for clear responsibility allocation',
      'Verify data subjects can access information about joint controller arrangements',
      'Test communication channels between joint controllers',
      'Confirm agreements are reviewed when processing activities change',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-27',
    name: 'Representatives of Controllers Not Established in the EU',
    description:
      'Where a controller or processor not established in the EU processes personal data of data subjects in the EU, they shall designate in writing a representative in the Union, unless processing is occasional, does not include large-scale processing of special categories, and is unlikely to result in a risk to the rights and freedoms of natural persons.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Assess whether the organization is subject to GDPR as a non-EU established controller or processor under Art. 3(2). If applicable, appoint a representative in an EU Member State where data subjects whose data is processed are located. Execute a formal written mandate with the representative defining their role and responsibilities. Publish the representative contact details in privacy notices and make them available to supervisory authorities. Ensure the representative is equipped to handle data subject requests and supervisory authority communications.',
    evidenceRequirements: [
      'Art. 3(2) applicability assessment documentation',
      'Written representative mandate with defined responsibilities',
      'Representative contact details in privacy notices',
      'Communication procedures between the organization and the representative',
      'Evidence the representative can handle data subject and supervisory authority requests',
    ],
    testProcedures: [
      'Review the Art. 3(2) assessment for accuracy',
      'Verify the representative mandate is executed and defines clear responsibilities',
      'Confirm representative contact details are published in privacy notices',
      'Test communication procedures between the organization and representative',
      'Verify the representative can demonstrate readiness to handle incoming requests',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-28',
    name: 'Processor Obligations',
    description:
      'Where processing is carried out on behalf of a controller, the controller shall use only processors providing sufficient guarantees to implement appropriate measures. Processing by a processor shall be governed by a contract or legal act setting out the subject-matter and duration of processing, nature and purpose, type of data, categories of data subjects, and obligations and rights of the controller.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Conduct due diligence assessments of all processors before engagement, evaluating their technical and organizational security measures. Execute Data Processing Agreements (DPAs) with all processors containing all Art. 28(3) mandatory clauses. Implement a processor oversight program including periodic audits, certification reviews, or compliance questionnaires. Maintain a central register of all processors and sub-processors. Require processors to obtain prior written authorization before engaging sub-processors and to notify the controller of any intended changes.',
    evidenceRequirements: [
      'Processor due diligence assessment reports',
      'Executed Data Processing Agreements with Art. 28(3) clauses',
      'Processor register with sub-processor information',
      'Processor audit or compliance review reports',
      'Sub-processor authorization and change notification records',
    ],
    testProcedures: [
      'Review due diligence assessments for comprehensiveness',
      'Audit DPAs against Art. 28(3) mandatory clause requirements',
      'Verify the processor register is complete and current',
      'Review recent processor audit or compliance review results',
      'Confirm sub-processor changes require prior authorization and are tracked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-29',
    name: 'Processing Under the Authority of the Controller or Processor',
    description:
      'The processor and any person acting under the authority of the controller or processor who has access to personal data shall not process those data except on instructions from the controller, unless required to do so by Union or Member State law.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Implement documented processing instructions from controllers to processors and sub-processors. Establish confidentiality agreements or obligations for all personnel with access to personal data. Implement technical access controls that enforce processing boundaries consistent with controller instructions. Train all personnel with data access on the requirement to process only under authorized instructions. Monitor and audit processing activities to detect unauthorized processing.',
    evidenceRequirements: [
      'Documented controller instructions to processors',
      'Confidentiality agreements or contractual obligations for personnel',
      'Technical access controls aligned with processing instructions',
      'Training records on authorized processing requirements',
      'Monitoring and audit logs for processing activities',
    ],
    testProcedures: [
      'Review documented processing instructions for clarity and specificity',
      'Verify confidentiality agreements are in place for all personnel with data access',
      'Test access controls to confirm they enforce processing instruction boundaries',
      'Sample training records for personnel with access to personal data',
      'Review monitoring logs for any unauthorized processing activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-30',
    name: 'Records of Processing Activities',
    description:
      'Each controller shall maintain a record of processing activities under its responsibility, containing the name and contact details of the controller, purposes of processing, categories of data subjects and personal data, categories of recipients, transfers to third countries, retention periods, and a general description of security measures.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Create and maintain a comprehensive Record of Processing Activities (RoPA) containing all Art. 30(1) required information. Implement a centralized tool or register for RoPA management. Assign process owners responsible for maintaining the accuracy of their processing activity records. Establish a review cycle (at least annually) and trigger reviews when processing activities change. Ensure the RoPA is available for inspection by the supervisory authority upon request.',
    evidenceRequirements: [
      'Complete Record of Processing Activities with all Art. 30(1) fields',
      'RoPA management tool or register documentation',
      'Process owner assignments for each processing activity',
      'Periodic review schedule and completed review records',
      'Procedure for making the RoPA available to the supervisory authority',
    ],
    testProcedures: [
      'Audit the RoPA against Art. 30(1) required fields for completeness',
      'Cross-reference the RoPA with known processing activities to identify gaps',
      'Verify process owners are assigned and actively maintain their records',
      'Confirm the RoPA has been reviewed within the defined review cycle',
      'Test the procedure for producing the RoPA upon supervisory authority request',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-32',
    name: 'Security of Processing',
    description:
      'The controller and processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including pseudonymization, encryption, the ability to ensure confidentiality, integrity, availability, and resilience, the ability to restore availability and access in a timely manner, and regular testing and evaluation of effectiveness.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Conduct a risk assessment to determine the appropriate level of security measures. Implement encryption of personal data at rest and in transit using industry-standard algorithms. Apply pseudonymization where it can reduce risk without impairing processing purposes. Design and maintain systems for high availability and resilience, including redundancy, failover, and disaster recovery. Establish a regular testing program including vulnerability scans, penetration tests, and security control assessments. Document and monitor all security measures, reviewing them at least annually.',
    evidenceRequirements: [
      'Security risk assessment reports with risk-proportionate controls',
      'Encryption implementation evidence for data at rest and in transit',
      'Pseudonymization implementation documentation where applicable',
      'Business continuity and disaster recovery plans and test results',
      'Vulnerability scan and penetration test reports',
      'Annual security measure review documentation',
    ],
    testProcedures: [
      'Review the security risk assessment for thoroughness and currency',
      'Verify encryption configurations on personal data stores and transmission channels',
      'Test pseudonymization implementations for effectiveness',
      'Review disaster recovery test results for recoverability of personal data',
      'Inspect recent vulnerability scan and penetration test findings and remediation status',
      'Confirm security measures are reviewed and updated at least annually',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-33',
    name: 'Notification of Personal Data Breach to Supervisory Authority',
    description:
      'In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after becoming aware of it, notify the personal data breach to the competent supervisory authority, unless the breach is unlikely to result in a risk to the rights and freedoms of natural persons.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Implement breach detection and reporting mechanisms including security monitoring, logging, and alerting. Define a breach assessment procedure to evaluate risk to data subjects and determine if notification is required. Establish a breach notification workflow that can meet the 72-hour deadline, including pre-drafted notification templates and contact information for relevant supervisory authorities. Where notification cannot be made within 72 hours, document the reasons for delay. Train all staff on breach identification and internal reporting procedures. Conduct breach response exercises at least annually.',
    evidenceRequirements: [
      'Breach detection and monitoring system documentation',
      'Breach assessment procedure and risk evaluation criteria',
      'Notification workflow with 72-hour timeline tracking',
      'Pre-drafted supervisory authority notification templates',
      'Contact information register for relevant supervisory authorities',
      'Breach response exercise reports',
      'Staff training records on breach identification and reporting',
    ],
    testProcedures: [
      'Review breach detection monitoring configurations for adequacy',
      'Walk through the breach assessment procedure with a simulated scenario',
      'Conduct a timed test of the notification workflow to verify 72-hour feasibility',
      'Review notification templates for completeness against Art. 33(3) requirements',
      'Verify supervisory authority contact information is current',
      'Review the most recent breach response exercise report',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-34',
    name: 'Communication of Personal Data Breach to Data Subject',
    description:
      'When the personal data breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall communicate the personal data breach to the data subject without undue delay, describing the nature of the breach, DPO contact, likely consequences, and measures taken or proposed.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Define criteria for determining when a breach meets the "high risk" threshold requiring data subject notification. Develop data subject breach notification templates that include all Art. 34(2) required information in clear and plain language. Establish communication channels for reaching affected data subjects (email, postal, public communication). Integrate data subject notification into the breach response workflow. Document cases where notification is not required under Art. 34(3) exceptions (encryption, subsequent measures eliminating high risk, or disproportionate effort with public communication).',
    evidenceRequirements: [
      'High risk threshold criteria documentation',
      'Data subject breach notification templates with Art. 34(2) information',
      'Communication channel procedures for reaching affected data subjects',
      'Breach response workflow showing data subject notification integration',
      'Art. 34(3) exception assessment documentation where applicable',
    ],
    testProcedures: [
      'Review high risk threshold criteria for clarity and alignment with regulatory guidance',
      'Inspect notification templates for completeness and plain language',
      'Test communication channels for reaching data subjects effectively',
      'Walk through a simulated high-risk breach scenario to verify data subject notification',
      'Review any Art. 34(3) exception assessments for proper justification',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-35',
    name: 'Data Protection Impact Assessment',
    description:
      'Where a type of processing, in particular using new technologies, is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall carry out an assessment of the impact of the envisaged processing operations on the protection of personal data. A DPIA is required for systematic and extensive profiling with significant effects, large-scale processing of special categories, and systematic monitoring of publicly accessible areas.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop a DPIA policy defining when assessments are required, including a screening checklist aligned with Art. 35(3) and supervisory authority published lists. Create a standardized DPIA methodology covering systematic description of processing, necessity and proportionality assessment, risk assessment to data subjects, and measures to address risks. Integrate DPIA requirements into project governance so that new processing cannot proceed without screening. Seek the advice of the DPO when carrying out DPIAs. Engage data subjects or their representatives where appropriate. Review and update DPIAs when risks change.',
    evidenceRequirements: [
      'DPIA policy with screening criteria and triggers',
      'DPIA methodology and template documentation',
      'Completed DPIA reports for relevant processing activities',
      'DPO involvement records in DPIA processes',
      'Project governance integration evidence requiring DPIA screening',
      'DPIA review and update records when processing changes',
    ],
    testProcedures: [
      'Review the DPIA policy for alignment with Art. 35(3) and supervisory authority requirements',
      'Inspect completed DPIAs for methodology completeness',
      'Verify DPO involvement in DPIA processes',
      'Confirm project governance requires DPIA screening before new processing proceeds',
      'Check that DPIAs are reviewed when processing activities or risks change',
      'Cross-reference processing activities to identify any missing DPIAs',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-36',
    name: 'Prior Consultation',
    description:
      'The controller shall consult the supervisory authority prior to processing where a DPIA indicates that the processing would result in a high risk in the absence of measures taken by the controller to mitigate the risk.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Define escalation criteria within the DPIA process for when residual risk remains high after mitigation measures. Establish a prior consultation procedure including preparation of the submission package required by Art. 36(3): DPIA, respective responsibilities of joint controllers and processors, purposes and means, measures and safeguards, DPO contact details, and any other requested information. Designate responsible personnel for managing the supervisory authority consultation process. Track consultation outcomes and implement any conditions or recommendations imposed by the supervisory authority.',
    evidenceRequirements: [
      'Escalation criteria for prior consultation within DPIA process',
      'Prior consultation procedure documentation',
      'Art. 36(3) submission package template',
      'Consultation records with supervisory authority correspondence',
      'Implementation records for supervisory authority recommendations',
    ],
    testProcedures: [
      'Review escalation criteria within the DPIA process for prior consultation triggers',
      'Inspect the prior consultation procedure and submission package template',
      'Verify any past prior consultations were properly conducted and documented',
      'Confirm supervisory authority recommendations have been implemented',
      'Test that DPIA outcomes with high residual risk trigger the escalation process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-37',
    name: 'Designation of the Data Protection Officer',
    description:
      'The controller and the processor shall designate a Data Protection Officer where the processing is carried out by a public authority or body, the core activities require regular and systematic monitoring of data subjects on a large scale, or the core activities consist of large-scale processing of special categories of data or data relating to criminal convictions.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Assess whether the organization is required to appoint a DPO under Art. 37(1) criteria. If required or voluntarily appointed, designate a DPO with expert knowledge of data protection law and practices. Ensure the DPO is appointed on the basis of professional qualities and ability to fulfil the tasks referred to in Art. 39. Publish the DPO contact details and communicate them to the supervisory authority. Formally document the DPO appointment including their reporting line and resource allocation.',
    evidenceRequirements: [
      'DPO necessity assessment against Art. 37(1) criteria',
      'DPO appointment letter or contract with role definition',
      'DPO qualifications and expert knowledge evidence',
      'Published DPO contact details (privacy notice, website)',
      'Supervisory authority notification of DPO contact details',
    ],
    testProcedures: [
      'Review the DPO necessity assessment for completeness',
      'Verify the DPO appointment is formally documented',
      'Confirm the DPO has appropriate qualifications and expertise',
      'Check DPO contact details are published and accessible to data subjects',
      'Verify the supervisory authority has been notified of DPO contact details',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-38',
    name: 'Position of the Data Protection Officer',
    description:
      'The controller and processor shall ensure that the DPO is involved properly and in a timely manner in all issues relating to the protection of personal data, is supported with resources necessary to carry out their tasks and maintain expert knowledge, does not receive instructions regarding the exercise of their tasks, reports directly to the highest management level, and is not dismissed or penalized for performing their tasks.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Establish formal processes to involve the DPO in all data protection-related decisions, projects, and incidents from the earliest stage. Allocate sufficient resources (budget, staff, tools, training) for the DPO to carry out their duties effectively. Ensure the DPO has a direct reporting line to the board or highest management level. Implement safeguards against conflicts of interest by ensuring the DPO does not hold a position that determines the purposes and means of processing. Document independence protections in the DPO role description.',
    evidenceRequirements: [
      'DPO involvement procedures in data protection decisions and projects',
      'DPO resource allocation records (budget, staff, tools)',
      'Organizational chart showing DPO direct reporting to highest management',
      'Conflict of interest assessment for the DPO role',
      'DPO role description with independence protections',
      'DPO training and continuing education records',
    ],
    testProcedures: [
      'Review project records to confirm DPO involvement in data protection matters',
      'Verify adequate resources are allocated to the DPO function',
      'Confirm the DPO reports directly to the highest management level',
      'Assess potential conflicts of interest in the DPO other duties',
      'Review the DPO role description for independence protections',
      'Inspect DPO training records for ongoing professional development',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-39',
    name: 'Tasks of the Data Protection Officer',
    description:
      'The DPO shall have at least the following tasks: inform and advise the controller or processor and employees on their obligations, monitor compliance including awareness-raising, training, and audits, provide advice on DPIAs, cooperate with the supervisory authority, and act as a contact point for the supervisory authority on processing issues.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Define the DPO task portfolio in writing, covering all Art. 39(1) duties. Establish regular compliance monitoring activities including internal audits, policy reviews, and staff training programs. Create processes for the DPO to advise on DPIAs and new processing activities. Set up communication channels between the DPO and the supervisory authority. Implement a DPO activity log to track advice given, compliance monitoring activities, and supervisory authority interactions. Schedule regular DPO reports to management on the state of data protection compliance.',
    evidenceRequirements: [
      'DPO task portfolio documentation aligned with Art. 39(1)',
      'Compliance monitoring activity plans and completed reports',
      'Staff awareness and training program delivered by or with DPO involvement',
      'DPIA advisory records from the DPO',
      'DPO activity log covering advice, monitoring, and supervisory authority contact',
      'DPO reports to management on compliance status',
    ],
    testProcedures: [
      'Review the DPO task portfolio for Art. 39(1) completeness',
      'Inspect compliance monitoring reports and audit findings',
      'Verify training programs include DPO input on data protection obligations',
      'Review DPIA records for DPO advisory involvement',
      'Examine the DPO activity log for regularity and thoroughness',
      'Confirm DPO reports are provided to management at defined intervals',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // International Transfers (Articles 44-49)
  // ============================================================
  {
    controlId: 'GDPR-44',
    name: 'General Principle for Transfers',
    description:
      'Any transfer of personal data which are undergoing processing or are intended for processing after transfer to a third country or to an international organization shall take place only if the controller and processor comply with the conditions laid down in Chapter V of the GDPR.',
    category: 'International Transfers',
    implementationGuidance:
      'Map all international transfers of personal data including the countries involved, transfer mechanisms used, and types of data transferred. Establish a transfer governance framework that requires assessment and approval before any new international transfer is initiated. Document the legal basis (adequacy decision, appropriate safeguard, or derogation) for each transfer. Implement a periodic review of all international transfers to ensure ongoing compliance with Chapter V requirements.',
    evidenceRequirements: [
      'International data transfer mapping and inventory',
      'Transfer governance framework documentation',
      'Legal basis documentation for each international transfer',
      'Transfer approval records for new transfers',
      'Periodic transfer review reports',
    ],
    testProcedures: [
      'Review the transfer mapping for completeness against actual data flows',
      'Verify each international transfer has a documented legal basis',
      'Confirm the governance framework requires approval before new transfers begin',
      'Inspect periodic review reports for all existing transfers',
      'Test that unauthorized transfers are detected and prevented by technical controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-45',
    name: 'Transfers Based on Adequacy Decisions',
    description:
      'A transfer of personal data to a third country or an international organization may take place where the European Commission has decided that the third country, a territory, or one or more specified sectors within that third country, or the international organization in question ensures an adequate level of protection.',
    category: 'International Transfers',
    implementationGuidance:
      'Maintain an up-to-date register of European Commission adequacy decisions. For each transfer relying on an adequacy decision, document the applicable decision and verify it covers the specific territory, sector, or organization involved. Monitor for any changes to or revocations of adequacy decisions by the European Commission. Where an adequacy decision is revoked or invalidated, activate a contingency plan to implement alternative transfer mechanisms promptly.',
    evidenceRequirements: [
      'Register of current adequacy decisions relied upon',
      'Transfer documentation referencing the applicable adequacy decision',
      'Monitoring process for changes to adequacy decisions',
      'Contingency plan for adequacy decision revocation',
    ],
    testProcedures: [
      'Verify the adequacy decision register is current and accurate',
      'Confirm each transfer relying on adequacy correctly references the applicable decision',
      'Review the monitoring process for adequacy decision changes',
      'Inspect the contingency plan for revocation scenarios',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-46',
    name: 'Transfers Subject to Appropriate Safeguards',
    description:
      'In the absence of an adequacy decision, a controller or processor may transfer personal data to a third country or an international organization only if the controller or processor has provided appropriate safeguards, including Standard Contractual Clauses, Binding Corporate Rules, approved codes of conduct, or approved certification mechanisms, and on condition that enforceable data subject rights and effective legal remedies are available.',
    category: 'International Transfers',
    implementationGuidance:
      'Identify all transfers that cannot rely on an adequacy decision and select the appropriate safeguard mechanism. For Standard Contractual Clauses (SCCs), adopt the European Commission approved clauses (June 2021 version) and complete the necessary modules and annexes. Conduct Transfer Impact Assessments (TIAs) to evaluate the law and practice of the destination country and determine if supplementary measures are needed. Implement supplementary technical, contractual, or organizational measures where the TIA identifies risks. Document the entire assessment and decision-making process.',
    evidenceRequirements: [
      'Executed Standard Contractual Clauses or other appropriate safeguard documentation',
      'Transfer Impact Assessment reports for each destination country',
      'Supplementary measures documentation where required',
      'Completed SCC annexes with transfer-specific details',
      'Periodic review records for safeguard effectiveness',
    ],
    testProcedures: [
      'Review executed SCCs or other safeguards for completeness and correct module selection',
      'Inspect Transfer Impact Assessments for thoroughness and currency',
      'Verify supplementary measures are implemented where TIAs identified risks',
      'Confirm SCC annexes accurately describe the transfer details',
      'Review periodic safeguard effectiveness assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-47',
    name: 'Binding Corporate Rules',
    description:
      'Binding Corporate Rules (BCRs) approved by a competent supervisory authority may serve as appropriate safeguards for transfers within a group of undertakings or group of enterprises engaged in a joint economic activity, provided they include all the principles, rights, and requirements set out in Art. 47(2).',
    category: 'International Transfers',
    implementationGuidance:
      'If using BCRs as a transfer mechanism, develop comprehensive BCRs covering all Art. 47(2) requirements including binding nature, data protection principles, data subject rights, acceptance of liability, transparency, DPO role, complaint procedures, cooperation with supervisory authorities, and training. Submit BCRs for approval through the consistency mechanism via the lead supervisory authority. Once approved, implement the BCRs across all group entities and ensure compliance through internal audit programs. Maintain records of BCR compliance across the group.',
    evidenceRequirements: [
      'Approved Binding Corporate Rules documentation',
      'Supervisory authority approval decision for BCRs',
      'BCR implementation evidence across group entities',
      'Internal audit reports on BCR compliance',
      'Training records on BCR requirements for group personnel',
      'BCR update and review records',
    ],
    testProcedures: [
      'Verify BCR approval by the competent supervisory authority',
      'Review BCR documentation against Art. 47(2) requirements',
      'Confirm BCR implementation across all relevant group entities',
      'Inspect internal audit reports for BCR compliance findings',
      'Sample training records for group personnel on BCR obligations',
      'Verify BCRs are reviewed and updated as required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-49',
    name: 'Derogations for Specific Situations',
    description:
      'In the absence of an adequacy decision or appropriate safeguards, a transfer may take place based on specific derogations including explicit consent of the data subject, necessity for the performance of a contract, important reasons of public interest, establishment or exercise of legal claims, protection of vital interests, or transfer from a public register.',
    category: 'International Transfers',
    implementationGuidance:
      'Use derogations under Art. 49 only as a last resort when no adequacy decision or appropriate safeguard is available. Document the specific derogation relied upon for each transfer, ensuring the conditions are strictly met. For consent-based derogations, ensure the data subject is informed of the specific risks of the transfer before providing explicit consent. For contract-based derogations, demonstrate the transfer is necessary (not merely convenient) for contract performance. Limit derogation-based transfers to non-repetitive, small-scale activities where possible. Notify the supervisory authority of transfers under Art. 49(1) second subparagraph.',
    evidenceRequirements: [
      'Documentation of derogation basis for each transfer under Art. 49',
      'Explicit consent records with risk information provided to data subjects',
      'Contractual necessity assessments for contract-based derogations',
      'Public interest justification documentation where applicable',
      'Supervisory authority notification records for second subparagraph transfers',
      'Assessment demonstrating derogation is a last resort measure',
    ],
    testProcedures: [
      'Review derogation documentation for strict compliance with Art. 49 conditions',
      'Verify explicit consent records include information about transfer risks',
      'Assess contractual necessity justifications for genuine necessity',
      'Confirm derogation-based transfers are limited in scope and frequency where required',
      'Verify supervisory authority notifications have been made where applicable',
      'Confirm no adequacy decision or appropriate safeguard was available before using the derogation',
    ],
    status: 'Not Started',
  },
  // Additional Controls for 45 Total
  {
    controlId: 'GDPR-77',
    name: 'Right to Lodge a Complaint with Supervisory Authority',
    description:
      'Every data subject shall have the right to lodge a complaint with a supervisory authority if the data subject considers that the processing of personal data relating to him or her infringes the GDPR.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Inform data subjects of their right to lodge complaints with the supervisory authority in privacy notices and communications. Provide contact information for relevant supervisory authorities. Establish internal processes to handle and track complaints that may be escalated to supervisory authorities. Train staff on responding appropriately to complaints and understanding when regulatory escalation may occur.',
    evidenceRequirements: [
      'Privacy notice sections informing of complaint rights',
      'Supervisory authority contact information availability',
      'Internal complaint handling procedures',
      'Complaint tracking logs',
      'Staff training records on complaint handling',
    ],
    testProcedures: [
      'Verify privacy notices include information about complaint rights and supervisory authority contact',
      'Review complaint handling procedures for regulatory escalation pathways',
      'Inspect complaint tracking logs for completeness',
      'Confirm staff training includes regulatory complaint awareness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-82',
    name: 'Right to Compensation and Liability',
    description:
      'Any person who has suffered material or non-material damage as a result of an infringement of the GDPR shall have the right to receive compensation from the controller or processor for the damage suffered.',
    category: 'Accountability',
    implementationGuidance:
      'Maintain adequate liability insurance to cover potential GDPR compensation claims. Establish processes to investigate and assess claims for damages. Implement clear allocation of liability responsibilities between controllers and processors in data processing agreements. Document compliance measures to demonstrate exemption from liability under Art. 82(3) where the party is not responsible for the event giving rise to the damage.',
    evidenceRequirements: [
      'Liability insurance coverage documentation',
      'Claims investigation and assessment procedures',
      'Data processing agreements with liability allocation clauses',
      'Compliance documentation demonstrating due diligence',
      'Incident response records showing timely remediation',
    ],
    testProcedures: [
      'Review liability insurance coverage adequacy',
      'Verify claims handling procedures are documented and operationalized',
      'Inspect data processing agreements for Art. 82 liability provisions',
      'Assess compliance documentation for demonstrating exemption from liability',
      'Review incident response records for evidence of due diligence',
    ],
    status: 'Not Started',
  },
];
