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

export const CMMC_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // LEVEL 1 - BASIC SAFEGUARDING (17 practices)
  // ============================================================
  {
    controlId: 'AC.L1-3.1.1',
    name: 'Authorized Access Control',
    description:
      'Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems). This practice ensures only authenticated and approved entities can interact with organizational systems.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Implement access control policies that clearly define which users, processes, and devices are authorized to access each system. Deploy authentication mechanisms such as user accounts with passwords, certificates, or tokens to enforce these access restrictions at all entry points.',
    evidenceRequirements: [
      'Access control policy document specifying authorized users and roles for each system',
      'System configuration screenshots or exports showing active user accounts and their access permissions',
      'Records of periodic access reviews demonstrating removal of unauthorized or inactive accounts',
    ],
    testProcedures: [
      'Attempt to access the system with unauthorized credentials and verify that access is denied',
      'Review the current list of active accounts against the approved access list and confirm no unauthorized accounts exist',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L1-3.1.2',
    name: 'Transaction and Function Control',
    description:
      'Limit information system access to the types of transactions and functions that authorized users are permitted to execute. Users are granted access only to the specific operations required by their role.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Configure role-based access control (RBAC) to restrict users to only the transactions and functions necessary for their assigned duties. Review and update permission assignments whenever roles change or personnel transfer to new positions.',
    evidenceRequirements: [
      'Role-based access control matrix mapping roles to permitted transactions and functions',
      'System configuration evidence showing enforcement of function-level restrictions per role',
      'Change management records showing access updates when personnel roles change',
    ],
    testProcedures: [
      'Log in as a user with a restricted role and attempt to execute a function outside the permitted scope, verifying access is denied',
      'Compare the configured permissions for a sample of user accounts against the approved RBAC matrix',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L1-3.1.20',
    name: 'External Connections',
    description:
      'Verify and control/limit connections to and use of external information systems. Organizations must manage connections between internal networks and external systems to reduce exposure to threats.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Establish policies governing the use of external systems and implement technical controls such as firewall rules and network access control lists to restrict external connections. Require authorization before any external system is connected to the organizational network.',
    evidenceRequirements: [
      'Policy document defining approved external connections and authorization requirements',
      'Firewall and network device configurations showing rules that restrict external connectivity',
      'Authorization records for each approved external system connection',
    ],
    testProcedures: [
      'Attempt to establish an unauthorized external connection and verify it is blocked by network controls',
      'Review firewall rules and network ACLs to confirm only approved external connections are permitted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L1-3.1.22',
    name: 'Public Information',
    description:
      'Control information posted or processed on publicly accessible information systems. Organizations must ensure that no controlled unclassified information or sensitive data is inadvertently published on public-facing systems.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Implement a review and approval process for all content before it is published on publicly accessible systems. Train designated personnel on what constitutes sensitive information and deploy automated content scanning tools where feasible.',
    evidenceRequirements: [
      'Content review and approval policy for publicly accessible systems',
      'Records of content reviews and approvals prior to public posting',
      'Training records for personnel responsible for managing public-facing content',
    ],
    testProcedures: [
      'Review a sample of recently published content on public systems to verify no CUI or sensitive data is present',
      'Verify that the content approval workflow is functioning and that unauthorized posts are prevented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L1-3.5.1',
    name: 'Identification',
    description:
      'Identify information system users, processes acting on behalf of users, or devices. Each entity accessing the system must be uniquely identified to support accountability and access control.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Assign unique identifiers to all users, service accounts, and devices that access organizational systems. Prohibit the use of shared or generic accounts and maintain an inventory of all active identifiers.',
    evidenceRequirements: [
      'User and device identifier inventory showing unique IDs assigned to each entity',
      'Policy prohibiting shared or generic account usage',
      'System configuration evidence demonstrating unique identifier enforcement',
    ],
    testProcedures: [
      'Review the system user directory and verify that each account corresponds to a unique individual or identified process',
      'Search for shared or generic accounts in the system and confirm none are in active use',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L1-3.5.2',
    name: 'Authentication',
    description:
      'Authenticate (or verify) the identities of those users, processes, or devices as a prerequisite to allowing access to organizational information systems. Authentication ensures that entities are who they claim to be before granting access.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Deploy authentication mechanisms such as passwords, tokens, or certificates that verify user and device identities before granting system access. Enforce password complexity requirements and account lockout policies to strengthen authentication.',
    evidenceRequirements: [
      'Authentication policy specifying approved methods and complexity requirements',
      'System configuration exports showing password policies, lockout settings, and authentication methods',
      'Records demonstrating regular review and update of authentication configurations',
    ],
    testProcedures: [
      'Attempt to access the system without providing valid credentials and verify that access is denied',
      'Review password policy settings in the system and confirm they meet organizational requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L1-3.8.3',
    name: 'Media Disposal',
    description:
      'Sanitize or destroy information system media containing Federal Contract Information before disposal or release for reuse. Proper media disposal prevents unauthorized recovery of sensitive data from discarded or repurposed storage devices.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Establish media sanitization procedures that specify approved methods such as degaussing, overwriting, or physical destruction for each media type. Maintain a log of all media disposal actions including the method used, date, and responsible individual.',
    evidenceRequirements: [
      'Media sanitization and disposal policy specifying approved methods per media type',
      'Media disposal logs recording date, method, media identifier, and responsible personnel',
      'Certificates of destruction from third-party disposal vendors when applicable',
    ],
    testProcedures: [
      'Select a sample of disposed media records and verify proper sanitization methods were applied',
      'Attempt data recovery on a sample sanitized media item to confirm data is irrecoverable',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PE.L1-3.10.1',
    name: 'Limit Physical Access',
    description:
      'Limit physical access to organizational information systems, equipment, and the respective operating environments to authorized individuals. Physical security controls protect hardware and infrastructure from unauthorized physical contact.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Deploy physical access controls such as locks, badge readers, and security guards to restrict entry to areas containing information systems. Maintain an up-to-date list of personnel authorized for physical access to each secured area.',
    evidenceRequirements: [
      'Physical access control policy identifying secured areas and authorized personnel',
      'Current authorized access roster for each restricted area',
      'Physical security system configuration records such as badge reader programming and lock assignments',
    ],
    testProcedures: [
      'Attempt to gain physical access to a restricted area without authorization and verify that access is denied',
      'Review the authorized access roster against badge reader logs to identify any discrepancies',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PE.L1-3.10.3',
    name: 'Escort Visitors',
    description:
      'Escort visitors and monitor visitor activity. All visitors to secured areas must be accompanied by authorized personnel and their activities must be observed to prevent unauthorized access to sensitive systems or information.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Require all visitors to be signed in, issued a visible visitor badge, and escorted by an authorized employee at all times within restricted areas. Establish clear procedures for visitor check-in, escort responsibilities, and check-out to maintain accountability.',
    evidenceRequirements: [
      'Visitor management policy requiring escorts and monitoring within restricted areas',
      'Visitor sign-in and sign-out logs with escort assignment records',
      'Training records for employees on visitor escort procedures',
    ],
    testProcedures: [
      'Review visitor logs for the past quarter and verify that each visit has a documented escort assignment',
      'Observe the visitor check-in process and confirm that badges are issued and escorts are assigned before access is granted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PE.L1-3.10.4',
    name: 'Physical Access Logs',
    description:
      'Maintain audit logs of physical access. Organizations must keep records of who accessed restricted areas, when they accessed them, and for how long to support investigations and ensure accountability.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Configure physical access control systems to generate and retain audit logs that capture the identity, date, time, and duration of each access event. Review physical access logs regularly to detect anomalies or unauthorized access attempts.',
    evidenceRequirements: [
      'Physical access log samples from badge reader systems or manual sign-in sheets',
      'Log retention policy specifying the duration and storage method for physical access records',
      'Records of periodic physical access log reviews and any findings or actions taken',
    ],
    testProcedures: [
      'Pull a sample of physical access logs and verify they contain complete identity, date, time, and location data',
      'Confirm that access logs are retained according to the documented retention policy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PE.L1-3.10.5',
    name: 'Manage Physical Access Devices',
    description:
      'Manage physical access devices such as keys, locks, combinations, and card readers. Organizations must control the issuance, tracking, and recovery of physical access devices to prevent unauthorized entry.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Maintain an inventory of all physical access devices and track their issuance to authorized personnel. Implement procedures for recovering devices when personnel leave or change roles and for changing combinations or rekeying locks when compromise is suspected.',
    evidenceRequirements: [
      'Inventory of physical access devices including keys, badges, and lock combinations',
      'Issuance and recovery records tracking which devices are assigned to which individuals',
      'Records of lock changes or device deactivations when personnel depart or devices are lost',
    ],
    testProcedures: [
      'Reconcile the physical access device inventory with issuance records to verify all devices are accounted for',
      'Verify that access devices for recently departed personnel have been recovered or deactivated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L1-3.13.1',
    name: 'Boundary Protection',
    description:
      'Monitor, control, and protect organizational communications at the external boundaries and key internal boundaries of information systems. Boundary protection prevents unauthorized data flows and detects suspicious network activity.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Deploy firewalls, intrusion detection systems, and network monitoring tools at external and key internal network boundaries. Configure these devices to enforce traffic filtering rules and generate alerts for suspicious or unauthorized communication attempts.',
    evidenceRequirements: [
      'Network architecture diagram showing boundary protection devices at external and internal boundaries',
      'Firewall and IDS/IPS configuration files or rule sets',
      'Boundary device monitoring logs and alert review records',
    ],
    testProcedures: [
      'Perform a network scan from outside the boundary and verify that unauthorized ports and services are blocked',
      'Review firewall and IDS/IPS alert logs and confirm that suspicious activity is being detected and investigated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L1-3.13.5',
    name: 'Public Access System Separation',
    description:
      'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks. This ensures public-facing systems do not provide a direct path to internal resources.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Place publicly accessible systems such as web servers and mail servers in a demilitarized zone (DMZ) that is logically or physically separated from the internal network. Configure firewall rules to restrict traffic between the DMZ and internal networks to only the minimum required flows.',
    evidenceRequirements: [
      'Network architecture diagram showing DMZ or subnetwork separation for public-facing components',
      'Firewall rules governing traffic between public-facing subnetworks and internal networks',
      'Verification records from network segmentation testing',
    ],
    testProcedures: [
      'From a public-facing system, attempt to directly access internal network resources and verify that access is blocked',
      'Review firewall rules between the DMZ and internal network to confirm only necessary traffic is permitted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L1-3.14.1',
    name: 'Flaw Remediation',
    description:
      'Identify, report, and correct information and information system flaws in a timely manner. Organizations must have processes to discover vulnerabilities and apply patches or fixes before they can be exploited.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Establish a patch management process that identifies system flaws through vendor notifications and vulnerability scans, and apply patches within defined timeframes based on severity. Test patches in a non-production environment before deployment to production systems where feasible.',
    evidenceRequirements: [
      'Patch management policy defining severity-based remediation timeframes',
      'Patch deployment records showing dates of identification and remediation for each flaw',
      'Vulnerability scan reports demonstrating that identified flaws have been remediated',
    ],
    testProcedures: [
      'Review patch deployment records for a sample of systems and verify patches were applied within the defined timeframes',
      'Run a vulnerability scan against a sample of systems and confirm that previously identified flaws are resolved',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L1-3.14.2',
    name: 'Malicious Code Protection',
    description:
      'Provide protection from malicious code at appropriate locations within organizational information systems. Anti-malware solutions must be deployed to detect, prevent, and eradicate malicious software.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Deploy anti-malware software on all endpoints, servers, and network entry points that process or store organizational data. Configure the software for real-time scanning, automatic quarantine of detected threats, and centralized alerting to the security team.',
    evidenceRequirements: [
      'Anti-malware deployment records showing installation on all required systems',
      'Anti-malware configuration settings showing real-time protection is enabled',
      'Centralized anti-malware dashboard screenshots or reports showing detection and response activity',
    ],
    testProcedures: [
      'Verify that anti-malware software is installed and running on a representative sample of systems',
      'Introduce a test file (such as an EICAR test file) and confirm that the anti-malware solution detects and handles it',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L1-3.14.4',
    name: 'Update Malicious Code Protection',
    description:
      'Update malicious code protection mechanisms when new releases are available. Anti-malware signature definitions and engines must be kept current to defend against the latest threats.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Configure anti-malware solutions to automatically download and apply signature updates and engine updates as they become available. Monitor update status centrally and investigate any systems that fail to update within the expected timeframe.',
    evidenceRequirements: [
      'Anti-malware update configuration showing automatic updates are enabled',
      'Update status reports showing current signature and engine versions across all protected systems',
      'Records of investigations into systems that failed to receive timely updates',
    ],
    testProcedures: [
      'Check the signature definition date on a sample of endpoints and confirm they are current within the last 24 hours',
      'Review the centralized update status dashboard and verify that no systems have outdated definitions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L1-3.14.5',
    name: 'System and File Scanning',
    description:
      'Perform periodic scans of the information system and real-time scans of files from external sources as files are downloaded, opened, or executed. Regular scanning identifies dormant threats and catches new malware in transit.',
    category: 'Level 1 - Basic Safeguarding',
    implementationGuidance:
      'Schedule full system scans at least weekly and configure real-time scanning for all files received from external sources such as email attachments, web downloads, and removable media. Ensure scan results are logged and reviewed, and that detected items are quarantined and investigated.',
    evidenceRequirements: [
      'Scan schedule configuration showing periodic full-system scans are defined',
      'Real-time scanning configuration for files from external sources',
      'Scan result logs showing completed scans, detections, and remediation actions taken',
    ],
    testProcedures: [
      'Review scan logs for the past month and confirm that full system scans completed as scheduled',
      'Download a test file from an external source and verify that real-time scanning intercepts and scans the file',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // LEVEL 2 - ADVANCED (25 practices from NIST SP 800-171)
  // ============================================================
  {
    controlId: 'AC.L2-3.1.3',
    name: 'Control CUI Flow',
    description:
      'Control the flow of CUI in accordance with approved authorizations. Organizations must enforce policies that govern how controlled unclassified information moves between systems, networks, and users.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement data loss prevention (DLP) tools and network segmentation to control the movement of CUI across network boundaries and between systems. Define and enforce information flow policies that specify approved paths and methods for CUI transfer.',
    evidenceRequirements: [
      'Information flow policy specifying approved CUI transfer paths and methods',
      'DLP tool configuration and rule sets governing CUI movement',
      'DLP incident reports showing blocked unauthorized CUI transfers',
    ],
    testProcedures: [
      'Attempt to transfer CUI through an unauthorized channel and verify that the DLP tool blocks the transfer',
      'Review DLP logs for the past quarter and verify that CUI flow policies are being enforced',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.4',
    name: 'Separation of Duties',
    description:
      'Separate the duties of individuals to reduce the risk of malevolent activity without collusion. Critical functions should be divided among multiple personnel so that no single person can complete a high-risk action alone.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Identify critical functions and define role assignments that ensure no single individual can perform all steps of a sensitive process. Implement system-enforced separation by assigning distinct roles and permissions that require different accounts for each step of the process.',
    evidenceRequirements: [
      'Separation of duties matrix mapping critical functions to required distinct roles',
      'System role configurations demonstrating that conflicting duties are assigned to different accounts',
      'Periodic review records confirming separation of duties is maintained as personnel change',
    ],
    testProcedures: [
      'Select a critical process and verify that a single user account cannot complete all steps without a second approver',
      'Review the separation of duties matrix against actual system role assignments for accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.5',
    name: 'Least Privilege',
    description:
      'Employ the principle of least privilege, including for specific security functions and privileged accounts. Users and processes should receive only the minimum access necessary to perform their assigned tasks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Conduct a privilege analysis to determine the minimum access each role requires and configure systems to grant only that level of access. Review and adjust permissions regularly, especially after role changes, to ensure privileges remain appropriate.',
    evidenceRequirements: [
      'Privilege analysis documentation mapping minimum required access to each role',
      'System configuration exports showing permission assignments align with least privilege',
      'Records of periodic privilege reviews and adjustments made',
    ],
    testProcedures: [
      'Review a sample of user accounts and verify that each has only the permissions required for their current role',
      'Attempt to perform an action outside a test account\'s assigned privileges and confirm access is denied',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.7',
    name: 'Privileged Functions',
    description:
      'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs. Privileged operations must be restricted to authorized accounts and fully traceable.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure systems to restrict privileged functions to designated administrative accounts and require elevated authentication for their execution. Enable audit logging for all privileged function executions and review logs regularly for unauthorized attempts.',
    evidenceRequirements: [
      'List of designated privileged accounts and the functions they are authorized to perform',
      'System configuration showing non-privileged accounts cannot execute administrative commands',
      'Audit logs capturing privileged function executions with user identity and timestamps',
    ],
    testProcedures: [
      'Log in with a non-privileged account and attempt to execute a privileged function, verifying access is denied',
      'Review audit logs and confirm that all privileged function executions are attributed to authorized accounts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.8',
    name: 'Unsuccessful Logon Attempts',
    description:
      'Limit unsuccessful logon attempts. Systems must automatically enforce a limit on consecutive failed login attempts to protect against brute-force and password-guessing attacks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure account lockout policies that disable or temporarily lock accounts after a defined number of consecutive failed logon attempts. Set lockout duration and reset thresholds to balance security with usability and alert administrators of lockout events.',
    evidenceRequirements: [
      'Account lockout policy defining thresholds, lockout duration, and reset procedures',
      'System configuration exports showing lockout settings are applied',
      'Logs showing account lockout events triggered by repeated failed logon attempts',
    ],
    testProcedures: [
      'Attempt to log in with incorrect credentials exceeding the lockout threshold and verify the account is locked',
      'Review system logs to confirm lockout events are recorded with accurate timestamps and account details',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.12',
    name: 'Remote Access Control',
    description:
      'Monitor and control remote access sessions. All remote connections to organizational systems must be authorized, encrypted, and monitored for compliance with security policies.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Require VPN or other encrypted remote access solutions for all remote connections and enforce multi-factor authentication for remote sessions. Monitor remote access sessions in real-time and log all connection details for review and investigation.',
    evidenceRequirements: [
      'Remote access policy specifying approved methods, encryption requirements, and authentication standards',
      'VPN and remote access system configurations showing encryption and MFA enforcement',
      'Remote access session logs with connection details, duration, and user identity',
    ],
    testProcedures: [
      'Attempt to establish a remote connection without VPN or MFA and verify that access is denied',
      'Review remote access session logs and verify all sessions used approved encryption and authentication',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AT.L2-3.2.1',
    name: 'Role-Based Risk Awareness',
    description:
      'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and applicable policies. Awareness training reduces human error and social engineering risk.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Deliver security awareness training to all personnel upon hire and at least annually thereafter, covering current threats, organizational policies, and individual responsibilities. Tailor training content to address risks specific to each role, such as phishing for general users and attack surface management for administrators.',
    evidenceRequirements: [
      'Security awareness training program plan and curriculum documents',
      'Training completion records showing all personnel completed required awareness training',
      'Training materials covering role-specific risks and organizational security policies',
    ],
    testProcedures: [
      'Review training records and verify that all current personnel have completed awareness training within the past year',
      'Interview a sample of employees to assess their understanding of security risks relevant to their role',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AT.L2-3.2.2',
    name: 'Role-Based Training',
    description:
      'Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities. Specialized training prepares individuals to effectively perform their security roles.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Identify security-specific roles and develop training curricula that address the skills and knowledge required for each role. Deliver role-based training before personnel assume their duties and provide refresher training annually or when significant system changes occur.',
    evidenceRequirements: [
      'Role-based training curriculum for each identified security role',
      'Training completion records showing role-specific training was delivered to relevant personnel',
      'Training effectiveness assessments such as quizzes or practical exercises',
    ],
    testProcedures: [
      'Verify that all personnel in security-specific roles have completed the required role-based training',
      'Review training content to confirm it covers the skills and knowledge necessary for the assigned role',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.1',
    name: 'System Auditing',
    description:
      'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity. Comprehensive audit logging is essential for detecting and investigating security incidents.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure all systems to generate audit logs that capture security-relevant events including logins, access attempts, privilege changes, and configuration modifications. Centralize log collection using a SIEM or log management platform and define retention periods that meet regulatory and contractual requirements.',
    evidenceRequirements: [
      'Audit logging policy defining which events must be captured and retention periods',
      'SIEM or log management system configuration showing centralized log collection',
      'Sample audit log exports demonstrating capture of required security events',
    ],
    testProcedures: [
      'Perform a series of security-relevant actions such as login, file access, and privilege change and verify each is captured in audit logs',
      'Check the oldest available audit log entries and confirm they align with the defined retention period',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.2',
    name: 'User Accountability',
    description:
      'Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions. Accountability requires that each action recorded in audit logs is attributable to a specific user.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Ensure all user accounts are unique and that audit logs associate every recorded action with the specific user account that performed it. Prohibit the use of shared accounts and configure systems to log the authenticated user identity with each audited event.',
    evidenceRequirements: [
      'Policy prohibiting shared accounts and requiring unique user identification',
      'Audit log samples showing individual user attribution for recorded actions',
      'System configuration evidence demonstrating that shared or anonymous access is disabled',
    ],
    testProcedures: [
      'Review audit logs for a set of actions and verify each is attributed to a specific, identifiable user account',
      'Search the system for shared or generic accounts and confirm none are in active use',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.1',
    name: 'System Baselining',
    description:
      'Establish and maintain baseline configurations and inventories of organizational systems throughout the respective system development life cycles. Baselines provide a known-good reference for configuration management and change detection.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Define and document baseline configurations for all system types including hardware, software, firmware, and network settings. Store baselines in a configuration management database and update them whenever authorized changes are made to the system.',
    evidenceRequirements: [
      'Documented baseline configurations for each system type in the environment',
      'System inventory listing all hardware, software, and firmware components',
      'Change records showing baseline updates that correspond to authorized configuration changes',
    ],
    testProcedures: [
      'Compare the current configuration of a sample system against its documented baseline and identify any deviations',
      'Review the system inventory and verify it accurately reflects the current environment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.2',
    name: 'Security Configuration Enforcement',
    description:
      'Establish and enforce security configuration settings for information technology products employed in organizational systems. Systems must be hardened according to approved security configuration guides and benchmarks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Apply security configuration benchmarks such as CIS Benchmarks or DISA STIGs to all systems and enforce them through group policies, configuration management tools, or automation. Perform regular compliance scans to detect configuration drift and remediate deviations promptly.',
    evidenceRequirements: [
      'Approved security configuration standards or benchmarks for each system type',
      'Configuration compliance scan reports showing adherence to approved settings',
      'Remediation records for any configuration deviations identified during scans',
    ],
    testProcedures: [
      'Run a configuration compliance scan against a sample of systems and verify adherence to approved benchmarks',
      'Review remediation records for previously identified deviations and confirm they have been resolved',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.5',
    name: 'Access Restrictions for Change',
    description:
      'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems. Changes to systems must be controlled through formal processes that restrict who can make modifications.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement a change management process that requires documented approval before any system change is made and restricts change implementation to authorized personnel. Use technical controls such as separate administrative accounts and change management tools to enforce these restrictions.',
    evidenceRequirements: [
      'Change management policy defining approval requirements and authorized change implementers',
      'Change request and approval records for recent system modifications',
      'System access configurations showing only authorized personnel can make changes to production systems',
    ],
    testProcedures: [
      'Attempt to make a system change without completing the change approval process and verify the attempt is blocked',
      'Review a sample of recent change records and confirm each has documented approval from authorized personnel',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.3',
    name: 'Multi-Factor Authentication',
    description:
      'Use multi-factor authentication for local and network access to privileged accounts and for network access to non-privileged accounts. MFA significantly reduces the risk of credential compromise by requiring multiple forms of verification.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Deploy MFA solutions that require at least two distinct authentication factors for all privileged access and all network-based access to non-privileged accounts. Approved factors include something you know, something you have, and something you are, and the solution must use factors from at least two different categories.',
    evidenceRequirements: [
      'MFA policy specifying where multi-factor authentication is required and approved factor types',
      'MFA system configuration showing enforcement for privileged and non-privileged network access',
      'MFA enrollment records showing all required accounts are enrolled',
    ],
    testProcedures: [
      'Attempt to access a privileged account without completing MFA and verify that access is denied',
      'Attempt network access to a non-privileged account without MFA and verify that access is denied',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IR.L2-3.6.1',
    name: 'Incident Handling',
    description:
      'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities. A mature incident response capability minimizes damage from security events.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Develop and maintain an incident response plan that defines roles, responsibilities, communication procedures, and response steps for each phase of incident handling. Conduct tabletop exercises and simulations at least annually to test the plan and identify improvement opportunities.',
    evidenceRequirements: [
      'Incident response plan covering preparation, detection, analysis, containment, recovery, and lessons learned',
      'Incident response team roster with defined roles and contact information',
      'Records of incident response exercises and tabletop drills conducted within the past year',
    ],
    testProcedures: [
      'Review the incident response plan and verify it addresses all required phases of incident handling',
      'Review records of the most recent incident response exercise and confirm lessons learned were incorporated into the plan',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IR.L2-3.6.2',
    name: 'Incident Reporting',
    description:
      'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization. Timely reporting ensures that incidents are escalated appropriately and contractual or legal reporting obligations are met.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Define incident reporting procedures that specify timelines, reporting chains, and required information for both internal and external stakeholders. Implement an incident tracking system to document the lifecycle of each incident from detection through resolution and final reporting.',
    evidenceRequirements: [
      'Incident reporting procedures specifying timelines, escalation paths, and external reporting requirements',
      'Incident tracking system records showing documented incidents with full lifecycle details',
      'Evidence of external incident reports submitted to required authorities when applicable',
    ],
    testProcedures: [
      'Review documented incidents and verify they were reported within the timeframes specified in the reporting procedures',
      'Verify that the incident tracking system captures all required details including detection, response, and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MA.L2-3.7.1',
    name: 'Perform Maintenance',
    description:
      'Perform maintenance on organizational systems. Maintenance activities must be planned, scheduled, and documented to keep systems operating securely and reliably.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish a maintenance schedule that covers preventive, corrective, and adaptive maintenance for all organizational systems. Document all maintenance activities including the work performed, personnel involved, and any configuration changes made during maintenance.',
    evidenceRequirements: [
      'System maintenance policy and schedule covering preventive and corrective maintenance',
      'Maintenance work orders and completion records for recent maintenance activities',
      'Records of configuration changes made during maintenance and their approvals',
    ],
    testProcedures: [
      'Review maintenance records for a sample of systems and verify that scheduled maintenance was performed on time',
      'Verify that all maintenance activities are documented with sufficient detail to reconstruct what was done',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MA.L2-3.7.2',
    name: 'System Maintenance Control',
    description:
      'Provide controls on the tools, techniques, mechanisms, and personnel used for information system maintenance. Maintenance tools and activities must be authorized and monitored to prevent unauthorized modifications.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Maintain an approved list of maintenance tools and require authorization for their use on production systems. Supervise maintenance activities performed by external personnel and inspect maintenance tools brought into the facility to prevent introduction of malicious components.',
    evidenceRequirements: [
      'Approved maintenance tools list and authorization procedures for their use',
      'Supervision records for maintenance performed by external or contractor personnel',
      'Inspection records for maintenance tools and equipment brought into the facility',
    ],
    testProcedures: [
      'Verify that maintenance tools in use on production systems are on the approved tools list',
      'Review supervision records for external maintenance activities and confirm authorized personnel were present',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RA.L2-3.11.1',
    name: 'Risk Assessments',
    description:
      'Periodically assess the risk to organizational operations, organizational assets, and individuals resulting from the operation of organizational systems and the processing, storage, or transmission of CUI. Risk assessments inform security decisions and resource allocation.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Conduct comprehensive risk assessments at least annually and whenever significant system changes occur, covering threats, vulnerabilities, likelihood, and impact. Document risk assessment results and use them to prioritize security investments and update the system security plan.',
    evidenceRequirements: [
      'Risk assessment methodology and framework documentation',
      'Completed risk assessment reports with identified threats, vulnerabilities, and risk ratings',
      'Risk treatment plans showing how identified risks are being mitigated, accepted, or transferred',
    ],
    testProcedures: [
      'Review the most recent risk assessment and verify it covers all in-scope systems and CUI data flows',
      'Verify that identified risks have corresponding treatment plans and that high-priority risks are being actively addressed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RA.L2-3.11.2',
    name: 'Vulnerability Scan',
    description:
      'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems are identified. Regular scanning identifies weaknesses before they can be exploited by adversaries.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Perform authenticated vulnerability scans on all systems at least monthly and conduct ad-hoc scans when new critical vulnerabilities are disclosed. Prioritize scan findings by severity and feed results into the patch management process for timely remediation.',
    evidenceRequirements: [
      'Vulnerability scanning policy specifying scan frequency, scope, and tools',
      'Vulnerability scan reports from the past quarter showing identified vulnerabilities and severity ratings',
      'Records linking scan findings to remediation actions in the patch management process',
    ],
    testProcedures: [
      'Review vulnerability scan schedules and reports to verify scans are conducted at the required frequency',
      'Trace a sample of high-severity scan findings to their remediation records and confirm they were addressed within defined timeframes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RA.L2-3.11.3',
    name: 'Vulnerability Remediation',
    description:
      'Remediate vulnerabilities in accordance with risk assessments. Identified vulnerabilities must be prioritized and addressed based on their risk to the organization to reduce the attack surface effectively.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish a vulnerability remediation process that prioritizes fixes based on risk severity, asset criticality, and exploitability. Track remediation progress and escalate overdue items to management to ensure timely resolution of identified vulnerabilities.',
    evidenceRequirements: [
      'Vulnerability remediation policy defining prioritization criteria and remediation timeframes',
      'Vulnerability tracking database or system showing status of all identified vulnerabilities',
      'Management escalation records for overdue vulnerability remediation items',
    ],
    testProcedures: [
      'Review the vulnerability tracking system and verify that high-severity vulnerabilities were remediated within defined timeframes',
      'Select a sample of closed vulnerabilities and confirm that remediation was validated through follow-up scanning',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CA.L2-3.12.1',
    name: 'Security Control Assessment',
    description:
      'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application. Regular assessments validate that security measures are working as intended.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Develop a security assessment plan that defines the scope, methodology, and schedule for evaluating each security control. Conduct assessments at least annually using a combination of automated testing, manual review, and interviews with control owners.',
    evidenceRequirements: [
      'Security control assessment plan defining scope, methodology, and schedule',
      'Completed assessment reports with findings and effectiveness ratings for each control',
      'Plan of action and milestones (POA&M) documenting remediation for deficient controls',
    ],
    testProcedures: [
      'Review the assessment schedule and confirm that all controls have been assessed within the required timeframe',
      'Review assessment findings and verify that identified deficiencies have corresponding POA&M entries',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CA.L2-3.12.4',
    name: 'System Security Plan',
    description:
      'Develop, document, and periodically update system security plans that describe system boundaries, operating environments, security requirements implementation, and relationships with other systems. The SSP is the foundational document for system authorization.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Create a comprehensive system security plan that describes the system architecture, data flows, security control implementation, and interconnections with other systems. Review and update the SSP at least annually and whenever significant changes occur to the system or its operating environment.',
    evidenceRequirements: [
      'Current system security plan covering all required elements including boundary, environment, and control descriptions',
      'SSP review and update records showing annual reviews and change-driven updates',
      'Approval signatures from authorizing officials on the current SSP version',
    ],
    testProcedures: [
      'Review the SSP and verify it accurately reflects the current system architecture, data flows, and security control implementations',
      'Confirm that the SSP has been reviewed and updated within the past year and that the current version is approved',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.8',
    name: 'CUI Encryption in Transit',
    description:
      'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards. Encryption in transit protects data from interception and eavesdropping.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Require the use of FIPS-validated cryptographic modules and protocols such as TLS 1.2 or higher for all transmission of CUI across networks. Disable weak or deprecated cryptographic protocols and cipher suites on all systems that transmit CUI.',
    evidenceRequirements: [
      'Encryption in transit policy specifying required protocols and FIPS-validated cryptographic modules',
      'System and network configurations showing TLS 1.2+ enforcement for CUI transmission paths',
      'Scan or assessment results confirming no weak or deprecated protocols are in use for CUI transmission',
    ],
    testProcedures: [
      'Capture network traffic for a CUI transmission and verify it is encrypted using an approved protocol',
      'Run a TLS configuration scan on systems that transmit CUI and confirm no weak protocols or cipher suites are enabled',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.11',
    name: 'CUI Encryption at Rest',
    description:
      'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI at rest. Data at rest encryption prevents unauthorized access to CUI on storage media if physical or logical access controls are bypassed.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Deploy FIPS 140-2 or FIPS 140-3 validated encryption solutions to protect CUI stored on all media types including hard drives, databases, and backups. Manage encryption keys securely using a key management system with defined key rotation and access policies.',
    evidenceRequirements: [
      'Encryption at rest policy specifying FIPS-validated solutions and applicable storage types',
      'FIPS validation certificates for the cryptographic modules in use',
      'Key management procedures and records showing secure key storage, rotation, and access controls',
    ],
    testProcedures: [
      'Verify that CUI storage locations are encrypted using FIPS-validated cryptographic modules by checking module certificates',
      'Review key management records and confirm that encryption keys are stored securely and rotated per policy',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // LEVEL 3 - EXPERT (8 additional enhanced practices)
  // ============================================================
  {
    controlId: 'AC.L3-3.1.2E',
    name: 'Dual Authorization',
    description:
      'Employ dual authorization to execute critical or sensitive system operations. Requiring two authorized individuals to approve and execute high-impact actions prevents unilateral misuse and reduces the risk of insider threat.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Identify critical system operations that require dual authorization such as bulk data deletion, system configuration changes, and key management operations. Implement technical controls that enforce a two-person approval workflow before these operations can be executed.',
    evidenceRequirements: [
      'Policy identifying critical operations requiring dual authorization and the designated approver roles',
      'System configuration or workflow tool settings enforcing dual authorization for identified operations',
      'Audit logs showing dual authorization was obtained for recent critical operations',
    ],
    testProcedures: [
      'Attempt to execute a designated critical operation with only a single authorization and verify the system blocks execution',
      'Review audit logs for recent critical operations and confirm each shows two distinct authorized approvals',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AT.L3-3.2.1E',
    name: 'Advanced Threat Awareness',
    description:
      'Provide awareness training focused on recognizing and responding to threats from advanced persistent threats (APTs), social engineering, and other sophisticated attack vectors. Enhanced awareness prepares personnel to recognize and counter advanced adversary techniques.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Develop and deliver advanced threat awareness training that covers APT tactics, techniques, and procedures, spear-phishing, watering hole attacks, and supply chain compromise. Conduct realistic phishing simulations and red team exercises to test personnel readiness at least quarterly.',
    evidenceRequirements: [
      'Advanced threat awareness training curriculum covering APT tactics, social engineering, and sophisticated attack vectors',
      'Training completion records showing all personnel in targeted roles received advanced threat training',
      'Phishing simulation results and red team exercise reports from the past year',
    ],
    testProcedures: [
      'Review advanced threat training materials and verify coverage of current APT tactics and sophisticated attack vectors',
      'Analyze phishing simulation results and confirm that click rates meet organizational improvement targets',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IR.L3-3.6.1E',
    name: 'Automated Incident Response',
    description:
      'Establish and maintain an automated incident response capability that can detect, analyze, and respond to security incidents in near real-time. Automation accelerates response times and reduces the window of exposure during active attacks.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Deploy SOAR (Security Orchestration, Automation, and Response) tools integrated with SIEM to automatically detect, triage, and execute predefined response playbooks for common incident types. Define automated response actions such as account disablement, network isolation, and evidence preservation for each incident category.',
    evidenceRequirements: [
      'SOAR platform configuration and integration documentation with SIEM and other security tools',
      'Automated response playbooks for each defined incident category with trigger conditions and actions',
      'Incident records showing automated response execution times and outcomes for recent incidents',
    ],
    testProcedures: [
      'Trigger a simulated security incident and verify that the SOAR platform automatically executes the appropriate response playbook',
      'Review automated incident response logs and confirm that response times meet the defined near-real-time targets',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RA.L3-3.11.1E',
    name: 'Threat Hunting',
    description:
      'Employ threat-hunting activities to proactively search for indicators of compromise and advanced threats that may have evaded existing security controls. Threat hunting augments automated detection by applying human analysis to uncover hidden adversary activity.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Establish a dedicated threat hunting team or capability that uses threat intelligence, behavioral analytics, and hypothesis-driven investigations to proactively search for indicators of compromise. Conduct threat hunting activities on a regular cadence and document findings to refine detection rules and improve security posture.',
    evidenceRequirements: [
      'Threat hunting program charter defining objectives, methodology, and cadence',
      'Threat hunting reports documenting hypotheses tested, data sources analyzed, and findings',
      'Records showing threat hunting findings were used to update detection rules and improve security controls',
    ],
    testProcedures: [
      'Review threat hunting reports and verify that hunts are conducted at the defined cadence using current threat intelligence',
      'Trace threat hunting findings to corresponding detection rule updates or security control improvements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L3-3.13.4E',
    name: 'Data Isolation',
    description:
      'Employ isolation techniques to separate system components processing, storing, or transmitting CUI into distinct security domains. Data isolation limits the blast radius of a compromise and prevents lateral movement between security domains.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement network micro-segmentation, virtualization, or containerization to isolate CUI processing environments from other system components. Define strict inter-domain communication policies and enforce them through zero-trust network controls and application-layer firewalls.',
    evidenceRequirements: [
      'Data isolation architecture document showing security domains and isolation boundaries',
      'Network micro-segmentation or virtualization configurations enforcing domain separation',
      'Inter-domain communication policies and firewall rules restricting cross-domain traffic',
    ],
    testProcedures: [
      'Attempt to access a CUI processing environment from a non-CUI domain and verify the connection is blocked',
      'Review micro-segmentation or isolation configurations and confirm they enforce the defined security domain boundaries',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L3-3.14.3E',
    name: 'Advanced Sandboxing',
    description:
      'Employ advanced automated tools and techniques to perform in-depth analysis of suspicious files, code, and URLs in sandboxed environments. Sandboxing enables safe detonation and analysis of potentially malicious content without risking production systems.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Deploy an automated malware analysis sandbox that intercepts and detonates suspicious files, email attachments, and URLs in an isolated environment before they reach end users. Integrate the sandbox with email gateways, web proxies, and endpoint protection to automatically submit suspicious content for analysis.',
    evidenceRequirements: [
      'Sandbox solution architecture and integration documentation with email, web, and endpoint systems',
      'Sandbox analysis reports showing detonation results and verdicts for submitted samples',
      'Configuration records showing automated submission of suspicious content to the sandbox',
    ],
    testProcedures: [
      'Submit a known-malicious test sample to the sandbox and verify it is correctly identified and blocked',
      'Review sandbox integration with email and web gateways and confirm suspicious content is automatically routed for analysis',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L3-3.14.6E',
    name: 'Threat Monitoring',
    description:
      'Monitor organizational systems including inbound and outbound communications traffic to detect attacks and indicators of potential attacks. Continuous monitoring enables rapid detection of adversary activity across the full attack lifecycle.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Deploy continuous monitoring solutions including network traffic analysis, endpoint detection and response (EDR), and SIEM correlation to detect attacks and indicators of compromise in real-time. Integrate threat intelligence feeds to enrich monitoring with current indicators of compromise and adversary infrastructure.',
    evidenceRequirements: [
      'Continuous monitoring architecture showing coverage of network, endpoint, and application layers',
      'SIEM correlation rules and alerting configurations aligned with current threat intelligence',
      'Monitoring effectiveness metrics showing detection rates, alert volumes, and mean time to detect',
    ],
    testProcedures: [
      'Execute a controlled adversary simulation and verify that monitoring tools detect the attack indicators within the defined detection timeframe',
      'Review SIEM alert logs and correlation rules and confirm they are tuned to current threat intelligence indicators',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L3-3.14.7E',
    name: 'Suspicious Communications',
    description:
      'Identify unauthorized use of organizational systems and detect communications indicating potential compromise or policy violations. Detecting anomalous communications patterns helps identify compromised systems and insider threats.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement network behavior analysis and user and entity behavior analytics (UEBA) tools to establish baselines for normal communication patterns and detect deviations that may indicate compromise. Configure alerts for anomalous traffic such as unusual data exfiltration volumes, connections to known-malicious infrastructure, and off-hours communication spikes.',
    evidenceRequirements: [
      'UEBA and network behavior analysis tool deployment and configuration documentation',
      'Baseline communication profiles and threshold definitions for anomaly detection',
      'Alert investigation records for flagged suspicious communication events',
    ],
    testProcedures: [
      'Generate simulated anomalous network traffic and verify the behavior analysis tools detect and alert on the deviation',
      'Review investigation records for recent suspicious communication alerts and confirm timely triage and resolution',
    ],
    status: 'Not Started',
  },
];
