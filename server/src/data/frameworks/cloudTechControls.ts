import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Cloud & Technology Security Frameworks
 * CSA STAR, CIS RAM, MITRE ATT&CK, MITRE D3FEND, SANS Top 20, BSIMM, IEEE P2675, Common Criteria
 */

export const CSA_STAR_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CCM-AIS-01',
    name: 'Application Security',
    description: 'Implement application security throughout the development lifecycle.',
    category: 'Application & Interface Security',
    implementationGuidance: 'Define secure development standards. Conduct security testing. Remediate vulnerabilities. Deploy securely.',
    evidenceRequirements: ['Development standards', 'Security testing', 'Vulnerability remediation', 'Deployment procedures'],
    testProcedures: ['Review standards', 'Verify testing', 'Check remediation', 'Assess deployment'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-BCR-01',
    name: 'Business Continuity Planning',
    description: 'Develop and maintain business continuity plans.',
    category: 'Business Continuity Management',
    implementationGuidance: 'Conduct BIA. Develop BCP. Test plans. Update regularly.',
    evidenceRequirements: ['BIA documentation', 'BCP documents', 'Test records', 'Update records'],
    testProcedures: ['Review BIA', 'Verify BCP', 'Check tests', 'Assess updates'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-CCC-01',
    name: 'Change Control',
    description: 'Implement change management processes.',
    category: 'Change Control & Configuration',
    implementationGuidance: 'Define change process. Assess changes. Approve and implement. Document changes.',
    evidenceRequirements: ['Change process', 'Change assessments', 'Approval records', 'Change documentation'],
    testProcedures: ['Review process', 'Verify assessments', 'Check approvals', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-DSI-01',
    name: 'Data Security Classification',
    description: 'Classify and label data according to sensitivity.',
    category: 'Data Security & Information Lifecycle',
    implementationGuidance: 'Define classification scheme. Label data. Implement controls. Monitor handling.',
    evidenceRequirements: ['Classification scheme', 'Data labeling', 'Control implementation', 'Handling monitoring'],
    testProcedures: ['Review scheme', 'Verify labeling', 'Test controls', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-GRM-01',
    name: 'Security Governance',
    description: 'Establish security governance framework.',
    category: 'Governance & Risk Management',
    implementationGuidance: 'Define governance structure. Assign responsibilities. Implement policies. Monitor compliance.',
    evidenceRequirements: ['Governance structure', 'Responsibility assignments', 'Policy documentation', 'Compliance monitoring'],
    testProcedures: ['Review governance', 'Verify responsibilities', 'Check policies', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-IAM-01',
    name: 'Identity & Access Management',
    description: 'Implement identity and access management controls.',
    category: 'Identity & Access Management',
    implementationGuidance: 'Manage identities. Control access. Implement MFA. Review access regularly.',
    evidenceRequirements: ['Identity management', 'Access controls', 'MFA implementation', 'Access reviews'],
    testProcedures: ['Review identities', 'Test controls', 'Verify MFA', 'Check reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-IVS-01',
    name: 'Infrastructure Security',
    description: 'Secure cloud infrastructure components.',
    category: 'Infrastructure & Virtualization Security',
    implementationGuidance: 'Harden infrastructure. Segment networks. Monitor systems. Respond to incidents.',
    evidenceRequirements: ['Hardening standards', 'Network segmentation', 'Monitoring logs', 'Incident records'],
    testProcedures: ['Review hardening', 'Verify segmentation', 'Check monitoring', 'Assess incidents'],
    status: 'Not Started'
  },
  {
    controlId: 'CCM-SEF-01',
    name: 'Security Incident Management',
    description: 'Manage security incidents effectively.',
    category: 'Security Incident Management',
    implementationGuidance: 'Detect incidents. Respond promptly. Investigate thoroughly. Learn and improve.',
    evidenceRequirements: ['Detection capability', 'Response procedures', 'Investigation records', 'Improvement actions'],
    testProcedures: ['Test detection', 'Verify response', 'Review investigations', 'Assess improvements'],
    status: 'Not Started'
  }
];

export const CIS_RAM_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CIS-RAM-1.1',
    name: 'Risk Assessment Scope',
    description: 'Define risk assessment scope and objectives.',
    category: 'Assessment Planning',
    implementationGuidance: 'Define assessment boundaries. Identify stakeholders. Set objectives. Document scope.',
    evidenceRequirements: ['Scope definition', 'Stakeholder identification', 'Objectives', 'Scope documentation'],
    testProcedures: ['Review scope', 'Verify stakeholders', 'Check objectives', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-RAM-1.2',
    name: 'Asset Identification',
    description: 'Identify and value information assets.',
    category: 'Asset Management',
    implementationGuidance: 'Inventory assets. Assign ownership. Determine value. Document assets.',
    evidenceRequirements: ['Asset inventory', 'Ownership records', 'Valuation records', 'Asset documentation'],
    testProcedures: ['Review inventory', 'Verify ownership', 'Check valuation', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-RAM-2.1',
    name: 'Threat Identification',
    description: 'Identify threats to information assets.',
    category: 'Threat Assessment',
    implementationGuidance: 'Identify threat sources. Analyze threat events. Assess likelihood. Document threats.',
    evidenceRequirements: ['Threat sources', 'Threat events', 'Likelihood assessment', 'Threat documentation'],
    testProcedures: ['Review sources', 'Verify events', 'Check likelihood', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-RAM-2.2',
    name: 'Vulnerability Assessment',
    description: 'Assess vulnerabilities in systems and processes.',
    category: 'Vulnerability Assessment',
    implementationGuidance: 'Scan for vulnerabilities. Assess weaknesses. Prioritize findings. Document vulnerabilities.',
    evidenceRequirements: ['Scan results', 'Weakness assessment', 'Prioritization', 'Vulnerability documentation'],
    testProcedures: ['Review scans', 'Verify assessment', 'Check prioritization', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-RAM-3.1',
    name: 'Risk Analysis',
    description: 'Analyze risk by combining threat and vulnerability information.',
    category: 'Risk Analysis',
    implementationGuidance: 'Calculate risk scores. Consider impact. Assess likelihood. Document risk analysis.',
    evidenceRequirements: ['Risk scores', 'Impact assessment', 'Likelihood assessment', 'Analysis documentation'],
    testProcedures: ['Review scores', 'Verify impact', 'Check likelihood', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CIS-RAM-3.2',
    name: 'Risk Treatment',
    description: 'Select and implement risk treatment options.',
    category: 'Risk Treatment',
    implementationGuidance: 'Evaluate treatment options. Select treatments. Implement controls. Monitor effectiveness.',
    evidenceRequirements: ['Treatment options', 'Selection rationale', 'Control implementation', 'Monitoring records'],
    testProcedures: ['Review options', 'Verify selection', 'Check implementation', 'Assess monitoring'],
    status: 'Not Started'
  }
];

export const MITRE_ATTACK_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ATT&CK-TA0001',
    name: 'Initial Access Defense',
    description: 'Implement defenses against initial access techniques.',
    category: 'Initial Access',
    implementationGuidance: 'Secure public-facing applications. Filter phishing. Control external services. Monitor access.',
    evidenceRequirements: ['Application security', 'Phishing controls', 'Service controls', 'Access monitoring'],
    testProcedures: ['Test applications', 'Verify filtering', 'Check services', 'Review monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ATT&CK-TA0002',
    name: 'Execution Prevention',
    description: 'Prevent malicious code execution.',
    category: 'Execution',
    implementationGuidance: 'Implement application control. Block scripts. Monitor execution. Respond to threats.',
    evidenceRequirements: ['Application control', 'Script blocking', 'Execution monitoring', 'Threat response'],
    testProcedures: ['Test control', 'Verify blocking', 'Check monitoring', 'Assess response'],
    status: 'Not Started'
  },
  {
    controlId: 'ATT&CK-TA0003',
    name: 'Persistence Detection',
    description: 'Detect and prevent persistence mechanisms.',
    category: 'Persistence',
    implementationGuidance: 'Monitor startup items. Audit scheduled tasks. Track registry changes. Alert on modifications.',
    evidenceRequirements: ['Startup monitoring', 'Task auditing', 'Registry tracking', 'Modification alerts'],
    testProcedures: ['Review startup', 'Verify auditing', 'Check tracking', 'Test alerts'],
    status: 'Not Started'
  },
  {
    controlId: 'ATT&CK-TA0004',
    name: 'Privilege Escalation Prevention',
    description: 'Prevent privilege escalation attacks.',
    category: 'Privilege Escalation',
    implementationGuidance: 'Implement least privilege. Patch vulnerabilities. Monitor privilege changes. Control admin access.',
    evidenceRequirements: ['Privilege implementation', 'Patch management', 'Change monitoring', 'Admin controls'],
    testProcedures: ['Test privileges', 'Verify patching', 'Check monitoring', 'Assess controls'],
    status: 'Not Started'
  },
  {
    controlId: 'ATT&CK-TA0005',
    name: 'Defense Evasion Detection',
    description: 'Detect defense evasion techniques.',
    category: 'Defense Evasion',
    implementationGuidance: 'Monitor for tampering. Detect obfuscation. Alert on bypasses. Validate integrity.',
    evidenceRequirements: ['Tamper monitoring', 'Obfuscation detection', 'Bypass alerting', 'Integrity validation'],
    testProcedures: ['Test monitoring', 'Verify detection', 'Check alerting', 'Assess validation'],
    status: 'Not Started'
  },
  {
    controlId: 'ATT&CK-TA0006',
    name: 'Credential Access Protection',
    description: 'Protect against credential theft.',
    category: 'Credential Access',
    implementationGuidance: 'Protect credentials. Implement MFA. Monitor authentication. Detect dumping.',
    evidenceRequirements: ['Credential protection', 'MFA implementation', 'Auth monitoring', 'Dumping detection'],
    testProcedures: ['Test protection', 'Verify MFA', 'Check monitoring', 'Assess detection'],
    status: 'Not Started'
  },
  {
    controlId: 'ATT&CK-TA0010',
    name: 'Exfiltration Prevention',
    description: 'Prevent data exfiltration.',
    category: 'Exfiltration',
    implementationGuidance: 'Monitor data transfers. Control egress. Detect anomalies. Block unauthorized transfers.',
    evidenceRequirements: ['Transfer monitoring', 'Egress controls', 'Anomaly detection', 'Transfer blocking'],
    testProcedures: ['Test monitoring', 'Verify controls', 'Check detection', 'Assess blocking'],
    status: 'Not Started'
  }
];

export const MITRE_D3FEND_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'D3FEND-HRD',
    name: 'Harden',
    description: 'Implement hardening techniques to reduce attack surface.',
    category: 'Hardening',
    implementationGuidance: 'Apply hardening standards. Remove unnecessary services. Configure securely. Validate hardening.',
    evidenceRequirements: ['Hardening standards', 'Service removal', 'Secure configuration', 'Validation records'],
    testProcedures: ['Review standards', 'Verify removal', 'Check configuration', 'Assess validation'],
    status: 'Not Started'
  },
  {
    controlId: 'D3FEND-DET',
    name: 'Detect',
    description: 'Implement detection capabilities for threats.',
    category: 'Detection',
    implementationGuidance: 'Deploy detection tools. Configure alerts. Monitor continuously. Tune detection.',
    evidenceRequirements: ['Detection tools', 'Alert configuration', 'Monitoring logs', 'Tuning records'],
    testProcedures: ['Test tools', 'Verify alerts', 'Check monitoring', 'Assess tuning'],
    status: 'Not Started'
  },
  {
    controlId: 'D3FEND-ISO',
    name: 'Isolate',
    description: 'Implement isolation techniques to contain threats.',
    category: 'Isolation',
    implementationGuidance: 'Segment networks. Sandbox applications. Isolate systems. Control communication.',
    evidenceRequirements: ['Network segmentation', 'Sandboxing', 'System isolation', 'Communication controls'],
    testProcedures: ['Test segmentation', 'Verify sandboxing', 'Check isolation', 'Assess controls'],
    status: 'Not Started'
  },
  {
    controlId: 'D3FEND-DEC',
    name: 'Deceive',
    description: 'Deploy deception techniques to detect and mislead attackers.',
    category: 'Deception',
    implementationGuidance: 'Deploy honeypots. Create decoys. Monitor deception triggers. Analyze attacker behavior.',
    evidenceRequirements: ['Honeypot deployment', 'Decoy creation', 'Trigger monitoring', 'Behavior analysis'],
    testProcedures: ['Test honeypots', 'Verify decoys', 'Check triggers', 'Assess analysis'],
    status: 'Not Started'
  },
  {
    controlId: 'D3FEND-EVI',
    name: 'Evict',
    description: 'Remove threats from the environment.',
    category: 'Eviction',
    implementationGuidance: 'Identify threats. Remove malware. Clean systems. Verify removal.',
    evidenceRequirements: ['Threat identification', 'Malware removal', 'System cleaning', 'Removal verification'],
    testProcedures: ['Review identification', 'Verify removal', 'Check cleaning', 'Assess verification'],
    status: 'Not Started'
  }
];

export const SANS_TOP_20_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'SANS-1',
    name: 'Inventory and Control of Enterprise Assets',
    description: 'Maintain inventory of all enterprise assets.',
    category: 'Asset Management',
    implementationGuidance: 'Discover assets. Maintain inventory. Track changes. Remove unauthorized assets.',
    evidenceRequirements: ['Asset discovery', 'Inventory records', 'Change tracking', 'Unauthorized removal'],
    testProcedures: ['Test discovery', 'Verify inventory', 'Check tracking', 'Assess removal'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-2',
    name: 'Inventory and Control of Software Assets',
    description: 'Maintain inventory of all software assets.',
    category: 'Software Management',
    implementationGuidance: 'Discover software. Maintain software inventory. Control installations. Remove unauthorized software.',
    evidenceRequirements: ['Software discovery', 'Software inventory', 'Installation control', 'Software removal'],
    testProcedures: ['Test discovery', 'Verify inventory', 'Check control', 'Assess removal'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-3',
    name: 'Data Protection',
    description: 'Implement data protection controls.',
    category: 'Data Protection',
    implementationGuidance: 'Classify data. Implement encryption. Control access. Monitor data handling.',
    evidenceRequirements: ['Data classification', 'Encryption implementation', 'Access controls', 'Handling monitoring'],
    testProcedures: ['Review classification', 'Verify encryption', 'Test controls', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-4',
    name: 'Secure Configuration',
    description: 'Establish secure configuration for enterprise assets.',
    category: 'Configuration Management',
    implementationGuidance: 'Define baselines. Apply configurations. Monitor compliance. Remediate deviations.',
    evidenceRequirements: ['Configuration baselines', 'Applied configurations', 'Compliance monitoring', 'Deviation remediation'],
    testProcedures: ['Review baselines', 'Verify application', 'Check monitoring', 'Assess remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-5',
    name: 'Account Management',
    description: 'Manage user and service accounts.',
    category: 'Account Management',
    implementationGuidance: 'Manage accounts. Control privileges. Review access. Remove inactive accounts.',
    evidenceRequirements: ['Account management', 'Privilege controls', 'Access reviews', 'Inactive removal'],
    testProcedures: ['Review accounts', 'Verify privileges', 'Check reviews', 'Assess removal'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-6',
    name: 'Access Control Management',
    description: 'Implement access control for enterprise assets.',
    category: 'Access Control',
    implementationGuidance: 'Define access policies. Implement controls. Enforce least privilege. Monitor access.',
    evidenceRequirements: ['Access policies', 'Control implementation', 'Privilege enforcement', 'Access monitoring'],
    testProcedures: ['Review policies', 'Test controls', 'Verify privilege', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-7',
    name: 'Continuous Vulnerability Management',
    description: 'Continuously manage vulnerabilities.',
    category: 'Vulnerability Management',
    implementationGuidance: 'Scan for vulnerabilities. Assess severity. Prioritize remediation. Track resolution.',
    evidenceRequirements: ['Vulnerability scans', 'Severity assessment', 'Remediation prioritization', 'Resolution tracking'],
    testProcedures: ['Review scans', 'Verify assessment', 'Check prioritization', 'Assess tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'SANS-8',
    name: 'Audit Log Management',
    description: 'Collect and manage audit logs.',
    category: 'Logging',
    implementationGuidance: 'Enable logging. Collect logs centrally. Protect logs. Analyze logs.',
    evidenceRequirements: ['Logging configuration', 'Central collection', 'Log protection', 'Log analysis'],
    testProcedures: ['Test logging', 'Verify collection', 'Check protection', 'Assess analysis'],
    status: 'Not Started'
  }
];

export const BSIMM_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'BSIMM-SM1.1',
    name: 'Security Governance',
    description: 'Establish software security governance.',
    category: 'Governance',
    implementationGuidance: 'Create SSG. Define strategy. Allocate resources. Track progress.',
    evidenceRequirements: ['SSG documentation', 'Strategy document', 'Resource allocation', 'Progress tracking'],
    testProcedures: ['Review SSG', 'Verify strategy', 'Check resources', 'Assess tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'BSIMM-SSDL1.1',
    name: 'Secure Development Lifecycle',
    description: 'Integrate security into SDLC.',
    category: 'SSDL',
    implementationGuidance: 'Define SSDL. Integrate checkpoints. Train developers. Enforce requirements.',
    evidenceRequirements: ['SSDL documentation', 'Checkpoint integration', 'Training records', 'Enforcement records'],
    testProcedures: ['Review SSDL', 'Verify checkpoints', 'Check training', 'Assess enforcement'],
    status: 'Not Started'
  },
  {
    controlId: 'BSIMM-AA1.1',
    name: 'Architecture Analysis',
    description: 'Perform security architecture analysis.',
    category: 'Architecture',
    implementationGuidance: 'Review architectures. Identify risks. Recommend mitigations. Track remediation.',
    evidenceRequirements: ['Architecture reviews', 'Risk identification', 'Mitigation recommendations', 'Remediation tracking'],
    testProcedures: ['Review analysis', 'Verify risks', 'Check recommendations', 'Assess tracking'],
    status: 'Not Started'
  },
  {
    controlId: 'BSIMM-CR1.1',
    name: 'Code Review',
    description: 'Perform security code review.',
    category: 'Code Review',
    implementationGuidance: 'Review code for security. Use static analysis. Track findings. Verify fixes.',
    evidenceRequirements: ['Code reviews', 'Static analysis', 'Finding tracking', 'Fix verification'],
    testProcedures: ['Review code reviews', 'Verify analysis', 'Check tracking', 'Assess fixes'],
    status: 'Not Started'
  },
  {
    controlId: 'BSIMM-ST1.1',
    name: 'Security Testing',
    description: 'Perform security testing.',
    category: 'Testing',
    implementationGuidance: 'Conduct penetration testing. Perform DAST. Test APIs. Document results.',
    evidenceRequirements: ['Penetration test reports', 'DAST results', 'API testing', 'Result documentation'],
    testProcedures: ['Review pen tests', 'Verify DAST', 'Check API testing', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'BSIMM-SE1.1',
    name: 'Security Engineering',
    description: 'Build and promote security features.',
    category: 'Engineering',
    implementationGuidance: 'Build security libraries. Promote reuse. Document security features. Train on usage.',
    evidenceRequirements: ['Security libraries', 'Reuse documentation', 'Feature documentation', 'Usage training'],
    testProcedures: ['Review libraries', 'Verify reuse', 'Check documentation', 'Assess training'],
    status: 'Not Started'
  }
];

export const IEEE_P2675_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'IEEE-P2675-1.1',
    name: 'DevOps Security Requirements',
    description: 'Define security requirements for DevOps practices.',
    category: 'Requirements',
    implementationGuidance: 'Define security requirements. Integrate into pipelines. Automate enforcement. Monitor compliance.',
    evidenceRequirements: ['Security requirements', 'Pipeline integration', 'Automation configuration', 'Compliance monitoring'],
    testProcedures: ['Review requirements', 'Verify integration', 'Test automation', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'IEEE-P2675-1.2',
    name: 'CI/CD Security',
    description: 'Secure CI/CD pipelines.',
    category: 'Pipeline Security',
    implementationGuidance: 'Secure pipeline configuration. Protect secrets. Validate builds. Sign artifacts.',
    evidenceRequirements: ['Pipeline configuration', 'Secret management', 'Build validation', 'Artifact signing'],
    testProcedures: ['Review configuration', 'Verify secrets', 'Check validation', 'Assess signing'],
    status: 'Not Started'
  },
  {
    controlId: 'IEEE-P2675-2.1',
    name: 'Infrastructure as Code Security',
    description: 'Secure infrastructure as code practices.',
    category: 'IaC Security',
    implementationGuidance: 'Scan IaC templates. Enforce policies. Version control. Review changes.',
    evidenceRequirements: ['IaC scanning', 'Policy enforcement', 'Version control', 'Change reviews'],
    testProcedures: ['Test scanning', 'Verify enforcement', 'Check versioning', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'IEEE-P2675-2.2',
    name: 'Container Security',
    description: 'Implement container security controls.',
    category: 'Container Security',
    implementationGuidance: 'Scan images. Harden containers. Control orchestration. Monitor runtime.',
    evidenceRequirements: ['Image scanning', 'Container hardening', 'Orchestration controls', 'Runtime monitoring'],
    testProcedures: ['Test scanning', 'Verify hardening', 'Check controls', 'Assess monitoring'],
    status: 'Not Started'
  }
];

export const COMMON_CRITERIA_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CC-APE',
    name: 'Protection Profile Evaluation',
    description: 'Develop or conform to Protection Profile requirements.',
    category: 'Evaluation',
    implementationGuidance: 'Identify applicable PP. Document conformance. Address requirements. Prepare for evaluation.',
    evidenceRequirements: ['PP identification', 'Conformance documentation', 'Requirement address', 'Evaluation preparation'],
    testProcedures: ['Review PP', 'Verify conformance', 'Check requirements', 'Assess preparation'],
    status: 'Not Started'
  },
  {
    controlId: 'CC-ASE',
    name: 'Security Target Development',
    description: 'Develop Security Target for TOE evaluation.',
    category: 'Documentation',
    implementationGuidance: 'Define TOE description. Specify security environment. Define objectives. State requirements.',
    evidenceRequirements: ['TOE description', 'Security environment', 'Security objectives', 'Security requirements'],
    testProcedures: ['Review TOE', 'Verify environment', 'Check objectives', 'Assess requirements'],
    status: 'Not Started'
  },
  {
    controlId: 'CC-ADV',
    name: 'Development Documentation',
    description: 'Provide development documentation per assurance level.',
    category: 'Development',
    implementationGuidance: 'Document architecture. Describe design. Provide implementation. Demonstrate mapping.',
    evidenceRequirements: ['Architecture documentation', 'Design description', 'Implementation documentation', 'Requirement mapping'],
    testProcedures: ['Review architecture', 'Verify design', 'Check implementation', 'Assess mapping'],
    status: 'Not Started'
  },
  {
    controlId: 'CC-ALC',
    name: 'Life-cycle Support',
    description: 'Implement life-cycle support measures.',
    category: 'Lifecycle',
    implementationGuidance: 'Define CM procedures. Implement delivery. Manage development security. Maintain lifecycle.',
    evidenceRequirements: ['CM procedures', 'Delivery procedures', 'Development security', 'Lifecycle documentation'],
    testProcedures: ['Review CM', 'Verify delivery', 'Check security', 'Assess lifecycle'],
    status: 'Not Started'
  },
  {
    controlId: 'CC-ATE',
    name: 'Testing',
    description: 'Conduct testing per Common Criteria requirements.',
    category: 'Testing',
    implementationGuidance: 'Develop test plan. Execute tests. Document results. Support independent testing.',
    evidenceRequirements: ['Test plan', 'Test execution', 'Result documentation', 'Independent test support'],
    testProcedures: ['Review plan', 'Verify execution', 'Check results', 'Assess support'],
    status: 'Not Started'
  },
  {
    controlId: 'CC-AVA',
    name: 'Vulnerability Assessment',
    description: 'Conduct vulnerability assessment for TOE.',
    category: 'Vulnerability',
    implementationGuidance: 'Analyze vulnerabilities. Conduct penetration testing. Document findings. Mitigate vulnerabilities.',
    evidenceRequirements: ['Vulnerability analysis', 'Penetration testing', 'Finding documentation', 'Mitigation records'],
    testProcedures: ['Review analysis', 'Verify testing', 'Check findings', 'Assess mitigation'],
    status: 'Not Started'
  }
];
