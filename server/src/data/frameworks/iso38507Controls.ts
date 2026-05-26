import { FrameworkControlTemplate } from './soc2Controls';

/**
 * ISO/IEC 38507:2022 - Information technology — Governance of IT — Governance implications of the use of AI by organizations
 *
 * Provides guidance for members of the governing body of an organization
 * (board of directors, owners, executive leadership) to enable and govern
 * the use of artificial intelligence. Extends the ISO/IEC 38500 family of
 * IT governance standards with AI-specific governance considerations.
 *
 * Structure:
 *   Clause 5: Governance principles for AI use
 *   Clause 6: Governance system establishment
 *   Clause 7: Evaluating, directing, and monitoring the use of AI (per ISO 38500 EDM model)
 */
export const ISO_38507_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Clause 5: Governance Principles =====
  {
    controlId: '5.1',
    name: 'Governance principle of responsibility for AI use',
    description: 'The governing body shall accept responsibility for the use of AI within the organization, ensuring accountability cannot be delegated entirely to algorithms, suppliers, or operational staff.',
    category: 'Governance Principles',
    implementationGuidance: 'Document board-level accountability for AI in board charters and committee terms of reference. Name a board sponsor for AI. Require board approval for high-impact AI deployment. Reinforce accountability in executive performance contracts.',
    evidenceRequirements: ['Board charter referencing AI accountability', 'Committee terms of reference', 'Board sponsor designation record', 'Executive contracts including AI accountability'],
    testProcedures: ['Inspect charter for AI clauses', 'Verify board sponsor named and active', 'Sample executive contracts for AI accountability language'],
    status: 'Not Started'
  },
  {
    controlId: '5.2',
    name: 'Governance principle of strategy alignment for AI use',
    description: 'The governing body shall ensure AI strategy is aligned with the organization\'s overall strategy, values, risk appetite, and stakeholder expectations.',
    category: 'Governance Principles',
    implementationGuidance: 'Approve an AI strategy document linking AI initiatives to enterprise strategy and values. Review alignment annually. Reject AI initiatives that conflict with organizational values. Communicate alignment to stakeholders.',
    evidenceRequirements: ['Approved AI strategy document', 'Strategy-to-AI initiative mapping', 'Annual alignment review minutes', 'Rejected-initiative records'],
    testProcedures: ['Inspect strategy document and approval', 'Sample initiatives for strategy linkage', 'Verify annual review evidence'],
    status: 'Not Started'
  },
  {
    controlId: '5.3',
    name: 'Governance principle of acquisition for AI',
    description: 'AI acquisitions including build-versus-buy decisions, supplier selection, and licensing arrangements shall be made for valid reasons on the basis of appropriate, ongoing analysis and clear, transparent decision-making.',
    category: 'Governance Principles',
    implementationGuidance: 'Establish board oversight thresholds for material AI acquisitions. Require business case, risk assessment, and strategic fit analysis for above-threshold acquisitions. Document decisions and dissenting views. Review acquisition outcomes against business case.',
    evidenceRequirements: ['AI acquisition oversight policy and thresholds', 'Business cases for above-threshold acquisitions', 'Board decision records', 'Outcome review reports'],
    testProcedures: ['Inspect oversight policy', 'Sample above-threshold acquisitions for business case', 'Verify outcome reviews against business case'],
    status: 'Not Started'
  },
  {
    controlId: '5.4',
    name: 'Governance principle of performance for AI use',
    description: 'AI shall be fit for purpose in supporting the organization, providing the services, levels of service, and quality required to meet current and future business requirements.',
    category: 'Governance Principles',
    implementationGuidance: 'Define AI performance expectations at the strategic level (e.g., business outcomes, customer experience, risk reduction). Receive periodic performance reports. Intervene when AI fails to meet expectations. Re-baseline expectations as the business evolves.',
    evidenceRequirements: ['Strategic AI performance expectations document', 'Periodic AI performance reports to board', 'Intervention records', 'Re-baselining decisions'],
    testProcedures: ['Inspect performance expectations', 'Verify periodic reporting cadence', 'Sample interventions for board involvement'],
    status: 'Not Started'
  },
  {
    controlId: '5.5',
    name: 'Governance principle of conformance for AI use',
    description: 'The use of AI shall comply with all mandatory legislation and regulations, contractual obligations, and organizational policies, with conformance verified and reported.',
    category: 'Governance Principles',
    implementationGuidance: 'Maintain a register of applicable AI legal and regulatory obligations across all operating jurisdictions. Receive conformance reports from management. Direct corrective action on non-conformances. Engage external assurance where appropriate.',
    evidenceRequirements: ['AI legal/regulatory register', 'Conformance reports to board', 'Corrective action directives', 'External assurance reports'],
    testProcedures: ['Inspect register currency', 'Verify conformance reporting cadence', 'Sample corrective actions for closure'],
    status: 'Not Started'
  },
  {
    controlId: '5.6',
    name: 'Governance principle of human behavior for AI use',
    description: 'AI governance shall recognize that human behavior, including biases, expertise, and ethical perspectives, influences the design, deployment, and effective use of AI systems.',
    category: 'Governance Principles',
    implementationGuidance: 'Promote a culture of ethical AI use. Embed human factor considerations in board AI discussions. Require workforce training including bias awareness and ethical reasoning. Monitor culture indicators (whistleblower reports, employee surveys).',
    evidenceRequirements: ['AI ethics culture statement', 'Workforce training programs', 'Culture monitoring indicators', 'Board minutes referencing human factors'],
    testProcedures: ['Inspect culture statement adoption', 'Verify training completion rates', 'Sample board minutes for human-factor discussion'],
    status: 'Not Started'
  },

  // ===== Clause 6: Governance System Establishment =====
  {
    controlId: '6.1.1',
    name: 'Governance system for AI',
    description: 'The governing body shall establish and maintain a governance system for the use of AI, including structures, processes, policies, and accountabilities aligned with the broader IT governance system.',
    category: 'Governance System',
    implementationGuidance: 'Document the AI governance system covering board committees, executive structures, advisory groups, and reporting lines. Integrate with existing IT, risk, and compliance governance. Review system effectiveness annually.',
    evidenceRequirements: ['AI governance system document', 'Integration map with IT/risk/compliance governance', 'Effectiveness review minutes', 'Updates following reviews'],
    testProcedures: ['Inspect governance system documentation', 'Verify integration with adjacent governance', 'Confirm annual review evidence'],
    status: 'Not Started'
  },
  {
    controlId: '6.1.2',
    name: 'AI governance roles',
    description: 'Roles and responsibilities for AI governance shall be defined and allocated, distinguishing between the governing body, executive management, AI-specific oversight bodies, and operational owners.',
    category: 'Governance System',
    implementationGuidance: 'Publish a role matrix covering the board, AI ethics committee, CIO/CTO, CAIO if appointed, model owners, and assurance functions. Avoid concentration of duties. Provide induction for each role.',
    evidenceRequirements: ['AI governance role matrix', 'Separation-of-duties analysis', 'Role induction materials', 'Appointment records'],
    testProcedures: ['Inspect matrix completeness', 'Verify SoD across critical roles', 'Sample appointments for induction evidence'],
    status: 'Not Started'
  },
  {
    controlId: '6.2',
    name: 'AI policies and policy framework',
    description: 'The governing body shall ensure that a coherent set of AI policies is established, approved, communicated, and maintained, including ethics, acceptable use, risk, and human oversight policies.',
    category: 'Governance System',
    implementationGuidance: 'Maintain an AI policy framework with a clear hierarchy (overarching policy, standards, procedures). Obtain governing body approval for top-level policy. Communicate policies organization-wide. Review on regulatory change.',
    evidenceRequirements: ['AI policy framework document', 'Approved policies and standards', 'Communication and acknowledgment records', 'Review history'],
    testProcedures: ['Inspect framework hierarchy', 'Verify top-level approval signatures', 'Sample staff for acknowledgment'],
    status: 'Not Started'
  },
  {
    controlId: '6.3',
    name: 'Governance interactions with AI risk and compliance',
    description: 'The governance system for AI shall interact effectively with risk management, compliance, internal audit, and information security functions to deliver integrated assurance to the governing body.',
    category: 'Governance System',
    implementationGuidance: 'Define interaction protocols between AI governance bodies and risk/compliance/audit/security functions. Schedule joint sessions on AI topics. Coordinate assurance plans. Avoid duplicated or conflicting requests on operational teams.',
    evidenceRequirements: ['Interaction protocol document', 'Joint session minutes', 'Coordinated assurance plan', 'Operational team feedback on coordination'],
    testProcedures: ['Inspect protocol document', 'Verify joint session occurrence', 'Sample assurance activities for coordination evidence'],
    status: 'Not Started'
  },

  // ===== Clause 7: Evaluate-Direct-Monitor Use of AI =====
  // ----- Evaluate -----
  {
    controlId: '7.1.1',
    name: 'Evaluating organizational context for AI use',
    description: 'The governing body shall evaluate the organizational context affecting the use of AI, including business strategy, operating environment, stakeholder expectations, and capability maturity.',
    category: 'Evaluate Use of AI',
    implementationGuidance: 'Commission an annual AI context evaluation covering market, regulatory, technological, and stakeholder dimensions. Discuss findings at board level. Use findings to inform strategy and risk appetite. Re-evaluate on disruptive events.',
    evidenceRequirements: ['Annual AI context evaluation report', 'Board discussion minutes', 'Strategy/risk-appetite updates derived from evaluation', 'Disruption-triggered re-evaluations'],
    testProcedures: ['Inspect evaluation report scope', 'Verify board discussion evidence', 'Sample disruption events for re-evaluation'],
    status: 'Not Started'
  },
  {
    controlId: '7.1.2',
    name: 'Evaluating AI capabilities and limitations',
    description: 'The governing body shall evaluate the organization\'s current and future AI capabilities, the limitations of AI technologies under consideration, and the resulting opportunities and constraints.',
    category: 'Evaluate Use of AI',
    implementationGuidance: 'Receive periodic briefings on AI technology trends, internal capability maturity, and limitations of deployed and prospective AI systems. Engage external expertise when needed. Document the board\'s understanding of limitations.',
    evidenceRequirements: ['Capability briefing materials', 'Maturity assessment reports', 'External expert engagement records', 'Board understanding statements'],
    testProcedures: ['Inspect briefing cadence', 'Sample maturity reports for currency', 'Verify external expert involvement'],
    status: 'Not Started'
  },
  {
    controlId: '7.1.3',
    name: 'Evaluating alignment of AI use with strategy and values',
    description: 'The governing body shall evaluate whether proposed and existing AI uses align with the organization\'s strategy, values, and stakeholder commitments, including ethical, social, and environmental considerations.',
    category: 'Evaluate Use of AI',
    implementationGuidance: 'Apply an alignment evaluation framework to material AI initiatives. Surface conflicts at the board. Require resolution before approval. Re-evaluate alignment when strategy or values evolve.',
    evidenceRequirements: ['Alignment evaluation framework', 'Initiative-specific evaluations', 'Conflict resolution records', 'Re-evaluation history'],
    testProcedures: ['Inspect framework criteria', 'Sample initiatives for alignment evaluation', 'Verify conflict resolution closure'],
    status: 'Not Started'
  },
  {
    controlId: '7.1.4',
    name: 'Evaluating AI risks and opportunities',
    description: 'The governing body shall evaluate both the risks created by the use of AI and the opportunities AI presents for the organization and its stakeholders.',
    category: 'Evaluate Use of AI',
    implementationGuidance: 'Receive integrated AI risk-and-opportunity reports covering strategic, operational, ethical, legal, and reputational dimensions. Challenge management on assumptions. Balance risk mitigation with opportunity capture.',
    evidenceRequirements: ['Integrated AI risk-and-opportunity reports', 'Board challenge records', 'Balanced decision documentation', 'Reporting templates'],
    testProcedures: ['Inspect report templates and content', 'Sample board minutes for challenge evidence', 'Verify decisions reflect balance'],
    status: 'Not Started'
  },

  // ----- Direct -----
  {
    controlId: '7.2.1',
    name: 'Directing AI policies and accountabilities',
    description: 'The governing body shall direct the implementation of AI policies and assign accountabilities for delivering on policy commitments throughout the organization.',
    category: 'Direct Use of AI',
    implementationGuidance: 'Issue formal directives translating board-approved AI policies into management action. Allocate accountabilities to named executives. Set deadlines and milestones. Track delivery against directives.',
    evidenceRequirements: ['Board directives implementing AI policies', 'Accountability allocation records', 'Delivery milestone tracker', 'Status reports'],
    testProcedures: ['Inspect directives and accountability matrix', 'Verify milestone tracking', 'Sample status reports for accuracy'],
    status: 'Not Started'
  },
  {
    controlId: '7.2.2',
    name: 'Directing AI resource allocation',
    description: 'The governing body shall direct the allocation of resources necessary to deliver AI strategy, including financial, human, technological, and informational resources.',
    category: 'Direct Use of AI',
    implementationGuidance: 'Approve AI budget envelopes through normal capital allocation processes. Direct executive management to acquire critical AI talent, technology, and data assets. Reallocate when priorities shift. Receive resource utilization reports.',
    evidenceRequirements: ['Approved AI budget allocations', 'Directives on talent and technology acquisition', 'Reallocation decisions', 'Utilization reports'],
    testProcedures: ['Inspect budget approvals', 'Verify executive directives are tracked', 'Sample utilization for variance analysis'],
    status: 'Not Started'
  },
  {
    controlId: '7.2.3',
    name: 'Directing AI risk treatment within risk appetite',
    description: 'The governing body shall direct AI risk treatment so that residual risks remain within the organization\'s articulated risk appetite, including ethical and reputational tolerances.',
    category: 'Direct Use of AI',
    implementationGuidance: 'Maintain an AI risk appetite statement covering financial, operational, ethical, and reputational tolerances. Approve treatment plans for risks above appetite. Suspend AI use that cannot be brought within appetite. Review appetite annually.',
    evidenceRequirements: ['AI risk appetite statement', 'Treatment plan approvals for above-appetite risks', 'Suspension decision records', 'Annual appetite review'],
    testProcedures: ['Inspect appetite statement comprehensiveness', 'Sample above-appetite treatments for approval', 'Verify annual review evidence'],
    status: 'Not Started'
  },
  {
    controlId: '7.2.4',
    name: 'Directing stakeholder engagement on AI use',
    description: 'The governing body shall direct meaningful engagement with stakeholders whose interests are or may be affected by the organization\'s use of AI, including transparency commitments and feedback mechanisms.',
    category: 'Direct Use of AI',
    implementationGuidance: 'Approve a stakeholder engagement strategy for AI covering customers, employees, regulators, communities, and civil society. Direct management to implement engagement and feedback channels. Receive engagement summaries.',
    evidenceRequirements: ['Approved stakeholder engagement strategy', 'Engagement and feedback channel inventory', 'Engagement summary reports', 'Stakeholder input acted upon'],
    testProcedures: ['Inspect engagement strategy', 'Verify channel inventory operational', 'Sample feedback for action evidence'],
    status: 'Not Started'
  },

  // ----- Monitor -----
  {
    controlId: '7.3.1',
    name: 'Monitoring AI performance against strategic objectives',
    description: 'The governing body shall monitor the performance of AI use against strategic objectives, intended benefits, and stakeholder commitments, taking action where performance falls short.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Define a balanced scorecard for AI performance covering business outcomes, risk, ethics, and stakeholder satisfaction. Receive quarterly scorecard reports. Hold management accountable for missed targets. Adjust strategy where performance signals a need.',
    evidenceRequirements: ['AI balanced scorecard definition', 'Quarterly scorecard reports', 'Accountability records', 'Strategy adjustments'],
    testProcedures: ['Inspect scorecard for balance', 'Verify quarterly reporting evidence', 'Sample accountability actions'],
    status: 'Not Started'
  },
  {
    controlId: '7.3.2',
    name: 'Monitoring AI conformance with legal, regulatory, and policy requirements',
    description: 'The governing body shall monitor conformance of AI use with applicable laws, regulations, and organizational policies, receiving regular reports and acting on non-conformances.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Receive periodic conformance dashboards from compliance and internal audit. Maintain a register of non-conformances and remediation status. Direct corrective action and verify closure. Engage external assurance providers as appropriate.',
    evidenceRequirements: ['Conformance dashboards', 'Non-conformance register', 'Remediation tracking', 'External assurance reports'],
    testProcedures: ['Inspect dashboard cadence and content', 'Sample non-conformances for closure', 'Verify external assurance scope'],
    status: 'Not Started'
  },
  {
    controlId: '7.3.3',
    name: 'Monitoring ethical use of AI',
    description: 'The governing body shall monitor the ethical use of AI by the organization, including fairness, transparency, human oversight, and respect for human rights and dignity.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Establish ethics monitoring covering fairness metrics, transparency disclosures, oversight effectiveness, and incident analysis. Receive reports from an ethics committee. Investigate ethics concerns from any channel. Act on findings.',
    evidenceRequirements: ['Ethics monitoring metrics', 'Ethics committee reports', 'Investigation records', 'Action records'],
    testProcedures: ['Inspect ethics metric coverage', 'Verify committee reporting cadence', 'Sample investigations for closure'],
    status: 'Not Started'
  },
  {
    controlId: '7.3.4',
    name: 'Monitoring societal and human-impact considerations of AI use',
    description: 'The governing body shall monitor risks to humanity and society from the organization\'s AI use, including potential harms to vulnerable groups, environmental impacts, and broader societal effects.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Conduct annual societal impact reviews covering vulnerable groups, environmental footprint, labour effects, and information ecosystem impacts. Engage external civil society perspectives. Publish a societal impact statement.',
    evidenceRequirements: ['Annual societal impact review report', 'Vulnerable-group analyses', 'Environmental footprint metrics', 'Published societal impact statement'],
    testProcedures: ['Inspect review scope and methodology', 'Verify civil society engagement', 'Confirm public statement publication'],
    status: 'Not Started'
  },
  {
    controlId: '7.4',
    name: 'Monitoring AI incidents and crisis response',
    description: 'The governing body shall monitor the organization\'s preparedness for and response to AI-related incidents and crises, including communication, escalation, learning, and external reporting obligations.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Receive briefings on the AI incident response capability. Be informed promptly of material AI incidents. Direct post-incident reviews. Verify learning is institutionalized via control updates.',
    evidenceRequirements: ['AI incident response capability briefings', 'Material incident notification log', 'Post-incident review reports', 'Control update records'],
    testProcedures: ['Inspect briefing cadence', 'Sample incidents for board notification evidence', 'Verify learning reflected in controls'],
    status: 'Not Started'
  },
  {
    controlId: '7.5',
    name: 'Monitoring third-party AI dependencies',
    description: 'The governing body shall monitor the organization\'s dependence on third-party AI providers, including concentration risk, contractual protections, and continuity arrangements.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Maintain a register of material third-party AI dependencies. Review concentration risk annually. Receive briefings on key supplier health, contract renewals, and continuity arrangements. Direct diversification when concentration exceeds tolerance.',
    evidenceRequirements: ['Third-party AI dependency register', 'Concentration risk analyses', 'Supplier health briefings', 'Continuity arrangement documentation'],
    testProcedures: ['Inspect register completeness', 'Verify concentration analysis cadence', 'Sample diversification directives'],
    status: 'Not Started'
  },
  {
    controlId: '7.6',
    name: 'Monitoring continual improvement of AI governance',
    description: 'The governing body shall monitor and direct continual improvement of the AI governance system itself, including maturity, effectiveness, and adaptation to emerging issues.',
    category: 'Monitor Use of AI',
    implementationGuidance: 'Commission periodic AI governance maturity assessments. Benchmark against peers and standards. Direct improvement priorities. Track improvement delivery. Refresh governance practices in response to lessons learned.',
    evidenceRequirements: ['Governance maturity assessment reports', 'Benchmarking studies', 'Improvement priority directives', 'Delivery tracking'],
    testProcedures: ['Inspect assessment methodology', 'Verify benchmarking inputs', 'Sample improvement priorities for delivery evidence'],
    status: 'Not Started'
  }
];
