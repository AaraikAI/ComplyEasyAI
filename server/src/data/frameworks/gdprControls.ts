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
];
