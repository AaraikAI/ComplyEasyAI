/**
 * ISO 27017:2015 Cloud Security Controls
 * Code of practice for information security controls based on ISO/IEC 27002 for cloud services
 *
 * This standard provides guidelines for information security controls applicable to cloud services.
 * It extends ISO 27001/27002 with cloud-specific implementation guidance.
 */

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

export const ISO27017_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // CLAUSE 5: INFORMATION SECURITY POLICIES (CLOUD-EXTENDED)
  // ============================================================
  {
    controlId: 'ISO27017-5.1.1',
    name: 'Policies for Information Security in Cloud',
    description: 'A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties, with specific considerations for cloud computing environments.',
    category: 'Information Security Policies',
    implementationGuidance: 'Develop cloud-specific security policies addressing: shared responsibility model, data residency, multi-tenancy isolation, cloud service provider selection criteria, and cloud exit strategies. Policies should clearly delineate responsibilities between cloud service customer (CSC) and cloud service provider (CSP). Include provisions for regular policy review considering evolving cloud threats and technologies.',
    evidenceRequirements: [
      'Cloud security policy document with version control',
      'Management approval records for cloud policies',
      'Cloud shared responsibility matrix',
      'Policy communication records to employees and external parties',
      'Cloud service provider assessment criteria documentation',
    ],
    testProcedures: [
      'Review cloud security policies for completeness and currency',
      'Verify management approval and review dates',
      'Confirm policies address shared responsibility model',
      'Interview staff to verify policy awareness',
      'Review cloud provider contracts for alignment with policies',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-5.1.2',
    name: 'Review of Policies for Cloud Information Security',
    description: 'The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness in the cloud environment.',
    category: 'Information Security Policies',
    implementationGuidance: 'Establish a review schedule (at least annually) for cloud security policies. Trigger reviews when significant cloud infrastructure changes occur, new cloud services are adopted, or security incidents highlight policy gaps. Document review outcomes and required policy updates.',
    evidenceRequirements: [
      'Policy review schedule and completion records',
      'Review meeting minutes with attendees and decisions',
      'Change logs documenting policy updates',
      'Trigger event documentation for unscheduled reviews',
    ],
    testProcedures: [
      'Verify policy review frequency meets requirements',
      'Review documentation of policy changes and rationale',
      'Confirm reviews consider cloud-specific threats and changes',
      'Validate that review findings are actioned',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 6: ORGANIZATION OF INFORMATION SECURITY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-6.1.1',
    name: 'Information Security Roles and Responsibilities for Cloud',
    description: 'All information security responsibilities shall be defined and allocated, with clear delineation between cloud service customer and cloud service provider responsibilities.',
    category: 'Organization of Information Security',
    implementationGuidance: 'Document and assign cloud security roles including: Cloud Security Architect, Cloud Operations Manager, Cloud Compliance Officer. Create a RACI matrix showing responsibilities across CSC and CSP. Ensure contracts with CSPs clearly define security responsibilities.',
    evidenceRequirements: [
      'Cloud security organizational chart',
      'Role and responsibility documentation',
      'RACI matrix for cloud security activities',
      'CSP contracts with security responsibility clauses',
      'Job descriptions for cloud security roles',
    ],
    testProcedures: [
      'Review organizational structure for cloud security coverage',
      'Verify RACI matrix completeness for all cloud services',
      'Interview role holders to confirm understanding of responsibilities',
      'Review CSP contracts for clear responsibility allocation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-6.1.2',
    name: 'Segregation of Duties in Cloud Environments',
    description: 'Conflicting duties and areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of cloud assets.',
    category: 'Organization of Information Security',
    implementationGuidance: 'Implement segregation between cloud administration, security monitoring, and audit functions. Use cloud IAM policies to enforce role separation. Prevent developers from having production access without approval workflows. Implement break-glass procedures for emergency access.',
    evidenceRequirements: [
      'Segregation of duties policy for cloud environments',
      'Cloud IAM role definitions and permissions',
      'Evidence of role separation in cloud console access',
      'Break-glass procedure documentation',
      'Periodic review of segregation effectiveness',
    ],
    testProcedures: [
      'Review cloud IAM policies for proper segregation',
      'Test that conflicting permissions are not assigned to same users',
      'Verify break-glass procedures include post-incident review',
      'Review audit logs for segregation violations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-6.1.3',
    name: 'Contact with Cloud Authorities',
    description: 'Appropriate contacts with relevant authorities shall be maintained, including cloud service providers, data protection authorities, and cloud security organizations.',
    category: 'Organization of Information Security',
    implementationGuidance: 'Maintain current contact information for CSP security teams, incident response contacts, and support escalation paths. Establish relationships with data protection authorities for cloud data incidents. Subscribe to cloud provider security bulletins and advisories.',
    evidenceRequirements: [
      'Cloud provider security contact directory',
      'Data protection authority contact information',
      'Evidence of CSP security bulletin subscriptions',
      'Incident escalation procedures with contacts',
    ],
    testProcedures: [
      'Verify contact information is current and tested',
      'Review security bulletin subscription and response process',
      'Confirm escalation procedures are documented and communicated',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 7: HUMAN RESOURCE SECURITY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-7.1.1',
    name: 'Screening for Cloud Administrators',
    description: 'Background verification checks on candidates for cloud administration positions shall be carried out in accordance with relevant laws, regulations and ethics.',
    category: 'Human Resource Security',
    implementationGuidance: 'Implement enhanced screening for personnel with privileged cloud access. Verify technical certifications (AWS, Azure, GCP). Conduct periodic re-screening for continued access. Ensure CSP personnel with access to your data meet equivalent screening standards.',
    evidenceRequirements: [
      'Enhanced screening policy for cloud administrators',
      'Background check completion records',
      'Cloud certification verification records',
      'CSP personnel screening attestation',
    ],
    testProcedures: [
      'Review screening policy requirements for cloud roles',
      'Sample background check completions for cloud administrators',
      'Verify CSP contractual requirements for personnel screening',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-7.2.2',
    name: 'Cloud Security Awareness and Training',
    description: 'All employees and contractors using cloud services shall receive appropriate awareness education and training with regular updates on cloud security policies and procedures.',
    category: 'Human Resource Security',
    implementationGuidance: 'Develop cloud-specific security training covering: shared responsibility model, secure cloud configuration, data classification in cloud, incident reporting. Include hands-on training for cloud administrators. Track completion and require refresher training annually.',
    evidenceRequirements: [
      'Cloud security training curriculum',
      'Training completion records by role',
      'Competency assessments for cloud administrators',
      'Training update logs for emerging cloud threats',
    ],
    testProcedures: [
      'Review training content for cloud security coverage',
      'Verify training completion rates meet targets',
      'Assess effectiveness through security metrics or testing',
      'Confirm training is updated for new cloud services',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 8: ASSET MANAGEMENT (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-8.1.1',
    name: 'Inventory of Cloud Assets',
    description: 'Assets associated with cloud services shall be identified and an inventory of these assets shall be drawn up and maintained.',
    category: 'Asset Management',
    implementationGuidance: 'Implement automated cloud asset discovery and inventory tools. Track all cloud resources including: compute instances, storage, databases, networks, IAM entities, and third-party integrations. Maintain asset ownership and classification. Use cloud provider native tools and third-party CSPM solutions.',
    evidenceRequirements: [
      'Cloud asset inventory with ownership assignments',
      'Asset discovery tool configuration and reports',
      'Cloud resource tagging standards and compliance',
      'Regular asset inventory reconciliation reports',
    ],
    testProcedures: [
      'Review cloud asset inventory completeness',
      'Verify asset discovery tools are properly configured',
      'Test that all cloud accounts are covered by inventory',
      'Confirm asset classification and ownership is current',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-8.2.1',
    name: 'Classification of Cloud Data',
    description: 'Information stored, processed, or transmitted in cloud services shall be classified in terms of legal requirements, value, criticality and sensitivity.',
    category: 'Asset Management',
    implementationGuidance: 'Apply data classification scheme to all cloud-hosted data. Implement automated data classification tools for cloud storage. Use cloud-native data labeling and tagging features. Ensure classification drives access controls, encryption, and retention policies.',
    evidenceRequirements: [
      'Data classification policy for cloud environments',
      'Cloud data classification tool configurations',
      'Evidence of data labeling in cloud storage',
      'Classification-based access control mappings',
    ],
    testProcedures: [
      'Review data classification policy applicability to cloud',
      'Verify automated classification tool coverage',
      'Sample data assets for proper classification labels',
      'Confirm classification drives appropriate controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-8.2.2',
    name: 'Labelling of Cloud Information',
    description: 'An appropriate set of procedures for information labelling shall be developed and implemented for cloud-hosted information.',
    category: 'Asset Management',
    implementationGuidance: 'Implement consistent tagging standards across all cloud providers. Use mandatory tags for data classification, owner, cost center, and environment. Automate tag enforcement through cloud policies. Generate compliance reports on tagging adherence.',
    evidenceRequirements: [
      'Cloud resource tagging policy and standards',
      'Tag enforcement policy configurations',
      'Tagging compliance reports',
      'Evidence of mandatory tag implementation',
    ],
    testProcedures: [
      'Review tagging standards for completeness',
      'Verify tag enforcement policies are active',
      'Sample cloud resources for tagging compliance',
      'Review tag compliance metrics and remediation',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 9: ACCESS CONTROL (CLOUD-SPECIFIC)
  // ============================================================
  {
    controlId: 'ISO27017-9.1.1',
    name: 'Cloud Access Control Policy',
    description: 'An access control policy shall be established, documented and reviewed based on cloud service business and information security requirements.',
    category: 'Access Control',
    implementationGuidance: 'Develop cloud-specific access control policy addressing: least privilege, just-in-time access, federated identity, API access management, and service account governance. Align with zero-trust principles. Define access for different cloud service models (IaaS, PaaS, SaaS).',
    evidenceRequirements: [
      'Cloud access control policy document',
      'Access governance framework for cloud',
      'Least privilege implementation guidelines',
      'Service account management procedures',
    ],
    testProcedures: [
      'Review cloud access control policy completeness',
      'Verify policy covers all cloud service models in use',
      'Confirm policy addresses zero-trust principles',
      'Review alignment with actual cloud IAM configurations',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-9.2.1',
    name: 'Cloud User Registration and De-registration',
    description: 'A formal user registration and de-registration process shall be implemented for cloud services to enable assignment and revocation of access rights.',
    category: 'Access Control',
    implementationGuidance: 'Implement automated user lifecycle management for cloud access. Integrate with HR systems for joiners/movers/leavers. Use identity federation (SAML, OIDC) for centralized access management. Ensure timely deprovisioning across all cloud services upon termination.',
    evidenceRequirements: [
      'Cloud user provisioning procedures',
      'Identity federation configuration documentation',
      'Automated provisioning/deprovisioning evidence',
      'Access termination SLA and compliance records',
    ],
    testProcedures: [
      'Review user provisioning workflow and approvals',
      'Test deprovisioning timeliness for terminated users',
      'Verify identity federation is properly configured',
      'Confirm orphan account detection and remediation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-9.2.3',
    name: 'Cloud Privileged Access Management',
    description: 'The allocation and use of privileged access rights to cloud services shall be restricted and controlled.',
    category: 'Access Control',
    implementationGuidance: 'Implement cloud-native privileged access management. Use just-in-time (JIT) access for administrative privileges. Require MFA for all privileged access. Implement session recording for privileged cloud console access. Use separate privileged accounts (not daily-use accounts).',
    evidenceRequirements: [
      'Cloud privileged access management policy',
      'JIT access tool configuration and logs',
      'MFA enforcement evidence for privileged accounts',
      'Privileged session recording configuration',
      'Privileged account inventory',
    ],
    testProcedures: [
      'Review privileged access inventory and justification',
      'Verify JIT access is implemented and used',
      'Test MFA enforcement for privileged access',
      'Review privileged session recordings',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-9.4.1',
    name: 'Cloud Service Authentication',
    description: 'Access to cloud services and applications shall be controlled by a secure authentication procedure.',
    category: 'Access Control',
    implementationGuidance: 'Implement strong authentication for all cloud access. Require MFA for human users. Use managed identities or instance profiles for service-to-service authentication. Implement certificate-based authentication for critical workloads. Disable password-based authentication where possible.',
    evidenceRequirements: [
      'Cloud authentication policy and standards',
      'MFA configuration and coverage reports',
      'Managed identity/service account inventory',
      'Certificate management procedures for cloud',
    ],
    testProcedures: [
      'Verify MFA is required for all human cloud access',
      'Review service account authentication methods',
      'Test that password-only authentication is disabled where possible',
      'Confirm certificate lifecycle management is implemented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-9.4.4',
    name: 'Use of Privileged Utility Programs in Cloud',
    description: 'The use of utility programs that might be capable of overriding cloud system and application controls shall be restricted and tightly controlled.',
    category: 'Access Control',
    implementationGuidance: 'Control access to cloud CLI tools and APIs that can bypass console controls. Restrict use of cloud provider support access features. Implement approval workflows for using elevated cloud utilities. Monitor and alert on use of administrative cloud APIs.',
    evidenceRequirements: [
      'Policy on privileged cloud utility access',
      'CLI/API access controls and logging',
      'Support access (break-glass) procedures',
      'Monitoring alerts for administrative API usage',
    ],
    testProcedures: [
      'Review controls on cloud CLI and API access',
      'Verify logging of administrative cloud operations',
      'Test alert generation for sensitive API calls',
      'Review support access usage and approval records',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 10: CRYPTOGRAPHY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-10.1.1',
    name: 'Cloud Cryptographic Controls Policy',
    description: 'A policy on the use of cryptographic controls for protection of information in cloud services shall be developed and implemented.',
    category: 'Cryptography',
    implementationGuidance: 'Define encryption requirements for data at rest and in transit in cloud. Specify key management approach (CSP-managed, customer-managed, or BYOK). Address cryptographic requirements for different data classifications. Include requirements for secrets management in cloud.',
    evidenceRequirements: [
      'Cloud cryptography policy document',
      'Key management approach documentation',
      'Encryption configuration standards by data classification',
      'Secrets management policy for cloud',
    ],
    testProcedures: [
      'Review cryptography policy for cloud completeness',
      'Verify encryption is implemented per policy requirements',
      'Confirm key management approach is documented and followed',
      'Review secrets management practices',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-10.1.2',
    name: 'Cloud Key Management',
    description: 'A policy on the use, protection and lifetime of cryptographic keys shall be developed and implemented for cloud environments.',
    category: 'Cryptography',
    implementationGuidance: 'Implement cloud KMS for key management. Define key rotation schedules. Use HSM-backed keys for sensitive workloads. Implement key access controls and auditing. Plan for key recovery and backup. Consider multi-region key replication for availability.',
    evidenceRequirements: [
      'Cloud key management policy and procedures',
      'KMS configuration and key inventory',
      'Key rotation schedules and completion evidence',
      'Key access audit logs',
      'Key recovery and backup procedures',
    ],
    testProcedures: [
      'Review KMS configuration and key inventory',
      'Verify key rotation is implemented per schedule',
      'Test key recovery procedures',
      'Review key access logs for anomalies',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 11: PHYSICAL AND ENVIRONMENTAL SECURITY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-11.1.1',
    name: 'Cloud Physical Security Perimeter',
    description: 'Security perimeters shall be defined and used to protect cloud service infrastructure, with assurance obtained from cloud service providers.',
    category: 'Physical and Environmental Security',
    implementationGuidance: 'Obtain and review CSP physical security certifications (SOC 2, ISO 27001). Understand datacenter locations and physical security controls. For hybrid cloud, ensure on-premises components meet physical security requirements. Document CSP physical security in risk assessments.',
    evidenceRequirements: [
      'CSP datacenter locations and certifications',
      'CSP physical security audit reports (SOC 2)',
      'Physical security review documentation',
      'Hybrid cloud physical security assessments',
    ],
    testProcedures: [
      'Review CSP physical security certifications',
      'Verify datacenter locations meet data residency requirements',
      'Confirm CSP audit reports are current',
      'Review physical security for hybrid components',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-11.2.7',
    name: 'Secure Disposal of Cloud Resources',
    description: 'Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use in cloud environments.',
    category: 'Physical and Environmental Security',
    implementationGuidance: 'Understand CSP media sanitization procedures. Implement cryptographic erasure for cloud storage before deletion. Use cloud-native secure deletion features. Obtain CSP attestations for media disposal. For sensitive data, consider dedicated tenancy with verified destruction.',
    evidenceRequirements: [
      'CSP media sanitization documentation',
      'Cloud storage deletion procedures',
      'Cryptographic erasure implementation evidence',
      'CSP media disposal attestations',
    ],
    testProcedures: [
      'Review CSP media sanitization certifications',
      'Verify cloud storage deletion procedures are followed',
      'Confirm cryptographic erasure is implemented where required',
      'Review CSP attestations for disposal',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 12: OPERATIONS SECURITY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-12.1.2',
    name: 'Cloud Change Management',
    description: 'Changes to cloud services, including configurations, shall be controlled through a formal change management process.',
    category: 'Operations Security',
    implementationGuidance: 'Implement infrastructure-as-code for cloud configuration management. Use version control for all cloud configurations. Require peer review and approval for production changes. Implement automated testing in CI/CD pipelines. Use change windows for significant modifications.',
    evidenceRequirements: [
      'Cloud change management policy',
      'Infrastructure-as-code repository with version history',
      'Change approval workflow documentation',
      'CI/CD pipeline configurations',
      'Change advisory board records for major changes',
    ],
    testProcedures: [
      'Review infrastructure-as-code practices',
      'Verify change approval workflows are followed',
      'Sample changes for proper documentation and approval',
      'Review CI/CD pipeline security controls',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-12.1.3',
    name: 'Cloud Capacity Management',
    description: 'The use of cloud resources shall be monitored, tuned and projections made of future capacity requirements to ensure required cloud performance.',
    category: 'Operations Security',
    implementationGuidance: 'Implement cloud cost and capacity monitoring. Use auto-scaling for dynamic workloads. Set up alerting for capacity thresholds. Conduct regular capacity planning reviews. Monitor cloud quotas and limits. Implement reserved capacity for predictable workloads.',
    evidenceRequirements: [
      'Cloud capacity monitoring dashboards',
      'Auto-scaling configurations',
      'Capacity threshold alerts',
      'Capacity planning documentation',
      'Cloud quota monitoring',
    ],
    testProcedures: [
      'Review capacity monitoring coverage',
      'Verify auto-scaling is properly configured',
      'Test capacity alerts function correctly',
      'Review capacity planning processes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-12.2.1',
    name: 'Controls Against Malware in Cloud',
    description: 'Detection, prevention and recovery controls to protect against malware shall be implemented for cloud services.',
    category: 'Operations Security',
    implementationGuidance: 'Implement cloud-native anti-malware solutions. Use container image scanning in CI/CD. Deploy cloud workload protection platforms (CWPP). Enable cloud provider threat detection services. Implement file integrity monitoring for cloud workloads.',
    evidenceRequirements: [
      'Cloud anti-malware policy and tools',
      'Container image scanning configurations',
      'CWPP deployment documentation',
      'Cloud threat detection service configuration',
      'File integrity monitoring setup',
    ],
    testProcedures: [
      'Verify anti-malware coverage for cloud workloads',
      'Review container image scanning results',
      'Confirm threat detection services are enabled',
      'Test file integrity monitoring alerts',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-12.3.1',
    name: 'Cloud Backup',
    description: 'Backup copies of cloud information, software and system images shall be taken and tested regularly.',
    category: 'Operations Security',
    implementationGuidance: 'Implement cloud-native backup solutions. Define backup schedules based on RPO requirements. Use cross-region backup for disaster recovery. Encrypt backups with customer-managed keys. Test backup restoration regularly. Implement backup retention policies.',
    evidenceRequirements: [
      'Cloud backup policy and schedules',
      'Backup configuration documentation',
      'Cross-region backup setup evidence',
      'Backup encryption configuration',
      'Restoration test records',
    ],
    testProcedures: [
      'Review backup coverage and schedules',
      'Verify backup encryption is implemented',
      'Test backup restoration procedures',
      'Confirm retention policies are enforced',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-12.4.1',
    name: 'Cloud Event Logging',
    description: 'Event logs recording user activities, exceptions, faults and information security events in cloud services shall be produced, kept and regularly reviewed.',
    category: 'Operations Security',
    implementationGuidance: 'Enable comprehensive cloud logging (CloudTrail, Cloud Audit Logs, Azure Activity Log). Centralize logs in SIEM. Implement log retention per compliance requirements. Protect log integrity with immutable storage. Set up real-time alerting for security events.',
    evidenceRequirements: [
      'Cloud logging policy and configuration',
      'Log centralization in SIEM documentation',
      'Log retention configuration',
      'Immutable log storage evidence',
      'Security alerting rules',
    ],
    testProcedures: [
      'Verify comprehensive cloud logging is enabled',
      'Review log centralization and coverage',
      'Confirm log retention meets requirements',
      'Test security alerts function correctly',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-12.4.3',
    name: 'Cloud Administrator and Operator Logs',
    description: 'Cloud service administrator and operator activities shall be logged and the logs protected and regularly reviewed.',
    category: 'Operations Security',
    implementationGuidance: 'Enable detailed logging for all administrative cloud operations. Use dedicated admin logging streams. Protect admin logs from modification or deletion. Implement privileged session recording. Review admin logs for anomalous activities.',
    evidenceRequirements: [
      'Administrator logging configuration',
      'Protected log storage configuration',
      'Session recording setup for admin access',
      'Log review procedures and records',
    ],
    testProcedures: [
      'Verify admin operations are logged',
      'Confirm log protection controls',
      'Review session recording coverage',
      'Sample admin log reviews for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-12.6.1',
    name: 'Cloud Vulnerability Management',
    description: 'Information about technical vulnerabilities in cloud services shall be obtained, exposure evaluated, and appropriate measures taken.',
    category: 'Operations Security',
    implementationGuidance: 'Implement continuous vulnerability scanning for cloud workloads. Use cloud-native vulnerability assessment tools. Integrate vulnerability scanning into CI/CD pipelines. Subscribe to CSP security bulletins. Define SLAs for vulnerability remediation by severity.',
    evidenceRequirements: [
      'Cloud vulnerability management policy',
      'Vulnerability scanning tool configurations',
      'CI/CD vulnerability scan integrations',
      'CSP security bulletin subscription',
      'Vulnerability remediation SLAs and tracking',
    ],
    testProcedures: [
      'Review vulnerability scanning coverage',
      'Verify scanning is integrated in CI/CD',
      'Review vulnerability remediation timelines',
      'Confirm CSP bulletin review process',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 13: COMMUNICATIONS SECURITY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-13.1.1',
    name: 'Cloud Network Controls',
    description: 'Networks in cloud environments shall be managed and controlled to protect information in cloud services.',
    category: 'Communications Security',
    implementationGuidance: 'Implement cloud virtual networks with proper segmentation. Use security groups and NACLs for traffic control. Deploy cloud firewalls and WAF. Implement private endpoints for cloud services. Use VPN or direct connect for hybrid connectivity.',
    evidenceRequirements: [
      'Cloud network architecture documentation',
      'Security group and NACL configurations',
      'Cloud firewall and WAF configurations',
      'Private endpoint implementations',
      'VPN/Direct connect configurations',
    ],
    testProcedures: [
      'Review cloud network segmentation',
      'Verify security group rules follow least privilege',
      'Test firewall and WAF effectiveness',
      'Confirm private endpoints are used for sensitive services',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-13.1.3',
    name: 'Segregation in Cloud Networks',
    description: 'Groups of cloud services, users and information systems shall be segregated on networks.',
    category: 'Communications Security',
    implementationGuidance: 'Implement VPC/VNet segmentation by environment (dev/test/prod) and workload type. Use subnet isolation for different tiers. Implement micro-segmentation for sensitive workloads. Use cloud-native network policies for container workloads.',
    evidenceRequirements: [
      'Cloud network segmentation design',
      'VPC/VNet configurations',
      'Subnet and tier isolation evidence',
      'Micro-segmentation implementations',
      'Container network policies',
    ],
    testProcedures: [
      'Review network segmentation design',
      'Verify isolation between environments',
      'Test that cross-environment traffic is properly controlled',
      'Review container network policies',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-13.2.1',
    name: 'Cloud Information Transfer Policies',
    description: 'Formal transfer policies, procedures and controls shall be in place to protect the transfer of information through cloud services.',
    category: 'Communications Security',
    implementationGuidance: 'Require TLS 1.2+ for all data in transit. Implement certificate management for cloud services. Use cloud-native data transfer encryption. Control data exfiltration through DLP and egress controls. Document approved data transfer mechanisms.',
    evidenceRequirements: [
      'Cloud data transfer security policy',
      'TLS configuration evidence',
      'Certificate management procedures',
      'DLP and egress control configurations',
      'Approved transfer mechanism documentation',
    ],
    testProcedures: [
      'Verify TLS 1.2+ is enforced',
      'Review certificate management practices',
      'Test DLP controls effectiveness',
      'Confirm egress controls are implemented',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 14: SYSTEM ACQUISITION, DEVELOPMENT AND MAINTENANCE (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-14.1.1',
    name: 'Cloud Security Requirements Analysis',
    description: 'Information security related requirements shall be included in the requirements for new cloud services or enhancements to existing cloud services.',
    category: 'System Development and Maintenance',
    implementationGuidance: 'Include security requirements in cloud service evaluation criteria. Assess security capabilities of new cloud services before adoption. Document security requirements for cloud-native application development. Implement security review gates in cloud adoption processes.',
    evidenceRequirements: [
      'Cloud service evaluation security checklist',
      'Security requirements for cloud applications',
      'Cloud adoption security review process',
      'Security assessment records for new services',
    ],
    testProcedures: [
      'Review cloud service evaluation criteria',
      'Verify security requirements are documented',
      'Sample cloud adoptions for security review evidence',
      'Confirm security gates are enforced',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-14.2.1',
    name: 'Secure Cloud Development Policy',
    description: 'Rules for the development of cloud-native software and systems shall be established and applied.',
    category: 'System Development and Maintenance',
    implementationGuidance: 'Implement secure coding standards for cloud-native development. Use infrastructure-as-code security scanning. Implement secrets management in CI/CD. Deploy container security best practices. Use cloud security posture management (CSPM) tools.',
    evidenceRequirements: [
      'Secure cloud development standards',
      'Infrastructure-as-code scanning configurations',
      'Secrets management in CI/CD evidence',
      'Container security standards',
      'CSPM tool deployment',
    ],
    testProcedures: [
      'Review secure development standards',
      'Verify IaC scanning is implemented',
      'Test secrets management effectiveness',
      'Review container security practices',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-14.2.5',
    name: 'Secure Cloud System Engineering Principles',
    description: 'Principles for engineering secure cloud systems shall be established, documented, maintained and applied.',
    category: 'System Development and Maintenance',
    implementationGuidance: 'Document cloud architecture security principles (defense in depth, zero trust, least privilege). Use cloud well-architected frameworks. Implement reference architectures for common patterns. Conduct architecture security reviews for new cloud deployments.',
    evidenceRequirements: [
      'Cloud security architecture principles',
      'Well-architected framework adoption evidence',
      'Reference architecture documentation',
      'Architecture security review records',
    ],
    testProcedures: [
      'Review security architecture principles',
      'Verify well-architected reviews are conducted',
      'Sample deployments for architecture compliance',
      'Review architecture security review records',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 15: SUPPLIER RELATIONSHIPS (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-15.1.1',
    name: 'Cloud Service Provider Security Policy',
    description: 'Information security requirements for mitigating the risks associated with cloud service provider access shall be agreed and documented.',
    category: 'Supplier Relationships',
    implementationGuidance: 'Document CSP security requirements in contracts. Review and maintain CSP security certifications. Establish CSP security monitoring and assessment processes. Define incident notification requirements. Include security requirements in SLAs.',
    evidenceRequirements: [
      'CSP security requirements documentation',
      'CSP security certifications inventory',
      'CSP security assessment process',
      'Incident notification requirements in contracts',
      'Security SLAs with CSPs',
    ],
    testProcedures: [
      'Review CSP contract security requirements',
      'Verify CSP certifications are current',
      'Confirm security assessment processes are followed',
      'Review incident notification compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-15.2.1',
    name: 'Cloud Service Monitoring and Review',
    description: 'Cloud service customer shall regularly monitor, review and audit cloud service provider service delivery.',
    category: 'Supplier Relationships',
    implementationGuidance: 'Implement continuous monitoring of CSP security posture. Review CSP audit reports (SOC 2, ISO 27001) regularly. Monitor CSP security bulletins and incidents. Conduct periodic CSP security assessments. Track CSP compliance with contractual obligations.',
    evidenceRequirements: [
      'CSP monitoring dashboard or reports',
      'CSP audit report review records',
      'CSP security bulletin tracking',
      'CSP security assessment records',
      'Contractual compliance tracking',
    ],
    testProcedures: [
      'Review CSP monitoring coverage',
      'Verify CSP audit reports are reviewed',
      'Confirm security bulletin tracking process',
      'Review CSP assessment frequency and findings',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 16: INFORMATION SECURITY INCIDENT MANAGEMENT (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-16.1.1',
    name: 'Cloud Security Incident Responsibilities',
    description: 'Management responsibilities and procedures shall be established to ensure a quick, effective and orderly response to information security incidents in cloud environments.',
    category: 'Incident Management',
    implementationGuidance: 'Define incident response responsibilities between CSC and CSP. Establish cloud-specific incident response playbooks. Integrate CSP incident notifications into response processes. Implement automated incident detection and response capabilities.',
    evidenceRequirements: [
      'Cloud incident response plan',
      'Incident responsibility matrix (CSC/CSP)',
      'Cloud-specific incident playbooks',
      'CSP incident notification integration',
      'Automated detection and response configurations',
    ],
    testProcedures: [
      'Review cloud incident response plan',
      'Verify responsibility matrix is complete',
      'Test incident playbook execution',
      'Confirm CSP notification integration works',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-16.1.2',
    name: 'Cloud Security Event Reporting',
    description: 'Information security events in cloud services shall be reported through appropriate management channels as quickly as possible.',
    category: 'Incident Management',
    implementationGuidance: 'Implement centralized security event reporting for cloud. Integrate cloud security alerts into SIEM. Define escalation paths for cloud security events. Enable CSP security event notifications. Provide clear reporting channels for users.',
    evidenceRequirements: [
      'Cloud security event reporting procedures',
      'SIEM integration for cloud alerts',
      'Escalation path documentation',
      'CSP notification configuration',
      'User reporting channel documentation',
    ],
    testProcedures: [
      'Review event reporting procedures',
      'Verify SIEM integration coverage',
      'Test escalation path effectiveness',
      'Confirm CSP notifications are received',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-16.1.5',
    name: 'Cloud Security Incident Response',
    description: 'Information security incidents in cloud environments shall be responded to in accordance with documented procedures.',
    category: 'Incident Management',
    implementationGuidance: 'Implement cloud-native incident response tools. Use automated containment and remediation where possible. Coordinate with CSP during incident response. Document incident timeline and evidence in cloud environments. Conduct post-incident reviews for cloud incidents.',
    evidenceRequirements: [
      'Cloud incident response procedures',
      'Automated response tool configurations',
      'CSP coordination procedures',
      'Incident documentation templates',
      'Post-incident review records',
    ],
    testProcedures: [
      'Review incident response procedures',
      'Test automated response capabilities',
      'Verify CSP coordination is documented',
      'Review post-incident review completeness',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 17: BUSINESS CONTINUITY (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-17.1.1',
    name: 'Cloud Business Continuity Planning',
    description: 'The organization shall determine requirements for information security and continuity of cloud services in adverse situations.',
    category: 'Business Continuity',
    implementationGuidance: 'Assess cloud service continuity requirements (RTO/RPO). Design multi-region/multi-availability zone architectures. Understand CSP business continuity capabilities. Plan for CSP-specific failure scenarios. Include cloud in business continuity testing.',
    evidenceRequirements: [
      'Cloud continuity requirements documentation',
      'Multi-region/AZ architecture designs',
      'CSP continuity capability assessment',
      'Cloud failure scenario planning',
      'Cloud continuity test plans and results',
    ],
    testProcedures: [
      'Review cloud continuity requirements',
      'Verify multi-region architecture implementation',
      'Confirm CSP capabilities meet requirements',
      'Review cloud continuity test results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-17.1.2',
    name: 'Implementing Cloud Continuity',
    description: 'The organization shall establish, document, implement and maintain processes, procedures and controls for cloud service continuity.',
    category: 'Business Continuity',
    implementationGuidance: 'Implement cloud disaster recovery procedures. Use cloud-native backup and replication. Deploy infrastructure-as-code for rapid recovery. Implement automated failover where possible. Document recovery procedures for different cloud failure scenarios.',
    evidenceRequirements: [
      'Cloud disaster recovery procedures',
      'Backup and replication configurations',
      'Infrastructure-as-code for DR',
      'Automated failover configurations',
      'Recovery procedure documentation',
    ],
    testProcedures: [
      'Review DR procedure documentation',
      'Verify backup and replication setup',
      'Test failover mechanisms',
      'Validate recovery procedures work',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-17.2.1',
    name: 'Cloud Service Availability',
    description: 'Cloud service availability shall be planned, implemented, and tested to ensure information security requirements are met.',
    category: 'Business Continuity',
    implementationGuidance: 'Design for cloud service availability using CSP best practices. Implement health checks and auto-healing. Use load balancing and auto-scaling. Monitor availability metrics. Test availability under failure conditions. Document availability SLAs with CSPs.',
    evidenceRequirements: [
      'Cloud availability architecture design',
      'Health check and auto-healing configurations',
      'Load balancing and auto-scaling setup',
      'Availability monitoring dashboards',
      'Availability test results',
      'CSP availability SLAs',
    ],
    testProcedures: [
      'Review availability architecture',
      'Verify health checks are configured',
      'Test auto-scaling under load',
      'Review availability metrics and SLA compliance',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CLAUSE 18: COMPLIANCE (CLOUD)
  // ============================================================
  {
    controlId: 'ISO27017-18.1.1',
    name: 'Cloud Legal and Contractual Requirements',
    description: 'All relevant legislative, statutory, regulatory and contractual requirements related to cloud services shall be identified and documented.',
    category: 'Compliance',
    implementationGuidance: 'Identify compliance requirements applicable to cloud-hosted data. Document data residency and sovereignty requirements. Review CSP compliance certifications for relevant standards. Include compliance requirements in CSP contracts. Monitor regulatory changes affecting cloud usage.',
    evidenceRequirements: [
      'Cloud compliance requirements register',
      'Data residency requirements documentation',
      'CSP compliance certification inventory',
      'Compliance requirements in contracts',
      'Regulatory change monitoring process',
    ],
    testProcedures: [
      'Review compliance requirements completeness',
      'Verify data residency compliance',
      'Confirm CSP certifications meet requirements',
      'Review contract compliance terms',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-18.1.3',
    name: 'Cloud Records Protection',
    description: 'Records in cloud services shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.',
    category: 'Compliance',
    implementationGuidance: 'Implement cloud record retention policies. Use immutable storage for compliance records. Apply appropriate encryption and access controls. Implement data loss prevention for records. Ensure records can be retrieved for legal/regulatory purposes.',
    evidenceRequirements: [
      'Cloud record retention policy',
      'Immutable storage configurations',
      'Record encryption and access controls',
      'DLP configurations for records',
      'Record retrieval procedures',
    ],
    testProcedures: [
      'Review retention policy implementation',
      'Verify immutable storage is used',
      'Test record access controls',
      'Validate record retrieval capability',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-18.1.5',
    name: 'Cloud Cryptographic Controls Regulation',
    description: 'Cryptographic controls in cloud services shall be used in compliance with all relevant agreements, legislation and regulations.',
    category: 'Compliance',
    implementationGuidance: 'Review export control regulations for cryptography in cloud. Ensure encryption meets jurisdictional requirements. Document cryptographic compliance for different cloud regions. Maintain evidence of cryptographic compliance.',
    evidenceRequirements: [
      'Cryptographic compliance requirements',
      'Export control compliance documentation',
      'Regional encryption configurations',
      'Cryptographic compliance evidence',
    ],
    testProcedures: [
      'Review cryptographic compliance requirements',
      'Verify regional encryption compliance',
      'Confirm export controls are followed',
      'Review compliance documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'ISO27017-18.2.1',
    name: 'Cloud Security Compliance Review',
    description: 'The organization approach to managing information security in cloud services shall be reviewed independently at planned intervals.',
    category: 'Compliance',
    implementationGuidance: 'Conduct regular cloud security assessments. Engage independent auditors for cloud security reviews. Use cloud security posture management tools for continuous compliance. Review CSP audit reports and certifications. Address findings with remediation plans.',
    evidenceRequirements: [
      'Cloud security assessment schedule',
      'Independent audit reports',
      'CSPM tool compliance reports',
      'CSP audit report reviews',
      'Finding remediation plans and tracking',
    ],
    testProcedures: [
      'Review assessment schedule compliance',
      'Verify independent audits are conducted',
      'Review CSPM compliance status',
      'Confirm findings are remediated',
    ],
    status: 'Not Started',
  },
];
