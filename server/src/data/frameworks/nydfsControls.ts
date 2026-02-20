import { FrameworkControlTemplate } from './soc2Controls';

/**
 * NYDFS Cybersecurity Regulation (23 NYCRR 500)
 * New York Department of Financial Services Cybersecurity Requirements
 */
export const NYDFS_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Section 500.2: Cybersecurity Program =====
  {
    controlId: 'NYDFS-500.2',
    name: 'Cybersecurity Program',
    description: 'Maintain a cybersecurity program designed to protect confidentiality, integrity and availability of Information Systems based on Risk Assessment.',
    category: 'Cybersecurity Program',
    implementationGuidance: 'Design program addressing identified risks. Include core cybersecurity functions. Update program based on risk changes. Document program comprehensively.',
    evidenceRequirements: ['Cybersecurity program documentation', 'Risk assessment linkage', 'Program update records', 'Core function coverage'],
    testProcedures: ['Review program comprehensiveness', 'Verify risk-based design', 'Test update process', 'Assess function coverage'],
    status: 'Not Started'
  },

  // ===== Section 500.3: Cybersecurity Policy =====
  {
    controlId: 'NYDFS-500.3',
    name: 'Cybersecurity Policy',
    description: 'Implement written cybersecurity policies approved by senior officer or board covering information security, data governance, asset inventory, access controls, and more.',
    category: 'Governance',
    implementationGuidance: 'Develop policies covering all required areas. Obtain senior officer/board approval. Review and update policies annually. Distribute policies appropriately.',
    evidenceRequirements: ['Written cybersecurity policies', 'Approval documentation', 'Annual review records', 'Distribution records'],
    testProcedures: ['Review policy coverage', 'Verify approval process', 'Test annual review', 'Assess distribution'],
    status: 'Not Started'
  },

  // ===== Section 500.4: Chief Information Security Officer =====
  {
    controlId: 'NYDFS-500.4',
    name: 'CISO Designation',
    description: 'Designate a qualified CISO responsible for overseeing and implementing cybersecurity program and enforcing policies. CISO shall report to Board of Directors or senior officer.',
    category: 'Governance',
    implementationGuidance: 'Appoint qualified CISO. Define CISO responsibilities. Establish board/senior reporting. Document CISO authority.',
    evidenceRequirements: ['CISO appointment documentation', 'Qualification records', 'Reporting structure', 'Responsibility definition'],
    testProcedures: ['Verify CISO qualifications', 'Test reporting relationships', 'Review responsibility clarity', 'Assess authority'],
    status: 'Not Started'
  },

  // ===== Section 500.5: Penetration Testing and Vulnerability Assessments =====
  {
    controlId: 'NYDFS-500.5',
    name: 'Penetration Testing and Vulnerability Assessment',
    description: 'Conduct annual penetration testing and bi-annual vulnerability assessments, including systematic scans designed to identify publicly known vulnerabilities.',
    category: 'Technical Security',
    implementationGuidance: 'Conduct annual penetration tests. Perform bi-annual vulnerability assessments. Track and remediate findings. Document testing methodology.',
    evidenceRequirements: ['Annual penetration test reports', 'Bi-annual vulnerability assessment reports', 'Remediation tracking', 'Testing methodology documentation'],
    testProcedures: ['Verify testing frequency', 'Review test scope', 'Test remediation tracking', 'Assess methodology'],
    status: 'Not Started'
  },

  // ===== Section 500.6: Audit Trail =====
  {
    controlId: 'NYDFS-500.6',
    name: 'Audit Trail',
    description: 'Maintain audit trail systems that track and maintain data to allow complete reconstruction of financial transactions and detect unauthorized access.',
    category: 'Monitoring',
    implementationGuidance: 'Implement comprehensive audit logging. Track financial transactions. Detect unauthorized access. Retain logs for required period.',
    evidenceRequirements: ['Audit trail system documentation', 'Transaction tracking records', 'Unauthorized access detection', 'Retention compliance'],
    testProcedures: ['Test audit trail completeness', 'Verify transaction reconstruction', 'Test detection capability', 'Review retention'],
    status: 'Not Started'
  },

  // ===== Section 500.7: Access Privileges =====
  {
    controlId: 'NYDFS-500.7',
    name: 'Access Privileges',
    description: 'Limit access privileges to Information Systems and Nonpublic Information to authorized users based on job function and periodically review access.',
    category: 'Access Control',
    implementationGuidance: 'Implement least privilege access. Base access on job function. Review access periodically. Remove access upon termination.',
    evidenceRequirements: ['Access privilege documentation', 'Job function mapping', 'Periodic review records', 'Termination access removal'],
    testProcedures: ['Verify least privilege', 'Test job function alignment', 'Review access reviews', 'Test termination process'],
    status: 'Not Started'
  },

  // ===== Section 500.8: Application Security =====
  {
    controlId: 'NYDFS-500.8',
    name: 'Application Security',
    description: 'Include written procedures and guidelines for secure development practices for in-house applications and procedures for evaluating third-party applications.',
    category: 'Application Security',
    implementationGuidance: 'Establish secure development procedures. Implement SDLC security. Evaluate third-party application security. Document security practices.',
    evidenceRequirements: ['Secure development procedures', 'SDLC security documentation', 'Third-party evaluation records', 'Security practice documentation'],
    testProcedures: ['Review development procedures', 'Test SDLC compliance', 'Verify third-party evaluation', 'Assess documentation'],
    status: 'Not Started'
  },

  // ===== Section 500.9: Risk Assessment =====
  {
    controlId: 'NYDFS-500.9',
    name: 'Risk Assessment',
    description: 'Conduct periodic risk assessments to inform cybersecurity program design, addressing cybersecurity risks, information systems, nonpublic information, and threats.',
    category: 'Risk Management',
    implementationGuidance: 'Conduct periodic risk assessments. Identify cybersecurity risks. Assess threats to information systems. Update assessments for changes.',
    evidenceRequirements: ['Risk assessment reports', 'Risk identification documentation', 'Threat assessment records', 'Assessment update records'],
    testProcedures: ['Review assessment periodicity', 'Verify risk identification', 'Test threat assessment', 'Assess update process'],
    status: 'Not Started'
  },

  // ===== Section 500.10: Cybersecurity Personnel and Intelligence =====
  {
    controlId: 'NYDFS-500.10',
    name: 'Cybersecurity Personnel',
    description: 'Utilize qualified cybersecurity personnel to manage cybersecurity risks and oversee the cybersecurity program, with continuous learning requirements.',
    category: 'Personnel',
    implementationGuidance: 'Employ qualified cybersecurity personnel. Provide continuous training. Monitor threat intelligence. Update knowledge regularly.',
    evidenceRequirements: ['Personnel qualifications', 'Training records', 'Threat intelligence monitoring', 'Knowledge update documentation'],
    testProcedures: ['Verify qualifications', 'Test training completion', 'Review intelligence monitoring', 'Assess knowledge currency'],
    status: 'Not Started'
  },

  // ===== Section 500.11: Third Party Service Provider Security Policy =====
  {
    controlId: 'NYDFS-500.11',
    name: 'Third Party Service Provider Security',
    description: 'Implement written policies and procedures for due diligence and contractual protections relating to Third Party Service Providers.',
    category: 'Third Party Risk',
    implementationGuidance: 'Establish third party security policies. Conduct due diligence. Include security requirements in contracts. Monitor third party compliance.',
    evidenceRequirements: ['Third party security policy', 'Due diligence records', 'Contract security requirements', 'Monitoring documentation'],
    testProcedures: ['Review policy coverage', 'Verify due diligence', 'Test contract requirements', 'Assess monitoring'],
    status: 'Not Started'
  },

  // ===== Section 500.12: Multi-Factor Authentication =====
  {
    controlId: 'NYDFS-500.12',
    name: 'Multi-Factor Authentication',
    description: 'Implement multi-factor authentication for any individual accessing internal networks from external network, unless equivalent or more secure access controls approved in writing by CISO.',
    category: 'Access Control',
    implementationGuidance: 'Implement MFA for remote access. Apply to all external network access. Document any compensating controls. Obtain CISO approval for exceptions.',
    evidenceRequirements: ['MFA implementation documentation', 'Remote access records', 'Compensating control documentation', 'CISO exception approvals'],
    testProcedures: ['Test MFA implementation', 'Verify remote access coverage', 'Review compensating controls', 'Assess exception approvals'],
    status: 'Not Started'
  },

  // ===== Section 500.13: Limitations on Data Retention =====
  {
    controlId: 'NYDFS-500.13',
    name: 'Data Retention Limitations',
    description: 'Implement policies for secure disposal of nonpublic information that is no longer necessary for business operations or other legitimate business purpose.',
    category: 'Data Management',
    implementationGuidance: 'Establish data retention limits. Implement secure disposal procedures. Document retention requirements. Verify disposal completion.',
    evidenceRequirements: ['Data retention policies', 'Secure disposal procedures', 'Retention schedule', 'Disposal verification records'],
    testProcedures: ['Review retention policy', 'Test disposal procedures', 'Verify retention compliance', 'Assess disposal verification'],
    status: 'Not Started'
  },

  // ===== Section 500.14: Training and Monitoring =====
  {
    controlId: 'NYDFS-500.14',
    name: 'Training and Monitoring',
    description: 'Provide regular cybersecurity awareness training for all personnel and implement risk-based monitoring of Information Systems.',
    category: 'Training',
    implementationGuidance: 'Conduct regular security awareness training. Monitor information system activity. Implement anomaly detection. Track training completion.',
    evidenceRequirements: ['Training program documentation', 'Training completion records', 'Monitoring system documentation', 'Anomaly detection records'],
    testProcedures: ['Verify training frequency', 'Test training completion', 'Review monitoring coverage', 'Assess detection capability'],
    status: 'Not Started'
  },

  // ===== Section 500.15: Encryption of Nonpublic Information =====
  {
    controlId: 'NYDFS-500.15',
    name: 'Encryption Requirements',
    description: 'Implement controls including encryption to protect Nonpublic Information held or transmitted over external networks and at rest.',
    category: 'Data Protection',
    implementationGuidance: 'Encrypt data in transit over external networks. Encrypt data at rest. Use approved encryption standards. Manage encryption keys securely.',
    evidenceRequirements: ['Encryption implementation documentation', 'Data in transit encryption', 'Data at rest encryption', 'Key management procedures'],
    testProcedures: ['Test encryption implementation', 'Verify transit encryption', 'Test rest encryption', 'Review key management'],
    status: 'Not Started'
  },

  // ===== Section 500.16: Incident Response Plan =====
  {
    controlId: 'NYDFS-500.16',
    name: 'Incident Response Plan',
    description: 'Establish written incident response plan designed to respond to and recover from Cybersecurity Events including defined roles, communication plans, and remediation.',
    category: 'Incident Response',
    implementationGuidance: 'Develop comprehensive incident response plan. Define roles and responsibilities. Establish communication procedures. Test plan regularly.',
    evidenceRequirements: ['Incident response plan', 'Role definitions', 'Communication procedures', 'Plan testing records'],
    testProcedures: ['Review plan comprehensiveness', 'Verify role clarity', 'Test communication', 'Assess testing frequency'],
    status: 'Not Started'
  },

  // ===== Section 500.17: Notification to Superintendent =====
  {
    controlId: 'NYDFS-500.17',
    name: 'Incident Notification',
    description: 'Notify the Superintendent of Cybersecurity Events that have a reasonable likelihood of materially harming normal operations within 72 hours.',
    category: 'Incident Response',
    implementationGuidance: 'Establish notification procedures. Define materiality thresholds. Implement 72-hour notification process. Document notifications.',
    evidenceRequirements: ['Notification procedures', 'Materiality threshold documentation', 'Notification timeline tracking', 'Notification records'],
    testProcedures: ['Review notification procedures', 'Verify materiality assessment', 'Test timeline compliance', 'Assess documentation'],
    status: 'Not Started'
  },

  // ===== Section 500.19: Annual Compliance Certification =====
  {
    controlId: 'NYDFS-500.19',
    name: 'Annual Compliance Certification',
    description: 'Submit annual certification of compliance with 23 NYCRR 500 to Superintendent, confirming cybersecurity program meets regulation requirements.',
    category: 'Compliance',
    implementationGuidance: 'Conduct annual compliance assessment. Prepare certification documentation. Submit to Superintendent by deadline. Maintain supporting records.',
    evidenceRequirements: ['Compliance assessment documentation', 'Certification submission', 'Deadline compliance records', 'Supporting documentation'],
    testProcedures: ['Review assessment completeness', 'Verify certification accuracy', 'Test deadline compliance', 'Assess supporting documentation'],
    status: 'Not Started'
  },

  // ===== 2023 Amendment Requirements =====
  {
    controlId: 'NYDFS-500.2A',
    name: 'Independent Audit (Class A Companies)',
    description: 'Class A companies must conduct annual independent audit of cybersecurity program by qualified auditor.',
    category: 'Audit',
    implementationGuidance: 'Engage qualified independent auditor. Conduct annual audit. Review audit findings. Implement remediation.',
    evidenceRequirements: ['Auditor qualifications', 'Annual audit reports', 'Finding remediation records', 'Audit scope documentation'],
    testProcedures: ['Verify auditor independence', 'Review audit coverage', 'Test remediation', 'Assess audit quality'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-500.4A',
    name: 'CISO Written Report',
    description: 'CISO shall provide annual written report to governing body covering cybersecurity program status, material risks, and program changes.',
    category: 'Governance',
    implementationGuidance: 'Prepare annual CISO report. Cover required content areas. Present to governing body. Document acknowledgment.',
    evidenceRequirements: ['Annual CISO report', 'Governing body presentation', 'Acknowledgment records', 'Report content verification'],
    testProcedures: ['Review report completeness', 'Verify presentation', 'Test acknowledgment', 'Assess content coverage'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-500.12A',
    name: 'Enhanced Access Management',
    description: 'Implement privileged access management solution and disable or remove unused accounts and access within prescribed timeframes.',
    category: 'Access Control',
    implementationGuidance: 'Implement PAM solution. Monitor privileged access. Disable unused accounts promptly. Review access regularly.',
    evidenceRequirements: ['PAM implementation', 'Privileged access monitoring', 'Unused account remediation', 'Access review records'],
    testProcedures: ['Test PAM functionality', 'Verify monitoring coverage', 'Test account disabling', 'Assess review frequency'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-500.14A',
    name: 'Endpoint Security',
    description: 'Implement endpoint detection and response solutions and centralized logging and security event alerting.',
    category: 'Technical Security',
    implementationGuidance: 'Deploy EDR solutions. Implement centralized logging. Configure security alerting. Monitor and respond to alerts.',
    evidenceRequirements: ['EDR deployment records', 'Centralized logging documentation', 'Alert configuration', 'Response records'],
    testProcedures: ['Test EDR coverage', 'Verify log centralization', 'Test alerting', 'Review response times'],
    status: 'Not Started'
  },
  {
    controlId: 'NYDFS-500.16A',
    name: 'Business Continuity and Disaster Recovery',
    description: 'Maintain business continuity and disaster recovery plans designed to minimize disruption to operations in event of Cybersecurity Event.',
    category: 'Business Continuity',
    implementationGuidance: 'Develop BCDR plans. Test plans annually. Update for changes. Maintain recovery capabilities.',
    evidenceRequirements: ['BCDR plan documentation', 'Annual test records', 'Plan update records', 'Recovery capability verification'],
    testProcedures: ['Review plan comprehensiveness', 'Verify annual testing', 'Test update process', 'Assess recovery capability'],
    status: 'Not Started'
  }
];
