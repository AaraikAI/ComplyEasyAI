import { FrameworkControlTemplate } from './soc2Controls';

/**
 * AIUC-1 — the AI Underwriting Company standard for AI agents (v1, 2025).
 *
 * A certification standard for organisations that build or deploy AI agents,
 * organised into six pillars: Data and Privacy, Security, Safety, Reliability,
 * Accountability and Society. It is designed to be auditable and to underpin
 * insurance coverage for AI risk, and it aligns with ISO/IEC 42001, the NIST
 * AI RMF and the EU AI Act.
 *
 * Control ids follow the pillar letters used by the standard (A-F). Control
 * wording here PARAPHRASES the published requirement themes so they can be
 * operated as controls in this product; verify against the official AIUC-1
 * text before relying on this catalogue for certification purposes.
 */
export const AIUC1_CONTROLS: FrameworkControlTemplate[] = [
  // ===== A. Data and Privacy =====
  {
    controlId: 'AIUC1-A.1',
    name: 'AI Data Governance and Classification',
    description: 'Identify and classify every category of data that enters or leaves the AI agent — user prompts, retrieved documents, tool inputs and outputs, memory, transcripts and traces — and assign ownership, sensitivity and handling rules to each.',
    category: 'Data and Privacy',
    implementationGuidance: 'Maintain a data map for the agent covering ingress (prompts, uploads, retrieval sources), processing (context windows, embeddings, memory) and egress (outputs, tool calls, logs). Classify each flow by sensitivity and regulatory scope and attach handling rules. Review on every architecture change.',
    evidenceRequirements: ['AI data flow map', 'Classification and ownership per flow', 'Change review records'],
    testProcedures: ['Trace a live request through the map and verify every flow is documented', 'Sample flows and confirm classification is applied in configuration', 'Verify the map was reviewed after the last architecture change'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.2',
    name: 'Data Minimisation and Purpose Limitation for Prompts and Context',
    description: 'Limit the data placed into prompts, retrieval context and agent memory to what the task requires, and prohibit re-use of that data for purposes users did not agree to.',
    category: 'Data and Privacy',
    implementationGuidance: 'Design retrieval and memory so only task-relevant fields are injected. Strip or tokenise unnecessary personal data before it reaches the model. Document approved purposes for prompt and output data and enforce them in code review and configuration.',
    evidenceRequirements: ['Context construction design showing field selection', 'Approved-purpose register for AI data', 'Code review records for context builders'],
    testProcedures: ['Inspect constructed prompts for a sample of tasks and verify no unnecessary personal data is present', 'Verify purpose restrictions are documented and enforced', 'Confirm review of context-building code changes'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.3',
    name: 'Personal Data Detection and Redaction in Inputs, Outputs and Logs',
    description: 'Detect personal and sensitive data in prompts, model outputs and traces, and redact, mask or tokenise it before storage, display to unauthorised parties, or transmission to third-party model providers where not permitted.',
    category: 'Data and Privacy',
    implementationGuidance: 'Deploy detection for identifiers, financial and health data at the ingress, egress and logging boundaries. Redact by default in logs and traces. Measure detection precision and recall on representative samples and tune thresholds.',
    evidenceRequirements: ['Redaction pipeline configuration', 'Detection accuracy test results', 'Sample redacted logs'],
    testProcedures: ['Submit synthetic personal data and verify redaction in logs and outputs', 'Review accuracy metrics against targets', 'Confirm redaction precedes third-party transmission where required'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.4',
    name: 'Training and Fine-Tuning Data Provenance, Rights and Consent',
    description: 'For any data used to train, fine-tune or evaluate models, document its source, licence or consent basis, collection method and known limitations, and exclude data lacking a lawful basis.',
    category: 'Data and Privacy',
    implementationGuidance: 'Maintain a datasheet for every training or evaluation dataset covering provenance, rights, consent, personal data content and preprocessing. Gate training runs on datasheet completion and rights review.',
    evidenceRequirements: ['Dataset datasheets', 'Rights and consent review records', 'Training run approvals linked to datasheets'],
    testProcedures: ['Sample datasets and verify datasheets are complete', 'Verify rights reviews precede training runs', 'Confirm excluded data is not present in training corpora'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.5',
    name: 'Customer Data Non-Training and Retention Terms With Model Providers',
    description: 'Ensure contracts and configurations with third-party model providers prohibit training on customer data and limit retention of prompts and outputs, using zero-retention or enterprise data options where available.',
    category: 'Data and Privacy',
    implementationGuidance: 'Review provider terms for training and retention commitments. Enable enterprise or zero-retention modes. Record the configuration per provider and re-verify when terms or APIs change.',
    evidenceRequirements: ['Provider contracts and data-use terms', 'Provider configuration evidence (retention and training settings)', 'Periodic re-verification records'],
    testProcedures: ['Verify each provider contract contains non-training terms', 'Inspect provider settings for retention mode', 'Confirm re-verification after the last terms change'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.6',
    name: 'Retention and Deletion of Prompts, Completions and Traces',
    description: 'Define and enforce retention periods for prompts, completions, embeddings, memory and traces, delete on expiry or user request, and propagate deletion to providers and vector stores.',
    category: 'Data and Privacy',
    implementationGuidance: 'Set retention per data class with justification. Automate deletion jobs across logs, vector databases and memory stores, and honour user deletion requests end to end. Verify deletion with sampling.',
    evidenceRequirements: ['Retention schedule for AI data classes', 'Deletion job logs', 'Deletion verification samples'],
    testProcedures: ['Verify retention settings match the schedule', 'Test a user deletion request across all stores', 'Sample expired records and confirm removal'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.7',
    name: 'Access Control to AI Data Stores',
    description: 'Restrict access to prompts, transcripts, embeddings, memory and evaluation data to authorised roles, enforce least privilege, and log all access.',
    category: 'Data and Privacy',
    implementationGuidance: 'Apply role-based access to vector databases, trace stores and transcript archives. Separate production data from development. Review access quarterly and alert on bulk export.',
    evidenceRequirements: ['Access control configuration for AI data stores', 'Quarterly access reviews', 'Access and export logs'],
    testProcedures: ['Verify role assignments follow least privilege', 'Confirm the latest quarterly review', 'Test that bulk export raises an alert'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-A.8',
    name: 'Residency and Cross-Border Controls for AI Data Flows',
    description: 'Know where prompts, outputs and training data are processed and stored — including model provider regions — and enforce residency commitments made to customers and required by law.',
    category: 'Data and Privacy',
    implementationGuidance: 'Record processing regions for each provider and store. Pin regions to meet commitments, and block flows that would move data outside permitted regions. Re-verify when providers change infrastructure.',
    evidenceRequirements: ['Region map of AI processing and storage', 'Residency configuration evidence', 'Provider region verification'],
    testProcedures: ['Verify configured regions against commitments', 'Test that out-of-region routing is blocked', 'Confirm provider region verification is current'],
    status: 'Not Started'
  },

  // ===== B. Security =====
  {
    controlId: 'AIUC1-B.1',
    name: 'Prompt Injection and Jailbreak Defence',
    description: 'Defend against direct and indirect prompt injection and jailbreak attempts through input validation, instruction hierarchy, sanitisation of retrieved and tool-returned content, and output constraints.',
    category: 'Security',
    implementationGuidance: 'Treat all retrieved documents, web content and tool results as untrusted. Separate system instructions from user and retrieved content, apply injection detection, constrain outputs with schemas, and monitor for policy violations. Update defences from red-team findings.',
    evidenceRequirements: ['Injection defence design', 'Detection and constraint configuration', 'Defence update log tied to findings'],
    testProcedures: ['Run a library of injection and jailbreak prompts and record the block rate', 'Verify retrieved content is sanitised before use', 'Confirm defences were updated after recent findings'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.2',
    name: 'Adversarial Red-Teaming Before Release and on Change',
    description: 'Conduct structured adversarial testing of the agent — including injection, data exfiltration, tool abuse and harmful-output attempts — before initial release and after material changes to models, prompts or tools.',
    category: 'Security',
    implementationGuidance: 'Define a red-team methodology and attack library covering security and safety. Execute before release and on change, track findings to remediation, and retain reports. Include external testers for high-risk agents.',
    evidenceRequirements: ['Red-team methodology and attack library', 'Red-team reports per release', 'Remediation tracking'],
    testProcedures: ['Verify a red-team exercise preceded the latest release', 'Review findings and their closure', 'Confirm the attack library covers required categories'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.3',
    name: 'Least-Privilege Tool and Action Permissions for Agents',
    description: 'Scope every tool, API and action an agent can invoke to the minimum required, use per-agent credentials, allow-list destinations, and require human approval for destructive or high-impact actions.',
    category: 'Security',
    implementationGuidance: 'Inventory agent tools and map each to the permissions it needs. Issue scoped, short-lived credentials per agent. Classify actions by impact and gate destructive ones (payments, deletions, external sends) behind approval or dry-run modes.',
    evidenceRequirements: ['Tool and permission inventory', 'Credential scoping evidence', 'Approval gate configuration for high-impact actions'],
    testProcedures: ['Attempt an out-of-scope action and verify it is denied', 'Verify credentials are scoped and rotate', 'Test that a destructive action requires approval'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.4',
    name: 'Isolation of Secrets and Credentials From Model Context',
    description: 'Keep API keys, tokens and other secrets out of prompts, model context and outputs; brokers execute authenticated actions on behalf of the agent without exposing credentials to the model.',
    category: 'Security',
    implementationGuidance: 'Route tool authentication through a broker or gateway that injects credentials outside the model boundary. Scan prompts, outputs and logs for secret patterns and block or redact. Rotate any credential that appears in model-visible data.',
    evidenceRequirements: ['Credential broker architecture', 'Secret scanning configuration for AI data paths', 'Rotation records for exposures'],
    testProcedures: ['Verify tools authenticate outside the model context', 'Inject a synthetic secret and verify it is blocked from output and logs', 'Confirm exposures triggered rotation'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.5',
    name: 'Safe Handling of Model Output in Downstream Systems',
    description: 'Treat model output as untrusted input to downstream systems: validate against schemas, encode for the destination, use parameterised queries, and never pass output directly to shells, interpreters or privileged APIs.',
    category: 'Security',
    implementationGuidance: 'Define output contracts per tool and validate before execution. Apply context-appropriate encoding for HTML, SQL and command contexts. Prohibit direct execution of generated code outside a sandbox. Cover these rules in secure-coding standards for agent developers.',
    evidenceRequirements: ['Output validation schemas', 'Secure coding standard for agent integrations', 'Code review or static analysis results'],
    testProcedures: ['Feed malicious output shapes to downstream handlers and verify rejection', 'Verify encoding in a sample of integrations', 'Confirm no direct execution paths exist'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.6',
    name: 'Model and Component Supply-Chain Integrity',
    description: 'Verify the provenance and integrity of models, weights, adapters, prompts, plugins and AI libraries; maintain an inventory (an AI bill of materials) and manage vulnerabilities in AI components.',
    category: 'Security',
    implementationGuidance: 'Record source, version and checksum for every model artefact and plugin. Prefer signed artefacts and pinned versions. Track advisories for AI frameworks and libraries and patch within defined timelines.',
    evidenceRequirements: ['AI component inventory with provenance and checksums', 'Signature or integrity verification records', 'Vulnerability management records for AI components'],
    testProcedures: ['Verify checksums for deployed model artefacts', 'Sample components and confirm versions are pinned', 'Review patch timelines for recent advisories'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.7',
    name: 'Sandboxed Tool Execution and Network Egress Controls',
    description: 'Execute agent tools — especially code execution and browsing — in isolated sandboxes with restricted filesystem, process and network access, and control outbound network destinations.',
    category: 'Security',
    implementationGuidance: 'Run tools in ephemeral containers or sandboxes with no access to production secrets, egress allow-lists and resource limits. Log sandbox activity and destroy environments after use.',
    evidenceRequirements: ['Sandbox architecture and configuration', 'Egress allow-list', 'Sandbox activity logs'],
    testProcedures: ['Attempt a disallowed egress from a tool and verify it is blocked', 'Verify sandboxes lack production credentials', 'Confirm environments are destroyed after use'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-B.8',
    name: 'Security Monitoring and Logging of Agent Actions',
    description: 'Log agent inputs, decisions, tool calls and outputs with integrity protection, monitor for anomalous behaviour such as unexpected tool use or data exfiltration, and integrate alerts with security operations.',
    category: 'Security',
    implementationGuidance: 'Emit structured traces for every agent run. Define detections for anomalous tool sequences, volume spikes, sensitive-data egress and policy violations. Route alerts to the SOC with runbooks.',
    evidenceRequirements: ['Trace schema and retention', 'Detection rules', 'Alert and response records'],
    testProcedures: ['Verify a complete trace exists for sampled runs', 'Trigger a detection with a synthetic anomaly', 'Review response records for recent alerts'],
    status: 'Not Started'
  },

  // ===== C. Safety =====
  {
    controlId: 'AIUC1-C.1',
    name: 'Harm Taxonomy and Prohibited-Output Policy',
    description: 'Define the categories of harmful content and behaviour the agent must not produce or facilitate — including violence, self-harm, sexual content involving minors, weapons, hate, illegal activity and dangerous advice — and the thresholds for each.',
    category: 'Safety',
    implementationGuidance: 'Adopt a harm taxonomy with definitions, severity tiers and examples. Map each category to detection, refusal and escalation behaviour. Review the taxonomy at least annually and after incidents.',
    evidenceRequirements: ['Harm taxonomy document', 'Category-to-control mapping', 'Review records'],
    testProcedures: ['Verify every category has a mapped control', 'Confirm the taxonomy was reviewed within the period', 'Check incident learnings were incorporated'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.2',
    name: 'Pre-Deployment Safety Evaluation',
    description: 'Evaluate the agent against the harm taxonomy before deployment using adversarial and representative test sets, and block release when results fall below defined thresholds.',
    category: 'Safety',
    implementationGuidance: 'Build safety evaluation suites per harm category. Set pass thresholds, run them in the release pipeline, and require sign-off on results. Retain results for each release.',
    evidenceRequirements: ['Safety evaluation suites', 'Release results with thresholds', 'Sign-off records'],
    testProcedures: ['Verify evaluations ran for the latest release', 'Confirm results met thresholds or release was blocked', 'Review sign-off'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.3',
    name: 'Runtime Safety Filters and Refusal Behaviour',
    description: 'Apply input and output safety classifiers at runtime, refuse or safely reformulate prohibited requests, and provide appropriate resources for sensitive topics such as self-harm.',
    category: 'Safety',
    implementationGuidance: 'Deploy safety classifiers on inputs and outputs with tuned thresholds. Design refusal messages and safe alternatives. Route self-harm and crisis indicators to support resources. Measure false positive and negative rates.',
    evidenceRequirements: ['Classifier configuration', 'Refusal and resource response design', 'Classifier performance metrics'],
    testProcedures: ['Submit prohibited prompts and verify refusal', 'Verify crisis prompts return support resources', 'Review classifier metrics against targets'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.4',
    name: 'Human Oversight for High-Stakes Actions',
    description: 'Require human review or approval before the agent takes actions with significant financial, legal, safety or irreversible consequences, and provide an immediate stop mechanism.',
    category: 'Safety',
    implementationGuidance: 'Classify actions by stakes. Implement approval workflows for high-stakes actions, an operator kill switch, and clear visibility of pending and executed actions. Test the stop mechanism regularly.',
    evidenceRequirements: ['Action stakes classification', 'Approval workflow configuration', 'Kill switch test records'],
    testProcedures: ['Verify high-stakes actions require approval', 'Exercise the kill switch and verify agent halt', 'Review approval logs'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.5',
    name: 'Escalation and Handoff to Humans',
    description: 'Detect situations beyond the agent competence or policy — uncertainty, user distress, disputes, legal or medical questions — and hand off to a human with context, without abandoning the user.',
    category: 'Safety',
    implementationGuidance: 'Define escalation triggers and routes. Pass conversation context securely to human agents. Measure handoff latency and completion. Make escalation available on user request at any time.',
    evidenceRequirements: ['Escalation trigger definitions', 'Handoff workflow and metrics', 'User-initiated escalation availability'],
    testProcedures: ['Trigger each escalation condition and verify handoff', 'Verify context transfer to the human agent', 'Test user-initiated escalation'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.6',
    name: 'Misuse and Dual-Use Prevention',
    description: 'Prevent use of the agent for prohibited purposes through acceptable-use terms, abuse monitoring, rate limiting, account controls and enforcement.',
    category: 'Safety',
    implementationGuidance: 'Publish acceptable-use terms aligned to the harm taxonomy. Monitor for abuse patterns, apply rate limits and friction for suspicious use, and enforce with warnings or suspension. Report severe misuse per legal obligations.',
    evidenceRequirements: ['Acceptable-use policy', 'Abuse monitoring rules and enforcement records', 'Rate limiting configuration'],
    testProcedures: ['Verify acceptable-use terms are published and accepted', 'Simulate abuse patterns and verify detection', 'Review enforcement actions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.7',
    name: 'Safety Incident Reporting and Learning Loop',
    description: 'Capture safety incidents and near misses from users, staff and monitoring, analyse root causes, and feed corrections into taxonomy, evaluations and runtime controls.',
    category: 'Safety',
    implementationGuidance: 'Provide in-product and internal reporting channels. Triage incidents by severity, perform root-cause analysis, and track corrective actions into evaluation suites and filters. Review trends quarterly.',
    evidenceRequirements: ['Incident reporting channels', 'Incident register with root causes', 'Corrective action tracking'],
    testProcedures: ['Submit a test report and verify intake', 'Review root-cause analyses for recent incidents', 'Confirm corrective actions updated controls'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-C.8',
    name: 'Protections for Minors and Vulnerable Users',
    description: 'Apply age-appropriate design and additional safeguards where the agent may interact with minors or vulnerable users, including restricted content, restricted data collection and heightened escalation.',
    category: 'Safety',
    implementationGuidance: 'Assess whether minors or vulnerable users can reach the agent. Where they can, apply age assurance, stricter safety thresholds, reduced data collection and faster escalation. Review with child-safety expertise.',
    evidenceRequirements: ['Audience and vulnerability assessment', 'Age-appropriate configuration', 'Expert review records'],
    testProcedures: ['Verify stricter thresholds apply for minor accounts', 'Test escalation paths for vulnerable-user indicators', 'Confirm expert review occurred'],
    status: 'Not Started'
  },

  // ===== D. Reliability =====
  {
    controlId: 'AIUC1-D.1',
    name: 'Defined Intended Use and Scope Boundaries',
    description: 'Document the intended use, users, tasks and operating conditions of the agent, and design it to recognise and decline out-of-scope requests.',
    category: 'Reliability',
    implementationGuidance: 'Write an intended-use specification. Implement scope classifiers or instructions that redirect out-of-scope requests. Review scope on feature change and monitor scope drift in production.',
    evidenceRequirements: ['Intended-use specification', 'Out-of-scope handling design', 'Scope drift monitoring'],
    testProcedures: ['Submit out-of-scope requests and verify handling', 'Verify the specification is current', 'Review scope drift metrics'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.2',
    name: 'Factuality and Hallucination Controls',
    description: 'Reduce and detect fabricated content through grounding in trusted sources, citation of evidence, confidence signalling and abstention when the agent cannot support an answer.',
    category: 'Reliability',
    implementationGuidance: 'Ground responses with retrieval from vetted sources and require citations for factual claims. Measure hallucination rates on evaluation sets. Configure abstention or hedging when confidence is low, and display uncertainty to users.',
    evidenceRequirements: ['Grounding and citation design', 'Hallucination rate measurements', 'Abstention configuration'],
    testProcedures: ['Evaluate a factual test set and record hallucination rate', 'Verify citations resolve to the cited sources', 'Test abstention on unanswerable questions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.3',
    name: 'Evaluation Suite and Regression Testing',
    description: 'Maintain evaluation sets that represent real tasks and edge cases, define quality thresholds, and run them on every model, prompt or tool change to prevent regressions.',
    category: 'Reliability',
    implementationGuidance: 'Curate golden datasets with expected outcomes. Automate evaluation in the delivery pipeline with thresholds that block release. Version datasets and results. Refresh sets from production failures.',
    evidenceRequirements: ['Evaluation datasets and versions', 'Pipeline gating configuration', 'Evaluation results per change'],
    testProcedures: ['Verify evaluations gate releases', 'Review results for the latest changes', 'Confirm datasets were refreshed from production issues'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.4',
    name: 'Tool-Call Robustness and Failure Handling',
    description: 'Validate tool arguments, handle tool errors and timeouts gracefully, make actions idempotent where possible, and prevent repeated or runaway actions.',
    category: 'Reliability',
    implementationGuidance: 'Define argument schemas and validate before invocation. Implement retries with limits, idempotency keys for state-changing calls, circuit breakers and loop detection. Surface failures to users honestly.',
    evidenceRequirements: ['Tool argument schemas', 'Retry, idempotency and loop-detection configuration', 'Failure handling test results'],
    testProcedures: ['Inject tool failures and verify graceful handling', 'Verify idempotency on repeated state-changing calls', 'Test loop detection halts runaway sequences'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.5',
    name: 'Model, Prompt and Configuration Change Management',
    description: 'Version and control changes to models, prompts, tools and parameters; test before release, roll out progressively, and retain the ability to roll back.',
    category: 'Reliability',
    implementationGuidance: 'Treat prompts and configurations as code with review and versioning. Use staged rollouts with monitoring gates and documented rollback. Record provider model version changes and re-run evaluations.',
    evidenceRequirements: ['Version control for prompts and configuration', 'Rollout and rollback procedures', 'Change records with evaluation results'],
    testProcedures: ['Verify changes are versioned and reviewed', 'Review a recent staged rollout', 'Exercise rollback in a test environment'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.6',
    name: 'Production Monitoring for Drift and Degradation',
    description: 'Monitor quality, safety and behaviour metrics in production to detect drift from evaluation baselines or provider-side changes, with alerts and defined responses.',
    category: 'Reliability',
    implementationGuidance: 'Define production metrics (task success, refusal rates, escalation rates, latency, user feedback). Sample outputs for review. Alert on deviation from baselines and investigate provider changes.',
    evidenceRequirements: ['Production metric definitions and dashboards', 'Alert thresholds', 'Investigation records'],
    testProcedures: ['Verify metrics are collected and reviewed', 'Trigger a threshold and verify alerting', 'Review recent investigations'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.7',
    name: 'Availability, Latency and Graceful Degradation',
    description: 'Define service objectives for the agent, implement fallbacks for provider outages or rate limits, and degrade gracefully rather than failing silently.',
    category: 'Reliability',
    implementationGuidance: 'Set SLOs for availability and latency. Configure provider failover or fallback models, queueing and clear user messaging during degradation. Test failover regularly.',
    evidenceRequirements: ['SLO definitions and reports', 'Failover configuration', 'Failover test records'],
    testProcedures: ['Review SLO attainment', 'Simulate provider outage and verify fallback', 'Confirm users receive clear degradation messaging'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-D.8',
    name: 'Reproducibility and Traceability of Agent Runs',
    description: 'Record the model version, prompt version, tools, parameters, inputs and outputs for each run so behaviour can be reproduced and investigated.',
    category: 'Reliability',
    implementationGuidance: 'Capture run metadata and traces with correlation ids. Store configuration snapshots per release. Provide investigators the ability to replay a run against the same configuration.',
    evidenceRequirements: ['Trace schema including versions and parameters', 'Configuration snapshots', 'Replay procedure'],
    testProcedures: ['Select a run and reproduce it from recorded metadata', 'Verify configuration snapshots exist per release', 'Confirm correlation across logs'],
    status: 'Not Started'
  },

  // ===== E. Accountability =====
  {
    controlId: 'AIUC1-E.1',
    name: 'AI Governance Structure, Roles and Executive Ownership',
    description: 'Establish governance for AI agents with executive accountability, defined roles for development, risk, security and legal, and a policy set covering the AIUC-1 pillars.',
    category: 'Accountability',
    implementationGuidance: 'Charter an AI governance body with decision rights. Assign accountable owners per pillar. Approve and maintain AI policies and report to leadership on risk posture.',
    evidenceRequirements: ['Governance charter and membership', 'Role assignments', 'AI policy set and approvals'],
    testProcedures: ['Verify the governance body meets and records decisions', 'Confirm owners are assigned per pillar', 'Review policy approvals'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.2',
    name: 'Use-Case Risk Assessment and Regulatory Classification',
    description: 'Assess each agent use case for risk to users, third parties and the organisation, classify it under applicable regulation (for example EU AI Act risk tiers), and apply controls proportionate to the classification.',
    category: 'Accountability',
    implementationGuidance: 'Use a standard AI risk assessment covering harm, likelihood, affected populations and legal obligations. Record classification and required controls. Re-assess on material change.',
    evidenceRequirements: ['Risk assessments per use case', 'Regulatory classification records', 'Control requirements derived from classification'],
    testProcedures: ['Sample use cases and verify assessments exist', 'Verify classification rationale', 'Confirm required controls are implemented'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.3',
    name: 'System and Model Documentation',
    description: 'Maintain documentation for each agent and underlying model — purpose, architecture, data, evaluation results, limitations, known risks and operating instructions — in the form of system and model cards.',
    category: 'Accountability',
    implementationGuidance: 'Produce a system card per agent and a model card per model or provider model used. Keep them current with releases and make them available to customers and auditors as appropriate.',
    evidenceRequirements: ['System cards', 'Model cards', 'Documentation update records'],
    testProcedures: ['Verify a system card exists for each agent', 'Check cards reflect the current release', 'Confirm limitations and risks are documented'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.4',
    name: 'Audit Trail of Agent Decisions and Actions',
    description: 'Retain tamper-evident records of agent decisions, actions taken, approvals and outcomes sufficient for audit, dispute resolution and regulatory inquiry.',
    category: 'Accountability',
    implementationGuidance: 'Log decisions and actions with actor, time, inputs and rationale where available. Protect log integrity and define retention aligned to legal requirements. Provide audit export.',
    evidenceRequirements: ['Audit log schema and integrity controls', 'Retention policy', 'Audit export capability'],
    testProcedures: ['Retrieve the audit trail for a sampled action', 'Verify integrity protection', 'Confirm retention meets policy'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.5',
    name: 'Third-Party and Model Vendor Risk Management',
    description: 'Assess and monitor model providers, data vendors and AI component suppliers for security, privacy, safety and continuity risk, with contractual protections and exit plans.',
    category: 'Accountability',
    implementationGuidance: 'Include AI providers in vendor risk management with AI-specific questions (training data, safety practices, incident notification, model change notice). Maintain exit and substitution plans.',
    evidenceRequirements: ['Vendor risk assessments for AI providers', 'Contracts with AI-specific protections', 'Exit plans'],
    testProcedures: ['Verify assessments for each AI provider', 'Review contracts for required protections', 'Confirm exit plans are tested or reviewed'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.6',
    name: 'AI Incident Response Plan and Notification',
    description: 'Maintain an incident response plan covering AI-specific failures — harmful outputs, data exposure, unauthorised actions, model compromise — with roles, containment steps and notification to affected parties, customers and regulators.',
    category: 'Accountability',
    implementationGuidance: 'Extend the incident response plan with AI playbooks and severity definitions. Include model rollback and tool disablement as containment steps. Rehearse annually with tabletop exercises.',
    evidenceRequirements: ['AI incident playbooks', 'Notification procedures and templates', 'Exercise records'],
    testProcedures: ['Walk through an AI incident tabletop', 'Verify containment steps are executable', 'Review notification timelines'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.7',
    name: 'User Transparency and AI Disclosure',
    description: 'Inform users clearly that they are interacting with an AI agent, what it can and cannot do, how their data is used, and how to reach a human.',
    category: 'Accountability',
    implementationGuidance: 'Display AI disclosure at the start of interaction and in help content. Publish capability and limitation statements and data-use information. Provide a visible path to human assistance.',
    evidenceRequirements: ['Disclosure copy and placement', 'Capability and limitation statements', 'Human assistance path'],
    testProcedures: ['Verify disclosure appears at interaction start', 'Review statements for accuracy', 'Test the path to a human'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-E.8',
    name: 'Complaint, Appeal and Redress Mechanism',
    description: 'Provide users a way to contest agent outputs or actions, obtain human review, and receive remediation where the agent caused harm or error.',
    category: 'Accountability',
    implementationGuidance: 'Offer a complaint channel tied to the audit trail. Route contested decisions to human review with defined timelines. Record outcomes and remediation and feed patterns into improvement.',
    evidenceRequirements: ['Complaint channel and procedure', 'Review timelines and records', 'Remediation outcomes'],
    testProcedures: ['Submit a test complaint and verify human review', 'Review adherence to timelines', 'Confirm remediation was recorded'],
    status: 'Not Started'
  },

  // ===== F. Society =====
  {
    controlId: 'AIUC1-F.1',
    name: 'Bias and Fairness Testing Across Affected Groups',
    description: 'Test agent behaviour and outcomes for disparate treatment or impact across protected and relevant groups, mitigate identified disparities, and monitor in production.',
    category: 'Society',
    implementationGuidance: 'Define fairness metrics appropriate to the use case. Test with representative and counterfactual inputs before release and periodically. Document mitigations and residual disparities.',
    evidenceRequirements: ['Fairness metric definitions', 'Test results across groups', 'Mitigation records'],
    testProcedures: ['Review fairness test results for the latest release', 'Verify counterfactual tests were run', 'Confirm mitigations for identified disparities'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.2',
    name: 'Accessibility and Inclusive Design',
    description: 'Make the agent usable by people with disabilities and across languages and literacy levels, meeting applicable accessibility standards.',
    category: 'Society',
    implementationGuidance: 'Test interfaces against accessibility standards, support assistive technologies, offer alternative modalities where feasible, and evaluate language coverage against the user base.',
    evidenceRequirements: ['Accessibility test results', 'Assistive technology support evidence', 'Language coverage assessment'],
    testProcedures: ['Run accessibility audits on agent interfaces', 'Test with a screen reader', 'Verify language coverage decisions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.3',
    name: 'Manipulation and Dark-Pattern Avoidance',
    description: 'Prohibit agent behaviours that exploit cognitive biases or vulnerabilities, apply undue pressure, or deceive users into decisions against their interests.',
    category: 'Society',
    implementationGuidance: 'Set design principles and prompt policies against manipulation. Review persuasive features with ethics and legal input. Test for pressure tactics and deceptive claims in evaluation sets.',
    evidenceRequirements: ['Design principles and prompt policies', 'Ethics review records', 'Evaluation results for manipulation tests'],
    testProcedures: ['Review prompts and flows for manipulative patterns', 'Run manipulation test cases', 'Confirm ethics review of persuasive features'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.4',
    name: 'Synthetic Content Provenance and Labelling',
    description: 'Label AI-generated text, images, audio and video where users or recipients could be misled, and apply content provenance or watermarking where available.',
    category: 'Society',
    implementationGuidance: 'Determine where generated content leaves the product. Apply labels and provenance metadata (for example content credentials) and preserve them through processing. Document exceptions.',
    evidenceRequirements: ['Labelling and provenance implementation', 'Coverage assessment of generated outputs', 'Exception register'],
    testProcedures: ['Verify labels on sampled generated content', 'Check provenance metadata survives export', 'Review exceptions'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.5',
    name: 'Misinformation and Civic-Integrity Safeguards',
    description: 'Prevent the agent from generating or amplifying misinformation on high-stakes civic topics such as elections, public health and emergencies, and route such topics to authoritative sources.',
    category: 'Society',
    implementationGuidance: 'Identify high-stakes topics and configure grounding to authoritative sources or abstention. Test with misinformation prompts. Update handling during elections and emergencies.',
    evidenceRequirements: ['High-stakes topic policy', 'Grounding and abstention configuration', 'Misinformation test results'],
    testProcedures: ['Submit misinformation prompts and verify handling', 'Verify authoritative sourcing for civic topics', 'Confirm heightened handling during defined periods'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.6',
    name: 'Environmental Impact Measurement and Reduction',
    description: 'Measure the energy and emissions footprint of training and inference for the agent, and pursue reductions such as model right-sizing, caching and efficient infrastructure.',
    category: 'Society',
    implementationGuidance: 'Estimate compute and energy for training and inference using provider data. Set reduction targets, prefer efficient models for routine tasks, and report progress.',
    evidenceRequirements: ['Footprint estimates', 'Reduction targets and initiatives', 'Progress reports'],
    testProcedures: ['Review footprint methodology', 'Verify initiatives are implemented', 'Confirm reporting cadence'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.7',
    name: 'Workforce and Stakeholder Impact Assessment',
    description: 'Assess the impact of agent deployment on employees, customers and communities, engage affected stakeholders, and plan transitions and safeguards.',
    category: 'Society',
    implementationGuidance: 'Conduct impact assessments covering job roles, customer experience and community effects. Consult affected groups, document decisions and mitigations, and revisit after deployment.',
    evidenceRequirements: ['Impact assessments', 'Stakeholder consultation records', 'Mitigation and transition plans'],
    testProcedures: ['Verify an assessment preceded deployment', 'Review consultation evidence', 'Confirm mitigations are in progress'],
    status: 'Not Started'
  },
  {
    controlId: 'AIUC1-F.8',
    name: 'Prohibited and Restricted Use Policy Enforcement',
    description: 'Define uses the agent must not support — such as unlawful surveillance, social scoring, discriminatory profiling and manipulation of vulnerable groups — and enforce the policy through design, contracts and monitoring.',
    category: 'Society',
    implementationGuidance: 'Publish a prohibited-use policy aligned to law and the harm taxonomy. Encode restrictions in system instructions and tool permissions. Include the policy in customer terms and monitor for violations.',
    evidenceRequirements: ['Prohibited-use policy', 'Technical enforcement configuration', 'Monitoring and enforcement records'],
    testProcedures: ['Attempt a prohibited use and verify refusal', 'Verify customer terms include the policy', 'Review enforcement records'],
    status: 'Not Started'
  }
];
