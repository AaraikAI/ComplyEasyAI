import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Additional ISO Standards Controls
 * ISO 27002:2022, ISO 27005, ISO 31000, ISO 27035, ISO 27032, ISO 20000-1, ISO 42001
 */

export const ISO_27002_2022_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO27002-5.1',
    name: 'Policies for Information Security',
    description: 'Define and approve information security policies.',
    category: 'Organizational Controls',
    implementationGuidance: 'Define security policy. Obtain approval. Communicate policy. Review regularly.',
    evidenceRequirements: ['Security policy', 'Approval records', 'Communication records', 'Review records'],
    testProcedures: ['Review policy', 'Verify approval', 'Check communication', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-5.7',
    name: 'Threat Intelligence',
    description: 'Collect and analyze threat intelligence.',
    category: 'Organizational Controls',
    implementationGuidance: 'Collect threat intelligence. Analyze threats. Share information. Apply insights.',
    evidenceRequirements: ['Intelligence collection', 'Threat analysis', 'Information sharing', 'Insight application'],
    testProcedures: ['Review collection', 'Verify analysis', 'Check sharing', 'Assess application'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-5.23',
    name: 'Information Security for Cloud Services',
    description: 'Manage security for use of cloud services.',
    category: 'Organizational Controls',
    implementationGuidance: 'Define cloud policy. Assess providers. Manage security. Monitor compliance.',
    evidenceRequirements: ['Cloud policy', 'Provider assessment', 'Security management', 'Compliance monitoring'],
    testProcedures: ['Review policy', 'Verify assessment', 'Check management', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-6.1',
    name: 'Screening',
    description: 'Conduct background verification checks on candidates.',
    category: 'People Controls',
    implementationGuidance: 'Define screening requirements. Conduct checks. Document results. Maintain records.',
    evidenceRequirements: ['Screening requirements', 'Check records', 'Result documentation', 'Record maintenance'],
    testProcedures: ['Review requirements', 'Verify checks', 'Check documentation', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-7.1',
    name: 'Physical Security Perimeters',
    description: 'Define and use physical security perimeters.',
    category: 'Physical Controls',
    implementationGuidance: 'Define perimeters. Implement barriers. Control access. Monitor perimeters.',
    evidenceRequirements: ['Perimeter definition', 'Barrier implementation', 'Access controls', 'Perimeter monitoring'],
    testProcedures: ['Review perimeters', 'Test barriers', 'Check controls', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-8.1',
    name: 'User Endpoint Devices',
    description: 'Secure user endpoint devices.',
    category: 'Technological Controls',
    implementationGuidance: 'Define endpoint policy. Implement controls. Protect data. Monitor compliance.',
    evidenceRequirements: ['Endpoint policy', 'Control implementation', 'Data protection', 'Compliance monitoring'],
    testProcedures: ['Review policy', 'Test controls', 'Verify protection', 'Check monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-8.9',
    name: 'Configuration Management',
    description: 'Manage configurations of hardware, software, and networks.',
    category: 'Technological Controls',
    implementationGuidance: 'Define baselines. Document configurations. Control changes. Monitor compliance.',
    evidenceRequirements: ['Configuration baselines', 'Configuration documentation', 'Change control', 'Compliance monitoring'],
    testProcedures: ['Review baselines', 'Verify documentation', 'Check changes', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-8.16',
    name: 'Monitoring Activities',
    description: 'Monitor networks, systems, and applications for anomalous behavior.',
    category: 'Technological Controls',
    implementationGuidance: 'Implement monitoring. Define baselines. Detect anomalies. Respond to alerts.',
    evidenceRequirements: ['Monitoring implementation', 'Baseline definition', 'Anomaly detection', 'Alert response'],
    testProcedures: ['Test monitoring', 'Verify baselines', 'Check detection', 'Assess response'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27002-8.28',
    name: 'Secure Coding',
    description: 'Apply secure coding principles in software development.',
    category: 'Technological Controls',
    implementationGuidance: 'Define coding standards. Train developers. Review code. Test security.',
    evidenceRequirements: ['Coding standards', 'Training records', 'Code reviews', 'Security testing'],
    testProcedures: ['Review standards', 'Verify training', 'Check reviews', 'Assess testing'],
    status: 'Not Started'
  }
];

export const ISO_27005_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO27005-7.1',
    name: 'Context Establishment',
    description: 'Establish context for information security risk management.',
    category: 'Context',
    implementationGuidance: 'Define scope. Identify stakeholders. Establish criteria. Document context.',
    evidenceRequirements: ['Scope definition', 'Stakeholder identification', 'Risk criteria', 'Context documentation'],
    testProcedures: ['Review scope', 'Verify stakeholders', 'Check criteria', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27005-8.2',
    name: 'Risk Identification',
    description: 'Identify information security risks.',
    category: 'Risk Assessment',
    implementationGuidance: 'Identify assets. Identify threats. Identify vulnerabilities. Document risks.',
    evidenceRequirements: ['Asset inventory', 'Threat identification', 'Vulnerability identification', 'Risk documentation'],
    testProcedures: ['Review assets', 'Verify threats', 'Check vulnerabilities', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27005-8.3',
    name: 'Risk Analysis',
    description: 'Analyze information security risks.',
    category: 'Risk Assessment',
    implementationGuidance: 'Assess consequences. Assess likelihood. Determine risk level. Document analysis.',
    evidenceRequirements: ['Consequence assessment', 'Likelihood assessment', 'Risk level determination', 'Analysis documentation'],
    testProcedures: ['Review consequences', 'Verify likelihood', 'Check risk levels', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27005-8.4',
    name: 'Risk Evaluation',
    description: 'Evaluate information security risks.',
    category: 'Risk Assessment',
    implementationGuidance: 'Compare with criteria. Prioritize risks. Determine treatment. Document evaluation.',
    evidenceRequirements: ['Criteria comparison', 'Risk prioritization', 'Treatment determination', 'Evaluation documentation'],
    testProcedures: ['Review comparison', 'Verify prioritization', 'Check treatment', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27005-9.1',
    name: 'Risk Treatment',
    description: 'Select and implement risk treatment options.',
    category: 'Risk Treatment',
    implementationGuidance: 'Select treatment options. Plan treatment. Implement controls. Document treatment.',
    evidenceRequirements: ['Treatment selection', 'Treatment plan', 'Control implementation', 'Treatment documentation'],
    testProcedures: ['Review selection', 'Verify plan', 'Check implementation', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27005-10.1',
    name: 'Risk Communication',
    description: 'Communicate and consult on risk.',
    category: 'Communication',
    implementationGuidance: 'Identify stakeholders. Communicate risks. Gather feedback. Document communication.',
    evidenceRequirements: ['Stakeholder identification', 'Risk communication', 'Feedback records', 'Communication documentation'],
    testProcedures: ['Review stakeholders', 'Verify communication', 'Check feedback', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27005-11.1',
    name: 'Risk Monitoring and Review',
    description: 'Monitor and review risks.',
    category: 'Monitoring',
    implementationGuidance: 'Monitor risks. Review effectiveness. Update assessments. Document monitoring.',
    evidenceRequirements: ['Risk monitoring', 'Effectiveness review', 'Assessment updates', 'Monitoring documentation'],
    testProcedures: ['Review monitoring', 'Verify effectiveness', 'Check updates', 'Assess documentation'],
    status: 'Not Started'
  }
];

export const ISO_31000_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO31000-5.2',
    name: 'Leadership and Commitment',
    description: 'Demonstrate leadership and commitment to risk management.',
    category: 'Leadership',
    implementationGuidance: 'Define risk policy. Allocate resources. Assign responsibilities. Support integration.',
    evidenceRequirements: ['Risk policy', 'Resource allocation', 'Responsibility assignment', 'Integration support'],
    testProcedures: ['Review policy', 'Verify resources', 'Check responsibilities', 'Assess integration'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO31000-5.4',
    name: 'Risk Management Framework',
    description: 'Design risk management framework.',
    category: 'Framework',
    implementationGuidance: 'Understand context. Define framework. Articulate commitment. Implement framework.',
    evidenceRequirements: ['Context analysis', 'Framework design', 'Commitment statement', 'Framework implementation'],
    testProcedures: ['Review context', 'Verify framework', 'Check commitment', 'Assess implementation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO31000-6.3',
    name: 'Scope, Context, and Criteria',
    description: 'Define scope, context, and criteria for risk management.',
    category: 'Process',
    implementationGuidance: 'Define scope. Establish context. Define criteria. Document decisions.',
    evidenceRequirements: ['Scope definition', 'Context establishment', 'Criteria definition', 'Decision documentation'],
    testProcedures: ['Review scope', 'Verify context', 'Check criteria', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO31000-6.4',
    name: 'Risk Assessment',
    description: 'Conduct risk assessment including identification, analysis, and evaluation.',
    category: 'Process',
    implementationGuidance: 'Identify risks. Analyze risks. Evaluate risks. Document assessment.',
    evidenceRequirements: ['Risk identification', 'Risk analysis', 'Risk evaluation', 'Assessment documentation'],
    testProcedures: ['Review identification', 'Verify analysis', 'Check evaluation', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO31000-6.5',
    name: 'Risk Treatment',
    description: 'Select and implement risk treatment options.',
    category: 'Process',
    implementationGuidance: 'Select options. Plan treatment. Implement treatment. Assess residual risk.',
    evidenceRequirements: ['Option selection', 'Treatment plan', 'Treatment implementation', 'Residual risk assessment'],
    testProcedures: ['Review selection', 'Verify plan', 'Check implementation', 'Assess residual risk'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO31000-6.6',
    name: 'Monitoring and Review',
    description: 'Monitor and review risk management process.',
    category: 'Monitoring',
    implementationGuidance: 'Plan monitoring. Execute monitoring. Review effectiveness. Improve process.',
    evidenceRequirements: ['Monitoring plan', 'Monitoring records', 'Effectiveness review', 'Improvement records'],
    testProcedures: ['Review plan', 'Verify monitoring', 'Check effectiveness', 'Assess improvement'],
    status: 'Not Started'
  }
];

export const ISO_27035_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO27035-5',
    name: 'Plan and Prepare',
    description: 'Plan and prepare for information security incident management.',
    category: 'Planning',
    implementationGuidance: 'Define policy. Establish team. Document procedures. Acquire tools.',
    evidenceRequirements: ['Incident policy', 'Team establishment', 'Procedure documentation', 'Tool acquisition'],
    testProcedures: ['Review policy', 'Verify team', 'Check procedures', 'Assess tools'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27035-6',
    name: 'Detection and Reporting',
    description: 'Detect and report information security events and incidents.',
    category: 'Detection',
    implementationGuidance: 'Implement detection. Define reporting. Train personnel. Document events.',
    evidenceRequirements: ['Detection mechanisms', 'Reporting procedures', 'Training records', 'Event documentation'],
    testProcedures: ['Test detection', 'Verify reporting', 'Check training', 'Review documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27035-7',
    name: 'Assessment and Decision',
    description: 'Assess and decide on information security events.',
    category: 'Assessment',
    implementationGuidance: 'Assess events. Classify incidents. Make decisions. Document assessment.',
    evidenceRequirements: ['Event assessment', 'Incident classification', 'Decision records', 'Assessment documentation'],
    testProcedures: ['Review assessment', 'Verify classification', 'Check decisions', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27035-8',
    name: 'Responses',
    description: 'Respond to information security incidents.',
    category: 'Response',
    implementationGuidance: 'Contain incidents. Eradicate threats. Recover systems. Document response.',
    evidenceRequirements: ['Containment actions', 'Eradication actions', 'Recovery actions', 'Response documentation'],
    testProcedures: ['Review containment', 'Verify eradication', 'Check recovery', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27035-9',
    name: 'Lessons Learned',
    description: 'Learn lessons from information security incidents.',
    category: 'Improvement',
    implementationGuidance: 'Analyze incidents. Identify improvements. Implement changes. Document lessons.',
    evidenceRequirements: ['Incident analysis', 'Improvement identification', 'Change implementation', 'Lessons documentation'],
    testProcedures: ['Review analysis', 'Verify improvements', 'Check changes', 'Assess documentation'],
    status: 'Not Started'
  }
];

export const ISO_27032_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO27032-8.2',
    name: 'Stakeholder Roles',
    description: 'Define roles and responsibilities for cybersecurity.',
    category: 'Governance',
    implementationGuidance: 'Identify stakeholders. Define roles. Assign responsibilities. Document assignments.',
    evidenceRequirements: ['Stakeholder identification', 'Role definitions', 'Responsibility assignments', 'Assignment documentation'],
    testProcedures: ['Review stakeholders', 'Verify roles', 'Check responsibilities', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27032-9.1',
    name: 'Risk Assessment for Cyberspace',
    description: 'Assess risks in cyberspace.',
    category: 'Risk Assessment',
    implementationGuidance: 'Identify cyber risks. Assess threats. Evaluate vulnerabilities. Document risks.',
    evidenceRequirements: ['Risk identification', 'Threat assessment', 'Vulnerability evaluation', 'Risk documentation'],
    testProcedures: ['Review risks', 'Verify threats', 'Check vulnerabilities', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27032-11.1',
    name: 'Application Security',
    description: 'Implement application security controls.',
    category: 'Application Security',
    implementationGuidance: 'Secure applications. Test security. Monitor applications. Document controls.',
    evidenceRequirements: ['Application security', 'Security testing', 'Application monitoring', 'Control documentation'],
    testProcedures: ['Review security', 'Verify testing', 'Check monitoring', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27032-11.3',
    name: 'Server Protection',
    description: 'Protect servers from cybersecurity threats.',
    category: 'Infrastructure',
    implementationGuidance: 'Harden servers. Implement access controls. Monitor servers. Document protection.',
    evidenceRequirements: ['Server hardening', 'Access controls', 'Server monitoring', 'Protection documentation'],
    testProcedures: ['Test hardening', 'Verify controls', 'Check monitoring', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO27032-12.1',
    name: 'Cybersecurity Coordination',
    description: 'Coordinate cybersecurity activities with stakeholders.',
    category: 'Coordination',
    implementationGuidance: 'Establish coordination. Share information. Collaborate on response. Document coordination.',
    evidenceRequirements: ['Coordination establishment', 'Information sharing', 'Response collaboration', 'Coordination documentation'],
    testProcedures: ['Review coordination', 'Verify sharing', 'Check collaboration', 'Assess documentation'],
    status: 'Not Started'
  }
];

export const ISO_20000_1_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO20000-4.1',
    name: 'Understanding Organization Context',
    description: 'Understand organization and its context for service management.',
    category: 'Context',
    implementationGuidance: 'Analyze internal context. Analyze external context. Identify stakeholders. Document understanding.',
    evidenceRequirements: ['Internal analysis', 'External analysis', 'Stakeholder identification', 'Context documentation'],
    testProcedures: ['Review internal', 'Verify external', 'Check stakeholders', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO20000-5.1',
    name: 'Leadership and Commitment',
    description: 'Demonstrate leadership and commitment to service management.',
    category: 'Leadership',
    implementationGuidance: 'Define service policy. Ensure integration. Provide resources. Promote improvement.',
    evidenceRequirements: ['Service policy', 'Integration evidence', 'Resource provision', 'Improvement promotion'],
    testProcedures: ['Review policy', 'Verify integration', 'Check resources', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO20000-8.2',
    name: 'Service Portfolio',
    description: 'Manage service portfolio.',
    category: 'Service Planning',
    implementationGuidance: 'Define portfolio. Plan services. Approve changes. Document portfolio.',
    evidenceRequirements: ['Portfolio definition', 'Service planning', 'Change approval', 'Portfolio documentation'],
    testProcedures: ['Review portfolio', 'Verify planning', 'Check approval', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO20000-8.3',
    name: 'Service Level Management',
    description: 'Manage service levels.',
    category: 'Service Delivery',
    implementationGuidance: 'Define SLAs. Monitor levels. Report performance. Improve services.',
    evidenceRequirements: ['SLA definition', 'Level monitoring', 'Performance reports', 'Service improvement'],
    testProcedures: ['Review SLAs', 'Verify monitoring', 'Check reports', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO20000-8.5',
    name: 'Incident Management',
    description: 'Manage incidents affecting services.',
    category: 'Service Operation',
    implementationGuidance: 'Define incident process. Respond to incidents. Resolve incidents. Document incidents.',
    evidenceRequirements: ['Incident process', 'Response records', 'Resolution records', 'Incident documentation'],
    testProcedures: ['Review process', 'Verify response', 'Check resolution', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO20000-8.6',
    name: 'Change Management',
    description: 'Manage changes to services.',
    category: 'Service Transition',
    implementationGuidance: 'Define change process. Assess changes. Implement changes. Review changes.',
    evidenceRequirements: ['Change process', 'Change assessment', 'Implementation records', 'Change reviews'],
    testProcedures: ['Review process', 'Verify assessment', 'Check implementation', 'Assess reviews'],
    status: 'Not Started'
  }
];

export const ISO_42001_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ISO42001-4.1',
    name: 'Organization Context for AI',
    description: 'Understand organization and context for AI management.',
    category: 'Context',
    implementationGuidance: 'Analyze AI context. Identify stakeholders. Determine requirements. Document context.',
    evidenceRequirements: ['Context analysis', 'Stakeholder identification', 'Requirement determination', 'Context documentation'],
    testProcedures: ['Review context', 'Verify stakeholders', 'Check requirements', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO42001-5.1',
    name: 'AI Leadership',
    description: 'Demonstrate leadership for AI management system.',
    category: 'Leadership',
    implementationGuidance: 'Define AI policy. Assign responsibilities. Provide resources. Promote AI ethics.',
    evidenceRequirements: ['AI policy', 'Responsibility assignments', 'Resource allocation', 'Ethics promotion'],
    testProcedures: ['Review policy', 'Verify responsibilities', 'Check resources', 'Assess ethics'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO42001-6.1',
    name: 'AI Risk Assessment',
    description: 'Assess risks associated with AI systems.',
    category: 'Risk Management',
    implementationGuidance: 'Identify AI risks. Assess impacts. Evaluate likelihood. Document risks.',
    evidenceRequirements: ['Risk identification', 'Impact assessment', 'Likelihood evaluation', 'Risk documentation'],
    testProcedures: ['Review risks', 'Verify impacts', 'Check likelihood', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO42001-8.2',
    name: 'AI Impact Assessment',
    description: 'Conduct impact assessments for AI systems.',
    category: 'Assessment',
    implementationGuidance: 'Assess AI impact. Consider stakeholders. Document assessment. Review regularly.',
    evidenceRequirements: ['Impact assessment', 'Stakeholder consideration', 'Assessment documentation', 'Review records'],
    testProcedures: ['Review assessment', 'Verify stakeholders', 'Check documentation', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO42001-8.4',
    name: 'AI System Lifecycle',
    description: 'Manage AI system lifecycle.',
    category: 'Lifecycle',
    implementationGuidance: 'Design AI systems. Develop responsibly. Deploy safely. Monitor performance.',
    evidenceRequirements: ['Design documentation', 'Development records', 'Deployment records', 'Performance monitoring'],
    testProcedures: ['Review design', 'Verify development', 'Check deployment', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO42001-8.5',
    name: 'AI Data Management',
    description: 'Manage data for AI systems.',
    category: 'Data Management',
    implementationGuidance: 'Manage training data. Ensure data quality. Document provenance. Protect data.',
    evidenceRequirements: ['Data management', 'Quality assurance', 'Provenance documentation', 'Data protection'],
    testProcedures: ['Review management', 'Verify quality', 'Check provenance', 'Assess protection'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO42001-9.1',
    name: 'AI Performance Monitoring',
    description: 'Monitor AI system performance.',
    category: 'Monitoring',
    implementationGuidance: 'Define metrics. Monitor performance. Detect drift. Document monitoring.',
    evidenceRequirements: ['Performance metrics', 'Monitoring records', 'Drift detection', 'Monitoring documentation'],
    testProcedures: ['Review metrics', 'Verify monitoring', 'Check drift', 'Assess documentation'],
    status: 'Not Started'
  }
];
