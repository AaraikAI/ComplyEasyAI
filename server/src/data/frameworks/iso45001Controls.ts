import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO 45001:2018 - Occupational Health and Safety Management System
 * Requirements for OH&S management systems
 */
export const ISO45001_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 4: Context of the Organization =====
  {
    controlId: 'ISO45001-4.1',
    name: 'Understanding Organization Context',
    description: 'Determine external and internal issues relevant to purpose and affecting ability to achieve intended OH&S outcomes.',
    category: 'Context of the Organization',
    implementationGuidance: 'Analyze OH&S context factors including regulatory environment, workplace hazards, and organizational culture. Document issues affecting OH&S performance.',
    evidenceRequirements: ['OH&S context analysis', 'Issue identification records', 'Periodic review documentation'],
    testProcedures: ['Review context analysis comprehensiveness', 'Verify issue identification accuracy', 'Test review frequency'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-4.2',
    name: 'Worker and Interested Party Needs',
    description: 'Determine workers and other interested parties relevant to OH&S management system and their relevant needs and expectations.',
    category: 'Context of the Organization',
    implementationGuidance: 'Identify OH&S stakeholders including workers, contractors, regulators. Document requirements. Establish consultation mechanisms.',
    evidenceRequirements: ['Interested party register', 'Requirement documentation', 'Consultation records'],
    testProcedures: ['Verify stakeholder identification', 'Test requirement documentation', 'Review consultation effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-4.3',
    name: 'OH&S Management System Scope',
    description: 'Determine boundaries and applicability of OH&S management system considering context, compliance obligations, work activities, and authority/ability to exercise control.',
    category: 'Context of the Organization',
    implementationGuidance: 'Define scope covering all work activities with OH&S risks. Include workers under organizational control. Document and maintain scope.',
    evidenceRequirements: ['Scope documentation', 'Boundary justification', 'Work activity coverage records'],
    testProcedures: ['Review scope completeness', 'Verify boundary appropriateness', 'Test activity coverage'],
    status: 'Not Started'
  },

  // ===== Clause 5: Leadership and Worker Participation =====
  {
    controlId: 'ISO45001-5.1',
    name: 'Leadership and Commitment',
    description: 'Top management shall demonstrate leadership and commitment including taking overall responsibility, establishing policy and objectives, integrating OH&S into business processes.',
    category: 'Leadership',
    implementationGuidance: 'Establish management accountability for OH&S. Provide resources. Promote OH&S culture. Protect workers from reprisals.',
    evidenceRequirements: ['Management commitment records', 'Resource allocation', 'Culture promotion evidence', 'Reprisal protection policy'],
    testProcedures: ['Verify management commitment', 'Test resource adequacy', 'Review culture promotion', 'Assess protection effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-5.2',
    name: 'OH&S Policy',
    description: 'Establish OH&S policy including commitment to provide safe working conditions, eliminate hazards, reduce risks, comply with legal requirements, and continually improve.',
    category: 'Leadership',
    implementationGuidance: 'Develop comprehensive OH&S policy. Include commitment statements. Ensure policy availability. Communicate to workers.',
    evidenceRequirements: ['OH&S policy document', 'Commitment statements', 'Communication records', 'Policy availability verification'],
    testProcedures: ['Review policy comprehensiveness', 'Verify commitment coverage', 'Test communication effectiveness', 'Assess availability'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-5.3',
    name: 'Roles, Responsibilities and Authorities',
    description: 'Ensure responsibilities and authorities for relevant OH&S roles are assigned and communicated at all levels.',
    category: 'Leadership',
    implementationGuidance: 'Define OH&S roles clearly. Assign responsibilities at all levels. Establish accountability. Communicate assignments.',
    evidenceRequirements: ['Role definition documentation', 'Responsibility assignments', 'Communication records', 'Accountability structure'],
    testProcedures: ['Verify role clarity', 'Test assignment completeness', 'Review communication', 'Assess accountability'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-5.4',
    name: 'Consultation and Participation of Workers',
    description: 'Establish processes for consultation and participation of workers at all levels in development, planning, implementation and evaluation of the OH&S management system.',
    category: 'Leadership',
    implementationGuidance: 'Create worker consultation mechanisms. Enable participation in hazard identification. Include workers in OH&S decisions. Remove barriers to participation.',
    evidenceRequirements: ['Consultation process documentation', 'Participation mechanism records', 'Decision involvement evidence', 'Barrier removal documentation'],
    testProcedures: ['Test consultation processes', 'Verify participation mechanisms', 'Review decision involvement', 'Assess barrier removal'],
    status: 'Not Started'
  },

  // ===== Clause 6: Planning =====
  {
    controlId: 'ISO45001-6.1.1',
    name: 'General Planning Requirements',
    description: 'When planning, consider context issues, requirements of workers and interested parties, scope, and determine risks and opportunities to achieve intended outcomes.',
    category: 'Planning',
    implementationGuidance: 'Integrate OH&S planning with organizational context. Address risks and opportunities. Plan for intended outcomes. Consider change management.',
    evidenceRequirements: ['Planning documentation', 'Risk and opportunity assessment', 'Outcome planning records', 'Change consideration documentation'],
    testProcedures: ['Review planning comprehensiveness', 'Verify risk coverage', 'Test outcome planning', 'Assess change consideration'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-6.1.2',
    name: 'Hazard Identification and Risk Assessment',
    description: 'Establish processes for ongoing hazard identification considering how work is organized, routine/non-routine activities, human factors, and past incidents.',
    category: 'Planning',
    implementationGuidance: 'Implement systematic hazard identification. Conduct risk assessments. Consider work organization factors. Review after incidents.',
    evidenceRequirements: ['Hazard identification procedures', 'Risk assessment documentation', 'Work organization analysis', 'Incident review records'],
    testProcedures: ['Test hazard identification', 'Verify risk assessment accuracy', 'Review work organization consideration', 'Assess incident integration'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-6.1.3',
    name: 'Legal and Other Requirements',
    description: 'Determine and have access to legal and other requirements applicable to OH&S hazards and risks.',
    category: 'Planning',
    implementationGuidance: 'Identify applicable OH&S legal requirements. Maintain access to requirements. Apply to operations. Track regulatory changes.',
    evidenceRequirements: ['Legal requirement register', 'Access records', 'Application documentation', 'Change tracking records'],
    testProcedures: ['Verify requirement completeness', 'Test access availability', 'Review application accuracy', 'Assess tracking effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-6.1.4',
    name: 'Planning Action',
    description: 'Plan actions to address OH&S risks and opportunities, legal requirements, and prepare for emergency situations.',
    category: 'Planning',
    implementationGuidance: 'Develop action plans for risk control. Address legal compliance. Prepare emergency response plans. Integrate into operations.',
    evidenceRequirements: ['Action planning documentation', 'Compliance planning records', 'Emergency preparedness plans', 'Integration documentation'],
    testProcedures: ['Review action plan adequacy', 'Test compliance planning', 'Verify emergency preparedness', 'Assess integration'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-6.2',
    name: 'OH&S Objectives and Planning',
    description: 'Establish OH&S objectives at relevant functions and levels to maintain and improve OH&S performance.',
    category: 'Planning',
    implementationGuidance: 'Set measurable OH&S objectives. Align with policy. Plan achievement actions. Monitor progress.',
    evidenceRequirements: ['Objective documentation', 'Policy alignment records', 'Achievement plans', 'Progress monitoring records'],
    testProcedures: ['Verify objective measurability', 'Test policy alignment', 'Review achievement planning', 'Assess monitoring'],
    status: 'Not Started'
  },

  // ===== Clause 7: Support =====
  {
    controlId: 'ISO45001-7.1',
    name: 'Resources',
    description: 'Determine and provide resources needed for OH&S management system establishment, implementation, maintenance and improvement.',
    category: 'Support',
    implementationGuidance: 'Assess OH&S resource requirements. Provide necessary resources. Allocate budget for safety activities. Maintain resource availability.',
    evidenceRequirements: ['Resource assessments', 'Provision records', 'Budget allocation', 'Availability documentation'],
    testProcedures: ['Verify resource assessment', 'Test provision adequacy', 'Review budget allocation', 'Assess availability'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-7.2',
    name: 'Competence',
    description: 'Determine necessary competence of workers affecting OH&S performance, ensure competence based on education, training or experience.',
    category: 'Support',
    implementationGuidance: 'Define OH&S competence requirements. Assess worker competence. Provide training. Evaluate training effectiveness.',
    evidenceRequirements: ['Competence definitions', 'Assessment records', 'Training documentation', 'Effectiveness evaluation'],
    testProcedures: ['Review competence definitions', 'Test assessment process', 'Verify training adequacy', 'Assess effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-7.3',
    name: 'Awareness',
    description: 'Workers shall be aware of OH&S policy, objectives, their contribution to effectiveness, implications of nonconformity, and incidents relevant to them.',
    category: 'Support',
    implementationGuidance: 'Communicate OH&S policy and objectives. Explain individual contributions. Clarify implications. Share incident learnings.',
    evidenceRequirements: ['Communication records', 'Contribution explanation', 'Implication awareness documentation', 'Incident sharing records'],
    testProcedures: ['Test awareness levels', 'Verify contribution understanding', 'Review implication awareness', 'Assess incident awareness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-7.4',
    name: 'Communication',
    description: 'Establish processes for internal and external communications relevant to OH&S including what, when, with whom, and how.',
    category: 'Support',
    implementationGuidance: 'Define OH&S communication requirements. Establish internal channels. Implement external communication. Respond to communications.',
    evidenceRequirements: ['Communication requirements', 'Internal communication records', 'External communication records', 'Response documentation'],
    testProcedures: ['Review requirements', 'Test internal communication', 'Verify external communication', 'Assess response timeliness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-7.5',
    name: 'Documented Information',
    description: 'OH&S management system shall include documented information required by standard and determined necessary for effectiveness.',
    category: 'Support',
    implementationGuidance: 'Define documentation requirements. Create and maintain documents. Implement document control. Ensure availability.',
    evidenceRequirements: ['Documentation requirements', 'Document inventory', 'Control procedures', 'Availability records'],
    testProcedures: ['Verify documentation completeness', 'Test document control', 'Review availability', 'Assess update process'],
    status: 'Not Started'
  },

  // ===== Clause 8: Operation =====
  {
    controlId: 'ISO45001-8.1',
    name: 'Operational Planning and Control',
    description: 'Plan, implement, control and maintain processes needed to meet OH&S requirements through establishing criteria, implementing control, and maintaining documented information.',
    category: 'Operation',
    implementationGuidance: 'Apply hierarchy of controls. Establish operational criteria. Control outsourced processes. Manage change.',
    evidenceRequirements: ['Control hierarchy documentation', 'Operational criteria', 'Outsourced process controls', 'Change management records'],
    testProcedures: ['Verify control effectiveness', 'Test criteria appropriateness', 'Review outsourced controls', 'Assess change management'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-8.1.2',
    name: 'Eliminating Hazards and Reducing Risks',
    description: 'Establish processes for elimination of hazards and reduction of OH&S risks using hierarchy of controls: elimination, substitution, engineering controls, administrative controls, PPE.',
    category: 'Operation',
    implementationGuidance: 'Apply hierarchy of controls systematically. Prioritize elimination and substitution. Implement engineering controls. Use administrative controls and PPE appropriately.',
    evidenceRequirements: ['Hierarchy application records', 'Control implementation documentation', 'PPE provision records', 'Effectiveness verification'],
    testProcedures: ['Verify hierarchy application', 'Test control implementation', 'Review PPE adequacy', 'Assess effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-8.1.3',
    name: 'Management of Change',
    description: 'Establish processes for managing temporary and permanent changes impacting OH&S performance including new products, processes, operations, and equipment.',
    category: 'Operation',
    implementationGuidance: 'Implement change management process. Assess OH&S impacts of changes. Apply controls before implementing changes. Review change effectiveness.',
    evidenceRequirements: ['Change management procedures', 'Impact assessment records', 'Control application records', 'Effectiveness reviews'],
    testProcedures: ['Test change management process', 'Verify impact assessment', 'Review control application', 'Assess effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-8.1.4',
    name: 'Procurement',
    description: 'Establish processes for controlling procurement of products and services to ensure conformity with OH&S requirements.',
    category: 'Operation',
    implementationGuidance: 'Define OH&S procurement requirements. Evaluate suppliers for OH&S. Control contractor activities. Coordinate with other organizations.',
    evidenceRequirements: ['Procurement requirements', 'Supplier evaluation records', 'Contractor control documentation', 'Coordination records'],
    testProcedures: ['Verify procurement requirements', 'Test supplier evaluation', 'Review contractor control', 'Assess coordination'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-8.2',
    name: 'Emergency Preparedness and Response',
    description: 'Establish processes to prepare for and respond to potential emergency situations including first aid, emergency drills, and coordination with emergency services.',
    category: 'Operation',
    implementationGuidance: 'Identify potential emergencies. Develop response procedures. Provide first aid. Conduct drills. Coordinate with emergency services.',
    evidenceRequirements: ['Emergency identification', 'Response procedures', 'First aid provision', 'Drill records', 'Coordination documentation'],
    testProcedures: ['Verify emergency identification', 'Test response procedures', 'Review first aid adequacy', 'Assess drill effectiveness'],
    status: 'Not Started'
  },

  // ===== Clause 9: Performance Evaluation =====
  {
    controlId: 'ISO45001-9.1',
    name: 'Monitoring, Measurement, Analysis and Evaluation',
    description: 'Determine what needs to be monitored and measured for OH&S performance, methods, criteria, when to perform, and when to analyze results.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Define OH&S monitoring requirements. Measure leading and lagging indicators. Calibrate equipment. Analyze performance trends.',
    evidenceRequirements: ['Monitoring requirements', 'Indicator measurements', 'Calibration records', 'Performance analysis'],
    testProcedures: ['Verify monitoring coverage', 'Test measurement accuracy', 'Review calibration', 'Assess analysis quality'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-9.1.2',
    name: 'Evaluation of Compliance',
    description: 'Establish processes to evaluate compliance with legal and other OH&S requirements.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Plan compliance evaluation. Conduct evaluations. Document compliance status. Address nonconformities.',
    evidenceRequirements: ['Evaluation planning', 'Evaluation records', 'Status documentation', 'Nonconformity response'],
    testProcedures: ['Review evaluation planning', 'Test evaluation execution', 'Verify status documentation', 'Assess response'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-9.2',
    name: 'Internal Audit',
    description: 'Conduct internal audits at planned intervals to determine OH&S management system conformity and effectiveness.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Plan audit program. Define criteria and scope. Select competent auditors. Report results.',
    evidenceRequirements: ['Audit program', 'Criteria and scope', 'Auditor competence records', 'Audit reports'],
    testProcedures: ['Review program adequacy', 'Verify criteria', 'Test auditor competence', 'Assess findings'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-9.3',
    name: 'Management Review',
    description: 'Top management shall review OH&S management system at planned intervals to ensure continuing suitability, adequacy and effectiveness.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Schedule reviews. Include required inputs. Generate output decisions. Document proceedings.',
    evidenceRequirements: ['Review schedule', 'Input documentation', 'Output decisions', 'Meeting records'],
    testProcedures: ['Verify frequency', 'Test input completeness', 'Review outputs', 'Assess documentation'],
    status: 'Not Started'
  },

  // ===== Clause 10: Improvement =====
  {
    controlId: 'ISO45001-10.1',
    name: 'Incident, Nonconformity and Corrective Action',
    description: 'Establish processes to determine and manage incidents and nonconformities including immediate actions, investigation, root cause analysis, and corrective action.',
    category: 'Improvement',
    implementationGuidance: 'Define incident response procedures. Investigate incidents. Conduct root cause analysis. Implement corrective actions. Verify effectiveness.',
    evidenceRequirements: ['Response procedures', 'Investigation records', 'Root cause analysis', 'Corrective actions', 'Verification records'],
    testProcedures: ['Test response procedures', 'Review investigations', 'Verify root cause analysis', 'Assess effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'ISO45001-10.2',
    name: 'Continual Improvement',
    description: 'Continually improve suitability, adequacy and effectiveness of OH&S management system to enhance OH&S performance.',
    category: 'Improvement',
    implementationGuidance: 'Establish improvement culture. Track OH&S performance trends. Use improvement opportunities. Promote worker participation.',
    evidenceRequirements: ['Improvement initiatives', 'Performance trends', 'Opportunity documentation', 'Participation records'],
    testProcedures: ['Verify improvement culture', 'Test trend analysis', 'Review opportunities', 'Assess participation'],
    status: 'Not Started'
  }
];
