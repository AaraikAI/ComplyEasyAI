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

  // ============================================================
  // AWARENESS AND TRAINING (AT) - 6 Controls
  // ============================================================
  {
    controlId: 'FR-AT-1',
    name: 'Security Awareness and Training Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a security awareness and training policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance. The policy must be reviewed and updated at least every three years, and procedures at least annually.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Develop a formal security awareness and training policy document that addresses all FedRAMP Moderate baseline requirements. Define roles and responsibilities for security training management. Establish training frequency requirements and content standards. Ensure the policy is approved by an authorizing official and disseminated to all personnel.',
    evidenceRequirements: [
      'Documented security awareness and training policy approved by authorizing official',
      'Security training procedures document with annual review date',
      'Policy dissemination records showing distribution to all personnel',
      'Evidence of policy review within the last three years',
      'Role-based training requirements documentation',
    ],
    testProcedures: [
      'Verify security awareness and training policy exists and is current',
      'Confirm policy has been approved by authorizing official',
      'Review policy dissemination records',
      'Verify procedures are reviewed annually',
      'Confirm training requirements align with FedRAMP Moderate baseline',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-2',
    name: 'Security Awareness Training',
    description:
      'FedRAMP requires organizations to provide basic security awareness training to all information system users as part of initial training for new users, when required by system changes, and annually thereafter. Training must cover FedRAMP-specific requirements including incident reporting and data handling.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Implement a security awareness training program that covers all required topics for FedRAMP Moderate systems. Include training on recognizing and reporting security incidents, social engineering threats, password security, and data handling requirements. Deliver training to new users before granting system access and provide annual refresher training.',
    evidenceRequirements: [
      'Security awareness training materials and curriculum',
      'Training completion records for all system users',
      'New user training completion before system access',
      'Annual training completion tracking documentation',
      'Training content review and update records',
    ],
    testProcedures: [
      'Review security awareness training materials for completeness',
      'Verify all users have completed required training',
      'Confirm new users receive training before system access',
      'Review annual training completion rates',
      'Verify training content is updated for current threats',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-3',
    name: 'Role-Based Security Training',
    description:
      'FedRAMP requires organizations to provide role-based security training to personnel with assigned security roles and responsibilities before authorizing access to the system and annually thereafter. Training must be specific to the security functions performed.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Develop role-based training curricula for personnel with security responsibilities including system administrators, security officers, incident responders, and developers. Ensure training covers the specific security functions and tools used in each role. Provide initial training before granting privileged access and annual refresher training.',
    evidenceRequirements: [
      'Role-based training curricula for each security role',
      'Training completion records for personnel with security roles',
      'Initial training completion before privileged access granted',
      'Annual role-based training completion tracking',
      'Training effectiveness assessments',
    ],
    testProcedures: [
      'Review role-based training curricula for completeness',
      'Verify personnel with security roles have completed required training',
      'Confirm training is completed before privileged access',
      'Review annual training completion for security personnel',
      'Assess training effectiveness through testing or interviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-4',
    name: 'Security Training Records',
    description:
      'FedRAMP requires organizations to document and monitor individual information system security training activities including basic security awareness training and specific role-based security training. Records must be retained for the duration of employment plus three years.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Implement a training records management system to track all security training activities. Document training completion dates, training content covered, and assessment results. Maintain records for the required retention period. Generate reports for FedRAMP continuous monitoring and authorization activities.',
    evidenceRequirements: [
      'Training records management system documentation',
      'Individual training records for all personnel',
      'Training completion reports',
      'Records retention policy and implementation evidence',
      'Training metrics for continuous monitoring reports',
    ],
    testProcedures: [
      'Verify training records management system is operational',
      'Review sample of individual training records for completeness',
      'Confirm records retention meets FedRAMP requirements',
      'Verify training metrics are included in continuous monitoring',
      'Test training records retrieval capabilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-5',
    name: 'Security Training for Contractors',
    description:
      'FedRAMP requires organizations to ensure that contractors and third-party personnel with access to the information system receive appropriate security awareness and role-based training before access is granted and annually thereafter.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Extend security training requirements to all contractors and third-party personnel with system access. Include training requirements in contracts and service agreements. Track contractor training completion separately and ensure compliance before granting access. Coordinate with contractor organizations for annual training completion.',
    evidenceRequirements: [
      'Contractor training requirements in contracts and agreements',
      'Contractor training completion records',
      'Access provisioning records showing training completion verification',
      'Annual contractor training tracking documentation',
      'Contractor organization coordination records',
    ],
    testProcedures: [
      'Review contracts for security training requirements',
      'Verify contractor training completion before access granted',
      'Review annual contractor training completion rates',
      'Confirm training content is appropriate for contractor roles',
      'Verify contractor training records are maintained',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-6',
    name: 'Security Training Feedback',
    description:
      'FedRAMP requires organizations to provide security awareness training feedback mechanisms to enable personnel to report potential security concerns, suggest training improvements, and identify emerging threats that should be addressed in training content.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Establish mechanisms for personnel to provide feedback on security training effectiveness and report security concerns. Use feedback to improve training content and address emerging threats. Track feedback submissions and responses. Incorporate lessons learned into training updates.',
    evidenceRequirements: [
      'Security training feedback mechanism documentation',
      'Feedback submission and response records',
      'Training improvement records based on feedback',
      'Emerging threat incorporation into training materials',
      'Feedback analysis reports',
    ],
    testProcedures: [
      'Verify feedback mechanism exists and is accessible',
      'Review feedback submission and response records',
      'Confirm training improvements based on feedback',
      'Verify emerging threats are incorporated into training',
      'Assess feedback mechanism effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // SECURITY ASSESSMENT AND AUTHORIZATION (CA) - 12 Controls
  // ============================================================
  {
    controlId: 'FR-CA-1',
    name: 'Security Assessment and Authorization Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a security assessment and authorization policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance. The policy must align with FedRAMP authorization requirements.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Develop a formal security assessment and authorization policy that addresses FedRAMP authorization requirements including initial authorization, continuous monitoring, and reauthorization. Define roles for authorizing officials, security assessors, and system owners. Establish procedures for conducting security assessments and maintaining authorization.',
    evidenceRequirements: [
      'Documented security assessment and authorization policy',
      'Security assessment procedures document',
      'Role definitions for authorization activities',
      'Policy review and approval records',
      'FedRAMP authorization process documentation',
    ],
    testProcedures: [
      'Verify security assessment and authorization policy exists',
      'Confirm policy addresses FedRAMP authorization requirements',
      'Review role definitions and assignments',
      'Verify policy has been approved and disseminated',
      'Confirm procedures align with FedRAMP requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-2',
    name: 'Security Assessments',
    description:
      'FedRAMP requires organizations to develop a security assessment plan, assess security controls annually using a FedRAMP-approved Third Party Assessment Organization (3PAO), produce a security assessment report, and provide results to the FedRAMP PMO and authorizing officials.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Develop a security assessment plan that describes the scope, methodology, and schedule for assessing FedRAMP controls. Engage a FedRAMP-approved 3PAO to conduct annual assessments. Document assessment results in a Security Assessment Report (SAR). Submit results to FedRAMP PMO and coordinate with authorizing officials.',
    evidenceRequirements: [
      'Security Assessment Plan (SAP)',
      '3PAO engagement documentation and accreditation',
      'Security Assessment Report (SAR)',
      'Plan of Action and Milestones (POA&M) for findings',
      'FedRAMP PMO submission records',
    ],
    testProcedures: [
      'Review Security Assessment Plan for completeness',
      'Verify 3PAO is FedRAMP approved',
      'Review Security Assessment Report',
      'Verify POA&M addresses all findings',
      'Confirm assessment results submitted to FedRAMP PMO',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-3',
    name: 'System Interconnections',
    description:
      'FedRAMP requires organizations to authorize connections from the information system to other information systems through Interconnection Security Agreements (ISAs). All interconnections must be documented and approved by authorizing officials from both organizations.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Identify all system interconnections with external systems. Develop Interconnection Security Agreements (ISAs) or Memoranda of Understanding (MOUs) for each connection. Document interface characteristics, security requirements, and data sensitivity. Obtain approval from authorizing officials. Review interconnection agreements annually.',
    evidenceRequirements: [
      'System interconnection inventory',
      'Interconnection Security Agreements (ISAs)',
      'Memoranda of Understanding (MOUs) where applicable',
      'Authorizing official approvals for interconnections',
      'Annual review records for interconnection agreements',
    ],
    testProcedures: [
      'Verify all system interconnections are documented',
      'Review ISAs for completeness and accuracy',
      'Confirm authorizing official approval for each interconnection',
      'Verify annual review of interconnection agreements',
      'Test that interconnection security controls are implemented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-5',
    name: 'Plan of Action and Milestones',
    description:
      'FedRAMP requires organizations to develop a Plan of Action and Milestones (POA&M) for the information system to document planned remedial actions to correct weaknesses or deficiencies. The POA&M must be updated monthly and submitted to the FedRAMP PMO.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Develop and maintain a POA&M that documents all security weaknesses and deficiencies identified through assessments, audits, and continuous monitoring. Include remediation plans with milestones, responsible parties, and estimated completion dates. Update the POA&M monthly and report status to FedRAMP PMO.',
    evidenceRequirements: [
      'Current Plan of Action and Milestones (POA&M)',
      'Monthly POA&M updates',
      'POA&M submission records to FedRAMP PMO',
      'Remediation completion evidence',
      'POA&M tracking and reporting procedures',
    ],
    testProcedures: [
      'Review POA&M for completeness and accuracy',
      'Verify monthly updates are performed',
      'Confirm POA&M is submitted to FedRAMP PMO',
      'Review remediation progress against milestones',
      'Verify closed items have appropriate evidence',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-6',
    name: 'Security Authorization',
    description:
      'FedRAMP requires a senior official or executive to authorize the information system for processing before operations and to update the authorization at least every three years or when significant changes occur. Authorization must follow the FedRAMP authorization process.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Obtain authorization to operate (ATO) from a FedRAMP-recognized authorizing official before processing federal information. Maintain authorization through continuous monitoring and annual assessments. Pursue reauthorization every three years or when significant changes occur. Document authorization decisions and maintain authorization packages.',
    evidenceRequirements: [
      'Authorization to Operate (ATO) letter',
      'Authorization package documentation',
      'Continuous monitoring reports',
      'Reauthorization documentation if applicable',
      'Significant change analysis records',
    ],
    testProcedures: [
      'Verify current ATO is valid',
      'Review authorization package completeness',
      'Confirm continuous monitoring is ongoing',
      'Verify authorization is within three-year limit',
      'Review significant change processes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-7',
    name: 'Continuous Monitoring',
    description:
      'FedRAMP requires organizations to develop a continuous monitoring strategy and implement a continuous monitoring program that includes assessment of all security controls, ongoing security status monitoring, and monthly reporting to the FedRAMP PMO.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Develop a continuous monitoring strategy aligned with FedRAMP requirements. Implement automated tools for vulnerability scanning, configuration monitoring, and security event analysis. Conduct monthly vulnerability scans and annual penetration tests. Submit monthly continuous monitoring reports to FedRAMP PMO.',
    evidenceRequirements: [
      'Continuous Monitoring Strategy document',
      'Monthly vulnerability scan reports',
      'Annual penetration test results',
      'Monthly continuous monitoring reports to FedRAMP PMO',
      'Automated monitoring tool configurations',
    ],
    testProcedures: [
      'Review continuous monitoring strategy',
      'Verify monthly vulnerability scans are performed',
      'Review annual penetration test results',
      'Confirm monthly reports submitted to FedRAMP PMO',
      'Verify automated monitoring tools are operational',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-8',
    name: 'Penetration Testing',
    description:
      'FedRAMP requires organizations to conduct penetration testing annually on the information system using a FedRAMP-approved methodology. Testing must be performed by qualified independent assessors and results must be included in the Security Assessment Report.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Engage qualified independent assessors to conduct annual penetration testing using FedRAMP-approved methodology. Include network, application, and social engineering tests as appropriate. Document findings and remediation actions. Include penetration test results in the annual Security Assessment Report.',
    evidenceRequirements: [
      'Penetration test plan and scope',
      'Assessor qualifications and independence documentation',
      'Penetration test report with findings',
      'Remediation actions for identified vulnerabilities',
      'Inclusion in Security Assessment Report',
    ],
    testProcedures: [
      'Verify annual penetration testing is conducted',
      'Review assessor qualifications and independence',
      'Examine penetration test report for completeness',
      'Verify remediation of identified vulnerabilities',
      'Confirm results included in SAR',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-9',
    name: 'Internal System Connections',
    description:
      'FedRAMP requires organizations to authorize internal connections of information system components and document the interface characteristics, security requirements, and nature of information communicated for each internal connection.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Identify and document all internal system connections between components. Define interface characteristics, protocols, and data flows. Implement security controls for internal connections based on data sensitivity. Authorize internal connections through configuration management processes.',
    evidenceRequirements: [
      'Internal system connection inventory',
      'Interface documentation for internal connections',
      'Security requirements for internal connections',
      'Authorization records for internal connections',
      'Network diagrams showing internal connections',
    ],
    testProcedures: [
      'Verify internal connections are documented',
      'Review interface documentation for accuracy',
      'Confirm security controls are implemented',
      'Verify authorization process for internal connections',
      'Test network segmentation and controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-10',
    name: 'Security Authorization Documentation',
    description:
      'FedRAMP requires organizations to maintain complete authorization documentation including System Security Plan (SSP), Security Assessment Report (SAR), and Plan of Action and Milestones (POA&M). Documentation must be updated continuously.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Maintain complete and current FedRAMP authorization documentation including the System Security Plan, Security Assessment Report, and POA&M. Update documentation when changes occur and at least annually. Store documentation securely and make available to FedRAMP PMO and authorizing officials as required.',
    evidenceRequirements: [
      'Current System Security Plan (SSP)',
      'Current Security Assessment Report (SAR)',
      'Current Plan of Action and Milestones (POA&M)',
      'Documentation update records',
      'Documentation access and distribution records',
    ],
    testProcedures: [
      'Verify SSP is current and complete',
      'Review SAR for currency and completeness',
      'Confirm POA&M is maintained and updated',
      'Verify documentation update processes',
      'Confirm documentation is available as required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-11',
    name: 'Assessor Independence',
    description:
      'FedRAMP requires that security assessments be conducted by independent assessors who are organizationally independent from the system owner and have no conflicts of interest. Annual assessments must be conducted by FedRAMP-approved 3PAOs.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Ensure security assessors are independent from system development and operations. Engage FedRAMP-approved 3PAOs for annual assessments. Document assessor qualifications and independence. Maintain separation of duties between assessment and remediation activities.',
    evidenceRequirements: [
      'Assessor independence documentation',
      '3PAO FedRAMP approval verification',
      'Conflict of interest attestations',
      'Assessor qualifications documentation',
      'Separation of duties documentation',
    ],
    testProcedures: [
      'Verify assessor independence from system operations',
      'Confirm 3PAO FedRAMP approval status',
      'Review conflict of interest documentation',
      'Verify assessor qualifications',
      'Confirm separation of duties is maintained',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-12',
    name: 'Significant Change Process',
    description:
      'FedRAMP requires organizations to establish and implement a significant change process to identify, document, and assess changes that may affect the security authorization of the information system.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Define criteria for significant changes that require security impact analysis. Implement a process to identify and document significant changes. Conduct security impact assessments for significant changes. Notify FedRAMP PMO of significant changes and pursue reauthorization if required.',
    evidenceRequirements: [
      'Significant change criteria and definitions',
      'Significant change identification process',
      'Security impact assessments for changes',
      'FedRAMP PMO notification records',
      'Reauthorization records if applicable',
    ],
    testProcedures: [
      'Review significant change criteria',
      'Verify change identification process',
      'Examine security impact assessments',
      'Confirm FedRAMP PMO notifications',
      'Review reauthorization activities if applicable',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-13',
    name: 'Leveraged Authorizations',
    description:
      'FedRAMP requires organizations to leverage existing FedRAMP authorizations for underlying cloud services and infrastructure. Customer responsibility matrices must be maintained for shared controls.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Identify underlying cloud services with existing FedRAMP authorizations. Leverage existing authorizations to reduce assessment scope. Maintain customer responsibility matrices for shared controls. Monitor underlying service authorization status and respond to changes.',
    evidenceRequirements: [
      'Inventory of leveraged FedRAMP authorizations',
      'Customer responsibility matrices',
      'Shared control documentation',
      'Underlying service authorization monitoring',
      'Response procedures for authorization changes',
    ],
    testProcedures: [
      'Verify leveraged authorizations are documented',
      'Review customer responsibility matrices',
      'Confirm shared controls are addressed',
      'Verify monitoring of underlying authorizations',
      'Test response to authorization changes',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // MAINTENANCE (MA) - 8 Controls
  // ============================================================
  {
    controlId: 'FR-MA-1',
    name: 'System Maintenance Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a system maintenance policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance with FedRAMP requirements.',
    category: 'Maintenance',
    implementationGuidance:
      'Develop a formal system maintenance policy that defines maintenance activities, scheduling, and approval processes. Include requirements for maintenance personnel qualifications, tools, and documentation. Ensure policy addresses both local and remote maintenance scenarios.',
    evidenceRequirements: [
      'System maintenance policy document',
      'Maintenance procedures documentation',
      'Policy approval and review records',
      'Maintenance role definitions',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify maintenance policy exists and is current',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test maintenance process implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-2',
    name: 'Controlled Maintenance',
    description:
      'FedRAMP requires organizations to schedule, perform, document, and review records of maintenance and repairs on information system components in accordance with manufacturer specifications and organizational requirements.',
    category: 'Maintenance',
    implementationGuidance:
      'Establish maintenance schedules based on manufacturer recommendations and organizational requirements. Document all maintenance activities including date, personnel, actions taken, and results. Review maintenance records to ensure compliance and identify trends. Obtain approval before performing maintenance.',
    evidenceRequirements: [
      'Maintenance schedule documentation',
      'Maintenance activity logs and records',
      'Maintenance approval records',
      'Manufacturer maintenance specifications',
      'Maintenance review reports',
    ],
    testProcedures: [
      'Review maintenance schedules for adequacy',
      'Examine maintenance activity logs',
      'Verify approval process for maintenance',
      'Confirm alignment with manufacturer specifications',
      'Review maintenance effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-3',
    name: 'Maintenance Tools',
    description:
      'FedRAMP requires organizations to approve, control, and monitor information system maintenance tools. Maintenance tools brought into the facility must be inspected for improper modifications.',
    category: 'Maintenance',
    implementationGuidance:
      'Maintain an inventory of approved maintenance tools. Implement controls for tool approval and modification prevention. Inspect maintenance tools before use on production systems. Store tools securely when not in use. Monitor tool usage and access.',
    evidenceRequirements: [
      'Approved maintenance tools inventory',
      'Tool approval and control procedures',
      'Tool inspection records',
      'Tool storage and access controls',
      'Tool usage monitoring logs',
    ],
    testProcedures: [
      'Review approved maintenance tools list',
      'Verify tool approval process',
      'Examine tool inspection records',
      'Test tool storage security',
      'Review tool usage monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-4',
    name: 'Nonlocal Maintenance',
    description:
      'FedRAMP requires organizations to approve and monitor nonlocal maintenance and diagnostic activities. All nonlocal maintenance sessions must use strong authentication and be terminated when complete.',
    category: 'Maintenance',
    implementationGuidance:
      'Implement secure remote maintenance capabilities with multi-factor authentication. Approve and document all nonlocal maintenance sessions. Monitor and log all remote maintenance activities. Terminate sessions immediately upon completion. Implement session recording for audit purposes.',
    evidenceRequirements: [
      'Nonlocal maintenance authorization procedures',
      'Remote maintenance session logs',
      'Multi-factor authentication implementation',
      'Session monitoring and recording evidence',
      'Session termination procedures',
    ],
    testProcedures: [
      'Verify remote maintenance authorization process',
      'Review session authentication mechanisms',
      'Examine maintenance session logs',
      'Test session termination procedures',
      'Verify session monitoring capabilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-5',
    name: 'Maintenance Personnel',
    description:
      'FedRAMP requires organizations to establish a process for maintenance personnel authorization and maintain a list of authorized maintenance organizations or personnel. Escorts must be provided for unauthorized maintenance personnel.',
    category: 'Maintenance',
    implementationGuidance:
      'Maintain a list of authorized maintenance personnel and organizations. Verify personnel authorization before allowing maintenance access. Provide escorts for unauthorized personnel. Conduct background checks for maintenance personnel with unescorted access.',
    evidenceRequirements: [
      'Authorized maintenance personnel list',
      'Personnel authorization verification records',
      'Escort procedures and logs',
      'Background check records for maintenance personnel',
      'Maintenance organization agreements',
    ],
    testProcedures: [
      'Review authorized personnel list for currency',
      'Verify authorization verification process',
      'Examine escort procedures and compliance',
      'Confirm background checks are conducted',
      'Review maintenance organization agreements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-6',
    name: 'Timely Maintenance',
    description:
      'FedRAMP requires organizations to obtain maintenance support and spare parts within defined time periods to ensure system availability. Maintenance contracts must include response time requirements.',
    category: 'Maintenance',
    implementationGuidance:
      'Define maintenance response time requirements based on system criticality. Establish maintenance contracts with appropriate response times. Maintain spare parts inventory for critical components. Monitor maintenance response times and escalate when not met.',
    evidenceRequirements: [
      'Maintenance response time requirements',
      'Maintenance contracts with SLAs',
      'Spare parts inventory',
      'Response time monitoring records',
      'Escalation procedures documentation',
    ],
    testProcedures: [
      'Review maintenance response time requirements',
      'Verify contract SLAs meet requirements',
      'Examine spare parts inventory',
      'Review response time performance',
      'Test escalation procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-7',
    name: 'Field Maintenance',
    description:
      'FedRAMP requires organizations to implement field maintenance procedures for systems located at customer sites or remote locations. Field maintenance must maintain the same security controls as facility-based maintenance.',
    category: 'Maintenance',
    implementationGuidance:
      'Develop field maintenance procedures that maintain security controls. Ensure field maintenance personnel are authorized and trained. Implement secure communications for field maintenance activities. Document all field maintenance activities.',
    evidenceRequirements: [
      'Field maintenance procedures',
      'Field maintenance personnel authorization',
      'Secure communication mechanisms',
      'Field maintenance activity logs',
      'Security control verification for field maintenance',
    ],
    testProcedures: [
      'Review field maintenance procedures',
      'Verify personnel authorization for field maintenance',
      'Test secure communication mechanisms',
      'Examine field maintenance logs',
      'Verify security controls during field maintenance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-8',
    name: 'Maintenance Monitoring and Information Sharing',
    description:
      'FedRAMP requires organizations to monitor maintenance activities and share maintenance-related security information with appropriate personnel to improve maintenance processes and system security.',
    category: 'Maintenance',
    implementationGuidance:
      'Implement monitoring for all maintenance activities. Analyze maintenance data for security trends and issues. Share maintenance-related security information with security personnel. Use maintenance data to improve processes and prevent security incidents.',
    evidenceRequirements: [
      'Maintenance monitoring implementation',
      'Maintenance data analysis reports',
      'Information sharing procedures',
      'Maintenance improvement records',
      'Security trend analysis from maintenance data',
    ],
    testProcedures: [
      'Verify maintenance monitoring is operational',
      'Review maintenance data analysis',
      'Confirm information sharing processes',
      'Examine maintenance improvements implemented',
      'Review security trend analysis',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // MEDIA PROTECTION (MP) - 10 Controls
  // ============================================================
  {
    controlId: 'FR-MP-1',
    name: 'Media Protection Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a media protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'Media Protection',
    implementationGuidance:
      'Develop a media protection policy that addresses all types of media including digital and non-digital. Define media handling, storage, transport, and sanitization requirements. Ensure policy addresses FedRAMP-specific requirements for federal data protection.',
    evidenceRequirements: [
      'Media protection policy document',
      'Media handling procedures',
      'Policy approval and review records',
      'Role definitions for media protection',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify media protection policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test media protection implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-2',
    name: 'Media Access',
    description:
      'FedRAMP requires organizations to restrict access to information system media to authorized individuals. Access restrictions must be enforced through physical and logical controls.',
    category: 'Media Protection',
    implementationGuidance:
      'Implement physical access controls for media storage areas. Use logical access controls for digital media. Maintain access authorization lists for media. Audit media access and investigate unauthorized access attempts.',
    evidenceRequirements: [
      'Media access control procedures',
      'Physical access controls for media storage',
      'Logical access controls for digital media',
      'Media access authorization lists',
      'Media access audit logs',
    ],
    testProcedures: [
      'Verify physical access controls for media',
      'Test logical access controls',
      'Review access authorization lists',
      'Examine media access audit logs',
      'Test unauthorized access detection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-3',
    name: 'Media Marking',
    description:
      'FedRAMP requires organizations to mark information system media indicating the distribution limitations, handling caveats, and applicable security markings of the information.',
    category: 'Media Protection',
    implementationGuidance:
      'Establish media marking standards aligned with federal requirements. Implement marking procedures for all media types. Train personnel on proper media marking. Verify markings before media distribution or transport.',
    evidenceRequirements: [
      'Media marking standards and procedures',
      'Examples of properly marked media',
      'Media marking training records',
      'Marking verification procedures',
      'Media marking compliance audits',
    ],
    testProcedures: [
      'Review media marking standards',
      'Examine samples of marked media',
      'Verify personnel training on marking',
      'Test marking verification process',
      'Review marking compliance audits',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-4',
    name: 'Media Storage',
    description:
      'FedRAMP requires organizations to physically control and securely store information system media within controlled areas. Digital media containing federal data must be encrypted.',
    category: 'Media Protection',
    implementationGuidance:
      'Implement secure storage areas for all media types. Use encryption for digital media containing federal data. Control access to media storage areas. Implement environmental controls to protect media from damage.',
    evidenceRequirements: [
      'Media storage procedures',
      'Secure storage area documentation',
      'Encryption implementation for digital media',
      'Storage access controls',
      'Environmental control documentation',
    ],
    testProcedures: [
      'Verify secure storage areas exist',
      'Test encryption of digital media',
      'Review storage access controls',
      'Examine environmental controls',
      'Test media protection effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-5',
    name: 'Media Transport',
    description:
      'FedRAMP requires organizations to protect and control information system media during transport outside of controlled areas using cryptographic mechanisms and authorized personnel.',
    category: 'Media Protection',
    implementationGuidance:
      'Use cryptographic protection for media in transport. Employ tamper-evident packaging for physical media. Use only authorized personnel for media transport. Track media during transport and verify receipt.',
    evidenceRequirements: [
      'Media transport procedures',
      'Cryptographic protection mechanisms',
      'Tamper-evident packaging procedures',
      'Authorized transport personnel list',
      'Media tracking and receipt verification',
    ],
    testProcedures: [
      'Review media transport procedures',
      'Verify cryptographic protection',
      'Examine tamper-evident packaging use',
      'Verify authorized personnel',
      'Test media tracking and verification',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-6',
    name: 'Media Sanitization',
    description:
      'FedRAMP requires organizations to sanitize information system media prior to disposal, release out of organizational control, or release for reuse using approved sanitization techniques and procedures.',
    category: 'Media Protection',
    implementationGuidance:
      'Implement media sanitization procedures aligned with NIST SP 800-88 guidelines. Use approved sanitization techniques based on media type and data sensitivity. Document all sanitization activities. Verify sanitization effectiveness.',
    evidenceRequirements: [
      'Media sanitization procedures aligned with NIST SP 800-88',
      'Approved sanitization techniques documentation',
      'Sanitization activity records',
      'Sanitization verification records',
      'Sanitization equipment maintenance records',
    ],
    testProcedures: [
      'Review sanitization procedures for NIST compliance',
      'Verify approved techniques are used',
      'Examine sanitization activity records',
      'Test sanitization verification process',
      'Review equipment maintenance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-7',
    name: 'Media Use',
    description:
      'FedRAMP requires organizations to restrict the use of certain types of media on information systems and prohibit the use of portable storage devices without identifiable owner.',
    category: 'Media Protection',
    implementationGuidance:
      'Define authorized media types for the system. Implement technical controls to restrict unauthorized media. Register and track portable storage devices. Prohibit unidentifiable portable storage devices.',
    evidenceRequirements: [
      'Authorized media types documentation',
      'Technical media restriction controls',
      'Portable storage device registry',
      'Media use policy enforcement records',
      'Unauthorized media detection logs',
    ],
    testProcedures: [
      'Review authorized media types',
      'Test technical restriction controls',
      'Verify portable device registry',
      'Test policy enforcement',
      'Review unauthorized media detection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-8',
    name: 'Media Downgrading',
    description:
      'FedRAMP requires organizations to downgrade information system media only when approved by an authorizing official and using approved equipment, techniques, and procedures.',
    category: 'Media Protection',
    implementationGuidance:
      'Establish media downgrading procedures with authorizing official approval requirements. Use only approved equipment and techniques for downgrading. Document all downgrading activities. Verify downgrading effectiveness before releasing media.',
    evidenceRequirements: [
      'Media downgrading procedures',
      'Authorizing official approval records',
      'Approved downgrading equipment list',
      'Downgrading activity records',
      'Downgrading verification records',
    ],
    testProcedures: [
      'Review downgrading procedures',
      'Verify approval process',
      'Examine approved equipment list',
      'Review downgrading activity records',
      'Test verification process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-9',
    name: 'Media Destruction',
    description:
      'FedRAMP requires organizations to destroy information system media that cannot be sanitized using approved destruction methods that prevent reconstruction.',
    category: 'Media Protection',
    implementationGuidance:
      'Implement media destruction procedures for media that cannot be sanitized. Use approved destruction methods (shredding, incineration, pulverizing). Document all destruction activities. Use authorized destruction services when needed.',
    evidenceRequirements: [
      'Media destruction procedures',
      'Approved destruction methods documentation',
      'Destruction activity records with witnesses',
      'Destruction service agreements',
      'Certificates of destruction',
    ],
    testProcedures: [
      'Review destruction procedures',
      'Verify approved methods are used',
      'Examine destruction records',
      'Review destruction service agreements',
      'Verify certificates of destruction',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-10',
    name: 'Media Inventory',
    description:
      'FedRAMP requires organizations to maintain an inventory of information system media and conduct periodic inventories to ensure accountability.',
    category: 'Media Protection',
    implementationGuidance:
      'Maintain a comprehensive inventory of all information system media. Conduct periodic physical inventories. Track media throughout its lifecycle. Investigate and report missing media.',
    evidenceRequirements: [
      'Media inventory database or records',
      'Periodic inventory audit records',
      'Media lifecycle tracking documentation',
      'Missing media investigation procedures',
      'Missing media incident reports',
    ],
    testProcedures: [
      'Review media inventory for completeness',
      'Examine periodic inventory audits',
      'Verify lifecycle tracking',
      'Test missing media procedures',
      'Review incident reports for missing media',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PHYSICAL AND ENVIRONMENTAL PROTECTION (PE) - 22 Controls
  // ============================================================
  {
    controlId: 'FR-PE-1',
    name: 'Physical and Environmental Protection Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a physical and environmental protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Develop a physical and environmental protection policy that addresses facility security, environmental controls, and visitor management. Define roles and responsibilities for physical security. Ensure policy addresses FedRAMP datacenter requirements.',
    evidenceRequirements: [
      'Physical and environmental protection policy',
      'Physical security procedures',
      'Policy approval and review records',
      'Role definitions for physical security',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify physical security policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test physical security implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-2',
    name: 'Physical Access Authorizations',
    description:
      'FedRAMP requires organizations to develop, approve, and maintain a list of individuals with authorized access to the facility where the information system resides. Authorization must be reviewed at least annually.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Maintain a list of personnel authorized for physical access to facilities. Implement approval process for physical access authorizations. Review and update access lists at least annually. Remove access promptly when no longer needed.',
    evidenceRequirements: [
      'Physical access authorization list',
      'Access approval records',
      'Annual access review records',
      'Access removal records',
      'Authorization criteria documentation',
    ],
    testProcedures: [
      'Review physical access authorization list',
      'Verify approval process for access',
      'Confirm annual access reviews',
      'Test access removal process',
      'Verify authorization criteria',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-3',
    name: 'Physical Access Control',
    description:
      'FedRAMP requires organizations to enforce physical access authorizations at entry and exit points to the facility using guards, identification badges, access control systems, and monitoring.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement physical access controls at all entry points including badge readers, biometric systems, or guards. Verify authorization before granting access. Maintain access logs. Implement mantrap or turnstile controls for high-security areas.',
    evidenceRequirements: [
      'Physical access control system documentation',
      'Access control device configurations',
      'Physical access logs',
      'Guard procedures if applicable',
      'Access control testing records',
    ],
    testProcedures: [
      'Verify access controls at entry points',
      'Test badge or biometric systems',
      'Review physical access logs',
      'Test unauthorized access prevention',
      'Verify guard procedures if applicable',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-4',
    name: 'Access Control for Transmission Medium',
    description:
      'FedRAMP requires organizations to control physical access to information system distribution and transmission lines within organizational facilities.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Protect network cabling and distribution frames from unauthorized access. Use locked wiring closets and cable trays. Implement cable security for exposed runs. Monitor access to telecommunications rooms.',
    evidenceRequirements: [
      'Transmission medium protection procedures',
      'Wiring closet access controls',
      'Cable protection mechanisms',
      'Access monitoring for telecom rooms',
      'Physical inspection records',
    ],
    testProcedures: [
      'Verify wiring closet access controls',
      'Examine cable protection measures',
      'Review telecom room access logs',
      'Test physical security of transmission media',
      'Conduct physical inspection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-5',
    name: 'Access Control for Output Devices',
    description:
      'FedRAMP requires organizations to control physical access to information system output devices to prevent unauthorized individuals from obtaining the output.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Position output devices in secure areas. Implement pull-printing for shared printers. Control access to areas with output devices. Clear output trays regularly.',
    evidenceRequirements: [
      'Output device placement documentation',
      'Pull-printing implementation if applicable',
      'Access controls for output areas',
      'Output handling procedures',
      'Output device security assessment',
    ],
    testProcedures: [
      'Verify output device placement security',
      'Test pull-printing controls',
      'Review access to output areas',
      'Observe output handling practices',
      'Assess output device security',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-6',
    name: 'Monitoring Physical Access',
    description:
      'FedRAMP requires organizations to monitor physical access to the facility where the information system resides to detect and respond to physical security incidents.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement video surveillance at entry points and sensitive areas. Monitor access control system alerts. Review access logs regularly. Investigate unusual access patterns. Retain monitoring records per FedRAMP requirements.',
    evidenceRequirements: [
      'Video surveillance system documentation',
      'Access monitoring procedures',
      'Access log review records',
      'Security incident investigation records',
      'Monitoring record retention documentation',
    ],
    testProcedures: [
      'Verify video surveillance coverage',
      'Review access monitoring procedures',
      'Examine access log review records',
      'Test incident response for physical events',
      'Verify retention of monitoring records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-8',
    name: 'Visitor Access Records',
    description:
      'FedRAMP requires organizations to maintain visitor access records to the facility where the information system resides for a minimum of one year and review visitor access records periodically.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement visitor registration and logging system. Record visitor name, organization, purpose, and escort. Maintain records for at least one year. Review visitor logs periodically for anomalies.',
    evidenceRequirements: [
      'Visitor access log system',
      'Visitor registration procedures',
      'Historical visitor records',
      'Visitor log review records',
      'Record retention documentation',
    ],
    testProcedures: [
      'Review visitor logging system',
      'Examine visitor registration procedures',
      'Verify one-year record retention',
      'Review periodic log reviews',
      'Test visitor access process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-9',
    name: 'Power Equipment and Cabling',
    description:
      'FedRAMP requires organizations to protect power equipment and power cabling for the information system from damage and destruction.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Protect power distribution equipment from physical damage. Secure power cabling from tampering. Implement redundant power feeds where possible. Use surge protection and power conditioning.',
    evidenceRequirements: [
      'Power equipment protection measures',
      'Power cabling security documentation',
      'Redundant power implementation',
      'Surge protection implementation',
      'Power infrastructure inspection records',
    ],
    testProcedures: [
      'Verify power equipment protection',
      'Examine power cabling security',
      'Test redundant power systems',
      'Verify surge protection',
      'Conduct power infrastructure inspection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-10',
    name: 'Emergency Shutoff',
    description:
      'FedRAMP requires organizations to provide the capability of shutting off power to the information system or individual system components in emergencies.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Install emergency power shutoff switches in accessible locations. Label shutoff switches clearly. Train personnel on emergency shutoff procedures. Test emergency shutoff functionality regularly.',
    evidenceRequirements: [
      'Emergency shutoff switch locations',
      'Shutoff switch labeling documentation',
      'Emergency shutoff procedures',
      'Personnel training records',
      'Emergency shutoff test records',
    ],
    testProcedures: [
      'Verify emergency shutoff accessibility',
      'Review shutoff switch labeling',
      'Examine emergency shutoff procedures',
      'Verify personnel training',
      'Review shutoff test records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-11',
    name: 'Emergency Power',
    description:
      'FedRAMP requires organizations to provide a short-term uninterruptible power supply to facilitate an orderly shutdown of the information system in the event of a primary power source loss.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement UPS systems to provide emergency power during outages. Size UPS for orderly system shutdown. Implement automatic failover to generator power for extended outages. Test emergency power systems regularly.',
    evidenceRequirements: [
      'UPS system documentation',
      'UPS capacity calculations',
      'Generator documentation if applicable',
      'Emergency power test records',
      'Maintenance records for power systems',
    ],
    testProcedures: [
      'Verify UPS implementation',
      'Review UPS capacity for shutdown needs',
      'Test failover to generator',
      'Examine emergency power test records',
      'Review maintenance records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-12',
    name: 'Emergency Lighting',
    description:
      'FedRAMP requires organizations to employ and maintain automatic emergency lighting for the information system that activates in the event of a power outage or disruption.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Install automatic emergency lighting in all areas housing information systems. Ensure coverage of evacuation routes. Test emergency lighting regularly. Replace batteries and bulbs as needed.',
    evidenceRequirements: [
      'Emergency lighting system documentation',
      'Emergency lighting coverage maps',
      'Emergency lighting test records',
      'Maintenance records for lighting',
      'Battery replacement records',
    ],
    testProcedures: [
      'Verify emergency lighting installation',
      'Review lighting coverage',
      'Examine test records',
      'Verify maintenance is current',
      'Test emergency lighting activation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-13',
    name: 'Fire Protection',
    description:
      'FedRAMP requires organizations to employ and maintain fire suppression and detection devices and systems for the information system that are supported by an independent energy source.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Install fire detection systems throughout facilities. Implement appropriate fire suppression (clean agent, sprinkler). Ensure fire systems have backup power. Conduct regular fire system inspections and tests.',
    evidenceRequirements: [
      'Fire detection system documentation',
      'Fire suppression system documentation',
      'Backup power for fire systems',
      'Fire system inspection records',
      'Fire system test records',
    ],
    testProcedures: [
      'Verify fire detection coverage',
      'Review fire suppression appropriateness',
      'Test backup power for fire systems',
      'Examine inspection records',
      'Review test records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-14',
    name: 'Temperature and Humidity Controls',
    description:
      'FedRAMP requires organizations to maintain temperature and humidity levels within the facility where the information system resides at acceptable levels and monitor these levels.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement HVAC systems to maintain appropriate temperature and humidity. Install environmental monitoring sensors. Configure alerts for out-of-range conditions. Document acceptable operating ranges.',
    evidenceRequirements: [
      'HVAC system documentation',
      'Environmental monitoring system',
      'Acceptable range documentation',
      'Alert configuration records',
      'Environmental monitoring logs',
    ],
    testProcedures: [
      'Verify HVAC adequacy',
      'Review environmental monitoring',
      'Confirm acceptable ranges defined',
      'Test alert functionality',
      'Examine monitoring logs',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-15',
    name: 'Water Damage Protection',
    description:
      'FedRAMP requires organizations to protect the information system from damage resulting from water leakage by providing master shutoff valves and leak detection.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Identify and document master water shutoff valve locations. Install water leak detection sensors in critical areas. Configure alerts for water detection. Train personnel on water emergency procedures.',
    evidenceRequirements: [
      'Master shutoff valve locations',
      'Water leak detection system',
      'Alert configuration for water detection',
      'Water emergency procedures',
      'Personnel training records',
    ],
    testProcedures: [
      'Verify shutoff valve accessibility',
      'Test leak detection sensors',
      'Verify alert functionality',
      'Review emergency procedures',
      'Verify personnel training',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-16',
    name: 'Delivery and Removal',
    description:
      'FedRAMP requires organizations to authorize, monitor, and control information system components entering and exiting the facility and maintain records of those items.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement authorization process for equipment delivery and removal. Verify equipment against delivery documentation. Maintain records of all equipment movements. Escort delivery personnel in sensitive areas.',
    evidenceRequirements: [
      'Equipment authorization procedures',
      'Delivery verification records',
      'Equipment movement logs',
      'Escort procedures for deliveries',
      'Equipment inventory reconciliation',
    ],
    testProcedures: [
      'Review equipment authorization process',
      'Verify delivery verification procedures',
      'Examine equipment movement logs',
      'Test escort procedures',
      'Review inventory reconciliation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-17',
    name: 'Alternate Work Site',
    description:
      'FedRAMP requires organizations to employ security controls at alternate work sites equivalent to those at the primary site.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Identify and assess alternate work sites. Implement equivalent security controls at alternate sites. Provide secure communications for alternate sites. Conduct periodic assessments of alternate site security.',
    evidenceRequirements: [
      'Alternate work site identification',
      'Security control implementation at alternate sites',
      'Secure communication mechanisms',
      'Alternate site security assessments',
      'Alternate site usage procedures',
    ],
    testProcedures: [
      'Verify alternate sites identified',
      'Review security controls at alternate sites',
      'Test secure communications',
      'Examine security assessments',
      'Review usage procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-18',
    name: 'Location of Information System Components',
    description:
      'FedRAMP requires organizations to position information system components within the facility to minimize potential damage from physical and environmental hazards.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Assess facility for physical and environmental hazards. Position critical components away from windows and high-traffic areas. Elevate equipment to protect from flooding. Consider natural disaster risks in placement.',
    evidenceRequirements: [
      'Facility hazard assessment',
      'Component placement documentation',
      'Flood protection measures',
      'Natural disaster risk assessment',
      'Component placement rationale',
    ],
    testProcedures: [
      'Review hazard assessment',
      'Verify component placement',
      'Examine flood protection',
      'Review natural disaster considerations',
      'Assess placement adequacy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-19',
    name: 'Information Leakage',
    description:
      'FedRAMP requires organizations to protect the information system from information leakage due to electromagnetic signals emanations.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Assess electromagnetic emanation risks. Implement shielding where necessary. Use TEMPEST-approved equipment for high-security applications. Monitor for unauthorized emanation detection devices.',
    evidenceRequirements: [
      'Electromagnetic emanation risk assessment',
      'Shielding implementation documentation',
      'TEMPEST equipment certification if applicable',
      'Emanation monitoring procedures',
      'Physical security for sensitive areas',
    ],
    testProcedures: [
      'Review emanation risk assessment',
      'Verify shielding implementation',
      'Review TEMPEST certifications',
      'Examine monitoring procedures',
      'Assess physical security adequacy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-20',
    name: 'Asset Monitoring and Tracking',
    description:
      'FedRAMP requires organizations to employ asset location technologies to track and monitor the location of critical assets.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement asset tracking for critical equipment. Use RFID, GPS, or other tracking technologies. Monitor asset locations and movements. Alert on unauthorized movement or removal.',
    evidenceRequirements: [
      'Asset tracking system documentation',
      'Critical asset inventory',
      'Location monitoring records',
      'Movement alert configuration',
      'Unauthorized movement response procedures',
    ],
    testProcedures: [
      'Verify asset tracking implementation',
      'Review critical asset inventory',
      'Examine location monitoring',
      'Test movement alerts',
      'Review response procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-21',
    name: 'Electromagnetic Pulse Protection',
    description:
      'FedRAMP requires organizations to employ protective measures against electromagnetic pulse (EMP) damage for critical information system components.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Assess EMP risks for critical systems. Implement EMP shielding for high-criticality systems. Use surge protection and grounding. Maintain EMP-protected backup systems if required.',
    evidenceRequirements: [
      'EMP risk assessment',
      'EMP protection implementation',
      'Surge protection documentation',
      'Grounding system documentation',
      'EMP-protected backup documentation',
    ],
    testProcedures: [
      'Review EMP risk assessment',
      'Verify EMP protection measures',
      'Test surge protection',
      'Verify grounding adequacy',
      'Review backup protection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-22',
    name: 'Component Marking',
    description:
      'FedRAMP requires organizations to mark information system hardware components indicating the impact level of the information system.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Develop component marking standards based on impact level. Apply consistent markings to all hardware. Update markings when impact levels change. Train personnel on marking significance.',
    evidenceRequirements: [
      'Component marking standards',
      'Examples of marked components',
      'Marking update procedures',
      'Personnel training records',
      'Marking compliance audits',
    ],
    testProcedures: [
      'Review marking standards',
      'Examine marked components',
      'Verify marking update process',
      'Review training records',
      'Conduct marking compliance audit',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-23',
    name: 'Facility Location',
    description:
      'FedRAMP requires organizations to locate information system components in secure areas based on data sensitivity and criticality assessments.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Assess facility locations for security adequacy. Place high-impact systems in most secure areas. Implement zoned security based on data sensitivity. Document location decisions and rationale.',
    evidenceRequirements: [
      'Facility security assessment',
      'Component location documentation',
      'Zoned security implementation',
      'Location decision rationale',
      'Periodic location review records',
    ],
    testProcedures: [
      'Review facility security assessment',
      'Verify component locations',
      'Examine zoned security',
      'Review location decisions',
      'Verify periodic reviews',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PLANNING (PL) - 10 Controls
  // ============================================================
  {
    controlId: 'FR-PL-1',
    name: 'Security Planning Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a security planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'Planning',
    implementationGuidance:
      'Develop a security planning policy that addresses system security plan development, review, and updates. Define roles for security planning activities. Ensure policy addresses FedRAMP documentation requirements.',
    evidenceRequirements: [
      'Security planning policy document',
      'Security planning procedures',
      'Policy approval and review records',
      'Role definitions for security planning',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify security planning policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test security planning implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-2',
    name: 'System Security Plan',
    description:
      'FedRAMP requires organizations to develop a System Security Plan (SSP) that describes security controls in place or planned, and is consistent with the FedRAMP SSP template. The SSP must be reviewed and updated at least annually.',
    category: 'Planning',
    implementationGuidance:
      'Develop a comprehensive SSP using the FedRAMP SSP template. Document all security controls, their implementation status, and responsible parties. Include system architecture, data flows, and boundary information. Review and update the SSP at least annually and when significant changes occur.',
    evidenceRequirements: [
      'System Security Plan (SSP) using FedRAMP template',
      'SSP annual review and update records',
      'System architecture documentation',
      'Data flow diagrams',
      'Authorization boundary documentation',
    ],
    testProcedures: [
      'Review SSP for FedRAMP template compliance',
      'Verify SSP completeness and accuracy',
      'Confirm annual review and updates',
      'Verify architecture and data flows documented',
      'Confirm boundary is accurately defined',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-4',
    name: 'Rules of Behavior',
    description:
      'FedRAMP requires organizations to establish and make available to individuals requiring access to the information system, rules that describe their responsibilities and expected behavior with regard to information and system usage.',
    category: 'Planning',
    implementationGuidance:
      'Develop rules of behavior document covering acceptable use, security responsibilities, and consequences for violations. Require users to acknowledge rules before access is granted. Review and update rules annually.',
    evidenceRequirements: [
      'Rules of behavior document',
      'User acknowledgment records',
      'Rules distribution procedures',
      'Annual review and update records',
      'Violation consequence documentation',
    ],
    testProcedures: [
      'Review rules of behavior document',
      'Verify user acknowledgment process',
      'Confirm rules are distributed to all users',
      'Verify annual review and updates',
      'Review enforcement of rules',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-7',
    name: 'Security Concept of Operations',
    description:
      'FedRAMP requires organizations to develop a security Concept of Operations (CONOPS) that describes the system from a security perspective.',
    category: 'Planning',
    implementationGuidance:
      'Develop a security CONOPS that describes security roles, security-related activities, and coordination requirements. Include threat environment and security posture. Review and update as system changes.',
    evidenceRequirements: [
      'Security Concept of Operations document',
      'Security roles and responsibilities',
      'Threat environment description',
      'Security coordination requirements',
      'CONOPS review and update records',
    ],
    testProcedures: [
      'Review security CONOPS document',
      'Verify roles and responsibilities defined',
      'Confirm threat environment addressed',
      'Verify coordination requirements',
      'Review update history',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-8',
    name: 'Security Architecture',
    description:
      'FedRAMP requires organizations to develop a security architecture for the information system that describes the overall philosophy, requirements, and approach taken with regard to protecting the confidentiality, integrity, and availability of organizational information.',
    category: 'Planning',
    implementationGuidance:
      'Develop a security architecture document that aligns with enterprise architecture. Document security controls, their placement, and interactions. Include defense-in-depth strategy and security domains. Update architecture when changes occur.',
    evidenceRequirements: [
      'Security architecture document',
      'Security control placement documentation',
      'Defense-in-depth strategy',
      'Security domain definitions',
      'Architecture update records',
    ],
    testProcedures: [
      'Review security architecture document',
      'Verify security control placement',
      'Confirm defense-in-depth approach',
      'Verify security domains defined',
      'Review architecture updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-9',
    name: 'Central Management',
    description:
      'FedRAMP requires organizations to centrally manage security controls across the information system to ensure consistency and efficiency.',
    category: 'Planning',
    implementationGuidance:
      'Implement centralized security control management. Use enterprise security tools for consistent policy enforcement. Centralize security monitoring and reporting. Document central management approach and tools.',
    evidenceRequirements: [
      'Central management approach documentation',
      'Enterprise security tool inventory',
      'Centralized monitoring implementation',
      'Policy enforcement mechanisms',
      'Central management effectiveness metrics',
    ],
    testProcedures: [
      'Review central management approach',
      'Verify enterprise security tools',
      'Test centralized monitoring',
      'Verify policy enforcement consistency',
      'Review effectiveness metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-10',
    name: 'Baseline Selection',
    description:
      'FedRAMP requires organizations to select an appropriate security control baseline based on the categorization of the information system.',
    category: 'Planning',
    implementationGuidance:
      'Select FedRAMP Moderate baseline for systems processing federal data. Document baseline selection rationale. Identify any additional controls needed beyond baseline. Document tailoring decisions.',
    evidenceRequirements: [
      'Baseline selection documentation',
      'System categorization records',
      'Tailoring decisions documentation',
      'Additional controls justification',
      'Baseline implementation status',
    ],
    testProcedures: [
      'Verify baseline selection appropriateness',
      'Review system categorization',
      'Examine tailoring decisions',
      'Verify additional controls rationale',
      'Review baseline implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-11',
    name: 'Baseline Tailoring',
    description:
      'FedRAMP requires organizations to tailor the selected security control baseline as needed based on organizational mission, business functions, and environment of operation.',
    category: 'Planning',
    implementationGuidance:
      'Analyze baseline controls for applicability. Document tailoring decisions with justification. Identify compensating controls where needed. Obtain approval for tailoring decisions from authorizing official.',
    evidenceRequirements: [
      'Baseline tailoring analysis',
      'Tailoring decisions with justification',
      'Compensating controls documentation',
      'Authorizing official approval',
      'Tailored baseline documentation',
    ],
    testProcedures: [
      'Review tailoring analysis',
      'Verify tailoring justifications',
      'Examine compensating controls',
      'Confirm approval obtained',
      'Verify tailored baseline implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-12',
    name: 'Privacy Impact Assessment',
    description:
      'FedRAMP requires organizations to conduct privacy impact assessments for information systems that process personally identifiable information (PII).',
    category: 'Planning',
    implementationGuidance:
      'Identify systems that process PII. Conduct privacy impact assessments for PII systems. Document privacy risks and mitigations. Review PIAs when system changes affect PII processing.',
    evidenceRequirements: [
      'PII system inventory',
      'Privacy impact assessments',
      'Privacy risk documentation',
      'Privacy mitigation measures',
      'PIA review and update records',
    ],
    testProcedures: [
      'Verify PII systems identified',
      'Review privacy impact assessments',
      'Examine privacy risk documentation',
      'Verify mitigations implemented',
      'Confirm PIA updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-13',
    name: 'Security Engineering Principles',
    description:
      'FedRAMP requires organizations to apply security engineering principles in the specification, design, development, implementation, and modification of the information system.',
    category: 'Planning',
    implementationGuidance:
      'Document security engineering principles for system development. Apply principles throughout system lifecycle. Include defense in depth, least privilege, and fail-safe defaults. Review adherence to principles during system changes.',
    evidenceRequirements: [
      'Security engineering principles documentation',
      'System design documentation showing principle application',
      'Development standards aligned with principles',
      'Implementation review records',
      'Modification review records',
    ],
    testProcedures: [
      'Review security engineering principles',
      'Verify principles applied in design',
      'Examine development standards',
      'Review implementation compliance',
      'Verify modification review process',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PERSONNEL SECURITY (PS) - 10 Controls
  // ============================================================
  {
    controlId: 'FR-PS-1',
    name: 'Personnel Security Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a personnel security policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'Personnel Security',
    implementationGuidance:
      'Develop a personnel security policy covering screening, access authorization, termination, and transfers. Define roles for personnel security activities. Ensure policy addresses FedRAMP requirements for federal data access.',
    evidenceRequirements: [
      'Personnel security policy document',
      'Personnel security procedures',
      'Policy approval and review records',
      'Role definitions for personnel security',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify personnel security policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test personnel security implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-2',
    name: 'Position Risk Designation',
    description:
      'FedRAMP requires organizations to assign a risk designation to all organizational positions and establish screening criteria for individuals filling those positions.',
    category: 'Personnel Security',
    implementationGuidance:
      'Define position risk categories based on access to sensitive data and systems. Assign risk designations to all positions. Develop screening criteria appropriate for each risk level. Review designations periodically.',
    evidenceRequirements: [
      'Position risk designation criteria',
      'Position risk designations for all roles',
      'Screening criteria by risk level',
      'Designation review records',
      'Position description documentation',
    ],
    testProcedures: [
      'Review risk designation criteria',
      'Verify all positions have designations',
      'Examine screening criteria alignment',
      'Confirm periodic reviews conducted',
      'Review position descriptions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-3',
    name: 'Personnel Screening',
    description:
      'FedRAMP requires organizations to screen individuals prior to authorizing access to the information system. Screening must be appropriate for the risk designation of the position.',
    category: 'Personnel Security',
    implementationGuidance:
      'Implement background investigation procedures appropriate for position risk levels. Complete screening before granting system access. Re-screen personnel periodically based on risk level. Document screening results and maintain records.',
    evidenceRequirements: [
      'Personnel screening procedures',
      'Background investigation records',
      'Screening completion verification',
      'Re-screening schedule and records',
      'Screening result documentation',
    ],
    testProcedures: [
      'Review screening procedures',
      'Verify screening completion before access',
      'Confirm re-screening is conducted',
      'Examine screening records',
      'Verify screening matches position risk',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-4',
    name: 'Personnel Termination',
    description:
      'FedRAMP requires organizations to disable information system access within the same day upon termination of employment and conduct exit interviews that include discussion of information security.',
    category: 'Personnel Security',
    implementationGuidance:
      'Implement same-day access termination procedures. Conduct exit interviews covering security topics. Retrieve all organization-owned assets. Notify appropriate personnel of termination. Revoke all access credentials and badges.',
    evidenceRequirements: [
      'Personnel termination procedures',
      'Access termination records with timestamps',
      'Exit interview documentation',
      'Asset retrieval records',
      'Credential revocation records',
    ],
    testProcedures: [
      'Review termination procedures',
      'Verify same-day access termination',
      'Examine exit interview records',
      'Confirm asset retrieval',
      'Verify credential revocation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-5',
    name: 'Personnel Transfer',
    description:
      'FedRAMP requires organizations to review and confirm ongoing operational need for current logical and physical access authorizations when individuals are reassigned or transferred to other positions.',
    category: 'Personnel Security',
    implementationGuidance:
      'Review access authorizations when personnel transfer. Modify access as appropriate for new position. Remove access no longer needed. Document transfer access review decisions.',
    evidenceRequirements: [
      'Personnel transfer procedures',
      'Access review records for transfers',
      'Access modification records',
      'Access removal records',
      'Transfer access authorization documentation',
    ],
    testProcedures: [
      'Review transfer procedures',
      'Verify access reviews conducted',
      'Confirm access modifications appropriate',
      'Verify unnecessary access removed',
      'Review transfer documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-6',
    name: 'Access Agreements',
    description:
      'FedRAMP requires organizations to develop and document access agreements for individuals requiring access to organizational information and information systems.',
    category: 'Personnel Security',
    implementationGuidance:
      'Develop access agreements covering security responsibilities, acceptable use, and consequences for violations. Require signed agreements before granting access. Review and update agreements annually. Re-sign agreements when they change.',
    evidenceRequirements: [
      'Access agreement templates',
      'Signed access agreements for all users',
      'Agreement review and update records',
      'Re-signing records for agreement changes',
      'Agreement distribution procedures',
    ],
    testProcedures: [
      'Review access agreement content',
      'Verify all users have signed agreements',
      'Confirm annual review and updates',
      'Verify re-signing when changed',
      'Review distribution procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-7',
    name: 'Third-Party Personnel Security',
    description:
      'FedRAMP requires organizations to establish personnel security requirements including security roles and responsibilities for third-party providers.',
    category: 'Personnel Security',
    implementationGuidance:
      'Include personnel security requirements in contracts with third parties. Require background investigations for third-party personnel. Define security responsibilities in agreements. Monitor third-party compliance with personnel security requirements.',
    evidenceRequirements: [
      'Third-party security requirements in contracts',
      'Third-party background investigation records',
      'Security responsibility documentation',
      'Compliance monitoring records',
      'Third-party access agreements',
    ],
    testProcedures: [
      'Review contract security requirements',
      'Verify third-party investigations',
      'Confirm responsibilities documented',
      'Examine compliance monitoring',
      'Review third-party agreements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-8',
    name: 'Personnel Sanctions',
    description:
      'FedRAMP requires organizations to employ a formal sanctions process for individuals failing to comply with established information security policies and procedures.',
    category: 'Personnel Security',
    implementationGuidance:
      'Develop formal sanctions process for security violations. Define sanctions appropriate for violation severity. Document and apply sanctions consistently. Track sanctions and include in personnel records.',
    evidenceRequirements: [
      'Formal sanctions process documentation',
      'Sanctions by violation severity',
      'Sanction application records',
      'Personnel record updates',
      'Sanctions tracking documentation',
    ],
    testProcedures: [
      'Review sanctions process',
      'Verify sanctions are defined',
      'Examine sanction application records',
      'Confirm personnel record updates',
      'Review sanctions tracking',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-9',
    name: 'Position Descriptions',
    description:
      'FedRAMP requires organizations to incorporate security role descriptions into position descriptions for individuals requiring access to organizational information systems.',
    category: 'Personnel Security',
    implementationGuidance:
      'Include security responsibilities in position descriptions. Document security role requirements for each position. Update descriptions when security requirements change. Use descriptions in hiring and performance evaluation.',
    evidenceRequirements: [
      'Position descriptions with security roles',
      'Security requirement documentation by position',
      'Description update records',
      'Hiring process integration',
      'Performance evaluation integration',
    ],
    testProcedures: [
      'Review position descriptions for security content',
      'Verify security requirements documented',
      'Confirm descriptions are current',
      'Review hiring process integration',
      'Examine performance evaluation integration',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-10',
    name: 'Personnel Separation',
    description:
      'FedRAMP requires organizations to ensure that personnel separating from the organization have all access removed and organizational assets returned before separation is complete.',
    category: 'Personnel Security',
    implementationGuidance:
      'Implement separation checklist covering all access and assets. Require completion before final separation. Verify all system access is removed. Collect all physical access devices and organizational property.',
    evidenceRequirements: [
      'Separation checklist documentation',
      'Separation completion records',
      'Access removal verification',
      'Asset return records',
      'Physical access device collection records',
    ],
    testProcedures: [
      'Review separation checklist',
      'Verify completion requirements',
      'Confirm access removal',
      'Review asset return records',
      'Verify physical device collection',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // RISK ASSESSMENT (RA) - 8 Controls
  // ============================================================
  {
    controlId: 'FR-RA-1',
    name: 'Risk Assessment Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a risk assessment policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Develop a risk assessment policy that defines assessment methodology, frequency, and reporting requirements. Define roles for risk assessment activities. Ensure policy addresses FedRAMP continuous monitoring requirements.',
    evidenceRequirements: [
      'Risk assessment policy document',
      'Risk assessment procedures',
      'Policy approval and review records',
      'Role definitions for risk assessment',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify risk assessment policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test risk assessment implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-2',
    name: 'Security Categorization',
    description:
      'FedRAMP requires organizations to categorize information and the information system in accordance with applicable laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Categorize the system using FIPS 199 criteria. Document categorization rationale and supporting analysis. Obtain authorizing official approval for categorization. Review categorization when system changes occur.',
    evidenceRequirements: [
      'Security categorization documentation',
      'FIPS 199 categorization rationale',
      'Authorizing official approval',
      'Categorization review records',
      'Data type inventory',
    ],
    testProcedures: [
      'Review security categorization',
      'Verify FIPS 199 alignment',
      'Confirm authorizing official approval',
      'Review categorization updates',
      'Verify data types documented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-3',
    name: 'Risk Assessment',
    description:
      'FedRAMP requires organizations to conduct an assessment of risk, including the likelihood and magnitude of harm from unauthorized access, use, disclosure, disruption, modification, or destruction of the information system.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Conduct formal risk assessments at least annually. Identify threats, vulnerabilities, and potential impacts. Calculate risk levels based on likelihood and impact. Document risk assessment results and present to management.',
    evidenceRequirements: [
      'Risk assessment reports',
      'Threat identification documentation',
      'Vulnerability analysis documentation',
      'Risk calculation methodology',
      'Risk assessment presentation to management',
    ],
    testProcedures: [
      'Review risk assessment reports',
      'Verify threat identification process',
      'Examine vulnerability analysis',
      'Confirm risk calculation methodology',
      'Verify management review',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-5',
    name: 'Vulnerability Scanning',
    description:
      'FedRAMP requires organizations to scan for vulnerabilities in the information system monthly and when new vulnerabilities potentially affecting the system are identified and reported.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Implement automated vulnerability scanning tools. Conduct monthly vulnerability scans. Scan when new vulnerabilities are announced. Remediate high and critical vulnerabilities within FedRAMP timelines. Report scan results in continuous monitoring reports.',
    evidenceRequirements: [
      'Vulnerability scanning tool documentation',
      'Monthly vulnerability scan reports',
      'Ad-hoc scan records for new vulnerabilities',
      'Vulnerability remediation records',
      'Continuous monitoring reports with scan results',
    ],
    testProcedures: [
      'Verify scanning tools are implemented',
      'Review monthly scan reports',
      'Confirm ad-hoc scanning process',
      'Examine remediation timelines',
      'Verify continuous monitoring inclusion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-6',
    name: 'Technical Surveillance Countermeasures Survey',
    description:
      'FedRAMP requires organizations to employ a technical surveillance countermeasures survey at designated locations when there is a high risk of technical surveillance.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Identify locations requiring countermeasures surveys based on risk assessment. Conduct surveys at appropriate frequencies. Use qualified personnel or contractors for surveys. Document and address any findings.',
    evidenceRequirements: [
      'Location risk assessment for surveillance',
      'Survey schedule documentation',
      'Survey personnel qualifications',
      'Survey reports and findings',
      'Finding remediation records',
    ],
    testProcedures: [
      'Review location risk assessments',
      'Verify survey schedule',
      'Confirm personnel qualifications',
      'Examine survey reports',
      'Review finding remediation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-7',
    name: 'Risk Response',
    description:
      'FedRAMP requires organizations to respond to findings from security assessments, monitoring, and audits in accordance with organizational risk tolerance.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Define risk response options (accept, mitigate, transfer, avoid). Implement risk responses based on risk tolerance. Document risk response decisions with justification. Track risk response implementation.',
    evidenceRequirements: [
      'Risk response option definitions',
      'Risk tolerance documentation',
      'Risk response decisions and justifications',
      'Risk response implementation tracking',
      'Risk acceptance documentation for accepted risks',
    ],
    testProcedures: [
      'Review risk response options',
      'Verify risk tolerance defined',
      'Examine response decisions',
      'Confirm implementation tracking',
      'Review risk acceptances',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-8',
    name: 'Privacy Impact Assessments',
    description:
      'FedRAMP requires organizations to conduct privacy impact assessments for information systems, organizations, or systems that process personally identifiable information (PII).',
    category: 'Risk Assessment',
    implementationGuidance:
      'Identify systems processing PII. Conduct privacy impact assessments. Document privacy risks and mitigations. Update assessments when processing changes. Publish PIAs as required.',
    evidenceRequirements: [
      'PII system inventory',
      'Privacy impact assessment documents',
      'Privacy risk and mitigation documentation',
      'Assessment update records',
      'Published PIA documentation',
    ],
    testProcedures: [
      'Verify PII systems identified',
      'Review privacy impact assessments',
      'Examine risk and mitigation documentation',
      'Confirm assessment updates',
      'Verify publication requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-9',
    name: 'Criticality Analysis',
    description:
      'FedRAMP requires organizations to identify critical information system components and functions by performing a criticality analysis.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Identify mission-critical components and functions. Analyze dependencies and single points of failure. Document criticality analysis results. Use analysis to prioritize security investments and recovery planning.',
    evidenceRequirements: [
      'Critical component identification',
      'Dependency analysis documentation',
      'Single point of failure analysis',
      'Criticality analysis results',
      'Security prioritization based on criticality',
    ],
    testProcedures: [
      'Review critical component identification',
      'Examine dependency analysis',
      'Verify single points of failure addressed',
      'Review criticality analysis',
      'Confirm security prioritization alignment',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // SYSTEM AND SERVICES ACQUISITION (SA) - 25 Controls
  // ============================================================
  {
    controlId: 'FR-SA-1',
    name: 'System and Services Acquisition Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a system and services acquisition policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Develop system and services acquisition policy covering security requirements in acquisitions. Define roles for acquisition security activities. Include supply chain risk management requirements. Ensure policy addresses FedRAMP service acquisition requirements.',
    evidenceRequirements: [
      'System and services acquisition policy',
      'Acquisition procedures documentation',
      'Policy approval and review records',
      'Role definitions for acquisition',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify acquisition policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test acquisition security implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-2',
    name: 'Allocation of Resources',
    description:
      'FedRAMP requires organizations to determine information security requirements for the information system in mission and business process planning and allocate resources to protect the system.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Include security requirements in system planning. Allocate budget for security controls and monitoring. Plan resources for FedRAMP authorization and continuous monitoring. Track security resource allocation.',
    evidenceRequirements: [
      'Security requirements in system planning',
      'Security budget allocation documentation',
      'FedRAMP authorization resource planning',
      'Continuous monitoring resource allocation',
      'Resource tracking records',
    ],
    testProcedures: [
      'Review security requirements in planning',
      'Verify budget allocation adequacy',
      'Confirm FedRAMP resource planning',
      'Examine resource tracking',
      'Review allocation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-3',
    name: 'System Development Life Cycle',
    description:
      'FedRAMP requires organizations to manage the information system using a system development life cycle that incorporates information security considerations.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Implement a formal SDLC with security integrated at each phase. Include security reviews at phase gates. Document security activities throughout development. Ensure security testing before deployment.',
    evidenceRequirements: [
      'SDLC documentation with security integration',
      'Security review records at phase gates',
      'Security activity documentation',
      'Security testing records',
      'SDLC compliance verification',
    ],
    testProcedures: [
      'Review SDLC documentation',
      'Verify security integration at each phase',
      'Examine phase gate security reviews',
      'Confirm security testing conducted',
      'Review SDLC compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-4',
    name: 'Acquisition Process',
    description:
      'FedRAMP requires organizations to include security functional requirements, security strength requirements, security assurance requirements, and security documentation requirements in acquisition contracts.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Include security requirements in all acquisition contracts. Require vendor security documentation. Define security testing requirements. Include FedRAMP authorization requirements for cloud services.',
    evidenceRequirements: [
      'Acquisition contracts with security requirements',
      'Vendor security documentation requirements',
      'Security testing requirements',
      'FedRAMP requirements for cloud services',
      'Contract security review records',
    ],
    testProcedures: [
      'Review contracts for security requirements',
      'Verify vendor documentation requirements',
      'Confirm security testing requirements',
      'Verify FedRAMP requirements inclusion',
      'Review contract compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-5',
    name: 'Information System Documentation',
    description:
      'FedRAMP requires organizations to obtain administrator documentation for the information system that describes secure configuration, installation, and operation of the system.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Obtain and maintain system documentation including administrator guides, security configuration guides, and user guides. Keep documentation current with system changes. Make documentation available to appropriate personnel.',
    evidenceRequirements: [
      'Administrator documentation',
      'Security configuration guides',
      'User documentation',
      'Documentation update records',
      'Documentation distribution records',
    ],
    testProcedures: [
      'Verify administrator documentation exists',
      'Review security configuration guides',
      'Confirm user documentation availability',
      'Verify documentation currency',
      'Review distribution procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-8',
    name: 'Security Engineering Principles',
    description:
      'FedRAMP requires organizations to apply information system security engineering principles in the specification, design, development, implementation, and modification of the information system.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Apply security engineering principles including defense in depth, least privilege, and separation of duties. Document security architecture decisions. Review security engineering during system changes.',
    evidenceRequirements: [
      'Security engineering principles documentation',
      'Security architecture decisions',
      'Security design documentation',
      'Implementation security reviews',
      'Modification security reviews',
    ],
    testProcedures: [
      'Review security engineering principles',
      'Verify architecture decisions documented',
      'Examine security design',
      'Review implementation security',
      'Verify modification reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-9',
    name: 'External Information System Services',
    description:
      'FedRAMP requires organizations to require that providers of external information system services comply with organizational information security requirements and employ appropriate security controls.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require FedRAMP authorization for external cloud services. Include security requirements in service agreements. Monitor external service provider compliance. Maintain service provider inventory.',
    evidenceRequirements: [
      'External service provider inventory',
      'FedRAMP authorization verification for providers',
      'Service agreements with security requirements',
      'Provider compliance monitoring records',
      'Service provider security assessments',
    ],
    testProcedures: [
      'Review external service inventory',
      'Verify FedRAMP authorizations',
      'Examine service agreements',
      'Review compliance monitoring',
      'Verify security assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-10',
    name: 'Developer Configuration Management',
    description:
      'FedRAMP requires organizations to require the developer of the information system to perform configuration management during design, development, implementation, and operation.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require developers to implement configuration management. Track configuration items throughout development. Control changes to development baselines. Verify configuration management effectiveness.',
    evidenceRequirements: [
      'Developer configuration management plans',
      'Configuration item tracking records',
      'Change control records',
      'Configuration management audits',
      'Baseline documentation',
    ],
    testProcedures: [
      'Review developer CM plans',
      'Verify configuration tracking',
      'Examine change control records',
      'Review CM audits',
      'Verify baseline management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-11',
    name: 'Developer Security Testing',
    description:
      'FedRAMP requires organizations to require the developer of the information system to create and implement a security assessment plan and conduct security testing.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require developers to conduct security testing including unit testing, integration testing, and system testing. Review security test results. Address identified security issues before deployment.',
    evidenceRequirements: [
      'Developer security assessment plans',
      'Security testing procedures',
      'Security test results',
      'Issue remediation records',
      'Pre-deployment security verification',
    ],
    testProcedures: [
      'Review security assessment plans',
      'Verify testing procedures',
      'Examine test results',
      'Review issue remediation',
      'Verify pre-deployment testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-12',
    name: 'Supply Chain Protection',
    description:
      'FedRAMP requires organizations to protect against supply chain threats by employing security safeguards as part of the system development life cycle.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Implement supply chain risk management practices. Verify component authenticity. Monitor supply chain threats. Include supply chain requirements in contracts.',
    evidenceRequirements: [
      'Supply chain risk management plan',
      'Component authenticity verification records',
      'Supply chain threat monitoring',
      'Contract supply chain requirements',
      'Supply chain risk assessments',
    ],
    testProcedures: [
      'Review supply chain risk management',
      'Verify authenticity verification',
      'Examine threat monitoring',
      'Review contract requirements',
      'Verify risk assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-13',
    name: 'Trustworthiness',
    description:
      'FedRAMP requires organizations to require that information system components demonstrate trustworthiness through security testing, evaluation, or certification.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require trustworthiness evidence for critical components. Verify component certifications and evaluations. Document trustworthiness decisions. Monitor for changes affecting trustworthiness.',
    evidenceRequirements: [
      'Component trustworthiness requirements',
      'Certification and evaluation records',
      'Trustworthiness decision documentation',
      'Trustworthiness monitoring records',
      'Component security assessments',
    ],
    testProcedures: [
      'Review trustworthiness requirements',
      'Verify certifications and evaluations',
      'Examine decision documentation',
      'Review monitoring records',
      'Verify security assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-14',
    name: 'Criticality Analysis',
    description:
      'FedRAMP requires organizations to identify critical information system components and functions by performing a criticality analysis.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Perform criticality analysis for system components. Prioritize protection based on criticality. Document analysis methodology and results. Update analysis when system changes.',
    evidenceRequirements: [
      'Criticality analysis methodology',
      'Critical component identification',
      'Protection prioritization documentation',
      'Analysis update records',
      'Impact assessment for critical components',
    ],
    testProcedures: [
      'Review criticality analysis methodology',
      'Verify critical component identification',
      'Examine protection prioritization',
      'Review analysis updates',
      'Verify impact assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-15',
    name: 'Development Process, Standards, and Tools',
    description:
      'FedRAMP requires organizations to require the developer of the information system to follow a documented development process that explicitly addresses security requirements.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require documented development processes. Verify security in development standards. Review development tools for security. Monitor development process compliance.',
    evidenceRequirements: [
      'Documented development processes',
      'Development standards with security',
      'Development tool security review',
      'Process compliance monitoring',
      'Developer security certifications',
    ],
    testProcedures: [
      'Review development processes',
      'Verify development standards',
      'Examine tool security reviews',
      'Review compliance monitoring',
      'Verify developer certifications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-16',
    name: 'Developer-Provided Training',
    description:
      'FedRAMP requires organizations to require the developer of the information system to provide training on the correct use and operation of the implemented security functions.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require developers to provide security training. Include training for administrators and users. Document training requirements in contracts. Verify training delivery.',
    evidenceRequirements: [
      'Developer training requirements in contracts',
      'Training materials from developers',
      'Training delivery records',
      'Training effectiveness assessment',
      'Personnel training completion records',
    ],
    testProcedures: [
      'Review training requirements',
      'Examine training materials',
      'Verify training delivery',
      'Review effectiveness assessment',
      'Confirm completion records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-17',
    name: 'Developer Security Architecture and Design',
    description:
      'FedRAMP requires organizations to require the developer of the information system to produce a design specification and security architecture consistent with the organization security architecture.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require security architecture documentation from developers. Verify alignment with organizational architecture. Review architecture for security completeness. Update architecture documentation with changes.',
    evidenceRequirements: [
      'Developer security architecture documentation',
      'Organizational architecture alignment verification',
      'Architecture security review',
      'Architecture update records',
      'Design specification documentation',
    ],
    testProcedures: [
      'Review developer security architecture',
      'Verify organizational alignment',
      'Examine security reviews',
      'Review architecture updates',
      'Verify design specifications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-18',
    name: 'Tamper Resistance and Detection',
    description:
      'FedRAMP requires organizations to implement tamper resistance and detection mechanisms for the information system.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Implement tamper-resistant components where appropriate. Deploy tamper detection mechanisms. Monitor for tampering indicators. Respond to detected tampering.',
    evidenceRequirements: [
      'Tamper resistance implementation',
      'Tamper detection mechanisms',
      'Tampering monitoring procedures',
      'Tamper response procedures',
      'Tamper incident records',
    ],
    testProcedures: [
      'Verify tamper resistance implementation',
      'Test tamper detection mechanisms',
      'Review monitoring procedures',
      'Verify response procedures',
      'Examine incident records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-19',
    name: 'Component Authenticity',
    description:
      'FedRAMP requires organizations to develop and implement anti-counterfeit policy and procedures to detect and prevent counterfeit components.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Implement component authenticity verification. Use authorized distributors. Inspect components for authenticity. Report counterfeit component discoveries.',
    evidenceRequirements: [
      'Anti-counterfeit policy',
      'Authenticity verification procedures',
      'Authorized distributor list',
      'Component inspection records',
      'Counterfeit reporting records',
    ],
    testProcedures: [
      'Review anti-counterfeit policy',
      'Verify authenticity procedures',
      'Examine authorized distributors',
      'Review inspection records',
      'Verify reporting process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-20',
    name: 'Customized Development of Critical Components',
    description:
      'FedRAMP requires organizations to reimplementing or custom develop critical information system components.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Identify components requiring custom development. Implement secure development practices for custom components. Test custom components for security. Maintain custom component documentation.',
    evidenceRequirements: [
      'Custom development justification',
      'Secure development practices documentation',
      'Custom component security testing',
      'Custom component documentation',
      'Custom development review records',
    ],
    testProcedures: [
      'Review custom development decisions',
      'Verify secure development practices',
      'Examine security testing results',
      'Review component documentation',
      'Verify development reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-21',
    name: 'Developer Screening',
    description:
      'FedRAMP requires organizations to require that the developer of the information system perform personnel screening of development personnel.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require background screening for developers. Define screening requirements based on access level. Verify screening compliance. Monitor ongoing developer eligibility.',
    evidenceRequirements: [
      'Developer screening requirements',
      'Screening compliance verification',
      'Developer access level documentation',
      'Screening status records',
      'Ongoing eligibility monitoring',
    ],
    testProcedures: [
      'Review screening requirements',
      'Verify compliance with screening',
      'Examine access level documentation',
      'Review screening status',
      'Verify ongoing monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-22',
    name: 'Unsupported System Components',
    description:
      'FedRAMP requires organizations to replace information system components when support for the components is no longer available from the developer, vendor, or manufacturer.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Track component support status. Plan for replacement of unsupported components. Implement compensating controls for unsupported components during transition. Document unsupported component risks.',
    evidenceRequirements: [
      'Component support status tracking',
      'Replacement planning documentation',
      'Compensating controls for unsupported components',
      'Risk documentation for unsupported components',
      'Replacement implementation records',
    ],
    testProcedures: [
      'Review support status tracking',
      'Verify replacement planning',
      'Examine compensating controls',
      'Review risk documentation',
      'Verify replacement implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-23',
    name: 'Specialization',
    description:
      'FedRAMP requires organizations to employ specialized security components for specific security functions.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Identify security functions requiring specialization. Implement specialized components for critical security functions. Verify specialized component effectiveness. Document specialization decisions.',
    evidenceRequirements: [
      'Security function specialization analysis',
      'Specialized component implementation',
      'Effectiveness verification records',
      'Specialization decision documentation',
      'Specialized component inventory',
    ],
    testProcedures: [
      'Review specialization analysis',
      'Verify specialized implementations',
      'Examine effectiveness verification',
      'Review decision documentation',
      'Verify component inventory',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-24',
    name: 'Content of Contracts',
    description:
      'FedRAMP requires organizations to include specific security requirements in contracts for the development, implementation, and operation of information systems.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Define standard security contract clauses. Include FedRAMP requirements in cloud service contracts. Specify security testing and documentation requirements. Define security incident notification requirements.',
    evidenceRequirements: [
      'Standard security contract clauses',
      'FedRAMP contract requirements',
      'Security testing contract requirements',
      'Incident notification contract clauses',
      'Contract review records',
    ],
    testProcedures: [
      'Review standard security clauses',
      'Verify FedRAMP requirements inclusion',
      'Examine testing requirements',
      'Review notification clauses',
      'Verify contract compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-25',
    name: 'Provenance',
    description:
      'FedRAMP requires organizations to require the developer of the information system to track and document the provenance of development tools, platforms, and components.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Require provenance documentation from developers. Track component origins and custody. Verify provenance claims. Maintain provenance records.',
    evidenceRequirements: [
      'Provenance documentation requirements',
      'Component origin tracking',
      'Provenance verification records',
      'Chain of custody documentation',
      'Provenance audit records',
    ],
    testProcedures: [
      'Review provenance requirements',
      'Verify origin tracking',
      'Examine verification records',
      'Review chain of custody',
      'Verify audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-26',
    name: 'Supplier Diversity',
    description:
      'FedRAMP requires organizations to employ a diverse set of sources for information system components to reduce supply chain risk.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Identify opportunities for supplier diversity. Implement multiple source strategies for critical components. Document supplier diversity decisions. Monitor supplier performance.',
    evidenceRequirements: [
      'Supplier diversity analysis',
      'Multiple source documentation',
      'Diversity decision documentation',
      'Supplier performance monitoring',
      'Critical component supplier records',
    ],
    testProcedures: [
      'Review supplier diversity analysis',
      'Verify multiple source strategies',
      'Examine diversity decisions',
      'Review supplier monitoring',
      'Verify critical component suppliers',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-27',
    name: 'Component Disposal',
    description:
      'FedRAMP requires organizations to dispose of information system components using approved methods to prevent unauthorized access to data.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Implement component disposal procedures. Sanitize components before disposal. Use approved disposal methods. Document all disposal activities.',
    evidenceRequirements: [
      'Component disposal procedures',
      'Sanitization before disposal records',
      'Approved disposal method documentation',
      'Disposal activity records',
      'Certificates of destruction',
    ],
    testProcedures: [
      'Review disposal procedures',
      'Verify sanitization before disposal',
      'Examine approved methods',
      'Review disposal records',
      'Verify certificates of destruction',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // SYSTEM AND COMMUNICATIONS PROTECTION (SC) - 50 Controls
  // ============================================================
  {
    controlId: 'FR-SC-1',
    name: 'System and Communications Protection Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a system and communications protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Develop system and communications protection policy covering network security, boundary protection, and encryption requirements. Define roles for communications security. Ensure policy addresses FedRAMP encryption and boundary requirements.',
    evidenceRequirements: [
      'System and communications protection policy',
      'Communications security procedures',
      'Policy approval and review records',
      'Role definitions for communications security',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify communications protection policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test communications protection implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-2',
    name: 'Application Partitioning',
    description:
      'FedRAMP requires the information system to separate user functionality including user interface services from information system management functionality.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement separation between user-facing and management interfaces. Use separate network segments for management functions. Restrict management interface access. Document partitioning architecture.',
    evidenceRequirements: [
      'Application partitioning architecture',
      'Network segmentation documentation',
      'Management interface access controls',
      'Partitioning implementation records',
      'Security validation of partitioning',
    ],
    testProcedures: [
      'Review partitioning architecture',
      'Verify network segmentation',
      'Test management interface access controls',
      'Confirm partitioning implementation',
      'Validate security of partitioning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-3',
    name: 'Security Function Isolation',
    description:
      'FedRAMP requires the information system to isolate security functions from nonsecurity functions.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement security function isolation through virtualization, containers, or dedicated hardware. Protect security functions from tampering. Monitor security function integrity.',
    evidenceRequirements: [
      'Security function isolation architecture',
      'Isolation implementation documentation',
      'Integrity protection mechanisms',
      'Security function monitoring',
      'Isolation validation records',
    ],
    testProcedures: [
      'Review isolation architecture',
      'Verify isolation implementation',
      'Test integrity protection',
      'Review security function monitoring',
      'Validate isolation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-4',
    name: 'Information in Shared Resources',
    description:
      'FedRAMP requires the information system to prevent unauthorized and unintended information transfer via shared system resources.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement controls to prevent data leakage through shared resources. Clear memory and storage between processes. Control access to shared resources. Monitor for unauthorized information transfer.',
    evidenceRequirements: [
      'Shared resource protection mechanisms',
      'Memory and storage clearing procedures',
      'Shared resource access controls',
      'Information transfer monitoring',
      'Shared resource security testing',
    ],
    testProcedures: [
      'Review shared resource protections',
      'Verify memory clearing between processes',
      'Test access controls',
      'Review transfer monitoring',
      'Conduct security testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-5',
    name: 'Denial of Service Protection',
    description:
      'FedRAMP requires the information system to protect against or limit the effects of denial of service attacks.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement DDoS protection mechanisms. Use rate limiting and traffic filtering. Deploy redundant resources for critical services. Monitor for DoS conditions.',
    evidenceRequirements: [
      'DDoS protection implementation',
      'Rate limiting configurations',
      'Redundancy implementation',
      'DoS monitoring capabilities',
      'DoS incident response procedures',
    ],
    testProcedures: [
      'Verify DDoS protection implementation',
      'Test rate limiting effectiveness',
      'Review redundancy implementation',
      'Test DoS monitoring',
      'Review incident response procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-6',
    name: 'Resource Availability',
    description:
      'FedRAMP requires the information system to protect the availability of resources by allocating sufficient capacity.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement resource allocation and capacity management. Monitor resource utilization. Configure resource limits per user or process. Plan for peak demand.',
    evidenceRequirements: [
      'Resource allocation procedures',
      'Capacity management documentation',
      'Resource monitoring implementation',
      'Resource limits configuration',
      'Capacity planning documentation',
    ],
    testProcedures: [
      'Review resource allocation',
      'Verify capacity management',
      'Test resource monitoring',
      'Verify resource limits',
      'Review capacity planning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7',
    name: 'Boundary Protection',
    description:
      'FedRAMP requires the information system to monitor and control communications at the external boundary and at key internal boundaries within the system.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement firewalls and boundary controls. Monitor traffic at boundaries. Deny by default, allow by exception. Document boundary architecture and traffic flows.',
    evidenceRequirements: [
      'Boundary protection architecture',
      'Firewall rule documentation',
      'Boundary monitoring implementation',
      'Deny-by-default configuration',
      'Traffic flow documentation',
    ],
    testProcedures: [
      'Review boundary architecture',
      'Verify firewall configurations',
      'Test boundary monitoring',
      'Confirm deny-by-default rules',
      'Review traffic flows',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-8',
    name: 'Transmission Confidentiality and Integrity',
    description:
      'FedRAMP requires the information system to protect the confidentiality and integrity of transmitted information using cryptographic mechanisms.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement encryption for data in transit. Use TLS 1.2 or higher for web traffic. Use FIPS-validated cryptographic modules. Verify certificate validity.',
    evidenceRequirements: [
      'Encryption implementation for transmission',
      'TLS configuration documentation',
      'FIPS validation certificates',
      'Certificate management procedures',
      'Transmission security testing',
    ],
    testProcedures: [
      'Verify encryption implementation',
      'Test TLS configurations',
      'Confirm FIPS validation',
      'Review certificate management',
      'Conduct transmission security testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-10',
    name: 'Network Disconnect',
    description:
      'FedRAMP requires the information system to terminate the network connection associated with a communications session at the end of the session or after a period of inactivity.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Configure session timeouts for network connections. Implement automatic session termination. Monitor for inactive sessions. Document timeout configurations.',
    evidenceRequirements: [
      'Session timeout configurations',
      'Automatic termination implementation',
      'Inactive session monitoring',
      'Timeout documentation',
      'Session management testing',
    ],
    testProcedures: [
      'Verify session timeout configurations',
      'Test automatic termination',
      'Review inactive session monitoring',
      'Examine timeout documentation',
      'Test session management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-12',
    name: 'Cryptographic Key Establishment and Management',
    description:
      'FedRAMP requires the information system to establish and manage cryptographic keys using FIPS-validated key management technology and processes.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement FIPS-validated key management. Define key lifecycle procedures. Protect keys from unauthorized access. Implement key rotation and revocation procedures.',
    evidenceRequirements: [
      'Key management procedures',
      'FIPS validation for key management',
      'Key lifecycle documentation',
      'Key protection mechanisms',
      'Key rotation and revocation records',
    ],
    testProcedures: [
      'Review key management procedures',
      'Verify FIPS validation',
      'Examine key lifecycle documentation',
      'Test key protection',
      'Verify rotation and revocation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-13',
    name: 'Cryptographic Protection',
    description:
      'FedRAMP requires the information system to implement FIPS-validated cryptography in accordance with applicable laws, Executive Orders, directives, policies, regulations, and standards.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Use FIPS 140-2 validated cryptographic modules. Implement approved algorithms only. Document cryptographic implementations. Verify cryptographic module validity.',
    evidenceRequirements: [
      'FIPS 140-2 validation certificates',
      'Cryptographic module inventory',
      'Algorithm documentation',
      'Implementation documentation',
      'Validation verification records',
    ],
    testProcedures: [
      'Verify FIPS 140-2 validation',
      'Review cryptographic module inventory',
      'Confirm approved algorithms only',
      'Review implementation documentation',
      'Verify validation currency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-15',
    name: 'Collaborative Computing Devices',
    description:
      'FedRAMP requires the information system to prohibit remote activation of collaborative computing devices and provide an explicit indication of use to users.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Disable remote activation of cameras and microphones. Implement physical or software indicators when devices are active. Control access to collaborative computing features.',
    evidenceRequirements: [
      'Remote activation prohibition implementation',
      'Use indicator implementation',
      'Collaborative device policies',
      'Access control for collaborative features',
      'Collaborative device testing',
    ],
    testProcedures: [
      'Verify remote activation disabled',
      'Test use indicators',
      'Review collaborative policies',
      'Test access controls',
      'Conduct collaborative device testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-17',
    name: 'Public Key Infrastructure Certificates',
    description:
      'FedRAMP requires the organization to issue public key certificates under an appropriate certificate policy or obtain certificates from an approved service provider.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Use certificates from approved CAs. Implement certificate validation. Manage certificate lifecycle. Monitor certificate expiration.',
    evidenceRequirements: [
      'Certificate authority documentation',
      'Certificate policy documentation',
      'Certificate validation implementation',
      'Certificate lifecycle management',
      'Expiration monitoring records',
    ],
    testProcedures: [
      'Verify approved CA usage',
      'Review certificate policy',
      'Test certificate validation',
      'Examine lifecycle management',
      'Verify expiration monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-18',
    name: 'Mobile Code',
    description:
      'FedRAMP requires the organization to define acceptable and unacceptable mobile code and mobile code technologies and establish usage restrictions and implementation guidance.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Define mobile code policies. Implement mobile code restrictions. Monitor mobile code execution. Block unauthorized mobile code.',
    evidenceRequirements: [
      'Mobile code policy documentation',
      'Acceptable mobile code technologies list',
      'Mobile code restrictions implementation',
      'Mobile code monitoring',
      'Unauthorized code blocking records',
    ],
    testProcedures: [
      'Review mobile code policies',
      'Verify acceptable technologies list',
      'Test mobile code restrictions',
      'Review monitoring implementation',
      'Test unauthorized code blocking',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-19',
    name: 'Voice over Internet Protocol',
    description:
      'FedRAMP requires the organization to establish usage restrictions and implementation guidance for Voice over Internet Protocol (VoIP) technologies.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Define VoIP security policies. Implement VoIP security controls. Encrypt VoIP traffic. Separate VoIP from data networks where feasible.',
    evidenceRequirements: [
      'VoIP security policy',
      'VoIP security controls implementation',
      'VoIP encryption documentation',
      'Network separation documentation',
      'VoIP security assessment',
    ],
    testProcedures: [
      'Review VoIP security policy',
      'Verify security controls',
      'Test VoIP encryption',
      'Review network separation',
      'Examine security assessment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-20',
    name: 'Secure Name/Address Resolution Service (Authoritative Source)',
    description:
      'FedRAMP requires the information system to provide additional data origin and integrity artifacts along with authoritative name resolution data the system returns in response to queries.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement DNSSEC for authoritative DNS servers. Sign DNS zones. Validate DNSSEC signatures. Monitor DNS integrity.',
    evidenceRequirements: [
      'DNSSEC implementation documentation',
      'Zone signing configuration',
      'Signature validation implementation',
      'DNS integrity monitoring',
      'DNSSEC testing records',
    ],
    testProcedures: [
      'Verify DNSSEC implementation',
      'Review zone signing',
      'Test signature validation',
      'Review integrity monitoring',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-21',
    name: 'Secure Name/Address Resolution Service (Recursive or Caching Resolver)',
    description:
      'FedRAMP requires the information system to request and perform data origin authentication and data integrity verification on the name/address resolution responses.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement DNSSEC validation on resolvers. Validate responses from authoritative servers. Configure trusted resolvers. Monitor DNS resolution security.',
    evidenceRequirements: [
      'DNSSEC validation configuration',
      'Resolver configuration documentation',
      'Trusted resolver list',
      'DNS security monitoring',
      'Validation testing records',
    ],
    testProcedures: [
      'Verify DNSSEC validation',
      'Review resolver configuration',
      'Confirm trusted resolvers',
      'Test security monitoring',
      'Review testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-22',
    name: 'Architecture and Provisioning for Name/Address Resolution Service',
    description:
      'FedRAMP requires the information systems that collectively provide name/address resolution service to be fault-tolerant and implement internal/external role separation.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement redundant DNS infrastructure. Separate internal and external DNS roles. Implement DNS failover. Monitor DNS availability.',
    evidenceRequirements: [
      'DNS architecture documentation',
      'Redundancy implementation',
      'Role separation documentation',
      'Failover configuration',
      'Availability monitoring records',
    ],
    testProcedures: [
      'Review DNS architecture',
      'Verify redundancy',
      'Test role separation',
      'Test failover mechanisms',
      'Review availability monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-23',
    name: 'Session Authenticity',
    description:
      'FedRAMP requires the information system to protect the authenticity of communications sessions.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement session authentication mechanisms. Use secure session tokens. Protect against session hijacking. Monitor session integrity.',
    evidenceRequirements: [
      'Session authentication implementation',
      'Session token security documentation',
      'Hijacking protection mechanisms',
      'Session integrity monitoring',
      'Session security testing',
    ],
    testProcedures: [
      'Review session authentication',
      'Verify token security',
      'Test hijacking protection',
      'Review integrity monitoring',
      'Conduct security testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-24',
    name: 'Fail in Known State',
    description:
      'FedRAMP requires the information system to fail to a known secure state for defined types of failures.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Define failure modes and secure states. Implement fail-secure mechanisms. Test failure scenarios. Document recovery procedures.',
    evidenceRequirements: [
      'Failure mode documentation',
      'Secure state definitions',
      'Fail-secure implementation',
      'Failure scenario testing',
      'Recovery procedure documentation',
    ],
    testProcedures: [
      'Review failure mode documentation',
      'Verify secure state definitions',
      'Test fail-secure mechanisms',
      'Conduct failure scenario testing',
      'Review recovery procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-25',
    name: 'Thin Nodes',
    description:
      'FedRAMP requires the organization to employ thin nodes for information processing, storage, or transmission.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement thin client architecture where appropriate. Minimize local data storage. Centralize processing on secured servers. Monitor thin node security.',
    evidenceRequirements: [
      'Thin node architecture documentation',
      'Local storage restrictions',
      'Centralized processing documentation',
      'Thin node security monitoring',
      'Thin node inventory',
    ],
    testProcedures: [
      'Review thin node architecture',
      'Verify storage restrictions',
      'Examine centralized processing',
      'Test security monitoring',
      'Verify inventory',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-26',
    name: 'Honeypots',
    description:
      'FedRAMP requires the organization to employ honeypots to detect and monitor potential attacks.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Deploy honeypots to detect unauthorized access attempts. Monitor honeypot activity. Integrate with security monitoring. Document honeypot placement.',
    evidenceRequirements: [
      'Honeypot deployment documentation',
      'Honeypot monitoring records',
      'Security monitoring integration',
      'Placement documentation',
      'Attack detection records',
    ],
    testProcedures: [
      'Review honeypot deployment',
      'Verify monitoring capabilities',
      'Test integration with security tools',
      'Review placement rationale',
      'Examine detection records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-27',
    name: 'Platform-Independent Applications',
    description:
      'FedRAMP requires the organization to employ platform-independent applications to maximize interoperability.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Use platform-independent technologies where feasible. Document platform dependencies. Test cross-platform compatibility. Plan for platform independence.',
    evidenceRequirements: [
      'Platform independence documentation',
      'Platform dependency inventory',
      'Cross-platform testing records',
      'Independence planning documentation',
      'Interoperability assessment',
    ],
    testProcedures: [
      'Review platform independence',
      'Verify dependency inventory',
      'Examine testing records',
      'Review planning documentation',
      'Assess interoperability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-28',
    name: 'Protection of Information at Rest',
    description:
      'FedRAMP requires the information system to protect the confidentiality and integrity of information at rest using cryptographic mechanisms.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement encryption for data at rest. Use FIPS-validated cryptographic modules. Protect encryption keys. Document encryption implementation.',
    evidenceRequirements: [
      'Data at rest encryption implementation',
      'FIPS validation documentation',
      'Key protection mechanisms',
      'Encryption implementation documentation',
      'Encryption testing records',
    ],
    testProcedures: [
      'Verify encryption implementation',
      'Confirm FIPS validation',
      'Test key protection',
      'Review implementation documentation',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-29',
    name: 'Heterogeneity',
    description:
      'FedRAMP requires the organization to employ a diverse set of information technologies to reduce the risk of exploitation.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement technology diversity where feasible. Avoid single-vendor dependencies for critical functions. Document diversity decisions. Monitor for common vulnerability impacts.',
    evidenceRequirements: [
      'Technology diversity documentation',
      'Vendor diversity analysis',
      'Diversity decision records',
      'Common vulnerability monitoring',
      'Diversity implementation verification',
    ],
    testProcedures: [
      'Review technology diversity',
      'Verify vendor diversity',
      'Examine diversity decisions',
      'Review vulnerability monitoring',
      'Verify diversity implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-30',
    name: 'Concealment and Misdirection',
    description:
      'FedRAMP requires the organization to employ concealment and misdirection techniques to hide critical system components.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement techniques to obscure system topology. Use network address translation. Implement deceptive elements. Monitor for reconnaissance attempts.',
    evidenceRequirements: [
      'Concealment techniques documentation',
      'NAT implementation documentation',
      'Deceptive element deployment',
      'Reconnaissance monitoring',
      'Technique effectiveness assessment',
    ],
    testProcedures: [
      'Review concealment techniques',
      'Verify NAT implementation',
      'Examine deceptive elements',
      'Test reconnaissance detection',
      'Assess technique effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-31',
    name: 'Covert Channel Analysis',
    description:
      'FedRAMP requires the organization to perform a covert channel analysis to identify those aspects of communications within the system that are potential avenues for covert storage or timing channels.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Conduct covert channel analysis. Identify potential storage and timing channels. Implement mitigations for identified channels. Document analysis results.',
    evidenceRequirements: [
      'Covert channel analysis documentation',
      'Storage channel identification',
      'Timing channel identification',
      'Mitigation implementation records',
      'Analysis update records',
    ],
    testProcedures: [
      'Review covert channel analysis',
      'Verify storage channel identification',
      'Verify timing channel identification',
      'Examine mitigation implementation',
      'Confirm analysis updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-32',
    name: 'Information System Partitioning',
    description:
      'FedRAMP requires the organization to partition the information system into components residing in separate physical or logical domains.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement system partitioning based on data sensitivity. Use network segmentation. Implement logical separation where physical separation is not feasible. Document partitioning architecture.',
    evidenceRequirements: [
      'Partitioning architecture documentation',
      'Network segmentation implementation',
      'Logical separation documentation',
      'Partitioning rationale',
      'Partitioning validation records',
    ],
    testProcedures: [
      'Review partitioning architecture',
      'Verify network segmentation',
      'Test logical separation',
      'Review partitioning rationale',
      'Validate partitioning effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-34',
    name: 'Non-Modifiable Executable Programs',
    description:
      'FedRAMP requires the information system to load and execute the operating environment from hardware-enforced, read-only media.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Use read-only boot media where appropriate. Implement secure boot processes. Verify executable integrity. Monitor for unauthorized modifications.',
    evidenceRequirements: [
      'Read-only boot media implementation',
      'Secure boot configuration',
      'Executable integrity verification',
      'Modification monitoring',
      'Implementation documentation',
    ],
    testProcedures: [
      'Verify read-only boot media',
      'Test secure boot',
      'Verify executable integrity',
      'Test modification detection',
      'Review implementation documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-35',
    name: 'Honeyclients',
    description:
      'FedRAMP requires the organization to employ honeyclients to detect malicious content.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Deploy honeyclients to detect malicious web content. Monitor honeyclient activity. Integrate with threat intelligence. Document findings.',
    evidenceRequirements: [
      'Honeyclient deployment documentation',
      'Activity monitoring records',
      'Threat intelligence integration',
      'Finding documentation',
      'Honeyclient configuration',
    ],
    testProcedures: [
      'Review honeyclient deployment',
      'Verify activity monitoring',
      'Test threat intelligence integration',
      'Examine findings documentation',
      'Review configuration',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-36',
    name: 'Distributed Processing and Storage',
    description:
      'FedRAMP requires the organization to distribute processing and storage across multiple physical locations.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement distributed processing and storage. Document distribution architecture. Ensure consistent security controls across locations. Monitor distributed resources.',
    evidenceRequirements: [
      'Distribution architecture documentation',
      'Physical location documentation',
      'Security control consistency verification',
      'Distributed resource monitoring',
      'Distribution effectiveness assessment',
    ],
    testProcedures: [
      'Review distribution architecture',
      'Verify physical locations',
      'Confirm security control consistency',
      'Test resource monitoring',
      'Assess distribution effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-37',
    name: 'Out-of-Band Channels',
    description:
      'FedRAMP requires the organization to employ out-of-band channels for the physical delivery or electronic transmission of critical information.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement out-of-band channels for critical communications. Document channel usage procedures. Protect out-of-band channels. Test channel availability.',
    evidenceRequirements: [
      'Out-of-band channel documentation',
      'Channel usage procedures',
      'Channel protection mechanisms',
      'Availability testing records',
      'Critical communication protocols',
    ],
    testProcedures: [
      'Review out-of-band channels',
      'Verify usage procedures',
      'Test channel protection',
      'Verify availability',
      'Review communication protocols',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-38',
    name: 'Operations Security',
    description:
      'FedRAMP requires the organization to employ operations security safeguards to protect key organizational information throughout the system development life cycle.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement OPSEC procedures. Identify critical information. Assess threats and vulnerabilities to critical information. Apply countermeasures.',
    evidenceRequirements: [
      'OPSEC procedures documentation',
      'Critical information identification',
      'Threat and vulnerability assessment',
      'Countermeasure implementation',
      'OPSEC effectiveness assessment',
    ],
    testProcedures: [
      'Review OPSEC procedures',
      'Verify critical information identification',
      'Examine threat assessment',
      'Review countermeasures',
      'Assess OPSEC effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-39',
    name: 'Process Isolation',
    description:
      'FedRAMP requires the information system to maintain a separate execution domain for each executing process.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement process isolation mechanisms. Use operating system controls for process separation. Monitor for process isolation violations. Document isolation implementation.',
    evidenceRequirements: [
      'Process isolation implementation',
      'Operating system configuration',
      'Isolation violation monitoring',
      'Implementation documentation',
      'Isolation testing records',
    ],
    testProcedures: [
      'Verify process isolation',
      'Review OS configuration',
      'Test violation detection',
      'Review implementation documentation',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-40',
    name: 'Wireless Link Protection',
    description:
      'FedRAMP requires the information system to protect external and internal wireless links from signal parameter attacks.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement wireless security controls. Use encrypted wireless protocols. Monitor for rogue wireless devices. Protect against wireless attacks.',
    evidenceRequirements: [
      'Wireless security implementation',
      'Encryption protocol documentation',
      'Rogue device monitoring',
      'Attack protection mechanisms',
      'Wireless security assessment',
    ],
    testProcedures: [
      'Review wireless security',
      'Verify encryption protocols',
      'Test rogue device detection',
      'Examine attack protection',
      'Conduct wireless assessment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-41',
    name: 'Port and I/O Device Access',
    description:
      'FedRAMP requires the information system to restrict the use of ports, I/O devices, and storage devices.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement port and device access restrictions. Disable unused ports. Control removable media access. Monitor device connections.',
    evidenceRequirements: [
      'Port restriction configuration',
      'Unused port disabling records',
      'Removable media controls',
      'Device connection monitoring',
      'Access restriction documentation',
    ],
    testProcedures: [
      'Verify port restrictions',
      'Test unused port disabling',
      'Review removable media controls',
      'Test device monitoring',
      'Review restriction documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-42',
    name: 'Sensor Capability and Data',
    description:
      'FedRAMP requires the organization to prohibit the use of devices possessing sensor capability in facilities containing sensitive systems.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Identify devices with sensor capabilities. Restrict sensor-equipped devices in sensitive areas. Implement sensor data protection. Monitor for unauthorized sensors.',
    evidenceRequirements: [
      'Sensor device identification',
      'Restriction policies',
      'Sensor data protection implementation',
      'Unauthorized sensor monitoring',
      'Sensor device inventory',
    ],
    testProcedures: [
      'Review sensor device identification',
      'Verify restriction enforcement',
      'Test sensor data protection',
      'Test unauthorized sensor detection',
      'Review device inventory',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-43',
    name: 'Usage Restrictions',
    description:
      'FedRAMP requires the organization to establish usage restrictions and implementation guidance for specific information system components.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Define usage restrictions for sensitive components. Document implementation guidance. Enforce restrictions through technical controls. Monitor compliance.',
    evidenceRequirements: [
      'Usage restriction documentation',
      'Implementation guidance',
      'Technical control enforcement',
      'Compliance monitoring records',
      'Restriction update records',
    ],
    testProcedures: [
      'Review usage restrictions',
      'Examine implementation guidance',
      'Test technical controls',
      'Review compliance monitoring',
      'Verify restriction updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-44',
    name: 'Detonation Chambers',
    description:
      'FedRAMP requires the organization to employ detonation chambers to detect malicious content.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement malware detonation sandbox environments. Analyze suspicious files in isolated environments. Monitor detonation results. Integrate with threat detection.',
    evidenceRequirements: [
      'Detonation chamber implementation',
      'Sandbox environment documentation',
      'Analysis procedure documentation',
      'Result monitoring records',
      'Threat detection integration',
    ],
    testProcedures: [
      'Verify detonation chambers',
      'Review sandbox environments',
      'Examine analysis procedures',
      'Review monitoring results',
      'Test threat detection integration',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-45',
    name: 'System Time Synchronization',
    description:
      'FedRAMP requires the information system to synchronize internal system clocks with an authoritative time source.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Configure NTP/PTP time synchronization. Use authoritative time sources. Monitor time synchronization status. Protect time synchronization communications.',
    evidenceRequirements: [
      'Time synchronization configuration',
      'Authoritative time source documentation',
      'Synchronization monitoring records',
      'Communication protection implementation',
      'Time synchronization testing',
    ],
    testProcedures: [
      'Verify time synchronization configuration',
      'Confirm authoritative time sources',
      'Review synchronization monitoring',
      'Test communication protection',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-46',
    name: 'Cross Domain Policy Enforcement',
    description:
      'FedRAMP requires the information system to enforce information flow control policies for communications between security domains.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement cross-domain information flow controls. Define authorized information flows. Monitor cross-domain transfers. Document policy enforcement.',
    evidenceRequirements: [
      'Cross-domain policy documentation',
      'Information flow controls implementation',
      'Authorized flow documentation',
      'Transfer monitoring records',
      'Policy enforcement verification',
    ],
    testProcedures: [
      'Review cross-domain policies',
      'Verify information flow controls',
      'Confirm authorized flows',
      'Test transfer monitoring',
      'Verify policy enforcement',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-47',
    name: 'Alternate Communications Paths',
    description:
      'FedRAMP requires the organization to establish alternate communications paths for system operations organizational command and control.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Establish alternate communication paths. Document alternate path procedures. Test alternate path availability. Integrate with contingency planning.',
    evidenceRequirements: [
      'Alternate path documentation',
      'Path usage procedures',
      'Availability testing records',
      'Contingency plan integration',
      'Alternate path maintenance records',
    ],
    testProcedures: [
      'Review alternate paths',
      'Verify usage procedures',
      'Test path availability',
      'Confirm contingency integration',
      'Review maintenance records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-48',
    name: 'Sensor Relocation',
    description:
      'FedRAMP requires the organization to relocate sensors for security monitoring to reduce the probability of detection by adversaries.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement sensor relocation strategy. Vary sensor placement periodically. Document relocation procedures. Monitor sensor effectiveness.',
    evidenceRequirements: [
      'Sensor relocation strategy',
      'Placement variation records',
      'Relocation procedures',
      'Effectiveness monitoring',
      'Sensor inventory management',
    ],
    testProcedures: [
      'Review relocation strategy',
      'Verify placement variation',
      'Examine relocation procedures',
      'Review effectiveness monitoring',
      'Verify inventory management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-49',
    name: 'Hardware-Enforced Separation and Policy Enforcement',
    description:
      'FedRAMP requires the information system to enforce security policy through hardware mechanisms.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement hardware-based security controls. Use hardware security modules. Enforce separation through hardware. Document hardware security implementation.',
    evidenceRequirements: [
      'Hardware security implementation',
      'HSM deployment documentation',
      'Hardware separation implementation',
      'Implementation documentation',
      'Hardware security testing',
    ],
    testProcedures: [
      'Review hardware security',
      'Verify HSM deployment',
      'Test hardware separation',
      'Review implementation documentation',
      'Examine security testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-50',
    name: 'Software-Enforced Separation and Policy Enforcement',
    description:
      'FedRAMP requires the information system to enforce security policy through software mechanisms.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement software-based security controls. Use virtualization and containerization. Enforce separation through software. Document software security implementation.',
    evidenceRequirements: [
      'Software security implementation',
      'Virtualization documentation',
      'Containerization documentation',
      'Software separation implementation',
      'Software security testing',
    ],
    testProcedures: [
      'Review software security',
      'Verify virtualization',
      'Test containerization',
      'Verify software separation',
      'Examine security testing',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // SYSTEM AND INFORMATION INTEGRITY (SI) - 25 Controls
  // ============================================================
  {
    controlId: 'FR-SI-1',
    name: 'System and Information Integrity Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a system and information integrity policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Develop system and information integrity policy covering malware protection, flaw remediation, and security monitoring. Define roles for integrity management. Ensure policy addresses FedRAMP continuous monitoring requirements.',
    evidenceRequirements: [
      'System and information integrity policy',
      'Integrity procedures documentation',
      'Policy approval and review records',
      'Role definitions for integrity management',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Verify integrity policy exists',
      'Review policy for completeness',
      'Confirm policy approval and dissemination',
      'Verify procedures align with policy',
      'Test integrity management implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-2',
    name: 'Flaw Remediation',
    description:
      'FedRAMP requires organizations to identify, report, and correct information system flaws. High vulnerabilities must be remediated within 30 days, moderate within 90 days, and low within 180 days per FedRAMP requirements.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement vulnerability management program. Track identified flaws from discovery through remediation. Apply patches within FedRAMP timelines. Document remediation activities and exceptions.',
    evidenceRequirements: [
      'Vulnerability management procedures',
      'Flaw tracking records',
      'Patch management records',
      'Remediation timeline compliance records',
      'Exception documentation for deferred remediation',
    ],
    testProcedures: [
      'Review vulnerability management procedures',
      'Verify flaw tracking process',
      'Examine patch management records',
      'Confirm remediation timeline compliance',
      'Review exception documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-3',
    name: 'Malicious Code Protection',
    description:
      'FedRAMP requires organizations to employ malicious code protection mechanisms at information system entry and exit points and at workstations, servers, or mobile computing devices to detect and eradicate malicious code.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Deploy antimalware solutions on all endpoints and servers. Implement email and web filtering. Update malware signatures automatically. Configure real-time scanning and scheduled full scans.',
    evidenceRequirements: [
      'Antimalware deployment documentation',
      'Email and web filtering implementation',
      'Signature update configuration',
      'Scanning configuration documentation',
      'Malware incident records',
    ],
    testProcedures: [
      'Verify antimalware deployment',
      'Test email and web filtering',
      'Confirm automatic signature updates',
      'Review scanning configurations',
      'Examine malware incident handling',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-4',
    name: 'Information System Monitoring',
    description:
      'FedRAMP requires organizations to monitor the information system to detect attacks and indicators of potential attacks, unauthorized connections, and unauthorized use of the system.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement comprehensive security monitoring. Deploy IDS/IPS, SIEM, and log analysis tools. Monitor for anomalous behavior. Configure alerts for security events.',
    evidenceRequirements: [
      'Security monitoring architecture',
      'IDS/IPS deployment documentation',
      'SIEM implementation records',
      'Alert configuration documentation',
      'Monitoring effectiveness assessment',
    ],
    testProcedures: [
      'Review monitoring architecture',
      'Verify IDS/IPS deployment',
      'Test SIEM functionality',
      'Verify alert configurations',
      'Assess monitoring effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-5',
    name: 'Security Alerts, Advisories, and Directives',
    description:
      'FedRAMP requires organizations to receive information system security alerts, advisories, and directives from external organizations on an ongoing basis and take appropriate actions in response.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Subscribe to security alert sources including US-CERT, vendor alerts, and industry sources. Assess applicability of alerts to the environment. Take timely action on applicable alerts.',
    evidenceRequirements: [
      'Security alert subscription records',
      'Alert assessment procedures',
      'Alert response records',
      'Response timeline documentation',
      'Alert tracking system',
    ],
    testProcedures: [
      'Verify alert subscriptions',
      'Review assessment procedures',
      'Examine response records',
      'Confirm response timeliness',
      'Review tracking system',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-6',
    name: 'Security Function Verification',
    description:
      'FedRAMP requires the information system to verify the correct operation of security functions upon system startup, restart, and upon command by user with appropriate privilege.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement security function verification at startup. Enable administrator-initiated verification. Log verification results. Alert on verification failures.',
    evidenceRequirements: [
      'Security function verification implementation',
      'Startup verification records',
      'Administrator verification capability',
      'Verification logging configuration',
      'Failure alerting implementation',
    ],
    testProcedures: [
      'Verify startup verification',
      'Test administrator verification capability',
      'Review verification logs',
      'Test failure alerting',
      'Examine verification effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-7',
    name: 'Software, Firmware, and Information Integrity',
    description:
      'FedRAMP requires organizations to employ integrity verification tools to detect unauthorized changes to software, firmware, and information.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement file integrity monitoring. Monitor critical system files, configurations, and firmware. Alert on unauthorized changes. Investigate and respond to integrity violations.',
    evidenceRequirements: [
      'File integrity monitoring implementation',
      'Monitored file/configuration list',
      'Alert configuration for changes',
      'Integrity violation investigation records',
      'Response procedures for violations',
    ],
    testProcedures: [
      'Verify FIM implementation',
      'Review monitored file list',
      'Test change alerting',
      'Examine investigation records',
      'Review response procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-8',
    name: 'Spam Protection',
    description:
      'FedRAMP requires organizations to employ spam protection mechanisms at information system entry points and at workstations, servers, or mobile computing devices.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement spam filtering at email gateways. Configure spam filters on endpoints. Update spam signatures regularly. Monitor spam filtering effectiveness.',
    evidenceRequirements: [
      'Spam filtering implementation',
      'Gateway spam protection documentation',
      'Endpoint spam filtering configuration',
      'Signature update records',
      'Spam filtering effectiveness metrics',
    ],
    testProcedures: [
      'Verify spam filtering implementation',
      'Test gateway spam protection',
      'Review endpoint configurations',
      'Confirm signature updates',
      'Assess filtering effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-10',
    name: 'Information Input Validation',
    description:
      'FedRAMP requires the information system to check the validity of information inputs.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement input validation for all user inputs. Validate data types, lengths, and formats. Sanitize inputs to prevent injection attacks. Log input validation failures.',
    evidenceRequirements: [
      'Input validation implementation documentation',
      'Validation rules documentation',
      'Sanitization procedures',
      'Validation failure logging',
      'Input validation testing records',
    ],
    testProcedures: [
      'Review input validation implementation',
      'Test validation rules',
      'Verify sanitization effectiveness',
      'Examine validation failure logs',
      'Conduct input validation testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-11',
    name: 'Error Handling',
    description:
      'FedRAMP requires the information system to generate error messages that provide information necessary for corrective actions without revealing information that could be exploited by adversaries.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement secure error handling. Generate user-friendly error messages. Log detailed errors for administrators only. Prevent information disclosure in error messages.',
    evidenceRequirements: [
      'Error handling implementation',
      'Error message standards',
      'Error logging configuration',
      'Information disclosure prevention',
      'Error handling testing records',
    ],
    testProcedures: [
      'Review error handling implementation',
      'Test error messages for information disclosure',
      'Verify error logging',
      'Confirm information protection',
      'Conduct error handling testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-12',
    name: 'Information Handling and Retention',
    description:
      'FedRAMP requires organizations to handle and retain information within the system and information output from the system in accordance with applicable laws, Executive Orders, directives, policies, regulations, standards, and operational requirements.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement data handling procedures. Define retention requirements for different data types. Implement secure disposal of expired data. Document handling and retention practices.',
    evidenceRequirements: [
      'Data handling procedures',
      'Retention requirements documentation',
      'Data disposal procedures',
      'Handling compliance records',
      'Retention compliance records',
    ],
    testProcedures: [
      'Review data handling procedures',
      'Verify retention requirements',
      'Test data disposal procedures',
      'Examine handling compliance',
      'Review retention compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-13',
    name: 'Predictable Failure Prevention',
    description:
      'FedRAMP requires organizations to protect the information system from predictable failures by implementing mechanisms to detect and prevent failures.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement predictive failure monitoring. Monitor system health indicators. Replace components before failure. Document failure prevention activities.',
    evidenceRequirements: [
      'Predictive monitoring implementation',
      'Health indicator monitoring',
      'Component replacement records',
      'Failure prevention procedures',
      'Failure incident records',
    ],
    testProcedures: [
      'Verify predictive monitoring',
      'Review health indicators',
      'Examine replacement records',
      'Review prevention procedures',
      'Analyze failure incidents',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-14',
    name: 'Non-Persistence',
    description:
      'FedRAMP requires the organization to implement non-persistent system components that are initiated in a known state and terminated after a time period of inactivity.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement non-persistent components where appropriate. Use stateless architectures. Reset systems to known states periodically. Document non-persistence implementation.',
    evidenceRequirements: [
      'Non-persistence implementation documentation',
      'Stateless architecture documentation',
      'Reset procedures and schedules',
      'Known state definitions',
      'Non-persistence testing records',
    ],
    testProcedures: [
      'Review non-persistence implementation',
      'Verify stateless architectures',
      'Test reset procedures',
      'Confirm known state definitions',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-15',
    name: 'Information Output Filtering',
    description:
      'FedRAMP requires the information system to validate information output from applications to ensure that the information is consistent with expected content.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement output validation and filtering. Verify output data against expected formats. Filter sensitive information from outputs. Log output validation failures.',
    evidenceRequirements: [
      'Output filtering implementation',
      'Output validation rules',
      'Sensitive data filtering configuration',
      'Output validation logging',
      'Output filtering testing records',
    ],
    testProcedures: [
      'Verify output filtering implementation',
      'Test validation rules',
      'Confirm sensitive data filtering',
      'Review validation logs',
      'Conduct output filtering testing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-16',
    name: 'Memory Protection',
    description:
      'FedRAMP requires the information system to implement memory protection mechanisms to protect its memory from unauthorized code execution.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Enable DEP/NX bit protections. Implement ASLR where available. Use memory-safe programming practices. Monitor for memory exploitation attempts.',
    evidenceRequirements: [
      'Memory protection implementation',
      'DEP/NX configuration documentation',
      'ASLR implementation records',
      'Memory exploitation monitoring',
      'Memory protection testing records',
    ],
    testProcedures: [
      'Verify memory protection implementation',
      'Test DEP/NX configurations',
      'Confirm ASLR implementation',
      'Review exploitation monitoring',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-17',
    name: 'Fail-Safe Procedures',
    description:
      'FedRAMP requires organizations to implement fail-safe procedures when anomalies are discovered.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Define fail-safe procedures for different anomaly types. Implement automatic fail-safe mechanisms where possible. Test fail-safe procedures. Document fail-safe activation.',
    evidenceRequirements: [
      'Fail-safe procedure documentation',
      'Automatic fail-safe implementation',
      'Fail-safe testing records',
      'Activation records',
      'Recovery procedures',
    ],
    testProcedures: [
      'Review fail-safe procedures',
      'Test automatic mechanisms',
      'Examine testing records',
      'Review activation records',
      'Verify recovery procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-18',
    name: 'Personally Identifiable Information Quality Operations',
    description:
      'FedRAMP requires organizations to check the accuracy, relevance, timeliness, and completeness of personally identifiable information processed by the system.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement PII quality controls. Verify PII accuracy at collection. Enable user correction of PII. Review PII quality periodically.',
    evidenceRequirements: [
      'PII quality control procedures',
      'Accuracy verification implementation',
      'User correction capabilities',
      'Quality review records',
      'PII quality metrics',
    ],
    testProcedures: [
      'Review PII quality procedures',
      'Test accuracy verification',
      'Verify user correction capability',
      'Examine quality review records',
      'Assess PII quality metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-19',
    name: 'De-Identification',
    description:
      'FedRAMP requires organizations to remove personally identifiable information from datasets to reduce the risk of privacy violations.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement de-identification procedures. Use appropriate techniques (anonymization, pseudonymization). Verify de-identification effectiveness. Document de-identification activities.',
    evidenceRequirements: [
      'De-identification procedures',
      'Technique selection documentation',
      'Effectiveness verification records',
      'Activity documentation',
      'Re-identification risk assessment',
    ],
    testProcedures: [
      'Review de-identification procedures',
      'Verify technique appropriateness',
      'Test effectiveness verification',
      'Examine activity documentation',
      'Review risk assessment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-20',
    name: 'Tainting',
    description:
      'FedRAMP requires organizations to embed data or capabilities in information system components for the purpose of tracking that information.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement data tainting capabilities for sensitive information. Track tainted data through system. Monitor for data exfiltration using taint tracking. Document tainting implementation.',
    evidenceRequirements: [
      'Data tainting implementation',
      'Taint tracking capabilities',
      'Exfiltration monitoring using taints',
      'Implementation documentation',
      'Tainting effectiveness assessment',
    ],
    testProcedures: [
      'Verify tainting implementation',
      'Test taint tracking',
      'Review exfiltration monitoring',
      'Examine implementation documentation',
      'Assess tainting effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-21',
    name: 'Information Refresh',
    description:
      'FedRAMP requires organizations to refresh information from authoritative sources at defined frequencies.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Identify authoritative data sources. Define refresh frequencies based on data criticality. Implement automated refresh mechanisms. Monitor refresh success.',
    evidenceRequirements: [
      'Authoritative source identification',
      'Refresh frequency documentation',
      'Automated refresh implementation',
      'Refresh monitoring records',
      'Refresh failure handling procedures',
    ],
    testProcedures: [
      'Verify authoritative sources',
      'Review refresh frequencies',
      'Test automated refresh',
      'Examine monitoring records',
      'Review failure handling',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-22',
    name: 'Information Diversity',
    description:
      'FedRAMP requires organizations to employ diverse information sources to ensure the accuracy of information.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Identify diverse information sources. Cross-validate information from multiple sources. Document source diversity decisions. Monitor source reliability.',
    evidenceRequirements: [
      'Information source inventory',
      'Cross-validation procedures',
      'Diversity decision documentation',
      'Source reliability monitoring',
      'Diversity effectiveness assessment',
    ],
    testProcedures: [
      'Review information sources',
      'Test cross-validation',
      'Examine diversity decisions',
      'Review reliability monitoring',
      'Assess diversity effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-23',
    name: 'Information Fragmentation',
    description:
      'FedRAMP requires organizations to fragment information to reduce the risk of unauthorized access to sensitive data.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement data fragmentation for sensitive information. Distribute fragments across systems. Implement secure fragment reconstruction. Document fragmentation implementation.',
    evidenceRequirements: [
      'Fragmentation implementation documentation',
      'Fragment distribution records',
      'Reconstruction procedures',
      'Security verification for reconstruction',
      'Fragmentation effectiveness assessment',
    ],
    testProcedures: [
      'Verify fragmentation implementation',
      'Review fragment distribution',
      'Test reconstruction procedures',
      'Verify reconstruction security',
      'Assess fragmentation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-24',
    name: 'Out-of-Band Verification',
    description:
      'FedRAMP requires organizations to verify critical information using an out-of-band communication channel.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement out-of-band verification for critical transactions. Define verification procedures. Protect out-of-band channels. Document verification activities.',
    evidenceRequirements: [
      'Out-of-band verification implementation',
      'Verification procedure documentation',
      'Channel protection measures',
      'Verification activity records',
      'Verification effectiveness assessment',
    ],
    testProcedures: [
      'Verify out-of-band implementation',
      'Review verification procedures',
      'Test channel protection',
      'Examine verification records',
      'Assess verification effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-25',
    name: 'Information Source Protection',
    description:
      'FedRAMP requires organizations to protect information sources from unauthorized access and modification.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement access controls for information sources. Protect source integrity. Monitor for unauthorized access to sources. Document source protection measures.',
    evidenceRequirements: [
      'Source access control implementation',
      'Source integrity protection',
      'Unauthorized access monitoring',
      'Protection measure documentation',
      'Source protection assessment',
    ],
    testProcedures: [
      'Verify source access controls',
      'Test integrity protection',
      'Review access monitoring',
      'Examine protection documentation',
      'Assess source protection',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PROGRAM MANAGEMENT (PM) - 20 Controls
  // ============================================================
  {
    controlId: 'FR-PM-1',
    name: 'Information Security Program Plan',
    description:
      'FedRAMP requires organizations to develop and disseminate an organization-wide information security program plan that provides an overview of the requirements for the security program.',
    category: 'Program Management',
    implementationGuidance:
      'Develop comprehensive information security program plan. Document program objectives, scope, and governance structure. Define security roles and responsibilities. Review and update plan annually.',
    evidenceRequirements: [
      'Information security program plan',
      'Program objectives documentation',
      'Governance structure documentation',
      'Role and responsibility definitions',
      'Annual review records',
    ],
    testProcedures: [
      'Review information security program plan',
      'Verify program objectives',
      'Examine governance structure',
      'Confirm roles and responsibilities',
      'Verify annual review',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-2',
    name: 'Senior Information Security Officer',
    description:
      'FedRAMP requires organizations to appoint a senior information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.',
    category: 'Program Management',
    implementationGuidance:
      'Appoint qualified senior information security officer. Define SISO responsibilities and authority. Allocate adequate resources. Establish reporting relationships.',
    evidenceRequirements: [
      'SISO appointment documentation',
      'SISO responsibilities documentation',
      'Resource allocation records',
      'Reporting relationship documentation',
      'SISO qualifications verification',
    ],
    testProcedures: [
      'Verify SISO appointment',
      'Review SISO responsibilities',
      'Confirm resource allocation',
      'Verify reporting relationships',
      'Confirm qualifications',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-3',
    name: 'Information Security Resources',
    description:
      'FedRAMP requires organizations to include resources for security in capital planning and investment requests and document all exceptions.',
    category: 'Program Management',
    implementationGuidance:
      'Include security in capital planning processes. Document security resource requirements. Track security investments. Document exceptions to security resource allocations.',
    evidenceRequirements: [
      'Capital planning security inclusion',
      'Security resource requirements',
      'Security investment tracking',
      'Exception documentation',
      'Budget allocation records',
    ],
    testProcedures: [
      'Review capital planning for security',
      'Verify resource requirements documented',
      'Examine investment tracking',
      'Review exception documentation',
      'Verify budget allocations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-4',
    name: 'Plan of Action and Milestones Process',
    description:
      'FedRAMP requires organizations to implement a process for ensuring that plans of action and milestones for the security program are maintained and documented.',
    category: 'Program Management',
    implementationGuidance:
      'Establish POA&M management process. Track all security weaknesses and deficiencies. Document remediation milestones. Report POA&M status to FedRAMP PMO monthly.',
    evidenceRequirements: [
      'POA&M management process documentation',
      'Weakness tracking records',
      'Milestone documentation',
      'Monthly status reports',
      'FedRAMP PMO submission records',
    ],
    testProcedures: [
      'Review POA&M process',
      'Verify weakness tracking',
      'Examine milestone documentation',
      'Review status reports',
      'Confirm PMO submissions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-5',
    name: 'Information System Inventory',
    description:
      'FedRAMP requires organizations to develop and maintain an inventory of organizational information systems.',
    category: 'Program Management',
    implementationGuidance:
      'Maintain comprehensive system inventory. Include all system components and boundaries. Update inventory when changes occur. Reconcile inventory periodically.',
    evidenceRequirements: [
      'Information system inventory',
      'Component documentation',
      'Boundary documentation',
      'Inventory update records',
      'Reconciliation records',
    ],
    testProcedures: [
      'Review system inventory',
      'Verify component documentation',
      'Examine boundary definitions',
      'Confirm inventory updates',
      'Review reconciliation records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-6',
    name: 'Information Security Measures of Performance',
    description:
      'FedRAMP requires organizations to develop, monitor, and report on the results of information security measures of performance.',
    category: 'Program Management',
    implementationGuidance:
      'Define security performance metrics. Implement metric collection and monitoring. Report metrics to management. Use metrics to improve security program.',
    evidenceRequirements: [
      'Security performance metrics definitions',
      'Metric collection procedures',
      'Monitoring implementation',
      'Management reports',
      'Improvement actions based on metrics',
    ],
    testProcedures: [
      'Review performance metrics',
      'Verify metric collection',
      'Examine monitoring implementation',
      'Review management reports',
      'Verify improvement actions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-7',
    name: 'Enterprise Architecture',
    description:
      'FedRAMP requires organizations to develop an enterprise architecture with consideration for information security.',
    category: 'Program Management',
    implementationGuidance:
      'Integrate security into enterprise architecture. Document security architecture decisions. Align system architectures with enterprise architecture. Review architecture periodically.',
    evidenceRequirements: [
      'Enterprise architecture documentation',
      'Security architecture integration',
      'Architecture decision records',
      'System alignment verification',
      'Architecture review records',
    ],
    testProcedures: [
      'Review enterprise architecture',
      'Verify security integration',
      'Examine architecture decisions',
      'Confirm system alignment',
      'Review periodic reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-8',
    name: 'Critical Infrastructure Plan',
    description:
      'FedRAMP requires organizations to address information security issues in the development, documentation, and updating of a critical infrastructure and key resources protection plan.',
    category: 'Program Management',
    implementationGuidance:
      'Develop critical infrastructure protection plan. Identify critical assets and dependencies. Define protection measures. Update plan when infrastructure changes.',
    evidenceRequirements: [
      'Critical infrastructure protection plan',
      'Critical asset identification',
      'Dependency documentation',
      'Protection measures documentation',
      'Plan update records',
    ],
    testProcedures: [
      'Review critical infrastructure plan',
      'Verify asset identification',
      'Examine dependencies',
      'Review protection measures',
      'Confirm plan updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-9',
    name: 'Risk Management Strategy',
    description:
      'FedRAMP requires organizations to develop a comprehensive strategy to manage risk to organizational operations, assets, individuals, and other organizations.',
    category: 'Program Management',
    implementationGuidance:
      'Develop organization-wide risk management strategy. Define risk tolerance levels. Establish risk assessment methodology. Document risk management decisions.',
    evidenceRequirements: [
      'Risk management strategy document',
      'Risk tolerance definitions',
      'Risk assessment methodology',
      'Risk management decision records',
      'Strategy review records',
    ],
    testProcedures: [
      'Review risk management strategy',
      'Verify risk tolerance definitions',
      'Examine assessment methodology',
      'Review decision records',
      'Confirm strategy reviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-10',
    name: 'Security Authorization Process',
    description:
      'FedRAMP requires organizations to manage the security authorization process for organizational systems.',
    category: 'Program Management',
    implementationGuidance:
      'Establish FedRAMP authorization process. Define authorization roles and responsibilities. Track authorization status. Manage authorization lifecycle.',
    evidenceRequirements: [
      'Authorization process documentation',
      'Role and responsibility definitions',
      'Authorization status tracking',
      'Authorization lifecycle management',
      'Process compliance verification',
    ],
    testProcedures: [
      'Review authorization process',
      'Verify role definitions',
      'Examine status tracking',
      'Review lifecycle management',
      'Confirm process compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-11',
    name: 'Mission/Business Process Definition',
    description:
      'FedRAMP requires organizations to define mission and business processes with consideration for information security.',
    category: 'Program Management',
    implementationGuidance:
      'Document mission and business processes. Identify security requirements for each process. Integrate security into process design. Review processes for security adequacy.',
    evidenceRequirements: [
      'Mission and business process documentation',
      'Security requirements by process',
      'Security integration in processes',
      'Process security review records',
      'Process update records',
    ],
    testProcedures: [
      'Review process documentation',
      'Verify security requirements',
      'Examine security integration',
      'Review security assessments',
      'Confirm process updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-12',
    name: 'Insider Threat Program',
    description:
      'FedRAMP requires organizations to implement an insider threat program that includes a cross-discipline insider threat incident handling team.',
    category: 'Program Management',
    implementationGuidance:
      'Establish insider threat program. Create cross-functional insider threat team. Implement insider threat monitoring. Define insider threat response procedures.',
    evidenceRequirements: [
      'Insider threat program documentation',
      'Insider threat team charter',
      'Monitoring implementation',
      'Response procedures',
      'Insider threat incident records',
    ],
    testProcedures: [
      'Review insider threat program',
      'Verify team composition',
      'Test monitoring capabilities',
      'Review response procedures',
      'Examine incident records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-13',
    name: 'Information Security Workforce',
    description:
      'FedRAMP requires organizations to establish an information security workforce development and improvement program.',
    category: 'Program Management',
    implementationGuidance:
      'Develop security workforce program. Define security competency requirements. Implement training and development activities. Track workforce development.',
    evidenceRequirements: [
      'Workforce development program',
      'Competency requirements documentation',
      'Training and development activities',
      'Development tracking records',
      'Workforce assessment records',
    ],
    testProcedures: [
      'Review workforce program',
      'Verify competency requirements',
      'Examine training activities',
      'Review tracking records',
      'Verify workforce assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-14',
    name: 'Testing, Training, and Monitoring',
    description:
      'FedRAMP requires organizations to implement a process for ensuring that organizational plans for conducting security testing, training, and monitoring activities are developed and maintained.',
    category: 'Program Management',
    implementationGuidance:
      'Develop testing, training, and monitoring plans. Implement planned activities. Track completion and effectiveness. Update plans based on results.',
    evidenceRequirements: [
      'Testing, training, and monitoring plans',
      'Activity implementation records',
      'Completion tracking',
      'Effectiveness assessment',
      'Plan update records',
    ],
    testProcedures: [
      'Review activity plans',
      'Verify implementation',
      'Examine completion tracking',
      'Review effectiveness assessments',
      'Confirm plan updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-15',
    name: 'Contacts with Security Groups and Associations',
    description:
      'FedRAMP requires organizations to establish and institutionalize contact with selected groups and associations within the security community.',
    category: 'Program Management',
    implementationGuidance:
      'Establish relationships with security groups. Participate in security communities. Share threat information appropriately. Leverage group resources for security improvement.',
    evidenceRequirements: [
      'Security group membership records',
      'Participation documentation',
      'Information sharing records',
      'Resource leveraging examples',
      'Contact maintenance records',
    ],
    testProcedures: [
      'Review security group contacts',
      'Verify participation',
      'Examine information sharing',
      'Review resource leveraging',
      'Confirm contact maintenance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-16',
    name: 'Threat Awareness Program',
    description:
      'FedRAMP requires organizations to implement a threat awareness program that includes a cross-organization information-sharing capability.',
    category: 'Program Management',
    implementationGuidance:
      'Implement threat awareness program. Establish information sharing capabilities. Disseminate threat information to personnel. Track threat awareness activities.',
    evidenceRequirements: [
      'Threat awareness program documentation',
      'Information sharing capabilities',
      'Threat dissemination records',
      'Personnel awareness records',
      'Program effectiveness assessment',
    ],
    testProcedures: [
      'Review threat awareness program',
      'Verify sharing capabilities',
      'Examine dissemination records',
      'Review awareness records',
      'Assess program effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-17',
    name: 'Protecting Controlled Unclassified Information on External Systems',
    description:
      'FedRAMP requires organizations to establish policy and procedures for the protection of controlled unclassified information on external systems.',
    category: 'Program Management',
    implementationGuidance:
      'Develop CUI protection policy for external systems. Implement protection requirements. Verify external system compliance. Monitor CUI handling on external systems.',
    evidenceRequirements: [
      'CUI protection policy',
      'Protection requirements documentation',
      'External system compliance verification',
      'CUI handling monitoring',
      'Policy compliance records',
    ],
    testProcedures: [
      'Review CUI protection policy',
      'Verify protection requirements',
      'Examine compliance verification',
      'Review handling monitoring',
      'Confirm policy compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-18',
    name: 'Privacy Program Plan',
    description:
      'FedRAMP requires organizations to develop and disseminate an organization-wide privacy program plan.',
    category: 'Program Management',
    implementationGuidance:
      'Develop comprehensive privacy program plan. Define privacy roles and responsibilities. Establish privacy compliance monitoring. Review and update plan annually.',
    evidenceRequirements: [
      'Privacy program plan',
      'Privacy role definitions',
      'Compliance monitoring implementation',
      'Annual review records',
      'Plan dissemination records',
    ],
    testProcedures: [
      'Review privacy program plan',
      'Verify role definitions',
      'Examine compliance monitoring',
      'Confirm annual review',
      'Verify plan dissemination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-19',
    name: 'Privacy Program Leadership Role',
    description:
      'FedRAMP requires organizations to appoint a senior official with the authority and accountability for developing, implementing, and maintaining the privacy program.',
    category: 'Program Management',
    implementationGuidance:
      'Appoint senior privacy official. Define privacy leadership responsibilities. Establish privacy program governance. Allocate adequate privacy resources.',
    evidenceRequirements: [
      'Privacy official appointment',
      'Responsibility definitions',
      'Governance structure documentation',
      'Resource allocation records',
      'Privacy leadership activities',
    ],
    testProcedures: [
      'Verify privacy official appointment',
      'Review responsibility definitions',
      'Examine governance structure',
      'Confirm resource allocation',
      'Review leadership activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PM-20',
    name: 'Dissemination of Privacy Program Information',
    description:
      'FedRAMP requires organizations to maintain a central resource webpage for the privacy program that provides an overview of the activities affecting privacy.',
    category: 'Program Management',
    implementationGuidance:
      'Establish privacy information resource. Publish privacy policies and procedures. Provide privacy contact information. Update privacy information regularly.',
    evidenceRequirements: [
      'Privacy resource webpage',
      'Published privacy policies',
      'Contact information availability',
      'Update records',
      'Accessibility verification',
    ],
    testProcedures: [
      'Review privacy resource webpage',
      'Verify published policies',
      'Confirm contact information',
      'Review update records',
      'Test accessibility',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // SUPPLY CHAIN RISK MANAGEMENT (SR) - 15 Controls
  // ============================================================
  {
    controlId: 'FR-SR-1',
    name: 'Supply Chain Risk Management Policy and Procedures',
    description:
      'FedRAMP requires organizations to develop, document, and disseminate a supply chain risk management policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Develop supply chain risk management policy. Define SCRM roles and responsibilities. Establish supply chain security requirements. Review and update policy annually.',
    evidenceRequirements: [
      'SCRM policy document',
      'Role and responsibility definitions',
      'Supply chain security requirements',
      'Policy review records',
      'Policy dissemination records',
    ],
    testProcedures: [
      'Review SCRM policy',
      'Verify role definitions',
      'Examine security requirements',
      'Confirm policy reviews',
      'Verify policy dissemination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-2',
    name: 'Supply Chain Risk Management Plan',
    description:
      'FedRAMP requires organizations to develop a plan for managing supply chain risks associated with the development, acquisition, maintenance, and disposal of systems, system components, and system services.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Develop comprehensive SCRM plan. Address all lifecycle phases. Define risk assessment and mitigation procedures. Update plan when supply chain changes.',
    evidenceRequirements: [
      'SCRM plan document',
      'Lifecycle coverage documentation',
      'Risk assessment procedures',
      'Mitigation procedures',
      'Plan update records',
    ],
    testProcedures: [
      'Review SCRM plan',
      'Verify lifecycle coverage',
      'Examine risk assessment procedures',
      'Review mitigation procedures',
      'Confirm plan updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-3',
    name: 'Supply Chain Controls and Processes',
    description:
      'FedRAMP requires organizations to establish a process or processes to identify and address weaknesses or deficiencies in the supply chain elements and processes.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement supply chain weakness identification processes. Address identified weaknesses. Track remediation progress. Monitor supply chain effectiveness.',
    evidenceRequirements: [
      'Weakness identification process',
      'Weakness tracking records',
      'Remediation documentation',
      'Progress tracking records',
      'Effectiveness monitoring',
    ],
    testProcedures: [
      'Review identification process',
      'Examine weakness tracking',
      'Verify remediation activities',
      'Review progress tracking',
      'Assess effectiveness monitoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-4',
    name: 'Provenance',
    description:
      'FedRAMP requires organizations to document, monitor, and maintain valid provenance of systems, system components, and associated data.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Document component provenance. Maintain chain of custody records. Verify provenance claims. Monitor for provenance changes.',
    evidenceRequirements: [
      'Provenance documentation',
      'Chain of custody records',
      'Provenance verification records',
      'Change monitoring records',
      'Provenance audit records',
    ],
    testProcedures: [
      'Review provenance documentation',
      'Examine chain of custody',
      'Verify provenance claims',
      'Review change monitoring',
      'Examine audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-5',
    name: 'Acquisition Strategies, Tools, and Methods',
    description:
      'FedRAMP requires organizations to employ acquisition strategies, contract tools, and procurement methods to protect against, identify, and mitigate supply chain risks.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Develop secure acquisition strategies. Include security requirements in contracts. Use vetted procurement methods. Verify supplier security practices.',
    evidenceRequirements: [
      'Acquisition strategy documentation',
      'Contract security requirements',
      'Procurement method documentation',
      'Supplier verification records',
      'Acquisition effectiveness assessment',
    ],
    testProcedures: [
      'Review acquisition strategies',
      'Examine contract requirements',
      'Verify procurement methods',
      'Review supplier verification',
      'Assess acquisition effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-6',
    name: 'Supplier Assessments and Reviews',
    description:
      'FedRAMP requires organizations to assess and review supply chain-related risks associated with suppliers or contractors.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Conduct supplier risk assessments. Review supplier security practices. Document assessment results. Implement risk-based supplier management.',
    evidenceRequirements: [
      'Supplier risk assessment records',
      'Security practice reviews',
      'Assessment result documentation',
      'Risk-based management implementation',
      'Supplier assessment schedule',
    ],
    testProcedures: [
      'Review supplier assessments',
      'Examine security practice reviews',
      'Verify assessment documentation',
      'Review risk-based management',
      'Confirm assessment schedule',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-7',
    name: 'Supply Chain Operations Security',
    description:
      'FedRAMP requires organizations to employ operations security controls and safeguards to protect supply chain-related information.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement OPSEC for supply chain information. Protect sensitive supplier data. Control supply chain information disclosure. Monitor for supply chain intelligence threats.',
    evidenceRequirements: [
      'Supply chain OPSEC procedures',
      'Supplier data protection measures',
      'Information disclosure controls',
      'Threat monitoring records',
      'OPSEC effectiveness assessment',
    ],
    testProcedures: [
      'Review OPSEC procedures',
      'Verify data protection',
      'Examine disclosure controls',
      'Review threat monitoring',
      'Assess OPSEC effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-8',
    name: 'Notification Agreements',
    description:
      'FedRAMP requires organizations to establish agreements and procedures with entities involved in the supply chain for notification of supply chain compromises.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Establish notification agreements with suppliers. Define notification procedures and timelines. Include notification requirements in contracts. Test notification processes.',
    evidenceRequirements: [
      'Notification agreements',
      'Notification procedures',
      'Contract notification requirements',
      'Notification testing records',
      'Notification incident records',
    ],
    testProcedures: [
      'Review notification agreements',
      'Verify notification procedures',
      'Examine contract requirements',
      'Review testing records',
      'Examine incident records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-9',
    name: 'Tamper Resistance and Detection',
    description:
      'FedRAMP requires organizations to employ tamper resistance and detection mechanisms to protect against tampering in the supply chain.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement tamper-evident packaging. Deploy tamper detection mechanisms. Inspect deliveries for tampering. Report and investigate tampering incidents.',
    evidenceRequirements: [
      'Tamper-evident packaging procedures',
      'Tamper detection implementation',
      'Delivery inspection records',
      'Tampering incident reports',
      'Investigation records',
    ],
    testProcedures: [
      'Review packaging procedures',
      'Verify detection implementation',
      'Examine inspection records',
      'Review incident reports',
      'Verify investigations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-10',
    name: 'Inspection of Systems or Components',
    description:
      'FedRAMP requires organizations to inspect systems or system components for tampering upon delivery and at random intervals.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement delivery inspection procedures. Conduct random component inspections. Document inspection results. Address identified tampering.',
    evidenceRequirements: [
      'Delivery inspection procedures',
      'Random inspection schedule',
      'Inspection result documentation',
      'Tampering response records',
      'Inspection effectiveness assessment',
    ],
    testProcedures: [
      'Review inspection procedures',
      'Verify random inspections',
      'Examine inspection results',
      'Review tampering responses',
      'Assess inspection effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-11',
    name: 'Component Authenticity',
    description:
      'FedRAMP requires organizations to develop and implement anti-counterfeit policies and procedures to detect and prevent counterfeit components.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Develop anti-counterfeit policies. Implement authenticity verification. Use authorized sources only. Report counterfeit discoveries.',
    evidenceRequirements: [
      'Anti-counterfeit policy',
      'Authenticity verification procedures',
      'Authorized source documentation',
      'Counterfeit reporting records',
      'Policy effectiveness assessment',
    ],
    testProcedures: [
      'Review anti-counterfeit policy',
      'Verify authenticity procedures',
      'Examine authorized sources',
      'Review reporting records',
      'Assess policy effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-12',
    name: 'Component Disposal',
    description:
      'FedRAMP requires organizations to dispose of system components using approved disposal techniques and methods in the supply chain.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement secure component disposal. Use approved disposal methods. Prevent component reuse in supply chain. Document disposal activities.',
    evidenceRequirements: [
      'Component disposal procedures',
      'Approved disposal methods',
      'Reuse prevention measures',
      'Disposal activity records',
      'Disposal verification records',
    ],
    testProcedures: [
      'Review disposal procedures',
      'Verify approved methods',
      'Examine reuse prevention',
      'Review disposal records',
      'Verify disposal completion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-13',
    name: 'Processes and Vendors',
    description:
      'FedRAMP requires organizations to employ diverse supply chain processes and vendors to limit the risk of exploitation.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement supply chain diversity. Use multiple vendors for critical components. Vary supply chain processes. Document diversity decisions.',
    evidenceRequirements: [
      'Supply chain diversity documentation',
      'Multiple vendor records',
      'Process variation documentation',
      'Diversity decision records',
      'Diversity effectiveness assessment',
    ],
    testProcedures: [
      'Review supply chain diversity',
      'Verify multiple vendors',
      'Examine process variation',
      'Review diversity decisions',
      'Assess diversity effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-14',
    name: 'Assess Criticality of Components',
    description:
      'FedRAMP requires organizations to assess the criticality of system components in the supply chain.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Conduct component criticality assessments. Prioritize protection based on criticality. Document assessment methodology. Update assessments when supply chain changes.',
    evidenceRequirements: [
      'Criticality assessment methodology',
      'Component criticality ratings',
      'Protection prioritization',
      'Assessment update records',
      'Criticality-based decisions',
    ],
    testProcedures: [
      'Review assessment methodology',
      'Verify criticality ratings',
      'Examine protection prioritization',
      'Review assessment updates',
      'Verify criticality-based decisions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SR-15',
    name: 'Processes to Address Weaknesses',
    description:
      'FedRAMP requires organizations to establish processes to address weaknesses identified in supply chain elements.',
    category: 'Supply Chain Risk Management',
    implementationGuidance:
      'Implement weakness remediation process. Track weakness resolution. Verify remediation effectiveness. Document lessons learned.',
    evidenceRequirements: [
      'Weakness remediation process',
      'Resolution tracking records',
      'Effectiveness verification',
      'Lessons learned documentation',
      'Process improvement records',
    ],
    testProcedures: [
      'Review remediation process',
      'Verify resolution tracking',
      'Examine effectiveness verification',
      'Review lessons learned',
      'Confirm process improvements',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL ACCESS CONTROL (AC) ENHANCEMENTS - 10 Controls
  // ============================================================
  {
    controlId: 'FR-AC-21',
    name: 'Information Sharing',
    description:
      'FedRAMP requires organizations to facilitate information sharing by enabling authorized users to determine whether access authorizations assigned to the sharing partner match the access restrictions on the information.',
    category: 'Access Control',
    implementationGuidance:
      'Implement information sharing controls. Verify recipient authorization before sharing. Document sharing decisions. Monitor sharing activities.',
    evidenceRequirements: [
      'Information sharing procedures',
      'Authorization verification implementation',
      'Sharing decision records',
      'Sharing activity monitoring',
      'Sharing compliance records',
    ],
    testProcedures: [
      'Review sharing procedures',
      'Test authorization verification',
      'Examine sharing decisions',
      'Review activity monitoring',
      'Verify compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-22',
    name: 'Publicly Accessible Content',
    description:
      'FedRAMP requires organizations to designate individuals authorized to post information onto publicly accessible systems and review content before posting.',
    category: 'Access Control',
    implementationGuidance:
      'Designate authorized content posters. Implement content review process. Train personnel on content requirements. Monitor public content.',
    evidenceRequirements: [
      'Authorized poster designation',
      'Content review process documentation',
      'Personnel training records',
      'Content monitoring implementation',
      'Review approval records',
    ],
    testProcedures: [
      'Verify authorized posters',
      'Test content review process',
      'Review training records',
      'Examine content monitoring',
      'Review approval records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-23',
    name: 'Data Mining Protection',
    description:
      'FedRAMP requires organizations to employ data mining prevention and detection techniques to protect against data mining by adversaries.',
    category: 'Access Control',
    implementationGuidance:
      'Implement data mining prevention controls. Monitor for data mining patterns. Alert on suspicious data access patterns. Investigate potential data mining.',
    evidenceRequirements: [
      'Data mining prevention implementation',
      'Pattern monitoring configuration',
      'Alert configuration documentation',
      'Investigation records',
      'Prevention effectiveness assessment',
    ],
    testProcedures: [
      'Review prevention implementation',
      'Test pattern monitoring',
      'Verify alert configuration',
      'Examine investigation records',
      'Assess effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-24',
    name: 'Access Control Decisions',
    description:
      'FedRAMP requires organizations to establish procedures to ensure that access control decisions are applied to each access request prior to access enforcement.',
    category: 'Access Control',
    implementationGuidance:
      'Implement consistent access control decisions. Apply decisions before access. Document decision logic. Review decision effectiveness.',
    evidenceRequirements: [
      'Access control decision procedures',
      'Decision application verification',
      'Decision logic documentation',
      'Decision review records',
      'Effectiveness assessment',
    ],
    testProcedures: [
      'Review decision procedures',
      'Verify decision application',
      'Examine decision logic',
      'Review effectiveness',
      'Test decision consistency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-25',
    name: 'Reference Monitor',
    description:
      'FedRAMP requires the information system to implement a reference monitor for access control that is tamper-proof and always invoked.',
    category: 'Access Control',
    implementationGuidance:
      'Implement reference monitor functionality. Ensure tamper-proof operation. Verify complete mediation. Monitor reference monitor integrity.',
    evidenceRequirements: [
      'Reference monitor implementation',
      'Tamper-proof verification',
      'Complete mediation verification',
      'Integrity monitoring records',
      'Reference monitor testing',
    ],
    testProcedures: [
      'Verify reference monitor implementation',
      'Test tamper protection',
      'Verify complete mediation',
      'Review integrity monitoring',
      'Examine testing records',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL AUDIT (AU) ENHANCEMENTS - 5 Controls
  // ============================================================
  {
    controlId: 'FR-AU-13',
    name: 'Monitoring for Information Disclosure',
    description:
      'FedRAMP requires organizations to monitor open source information and information sites for evidence of unauthorized disclosure of organizational information.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement open source monitoring. Monitor for data leakage indicators. Alert on potential unauthorized disclosures. Investigate and respond to disclosures.',
    evidenceRequirements: [
      'Open source monitoring implementation',
      'Data leakage monitoring configuration',
      'Alert configuration',
      'Investigation records',
      'Response procedures',
    ],
    testProcedures: [
      'Verify monitoring implementation',
      'Test leakage detection',
      'Review alert configuration',
      'Examine investigation records',
      'Review response procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-14',
    name: 'Session Audit',
    description:
      'FedRAMP requires the information system to provide the capability for authorized users to select a user session to capture and record all content related to a user session.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement session recording capabilities. Enable authorized session capture. Protect session recordings. Document session audit usage.',
    evidenceRequirements: [
      'Session recording implementation',
      'Authorized capture procedures',
      'Recording protection measures',
      'Usage documentation',
      'Session audit testing records',
    ],
    testProcedures: [
      'Verify recording capabilities',
      'Test session capture',
      'Verify recording protection',
      'Review usage documentation',
      'Examine testing records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-15',
    name: 'Alternate Audit Capability',
    description:
      'FedRAMP requires organizations to provide an alternate audit capability in the event of a failure in primary audit capability.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement alternate audit capability. Configure automatic failover. Test alternate capability regularly. Document failover procedures.',
    evidenceRequirements: [
      'Alternate audit capability implementation',
      'Failover configuration',
      'Testing records',
      'Failover procedures',
      'Capability effectiveness assessment',
    ],
    testProcedures: [
      'Verify alternate capability',
      'Test automatic failover',
      'Review testing records',
      'Examine failover procedures',
      'Assess effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-16',
    name: 'Cross-Organizational Auditing',
    description:
      'FedRAMP requires organizations to employ cross-organizational audit collection to correlate audit information across organizational boundaries.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement cross-organizational audit collection. Correlate audit data across boundaries. Protect cross-organizational audit data. Document collection procedures.',
    evidenceRequirements: [
      'Cross-organizational collection implementation',
      'Correlation capabilities',
      'Data protection measures',
      'Collection procedures',
      'Correlation effectiveness assessment',
    ],
    testProcedures: [
      'Verify collection implementation',
      'Test correlation capabilities',
      'Review data protection',
      'Examine collection procedures',
      'Assess correlation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-17',
    name: 'Audit Information Aggregation',
    description:
      'FedRAMP requires organizations to aggregate audit information from multiple sources into a single repository for analysis.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement centralized audit repository. Aggregate logs from all sources. Maintain log integrity during aggregation. Enable efficient analysis.',
    evidenceRequirements: [
      'Central repository implementation',
      'Source aggregation configuration',
      'Integrity protection measures',
      'Analysis capabilities',
      'Aggregation effectiveness assessment',
    ],
    testProcedures: [
      'Verify repository implementation',
      'Test aggregation from sources',
      'Verify integrity protection',
      'Review analysis capabilities',
      'Assess aggregation effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL CONFIGURATION MANAGEMENT (CM) - 5 Controls
  // ============================================================
  {
    controlId: 'FR-CM-9',
    name: 'Configuration Management Plan',
    description:
      'FedRAMP requires organizations to develop, document, and implement a configuration management plan that addresses roles, responsibilities, and processes.',
    category: 'Configuration Management',
    implementationGuidance:
      'Develop comprehensive CM plan. Define CM roles and responsibilities. Establish CM processes. Review and update plan annually.',
    evidenceRequirements: [
      'Configuration management plan',
      'Role and responsibility definitions',
      'CM process documentation',
      'Plan review records',
      'Plan implementation verification',
    ],
    testProcedures: [
      'Review CM plan',
      'Verify role definitions',
      'Examine CM processes',
      'Confirm plan reviews',
      'Verify implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-10',
    name: 'Software Usage Restrictions',
    description:
      'FedRAMP requires organizations to use software and associated documentation in accordance with contract agreements and copyright laws.',
    category: 'Configuration Management',
    implementationGuidance:
      'Track software licenses. Ensure compliance with agreements. Document software usage. Verify license compliance periodically.',
    evidenceRequirements: [
      'Software license inventory',
      'Agreement compliance records',
      'Usage documentation',
      'Compliance verification records',
      'License audit records',
    ],
    testProcedures: [
      'Review license inventory',
      'Verify agreement compliance',
      'Examine usage documentation',
      'Review compliance verification',
      'Examine audit records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-11',
    name: 'User-Installed Software',
    description:
      'FedRAMP requires organizations to establish and enforce software installation policies governing the installation of software by users.',
    category: 'Configuration Management',
    implementationGuidance:
      'Define user software installation policies. Implement technical enforcement. Monitor for unauthorized installations. Document approved software.',
    evidenceRequirements: [
      'Software installation policy',
      'Technical enforcement implementation',
      'Monitoring configuration',
      'Approved software list',
      'Enforcement records',
    ],
    testProcedures: [
      'Review installation policy',
      'Test technical enforcement',
      'Verify monitoring',
      'Review approved software list',
      'Examine enforcement records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-12',
    name: 'Information Location',
    description:
      'FedRAMP requires organizations to identify and document the location of information and information system components.',
    category: 'Configuration Management',
    implementationGuidance:
      'Document information storage locations. Track component locations. Update location information when changes occur. Verify location accuracy.',
    evidenceRequirements: [
      'Information location documentation',
      'Component location tracking',
      'Location update records',
      'Location verification records',
      'Location accuracy assessment',
    ],
    testProcedures: [
      'Review location documentation',
      'Verify component tracking',
      'Examine update records',
      'Review verification records',
      'Assess accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-13',
    name: 'Data Action Mapping',
    description:
      'FedRAMP requires organizations to develop and document a map of information system data actions.',
    category: 'Configuration Management',
    implementationGuidance:
      'Map data actions through the system. Document data flows and transformations. Update maps when system changes. Use maps for security analysis.',
    evidenceRequirements: [
      'Data action mapping documentation',
      'Data flow documentation',
      'Transformation documentation',
      'Map update records',
      'Security analysis using maps',
    ],
    testProcedures: [
      'Review data action maps',
      'Verify data flow documentation',
      'Examine transformations',
      'Review map updates',
      'Verify security analysis usage',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL SYSTEM AND COMMUNICATIONS PROTECTION (SC) - 5 Controls
  // ============================================================
  {
    controlId: 'FR-SC-46',
    name: 'Cross Domain Policy Enforcement',
    description:
      'FedRAMP requires organizations to implement cross domain policy enforcement mechanisms when transferring information between different security domains.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Deploy cross domain solutions. Implement policy enforcement points. Validate all cross-domain transfers. Monitor and log cross-domain activities.',
    evidenceRequirements: [
      'Cross domain solution implementation',
      'Policy enforcement configuration',
      'Transfer validation mechanisms',
      'Cross-domain monitoring logs',
      'Policy enforcement testing records',
    ],
    testProcedures: [
      'Verify cross domain solution deployment',
      'Test policy enforcement mechanisms',
      'Validate transfer controls',
      'Review monitoring logs',
      'Assess enforcement effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-47',
    name: 'Alternate Communications Protocols',
    description:
      'FedRAMP requires organizations to implement alternative communications protocols to increase availability during adverse conditions.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Identify primary and alternate protocols. Configure automatic failover. Test alternate protocols regularly. Document protocol switching procedures.',
    evidenceRequirements: [
      'Alternate protocol documentation',
      'Failover configuration evidence',
      'Protocol testing records',
      'Switching procedures documentation',
      'Availability metrics during failover',
    ],
    testProcedures: [
      'Review alternate protocol implementation',
      'Test automatic failover',
      'Verify protocol switching',
      'Review testing records',
      'Assess availability during transitions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-48',
    name: 'Sensor Relocation',
    description:
      'FedRAMP requires organizations to relocate sensors and monitoring capabilities to protect against adversary detection and targeting.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement mobile or relocatable sensors. Vary monitoring locations. Protect sensor placement information. Coordinate relocation activities.',
    evidenceRequirements: [
      'Sensor relocation capability documentation',
      'Relocation procedures',
      'Placement protection measures',
      'Coordination records',
      'Relocation effectiveness assessment',
    ],
    testProcedures: [
      'Verify relocation capabilities',
      'Test sensor mobility',
      'Review placement protection',
      'Examine coordination procedures',
      'Assess detection avoidance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-49',
    name: 'Hardware Enforced Separation',
    description:
      'FedRAMP requires organizations to implement hardware-enforced separation mechanisms for security-critical components.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Deploy hardware separation mechanisms. Isolate critical components physically. Implement hardware security modules. Verify separation effectiveness.',
    evidenceRequirements: [
      'Hardware separation architecture',
      'Physical isolation documentation',
      'HSM deployment records',
      'Separation verification evidence',
      'Hardware security assessment',
    ],
    testProcedures: [
      'Review hardware separation design',
      'Verify physical isolation',
      'Test HSM functionality',
      'Validate separation effectiveness',
      'Assess hardware security controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-50',
    name: 'Software and Firmware Integrity Verification',
    description:
      'FedRAMP requires organizations to verify the integrity of software and firmware components using cryptographic mechanisms.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement code signing for software. Verify firmware signatures before execution. Monitor for unauthorized modifications. Alert on integrity failures.',
    evidenceRequirements: [
      'Code signing implementation',
      'Firmware verification configuration',
      'Modification monitoring setup',
      'Integrity alerting records',
      'Verification effectiveness assessment',
    ],
    testProcedures: [
      'Test code signing verification',
      'Verify firmware signature checks',
      'Test modification detection',
      'Review integrity alerts',
      'Assess verification coverage',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL SYSTEM AND INFORMATION INTEGRITY (SI) - 6 Controls
  // ============================================================
  {
    controlId: 'FR-SI-25',
    name: 'Information Input Validation',
    description:
      'FedRAMP requires organizations to check the validity of information inputs to the system.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement input validation controls. Validate data types, formats, and ranges. Reject invalid inputs. Log validation failures.',
    evidenceRequirements: [
      'Input validation implementation',
      'Validation rules documentation',
      'Invalid input handling procedures',
      'Validation failure logs',
      'Validation coverage assessment',
    ],
    testProcedures: [
      'Test input validation controls',
      'Verify validation rules',
      'Test invalid input handling',
      'Review failure logs',
      'Assess validation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-26',
    name: 'Error Handling',
    description:
      'FedRAMP requires organizations to handle error conditions in a secure manner that does not provide information useful to adversaries.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement secure error handling. Sanitize error messages for users. Log detailed errors securely. Prevent information leakage in errors.',
    evidenceRequirements: [
      'Error handling implementation',
      'Error message sanitization evidence',
      'Secure error logging configuration',
      'Information leakage prevention measures',
      'Error handling testing records',
    ],
    testProcedures: [
      'Test error handling mechanisms',
      'Verify error message sanitization',
      'Review secure logging',
      'Test for information leakage',
      'Assess error handling security',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-27',
    name: 'Information Output Filtering',
    description:
      'FedRAMP requires organizations to validate information outputs from the system to ensure accuracy and protect sensitive data.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement output validation. Filter sensitive data from outputs. Verify output accuracy. Log output validation activities.',
    evidenceRequirements: [
      'Output validation implementation',
      'Sensitive data filtering configuration',
      'Output accuracy verification',
      'Validation activity logs',
      'Output filtering effectiveness assessment',
    ],
    testProcedures: [
      'Test output validation',
      'Verify sensitive data filtering',
      'Check output accuracy',
      'Review validation logs',
      'Assess filtering effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-28',
    name: 'Memory Protection',
    description:
      'FedRAMP requires organizations to implement memory protection mechanisms to prevent unauthorized code execution.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Enable DEP/NX protections. Implement ASLR. Use stack canaries. Monitor for memory exploitation attempts.',
    evidenceRequirements: [
      'DEP/NX configuration evidence',
      'ASLR implementation records',
      'Stack protection configuration',
      'Memory exploitation monitoring',
      'Memory protection assessment',
    ],
    testProcedures: [
      'Verify DEP/NX is enabled',
      'Test ASLR effectiveness',
      'Review stack protection',
      'Test exploitation detection',
      'Assess memory protection coverage',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-29',
    name: 'Fail-Safe Procedures',
    description:
      'FedRAMP requires organizations to implement fail-safe procedures that activate when security failures occur.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Define fail-safe states for systems. Implement automatic fail-safe activation. Test fail-safe procedures. Document recovery procedures.',
    evidenceRequirements: [
      'Fail-safe state definitions',
      'Automatic activation configuration',
      'Fail-safe testing records',
      'Recovery procedure documentation',
      'Fail-safe effectiveness assessment',
    ],
    testProcedures: [
      'Review fail-safe definitions',
      'Test automatic activation',
      'Verify fail-safe procedures',
      'Review recovery procedures',
      'Assess fail-safe effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-30',
    name: 'Information Disposal',
    description:
      'FedRAMP requires organizations to dispose of information and sanitize media in accordance with organizational policies.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement secure disposal procedures. Use approved sanitization methods. Verify disposal completion. Document disposal activities.',
    evidenceRequirements: [
      'Disposal procedure documentation',
      'Sanitization method approvals',
      'Disposal verification records',
      'Activity documentation',
      'Disposal effectiveness assessment',
    ],
    testProcedures: [
      'Review disposal procedures',
      'Verify sanitization methods',
      'Check disposal verification',
      'Review activity documentation',
      'Assess disposal effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL CONTINGENCY PLANNING (CP) - 6 Controls
  // ============================================================
  {
    controlId: 'FR-CP-7',
    name: 'Alternate Processing Site',
    description:
      'FedRAMP requires organizations to establish an alternate processing site that provides security safeguards equivalent to the primary site.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Identify and configure alternate processing site. Ensure equivalent security controls. Test failover capabilities. Maintain site readiness.',
    evidenceRequirements: [
      'Alternate site documentation',
      'Security control equivalence analysis',
      'Failover testing records',
      'Site readiness assessments',
      'Alternate site agreements',
    ],
    testProcedures: [
      'Verify alternate site configuration',
      'Assess security control equivalence',
      'Test failover capabilities',
      'Review readiness assessments',
      'Examine site agreements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-8',
    name: 'Telecommunications Services',
    description:
      'FedRAMP requires organizations to establish alternate telecommunications services to support the contingency plan.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Establish primary and alternate telecommunications. Configure automatic failover. Test telecommunications continuity. Document service agreements.',
    evidenceRequirements: [
      'Telecommunications service documentation',
      'Failover configuration evidence',
      'Continuity testing records',
      'Service agreements',
      'Telecommunications redundancy assessment',
    ],
    testProcedures: [
      'Verify telecommunications configuration',
      'Test automatic failover',
      'Review continuity testing',
      'Examine service agreements',
      'Assess redundancy effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-9',
    name: 'Information System Backup',
    description:
      'FedRAMP requires organizations to conduct backups of user-level and system-level information at defined frequencies.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Define backup frequencies by data criticality. Automate backup processes. Verify backup integrity. Store backups securely off-site.',
    evidenceRequirements: [
      'Backup policy and procedures',
      'Backup automation configuration',
      'Integrity verification records',
      'Off-site storage evidence',
      'Backup testing records',
    ],
    testProcedures: [
      'Review backup policy',
      'Verify automation configuration',
      'Test backup integrity',
      'Verify off-site storage',
      'Test backup restoration',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-10',
    name: 'Information System Recovery and Reconstitution',
    description:
      'FedRAMP requires organizations to provide for the recovery and reconstitution of the system to a known state after disruption.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Define recovery procedures. Establish known-good system states. Practice recovery procedures. Document reconstitution activities.',
    evidenceRequirements: [
      'Recovery procedure documentation',
      'Known-good state definitions',
      'Recovery practice records',
      'Reconstitution activity logs',
      'Recovery effectiveness assessment',
    ],
    testProcedures: [
      'Review recovery procedures',
      'Verify known-good state definitions',
      'Test recovery capabilities',
      'Review reconstitution logs',
      'Assess recovery effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-11',
    name: 'Alternate Communications Protocols',
    description:
      'FedRAMP requires organizations to establish alternate communications protocols to support contingency operations.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Identify alternate communication methods. Configure backup communications. Test alternate protocols. Document protocol switching procedures.',
    evidenceRequirements: [
      'Alternate communications documentation',
      'Backup communications configuration',
      'Protocol testing records',
      'Switching procedure documentation',
      'Communications continuity assessment',
    ],
    testProcedures: [
      'Review alternate communications',
      'Verify backup configuration',
      'Test alternate protocols',
      'Review switching procedures',
      'Assess communications continuity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-12',
    name: 'Safe Mode',
    description:
      'FedRAMP requires organizations to implement safe mode operations when anomalous conditions are detected.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Define safe mode operating states. Implement automatic safe mode activation. Test safe mode transitions. Document safe mode procedures.',
    evidenceRequirements: [
      'Safe mode definition documentation',
      'Automatic activation configuration',
      'Transition testing records',
      'Safe mode procedures',
      'Safe mode effectiveness assessment',
    ],
    testProcedures: [
      'Review safe mode definitions',
      'Test automatic activation',
      'Verify transition procedures',
      'Review safe mode procedures',
      'Assess safe mode effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL IDENTIFICATION AND AUTHENTICATION (IA) - 6 Controls
  // ============================================================
  {
    controlId: 'FR-IA-7',
    name: 'Cryptographic Module Authentication',
    description:
      'FedRAMP requires organizations to implement authentication mechanisms that meet FIPS 140-2 requirements for cryptographic modules.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Use FIPS 140-2 validated modules. Configure module authentication. Verify module validation status. Monitor module compliance.',
    evidenceRequirements: [
      'FIPS 140-2 validation certificates',
      'Module authentication configuration',
      'Validation status verification',
      'Compliance monitoring records',
      'Module security assessment',
    ],
    testProcedures: [
      'Verify FIPS 140-2 validation',
      'Test module authentication',
      'Review validation status',
      'Examine compliance monitoring',
      'Assess module security',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-8',
    name: 'Identification and Authentication (Non-Organizational Users)',
    description:
      'FedRAMP requires organizations to uniquely identify and authenticate non-organizational users and processes acting on behalf of non-organizational users.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement external user identification. Require authentication for non-org users. Validate external identities. Monitor non-org user activities.',
    evidenceRequirements: [
      'External user identification process',
      'Non-org user authentication configuration',
      'Identity validation procedures',
      'Activity monitoring records',
      'External user access assessment',
    ],
    testProcedures: [
      'Test external user identification',
      'Verify authentication requirements',
      'Review identity validation',
      'Examine activity monitoring',
      'Assess external access controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-9',
    name: 'Service Identification and Authentication',
    description:
      'FedRAMP requires organizations to identify and authenticate services before establishing connections.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement service-to-service authentication. Use certificates for service identity. Validate service credentials. Monitor service connections.',
    evidenceRequirements: [
      'Service authentication implementation',
      'Certificate management documentation',
      'Credential validation procedures',
      'Connection monitoring records',
      'Service authentication assessment',
    ],
    testProcedures: [
      'Test service authentication',
      'Verify certificate usage',
      'Review credential validation',
      'Examine connection monitoring',
      'Assess service identity controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-10',
    name: 'Adaptive Identification and Authentication',
    description:
      'FedRAMP requires organizations to require individuals accessing the system to employ supplemental authentication techniques under specific circumstances.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Define adaptive authentication triggers. Implement step-up authentication. Configure risk-based authentication. Monitor authentication patterns.',
    evidenceRequirements: [
      'Adaptive authentication policy',
      'Step-up authentication configuration',
      'Risk-based rules documentation',
      'Authentication pattern monitoring',
      'Adaptive authentication assessment',
    ],
    testProcedures: [
      'Test adaptive authentication triggers',
      'Verify step-up authentication',
      'Review risk-based rules',
      'Examine pattern monitoring',
      'Assess adaptive effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-11',
    name: 'Re-authentication',
    description:
      'FedRAMP requires organizations to require users to re-authenticate when defined circumstances or situations require re-authentication.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Define re-authentication triggers. Implement session timeout re-auth. Require re-auth for sensitive operations. Log re-authentication events.',
    evidenceRequirements: [
      'Re-authentication policy',
      'Trigger configuration documentation',
      'Session timeout settings',
      'Sensitive operation re-auth config',
      'Re-authentication event logs',
    ],
    testProcedures: [
      'Test re-authentication triggers',
      'Verify session timeouts',
      'Test sensitive operation re-auth',
      'Review event logs',
      'Assess re-authentication effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-12',
    name: 'Identity Proofing',
    description:
      'FedRAMP requires organizations to identity proof users who require accounts for logical access to systems.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Establish identity proofing procedures. Verify user identity documents. Validate identity evidence. Document proofing activities.',
    evidenceRequirements: [
      'Identity proofing procedures',
      'Document verification requirements',
      'Evidence validation records',
      'Proofing activity logs',
      'Identity proofing assessment',
    ],
    testProcedures: [
      'Review proofing procedures',
      'Verify document requirements',
      'Test evidence validation',
      'Review activity logs',
      'Assess proofing effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL INCIDENT RESPONSE (IR) - 5 Controls
  // ============================================================
  {
    controlId: 'FR-IR-8',
    name: 'Incident Response Plan',
    description:
      'FedRAMP requires organizations to develop an incident response plan that provides a roadmap for implementing incident response capability.',
    category: 'Incident Response',
    implementationGuidance:
      'Develop comprehensive IR plan. Define roles and responsibilities. Establish communication procedures. Review and update plan annually.',
    evidenceRequirements: [
      'Incident response plan document',
      'Role and responsibility definitions',
      'Communication procedures',
      'Plan review records',
      'Plan distribution evidence',
    ],
    testProcedures: [
      'Review IR plan completeness',
      'Verify role definitions',
      'Test communication procedures',
      'Confirm annual reviews',
      'Verify plan distribution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-9',
    name: 'Information Spillage Response',
    description:
      'FedRAMP requires organizations to respond to information spills by identifying contaminated systems and taking corrective actions.',
    category: 'Incident Response',
    implementationGuidance:
      'Define spillage response procedures. Identify contamination scope. Implement containment measures. Conduct cleanup activities.',
    evidenceRequirements: [
      'Spillage response procedures',
      'Contamination identification process',
      'Containment measure documentation',
      'Cleanup activity records',
      'Spillage response assessment',
    ],
    testProcedures: [
      'Review spillage procedures',
      'Test contamination identification',
      'Verify containment measures',
      'Review cleanup records',
      'Assess response effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-10',
    name: 'Integrated Information Security Analysis Team',
    description:
      'FedRAMP requires organizations to establish an integrated team of forensic/malware analysts, tool developers, and real-time operations personnel.',
    category: 'Incident Response',
    implementationGuidance:
      'Form integrated security analysis team. Define team roles and capabilities. Establish collaboration procedures. Train team members.',
    evidenceRequirements: [
      'Team charter and membership',
      'Role and capability definitions',
      'Collaboration procedure documentation',
      'Training records',
      'Team effectiveness assessment',
    ],
    testProcedures: [
      'Review team composition',
      'Verify role definitions',
      'Test collaboration procedures',
      'Review training records',
      'Assess team effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-11',
    name: 'Incident Response Automation',
    description:
      'FedRAMP requires organizations to employ automated mechanisms to support the incident response process.',
    category: 'Incident Response',
    implementationGuidance:
      'Implement SOAR capabilities. Automate incident triage. Configure automated response actions. Monitor automation effectiveness.',
    evidenceRequirements: [
      'SOAR implementation documentation',
      'Automated triage configuration',
      'Response automation rules',
      'Effectiveness monitoring records',
      'Automation assessment',
    ],
    testProcedures: [
      'Test SOAR capabilities',
      'Verify automated triage',
      'Test response automation',
      'Review monitoring records',
      'Assess automation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-12',
    name: 'Malicious Code and Forensic Analysis',
    description:
      'FedRAMP requires organizations to analyze malicious code and conduct forensic analysis to support incident response.',
    category: 'Incident Response',
    implementationGuidance:
      'Establish malware analysis capability. Implement forensic analysis procedures. Preserve evidence chain of custody. Document analysis findings.',
    evidenceRequirements: [
      'Malware analysis capability documentation',
      'Forensic analysis procedures',
      'Chain of custody records',
      'Analysis finding reports',
      'Capability effectiveness assessment',
    ],
    testProcedures: [
      'Test malware analysis capability',
      'Review forensic procedures',
      'Verify chain of custody',
      'Review analysis reports',
      'Assess capability effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL RISK ASSESSMENT (RA) - 4 Controls
  // ============================================================
  {
    controlId: 'FR-RA-9',
    name: 'Criticality Analysis',
    description:
      'FedRAMP requires organizations to identify critical system components and functions by performing a criticality analysis.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Identify critical components. Assess component dependencies. Determine criticality levels. Document analysis findings.',
    evidenceRequirements: [
      'Criticality analysis documentation',
      'Critical component inventory',
      'Dependency mapping',
      'Criticality level assignments',
      'Analysis review records',
    ],
    testProcedures: [
      'Review criticality analysis',
      'Verify component inventory',
      'Examine dependency mapping',
      'Review criticality levels',
      'Assess analysis completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-10',
    name: 'Threat Hunting',
    description:
      'FedRAMP requires organizations to conduct a threat hunting capability to search for indicators of compromise.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Establish threat hunting program. Define hunting hypotheses. Conduct regular hunting activities. Document and act on findings.',
    evidenceRequirements: [
      'Threat hunting program documentation',
      'Hunting hypothesis records',
      'Hunting activity logs',
      'Finding documentation',
      'Program effectiveness assessment',
    ],
    testProcedures: [
      'Review hunting program',
      'Examine hunting hypotheses',
      'Review activity logs',
      'Verify finding documentation',
      'Assess program effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-11',
    name: 'Enterprise Risk Management Integration',
    description:
      'FedRAMP requires organizations to integrate risk assessment processes with enterprise risk management processes.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Align system risk with enterprise risk. Report risks to enterprise level. Incorporate enterprise guidance. Coordinate risk activities.',
    evidenceRequirements: [
      'Enterprise risk integration documentation',
      'Risk reporting procedures',
      'Enterprise guidance incorporation',
      'Coordination records',
      'Integration effectiveness assessment',
    ],
    testProcedures: [
      'Review integration documentation',
      'Verify risk reporting',
      'Examine enterprise guidance',
      'Review coordination records',
      'Assess integration effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-12',
    name: 'Mission and Business Process Definition',
    description:
      'FedRAMP requires organizations to define mission and business processes with consideration for information security.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Document mission and business processes. Identify security requirements per process. Assess process risks. Update process documentation regularly.',
    evidenceRequirements: [
      'Mission and business process documentation',
      'Process security requirements',
      'Process risk assessments',
      'Documentation update records',
      'Process security assessment',
    ],
    testProcedures: [
      'Review process documentation',
      'Verify security requirements',
      'Examine risk assessments',
      'Review update records',
      'Assess process security',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL AWARENESS AND TRAINING (AT) - 4 Controls
  // ============================================================
  {
    controlId: 'FR-AT-7',
    name: 'Role-Based Security Training',
    description:
      'FedRAMP requires organizations to provide role-based security training to personnel with assigned security roles.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Identify roles requiring specialized training. Develop role-based training curriculum. Deliver training before role assignment. Track training completion.',
    evidenceRequirements: [
      'Role-based training curriculum',
      'Training delivery records',
      'Completion tracking documentation',
      'Training effectiveness assessment',
      'Role assignment verification',
    ],
    testProcedures: [
      'Review training curriculum',
      'Verify training delivery',
      'Check completion tracking',
      'Assess training effectiveness',
      'Verify role assignment timing',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-8',
    name: 'Security Training Records',
    description:
      'FedRAMP requires organizations to document and monitor individual security training activities.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Maintain training records per individual. Track training completion status. Monitor training currency. Report training metrics.',
    evidenceRequirements: [
      'Individual training records',
      'Completion status tracking',
      'Currency monitoring records',
      'Training metrics reports',
      'Record retention evidence',
    ],
    testProcedures: [
      'Review individual records',
      'Verify completion tracking',
      'Check currency monitoring',
      'Review metrics reports',
      'Verify record retention',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-9',
    name: 'Simulated Attack Training',
    description:
      'FedRAMP requires organizations to include simulated events in security training to prepare personnel for actual incidents.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Design realistic attack simulations. Conduct regular phishing exercises. Provide feedback on performance. Track improvement over time.',
    evidenceRequirements: [
      'Simulation design documentation',
      'Exercise execution records',
      'Performance feedback records',
      'Improvement tracking metrics',
      'Simulation effectiveness assessment',
    ],
    testProcedures: [
      'Review simulation design',
      'Examine exercise records',
      'Verify feedback delivery',
      'Review improvement metrics',
      'Assess simulation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AT-10',
    name: 'Practical Exercises',
    description:
      'FedRAMP requires organizations to provide practical exercises that simulate actual cyber-attacks.',
    category: 'Awareness and Training',
    implementationGuidance:
      'Develop hands-on security exercises. Conduct tabletop and functional exercises. Evaluate participant performance. Apply lessons learned.',
    evidenceRequirements: [
      'Exercise curriculum documentation',
      'Exercise execution records',
      'Performance evaluation records',
      'Lessons learned documentation',
      'Exercise effectiveness assessment',
    ],
    testProcedures: [
      'Review exercise curriculum',
      'Examine execution records',
      'Verify performance evaluation',
      'Review lessons learned',
      'Assess exercise effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL SECURITY ASSESSMENT AND AUTHORIZATION (CA) - 3 Controls
  // ============================================================
  {
    controlId: 'FR-CA-13',
    name: 'Penetration Testing',
    description:
      'FedRAMP requires organizations to conduct penetration testing on an annual basis to identify exploitable vulnerabilities.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Engage qualified penetration testers. Define testing scope and rules. Conduct comprehensive testing. Remediate identified vulnerabilities.',
    evidenceRequirements: [
      'Penetration testing scope documentation',
      'Tester qualifications',
      'Testing methodology documentation',
      'Test results and findings',
      'Remediation tracking records',
    ],
    testProcedures: [
      'Review testing scope',
      'Verify tester qualifications',
      'Examine testing methodology',
      'Review test results',
      'Verify remediation activities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-14',
    name: 'Internal System Connections',
    description:
      'FedRAMP requires organizations to authorize internal connections of system components and monitor the connections.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Document internal system connections. Authorize each connection. Monitor connection activities. Review connections periodically.',
    evidenceRequirements: [
      'Internal connection inventory',
      'Connection authorization records',
      'Connection monitoring configuration',
      'Periodic review records',
      'Connection security assessment',
    ],
    testProcedures: [
      'Review connection inventory',
      'Verify connection authorizations',
      'Test connection monitoring',
      'Examine review records',
      'Assess connection security',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-15',
    name: 'Security Control Assessment Automation',
    description:
      'FedRAMP requires organizations to employ automated mechanisms to support security control assessment activities.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Implement automated assessment tools. Configure continuous assessment. Generate automated assessment reports. Monitor assessment coverage.',
    evidenceRequirements: [
      'Assessment automation implementation',
      'Continuous assessment configuration',
      'Automated assessment reports',
      'Coverage monitoring records',
      'Automation effectiveness assessment',
    ],
    testProcedures: [
      'Test assessment automation',
      'Verify continuous assessment',
      'Review automated reports',
      'Examine coverage monitoring',
      'Assess automation effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL MEDIA PROTECTION (MP) - 3 Controls
  // ============================================================
  {
    controlId: 'FR-MP-11',
    name: 'Media Use',
    description:
      'FedRAMP requires organizations to restrict the use of types of digital media on systems or system components.',
    category: 'Media Protection',
    implementationGuidance:
      'Define authorized media types. Implement technical media restrictions. Monitor media usage. Enforce media policies.',
    evidenceRequirements: [
      'Authorized media type documentation',
      'Technical restriction implementation',
      'Media usage monitoring records',
      'Policy enforcement records',
      'Media use assessment',
    ],
    testProcedures: [
      'Review authorized media types',
      'Test technical restrictions',
      'Verify usage monitoring',
      'Examine enforcement records',
      'Assess media controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-12',
    name: 'Media Downgrading',
    description:
      'FedRAMP requires organizations to downgrade media containing sensitive information before release for reuse.',
    category: 'Media Protection',
    implementationGuidance:
      'Define downgrading procedures. Implement approved sanitization techniques. Verify downgrading effectiveness. Document downgrading activities.',
    evidenceRequirements: [
      'Downgrading procedure documentation',
      'Sanitization technique approvals',
      'Effectiveness verification records',
      'Activity documentation',
      'Downgrading assessment',
    ],
    testProcedures: [
      'Review downgrading procedures',
      'Verify sanitization techniques',
      'Test effectiveness verification',
      'Review activity documentation',
      'Assess downgrading controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MP-13',
    name: 'Digital Media Labeling',
    description:
      'FedRAMP requires organizations to mark digital media with appropriate security labels indicating distribution limitations.',
    category: 'Media Protection',
    implementationGuidance:
      'Define labeling requirements. Implement automated labeling where possible. Verify label accuracy. Monitor labeling compliance.',
    evidenceRequirements: [
      'Labeling requirements documentation',
      'Automated labeling implementation',
      'Label accuracy verification records',
      'Compliance monitoring records',
      'Labeling effectiveness assessment',
    ],
    testProcedures: [
      'Review labeling requirements',
      'Test automated labeling',
      'Verify label accuracy',
      'Examine compliance monitoring',
      'Assess labeling effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADDITIONAL ACCESS CONTROL (AC) - 3 Controls
  // ============================================================
  {
    controlId: 'FR-AC-20',
    name: 'Use of External Systems',
    description:
      'FedRAMP requires organizations to establish terms and conditions for authorized individuals to access the system from external systems.',
    category: 'Access Control',
    implementationGuidance:
      'Define external system access policies. Establish access terms and conditions. Verify external system security. Monitor external access.',
    evidenceRequirements: [
      'External access policy documentation',
      'Terms and conditions documentation',
      'External system security verification',
      'Access monitoring records',
      'External access assessment',
    ],
    testProcedures: [
      'Review external access policy',
      'Verify terms and conditions',
      'Examine security verification',
      'Review monitoring records',
      'Assess external access controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-21',
    name: 'Information Sharing',
    description:
      'FedRAMP requires organizations to facilitate information sharing by enabling authorized users to determine access permissions.',
    category: 'Access Control',
    implementationGuidance:
      'Implement information sharing controls. Enable user-defined permissions where appropriate. Audit sharing activities. Enforce sharing boundaries.',
    evidenceRequirements: [
      'Information sharing policy',
      'User permission mechanisms',
      'Sharing activity audit logs',
      'Boundary enforcement configuration',
      'Sharing controls assessment',
    ],
    testProcedures: [
      'Review sharing policy',
      'Test permission mechanisms',
      'Review audit logs',
      'Verify boundary enforcement',
      'Assess sharing controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-22',
    name: 'Publicly Accessible Content',
    description:
      'FedRAMP requires organizations to designate individuals authorized to post information publicly and review content for nonpublic information.',
    category: 'Access Control',
    implementationGuidance:
      'Designate authorized content publishers. Implement content review process. Train publishers on requirements. Monitor public content.',
    evidenceRequirements: [
      'Authorized publisher designations',
      'Content review procedures',
      'Publisher training records',
      'Public content monitoring records',
      'Content control assessment',
    ],
    testProcedures: [
      'Verify publisher designations',
      'Review content review process',
      'Examine training records',
      'Review monitoring records',
      'Assess content controls',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FEDRAMP HIGH BASELINE - ACCESS CONTROL ENHANCEMENTS
  // ============================================================
  {
    controlId: 'FR-AC-2(1)',
    name: 'Account Management | Automated System Account Management',
    description:
      'FedRAMP High requires organizations to employ automated mechanisms to support the management of information system accounts.',
    category: 'Access Control',
    implementationGuidance:
      'Implement automated account provisioning. Configure automatic account disabling. Use automated account review workflows. Monitor account lifecycle automatically.',
    evidenceRequirements: [
      'Automated account management system documentation',
      'Provisioning workflow configuration',
      'Automatic disabling rules',
      'Automated review workflow evidence',
      'Account lifecycle monitoring logs',
    ],
    testProcedures: [
      'Test automated provisioning',
      'Verify automatic account disabling',
      'Review automated workflows',
      'Examine lifecycle monitoring',
      'Assess automation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(2)',
    name: 'Account Management | Removal of Temporary/Emergency Accounts',
    description:
      'FedRAMP High requires automatic removal of temporary and emergency accounts after a defined time period.',
    category: 'Access Control',
    implementationGuidance:
      'Configure automatic expiration for temporary accounts. Set emergency account time limits. Implement automatic account removal. Monitor temporary account usage.',
    evidenceRequirements: [
      'Temporary account policy documentation',
      'Automatic expiration configuration',
      'Emergency account time limit settings',
      'Automatic removal logs',
      'Usage monitoring records',
    ],
    testProcedures: [
      'Test automatic expiration',
      'Verify emergency account limits',
      'Review removal processes',
      'Examine usage monitoring',
      'Assess removal effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(3)',
    name: 'Account Management | Disable Inactive Accounts',
    description:
      'FedRAMP High requires automatic disabling of inactive accounts after a defined period of inactivity.',
    category: 'Access Control',
    implementationGuidance:
      'Define inactivity thresholds. Configure automatic account disabling. Monitor account activity. Alert on pending disablement.',
    evidenceRequirements: [
      'Inactivity threshold documentation',
      'Automatic disabling configuration',
      'Activity monitoring setup',
      'Alerting configuration',
      'Disabling effectiveness assessment',
    ],
    testProcedures: [
      'Verify inactivity thresholds',
      'Test automatic disabling',
      'Review activity monitoring',
      'Test alerting functions',
      'Assess disabling effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(4)',
    name: 'Account Management | Automated Audit Actions',
    description:
      'FedRAMP High requires automatic audit of account creation, modification, enabling, disabling, and removal actions.',
    category: 'Access Control',
    implementationGuidance:
      'Configure comprehensive account action auditing. Automate audit log generation. Alert on suspicious account activities. Retain audit logs appropriately.',
    evidenceRequirements: [
      'Audit configuration documentation',
      'Account action logging evidence',
      'Alerting rule configuration',
      'Log retention settings',
      'Audit effectiveness assessment',
    ],
    testProcedures: [
      'Test account action auditing',
      'Verify log generation',
      'Test suspicious activity alerts',
      'Review log retention',
      'Assess audit completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(5)',
    name: 'Account Management | Inactivity Logout',
    description:
      'FedRAMP High requires logout of users after a defined period of inactivity.',
    category: 'Access Control',
    implementationGuidance:
      'Configure session inactivity timeouts. Implement automatic logout. Provide user warning before logout. Log automatic logout events.',
    evidenceRequirements: [
      'Inactivity timeout configuration',
      'Automatic logout implementation',
      'User warning configuration',
      'Logout event logs',
      'Timeout effectiveness assessment',
    ],
    testProcedures: [
      'Test inactivity timeouts',
      'Verify automatic logout',
      'Test user warnings',
      'Review logout logs',
      'Assess timeout effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(11)',
    name: 'Account Management | Usage Conditions',
    description:
      'FedRAMP High requires enforcement of usage conditions for information system accounts.',
    category: 'Access Control',
    implementationGuidance:
      'Define account usage conditions. Implement technical enforcement. Monitor compliance with conditions. Take action on violations.',
    evidenceRequirements: [
      'Usage condition documentation',
      'Technical enforcement configuration',
      'Compliance monitoring records',
      'Violation response records',
      'Condition enforcement assessment',
    ],
    testProcedures: [
      'Review usage conditions',
      'Test technical enforcement',
      'Verify compliance monitoring',
      'Review violation responses',
      'Assess enforcement effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(12)',
    name: 'Account Management | Account Monitoring / Atypical Usage',
    description:
      'FedRAMP High requires monitoring of accounts for atypical usage.',
    category: 'Access Control',
    implementationGuidance:
      'Implement user behavior analytics. Define atypical usage baselines. Monitor for anomalies. Alert and investigate atypical patterns.',
    evidenceRequirements: [
      'Behavior analytics implementation',
      'Baseline definition documentation',
      'Anomaly monitoring configuration',
      'Alert and investigation records',
      'Monitoring effectiveness assessment',
    ],
    testProcedures: [
      'Test behavior analytics',
      'Verify baseline definitions',
      'Test anomaly detection',
      'Review alert handling',
      'Assess monitoring effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-2(13)',
    name: 'Account Management | Disable Accounts for High-Risk Individuals',
    description:
      'FedRAMP High requires disabling accounts of individuals within a defined time period of discovery of significant risk.',
    category: 'Access Control',
    implementationGuidance:
      'Define high-risk criteria. Establish rapid disabling procedures. Implement immediate disabling capability. Document risk-based disabling actions.',
    evidenceRequirements: [
      'High-risk criteria documentation',
      'Rapid disabling procedures',
      'Immediate disabling capability evidence',
      'Risk-based action records',
      'Disabling effectiveness assessment',
    ],
    testProcedures: [
      'Review risk criteria',
      'Test rapid disabling',
      'Verify immediate capability',
      'Review action records',
      'Assess disabling timeliness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-3(2)',
    name: 'Access Enforcement | Dual Authorization',
    description:
      'FedRAMP High requires dual authorization for executing critical or sensitive operations.',
    category: 'Access Control',
    implementationGuidance:
      'Identify operations requiring dual authorization. Implement two-person integrity controls. Configure approval workflows. Log dual authorization events.',
    evidenceRequirements: [
      'Dual authorization policy',
      'Operations list requiring dual auth',
      'Approval workflow configuration',
      'Authorization event logs',
      'Dual auth effectiveness assessment',
    ],
    testProcedures: [
      'Review dual auth policy',
      'Test two-person controls',
      'Verify approval workflows',
      'Review authorization logs',
      'Assess dual auth effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-4(4)',
    name: 'Information Flow Enforcement | Content Check Encrypted Information',
    description:
      'FedRAMP High requires checking encrypted information for malware and content violations.',
    category: 'Access Control',
    implementationGuidance:
      'Implement SSL/TLS inspection. Configure content inspection for encrypted traffic. Deploy decryption capabilities. Monitor inspection effectiveness.',
    evidenceRequirements: [
      'SSL inspection implementation',
      'Content inspection configuration',
      'Decryption capability documentation',
      'Inspection effectiveness metrics',
      'Privacy protection measures',
    ],
    testProcedures: [
      'Test SSL inspection',
      'Verify content checking',
      'Review decryption process',
      'Assess inspection effectiveness',
      'Verify privacy protections',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6(1)',
    name: 'Least Privilege | Authorize Access to Security Functions',
    description:
      'FedRAMP High requires explicit authorization for access to security-relevant functions.',
    category: 'Access Control',
    implementationGuidance:
      'Identify security functions. Require explicit authorization. Implement access controls. Audit security function access.',
    evidenceRequirements: [
      'Security function inventory',
      'Authorization requirements documentation',
      'Access control implementation',
      'Access audit logs',
      'Authorization effectiveness assessment',
    ],
    testProcedures: [
      'Review security functions',
      'Verify authorization requirements',
      'Test access controls',
      'Review audit logs',
      'Assess authorization effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6(2)',
    name: 'Least Privilege | Non-Privileged Access for Nonsecurity Functions',
    description:
      'FedRAMP High requires users to use non-privileged accounts for non-security functions.',
    category: 'Access Control',
    implementationGuidance:
      'Require separate privileged and non-privileged accounts. Enforce non-privileged use for routine tasks. Monitor privileged account usage. Audit privilege escalation.',
    evidenceRequirements: [
      'Account separation policy',
      'Non-privileged usage enforcement',
      'Privileged account monitoring',
      'Escalation audit logs',
      'Separation effectiveness assessment',
    ],
    testProcedures: [
      'Verify account separation',
      'Test usage enforcement',
      'Review monitoring records',
      'Examine escalation audits',
      'Assess separation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6(3)',
    name: 'Least Privilege | Network Access to Privileged Commands',
    description:
      'FedRAMP High requires authorization of network access to privileged commands only for compelling operational needs.',
    category: 'Access Control',
    implementationGuidance:
      'Identify privileged commands accessible via network. Document operational justifications. Implement access restrictions. Monitor network privileged access.',
    evidenceRequirements: [
      'Privileged command inventory',
      'Operational justifications',
      'Access restriction configuration',
      'Network access monitoring logs',
      'Justification review records',
    ],
    testProcedures: [
      'Review privileged commands',
      'Verify operational justifications',
      'Test access restrictions',
      'Review monitoring logs',
      'Assess justification validity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6(5)',
    name: 'Least Privilege | Privileged Accounts',
    description:
      'FedRAMP High requires restricting privileged accounts on the system to a defined set of personnel or roles.',
    category: 'Access Control',
    implementationGuidance:
      'Define authorized privileged users. Restrict privileged account creation. Review privileged access regularly. Remove unnecessary privileges.',
    evidenceRequirements: [
      'Authorized privileged user list',
      'Account creation restrictions',
      'Privileged access review records',
      'Privilege removal records',
      'Restriction effectiveness assessment',
    ],
    testProcedures: [
      'Verify authorized user list',
      'Test creation restrictions',
      'Review access reviews',
      'Verify privilege removals',
      'Assess restriction effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6(9)',
    name: 'Least Privilege | Auditing Use of Privileged Functions',
    description:
      'FedRAMP High requires auditing the execution of privileged functions.',
    category: 'Access Control',
    implementationGuidance:
      'Identify privileged functions. Configure comprehensive auditing. Monitor privileged function execution. Alert on suspicious privileged activity.',
    evidenceRequirements: [
      'Privileged function inventory',
      'Audit configuration documentation',
      'Execution monitoring logs',
      'Alert configuration and records',
      'Audit completeness assessment',
    ],
    testProcedures: [
      'Review privileged functions',
      'Verify audit configuration',
      'Examine execution logs',
      'Test alerting functions',
      'Assess audit completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-6(10)',
    name: 'Least Privilege | Prohibit Non-Privileged Users from Executing Privileged Functions',
    description:
      'FedRAMP High requires preventing non-privileged users from executing privileged functions.',
    category: 'Access Control',
    implementationGuidance:
      'Implement privilege separation. Configure access controls to prevent execution. Monitor for unauthorized privilege use. Alert on privilege violations.',
    evidenceRequirements: [
      'Privilege separation implementation',
      'Access control configuration',
      'Unauthorized usage monitoring',
      'Violation alert records',
      'Prevention effectiveness assessment',
    ],
    testProcedures: [
      'Test privilege separation',
      'Verify access controls',
      'Review monitoring records',
      'Test violation alerts',
      'Assess prevention effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-10',
    name: 'Concurrent Session Control',
    description:
      'FedRAMP High requires limiting the number of concurrent sessions for each user account.',
    category: 'Access Control',
    implementationGuidance:
      'Define concurrent session limits by account type. Implement session limit enforcement. Monitor concurrent sessions. Alert on limit violations.',
    evidenceRequirements: [
      'Session limit policy documentation',
      'Enforcement mechanism configuration',
      'Session monitoring records',
      'Limit violation alerts',
      'Enforcement effectiveness assessment',
    ],
    testProcedures: [
      'Review session limits',
      'Test enforcement mechanisms',
      'Verify session monitoring',
      'Test violation alerts',
      'Assess enforcement effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-12',
    name: 'Session Termination',
    description:
      'FedRAMP High requires automatic termination of user sessions after defined conditions.',
    category: 'Access Control',
    implementationGuidance:
      'Define session termination conditions. Implement automatic termination. Log session termination events. Provide user notification of termination.',
    evidenceRequirements: [
      'Termination condition documentation',
      'Automatic termination configuration',
      'Termination event logs',
      'User notification evidence',
      'Termination effectiveness assessment',
    ],
    testProcedures: [
      'Review termination conditions',
      'Test automatic termination',
      'Verify event logging',
      'Test user notifications',
      'Assess termination effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AC-16',
    name: 'Security Attributes',
    description:
      'FedRAMP High requires providing the means to associate security attributes with information.',
    category: 'Access Control',
    implementationGuidance:
      'Define security attribute schema. Implement attribute assignment mechanisms. Enforce attribute-based access control. Monitor attribute changes.',
    evidenceRequirements: [
      'Security attribute schema documentation',
      'Assignment mechanism configuration',
      'ABAC implementation evidence',
      'Attribute change monitoring logs',
      'Attribute effectiveness assessment',
    ],
    testProcedures: [
      'Review attribute schema',
      'Test assignment mechanisms',
      'Verify ABAC implementation',
      'Review change monitoring',
      'Assess attribute effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FEDRAMP HIGH BASELINE - AUDIT ENHANCEMENTS
  // ============================================================
  {
    controlId: 'FR-AU-2(3)',
    name: 'Audit Events | Reviews and Updates',
    description:
      'FedRAMP High requires reviewing and updating audited events on a defined frequency.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Establish audit event review schedule. Update audited events based on threat intelligence. Document review decisions. Implement approved changes.',
    evidenceRequirements: [
      'Audit event review schedule',
      'Review meeting records',
      'Event update documentation',
      'Change implementation records',
      'Review effectiveness assessment',
    ],
    testProcedures: [
      'Verify review schedule',
      'Review meeting records',
      'Examine event updates',
      'Verify change implementation',
      'Assess review effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-3(1)',
    name: 'Content of Audit Records | Additional Audit Information',
    description:
      'FedRAMP High requires generating audit records containing additional, more detailed information.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Define additional audit information requirements. Configure systems to capture detailed audit data. Verify audit record completeness. Store additional data securely.',
    evidenceRequirements: [
      'Additional information requirements',
      'Detailed audit configuration',
      'Completeness verification records',
      'Secure storage evidence',
      'Information adequacy assessment',
    ],
    testProcedures: [
      'Review information requirements',
      'Verify detailed configuration',
      'Test record completeness',
      'Verify secure storage',
      'Assess information adequacy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-3(2)',
    name: 'Content of Audit Records | Centralized Management',
    description:
      'FedRAMP High requires centralized management of content of audit records.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement centralized audit management. Define consistent audit record format. Deploy centralized audit configuration. Monitor configuration compliance.',
    evidenceRequirements: [
      'Centralized management implementation',
      'Record format standards',
      'Centralized configuration evidence',
      'Compliance monitoring records',
      'Centralization effectiveness assessment',
    ],
    testProcedures: [
      'Test centralized management',
      'Verify format consistency',
      'Review configuration deployment',
      'Examine compliance monitoring',
      'Assess centralization effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-4(1)',
    name: 'Audit Storage Capacity | Transfer to Alternate Storage',
    description:
      'FedRAMP High requires transfer of audit logs to alternate storage when audit storage capacity is reached.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Configure automatic audit log transfer. Define alternate storage locations. Monitor storage capacity. Test transfer mechanisms.',
    evidenceRequirements: [
      'Automatic transfer configuration',
      'Alternate storage documentation',
      'Capacity monitoring records',
      'Transfer testing records',
      'Transfer effectiveness assessment',
    ],
    testProcedures: [
      'Verify transfer configuration',
      'Test alternate storage',
      'Review capacity monitoring',
      'Test transfer mechanisms',
      'Assess transfer effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-5(1)',
    name: 'Response to Audit Processing Failures | Audit Storage Capacity',
    description:
      'FedRAMP High requires alerting when audit log storage volume reaches a defined percentage of capacity.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Define storage capacity thresholds. Configure capacity alerting. Monitor storage utilization. Respond to capacity alerts promptly.',
    evidenceRequirements: [
      'Capacity threshold documentation',
      'Alerting configuration evidence',
      'Utilization monitoring records',
      'Alert response records',
      'Alerting effectiveness assessment',
    ],
    testProcedures: [
      'Review capacity thresholds',
      'Test alerting functions',
      'Verify utilization monitoring',
      'Review response records',
      'Assess alerting effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-5(2)',
    name: 'Response to Audit Processing Failures | Real-Time Alerts',
    description:
      'FedRAMP High requires real-time alerts when defined audit failure events occur.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Define audit failure events requiring alerts. Configure real-time alerting. Test alert delivery. Document alert response procedures.',
    evidenceRequirements: [
      'Failure event definitions',
      'Real-time alerting configuration',
      'Alert delivery testing records',
      'Response procedure documentation',
      'Alerting effectiveness assessment',
    ],
    testProcedures: [
      'Review failure event definitions',
      'Test real-time alerts',
      'Verify alert delivery',
      'Review response procedures',
      'Assess alerting effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-6(1)',
    name: 'Audit Review, Analysis, and Reporting | Process Integration',
    description:
      'FedRAMP High requires employing automated mechanisms to integrate audit review, analysis, and reporting.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement SIEM or similar platform. Integrate all audit sources. Automate analysis and correlation. Generate automated reports.',
    evidenceRequirements: [
      'SIEM implementation documentation',
      'Source integration evidence',
      'Automated analysis configuration',
      'Automated report examples',
      'Integration effectiveness assessment',
    ],
    testProcedures: [
      'Verify SIEM implementation',
      'Test source integration',
      'Review analysis automation',
      'Examine report generation',
      'Assess integration effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-6(3)',
    name: 'Audit Review, Analysis, and Reporting | Correlate Audit Repositories',
    description:
      'FedRAMP High requires analysis and correlation of audit records across different repositories.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Identify all audit repositories. Implement cross-repository correlation. Establish correlation rules. Monitor correlation effectiveness.',
    evidenceRequirements: [
      'Audit repository inventory',
      'Correlation implementation evidence',
      'Correlation rule documentation',
      'Effectiveness monitoring records',
      'Correlation capability assessment',
    ],
    testProcedures: [
      'Review repository inventory',
      'Test correlation capabilities',
      'Verify correlation rules',
      'Examine effectiveness monitoring',
      'Assess correlation capabilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-6(5)',
    name: 'Audit Review, Analysis, and Reporting | Integrated Analysis of Audit Records',
    description:
      'FedRAMP High requires integration of analysis of audit records with analysis of other data sources.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Identify relevant non-audit data sources. Integrate with audit analysis platform. Develop cross-source analytics. Monitor integrated analysis effectiveness.',
    evidenceRequirements: [
      'Non-audit data source inventory',
      'Integration implementation evidence',
      'Cross-source analytics documentation',
      'Effectiveness monitoring records',
      'Integrated analysis assessment',
    ],
    testProcedures: [
      'Review data source inventory',
      'Test integration',
      'Verify cross-source analytics',
      'Examine effectiveness monitoring',
      'Assess integrated analysis',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-6(6)',
    name: 'Audit Review, Analysis, and Reporting | Correlation with Physical Monitoring',
    description:
      'FedRAMP High requires correlation of audit record information with information from physical access monitoring.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Integrate physical access logs with audit system. Correlate physical and logical access events. Alert on access anomalies. Investigate correlated events.',
    evidenceRequirements: [
      'Physical access log integration',
      'Correlation configuration evidence',
      'Anomaly alerting records',
      'Investigation records',
      'Correlation effectiveness assessment',
    ],
    testProcedures: [
      'Verify physical log integration',
      'Test correlation functions',
      'Test anomaly alerts',
      'Review investigations',
      'Assess correlation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-7',
    name: 'Audit Reduction and Report Generation',
    description:
      'FedRAMP High requires an audit reduction and report generation capability.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement audit reduction tools. Configure report generation capabilities. Enable filtering and search. Support investigation requirements.',
    evidenceRequirements: [
      'Audit reduction tool documentation',
      'Report generation configuration',
      'Filtering and search capabilities',
      'Investigation support evidence',
      'Capability effectiveness assessment',
    ],
    testProcedures: [
      'Test reduction tools',
      'Verify report generation',
      'Test filtering and search',
      'Verify investigation support',
      'Assess capability effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-7(1)',
    name: 'Audit Reduction and Report Generation | Automatic Processing',
    description:
      'FedRAMP High requires automatic processing of audit records for events of interest.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Define events of interest. Configure automatic processing rules. Generate alerts for significant events. Enable automated response.',
    evidenceRequirements: [
      'Events of interest documentation',
      'Automatic processing configuration',
      'Alert generation records',
      'Automated response evidence',
      'Processing effectiveness assessment',
    ],
    testProcedures: [
      'Review events of interest',
      'Test automatic processing',
      'Verify alert generation',
      'Test automated responses',
      'Assess processing effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-9(2)',
    name: 'Protection of Audit Information | Audit Backup on Separate Physical Systems',
    description:
      'FedRAMP High requires backup of audit records to a physically different system than the system being audited.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Identify separate backup systems. Configure real-time audit backup. Verify physical separation. Test backup integrity.',
    evidenceRequirements: [
      'Separate backup system documentation',
      'Real-time backup configuration',
      'Physical separation evidence',
      'Backup integrity testing records',
      'Backup effectiveness assessment',
    ],
    testProcedures: [
      'Verify backup systems',
      'Test real-time backup',
      'Confirm physical separation',
      'Verify backup integrity',
      'Assess backup effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-9(3)',
    name: 'Protection of Audit Information | Cryptographic Protection',
    description:
      'FedRAMP High requires cryptographic protection of the integrity of audit information and audit tools.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement cryptographic integrity protection. Use digital signatures for audit records. Protect audit tools with cryptography. Verify cryptographic controls.',
    evidenceRequirements: [
      'Cryptographic protection implementation',
      'Digital signature configuration',
      'Tool protection evidence',
      'Control verification records',
      'Cryptographic effectiveness assessment',
    ],
    testProcedures: [
      'Test integrity protection',
      'Verify digital signatures',
      'Review tool protection',
      'Examine verification records',
      'Assess cryptographic effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-9(4)',
    name: 'Protection of Audit Information | Access by Subset of Privileged Users',
    description:
      'FedRAMP High requires authorizing access to audit functionality only to a subset of privileged users.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Define authorized audit administrators. Restrict audit access to approved users. Monitor audit function access. Review access authorizations regularly.',
    evidenceRequirements: [
      'Authorized administrator list',
      'Access restriction configuration',
      'Access monitoring logs',
      'Authorization review records',
      'Access control effectiveness assessment',
    ],
    testProcedures: [
      'Verify administrator list',
      'Test access restrictions',
      'Review monitoring logs',
      'Examine authorization reviews',
      'Assess access control effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-10',
    name: 'Non-Repudiation',
    description:
      'FedRAMP High requires protection against an individual falsely denying having performed actions.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement non-repudiation mechanisms. Use digital signatures where appropriate. Maintain chain of custody for evidence. Protect non-repudiation data.',
    evidenceRequirements: [
      'Non-repudiation mechanism documentation',
      'Digital signature implementation',
      'Chain of custody procedures',
      'Data protection evidence',
      'Non-repudiation effectiveness assessment',
    ],
    testProcedures: [
      'Test non-repudiation mechanisms',
      'Verify digital signatures',
      'Review chain of custody',
      'Verify data protection',
      'Assess non-repudiation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-12(1)',
    name: 'Audit Generation | System-Wide / Time-Correlated Audit Trail',
    description:
      'FedRAMP High requires compiling audit records from multiple components into a system-wide, time-correlated audit trail.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Implement centralized audit collection. Synchronize time across all components. Correlate events by timestamp. Enable unified audit trail analysis.',
    evidenceRequirements: [
      'Centralized collection implementation',
      'Time synchronization configuration',
      'Event correlation evidence',
      'Unified analysis capabilities',
      'Audit trail effectiveness assessment',
    ],
    testProcedures: [
      'Test centralized collection',
      'Verify time synchronization',
      'Test event correlation',
      'Review analysis capabilities',
      'Assess audit trail effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-AU-12(3)',
    name: 'Audit Generation | Changes by Authorized Individuals',
    description:
      'FedRAMP High requires authorized individuals to change the auditing to be performed based on selectable event criteria.',
    category: 'Audit and Accountability',
    implementationGuidance:
      'Enable flexible audit configuration. Define selectable event criteria. Authorize audit configuration changes. Log all audit configuration modifications.',
    evidenceRequirements: [
      'Flexible audit configuration evidence',
      'Event criteria documentation',
      'Authorization requirements',
      'Configuration change logs',
      'Flexibility effectiveness assessment',
    ],
    testProcedures: [
      'Test configuration flexibility',
      'Review event criteria',
      'Verify authorization controls',
      'Review change logs',
      'Assess flexibility effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FEDRAMP HIGH BASELINE - IDENTIFICATION & AUTHENTICATION ENHANCEMENTS
  // ============================================================
  {
    controlId: 'FR-IA-2(1)',
    name: 'Identification and Authentication | Multi-Factor Authentication to Privileged Accounts',
    description:
      'FedRAMP High requires implementation of multi-factor authentication for network access to privileged accounts.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement MFA for all privileged access. Configure hardware tokens or authenticator apps. Enforce MFA at all entry points. Monitor MFA usage.',
    evidenceRequirements: [
      'MFA implementation documentation',
      'Token or app configuration',
      'Entry point enforcement evidence',
      'MFA usage monitoring logs',
      'MFA effectiveness assessment',
    ],
    testProcedures: [
      'Test MFA for privileged access',
      'Verify token configuration',
      'Test all entry points',
      'Review usage monitoring',
      'Assess MFA effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-2(2)',
    name: 'Identification and Authentication | Multi-Factor Authentication to Non-Privileged Accounts',
    description:
      'FedRAMP High requires implementation of multi-factor authentication for network access to non-privileged accounts.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Extend MFA to all user accounts. Support multiple MFA options. Ensure MFA coverage for all access methods. Monitor MFA adoption.',
    evidenceRequirements: [
      'MFA extension documentation',
      'MFA option availability',
      'Access method coverage evidence',
      'Adoption monitoring records',
      'MFA coverage assessment',
    ],
    testProcedures: [
      'Test MFA for non-privileged access',
      'Verify MFA options',
      'Test all access methods',
      'Review adoption records',
      'Assess MFA coverage',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-2(5)',
    name: 'Identification and Authentication | Group Authentication',
    description:
      'FedRAMP High requires individual authentication when group authenticators are employed.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Require individual authentication before group access. Track individual identity within groups. Audit individual actions in group contexts. Prevent anonymous group access.',
    evidenceRequirements: [
      'Individual authentication requirements',
      'Identity tracking mechanisms',
      'Individual action audit logs',
      'Anonymous access prevention',
      'Group authentication assessment',
    ],
    testProcedures: [
      'Test individual authentication',
      'Verify identity tracking',
      'Review action audits',
      'Test anonymous access prevention',
      'Assess group authentication',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-2(8)',
    name: 'Identification and Authentication | Network Access to Privileged Accounts - Replay Resistant',
    description:
      'FedRAMP High requires replay-resistant authentication mechanisms for network access to privileged accounts.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement replay-resistant protocols. Use challenge-response mechanisms. Deploy time-based tokens. Monitor for replay attacks.',
    evidenceRequirements: [
      'Replay-resistant protocol documentation',
      'Challenge-response configuration',
      'Time-based token implementation',
      'Replay attack monitoring',
      'Replay resistance assessment',
    ],
    testProcedures: [
      'Test replay resistance',
      'Verify challenge-response',
      'Test time-based tokens',
      'Review attack monitoring',
      'Assess replay resistance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-2(11)',
    name: 'Identification and Authentication | Remote Access - Separate Device',
    description:
      'FedRAMP High requires using a separate device for one of the factors during multi-factor authentication for remote access.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Require out-of-band authentication factor. Implement separate device verification. Ensure factor independence. Monitor separate device usage.',
    evidenceRequirements: [
      'Out-of-band authentication configuration',
      'Separate device verification evidence',
      'Factor independence documentation',
      'Device usage monitoring logs',
      'Separate device effectiveness assessment',
    ],
    testProcedures: [
      'Test out-of-band authentication',
      'Verify device separation',
      'Confirm factor independence',
      'Review usage monitoring',
      'Assess separate device effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-2(12)',
    name: 'Identification and Authentication | Acceptance of PIV Credentials',
    description:
      'FedRAMP High requires accepting and electronically verifying Personal Identity Verification (PIV) credentials.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Configure PIV card acceptance. Implement certificate validation. Connect to federal PKI. Monitor PIV authentication events.',
    evidenceRequirements: [
      'PIV acceptance configuration',
      'Certificate validation implementation',
      'Federal PKI connection evidence',
      'PIV authentication logs',
      'PIV integration assessment',
    ],
    testProcedures: [
      'Test PIV acceptance',
      'Verify certificate validation',
      'Test PKI connection',
      'Review authentication logs',
      'Assess PIV integration',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-3',
    name: 'Device Identification and Authentication',
    description:
      'FedRAMP High requires uniquely identifying and authenticating devices before establishing a connection.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement device certificates. Configure device authentication. Maintain device inventory. Monitor device authentication events.',
    evidenceRequirements: [
      'Device certificate implementation',
      'Device authentication configuration',
      'Device inventory documentation',
      'Authentication event logs',
      'Device authentication assessment',
    ],
    testProcedures: [
      'Test device certificates',
      'Verify device authentication',
      'Review device inventory',
      'Examine authentication logs',
      'Assess device authentication',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-4(4)',
    name: 'Identifier Management | Identify User Status',
    description:
      'FedRAMP High requires managing individual identifiers by uniquely identifying each individual as a specific user category.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Define user categories. Assign category attributes to identifiers. Track category changes. Audit category assignments.',
    evidenceRequirements: [
      'User category definitions',
      'Category attribute assignments',
      'Category change tracking records',
      'Category assignment audit logs',
      'Category management assessment',
    ],
    testProcedures: [
      'Review user categories',
      'Verify attribute assignments',
      'Test category tracking',
      'Review audit logs',
      'Assess category management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(1)',
    name: 'Authenticator Management | Password-Based Authentication',
    description:
      'FedRAMP High requires enforcing minimum password complexity and change requirements.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Configure minimum password length. Enforce complexity requirements. Implement password history. Set maximum password age.',
    evidenceRequirements: [
      'Password length configuration',
      'Complexity requirement settings',
      'Password history configuration',
      'Maximum age settings',
      'Password policy effectiveness assessment',
    ],
    testProcedures: [
      'Test password length enforcement',
      'Verify complexity requirements',
      'Test password history',
      'Verify age enforcement',
      'Assess policy effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(2)',
    name: 'Authenticator Management | PKI-Based Authentication',
    description:
      'FedRAMP High requires validating certifications by constructing and verifying a certification path.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Implement PKI infrastructure. Configure certificate validation. Check certificate revocation. Monitor certificate usage.',
    evidenceRequirements: [
      'PKI infrastructure documentation',
      'Certificate validation configuration',
      'Revocation checking evidence',
      'Usage monitoring logs',
      'PKI effectiveness assessment',
    ],
    testProcedures: [
      'Test PKI infrastructure',
      'Verify certificate validation',
      'Test revocation checking',
      'Review usage monitoring',
      'Assess PKI effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(3)',
    name: 'Authenticator Management | In-Person or Trusted Third-Party Registration',
    description:
      'FedRAMP High requires in-person or trusted third-party registration for receiving authenticators.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Define in-person registration procedures. Identify trusted third parties. Implement identity verification. Document registration activities.',
    evidenceRequirements: [
      'In-person registration procedures',
      'Trusted third-party documentation',
      'Identity verification records',
      'Registration activity logs',
      'Registration effectiveness assessment',
    ],
    testProcedures: [
      'Review registration procedures',
      'Verify third-party identification',
      'Test identity verification',
      'Review activity logs',
      'Assess registration effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(6)',
    name: 'Authenticator Management | Protection of Authenticators',
    description:
      'FedRAMP High requires protection of authenticators commensurate with the security category of the information.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Define authenticator protection requirements. Implement appropriate safeguards. Monitor authenticator security. Respond to compromises promptly.',
    evidenceRequirements: [
      'Protection requirement documentation',
      'Safeguard implementation evidence',
      'Security monitoring records',
      'Compromise response records',
      'Protection effectiveness assessment',
    ],
    testProcedures: [
      'Review protection requirements',
      'Verify safeguard implementation',
      'Test security monitoring',
      'Review compromise responses',
      'Assess protection effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(7)',
    name: 'Authenticator Management | No Embedded Unencrypted Static Authenticators',
    description:
      'FedRAMP High requires no embedding of unencrypted static authenticators in applications or scripts.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Scan code for embedded credentials. Use secrets management solutions. Implement secure credential injection. Monitor for credential exposure.',
    evidenceRequirements: [
      'Code scanning results',
      'Secrets management implementation',
      'Secure injection configuration',
      'Exposure monitoring records',
      'Embedding prevention assessment',
    ],
    testProcedures: [
      'Run credential scans',
      'Verify secrets management',
      'Test secure injection',
      'Review exposure monitoring',
      'Assess embedding prevention',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(8)',
    name: 'Authenticator Management | Multiple System Accounts',
    description:
      'FedRAMP High requires implementing controls to manage risk of authenticator compromise across multiple systems.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Avoid shared authenticators across systems. Implement unique credentials per system. Monitor cross-system authentication. Rotate credentials regularly.',
    evidenceRequirements: [
      'Credential uniqueness policy',
      'Per-system credential evidence',
      'Cross-system monitoring logs',
      'Rotation records',
      'Cross-system risk assessment',
    ],
    testProcedures: [
      'Verify credential uniqueness',
      'Test per-system credentials',
      'Review cross-system monitoring',
      'Verify rotation compliance',
      'Assess cross-system risk',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IA-5(11)',
    name: 'Authenticator Management | Hardware Token-Based Authentication',
    description:
      'FedRAMP High requires employing hardware authentication devices that satisfy defined token quality requirements.',
    category: 'Identification and Authentication',
    implementationGuidance:
      'Define token quality requirements. Deploy FIPS-validated tokens. Manage token lifecycle. Monitor token usage.',
    evidenceRequirements: [
      'Token quality requirements',
      'FIPS validation certificates',
      'Lifecycle management procedures',
      'Usage monitoring logs',
      'Token effectiveness assessment',
    ],
    testProcedures: [
      'Review quality requirements',
      'Verify FIPS validation',
      'Test lifecycle management',
      'Review usage monitoring',
      'Assess token effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FEDRAMP HIGH BASELINE - SYSTEM AND COMMUNICATIONS PROTECTION ENHANCEMENTS
  // ============================================================
  {
    controlId: 'FR-SC-2(1)',
    name: 'Application Partitioning | Interfaces for Non-Privileged Users',
    description:
      'FedRAMP High requires preventing non-privileged users from accessing system management functionality.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Separate user and admin interfaces. Implement interface access controls. Monitor interface usage. Prevent interface bypass.',
    evidenceRequirements: [
      'Interface separation documentation',
      'Access control configuration',
      'Usage monitoring logs',
      'Bypass prevention evidence',
      'Separation effectiveness assessment',
    ],
    testProcedures: [
      'Verify interface separation',
      'Test access controls',
      'Review usage monitoring',
      'Test bypass prevention',
      'Assess separation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-3(1)',
    name: 'Security Function Isolation | Hardware Separation',
    description:
      'FedRAMP High requires employing hardware-based mechanisms to achieve security function isolation.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement hardware security modules. Use hardware-based isolation. Configure hardware protection boundaries. Monitor hardware security.',
    evidenceRequirements: [
      'HSM implementation documentation',
      'Hardware isolation configuration',
      'Protection boundary documentation',
      'Hardware monitoring logs',
      'Hardware isolation assessment',
    ],
    testProcedures: [
      'Test HSM implementation',
      'Verify hardware isolation',
      'Review protection boundaries',
      'Examine monitoring logs',
      'Assess hardware isolation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-3(2)',
    name: 'Security Function Isolation | Access and Flow Control Functions',
    description:
      'FedRAMP High requires isolating security functions enforcing access and information flow control.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Isolate access control functions. Protect flow control mechanisms. Implement separate security domains. Monitor function isolation.',
    evidenceRequirements: [
      'Access control isolation evidence',
      'Flow control protection documentation',
      'Security domain implementation',
      'Function isolation monitoring',
      'Isolation effectiveness assessment',
    ],
    testProcedures: [
      'Test access control isolation',
      'Verify flow control protection',
      'Review security domains',
      'Examine isolation monitoring',
      'Assess isolation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-4(2)',
    name: 'Information in Shared Resources | Periods Processing',
    description:
      'FedRAMP High requires preventing unauthorized information transfer via shared resources during periods processing.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement memory clearing between periods. Sanitize shared resources. Configure period processing controls. Monitor resource sanitization.',
    evidenceRequirements: [
      'Memory clearing configuration',
      'Resource sanitization procedures',
      'Period processing controls',
      'Sanitization monitoring logs',
      'Sanitization effectiveness assessment',
    ],
    testProcedures: [
      'Test memory clearing',
      'Verify resource sanitization',
      'Review period controls',
      'Examine monitoring logs',
      'Assess sanitization effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-5(1)',
    name: 'Denial of Service Protection | Restrict Ability to Attack Other Systems',
    description:
      'FedRAMP High requires restricting the ability of individuals to launch denial of service attacks against other systems.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement outbound traffic controls. Restrict attack tool usage. Monitor for attack patterns. Block malicious outbound traffic.',
    evidenceRequirements: [
      'Outbound control configuration',
      'Tool restriction documentation',
      'Attack pattern monitoring',
      'Traffic blocking records',
      'Attack prevention assessment',
    ],
    testProcedures: [
      'Test outbound controls',
      'Verify tool restrictions',
      'Review pattern monitoring',
      'Test traffic blocking',
      'Assess attack prevention',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-5(2)',
    name: 'Denial of Service Protection | Excess Capacity/Bandwidth/Redundancy',
    description:
      'FedRAMP High requires managing excess capacity, bandwidth, or redundancy to limit denial of service effects.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Provision excess capacity. Implement bandwidth management. Configure redundant systems. Monitor capacity utilization.',
    evidenceRequirements: [
      'Excess capacity documentation',
      'Bandwidth management configuration',
      'Redundancy implementation evidence',
      'Utilization monitoring logs',
      'Capacity effectiveness assessment',
    ],
    testProcedures: [
      'Verify excess capacity',
      'Test bandwidth management',
      'Review redundancy',
      'Examine utilization monitoring',
      'Assess capacity effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(3)',
    name: 'Boundary Protection | Access Points',
    description:
      'FedRAMP High requires limiting the number of external network connections to the system.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Document all external connections. Minimize access points. Implement connection controls. Monitor all external access.',
    evidenceRequirements: [
      'External connection inventory',
      'Access point minimization evidence',
      'Connection control configuration',
      'External access monitoring logs',
      'Access point effectiveness assessment',
    ],
    testProcedures: [
      'Review connection inventory',
      'Verify access point minimization',
      'Test connection controls',
      'Review access monitoring',
      'Assess access point security',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(4)',
    name: 'Boundary Protection | External Telecommunications Services',
    description:
      'FedRAMP High requires implementing a managed interface for each external telecommunication service.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Define managed interfaces. Implement interface controls. Monitor telecommunications services. Document service agreements.',
    evidenceRequirements: [
      'Managed interface documentation',
      'Interface control configuration',
      'Service monitoring records',
      'Service agreements',
      'Interface effectiveness assessment',
    ],
    testProcedures: [
      'Review managed interfaces',
      'Test interface controls',
      'Review service monitoring',
      'Examine service agreements',
      'Assess interface effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(5)',
    name: 'Boundary Protection | Deny by Default / Allow by Exception',
    description:
      'FedRAMP High requires denying network communications traffic by default and allowing only authorized traffic.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Configure default deny policies. Define explicit allow rules. Document traffic exceptions. Monitor denied traffic.',
    evidenceRequirements: [
      'Default deny configuration',
      'Allow rule documentation',
      'Exception documentation',
      'Denied traffic logs',
      'Policy effectiveness assessment',
    ],
    testProcedures: [
      'Verify default deny',
      'Test allow rules',
      'Review exceptions',
      'Examine denied traffic',
      'Assess policy effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(7)',
    name: 'Boundary Protection | Prevent Split Tunneling for Remote Devices',
    description:
      'FedRAMP High requires preventing split tunneling for remote devices connecting to the system.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Configure VPN to prevent split tunneling. Enforce full tunnel requirements. Monitor tunnel configurations. Detect split tunnel attempts.',
    evidenceRequirements: [
      'Split tunnel prevention configuration',
      'Full tunnel enforcement evidence',
      'Configuration monitoring records',
      'Split tunnel detection logs',
      'Prevention effectiveness assessment',
    ],
    testProcedures: [
      'Test split tunnel prevention',
      'Verify full tunnel enforcement',
      'Review configuration monitoring',
      'Test detection capabilities',
      'Assess prevention effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(8)',
    name: 'Boundary Protection | Route Traffic to Authenticated Proxy Servers',
    description:
      'FedRAMP High requires routing internal communications traffic to external networks through authenticated proxy servers.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Deploy authenticated proxy servers. Configure traffic routing. Implement proxy authentication. Monitor proxy traffic.',
    evidenceRequirements: [
      'Proxy server deployment documentation',
      'Traffic routing configuration',
      'Proxy authentication evidence',
      'Traffic monitoring logs',
      'Proxy effectiveness assessment',
    ],
    testProcedures: [
      'Test proxy server deployment',
      'Verify traffic routing',
      'Test proxy authentication',
      'Review traffic monitoring',
      'Assess proxy effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(18)',
    name: 'Boundary Protection | Fail Secure',
    description:
      'FedRAMP High requires system boundary protections to fail secure in the event of an operational failure.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Configure fail-secure defaults. Test failure scenarios. Document fail-secure behavior. Monitor boundary protection status.',
    evidenceRequirements: [
      'Fail-secure configuration documentation',
      'Failure scenario testing records',
      'Fail-secure behavior documentation',
      'Protection status monitoring logs',
      'Fail-secure effectiveness assessment',
    ],
    testProcedures: [
      'Test fail-secure configuration',
      'Execute failure scenarios',
      'Verify fail-secure behavior',
      'Review status monitoring',
      'Assess fail-secure effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-7(21)',
    name: 'Boundary Protection | Isolation of System Components',
    description:
      'FedRAMP High requires employing boundary protection mechanisms to isolate system components.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement network segmentation. Deploy internal firewalls. Configure component isolation. Monitor inter-component traffic.',
    evidenceRequirements: [
      'Network segmentation documentation',
      'Internal firewall configuration',
      'Component isolation evidence',
      'Inter-component traffic logs',
      'Isolation effectiveness assessment',
    ],
    testProcedures: [
      'Verify network segmentation',
      'Test internal firewalls',
      'Review component isolation',
      'Examine traffic logs',
      'Assess isolation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-8(1)',
    name: 'Transmission Confidentiality and Integrity | Cryptographic Protection',
    description:
      'FedRAMP High requires implementing cryptographic mechanisms to prevent unauthorized disclosure and modification.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement TLS for all transmissions. Use FIPS-validated cryptography. Configure strong cipher suites. Monitor cryptographic operations.',
    evidenceRequirements: [
      'TLS implementation documentation',
      'FIPS validation certificates',
      'Cipher suite configuration',
      'Cryptographic operation logs',
      'Cryptographic effectiveness assessment',
    ],
    testProcedures: [
      'Test TLS implementation',
      'Verify FIPS validation',
      'Review cipher configuration',
      'Examine operation logs',
      'Assess cryptographic effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-12(1)',
    name: 'Cryptographic Key Establishment and Management | Availability',
    description:
      'FedRAMP High requires maintaining availability of information in the event of loss of cryptographic keys.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement key backup and recovery. Configure key escrow where appropriate. Test key recovery procedures. Document key recovery process.',
    evidenceRequirements: [
      'Key backup implementation',
      'Key escrow configuration',
      'Recovery procedure testing records',
      'Recovery process documentation',
      'Key availability assessment',
    ],
    testProcedures: [
      'Test key backup',
      'Verify escrow configuration',
      'Test recovery procedures',
      'Review process documentation',
      'Assess key availability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-12(2)',
    name: 'Cryptographic Key Establishment and Management | Symmetric Keys',
    description:
      'FedRAMP High requires producing, controlling, and distributing symmetric cryptographic keys using approved key management technology.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Use FIPS-validated key management. Implement secure key distribution. Control key lifecycle. Audit key management activities.',
    evidenceRequirements: [
      'Key management technology documentation',
      'Secure distribution procedures',
      'Lifecycle control evidence',
      'Key management audit logs',
      'Key management effectiveness assessment',
    ],
    testProcedures: [
      'Verify key management technology',
      'Test secure distribution',
      'Review lifecycle controls',
      'Examine audit logs',
      'Assess key management effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-12(3)',
    name: 'Cryptographic Key Establishment and Management | Asymmetric Keys',
    description:
      'FedRAMP High requires producing, controlling, and distributing asymmetric cryptographic keys using approved key management technology.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement PKI for asymmetric keys. Configure certificate lifecycle management. Secure private key storage. Monitor certificate usage.',
    evidenceRequirements: [
      'PKI implementation documentation',
      'Lifecycle management configuration',
      'Private key storage evidence',
      'Certificate usage logs',
      'Asymmetric key management assessment',
    ],
    testProcedures: [
      'Test PKI implementation',
      'Verify lifecycle management',
      'Review private key storage',
      'Examine usage logs',
      'Assess asymmetric key management',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SC-28(1)',
    name: 'Protection of Information at Rest | Cryptographic Protection',
    description:
      'FedRAMP High requires implementing cryptographic mechanisms to prevent unauthorized disclosure and modification of information at rest.',
    category: 'System and Communications Protection',
    implementationGuidance:
      'Implement full disk encryption. Use database encryption. Encrypt sensitive files. Manage encryption keys securely.',
    evidenceRequirements: [
      'Full disk encryption evidence',
      'Database encryption configuration',
      'File encryption implementation',
      'Key management documentation',
      'At-rest encryption effectiveness assessment',
    ],
    testProcedures: [
      'Verify disk encryption',
      'Test database encryption',
      'Review file encryption',
      'Examine key management',
      'Assess at-rest encryption effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FEDRAMP HIGH BASELINE - ADDITIONAL CONTROLS
  // ============================================================
  {
    controlId: 'FR-PE-7',
    name: 'Visitor Control',
    description:
      'FedRAMP High requires controlling physical access by authenticating visitors before authorizing access.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Implement visitor registration. Verify visitor identity. Issue visitor badges. Escort visitors in sensitive areas.',
    evidenceRequirements: [
      'Visitor registration procedures',
      'Identity verification process',
      'Badge issuance records',
      'Escort procedures documentation',
      'Visitor control effectiveness assessment',
    ],
    testProcedures: [
      'Review registration procedures',
      'Test identity verification',
      'Verify badge issuance',
      'Review escort procedures',
      'Assess visitor control effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-24',
    name: 'Physical Access Monitoring',
    description:
      'FedRAMP High requires monitoring physical access to facilities using automated mechanisms.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Deploy access monitoring systems. Configure automated alerting. Review access logs regularly. Investigate anomalous access.',
    evidenceRequirements: [
      'Access monitoring system documentation',
      'Automated alerting configuration',
      'Access log review records',
      'Investigation records',
      'Monitoring effectiveness assessment',
    ],
    testProcedures: [
      'Test monitoring systems',
      'Verify automated alerting',
      'Review access logs',
      'Examine investigation records',
      'Assess monitoring effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PE-25',
    name: 'Facility Site Selection',
    description:
      'FedRAMP High requires selecting a facility site that reduces susceptibility to physical threats.',
    category: 'Physical and Environmental Protection',
    implementationGuidance:
      'Conduct site threat assessment. Consider natural disaster risks. Evaluate physical security options. Document site selection criteria.',
    evidenceRequirements: [
      'Site threat assessment documentation',
      'Natural disaster risk analysis',
      'Physical security evaluation',
      'Site selection criteria documentation',
      'Site selection effectiveness assessment',
    ],
    testProcedures: [
      'Review threat assessment',
      'Examine disaster risk analysis',
      'Review security evaluation',
      'Verify selection criteria',
      'Assess site selection effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-6',
    name: 'Software Usage Restrictions',
    description:
      'FedRAMP High requires employing software and associated documentation in accordance with contract agreements and copyright laws.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Track software licenses. Verify license compliance. Document software usage. Conduct periodic license audits.',
    evidenceRequirements: [
      'Software license inventory',
      'License compliance verification',
      'Usage documentation',
      'License audit records',
      'Compliance effectiveness assessment',
    ],
    testProcedures: [
      'Review license inventory',
      'Verify compliance',
      'Review usage documentation',
      'Examine audit records',
      'Assess compliance effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SA-7',
    name: 'User-Installed Software',
    description:
      'FedRAMP High requires enforcing explicit rules governing the installation of software by users.',
    category: 'System and Services Acquisition',
    implementationGuidance:
      'Define software installation policies. Implement technical enforcement. Monitor user installations. Review installed software regularly.',
    evidenceRequirements: [
      'Installation policy documentation',
      'Technical enforcement configuration',
      'Installation monitoring logs',
      'Software review records',
      'Enforcement effectiveness assessment',
    ],
    testProcedures: [
      'Review installation policies',
      'Test technical enforcement',
      'Verify monitoring',
      'Review software audits',
      'Assess enforcement effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-9',
    name: 'Information Input Restrictions',
    description:
      'FedRAMP High requires restricting the capability to input information to the system to authorized personnel only.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Define authorized input personnel. Implement input access controls. Monitor input activities. Audit input operations.',
    evidenceRequirements: [
      'Authorized personnel documentation',
      'Input access control configuration',
      'Input activity logs',
      'Input operation audits',
      'Input restriction effectiveness assessment',
    ],
    testProcedures: [
      'Verify authorized personnel',
      'Test access controls',
      'Review activity logs',
      'Examine operation audits',
      'Assess restriction effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-5',
    name: 'Contingency Plan Update',
    description:
      'FedRAMP High requires reviewing the contingency plan at a defined frequency and updating based on changes.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Establish plan review schedule. Document plan changes. Update plan after significant events. Communicate updates to stakeholders.',
    evidenceRequirements: [
      'Plan review schedule',
      'Change documentation records',
      'Event-triggered updates',
      'Stakeholder communication records',
      'Update effectiveness assessment',
    ],
    testProcedures: [
      'Verify review schedule',
      'Review change documentation',
      'Examine event-triggered updates',
      'Review communication records',
      'Assess update effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CP-6',
    name: 'Alternate Storage Site',
    description:
      'FedRAMP High requires establishing an alternate storage site with safeguards equivalent to the primary site.',
    category: 'Contingency Planning',
    implementationGuidance:
      'Identify alternate storage location. Implement equivalent security. Test storage capabilities. Document alternate site procedures.',
    evidenceRequirements: [
      'Alternate site documentation',
      'Security equivalence analysis',
      'Storage capability testing records',
      'Site procedures documentation',
      'Alternate site effectiveness assessment',
    ],
    testProcedures: [
      'Verify alternate site',
      'Assess security equivalence',
      'Test storage capabilities',
      'Review procedures',
      'Assess alternate site effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-3',
    name: 'System Security Plan Update',
    description:
      'FedRAMP High requires updating the system security plan to address changes to the system and environment.',
    category: 'Planning',
    implementationGuidance:
      'Establish SSP update procedures. Track system changes. Update SSP for all changes. Review SSP accuracy regularly.',
    evidenceRequirements: [
      'SSP update procedures',
      'Change tracking records',
      'SSP revision history',
      'Accuracy review records',
      'Update effectiveness assessment',
    ],
    testProcedures: [
      'Review update procedures',
      'Verify change tracking',
      'Examine revision history',
      'Review accuracy checks',
      'Assess update effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-5',
    name: 'Privacy Impact Assessment',
    description:
      'FedRAMP High requires conducting privacy impact assessments for systems processing personally identifiable information.',
    category: 'Planning',
    implementationGuidance:
      'Conduct PIAs for PII systems. Document privacy risks. Implement privacy controls. Update PIAs when changes occur.',
    evidenceRequirements: [
      'Privacy impact assessment documentation',
      'Privacy risk documentation',
      'Privacy control implementation',
      'PIA update records',
      'PIA effectiveness assessment',
    ],
    testProcedures: [
      'Review PIA documentation',
      'Examine privacy risks',
      'Verify control implementation',
      'Review update records',
      'Assess PIA effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PL-6',
    name: 'Security-Related Activity Planning',
    description:
      'FedRAMP High requires planning and coordinating security-related activities before conducting such activities.',
    category: 'Planning',
    implementationGuidance:
      'Plan security activities in advance. Coordinate with stakeholders. Document activity plans. Review outcomes after activities.',
    evidenceRequirements: [
      'Activity planning documentation',
      'Stakeholder coordination records',
      'Activity plan documentation',
      'Outcome review records',
      'Planning effectiveness assessment',
    ],
    testProcedures: [
      'Review activity planning',
      'Verify stakeholder coordination',
      'Review activity plans',
      'Examine outcome reviews',
      'Assess planning effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CA-4',
    name: 'Security Certification',
    description:
      'FedRAMP High requires an independent security assessment of the system.',
    category: 'Security Assessment and Authorization',
    implementationGuidance:
      'Engage independent assessor. Conduct comprehensive assessment. Document findings. Address assessment findings.',
    evidenceRequirements: [
      'Independent assessor credentials',
      'Assessment scope documentation',
      'Assessment findings report',
      'Finding remediation records',
      'Assessment effectiveness assessment',
    ],
    testProcedures: [
      'Verify assessor independence',
      'Review assessment scope',
      'Examine findings report',
      'Review remediation records',
      'Assess assessment effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-RA-4',
    name: 'Risk Assessment Update',
    description:
      'FedRAMP High requires updating risk assessments at defined frequency or when significant changes occur.',
    category: 'Risk Assessment',
    implementationGuidance:
      'Establish risk assessment schedule. Update for significant changes. Document assessment updates. Communicate risk changes.',
    evidenceRequirements: [
      'Assessment schedule documentation',
      'Change-triggered update records',
      'Assessment update documentation',
      'Risk communication records',
      'Update effectiveness assessment',
    ],
    testProcedures: [
      'Verify assessment schedule',
      'Review change-triggered updates',
      'Examine update documentation',
      'Review communication records',
      'Assess update effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-IR-3',
    name: 'Incident Response Testing',
    description:
      'FedRAMP High requires testing the incident response capability at defined frequency.',
    category: 'Incident Response',
    implementationGuidance:
      'Develop testing plan. Conduct incident response exercises. Document test results. Improve capability based on findings.',
    evidenceRequirements: [
      'Testing plan documentation',
      'Exercise execution records',
      'Test result documentation',
      'Capability improvement records',
      'Testing effectiveness assessment',
    ],
    testProcedures: [
      'Review testing plan',
      'Examine exercise records',
      'Review test results',
      'Verify capability improvements',
      'Assess testing effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-CM-5',
    name: 'Access Restrictions for Change',
    description:
      'FedRAMP High requires defining, documenting, approving, and enforcing access restrictions for configuration changes.',
    category: 'Configuration Management',
    implementationGuidance:
      'Define change access restrictions. Document approval requirements. Implement technical enforcement. Audit change access.',
    evidenceRequirements: [
      'Access restriction documentation',
      'Approval requirement documentation',
      'Technical enforcement configuration',
      'Change access audit logs',
      'Restriction effectiveness assessment',
    ],
    testProcedures: [
      'Review access restrictions',
      'Verify approval requirements',
      'Test technical enforcement',
      'Review audit logs',
      'Assess restriction effectiveness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // FEDRAMP HIGH BASELINE - FINAL CONTROLS
  // ============================================================
  {
    controlId: 'FR-SI-2(2)',
    name: 'Flaw Remediation | Automated Flaw Remediation Status',
    description:
      'FedRAMP High requires employing automated mechanisms to determine the state of system components with regard to flaw remediation.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement automated vulnerability scanning. Configure automated patch status reporting. Monitor remediation progress. Alert on overdue remediations.',
    evidenceRequirements: [
      'Automated scanning implementation',
      'Patch status reporting configuration',
      'Remediation progress monitoring',
      'Overdue remediation alerts',
      'Automation effectiveness assessment',
    ],
    testProcedures: [
      'Test automated scanning',
      'Verify status reporting',
      'Review progress monitoring',
      'Test overdue alerts',
      'Assess automation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-3(1)',
    name: 'Malicious Code Protection | Central Management',
    description:
      'FedRAMP High requires central management of malicious code protection mechanisms.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement centralized antimalware management. Configure policy distribution. Monitor protection status centrally. Update definitions centrally.',
    evidenceRequirements: [
      'Central management implementation',
      'Policy distribution configuration',
      'Status monitoring dashboard',
      'Central update procedures',
      'Central management effectiveness assessment',
    ],
    testProcedures: [
      'Test central management',
      'Verify policy distribution',
      'Review status monitoring',
      'Test central updates',
      'Assess central management effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-3(2)',
    name: 'Malicious Code Protection | Automatic Updates',
    description:
      'FedRAMP High requires automatic updates of malicious code protection mechanisms.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Configure automatic definition updates. Enable automatic engine updates. Monitor update status. Alert on update failures.',
    evidenceRequirements: [
      'Automatic update configuration',
      'Engine update settings',
      'Update status monitoring',
      'Failure alert configuration',
      'Update effectiveness assessment',
    ],
    testProcedures: [
      'Verify automatic updates',
      'Test engine updates',
      'Review update status',
      'Test failure alerts',
      'Assess update effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-4(2)',
    name: 'System Monitoring | Automated Tools for Real-Time Analysis',
    description:
      'FedRAMP High requires employing automated tools to support near real-time analysis of events.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Deploy SIEM for real-time analysis. Configure automated event correlation. Enable real-time alerting. Monitor analysis effectiveness.',
    evidenceRequirements: [
      'SIEM deployment documentation',
      'Event correlation configuration',
      'Real-time alerting setup',
      'Analysis effectiveness metrics',
      'Real-time analysis assessment',
    ],
    testProcedures: [
      'Test SIEM deployment',
      'Verify event correlation',
      'Test real-time alerting',
      'Review effectiveness metrics',
      'Assess real-time analysis',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-4(4)',
    name: 'System Monitoring | Inbound and Outbound Communications Traffic',
    description:
      'FedRAMP High requires monitoring inbound and outbound communications traffic for unusual or unauthorized activities.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Monitor all network traffic. Analyze traffic patterns. Detect anomalous communications. Alert on suspicious traffic.',
    evidenceRequirements: [
      'Traffic monitoring implementation',
      'Pattern analysis configuration',
      'Anomaly detection rules',
      'Suspicious traffic alerts',
      'Traffic monitoring effectiveness assessment',
    ],
    testProcedures: [
      'Test traffic monitoring',
      'Verify pattern analysis',
      'Test anomaly detection',
      'Review alert handling',
      'Assess monitoring effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-4(5)',
    name: 'System Monitoring | System-Generated Alerts',
    description:
      'FedRAMP High requires alerting personnel when system-generated indications of compromise occur.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Configure IOC detection alerts. Define alert recipients. Establish alert escalation procedures. Monitor alert response times.',
    evidenceRequirements: [
      'IOC alert configuration',
      'Recipient list documentation',
      'Escalation procedure documentation',
      'Response time monitoring',
      'Alert effectiveness assessment',
    ],
    testProcedures: [
      'Test IOC alerts',
      'Verify alert recipients',
      'Test escalation procedures',
      'Review response times',
      'Assess alert effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-7(1)',
    name: 'Software, Firmware, and Information Integrity | Integrity Checks',
    description:
      'FedRAMP High requires performing integrity checks of software, firmware, and information at startup and at defined transitional states.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Implement boot-time integrity checks. Configure transitional state verification. Alert on integrity failures. Document integrity baselines.',
    evidenceRequirements: [
      'Boot-time integrity configuration',
      'Transitional state verification',
      'Integrity failure alerting',
      'Baseline documentation',
      'Integrity check effectiveness assessment',
    ],
    testProcedures: [
      'Test boot-time checks',
      'Verify transitional verification',
      'Test failure alerts',
      'Review baselines',
      'Assess integrity check effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-SI-7(7)',
    name: 'Software, Firmware, and Information Integrity | Integration of Detection and Response',
    description:
      'FedRAMP High requires incorporating detection of unauthorized changes into the organizational incident response capability.',
    category: 'System and Information Integrity',
    implementationGuidance:
      'Integrate change detection with incident response. Configure automated incident creation. Establish response procedures. Track detection-to-response metrics.',
    evidenceRequirements: [
      'Detection-response integration',
      'Automated incident creation',
      'Response procedure documentation',
      'Detection-to-response metrics',
      'Integration effectiveness assessment',
    ],
    testProcedures: [
      'Test detection integration',
      'Verify automated incidents',
      'Review response procedures',
      'Examine metrics',
      'Assess integration effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-4(1)',
    name: 'Nonlocal Maintenance | Auditing and Review',
    description:
      'FedRAMP High requires auditing nonlocal maintenance and diagnostic sessions and reviewing maintenance records.',
    category: 'Maintenance',
    implementationGuidance:
      'Audit all remote maintenance sessions. Record maintenance activities. Review maintenance logs regularly. Investigate anomalous maintenance.',
    evidenceRequirements: [
      'Remote session audit configuration',
      'Maintenance activity records',
      'Log review records',
      'Investigation records',
      'Audit effectiveness assessment',
    ],
    testProcedures: [
      'Verify session auditing',
      'Review activity records',
      'Examine log reviews',
      'Review investigations',
      'Assess audit effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-MA-4(2)',
    name: 'Nonlocal Maintenance | Document Nonlocal Maintenance',
    description:
      'FedRAMP High requires documenting the policies and procedures for the establishment and use of nonlocal maintenance connections.',
    category: 'Maintenance',
    implementationGuidance:
      'Document remote maintenance policies. Define connection procedures. Establish authorization requirements. Maintain procedure currency.',
    evidenceRequirements: [
      'Remote maintenance policy',
      'Connection procedure documentation',
      'Authorization requirements',
      'Procedure review records',
      'Documentation effectiveness assessment',
    ],
    testProcedures: [
      'Review maintenance policy',
      'Verify connection procedures',
      'Test authorization requirements',
      'Review procedure currency',
      'Assess documentation effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'FR-PS-11',
    name: 'Personnel Termination',
    description:
      'FedRAMP High requires timely termination of system access upon personnel termination and conducting exit interviews.',
    category: 'Personnel Security',
    implementationGuidance:
      'Define termination procedures. Implement immediate access revocation. Conduct exit interviews. Retrieve organizational assets.',
    evidenceRequirements: [
      'Termination procedure documentation',
      'Access revocation evidence',
      'Exit interview records',
      'Asset retrieval records',
      'Termination effectiveness assessment',
    ],
    testProcedures: [
      'Review termination procedures',
      'Test access revocation timing',
      'Review exit interviews',
      'Verify asset retrieval',
      'Assess termination effectiveness',
    ],
    status: 'Not Started',
  },
];
