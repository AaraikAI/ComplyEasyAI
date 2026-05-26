import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO/IEC 23894:2023 - Information technology — Artificial intelligence — Guidance on risk management
 *
 * Provides guidance for organizations developing, providing, or using AI products,
 * systems, or services on managing risk specifically related to AI. Acts as a companion
 * to ISO/IEC 42001 by translating the generic ISO 31000 risk management principles
 * to the AI domain.
 *
 * Structure:
 *   Clause 4: Principles - Foundational AI risk management principles
 *   Clause 5: Framework - Establishment and integration of AI risk framework
 *   Clause 6: Processes - Communication, scope, assessment, treatment, monitoring, recording
 *   Annex A: Objectives and risk sources specific to AI systems
 *   Annex B: Mapping of AI risk management to AI system lifecycle
 *   Annex C: Application of risk management to specific AI domains
 */
export const ISO_23894_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 4: Principles =====
  {
    controlId: '4.1',
    name: 'Integrated AI risk management',
    description: 'Risk management for AI systems shall be an integral part of all organizational activities and not treated as a separate or optional function carried out in isolation from the AI lifecycle.',
    category: 'Principles',
    implementationGuidance: 'Embed AI risk management into product roadmaps, model registries, MLOps pipelines, and architecture review boards. Configure CI/CD gates that block model deployment without a completed risk register entry. Designate AI risk owners in every product squad. Tie risk management deliverables to AI project funding gates.',
    evidenceRequirements: ['MLOps pipeline configuration showing risk-gate hooks', 'AI project funding approval templates with risk sign-off', 'Squad-level risk owner roster', 'Architecture review board minutes referencing AI risks'],
    testProcedures: ['Inspect CI/CD pipeline definitions for risk-register gate jobs', 'Sample three AI projects and verify embedded risk activities', 'Verify risk owners are named in each AI squad charter'],
    status: 'Not Started'
  },
  {
    controlId: '4.2',
    name: 'Structured and comprehensive approach',
    description: 'AI risk management shall follow a structured, systematic, and comprehensive approach that consistently identifies and addresses risks across all AI system components, data, models, and operational environments.',
    category: 'Principles',
    implementationGuidance: 'Adopt a documented AI risk taxonomy covering data, model, system, governance, and societal layers. Apply a standardized risk template across all AI projects. Maintain a single source of truth in a risk register database. Cross-reference the taxonomy in technical design reviews.',
    evidenceRequirements: ['Documented AI risk taxonomy', 'Standardized AI risk register schema', 'AI risk register entries showing taxonomy fields', 'Design review checklists referencing the taxonomy'],
    testProcedures: ['Inspect the taxonomy for completeness across data, model, system, governance, societal layers', 'Query the register and verify entries populate all taxonomy fields', 'Verify design review checklists enforce taxonomy usage'],
    status: 'Not Started'
  },
  {
    controlId: '4.3',
    name: 'Customized AI risk management',
    description: 'The risk management framework and process shall be customized and proportionate to the organization\'s external and internal context, AI system criticality, and risk profile.',
    category: 'Principles',
    implementationGuidance: 'Tier AI systems by impact level (high, medium, low) using documented criteria such as autonomy, scale, sensitivity, and reversibility. Apply graduated risk procedures per tier. Document tier assignment rationale for each AI system. Re-tier on significant change.',
    evidenceRequirements: ['AI system tiering criteria document', 'AI system tier assignment records', 'Tier-specific risk procedure variants', 'Re-tiering trigger log'],
    testProcedures: ['Inspect tiering criteria for objectivity', 'Verify each AI system has a documented tier assignment with rationale', 'Sample one system from each tier and confirm appropriate procedure applied'],
    status: 'Not Started'
  },
  {
    controlId: '4.4',
    name: 'Inclusive AI risk management',
    description: 'AI risk management shall be inclusive, with appropriate and timely involvement of stakeholders to enable their knowledge, views, and perceptions to be considered.',
    category: 'Principles',
    implementationGuidance: 'Define stakeholder engagement procedures for each AI risk activity. Maintain a stakeholder map identifying internal staff, customers, affected individuals, regulators, and civil society. Capture stakeholder input via structured channels (workshops, surveys, advisory boards). Document how input influenced risk decisions.',
    evidenceRequirements: ['Stakeholder map for each AI system', 'Engagement plans and meeting records', 'Stakeholder input logs', 'Decision rationale referencing stakeholder input'],
    testProcedures: ['Inspect stakeholder maps for completeness', 'Sample risk decisions and verify stakeholder input traceability', 'Confirm engagement frequency matches plan'],
    status: 'Not Started'
  },
  {
    controlId: '4.5',
    name: 'Dynamic AI risk management',
    description: 'AI risks can emerge, change, or disappear as external and internal context evolves; risk management shall anticipate, detect, acknowledge, and respond to such changes in a timely manner.',
    category: 'Principles',
    implementationGuidance: 'Implement continuous monitoring for drift in data, models, threats, and regulations. Configure alerts triggering risk reassessment. Schedule quarterly emerging-risk reviews. Track horizon-scanning sources (regulators, research, incident databases).',
    evidenceRequirements: ['Monitoring dashboards covering data/model/regulatory drift', 'Emerging risk review minutes', 'Horizon-scan source list', 'Reassessment trigger and outcome log'],
    testProcedures: ['Inspect monitoring coverage for all four drift dimensions', 'Verify quarterly emerging-risk reviews are conducted', 'Sample reassessment triggers and confirm risk register updates'],
    status: 'Not Started'
  },
  {
    controlId: '4.6',
    name: 'Best available information',
    description: 'Inputs to AI risk management shall be based on the best available information, supplemented by stakeholder input, while accounting for limitations, uncertainties, and assumptions.',
    category: 'Principles',
    implementationGuidance: 'Require risk assessors to cite data sources, model evaluations, and external research. Document assumptions and uncertainty bounds in every risk entry. Maintain a curated knowledge base of AI risk intelligence. Refresh assessments when new information emerges.',
    evidenceRequirements: ['Risk register entries with cited sources', 'Documented assumption and uncertainty fields', 'Curated AI risk intelligence knowledge base', 'Refresh log when new evidence arrives'],
    testProcedures: ['Sample register entries and verify source citations', 'Inspect assumption fields for completeness', 'Verify knowledge base contributors and refresh cadence'],
    status: 'Not Started'
  },
  {
    controlId: '4.7',
    name: 'Human and cultural factors',
    description: 'AI risk management shall recognize that human and cultural factors significantly influence all aspects of AI risk at each level and stage of the AI system lifecycle.',
    category: 'Principles',
    implementationGuidance: 'Conduct training on cognitive bias and over-reliance for risk assessors. Embed diverse perspectives in assessment teams. Evaluate human-AI interaction risks (automation bias, deskilling, complacency). Document cultural assumptions in risk analyses.',
    evidenceRequirements: ['Cognitive-bias training records for risk assessors', 'Team diversity composition for assessments', 'Human-AI interaction risk evaluations', 'Cultural assumption documentation'],
    testProcedures: ['Inspect training rosters', 'Verify assessment team composition records', 'Sample assessments and confirm human factor considerations'],
    status: 'Not Started'
  },
  {
    controlId: '4.8',
    name: 'Continual improvement of AI risk management',
    description: 'AI risk management shall be continually improved through learning from experience, monitoring, evaluations, and emerging knowledge.',
    category: 'Principles',
    implementationGuidance: 'Capture lessons learned from AI incidents and near-misses. Conduct annual maturity assessments of AI risk processes. Track improvement actions in a register. Benchmark practices against industry frameworks.',
    evidenceRequirements: ['Lessons-learned database', 'Annual AI risk maturity assessment reports', 'Improvement action register', 'Benchmarking results'],
    testProcedures: ['Inspect lessons-learned entries for closure status', 'Verify maturity assessments conducted annually', 'Sample improvement actions for completion evidence'],
    status: 'Not Started'
  },

  // ===== Clause 5: Framework =====
  {
    controlId: '5.2',
    name: 'Leadership and commitment for AI risk management',
    description: 'Top management shall demonstrate leadership and commitment by establishing AI risk management within the governance framework, ensuring policy alignment and resource adequacy.',
    category: 'Framework',
    implementationGuidance: 'Issue a top-management AI risk statement. Include AI risk topics in board agendas at least semi-annually. Allocate dedicated headcount and budget. Tie executive performance metrics to AI risk outcomes.',
    evidenceRequirements: ['Signed top-management AI risk statement', 'Board agenda items covering AI risk', 'Headcount and budget allocation records', 'Executive scorecards including AI risk KPIs'],
    testProcedures: ['Inspect risk statement signature and currency', 'Verify board minutes show AI risk coverage', 'Confirm allocated budget tracked against actuals'],
    status: 'Not Started'
  },
  {
    controlId: '5.3',
    name: 'Integration of AI risk management',
    description: 'The organization shall integrate AI risk management into the AI system lifecycle and broader enterprise risk management framework, ensuring consistency and avoiding silos.',
    category: 'Framework',
    implementationGuidance: 'Map AI risk categories into the enterprise risk register taxonomy. Coordinate AI risk reporting with ERM cycles. Share methodologies with ERM, privacy, and security teams. Establish escalation paths from AI risk to ERM committees.',
    evidenceRequirements: ['ERM-to-AI risk taxonomy mapping', 'Aligned reporting calendar', 'Cross-functional methodology documents', 'Escalation procedure to ERM committees'],
    testProcedures: ['Inspect taxonomy mapping coverage', 'Verify joint reporting cadence', 'Sample escalations and confirm correct routing'],
    status: 'Not Started'
  },
  {
    controlId: '5.4.2',
    name: 'Understanding context for AI risk framework',
    description: 'The organization shall analyze and understand its external and internal context relevant to the AI risk management framework, including regulatory, technological, societal, and competitive factors.',
    category: 'Framework',
    implementationGuidance: 'Conduct AI-specific PESTLE analyses. Track applicable AI regulations across jurisdictions. Identify competitive and societal trends. Refresh context analysis annually and on major regulatory change.',
    evidenceRequirements: ['AI-specific PESTLE analysis', 'Regulatory tracking register', 'Competitive and societal trend reports', 'Annual refresh records'],
    testProcedures: ['Inspect PESTLE analysis for AI-specific factors', 'Verify regulatory register currency', 'Confirm refresh evidence'],
    status: 'Not Started'
  },
  {
    controlId: '5.4.3',
    name: 'Articulating AI risk management commitment',
    description: 'The organization shall articulate its commitment to AI risk management through a documented policy or statement endorsed by the governing body.',
    category: 'Framework',
    implementationGuidance: 'Publish an AI risk management policy referencing principles, scope, accountability, and review cadence. Obtain governing-body endorsement. Distribute to all employees and contractors handling AI. Translate for non-English-speaking staff.',
    evidenceRequirements: ['Endorsed AI risk management policy', 'Governing-body approval minutes', 'Distribution records', 'Translation evidence where required'],
    testProcedures: ['Inspect policy content and approval signature', 'Verify distribution coverage', 'Sample employees for policy awareness'],
    status: 'Not Started'
  },
  {
    controlId: '5.4.4',
    name: 'Assigning AI risk roles, authorities, responsibilities, and accountabilities',
    description: 'The organization shall assign appropriate authority, responsibility, and accountability for AI risk management at all levels of the organization, with sufficient resources and competencies.',
    category: 'Framework',
    implementationGuidance: 'Maintain a RACI matrix for AI risk activities. Define role-specific competency requirements. Track training completion per role. Document segregation between risk identification, treatment, and assurance.',
    evidenceRequirements: ['AI risk RACI matrix', 'Role-competency profiles', 'Training completion records', 'Segregation-of-duties documentation'],
    testProcedures: ['Inspect RACI for coverage of all framework activities', 'Sample role-holders and verify competency evidence', 'Confirm SoD between identification, treatment, assurance'],
    status: 'Not Started'
  },
  {
    controlId: '5.4.5',
    name: 'Allocating resources for AI risk management',
    description: 'The organization shall allocate appropriate resources for AI risk management, including human capabilities, organizational processes, methods, tools, and information systems.',
    category: 'Framework',
    implementationGuidance: 'Maintain an AI risk resource plan covering tooling (GRC platform, model registry, monitoring), specialist headcount, training budget, and external advisory services. Review plan against actuals quarterly. Document gaps and remediation.',
    evidenceRequirements: ['AI risk resource plan', 'Quarterly variance reports', 'Gap and remediation register', 'Procurement records for risk tooling'],
    testProcedures: ['Inspect resource plan completeness', 'Verify quarterly review evidence', 'Sample gaps and confirm remediation status'],
    status: 'Not Started'
  },
  {
    controlId: '5.5',
    name: 'Evaluation and improvement of the AI risk framework',
    description: 'The organization shall periodically measure the framework\'s performance against its purpose, implementation plans, indicators, and expected behaviour, and adapt the framework accordingly.',
    category: 'Framework',
    implementationGuidance: 'Define framework KPIs (e.g., percent of AI systems assessed, time to treat high risks, incident reopen rate). Report KPIs to top management. Conduct framework reviews after material incidents. Update framework via change-controlled procedure.',
    evidenceRequirements: ['Framework KPI dashboard', 'Management reports', 'Framework review minutes', 'Framework change history'],
    testProcedures: ['Inspect KPI definitions and current values', 'Verify management reporting cadence', 'Sample framework changes for change-control evidence'],
    status: 'Not Started'
  },

  // ===== Clause 6: Process - Communication and Consultation =====
  {
    controlId: '6.2',
    name: 'AI risk communication and consultation',
    description: 'The organization shall establish a process for communication and consultation with internal and external stakeholders throughout all stages of AI risk management.',
    category: 'Process - Communication',
    implementationGuidance: 'Develop a communication plan specifying audiences, frequency, channels, and content for AI risk topics. Establish two-way consultation mechanisms (advisory boards, customer panels). Coordinate with legal and public affairs on external messaging. Log all communications.',
    evidenceRequirements: ['AI risk communication plan', 'Communication logs', 'Consultation mechanism records', 'Coordination evidence with legal/PR'],
    testProcedures: ['Inspect plan against stakeholder map coverage', 'Sample communications for adherence to plan', 'Verify consultation outputs influenced risk decisions'],
    status: 'Not Started'
  },

  // ===== Clause 6: Process - Scope, Context, Criteria =====
  {
    controlId: '6.3.2',
    name: 'Defining scope of AI risk activities',
    description: 'The scope of AI risk management activities shall be defined for each AI system or family of systems, considering objectives, boundaries, and the lifecycle stages covered.',
    category: 'Process - Scope, Context, Criteria',
    implementationGuidance: 'Document scope per AI system: included data sources, model components, deployment environments, user populations, and lifecycle phases. Capture exclusions with justification. Review scope on significant change.',
    evidenceRequirements: ['Per-system scope documents', 'Exclusion justifications', 'Scope change history', 'Boundary diagrams'],
    testProcedures: ['Inspect scope documents for required elements', 'Sample exclusions for justification adequacy', 'Verify scope updates after material changes'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.3',
    name: 'Establishing external and internal context for AI systems',
    description: 'The external and internal context relevant to each AI system shall be defined, including objectives, stakeholders, regulatory environment, and organizational constraints.',
    category: 'Process - Scope, Context, Criteria',
    implementationGuidance: 'For each AI system document business objectives, target users, regulatory regime, available skills, technical constraints, and data ecosystem. Refresh context when business or regulation changes. Link to AI system register.',
    evidenceRequirements: ['Per-system context documents', 'AI system register linkage', 'Context refresh log', 'Stakeholder maps per system'],
    testProcedures: ['Inspect context documents for completeness', 'Verify linkage to system register', 'Sample updates against regulatory changes'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.4',
    name: 'Defining AI risk criteria',
    description: 'The organization shall define criteria for evaluating the significance of AI risks, including risk acceptance criteria aligned with strategic objectives and stakeholder expectations.',
    category: 'Process - Scope, Context, Criteria',
    implementationGuidance: 'Publish risk matrices covering likelihood and consequence scales tailored to AI (e.g., safety harm, discrimination, autonomy loss). Define acceptance thresholds per system tier. Require executive sign-off when accepting high or extreme risks.',
    evidenceRequirements: ['AI risk matrix definitions', 'Acceptance threshold table per tier', 'Executive sign-off records for high risks', 'Criteria review history'],
    testProcedures: ['Inspect risk matrices for AI-specific consequences', 'Verify thresholds applied consistently in register', 'Sample accepted high risks for executive approval'],
    status: 'Not Started'
  },

  // ===== Clause 6: Process - Risk Assessment =====
  {
    controlId: '6.4.2',
    name: 'AI risk identification',
    description: 'The organization shall identify AI-specific risks including risks arising from data, models, deployment environments, intended and unintended uses, and interaction with humans and other systems.',
    category: 'Process - Risk Assessment',
    implementationGuidance: 'Apply structured techniques such as failure mode and effects analysis, red-teaming, bias audits, and adversarial testing. Reference Annex A risk sources. Capture results in the risk register with cross-links to evidence.',
    evidenceRequirements: ['Risk identification methodology', 'FMEA, red-team, and bias-audit reports', 'Risk register entries with Annex A linkage', 'Evidence cross-references'],
    testProcedures: ['Inspect methodology coverage', 'Sample three systems for identification artifacts', 'Verify Annex A categories represented in the register'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.3',
    name: 'AI risk analysis',
    description: 'Identified AI risks shall be analyzed to understand their nature, sources, consequences, likelihood, and interdependencies, using quantitative and qualitative techniques as appropriate.',
    category: 'Process - Risk Assessment',
    implementationGuidance: 'Use probability and consequence scoring per the risk matrix. Document model assumptions and uncertainty. Apply scenario analysis for emergent behaviour. Capture dependency graphs between risks.',
    evidenceRequirements: ['Risk analysis records with scores', 'Assumption and uncertainty notes', 'Scenario analysis worksheets', 'Risk dependency diagrams'],
    testProcedures: ['Inspect analysis records for scoring rationale', 'Sample scenario analyses for plausibility', 'Verify dependency diagrams maintained'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.4',
    name: 'AI risk evaluation',
    description: 'The organization shall evaluate analyzed AI risks against established criteria to determine which risks require treatment and prioritize them accordingly.',
    category: 'Process - Risk Assessment',
    implementationGuidance: 'Plot risks on the matrix and apply acceptance criteria. Prioritize treatment by severity, stakeholder impact, and treatment feasibility. Record evaluation outcomes and rationale. Communicate priorities to delivery teams.',
    evidenceRequirements: ['Risk evaluation reports', 'Prioritized treatment backlog', 'Evaluation rationale records', 'Delivery team communications'],
    testProcedures: ['Sample risks and confirm matrix placement and rationale', 'Verify backlog priorities track evaluation outcomes', 'Confirm team-level communication evidence'],
    status: 'Not Started'
  },

  // ===== Clause 6: Process - Risk Treatment =====
  {
    controlId: '6.5.2',
    name: 'Selection of AI risk treatment options',
    description: 'The organization shall select appropriate AI risk treatment options balancing benefits against costs, while considering the AI-specific options including model changes, data interventions, human oversight, and use restrictions.',
    category: 'Process - Risk Treatment',
    implementationGuidance: 'Maintain a catalogue of AI risk treatment options (avoid use, restrict scope, retrain with curated data, add guardrails, add human review, transfer via contract, accept). Evaluate options with cost-benefit and residual-risk analysis. Document selection rationale.',
    evidenceRequirements: ['AI treatment option catalogue', 'Cost-benefit analyses', 'Residual-risk evaluations', 'Selection rationale records'],
    testProcedures: ['Inspect catalogue completeness', 'Sample treatments for cost-benefit evidence', 'Verify residual risk recorded for selected options'],
    status: 'Not Started'
  },
  {
    controlId: '6.5.3',
    name: 'Preparing and implementing AI risk treatment plans',
    description: 'The organization shall prepare and implement risk treatment plans specifying actions, responsibilities, resources, timelines, performance measures, and approval signatures.',
    category: 'Process - Risk Treatment',
    implementationGuidance: 'Use a standard treatment plan template capturing required elements. Track implementation in project management tooling. Verify completion via independent review. Report status to the AI governance committee.',
    evidenceRequirements: ['Treatment plan template', 'Active treatment plans with status', 'Independent verification records', 'Governance committee status reports'],
    testProcedures: ['Inspect plan template against required elements', 'Sample plans for status accuracy', 'Verify independent reviewer sign-off'],
    status: 'Not Started'
  },

  // ===== Clause 6: Process - Monitoring and Review =====
  {
    controlId: '6.6',
    name: 'AI risk monitoring and review',
    description: 'The organization shall monitor and review AI risks, risk treatments, controls, and the AI risk management process to ensure continuing suitability, adequacy, and effectiveness.',
    category: 'Process - Monitoring and Review',
    implementationGuidance: 'Define monitoring metrics per risk and control. Automate metric collection where feasible (drift detection, fairness probes, telemetry). Schedule periodic risk reviews. Re-evaluate treatments after incidents or significant changes.',
    evidenceRequirements: ['Monitoring metric catalogue', 'Automated monitoring configurations', 'Periodic review minutes', 'Post-incident re-evaluation records'],
    testProcedures: ['Inspect metric catalogue coverage', 'Verify automated monitoring outputs', 'Sample reviews and post-incident re-evaluations'],
    status: 'Not Started'
  },

  // ===== Clause 6: Process - Recording and Reporting =====
  {
    controlId: '6.7',
    name: 'Recording and reporting on AI risk',
    description: 'AI risk management activities and their outcomes shall be documented and reported to provide a basis for decision-making, accountability, evaluation, and improvement.',
    category: 'Process - Recording and Reporting',
    implementationGuidance: 'Maintain a centralized AI risk register with version history, access controls, and audit trails. Generate standardized periodic reports for management and the board. Provide regulator-ready extracts on demand. Retain records per retention policy.',
    evidenceRequirements: ['AI risk register with audit trail', 'Periodic management and board reports', 'Regulator-ready report templates', 'Retention schedule and disposal records'],
    testProcedures: ['Inspect register access controls and audit trail samples', 'Verify report cadence to management and board', 'Confirm retention compliance for disposed records'],
    status: 'Not Started'
  },

  // ===== Annex A: AI-Specific Risk Sources =====
  {
    controlId: 'A.2',
    name: 'Addressing AI-specific risk sources',
    description: 'The organization shall systematically consider AI-specific risk sources including data quality, bias, model performance limitations, opacity, automation complexity, autonomy level, and emergent behaviour.',
    category: 'Annex A - AI Risk Sources',
    implementationGuidance: 'Use the Annex A catalogue of risk sources as a baseline checklist for every AI risk assessment. Tailor sources per system context. Document which sources are not applicable with justification. Update the local catalogue when new sources emerge from research or incidents.',
    evidenceRequirements: ['Local AI risk source catalogue derived from Annex A', 'Per-system applicability checklists', 'Not-applicable justifications', 'Catalogue change log'],
    testProcedures: ['Inspect catalogue against Annex A coverage', 'Sample assessments for use of checklist', 'Verify justifications for excluded sources'],
    status: 'Not Started'
  },
  {
    controlId: 'A.3',
    name: 'AI risk treatment options across the lifecycle',
    description: 'The organization shall identify and apply AI risk treatment options at each stage of the AI system lifecycle, recognizing that some risks are most effectively addressed early in design.',
    category: 'Annex A - AI Risk Treatments',
    implementationGuidance: 'Map treatment options to lifecycle phases: inception, design, data preparation, training, validation, deployment, operation, retirement. Embed phase-specific gates in the AI lifecycle process. Require evidence of treatment evaluation at each gate.',
    evidenceRequirements: ['Lifecycle-to-treatment mapping matrix', 'Phase-gate definitions including risk treatment', 'Gate review records', 'Evidence packs per gate'],
    testProcedures: ['Inspect mapping for full lifecycle coverage', 'Verify gates active in the AI lifecycle pipeline', 'Sample gate reviews for treatment evidence'],
    status: 'Not Started'
  }
];
