import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Additional NIST Security Standards
 * NIST SP 800-207 Zero Trust, NIST SP 800-218 SSDF, NIST SP 800-172, FIPS 140-3
 */

export const NIST_800_207_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Zero Trust Tenets =====
  {
    controlId: 'ZTA-1.1',
    name: 'Never Trust, Always Verify',
    description: 'All resource access requires authentication and authorization regardless of network location.',
    category: 'Zero Trust Tenets',
    implementationGuidance: 'Implement continuous verification. Authenticate all access requests. Authorize based on context. Remove implicit trust.',
    evidenceRequirements: ['Verification mechanisms', 'Authentication records', 'Authorization logs', 'Trust removal documentation'],
    testProcedures: ['Test verification', 'Verify authentication', 'Review authorization', 'Check trust model'],
    status: 'Not Started'
  },
  {
    controlId: 'ZTA-1.2',
    name: 'Least Privilege Access',
    description: 'Grant minimum necessary access rights for users to perform their functions.',
    category: 'Zero Trust Tenets',
    implementationGuidance: 'Define minimum access requirements. Implement granular access controls. Review access regularly. Remove excess privileges.',
    evidenceRequirements: ['Access requirements', 'Granular controls', 'Review records', 'Privilege removal'],
    testProcedures: ['Review requirements', 'Test controls', 'Verify reviews', 'Check privileges'],
    status: 'Not Started'
  },
  {
    controlId: 'ZTA-1.3',
    name: 'Assume Breach',
    description: 'Design security with assumption that attackers are present in the environment.',
    category: 'Zero Trust Tenets',
    implementationGuidance: 'Implement micro-segmentation. Monitor for lateral movement. Encrypt all traffic. Enable rapid containment.',
    evidenceRequirements: ['Segmentation implementation', 'Monitoring capabilities', 'Encryption configuration', 'Containment procedures'],
    testProcedures: ['Test segmentation', 'Verify monitoring', 'Check encryption', 'Assess containment'],
    status: 'Not Started'
  },
  // ===== ZTA Components =====
  {
    controlId: 'ZTA-2.1',
    name: 'Policy Engine',
    description: 'Implement policy engine that makes access decisions based on policy and input from multiple sources.',
    category: 'ZTA Components',
    implementationGuidance: 'Deploy policy decision point. Configure policy rules. Integrate data sources. Enable real-time decisions.',
    evidenceRequirements: ['Policy engine deployment', 'Rule configuration', 'Integration documentation', 'Decision logs'],
    testProcedures: ['Test policy engine', 'Verify rules', 'Check integrations', 'Review decisions'],
    status: 'Not Started'
  },
  {
    controlId: 'ZTA-2.2',
    name: 'Policy Administrator',
    description: 'Implement component that establishes and removes communication path between subject and resource.',
    category: 'ZTA Components',
    implementationGuidance: 'Deploy policy administrator. Configure session management. Enable dynamic access. Log all sessions.',
    evidenceRequirements: ['Administrator deployment', 'Session configuration', 'Dynamic access records', 'Session logs'],
    testProcedures: ['Test administrator', 'Verify sessions', 'Check dynamic access', 'Review logs'],
    status: 'Not Started'
  },
  {
    controlId: 'ZTA-2.3',
    name: 'Policy Enforcement Point',
    description: 'Implement enforcement point that enables, monitors, and terminates connections between subjects and resources.',
    category: 'ZTA Components',
    implementationGuidance: 'Deploy enforcement points. Configure access policies. Monitor connections. Enable termination capability.',
    evidenceRequirements: ['Enforcement deployment', 'Policy configuration', 'Connection monitoring', 'Termination capability'],
    testProcedures: ['Test enforcement', 'Verify policies', 'Check monitoring', 'Test termination'],
    status: 'Not Started'
  },
  // ===== ZTA Deployment =====
  {
    controlId: 'ZTA-3.1',
    name: 'Identity Management',
    description: 'Implement comprehensive identity management as foundation for zero trust.',
    category: 'ZTA Deployment',
    implementationGuidance: 'Deploy identity provider. Implement strong authentication. Enable identity governance. Integrate with ZTA.',
    evidenceRequirements: ['Identity provider', 'Authentication configuration', 'Governance implementation', 'ZTA integration'],
    testProcedures: ['Test identity management', 'Verify authentication', 'Check governance', 'Review integration'],
    status: 'Not Started'
  },
  {
    controlId: 'ZTA-3.2',
    name: 'Device Security',
    description: 'Ensure device security and health as factor in access decisions.',
    category: 'ZTA Deployment',
    implementationGuidance: 'Implement device inventory. Monitor device health. Include in access decisions. Enable remediation.',
    evidenceRequirements: ['Device inventory', 'Health monitoring', 'Access decision integration', 'Remediation capability'],
    testProcedures: ['Test inventory', 'Verify health checks', 'Check access decisions', 'Test remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'ZTA-3.3',
    name: 'Network Micro-Segmentation',
    description: 'Implement micro-segmentation to limit lateral movement.',
    category: 'ZTA Deployment',
    implementationGuidance: 'Design micro-segments. Implement network controls. Monitor segment traffic. Enforce segment policies.',
    evidenceRequirements: ['Segment design', 'Network controls', 'Traffic monitoring', 'Policy enforcement'],
    testProcedures: ['Review design', 'Test controls', 'Verify monitoring', 'Check enforcement'],
    status: 'Not Started'
  }
];

export const NIST_800_218_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Prepare the Organization (PO) =====
  {
    controlId: 'SSDF-PO.1',
    name: 'Define Security Requirements',
    description: 'Define security requirements for software development including policies, procedures, and standards.',
    category: 'Prepare Organization',
    implementationGuidance: 'Document security requirements. Establish policies. Create standards. Communicate requirements.',
    evidenceRequirements: ['Security requirements', 'Policies', 'Standards', 'Communication records'],
    testProcedures: ['Review requirements', 'Verify policies', 'Check standards', 'Assess communication'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-PO.2',
    name: 'Implement Roles and Responsibilities',
    description: 'Define and assign roles and responsibilities for secure software development.',
    category: 'Prepare Organization',
    implementationGuidance: 'Define security roles. Assign responsibilities. Train personnel. Document assignments.',
    evidenceRequirements: ['Role definitions', 'Responsibility assignments', 'Training records', 'Documentation'],
    testProcedures: ['Review roles', 'Verify assignments', 'Check training', 'Assess documentation'],
    status: 'Not Started'
  },
  // ===== Protect the Software (PS) =====
  {
    controlId: 'SSDF-PS.1',
    name: 'Protect Development Environment',
    description: 'Protect development environments from unauthorized access and tampering.',
    category: 'Protect Software',
    implementationGuidance: 'Secure development systems. Control access. Monitor for unauthorized changes. Implement integrity checks.',
    evidenceRequirements: ['Security measures', 'Access controls', 'Change monitoring', 'Integrity verification'],
    testProcedures: ['Test security', 'Verify access controls', 'Check monitoring', 'Assess integrity'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-PS.2',
    name: 'Protect Code Integrity',
    description: 'Protect software code from unauthorized changes and ensure integrity throughout development.',
    category: 'Protect Software',
    implementationGuidance: 'Implement version control. Require code reviews. Enable code signing. Verify code integrity.',
    evidenceRequirements: ['Version control', 'Code review records', 'Code signing', 'Integrity verification'],
    testProcedures: ['Test version control', 'Verify reviews', 'Check signing', 'Assess verification'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-PS.3',
    name: 'Archive and Protect Software Releases',
    description: 'Archive software releases and protect from unauthorized modification.',
    category: 'Protect Software',
    implementationGuidance: 'Implement release archiving. Protect archive integrity. Control archive access. Enable retrieval.',
    evidenceRequirements: ['Archive implementation', 'Integrity protection', 'Access controls', 'Retrieval capability'],
    testProcedures: ['Test archiving', 'Verify integrity', 'Check access', 'Test retrieval'],
    status: 'Not Started'
  },
  // ===== Produce Well-Secured Software (PW) =====
  {
    controlId: 'SSDF-PW.1',
    name: 'Design Software to Meet Security Requirements',
    description: 'Design software to meet security requirements including threat modeling.',
    category: 'Produce Secure Software',
    implementationGuidance: 'Conduct threat modeling. Design security controls. Review architecture. Document security design.',
    evidenceRequirements: ['Threat models', 'Security controls', 'Architecture review', 'Design documentation'],
    testProcedures: ['Review threat models', 'Verify controls', 'Check architecture', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-PW.2',
    name: 'Review Software Design',
    description: 'Review software design to verify security requirements are addressed.',
    category: 'Produce Secure Software',
    implementationGuidance: 'Conduct design reviews. Include security assessment. Document findings. Track remediation.',
    evidenceRequirements: ['Design reviews', 'Security assessments', 'Findings documentation', 'Remediation tracking'],
    testProcedures: ['Test review process', 'Verify assessments', 'Check findings', 'Track remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-PW.3',
    name: 'Secure Coding Practices',
    description: 'Follow secure coding practices to prevent vulnerabilities.',
    category: 'Produce Secure Software',
    implementationGuidance: 'Establish coding standards. Train developers. Enforce standards. Review compliance.',
    evidenceRequirements: ['Coding standards', 'Training records', 'Enforcement documentation', 'Compliance reviews'],
    testProcedures: ['Review standards', 'Verify training', 'Check enforcement', 'Assess compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-PW.4',
    name: 'Software Composition Analysis',
    description: 'Identify and analyze third-party components and dependencies.',
    category: 'Produce Secure Software',
    implementationGuidance: 'Maintain component inventory. Analyze for vulnerabilities. Track dependencies. Update as needed.',
    evidenceRequirements: ['Component inventory', 'Vulnerability analysis', 'Dependency tracking', 'Update records'],
    testProcedures: ['Review inventory', 'Test analysis', 'Check tracking', 'Verify updates'],
    status: 'Not Started'
  },
  // ===== Respond to Vulnerabilities (RV) =====
  {
    controlId: 'SSDF-RV.1',
    name: 'Identify and Confirm Vulnerabilities',
    description: 'Identify and confirm vulnerabilities in software releases.',
    category: 'Respond to Vulnerabilities',
    implementationGuidance: 'Implement vulnerability identification. Confirm vulnerabilities. Assess impact. Document findings.',
    evidenceRequirements: ['Identification processes', 'Confirmation records', 'Impact assessments', 'Finding documentation'],
    testProcedures: ['Test identification', 'Verify confirmation', 'Check assessments', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-RV.2',
    name: 'Remediate Vulnerabilities',
    description: 'Remediate vulnerabilities and update affected software.',
    category: 'Respond to Vulnerabilities',
    implementationGuidance: 'Prioritize vulnerabilities. Develop fixes. Test remediation. Deploy updates.',
    evidenceRequirements: ['Prioritization records', 'Fix development', 'Testing records', 'Deployment records'],
    testProcedures: ['Review prioritization', 'Test fixes', 'Verify testing', 'Check deployment'],
    status: 'Not Started'
  },
  {
    controlId: 'SSDF-RV.3',
    name: 'Analyze Vulnerabilities for Root Cause',
    description: 'Analyze vulnerabilities to identify root causes and improve processes.',
    category: 'Respond to Vulnerabilities',
    implementationGuidance: 'Conduct root cause analysis. Identify process improvements. Implement changes. Track effectiveness.',
    evidenceRequirements: ['Root cause analysis', 'Improvement identification', 'Change implementation', 'Effectiveness tracking'],
    testProcedures: ['Review analysis', 'Verify improvements', 'Check implementation', 'Assess effectiveness'],
    status: 'Not Started'
  }
];

export const NIST_800_172_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'NIST172-3.1.1',
    name: 'Enhanced Security Requirements - Access Control',
    description: 'Implement enhanced access control for CUI requiring additional protection.',
    category: 'Enhanced Security',
    implementationGuidance: 'Implement dual authorization. Apply time-based access. Enable enhanced monitoring. Require MFA.',
    evidenceRequirements: ['Dual authorization', 'Time-based controls', 'Enhanced monitoring', 'MFA implementation'],
    testProcedures: ['Test dual authorization', 'Verify time controls', 'Check monitoring', 'Test MFA'],
    status: 'Not Started'
  },
  {
    controlId: 'NIST172-3.1.2',
    name: 'Adversary-Resistant Protective Security',
    description: 'Design and implement security capable of defending against advanced persistent threats.',
    category: 'Enhanced Security',
    implementationGuidance: 'Implement defense-in-depth. Deploy advanced threat protection. Enable threat hunting. Conduct red team exercises.',
    evidenceRequirements: ['Defense-in-depth architecture', 'Threat protection', 'Hunting capability', 'Red team reports'],
    testProcedures: ['Review architecture', 'Test protection', 'Verify hunting', 'Assess exercises'],
    status: 'Not Started'
  },
  {
    controlId: 'NIST172-3.2.1',
    name: 'Boundary Protection Enhancement',
    description: 'Implement enhanced boundary protection including isolation and monitoring.',
    category: 'Boundary Protection',
    implementationGuidance: 'Implement network isolation. Deploy advanced firewalls. Enable deep packet inspection. Monitor all traffic.',
    evidenceRequirements: ['Network isolation', 'Firewall configuration', 'Inspection capability', 'Traffic monitoring'],
    testProcedures: ['Test isolation', 'Verify firewalls', 'Check inspection', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'NIST172-3.3.1',
    name: 'Threat-Informed Security Operations',
    description: 'Conduct security operations informed by threat intelligence.',
    category: 'Security Operations',
    implementationGuidance: 'Integrate threat intelligence. Inform security operations. Update based on threats. Share threat information.',
    evidenceRequirements: ['Threat integration', 'Operations documentation', 'Threat updates', 'Sharing records'],
    testProcedures: ['Test integration', 'Verify operations', 'Check updates', 'Review sharing'],
    status: 'Not Started'
  },
  {
    controlId: 'NIST172-3.4.1',
    name: 'Cyber Resiliency',
    description: 'Implement cyber resiliency techniques to withstand, recover from, and adapt to adverse conditions.',
    category: 'Resilience',
    implementationGuidance: 'Design for resilience. Implement redundancy. Enable rapid recovery. Test resilience regularly.',
    evidenceRequirements: ['Resilience design', 'Redundancy implementation', 'Recovery capability', 'Test records'],
    testProcedures: ['Review design', 'Test redundancy', 'Verify recovery', 'Assess testing'],
    status: 'Not Started'
  }
];

export const FIPS_140_3_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'FIPS140-1.1',
    name: 'Cryptographic Module Specification',
    description: 'Specify cryptographic module including cryptographic boundary, interfaces, and approved security functions.',
    category: 'Module Specification',
    implementationGuidance: 'Define cryptographic boundary. Document interfaces. Specify approved functions. Maintain documentation.',
    evidenceRequirements: ['Boundary definition', 'Interface documentation', 'Function specification', 'Module documentation'],
    testProcedures: ['Review boundary', 'Verify interfaces', 'Check functions', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-1.2',
    name: 'Cryptographic Module Interfaces',
    description: 'Define all interfaces to the cryptographic module including data input/output, control input, and status output.',
    category: 'Module Specification',
    implementationGuidance: 'Document all interfaces. Define interface types. Specify data flows. Control interface access.',
    evidenceRequirements: ['Interface documentation', 'Type definitions', 'Data flow documentation', 'Access controls'],
    testProcedures: ['Review interfaces', 'Verify types', 'Check data flows', 'Test access'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-2.1',
    name: 'Roles, Services, and Authentication',
    description: 'Define roles and services for cryptographic module operators and implement appropriate authentication.',
    category: 'Roles and Authentication',
    implementationGuidance: 'Define operator roles. Specify services per role. Implement authentication. Document role assignments.',
    evidenceRequirements: ['Role definitions', 'Service specifications', 'Authentication implementation', 'Assignment documentation'],
    testProcedures: ['Review roles', 'Verify services', 'Test authentication', 'Check assignments'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-3.1',
    name: 'Software and Firmware Security',
    description: 'Protect software and firmware components of cryptographic module from unauthorized modification.',
    category: 'Software Security',
    implementationGuidance: 'Implement integrity verification. Protect from modification. Enable secure boot. Document protections.',
    evidenceRequirements: ['Integrity verification', 'Modification protection', 'Secure boot', 'Protection documentation'],
    testProcedures: ['Test integrity', 'Verify protection', 'Check secure boot', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-4.1',
    name: 'Physical Security',
    description: 'Implement physical security mechanisms appropriate to module security level.',
    category: 'Physical Security',
    implementationGuidance: 'Define physical boundary. Implement tamper evidence/response. Protect against probing. Document physical security.',
    evidenceRequirements: ['Physical boundary', 'Tamper protection', 'Probing protection', 'Security documentation'],
    testProcedures: ['Review boundary', 'Test tamper protection', 'Verify probing protection', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-5.1',
    name: 'Non-Invasive Security',
    description: 'Implement protections against non-invasive attacks such as side-channel attacks.',
    category: 'Non-Invasive Security',
    implementationGuidance: 'Identify side-channel risks. Implement countermeasures. Test for vulnerabilities. Document protections.',
    evidenceRequirements: ['Risk identification', 'Countermeasure implementation', 'Vulnerability testing', 'Protection documentation'],
    testProcedures: ['Review risks', 'Test countermeasures', 'Verify testing', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-6.1',
    name: 'Cryptographic Key Management',
    description: 'Implement secure cryptographic key management including generation, establishment, entry, output, storage, and destruction.',
    category: 'Key Management',
    implementationGuidance: 'Implement key lifecycle management. Secure key generation. Protect key storage. Enable secure destruction.',
    evidenceRequirements: ['Lifecycle management', 'Key generation', 'Storage protection', 'Destruction records'],
    testProcedures: ['Test lifecycle', 'Verify generation', 'Check storage', 'Review destruction'],
    status: 'Not Started'
  },
  {
    controlId: 'FIPS140-7.1',
    name: 'Self-Tests',
    description: 'Implement cryptographic algorithm self-tests to verify correct operation.',
    category: 'Self-Tests',
    implementationGuidance: 'Implement power-up self-tests. Enable conditional self-tests. Handle self-test failures. Document test results.',
    evidenceRequirements: ['Power-up tests', 'Conditional tests', 'Failure handling', 'Test documentation'],
    testProcedures: ['Test power-up tests', 'Verify conditional tests', 'Check failure handling', 'Review documentation'],
    status: 'Not Started'
  }
];
