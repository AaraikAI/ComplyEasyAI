import { FrameworkControlTemplate } from './soc2Controls';

/**
 * AIUC-1 — the Artificial Intelligence Underwriting Company (AIUC) standard
 * for AI agents.
 *
 * VERIFIED 2026-09-07 against the published standard, July 15 2026 release
 * (the current release at the time of verification; earlier releases
 * 2025-07-22, 2025-10-01, 2026-01-15 and 2026-04-15; next scheduled
 * 2026-10-15). Sources checked:
 *   - Requirement index with ids and mandatory/optional status:
 *     https://www.aiuc-1.com/evidence
 *   - One public page per requirement carrying the requirement statement, its
 *     core/supplemental control activities, evidence examples and review
 *     cadence, under https://www.aiuc-1.com/{data-and-privacy,security,
 *     safety,reliability,accountability,society}/<requirement-slug>
 *   - Release history: https://www.aiuc-1.com/changelog and
 *     https://github.com/aiunderwriting/AIUC-1-Changelog
 *
 * What was verified, requirement by requirement:
 *   - Pillar structure A-F (Data & Privacy, Security, Safety, Reliability,
 *     Accountability, Society) and the 51 live requirement ids and titles:
 *     A001-A008, B001-B010, C001-C012, D001-D004, E001-E017 less two retired
 *     ids, F001-F002.
 *   - Mandatory vs optional status: 43 mandatory, 8 optional (B002, B003,
 *     B005, C007, C008, C009, E013, E017).
 *   - Each requirement's theme, its listed core and supplemental control
 *     activities, and its review cadence (12 months by default; 3 months for
 *     B001, B002, C006, C009, C010, C011, C012, D002 and D004; 6 months for
 *     E012).
 *
 * Id mapping: AIUC1-<pillar>.<n> corresponds one-to-one to the official id
 * <pillar>00n (AIUC1-B.10 is B010). Retired requirements are deliberately
 * absent, so AIUC1-E.7 and AIUC1-E.14 do not exist: E007 "Document system
 * change approvals" was merged into E004 and E014 "Share transparency
 * reports" into E017, both in the Q1 2026 update.
 *
 * What could NOT be verified: the auditor-facing standard document (the full
 * control-activity text, evidence acceptance criteria and auditor guidance)
 * is not published in full; the public site carries per-requirement
 * summaries. Every description, guidance, evidence and test line below is
 * this product's own paraphrase of those public summaries and is not the
 * text of the standard. Control names reuse the official requirement titles
 * so each control can be matched to the standard unambiguously.
 *
 * Optional requirements say "(Optional for certification)" in their
 * description; every other control is mandatory for AIUC-1 certification.
 *
 * History: the first version of this file (2026-09-05) carried 48 controls,
 * eight per pillar, whose titles and themes did not correspond to the
 * standard's requirement list. It was replaced by this verified catalogue.
 */
export const AIUC1_CONTROLS: FrameworkControlTemplate[] = [
  // ===== A. Data & Privacy (A001-A008) =====
  {
    controlId: 'AIUC1-A.1',
    name: 'Establish input data policy',
    description: 'Define and communicate to customers how the data they submit to the AI system is used for inference and any training, how long it is retained, and what rights data subjects have over it — and enforce the retention periods technically rather than by policy alone.',
    category: 'Data and Privacy',
    implementationGuidance: 'State ownership, permitted uses, training opt-in or opt-out and retention periods for input data in the terms of service, privacy policy or data processing agreement. Automate retention and deletion (TTL settings, storage lifecycle rules, scheduled deletion jobs) so the documented periods are actually applied. Document how access, deletion and opt-out requests are received and fulfilled. Review every 12 months.',
    evidenceRequirements: ['Terms of service, privacy policy or DPA sections covering input data use, training and retention', 'Automated deletion configuration (TTL, lifecycle rules, scheduled jobs)', 'Deletion audit logs from the data stores', 'Data subject rights handling procedure'],
    testProcedures: ['Compare each documented retention period with the configured TTL or lifecycle rule', 'Sample records past their retention period and confirm they were deleted', 'Walk through a data subject access or deletion request end to end', 'Confirm the policy was reviewed within the last 12 months'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.2',
    name: 'Establish output data policy',
    description: 'Define and communicate who owns AI-generated outputs, how the organisation may use them, and how customers opt in or out of output storage and reuse and have stored outputs deleted.',
    category: 'Data and Privacy',
    implementationGuidance: 'Address output ownership and usage rights explicitly in customer agreements (contrast with input ownership). Where outputs are stored or reused, implement opt-in or opt-out flags, gate storage on consent, and provide a deletion workflow whose execution is logged. Review every 12 months.',
    evidenceRequirements: ['Contract or policy clauses on ownership and use of AI outputs', 'Consent management or feature-flag configuration gating output storage', 'Output deletion workflow and execution logs'],
    testProcedures: ['Verify the agreements state who owns outputs and how they may be used', 'Set the opt-out for a test account and confirm outputs are no longer retained', 'Submit an output deletion request and confirm removal is logged'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.3',
    name: 'Limit AI agent data access',
    description: 'Restrict the data an AI agent can reach according to the task, the requesting user role, the agent role and the context, so the agent cannot retrieve or transmit data outside its intended scope.',
    category: 'Data and Privacy',
    implementationGuidance: 'Scope retrieval and memory (retrieval filtering, session scoping, role-based gating in the data path) so only in-scope data enters the context window. Give each agent a unique, verifiable identity using standard federation protocols. Manage agent permissions with explicit scopes mapped to RBAC/ABAC, just-in-time credentials, segregation of duties across integrated systems and data loss prevention on data the agent transmits.',
    evidenceRequirements: ['Code or configuration implementing data access restrictions in retrieval and session handling', 'Agent identity configuration showing unique identities and federation integration', 'Permission scope mapping to roles or attributes, JIT credential issuance and segregation of duties matrix', 'DLP policy configuration for agent-transmitted data'],
    testProcedures: ['Attempt retrieval outside the requesting role scope and verify it is denied', 'Confirm each deployed agent holds a distinct identity and credential', 'Review permission scopes against the documented mapping', 'Verify DLP rules apply to agent egress'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.4',
    name: 'Protect IP & trade secrets',
    description: 'Prevent the AI system from leaking the organisation\'s own intellectual property and confidential information: guide users, secure provider commitments, detect proprietary information in outputs and review high-risk cases.',
    category: 'Data and Privacy',
    implementationGuidance: 'Issue user guidance and training on handling confidential information with AI tools. Obtain contractual protections from foundation model providers such as zero data retention and IP commitments. Implement detection of proprietary information patterns in outputs with filtering or labelling rules. Monitor and keep an audit trail of outputs that touch sensitive sources, with human review for high-risk scenarios. Review every 12 months.',
    evidenceRequirements: ['Policy and training material on protecting confidential information when using AI', 'Provider contracts documenting retention and IP protection commitments', 'Detection and filtering configuration for proprietary information', 'Audit trail and review records for flagged outputs'],
    testProcedures: ['Confirm guidance has been issued to users and training completion is tracked', 'Submit synthetic proprietary content and verify it is detected or labelled in the output', 'Verify provider contracts contain the retention and IP terms', 'Review the audit trail for flagged high-risk outputs and the human review outcome'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.5',
    name: 'Prevent cross-customer data exposure',
    description: 'Keep one customer\'s data from reaching another: obtain explicit consent before combining customer data for any purpose, and enforce strict customer isolation in shared infrastructure.',
    category: 'Data and Privacy',
    implementationGuidance: 'State any combined data usage and obtain consent in the DPA or terms of service. Enforce logical and, where relevant, physical separation of customer data with tenant identifiers on every data path, tenant-specific encryption keys and validated data flow boundaries. Consider privacy-enhancing techniques (tokenisation, differential privacy, federated learning, masking) where data is aggregated. Review every 12 months.',
    evidenceRequirements: ['DPA or terms provisions covering consent for combined data usage', 'Code demonstrating tenant or namespace enforcement in retrieval, storage and caching', 'Encryption and privacy-enhancing technology configuration'],
    testProcedures: ['Attempt a cross-tenant retrieval with a valid session and verify it is blocked', 'Verify tenant-specific keys or namespaces are in use', 'Confirm the consent clause exists wherever data is combined'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.6',
    name: 'Prevent PII leakage',
    description: 'Detect and filter personal identifiers in AI inputs, outputs and logs so that responses and stored records do not expose personal data, and block policy violations before delivery.',
    category: 'Data and Privacy',
    implementationGuidance: 'Filter inputs and outputs for personal identifiers (names, emails, national identifiers, phone numbers) using pattern rules, keyword checks or scrubbing functions, and redact personal data from logs. Integrate a data loss prevention system to scan outputs and block violations before they reach the user. Review every 12 months.',
    evidenceRequirements: ['PII detection and filtering code or configuration', 'Log redaction configuration', 'Logs of blocked outputs containing personal data', 'DLP integration configuration'],
    testProcedures: ['Submit synthetic personal data and verify it is removed from the output and from logs', 'Inspect stored logs for unredacted identifiers', 'Verify the DLP integration blocks a policy-violating output'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.7',
    name: 'Prevent IP violations',
    description: 'Prevent AI outputs from infringing third-party copyright, trademarks or other intellectual property: document provider protections, filter infringing content and tell users what is prohibited.',
    category: 'Data and Privacy',
    implementationGuidance: 'Record the foundation model provider\'s IP protection commitments, including indemnification and how copyrighted or trademarked material is handled. Deploy content filtering to detect copyrighted material and trademark misuse in outputs. Publish user-facing warnings and acceptable-use terms describing prohibited infringing uses. Review every 12 months.',
    evidenceRequirements: ['Provider contracts or terms documenting IP protections and liability coverage', 'Content filtering configuration for copyright and trademark detection', 'User-facing notices and acceptable-use terms on IP infringement'],
    testProcedures: ['Verify the provider agreement documents IP protections', 'Probe with prompts requesting reproduction of protected material and verify handling', 'Review the user-facing warnings for accuracy and placement'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.8',
    name: 'Prevent leakage of credentials and secrets',
    description: 'Detect secrets in user inputs, keep credentials out of generated code, store user-provided credentials in a secret manager, warn users when a secret is detected, and redact secrets from platform logs and stored artefacts. Added in the July 15 2026 release for code-generating agents.',
    category: 'Data and Privacy',
    implementationGuidance: 'Run pattern- or entropy-based secret detection on inputs. Direct generation toward environment variables and secret stores so literals never appear in generated code, and scan generated artefacts. Store any credentials users provide in a managed secret store (never in prompts, memory or plain storage). Show users a warning when a probable secret is detected. Apply redaction to logs and stored artefacts. Review every 12 months.',
    evidenceRequirements: ['Secret detection ruleset configuration', 'System prompt or generation policy directing secret handling, plus artefact scan results', 'Secret manager integration documentation', 'Log and artefact redaction rules', 'User-facing secret warning implementation'],
    testProcedures: ['Submit a synthetic API key and verify it is detected, the user is warned and it is absent from logs', 'Request code that needs a credential and verify the output references a secret store rather than a literal', 'Verify user-provided credentials are written only to the secret manager'],
    status: 'Not Started'
  },

  // ===== B. Security (B001-B010) =====
  {
    controlId: 'AIUC1-B.1',
    name: 'Third-party testing of adversarial robustness',
    description: 'Have qualified independent third parties test the system at least every 3 months against adversarial inputs, prompt injection and jailbreak attempts, aligned to an adversarial threat taxonomy, and track findings to remediation.',
    category: 'Security',
    implementationGuidance: 'Engage an external tester each quarter. The report must record the taxonomy tested, the methodology, findings and remediation tracking with timelines, and be stored securely. Fold AI-specific adversarial cases into the broader penetration testing and security audit programme.',
    evidenceRequirements: ['Quarterly third-party adversarial testing reports', 'Assessor qualification and independence records', 'Remediation tracker with timelines', 'Penetration test scope showing AI-specific cases'],
    testProcedures: ['Verify a third-party report exists for each of the last four quarters', 'Verify findings were remediated within the documented timelines', 'Confirm the tester is independent and qualified', 'Confirm AI cases appear in the security testing calendar'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.2',
    name: 'Detect adversarial input',
    description: '(Optional for certification) Monitor for prompt injection, jailbreak attempts and abusive request rates, log incidents with a response and escalation workflow, and refresh the detection rules at least quarterly.',
    category: 'Security',
    implementationGuidance: 'Configure detection and alerting rules for injection patterns, jailbreak signatures and rate-limit violations. Log incidents with timestamps and response actions and define escalation. Review and update the detection configuration every 3 months against emerging techniques. Optionally add pre-processing filters ahead of the model and route AI security events into the SIEM or SOC for correlation.',
    evidenceRequirements: ['Detection and alerting rule configuration', 'Incident log entries with response actions', 'Quarterly detection review records', 'SIEM or SOC integration configuration where implemented'],
    testProcedures: ['Send a synthetic injection attempt and verify an alert is raised and logged', 'Review recent incidents for response and escalation', 'Confirm the last quarterly rule review'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.3',
    name: 'Manage public release of technical details',
    description: '(Optional for certification) Limit public disclosure of model architecture, training data, configuration and performance details that could help adversaries target the system, and require approval before technical specifications are shared.',
    category: 'Security',
    implementationGuidance: 'Write disclosure guidelines defining which categories of AI technical information may not be shared and the approval required for the rest. Keep approval records for blog posts, press releases, presentations and marketing content that describe AI capabilities. Review every 12 months.',
    evidenceRequirements: ['Technical information disclosure guideline or policy', 'Approval records for public AI communications', 'Security or marketing review logs for public-facing AI content'],
    testProcedures: ['Sample recent public communications about the AI system and verify approval was recorded', 'Verify the guideline covers architecture, training data, configuration and metrics', 'Confirm the guideline was reviewed within 12 months'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.4',
    name: 'Prevent AI endpoint scraping',
    description: 'Detect and restrict probing or scraping of external AI endpoints through anomalous usage detection, per-user rate limits and quotas, external penetration testing of the endpoints and tracked remediation, while still allowing legitimate high-volume use.',
    category: 'Security',
    implementationGuidance: 'Deploy behavioural analytics to identify suspicious query patterns and calibrate thresholds against legitimate traffic. Apply per-user quotas with progressive restrictions to frustrate model extraction. Commission external penetration tests that simulate scraping and distributed attacks against the endpoints. Track endpoint vulnerabilities to closure in the issue tracker. Review every 12 months.',
    evidenceRequirements: ['Anomaly detection dashboards or rules', 'Rate limiting and WAF configuration', 'External penetration test report covering the AI endpoints', 'Issue tracker records for endpoint vulnerabilities'],
    testProcedures: ['Exceed the quota from a test account and verify throttling or progressive restriction', 'Verify anomaly alerts fire on a scripted query pattern', 'Review the penetration test findings and their remediation status'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.5',
    name: 'Implement real-time input filtering',
    description: '(Optional for certification) Run automated moderation on inputs before they reach the foundation model to detect adversarial inputs, prompt injections and jailbreak attempts, with configurable thresholds and user feedback when an input is blocked.',
    category: 'Security',
    implementationGuidance: 'Integrate a moderation tool with filtering rules, action settings and confidence thresholds. Document the tool choice and threshold rationale. Show users feedback when input is blocked. Log flagged prompts in a privacy-compliant way and periodically evaluate accuracy, false positives and false negatives to adjust thresholds. Review every 12 months.',
    evidenceRequirements: ['Moderation tool configuration', 'Documented filtering approach and threshold rationale', 'User-facing blocked-input messaging', 'Filter performance analysis and threshold adjustment records'],
    testProcedures: ['Submit an adversarial input and verify it is blocked with a user-facing message', 'Review the threshold rationale document', 'Review the latest false positive and false negative analysis'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.6',
    name: 'Prevent unauthorized AI agent actions',
    description: 'Confine agents to approved backend services and privileges, monitor and alert on actions that exceed their security boundary, and contain agent execution at runtime.',
    category: 'Security',
    implementationGuidance: 'Restrict agent access to backends through API gateways, network policies, MCP server allow-lists and service-level authorisation. Log service interactions and alert on unauthorised access attempts and boundary violations. Add execution-level safeguards: sandboxed execution, integrity controls on tool definitions, pre-execution authorisation hooks and configuration scanning. Review every 12 months.',
    evidenceRequirements: ['API gateway, network policy and MCP allow-list configuration', 'Agent isolation architecture documentation', 'Security monitoring rules and alert records for boundary violations', 'Sandbox and pre-execution policy configuration'],
    testProcedures: ['Attempt a call to a service outside the allow-list and verify it is blocked and alerted', 'Verify tool definitions are integrity-checked before use', 'Review sandbox resource and network restrictions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.7',
    name: 'Enforce user access privileges to AI systems',
    description: 'Maintain role- or attribute-based access controls and admin privileges over AI resources — model configurations, training data, tool capabilities and prompt logs — and review access at least quarterly.',
    category: 'Security',
    implementationGuidance: 'Implement RBAC or ABAC for every AI resource and enforce it in authorisation code before AI components are accessed. Run quarterly access reviews that record role changes, access modifications and justifications with AI-specific context.',
    evidenceRequirements: ['IAM configuration or permission files showing role- or attribute-based restrictions on AI resources', 'Authorisation code validating permissions before AI component access', 'Quarterly access review records with justifications'],
    testProcedures: ['Verify sampled roles hold only the AI permissions they need', 'Attempt to read prompt logs or model configuration without the role and verify denial', 'Confirm the most recent quarterly access review'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.8',
    name: 'Protect AI system deployment environment',
    description: 'Secure the environment the AI system runs in: authenticate every caller of model and agent interfaces, encrypt all model, MCP and agent-to-agent traffic in transit with credential rotation, and optionally sign messages, harden hosting and verify model integrity.',
    category: 'Security',
    implementationGuidance: 'Enforce caller authentication on all API and agentic interfaces (scoped tokens, OAuth 2.0/OIDC validation or mutual authentication). Require TLS on every model endpoint, MCP connection and agent-to-agent channel and rotate credentials on a defined schedule. Add cryptographic message signing and schema validation for agent interactions, minimal hardened container images with dependency scanning and isolation, and checksum or signature verification of model artefacts before deployment. Review every 12 months.',
    evidenceRequirements: ['Authentication configuration for API and agent interfaces', 'TLS configuration and credential rotation policy', 'Message signing and schema validation configuration where implemented', 'Container hardening and dependency scan results', 'Model artefact checksum or signature verification records'],
    testProcedures: ['Call an interface without credentials and verify rejection', 'Verify plaintext connections are refused', 'Verify artefact checksums are checked before deployment', 'Review the last credential rotation'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.9',
    name: 'Limit output over-exposure',
    description: 'Restrict output volume (character or token caps, inference timeouts, result counts) and output fidelity (rounding, threshold bands, obfuscation) so outputs cannot be used for model extraction, inversion or excessive disclosure, and tell users about the limits. Applies to text, voice and image generation.',
    category: 'Security',
    implementationGuidance: 'Configure output volume limits in code or platform settings. Publish user-facing notices explaining truncation and limitation policies. Apply precision controls to numeric or sensitive outputs. Review every 12 months.',
    evidenceRequirements: ['Output volume limit configuration', 'User-facing output limitation notices', 'Output precision or obfuscation implementation'],
    testProcedures: ['Request an output beyond the cap and verify truncation or timeout', 'Verify the user notice is shown', 'Verify precision controls apply to sensitive numeric outputs'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.10',
    name: 'Promote secure patterns in generated code',
    description: 'Steer code-generating agents toward secure defaults: parameterised queries, output encoding and TLS; vetted authentication and authorisation libraries; pinned and verified dependencies; secure session and cookie settings; input validation and safe error handling; and logging that excludes secrets and personal data. Added in the July 15 2026 release for code-generation capabilities.',
    category: 'Security',
    implementationGuidance: 'Encode the secure defaults in system prompts, generation policies and post-generation checks. Verify dependency names and versions against the registry to avoid typosquatted packages. Run static analysis over generated code samples and feed findings back into the generation policy. Review every 12 months.',
    evidenceRequirements: ['Generation policy or system prompt sections defining secure defaults', 'Dependency verification configuration', 'Static analysis results over generated code samples', 'Review records of generated-code security findings'],
    testProcedures: ['Prompt for database access code and verify parameterised queries are produced', 'Prompt for session handling and verify secure cookie flags and CSRF protection', 'Verify generated dependency specifications are pinned and resolvable', 'Verify generated logging excludes secrets and personal data'],
    status: 'Not Started'
  },

  // ===== C. Safety (C001-C012) =====
  {
    controlId: 'AIUC1-C.1',
    name: 'Define AI risk taxonomy',
    description: 'Maintain a documented taxonomy of AI risk categories with severity levels and examples specific to the system\'s capabilities and deployment context, aligned to external frameworks and organisational risk tolerance, and review it at least annually.',
    category: 'Safety',
    implementationGuidance: 'Write the taxonomy as an internal policy or risk framework with categories, severity levels and context-specific examples. Map it to external frameworks such as the NIST AI RMF, EU AI Act Article 9 and ISO/IEC 42001. Record annual reviews with dates, participants, decisions and version history.',
    evidenceRequirements: ['AI risk taxonomy document with severity levels and examples', 'Alignment mapping to external frameworks', 'Annual review records with version history'],
    testProcedures: ['Verify every category carries a severity level and examples', 'Verify the framework alignment mapping', 'Confirm the taxonomy was reviewed within the last 12 months'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.2',
    name: 'Conduct pre-deployment testing',
    description: 'Before deploying any change that requires formal review or approval, test the AI system internally across the risk categories (including hallucination and safety), record the results and risk assessment, and obtain approval sign-off.',
    category: 'Safety',
    implementationGuidance: 'Document test results with severity ratings, the risk assessment with mitigation decisions and the approval with rationale. Integrate AI testing into existing SDLC gates (CI/CD configuration, pull request templates, branch protection) so it cannot be skipped. Scan AI artefacts and dependencies for vulnerabilities before deployment. Review every 12 months.',
    evidenceRequirements: ['Pre-deployment test results with severity ratings', 'Risk assessment and approval sign-off records', 'CI/CD gate configuration enforcing AI testing', 'Vulnerability scan results for AI artefacts and dependencies'],
    testProcedures: ['Verify the latest approved release has test results, a risk assessment and a sign-off', 'Verify the deployment gate blocks when tests fail', 'Review the artefact and dependency scan output for the latest release'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.3',
    name: 'Prevent harmful outputs',
    description: 'Filter and guard against harmful outputs — distressed responses, angry language, high-risk advice, offensive content, bias and deception — add required disclaimers to guidance, and measure how well the safeguards work. Applies to text, voice and image generation.',
    category: 'Safety',
    implementationGuidance: 'Configure content filtering (moderation APIs or custom classifiers) for the listed harm types. Add guardrails that restrict high-risk recommendations in sensitive domains and attach disclaimers. Monitor for discriminatory patterns with fairness checks. Track false positive and false negative rates and coverage against harm benchmark datasets. Review every 12 months.',
    evidenceRequirements: ['Content filtering and moderation configuration', 'System prompts and guardrail rules for sensitive domains', 'Bias evaluation results or fairness monitoring output', 'Harm benchmark results with false positive and false negative rates'],
    testProcedures: ['Probe with a harm test set and record the block rate per category', 'Verify disclaimers appear on guidance in sensitive domains', 'Review the latest bias evaluation and mitigation actions', 'Review performance metrics against targets'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.4',
    name: 'Prevent out-of-scope outputs',
    description: 'Detect and block requests outside the system\'s intended scope (for example political discussion or healthcare advice), log attempts and adjust the restrictions in response to patterns, and tell users what the system is and is not for.',
    category: 'Safety',
    implementationGuidance: 'Configure out-of-scope guardrails through topic block-lists, defensive prompting, redirection templates and escalation rules. Log out-of-scope attempts with frequency data and record scope adjustments made in response. Publish user guidance on capabilities, limitations and intended use in onboarding, FAQs and usage guidelines. Review every 12 months.',
    evidenceRequirements: ['Out-of-scope guardrail configuration and system prompts', 'Logs of out-of-scope attempts with monitoring dashboards', 'Records of scope adjustments', 'User-facing scope guidance'],
    testProcedures: ['Submit out-of-scope requests and verify they are declined or redirected', 'Verify the attempts appear in the logs', 'Review the user guidance for accuracy'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.5',
    name: 'Prevent agent-specific high risk outputs',
    description: 'Detect and block the additional high-risk output types defined in the organisation\'s own risk taxonomy, with response actions tiered by severity, automated interventions and escalation to human review. Renamed from "customer-defined" in the July 15 2026 release.',
    category: 'Safety',
    implementationGuidance: 'Map filtering rules and detection logic to each taxonomy category with a response action per severity level. Document escalation procedures and human review workflows for flagged content. Implement automated interventions that block, modify or flag outputs based on risk scores. Review every 12 months.',
    evidenceRequirements: ['Detection rules mapped to the risk taxonomy', 'Escalation and human review workflow documentation', 'Automated response configuration'],
    testProcedures: ['Trigger a sample from each taxonomy category and verify the tiered response', 'Verify automated blocking or modification for a high-severity case', 'Verify a flagged case reaches the human review queue'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.6',
    name: 'Prevent output vulnerabilities',
    description: 'Stop security vulnerabilities carried in AI outputs from affecting users: sanitise and validate outputs, handle and label content according to its trust level, and detect injection payloads and obfuscated exploits in generated content. Reviewed every 3 months.',
    category: 'Safety',
    implementationGuidance: 'Apply HTML, JavaScript and shell encoding, URL validation, schema validation and secure rendering modes to outputs. Track content origin as metadata, show trust indicators and apply conditional security handling to untrusted content. Deploy detection rules for injection attempts, payload signatures and obfuscated exploits in outputs.',
    evidenceRequirements: ['Output sanitisation and validation implementation', 'Trust-level labelling and content origin metadata in the interface', 'Adversarial output detection rules'],
    testProcedures: ['Craft an output containing a script payload and verify it is encoded or rejected', 'Verify untrusted content is labelled and handled differently', 'Verify the detection rules flag a known payload signature', 'Confirm the quarterly review'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.7',
    name: 'Flag high risk outputs for human review',
    description: '(Optional for certification) Define which outputs require human review according to the risk taxonomy, detect them automatically, and route them into a review workflow with assignment, escalation and response-time targets.',
    category: 'Safety',
    implementationGuidance: 'Document the high-risk criteria (for example financial thresholds, medical or legal domains, safety concerns). Implement automated detection through filtering, risk scoring, classifiers or a rules engine. Define the review workflow: reviewer assignment, escalation paths, queue management, SLAs and decision records. Review every 12 months.',
    evidenceRequirements: ['High-risk output criteria document', 'Detection configuration or rules engine implementation', 'Review workflow and ticketing configuration with SLA targets'],
    testProcedures: ['Generate an output meeting the criteria and verify it is queued for review', 'Review adherence to the response-time targets', 'Verify the criteria cover the taxonomy categories that require review'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.8',
    name: 'Monitor AI risk categories',
    description: '(Optional for certification) Continuously monitor the system across the taxonomy risk categories: schedule evaluations by severity, sample outputs for review, track behaviour patterns, document emerging risk scenarios and feed them back into the taxonomy.',
    category: 'Safety',
    implementationGuidance: 'Keep logs of monitoring activity including sampling results, behaviour traces and evaluation schedules prioritised by severity. Document identified scenarios with examples and update the taxonomy from findings. Integrate output monitoring with the security stack through the SIEM and standard log formats.',
    evidenceRequirements: ['Monitoring dashboards and output sampling logs', 'Evaluation schedule prioritised by severity', 'Documented risk scenarios and taxonomy update history', 'SIEM integration configuration where implemented'],
    testProcedures: ['Verify sampling occurs on the documented schedule', 'Trace a documented scenario to a taxonomy update', 'Verify AI monitoring events reach the SIEM'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.9',
    name: 'Enable real-time feedback and intervention',
    description: '(Optional for certification) Give users accessible controls to pause, stop or redirect the system and to submit feedback, and review feedback and intervention logs on a regular cadence with corrective actions tracked. Reviewed every 3 months.',
    category: 'Safety',
    implementationGuidance: 'Provide stop, pause and redirect controls and feedback forms with accessibility support (keyboard navigation, screen reader labels, high contrast). Review feedback and intervention logs at regular intervals, categorise them by risk domain and frequency, and route corrective actions into the product backlog.',
    evidenceRequirements: ['Intervention controls and feedback capture in the interface with accessibility features', 'Feedback and intervention review reports', 'Backlog items created from reviews'],
    testProcedures: ['Exercise the stop control mid-task and verify the system halts', 'Verify controls are keyboard-operable and labelled for assistive technology', 'Confirm the last quarterly review and resulting actions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.10',
    name: 'Third-party testing for harmful outputs',
    description: 'Have qualified independent third parties test the system at least every 3 months for harmful outputs — distressed responses, angry language, high-risk advice, offensive content, bias and deception — and track findings to remediation. Applies to text, voice and image generation.',
    category: 'Safety',
    implementationGuidance: 'Engage an external assessor each quarter. The report must document assessor qualifications and independence, the methodology and scope, findings, and improvement tracking with remediation timelines and follow-up.',
    evidenceRequirements: ['Quarterly third-party harmful output testing reports', 'Assessor qualification and independence records', 'Remediation tracking with timelines and follow-up'],
    testProcedures: ['Verify a report exists for each of the last four quarters', 'Verify findings were remediated within the documented timelines', 'Confirm the assessor is independent and qualified'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.11',
    name: 'Third-party testing for out-of-scope outputs',
    description: 'Have qualified independent third parties test the system at least every 3 months for out-of-scope outputs such as political discussion or healthcare advice, and track findings to remediation. Applies to text and voice generation.',
    category: 'Safety',
    implementationGuidance: 'Engage an external assessor each quarter with scope drawn from the intended-use definition. The report must document assessor qualifications, methodology and scope, findings, and remediation tracking with timelines.',
    evidenceRequirements: ['Quarterly third-party out-of-scope testing reports', 'Assessor qualification and independence records', 'Remediation tracking with timelines'],
    testProcedures: ['Verify a report exists for each of the last four quarters', 'Verify the scope reflects the current intended-use definition', 'Verify findings were remediated within the documented timelines'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.12',
    name: 'Third-party testing for customer-defined risk',
    description: 'Have qualified independent third parties test the system at least every 3 months for the additional high-risk output types defined in the organisation\'s risk taxonomy, and track findings to remediation.',
    category: 'Safety',
    implementationGuidance: 'Engage an external assessor each quarter with scope drawn from the taxonomy categories beyond harmful and out-of-scope outputs. The report must document assessor qualifications and independence, methodology, findings, and remediation tracking with timelines.',
    evidenceRequirements: ['Quarterly third-party testing reports for taxonomy-defined risks', 'Assessor qualification and independence records', 'Remediation tracking with timelines'],
    testProcedures: ['Verify a report exists for each of the last four quarters', 'Verify the scope covers every taxonomy category not tested under C010 and C011', 'Verify findings were remediated within the documented timelines'],
    status: 'Not Started'
  },

  // ===== D. Reliability (D001-D004) =====
  {
    controlId: 'AIUC1-D.1',
    name: 'Prevent hallucinated outputs',
    description: 'Reduce fabricated content through groundedness checks against source material, user-facing citations and source attribution for factual claims, and uncertainty labels or disclaimers where confidence is low.',
    category: 'Reliability',
    implementationGuidance: 'Implement groundedness validation that compares responses with the retrieved or referenced sources (context comparison or fact-checking integration). Render inline citations, source links or reference lists to users. Display confidence indicators or low-certainty warnings on generated information. Review every 12 months.',
    evidenceRequirements: ['Groundedness validation code or configuration', 'Interface showing citations and source attribution', 'Confidence or uncertainty display implementation'],
    testProcedures: ['Evaluate a factual test set and record the hallucination rate', 'Verify citations resolve to the cited sources', 'Verify low-confidence answers carry an uncertainty label'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.2',
    name: 'Third-party testing for hallucinations',
    description: 'Have qualified independent third parties evaluate the system for hallucinated outputs at least every 3 months and track findings to remediation. Applies to text, voice and code generation.',
    category: 'Reliability',
    implementationGuidance: 'Engage an external assessor each quarter. The report must document the risk taxonomy tested, scope and methodology, findings, assessor qualifications and independence, and remediation tracking with timelines and follow-up.',
    evidenceRequirements: ['Quarterly third-party hallucination testing reports', 'Assessor qualification and independence records', 'Remediation tracking with timelines and follow-up'],
    testProcedures: ['Verify a report exists for each of the last four quarters', 'Verify findings were remediated within the documented timelines', 'Confirm the assessor is independent and qualified'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.3',
    name: 'Restrict unsafe tool calls',
    description: 'Prevent tool calls from executing unauthorised actions, reaching restricted information or deciding beyond their intended scope: allow only approved tools with validated parameters, cap call rates and transactions, log every invocation, require human approval for sensitive operations and review usage periodically.',
    category: 'Reliability',
    implementationGuidance: 'Maintain allow-lists of approved functions and MCP servers with parameter validation and authorisation checks before execution. Enforce rate limits and transaction caps on autonomous tool use. Log every invocation with parameters, results and unauthorised attempts. Require human confirmation for high-risk, sensitive or multi-step operations. Review usage patterns periodically to find anomalies, adjust permissions and retire unused tools. Review every 12 months.',
    evidenceRequirements: ['Tool allow-lists, parameter schemas and access control lists', 'Rate limit and transaction cap configuration', 'Tool call audit logs', 'Human approval workflow configuration', 'Tool usage review records and retirement decisions'],
    testProcedures: ['Attempt an unapproved tool call and verify it is blocked', 'Exceed the cap and verify enforcement', 'Verify a sampled invocation is fully logged', 'Verify a sensitive operation requires approval before execution'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.4',
    name: 'Third-party testing of tool calls',
    description: 'Have qualified independent third parties test the system\'s tool calls at least every 3 months for unauthorised actions, access to restricted information and decisions beyond intended scope, and track findings to remediation.',
    category: 'Reliability',
    implementationGuidance: 'Engage an external assessor each quarter with scope covering every tool and integration the agent can invoke. The report must document the risk taxonomy tested, methodology, findings and remediation tracking with timelines.',
    evidenceRequirements: ['Quarterly third-party tool call testing reports', 'Assessor qualification and independence records', 'Remediation tracking with timelines'],
    testProcedures: ['Verify a report exists for each of the last four quarters', 'Verify the scope includes every tool currently enabled', 'Verify findings were remediated within the documented timelines'],
    status: 'Not Started'
  },

  // ===== E. Accountability (E001-E017; E007 and E014 are retired) =====
  {
    controlId: 'AIUC1-E.1',
    name: 'AI failure plan for security breaches',
    description: 'Maintain a documented plan for AI privacy and security breaches that names an accountable response lead, sets notification and remediation procedures and preserves evidence, engaging legal, PR and insurance support where needed.',
    category: 'Accountability',
    implementationGuidance: 'Write the plan standalone or as part of the existing incident response procedure. Assign a breach response lead with authority to engage external counsel and specialists. Define notification procedures for customers and regulators. Specify remediation steps such as system freeze, vulnerability fixes and access control updates. Set evidence collection requirements with guidance on legally sound preservation of logs and records. Review every 12 months.',
    evidenceRequirements: ['AI security breach failure plan', 'Named response lead and external support contacts', 'Customer and regulator notification procedures and templates', 'Evidence preservation guidance'],
    testProcedures: ['Run a tabletop exercise of an AI data breach and verify the plan is followed', 'Verify the response lead assignment is current', 'Verify notification templates and timelines exist'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.2',
    name: 'AI failure plan for harmful outputs',
    description: 'Maintain a documented plan for harmful AI outputs that cause significant customer harm, naming accountable owners, defining customer communication and immediate mitigation, and engaging legal, PR and insurance support where needed.',
    category: 'Accountability',
    implementationGuidance: 'Define customer communication protocols with executive approval for disclosures, immediate mitigation steps (system freeze, output suppression) and staff responsibilities. Define the harmful output categories by reference to the risk taxonomy, keep an external support contact list and set escalation criteria. Review every 12 months.',
    evidenceRequirements: ['AI harmful output failure plan', 'Customer disclosure procedure with approval path', 'Harmful output category definitions and escalation criteria', 'External support contact list'],
    testProcedures: ['Run a tabletop exercise of a harmful output incident', 'Verify the mitigation steps can be executed (freeze and suppression)', 'Verify escalation criteria and external contacts are current'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.3',
    name: 'AI failure plan for hallucinations',
    description: 'Maintain a documented plan for hallucinated AI outputs that cause substantial customer financial loss, naming accountable owners, defining customer communication and remediation, and coordinating legal, financial review and insurance support where needed.',
    category: 'Accountability',
    implementationGuidance: 'Define customer communication with disclosure procedures and executive approval, immediate mitigation (system freeze, model adjustments, enhanced monitoring) with named staff, hallucination incident type definitions, an external support list and escalation criteria. Review every 12 months.',
    evidenceRequirements: ['AI hallucination failure plan', 'Incident type definitions and escalation criteria', 'External support contact list (legal, financial review, insurance)', 'Mitigation step assignments'],
    testProcedures: ['Run a tabletop exercise of a costly hallucination incident', 'Verify the plan assigns owners to each mitigation step', 'Verify the escalation criteria and contacts are current'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.4',
    name: 'Assign accountability',
    description: 'Define which AI system changes across development and deployment require formal review or approval, assign an accountable lead for each, and record approvals with supporting evidence. Absorbed the retired E007 "Document system change approvals" in the Q1 2026 update.',
    category: 'Accountability',
    implementationGuidance: 'Publish a change approval policy listing the change types that need approval and the accountable lead for each, and keep approval records with sign-off and evidence in the change management tooling. Optionally require code signing so only digitally signed models, libraries and components can be promoted to production, verified in the CI/CD pipeline. Review every 12 months.',
    evidenceRequirements: ['Change approval policy with change types and accountable leads', 'Approval records with sign-off and supporting evidence', 'Code signing and pipeline verification configuration where implemented'],
    testProcedures: ['Sample recent AI system changes and verify each has a recorded approval by the assigned lead', 'Verify the policy covers model, prompt, tool and configuration changes', 'Verify the pipeline rejects unsigned artefacts where code signing is in use'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.5',
    name: 'Document data storage security',
    description: 'Document how data used by the AI system is stored and secured, considering data sensitivity, regulatory requirements, security controls and operational needs, including the evaluation of cloud versus on-premises processing.',
    category: 'Accountability',
    implementationGuidance: 'Produce a storage security assessment or deployment decision memo covering the options considered, the rationale for the chosen deployment model and the controls applied. Revisit it when requirements change. Review every 12 months.',
    evidenceRequirements: ['Data storage security documentation or trust centre content', 'Deployment decision memo comparing cloud and on-premises options', 'Risk assessment reports', 'Records of periodic review'],
    testProcedures: ['Verify the documentation addresses sensitivity, regulation, controls and operations', 'Verify the deployment decision is recorded with rationale', 'Confirm the last review date'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.6',
    name: 'Conduct vendor due diligence',
    description: 'Run a due diligence process for foundation and upstream model providers covering data handling and ownership, personal data controls, security, compliance status and open-source considerations, with documented assessments and approvals before use.',
    category: 'Accountability',
    implementationGuidance: 'Define assessment criteria, score each provider, verify claims (certifications reviewed, references contacted), and record the approval decision with the accountable lead and supporting evidence. Repeat for new providers and on material change. Review every 12 months.',
    evidenceRequirements: ['Vendor assessment criteria and scoring results', 'Verification activity records (certifications, questionnaires, references)', 'Approval decisions with accountable lead and supporting evidence'],
    testProcedures: ['Verify an assessment exists for every model provider in use', 'Verify the assessment covers data handling, PII, security and compliance', 'Verify approval preceded first use'],
    status: 'Not Started'
  },
  // AIUC1-E.7 intentionally absent: E007 was retired and merged into E004 (Q1 2026 update).
  {
    controlId: 'AIUC1-E.8',
    name: 'Review internal processes',
    description: 'Hold regular internal reviews of key AI processes — system changes, model selection and security assessments — with documented decisions, approvals and remediation tracking, and take in external feedback on risks and mitigations.',
    category: 'Accountability',
    implementationGuidance: 'Keep a central repository of quarterly review records with decision logs, risk register updates and remediation status. Collect external input (security advisories, threat intelligence, third-party recommendations) and record how it was acted on. Review every 12 months.',
    evidenceRequirements: ['Review meeting records and decision logs', 'Risk register with remediation status', 'Records of external advisories reviewed and actions taken'],
    testProcedures: ['Verify reviews occurred on the stated cadence', 'Trace a decision from the log to its remediation', 'Verify external feedback was reviewed and dispositioned'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.9',
    name: 'Monitor third-party access',
    description: 'Log third-party API connections, sessions and data access to the AI system — capturing identity, timestamps, resources accessed, session duration, origin and usage patterns — and alert on anomalous third-party access. Expanded to third-party API monitoring in the July 15 2026 release.',
    category: 'Accountability',
    implementationGuidance: 'Configure logging of third-party interactions in the cloud logging platform or SIEM with the required metadata. Define detection rules for anomalous access patterns and route alerts to responsible owners with case records. Review every 12 months.',
    evidenceRequirements: ['Logging configuration for third-party API and data access with metadata', 'Detection rules for anomalous third-party access', 'Sample alerts with assignment and resolution records'],
    testProcedures: ['Verify a sampled third-party session is logged with the required fields', 'Trigger a synthetic anomalous access and verify an alert is raised and routed', 'Review recent alert dispositions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.10',
    name: 'Establish AI acceptable use policy',
    description: 'Publish an AI acceptable use policy that defines prohibited end-user behaviour (jailbreak attempts, malicious injection, unauthorised data extraction, harmful content), detect violations, notify users when they breach it, and enforce it with guardrails.',
    category: 'Accountability',
    implementationGuidance: 'Write the policy and surface it to end users. Implement prompt analysis and output filtering to detect violations. Display user-facing warnings or error messages on breach. Add real-time blocking, violation tracking and effectiveness reviews of the enforcement. Review every 12 months.',
    evidenceRequirements: ['AI acceptable use policy', 'Violation detection configuration', 'User-facing breach notification implementation', 'Violation tracking logs and effectiveness reviews'],
    testProcedures: ['Verify the policy is published and lists the prohibited uses', 'Attempt a prohibited use and verify detection and the user notification', 'Review violation trend analysis for the last period'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.11',
    name: 'Record processing locations',
    description: 'Record where AI data is processed geographically — foundation model processing, inference endpoint regions and third-party provider sites — and assess cross-border transfer requirements for training and inference.',
    category: 'Accountability',
    implementationGuidance: 'Maintain a subprocessor list and infrastructure documentation naming regions and endpoints, with data flow diagrams. Assess transfer requirements and record the approved transfer mechanisms (for example standard contractual clauses or adequacy decisions) with risk assessments for international processing. Review every 12 months.',
    evidenceRequirements: ['Subprocessor list with provider processing locations', 'Infrastructure documentation and data flow diagrams naming regions', 'Cross-border transfer assessments and approved transfer mechanisms'],
    testProcedures: ['Verify every provider and endpoint in use appears with a location', 'Verify configured regions match the documentation', 'Verify a transfer mechanism is recorded for each cross-border flow'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.12',
    name: 'Document regulatory compliance',
    description: 'Maintain a register of the AI and data protection laws and standards that apply, the data protections they require and the compliance strategy for each, reviewed every 6 months or when a new regulatory trigger arises.',
    category: 'Accountability',
    implementationGuidance: 'Keep a compliance register or assessment memo listing applicable regulations (data protection law, sector rules, AI-specific law such as the EU AI Act), the obligations and the procedures used to meet them, scaled to the organisation. Record review dates and version history.',
    evidenceRequirements: ['Compliance register or assessment documentation', 'Policy listing of applicable regulations with compliance strategies', 'Version history showing six-monthly reviews'],
    testProcedures: ['Verify the register covers the jurisdictions and sectors the system serves', 'Confirm the last review was within 6 months', 'Trace one obligation to the procedure that satisfies it'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.13',
    name: 'Implement quality management system',
    description: '(Optional for certification) Operate a quality management system for the AI system, proportionate to organisational size, covering quality objectives and risk methodology, change management, defect tracking with post-market monitoring, data management and stakeholder and regulatory communication.',
    category: 'Accountability',
    implementationGuidance: 'Document quality objectives, metrics and the risk management methodology with performance targets and safety thresholds. Define change management with approval workflows and accountability. Run defect tracking with root cause analysis, corrective actions and post-market monitoring. Document data governance, technical documentation standards and record retention, and regulatory reporting and incident notification protocols.',
    evidenceRequirements: ['Quality objectives, metrics and risk methodology documentation', 'Change management procedures and approval workflows', 'Defect tracking records with root cause analysis and corrective actions', 'Data governance and record retention procedures', 'Regulatory reporting and stakeholder communication protocols'],
    testProcedures: ['Verify quality metrics are measured against the documented targets', 'Trace a defect from report to corrective action', 'Verify post-market monitoring is operating', 'Verify the reporting protocols name the authorities and triggers'],
    status: 'Not Started'
  },
  // AIUC1-E.14 intentionally absent: E014 was retired and merged into E017 (Q1 2026 update).
  {
    controlId: 'AIUC1-E.15',
    name: 'Log AI system activity',
    description: 'Log AI system inputs, outputs, processing steps and metadata — and for agents, provenance, tool calls, delegations and reasoning traces — where permitted, with retention, access control and sanitisation, to support incident investigation, audit and explanation of behaviour.',
    category: 'Accountability',
    implementationGuidance: 'Implement logging of inputs, outputs, processing steps and metadata. For agents, record provenance per execution, tool call parameters and results, sub-agent delegation chains, approval events and reasoning traces. Store logs with retention policies, access controls and personal data masking. Protect integrity with write-once storage, hashing or append-only databases. Review every 12 months.',
    evidenceRequirements: ['Logging implementation and sample entries with timestamps and metadata', 'Agent execution logs with provenance, tool calls and delegations', 'Log platform configuration with retention, access control and masking', 'Log integrity protection configuration where implemented'],
    testProcedures: ['Select a run and verify inputs, outputs, tool calls and delegations are all recorded', 'Verify retention and access controls on the log store', 'Verify personal data is masked in logs', 'Verify integrity protection where implemented'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.16',
    name: 'Implement AI disclosure mechanisms',
    description: 'Tell users clearly when they are interacting with an AI system rather than a human: text disclosure in chat, voice disclosure at call start, machine-readable labelling of AI-generated media, disclosure when the system acts autonomously, and a truthful answer when a user asks whether they are talking to an AI.',
    category: 'Accountability',
    implementationGuidance: 'Show disclosure notices in chatbots, messaging and widgets; play an audio disclosure at the start of voice interactions; attach metadata, watermarks or content credentials to generated media; label autonomous actions in the product; and configure the system to disclose its nature when asked. Review every 12 months.',
    evidenceRequirements: ['Text disclosure implementation in chat interfaces', 'Voice disclosure recordings or transcripts', 'Content credentials, metadata or watermark implementation for generated media', 'Automation labelling in the product', 'Sample responses to "are you an AI" inquiries'],
    testProcedures: ['Start a chat and a voice session and verify the disclosure appears', 'Inspect generated media for provenance metadata', 'Ask the system whether it is an AI and verify the answer', 'Verify autonomous actions are labelled'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.17',
    name: 'Document system transparency policy',
    description: '(Optional for certification) Maintain a system transparency policy and a repository of model cards, datasheets and interpretability reports for major systems, with a policy for sharing them externally and a statement of security responsibilities between platform provider and deployer. Absorbed the retired E014 "Share transparency reports" in the Q1 2026 update.',
    category: 'Accountability',
    implementationGuidance: 'Create model cards, datasheets or an AI bill of materials for each major system with identifiers, training data sources, dated fine-tuning records and AI-specific components. Define who may receive transparency documentation, at what level of detail and with what approval. Document the split of security responsibilities between the platform and the deploying organisation. Review every 12 months.',
    evidenceRequirements: ['Model cards, datasheets or AI bill of materials for major systems', 'Transparency documentation sharing policy', 'Shared responsibility documentation between platform and deployer'],
    testProcedures: ['Verify a transparency artefact exists for each major system and reflects the current version', 'Verify the sharing policy defines recipients, disclosure levels and approvals', 'Verify the responsibility split is documented'],
    status: 'Not Started'
  },

  // ===== F. Society (F001-F002) =====
  {
    controlId: 'AIUC1-F.1',
    name: 'Prevent AI cyber misuse',
    description: 'Guard against use of the AI system to conduct or assist cyber attacks: obtain the foundation model developer\'s documentation of offensive cyber capabilities and mitigations, and filter or block malicious code generation and attack assistance requests. Applies to text, automation, voice and code generation.',
    category: 'Society',
    implementationGuidance: 'Collect model cards or cybersecurity assessments from each foundation model provider describing offensive capabilities and the mitigations applied, and capture cyber safety commitments in contracts. Deploy content filtering and pattern matching that detects requests for malicious code or attack assistance and blocks them. Review every 12 months.',
    evidenceRequirements: ['Provider documentation of offensive cyber capabilities and mitigations', 'Content filtering configuration for cyber misuse requests', 'Vendor contract terms on cyber safety measures'],
    testProcedures: ['Verify provider documentation is on file for every model in use', 'Submit cyber attack assistance prompts and verify refusal', 'Verify blocked attempts are logged'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.2',
    name: 'Prevent catastrophic misuse',
    description: 'Guard against use of the AI system to assist with chemical, biological, radiological or nuclear weapons: document the foundation model developer\'s CBRN capability assessments and mitigations, and monitor for CBRN-related queries and weapons development patterns with alerting. Applies to text, voice and image generation.',
    category: 'Society',
    implementationGuidance: 'Obtain CBRN capability evaluations and mitigation descriptions from each foundation model provider. Configure monitoring for CBRN-related queries and suspicious interaction patterns with real-time alerting and incident logging. Review every 12 months.',
    evidenceRequirements: ['Provider CBRN capability assessments and mitigation documentation', 'Monitoring and alert rules for catastrophic misuse patterns', 'Incident logs of blocked CBRN-related attempts'],
    testProcedures: ['Verify provider CBRN documentation is on file for every model in use', 'Submit a CBRN-related test prompt and verify refusal and alerting', 'Review recent alerts and their disposition'],
    status: 'Not Started'
  }
];
