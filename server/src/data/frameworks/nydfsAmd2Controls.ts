import { FrameworkControlTemplate } from './soc2Controls';

/**
 * NYDFS 23 NYCRR Part 500 — Second Amendment
 *
 * Adopted by the New York State Department of Financial Services on
 * November 1, 2023, with a phased compliance schedule extending through
 * November 1, 2025. This amendment overlays the original 2017 regulation
 * with enhanced obligations focused on governance, encryption, incident
 * response, identity and access management, vulnerability management, and
 * heightened "Class A Company" requirements.
 *
 * Phased compliance dates referenced in the controls below:
 *   - November 1, 2023 — General effective date (with grandfathered timing)
 *   - April 29, 2024  — Notification of cybersecurity events (revised)
 *   - November 1, 2024 — Governance, encryption, incident response, training
 *   - May 1, 2025      — Vulnerability management, access privileges, MFA
 *   - November 1, 2025 — MFA for all individuals, asset inventory
 *
 * Covered Entities must implement these controls in addition to the base
 * Part 500 program. Class A Companies (over 2,000 employees or $1B+ in gross
 * revenue over the prior three fiscal years from NY operations) face
 * additional heightened obligations as flagged below.
 */

export const NYDFS_AMD2_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Class A Company Heightened Obligations =====
  {
    controlId: 'NYDFS-AMD2-CLASSA.1',
    name: 'Class A Company Determination and Documentation',
    description: 'Annually determine whether the Covered Entity meets the Class A Company definition under Section 500.1(d) and document the analysis, including affiliate aggregation where applicable.',
    category: 'Class A Company',
    implementationGuidance: 'Calculate employee headcount across the Covered Entity and its affiliates (per Section 500.1(a) affiliate definition) and gross revenue from all business operations of the Covered Entity and its New York-affiliated entities over the prior three fiscal years. A Class A designation is triggered by either (a) more than 2,000 employees, or (b) over $1 billion in gross annual revenue averaged over the trailing three fiscal years. Document the determination, the inputs, and the conclusion in the cybersecurity program governance file. Re-evaluate annually.',
    evidenceRequirements: ['Annual Class A determination memo with employee and revenue calculations', 'Affiliate inclusion analysis', 'Board or senior officer acknowledgement of Class A status', 'Trigger thresholds calculation worksheet'],
    testProcedures: ['Inspect the most recent Class A determination memo', 'Recompute employee and revenue totals using underlying HR and finance records', 'Verify the determination has been refreshed within the past 12 months'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-CLASSA.2',
    name: 'Class A Independent Audit of Cybersecurity Program',
    description: 'Class A Companies must conduct independent audits of the cybersecurity program based on risk assessment, as required under Section 500.2(c) effective November 1, 2024.',
    category: 'Class A Company',
    implementationGuidance: 'Engage an independent internal or external audit function — independent of the CISO and the Covered Entity\'s management of the cybersecurity program — to assess the design and operating effectiveness of the cybersecurity program. Scope the audit using the Section 500.9 risk assessment. Report findings to the senior governing body. Track remediation through closure. Retain audit reports for at least five years.',
    evidenceRequirements: ['Independent audit charter establishing independence', 'Risk-based audit scope document', 'Audit report with findings and ratings', 'Remediation tracking log with closure evidence'],
    testProcedures: ['Inspect the audit charter for independence from the CISO function', 'Verify scope is derived from the current risk assessment', 'Sample audit findings and trace through remediation closure'],
    status: 'Not Started'
  },

  // ===== Governance — Effective November 1, 2024 =====
  {
    controlId: 'NYDFS-AMD2-GOV.1',
    name: 'CISO Independence and Authority',
    description: 'Designate a qualified Chief Information Security Officer (CISO) with sufficient authority and independence to direct the cybersecurity program, per Section 500.4(a) as amended.',
    category: 'Governance',
    implementationGuidance: 'Document the CISO role, reporting line, and authority in a board-approved charter. The CISO must have direct access to the senior governing body. Define the CISO\'s authority to require remediation of identified cybersecurity risks. Where the CISO function is provided by an affiliate or third party, ensure a senior member of the Covered Entity is designated to oversee the third party and confirm the program\'s adequacy.',
    evidenceRequirements: ['Board-approved CISO charter or role description', 'Org chart showing CISO reporting line', 'Third-party CISO oversight designation memo (if applicable)', 'Evidence of CISO authority to require remediation'],
    testProcedures: ['Inspect the CISO charter and verify board approval', 'Confirm the reporting line provides direct access to the senior governing body', 'Where third-party CISO is used, verify designated internal oversight officer'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-GOV.2',
    name: 'Annual CISO Report to Senior Governing Body',
    description: 'The CISO must provide a written report to the senior governing body at least annually covering the cybersecurity program, material risks, and material cybersecurity events, per Section 500.4(b).',
    category: 'Governance',
    implementationGuidance: 'Prepare an annual written report covering: the confidentiality, integrity, and availability of information systems; exceptions to cybersecurity standards; identification of cyber risks; effectiveness of the cybersecurity program; proposed material steps to remediate inadequacies; and material cybersecurity events involving the Covered Entity during the period. Present the report to the senior governing body. Document acceptance, questions, and any directed actions in board or committee minutes.',
    evidenceRequirements: ['Annual CISO written report to the senior governing body', 'Board or committee minutes reflecting presentation and discussion', 'Director questions and resulting management responses', 'Distribution log confirming report delivery'],
    testProcedures: ['Inspect the most recent annual CISO report for all required content elements', 'Verify presentation is reflected in board or committee minutes', 'Confirm material cybersecurity events during the period are included'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-GOV.3',
    name: 'Senior Governing Body Cybersecurity Oversight',
    description: 'The senior governing body must exercise oversight of the cybersecurity risk management program and have sufficient understanding of cybersecurity-related matters, per Section 500.4(d).',
    category: 'Governance',
    implementationGuidance: 'Provide the senior governing body with cybersecurity education or briefings sufficient to understand cyber risk to the organization. Document approval of the written cybersecurity policy. Receive periodic updates on the cybersecurity program. Confirm management has allocated sufficient resources to implement and maintain the program. Record oversight actions in board minutes.',
    evidenceRequirements: ['Board cybersecurity education or briefing materials', 'Board approval of written cybersecurity policy', 'Periodic cybersecurity update agenda items', 'Resource allocation discussions in board minutes'],
    testProcedures: ['Inspect board minutes for cybersecurity oversight evidence', 'Verify board members have received cybersecurity education', 'Confirm written cybersecurity policy has current board approval'],
    status: 'Not Started'
  },

  // ===== Encryption — Effective November 1, 2024 =====
  {
    controlId: 'NYDFS-AMD2-ENC.1',
    name: 'Encryption of Nonpublic Information in Transit and at Rest',
    description: 'Implement controls including encryption to protect nonpublic information held or transmitted by the Covered Entity, both in transit over external networks and at rest, per Section 500.15.',
    category: 'Encryption',
    implementationGuidance: 'Maintain a documented encryption standard covering algorithm selection, key strength, and approved implementations. Encrypt nonpublic information in transit over external networks. Encrypt nonpublic information at rest. Where encryption of nonpublic information at rest is infeasible, the CISO must approve in writing the use of effective alternative compensating controls reviewed at least annually. Maintain inventory of compensating-control exceptions.',
    evidenceRequirements: ['Encryption standard document', 'Coverage matrix of nonpublic information stores with encryption status', 'CISO-approved compensating control register for at-rest exceptions', 'Annual review evidence for compensating controls'],
    testProcedures: ['Inspect the encryption standard for coverage of in-transit and at-rest data', 'Sample nonpublic information stores and verify encryption or approved compensating controls', 'Confirm compensating controls are reviewed annually with CISO sign-off'],
    status: 'Not Started'
  },

  // ===== Incident Response — Effective November 1, 2024 =====
  {
    controlId: 'NYDFS-AMD2-IR.1',
    name: 'Enhanced Incident Response and Business Continuity Plans',
    description: 'Maintain a written incident response plan and a business continuity / disaster recovery plan addressing specific elements required under Section 500.16, including response to ransomware and other extortion events.',
    category: 'Incident Response',
    implementationGuidance: 'The incident response plan must address: internal processes, goals, roles and responsibilities, external and internal communications, identification of remediation requirements, documentation and reporting, and post-incident review. The BCDR plan must address: identification of essential data and personnel, communications during disruption, backup procedures, and identification of third-party providers necessary to operations. Test plans periodically with documented results. Distribute to all relevant personnel.',
    evidenceRequirements: ['Written incident response plan covering all Section 500.16(a)(1) elements', 'Written BCDR plan covering all Section 500.16(a)(2) elements', 'Annual test results with after-action reports', 'Distribution list and personnel acknowledgements'],
    testProcedures: ['Inspect the incident response plan for each required content element', 'Verify the BCDR plan addresses essential data, personnel, communications, and backups', 'Sample personnel for plan distribution and acknowledgement evidence'],
    status: 'Not Started'
  },

  // ===== Vulnerability Management — Effective May 1, 2025 =====
  {
    controlId: 'NYDFS-AMD2-VM.1',
    name: 'Continuous Vulnerability Management Program',
    description: 'Implement and maintain documented policies and procedures for vulnerability management, including monitoring, scanning, and remediation, per Section 500.5(a) as amended.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Maintain a written vulnerability management program. Include automated scans of information systems and a manual review of systems not covered by such scans. The frequency must be designed to identify both publicly disclosed and externally exposed vulnerabilities in a timely manner, based on risk. Establish remediation timelines tied to vulnerability severity. Track exceptions through a formal acceptance process with CISO approval and defined re-review intervals.',
    evidenceRequirements: ['Vulnerability management policy and procedures', 'Scan schedules and recent scan reports', 'Remediation SLA matrix with severity tiers', 'Exception register with CISO approval and re-review dates'],
    testProcedures: ['Inspect the vulnerability management policy for required elements', 'Sample recent scans and verify findings are tracked to remediation', 'Confirm exceptions have CISO approval and re-review dates'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-VM.2',
    name: 'Class A Endpoint Detection and Response and Log Management',
    description: 'Class A Companies must implement endpoint detection and response solutions with centralized logging and security event alerting, per Section 500.14(b) effective May 1, 2025.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Class A Companies must implement an EDR solution to monitor anomalous activity, including lateral movement, on covered endpoints. Implement a centralized logging and security event alerting solution unless the CISO has approved in writing the use of reasonably equivalent or more secure compensating controls. Configure log retention consistent with the cybersecurity program and applicable regulatory requirements. Tune alerts to reduce noise while preserving detection efficacy.',
    evidenceRequirements: ['EDR deployment inventory across endpoints', 'Centralized logging and SIEM configuration documentation', 'CISO-approved compensating control register (if applicable)', 'Alert tuning and disposition records'],
    testProcedures: ['Inspect EDR coverage versus endpoint inventory', 'Verify centralized logging captures security-relevant events', 'Where compensating controls are used, confirm CISO approval and equivalent control rationale'],
    status: 'Not Started'
  },

  // ===== Access Management — Effective May 1, 2025 =====
  {
    controlId: 'NYDFS-AMD2-AM.1',
    name: 'Access Privilege Limitation and Review',
    description: 'Limit user access privileges to information systems that provide access to nonpublic information and periodically review such privileges, per Section 500.7 as amended.',
    category: 'Access Management',
    implementationGuidance: 'Limit privileges to those necessary for the user\'s job function. Limit the number of privileged accounts and access functions. Periodically (at least annually) review access privileges and remove or modify access no longer necessary. Disable or securely configure all protocols that permit remote control of devices. Promptly terminate access following separation of employment.',
    evidenceRequirements: ['Access provisioning policy with least-privilege requirement', 'Annual access review records with manager attestation', 'Privileged account inventory', 'Termination access removal log with timing metrics'],
    testProcedures: ['Sample users and verify privileges align with documented job functions', 'Inspect the most recent annual access review for completeness', 'Sample terminations and verify timely access removal'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-AM.2',
    name: 'Password Policy and Privileged Account Controls',
    description: 'Implement written password policies that meet industry standards and additional protections for privileged accounts, per Section 500.7(b) as amended.',
    category: 'Access Management',
    implementationGuidance: 'Establish a written password policy aligned with current industry standards (e.g., NIST 800-63B). Privileged accounts must use stronger controls — including unique credentials, monitoring of activity, and where feasible, just-in-time elevation. Prohibit the use of vendor-default credentials. Implement automated credential management tooling for service accounts where feasible.',
    evidenceRequirements: ['Written password policy referencing industry standard', 'Privileged account control documentation', 'Service account credential management tooling configuration', 'Vendor default credential remediation log'],
    testProcedures: ['Inspect the password policy against the referenced industry standard', 'Sample privileged accounts and verify enhanced controls are in effect', 'Search for any active vendor default credentials and confirm absence'],
    status: 'Not Started'
  },

  // ===== Multi-Factor Authentication — Effective November 1, 2025 =====
  {
    controlId: 'NYDFS-AMD2-MFA.1',
    name: 'Multi-Factor Authentication for All Individuals Accessing Information Systems',
    description: 'Implement multi-factor authentication for any individual accessing any of the Covered Entity\'s information systems, per Section 500.12 as amended effective November 1, 2025.',
    category: 'MFA',
    implementationGuidance: 'MFA is required for: remote access to the Covered Entity\'s information systems; remote access to third-party applications from which nonpublic information is accessible; and all privileged accounts other than service accounts that prohibit interactive login. MFA must be required for any individual accessing any information system unless the CISO has approved in writing the use of reasonably equivalent or more secure access controls. Review such approvals annually. Maintain MFA enrollment evidence and authentication logs.',
    evidenceRequirements: ['MFA coverage matrix across information systems and user populations', 'CISO-approved exemption register with annual review', 'MFA enrollment and authentication logs', 'Equivalent control rationale for exempted systems'],
    testProcedures: ['Sample information systems and verify MFA is enforced for interactive access', 'Inspect the exemption register for CISO approval and annual review', 'Sample privileged accounts and verify MFA enrollment'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-MFA.2',
    name: 'Asset Inventory Maintenance',
    description: 'Implement written policies and procedures designed to produce and maintain a complete, accurate, and documented asset inventory, per Section 500.13(a) effective November 1, 2025.',
    category: 'Asset Management',
    implementationGuidance: 'The asset inventory must include, for each asset: owner, location, classification or sensitivity, support expiration date, and recovery time objectives. Implement an asset management policy describing data collection sources (CMDB, endpoint agents, cloud APIs), update frequency, reconciliation procedures, and ownership accountability. Integrate the inventory with vulnerability management, change management, and incident response processes.',
    evidenceRequirements: ['Asset management policy and procedures', 'Current asset inventory containing required attributes', 'Reconciliation logs across data sources', 'Integration evidence with vulnerability and incident workflows'],
    testProcedures: ['Inspect the asset inventory for all required attributes per asset', 'Verify the inventory is reconciled against authoritative sources on a defined cadence', 'Confirm integration between inventory and vulnerability management workflow'],
    status: 'Not Started'
  },

  // ===== Notification Requirements =====
  {
    controlId: 'NYDFS-AMD2-NOT.1',
    name: '72-Hour Ransomware Deployment Notification',
    description: 'Notify the Superintendent of Financial Services within 72 hours of determining that a cybersecurity event has occurred involving the deployment of ransomware within a material part of the Covered Entity\'s information systems, per Section 500.17(a)(2)(ii).',
    category: 'Notification',
    implementationGuidance: 'Establish a documented determination procedure for ransomware deployment incidents that triggers a 72-hour reporting clock. The notification is submitted via the DFS cybersecurity portal and must include the nature and scope of the event. Confirm the incident response plan assigns clear ownership for determination, drafting, internal review, and submission within the 72-hour window. Maintain a notification log with timestamps demonstrating compliance.',
    evidenceRequirements: ['Documented ransomware-determination procedure', 'IR plan section addressing 72-hour notification', 'Notification log with determination and submission timestamps', 'DFS portal submission acknowledgements'],
    testProcedures: ['Inspect the determination procedure and verify it specifies the 72-hour trigger', 'Sample any ransomware events and trace the timeline from determination to DFS submission', 'Verify the IR plan owner-assignment for 72-hour notification'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-AMD2-NOT.2',
    name: '24-Hour Extortion Payment Notification',
    description: 'Notify the Superintendent within 24 hours of making any extortion payment in connection with a cybersecurity event involving the Covered Entity, per Section 500.17(c)(1).',
    category: 'Notification',
    implementationGuidance: 'Establish a documented procedure requiring senior officer pre-approval of any extortion payment, with mandatory DFS notification within 24 hours of payment. Within 30 days of payment, provide a written description of the reasons for payment, alternatives considered, sanctions diligence performed, and OFAC compliance analysis. Confirm legal and compliance review precedes any payment decision.',
    evidenceRequirements: ['Extortion-payment approval and notification procedure', 'Senior officer pre-approval template', 'OFAC sanctions diligence documentation', '30-day written reasoning template'],
    testProcedures: ['Inspect the extortion-payment procedure for 24-hour notification and pre-approval requirements', 'Verify OFAC diligence is included in the procedure', 'Where payments occurred, confirm timely DFS notification and 30-day follow-up'],
    status: 'Not Started'
  },

  // ===== Certification =====
  {
    controlId: 'NYDFS-AMD2-CERT.1',
    name: 'Annual Written Certification or Acknowledgement by Senior Officer',
    description: 'Annually submit to the Superintendent either a written certification of material compliance or a written acknowledgement of areas of non-compliance signed by the CEO and the highest-ranking security officer, per Section 500.17(b) effective April 15, 2025.',
    category: 'Certification',
    implementationGuidance: 'Conduct a structured pre-certification readiness review covering all Part 500 requirements. The submission must be either: (a) a written certification of material compliance signed by the Covered Entity\'s highest-ranking executive (typically CEO) and the CISO, supported by data and documentation; or (b) a written acknowledgement that the Covered Entity has not materially complied with certain provisions, identifying the sections, supplying remediation timelines, and including documentation evidencing the violation. Retain supporting documentation for five years.',
    evidenceRequirements: ['Annual pre-certification readiness assessment', 'Signed certification or acknowledgement submitted to DFS', 'Supporting documentation file', 'Five-year retention schedule for certification evidence'],
    testProcedures: ['Inspect the most recent certification or acknowledgement and verify required signatures', 'Sample supporting documentation and verify it substantiates the certification', 'Confirm a documented retention schedule covers five years'],
    status: 'Not Started'
  }
];
