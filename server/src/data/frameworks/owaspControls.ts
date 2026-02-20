import { FrameworkControlTemplate } from './soc2Controls';

/**
 * OWASP Security Frameworks
 * OWASP Top 10, OWASP SAMM, ASVS
 */

export const OWASP_TOP_10_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'OWASP-A01',
    name: 'Broken Access Control',
    description: 'Implement proper access control to prevent users from acting outside of their intended permissions.',
    category: 'Access Control',
    implementationGuidance: 'Implement principle of least privilege. Deny by default. Enforce server-side access controls. Disable directory listing. Log access failures.',
    evidenceRequirements: ['Access control implementation', 'Deny-by-default configuration', 'Server-side enforcement', 'Logging configuration'],
    testProcedures: ['Test access controls', 'Verify deny-by-default', 'Check server enforcement', 'Review logs'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A02',
    name: 'Cryptographic Failures',
    description: 'Protect sensitive data with proper cryptographic controls.',
    category: 'Cryptography',
    implementationGuidance: 'Classify data sensitivity. Encrypt data in transit and at rest. Use strong algorithms. Manage keys securely. Disable caching for sensitive data.',
    evidenceRequirements: ['Data classification', 'Encryption implementation', 'Algorithm documentation', 'Key management'],
    testProcedures: ['Review classification', 'Test encryption', 'Verify algorithms', 'Check key management'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A03',
    name: 'Injection',
    description: 'Prevent injection attacks including SQL, NoSQL, OS, and LDAP injection.',
    category: 'Input Validation',
    implementationGuidance: 'Use parameterized queries. Validate all input. Escape special characters. Use WAF. Implement positive server-side validation.',
    evidenceRequirements: ['Parameterized query usage', 'Input validation', 'Escaping implementation', 'WAF configuration'],
    testProcedures: ['Test for injection', 'Verify validation', 'Check escaping', 'Review WAF'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A04',
    name: 'Insecure Design',
    description: 'Implement secure design principles and threat modeling.',
    category: 'Secure Design',
    implementationGuidance: 'Establish secure development lifecycle. Conduct threat modeling. Use secure design patterns. Implement defense in depth.',
    evidenceRequirements: ['SDL documentation', 'Threat models', 'Design patterns', 'Defense in depth'],
    testProcedures: ['Review SDL', 'Verify threat modeling', 'Check patterns', 'Test defense in depth'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A05',
    name: 'Security Misconfiguration',
    description: 'Implement secure configuration across all components.',
    category: 'Configuration',
    implementationGuidance: 'Harden configurations. Remove unnecessary features. Update and patch regularly. Use automated configuration management.',
    evidenceRequirements: ['Hardening documentation', 'Feature inventory', 'Patch records', 'Configuration management'],
    testProcedures: ['Test hardening', 'Verify feature removal', 'Check patches', 'Review configuration management'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A06',
    name: 'Vulnerable and Outdated Components',
    description: 'Identify and remediate vulnerable components in applications.',
    category: 'Component Security',
    implementationGuidance: 'Maintain component inventory. Monitor for vulnerabilities. Remove unused components. Update regularly.',
    evidenceRequirements: ['Component inventory', 'Vulnerability monitoring', 'Removal records', 'Update records'],
    testProcedures: ['Review inventory', 'Test monitoring', 'Verify removal', 'Check updates'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A07',
    name: 'Identification and Authentication Failures',
    description: 'Implement strong authentication and session management.',
    category: 'Authentication',
    implementationGuidance: 'Implement MFA. Enforce strong passwords. Protect against brute force. Secure session management.',
    evidenceRequirements: ['MFA implementation', 'Password policy', 'Brute force protection', 'Session management'],
    testProcedures: ['Test MFA', 'Verify password policy', 'Check brute force protection', 'Test sessions'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A08',
    name: 'Software and Data Integrity Failures',
    description: 'Ensure software and data integrity through verification and protection.',
    category: 'Integrity',
    implementationGuidance: 'Verify software integrity. Implement CI/CD security. Validate data integrity. Use digital signatures.',
    evidenceRequirements: ['Integrity verification', 'CI/CD security', 'Data validation', 'Signature implementation'],
    testProcedures: ['Test integrity', 'Verify CI/CD', 'Check validation', 'Test signatures'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A09',
    name: 'Security Logging and Monitoring Failures',
    description: 'Implement comprehensive logging and monitoring for security events.',
    category: 'Logging',
    implementationGuidance: 'Log security events. Monitor for anomalies. Implement alerting. Ensure log integrity.',
    evidenceRequirements: ['Logging implementation', 'Monitoring configuration', 'Alert configuration', 'Log protection'],
    testProcedures: ['Test logging', 'Verify monitoring', 'Check alerts', 'Review log protection'],
    status: 'Not Started'
  },
  {
    controlId: 'OWASP-A10',
    name: 'Server-Side Request Forgery (SSRF)',
    description: 'Prevent SSRF vulnerabilities that allow attackers to induce server-side requests.',
    category: 'Network Security',
    implementationGuidance: 'Validate and sanitize URLs. Use allowlists. Disable HTTP redirects. Segment network access.',
    evidenceRequirements: ['URL validation', 'Allowlist implementation', 'Redirect configuration', 'Network segmentation'],
    testProcedures: ['Test URL validation', 'Verify allowlists', 'Check redirects', 'Test segmentation'],
    status: 'Not Started'
  }
];

export const OWASP_SAMM_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Governance =====
  {
    controlId: 'SAMM-G.SM',
    name: 'Strategy and Metrics',
    description: 'Define and measure software security program effectiveness.',
    category: 'Governance',
    implementationGuidance: 'Define security strategy. Establish metrics. Track progress. Report to stakeholders.',
    evidenceRequirements: ['Security strategy', 'Metrics definition', 'Progress tracking', 'Stakeholder reports'],
    testProcedures: ['Review strategy', 'Verify metrics', 'Check tracking', 'Assess reports'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-G.PC',
    name: 'Policy and Compliance',
    description: 'Establish and enforce security policies.',
    category: 'Governance',
    implementationGuidance: 'Define security policies. Communicate policies. Monitor compliance. Address violations.',
    evidenceRequirements: ['Security policies', 'Communication records', 'Compliance monitoring', 'Violation handling'],
    testProcedures: ['Review policies', 'Verify communication', 'Test monitoring', 'Check handling'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-G.EG',
    name: 'Education and Guidance',
    description: 'Provide security education and guidance to development teams.',
    category: 'Governance',
    implementationGuidance: 'Develop training programs. Provide security guidance. Track training completion. Update materials.',
    evidenceRequirements: ['Training programs', 'Security guidance', 'Completion tracking', 'Material updates'],
    testProcedures: ['Review programs', 'Verify guidance', 'Check completion', 'Assess updates'],
    status: 'Not Started'
  },
  // ===== Design =====
  {
    controlId: 'SAMM-D.TA',
    name: 'Threat Assessment',
    description: 'Identify and assess security threats.',
    category: 'Design',
    implementationGuidance: 'Conduct threat modeling. Identify risks. Prioritize threats. Document findings.',
    evidenceRequirements: ['Threat models', 'Risk identification', 'Prioritization', 'Finding documentation'],
    testProcedures: ['Review threat models', 'Verify risks', 'Check prioritization', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-D.SR',
    name: 'Security Requirements',
    description: 'Define security requirements for applications.',
    category: 'Design',
    implementationGuidance: 'Define requirements. Include in specifications. Verify implementation. Track coverage.',
    evidenceRequirements: ['Security requirements', 'Specifications', 'Implementation verification', 'Coverage tracking'],
    testProcedures: ['Review requirements', 'Verify specifications', 'Check implementation', 'Assess coverage'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-D.SA',
    name: 'Security Architecture',
    description: 'Design secure application architecture.',
    category: 'Design',
    implementationGuidance: 'Design security architecture. Use secure patterns. Document decisions. Review architecture.',
    evidenceRequirements: ['Architecture documentation', 'Pattern usage', 'Decision records', 'Review records'],
    testProcedures: ['Review architecture', 'Verify patterns', 'Check decisions', 'Assess reviews'],
    status: 'Not Started'
  },
  // ===== Implementation =====
  {
    controlId: 'SAMM-I.SB',
    name: 'Secure Build',
    description: 'Implement secure build processes.',
    category: 'Implementation',
    implementationGuidance: 'Secure build environment. Verify dependencies. Implement build checks. Protect artifacts.',
    evidenceRequirements: ['Build security', 'Dependency verification', 'Build checks', 'Artifact protection'],
    testProcedures: ['Test build security', 'Verify dependencies', 'Check build checks', 'Assess protection'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-I.SD',
    name: 'Secure Deployment',
    description: 'Implement secure deployment processes.',
    category: 'Implementation',
    implementationGuidance: 'Secure deployment pipeline. Verify configurations. Implement deployment checks. Monitor deployments.',
    evidenceRequirements: ['Pipeline security', 'Configuration verification', 'Deployment checks', 'Deployment monitoring'],
    testProcedures: ['Test pipeline', 'Verify configurations', 'Check deployment checks', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-I.DM',
    name: 'Defect Management',
    description: 'Manage security defects effectively.',
    category: 'Implementation',
    implementationGuidance: 'Track defects. Prioritize remediation. Verify fixes. Analyze trends.',
    evidenceRequirements: ['Defect tracking', 'Remediation prioritization', 'Fix verification', 'Trend analysis'],
    testProcedures: ['Test tracking', 'Verify prioritization', 'Check fixes', 'Review trends'],
    status: 'Not Started'
  },
  // ===== Verification =====
  {
    controlId: 'SAMM-V.AA',
    name: 'Architecture Assessment',
    description: 'Assess application architecture security.',
    category: 'Verification',
    implementationGuidance: 'Conduct architecture reviews. Identify weaknesses. Document findings. Track remediation.',
    evidenceRequirements: ['Architecture reviews', 'Weakness identification', 'Finding documentation', 'Remediation tracking'],
    testProcedures: ['Review assessments', 'Verify weaknesses', 'Check documentation', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-V.RT',
    name: 'Requirements-driven Testing',
    description: 'Test applications against security requirements.',
    category: 'Verification',
    implementationGuidance: 'Define test cases. Execute security tests. Document results. Track coverage.',
    evidenceRequirements: ['Test cases', 'Test execution', 'Test results', 'Coverage tracking'],
    testProcedures: ['Review test cases', 'Verify execution', 'Check results', 'Assess coverage'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-V.ST',
    name: 'Security Testing',
    description: 'Conduct comprehensive security testing.',
    category: 'Verification',
    implementationGuidance: 'Perform SAST. Conduct DAST. Execute penetration tests. Analyze results.',
    evidenceRequirements: ['SAST results', 'DAST results', 'Penetration test reports', 'Result analysis'],
    testProcedures: ['Review SAST', 'Verify DAST', 'Check penetration tests', 'Assess analysis'],
    status: 'Not Started'
  },
  // ===== Operations =====
  {
    controlId: 'SAMM-O.IM',
    name: 'Incident Management',
    description: 'Manage security incidents effectively.',
    category: 'Operations',
    implementationGuidance: 'Define incident response. Detect incidents. Respond appropriately. Learn from incidents.',
    evidenceRequirements: ['Incident response plan', 'Detection capability', 'Response records', 'Lessons learned'],
    testProcedures: ['Review plan', 'Test detection', 'Verify response', 'Check lessons learned'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-O.EM',
    name: 'Environment Management',
    description: 'Manage application environments securely.',
    category: 'Operations',
    implementationGuidance: 'Harden environments. Monitor configurations. Patch regularly. Document environments.',
    evidenceRequirements: ['Hardening documentation', 'Configuration monitoring', 'Patch records', 'Environment documentation'],
    testProcedures: ['Test hardening', 'Verify monitoring', 'Check patches', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'SAMM-O.OE',
    name: 'Operational Enablement',
    description: 'Enable secure operations for applications.',
    category: 'Operations',
    implementationGuidance: 'Document operational procedures. Train operations staff. Enable security monitoring. Maintain runbooks.',
    evidenceRequirements: ['Operational procedures', 'Training records', 'Security monitoring', 'Runbooks'],
    testProcedures: ['Review procedures', 'Verify training', 'Test monitoring', 'Check runbooks'],
    status: 'Not Started'
  }
];

export const ASVS_CONTROLS: FrameworkControlTemplate[] = [
  // ===== V1: Architecture =====
  {
    controlId: 'ASVS-1.1',
    name: 'Secure Software Development Lifecycle',
    description: 'Implement secure SDLC with security activities throughout development.',
    category: 'Architecture',
    implementationGuidance: 'Define secure SDLC. Integrate security activities. Train developers. Review processes.',
    evidenceRequirements: ['SDLC documentation', 'Security integration', 'Training records', 'Process reviews'],
    testProcedures: ['Review SDLC', 'Verify integration', 'Check training', 'Assess processes'],
    status: 'Not Started'
  },
  {
    controlId: 'ASVS-1.2',
    name: 'Authentication Architecture',
    description: 'Design secure authentication architecture.',
    category: 'Architecture',
    implementationGuidance: 'Design authentication system. Use secure protocols. Implement session management. Document architecture.',
    evidenceRequirements: ['Authentication design', 'Protocol documentation', 'Session management', 'Architecture documentation'],
    testProcedures: ['Review design', 'Verify protocols', 'Test sessions', 'Check documentation'],
    status: 'Not Started'
  },
  // ===== V2: Authentication =====
  {
    controlId: 'ASVS-2.1',
    name: 'Password Security',
    description: 'Implement secure password handling.',
    category: 'Authentication',
    implementationGuidance: 'Enforce password complexity. Store securely. Implement password reset. Prevent common passwords.',
    evidenceRequirements: ['Password policy', 'Storage implementation', 'Reset process', 'Common password blocking'],
    testProcedures: ['Test policy', 'Verify storage', 'Test reset', 'Check blocking'],
    status: 'Not Started'
  },
  {
    controlId: 'ASVS-2.2',
    name: 'General Authenticator Security',
    description: 'Implement secure authenticator handling.',
    category: 'Authentication',
    implementationGuidance: 'Protect authenticators. Implement rate limiting. Enable account lockout. Log authentication events.',
    evidenceRequirements: ['Authenticator protection', 'Rate limiting', 'Lockout configuration', 'Authentication logging'],
    testProcedures: ['Test protection', 'Verify rate limiting', 'Check lockout', 'Review logging'],
    status: 'Not Started'
  },
  // ===== V3: Session Management =====
  {
    controlId: 'ASVS-3.1',
    name: 'Session Management Security',
    description: 'Implement secure session management.',
    category: 'Session Management',
    implementationGuidance: 'Generate secure session IDs. Implement timeouts. Protect session data. Enable logout.',
    evidenceRequirements: ['Session ID generation', 'Timeout configuration', 'Data protection', 'Logout implementation'],
    testProcedures: ['Test IDs', 'Verify timeouts', 'Check protection', 'Test logout'],
    status: 'Not Started'
  },
  // ===== V4: Access Control =====
  {
    controlId: 'ASVS-4.1',
    name: 'General Access Control',
    description: 'Implement comprehensive access control.',
    category: 'Access Control',
    implementationGuidance: 'Implement authorization checks. Apply least privilege. Deny by default. Log access attempts.',
    evidenceRequirements: ['Authorization implementation', 'Least privilege', 'Default deny', 'Access logging'],
    testProcedures: ['Test authorization', 'Verify least privilege', 'Check default deny', 'Review logging'],
    status: 'Not Started'
  },
  // ===== V5: Validation =====
  {
    controlId: 'ASVS-5.1',
    name: 'Input Validation',
    description: 'Implement comprehensive input validation.',
    category: 'Validation',
    implementationGuidance: 'Validate all input. Use allowlists. Sanitize data. Encode output.',
    evidenceRequirements: ['Validation implementation', 'Allowlist usage', 'Sanitization', 'Output encoding'],
    testProcedures: ['Test validation', 'Verify allowlists', 'Check sanitization', 'Test encoding'],
    status: 'Not Started'
  },
  // ===== V6: Cryptography =====
  {
    controlId: 'ASVS-6.1',
    name: 'Data Classification and Cryptography',
    description: 'Classify data and apply appropriate cryptographic controls.',
    category: 'Cryptography',
    implementationGuidance: 'Classify data. Select appropriate algorithms. Manage keys securely. Implement encryption.',
    evidenceRequirements: ['Data classification', 'Algorithm selection', 'Key management', 'Encryption implementation'],
    testProcedures: ['Review classification', 'Verify algorithms', 'Check key management', 'Test encryption'],
    status: 'Not Started'
  },
  // ===== V7: Error Handling and Logging =====
  {
    controlId: 'ASVS-7.1',
    name: 'Log Content',
    description: 'Log security events with appropriate content.',
    category: 'Error Handling and Logging',
    implementationGuidance: 'Define log events. Include required fields. Protect sensitive data. Ensure log integrity.',
    evidenceRequirements: ['Log event definition', 'Required fields', 'Sensitive data protection', 'Log integrity'],
    testProcedures: ['Review events', 'Verify fields', 'Check protection', 'Test integrity'],
    status: 'Not Started'
  },
  // ===== V8: Data Protection =====
  {
    controlId: 'ASVS-8.1',
    name: 'General Data Protection',
    description: 'Implement comprehensive data protection.',
    category: 'Data Protection',
    implementationGuidance: 'Protect data in transit. Protect data at rest. Implement data minimization. Secure data deletion.',
    evidenceRequirements: ['Transit protection', 'Rest protection', 'Data minimization', 'Secure deletion'],
    testProcedures: ['Test transit protection', 'Verify rest protection', 'Check minimization', 'Test deletion'],
    status: 'Not Started'
  }
];
