import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Texas Responsible AI Governance Act (TRAIGA / HB 149)
 *
 * Effective January 1, 2026. Establishes a risk-based framework for AI
 * developers and deployers operating in Texas, with Attorney General
 * enforcement, a mandatory 60-day cure period, sandbox provisions, and
 * specific restrictions on biometric AI and government AI use.
 */
export const TRAIGA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Scope and Applicability =====
  {
    controlId: 'TRAIGA-1.1',
    name: 'Jurisdictional Scope Determination',
    description: 'Determine whether the organization develops, deploys, or makes available AI systems to Texas residents, triggering TRAIGA applicability regardless of physical location.',
    category: 'Scope and Applicability',
    implementationGuidance: 'Inventory all AI systems and identify those offered to or used on Texas residents. Document data flows showing Texas resident interaction. Map each AI system to TRAIGA role (developer, deployer, distributor). Maintain a jurisdictional applicability register reviewed quarterly.',
    evidenceRequirements: ['AI system inventory with jurisdictional tags', 'Texas resident data flow diagrams', 'Role classification matrix (developer/deployer/distributor)', 'Quarterly applicability review minutes'],
    testProcedures: ['Inspect AI inventory for completeness against deployed systems', 'Trace sample user records to confirm Texas residency tagging', 'Verify role assignments align with actual system function'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-1.2',
    name: 'AI System Classification',
    description: 'Classify each AI system as high-risk, general-purpose, or out-of-scope based on TRAIGA definitions and use case context.',
    category: 'Scope and Applicability',
    implementationGuidance: 'Develop a written classification methodology aligned with HB 149 definitions of high-risk AI. Assess each system against consequential decision criteria (employment, education, financial services, healthcare, housing, insurance, legal services). Document classification rationale and approval by AI governance officer.',
    evidenceRequirements: ['Written AI classification methodology', 'Per-system classification records', 'Governance officer approval signatures', 'Annual reclassification reviews'],
    testProcedures: ['Review methodology against HB 149 high-risk definitions', 'Sample classifications and verify supporting rationale', 'Confirm classification changes trigger control updates'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-1.3',
    name: 'Role Assignment Between Developer and Deployer',
    description: 'Distinguish developer obligations from deployer obligations for each AI system and document the boundary in contractual terms.',
    category: 'Scope and Applicability',
    implementationGuidance: 'For each third-party AI system used, document whether the organization acts as deployer, developer, or both. Memorialize developer-deployer responsibility allocation in master service agreements. Update contracts when system function or modification status changes.',
    evidenceRequirements: ['Developer-deployer responsibility matrix', 'Executed MSAs with AI vendor obligations', 'Change-of-role notification records', 'Contract review log'],
    testProcedures: ['Sample vendor contracts and verify role allocation language', 'Trace a system modification event to confirm role reassessment', 'Confirm contractual indemnification aligns with assigned role'],
    status: 'Not Started'
  },

  // ===== Prohibited Practices =====
  {
    controlId: 'TRAIGA-2.1',
    name: 'Prohibition on Social Scoring Systems',
    description: 'Prevent development or deployment of AI systems that evaluate or classify individuals based on social behavior or personal characteristics leading to detrimental treatment.',
    category: 'Prohibited Practices',
    implementationGuidance: 'Establish a prohibited-use policy explicitly banning social scoring use cases. Add pre-deployment review checkpoint requiring prohibition screening. Maintain a register of rejected AI proposals citing the prohibition.',
    evidenceRequirements: ['Prohibited-use policy with social scoring clause', 'Pre-deployment screening checklist', 'Rejected proposal register', 'Training records on prohibited use cases'],
    testProcedures: ['Inspect policy for explicit social scoring prohibition', 'Sample deployed systems and verify screening completion', 'Review rejection register for substantive evaluation'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-2.2',
    name: 'Prohibition on Manipulative AI Systems',
    description: 'Prevent deployment of AI systems that use subliminal techniques or exploit vulnerabilities to materially distort a person\'s behavior in a manner that causes or is likely to cause harm.',
    category: 'Prohibited Practices',
    implementationGuidance: 'Conduct behavioral influence assessments for AI systems interacting with consumers. Reject any system designed to exploit cognitive, age-related, or disability-based vulnerabilities. Document harm-likelihood analysis with sign-off by legal and ethics counsel.',
    evidenceRequirements: ['Behavioral influence assessment reports', 'Vulnerability exploitation analysis', 'Legal and ethics sign-off records', 'Rejected design review records'],
    testProcedures: ['Review assessment methodology for vulnerability coverage', 'Sample consumer-facing AI and verify assessment performed', 'Confirm rejection workflow for non-compliant designs'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-2.3',
    name: 'Prohibition on Unlawful Discrimination Intent',
    description: 'Ensure AI systems are not developed or deployed with the intent to unlawfully discriminate against a protected class.',
    category: 'Prohibited Practices',
    implementationGuidance: 'Document development objectives and intended use cases for every AI system. Require attestations from product owners that the system\'s purpose does not include discriminatory intent. Conduct adversarial review by an independent reviewer.',
    evidenceRequirements: ['Documented system objectives', 'Product owner attestations', 'Independent intent-review reports', 'Discrimination-screening checklists'],
    testProcedures: ['Inspect objective documentation for protected-class targeting', 'Sample attestations for completeness and signature', 'Review independent reviewer credentials and findings'],
    status: 'Not Started'
  },

  // ===== High-Risk AI Developer Obligations =====
  {
    controlId: 'TRAIGA-3.1',
    name: 'Developer Documentation Package',
    description: 'Developers of high-risk AI must provide deployers with documentation sufficient to complete an impact assessment, including intended uses, known limitations, training data summary, and performance metrics.',
    category: 'Developer Duties',
    implementationGuidance: 'Build a standardized developer disclosure template covering intended uses, foreseeable misuse, training data characteristics, evaluation results, bias testing, and known limitations. Version-control the package and update on material model changes. Deliver to deployers before any production use.',
    evidenceRequirements: ['Developer disclosure template', 'Versioned disclosure packages per model release', 'Deployer delivery confirmations', 'Material change update log'],
    testProcedures: ['Review template against HB 149 disclosure elements', 'Sample releases and verify deployer receipt', 'Confirm update workflow triggered by model changes'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-3.2',
    name: 'Intentional and Substantial Modification Notice',
    description: 'Developers must notify deployers when an AI system is intentionally and substantially modified in a manner that affects its high-risk classification or performance characteristics.',
    category: 'Developer Duties',
    implementationGuidance: 'Define what constitutes a substantial modification (e.g., architecture change, retraining on new data, expanded use cases). Build a notification workflow with deployer contact list. Issue written notices within a defined cure window before deployment.',
    evidenceRequirements: ['Substantial modification definition document', 'Notification workflow procedure', 'Sent notice records with timestamps', 'Deployer acknowledgment log'],
    testProcedures: ['Inspect modification definition for clarity', 'Sample model changes and verify notice issuance', 'Confirm notice content meets statutory elements'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-3.3',
    name: 'Developer Risk Management Policy',
    description: 'Developers must establish and maintain a risk management policy addressing identification, measurement, and mitigation of risks associated with high-risk AI systems.',
    category: 'Developer Duties',
    implementationGuidance: 'Adopt an AI risk management framework (e.g., NIST AI RMF). Define risk categories including discrimination, safety, privacy, and security. Document mitigation measures and residual risk acceptance. Review policy annually with executive approval.',
    evidenceRequirements: ['Approved AI risk management policy', 'Risk register per AI system', 'Mitigation evidence per identified risk', 'Annual policy review minutes'],
    testProcedures: ['Compare policy to NIST AI RMF coverage', 'Sample risks and verify mitigation evidence', 'Confirm annual review with executive signature'],
    status: 'Not Started'
  },

  // ===== High-Risk AI Deployer Obligations =====
  {
    controlId: 'TRAIGA-4.1',
    name: 'Deployer Impact Assessment',
    description: 'Deployers of high-risk AI must complete an impact assessment before deployment and on material modification, addressing purpose, benefits, risks, mitigation, and oversight.',
    category: 'Deployer Duties',
    implementationGuidance: 'Adopt an impact assessment template that captures system purpose, affected population, data categories, foreseeable risks, mitigations, monitoring approach, and human oversight design. Require approval by AI governance officer. Refresh on material change.',
    evidenceRequirements: ['Impact assessment template', 'Completed assessments per high-risk deployment', 'Governance officer approval signatures', 'Refresh log on material changes'],
    testProcedures: ['Review template against HB 149 assessment elements', 'Sample deployments and verify assessment on file', 'Confirm material-change triggers a refresh'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-4.2',
    name: 'Reasonable Care Duty',
    description: 'Deployers must exercise reasonable care to protect consumers from known or reasonably foreseeable risks of algorithmic discrimination arising from intended use of high-risk AI.',
    category: 'Deployer Duties',
    implementationGuidance: 'Operationalize reasonable care via documented procedures: pre-deployment bias testing, post-deployment monitoring, drift detection, periodic re-evaluation, and incident response. Capture care actions in an audit trail.',
    evidenceRequirements: ['Reasonable care procedure document', 'Bias testing reports', 'Monitoring dashboards and drift alerts', 'Care-action audit trail'],
    testProcedures: ['Inspect procedure for HB 149 reasonable-care elements', 'Sample deployments and verify monitoring evidence', 'Trace a drift alert through to remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-4.3',
    name: 'Human Oversight of High-Risk AI Decisions',
    description: 'Deployers must implement human oversight commensurate with the risk of the AI system, including the ability to review, override, and override significant decisions.',
    category: 'Deployer Duties',
    implementationGuidance: 'Design human-in-the-loop or human-on-the-loop controls per system. Define decision categories requiring mandatory human review. Train reviewers on system limitations and override criteria. Log review and override events.',
    evidenceRequirements: ['Oversight design documentation per system', 'Reviewer training records', 'Decision review and override logs', 'Periodic oversight effectiveness reports'],
    testProcedures: ['Review oversight design for risk commensurability', 'Sample decisions and verify human review documentation', 'Test override workflow end to end'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-4.4',
    name: 'Post-Deployment Monitoring',
    description: 'Deployers must monitor high-risk AI systems in production to detect performance degradation, algorithmic discrimination, and unintended outcomes.',
    category: 'Deployer Duties',
    implementationGuidance: 'Define monitoring metrics covering accuracy, fairness, drift, and operational reliability. Set alert thresholds. Investigate alerts and document outcomes. Issue periodic monitoring reports to governance.',
    evidenceRequirements: ['Defined monitoring metric catalog', 'Alert threshold documentation', 'Investigation outcome records', 'Periodic monitoring reports'],
    testProcedures: ['Review metric catalog for fairness coverage', 'Sample alerts and verify investigation closure', 'Confirm governance receipt of periodic reports'],
    status: 'Not Started'
  },

  // ===== Consumer Transparency =====
  {
    controlId: 'TRAIGA-5.1',
    name: 'Consumer Disclosure of AI Interaction',
    description: 'Deployers must provide clear and conspicuous disclosure to consumers interacting with high-risk AI systems prior to or at the time of the interaction.',
    category: 'Consumer Transparency',
    implementationGuidance: 'Draft disclosure language in plain English and Spanish where applicable. Surface disclosure in the user interface ahead of the AI interaction. Track disclosure-display events in audit logs.',
    evidenceRequirements: ['Disclosure copy in required languages', 'UI screenshots showing placement', 'Display event audit logs', 'Consumer comprehension testing reports'],
    testProcedures: ['Inspect disclosure copy for plain-language standard', 'Verify placement is conspicuous via UX walkthrough', 'Sample audit logs for display confirmation'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-5.2',
    name: 'Consumer Notice of Consequential Decisions',
    description: 'When an AI system contributes to a consequential decision affecting a consumer, the deployer must inform the consumer of the AI involvement and provide an explanation of the principal factors.',
    category: 'Consumer Transparency',
    implementationGuidance: 'Generate decision notices that identify AI involvement, list principal factors, and provide instructions to request human review. Deliver notice via the consumer\'s preferred channel. Retain copies for the statutory record period.',
    evidenceRequirements: ['Notice template per decision type', 'Generated notice records', 'Delivery confirmation logs', 'Retention policy and storage proof'],
    testProcedures: ['Review notice template for required elements', 'Sample decisions and verify notice delivery', 'Confirm retention period compliance'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-5.3',
    name: 'Consumer Right to Appeal AI Decisions',
    description: 'Consumers must be able to request human review and appeal an adverse consequential decision substantially based on a high-risk AI system.',
    category: 'Consumer Transparency',
    implementationGuidance: 'Publish an appeal process with intake channels, response SLA, reviewer independence requirements, and decision communication. Track appeals through case management with metrics on overturn rate.',
    evidenceRequirements: ['Published appeal process document', 'Appeal intake records', 'Reviewer assignment and independence attestations', 'Appeal outcome metrics'],
    testProcedures: ['Inspect process for HB 149 appeal elements', 'Sample appeals and verify reviewer independence', 'Confirm response within published SLA'],
    status: 'Not Started'
  },

  // ===== Biometric AI Restrictions =====
  {
    controlId: 'TRAIGA-6.1',
    name: 'Biometric Identifier Consent',
    description: 'AI systems processing biometric identifiers must obtain affirmative consumer consent and provide a means to withdraw consent.',
    category: 'Biometric AI',
    implementationGuidance: 'Implement consent capture with timestamp, scope, and retention disclosure. Build a withdrawal interface tied to deletion workflow. Maintain consent registry queryable by consumer identifier.',
    evidenceRequirements: ['Consent capture interface screenshots', 'Consent registry with timestamps', 'Withdrawal workflow documentation', 'Deletion confirmation records'],
    testProcedures: ['Review consent UI for required disclosures', 'Sample registry entries for completeness', 'Test withdrawal-to-deletion path end to end'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-6.2',
    name: 'Biometric Data Retention and Destruction',
    description: 'Biometric identifiers must not be retained longer than necessary for the disclosed purpose and must be destroyed upon purpose completion or consumer withdrawal.',
    category: 'Biometric AI',
    implementationGuidance: 'Define retention schedules per biometric use case. Automate destruction at expiry or withdrawal. Maintain destruction certificates with cryptographic proof where feasible.',
    evidenceRequirements: ['Retention schedule documentation', 'Automated destruction job logs', 'Destruction certificates', 'Quarterly retention audits'],
    testProcedures: ['Inspect retention schedule against disclosed purpose', 'Sample biometric records past retention and verify destruction', 'Review destruction certificate authenticity'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-6.3',
    name: 'Prohibited Biometric Uses',
    description: 'AI systems must not use biometric identifiers for prohibited purposes including unauthorized identification of individuals in public spaces or building social scoring profiles.',
    category: 'Biometric AI',
    implementationGuidance: 'Document permitted biometric use cases and explicitly enumerate prohibited uses. Block prohibited use case requests at API gateway. Audit access logs monthly for prohibited-use indicators.',
    evidenceRequirements: ['Permitted and prohibited use registry', 'API gateway block rules', 'Monthly access audit reports', 'Investigation records for flagged events'],
    testProcedures: ['Inspect registry against HB 149 prohibitions', 'Test gateway blocks with synthetic prohibited requests', 'Review audit reports for completeness'],
    status: 'Not Started'
  },

  // ===== AI Sandbox =====
  {
    controlId: 'TRAIGA-7.1',
    name: 'Sandbox Application and Approval',
    description: 'Organizations participating in the TRAIGA AI regulatory sandbox must submit applications detailing the AI system, intended testing scope, consumer protections, and exit strategy.',
    category: 'AI Sandbox',
    implementationGuidance: 'Prepare a sandbox application package including system description, risk assessment, consumer protection plan, success metrics, and graduation criteria. Obtain executive approval before submission. Track regulator correspondence.',
    evidenceRequirements: ['Submitted application package', 'Executive approval record', 'Regulator correspondence log', 'Approval or denial notice'],
    testProcedures: ['Review application against HB 149 sandbox requirements', 'Verify executive approval predates submission', 'Confirm regulator response retained'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-7.2',
    name: 'Sandbox Reporting Obligations',
    description: 'Sandbox participants must report periodically to the regulator on outcomes, incidents, and consumer impact during the sandbox period.',
    category: 'AI Sandbox',
    implementationGuidance: 'Define reporting cadence and content per the sandbox approval terms. Capture incidents in real time and include in the next report. Submit reports through the approved regulator channel and retain submission proofs.',
    evidenceRequirements: ['Reporting cadence schedule', 'Submitted periodic reports', 'Incident logs feeding reports', 'Submission confirmations'],
    testProcedures: ['Review schedule alignment with approval terms', 'Sample submitted reports for completeness', 'Trace an incident from log to report'],
    status: 'Not Started'
  },

  // ===== Government AI Use Restrictions =====
  {
    controlId: 'TRAIGA-8.1',
    name: 'Government Entity AI Disclosure',
    description: 'Government entities deploying AI must publish notice describing the systems in use, purposes, and contact information for inquiries.',
    category: 'Government AI Use',
    implementationGuidance: 'Maintain a public AI registry on the agency website listing each AI system, purpose, vendor, and inquiry contact. Update within a defined window of new deployments. Archive prior registry versions.',
    evidenceRequirements: ['Published AI registry URL', 'Registry update log', 'Archived historical versions', 'Inquiry response records'],
    testProcedures: ['Inspect registry for HB 149 disclosure elements', 'Sample deployments and verify registry entry within update window', 'Review inquiry responses for timeliness'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-8.2',
    name: 'Prohibition on Social Scoring by Government',
    description: 'Government entities are prohibited from using AI to assign social scores or rank residents based on social behavior.',
    category: 'Government AI Use',
    implementationGuidance: 'Add a procurement clause excluding social scoring systems. Review existing systems against the prohibition annually. Document removal of any non-compliant system and notify affected residents.',
    evidenceRequirements: ['Procurement clause template', 'Annual review reports', 'Removal records with notification proof', 'Acknowledgment from procurement office'],
    testProcedures: ['Inspect procurement clause for prohibition language', 'Review annual review report for completeness', 'Verify removal evidence for any flagged system'],
    status: 'Not Started'
  },

  // ===== Enforcement and Cure Period =====
  {
    controlId: 'TRAIGA-9.1',
    name: 'AG Inquiry Response Procedure',
    description: 'Establish procedures to respond to inquiries, civil investigative demands, and enforcement notices from the Texas Attorney General within statutory timelines.',
    category: 'Enforcement',
    implementationGuidance: 'Designate a legal point of contact for TRAIGA matters. Document an inquiry intake, triage, response, and document-production workflow. Conduct annual tabletop exercises.',
    evidenceRequirements: ['Designated contact and backup roster', 'Inquiry response procedure', 'Tabletop exercise reports', 'Real inquiry response records if applicable'],
    testProcedures: ['Verify contact information is current', 'Walk through the procedure with legal staff', 'Review tabletop after-action report'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-9.2',
    name: '60-Day Cure Period Tracking',
    description: 'On receipt of an AG notice of alleged violation, the organization must remediate within the 60-day cure period to avoid penalty exposure.',
    category: 'Enforcement',
    implementationGuidance: 'Stand up a cure-tracking workflow with a clock starting at notice receipt. Assign a remediation owner, document corrective actions, and capture written attestations of cure. Communicate cure status to AG before the deadline.',
    evidenceRequirements: ['Cure-tracking workflow documentation', 'Remediation owner assignment per notice', 'Corrective action evidence', 'Attestation of cure submitted to AG'],
    testProcedures: ['Inspect workflow for 60-day clock mechanics', 'Sample any received notices and verify timely response', 'Confirm attestation aligns with corrective action'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-9.3',
    name: 'Penalty Exposure Quantification',
    description: 'Track potential statutory penalty exposure per alleged violation to inform legal strategy and remediation prioritization.',
    category: 'Enforcement',
    implementationGuidance: 'Maintain a penalty exposure register listing each potential violation with statutory range. Update as facts develop. Use the register to prioritize remediation and inform reserves.',
    evidenceRequirements: ['Penalty exposure register', 'Update log tied to fact development', 'Remediation prioritization records', 'Reserve calculation documentation'],
    testProcedures: ['Review register for current accuracy', 'Sample entries and trace to underlying facts', 'Confirm prioritization aligns with exposure'],
    status: 'Not Started'
  },
  {
    controlId: 'TRAIGA-9.4',
    name: 'Annual TRAIGA Compliance Attestation',
    description: 'Senior leadership must attest annually to compliance with TRAIGA obligations based on internal review and supporting evidence.',
    category: 'Enforcement',
    implementationGuidance: 'Conduct an annual internal compliance review covering all TRAIGA controls. Compile evidence into an attestation package. Obtain signed attestation from a designated executive. Retain for the statutory period.',
    evidenceRequirements: ['Annual compliance review report', 'Attestation package contents list', 'Signed executive attestation', 'Retention proof'],
    testProcedures: ['Inspect review report scope vs TRAIGA controls', 'Verify executive signature and date', 'Confirm retention storage'],
    status: 'Not Started'
  }
];
