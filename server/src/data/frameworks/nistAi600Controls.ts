import { FrameworkControlTemplate } from './soc2Controls';

/**
 * NIST AI 600-1: Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (July 2024)
 *
 * A companion resource to the NIST AI RMF 1.0 specifically addressing the
 * risks of generative AI. Identifies twelve GenAI-specific risks and maps
 * suggested actions to the four core RMF functions: Govern (GV), Map (MP),
 * Measure (MS), and Manage (MG).
 *
 * Twelve GenAI Risks Addressed:
 *   1. Confabulation (hallucination)
 *   2. Dangerous, violent, or hateful content
 *   3. Data privacy
 *   4. Environmental impact
 *   5. Harmful bias and homogenization
 *   6. Human-AI configuration
 *   7. Information integrity
 *   8. Information security
 *   9. Intellectual property
 *  10. Obscene, degrading, or abusive content
 *  11. Value chain and component integration
 *  12. CBRN and dangerous cyber capabilities
 *
 * Control IDs follow the convention GAI-<Function>-<Number>.<Number> where
 * Function is GV, MP, MS, or MG matching the AI RMF Core.
 */
export const NIST_AI_600_1_CONTROLS: FrameworkControlTemplate[] = [
  // ===== GOVERN (GV) =====
  {
    controlId: 'GAI-GV-1.1',
    name: 'GenAI governance policies and accountabilities',
    description: 'Establish, maintain, and communicate policies, procedures, and authority structures for the design, development, deployment, and use of generative AI systems, with clearly assigned accountabilities.',
    category: 'Govern - Policies and Procedures',
    implementationGuidance: 'Publish a generative AI policy covering acceptable use, prohibited use, content moderation expectations, and human review thresholds. Maintain a RACI matrix for GenAI risk owners. Tie accountabilities to performance objectives. Review the policy on regulatory or model capability changes.',
    evidenceRequirements: ['Approved generative AI policy', 'GenAI RACI matrix', 'Performance objectives referencing GenAI accountability', 'Policy review history'],
    testProcedures: ['Inspect policy approval and currency', 'Verify RACI covers all twelve GenAI risk categories', 'Sample objectives for GenAI accountability language'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-GV-1.2',
    name: 'GenAI risk tolerance and acceptance criteria',
    description: 'Define and document risk tolerance thresholds specific to generative AI, including criteria for accepting risks related to confabulation, harmful content, privacy, intellectual property, and information integrity.',
    category: 'Govern - Risk Tolerance',
    implementationGuidance: 'Author a GenAI risk tolerance statement establishing acceptable error rates, content moderation precision/recall targets, and prohibited outputs. Require executive approval to operate above tolerance. Review tolerance after material incidents.',
    evidenceRequirements: ['GenAI risk tolerance statement', 'Tolerance approval signatures', 'Above-tolerance operation approvals', 'Post-incident tolerance reviews'],
    testProcedures: ['Inspect tolerance statement against the twelve risks', 'Verify approval signatures', 'Sample above-tolerance operations for executive approval'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-GV-2.1',
    name: 'GenAI roles, responsibilities, and training',
    description: 'Define and assign roles and responsibilities for GenAI risk management throughout the lifecycle and provide ongoing training on GenAI-specific risks and mitigations to relevant personnel.',
    category: 'Govern - Accountability and Training',
    implementationGuidance: 'Create role definitions for GenAI product owner, prompt engineer, red team lead, content moderation reviewer, and human-AI interaction designer. Deliver structured training on confabulation, prompt injection, bias, and IP issues. Track completion.',
    evidenceRequirements: ['GenAI role definitions', 'GenAI training curricula', 'Completion records', 'Refresher schedule'],
    testProcedures: ['Inspect role definitions and assignments', 'Verify curriculum covers all twelve GenAI risks', 'Sample completion records'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-GV-3.2',
    name: 'GenAI third-party and supply chain governance',
    description: 'Establish processes to evaluate, select, contract with, and oversee third-party providers of generative AI models, datasets, and components, addressing model provenance, training data disclosures, and incident notification.',
    category: 'Govern - Third Parties',
    implementationGuidance: 'Maintain a GenAI supplier inventory. Require model cards, system cards, training data disclosures, and evaluation reports in procurement. Include GenAI-specific clauses (incident notification, IP indemnification, model change notice) in contracts. Reassess suppliers annually.',
    evidenceRequirements: ['GenAI supplier inventory', 'Procurement intake forms requiring GenAI disclosures', 'Executed contracts with GenAI clauses', 'Annual reassessment records'],
    testProcedures: ['Inspect inventory completeness', 'Sample supplier contracts for required clauses', 'Verify reassessment cadence'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-GV-4.1',
    name: 'GenAI organizational culture supporting risk identification',
    description: 'Foster an organizational culture that encourages identification, communication, and management of GenAI risks, including ethical concerns and emerging harms, with protections for those who report concerns.',
    category: 'Govern - Culture',
    implementationGuidance: 'Provide a confidential reporting channel for GenAI ethics concerns. Publish an anti-retaliation commitment. Recognize teams that surface and remediate GenAI risks. Survey staff annually on culture indicators.',
    evidenceRequirements: ['Confidential reporting channel documentation', 'Anti-retaliation policy', 'Recognition program records', 'Culture survey results'],
    testProcedures: ['Verify reporting channel operability', 'Inspect anti-retaliation policy publication', 'Sample survey results for GenAI items'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-GV-5.1',
    name: 'GenAI external stakeholder engagement',
    description: 'Engage with external stakeholders including affected communities, civil society, and downstream users to incorporate diverse perspectives on the impacts and acceptability of GenAI deployments.',
    category: 'Govern - Stakeholders',
    implementationGuidance: 'Establish advisory mechanisms (advisory boards, community panels, public consultations) for high-impact GenAI deployments. Document input received and how it influenced decisions. Publish summaries of engagement.',
    evidenceRequirements: ['Stakeholder engagement plan', 'Engagement records and minutes', 'Decision documentation referencing stakeholder input', 'Public engagement summaries'],
    testProcedures: ['Inspect engagement plan scope', 'Verify engagement records exist for high-impact deployments', 'Sample decisions for stakeholder input traceability'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-GV-6.1',
    name: 'Risk management of value chain and component integration',
    description: 'Establish governance over the GenAI value chain including foundation models, fine-tuning pipelines, retrieval-augmented data sources, and downstream integrations to manage cascading and aggregated risks.',
    category: 'Govern - Value Chain',
    implementationGuidance: 'Document the GenAI value chain for each deployment including upstream and downstream components. Assign risk ownership at each link. Conduct integration risk assessments. Reassess on component change.',
    evidenceRequirements: ['Value chain diagrams per deployment', 'Component-level risk ownership records', 'Integration risk assessments', 'Change-triggered reassessments'],
    testProcedures: ['Inspect value chain diagrams', 'Verify ownership assignments at each link', 'Sample integration assessments for completeness'],
    status: 'Not Started'
  },

  // ===== MAP (MP) =====
  {
    controlId: 'GAI-MP-1.1',
    name: 'Document GenAI system context and intended use',
    description: 'Document the context in which the generative AI system will be deployed and used, including intended uses, foreseeable misuses, target users, deployment settings, and human oversight expectations.',
    category: 'Map - Context',
    implementationGuidance: 'For each GenAI system create a system card capturing purpose, intended use, prohibited use, target population, deployment environment, oversight model, and known limitations. Review the card on material change. Publish to internal stakeholders.',
    evidenceRequirements: ['System cards per GenAI deployment', 'System card review history', 'Internal publication record', 'Limitations register linked to cards'],
    testProcedures: ['Inspect system card template completeness', 'Sample cards for review evidence', 'Verify limitations are tracked'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-2.2',
    name: 'Map GenAI capabilities, limitations, and risks',
    description: 'Identify and document the capabilities, known limitations, and potential risks of the generative AI system, drawing from the twelve GenAI risk categories and any organization-specific concerns.',
    category: 'Map - Capabilities and Risks',
    implementationGuidance: 'Apply a capabilities-and-risks mapping template referencing the twelve GenAI risk categories. Conduct elicitation workshops with engineers, domain experts, and trust-and-safety specialists. Maintain mappings under version control.',
    evidenceRequirements: ['Capabilities-and-risks mapping template', 'Per-system mappings', 'Workshop minutes', 'Version-controlled repository'],
    testProcedures: ['Inspect template coverage', 'Sample mappings for completeness across twelve risks', 'Verify workshop participation diversity'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-3.4',
    name: 'Identify confabulation risk vectors',
    description: 'Map vectors through which the GenAI system may generate confabulated outputs (hallucinations), including unsupported claims, fabricated citations, and incorrect attributions, and characterize their potential impacts.',
    category: 'Map - Confabulation',
    implementationGuidance: 'Conduct a structured confabulation risk analysis examining prompt patterns, domains of use, citation behavior, and downstream consumption. Identify high-impact scenarios (medical, legal, financial). Document mitigation requirements.',
    evidenceRequirements: ['Confabulation risk analysis report', 'High-impact scenario inventory', 'Mitigation requirement records', 'Domain-specific risk notes'],
    testProcedures: ['Inspect analysis for vector coverage', 'Verify high-impact scenarios identified', 'Sample mitigation requirements'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-3.5',
    name: 'Identify harmful content generation risks',
    description: 'Map the potential for the GenAI system to generate dangerous, violent, hateful, obscene, degrading, or abusive content, identifying triggering inputs, content categories, and downstream harms.',
    category: 'Map - Harmful Content',
    implementationGuidance: 'Develop a harmful content taxonomy aligned with the AI 600-1 categories. Identify input patterns and contexts that elevate risk. Engage trust-and-safety experts. Document content moderation requirements.',
    evidenceRequirements: ['Harmful content taxonomy', 'Input pattern analyses', 'Trust-and-safety review records', 'Content moderation requirements'],
    testProcedures: ['Inspect taxonomy against AI 600-1', 'Verify trust-and-safety engagement', 'Sample moderation requirements for traceability'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-4.1',
    name: 'Map data privacy risks for GenAI',
    description: 'Identify data privacy risks across the GenAI lifecycle including training data composition, inference inputs, model memorization, and outputs that may reveal personal or confidential information.',
    category: 'Map - Data Privacy',
    implementationGuidance: 'Conduct a GenAI privacy impact assessment covering data minimization, memorization risk, re-identification, and prompt leakage. Engage privacy counsel. Document residual privacy risk. Update on retraining.',
    evidenceRequirements: ['GenAI privacy impact assessments', 'Memorization risk evaluations', 'Privacy counsel sign-off', 'Update records on retraining'],
    testProcedures: ['Inspect assessment scope', 'Verify memorization testing evidence', 'Sample updates after retraining events'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-4.2',
    name: 'Map intellectual property risks for GenAI',
    description: 'Identify IP risks from GenAI use including unauthorized reproduction of copyrighted training material, trademark issues, trade secret leakage, and authorship/ownership ambiguities of generated outputs.',
    category: 'Map - Intellectual Property',
    implementationGuidance: 'Engage IP counsel to map risks across training data, prompts, and outputs. Examine vendor disclosures of training data sources. Document use restrictions, watermarking needs, and attribution practices.',
    evidenceRequirements: ['IP risk mapping document', 'Counsel engagement records', 'Vendor training data disclosures', 'Use restriction documentation'],
    testProcedures: ['Inspect mapping for full pipeline coverage', 'Verify counsel review evidence', 'Sample vendor disclosures'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-5.2',
    name: 'Map CBRN and cyber-misuse risks',
    description: 'Identify potential for misuse of generative AI to provide uplift for chemical, biological, radiological, or nuclear weapons or to develop offensive cyber capabilities, and characterize the severity and likelihood.',
    category: 'Map - Dangerous Capabilities',
    implementationGuidance: 'Engage CBRN and cybersecurity experts. Conduct elicitation exercises identifying request patterns of concern. Reference relevant export controls and regulations. Maintain a watchlist of high-risk query patterns.',
    evidenceRequirements: ['CBRN/cyber risk assessment report', 'Expert engagement records', 'Regulatory mapping', 'High-risk query watchlist'],
    testProcedures: ['Inspect assessment for CBRN and cyber coverage', 'Verify expert involvement', 'Sample watchlist for currency'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MP-5.3',
    name: 'Map environmental impacts of GenAI',
    description: 'Identify and estimate the environmental impacts of GenAI training and inference including energy consumption, carbon emissions, and water use, and consider impacts on procurement and deployment decisions.',
    category: 'Map - Environmental',
    implementationGuidance: 'Estimate energy and carbon for training and steady-state inference. Require supplier disclosure of environmental metrics. Include environmental impact in deployment decisions. Track totals against organizational sustainability commitments.',
    evidenceRequirements: ['Energy/carbon estimates per model', 'Supplier environmental disclosures', 'Deployment decision records including environmental factors', 'Sustainability tracking dashboard'],
    testProcedures: ['Inspect estimate methodology', 'Verify supplier disclosure compliance', 'Sample deployment decisions for environmental input'],
    status: 'Not Started'
  },

  // ===== MEASURE (MS) =====
  {
    controlId: 'GAI-MS-1.1',
    name: 'Measurement plan for GenAI risks',
    description: 'Develop and maintain a measurement plan that specifies metrics, evaluation methods, test sets, frequencies, and reporting paths for each identified GenAI risk category.',
    category: 'Measure - Measurement Planning',
    implementationGuidance: 'Author a GenAI measurement plan covering metrics for confabulation, harmful content, bias, IP leakage, privacy memorization, and information security. Curate evaluation datasets. Schedule periodic evaluations. Maintain version control.',
    evidenceRequirements: ['GenAI measurement plan', 'Curated evaluation datasets and registry', 'Evaluation schedule', 'Plan version control'],
    testProcedures: ['Inspect plan against twelve risk categories', 'Verify dataset registry maintained', 'Sample scheduled evaluations executed'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-2.1',
    name: 'Confabulation evaluation and monitoring',
    description: 'Implement evaluations and monitoring to detect confabulated outputs, including factuality benchmarks, citation verification, and ongoing telemetry on contested outputs.',
    category: 'Measure - Confabulation',
    implementationGuidance: 'Run domain-appropriate factuality benchmarks pre-deployment. Implement output-level telemetry capturing claim verification signals and user contestation. Trigger investigation when confabulation rates exceed thresholds.',
    evidenceRequirements: ['Pre-deployment factuality benchmark results', 'Output telemetry pipeline configuration', 'Contestation tracking records', 'Investigation records for threshold breaches'],
    testProcedures: ['Inspect benchmark coverage and thresholds', 'Verify telemetry pipeline operability', 'Sample investigations for closure'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-2.2',
    name: 'Harmful content evaluation and red teaming',
    description: 'Conduct evaluations and structured red-teaming exercises to characterize the GenAI system\'s propensity to generate harmful content across the AI 600-1 content categories.',
    category: 'Measure - Harmful Content',
    implementationGuidance: 'Maintain harmful content evaluation suites covering each category. Conduct regular red-team exercises with diverse participants. Record findings, categorize severity, and route to remediation. Re-test after mitigations.',
    evidenceRequirements: ['Harmful content evaluation suites', 'Red-team exercise plans and reports', 'Finding remediation tracker', 'Post-mitigation re-test results'],
    testProcedures: ['Inspect evaluation suite coverage', 'Verify red-team participant diversity', 'Sample findings for remediation closure'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-2.3',
    name: 'Bias and homogenization measurement',
    description: 'Measure harmful bias and homogenization effects in GenAI outputs, including disparate outcomes across demographic groups, viewpoint diversity, and downstream amplification of stereotypes.',
    category: 'Measure - Bias',
    implementationGuidance: 'Apply structured bias evaluation protocols using curated probe sets. Measure output diversity for open-ended prompts. Engage affected communities in evaluation design. Track bias metrics over time.',
    evidenceRequirements: ['Bias evaluation protocols', 'Probe set definitions', 'Diversity metric outputs', 'Time-series bias dashboards'],
    testProcedures: ['Inspect protocol comprehensiveness', 'Verify probe set inclusivity', 'Sample dashboards for trend visibility'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-2.4',
    name: 'Information integrity and misinformation evaluation',
    description: 'Evaluate the GenAI system\'s potential to compromise information integrity through generation of misleading content, deepfakes, synthetic media, or content that undermines trust in information ecosystems.',
    category: 'Measure - Information Integrity',
    implementationGuidance: 'Test GenAI outputs against information integrity criteria. Evaluate effectiveness of provenance signals (watermarking, content credentials). Track patterns of misuse for misinformation generation. Engage media-literacy experts.',
    evidenceRequirements: ['Information integrity test results', 'Provenance signal effectiveness evaluations', 'Misuse pattern logs', 'Expert engagement records'],
    testProcedures: ['Inspect test methodology', 'Verify provenance signal operability', 'Sample misuse logs for trend analysis'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-3.3',
    name: 'Privacy and memorization testing',
    description: 'Test the GenAI system for privacy leakage including training data memorization, prompt leakage, and inference-time disclosure of personal or confidential information.',
    category: 'Measure - Privacy',
    implementationGuidance: 'Run membership inference and memorization extraction tests against deployed models. Test prompt isolation in multi-tenant deployments. Test for personally identifiable information in outputs. Document residual privacy risk.',
    evidenceRequirements: ['Membership inference test results', 'Memorization extraction test results', 'Prompt isolation test results', 'Residual privacy risk documentation'],
    testProcedures: ['Inspect test methodology', 'Verify execution on production models', 'Sample residual risk for treatment evidence'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-3.4',
    name: 'Information security testing of GenAI systems',
    description: 'Test GenAI systems for information security vulnerabilities including prompt injection, jailbreaks, model extraction, data poisoning, and adversarial input manipulation.',
    category: 'Measure - Information Security',
    implementationGuidance: 'Maintain a GenAI security testing program including prompt injection corpora, jailbreak red-teaming, extraction simulations, and adversarial robustness evaluations. Coordinate with the central application security program. Track findings in vulnerability management.',
    evidenceRequirements: ['GenAI security testing program plan', 'Test execution records', 'Vulnerability management tracking', 'Coordination evidence with AppSec'],
    testProcedures: ['Inspect program scope and frequency', 'Sample test executions and outcomes', 'Verify vulnerabilities tracked to closure'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MS-4.2',
    name: 'Human-AI configuration evaluation',
    description: 'Evaluate the effectiveness of human oversight and human-AI interaction patterns, including over-reliance, automation bias, calibrated trust, and user comprehension of system limitations.',
    category: 'Measure - Human-AI Configuration',
    implementationGuidance: 'Conduct user studies on trust calibration and over-reliance. Measure reviewer disagreement rates with GenAI outputs. Evaluate interface signals (confidence indicators, uncertainty disclosure). Iterate based on findings.',
    evidenceRequirements: ['User study protocols and results', 'Reviewer disagreement metrics', 'Interface evaluation records', 'Design iteration evidence'],
    testProcedures: ['Inspect study methodology', 'Verify reviewer metric capture', 'Sample iterations for traceability'],
    status: 'Not Started'
  },

  // ===== MANAGE (MG) =====
  {
    controlId: 'GAI-MG-1.2',
    name: 'GenAI risk treatment prioritization and resourcing',
    description: 'Prioritize identified GenAI risks based on severity, likelihood, and impact, and allocate resources to risk treatment actions in alignment with risk tolerance.',
    category: 'Manage - Prioritization',
    implementationGuidance: 'Apply a risk prioritization framework producing a ranked treatment backlog. Allocate engineering, trust-and-safety, and operations resources accordingly. Review prioritization with leadership at planning cycles. Track treatment delivery.',
    evidenceRequirements: ['Risk prioritization framework', 'Ranked treatment backlog', 'Resource allocation records', 'Treatment delivery tracker'],
    testProcedures: ['Inspect framework criteria', 'Verify backlog reflects prioritization', 'Sample delivery for status accuracy'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MG-2.4',
    name: 'Human-AI configuration management and oversight',
    description: 'Implement and manage human oversight mechanisms appropriate to the GenAI system\'s risks and intended use, including human-in-the-loop, human-on-the-loop, escalation paths, and override capabilities.',
    category: 'Manage - Human Oversight',
    implementationGuidance: 'Define oversight tier per use case. Implement reviewer workflows with clear approval criteria. Provide reviewers with capability and limitation training. Monitor reviewer accuracy and capacity. Enable user override mechanisms.',
    evidenceRequirements: ['Oversight tier matrix per use case', 'Reviewer workflow configurations', 'Reviewer training records', 'Override mechanism documentation'],
    testProcedures: ['Inspect tier matrix application', 'Verify reviewer workflow operability', 'Sample override events for handling'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MG-3.1',
    name: 'GenAI content provenance and disclosure',
    description: 'Manage transparency to end users and downstream consumers by disclosing the use of GenAI, applying content provenance signals (watermarking, content credentials), and providing context for outputs.',
    category: 'Manage - Transparency',
    implementationGuidance: 'Implement user-facing disclosure when interacting with GenAI. Apply C2PA-compatible content credentials to generated media. Provide model and version information. Document provenance practices.',
    evidenceRequirements: ['User disclosure implementation', 'Content credential signing configurations', 'Model/version exposure documentation', 'Provenance practice documentation'],
    testProcedures: ['Inspect disclosure presence in user interfaces', 'Verify content credential signing operates on live outputs', 'Sample outputs for model/version metadata'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MG-3.2',
    name: 'Manage value chain and component integration risks',
    description: 'Implement controls to manage risks introduced by upstream foundation models, third-party datasets, integration with other systems, and downstream consumers throughout the GenAI value chain.',
    category: 'Manage - Value Chain',
    implementationGuidance: 'Maintain contractual incident notification, change management, and assurance requirements with upstream providers. Validate inputs from external data sources. Monitor downstream usage. Engage in industry information sharing.',
    evidenceRequirements: ['Upstream provider contracts with required clauses', 'External data validation records', 'Downstream usage monitoring', 'Information-sharing participation evidence'],
    testProcedures: ['Inspect contract clauses', 'Verify validation pipeline operability', 'Sample downstream monitoring data'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MG-4.1',
    name: 'GenAI incident response and recovery',
    description: 'Establish and exercise an incident response capability tailored to GenAI incidents including harmful content events, mass misuse, integrity attacks, privacy disclosures, and downstream impacts.',
    category: 'Manage - Incident Response',
    implementationGuidance: 'Author GenAI incident playbooks covering each category. Conduct tabletop and live exercises. Maintain pre-approved kill switches and rate-limiting controls. Coordinate with legal, communications, and regulators.',
    evidenceRequirements: ['GenAI incident playbooks', 'Exercise after-action reports', 'Kill switch and rate-limit configurations', 'External coordination protocols'],
    testProcedures: ['Inspect playbook category coverage', 'Verify exercise execution', 'Test kill switch in a controlled environment'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MG-4.2',
    name: 'Operational monitoring and feedback handling for GenAI',
    description: 'Continuously monitor deployed GenAI systems for emerging risks, performance degradation, drift, and emerging misuse patterns, and process user, operator, and external feedback into improvements.',
    category: 'Manage - Operational Monitoring',
    implementationGuidance: 'Implement monitoring dashboards covering output quality, safety metrics, abuse rates, and drift indicators. Operate a feedback intake channel for users and external reporters. Triage and route feedback into improvement workflows.',
    evidenceRequirements: ['Operational monitoring dashboards', 'Feedback intake channel records', 'Triage and routing records', 'Improvement workflow tickets'],
    testProcedures: ['Inspect dashboard coverage', 'Verify feedback intake operability', 'Sample improvement tickets for closure'],
    status: 'Not Started'
  },
  {
    controlId: 'GAI-MG-4.3',
    name: 'GenAI risk treatment effectiveness review and continual improvement',
    description: 'Periodically review the effectiveness of GenAI risk treatments, capture lessons learned from incidents and near-misses, and update controls, policies, and practices accordingly.',
    category: 'Manage - Continual Improvement',
    implementationGuidance: 'Conduct quarterly effectiveness reviews of GenAI controls. Document lessons learned after incidents. Update playbooks, policies, and evaluation suites. Report improvements to governance bodies.',
    evidenceRequirements: ['Effectiveness review reports', 'Lessons-learned documentation', 'Control and policy update history', 'Governance reporting records'],
    testProcedures: ['Inspect review cadence', 'Verify lessons-learned capture process', 'Sample updates for traceability to lessons'],
    status: 'Not Started'
  }
];
