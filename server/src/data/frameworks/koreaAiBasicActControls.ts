import { FrameworkControlTemplate } from './soc2Controls';

/**
 * South Korea Act on the Development of Artificial Intelligence and
 * Establishment of Trust (AI Basic Act)
 *
 * Effective January 2026. Establishes a national framework for AI
 * development and trust, with extraterritorial application to foreign
 * businesses providing AI services to Korean users. Administered by the
 * Ministry of Science and ICT (MSIT) with sector regulators retaining
 * domain authority. Imposes heightened obligations on high-impact AI,
 * generative AI labeling, and foundation models.
 */
export const KOREA_AI_BASIC_ACT_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Scope and Extraterritorial Application =====
  {
    controlId: 'KAI-1.1',
    name: 'Extraterritorial Applicability Assessment',
    description: 'Determine whether AI products or services are made available to users in Korea or process the data of Korean users, triggering AI Basic Act applicability regardless of business location.',
    category: 'Scope and Applicability',
    implementationGuidance: 'Inventory all AI services offered to Korean users or processing Korean user data. Document availability channels (app stores, web, API). Maintain an applicability register reviewed semi-annually. Capture entry-and-exit events from the Korean market.',
    evidenceRequirements: ['AI service inventory with Korea applicability flag', 'Availability channel documentation', 'Semi-annual applicability review minutes', 'Market entry/exit log'],
    testProcedures: ['Review inventory completeness against deployed services', 'Sample services and verify Korea flag accuracy', 'Confirm semi-annual review completed on schedule'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-1.2',
    name: 'Foreign Business Domestic Representative Designation',
    description: 'Foreign businesses subject to the AI Basic Act must designate a domestic representative in Korea authorized to communicate with MSIT and respond to inquiries.',
    category: 'Scope and Applicability',
    implementationGuidance: 'Engage a qualified Korean entity or individual as the domestic representative. Execute a representation agreement specifying scope and authority. File the designation with MSIT and maintain current contact details.',
    evidenceRequirements: ['Executed representation agreement', 'MSIT filing confirmation', 'Current contact information record', 'Annual review of representative engagement'],
    testProcedures: ['Inspect representation agreement scope', 'Verify MSIT filing is current', 'Confirm representative responsiveness via test inquiry'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-1.3',
    name: 'AI System Classification (High-Impact / Generative / Foundation)',
    description: 'Classify each AI system as high-impact AI, generative AI, foundation model, or general AI based on the Act\'s criteria to determine applicable obligations.',
    category: 'Scope and Applicability',
    implementationGuidance: 'Apply a written classification methodology referencing the Act\'s definitions. Document classification rationale per system. Reclassify on material change or where MSIT issues clarifying guidance. Map classifications to obligation matrices.',
    evidenceRequirements: ['Classification methodology', 'Per-system classification record', 'Obligation matrix per classification', 'Reclassification log'],
    testProcedures: ['Review methodology against Act definitions', 'Sample classifications and verify rationale', 'Confirm obligation matrix application'],
    status: 'Not Started'
  },

  // ===== High-Impact AI Obligations =====
  {
    controlId: 'KAI-2.1',
    name: 'High-Impact AI Risk Management Plan',
    description: 'Operators of high-impact AI systems must establish a risk management plan covering identification, evaluation, mitigation, and response to risks throughout the AI lifecycle.',
    category: 'High-Impact AI',
    implementationGuidance: 'Adopt a written risk management plan aligned with ISO/IEC 23894 or NIST AI RMF. Define lifecycle phases (design, development, deployment, operation, retirement) and risk activities per phase. Update annually and on material change.',
    evidenceRequirements: ['Approved risk management plan', 'Lifecycle phase mapping', 'Annual update minutes', 'Material change update records'],
    testProcedures: ['Inspect plan against framework alignment', 'Sample lifecycle phases for activity completeness', 'Verify update cycle is current'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-2.2',
    name: 'Human Oversight of High-Impact AI',
    description: 'High-impact AI systems must be operated with human oversight commensurate to the risk, with documented procedures for review and intervention.',
    category: 'High-Impact AI',
    implementationGuidance: 'Design oversight controls per system: define mandatory review thresholds, reviewer qualifications, intervention authority, and escalation paths. Log review events and outcomes. Train reviewers on system limitations.',
    evidenceRequirements: ['Oversight design documents per system', 'Reviewer qualification records', 'Review event logs', 'Reviewer training completion'],
    testProcedures: ['Review oversight design for risk-commensurate coverage', 'Sample review events for completeness', 'Verify reviewer training currency'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-2.3',
    name: 'High-Impact AI Impact Assessment',
    description: 'Conduct an impact assessment before deploying a high-impact AI system, addressing safety, rights, and societal impact.',
    category: 'High-Impact AI',
    implementationGuidance: 'Use an impact assessment template covering intended use, affected user groups, safety risks, fundamental rights impact, mitigation measures, and oversight design. Refresh on material change. Retain throughout system lifecycle.',
    evidenceRequirements: ['Impact assessment template', 'Completed pre-deployment assessments', 'Material change refresh records', 'Lifecycle retention proof'],
    testProcedures: ['Review template completeness', 'Sample deployments for assessment on file', 'Verify refresh triggered by material changes'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-2.4',
    name: 'Safety and Reliability Evaluation',
    description: 'Operators of high-impact AI must evaluate safety and reliability before deployment using methods appropriate to the system.',
    category: 'High-Impact AI',
    implementationGuidance: 'Define evaluation protocols covering accuracy, robustness, adversarial resistance, and operational reliability. Document evaluation results and pass criteria. Block deployment on failure without approved exception.',
    evidenceRequirements: ['Evaluation protocol per system', 'Evaluation result reports', 'Pass criteria documentation', 'Exception approval records'],
    testProcedures: ['Inspect protocols for system-appropriate methods', 'Sample evaluations for result completeness', 'Verify exceptions are approved at appropriate level'],
    status: 'Not Started'
  },

  // ===== Generative AI Labeling =====
  {
    controlId: 'KAI-3.1',
    name: 'Generative AI Output Labeling',
    description: 'Outputs of generative AI must be labeled or disclosed as AI-generated to users where the output could be mistaken for human-generated content.',
    category: 'Generative AI',
    implementationGuidance: 'Apply visible labels to generative AI outputs (text, image, audio, video) at the point of presentation. Embed machine-readable provenance metadata where feasible. Document the label form and placement per output type.',
    evidenceRequirements: ['Labeling design per output type', 'Embedded metadata specification', 'Output samples with labels', 'Labeling policy document'],
    testProcedures: ['Inspect labels on representative outputs', 'Verify metadata embedding via tooling', 'Review policy for completeness'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-3.2',
    name: 'Synthetic Media Disclosure',
    description: 'Provide a conspicuous disclosure when AI generates synthetic depictions of real persons or events that could mislead a reasonable user.',
    category: 'Generative AI',
    implementationGuidance: 'Detect synthetic-of-real outputs through content moderation. Apply enhanced disclosure (overlay watermark plus textual notice) and limit distribution channels. Maintain a register of generated synthetic-of-real outputs.',
    evidenceRequirements: ['Synthetic-of-real detection workflow', 'Enhanced disclosure design', 'Distribution restriction policy', 'Synthetic-of-real output register'],
    testProcedures: ['Test detection workflow with known inputs', 'Inspect enhanced disclosure on representative outputs', 'Review register for completeness'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-3.3',
    name: 'Generative AI User Notification',
    description: 'Notify users at the start of a generative AI interaction that they are interacting with an AI system.',
    category: 'Generative AI',
    implementationGuidance: 'Surface AI interaction notice in the first response or session intro. Track display events in audit logs. Localize notice text to Korean for Korean users.',
    evidenceRequirements: ['Interaction notice copy in Korean', 'UI screenshots showing notice', 'Display event audit logs', 'Localization verification record'],
    testProcedures: ['Inspect notice copy and Korean translation accuracy', 'Verify display in representative sessions', 'Review audit logs for completeness'],
    status: 'Not Started'
  },

  // ===== Foundation Model Duties =====
  {
    controlId: 'KAI-4.1',
    name: 'Foundation Model Technical Documentation',
    description: 'Providers of foundation models must maintain technical documentation describing capabilities, intended uses, limitations, and evaluation results.',
    category: 'Foundation Models',
    implementationGuidance: 'Maintain a model card per foundation model release covering architecture summary, training data overview, capabilities, intended uses, foreseeable misuse, evaluation results, and known limitations. Make available to downstream deployers.',
    evidenceRequirements: ['Model card template', 'Per-release model cards', 'Downstream deployer delivery confirmations', 'Update log on material change'],
    testProcedures: ['Review template against Act\'s foundation model documentation expectations', 'Sample releases for model card on file', 'Verify deployer delivery'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-4.2',
    name: 'Foundation Model Risk Assessment',
    description: 'Assess systemic and societal risks of foundation models, including risks arising from downstream applications.',
    category: 'Foundation Models',
    implementationGuidance: 'Conduct a foundation model risk assessment covering safety, fairness, misuse potential, security, and societal impact. Engage external reviewers for high-capability models. Document mitigations and residual risk acceptance.',
    evidenceRequirements: ['Foundation model risk assessment report', 'External review records', 'Mitigation evidence', 'Residual risk acceptance documentation'],
    testProcedures: ['Inspect assessment for substantive coverage', 'Review external reviewer credentials and findings', 'Verify mitigations executed'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-4.3',
    name: 'Training Data Source Documentation',
    description: 'Foundation model providers must document the categories of training data used and any measures taken to address copyright, privacy, or harmful content.',
    category: 'Foundation Models',
    implementationGuidance: 'Maintain a data sources document listing categories (e.g., licensed datasets, web corpora, partner data). Describe copyright handling, privacy filtering, and content moderation measures. Update on retraining.',
    evidenceRequirements: ['Data sources document', 'Copyright handling procedure', 'Privacy and content filtering description', 'Retraining update records'],
    testProcedures: ['Inspect data sources document for completeness', 'Review filtering procedure', 'Confirm updates on retraining events'],
    status: 'Not Started'
  },

  // ===== Transparency =====
  {
    controlId: 'KAI-5.1',
    name: 'User-Facing AI Use Disclosure',
    description: 'Inform users when AI is used in providing the service, with sufficient detail for users to understand the AI\'s role.',
    category: 'Transparency',
    implementationGuidance: 'Publish an AI use disclosure on the service\'s help or privacy pages. Describe which features use AI and the type of processing. Update on service change.',
    evidenceRequirements: ['Published AI use disclosure URL', 'Per-feature AI use description', 'Update log on service change', 'Localized Korean version'],
    testProcedures: ['Inspect published disclosure for required elements', 'Verify per-feature accuracy', 'Confirm Korean translation accuracy'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-5.2',
    name: 'Explanation of AI-Driven Decisions',
    description: 'Where AI substantially affects a user\'s rights or interests, provide a meaningful explanation on request.',
    category: 'Transparency',
    implementationGuidance: 'Define explanation generation methodology per decision type. Provide explanations covering principal factors and the consumer\'s rights. Respond within a defined SLA after a user request.',
    evidenceRequirements: ['Explanation methodology per decision type', 'Request intake records', 'Explanations delivered to users', 'Response SLA metrics'],
    testProcedures: ['Inspect methodology for substantive explanation', 'Sample requests and verify response within SLA', 'Review explanation content for clarity'],
    status: 'Not Started'
  },

  // ===== Documentation =====
  {
    controlId: 'KAI-6.1',
    name: 'AI System Lifecycle Documentation',
    description: 'Maintain documentation across the AI system lifecycle including design, development, deployment, operation, and retirement.',
    category: 'Documentation',
    implementationGuidance: 'Define a lifecycle documentation standard listing required artifacts per phase. Store artifacts in a managed repository with versioning. Conduct quarterly documentation completeness audits.',
    evidenceRequirements: ['Documentation standard', 'Repository with versioned artifacts', 'Quarterly audit reports', 'Remediation tracking for audit gaps'],
    testProcedures: ['Inspect standard against Act\'s documentation expectations', 'Sample systems for artifact completeness', 'Review audit reports and remediation closure'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-6.2',
    name: 'Evaluation and Testing Records',
    description: 'Retain records of evaluation, testing, and validation activities for the AI system, with sufficient detail to reproduce results.',
    category: 'Documentation',
    implementationGuidance: 'Capture evaluation datasets, code, configurations, and results in a reproducibility-friendly format. Retain for the system\'s operational life plus a statutory tail. Index records for rapid retrieval on MSIT request.',
    evidenceRequirements: ['Evaluation records repository', 'Reproducibility metadata', 'Retention schedule', 'Retrieval index'],
    testProcedures: ['Sample evaluations and attempt reproduction', 'Verify retention schedule alignment with Act', 'Test retrieval against index'],
    status: 'Not Started'
  },

  // ===== Risk Management =====
  {
    controlId: 'KAI-7.1',
    name: 'AI Incident Response Plan',
    description: 'Establish an AI incident response plan covering identification, containment, investigation, remediation, and notification of AI-specific incidents.',
    category: 'Risk Management',
    implementationGuidance: 'Adopt a written AI incident response plan defining incident types (safety failure, discrimination, security breach, hallucination causing harm). Define notification obligations including MSIT and affected users. Run annual tabletop exercises.',
    evidenceRequirements: ['Approved incident response plan', 'Notification matrix including MSIT', 'Tabletop exercise reports', 'Real incident response records'],
    testProcedures: ['Inspect plan for incident type coverage', 'Verify MSIT notification path is current', 'Review tabletop after-action remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-7.2',
    name: 'Continuous Monitoring of AI Performance',
    description: 'Monitor deployed AI systems for performance degradation, drift, and emerging risks throughout operational life.',
    category: 'Risk Management',
    implementationGuidance: 'Define monitoring metrics per system covering accuracy, drift, fairness, and reliability. Implement alerting and investigation workflow. Issue periodic monitoring reports to risk owners.',
    evidenceRequirements: ['Monitoring metric catalog', 'Alert investigation records', 'Periodic monitoring reports', 'Risk owner sign-off records'],
    testProcedures: ['Review catalog for system-appropriate metrics', 'Sample alerts for resolution', 'Confirm risk owner receipt of reports'],
    status: 'Not Started'
  },

  // ===== MSIT Notification and Engagement =====
  {
    controlId: 'KAI-8.1',
    name: 'MSIT Pre-Deployment Notification for High-Impact AI',
    description: 'Notify MSIT prior to deploying certain categories of high-impact AI as specified by ministerial regulations.',
    category: 'MSIT Engagement',
    implementationGuidance: 'Maintain a register of MSIT notification triggers aligned with current regulations. Build a notification workflow producing required disclosures. Track submission and MSIT response.',
    evidenceRequirements: ['MSIT notification trigger register', 'Notification workflow procedure', 'Submitted notifications archive', 'MSIT response records'],
    testProcedures: ['Inspect register currency against latest MSIT guidance', 'Sample deployments and verify notification', 'Confirm MSIT acknowledgment retained'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-8.2',
    name: 'MSIT Inquiry Response',
    description: 'Respond to MSIT inquiries and information requests within statutory timelines.',
    category: 'MSIT Engagement',
    implementationGuidance: 'Establish a designated MSIT contact and response workflow. Track inquiries through intake, evidence gathering, and response. Conduct annual tabletop exercises.',
    evidenceRequirements: ['MSIT contact roster', 'Inquiry response procedure', 'Tabletop reports', 'Real inquiry response records'],
    testProcedures: ['Verify contact roster currency', 'Walk through procedure with legal team', 'Review tabletop remediation actions'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-8.3',
    name: 'Cooperation with Sector Regulators',
    description: 'Cooperate with sector-specific Korean regulators (PIPC, FSC, MOHW, etc.) whose authority overlaps with AI Basic Act obligations in specific verticals.',
    category: 'MSIT Engagement',
    implementationGuidance: 'Identify applicable sector regulators per service. Maintain contact rosters and cooperation procedures. Coordinate notifications when an incident triggers multiple regulators.',
    evidenceRequirements: ['Sector regulator applicability map', 'Cooperation procedures per regulator', 'Multi-regulator notification log', 'Annual review minutes'],
    testProcedures: ['Inspect applicability map against deployed services', 'Sample procedures for completeness', 'Review multi-regulator notification for sample incident'],
    status: 'Not Started'
  },

  // ===== AI Ethics and Governance =====
  {
    controlId: 'KAI-9.1',
    name: 'AI Ethics Charter Adoption',
    description: 'Adopt and publish an AI ethics charter aligned with the AI Basic Act\'s principles of human dignity, fairness, transparency, and accountability.',
    category: 'Ethics and Governance',
    implementationGuidance: 'Draft an AI ethics charter referencing the Act\'s principles and the organization\'s commitments. Publish on a public-facing page. Embed in product development gates and personnel training.',
    evidenceRequirements: ['Published AI ethics charter URL', 'Development gate integration documentation', 'Training program tying to charter', 'Annual charter review minutes'],
    testProcedures: ['Inspect charter against Act\'s principles', 'Verify gate integration in product process', 'Review training program completion'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-9.2',
    name: 'AI Governance Committee',
    description: 'Establish an AI governance committee with cross-functional membership responsible for AI Basic Act compliance and ethics oversight.',
    category: 'Ethics and Governance',
    implementationGuidance: 'Charter an AI governance committee including legal, engineering, product, security, and ethics representatives. Define decision authority, escalation, and meeting cadence. Capture minutes and resolutions.',
    evidenceRequirements: ['Committee charter', 'Membership roster', 'Meeting minutes', 'Resolutions log'],
    testProcedures: ['Review charter for authority and scope', 'Verify membership is current and cross-functional', 'Sample minutes for substantive review'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-9.3',
    name: 'Personnel Training on AI Basic Act',
    description: 'Train personnel involved in AI development, deployment, and operation on the AI Basic Act and the organization\'s ethics charter.',
    category: 'Ethics and Governance',
    implementationGuidance: 'Build a role-based training program covering Act obligations, ethics charter, incident reporting, and Korean cultural context where applicable. Track completion and refresh annually.',
    evidenceRequirements: ['Role-based training curriculum', 'Completion records', 'Annual refresh log', 'Comprehension assessment results'],
    testProcedures: ['Review curriculum against Act obligations', 'Sample completion for in-scope personnel', 'Verify annual refresh cadence'],
    status: 'Not Started'
  },
  {
    controlId: 'KAI-9.4',
    name: 'Recordkeeping for Compliance Evidence',
    description: 'Retain compliance evidence (assessments, evaluations, notifications, training, monitoring) for the period specified by the Act and subordinate regulations.',
    category: 'Ethics and Governance',
    implementationGuidance: 'Define a retention schedule aligned with the Act and PIPA where overlapping. Implement automated retention with hold capability for litigation or regulatory matters. Audit retention annually.',
    evidenceRequirements: ['Retention schedule document', 'Automated retention configuration', 'Litigation hold procedure', 'Annual retention audit reports'],
    testProcedures: ['Inspect schedule alignment with Act periods', 'Sample records for retention compliance', 'Verify hold capability via test'],
    status: 'Not Started'
  }
];
