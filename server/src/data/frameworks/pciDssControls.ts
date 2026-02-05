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

export const PCI_DSS_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // Requirement 1: Install and Maintain Network Security Controls
  // ============================================================
  {
    controlId: 'PCI-1.1',
    name: 'Processes and Mechanisms for Network Security Controls',
    description:
      'Processes and mechanisms for installing and maintaining network security controls are defined, documented, and understood by all affected parties.',
    category: 'Network Security Controls',
    implementationGuidance:
      'Establish and maintain a formal policy and supporting procedures that govern the installation, configuration, and maintenance of all network security controls (firewalls, routers, cloud security groups, WAFs). Assign ownership of the policy to a specific role. Conduct annual reviews of the policy and update it whenever business or technology changes affect the cardholder data environment (CDE). Distribute the policy to all personnel whose roles involve network security and obtain documented acknowledgment.',
    evidenceRequirements: [
      'Documented network security policy with version control and approval signatures',
      'Procedures for installing, configuring, and maintaining network security controls',
      'Records of annual policy review and updates',
      'Personnel acknowledgment records confirming receipt and understanding of the policy',
      'Defined roles and responsibilities for network security control management',
    ],
    testProcedures: [
      'Examine the network security policy to verify it addresses installation, configuration, and maintenance of all network security controls',
      'Verify the policy has been reviewed and updated within the last 12 months',
      'Interview responsible personnel to confirm they understand the policy and their responsibilities',
      'Examine distribution and acknowledgment records for all affected personnel',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2',
    name: 'Network Security Controls Configuration Standards',
    description:
      'Network security controls (NSCs) are configured and maintained to restrict inbound and outbound network traffic to and from the cardholder data environment.',
    category: 'Network Security Controls',
    implementationGuidance:
      'Define configuration standards for every type of NSC in use (hardware firewalls, software firewalls, cloud security groups, virtual network appliances). Standards must specify allowed inbound and outbound traffic by protocol, port, and source/destination. Implement a default-deny rule that blocks all traffic not explicitly permitted. Document all allowed services, protocols, and ports with business justification for each. Review firewall and router rule sets at least every six months to remove stale or unnecessary rules.',
    evidenceRequirements: [
      'NSC configuration standards documents for each technology type',
      'Current rule sets for all firewalls and routers with documented business justification for each rule',
      'Evidence of default-deny configuration on all NSCs',
      'Records of semi-annual rule set reviews with sign-off',
      'Network diagrams showing all NSC placements relative to the CDE',
    ],
    testProcedures: [
      'Examine configuration standards and verify they address all NSC types in use',
      'Inspect rule sets on a sample of NSCs to confirm default-deny is the last rule',
      'Verify each allow rule has a corresponding documented business justification',
      'Examine records of the most recent semi-annual rule set review',
      'Compare running configurations against documented standards to identify deviations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.3',
    name: 'Restrict Access Between CDE and Untrusted Networks',
    description:
      'Network access to and from the cardholder data environment is restricted and all traffic between the CDE and untrusted networks passes through configured network security controls.',
    category: 'Network Security Controls',
    implementationGuidance:
      'Position NSCs between every untrusted network (including the Internet, wireless networks, guest networks, partner connections) and the CDE. Ensure inbound traffic is limited to only communications that are necessary for authorized purposes. Implement stateful inspection or equivalent technology. Place publicly accessible system components (web servers, DNS, mail) in a DMZ to prevent direct inbound traffic to the CDE. Prohibit direct routes between the Internet and the CDE. Block all spoofed source IP addresses from entering the network.',
    evidenceRequirements: [
      'Network architecture diagrams showing NSC placement between untrusted networks and the CDE',
      'DMZ architecture documentation with system component inventory',
      'NSC rule sets demonstrating inbound traffic restrictions to the CDE',
      'Evidence of anti-spoofing measures configured on NSCs',
      'Documentation of all authorized inbound connections with business justification',
    ],
    testProcedures: [
      'Examine network diagrams and verify NSCs are positioned between all untrusted networks and the CDE',
      'Inspect NSC configurations to verify inbound traffic is restricted to necessary and authorized communications only',
      'Verify DMZ architecture prevents direct inbound access to the CDE from the Internet',
      'Test anti-spoofing controls by attempting to pass traffic with spoofed source addresses',
      'Trace authorized data flows and confirm they pass through an NSC at each trust boundary',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.4',
    name: 'Control Network Connections Between Trusted and Untrusted Networks',
    description:
      'Network connections between trusted and untrusted networks are controlled, and personal firewall or equivalent functionality is installed and active on all portable computing devices and devices that connect to the Internet outside the CDE.',
    category: 'Network Security Controls',
    implementationGuidance:
      'Install personal firewall software (or equivalent host-based network security controls) on all portable computing devices (laptops, tablets) and any employee-owned devices that access the CDE or handle cardholder data. Configure personal firewalls to deny all inbound traffic by default and allow only explicitly authorized services. Ensure personal firewall settings cannot be altered or disabled by device users. Manage personal firewall policies centrally through endpoint management tools. Monitor compliance via endpoint detection and response (EDR) or mobile device management (MDM) solutions.',
    evidenceRequirements: [
      'Inventory of all portable computing devices that connect to the CDE or handle cardholder data',
      'Personal firewall or host-based NSC configuration policy and standards',
      'Evidence of central management and deployment of personal firewall configurations',
      'EDR or MDM reports showing personal firewall compliance status across endpoints',
      'Configuration evidence showing users cannot disable or modify personal firewall settings',
    ],
    testProcedures: [
      'Examine a sample of portable devices and verify personal firewall software is installed and active',
      'Inspect personal firewall configurations for default-deny inbound rules',
      'Attempt to disable or modify the personal firewall on a sample device to verify the user cannot alter settings',
      'Review central management console to verify all in-scope endpoints have compliant firewall configurations',
      'Interview personnel to confirm they understand they must not attempt to disable personal firewalls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.5',
    name: 'Risks to the CDE from Computing Devices Connecting to Untrusted Networks',
    description:
      'Risks to the CDE from computing devices able to connect to both untrusted networks and the CDE are mitigated through defined security controls and configurations.',
    category: 'Network Security Controls',
    implementationGuidance:
      'Identify all computing devices that can connect to both untrusted networks and the CDE. Implement security controls such as network segmentation, host-based firewalls, endpoint protection, and VPN with multi-factor authentication to prevent threats from propagating from untrusted networks into the CDE. Define and enforce policies that govern how dual-homed devices are managed. Perform periodic risk assessments focused on these devices and update controls based on emerging threats. Consider implementing network access control (NAC) to enforce device compliance before granting CDE access.',
    evidenceRequirements: [
      'Risk assessment documentation covering dual-homed devices',
      'Inventory of devices that connect to both untrusted networks and the CDE',
      'Configuration evidence of security controls applied to dual-homed devices (VPN, NAC, endpoint protection)',
      'Policy governing the use and management of dual-homed devices',
      'Periodic assessment records demonstrating ongoing risk management',
    ],
    testProcedures: [
      'Examine the device inventory and identify all devices capable of connecting to both untrusted networks and the CDE',
      'Verify security controls are applied to each identified device',
      'Examine VPN and NAC configurations to confirm CDE access requires device compliance checks',
      'Review the most recent risk assessment for dual-homed devices and verify it addresses current threats',
      'Test a sample dual-homed device to confirm it cannot route traffic from untrusted networks directly into the CDE',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 2: Apply Secure Configurations to All System Components
  // ============================================================
  {
    controlId: 'PCI-2.1',
    name: 'Processes and Mechanisms for Secure Configurations',
    description:
      'Processes and mechanisms for applying secure configurations to all system components are defined, documented, and understood by all affected parties.',
    category: 'Secure Configurations',
    implementationGuidance:
      'Create and maintain a formal secure configuration policy that covers all system component types in the CDE and connected systems. The policy must mandate configuration standards based on industry-accepted hardening guides (CIS Benchmarks, vendor security guides, NIST). Assign ownership of configuration standards to specific roles. Establish a process for reviewing and updating standards when new vulnerabilities or vendor patches are identified. Train all personnel responsible for system hardening on current standards.',
    evidenceRequirements: [
      'Secure configuration policy document with version control and executive approval',
      'Configuration standards for each system component type (servers, databases, network devices, applications)',
      'Records of annual policy review and updates',
      'Training records for personnel responsible for applying secure configurations',
      'Mapping of configuration standards to industry-accepted hardening guides',
    ],
    testProcedures: [
      'Examine the secure configuration policy and verify it addresses all system component types',
      'Verify configuration standards reference industry-accepted hardening sources',
      'Interview responsible personnel to confirm understanding of configuration requirements',
      'Examine training records to verify personnel have completed configuration management training',
      'Verify the policy has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2',
    name: 'System Components Configured and Managed Securely',
    description:
      'System components are configured and managed securely by removing or disabling unnecessary functionality and enabling only necessary services, protocols, daemons, and functions.',
    category: 'Secure Configurations',
    implementationGuidance:
      'Develop and apply configuration standards for all system components based on industry-accepted hardening guidance. Disable or remove all unnecessary services, protocols, daemons, functions, and default accounts. Enable only one primary function per server to prevent functions requiring different security levels from coexisting. Configure system security parameters to prevent misuse. Implement configuration management tools to automate and enforce standards at scale. Document all enabled services and protocols with business justification. Address all known security vulnerabilities in configuration settings.',
    evidenceRequirements: [
      'Hardening standards for each system component type aligned with CIS Benchmarks or equivalent',
      'Evidence of disabled unnecessary services, protocols, and daemons on a sample of systems',
      'Documentation of all enabled services and protocols with corresponding business justifications',
      'Configuration management tool reports showing compliance against hardening baselines',
      'Evidence that each server implements only one primary function',
    ],
    testProcedures: [
      'Select a sample of system components and compare their configurations against documented hardening standards',
      'Verify unnecessary services, protocols, and daemons are disabled or removed',
      'Verify each server performs only one primary function',
      'Examine system security parameter settings and confirm they align with documented standards',
      'Run automated configuration compliance scans and review results for deviations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.3',
    name: 'Wireless Environments Configured and Managed Securely',
    description:
      'Wireless environments are configured and managed securely, including changing vendor defaults for wireless encryption keys, passwords, and SNMP community strings.',
    category: 'Secure Configurations',
    implementationGuidance:
      'For all wireless access points and devices in or connected to the CDE, change all vendor-supplied default settings including SSID names, encryption keys, passwords, and SNMP community strings before deployment. Implement strong encryption (WPA3 or WPA2-Enterprise with AES-256 at minimum) for wireless authentication and transmission. Disable WEP and any deprecated wireless protocols. Perform regular wireless scanning to detect unauthorized wireless access points. If wireless is not used, document the policy prohibiting wireless and verify through periodic scans that no wireless access points are present.',
    evidenceRequirements: [
      'Wireless configuration standards document',
      'Evidence that default wireless settings have been changed on all deployed access points',
      'Wireless encryption configuration showing WPA3 or WPA2-Enterprise with strong encryption',
      'Results of periodic wireless scans for unauthorized access points',
      'Inventory of all authorized wireless access points with approved configurations',
    ],
    testProcedures: [
      'Examine wireless access point configurations and verify vendor defaults have been changed',
      'Verify wireless encryption uses WPA3 or WPA2-Enterprise with AES encryption',
      'Verify WEP and other deprecated protocols are disabled',
      'Review wireless scan results for unauthorized access points',
      'If wireless is not used, examine the policy prohibiting wireless and review scan evidence confirming no wireless networks exist',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 3: Protect Stored Account Data
  // ============================================================
  {
    controlId: 'PCI-3.1',
    name: 'Processes and Mechanisms for Protecting Stored Account Data',
    description:
      'Processes and mechanisms for protecting stored account data are defined, documented, and understood by all affected parties.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Develop a comprehensive data retention and disposal policy that specifies what account data may be stored, where it is stored, the business justification for storage, the retention period, and the secure disposal process. Map all data stores containing account data including databases, files, backups, logs, and archives. Assign data stewardship responsibilities. Implement automated processes to purge account data that exceeds the retention period. Review the policy and data inventory at least annually.',
    evidenceRequirements: [
      'Data retention and disposal policy with defined retention periods for each data type',
      'Inventory of all data stores containing account data with locations and data types',
      'Evidence of automated or manual data purging processes',
      'Quarterly review records confirming stored data does not exceed defined retention periods',
      'Data flow diagrams showing where account data is stored throughout the environment',
    ],
    testProcedures: [
      'Examine the data retention and disposal policy and verify it defines storage locations, retention periods, and disposal methods',
      'Verify the data store inventory is current and complete',
      'Examine evidence of data purging and verify account data does not exceed defined retention periods',
      'Review data flow diagrams and verify all storage locations are inventoried',
      'Interview data stewards to confirm they understand their responsibilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.2',
    name: 'Storage of Account Data Is Kept to a Minimum',
    description:
      'Storage of account data is kept to a minimum through implementation of data retention and disposal policies, procedures, and processes that cover all storage of account data.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Implement processes to limit stored account data to only the minimum amount and duration necessary for legal, regulatory, and business requirements. Perform quarterly reviews of stored account data to identify and securely delete data that has exceeded its retention period. Ensure sensitive authentication data (SAD) is not stored after authorization, even in encrypted form. Implement automated data discovery tools to locate account data in unexpected locations. Define a secure deletion standard that ensures data is irrecoverable (e.g., cryptographic erasure, secure overwrite).',
    evidenceRequirements: [
      'Documented business, legal, and regulatory justification for each type of account data stored',
      'Records of quarterly data retention reviews',
      'Evidence of secure data deletion for data that exceeded its retention period',
      'Data discovery scan results confirming no unauthorized data storage locations',
      'Secure deletion procedure documentation and evidence of execution',
    ],
    testProcedures: [
      'Examine the data retention policy and verify retention periods have defined business justifications',
      'Verify quarterly reviews are being conducted by examining the most recent four reviews',
      'Confirm sensitive authentication data is not stored after authorization by inspecting data stores and application logs',
      'Review data discovery scan results and verify no account data is stored in unauthorized locations',
      'Examine deletion records and confirm secure deletion methods were used',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.3',
    name: 'Sensitive Authentication Data Not Stored After Authorization',
    description:
      'Sensitive authentication data (SAD) is not stored after authorization, even if encrypted. SAD includes full track data, card verification codes, and PINs.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Implement controls to ensure full track data from the magnetic stripe or chip, card verification codes (CAV2/CVC2/CVV2/CID), and PINs or encrypted PIN blocks are never stored after transaction authorization. Configure payment applications and systems to purge SAD immediately after authorization. Examine all data stores (databases, flat files, logs, trace files, transaction history) to confirm SAD is not retained. Test payment application behavior during and after authorization to verify SAD is purged. If SAD is stored prior to authorization for processing purposes, render it unrecoverable once authorization is complete.',
    evidenceRequirements: [
      'Payment application configuration settings showing SAD is not retained post-authorization',
      'Database schema reviews confirming no fields store full track data, CVV, or PIN data',
      'Log file and trace file reviews confirming no SAD in logs',
      'Test results demonstrating SAD is purged after authorization',
      'Issuer exception documentation (if applicable) for issuers that store SAD with business justification',
    ],
    testProcedures: [
      'Examine payment application configurations and verify SAD storage is disabled post-authorization',
      'Inspect database schemas and tables for fields that could contain SAD',
      'Review application and system logs for the presence of SAD',
      'Perform test transactions and verify SAD is not stored in any data store after authorization',
      'If the entity is an issuer, verify documented business justification and strong security measures for any SAD stored',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.4',
    name: 'Restrict Display of Full PAN',
    description:
      'Access to displays of full PAN and ability to copy PAN is restricted to only those personnel with a documented business need.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Implement PAN masking across all display channels (applications, customer service screens, reports, receipts) so that at most the first six and last four digits are displayed. Apply role-based access controls so only personnel with a documented, legitimate business need can view the full PAN. Implement controls to prevent unauthorized copying of the full PAN from displays (disable copy/paste, screen capture controls where feasible). Maintain a list of roles authorized to view full PAN with business justification. Review the authorized roles list at least annually.',
    evidenceRequirements: [
      'PAN masking configuration evidence for all display channels',
      'List of roles authorized to view full PAN with business justification',
      'Role-based access control configuration evidence',
      'Annual review records of authorized roles for full PAN access',
      'Evidence of controls preventing unauthorized copying of PAN from screens',
    ],
    testProcedures: [
      'Examine displays of PAN across applications, reports, and receipts to verify masking is applied',
      'Verify that users without a documented business need cannot view the full PAN',
      'Review the authorized roles list and confirm each role has a current business justification',
      'Test role-based access by logging in as an unauthorized user and confirming the PAN is masked',
      'Verify the authorized roles list has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.5',
    name: 'Primary Account Number Secured Wherever Stored',
    description:
      'Primary account number (PAN) is secured wherever it is stored, using strong cryptography, truncation, tokenization, or one-way hashing.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Render PAN unreadable anywhere it is stored using one of the following methods: one-way cryptographic hashes based on strong cryptography of the entire PAN; truncation (storing only a segment that cannot be used to reconstruct full PAN); index tokens with securely stored pads; or strong cryptography with associated key management processes and procedures. For disk-level or partition-level encryption, it is only acceptable for removable media; for non-removable media, use a method above in addition to or instead of disk encryption. Document the cryptographic architecture including algorithms, key lengths, and key management.',
    evidenceRequirements: [
      'Cryptographic architecture documentation covering algorithms, key lengths, and methods used',
      'Configuration evidence showing PAN rendering method (encryption, tokenization, truncation, hashing) for each storage location',
      'Inventory of all PAN storage locations with the protection method applied',
      'Evidence that disk-level encryption is only used for removable media or in combination with another method',
      'Key management documentation (covered in detail by PCI-3.6 and PCI-3.7)',
    ],
    testProcedures: [
      'Examine the cryptographic architecture documentation and verify it specifies algorithms and key lengths',
      'Inspect data repositories and verify PAN is rendered unreadable using an approved method',
      'Verify the PAN protection method used for each storage location against the inventory',
      'If disk-level encryption is used, verify it applies only to removable media or is supplemented by another method',
      'Attempt to retrieve PAN from storage and verify it cannot be read in clear text',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.6',
    name: 'Cryptographic Keys Used to Protect Stored Account Data Are Managed',
    description:
      'Cryptographic keys used to protect stored account data are managed with appropriate key-management processes and procedures throughout their lifecycle.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Implement comprehensive key management procedures covering the entire key lifecycle: generation, distribution, storage, rotation, retirement, and destruction. Generate keys using strong cryptographic methods (FIPS 140-2/3 validated modules or equivalent). Distribute keys securely using encrypted channels or split knowledge and dual control. Store encryption keys in the fewest possible locations, encrypted with a key-encrypting key (KEK) that is at least as strong as the data-encrypting key. Rotate keys at least annually or upon suspected compromise. Retire and destroy keys securely when they expire or are compromised.',
    evidenceRequirements: [
      'Key management policy and procedures document covering the full key lifecycle',
      'Evidence of key generation using approved methods (FIPS 140-2/3 validated HSMs or equivalent)',
      'Key storage configuration showing keys are encrypted with a KEK',
      'Records of key rotation within the defined period (at least annually)',
      'Key destruction records with methods used and personnel involved',
    ],
    testProcedures: [
      'Examine key management procedures and verify they cover generation, distribution, storage, rotation, retirement, and destruction',
      'Verify keys are generated using cryptographic modules validated to FIPS 140-2/3 or equivalent',
      'Examine key storage and verify keys are encrypted with a KEK of equal or greater strength',
      'Review key rotation records and verify keys have been rotated within the defined period',
      'Examine key destruction records and verify secure destruction methods were used',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7',
    name: 'Cryptographic Key Management Processes and Procedures',
    description:
      'Where cryptography is used to protect stored account data, key management processes and procedures covering all aspects of the key lifecycle are defined and implemented.',
    category: 'Protect Stored Account Data',
    implementationGuidance:
      'Ensure cryptographic key management includes split knowledge and dual control for manual key management operations so that no single person has access to the complete key. Require key custodians to formally acknowledge their key-custodian responsibilities. Implement automated key rotation where possible and manual rotation procedures where automation is not feasible. Define a crypto-period for each key type and enforce rotation when the crypto-period expires. Maintain an inventory of all cryptographic keys with their purpose, custodians, crypto-period, and current status.',
    evidenceRequirements: [
      'Split knowledge and dual control procedures for key management operations',
      'Signed key custodian acknowledgment forms',
      'Cryptographic key inventory with key purpose, custodians, crypto-period, and status',
      'Evidence of crypto-period enforcement and timely key rotation',
      'Documented procedures for key replacement in the event of suspected or confirmed compromise',
    ],
    testProcedures: [
      'Examine key management procedures for split knowledge and dual control requirements',
      'Verify signed key custodian acknowledgment forms exist for all custodians',
      'Review the cryptographic key inventory for completeness and accuracy',
      'Verify crypto-periods are defined and keys have been rotated before expiration',
      'Review the key compromise response procedure and verify it is actionable',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks
  // ============================================================
  {
    controlId: 'PCI-4.1',
    name: 'Processes and Mechanisms for Protecting CHD During Transmission',
    description:
      'Processes and mechanisms for protecting cardholder data with strong cryptography during transmission over open, public networks are defined, documented, and understood.',
    category: 'Cryptography for Transmission',
    implementationGuidance:
      'Establish a policy and supporting procedures that mandate the use of strong cryptography and security protocols to safeguard cardholder data during transmission over open, public networks (Internet, wireless, cellular, satellite). Define approved cryptographic protocols (TLS 1.2 or higher) and cipher suites. Prohibit the use of deprecated protocols (SSL, early TLS). Document all data flows where CHD traverses open networks and ensure each flow is protected. Include requirements for trusted certificates from recognized certificate authorities. Review the policy annually.',
    evidenceRequirements: [
      'Transmission security policy specifying approved protocols and cipher suites',
      'Data flow diagrams identifying all CHD transmission over open, public networks',
      'TLS/cryptographic protocol configuration evidence for all transmission channels',
      'Certificate inventory from recognized certificate authorities',
      'Annual policy review records',
    ],
    testProcedures: [
      'Examine the transmission security policy and verify it mandates strong cryptography for CHD over open networks',
      'Review data flow diagrams to identify all CHD transmissions over open, public networks',
      'Verify each identified data flow uses TLS 1.2 or higher with approved cipher suites',
      'Confirm deprecated protocols (SSL, early TLS) are disabled on all applicable systems',
      'Verify certificates are from trusted certificate authorities and are not expired',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-4.2',
    name: 'PAN Is Protected with Strong Cryptography During Transmission',
    description:
      'PAN is protected with strong cryptography whenever it is sent via end-user messaging technologies such as email, instant messaging, SMS, and chat.',
    category: 'Cryptography for Transmission',
    implementationGuidance:
      'Implement technical controls to prevent PAN from being sent via unencrypted end-user messaging technologies. Where PAN must be transmitted via messaging, deploy end-to-end encryption solutions that render PAN unreadable before transmission. Implement email encryption (S/MIME, PGP) or secure messaging platforms for any necessary PAN transmissions. Configure DLP tools to detect and block unencrypted PAN in outbound messages. Train personnel to never send PAN via unprotected messaging channels. Establish clear procedures for securely transmitting PAN when business needs require it.',
    evidenceRequirements: [
      'DLP policy configuration evidence showing PAN detection in outbound messages',
      'Email encryption configuration (S/MIME, PGP, or equivalent) for authorized PAN transmissions',
      'Evidence of technical controls preventing unencrypted PAN in messaging channels',
      'Personnel training records on secure PAN transmission procedures',
      'Documented procedures for securely transmitting PAN when required',
    ],
    testProcedures: [
      'Attempt to send a test PAN via email, SMS, and chat and verify DLP controls block or encrypt the transmission',
      'Verify email encryption is configured and functioning for authorized PAN transmissions',
      'Review DLP alert logs for attempted unencrypted PAN transmissions',
      'Interview a sample of personnel and verify they understand the prohibition on unencrypted PAN messaging',
      'Examine the secure PAN transmission procedure and verify it is followed in practice',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 5: Protect All Systems and Networks from Malicious Software
  // ============================================================
  {
    controlId: 'PCI-5.1',
    name: 'Processes and Mechanisms for Malicious Software Protection',
    description:
      'Processes and mechanisms for protecting all systems and networks from malicious software are defined, documented, and understood by all affected parties.',
    category: 'Malicious Software Protection',
    implementationGuidance:
      'Establish a formal anti-malware policy that mandates deployment of anti-malware solutions on all systems commonly affected by malware. Define which system types require anti-malware protection and document the rationale for any system types excluded (e.g., mainframes, certain IoT devices) based on periodic malware risk evaluations. Assign responsibility for anti-malware management to specific roles. Include requirements for signature updates, real-time scanning, scheduled scans, and response procedures. Review the policy annually.',
    evidenceRequirements: [
      'Anti-malware policy with defined scope, responsibilities, and update requirements',
      'Risk evaluation documentation for any system types excluded from anti-malware deployment',
      'Inventory of all systems with anti-malware protection status',
      'Records of annual policy review',
      'Defined roles and responsibilities for anti-malware management',
    ],
    testProcedures: [
      'Examine the anti-malware policy and verify it covers all system types in the CDE',
      'Verify any exclusions are supported by a documented risk evaluation',
      'Review the system inventory and confirm anti-malware status for each system',
      'Verify the policy has been reviewed within the last 12 months',
      'Interview responsible personnel to confirm they understand anti-malware management responsibilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.2',
    name: 'Malicious Software Is Detected and Addressed',
    description:
      'Malicious software (malware) is prevented or detected and addressed on all systems and networks within the CDE.',
    category: 'Malicious Software Protection',
    implementationGuidance:
      'Deploy anti-malware solutions on all system components that are commonly affected by malware. Ensure anti-malware solutions are kept current with the latest signatures, definitions, and engines through automatic updates. Configure anti-malware to perform periodic scans and real-time (on-access) scanning of all files, removable media, and network traffic. Enable automatic quarantine or removal of detected malware. Implement behavior-based detection (heuristics, machine learning) in addition to signature-based detection. Monitor anti-malware management consoles for detection events and ensure timely response.',
    evidenceRequirements: [
      'Anti-malware deployment records for all in-scope systems',
      'Configuration evidence showing automatic signature and definition updates',
      'Configuration evidence for real-time scanning and periodic scheduled scans',
      'Anti-malware management console reports showing detection and remediation events',
      'Evidence of behavior-based detection capabilities (heuristic or ML-based scanning)',
    ],
    testProcedures: [
      'Examine a sample of systems and verify anti-malware is installed, active, and current',
      'Verify signature updates are automatic and have been applied within the defined timeframe',
      'Confirm real-time scanning is enabled and functioning on sample systems',
      'Review management console reports for recent malware detections and confirm timely remediation',
      'Verify periodic scans are scheduled and have completed as expected',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3',
    name: 'Anti-Malware Mechanisms and Processes Are Active and Maintained',
    description:
      'Anti-malware mechanisms and processes are active, maintained, and monitored on all systems. Anti-malware solutions cannot be disabled or altered by users unless specifically documented and authorized on a case-by-case basis for a limited time.',
    category: 'Malicious Software Protection',
    implementationGuidance:
      'Configure anti-malware solutions so they cannot be disabled, stopped, or altered by end users. If business or technical needs require temporarily disabling anti-malware, implement a formal exception process requiring management approval with a defined time limit. Automatically re-enable anti-malware after the exception period expires. Generate alerts when anti-malware is disabled or tampered with. Centrally monitor all anti-malware agents to detect systems where protection is missing or non-functional. Implement tamper protection to prevent malware from disabling the anti-malware agent.',
    evidenceRequirements: [
      'Anti-malware configuration showing users cannot disable or alter settings',
      'Formal exception process documentation for temporary disabling of anti-malware',
      'Exception request records with management approval, time limits, and re-enablement evidence',
      'Alert configuration for anti-malware disabling or tampering events',
      'Central monitoring dashboard showing agent health and compliance across all systems',
    ],
    testProcedures: [
      'Attempt to disable or alter anti-malware settings as a standard user and verify the action is blocked',
      'Examine the exception process and verify it requires management approval and time limits',
      'Review exception records and confirm anti-malware was re-enabled after the approved period',
      'Verify alerts are generated when anti-malware is disabled or tampered with',
      'Review the central monitoring dashboard and confirm all systems show active anti-malware',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.4',
    name: 'Anti-Phishing Mechanisms Protect Users',
    description:
      'Anti-phishing mechanisms protect users against phishing attacks, including both technical controls and user awareness training.',
    category: 'Malicious Software Protection',
    implementationGuidance:
      'Deploy technical anti-phishing controls including email filtering with anti-phishing engines, URL rewriting and analysis, DMARC/DKIM/SPF email authentication, browser-based phishing protection, and link sandboxing. Implement phishing simulation exercises at least quarterly to assess user awareness. Provide targeted training to users who fail phishing simulations. Establish a clear reporting mechanism for suspected phishing emails (e.g., a report phishing button in the email client). Monitor phishing metrics over time to measure improvement.',
    evidenceRequirements: [
      'Email anti-phishing filter configuration and deployment evidence',
      'DMARC, DKIM, and SPF DNS record configuration evidence',
      'Phishing simulation exercise results from the last 12 months',
      'User awareness training records and completion rates',
      'Phishing report mechanism documentation and usage statistics',
    ],
    testProcedures: [
      'Examine email anti-phishing configurations and verify filters are active and current',
      'Verify DMARC, DKIM, and SPF records are configured for all sending domains',
      'Review phishing simulation results and verify exercises are conducted regularly',
      'Examine training records for users who failed phishing simulations',
      'Test the phishing reporting mechanism and verify reports are received and triaged',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 6: Develop and Maintain Secure Systems and Software
  // ============================================================
  {
    controlId: 'PCI-6.1',
    name: 'Processes and Mechanisms for Developing Secure Systems and Software',
    description:
      'Processes and mechanisms for developing and maintaining secure systems and software are defined, documented, and understood by all affected parties.',
    category: 'Secure Systems and Software',
    implementationGuidance:
      'Establish a formal secure software development lifecycle (SSDLC) policy and procedures that apply to all bespoke and custom software developed in-house or by third parties. Define security requirements at each stage of the SDLC: requirements, design, development, testing, deployment, and maintenance. Mandate code reviews, static and dynamic security testing, and vulnerability assessments before production deployment. Assign security champions within development teams. Review the SSDLC policy annually and update it to address emerging threats and vulnerabilities.',
    evidenceRequirements: [
      'Secure software development lifecycle (SSDLC) policy document',
      'SDLC stage-gate criteria including security requirements at each phase',
      'Code review and security testing standards',
      'Security champion assignments within development teams',
      'Annual SSDLC policy review records',
    ],
    testProcedures: [
      'Examine the SSDLC policy and verify it covers all phases of software development',
      'Verify security requirements are defined for each SDLC phase',
      'Interview development team members and security champions to confirm understanding of the SSDLC',
      'Review a sample of recent development projects and verify security activities were performed at each phase',
      'Verify the SSDLC policy has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.2',
    name: 'Bespoke and Custom Software Developed Securely',
    description:
      'Bespoke and custom software is developed securely by training developers in secure coding techniques and establishing secure coding practices throughout the SDLC.',
    category: 'Secure Systems and Software',
    implementationGuidance:
      'Train all development personnel in secure coding techniques relevant to their development language and platform at least annually. Cover the OWASP Top 10, common vulnerability types (injection, XSS, CSRF, authentication flaws, access control failures), and secure coding best practices. Enforce secure coding standards through automated tools (SAST, linting) integrated into CI/CD pipelines. Perform manual code reviews with a security focus. Maintain secure coding guidelines accessible to all developers. Track and remediate security findings from code reviews and automated scans before production deployment.',
    evidenceRequirements: [
      'Developer secure coding training records with dates, topics, and completion status',
      'Secure coding standards document applicable to each development language in use',
      'SAST tool configuration and integration evidence in CI/CD pipelines',
      'Code review records showing security-focused review activities',
      'Remediation records for security findings identified during development',
    ],
    testProcedures: [
      'Examine training records and verify all developers have completed secure coding training within the last 12 months',
      'Review secure coding standards and verify they address common vulnerabilities (OWASP Top 10)',
      'Examine CI/CD pipeline configurations and verify SAST tools are integrated and running',
      'Review a sample of code review records and verify security aspects were evaluated',
      'Examine security finding remediation records and verify findings were resolved before production deployment',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.3',
    name: 'Security Vulnerabilities Identified and Addressed',
    description:
      'Security vulnerabilities are identified and addressed through a vulnerability management process that includes monitoring vulnerability sources, ranking vulnerabilities by risk, and applying patches or mitigations promptly.',
    category: 'Secure Systems and Software',
    implementationGuidance:
      'Establish a formal vulnerability management process that monitors industry vulnerability sources (NVD, vendor advisories, CERT, threat intelligence feeds) continuously. Evaluate all identified vulnerabilities for applicability to the environment. Rank applicable vulnerabilities using a risk-based approach (CVSS scores combined with environmental and threat context). Install critical and high-risk security patches within 30 days of release. Install medium and lower-risk patches according to a defined schedule. For systems where patches cannot be immediately applied, implement compensating controls and document risk acceptance. Maintain patch deployment records.',
    evidenceRequirements: [
      'Vulnerability management policy and procedures document',
      'List of monitored vulnerability sources (NVD, vendor advisories, etc.)',
      'Vulnerability risk ranking methodology documentation',
      'Patch deployment records showing installation dates relative to release dates',
      'Compensating control documentation for systems where patches cannot be promptly applied',
    ],
    testProcedures: [
      'Examine the vulnerability management process and verify it includes continuous monitoring of vulnerability sources',
      'Review the risk ranking methodology and verify it considers severity, exploitability, and environmental context',
      'Examine patch deployment records for a sample of critical patches and verify installation within 30 days',
      'Verify compensating controls are documented and effective for unpatched systems',
      'Review a sample of recent vulnerability advisories and trace them through the vulnerability management process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.4',
    name: 'Public-Facing Web Applications Protected Against Attacks',
    description:
      'Public-facing web applications are protected against attacks through application-level security measures such as web application firewalls (WAFs), automated vulnerability scanning, and secure coding practices.',
    category: 'Secure Systems and Software',
    implementationGuidance:
      'Deploy a web application firewall (WAF) in front of all public-facing web applications to detect and block web-based attacks. Configure the WAF to protect against the OWASP Top 10 vulnerability categories. Keep WAF rules current and update them to address new attack patterns. Alternatively, or in addition, perform automated vulnerability security assessments of public-facing web applications at least annually and after significant changes. Implement Content Security Policy (CSP) headers, HTTP Strict Transport Security (HSTS), and other security response headers. Monitor WAF logs for attack patterns and investigate alerts.',
    evidenceRequirements: [
      'WAF deployment and configuration evidence for all public-facing web applications',
      'WAF rule set documentation showing coverage of OWASP Top 10',
      'WAF log monitoring and alerting configuration',
      'Web application vulnerability assessment results (at least annually)',
      'Security response header configuration (CSP, HSTS, X-Frame-Options, etc.)',
    ],
    testProcedures: [
      'Examine WAF deployment and verify it covers all public-facing web applications',
      'Review WAF rules and verify they address OWASP Top 10 attack categories',
      'Examine WAF logs and verify attack detection and blocking is functioning',
      'Review the most recent web application vulnerability assessment and verify findings were remediated',
      'Inspect HTTP response headers for security headers (CSP, HSTS, X-Frame-Options)',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5',
    name: 'Changes to All System Components Managed Securely',
    description:
      'Changes to all system components in the production environment are managed securely through a formal change control process that includes impact analysis, testing, and approval.',
    category: 'Secure Systems and Software',
    implementationGuidance:
      'Implement a formal change management process for all changes to system components in the CDE and connected environments. Require change requests to include a description, business justification, impact analysis, rollback plan, and testing results. Separate development, testing, and production environments. Require management approval before deploying changes to production. Test all changes for security impact before production deployment. Remove test data and test accounts before systems go live. Review custom application code changes for vulnerabilities before release to production.',
    evidenceRequirements: [
      'Change management policy and procedures document',
      'Sample change request tickets showing description, justification, impact analysis, and approval',
      'Evidence of separate development, testing, and production environments',
      'Pre-production security testing records for changes',
      'Evidence that test data and accounts are removed before production deployment',
    ],
    testProcedures: [
      'Examine the change management process and verify it includes impact analysis, testing, and approval steps',
      'Review a sample of recent change requests and verify all required elements are documented',
      'Verify development, testing, and production environments are separate',
      'Examine security testing records for recent changes and verify testing was completed before production deployment',
      'Verify test data and test accounts do not exist in production environments',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know
  // ============================================================
  {
    controlId: 'PCI-7.1',
    name: 'Processes and Mechanisms for Restricting Access by Business Need',
    description:
      'Processes and mechanisms for restricting access to system components and cardholder data by business need to know are defined, documented, and understood.',
    category: 'Restrict Access by Business Need',
    implementationGuidance:
      'Develop an access control policy that defines how access to system components and cardholder data is restricted based on business need to know. Define an access control model (role-based, attribute-based, or equivalent) that maps job functions to required system and data access. Document the access levels for each role and the approval process for granting access. Mandate that all access is denied by default and explicitly granted only when business need is verified. Review the policy at least annually.',
    evidenceRequirements: [
      'Access control policy defining need-to-know requirements',
      'Access control model documentation mapping roles to permitted access',
      'Access approval workflow documentation',
      'Evidence of default-deny access configuration',
      'Annual access control policy review records',
    ],
    testProcedures: [
      'Examine the access control policy and verify it defines need-to-know based access restrictions',
      'Review the access control model and verify roles are mapped to specific access permissions',
      'Verify the access approval process requires documented business justification',
      'Confirm default-deny is configured on access control systems',
      'Verify the policy has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2',
    name: 'Access to System Components and Data Appropriately Defined and Assigned',
    description:
      'Access to system components and data is appropriately defined and assigned based on job classification and function, with an access control system that restricts access based on a user\'s need to know.',
    category: 'Restrict Access by Business Need',
    implementationGuidance:
      'Implement role-based access control (RBAC) or equivalent across all system components in the CDE. Define roles based on job functions and assign minimum necessary permissions to each role. Ensure the access control system enforces assigned permissions and denies all access not explicitly granted. Document the relationship between roles, permissions, and the personnel assigned to each role. Conduct access reviews at least semi-annually to verify access assignments remain appropriate. Revoke access immediately when personnel change roles or leave the organization.',
    evidenceRequirements: [
      'RBAC role definitions with associated permissions for each system component',
      'User-to-role assignment records',
      'Access control system configuration showing enforcement of role-based permissions',
      'Semi-annual access review records with findings and remediation actions',
      'Evidence of timely access revocation for role changes and terminations',
    ],
    testProcedures: [
      'Examine role definitions and verify permissions are based on minimum necessary access',
      'Review a sample of user accounts and verify their role assignments match their job function',
      'Test the access control system by attempting to access resources outside an assigned role',
      'Examine semi-annual access review records and verify findings were remediated',
      'Review access revocation records for recent role changes and terminations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.3',
    name: 'Access to System Components and Data Managed via Access Control System',
    description:
      'Access to system components and data is managed via an access control system(s) that applies the principle of least privilege and covers all system components.',
    category: 'Restrict Access by Business Need',
    implementationGuidance:
      'Deploy centralized access control systems (Active Directory, LDAP, IAM platforms) to manage access to all system components in the CDE. Configure the access control system to enforce least-privilege access based on defined roles. Ensure all system components authenticate against the centralized access control system. Implement just-in-time (JIT) access or privileged access management (PAM) for administrative accounts. Log and monitor all access control decisions. Regularly audit access control configurations to detect drift from approved settings.',
    evidenceRequirements: [
      'Centralized access control system deployment documentation',
      'Configuration evidence showing least-privilege enforcement',
      'List of all system components authenticating against the access control system',
      'Privileged access management (PAM) or JIT access configuration evidence',
      'Access control audit logs and review records',
    ],
    testProcedures: [
      'Verify all system components in the CDE authenticate against the centralized access control system',
      'Examine access control configurations and verify least privilege is enforced',
      'Test privileged access controls by requesting elevated access and verifying approval workflow',
      'Review access control audit logs for unauthorized access attempts',
      'Verify access control configurations match documented approved settings',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 8: Identify Users and Authenticate Access to System Components
  // ============================================================
  {
    controlId: 'PCI-8.1',
    name: 'Processes and Mechanisms for User Identification and Authentication',
    description:
      'Processes and mechanisms for identifying users and authenticating access to system components are defined, documented, and understood by all affected parties.',
    category: 'User Identification and Authentication',
    implementationGuidance:
      'Establish an identification and authentication policy that mandates unique user IDs for all personnel with access to system components or cardholder data. Define authentication requirements including password complexity, multi-factor authentication, and account lockout settings. Prohibit the use of shared, group, or generic accounts except where documented and approved with additional controls. Include requirements for service accounts and application accounts. Assign responsibility for identity and access management to specific roles. Review the policy annually.',
    evidenceRequirements: [
      'Identification and authentication policy document',
      'Password and authentication standards (complexity, length, expiration, lockout)',
      'Policy provisions addressing shared/group/generic accounts',
      'Service and application account management standards',
      'Annual policy review records',
    ],
    testProcedures: [
      'Examine the identification and authentication policy and verify it mandates unique user IDs',
      'Verify authentication requirements align with PCI DSS v4.0 standards',
      'Confirm the policy prohibits shared accounts except with documented approval and additional controls',
      'Review service and application account management standards',
      'Verify the policy has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2',
    name: 'User Identification and Related Accounts Managed Throughout Lifecycle',
    description:
      'User identification and related accounts for users and administrators are managed throughout the account lifecycle, from creation through revocation.',
    category: 'User Identification and Authentication',
    implementationGuidance:
      'Assign a unique ID to each user before allowing access to system components or cardholder data. Implement a formal process for account creation, modification, and deletion that includes management approval. Immediately disable or remove accounts for terminated users. Remove or disable inactive accounts within 90 days. Manage vendor and third-party remote access accounts by enabling them only during needed time periods and monitoring their use. Implement controls to detect and disable shared or generic accounts. Conduct periodic reviews of all user accounts to verify their validity.',
    evidenceRequirements: [
      'Account provisioning process documentation with approval workflows',
      'Evidence of unique ID assignment for all users',
      'Account termination records showing timely disabling of departed user accounts',
      'Inactive account review and disabling records (90-day threshold)',
      'Vendor and third-party account management records showing enable/disable periods',
    ],
    testProcedures: [
      'Examine user accounts and verify each has a unique ID',
      'Review account provisioning records and verify management approval was obtained',
      'Compare terminated employee lists against active accounts to identify accounts not disabled',
      'Examine inactive accounts and verify none have been inactive longer than 90 days without being disabled',
      'Review vendor remote access accounts and verify they are enabled only when needed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3',
    name: 'Strong Authentication for Users and Administrators',
    description:
      'Strong authentication for users and administrators is established and managed, including multi-factor authentication (MFA) for all access into the CDE and for all remote network access.',
    category: 'User Identification and Authentication',
    implementationGuidance:
      'Enforce strong authentication factors with a minimum password length of 12 characters (or 8 characters if systems do not support 12) containing both numeric and alphabetic characters. Require password changes at least every 90 days or implement a zero-trust dynamic authentication approach. Lock accounts after no more than 10 invalid login attempts for a minimum of 30 minutes or until an administrator re-enables the account. Implement MFA for all non-console administrative access to the CDE and for all remote access to the network. MFA must use at least two of the three authentication factor categories: something you know, something you have, something you are.',
    evidenceRequirements: [
      'Authentication configuration showing minimum 12-character passwords with complexity requirements',
      'Account lockout configuration (10 attempts, 30-minute lockout)',
      'MFA deployment evidence for all non-console administrative access to the CDE',
      'MFA deployment evidence for all remote network access',
      'MFA configuration showing use of at least two different authentication factor categories',
    ],
    testProcedures: [
      'Examine authentication configurations and verify password length and complexity requirements',
      'Test account lockout by attempting multiple invalid logins and verifying lockout occurs',
      'Verify MFA is required for non-console administrative access by attempting access without MFA',
      'Verify MFA is required for all remote network access',
      'Examine MFA configuration and verify it requires at least two of three factor categories',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.4',
    name: 'Multi-Factor Authentication for All Access into the CDE',
    description:
      'Multi-factor authentication (MFA) is implemented to secure all access into the CDE, not just remote or administrative access.',
    category: 'User Identification and Authentication',
    implementationGuidance:
      'Implement MFA for all access into the CDE by all personnel, including on-site access. Ensure MFA cannot be bypassed by any user, including administrators. Configure MFA so that the authentication factors are independent — compromise of one factor does not affect the other. Implement MFA at the system or application level, not just the network level. Ensure MFA is not susceptible to replay attacks. Document any exceptions with compensating controls and executive approval. Monitor MFA failures and investigate repeated failures.',
    evidenceRequirements: [
      'MFA configuration evidence for all CDE access points (network, system, application)',
      'Documentation showing MFA factors are independent and resistant to replay',
      'Evidence that MFA cannot be bypassed for any user role',
      'Exception documentation with compensating controls and executive approval (if any)',
      'MFA failure monitoring and alerting configuration',
    ],
    testProcedures: [
      'Attempt to access the CDE without MFA and verify access is denied',
      'Verify MFA is implemented at system/application level in addition to network level',
      'Verify MFA factors are independent by testing compromise scenarios',
      'Review exception documentation and verify compensating controls are effective',
      'Examine MFA failure logs and verify monitoring and alerting are active',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.5',
    name: 'Multi-Factor Authentication Systems Configured Properly',
    description:
      'Multi-factor authentication systems are configured to prevent misuse and ensure authentication integrity.',
    category: 'User Identification and Authentication',
    implementationGuidance:
      'Configure MFA systems to prevent replay attacks by ensuring each authentication token or code is valid only once. Set MFA session timeouts appropriate to the risk level of the resources being accessed. Ensure MFA systems are resilient to tampering and configured with integrity protections. Implement rate limiting on MFA attempts to prevent brute-force attacks. Use time-based one-time passwords (TOTP) with short validity windows or push-based authentication with user interaction. Prohibit SMS-based OTP as the sole MFA factor for administrative access where feasible.',
    evidenceRequirements: [
      'MFA system configuration showing anti-replay protections',
      'MFA session timeout configuration',
      'Rate limiting configuration on MFA authentication attempts',
      'MFA factor type documentation (TOTP, push, hardware token, biometric)',
      'Integrity protection configuration for MFA system components',
    ],
    testProcedures: [
      'Attempt to reuse an MFA token and verify it is rejected (anti-replay test)',
      'Verify MFA session timeouts are configured and enforced',
      'Attempt rapid repeated MFA attempts and verify rate limiting activates',
      'Review MFA factor types in use and verify they meet PCI DSS requirements',
      'Examine MFA system integrity protections and verify they prevent tampering',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.6',
    name: 'Application and System Accounts Managed Securely',
    description:
      'Use of application and system accounts and associated authentication factors is strictly managed and controlled.',
    category: 'User Identification and Authentication',
    implementationGuidance:
      'Maintain an inventory of all application and system accounts with their purpose, owner, and authorized use. Restrict interactive login capabilities of application and system accounts unless necessary, and document the business justification for any interactive use. Implement strong, unique passwords or authentication mechanisms for all application and system accounts. Rotate passwords and authentication factors for application and system accounts periodically (at least annually) and upon suspicion of compromise. Limit privileges of system and application accounts to the minimum necessary for their function. Monitor usage of system and application accounts for unauthorized interactive logins.',
    evidenceRequirements: [
      'Inventory of all application and system accounts with owner, purpose, and permissions',
      'Configuration evidence showing interactive login restrictions on service accounts',
      'Password rotation records for application and system accounts',
      'Monitoring configuration for unauthorized interactive use of service accounts',
      'Business justification documentation for any service accounts with interactive login enabled',
    ],
    testProcedures: [
      'Review the application and system account inventory and verify it is current and complete',
      'Examine a sample of service accounts and verify interactive login is restricted where not needed',
      'Verify passwords for system accounts have been rotated within the defined period',
      'Review monitoring alerts for unauthorized interactive use of service accounts',
      'Verify service account privileges follow the principle of least privilege',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 9: Restrict Physical Access to Cardholder Data
  // ============================================================
  {
    controlId: 'PCI-9.1',
    name: 'Processes and Mechanisms for Restricting Physical Access',
    description:
      'Processes and mechanisms for restricting physical access to cardholder data are defined, documented, and understood by all affected parties.',
    category: 'Restrict Physical Access',
    implementationGuidance:
      'Develop a physical security policy that defines how physical access to systems storing, processing, or transmitting cardholder data is restricted. Define facility areas by sensitivity level and assign physical access controls accordingly. Document the physical security controls for each area (badges, locks, cameras, guards). Assign ownership of physical security to specific roles. Include visitor management procedures, media handling procedures, and point-of-interaction (POI) device security. Review the policy annually.',
    evidenceRequirements: [
      'Physical security policy document with scope, responsibilities, and control requirements',
      'Facility area classification document identifying CDE, sensitive, and public areas',
      'Physical access control inventory (badges, locks, cameras, biometrics)',
      'Assigned roles and responsibilities for physical security management',
      'Annual physical security policy review records',
    ],
    testProcedures: [
      'Examine the physical security policy and verify it covers all areas with cardholder data',
      'Review facility area classifications and verify CDE areas are identified',
      'Verify physical access controls are documented for each facility area',
      'Interview responsible personnel to confirm understanding of physical security responsibilities',
      'Verify the policy has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.2',
    name: 'Physical Access Controls Manage Entry to Facilities and CDE',
    description:
      'Physical access controls manage entry into facilities and systems containing cardholder data, using appropriate mechanisms such as badge readers, locks, and monitoring systems.',
    category: 'Restrict Physical Access',
    implementationGuidance:
      'Implement physical access controls at all entry points to the CDE and sensitive areas. Use badge readers, biometric scanners, or cipher locks that uniquely identify each individual. Deploy video cameras or other surveillance mechanisms at all entry and exit points and within the CDE. Retain surveillance recordings for at least 90 days. Restrict physical access to publicly accessible network jacks, wireless access points, gateways, and handheld devices. Implement distinct physical access controls for the CDE that are more restrictive than general office access. Review access control logs and surveillance recordings periodically.',
    evidenceRequirements: [
      'Physical access control system deployment documentation for CDE entry points',
      'Video surveillance system coverage documentation and camera placement maps',
      'Surveillance recording retention evidence (minimum 90 days)',
      'Physical access logs for CDE entry points',
      'Evidence of restricted access to network jacks, wireless APs, and handheld devices in the CDE',
    ],
    testProcedures: [
      'Observe physical access controls at CDE entry points and verify they uniquely identify individuals',
      'Examine video surveillance coverage and verify cameras cover all CDE entry/exit points',
      'Verify surveillance recordings are retained for at least 90 days',
      'Review physical access logs and verify they capture entry and exit events',
      'Verify publicly accessible network jacks in the CDE are disabled or restricted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.3',
    name: 'Physical Access for Personnel and Visitors Authorized and Managed',
    description:
      'Physical access for personnel and visitors is authorized and managed, including visitor identification, authorization before entry, and escort requirements.',
    category: 'Restrict Physical Access',
    implementationGuidance:
      'Implement procedures to authorize and manage physical access for personnel and visitors. Issue physical access credentials (badges, tokens, keys) to authorized personnel based on job function. Require visitors to be authorized before entry, escorted at all times in sensitive areas, and identified with a visible badge that distinguishes them from on-site personnel. Maintain a visitor log that records the visitor name, organization, date, time of entry and departure, and the personnel authorizing access. Require visitors to surrender their badges upon departure. Review and revoke physical access for terminated personnel immediately.',
    evidenceRequirements: [
      'Physical access authorization procedures for personnel and visitors',
      'Personnel badge issuance and management records',
      'Visitor log records with name, organization, date, time, and authorizing personnel',
      'Visitor badge management procedures including surrender upon departure',
      'Physical access revocation records for terminated personnel',
    ],
    testProcedures: [
      'Examine visitor management procedures and verify they require authorization, escort, and visible identification',
      'Review visitor logs and verify they contain all required information',
      'Observe visitor entry procedures at a CDE facility and verify they are followed',
      'Verify visitor badges are distinguishable from employee badges',
      'Compare terminated personnel lists against physical access records to verify timely revocation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4',
    name: 'Media with Cardholder Data Securely Stored, Accessed, Distributed, and Destroyed',
    description:
      'Media containing cardholder data (electronic and paper) is securely stored, accessed, distributed, and destroyed when no longer needed for business or legal reasons.',
    category: 'Restrict Physical Access',
    implementationGuidance:
      'Classify all media containing cardholder data as confidential. Store media in a secure, access-controlled location. Implement a media tracking log for all media sent outside the facility, including courier tracking. Obtain management approval before moving media outside the facility. Use secure courier services with tracking capabilities. Destroy media when no longer needed using cross-cut shredding for paper, degaussing or destruction for electronic media. Maintain destruction logs. Periodically inspect and inventory stored media to verify proper handling.',
    evidenceRequirements: [
      'Media classification and handling policy',
      'Secure storage location access controls for media containing CHD',
      'Media distribution and tracking logs for external transfers',
      'Management approval records for media transfers outside the facility',
      'Media destruction logs with method, date, and personnel involved',
    ],
    testProcedures: [
      'Examine the media handling policy and verify it covers classification, storage, distribution, and destruction',
      'Verify media containing CHD is stored in a secure, access-controlled location',
      'Review media tracking logs for external transfers and verify courier tracking was used',
      'Examine management approval records for media sent outside the facility',
      'Review media destruction logs and verify approved destruction methods were used',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.5',
    name: 'Point-of-Interaction Devices Protected from Tampering and Unauthorized Substitution',
    description:
      'Point-of-interaction (POI) devices are protected from tampering and unauthorized substitution by maintaining a device inventory, periodically inspecting devices, and training personnel to detect tampering.',
    category: 'Restrict Physical Access',
    implementationGuidance:
      'Maintain an up-to-date inventory of all POI devices including make, model, serial number, location, and assigned personnel. Periodically inspect POI devices to detect tampering or substitution (look for broken seals, unexpected attachments, changed serial numbers). Inspect devices at least monthly or more frequently based on risk. Train personnel who interact with POI devices to recognize signs of tampering (skimmers, overlays, unusual attachments). Implement tamper-evident seals or security stickers. Establish procedures for reporting and responding to suspected tampering incidents.',
    evidenceRequirements: [
      'POI device inventory listing make, model, serial number, location, and responsible personnel',
      'Periodic device inspection records (at least monthly)',
      'Training records for personnel on POI device tampering recognition',
      'Tamper-evident seal or security sticker deployment records',
      'Incident response procedures for suspected POI device tampering',
    ],
    testProcedures: [
      'Examine the POI device inventory and verify it is current and complete',
      'Review device inspection records and verify inspections occur at least monthly',
      'Interview personnel who interact with POI devices and verify they can identify signs of tampering',
      'Physically inspect a sample of POI devices and verify tamper-evident controls are in place',
      'Review incident response procedures for POI tampering and verify they are actionable',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 10: Log and Monitor All Access to System Components and Cardholder Data
  // ============================================================
  {
    controlId: 'PCI-10.1',
    name: 'Processes and Mechanisms for Logging and Monitoring',
    description:
      'Processes and mechanisms for logging and monitoring all access to system components and cardholder data are defined, documented, and understood.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Establish a logging and monitoring policy that defines which events must be logged, log retention requirements, log review procedures, and response to anomalies. Mandate that all system components in the CDE and connected environment generate audit logs. Deploy centralized log management (SIEM) to collect, correlate, and analyze logs from all in-scope systems. Define roles responsible for log review and incident investigation. Include requirements for log integrity, access controls on logs, and time synchronization across all systems.',
    evidenceRequirements: [
      'Logging and monitoring policy document',
      'List of event types that must be logged for each system component type',
      'SIEM or centralized log management deployment evidence',
      'Roles and responsibilities for log review and monitoring',
      'Annual policy review records',
    ],
    testProcedures: [
      'Examine the logging and monitoring policy and verify it covers all required elements',
      'Verify the policy defines event types that must be logged',
      'Confirm centralized log management is deployed and collecting logs from all in-scope systems',
      'Interview responsible personnel to verify understanding of log review responsibilities',
      'Verify the policy has been reviewed within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2',
    name: 'Audit Logs Record User Activities and System Events',
    description:
      'Audit logs are implemented to support the detection of anomalies and suspicious activity, and the forensic analysis of events, covering all user activities, exceptions, and security events.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Configure all system components to generate audit logs for the following events: all individual user access to cardholder data, all actions taken by anyone with root or administrative privileges, access to all audit trails, invalid logical access attempts, use of and changes to identification and authentication mechanisms, initialization and stopping of audit logs, and creation and deletion of system-level objects. Each log entry must include user identification, event type, date and time, success or failure, origination of event, and identity or name of affected data, system component, or resource.',
    evidenceRequirements: [
      'Logging configuration evidence for all system component types in the CDE',
      'Sample audit log entries demonstrating all required event types are captured',
      'Log entry format documentation showing required fields (user ID, event type, timestamp, success/failure, origin, affected resource)',
      'Evidence that administrative actions are logged with complete detail',
      'Configuration showing invalid access attempts are logged',
    ],
    testProcedures: [
      'Examine logging configurations on a sample of system components and verify required event types are logged',
      'Review sample log entries and verify they contain all required fields',
      'Generate test events (user access, admin action, failed login) and verify they appear in audit logs with correct detail',
      'Verify changes to authentication mechanisms are logged',
      'Verify initialization and stopping of audit logs is logged and generates alerts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.3',
    name: 'Audit Logs Are Protected from Destruction and Unauthorized Modification',
    description:
      'Audit logs are protected from destruction and unauthorized modifications to maintain their integrity for forensic and compliance purposes.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Implement access controls that restrict access to audit logs to only individuals with a job-related need. Protect audit log files from unauthorized modification using techniques such as write-once storage, cryptographic hashing, or centralized immutable log storage. Forward logs promptly to a centralized log management system that is difficult for attackers to compromise. Back up audit trail files to a separate system or media. Monitor for attempts to modify or delete logs and generate alerts. Implement file integrity monitoring (FIM) on audit log files.',
    evidenceRequirements: [
      'Access control configuration restricting log access to authorized personnel only',
      'Log integrity protection mechanism documentation (hashing, WORM storage, immutable storage)',
      'Centralized log management configuration showing log forwarding from all in-scope systems',
      'File integrity monitoring (FIM) configuration for audit log files',
      'Alert configuration for attempted log modification or deletion',
    ],
    testProcedures: [
      'Examine access controls on audit logs and verify only authorized personnel have access',
      'Verify log integrity protections are in place (hash verification, WORM storage, or equivalent)',
      'Attempt to modify or delete a log entry and verify the action is blocked or detected and alerted',
      'Verify logs are forwarded to the centralized log management system promptly',
      'Review FIM reports and verify audit log files are monitored for changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.4',
    name: 'Audit Logs Are Reviewed to Identify Anomalies',
    description:
      'Audit logs are reviewed at least once daily to identify anomalies or suspicious activity, using automated tools and manual review processes.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Implement a daily log review process that combines automated analysis (SIEM correlation rules, anomaly detection) with manual review of flagged events. At minimum, review logs daily for all security events, critical system component logs, and logs from systems performing security functions (firewalls, IDS/IPS, authentication servers). Configure SIEM correlation rules to detect known attack patterns, unusual access patterns, and policy violations. Define escalation procedures for identified anomalies. Document review activities and findings. Use risk-based prioritization to focus manual review on highest-risk events.',
    evidenceRequirements: [
      'Daily log review process documentation',
      'SIEM correlation rules and automated detection configurations',
      'Daily log review records demonstrating consistent execution',
      'Escalation procedure documentation for identified anomalies',
      'Records of anomalies identified, investigated, and resolved',
    ],
    testProcedures: [
      'Examine daily log review records and verify reviews are conducted at least daily',
      'Review SIEM correlation rules and verify they detect known attack patterns and anomalies',
      'Verify automated alerts are generated for critical security events',
      'Review escalation records for identified anomalies and verify timely investigation',
      'Interview personnel responsible for log review and confirm they understand the process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.5',
    name: 'Audit Log History Is Retained and Available for Analysis',
    description:
      'Audit log history is retained for at least 12 months, with at least the most recent three months immediately available for analysis.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Configure log retention policies to retain audit logs for at least 12 months. Ensure the most recent three months of logs are immediately available for analysis without requiring restoration from backup or archive. Archive older logs (months 4-12) in a secure location that can be restored within a reasonable timeframe when needed for investigation. Implement automated log rotation and archival processes. Monitor log storage utilization to prevent log loss due to storage exhaustion. Test log restoration procedures periodically.',
    evidenceRequirements: [
      'Log retention policy specifying minimum 12-month retention',
      'Log storage configuration showing immediate availability of the most recent three months',
      'Log archival configuration for months 4-12',
      'Log storage monitoring and alerting configuration',
      'Log restoration test records',
    ],
    testProcedures: [
      'Verify audit logs from the past 12 months are available',
      'Access logs from the most recent three months and verify they are immediately available for analysis',
      'Request restoration of logs from the 4-12 month range and verify they can be retrieved',
      'Examine log retention configuration and verify it enforces minimum 12-month retention',
      'Review log storage monitoring alerts and verify storage exhaustion is detected',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.6',
    name: 'Time-Synchronization Mechanisms Configured Consistently',
    description:
      'Time-synchronization technology is implemented and kept current to synchronize clocks on all systems within the CDE for accurate event correlation.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Implement NTP (Network Time Protocol) or equivalent time synchronization across all system components in the CDE and connected environments. Designate authoritative time servers (internal NTP servers synchronized to external, trusted time sources). Configure all systems to synchronize to the internal authoritative time servers. Restrict the ability to change time settings on systems to authorized administrators only. Log time setting changes. Monitor for systems that drift beyond acceptable tolerance (typically ±1 second). Document the time synchronization architecture.',
    evidenceRequirements: [
      'Time synchronization architecture documentation',
      'NTP configuration on a sample of system components showing synchronization to authoritative servers',
      'Authoritative time server configuration showing synchronization to trusted external sources',
      'Access controls restricting time setting changes to authorized administrators',
      'Time drift monitoring configuration and alerting',
    ],
    testProcedures: [
      'Examine NTP configurations on a sample of systems and verify they synchronize to authoritative internal servers',
      'Verify internal authoritative time servers synchronize to trusted external time sources',
      'Verify only authorized administrators can change time settings',
      'Check system clocks on a sample of systems and verify they are synchronized within acceptable tolerance',
      'Review time change logs and verify changes are logged and investigated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.7',
    name: 'Failures of Critical Security Control Systems Detected and Responded To',
    description:
      'Failures of critical security control systems are detected, reported, and responded to promptly to prevent gaps in security monitoring.',
    category: 'Log and Monitor All Access',
    implementationGuidance:
      'Implement monitoring to detect failures of critical security control systems including firewalls, IDS/IPS, FIM, anti-malware, physical access controls, logical access controls, audit logging mechanisms, and segmentation controls. Configure automated alerts for security control failures. Define response procedures that include immediate investigation, temporary compensating controls during the outage, root cause analysis, and remediation. Document all security control failures and responses. Establish maximum tolerable downtime for each critical security control and escalation procedures when exceeded.',
    evidenceRequirements: [
      'List of critical security control systems being monitored for failures',
      'Monitoring and alerting configuration for security control failures',
      'Response procedures for security control failures',
      'Security control failure incident records with investigation and resolution details',
      'Maximum tolerable downtime definitions and escalation procedures',
    ],
    testProcedures: [
      'Examine monitoring configurations and verify all critical security controls are monitored for failures',
      'Simulate a security control failure (e.g., stop a test FIM agent) and verify an alert is generated',
      'Review response procedures and verify they include investigation, compensating controls, and remediation',
      'Examine recent security control failure records and verify procedures were followed',
      'Verify escalation procedures are defined and followed when maximum tolerable downtime is exceeded',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 11: Test Security of Systems and Networks Regularly
  // ============================================================
  {
    controlId: 'PCI-11.1',
    name: 'Processes and Mechanisms for Regular Security Testing',
    description:
      'Processes and mechanisms for regularly testing security of systems and networks are defined, documented, and understood by all affected parties.',
    category: 'Test Security Regularly',
    implementationGuidance:
      'Establish a security testing policy that defines the scope, frequency, methodology, and responsibilities for all security testing activities. Include requirements for wireless access point detection, vulnerability scanning, penetration testing, intrusion detection/prevention, and change detection mechanisms. Define qualification requirements for personnel performing security tests. Assign ownership of the security testing program to a specific role. Review the policy annually and update it to reflect changes in the environment or emerging threats.',
    evidenceRequirements: [
      'Security testing policy and procedures document',
      'Testing scope definition covering all in-scope system components and networks',
      'Testing frequency schedule (wireless detection, vulnerability scans, penetration tests)',
      'Qualification requirements for security testing personnel',
      'Annual policy review records',
    ],
    testProcedures: [
      'Examine the security testing policy and verify it covers all required testing activities',
      'Verify testing frequencies meet PCI DSS requirements',
      'Review qualification documentation for security testing personnel',
      'Verify the policy has been reviewed within the last 12 months',
      'Interview responsible personnel to confirm understanding of the security testing program',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.2',
    name: 'Unauthorized Wireless Access Points Detected and Addressed',
    description:
      'Unauthorized wireless access points are detected and identified on a quarterly basis, and identified unauthorized wireless access points are addressed.',
    category: 'Test Security Regularly',
    implementationGuidance:
      'Implement a process to detect unauthorized wireless access points within the CDE and connected facilities at least quarterly. Use wireless scanning tools, wireless IDS/IPS, or NAC solutions to identify unauthorized wireless devices. Scan all locations where cardholder data is stored, processed, or transmitted. Maintain an inventory of authorized wireless access points for comparison. Investigate and remediate all detected unauthorized wireless devices immediately. Document scan results, findings, and remediation actions. Consider deploying a wireless intrusion prevention system (WIPS) for continuous monitoring.',
    evidenceRequirements: [
      'Quarterly wireless scan results for all in-scope locations',
      'Authorized wireless access point inventory for baseline comparison',
      'WIPS or wireless scanning tool deployment and configuration evidence',
      'Remediation records for any unauthorized wireless devices detected',
      'Wireless scanning methodology documentation',
    ],
    testProcedures: [
      'Review the last four quarterly wireless scan results and verify all in-scope locations were scanned',
      'Compare detected wireless devices against the authorized inventory and identify any unauthorized devices',
      'Examine remediation records for previously detected unauthorized devices',
      'Verify the wireless scanning methodology can detect common rogue AP configurations',
      'If WIPS is deployed, verify it is active and alerting on unauthorized devices',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.3',
    name: 'Vulnerabilities Identified by Scanning and Addressed',
    description:
      'Internal and external vulnerabilities are identified and addressed through regular vulnerability scanning, including quarterly internal scans, quarterly external ASV scans, and rescans after significant changes.',
    category: 'Test Security Regularly',
    implementationGuidance:
      'Perform internal vulnerability scans at least quarterly and after any significant change to the environment. Perform external vulnerability scans at least quarterly by a PCI SSC Approved Scanning Vendor (ASV). Achieve passing results on all scans (for ASV scans, no vulnerabilities rated 4.0 or higher by CVSS). Rescan after remediation to verify vulnerabilities have been resolved. Perform authenticated internal scans with sufficient privileges to provide comprehensive coverage. Maintain a scan schedule and track remediation of identified vulnerabilities with defined timelines based on risk ranking.',
    evidenceRequirements: [
      'Quarterly internal vulnerability scan results for the past 12 months',
      'Quarterly external ASV scan results with passing status for the past 12 months',
      'Vulnerability remediation records with timelines and rescan verification',
      'Scan scope documentation covering all in-scope IP addresses and system components',
      'Internal scan tool configuration showing authenticated scanning capabilities',
    ],
    testProcedures: [
      'Review the last four quarterly internal scan reports and verify all in-scope systems were scanned',
      'Review the last four quarterly ASV scan reports and verify passing results',
      'Examine vulnerability remediation records and verify critical/high vulnerabilities were remediated and rescanned',
      'Verify scan scope covers all in-scope IP addresses and system components',
      'Verify internal scans were performed with authenticated scanning for comprehensive coverage',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4',
    name: 'Penetration Testing Performed Regularly',
    description:
      'External and internal penetration testing is regularly performed to identify and address security weaknesses, including network-layer and application-layer testing.',
    category: 'Test Security Regularly',
    implementationGuidance:
      'Perform penetration testing at least annually and after any significant infrastructure or application change. Include both internal and external penetration testing. Test at the network layer and application layer. Test from the perspective of both an external attacker (external pen test) and an insider threat (internal pen test). Test segmentation controls to verify they are operational and effective in isolating the CDE. Use a qualified internal resource or qualified external third party with organizational independence. Remediate identified vulnerabilities and perform retesting to verify remediation. Document the penetration testing methodology based on industry-accepted approaches (e.g., PTES, OWASP Testing Guide).',
    evidenceRequirements: [
      'Annual penetration test report covering internal and external testing',
      'Penetration test methodology documentation based on industry-accepted frameworks',
      'Remediation records for vulnerabilities identified during penetration testing',
      'Retest results verifying remediation of identified vulnerabilities',
      'Segmentation test results verifying CDE isolation effectiveness',
    ],
    testProcedures: [
      'Review the most recent penetration test report and verify it covers both internal and external testing',
      'Verify penetration testing was performed at both the network layer and application layer',
      'Verify the penetration testing methodology is based on an industry-accepted approach',
      'Examine remediation records and verify identified vulnerabilities were addressed and retested',
      'Review segmentation test results and verify CDE isolation is effective',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.5',
    name: 'Network Intrusions and Unexpected File Changes Detected and Responded To',
    description:
      'Network intrusions and unexpected file changes are detected and responded to through intrusion detection/prevention systems and change detection mechanisms.',
    category: 'Test Security Regularly',
    implementationGuidance:
      'Deploy intrusion detection and/or prevention systems (IDS/IPS) to monitor all traffic at the perimeter of the CDE and at critical points within the CDE. Configure IDS/IPS to detect and alert on suspicious network activity. Keep IDS/IPS signatures current. Implement change detection mechanisms (file integrity monitoring - FIM) on critical system files, configuration files, and content files. Configure FIM to perform comparisons at least weekly. Alert personnel to unauthorized modifications and investigate all alerts. Define response procedures for detected intrusions and unauthorized changes.',
    evidenceRequirements: [
      'IDS/IPS deployment architecture showing coverage of CDE perimeter and critical internal points',
      'IDS/IPS configuration and signature update evidence',
      'FIM deployment evidence covering critical system files and configuration files',
      'FIM comparison schedule (at least weekly)',
      'Alert and incident records for detected intrusions and unauthorized file changes',
    ],
    testProcedures: [
      'Examine IDS/IPS deployment and verify coverage of the CDE perimeter and critical internal points',
      'Verify IDS/IPS signatures are current',
      'Generate a test alert by simulating suspicious activity and verify detection and alerting',
      'Examine FIM configurations and verify critical files are monitored with at least weekly comparisons',
      'Review FIM alert records and verify unauthorized changes are investigated and resolved',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.6',
    name: 'Unauthorized Changes on Payment Pages Detected and Responded To',
    description:
      'Unauthorized changes on payment pages are detected and responded to, using change- and tamper-detection mechanisms on HTTP headers and payment page content.',
    category: 'Test Security Regularly',
    implementationGuidance:
      'Implement a change- and tamper-detection mechanism to alert personnel of unauthorized modifications to the HTTP headers and content of payment pages as received by the consumer browser. This includes detecting modifications to the scripts, links, and iframes on the payment page. Configure the mechanism to evaluate the page at least weekly or implement real-time monitoring. Alert on any detected changes and investigate immediately. Use Content Security Policy (CSP) headers, Subresource Integrity (SRI) attributes, and script monitoring solutions. Maintain a baseline of authorized page content and scripts for comparison.',
    evidenceRequirements: [
      'Change and tamper-detection mechanism deployment evidence for all payment pages',
      'Baseline documentation of authorized payment page content, scripts, and HTTP headers',
      'Configuration showing evaluation frequency (at least weekly or real-time)',
      'Alert records for detected unauthorized changes to payment pages',
      'CSP and SRI implementation evidence for payment pages',
    ],
    testProcedures: [
      'Examine the change-detection mechanism and verify it covers all payment pages',
      'Verify the mechanism evaluates payment page content and HTTP headers at least weekly',
      'Introduce a test modification to a payment page and verify the mechanism detects and alerts',
      'Review the authorized baseline and verify it accurately reflects current approved content',
      'Examine CSP headers and SRI attributes on payment pages',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Requirement 12: Support Information Security with Organizational Policies and Programs
  // ============================================================
  {
    controlId: 'PCI-12.1',
    name: 'Comprehensive Information Security Policy',
    description:
      'A comprehensive information security policy that governs and provides direction for protection of the entity\'s information assets is known and current, reviewed annually, and disseminated to all relevant personnel.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Develop and maintain a comprehensive information security policy that establishes the overall security posture, defines the scope of the CDE, and addresses all PCI DSS requirements. The policy must be approved by executive management and reviewed at least annually. Disseminate the policy to all relevant personnel and require written acknowledgment. Ensure the policy addresses the security responsibilities of all personnel. Update the policy when the environment changes (new technologies, organizational changes, regulatory updates). Maintain version control and archive prior versions.',
    evidenceRequirements: [
      'Comprehensive information security policy with executive management approval',
      'Annual policy review records with change log',
      'Policy dissemination records showing distribution to all relevant personnel',
      'Written acknowledgment records from all relevant personnel',
      'Policy version control and archive of prior versions',
    ],
    testProcedures: [
      'Examine the information security policy and verify it addresses all PCI DSS requirements',
      'Verify executive management has approved the current version of the policy',
      'Confirm the policy has been reviewed within the last 12 months',
      'Review dissemination and acknowledgment records for all relevant personnel',
      'Verify the policy addresses responsibilities for all personnel',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.2',
    name: 'Acceptable Use Policies Defined and Implemented',
    description:
      'Acceptable use policies for end-user technologies are defined, documented, and implemented covering technologies such as remote access, wireless, removable media, laptops, tablets, email, and internet usage.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Define acceptable use policies for all end-user technologies that interact with cardholder data or the CDE. Cover remote access technologies, wireless networks, removable electronic media, laptops and tablets, email, and internet usage. Require explicit management approval for use of these technologies. Define permitted and prohibited uses. Require authentication for use of the technology. Require automatic disconnect of remote access sessions after a period of inactivity. Require all personnel to acknowledge the acceptable use policies. Enforce policies through technical controls where possible.',
    evidenceRequirements: [
      'Acceptable use policy document covering all end-user technologies',
      'Management approval requirements for technology use',
      'Technical control configuration enforcing acceptable use (session timeouts, access restrictions)',
      'Personnel acknowledgment records for acceptable use policies',
      'List of approved technologies and their permitted uses',
    ],
    testProcedures: [
      'Examine the acceptable use policy and verify it covers remote access, wireless, removable media, laptops, email, and internet',
      'Verify the policy requires management approval for use of end-user technologies',
      'Examine technical controls enforcing acceptable use (e.g., session timeout configurations)',
      'Review acknowledgment records and verify all personnel have acknowledged the policy',
      'Verify automatic disconnect is configured for inactive remote access sessions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.3',
    name: 'Risk Assessments Performed and Documented',
    description:
      'Risks to the cardholder data environment are formally identified, evaluated, and managed through a risk assessment process performed at least annually and upon significant changes.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Implement a formal risk assessment methodology (e.g., NIST SP 800-30, ISO 27005, OCTAVE, FAIR) that identifies threats and vulnerabilities to the CDE. Perform a comprehensive risk assessment at least annually and upon significant changes to the environment (mergers, acquisitions, new technologies, major business process changes). Identify critical assets, threats, vulnerabilities, and the likelihood and impact of threat exploitation. Document risk treatment decisions (accept, mitigate, transfer, avoid) with management approval. Maintain a risk register and track remediation of identified risks. Present risk assessment results to executive management.',
    evidenceRequirements: [
      'Risk assessment methodology documentation based on an industry framework',
      'Annual risk assessment report with identified risks, ratings, and treatment decisions',
      'Risk register with current status of all identified risks',
      'Executive management review and approval of risk assessment results',
      'Risk reassessment records triggered by significant environmental changes',
    ],
    testProcedures: [
      'Examine the risk assessment methodology and verify it is based on an industry-accepted framework',
      'Review the most recent risk assessment and verify it was performed within the last 12 months',
      'Verify the risk assessment identifies threats, vulnerabilities, likelihood, and impact',
      'Review the risk register and verify risks are tracked with treatment decisions',
      'Verify executive management has reviewed and approved risk assessment results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.4',
    name: 'PCI DSS Compliance Managed by Service Providers',
    description:
      'PCI DSS compliance is managed and validated by service providers, including defined responsibilities, executive management oversight, and regular compliance reviews.',
    category: 'Organizational Policies',
    implementationGuidance:
      'For service providers: establish executive management responsibility for PCI DSS compliance with a designated compliance champion at the executive level. Define a PCI DSS compliance charter that establishes the compliance program scope, objectives, and governance structure. Conduct quarterly reviews of PCI DSS compliance status with executive management. Perform annual PCI DSS scope validation to ensure all data flows and system components are identified. Document and report on the status of all PCI DSS requirements to executive management.',
    evidenceRequirements: [
      'Executive management PCI DSS compliance responsibility assignment',
      'PCI DSS compliance charter with scope, objectives, and governance',
      'Quarterly executive management compliance review records',
      'Annual PCI DSS scope validation documentation',
      'Compliance status reports presented to executive management',
    ],
    testProcedures: [
      'Verify executive management has an assigned PCI DSS compliance responsibility',
      'Examine the PCI DSS compliance charter and verify it defines scope and governance',
      'Review quarterly compliance review records and verify executive management participation',
      'Examine the annual scope validation and verify all system components and data flows are identified',
      'Review compliance status reports and verify they cover all PCI DSS requirements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.5',
    name: 'PCI DSS Scope Documented and Validated',
    description:
      'PCI DSS scope is documented, confirmed, and maintained by identifying all locations and flows of account data, and all system components connected to or that could impact the CDE.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Document and maintain a comprehensive inventory of all system components, people, processes, and technologies that are in scope for PCI DSS. Create and maintain accurate data flow diagrams showing all flows of cardholder data. Identify and document all network connections to and from the CDE. Validate the PCI DSS scope at least annually and upon significant changes by tracing all cardholder data flows and confirming the inventory is complete. For service providers, perform scope validation at least every six months and upon significant changes. Document and communicate scope validation results.',
    evidenceRequirements: [
      'PCI DSS scope documentation including all in-scope system components, people, and processes',
      'Cardholder data flow diagrams showing all data flows',
      'Network connection inventory for the CDE',
      'Annual (or semi-annual for service providers) scope validation records',
      'Scope change documentation triggered by significant environmental changes',
    ],
    testProcedures: [
      'Examine PCI DSS scope documentation and verify it includes all system components, people, and processes',
      'Review data flow diagrams and verify all cardholder data flows are documented',
      'Verify the scope validation was performed within the required timeframe',
      'Trace a sample of cardholder data flows and verify all components in the flow are in scope',
      'Verify scope was revalidated after any significant changes in the past 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.6',
    name: 'Security Awareness Education Program',
    description:
      'Security awareness education is an ongoing activity, with training provided upon hire and at least annually, covering threats, cardholder data handling, and the organization\'s security policies.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Implement a formal security awareness program that educates all personnel upon hire and at least annually thereafter. Training must cover the importance of cardholder data security, their role in protecting cardholder data, applicable company security policies, acceptable use of technologies, and how to recognize and report security threats (phishing, social engineering, suspicious activity). Include current threat landscape information. Tailor training to job functions (e.g., developers receive secure coding training). Track training completion and require acknowledgment. Test comprehension through assessments. Update training content at least annually to address emerging threats.',
    evidenceRequirements: [
      'Security awareness program documentation and training materials',
      'Training completion records for all personnel (upon hire and annual refresher)',
      'Personnel acknowledgment records confirming understanding of security responsibilities',
      'Training content review and update records (at least annual)',
      'Comprehension assessment results',
    ],
    testProcedures: [
      'Examine the security awareness program and verify it covers all required topics',
      'Review training completion records and verify all personnel received training upon hire and within the last 12 months',
      'Verify acknowledgment records exist for all trained personnel',
      'Confirm training content has been updated within the last 12 months',
      'Review comprehension assessment results and verify personnel demonstrate understanding',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.7',
    name: 'Personnel Are Screened to Reduce Risk of Insider Threats',
    description:
      'Personnel are screened prior to hire to reduce the risk of attacks from internal sources, including background checks within local legal constraints.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Conduct background checks on all prospective personnel prior to hire, within the constraints of local laws and regulations. At minimum, include verification of identity, criminal history, employment history, and education. For personnel with access to cardholder data or the CDE, perform more thorough screening. Extend screening requirements to contractors and third-party personnel with access to the CDE. Document the screening criteria for each role based on risk level. Re-screen personnel periodically based on risk level or when roles change to include CDE access. Maintain screening records securely.',
    evidenceRequirements: [
      'Background screening policy document with criteria for each risk level',
      'Background check completion records for personnel hired within the past 12 months',
      'Screening criteria for personnel with CDE access versus general staff',
      'Third-party and contractor screening records',
      'Secure storage of background screening records',
    ],
    testProcedures: [
      'Examine the background screening policy and verify it defines criteria within local legal constraints',
      'Review background check records for a sample of recently hired personnel',
      'Verify enhanced screening is applied to personnel with CDE access',
      'Verify third-party and contractor personnel undergo background screening',
      'Confirm background screening records are stored securely with appropriate access controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.8',
    name: 'Risk to Information Assets from Third-Party Service Provider Relationships Managed',
    description:
      'Risk to information assets associated with third-party service provider (TPSP) relationships is managed through due diligence, contractual requirements, monitoring, and a maintained inventory of all TPSPs.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Maintain a list of all third-party service providers (TPSPs) with which cardholder data is shared or that could affect the security of cardholder data. Perform due diligence before engaging TPSPs, including assessing their PCI DSS compliance status. Establish written agreements that include acknowledgment by the TPSP that they are responsible for the security of cardholder data they possess or that could affect the entity\'s CDE. Implement a process to monitor the PCI DSS compliance status of TPSPs at least annually. Maintain information about which PCI DSS requirements are managed by each TPSP and which are managed by the entity.',
    evidenceRequirements: [
      'Inventory of all TPSPs with description of services provided',
      'Due diligence records for TPSP engagement decisions',
      'Written agreements with TPSPs including security responsibility acknowledgments',
      'Annual TPSP PCI DSS compliance monitoring records',
      'Responsibility matrix showing which PCI DSS requirements are managed by each TPSP',
    ],
    testProcedures: [
      'Examine the TPSP inventory and verify it is current and complete',
      'Review due diligence records for a sample of TPSPs',
      'Examine written agreements and verify they include TPSP responsibility acknowledgments',
      'Verify TPSP compliance status has been monitored within the last 12 months',
      'Review the responsibility matrix and verify it clearly delineates requirements between entity and TPSP',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.9',
    name: 'Third-Party Service Providers Acknowledge PCI DSS Responsibilities',
    description:
      'Third-party service providers (TPSPs) acknowledge in writing to customers that they are responsible for the security of account data they possess or otherwise store, process, or transmit on behalf of the customer.',
    category: 'Organizational Policies',
    implementationGuidance:
      'For entities that are TPSPs: provide written acknowledgments to customers confirming responsibility for the security of account data handled on the customer\'s behalf. Include specifics about which PCI DSS requirements are the TPSP\'s responsibility versus the customer\'s responsibility. Provide evidence of PCI DSS compliance status (AOC, SAQ, or other validation artifacts) to customers upon request. Update acknowledgments when services or responsibilities change. For all entities: obtain and retain these acknowledgments from their TPSPs.',
    evidenceRequirements: [
      'Written TPSP acknowledgment of responsibility for cardholder data security',
      'Responsibility delineation between TPSP and customer for PCI DSS requirements',
      'PCI DSS compliance validation artifacts shared with customers (AOC, SAQ)',
      'Process for updating acknowledgments when services change',
      'Retained acknowledgments from all engaged TPSPs',
    ],
    testProcedures: [
      'Examine written acknowledgments from TPSPs and verify they confirm responsibility for cardholder data security',
      'Verify responsibility delineation is clear and complete',
      'Confirm PCI DSS compliance validation artifacts are available for review',
      'Verify acknowledgments are updated when services or responsibilities change',
      'Review retained acknowledgments and verify all TPSPs are covered',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10',
    name: 'Security Incidents and Suspected Compromises Responded To Immediately',
    description:
      'Suspected and confirmed security incidents that could impact the CDE are responded to immediately through a defined incident response plan that is tested annually.',
    category: 'Organizational Policies',
    implementationGuidance:
      'Develop and implement an incident response plan that addresses roles and responsibilities, communication and notification procedures (including card brand notification), specific incident response procedures for different incident types, business recovery and continuity procedures, data backup processes, legal requirements for reporting compromises, and incident response team contact information. Test the incident response plan at least annually through tabletop exercises or simulations. Train all personnel on their incident response responsibilities. Include procedures for preserving evidence for forensic analysis. Establish relationships with law enforcement and card brands prior to incidents.',
    evidenceRequirements: [
      'Incident response plan covering all required elements',
      'Incident response team contact list and role assignments',
      'Annual incident response plan testing records (tabletop exercise or simulation)',
      'Personnel training records on incident response procedures',
      'Card brand and law enforcement notification procedures with contact information',
    ],
    testProcedures: [
      'Examine the incident response plan and verify it addresses all required elements',
      'Verify the incident response team is identified with current contact information',
      'Review annual testing records and verify the plan was tested within the last 12 months',
      'Interview incident response team members and verify understanding of procedures',
      'Review card brand notification procedures and verify contact information is current',
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 1 - Network Security Controls (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-1.1.1',
    name: 'Formal Process for Network Security Changes',
    description: 'All security policies and operational procedures identified in Requirement 1 are documented, kept up to date, in use, and known to all affected parties.',
    category: 'Network Security Controls',
    implementationGuidance: 'Establish a formal change management process that includes documentation requirements, approval workflows, and communication procedures for all network security changes. Ensure policies are reviewed at least annually and updated as needed.',
    evidenceRequirements: [
      'Network security change management policy and procedures',
      'Evidence of annual policy review and approval',
      'Training records for personnel on network security policies',
      'Change management logs showing approval workflows'
    ],
    testProcedures: [
      'Examine network security policies for completeness and currency',
      'Verify policies are reviewed at least annually',
      'Interview personnel to confirm awareness of policies',
      'Review change logs for proper approval documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.1.2',
    name: 'Network Diagram Accuracy and Currency',
    description: 'Network diagrams are maintained that show all connections between the CDE and other networks, including wireless networks. Diagrams accurately reflect the current network topology.',
    category: 'Network Security Controls',
    implementationGuidance: 'Create and maintain network diagrams using professional diagramming tools. Include all network segments, firewalls, routers, switches, and connection points. Update diagrams within 30 days of any network change.',
    evidenceRequirements: [
      'Current network diagrams showing all CDE connections',
      'Diagram revision history and change tracking',
      'Process documentation for diagram updates',
      'Wireless network topology documentation'
    ],
    testProcedures: [
      'Compare network diagrams against actual network topology',
      'Verify all CDE connections are documented',
      'Review diagram update process and recent changes',
      'Confirm wireless networks are accurately depicted'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.1.3',
    name: 'Data Flow Diagram Maintenance',
    description: 'Current data flow diagrams are maintained that show all cardholder data flows across systems and networks, identifying all locations where cardholder data is transmitted, processed, or stored.',
    category: 'Network Security Controls',
    implementationGuidance: 'Document all cardholder data flows from point of entry through storage and disposal. Include all systems, applications, and transmission methods. Update diagrams when data flows change.',
    evidenceRequirements: [
      'Current data flow diagrams for all cardholder data',
      'Inventory of all CHD storage locations',
      'Documentation of data transmission methods',
      'Process for updating data flow documentation'
    ],
    testProcedures: [
      'Review data flow diagrams for completeness',
      'Verify all CHD storage locations are identified',
      'Trace sample data flows against documentation',
      'Confirm diagrams reflect current data handling practices'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.1',
    name: 'Inbound Traffic Restriction Configuration',
    description: 'Inbound traffic to the CDE is restricted to only traffic that is necessary, and all other traffic is specifically denied.',
    category: 'Network Security Controls',
    implementationGuidance: 'Configure firewalls with explicit deny-all rules as the default, then add specific allow rules for required business traffic. Document business justification for each allowed connection.',
    evidenceRequirements: [
      'Firewall rule configurations with deny-all default',
      'Business justification for each allow rule',
      'Network traffic analysis reports',
      'Rule review and approval documentation'
    ],
    testProcedures: [
      'Examine firewall configurations for deny-all default',
      'Verify each allow rule has documented business justification',
      'Test that unauthorized traffic is blocked',
      'Review traffic logs for policy violations'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.2',
    name: 'Outbound Traffic Restriction Configuration',
    description: 'Outbound traffic from the CDE is restricted to only traffic that is necessary, and all other traffic is specifically denied.',
    category: 'Network Security Controls',
    implementationGuidance: 'Implement egress filtering on all CDE network segments. Allow only necessary outbound connections with documented business justification. Monitor for unauthorized outbound traffic.',
    evidenceRequirements: [
      'Egress filtering rules and configurations',
      'Business justification for outbound connections',
      'Outbound traffic monitoring reports',
      'Unauthorized connection attempt logs'
    ],
    testProcedures: [
      'Examine egress filtering configurations',
      'Verify outbound rules match documented business needs',
      'Test that unauthorized outbound traffic is blocked',
      'Review monitoring for suspicious outbound activity'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.3',
    name: 'NSC Configuration Between Wireless and CDE',
    description: 'Network security controls are implemented between all wireless networks and the CDE, regardless of whether the wireless network is a CDE component.',
    category: 'Network Security Controls',
    implementationGuidance: 'Deploy firewalls or equivalent controls between all wireless segments and the CDE. Treat wireless networks as untrusted by default and apply appropriate segmentation.',
    evidenceRequirements: [
      'Network diagrams showing wireless segmentation',
      'Firewall rules between wireless and CDE',
      'Wireless network security configurations',
      'Segmentation validation test results'
    ],
    testProcedures: [
      'Verify NSCs exist between wireless and CDE',
      'Examine firewall rules for appropriate restrictions',
      'Test wireless-to-CDE segmentation effectiveness',
      'Review wireless security configurations'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.4',
    name: 'Accurate Inventory of Trusted Connections',
    description: 'An accurate inventory is maintained of all trusted connections to the CDE, including third-party connections and business justifications.',
    category: 'Network Security Controls',
    implementationGuidance: 'Create and maintain a comprehensive inventory of all connections to the CDE. Include connection owner, purpose, protocols used, and review dates. Review inventory quarterly.',
    evidenceRequirements: [
      'Inventory of all CDE connections with details',
      'Business justification for each connection',
      'Quarterly inventory review documentation',
      'Third-party connection agreements'
    ],
    testProcedures: [
      'Review connection inventory for completeness',
      'Verify business justification for each connection',
      'Confirm quarterly reviews are performed',
      'Compare inventory against actual network connections'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.5',
    name: 'Security Control Review for Allowed Services',
    description: 'All services, protocols, and ports allowed are identified, approved, and have a defined business need with security features documented.',
    category: 'Network Security Controls',
    implementationGuidance: 'Document all allowed services with business justification. For insecure protocols, document compensating security measures. Review allowed services at least annually.',
    evidenceRequirements: [
      'Inventory of allowed services, protocols, and ports',
      'Business justification documentation',
      'Security measures for insecure protocols',
      'Annual review and approval records'
    ],
    testProcedures: [
      'Review inventory of allowed services',
      'Verify business need for each allowed service',
      'Examine security measures for insecure protocols',
      'Confirm annual review process'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.6',
    name: 'Security Features for Insecure Services',
    description: 'Security features are defined and implemented for all services, protocols, and ports that are in use and considered to be insecure.',
    category: 'Network Security Controls',
    implementationGuidance: 'Identify all insecure services in use and implement compensating security controls. Document risk acceptance for any insecure services that cannot be secured or replaced.',
    evidenceRequirements: [
      'List of insecure services in use',
      'Compensating security controls documentation',
      'Risk acceptance documentation if applicable',
      'Migration plans for insecure services'
    ],
    testProcedures: [
      'Identify insecure services in the environment',
      'Verify compensating controls are implemented',
      'Review risk acceptance documentation',
      'Examine migration plans for insecure services'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.7',
    name: 'NSC Configuration Review Frequency',
    description: 'Configurations of NSCs are reviewed at least every six months to confirm they are relevant and effective.',
    category: 'Network Security Controls',
    implementationGuidance: 'Establish a semi-annual review process for all network security control configurations. Document review findings, remediation actions, and approvals.',
    evidenceRequirements: [
      'Semi-annual NSC configuration review schedule',
      'Review findings and remediation documentation',
      'Management approval of configurations',
      'Evidence of configuration changes based on reviews'
    ],
    testProcedures: [
      'Verify semi-annual reviews are scheduled and performed',
      'Examine review documentation for thoroughness',
      'Confirm remediation of identified issues',
      'Review management approval records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.2.8',
    name: 'NSC Configuration Files Secured',
    description: 'Configuration files for NSCs are secured from unauthorized access and kept consistent with active network configurations.',
    category: 'Network Security Controls',
    implementationGuidance: 'Store NSC configuration files in secure locations with access controls. Implement file integrity monitoring and version control. Regularly compare running configs against stored files.',
    evidenceRequirements: [
      'Secure storage location for configuration files',
      'Access control lists for configuration files',
      'File integrity monitoring configuration',
      'Configuration comparison reports'
    ],
    testProcedures: [
      'Verify secure storage of configuration files',
      'Examine access controls on configuration files',
      'Review file integrity monitoring alerts',
      'Compare stored configs against running configs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.3.1',
    name: 'Inbound Traffic to CDE Restricted',
    description: 'Inbound traffic to the CDE is restricted to only traffic necessary for the CDE. All other traffic is specifically denied.',
    category: 'Network Security Controls',
    implementationGuidance: 'Implement strict inbound filtering at all CDE entry points. Use allowlists for permitted traffic sources and destinations. Log and alert on denied traffic attempts.',
    evidenceRequirements: [
      'Inbound traffic filtering rules',
      'Allowlist documentation with business justification',
      'Denied traffic logs and alerts',
      'Traffic analysis reports'
    ],
    testProcedures: [
      'Examine inbound filtering configurations',
      'Test that only authorized traffic is permitted',
      'Review denied traffic logs',
      'Verify alerting on unauthorized attempts'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.3.2',
    name: 'Outbound Traffic from CDE Restricted',
    description: 'Outbound traffic from the CDE is restricted to only traffic necessary. All other traffic is specifically denied.',
    category: 'Network Security Controls',
    implementationGuidance: 'Implement strict egress filtering from all CDE segments. Document and approve all outbound connections. Monitor for data exfiltration attempts.',
    evidenceRequirements: [
      'Egress filtering configurations',
      'Approved outbound connections list',
      'Data exfiltration monitoring reports',
      'Outbound traffic analysis documentation'
    ],
    testProcedures: [
      'Examine egress filtering rules',
      'Verify outbound traffic matches approved list',
      'Test that unauthorized outbound traffic is blocked',
      'Review data exfiltration monitoring'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.3.3',
    name: 'NSCs Between Wireless and CDE',
    description: 'NSCs are installed between all wireless networks and the cardholder data environment.',
    category: 'Network Security Controls',
    implementationGuidance: 'Deploy dedicated network security controls between every wireless network segment and the CDE. Configure controls to deny all traffic by default.',
    evidenceRequirements: [
      'Network diagrams showing wireless segmentation',
      'NSC configurations for wireless segments',
      'Segmentation test results',
      'Wireless access policies'
    ],
    testProcedures: [
      'Verify NSCs exist between wireless and CDE',
      'Examine NSC configurations',
      'Perform segmentation testing',
      'Review wireless access policies'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.4.1',
    name: 'NSCs Between Trusted and Untrusted Networks',
    description: 'NSCs are implemented between trusted and untrusted networks.',
    category: 'Network Security Controls',
    implementationGuidance: 'Define trust zones and implement appropriate security controls at each boundary. Ensure all traffic between zones passes through NSCs.',
    evidenceRequirements: [
      'Trust zone definitions and documentation',
      'NSC placement diagrams',
      'Boundary security configurations',
      'Traffic flow documentation'
    ],
    testProcedures: [
      'Review trust zone definitions',
      'Verify NSC placement at boundaries',
      'Examine boundary security configurations',
      'Test traffic flow through NSCs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.4.2',
    name: 'Inbound Traffic Filtering to Untrusted Networks',
    description: 'Inbound traffic from untrusted networks to trusted networks is restricted to communications with system components that are authorized to provide publicly accessible services.',
    category: 'Network Security Controls',
    implementationGuidance: 'Allow inbound traffic only to authorized DMZ services. Implement application-aware filtering where possible. Monitor and log all inbound connection attempts.',
    evidenceRequirements: [
      'DMZ architecture documentation',
      'Authorized public service inventory',
      'Inbound filtering rules',
      'Connection attempt logs'
    ],
    testProcedures: [
      'Review DMZ architecture',
      'Verify authorized public services',
      'Examine inbound filtering configurations',
      'Review connection logs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.4.3',
    name: 'Anti-Spoofing Measures Implemented',
    description: 'Anti-spoofing measures are implemented to detect and block forged source IP addresses from entering the trusted network.',
    category: 'Network Security Controls',
    implementationGuidance: 'Configure ingress and egress filtering on all boundary devices. Implement BCP 38/RFC 2827 anti-spoofing measures. Enable spoofing detection and logging.',
    evidenceRequirements: [
      'Anti-spoofing configurations on boundary devices',
      'Ingress and egress filtering rules',
      'Spoofing detection logs',
      'BCP 38 compliance documentation'
    ],
    testProcedures: [
      'Examine anti-spoofing configurations',
      'Verify ingress/egress filtering',
      'Review spoofing detection logs',
      'Test anti-spoofing effectiveness'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.4.4',
    name: 'CDE Not Directly Accessible from Untrusted Networks',
    description: 'System components that store cardholder data are not directly accessible from untrusted networks.',
    category: 'Network Security Controls',
    implementationGuidance: 'Place all CHD storage systems in protected network segments with no direct untrusted network access. Use jump servers or bastion hosts for administrative access.',
    evidenceRequirements: [
      'Network diagrams showing CHD storage placement',
      'Segmentation configurations',
      'Jump server/bastion host documentation',
      'Access path documentation'
    ],
    testProcedures: [
      'Review CHD storage system placement',
      'Verify no direct untrusted network access',
      'Examine segmentation effectiveness',
      'Test access paths to CHD systems'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.4.5',
    name: 'Disclosure of Internal IP Addresses Prevented',
    description: 'The disclosure of internal IP addresses and routing information is limited to only authorized parties.',
    category: 'Network Security Controls',
    implementationGuidance: 'Implement NAT or proxy services to hide internal IP addresses. Configure systems to prevent IP address disclosure in headers, errors, or logs visible externally.',
    evidenceRequirements: [
      'NAT/proxy configurations',
      'Application configurations preventing IP disclosure',
      'External-facing system hardening documentation',
      'Penetration test results related to IP disclosure'
    ],
    testProcedures: [
      'Examine NAT/proxy configurations',
      'Test for IP address disclosure vulnerabilities',
      'Review application configurations',
      'Verify external systems do not reveal internal IPs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-1.5.1',
    name: 'Security Controls on Computing Devices Outside CDE',
    description: 'Security controls are implemented on any computing devices that connect to both untrusted networks and the CDE.',
    category: 'Network Security Controls',
    implementationGuidance: 'Deploy endpoint protection, personal firewalls, and security software on all devices connecting to both untrusted networks and CDE. Enforce security policies through mobile device management.',
    evidenceRequirements: [
      'Endpoint protection deployment records',
      'Personal firewall configurations',
      'Mobile device management policies',
      'Device compliance reports'
    ],
    testProcedures: [
      'Verify endpoint protection on dual-homed devices',
      'Examine personal firewall configurations',
      'Review MDM policy enforcement',
      'Check device compliance status'
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 2 - Secure Configurations (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-2.1.1',
    name: 'Vendor Default Accounts Management',
    description: 'All vendor-supplied default accounts are removed or disabled before a system is installed on the network, or default passwords are changed.',
    category: 'Secure Configurations',
    implementationGuidance: 'Create a checklist of all vendor default accounts for each system type. Remove or disable unnecessary default accounts. Change passwords for required default accounts using strong password requirements.',
    evidenceRequirements: [
      'Default account removal/change procedures',
      'System hardening checklists',
      'Configuration audit reports showing default accounts addressed',
      'Password change records for retained default accounts'
    ],
    testProcedures: [
      'Review system configurations for default accounts',
      'Attempt authentication with known default credentials',
      'Verify default account handling procedures are followed',
      'Check password policy compliance for retained accounts'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.1.2',
    name: 'Primary Functions Require Different Security Levels',
    description: 'Primary functions requiring different security levels are managed as follows: Only one primary function exists on a system component, OR Primary functions with differing security levels are isolated.',
    category: 'Secure Configurations',
    implementationGuidance: 'Implement single-function servers where possible. When co-location is necessary, use virtualization, containers, or other isolation technologies. Document security boundaries between functions.',
    evidenceRequirements: [
      'System function inventory documentation',
      'Isolation technology configurations',
      'Security boundary documentation',
      'Risk assessments for co-located functions'
    ],
    testProcedures: [
      'Review system inventories for function co-location',
      'Verify isolation between co-located functions',
      'Examine security boundary effectiveness',
      'Review risk assessments for co-location decisions'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.1',
    name: 'Configuration Standards for System Components',
    description: 'Configuration standards are developed, implemented, and maintained for all system components that are consistent with industry-accepted hardening standards.',
    category: 'Secure Configurations',
    implementationGuidance: 'Develop configuration standards based on CIS Benchmarks, DISA STIGs, or vendor hardening guides. Include all system types in the CDE. Review and update standards annually.',
    evidenceRequirements: [
      'Configuration standard documents for each system type',
      'Industry hardening standard references (CIS, DISA)',
      'Standard review and update records',
      'Configuration compliance reports'
    ],
    testProcedures: [
      'Compare configuration standards against industry benchmarks',
      'Verify standards exist for all system types',
      'Review annual update process',
      'Examine compliance assessment results'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.2',
    name: 'Vendor Default Accounts Managed',
    description: 'Vendor default accounts are managed as follows: If used, default passwords are changed. If not used, the account is removed or disabled.',
    category: 'Secure Configurations',
    implementationGuidance: 'Inventory all vendor default accounts across all systems. Implement automated scanning for default credentials. Enforce password changes or account removal during system deployment.',
    evidenceRequirements: [
      'Vendor default account inventory',
      'Automated credential scanning reports',
      'Account removal/password change procedures',
      'Deployment checklist with default account handling'
    ],
    testProcedures: [
      'Scan systems for known default credentials',
      'Review account inventories for default accounts',
      'Verify removal or password change procedures',
      'Test authentication with default credentials'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.3',
    name: 'Primary Functions Isolated',
    description: 'If primary functions requiring different security levels exist on the same system component, functions are isolated or implemented to provide the appropriate level of security.',
    category: 'Secure Configurations',
    implementationGuidance: 'Use virtualization, containerization, or logical separation for co-located functions. Implement separate authentication and access controls for each function. Monitor cross-function access.',
    evidenceRequirements: [
      'Function isolation architecture documentation',
      'Virtualization/container configurations',
      'Access control configurations per function',
      'Cross-function access monitoring logs'
    ],
    testProcedures: [
      'Verify isolation between functions',
      'Test cross-function access restrictions',
      'Review access control configurations',
      'Examine monitoring for unauthorized cross-access'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.4',
    name: 'Only Necessary Services Enabled',
    description: 'Only necessary services, protocols, daemons, and functions are enabled, and all unnecessary functionality is removed or disabled.',
    category: 'Secure Configurations',
    implementationGuidance: 'Establish baseline configurations with minimal services. Document business justification for each enabled service. Implement automated compliance checking for unnecessary services.',
    evidenceRequirements: [
      'Approved service baseline for each system type',
      'Business justification for enabled services',
      'Service compliance scan results',
      'Removal procedures for unnecessary services'
    ],
    testProcedures: [
      'Compare running services against approved baselines',
      'Verify business justification for enabled services',
      'Review compliance scan results',
      'Test for presence of unnecessary services'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.5',
    name: 'Insecure Services Secured',
    description: 'If any insecure services, protocols, or daemons are present, business justification is documented and additional security features are implemented.',
    category: 'Secure Configurations',
    implementationGuidance: 'Document all insecure services with business justification. Implement compensating controls such as encryption wrappers, network segmentation, or enhanced monitoring. Plan migration to secure alternatives.',
    evidenceRequirements: [
      'Inventory of insecure services with justification',
      'Compensating control documentation',
      'Enhanced monitoring configurations',
      'Migration plans to secure alternatives'
    ],
    testProcedures: [
      'Review inventory of insecure services',
      'Verify compensating controls effectiveness',
      'Examine enhanced monitoring implementation',
      'Review migration timeline and progress'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.6',
    name: 'System Security Parameters Configured',
    description: 'System security parameters are configured to prevent misuse.',
    category: 'Secure Configurations',
    implementationGuidance: 'Configure security parameters according to hardening standards. Include password policies, audit settings, network parameters, and access controls. Validate configurations during deployment.',
    evidenceRequirements: [
      'Security parameter configuration standards',
      'System configuration exports showing parameter settings',
      'Configuration validation reports',
      'Deployment verification checklists'
    ],
    testProcedures: [
      'Review security parameter settings',
      'Compare configurations against standards',
      'Verify deployment validation process',
      'Test parameter enforcement effectiveness'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.2.7',
    name: 'Non-Console Administrative Access Encrypted',
    description: 'All non-console administrative access is encrypted using strong cryptography.',
    category: 'Secure Configurations',
    implementationGuidance: 'Require SSH, HTTPS, or other encrypted protocols for all remote administration. Disable unencrypted protocols (telnet, HTTP, rlogin). Implement certificate-based authentication where possible.',
    evidenceRequirements: [
      'Administrative access protocol standards',
      'System configurations showing encrypted protocols only',
      'Network captures demonstrating encryption',
      'Certificate management documentation'
    ],
    testProcedures: [
      'Attempt connections using unencrypted protocols',
      'Verify encrypted protocol configurations',
      'Capture and verify encryption of admin traffic',
      'Review certificate implementations'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.3.1',
    name: 'Wireless Vendor Defaults Changed',
    description: 'For wireless environments connected to the CDE or transmitting account data, all wireless vendor defaults are changed at installation.',
    category: 'Secure Configurations',
    implementationGuidance: 'Change all default SSIDs, encryption keys, passwords, and SNMP community strings. Disable unnecessary wireless management interfaces. Update firmware before deployment.',
    evidenceRequirements: [
      'Wireless deployment checklists',
      'Configuration exports showing non-default settings',
      'SNMP community string change records',
      'Firmware update documentation'
    ],
    testProcedures: [
      'Attempt authentication with known defaults',
      'Verify SSID and encryption key changes',
      'Review SNMP community strings',
      'Check firmware versions'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-2.3.2',
    name: 'Wireless Encryption Keys Changed',
    description: 'For wireless environments connected to the CDE or transmitting account data, wireless encryption keys are changed when personnel with knowledge of the keys leave or change roles.',
    category: 'Secure Configurations',
    implementationGuidance: 'Implement procedures for key rotation upon personnel changes. Use enterprise wireless authentication (802.1X) to minimize key exposure. Document key holders and rotation events.',
    evidenceRequirements: [
      'Key rotation procedures documentation',
      'Key holder inventory',
      'Key change logs correlated with personnel changes',
      'Enterprise authentication configurations'
    ],
    testProcedures: [
      'Review key rotation procedures',
      'Verify key changes following personnel departures',
      'Examine key holder documentation',
      'Test enterprise authentication implementation'
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 3 - Protect Stored Account Data (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-3.1.1',
    name: 'Data Retention Policy Implementation',
    description: 'All policies and procedures for protecting stored account data are documented, kept up to date, in use, and known to all affected parties.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Develop comprehensive data retention policies specifying storage duration, disposal methods, and legal requirements. Communicate policies to all personnel handling account data.',
    evidenceRequirements: [
      'Data retention policy documentation',
      'Policy review and approval records',
      'Personnel training records on data handling',
      'Policy distribution acknowledgments'
    ],
    testProcedures: [
      'Review data retention policies for completeness',
      'Verify policies are current and approved',
      'Interview personnel on policy awareness',
      'Examine training documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.1.2',
    name: 'Data Storage Amount Minimized',
    description: 'Storage of account data is kept to a minimum through implementation of data retention and disposal policies and procedures.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement automated data purging based on retention schedules. Regularly audit storage locations for unauthorized data retention. Document business justification for stored data.',
    evidenceRequirements: [
      'Data retention schedule documentation',
      'Automated purging configuration records',
      'Storage audit reports',
      'Business justification for retained data'
    ],
    testProcedures: [
      'Review retention schedules for appropriateness',
      'Verify automated purging is functioning',
      'Examine storage audit findings',
      'Confirm business need for retained data'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.2.1',
    name: 'Sensitive Authentication Data Not Stored After Authorization',
    description: 'Account data storage is kept to a minimum. Sensitive authentication data (SAD) is not stored after authorization.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Configure systems to prevent storage of full track data, CAV2/CVC2/CVV2/CID, and PINs after authorization. Implement automated checks to detect unauthorized SAD storage.',
    evidenceRequirements: [
      'System configurations preventing SAD storage',
      'Automated SAD detection scan results',
      'Development standards prohibiting SAD storage',
      'Code review records for SAD compliance'
    ],
    testProcedures: [
      'Verify systems do not store SAD after authorization',
      'Run SAD detection scans across storage',
      'Review development standards',
      'Examine code review procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.3.1',
    name: 'SAD Not Stored After Authorization Even If Encrypted',
    description: 'Sensitive authentication data (SAD) is not retained after authorization, even if encrypted.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement immediate deletion of SAD upon authorization completion. Configure applications to clear SAD from memory and temporary storage. Audit all data stores for SAD.',
    evidenceRequirements: [
      'Application configurations for SAD handling',
      'Memory clearing procedures documentation',
      'Audit reports for SAD in storage',
      'Transaction flow documentation showing SAD handling'
    ],
    testProcedures: [
      'Trace transaction flows for SAD handling',
      'Verify SAD is cleared from memory',
      'Review audit reports for SAD findings',
      'Test application behavior post-authorization'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.3.2',
    name: 'SAD Storage Before Authorization Encrypted',
    description: 'SAD that is stored electronically prior to completion of authorization is encrypted using strong cryptography.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement strong encryption for any temporary SAD storage during authorization. Use approved cryptographic algorithms. Ensure encryption keys are properly managed.',
    evidenceRequirements: [
      'Encryption configurations for temporary SAD storage',
      'Cryptographic algorithm documentation',
      'Key management procedures',
      'Pre-authorization data flow documentation'
    ],
    testProcedures: [
      'Verify encryption of temporary SAD storage',
      'Review cryptographic algorithms used',
      'Examine key management practices',
      'Trace pre-authorization data flows'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.3.3',
    name: 'SAD Storage Before Authorization for Issuers',
    description: 'Additional requirement for issuers: SAD is stored only with appropriate business justification and encrypted with strong cryptography.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Document business justification for issuer SAD storage. Implement strong encryption and access controls. Limit storage duration to minimum necessary.',
    evidenceRequirements: [
      'Business justification for SAD storage',
      'Encryption configuration documentation',
      'Access control configurations',
      'Storage duration policies'
    ],
    testProcedures: [
      'Review business justification documentation',
      'Verify encryption implementation',
      'Examine access controls',
      'Confirm storage duration compliance'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.4.1',
    name: 'PAN Masked When Displayed',
    description: 'PAN is masked when displayed, such that only personnel with a legitimate business need can see more than the first six/last four digits of the PAN.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement PAN masking in all applications displaying card data. Configure masking to show only first six and last four digits. Establish role-based access for full PAN viewing.',
    evidenceRequirements: [
      'Application masking configurations',
      'Role definitions for full PAN access',
      'Screenshots demonstrating masking',
      'Access control documentation'
    ],
    testProcedures: [
      'Verify PAN masking in application displays',
      'Test role-based access to full PAN',
      'Review application configurations',
      'Examine access control effectiveness'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.4.2',
    name: 'Technical Controls for PAN Masking',
    description: 'When PAN is displayed, technical controls are in place to ensure only those with a documented business need can see more than the first six and last four digits.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement technical controls enforcing masking rules. Create documented roles with full PAN access justification. Log all full PAN access events.',
    evidenceRequirements: [
      'Technical control configurations',
      'Documented business need justifications',
      'Full PAN access logs',
      'Role-based access control documentation'
    ],
    testProcedures: [
      'Test technical control enforcement',
      'Review business need justifications',
      'Examine access logs',
      'Verify role-based controls'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.5.1',
    name: 'PAN Rendered Unreadable Anywhere Stored',
    description: 'PAN is rendered unreadable anywhere it is stored using one-way hashes, truncation, index tokens, or strong cryptography.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement encryption, tokenization, or hashing for all stored PAN. Use approved cryptographic algorithms. Document the method used for each storage location.',
    evidenceRequirements: [
      'Encryption/tokenization configurations',
      'Cryptographic algorithm documentation',
      'Storage location inventory with protection methods',
      'Key management documentation'
    ],
    testProcedures: [
      'Verify PAN protection at each storage location',
      'Review cryptographic algorithms',
      'Examine storage inventory',
      'Test key management procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.5.1.1',
    name: 'Hashes for PAN Protection',
    description: 'If hashing is used to render PAN unreadable, the hash is a keyed cryptographic hash with appropriate key management.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Use keyed HMAC or similar keyed hash functions. Implement proper key management including generation, storage, rotation, and destruction. Document hash algorithm selection.',
    evidenceRequirements: [
      'Hash algorithm configuration documentation',
      'Key management procedures for hash keys',
      'Hash key inventory and rotation records',
      'Algorithm selection justification'
    ],
    testProcedures: [
      'Verify keyed hash implementation',
      'Review key management procedures',
      'Examine key rotation records',
      'Test hash function configuration'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.5.1.2',
    name: 'Disk-Level Encryption for Removable Media',
    description: 'If disk-level or partition-level encryption is used to render PAN unreadable, it is implemented only on removable electronic media.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement full disk encryption on all removable media. Use file-level or database-level encryption for fixed storage. Document encryption approach for each storage type.',
    evidenceRequirements: [
      'Removable media encryption configurations',
      'Fixed storage encryption documentation',
      'Encryption method inventory by storage type',
      'Key management for disk encryption'
    ],
    testProcedures: [
      'Verify disk encryption on removable media',
      'Review fixed storage encryption methods',
      'Examine encryption inventory',
      'Test key management procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.5.1.3',
    name: 'Disk Encryption Authentication Independent of OS',
    description: 'If disk-level encryption is used, logical access is managed separately and independently of native operating system authentication mechanisms.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement pre-boot authentication for disk encryption separate from OS login. Use dedicated encryption key management independent of OS credentials.',
    evidenceRequirements: [
      'Pre-boot authentication configurations',
      'Independent key management documentation',
      'Encryption authentication separation evidence',
      'Access control architecture documentation'
    ],
    testProcedures: [
      'Verify pre-boot authentication independence',
      'Test key management separation from OS',
      'Review authentication architecture',
      'Examine access control implementation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.6.1',
    name: 'Cryptographic Key Management Procedures',
    description: 'Procedures are defined and implemented to protect cryptographic keys used to protect stored account data against disclosure and misuse.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Develop comprehensive key management procedures covering generation, distribution, storage, rotation, and destruction. Implement hardware security modules where appropriate.',
    evidenceRequirements: [
      'Key management policy and procedures',
      'HSM configuration documentation',
      'Key lifecycle documentation',
      'Personnel training records on key management'
    ],
    testProcedures: [
      'Review key management procedures',
      'Examine HSM configurations',
      'Verify key lifecycle compliance',
      'Interview key custodians'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.6.1.1',
    name: 'Service Provider Key Management for Customers',
    description: 'Additional requirement for service providers: A documented description of the cryptographic architecture is maintained.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Document complete cryptographic architecture including algorithms, key lengths, key custodians, and key management procedures. Make documentation available to customers upon request.',
    evidenceRequirements: [
      'Cryptographic architecture documentation',
      'Customer-facing key management documentation',
      'Key custodian assignments',
      'Customer communication records'
    ],
    testProcedures: [
      'Review cryptographic architecture documentation',
      'Verify customer documentation availability',
      'Examine key custodian records',
      'Review customer communications'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.6.1.2',
    name: 'Strong Cryptographic Key Generation',
    description: 'Cryptographic keys are generated using strong random number generators or approved key generation methods.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Use FIPS 140-2 validated random number generators. Implement key generation in secure environments. Document key generation procedures and entropy sources.',
    evidenceRequirements: [
      'Random number generator documentation',
      'FIPS 140-2 validation certificates',
      'Key generation procedure documentation',
      'Entropy source documentation'
    ],
    testProcedures: [
      'Verify RNG validation status',
      'Review key generation procedures',
      'Examine entropy sources',
      'Test key generation environment security'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.6.1.3',
    name: 'Secure Cryptographic Key Distribution',
    description: 'Cryptographic keys are distributed securely, and key distribution is limited to authorized custodians.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement secure key distribution channels such as split knowledge or key transport encryption. Maintain authorized key custodian lists. Log all key distribution events.',
    evidenceRequirements: [
      'Key distribution procedure documentation',
      'Authorized custodian lists',
      'Key distribution logs',
      'Secure channel configurations'
    ],
    testProcedures: [
      'Review key distribution procedures',
      'Verify authorized custodian lists',
      'Examine distribution logs',
      'Test secure channel implementation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.6.1.4',
    name: 'Secure Cryptographic Key Storage',
    description: 'Cryptographic keys are stored securely with access limited to the fewest number of custodians necessary.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Store keys in HSMs or encrypted key stores. Implement dual control for key access. Minimize number of key custodians and document justification.',
    evidenceRequirements: [
      'Key storage configuration documentation',
      'Dual control implementation evidence',
      'Key custodian justification documentation',
      'Key access logs'
    ],
    testProcedures: [
      'Verify secure key storage implementation',
      'Test dual control procedures',
      'Review custodian justifications',
      'Examine key access logs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.1',
    name: 'Key Management Policy Documentation',
    description: 'Key management policies and procedures are implemented and documented for cryptographic keys used to protect stored account data.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Create comprehensive key management policies covering the full key lifecycle. Include responsibilities, procedures, and compliance requirements. Review policies annually.',
    evidenceRequirements: [
      'Key management policy document',
      'Annual policy review records',
      'Responsibility assignments',
      'Compliance requirement documentation'
    ],
    testProcedures: [
      'Review key management policies',
      'Verify annual review completion',
      'Examine responsibility assignments',
      'Confirm compliance requirements'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.2',
    name: 'Cryptoperiod Defined for Each Key Type',
    description: 'Cryptoperiods are defined for each key type in use and based on industry best practices and guidelines.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Define cryptoperiods based on NIST SP 800-57 guidelines. Document rationale for each key type cryptoperiod. Implement automated key rotation where possible.',
    evidenceRequirements: [
      'Cryptoperiod definitions by key type',
      'Industry guideline references (NIST)',
      'Automated rotation configurations',
      'Cryptoperiod rationale documentation'
    ],
    testProcedures: [
      'Review cryptoperiod definitions',
      'Verify alignment with industry guidelines',
      'Test automated rotation',
      'Examine rationale documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.3',
    name: 'Key Retirement and Replacement',
    description: 'Procedures are defined and implemented to retire and replace keys that have reached the end of their defined cryptoperiod.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement key retirement workflows triggered by cryptoperiod expiration. Ensure seamless key replacement without service disruption. Archive retired keys securely if needed.',
    evidenceRequirements: [
      'Key retirement procedures',
      'Key replacement workflows',
      'Retired key archive documentation',
      'Service continuity plans for key replacement'
    ],
    testProcedures: [
      'Review retirement procedures',
      'Test key replacement workflows',
      'Verify retired key archival',
      'Examine service continuity plans'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.4',
    name: 'Key Retirement When Integrity Weakened',
    description: 'Procedures are defined and implemented to retire keys when the integrity of the key has been weakened.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Define criteria for key compromise detection. Implement emergency key retirement procedures. Document and test incident response for key compromise.',
    evidenceRequirements: [
      'Key compromise criteria documentation',
      'Emergency retirement procedures',
      'Incident response plans for key compromise',
      'Key compromise detection configurations'
    ],
    testProcedures: [
      'Review compromise criteria',
      'Test emergency retirement procedures',
      'Examine incident response plans',
      'Verify detection capabilities'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.5',
    name: 'Key Retirement When Known or Suspected Compromise',
    description: 'Procedures are defined and implemented to retire or replace keys as necessary when known or suspected key compromise occurs.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement immediate key revocation capabilities. Define communication procedures for compromise notification. Maintain backup keys for rapid replacement.',
    evidenceRequirements: [
      'Key revocation procedures',
      'Compromise notification procedures',
      'Backup key documentation',
      'Compromise response test records'
    ],
    testProcedures: [
      'Test key revocation procedures',
      'Review notification procedures',
      'Verify backup key availability',
      'Examine response test records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.6',
    name: 'Split Knowledge and Dual Control for Manual Key Management',
    description: 'Where manual clear-text cryptographic key-management operations are used, split knowledge and dual control are employed.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement split knowledge requiring multiple custodians for key operations. Enforce dual control for all manual key handling. Document and train custodians on procedures.',
    evidenceRequirements: [
      'Split knowledge implementation documentation',
      'Dual control procedures',
      'Custodian training records',
      'Key operation logs showing dual control'
    ],
    testProcedures: [
      'Verify split knowledge implementation',
      'Test dual control enforcement',
      'Review custodian training',
      'Examine key operation logs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.7',
    name: 'Prevention of Unauthorized Key Substitution',
    description: 'Procedures are defined and implemented to prevent unauthorized substitution of cryptographic keys.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Implement key authentication mechanisms. Use key signing or certificates to verify key authenticity. Log and alert on unauthorized key modification attempts.',
    evidenceRequirements: [
      'Key authentication configurations',
      'Key signing/certificate documentation',
      'Unauthorized modification alerts',
      'Key integrity verification procedures'
    ],
    testProcedures: [
      'Test key authentication mechanisms',
      'Verify key signing implementation',
      'Review unauthorized modification alerts',
      'Examine integrity verification procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.8',
    name: 'Key Custodian Acknowledgment',
    description: 'Cryptographic key custodians formally acknowledge that they understand and accept their key custodian responsibilities.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Create formal acknowledgment documentation for key custodians. Include responsibilities, compliance requirements, and consequences. Obtain annual re-acknowledgment.',
    evidenceRequirements: [
      'Custodian acknowledgment forms',
      'Responsibility documentation',
      'Annual re-acknowledgment records',
      'Custodian training completion records'
    ],
    testProcedures: [
      'Review acknowledgment forms',
      'Verify all custodians have acknowledged',
      'Check annual re-acknowledgment dates',
      'Examine training records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-3.7.9',
    name: 'Key Custodian Responsibilities Documentation',
    description: 'Additional requirement for service providers: Key custodian responsibilities are documented and include acknowledgment of responsibilities.',
    category: 'Protect Stored Data',
    implementationGuidance: 'Document all key custodian responsibilities in detail. Include security requirements, operational procedures, and compliance obligations. Obtain signed acknowledgments.',
    evidenceRequirements: [
      'Detailed responsibility documentation',
      'Signed acknowledgment records',
      'Compliance obligation documentation',
      'Operational procedure documentation'
    ],
    testProcedures: [
      'Review responsibility documentation',
      'Verify signed acknowledgments',
      'Examine compliance obligations',
      'Review operational procedures'
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 4 - Protect Cardholder Data During Transmission (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-4.1.1',
    name: 'Transmission Security Policies Documented',
    description: 'All security policies and operational procedures for protecting cardholder data during transmission are documented, kept up to date, in use, and known to all affected parties.',
    category: 'Protect Data in Transit',
    implementationGuidance: 'Develop transmission security policies covering encryption requirements, protocol standards, and key management. Communicate policies to all personnel involved in data transmission.',
    evidenceRequirements: [
      'Transmission security policy documentation',
      'Policy review and approval records',
      'Personnel training records',
      'Policy distribution acknowledgments'
    ],
    testProcedures: [
      'Review transmission security policies',
      'Verify policies are current and approved',
      'Interview personnel on policy awareness',
      'Examine training documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-4.1.2',
    name: 'Roles and Responsibilities for Transmission Security',
    description: 'Roles and responsibilities for performing activities in Requirement 4 are documented, assigned, and understood.',
    category: 'Protect Data in Transit',
    implementationGuidance: 'Define and document roles for transmission security management. Assign responsibilities to specific personnel. Provide training on role expectations.',
    evidenceRequirements: [
      'Role and responsibility documentation',
      'Personnel assignment records',
      'Training completion records',
      'Organizational chart showing assignments'
    ],
    testProcedures: [
      'Review role documentation',
      'Verify personnel assignments',
      'Interview assigned personnel',
      'Examine training records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-4.2.1',
    name: 'Strong Cryptography for PAN Transmission',
    description: 'PAN is protected with strong cryptography during transmission over open, public networks.',
    category: 'Protect Data in Transit',
    implementationGuidance: 'Implement TLS 1.2 or higher for all PAN transmissions. Use approved cipher suites. Disable deprecated protocols and weak ciphers.',
    evidenceRequirements: [
      'TLS configuration documentation',
      'Cipher suite configurations',
      'Protocol version settings',
      'Network traffic analysis showing encryption'
    ],
    testProcedures: [
      'Verify TLS version in use',
      'Test cipher suite configurations',
      'Scan for deprecated protocols',
      'Capture and verify encrypted traffic'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-4.2.1.1',
    name: 'Inventory of Trusted Keys and Certificates',
    description: 'An inventory of the entity\'s trusted keys and certificates used to protect PAN during transmission is maintained.',
    category: 'Protect Data in Transit',
    implementationGuidance: 'Create and maintain inventory of all certificates and keys. Include expiration dates, key strengths, and responsible parties. Implement certificate lifecycle management.',
    evidenceRequirements: [
      'Certificate and key inventory',
      'Expiration tracking documentation',
      'Key strength documentation',
      'Certificate lifecycle procedures'
    ],
    testProcedures: [
      'Review certificate inventory',
      'Verify expiration tracking',
      'Examine key strengths',
      'Test lifecycle management procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-4.2.1.2',
    name: 'Certificates Used for PAN Transmission Valid',
    description: 'Certificates used to protect PAN during transmission over open, public networks are confirmed as valid and are not expired or revoked.',
    category: 'Protect Data in Transit',
    implementationGuidance: 'Implement certificate validation including revocation checking (OCSP/CRL). Configure automated certificate monitoring. Alert on pending expirations.',
    evidenceRequirements: [
      'Certificate validation configurations',
      'OCSP/CRL checking evidence',
      'Certificate monitoring alerts',
      'Expiration notification records'
    ],
    testProcedures: [
      'Verify certificate validation',
      'Test revocation checking',
      'Review monitoring alerts',
      'Examine notification records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-4.2.2',
    name: 'PAN Secured When Sent via End-User Messaging',
    description: 'PAN is secured with strong cryptography whenever it is sent via end-user messaging technologies.',
    category: 'Protect Data in Transit',
    implementationGuidance: 'Implement encryption for any PAN in email or messaging. Use secure messaging platforms with end-to-end encryption. Train users on secure transmission requirements.',
    evidenceRequirements: [
      'End-user messaging security configurations',
      'Encryption implementation documentation',
      'User training records',
      'Secure messaging platform documentation'
    ],
    testProcedures: [
      'Verify messaging encryption',
      'Test secure messaging platforms',
      'Review user training',
      'Examine configuration documentation'
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 5 - Protect All Systems Against Malware (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-5.1.1',
    name: 'Anti-Malware Policies Documented',
    description: 'All security policies and operational procedures for protecting systems and networks from malware are documented, kept up to date, in use, and known to all affected parties.',
    category: 'Malware Protection',
    implementationGuidance: 'Develop comprehensive anti-malware policies covering deployment, updates, scanning, and incident response. Communicate policies to all IT personnel.',
    evidenceRequirements: [
      'Anti-malware policy documentation',
      'Policy review and approval records',
      'Personnel training records',
      'Policy distribution acknowledgments'
    ],
    testProcedures: [
      'Review anti-malware policies',
      'Verify policies are current',
      'Interview personnel on policy awareness',
      'Examine training documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.1.2',
    name: 'Roles and Responsibilities for Malware Protection',
    description: 'Roles and responsibilities for performing activities in Requirement 5 are documented, assigned, and understood.',
    category: 'Malware Protection',
    implementationGuidance: 'Define and document roles for anti-malware management. Assign responsibilities for deployment, monitoring, and incident response. Provide role-specific training.',
    evidenceRequirements: [
      'Role and responsibility documentation',
      'Personnel assignment records',
      'Training completion records',
      'Incident response role assignments'
    ],
    testProcedures: [
      'Review role documentation',
      'Verify personnel assignments',
      'Interview assigned personnel',
      'Examine incident response assignments'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.2.1',
    name: 'Anti-Malware Solution Deployed',
    description: 'An anti-malware solution is deployed on all system components, except for those identified as not commonly affected by malware.',
    category: 'Malware Protection',
    implementationGuidance: 'Deploy anti-malware on all workstations, servers, and applicable systems. Document systems excluded with risk-based justification. Implement compensating controls for excluded systems.',
    evidenceRequirements: [
      'Anti-malware deployment inventory',
      'Exclusion documentation with justification',
      'Compensating control documentation',
      'Deployment verification reports'
    ],
    testProcedures: [
      'Verify anti-malware deployment',
      'Review exclusion justifications',
      'Examine compensating controls',
      'Check deployment reports'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.2.2',
    name: 'Anti-Malware Solution Detects All Known Malware Types',
    description: 'The anti-malware solution detects all known types of malware.',
    category: 'Malware Protection',
    implementationGuidance: 'Configure anti-malware for comprehensive detection including viruses, worms, Trojans, ransomware, and spyware. Enable heuristic and behavioral detection.',
    evidenceRequirements: [
      'Anti-malware configuration documentation',
      'Detection capability specifications',
      'Vendor documentation on malware types detected',
      'Configuration screenshots'
    ],
    testProcedures: [
      'Review detection configurations',
      'Verify malware type coverage',
      'Examine vendor specifications',
      'Test detection capabilities'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.2.3',
    name: 'Anti-Malware Solution Performs Scans and Active Monitoring',
    description: 'The anti-malware solution performs periodic scans and active or real-time scans, OR performs continuous behavioral analysis.',
    category: 'Malware Protection',
    implementationGuidance: 'Configure scheduled full system scans. Enable real-time scanning for all file operations. Implement behavioral analysis for advanced threat detection.',
    evidenceRequirements: [
      'Scan schedule configurations',
      'Real-time scanning settings',
      'Behavioral analysis configurations',
      'Scan completion reports'
    ],
    testProcedures: [
      'Verify scan schedule compliance',
      'Test real-time scanning',
      'Review behavioral analysis settings',
      'Examine scan reports'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.2.3.1',
    name: 'Periodic Malware Scan Frequency Based on Risk',
    description: 'If periodic malware scans are performed, the frequency is defined in the entity\'s targeted risk analysis.',
    category: 'Malware Protection',
    implementationGuidance: 'Conduct risk analysis to determine appropriate scan frequency. Document rationale for chosen frequency. Adjust frequency based on threat landscape changes.',
    evidenceRequirements: [
      'Risk analysis documentation',
      'Scan frequency rationale',
      'Threat landscape assessment',
      'Frequency adjustment records'
    ],
    testProcedures: [
      'Review risk analysis',
      'Verify scan frequency rationale',
      'Examine threat assessments',
      'Check frequency adjustments'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3.1',
    name: 'Anti-Malware Solution Kept Current',
    description: 'The anti-malware solution is kept current via automatic updates.',
    category: 'Malware Protection',
    implementationGuidance: 'Configure automatic signature and engine updates. Set update frequency to at least daily. Monitor update status and alert on failures.',
    evidenceRequirements: [
      'Automatic update configurations',
      'Update frequency settings',
      'Update status monitoring reports',
      'Update failure alerts'
    ],
    testProcedures: [
      'Verify automatic updates enabled',
      'Check update frequency',
      'Review update status reports',
      'Examine failure alert configurations'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3.2',
    name: 'Anti-Malware Solution Generates Audit Logs',
    description: 'The anti-malware solution generates audit logs.',
    category: 'Malware Protection',
    implementationGuidance: 'Enable comprehensive logging for all anti-malware activities. Include detection events, scan results, update status, and configuration changes. Centralize logs for analysis.',
    evidenceRequirements: [
      'Logging configuration documentation',
      'Sample audit logs',
      'Log centralization evidence',
      'Log retention settings'
    ],
    testProcedures: [
      'Verify logging configurations',
      'Review sample audit logs',
      'Test log centralization',
      'Check retention settings'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3.2.1',
    name: 'Anti-Malware Log Retention Based on Risk',
    description: 'The frequency of anti-malware log reviews is defined in the entity\'s targeted risk analysis.',
    category: 'Malware Protection',
    implementationGuidance: 'Conduct risk analysis to determine log review frequency. Document rationale for review frequency. Implement automated log analysis where possible.',
    evidenceRequirements: [
      'Risk analysis for log review frequency',
      'Review frequency rationale',
      'Log review schedule',
      'Automated analysis configurations'
    ],
    testProcedures: [
      'Review risk analysis',
      'Verify review frequency rationale',
      'Check review schedule compliance',
      'Examine automated analysis'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3.3',
    name: 'Anti-Malware Cannot Be Disabled by Users',
    description: 'The anti-malware solution is not able to be disabled or altered by users, unless specifically authorized on a case-by-case basis for a limited time period.',
    category: 'Malware Protection',
    implementationGuidance: 'Configure anti-malware with administrative protections. Implement approval workflow for temporary disabling. Log and monitor all disable events.',
    evidenceRequirements: [
      'User restriction configurations',
      'Temporary disable approval workflow',
      'Disable event logs',
      'Re-enablement procedures'
    ],
    testProcedures: [
      'Test user restriction enforcement',
      'Review approval workflow',
      'Examine disable event logs',
      'Verify re-enablement procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3.4',
    name: 'Anti-Malware Logs Available for Forensics',
    description: 'Audit logs for the anti-malware solution are protected from destruction and are available for forensic analysis.',
    category: 'Malware Protection',
    implementationGuidance: 'Implement log protection with restricted access. Configure log forwarding to secure storage. Ensure logs are retained for forensic timeframes.',
    evidenceRequirements: [
      'Log protection configurations',
      'Secure storage documentation',
      'Forensic retention settings',
      'Access restriction evidence'
    ],
    testProcedures: [
      'Verify log protection',
      'Test secure storage',
      'Check forensic retention',
      'Examine access restrictions'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.3.5',
    name: 'Anti-Malware on Removable Media',
    description: 'Anti-malware mechanisms are active on all removable electronic media.',
    category: 'Malware Protection',
    implementationGuidance: 'Configure automatic scanning of removable media. Enable auto-run prevention. Implement USB device controls and monitoring.',
    evidenceRequirements: [
      'Removable media scan configurations',
      'Auto-run prevention settings',
      'USB device control configurations',
      'Removable media activity logs'
    ],
    testProcedures: [
      'Test removable media scanning',
      'Verify auto-run prevention',
      'Check USB device controls',
      'Review activity logs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-5.4.1',
    name: 'Phishing Attack Protection',
    description: 'Processes and automated mechanisms are in place to detect and protect personnel against phishing attacks.',
    category: 'Malware Protection',
    implementationGuidance: 'Deploy email security solutions with phishing detection. Implement URL filtering and sandboxing. Conduct regular phishing awareness training.',
    evidenceRequirements: [
      'Email security configurations',
      'Phishing detection rules',
      'URL filtering configurations',
      'Phishing training records'
    ],
    testProcedures: [
      'Test phishing detection',
      'Verify email security configurations',
      'Review URL filtering',
      'Examine training records'
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 6 - Develop and Maintain Secure Systems (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-6.1.1',
    name: 'Secure Development Policies Documented',
    description: 'All security policies and operational procedures for developing and maintaining secure systems and software are documented, kept up to date, in use, and known to all affected parties.',
    category: 'Secure Development',
    implementationGuidance: 'Develop secure SDLC policies covering requirements, design, coding, testing, and deployment. Communicate policies to all development personnel.',
    evidenceRequirements: [
      'Secure development policy documentation',
      'Policy review and approval records',
      'Developer training records',
      'Policy distribution acknowledgments'
    ],
    testProcedures: [
      'Review secure development policies',
      'Verify policies are current',
      'Interview developers on policy awareness',
      'Examine training documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.1.2',
    name: 'Roles and Responsibilities for Secure Development',
    description: 'Roles and responsibilities for performing activities in Requirement 6 are documented, assigned, and understood.',
    category: 'Secure Development',
    implementationGuidance: 'Define and document roles for secure development activities. Assign responsibilities for code review, security testing, and vulnerability management.',
    evidenceRequirements: [
      'Role and responsibility documentation',
      'Personnel assignment records',
      'Training completion records',
      'Security team assignments'
    ],
    testProcedures: [
      'Review role documentation',
      'Verify personnel assignments',
      'Interview assigned personnel',
      'Examine security team structure'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.2.1',
    name: 'Bespoke Software Developed Securely',
    description: 'Bespoke and custom software is developed securely.',
    category: 'Secure Development',
    implementationGuidance: 'Implement secure SDLC with security requirements, threat modeling, secure coding practices, and security testing. Train developers on secure coding.',
    evidenceRequirements: [
      'SDLC documentation with security integration',
      'Security requirements documentation',
      'Threat modeling records',
      'Secure coding training records'
    ],
    testProcedures: [
      'Review SDLC for security integration',
      'Verify security requirements process',
      'Examine threat modeling practices',
      'Check developer training'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.2.2',
    name: 'Software Development Personnel Trained',
    description: 'Software development personnel working on bespoke and custom software are trained at least once every 12 months on security relevant to their job function.',
    category: 'Secure Development',
    implementationGuidance: 'Provide annual secure coding training. Include OWASP Top 10, secure design principles, and PCI DSS requirements. Track training completion.',
    evidenceRequirements: [
      'Training curriculum documentation',
      'Annual training completion records',
      'Training content covering security topics',
      'Developer training tracking system'
    ],
    testProcedures: [
      'Review training curriculum',
      'Verify annual training completion',
      'Examine training content',
      'Check tracking system records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.2.3',
    name: 'Bespoke Software Reviewed Before Release',
    description: 'Bespoke and custom software is reviewed prior to being released into production to identify and correct potential coding vulnerabilities.',
    category: 'Secure Development',
    implementationGuidance: 'Implement mandatory code review processes. Use automated code analysis tools. Conduct manual security code reviews for critical components.',
    evidenceRequirements: [
      'Code review policy and procedures',
      'Automated analysis tool configurations',
      'Code review records',
      'Vulnerability remediation records'
    ],
    testProcedures: [
      'Review code review processes',
      'Verify automated analysis tools',
      'Examine code review records',
      'Check remediation records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.2.3.1',
    name: 'Manual Code Review Performed',
    description: 'If manual code reviews are performed, the reviews are performed by individuals with knowledge of secure coding practices and the programming language.',
    category: 'Secure Development',
    implementationGuidance: 'Assign qualified reviewers for code reviews. Verify reviewer qualifications in secure coding and relevant languages. Document reviewer assignments.',
    evidenceRequirements: [
      'Reviewer qualification documentation',
      'Reviewer assignment records',
      'Secure coding knowledge verification',
      'Language proficiency documentation'
    ],
    testProcedures: [
      'Verify reviewer qualifications',
      'Check assignment records',
      'Review knowledge verification',
      'Examine proficiency documentation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.2.4',
    name: 'Common Software Attacks Addressed',
    description: 'Software engineering techniques or other methods are defined and in use by software development personnel to prevent or mitigate common software attacks.',
    category: 'Secure Development',
    implementationGuidance: 'Document secure coding standards addressing common vulnerabilities. Include input validation, output encoding, authentication, and session management. Enforce standards in code reviews.',
    evidenceRequirements: [
      'Secure coding standards documentation',
      'Standards covering common attacks',
      'Code review checklists',
      'Standards enforcement evidence'
    ],
    testProcedures: [
      'Review secure coding standards',
      'Verify common attack coverage',
      'Examine code review checklists',
      'Check standards enforcement'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.3.1',
    name: 'Security Vulnerabilities Identified and Risk Ranked',
    description: 'Security vulnerabilities are identified and managed through a vulnerability management process.',
    category: 'Secure Development',
    implementationGuidance: 'Implement vulnerability scanning and assessment. Risk rank vulnerabilities based on severity and impact. Establish remediation timelines based on risk.',
    evidenceRequirements: [
      'Vulnerability management procedures',
      'Risk ranking methodology',
      'Vulnerability scan results',
      'Remediation timeline documentation'
    ],
    testProcedures: [
      'Review vulnerability management process',
      'Verify risk ranking methodology',
      'Examine scan results',
      'Check remediation timelines'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.3.2',
    name: 'Software Inventory Maintained',
    description: 'An inventory of bespoke and custom software, and third-party software components incorporated into bespoke and custom software, is maintained.',
    category: 'Secure Development',
    implementationGuidance: 'Create and maintain software inventory including custom and third-party components. Track versions, licensing, and vulnerability status. Update inventory with each release.',
    evidenceRequirements: [
      'Software component inventory',
      'Third-party library tracking',
      'Version documentation',
      'Inventory update procedures'
    ],
    testProcedures: [
      'Review software inventory',
      'Verify third-party tracking',
      'Check version documentation',
      'Examine update procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.3.3',
    name: 'Security Patches Installed Timely',
    description: 'All system components are protected from known vulnerabilities by installing applicable security patches/updates within one month of release.',
    category: 'Secure Development',
    implementationGuidance: 'Implement patch management process with testing and deployment procedures. Track patch status across all systems. Prioritize critical and high-severity patches.',
    evidenceRequirements: [
      'Patch management procedures',
      'Patch testing documentation',
      'Patch deployment records',
      'Patch compliance reports'
    ],
    testProcedures: [
      'Review patch management process',
      'Verify testing procedures',
      'Examine deployment records',
      'Check compliance reports'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.4.1',
    name: 'Public-Facing Web Applications Protected',
    description: 'For public-facing web applications, new threats and vulnerabilities are addressed on an ongoing basis and these applications are protected against known attacks.',
    category: 'Secure Development',
    implementationGuidance: 'Deploy web application firewalls or equivalent protections. Conduct regular vulnerability assessments. Monitor for new threats and update protections accordingly.',
    evidenceRequirements: [
      'WAF deployment documentation',
      'Vulnerability assessment reports',
      'Threat monitoring procedures',
      'Protection update records'
    ],
    testProcedures: [
      'Verify WAF deployment',
      'Review assessment reports',
      'Examine threat monitoring',
      'Check protection updates'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.4.2',
    name: 'Automated Technical Solution for Public Web Applications',
    description: 'For public-facing web applications, an automated technical solution is deployed that continually detects and prevents web-based attacks.',
    category: 'Secure Development',
    implementationGuidance: 'Implement WAF with automated attack detection and blocking. Configure for OWASP Top 10 protections. Enable logging and alerting for attack detection.',
    evidenceRequirements: [
      'WAF configuration documentation',
      'Attack detection rule sets',
      'Blocking configuration evidence',
      'Attack detection logs'
    ],
    testProcedures: [
      'Test WAF attack detection',
      'Verify blocking configurations',
      'Review rule sets',
      'Examine attack logs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.4.3',
    name: 'Payment Page Scripts Managed',
    description: 'All payment page scripts that are loaded and executed in the consumer\'s browser are managed.',
    category: 'Secure Development',
    implementationGuidance: 'Inventory all scripts on payment pages. Implement Content Security Policy. Monitor for unauthorized script changes. Verify script integrity.',
    evidenceRequirements: [
      'Payment page script inventory',
      'Content Security Policy configurations',
      'Script change monitoring evidence',
      'Script integrity verification records'
    ],
    testProcedures: [
      'Review script inventory',
      'Verify CSP implementation',
      'Test change monitoring',
      'Check integrity verification'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5.1',
    name: 'Change Control Processes for System Changes',
    description: 'Changes to all system components in the production environment are made according to established procedures.',
    category: 'Secure Development',
    implementationGuidance: 'Implement formal change control with documentation, impact assessment, testing, approval, and rollback procedures. Require sign-off for all production changes.',
    evidenceRequirements: [
      'Change control procedures',
      'Change request documentation',
      'Impact assessment records',
      'Approval and sign-off records'
    ],
    testProcedures: [
      'Review change control procedures',
      'Verify change documentation',
      'Examine impact assessments',
      'Check approval records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5.2',
    name: 'Significant Changes Documented',
    description: 'Upon completion of a significant change, all relevant PCI DSS requirements are confirmed to be in place on all new or changed systems and networks.',
    category: 'Secure Development',
    implementationGuidance: 'Define criteria for significant changes. Conduct PCI DSS compliance verification after significant changes. Document verification results.',
    evidenceRequirements: [
      'Significant change criteria documentation',
      'Post-change compliance verification records',
      'Verification checklists',
      'Remediation records for identified gaps'
    ],
    testProcedures: [
      'Review significant change criteria',
      'Verify compliance verification process',
      'Examine verification records',
      'Check remediation records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5.3',
    name: 'Pre-Production and Production Environments Separated',
    description: 'Pre-production environments are separated from production environments and the separation is enforced with access controls.',
    category: 'Secure Development',
    implementationGuidance: 'Implement network and logical separation between environments. Use separate credentials for each environment. Restrict production access to authorized personnel.',
    evidenceRequirements: [
      'Environment separation documentation',
      'Network segmentation configurations',
      'Access control configurations',
      'Credential management documentation'
    ],
    testProcedures: [
      'Verify environment separation',
      'Test network segmentation',
      'Review access controls',
      'Check credential management'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5.4',
    name: 'Separation of Duties for Production Deployment',
    description: 'Roles and functions are separated between production and pre-production environments to reduce the risk of unauthorized changes.',
    category: 'Secure Development',
    implementationGuidance: 'Implement separation of duties between development, testing, and operations. Restrict production deployment to operations personnel. Monitor for policy violations.',
    evidenceRequirements: [
      'Separation of duties policy',
      'Role assignment documentation',
      'Access restriction configurations',
      'Policy violation monitoring records'
    ],
    testProcedures: [
      'Review separation of duties policy',
      'Verify role assignments',
      'Test access restrictions',
      'Check monitoring records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5.5',
    name: 'Live PANs Not Used in Pre-Production',
    description: 'Live PANs are not used in pre-production environments, unless those environments are included in the CDE and protected in accordance with all applicable PCI DSS requirements.',
    category: 'Secure Development',
    implementationGuidance: 'Prohibit use of live PAN in development and test environments. Implement data masking or synthetic data generation. Audit pre-production environments for live data.',
    evidenceRequirements: [
      'Data handling policy for pre-production',
      'Data masking configurations',
      'Pre-production data audit reports',
      'Synthetic data generation documentation'
    ],
    testProcedures: [
      'Review data handling policy',
      'Verify data masking',
      'Examine audit reports',
      'Check synthetic data implementation'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-6.5.6',
    name: 'Test Data and Accounts Removed Before Production',
    description: 'Test data and test accounts are removed from system components before the system goes into production.',
    category: 'Secure Development',
    implementationGuidance: 'Implement pre-production cleanup procedures. Verify removal of test data and accounts before go-live. Document cleanup verification.',
    evidenceRequirements: [
      'Pre-production cleanup procedures',
      'Cleanup verification checklists',
      'Test account removal records',
      'Go-live verification documentation'
    ],
    testProcedures: [
      'Review cleanup procedures',
      'Verify cleanup verification',
      'Check account removal records',
      'Examine go-live documentation'
    ],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 7 - Restrict Access (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-7.1.1',
    name: 'Access Control Policies Documented',
    description: 'All security policies and operational procedures for restricting access to system components and cardholder data are documented, kept up to date, in use, and known to all affected parties.',
    category: 'Access Control',
    implementationGuidance: 'Develop comprehensive access control policies covering need-to-know principles, role-based access, and access review procedures.',
    evidenceRequirements: ['Access control policy documentation', 'Policy review records', 'Personnel training records', 'Policy acknowledgments'],
    testProcedures: ['Review access control policies', 'Verify policies are current', 'Interview personnel on awareness', 'Examine training documentation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.1.2',
    name: 'Roles and Responsibilities for Access Control',
    description: 'Roles and responsibilities for performing activities in Requirement 7 are documented, assigned, and understood.',
    category: 'Access Control',
    implementationGuidance: 'Define and document roles for access management including provisioning, review, and revocation.',
    evidenceRequirements: ['Role documentation', 'Personnel assignments', 'Training records', 'Access management structure'],
    testProcedures: ['Review role documentation', 'Verify assignments', 'Interview personnel', 'Examine team structure'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2.1',
    name: 'Access Control Model Defined',
    description: 'An access control model is defined and includes granting access based on business and access needs.',
    category: 'Access Control',
    implementationGuidance: 'Implement role-based access control (RBAC) model with defined access levels based on job functions.',
    evidenceRequirements: ['Access control model documentation', 'Role definitions', 'Business justifications', 'Access matrix'],
    testProcedures: ['Review access control model', 'Verify role definitions', 'Examine justifications', 'Test access matrix'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2.2',
    name: 'Access Based on Job Classification',
    description: 'Access is assigned to users based on job classification and function using least privilege principles.',
    category: 'Access Control',
    implementationGuidance: 'Map access rights to job classifications implementing least privilege principles.',
    evidenceRequirements: ['Job classification documentation', 'Access rights mapping', 'Least privilege evidence', 'Privileged access justifications'],
    testProcedures: ['Review classifications', 'Verify access mapping', 'Test least privilege', 'Examine justifications'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2.3',
    name: 'Privileges Approved by Authorized Personnel',
    description: 'Required privileges are approved by authorized personnel through formal approval workflows.',
    category: 'Access Control',
    implementationGuidance: 'Implement access request and approval workflows requiring management approval.',
    evidenceRequirements: ['Access request procedures', 'Approval workflows', 'Authority matrix', 'Approval records'],
    testProcedures: ['Review request procedures', 'Verify workflows', 'Examine authority documentation', 'Check approval records'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2.4',
    name: 'User Access Reviews Performed',
    description: 'All user accounts and access privileges are reviewed at least once every six months.',
    category: 'Access Control',
    implementationGuidance: 'Implement semi-annual access review process including all user types and vendors.',
    evidenceRequirements: ['Access review schedule', 'Review completion records', 'Findings documentation', 'Remediation records'],
    testProcedures: ['Verify review schedule', 'Examine review records', 'Check findings', 'Verify remediation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2.5',
    name: 'Application and System Accounts Managed',
    description: 'All application and system accounts and related access privileges are assigned and managed.',
    category: 'Access Control',
    implementationGuidance: 'Inventory all service accounts with assigned ownership and periodic privilege review.',
    evidenceRequirements: ['Service account inventory', 'Ownership assignments', 'Privilege reviews', 'Management procedures'],
    testProcedures: ['Review account inventory', 'Verify ownership', 'Examine privilege reviews', 'Check procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.2.6',
    name: 'Query Repository Access Restricted',
    description: 'All user access to query repositories of stored cardholder data is restricted.',
    category: 'Access Control',
    implementationGuidance: 'Implement database access controls restricting query access to authorized users only.',
    evidenceRequirements: ['Database access controls', 'Authorized user documentation', 'Query activity logs', 'Monitoring configurations'],
    testProcedures: ['Verify database controls', 'Check user lists', 'Review query logs', 'Examine monitoring'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.3.1',
    name: 'Access Control System Established',
    description: 'Access control systems restrict access based on need to know covering all system components.',
    category: 'Access Control',
    implementationGuidance: 'Deploy enterprise access control systems configured for need-to-know access.',
    evidenceRequirements: ['Access control system documentation', 'Component coverage', 'Need-to-know settings', 'Access logs'],
    testProcedures: ['Verify system deployment', 'Check coverage', 'Test enforcement', 'Review logs'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.3.2',
    name: 'Access Control Default Deny',
    description: 'Access control systems enforce permissions based on roles with default deny.',
    category: 'Access Control',
    implementationGuidance: 'Configure access control with default deny and explicit permission grants.',
    evidenceRequirements: ['Default deny configurations', 'Role-based permissions', 'Permission documentation', 'Access denial logs'],
    testProcedures: ['Verify default deny', 'Test role permissions', 'Review assignments', 'Check denial logging'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-7.3.3',
    name: 'Access Control Deny All Default',
    description: 'Access control systems are set to deny all by default.',
    category: 'Access Control',
    implementationGuidance: 'Configure all access control systems with explicit deny-all default.',
    evidenceRequirements: ['Default deny screenshots', 'Allow rule documentation', 'Configuration reviews', 'Setting verification'],
    testProcedures: ['Verify deny settings', 'Review allow rules', 'Test default behavior', 'Examine reviews'],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 8 - Identify and Authenticate (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-8.1.1',
    name: 'Authentication Policies Documented',
    description: 'All security policies for identification and authentication are documented and known to affected parties.',
    category: 'Authentication',
    implementationGuidance: 'Develop comprehensive authentication policies covering password requirements, MFA, and account management.',
    evidenceRequirements: ['Authentication policy documentation', 'Policy reviews', 'Training records', 'Policy acknowledgments'],
    testProcedures: ['Review authentication policies', 'Verify currency', 'Interview personnel', 'Examine training'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.1.2',
    name: 'Authentication Roles Defined',
    description: 'Roles and responsibilities for authentication activities are documented and assigned.',
    category: 'Authentication',
    implementationGuidance: 'Define roles for identity and authentication management including provisioning and system management.',
    evidenceRequirements: ['Role documentation', 'Personnel assignments', 'Training records', 'Team structure'],
    testProcedures: ['Review roles', 'Verify assignments', 'Interview personnel', 'Examine structure'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.1',
    name: 'Unique User IDs Assigned',
    description: 'All users are assigned a unique ID before access to system components or cardholder data.',
    category: 'Authentication',
    implementationGuidance: 'Implement unique user ID assignment procedures prohibiting shared accounts.',
    evidenceRequirements: ['User ID procedures', 'Unique ID enforcement', 'Shared account prohibition', 'User inventory'],
    testProcedures: ['Verify unique IDs', 'Check for shared accounts', 'Review configurations', 'Examine inventory'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.2',
    name: 'Shared Accounts Managed',
    description: 'Group, shared, or generic accounts are only used when necessary and managed appropriately.',
    category: 'Authentication',
    implementationGuidance: 'Document business justification for shared accounts with additional controls.',
    evidenceRequirements: ['Shared account inventory', 'Business justification', 'Activity logs', 'Management approval'],
    testProcedures: ['Review inventory', 'Verify justifications', 'Examine controls', 'Check monitoring'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.4',
    name: 'User Account Lifecycle Management',
    description: 'Addition, deletion, and modification of user IDs and authentication factors are managed.',
    category: 'Authentication',
    implementationGuidance: 'Implement formal account lifecycle procedures with approvals and audit trails.',
    evidenceRequirements: ['Lifecycle procedures', 'Approval records', 'Audit logs', 'Provisioning records'],
    testProcedures: ['Review procedures', 'Verify approvals', 'Examine logs', 'Check records'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.5',
    name: 'Terminated User Access Revoked',
    description: 'Access for terminated users is immediately revoked.',
    category: 'Authentication',
    implementationGuidance: 'Implement immediate access revocation integrated with HR termination processes.',
    evidenceRequirements: ['Revocation procedures', 'HR integration', 'Revocation records', 'Access audit logs'],
    testProcedures: ['Review procedures', 'Verify integration', 'Examine records', 'Test for residual access'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.6',
    name: 'Inactive Accounts Disabled',
    description: 'Inactive user accounts are removed or disabled within 90 days of inactivity.',
    category: 'Authentication',
    implementationGuidance: 'Implement automated inactive account detection with 90-day threshold.',
    evidenceRequirements: ['Inactivity detection configs', 'Automation evidence', 'Inactive account reports', 'Threshold settings'],
    testProcedures: ['Verify detection', 'Test automation', 'Review reports', 'Check thresholds'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.7',
    name: 'Third-Party Access Managed',
    description: 'Third-party remote access accounts are enabled only when needed and monitored.',
    category: 'Authentication',
    implementationGuidance: 'Enable third-party accounts only when needed and disable immediately after use.',
    evidenceRequirements: ['Third-party procedures', 'Enablement logs', 'Monitoring records', 'Access periods'],
    testProcedures: ['Review procedures', 'Verify logs', 'Examine monitoring', 'Check compliance'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.2.8',
    name: 'Session Timeout Configured',
    description: 'User sessions timeout after 15 minutes of inactivity requiring re-authentication.',
    category: 'Authentication',
    implementationGuidance: 'Configure 15-minute session timeout across all systems with re-authentication.',
    evidenceRequirements: ['Timeout configurations', 'Re-authentication settings', 'Timeout logs', 'System coverage'],
    testProcedures: ['Verify timeouts', 'Test re-authentication', 'Review logs', 'Check coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.1',
    name: 'Strong Authentication Implemented',
    description: 'All user access is authenticated via strong authentication factors.',
    category: 'Authentication',
    implementationGuidance: 'Implement strong authentication using passwords, tokens, or biometrics.',
    evidenceRequirements: ['Authentication methods', 'System configurations', 'Enforcement evidence', 'Method inventory'],
    testProcedures: ['Verify methods', 'Test enforcement', 'Review configurations', 'Examine inventory'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.2',
    name: 'Authentication Factors Encrypted',
    description: 'Strong cryptography protects authentication factors during transmission and storage.',
    category: 'Authentication',
    implementationGuidance: 'Implement encryption for credential transmission and strong hashing for storage.',
    evidenceRequirements: ['Transmission encryption', 'Hashing algorithms', 'Token protection', 'Cryptographic standards'],
    testProcedures: ['Verify encryption', 'Review hashing', 'Test token protection', 'Examine standards'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.4',
    name: 'Invalid Attempts Limited',
    description: 'Invalid authentication attempts are limited by lockout after ten attempts.',
    category: 'Authentication',
    implementationGuidance: 'Configure account lockout after 10 failed attempts with 30-minute duration.',
    evidenceRequirements: ['Lockout configurations', 'Threshold settings', 'Duration settings', 'Lockout logs'],
    testProcedures: ['Verify configurations', 'Test threshold', 'Verify duration', 'Review logs'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.5',
    name: 'Password Requirements Enforced',
    description: 'Passwords meet security requirements including minimum length and complexity.',
    category: 'Authentication',
    implementationGuidance: 'Enforce minimum 12 character passwords with complexity and 90-day rotation.',
    evidenceRequirements: ['Password policy configs', 'Complexity settings', 'History settings', 'Change frequency'],
    testProcedures: ['Verify length', 'Test complexity', 'Check history', 'Verify frequency'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.6',
    name: 'Password Complexity Required',
    description: 'Passwords meet minimum complexity with numeric and alphabetic characters.',
    category: 'Authentication',
    implementationGuidance: 'Require mix of numeric and alphabetic characters minimum.',
    evidenceRequirements: ['Complexity configs', 'Character requirements', 'Rationale documentation', 'Compliance reports'],
    testProcedures: ['Test complexity', 'Verify requirements', 'Review rationale', 'Check reports'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.7',
    name: 'Password History Enforced',
    description: 'New passwords cannot match any of the last four passwords used.',
    category: 'Authentication',
    implementationGuidance: 'Configure password history preventing reuse of last 4 passwords.',
    evidenceRequirements: ['History configurations', 'Reuse prevention', 'Attempt logs', 'System coverage'],
    testProcedures: ['Verify history', 'Test prevention', 'Review logs', 'Check coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.4.1',
    name: 'MFA for CDE Access',
    description: 'MFA is implemented for all access into the CDE.',
    category: 'Authentication',
    implementationGuidance: 'Deploy MFA for all CDE access points using at least two authentication factors.',
    evidenceRequirements: ['MFA deployment', 'Access point inventory', 'MFA configurations', 'Factor documentation'],
    testProcedures: ['Verify MFA deployment', 'Test functionality', 'Review configurations', 'Check coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.4.2',
    name: 'MFA for All CDE Users',
    description: 'MFA is implemented for all users accessing the CDE including employees and vendors.',
    category: 'Authentication',
    implementationGuidance: 'Ensure MFA covers all user types accessing CDE including contractors.',
    evidenceRequirements: ['User coverage documentation', 'User type analysis', 'Exception documentation', 'Compensating controls'],
    testProcedures: ['Verify coverage', 'Check user types', 'Review exceptions', 'Examine controls'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.4.3',
    name: 'MFA for Remote Access',
    description: 'MFA is implemented for all remote network access that could impact the CDE.',
    category: 'Authentication',
    implementationGuidance: 'Deploy MFA for all remote access methods including VPN and web-based access.',
    evidenceRequirements: ['Remote access MFA configs', 'Access method inventory', 'Enforcement evidence', 'User coverage'],
    testProcedures: ['Verify MFA for remote', 'Test remote access', 'Review coverage', 'Check user types'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.5.1',
    name: 'MFA System Security',
    description: 'MFA systems are implemented with proper security configuration.',
    category: 'Authentication',
    implementationGuidance: 'Configure MFA to prevent bypass using independent authentication factors.',
    evidenceRequirements: ['MFA configurations', 'Bypass prevention', 'Factor independence', 'Replay protection'],
    testProcedures: ['Verify configurations', 'Test bypass prevention', 'Review independence', 'Check protection'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.6.1',
    name: 'System Account Interactive Login Managed',
    description: 'System accounts with interactive login capability are managed appropriately.',
    category: 'Authentication',
    implementationGuidance: 'Identify and implement additional controls for system accounts with interactive login.',
    evidenceRequirements: ['System account inventory', 'Additional controls', 'Login monitoring', 'Management procedures'],
    testProcedures: ['Review inventory', 'Verify controls', 'Examine monitoring', 'Check procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.6.2',
    name: 'No Hard-Coded Passwords',
    description: 'Passwords for application accounts are not hard coded in scripts or source code.',
    category: 'Authentication',
    implementationGuidance: 'Scan for hard-coded credentials and use secrets management solutions.',
    evidenceRequirements: ['Credential scanning', 'Secrets management', 'Rotation evidence', 'Code review records'],
    testProcedures: ['Run scans', 'Verify secrets management', 'Check rotation', 'Review code'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.6.3',
    name: 'Application Passwords Protected',
    description: 'Passwords for application and system accounts are protected against misuse.',
    category: 'Authentication',
    implementationGuidance: 'Store application credentials securely with access controls and monitoring.',
    evidenceRequirements: ['Secure storage', 'Access controls', 'Access logs', 'Protection mechanisms'],
    testProcedures: ['Verify storage', 'Test controls', 'Review logs', 'Examine mechanisms'],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 9 - Physical Security (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-9.1.1',
    name: 'Physical Security Policies Documented',
    description: 'All security policies for restricting physical access are documented and known to affected parties.',
    category: 'Physical Security',
    implementationGuidance: 'Develop comprehensive physical security policies covering facility access and visitor management.',
    evidenceRequirements: ['Physical security policies', 'Policy reviews', 'Training records', 'Acknowledgments'],
    testProcedures: ['Review policies', 'Verify currency', 'Interview personnel', 'Examine training'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.1.2',
    name: 'Physical Security Roles Defined',
    description: 'Roles and responsibilities for physical security are documented and assigned.',
    category: 'Physical Security',
    implementationGuidance: 'Define roles for physical security management including access control and monitoring.',
    evidenceRequirements: ['Role documentation', 'Personnel assignments', 'Training records', 'Team structure'],
    testProcedures: ['Review roles', 'Verify assignments', 'Interview personnel', 'Examine structure'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.2.1',
    name: 'Facility Entry Controls Implemented',
    description: 'Appropriate facility entry controls restrict physical access to CDE systems.',
    category: 'Physical Security',
    implementationGuidance: 'Deploy physical access controls such as badge readers and biometrics.',
    evidenceRequirements: ['Access control configurations', 'System documentation', 'Access logs', 'Authorized personnel lists'],
    testProcedures: ['Verify controls', 'Test systems', 'Review logs', 'Check personnel lists'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.2.2',
    name: 'Network Equipment Physically Secured',
    description: 'Physical access to wireless access points and networking hardware is restricted.',
    category: 'Physical Security',
    implementationGuidance: 'Secure network equipment in locked cabinets with access logging.',
    evidenceRequirements: ['Equipment security documentation', 'Locked storage evidence', 'Access lists', 'Access logs'],
    testProcedures: ['Verify security', 'Check storage', 'Review access lists', 'Examine logs'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.2.3',
    name: 'Consoles Physically Secured',
    description: 'Physical access to consoles in sensitive areas is restricted via locking.',
    category: 'Physical Security',
    implementationGuidance: 'Implement console locking mechanisms with authentication requirements.',
    evidenceRequirements: ['Console locking configs', 'Authentication requirements', 'Access logs', 'Security procedures'],
    testProcedures: ['Verify locking', 'Test authentication', 'Review logs', 'Check procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.2.4',
    name: 'Visitor Access Managed',
    description: 'Access of onsite personnel and visitors is managed appropriately.',
    category: 'Physical Security',
    implementationGuidance: 'Implement visitor registration with badges and escort requirements.',
    evidenceRequirements: ['Visitor procedures', 'Badge records', 'Escort requirements', 'Visitor logs'],
    testProcedures: ['Review procedures', 'Verify badges', 'Check escorts', 'Examine logs'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.3.1',
    name: 'Visitor Authorization Procedures',
    description: 'Procedures are implemented for authorizing and managing visitors.',
    category: 'Physical Security',
    implementationGuidance: 'Create formal visitor authorization with sponsor approval and tracking.',
    evidenceRequirements: ['Authorization procedures', 'Sponsor approval', 'Tracking records', 'Workflow documentation'],
    testProcedures: ['Review procedures', 'Verify approval', 'Check tracking', 'Examine workflow'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.3.2',
    name: 'Visitor Badges Managed',
    description: 'Visitor badges distinguish visitors from onsite personnel.',
    category: 'Physical Security',
    implementationGuidance: 'Issue distinct visitor badges collected upon departure with expiration.',
    evidenceRequirements: ['Visitor badges', 'Collection procedures', 'Expiration settings', 'Issuance records'],
    testProcedures: ['Verify distinction', 'Test collection', 'Check expiration', 'Review records'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.3.3',
    name: 'Visitors Escorted',
    description: 'Visitors are escorted in areas where cardholder data is processed.',
    category: 'Physical Security',
    implementationGuidance: 'Implement mandatory escort policy for CDE areas with training.',
    evidenceRequirements: ['Escort policy', 'Training records', 'Activity logs', 'Access procedures'],
    testProcedures: ['Review policy', 'Verify training', 'Check logs', 'Observe practices'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.3.4',
    name: 'Visitor Log Maintained',
    description: 'A visitor log maintains physical record of visitor activity.',
    category: 'Physical Security',
    implementationGuidance: 'Maintain visitor logs with name, organization, date, time, and sponsor.',
    evidenceRequirements: ['Visitor logs', 'Content requirements', 'Retention documentation', 'Secure storage'],
    testProcedures: ['Review logs', 'Verify content', 'Check retention', 'Examine storage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.1',
    name: 'Media Physically Secured',
    description: 'All media with cardholder data is physically secured.',
    category: 'Physical Security',
    implementationGuidance: 'Store media in secure locked locations with access logging.',
    evidenceRequirements: ['Media storage security', 'Locked storage', 'Access lists', 'Access logs'],
    testProcedures: ['Verify security', 'Check storage', 'Review lists', 'Examine logs'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.2',
    name: 'Media Classified',
    description: 'All media with cardholder data is classified for sensitivity.',
    category: 'Physical Security',
    implementationGuidance: 'Implement media classification scheme with appropriate labeling.',
    evidenceRequirements: ['Classification scheme', 'Labeling evidence', 'Training records', 'Handling procedures'],
    testProcedures: ['Review scheme', 'Verify labeling', 'Check training', 'Examine procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.3',
    name: 'Media Sent Securely',
    description: 'Media with cardholder data sent outside the facility is secured.',
    category: 'Physical Security',
    implementationGuidance: 'Use secure courier services with tracking and recipient confirmation.',
    evidenceRequirements: ['Courier documentation', 'Tracking records', 'Confirmation records', 'Transport procedures'],
    testProcedures: ['Verify courier', 'Review tracking', 'Check confirmations', 'Examine procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.4',
    name: 'Media Distribution Approved',
    description: 'Management approves all media moved outside the facility.',
    category: 'Physical Security',
    implementationGuidance: 'Require management approval for external media movement with documentation.',
    evidenceRequirements: ['Approval process', 'Management approvals', 'Movement logs', 'Workflow documentation'],
    testProcedures: ['Review process', 'Verify approvals', 'Check logs', 'Examine workflow'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.5',
    name: 'Media Inventory Maintained',
    description: 'Inventory logs of all electronic media with cardholder data are maintained.',
    category: 'Physical Security',
    implementationGuidance: 'Maintain comprehensive media inventory with location and custodian.',
    evidenceRequirements: ['Media inventory', 'Content requirements', 'Update procedures', 'Custodian assignments'],
    testProcedures: ['Review inventory', 'Verify content', 'Check procedures', 'Examine assignments'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.6',
    name: 'Hard-Copy Materials Destroyed',
    description: 'Hard-copy materials with cardholder data are destroyed when no longer needed.',
    category: 'Physical Security',
    implementationGuidance: 'Implement secure destruction using cross-cut shredding or incineration.',
    evidenceRequirements: ['Destruction procedures', 'Method specifications', 'Destruction logs', 'Retention schedules'],
    testProcedures: ['Review procedures', 'Verify methods', 'Check logs', 'Examine schedules'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.4.7',
    name: 'Electronic Media Destroyed',
    description: 'Electronic media with cardholder data is destroyed when no longer needed.',
    category: 'Physical Security',
    implementationGuidance: 'Use degaussing, physical destruction, or secure erasure for media.',
    evidenceRequirements: ['Destruction procedures', 'Method documentation', 'Destruction logs', 'Certificates'],
    testProcedures: ['Review procedures', 'Verify methods', 'Check logs', 'Examine certificates'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.5.1',
    name: 'POI Devices Protected',
    description: 'POI devices are protected from tampering and unauthorized substitution.',
    category: 'Physical Security',
    implementationGuidance: 'Implement POI device protection with regular inspections and training.',
    evidenceRequirements: ['Protection procedures', 'Inspection records', 'Training records', 'Tampering indicators'],
    testProcedures: ['Review procedures', 'Verify inspections', 'Check training', 'Examine indicators'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.5.1.1',
    name: 'POI Device Inventory',
    description: 'An up-to-date list of POI devices is maintained.',
    category: 'Physical Security',
    implementationGuidance: 'Maintain POI inventory with make, model, serial number, and location.',
    evidenceRequirements: ['POI inventory', 'Device details', 'Update records', 'Location tracking'],
    testProcedures: ['Review inventory', 'Verify details', 'Check updates', 'Confirm locations'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.5.1.2',
    name: 'POI Devices Inspected',
    description: 'POI device surfaces are periodically inspected for tampering.',
    category: 'Physical Security',
    implementationGuidance: 'Conduct periodic visual inspections with documented results.',
    evidenceRequirements: ['Inspection schedule', 'Checklists', 'Result records', 'Training records'],
    testProcedures: ['Verify schedule', 'Review checklists', 'Check results', 'Examine training'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-9.5.1.3',
    name: 'POI Personnel Trained',
    description: 'Personnel in POI environments are trained on tampering awareness.',
    category: 'Physical Security',
    implementationGuidance: 'Provide training on POI tampering indicators and device substitution.',
    evidenceRequirements: ['Training materials', 'Completion records', 'Indicator documentation', 'Training schedule'],
    testProcedures: ['Review materials', 'Verify completion', 'Check indicators', 'Examine schedule'],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 10 - Logging and Monitoring (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-10.1.1',
    name: 'Logging Policies Documented',
    description: 'All security policies for logging and monitoring are documented.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Develop comprehensive logging policies covering content, retention, and review.',
    evidenceRequirements: ['Logging policies', 'Policy reviews', 'Training records', 'Acknowledgments'],
    testProcedures: ['Review policies', 'Verify currency', 'Interview personnel', 'Examine training'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.1.2',
    name: 'Logging Roles Defined',
    description: 'Roles and responsibilities for logging are documented and assigned.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Define roles for log management and incident response.',
    evidenceRequirements: ['Role documentation', 'Personnel assignments', 'Training records', 'Team structure'],
    testProcedures: ['Review roles', 'Verify assignments', 'Interview personnel', 'Examine structure'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.1',
    name: 'Audit Logs Enabled',
    description: 'Audit logs are enabled for all system components and cardholder data.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Enable audit logging on all CDE components for security events.',
    evidenceRequirements: ['Log configurations', 'Enablement evidence', 'Coverage documentation', 'Verification records'],
    testProcedures: ['Verify logging', 'Test generation', 'Check coverage', 'Review records'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.1.1',
    name: 'User Access Logged',
    description: 'All individual user access to cardholder data is logged.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure logging for all user access including success and failure.',
    evidenceRequirements: ['Access logging configs', 'Sample logs', 'Content verification', 'Access coverage'],
    testProcedures: ['Verify configurations', 'Review logs', 'Check content', 'Test coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.1.2',
    name: 'Administrative Actions Logged',
    description: 'All actions by administrators are logged.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure logging for all administrative actions and configuration changes.',
    evidenceRequirements: ['Admin logging configs', 'Sample logs', 'Content requirements', 'Action coverage'],
    testProcedures: ['Verify admin logging', 'Review logs', 'Check content', 'Test coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.1.3',
    name: 'Log Access Logged',
    description: 'All access to audit logs is logged.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure logging for access to log files including all operations.',
    evidenceRequirements: ['Log access configs', 'Sample events', 'Access type coverage', 'Access controls'],
    testProcedures: ['Verify log access logging', 'Review events', 'Check coverage', 'Test controls'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.1.4',
    name: 'Invalid Access Logged',
    description: 'All invalid logical access attempts are logged.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure logging for failed authentication with alerting.',
    evidenceRequirements: ['Invalid access configs', 'Sample logs', 'Alerting configs', 'Source identification'],
    testProcedures: ['Verify logging', 'Review logs', 'Test alerting', 'Check source capture'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.1.5',
    name: 'Authentication Changes Logged',
    description: 'All changes to authentication credentials are logged.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Log credential creation, modification, and deletion.',
    evidenceRequirements: ['Credential change logging', 'Sample logs', 'Change coverage', 'Admin identification'],
    testProcedures: ['Verify logging', 'Review logs', 'Check coverage', 'Test admin capture'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.2.2',
    name: 'Log Content Requirements',
    description: 'Audit logs record required information for each event.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure logs to include user ID, event type, date/time, success/failure.',
    evidenceRequirements: ['Content configs', 'Sample logs', 'Content checklist', 'Compliance verification'],
    testProcedures: ['Verify content', 'Review logs', 'Check fields', 'Test completeness'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.3.1',
    name: 'Daily Log Review',
    description: 'Security event logs are reviewed at least daily.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Implement daily log review with automated analysis tools.',
    evidenceRequirements: ['Review procedures', 'Completion records', 'Analysis configs', 'Findings documentation'],
    testProcedures: ['Verify procedures', 'Check records', 'Test analysis', 'Review findings'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.3.2',
    name: 'Automated Log Review',
    description: 'Automated mechanisms perform audit log reviews.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Deploy SIEM with automated correlation and alerting.',
    evidenceRequirements: ['SIEM deployment', 'Correlation rules', 'Alert configs', 'Tuning documentation'],
    testProcedures: ['Verify deployment', 'Review rules', 'Test alerting', 'Examine tuning'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.3.3',
    name: 'Exceptions Addressed',
    description: 'Exceptions and anomalies from log review are addressed.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Implement exception handling with escalation and tracking.',
    evidenceRequirements: ['Exception procedures', 'Escalation procedures', 'Remediation tracking', 'Resolution documentation'],
    testProcedures: ['Review procedures', 'Verify escalation', 'Check tracking', 'Examine resolution'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.4.1',
    name: 'Security Control Failure Detection',
    description: 'Failures of critical security controls are detected and alerted.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Implement automated detection for security control failures.',
    evidenceRequirements: ['Detection configs', 'Alert configs', 'Response procedures', 'Test records'],
    testProcedures: ['Verify detection', 'Test alerting', 'Review procedures', 'Examine tests'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.4.2',
    name: 'Failure Response',
    description: 'Security control failures are addressed promptly.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Implement incident response for control failures with tracking.',
    evidenceRequirements: ['Response procedures', 'Tracking records', 'Resolution documentation', 'Response metrics'],
    testProcedures: ['Review procedures', 'Verify tracking', 'Check resolution', 'Examine metrics'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.5.1',
    name: 'Log History Retained',
    description: 'Audit log history is retained for at least 12 months.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure 12-month retention with 3 months immediately available.',
    evidenceRequirements: ['Retention configs', 'Availability documentation', 'Archival procedures', 'Compliance verification'],
    testProcedures: ['Verify retention', 'Test availability', 'Review archival', 'Check compliance'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.6.1',
    name: 'Time Synchronization',
    description: 'System clocks are synchronized using time-synchronization technology.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Deploy NTP for time synchronization across all systems.',
    evidenceRequirements: ['Sync configs', 'NTP documentation', 'Coverage evidence', 'Monitoring records'],
    testProcedures: ['Verify sync', 'Check NTP', 'Test coverage', 'Review monitoring'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.6.2',
    name: 'Time Data Protected',
    description: 'Time data is protected from unauthorized modification.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Restrict access to time configuration with change logging.',
    evidenceRequirements: ['Access controls', 'Change logs', 'Monitoring configs', 'Access restrictions'],
    testProcedures: ['Verify controls', 'Review logs', 'Test monitoring', 'Check restrictions'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.6.3',
    name: 'Industry-Accepted Time Sources',
    description: 'Time settings are received from industry-accepted sources.',
    category: 'Logging and Monitoring',
    implementationGuidance: 'Configure synchronization to authoritative time sources.',
    evidenceRequirements: ['Source configs', 'Authoritative source docs', 'Redundancy configs', 'Source rationale'],
    testProcedures: ['Verify sources', 'Check authoritative', 'Test redundancy', 'Review rationale'],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 11 - Security Testing (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-11.1.1',
    name: 'Security Testing Policies Documented',
    description: 'All security policies for security testing are documented.',
    category: 'Security Testing',
    implementationGuidance: 'Develop comprehensive security testing policies covering vulnerability scanning and penetration testing.',
    evidenceRequirements: ['Testing policies', 'Policy reviews', 'Training records', 'Acknowledgments'],
    testProcedures: ['Review policies', 'Verify currency', 'Interview personnel', 'Examine training'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.1.2',
    name: 'Security Testing Roles Defined',
    description: 'Roles for security testing are documented and assigned.',
    category: 'Security Testing',
    implementationGuidance: 'Define roles for vulnerability management and penetration testing.',
    evidenceRequirements: ['Role documentation', 'Personnel assignments', 'Training records', 'Team structure'],
    testProcedures: ['Review roles', 'Verify assignments', 'Interview personnel', 'Examine structure'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.2.1',
    name: 'Wireless Access Points Detected',
    description: 'Authorized and unauthorized wireless access points are managed.',
    category: 'Security Testing',
    implementationGuidance: 'Implement wireless AP detection through scanning or monitoring.',
    evidenceRequirements: ['Detection methods', 'Authorized AP inventory', 'Scan results', 'Unauthorized AP procedures'],
    testProcedures: ['Verify detection', 'Review inventory', 'Examine scans', 'Check procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.2.2',
    name: 'Wireless AP Inventory Maintained',
    description: 'An inventory of authorized wireless access points is maintained.',
    category: 'Security Testing',
    implementationGuidance: 'Maintain inventory with business justification for each AP.',
    evidenceRequirements: ['AP inventory', 'Business justification', 'Update procedures', 'Approval records'],
    testProcedures: ['Review inventory', 'Verify justification', 'Check procedures', 'Examine approvals'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.3.1',
    name: 'Internal Vulnerability Scans',
    description: 'Internal vulnerability scans are performed at least quarterly.',
    category: 'Security Testing',
    implementationGuidance: 'Perform quarterly internal vulnerability scans with remediation.',
    evidenceRequirements: ['Scan schedule', 'Scan results', 'Remediation records', 'Rescan evidence'],
    testProcedures: ['Verify schedule', 'Review results', 'Check remediation', 'Examine rescans'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.3.1.1',
    name: 'High-Risk Vulnerabilities Addressed',
    description: 'High-risk and critical vulnerabilities are addressed.',
    category: 'Security Testing',
    implementationGuidance: 'Prioritize and remediate high-risk vulnerabilities promptly.',
    evidenceRequirements: ['Vulnerability rankings', 'Remediation timelines', 'Completion records', 'Risk acceptance docs'],
    testProcedures: ['Review rankings', 'Verify timelines', 'Check completion', 'Examine acceptances'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.3.2',
    name: 'External Vulnerability Scans',
    description: 'External vulnerability scans are performed quarterly by ASV.',
    category: 'Security Testing',
    implementationGuidance: 'Perform quarterly external scans by PCI-approved ASV.',
    evidenceRequirements: ['ASV attestations', 'Scan schedule', 'Passing scans', 'Remediation records'],
    testProcedures: ['Verify ASV approval', 'Check schedule', 'Review passing scans', 'Examine remediation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.1',
    name: 'Penetration Testing Performed',
    description: 'External and internal penetration testing is performed.',
    category: 'Security Testing',
    implementationGuidance: 'Perform annual penetration testing covering network and application layers.',
    evidenceRequirements: ['Pen test methodology', 'Test reports', 'Remediation records', 'Retest results'],
    testProcedures: ['Review methodology', 'Examine reports', 'Verify remediation', 'Check retests'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.2',
    name: 'Internal Penetration Testing',
    description: 'Internal penetration testing is performed at least annually.',
    category: 'Security Testing',
    implementationGuidance: 'Perform internal penetration testing annually and after significant changes.',
    evidenceRequirements: ['Internal pen test reports', 'Annual schedule', 'Scope documentation', 'Findings remediation'],
    testProcedures: ['Review reports', 'Verify schedule', 'Check scope', 'Examine remediation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.3',
    name: 'External Penetration Testing',
    description: 'External penetration testing is performed at least annually.',
    category: 'Security Testing',
    implementationGuidance: 'Perform external penetration testing annually and after changes.',
    evidenceRequirements: ['External pen test reports', 'Annual schedule', 'Scope documentation', 'Findings remediation'],
    testProcedures: ['Review reports', 'Verify schedule', 'Check scope', 'Examine remediation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.4',
    name: 'Penetration Testing Findings Corrected',
    description: 'Exploitable vulnerabilities found during penetration testing are corrected.',
    category: 'Security Testing',
    implementationGuidance: 'Remediate penetration testing findings and verify through retesting.',
    evidenceRequirements: ['Finding reports', 'Remediation plans', 'Correction evidence', 'Retest results'],
    testProcedures: ['Review findings', 'Verify plans', 'Check corrections', 'Examine retests'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.5',
    name: 'Segmentation Testing',
    description: 'Segmentation controls are verified through penetration testing.',
    category: 'Security Testing',
    implementationGuidance: 'Test segmentation effectiveness at least annually.',
    evidenceRequirements: ['Segmentation test methodology', 'Test results', 'Scope of testing', 'Effectiveness evidence'],
    testProcedures: ['Review methodology', 'Examine results', 'Verify scope', 'Check effectiveness'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.5.1',
    name: 'Change Detection Mechanisms',
    description: 'Change detection mechanisms are deployed to alert on unauthorized modifications.',
    category: 'Security Testing',
    implementationGuidance: 'Deploy file integrity monitoring on critical files.',
    evidenceRequirements: ['FIM deployment', 'Monitored file list', 'Alert configurations', 'Response procedures'],
    testProcedures: ['Verify deployment', 'Review file list', 'Test alerting', 'Check procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.5.2',
    name: 'Change Detection Weekly Comparison',
    description: 'Change detection performs critical file comparisons at least weekly.',
    category: 'Security Testing',
    implementationGuidance: 'Configure FIM to compare critical files at least weekly.',
    evidenceRequirements: ['Comparison schedule', 'FIM configurations', 'Comparison reports', 'Exception handling'],
    testProcedures: ['Verify schedule', 'Review configurations', 'Examine reports', 'Check exceptions'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.6.1',
    name: 'Payment Page Change Detection',
    description: 'A change and tamper detection mechanism is deployed for payment pages.',
    category: 'Security Testing',
    implementationGuidance: 'Deploy mechanisms to detect unauthorized changes to payment pages.',
    evidenceRequirements: ['Detection mechanism deployment', 'Payment page inventory', 'Alert configurations', 'Response procedures'],
    testProcedures: ['Verify deployment', 'Review inventory', 'Test alerting', 'Check procedures'],
    status: 'Not Started',
  },
  // ============================================================
  // PCI DSS v4.0 Requirement 12 - Security Governance (Sub-requirements)
  // ============================================================
  {
    controlId: 'PCI-12.1.1',
    name: 'Information Security Policy Established',
    description: 'An overall information security policy is established, published, and maintained.',
    category: 'Security Governance',
    implementationGuidance: 'Develop comprehensive information security policy reviewed annually.',
    evidenceRequirements: ['Security policy document', 'Publication evidence', 'Annual review records', 'Approval documentation'],
    testProcedures: ['Review policy', 'Verify publication', 'Check annual reviews', 'Examine approvals'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.1.2',
    name: 'Security Policy Reviewed Annually',
    description: 'The information security policy is reviewed at least annually.',
    category: 'Security Governance',
    implementationGuidance: 'Establish annual policy review process with documented updates.',
    evidenceRequirements: ['Review schedule', 'Review records', 'Update documentation', 'Approval records'],
    testProcedures: ['Verify schedule', 'Examine reviews', 'Check updates', 'Review approvals'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.1.3',
    name: 'Security Roles Defined in Policy',
    description: 'Security roles and responsibilities are defined in the policy.',
    category: 'Security Governance',
    implementationGuidance: 'Document all security roles and responsibilities in policy.',
    evidenceRequirements: ['Role definitions in policy', 'Responsibility assignments', 'Organizational chart', 'Accountability documentation'],
    testProcedures: ['Review role definitions', 'Verify assignments', 'Check org chart', 'Examine accountability'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.1.4',
    name: 'Security Responsibility Assigned',
    description: 'Information security responsibility is formally assigned to a CISO or equivalent.',
    category: 'Security Governance',
    implementationGuidance: 'Appoint CISO or equivalent with documented responsibilities.',
    evidenceRequirements: ['CISO appointment', 'Job description', 'Reporting structure', 'Authority documentation'],
    testProcedures: ['Verify appointment', 'Review job description', 'Check reporting', 'Examine authority'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.2.1',
    name: 'Acceptable Use Policies',
    description: 'Acceptable use policies for end-user technologies are documented and implemented.',
    category: 'Security Governance',
    implementationGuidance: 'Develop acceptable use policies for all end-user technologies.',
    evidenceRequirements: ['Acceptable use policies', 'Technology coverage', 'User acknowledgments', 'Enforcement procedures'],
    testProcedures: ['Review policies', 'Verify coverage', 'Check acknowledgments', 'Examine enforcement'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.3.1',
    name: 'Targeted Risk Analysis Performed',
    description: 'A targeted risk analysis is performed for each PCI DSS requirement with flexibility.',
    category: 'Security Governance',
    implementationGuidance: 'Perform targeted risk analysis for applicable requirements.',
    evidenceRequirements: ['Risk analysis documentation', 'Requirement coverage', 'Risk decisions', 'Review records'],
    testProcedures: ['Review analysis', 'Verify coverage', 'Check decisions', 'Examine reviews'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.3.2',
    name: 'Risk Analysis Documentation',
    description: 'Targeted risk analyses are documented.',
    category: 'Security Governance',
    implementationGuidance: 'Document all risk analysis including methodology and results.',
    evidenceRequirements: ['Risk analysis documentation', 'Methodology documentation', 'Results documentation', 'Approval records'],
    testProcedures: ['Review documentation', 'Verify methodology', 'Check results', 'Examine approvals'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.5.1',
    name: 'PCI DSS Scope Documented',
    description: 'An inventory of system components in scope for PCI DSS is maintained.',
    category: 'Security Governance',
    implementationGuidance: 'Maintain comprehensive inventory of all in-scope system components.',
    evidenceRequirements: ['Scope inventory', 'Component classifications', 'Update procedures', 'Scope documentation'],
    testProcedures: ['Review inventory', 'Verify classifications', 'Check procedures', 'Examine documentation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.5.2',
    name: 'PCI DSS Scope Reviewed',
    description: 'PCI DSS scope is documented and confirmed at least annually.',
    category: 'Security Governance',
    implementationGuidance: 'Review and confirm PCI DSS scope at least annually.',
    evidenceRequirements: ['Annual scope review', 'Confirmation documentation', 'Scope changes', 'Approval records'],
    testProcedures: ['Verify annual review', 'Check confirmation', 'Review changes', 'Examine approvals'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.6.1',
    name: 'Security Awareness Program',
    description: 'A formal security awareness program is implemented.',
    category: 'Security Governance',
    implementationGuidance: 'Implement comprehensive security awareness training program.',
    evidenceRequirements: ['Awareness program documentation', 'Training materials', 'Delivery schedule', 'Completion tracking'],
    testProcedures: ['Review program', 'Examine materials', 'Check schedule', 'Verify tracking'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.6.2',
    name: 'Security Awareness Training',
    description: 'Personnel receive security awareness training upon hire and annually.',
    category: 'Security Governance',
    implementationGuidance: 'Provide security training at hire and at least annually thereafter.',
    evidenceRequirements: ['Training schedule', 'Completion records', 'Training content', 'New hire procedures'],
    testProcedures: ['Verify schedule', 'Review records', 'Examine content', 'Check new hire process'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.6.3',
    name: 'Security Awareness Content',
    description: 'Security awareness training includes threats and data protection responsibilities.',
    category: 'Security Governance',
    implementationGuidance: 'Include current threats, social engineering, and PCI DSS responsibilities.',
    evidenceRequirements: ['Training content', 'Threat coverage', 'PCI DSS content', 'Content updates'],
    testProcedures: ['Review content', 'Verify threat coverage', 'Check PCI coverage', 'Examine updates'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.7.1',
    name: 'Personnel Screening',
    description: 'Personnel with access to CDE are screened prior to hire.',
    category: 'Security Governance',
    implementationGuidance: 'Conduct background screening for personnel with CDE access.',
    evidenceRequirements: ['Screening policy', 'Screening records', 'Verification procedures', 'Screening coverage'],
    testProcedures: ['Review policy', 'Examine records', 'Check procedures', 'Verify coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.8.1',
    name: 'Service Provider Inventory',
    description: 'A list of service providers with cardholder data access is maintained.',
    category: 'Security Governance',
    implementationGuidance: 'Maintain inventory of all service providers handling cardholder data.',
    evidenceRequirements: ['Service provider list', 'Services description', 'Data access documentation', 'Update procedures'],
    testProcedures: ['Review list', 'Verify services', 'Check data access', 'Examine procedures'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.8.2',
    name: 'Service Provider Agreements',
    description: 'Written agreements with service providers include PCI DSS responsibilities.',
    category: 'Security Governance',
    implementationGuidance: 'Include PCI DSS compliance responsibilities in all service provider agreements.',
    evidenceRequirements: ['Service agreements', 'PCI DSS language', 'Responsibility matrix', 'Agreement reviews'],
    testProcedures: ['Review agreements', 'Verify language', 'Check matrix', 'Examine reviews'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.8.3',
    name: 'Service Provider Due Diligence',
    description: 'Due diligence is performed prior to engaging service providers.',
    category: 'Security Governance',
    implementationGuidance: 'Conduct due diligence on service providers including PCI DSS compliance status.',
    evidenceRequirements: ['Due diligence procedures', 'Assessment records', 'Compliance verification', 'Risk assessments'],
    testProcedures: ['Review procedures', 'Examine records', 'Verify compliance', 'Check assessments'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.8.4',
    name: 'Service Provider Monitoring',
    description: 'Service providers PCI DSS compliance status is monitored annually.',
    category: 'Security Governance',
    implementationGuidance: 'Monitor service provider compliance at least annually.',
    evidenceRequirements: ['Monitoring procedures', 'Annual status records', 'Compliance documentation', 'Follow-up records'],
    testProcedures: ['Review procedures', 'Verify status records', 'Check compliance', 'Examine follow-up'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.8.5',
    name: 'Service Provider Responsibility Matrix',
    description: 'Information about PCI DSS responsibilities is maintained for each service provider.',
    category: 'Security Governance',
    implementationGuidance: 'Maintain clear documentation of shared PCI DSS responsibilities.',
    evidenceRequirements: ['Responsibility matrices', 'Requirement mapping', 'Update procedures', 'Provider acknowledgments'],
    testProcedures: ['Review matrices', 'Verify mapping', 'Check procedures', 'Examine acknowledgments'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.9.1',
    name: 'Service Provider Acknowledgment',
    description: 'Service providers acknowledge responsibility for cardholder data security.',
    category: 'Security Governance',
    implementationGuidance: 'Obtain written acknowledgment of data security responsibility from providers.',
    evidenceRequirements: ['Acknowledgment documents', 'Provider coverage', 'Responsibility statements', 'Annual updates'],
    testProcedures: ['Review acknowledgments', 'Verify coverage', 'Check statements', 'Examine updates'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.1',
    name: 'Incident Response Plan',
    description: 'An incident response plan exists and is ready to be activated.',
    category: 'Security Governance',
    implementationGuidance: 'Develop comprehensive incident response plan covering all required elements.',
    evidenceRequirements: ['Incident response plan', 'Contact lists', 'Procedures documentation', 'Activation criteria'],
    testProcedures: ['Review plan', 'Verify contacts', 'Check procedures', 'Examine criteria'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.2',
    name: 'Incident Response Plan Reviewed',
    description: 'The incident response plan is reviewed and updated at least annually.',
    category: 'Security Governance',
    implementationGuidance: 'Review and update incident response plan at least annually.',
    evidenceRequirements: ['Annual review records', 'Update documentation', 'Approval records', 'Change history'],
    testProcedures: ['Verify annual review', 'Check updates', 'Review approvals', 'Examine history'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.3',
    name: 'Incident Response Team',
    description: 'Specific personnel are designated to be available for incident response.',
    category: 'Security Governance',
    implementationGuidance: 'Designate incident response team with 24/7 availability.',
    evidenceRequirements: ['Team roster', 'Contact information', 'Availability schedules', 'Escalation procedures'],
    testProcedures: ['Review roster', 'Verify contacts', 'Check availability', 'Examine escalation'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.4',
    name: 'Incident Response Training',
    description: 'Incident response personnel are trained appropriately.',
    category: 'Security Governance',
    implementationGuidance: 'Provide regular training for all incident response team members.',
    evidenceRequirements: ['Training records', 'Training content', 'Completion tracking', 'Skill assessments'],
    testProcedures: ['Review records', 'Examine content', 'Check tracking', 'Verify assessments'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.5',
    name: 'Incident Response Plan Includes Alerts',
    description: 'The incident response plan includes response to alerts from security monitoring.',
    category: 'Security Governance',
    implementationGuidance: 'Include alert response procedures in incident response plan.',
    evidenceRequirements: ['Alert response procedures', 'Monitoring integration', 'Response workflows', 'Alert types covered'],
    testProcedures: ['Review procedures', 'Verify integration', 'Check workflows', 'Examine coverage'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.6',
    name: 'Incident Response Plan Tested',
    description: 'The incident response plan is tested at least annually.',
    category: 'Security Governance',
    implementationGuidance: 'Conduct annual incident response exercises or tabletop tests.',
    evidenceRequirements: ['Test schedule', 'Test documentation', 'Lessons learned', 'Plan updates from testing'],
    testProcedures: ['Verify schedule', 'Review documentation', 'Check lessons', 'Examine updates'],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.10.7',
    name: 'Incident Response Procedures for Common Events',
    description: 'Incident response procedures exist for common security events.',
    category: 'Security Governance',
    implementationGuidance: 'Develop specific procedures for common incident types.',
    evidenceRequirements: ['Event-specific procedures', 'Common event coverage', 'Response workflows', 'Playbook documentation'],
    testProcedures: ['Review procedures', 'Verify coverage', 'Check workflows', 'Examine playbooks'],
    status: 'Not Started',
  },

  // ============================================================
  // Additional PCI DSS v4.0 Sub-Requirements - Requirement 8
  // ============================================================
  {
    controlId: 'PCI-8.2.3',
    name: 'Invalid Authentication Attempts Handled',
    description: 'Invalid authentication attempts are limited by locking out the user ID after not more than 10 attempts, setting the lockout duration to a minimum of 30 minutes or until the user\'s identity is confirmed.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Configure all authentication systems to lock accounts after a maximum of 10 invalid login attempts. Set lockout duration to at least 30 minutes or require administrator intervention to unlock. Implement incremental lockout policies where appropriate. Log all lockout events and alert on patterns that may indicate brute force attacks. Consider implementing CAPTCHA or other bot protection mechanisms in addition to lockout policies.',
    evidenceRequirements: [
      'Authentication system lockout configuration settings',
      'Lockout policy documentation specifying threshold and duration',
      'Lockout event logs and monitoring configuration',
      'Alert configuration for brute force attack detection',
      'Testing records demonstrating lockout enforcement'
    ],
    testProcedures: [
      'Examine authentication system configurations for lockout settings',
      'Verify lockout threshold is set to 10 or fewer invalid attempts',
      'Confirm lockout duration is at least 30 minutes',
      'Attempt multiple invalid logins and verify account lockout occurs',
      'Review lockout event logs and alert configurations'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.3',
    name: 'Password/Passphrase Set as Authentication Factor',
    description: 'If passwords/passphrases are used as an authentication factor, they meet minimum complexity requirements including length and character types.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Configure password policies to require minimum length of 12 characters (or 8 if system limitations exist) with both alphabetic and numeric characters. Implement password complexity validators that prevent common passwords, dictionary words, and sequential characters. Consider implementing passphrase support for improved security and usability. Provide password strength meters during password creation. Document any systems with technical limitations that prevent full compliance.',
    evidenceRequirements: [
      'Password policy configuration across all systems',
      'Password complexity requirements documentation',
      'Password validator and strength checker implementations',
      'Documentation of systems with technical limitations',
      'Testing results for password policy enforcement'
    ],
    testProcedures: [
      'Examine password policy configurations on authentication systems',
      'Verify minimum password length meets requirements',
      'Test password creation with non-compliant passwords',
      'Review documentation for systems with limitations',
      'Confirm password complexity validators are functional'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.8',
    name: 'Authentication Policies for Application and System Accounts',
    description: 'Authentication policies and procedures are documented and implemented for application and system accounts, including guidance for selecting strong passwords.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Develop specific authentication policies for application and system accounts that address password complexity, rotation schedules, secure storage, and access controls. Require unique, strong passwords for each application and system account. Implement automated password rotation where possible. Store service account credentials securely using secret management solutions. Document approval requirements for service account creation and password access.',
    evidenceRequirements: [
      'Application and system account authentication policy',
      'Password selection guidance for service accounts',
      'Secret management solution deployment evidence',
      'Automated password rotation configuration',
      'Service account approval and access control procedures'
    ],
    testProcedures: [
      'Examine authentication policies for application/system accounts',
      'Verify password guidance addresses complexity requirements',
      'Review secret management implementation',
      'Verify password rotation is performed per policy',
      'Examine approval records for service account credentials'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.9',
    name: 'Unique Passwords for Application and System Accounts',
    description: 'If passwords/passphrases are the only authentication factor for application and system accounts, passwords are changed periodically and in accordance with targeted risk analysis.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Implement password rotation schedules for all application and system accounts based on risk analysis. Higher risk accounts should have more frequent rotation. Use automated rotation mechanisms where possible. Implement password vaults with audit logging for manual rotations. Define clear procedures for emergency password changes when compromise is suspected. Track and report on rotation compliance.',
    evidenceRequirements: [
      'Risk analysis for password rotation frequency',
      'Password rotation schedule and tracking',
      'Automated rotation tool configurations',
      'Password vault audit logs showing rotations',
      'Emergency password change procedures'
    ],
    testProcedures: [
      'Review risk analysis supporting rotation frequency',
      'Verify rotation schedule aligns with risk analysis',
      'Examine automated rotation configurations',
      'Review audit logs for recent password rotations',
      'Test emergency password change procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.10',
    name: 'Additional Authentication Controls for Service Providers',
    description: 'For service providers only: If passwords/passphrases are the only authentication factor for customer user access, guidance is provided to customers regarding requirements for strong passwords.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Service providers must provide clear guidance to customers on password requirements and best practices. Create customer-facing documentation explaining password complexity requirements, recommended password managers, and multi-factor authentication options. Implement technical controls to enforce password requirements. Provide self-service password reset with identity verification. Consider offering MFA as an upgrade option.',
    evidenceRequirements: [
      'Customer password guidance documentation',
      'Technical enforcement of password requirements',
      'Self-service password reset procedures',
      'MFA offering documentation',
      'Customer communication records on password security'
    ],
    testProcedures: [
      'Review customer password guidance documentation',
      'Verify technical controls enforce password requirements',
      'Test self-service password reset process',
      'Verify MFA options are communicated to customers',
      'Examine customer communication records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.10.1',
    name: 'Service Provider Customer Password Changes',
    description: 'For service providers only: If passwords/passphrases are the only authentication factor for customer user access, passwords/passphrases are changed at least every 90 days, or access is managed via dynamic analysis of security posture.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Implement mandatory password changes for customer accounts at least every 90 days if password is the only authentication factor. Alternatively, implement a dynamic analysis system that considers factors such as compromise indicators, password strength, and user behavior to determine when password changes are required. Notify customers before password expiration. Provide secure password change mechanisms.',
    evidenceRequirements: [
      'Password expiration policy configuration (90 days or less)',
      'Dynamic analysis system documentation if used',
      'Customer notification system for password expiration',
      'Password change mechanism security assessment',
      'Compliance reporting for password age'
    ],
    testProcedures: [
      'Examine password expiration configuration',
      'Verify 90-day maximum or dynamic analysis implementation',
      'Test customer notification process',
      'Review password change mechanism security',
      'Verify compliance reporting accuracy'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-8.3.11',
    name: 'Re-authentication When Authentication Factors Change',
    description: 'If an authentication factor is changed or reset, and the request was made by a user, the user\'s identity is verified before the change is made.',
    category: 'User Identification and Authentication',
    implementationGuidance: 'Implement identity verification procedures for all authentication factor changes including password resets, MFA device enrollment, and security question changes. Use out-of-band verification methods such as SMS, email to verified addresses, or callback to verified phone numbers. Require multiple verification factors for high-risk changes. Log all authentication factor changes with verification method used. Train support personnel on social engineering prevention.',
    evidenceRequirements: [
      'Identity verification procedures for authentication changes',
      'Out-of-band verification method documentation',
      'High-risk change approval procedures',
      'Audit logs of authentication factor changes',
      'Support personnel training records'
    ],
    testProcedures: [
      'Review identity verification procedures',
      'Test out-of-band verification mechanisms',
      'Verify high-risk changes require additional approval',
      'Examine audit logs for factor change events',
      'Interview support personnel on verification procedures'
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Additional PCI DSS v4.0 Sub-Requirements - Requirement 10
  // ============================================================
  {
    controlId: 'PCI-10.4.1.1',
    name: 'Automated Log Review Mechanisms',
    description: 'Automated mechanisms are used to perform audit log reviews, with manual review of logs that cannot be reviewed by automated mechanisms.',
    category: 'Log and Monitor All Access',
    implementationGuidance: 'Deploy SIEM or log analysis tools with automated correlation rules and anomaly detection. Configure automated alerts for security events requiring immediate attention. Define manual review procedures for log types that cannot be effectively analyzed by automated tools. Document the rationale for manual vs automated review for each log type. Tune automated detection to reduce false positives while maintaining detection effectiveness.',
    evidenceRequirements: [
      'SIEM or automated log analysis tool deployment',
      'Automated correlation rules and alert configurations',
      'Manual review procedures for non-automated logs',
      'Documentation of log review method selection rationale',
      'False positive tuning records and effectiveness metrics'
    ],
    testProcedures: [
      'Examine automated log analysis tool configurations',
      'Verify correlation rules detect security events',
      'Review manual log review procedures and records',
      'Examine rationale for manual vs automated selection',
      'Review alert tuning and false positive rates'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.4.2.1',
    name: 'Targeted Risk Analysis for Log Review Frequency',
    description: 'A targeted risk analysis is performed to determine the frequency of log reviews for all other system components not defined in Requirement 10.4.1.',
    category: 'Log and Monitor All Access',
    implementationGuidance: 'Conduct a risk analysis to determine appropriate log review frequency for system components beyond those requiring daily review. Consider factors such as criticality of the system, sensitivity of data processed, threat exposure, and historical incident patterns. Document review frequencies ranging from daily to weekly based on risk level. Re-evaluate frequencies when risk factors change.',
    evidenceRequirements: [
      'Risk analysis methodology for log review frequency',
      'System component risk classifications',
      'Documented review frequencies by risk level',
      'Review schedule implementation evidence',
      'Risk re-evaluation records'
    ],
    testProcedures: [
      'Examine risk analysis methodology',
      'Verify risk classifications for all system components',
      'Review documented review frequencies',
      'Verify actual review schedule matches documented frequencies',
      'Examine risk re-evaluation records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.4.3',
    name: 'Log Review Exceptions and Anomalies Addressed',
    description: 'Exceptions and anomalies identified during the log review process are addressed through investigation and documented resolution.',
    category: 'Log and Monitor All Access',
    implementationGuidance: 'Establish procedures for investigating and resolving exceptions and anomalies identified during log reviews. Define escalation procedures based on severity. Document all investigations including findings, root cause analysis, and remediation actions. Track exception resolution through completion. Maintain metrics on exception types and resolution times. Feed findings back into detection tuning.',
    evidenceRequirements: [
      'Exception investigation procedures',
      'Escalation matrix by severity',
      'Investigation documentation and resolution records',
      'Exception tracking and metrics',
      'Detection tuning records based on findings'
    ],
    testProcedures: [
      'Examine exception investigation procedures',
      'Verify escalation matrix is current',
      'Review investigation documentation for completeness',
      'Examine exception tracking metrics',
      'Verify detection tuning incorporates lessons learned'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.7.1',
    name: 'Critical Security Control System Failures Detected',
    description: 'Additional requirement for service providers: Failures of critical security control systems are detected, alerted, and addressed promptly.',
    category: 'Log and Monitor All Access',
    implementationGuidance: 'Implement comprehensive monitoring for all critical security control systems including firewalls, IDS/IPS, antimalware, FIM, physical access controls, logical access controls, audit logging, and network segmentation. Configure real-time alerting for failures with appropriate severity levels. Define critical security control inventory and ensure each is monitored. Integrate monitoring into NOC/SOC operations.',
    evidenceRequirements: [
      'Critical security control system inventory',
      'Monitoring configuration for each control system',
      'Real-time alerting configuration and notification procedures',
      'NOC/SOC integration documentation',
      'Alert response procedures for control failures'
    ],
    testProcedures: [
      'Review critical security control inventory',
      'Verify monitoring covers all critical controls',
      'Test alerting by simulating control failure',
      'Verify NOC/SOC integration is operational',
      'Review alert response procedures'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.7.2',
    name: 'Critical Security Control Failures Responded To Promptly',
    description: 'Additional requirement for service providers: Failures of critical security control systems are responded to promptly with documented processes.',
    category: 'Log and Monitor All Access',
    implementationGuidance: 'Define response time objectives for critical security control failures based on the criticality of the control. Establish incident response procedures specific to control failures. Implement compensating controls to maintain security during outages. Document all failure events, response actions, and restoration activities. Conduct post-incident reviews to prevent recurrence.',
    evidenceRequirements: [
      'Response time objectives for control failures',
      'Control failure incident response procedures',
      'Compensating control procedures during outages',
      'Failure event and response documentation',
      'Post-incident review records'
    ],
    testProcedures: [
      'Examine response time objectives',
      'Review incident response procedures for control failures',
      'Verify compensating controls are documented',
      'Review failure event documentation',
      'Examine post-incident review records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-10.7.3',
    name: 'Critical Security Control Failures Addressed',
    description: 'Additional requirement for service providers: Failures of critical security control systems result in documented generation of alerts, processes for restoring security functions, and resumption of security control monitoring.',
    category: 'Log and Monitor All Access',
    implementationGuidance: 'Implement end-to-end failure management for critical security controls from detection through restoration. Ensure alerts are generated and documented for all failures. Define restoration procedures for each control type. Verify security control functionality after restoration before resuming normal operations. Document the period during which the control was non-functional and any compensating measures applied.',
    evidenceRequirements: [
      'Alert generation and documentation procedures',
      'Restoration procedures for each control type',
      'Post-restoration verification procedures',
      'Control downtime documentation requirements',
      'Compensating measure documentation'
    ],
    testProcedures: [
      'Verify alerts are generated and documented',
      'Review restoration procedures for completeness',
      'Examine post-restoration verification records',
      'Review control downtime documentation',
      'Verify compensating measures are documented'
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Additional PCI DSS v4.0 Sub-Requirements - Requirement 11
  // ============================================================
  {
    controlId: 'PCI-11.3.1.2',
    name: 'Internal Vulnerability Scans via Authenticated Scanning',
    description: 'Internal vulnerability scans are performed via authenticated scanning with sufficient privileges to provide comprehensive vulnerability detection.',
    category: 'Test Security Regularly',
    implementationGuidance: 'Configure internal vulnerability scanners with credentials that provide sufficient access to evaluate system configurations, installed software, and security settings. Use service accounts with appropriate privileges for different system types. Implement credential management best practices for scanner accounts. Validate that authenticated scanning provides visibility into vulnerabilities that unauthenticated scanning would miss.',
    evidenceRequirements: [
      'Authenticated scanning configuration documentation',
      'Service account setup for vulnerability scanners',
      'Credential management procedures for scanner accounts',
      'Comparison of authenticated vs unauthenticated scan results',
      'Scan coverage verification reports'
    ],
    testProcedures: [
      'Examine authenticated scanning configurations',
      'Verify scanner service accounts have appropriate privileges',
      'Review credential management for scanner accounts',
      'Compare authenticated and unauthenticated scan coverage',
      'Verify all in-scope systems are scanned with authentication'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.3.1.3',
    name: 'Internal Vulnerability Scans After Significant Changes',
    description: 'Internal vulnerability scans are performed after any significant change to the environment including new system installations, changes to network topology, firewall rule modifications, and product upgrades.',
    category: 'Test Security Regularly',
    implementationGuidance: 'Define criteria for significant changes that trigger vulnerability scanning. Integrate vulnerability scanning into change management processes. Automate scan triggering where possible through CI/CD integration. Document scan results and remediation activities associated with each significant change. Track time from change to scan completion.',
    evidenceRequirements: [
      'Significant change criteria definition',
      'Change management integration procedures',
      'Automated scan triggering configuration',
      'Scan results linked to change tickets',
      'Time-to-scan metrics for significant changes'
    ],
    testProcedures: [
      'Review significant change criteria',
      'Verify change management includes scan requirements',
      'Examine automated scan triggering',
      'Review scan results for recent significant changes',
      'Verify scans occur within required timeframe'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.3.2.1',
    name: 'External Vulnerability Scans After Significant Changes',
    description: 'External vulnerability scans are performed after any significant change that could impact external-facing systems or network topology.',
    category: 'Test Security Regularly',
    implementationGuidance: 'Define significant changes affecting external attack surface that require ASV scanning. Coordinate with ASV to perform scans following significant changes. Document the change and corresponding scan results. Ensure passing scan results before considering the change complete for external-facing modifications. Track ASV scan scheduling and results.',
    evidenceRequirements: [
      'External change criteria requiring ASV scans',
      'ASV coordination procedures for change-triggered scans',
      'Change-linked ASV scan results',
      'Passing scan requirements for change completion',
      'ASV scan scheduling and tracking records'
    ],
    testProcedures: [
      'Review external change criteria',
      'Verify ASV coordination procedures',
      'Review ASV scan results for recent external changes',
      'Verify passing results before change completion',
      'Examine ASV scan scheduling records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.6',
    name: 'Penetration Testing for Service Providers',
    description: 'Additional requirement for service providers: Penetration testing is performed at least once every six months and after any significant infrastructure or application upgrade or modification.',
    category: 'Test Security Regularly',
    implementationGuidance: 'Service providers must perform penetration testing twice annually at minimum. Schedule tests to be approximately six months apart. Perform additional testing after significant changes. Ensure testing covers all service provider CDE components and network segments. Document testing scope, methodology, findings, and remediation for each test cycle.',
    evidenceRequirements: [
      'Semi-annual penetration testing schedule',
      'Penetration test reports from past 12 months (minimum 2)',
      'Change-triggered penetration test records',
      'Testing scope documentation for each test',
      'Remediation records for identified vulnerabilities'
    ],
    testProcedures: [
      'Verify penetration tests are performed semi-annually',
      'Review test reports for past 12 months',
      'Examine change-triggered test records',
      'Verify testing scope covers all CDE components',
      'Review remediation of identified vulnerabilities'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-11.4.7',
    name: 'Multi-Tenant Service Provider Penetration Testing',
    description: 'Additional requirement for multi-tenant service providers: Penetration testing confirms that controls between customers\' environments are effective and operationally secure.',
    category: 'Test Security Regularly',
    implementationGuidance: 'Include multi-tenancy controls in penetration testing scope. Test for cross-tenant data access vulnerabilities. Verify tenant isolation controls at network, application, and data layers. Test privilege escalation paths that could affect multiple tenants. Document specific multi-tenancy testing activities and results.',
    evidenceRequirements: [
      'Multi-tenancy testing scope documentation',
      'Cross-tenant isolation test results',
      'Network, application, and data layer isolation tests',
      'Privilege escalation testing results',
      'Multi-tenancy specific findings and remediation'
    ],
    testProcedures: [
      'Verify multi-tenancy controls are in penetration test scope',
      'Review cross-tenant isolation test results',
      'Examine isolation tests at each layer',
      'Review privilege escalation test results',
      'Verify multi-tenancy findings are remediated'
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Additional PCI DSS v4.0 Sub-Requirements - Requirement 12
  // ============================================================
  {
    controlId: 'PCI-12.3.3',
    name: 'Cryptographic Cipher Suites and Protocols Documented',
    description: 'Cryptographic cipher suites and protocols in use are documented, including purpose and where used, and their continued use is reviewed annually.',
    category: 'Organizational Policies',
    implementationGuidance: 'Create and maintain an inventory of all cryptographic cipher suites and protocols in use across the environment. Document the purpose, systems using each, and security strength. Review annually to identify deprecated or weakened cryptography. Plan migration paths for outdated algorithms. Include cryptographic inventory in security architecture documentation.',
    evidenceRequirements: [
      'Cryptographic cipher suite and protocol inventory',
      'Purpose and usage documentation for each',
      'Annual review records with security assessment',
      'Migration plans for deprecated cryptography',
      'Security architecture documentation'
    ],
    testProcedures: [
      'Examine cryptographic inventory for completeness',
      'Verify purpose and usage is documented',
      'Review annual assessment records',
      'Examine migration plans for deprecated algorithms',
      'Verify inventory matches actual implementations'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.3.4',
    name: 'Hardware and Software Technologies Review',
    description: 'Hardware and software technologies in use are reviewed at least annually to confirm continued support from vendors and compliance with PCI DSS requirements.',
    category: 'Organizational Policies',
    implementationGuidance: 'Maintain a comprehensive inventory of all hardware and software in the CDE. Track vendor support status and end-of-life dates for each component. Review annually to identify components approaching or past end of support. Develop upgrade or replacement plans for unsupported components. Document risk acceptance for any unsupported components that must remain in use temporarily.',
    evidenceRequirements: [
      'Hardware and software inventory with support status',
      'Vendor end-of-life tracking documentation',
      'Annual review records of technology support status',
      'Upgrade and replacement plans',
      'Risk acceptance documentation for unsupported items'
    ],
    testProcedures: [
      'Review hardware and software inventory',
      'Verify vendor support status is current',
      'Examine annual technology review records',
      'Review upgrade plans for EOL components',
      'Verify risk acceptance is documented where required'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.4.1',
    name: 'Service Provider PCI DSS Responsibility Assignment',
    description: 'Additional requirement for service providers: Responsibility is established by executive management for the protection of cardholder data and a PCI DSS compliance program.',
    category: 'Organizational Policies',
    implementationGuidance: 'Formally assign executive-level responsibility for PCI DSS compliance. Create a PCI DSS compliance charter with executive sponsorship. Establish a PCI DSS compliance officer or committee with appropriate authority. Define reporting lines from compliance activities to executive management. Include PCI DSS compliance in executive performance objectives.',
    evidenceRequirements: [
      'Executive responsibility assignment documentation',
      'PCI DSS compliance charter with executive approval',
      'Compliance officer or committee documentation',
      'Reporting structure documentation',
      'Executive performance objectives including PCI DSS'
    ],
    testProcedures: [
      'Verify executive responsibility is formally assigned',
      'Review compliance charter and executive approval',
      'Verify compliance officer or committee authority',
      'Examine reporting structure to executives',
      'Review executive performance objectives'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.4.2',
    name: 'Service Provider PCI DSS Compliance Reviews',
    description: 'Additional requirement for service providers: Reviews are performed at least quarterly to confirm personnel are following security policies and operational procedures.',
    category: 'Organizational Policies',
    implementationGuidance: 'Conduct quarterly reviews of personnel compliance with security policies and procedures. Include spot checks, procedural audits, and compliance sampling. Document findings and track remediation. Report quarterly review results to management. Use review findings to improve training and procedures.',
    evidenceRequirements: [
      'Quarterly compliance review schedule and procedures',
      'Review documentation and findings',
      'Remediation tracking for identified issues',
      'Management reporting of review results',
      'Process improvement records based on findings'
    ],
    testProcedures: [
      'Verify quarterly reviews are scheduled and performed',
      'Examine review documentation and findings',
      'Review remediation tracking for issues',
      'Verify management receives review reports',
      'Examine process improvements based on findings'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.4.2.1',
    name: 'Service Provider Quarterly Compliance Documentation',
    description: 'Additional requirement for service providers: Reviews conducted in accordance with 12.4.2 are documented to include results of reviews, remediation actions for issues identified, and sign-off by personnel assigned responsibility.',
    category: 'Organizational Policies',
    implementationGuidance: 'Create a standardized template for quarterly compliance review documentation. Include review scope, methodology, findings, severity ratings, and remediation plans. Require formal sign-off by the responsible compliance officer or executive. Maintain documentation for audit trail purposes. Track trending of findings over time.',
    evidenceRequirements: [
      'Standardized review documentation template',
      'Completed review documentation with all required elements',
      'Formal sign-off records',
      'Findings trend analysis',
      'Documentation retention evidence'
    ],
    testProcedures: [
      'Examine review documentation template',
      'Verify completed reviews contain all required elements',
      'Verify sign-off by responsible personnel',
      'Review findings trend analysis',
      'Verify documentation retention'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.5.2.1',
    name: 'PCI DSS Scope Impact Documented Before Changes',
    description: 'The impact on PCI DSS scope is documented and confirmed prior to any system component change, including additions, deletions, and modifications.',
    category: 'Organizational Policies',
    implementationGuidance: 'Integrate PCI DSS scope impact assessment into the change management process. Create a checklist for evaluating scope impact of proposed changes. Require scope impact documentation approval before changes proceed. Document any scope changes in the PCI DSS scope documentation. Update data flow and network diagrams as needed.',
    evidenceRequirements: [
      'Change management integration procedures',
      'Scope impact assessment checklist',
      'Scope impact documentation for recent changes',
      'Approval records for scope-affecting changes',
      'Updated scope documentation following changes'
    ],
    testProcedures: [
      'Verify scope assessment is in change management',
      'Review scope impact assessment checklist',
      'Examine scope documentation for recent changes',
      'Verify approvals for scope-affecting changes',
      'Confirm scope documentation is updated'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.5.3',
    name: 'PCI DSS Scope Changes Organizational Impact Review',
    description: 'Additional requirement for service providers: Significant changes to organizational structure result in a documented review of the impact on PCI DSS scope and applicability of controls.',
    category: 'Organizational Policies',
    implementationGuidance: 'Define criteria for significant organizational changes that trigger scope reviews. Include mergers, acquisitions, divestitures, major outsourcing, and organizational restructuring. Conduct comprehensive scope review following significant changes. Document changes to scope and affected controls. Update compliance program as needed.',
    evidenceRequirements: [
      'Significant organizational change criteria',
      'Scope review procedures for organizational changes',
      'Review documentation for recent organizational changes',
      'Scope and control impact documentation',
      'Compliance program update records'
    ],
    testProcedures: [
      'Review organizational change criteria',
      'Examine scope review procedures',
      'Review documentation for recent changes',
      'Verify scope and control impacts are documented',
      'Confirm compliance program updates'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.6.3.1',
    name: 'Security Awareness Training Includes Threats',
    description: 'Security awareness training includes awareness of threats and vulnerabilities that could impact the security of the CDE, including phishing, social engineering, and related attacks.',
    category: 'Organizational Policies',
    implementationGuidance: 'Include current threat landscape information in security awareness training. Cover phishing attack techniques and recognition. Address social engineering tactics including vishing, pretexting, and baiting. Provide examples of recent attacks relevant to the organization. Update training content as new threats emerge. Conduct phishing simulations to reinforce training.',
    evidenceRequirements: [
      'Training content covering current threats',
      'Phishing and social engineering modules',
      'Recent attack examples in training',
      'Training content update records',
      'Phishing simulation results'
    ],
    testProcedures: [
      'Review training content for threat coverage',
      'Verify phishing and social engineering content',
      'Examine recent attack examples in training',
      'Verify training is updated for new threats',
      'Review phishing simulation results'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.6.3.2',
    name: 'Security Awareness Training Includes Acceptable Use',
    description: 'Security awareness training includes awareness of acceptable use of end-user technologies in accordance with Requirement 12.2.1.',
    category: 'Organizational Policies',
    implementationGuidance: 'Include acceptable use policies in security awareness training. Cover proper use of email, internet, remote access, mobile devices, and removable media. Address consequences of policy violations. Provide practical examples of acceptable vs unacceptable use. Include acknowledgment of acceptable use policies as part of training completion.',
    evidenceRequirements: [
      'Training content covering acceptable use policies',
      'Coverage of all technology types per 12.2.1',
      'Policy violation consequences in training',
      'Practical examples in training content',
      'Acceptable use acknowledgment records'
    ],
    testProcedures: [
      'Review training content for acceptable use coverage',
      'Verify all technology types are addressed',
      'Examine policy violation content',
      'Review practical examples',
      'Verify acknowledgment requirements'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-12.9.2',
    name: 'Service Provider Written Acknowledgment to Customers',
    description: 'Additional requirement for service providers: Written acknowledgments from TPSPs include acknowledgment that the TPSP is responsible for the security of account data the TPSP possesses or stores, processes, or transmits on behalf of the customer.',
    category: 'Organizational Policies',
    implementationGuidance: 'Provide written acknowledgments to customers confirming TPSP responsibility for account data security. Clearly state the scope of data handling covered by the acknowledgment. Include specifics on security measures implemented. Provide acknowledgments as part of service agreements or separate compliance documentation. Update acknowledgments when services or security measures change.',
    evidenceRequirements: [
      'Customer acknowledgment template',
      'Sample executed acknowledgments',
      'Scope of data handling in acknowledgments',
      'Security measure descriptions',
      'Acknowledgment update procedures'
    ],
    testProcedures: [
      'Review acknowledgment template',
      'Examine executed customer acknowledgments',
      'Verify data handling scope is clear',
      'Verify security measures are described',
      'Confirm acknowledgment update process'
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Appendix A1 - Multi-Tenant Service Provider Requirements
  // ============================================================
  {
    controlId: 'PCI-A1.1.1',
    name: 'Multi-Tenant Logical Separation Confirmed',
    description: 'For multi-tenant service providers: Logical separation is implemented such that each customer only has access to its own cardholder data environment.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Implement logical separation controls at network, application, and data layers to ensure tenant isolation. Use separate VLANs, network segments, or virtual networks for each tenant. Implement application-level access controls that prevent cross-tenant data access. Use separate database schemas, encryption keys, or other mechanisms to isolate tenant data. Test isolation controls regularly.',
    evidenceRequirements: [
      'Logical separation architecture documentation',
      'Network segmentation configurations',
      'Application access control configurations',
      'Data isolation mechanisms',
      'Isolation testing results'
    ],
    testProcedures: [
      'Review logical separation architecture',
      'Examine network segmentation configurations',
      'Verify application access controls prevent cross-tenant access',
      'Examine data isolation mechanisms',
      'Review isolation testing results'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A1.1.2',
    name: 'Multi-Tenant Controls Reviewed Annually',
    description: 'For multi-tenant service providers: Controls are in place to confirm that each customer can only access its own data, and reviews are performed at least annually.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Establish annual review procedures for multi-tenant access controls. Include automated testing of tenant isolation. Conduct manual penetration testing targeting cross-tenant access. Document review findings and remediation. Track isolation control effectiveness metrics over time.',
    evidenceRequirements: [
      'Annual review procedures for tenant controls',
      'Automated isolation testing configurations',
      'Penetration test results for tenant isolation',
      'Review findings and remediation records',
      'Isolation effectiveness metrics'
    ],
    testProcedures: [
      'Verify annual reviews are scheduled and performed',
      'Review automated testing configurations',
      'Examine penetration test results',
      'Review findings and remediation',
      'Examine effectiveness metrics'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A1.1.3',
    name: 'Multi-Tenant Logging Separation',
    description: 'For multi-tenant service providers: Logging mechanisms are implemented such that logs for each customer\'s cardholder data environment are available only to the respective customer.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Implement log separation ensuring each tenant can only access their own logs. Use tenant identifiers in log entries to enable filtering. Implement access controls on log storage and retrieval. Provide tenant-specific log access interfaces. Ensure shared infrastructure logs do not expose other tenant data.',
    evidenceRequirements: [
      'Log separation architecture documentation',
      'Tenant identifier implementation in logs',
      'Log access control configurations',
      'Tenant log access interface documentation',
      'Shared log redaction procedures'
    ],
    testProcedures: [
      'Review log separation architecture',
      'Verify tenant identifiers in logs',
      'Examine log access controls',
      'Test tenant log access interface',
      'Verify shared logs do not expose tenant data'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A1.1.4',
    name: 'Multi-Tenant Forensics Capability',
    description: 'For multi-tenant service providers: Processes and procedures are in place to support timely forensic investigation in the event of a suspected or confirmed security incident for any customer.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Develop forensic investigation procedures specific to multi-tenant environments. Ensure log retention and evidence preservation capabilities. Define procedures for isolating affected tenants during investigation. Establish communication protocols with affected customers. Maintain forensic tools and trained personnel.',
    evidenceRequirements: [
      'Multi-tenant forensic investigation procedures',
      'Log retention and evidence preservation capabilities',
      'Tenant isolation procedures during incidents',
      'Customer communication protocols',
      'Forensic tools and personnel documentation'
    ],
    testProcedures: [
      'Review forensic investigation procedures',
      'Verify log retention capabilities',
      'Examine tenant isolation procedures',
      'Review customer communication protocols',
      'Verify forensic capabilities are available'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A1.2.1',
    name: 'Customer Penetration Testing Enablement',
    description: 'For multi-tenant service providers: The service provider enables its customers to perform penetration testing according to PCI DSS Requirement 11.4.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Establish policies and procedures allowing customers to perform or arrange penetration testing of their environments. Define scope boundaries and rules of engagement. Provide coordination procedures for customer-initiated testing. Document any restrictions or requirements for customer testing. Consider offering penetration testing as a service option.',
    evidenceRequirements: [
      'Customer penetration testing policy',
      'Scope boundaries and rules of engagement',
      'Testing coordination procedures',
      'Testing restrictions documentation',
      'Penetration testing service offering'
    ],
    testProcedures: [
      'Review customer penetration testing policy',
      'Examine scope and rules of engagement',
      'Verify coordination procedures',
      'Review testing restrictions',
      'Verify testing capability is available to customers'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A1.2.2',
    name: 'Supporting Customer Security Requirements',
    description: 'For multi-tenant service providers: The service provider supports its customers\' request to provide evidence of their PCI DSS compliance.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Establish procedures for providing PCI DSS compliance evidence to customers. Make Attestation of Compliance (AOC) available upon request. Provide responsibility matrices showing shared responsibilities. Support customer audit activities with appropriate documentation. Maintain documentation suitable for customer compliance evidence.',
    evidenceRequirements: [
      'Evidence request fulfillment procedures',
      'AOC availability documentation',
      'Customer responsibility matrix',
      'Audit support procedures',
      'Customer compliance documentation'
    ],
    testProcedures: [
      'Review evidence request procedures',
      'Verify AOC is available to customers',
      'Examine customer responsibility matrix',
      'Review audit support procedures',
      'Verify documentation is available for customers'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A1.2.3',
    name: 'Service Level Agreement Coverage',
    description: 'For multi-tenant service providers: Shared services have service-level agreements that address security and compliance requirements.',
    category: 'Multi-Tenant Service Providers',
    implementationGuidance: 'Include PCI DSS compliance requirements in service level agreements for shared services. Define security responsibilities and expectations. Specify incident response and notification procedures. Include audit rights and compliance reporting provisions. Address data location and jurisdiction requirements.',
    evidenceRequirements: [
      'SLA templates with security provisions',
      'PCI DSS compliance requirements in SLAs',
      'Incident response provisions',
      'Audit rights provisions',
      'Data location requirements'
    ],
    testProcedures: [
      'Review SLA security provisions',
      'Verify PCI DSS requirements are included',
      'Examine incident response provisions',
      'Review audit rights provisions',
      'Verify data location requirements'
    ],
    status: 'Not Started',
  },

  // ============================================================
  // Appendix A3 - Designated Entities Supplemental Validation (DESV)
  // ============================================================
  {
    controlId: 'PCI-A3.1.1',
    name: 'DESV PCI DSS Compliance Program',
    description: 'For designated entities: A comprehensive PCI DSS compliance program is implemented that includes a detailed description of the program with executive leadership involvement.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Establish a formal PCI DSS compliance program with executive sponsorship. Document program scope, objectives, governance structure, and resource allocation. Define roles and responsibilities for compliance activities. Establish regular executive reporting on compliance status. Integrate compliance program with enterprise risk management.',
    evidenceRequirements: [
      'PCI DSS compliance program documentation',
      'Executive sponsorship documentation',
      'Governance structure documentation',
      'Roles and responsibilities matrix',
      'Executive reporting schedule and samples'
    ],
    testProcedures: [
      'Review compliance program documentation',
      'Verify executive sponsorship',
      'Examine governance structure',
      'Review roles and responsibilities',
      'Verify executive reporting occurs'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.2.1',
    name: 'DESV Scope Documentation',
    description: 'For designated entities: PCI DSS scope is documented and validated by the entity at least quarterly and upon significant change.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Implement quarterly scope validation procedures. Document all components in PCI DSS scope with data flow diagrams. Validate scope following any significant environmental changes. Maintain scope validation records with sign-off. Track scope changes over time.',
    evidenceRequirements: [
      'Quarterly scope validation procedures',
      'Scope documentation and data flow diagrams',
      'Change-triggered validation records',
      'Validation sign-off records',
      'Scope change tracking'
    ],
    testProcedures: [
      'Verify quarterly validations occur',
      'Review scope documentation completeness',
      'Examine change-triggered validations',
      'Verify sign-off records',
      'Review scope change tracking'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.2.2',
    name: 'DESV Scope Validation Documentation',
    description: 'For designated entities: PCI DSS scope validation includes documentation of all segmentation controls and methods used.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Document all segmentation controls used to reduce PCI DSS scope. Include network segmentation, application controls, and process isolation methods. Document segmentation testing methodology and results. Maintain current segmentation architecture diagrams. Review segmentation effectiveness regularly.',
    evidenceRequirements: [
      'Segmentation control inventory',
      'Segmentation architecture diagrams',
      'Segmentation testing methodology',
      'Segmentation test results',
      'Effectiveness review records'
    ],
    testProcedures: [
      'Review segmentation control inventory',
      'Examine architecture diagrams',
      'Review testing methodology',
      'Examine test results',
      'Verify effectiveness reviews occur'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.2.3',
    name: 'DESV Scoping Methodologies',
    description: 'For designated entities: Scoping methodologies are validated by the assessor and confirmed as appropriate for the complexity of the environment.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Document scoping methodologies used to determine PCI DSS scope. Include methodology for identifying connected systems, data flows, and security-impacting systems. Ensure methodology addresses the complexity of the specific environment. Have methodology validated by qualified assessor. Update methodology as environment evolves.',
    evidenceRequirements: [
      'Scoping methodology documentation',
      'Connected systems identification process',
      'Data flow analysis methodology',
      'Assessor validation records',
      'Methodology update records'
    ],
    testProcedures: [
      'Review scoping methodology documentation',
      'Verify connected systems process',
      'Examine data flow analysis approach',
      'Verify assessor validation',
      'Review methodology updates'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.3.1',
    name: 'DESV Impact Assessment',
    description: 'For designated entities: The impact of any changes to the cardholder data environment, organizational structure, business processes, or supporting technologies is assessed prior to implementation.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Implement comprehensive change impact assessment procedures. Assess PCI DSS scope and control impacts for all significant changes. Require pre-implementation review and approval. Document impact assessments and mitigation plans. Track assessment findings through implementation.',
    evidenceRequirements: [
      'Change impact assessment procedures',
      'Assessment templates and criteria',
      'Pre-implementation approval records',
      'Mitigation plans',
      'Assessment tracking records'
    ],
    testProcedures: [
      'Review impact assessment procedures',
      'Examine assessment templates',
      'Verify pre-implementation approvals',
      'Review mitigation plans',
      'Examine tracking records'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.4.1',
    name: 'DESV Control Effectiveness Monitoring',
    description: 'For designated entities: PCI DSS controls are monitored on an ongoing basis for effectiveness through regular testing and review of the control environment.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Implement continuous monitoring for PCI DSS control effectiveness. Define monitoring frequency based on control criticality. Use automated monitoring tools where possible. Establish KPIs for control effectiveness. Report monitoring results to management regularly.',
    evidenceRequirements: [
      'Control monitoring procedures',
      'Monitoring frequency documentation',
      'Automated monitoring tool configurations',
      'Control effectiveness KPIs',
      'Management reporting samples'
    ],
    testProcedures: [
      'Review monitoring procedures',
      'Verify monitoring frequency',
      'Examine automated monitoring tools',
      'Review effectiveness KPIs',
      'Verify management reporting'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.5.1',
    name: 'DESV Incident Response Program',
    description: 'For designated entities: An incident response program is implemented that includes specific provisions for responding to breaches involving account data.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Develop comprehensive incident response procedures specific to account data breaches. Include identification, containment, eradication, and recovery procedures. Define communication protocols for customers, card brands, and regulators. Conduct regular incident response exercises. Maintain relationships with forensic investigators.',
    evidenceRequirements: [
      'Account data breach response procedures',
      'Communication protocols documentation',
      'Incident response exercise records',
      'Forensic investigator relationships',
      'Response capability documentation'
    ],
    testProcedures: [
      'Review breach response procedures',
      'Verify communication protocols',
      'Review exercise records',
      'Verify forensic relationships',
      'Assess response capabilities'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.6.1',
    name: 'DESV Executive Reporting',
    description: 'For designated entities: The results of the PCI DSS compliance program, including findings from the annual assessment and ongoing monitoring, are reported to executive management.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Establish regular executive reporting on PCI DSS compliance status. Include assessment findings, remediation status, and risk metrics. Report on compliance trends and emerging issues. Ensure executive understanding of compliance implications. Document executive review and decisions.',
    evidenceRequirements: [
      'Executive reporting schedule',
      'Compliance status report samples',
      'Risk metrics reporting',
      'Executive meeting minutes',
      'Executive decision documentation'
    ],
    testProcedures: [
      'Verify reporting schedule adherence',
      'Review compliance status reports',
      'Examine risk metrics',
      'Review meeting minutes',
      'Verify executive decisions are documented'
    ],
    status: 'Not Started',
  },
  {
    controlId: 'PCI-A3.7.1',
    name: 'DESV Compliance Assessment Findings',
    description: 'For designated entities: Findings from the annual PCI DSS assessment are addressed in a timely manner with documented remediation plans.',
    category: 'Designated Entities Supplemental Validation',
    implementationGuidance: 'Implement formal processes for addressing assessment findings. Define remediation timelines based on finding severity. Track remediation through completion with evidence. Report remediation status to management. Conduct verification testing after remediation.',
    evidenceRequirements: [
      'Remediation process documentation',
      'Remediation timeline standards',
      'Remediation tracking records',
      'Management status reports',
      'Verification testing results'
    ],
    testProcedures: [
      'Review remediation process',
      'Verify timeline standards',
      'Examine tracking records',
      'Review management reports',
      'Verify remediation testing'
    ],
    status: 'Not Started',
  },
];