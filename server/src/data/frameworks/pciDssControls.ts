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
];
