import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Corporate Sustainability Reporting Directive (CSRD) - Directive (EU) 2022/2464
 * ESG reporting and sustainability disclosure requirements
 */
export const CSRD_CONTROLS: FrameworkControlTemplate[] = [
  // ===== ESRS 1: General Requirements =====
  {
    controlId: 'CSRD-1.1',
    name: 'Double Materiality Assessment',
    description: 'Organizations must conduct double materiality assessment identifying sustainability matters that are material from both impact perspective (effects on people and environment) and financial perspective (effects on company value).',
    category: 'General Requirements',
    implementationGuidance: 'Establish materiality assessment methodology covering impact and financial materiality. Engage stakeholders in materiality determination. Document assessment process and outcomes. Review materiality annually.',
    evidenceRequirements: [
      'Double materiality assessment methodology',
      'Stakeholder engagement records',
      'Materiality assessment results documentation',
      'Annual review records'
    ],
    testProcedures: [
      'Review materiality methodology comprehensiveness',
      'Verify stakeholder engagement adequacy',
      'Assess materiality determination process',
      'Test annual review completion'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-1.2',
    name: 'Sustainability Reporting Boundary',
    description: 'Define reporting boundary consistent with financial reporting, including value chain impacts where material. Apply appropriate consolidation approaches for sustainability information.',
    category: 'General Requirements',
    implementationGuidance: 'Align sustainability boundary with financial consolidation. Identify material value chain entities. Document boundary determination rationale. Apply consistent boundary across reporting periods.',
    evidenceRequirements: [
      'Reporting boundary documentation',
      'Value chain materiality assessment',
      'Consolidation methodology documentation',
      'Boundary consistency verification'
    ],
    testProcedures: [
      'Verify boundary alignment with financial reporting',
      'Review value chain materiality assessment',
      'Test consolidation methodology application',
      'Assess boundary consistency over time'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-1.3',
    name: 'ESRS Standards Application',
    description: 'Apply European Sustainability Reporting Standards (ESRS) to prepare sustainability statements, including cross-cutting and topical standards as applicable based on materiality.',
    category: 'General Requirements',
    implementationGuidance: 'Map material topics to applicable ESRS standards. Implement data collection for ESRS requirements. Apply ESRS disclosure requirements systematically. Document ESRS application decisions.',
    evidenceRequirements: [
      'ESRS applicability mapping',
      'Data collection procedures for each standard',
      'ESRS disclosure documentation',
      'Application decision records'
    ],
    testProcedures: [
      'Review ESRS mapping completeness',
      'Test data collection coverage',
      'Verify disclosure requirement compliance',
      'Assess application decision appropriateness'
    ],
    status: 'Not Started'
  },

  // ===== ESRS 2: General Disclosures =====
  {
    controlId: 'CSRD-2.1',
    name: 'Governance of Sustainability Matters',
    description: 'Disclose governance structure for sustainability matters including board oversight, management roles, and integration of sustainability into incentive schemes.',
    category: 'Governance',
    implementationGuidance: 'Document board sustainability oversight structure. Define management sustainability responsibilities. Integrate sustainability into executive compensation. Establish sustainability governance reporting.',
    evidenceRequirements: [
      'Board sustainability oversight documentation',
      'Management role definitions',
      'Compensation policy with sustainability elements',
      'Governance reporting records'
    ],
    testProcedures: [
      'Review board oversight structure adequacy',
      'Verify management responsibility clarity',
      'Assess compensation integration effectiveness',
      'Test governance reporting accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-2.2',
    name: 'Strategy and Business Model',
    description: 'Disclose how sustainability matters relate to strategy and business model, including sustainability-related targets, progress, and resource allocation.',
    category: 'Strategy',
    implementationGuidance: 'Integrate sustainability into strategic planning. Set measurable sustainability targets. Track progress against targets. Allocate resources for sustainability initiatives.',
    evidenceRequirements: [
      'Strategic sustainability integration documentation',
      'Sustainability targets and KPIs',
      'Progress tracking reports',
      'Resource allocation records'
    ],
    testProcedures: [
      'Review strategic integration adequacy',
      'Verify target measurability and appropriateness',
      'Test progress tracking accuracy',
      'Assess resource allocation effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-2.3',
    name: 'Impact, Risk and Opportunity Management',
    description: 'Disclose processes for identifying, assessing, and managing sustainability-related impacts, risks, and opportunities, and integration with overall risk management.',
    category: 'Risk Management',
    implementationGuidance: 'Establish sustainability risk identification process. Integrate sustainability into enterprise risk management. Assess financial implications of sustainability risks. Document risk mitigation measures.',
    evidenceRequirements: [
      'Sustainability risk identification procedures',
      'ERM integration documentation',
      'Financial impact assessments',
      'Risk mitigation documentation'
    ],
    testProcedures: [
      'Test risk identification process effectiveness',
      'Verify ERM integration adequacy',
      'Review financial impact assessment accuracy',
      'Assess mitigation measure appropriateness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-2.4',
    name: 'Metrics and Targets',
    description: 'Disclose metrics used to assess sustainability matters, progress against targets, and methodology for metric calculation.',
    category: 'Metrics and Targets',
    implementationGuidance: 'Define sustainability metrics aligned with ESRS. Establish baseline measurements. Implement metric tracking systems. Report progress against targets transparently.',
    evidenceRequirements: [
      'Sustainability metrics definitions',
      'Baseline measurement documentation',
      'Metric tracking system records',
      'Progress reporting documentation'
    ],
    testProcedures: [
      'Review metric definitions for ESRS alignment',
      'Verify baseline measurement accuracy',
      'Test tracking system reliability',
      'Assess progress reporting transparency'
    ],
    status: 'Not Started'
  },

  // ===== ESRS E1: Climate Change =====
  {
    controlId: 'CSRD-3.1',
    name: 'GHG Emissions Reporting',
    description: 'Report Scope 1, Scope 2, and material Scope 3 greenhouse gas emissions in accordance with GHG Protocol methodology.',
    category: 'Climate Change',
    implementationGuidance: 'Implement GHG emission data collection across all scopes. Apply GHG Protocol calculation methodologies. Verify emission calculations. Report emissions with comparative data.',
    evidenceRequirements: [
      'GHG emission data collection procedures',
      'Calculation methodology documentation',
      'Emission verification records',
      'Comparative emission reports'
    ],
    testProcedures: [
      'Test data collection completeness',
      'Verify calculation methodology accuracy',
      'Review verification process adequacy',
      'Assess comparative reporting accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-3.2',
    name: 'Climate Transition Plan',
    description: 'Disclose transition plan for achieving climate neutrality, including emission reduction targets, decarbonization levers, and financial planning for transition.',
    category: 'Climate Change',
    implementationGuidance: 'Develop Paris-aligned transition plan. Set science-based emission reduction targets. Identify decarbonization actions and timeline. Quantify transition investment requirements.',
    evidenceRequirements: [
      'Climate transition plan document',
      'Science-based targets documentation',
      'Decarbonization action roadmap',
      'Transition investment planning'
    ],
    testProcedures: [
      'Review transition plan Paris alignment',
      'Verify target scientific basis',
      'Assess decarbonization action feasibility',
      'Test investment planning adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-3.3',
    name: 'Climate Risk and Opportunity Assessment',
    description: 'Assess and disclose physical and transition risks from climate change and related opportunities, including financial quantification.',
    category: 'Climate Change',
    implementationGuidance: 'Conduct climate scenario analysis. Identify physical and transition risks. Assess financial implications of climate risks. Identify climate-related opportunities.',
    evidenceRequirements: [
      'Climate scenario analysis documentation',
      'Risk identification and assessment records',
      'Financial impact quantification',
      'Opportunity identification documentation'
    ],
    testProcedures: [
      'Review scenario analysis methodology',
      'Verify risk identification completeness',
      'Test financial quantification accuracy',
      'Assess opportunity identification process'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-3.4',
    name: 'Energy Consumption and Mix',
    description: 'Report total energy consumption and energy mix including renewable energy share. Disclose energy efficiency measures and targets.',
    category: 'Climate Change',
    implementationGuidance: 'Track energy consumption by source. Calculate renewable energy percentage. Implement energy efficiency initiatives. Set energy reduction targets.',
    evidenceRequirements: [
      'Energy consumption tracking records',
      'Renewable energy calculations',
      'Energy efficiency initiative documentation',
      'Energy reduction targets and progress'
    ],
    testProcedures: [
      'Verify energy tracking completeness',
      'Test renewable calculation accuracy',
      'Review efficiency initiative effectiveness',
      'Assess target progress tracking'
    ],
    status: 'Not Started'
  },

  // ===== ESRS E2-E5: Environmental Standards =====
  {
    controlId: 'CSRD-4.1',
    name: 'Pollution Prevention and Control',
    description: 'Disclose pollutant emissions to air, water, and soil, including substances of concern. Report pollution prevention and control measures.',
    category: 'Pollution',
    implementationGuidance: 'Monitor and track pollutant emissions. Identify substances of concern in products and processes. Implement pollution prevention measures. Report emission reduction progress.',
    evidenceRequirements: [
      'Pollutant emission monitoring records',
      'Substances of concern inventory',
      'Pollution prevention measures documentation',
      'Emission reduction progress reports'
    ],
    testProcedures: [
      'Test emission monitoring accuracy',
      'Verify substances inventory completeness',
      'Review prevention measure effectiveness',
      'Assess progress reporting accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-4.2',
    name: 'Water and Marine Resources',
    description: 'Report water consumption, withdrawal, and discharge. Disclose impacts on water-stressed areas and marine ecosystems.',
    category: 'Water and Marine Resources',
    implementationGuidance: 'Implement water usage tracking. Identify operations in water-stressed areas. Assess marine ecosystem impacts. Develop water stewardship programs.',
    evidenceRequirements: [
      'Water usage tracking records',
      'Water stress area identification',
      'Marine impact assessments',
      'Water stewardship program documentation'
    ],
    testProcedures: [
      'Verify water tracking completeness',
      'Test water stress identification accuracy',
      'Review marine impact assessment adequacy',
      'Assess stewardship program effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-4.3',
    name: 'Biodiversity and Ecosystems',
    description: 'Disclose impacts on biodiversity and ecosystems, including operations in sensitive areas. Report biodiversity protection and restoration measures.',
    category: 'Biodiversity',
    implementationGuidance: 'Assess biodiversity impacts of operations. Identify sensitive area operations. Implement biodiversity protection measures. Track ecosystem restoration activities.',
    evidenceRequirements: [
      'Biodiversity impact assessments',
      'Sensitive area operations identification',
      'Protection measure documentation',
      'Restoration activity records'
    ],
    testProcedures: [
      'Review impact assessment methodology',
      'Verify sensitive area identification',
      'Test protection measure effectiveness',
      'Assess restoration activity progress'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-4.4',
    name: 'Circular Economy',
    description: 'Report on circular economy strategies including resource efficiency, waste generation, and recycling rates. Disclose product design for circularity.',
    category: 'Circular Economy',
    implementationGuidance: 'Implement circular economy strategies. Track material inputs and waste outputs. Measure recycling and recovery rates. Design products for end-of-life recovery.',
    evidenceRequirements: [
      'Circular economy strategy documentation',
      'Material flow tracking records',
      'Recycling rate calculations',
      'Product design documentation'
    ],
    testProcedures: [
      'Review circular economy strategy implementation',
      'Verify material flow tracking accuracy',
      'Test recycling rate calculation methodology',
      'Assess product design considerations'
    ],
    status: 'Not Started'
  },

  // ===== ESRS S1-S4: Social Standards =====
  {
    controlId: 'CSRD-5.1',
    name: 'Own Workforce',
    description: 'Disclose information about own workforce including working conditions, equal treatment, training and development, and health and safety.',
    category: 'Social - Own Workforce',
    implementationGuidance: 'Track workforce demographics and diversity metrics. Monitor working conditions compliance. Report health and safety performance. Document training and development programs.',
    evidenceRequirements: [
      'Workforce demographics data',
      'Working conditions monitoring records',
      'Health and safety statistics',
      'Training program documentation'
    ],
    testProcedures: [
      'Verify demographic data accuracy',
      'Test working conditions monitoring',
      'Review health and safety reporting',
      'Assess training program effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-5.2',
    name: 'Workers in Value Chain',
    description: 'Report on working conditions and human rights for workers in the value chain. Disclose due diligence processes and remediation measures.',
    category: 'Social - Value Chain Workers',
    implementationGuidance: 'Map value chain worker locations and conditions. Implement human rights due diligence. Monitor supplier labor practices. Establish remediation mechanisms.',
    evidenceRequirements: [
      'Value chain worker mapping',
      'Human rights due diligence records',
      'Supplier monitoring documentation',
      'Remediation mechanism documentation'
    ],
    testProcedures: [
      'Review value chain mapping completeness',
      'Test due diligence process effectiveness',
      'Verify supplier monitoring adequacy',
      'Assess remediation mechanism functionality'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-5.3',
    name: 'Affected Communities',
    description: 'Disclose impacts on communities affected by operations, including indigenous peoples and local communities. Report stakeholder engagement processes.',
    category: 'Social - Affected Communities',
    implementationGuidance: 'Identify affected communities and potential impacts. Implement community engagement processes. Assess indigenous peoples impacts. Document community benefit programs.',
    evidenceRequirements: [
      'Community impact assessments',
      'Engagement process documentation',
      'Indigenous peoples impact assessment',
      'Community benefit program records'
    ],
    testProcedures: [
      'Review impact assessment methodology',
      'Test engagement process effectiveness',
      'Verify indigenous impact consideration',
      'Assess community benefit delivery'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-5.4',
    name: 'Consumers and End-Users',
    description: 'Report on product safety, responsible marketing, privacy protection, and accessibility for consumers and end-users.',
    category: 'Social - Consumers',
    implementationGuidance: 'Ensure product safety compliance. Implement responsible marketing practices. Protect consumer privacy. Design for accessibility.',
    evidenceRequirements: [
      'Product safety compliance records',
      'Marketing practice guidelines',
      'Privacy protection documentation',
      'Accessibility implementation records'
    ],
    testProcedures: [
      'Test product safety compliance',
      'Review marketing practice adherence',
      'Verify privacy protection effectiveness',
      'Assess accessibility implementation'
    ],
    status: 'Not Started'
  },

  // ===== ESRS G1: Governance =====
  {
    controlId: 'CSRD-6.1',
    name: 'Business Conduct',
    description: 'Disclose business conduct policies including anti-corruption, whistleblowing, and political engagement. Report on business ethics training and incidents.',
    category: 'Governance',
    implementationGuidance: 'Implement comprehensive business conduct policies. Establish whistleblowing mechanisms. Track ethics training completion. Report business conduct incidents.',
    evidenceRequirements: [
      'Business conduct policies',
      'Whistleblowing mechanism documentation',
      'Ethics training records',
      'Incident reporting and resolution records'
    ],
    testProcedures: [
      'Review policy comprehensiveness',
      'Test whistleblowing mechanism effectiveness',
      'Verify training completion rates',
      'Assess incident resolution adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-6.2',
    name: 'Supplier Payment Practices',
    description: 'Disclose supplier payment practices including average payment terms, late payment rates, and payment term changes.',
    category: 'Governance',
    implementationGuidance: 'Track supplier payment metrics. Monitor payment term compliance. Report payment practice statistics. Implement fair payment policies.',
    evidenceRequirements: [
      'Payment tracking records',
      'Payment term documentation',
      'Payment practice statistics',
      'Fair payment policy documentation'
    ],
    testProcedures: [
      'Verify payment tracking accuracy',
      'Test payment term compliance',
      'Review payment statistics accuracy',
      'Assess fair payment policy implementation'
    ],
    status: 'Not Started'
  },

  // ===== Assurance and Reporting =====
  {
    controlId: 'CSRD-7.1',
    name: 'Limited Assurance Engagement',
    description: 'Sustainability reporting must be subject to limited assurance by an independent auditor or assurance provider.',
    category: 'Assurance',
    implementationGuidance: 'Engage qualified assurance provider. Prepare documentation for assurance engagement. Support assurance procedures. Address assurance findings.',
    evidenceRequirements: [
      'Assurance provider engagement documentation',
      'Supporting documentation for assurance',
      'Assurance procedures and testing records',
      'Assurance finding remediation records'
    ],
    testProcedures: [
      'Verify assurance provider qualifications',
      'Review supporting documentation adequacy',
      'Assess assurance procedure coverage',
      'Test finding remediation completion'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-7.2',
    name: 'Digital Tagging',
    description: 'Sustainability reporting must be tagged using XBRL taxonomy for machine-readable reporting as part of the European Single Electronic Format (ESEF).',
    category: 'Reporting Format',
    implementationGuidance: 'Implement XBRL tagging capability. Map disclosures to ESRS taxonomy. Validate tagging accuracy. Generate ESEF-compliant reports.',
    evidenceRequirements: [
      'XBRL implementation documentation',
      'Taxonomy mapping records',
      'Tagging validation records',
      'ESEF-compliant report outputs'
    ],
    testProcedures: [
      'Test XBRL tagging functionality',
      'Verify taxonomy mapping accuracy',
      'Review validation process effectiveness',
      'Assess ESEF compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'CSRD-7.3',
    name: 'Management Report Integration',
    description: 'Sustainability statement must be included in a dedicated section of the management report, not as separate standalone reporting.',
    category: 'Reporting Format',
    implementationGuidance: 'Structure management report with sustainability section. Ensure connectivity between financial and sustainability reporting. Apply consistent formatting. Obtain board approval for combined report.',
    evidenceRequirements: [
      'Management report structure documentation',
      'Connectivity analysis documentation',
      'Formatting guidelines',
      'Board approval records'
    ],
    testProcedures: [
      'Review management report structure compliance',
      'Test connectivity between report sections',
      'Verify formatting consistency',
      'Confirm board approval completion'
    ],
    status: 'Not Started'
  }
];
