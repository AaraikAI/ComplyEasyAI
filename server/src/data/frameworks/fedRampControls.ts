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

export const FEDRAMP_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // ACCESS CONTROL (AC) - 14 Controls
  // ============================================================
  {
    controlId: 'FR-AC-1',
    name: 'Access Control Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate an access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance. The policy must be reviewed and updated at least every three years, and procedures at least annually, in accordance with FedRAMP Moderate baseline requirements.',
    category: 'Access Control',
    implementationGuidance:
      'Develop a formal access control policy document that addresses all FedRAMP Moderate baseline requirements. The policy must define roles and responsibilities for access management, include provisions for periodic review, and align with NIST SP 800-53 AC-1 with FedRAMP-specific parameters. Ensure the policy is approved by an authorizing official and disseminated to all relevant personnel. Procedures must be reviewed annually and updated to reflect changes in the system or threat landscape.',
    evidenceRequirements: [
      'Documented access control policy approved by authorizing official with date of last review',
      'Access control procedures document with annual review date',
      'Evidence of policy dissemination to all relevant personnel (email distribution records, acknowledgment forms)',
      'Policy review and update records showing three-year review cycle for policy and annual cycle for procedures',
      'Mapping of access control policy to FedRAMP Moderate baseline requirements',
    ],
    testProcedures: [
      'Verify the access control policy exists, is current, and has been reviewed within the last three years',
      'Verify access control procedures exist, are current, and have been reviewed within the last year',
      'Confirm policy addresses purpose, scope, roles, responsibilities, management commitment, and compliance',
      'Interview personnel to confirm awareness of access control policies and procedures',
      'Review dissemination records to ensure all relevant personnel have received the policy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2',
    name: 'Account Management',
    description:
      'FedRAMP requires organizations to manage information system accounts including identifying and selecting account types, assigning account managers, establishing conditions for group and role membership, authorizing access, and monitoring accounts. FedRAMP Moderate baseline requires automated mechanisms for account management and accounts must be reviewed at least annually. Temporary and emergency accounts must be automatically disabled within 24 hours.',
    category: 'Access Control',
    implementationGuidance:
      'Implement an automated account management system that supports the full account lifecycle: creation, modification, disabling, and removal. Configure automatic disabling of temporary and emergency accounts after no more than 24 hours as required by FedRAMP. Establish account review processes that occur at least annually. Implement automated notifications for account creation, modification, and termination. Ensure all account types are identified and documented, including privileged, non-privileged, system, service, guest, and temporary accounts.',
    evidenceRequirements: [
      'Inventory of all system account types with assigned account managers',
      'Automated account management system configuration documentation',
      'Records of annual account reviews with findings and remediation actions',
      'Automated notification configuration for account lifecycle events',
      'Evidence of temporary/emergency account auto-disable within 24 hours',
      'Account authorization records with approval chains',
    ],
    testProcedures: [
      'Review account inventory and verify all account types are identified and documented',
      'Test automated account management mechanisms for creation, modification, and removal',
      'Verify temporary and emergency accounts are automatically disabled within 24 hours',
      'Review most recent annual account review results and remediation actions',
      'Test automated notification mechanisms for account lifecycle events',
      'Verify account managers are assigned for all accounts and actively managing their accounts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-3',
    name: 'Access Enforcement',
    description:
      'FedRAMP requires the information system to enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies. Access enforcement mechanisms must align with the FedRAMP Moderate baseline and implement role-based access control (RBAC) or attribute-based access control (ABAC) as appropriate for the system.',
    category: 'Access Control',
    implementationGuidance:
      'Implement access enforcement mechanisms that restrict system access to authorized users, processes, and devices. Deploy role-based or attribute-based access control aligned with the principle of least privilege. Configure the system to enforce access control policies at all relevant enforcement points including application layer, database layer, and network layer. Ensure access control lists (ACLs) are maintained and reviewed regularly. Implement deny-by-default policies where access is denied unless explicitly granted.',
    evidenceRequirements: [
      'Access control mechanism configuration documentation (RBAC/ABAC policies)',
      'Access control lists (ACLs) for all system components',
      'Evidence of deny-by-default configuration across enforcement points',
      'Role definitions and permission matrices',
      'Access enforcement testing results from most recent assessment',
    ],
    testProcedures: [
      'Test access enforcement mechanisms by attempting unauthorized access to resources',
      'Verify role-based access control assignments match documented role definitions',
      'Confirm deny-by-default is implemented at all access enforcement points',
      'Review access control lists for accuracy and least privilege adherence',
      'Test access enforcement across application, database, and network layers',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-4',
    name: 'Information Flow Enforcement',
    description:
      'FedRAMP requires the information system to enforce approved authorizations for controlling the flow of information within the system and between interconnected systems. FedRAMP Moderate baseline mandates enforcement of information flow control policies including boundary protection between security domains, network segmentation, and data loss prevention measures.',
    category: 'Access Control',
    implementationGuidance:
      'Implement information flow control mechanisms at system boundaries and between security domains. Deploy firewalls, data loss prevention (DLP) tools, and network segmentation to enforce approved information flow policies. Configure boundary protection devices to restrict traffic based on defined security policies. Implement content filtering and data labeling where required. Ensure cross-domain information flows are explicitly authorized and monitored. Document all approved information flow paths and ensure unauthorized flows are blocked.',
    evidenceRequirements: [
      'Network architecture diagrams showing information flow paths and security boundaries',
      'Firewall and boundary protection device rule sets',
      'Data loss prevention (DLP) policy configurations',
      'Network segmentation documentation and VLAN configurations',
      'Approved information flow authorization records',
      'Cross-domain solution configurations if applicable',
    ],
    testProcedures: [
      'Review network architecture to verify information flow enforcement at all boundaries',
      'Test firewall rules to confirm unauthorized information flows are blocked',
      'Verify DLP mechanisms detect and prevent unauthorized data transfers',
      'Test network segmentation effectiveness between security domains',
      'Verify cross-domain information flows are authorized and logged',
      'Attempt unauthorized information transfers and confirm they are blocked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-5',
    name: 'Separation of Duties',
    description:
      'FedRAMP requires organizations to separate duties of individuals to reduce risk of malicious activity without collusion. The FedRAMP Moderate baseline mandates that access authorizations support separation of duties including separating system administration from audit administration, and ensuring no single individual can authorize, implement, and verify changes.',
    category: 'Access Control',
    implementationGuidance:
      'Define and implement separation of duties across all critical system functions. Ensure that system administration, security administration, and audit functions are performed by different individuals or roles. Implement technical controls to enforce separation of duties where possible. Document all separation of duties requirements and ensure role assignments prevent conflicts. Implement compensating controls where complete separation is not feasible, with appropriate risk acceptance documentation.',
    evidenceRequirements: [
      'Separation of duties matrix documenting incompatible roles and functions',
      'Role assignment records demonstrating separation of critical functions',
      'Technical control configurations enforcing separation of duties',
      'Compensating control documentation where full separation is not feasible',
      'Risk acceptance documentation for any exceptions to separation of duties',
    ],
    testProcedures: [
      'Review separation of duties matrix for completeness and accuracy',
      'Verify no single individual can authorize, implement, and verify changes',
      'Confirm system administration and audit administration are separated',
      'Test technical controls enforcing separation of duties',
      'Review compensating controls and risk acceptance documentation for exceptions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6',
    name: 'Least Privilege',
    description:
      'FedRAMP requires organizations to employ the principle of least privilege, allowing only authorized accesses for users and processes which are necessary to accomplish assigned tasks. FedRAMP Moderate baseline requires that privileged accounts are restricted to specific personnel, privileged access is authorized by designated officials, and privileged functions are audited.',
    category: 'Access Control',
    implementationGuidance:
      'Implement least privilege across all system accounts and processes. Restrict privileged accounts to only those personnel who require elevated access to perform their duties. Implement just-in-time (JIT) privileged access where feasible. Require explicit authorization from designated officials for all privileged access grants. Configure systems to log all privileged function executions. Conduct regular reviews of privileged access to ensure continued need. Remove unnecessary privileges and default accounts.',
    evidenceRequirements: [
      'Privileged account inventory with justification for each privileged access grant',
      'Authorization records from designated officials for privileged access',
      'Privileged access review records showing periodic validation of continued need',
      'System configuration showing audit logging of privileged functions',
      'Evidence of removal of unnecessary default accounts and privileges',
      'Just-in-time access provisioning configuration if implemented',
    ],
    testProcedures: [
      'Review privileged account inventory and verify justification for each account',
      'Verify authorization records exist for all privileged access grants',
      'Confirm privileged functions are logged and audit logs are reviewed',
      'Test that non-privileged users cannot execute privileged functions',
      'Review privileged access review records for timeliness and completeness',
      'Verify default accounts and unnecessary privileges have been removed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-7',
    name: 'Unsuccessful Logon Attempts',
    description:
      'FedRAMP requires the information system to enforce a limit on consecutive invalid logon attempts by a user. FedRAMP Moderate baseline requires the system to automatically lock the account for a minimum of 30 minutes or until released by an administrator after no more than three consecutive invalid logon attempts within a 15-minute window.',
    category: 'Access Control',
    implementationGuidance:
      'Configure all system components to enforce account lockout after no more than three consecutive invalid logon attempts within a 15-minute period. Set the lockout duration to a minimum of 30 minutes or require administrator intervention to unlock. Implement lockout notification to security personnel for privileged accounts. Ensure lockout policies apply to all access points including web applications, APIs, SSH, and administrative consoles. Document any exceptions and implement compensating controls.',
    evidenceRequirements: [
      'Account lockout policy configuration for all system access points',
      'System configuration screenshots showing 3-attempt lockout threshold',
      'Configuration evidence of 30-minute minimum lockout duration',
      'Lockout notification configuration for privileged account lockouts',
      'Testing results validating lockout behavior across all access points',
    ],
    testProcedures: [
      'Test account lockout by attempting four consecutive invalid logon attempts',
      'Verify account locks for a minimum of 30 minutes after three failed attempts',
      'Confirm lockout applies across all system access points (web, API, SSH, console)',
      'Test lockout notification mechanisms for privileged account lockouts',
      'Verify the 15-minute window resets after the lockout period expires',
      'Confirm administrator unlock capability functions correctly',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-8',
    name: 'System Use Notification',
    description:
      'FedRAMP requires the information system to display an approved system use notification message or banner before granting access. The notification must include privacy and security notices consistent with applicable federal laws, regulations, and policies. FedRAMP requires the banner to remain on screen until the user acknowledges the usage conditions.',
    category: 'Access Control',
    implementationGuidance:
      'Implement system use notification banners on all system access points. The banner must include language approved by the organization regarding authorized use, monitoring, recording, and consequences of unauthorized access. The banner must remain displayed until the user explicitly acknowledges the notification before gaining access. Ensure banners are displayed for all access methods including interactive logins, web interfaces, and remote access. Use the DoD or agency-approved banner text as a template.',
    evidenceRequirements: [
      'System use notification banner text approved by authorizing official',
      'Screenshots of banner display on all access points (web, SSH, console, VPN)',
      'Configuration evidence showing banner display before authentication',
      'Evidence that users must acknowledge banner before gaining access',
      'Banner content review and approval records',
    ],
    testProcedures: [
      'Verify system use notification banner displays before authentication on all access points',
      'Confirm banner contains required privacy and security notices',
      'Test that access is not granted until user acknowledges the banner',
      'Verify banner text matches the approved notification language',
      'Test banner display on web interfaces, SSH sessions, VPN connections, and admin consoles',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-11',
    name: 'Session Lock',
    description:
      'FedRAMP requires the information system to prevent further access by initiating a session lock after a maximum of 15 minutes of inactivity. The session lock must remain in effect until the user re-establishes access using established identification and authentication procedures. FedRAMP Moderate baseline specifies the 15-minute inactivity timeout as a mandatory parameter.',
    category: 'Access Control',
    implementationGuidance:
      'Configure session lock mechanisms on all system components to activate after 15 minutes of inactivity as required by FedRAMP Moderate baseline. Implement session locks for all interactive sessions including web applications, remote desktop, SSH, and administrative consoles. Ensure session locks require re-authentication to resume. Configure screen savers or lock screens as appropriate. Implement session timeout for web applications that redirect to the login page after the inactivity period.',
    evidenceRequirements: [
      'Session lock configuration documentation for all system components',
      'Configuration screenshots showing 15-minute inactivity timeout settings',
      'Web application session timeout configuration',
      'Group policy or equivalent settings for workstation session lock',
      'Testing results confirming session lock activates at 15 minutes of inactivity',
    ],
    testProcedures: [
      'Test session lock activation after 15 minutes of inactivity on web applications',
      'Verify session lock on remote access sessions (SSH, RDP, VPN)',
      'Confirm re-authentication is required to resume locked sessions',
      'Test session lock on administrative consoles and management interfaces',
      'Verify session lock cannot be bypassed or extended beyond 15 minutes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-14',
    name: 'Permitted Actions Without Identification or Authentication',
    description:
      'FedRAMP requires organizations to identify specific user actions that can be performed on the information system without identification or authentication, and document and justify such actions. FedRAMP Moderate baseline requires explicit documentation of all actions permitted without authentication, which typically include only access to publicly available information.',
    category: 'Access Control',
    implementationGuidance:
      'Identify and document all actions that users can perform without identification or authentication. Limit unauthenticated actions to those that are essential, such as viewing publicly available information or accessing the login page. Ensure all other actions require proper identification and authentication. Obtain formal authorization for all permitted unauthenticated actions. Review and update the list of permitted unauthenticated actions at least annually.',
    evidenceRequirements: [
      'Documentation of all actions permitted without identification or authentication',
      'Justification for each permitted unauthenticated action',
      'Authorization records from designated official approving unauthenticated actions',
      'Annual review records of permitted unauthenticated actions',
      'System configuration evidence restricting unauthenticated access to approved actions only',
    ],
    testProcedures: [
      'Review the list of permitted unauthenticated actions for completeness',
      'Verify only documented actions can be performed without authentication',
      'Attempt to perform unauthorized actions without authentication and confirm they are blocked',
      'Review justifications for each permitted unauthenticated action',
      'Confirm annual review of permitted unauthenticated actions has been conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-17',
    name: 'Remote Access',
    description:
      'FedRAMP requires organizations to establish, document, and enforce restrictions and usage guidance for each type of remote access allowed. FedRAMP Moderate baseline requires encrypted remote access sessions using FIPS 140-2 validated cryptography, multi-factor authentication for all remote access, and monitoring of remote access connections. All remote access must be authorized prior to allowing connections.',
    category: 'Access Control',
    implementationGuidance:
      'Implement encrypted remote access using FIPS 140-2 validated cryptographic modules as required by FedRAMP. Enforce multi-factor authentication for all remote access connections. Document all authorized remote access methods and usage restrictions. Implement VPN or equivalent encrypted tunnels for remote access. Monitor and log all remote access sessions. Restrict remote access to specific authorized users and from specific locations where feasible. Implement session controls including timeout and concurrent session limits.',
    evidenceRequirements: [
      'Remote access policy documenting authorized methods and usage restrictions',
      'VPN or encrypted tunnel configuration with FIPS 140-2 validated cryptography evidence',
      'Multi-factor authentication configuration for remote access',
      'Remote access authorization records for each user',
      'Remote access session monitoring and logging configuration',
      'FIPS 140-2 validation certificates for cryptographic modules used',
    ],
    testProcedures: [
      'Verify remote access sessions are encrypted using FIPS 140-2 validated cryptography',
      'Test multi-factor authentication enforcement for all remote access methods',
      'Confirm only authorized remote access methods are available',
      'Review remote access logs for completeness and monitoring effectiveness',
      'Attempt remote access without MFA and verify it is denied',
      'Test session timeout and concurrent session controls for remote access',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-18',
    name: 'Wireless Access',
    description:
      'FedRAMP requires organizations to establish usage restrictions, configuration/connection requirements, and implementation guidance for wireless access. FedRAMP Moderate baseline requires authentication and encryption of wireless connections using protocols that meet FedRAMP cryptographic requirements. Unauthorized wireless access points must be detected and addressed.',
    category: 'Access Control',
    implementationGuidance:
      'Implement wireless access controls including WPA3 or WPA2-Enterprise with FIPS-validated encryption. Deploy wireless intrusion detection/prevention systems (WIDS/WIPS) to detect rogue access points. Require authentication for all wireless connections using 802.1X or equivalent. Disable wireless networking on systems that do not require it. Segment wireless networks from the internal wired network. Conduct regular wireless security assessments and rogue access point scans.',
    evidenceRequirements: [
      'Wireless access policy documenting usage restrictions and configuration requirements',
      'Wireless network configuration showing encryption and authentication settings',
      'Wireless intrusion detection/prevention system deployment documentation',
      'Rogue access point scanning results and remediation records',
      'Wireless network segmentation architecture documentation',
      'Wireless security assessment results',
    ],
    testProcedures: [
      'Verify wireless encryption meets FedRAMP cryptographic requirements (FIPS 140-2)',
      'Test wireless authentication mechanisms (802.1X or equivalent)',
      'Confirm wireless IDS/IPS is operational and detecting unauthorized access points',
      'Verify wireless network is segmented from internal wired networks',
      'Scan for rogue wireless access points and verify detection capabilities',
      'Test that wireless access is disabled on systems not requiring wireless connectivity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-19',
    name: 'Access Control for Mobile Devices',
    description:
      'FedRAMP requires organizations to establish usage restrictions, configuration requirements, connection requirements, and implementation guidance for organization-controlled mobile devices. FedRAMP Moderate baseline requires mobile device management (MDM) solutions, encryption of data on mobile devices, and remote wipe capabilities for lost or stolen devices.',
    category: 'Access Control',
    implementationGuidance:
      'Deploy a mobile device management (MDM) solution to enforce security policies on all organization-controlled mobile devices. Require full-device encryption on all mobile devices. Implement remote wipe capabilities for lost or stolen devices. Enforce strong authentication on mobile devices including biometric or PIN/password. Restrict application installation to approved applications. Implement containerization to separate organizational data from personal data on BYOD devices if allowed. Require mobile devices to be updated with the latest security patches.',
    evidenceRequirements: [
      'Mobile device policy documenting usage restrictions and configuration requirements',
      'Mobile device management (MDM) solution deployment and configuration documentation',
      'Mobile device encryption configuration evidence',
      'Remote wipe capability configuration and testing records',
      'Mobile device inventory with assigned users',
      'Mobile application whitelist/blacklist configuration',
    ],
    testProcedures: [
      'Verify MDM solution is deployed and enforcing security policies on all mobile devices',
      'Test mobile device encryption is active and cannot be disabled by users',
      'Verify remote wipe capability functions correctly',
      'Confirm strong authentication is required on all mobile devices',
      'Test application restriction controls on managed devices',
      'Verify mobile devices are receiving and applying security updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-20',
    name: 'Use of External Information Systems',
    description:
      'FedRAMP requires organizations to establish terms and conditions for authorized individuals to access the information system from external information systems. FedRAMP Moderate baseline requires restrictions on the types of information that can be accessed or stored on external systems and requires verification that security controls on external systems meet FedRAMP requirements before allowing connections.',
    category: 'Access Control',
    implementationGuidance:
      'Establish and enforce terms and conditions for accessing the system from external information systems. Define what information can be accessed, processed, or stored on external systems. Verify that external systems implement adequate security controls before allowing interconnection. Implement technical controls to limit the types of information accessible from external systems. Require signed interconnection security agreements (ISAs) for external system connections. Monitor and audit access from external systems.',
    evidenceRequirements: [
      'Policy for use of external information systems with terms and conditions',
      'Interconnection security agreements (ISAs) for all external system connections',
      'External system security control verification records',
      'Technical control configurations limiting information access from external systems',
      'Monitoring and audit records for access from external information systems',
      'Authorized external systems inventory with risk assessment results',
    ],
    testProcedures: [
      'Review policy and terms for external system access for completeness',
      'Verify interconnection security agreements exist for all external system connections',
      'Confirm external system security controls have been verified and documented',
      'Test technical controls restricting information access from external systems',
      'Review monitoring and audit logs for external system access',
      'Verify authorized external systems inventory is current and accurate',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // AUDIT AND ACCOUNTABILITY (AU) - 10 Controls
  // ============================================================
  {
    controlId: 'FR-AU-1',
    name: 'Audit and Accountability Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate an audit and accountability policy that addresses purpose, scope, roles, responsibilities, and compliance. FedRAMP Moderate baseline requires the policy to be reviewed and updated at least every three years and procedures at least annually. The policy must address FedRAMP continuous monitoring requirements for audit data.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Develop a comprehensive audit and accountability policy that addresses all FedRAMP Moderate baseline requirements. Include provisions for audit record generation, review, analysis, and reporting. Address FedRAMP continuous monitoring requirements including monthly vulnerability scanning and annual security assessments. Define roles and responsibilities for audit management. Ensure procedures address audit log protection, retention, and analysis requirements specific to FedRAMP.',
    evidenceRequirements: [
      'Documented audit and accountability policy approved by authorizing official',
      'Audit and accountability procedures with annual review date',
      'Policy dissemination records to all relevant personnel',
      'Policy and procedure review records showing compliance with review cycles',
      'Mapping of audit policy to FedRAMP Moderate baseline and continuous monitoring requirements',
    ],
    testProcedures: [
      'Verify audit and accountability policy is current and reviewed within three years',
      'Verify procedures are current and reviewed within one year',
      'Confirm policy addresses all required elements including FedRAMP continuous monitoring',
      'Interview personnel to validate awareness of audit policies and procedures',
      'Review dissemination records for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-2',
    name: 'Audit Events',
    description:
      'FedRAMP requires the information system to generate audit records for defined auditable events. FedRAMP Moderate baseline specifies that auditable events include successful and unsuccessful logon attempts, privileged function executions, account management activities, access enforcement actions, and security-relevant configuration changes. FedRAMP requires continuous monitoring with monthly review of audit logs.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Configure the system to audit all FedRAMP-required events including: successful and unsuccessful authentication attempts, privileged operations, account creation/modification/deletion, access control decisions (grants and denials), security configuration changes, system startup and shutdown, and administrative actions. Implement monthly audit log review processes as part of FedRAMP continuous monitoring. Coordinate auditable event selection with the FedRAMP PMO and review the event list annually.',
    evidenceRequirements: [
      'List of auditable events configured in the system aligned with FedRAMP requirements',
      'System configuration showing audit event generation for all required event types',
      'Monthly audit log review records as required by FedRAMP continuous monitoring',
      'Annual review records of the auditable events list',
      'Audit configuration documentation for all system components',
    ],
    testProcedures: [
      'Verify audit records are generated for all FedRAMP-required event types',
      'Test audit record generation for successful and unsuccessful logon attempts',
      'Confirm privileged function executions generate audit records',
      'Verify account management activities are audited',
      'Review monthly audit log review records for completeness and timeliness',
      'Validate annual review of the auditable events list has been conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-3',
    name: 'Content of Audit Records',
    description:
      'FedRAMP requires the information system to generate audit records containing information that establishes what type of event occurred, when it occurred, where it occurred, the source of the event, the outcome, and the identity of individuals or subjects associated with the event. FedRAMP Moderate baseline requires additional detail including full-text recording of privileged commands.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Configure audit records to include at minimum: event type, date and time, event location (system component), source address, outcome (success/failure), and user/subject identity. For privileged commands, enable full-text recording of command input and output. Ensure timestamp accuracy by synchronizing with authoritative time sources. Include session identifiers and additional context fields to support correlation and forensic analysis. Standardize audit record format across all system components where possible.',
    evidenceRequirements: [
      'Audit record format documentation showing all required fields',
      'Sample audit records demonstrating required content fields',
      'Configuration evidence for full-text recording of privileged commands',
      'Time synchronization configuration for accurate timestamps',
      'Audit record standardization documentation across system components',
    ],
    testProcedures: [
      'Review sample audit records to verify all required content fields are present',
      'Verify audit records include event type, timestamp, location, source, outcome, and identity',
      'Confirm full-text recording of privileged commands is operational',
      'Validate timestamp accuracy against authoritative time source',
      'Test audit record content across multiple system components for consistency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-4',
    name: 'Audit Storage Capacity',
    description:
      'FedRAMP requires organizations to allocate audit record storage capacity in accordance with audit record storage requirements. FedRAMP Moderate baseline requires sufficient storage to retain audit records for at least one year online and three years total as part of FedRAMP record retention requirements. Storage capacity must be monitored and alerts configured for capacity thresholds.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Allocate sufficient audit log storage to retain records for at least one year online with immediate availability, and a total of three years in archived storage as required by FedRAMP. Implement automated monitoring of audit storage capacity with alerts at 75% and 90% thresholds. Configure automatic log rotation and archival processes. Plan for storage growth based on audit volume trends. Ensure archived logs remain accessible for investigation and compliance verification throughout the three-year retention period.',
    evidenceRequirements: [
      'Audit storage capacity allocation documentation with sizing justification',
      'Storage monitoring configuration with alert thresholds',
      'Log rotation and archival configuration',
      'Evidence of one-year online retention and three-year total retention capability',
      'Storage capacity trend analysis and growth planning documentation',
    ],
    testProcedures: [
      'Verify audit storage capacity meets FedRAMP retention requirements (1 year online, 3 years total)',
      'Test storage capacity alerts at configured thresholds (75%, 90%)',
      'Confirm log rotation and archival processes function correctly',
      'Verify archived audit records are accessible and retrievable',
      'Review storage capacity monitoring trends and growth planning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-5',
    name: 'Response to Audit Processing Failures',
    description:
      'FedRAMP requires the information system to alert designated organizational officials in the event of an audit processing failure and take defined actions. FedRAMP Moderate baseline requires real-time alerts to system administrators and information system security officers (ISSOs) when audit failures occur, and the system must overwrite the oldest audit records in case of storage capacity exhaustion.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Configure the system to generate real-time alerts to system administrators and ISSOs when audit processing failures occur. Implement automated responses to audit failures including overwriting the oldest audit records when storage is exhausted (unless a more restrictive approach like system shutdown is required). Configure monitoring for audit subsystem health. Implement redundancy for critical audit infrastructure. Test audit failure response mechanisms regularly to ensure they function correctly.',
    evidenceRequirements: [
      'Audit failure alerting configuration documentation',
      'Alert recipient list including system administrators and ISSOs',
      'Automated response configuration for audit processing failures',
      'Audit subsystem health monitoring configuration',
      'Audit failure response testing records',
    ],
    testProcedures: [
      'Simulate an audit processing failure and verify alerts are generated',
      'Confirm alerts are received by designated system administrators and ISSOs',
      'Test automated response actions when audit storage capacity is exhausted',
      'Verify audit subsystem health monitoring is active and functional',
      'Review audit failure response testing records for recent test results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-6',
    name: 'Audit Review, Analysis, and Reporting',
    description:
      'FedRAMP requires organizations to review and analyze audit records for indications of inappropriate or unusual activity. FedRAMP Moderate baseline requires audit log review at least weekly, with automated mechanisms to integrate audit review, analysis, and reporting. FedRAMP requires continuous monitoring with monthly vulnerability scanning and ongoing audit analysis as part of the continuous monitoring program.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement automated audit log analysis tools (SIEM) to support continuous review and correlation of audit records. Conduct manual audit log reviews at least weekly as required by FedRAMP Moderate baseline. Establish automated reporting for suspicious or anomalous activities. Integrate audit analysis with the FedRAMP continuous monitoring program including monthly vulnerability scanning correlation. Define and implement audit analysis rules and correlation logic to detect security incidents. Report findings to appropriate organizational officials.',
    evidenceRequirements: [
      'SIEM or automated audit analysis tool deployment and configuration documentation',
      'Weekly audit log review records with analyst findings',
      'Automated alerting rules and correlation logic documentation',
      'Audit analysis reports shared with organizational officials',
      'Integration evidence with FedRAMP continuous monitoring program',
      'Monthly vulnerability scan correlation with audit findings',
    ],
    testProcedures: [
      'Verify automated audit analysis tools are operational and processing all audit data',
      'Review weekly audit log review records for completeness and timeliness',
      'Test automated alerting for suspicious or anomalous activity patterns',
      'Confirm audit analysis findings are reported to appropriate officials',
      'Verify integration with FedRAMP continuous monitoring program',
      'Review correlation of audit data with monthly vulnerability scan results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-8',
    name: 'Time Stamps',
    description:
      'FedRAMP requires the information system to use internal system clocks to generate time stamps for audit records. FedRAMP Moderate baseline requires synchronization of system clocks with an authoritative time source (e.g., NIST Internet Time Servers) and that time stamps include date and time with a granularity of one second or finer. FedRAMP requires UTC or an approved time zone for all audit timestamps.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Configure all system components to synchronize with authoritative time sources such as NIST Internet Time Servers (time.nist.gov) or GPS-based time sources. Implement NTP (Network Time Protocol) across all system components with a synchronization frequency sufficient to maintain one-second granularity. Configure audit records to include UTC timestamps or an approved time zone. Monitor time synchronization status and alert on synchronization failures. Implement redundant time sources to ensure continuous accuracy.',
    evidenceRequirements: [
      'NTP configuration documentation for all system components',
      'Authoritative time source identification (e.g., NIST time servers)',
      'Time synchronization monitoring configuration and alert settings',
      'Sample audit records showing UTC timestamps with one-second granularity',
      'Time synchronization status reports and drift analysis',
    ],
    testProcedures: [
      'Verify NTP is configured on all system components with authoritative time sources',
      'Confirm audit record timestamps include date and time with one-second or finer granularity',
      'Test time synchronization accuracy across system components',
      'Verify time synchronization monitoring and alerting for drift or failure',
      'Review sample audit records for consistent timestamp format (UTC)',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-9',
    name: 'Protection of Audit Information',
    description:
      'FedRAMP requires the information system to protect audit information and audit tools from unauthorized access, modification, and deletion. FedRAMP Moderate baseline requires that audit information is protected using access controls, encryption, and integrity verification mechanisms. Audit logs must be stored on separate systems or media from the systems being audited where feasible.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement access controls to restrict audit log access to authorized personnel only (security administrators and auditors). Store audit logs on separate systems or centralized log management infrastructure. Implement encryption for audit logs both in transit and at rest. Deploy integrity verification mechanisms (hashing, digital signatures) to detect unauthorized modification of audit records. Implement backup and redundancy for audit data. Restrict physical and logical access to audit infrastructure.',
    evidenceRequirements: [
      'Access control configuration for audit logs and audit infrastructure',
      'Centralized log management or separate audit storage system documentation',
      'Encryption configuration for audit logs in transit and at rest',
      'Integrity verification mechanism configuration (hashing, digital signatures)',
      'Audit data backup and redundancy configuration',
      'Access logs for audit infrastructure showing authorized access only',
    ],
    testProcedures: [
      'Verify access controls restrict audit log access to authorized personnel only',
      'Confirm audit logs are stored on separate systems from the systems being audited',
      'Test encryption of audit logs in transit and at rest',
      'Verify integrity verification mechanisms detect unauthorized modifications',
      'Test audit data backup and recovery procedures',
      'Attempt unauthorized access to audit logs and confirm it is denied',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-11',
    name: 'Audit Record Retention',
    description:
      'FedRAMP requires organizations to retain audit records for a defined period to provide support for after-the-fact investigations and to meet regulatory and organizational information retention requirements. FedRAMP Moderate baseline requires retention of audit records for at least one year online and accessible, with a minimum total retention period of three years.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement audit record retention mechanisms that maintain records online and accessible for at least one year, with archived storage for a total retention period of at least three years as required by FedRAMP. Configure automated archival processes to move older audit records from online to archived storage. Ensure archived records remain searchable and retrievable within a reasonable timeframe. Implement retention policies in the centralized log management system. Document the retention schedule and ensure compliance with any additional agency-specific retention requirements.',
    evidenceRequirements: [
      'Audit record retention policy documenting one-year online and three-year total retention',
      'Log management system retention configuration showing compliance with retention periods',
      'Archival process configuration and documentation',
      'Evidence of archived records being searchable and retrievable',
      'Retention schedule documentation aligned with FedRAMP and agency requirements',
    ],
    testProcedures: [
      'Verify audit records from the past year are accessible online',
      'Confirm audit records older than one year but within three years are available in archives',
      'Test retrieval of archived audit records to verify accessibility',
      'Review log management system retention configuration for compliance',
      'Verify automated archival processes function correctly',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-12',
    name: 'Audit Generation',
    description:
      'FedRAMP requires the information system to provide audit record generation capability for the auditable events defined in AU-2 at all information system and network components. FedRAMP Moderate baseline requires that audit generation is enabled by default and cannot be disabled by non-privileged users. The system must allow authorized personnel to select which auditable events are to be audited by specific components.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Enable audit record generation on all system and network components for the events identified in AU-2. Configure audit generation as a default-on setting that cannot be disabled by non-privileged users. Provide authorized security personnel with the ability to configure which events are audited on specific components. Implement centralized audit configuration management where possible. Verify audit generation is active on all components including servers, network devices, databases, and applications. Monitor audit generation status and alert on any disruptions.',
    evidenceRequirements: [
      'Audit generation configuration documentation for all system components',
      'Configuration evidence showing audit generation is enabled by default',
      'Access control configuration preventing non-privileged users from disabling audit',
      'Centralized audit configuration management documentation',
      'Audit generation monitoring and alerting configuration',
      'Component inventory with audit generation status for each component',
    ],
    testProcedures: [
      'Verify audit generation is active on all system and network components',
      'Test that non-privileged users cannot disable or modify audit generation settings',
      'Confirm authorized personnel can configure auditable events per component',
      'Review audit generation across servers, network devices, databases, and applications',
      'Test audit generation monitoring and alerting for disruptions',
      'Verify centralized audit configuration management is functional',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CONFIGURATION MANAGEMENT (CM) - 7 Controls
  // ============================================================
  {
    controlId: 'FR-CM-1',
    name: 'Configuration Management Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a configuration management policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance. The policy must be reviewed at least every three years and procedures annually in accordance with FedRAMP Moderate baseline requirements.',
    category: 'Configuration Management',
    implementationGuidance:
      'Develop a configuration management policy that addresses all FedRAMP Moderate baseline requirements including baseline configuration management, change control, configuration monitoring, and deviation handling. Define roles and responsibilities for configuration management activities. Establish procedures for configuration item identification, change control, configuration status accounting, and configuration audits. Align the policy with NIST SP 800-53 CM controls and FedRAMP-specific parameters.',
    evidenceRequirements: [
      'Configuration management policy document approved by authorizing official',
      'Configuration management procedures with annual review dates',
      'Policy dissemination records to relevant personnel',
      'Review and update records for policy (three-year cycle) and procedures (annual cycle)',
      'Roles and responsibilities matrix for configuration management activities',
    ],
    testProcedures: [
      'Verify configuration management policy is current and reviewed within three years',
      'Confirm procedures are current and reviewed within one year',
      'Review policy for completeness addressing all FedRAMP CM requirements',
      'Interview personnel to confirm awareness of configuration management policies',
      'Verify dissemination records are complete and current',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-2',
    name: 'Baseline Configuration',
    description:
      'FedRAMP requires organizations to develop, document, and maintain a current baseline configuration of the information system under configuration control. FedRAMP Moderate baseline requires the baseline to be reviewed and updated at least annually, when required due to system changes, and as an integral part of information system component installations and upgrades. Baseline configurations must include network diagrams and hardware/software/firmware inventories.',
    category: 'Configuration Management',
    implementationGuidance:
      'Establish and document baseline configurations for all system components including operating systems, applications, network devices, and security appliances. Maintain the baseline under formal configuration control with version tracking. Review and update baseline configurations at least annually and whenever significant system changes occur. Include network topology diagrams, hardware inventory, software inventory with versions, firmware versions, and security configuration settings. Use automated configuration management tools to maintain and enforce baselines.',
    evidenceRequirements: [
      'Documented baseline configurations for all system component types',
      'Configuration management database or tool with baseline records',
      'Annual baseline review and update records',
      'Network topology diagrams reflecting current architecture',
      'Hardware, software, and firmware inventories with version information',
      'Baseline configuration change history with approval records',
    ],
    testProcedures: [
      'Review baseline configurations for completeness across all system components',
      'Verify baseline configurations are under formal configuration control',
      'Confirm baselines have been reviewed and updated within the past year',
      'Validate network diagrams reflect the current system architecture',
      'Compare actual system configurations against documented baselines for deviations',
      'Review baseline change history and approval records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-3',
    name: 'Configuration Change Control',
    description:
      'FedRAMP requires organizations to determine and document the types of changes to the information system that are configuration controlled. FedRAMP Moderate baseline requires a formal change control process including change request documentation, impact analysis, approval authority, implementation tracking, and testing/validation. FedRAMP requires changes to be documented in the Plan of Action and Milestones (POA&M) if they affect the security posture.',
    category: 'Configuration Management',
    implementationGuidance:
      'Implement a formal configuration change control process that includes change request submission, security impact analysis, approval by appropriate authority, testing in a non-production environment, implementation with rollback procedures, and post-implementation verification. Maintain a change log documenting all configuration changes. Ensure changes that affect the security authorization are reported to the FedRAMP PMO. Implement automated change detection tools to identify unauthorized changes. Update the POA&M for security-impacting changes.',
    evidenceRequirements: [
      'Configuration change control policy and process documentation',
      'Change request records with security impact analysis and approvals',
      'Change log documenting all configuration changes',
      'Testing and validation records for implemented changes',
      'Automated change detection tool configuration and alerts',
      'POA&M entries for security-impacting changes',
    ],
    testProcedures: [
      'Review change control process for compliance with FedRAMP requirements',
      'Examine sample change requests for completeness of documentation and approvals',
      'Verify security impact analysis is performed for all configuration changes',
      'Confirm changes are tested before implementation in production',
      'Test automated change detection mechanisms for unauthorized changes',
      'Verify POA&M is updated for security-impacting changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-4',
    name: 'Security Impact Analysis',
    description:
      'FedRAMP requires organizations to analyze changes to the information system to determine potential security impacts prior to change implementation. FedRAMP Moderate baseline requires security impact analysis for all changes that could affect the security posture of the system, and results must be factored into the continuous monitoring program and reported during annual assessments.',
    category: 'Configuration Management',
    implementationGuidance:
      'Integrate security impact analysis into the change management process. Require security impact analysis for all proposed changes before approval and implementation. Define criteria for determining when changes require formal security impact analysis versus expedited review. Ensure security impact analysis considers effects on confidentiality, integrity, and availability. Document analysis results and maintain records. Factor security impact analysis results into the FedRAMP continuous monitoring program and annual assessment reporting.',
    evidenceRequirements: [
      'Security impact analysis process documentation',
      'Security impact analysis records for recent system changes',
      'Criteria for determining analysis depth and requirements',
      'Integration documentation with change management and continuous monitoring',
      'Annual assessment reporting including security impact analysis results',
    ],
    testProcedures: [
      'Review security impact analysis process for completeness and integration with change management',
      'Examine sample security impact analyses for recent changes',
      'Verify analysis criteria are defined and consistently applied',
      'Confirm security impact analysis results feed into continuous monitoring',
      'Review annual assessment reports for security impact analysis coverage',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-6',
    name: 'Configuration Settings',
    description:
      'FedRAMP requires organizations to establish and document configuration settings for information technology products employed within the information system using security configuration checklists. FedRAMP Moderate baseline requires the use of USGCB, DISA STIGs, or CIS Benchmarks as the basis for configuration settings, with any deviations documented and approved.',
    category: 'Configuration Management',
    implementationGuidance:
      'Establish mandatory configuration settings based on USGCB, DISA STIGs, or CIS Benchmarks as appropriate for each technology component. Document configuration settings and implement them across all system components. Identify and document any deviations from the approved configuration baselines with risk-based justification. Implement automated configuration monitoring to detect deviations. Enforce configuration settings through group policies, configuration management tools, or equivalent mechanisms. Review and update configuration settings at least annually.',
    evidenceRequirements: [
      'Configuration settings documentation based on USGCB/STIGs/CIS Benchmarks',
      'Deviation documentation with risk-based justification and approval',
      'Automated configuration monitoring tool deployment and reports',
      'Configuration enforcement mechanism documentation (GPO, CM tools)',
      'Annual review records of configuration settings',
      'Compliance scan results showing adherence to configuration baselines',
    ],
    testProcedures: [
      'Verify configuration settings are based on approved security baselines (USGCB/STIGs/CIS)',
      'Review documented deviations for adequate justification and approval',
      'Test automated configuration monitoring for detection of unauthorized changes',
      'Run compliance scans to verify current system configurations match documented settings',
      'Confirm configuration enforcement mechanisms are active and effective',
      'Review annual configuration settings review records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-7',
    name: 'Least Functionality',
    description:
      'FedRAMP requires organizations to configure the information system to provide only essential capabilities and to prohibit or restrict the use of non-essential functions, ports, protocols, and services. FedRAMP Moderate baseline requires organizations to review functions, ports, protocols, and services at least annually and disable those deemed unnecessary. FedRAMP requires documentation of all enabled ports, protocols, and services with justification.',
    category: 'Configuration Management',
    implementationGuidance:
      'Configure all system components to provide only the minimum functionality required for their intended purpose. Disable or remove unnecessary services, ports, protocols, functions, and software. Maintain a documented list of all enabled ports, protocols, and services with justification for each. Implement application whitelisting where feasible. Review enabled functions, ports, protocols, and services at least annually and remove those no longer required. Disable unnecessary default accounts and rename default administrator accounts.',
    evidenceRequirements: [
      'Documented list of all enabled ports, protocols, and services with justification',
      'System hardening configuration documentation',
      'Application whitelisting configuration if implemented',
      'Annual review records of enabled functions, ports, protocols, and services',
      'Evidence of disabled unnecessary services and default accounts',
      'Port scan results confirming only justified ports are open',
    ],
    testProcedures: [
      'Review the documented list of enabled ports, protocols, and services for completeness',
      'Perform port scanning to identify open ports and compare against documented list',
      'Verify unnecessary services and functions are disabled on all system components',
      'Test application whitelisting controls if implemented',
      'Confirm annual review of enabled functionality has been conducted',
      'Verify default and unnecessary accounts are disabled or removed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-8',
    name: 'Information System Component Inventory',
    description:
      'FedRAMP requires organizations to develop and document an inventory of information system components that accurately reflects the current system, includes all components within the authorization boundary, is at the level of granularity deemed necessary for tracking and reporting, and includes information determined to be necessary for effective accountability. FedRAMP requires the inventory to be updated at least monthly as part of continuous monitoring.',
    category: 'Configuration Management',
    implementationGuidance:
      'Develop and maintain a comprehensive inventory of all system components within the FedRAMP authorization boundary. Include hardware, software, firmware, and virtual components. Use automated discovery and inventory tools to maintain accuracy. Update the inventory at least monthly as required by FedRAMP continuous monitoring. Include component identifiers, owners, types, versions, and locations. Reconcile the inventory with actual deployed components regularly. Integrate the inventory with the configuration management database.',
    evidenceRequirements: [
      'Complete system component inventory within the authorization boundary',
      'Automated discovery and inventory tool configuration',
      'Monthly inventory update records as required by FedRAMP',
      'Component details including identifiers, owners, types, versions, and locations',
      'Inventory reconciliation records comparing documented vs. discovered components',
      'Integration documentation with configuration management database',
    ],
    testProcedures: [
      'Review system component inventory for completeness within the authorization boundary',
      'Verify automated discovery tools are operational and reporting to the inventory',
      'Confirm inventory has been updated within the past month',
      'Compare inventory against actual deployed components for accuracy',
      'Verify inventory includes required details for each component',
      'Review inventory reconciliation records for recent reconciliation activities',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CONTINGENCY PLANNING (CP) - 6 Controls
  // ============================================================
  {
    controlId: 'FR-CP-1',
    name: 'Contingency Planning Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a contingency planning policy that addresses purpose, scope, roles, responsibilities, and compliance. The policy must be reviewed at least every three years and procedures annually. FedRAMP Moderate baseline requires the contingency planning policy to address recovery time objectives (RTO) and recovery point objectives (RPO) specific to the cloud service offering.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Develop a contingency planning policy that addresses all FedRAMP Moderate requirements including business impact analysis, recovery time objectives, recovery point objectives, and coordination with incident response and disaster recovery planning. Define roles and responsibilities for contingency planning activities. Address cloud-specific contingency considerations including multi-region recovery, data backup strategies, and service failover. Ensure the policy aligns with FedRAMP continuous monitoring requirements for ongoing contingency readiness.',
    evidenceRequirements: [
      'Contingency planning policy approved by authorizing official',
      'Contingency planning procedures with annual review date',
      'Policy dissemination records',
      'Policy review records showing three-year review cycle compliance',
      'RTO and RPO definitions for the cloud service offering',
    ],
    testProcedures: [
      'Verify contingency planning policy is current and reviewed within three years',
      'Confirm procedures are current and reviewed within one year',
      'Review policy for completeness addressing FedRAMP contingency requirements',
      'Verify RTO and RPO are defined and documented',
      'Interview personnel to confirm awareness of contingency planning policies',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-2',
    name: 'Contingency Plan',
    description:
      'FedRAMP requires organizations to develop a contingency plan for the information system that identifies essential missions and business functions, provides recovery objectives and priorities, addresses contingency roles and responsibilities, and is reviewed at least annually. FedRAMP Moderate baseline requires the plan to address reconstitution of the system within defined RTO/RPO and include procedures for cloud-specific recovery scenarios.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Develop a comprehensive contingency plan that addresses essential missions, business functions, recovery objectives, roles and responsibilities, and restoration priorities. Include cloud-specific recovery scenarios such as region failover, data center outage, provider service disruption, and data corruption. Document step-by-step recovery procedures for each scenario. Define communication plans for stakeholders during contingency events. Distribute the plan to key personnel and maintain copies in accessible locations. Review and update the plan at least annually and after significant changes or exercises.',
    evidenceRequirements: [
      'Comprehensive contingency plan document with all required sections',
      'Essential missions and business functions identification',
      'Recovery objectives (RTO/RPO) and restoration priorities',
      'Cloud-specific recovery scenario procedures',
      'Communication plan for contingency events',
      'Annual review and update records for the contingency plan',
      'Plan distribution records to key personnel',
    ],
    testProcedures: [
      'Review contingency plan for completeness of all required sections',
      'Verify recovery objectives and priorities are defined and achievable',
      'Confirm cloud-specific recovery scenarios are addressed',
      'Validate communication plan includes all necessary stakeholders',
      'Verify plan has been reviewed and updated within the past year',
      'Confirm key personnel have received copies of the plan',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-3',
    name: 'Contingency Training',
    description:
      'FedRAMP requires organizations to provide contingency training to information system users consistent with their assigned roles and responsibilities within 10 days of assuming a contingency role, when required by information system changes, and at least annually thereafter. FedRAMP Moderate baseline requires training to include simulated events and practical exercises.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Develop and deliver contingency training for all personnel with contingency roles and responsibilities. Provide initial training within 10 days of role assignment. Include practical exercises and simulated contingency events in the training program. Update training content when system changes affect contingency procedures. Conduct annual refresher training for all contingency personnel. Track training completion and maintain records. Coordinate training with contingency plan testing and exercises.',
    evidenceRequirements: [
      'Contingency training program documentation and curriculum',
      'Training completion records for all contingency personnel',
      'Evidence of training within 10 days of contingency role assignment',
      'Annual refresher training records',
      'Practical exercise and simulation documentation',
      'Training material update records reflecting system changes',
    ],
    testProcedures: [
      'Review contingency training program for completeness and coverage of roles',
      'Verify training records show completion within 10 days of role assignment',
      'Confirm annual refresher training has been conducted for all contingency personnel',
      'Review practical exercise and simulation documentation',
      'Verify training materials are current and reflect recent system changes',
      'Interview contingency personnel to assess training effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-4',
    name: 'Contingency Plan Testing',
    description:
      'FedRAMP requires organizations to test the contingency plan at least annually using functional exercises that simulate real-world contingency scenarios. FedRAMP Moderate baseline requires testing to validate the recovery capability and RTO/RPO objectives. Test results must be documented and used to update the contingency plan. FedRAMP requires coordination of testing with FedRAMP PMO for significant system disruption tests.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Conduct annual contingency plan testing using functional exercises or full-scale tests. Design test scenarios that validate recovery capabilities, RTO/RPO achievement, and communication procedures. Include cloud-specific scenarios such as region failover and data recovery. Document test objectives, procedures, results, and lessons learned. Update the contingency plan based on test findings. Coordinate with the FedRAMP PMO for tests that may affect service availability. Maintain a testing schedule and track remediation of identified gaps.',
    evidenceRequirements: [
      'Annual contingency plan test schedule and planning documentation',
      'Test scenario documentation including objectives and procedures',
      'Test execution results documenting outcomes and RTO/RPO validation',
      'Lessons learned and corrective action documentation',
      'Evidence of contingency plan updates based on test results',
      'FedRAMP PMO coordination records for significant tests',
    ],
    testProcedures: [
      'Verify annual contingency plan testing has been conducted within the past year',
      'Review test scenarios for realism and coverage of key recovery scenarios',
      'Confirm test results validate or identify gaps in RTO/RPO objectives',
      'Review lessons learned and verify corrective actions have been implemented',
      'Verify the contingency plan has been updated based on test findings',
      'Confirm coordination with FedRAMP PMO for significant tests',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-9',
    name: 'Information System Backup',
    description:
      'FedRAMP requires organizations to conduct backups of user-level, system-level, and system documentation information at defined frequencies. FedRAMP Moderate baseline requires daily incremental and weekly full backups at a minimum, with backup information stored at a separate facility or in a geographically separated cloud region. FedRAMP requires testing of backup information at least annually to verify media reliability and information integrity.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Implement automated backup procedures for user-level data, system-level data, and system documentation. Configure daily incremental backups and weekly full backups at minimum. Store backup data at a geographically separate facility or cloud region as required by FedRAMP. Encrypt backup data in transit and at rest using FIPS 140-2 validated cryptography. Test backup restoration at least annually to verify data integrity and recoverability. Implement backup monitoring and alerting for failure conditions. Document backup schedules, retention periods, and storage locations.',
    evidenceRequirements: [
      'Backup policy and procedures documenting schedules, types, and retention',
      'Automated backup configuration for user, system, and documentation data',
      'Evidence of daily incremental and weekly full backups',
      'Backup storage location documentation showing geographic separation',
      'Backup encryption configuration using FIPS 140-2 validated cryptography',
      'Annual backup restoration test results',
      'Backup monitoring and alerting configuration',
    ],
    testProcedures: [
      'Verify backup schedules meet FedRAMP requirements (daily incremental, weekly full)',
      'Confirm backup storage is at a geographically separate facility or region',
      'Test backup restoration to verify data integrity and recoverability',
      'Verify backup encryption meets FIPS 140-2 requirements',
      'Review backup monitoring and alerting for failure detection',
      'Confirm annual backup restoration testing has been conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-10',
    name: 'Information System Recovery and Reconstitution',
    description:
      'FedRAMP requires organizations to provide for the recovery and reconstitution of the information system to a known state after a disruption, compromise, or failure. FedRAMP Moderate baseline requires recovery procedures that restore the system within the defined RTO and to the defined RPO. Recovery must include verification that all security controls are operational after reconstitution.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Develop and document recovery and reconstitution procedures that restore the system to a known secure state. Ensure recovery procedures achieve the defined RTO and RPO. Include procedures for verifying system integrity and security control operation after recovery. Implement automated recovery mechanisms where feasible, such as infrastructure-as-code for rapid reconstitution. Document transaction recovery procedures for maintaining data integrity. Include procedures for post-recovery security verification including configuration baseline validation and vulnerability scanning.',
    evidenceRequirements: [
      'Recovery and reconstitution procedures documentation',
      'Recovery time and recovery point capability evidence',
      'Post-recovery security verification procedures',
      'Infrastructure-as-code or automated recovery tool documentation',
      'Transaction recovery procedure documentation',
      'Recovery exercise results demonstrating RTO/RPO achievement',
    ],
    testProcedures: [
      'Review recovery and reconstitution procedures for completeness',
      'Verify recovery procedures can achieve defined RTO and RPO',
      'Test post-recovery security verification procedures',
      'Confirm all security controls are validated as operational after recovery',
      'Review recovery exercise results for RTO/RPO achievement',
      'Verify automated recovery mechanisms function as designed',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // IDENTIFICATION AND AUTHENTICATION (IA) - 6 Controls
  // ============================================================
  {
    controlId: 'FR-IA-1',
    name: 'Identification and Authentication Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate an identification and authentication policy that addresses purpose, scope, roles, responsibilities, and compliance. The policy must be reviewed at least every three years and procedures annually. FedRAMP Moderate baseline requires the policy to address multi-factor authentication requirements for all privileged and non-privileged network access.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Develop an identification and authentication policy that addresses all FedRAMP Moderate baseline requirements. The policy must mandate multi-factor authentication (MFA) for all privileged and non-privileged network access as required by FedRAMP. Address password complexity, rotation, and account management requirements. Include provisions for authenticator management, feedback protection, and re-authentication requirements. Align with NIST SP 800-63 Digital Identity Guidelines as referenced by FedRAMP.',
    evidenceRequirements: [
      'Identification and authentication policy approved by authorizing official',
      'Identification and authentication procedures with annual review date',
      'Policy dissemination records',
      'MFA requirements documentation for privileged and non-privileged access',
      'Policy review records showing three-year and annual review cycle compliance',
    ],
    testProcedures: [
      'Verify identification and authentication policy is current and reviewed within three years',
      'Confirm procedures are current and reviewed within one year',
      'Review policy for MFA requirements for all network access',
      'Verify policy aligns with NIST SP 800-63 guidelines',
      'Interview personnel to confirm awareness of identification and authentication policies',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-2',
    name: 'Identification and Authentication (Organizational Users)',
    description:
      'FedRAMP requires the information system to uniquely identify and authenticate organizational users or processes acting on behalf of organizational users. FedRAMP Moderate baseline requires MFA for all privileged and non-privileged network access. FedRAMP requires multi-factor authentication to use separate factors (something you know, something you have, something you are) and not rely on multiple instances of the same factor.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement unique identification for all organizational users with individual accounts (no shared accounts for privileged access). Deploy multi-factor authentication (MFA) for all network access, both privileged and non-privileged, as required by FedRAMP Moderate baseline. MFA must use at least two different factors: something you know (password/PIN), something you have (token/smart card), or something you are (biometric). Implement MFA using FIPS 140-2 validated cryptographic modules. Integrate with centralized identity management (IdP) where feasible.',
    evidenceRequirements: [
      'MFA deployment documentation for all privileged and non-privileged network access',
      'FIPS 140-2 validation certificates for MFA cryptographic modules',
      'User account inventory showing unique identification for all users',
      'MFA configuration showing two distinct authentication factors',
      'Identity provider (IdP) integration documentation',
      'Evidence that shared privileged accounts are prohibited or compensated',
    ],
    testProcedures: [
      'Test MFA enforcement for privileged network access',
      'Test MFA enforcement for non-privileged network access',
      'Verify MFA uses two distinct factors (not two instances of the same factor)',
      'Confirm FIPS 140-2 validated cryptographic modules are used for MFA',
      'Verify all users have unique identification credentials',
      'Attempt to access the system with single-factor authentication and verify denial',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-4',
    name: 'Identifier Management',
    description:
      'FedRAMP requires organizations to manage information system identifiers by receiving authorization from designated officials, assigning unique identifiers, preventing reuse for a defined period, and disabling identifiers after a defined period of inactivity. FedRAMP Moderate baseline requires identifiers to be disabled after 90 days of inactivity and prohibits identifier reuse for at least two years.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement identifier management procedures that ensure all identifiers are authorized, unique, and managed throughout their lifecycle. Configure automatic disabling of identifiers after 90 days of inactivity as required by FedRAMP. Prevent identifier reuse for a minimum of two years. Maintain records of identifier assignments and authorizations. Implement automated monitoring for inactive identifiers. Coordinate identifier management with HR processes for onboarding and offboarding. Distinguish between individual, group, role, and service identifiers.',
    evidenceRequirements: [
      'Identifier management procedures documentation',
      'Configuration evidence for 90-day inactivity disabling',
      'Identifier reuse prevention configuration (minimum two-year prohibition)',
      'Identifier assignment authorization records',
      'Inactive identifier monitoring configuration and reports',
      'Integration documentation with HR onboarding/offboarding processes',
    ],
    testProcedures: [
      'Verify identifiers are disabled after 90 days of inactivity',
      'Test identifier reuse prevention by attempting to reuse a recently disabled identifier',
      'Review identifier assignment authorization records for completeness',
      'Confirm automated monitoring identifies inactive identifiers',
      'Verify HR integration for timely identifier management during personnel changes',
      'Review identifier inventory for uniqueness and proper categorization',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5',
    name: 'Authenticator Management',
    description:
      'FedRAMP requires organizations to manage information system authenticators by verifying identity before issuing, establishing initial content, ensuring adequate strength, distributing securely, storing securely, and changing or refreshing at defined periods. FedRAMP Moderate baseline requires password minimum length of 12 characters with complexity, 60-day maximum password age for privileged accounts, and prohibition of the last 24 passwords.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement authenticator management covering passwords, tokens, certificates, and biometrics. For passwords: enforce minimum 12-character length with complexity (uppercase, lowercase, numeric, special characters), 60-day maximum age for privileged accounts, and prevention of the last 24 passwords from being reused. Distribute initial authenticators securely and require change on first use. Protect authenticator content in storage and transit using encryption. Implement automated enforcement of authenticator policies. Manage certificate-based authenticators with a PKI. Implement authenticator revocation procedures.',
    evidenceRequirements: [
      'Authenticator management policy and procedures',
      'Password policy configuration showing 12-character minimum and complexity requirements',
      'Configuration evidence for 60-day maximum password age on privileged accounts',
      'Password history configuration preventing reuse of last 24 passwords',
      'Authenticator distribution and initial issuance procedures',
      'Authenticator storage protection configuration (encryption)',
      'Certificate management and PKI documentation if applicable',
    ],
    testProcedures: [
      'Verify password minimum length of 12 characters is enforced',
      'Test password complexity requirements enforcement',
      'Confirm 60-day maximum password age for privileged accounts',
      'Test password history enforcement (last 24 passwords prohibited)',
      'Verify initial authenticators require change on first use',
      'Confirm authenticator storage is protected with encryption',
      'Test authenticator revocation procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-6',
    name: 'Authenticator Feedback',
    description:
      'FedRAMP requires the information system to obscure feedback of authentication information during the authentication process to protect the information from possible exploitation and use by unauthorized individuals. FedRAMP Moderate baseline requires that password entry is masked and that authentication error messages do not reveal which part of the authentication failed.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Configure all system authentication interfaces to obscure password entry (display dots or asterisks). Ensure authentication error messages are generic and do not indicate whether the username or password was incorrect. Implement the same error message and response time for valid and invalid usernames to prevent user enumeration. Apply authenticator feedback protection to all access points including web applications, APIs, SSH, and administrative consoles.',
    evidenceRequirements: [
      'Authentication interface configuration showing password masking',
      'Generic error message configuration for authentication failures',
      'Screenshots of authentication interfaces demonstrating feedback obscuring',
      'User enumeration prevention configuration documentation',
      'Testing results showing consistent error responses for valid and invalid usernames',
    ],
    testProcedures: [
      'Verify password entry is obscured on all authentication interfaces',
      'Test authentication error messages for information leakage',
      'Confirm error messages do not distinguish between invalid username and invalid password',
      'Test for user enumeration through response timing differences',
      'Verify authenticator feedback protection on all access points',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-8',
    name: 'Identification and Authentication (Non-Organizational Users)',
    description:
      'FedRAMP requires the information system to uniquely identify and authenticate non-organizational users or processes acting on behalf of non-organizational users. FedRAMP Moderate baseline requires that non-organizational users are authenticated using methods commensurate with the risk, and that PIV-compliant credentials or FICAM-approved trust frameworks are accepted where applicable.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement identification and authentication mechanisms for all non-organizational users (external users, partners, customers). Accept PIV credentials and credentials from FICAM-approved trust frameworks where applicable. Ensure non-organizational user authentication strength is commensurate with the sensitivity of the information accessed. Implement unique identification for each non-organizational user. Maintain records of non-organizational user accounts and access authorizations. Apply appropriate session management and activity monitoring for non-organizational users.',
    evidenceRequirements: [
      'Non-organizational user identification and authentication policy',
      'Authentication mechanisms documentation for non-organizational users',
      'PIV/FICAM credential acceptance configuration if applicable',
      'Non-organizational user account inventory and access authorizations',
      'Session management configuration for non-organizational user sessions',
      'Activity monitoring configuration for non-organizational users',
    ],
    testProcedures: [
      'Verify non-organizational users are uniquely identified and authenticated',
      'Test authentication mechanisms for non-organizational users',
      'Confirm PIV/FICAM credential acceptance where applicable',
      'Review non-organizational user account inventory for completeness',
      'Verify session management controls for non-organizational user sessions',
      'Test activity monitoring for non-organizational user actions',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // INCIDENT RESPONSE (IR) - 7 Controls
  // ============================================================
  {
    controlId: 'FR-IR-1',
    name: 'Incident Response Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate an incident response policy that addresses purpose, scope, roles, responsibilities, and compliance. FedRAMP Moderate baseline requires the policy to be reviewed every three years and procedures annually. FedRAMP requires incident reporting to US-CERT within one hour of detection for significant incidents and coordination with the FedRAMP PMO for all security incidents.',
    category: 'Incident Response',
    implementationGuidance:
      'Develop an incident response policy that meets FedRAMP requirements including mandatory reporting to US-CERT within one hour of detection for significant security incidents. Include coordination requirements with the FedRAMP PMO. Address incident categorization, escalation procedures, and communication protocols for federal agency customers. Align with NIST SP 800-61 Computer Security Incident Handling Guide. Define roles and responsibilities including incident response team composition. Establish procedures for preserving evidence and conducting forensic analysis.',
    evidenceRequirements: [
      'Incident response policy approved by authorizing official',
      'Incident response procedures with annual review date',
      'US-CERT reporting procedures with one-hour timeline documentation',
      'FedRAMP PMO coordination procedures for security incidents',
      'Policy dissemination records',
      'Policy review records showing three-year and annual review compliance',
    ],
    testProcedures: [
      'Verify incident response policy is current and reviewed within three years',
      'Confirm procedures are current and reviewed within one year',
      'Review US-CERT reporting procedures for one-hour compliance',
      'Verify FedRAMP PMO coordination procedures are documented',
      'Interview incident response personnel to confirm awareness of policies',
      'Verify policy addresses all NIST SP 800-61 phases',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-2',
    name: 'Incident Response Training',
    description:
      'FedRAMP requires organizations to provide incident response training to information system users consistent with assigned roles and responsibilities within 10 days of assuming an incident response role, when required by information system changes, and at least annually thereafter. FedRAMP Moderate baseline requires training to include simulated incident exercises.',
    category: 'Incident Response',
    implementationGuidance:
      'Develop and deliver incident response training for all personnel with incident response roles. Provide initial training within 10 days of role assignment. Include tabletop exercises and simulated incident scenarios in the training program. Train on FedRAMP-specific incident reporting requirements including US-CERT notification within one hour. Update training when system changes affect incident response procedures. Conduct annual refresher training and track completion for all incident response personnel.',
    evidenceRequirements: [
      'Incident response training program and curriculum',
      'Training completion records for all incident response personnel',
      'Evidence of training within 10 days of role assignment',
      'Annual refresher training records',
      'Simulated incident exercise documentation and results',
      'Training content covering FedRAMP-specific reporting requirements',
    ],
    testProcedures: [
      'Review incident response training program for completeness',
      'Verify training records show initial training within 10 days of role assignment',
      'Confirm annual refresher training has been conducted',
      'Review simulated incident exercise documentation',
      'Verify training covers FedRAMP-specific US-CERT reporting requirements',
      'Interview incident response personnel to assess training effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-4',
    name: 'Incident Handling',
    description:
      'FedRAMP requires organizations to implement an incident handling capability for security incidents that includes preparation, detection, analysis, containment, eradication, and recovery. FedRAMP Moderate baseline requires automated mechanisms to support the incident handling process and correlation of incident information from multiple sources. FedRAMP requires coordination with federal agency customers throughout the incident handling process.',
    category: 'Incident Response',
    implementationGuidance:
      'Implement a comprehensive incident handling capability covering all NIST SP 800-61 phases: preparation, detection and analysis, containment, eradication, and recovery. Deploy automated incident handling tools (SIEM, SOAR) to support detection, correlation, and response. Implement incident correlation from multiple sources including IDS/IPS, audit logs, vulnerability scans, and endpoint detection. Establish communication procedures to notify federal agency customers of incidents affecting their data. Document incident handling procedures for common incident types. Implement lessons learned processes.',
    evidenceRequirements: [
      'Incident handling procedures covering all phases (preparation through recovery)',
      'Automated incident handling tool (SIEM/SOAR) deployment documentation',
      'Incident correlation configuration from multiple sources',
      'Federal agency customer notification procedures',
      'Incident handling records demonstrating process execution',
      'Lessons learned documentation from previous incidents',
    ],
    testProcedures: [
      'Review incident handling procedures for coverage of all NIST SP 800-61 phases',
      'Verify automated incident handling tools are operational',
      'Test incident correlation from multiple detection sources',
      'Review federal agency customer notification procedures',
      'Examine incident handling records for recent incidents',
      'Verify lessons learned processes are implemented and followed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-5',
    name: 'Incident Monitoring',
    description:
      'FedRAMP requires organizations to track and document information system security incidents. FedRAMP Moderate baseline requires automated mechanisms to assist in the tracking of security incidents and the collection and analysis of incident information. FedRAMP requires maintaining incident metrics as part of the continuous monitoring program and reporting incident trends in monthly continuous monitoring reports.',
    category: 'Incident Response',
    implementationGuidance:
      'Implement an incident tracking system to document and monitor all security incidents from detection through resolution. Configure automated collection and analysis of incident data. Track incident metrics including time to detect, time to respond, time to resolve, and incident categories. Report incident trends and metrics in monthly FedRAMP continuous monitoring reports. Maintain a centralized incident database with searchable records. Implement dashboards for real-time incident monitoring and trend analysis.',
    evidenceRequirements: [
      'Incident tracking system deployment and configuration documentation',
      'Incident records with complete lifecycle documentation',
      'Incident metrics and trend reports',
      'Monthly continuous monitoring reports including incident data',
      'Incident dashboard configuration and access documentation',
      'Automated incident data collection and analysis configuration',
    ],
    testProcedures: [
      'Verify incident tracking system is operational and tracking all security incidents',
      'Review incident records for completeness of lifecycle documentation',
      'Examine incident metrics and trend analysis reports',
      'Verify incident data is included in monthly continuous monitoring reports',
      'Test incident tracking system search and reporting capabilities',
      'Confirm automated incident data collection is functioning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-6',
    name: 'Incident Reporting',
    description:
      'FedRAMP requires organizations to report security incidents to US-CERT within one hour of incident detection for significant incidents, and to notify the FedRAMP PMO and affected federal agency customers. FedRAMP Moderate baseline requires automated mechanisms to assist in the reporting of security incidents. All incidents must be reported using the US-CERT incident reporting guidelines and categories.',
    category: 'Incident Response',
    implementationGuidance:
      'Implement incident reporting procedures that comply with FedRAMP requirements for US-CERT notification within one hour of detection for significant incidents. Configure automated incident reporting mechanisms where feasible. Establish reporting workflows that include US-CERT, FedRAMP PMO, and affected federal agency customers. Use US-CERT incident categories for classification. Maintain templates and contact information for rapid reporting. Train incident response personnel on reporting requirements and timelines. Test reporting procedures regularly.',
    evidenceRequirements: [
      'Incident reporting procedures with US-CERT one-hour notification timeline',
      'US-CERT, FedRAMP PMO, and agency customer contact information',
      'Incident reporting templates aligned with US-CERT categories',
      'Automated reporting mechanism configuration if implemented',
      'Historical incident reporting records demonstrating compliance with timelines',
      'Incident reporting test/exercise results',
    ],
    testProcedures: [
      'Review incident reporting procedures for US-CERT one-hour notification compliance',
      'Verify contact information is current for US-CERT, FedRAMP PMO, and agency customers',
      'Test incident reporting templates for completeness',
      'Verify automated reporting mechanisms if implemented',
      'Review historical incident reports for timeline compliance',
      'Conduct a reporting exercise to validate the one-hour notification capability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-7',
    name: 'Incident Response Assistance',
    description:
      'FedRAMP requires organizations to provide an incident response support resource, integral to the organizational incident response capability, that offers advice and assistance to users for the handling and reporting of security incidents. FedRAMP Moderate baseline requires the support resource to be available 24/7 and to have automated mechanisms to increase the availability of incident response-related information and support.',
    category: 'Incident Response',
    implementationGuidance:
      'Establish a 24/7 incident response support capability for users to report and receive assistance with security incidents. Implement automated self-service resources such as incident reporting portals, knowledge bases, and chatbots for common incident types. Provide multiple communication channels for incident reporting (phone, email, web portal). Ensure incident response support personnel have access to current threat intelligence and response procedures. Integrate the support resource with the incident tracking system for seamless escalation.',
    evidenceRequirements: [
      'Incident response support resource documentation and contact information',
      '24/7 availability documentation (staffing schedules, on-call rosters)',
      'Automated incident response support tools (portals, knowledge bases)',
      'Communication channels for incident reporting (phone, email, portal)',
      'Integration documentation with incident tracking system',
      'User awareness materials for accessing incident response support',
    ],
    testProcedures: [
      'Verify incident response support resource is available 24/7',
      'Test incident reporting channels (phone, email, web portal)',
      'Review automated support tools for availability and accuracy',
      'Confirm integration with incident tracking system',
      'Verify users are aware of how to access incident response support',
      'Test escalation procedures from support resource to incident response team',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-8',
    name: 'Incident Response Plan',
    description:
      'FedRAMP requires organizations to develop an incident response plan that provides the organization with a roadmap for implementing its incident response capability. FedRAMP Moderate baseline requires the plan to be reviewed and updated at least annually, and after any significant incident or system change. The plan must address FedRAMP-specific reporting requirements and coordination with the FedRAMP JAB and PMO.',
    category: 'Incident Response',
    implementationGuidance:
      'Develop a comprehensive incident response plan that defines the structure and organization of the incident response capability. Include incident severity definitions, escalation procedures, communication plans, and role assignments. Address FedRAMP-specific requirements including US-CERT reporting, FedRAMP JAB and PMO coordination, and federal agency customer notification. Define incident types and corresponding response procedures. Distribute the plan to incident response personnel and key stakeholders. Review and update the plan at least annually and after significant incidents or system changes.',
    evidenceRequirements: [
      'Comprehensive incident response plan document',
      'Incident severity definitions and escalation procedures',
      'Communication plan including FedRAMP JAB, PMO, and agency contacts',
      'Plan distribution records to incident response personnel',
      'Annual plan review and update records',
      'Post-incident plan update records',
    ],
    testProcedures: [
      'Review incident response plan for completeness and FedRAMP-specific requirements',
      'Verify incident severity definitions and escalation procedures are clear and actionable',
      'Confirm communication plan includes all required FedRAMP stakeholders',
      'Verify plan has been distributed to all incident response personnel',
      'Confirm plan has been reviewed and updated within the past year',
      'Review post-incident plan updates for incorporation of lessons learned',
    ],
    status: 'Not Started',
  },
];
