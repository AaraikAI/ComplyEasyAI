import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO/IEC 5338:2023 - Information technology — Artificial intelligence — AI system life cycle processes
 *
 * Provides a process reference model for organizations developing, supplying,
 * and operating AI systems. Extends ISO/IEC/IEEE 12207 (software lifecycle) and
 * ISO/IEC/IEEE 15288 (systems lifecycle) with AI-specific processes covering
 * the full lifecycle from concept through retirement.
 *
 * Structure:
 *   Clause 6.1: Agreement processes
 *   Clause 6.2: Organizational project-enabling processes
 *   Clause 6.3: Technical management processes
 *   Clause 6.4: Technical processes - development, production, utilization, support, retirement
 */
export const ISO_5338_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 6.1: Agreement Processes =====
  {
    controlId: '6.1.1',
    name: 'Acquisition process for AI systems',
    description: 'The organization shall obtain AI systems, products, or services that meet stakeholder requirements through formal acquisition activities including supplier selection, contracting, and acceptance.',
    category: 'Agreement Processes',
    implementationGuidance: 'Develop AI-specific acquisition requirements covering model documentation, data provenance, bias testing evidence, intellectual property terms, and ongoing model update obligations. Run a structured RFP process. Include AI-specific acceptance criteria in supplier contracts. Verify supplier conformance before go-live.',
    evidenceRequirements: ['AI acquisition requirements template', 'RFP and supplier evaluation records', 'Executed AI supplier contracts', 'Acceptance test results'],
    testProcedures: ['Inspect acquisition template for AI-specific clauses', 'Sample two acquisitions and verify evaluation records', 'Verify acceptance criteria executed before go-live'],
    status: 'Not Started'
  },
  {
    controlId: '6.1.2',
    name: 'Supply process for AI systems',
    description: 'When the organization supplies AI systems, products, or services, it shall manage the agreement and delivery to satisfy acquirer requirements including documentation, training, and support obligations.',
    category: 'Agreement Processes',
    implementationGuidance: 'Maintain customer-facing AI documentation packages (model cards, data sheets, intended use statements, performance characteristics). Manage delivery against contract milestones. Provide customer training. Track customer-reported issues and feedback.',
    evidenceRequirements: ['Customer documentation packages', 'Milestone delivery records', 'Customer training materials and attendance', 'Customer issue tracker'],
    testProcedures: ['Inspect documentation pack for completeness', 'Verify milestone evidence per contract', 'Sample customer issues for resolution status'],
    status: 'Not Started'
  },

  // ===== Clause 6.2: Organizational Project-Enabling Processes =====
  {
    controlId: '6.2.1',
    name: 'Life cycle model management for AI systems',
    description: 'The organization shall define, maintain, and improve a life cycle model tailored for AI systems, including processes, methods, and tools applicable to AI development and operation.',
    category: 'Organizational Project-Enabling',
    implementationGuidance: 'Publish an AI lifecycle model document covering phases, gates, deliverables, and approvers. Tailor for project size and risk tier. Review the model annually and after major incidents. Train new staff on the model.',
    evidenceRequirements: ['AI lifecycle model document', 'Tailoring guidelines', 'Annual review records', 'Onboarding training materials'],
    testProcedures: ['Inspect lifecycle model for AI-specific phases', 'Verify tailoring applied to sampled projects', 'Confirm annual review evidence'],
    status: 'Not Started'
  },
  {
    controlId: '6.2.2',
    name: 'Infrastructure management for AI systems',
    description: 'The organization shall establish and maintain infrastructure to support AI system life cycle activities, including compute, storage, networking, development environments, and MLOps tooling.',
    category: 'Organizational Project-Enabling',
    implementationGuidance: 'Provision standardized environments for development, training, validation, staging, and production. Use infrastructure-as-code with version control. Track capacity and utilization. Maintain environment provisioning runbooks.',
    evidenceRequirements: ['Environment topology diagrams', 'Infrastructure-as-code repository', 'Capacity and utilization dashboards', 'Provisioning runbooks'],
    testProcedures: ['Inspect IaC repository commit history', 'Verify environment parity checks', 'Sample provisioning events for runbook adherence'],
    status: 'Not Started'
  },
  {
    controlId: '6.2.3',
    name: 'Portfolio management for AI initiatives',
    description: 'The organization shall manage the portfolio of AI initiatives to align investments with strategic objectives, balance risks, and optimize resource allocation across competing demands.',
    category: 'Organizational Project-Enabling',
    implementationGuidance: 'Maintain an AI initiative portfolio with strategic alignment scores, risk tier, business value, and resource demand. Run quarterly portfolio reviews. Sunset initiatives that no longer align. Communicate portfolio decisions to stakeholders.',
    evidenceRequirements: ['AI portfolio dashboard', 'Quarterly portfolio review minutes', 'Sunset decision records', 'Stakeholder communications'],
    testProcedures: ['Inspect portfolio dashboard for required fields', 'Verify quarterly review evidence', 'Sample sunset decisions for rationale'],
    status: 'Not Started'
  },
  {
    controlId: '6.2.4',
    name: 'Human resource management for AI competencies',
    description: 'The organization shall ensure that personnel involved in AI system life cycle activities have the necessary competencies, including AI-specific skills, ethics awareness, and domain expertise.',
    category: 'Organizational Project-Enabling',
    implementationGuidance: 'Define AI-specific role profiles and competency requirements. Conduct gap assessments. Provide structured training paths (technical, ethics, regulatory). Track certifications. Plan succession for critical AI roles.',
    evidenceRequirements: ['AI role and competency profiles', 'Skills gap assessment reports', 'Training catalogue and completion records', 'Succession plans for critical AI roles'],
    testProcedures: ['Inspect competency profiles for AI-specific skills', 'Sample staff for training completion', 'Verify succession plans for critical roles'],
    status: 'Not Started'
  },
  {
    controlId: '6.2.5',
    name: 'Quality management for AI life cycle',
    description: 'The organization shall implement a quality management approach for AI systems addressing data quality, model quality, system quality, and process quality across the life cycle.',
    category: 'Organizational Project-Enabling',
    implementationGuidance: 'Define quality metrics for data (completeness, accuracy, representativeness), models (accuracy, robustness, fairness), and processes (defect density, rework rate). Embed quality gates in the lifecycle. Conduct internal quality audits.',
    evidenceRequirements: ['AI quality metric definitions', 'Quality gate criteria per phase', 'Quality audit reports', 'Corrective action records'],
    testProcedures: ['Inspect metric definitions for completeness', 'Verify gate criteria applied at sampled gates', 'Review audit findings for closure'],
    status: 'Not Started'
  },
  {
    controlId: '6.2.6',
    name: 'Knowledge management for AI',
    description: 'The organization shall manage knowledge assets relevant to AI systems including datasets, models, code, documentation, and lessons learned to support reuse and continual improvement.',
    category: 'Organizational Project-Enabling',
    implementationGuidance: 'Maintain a catalogued repository of datasets, models, and code. Enforce metadata standards. Capture lessons learned after each release and incident. Promote reuse via internal AI asset marketplaces.',
    evidenceRequirements: ['AI asset catalogue', 'Metadata standards', 'Lessons-learned repository', 'Reuse metrics'],
    testProcedures: ['Inspect catalogue completeness', 'Verify metadata compliance for sampled assets', 'Review lessons-learned closure'],
    status: 'Not Started'
  },

  // ===== Clause 6.3: Technical Management Processes =====
  {
    controlId: '6.3.1',
    name: 'Project planning for AI systems',
    description: 'The organization shall produce and communicate effective and workable project plans for AI initiatives addressing AI-specific concerns including data acquisition, experimentation cycles, and uncertainty in delivery.',
    category: 'Technical Management',
    implementationGuidance: 'Use AI-aware planning templates accommodating experimental phases, data dependencies, and iterative training. Break work into experimentation, productionization, and operations streams. Plan for measurable hypotheses. Re-plan after experimentation milestones.',
    evidenceRequirements: ['AI project plan template', 'Approved project plans', 'Hypothesis-tracking artifacts', 'Re-plan records after experimentation gates'],
    testProcedures: ['Inspect plan template for AI accommodations', 'Sample plans for hypothesis fields', 'Verify re-plans triggered by experiment outcomes'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.2',
    name: 'Project assessment and control for AI systems',
    description: 'The organization shall assess project progress and performance against AI-relevant objectives including model performance milestones, data readiness, and stakeholder satisfaction.',
    category: 'Technical Management',
    implementationGuidance: 'Track AI-specific KPIs (model accuracy progression, data readiness, technical debt). Conduct biweekly project health reviews. Trigger corrective action when KPIs deviate. Report status to AI governance.',
    evidenceRequirements: ['AI project KPI dashboards', 'Biweekly project health review minutes', 'Corrective action register', 'Governance status reports'],
    testProcedures: ['Inspect KPI definitions and dashboards', 'Verify biweekly review cadence', 'Sample corrective actions for closure'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.3',
    name: 'Decision management for AI systems',
    description: 'The organization shall provide a structured analytical framework for objectively identifying, characterizing, and evaluating decisions affecting AI system life cycle outcomes.',
    category: 'Technical Management',
    implementationGuidance: 'Apply structured decision techniques (multi-criteria analysis, decision logs) for AI choices such as model architecture, data sources, deployment approach, and human-AI division of labour. Document alternatives considered and rationale. Track decision outcomes.',
    evidenceRequirements: ['Decision log template', 'Completed decision logs', 'Multi-criteria analysis worksheets', 'Decision outcome tracking'],
    testProcedures: ['Inspect log template for required fields', 'Sample decisions for alternatives and rationale', 'Verify outcome tracking populated'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.4',
    name: 'Risk management within AI project execution',
    description: 'The organization shall identify, analyze, treat, and monitor risks continually during AI project execution, integrating with the broader AI risk management framework.',
    category: 'Technical Management',
    implementationGuidance: 'Maintain a project-level risk register feeding into the enterprise AI risk register. Review at every sprint. Assign owners and due dates. Escalate when risk score exceeds project tolerance.',
    evidenceRequirements: ['Project-level AI risk registers', 'Sprint risk review records', 'Escalation evidence', 'Enterprise register linkage'],
    testProcedures: ['Inspect project register entries', 'Verify sprint review cadence', 'Sample escalations against tolerance thresholds'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.5',
    name: 'Configuration management for AI artifacts',
    description: 'The organization shall identify, control, and track configuration of AI artifacts including datasets, model weights, training code, hyperparameters, evaluation scripts, and deployment manifests.',
    category: 'Technical Management',
    implementationGuidance: 'Apply version control to code, configurations, datasets (via data versioning tools), and model artifacts (via a model registry). Enforce immutable model registry entries. Capture lineage linking model, data, and code versions.',
    evidenceRequirements: ['Code repository configurations', 'Dataset versioning tool records', 'Model registry entries', 'Lineage records connecting artifacts'],
    testProcedures: ['Verify version control over all artifact classes', 'Inspect registry immutability controls', 'Sample lineage records for completeness'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.6',
    name: 'Information management for AI systems',
    description: 'The organization shall manage information about AI systems and their life cycle activities so that authorized stakeholders can access accurate, complete, current, and relevant information when needed.',
    category: 'Technical Management',
    implementationGuidance: 'Define information classes (design, operational, audit, customer-facing). Apply access controls and retention. Maintain a master AI system register. Provide self-service access for authorized roles.',
    evidenceRequirements: ['Information classification scheme', 'Master AI system register', 'Access control configurations', 'Retention schedule'],
    testProcedures: ['Inspect classification scheme application', 'Verify register completeness against active systems', 'Sample access logs for least-privilege adherence'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.7',
    name: 'Measurement of AI life cycle processes',
    description: 'The organization shall collect, analyze, and report data on AI life cycle process performance to support management decisions and continual improvement.',
    category: 'Technical Management',
    implementationGuidance: 'Define process metrics (cycle time, defect escape rate, automation rate, gate pass rate). Collect via tool integrations. Report monthly to AI process owners. Use data to identify and prioritize improvements.',
    evidenceRequirements: ['Process metric catalogue', 'Automated metric collection configurations', 'Monthly process reports', 'Improvement backlog driven by metrics'],
    testProcedures: ['Inspect metric catalogue and collection methods', 'Verify report distribution to process owners', 'Sample improvement items for metric linkage'],
    status: 'Not Started'
  },
  {
    controlId: '6.3.8',
    name: 'Quality assurance for AI systems',
    description: 'The organization shall ensure that AI work products and life cycle processes comply with planned arrangements and identified requirements through independent quality assurance activities.',
    category: 'Technical Management',
    implementationGuidance: 'Establish an independent QA function reviewing AI deliverables (data sheets, model cards, validation reports, security reviews). Audit against documented criteria. Issue non-conformance reports. Track closure.',
    evidenceRequirements: ['QA function charter and independence evidence', 'QA review checklists', 'Non-conformance reports', 'Closure tracking'],
    testProcedures: ['Verify QA reporting line independence', 'Sample QA reviews for documented criteria', 'Verify NCR closure within SLA'],
    status: 'Not Started'
  },

  // ===== Clause 6.4: Technical Processes =====
  {
    controlId: '6.4.1',
    name: 'Stakeholder needs and requirements definition for AI systems',
    description: 'The organization shall define stakeholder needs and requirements for an AI system that addresses intended use, performance expectations, ethical considerations, and human oversight needs.',
    category: 'Technical Processes',
    implementationGuidance: 'Conduct structured stakeholder interviews and workshops. Capture functional, non-functional, ethical, regulatory, and operational requirements. Validate requirements with stakeholder sign-off. Maintain traceability to downstream artifacts.',
    evidenceRequirements: ['Stakeholder interview records', 'Requirements specification with categorization', 'Stakeholder sign-off records', 'Requirements traceability matrix'],
    testProcedures: ['Inspect interview coverage against stakeholder map', 'Sample requirements for categorization completeness', 'Verify traceability across lifecycle'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.2',
    name: 'System requirements definition for AI systems',
    description: 'The organization shall translate stakeholder needs into a coherent set of AI system requirements covering functional, performance, interface, data, security, and ethical attributes.',
    category: 'Technical Processes',
    implementationGuidance: 'Use a structured requirements specification covering inputs, outputs, performance thresholds, latency, fairness constraints, explainability needs, security requirements, and operational envelopes. Apply analysis techniques such as use-case modelling. Baseline requirements before design.',
    evidenceRequirements: ['AI system requirements specification', 'Use-case models', 'Requirement baseline approval', 'Change control records'],
    testProcedures: ['Inspect specification for required attribute coverage', 'Verify baseline approval signatures', 'Sample changes for change-control evidence'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.3',
    name: 'Architecture definition for AI systems',
    description: 'The organization shall define an AI system architecture that satisfies requirements and addresses AI-specific concerns including data flow, model serving, monitoring, and human-in-the-loop touchpoints.',
    category: 'Technical Processes',
    implementationGuidance: 'Produce architecture documents covering logical, physical, data, and deployment views. Identify AI-specific components (feature store, model registry, inference service, monitoring). Conduct architecture reviews with security and ethics representation. Maintain architecture decision records.',
    evidenceRequirements: ['AI architecture documentation set', 'Architecture decision records', 'Architecture review minutes', 'Component inventory'],
    testProcedures: ['Inspect architecture views for completeness', 'Sample decisions for documented rationale', 'Verify review participation includes security and ethics'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.4',
    name: 'Design definition for AI systems',
    description: 'The organization shall provide sufficient detailed data and information about the AI system and its elements to enable implementation consistent with architecture and requirements.',
    category: 'Technical Processes',
    implementationGuidance: 'Produce detailed design artifacts: model design (architecture, hyperparameters, training procedure), data pipeline design, integration interfaces, and operational design. Apply design reviews. Store designs in version control.',
    evidenceRequirements: ['Detailed design artifacts', 'Design review records', 'Version-controlled design repository', 'Design-to-requirement trace'],
    testProcedures: ['Inspect design artifacts for completeness', 'Verify review evidence', 'Sample requirement-to-design trace'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.6',
    name: 'AI system implementation',
    description: 'The organization shall implement AI system elements including data pipelines, model training procedures, and integration code in conformance with the design.',
    category: 'Technical Processes',
    implementationGuidance: 'Apply secure coding standards. Use peer code review for all changes. Automate unit and integration tests. Implement reproducible training pipelines with deterministic seeds where feasible. Capture implementation evidence in build records.',
    evidenceRequirements: ['Secure coding standards', 'Peer review records', 'Automated test results', 'Build records with reproducibility evidence'],
    testProcedures: ['Inspect coding standards adoption', 'Sample pull requests for review evidence', 'Verify reproducible training run outputs'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.7',
    name: 'AI system integration',
    description: 'The organization shall integrate AI system elements with each other and with other systems to form complete, operable AI systems satisfying requirements.',
    category: 'Technical Processes',
    implementationGuidance: 'Define integration strategy including phasing, environments, and rollback. Execute integration tests across data ingestion, training, serving, and downstream consumers. Validate end-to-end performance. Document integration outcomes.',
    evidenceRequirements: ['Integration strategy document', 'Integration test plans and results', 'End-to-end performance evidence', 'Integration outcome reports'],
    testProcedures: ['Inspect strategy and rollback procedures', 'Sample integration tests for execution evidence', 'Verify end-to-end performance against requirements'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.8',
    name: 'AI system verification',
    description: 'The organization shall provide objective evidence that the AI system fulfills its specified requirements through verification activities including testing, analysis, inspection, and demonstration.',
    category: 'Technical Processes',
    implementationGuidance: 'Define verification methods per requirement (test, analysis, inspection, demonstration). Maintain a verification matrix. Execute verification before validation. Address verification deviations via change control.',
    evidenceRequirements: ['Verification methods per requirement', 'Verification matrix', 'Verification execution records', 'Deviation handling records'],
    testProcedures: ['Inspect verification matrix coverage', 'Sample verifications for execution evidence', 'Verify deviation closure'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.9',
    name: 'AI system validation',
    description: 'The organization shall provide objective evidence that the AI system, when used as intended, fulfills the stakeholder requirements in the operational environment, including performance, fairness, robustness, and safety attributes.',
    category: 'Technical Processes',
    implementationGuidance: 'Validate using representative operational data and conditions. Cover performance, fairness across subpopulations, robustness to distribution shift, and safety boundaries. Engage stakeholders in user acceptance testing. Document validation evidence in a release dossier.',
    evidenceRequirements: ['Validation plans and reports', 'Fairness and robustness validation evidence', 'User acceptance test records', 'Release dossier'],
    testProcedures: ['Inspect validation plans against stakeholder requirements', 'Sample fairness validation for subgroup coverage', 'Verify release dossier completeness'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.10',
    name: 'AI system transition',
    description: 'The organization shall transition the AI system into the operational environment in a controlled manner, including deployment, cutover, training of operators, and verification of operational readiness.',
    category: 'Technical Processes',
    implementationGuidance: 'Use staged deployment patterns (canary, blue-green). Train operators and users on new or changed AI capabilities. Verify operational readiness checklists prior to cutover. Maintain rollback plans. Document transition outcomes.',
    evidenceRequirements: ['Deployment strategy documents', 'Operator and user training records', 'Operational readiness checklists', 'Rollback plans and transition reports'],
    testProcedures: ['Inspect deployment strategy and readiness checklists', 'Verify operator training completion', 'Sample transitions for rollback plan presence'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.11',
    name: 'AI system operation',
    description: 'The organization shall operate the AI system to deliver its services within agreed performance, fairness, security, and reliability targets, with continuous monitoring and human oversight.',
    category: 'Technical Processes',
    implementationGuidance: 'Maintain operational runbooks. Implement monitoring for accuracy, drift, fairness, security, and resource utilization. Define alerting and on-call response. Conduct periodic operational reviews.',
    evidenceRequirements: ['Operational runbooks', 'Monitoring and alerting configurations', 'On-call schedules and response records', 'Operational review minutes'],
    testProcedures: ['Inspect runbooks for completeness', 'Verify monitoring covers required dimensions', 'Sample alerts for on-call response timeliness'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.12',
    name: 'AI system maintenance',
    description: 'The organization shall sustain the AI system\'s capability to provide a service through corrective, perfective, adaptive, and preventive maintenance including model retraining and data refresh.',
    category: 'Technical Processes',
    implementationGuidance: 'Define maintenance categories and triggers (drift detection, performance degradation, defect reports, regulatory change). Schedule retraining and revalidation. Manage maintenance via change control with full lifecycle traceability.',
    evidenceRequirements: ['Maintenance procedure document', 'Retraining and revalidation schedules', 'Change control records for maintenance', 'Traceability through lifecycle'],
    testProcedures: ['Inspect maintenance categories and triggers', 'Sample retraining for change-control adherence', 'Verify revalidation completed post-retraining'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.13',
    name: 'AI system disposal',
    description: 'The organization shall retire and dispose of the AI system and its components in a manner that addresses data deletion, model decommissioning, transition of users, and preservation of records as required.',
    category: 'Technical Processes',
    implementationGuidance: 'Define disposal procedures including decision criteria, stakeholder communication, data deletion, model archival, and record retention. Verify disposal completion against checklist. Update inventories and dependency systems.',
    evidenceRequirements: ['AI disposal procedure', 'Disposal decision records', 'Completed disposal checklists', 'Inventory and dependency update evidence'],
    testProcedures: ['Inspect procedure for required disposal activities', 'Sample disposed systems for checklist completion', 'Verify inventory removal post-disposal'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.14',
    name: 'Data engineering for AI systems',
    description: 'The organization shall plan and execute data engineering activities supporting AI system life cycle, including data acquisition, preparation, labeling, versioning, and quality assurance.',
    category: 'Technical Processes - AI-Specific',
    implementationGuidance: 'Maintain data engineering procedures covering acquisition (sourcing, consent), preparation (cleaning, transformation), labeling (instructions, quality control), versioning (snapshots, lineage), and quality monitoring. Apply data engineering standards across projects.',
    evidenceRequirements: ['Data engineering procedures', 'Labeling instructions and QC records', 'Data versioning artifacts', 'Data quality monitoring outputs'],
    testProcedures: ['Inspect procedures for full coverage', 'Sample labeling tasks for QC evidence', 'Verify data versioning for sampled datasets'],
    status: 'Not Started'
  },
  {
    controlId: '6.4.15',
    name: 'Continuous validation of AI models in operation',
    description: 'The organization shall continuously validate operational AI models to detect drift, performance degradation, fairness regression, and emerging risks, triggering corrective action when thresholds are breached.',
    category: 'Technical Processes - AI-Specific',
    implementationGuidance: 'Define continuous validation metrics and thresholds. Automate metric computation against operational data. Trigger alerts and corrective workflows on breach. Document validation outcomes in the operational record.',
    evidenceRequirements: ['Continuous validation metric definitions', 'Automated computation pipelines', 'Alert and corrective workflow configurations', 'Validation outcome logs'],
    testProcedures: ['Inspect metric and threshold definitions', 'Verify automated computation execution', 'Sample alerts for corrective workflow execution'],
    status: 'Not Started'
  }
];
