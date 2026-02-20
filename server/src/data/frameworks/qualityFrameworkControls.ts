import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Quality & Process Framework Controls
 * ITIL, CMMI
 */

export const ITIL_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'ITIL-SVS-1',
    name: 'Service Value System',
    description: 'Implement ITIL Service Value System.',
    category: 'Value System',
    implementationGuidance: 'Define guiding principles. Implement governance. Build service value chain. Enable continual improvement.',
    evidenceRequirements: ['Guiding principles', 'Governance framework', 'Value chain documentation', 'Improvement processes'],
    testProcedures: ['Review principles', 'Verify governance', 'Check value chain', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-GP-1',
    name: 'Guiding Principles',
    description: 'Apply ITIL guiding principles.',
    category: 'Governance',
    implementationGuidance: 'Focus on value. Start where you are. Progress iteratively. Collaborate. Think holistically.',
    evidenceRequirements: ['Value focus evidence', 'Current state documentation', 'Iteration records', 'Collaboration records'],
    testProcedures: ['Review value focus', 'Verify current state', 'Check iteration', 'Assess collaboration'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-SVC-1',
    name: 'Service Value Chain',
    description: 'Implement service value chain activities.',
    category: 'Value Chain',
    implementationGuidance: 'Plan services. Improve continuously. Engage stakeholders. Design and transition. Obtain and build. Deliver and support.',
    evidenceRequirements: ['Service planning', 'Improvement records', 'Engagement records', 'Transition records'],
    testProcedures: ['Review planning', 'Verify improvement', 'Check engagement', 'Assess transition'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-IM-1',
    name: 'Incident Management',
    description: 'Implement incident management practice.',
    category: 'Service Management',
    implementationGuidance: 'Define incident process. Detect incidents. Respond and resolve. Document and learn.',
    evidenceRequirements: ['Incident process', 'Detection capability', 'Response records', 'Incident documentation'],
    testProcedures: ['Review process', 'Test detection', 'Verify response', 'Check documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-PM-1',
    name: 'Problem Management',
    description: 'Implement problem management practice.',
    category: 'Service Management',
    implementationGuidance: 'Identify problems. Analyze root causes. Implement solutions. Prevent recurrence.',
    evidenceRequirements: ['Problem identification', 'Root cause analysis', 'Solution implementation', 'Prevention measures'],
    testProcedures: ['Review identification', 'Verify analysis', 'Check solutions', 'Assess prevention'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-CM-1',
    name: 'Change Enablement',
    description: 'Implement change enablement practice.',
    category: 'Service Management',
    implementationGuidance: 'Define change types. Assess changes. Authorize changes. Implement and review.',
    evidenceRequirements: ['Change types', 'Change assessment', 'Authorization records', 'Implementation reviews'],
    testProcedures: ['Review types', 'Verify assessment', 'Check authorization', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-SRM-1',
    name: 'Service Request Management',
    description: 'Implement service request management practice.',
    category: 'Service Management',
    implementationGuidance: 'Define request catalog. Receive requests. Fulfill requests. Track satisfaction.',
    evidenceRequirements: ['Request catalog', 'Request records', 'Fulfillment records', 'Satisfaction tracking'],
    testProcedures: ['Review catalog', 'Verify requests', 'Check fulfillment', 'Assess satisfaction'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-SLM-1',
    name: 'Service Level Management',
    description: 'Implement service level management practice.',
    category: 'Service Management',
    implementationGuidance: 'Define service levels. Monitor performance. Report on levels. Improve services.',
    evidenceRequirements: ['Service level agreements', 'Performance monitoring', 'Level reports', 'Improvement actions'],
    testProcedures: ['Review SLAs', 'Verify monitoring', 'Check reports', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-CONF-1',
    name: 'Service Configuration Management',
    description: 'Implement service configuration management practice.',
    category: 'Service Management',
    implementationGuidance: 'Identify CIs. Record and relate. Verify accuracy. Control changes.',
    evidenceRequirements: ['CI identification', 'CMDB records', 'Verification records', 'Change control'],
    testProcedures: ['Review CIs', 'Verify CMDB', 'Check accuracy', 'Assess control'],
    status: 'Not Started'
  },
  {
    controlId: 'ITIL-CI-1',
    name: 'Continual Improvement',
    description: 'Implement continual improvement practice.',
    category: 'Improvement',
    implementationGuidance: 'Identify opportunities. Plan improvements. Implement changes. Evaluate results.',
    evidenceRequirements: ['Opportunity identification', 'Improvement plans', 'Change implementation', 'Result evaluation'],
    testProcedures: ['Review opportunities', 'Verify plans', 'Check implementation', 'Assess results'],
    status: 'Not Started'
  }
];

export const CMMI_CONTROLS: FrameworkControlTemplate[] = [
  {
    controlId: 'CMMI-CAR',
    name: 'Causal Analysis and Resolution',
    description: 'Identify causes of outcomes and take action to improve process performance.',
    category: 'Supporting',
    implementationGuidance: 'Select outcomes. Analyze causes. Implement actions. Evaluate effectiveness.',
    evidenceRequirements: ['Outcome selection', 'Cause analysis', 'Action implementation', 'Effectiveness evaluation'],
    testProcedures: ['Review selection', 'Verify analysis', 'Check actions', 'Assess effectiveness'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-CM',
    name: 'Configuration Management',
    description: 'Establish and maintain integrity of work products.',
    category: 'Supporting',
    implementationGuidance: 'Identify configuration items. Establish baselines. Control changes. Maintain integrity.',
    evidenceRequirements: ['Item identification', 'Baseline establishment', 'Change control', 'Integrity records'],
    testProcedures: ['Review items', 'Verify baselines', 'Check control', 'Assess integrity'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-DAR',
    name: 'Decision Analysis and Resolution',
    description: 'Analyze possible decisions using formal evaluation process.',
    category: 'Supporting',
    implementationGuidance: 'Establish guidelines. Evaluate alternatives. Select solutions. Document decisions.',
    evidenceRequirements: ['Decision guidelines', 'Alternative evaluation', 'Solution selection', 'Decision documentation'],
    testProcedures: ['Review guidelines', 'Verify evaluation', 'Check selection', 'Assess documentation'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-GOV',
    name: 'Governance',
    description: 'Establish and maintain governance for the organization.',
    category: 'Managing',
    implementationGuidance: 'Define governance structure. Assign responsibilities. Monitor effectiveness. Improve governance.',
    evidenceRequirements: ['Governance structure', 'Responsibility assignment', 'Effectiveness monitoring', 'Governance improvement'],
    testProcedures: ['Review structure', 'Verify responsibilities', 'Check monitoring', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-II',
    name: 'Implementation Infrastructure',
    description: 'Establish and maintain infrastructure for process implementation.',
    category: 'Managing',
    implementationGuidance: 'Plan infrastructure. Implement infrastructure. Support usage. Improve infrastructure.',
    evidenceRequirements: ['Infrastructure plan', 'Implementation records', 'Support records', 'Improvement records'],
    testProcedures: ['Review plan', 'Verify implementation', 'Check support', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-MPM',
    name: 'Managing Performance and Measurement',
    description: 'Manage organizational performance using measurement.',
    category: 'Managing',
    implementationGuidance: 'Define measures. Collect data. Analyze performance. Take action.',
    evidenceRequirements: ['Measure definitions', 'Data collection', 'Performance analysis', 'Action records'],
    testProcedures: ['Review measures', 'Verify collection', 'Check analysis', 'Assess actions'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-OT',
    name: 'Organizational Training',
    description: 'Develop skills and knowledge of people.',
    category: 'Enabling',
    implementationGuidance: 'Identify training needs. Provide training. Evaluate effectiveness. Maintain records.',
    evidenceRequirements: ['Training needs', 'Training provision', 'Effectiveness evaluation', 'Training records'],
    testProcedures: ['Review needs', 'Verify provision', 'Check effectiveness', 'Assess records'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-PAD',
    name: 'Process Asset Development',
    description: 'Develop and maintain process assets.',
    category: 'Enabling',
    implementationGuidance: 'Identify needs. Develop assets. Deploy assets. Maintain assets.',
    evidenceRequirements: ['Need identification', 'Asset development', 'Asset deployment', 'Asset maintenance'],
    testProcedures: ['Review needs', 'Verify development', 'Check deployment', 'Assess maintenance'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-PCM',
    name: 'Process Management',
    description: 'Plan, implement, and deploy organizational processes.',
    category: 'Enabling',
    implementationGuidance: 'Plan processes. Implement processes. Deploy processes. Improve processes.',
    evidenceRequirements: ['Process planning', 'Implementation records', 'Deployment records', 'Improvement records'],
    testProcedures: ['Review planning', 'Verify implementation', 'Check deployment', 'Assess improvement'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-PI',
    name: 'Product Integration',
    description: 'Assemble product from product components.',
    category: 'Engineering',
    implementationGuidance: 'Plan integration. Prepare environment. Integrate components. Verify product.',
    evidenceRequirements: ['Integration plan', 'Environment preparation', 'Component integration', 'Product verification'],
    testProcedures: ['Review plan', 'Verify environment', 'Check integration', 'Assess verification'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-PLAN',
    name: 'Planning',
    description: 'Establish and maintain plans for performing work.',
    category: 'Doing',
    implementationGuidance: 'Develop estimates. Develop plan. Obtain commitment. Review plan.',
    evidenceRequirements: ['Estimates', 'Project plan', 'Commitment records', 'Plan reviews'],
    testProcedures: ['Review estimates', 'Verify plan', 'Check commitment', 'Assess reviews'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-MC',
    name: 'Monitor and Control',
    description: 'Monitor work and take corrective action.',
    category: 'Doing',
    implementationGuidance: 'Monitor work. Identify issues. Take corrective action. Manage changes.',
    evidenceRequirements: ['Work monitoring', 'Issue identification', 'Corrective actions', 'Change management'],
    testProcedures: ['Review monitoring', 'Verify issues', 'Check actions', 'Assess changes'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-PR',
    name: 'Peer Reviews',
    description: 'Conduct peer reviews of selected work products.',
    category: 'Doing',
    implementationGuidance: 'Plan reviews. Prepare for reviews. Conduct reviews. Resolve issues.',
    evidenceRequirements: ['Review plans', 'Preparation records', 'Review records', 'Issue resolution'],
    testProcedures: ['Review plans', 'Verify preparation', 'Check reviews', 'Assess resolution'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-RDM',
    name: 'Requirements Development and Management',
    description: 'Develop and manage requirements.',
    category: 'Engineering',
    implementationGuidance: 'Elicit requirements. Develop requirements. Analyze requirements. Manage requirements.',
    evidenceRequirements: ['Requirements elicitation', 'Requirement development', 'Requirement analysis', 'Requirement management'],
    testProcedures: ['Review elicitation', 'Verify development', 'Check analysis', 'Assess management'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-RSK',
    name: 'Risk and Opportunity Management',
    description: 'Identify and manage risks and opportunities.',
    category: 'Doing',
    implementationGuidance: 'Identify risks. Analyze risks. Mitigate risks. Monitor risks.',
    evidenceRequirements: ['Risk identification', 'Risk analysis', 'Risk mitigation', 'Risk monitoring'],
    testProcedures: ['Review identification', 'Verify analysis', 'Check mitigation', 'Assess monitoring'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-SAM',
    name: 'Supplier Agreement Management',
    description: 'Manage acquisition of products and services from suppliers.',
    category: 'Enabling',
    implementationGuidance: 'Select suppliers. Establish agreements. Execute agreements. Close agreements.',
    evidenceRequirements: ['Supplier selection', 'Agreement establishment', 'Execution records', 'Closure records'],
    testProcedures: ['Review selection', 'Verify agreements', 'Check execution', 'Assess closure'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-TS',
    name: 'Technical Solution',
    description: 'Design and build solutions to requirements.',
    category: 'Engineering',
    implementationGuidance: 'Select solutions. Design solutions. Implement designs. Verify solutions.',
    evidenceRequirements: ['Solution selection', 'Design documentation', 'Implementation records', 'Solution verification'],
    testProcedures: ['Review selection', 'Verify design', 'Check implementation', 'Assess verification'],
    status: 'Not Started'
  },
  {
    controlId: 'CMMI-VV',
    name: 'Verification and Validation',
    description: 'Verify and validate work products.',
    category: 'Engineering',
    implementationGuidance: 'Prepare for verification. Perform verification. Prepare for validation. Perform validation.',
    evidenceRequirements: ['Verification preparation', 'Verification records', 'Validation preparation', 'Validation records'],
    testProcedures: ['Review preparation', 'Verify verification', 'Check validation prep', 'Assess validation'],
    status: 'Not Started'
  }
];
