import { FrameworkControlTemplate } from './soc2Controls';

/**
 * California AI Transparency Act (SB 942)
 *
 * Effective January 1, 2026. Requires covered providers of generative AI
 * systems with more than 1,000,000 monthly users to: (1) make a free AI
 * detection tool available to the public, (2) embed manifest disclosures
 * (visible) in AI-generated image, video, and audio content, (3) embed
 * latent disclosures (machine-readable signal / watermark) in such content,
 * and (4) flow these obligations contractually to third-party licensees.
 * Enforcement vests in the California Attorney General, with civil
 * penalties of up to $5,000 per violation per day.
 */
export const CALIFORNIA_AI_TRANSPARENCY_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Covered Provider Determination =====
  {
    controlId: 'CAAITA-1.1',
    name: 'Monthly User Threshold Tracking',
    description: 'Track monthly users of generative AI systems to determine whether the 1,000,000-user threshold for covered-provider status is met under SB 942.',
    category: 'Covered Provider Determination',
    implementationGuidance: 'Implement a monthly user counting methodology consistent with SB 942 definitions. Distinguish California users where the Act\'s scope requires it. Maintain a rolling threshold register reviewed monthly. Notify legal when the threshold is crossed.',
    evidenceRequirements: ['User counting methodology document', 'Monthly user counts per generative AI system', 'Rolling threshold register', 'Legal notification records on threshold crossing'],
    testProcedures: ['Inspect methodology for SB 942 alignment', 'Sample monthly counts and trace to underlying metrics', 'Verify legal notification within the month of crossing'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-1.2',
    name: 'Generative AI System Inventory',
    description: 'Maintain an inventory of generative AI systems offered to the public, distinguishing those that produce image, video, audio, or text content.',
    category: 'Covered Provider Determination',
    implementationGuidance: 'Inventory each generative AI system with metadata: output modality, public availability, user base, third-party licensees. Update on launch, deprecation, and modality change. Use the inventory to scope SB 942 obligations.',
    evidenceRequirements: ['Generative AI system inventory', 'Modality and availability metadata', 'Update log', 'Obligation scoping documentation'],
    testProcedures: ['Review inventory against publicly available systems', 'Sample entries for metadata accuracy', 'Verify obligation scoping aligns with modality'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-1.3',
    name: 'Covered Content Identification',
    description: 'Identify which AI outputs constitute covered content (image, video, audio) under SB 942 for which manifest and latent disclosures are required.',
    category: 'Covered Provider Determination',
    implementationGuidance: 'Define covered content as the Act specifies and apply the definition at the output-generation layer. Tag outputs at generation time with covered-content metadata routed to disclosure pipelines. Validate against periodic sampling.',
    evidenceRequirements: ['Covered content definition document', 'Output-generation tagging implementation', 'Disclosure pipeline routing diagram', 'Periodic validation sampling reports'],
    testProcedures: ['Inspect definition against SB 942', 'Trace a sample output from generation through tagging to disclosure', 'Review validation sampling results'],
    status: 'Not Started'
  },

  // ===== AI Detection Tool =====
  {
    controlId: 'CAAITA-2.1',
    name: 'Free Public AI Detection Tool',
    description: 'Covered providers must make available, at no cost to the user, an AI detection tool that allows a user to assess whether content was generated or altered by the covered provider\'s generative AI system.',
    category: 'AI Detection Tool',
    implementationGuidance: 'Build a public detection tool exposed via web interface and documented API. Support image, video, and audio inputs corresponding to the provider\'s output modalities. Accept anonymous use with reasonable rate limits and free access tiers. Localize for California users.',
    evidenceRequirements: ['Public detection tool URL and API documentation', 'Modality support matrix', 'Rate limit and free-tier policy', 'Localization confirmation'],
    testProcedures: ['Submit sample outputs and verify detection result', 'Review API documentation for free-access terms', 'Confirm rate limits are not unduly restrictive'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-2.2',
    name: 'Detection Tool Output Accuracy',
    description: 'The AI detection tool must report whether the submitted content was generated or altered by the provider\'s generative AI system, including disclosure of confidence where appropriate.',
    category: 'AI Detection Tool',
    implementationGuidance: 'Engineer the detection tool to read embedded latent disclosures (watermarks, provenance metadata) and report results with a confidence indicator. Document the detection methodology. Periodically evaluate accuracy and publish a methods note.',
    evidenceRequirements: ['Detection methodology document', 'Confidence reporting design', 'Accuracy evaluation reports', 'Published methods note'],
    testProcedures: ['Review methodology document for substantive description', 'Inspect representative results for confidence indicator', 'Validate accuracy claims against evaluation data'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-2.3',
    name: 'Detection Tool Feedback Mechanism',
    description: 'Provide a mechanism for users to report detection errors and incorporate feedback into ongoing tool improvement.',
    category: 'AI Detection Tool',
    implementationGuidance: 'Add a feedback channel adjacent to the detection result. Capture submissions with metadata. Triage feedback and route improvement actions to engineering. Track improvement cycle metrics.',
    evidenceRequirements: ['Feedback channel implementation', 'Submission database with triage status', 'Improvement action records', 'Cycle metric dashboards'],
    testProcedures: ['Submit feedback and verify capture', 'Sample triage records for closure', 'Review improvement actions tied to feedback'],
    status: 'Not Started'
  },

  // ===== Manifest Disclosure =====
  {
    controlId: 'CAAITA-3.1',
    name: 'Manifest Disclosure on AI-Generated Content',
    description: 'Covered content must include a manifest (visible or audible) disclosure conveying that the content was generated or altered by a covered provider\'s generative AI system.',
    category: 'Manifest Disclosure',
    implementationGuidance: 'Apply visible labels to images and video (overlay or border treatment with text) and audible disclosures to audio. Design disclosures to be clear, conspicuous, and durable through reasonable user modification. Document disclosure specifications per modality.',
    evidenceRequirements: ['Manifest disclosure specifications per modality', 'Sample disclosed outputs (image, video, audio)', 'Durability testing reports against common modifications', 'Disclosure policy document'],
    testProcedures: ['Inspect sample outputs for disclosure presence', 'Review durability test reports', 'Confirm specifications cover all modalities offered'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-3.2',
    name: 'User Option to Include Manifest Disclosure',
    description: 'For systems that produce content for download, the covered provider must offer users the option to apply the manifest disclosure to AI-generated content they create.',
    category: 'Manifest Disclosure',
    implementationGuidance: 'Add an option in the generation interface to include the manifest disclosure on downloaded outputs. Default the option to enabled where Act requirements permit. Log user choice in audit trail.',
    evidenceRequirements: ['Generation interface screenshots showing option', 'Default-state configuration', 'User choice audit log', 'Help documentation explaining the option'],
    testProcedures: ['Inspect interface for option presence', 'Verify default state aligns with policy', 'Sample audit log for choice recording'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-3.3',
    name: 'Manifest Disclosure Durability Standard',
    description: 'Manifest disclosures should be designed to be resilient to common content edits to the extent technically feasible.',
    category: 'Manifest Disclosure',
    implementationGuidance: 'Evaluate disclosure durability against common edits (cropping, resizing, recompression, format conversion). Document feasibility limits. Update designs as detection and watermarking technology evolves.',
    evidenceRequirements: ['Durability evaluation methodology', 'Edit-resilience test reports', 'Feasibility limit documentation', 'Design update log'],
    testProcedures: ['Review evaluation methodology', 'Sample edited outputs and verify disclosure persistence', 'Confirm design updates tied to test findings'],
    status: 'Not Started'
  },

  // ===== Latent Disclosure (Watermarking) =====
  {
    controlId: 'CAAITA-4.1',
    name: 'Latent Disclosure Embedding',
    description: 'Covered content must include a latent disclosure (machine-readable signal embedded in the content) conveying provider identity, system, and generation context per SB 942.',
    category: 'Latent Disclosure',
    implementationGuidance: 'Embed latent disclosures using accepted watermarking or metadata techniques (e.g., C2PA provenance manifests, perceptual watermarks). Include provider identifier, system identifier, generation timestamp, and version. Document the embedding specification.',
    evidenceRequirements: ['Latent disclosure embedding specification', 'Embedded provenance examples', 'Embedding success rate metrics', 'C2PA or equivalent standard mapping'],
    testProcedures: ['Extract latent disclosure from representative outputs', 'Verify required fields are populated', 'Review success rate metrics for completeness'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-4.2',
    name: 'Latent Disclosure Verification by Detection Tool',
    description: 'The provider\'s detection tool must be able to read and report the latent disclosure embedded in covered content.',
    category: 'Latent Disclosure',
    implementationGuidance: 'Align detection tool reader with the embedding specification. Validate end-to-end (embed then detect) on every release. Surface latent disclosure contents in detection results subject to privacy review.',
    evidenceRequirements: ['Embed-then-detect validation test suite', 'Per-release validation results', 'Detection result schema including latent fields', 'Privacy review records on field disclosure'],
    testProcedures: ['Run embed-then-detect on a sample release', 'Inspect detection result for latent fields', 'Review privacy assessment of disclosed fields'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-4.3',
    name: 'Latent Disclosure Resilience',
    description: 'Design latent disclosures to be resilient to common content edits and reasonable adversarial removal attempts.',
    category: 'Latent Disclosure',
    implementationGuidance: 'Evaluate latent disclosure persistence under cropping, recompression, format conversion, screen recording, and adversarial removal. Document feasibility limits. Track research developments and apply upgrades.',
    evidenceRequirements: ['Resilience evaluation methodology', 'Test reports under various transformations', 'Feasibility limit documentation', 'Upgrade tracking log'],
    testProcedures: ['Review evaluation methodology coverage', 'Sample transformed outputs and verify detectability', 'Confirm upgrades tied to research developments'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-4.4',
    name: 'Cryptographic Integrity of Disclosure Metadata',
    description: 'Where latent disclosures use provenance metadata (e.g., C2PA), apply cryptographic signing to allow downstream verification of authenticity.',
    category: 'Latent Disclosure',
    implementationGuidance: 'Use industry-standard cryptographic signing (e.g., C2PA claim signing) with managed signing keys. Rotate keys per policy. Publish verification public keys or align with a trusted registry. Audit signing operations.',
    evidenceRequirements: ['Signing key management policy', 'Key rotation logs', 'Public key publication or registry entry', 'Signing operation audit logs'],
    testProcedures: ['Verify a signed sample using published public key', 'Inspect key rotation records', 'Review audit logs for signing operations'],
    status: 'Not Started'
  },

  // ===== Third-Party Licensee Obligations =====
  {
    controlId: 'CAAITA-5.1',
    name: 'Licensee Contractual Flow-Down',
    description: 'Covered providers that license their generative AI systems to third parties must contractually require licensees to maintain the latent disclosure capability and refrain from disabling it.',
    category: 'Licensee Obligations',
    implementationGuidance: 'Insert SB 942 flow-down clauses in licensee agreements. Cover maintenance of latent disclosure, prohibition on disablement, audit rights, and termination for breach. Track contract execution per licensee.',
    evidenceRequirements: ['SB 942 flow-down clause template', 'Executed licensee agreements with clause', 'Contract execution tracker', 'Audit right exercise procedure'],
    testProcedures: ['Inspect clause template against SB 942 requirements', 'Sample agreements and verify clause inclusion', 'Confirm execution tracker covers all licensees'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-5.2',
    name: 'Licensee Termination on Disablement',
    description: 'If a licensee modifies the licensed system to remove latent disclosure capability, the covered provider must revoke the license within the statutory window.',
    category: 'Licensee Obligations',
    implementationGuidance: 'Define a detection mechanism for licensee modifications (e.g., periodic technical audit, attestations, customer reports). Build a revocation workflow with a statutory day-clock. Track from detection to revocation.',
    evidenceRequirements: ['Modification detection mechanism documentation', 'Revocation workflow procedure', 'Day-clock tracking per detected case', 'Revocation notice records'],
    testProcedures: ['Inspect detection mechanism for substantive coverage', 'Walk through revocation procedure with legal', 'Sample any detected cases for timely revocation'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-5.3',
    name: 'Licensee Compliance Audit',
    description: 'Conduct periodic audits of licensees to confirm continued compliance with SB 942 flow-down obligations.',
    category: 'Licensee Obligations',
    implementationGuidance: 'Schedule annual audits per material licensee. Audit can be self-attestation plus technical sample for smaller licensees and on-site for material ones. Document findings and remediation.',
    evidenceRequirements: ['Audit schedule per licensee', 'Audit methodology documentation', 'Completed audit reports', 'Remediation tracking'],
    testProcedures: ['Inspect schedule for material licensee coverage', 'Sample audit reports for substantive findings', 'Verify remediation closure'],
    status: 'Not Started'
  },

  // ===== Enforcement and Penalties =====
  {
    controlId: 'CAAITA-6.1',
    name: 'OAG Inquiry Response Procedure',
    description: 'Establish procedures to respond to inquiries, civil investigative demands, and enforcement notices from the California Office of the Attorney General under SB 942.',
    category: 'Enforcement',
    implementationGuidance: 'Designate a legal point of contact for SB 942 matters. Document intake, triage, evidence preservation, response, and document production workflows. Conduct annual tabletop exercises.',
    evidenceRequirements: ['Legal contact roster for SB 942', 'Response procedure', 'Evidence preservation protocol', 'Tabletop exercise reports'],
    testProcedures: ['Verify contact roster currency', 'Walk through procedure with legal team', 'Review tabletop after-action remediation'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-6.2',
    name: 'Violation Day-Counting Methodology',
    description: 'Maintain a methodology for counting violation-days given the Act\'s up-to-$5,000-per-violation-per-day penalty structure to support legal strategy and reserves.',
    category: 'Enforcement',
    implementationGuidance: 'Define what constitutes a single violation (e.g., per piece of undisclosed content, per day of disabled detection tool). Track violation-days in a register updated as facts develop. Use the register for reserve calculations and remediation prioritization.',
    evidenceRequirements: ['Violation-day counting methodology', 'Violation-day register', 'Reserve calculation documentation', 'Prioritization records'],
    testProcedures: ['Inspect methodology for substantive analysis', 'Sample register entries against underlying facts', 'Verify reserves reflect register values'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-6.3',
    name: 'Remediation Tracking and Documentation',
    description: 'Track remediation actions for any SB 942 compliance gap from identification to closure, with documentation suitable for OAG production.',
    category: 'Enforcement',
    implementationGuidance: 'Use a remediation tracker capturing gap description, root cause, owner, remediation action, target date, and closure evidence. Update at least weekly. Index for rapid OAG production.',
    evidenceRequirements: ['Remediation tracker', 'Root cause analysis records', 'Closure evidence per item', 'Index for OAG production'],
    testProcedures: ['Sample remediation items for substantive closure evidence', 'Verify root cause analysis quality', 'Test OAG production index'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-6.4',
    name: 'Annual SB 942 Compliance Attestation',
    description: 'Senior leadership must attest annually to compliance with SB 942 obligations based on internal review and supporting evidence.',
    category: 'Enforcement',
    implementationGuidance: 'Conduct an annual internal review covering all SB 942 obligations. Compile evidence into an attestation package. Obtain signed attestation from a designated executive. Retain for the statutory period.',
    evidenceRequirements: ['Annual review report', 'Attestation package contents list', 'Signed executive attestation', 'Retention proof'],
    testProcedures: ['Inspect review scope against SB 942 obligations', 'Verify executive signature and date', 'Confirm retention storage'],
    status: 'Not Started'
  },

  // ===== Governance and Operational Controls =====
  {
    controlId: 'CAAITA-7.1',
    name: 'Cross-Functional SB 942 Governance Committee',
    description: 'Establish a cross-functional committee responsible for ongoing SB 942 compliance covering engineering, legal, product, and security.',
    category: 'Governance',
    implementationGuidance: 'Charter a governance committee with defined membership, decision authority, and meeting cadence. Track issues, decisions, and policy changes. Report to executive leadership periodically.',
    evidenceRequirements: ['Committee charter', 'Membership roster', 'Meeting minutes', 'Executive reporting records'],
    testProcedures: ['Review charter for authority and scope', 'Verify cross-functional membership', 'Sample minutes for substantive review'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-7.2',
    name: 'Engineering Change Control for Disclosure Systems',
    description: 'Apply change control to systems that produce manifest disclosures, latent disclosures, or that operate the detection tool to prevent inadvertent removal of compliance functionality.',
    category: 'Governance',
    implementationGuidance: 'Tag disclosure and detection code as compliance-critical. Require legal review for material changes. Add automated tests verifying disclosure emission and detection. Block deploys on test failure.',
    evidenceRequirements: ['Compliance-critical code tagging documentation', 'Legal review records for material changes', 'Automated test suite definitions', 'Deploy block evidence on test failure'],
    testProcedures: ['Inspect tagging coverage of disclosure and detection code', 'Sample changes for legal review', 'Verify deploy blocks via test induction'],
    status: 'Not Started'
  },
  {
    controlId: 'CAAITA-7.3',
    name: 'Continuous Compliance Monitoring',
    description: 'Continuously monitor disclosure emission, detection tool availability, and licensee compliance to surface drift before it becomes a violation.',
    category: 'Governance',
    implementationGuidance: 'Implement metrics: disclosure-embed success rate, detection tool uptime, licensee attestation currency. Alert on threshold breaches. Investigate alerts and document remediation.',
    evidenceRequirements: ['Monitoring metric catalog', 'Alert threshold documentation', 'Investigation outcome records', 'Periodic monitoring reports'],
    testProcedures: ['Review metric catalog for SB 942 coverage', 'Sample alerts and trace to resolution', 'Confirm periodic reports delivered to governance'],
    status: 'Not Started'
  }
];
