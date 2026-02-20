import { FrameworkControlTemplate } from './soc2Controls';

/**
 * CJIS Security Policy
 * Criminal Justice Information Services Security Policy
 */
export const CJIS_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Policy Area 1: Information Exchange Agreements =====
  {
    controlId: 'CJIS-1.1',
    name: 'Information Exchange Agreements',
    description: 'Establish formal agreements governing the sharing of CJI between agencies and with contractors.',
    category: 'Information Exchange',
    implementationGuidance: 'Develop IEAs with all parties accessing CJI. Include security requirements. Review agreements periodically. Maintain agreement records.',
    evidenceRequirements: ['Information exchange agreements', 'Security requirement documentation', 'Review records', 'Agreement inventory'],
    testProcedures: ['Review IEA completeness', 'Verify security requirements', 'Test review process', 'Assess agreement tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-1.2',
    name: 'Management Control Agreements',
    description: 'Establish Management Control Agreements outlining responsibilities of contracting government agency and contractor.',
    category: 'Information Exchange',
    implementationGuidance: 'Execute MCAs with contractors. Define security responsibilities. Specify oversight requirements. Document compliance obligations.',
    evidenceRequirements: ['Management control agreements', 'Responsibility definitions', 'Oversight documentation', 'Compliance obligations'],
    testProcedures: ['Review MCA completeness', 'Verify responsibility clarity', 'Test oversight', 'Assess compliance tracking'],
    status: 'Not Started'
  },

  // ===== Policy Area 2: Security Awareness Training =====
  {
    controlId: 'CJIS-2.1',
    name: 'Security Awareness Training',
    description: 'Provide security awareness training to all personnel with access to CJI within 6 months of assignment and biennially thereafter.',
    category: 'Training',
    implementationGuidance: 'Develop CJIS security awareness curriculum. Train within 6 months of access. Conduct biennial refresher training. Track completion.',
    evidenceRequirements: ['Training curriculum', 'Initial training records', 'Biennial training records', 'Completion tracking'],
    testProcedures: ['Review curriculum content', 'Verify timing compliance', 'Test biennial completion', 'Assess tracking accuracy'],
    status: 'Not Started'
  },

  // ===== Policy Area 3: Incident Response =====
  {
    controlId: 'CJIS-3.1',
    name: 'Incident Response',
    description: 'Establish incident response capability for security incidents involving CJI including detection, analysis, containment, eradication, and recovery.',
    category: 'Incident Response',
    implementationGuidance: 'Develop incident response plan. Train response team. Test response procedures. Report incidents to CJIS SSO.',
    evidenceRequirements: ['Incident response plan', 'Team training records', 'Test records', 'Incident reports'],
    testProcedures: ['Review plan completeness', 'Verify team readiness', 'Test response procedures', 'Assess reporting compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-3.2',
    name: 'Incident Reporting',
    description: 'Report security incidents to CJIS Systems Officer within required timeframes based on incident severity.',
    category: 'Incident Response',
    implementationGuidance: 'Establish incident reporting procedures. Define severity levels. Implement reporting timelines. Document all reports.',
    evidenceRequirements: ['Reporting procedures', 'Severity definitions', 'Timeline documentation', 'Incident report records'],
    testProcedures: ['Test reporting process', 'Verify severity classification', 'Review timeline compliance', 'Assess documentation'],
    status: 'Not Started'
  },

  // ===== Policy Area 4: Auditing and Accountability =====
  {
    controlId: 'CJIS-4.1',
    name: 'Audit Logging',
    description: 'Generate and retain audit records for all CJI access including successful and unsuccessful access attempts.',
    category: 'Auditing',
    implementationGuidance: 'Configure comprehensive audit logging. Log all CJI access. Retain logs per requirements. Protect log integrity.',
    evidenceRequirements: ['Audit configuration', 'Access logging records', 'Retention compliance', 'Integrity protection'],
    testProcedures: ['Test logging coverage', 'Verify access recording', 'Review retention', 'Assess integrity protection'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-4.2',
    name: 'Audit Review and Analysis',
    description: 'Review and analyze audit records for indications of inappropriate or unusual activity on a regular basis.',
    category: 'Auditing',
    implementationGuidance: 'Establish audit review procedures. Conduct regular reviews. Investigate anomalies. Document review findings.',
    evidenceRequirements: ['Review procedures', 'Review records', 'Anomaly investigations', 'Finding documentation'],
    testProcedures: ['Test review process', 'Verify review frequency', 'Review investigations', 'Assess documentation'],
    status: 'Not Started'
  },

  // ===== Policy Area 5: Access Control =====
  {
    controlId: 'CJIS-5.1',
    name: 'Account Management',
    description: 'Manage information system accounts including establishing, activating, modifying, reviewing, disabling, and removing accounts.',
    category: 'Access Control',
    implementationGuidance: 'Implement account lifecycle management. Conduct periodic reviews. Disable inactive accounts. Remove terminated accounts promptly.',
    evidenceRequirements: ['Account management procedures', 'Review records', 'Inactive account reports', 'Termination removal records'],
    testProcedures: ['Test account lifecycle', 'Verify review process', 'Check inactive accounts', 'Assess termination timing'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-5.2',
    name: 'Access Enforcement',
    description: 'Enforce approved authorizations for logical access to CJI in accordance with applicable access control policies.',
    category: 'Access Control',
    implementationGuidance: 'Implement access enforcement mechanisms. Configure access based on authorization. Prevent unauthorized access. Monitor enforcement.',
    evidenceRequirements: ['Enforcement mechanism documentation', 'Authorization records', 'Access denial logs', 'Monitoring records'],
    testProcedures: ['Test enforcement mechanisms', 'Verify authorization accuracy', 'Review denial logs', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-5.3',
    name: 'Least Privilege',
    description: 'Employ principle of least privilege allowing only authorized access necessary for users to accomplish assigned tasks.',
    category: 'Access Control',
    implementationGuidance: 'Define minimum necessary access. Assign access based on job function. Review access periodically. Remove excess privileges.',
    evidenceRequirements: ['Access definitions', 'Job function mapping', 'Access review records', 'Privilege removal records'],
    testProcedures: ['Review access definitions', 'Verify job function alignment', 'Test access reviews', 'Check privilege removal'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-5.4',
    name: 'Remote Access',
    description: 'Establish usage restrictions and implementation guidance for remote access to CJI.',
    category: 'Access Control',
    implementationGuidance: 'Define remote access restrictions. Implement secure remote access. Monitor remote sessions. Enforce time-out policies.',
    evidenceRequirements: ['Remote access policy', 'Security implementation', 'Session monitoring', 'Time-out configuration'],
    testProcedures: ['Review access restrictions', 'Test security measures', 'Verify monitoring', 'Test time-out enforcement'],
    status: 'Not Started'
  },

  // ===== Policy Area 6: Identification and Authentication =====
  {
    controlId: 'CJIS-6.1',
    name: 'Identification and Authentication',
    description: 'Uniquely identify and authenticate users accessing CJI with appropriate credentials.',
    category: 'Authentication',
    implementationGuidance: 'Implement unique user identification. Require authentication before access. Use appropriate credential strength. Protect credentials.',
    evidenceRequirements: ['Identification implementation', 'Authentication configuration', 'Credential standards', 'Protection measures'],
    testProcedures: ['Test identification uniqueness', 'Verify authentication', 'Review credential strength', 'Assess protection'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-6.2',
    name: 'Advanced Authentication',
    description: 'Implement advanced authentication (multi-factor) for access to CJI from outside secure locations.',
    category: 'Authentication',
    implementationGuidance: 'Deploy multi-factor authentication. Apply for external access. Configure authentication factors. Monitor authentication.',
    evidenceRequirements: ['MFA implementation', 'External access coverage', 'Factor configuration', 'Authentication logs'],
    testProcedures: ['Test MFA functionality', 'Verify external coverage', 'Review factors', 'Check logs'],
    status: 'Not Started'
  },

  // ===== Policy Area 7: Configuration Management =====
  {
    controlId: 'CJIS-7.1',
    name: 'Baseline Configuration',
    description: 'Establish and maintain baseline configurations for information systems processing CJI.',
    category: 'Configuration Management',
    implementationGuidance: 'Develop baseline configurations. Document security settings. Apply baselines consistently. Update baselines as needed.',
    evidenceRequirements: ['Baseline documentation', 'Security settings', 'Application records', 'Update records'],
    testProcedures: ['Review baseline completeness', 'Verify settings', 'Test application', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-7.2',
    name: 'Configuration Change Control',
    description: 'Manage configuration changes to information systems through formal change control process.',
    category: 'Configuration Management',
    implementationGuidance: 'Establish change control process. Review proposed changes. Approve security-relevant changes. Document all changes.',
    evidenceRequirements: ['Change control procedures', 'Change review records', 'Approval documentation', 'Change logs'],
    testProcedures: ['Test change process', 'Verify reviews', 'Check approvals', 'Review change logs'],
    status: 'Not Started'
  },

  // ===== Policy Area 8: Media Protection =====
  {
    controlId: 'CJIS-8.1',
    name: 'Media Protection',
    description: 'Protect system media containing CJI both physically and logically.',
    category: 'Media Protection',
    implementationGuidance: 'Restrict media access. Protect media during transport. Sanitize before disposal. Track media inventory.',
    evidenceRequirements: ['Media access controls', 'Transport protection', 'Sanitization records', 'Media inventory'],
    testProcedures: ['Test access restrictions', 'Verify transport protection', 'Review sanitization', 'Check inventory'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-8.2',
    name: 'Media Sanitization',
    description: 'Sanitize media containing CJI before disposal or release using approved methods.',
    category: 'Media Protection',
    implementationGuidance: 'Define sanitization methods. Apply appropriate techniques. Verify sanitization. Document disposal.',
    evidenceRequirements: ['Sanitization methods', 'Technique application', 'Verification records', 'Disposal documentation'],
    testProcedures: ['Review methods', 'Test techniques', 'Verify effectiveness', 'Check documentation'],
    status: 'Not Started'
  },

  // ===== Policy Area 9: Physical Protection =====
  {
    controlId: 'CJIS-9.1',
    name: 'Physical Access Authorizations',
    description: 'Develop and maintain lists of personnel with authorized access to physically secure locations containing CJI.',
    category: 'Physical Security',
    implementationGuidance: 'Maintain authorized access lists. Review authorizations regularly. Remove access when no longer needed. Document access grants.',
    evidenceRequirements: ['Authorized access lists', 'Review records', 'Access removal records', 'Grant documentation'],
    testProcedures: ['Review access lists', 'Test review process', 'Verify removals', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-9.2',
    name: 'Physical Access Control',
    description: 'Control physical access to secure locations through appropriate mechanisms such as key cards, guards, or other controls.',
    category: 'Physical Security',
    implementationGuidance: 'Implement physical access controls. Monitor access points. Log physical access. Investigate unauthorized attempts.',
    evidenceRequirements: ['Access control mechanisms', 'Monitoring documentation', 'Access logs', 'Investigation records'],
    testProcedures: ['Test access controls', 'Verify monitoring', 'Review logs', 'Check investigations'],
    status: 'Not Started'
  },

  // ===== Policy Area 10: Systems and Communications Protection =====
  {
    controlId: 'CJIS-10.1',
    name: 'Encryption',
    description: 'Protect CJI transmitted outside secure location using encryption meeting FIPS 140-2 requirements.',
    category: 'Communications',
    implementationGuidance: 'Implement FIPS 140-2 compliant encryption. Encrypt CJI in transit. Manage encryption keys. Monitor encryption status.',
    evidenceRequirements: ['Encryption implementation', 'FIPS compliance', 'Key management', 'Status monitoring'],
    testProcedures: ['Test encryption', 'Verify FIPS compliance', 'Review key management', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-10.2',
    name: 'Boundary Protection',
    description: 'Monitor and control communications at external boundaries and key internal boundaries of information systems.',
    category: 'Communications',
    implementationGuidance: 'Implement boundary protection. Monitor boundary traffic. Control communications flow. Document boundary architecture.',
    evidenceRequirements: ['Boundary protection implementation', 'Traffic monitoring', 'Flow control configuration', 'Architecture documentation'],
    testProcedures: ['Test boundary protection', 'Verify monitoring', 'Check flow control', 'Review architecture'],
    status: 'Not Started'
  },

  // ===== Policy Area 11: System and Information Integrity =====
  {
    controlId: 'CJIS-11.1',
    name: 'Malicious Code Protection',
    description: 'Implement malicious code protection mechanisms at entry and exit points and workstations.',
    category: 'System Integrity',
    implementationGuidance: 'Deploy anti-malware protection. Update signatures regularly. Scan for malicious code. Respond to detections.',
    evidenceRequirements: ['Anti-malware deployment', 'Update records', 'Scan logs', 'Detection response'],
    testProcedures: ['Test protection coverage', 'Verify updates', 'Review scan logs', 'Check responses'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-11.2',
    name: 'Security Alerts and Advisories',
    description: 'Receive security alerts and advisories from FBI CJIS and respond appropriately.',
    category: 'System Integrity',
    implementationGuidance: 'Subscribe to CJIS alerts. Review advisories promptly. Implement recommended actions. Document responses.',
    evidenceRequirements: ['Alert subscription', 'Advisory review records', 'Action implementation', 'Response documentation'],
    testProcedures: ['Verify subscription', 'Test review process', 'Check implementations', 'Review documentation'],
    status: 'Not Started'
  },

  // ===== Policy Area 12: Personnel Security =====
  {
    controlId: 'CJIS-12.1',
    name: 'Personnel Screening',
    description: 'Screen individuals requiring access to CJI through fingerprint-based record checks.',
    category: 'Personnel Security',
    implementationGuidance: 'Conduct fingerprint-based background checks. Verify screening completion. Rescreen periodically. Document screening results.',
    evidenceRequirements: ['Background check records', 'Screening verification', 'Rescreen records', 'Result documentation'],
    testProcedures: ['Verify screening process', 'Check completion', 'Test rescreen compliance', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CJIS-12.2',
    name: 'Personnel Termination',
    description: 'Upon termination, disable access to CJI and retrieve all CJI-related items within specified timeframes.',
    category: 'Personnel Security',
    implementationGuidance: 'Implement termination procedures. Disable access immediately. Retrieve items promptly. Document termination actions.',
    evidenceRequirements: ['Termination procedures', 'Access disabling records', 'Item retrieval records', 'Termination documentation'],
    testProcedures: ['Test termination process', 'Verify access disabling', 'Check item retrieval', 'Review documentation'],
    status: 'Not Started'
  },

  // ===== Policy Area 13: Mobile Devices =====
  {
    controlId: 'CJIS-13.1',
    name: 'Mobile Device Security',
    description: 'Implement security controls for mobile devices accessing CJI including encryption and remote wipe capability.',
    category: 'Mobile Security',
    implementationGuidance: 'Deploy mobile device management. Encrypt devices. Enable remote wipe. Enforce device policies.',
    evidenceRequirements: ['MDM implementation', 'Encryption configuration', 'Remote wipe capability', 'Policy enforcement'],
    testProcedures: ['Test MDM coverage', 'Verify encryption', 'Test remote wipe', 'Check policy enforcement'],
    status: 'Not Started'
  }
];
