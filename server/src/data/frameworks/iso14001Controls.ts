import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO 14001:2015 - Environmental Management System
 * Requirements for environmental management systems
 */
export const ISO14001_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 4: Context of the Organization =====
  {
    controlId: 'ISO14001-4.1',
    name: 'Understanding the Organization and its Context',
    description: 'Determine external and internal issues relevant to the organization\'s purpose and affecting its ability to achieve intended outcomes of the EMS, including environmental conditions affected by or capable of affecting the organization.',
    category: 'Context of the Organization',
    implementationGuidance: 'Analyze environmental context factors. Consider climate change, resource availability, and ecosystem impacts. Document issues affecting EMS performance. Review context periodically.',
    evidenceRequirements: [
      'Environmental context analysis',
      'Issue identification documentation',
      'Impact assessment records',
      'Periodic review documentation'
    ],
    testProcedures: [
      'Review context analysis comprehensiveness',
      'Verify issue identification accuracy',
      'Test impact assessment completeness',
      'Assess review frequency'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-4.2',
    name: 'Interested Parties and Their Requirements',
    description: 'Determine interested parties relevant to the EMS, their relevant needs and expectations, and which become compliance obligations.',
    category: 'Context of the Organization',
    implementationGuidance: 'Identify environmental stakeholders. Document stakeholder requirements. Determine applicable compliance obligations. Monitor stakeholder changes.',
    evidenceRequirements: [
      'Interested party register',
      'Requirement documentation',
      'Compliance obligation records',
      'Stakeholder monitoring records'
    ],
    testProcedures: [
      'Verify stakeholder identification',
      'Review requirement documentation',
      'Test compliance obligation accuracy',
      'Assess monitoring effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-4.3',
    name: 'EMS Scope Determination',
    description: 'Determine boundaries and applicability of the EMS including consideration of external/internal issues, compliance obligations, organizational units, activities, and products/services.',
    category: 'Context of the Organization',
    implementationGuidance: 'Define EMS boundaries clearly. Include all activities with environmental aspects. Consider life cycle perspective. Document scope and maintain availability.',
    evidenceRequirements: [
      'EMS scope documentation',
      'Boundary justification records',
      'Life cycle consideration documentation',
      'Scope availability records'
    ],
    testProcedures: [
      'Review scope definition clarity',
      'Verify boundary appropriateness',
      'Test life cycle consideration',
      'Assess scope accessibility'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-4.4',
    name: 'Environmental Management System',
    description: 'Establish, implement, maintain and continually improve an EMS including needed processes and interactions to achieve intended outcomes.',
    category: 'Context of the Organization',
    implementationGuidance: 'Design comprehensive EMS. Define process interactions. Implement management system requirements. Plan for continual improvement.',
    evidenceRequirements: [
      'EMS documentation',
      'Process interaction maps',
      'Implementation records',
      'Improvement planning'
    ],
    testProcedures: [
      'Verify EMS completeness',
      'Test process interactions',
      'Review implementation status',
      'Assess improvement planning'
    ],
    status: 'Not Started'
  },

  // ===== Clause 5: Leadership =====
  {
    controlId: 'ISO14001-5.1',
    name: 'Leadership and Commitment',
    description: 'Top management shall demonstrate leadership and commitment to the EMS by taking accountability, establishing policy and objectives, integrating EMS into business processes, and ensuring resources.',
    category: 'Leadership',
    implementationGuidance: 'Establish management accountability for EMS. Integrate environmental considerations into business decisions. Ensure adequate resource allocation. Promote environmental protection.',
    evidenceRequirements: [
      'Management accountability records',
      'Business integration documentation',
      'Resource allocation records',
      'Environmental promotion records'
    ],
    testProcedures: [
      'Verify management commitment',
      'Test business integration',
      'Review resource adequacy',
      'Assess promotion effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-5.2',
    name: 'Environmental Policy',
    description: 'Top management shall establish environmental policy appropriate to organization\'s purpose and context, providing framework for objectives, including commitment to environmental protection, compliance, and continual improvement.',
    category: 'Leadership',
    implementationGuidance: 'Develop comprehensive environmental policy. Include pollution prevention commitment. Ensure policy framework for objectives. Communicate policy widely.',
    evidenceRequirements: [
      'Environmental policy document',
      'Commitment statements',
      'Objective framework documentation',
      'Communication records'
    ],
    testProcedures: [
      'Review policy appropriateness',
      'Verify commitment coverage',
      'Test objective framework alignment',
      'Assess communication effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-5.3',
    name: 'Organizational Roles, Responsibilities and Authorities',
    description: 'Top management shall ensure responsibilities and authorities for relevant roles are assigned and communicated, including EMS conformity and performance reporting to top management.',
    category: 'Leadership',
    implementationGuidance: 'Define EMS roles clearly. Assign environmental responsibilities. Establish reporting relationships. Communicate role assignments.',
    evidenceRequirements: [
      'Role and responsibility matrix',
      'Assignment documentation',
      'Reporting structure records',
      'Communication records'
    ],
    testProcedures: [
      'Verify role definition clarity',
      'Test responsibility assignment',
      'Review reporting effectiveness',
      'Assess communication completeness'
    ],
    status: 'Not Started'
  },

  // ===== Clause 6: Planning =====
  {
    controlId: 'ISO14001-6.1.1',
    name: 'General Planning',
    description: 'When planning for the EMS, consider context issues, interested party requirements, scope, and determine risks and opportunities to address, give assurance EMS achieves outcomes, and prevent or reduce undesired effects.',
    category: 'Planning',
    implementationGuidance: 'Integrate planning with context analysis. Address environmental risks and opportunities. Plan for EMS effectiveness. Consider undesired effect prevention.',
    evidenceRequirements: [
      'Planning documentation',
      'Risk and opportunity assessment',
      'Effectiveness planning records',
      'Prevention planning documentation'
    ],
    testProcedures: [
      'Review planning comprehensiveness',
      'Verify risk/opportunity coverage',
      'Test effectiveness planning',
      'Assess prevention measures'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-6.1.2',
    name: 'Environmental Aspects',
    description: 'Determine environmental aspects of activities, products and services within EMS scope that can be controlled or influenced, and their impacts, using life cycle perspective.',
    category: 'Planning',
    implementationGuidance: 'Identify all environmental aspects. Assess environmental impacts. Apply life cycle thinking. Determine significant aspects.',
    evidenceRequirements: [
      'Environmental aspect register',
      'Impact assessment documentation',
      'Life cycle consideration records',
      'Significance determination documentation'
    ],
    testProcedures: [
      'Verify aspect identification completeness',
      'Test impact assessment accuracy',
      'Review life cycle application',
      'Assess significance criteria'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-6.1.3',
    name: 'Compliance Obligations',
    description: 'Determine and have access to compliance obligations related to environmental aspects, and determine how these apply to the organization.',
    category: 'Planning',
    implementationGuidance: 'Identify all compliance obligations. Maintain access to requirements. Apply obligations to operations. Track regulatory changes.',
    evidenceRequirements: [
      'Compliance obligation register',
      'Requirement access documentation',
      'Application mapping records',
      'Regulatory tracking records'
    ],
    testProcedures: [
      'Verify obligation completeness',
      'Test requirement access',
      'Review application accuracy',
      'Assess tracking effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-6.1.4',
    name: 'Planning Action',
    description: 'Plan actions to address significant aspects, compliance obligations, and risks and opportunities identified, and integrate actions into EMS processes.',
    category: 'Planning',
    implementationGuidance: 'Develop action plans for significant aspects. Address compliance requirements. Mitigate environmental risks. Integrate with operational processes.',
    evidenceRequirements: [
      'Action planning documentation',
      'Compliance action records',
      'Risk mitigation plans',
      'Integration documentation'
    ],
    testProcedures: [
      'Review action plan completeness',
      'Test compliance action adequacy',
      'Verify risk mitigation effectiveness',
      'Assess integration quality'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-6.2',
    name: 'Environmental Objectives and Planning',
    description: 'Establish environmental objectives at relevant functions and levels, consistent with policy, measurable, monitored, communicated, and updated as appropriate.',
    category: 'Planning',
    implementationGuidance: 'Set SMART environmental objectives. Align with policy commitments. Plan achievement actions. Monitor progress toward objectives.',
    evidenceRequirements: [
      'Environmental objective documentation',
      'Policy alignment records',
      'Achievement planning records',
      'Progress monitoring documentation'
    ],
    testProcedures: [
      'Verify objective measurability',
      'Test policy alignment',
      'Review achievement planning',
      'Assess monitoring effectiveness'
    ],
    status: 'Not Started'
  },

  // ===== Clause 7: Support =====
  {
    controlId: 'ISO14001-7.1',
    name: 'Resources',
    description: 'Determine and provide resources needed for establishment, implementation, maintenance and continual improvement of the EMS.',
    category: 'Support',
    implementationGuidance: 'Assess EMS resource requirements. Provide human, financial, and technical resources. Allocate budget for environmental activities. Maintain resource availability.',
    evidenceRequirements: [
      'Resource requirement assessments',
      'Resource provision records',
      'Budget allocation documentation',
      'Availability records'
    ],
    testProcedures: [
      'Verify resource assessment',
      'Test provision adequacy',
      'Review budget allocation',
      'Assess availability'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-7.2',
    name: 'Competence',
    description: 'Determine necessary competence of persons doing work affecting environmental performance and EMS effectiveness, ensure competence, and take actions to acquire competence.',
    category: 'Support',
    implementationGuidance: 'Define environmental competence requirements. Assess personnel competence. Provide environmental training. Maintain competence records.',
    evidenceRequirements: [
      'Competence requirement definitions',
      'Assessment records',
      'Training documentation',
      'Competence records'
    ],
    testProcedures: [
      'Review competence definitions',
      'Verify assessment process',
      'Test training effectiveness',
      'Assess record accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-7.3',
    name: 'Awareness',
    description: 'Persons doing work under organization\'s control shall be aware of environmental policy, significant aspects, their contribution to EMS effectiveness, and implications of nonconformity.',
    category: 'Support',
    implementationGuidance: 'Communicate environmental policy. Explain significant aspects to relevant personnel. Clarify individual contributions. Describe nonconformity implications.',
    evidenceRequirements: [
      'Awareness communication records',
      'Aspect communication documentation',
      'Contribution explanation records',
      'Implication awareness records'
    ],
    testProcedures: [
      'Test policy awareness',
      'Verify aspect understanding',
      'Review contribution awareness',
      'Assess implication understanding'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-7.4',
    name: 'Communication',
    description: 'Establish, implement and maintain processes for internal and external communications relevant to the EMS including what, when, with whom, and how to communicate.',
    category: 'Support',
    implementationGuidance: 'Define communication requirements. Establish internal communication channels. Implement external communication processes. Respond to relevant communications.',
    evidenceRequirements: [
      'Communication requirement documentation',
      'Internal communication records',
      'External communication records',
      'Response documentation'
    ],
    testProcedures: [
      'Review requirement completeness',
      'Test internal communication',
      'Verify external communication',
      'Assess response timeliness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-7.5',
    name: 'Documented Information',
    description: 'The EMS shall include documented information required by ISO 14001 and determined by organization as necessary for EMS effectiveness.',
    category: 'Support',
    implementationGuidance: 'Define documentation requirements. Create and maintain required documents. Implement document control. Ensure document availability.',
    evidenceRequirements: [
      'Documentation requirements',
      'Document inventory',
      'Control procedure records',
      'Availability verification'
    ],
    testProcedures: [
      'Verify documentation completeness',
      'Test document control',
      'Review document availability',
      'Assess update process'
    ],
    status: 'Not Started'
  },

  // ===== Clause 8: Operation =====
  {
    controlId: 'ISO14001-8.1',
    name: 'Operational Planning and Control',
    description: 'Plan, implement, control and maintain processes needed to meet EMS requirements and implement actions to address significant aspects and compliance obligations.',
    category: 'Operation',
    implementationGuidance: 'Define operational controls for significant aspects. Establish process criteria. Control outsourced processes. Manage life cycle environmental impacts.',
    evidenceRequirements: [
      'Operational control documentation',
      'Process criteria specifications',
      'Outsourced process controls',
      'Life cycle management records'
    ],
    testProcedures: [
      'Verify control effectiveness',
      'Test criteria appropriateness',
      'Review outsourced controls',
      'Assess life cycle management'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-8.2',
    name: 'Emergency Preparedness and Response',
    description: 'Establish, implement and maintain processes needed to prepare for and respond to potential emergency situations with environmental impact.',
    category: 'Operation',
    implementationGuidance: 'Identify potential environmental emergencies. Develop response procedures. Conduct emergency drills. Review and improve after incidents.',
    evidenceRequirements: [
      'Emergency identification records',
      'Response procedure documentation',
      'Drill records',
      'Post-incident review records'
    ],
    testProcedures: [
      'Verify emergency identification',
      'Test response procedures',
      'Review drill effectiveness',
      'Assess improvement actions'
    ],
    status: 'Not Started'
  },

  // ===== Clause 9: Performance Evaluation =====
  {
    controlId: 'ISO14001-9.1.1',
    name: 'Monitoring, Measurement, Analysis and Evaluation',
    description: 'Determine what needs to be monitored and measured, methods, criteria for evaluation, when to perform activities, and when to analyze and evaluate results.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Define monitoring requirements for significant aspects. Establish measurement methods. Calibrate equipment as needed. Analyze environmental performance.',
    evidenceRequirements: [
      'Monitoring requirement documentation',
      'Measurement method specifications',
      'Calibration records',
      'Analysis and evaluation records'
    ],
    testProcedures: [
      'Verify monitoring coverage',
      'Test measurement accuracy',
      'Review calibration compliance',
      'Assess analysis quality'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-9.1.2',
    name: 'Evaluation of Compliance',
    description: 'Establish, implement and maintain processes to evaluate fulfillment of compliance obligations, and maintain knowledge of compliance status.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Plan compliance evaluation activities. Conduct systematic evaluations. Document compliance status. Address nonconformities promptly.',
    evidenceRequirements: [
      'Evaluation planning documentation',
      'Evaluation execution records',
      'Compliance status documentation',
      'Nonconformity response records'
    ],
    testProcedures: [
      'Review evaluation planning',
      'Test evaluation execution',
      'Verify status documentation',
      'Assess nonconformity response'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-9.2',
    name: 'Internal Audit',
    description: 'Conduct internal audits at planned intervals to provide information on whether EMS conforms to requirements and is effectively implemented and maintained.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Plan audit program considering environmental importance. Define audit criteria and scope. Select objective auditors. Report results and take action.',
    evidenceRequirements: [
      'Audit program documentation',
      'Audit criteria and scope',
      'Auditor qualification records',
      'Audit reports and actions'
    ],
    testProcedures: [
      'Review program adequacy',
      'Verify criteria appropriateness',
      'Test auditor competence',
      'Assess corrective actions'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-9.3',
    name: 'Management Review',
    description: 'Top management shall review the EMS at planned intervals to ensure its continuing suitability, adequacy and effectiveness.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Schedule management reviews. Include required inputs. Generate output decisions. Document review proceedings.',
    evidenceRequirements: [
      'Review schedule documentation',
      'Input documentation',
      'Output decisions',
      'Review records'
    ],
    testProcedures: [
      'Verify review frequency',
      'Test input completeness',
      'Review output appropriateness',
      'Assess documentation accuracy'
    ],
    status: 'Not Started'
  },

  // ===== Clause 10: Improvement =====
  {
    controlId: 'ISO14001-10.1',
    name: 'General Improvement',
    description: 'Determine opportunities for improvement and implement necessary actions to achieve intended outcomes of the EMS.',
    category: 'Improvement',
    implementationGuidance: 'Identify improvement opportunities. Prioritize environmental improvements. Implement improvement actions. Evaluate improvement effectiveness.',
    evidenceRequirements: [
      'Opportunity identification records',
      'Prioritization documentation',
      'Implementation records',
      'Effectiveness evaluation'
    ],
    testProcedures: [
      'Review opportunity identification',
      'Verify prioritization process',
      'Test implementation',
      'Assess effectiveness evaluation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-10.2',
    name: 'Nonconformity and Corrective Action',
    description: 'When nonconformity occurs, react to control and correct it, evaluate need for action to eliminate causes, implement action needed, review effectiveness, and make changes to EMS if necessary.',
    category: 'Improvement',
    implementationGuidance: 'Define nonconformity response procedures. Conduct root cause analysis. Implement corrective actions. Verify effectiveness.',
    evidenceRequirements: [
      'Response procedure documentation',
      'Root cause analysis records',
      'Corrective action records',
      'Effectiveness verification'
    ],
    testProcedures: [
      'Test response procedures',
      'Review root cause analysis',
      'Verify corrective actions',
      'Assess effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO14001-10.3',
    name: 'Continual Improvement',
    description: 'Continually improve suitability, adequacy and effectiveness of the EMS to enhance environmental performance.',
    category: 'Improvement',
    implementationGuidance: 'Establish continual improvement culture. Track environmental performance trends. Use improvement opportunities systematically. Communicate improvements.',
    evidenceRequirements: [
      'Improvement initiative records',
      'Performance trend analysis',
      'Systematic improvement documentation',
      'Communication records'
    ],
    testProcedures: [
      'Verify improvement culture',
      'Test trend analysis',
      'Review improvement documentation',
      'Assess communication effectiveness'
    ],
    status: 'Not Started'
  }
];
