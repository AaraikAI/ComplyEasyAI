import { FrameworkControlTemplate } from './soc2Controls';

/**
 * HIPAA Security Rule — 2024 Notice of Proposed Rulemaking (NPRM)
 *
 * PROPOSED RULE — Regulatory freeze as of Jan 2025 leaves final-rule status
 * uncertain. Implement for forward-looking compliance posture.
 *
 * The HHS Office for Civil Rights published this NPRM on December 27, 2024
 * (90 FR 898), proposing substantial modifications to the HIPAA Security Rule
 * at 45 CFR Parts 160 and 164. The most consequential proposed changes are:
 *
 *   - Elimination of the "required" versus "addressable" distinction — all
 *     specifications become required.
 *   - Mandatory encryption of ePHI at rest and in transit (with narrow,
 *     documented exceptions).
 *   - Mandatory multi-factor authentication for all access to ePHI, with
 *     limited exceptions.
 *   - Mandatory network segmentation and prescriptive risk analysis with an
 *     accurate technology asset inventory and network map.
 *   - Vulnerability scanning every six months and annual penetration testing.
 *   - Contingency plans with defined restoration time objectives for systems
 *     containing ePHI.
 *   - Annual compliance audits and annual written business associate
 *     verification.
 *   - Stricter configuration management (anti-malware, patching, removal of
 *     unnecessary software) and incident response plan elements.
 *
 * Comments closed March 7, 2025. As of publication of this catalog, the rule
 * has not been finalized and remains subject to the regulatory freeze on
 * unpublished rules issued on January 20, 2025. Organizations should treat
 * these controls as a forward-looking readiness baseline rather than a
 * presently enforceable obligation.
 */

export const HIPAA_SECURITY_NPRM_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Removal of Addressable/Required Distinction =====
  {
    controlId: 'HIPAA-NPRM-GEN.1',
    name: 'Treat All Specifications as Required',
    description: 'Implement every Security Rule specification as a required obligation, eliminating any historical "addressable" treatment that permitted alternative or omitted implementations based on documented reasonableness.',
    category: 'General Provisions',
    implementationGuidance: 'Review the existing HIPAA Security Rule compliance program and identify any specifications historically implemented as "addressable" using alternative measures or non-implementation rationales. Convert each to a fully required implementation. Update policies, procedures, and the Risk Analysis to reflect this change. Where an existing alternative is robust, document why it remains the chosen implementation while confirming it meets the underlying objective.',
    evidenceRequirements: ['Inventory of previously addressable specifications and current treatment', 'Updated Security Rule policy reflecting required treatment', 'Risk analysis update reflecting elimination of addressable category', 'Implementation closure log for previously deferred items'],
    testProcedures: ['Inspect the previously-addressable inventory and verify each has been implemented', 'Verify the updated policy removes the addressable category', 'Sample previously deferred items and confirm closure evidence'],
    status: 'Not Started'
  },

  // ===== Risk Analysis and Asset Inventory =====
  {
    controlId: 'HIPAA-NPRM-RA.1',
    name: 'Prescriptive Risk Analysis with Technology Asset Inventory',
    description: 'Conduct an accurate and comprehensive risk analysis using the proposed prescriptive methodology, supported by a complete technology asset inventory identifying all assets that create, receive, maintain, or transmit ePHI.',
    category: 'Risk Analysis',
    implementationGuidance: 'Maintain a technology asset inventory covering hardware, software, electronic media, and information systems that create, receive, maintain, or transmit ePHI. For each asset, document owner, location, sensitivity, ePHI handling, and lifecycle status. Use the inventory as the basis for the risk analysis. The risk analysis must identify reasonably anticipated threats and vulnerabilities, assess current security measures, and determine the likelihood and impact of each. Update the inventory upon material change.',
    evidenceRequirements: ['Technology asset inventory with required attributes per asset', 'Risk analysis report referencing the inventory', 'Threat and vulnerability identification for each asset class', 'Inventory change-management log'],
    testProcedures: ['Inspect the inventory for the required attributes', 'Verify the risk analysis references each inventoried asset class', 'Sample assets and confirm they appear in the inventory with current data'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-RA.2',
    name: 'Network Map Maintenance',
    description: 'Develop and maintain an accurate network map showing the movement of ePHI through the organization\'s information systems, refreshed upon material change and reviewed annually.',
    category: 'Risk Analysis',
    implementationGuidance: 'Create and maintain a network map that visually depicts the boundaries of information systems handling ePHI, the flows of ePHI between systems and external parties, encryption points, security boundaries, and connections to business associates and external networks. Refresh the network map upon material system change and review at least annually. Use the network map alongside the asset inventory to inform the risk analysis.',
    evidenceRequirements: ['Current network map with ePHI flow annotations', 'Map change log tied to system change events', 'Annual map review record', 'Reference linkage between network map and risk analysis'],
    testProcedures: ['Inspect the most recent network map and confirm ePHI flows are depicted', 'Verify the map has been reviewed within the past 12 months', 'Sample a recent system change and confirm map update'],
    status: 'Not Started'
  },

  // ===== Mandatory Encryption =====
  {
    controlId: 'HIPAA-NPRM-ENC.1',
    name: 'Mandatory Encryption of ePHI at Rest',
    description: 'Encrypt ePHI at rest using a method that renders the information unreadable, undecipherable, and unusable to unauthorized individuals — eliminating reliance on the prior addressable specification.',
    category: 'Encryption',
    implementationGuidance: 'Apply encryption to ePHI at rest across all storage locations — including databases, file shares, backup media, removable media, laptops, mobile devices, and cloud object storage. Use cryptographic methods aligned with current NIST guidance (e.g., AES-256 minimum for symmetric encryption). Manage keys with separation of duties and key lifecycle controls. Where an exception is necessary, document the rationale, the compensating controls, and the approval by a designated security official with annual review.',
    evidenceRequirements: ['Encryption standard referencing NIST guidance', 'Encryption coverage matrix across ePHI stores', 'Key management policy and lifecycle records', 'Exception register with compensating controls and annual review'],
    testProcedures: ['Inspect the encryption standard for alignment with NIST', 'Sample ePHI stores and verify encryption status', 'Confirm exception register entries have annual review evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-ENC.2',
    name: 'Mandatory Encryption of ePHI in Transit',
    description: 'Encrypt ePHI in transit across any network using cryptographic protocols aligned with current standards, including internal networks where the risk warrants.',
    category: 'Encryption',
    implementationGuidance: 'Encrypt ePHI in transit across external and internal networks using current TLS versions (1.2 minimum, 1.3 preferred) with strong cipher suites. Disable deprecated protocols and ciphers. Verify certificate validity and lifecycle. Apply to web, API, email (where transmitted), file transfer, and database connections. Where legacy systems cannot support current encryption, document the exception, apply compensating segmentation, and plan remediation.',
    evidenceRequirements: ['TLS configuration standard and cipher suite policy', 'In-transit encryption coverage matrix per system', 'Certificate inventory with expiration tracking', 'Legacy exception register with remediation plan'],
    testProcedures: ['Inspect cipher suite configuration across in-scope systems', 'Verify deprecated protocols are disabled', 'Sample certificates and confirm validity tracking'],
    status: 'Not Started'
  },

  // ===== Mandatory MFA =====
  {
    controlId: 'HIPAA-NPRM-MFA.1',
    name: 'Mandatory Multi-Factor Authentication for ePHI Access',
    description: 'Require multi-factor authentication for all access to information systems containing ePHI, with limited and documented exceptions reviewed by a designated security official.',
    category: 'Access Control',
    implementationGuidance: 'Implement MFA across all user populations accessing ePHI — workforce, contractors, and business associates with remote access. Acceptable factors include passwords combined with hardware tokens, FIDO2 authenticators, software OTP, or push-approved mobile authentication. Avoid SMS-based MFA where higher-assurance options are feasible. Exceptions are limited to specific cases identified in the rule (e.g., specified emergency access scenarios) and must be documented with compensating controls and annual review.',
    evidenceRequirements: ['MFA enrollment coverage matrix per system and user population', 'MFA standard specifying acceptable factors', 'Exception register with compensating controls', 'Annual MFA program review and exception review'],
    testProcedures: ['Sample ePHI-bearing systems and verify MFA enforcement', 'Inspect the MFA standard for factor selection rationale', 'Verify exception register entries have annual review evidence'],
    status: 'Not Started'
  },

  // ===== Network Segmentation =====
  {
    controlId: 'HIPAA-NPRM-NET.1',
    name: 'Network Segmentation for ePHI Environments',
    description: 'Implement network segmentation that isolates ePHI-bearing systems from general-purpose networks and limits lateral movement potential.',
    category: 'Network Security',
    implementationGuidance: 'Define network zones with documented trust levels. Separate ePHI-bearing systems into segments with restrictive ingress and egress controls. Implement zone-to-zone filtering at firewalls or microsegmentation enforcement points. Document allow-listed flows. Monitor inter-zone traffic for anomalies. Review segmentation design at least annually and following material network change.',
    evidenceRequirements: ['Network zoning design document', 'Firewall or microsegmentation rule export', 'Allow-list inventory for inter-zone flows', 'Annual segmentation design review record'],
    testProcedures: ['Inspect the network zoning design and verify ePHI systems are segregated', 'Sample firewall rules between zones and confirm restrictive enforcement', 'Verify the annual segmentation review has been completed'],
    status: 'Not Started'
  },

  // ===== Vulnerability Management =====
  {
    controlId: 'HIPAA-NPRM-VM.1',
    name: 'Vulnerability Scanning Every Six Months',
    description: 'Conduct authenticated vulnerability scans of information systems containing ePHI at least every six months, with prompt remediation tracked through closure.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Schedule authenticated vulnerability scans against all ePHI-bearing systems at minimum twice per year (six-month intervals). Where feasible, increase scan frequency for internet-facing or higher-risk systems. Triage findings by severity. Remediate within SLAs aligned to severity. Maintain an exception register with documented compensating controls and CISO or security official approval for items not remediated by SLA.',
    evidenceRequirements: ['Vulnerability scanning policy with six-month minimum cadence', 'Scan reports for the past 12 months', 'Remediation tracking log with SLA compliance metrics', 'Exception register with compensating controls and approval'],
    testProcedures: ['Inspect the scanning policy and verify the minimum cadence', 'Confirm scans have been performed at the required intervals over the past 12 months', 'Sample findings and verify remediation closure or documented exception'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-VM.2',
    name: 'Annual Penetration Testing',
    description: 'Conduct annual penetration testing of information systems containing ePHI, scoped to assess the effectiveness of the security controls protecting that information.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Engage qualified internal or external testers to conduct annual penetration tests scoped to ePHI-bearing systems. Test scope must cover network, application, and where applicable, social-engineering vectors. Document findings, exploit paths, and recommended remediation. Track remediation through closure. Retain test reports and remediation evidence. Re-test material findings after remediation.',
    evidenceRequirements: ['Annual penetration test engagement letter and scope', 'Penetration test report with findings and severity', 'Remediation tracking log', 'Re-test evidence for material findings'],
    testProcedures: ['Inspect the most recent penetration test report and verify ePHI scope', 'Sample findings and confirm remediation closure', 'Verify re-testing of material findings'],
    status: 'Not Started'
  },

  // ===== Contingency Planning =====
  {
    controlId: 'HIPAA-NPRM-CP.1',
    name: 'Contingency Plan with Defined Restoration Timelines',
    description: 'Maintain a contingency plan for information systems containing ePHI with defined restoration time objectives, recovery point objectives, and tested procedures for backup, disaster recovery, and emergency operations.',
    category: 'Contingency Planning',
    implementationGuidance: 'Establish and maintain a contingency plan covering data backup, disaster recovery, emergency mode operations, application and data criticality analysis, and testing and revision procedures. Define restoration time objectives and recovery point objectives per system tied to a documented criticality classification. Test the contingency plan annually with tabletop or live exercises and document the after-action results.',
    evidenceRequirements: ['Contingency plan document with required components', 'Criticality classification with RTO and RPO per system', 'Annual contingency plan test report', 'After-action remediation tracking'],
    testProcedures: ['Inspect the contingency plan and confirm all required components are addressed', 'Verify RTO and RPO are defined per system', 'Confirm the most recent annual test has documented results'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-CP.2',
    name: 'Backup Restoration Verification',
    description: 'Verify the ability to restore ePHI from backup at a defined cadence, with documented restoration test results and remediation of any failed tests.',
    category: 'Contingency Planning',
    implementationGuidance: 'Maintain backup procedures aligned to RPO per system. Test restoration of ePHI from backup at a defined cadence — at minimum quarterly for critical systems. Document each restoration test including dataset selected, restoration time, data integrity validation, and any anomalies. Investigate and remediate failed restorations. Retain test records for use in subsequent audits.',
    evidenceRequirements: ['Backup procedures and cadence per system class', 'Quarterly restoration test records for critical systems', 'Anomaly investigation and remediation log', 'Backup retention policy'],
    testProcedures: ['Sample critical systems and verify quarterly restoration tests', 'Inspect a restoration test record for data integrity validation', 'Trace any failed restoration to remediation evidence'],
    status: 'Not Started'
  },

  // ===== Compliance Audit =====
  {
    controlId: 'HIPAA-NPRM-AUD.1',
    name: 'Annual Compliance Audit of the Security Program',
    description: 'Conduct an annual audit of compliance with HIPAA Security Rule requirements, documenting scope, findings, and remediation status.',
    category: 'Compliance Audit',
    implementationGuidance: 'Engage internal or external auditors to assess the design and operating effectiveness of the HIPAA Security Rule compliance program at least annually. Scope must cover administrative, physical, and technical safeguards. Issue an audit report with findings and severity. Track remediation through closure. Report material findings to executive leadership and, where appropriate, the board or governing body.',
    evidenceRequirements: ['Annual compliance audit engagement letter and scope', 'Audit report with findings and severity', 'Remediation tracking log', 'Executive or board briefing record on material findings'],
    testProcedures: ['Inspect the most recent annual audit report', 'Verify scope covers administrative, physical, and technical safeguards', 'Sample findings and trace through remediation closure'],
    status: 'Not Started'
  },

  // ===== Business Associates =====
  {
    controlId: 'HIPAA-NPRM-BA.1',
    name: 'Annual Written Business Associate Verification',
    description: 'Obtain annual written verification from each business associate that it has implemented required safeguards consistent with the Security Rule.',
    category: 'Business Associates',
    implementationGuidance: 'Maintain a current business associate inventory with contact and contract status. At least annually, request and obtain written verification from each business associate confirming implementation of administrative, physical, and technical safeguards required by the Security Rule and the underlying BAA. Where verification is not provided or indicates a gap, escalate to legal and compliance for remediation, contract amendment, or relationship termination. Retain verification records.',
    evidenceRequirements: ['Business associate inventory with current contact and contract', 'Annual written verification per business associate', 'Escalation log for missing or deficient verifications', 'Retention schedule for verification records'],
    testProcedures: ['Sample business associates and verify annual written verification is on file', 'Inspect the escalation log for unverified or deficient business associates', 'Confirm the inventory is reconciled annually'],
    status: 'Not Started'
  },

  // ===== Workforce Training =====
  {
    controlId: 'HIPAA-NPRM-TRN.1',
    name: 'Enhanced Workforce Security Training',
    description: 'Provide initial and annual ongoing security training to all workforce members, with role-tailored content and documented completion.',
    category: 'Workforce Training',
    implementationGuidance: 'Provide initial security training to new workforce members within 30 days of access, and refresh annually thereafter. Tailor training content to role — for example, developers receive secure coding modules, administrators receive privileged access modules, clinical users receive ePHI handling modules. Track completion and reissue access reviews where training lapses occur. Update training content following material incidents or significant control changes.',
    evidenceRequirements: ['Training program curriculum tailored by role', 'Initial training completion records within 30 days of access', 'Annual training completion records per workforce member', 'Training content update log'],
    testProcedures: ['Inspect the training curriculum and verify role tailoring', 'Sample new hires and confirm initial training was completed within 30 days', 'Sample workforce members and verify annual training completion'],
    status: 'Not Started'
  },

  // ===== Configuration Management =====
  {
    controlId: 'HIPAA-NPRM-CM.1',
    name: 'Anti-Malware Protection on ePHI Systems',
    description: 'Deploy anti-malware protection on information systems that create, receive, maintain, or transmit ePHI, with defined update cadence and monitoring of detection events.',
    category: 'Configuration Management',
    implementationGuidance: 'Deploy anti-malware (endpoint protection, EDR, or equivalent) on all in-scope systems. Configure automated signature or detection-content updates at a defined cadence. Centralize alerting for malware detections and triage promptly. Where systems cannot host anti-malware agents (e.g., embedded medical devices), document the exception, implement compensating controls (segmentation, allow-listing, monitoring), and review annually.',
    evidenceRequirements: ['Anti-malware deployment inventory across ePHI systems', 'Update cadence configuration documentation', 'Detection event triage log', 'Exception register with compensating controls'],
    testProcedures: ['Sample ePHI systems and verify anti-malware deployment', 'Inspect a detection event and verify triage actions', 'Confirm exception register entries have compensating controls and annual review'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-CM.2',
    name: 'Patch Management for ePHI Systems',
    description: 'Apply security patches to ePHI-bearing systems within defined timeframes based on severity, with documented exceptions and compensating controls for items not patched within SLA.',
    category: 'Configuration Management',
    implementationGuidance: 'Maintain a documented patch management policy specifying SLAs tied to vulnerability severity (e.g., critical within 14 days, high within 30 days). Apply to operating systems, applications, firmware, and third-party components. Coordinate with change management. Track exceptions through a formal acceptance process with security official approval and re-review intervals. Monitor SLA compliance metrics.',
    evidenceRequirements: ['Patch management policy with severity-based SLAs', 'Patch deployment logs across ePHI systems', 'Exception register with security official approval', 'SLA compliance metrics dashboard'],
    testProcedures: ['Inspect the patch management policy for severity-tied SLAs', 'Sample critical patches and verify deployment within SLA', 'Confirm exceptions have approval and re-review evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-CM.3',
    name: 'Removal of Unnecessary Software and Services',
    description: 'Maintain ePHI-bearing systems with only the software and services necessary for documented business function, and remove unnecessary components.',
    category: 'Configuration Management',
    implementationGuidance: 'Establish baseline configurations per system class identifying approved software, services, and ports. Periodically scan systems for deviations and remove unnecessary components. Implement allow-listing where feasible. Decommission unused services and ports. Document baselines, deviations, and remediation activity. Tie baseline review to change management workflow.',
    evidenceRequirements: ['Baseline configuration documentation per system class', 'Deviation scan reports', 'Removal and decommissioning records', 'Allow-list configuration where applicable'],
    testProcedures: ['Inspect baseline configurations for ePHI system classes', 'Sample systems and verify alignment with baseline', 'Trace deviations to remediation evidence'],
    status: 'Not Started'
  },

  // ===== Incident Response =====
  {
    controlId: 'HIPAA-NPRM-IR.1',
    name: 'Incident Response Plan with Specific Required Elements',
    description: 'Maintain a written incident response plan addressing identification, containment, eradication, recovery, and post-incident analysis, with defined roles, communication procedures, and integration with breach notification.',
    category: 'Incident Response',
    implementationGuidance: 'The incident response plan must address: preparation; identification and analysis; containment; eradication; recovery and validation; and post-incident lessons learned. Define roles (incident commander, communications lead, technical responders), escalation criteria, internal and external communication procedures, evidence preservation requirements, and integration with the HIPAA breach notification process at 45 CFR 164.404-164.410. Test the plan annually and revise based on test results and lessons learned.',
    evidenceRequirements: ['Written incident response plan covering all required elements', 'Role assignments and contact rosters', 'Annual incident response exercise report', 'Integration documentation with breach notification process'],
    testProcedures: ['Inspect the IR plan for each required element', 'Verify role assignments and contact rosters are current', 'Sample a recent exercise and confirm after-action and revision evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'HIPAA-NPRM-IR.2',
    name: 'Breach Reporting Timeline Alignment',
    description: 'Align incident response procedures with HIPAA breach notification timelines, including individual notification within 60 days of discovery and HHS notification per the applicable thresholds.',
    category: 'Incident Response',
    implementationGuidance: 'Embed breach notification timeline triggers within the incident response workflow. Upon a determination that a breach of unsecured PHI has occurred, ensure individual notifications are issued without unreasonable delay and no later than 60 calendar days. For breaches affecting 500 or more individuals, notify HHS contemporaneously with individual notification. For breaches affecting fewer than 500 individuals, log for the annual HHS submission. Coordinate with legal and communications. Retain notification records for at least six years.',
    evidenceRequirements: ['Breach notification procedure with timeline triggers', 'Individual notification templates and logs', 'HHS notification submission records', 'Annual log of sub-500 breaches'],
    testProcedures: ['Inspect the breach notification procedure for timeline integration', 'Sample any breaches and verify notification within 60 days', 'Confirm HHS submissions exist for in-scope breaches'],
    status: 'Not Started'
  },

  // ===== Audit Controls =====
  {
    controlId: 'HIPAA-NPRM-LOG.1',
    name: 'Audit Logging and Review for ePHI Systems',
    description: 'Implement audit controls that record and examine activity in information systems containing ePHI, with defined log retention and periodic review for anomalous activity.',
    category: 'Audit Controls',
    implementationGuidance: 'Configure audit logging on ePHI-bearing systems to capture authentication, authorization, data access, configuration change, and administrator activity. Centralize logs to a SIEM or equivalent. Retain logs for a period aligned to regulatory and forensic needs (typically minimum six years for HIPAA-relevant logs). Define and operate periodic review procedures — automated alerts plus periodic manual review of high-risk activity. Investigate anomalies and document outcomes.',
    evidenceRequirements: ['Audit logging configuration per system class', 'Centralized SIEM or equivalent ingestion evidence', 'Log retention policy and storage evidence', 'Periodic review records and anomaly investigation log'],
    testProcedures: ['Sample ePHI systems and verify required event types are logged', 'Inspect SIEM ingestion for completeness', 'Sample anomalies and trace through investigation closure'],
    status: 'Not Started'
  },

  // ===== Sanctions and Workforce Management =====
  {
    controlId: 'HIPAA-NPRM-SAN.1',
    name: 'Sanctions Policy Enforcement and Access Termination Timing',
    description: 'Apply a sanctions policy to workforce members who violate Security Rule policies and procedures, and terminate access promptly upon separation or role change.',
    category: 'Workforce Management',
    implementationGuidance: 'Maintain a documented sanctions policy with proportional consequences and document application following violations. Integrate the workforce off-boarding workflow with access deprovisioning so that access is terminated promptly upon separation. For role changes, conduct an access review and remove privileges no longer required. Track time-to-termination metrics and investigate exceptions.',
    evidenceRequirements: ['Sanctions policy with proportional consequence framework', 'Sanctions application records', 'Workforce off-boarding workflow including access deprovisioning', 'Time-to-termination metrics dashboard'],
    testProcedures: ['Inspect the sanctions policy and recent applications', 'Sample terminations and verify access removal timing', 'Sample role changes and verify privilege adjustments'],
    status: 'Not Started'
  }
];
