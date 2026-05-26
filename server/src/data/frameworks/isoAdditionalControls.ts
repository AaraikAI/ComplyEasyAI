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

/**
 * ISO/IEC 42001:2023 - Artificial Intelligence Management System (AIMS)
 *
 * The first international standard for AI management systems. Specifies
 * requirements for establishing, implementing, maintaining, and continually
 * improving an AIMS within the context of an organization.
 *
 * Structure:
 *   Clauses 4-10: Management system requirements (per Annex SL / ISO HLS)
 *   Annex A:     38 reference controls across 9 control categories (A.2-A.10)
 *   Annex B:     Implementation guidance for Annex A controls
 *   Annex C:     Potential AI-related organizational objectives & risk sources
 *   Annex D:     Use of AIMS across domains/sectors
 *
 * For ISO 42001 certification, an organization must satisfy clauses 4-10
 * (mandatory) AND select applicable Annex A controls documented in a
 * Statement of Applicability (SoA).
 */
export const ISO_42001_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 4: Context of the organization =====
  {
    controlId: '4.1',
    name: 'Understanding the organization and its context',
    description: 'The organization shall determine external and internal issues that are relevant to its purpose and that affect its ability to achieve the intended outcome(s) of its AI management system. The organization shall determine if climate change is a relevant issue.',
    category: 'Context of the Organization',
    implementationGuidance: 'Conduct PESTLE analysis covering AI-relevant factors (regulatory, technology, ethics, societal). Document internal issues (capabilities, risk appetite, governance). Document external issues (market, partners, public expectations). Update annually.',
    evidenceRequirements: ['Context analysis document', 'PESTLE assessment', 'Issue register', 'Annual review minutes'],
    testProcedures: ['Inspect context analysis for completeness', 'Verify external and internal issues identified', 'Confirm review frequency'],
    status: 'Not Started'
  },
  {
    controlId: '4.2',
    name: 'Understanding the needs and expectations of interested parties',
    description: 'The organization shall determine the interested parties relevant to the AIMS; their relevant requirements; and which of those requirements will be addressed through the AIMS.',
    category: 'Context of the Organization',
    implementationGuidance: 'Identify interested parties: regulators, customers, users, employees, suppliers, affected individuals, society, investors. Document their AI-specific requirements. Map requirements to AIMS scope.',
    evidenceRequirements: ['Interested party register', 'Requirements matrix', 'Stakeholder engagement records', 'Requirement-to-AIMS mapping'],
    testProcedures: ['Review interested party register for completeness', 'Verify requirements documented and addressed', 'Sample requirements for AIMS coverage'],
    status: 'Not Started'
  },
  {
    controlId: '4.3',
    name: 'Determining the scope of the AI management system',
    description: 'The organization shall determine the boundaries and applicability of the AIMS to establish its scope, considering external/internal issues, requirements of interested parties, organizational activities, and interactions with other organizations.',
    category: 'Context of the Organization',
    implementationGuidance: 'Define AIMS boundaries: which AI systems, business units, products, geographies. Document inclusions and exclusions with rationale. Maintain scope statement.',
    evidenceRequirements: ['Documented AIMS scope', 'Inclusion/exclusion rationale', 'Scope boundary map', 'Scope review records'],
    testProcedures: ['Inspect scope statement', 'Verify inclusions/exclusions justified', 'Confirm scope aligns with context'],
    status: 'Not Started'
  },
  {
    controlId: '4.4',
    name: 'AI management system',
    description: 'The organization shall establish, implement, maintain, and continually improve an AIMS, including the processes needed and their interactions, in accordance with the requirements of this document.',
    category: 'Context of the Organization',
    implementationGuidance: 'Document the AIMS process model. Define process interactions. Assign process ownership. Implement continuous improvement via PDCA cycle.',
    evidenceRequirements: ['AIMS process model', 'Process interaction diagram', 'Process ownership matrix', 'PDCA cycle documentation'],
    testProcedures: ['Inspect process model', 'Verify process interactions defined', 'Confirm continuous improvement evidence'],
    status: 'Not Started'
  },

  // ===== Clause 5: Leadership =====
  {
    controlId: '5.1',
    name: 'Leadership and commitment',
    description: 'Top management shall demonstrate leadership and commitment with respect to the AIMS by ensuring policy and objectives are established, integrating AIMS requirements into business processes, providing resources, and communicating importance.',
    category: 'Leadership',
    implementationGuidance: 'Top management visibly endorses AIMS. AI strategy aligned with business strategy. Resources allocated. AI ethics committee chartered. Regular leadership reviews.',
    evidenceRequirements: ['Top management endorsement records', 'AI strategy documents', 'Resource allocation evidence', 'Leadership review minutes'],
    testProcedures: ['Verify top management endorsement', 'Inspect AI strategy alignment', 'Review resource allocation'],
    status: 'Not Started'
  },
  {
    controlId: '5.2',
    name: 'AI policy',
    description: 'Top management shall establish an AI policy that is appropriate to the purpose of the organization, provides a framework for setting AI objectives, includes a commitment to applicable requirements, and includes a commitment to continual improvement.',
    category: 'Leadership',
    implementationGuidance: 'Develop AI policy covering ethics, responsibility, transparency, accountability. Approve at top management level. Publish internally and to stakeholders. Review annually.',
    evidenceRequirements: ['Approved AI policy document', 'Policy publication records', 'Policy review records', 'Policy distribution evidence'],
    testProcedures: ['Inspect AI policy approval', 'Verify policy distribution', 'Confirm annual review'],
    status: 'Not Started'
  },
  {
    controlId: '5.3',
    name: 'Roles, responsibilities and authorities',
    description: 'Top management shall ensure the responsibilities and authorities for roles relevant to the AIMS are assigned and communicated within the organization.',
    category: 'Leadership',
    implementationGuidance: 'Define AI-specific roles (AI Ethics Officer, AI Risk Manager, AI Owner, etc.). Document RACI for AI lifecycle activities. Communicate roles to staff. Maintain role descriptions.',
    evidenceRequirements: ['AI roles and responsibilities matrix', 'RACI for AI lifecycle', 'Role assignment communications', 'Job descriptions'],
    testProcedures: ['Inspect role definitions', 'Verify assignments communicated', 'Sample staff awareness'],
    status: 'Not Started'
  },

  // ===== Clause 6: Planning =====
  {
    controlId: '6.1.1',
    name: 'Actions to address risks and opportunities - General',
    description: 'When planning for the AIMS, the organization shall consider the issues referred to in 4.1 and the requirements in 4.2 and determine the risks and opportunities that need to be addressed.',
    category: 'Planning',
    implementationGuidance: 'Conduct integrated AI risk and opportunity assessment. Consider risks to AIMS achievement and risks from AI systems. Document risk treatment options.',
    evidenceRequirements: ['Risk and opportunity register', 'Risk assessment methodology', 'Treatment plans', 'Integration with enterprise risk'],
    testProcedures: ['Review risk register completeness', 'Verify methodology applied', 'Sample treatment plans'],
    status: 'Not Started'
  },
  {
    controlId: '6.1.2',
    name: 'AI risk assessment',
    description: 'The organization shall establish, implement, and maintain an AI risk assessment process. The process shall identify, analyse, and evaluate risks related to the development or use of AI systems.',
    category: 'Planning',
    implementationGuidance: 'Define AI-specific risk assessment methodology. Identify risks across AI lifecycle (data, model, deployment, operation). Analyse likelihood and consequences. Maintain AI risk register.',
    evidenceRequirements: ['AI risk assessment methodology', 'AI risk register', 'Risk analysis records', 'Lifecycle-specific risks'],
    testProcedures: ['Inspect methodology', 'Sample assessments for completeness', 'Verify risk evaluation criteria'],
    status: 'Not Started'
  },
  {
    controlId: '6.1.3',
    name: 'AI risk treatment',
    description: 'The organization shall implement a process for AI risk treatment to select appropriate options, determine necessary controls (referring to Annex A), and prepare a Statement of Applicability.',
    category: 'Planning',
    implementationGuidance: 'Select risk treatment options (avoid, mitigate, transfer, accept). Map controls to risks using Annex A. Document Statement of Applicability (SoA) with justifications for inclusion/exclusion.',
    evidenceRequirements: ['Risk treatment plans', 'Statement of Applicability (SoA)', 'Annex A control selection rationale', 'Control implementation status'],
    testProcedures: ['Inspect SoA for completeness', 'Verify all Annex A controls considered', 'Sample treatment plans'],
    status: 'Not Started'
  },
  {
    controlId: '6.1.4',
    name: 'AI system impact assessment',
    description: 'The organization shall establish a process to assess the potential consequences for individuals, groups of individuals, and societies that can result from the development, provision, or use of AI systems.',
    category: 'Planning',
    implementationGuidance: 'Conduct AI system impact assessments (AISIA) for in-scope AI systems. Consider impacts on rights, well-being, environment, society. Document and review.',
    evidenceRequirements: ['AI impact assessment methodology', 'Completed impact assessments', 'Stakeholder consultation records', 'Impact mitigation plans'],
    testProcedures: ['Inspect AISIA methodology', 'Sample completed assessments', 'Verify stakeholder consultation'],
    status: 'Not Started'
  },
  {
    controlId: '6.2',
    name: 'AI objectives and planning to achieve them',
    description: 'The organization shall establish AI objectives at relevant functions and levels. Objectives shall be consistent with the AI policy, measurable (where practicable), monitored, communicated, updated as appropriate, and documented.',
    category: 'Planning',
    implementationGuidance: 'Define AI objectives at organizational and team levels. Make objectives SMART. Plan resources, timeline, accountability. Measure achievement.',
    evidenceRequirements: ['AI objectives documentation', 'Achievement plans', 'Measurement criteria', 'Progress tracking'],
    testProcedures: ['Inspect AI objectives for SMART criteria', 'Review plans for completeness', 'Verify monitoring evidence'],
    status: 'Not Started'
  },
  {
    controlId: '6.3',
    name: 'Planning of changes',
    description: 'When the organization determines the need for changes to the AIMS, the changes shall be carried out in a planned manner.',
    category: 'Planning',
    implementationGuidance: 'Define change planning process for AIMS modifications. Assess impact of changes. Plan resources and timeline. Communicate changes.',
    evidenceRequirements: ['Change planning procedures', 'Change impact assessments', 'Change communication records', 'Change implementation evidence'],
    testProcedures: ['Inspect change procedures', 'Sample changes for planning evidence', 'Verify communication'],
    status: 'Not Started'
  },

  // ===== Clause 7: Support =====
  {
    controlId: '7.1',
    name: 'Resources',
    description: 'The organization shall determine and provide the resources needed for the establishment, implementation, maintenance, and continual improvement of the AIMS.',
    category: 'Support',
    implementationGuidance: 'Identify required resources: people, data, computing, tooling, budget. Allocate via planning process. Monitor resource adequacy.',
    evidenceRequirements: ['Resource plan', 'Budget allocation', 'Resource assignment records', 'Resource adequacy reviews'],
    testProcedures: ['Inspect resource plans', 'Verify allocation records', 'Confirm adequacy assessments'],
    status: 'Not Started'
  },
  {
    controlId: '7.2',
    name: 'Competence',
    description: 'The organization shall determine the necessary competence of persons doing work that affects the AIMS performance, ensure these persons are competent, and retain documented information as evidence of competence.',
    category: 'Support',
    implementationGuidance: 'Define competency requirements for AI roles. Assess current competencies. Provide training. Maintain competency records. Reassess periodically.',
    evidenceRequirements: ['Competency framework', 'Training plans and records', 'Competency assessments', 'Certifications'],
    testProcedures: ['Inspect competency framework', 'Sample staff for evidence of competence', 'Verify training records'],
    status: 'Not Started'
  },
  {
    controlId: '7.3',
    name: 'Awareness',
    description: 'Persons doing work under the organization\'s control shall be aware of the AI policy, their contribution to AIMS effectiveness, and the implications of not conforming to AIMS requirements.',
    category: 'Support',
    implementationGuidance: 'Conduct AI awareness program. Cover AI policy, ethics, responsibilities, consequences. Train new hires. Refresh annually. Test understanding.',
    evidenceRequirements: ['Awareness program materials', 'Training attendance records', 'Awareness test results', 'New hire orientation records'],
    testProcedures: ['Inspect awareness program', 'Sample employees for awareness', 'Review training records'],
    status: 'Not Started'
  },
  {
    controlId: '7.4',
    name: 'Communication',
    description: 'The organization shall determine the internal and external communications relevant to the AIMS, including on what, when, with whom, how, and who communicates.',
    category: 'Support',
    implementationGuidance: 'Define communication plan covering internal and external AI communications. Specify content, audience, channels, frequency. Maintain communication records.',
    evidenceRequirements: ['Communication plan', 'Communication records', 'External communications archive', 'Stakeholder feedback'],
    testProcedures: ['Inspect communication plan', 'Verify communications executed per plan', 'Review records for completeness'],
    status: 'Not Started'
  },
  {
    controlId: '7.5',
    name: 'Documented information',
    description: 'The AIMS shall include documented information required by this document and determined by the organization as necessary for AIMS effectiveness.',
    category: 'Support',
    implementationGuidance: 'Define documentation requirements. Implement document control (version, approval, access, retention). Maintain document register.',
    evidenceRequirements: ['Document control procedures', 'Document register', 'Version control evidence', 'Access control evidence'],
    testProcedures: ['Inspect document control', 'Sample documents for proper control', 'Verify register completeness'],
    status: 'Not Started'
  },

  // ===== Clause 8: Operation =====
  {
    controlId: '8.1',
    name: 'Operational planning and control',
    description: 'The organization shall plan, implement, and control the processes needed to meet AIMS requirements and to implement the actions determined in Clause 6.',
    category: 'Operation',
    implementationGuidance: 'Define operational processes for AI lifecycle. Implement controls. Manage changes. Document operations. Address outsourcing.',
    evidenceRequirements: ['Operational procedures', 'Process control records', 'Outsourcing arrangements', 'Operational change records'],
    testProcedures: ['Inspect procedures', 'Sample operations for control evidence', 'Review outsourcing controls'],
    status: 'Not Started'
  },
  {
    controlId: '8.2',
    name: 'AI risk assessment (operational)',
    description: 'The organization shall perform AI risk assessments at planned intervals or when significant changes are proposed/occur, taking into account criteria established in 6.1.2.',
    category: 'Operation',
    implementationGuidance: 'Schedule periodic AI risk assessments. Trigger reassessments on significant changes. Document results. Update risk register.',
    evidenceRequirements: ['Risk assessment schedule', 'Risk reassessment triggers', 'Updated risk register', 'Reassessment reports'],
    testProcedures: ['Verify assessment frequency', 'Sample triggered reassessments', 'Confirm register updates'],
    status: 'Not Started'
  },
  {
    controlId: '8.3',
    name: 'AI risk treatment (operational)',
    description: 'The organization shall implement the AI risk treatment plan and retain documented information of results.',
    category: 'Operation',
    implementationGuidance: 'Execute treatment plans per schedule. Track control implementation. Verify control effectiveness. Document results.',
    evidenceRequirements: ['Treatment execution records', 'Control implementation status', 'Effectiveness verification', 'Result documentation'],
    testProcedures: ['Sample treatments for execution', 'Verify control implementation', 'Review effectiveness data'],
    status: 'Not Started'
  },
  {
    controlId: '8.4',
    name: 'AI system impact assessment (operational)',
    description: 'The organization shall perform AI system impact assessments at planned intervals or when significant changes are proposed/occur, taking into account criteria established in 6.1.4.',
    category: 'Operation',
    implementationGuidance: 'Schedule AISIAs per planned intervals. Trigger on significant changes. Engage stakeholders. Document outcomes.',
    evidenceRequirements: ['AISIA schedule', 'Triggered AISIAs', 'Stakeholder engagement records', 'Impact mitigation outcomes'],
    testProcedures: ['Verify AISIA frequency', 'Sample completed AISIAs', 'Review stakeholder engagement'],
    status: 'Not Started'
  },

  // ===== Clause 9: Performance Evaluation =====
  {
    controlId: '9.1',
    name: 'Monitoring, measurement, analysis and evaluation',
    description: 'The organization shall determine what needs to be monitored and measured; the methods for monitoring, measurement, analysis, and evaluation; when monitoring shall be performed; and when results shall be analysed and evaluated.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Define AIMS KPIs. Implement monitoring across AI lifecycle (model performance, drift, bias, incidents). Analyze trends. Report results.',
    evidenceRequirements: ['KPI definitions', 'Monitoring data', 'Analysis reports', 'Performance dashboards'],
    testProcedures: ['Inspect KPI coverage', 'Review monitoring data quality', 'Sample analysis reports'],
    status: 'Not Started'
  },
  {
    controlId: '9.2',
    name: 'Internal audit',
    description: 'The organization shall conduct internal audits at planned intervals to provide information on whether the AIMS conforms to requirements and is effectively implemented and maintained.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Establish internal audit program. Define audit scope, criteria, frequency. Ensure auditor independence. Document findings. Track remediation.',
    evidenceRequirements: ['Audit program', 'Audit reports', 'Auditor competency evidence', 'Finding remediation tracking'],
    testProcedures: ['Inspect audit program', 'Review audit reports', 'Verify finding remediation'],
    status: 'Not Started'
  },
  {
    controlId: '9.3',
    name: 'Management review',
    description: 'Top management shall review the organization\'s AIMS at planned intervals to ensure its continuing suitability, adequacy, and effectiveness.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Schedule management reviews (typically annually). Cover required inputs: changes, performance, audit results, risks. Document outputs: improvements, changes, resource needs.',
    evidenceRequirements: ['Management review schedule', 'Review meeting minutes', 'Input documentation', 'Output decisions'],
    testProcedures: ['Inspect review schedule', 'Review minutes for required inputs', 'Verify output actions'],
    status: 'Not Started'
  },

  // ===== Clause 10: Improvement =====
  {
    controlId: '10.1',
    name: 'Continual improvement',
    description: 'The organization shall continually improve the suitability, adequacy, and effectiveness of the AIMS.',
    category: 'Improvement',
    implementationGuidance: 'Establish continual improvement process. Identify improvement opportunities from monitoring, audits, reviews. Plan and implement improvements. Track effectiveness.',
    evidenceRequirements: ['Improvement opportunity register', 'Improvement plans', 'Implementation records', 'Effectiveness measurement'],
    testProcedures: ['Inspect improvement register', 'Sample improvements for implementation', 'Verify effectiveness data'],
    status: 'Not Started'
  },
  {
    controlId: '10.2',
    name: 'Nonconformity and corrective action',
    description: 'When a nonconformity occurs, the organization shall react to it, evaluate the need for action to eliminate the causes, implement actions, review effectiveness, and make changes to the AIMS if necessary.',
    category: 'Improvement',
    implementationGuidance: 'Define nonconformity management process. Investigate root causes. Implement corrective actions. Verify effectiveness. Update AIMS as needed.',
    evidenceRequirements: ['Nonconformity register', 'Root cause analyses', 'Corrective action plans', 'Effectiveness verification'],
    testProcedures: ['Inspect nonconformity register', 'Sample CAPAs for root cause and effectiveness', 'Verify AIMS updates'],
    status: 'Not Started'
  },

  // ===== Annex A: Reference Controls =====
  // ----- A.2: Policies related to AI -----
  {
    controlId: 'A.2.2',
    name: 'AI policy',
    description: 'The organization shall document a policy for the development or use of AI systems that is aligned with business strategy and organizational values and approved by top management.',
    category: 'A.2 Policies Related to AI',
    implementationGuidance: 'Develop AI policy covering ethical principles, accountability, transparency, fairness, safety, privacy. Align with values and strategy. Get top management approval. Distribute organization-wide.',
    evidenceRequirements: ['Approved AI policy', 'Top management approval signature', 'Policy distribution records', 'Strategy alignment evidence'],
    testProcedures: ['Inspect policy content for ethical principles', 'Verify top management approval', 'Confirm distribution'],
    status: 'Not Started'
  },
  {
    controlId: 'A.2.3',
    name: 'Alignment with other organizational policies',
    description: 'The organization shall determine where other policies can be affected by or apply to the organizational objectives with respect to AI systems.',
    category: 'A.2 Policies Related to AI',
    implementationGuidance: 'Map AI policy interactions with privacy, security, ethics, HR, legal policies. Identify and resolve conflicts. Cross-reference policies.',
    evidenceRequirements: ['Policy interaction map', 'Conflict resolution records', 'Cross-reference matrix', 'Integrated policy framework'],
    testProcedures: ['Inspect policy interaction map', 'Verify conflict resolution', 'Confirm cross-references'],
    status: 'Not Started'
  },
  {
    controlId: 'A.2.4',
    name: 'Review of the AI policy',
    description: 'The AI policy shall be reviewed at planned intervals or if significant changes occur to ensure its continuing suitability, adequacy, and effectiveness.',
    category: 'A.2 Policies Related to AI',
    implementationGuidance: 'Schedule annual AI policy reviews. Trigger reviews on significant changes (regulations, technology, incidents). Document review outcomes. Update policy as needed.',
    evidenceRequirements: ['Policy review schedule', 'Review records', 'Policy update history', 'Change triggers documentation'],
    testProcedures: ['Verify review frequency', 'Inspect review records', 'Confirm policy updates'],
    status: 'Not Started'
  },

  // ----- A.3: Internal organization -----
  {
    controlId: 'A.3.2',
    name: 'AI roles and responsibilities',
    description: 'Roles and responsibilities for AI shall be defined and allocated according to the needs of the organization.',
    category: 'A.3 Internal Organization',
    implementationGuidance: 'Define AI-specific roles (e.g., AI Owner, AI Risk Manager, AI Ethics Officer, ML Engineer, AI System User). Allocate responsibilities clearly. Avoid conflicts of interest.',
    evidenceRequirements: ['AI role definitions', 'RACI matrix for AI activities', 'Role assignment records', 'Conflict-of-interest assessments'],
    testProcedures: ['Inspect role definitions', 'Verify allocations documented', 'Confirm no role conflicts'],
    status: 'Not Started'
  },
  {
    controlId: 'A.3.3',
    name: 'Reporting of concerns',
    description: 'The organization shall define and put in place a process to report concerns about the organization\'s role with respect to AI systems throughout its lifecycle.',
    category: 'A.3 Internal Organization',
    implementationGuidance: 'Establish confidential reporting channel (hotline, intranet form). Protect reporters from retaliation. Document and investigate concerns. Communicate outcomes.',
    evidenceRequirements: ['Reporting channel documentation', 'Anti-retaliation policy', 'Concern logs', 'Investigation records'],
    testProcedures: ['Verify reporting channel exists', 'Review anti-retaliation policy', 'Sample concerns for investigation'],
    status: 'Not Started'
  },

  // ----- A.4: Resources for AI systems -----
  {
    controlId: 'A.4.2',
    name: 'Resource documentation',
    description: 'The organization shall identify and document relevant resources, including human, data, tooling, system, computing, and intangible resources required for activities at each AI system life cycle stage and other AI-related activities.',
    category: 'A.4 Resources for AI Systems',
    implementationGuidance: 'Maintain resource inventory per AI system. Cover human (skills), data, tooling, computing, intangible (IP, models). Update as resources change.',
    evidenceRequirements: ['Resource inventory per AI system', 'Resource categorization', 'Resource updates log', 'Resource gap analyses'],
    testProcedures: ['Inspect inventory completeness', 'Sample systems for resource documentation', 'Verify update frequency'],
    status: 'Not Started'
  },
  {
    controlId: 'A.4.3',
    name: 'Data resources',
    description: 'As a part of identifying resources, the organization shall document information about the data resources utilized for the AI system, including categories, sources, formats, and usage rights.',
    category: 'A.4 Resources for AI Systems',
    implementationGuidance: 'Document each data resource: source, category (training/validation/test), format, volume, usage rights, licensing, sensitivity. Maintain data catalog.',
    evidenceRequirements: ['Data catalog', 'Data source documentation', 'Usage rights/licenses', 'Sensitivity classifications'],
    testProcedures: ['Inspect data catalog', 'Sample data resources for completeness', 'Verify licensing'],
    status: 'Not Started'
  },
  {
    controlId: 'A.4.4',
    name: 'Tooling resources',
    description: 'The organization shall document information about the tooling resources utilized by the AI system, including their purpose, capabilities, and use.',
    category: 'A.4 Resources for AI Systems',
    implementationGuidance: 'Inventory AI tooling: ML frameworks (TensorFlow, PyTorch), MLOps tools, monitoring tools, IDEs, etc. Document purpose, version, configuration.',
    evidenceRequirements: ['Tooling inventory', 'Tool documentation', 'Version control records', 'Configuration management'],
    testProcedures: ['Inspect tooling inventory', 'Sample tools for documentation', 'Verify version control'],
    status: 'Not Started'
  },
  {
    controlId: 'A.4.5',
    name: 'System and computing resources',
    description: 'The organization shall document information about the system and computing resources utilized by the AI system, including infrastructure, network, and capacity.',
    category: 'A.4 Resources for AI Systems',
    implementationGuidance: 'Document computing infrastructure: cloud/on-prem, GPUs/CPUs, storage, network. Track capacity, utilization, scaling plans.',
    evidenceRequirements: ['Infrastructure inventory', 'Capacity documentation', 'Network topology', 'Scaling plans'],
    testProcedures: ['Inspect infrastructure docs', 'Verify capacity tracking', 'Review network architecture'],
    status: 'Not Started'
  },
  {
    controlId: 'A.4.6',
    name: 'Human resources',
    description: 'The organization shall document information about the human resources and their competencies needed for AI system activities throughout its lifecycle.',
    category: 'A.4 Resources for AI Systems',
    implementationGuidance: 'Document AI roles and required competencies. Track staff skills, certifications, training. Identify gaps and plan development.',
    evidenceRequirements: ['Role-competency matrix', 'Staff skill inventory', 'Training records', 'Gap analyses'],
    testProcedures: ['Inspect competency matrix', 'Sample staff competencies', 'Verify training records'],
    status: 'Not Started'
  },

  // ----- A.5: Assessing impacts of AI systems -----
  {
    controlId: 'A.5.2',
    name: 'AI system impact assessment process',
    description: 'The organization shall establish a process to assess the potential consequences for individuals, groups of individuals, and societies that can result from the development, provision, or use of AI systems.',
    category: 'A.5 Assessing Impacts of AI Systems',
    implementationGuidance: 'Define impact assessment methodology covering intended use, foreseeable misuse, affected stakeholders, consequence severity. Apply consistently across AI systems.',
    evidenceRequirements: ['Impact assessment methodology', 'Assessment templates', 'Assessment training', 'Methodology version control'],
    testProcedures: ['Inspect methodology', 'Verify consistent application', 'Confirm training delivered'],
    status: 'Not Started'
  },
  {
    controlId: 'A.5.3',
    name: 'Documentation of AI system impact assessments',
    description: 'The organization shall document the results of AI system impact assessments and retain such information for a defined period.',
    category: 'A.5 Assessing Impacts of AI Systems',
    implementationGuidance: 'Document each AI system\'s impact assessment with intended use, foreseeable misuse, positive/negative impacts, mitigations. Retain per policy.',
    evidenceRequirements: ['Completed impact assessments', 'Retention policy', 'Assessment archive', 'Mitigation documentation'],
    testProcedures: ['Sample assessments for completeness', 'Verify retention', 'Inspect mitigation records'],
    status: 'Not Started'
  },
  {
    controlId: 'A.5.4',
    name: 'Assessing AI system impact on individuals or groups',
    description: 'The organization shall assess and document the potential impacts of AI systems on individuals or groups of individuals throughout the system\'s life cycle.',
    category: 'A.5 Assessing Impacts of AI Systems',
    implementationGuidance: 'Identify affected individuals/groups. Assess impacts on rights, well-being, fairness, autonomy. Consider vulnerable populations. Document and mitigate.',
    evidenceRequirements: ['Individual/group impact analyses', 'Vulnerable population considerations', 'Fairness assessments', 'Mitigation records'],
    testProcedures: ['Sample analyses for affected groups', 'Verify vulnerable population assessment', 'Review fairness evaluations'],
    status: 'Not Started'
  },
  {
    controlId: 'A.5.5',
    name: 'Assessing societal impacts of AI systems',
    description: 'The organization shall assess and document the potential societal impacts of their AI systems throughout the system\'s life cycle.',
    category: 'A.5 Assessing Impacts of AI Systems',
    implementationGuidance: 'Consider broader societal impacts: economic (labor displacement), environmental (energy use), democratic (election integrity), cultural. Engage diverse stakeholders.',
    evidenceRequirements: ['Societal impact analyses', 'Stakeholder consultation records', 'Environmental impact assessments', 'Ethical review records'],
    testProcedures: ['Inspect societal impact analyses', 'Verify stakeholder diversity', 'Review environmental considerations'],
    status: 'Not Started'
  },

  // ----- A.6: AI system life cycle -----
  {
    controlId: 'A.6.1.1',
    name: 'Management guidance for AI system development',
    description: 'The organization shall define and document specific guidance and processes for the responsible development of AI systems.',
    category: 'A.6.1 AI System Life Cycle - Management Guidance',
    implementationGuidance: 'Document AI development guidance: ethics principles, design patterns, prohibited practices, review checkpoints. Communicate to dev teams.',
    evidenceRequirements: ['Development guidance document', 'Communication records', 'Acknowledgment records', 'Reference architecture'],
    testProcedures: ['Inspect guidance', 'Verify communication', 'Sample dev teams for awareness'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.1.2',
    name: 'Objectives for responsible development of AI systems',
    description: 'The organization shall identify and document objectives to guide the responsible development of AI systems and shall consider measures to achieve those objectives.',
    category: 'A.6.1 AI System Life Cycle - Management Guidance',
    implementationGuidance: 'Define responsible AI objectives: fairness, transparency, accountability, safety, privacy, robustness. Translate to measurable criteria.',
    evidenceRequirements: ['Responsible AI objectives', 'Measurable criteria', 'Achievement tracking', 'Project-level objectives'],
    testProcedures: ['Inspect objectives', 'Verify measurability', 'Sample projects for application'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.1.3',
    name: 'Processes for responsible AI system design and development',
    description: 'The organization shall define and document the specific processes for the responsible design and development of AI systems.',
    category: 'A.6.1 AI System Life Cycle - Management Guidance',
    implementationGuidance: 'Document responsible AI development processes: model card creation, bias testing, explainability, security review, stakeholder review.',
    evidenceRequirements: ['Documented dev processes', 'Process templates', 'Stage-gate criteria', 'Process compliance records'],
    testProcedures: ['Inspect processes', 'Verify templates used', 'Sample projects for process adherence'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.2',
    name: 'AI system requirements and specification',
    description: 'The organization shall specify and document requirements for new AI systems or substantial enhancements to existing systems.',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Document functional, performance, ethical, security, accessibility requirements. Include stakeholder needs. Get formal approval before development.',
    evidenceRequirements: ['Requirements documents', 'Stakeholder input records', 'Approval records', 'Requirements traceability'],
    testProcedures: ['Sample requirements docs', 'Verify stakeholder input', 'Confirm approval'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.3',
    name: 'Documentation of AI system design and development',
    description: 'The organization shall document the AI system design and development.',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Maintain design documentation: architecture, data flow, model architecture, training procedures. Update as system evolves. Apply version control.',
    evidenceRequirements: ['Design documents', 'Architecture diagrams', 'Model cards', 'Version-controlled documentation'],
    testProcedures: ['Inspect design docs for completeness', 'Verify version control', 'Sample model cards'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.4',
    name: 'AI system verification and validation',
    description: 'The organization shall define and document verification and validation measures for the AI system and specify criteria for their use.',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Define verification (built correctly) and validation (built the right thing) procedures. Specify acceptance criteria. Document results. Address fairness, accuracy, robustness, security testing.',
    evidenceRequirements: ['V&V procedures', 'Test plans and results', 'Acceptance criteria', 'Bias/fairness test results'],
    testProcedures: ['Inspect V&V procedures', 'Sample test results', 'Verify acceptance criteria met'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.5',
    name: 'AI system deployment',
    description: 'The organization shall document the deployment of the AI system into production.',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Define deployment process: approval, rollout strategy (canary, blue/green), monitoring setup, rollback procedures. Document each deployment.',
    evidenceRequirements: ['Deployment procedures', 'Deployment records', 'Approval records', 'Rollback evidence'],
    testProcedures: ['Inspect deployment procedures', 'Sample deployments for documentation', 'Verify approvals'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.6',
    name: 'AI system operation and monitoring',
    description: 'The organization shall define and document the necessary elements for the operation and monitoring of the AI system.',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Define operational procedures: monitoring metrics (accuracy, drift, bias), alerting, incident response, periodic reviews. Implement observability.',
    evidenceRequirements: ['Operations procedures', 'Monitoring dashboards', 'Alert configurations', 'Incident logs'],
    testProcedures: ['Inspect ops procedures', 'Verify monitoring coverage', 'Sample incidents'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.7',
    name: 'AI system technical documentation',
    description: 'The organization shall determine what AI system technical documentation is required for each relevant interested party (e.g., regulators, users, partners).',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Identify documentation needs per stakeholder. Maintain technical docs: data sheets, model cards, system cards, API docs, regulator-specific docs (e.g., EU AI Act).',
    evidenceRequirements: ['Stakeholder documentation matrix', 'Model cards', 'System cards', 'Regulator-specific docs'],
    testProcedures: ['Inspect doc matrix', 'Sample stakeholder docs', 'Verify regulator compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'A.6.2.8',
    name: 'AI system event logs',
    description: 'The organization shall determine the phases of the AI system lifecycle for which event logs are needed and consequently implement procedures and tools for event logging.',
    category: 'A.6.2 AI System Life Cycle Development',
    implementationGuidance: 'Define event logging requirements (training, inference, decisions, errors). Implement structured logging. Retain logs per policy. Protect log integrity.',
    evidenceRequirements: ['Event logging procedures', 'Log schemas', 'Log retention policy', 'Log integrity protections'],
    testProcedures: ['Inspect logging procedures', 'Verify log coverage', 'Confirm retention and integrity'],
    status: 'Not Started'
  },

  // ----- A.7: Data for AI systems -----
  {
    controlId: 'A.7.2',
    name: 'Data for development and enhancement of AI systems',
    description: 'The organization shall define, document, and implement data management processes related to the development of AI systems.',
    category: 'A.7 Data for AI Systems',
    implementationGuidance: 'Establish data management lifecycle: acquisition, curation, versioning, storage, archival. Apply to training, validation, test datasets.',
    evidenceRequirements: ['Data management policy', 'Data lifecycle documentation', 'Dataset registries', 'Versioning records'],
    testProcedures: ['Inspect data management policy', 'Verify lifecycle coverage', 'Sample datasets for versioning'],
    status: 'Not Started'
  },
  {
    controlId: 'A.7.3',
    name: 'Acquisition of data',
    description: 'The organization shall determine and document details about the acquisition and selection of the data used in AI systems.',
    category: 'A.7 Data for AI Systems',
    implementationGuidance: 'Document data sources, acquisition methods, selection criteria, licenses, consent basis. Validate data is appropriate for purpose.',
    evidenceRequirements: ['Acquisition records', 'Source documentation', 'Selection criteria', 'License/consent records'],
    testProcedures: ['Sample acquisitions for documentation', 'Verify selection criteria applied', 'Inspect licensing'],
    status: 'Not Started'
  },
  {
    controlId: 'A.7.4',
    name: 'Quality of data for AI systems',
    description: 'The organization shall define and document requirements for data quality and ensure that data used to develop and operate the AI system meets those requirements.',
    category: 'A.7 Data for AI Systems',
    implementationGuidance: 'Define data quality dimensions (accuracy, completeness, consistency, timeliness, validity, representativeness). Measure and monitor. Remediate issues.',
    evidenceRequirements: ['Data quality requirements', 'Quality measurements', 'Remediation records', 'Data quality dashboards'],
    testProcedures: ['Inspect quality requirements', 'Sample data for quality measurement', 'Verify remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'A.7.5',
    name: 'Data provenance',
    description: 'The organization shall define and document a process for recording the provenance of data used in its AI systems over the lifetimes of the data and the AI systems.',
    category: 'A.7 Data for AI Systems',
    implementationGuidance: 'Record data lineage: sources, transformations, owners, dates. Use provenance tools (e.g., MLflow, data catalog). Maintain across data lifecycle.',
    evidenceRequirements: ['Provenance recording procedures', 'Lineage diagrams', 'Provenance metadata', 'Tool configurations'],
    testProcedures: ['Inspect provenance procedures', 'Sample data for lineage', 'Verify tool integration'],
    status: 'Not Started'
  },
  {
    controlId: 'A.7.6',
    name: 'Data preparation',
    description: 'The organization shall define and document its criteria for selecting data preparations and the data preparation methods to be used.',
    category: 'A.7 Data for AI Systems',
    implementationGuidance: 'Document data preparation: cleaning, normalization, labeling, augmentation, feature engineering. Specify selection criteria. Reproducible pipelines.',
    evidenceRequirements: ['Preparation procedures', 'Selection criteria', 'Pipeline code/configs', 'Reproducibility evidence'],
    testProcedures: ['Inspect preparation procedures', 'Verify reproducibility', 'Sample pipelines'],
    status: 'Not Started'
  },

  // ----- A.8: Information for interested parties of AI systems -----
  {
    controlId: 'A.8.2',
    name: 'System documentation and information for users',
    description: 'The organization shall determine and provide the necessary information to users of the AI system.',
    category: 'A.8 Information for Interested Parties',
    implementationGuidance: 'Provide users with: purpose, intended use, technical limitations, monitoring capabilities, instructions. Use accessible language. Update with system changes.',
    evidenceRequirements: ['User documentation', 'Accessibility compliance', 'Update history', 'User feedback'],
    testProcedures: ['Inspect user docs', 'Verify accessibility', 'Sample for clarity'],
    status: 'Not Started'
  },
  {
    controlId: 'A.8.3',
    name: 'External reporting',
    description: 'The organization shall determine and document its responsibilities for reporting to external interested parties.',
    category: 'A.8 Information for Interested Parties',
    implementationGuidance: 'Identify external reporting obligations (regulators, customers, public). Define content, format, frequency. Maintain reporting records.',
    evidenceRequirements: ['External reporting register', 'Report templates', 'Submitted reports', 'Reporting calendar'],
    testProcedures: ['Inspect reporting register', 'Sample submitted reports', 'Verify timeliness'],
    status: 'Not Started'
  },
  {
    controlId: 'A.8.4',
    name: 'Communication of incidents',
    description: 'The organization shall determine and document a plan for communicating to relevant interested parties about incidents.',
    category: 'A.8 Information for Interested Parties',
    implementationGuidance: 'Define incident communication plan: triggers, audiences, content, channels, timelines. Train spokespeople. Coordinate with legal/PR.',
    evidenceRequirements: ['Incident communication plan', 'Communication templates', 'Spokesperson training', 'Past incident communications'],
    testProcedures: ['Inspect communication plan', 'Sample past communications', 'Verify training'],
    status: 'Not Started'
  },
  {
    controlId: 'A.8.5',
    name: 'Information for interested parties',
    description: 'The organization shall determine and document the relevant information about the AI system that is provided to the interested parties.',
    category: 'A.8 Information for Interested Parties',
    implementationGuidance: 'Tailor information to each interested party (regulators, users, affected individuals, partners). Provide via appropriate channels. Maintain records.',
    evidenceRequirements: ['Stakeholder information matrix', 'Distribution records', 'Channel documentation', 'Feedback mechanisms'],
    testProcedures: ['Inspect information matrix', 'Verify distribution', 'Sample stakeholder feedback'],
    status: 'Not Started'
  },

  // ----- A.9: Use of AI systems -----
  {
    controlId: 'A.9.2',
    name: 'Processes for responsible use of AI systems',
    description: 'The organization shall define and document the processes for the responsible use of AI systems.',
    category: 'A.9 Use of AI Systems',
    implementationGuidance: 'Document responsible use procedures: oversight requirements, human-in-the-loop policies, decision review, override mechanisms.',
    evidenceRequirements: ['Use procedures', 'Oversight requirements', 'Override mechanisms', 'Decision review records'],
    testProcedures: ['Inspect use procedures', 'Verify oversight implemented', 'Sample decisions for review'],
    status: 'Not Started'
  },
  {
    controlId: 'A.9.3',
    name: 'Objectives for responsible use of AI systems',
    description: 'The organization shall identify and document objectives to guide the responsible use of AI systems.',
    category: 'A.9 Use of AI Systems',
    implementationGuidance: 'Define use objectives: appropriate scope, user competence, monitoring outcomes, addressing user concerns. Translate to operational measures.',
    evidenceRequirements: ['Use objectives', 'Operational measures', 'Outcome tracking', 'User concern handling'],
    testProcedures: ['Inspect objectives', 'Verify operational measures', 'Sample outcomes'],
    status: 'Not Started'
  },
  {
    controlId: 'A.9.4',
    name: 'Intended use of the AI system',
    description: 'The organization shall ensure the AI system is used according to the intended uses of the AI system and its accompanying documentation.',
    category: 'A.9 Use of AI Systems',
    implementationGuidance: 'Communicate intended use clearly. Train users on appropriate use. Monitor for misuse. Implement guardrails (rate limits, content filters).',
    evidenceRequirements: ['Intended use documentation', 'User training records', 'Misuse monitoring', 'Guardrail configurations'],
    testProcedures: ['Verify intended use communicated', 'Inspect training', 'Test guardrails'],
    status: 'Not Started'
  },

  // ----- A.10: Third-party and customer relationships -----
  {
    controlId: 'A.10.2',
    name: 'Allocating responsibilities',
    description: 'The organization shall ensure that responsibilities within its AI system lifecycle are allocated between the organization, its partners, suppliers, customers, and third parties.',
    category: 'A.10 Third-Party and Customer Relationships',
    implementationGuidance: 'Map AI lifecycle responsibilities across parties. Document in contracts. Address handoffs. Update on relationship changes.',
    evidenceRequirements: ['Responsibility allocation matrix', 'Contractual provisions', 'Handoff procedures', 'Relationship change logs'],
    testProcedures: ['Inspect allocation matrix', 'Verify contractual coverage', 'Sample handoffs'],
    status: 'Not Started'
  },
  {
    controlId: 'A.10.3',
    name: 'Suppliers',
    description: 'The organization shall ensure that its suppliers align to its approach in developing or providing AI systems responsibly.',
    category: 'A.10 Third-Party and Customer Relationships',
    implementationGuidance: 'Assess supplier AI practices before engagement. Include AIMS-aligned obligations in contracts. Monitor supplier compliance. Audit periodically.',
    evidenceRequirements: ['Supplier assessment records', 'AIMS contractual clauses', 'Compliance monitoring', 'Supplier audit reports'],
    testProcedures: ['Sample suppliers for assessment', 'Inspect contractual clauses', 'Review audit reports'],
    status: 'Not Started'
  },
  {
    controlId: 'A.10.4',
    name: 'Customers',
    description: 'The organization shall ensure that its approach to responsible development and provision of AI systems takes into account customer expectations and needs.',
    category: 'A.10 Third-Party and Customer Relationships',
    implementationGuidance: 'Engage customers on AI requirements, ethics, and concerns. Document customer expectations. Reflect in AI system design and operations.',
    evidenceRequirements: ['Customer engagement records', 'Expectation documentation', 'Design integration evidence', 'Customer feedback handling'],
    testProcedures: ['Inspect engagement records', 'Verify expectations reflected in design', 'Sample feedback handling'],
    status: 'Not Started'
  }
];
