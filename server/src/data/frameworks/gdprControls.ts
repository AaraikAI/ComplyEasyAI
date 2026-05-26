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
    name: "Children's Consent",
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

  // ============================================================
  // Extended Controls - Criminal Convictions and Offenses (Article 10)
  // ============================================================
  {
    controlId: 'GDPR-10',
    name: 'Processing of Criminal Conviction Data',
    description:
      'Processing of personal data relating to criminal convictions and offenses or related security measures shall be carried out only under the control of official authority or when authorized by Union or Member State law providing for appropriate safeguards for the rights and freedoms of data subjects.',
    category: 'Special Categories Processing',
    implementationGuidance:
      'Identify all processing activities involving criminal conviction data and assess the legal basis for each. Ensure processing is either under official authority control or explicitly authorized by applicable law. Implement enhanced security measures including encryption, access restrictions, and audit logging. Maintain a comprehensive register of criminal data processing under Art. 30 separate from the general RoPA. Conduct DPIAs for all criminal data processing activities.',
    evidenceRequirements: [
      'Inventory of criminal conviction data processing activities',
      'Legal basis documentation for each processing activity',
      'Enhanced security controls specific to criminal data',
      'Dedicated register for criminal data processing',
      'DPIA reports for criminal data processing',
    ],
    testProcedures: [
      'Review inventory of criminal conviction data processing for completeness',
      'Verify legal authorization exists for each processing activity',
      'Test enhanced security controls applied to criminal data',
      'Confirm dedicated register is maintained and current',
      'Review DPIAs for all criminal data processing activities',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Processing Not Requiring Identification (Article 11)
  // ============================================================
  {
    controlId: 'GDPR-11',
    name: 'Processing Not Requiring Identification',
    description:
      'If the purposes for which a controller processes personal data do not or no longer require the identification of a data subject by the controller, the controller shall not be obliged to maintain, acquire, or process additional information in order to identify the data subject for the sole purpose of complying with the GDPR.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Identify processing activities where identification of data subjects is not required for the processing purpose. Document these activities and the rationale for not maintaining identification capabilities. Where the controller can demonstrate inability to identify the data subject, document this and inform data subjects that their rights under Articles 15-20 cannot be exercised unless additional identifying information is provided. Implement processes to handle data subject requests when they provide sufficient additional information to enable identification.',
    evidenceRequirements: [
      'Inventory of processing activities not requiring identification',
      'Rationale documentation for each non-identification processing',
      'Data subject communication templates explaining identification limitations',
      'Procedures for handling requests with additional identifying information',
      'Evidence of Art. 11 reliance in relevant processing records',
    ],
    testProcedures: [
      'Review inventory of non-identification processing for accuracy',
      'Verify rationale is documented and legitimate for each activity',
      'Test data subject communication when identification is not possible',
      'Verify procedures exist for processing requests with additional information',
      'Confirm Art. 11 reliance is properly documented and communicated',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Codes of Conduct (Articles 40-41)
  // ============================================================
  {
    controlId: 'GDPR-40',
    name: 'Codes of Conduct Adherence',
    description:
      'Member States, supervisory authorities, the Board, and the Commission shall encourage the drawing up of codes of conduct intended to contribute to the proper application of the GDPR, taking account of the specific features of the various processing sectors and the specific needs of micro, small, and medium-sized enterprises.',
    category: 'Codes of Conduct & Certification',
    implementationGuidance:
      'Identify approved codes of conduct relevant to the organization\'s sector and processing activities. Evaluate the benefits of adhering to such codes including demonstrating compliance under Art. 24, providing appropriate safeguards for international transfers under Art. 46, and facilitating data subject trust. If adopting a code, implement all required commitments and controls specified in the code. Maintain binding commitments to the code through contracts or other legally binding instruments.',
    evidenceRequirements: [
      'Assessment of relevant approved codes of conduct',
      'Code adoption decision documentation with rationale',
      'Binding commitment to code requirements where adopted',
      'Implementation evidence for all code commitments',
      'Monitoring body registration if required by the code',
    ],
    testProcedures: [
      'Review assessment of relevant codes of conduct for thoroughness',
      'Verify adoption decisions are documented with clear rationale',
      'Confirm binding commitment instruments are executed where required',
      'Test implementation of code commitments through sampling',
      'Verify registration with monitoring body if applicable',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-41',
    name: 'Monitoring of Approved Codes of Conduct',
    description:
      'A body which has an appropriate level of expertise in relation to the subject-matter of the code and is accredited by the competent supervisory authority may monitor compliance with a code of conduct.',
    category: 'Codes of Conduct & Certification',
    implementationGuidance:
      'If adhering to an approved code of conduct, identify the accredited monitoring body responsible for oversight. Cooperate fully with monitoring body audits, assessments, and inquiries. Implement corrective actions required by the monitoring body within specified timeframes. Maintain records of all interactions with the monitoring body and compliance status. Prepare for periodic recertification or compliance verification as required by the code.',
    evidenceRequirements: [
      'Identification of accredited monitoring body',
      'Records of monitoring body assessments and audits',
      'Corrective action implementation evidence',
      'Communication records with monitoring body',
      'Compliance status documentation and recertification records',
    ],
    testProcedures: [
      'Verify monitoring body is properly accredited',
      'Review records of monitoring body assessments',
      'Confirm corrective actions are implemented within required timeframes',
      'Inspect communication records for completeness',
      'Verify compliance status is current and documented',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Certification (Articles 42-43)
  // ============================================================
  {
    controlId: 'GDPR-42',
    name: 'Data Protection Certification Mechanisms',
    description:
      'Member States, supervisory authorities, the Board, and the Commission shall encourage the establishment of data protection certification mechanisms and data protection seals and marks for the purpose of demonstrating compliance with the GDPR of processing operations by controllers and processors.',
    category: 'Codes of Conduct & Certification',
    implementationGuidance:
      'Evaluate available GDPR certification mechanisms approved by supervisory authorities or the European Data Protection Board. Assess the benefits of certification including demonstrating compliance, building data subject trust, and potentially satisfying requirements for international transfers. If pursuing certification, prepare documentation and implement controls required by the certification criteria. Maintain certification through ongoing compliance and periodic recertification. Use certification seals and marks in accordance with the certification scheme rules.',
    evidenceRequirements: [
      'Assessment of available GDPR certification mechanisms',
      'Certification decision documentation with business case',
      'Certification criteria implementation evidence',
      'Certification award documentation and validity records',
      'Seal and mark usage records in compliance with scheme rules',
    ],
    testProcedures: [
      'Review assessment of certification options for thoroughness',
      'Verify certification decision documentation and rationale',
      'Test implementation of certification criteria requirements',
      'Confirm certification is current and valid',
      'Verify seal and mark usage complies with scheme rules',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-43',
    name: 'Certification Bodies',
    description:
      'Certification bodies with an appropriate level of expertise in relation to data protection shall be responsible for issuing and renewing certification after informing the supervisory authority. Certification bodies shall be accredited by the competent supervisory authority or by the national accreditation body.',
    category: 'Codes of Conduct & Certification',
    implementationGuidance:
      'If pursuing certification, verify the certification body is properly accredited by the relevant supervisory authority or national accreditation body. Prepare comprehensive documentation for certification assessment including policies, procedures, technical controls, and compliance evidence. Cooperate fully with certification body audits and assessments. Address any non-conformities identified before certification can be granted. Plan for periodic surveillance audits and recertification as required.',
    evidenceRequirements: [
      'Certification body accreditation verification',
      'Documentation package prepared for certification assessment',
      'Audit and assessment records from certification body',
      'Non-conformity remediation evidence',
      'Surveillance audit and recertification schedule and records',
    ],
    testProcedures: [
      'Verify certification body accreditation is valid and current',
      'Review documentation package for completeness',
      'Inspect audit records and certification body feedback',
      'Confirm non-conformities are remediated with evidence',
      'Verify surveillance and recertification schedule is maintained',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Judicial Remedies (Articles 78-79)
  // ============================================================
  {
    controlId: 'GDPR-78',
    name: 'Right to Effective Judicial Remedy Against Supervisory Authority',
    description:
      'Each natural or legal person shall have the right to an effective judicial remedy against a legally binding decision of a supervisory authority concerning them or where the supervisory authority does not handle a complaint or does not inform the data subject within three months on the progress or outcome of the complaint.',
    category: 'Judicial Remedies',
    implementationGuidance:
      'Establish procedures to respond to supervisory authority decisions and assess grounds for judicial challenge. Maintain legal counsel expertise in data protection litigation. Document all supervisory authority interactions and decisions with full audit trails. Implement a decision review process to evaluate options when receiving adverse supervisory authority decisions. Track complaint timelines to identify situations where remedies may be sought for supervisory authority inaction.',
    evidenceRequirements: [
      'Supervisory authority decision response procedures',
      'Legal counsel arrangements for data protection matters',
      'Supervisory authority interaction and decision records',
      'Decision review process documentation',
      'Complaint timeline tracking records',
    ],
    testProcedures: [
      'Review supervisory authority response procedures for completeness',
      'Verify legal counsel arrangements are in place',
      'Inspect records of supervisory authority interactions',
      'Confirm decision review process is documented and operational',
      'Review complaint tracking for timeline compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-79',
    name: 'Right to Effective Judicial Remedy Against Controller or Processor',
    description:
      'Each data subject shall have the right to an effective judicial remedy where they consider that their rights under the GDPR have been infringed as a result of the processing of their personal data in non-compliance with the GDPR.',
    category: 'Judicial Remedies',
    implementationGuidance:
      'Establish procedures to respond to data subject litigation and legal claims. Maintain legal counsel expertise in data protection defense. Implement comprehensive documentation practices that support defense against claims. Review insurance coverage for data protection litigation costs and damages. Train relevant staff on preservation of evidence when litigation is threatened or commenced. Implement dispute resolution mechanisms that may resolve complaints before litigation.',
    evidenceRequirements: [
      'Litigation response procedures documentation',
      'Legal counsel arrangements for defense matters',
      'Evidence preservation procedures',
      'Insurance coverage documentation for data protection claims',
      'Dispute resolution mechanism documentation',
      'Litigation tracking and status records',
    ],
    testProcedures: [
      'Review litigation response procedures for adequacy',
      'Verify legal counsel arrangements are current',
      'Test evidence preservation procedures',
      'Confirm insurance coverage is adequate and current',
      'Review dispute resolution mechanisms for effectiveness',
      'Inspect litigation tracking records if applicable',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Administrative Fines Awareness (Article 83)
  // ============================================================
  {
    controlId: 'GDPR-83',
    name: 'Administrative Fines Awareness and Prevention',
    description:
      'Supervisory authorities shall impose administrative fines up to EUR 20,000,000 or 4% of total worldwide annual turnover for infringements of basic principles, data subject rights, international transfer rules, and non-compliance with supervisory authority orders.',
    category: 'Accountability',
    implementationGuidance:
      'Educate senior management and the board on potential administrative fine exposure under GDPR. Conduct risk assessments that quantify potential fine exposure for material compliance gaps. Prioritize remediation of high-risk compliance gaps considering fine exposure. Implement financial provisioning or insurance arrangements to address potential fine liability. Monitor regulatory enforcement actions and fine precedents to inform risk assessments and compliance priorities.',
    evidenceRequirements: [
      'Management and board briefing materials on fine exposure',
      'Risk assessments quantifying potential fine liability',
      'Compliance gap prioritization based on fine exposure',
      'Financial provisioning or insurance documentation',
      'Regulatory enforcement monitoring reports',
    ],
    testProcedures: [
      'Verify senior management and board awareness of fine exposure',
      'Review risk assessments for fine liability quantification',
      'Confirm compliance priorities align with fine exposure risks',
      'Review financial or insurance arrangements for adequacy',
      'Inspect enforcement monitoring reports for currency',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Member State Penalties (Article 84)
  // ============================================================
  {
    controlId: 'GDPR-84',
    name: 'Additional Member State Penalties Compliance',
    description:
      'Member States shall lay down rules on other penalties applicable to infringements of the GDPR in particular for infringements not subject to administrative fines and shall take all measures necessary to ensure that they are implemented.',
    category: 'Accountability',
    implementationGuidance:
      'Identify all Member States where processing activities take place and assess applicable national penalties beyond GDPR administrative fines. Monitor changes to national implementing legislation and penalty regimes. Ensure compliance programs address jurisdiction-specific requirements and penalties. Include Member State-specific penalties in risk assessments and compliance prioritization. Maintain relationships with local counsel in key jurisdictions to stay informed of developments.',
    evidenceRequirements: [
      'Member State penalty regime assessments',
      'National implementing legislation monitoring records',
      'Jurisdiction-specific compliance procedures',
      'Risk assessments including Member State penalties',
      'Local counsel engagement records for key jurisdictions',
    ],
    testProcedures: [
      'Review Member State penalty assessments for completeness',
      'Verify national legislation monitoring is current',
      'Confirm jurisdiction-specific compliance procedures exist',
      'Review risk assessments for Member State penalty inclusion',
      'Verify local counsel relationships in key jurisdictions',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controls - Additional Operational Controls
  // ============================================================
  {
    controlId: 'GDPR-OPS-01',
    name: 'Privacy Program Governance',
    description:
      'Establish comprehensive governance structures to oversee and direct the privacy program, ensuring accountability, adequate resourcing, and alignment with organizational objectives and regulatory requirements.',
    category: 'Governance',
    implementationGuidance:
      'Establish a privacy steering committee or equivalent governance body with representation from key business functions. Define clear roles, responsibilities, and accountability for privacy across the organization. Implement regular governance meetings with documented agendas and minutes. Establish key performance indicators and metrics for the privacy program. Provide regular reports to senior management and the board on privacy program status, risks, and achievements.',
    evidenceRequirements: [
      'Privacy governance charter or terms of reference',
      'Governance body membership and roles documentation',
      'Meeting schedules, agendas, and minutes',
      'Privacy program KPIs and metrics dashboard',
      'Board and management privacy reports',
    ],
    testProcedures: [
      'Review governance charter for comprehensiveness',
      'Verify governance body membership includes key functions',
      'Inspect meeting records for regularity and decision documentation',
      'Review KPIs and metrics for relevance and tracking',
      'Confirm board reports are provided at defined intervals',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-02',
    name: 'Privacy Policy Framework',
    description:
      'Develop and maintain a comprehensive framework of privacy policies, standards, and procedures that operationalize GDPR requirements and guide organizational behavior.',
    category: 'Governance',
    implementationGuidance:
      'Develop a master privacy policy that articulates the organization\'s commitment to data protection and GDPR compliance. Create supporting policies covering specific areas such as data retention, data subject rights, breach management, and international transfers. Implement standards and procedures that translate policies into operational requirements. Establish a policy lifecycle including regular review and update processes. Communicate policies to all relevant personnel and obtain acknowledgments.',
    evidenceRequirements: [
      'Master privacy policy document',
      'Supporting policies for specific privacy topics',
      'Standards and procedures documentation',
      'Policy review and update schedule and records',
      'Policy communication and acknowledgment records',
    ],
    testProcedures: [
      'Review master privacy policy for comprehensiveness',
      'Verify supporting policies cover all required topics',
      'Confirm standards and procedures operationalize policy requirements',
      'Review policy update records for timeliness',
      'Sample acknowledgment records for policy communication',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-03',
    name: 'Privacy Training and Awareness Program',
    description:
      'Implement a comprehensive training and awareness program to ensure all personnel understand their data protection obligations and can recognize and respond to privacy risks and incidents.',
    category: 'Training & Awareness',
    implementationGuidance:
      'Develop role-based training curricula addressing general privacy awareness for all staff and specialized training for roles with significant privacy responsibilities. Implement mandatory privacy training during onboarding and periodic refresher training. Use varied training methods including e-learning, workshops, and scenario-based exercises. Track training completion and test comprehension. Conduct regular awareness campaigns on specific privacy topics and emerging risks.',
    evidenceRequirements: [
      'Training curricula and course materials',
      'Training completion records by role',
      'Comprehension assessment results',
      'Awareness campaign materials and distribution records',
      'Training effectiveness evaluation reports',
    ],
    testProcedures: [
      'Review training curricula for role-based relevance',
      'Verify training completion rates meet defined targets',
      'Assess comprehension test results for adequacy',
      'Review awareness campaign materials and reach',
      'Evaluate training effectiveness through assessments or surveys',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-04',
    name: 'Third-Party Privacy Risk Management',
    description:
      'Implement processes to assess, monitor, and manage privacy risks arising from third-party relationships including vendors, partners, and service providers who process personal data on behalf of or jointly with the organization.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Integrate privacy risk assessment into vendor onboarding and procurement processes. Develop standardized privacy assessment questionnaires or leverage industry-standard assessments. Risk-rate third parties based on the nature and volume of personal data they access or process. Require appropriate contractual protections including Data Processing Agreements. Implement ongoing monitoring of high-risk third parties through periodic assessments, certifications, or audits. Maintain a central inventory of third parties with data access.',
    evidenceRequirements: [
      'Third-party privacy risk assessment procedures',
      'Privacy assessment questionnaires and completed assessments',
      'Third-party risk ratings and classifications',
      'Data Processing Agreements with third parties',
      'Third-party inventory with data access details',
      'Ongoing monitoring records for high-risk third parties',
    ],
    testProcedures: [
      'Review third-party risk assessment procedures for adequacy',
      'Sample completed privacy assessments for thoroughness',
      'Verify risk ratings align with assessment findings',
      'Audit DPAs against Art. 28 requirements',
      'Review third-party inventory for completeness',
      'Inspect monitoring records for high-risk third parties',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-05',
    name: 'Privacy Incident Management',
    description:
      'Establish processes to detect, report, investigate, contain, and recover from privacy incidents, including those that may not rise to the level of notifiable breaches but require management attention.',
    category: 'Incident Management',
    implementationGuidance:
      'Define what constitutes a privacy incident and establish clear reporting channels for all personnel. Implement incident triage and categorization procedures to assess severity and determine response requirements. Develop incident response playbooks for common incident types. Conduct root cause analysis for significant incidents and implement preventive measures. Track and trend incidents to identify systemic issues. Distinguish between incidents requiring only internal management and those potentially triggering breach notification obligations.',
    evidenceRequirements: [
      'Privacy incident definition and reporting procedures',
      'Incident triage and categorization criteria',
      'Incident response playbooks',
      'Incident records with triage, investigation, and resolution details',
      'Root cause analysis reports and preventive action records',
      'Incident trending and analysis reports',
    ],
    testProcedures: [
      'Review incident reporting procedures for clarity and accessibility',
      'Test triage and categorization against sample scenarios',
      'Review incident response playbooks for completeness',
      'Inspect incident records for proper documentation',
      'Verify root cause analyses result in preventive actions',
      'Review trending reports for actionable insights',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-06',
    name: 'Data Subject Request Management System',
    description:
      'Implement a systematic approach to receiving, tracking, fulfilling, and documenting data subject rights requests ensuring consistent, timely, and compliant responses.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Implement a centralized system or process for receiving data subject requests through multiple channels. Develop standardized intake forms that capture all necessary information. Implement identity verification procedures appropriate to the request type. Create workflows that route requests to appropriate teams with defined SLAs. Track request status and escalate approaching deadlines. Maintain comprehensive records of all requests and responses. Analyze request volumes and types to identify process improvement opportunities.',
    evidenceRequirements: [
      'Request intake system or process documentation',
      'Standardized intake forms and identity verification procedures',
      'Request routing workflows and SLA documentation',
      'Request tracking system configuration and reports',
      'Comprehensive request and response records',
      'Request volume and type analysis reports',
    ],
    testProcedures: [
      'Test request intake through multiple channels',
      'Review intake forms for completeness of required information',
      'Verify identity verification procedures are followed',
      'Test routing workflows for correct assignment',
      'Review tracking reports for SLA compliance',
      'Inspect request records for completeness and accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-07',
    name: 'Consent Management Platform',
    description:
      'Implement technical solutions to collect, record, manage, and demonstrate valid consent for processing activities relying on consent as the lawful basis.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Deploy a consent management platform (CMP) integrated with all digital touchpoints where consent is collected. Configure the CMP to present clear, granular consent choices with no pre-selected options. Record consent timestamps, version of consent text presented, and method of consent. Implement mechanisms for data subjects to easily withdraw consent. Integrate consent records with downstream processing systems to ensure processing ceases when consent is withdrawn. Maintain consent records for the duration of the processing plus required retention periods.',
    evidenceRequirements: [
      'Consent management platform implementation documentation',
      'Consent interface designs showing granular choices',
      'Consent record database with required fields',
      'Consent withdrawal mechanism documentation',
      'Integration documentation with processing systems',
      'Consent record retention policy and evidence',
    ],
    testProcedures: [
      'Test consent collection interfaces for compliance requirements',
      'Verify consent records capture all required information',
      'Test consent withdrawal process end-to-end',
      'Verify processing systems respect withdrawn consent',
      'Review consent record retention for policy compliance',
      'Audit consent records for completeness and accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-08',
    name: 'Data Inventory and Classification',
    description:
      'Maintain a comprehensive inventory of personal data assets across the organization, classified by type, sensitivity, and applicable requirements to support privacy compliance activities.',
    category: 'Data Management',
    implementationGuidance:
      'Implement data discovery processes to identify personal data across structured and unstructured data stores. Create a data inventory capturing data elements, locations, systems, owners, and processing purposes. Classify personal data by sensitivity level distinguishing special categories and high-risk data. Map data flows showing how personal data moves through systems and to third parties. Integrate the data inventory with the Record of Processing Activities. Update the inventory regularly and when systems or processes change.',
    evidenceRequirements: [
      'Data discovery process documentation and results',
      'Data inventory with required attributes',
      'Data classification scheme and applied classifications',
      'Data flow maps and diagrams',
      'Integration with Record of Processing Activities',
      'Inventory update schedule and records',
    ],
    testProcedures: [
      'Review data discovery process for comprehensiveness',
      'Verify data inventory includes all required attributes',
      'Test classification accuracy against sample data sets',
      'Review data flow maps for completeness and accuracy',
      'Confirm inventory aligns with RoPA',
      'Verify inventory is updated according to schedule',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-09',
    name: 'Data Retention Implementation',
    description:
      'Implement technical and procedural controls to enforce data retention schedules, ensuring personal data is retained only as long as necessary and securely disposed of when retention periods expire.',
    category: 'Data Management',
    implementationGuidance:
      'Translate retention policy requirements into technical configurations where feasible (automated deletion, archival rules). Implement retention tagging or metadata to track retention periods for data sets. Develop secure deletion procedures including verification of deletion from backups. Establish exception handling for legal holds and other legitimate retention extensions. Conduct periodic retention compliance reviews comparing actual retention against policy. Document all deletion activities with appropriate audit trails.',
    evidenceRequirements: [
      'Technical retention enforcement configurations',
      'Retention tagging and metadata documentation',
      'Secure deletion procedures and verification methods',
      'Legal hold and exception procedures',
      'Retention compliance review reports',
      'Deletion activity audit trails',
    ],
    testProcedures: [
      'Test automated retention enforcement configurations',
      'Verify retention tagging is applied correctly',
      'Review secure deletion procedures and verification',
      'Confirm legal hold procedures are documented and followed',
      'Inspect retention compliance review findings',
      'Audit deletion records for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-10',
    name: 'Privacy Impact Screening',
    description:
      'Implement a screening process to identify projects, systems, and initiatives that may have privacy implications, enabling early engagement and appropriate privacy review.',
    category: 'Privacy by Design',
    implementationGuidance:
      'Integrate privacy screening into project intake, procurement, and change management processes. Develop screening questionnaires that identify personal data processing, new technologies, and potential high-risk activities. Define thresholds that trigger privacy review, DPIA requirements, or DPO consultation. Train project managers and business analysts on privacy screening completion. Track screening submissions and outcomes to ensure all relevant initiatives are captured.',
    evidenceRequirements: [
      'Privacy screening questionnaire and process documentation',
      'Integration points with project and change management',
      'Threshold definitions for escalation to privacy review',
      'Training records for relevant personnel',
      'Screening submission log and outcomes',
    ],
    testProcedures: [
      'Review screening questionnaire for comprehensiveness',
      'Verify integration into project and change processes',
      'Test threshold application against sample scenarios',
      'Confirm training records for relevant roles',
      'Review screening logs for coverage of initiatives',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-11',
    name: 'Privacy Review and Approval Process',
    description:
      'Establish a formal process for reviewing and approving privacy aspects of projects, systems, and processing activities before implementation to ensure compliance with GDPR requirements.',
    category: 'Privacy by Design',
    implementationGuidance:
      'Define privacy review stages aligned with project lifecycle milestones. Develop review checklists covering data minimization, lawful basis, data subject rights, security, retention, and transfer requirements. Establish clear approval authorities based on risk level and processing scope. Implement documentation requirements for privacy review findings and conditions. Define escalation paths for unresolved privacy issues. Track privacy review completion as a gate for project implementation.',
    evidenceRequirements: [
      'Privacy review process documentation',
      'Review checklists and assessment templates',
      'Approval authority matrix by risk level',
      'Privacy review records with findings and conditions',
      'Escalation path documentation',
      'Project gate compliance records',
    ],
    testProcedures: [
      'Review privacy review process documentation',
      'Inspect checklists for coverage of key requirements',
      'Verify approval authorities are defined and followed',
      'Sample privacy review records for completeness',
      'Confirm escalation paths are documented and used',
      'Verify privacy review is a documented project gate',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-12',
    name: 'Pseudonymization Implementation',
    description:
      'Implement pseudonymization techniques to reduce privacy risks while enabling processing for approved purposes, ensuring the additional information required for re-identification is kept separately and secured.',
    category: 'Technical Controls',
    implementationGuidance:
      'Identify processing activities where pseudonymization can reduce risk without impairing processing objectives. Select appropriate pseudonymization techniques based on the use case (tokenization, hashing, encryption). Implement technical controls to store the mapping or key information separately from the pseudonymized data. Apply access controls to limit re-identification capability to authorized purposes. Document pseudonymization implementations including techniques used, scope, and access controls. Regularly review pseudonymization implementations for continued effectiveness.',
    evidenceRequirements: [
      'Pseudonymization opportunity assessments',
      'Technique selection documentation with rationale',
      'Technical implementation documentation',
      'Separation of mapping/key information evidence',
      'Access control configuration for re-identification',
      'Periodic review records for pseudonymization implementations',
    ],
    testProcedures: [
      'Review pseudonymization assessments for comprehensiveness',
      'Verify technique selection is appropriate for use case',
      'Test separation of mapping information from pseudonymized data',
      'Review access controls for re-identification capability',
      'Inspect implementation documentation for completeness',
      'Verify periodic reviews are conducted and documented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-13',
    name: 'Anonymization Implementation',
    description:
      'Implement anonymization techniques to remove the personal data status from information that is no longer needed in identifiable form, enabling use for research, analytics, or other purposes without GDPR obligations.',
    category: 'Technical Controls',
    implementationGuidance:
      'Define criteria for when anonymization is appropriate versus pseudonymization. Select anonymization techniques that achieve irreversibility considering the state of the art and reasonably likely re-identification methods. Implement technical controls to apply anonymization consistently. Validate anonymization effectiveness through re-identification risk assessments. Document the anonymization process, techniques used, and validation results. Maintain anonymized data separately from identifiable data sets.',
    evidenceRequirements: [
      'Anonymization criteria and decision documentation',
      'Technique selection and implementation documentation',
      'Re-identification risk assessment methodology and results',
      'Validation records for anonymization effectiveness',
      'Process documentation for anonymization workflows',
      'Separation evidence for anonymized data storage',
    ],
    testProcedures: [
      'Review anonymization criteria for appropriateness',
      'Verify technique selection addresses re-identification risks',
      'Review re-identification risk assessments for rigor',
      'Test anonymized data sets for re-identification vulnerability',
      'Inspect process documentation for completeness',
      'Confirm anonymized data is stored separately',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-14',
    name: 'Privacy Enhancing Technologies Assessment',
    description:
      'Regularly assess and adopt privacy enhancing technologies (PETs) that can reduce privacy risks while enabling legitimate processing objectives.',
    category: 'Technical Controls',
    implementationGuidance:
      'Establish a process to monitor emerging privacy enhancing technologies and evaluate their applicability. Assess PETs including differential privacy, homomorphic encryption, secure multi-party computation, and data minimization technologies. Pilot promising technologies in controlled environments before broader deployment. Document technology assessments including capabilities, limitations, and implementation considerations. Integrate PET evaluation into privacy by design processes for new systems.',
    evidenceRequirements: [
      'PET monitoring and assessment process documentation',
      'Technology evaluation reports with recommendations',
      'Pilot implementation documentation and results',
      'Integration with privacy by design processes',
      'Adopted PET implementation records',
    ],
    testProcedures: [
      'Review PET monitoring process for currency',
      'Inspect technology evaluation reports for thoroughness',
      'Review pilot results and lessons learned',
      'Verify PET evaluation is integrated into design processes',
      'Confirm adopted PETs are properly implemented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-15',
    name: 'Cross-Border Processing Coordination',
    description:
      'Establish processes to manage GDPR compliance across multiple EU Member States including coordination with lead supervisory authorities and handling of cross-border processing activities.',
    category: 'International Compliance',
    implementationGuidance:
      'Identify the lead supervisory authority based on the location of the main establishment. Map all establishments and processing activities across Member States. Establish communication channels with relevant supervisory authorities. Develop procedures for handling cross-border complaints and investigations. Coordinate privacy policies and practices across Member State operations. Monitor Member State-specific requirements and derogations that may affect processing.',
    evidenceRequirements: [
      'Lead supervisory authority identification and documentation',
      'Cross-border establishment and processing mapping',
      'Supervisory authority communication records',
      'Cross-border complaint handling procedures',
      'Member State requirement monitoring records',
      'Coordination procedures for multi-jurisdiction compliance',
    ],
    testProcedures: [
      'Verify lead supervisory authority identification is correct',
      'Review cross-border processing mapping for completeness',
      'Inspect supervisory authority communication records',
      'Review complaint handling procedures for cross-border scenarios',
      'Confirm Member State requirements are monitored',
      'Test coordination procedures for effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-16',
    name: 'Transfer Impact Assessment Process',
    description:
      'Implement a systematic process to assess the laws and practices of destination countries for international data transfers and determine whether supplementary measures are required.',
    category: 'International Transfers',
    implementationGuidance:
      'Develop a Transfer Impact Assessment (TIA) methodology aligned with EDPB guidance. Assess the legal framework of each destination country including government access powers, rule of law, and data subject redress mechanisms. Evaluate whether SCCs or other safeguards can be complied with in practice. Document the assessment including sources reviewed, analysis, and conclusions. Identify and implement supplementary measures where necessary. Review TIAs when circumstances change or at regular intervals.',
    evidenceRequirements: [
      'TIA methodology documentation',
      'Completed TIAs for each destination country',
      'Legal framework analysis documentation',
      'Supplementary measures identification and implementation',
      'TIA review schedule and update records',
      'Source documentation for legal assessments',
    ],
    testProcedures: [
      'Review TIA methodology against EDPB guidance',
      'Inspect completed TIAs for thoroughness',
      'Verify legal framework analysis is comprehensive',
      'Confirm supplementary measures are implemented where required',
      'Review TIA update records for currency',
      'Validate sources used for legal assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-17',
    name: 'Supplementary Measures Implementation',
    description:
      'Implement technical, contractual, and organizational supplementary measures to address gaps identified in Transfer Impact Assessments where standard safeguards alone are insufficient.',
    category: 'International Transfers',
    implementationGuidance:
      'Based on TIA findings, identify appropriate supplementary measures from technical (encryption, pseudonymization, split processing), contractual (enhanced audit rights, data localization commitments), and organizational (policies, certifications, transparency reports) categories. Prioritize technical measures that prevent access by problematic third country authorities. Implement selected measures and document their application to specific transfers. Monitor measure effectiveness and adapt as circumstances change.',
    evidenceRequirements: [
      'Supplementary measure selection documentation per transfer',
      'Technical measure implementation evidence',
      'Contractual supplementary measure documentation',
      'Organizational measure documentation',
      'Measure effectiveness monitoring records',
      'Adaptation records when circumstances change',
    ],
    testProcedures: [
      'Review supplementary measure selection rationale',
      'Test technical supplementary measure implementation',
      'Verify contractual measures are executed and enforceable',
      'Confirm organizational measures are operational',
      'Review effectiveness monitoring records',
      'Verify measures are adapted when required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-18',
    name: 'Cloud Service Provider Privacy Compliance',
    description:
      'Ensure cloud service providers meet GDPR requirements through appropriate contractual arrangements, technical controls, and ongoing oversight.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Conduct privacy due diligence on cloud service providers including security certifications, data residency options, and sub-processor management. Execute appropriate Data Processing Agreements addressing all Art. 28 requirements. Assess international transfer implications for cloud services with non-EU infrastructure. Configure cloud services to minimize personal data collection and enforce data residency requirements where applicable. Monitor cloud provider compliance through certifications, audit reports, and contractual reporting.',
    evidenceRequirements: [
      'Cloud provider privacy due diligence assessments',
      'Data Processing Agreements with cloud providers',
      'International transfer assessments for cloud services',
      'Cloud configuration documentation for privacy controls',
      'Ongoing compliance monitoring records',
      'Sub-processor notification and management records',
    ],
    testProcedures: [
      'Review cloud provider due diligence for comprehensiveness',
      'Audit DPAs against Art. 28 requirements',
      'Verify international transfer assessments are current',
      'Test cloud configurations for privacy control enforcement',
      'Review compliance monitoring records and certifications',
      'Verify sub-processor management procedures are followed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-19',
    name: 'Marketing and Advertising Compliance',
    description:
      'Ensure marketing and advertising activities involving personal data comply with GDPR requirements including lawful basis, consent for electronic marketing, and profiling restrictions.',
    category: 'Marketing Compliance',
    implementationGuidance:
      'Document the lawful basis for all marketing data processing activities. Implement consent mechanisms for electronic direct marketing in compliance with ePrivacy Directive requirements. Ensure marketing preference management allows granular control and easy opt-out. Apply Art. 21 right to object mechanisms with immediate effect for direct marketing. Assess profiling activities for marketing against Art. 22 requirements. Review advertising technology and third-party data arrangements for GDPR compliance.',
    evidenceRequirements: [
      'Marketing lawful basis documentation',
      'Electronic marketing consent mechanisms and records',
      'Preference management system documentation',
      'Marketing opt-out implementation evidence',
      'Profiling assessments for marketing activities',
      'AdTech and third-party data compliance assessments',
    ],
    testProcedures: [
      'Review marketing lawful basis documentation for accuracy',
      'Test consent mechanisms for electronic marketing',
      'Verify preference management provides granular control',
      'Test marketing opt-out for immediate effectiveness',
      'Review profiling assessments for Art. 22 compliance',
      'Inspect AdTech compliance assessments for currency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-20',
    name: 'Cookie and Tracking Technology Compliance',
    description:
      'Ensure cookies, tracking pixels, device fingerprinting, and similar technologies comply with GDPR and ePrivacy Directive requirements including consent and transparency.',
    category: 'Marketing Compliance',
    implementationGuidance:
      'Inventory all cookies and tracking technologies deployed on digital properties. Classify technologies by purpose (strictly necessary, analytics, advertising, social media). Implement consent mechanisms that obtain valid consent before non-essential cookies are placed. Provide clear information about each technology in an accessible cookie policy. Ensure consent can be withdrawn as easily as it is given. Configure tag management systems to enforce consent choices. Regularly audit deployed technologies against declared inventories.',
    evidenceRequirements: [
      'Cookie and tracking technology inventory',
      'Technology classification documentation',
      'Consent mechanism implementation evidence',
      'Cookie policy documentation',
      'Consent withdrawal mechanism evidence',
      'Tag management configuration documentation',
      'Technology audit reports',
    ],
    testProcedures: [
      'Review technology inventory for completeness',
      'Verify classification is accurate for each technology',
      'Test consent mechanism for prior consent requirement',
      'Review cookie policy for clarity and completeness',
      'Test consent withdrawal functionality',
      'Verify tag management enforces consent choices',
      'Conduct technology audit comparing actual vs. declared',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-21',
    name: 'Employee Privacy Compliance',
    description:
      'Ensure processing of employee personal data complies with GDPR requirements, Member State employment law, and employee privacy expectations.',
    category: 'HR Privacy',
    implementationGuidance:
      'Document lawful bases for all employee data processing activities, recognizing that consent is rarely appropriate due to power imbalance. Implement appropriate security measures for sensitive employee data including health information. Provide comprehensive privacy notices to employees covering all processing activities. Establish procedures for employee data subject rights requests. Assess employee monitoring activities against GDPR and national law requirements. Implement data retention schedules for employee records considering employment law requirements.',
    evidenceRequirements: [
      'Employee data processing lawful basis documentation',
      'Security measures for sensitive employee data',
      'Employee privacy notice documentation',
      'Employee DSR handling procedures',
      'Employee monitoring assessments',
      'Employee data retention schedule',
    ],
    testProcedures: [
      'Review employee data lawful basis documentation',
      'Test security measures for sensitive employee data',
      'Verify employee privacy notice is provided and comprehensive',
      'Test employee DSR procedures for effectiveness',
      'Review employee monitoring assessments for compliance',
      'Verify employee data retention compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-22',
    name: 'Workplace Monitoring Compliance',
    description:
      'Ensure workplace monitoring activities including email monitoring, internet usage tracking, CCTV, and productivity monitoring comply with GDPR transparency, proportionality, and lawful basis requirements.',
    category: 'HR Privacy',
    implementationGuidance:
      'Inventory all workplace monitoring activities and technologies deployed. Conduct proportionality assessments for each monitoring activity balancing legitimate interests against employee privacy. Document the lawful basis for each monitoring activity with legitimate interests assessments where applicable. Provide clear notice to employees about monitoring scope, purposes, and consequences. Implement access controls limiting who can view monitoring data. Conduct DPIAs for intrusive monitoring activities. Consider works council or employee representative consultation where required.',
    evidenceRequirements: [
      'Workplace monitoring inventory',
      'Proportionality assessments for monitoring activities',
      'Lawful basis and legitimate interests documentation',
      'Employee notice documentation for monitoring',
      'Access controls for monitoring data',
      'DPIAs for intrusive monitoring',
      'Works council consultation records where applicable',
    ],
    testProcedures: [
      'Review monitoring inventory for completeness',
      'Assess proportionality assessments for rigor',
      'Verify lawful basis documentation for each activity',
      'Confirm employee notice is provided and comprehensive',
      'Test access controls for monitoring data',
      'Review DPIAs for intrusive monitoring activities',
      'Verify consultation where legally required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-23',
    name: 'Video Surveillance Compliance',
    description:
      'Ensure CCTV and video surveillance systems comply with GDPR requirements including lawful basis, transparency, proportionality, and data subject rights.',
    category: 'Physical Security',
    implementationGuidance:
      'Document the purposes and lawful basis for video surveillance in each location. Conduct legitimate interests assessments balancing security needs against privacy impacts. Display clear signage at entry points informing of surveillance. Limit camera placement and coverage to what is necessary for stated purposes. Implement access controls for viewing and exporting footage. Define retention periods proportionate to purposes and implement automated deletion. Establish procedures for handling access requests for CCTV footage.',
    evidenceRequirements: [
      'Video surveillance purpose and lawful basis documentation',
      'Legitimate interests assessments for surveillance',
      'Signage documentation and placement records',
      'Camera placement and coverage documentation',
      'Access control configuration for footage',
      'Retention periods and automated deletion configuration',
      'CCTV footage access request procedures',
    ],
    testProcedures: [
      'Review surveillance lawful basis documentation',
      'Assess legitimate interests assessments for balance',
      'Verify signage is displayed and informative',
      'Review camera placement against documented purposes',
      'Test access controls for footage viewing and export',
      'Verify retention and deletion compliance',
      'Test CCTV access request procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-24',
    name: 'Access Control for Personal Data',
    description:
      'Implement role-based access controls ensuring personal data is accessible only to authorized personnel with a legitimate need for access.',
    category: 'Technical Controls',
    implementationGuidance:
      'Implement role-based access control (RBAC) across systems containing personal data. Define access roles based on job functions with minimal necessary privileges. Require authorization approval before granting access to personal data systems. Implement separation of duties for sensitive processing activities. Conduct periodic access reviews to identify and remove unnecessary access. Log and monitor access to personal data systems. Implement privileged access management for administrative accounts.',
    evidenceRequirements: [
      'RBAC implementation documentation',
      'Role definitions with privilege justifications',
      'Access authorization approval records',
      'Separation of duties documentation',
      'Periodic access review records',
      'Access logging and monitoring configuration',
      'Privileged access management documentation',
    ],
    testProcedures: [
      'Review RBAC implementation for coverage',
      'Verify role definitions follow least privilege',
      'Sample access authorization approvals for compliance',
      'Test separation of duties enforcement',
      'Review periodic access review records',
      'Verify access logging is comprehensive',
      'Test privileged access management controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-25',
    name: 'Personal Data Encryption Standards',
    description:
      'Implement encryption standards for personal data at rest and in transit using industry-recognized algorithms and key management practices.',
    category: 'Technical Controls',
    implementationGuidance:
      'Define encryption standards specifying required algorithms, key lengths, and protocols for personal data protection. Implement encryption for personal data at rest in databases, file systems, and backup media. Implement encryption for data in transit using TLS/SSL for all connections involving personal data. Establish key management procedures including generation, storage, rotation, and destruction. Document encryption coverage across all systems processing personal data. Regularly review and update encryption standards as technology evolves.',
    evidenceRequirements: [
      'Encryption standards documentation',
      'Encryption implementation for data at rest',
      'Encryption implementation for data in transit',
      'Key management procedures documentation',
      'Encryption coverage documentation by system',
      'Encryption standards review records',
    ],
    testProcedures: [
      'Review encryption standards for currency and appropriateness',
      'Test encryption implementation for data at rest',
      'Test encryption for data in transit',
      'Review key management procedures and practices',
      'Verify encryption coverage across all personal data systems',
      'Confirm standards are reviewed and updated regularly',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-26',
    name: 'Security Monitoring and Logging',
    description:
      'Implement comprehensive security monitoring and logging for systems processing personal data to detect and investigate potential security incidents and unauthorized access.',
    category: 'Technical Controls',
    implementationGuidance:
      'Define logging requirements for systems processing personal data including access events, configuration changes, and security events. Implement centralized log collection and secure storage. Configure log retention periods consistent with legal and operational requirements. Deploy security monitoring and alerting for anomalous activities. Protect log integrity through secure storage and access controls. Establish procedures for log review and investigation. Ensure logging itself minimizes personal data collection while maintaining audit capability.',
    evidenceRequirements: [
      'Logging requirements documentation',
      'Centralized log collection configuration',
      'Log retention configuration and compliance',
      'Security monitoring and alerting configuration',
      'Log integrity protection evidence',
      'Log review procedures and records',
      'Privacy-aware logging configuration evidence',
    ],
    testProcedures: [
      'Review logging requirements for comprehensiveness',
      'Test centralized log collection functionality',
      'Verify log retention compliance',
      'Test security monitoring and alerting effectiveness',
      'Verify log integrity protections',
      'Review log review procedures and sample records',
      'Confirm logging minimizes personal data capture',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-27',
    name: 'Vulnerability Management for Personal Data Systems',
    description:
      'Implement vulnerability management processes to identify, assess, and remediate security vulnerabilities in systems processing personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Establish a vulnerability management program covering all systems processing personal data. Conduct regular vulnerability scans including network, application, and database scans. Prioritize vulnerabilities based on risk considering exploitability and sensitivity of data processed. Define remediation timelines based on vulnerability severity. Track vulnerabilities through remediation and verify fixes. Subscribe to vendor security advisories for all software processing personal data. Conduct periodic penetration testing of high-risk systems.',
    evidenceRequirements: [
      'Vulnerability management program documentation',
      'Vulnerability scan schedules and results',
      'Vulnerability prioritization methodology',
      'Remediation timeline standards',
      'Vulnerability tracking and remediation records',
      'Vendor advisory subscription evidence',
      'Penetration test reports',
    ],
    testProcedures: [
      'Review vulnerability management program comprehensiveness',
      'Verify scan frequency meets requirements',
      'Assess vulnerability prioritization appropriateness',
      'Review remediation timeline compliance',
      'Inspect vulnerability tracking for completeness',
      'Confirm vendor advisory coverage',
      'Review penetration test findings and remediation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-28',
    name: 'Business Continuity for Personal Data',
    description:
      'Ensure business continuity and disaster recovery plans address personal data availability requirements and protect data during continuity events.',
    category: 'Technical Controls',
    implementationGuidance:
      'Include personal data systems in business impact analysis and continuity planning. Define recovery time and recovery point objectives for personal data considering data subject impact. Implement backup procedures for personal data with encryption and secure storage. Test recovery procedures regularly including restoration of personal data. Ensure continuity sites and backup systems meet equivalent security standards. Address privacy requirements during continuity events including breach notification if relevant. Review plans after significant changes to personal data processing.',
    evidenceRequirements: [
      'Business continuity plans including personal data systems',
      'RTO/RPO documentation for personal data',
      'Backup procedures and encryption evidence',
      'Recovery test plans and results',
      'Continuity site security assessment',
      'Privacy considerations in continuity procedures',
      'Plan review records after processing changes',
    ],
    testProcedures: [
      'Review business continuity plans for personal data coverage',
      'Verify RTO/RPO are appropriate for data subject impact',
      'Test backup procedures and encryption',
      'Review recovery test results for effectiveness',
      'Verify continuity site security standards',
      'Confirm privacy considerations are addressed',
      'Review plan update records for currency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-29',
    name: 'Secure Development Lifecycle',
    description:
      'Integrate privacy and security requirements into the software development lifecycle ensuring applications handling personal data are designed and built securely.',
    category: 'Privacy by Design',
    implementationGuidance:
      'Establish secure development standards addressing privacy and security requirements. Integrate privacy requirements gathering into application design phases. Implement secure coding practices training for developers. Conduct code reviews with privacy and security focus. Implement automated security testing in CI/CD pipelines. Conduct pre-deployment security assessments for applications handling personal data. Maintain secure development documentation and guidelines. Include privacy acceptance criteria in user story and feature definitions.',
    evidenceRequirements: [
      'Secure development lifecycle documentation',
      'Privacy requirements gathering procedures',
      'Developer training records on secure coding',
      'Code review procedures and records',
      'Automated security testing configuration',
      'Pre-deployment security assessment records',
      'Privacy acceptance criteria examples',
    ],
    testProcedures: [
      'Review SDLC documentation for privacy integration',
      'Verify privacy requirements are captured in design',
      'Confirm developer training completion',
      'Sample code review records for privacy focus',
      'Test automated security testing effectiveness',
      'Review pre-deployment assessment records',
      'Verify privacy acceptance criteria are defined',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-30',
    name: 'Test Data Management',
    description:
      'Implement controls to ensure personal data used in testing and development environments is appropriately protected through anonymization, pseudonymization, or synthetic data generation.',
    category: 'Privacy by Design',
    implementationGuidance:
      'Establish a policy prohibiting or restricting use of production personal data in non-production environments. Implement data masking or anonymization procedures for test data creation. Evaluate and deploy synthetic data generation tools for testing purposes. Where production data must be used, implement equivalent security controls in test environments. Restrict access to test environments containing real personal data. Include test data requirements in privacy by design reviews. Regularly audit test environments for unauthorized personal data.',
    evidenceRequirements: [
      'Test data management policy',
      'Data masking and anonymization procedures',
      'Synthetic data generation tool documentation',
      'Test environment security controls where real data used',
      'Test environment access restrictions',
      'Test data requirements in privacy reviews',
      'Test environment audit records',
    ],
    testProcedures: [
      'Review test data management policy for comprehensiveness',
      'Test data masking and anonymization procedures',
      'Evaluate synthetic data generation effectiveness',
      'Verify security controls in test environments with real data',
      'Test access restrictions for test environments',
      'Confirm privacy reviews include test data requirements',
      'Review test environment audit findings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-31',
    name: 'Mobile Application Privacy',
    description:
      'Ensure mobile applications collecting or processing personal data comply with GDPR requirements including transparency, consent, data minimization, and security.',
    category: 'Application Privacy',
    implementationGuidance:
      'Conduct privacy assessments for all mobile applications before release. Implement privacy notices accessible within the app and app store listings. Request only necessary device permissions with clear explanations. Implement consent mechanisms for analytics and marketing SDKs. Ensure data transmitted from mobile apps is encrypted. Implement secure local storage for personal data on devices. Provide privacy controls within the app for data subject rights. Review third-party SDKs for privacy compliance and appropriate DPAs.',
    evidenceRequirements: [
      'Mobile app privacy assessments',
      'In-app and app store privacy notice evidence',
      'Permission request justification documentation',
      'SDK consent mechanism implementation',
      'Data encryption in transit evidence',
      'Secure local storage implementation',
      'In-app privacy controls documentation',
      'Third-party SDK compliance assessments',
    ],
    testProcedures: [
      'Review mobile app privacy assessments',
      'Verify privacy notices are accessible and complete',
      'Test permission requests for necessity and explanation',
      'Test SDK consent mechanisms for validity',
      'Verify encryption for data in transit',
      'Test secure local storage implementation',
      'Test in-app privacy controls functionality',
      'Review SDK compliance assessments and DPAs',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-32',
    name: 'Website Privacy Compliance',
    description:
      'Ensure websites collecting personal data comply with GDPR requirements including privacy notices, consent mechanisms, secure transmission, and data subject rights facilitation.',
    category: 'Application Privacy',
    implementationGuidance:
      'Publish comprehensive privacy notices accessible from all pages. Implement layered privacy notices with summaries and detailed information. Deploy cookie consent mechanisms compliant with ePrivacy and GDPR requirements. Implement HTTPS across all pages collecting personal data. Provide clear and accessible methods for exercising data subject rights. Implement form validation to minimize unnecessary data collection. Review and assess all third-party scripts and integrations for privacy compliance.',
    evidenceRequirements: [
      'Website privacy notice documentation',
      'Layered notice implementation evidence',
      'Cookie consent mechanism documentation',
      'HTTPS implementation verification',
      'Data subject rights exercise methods',
      'Form design and validation documentation',
      'Third-party script and integration assessments',
    ],
    testProcedures: [
      'Review privacy notice for comprehensiveness and accessibility',
      'Test layered notice navigation and clarity',
      'Test cookie consent mechanism compliance',
      'Verify HTTPS implementation across data collection pages',
      'Test data subject rights exercise methods',
      'Review form fields against data minimization requirements',
      'Audit third-party scripts for privacy compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-33',
    name: 'AI and Machine Learning Privacy Compliance',
    description:
      'Ensure artificial intelligence and machine learning systems processing personal data comply with GDPR requirements including lawful basis, transparency, fairness, and automated decision-making provisions.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Conduct privacy impact assessments for AI/ML systems processing personal data. Document the lawful basis for training data collection and model inference. Implement measures to detect and mitigate bias in ML models affecting individuals. Provide meaningful information about ML logic and impact in privacy notices. Assess AI systems against Art. 22 automated decision-making requirements. Implement human oversight for high-impact AI decisions. Establish procedures for data subjects to contest AI-driven decisions.',
    evidenceRequirements: [
      'AI/ML privacy impact assessments',
      'Lawful basis documentation for training and inference',
      'Bias detection and mitigation documentation',
      'Privacy notice sections explaining AI/ML processing',
      'Art. 22 assessments for AI decision-making',
      'Human oversight implementation evidence',
      'Decision contestation procedures',
    ],
    testProcedures: [
      'Review AI/ML privacy impact assessments',
      'Verify lawful basis documentation for data usage',
      'Assess bias detection and mitigation measures',
      'Review privacy notices for AI/ML transparency',
      'Verify Art. 22 assessments where applicable',
      'Test human oversight mechanisms',
      'Test decision contestation procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-34',
    name: 'IoT Device Privacy Compliance',
    description:
      'Ensure Internet of Things devices collecting personal data comply with GDPR requirements including transparency, consent, security, and data minimization.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Conduct privacy assessments for IoT devices before deployment. Implement privacy notices accessible through device interfaces or companion apps. Collect only data necessary for device functionality. Implement encryption for data transmission and storage. Provide mechanisms for data subjects to access and delete device data. Implement secure update mechanisms to address vulnerabilities. Apply privacy by design principles to device and data architecture. Assess third-party data sharing by IoT platforms.',
    evidenceRequirements: [
      'IoT device privacy assessments',
      'Privacy notice delivery mechanism documentation',
      'Data minimization implementation evidence',
      'Encryption configuration for IoT devices',
      'Data access and deletion mechanism documentation',
      'Secure update mechanism implementation',
      'Privacy by design documentation for IoT',
      'Third-party data sharing assessments',
    ],
    testProcedures: [
      'Review IoT device privacy assessments',
      'Test privacy notice accessibility',
      'Verify data collection minimization',
      'Test encryption implementation',
      'Test data access and deletion mechanisms',
      'Verify secure update functionality',
      'Review privacy by design implementation',
      'Assess third-party data sharing practices',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-35',
    name: 'Biometric Data Processing',
    description:
      'Ensure biometric data processing for identification purposes complies with GDPR special category requirements including explicit consent or other Art. 9(2) exceptions and enhanced security measures.',
    category: 'Special Categories Processing',
    implementationGuidance:
      'Inventory all biometric data processing activities including facial recognition, fingerprint scanning, and voice recognition. Document the Art. 9(2) exception relied upon for each processing activity. Where explicit consent is the basis, implement robust consent mechanisms with clear information about biometric processing. Apply enhanced security measures including encryption, access restrictions, and secure storage. Conduct DPIAs for biometric processing activities. Implement strict data minimization and retention limits. Provide alternative non-biometric options where feasible.',
    evidenceRequirements: [
      'Biometric data processing inventory',
      'Art. 9(2) exception documentation for each activity',
      'Explicit consent mechanisms and records where applicable',
      'Enhanced security measures documentation',
      'DPIAs for biometric processing',
      'Data minimization and retention implementation',
      'Alternative option documentation where applicable',
    ],
    testProcedures: [
      'Review biometric processing inventory for completeness',
      'Verify Art. 9(2) exceptions are valid and documented',
      'Test consent mechanisms for explicit consent requirements',
      'Test enhanced security measures',
      'Review DPIAs for biometric processing',
      'Verify data minimization and retention compliance',
      'Confirm alternative options are available where applicable',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-36',
    name: 'Health Data Processing',
    description:
      'Ensure processing of health data complies with GDPR special category requirements and applicable Member State health data protection laws.',
    category: 'Special Categories Processing',
    implementationGuidance:
      'Inventory all health data processing activities across the organization. Document the Art. 9(2) exception for each processing activity, commonly Art. 9(2)(h) for healthcare provision. Implement enhanced security measures appropriate for health data sensitivity. Ensure compliance with Member State-specific health data requirements. Apply strict access controls limiting health data access to authorized personnel. Conduct DPIAs for health data processing activities. Implement audit trails for all health data access. Coordinate with healthcare compliance programs where applicable.',
    evidenceRequirements: [
      'Health data processing inventory',
      'Art. 9(2) exception documentation',
      'Enhanced security measures for health data',
      'Member State compliance assessment',
      'Access control configuration for health data',
      'DPIAs for health data processing',
      'Health data access audit trail configuration',
      'Healthcare compliance coordination records',
    ],
    testProcedures: [
      'Review health data processing inventory',
      'Verify Art. 9(2) exceptions are documented and valid',
      'Test enhanced security measures for health data',
      'Verify Member State requirements are addressed',
      'Test access controls for health data systems',
      'Review DPIAs for health data processing',
      'Verify audit trail completeness',
      'Confirm healthcare compliance coordination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-37',
    name: 'Research Data Processing',
    description:
      'Ensure processing of personal data for scientific research, historical research, or statistical purposes complies with GDPR requirements and benefits from appropriate safeguards and exemptions.',
    category: 'Research & Statistics',
    implementationGuidance:
      'Document the purpose limitation exemption under Art. 5(1)(b) for research processing. Implement appropriate safeguards per Art. 89(1) including pseudonymization and technical measures. Assess applicability of Member State exemptions for data subject rights. Establish ethics review processes for research involving personal data. Implement data access agreements for research data sharing. Apply enhanced security for sensitive research data. Document research necessity assessments demonstrating why identified data is required.',
    evidenceRequirements: [
      'Research processing purpose documentation',
      'Art. 89(1) safeguard implementation evidence',
      'Member State exemption assessments',
      'Ethics review process and records',
      'Research data access agreements',
      'Enhanced security for research data',
      'Research necessity assessment documentation',
    ],
    testProcedures: [
      'Review research purpose documentation',
      'Test Art. 89(1) safeguard implementation',
      'Verify Member State exemption applicability assessments',
      'Review ethics review process and completed reviews',
      'Inspect data access agreements for compliance',
      'Test enhanced security measures',
      'Review necessity assessments for identified data use',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-38',
    name: 'Direct Marketing Compliance',
    description:
      'Ensure direct marketing activities comply with GDPR lawful basis requirements, ePrivacy Directive rules, and respect data subject opt-out rights.',
    category: 'Marketing Compliance',
    implementationGuidance:
      'Document the lawful basis for direct marketing processing (typically legitimate interests or consent). Implement compliant opt-in mechanisms for electronic marketing per ePrivacy requirements. Provide clear and simple opt-out mechanisms in all marketing communications. Process opt-outs immediately and maintain suppression lists. Apply the absolute right to object to direct marketing under Art. 21. Segment marketing databases to respect different consent and preference levels. Assess purchased marketing lists for GDPR compliance before use.',
    evidenceRequirements: [
      'Direct marketing lawful basis documentation',
      'Electronic marketing opt-in mechanism evidence',
      'Opt-out mechanism documentation in communications',
      'Suppression list management procedures',
      'Art. 21 objection implementation evidence',
      'Marketing database segmentation documentation',
      'Purchased list compliance assessments',
    ],
    testProcedures: [
      'Review direct marketing lawful basis documentation',
      'Test electronic marketing opt-in mechanisms',
      'Verify opt-out mechanisms in marketing communications',
      'Test suppression list processing effectiveness',
      'Test Art. 21 objection implementation',
      'Review database segmentation for preference compliance',
      'Verify purchased list assessments are conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-39',
    name: 'Profiling Governance',
    description:
      'Implement governance over profiling activities to ensure compliance with GDPR transparency, fairness, and automated decision-making requirements.',
    category: 'Profiling & Automated Decisions',
    implementationGuidance:
      'Inventory all profiling activities including the data sources, logic, and outputs. Assess each profiling activity against Art. 22 automated decision-making requirements. Document and communicate the logic, significance, and consequences of profiling in privacy notices. Implement fairness reviews to identify and mitigate discriminatory profiling outcomes. Provide opt-out mechanisms for profiling used for direct marketing. Conduct DPIAs for high-risk profiling activities. Maintain human oversight for profiling affecting significant individual interests.',
    evidenceRequirements: [
      'Profiling activity inventory with data sources and logic',
      'Art. 22 assessments for profiling activities',
      'Privacy notice sections on profiling',
      'Fairness review documentation',
      'Profiling opt-out mechanism for marketing',
      'DPIAs for high-risk profiling',
      'Human oversight procedures for significant profiling',
    ],
    testProcedures: [
      'Review profiling inventory for completeness',
      'Verify Art. 22 assessments are conducted',
      'Review privacy notices for profiling transparency',
      'Assess fairness review findings and mitigations',
      'Test profiling opt-out for marketing',
      'Review DPIAs for high-risk profiling',
      'Test human oversight procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-40',
    name: 'Legitimate Interests Assessment Process',
    description:
      'Implement a systematic process for conducting and documenting legitimate interests assessments when relying on Art. 6(1)(f) as the lawful basis for processing.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Develop a standardized LIA template covering purpose test, necessity test, and balancing test. Require LIAs before any new processing relying on legitimate interests commences. Assess whether the legitimate interest is genuine and lawful. Evaluate necessity by considering whether the purpose can be achieved through less privacy-intrusive means. Balance the legitimate interests against data subject rights considering the nature of data, reasonable expectations, relationship with data subjects, and potential impact. Document the assessment outcome and any mitigating measures applied. Review LIAs when circumstances change.',
    evidenceRequirements: [
      'LIA template and methodology documentation',
      'Completed LIAs for legitimate interests processing',
      'Purpose test assessments',
      'Necessity test assessments',
      'Balancing test documentation',
      'Mitigating measures implementation evidence',
      'LIA review and update records',
    ],
    testProcedures: [
      'Review LIA template for comprehensive coverage',
      'Sample completed LIAs for thoroughness',
      'Verify purpose tests identify genuine interests',
      'Assess necessity tests for rigor',
      'Review balancing tests for appropriate consideration',
      'Confirm mitigating measures are implemented',
      'Verify LIAs are reviewed when required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-41',
    name: 'Contract Necessity Assessment',
    description:
      'Implement processes to assess and document when processing is genuinely necessary for contract performance under Art. 6(1)(b).',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Document the contractual relationship and specific processing activities claimed under contract necessity. Assess each processing activity to determine if it is objectively necessary for contract performance (not merely useful or convenient). Distinguish between processing necessary for the contract and processing the controller wishes to perform for other purposes. Avoid relying on contract necessity for processing that primarily serves controller interests. Review contract necessity assessments when contracts or processing change. Provide alternative lawful bases for processing not genuinely necessary for contracts.',
    evidenceRequirements: [
      'Contract necessity assessment documentation',
      'Contractual relationship documentation',
      'Objective necessity analysis for each processing activity',
      'Distinction documentation for controller-interest processing',
      'Alternative lawful basis documentation where applicable',
      'Assessment review records when contracts change',
    ],
    testProcedures: [
      'Review contract necessity assessments for thoroughness',
      'Verify contractual relationships are documented',
      'Assess objective necessity analysis rigor',
      'Verify controller-interest processing has alternative basis',
      'Confirm assessments are reviewed when contracts change',
      'Test processing activities against stated contractual necessity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-42',
    name: 'Privacy Metrics and Reporting',
    description:
      'Implement privacy program metrics and reporting to measure compliance effectiveness, track program maturity, and support continuous improvement.',
    category: 'Governance',
    implementationGuidance:
      'Define key privacy metrics covering compliance indicators, program activities, and risk measures. Implement data collection processes for metric tracking. Establish dashboards for ongoing visibility into privacy program status. Provide regular metric reports to governance bodies and senior management. Benchmark metrics against industry standards or regulatory expectations where available. Use metrics to identify improvement opportunities and prioritize resources. Track metric trends over time to demonstrate program maturation.',
    evidenceRequirements: [
      'Privacy metric definitions and collection methodology',
      'Metric tracking data and reports',
      'Privacy dashboards for ongoing visibility',
      'Management and governance metric reports',
      'Benchmarking analysis where applicable',
      'Improvement initiative tracking linked to metrics',
      'Trend analysis documentation',
    ],
    testProcedures: [
      'Review metric definitions for relevance and measurability',
      'Verify data collection processes produce accurate metrics',
      'Inspect dashboards for currency and usefulness',
      'Review management reports for completeness',
      'Assess benchmarking methodology if used',
      'Verify improvement initiatives address metric findings',
      'Review trend analysis for insights and actions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-43',
    name: 'Privacy Audit Program',
    description:
      'Implement an internal privacy audit program to independently assess compliance with GDPR requirements and the effectiveness of privacy controls.',
    category: 'Governance',
    implementationGuidance:
      'Establish a risk-based privacy audit program covering all processing activities over a defined cycle. Develop audit procedures aligned with GDPR requirements and internal policies. Ensure auditors have appropriate independence from the activities being audited. Conduct audits according to the defined schedule and document findings. Implement a corrective action tracking process for audit findings. Report audit results to governance bodies and senior management. Coordinate privacy audits with other assurance activities to maximize coverage and efficiency.',
    evidenceRequirements: [
      'Privacy audit program charter and risk-based plan',
      'Audit procedures and checklists',
      'Auditor independence documentation',
      'Completed audit reports with findings',
      'Corrective action tracking records',
      'Governance and management audit reports',
      'Coordination records with other assurance activities',
    ],
    testProcedures: [
      'Review audit program for risk-based coverage',
      'Verify audit procedures address GDPR requirements',
      'Confirm auditor independence is maintained',
      'Sample completed audit reports for quality',
      'Review corrective action tracking for timeliness',
      'Verify governance receives audit reporting',
      'Assess coordination with other assurance activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-44',
    name: 'Regulatory Engagement Management',
    description:
      'Establish processes to manage engagement with data protection supervisory authorities including responding to inquiries, cooperating with investigations, and monitoring regulatory developments.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Designate responsible personnel for supervisory authority communications. Establish procedures for responding to supervisory authority inquiries and information requests within required timeframes. Develop investigation response procedures including evidence preservation and document production. Monitor supervisory authority guidance, decisions, and enforcement actions for compliance implications. Maintain positive working relationships with relevant supervisory authorities. Track all supervisory authority interactions and outcomes.',
    evidenceRequirements: [
      'Supervisory authority communication responsibility assignments',
      'Inquiry response procedures and timelines',
      'Investigation response procedures',
      'Regulatory monitoring process and outputs',
      'Supervisory authority interaction tracking records',
      'Guidance and decision impact assessments',
    ],
    testProcedures: [
      'Verify communication responsibilities are assigned',
      'Review inquiry response procedures for timeliness',
      'Assess investigation response procedures for adequacy',
      'Verify regulatory monitoring is current',
      'Inspect interaction tracking records for completeness',
      'Review impact assessments for relevant guidance and decisions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-45',
    name: 'Data Subject Complaint Management',
    description:
      'Implement processes to receive, investigate, and resolve data subject complaints regarding personal data processing, maintaining records and escalating appropriately.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Establish accessible channels for data subjects to submit complaints. Implement complaint triage and categorization procedures. Assign complaint investigators with appropriate authority and independence. Define investigation procedures including evidence gathering and data subject communication. Establish resolution and escalation procedures including remediation where complaints are substantiated. Maintain complaint records including outcome and remediation actions. Analyze complaint patterns to identify systemic issues requiring corrective action.',
    evidenceRequirements: [
      'Complaint submission channel documentation',
      'Complaint triage and categorization procedures',
      'Investigator assignment and authority documentation',
      'Investigation procedures documentation',
      'Resolution and escalation procedures',
      'Complaint records with outcomes and remediation',
      'Complaint pattern analysis reports',
    ],
    testProcedures: [
      'Test complaint submission channel accessibility',
      'Review triage and categorization procedures',
      'Verify investigator assignments and authority',
      'Review investigation procedures for thoroughness',
      'Test resolution and escalation processes',
      'Sample complaint records for completeness',
      'Review pattern analysis for actionable insights',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-46',
    name: 'Privacy Notice Management',
    description:
      'Implement processes to create, maintain, and deploy privacy notices ensuring they remain accurate, compliant, and accessible to data subjects.',
    category: 'Transparency',
    implementationGuidance:
      'Establish a privacy notice ownership and management process. Create templates aligned with Art. 13 and Art. 14 requirements. Implement version control and approval workflows for notice changes. Deploy notices at appropriate collection points and maintain central accessibility. Monitor processing activities for changes requiring notice updates. Conduct periodic notice reviews for accuracy and regulatory compliance. Implement multi-language notices where required for the data subject population.',
    evidenceRequirements: [
      'Privacy notice management process documentation',
      'Notice templates with Art. 13/14 mapping',
      'Version control and approval records',
      'Notice deployment documentation',
      'Processing change monitoring procedures',
      'Periodic review records and updates',
      'Multi-language notice evidence where applicable',
    ],
    testProcedures: [
      'Review notice management process for comprehensiveness',
      'Verify templates cover all required information',
      'Inspect version control and approval records',
      'Test notice accessibility at collection points',
      'Verify processing changes trigger notice review',
      'Review periodic review records for timeliness',
      'Test multi-language notices where required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-47',
    name: 'Lawful Basis Documentation and Review',
    description:
      'Maintain comprehensive documentation of the lawful basis for all processing activities and implement periodic reviews to ensure continued validity.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Document the selected lawful basis for each processing activity in the Record of Processing Activities. Maintain supporting documentation including consent records, legitimate interests assessments, and legal obligation references. Implement triggers for lawful basis review when processing activities, purposes, or circumstances change. Conduct periodic reviews of lawful bases to confirm continued applicability. Update privacy notices when lawful bases change. Train process owners on lawful basis requirements and their documentation responsibilities.',
    evidenceRequirements: [
      'Lawful basis documentation in RoPA',
      'Supporting documentation (consent, LIA, legal references)',
      'Review trigger procedures and documentation',
      'Periodic review schedule and completed reviews',
      'Privacy notice update records following changes',
      'Process owner training records',
    ],
    testProcedures: [
      'Verify lawful basis documented for all processing activities',
      'Sample supporting documentation for completeness',
      'Test review triggers for effectiveness',
      'Confirm periodic reviews are conducted',
      'Verify privacy notices reflect current lawful bases',
      'Review process owner training completion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-48',
    name: 'Sub-Processor Management',
    description:
      'Implement controls to manage sub-processors engaged by processors, ensuring appropriate authorization, contractual protections, and ongoing oversight.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Include sub-processor authorization provisions in Data Processing Agreements requiring prior specific or general authorization. Where general authorization is used, implement procedures for notification and objection to sub-processor changes. Require processors to flow down equivalent data protection obligations to sub-processors. Maintain a sub-processor register with current information. Assess sub-processors for adequate data protection measures. Monitor processor compliance with sub-processor management obligations.',
    evidenceRequirements: [
      'DPA sub-processor authorization clauses',
      'Sub-processor change notification and objection procedures',
      'Flow-down requirement documentation',
      'Sub-processor register',
      'Sub-processor assessment records',
      'Processor compliance monitoring records',
    ],
    testProcedures: [
      'Review DPA authorization clauses for compliance',
      'Test change notification and objection procedures',
      'Verify flow-down requirements in sub-processor contracts',
      'Review sub-processor register for currency',
      'Sample sub-processor assessments for adequacy',
      'Verify processor compliance monitoring is conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-49',
    name: 'Data Processing Agreement Audit Program',
    description:
      'Implement processes to exercise audit rights in Data Processing Agreements to verify processor compliance with GDPR requirements and contractual obligations.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Establish a risk-based program for exercising DPA audit rights. Define audit scope covering Art. 28(3) obligations and specific contractual commitments. Accept processor certifications, audit reports (SOC 2, ISO 27001), or third-party audits where appropriate to reduce audit burden. Conduct direct audits for high-risk processors or where independent assurance is insufficient. Document audit findings and require corrective actions for identified issues. Track corrective action implementation to closure.',
    evidenceRequirements: [
      'DPA audit program documentation',
      'Risk-based audit prioritization',
      'Audit scope and procedures',
      'Certification and report acceptance criteria',
      'Direct audit reports where conducted',
      'Corrective action tracking records',
    ],
    testProcedures: [
      'Review audit program for risk-based approach',
      'Verify audit prioritization methodology',
      'Inspect audit procedures for comprehensiveness',
      'Review acceptance criteria for third-party assurance',
      'Sample direct audit reports for quality',
      'Verify corrective actions are tracked to closure',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-50',
    name: 'Breach Register Maintenance',
    description:
      'Maintain a comprehensive register of all personal data breaches regardless of whether they trigger notification requirements, supporting accountability and pattern analysis.',
    category: 'Incident Management',
    implementationGuidance:
      'Establish a breach register capturing all personal data breaches per Art. 33(5) requirements. Record the facts relating to each breach, its effects, and remedial action taken. Include breach assessment documentation recording the decision on supervisory authority and data subject notification. Retain breach records for a defined period supporting accountability and demonstrating compliance. Analyze breach patterns to identify systemic vulnerabilities. Report breach metrics to governance bodies.',
    evidenceRequirements: [
      'Breach register with required fields',
      'Breach facts and effects documentation',
      'Remedial action records',
      'Notification decision documentation',
      'Retention policy and compliance for breach records',
      'Pattern analysis reports',
      'Governance breach metric reports',
    ],
    testProcedures: [
      'Review breach register for required field completeness',
      'Sample breach records for documentation quality',
      'Verify remedial actions are documented',
      'Review notification decision rationale documentation',
      'Confirm breach record retention compliance',
      'Review pattern analysis for insights',
      'Verify governance receives breach metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-51',
    name: 'Supervisory Authority Notification Process',
    description:
      'Implement operational processes to execute supervisory authority breach notifications within the 72-hour requirement when notification thresholds are met.',
    category: 'Incident Management',
    implementationGuidance:
      'Develop pre-drafted notification templates aligned with Art. 33(3) requirements. Maintain current contact information for relevant supervisory authorities. Establish escalation and approval workflows that can be executed within 72 hours. Implement timeline tracking from breach awareness to notification submission. Document the notification process including approvals and submission confirmation. Prepare procedures for phased notifications when full information is not immediately available.',
    evidenceRequirements: [
      'Notification templates with Art. 33(3) content',
      'Supervisory authority contact directory',
      'Escalation and approval workflow documentation',
      'Timeline tracking mechanism',
      'Notification submission records',
      'Phased notification procedures',
    ],
    testProcedures: [
      'Review notification templates for completeness',
      'Verify contact directory is current',
      'Walk through escalation workflow for 72-hour feasibility',
      'Test timeline tracking mechanism',
      'Review submission records for past notifications',
      'Verify phased notification procedures are documented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-52',
    name: 'Data Subject Breach Notification Process',
    description:
      'Implement operational processes to notify data subjects when breaches meet the high-risk threshold requiring communication.',
    category: 'Incident Management',
    implementationGuidance:
      'Define high-risk threshold criteria aligned with regulatory guidance. Develop data subject notification templates in clear, plain language with Art. 34(2) required information. Establish communication channels for reaching affected data subjects (email, postal mail, public communication). Implement processes to identify affected data subjects and their contact information. Define escalation procedures when data subject notification is required. Document notification decisions and delivery confirmation.',
    evidenceRequirements: [
      'High-risk threshold criteria documentation',
      'Data subject notification templates',
      'Communication channel procedures',
      'Affected data subject identification procedures',
      'Escalation procedures for notification decisions',
      'Notification delivery confirmation records',
    ],
    testProcedures: [
      'Review high-risk criteria for regulatory alignment',
      'Inspect notification templates for clarity and completeness',
      'Test communication channel effectiveness',
      'Verify data subject identification procedures',
      'Test escalation procedures for timeliness',
      'Review delivery confirmation records for past notifications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-53',
    name: 'Privacy Program Continuous Improvement',
    description:
      'Implement processes for continuous improvement of the privacy program based on lessons learned, regulatory developments, and evolving best practices.',
    category: 'Governance',
    implementationGuidance:
      'Establish processes to capture lessons learned from incidents, audits, and regulatory interactions. Monitor regulatory developments, guidance updates, and enforcement trends for compliance implications. Track industry best practices and privacy technology evolution. Maintain a privacy improvement roadmap with prioritized initiatives. Allocate resources for improvement implementation. Measure and report improvement progress to governance bodies.',
    evidenceRequirements: [
      'Lessons learned capture process and records',
      'Regulatory monitoring process and outputs',
      'Industry best practice tracking',
      'Privacy improvement roadmap',
      'Resource allocation for improvements',
      'Improvement progress reports to governance',
    ],
    testProcedures: [
      'Review lessons learned process and sample records',
      'Verify regulatory monitoring is current and comprehensive',
      'Assess best practice tracking relevance',
      'Review improvement roadmap for prioritization',
      'Verify resources are allocated for improvements',
      'Review governance progress reports',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-54',
    name: 'Privacy Program Maturity Assessment',
    description:
      'Conduct periodic assessments of privacy program maturity to benchmark current state, identify gaps, and guide strategic improvement investments.',
    category: 'Governance',
    implementationGuidance:
      'Adopt or develop a privacy program maturity model with defined levels and domains. Conduct baseline maturity assessments across all privacy program domains. Identify target maturity levels based on risk profile and organizational objectives. Develop roadmaps to achieve target maturity levels. Conduct periodic reassessments to track progress and adjust plans. Report maturity status and trends to senior management and governance bodies. Use maturity assessments to prioritize resource allocation.',
    evidenceRequirements: [
      'Privacy maturity model documentation',
      'Baseline maturity assessment results',
      'Target maturity level definitions',
      'Maturity improvement roadmaps',
      'Periodic reassessment results',
      'Management maturity reports',
      'Resource prioritization based on maturity',
    ],
    testProcedures: [
      'Review maturity model for comprehensiveness',
      'Verify baseline assessment methodology and results',
      'Assess target level appropriateness for risk profile',
      'Review roadmaps for actionability',
      'Compare reassessment results to baselines',
      'Verify management receives maturity reporting',
      'Confirm resource allocation reflects maturity priorities',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Additional GDPR Articles - Restrictions (Article 23)
  // ============================================================
  {
    controlId: 'GDPR-23',
    name: 'Restrictions on Data Subject Rights',
    description:
      'Union or Member State law may restrict the scope of obligations and rights provided in Articles 12-22 and Article 34, as well as Article 5 insofar as its provisions correspond to the rights and obligations provided for in Articles 12-22, when such a restriction respects the essence of fundamental rights and freedoms and is necessary and proportionate.',
    category: 'Restrictions',
    implementationGuidance:
      'Identify any applicable Union or Member State laws that authorize restrictions on data subject rights. Document the specific legal basis for any restrictions applied. Ensure restrictions are applied only when necessary and proportionate to safeguard national security, defense, public security, criminal matters, important public interests, judicial independence, regulatory functions, or data subject protection. Implement procedures to assess restriction applicability on a case-by-case basis. Maintain records of all restrictions applied with legal justification.',
    evidenceRequirements: [
      'Inventory of applicable restriction laws',
      'Legal basis documentation for each restriction type',
      'Necessity and proportionality assessments',
      'Case-by-case restriction application records',
      'Legal review sign-off for restriction decisions',
    ],
    testProcedures: [
      'Review inventory of restriction laws for completeness',
      'Verify legal basis documentation for each restriction',
      'Assess necessity and proportionality analysis rigor',
      'Sample restriction decisions for proper documentation',
      'Confirm legal review is obtained before applying restrictions',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Cooperation with Supervisory Authority (Article 31)
  // ============================================================
  {
    controlId: 'GDPR-31',
    name: 'Cooperation with Supervisory Authority',
    description:
      'The controller and the processor and, where applicable, their representatives, shall cooperate, on request, with the supervisory authority in the performance of its tasks.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Establish procedures for responding to supervisory authority requests for information or cooperation. Designate responsible personnel for supervisory authority communications. Implement document preservation procedures when supervisory authority inquiries are received. Train relevant staff on cooperation obligations and response protocols. Maintain records of all supervisory authority interactions. Establish escalation procedures for complex or contentious requests.',
    evidenceRequirements: [
      'Supervisory authority cooperation procedures',
      'Designated contact personnel documentation',
      'Document preservation procedures',
      'Staff training records on cooperation obligations',
      'Supervisory authority interaction logs',
      'Escalation procedure documentation',
    ],
    testProcedures: [
      'Review cooperation procedures for comprehensiveness',
      'Verify designated contacts are documented and current',
      'Test document preservation procedures',
      'Confirm staff training on cooperation obligations',
      'Review interaction logs for completeness',
      'Test escalation procedures for responsiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // International Transfers - Additional Controls (Article 48)
  // ============================================================
  {
    controlId: 'GDPR-48',
    name: 'Transfers Not Authorized by Union Law',
    description:
      'Any judgment of a court or tribunal and any decision of an administrative authority of a third country requiring a controller or processor to transfer or disclose personal data may only be recognized or enforceable if based on an international agreement such as a mutual legal assistance treaty.',
    category: 'International Transfers',
    implementationGuidance:
      'Establish procedures to identify and assess third country legal demands for personal data disclosure. Implement a legal review process for all foreign government or court requests. Document the legal basis assessment including whether mutual legal assistance treaties or international agreements apply. Coordinate with legal counsel and the DPO on disclosure decisions. Notify relevant supervisory authorities where required. Maintain records of all third country disclosure requests and responses.',
    evidenceRequirements: [
      'Third country disclosure request procedures',
      'Legal review process documentation',
      'Mutual legal assistance treaty inventory',
      'Disclosure decision records with legal analysis',
      'Supervisory authority notification records where applicable',
      'Request and response tracking logs',
    ],
    testProcedures: [
      'Review disclosure request procedures for legal compliance',
      'Verify legal review process is followed',
      'Confirm treaty inventory is current',
      'Sample disclosure decisions for proper legal analysis',
      'Verify supervisory authority notifications where required',
      'Review tracking logs for completeness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Supervisory Authority Provisions (Articles 51-59)
  // ============================================================
  {
    controlId: 'GDPR-51',
    name: 'Supervisory Authority Awareness',
    description:
      'Each Member State shall provide for one or more independent public authorities to be responsible for monitoring the application of the GDPR. Organizations must be aware of and prepared to interact with relevant supervisory authorities.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Identify all supervisory authorities with jurisdiction over the organization\'s processing activities. Maintain current contact information for relevant supervisory authorities. Monitor supervisory authority publications, guidance, and decisions. Understand the powers and procedures of each relevant supervisory authority. Prepare for potential supervisory authority audits, inspections, and inquiries.',
    evidenceRequirements: [
      'Supervisory authority jurisdiction mapping',
      'Contact information directory for supervisory authorities',
      'Monitoring process for supervisory authority publications',
      'Summary of supervisory authority powers and procedures',
      'Audit and inspection preparedness documentation',
    ],
    testProcedures: [
      'Review jurisdiction mapping for accuracy',
      'Verify contact information is current',
      'Confirm monitoring of supervisory authority publications',
      'Review understanding of supervisory authority powers',
      'Assess audit preparedness documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-52',
    name: 'Supervisory Authority Independence Recognition',
    description:
      'Each supervisory authority shall act with complete independence in performing its tasks and exercising its powers. Organizations must respect this independence in all interactions.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Establish policies prohibiting attempts to improperly influence supervisory authority decisions. Train staff on appropriate interactions with supervisory authorities. Implement procedures ensuring transparent and honest communications with supervisory authorities. Document all supervisory authority interactions to demonstrate propriety. Report any perceived improper influence attempts through appropriate channels.',
    evidenceRequirements: [
      'Policy on supervisory authority interactions',
      'Staff training on appropriate regulatory engagement',
      'Communication procedures with supervisory authorities',
      'Interaction documentation and records',
      'Reporting procedures for improper influence concerns',
    ],
    testProcedures: [
      'Review interaction policy for appropriateness',
      'Verify staff training on regulatory engagement',
      'Test communication procedures for transparency',
      'Sample interaction records for propriety',
      'Confirm reporting procedures exist for concerns',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-55',
    name: 'Supervisory Authority Competence Awareness',
    description:
      'Each supervisory authority shall be competent to perform the tasks assigned to and exercise the powers conferred on it on the territory of its own Member State. Organizations must understand which supervisory authority has competence over their activities.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Map processing activities to the Member States where they occur. Identify the competent supervisory authority for each processing activity based on establishment or data subject location. Document the lead supervisory authority for cross-border processing. Understand competence allocation for complaints and investigations. Prepare for potential multi-authority coordination in cross-border matters.',
    evidenceRequirements: [
      'Processing activity to Member State mapping',
      'Competent authority identification per activity',
      'Lead supervisory authority documentation',
      'Competence allocation understanding documentation',
      'Multi-authority coordination preparedness',
    ],
    testProcedures: [
      'Review processing activity mapping for accuracy',
      'Verify competent authority identification',
      'Confirm lead supervisory authority documentation',
      'Assess understanding of competence allocation',
      'Review multi-authority coordination preparedness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-56',
    name: 'Lead Supervisory Authority Engagement',
    description:
      'The supervisory authority of the main establishment or of the single establishment of the controller or processor shall be competent to act as lead supervisory authority for cross-border processing.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Determine the organization\'s main establishment in the Union based on place of central administration or decision-making for processing. Document the rationale for main establishment determination. Identify the lead supervisory authority based on main establishment location. Establish communication channels with the lead supervisory authority. Prepare for one-stop-shop mechanism application in cross-border matters.',
    evidenceRequirements: [
      'Main establishment determination and rationale',
      'Lead supervisory authority identification',
      'Communication channel documentation',
      'One-stop-shop mechanism understanding',
      'Cross-border processing documentation',
    ],
    testProcedures: [
      'Review main establishment determination rationale',
      'Verify lead supervisory authority identification',
      'Test communication channels with lead authority',
      'Assess one-stop-shop mechanism understanding',
      'Review cross-border processing documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-58',
    name: 'Supervisory Authority Powers Awareness',
    description:
      'Each supervisory authority shall have investigative powers, corrective powers, authorization and advisory powers. Organizations must understand and prepare for the exercise of these powers.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Document understanding of supervisory authority investigative powers including audits, access to premises, and information requests. Prepare for potential corrective measures including warnings, reprimands, orders, bans, and fines. Understand authorization powers for BCRs, certifications, and codes of conduct. Leverage advisory powers through consultations. Implement response procedures for each type of power exercise.',
    evidenceRequirements: [
      'Investigative powers understanding documentation',
      'Corrective measures preparedness procedures',
      'Authorization process understanding',
      'Advisory engagement records',
      'Response procedures for each power type',
    ],
    testProcedures: [
      'Review investigative powers understanding',
      'Test corrective measures response procedures',
      'Verify authorization process understanding',
      'Review advisory engagement history',
      'Assess response procedure adequacy for each power',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Consistency Mechanism Awareness (Articles 63-67)
  // ============================================================
  {
    controlId: 'GDPR-63',
    name: 'Consistency Mechanism Awareness',
    description:
      'Supervisory authorities shall cooperate with each other and with the Commission through the consistency mechanism. Organizations should be aware of how this affects cross-border processing decisions.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Understand the consistency mechanism and its impact on regulatory decisions. Monitor European Data Protection Board opinions and decisions. Track cases involving the consistency mechanism relevant to the organization\'s processing. Prepare for potential delays in cross-border matters due to consistency mechanism procedures. Incorporate EDPB guidance into compliance programs.',
    evidenceRequirements: [
      'Consistency mechanism understanding documentation',
      'EDPB opinion and decision monitoring process',
      'Relevant case tracking records',
      'Timeline expectations for cross-border matters',
      'EDPB guidance integration into compliance',
    ],
    testProcedures: [
      'Review consistency mechanism understanding',
      'Verify EDPB monitoring process is active',
      'Review relevant case tracking',
      'Assess timeline expectations for cross-border decisions',
      'Confirm EDPB guidance integration',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // European Data Protection Board (Articles 68-76)
  // ============================================================
  {
    controlId: 'GDPR-68',
    name: 'European Data Protection Board Guidance',
    description:
      'The European Data Protection Board is established as a body of the Union with legal personality. Organizations should monitor and apply EDPB guidance in their compliance programs.',
    category: 'Regulatory Relations',
    implementationGuidance:
      'Establish processes to monitor EDPB guidelines, recommendations, and best practices. Incorporate EDPB guidance into data protection policies and procedures. Track EDPB opinions on cross-border matters and consistency mechanism decisions. Review EDPB annual reports for trends and priorities. Engage with EDPB consultations on draft guidance where relevant.',
    evidenceRequirements: [
      'EDPB guidance monitoring process',
      'Policy updates incorporating EDPB guidance',
      'Cross-border opinion tracking',
      'Annual report review records',
      'Consultation engagement records where applicable',
    ],
    testProcedures: [
      'Verify EDPB monitoring process is active',
      'Review policy updates for EDPB guidance incorporation',
      'Check cross-border opinion tracking currency',
      'Confirm annual report reviews are conducted',
      'Review consultation engagement where relevant',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Representative Organizations (Article 80)
  // ============================================================
  {
    controlId: 'GDPR-80',
    name: 'Representative Organization Engagement',
    description:
      'The data subject shall have the right to mandate a not-for-profit body, organization, or association to lodge a complaint and exercise rights on their behalf. Organizations must be prepared to handle such representative complaints.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Establish procedures to verify mandates from representative organizations. Process complaints and requests from authorized representatives as if from data subjects. Implement identity and mandate verification for representative requests. Train staff on handling representative organization engagements. Track representative organization complaints separately for analysis. Engage constructively with legitimate advocacy organizations.',
    evidenceRequirements: [
      'Representative mandate verification procedures',
      'Processing procedures for representative requests',
      'Identity and mandate verification documentation',
      'Staff training on representative engagements',
      'Representative complaint tracking records',
      'Advocacy organization engagement records',
    ],
    testProcedures: [
      'Test mandate verification procedures',
      'Verify representative request processing matches data subject procedures',
      'Review verification documentation requirements',
      'Confirm staff training on representative handling',
      'Review representative complaint tracking',
      'Assess advocacy engagement records',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Right to Compensation (Article 81)
  // ============================================================
  {
    controlId: 'GDPR-81',
    name: 'Suspension of Proceedings',
    description:
      'Where a competent court of a Member State has information that proceedings concerning the same subject matter are pending in a court in another Member State, it shall contact that court to confirm the existence of such proceedings.',
    category: 'Judicial Remedies',
    implementationGuidance:
      'Establish procedures to track multi-jurisdictional legal proceedings related to data protection. Coordinate with legal counsel across jurisdictions on parallel proceedings. Document all legal proceedings and their status across Member States. Implement communication procedures between legal representatives in different jurisdictions. Monitor for potential suspension of proceedings scenarios.',
    evidenceRequirements: [
      'Multi-jurisdictional proceedings tracking',
      'Cross-jurisdictional legal coordination procedures',
      'Legal proceedings documentation',
      'Inter-jurisdictional communication records',
      'Proceedings suspension monitoring',
    ],
    testProcedures: [
      'Review multi-jurisdictional tracking for completeness',
      'Verify legal coordination procedures exist',
      'Inspect legal proceedings documentation',
      'Review communication records between jurisdictions',
      'Assess suspension monitoring effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Specific Processing Situations (Articles 85-91)
  // ============================================================
  {
    controlId: 'GDPR-85',
    name: 'Processing for Journalism and Expression',
    description:
      'Member States shall reconcile the right to personal data protection with the right to freedom of expression and information, including processing for journalistic purposes and academic, artistic, or literary expression.',
    category: 'Specific Processing Situations',
    implementationGuidance:
      'Identify any processing activities that may qualify for journalism, academic, artistic, or literary expression exemptions. Document the legal basis for relying on Article 85 exemptions in relevant Member States. Implement procedures to assess whether processing genuinely falls within protected expression categories. Balance data protection obligations with freedom of expression rights. Consult legal counsel on exemption applicability for borderline cases.',
    evidenceRequirements: [
      'Processing activities assessment for expression exemptions',
      'Member State exemption law documentation',
      'Assessment procedures for exemption applicability',
      'Balancing analysis documentation',
      'Legal counsel consultation records',
    ],
    testProcedures: [
      'Review processing activities assessment for completeness',
      'Verify Member State exemption law understanding',
      'Test assessment procedures for exemption applicability',
      'Review balancing analysis documentation',
      'Confirm legal counsel consultation for complex cases',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-86',
    name: 'Processing and Public Access to Official Documents',
    description:
      'Personal data in official documents held by a public authority or body may be disclosed in accordance with Union or Member State law to reconcile public access to official documents with the right to personal data protection.',
    category: 'Specific Processing Situations',
    implementationGuidance:
      'If acting as a public authority, identify official documents containing personal data subject to public access requests. Implement procedures to balance transparency obligations with data protection requirements. Apply redaction or anonymization where appropriate before disclosure. Document decisions on public access requests involving personal data. Train staff on handling freedom of information and public access requests.',
    evidenceRequirements: [
      'Official document inventory with personal data identification',
      'Public access request handling procedures',
      'Redaction and anonymization procedures',
      'Access request decision documentation',
      'Staff training on public access handling',
    ],
    testProcedures: [
      'Review official document inventory for personal data flagging',
      'Test public access request procedures',
      'Verify redaction procedures are applied appropriately',
      'Sample access request decisions for proper documentation',
      'Confirm staff training on public access requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-87',
    name: 'Processing of National Identification Numbers',
    description:
      'Member States may determine specific conditions for processing national identification numbers or any other identifier of general application. Organizations must comply with such Member State-specific requirements.',
    category: 'Specific Processing Situations',
    implementationGuidance:
      'Identify all processing of national identification numbers across Member States where the organization operates. Document Member State-specific requirements for national ID number processing. Implement controls to limit national ID number collection and use to legally authorized purposes. Apply enhanced security measures to national ID number storage and transmission. Conduct regular reviews of national ID number processing necessity.',
    evidenceRequirements: [
      'National ID number processing inventory by Member State',
      'Member State requirement documentation',
      'Purpose limitation controls for national ID numbers',
      'Enhanced security measures documentation',
      'Processing necessity review records',
    ],
    testProcedures: [
      'Review national ID processing inventory for completeness',
      'Verify Member State requirements are documented',
      'Test purpose limitation controls',
      'Verify enhanced security measures implementation',
      'Confirm necessity reviews are conducted periodically',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-88',
    name: 'Processing in Employment Context',
    description:
      'Member States may provide more specific rules to ensure the protection of rights and freedoms in respect of the processing of employees personal data in the employment context.',
    category: 'Specific Processing Situations',
    implementationGuidance:
      'Identify all Member State-specific employment data protection rules applicable to the organization. Implement employment-specific data protection policies addressing recruitment, performance management, monitoring, and termination. Ensure collective agreements with employee representatives address data protection where required. Conduct DPIAs for high-risk employment data processing. Coordinate with HR and legal on employment data protection compliance.',
    evidenceRequirements: [
      'Member State employment data protection rule inventory',
      'Employment-specific data protection policies',
      'Collective agreement data protection provisions',
      'Employment data processing DPIAs',
      'HR and legal coordination records',
    ],
    testProcedures: [
      'Review Member State rule inventory for completeness',
      'Verify employment policies address all data protection aspects',
      'Check collective agreements for required provisions',
      'Review DPIAs for high-risk employment processing',
      'Confirm HR and legal coordination is effective',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-89',
    name: 'Safeguards for Research and Statistics',
    description:
      'Processing for archiving purposes in the public interest, scientific or historical research purposes, or statistical purposes shall be subject to appropriate safeguards including technical and organizational measures to ensure data minimization.',
    category: 'Research & Statistics',
    implementationGuidance:
      'Implement pseudonymization as the primary safeguard for research and statistical processing where possible. Apply data minimization ensuring only necessary data is processed for research purposes. Establish ethics review processes for research involving personal data. Implement access controls limiting research data access to authorized researchers. Apply retention limits ensuring research data is not kept longer than necessary. Document safeguards applied to each research processing activity.',
    evidenceRequirements: [
      'Pseudonymization implementation for research',
      'Data minimization assessments for research',
      'Ethics review process and completed reviews',
      'Research data access controls',
      'Retention limits for research data',
      'Safeguard documentation per research activity',
    ],
    testProcedures: [
      'Test pseudonymization implementation effectiveness',
      'Review data minimization assessments',
      'Verify ethics review process is followed',
      'Test access controls for research data',
      'Verify retention limits are enforced',
      'Sample safeguard documentation for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-89.2',
    name: 'Derogations for Research Purposes',
    description:
      'Union or Member State law may provide for derogations from Articles 15, 16, 18, and 21 for research purposes subject to appropriate safeguards.',
    category: 'Research & Statistics',
    implementationGuidance:
      'Identify applicable Member State derogations for research processing. Document the legal basis for relying on any research derogations. Ensure appropriate safeguards are in place before invoking derogations. Limit derogation reliance to cases where rights exercise would seriously impair research objectives. Maintain records of derogation reliance with justification for each instance.',
    evidenceRequirements: [
      'Member State research derogation inventory',
      'Legal basis documentation for derogation reliance',
      'Safeguard implementation evidence',
      'Research impairment assessments',
      'Derogation reliance records with justification',
    ],
    testProcedures: [
      'Review derogation inventory for applicable jurisdictions',
      'Verify legal basis documentation for each derogation',
      'Test safeguard implementation',
      'Review impairment assessments for legitimacy',
      'Sample derogation reliance records for proper justification',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-90',
    name: 'Obligations of Secrecy',
    description:
      'Member States may adopt specific rules to set out the powers of supervisory authorities in relation to controllers or processors subject to professional secrecy obligations.',
    category: 'Specific Processing Situations',
    implementationGuidance:
      'Identify any professional secrecy obligations applicable to the organization (legal, medical, religious, etc.). Document how professional secrecy interacts with GDPR obligations and supervisory authority powers. Implement procedures balancing professional secrecy with data protection transparency and cooperation requirements. Consult legal counsel on conflicts between secrecy obligations and GDPR. Coordinate with relevant professional bodies on secrecy and data protection matters.',
    evidenceRequirements: [
      'Professional secrecy obligation inventory',
      'Secrecy and GDPR interaction analysis',
      'Balancing procedures documentation',
      'Legal counsel consultation records',
      'Professional body coordination records',
    ],
    testProcedures: [
      'Review professional secrecy inventory for completeness',
      'Verify interaction analysis addresses key conflicts',
      'Test balancing procedures for consistency',
      'Confirm legal counsel consultation on conflicts',
      'Review professional body coordination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-91',
    name: 'Church and Religious Association Processing',
    description:
      'Where churches and religious associations apply comprehensive rules relating to personal data protection, they may continue to apply such rules provided they are brought into line with the GDPR.',
    category: 'Specific Processing Situations',
    implementationGuidance:
      'If applicable as a church or religious association, assess existing data protection rules against GDPR requirements. Align existing rules with GDPR principles and requirements. Establish or designate a supervisory authority as required by Article 91(2). Implement procedures ensuring GDPR-equivalent protection under religious organization rules. Document the alignment between existing rules and GDPR requirements.',
    evidenceRequirements: [
      'Existing data protection rules documentation',
      'GDPR alignment assessment',
      'Supervisory authority designation where applicable',
      'Equivalent protection implementation evidence',
      'Rules to GDPR mapping documentation',
    ],
    testProcedures: [
      'Review existing rules documentation',
      'Verify GDPR alignment assessment completeness',
      'Confirm supervisory authority designation if required',
      'Test equivalent protection measures',
      'Review mapping documentation for accuracy',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Sub-Controls for Article 5 Principles
  // ============================================================
  {
    controlId: 'GDPR-5.1a-1',
    name: 'Lawfulness Assessment Process',
    description:
      'Implement a systematic process to assess and document the lawfulness of all processing activities before they commence.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Develop a lawfulness assessment template covering all six legal bases under Article 6. Require lawfulness assessment completion before any new processing activity begins. Implement review and approval workflows for lawfulness assessments. Train process owners on conducting lawfulness assessments. Maintain a register linking processing activities to their lawfulness assessments.',
    evidenceRequirements: [
      'Lawfulness assessment template',
      'Completed assessments for all processing activities',
      'Review and approval workflow documentation',
      'Process owner training records',
      'Assessment register linked to processing activities',
    ],
    testProcedures: [
      'Review assessment template for comprehensiveness',
      'Verify all processing activities have completed assessments',
      'Test approval workflow is followed',
      'Confirm process owner training completion',
      'Cross-reference assessment register with RoPA',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1a-2',
    name: 'Fairness Impact Assessment',
    description:
      'Conduct assessments to ensure processing does not have unjustifiably negative effects on data subjects and meets reasonable expectations.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Develop fairness criteria considering data subject reasonable expectations, relationship with the controller, potential adverse effects, and vulnerable groups. Integrate fairness assessment into DPIA processes. Conduct standalone fairness assessments for processing not requiring full DPIAs. Document fairness considerations and mitigations applied. Review processing activities for unexpected fairness impacts periodically.',
    evidenceRequirements: [
      'Fairness assessment criteria documentation',
      'Fairness integration in DPIA process',
      'Standalone fairness assessment records',
      'Mitigation documentation for fairness concerns',
      'Periodic fairness review records',
    ],
    testProcedures: [
      'Review fairness criteria for appropriateness',
      'Verify fairness integration in DPIAs',
      'Sample standalone fairness assessments',
      'Review mitigation documentation',
      'Confirm periodic reviews are conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1a-3',
    name: 'Transparency Implementation',
    description:
      'Implement comprehensive transparency measures ensuring data subjects are fully informed about how their data is processed.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Develop transparency standards covering timing, format, accessibility, and content of privacy information. Implement multiple channels for privacy information delivery. Use plain language verified through readability testing. Provide layered privacy notices for complex processing. Make privacy information available in relevant languages. Proactively communicate changes to processing activities.',
    evidenceRequirements: [
      'Transparency standards documentation',
      'Multi-channel privacy information delivery evidence',
      'Readability testing results',
      'Layered notice implementation',
      'Multi-language notice availability',
      'Processing change communication records',
    ],
    testProcedures: [
      'Review transparency standards for comprehensiveness',
      'Test privacy information availability across channels',
      'Verify readability testing is conducted',
      'Assess layered notice effectiveness',
      'Confirm language coverage for data subject population',
      'Review change communication records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1b-1',
    name: 'Purpose Specification Process',
    description:
      'Implement processes to specify, document, and communicate processing purposes before data collection begins.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Require explicit purpose statements for all processing activities. Document purposes in the Record of Processing Activities with specificity. Communicate purposes to data subjects through privacy notices. Prohibit processing without documented purposes. Review and update purpose statements when processing evolves.',
    evidenceRequirements: [
      'Purpose statement requirements documentation',
      'RoPA with specific purpose statements',
      'Privacy notice purpose disclosures',
      'Processing approval records requiring purpose documentation',
      'Purpose statement review and update records',
    ],
    testProcedures: [
      'Review purpose statement requirements',
      'Verify RoPA contains specific purposes',
      'Cross-reference privacy notices with RoPA purposes',
      'Confirm approval processes require purpose documentation',
      'Review purpose update records for currency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1b-2',
    name: 'Compatible Use Assessment',
    description:
      'Implement a process to assess compatibility of proposed secondary uses against original collection purposes.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Develop compatibility assessment criteria based on Art. 6(4) factors. Require compatibility assessments before any secondary use of personal data. Consider relationship between original and new purposes, collection context, data nature, consequences to data subjects, and safeguards. Document assessment outcomes and any additional safeguards implemented. Prohibit incompatible secondary uses unless a new lawful basis is established.',
    evidenceRequirements: [
      'Compatibility assessment criteria documentation',
      'Completed compatibility assessments for secondary uses',
      'Art. 6(4) factor analysis documentation',
      'Additional safeguard implementation records',
      'Prohibition enforcement for incompatible uses',
    ],
    testProcedures: [
      'Review compatibility assessment criteria against Art. 6(4)',
      'Sample completed assessments for thoroughness',
      'Verify factor analysis is documented',
      'Confirm additional safeguards are implemented where required',
      'Test enforcement of incompatible use prohibition',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1c-1',
    name: 'Data Collection Minimization',
    description:
      'Implement controls to ensure only necessary personal data is collected at the point of data collection.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Review all data collection forms and interfaces against documented purposes. Remove optional fields that are not necessary for the stated purpose. Implement form validation preventing collection of excessive data. Require justification for each data field collected. Conduct periodic reviews of collection points for minimization compliance.',
    evidenceRequirements: [
      'Data collection form review records',
      'Optional field necessity justification',
      'Form validation configuration',
      'Field-level justification documentation',
      'Periodic collection point review records',
    ],
    testProcedures: [
      'Review collection form assessments',
      'Verify optional fields have documented justification',
      'Test form validation controls',
      'Sample field justifications for legitimacy',
      'Confirm periodic reviews are conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1c-2',
    name: 'Data Processing Minimization',
    description:
      'Implement controls to ensure personal data processing is limited to what is necessary throughout the data lifecycle.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Implement access controls limiting data access to necessary personnel. Configure systems to process only required data fields for each function. Apply data masking for fields not needed in specific processing contexts. Review processing workflows for unnecessary data exposure. Implement automated minimization controls where technically feasible.',
    evidenceRequirements: [
      'Access control configuration limiting data exposure',
      'System configuration for field-level processing limits',
      'Data masking implementation evidence',
      'Processing workflow review records',
      'Automated minimization control documentation',
    ],
    testProcedures: [
      'Test access controls for appropriate data limiting',
      'Verify system configurations enforce field-level limits',
      'Test data masking effectiveness',
      'Review workflow assessments for minimization',
      'Evaluate automated minimization controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1d-1',
    name: 'Data Quality Assurance',
    description:
      'Implement comprehensive data quality controls to ensure personal data remains accurate and up to date.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Implement data validation rules at collection points. Deploy automated data quality monitoring and alerting. Establish data quality metrics and thresholds. Implement data cleansing processes for identified quality issues. Provide self-service data update capabilities to data subjects. Conduct periodic data quality audits.',
    evidenceRequirements: [
      'Data validation rule documentation',
      'Data quality monitoring configuration',
      'Quality metrics and threshold documentation',
      'Data cleansing process records',
      'Self-service update capability evidence',
      'Data quality audit reports',
    ],
    testProcedures: [
      'Test data validation rules effectiveness',
      'Verify quality monitoring is operational',
      'Review quality metrics against thresholds',
      'Assess data cleansing process effectiveness',
      'Test self-service update capabilities',
      'Review data quality audit findings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1d-2',
    name: 'Data Correction Process',
    description:
      'Implement processes to promptly correct inaccurate personal data when identified or reported.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Establish multiple channels for reporting data inaccuracies. Implement triage and prioritization for correction requests. Define correction processing timelines and SLAs. Propagate corrections to all systems and third parties holding the data. Maintain audit trails of all corrections. Notify data subjects of correction completion.',
    evidenceRequirements: [
      'Inaccuracy reporting channel documentation',
      'Correction request triage procedures',
      'Timeline and SLA documentation',
      'Correction propagation procedures',
      'Correction audit trail records',
      'Data subject notification records',
    ],
    testProcedures: [
      'Test inaccuracy reporting channels',
      'Verify triage procedures are followed',
      'Review correction timeline compliance',
      'Test correction propagation to all systems',
      'Verify audit trail completeness',
      'Confirm data subject notifications are sent',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1e-1',
    name: 'Retention Schedule Development',
    description:
      'Develop comprehensive retention schedules specifying retention periods for all categories of personal data.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Inventory all categories of personal data processed. Determine retention periods based on legal requirements, contractual obligations, and business necessity. Document the rationale for each retention period. Align retention periods with lawful basis validity. Review and update retention schedules annually and when requirements change.',
    evidenceRequirements: [
      'Personal data category inventory',
      'Retention period determination documentation',
      'Rationale documentation for each period',
      'Lawful basis alignment analysis',
      'Annual review and update records',
    ],
    testProcedures: [
      'Review data category inventory for completeness',
      'Verify retention periods have documented rationale',
      'Assess rationale against legal and business requirements',
      'Confirm lawful basis alignment',
      'Review annual update records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-5.1e-2',
    name: 'Retention Enforcement',
    description:
      'Implement technical and procedural controls to enforce retention schedules across all data stores.',
    category: 'Lawful Basis & Consent',
    implementationGuidance:
      'Configure automated deletion or archival for data reaching retention limits. Implement retention tagging for data lifecycle tracking. Establish manual deletion procedures for systems without automation capability. Monitor retention compliance across all data stores. Implement legal hold procedures that suspend automated deletion when required.',
    evidenceRequirements: [
      'Automated deletion configuration documentation',
      'Retention tagging implementation',
      'Manual deletion procedures',
      'Retention compliance monitoring reports',
      'Legal hold procedures and records',
    ],
    testProcedures: [
      'Test automated deletion functionality',
      'Verify retention tagging accuracy',
      'Review manual deletion procedure compliance',
      'Inspect compliance monitoring reports',
      'Test legal hold implementation',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Sub-Controls for Data Subject Rights
  // ============================================================
  {
    controlId: 'GDPR-15.1',
    name: 'Access Request Verification',
    description:
      'Implement robust identity verification procedures for data subject access requests to prevent unauthorized disclosure.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop risk-based identity verification procedures appropriate to the sensitivity of data. Implement multi-factor verification for high-sensitivity data access requests. Define acceptable forms of identity documentation. Establish procedures for handling requests from authorized representatives. Document verification steps for each access request.',
    evidenceRequirements: [
      'Identity verification procedures documentation',
      'Risk-based verification criteria',
      'Acceptable documentation list',
      'Representative authorization procedures',
      'Verification documentation records',
    ],
    testProcedures: [
      'Review verification procedures for adequacy',
      'Test risk-based verification application',
      'Verify acceptable documentation is appropriate',
      'Test representative authorization procedures',
      'Sample verification records for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-15.2',
    name: 'Access Request Data Discovery',
    description:
      'Implement comprehensive data discovery capabilities to locate all personal data for access request fulfillment.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Map all systems and data stores containing personal data. Implement search capabilities across structured and unstructured data. Develop procedures for manual searches where automated discovery is not available. Establish escalation procedures for complex discovery scenarios. Document data discovery results for each access request.',
    evidenceRequirements: [
      'Personal data system and store mapping',
      'Automated search capability documentation',
      'Manual search procedures',
      'Escalation procedures for complex scenarios',
      'Data discovery documentation per request',
    ],
    testProcedures: [
      'Review system mapping for completeness',
      'Test automated search capabilities',
      'Verify manual search procedures are followed',
      'Test escalation procedures for complex cases',
      'Sample discovery documentation for thoroughness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-15.3',
    name: 'Access Request Response Preparation',
    description:
      'Implement standardized processes for preparing complete and accurate access request responses.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop response templates including all Art. 15 required information. Implement quality review procedures for response accuracy. Establish formatting standards for data copies provided. Apply redaction procedures for third-party data in responses. Implement secure delivery mechanisms for response transmission.',
    evidenceRequirements: [
      'Response templates with Art. 15 information',
      'Quality review procedures and records',
      'Data copy formatting standards',
      'Redaction procedures and examples',
      'Secure delivery mechanism documentation',
    ],
    testProcedures: [
      'Review response templates for completeness',
      'Verify quality review is conducted',
      'Test data copy formatting consistency',
      'Review redaction procedure application',
      'Test secure delivery mechanisms',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-17.1',
    name: 'Erasure Request Assessment',
    description:
      'Implement systematic assessment processes to evaluate erasure requests against applicable grounds and exemptions.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop assessment criteria for each Art. 17(1) erasure ground. Implement exemption analysis against Art. 17(3) exceptions. Establish legal review escalation for complex or contentious requests. Document assessment outcomes with detailed reasoning. Communicate assessment results to data subjects clearly.',
    evidenceRequirements: [
      'Assessment criteria for each erasure ground',
      'Exemption analysis procedures',
      'Legal review escalation procedures',
      'Assessment outcome documentation',
      'Data subject communication records',
    ],
    testProcedures: [
      'Review assessment criteria comprehensiveness',
      'Test exemption analysis procedures',
      'Verify legal review escalation is triggered appropriately',
      'Sample assessment documentation for reasoning quality',
      'Review data subject communications for clarity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-17.2',
    name: 'Erasure Execution',
    description:
      'Implement technical capabilities to execute erasure requests across all systems and data stores.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop erasure procedures for each system type (databases, files, backups, logs). Implement verification procedures to confirm complete erasure. Address backup erasure through deletion or compensating controls. Establish procedures for notifying third parties of erasure requirements. Document erasure actions without retaining the deleted personal data.',
    evidenceRequirements: [
      'System-specific erasure procedures',
      'Erasure verification procedures and records',
      'Backup erasure or compensation documentation',
      'Third-party notification procedures and records',
      'Erasure action documentation',
    ],
    testProcedures: [
      'Test erasure procedures for each system type',
      'Verify erasure verification is conducted',
      'Review backup handling documentation',
      'Confirm third-party notifications are sent',
      'Sample erasure documentation for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-20.1',
    name: 'Portability Data Scoping',
    description:
      'Implement processes to correctly scope portable data to data provided by the data subject under consent or contract.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Define criteria for identifying data provided by the data subject versus inferred or derived data. Map data elements to their source (provided, observed, inferred). Identify processing activities based on consent or contract for portability scope. Implement technical tagging to facilitate portability data identification. Document scoping decisions for portability requests.',
    evidenceRequirements: [
      'Data source classification criteria',
      'Data element source mapping',
      'Consent/contract processing activity identification',
      'Technical tagging implementation',
      'Scoping decision documentation',
    ],
    testProcedures: [
      'Review classification criteria for accuracy',
      'Verify data source mapping completeness',
      'Confirm consent/contract activity identification',
      'Test technical tagging implementation',
      'Sample scoping decisions for correctness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-20.2',
    name: 'Portability Export Formats',
    description:
      'Implement data export capabilities producing structured, commonly used, and machine-readable formats.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Support industry-standard formats such as JSON, CSV, and XML. Implement format selection options for data subjects where multiple formats are available. Ensure exported data is complete and accurately represents source data. Test export format interoperability with common import systems. Document supported formats and their suitability for different use cases.',
    evidenceRequirements: [
      'Supported format documentation',
      'Format selection capability evidence',
      'Export completeness and accuracy verification',
      'Interoperability test results',
      'Format suitability documentation',
    ],
    testProcedures: [
      'Review supported formats for industry standards',
      'Test format selection functionality',
      'Verify export completeness and accuracy',
      'Test interoperability with external systems',
      'Review format suitability documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-21.1',
    name: 'Direct Marketing Objection Processing',
    description:
      'Implement immediate and unconditional processing cessation for objections to direct marketing.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Implement opt-out mechanisms in all marketing communications. Process marketing objections immediately without assessment. Update suppression lists in real-time across all marketing systems. Prevent re-adding opted-out contacts through list uploads or purchases. Verify marketing cessation through monitoring and testing.',
    evidenceRequirements: [
      'Opt-out mechanism documentation in communications',
      'Immediate processing procedures',
      'Suppression list management documentation',
      'Re-addition prevention controls',
      'Marketing cessation verification records',
    ],
    testProcedures: [
      'Test opt-out mechanisms in communications',
      'Verify immediate processing timeline',
      'Test suppression list updates across systems',
      'Attempt to re-add opted-out contacts',
      'Review cessation verification records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-21.2',
    name: 'Legitimate Interest Objection Assessment',
    description:
      'Implement assessment processes for objections to processing based on legitimate interests or public task.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop assessment criteria weighing data subject grounds against controller compelling legitimate grounds. Establish timelines for completing objection assessments. Implement processing restriction during assessment periods where appropriate. Document assessment reasoning and outcomes. Communicate assessment results and next steps to data subjects.',
    evidenceRequirements: [
      'Assessment criteria documentation',
      'Assessment timeline standards',
      'Restriction during assessment procedures',
      'Assessment reasoning documentation',
      'Data subject communication records',
    ],
    testProcedures: [
      'Review assessment criteria for balance',
      'Verify assessment timeline compliance',
      'Test restriction implementation during assessment',
      'Sample assessment documentation for reasoning quality',
      'Review data subject communications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-22.1',
    name: 'Automated Decision Inventory',
    description:
      'Maintain a comprehensive inventory of automated decision-making systems and their impact on individuals.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Identify all systems making automated decisions about individuals. Classify decisions by impact level (legal effects, significant effects, other). Document the logic, data inputs, and decision outcomes for each system. Assess each system against Art. 22 requirements. Update the inventory when automated decision systems change.',
    evidenceRequirements: [
      'Automated decision system inventory',
      'Impact classification for each system',
      'Logic and data input documentation',
      'Art. 22 compliance assessment',
      'Inventory update records',
    ],
    testProcedures: [
      'Review inventory for completeness',
      'Verify impact classifications are accurate',
      'Review logic documentation for transparency',
      'Assess Art. 22 compliance for each system',
      'Confirm inventory is updated when systems change',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-22.2',
    name: 'Human Intervention Mechanism',
    description:
      'Implement mechanisms for data subjects to obtain human intervention in automated decision-making.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Provide clear information on how to request human review. Implement accessible request channels for human intervention. Train human reviewers on decision review procedures. Establish timelines for human review completion. Document human review process and outcomes.',
    evidenceRequirements: [
      'Human intervention request information',
      'Request channel accessibility documentation',
      'Human reviewer training records',
      'Review timeline standards',
      'Human review outcome documentation',
    ],
    testProcedures: [
      'Verify human intervention information is accessible',
      'Test request channel functionality',
      'Confirm reviewer training completion',
      'Review timeline compliance',
      'Sample human review outcomes for quality',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Controller Obligation Controls
  // ============================================================
  {
    controlId: 'GDPR-24.1',
    name: 'Risk-Based Control Implementation',
    description:
      'Implement technical and organizational measures proportionate to the risks presented by processing activities.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Conduct risk assessments for all processing activities considering likelihood and severity of harm. Map control requirements to identified risks. Implement controls proportionate to risk levels. Document control selection rationale. Review and adjust controls as risks evolve.',
    evidenceRequirements: [
      'Processing activity risk assessments',
      'Risk to control mapping',
      'Control implementation evidence proportionate to risk',
      'Control selection rationale documentation',
      'Control review and adjustment records',
    ],
    testProcedures: [
      'Review risk assessments for thoroughness',
      'Verify controls map to identified risks',
      'Assess control proportionality to risk levels',
      'Review selection rationale documentation',
      'Confirm controls are reviewed as risks change',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-24.2',
    name: 'Compliance Demonstration',
    description:
      'Maintain comprehensive documentation to demonstrate compliance with GDPR requirements.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Establish a compliance evidence repository with organized structure. Document policies, procedures, assessments, and operational records. Implement version control and retention for compliance artifacts. Prepare compliance documentation for supervisory authority requests. Conduct periodic completeness reviews of compliance documentation.',
    evidenceRequirements: [
      'Compliance evidence repository structure',
      'Policy and procedure documentation',
      'Assessment and operational records',
      'Version control and retention records',
      'Completeness review records',
    ],
    testProcedures: [
      'Review repository organization for accessibility',
      'Verify policy and procedure documentation completeness',
      'Sample assessment and operational records',
      'Confirm version control is maintained',
      'Review completeness assessment findings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-25.1',
    name: 'Privacy by Design Integration',
    description:
      'Integrate data protection requirements into system and process design from the earliest stages.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Embed privacy requirements in project initiation and design phases. Implement privacy design patterns and reference architectures. Conduct privacy design reviews before development proceeds. Apply the eight privacy by design principles systematically. Document privacy design decisions and trade-offs.',
    evidenceRequirements: [
      'Privacy requirements in project initiation',
      'Privacy design patterns documentation',
      'Privacy design review records',
      'Privacy by design principle application evidence',
      'Design decision documentation',
    ],
    testProcedures: [
      'Verify privacy requirements in project initiation',
      'Review design patterns for appropriateness',
      'Sample privacy design reviews for quality',
      'Assess principle application consistency',
      'Review design decision documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-25.2',
    name: 'Privacy by Default Configuration',
    description:
      'Configure systems to process minimum personal data by default without requiring user action.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Set default privacy settings to most protective options. Limit default data collection to strict necessity. Disable optional data sharing by default. Implement default retention limits at system level. Review default configurations against privacy by default principles regularly.',
    evidenceRequirements: [
      'Default privacy setting documentation',
      'Default data collection configuration',
      'Default sharing setting documentation',
      'Default retention configuration',
      'Configuration review records',
    ],
    testProcedures: [
      'Test default privacy settings for protection level',
      'Verify default data collection minimization',
      'Test default sharing settings',
      'Review default retention configurations',
      'Confirm regular configuration reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-28.1',
    name: 'Processor Selection Due Diligence',
    description:
      'Conduct comprehensive due diligence on processors before engagement to verify sufficient guarantees.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop processor assessment criteria covering technical and organizational security measures. Evaluate processor certifications, audit reports, and compliance documentation. Assess processor experience and reputation in handling personal data. Verify processor sub-processor management practices. Document due diligence findings and engagement decisions.',
    evidenceRequirements: [
      'Processor assessment criteria',
      'Certification and audit report reviews',
      'Experience and reputation assessment',
      'Sub-processor management evaluation',
      'Due diligence findings documentation',
    ],
    testProcedures: [
      'Review assessment criteria for comprehensiveness',
      'Verify certification and audit review process',
      'Assess experience evaluation methodology',
      'Review sub-processor management assessments',
      'Sample due diligence documentation for thoroughness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-28.2',
    name: 'Data Processing Agreement Management',
    description:
      'Implement comprehensive management of Data Processing Agreements throughout the processor relationship lifecycle.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop DPA templates covering all Art. 28(3) mandatory clauses. Implement DPA negotiation procedures and approval workflows. Maintain a DPA register with execution dates and renewal tracking. Implement DPA amendment procedures for relationship changes. Conduct periodic DPA compliance reviews.',
    evidenceRequirements: [
      'DPA templates with Art. 28(3) clauses',
      'Negotiation and approval workflow documentation',
      'DPA register with tracking information',
      'Amendment procedures documentation',
      'DPA compliance review records',
    ],
    testProcedures: [
      'Audit DPA templates against Art. 28(3) requirements',
      'Test negotiation and approval workflows',
      'Verify DPA register completeness and accuracy',
      'Review amendment procedure compliance',
      'Sample DPA compliance reviews for quality',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-30.1',
    name: 'RoPA Development and Maintenance',
    description:
      'Develop and maintain a comprehensive Record of Processing Activities meeting all Art. 30 requirements.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Implement a centralized RoPA management system or tool. Define required fields covering all Art. 30(1) elements. Assign process owners responsible for maintaining their entries. Establish RoPA update triggers and procedures. Implement review cycles ensuring RoPA accuracy and currency.',
    evidenceRequirements: [
      'RoPA management system documentation',
      'Required field definitions and mapping to Art. 30(1)',
      'Process owner assignments',
      'Update trigger and procedure documentation',
      'Review cycle records',
    ],
    testProcedures: [
      'Review RoPA system for functionality',
      'Verify fields cover all Art. 30(1) requirements',
      'Confirm process owner assignments are complete',
      'Test update trigger and procedures',
      'Review cycle compliance and accuracy checks',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-32.1',
    name: 'Security Risk Assessment',
    description:
      'Conduct comprehensive security risk assessments to determine appropriate security measures for personal data processing.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop risk assessment methodology considering Art. 32 factors. Assess risks to confidentiality, integrity, and availability. Evaluate likelihood and severity of potential harm to data subjects. Identify appropriate security measures to address identified risks. Document risk assessments and treatment decisions.',
    evidenceRequirements: [
      'Risk assessment methodology documentation',
      'CIA risk assessment records',
      'Harm likelihood and severity analysis',
      'Security measure identification and selection',
      'Risk treatment documentation',
    ],
    testProcedures: [
      'Review methodology against Art. 32 factors',
      'Verify CIA risks are assessed',
      'Assess harm analysis thoroughness',
      'Review security measure selection rationale',
      'Sample risk treatment documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-32.2',
    name: 'Security Testing and Evaluation',
    description:
      'Implement regular testing and evaluation of security measures to ensure continued effectiveness.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Establish a security testing program covering technical and organizational measures. Conduct regular vulnerability assessments and penetration testing. Test incident response and business continuity procedures. Evaluate security awareness training effectiveness. Document testing results and remediation actions.',
    evidenceRequirements: [
      'Security testing program documentation',
      'Vulnerability assessment and penetration test reports',
      'Incident response and continuity test records',
      'Training effectiveness evaluation records',
      'Remediation action documentation',
    ],
    testProcedures: [
      'Review security testing program coverage',
      'Verify regular vulnerability and penetration testing',
      'Review incident and continuity test results',
      'Assess training effectiveness evaluation methodology',
      'Confirm remediation actions are completed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-33.1',
    name: 'Breach Detection Capabilities',
    description:
      'Implement technical and procedural capabilities to detect personal data breaches promptly.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Deploy security monitoring and alerting systems. Implement log analysis and anomaly detection. Establish reporting channels for employees to report suspected breaches. Define breach indicators and detection criteria. Conduct regular detection capability testing.',
    evidenceRequirements: [
      'Security monitoring system documentation',
      'Log analysis and anomaly detection configuration',
      'Employee reporting channel documentation',
      'Breach indicator definitions',
      'Detection capability test records',
    ],
    testProcedures: [
      'Review monitoring system coverage',
      'Test log analysis and anomaly detection',
      'Verify employee reporting channel accessibility',
      'Review breach indicator definitions for completeness',
      'Assess detection capability test results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-33.2',
    name: 'Breach Assessment Process',
    description:
      'Implement systematic processes to assess breach severity and notification requirements.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop breach severity assessment criteria aligned with regulatory guidance. Implement risk to data subjects evaluation procedures. Define notification threshold criteria for supervisory authority and data subject notification. Establish assessment timelines supporting 72-hour notification requirement. Document assessment outcomes and notification decisions.',
    evidenceRequirements: [
      'Breach severity assessment criteria',
      'Data subject risk evaluation procedures',
      'Notification threshold criteria',
      'Assessment timeline documentation',
      'Assessment and notification decision records',
    ],
    testProcedures: [
      'Review severity criteria against regulatory guidance',
      'Test risk evaluation procedures',
      'Verify notification threshold application',
      'Assess timeline compliance capability',
      'Sample assessment documentation for quality',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-35.1',
    name: 'DPIA Screening Process',
    description:
      'Implement screening processes to identify processing activities requiring Data Protection Impact Assessments.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop DPIA screening criteria based on Art. 35(3) and supervisory authority lists. Integrate screening into project and change management processes. Require screening completion before new processing can proceed. Implement screening review and approval procedures. Track screening outcomes and DPIA requirements.',
    evidenceRequirements: [
      'DPIA screening criteria documentation',
      'Process integration evidence',
      'Screening completion requirements',
      'Review and approval procedures',
      'Screening outcome tracking records',
    ],
    testProcedures: [
      'Review screening criteria against Art. 35(3) and SA lists',
      'Verify process integration effectiveness',
      'Confirm screening completion is required',
      'Test review and approval procedures',
      'Review outcome tracking for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-35.2',
    name: 'DPIA Methodology',
    description:
      'Implement a standardized DPIA methodology covering all required elements and producing quality assessments.',
    category: 'Controller Obligations',
    implementationGuidance:
      'Develop DPIA templates covering Art. 35(7) required elements. Implement systematic risk identification and assessment procedures. Establish measure identification and residual risk evaluation processes. Require DPO involvement in DPIA conduct. Implement DPIA quality review procedures.',
    evidenceRequirements: [
      'DPIA templates with Art. 35(7) elements',
      'Risk identification and assessment procedures',
      'Measure and residual risk evaluation processes',
      'DPO involvement documentation',
      'Quality review procedures and records',
    ],
    testProcedures: [
      'Audit templates against Art. 35(7) requirements',
      'Test risk identification comprehensiveness',
      'Review measure evaluation processes',
      'Verify DPO involvement is documented',
      'Sample DPIA quality reviews',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended International Transfer Controls
  // ============================================================
  {
    controlId: 'GDPR-44.1',
    name: 'Transfer Mapping and Inventory',
    description:
      'Maintain a comprehensive inventory of all international personal data transfers.',
    category: 'International Transfers',
    implementationGuidance:
      'Identify all transfers of personal data outside the EEA. Document transfer details including data categories, recipients, destination countries, and transfer mechanisms. Map transfers to processing activities in the RoPA. Implement transfer discovery processes for new or changed processing. Update transfer inventory regularly and when transfers change.',
    evidenceRequirements: [
      'International transfer inventory',
      'Transfer detail documentation',
      'RoPA to transfer mapping',
      'Transfer discovery procedures',
      'Inventory update records',
    ],
    testProcedures: [
      'Review transfer inventory for completeness',
      'Verify transfer detail accuracy',
      'Confirm RoPA mapping is complete',
      'Test transfer discovery processes',
      'Review inventory update frequency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-44.2',
    name: 'Transfer Mechanism Selection',
    description:
      'Implement processes to select appropriate transfer mechanisms for each international transfer.',
    category: 'International Transfers',
    implementationGuidance:
      'Assess available transfer mechanisms for each destination country. Prioritize adequacy decisions where available. Evaluate appropriate safeguard options including SCCs, BCRs, and certifications. Consider derogations only as last resort measures. Document mechanism selection and rationale.',
    evidenceRequirements: [
      'Transfer mechanism assessment process',
      'Adequacy decision reliance documentation',
      'Safeguard evaluation records',
      'Derogation necessity assessments',
      'Mechanism selection and rationale documentation',
    ],
    testProcedures: [
      'Review mechanism assessment process',
      'Verify adequacy decision reliance is correct',
      'Sample safeguard evaluations for thoroughness',
      'Review derogation necessity assessments',
      'Confirm selection rationale is documented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-46.1',
    name: 'Standard Contractual Clauses Implementation',
    description:
      'Implement Standard Contractual Clauses correctly as appropriate safeguards for international transfers.',
    category: 'International Transfers',
    implementationGuidance:
      'Use the European Commission approved SCC modules (June 2021). Select appropriate modules based on transfer scenario (C2C, C2P, P2P, P2C). Complete all required annexes with transfer-specific details. Execute SCCs before transfers commence. Implement SCC obligations including audit rights and sub-processor management.',
    evidenceRequirements: [
      'Executed SCCs with correct module selection',
      'Completed annexes with transfer details',
      'SCC execution timing records',
      'Obligation implementation evidence',
      'Sub-processor SCC flow-down records',
    ],
    testProcedures: [
      'Audit SCCs for correct module selection',
      'Verify annexes are complete and accurate',
      'Confirm SCCs executed before transfers began',
      'Test obligation implementation',
      'Review sub-processor SCC flow-down',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-46.2',
    name: 'Transfer Impact Assessment Execution',
    description:
      'Conduct Transfer Impact Assessments to evaluate whether safeguards can be complied with in destination countries.',
    category: 'International Transfers',
    implementationGuidance:
      'Develop TIA methodology aligned with EDPB guidance. Assess destination country legal framework including government access laws. Evaluate practical application of laws to the specific transfer. Identify supplementary measures needed to address identified gaps. Document TIA findings and conclusions.',
    evidenceRequirements: [
      'TIA methodology documentation',
      'Legal framework assessments per destination country',
      'Practical application analysis',
      'Supplementary measure identification',
      'TIA findings and conclusions documentation',
    ],
    testProcedures: [
      'Review TIA methodology against EDPB guidance',
      'Verify legal framework assessments are current',
      'Assess practical application analysis depth',
      'Review supplementary measure appropriateness',
      'Sample TIA documentation for quality',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Extended Operational Controls (OPS-55 through OPS-100)
  // ============================================================
  {
    controlId: 'GDPR-OPS-55',
    name: 'Privacy Risk Management Framework',
    description:
      'Establish a comprehensive framework for identifying, assessing, treating, and monitoring privacy risks across the organization.',
    category: 'Risk Management',
    implementationGuidance:
      'Develop a privacy risk management methodology aligned with enterprise risk management. Define privacy risk categories, likelihood scales, and impact criteria. Implement risk identification processes covering all processing activities. Establish risk treatment options and acceptance criteria. Conduct periodic risk reassessments and report to governance.',
    evidenceRequirements: [
      'Privacy risk management methodology',
      'Risk category and scale definitions',
      'Risk identification procedures and records',
      'Treatment options and acceptance criteria',
      'Risk reassessment and reporting records',
    ],
    testProcedures: [
      'Review methodology for comprehensiveness',
      'Verify risk definitions are appropriate',
      'Test risk identification processes',
      'Assess treatment and acceptance criteria',
      'Review reassessment and reporting frequency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-56',
    name: 'Privacy Risk Register',
    description:
      'Maintain a comprehensive register of identified privacy risks with treatment status and ownership.',
    category: 'Risk Management',
    implementationGuidance:
      'Implement a privacy risk register capturing all identified risks. Document risk descriptions, assessments, owners, and treatment plans. Track risk status through treatment and closure. Link risks to processing activities and controls. Report risk register status to governance bodies.',
    evidenceRequirements: [
      'Privacy risk register with required fields',
      'Risk assessment documentation',
      'Treatment plan documentation',
      'Risk status tracking records',
      'Governance reporting records',
    ],
    testProcedures: [
      'Review risk register for completeness',
      'Sample risk assessments for quality',
      'Verify treatment plans are implemented',
      'Test status tracking accuracy',
      'Confirm governance reporting occurs',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-57',
    name: 'Data Mapping and Flow Documentation',
    description:
      'Maintain comprehensive documentation of personal data flows through the organization and to external parties.',
    category: 'Data Management',
    implementationGuidance:
      'Create data flow diagrams showing personal data movement through systems. Document data flows to and from third parties. Identify cross-border data flows requiring transfer mechanism assessment. Update data flow documentation when systems or processes change. Use data flow documentation to support DPIA and compliance activities.',
    evidenceRequirements: [
      'Data flow diagrams for personal data',
      'Third-party data flow documentation',
      'Cross-border flow identification',
      'Documentation update records',
      'DPIA and compliance use evidence',
    ],
    testProcedures: [
      'Review data flow diagrams for accuracy',
      'Verify third-party flows are documented',
      'Confirm cross-border flows are identified',
      'Test documentation update procedures',
      'Verify use in DPIA and compliance activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-58',
    name: 'Personal Data Asset Register',
    description:
      'Maintain a register of personal data assets including databases, files, and other data stores containing personal data.',
    category: 'Data Management',
    implementationGuidance:
      'Inventory all systems and storage locations containing personal data. Document data categories, volumes, and sensitivity classifications. Identify data owners and custodians for each asset. Map assets to processing activities in the RoPA. Conduct periodic asset discovery and register updates.',
    evidenceRequirements: [
      'Personal data asset register',
      'Data categorization and classification records',
      'Owner and custodian assignments',
      'RoPA to asset mapping',
      'Asset discovery and update records',
    ],
    testProcedures: [
      'Review asset register for completeness',
      'Verify categorization and classification accuracy',
      'Confirm owner assignments are current',
      'Test RoPA mapping accuracy',
      'Review discovery and update frequency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-59',
    name: 'Data Quality Management Program',
    description:
      'Implement a comprehensive program to maintain personal data quality including accuracy, completeness, and currency.',
    category: 'Data Management',
    implementationGuidance:
      'Define data quality dimensions and standards for personal data. Implement data quality monitoring and measurement. Establish data quality issue identification and remediation procedures. Provide mechanisms for data subjects to update their data. Report data quality metrics to governance.',
    evidenceRequirements: [
      'Data quality standards documentation',
      'Quality monitoring configuration and reports',
      'Issue identification and remediation records',
      'Data subject update mechanism documentation',
      'Quality metric reporting records',
    ],
    testProcedures: [
      'Review data quality standards for appropriateness',
      'Test quality monitoring effectiveness',
      'Verify issue remediation procedures',
      'Test data subject update mechanisms',
      'Review quality metric reporting',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-60',
    name: 'Data Disposal and Destruction',
    description:
      'Implement secure data disposal and destruction procedures for personal data reaching end of retention.',
    category: 'Data Management',
    implementationGuidance:
      'Define secure disposal standards for different media types. Implement destruction procedures for electronic and physical data. Verify destruction through certificates or verification processes. Maintain destruction records without retaining the destroyed personal data. Address disposal of data held by third parties.',
    evidenceRequirements: [
      'Secure disposal standards by media type',
      'Destruction procedures documentation',
      'Destruction verification records',
      'Destruction log records',
      'Third-party disposal procedures',
    ],
    testProcedures: [
      'Review disposal standards for adequacy',
      'Test destruction procedure compliance',
      'Verify destruction verification process',
      'Sample destruction logs for completeness',
      'Review third-party disposal procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-61',
    name: 'Privacy Engineering Standards',
    description:
      'Establish technical standards and patterns for implementing privacy requirements in systems and applications.',
    category: 'Technical Controls',
    implementationGuidance:
      'Develop privacy engineering standards covering data minimization, encryption, access control, and audit logging. Create reusable privacy design patterns and components. Implement privacy-aware development frameworks and libraries. Provide privacy engineering guidance and training for developers. Review and update standards as technology evolves.',
    evidenceRequirements: [
      'Privacy engineering standards documentation',
      'Design pattern and component library',
      'Framework and library documentation',
      'Developer training records',
      'Standards review and update records',
    ],
    testProcedures: [
      'Review standards for comprehensiveness',
      'Assess design pattern applicability',
      'Test framework and library usage',
      'Verify developer training completion',
      'Confirm standards are periodically updated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-62',
    name: 'Privacy API and Interface Standards',
    description:
      'Establish standards for privacy-respecting APIs and system interfaces handling personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Define API security standards including authentication, authorization, and encryption. Implement data minimization in API responses. Establish audit logging requirements for API access. Define rate limiting and abuse prevention measures. Review third-party APIs for privacy compliance.',
    evidenceRequirements: [
      'API security standards documentation',
      'Data minimization implementation in APIs',
      'API audit logging configuration',
      'Rate limiting and abuse prevention documentation',
      'Third-party API compliance reviews',
    ],
    testProcedures: [
      'Review API security standards',
      'Test data minimization in API responses',
      'Verify API audit logging',
      'Test rate limiting effectiveness',
      'Sample third-party API compliance reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-63',
    name: 'Database Privacy Controls',
    description:
      'Implement privacy-specific controls for databases storing personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Implement column-level encryption for sensitive personal data. Configure row-level security where applicable. Implement data masking for non-production access. Configure audit logging for personal data access. Implement database access controls aligned with least privilege.',
    evidenceRequirements: [
      'Column-level encryption configuration',
      'Row-level security implementation',
      'Data masking configuration for non-production',
      'Database audit logging configuration',
      'Access control configuration documentation',
    ],
    testProcedures: [
      'Test column-level encryption effectiveness',
      'Verify row-level security enforcement',
      'Test data masking in non-production',
      'Review database audit logs',
      'Test access control enforcement',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-64',
    name: 'Cloud Privacy Configuration',
    description:
      'Implement privacy-specific configurations for cloud services processing personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Configure data residency controls to limit personal data location. Implement cloud encryption with customer-managed keys where available. Configure cloud access controls and identity management. Enable cloud audit logging and monitoring. Review cloud security configurations regularly.',
    evidenceRequirements: [
      'Data residency configuration documentation',
      'Encryption configuration with key management',
      'Cloud access control configuration',
      'Audit logging and monitoring configuration',
      'Configuration review records',
    ],
    testProcedures: [
      'Verify data residency controls',
      'Test encryption configuration',
      'Review access control effectiveness',
      'Verify audit logging completeness',
      'Confirm regular configuration reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-65',
    name: 'Network Privacy Controls',
    description:
      'Implement network-level controls to protect personal data in transit and restrict unauthorized access.',
    category: 'Technical Controls',
    implementationGuidance:
      'Implement network segmentation for systems processing personal data. Configure firewall rules limiting access to personal data systems. Implement TLS encryption for all network communications involving personal data. Deploy intrusion detection and prevention for personal data networks. Monitor network traffic for anomalous access patterns.',
    evidenceRequirements: [
      'Network segmentation documentation',
      'Firewall rule configuration',
      'TLS implementation evidence',
      'IDS/IPS deployment documentation',
      'Network monitoring configuration',
    ],
    testProcedures: [
      'Test network segmentation effectiveness',
      'Review firewall rules for appropriateness',
      'Verify TLS implementation',
      'Test IDS/IPS functionality',
      'Review network monitoring alerts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-66',
    name: 'Endpoint Privacy Controls',
    description:
      'Implement controls to protect personal data on endpoint devices including laptops, mobile devices, and workstations.',
    category: 'Technical Controls',
    implementationGuidance:
      'Implement full disk encryption on all devices storing personal data. Configure device access controls and strong authentication. Implement remote wipe capability for lost or stolen devices. Deploy endpoint detection and response solutions. Establish secure disposal procedures for end-of-life devices.',
    evidenceRequirements: [
      'Disk encryption deployment records',
      'Device access control configuration',
      'Remote wipe capability documentation',
      'EDR deployment documentation',
      'Device disposal procedures and records',
    ],
    testProcedures: [
      'Verify encryption deployment coverage',
      'Test device access controls',
      'Test remote wipe functionality',
      'Review EDR effectiveness',
      'Sample device disposal records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-67',
    name: 'Identity and Access Governance',
    description:
      'Implement comprehensive identity and access governance for systems processing personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Implement identity lifecycle management including provisioning, modification, and deprovisioning. Establish access request and approval workflows. Conduct periodic access certifications. Implement privileged access management. Monitor and alert on anomalous access patterns.',
    evidenceRequirements: [
      'Identity lifecycle management procedures',
      'Access request and approval workflow documentation',
      'Access certification records',
      'PAM implementation documentation',
      'Access monitoring and alerting configuration',
    ],
    testProcedures: [
      'Test identity lifecycle procedures',
      'Verify access approval workflows',
      'Review access certification completion',
      'Test PAM controls',
      'Review access monitoring alerts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-68',
    name: 'Multi-Factor Authentication',
    description:
      'Implement multi-factor authentication for access to systems containing personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Deploy MFA for all administrative access to personal data systems. Implement MFA for remote access and VPN connections. Require MFA for access to high-sensitivity personal data. Support multiple MFA methods for user convenience. Monitor and respond to MFA bypass attempts.',
    evidenceRequirements: [
      'MFA deployment for administrative access',
      'MFA for remote access configuration',
      'High-sensitivity data MFA requirements',
      'Supported MFA method documentation',
      'MFA bypass monitoring and response records',
    ],
    testProcedures: [
      'Test MFA enforcement for admin access',
      'Verify MFA for remote access',
      'Test high-sensitivity data MFA requirements',
      'Review MFA method availability',
      'Test bypass detection and response',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-69',
    name: 'Security Information and Event Management',
    description:
      'Implement SIEM capabilities for monitoring and analyzing security events related to personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Deploy SIEM solution with coverage of all personal data systems. Configure log collection from relevant sources. Develop detection rules for privacy-relevant events. Establish alert triage and investigation procedures. Retain security event data for appropriate periods.',
    evidenceRequirements: [
      'SIEM deployment documentation',
      'Log source coverage documentation',
      'Detection rule documentation',
      'Triage and investigation procedures',
      'Event retention configuration',
    ],
    testProcedures: [
      'Review SIEM deployment coverage',
      'Verify log source completeness',
      'Test detection rule effectiveness',
      'Review investigation procedure compliance',
      'Verify retention configuration',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-70',
    name: 'Data Loss Prevention',
    description:
      'Implement data loss prevention controls to detect and prevent unauthorized disclosure of personal data.',
    category: 'Technical Controls',
    implementationGuidance:
      'Deploy DLP solutions covering email, web, and endpoint channels. Define DLP policies for personal data categories. Configure detection rules for sensitive personal data patterns. Implement blocking or quarantine for high-risk violations. Monitor and investigate DLP alerts.',
    evidenceRequirements: [
      'DLP solution deployment documentation',
      'DLP policy definitions',
      'Detection rule configuration',
      'Blocking and quarantine configuration',
      'Alert monitoring and investigation records',
    ],
    testProcedures: [
      'Review DLP deployment coverage',
      'Test DLP policy effectiveness',
      'Verify detection rule accuracy',
      'Test blocking and quarantine functionality',
      'Review alert investigation quality',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-71',
    name: 'Privacy in Mergers and Acquisitions',
    description:
      'Implement privacy considerations in merger, acquisition, and divestiture activities.',
    category: 'Organizational Controls',
    implementationGuidance:
      'Integrate privacy due diligence into M&A processes. Assess target company privacy compliance and liabilities. Plan for data integration or separation privacy requirements. Update privacy notices and obtain consents where required for ownership changes. Address cross-border transfer implications of corporate transactions.',
    evidenceRequirements: [
      'M&A privacy due diligence procedures',
      'Target company privacy assessments',
      'Integration/separation privacy planning',
      'Privacy notice and consent update records',
      'Transfer assessment for corporate transactions',
    ],
    testProcedures: [
      'Review M&A privacy procedures',
      'Sample target company assessments',
      'Review integration planning documentation',
      'Verify notice and consent updates',
      'Assess transfer considerations in transactions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-72',
    name: 'Privacy in Outsourcing',
    description:
      'Implement privacy requirements in outsourcing arrangements where third parties process personal data.',
    category: 'Organizational Controls',
    implementationGuidance:
      'Include privacy requirements in outsourcing RFPs and contracts. Conduct privacy due diligence on outsourcing providers. Execute appropriate Data Processing Agreements. Implement ongoing oversight of outsourcing provider privacy compliance. Address transition-in and transition-out privacy requirements.',
    evidenceRequirements: [
      'Privacy requirements in outsourcing contracts',
      'Provider privacy due diligence records',
      'DPAs with outsourcing providers',
      'Ongoing compliance oversight records',
      'Transition privacy requirement documentation',
    ],
    testProcedures: [
      'Review outsourcing contract privacy requirements',
      'Sample provider due diligence records',
      'Audit DPAs for compliance',
      'Review oversight activities',
      'Assess transition requirements documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-73',
    name: 'Privacy in Product Development',
    description:
      'Integrate privacy requirements into product development processes to ensure privacy-respecting products.',
    category: 'Privacy by Design',
    implementationGuidance:
      'Include privacy requirements in product requirement documents. Conduct privacy design reviews for new product features. Implement privacy user experience design standards. Test products for privacy compliance before release. Collect and address privacy feedback from users.',
    evidenceRequirements: [
      'Privacy requirements in product documentation',
      'Privacy design review records',
      'Privacy UX design standards',
      'Pre-release privacy testing records',
      'User privacy feedback and response records',
    ],
    testProcedures: [
      'Review product requirements for privacy',
      'Sample privacy design reviews',
      'Assess privacy UX standards application',
      'Review pre-release privacy testing',
      'Review user feedback handling',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-74',
    name: 'Privacy Dashboard and Self-Service',
    description:
      'Implement self-service capabilities enabling data subjects to manage their privacy preferences and exercise rights.',
    category: 'Data Subject Rights',
    implementationGuidance:
      'Develop privacy dashboard interfaces for data subjects. Enable self-service access to personal data held. Provide preference management for consent and marketing. Enable self-service data correction and updates. Implement self-service data deletion where appropriate.',
    evidenceRequirements: [
      'Privacy dashboard implementation',
      'Self-service data access functionality',
      'Preference management capabilities',
      'Self-service correction functionality',
      'Self-service deletion capabilities',
    ],
    testProcedures: [
      'Test privacy dashboard usability',
      'Verify self-service access functionality',
      'Test preference management effectiveness',
      'Test self-service correction process',
      'Verify self-service deletion functionality',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-75',
    name: 'Privacy Communications Strategy',
    description:
      'Develop and implement a strategy for privacy communications with data subjects and stakeholders.',
    category: 'Transparency',
    implementationGuidance:
      'Define privacy communication principles and standards. Develop communication templates for common scenarios. Establish communication channels for privacy matters. Train staff on privacy communications. Monitor communication effectiveness and adjust as needed.',
    evidenceRequirements: [
      'Privacy communication principles documentation',
      'Communication template library',
      'Communication channel documentation',
      'Staff training records',
      'Communication effectiveness monitoring records',
    ],
    testProcedures: [
      'Review communication principles for appropriateness',
      'Sample communication templates for quality',
      'Verify communication channel accessibility',
      'Confirm staff training completion',
      'Review effectiveness monitoring results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-76',
    name: 'Privacy Stakeholder Management',
    description:
      'Identify and manage relationships with key privacy stakeholders including regulators, industry groups, and advocacy organizations.',
    category: 'Governance',
    implementationGuidance:
      'Identify key privacy stakeholders and their interests. Develop stakeholder engagement strategies. Participate in industry privacy initiatives and standards development. Monitor advocacy organization activities and concerns. Report stakeholder engagement to governance.',
    evidenceRequirements: [
      'Stakeholder identification and mapping',
      'Engagement strategy documentation',
      'Industry initiative participation records',
      'Advocacy monitoring records',
      'Governance reporting on stakeholder engagement',
    ],
    testProcedures: [
      'Review stakeholder mapping for completeness',
      'Assess engagement strategy appropriateness',
      'Verify industry participation',
      'Review advocacy monitoring currency',
      'Confirm governance reporting occurs',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-77',
    name: 'Privacy Budget and Resource Management',
    description:
      'Establish and manage budget and resources necessary for effective privacy program operation.',
    category: 'Governance',
    implementationGuidance:
      'Develop annual privacy program budget aligned with program needs. Allocate resources for privacy staff, tools, and initiatives. Track budget utilization and adjust as needed. Plan for privacy investments in response to regulatory changes. Report resource allocation to governance.',
    evidenceRequirements: [
      'Annual privacy budget documentation',
      'Resource allocation records',
      'Budget utilization tracking',
      'Investment planning documentation',
      'Governance resource reporting',
    ],
    testProcedures: [
      'Review budget for program alignment',
      'Verify resource allocation is adequate',
      'Review budget utilization tracking',
      'Assess investment planning for regulatory responsiveness',
      'Confirm governance reporting on resources',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-78',
    name: 'Privacy Technology Strategy',
    description:
      'Develop and implement a strategy for privacy-enabling technologies supporting compliance and operations.',
    category: 'Technical Controls',
    implementationGuidance:
      'Assess current privacy technology capabilities and gaps. Evaluate privacy technology market and emerging solutions. Develop privacy technology roadmap aligned with program needs. Implement selected privacy technologies with proper change management. Monitor technology effectiveness and adjust strategy.',
    evidenceRequirements: [
      'Current state technology assessment',
      'Technology market evaluation',
      'Privacy technology roadmap',
      'Technology implementation records',
      'Effectiveness monitoring records',
    ],
    testProcedures: [
      'Review current state assessment for accuracy',
      'Assess market evaluation thoroughness',
      'Review roadmap for strategic alignment',
      'Verify technology implementations',
      'Review effectiveness monitoring results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-79',
    name: 'Automated Privacy Compliance Monitoring',
    description:
      'Implement automated monitoring capabilities to detect privacy compliance issues proactively.',
    category: 'Technical Controls',
    implementationGuidance:
      'Identify key privacy compliance indicators suitable for automated monitoring. Deploy monitoring tools and configure detection rules. Establish alert thresholds and notification procedures. Implement remediation workflows for detected issues. Report monitoring results to governance.',
    evidenceRequirements: [
      'Compliance indicator identification',
      'Monitoring tool deployment documentation',
      'Detection rule and threshold configuration',
      'Alert and notification procedures',
      'Governance monitoring reports',
    ],
    testProcedures: [
      'Review compliance indicators for relevance',
      'Verify monitoring tool deployment',
      'Test detection rule effectiveness',
      'Verify alert procedures function correctly',
      'Review governance reporting frequency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-80',
    name: 'Privacy Incident Lessons Learned',
    description:
      'Implement processes to capture and apply lessons learned from privacy incidents to prevent recurrence.',
    category: 'Incident Management',
    implementationGuidance:
      'Conduct post-incident reviews for significant privacy incidents. Identify root causes and contributing factors. Develop and implement corrective and preventive actions. Share lessons learned across the organization. Track effectiveness of implemented improvements.',
    evidenceRequirements: [
      'Post-incident review procedures and records',
      'Root cause analysis documentation',
      'Corrective and preventive action records',
      'Lessons learned communication records',
      'Improvement effectiveness tracking',
    ],
    testProcedures: [
      'Review post-incident review coverage',
      'Assess root cause analysis quality',
      'Verify corrective actions are implemented',
      'Confirm lessons learned are communicated',
      'Review improvement effectiveness tracking',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-81',
    name: 'Privacy Crisis Management',
    description:
      'Establish capabilities to manage privacy crises including major breaches and regulatory enforcement actions.',
    category: 'Incident Management',
    implementationGuidance:
      'Define privacy crisis scenarios and escalation criteria. Establish crisis management team and procedures. Develop crisis communication templates and procedures. Conduct crisis management exercises. Maintain relationships with external crisis support resources.',
    evidenceRequirements: [
      'Crisis scenario and escalation documentation',
      'Crisis management team and procedures',
      'Crisis communication materials',
      'Crisis exercise records',
      'External support resource documentation',
    ],
    testProcedures: [
      'Review crisis scenarios for comprehensiveness',
      'Verify crisis team readiness',
      'Review communication materials for appropriateness',
      'Assess crisis exercise results',
      'Confirm external support relationships',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-82',
    name: 'Vendor Privacy Risk Monitoring',
    description:
      'Implement ongoing monitoring of vendor privacy risks throughout the vendor relationship.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Establish continuous monitoring of high-risk vendors. Monitor vendor security incidents and breach disclosures. Track vendor compliance certification renewals. Assess impact of vendor organizational changes. Implement re-assessment triggers for significant vendor changes.',
    evidenceRequirements: [
      'Continuous monitoring procedures',
      'Vendor incident monitoring records',
      'Certification tracking records',
      'Organizational change impact assessments',
      'Re-assessment trigger documentation',
    ],
    testProcedures: [
      'Review monitoring procedures for high-risk vendors',
      'Verify incident monitoring effectiveness',
      'Confirm certification tracking is current',
      'Review organizational change assessments',
      'Test re-assessment trigger activation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-83',
    name: 'Vendor Privacy Performance Management',
    description:
      'Implement processes to measure and manage vendor privacy performance against contractual and regulatory requirements.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Define vendor privacy performance metrics and standards. Conduct periodic vendor privacy performance reviews. Address performance deficiencies through corrective action plans. Report vendor performance to governance. Consider performance in vendor renewal decisions.',
    evidenceRequirements: [
      'Vendor performance metrics and standards',
      'Performance review records',
      'Corrective action plan records',
      'Governance performance reporting',
      'Performance consideration in renewals',
    ],
    testProcedures: [
      'Review performance metrics for appropriateness',
      'Verify performance reviews are conducted',
      'Assess corrective action effectiveness',
      'Confirm governance receives performance reports',
      'Review renewal decision documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-84',
    name: 'Vendor Exit and Transition Management',
    description:
      'Implement procedures for managing privacy requirements during vendor exit and transition activities.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Develop vendor exit planning procedures including data return and deletion. Verify data deletion or return at vendor relationship end. Address transition privacy requirements for vendor changes. Maintain documentation of exit activities and verifications. Plan for business continuity during vendor transitions.',
    evidenceRequirements: [
      'Vendor exit planning procedures',
      'Data deletion and return verification records',
      'Transition privacy requirement documentation',
      'Exit activity documentation',
      'Business continuity planning for transitions',
    ],
    testProcedures: [
      'Review exit planning procedures',
      'Verify data deletion/return verification',
      'Review transition privacy requirements',
      'Sample exit documentation for completeness',
      'Assess business continuity planning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-85',
    name: 'Privacy in Artificial Intelligence Governance',
    description:
      'Establish governance structures for privacy in artificial intelligence and machine learning systems.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Establish AI governance committee with privacy representation. Define AI privacy principles and requirements. Implement AI system registration and approval processes. Require privacy impact assessment for AI systems. Monitor AI system privacy performance.',
    evidenceRequirements: [
      'AI governance structure documentation',
      'AI privacy principles and requirements',
      'AI registration and approval records',
      'AI privacy impact assessments',
      'AI privacy performance monitoring records',
    ],
    testProcedures: [
      'Review AI governance structure effectiveness',
      'Verify AI privacy principles are applied',
      'Test registration and approval processes',
      'Sample AI privacy impact assessments',
      'Review privacy performance monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-86',
    name: 'AI Training Data Privacy',
    description:
      'Implement controls to ensure privacy compliance in AI and machine learning training data.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Document lawful basis for training data collection and use. Implement data minimization in training data selection. Apply anonymization or pseudonymization to training data where appropriate. Address bias and fairness in training data. Maintain training data provenance records.',
    evidenceRequirements: [
      'Training data lawful basis documentation',
      'Data minimization in training data selection',
      'Anonymization/pseudonymization application',
      'Bias and fairness assessments',
      'Training data provenance records',
    ],
    testProcedures: [
      'Review training data lawful basis',
      'Verify data minimization in training data',
      'Test anonymization/pseudonymization effectiveness',
      'Assess bias and fairness evaluations',
      'Review provenance record completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-87',
    name: 'AI Model Explainability',
    description:
      'Implement capabilities to explain AI model decisions to data subjects as required by GDPR.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Implement explainability techniques appropriate to model types. Develop explanations suitable for data subject understanding. Provide model logic information in privacy notices. Enable individual decision explanations on request. Document explainability capabilities and limitations.',
    evidenceRequirements: [
      'Explainability technique implementation',
      'Data subject-appropriate explanations',
      'Privacy notice model logic information',
      'Individual explanation request handling',
      'Capability and limitation documentation',
    ],
    testProcedures: [
      'Test explainability technique effectiveness',
      'Assess explanation comprehensibility',
      'Review privacy notice model information',
      'Test individual explanation requests',
      'Review capability documentation accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-88',
    name: 'Blockchain and Distributed Ledger Privacy',
    description:
      'Implement privacy controls for personal data processed using blockchain and distributed ledger technologies.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Assess GDPR compliance challenges for blockchain use cases involving personal data. Implement off-chain storage for personal data where appropriate. Apply encryption and access controls to on-chain personal data. Address immutability challenges for erasure and rectification rights. Document privacy architecture decisions for blockchain implementations.',
    evidenceRequirements: [
      'Blockchain GDPR compliance assessments',
      'Off-chain storage implementation documentation',
      'On-chain encryption and access controls',
      'Erasure and rectification approach documentation',
      'Privacy architecture decision records',
    ],
    testProcedures: [
      'Review blockchain compliance assessments',
      'Verify off-chain storage implementation',
      'Test on-chain encryption and access controls',
      'Assess erasure/rectification approach viability',
      'Review architecture decision documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-89',
    name: 'Edge Computing Privacy',
    description:
      'Implement privacy controls for personal data processed at the edge in distributed computing environments.',
    category: 'Emerging Technology',
    implementationGuidance:
      'Assess privacy requirements for edge computing use cases. Implement data minimization at edge devices. Apply encryption for edge data storage and transmission. Address data subject rights for edge-processed data. Monitor edge device privacy compliance.',
    evidenceRequirements: [
      'Edge computing privacy assessments',
      'Data minimization at edge implementation',
      'Edge encryption configuration',
      'Data subject rights procedures for edge data',
      'Edge privacy compliance monitoring',
    ],
    testProcedures: [
      'Review edge computing privacy assessments',
      'Verify data minimization at edge',
      'Test edge encryption implementation',
      'Test data subject rights for edge data',
      'Review compliance monitoring effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-90',
    name: 'Privacy in Customer Relationship Management',
    description:
      'Implement privacy controls specific to CRM systems containing customer personal data.',
    category: 'Application Privacy',
    implementationGuidance:
      'Assess CRM system privacy configuration options. Implement consent tracking in CRM. Configure data retention and deletion capabilities. Implement access controls based on customer relationship. Enable data subject rights fulfillment through CRM.',
    evidenceRequirements: [
      'CRM privacy configuration documentation',
      'Consent tracking implementation',
      'Retention and deletion configuration',
      'Access control configuration',
      'DSR fulfillment capability documentation',
    ],
    testProcedures: [
      'Review CRM privacy configuration',
      'Test consent tracking functionality',
      'Verify retention and deletion capabilities',
      'Test access control enforcement',
      'Test DSR fulfillment through CRM',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-91',
    name: 'Privacy in Human Resources Systems',
    description:
      'Implement privacy controls specific to HR systems containing employee personal data.',
    category: 'Application Privacy',
    implementationGuidance:
      'Assess HR system privacy configuration requirements. Implement role-based access limiting data exposure. Configure retention aligned with employment law requirements. Enable employee data subject rights through HR systems. Address special category employee data with enhanced controls.',
    evidenceRequirements: [
      'HR system privacy configuration documentation',
      'Role-based access implementation',
      'Retention configuration documentation',
      'Employee DSR capability documentation',
      'Special category data controls',
    ],
    testProcedures: [
      'Review HR privacy configuration',
      'Test role-based access effectiveness',
      'Verify retention configuration compliance',
      'Test employee DSR capabilities',
      'Verify special category data controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-92',
    name: 'Privacy in Financial Systems',
    description:
      'Implement privacy controls specific to financial systems containing customer and transaction data.',
    category: 'Application Privacy',
    implementationGuidance:
      'Assess financial system privacy requirements considering regulatory overlap. Implement transaction data minimization. Configure retention aligned with financial regulations and GDPR. Apply enhanced security for financial personal data. Address cross-border transfer requirements for financial data.',
    evidenceRequirements: [
      'Financial system privacy assessment',
      'Transaction data minimization implementation',
      'Retention configuration documentation',
      'Enhanced security documentation',
      'Cross-border transfer assessment',
    ],
    testProcedures: [
      'Review financial system privacy assessment',
      'Test transaction data minimization',
      'Verify retention compliance',
      'Test enhanced security controls',
      'Review cross-border transfer compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-93',
    name: 'Privacy in Analytics and Business Intelligence',
    description:
      'Implement privacy controls for analytics and business intelligence systems processing personal data.',
    category: 'Application Privacy',
    implementationGuidance:
      'Assess analytics use cases for privacy requirements. Implement aggregation and anonymization for analytics where feasible. Configure access controls for analytics containing personal data. Apply purpose limitation to analytics data use. Document analytics privacy controls and limitations.',
    evidenceRequirements: [
      'Analytics privacy assessment documentation',
      'Aggregation and anonymization implementation',
      'Analytics access control configuration',
      'Purpose limitation documentation',
      'Privacy control and limitation documentation',
    ],
    testProcedures: [
      'Review analytics privacy assessments',
      'Test aggregation and anonymization effectiveness',
      'Verify analytics access controls',
      'Review purpose limitation enforcement',
      'Assess control documentation accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-94',
    name: 'Social Media Privacy Management',
    description:
      'Implement controls for managing privacy in social media marketing and customer engagement activities.',
    category: 'Marketing Compliance',
    implementationGuidance:
      'Assess privacy requirements for social media activities. Implement consent management for social media tracking. Address data sharing with social media platforms in privacy notices. Respond to data subject rights for social media collected data. Monitor social media platform privacy policy changes.',
    evidenceRequirements: [
      'Social media privacy assessment',
      'Consent management for social tracking',
      'Privacy notice social media disclosures',
      'DSR procedures for social media data',
      'Platform policy monitoring records',
    ],
    testProcedures: [
      'Review social media privacy assessment',
      'Test consent management for social tracking',
      'Verify privacy notice social disclosures',
      'Test DSR procedures for social data',
      'Review policy monitoring currency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-95',
    name: 'Email Marketing Privacy',
    description:
      'Implement privacy and consent management controls for email marketing activities.',
    category: 'Marketing Compliance',
    implementationGuidance:
      'Implement opt-in consent collection for marketing emails. Provide easy and effective unsubscribe mechanisms. Maintain suppression lists across marketing systems. Track consent and preferences in marketing databases. Document email marketing privacy compliance.',
    evidenceRequirements: [
      'Opt-in consent collection evidence',
      'Unsubscribe mechanism documentation',
      'Suppression list management procedures',
      'Consent and preference tracking',
      'Email marketing compliance documentation',
    ],
    testProcedures: [
      'Test opt-in consent collection',
      'Verify unsubscribe mechanism effectiveness',
      'Test suppression list enforcement',
      'Review consent tracking accuracy',
      'Assess compliance documentation completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-96',
    name: 'Location Data Privacy',
    description:
      'Implement privacy controls for collection and processing of location data.',
    category: 'Special Data Types',
    implementationGuidance:
      'Assess location data collection necessity and minimize collection. Implement consent for location tracking where required. Provide clear notice about location data collection and use. Apply enhanced security for precise location data. Enable data subjects to control location sharing.',
    evidenceRequirements: [
      'Location data necessity assessment',
      'Location consent mechanism documentation',
      'Location privacy notice disclosures',
      'Enhanced security for location data',
      'Data subject location control capabilities',
    ],
    testProcedures: [
      'Review location data necessity assessment',
      'Test location consent mechanisms',
      'Verify location disclosures in notices',
      'Test location data security controls',
      'Verify data subject location controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-97',
    name: 'Children\'s Data Enhanced Protections',
    description:
      'Implement enhanced protections for processing children\'s personal data beyond basic consent requirements.',
    category: 'Special Data Types',
    implementationGuidance:
      'Implement age-appropriate privacy notices and consent mechanisms. Apply enhanced data minimization for children\'s data. Limit profiling and targeted advertising to children. Implement stricter retention limits for children\'s data. Provide child-friendly data subject rights mechanisms.',
    evidenceRequirements: [
      'Age-appropriate privacy documentation',
      'Enhanced data minimization for children',
      'Profiling and advertising limitation evidence',
      'Children\'s data retention limits',
      'Child-friendly rights mechanisms',
    ],
    testProcedures: [
      'Review age-appropriate privacy materials',
      'Test data minimization for children\'s data',
      'Verify profiling and advertising limitations',
      'Test retention limit enforcement',
      'Test child-friendly rights mechanisms',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-98',
    name: 'Genetic Data Privacy',
    description:
      'Implement enhanced privacy controls for processing genetic data as special category data.',
    category: 'Special Data Types',
    implementationGuidance:
      'Document Art. 9(2) exception for genetic data processing. Implement explicit consent mechanisms for genetic data. Apply enhanced security for genetic data storage and transmission. Address family member privacy implications. Limit genetic data retention and secondary use.',
    evidenceRequirements: [
      'Art. 9(2) exception documentation',
      'Explicit consent mechanism for genetic data',
      'Enhanced security implementation',
      'Family privacy consideration documentation',
      'Retention and secondary use limitations',
    ],
    testProcedures: [
      'Verify Art. 9(2) exception validity',
      'Test explicit consent mechanisms',
      'Test enhanced security controls',
      'Review family privacy considerations',
      'Verify retention and use limitations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-99',
    name: 'Trade Union Data Privacy',
    description:
      'Implement privacy controls for processing data revealing trade union membership.',
    category: 'Special Data Types',
    implementationGuidance:
      'Document Art. 9(2) exception for trade union data processing. Implement purpose limitation for trade union data. Apply strict access controls to trade union membership data. Address employee relations implications. Maintain confidentiality of union membership status.',
    evidenceRequirements: [
      'Art. 9(2) exception documentation',
      'Purpose limitation documentation',
      'Access control configuration',
      'Employee relations consideration documentation',
      'Confidentiality protection evidence',
    ],
    testProcedures: [
      'Verify Art. 9(2) exception validity',
      'Test purpose limitation enforcement',
      'Verify access control effectiveness',
      'Review employee relations considerations',
      'Test confidentiality protections',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'GDPR-OPS-100',
    name: 'Political and Religious Belief Data Privacy',
    description:
      'Implement privacy controls for processing data revealing political opinions or religious beliefs.',
    category: 'Special Data Types',
    implementationGuidance:
      'Document Art. 9(2) exception for political or religious data. Implement explicit consent where consent is the lawful basis. Apply strict access controls and need-to-know limitations. Prohibit discriminatory processing based on beliefs. Maintain enhanced confidentiality protections.',
    evidenceRequirements: [
      'Art. 9(2) exception documentation',
      'Explicit consent mechanisms where applicable',
      'Access control and need-to-know documentation',
      'Non-discrimination policy documentation',
      'Enhanced confidentiality protections',
    ],
    testProcedures: [
      'Verify Art. 9(2) exception validity',
      'Test explicit consent mechanisms',
      'Verify access control and need-to-know',
      'Review non-discrimination policy enforcement',
      'Test confidentiality protections',
    ],
    status: 'Not Started',
  },
];
