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

export const CIS_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // CIS 1 - Inventory and Control of Enterprise Assets (IG1)
  // ============================================================
  {
    controlId: 'CIS-1.1',
    name: 'Establish and Maintain Detailed Enterprise Asset Inventory',
    description: 'Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data, including end-user devices, network devices, IoT devices, and servers. Ensure the inventory records the network address, hardware address, machine name, enterprise asset owner, department, and whether the asset is approved to connect to the network.',
    category: 'IG1',
    implementationGuidance: 'Deploy an automated asset discovery tool that scans the network on a regular schedule and reconciles findings with the existing inventory. Maintain the inventory in a centralized asset management system and assign ownership to each asset for accountability.',
    evidenceRequirements: [
      'Current enterprise asset inventory export with all required fields populated',
      'Configuration records from automated asset discovery tool showing scan schedules',
      'Asset management policy document defining inventory maintenance procedures'
    ],
    testProcedures: [
      'Review the asset inventory for completeness by comparing discovered assets against the recorded inventory and verify all required fields are populated',
      'Confirm that the automated discovery tool is actively scanning by reviewing recent scan logs and comparing timestamps against the defined schedule'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-1.2',
    name: 'Address Unauthorized Assets',
    description: 'Ensure that a process exists to address unauthorized assets on a weekly basis. The enterprise may choose to remove the asset from the network, deny the asset from connecting remotely, or quarantine the asset.',
    category: 'IG1',
    implementationGuidance: 'Implement network access control (NAC) to automatically detect and quarantine unauthorized devices attempting to connect to the network. Establish a weekly review process where the security team evaluates flagged unauthorized assets and takes appropriate remediation action.',
    evidenceRequirements: [
      'NAC or equivalent tool configuration showing enforcement policies for unauthorized devices',
      'Weekly unauthorized asset review reports with remediation actions documented',
      'Procedure documentation for handling unauthorized assets including escalation paths'
    ],
    testProcedures: [
      'Attempt to connect an unauthorized device to the network and verify it is detected and appropriately quarantined or blocked',
      'Review the last four weeks of unauthorized asset reports to confirm weekly reviews are occurring and remediation actions are documented'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-1.3',
    name: 'Utilize DHCP Logging to Update Enterprise Asset Inventory',
    description: 'Use DHCP logging on all DHCP servers or Internet Protocol address management tools to update the enterprise asset inventory. Review and use logs to update the enterprise asset inventory weekly, or more frequently.',
    category: 'IG1',
    implementationGuidance: 'Enable DHCP logging on all DHCP servers and configure log forwarding to a centralized log management system. Create an automated or semi-automated process that parses DHCP lease data and reconciles new or changed IP assignments with the asset inventory on at least a weekly basis.',
    evidenceRequirements: [
      'DHCP server configuration showing logging is enabled and forwarding to central log management',
      'Sample DHCP logs demonstrating lease assignment data is being captured',
      'Evidence of weekly reconciliation process between DHCP logs and the asset inventory'
    ],
    testProcedures: [
      'Verify DHCP logging is enabled on all DHCP servers by reviewing server configurations and confirming log entries are being generated',
      'Review the reconciliation records for the past month to confirm DHCP data is being used to update the asset inventory at least weekly'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-1.4',
    name: 'Use Dynamic Host Configuration Protocol (DHCP) Server to Update Asset Inventory',
    description: 'Use DHCP server logging to automatically update the enterprise asset inventory as devices connect to and disconnect from the network, ensuring the inventory reflects the current state of network-connected assets.',
    category: 'IG1',
    implementationGuidance: 'Configure DHCP servers to feed lease information into the asset management database through automated integration scripts or APIs. Set up alerting for new MAC addresses that do not match existing inventory entries so they can be investigated promptly.',
    evidenceRequirements: [
      'Integration configuration between DHCP servers and asset management system',
      'Alert rules configured for unrecognized MAC addresses on the network',
      'Logs showing automated asset inventory updates from DHCP lease data'
    ],
    testProcedures: [
      'Connect a new device to the network via DHCP and verify the asset inventory is updated automatically with the correct lease information',
      'Review alert logs to confirm that unrecognized MAC address alerts are being generated and triaged appropriately'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-1.5',
    name: 'Use a Passive Asset Discovery Tool',
    description: 'Use a passive discovery tool to identify assets connected to the enterprise network. Review and use scans to update the enterprise asset inventory at least weekly, or more frequently.',
    category: 'IG1',
    implementationGuidance: 'Deploy a passive network monitoring tool at key network segments to identify assets through traffic analysis without generating additional network traffic. Integrate the passive discovery results with the asset inventory system and schedule automated weekly reconciliation.',
    evidenceRequirements: [
      'Passive asset discovery tool deployment records showing coverage of key network segments',
      'Weekly scan result reports from the passive discovery tool',
      'Evidence of asset inventory updates based on passive discovery findings'
    ],
    testProcedures: [
      'Verify the passive discovery tool is operational by reviewing recent discovery results and confirming it covers all critical network segments',
      'Compare passive discovery results against the current asset inventory to confirm weekly reconciliation is occurring and discrepancies are addressed'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 2 - Inventory and Control of Software Assets (IG1)
  // ============================================================
  {
    controlId: 'CIS-2.1',
    name: 'Establish and Maintain a Software Inventory',
    description: 'Establish and maintain a detailed inventory of all licensed software installed on enterprise assets. The inventory must document the title, publisher, initial install date, and business purpose for each entry, and include an approval status.',
    category: 'IG1',
    implementationGuidance: 'Deploy a software asset management tool that automatically discovers and catalogs installed software across all enterprise assets. Establish a process to review and validate the software inventory quarterly and update it as new software is deployed or decommissioned.',
    evidenceRequirements: [
      'Current software inventory export listing all installed software with required metadata fields',
      'Software asset management tool configuration and deployment records',
      'Quarterly software inventory review reports showing validation and update activities'
    ],
    testProcedures: [
      'Select a random sample of enterprise assets and compare installed software against the inventory to verify accuracy and completeness',
      'Review the software asset management tool dashboard to confirm it is actively scanning and the inventory was updated within the last quarter'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-2.2',
    name: 'Ensure Authorized Software is Currently Supported',
    description: 'Ensure that only currently supported software is designated as authorized in the software inventory. Unsupported software should be tagged as unsupported and a plan created for migration or extended support.',
    category: 'IG1',
    implementationGuidance: 'Cross-reference the software inventory against vendor end-of-life and end-of-support dates on a monthly basis. Flag any software that has reached or is approaching end-of-support status and create migration or remediation plans with defined timelines.',
    evidenceRequirements: [
      'Software support status report showing all software with current support lifecycle dates',
      'Remediation or migration plans for any software identified as unsupported or nearing end-of-support',
      'Monthly review records demonstrating ongoing monitoring of software support status'
    ],
    testProcedures: [
      'Review the software inventory and verify that each entry has a documented support status and that unsupported software is flagged with a remediation plan',
      'Select a sample of installed software and independently verify support status against vendor published end-of-life dates'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-2.3',
    name: 'Address Unauthorized Software',
    description: 'Ensure that unauthorized software is either removed or the inventory is updated to grant approval on a monthly basis. The enterprise must have a defined process for addressing unauthorized software discovered on enterprise assets.',
    category: 'IG1',
    implementationGuidance: 'Configure the software asset management tool to flag unauthorized software installations automatically and generate alerts for the IT security team. Establish a monthly review cycle where unauthorized software is either removed, quarantined, or formally approved and added to the authorized software list.',
    evidenceRequirements: [
      'Alert configuration records from software management tool for unauthorized software detection',
      'Monthly unauthorized software review reports with documented remediation actions',
      'Policy document defining the process for handling unauthorized software discoveries'
    ],
    testProcedures: [
      'Install an unauthorized application on a test asset and verify the software management tool detects and flags it within the defined detection timeframe',
      'Review the last three months of unauthorized software reports to confirm reviews are occurring monthly and appropriate actions are being taken'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-2.5',
    name: 'Allowlist Authorized Software',
    description: 'Use technical controls such as application allowlisting to ensure that only authorized software can execute or be installed on enterprise assets. Reassess the allowlist on a biannual basis or more frequently.',
    category: 'IG1',
    implementationGuidance: 'Deploy application allowlisting technology on all enterprise assets and configure it to permit only approved software to execute. Establish a biannual review cycle to evaluate and update the allowlist based on business needs and software inventory changes.',
    evidenceRequirements: [
      'Application allowlisting tool deployment records showing coverage across enterprise assets',
      'Current allowlist configuration with approved applications and their business justifications',
      'Biannual allowlist review records demonstrating evaluation and updates'
    ],
    testProcedures: [
      'Attempt to execute an application not on the allowlist and verify that it is blocked by the allowlisting control',
      'Review the allowlist against the current authorized software inventory to confirm alignment and verify the last review was within the past six months'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 3 - Data Protection (IG1)
  // ============================================================
  {
    controlId: 'CIS-3.1',
    name: 'Establish and Maintain a Data Management Process',
    description: 'Establish and maintain a data management process that addresses data sensitivity, data owner, handling requirements, retention limits, and disposal requirements. Review and update the process on an annual basis or when significant enterprise changes occur.',
    category: 'IG1',
    implementationGuidance: 'Develop a formal data management policy that defines data classification levels, handling procedures, retention schedules, and disposal methods aligned with regulatory requirements. Assign data owners for each data category and conduct annual reviews of the data management process to ensure it remains current.',
    evidenceRequirements: [
      'Approved data management policy document with classification levels and handling procedures',
      'Data owner assignment records for each data category or major data set',
      'Annual review records of the data management process with documented updates'
    ],
    testProcedures: [
      'Review the data management policy for completeness, verifying it addresses sensitivity classification, ownership, handling, retention, and disposal requirements',
      'Interview a sample of data owners to confirm awareness of their responsibilities and verify the policy was reviewed within the past year'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-3.2',
    name: 'Establish and Maintain a Data Inventory',
    description: 'Establish and maintain a data inventory based on the data management process. At a minimum, inventory sensitive data and review the inventory annually, at a minimum, with a priority on sensitive data.',
    category: 'IG1',
    implementationGuidance: 'Use data discovery and classification tools to identify and catalog sensitive data across all storage locations including on-premises systems, cloud services, and endpoints. Maintain the data inventory in a centralized repository and schedule annual reviews to validate accuracy and completeness.',
    evidenceRequirements: [
      'Current data inventory listing sensitive data locations, classifications, and owners',
      'Data discovery tool configuration and scan results',
      'Annual data inventory review records with findings and corrective actions'
    ],
    testProcedures: [
      'Review the data inventory for completeness by verifying it includes all known data repositories and that sensitive data is properly classified',
      'Run a data discovery scan on a sample of systems and compare results against the inventory to identify any gaps or inaccuracies'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-3.3',
    name: 'Configure Data Access Control Lists',
    description: 'Configure data access control lists based on a user\'s need to know. Apply data access control lists to local and remote file systems, databases, and applications.',
    category: 'IG1',
    implementationGuidance: 'Implement role-based access control (RBAC) for all data repositories and configure access control lists that restrict access based on the principle of least privilege. Review access permissions quarterly to ensure they align with current job responsibilities and revoke access that is no longer required.',
    evidenceRequirements: [
      'Access control list configurations for critical data repositories, databases, and file systems',
      'Role-based access control matrix mapping roles to data access permissions',
      'Quarterly access review records demonstrating validation of data access permissions'
    ],
    testProcedures: [
      'Select a sample of data repositories and review ACL configurations to verify access is restricted based on need-to-know and least privilege principles',
      'Attempt to access sensitive data with a test account that should not have permission and verify the access is denied'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-3.4',
    name: 'Enforce Data Retention',
    description: 'Retain data according to the enterprise\'s data management process. Data retention must include both minimum and maximum timelines, and align with regulatory and business requirements.',
    category: 'IG1',
    implementationGuidance: 'Configure automated data retention policies in storage systems, email platforms, and databases that enforce both minimum and maximum retention periods. Implement automated disposal mechanisms that securely delete data once the maximum retention period has been reached.',
    evidenceRequirements: [
      'Data retention schedule documenting minimum and maximum retention periods for each data category',
      'Automated retention policy configurations in storage systems and applications',
      'Data disposal records demonstrating secure deletion of data past its retention period'
    ],
    testProcedures: [
      'Review data retention configurations in key systems to verify automated retention and disposal policies are active and align with the documented retention schedule',
      'Request evidence of recent data disposal activities and verify data was securely deleted in accordance with the retention policy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-3.6',
    name: 'Encrypt Data on End-User Devices',
    description: 'Encrypt data on end-user devices containing sensitive data. Use full-disk encryption or file-level encryption depending on the device type and data sensitivity classification.',
    category: 'IG1',
    implementationGuidance: 'Enable full-disk encryption on all laptops, workstations, and mobile devices using enterprise-managed encryption solutions such as BitLocker, FileVault, or equivalent. Enforce encryption policies through mobile device management (MDM) and endpoint management tools to ensure compliance across all end-user devices.',
    evidenceRequirements: [
      'Encryption policy document specifying encryption requirements for end-user devices',
      'MDM or endpoint management reports showing encryption status across all managed devices',
      'Configuration records for enterprise encryption solutions (BitLocker, FileVault, etc.)'
    ],
    testProcedures: [
      'Review the MDM or endpoint management console to verify encryption is enabled on all managed end-user devices and identify any non-compliant devices',
      'Select a sample of end-user devices and verify full-disk encryption is active by checking the encryption status directly on the device'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 4 - Secure Configuration of Enterprise Assets and Software (IG1)
  // ============================================================
  {
    controlId: 'CIS-4.1',
    name: 'Establish and Maintain a Secure Configuration Process',
    description: 'Establish and maintain a secure configuration process for enterprise assets and software. Review and update the secure configuration process annually or when significant enterprise changes warrant a revision.',
    category: 'IG1',
    implementationGuidance: 'Develop and document secure configuration baselines for all enterprise asset types and software using industry benchmarks such as CIS Benchmarks or vendor hardening guides. Implement a formal change management process that requires security review before configuration changes are deployed to production.',
    evidenceRequirements: [
      'Documented secure configuration baselines for each enterprise asset type and critical software',
      'Secure configuration process documentation including roles, responsibilities, and review procedures',
      'Annual review records of the secure configuration process with documented updates'
    ],
    testProcedures: [
      'Review the secure configuration baselines to verify they are based on industry standards and cover all major enterprise asset types and critical software',
      'Select a sample of recent configuration changes and verify they followed the documented change management process including security review'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-4.2',
    name: 'Establish and Maintain a Secure Configuration for Network Infrastructure',
    description: 'Establish and maintain a secure configuration process for network infrastructure devices including firewalls, routers, and switches. Review and update configurations annually or when significant changes occur.',
    category: 'IG1',
    implementationGuidance: 'Apply CIS Benchmark or vendor-recommended hardening configurations to all network infrastructure devices and store baseline configurations in a secure, version-controlled repository. Perform automated configuration compliance scans on a regular basis to detect and remediate configuration drift.',
    evidenceRequirements: [
      'Secure configuration baselines for network infrastructure devices based on CIS Benchmarks or equivalent',
      'Version-controlled repository of current network device configurations',
      'Automated configuration compliance scan reports showing drift detection and remediation'
    ],
    testProcedures: [
      'Compare current network device configurations against documented baselines to identify any deviations or configuration drift',
      'Review automated compliance scan results from the past quarter to verify scans are running on schedule and deviations are being remediated'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-4.3',
    name: 'Configure Automatic Session Locking on Enterprise Assets',
    description: 'Configure automatic session locking on enterprise assets after a defined period of inactivity. For general-purpose operating systems, the period must not exceed 15 minutes; for mobile devices, the period must not exceed 2 minutes.',
    category: 'IG1',
    implementationGuidance: 'Configure Group Policy Objects (GPO) or equivalent MDM policies to enforce automatic screen lock after 15 minutes of inactivity on workstations and 2 minutes on mobile devices. Deploy the policy across all managed devices and monitor compliance through the endpoint management platform.',
    evidenceRequirements: [
      'GPO or MDM policy configurations showing automatic session lock timeout settings',
      'Endpoint compliance reports showing session lock policy deployment status across all devices',
      'Policy document specifying session lock requirements for different device types'
    ],
    testProcedures: [
      'Review GPO or MDM configurations to verify automatic session lock is configured with appropriate timeout periods for each device type',
      'Test automatic session locking on a sample of devices by allowing them to sit idle and verifying the screen locks within the defined timeout period'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-4.4',
    name: 'Implement and Manage a Firewall on Servers',
    description: 'Implement and manage a host-based firewall or port-filtering tool on servers with a deny-all, allow-by-exception configuration. Perform firewall rule reviews on a monthly basis or more frequently.',
    category: 'IG1',
    implementationGuidance: 'Deploy host-based firewalls on all servers configured with a default-deny policy and create explicit allow rules only for required services and ports. Establish a monthly firewall rule review process to validate that all rules remain necessary and appropriately scoped.',
    evidenceRequirements: [
      'Host-based firewall configurations for all servers showing default-deny and explicit allow rules',
      'Monthly firewall rule review records with documented justifications for each active rule',
      'Server inventory cross-referenced with firewall deployment status confirming coverage'
    ],
    testProcedures: [
      'Review host-based firewall configurations on a sample of servers to verify default-deny policy is in place and allow rules are limited to required services',
      'Attempt to connect to a server on a port that is not explicitly allowed and verify the connection is denied by the host-based firewall'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-4.7',
    name: 'Manage Default Accounts on Enterprise Assets and Software',
    description: 'Manage default accounts on enterprise assets and software such as root, administrator, and other preconfigured vendor accounts. Disable or rename default accounts where possible, or change default passwords immediately upon deployment.',
    category: 'IG1',
    implementationGuidance: 'Establish a standard operating procedure that requires all default accounts to be disabled, renamed, or have their passwords changed before any asset or software is placed into production. Maintain a tracking list of all default accounts across enterprise assets and audit compliance during regular security assessments.',
    evidenceRequirements: [
      'Standard operating procedure for managing default accounts during asset deployment',
      'Tracking list of default accounts across enterprise assets with their current management status',
      'Security assessment reports verifying default account management compliance'
    ],
    testProcedures: [
      'Attempt to authenticate using well-known default credentials on a sample of enterprise assets and verify that default accounts are disabled or passwords have been changed',
      'Review the default account tracking list against a sample of recently deployed assets to confirm the SOP was followed'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 5 - Account Management (IG1)
  // ============================================================
  {
    controlId: 'CIS-5.1',
    name: 'Establish and Maintain an Account Inventory',
    description: 'Establish and maintain an inventory of all accounts managed in the enterprise including end-user, administrator, service, and application accounts. The inventory must include the username, account owner, start and stop dates, and department.',
    category: 'IG1',
    implementationGuidance: 'Use identity and access management (IAM) tools to maintain a centralized inventory of all user, administrator, service, and application accounts. Review the account inventory quarterly to identify stale, orphaned, or unauthorized accounts and take corrective action.',
    evidenceRequirements: [
      'Current account inventory export from IAM or directory services with all required metadata fields',
      'IAM tool configuration showing automated account discovery and cataloging',
      'Quarterly account inventory review reports with identified issues and remediation actions'
    ],
    testProcedures: [
      'Review the account inventory for completeness by comparing it against directory service accounts and verifying all required fields are populated',
      'Select a sample of accounts and verify the ownership, department, and status information matches current organizational records'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-5.2',
    name: 'Use Unique Passwords',
    description: 'Use unique passwords for all enterprise assets. Best practice implementation includes a minimum of an 8-character password for accounts using MFA and a 14-character password for accounts without MFA.',
    category: 'IG1',
    implementationGuidance: 'Configure password policies in Active Directory or the enterprise IAM system to enforce minimum password length of 8 characters for MFA-enabled accounts and 14 characters for non-MFA accounts. Implement password history rules to prevent reuse and deploy a password manager solution to help users maintain unique passwords across systems.',
    evidenceRequirements: [
      'Password policy configurations in Active Directory, IAM, or equivalent identity systems',
      'Enterprise password manager deployment records showing rollout to users',
      'Password policy compliance reports showing enforcement rates across the enterprise'
    ],
    testProcedures: [
      'Review password policy configurations in the identity system to verify minimum length, complexity, and history requirements meet the defined standards',
      'Attempt to set a password that violates the policy requirements and confirm the system rejects the change'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-5.3',
    name: 'Disable Dormant Accounts',
    description: 'Delete or disable any dormant accounts after a period of 45 days of inactivity, where supported. Dormant accounts include both user accounts and service accounts that have not been used.',
    category: 'IG1',
    implementationGuidance: 'Configure automated scripts or IAM policies that identify accounts with no login activity for 45 or more days and automatically disable them. Establish a notification process that alerts account owners before disabling and provides a re-enablement process for legitimate accounts.',
    evidenceRequirements: [
      'IAM or script configuration for automated dormant account detection with 45-day threshold',
      'Reports showing dormant accounts identified and disabled over the past quarter',
      'Process documentation for dormant account notification and re-enablement procedures'
    ],
    testProcedures: [
      'Review the automated dormant account detection configuration to verify the 45-day inactivity threshold is set and the automation is running on schedule',
      'Query the directory for accounts with last login dates exceeding 45 days and verify they have been disabled or have documented exceptions'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-5.4',
    name: 'Restrict Administrator Privileges to Dedicated Administrator Accounts',
    description: 'Restrict administrator privileges to dedicated administrator accounts on enterprise assets. Users requiring administrative privileges must use a separate, dedicated account for elevated activities.',
    category: 'IG1',
    implementationGuidance: 'Implement a tiered administration model where users who need administrative access are provisioned a separate dedicated admin account distinct from their daily-use account. Enforce restrictions through GPO or PAM solutions to prevent administrative accounts from being used for standard activities like email and web browsing.',
    evidenceRequirements: [
      'Tiered administration policy document defining the dedicated admin account requirement',
      'Account inventory showing separation between standard user accounts and dedicated admin accounts',
      'PAM or GPO configurations enforcing restrictions on administrative account usage'
    ],
    testProcedures: [
      'Review the account inventory to verify that users with administrative privileges have separate dedicated admin accounts distinct from their standard accounts',
      'Attempt to use a dedicated admin account for standard activities such as email access and verify the restriction is enforced'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-5.5',
    name: 'Establish and Maintain an Inventory of Service Accounts',
    description: 'Establish and maintain an inventory of all service accounts. The inventory must include the account owner, creation date, last reviewed date, and purpose for each service account.',
    category: 'IG1',
    implementationGuidance: 'Create a centralized registry of all service accounts in the IAM system, documenting the account owner, purpose, associated systems, and creation date. Review the service account inventory on a quarterly basis to validate continued need and ensure accounts are properly managed.',
    evidenceRequirements: [
      'Service account inventory with owner, purpose, creation date, and last review date for each account',
      'IAM or directory configuration showing service account identification and tagging',
      'Quarterly service account review records with attestation from account owners'
    ],
    testProcedures: [
      'Review the service account inventory for completeness by cross-referencing against service accounts discovered in directory services and application configurations',
      'Verify that each service account in a random sample has an assigned owner who can attest to the continued business need for the account'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-5.6',
    name: 'Centralize Account Management',
    description: 'Centralize account management through a directory or identity service. Centralized account management enables consistent enforcement of policies such as password requirements, lockout settings, and MFA.',
    category: 'IG1',
    implementationGuidance: 'Integrate all enterprise applications and systems with a centralized directory service such as Active Directory, Azure AD, or an equivalent identity provider using protocols like LDAP or SAML. Eliminate local accounts where possible and ensure all authentication flows through the centralized identity service for consistent policy enforcement.',
    evidenceRequirements: [
      'Centralized directory or identity service architecture documentation showing integrated systems',
      'Application integration records demonstrating LDAP, SAML, or OIDC federation with the central directory',
      'Inventory of any remaining local accounts with documented business justifications for non-centralization'
    ],
    testProcedures: [
      'Review the list of enterprise applications and verify that each is integrated with the centralized directory service for authentication',
      'Verify that password policies, lockout settings, and MFA requirements are consistently enforced across integrated applications by testing authentication on a sample of systems'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 6 - Access Control Management (IG1)
  // ============================================================
  {
    controlId: 'CIS-6.1',
    name: 'Establish an Access Granting Process',
    description: 'Establish and follow a process, preferably automated, for granting access to enterprise assets upon new hire, rights grant, or role change. Access granting must be based on business need and approved by the asset or data owner.',
    category: 'IG1',
    implementationGuidance: 'Implement a formal access request and approval workflow in the IAM or ticketing system that requires manager and data owner approval before access is provisioned. Automate provisioning where possible through role-based access control to ensure consistent and timely access granting aligned with job functions.',
    evidenceRequirements: [
      'Access granting process documentation with defined approval workflow and roles',
      'Sample access request tickets showing approval chain from manager and data owner',
      'IAM automation configuration for role-based access provisioning'
    ],
    testProcedures: [
      'Review a sample of recent access grants to verify they followed the documented approval process and include documented business justification',
      'Simulate a new hire access request and trace the workflow to confirm it requires appropriate approvals before access is provisioned'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-6.2',
    name: 'Establish an Access Revoking Process',
    description: 'Establish and follow a process, preferably automated, for revoking access to enterprise assets through disabling accounts upon termination, rights revocation, or role change. The process should address both planned and unplanned terminations.',
    category: 'IG1',
    implementationGuidance: 'Integrate the HR system with the IAM platform to trigger automated account disabling upon employee termination or role change. Establish procedures for immediate revocation of access in cases of involuntary termination, ensuring all access including remote, VPN, and cloud services is revoked within the same business day.',
    evidenceRequirements: [
      'Access revocation process documentation covering planned and unplanned terminations',
      'HR-IAM integration configuration showing automated triggers for access revocation',
      'Sample termination records showing access was revoked within the required timeframe'
    ],
    testProcedures: [
      'Review a sample of recent employee terminations and verify that all access was revoked within the defined timeframe by checking account status in the directory and key applications',
      'Verify the HR-IAM integration by reviewing the automation configuration and confirming that termination events trigger automatic account disabling'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-6.3',
    name: 'Require MFA for Externally-Exposed Applications',
    description: 'Require all externally-exposed enterprise or third-party applications to enforce multi-factor authentication (MFA) where supported. Enforcing MFA through a directory service or SSO provider is an acceptable implementation.',
    category: 'IG1',
    implementationGuidance: 'Enable MFA on all externally-exposed applications through the enterprise SSO or identity provider, using phishing-resistant methods such as FIDO2 keys or push notifications where possible. Maintain an inventory of externally-exposed applications and verify MFA enforcement status on a monthly basis.',
    evidenceRequirements: [
      'Inventory of externally-exposed applications with MFA enforcement status for each',
      'SSO or identity provider configuration showing MFA policies for external applications',
      'Monthly MFA compliance review reports for externally-exposed applications'
    ],
    testProcedures: [
      'Attempt to authenticate to a sample of externally-exposed applications and verify that MFA is required before access is granted',
      'Review the identity provider configuration to confirm MFA policies are applied to all externally-exposed application integrations'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-6.4',
    name: 'Require MFA for Remote Network Access',
    description: 'Require multi-factor authentication for all remote network access including VPN, remote desktop, and other remote access solutions. This applies to all users accessing the enterprise network from external locations.',
    category: 'IG1',
    implementationGuidance: 'Configure VPN concentrators, remote desktop gateways, and all remote access solutions to require MFA before establishing a connection. Integrate remote access solutions with the enterprise identity provider to leverage centralized MFA policies and ensure consistent enforcement.',
    evidenceRequirements: [
      'VPN and remote access solution configurations showing MFA enforcement',
      'Identity provider integration records for all remote access solutions',
      'Remote access audit logs demonstrating MFA challenges are occurring for remote connections'
    ],
    testProcedures: [
      'Attempt to establish a VPN or remote desktop connection and verify that MFA is required before the connection is established',
      'Review remote access audit logs for the past month to confirm all remote sessions included an MFA authentication event'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-6.5',
    name: 'Require MFA for Administrative Access',
    description: 'Require multi-factor authentication for all administrative access to enterprise assets, whether local or remote. This includes access to network devices, servers, workstations, and cloud administration portals.',
    category: 'IG1',
    implementationGuidance: 'Enforce MFA on all administrative access paths including local console access, remote management tools, cloud admin portals, and privileged access management solutions. Deploy a PAM solution that requires MFA before checking out or using administrative credentials.',
    evidenceRequirements: [
      'PAM or identity provider configuration showing MFA enforcement for administrative access',
      'Inventory of administrative access paths with MFA enforcement status for each',
      'Administrative access audit logs demonstrating MFA is consistently required'
    ],
    testProcedures: [
      'Attempt to access administrative interfaces on a sample of enterprise assets and verify MFA is required for all administrative authentication',
      'Review PAM or identity provider logs to confirm all administrative sessions over the past month included an MFA challenge'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 7 - Continuous Vulnerability Management (IG2)
  // ============================================================
  {
    controlId: 'CIS-7.1',
    name: 'Establish and Maintain a Vulnerability Management Process',
    description: 'Establish and maintain a documented vulnerability management process for enterprise assets. Review and update the process annually or when significant enterprise changes occur that could affect vulnerability management.',
    category: 'IG2',
    implementationGuidance: 'Develop a formal vulnerability management policy that defines scanning frequency, risk-rating methodology, remediation timelines based on severity, and escalation procedures. Integrate the vulnerability management process with the change management and patch management workflows to ensure efficient remediation.',
    evidenceRequirements: [
      'Vulnerability management policy document defining processes, roles, scanning frequency, and remediation SLAs',
      'Risk-rating methodology documentation including severity classifications and remediation timelines',
      'Annual review records of the vulnerability management process with documented updates'
    ],
    testProcedures: [
      'Review the vulnerability management policy for completeness, verifying it addresses scanning scope, frequency, severity ratings, remediation timelines, and escalation paths',
      'Evaluate a sample of recent vulnerabilities to verify they were handled according to the documented process and remediation SLAs'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-7.2',
    name: 'Establish and Maintain a Remediation Process',
    description: 'Establish and maintain a risk-based remediation strategy documented in a remediation process with monthly or more frequent reviews. The process should prioritize remediation based on the severity of the vulnerability and the criticality of the affected asset.',
    category: 'IG2',
    implementationGuidance: 'Define remediation SLAs based on vulnerability severity (e.g., critical within 15 days, high within 30 days, medium within 90 days) and asset criticality. Implement a tracking system that monitors remediation progress against SLAs and escalates overdue items to management.',
    evidenceRequirements: [
      'Remediation process documentation with risk-based prioritization criteria and SLAs',
      'Vulnerability tracking system reports showing remediation progress against defined SLAs',
      'Monthly remediation review meeting minutes documenting progress and escalations'
    ],
    testProcedures: [
      'Review the remediation tracking system to verify that vulnerabilities are being prioritized and tracked against defined SLAs based on severity and asset criticality',
      'Select a sample of remediated vulnerabilities and verify the remediation was completed within the SLA timeframe and properly validated'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-7.3',
    name: 'Perform Automated Operating System Patch Management',
    description: 'Perform operating system updates on enterprise assets through automated patch management on a monthly basis or more frequently. Validate that all OS patches have been applied within the defined remediation timeline.',
    category: 'IG2',
    implementationGuidance: 'Deploy an enterprise patch management solution such as WSUS, SCCM, or equivalent that automatically distributes and installs OS patches to all managed assets. Configure patch deployment schedules with appropriate testing windows and monitor patch compliance rates through the management console.',
    evidenceRequirements: [
      'Patch management tool configuration showing automated OS patch deployment schedules',
      'Monthly patch compliance reports showing installation rates across all managed assets',
      'Patch testing and approval workflow documentation'
    ],
    testProcedures: [
      'Review patch management reports to verify that OS patches are being deployed within the defined monthly schedule and compliance rates meet organizational targets',
      'Select a sample of enterprise assets and verify that the latest OS patches are installed and match the expected patch level'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-7.4',
    name: 'Perform Automated Application Patch Management',
    description: 'Perform application updates on enterprise assets through automated patch management on a monthly basis or more frequently. Validate that all application patches have been applied within the defined remediation timeline.',
    category: 'IG2',
    implementationGuidance: 'Extend the enterprise patch management solution to include third-party application patching, covering browsers, productivity suites, and other commonly used software. Configure automated deployment policies for application updates and monitor compliance through centralized reporting.',
    evidenceRequirements: [
      'Patch management configuration showing third-party application patch deployment policies',
      'Monthly application patch compliance reports covering all managed third-party software',
      'List of applications included in the automated patching scope with version tracking'
    ],
    testProcedures: [
      'Review application patch compliance reports to verify that third-party applications are being patched within the defined monthly schedule',
      'Select a sample of enterprise assets and verify that critical third-party applications are running the latest patched versions'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 8 - Audit Log Management (IG2)
  // ============================================================
  {
    controlId: 'CIS-8.1',
    name: 'Establish and Maintain an Audit Log Management Process',
    description: 'Establish and maintain an audit log management process that defines the enterprise logging requirements. Review and update the process annually or when significant changes occur.',
    category: 'IG2',
    implementationGuidance: 'Develop a formal audit log management policy that specifies what events to log, log retention periods, log protection requirements, and the review process for log data. Align the logging requirements with regulatory obligations and incident response needs to ensure sufficient detail is captured.',
    evidenceRequirements: [
      'Audit log management policy document defining logging requirements, retention, and review procedures',
      'Logging standards document specifying event types to be logged for each system category',
      'Annual review records of the audit log management process'
    ],
    testProcedures: [
      'Review the audit log management policy to verify it defines what events to log, retention periods, log protection, and review processes',
      'Verify that the logging standards align with regulatory requirements and incident response needs by comparing against applicable compliance frameworks'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-8.2',
    name: 'Collect Audit Logs',
    description: 'Collect audit logs from enterprise assets including operating systems, applications, and network devices. Ensure audit log collection is enabled on all assets that support logging.',
    category: 'IG2',
    implementationGuidance: 'Enable audit logging on all enterprise assets following the logging standards and configure log forwarding to the centralized SIEM or log management platform. Verify log collection is functioning by monitoring for log receipt gaps and implementing alerting for systems that stop sending logs.',
    evidenceRequirements: [
      'SIEM or log management platform showing active log sources and collection status',
      'Audit logging configurations on a representative sample of enterprise assets',
      'Alert configurations for detecting log collection gaps or failures'
    ],
    testProcedures: [
      'Review the SIEM or log management platform to verify that logs are being received from all expected enterprise asset categories',
      'Select a sample of enterprise assets and verify audit logging is enabled and logs are being forwarded to the central collection point'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-8.3',
    name: 'Ensure Adequate Audit Log Storage',
    description: 'Ensure that logging destinations maintain adequate storage to comply with the enterprise log retention policy. Configure log storage to meet both minimum retention requirements and anticipated log volume growth.',
    category: 'IG2',
    implementationGuidance: 'Size log storage to accommodate the enterprise retention requirements plus a growth buffer, and configure automated archival to long-term storage when primary storage reaches capacity thresholds. Implement monitoring and alerting on log storage utilization to proactively address capacity issues before log data is lost.',
    evidenceRequirements: [
      'Log storage capacity planning documentation showing sizing calculations based on retention requirements',
      'Storage utilization monitoring dashboard or reports for log management systems',
      'Alert configurations for log storage capacity thresholds'
    ],
    testProcedures: [
      'Review log storage capacity and utilization metrics to verify sufficient storage is available to meet the defined retention period',
      'Verify that storage capacity alerts are configured and functioning by reviewing alert configurations and any triggered alerts'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-8.5',
    name: 'Collect Detailed Audit Logs',
    description: 'Configure detailed audit logging for enterprise assets containing sensitive data. Include event source, date, username, timestamp, source and destination addresses, and other useful elements that could assist in a forensic investigation.',
    category: 'IG2',
    implementationGuidance: 'Configure verbose logging on all systems handling sensitive data to capture detailed event attributes including source IP, destination IP, user identity, timestamp, action performed, and success or failure status. Validate that detailed log entries contain sufficient forensic information by periodically reviewing sample log entries against the logging standard.',
    evidenceRequirements: [
      'Detailed logging configurations for systems containing sensitive data',
      'Sample log entries demonstrating all required forensic fields are captured',
      'Periodic log quality review records verifying completeness of logged event attributes'
    ],
    testProcedures: [
      'Review logging configurations on systems containing sensitive data to verify detailed audit logging is enabled with all required event attributes',
      'Examine sample log entries from sensitive data systems and verify they contain source IP, user identity, timestamp, action, and outcome information'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-8.9',
    name: 'Centralize Audit Logs',
    description: 'Centralize audit log collection and retention across enterprise assets. Centralization enables correlation of events across systems and provides a single authoritative source for log analysis and incident investigation.',
    category: 'IG2',
    implementationGuidance: 'Deploy a SIEM or centralized log management platform and configure all enterprise assets to forward logs using secure transport protocols such as TLS-encrypted syslog. Implement log source health monitoring to ensure continuous collection and alert on any sources that stop sending logs.',
    evidenceRequirements: [
      'SIEM or centralized log management platform architecture documentation',
      'Log source inventory showing all enterprise assets configured for centralized log forwarding',
      'Log source health monitoring dashboard showing collection status and any identified gaps'
    ],
    testProcedures: [
      'Verify that the SIEM or log management platform is receiving logs from all expected enterprise asset categories by reviewing log source health metrics',
      'Confirm logs are transmitted securely by reviewing log forwarding configurations and verifying TLS or encrypted transport is enabled'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 9 - Email and Web Browser Protections (IG2)
  // ============================================================
  {
    controlId: 'CIS-9.1',
    name: 'Ensure Use of Only Fully Supported Browsers and Email Clients',
    description: 'Ensure only fully supported browsers and email clients are allowed to execute on enterprise assets. Only use browsers and email clients that are receiving vendor security updates and support.',
    category: 'IG2',
    implementationGuidance: 'Maintain an approved list of supported browser and email client versions and enforce their use through application control policies or GPO restrictions. Configure automated update mechanisms for approved browsers and email clients and block execution of unsupported versions.',
    evidenceRequirements: [
      'Approved browser and email client list with current supported versions',
      'Application control or GPO configurations enforcing approved browser and email client usage',
      'Compliance reports showing browser and email client version distribution across enterprise assets'
    ],
    testProcedures: [
      'Review compliance reports to verify that enterprise assets are running only approved and supported versions of browsers and email clients',
      'Attempt to install or execute an unsupported browser version on a test asset and verify it is blocked by application control policies'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-9.2',
    name: 'Use DNS Filtering Services',
    description: 'Use DNS filtering services on all enterprise assets to block access to known malicious domains. Configure DNS filtering to apply to both on-network and roaming or remote users.',
    category: 'IG2',
    implementationGuidance: 'Deploy a DNS filtering solution that intercepts DNS queries and blocks resolution of known malicious, phishing, and command-and-control domains. Configure the DNS filter on both the enterprise network and endpoint agents for roaming users to ensure protection regardless of location.',
    evidenceRequirements: [
      'DNS filtering solution configuration showing block policies for malicious domain categories',
      'Endpoint agent deployment records for roaming user DNS filtering coverage',
      'DNS filtering reports showing blocked queries and domain categories'
    ],
    testProcedures: [
      'Attempt to resolve a known test malicious domain from an enterprise asset and verify the DNS query is blocked by the filtering service',
      'Verify DNS filtering coverage by reviewing deployment status for both on-network infrastructure and roaming endpoint agents'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-9.3',
    name: 'Maintain and Enforce Network-Based URL Filters',
    description: 'Enforce and update network-based URL filters to limit an enterprise asset from connecting to potentially malicious or unapproved websites. Block access to known malicious URLs and enforce category-based filtering per enterprise policy.',
    category: 'IG2',
    implementationGuidance: 'Deploy a web proxy or secure web gateway with URL filtering capabilities that blocks access to malicious, phishing, and policy-restricted URL categories. Configure automatic threat intelligence feed updates and review block policies quarterly to align with evolving threat landscape and business requirements.',
    evidenceRequirements: [
      'Web proxy or secure web gateway configuration showing URL filtering policies and blocked categories',
      'Threat intelligence feed update configuration and logs showing regular updates',
      'Quarterly URL filter policy review records'
    ],
    testProcedures: [
      'Attempt to access known malicious or policy-restricted URLs from an enterprise asset and verify the web proxy blocks the connection',
      'Review the URL filter configuration to verify threat intelligence feeds are current and category-based blocking aligns with enterprise policy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-9.7',
    name: 'Deploy and Maintain Email Server Anti-Malware Protections',
    description: 'Deploy and maintain anti-malware protections on email servers, such as attachment scanning, sandboxing, and link analysis. Keep anti-malware signatures and engines up to date.',
    category: 'IG2',
    implementationGuidance: 'Configure email security gateways with anti-malware scanning for all inbound and outbound email, including attachment sandboxing and URL rewriting for link protection. Enable automatic signature updates and configure alerting for detection events to enable rapid incident response.',
    evidenceRequirements: [
      'Email security gateway configuration showing anti-malware scanning, sandboxing, and link protection settings',
      'Anti-malware signature update logs demonstrating regular automatic updates',
      'Email security detection reports showing malware blocking statistics'
    ],
    testProcedures: [
      'Send a test email with an EICAR test file attachment and verify the email security gateway detects and blocks the malicious attachment',
      'Review anti-malware signature update logs to confirm signatures are being updated automatically and the engine version is current'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 10 - Malware Defenses (IG2)
  // ============================================================
  {
    controlId: 'CIS-10.1',
    name: 'Deploy and Maintain Anti-Malware Software',
    description: 'Install and maintain anti-malware software on all enterprise assets. Anti-malware software should include real-time scanning, automatic updates, and centralized management capabilities.',
    category: 'IG2',
    implementationGuidance: 'Deploy an enterprise anti-malware solution with real-time protection on all endpoints, servers, and supported devices, managed through a centralized console. Configure policies to prevent users from disabling anti-malware protection and monitor deployment coverage to ensure no enterprise assets are unprotected.',
    evidenceRequirements: [
      'Anti-malware deployment reports from the centralized management console showing coverage across all enterprise assets',
      'Anti-malware policy configurations showing real-time protection and tamper prevention settings',
      'Asset compliance report identifying any assets without active anti-malware protection'
    ],
    testProcedures: [
      'Review the centralized anti-malware management console to verify deployment coverage across all enterprise assets and identify any gaps',
      'Execute an EICAR test file on a sample endpoint and verify the anti-malware software detects and quarantines it in real time'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-10.2',
    name: 'Configure Automatic Anti-Malware Signature Updates',
    description: 'Configure automatic updates for anti-malware signature files on all enterprise assets. Signature updates should occur daily or more frequently to ensure protection against the latest known threats.',
    category: 'IG2',
    implementationGuidance: 'Configure the anti-malware management console to push signature updates to all endpoints at least daily and enable endpoints to pull updates directly from the vendor when not connected to the enterprise network. Monitor signature currency across all endpoints and alert on devices with outdated signatures.',
    evidenceRequirements: [
      'Anti-malware update policy configuration showing automatic daily or more frequent update schedule',
      'Signature currency report from management console showing update status across all endpoints',
      'Alert configurations for endpoints with outdated anti-malware signatures'
    ],
    testProcedures: [
      'Review the anti-malware management console to verify automatic signature updates are configured and verify the most recent update timestamps across a sample of endpoints',
      'Check the signature currency report to confirm all endpoints have signatures updated within the past 24 hours and investigate any outliers'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-10.3',
    name: 'Disable Autorun and Autoplay for Removable Media',
    description: 'Disable autorun and autoplay auto-execute functionality for removable media on enterprise assets. This prevents malware from automatically executing when removable storage devices are connected.',
    category: 'IG2',
    implementationGuidance: 'Configure Group Policy Objects to disable autorun and autoplay functionality for all drive types across all enterprise workstations and servers. Validate the policy through endpoint compliance scans and ensure the GPO is linked to all relevant organizational units.',
    evidenceRequirements: [
      'GPO configuration disabling autorun and autoplay for all drive types',
      'GPO link verification showing the policy is applied to all relevant organizational units',
      'Endpoint compliance scan results confirming autorun and autoplay are disabled'
    ],
    testProcedures: [
      'Review the GPO configuration to verify autorun and autoplay are disabled for all drive types including removable media',
      'Insert a removable media device with an autorun.inf file on a sample endpoint and verify that no auto-execute occurs'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-10.7',
    name: 'Use Behavior-Based Anti-Malware Software',
    description: 'Use behavior-based anti-malware software that analyzes runtime behavior of processes rather than relying solely on signature-based detection. This provides protection against zero-day and fileless malware attacks.',
    category: 'IG2',
    implementationGuidance: 'Deploy an endpoint detection and response (EDR) or next-generation anti-malware solution with behavior-based detection capabilities on all enterprise assets. Configure behavioral analysis policies to detect suspicious process behaviors such as credential dumping, lateral movement, and fileless execution techniques.',
    evidenceRequirements: [
      'EDR or behavior-based anti-malware deployment records showing coverage across enterprise assets',
      'Behavioral detection policy configurations including monitored behaviors and response actions',
      'Detection reports showing behavior-based alerts and their resolution'
    ],
    testProcedures: [
      'Review the EDR or behavior-based anti-malware console to verify deployment coverage and confirm behavioral analysis policies are active',
      'Execute a benign behavioral test scenario (such as an approved red team tool in test mode) and verify the behavior-based engine detects and alerts on the suspicious activity'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 11 - Data Recovery (IG2)
  // ============================================================
  {
    controlId: 'CIS-11.1',
    name: 'Establish and Maintain a Data Recovery Practice',
    description: 'Establish and maintain a data recovery practice sufficient to restore in-scope enterprise assets from a pre-loss and trusted state. The practice should define backup scope, frequency, and retention requirements.',
    category: 'IG2',
    implementationGuidance: 'Develop a data recovery policy that defines the scope of data to be backed up, backup frequency aligned with recovery point objectives (RPO), retention periods, and recovery time objectives (RTO). Assign responsibility for backup management and ensure the policy is reviewed and updated annually.',
    evidenceRequirements: [
      'Data recovery policy document defining backup scope, frequency, RPO, RTO, and retention requirements',
      'Backup schedule documentation aligned with defined RPOs for each data category',
      'Annual review records of the data recovery practice'
    ],
    testProcedures: [
      'Review the data recovery policy to verify it defines comprehensive backup scope, frequency, RPO, RTO, and retention requirements for all critical data',
      'Verify that the documented backup schedules align with the defined RPOs by comparing backup job schedules against recovery point objectives'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-11.2',
    name: 'Perform Automated Backups',
    description: 'Perform automated backups of in-scope enterprise assets on a weekly or more frequent basis. Automated backups should cover operating system configurations, application data, and user data.',
    category: 'IG2',
    implementationGuidance: 'Configure enterprise backup solutions to perform automated backups of all in-scope assets at least weekly, with more frequent backups for critical systems as defined by RPO requirements. Monitor backup job completion status daily and configure alerting for failed or incomplete backup jobs.',
    evidenceRequirements: [
      'Backup solution configuration showing automated backup schedules for all in-scope assets',
      'Backup job completion reports from the past month showing success rates',
      'Alert configurations for backup job failures and incomplete backups'
    ],
    testProcedures: [
      'Review backup job completion reports for the past month to verify automated backups are running on schedule and completing successfully',
      'Verify backup coverage by comparing the list of backed-up assets against the in-scope asset inventory to identify any gaps'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-11.3',
    name: 'Protect Recovery Data',
    description: 'Protect recovery data with equivalent controls to the original data. Reference encryption or data separation based on requirements defined in the enterprise data management process.',
    category: 'IG2',
    implementationGuidance: 'Encrypt backup data both in transit and at rest using enterprise-approved encryption standards, and restrict access to backup systems and media using role-based access controls. Store encryption keys separately from the backup data and implement integrity verification for backup files.',
    evidenceRequirements: [
      'Backup encryption configuration showing encryption standards for data at rest and in transit',
      'Access control configurations for backup systems and media showing role-based restrictions',
      'Encryption key management documentation showing separation of keys from backup data'
    ],
    testProcedures: [
      'Review backup system configurations to verify encryption is enabled for both data in transit and at rest, and access is restricted to authorized personnel',
      'Attempt to access backup data with an unauthorized account and verify the access is denied'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-11.4',
    name: 'Establish and Maintain an Isolated Instance of Recovery Data',
    description: 'Establish and maintain an isolated instance of recovery data using versioned backup copies. Isolated recovery data should be stored in a location that is separate from the primary environment.',
    category: 'IG2',
    implementationGuidance: 'Implement an air-gapped or logically isolated backup repository that maintains versioned copies of critical backup data separate from the production network. Configure immutable storage or write-once-read-many (WORM) settings to prevent backup data from being modified or deleted by ransomware or unauthorized access.',
    evidenceRequirements: [
      'Isolated backup repository architecture documentation showing network separation from production',
      'Versioned backup configuration showing retention of multiple recovery point versions',
      'Immutable storage or WORM configuration for the isolated recovery data'
    ],
    testProcedures: [
      'Verify network isolation of the backup repository by reviewing network architecture and confirming it is not directly accessible from the production network',
      'Attempt to modify or delete existing backup data in the isolated repository and verify the immutability controls prevent the operation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-11.5',
    name: 'Test Data Recovery',
    description: 'Test backup recovery quarterly, or more frequently, for a sampling of in-scope enterprise assets to verify successful data restoration from backups.',
    category: 'IG2',
    implementationGuidance: 'Establish a quarterly backup restoration test schedule that rotates through different system categories and data types. Document test results including restoration time, data integrity verification, and any issues encountered, and use findings to improve the recovery process.',
    evidenceRequirements: [
      'Quarterly backup restoration test schedule and plan',
      'Test execution records documenting restoration attempts, success rates, and restoration times',
      'Remediation records for any issues discovered during restoration testing'
    ],
    testProcedures: [
      'Review backup restoration test records for the past year to verify testing is occurring at least quarterly and covering a representative sample of enterprise assets',
      'Perform a backup restoration test on a selected system and verify the data is restored successfully with integrity intact'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 12 - Network Infrastructure Management (IG2)
  // ============================================================
  {
    controlId: 'CIS-12.1',
    name: 'Ensure Network Infrastructure is Up-to-Date',
    description: 'Ensure network infrastructure is kept up-to-date. Review software versions and firmware for network devices monthly to verify support status and patch level.',
    category: 'IG2',
    implementationGuidance: 'Maintain an inventory of all network devices with their current firmware and software versions, and cross-reference against vendor-published latest versions and end-of-support dates monthly. Establish a patching schedule for network infrastructure that minimizes operational disruption while ensuring timely updates.',
    evidenceRequirements: [
      'Network device inventory with current firmware and software versions documented',
      'Monthly version review reports comparing installed versions against vendor-recommended versions',
      'Network infrastructure patching schedule and change records'
    ],
    testProcedures: [
      'Review the network device inventory and compare firmware and software versions against vendor-published current versions to identify any outdated devices',
      'Verify that network infrastructure patches are being applied according to the patching schedule by reviewing change records for the past quarter'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-12.2',
    name: 'Establish and Maintain a Secure Network Architecture',
    description: 'Establish and maintain a secure network architecture that includes network segmentation based on data sensitivity and business function. Review the architecture annually or when significant changes occur.',
    category: 'IG2',
    implementationGuidance: 'Design and implement network segmentation using VLANs, firewalls, and access control lists to separate systems based on data sensitivity, business function, and security requirements. Document the network architecture including segmentation rationale and review it annually to ensure it aligns with current business needs and threat landscape.',
    evidenceRequirements: [
      'Network architecture documentation showing segmentation design and security zones',
      'Firewall and ACL configurations implementing network segmentation between zones',
      'Annual network architecture review records with documented findings and updates'
    ],
    testProcedures: [
      'Review the network architecture documentation and verify segmentation is implemented based on data sensitivity and business function',
      'Test network segmentation by attempting cross-zone communication that should be blocked and verify the traffic is denied'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-12.3',
    name: 'Securely Manage Network Infrastructure',
    description: 'Securely manage network infrastructure through encrypted management channels, dedicated management networks, or out-of-band management where possible.',
    category: 'IG2',
    implementationGuidance: 'Configure all network devices to require encrypted protocols (SSH, HTTPS) for management access and disable unencrypted management protocols (Telnet, HTTP). Implement a dedicated management network or VLAN for network device administration and restrict management access to authorized IP addresses.',
    evidenceRequirements: [
      'Network device configurations showing encrypted management protocols and disabled unencrypted protocols',
      'Management network or VLAN configuration documentation',
      'Access control lists restricting management access to authorized source IP addresses'
    ],
    testProcedures: [
      'Attempt to connect to network devices using unencrypted protocols (Telnet, HTTP) and verify the connection is refused',
      'Verify management access restrictions by attempting to access network device management from an unauthorized source IP and confirming the connection is blocked'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-12.4',
    name: 'Establish and Maintain Architecture Diagram(s)',
    description: 'Establish and maintain an architecture diagram that includes network topology, data flows, and security controls. Review and update the diagram annually or when significant infrastructure changes occur.',
    category: 'IG2',
    implementationGuidance: 'Create comprehensive network architecture diagrams using a standard diagramming tool that documents network topology, data flows, security zones, and security controls at each boundary. Store diagrams in a version-controlled repository and update them as part of the change management process whenever infrastructure changes are made.',
    evidenceRequirements: [
      'Current network architecture diagrams showing topology, data flows, and security controls',
      'Version history of architecture diagrams showing updates aligned with infrastructure changes',
      'Annual review records of architecture diagrams with documented updates'
    ],
    testProcedures: [
      'Review the architecture diagrams for completeness by verifying they include network topology, data flows, security zones, and security controls',
      'Compare the architecture diagrams against the current network configuration to verify accuracy and identify any undocumented changes'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 13 - Network Monitoring and Defense (IG3)
  // ============================================================
  {
    controlId: 'CIS-13.1',
    name: 'Centralize Security Event Alerting',
    description: 'Centralize security event alerting across enterprise assets for log correlation and analysis. Use a SIEM or equivalent mechanism to consolidate security alerts from multiple sources for unified monitoring.',
    category: 'IG3',
    implementationGuidance: 'Deploy a SIEM platform that aggregates security events from all enterprise assets including endpoints, network devices, servers, and cloud services. Configure correlation rules and use cases that detect known attack patterns, anomalous behaviors, and policy violations, and route alerts to the security operations team.',
    evidenceRequirements: [
      'SIEM deployment documentation showing log source integrations and coverage',
      'Correlation rules and use case documentation for security event detection',
      'Alert routing and escalation configuration for the security operations team'
    ],
    testProcedures: [
      'Review SIEM log source integrations to verify security events are being collected from all enterprise asset categories',
      'Trigger a test security event and verify it is correlated by the SIEM, generates an alert, and is routed to the appropriate security operations team member'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-13.3',
    name: 'Deploy a Network Intrusion Detection Solution',
    description: 'Deploy a network intrusion detection solution (NIDS) on enterprise assets. Configure the NIDS to monitor network traffic for known attack signatures and anomalous activity patterns.',
    category: 'IG3',
    implementationGuidance: 'Deploy network IDS sensors at critical network boundaries including internet egress points, DMZ segments, and between high-value network zones. Configure the NIDS with up-to-date signature sets and tune detection rules to minimize false positives while maintaining visibility into malicious activity.',
    evidenceRequirements: [
      'Network IDS deployment architecture showing sensor placement at critical network boundaries',
      'IDS signature update configuration and logs showing regular updates',
      'IDS alert and detection reports showing monitored traffic and detected events'
    ],
    testProcedures: [
      'Review the IDS sensor deployment to verify coverage of critical network boundaries and confirm sensors are actively monitoring traffic',
      'Execute a benign IDS test (such as an EICAR-equivalent network test) and verify the IDS detects and alerts on the test traffic'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-13.6',
    name: 'Collect Network Traffic Flow Logs',
    description: 'Collect network traffic flow logs and review them to identify anomalous activity. Enable NetFlow or equivalent flow logging on network devices at critical network points.',
    category: 'IG3',
    implementationGuidance: 'Enable NetFlow, sFlow, or IPFIX on routers and switches at critical network segments to capture traffic flow data. Forward flow data to a centralized flow analysis platform and configure baseline traffic profiles to enable detection of anomalous communication patterns.',
    evidenceRequirements: [
      'NetFlow or equivalent configuration on network devices at critical network points',
      'Flow data collection platform showing active flow data receipt and storage',
      'Baseline traffic profiles and anomaly detection configurations'
    ],
    testProcedures: [
      'Verify that network flow logging is enabled on critical network devices by reviewing configurations and confirming flow data is being received by the collection platform',
      'Review flow analysis reports to confirm traffic baselines are established and anomalous activity is being flagged for review'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-13.11',
    name: 'Tune Security Event Alerting Thresholds',
    description: 'Tune security event alerting thresholds monthly or more frequently to reduce false positives while maintaining detection of real threats. Optimize alert rules based on analysis of previous alert data.',
    category: 'IG3',
    implementationGuidance: 'Establish a monthly tuning cycle where the security operations team reviews alert volumes, false positive rates, and missed detections to adjust alerting thresholds and correlation rules. Document all tuning changes with rationale and track alert quality metrics over time to measure improvement.',
    evidenceRequirements: [
      'Monthly alert tuning review records documenting threshold adjustments and rationale',
      'Alert quality metrics tracking false positive rates and detection effectiveness over time',
      'Tuning change log with before and after threshold values and justifications'
    ],
    testProcedures: [
      'Review the monthly alert tuning records to verify regular reviews are occurring and threshold adjustments are documented with rationale',
      'Compare alert quality metrics over the past quarter to verify false positive rates are trending downward and detection effectiveness is maintained or improved'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 14 - Security Awareness and Skills Training (IG3)
  // ============================================================
  {
    controlId: 'CIS-14.1',
    name: 'Establish and Maintain a Security Awareness Program',
    description: 'Establish and maintain a security awareness program to influence workforce behavior to be security conscious and properly skilled to reduce cybersecurity risks. Update the program annually or when significant threats emerge.',
    category: 'IG3',
    implementationGuidance: 'Develop a comprehensive security awareness program that includes annual training for all employees, regular phishing simulations, and ongoing security communications covering current threats. Track training completion rates and phishing simulation results to measure program effectiveness and identify areas needing improvement.',
    evidenceRequirements: [
      'Security awareness program documentation including curriculum, schedule, and delivery methods',
      'Training completion records showing participation rates across the organization',
      'Annual program review records with updates based on emerging threats and effectiveness metrics'
    ],
    testProcedures: [
      'Review the security awareness program documentation to verify it covers key security topics, includes regular training, and is updated annually',
      'Review training completion records to confirm participation rates meet organizational targets and identify any departments with low completion'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-14.2',
    name: 'Train Workforce Members to Recognize Social Engineering Attacks',
    description: 'Train workforce members to recognize social engineering attacks such as phishing, pretexting, and tailgating. Include practical examples and conduct regular simulations to reinforce training.',
    category: 'IG3',
    implementationGuidance: 'Include social engineering awareness modules in the security awareness program covering phishing emails, vishing calls, pretexting scenarios, and physical social engineering tactics. Conduct monthly phishing simulations and provide immediate education to users who fall for simulated attacks.',
    evidenceRequirements: [
      'Social engineering training materials and curriculum documentation',
      'Phishing simulation campaign records showing frequency, scenarios used, and results',
      'Remedial training records for users who failed phishing simulations'
    ],
    testProcedures: [
      'Review social engineering training materials to verify they cover phishing, vishing, pretexting, and physical social engineering with practical examples',
      'Review phishing simulation results from the past year to verify simulations are conducted regularly and click rates are trending downward'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-14.3',
    name: 'Train Workforce Members on Authentication Best Practices',
    description: 'Train workforce members on authentication best practices including MFA usage, strong password creation, credential management, and how to identify and report phishing attempts targeting credentials.',
    category: 'IG3',
    implementationGuidance: 'Develop authentication-specific training modules that cover proper use of MFA, password manager usage, recognizing credential phishing, and the importance of not sharing or reusing passwords. Include hands-on exercises for enrolling in MFA and using the enterprise password manager.',
    evidenceRequirements: [
      'Authentication best practices training materials covering MFA, passwords, and credential management',
      'Training delivery records showing workforce members completed authentication training',
      'Assessment or quiz results demonstrating workforce understanding of authentication best practices'
    ],
    testProcedures: [
      'Review authentication training materials to verify they cover MFA usage, password best practices, credential management, and credential phishing recognition',
      'Review training completion records and assessment results to confirm workforce members have completed authentication training and demonstrated understanding'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-14.9',
    name: 'Conduct Role-Specific Security Awareness and Skills Training',
    description: 'Conduct role-specific security awareness and skills training for roles within the enterprise that require specialized security knowledge, such as IT administrators, developers, and executive leadership.',
    category: 'IG3',
    implementationGuidance: 'Identify roles that require specialized security training and develop role-specific curricula covering the security topics most relevant to each role. Deliver tailored training annually for each identified role and track completion and effectiveness through role-specific assessments.',
    evidenceRequirements: [
      'Role-specific training needs assessment identifying roles requiring specialized security training',
      'Role-specific training curricula and materials for each identified role',
      'Training completion and assessment records for role-specific security training by role category'
    ],
    testProcedures: [
      'Review role-specific training curricula to verify they address security topics relevant to each identified role, such as secure coding for developers or incident response for IT staff',
      'Review training completion records to verify role-specific training is delivered annually and participation rates meet organizational targets for each role category'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 15 - Service Provider Management (IG3)
  // ============================================================
  {
    controlId: 'CIS-15.1',
    name: 'Establish and Maintain an Inventory of Service Providers',
    description: 'Establish and maintain an inventory of service providers that includes classification of data processed, stored, or transmitted by each provider. Review and update the inventory annually.',
    category: 'IG3',
    implementationGuidance: 'Create a centralized registry of all third-party service providers that process, store, or transmit enterprise data, including the data types involved and data classification levels. Assign an internal owner to each service provider relationship and conduct annual reviews to validate the inventory accuracy and assess ongoing risk.',
    evidenceRequirements: [
      'Service provider inventory listing all providers with data classification and relationship owner',
      'Annual service provider inventory review records with updates and findings',
      'Service provider onboarding process documentation including inventory registration requirements'
    ],
    testProcedures: [
      'Review the service provider inventory for completeness by cross-referencing against procurement records and accounts payable data for IT and data processing services',
      'Verify that each service provider entry includes data classification, relationship owner, and was reviewed within the past year'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-15.2',
    name: 'Establish and Maintain a Service Provider Management Policy',
    description: 'Establish and maintain a service provider management policy that addresses the classification, inventory, assessment, monitoring, and decommissioning of service providers.',
    category: 'IG3',
    implementationGuidance: 'Develop a comprehensive third-party risk management policy that defines requirements for service provider assessment, ongoing monitoring, security requirements, incident notification, and relationship termination procedures. Review the policy annually and ensure it aligns with regulatory requirements and enterprise risk appetite.',
    evidenceRequirements: [
      'Service provider management policy document covering assessment, monitoring, and decommissioning',
      'Annual policy review records with documented updates',
      'Evidence of policy communication to relevant stakeholders'
    ],
    testProcedures: [
      'Review the service provider management policy to verify it addresses classification, assessment, monitoring, incident notification, and decommissioning of service providers',
      'Interview procurement and vendor management staff to confirm awareness of the policy and verify it is being followed in practice'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-15.3',
    name: 'Classify Service Providers',
    description: 'Classify service providers based on the type and sensitivity of data they handle. Apply appropriate oversight levels based on the classification to ensure adequate risk management.',
    category: 'IG3',
    implementationGuidance: 'Develop a classification framework that categorizes service providers into risk tiers based on the sensitivity of data they access and the criticality of services they provide. Apply graduated oversight requirements for each tier, with the highest level of scrutiny for providers handling the most sensitive data.',
    evidenceRequirements: [
      'Service provider classification framework documentation with tier definitions and criteria',
      'Service provider inventory showing assigned risk classifications for each provider',
      'Oversight requirements documentation for each classification tier'
    ],
    testProcedures: [
      'Review the service provider classification framework to verify it defines clear criteria for categorizing providers based on data sensitivity and service criticality',
      'Select a sample of service providers and verify their risk classification is appropriate based on the data they handle and services they provide'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-15.4',
    name: 'Ensure Service Provider Contracts Include Security Requirements',
    description: 'Ensure service provider contracts include security requirements such as encryption, data handling, incident notification, access controls, and the right to audit.',
    category: 'IG3',
    implementationGuidance: 'Develop standard security contract clauses and addenda that address encryption requirements, data handling obligations, breach notification timelines, access control requirements, audit rights, and data return or destruction upon termination. Require legal and security review of all service provider contracts before execution.',
    evidenceRequirements: [
      'Standard security contract clauses and addenda template',
      'Sample executed service provider contracts showing inclusion of security requirements',
      'Contract review process documentation requiring legal and security review before execution'
    ],
    testProcedures: [
      'Review a sample of executed service provider contracts to verify they include required security clauses covering encryption, incident notification, audit rights, and data handling',
      'Verify the contract review process by checking that recently executed contracts went through the documented legal and security review process'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 16 - Application Software Security (IG3)
  // ============================================================
  {
    controlId: 'CIS-16.1',
    name: 'Establish and Maintain a Secure Application Development Process',
    description: 'Establish and maintain a secure application development process that includes secure coding standards, security testing requirements, and security review gates throughout the SDLC.',
    category: 'IG3',
    implementationGuidance: 'Implement a secure SDLC framework that integrates security activities into each phase of development including threat modeling during design, secure code reviews during development, and security testing before release. Document secure coding standards based on OWASP or equivalent guidelines and require developer training on secure development practices.',
    evidenceRequirements: [
      'Secure SDLC process documentation including security activities for each development phase',
      'Secure coding standards document based on OWASP or equivalent industry guidelines',
      'Evidence of developer security training completion records'
    ],
    testProcedures: [
      'Review the secure SDLC process documentation to verify security activities are defined for each development phase including design, development, testing, and deployment',
      'Select a sample of recent application releases and verify that security review gates were completed as defined in the secure SDLC process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-16.2',
    name: 'Establish and Maintain a Process to Accept and Address Software Vulnerabilities',
    description: 'Establish and maintain a process to accept and address reports of software vulnerabilities including a means for external entities to report vulnerabilities. Publish a security contact or vulnerability disclosure policy.',
    category: 'IG3',
    implementationGuidance: 'Create a vulnerability disclosure policy that provides clear instructions for external researchers and users to report security vulnerabilities in enterprise-developed software. Establish an internal triage process that evaluates reported vulnerabilities, prioritizes remediation based on severity, and communicates status back to reporters.',
    evidenceRequirements: [
      'Published vulnerability disclosure policy or security contact information',
      'Internal vulnerability triage and remediation process documentation',
      'Records of received vulnerability reports and their resolution status'
    ],
    testProcedures: [
      'Verify the vulnerability disclosure policy is publicly accessible and provides clear reporting instructions and expected response timelines',
      'Review records of received vulnerability reports to verify they were triaged according to the defined process and remediated within expected timelines'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-16.3',
    name: 'Perform Root Cause Analysis on Security Vulnerabilities',
    description: 'Perform root cause analysis on security vulnerabilities in enterprise-developed software. Use findings to improve the secure development process and prevent similar vulnerabilities from recurring.',
    category: 'IG3',
    implementationGuidance: 'Establish a root cause analysis process that is triggered for all critical and high-severity vulnerabilities discovered in enterprise-developed applications. Document root cause findings and feed them back into secure coding standards, developer training, and automated security testing rules to prevent recurrence.',
    evidenceRequirements: [
      'Root cause analysis process documentation defining when and how RCA is performed',
      'Completed root cause analysis reports for critical and high-severity vulnerabilities',
      'Evidence of process improvements implemented based on root cause analysis findings'
    ],
    testProcedures: [
      'Review completed root cause analysis reports to verify they identify the underlying cause and include recommendations for process improvement',
      'Trace a sample of root cause analysis recommendations to verify they were implemented as improvements to the secure SDLC, coding standards, or training'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-16.12',
    name: 'Implement Code-Level Security Checks',
    description: 'Apply static and dynamic analysis security testing tools within the application lifecycle to verify secure coding practices are followed. Integrate automated security testing into CI/CD pipelines.',
    category: 'IG3',
    implementationGuidance: 'Integrate static application security testing (SAST) tools into the CI/CD pipeline to scan code for vulnerabilities during build and deploy dynamic application security testing (DAST) tools to test running applications. Configure quality gates that prevent deployment when critical or high-severity vulnerabilities are detected.',
    evidenceRequirements: [
      'SAST and DAST tool configurations showing integration with CI/CD pipelines',
      'Quality gate configurations that block deployment on critical or high-severity findings',
      'Security testing reports from SAST and DAST scans showing scan coverage and findings'
    ],
    testProcedures: [
      'Review CI/CD pipeline configurations to verify SAST and DAST tools are integrated and running on code commits and deployments',
      'Introduce a known test vulnerability into a test application and verify the SAST tool detects it and the quality gate blocks deployment'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 17 - Incident Response Management (IG3)
  // ============================================================
  {
    controlId: 'CIS-17.1',
    name: 'Designate Personnel to Manage Incident Handling',
    description: 'Designate one key person and at least one backup who will manage the enterprise incident handling process. Management personnel are responsible for the coordination and documentation of incident response and recovery efforts.',
    category: 'IG3',
    implementationGuidance: 'Formally designate an incident response manager and at least one backup through written assignment that defines their authority, responsibilities, and escalation paths. Ensure designated personnel have appropriate training, certifications, and access to the tools and resources needed to manage incident response effectively.',
    evidenceRequirements: [
      'Formal designation letters or role assignments for incident response manager and backup',
      'Training and certification records for designated incident response personnel',
      'Contact information and escalation procedures for incident response management'
    ],
    testProcedures: [
      'Verify formal designation of incident response management personnel by reviewing assignment documentation and confirming both primary and backup personnel are identified',
      'Contact the designated incident response personnel to confirm they are aware of their role and can describe their responsibilities and escalation procedures'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-17.2',
    name: 'Establish and Maintain Contact Information for Reporting Security Incidents',
    description: 'Establish and maintain contact information for parties that need to be informed of security incidents. Contacts may include internal teams, legal, law enforcement, regulatory bodies, and affected parties.',
    category: 'IG3',
    implementationGuidance: 'Create and maintain a comprehensive incident notification contact list that includes internal stakeholders (executive management, legal, PR, IT), external parties (law enforcement, regulators, cyber insurance), and affected party notification procedures. Review and update the contact list quarterly to ensure accuracy.',
    evidenceRequirements: [
      'Incident notification contact list with internal and external stakeholder contacts',
      'Quarterly contact list review records demonstrating updates and verification',
      'Notification procedures documentation defining when and how each contact should be notified'
    ],
    testProcedures: [
      'Review the incident notification contact list for completeness, verifying it includes all required internal and external stakeholders with current contact information',
      'Contact a sample of listed individuals to verify their contact information is accurate and they are aware of their role in the incident notification process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-17.3',
    name: 'Establish and Maintain an Enterprise Process for Reporting Incidents',
    description: 'Establish and maintain an enterprise process for the workforce to report security incidents. The process must include a reporting mechanism, timeline requirements, and details on what constitutes a reportable incident.',
    category: 'IG3',
    implementationGuidance: 'Create an incident reporting process that provides multiple reporting channels (email, phone, web portal, chat) and clearly defines what constitutes a reportable security incident. Train all workforce members on the reporting process during onboarding and annual security awareness training, and ensure the reporting mechanisms are easily accessible.',
    evidenceRequirements: [
      'Incident reporting process documentation defining reportable incidents and reporting channels',
      'Evidence of incident reporting mechanism availability (helpdesk portal, dedicated email, phone line)',
      'Training records showing workforce members were trained on the incident reporting process'
    ],
    testProcedures: [
      'Review the incident reporting process documentation to verify it defines what constitutes a reportable incident, provides clear reporting instructions, and specifies timeline requirements',
      'Submit a test incident report through each available reporting channel and verify it is received and acknowledged by the incident response team'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-17.4',
    name: 'Establish and Maintain an Incident Response Process',
    description: 'Establish and maintain an incident response process that addresses roles, responsibilities, communication requirements, and phases of incident response. Review and update the process annually.',
    category: 'IG3',
    implementationGuidance: 'Develop a comprehensive incident response plan based on the NIST incident response lifecycle that includes preparation, detection and analysis, containment, eradication, recovery, and post-incident activities. Define roles and responsibilities, communication protocols, and decision-making authority for each phase of the response.',
    evidenceRequirements: [
      'Incident response plan document covering all phases of incident response with roles and responsibilities',
      'Communication plan defining internal and external communication protocols during incidents',
      'Annual incident response plan review records with documented updates'
    ],
    testProcedures: [
      'Review the incident response plan to verify it addresses all phases of incident response, defines roles and responsibilities, and includes communication and escalation procedures',
      'Conduct a tabletop exercise to validate the incident response process and verify participants understand their roles and the process flows as documented'
    ],
    status: 'Not Started'
  },

  // ============================================================
  // CIS 18 - Penetration Testing (IG3)
  // ============================================================
  {
    controlId: 'CIS-18.1',
    name: 'Establish and Maintain a Penetration Testing Program',
    description: 'Establish and maintain a penetration testing program appropriate to the size, complexity, and maturity of the enterprise. The program should define testing scope, frequency, methodology, and reporting requirements.',
    category: 'IG3',
    implementationGuidance: 'Develop a formal penetration testing program document that defines testing scope covering external and internal assets, testing frequency (at least annually), approved testing methodologies (such as PTES or OWASP), and reporting and remediation requirements. Ensure the program is approved by senior management and resourced appropriately.',
    evidenceRequirements: [
      'Penetration testing program document defining scope, frequency, methodology, and reporting requirements',
      'Senior management approval of the penetration testing program',
      'Annual program review records with updates based on enterprise changes and previous test results'
    ],
    testProcedures: [
      'Review the penetration testing program document to verify it defines comprehensive scope, appropriate frequency, recognized methodology, and clear reporting requirements',
      'Verify the program has senior management approval and is reviewed annually by checking approval records and review documentation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-18.2',
    name: 'Perform Periodic External Penetration Tests',
    description: 'Perform periodic external penetration tests based on program requirements. External penetration testing must include enterprise and environmental reconnaissance to detect exploitable information.',
    category: 'IG3',
    implementationGuidance: 'Engage qualified penetration testers (internal or third-party) to conduct external penetration tests at least annually that simulate real-world attack scenarios against internet-facing assets. Ensure testing includes reconnaissance, vulnerability exploitation, and post-exploitation activities to identify actual risk exposure.',
    evidenceRequirements: [
      'External penetration test reports from the past year documenting scope, methodology, and findings',
      'Penetration tester qualifications and engagement records',
      'Remediation tracking for findings identified during external penetration tests'
    ],
    testProcedures: [
      'Review the most recent external penetration test report to verify it covers the defined scope, uses recognized methodology, and includes detailed findings with risk ratings',
      'Review remediation tracking to verify findings from the most recent external penetration test have been addressed within the defined remediation timelines'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-18.3',
    name: 'Remediate Penetration Test Findings',
    description: 'Remediate penetration test findings based on the enterprise policy for remediation scope and prioritization. Track remediation to completion and validate fixes through re-testing.',
    category: 'IG3',
    implementationGuidance: 'Establish a remediation tracking process for all penetration test findings that assigns owners, sets remediation deadlines based on severity, and requires validation through re-testing before closure. Integrate penetration test findings with the vulnerability management process to ensure consistent tracking and prioritization.',
    evidenceRequirements: [
      'Remediation tracking records for penetration test findings with owners, deadlines, and status',
      'Re-testing or validation records confirming remediation effectiveness',
      'Metrics showing remediation completion rates and average time to remediate by severity'
    ],
    testProcedures: [
      'Review the remediation tracking system to verify all penetration test findings are tracked with assigned owners, severity-based deadlines, and current status',
      'Select a sample of remediated findings and verify they were validated through re-testing before being closed'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-18.4',
    name: 'Validate Security Measures',
    description: 'Validate security measures after each penetration test. At minimum, validate that previously identified vulnerabilities have been remediated and that security controls are functioning as intended.',
    category: 'IG3',
    implementationGuidance: 'After each penetration test cycle, conduct targeted validation testing to confirm that remediated vulnerabilities are no longer exploitable and that security controls detected or prevented the test activities as expected. Document validation results and address any control gaps identified during the validation process.',
    evidenceRequirements: [
      'Security control validation reports following penetration tests',
      'Targeted re-testing results confirming previously identified vulnerabilities are remediated',
      'Control gap analysis and remediation records for any security controls that failed to detect or prevent test activities'
    ],
    testProcedures: [
      'Review post-penetration test validation reports to verify previously identified vulnerabilities were re-tested and confirmed as remediated',
      'Evaluate whether security controls (IDS, SIEM, EDR) detected the penetration test activities and document any gaps in detection capability'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-18.5',
    name: 'Perform Periodic Internal Penetration Tests',
    description: 'Perform periodic internal penetration tests based on program requirements. Internal penetration testing simulates an insider threat or an attacker who has gained initial access to the internal network.',
    category: 'IG3',
    implementationGuidance: 'Conduct internal penetration tests at least annually that simulate an attacker with internal network access, testing the ability to escalate privileges, move laterally, and access sensitive data. Include tests of network segmentation effectiveness, Active Directory security, and access to critical systems.',
    evidenceRequirements: [
      'Internal penetration test reports from the past year documenting scope, methodology, and findings',
      'Testing scope documentation showing coverage of internal network segments, Active Directory, and critical systems',
      'Remediation tracking for findings identified during internal penetration tests'
    ],
    testProcedures: [
      'Review the most recent internal penetration test report to verify it covers the defined internal scope, tests segmentation and lateral movement, and includes detailed findings',
      'Review remediation tracking to verify findings from the most recent internal penetration test have been addressed within defined remediation timelines'
    ],
    status: 'Not Started'
  }
];
