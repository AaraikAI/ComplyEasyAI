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
  // Additional Level 2 Access Control Practices
  {
    controlId: 'AC.L2-3.1.6',
    name: 'Non-Privileged Account Use',
    description:
      'Require that users of organizational systems use non-privileged accounts or roles when accessing nonsecurity functions. This minimizes the attack surface by ensuring privileged access is only used when necessary.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure separate accounts for administrative and regular user activities. Implement policies requiring users to log in with non-privileged accounts for standard tasks such as email, web browsing, and document creation, and only use privileged accounts for specific administrative functions.',
    evidenceRequirements: [
      'Policy requiring separate privileged and non-privileged accounts for different functions',
      'Account inventory showing distinct privileged and non-privileged accounts per user',
      'System logs demonstrating that privileged accounts are only used for administrative tasks',
    ],
    testProcedures: [
      'Review a sample of users with administrative access and verify they have separate accounts for privileged and non-privileged functions',
      'Analyze system logs to confirm privileged accounts are not used for routine non-administrative tasks',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.9',
    name: 'Privacy and Security Notices',
    description:
      'Provide privacy and security notices consistent with applicable CUI rules. Users must be informed of monitoring, acceptable use policies, and security responsibilities before accessing systems.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Display system use notification banners at login points that inform users of monitoring activities, acceptable use restrictions, and consequences of unauthorized access. Require users to acknowledge the notice before gaining system access.',
    evidenceRequirements: [
      'System use notification banner text meeting organizational and regulatory requirements',
      'System configurations showing login banners are displayed on all access points',
      'Records of user acknowledgment of system use policies where applicable',
    ],
    testProcedures: [
      'Log into various system access points and verify that appropriate privacy and security notices are displayed',
      'Review banner content to confirm it includes required monitoring and acceptable use language',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.10',
    name: 'Session Lock',
    description:
      'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity. Session locks protect unattended workstations from unauthorized access.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure automatic session lock after a defined period of inactivity, typically 15 minutes or less, with a pattern-hiding display such as a screensaver or blank screen. Require reauthentication to unlock the session and resume activity.',
    evidenceRequirements: [
      'Session lock policy specifying inactivity timeout thresholds',
      'System configuration exports showing automatic session lock settings',
      'Screenshots or configuration evidence of pattern-hiding displays',
    ],
    testProcedures: [
      'Allow a workstation to remain idle and verify that session lock engages within the defined timeout period',
      'Confirm that a pattern-hiding display is active and that reauthentication is required to resume the session',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.11',
    name: 'Session Termination',
    description:
      'Terminate (automatically) user sessions after a defined condition such as prolonged inactivity or session duration limits. Automatic session termination reduces the risk of session hijacking and unauthorized access.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure systems to automatically terminate user sessions after extended inactivity or after a maximum session duration is reached. Implement session management controls that force reauthentication after termination.',
    evidenceRequirements: [
      'Session termination policy defining conditions and thresholds for automatic termination',
      'System configuration evidence showing session termination settings',
      'Session management logs showing automatic terminations occurring per policy',
    ],
    testProcedures: [
      'Establish a session and allow it to remain idle past the termination threshold, verifying automatic termination occurs',
      'Review session logs to confirm automatic terminations are occurring as configured',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.13',
    name: 'Remote Access Confidentiality',
    description:
      'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions. All remote connections must be encrypted to prevent eavesdropping and data interception.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Require the use of VPN with strong encryption or other cryptographic tunnels for all remote access to organizational systems. Disable unencrypted remote access protocols and configure remote access gateways to enforce FIPS-validated cryptography.',
    evidenceRequirements: [
      'Remote access encryption policy specifying approved protocols and cryptographic requirements',
      'VPN and remote access gateway configurations showing encryption enforcement',
      'Periodic assessment reports confirming remote access encryption is functioning correctly',
    ],
    testProcedures: [
      'Capture remote access session traffic and verify it is encrypted using approved cryptographic protocols',
      'Attempt to establish a remote connection using an unencrypted protocol and verify it is blocked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.14',
    name: 'Remote Access Routing',
    description:
      'Route remote access via managed access control points. All remote connections must pass through a limited number of managed and monitored access points to enable security inspection and control.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish a limited number of remote access control points such as VPN concentrators or jump servers and configure network controls to force all remote traffic through these points. Monitor and log all traffic passing through remote access control points.',
    evidenceRequirements: [
      'Network architecture diagram showing remote access control points',
      'Firewall and routing configurations directing remote access through managed points',
      'Monitoring logs from remote access control points showing traffic inspection',
    ],
    testProcedures: [
      'Attempt to establish a remote connection that bypasses the managed access control point and verify it is blocked',
      'Review logs from remote access control points to confirm all remote sessions are captured',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.15',
    name: 'Privileged Remote Access',
    description:
      'Authorize remote execution of privileged commands and remote access to security-relevant information. Privileged remote operations require explicit authorization and enhanced monitoring.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish an authorization process for privileged remote access that requires management approval before access is granted. Implement enhanced logging and monitoring for all privileged remote sessions and review logs regularly for anomalies.',
    evidenceRequirements: [
      'Policy defining authorization requirements for privileged remote access',
      'Authorization records for privileged remote access requests and approvals',
      'Enhanced audit logs for privileged remote sessions with detailed command logging',
    ],
    testProcedures: [
      'Verify that privileged remote access sessions are only established after proper authorization is documented',
      'Review privileged remote access logs and confirm detailed command logging is captured',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.16',
    name: 'Wireless Access Authorization',
    description:
      'Authorize wireless access prior to allowing such connections. Wireless connections must be explicitly approved and configured to meet security requirements before use.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish an authorization process for wireless access that evaluates security risks and ensures appropriate controls are in place. Configure wireless access points with strong encryption (WPA3 or WPA2-Enterprise) and authentication before enabling wireless connectivity.',
    evidenceRequirements: [
      'Wireless access authorization policy and approval process documentation',
      'Authorization records for deployed wireless access points',
      'Wireless access point configurations showing security settings',
    ],
    testProcedures: [
      'Review wireless access point deployment records and verify each has documented authorization',
      'Scan for unauthorized wireless access points and confirm none are connected to the network',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.17',
    name: 'Wireless Access Protection',
    description:
      'Protect wireless access using authentication and encryption. Wireless networks must employ strong security controls to prevent unauthorized access and data interception.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure all wireless networks with WPA3 or WPA2-Enterprise authentication using strong credentials or certificates. Enable wireless encryption and disable legacy insecure protocols such as WEP. Segment wireless networks from sensitive internal resources.',
    evidenceRequirements: [
      'Wireless security policy specifying required authentication and encryption standards',
      'Wireless access point configurations showing WPA3/WPA2-Enterprise and encryption settings',
      'Network segmentation documentation for wireless networks',
    ],
    testProcedures: [
      'Attempt to connect to wireless networks without proper authentication and verify access is denied',
      'Scan wireless networks to confirm only approved encryption protocols are in use',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.18',
    name: 'Mobile Device Access Control',
    description:
      'Control connection of mobile devices. Organizations must manage and control which mobile devices can connect to organizational systems and networks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement mobile device management (MDM) solutions to register, configure, and control mobile devices connecting to organizational resources. Establish policies that define approved device types, required security configurations, and connection procedures.',
    evidenceRequirements: [
      'Mobile device access policy defining approved devices and security requirements',
      'MDM enrollment records showing registered devices and compliance status',
      'Mobile device security configurations enforced through MDM',
    ],
    testProcedures: [
      'Attempt to connect an unregistered mobile device to organizational resources and verify access is denied',
      'Review MDM compliance reports and verify enrolled devices meet security requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.19',
    name: 'Mobile Device Encryption',
    description:
      'Encrypt CUI on mobile devices and mobile computing platforms. Mobile devices that store or process CUI must employ encryption to protect data if the device is lost or stolen.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Enable full-disk encryption or container encryption on all mobile devices that may store or access CUI. Configure MDM to enforce encryption requirements and prevent access to CUI from devices that do not meet encryption standards.',
    evidenceRequirements: [
      'Mobile device encryption policy requiring encryption for CUI on mobile devices',
      'MDM configuration showing encryption enforcement on enrolled devices',
      'Device compliance reports showing encryption status for all enrolled devices',
    ],
    testProcedures: [
      'Verify that enrolled mobile devices have encryption enabled by reviewing MDM compliance reports',
      'Attempt to access CUI from a mobile device without encryption enabled and verify access is blocked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AC.L2-3.1.21',
    name: 'Portable Storage Use',
    description:
      'Limit use of portable storage devices on external systems. Organizations must control the use of organization-controlled portable storage on systems not owned or managed by the organization.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish policies that restrict or prohibit the use of organizational portable storage devices on external or personal systems. Implement technical controls such as device encryption and usage logging to track and protect portable storage device contents.',
    evidenceRequirements: [
      'Policy defining restrictions on portable storage device use on external systems',
      'Portable storage device inventory and encryption configurations',
      'User acknowledgment of portable storage usage policies',
    ],
    testProcedures: [
      'Review portable storage policies and verify they address use restrictions on external systems',
      'Verify that organizational portable storage devices are encrypted and inventoried',
    ],
    status: 'Not Started',
  },
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
    controlId: 'AU.L2-3.3.3',
    name: 'Event Review',
    description:
      'Review and update logged events. Organizations must periodically review the types of events being logged and adjust audit configurations to ensure relevant security events are captured.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish a process to review audit log content and configurations at least annually. Assess whether current logging captures the events necessary for security monitoring and incident investigation, and update configurations to address gaps.',
    evidenceRequirements: [
      'Audit log review policy specifying review frequency and criteria',
      'Records of periodic audit configuration reviews and changes made',
      'Updated audit logging configurations reflecting review findings',
    ],
    testProcedures: [
      'Review audit configuration change records and verify reviews are conducted per the defined schedule',
      'Verify that recent review findings resulted in appropriate audit configuration updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.4',
    name: 'Audit Failure Alerting',
    description:
      'Alert in the event of an audit logging process failure. When audit logging fails, security personnel must be notified so they can investigate and restore logging capabilities.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure audit logging systems to generate alerts when logging failures occur, such as log storage capacity exhaustion or logging service crashes. Route alerts to security personnel for immediate investigation and remediation.',
    evidenceRequirements: [
      'Audit failure alerting configuration in logging systems',
      'Alert routing rules directing audit failure alerts to security personnel',
      'Records of audit failure alerts and response actions taken',
    ],
    testProcedures: [
      'Simulate an audit logging failure and verify that alerts are generated and delivered to security personnel',
      'Review historical audit failure alerts and confirm timely response and resolution',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.5',
    name: 'Audit Review and Analysis',
    description:
      'Correlate audit record review, analysis, and reporting processes to support organizational processes for investigation and response to suspicious activities. Centralized analysis enables effective security monitoring.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement a SIEM or centralized log management platform that correlates audit records from multiple sources. Establish processes for regular log review, automated correlation rules, and generation of security reports to support investigations.',
    evidenceRequirements: [
      'SIEM or log management platform configuration and integration documentation',
      'Correlation rules and alerting configurations for security events',
      'Regular security monitoring reports generated from audit data analysis',
    ],
    testProcedures: [
      'Review SIEM correlation rules and verify they address common attack patterns and policy violations',
      'Request recent security monitoring reports and confirm they are generated from correlated audit data',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.6',
    name: 'Audit Reduction and Report Generation',
    description:
      'Provide audit record reduction and report generation to support on-demand analysis and reporting. Organizations must be able to filter, summarize, and report on audit data to support security operations.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure audit logging and SIEM platforms with search, filter, and reporting capabilities that enable security analysts to quickly locate relevant records. Create predefined report templates for common compliance and security monitoring needs.',
    evidenceRequirements: [
      'Audit reduction and search capability documentation',
      'Predefined report templates for compliance and security monitoring',
      'Sample reports demonstrating audit data reduction and summarization',
    ],
    testProcedures: [
      'Request a specific audit report and verify it can be generated within a reasonable timeframe',
      'Demonstrate audit search and filtering capabilities to locate specific events',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.7',
    name: 'Time Synchronization',
    description:
      'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records. Accurate time stamps are essential for event correlation and forensic analysis.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure all systems to synchronize time with authoritative NTP servers. Use multiple time sources for redundancy and configure systems to log time synchronization failures. Ensure consistent time zone settings across the environment.',
    evidenceRequirements: [
      'NTP configuration showing authoritative time sources for all systems',
      'Time synchronization monitoring records showing systems remain synchronized',
      'Documentation of time zone standardization across the environment',
    ],
    testProcedures: [
      'Check NTP configuration on a sample of systems and verify they are synchronized to authoritative sources',
      'Compare timestamps in audit logs from multiple systems and verify they are consistent',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.8',
    name: 'Audit Record Protection',
    description:
      'Protect audit information and audit logging tools from unauthorized access, modification, and deletion. Audit records must be protected to ensure their integrity for investigations and compliance.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement access controls on audit logs and logging tools that restrict access to authorized security personnel only. Enable write-once or append-only storage for audit logs to prevent modification. Back up audit logs to separate, protected storage.',
    evidenceRequirements: [
      'Access control configurations restricting audit log access to authorized personnel',
      'Write-once or immutable storage configuration for audit logs',
      'Audit log backup procedures and protected storage documentation',
    ],
    testProcedures: [
      'Attempt to access, modify, or delete audit logs with a non-authorized account and verify access is denied',
      'Verify that audit logs are backed up to protected storage per the defined schedule',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L2-3.3.9',
    name: 'Audit Management Access Limitation',
    description:
      'Limit management of audit logging functionality to a subset of privileged users. Only designated administrators should be able to configure or modify audit logging settings.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Restrict the ability to configure, enable, disable, or modify audit logging to a small group of designated security administrators. Implement role-based access controls that separate audit management from general system administration.',
    evidenceRequirements: [
      'Role definitions showing audit management is restricted to designated administrators',
      'Access control configurations limiting audit logging management capabilities',
      'Records of personnel authorized to manage audit logging functionality',
    ],
    testProcedures: [
      'Attempt to modify audit logging configurations with a non-designated administrative account and verify access is denied',
      'Review the list of accounts with audit management privileges and confirm it is limited to authorized personnel',
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
    controlId: 'CM.L2-3.4.3',
    name: 'System Change Tracking',
    description:
      'Track, review, approve, or disapprove, and log changes to organizational systems. All system changes must be documented, reviewed, and approved before implementation.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement a change management system that tracks all proposed changes, requires documented approval before implementation, and maintains a log of completed changes. Include impact assessment and rollback procedures in the change management process.',
    evidenceRequirements: [
      'Change management system or tracking tool documentation',
      'Change request records showing review and approval workflows',
      'Change logs documenting completed changes with dates and responsible parties',
    ],
    testProcedures: [
      'Review the change management system and verify all changes have documented approval',
      'Select a sample of recent changes and trace them from request through approval to implementation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.4',
    name: 'Security Impact Analysis',
    description:
      'Analyze the security impact of changes prior to implementation. Changes must be assessed for security implications before they are deployed to production systems.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Include security impact analysis as a required step in the change management process. Require security team review of changes that affect security controls, configurations, or data handling before approval and implementation.',
    evidenceRequirements: [
      'Security impact analysis procedures integrated into change management',
      'Security impact assessment records for recent system changes',
      'Security team sign-off documentation for security-relevant changes',
    ],
    testProcedures: [
      'Review change records for security-relevant changes and verify security impact analysis was performed',
      'Verify that the security team reviewed and approved changes affecting security controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.6',
    name: 'Least Functionality',
    description:
      'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities. Disable unnecessary functions, ports, protocols, and services.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure systems to provide only the functions, ports, protocols, and services required for their intended purpose. Disable or remove unnecessary features, remove unused software, and close unused network ports. Document the required functionality for each system type.',
    evidenceRequirements: [
      'System hardening standards specifying required and prohibited functions per system type',
      'Configuration scan results showing disabled unnecessary services and ports',
      'Documentation justifying enabled functions for each system',
    ],
    testProcedures: [
      'Scan a sample of systems for unnecessary services and ports and verify they are disabled',
      'Review system configurations against hardening standards and identify any deviations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.7',
    name: 'Nonessential Programs',
    description:
      'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services. Organizations must control software and services to minimize attack surface.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement application whitelisting or software restriction policies that prevent unauthorized programs from executing. Use network controls to block nonessential ports and protocols. Regularly review installed software and remove programs that are not required.',
    evidenceRequirements: [
      'Application whitelisting or software restriction policy and tool configuration',
      'Approved software list with business justification for each application',
      'Network port and protocol restriction configurations',
    ],
    testProcedures: [
      'Attempt to execute an unauthorized application and verify it is blocked',
      'Review installed software on a sample of systems and verify only approved applications are present',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.8',
    name: 'Application Execution Policy',
    description:
      'Apply deny-by-exception (blacklisting) or allow-by-exception (whitelisting) policy to prevent the use of unauthorized software. Control software execution to prevent malware and unauthorized programs.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement application control solutions that use allowlisting to permit only approved software to execute, or denylisting to block known malicious or unauthorized software. Configure the solution to cover all executable types and scripts.',
    evidenceRequirements: [
      'Application control policy specifying allowlist or denylist approach',
      'Application control tool configuration and rule sets',
      'Records of blocked execution attempts and policy exceptions',
    ],
    testProcedures: [
      'Attempt to execute software not on the approved list and verify execution is blocked',
      'Review application control logs for recent blocked execution attempts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L2-3.4.9',
    name: 'User-Installed Software',
    description:
      'Control and monitor user-installed software. Users should not be able to install unauthorized software on organizational systems.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Remove local administrator rights from standard users and implement software deployment tools for approved installations. Monitor systems for unauthorized software and remove it when detected. Provide a process for users to request software installation.',
    evidenceRequirements: [
      'Policy restricting user software installation capabilities',
      'System configurations showing users lack local administrator rights',
      'Software inventory monitoring reports identifying unauthorized installations',
    ],
    testProcedures: [
      'Log in as a standard user and attempt to install software, verifying the attempt is blocked',
      'Review software inventory reports and verify unauthorized software is detected and removed',
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
    controlId: 'IA.L2-3.5.4',
    name: 'Replay-Resistant Authentication',
    description:
      'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts. Authentication protocols must prevent attackers from capturing and reusing authentication credentials.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement authentication protocols that include replay-resistant mechanisms such as time-based one-time passwords, challenge-response protocols, or cryptographic nonces. Avoid protocols vulnerable to replay attacks such as basic authentication over unencrypted channels.',
    evidenceRequirements: [
      'Authentication protocol specifications showing replay-resistant mechanisms',
      'System configuration evidence showing replay-resistant authentication enforcement',
      'Assessment results confirming replay attack resistance',
    ],
    testProcedures: [
      'Capture an authentication attempt and attempt to replay it, verifying the replay is rejected',
      'Review authentication configurations and verify replay-resistant protocols are in use',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.5',
    name: 'Identifier Reuse Prevention',
    description:
      'Prevent reuse of identifiers for a defined period. User IDs and other identifiers should not be reassigned to different entities until a sufficient time has passed.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish policies that prevent identifier reuse for a minimum defined period, typically at least one year. Configure identity management systems to track and prevent reassignment of identifiers during the restriction period.',
    evidenceRequirements: [
      'Identifier reuse policy specifying the minimum restriction period',
      'Identity management system configuration enforcing reuse restrictions',
      'Records demonstrating identifiers are not reused during the restriction period',
    ],
    testProcedures: [
      'Attempt to create a new account using a recently deactivated identifier and verify the attempt is blocked',
      'Review identifier assignment records and confirm no reuse violations have occurred',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.6',
    name: 'Identifier Deactivation',
    description:
      'Disable identifiers after a defined period of inactivity. Dormant accounts and identifiers should be automatically disabled to reduce the attack surface.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure identity management systems to automatically disable accounts after a defined period of inactivity, typically 90 days or less. Implement processes to review and handle disabled accounts including permanent removal when appropriate.',
    evidenceRequirements: [
      'Account inactivity policy specifying the deactivation threshold',
      'Identity system configuration showing automatic deactivation settings',
      'Records of accounts disabled due to inactivity',
    ],
    testProcedures: [
      'Identify accounts that have been inactive beyond the threshold and verify they are disabled',
      'Review identity system logs for automatic deactivation events',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.7',
    name: 'Password Complexity',
    description:
      'Enforce a minimum password complexity and change of characters when new passwords are created. Passwords must meet complexity requirements to resist guessing and brute-force attacks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure password policies to require a minimum length of at least 14 characters, a mix of uppercase, lowercase, numbers, and special characters. Require that new passwords differ from previous passwords by a minimum number of characters.',
    evidenceRequirements: [
      'Password complexity policy specifying minimum length and character requirements',
      'System configuration exports showing password policy enforcement',
      'Records demonstrating password policy compliance across accounts',
    ],
    testProcedures: [
      'Attempt to set a password that does not meet complexity requirements and verify it is rejected',
      'Review password policy configurations on a sample of systems and confirm compliance with standards',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.8',
    name: 'Password Reuse Prohibition',
    description:
      'Prohibit password reuse for a specified number of generations. Users should not be able to reuse recent passwords to prevent cycling through a small set of passwords.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure password policies to maintain a password history and prevent reuse of a defined number of previous passwords, typically at least 24 generations. Enforce this policy across all systems that support password history tracking.',
    evidenceRequirements: [
      'Password reuse policy specifying the number of remembered passwords',
      'System configuration exports showing password history enforcement',
      'Testing results confirming password reuse prevention',
    ],
    testProcedures: [
      'Attempt to set a password that was recently used and verify it is rejected',
      'Review password history configurations and confirm they meet policy requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.9',
    name: 'Temporary Passwords',
    description:
      'Allow temporary password use for system logons with an immediate change to a permanent password. Temporary passwords issued for initial access or password resets must be changed immediately.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure systems to force password change at first login when temporary passwords are issued. Set temporary passwords to expire within a short timeframe if not changed. Use secure methods to communicate temporary passwords to users.',
    evidenceRequirements: [
      'Temporary password policy specifying usage and expiration requirements',
      'System configuration showing forced password change on first use',
      'Procedures for secure temporary password communication',
    ],
    testProcedures: [
      'Issue a temporary password and verify the system forces a password change at first login',
      'Verify that temporary passwords expire if not changed within the defined timeframe',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.10',
    name: 'Cryptographic Password Protection',
    description:
      'Store and transmit only cryptographically-protected passwords. Passwords must be hashed for storage and encrypted during transmission to prevent exposure.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure all systems to store passwords using strong cryptographic hashing algorithms with salts, such as bcrypt, scrypt, or Argon2. Ensure passwords are transmitted only over encrypted connections and never sent in cleartext.',
    evidenceRequirements: [
      'Password storage policy specifying approved hashing algorithms',
      'System configuration evidence showing cryptographic password storage',
      'Network configuration evidence showing encrypted password transmission',
    ],
    testProcedures: [
      'Review password storage configurations and verify approved cryptographic hashing is used',
      'Capture network traffic during authentication and verify passwords are not transmitted in cleartext',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L2-3.5.11',
    name: 'Obscured Feedback',
    description:
      'Obscure feedback of authentication information during the authentication process. Password entry fields must hide the characters being typed to prevent shoulder surfing.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure all authentication interfaces to mask password input by displaying asterisks, dots, or other placeholder characters. Ensure this behavior applies to all login forms, password change dialogs, and authentication prompts.',
    evidenceRequirements: [
      'Authentication interface design standards requiring password masking',
      'Screenshots or recordings demonstrating password masking on login screens',
      'Testing results confirming password obscuring across all authentication interfaces',
    ],
    testProcedures: [
      'Observe the authentication process on various systems and verify passwords are obscured during entry',
      'Test password fields on web applications and verify masking is applied',
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
    controlId: 'IR.L2-3.6.3',
    name: 'Incident Response Testing',
    description:
      'Test the organizational incident response capability. Regular testing ensures incident response plans are effective and personnel are prepared to respond to security events.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Conduct incident response exercises at least annually, including tabletop exercises, functional tests, and full-scale simulations. Document exercise results, identify gaps, and update incident response plans based on lessons learned.',
    evidenceRequirements: [
      'Incident response testing schedule and plan',
      'Exercise documentation including scenarios and participant roles',
      'After-action reports with identified gaps and improvement recommendations',
    ],
    testProcedures: [
      'Review incident response exercise records and verify exercises are conducted at the required frequency',
      'Verify that after-action reports document lessons learned and plan updates',
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
    controlId: 'MA.L2-3.7.3',
    name: 'Equipment Sanitization',
    description:
      'Ensure equipment removed for off-site maintenance is sanitized of any CUI. Systems containing CUI must have sensitive data removed before they leave organizational control for maintenance.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish procedures to sanitize or remove storage media from equipment before it is sent off-site for maintenance. Document the sanitization process and maintain records of equipment that has been sanitized prior to off-site maintenance.',
    evidenceRequirements: [
      'Equipment sanitization procedures for off-site maintenance',
      'Sanitization records for equipment sent for external maintenance',
      'Chain of custody documentation for equipment during maintenance',
    ],
    testProcedures: [
      'Review records of recent off-site maintenance and verify sanitization was performed before equipment left the facility',
      'Verify that sanitization procedures are documented and followed consistently',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MA.L2-3.7.4',
    name: 'Media Inspection',
    description:
      'Check media containing diagnostic and test programs for malicious code before use on organizational systems. Maintenance media must be scanned to prevent introduction of malware.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Scan all maintenance media for malicious code using up-to-date anti-malware tools before connecting it to organizational systems. Maintain approved maintenance media that has been verified as clean and track its usage.',
    evidenceRequirements: [
      'Media inspection procedures for maintenance tools and diagnostics',
      'Scan records for maintenance media before use',
      'Inventory of approved and verified maintenance media',
    ],
    testProcedures: [
      'Request scan records for recent maintenance media usage and verify scanning was performed',
      'Verify that the organization maintains an inventory of approved maintenance media',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MA.L2-3.7.5',
    name: 'Nonlocal Maintenance Authorization',
    description:
      'Require multifactor authentication to establish nonlocal maintenance sessions and terminate sessions when maintenance is complete. Remote maintenance must be strongly authenticated and time-limited.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Require MFA for all remote maintenance access and configure sessions to automatically terminate after a defined period or when maintenance is complete. Log all remote maintenance sessions including start and end times, activities performed, and personnel involved.',
    evidenceRequirements: [
      'Remote maintenance policy requiring MFA and session management',
      'System configuration showing MFA enforcement for maintenance access',
      'Remote maintenance session logs with start and end times',
    ],
    testProcedures: [
      'Attempt to establish a remote maintenance session without MFA and verify access is denied',
      'Review remote maintenance logs and verify sessions are properly terminated after maintenance completion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MA.L2-3.7.6',
    name: 'Maintenance Personnel Oversight',
    description:
      'Supervise the maintenance activities of maintenance personnel without required access authorization. Maintenance personnel without proper clearances must be escorted and monitored.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Require authorized personnel to supervise maintenance activities performed by individuals who do not have appropriate access authorization. Document supervision activities and maintain logs of who supervised maintenance and when.',
    evidenceRequirements: [
      'Maintenance supervision policy for personnel without access authorization',
      'Supervision logs documenting oversight of maintenance activities',
      'Records identifying maintenance personnel and their authorization status',
    ],
    testProcedures: [
      'Review maintenance records for activities performed by non-authorized personnel and verify supervision was provided',
      'Verify that supervision requirements are documented and communicated to maintenance teams',
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

  // Additional Media Protection (MP) Practices
  {
    controlId: 'MP.L2-3.8.1',
    name: 'Media Protection',
    description:
      'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital. Media must be safeguarded from unauthorized access during storage and handling.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Store media containing CUI in locked containers, secure rooms, or encrypted storage. Implement physical and logical controls to prevent unauthorized access to media during storage and transit. Maintain an inventory of all media containing CUI.',
    evidenceRequirements: [
      'Media protection policy specifying storage and handling requirements for CUI media',
      'Inventory of media containing CUI with storage locations',
      'Physical security controls for media storage areas',
    ],
    testProcedures: [
      'Inspect media storage areas and verify physical security controls are in place',
      'Review the CUI media inventory and verify it accurately reflects current media holdings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.2',
    name: 'Media Access Limitation',
    description:
      'Limit access to CUI on system media to authorized users. Only individuals with a legitimate need should be able to access media containing CUI.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement access controls that restrict access to CUI media to authorized personnel only. Maintain access lists for media storage areas and track media check-out and return activities.',
    evidenceRequirements: [
      'Media access policy defining authorized personnel and access procedures',
      'Access lists for media storage areas',
      'Media check-out and return logs',
    ],
    testProcedures: [
      'Attempt to access CUI media without authorization and verify access is denied',
      'Review media access logs and verify only authorized personnel accessed CUI media',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.4',
    name: 'Media Marking',
    description:
      'Mark media with necessary CUI markings and distribution limitations. All media containing CUI must be clearly labeled to indicate its sensitivity.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Apply appropriate CUI markings to all media containing controlled information, including both physical labels and metadata markings where applicable. Ensure markings indicate the CUI category and any distribution limitations.',
    evidenceRequirements: [
      'Media marking policy specifying required labels and markings',
      'Examples of properly marked media',
      'Procedures for applying and verifying media markings',
    ],
    testProcedures: [
      'Inspect a sample of CUI media and verify appropriate markings are applied',
      'Review marking procedures and verify they address all required CUI categories',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.5',
    name: 'Media Accountability',
    description:
      'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas. Media movement must be tracked to prevent loss or unauthorized access.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement chain of custody procedures for media transport including documentation of who has possession, when transfers occur, and where media is located. Use secure transport methods and containers for moving media outside controlled areas.',
    evidenceRequirements: [
      'Media transport and accountability procedures',
      'Chain of custody documentation for media transport',
      'Secure transport container specifications and inventory',
    ],
    testProcedures: [
      'Review media transport records and verify chain of custody is documented',
      'Verify that secure transport methods are used for CUI media',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.6',
    name: 'Portable Storage Encryption',
    description:
      'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Encrypt all portable storage media containing CUI using FIPS-validated cryptographic modules before transport. Use hardware-encrypted drives or container encryption for portable media. Prohibit transport of unencrypted CUI on portable media.',
    evidenceRequirements: [
      'Portable media encryption policy requiring FIPS-validated encryption',
      'Inventory of encrypted portable media devices',
      'Encryption configuration records for portable storage',
    ],
    testProcedures: [
      'Verify that portable media used for CUI transport is encrypted',
      'Attempt to read data from an encrypted portable device without the key and verify access is denied',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.7',
    name: 'Removable Media Control',
    description:
      'Control the use of removable media on system components. Organizations must restrict the types of removable media that can be used and the systems on which they can be used.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement technical controls to restrict removable media usage to authorized devices and users. Disable USB ports on systems where removable media is not required. Maintain an approved removable media inventory.',
    evidenceRequirements: [
      'Removable media policy specifying usage restrictions and approved devices',
      'System configuration showing removable media restrictions',
      'Approved removable media inventory',
    ],
    testProcedures: [
      'Attempt to use unauthorized removable media and verify it is blocked',
      'Review system configurations and verify removable media restrictions are enforced',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.8',
    name: 'Shared System Prohibition',
    description:
      'Prohibit the use of portable storage devices when such devices have no identifiable owner. Ownerless media poses a risk of malware introduction and data exfiltration.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Prohibit the use of found or unidentified portable storage devices. Establish procedures for handling discovered media that prevent direct connection to organizational systems. Assign ownership to all organizational portable storage devices.',
    evidenceRequirements: [
      'Policy prohibiting use of unidentified portable storage devices',
      'Procedures for handling found or unknown media',
      'Portable storage device ownership records',
    ],
    testProcedures: [
      'Verify that all organizational portable storage devices have assigned owners',
      'Review procedures for handling unknown media and verify they prevent direct connection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L2-3.8.9',
    name: 'CUI Backup Protection',
    description:
      'Protect the confidentiality of backup CUI at storage locations. Backups containing CUI must be protected with the same rigor as the original data.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Encrypt backup media containing CUI and store backups in secure locations with access controls equivalent to production systems. Test backup restoration procedures regularly to ensure data can be recovered.',
    evidenceRequirements: [
      'Backup protection policy specifying encryption and storage requirements',
      'Backup encryption configuration records',
      'Backup storage location security documentation',
    ],
    testProcedures: [
      'Verify that backups containing CUI are encrypted',
      'Inspect backup storage locations and verify security controls are adequate',
    ],
    status: 'Not Started',
  },

  // Personnel Security (PS) Practices
  {
    controlId: 'PS.L2-3.9.1',
    name: 'Personnel Screening',
    description:
      'Screen individuals prior to authorizing access to organizational systems containing CUI. Background checks and vetting help ensure personnel are trustworthy before granting access to sensitive information.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Conduct background investigations on all personnel before granting access to CUI systems. Define screening criteria appropriate to the sensitivity of information accessed and rescreen personnel periodically or when their role changes significantly.',
    evidenceRequirements: [
      'Personnel screening policy defining criteria and procedures',
      'Records of background investigations for personnel with CUI access',
      'Periodic rescreening schedule and records',
    ],
    testProcedures: [
      'Review personnel records and verify background screening was completed before CUI access was granted',
      'Verify that rescreening is conducted per the defined schedule',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PS.L2-3.9.2',
    name: 'Personnel Termination and Transfer',
    description:
      'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers. Access must be revoked promptly when personnel leave or change roles.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish procedures to disable accounts and revoke physical access immediately upon termination. For transfers, review and adjust access rights to match new role requirements. Retrieve all organizational assets including badges, keys, and equipment.',
    evidenceRequirements: [
      'Personnel termination and transfer procedures',
      'Records showing timely access revocation for terminated personnel',
      'Asset return documentation for departed personnel',
    ],
    testProcedures: [
      'Review recent terminations and verify access was revoked within the required timeframe',
      'Verify that asset return is documented for terminated personnel',
    ],
    status: 'Not Started',
  },

  // Additional Physical Protection (PE) Practices
  {
    controlId: 'PE.L2-3.10.2',
    name: 'Facility Monitoring',
    description:
      'Protect and monitor the physical facility and support infrastructure for organizational systems. Continuous monitoring detects unauthorized physical access attempts and environmental threats.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Deploy surveillance cameras, intrusion detection systems, and environmental monitoring in areas containing CUI systems. Review monitoring data regularly and investigate anomalies or alarms promptly.',
    evidenceRequirements: [
      'Physical monitoring system design and coverage documentation',
      'Surveillance and alarm system configurations',
      'Monitoring review records and incident investigation documentation',
    ],
    testProcedures: [
      'Review surveillance coverage and verify all critical areas are monitored',
      'Test alarm systems and verify alerts are received and responded to',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PE.L2-3.10.6',
    name: 'Alternate Work Site Security',
    description:
      'Enforce safeguarding measures for CUI at alternate work sites. Remote work locations must implement security controls to protect CUI when work is performed outside primary facilities.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Establish security requirements for alternate work sites including home offices and mobile work locations. Require secure network connections, physical security for devices, and proper handling of CUI materials at alternate locations.',
    evidenceRequirements: [
      'Alternate work site security policy',
      'Remote work security acknowledgments from personnel',
      'Assessment records for alternate work site security',
    ],
    testProcedures: [
      'Review alternate work site policy and verify it addresses physical and logical security',
      'Verify that personnel acknowledge security requirements for remote work',
    ],
    status: 'Not Started',
  },

  // Additional Security Assessment (CA) Practices
  {
    controlId: 'CA.L2-3.12.2',
    name: 'Plan of Action and Milestones',
    description:
      'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems. POA&Ms track remediation of identified security gaps.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Create POA&M entries for all identified security deficiencies with defined remediation actions, responsible parties, and target completion dates. Track POA&M progress regularly and escalate overdue items to management.',
    evidenceRequirements: [
      'POA&M document or tracking system',
      'Remediation action plans with milestones and responsible parties',
      'Progress tracking records and management review documentation',
    ],
    testProcedures: [
      'Review the POA&M and verify all assessment findings have corresponding entries',
      'Verify that POA&M progress is tracked and overdue items are escalated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CA.L2-3.12.3',
    name: 'Security Control Monitoring',
    description:
      'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls. Continuous monitoring identifies control degradation before it leads to security incidents.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement continuous monitoring processes that regularly assess security control effectiveness through automated tools and manual reviews. Define monitoring frequency for each control based on its criticality and volatility.',
    evidenceRequirements: [
      'Continuous monitoring strategy and plan',
      'Monitoring tool configurations and dashboards',
      'Periodic monitoring reports showing control status',
    ],
    testProcedures: [
      'Review monitoring reports and verify controls are assessed at the defined frequency',
      'Verify that monitoring identifies control deficiencies and triggers remediation',
    ],
    status: 'Not Started',
  },

  // Additional System and Communications Protection (SC) Practices
  {
    controlId: 'SC.L2-3.13.2',
    name: 'Architectural Design',
    description:
      'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Apply defense-in-depth principles to system architecture with multiple layers of security controls. Use secure development practices and validate that systems are designed to minimize attack surface and limit the impact of security breaches.',
    evidenceRequirements: [
      'System architecture documentation showing security design principles',
      'Secure development lifecycle documentation',
      'Security architecture review records',
    ],
    testProcedures: [
      'Review system architecture and verify defense-in-depth principles are applied',
      'Verify that secure development practices are documented and followed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.3',
    name: 'Role Separation',
    description:
      'Separate user functionality from system management functionality. Administrative interfaces and functions should be isolated from regular user access.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement separate interfaces for administrative functions that are not accessible from standard user workstations. Use dedicated management networks or jump servers for administrative access. Restrict administrative tools to authorized personnel.',
    evidenceRequirements: [
      'System architecture showing separation of user and administrative interfaces',
      'Network segmentation documentation for management networks',
      'Access controls restricting administrative interface access',
    ],
    testProcedures: [
      'Verify that administrative interfaces are not accessible from standard user sessions',
      'Review network architecture and confirm management networks are segregated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.4',
    name: 'Shared Resource Control',
    description:
      'Prevent unauthorized and unintended information transfer via shared system resources. Shared resources must be controlled to prevent data leakage between processes or users.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement controls to prevent information leakage through shared memory, storage, and other system resources. Clear sensitive data from shared resources after use and implement process isolation where feasible.',
    evidenceRequirements: [
      'Shared resource protection policy and procedures',
      'System configuration showing resource isolation controls',
      'Data sanitization procedures for shared resources',
    ],
    testProcedures: [
      'Attempt to access data from a previous user session through shared resources and verify isolation',
      'Review system configurations for shared resource protection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.6',
    name: 'Network Communication by Exception',
    description:
      'Deny network communications traffic by default and allow network communications traffic by exception. Default-deny network policies reduce attack surface by blocking unauthorized traffic.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure firewalls and network access controls with a default-deny policy that blocks all traffic except explicitly permitted flows. Document and justify all allowed traffic flows and review permitted rules periodically.',
    evidenceRequirements: [
      'Network security policy specifying default-deny approach',
      'Firewall configurations showing default-deny rules',
      'Documentation justifying each permitted traffic flow',
    ],
    testProcedures: [
      'Review firewall rules and verify default-deny is implemented',
      'Attempt network communication not explicitly permitted and verify it is blocked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.7',
    name: 'Split Tunneling Prohibition',
    description:
      'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure VPN clients to disable split tunneling so that all traffic from remote devices passes through the organizational network while connected. Enforce this configuration through VPN gateway policies.',
    evidenceRequirements: [
      'VPN policy prohibiting split tunneling',
      'VPN client and gateway configurations showing split tunneling disabled',
      'Testing results confirming split tunneling is blocked',
    ],
    testProcedures: [
      'Connect via VPN and attempt to access external resources directly, verifying traffic is routed through VPN',
      'Review VPN configurations and verify split tunneling is disabled',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.9',
    name: 'Connection Termination',
    description:
      'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure systems and network devices to terminate idle connections after a defined timeout period. Implement session management that closes connections when users log out or sessions expire.',
    evidenceRequirements: [
      'Connection termination policy specifying timeout values',
      'System and network device configurations showing connection timeout settings',
      'Session management logs showing connection terminations',
    ],
    testProcedures: [
      'Establish a connection and allow it to remain idle, verifying termination occurs at the defined threshold',
      'Review system configurations and verify timeout settings match policy requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.10',
    name: 'Key Management',
    description:
      'Establish and manage cryptographic keys for cryptography employed in organizational systems. Proper key management ensures cryptographic protections remain effective.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement a key management system that generates, distributes, stores, rotates, and destroys cryptographic keys securely. Define key lifecycle policies including rotation schedules and procedures for key compromise.',
    evidenceRequirements: [
      'Key management policy and procedures',
      'Key management system documentation and configurations',
      'Key lifecycle records showing generation, rotation, and destruction',
    ],
    testProcedures: [
      'Review key management procedures and verify they address the full key lifecycle',
      'Verify that keys are rotated per the defined schedule',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.12',
    name: 'Collaborative Device Control',
    description:
      'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Configure collaborative devices such as webcams and microphones to require local activation and provide visible or audible indicators when active. Disable remote activation capabilities and implement physical covers where feasible.',
    evidenceRequirements: [
      'Collaborative device policy addressing remote activation and indicators',
      'Device configurations showing remote activation disabled',
      'Physical indicator mechanisms for active devices',
    ],
    testProcedures: [
      'Attempt to remotely activate a collaborative device and verify it is blocked',
      'Verify that active devices provide visible or audible indication of their status',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.13',
    name: 'Mobile Code Control',
    description:
      'Control and monitor the use of mobile code. Mobile code such as scripts and applets must be controlled to prevent execution of malicious content.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement browser and system controls that restrict mobile code execution to trusted sources. Configure content security policies and script blocking for untrusted mobile code. Monitor mobile code execution for suspicious activity.',
    evidenceRequirements: [
      'Mobile code control policy specifying restrictions and approved sources',
      'Browser and system configurations showing mobile code restrictions',
      'Monitoring records for mobile code execution',
    ],
    testProcedures: [
      'Attempt to execute mobile code from an untrusted source and verify it is blocked',
      'Review browser and system configurations for mobile code controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.14',
    name: 'Voice over IP Security',
    description:
      'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies. VoIP systems must be secured to prevent eavesdropping and unauthorized access.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Encrypt VoIP communications and segregate VoIP traffic on dedicated network segments. Implement authentication for VoIP devices and monitor VoIP traffic for anomalies.',
    evidenceRequirements: [
      'VoIP security policy addressing encryption and network segmentation',
      'VoIP system configurations showing encryption and authentication',
      'Network segmentation documentation for VoIP traffic',
    ],
    testProcedures: [
      'Verify that VoIP traffic is encrypted by capturing and analyzing packets',
      'Review VoIP network segmentation and verify isolation from data networks',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.15',
    name: 'Session Authenticity',
    description:
      'Protect the authenticity of communications sessions. Sessions must be protected against hijacking and man-in-the-middle attacks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement session management controls that protect against session hijacking, including session tokens with appropriate entropy, secure session ID transmission, and session binding to client characteristics.',
    evidenceRequirements: [
      'Session management security policy',
      'Application configurations showing session protection mechanisms',
      'Assessment results confirming session authenticity protections',
    ],
    testProcedures: [
      'Attempt to hijack a session and verify protection mechanisms prevent unauthorized access',
      'Review session management configurations for authenticity protections',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L2-3.13.16',
    name: 'Data at Rest Protection',
    description:
      'Protect the confidentiality of CUI at rest. CUI must be encrypted or otherwise protected when stored on organizational systems.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement encryption for all storage locations containing CUI including databases, file servers, and local drives. Use FIPS-validated encryption and manage keys securely.',
    evidenceRequirements: [
      'Data at rest protection policy specifying encryption requirements',
      'Storage encryption configurations and FIPS validation certificates',
      'Inventory of CUI storage locations and their protection status',
    ],
    testProcedures: [
      'Verify that CUI storage locations are encrypted',
      'Attempt to access encrypted data without proper authorization and verify protection',
    ],
    status: 'Not Started',
  },

  // Additional System and Information Integrity (SI) Practices
  {
    controlId: 'SI.L2-3.14.3',
    name: 'Security Alert Monitoring',
    description:
      'Monitor system security alerts and advisories and take action in response. Organizations must stay informed of emerging threats and vulnerabilities affecting their systems.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Subscribe to security alert feeds from vendors, CERTs, and security organizations. Establish processes to review alerts, assess their applicability, and take appropriate action such as patching or implementing workarounds.',
    evidenceRequirements: [
      'Security alert monitoring policy and procedures',
      'Subscriptions to security advisory services',
      'Records of security alert reviews and response actions',
    ],
    testProcedures: [
      'Review security alert monitoring records and verify alerts are reviewed timely',
      'Verify that applicable alerts result in documented response actions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L2-3.14.6',
    name: 'System Monitoring',
    description:
      'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Deploy system monitoring tools including host-based monitoring, network monitoring, and SIEM integration. Configure monitoring to detect known attack patterns and anomalous behavior. Review monitoring data regularly and investigate alerts.',
    evidenceRequirements: [
      'System monitoring policy and strategy',
      'Monitoring tool deployments and configurations',
      'Alert review and investigation records',
    ],
    testProcedures: [
      'Review monitoring coverage and verify critical systems are monitored',
      'Verify that monitoring alerts are reviewed and investigated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SI.L2-3.14.7',
    name: 'Suspicious Activity Detection',
    description:
      'Identify unauthorized use of organizational systems. Monitoring must detect when systems are used in unauthorized ways or by unauthorized individuals.',
    category: 'Level 2 - Advanced',
    implementationGuidance:
      'Implement user behavior analytics and anomaly detection to identify unauthorized system use. Define baseline normal behavior and configure alerts for deviations that may indicate unauthorized access or misuse.',
    evidenceRequirements: [
      'Unauthorized use detection policy and procedures',
      'Behavior analytics or anomaly detection tool configurations',
      'Investigation records for detected unauthorized use incidents',
    ],
    testProcedures: [
      'Simulate unauthorized system use and verify detection mechanisms identify it',
      'Review detection tool configurations and verify appropriate baselines are defined',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // LEVEL 3 - EXPERT (additional enhanced practices)
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
  {
    controlId: 'CA.L3-3.12.1E',
    name: 'Penetration Testing',
    description:
      'Conduct penetration testing to identify vulnerabilities and attack vectors that could be used to exploit organizational systems. Penetration testing validates security controls by simulating real-world attacks.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Conduct penetration testing at least annually and after significant system changes. Use both internal and external testing perspectives. Define rules of engagement and ensure testing covers all critical systems and attack vectors.',
    evidenceRequirements: [
      'Penetration testing policy and schedule',
      'Rules of engagement documentation',
      'Penetration test reports with findings and remediation recommendations',
    ],
    testProcedures: [
      'Review penetration test reports and verify testing was conducted within the required timeframe',
      'Verify that penetration test findings have been addressed through the POA&M process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L3-3.4.1E',
    name: 'Authoritative Configuration Repository',
    description:
      'Establish and maintain an authoritative repository for approved and implemented system configurations. Centralized configuration management ensures consistency and enables rapid comparison against baseline.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement a configuration management database or version control system that stores authoritative configurations for all systems. Automate configuration deployment and monitoring to detect drift from approved configurations.',
    evidenceRequirements: [
      'Configuration repository architecture and tool documentation',
      'Authoritative configurations for all system types',
      'Configuration drift monitoring and alerting records',
    ],
    testProcedures: [
      'Review the configuration repository and verify all system types have documented configurations',
      'Verify that configuration drift monitoring is active and alerting on deviations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CM.L3-3.4.2E',
    name: 'Automated Configuration Monitoring',
    description:
      'Employ automated mechanisms to detect unauthorized changes to configurations and implement automated response actions. Automated monitoring enables rapid detection and response to configuration changes.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Deploy file integrity monitoring and configuration management tools that automatically detect and alert on unauthorized changes. Implement automated remediation where feasible to restore configurations to their approved state.',
    evidenceRequirements: [
      'Automated configuration monitoring tool deployment',
      'Alerting configurations for unauthorized changes',
      'Automated remediation procedures and records',
    ],
    testProcedures: [
      'Make an unauthorized configuration change and verify automated detection occurs',
      'Verify that automated alerting or remediation is triggered for unauthorized changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L3-3.13.1E',
    name: 'Network Segmentation',
    description:
      'Employ boundary protection mechanisms to isolate CUI systems from other organizational systems. Network segmentation limits the impact of security incidents and prevents lateral movement.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement network micro-segmentation to isolate systems processing CUI into dedicated network segments. Deploy next-generation firewalls and zero-trust network access controls between segments.',
    evidenceRequirements: [
      'Network segmentation architecture documentation',
      'Firewall and access control configurations for segment boundaries',
      'Testing results validating segment isolation',
    ],
    testProcedures: [
      'Attempt to access CUI systems from non-CUI segments and verify access is blocked',
      'Review network segmentation configurations and verify they match the documented architecture',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'SC.L3-3.13.2E',
    name: 'System Component Isolation',
    description:
      'Isolate CUI system components performing different missions or business functions. Component isolation limits the blast radius of security incidents and enables focused security controls.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Deploy system components in isolated environments using virtualization, containerization, or dedicated hardware. Implement strict access controls between isolated components and monitor inter-component communications.',
    evidenceRequirements: [
      'Component isolation architecture and deployment documentation',
      'Access controls between isolated components',
      'Monitoring configurations for inter-component communications',
    ],
    testProcedures: [
      'Verify that system components are isolated per the documented architecture',
      'Attempt unauthorized communication between isolated components and verify it is blocked',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AU.L3-3.3.1E',
    name: 'Advanced Audit Capabilities',
    description:
      'Employ advanced audit capabilities that correlate audit information across systems and detect sophisticated attack patterns. Enhanced auditing enables detection of advanced persistent threats.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement advanced SIEM capabilities with machine learning and behavioral analytics. Correlate audit data across multiple systems and time periods to detect multi-stage attacks and insider threats.',
    evidenceRequirements: [
      'Advanced audit capability architecture and tool documentation',
      'Correlation rules for sophisticated attack detection',
      'Investigation records showing advanced audit capabilities in use',
    ],
    testProcedures: [
      'Execute a multi-stage simulated attack and verify the advanced audit system detects the attack pattern',
      'Review correlation rules and verify they address sophisticated attack techniques',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'IA.L3-3.5.3E',
    name: 'Phishing-Resistant Authentication',
    description:
      'Implement phishing-resistant authentication mechanisms for all users. Authentication must protect against credential theft through phishing and man-in-the-middle attacks.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Deploy phishing-resistant MFA such as FIDO2/WebAuthn hardware tokens or certificate-based authentication. Eliminate or restrict use of authentication methods vulnerable to phishing such as SMS OTP.',
    evidenceRequirements: [
      'Phishing-resistant authentication policy and approved methods',
      'Authentication system configurations showing phishing-resistant MFA',
      'User enrollment records for phishing-resistant authenticators',
    ],
    testProcedures: [
      'Verify that phishing-resistant authentication is required for all users',
      'Attempt a simulated phishing attack and verify the authentication method resists credential theft',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MA.L3-3.7.1E',
    name: 'Automated Maintenance Oversight',
    description:
      'Employ automated mechanisms to schedule, conduct, and document maintenance activities. Automation ensures maintenance is performed consistently and records are complete.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement automated patch management and maintenance scheduling systems. Automate documentation of maintenance activities and integrate with change management and configuration management systems.',
    evidenceRequirements: [
      'Automated maintenance system architecture and configuration',
      'Automated maintenance scheduling and execution records',
      'Integration documentation with change and configuration management',
    ],
    testProcedures: [
      'Review automated maintenance records and verify activities are scheduled and documented automatically',
      'Verify integration with change management and configuration management systems',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PE.L3-3.10.1E',
    name: 'Facility Penetration Testing',
    description:
      'Conduct physical penetration testing of facilities to identify vulnerabilities in physical security controls. Physical penetration testing validates the effectiveness of physical access controls.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Conduct physical penetration testing at least annually. Test perimeter security, access control systems, surveillance coverage, and social engineering resistance. Document findings and remediate identified vulnerabilities.',
    evidenceRequirements: [
      'Physical penetration testing policy and schedule',
      'Physical penetration test reports with findings',
      'Remediation records for identified vulnerabilities',
    ],
    testProcedures: [
      'Review physical penetration test reports and verify testing was conducted as scheduled',
      'Verify that findings have been addressed through remediation actions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PS.L3-3.9.1E',
    name: 'Continuous Personnel Vetting',
    description:
      'Implement continuous vetting for personnel with access to CUI. Ongoing vetting detects changes in personnel trustworthiness after initial screening.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Subscribe to continuous evaluation services that monitor for criminal activity, financial issues, and other indicators. Integrate vetting results with access management to enable rapid response to adverse information.',
    evidenceRequirements: [
      'Continuous vetting policy and procedures',
      'Continuous evaluation service enrollment records',
      'Response procedures for adverse vetting information',
    ],
    testProcedures: [
      'Verify that continuous vetting is active for personnel with CUI access',
      'Review response procedures and verify they enable timely action on adverse information',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'AT.L3-3.2.2E',
    name: 'Practical Security Exercises',
    description:
      'Include practical exercises in security training that test the ability of personnel to recognize and respond to actual threats. Practical exercises reinforce training through realistic scenarios.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Incorporate phishing simulations, social engineering tests, and incident response tabletop exercises into the training program. Track results and provide additional training to personnel who do not meet performance targets.',
    evidenceRequirements: [
      'Practical exercise program documentation',
      'Exercise results and performance metrics',
      'Additional training records for personnel requiring remediation',
    ],
    testProcedures: [
      'Review practical exercise results and verify exercises are conducted regularly',
      'Verify that personnel who fail exercises receive additional training',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'MP.L3-3.8.1E',
    name: 'Media Use Restrictions',
    description:
      'Restrict the use of certain types of media on systems processing CUI to minimize data exfiltration risk. Media restrictions limit the pathways for unauthorized data removal.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Implement endpoint controls that restrict or block removable media based on device type, user role, and system classification. Log all media usage attempts for security monitoring.',
    evidenceRequirements: [
      'Media use restriction policy specifying allowed and prohibited media types',
      'Endpoint control configurations enforcing media restrictions',
      'Media usage logs and monitoring records',
    ],
    testProcedures: [
      'Attempt to use restricted media types and verify access is blocked',
      'Review media usage logs and verify all attempts are captured',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'RA.L3-3.11.2E',
    name: 'Cyber Threat Intelligence',
    description:
      'Receive and respond to cyber threat intelligence from information sharing forums and sources. Threat intelligence integration improves situational awareness and defensive capabilities.',
    category: 'Level 3 - Expert',
    implementationGuidance:
      'Subscribe to threat intelligence feeds from ISACs, government sources, and commercial providers. Integrate threat intelligence with security monitoring and use it to proactively update detection rules and defensive measures.',
    evidenceRequirements: [
      'Threat intelligence program documentation and subscriptions',
      'Integration documentation with security monitoring systems',
      'Records of defensive actions taken based on threat intelligence',
    ],
    testProcedures: [
      'Review threat intelligence integration and verify feeds are active',
      'Verify that threat intelligence triggers updates to detection rules and defensive measures',
    ],
    status: 'Not Started',
  },
];
