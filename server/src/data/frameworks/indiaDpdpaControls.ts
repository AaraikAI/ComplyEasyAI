import { FrameworkControlTemplate } from './soc2Controls';

/**
 * India — Digital Personal Data Protection Act, 2023 (DPDP Act) and the
 * Digital Personal Data Protection Rules, 2025 (phased commencement).
 *
 * Applies to digital personal data processed within India and to processing
 * outside India connected with offering goods or services to Data Principals
 * in India (s.3). Obligations fall on Data Fiduciaries (s.8), with heightened
 * duties for Significant Data Fiduciaries (s.10) and for processing the data
 * of children and persons with disabilities (s.9). Data Principals hold rights
 * of access, correction, erasure, grievance redressal and nomination (ss.11-14).
 * Enforced by the Data Protection Board of India; penalties in the Schedule
 * reach INR 250 crore for a failure of security safeguards.
 *
 * Control ids cite the section (s.) of the Act and, where applicable, the Rule.
 * This framework replaces the earlier four-control "PDPB India" stub, which was
 * named after the superseded 2019 Bill; the key "PDPB" is retained as an alias.
 * Not to be confused with the Delaware Personal Data Privacy Act ("DPDPA").
 */
export const INDIA_DPDPA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Scope, Roles and Governance =====
  {
    controlId: 'IN-DPDPA-1.1',
    name: 'Territorial and Material Applicability Assessment',
    description: 'Determine whether processing falls within the Act: digital personal data processed in India (collected in digital form or digitised), or processing outside India connected with offering goods or services to Data Principals in India; and confirm exclusions for personal or domestic use and for data made publicly available by the Data Principal or under a legal obligation (s.3).',
    category: 'Scope and Governance',
    implementationGuidance: 'Inventory every system that processes personal data and record whether the data is digital or digitised, where processing occurs, and whether goods or services are offered to individuals in India. Document each exclusion relied upon with its basis. Re-run the assessment when entering new markets or launching new products.',
    evidenceRequirements: ['Applicability assessment with s.3 analysis per system', 'Exclusion register with legal basis', 'Assessment review log'],
    testProcedures: ['Sample systems and verify the applicability conclusion against s.3', 'Confirm exclusions are documented and still valid', 'Verify the assessment was refreshed after the last product or market change'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-1.2',
    name: 'Role Determination: Data Fiduciary, Data Processor, Significant Data Fiduciary',
    description: 'Classify the organisation for each processing activity as Data Fiduciary (determines purpose and means) or Data Processor (processes on behalf of a fiduciary), and monitor the factors under which the Central Government may notify the organisation as a Significant Data Fiduciary (s.2, s.10).',
    category: 'Scope and Governance',
    implementationGuidance: 'Record the role per processing activity with the reasoning. Where the organisation acts as processor, ensure the fiduciary relationship is governed by contract (s.8(2)). Track volume and sensitivity of data, risk to Data Principals and other s.10(1) factors that bear on SDF designation.',
    evidenceRequirements: ['Role register per processing activity', 'SDF designation factor assessment', 'Government notifications monitoring log'],
    testProcedures: ['Review role assignments for a sample of activities', 'Verify the SDF factor assessment is current', 'Confirm any SDF notification has been acted upon'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-1.3',
    name: 'Digital Personal Data Inventory and Sharing Map',
    description: 'Maintain an inventory of personal data processed, the purposes, and every other Data Fiduciary and Data Processor with whom personal data has been shared, sufficient to answer access requests (s.11) and to scope breach notifications (s.8(6)).',
    category: 'Scope and Governance',
    implementationGuidance: 'Build and maintain a processing inventory keyed by purpose, data categories, systems, recipients and retention. Capture identities of all fiduciaries and processors receiving data and a description of what is shared. Reconcile the inventory against integrations and vendor contracts at least annually.',
    evidenceRequirements: ['Processing inventory', 'Recipient and sharing map', 'Annual reconciliation record'],
    testProcedures: ['Trace a sample of integrations to inventory entries', 'Verify recipients listed match active data flows', 'Confirm reconciliation completed within the last year'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-1.4',
    name: 'Exemption Analysis and Documentation',
    description: 'Identify and document any reliance on exemptions in s.17, including processing for enforcing legal rights or claims, by courts and law-enforcement, for research, archiving or statistical purposes in accordance with prescribed standards, and any notification exempting startups or other classes of fiduciaries.',
    category: 'Scope and Governance',
    implementationGuidance: 'Do not assume an exemption applies; record the specific sub-section and the facts supporting it for each processing activity that relies on one. Review exemption reliance when the underlying purpose changes and when new notifications are issued.',
    evidenceRequirements: ['Exemption register with s.17 citations', 'Supporting facts per exemption', 'Periodic review evidence'],
    testProcedures: ['Verify each exemption cites a specific provision', 'Test that the facts relied upon still hold', 'Confirm exemptions are not applied beyond their scope'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-1.5',
    name: 'Accountability Programme and Board Oversight',
    description: 'Establish a DPDP compliance programme with named accountable ownership, reflecting that a Data Fiduciary remains responsible for compliance regardless of any agreement to the contrary or any failure of a Data Principal to perform duties (s.8(1)).',
    category: 'Scope and Governance',
    implementationGuidance: 'Assign executive ownership of DPDP compliance. Maintain policies covering notice, consent, security safeguards, breach response, rights handling and retention. Report compliance status and penalty exposure to the board or equivalent body at a defined cadence.',
    evidenceRequirements: ['Compliance programme charter', 'Policy set with approval records', 'Board reporting minutes'],
    testProcedures: ['Confirm accountable owner is designated', 'Review policy approvals and currency', 'Verify board reporting occurred as scheduled'],
    status: 'Not Started'
  },

  // ===== Lawful Grounds, Notice and Consent =====
  {
    controlId: 'IN-DPDPA-2.1',
    name: 'Lawful Ground Determination',
    description: 'Process personal data only for a lawful purpose for which the Data Principal has given consent or for a certain legitimate use listed in s.7 (s.4).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Record the lawful ground for every purpose before processing begins. Where consent is the ground, link to the notice and consent record. Where a legitimate use is relied on, cite the specific s.7 clause. Block processing that has no recorded ground.',
    evidenceRequirements: ['Purpose register with lawful ground per purpose', 'Consent or legitimate-use linkage', 'Pre-processing approval records'],
    testProcedures: ['Sample purposes and verify a lawful ground is recorded', 'Confirm consent-based purposes have matching consent records', 'Verify legitimate-use citations are appropriate'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.2',
    name: 'Certain Legitimate Uses Register',
    description: 'Where processing relies on s.7 rather than consent, document the specific legitimate use: voluntary provision of data for a specified purpose without indicating non-consent, State functions and benefits, compliance with law or court orders, medical emergencies, epidemics or disasters, or employment purposes and safeguarding the employer from loss.',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Maintain a register of every processing activity relying on s.7 with the clause, the facts supporting it and the limits of the use. Pay particular attention to employment processing: confine it to purposes of employment and protection of the employer. Review annually and on any change of purpose.',
    evidenceRequirements: ['Legitimate-use register', 'Employment processing scope statement', 'Annual review record'],
    testProcedures: ['Verify each entry cites a specific s.7 clause', 'Test that processing stays within the documented limits', 'Confirm the annual review was performed'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.3',
    name: 'Notice Content and Timing',
    description: 'Every request for consent is accompanied or preceded by a notice that is standalone, in clear and plain language, and itemises the personal data and the purposes, the goods, services or uses enabled, the manner of withdrawing consent and exercising rights, and how to complain to the Data Protection Board (s.5(1), Rule 3).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Design a notice template that itemises data categories against purposes rather than describing them generally. Present it independently of other information such as terms of service. Include a link to the website or app where withdrawal, rights requests and grievances can be made, and describe the route to the Board.',
    evidenceRequirements: ['Notice template and published notices', 'Data-to-purpose itemisation', 'Screenshots of notice placement relative to the consent request'],
    testProcedures: ['Review notices for every required element', 'Verify the notice is presented before or with the consent request', 'Test that withdrawal and rights links work'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.4',
    name: 'Notice for Consent Obtained Before Commencement',
    description: 'For consent obtained before the Act commenced, provide the s.5 notice as soon as reasonably practicable; processing may continue until the Data Principal withdraws consent (s.5(2)).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Identify legacy consents and schedule delivery of the compliant notice to those Data Principals. Record delivery and provide the same withdrawal mechanism as for new consents.',
    evidenceRequirements: ['Legacy consent inventory', 'Notice delivery records', 'Withdrawal mechanism availability for legacy consents'],
    testProcedures: ['Verify legacy consents were identified', 'Sample delivery records', 'Test withdrawal for a legacy consent'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.5',
    name: 'Multilingual Access to Notice and Consent Request',
    description: 'Give the Data Principal the option to access the notice and the consent request in English or any language specified in the Eighth Schedule to the Constitution (s.6(3)).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Provide a language selector for the notice and consent flow. Maintain reviewed translations; treat translation changes as notice changes subject to the same approval.',
    evidenceRequirements: ['Language options offered', 'Translation review records', 'Change control for translated notices'],
    testProcedures: ['Verify the language option is presented', 'Sample translations for accuracy against the English notice', 'Confirm translated notices are version-controlled'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.6',
    name: 'Consent Standard',
    description: 'Consent is free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, and signifies agreement only to processing necessary for the specified purpose; any part of a consent that infringes the Act is invalid to that extent (s.6(1)-(2)).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Use unticked, purpose-specific consent controls; do not bundle consent with acceptance of terms or condition a service on consent that is not necessary for it. Collect only the data necessary for the purpose consented to. Review consent flows with legal counsel against s.6.',
    evidenceRequirements: ['Consent flow designs', 'Purpose-specific consent configuration', 'Legal review of consent flows'],
    testProcedures: ['Walk through consent flows and verify affirmative action per purpose', 'Confirm no bundling or pre-ticked options', 'Verify data collected matches the consented purpose'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.7',
    name: 'Consent Withdrawal',
    description: 'Data Principals can withdraw consent at any time with ease comparable to that of giving it; on withdrawal the Data Fiduciary ceases processing within a reasonable time and causes its Data Processors to cease, unless processing without consent is required or authorised by law (s.6(4)-(6)).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Expose withdrawal wherever consent was given, with no more steps than giving consent. Propagate withdrawal to downstream systems and processors automatically and record completion. Explain the consequences of withdrawal in the notice.',
    evidenceRequirements: ['Withdrawal mechanism documentation', 'Processor propagation records', 'Cessation timelines and completion logs'],
    testProcedures: ['Compare withdrawal steps against consent steps', 'Test withdrawal and verify cessation in downstream systems', 'Confirm processors were instructed and confirmed'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.8',
    name: 'Consent Records and Burden of Proof',
    description: 'Retain evidence that notice was given and consent obtained: where a question arises the Data Fiduciary must prove it (s.6(10)).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Log the notice version shown, the consent given, the purposes, the timestamp, the language, the channel and any subsequent withdrawal. Retain records for the life of the processing plus the limitation period for claims.',
    evidenceRequirements: ['Consent ledger with notice version linkage', 'Retention policy for consent records', 'Sample proofs retrieved for individual Data Principals'],
    testProcedures: ['Retrieve proof of consent for sampled Data Principals', 'Verify the notice version shown can be reproduced', 'Confirm withdrawal events are linked to the original consent'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-2.9',
    name: 'Consent Manager Interoperability',
    description: 'Where consent is given, managed, reviewed or withdrawn through a Consent Manager registered with the Board, support the interoperable platform and remain accountable to the Data Principal for the processing (s.6(7)-(9), Rule 4, First Schedule).',
    category: 'Lawful Grounds, Notice and Consent',
    implementationGuidance: 'Assess whether Consent Manager integration is required for the products offered. Where integrated, implement the prescribed interoperability, honour withdrawals received through the manager in the same way as direct withdrawals, and verify the manager is registered with the Board.',
    evidenceRequirements: ['Consent Manager integration assessment', 'Registration verification of the Consent Manager', 'Withdrawal propagation tests via the manager'],
    testProcedures: ['Confirm the integration decision is documented', 'Verify the Consent Manager registration', 'Test that manager-originated withdrawals cease processing'],
    status: 'Not Started'
  },

  // ===== Data Fiduciary Obligations (s.8, Rules 6-9) =====
  {
    controlId: 'IN-DPDPA-3.1',
    name: 'Data Processor Engagement Under Valid Contract',
    description: 'Engage a Data Processor to process personal data on behalf of the Data Fiduciary only under a valid contract (s.8(2)), and include the security, breach-notification, erasure and cessation-on-withdrawal obligations the fiduciary must satisfy.',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Maintain a processor register. Use a standard processing addendum covering reasonable security safeguards, breach notification to the fiduciary, erasure on withdrawal or purpose fulfilment, sub-processor controls and audit rights. Do not permit processing before the contract is executed.',
    evidenceRequirements: ['Processor register', 'Executed processing contracts', 'Standard addendum with required clauses'],
    testProcedures: ['Sample processors and verify an executed contract exists', 'Check contracts contain security, breach, erasure and cessation clauses', 'Confirm no processing precedes contract execution'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.2',
    name: 'Accuracy, Completeness and Consistency for Decisions and Disclosure',
    description: 'Ensure the completeness, accuracy and consistency of personal data that is likely to be used to make a decision affecting the Data Principal or disclosed to another Data Fiduciary (s.8(3)).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Identify data used for decisions or shared onward. Apply validation at capture, periodic quality checks and a correction path linked to the s.12 right. Record data-quality incidents and remediation.',
    evidenceRequirements: ['Decision-relevant data inventory', 'Data quality controls and check results', 'Correction workflow records'],
    testProcedures: ['Sample decision data and test validation controls', 'Review quality check results and follow-ups', 'Verify corrections propagate to recipients'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.3',
    name: 'Reasonable Security Safeguards',
    description: 'Protect personal data in the possession or control of the Data Fiduciary, including processing by its processors, with reasonable security safeguards to prevent a personal data breach (s.8(4)-(5)), at minimum the measures in Rule 6: encryption, obfuscation, masking or virtual tokens; access control; visibility through logs, monitoring and review; detection of unauthorised access; continuity and backup; and contractual obligations on processors.',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Map each Rule 6 measure to implemented controls (encryption at rest and in transit, role-based access, masking in non-production, monitoring and alerting). Extend the same requirements to processors by contract and verify them. Review the safeguard set after every breach or material system change.',
    evidenceRequirements: ['Rule 6 measure-to-control mapping', 'Encryption and access-control configuration evidence', 'Processor safeguard verification'],
    testProcedures: ['Verify each Rule 6 measure has an operating control', 'Test encryption and access controls on systems holding personal data', 'Confirm processor safeguards were verified within the period'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.4',
    name: 'Logging, Monitoring and One-Year Log Retention',
    description: 'Maintain logs and monitoring that give visibility into access to personal data, detect unauthorised access, and retain logs and personal data for at least one year (unless a longer period is required by law) to allow detection, investigation and remediation of unauthorised access (Rule 6).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Centralise access and audit logs for systems processing personal data. Configure alerts for anomalous access. Set log retention to at least one year with integrity protection, and document the legal basis where a longer period applies.',
    evidenceRequirements: ['Logging and monitoring configuration', 'Alert rules and triage records', 'Log retention settings showing one year or more'],
    testProcedures: ['Verify logs capture access to personal data', 'Test an alert fires on a simulated unauthorised access', 'Confirm retention is configured at one year or longer'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.5',
    name: 'Business Continuity and Backups',
    description: 'Ensure continued processing in the event of compromise affecting the confidentiality, integrity or availability of personal data through backups and continuity arrangements (Rule 6).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Back up personal data stores with encryption and tested restoration. Define recovery objectives and rehearse recovery at least annually. Include processors in continuity planning.',
    evidenceRequirements: ['Backup configuration and schedules', 'Restoration test results', 'Continuity plan covering personal data systems'],
    testProcedures: ['Verify backups run and are encrypted', 'Review the latest restoration test', 'Confirm the continuity plan was exercised within the year'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.6',
    name: 'Personal Data Breach Intimation to Data Principals and the Board',
    description: 'On becoming aware of a personal data breach, intimate each affected Data Principal without delay in clear and plain language (description, nature, extent, timing and location, likely consequences, measures taken, safety measures they may take, and contact details), and intimate the Data Protection Board without delay and within 72 hours with the prescribed details, followed by a report of the facts, causes, remediation and notifications made (s.8(6), Rule 7).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Operate an incident response plan with a DPDP breach playbook: severity triage, affected-principal identification from the inventory, templated principal notices in the required languages, Board intimation within 72 hours, and the follow-up report. Rehearse annually and after any real breach.',
    evidenceRequirements: ['Breach response playbook', 'Principal and Board notification templates', 'Breach register with timelines and reports filed'],
    testProcedures: ['Walk through a tabletop breach and time the notification path', 'Verify templates contain every Rule 7 element', 'Review the breach register for timeliness against 72 hours'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.7',
    name: 'Erasure on Withdrawal or When the Purpose Is No Longer Served',
    description: 'Erase personal data, and cause Data Processors to erase it, when the Data Principal withdraws consent or as soon as it is reasonable to assume the specified purpose is no longer being served, unless retention is necessary for compliance with law (s.8(7)-(8)).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Define purpose-completion criteria per processing activity. Automate erasure triggers on withdrawal and on purpose completion, propagate to processors, and record legal-hold exceptions with their basis. Verify erasure with periodic sampling.',
    evidenceRequirements: ['Purpose-completion criteria', 'Erasure job logs and processor confirmations', 'Legal-hold exception register'],
    testProcedures: ['Test erasure after a withdrawal', 'Sample expired purposes and verify erasure', 'Verify legal holds cite a specific legal requirement'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.8',
    name: 'Retention Schedule and Time-Bound Erasure for Large Platforms',
    description: 'Where the Data Fiduciary is an e-commerce entity or social media intermediary with at least two crore registered users in India, or an online gaming intermediary with at least fifty lakh, erase personal data after three years from the last interaction or commencement of the Rules, whichever is later, unless retention is required by law, and give the Data Principal at least 48 hours notice before erasure (Rule 8, Third Schedule).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Determine whether the Third Schedule thresholds apply and monitor user counts. Implement last-interaction tracking, a three-year erasure schedule, and an automated 48-hour pre-erasure notice. Retain only data needed to comply with law, with the basis recorded.',
    evidenceRequirements: ['Threshold applicability assessment and user counts', 'Retention schedule and erasure job logs', 'Pre-erasure notice records'],
    testProcedures: ['Verify the applicability assessment', 'Sample accounts past the retention period and confirm erasure', 'Confirm 48-hour notices were sent before erasure'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.9',
    name: 'Publication of Contact Details for Personal Data Questions',
    description: 'Publish, on the website or app and in responses to communications from Data Principals, the business contact information of the Data Protection Officer or of a person able to answer questions about the processing of personal data (s.8(9), Rule 9).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Publish a monitored contact channel prominently in the privacy notice and product footer. Include the same contact in rights-request and grievance responses. Verify the channel is answered.',
    evidenceRequirements: ['Published contact details', 'Response templates including the contact', 'Channel monitoring evidence'],
    testProcedures: ['Locate the contact on the website and app', 'Verify responses include the contact', 'Send a test query and confirm a response'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-3.10',
    name: 'Grievance Redressal Mechanism',
    description: 'Provide readily available means of grievance redressal for Data Principals, publish the period within which grievances are responded to, and implement technical and organisational measures to meet it; Data Principals must exhaust this mechanism before approaching the Board (s.8(10), s.13, Rule 13).',
    category: 'Data Fiduciary Obligations',
    implementationGuidance: 'Stand up a grievance intake channel with ticketing, acknowledgement, escalation and closure. Publish the response period and meet it. Report grievance metrics and root causes to the compliance owner.',
    evidenceRequirements: ['Published grievance process and response period', 'Grievance ticket records with timings', 'Grievance metrics reports'],
    testProcedures: ['Submit a test grievance and time the response', 'Sample tickets against the published period', 'Verify metrics are reviewed'],
    status: 'Not Started'
  },

  // ===== Children and Persons with Disabilities (s.9, Rules 10-11) =====
  {
    controlId: 'IN-DPDPA-4.1',
    name: 'Age Assurance and Verifiable Parental Consent',
    description: 'Before processing the personal data of a child, obtain verifiable consent of the parent, adopting appropriate technical and organisational measures to verify that the individual identifying as parent is an adult who is identifiable if required, using reliable identity and age details or a virtual token mapped to them (s.9(1), Rule 10).',
    category: 'Children and Persons with Disabilities',
    implementationGuidance: 'Implement age assurance at onboarding. Where a user is a child, route to a verifiable parental consent flow supporting the Rule 10 methods, including Digital Locker based tokens where available. Record the verification evidence without over-collecting parental data.',
    evidenceRequirements: ['Age assurance design', 'Parental consent verification records', 'Data minimisation assessment for the verification flow'],
    testProcedures: ['Test the child pathway triggers parental consent', 'Verify the verification method meets Rule 10', 'Confirm verification records are retained and minimal'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-4.2',
    name: 'No Tracking, Behavioural Monitoring or Targeted Advertising Directed at Children',
    description: 'Do not undertake tracking or behavioural monitoring of children or targeted advertising directed at children (s.9(3)).',
    category: 'Children and Persons with Disabilities',
    implementationGuidance: 'Disable analytics, profiling, personalisation and advertising features for accounts identified as children by default. Verify third-party SDKs and ad networks honour the restriction. Review new features for compliance before release.',
    evidenceRequirements: ['Child-account feature configuration', 'SDK and ad-network restriction verification', 'Feature release checklist'],
    testProcedures: ['Inspect a child account and verify tracking and ads are disabled', 'Test SDK behaviour for child accounts', 'Verify release checks were performed'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-4.3',
    name: 'No Processing Likely to Cause Detrimental Effect on the Well-Being of a Child',
    description: 'Do not undertake processing of personal data that is likely to cause any detrimental effect on the well-being of a child (s.9(2)).',
    category: 'Children and Persons with Disabilities',
    implementationGuidance: 'Assess products used by children for well-being risks (exposure, contact, conduct, commercial pressure). Document mitigations and re-assess on feature change.',
    evidenceRequirements: ['Child well-being risk assessment', 'Mitigation records', 'Re-assessment on feature change'],
    testProcedures: ['Review the assessment for products reaching children', 'Verify mitigations are implemented', 'Confirm re-assessment after the last relevant change'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-4.4',
    name: 'Lawful Guardian Consent for Persons with Disabilities',
    description: 'Before processing the personal data of a person with disability who has a lawful guardian, obtain the verifiable consent of that guardian, verifying that the guardian is appointed under applicable law (s.9(1), Rule 11).',
    category: 'Children and Persons with Disabilities',
    implementationGuidance: 'Provide a guardian consent pathway with verification of the guardianship appointment. Apply the same consent standard and withdrawal rights as for other consents.',
    evidenceRequirements: ['Guardian consent flow', 'Guardianship verification records', 'Withdrawal support for guardian consents'],
    testProcedures: ['Walk through the guardian consent pathway', 'Verify guardianship evidence is checked', 'Test withdrawal by a guardian'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-4.5',
    name: 'Application of Exemptions for Children Processing',
    description: 'Where processing of children data relies on an exemption from s.9(1) or s.9(3) for specified classes of Data Fiduciaries or purposes (such as healthcare, educational institutions or creches) under the Fourth Schedule, document the exemption and confine processing to its scope (s.9(4)-(5)).',
    category: 'Children and Persons with Disabilities',
    implementationGuidance: 'Record the Fourth Schedule entry relied upon and the specific purpose. Ensure processing does not exceed the exempted purpose and that non-exempt obligations continue to apply.',
    evidenceRequirements: ['Exemption register with Fourth Schedule citations', 'Purpose limitation controls', 'Compliance evidence for non-exempt obligations'],
    testProcedures: ['Verify each exemption cites the Fourth Schedule', 'Test processing stays within the exempt purpose', 'Confirm other s.9 obligations still operate'],
    status: 'Not Started'
  },

  // ===== Significant Data Fiduciary (s.10, Rule 12) =====
  {
    controlId: 'IN-DPDPA-5.1',
    name: 'Significant Data Fiduciary Designation Monitoring and Readiness',
    description: 'Monitor for notification as a Significant Data Fiduciary, which the Central Government may issue considering the volume and sensitivity of personal data processed, risk to the rights of Data Principals, potential impact on sovereignty and integrity of India, risk to electoral democracy, security of the State and public order (s.10(1)).',
    category: 'Significant Data Fiduciary',
    implementationGuidance: 'Track the s.10(1) factors and maintain a readiness plan covering the DPO, independent audit, DPIA, algorithmic due diligence and localisation obligations so they can be met promptly upon notification.',
    evidenceRequirements: ['SDF factor assessment', 'Readiness plan', 'Notification monitoring log'],
    testProcedures: ['Review the factor assessment for currency', 'Verify the readiness plan assigns owners', 'Confirm notifications are monitored'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-5.2',
    name: 'India-Based Data Protection Officer Reporting to the Board',
    description: 'A Significant Data Fiduciary appoints a Data Protection Officer based in India who represents the fiduciary under the Act, is responsible to its Board of Directors or similar governing body, and is the point of contact for grievance redressal (s.10(2)(a)).',
    category: 'Significant Data Fiduciary',
    implementationGuidance: 'Appoint a DPO resident in India with a direct reporting line to the board. Publish the DPO contact for grievances. Provide resources and independence sufficient for the role.',
    evidenceRequirements: ['DPO appointment letter and residency confirmation', 'Reporting line documentation', 'Published DPO contact'],
    testProcedures: ['Verify appointment and India residency', 'Confirm board reporting occurs', 'Locate the published DPO contact'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-5.3',
    name: 'Independent Data Auditor and Periodic Audit',
    description: 'A Significant Data Fiduciary appoints an independent data auditor to carry out a data audit evaluating compliance with the Act, and undertakes the audit periodically, at least once every twelve months (s.10(2)(b)-(c), Rule 12).',
    category: 'Significant Data Fiduciary',
    implementationGuidance: 'Engage an independent auditor, define the audit scope against every obligation in the Act and Rules, and track remediation of findings to closure. Report significant observations to the Board as prescribed.',
    evidenceRequirements: ['Auditor engagement and independence confirmation', 'Audit reports', 'Remediation tracking'],
    testProcedures: ['Verify the auditor is independent', 'Confirm an audit was completed within twelve months', 'Review remediation status of findings'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-5.4',
    name: 'Periodic Data Protection Impact Assessment',
    description: 'A Significant Data Fiduciary undertakes a Data Protection Impact Assessment describing the rights of Data Principals and the purpose of processing, assessing and managing the risk to those rights, at least once every twelve months, and reports significant observations to the Board (s.10(2)(c), Rule 12).',
    category: 'Significant Data Fiduciary',
    implementationGuidance: 'Adopt a DPIA methodology covering rights, purposes, risks and mitigations. Perform it annually and before high-risk changes. Track actions and prepare the Board report of significant observations.',
    evidenceRequirements: ['DPIA methodology', 'Completed DPIAs with dates', 'Board report of significant observations'],
    testProcedures: ['Verify a DPIA was completed within twelve months', 'Review risk treatment actions', 'Confirm the Board report was prepared'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-5.5',
    name: 'Algorithmic Due Diligence',
    description: 'A Significant Data Fiduciary observes due diligence to verify that technical measures, including algorithmic software deployed for hosting, display, uploading, modification, publishing, transmission, storage, updating or sharing of personal data, are not likely to pose a risk to the rights of Data Principals (Rule 12).',
    category: 'Significant Data Fiduciary',
    implementationGuidance: 'Inventory algorithmic systems touching personal data. Assess each for risks to rights (discrimination, opacity, unintended disclosure) before deployment and on material change. Document mitigations and sign-off.',
    evidenceRequirements: ['Algorithmic system inventory', 'Risk assessments per system', 'Mitigation and sign-off records'],
    testProcedures: ['Sample algorithmic systems for an assessment', 'Verify assessments precede deployment', 'Confirm mitigations were implemented'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-5.6',
    name: 'Localisation of Specified Personal Data',
    description: 'A Significant Data Fiduciary ensures that personal data specified by the Central Government on the recommendation of the constituted committee, and related traffic data, is not transferred outside the territory of India (Rule 12).',
    category: 'Significant Data Fiduciary',
    implementationGuidance: 'Monitor government specifications of restricted data. Implement data-residency controls (region pinning, egress restrictions) for specified data and traffic data, and verify processor locations.',
    evidenceRequirements: ['Specified-data monitoring log', 'Residency configuration evidence', 'Processor location verification'],
    testProcedures: ['Verify specified data categories are identified', 'Test residency controls prevent transfer', 'Confirm processor locations for specified data'],
    status: 'Not Started'
  },

  // ===== Data Principal Rights (ss.11-14, Rule 13) =====
  {
    controlId: 'IN-DPDPA-6.1',
    name: 'Right to Access Information About Personal Data',
    description: 'On request, provide the Data Principal a summary of the personal data being processed and the processing activities, the identities of all other Data Fiduciaries and Data Processors with whom the data has been shared along with a description of the data shared, and any other prescribed information, except where sharing was for prevention, detection or investigation of offences (s.11).',
    category: 'Data Principal Rights',
    implementationGuidance: 'Build access-request fulfilment on the processing inventory and sharing map. Generate the summary and recipient list in clear language, applying the s.11(2) exception only where documented.',
    evidenceRequirements: ['Access-request procedure', 'Sample fulfilled responses', 'Exception decisions with basis'],
    testProcedures: ['Submit a test access request and review the response', 'Verify recipients listed match the sharing map', 'Confirm exceptions are documented'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-6.2',
    name: 'Right to Correction, Completion, Updating and Erasure',
    description: 'On request, correct inaccurate or misleading personal data, complete incomplete data, update it, and erase personal data unless retention is necessary for the specified purpose or for compliance with law (s.12).',
    category: 'Data Principal Rights',
    implementationGuidance: 'Provide request intake for each right, verify identity, action requests across all systems and processors, and record retention decisions with their legal basis. Propagate corrections to recipients where data was shared.',
    evidenceRequirements: ['Correction and erasure procedures', 'Request records with actions taken', 'Retention decision log'],
    testProcedures: ['Test correction and erasure requests end to end', 'Verify propagation to processors and recipients', 'Review retention decisions for a legal basis'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-6.3',
    name: 'Rights Request Intake, Verification and Response Period',
    description: 'Publish the means by which Data Principals make requests to exercise their rights and the period within which requests are responded to, verify the identity of the requester or nominee, and respond within the published period (Rule 13).',
    category: 'Data Principal Rights',
    implementationGuidance: 'Publish the request channel and the response period in the notice and on the website. Implement identity verification proportionate to the data involved. Track every request against the published period and escalate breaches of it.',
    evidenceRequirements: ['Published request means and response period', 'Identity verification procedure', 'Request tracking with response times'],
    testProcedures: ['Locate the published request channel and period', 'Test identity verification', 'Sample requests against the published period'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-6.4',
    name: 'Right to Nominate',
    description: 'Enable the Data Principal to nominate an individual who may exercise their rights in the event of death or incapacity (s.14).',
    category: 'Data Principal Rights',
    implementationGuidance: 'Provide a nomination facility in account settings or via request. Verify nominee claims when rights are exercised on behalf of a deceased or incapacitated Data Principal. Keep nomination records secure.',
    evidenceRequirements: ['Nomination facility', 'Nominee verification procedure', 'Nomination records'],
    testProcedures: ['Verify a nomination can be made', 'Test nominee verification', 'Confirm records are protected'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-6.5',
    name: 'Cooperation With the Data Protection Board',
    description: 'Respond to inquiries of the Data Protection Board of India, comply with its directions, and maintain the ability to demonstrate compliance; note that Data Principals may approach the Board after exhausting grievance redressal (ss.13, 18-28).',
    category: 'Data Principal Rights',
    implementationGuidance: 'Designate a point of contact for Board communications. Maintain an evidence library that can be produced on inquiry. Track Board directions and appeals to the Appellate Tribunal.',
    evidenceRequirements: ['Board liaison designation', 'Evidence library index', 'Inquiry and direction log'],
    testProcedures: ['Verify the liaison is designated', 'Test retrieval of evidence for a sample obligation', 'Review the log of any Board interactions'],
    status: 'Not Started'
  },

  // ===== Cross-Border Transfers (s.16, Rule 14) =====
  {
    controlId: 'IN-DPDPA-7.1',
    name: 'Transfer Assessment Against Government Restrictions',
    description: 'Transfer personal data outside India only to countries or territories not restricted by notification of the Central Government, and continue to honour any other law that provides a higher degree of protection or restriction (s.16).',
    category: 'Cross-Border Transfers',
    implementationGuidance: 'Maintain a transfer register with destination country per data flow and processor. Monitor Central Government notifications and block or re-route transfers to restricted destinations. Apply sectoral restrictions (for example payments or telecom rules) where they impose more.',
    evidenceRequirements: ['Transfer register with destinations', 'Notification monitoring log', 'Sectoral restriction analysis'],
    testProcedures: ['Sample transfers and verify destinations are permitted', 'Confirm notifications are monitored', 'Verify sectoral restrictions are applied'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-7.2',
    name: 'Transfer Conditions on Availability to Foreign States',
    description: 'Where personal data is processed outside India, meet the requirements the Central Government specifies regarding making personal data available to any foreign State or its instrumentality, and reflect them in contracts with overseas processors and recipients (Rule 14).',
    category: 'Cross-Border Transfers',
    implementationGuidance: 'Include clauses in overseas processing and transfer contracts addressing government-access requests and the specified requirements. Monitor specifications issued under Rule 14 and update contracts accordingly.',
    evidenceRequirements: ['Contract clauses for overseas processing', 'Rule 14 specification monitoring', 'Contract update records'],
    testProcedures: ['Review overseas contracts for the required clauses', 'Confirm specifications are monitored', 'Verify contracts were updated after new specifications'],
    status: 'Not Started'
  },

  // ===== Penalties, Training and Continuous Compliance =====
  {
    controlId: 'IN-DPDPA-8.1',
    name: 'Penalty Exposure Register and Prioritisation',
    description: 'Track exposure under the Schedule of penalties, which reaches INR 250 crore for a failure to take reasonable security safeguards, INR 200 crore for failing to notify a breach, INR 200 crore for breaches of the children provisions, INR 150 crore for Significant Data Fiduciary obligations and INR 50 crore for other breaches, and prioritise control investment accordingly.',
    category: 'Penalties and Continuous Compliance',
    implementationGuidance: 'Map each obligation to its penalty band and current control maturity. Use the register to prioritise remediation and to brief the board on residual exposure.',
    evidenceRequirements: ['Penalty exposure register', 'Control maturity ratings', 'Prioritised remediation plan'],
    testProcedures: ['Verify obligations are mapped to penalty bands', 'Review maturity ratings against evidence', 'Confirm remediation priorities reflect exposure'],
    status: 'Not Started'
  },
  {
    controlId: 'IN-DPDPA-8.2',
    name: 'Training and Awareness for Personnel Handling Personal Data',
    description: 'Train personnel who process personal data on their obligations under the Act and Rules, including notice and consent, security safeguards, breach escalation and handling of rights requests.',
    category: 'Penalties and Continuous Compliance',
    implementationGuidance: 'Deliver role-based training at onboarding and annually, with targeted modules for support, engineering and marketing teams. Track completion and test understanding.',
    evidenceRequirements: ['Training materials', 'Completion records', 'Assessment results'],
    testProcedures: ['Verify training covers the key obligations', 'Sample completion records for in-scope roles', 'Review assessment outcomes'],
    status: 'Not Started'
  }
];
