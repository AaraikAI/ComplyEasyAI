import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Colorado Artificial Intelligence Act (SB 24-205)
 *
 * Effective June 30, 2026 (delayed from February 2026). Imposes duties on
 * developers and deployers of high-risk artificial intelligence systems that
 * make or are a substantial factor in making consequential decisions, with
 * the goal of preventing algorithmic discrimination. Enforcement vests in
 * the Colorado Attorney General.
 */
export const COLORADO_AI_ACT_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Scope and Definitions =====
  {
    controlId: 'COAI-1.1',
    name: 'Consequential Decision Identification',
    description: 'Identify decisions made by or with the substantial assistance of an AI system that produce a legal or similarly significant effect on consumers in the areas defined by the Act.',
    category: 'Scope and Definitions',
    implementationGuidance: 'Inventory all decision processes touching education, employment, financial or lending services, essential government services, healthcare, housing, insurance, and legal services. For each, document whether AI is a substantial factor in the decision and the consumer effect.',
    evidenceRequirements: ['Consequential decision inventory', 'AI substantial-factor assessment per decision', 'Consumer effect classification', 'Inventory refresh evidence'],
    testProcedures: ['Review inventory against the Act\'s enumerated domains', 'Sample decisions and verify substantial-factor analysis', 'Confirm inventory refresh on system or process change'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-1.2',
    name: 'High-Risk AI System Classification',
    description: 'Classify AI systems as high-risk where they make or are a substantial factor in making consequential decisions, applying statutory exclusions where appropriate.',
    category: 'Scope and Definitions',
    implementationGuidance: 'Apply a written classification methodology that maps each AI system to its decision context and substantial-factor role. Apply statutory exclusions (e.g., anti-fraud technology, cybersecurity tools) with documented justification. Reclassify on material change.',
    evidenceRequirements: ['Classification methodology document', 'Per-system classification record', 'Exclusion justification memos', 'Reclassification log'],
    testProcedures: ['Inspect methodology against SB 24-205 definitions', 'Sample exclusions for justification adequacy', 'Verify reclassification triggered by system changes'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-1.3',
    name: 'Developer vs Deployer Role Identification',
    description: 'For every high-risk AI system, determine whether the organization acts as developer, deployer, or both, and apply the corresponding obligations.',
    category: 'Scope and Definitions',
    implementationGuidance: 'Maintain a role matrix per AI system. Document the determination criteria including who designed, trained, modified, and deployed the system. Where roles change, refresh the determination and update obligation tracking.',
    evidenceRequirements: ['Role matrix per AI system', 'Determination criteria documentation', 'Role-change refresh records', 'Obligation tracker tied to roles'],
    testProcedures: ['Review matrix for completeness against AI inventory', 'Sample determinations and trace to underlying evidence', 'Confirm obligations align with assigned role'],
    status: 'Not Started'
  },

  // ===== Developer Documentation Duties =====
  {
    controlId: 'COAI-2.1',
    name: 'Developer Disclosure Statement to Deployers',
    description: 'Developers must provide deployers with a statement describing the high-risk AI system\'s reasonably foreseeable uses, known harmful or inappropriate uses, training data summary, evaluation of performance, and risk mitigation measures.',
    category: 'Developer Duties',
    implementationGuidance: 'Design a standardized disclosure document covering all SB 24-205 elements. Issue with each release. Update on substantial modification. Track recipients and acknowledgments.',
    evidenceRequirements: ['Disclosure document template', 'Versioned disclosures per release', 'Recipient acknowledgments', 'Update trigger log'],
    testProcedures: ['Compare template fields against SB 24-205 disclosure list', 'Sample disclosures sent and verify recipient acknowledgment', 'Confirm update triggered by substantial modification'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-2.2',
    name: 'Developer Public Risk Statement',
    description: 'Developers must publish on their website a statement summarizing the types of high-risk AI systems offered, known limitations, and risk management measures.',
    category: 'Developer Duties',
    implementationGuidance: 'Maintain a public-facing risk statement that lists offered systems, limitations, and risk management practices. Review quarterly and version-control changes. Provide an archive of prior versions.',
    evidenceRequirements: ['Public risk statement URL', 'Version control log of changes', 'Quarterly review minutes', 'Archived prior versions'],
    testProcedures: ['Inspect public page for required elements', 'Sample quarterly review records', 'Verify archived versions accessible'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-2.3',
    name: 'Developer Notification of Discovered Algorithmic Discrimination',
    description: 'Developers must notify deployers and the Attorney General of any known or reasonably foreseeable risks of algorithmic discrimination from the system within statutory timeframes.',
    category: 'Developer Duties',
    implementationGuidance: 'Establish a discovery-and-notification workflow tied to model evaluation results, incident reports, and external research findings. Notify deployers and the AG via documented channels with required content. Track notification timeliness.',
    evidenceRequirements: ['Notification workflow documentation', 'Discovery sources catalog', 'Sent notifications to deployers and AG', 'Timeliness tracking metrics'],
    testProcedures: ['Inspect workflow for SB 24-205 notification elements', 'Sample discoveries and verify notification within statutory window', 'Confirm AG notification channel used'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-2.4',
    name: 'Training Data Documentation',
    description: 'Developers must document the characteristics of the data used to train and evaluate the high-risk AI system, including provenance, intended use, and known limitations.',
    category: 'Developer Duties',
    implementationGuidance: 'Maintain a data card per model release describing training data sources, collection method, demographic coverage where relevant, preprocessing, and evaluation splits. Retain throughout the system lifecycle.',
    evidenceRequirements: ['Data card template', 'Per-release data cards', 'Source provenance records', 'Lifecycle retention proof'],
    testProcedures: ['Review template against SB 24-205 data documentation elements', 'Sample releases and verify data card on file', 'Confirm retention covers active deployments'],
    status: 'Not Started'
  },

  // ===== Deployer Impact Assessments =====
  {
    controlId: 'COAI-3.1',
    name: 'Deployer Impact Assessment Pre-Deployment',
    description: 'Deployers must complete an impact assessment before deploying a high-risk AI system and on substantial modification, addressing purpose, benefits, risks, mitigations, oversight, and data inputs.',
    category: 'Deployer Duties',
    implementationGuidance: 'Use an impact assessment template covering all statutory elements including the system\'s purpose, intended use, deployment context, benefits, risks of algorithmic discrimination, mitigation steps, monitoring, oversight, and post-deployment review. Refresh annually and on substantial modification.',
    evidenceRequirements: ['Impact assessment template', 'Completed pre-deployment assessments', 'Annual refresh records', 'Substantial modification refresh records'],
    testProcedures: ['Review template completeness against SB 24-205', 'Sample deployments and verify pre-deployment assessment exists', 'Trace a substantial modification to assessment refresh'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-3.2',
    name: 'Risk Management Policy and Program',
    description: 'Deployers must implement a risk management policy and program for high-risk AI systems addressing identification, evaluation, and mitigation of foreseeable risks of algorithmic discrimination.',
    category: 'Deployer Duties',
    implementationGuidance: 'Adopt a written risk management policy aligned with a recognized framework (NIST AI RMF or ISO/IEC 23894). Define roles, procedures for identification, evaluation, mitigation, and reporting. Review annually with executive sign-off.',
    evidenceRequirements: ['Approved risk management policy', 'Framework alignment statement', 'Risk register per high-risk system', 'Annual review minutes with executive sign-off'],
    testProcedures: ['Inspect policy alignment with chosen framework', 'Sample risks and verify mitigation evidence', 'Confirm executive sign-off in current cycle'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-3.3',
    name: 'Annual Compliance Review',
    description: 'Deployers must annually review the deployment of each high-risk AI system to confirm it is not causing algorithmic discrimination.',
    category: 'Deployer Duties',
    implementationGuidance: 'Schedule annual reviews per high-risk system. Cover performance metrics, fairness metrics, monitoring outputs, incidents, and consumer feedback. Document findings, corrective actions, and approval to continue deployment.',
    evidenceRequirements: ['Annual review schedule', 'Per-system review reports', 'Corrective action records', 'Continuation approval signatures'],
    testProcedures: ['Inspect schedule for full coverage of high-risk systems', 'Sample review reports for completeness', 'Verify corrective actions closed or tracked'],
    status: 'Not Started'
  },

  // ===== Consumer Notice and Rights =====
  {
    controlId: 'COAI-4.1',
    name: 'Pre-Decision Consumer Notice',
    description: 'Deployers must notify consumers before a high-risk AI system is used to make or be a substantial factor in making a consequential decision concerning the consumer.',
    category: 'Consumer Rights',
    implementationGuidance: 'Generate pre-decision notices identifying the AI system, the decision type, and the consumer\'s rights. Deliver via the consumer\'s established channel before the decision. Retain delivery proof.',
    evidenceRequirements: ['Pre-decision notice template', 'Delivery logs per consumer', 'Channel verification records', 'Retention storage proof'],
    testProcedures: ['Review template against SB 24-205 notice elements', 'Sample decisions and verify pre-decision notice delivered', 'Confirm delivery timing precedes decision'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-4.2',
    name: 'Adverse Decision Notification',
    description: 'When a high-risk AI system contributes to an adverse consequential decision, deployers must notify the consumer of the principal reasons, the right to correct inaccurate personal data, and the right to appeal.',
    category: 'Consumer Rights',
    implementationGuidance: 'Generate adverse-decision letters listing principal reasons (top contributing factors), describing data correction channel, and explaining appeal process. Deliver promptly after the decision. Retain copies.',
    evidenceRequirements: ['Adverse-decision letter template', 'Principal-reason generation methodology', 'Sent letter records', 'Appeal intake records'],
    testProcedures: ['Inspect template for all required disclosures', 'Sample adverse decisions and verify letter issued', 'Trace appeals to intake and resolution'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-4.3',
    name: 'Consumer Right to Correct Personal Data',
    description: 'Consumers must be able to correct inaccurate personal data that the high-risk AI system processed in making the consequential decision.',
    category: 'Consumer Rights',
    implementationGuidance: 'Provide a correction intake form with identity verification. Route corrections to the data source system and re-evaluate the decision when corrections are material. Communicate updated outcome to the consumer.',
    evidenceRequirements: ['Correction intake interface', 'Identity verification records', 'Re-evaluation outcome log', 'Updated outcome communications'],
    testProcedures: ['Test correction submission end to end', 'Sample corrections and verify re-evaluation occurred', 'Confirm updated outcomes communicated'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-4.4',
    name: 'Consumer Appeal and Human Review',
    description: 'Consumers must have the right to appeal an adverse consequential decision and receive human review where technically feasible.',
    category: 'Consumer Rights',
    implementationGuidance: 'Implement an appeal workflow with intake, independent human reviewer assignment, fact gathering, decision, and communication. Define technical feasibility criteria where human review is not provided. Track outcomes.',
    evidenceRequirements: ['Appeal workflow procedure', 'Reviewer assignment and independence records', 'Appeal outcome log', 'Technical feasibility determinations where applicable'],
    testProcedures: ['Inspect workflow for SB 24-205 elements', 'Sample appeals and verify human reviewer documentation', 'Review feasibility memos for substantive analysis'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-4.5',
    name: 'AI Interaction Disclosure',
    description: 'Deployers must disclose to consumers that they are interacting with an AI system unless it would be obvious to a reasonable person.',
    category: 'Consumer Rights',
    implementationGuidance: 'Add explicit AI disclosure to consumer-facing AI interactions (chatbots, automated decision interfaces). Apply the reasonable-person test in documented form for cases where disclosure is omitted.',
    evidenceRequirements: ['Disclosure copy and UI placement screenshots', 'Reasonable-person test memos for omissions', 'Display event audit logs', 'Periodic UX review reports'],
    testProcedures: ['Inspect disclosure placement on representative interfaces', 'Review reasonable-person memos for analysis quality', 'Verify display logs for sample interactions'],
    status: 'Not Started'
  },

  // ===== Algorithmic Discrimination Prevention =====
  {
    controlId: 'COAI-5.1',
    name: 'Algorithmic Discrimination Risk Assessment',
    description: 'Identify and assess reasonably foreseeable risks of algorithmic discrimination arising from the intended use of high-risk AI systems.',
    category: 'Algorithmic Discrimination',
    implementationGuidance: 'Build an algorithmic discrimination risk framework covering protected characteristics, proxy variables, and intersectional effects. Document risk identification per system, severity rating, and mitigation plan.',
    evidenceRequirements: ['Risk framework document', 'Per-system discrimination risk assessment', 'Severity rating rationale', 'Mitigation plan tracking'],
    testProcedures: ['Inspect framework coverage of protected characteristics', 'Sample assessments for substantive analysis', 'Verify mitigation plan execution'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-5.2',
    name: 'Bias Testing Pre-Deployment',
    description: 'Test high-risk AI systems for disparate impact and accuracy parity across protected characteristics before deployment.',
    category: 'Algorithmic Discrimination',
    implementationGuidance: 'Define fairness metrics (e.g., demographic parity, equal opportunity, predictive parity) appropriate to the use case. Run pre-deployment bias tests with documented thresholds. Block deployment when thresholds are exceeded without an approved exception.',
    evidenceRequirements: ['Fairness metric catalog per use case', 'Pre-deployment bias test reports', 'Threshold documentation', 'Exception approval records'],
    testProcedures: ['Review metric catalog against use case context', 'Sample deployments and verify bias test on file', 'Confirm exceptions are approved at appropriate level'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-5.3',
    name: 'Continuous Discrimination Monitoring',
    description: 'Monitor deployed high-risk AI systems for emergent algorithmic discrimination and respond to detected issues.',
    category: 'Algorithmic Discrimination',
    implementationGuidance: 'Run scheduled fairness re-evaluations on production traffic samples. Generate alerts on threshold breaches. Investigate alerts and document remediation. Report systemic findings to risk management.',
    evidenceRequirements: ['Monitoring schedule and methodology', 'Production fairness reports', 'Alert investigation records', 'Risk management reporting log'],
    testProcedures: ['Inspect monitoring schedule against approved frequency', 'Sample alerts and trace to resolution', 'Verify risk management received reports'],
    status: 'Not Started'
  },

  // ===== Attorney General Reporting =====
  {
    controlId: 'COAI-6.1',
    name: 'Discovered Discrimination Reporting to AG',
    description: 'Deployers must disclose to the Attorney General when they discover algorithmic discrimination caused by a high-risk AI system within statutory timeframes.',
    category: 'Enforcement',
    implementationGuidance: 'Define a discovery trigger (e.g., confirmed disparate impact above threshold, consumer complaints with substantiation). Stand up a disclosure workflow with statutory-day clock and AG channel. Capture submission and acknowledgment.',
    evidenceRequirements: ['Discovery trigger definition', 'Disclosure workflow with day-clock mechanics', 'Submitted AG disclosures', 'AG acknowledgment records'],
    testProcedures: ['Inspect trigger criteria against SB 24-205', 'Sample discoveries and verify disclosure within statutory window', 'Confirm AG acknowledgment retained'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-6.2',
    name: 'AG Inquiry Response Procedure',
    description: 'Establish procedures to respond to Attorney General inquiries, civil investigative demands, and enforcement actions under SB 24-205.',
    category: 'Enforcement',
    implementationGuidance: 'Designate a TRAIGA legal point of contact. Document an intake, triage, evidence preservation, response, and document production workflow. Run an annual tabletop exercise.',
    evidenceRequirements: ['Designated contact roster', 'Inquiry response procedure', 'Evidence preservation protocol', 'Tabletop exercise after-action report'],
    testProcedures: ['Verify contact roster currency', 'Walk through the procedure with legal team', 'Review tabletop report for remediation actions'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-6.3',
    name: 'Affirmative Defense Documentation',
    description: 'Maintain documentation supporting the rebuttable presumption of reasonable care available to deployers who comply with the Act\'s required programs and assessments.',
    category: 'Enforcement',
    implementationGuidance: 'Bundle impact assessments, risk management policies, monitoring outputs, and notice records into an affirmative-defense evidence package per high-risk system. Update annually. Make readily producible on AG request.',
    evidenceRequirements: ['Affirmative-defense evidence packages', 'Annual update log', 'Index for rapid production', 'Legal review attestation'],
    testProcedures: ['Inspect package completeness against SB 24-205 elements', 'Sample systems and verify package current', 'Confirm legal review signature within review cycle'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-6.4',
    name: 'Governance and Accountability Structure',
    description: 'Establish governance roles, including a senior accountable executive and an AI governance committee, with documented responsibilities under the Act.',
    category: 'Governance',
    implementationGuidance: 'Charter an AI governance committee with cross-functional membership. Designate a senior accountable executive responsible for SB 24-205 compliance. Document responsibilities, reporting lines, and meeting cadence.',
    evidenceRequirements: ['AI governance committee charter', 'Executive accountability designation', 'Meeting minutes', 'Reporting line diagram'],
    testProcedures: ['Review charter against Act\'s governance expectations', 'Verify executive designation is current', 'Sample meeting minutes for substantive review'],
    status: 'Not Started'
  },
  {
    controlId: 'COAI-6.5',
    name: 'Workforce Training on AI Discrimination Risks',
    description: 'Train personnel involved in developing, evaluating, deploying, and reviewing high-risk AI systems on algorithmic discrimination risks and the Act\'s requirements.',
    category: 'Governance',
    implementationGuidance: 'Build a role-based training program covering SB 24-205 obligations, discrimination concepts, and incident reporting. Track completion and refresh annually. Capture comprehension via quizzes.',
    evidenceRequirements: ['Role-based training curriculum', 'Completion records', 'Comprehension quiz results', 'Annual refresh log'],
    testProcedures: ['Review curriculum against SB 24-205 obligations', 'Sample completion records for in-scope personnel', 'Inspect quiz results for pass rates'],
    status: 'Not Started'
  }
];
