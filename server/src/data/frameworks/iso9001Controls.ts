import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO 9001:2015 - Quality Management System
 * Requirements for quality management systems
 */
export const ISO9001_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 4: Context of the Organization =====
  {
    controlId: 'ISO9001-4.1',
    name: 'Understanding the Organization and its Context',
    description: 'The organization shall determine external and internal issues relevant to its purpose and strategic direction that affect its ability to achieve intended results of the quality management system.',
    category: 'Context of the Organization',
    implementationGuidance: 'Conduct internal and external environment analysis (SWOT, PESTLE). Identify factors affecting QMS performance. Document context analysis and review periodically. Integrate context into strategic planning.',
    evidenceRequirements: [
      'Context analysis documentation (SWOT, PESTLE)',
      'Internal and external issue identification',
      'Strategic planning integration records',
      'Periodic review documentation'
    ],
    testProcedures: [
      'Review context analysis comprehensiveness',
      'Verify issue identification accuracy',
      'Test strategic planning integration',
      'Assess review frequency adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-4.2',
    name: 'Understanding Needs and Expectations of Interested Parties',
    description: 'The organization shall determine interested parties relevant to the QMS and their requirements that affect ability to provide conforming products and services.',
    category: 'Context of the Organization',
    implementationGuidance: 'Identify all relevant interested parties. Document their requirements and expectations. Monitor changes in stakeholder needs. Incorporate requirements into QMS.',
    evidenceRequirements: [
      'Interested party identification',
      'Requirements documentation',
      'Stakeholder monitoring records',
      'QMS requirement integration'
    ],
    testProcedures: [
      'Verify interested party completeness',
      'Review requirement documentation accuracy',
      'Test monitoring process effectiveness',
      'Assess requirement integration'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-4.3',
    name: 'QMS Scope Determination',
    description: 'The organization shall determine boundaries and applicability of the QMS to establish its scope, considering external/internal issues, interested party requirements, and products/services.',
    category: 'Context of the Organization',
    implementationGuidance: 'Define QMS boundaries clearly. Document included processes and locations. Justify any exclusions per ISO 9001 requirements. Maintain documented scope information.',
    evidenceRequirements: [
      'QMS scope documentation',
      'Process and location inclusion records',
      'Exclusion justification documentation',
      'Scope maintenance records'
    ],
    testProcedures: [
      'Review scope definition clarity',
      'Verify inclusion completeness',
      'Assess exclusion justification validity',
      'Test scope documentation accessibility'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-4.4',
    name: 'QMS Process Approach',
    description: 'The organization shall establish, implement, maintain and continually improve a QMS including needed processes and their interactions, applying a process approach with risk-based thinking.',
    category: 'Context of the Organization',
    implementationGuidance: 'Identify all QMS processes. Map process inputs, outputs, and interactions. Define process criteria and measures. Apply risk-based thinking to process management.',
    evidenceRequirements: [
      'Process inventory documentation',
      'Process interaction maps',
      'Process criteria and measures',
      'Risk-based thinking documentation'
    ],
    testProcedures: [
      'Verify process identification completeness',
      'Test interaction map accuracy',
      'Review criteria and measure adequacy',
      'Assess risk consideration integration'
    ],
    status: 'Not Started'
  },

  // ===== Clause 5: Leadership =====
  {
    controlId: 'ISO9001-5.1',
    name: 'Leadership and Commitment',
    description: 'Top management shall demonstrate leadership and commitment to the QMS by taking accountability, establishing policy and objectives, integrating QMS into business processes, and promoting improvement.',
    category: 'Leadership',
    implementationGuidance: 'Establish clear management accountability. Integrate QMS into strategic direction. Ensure resource availability. Communicate importance of quality management.',
    evidenceRequirements: [
      'Management accountability documentation',
      'Strategic integration records',
      'Resource provision records',
      'Communication records'
    ],
    testProcedures: [
      'Verify management engagement',
      'Test strategic integration',
      'Assess resource adequacy',
      'Review communication effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-5.2',
    name: 'Quality Policy',
    description: 'Top management shall establish, implement and maintain a quality policy that is appropriate, provides framework for objectives, includes commitment to satisfy requirements and continual improvement.',
    category: 'Leadership',
    implementationGuidance: 'Develop quality policy aligned with organizational purpose. Ensure policy provides framework for objectives. Communicate policy throughout organization. Review and update as needed.',
    evidenceRequirements: [
      'Quality policy document',
      'Objective framework documentation',
      'Communication records',
      'Review and update records'
    ],
    testProcedures: [
      'Review policy appropriateness',
      'Verify objective framework alignment',
      'Test communication effectiveness',
      'Assess review process adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-5.3',
    name: 'Organizational Roles, Responsibilities and Authorities',
    description: 'Top management shall ensure responsibilities and authorities for relevant roles are assigned, communicated and understood within the organization.',
    category: 'Leadership',
    implementationGuidance: 'Define QMS roles and responsibilities. Assign clear authorities for quality functions. Communicate role assignments. Ensure personnel understand responsibilities.',
    evidenceRequirements: [
      'Role and responsibility documentation',
      'Authority assignment records',
      'Communication records',
      'Understanding verification records'
    ],
    testProcedures: [
      'Verify role definition clarity',
      'Test authority assignment appropriateness',
      'Assess communication completeness',
      'Review understanding verification'
    ],
    status: 'Not Started'
  },

  // ===== Clause 6: Planning =====
  {
    controlId: 'ISO9001-6.1',
    name: 'Actions to Address Risks and Opportunities',
    description: 'When planning for the QMS, the organization shall consider context and interested parties, determine risks and opportunities that need to be addressed to achieve intended results and prevent undesired effects.',
    category: 'Planning',
    implementationGuidance: 'Conduct risk and opportunity assessment. Plan actions to address identified risks/opportunities. Integrate actions into QMS processes. Evaluate effectiveness of actions.',
    evidenceRequirements: [
      'Risk and opportunity assessment',
      'Action planning documentation',
      'QMS integration records',
      'Effectiveness evaluation records'
    ],
    testProcedures: [
      'Review assessment comprehensiveness',
      'Verify action planning adequacy',
      'Test QMS integration',
      'Assess effectiveness evaluation'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-6.2',
    name: 'Quality Objectives and Planning',
    description: 'The organization shall establish quality objectives at relevant functions, levels and processes needed for the QMS. Objectives shall be consistent with policy, measurable, and consider applicable requirements.',
    category: 'Planning',
    implementationGuidance: 'Establish SMART quality objectives. Align objectives with quality policy. Define achievement plans with resources, responsibilities, timeframes. Monitor and communicate progress.',
    evidenceRequirements: [
      'Quality objective documentation',
      'Policy alignment records',
      'Achievement plans',
      'Progress monitoring records'
    ],
    testProcedures: [
      'Verify objective SMART criteria',
      'Test policy alignment',
      'Review achievement plan adequacy',
      'Assess monitoring effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-6.3',
    name: 'Planning of Changes',
    description: 'When the organization determines need for changes to the QMS, changes shall be carried out in a planned manner considering purpose, consequences, integrity, and resource availability.',
    category: 'Planning',
    implementationGuidance: 'Establish change management process. Assess change impacts before implementation. Maintain QMS integrity during changes. Document change planning and execution.',
    evidenceRequirements: [
      'Change management procedures',
      'Impact assessment records',
      'Integrity maintenance documentation',
      'Change execution records'
    ],
    testProcedures: [
      'Review change management process',
      'Verify impact assessment thoroughness',
      'Test integrity maintenance',
      'Assess documentation completeness'
    ],
    status: 'Not Started'
  },

  // ===== Clause 7: Support =====
  {
    controlId: 'ISO9001-7.1',
    name: 'Resources',
    description: 'The organization shall determine and provide resources needed for establishment, implementation, maintenance and continual improvement of the QMS.',
    category: 'Support',
    implementationGuidance: 'Assess resource requirements for QMS. Provide necessary human, infrastructure, and environment resources. Ensure monitoring and measuring resources. Maintain organizational knowledge.',
    evidenceRequirements: [
      'Resource requirement assessments',
      'Resource provision records',
      'Monitoring resource calibration records',
      'Knowledge management documentation'
    ],
    testProcedures: [
      'Verify resource assessment adequacy',
      'Test resource availability',
      'Review calibration compliance',
      'Assess knowledge management'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-7.2',
    name: 'Competence',
    description: 'The organization shall determine necessary competence of persons doing work affecting quality performance, ensure persons are competent, and take actions to acquire competence as needed.',
    category: 'Support',
    implementationGuidance: 'Define competence requirements for roles. Assess personnel competence. Provide training and development. Maintain competence records.',
    evidenceRequirements: [
      'Competence requirement definitions',
      'Competence assessment records',
      'Training and development records',
      'Competence verification documentation'
    ],
    testProcedures: [
      'Review competence definitions',
      'Verify assessment process',
      'Test training effectiveness',
      'Assess documentation accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-7.3',
    name: 'Awareness',
    description: 'Persons doing work under organization\'s control shall be aware of quality policy, relevant objectives, their contribution to QMS effectiveness, and implications of not conforming.',
    category: 'Support',
    implementationGuidance: 'Communicate quality policy and objectives. Explain individual contributions to quality. Clarify nonconformity implications. Verify awareness through various means.',
    evidenceRequirements: [
      'Awareness communication records',
      'Policy and objective distribution',
      'Contribution explanation documentation',
      'Awareness verification records'
    ],
    testProcedures: [
      'Test awareness levels',
      'Verify communication reach',
      'Review contribution understanding',
      'Assess nonconformity understanding'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-7.4',
    name: 'Communication',
    description: 'The organization shall determine internal and external communications relevant to the QMS including what, when, with whom, how, and who communicates.',
    category: 'Support',
    implementationGuidance: 'Define communication requirements. Establish internal and external communication channels. Document communication responsibilities. Monitor communication effectiveness.',
    evidenceRequirements: [
      'Communication requirements documentation',
      'Channel establishment records',
      'Responsibility assignments',
      'Effectiveness monitoring records'
    ],
    testProcedures: [
      'Review requirement completeness',
      'Test channel functionality',
      'Verify responsibility clarity',
      'Assess monitoring adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-7.5',
    name: 'Documented Information',
    description: 'The QMS shall include documented information required by ISO 9001 and determined by organization as necessary for QMS effectiveness. Creation, updating, and control must be appropriate.',
    category: 'Support',
    implementationGuidance: 'Define documentation requirements. Create and maintain required documents. Implement document control procedures. Ensure documentation availability and protection.',
    evidenceRequirements: [
      'Documentation inventory',
      'Document creation and approval records',
      'Control procedure documentation',
      'Access and protection records'
    ],
    testProcedures: [
      'Verify documentation completeness',
      'Test creation and approval process',
      'Review control procedure effectiveness',
      'Assess access and protection adequacy'
    ],
    status: 'Not Started'
  },

  // ===== Clause 8: Operation =====
  {
    controlId: 'ISO9001-8.1',
    name: 'Operational Planning and Control',
    description: 'The organization shall plan, implement and control processes needed to meet requirements for provision of products and services through establishing process criteria, controlling processes, and maintaining documented information.',
    category: 'Operation',
    implementationGuidance: 'Plan operational processes systematically. Establish clear process criteria. Implement process controls. Maintain operation documentation.',
    evidenceRequirements: [
      'Operational planning documentation',
      'Process criteria specifications',
      'Control implementation records',
      'Operation documentation'
    ],
    testProcedures: [
      'Review planning completeness',
      'Verify criteria appropriateness',
      'Test control effectiveness',
      'Assess documentation adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-8.2',
    name: 'Requirements for Products and Services',
    description: 'The organization shall communicate with customers, determine requirements for products and services, review ability to meet requirements, and control changes to requirements.',
    category: 'Operation',
    implementationGuidance: 'Establish customer communication processes. Define product/service requirements clearly. Review requirements before commitment. Manage requirement changes.',
    evidenceRequirements: [
      'Customer communication records',
      'Requirement documentation',
      'Requirement review records',
      'Change management records'
    ],
    testProcedures: [
      'Test communication process',
      'Verify requirement clarity',
      'Review requirement review process',
      'Assess change management'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-8.3',
    name: 'Design and Development',
    description: 'The organization shall establish, implement and maintain design and development process appropriate to ensure subsequent provision of products and services.',
    category: 'Operation',
    implementationGuidance: 'Plan design and development stages. Define inputs and controls. Conduct reviews, verification, and validation. Control design changes.',
    evidenceRequirements: [
      'Design planning documentation',
      'Input and output specifications',
      'Review, verification, and validation records',
      'Change control records'
    ],
    testProcedures: [
      'Review planning adequacy',
      'Verify input/output documentation',
      'Test review/verification/validation process',
      'Assess change control effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-8.4',
    name: 'Control of Externally Provided Processes, Products and Services',
    description: 'The organization shall ensure externally provided processes, products and services conform to requirements through appropriate controls and communication with external providers.',
    category: 'Operation',
    implementationGuidance: 'Define external provider criteria. Evaluate and select providers. Apply appropriate controls based on risk. Communicate requirements to providers.',
    evidenceRequirements: [
      'Provider criteria documentation',
      'Evaluation and selection records',
      'Control application records',
      'Communication records'
    ],
    testProcedures: [
      'Review criteria appropriateness',
      'Verify evaluation process',
      'Test control effectiveness',
      'Assess communication adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-8.5',
    name: 'Production and Service Provision',
    description: 'The organization shall implement production and service provision under controlled conditions including information, resources, monitoring, infrastructure, competent personnel, and validation.',
    category: 'Operation',
    implementationGuidance: 'Define controlled condition requirements. Implement monitoring and measurement. Manage identification and traceability. Control customer/external provider property.',
    evidenceRequirements: [
      'Controlled condition documentation',
      'Monitoring and measurement records',
      'Identification and traceability records',
      'Property control records'
    ],
    testProcedures: [
      'Verify controlled conditions',
      'Test monitoring accuracy',
      'Review traceability system',
      'Assess property control'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-8.6',
    name: 'Release of Products and Services',
    description: 'The organization shall implement planned arrangements at appropriate stages to verify that product and service requirements have been met before release.',
    category: 'Operation',
    implementationGuidance: 'Define release criteria and verification. Conduct release verification activities. Document verification results. Control release authority.',
    evidenceRequirements: [
      'Release criteria documentation',
      'Verification activity records',
      'Result documentation',
      'Release authority records'
    ],
    testProcedures: [
      'Review criteria adequacy',
      'Verify activity completion',
      'Test documentation accuracy',
      'Assess authority control'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-8.7',
    name: 'Control of Nonconforming Outputs',
    description: 'The organization shall ensure outputs that do not conform to requirements are identified and controlled to prevent unintended use or delivery.',
    category: 'Operation',
    implementationGuidance: 'Establish nonconformity identification process. Implement control and disposition procedures. Document nonconformities and actions. Verify corrective effectiveness.',
    evidenceRequirements: [
      'Identification process documentation',
      'Control and disposition records',
      'Nonconformity documentation',
      'Corrective action verification'
    ],
    testProcedures: [
      'Test identification process',
      'Review control effectiveness',
      'Verify documentation completeness',
      'Assess corrective verification'
    ],
    status: 'Not Started'
  },

  // ===== Clause 9: Performance Evaluation =====
  {
    controlId: 'ISO9001-9.1',
    name: 'Monitoring, Measurement, Analysis and Evaluation',
    description: 'The organization shall determine what needs to be monitored and measured, methods for analysis and evaluation, when to perform activities, and when to analyze results.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Define monitoring and measurement requirements. Establish analysis and evaluation methods. Schedule activities appropriately. Use results for improvement.',
    evidenceRequirements: [
      'Monitoring requirement documentation',
      'Method specifications',
      'Activity scheduling records',
      'Analysis and evaluation results'
    ],
    testProcedures: [
      'Verify requirement completeness',
      'Test method appropriateness',
      'Review scheduling adequacy',
      'Assess result utilization'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-9.2',
    name: 'Internal Audit',
    description: 'The organization shall conduct internal audits at planned intervals to provide information on whether the QMS conforms to requirements and is effectively implemented and maintained.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Plan audit program considering process importance. Define audit criteria and scope. Select objective auditors. Report results and take corrective actions.',
    evidenceRequirements: [
      'Audit program documentation',
      'Audit criteria and scope definitions',
      'Auditor qualification records',
      'Audit reports and corrective actions'
    ],
    testProcedures: [
      'Review program adequacy',
      'Verify criteria appropriateness',
      'Test auditor objectivity',
      'Assess corrective action effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-9.3',
    name: 'Management Review',
    description: 'Top management shall review the QMS at planned intervals to ensure its continuing suitability, adequacy, effectiveness and alignment with strategic direction.',
    category: 'Performance Evaluation',
    implementationGuidance: 'Schedule management reviews at planned intervals. Include required review inputs. Generate decisions and action outputs. Document review proceedings.',
    evidenceRequirements: [
      'Review schedule and planning',
      'Review input documentation',
      'Review output decisions',
      'Meeting minutes and records'
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
    controlId: 'ISO9001-10.1',
    name: 'General Improvement',
    description: 'The organization shall determine and select opportunities for improvement and implement necessary actions to meet customer requirements and enhance satisfaction.',
    category: 'Improvement',
    implementationGuidance: 'Identify improvement opportunities systematically. Prioritize and select improvements. Implement improvement actions. Evaluate improvement effectiveness.',
    evidenceRequirements: [
      'Opportunity identification records',
      'Selection and prioritization documentation',
      'Implementation records',
      'Effectiveness evaluation records'
    ],
    testProcedures: [
      'Review identification process',
      'Verify selection criteria',
      'Test implementation completeness',
      'Assess effectiveness measurement'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-10.2',
    name: 'Nonconformity and Corrective Action',
    description: 'When nonconformity occurs, the organization shall react, evaluate need for action, implement action needed, review effectiveness, and update risks and opportunities if necessary.',
    category: 'Improvement',
    implementationGuidance: 'Define nonconformity response procedures. Conduct root cause analysis. Implement corrective actions. Verify action effectiveness.',
    evidenceRequirements: [
      'Response procedure documentation',
      'Root cause analysis records',
      'Corrective action implementation',
      'Effectiveness verification records'
    ],
    testProcedures: [
      'Test response procedures',
      'Review root cause analysis quality',
      'Verify action implementation',
      'Assess effectiveness verification'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ISO9001-10.3',
    name: 'Continual Improvement',
    description: 'The organization shall continually improve suitability, adequacy and effectiveness of the QMS, considering analysis results, management review outputs, and need for changes.',
    category: 'Improvement',
    implementationGuidance: 'Establish continual improvement culture. Use data and analysis for improvement. Incorporate management review findings. Track and trend improvement metrics.',
    evidenceRequirements: [
      'Improvement initiative documentation',
      'Data analysis for improvement',
      'Management review integration',
      'Improvement metric tracking'
    ],
    testProcedures: [
      'Verify improvement culture evidence',
      'Test data utilization',
      'Review management review integration',
      'Assess metric tracking effectiveness'
    ],
    status: 'Not Started'
  }
];
