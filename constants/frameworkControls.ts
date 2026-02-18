/**
 * Framework Control Hierarchies — Article-mapped controls for EU regulations
 *
 * Each framework contains:
 * - articles: Direct references to regulation text
 * - controls: Specific implementable requirements derived from articles
 * - categories: Groupings of related controls
 *
 * This file provides production-grade control mappings for:
 * - EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847
 * - Corporate Sustainability Reporting Directive (CSRD) — Directive (EU) 2022/2464
 * - Ecodesign for Sustainable Products Regulation (ESPR) — Regulation (EU) 2024/1781
 * - NIS2 Directive — Directive (EU) 2022/2555 (enhanced)
 */

export interface FrameworkArticle {
  id: string;
  articleNumber: string;
  title: string;
  summary: string;
  mandatory: boolean;
  effectiveDate?: string;
  deadline?: string;
}

export interface FrameworkControl {
  id: string;
  controlId: string;
  articleRef: string;
  title: string;
  description: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'required' | 'recommended' | 'guidance';
  evidenceTypes: string[];
  implementationGuidance: string;
  assessmentCriteria: string;
}

export interface FrameworkControlHierarchy {
  frameworkId: string;
  frameworkName: string;
  regulation: string;
  jurisdiction: string;
  effectiveDate: string;
  articles: FrameworkArticle[];
  controls: FrameworkControl[];
  categories: string[];
}

// =============================================================================
// EU CYBER RESILIENCE ACT (CRA) — Regulation (EU) 2024/2847
// =============================================================================

export const EU_CRA_CONTROLS: FrameworkControlHierarchy = {
  frameworkId: 'eu-cra',
  frameworkName: 'EU Cyber Resilience Act',
  regulation: 'Regulation (EU) 2024/2847',
  jurisdiction: 'EU',
  effectiveDate: '2024-12-10',
  categories: [
    'Product Security Requirements',
    'Vulnerability Handling',
    'Manufacturer Obligations',
    'Conformity Assessment',
    'Market Surveillance',
    'Documentation & Transparency',
    'Supply Chain Security',
    'Incident Reporting',
  ],
  articles: [
    { id: 'cra-art5', articleNumber: 'Article 5', title: 'Product Classification', summary: 'Classification of products with digital elements into Default, Class I, Class II, and Critical categories based on risk level.', mandatory: true },
    { id: 'cra-art6', articleNumber: 'Article 6', title: 'Essential Cybersecurity Requirements', summary: 'Products with digital elements shall meet essential cybersecurity requirements set out in Annex I before being placed on the market.', mandatory: true, deadline: '2027-12-11' },
    { id: 'cra-art10', articleNumber: 'Article 10', title: 'Obligations of Manufacturers — Design & Development', summary: 'Manufacturers must design, develop, and produce products in accordance with essential requirements of Annex I.', mandatory: true },
    { id: 'cra-art11', articleNumber: 'Article 11', title: 'Obligations of Manufacturers — Vulnerability Handling', summary: 'Manufacturers must handle vulnerabilities effectively for the expected product lifetime or 5 years minimum.', mandatory: true },
    { id: 'cra-art12', articleNumber: 'Article 12', title: 'Reporting Obligations', summary: 'Manufacturers must report actively exploited vulnerabilities and severe incidents to ENISA within 24 hours.', mandatory: true },
    { id: 'cra-art13', articleNumber: 'Article 13', title: 'Obligations of Importers', summary: 'Importers shall ensure products comply with essential requirements before placing them on the EU market.', mandatory: true },
    { id: 'cra-art14', articleNumber: 'Article 14', title: 'Obligations of Distributors', summary: 'Distributors must verify CE marking and documentation before making products available.', mandatory: true },
    { id: 'cra-art18', articleNumber: 'Article 18', title: 'EU Declaration of Conformity', summary: 'Manufacturers shall draw up an EU declaration of conformity for each product type.', mandatory: true },
    { id: 'cra-art20', articleNumber: 'Article 20', title: 'CE Marking', summary: 'Products meeting essential requirements shall bear the CE marking indicating conformity.', mandatory: true },
    { id: 'cra-art24', articleNumber: 'Article 24', title: 'Conformity Assessment — Default Products', summary: 'Default category products may use internal control (Module A) for conformity assessment.', mandatory: true },
    { id: 'cra-art25', articleNumber: 'Article 25', title: 'Conformity Assessment — Class I', summary: 'Class I products require harmonized standard conformity or third-party assessment.', mandatory: true },
    { id: 'cra-art26', articleNumber: 'Article 26', title: 'Conformity Assessment — Class II & Critical', summary: 'Class II and Critical products require EU-type examination (Module B) plus production QA (Module C/D).', mandatory: true },
    { id: 'cra-annex1', articleNumber: 'Annex I', title: 'Essential Cybersecurity Requirements', summary: 'Core security requirements all products must meet: secure by design, access control, data protection, update capability, etc.', mandatory: true },
    { id: 'cra-annex2', articleNumber: 'Annex II', title: 'Technical Documentation', summary: 'Required technical documentation including general description, design info, assessment reports, and cybersecurity risk assessment.', mandatory: true },
  ],
  controls: [
    // Annex I — Security by Design
    { id: 'cra-c1', controlId: 'CRA-AnnI-1', articleRef: 'Annex I, Part I, (1)', title: 'Security by Design', description: 'Products shall be designed, developed, and produced to ensure an appropriate level of cybersecurity based on risks.', category: 'Product Security Requirements', priority: 'Critical', status: 'required', evidenceTypes: ['Security Architecture Document', 'Threat Model', 'Design Review Records'], implementationGuidance: 'Conduct threat modeling during design phase. Document security architecture decisions. Implement secure development lifecycle (SDLC).', assessmentCriteria: 'Evidence of security-by-design approach in product development lifecycle.' },
    { id: 'cra-c2', controlId: 'CRA-AnnI-2', articleRef: 'Annex I, Part I, (2)', title: 'No Known Exploitable Vulnerabilities', description: 'Products shall be delivered without any known exploitable vulnerabilities.', category: 'Product Security Requirements', priority: 'Critical', status: 'required', evidenceTypes: ['Vulnerability Scan Report', 'Penetration Test Report', 'SBOM Analysis'], implementationGuidance: 'Perform vulnerability scanning and penetration testing before release. Maintain SBOM and monitor for new CVEs.', assessmentCriteria: 'No critical/high CVEs present at time of release. Documented vulnerability scanning process.' },
    { id: 'cra-c3', controlId: 'CRA-AnnI-3', articleRef: 'Annex I, Part I, (3)', title: 'Secure Default Configuration', description: 'Products shall be made available with a secure by default configuration, including the possibility to reset to original state.', category: 'Product Security Requirements', priority: 'High', status: 'required', evidenceTypes: ['Default Configuration Audit', 'Hardening Guide', 'Factory Reset Test Results'], implementationGuidance: 'Disable unnecessary services by default. Require password change on first use. Document secure configuration baseline.', assessmentCriteria: 'Default configuration follows security hardening guidelines. Factory reset returns to secure state.' },
    { id: 'cra-c4', controlId: 'CRA-AnnI-4', articleRef: 'Annex I, Part I, (4)', title: 'Protection Against Unauthorized Access', description: 'Products shall protect against unauthorized access with appropriate control mechanisms including authentication and identity management.', category: 'Product Security Requirements', priority: 'Critical', status: 'required', evidenceTypes: ['Access Control Design Document', 'Authentication Mechanism Audit', 'Identity Management Policy'], implementationGuidance: 'Implement multi-factor authentication where feasible. Use role-based access control. Enforce strong password policies.', assessmentCriteria: 'Authentication mechanisms prevent unauthorized access. Access controls enforce least privilege.' },
    { id: 'cra-c5', controlId: 'CRA-AnnI-5', articleRef: 'Annex I, Part I, (5)', title: 'Data Confidentiality Protection', description: 'Products shall protect the confidentiality of stored, transmitted, and processed data including personal data using encryption.', category: 'Product Security Requirements', priority: 'Critical', status: 'required', evidenceTypes: ['Encryption Implementation Report', 'Data Flow Diagram', 'Key Management Policy'], implementationGuidance: 'Encrypt data at rest (AES-256) and in transit (TLS 1.2+). Implement proper key management. Map all data flows.', assessmentCriteria: 'All sensitive data encrypted at rest and in transit with current cryptographic standards.' },
    { id: 'cra-c6', controlId: 'CRA-AnnI-6', articleRef: 'Annex I, Part I, (6)', title: 'Data Integrity Protection', description: 'Products shall protect the integrity of stored, transmitted, and processed data against manipulation or modification.', category: 'Product Security Requirements', priority: 'High', status: 'required', evidenceTypes: ['Integrity Check Implementation', 'Digital Signature Verification', 'Tamper Detection Evidence'], implementationGuidance: 'Implement checksums, digital signatures, and tamper detection. Validate data integrity at input boundaries.', assessmentCriteria: 'Data integrity verification mechanisms in place for all data paths.' },
    { id: 'cra-c7', controlId: 'CRA-AnnI-7', articleRef: 'Annex I, Part I, (7)', title: 'Data Minimization', description: 'Products shall only process data that is adequate, relevant and limited to what is necessary for the intended use.', category: 'Product Security Requirements', priority: 'Medium', status: 'required', evidenceTypes: ['Data Processing Inventory', 'Privacy Impact Assessment', 'Data Retention Policy'], implementationGuidance: 'Map all data collected and processed. Justify necessity of each data element. Implement retention limits.', assessmentCriteria: 'Data collection limited to intended purpose. No unnecessary data processing identified.' },
    { id: 'cra-c8', controlId: 'CRA-AnnI-8', articleRef: 'Annex I, Part I, (8)', title: 'Availability and Resilience', description: 'Products shall be designed to ensure availability of essential functions and resilience against denial-of-service attacks.', category: 'Product Security Requirements', priority: 'High', status: 'required', evidenceTypes: ['Resilience Test Report', 'DoS Protection Evidence', 'High Availability Architecture'], implementationGuidance: 'Implement rate limiting, DDoS mitigation, graceful degradation. Test under stress conditions.', assessmentCriteria: 'Product maintains essential functions under adverse conditions including DoS scenarios.' },
    { id: 'cra-c9', controlId: 'CRA-AnnI-9', articleRef: 'Annex I, Part I, (9)', title: 'Minimize Impact of Incidents', description: 'Products shall be designed to minimize the negative impact of security incidents on the product, users, and other systems.', category: 'Product Security Requirements', priority: 'High', status: 'required', evidenceTypes: ['Incident Impact Analysis', 'Blast Radius Assessment', 'Isolation Design Document'], implementationGuidance: 'Implement network segmentation, sandboxing, and failure isolation. Design for containment of security breaches.', assessmentCriteria: 'Security incidents contained with minimal blast radius. Recovery procedures documented and tested.' },
    // Annex I — Security Updates
    { id: 'cra-c10', controlId: 'CRA-AnnI-10', articleRef: 'Annex I, Part I, (10)', title: 'Security Update Capability', description: 'Products shall be capable of receiving security updates, including automatic updates with user notification.', category: 'Product Security Requirements', priority: 'Critical', status: 'required', evidenceTypes: ['Update Mechanism Design', 'Automatic Update Test Results', 'Update Authentication Evidence'], implementationGuidance: 'Implement secure update mechanism with authentication. Support automatic updates with user control. Provide update rollback capability.', assessmentCriteria: 'Secure, authenticated update mechanism functional. Automatic updates configurable by user.' },
    { id: 'cra-c11', controlId: 'CRA-AnnI-11', articleRef: 'Annex I, Part I, (11)', title: 'Logging and Monitoring', description: 'Products shall record and/or monitor relevant internal activity including access to data and modifications.', category: 'Product Security Requirements', priority: 'High', status: 'required', evidenceTypes: ['Logging Architecture Document', 'Audit Log Samples', 'SIEM Integration Evidence'], implementationGuidance: 'Implement comprehensive security logging. Include access events, configuration changes, authentication attempts. Protect log integrity.', assessmentCriteria: 'Security-relevant events logged with sufficient detail. Logs protected from tampering.' },
    // Article 11 — Vulnerability Handling
    { id: 'cra-c12', controlId: 'CRA-Art11-1', articleRef: 'Article 11(1)', title: 'Vulnerability Identification and Documentation', description: 'Manufacturers must identify and document vulnerabilities including through regular testing and SBOM maintenance.', category: 'Vulnerability Handling', priority: 'Critical', status: 'required', evidenceTypes: ['SBOM', 'Vulnerability Scanning Schedule', 'Component Analysis Report'], implementationGuidance: 'Maintain accurate SBOM. Schedule regular vulnerability scans. Track all components including open-source dependencies.', assessmentCriteria: 'Complete SBOM available. Regular vulnerability scanning documented with results tracked.' },
    { id: 'cra-c13', controlId: 'CRA-Art11-2', articleRef: 'Article 11(2)', title: 'Timely Security Updates', description: 'Manufacturers must provide security updates without delay to address identified vulnerabilities, free of charge.', category: 'Vulnerability Handling', priority: 'Critical', status: 'required', evidenceTypes: ['Patch Release Schedule', 'Update Distribution Evidence', 'Vulnerability-to-Patch Timeline'], implementationGuidance: 'Establish vulnerability triage SLA (critical: 24h, high: 72h, medium: 30d). Distribute updates through secure channels.', assessmentCriteria: 'Security patches delivered within defined SLAs. All patches free of charge to users.' },
    { id: 'cra-c14', controlId: 'CRA-Art11-3', articleRef: 'Article 11(3)', title: 'Coordinated Vulnerability Disclosure', description: 'Manufacturers must establish a policy for coordinated vulnerability disclosure and provide a contact for reporting.', category: 'Vulnerability Handling', priority: 'High', status: 'required', evidenceTypes: ['Disclosure Policy', 'Security Contact (security.txt)', 'VDP Evidence'], implementationGuidance: 'Publish vulnerability disclosure policy. Set up security.txt file. Implement bug bounty or VDP program.', assessmentCriteria: 'Published VDP accessible. Security contact responsive within 48 hours.' },
    { id: 'cra-c15', controlId: 'CRA-Art11-4', articleRef: 'Article 11(4)', title: 'SBOM Provision', description: 'Manufacturers must make available a software bill of materials (SBOM) documenting at minimum top-level dependencies.', category: 'Vulnerability Handling', priority: 'High', status: 'required', evidenceTypes: ['SBOM in SPDX/CycloneDX Format', 'Dependency List', 'License Compliance Report'], implementationGuidance: 'Generate SBOM using CycloneDX or SPDX format. Include all direct dependencies. Update with each release.', assessmentCriteria: 'Machine-readable SBOM available in standard format. Updated per release.' },
    // Article 12 — ENISA Reporting
    { id: 'cra-c16', controlId: 'CRA-Art12-1', articleRef: 'Article 12(1)', title: 'Active Exploitation Notification (24h)', description: 'Manufacturers must notify ENISA of any actively exploited vulnerability within 24 hours of becoming aware.', category: 'Incident Reporting', priority: 'Critical', status: 'required', evidenceTypes: ['ENISA Notification Records', 'Incident Timeline Documentation', 'Notification SOP'], implementationGuidance: 'Establish 24-hour ENISA notification SOP. Pre-register with ENISA Single Reporting Platform. Define escalation contacts.', assessmentCriteria: 'ENISA notification process documented and tested. Historical notifications within 24-hour window.' },
    { id: 'cra-c17', controlId: 'CRA-Art12-2', articleRef: 'Article 12(2)', title: 'Vulnerability Notification (72h)', description: 'Manufacturers must submit full vulnerability notification to ENISA within 72 hours with technical details and remediation status.', category: 'Incident Reporting', priority: 'Critical', status: 'required', evidenceTypes: ['72-hour Notification Template', 'Vulnerability Detail Reports', 'Remediation Status Tracking'], implementationGuidance: 'Prepare standardized notification template with CVSS scoring. Include affected products, versions, and remediation timeline.', assessmentCriteria: 'Full vulnerability details submitted within 72 hours including CVSS, affected products, and remediation plan.' },
    { id: 'cra-c18', controlId: 'CRA-Art12-3', articleRef: 'Article 12(3)', title: 'Final Report (14 days)', description: 'Manufacturers must submit a final report to ENISA within 14 days including root cause analysis and remediation effectiveness.', category: 'Incident Reporting', priority: 'High', status: 'required', evidenceTypes: ['Final Incident Report', 'Root Cause Analysis', 'Remediation Effectiveness Evidence'], implementationGuidance: 'Conduct thorough root cause analysis. Verify remediation effectiveness. Document lessons learned.', assessmentCriteria: 'Final report submitted within 14 days with complete RCA and verified remediation.' },
    // Article 10 — Manufacturer Obligations
    { id: 'cra-c19', controlId: 'CRA-Art10-1', articleRef: 'Article 10(1)', title: 'Cybersecurity Risk Assessment', description: 'Manufacturers must conduct cybersecurity risk assessment during planning, design, development, production, and maintenance.', category: 'Manufacturer Obligations', priority: 'Critical', status: 'required', evidenceTypes: ['Risk Assessment Document', 'Threat Model', 'Risk Register', 'Risk Treatment Plan'], implementationGuidance: 'Perform risk assessment at each SDLC phase. Use STRIDE/DREAD threat modeling. Maintain risk register with treatments.', assessmentCriteria: 'Risk assessment covers full product lifecycle. All identified risks have documented treatments.' },
    { id: 'cra-c20', controlId: 'CRA-Art10-2', articleRef: 'Article 10(6)', title: 'Technical Documentation', description: 'Manufacturers must draw up technical documentation as described in Annex II before placing product on the market.', category: 'Documentation & Transparency', priority: 'High', status: 'required', evidenceTypes: ['Technical Documentation Package', 'Design Specifications', 'Test Reports', 'Conformity Assessment Records'], implementationGuidance: 'Compile Annex II documentation: general description, design and manufacturing info, risk assessment, test reports, applied standards.', assessmentCriteria: 'Complete Annex II documentation package available and current.' },
    { id: 'cra-c21', controlId: 'CRA-Art10-3', articleRef: 'Article 10(9)', title: 'Supply Chain Due Diligence', description: 'Manufacturers must exercise due diligence when integrating components from third parties to ensure they do not compromise security.', category: 'Supply Chain Security', priority: 'High', status: 'required', evidenceTypes: ['Supplier Security Assessment', 'Component Verification Report', 'Supply Chain Risk Assessment'], implementationGuidance: 'Assess security of all third-party components. Verify component integrity. Monitor supplier security posture.', assessmentCriteria: 'All third-party components assessed for security. Supply chain risks documented and mitigated.' },
    // Articles 18, 20 — Conformity & CE Marking
    { id: 'cra-c22', controlId: 'CRA-Art18-1', articleRef: 'Article 18', title: 'EU Declaration of Conformity', description: 'Manufacturers must issue EU Declaration of Conformity stating the product meets essential cybersecurity requirements.', category: 'Conformity Assessment', priority: 'High', status: 'required', evidenceTypes: ['EU Declaration of Conformity', 'Conformity Assessment Report', 'Applied Standards List'], implementationGuidance: 'Complete conformity assessment per product classification. Issue declaration per Annex V template. Reference applied harmonized standards.', assessmentCriteria: 'Valid EU Declaration of Conformity issued per Annex V. Applied standards documented.' },
    { id: 'cra-c23', controlId: 'CRA-Art20-1', articleRef: 'Article 20', title: 'CE Marking Affixing', description: 'Products meeting essential requirements shall bear the CE marking visibly, legibly, and indelibly on the product or packaging.', category: 'Conformity Assessment', priority: 'High', status: 'required', evidenceTypes: ['CE Marking Evidence (photos/labels)', 'CE Marking Placement Document'], implementationGuidance: 'Affix CE marking to product, packaging, or accompanying document. Ensure visibility and legibility per Regulation (EC) No 765/2008.', assessmentCriteria: 'CE marking properly affixed. Visible and legible on product or packaging.' },
    // Market Surveillance
    { id: 'cra-c24', controlId: 'CRA-Art10-10', articleRef: 'Article 10(10)', title: 'Support Period Declaration', description: 'Manufacturers must determine and declare the expected product lifetime and support period (minimum 5 years).', category: 'Manufacturer Obligations', priority: 'High', status: 'required', evidenceTypes: ['Support Period Declaration', 'Product Lifecycle Policy', 'End-of-Life Policy'], implementationGuidance: 'Define support period proportionate to expected usage. Minimum 5 years from market placement. Clearly communicate to users.', assessmentCriteria: 'Support period defined (≥5 years) and communicated to users at point of sale.' },
  ],
};

// =============================================================================
// CSRD — Directive (EU) 2022/2464 + ESRS (Delegated Regulation 2023/2772)
// =============================================================================

export const CSRD_CONTROLS: FrameworkControlHierarchy = {
  frameworkId: 'csrd',
  frameworkName: 'Corporate Sustainability Reporting Directive',
  regulation: 'Directive (EU) 2022/2464 + Commission Delegated Regulation (EU) 2023/2772 (ESRS)',
  jurisdiction: 'EU',
  effectiveDate: '2024-01-01',
  categories: [
    'General Disclosures (ESRS 2)',
    'Climate Change (ESRS E1)',
    'Pollution (ESRS E2)',
    'Water & Marine Resources (ESRS E3)',
    'Biodiversity & Ecosystems (ESRS E4)',
    'Resource Use & Circular Economy (ESRS E5)',
    'Own Workforce (ESRS S1)',
    'Workers in Value Chain (ESRS S2)',
    'Affected Communities (ESRS S3)',
    'Consumers & End-Users (ESRS S4)',
    'Business Conduct (ESRS G1)',
    'Double Materiality Assessment',
    'Assurance & Reporting',
  ],
  articles: [
    { id: 'csrd-art1', articleNumber: 'Article 19a', title: 'Sustainability Reporting', summary: 'Large undertakings shall include in the management report information necessary to understand the undertaking impacts on sustainability matters.', mandatory: true },
    { id: 'csrd-art2', articleNumber: 'Article 19a(2)', title: 'Double Materiality', summary: 'Information shall be reported from both financial materiality and impact materiality perspectives.', mandatory: true },
    { id: 'csrd-art3', articleNumber: 'Article 19a(3)', title: 'Forward-Looking Information', summary: 'Report shall include targets, policies, and actions related to sustainability matters, including transition plans.', mandatory: true },
    { id: 'csrd-art4', articleNumber: 'Article 29a', title: 'Assurance of Sustainability Reporting', summary: 'Statutory auditor or audit firm shall express an opinion on sustainability reporting compliance.', mandatory: true, deadline: '2026-01-01' },
    { id: 'csrd-art5', articleNumber: 'Article 29b', title: 'Digital Taxonomy (iXBRL)', summary: 'Sustainability reporting shall be prepared in XHTML format with iXBRL tagging per ESEF regulation.', mandatory: true },
  ],
  controls: [
    // ESRS 2 — General Disclosures
    { id: 'csrd-c1', controlId: 'ESRS 2-BP-1', articleRef: 'ESRS 2, DR BP-1', title: 'General Basis for Preparation', description: 'Disclose the basis for preparation of sustainability statements including scope, consolidation, and value chain boundaries.', category: 'General Disclosures (ESRS 2)', priority: 'Critical', status: 'required', evidenceTypes: ['Reporting Methodology Document', 'Scope Definition', 'Boundary Assessment'], implementationGuidance: 'Document reporting methodology, entity scope, and value chain boundaries. Describe time horizons used.', assessmentCriteria: 'Clear description of reporting basis, scope, and methodology provided.' },
    { id: 'csrd-c2', controlId: 'ESRS 2-BP-2', articleRef: 'ESRS 2, DR BP-2', title: 'Disclosures in Relation to Specific Circumstances', description: 'Disclose specific circumstances affecting sustainability reporting including estimation uncertainty and data gaps.', category: 'General Disclosures (ESRS 2)', priority: 'High', status: 'required', evidenceTypes: ['Data Quality Assessment', 'Estimation Methodology', 'Gap Analysis'], implementationGuidance: 'Identify and disclose data quality limitations, use of estimates, and transitional provisions applied.', assessmentCriteria: 'All estimation uncertainties and data gaps transparently disclosed.' },
    { id: 'csrd-c3', controlId: 'ESRS 2-GOV-1', articleRef: 'ESRS 2, DR GOV-1', title: 'Role of Administrative, Management and Supervisory Bodies', description: 'Disclose the role of governance bodies in sustainability matters including board composition and expertise.', category: 'General Disclosures (ESRS 2)', priority: 'Critical', status: 'required', evidenceTypes: ['Board Charter', 'ESG Governance Structure', 'Committee Mandates'], implementationGuidance: 'Document board-level sustainability governance. Describe oversight committees, frequency of reviews, and expertise.', assessmentCriteria: 'Board-level ESG oversight documented. Committee mandates include sustainability.' },
    { id: 'csrd-c4', controlId: 'ESRS 2-GOV-2', articleRef: 'ESRS 2, DR GOV-2', title: 'Information Provided to Governance Bodies', description: 'Disclose how governance bodies are informed about sustainability matters and what information they receive.', category: 'General Disclosures (ESRS 2)', priority: 'High', status: 'required', evidenceTypes: ['Board Reporting Schedule', 'ESG Dashboard/Reports to Board', 'Board Meeting Minutes'], implementationGuidance: 'Establish regular ESG reporting cadence to board. Include KPIs, risk assessments, and progress against targets.', assessmentCriteria: 'Regular ESG information flow to governance bodies documented with cadence and content.' },
    { id: 'csrd-c5', controlId: 'ESRS 2-GOV-3', articleRef: 'ESRS 2, DR GOV-3', title: 'Integration of Sustainability in Incentive Schemes', description: 'Disclose whether and how sustainability-related performance is linked to remuneration of governance body members.', category: 'General Disclosures (ESRS 2)', priority: 'High', status: 'required', evidenceTypes: ['Remuneration Policy', 'ESG-Linked Incentive Plans', 'Variable Compensation Structure'], implementationGuidance: 'Link ESG KPIs to executive compensation. Document percentage of variable pay tied to sustainability targets.', assessmentCriteria: 'ESG performance metrics integrated into incentive schemes with clear weighting.' },
    { id: 'csrd-c6', controlId: 'ESRS 2-SBM-1', articleRef: 'ESRS 2, DR SBM-1', title: 'Strategy, Business Model, and Value Chain', description: 'Disclose key elements of the strategy and business model and how they relate to sustainability matters.', category: 'General Disclosures (ESRS 2)', priority: 'Critical', status: 'required', evidenceTypes: ['Strategy Document', 'Business Model Description', 'Value Chain Map'], implementationGuidance: 'Map complete value chain. Describe business model dependencies on natural/social capital. Identify sustainability-related opportunities.', assessmentCriteria: 'Business model and value chain described with sustainability linkages identified.' },
    { id: 'csrd-c7', controlId: 'ESRS 2-IRO-1', articleRef: 'ESRS 2, DR IRO-1', title: 'Description of Materiality Assessment Process', description: 'Describe the process to identify and assess material impacts, risks, and opportunities (double materiality).', category: 'Double Materiality Assessment', priority: 'Critical', status: 'required', evidenceTypes: ['Materiality Assessment Methodology', 'Stakeholder Engagement Records', 'Materiality Matrix'], implementationGuidance: 'Conduct double materiality assessment. Engage stakeholders. Document methodology, thresholds, and results.', assessmentCriteria: 'Double materiality assessment conducted per ESRS methodology. Both financial and impact materiality assessed.' },
    // ESRS E1 — Climate Change
    { id: 'csrd-c8', controlId: 'ESRS E1-1', articleRef: 'ESRS E1, DR E1-1', title: 'Transition Plan for Climate Change Mitigation', description: 'Disclose the transition plan for climate change mitigation compatible with limiting global warming to 1.5°C.', category: 'Climate Change (ESRS E1)', priority: 'Critical', status: 'required', evidenceTypes: ['Climate Transition Plan', 'Decarbonization Pathway', 'Science-Based Targets'], implementationGuidance: 'Develop Paris-aligned transition plan. Set science-based targets (SBTi). Include CAPEX/OPEX aligned with taxonomy.', assessmentCriteria: 'Transition plan with 1.5°C-aligned targets and implementation milestones.' },
    { id: 'csrd-c9', controlId: 'ESRS E1-4', articleRef: 'ESRS E1, DR E1-4', title: 'Targets Related to Climate Change Mitigation and Adaptation', description: 'Disclose GHG reduction targets covering Scope 1, 2, and 3 with base year, target year, and methodology.', category: 'Climate Change (ESRS E1)', priority: 'Critical', status: 'required', evidenceTypes: ['GHG Reduction Targets', 'Base Year Emissions', 'Target Setting Methodology', 'SBTi Validation'], implementationGuidance: 'Set absolute and/or intensity reduction targets. Define base year and interim milestones. Seek SBTi validation.', assessmentCriteria: 'Quantified GHG reduction targets with base year, interim milestones, and methodology disclosed.' },
    { id: 'csrd-c10', controlId: 'ESRS E1-6', articleRef: 'ESRS E1, DR E1-6', title: 'Gross Scopes 1, 2, 3 and Total GHG Emissions', description: 'Disclose gross GHG emissions in metric tonnes CO2eq for Scope 1, 2 (location & market-based), and Scope 3.', category: 'Climate Change (ESRS E1)', priority: 'Critical', status: 'required', evidenceTypes: ['GHG Inventory', 'Scope 1/2/3 Calculations', 'Emission Factor Sources', 'Third-Party Verification'], implementationGuidance: 'Calculate emissions per GHG Protocol. Use recognized emission factors. Scope 3 must cover all material categories. Seek third-party verification.', assessmentCriteria: 'Complete Scope 1, 2, and 3 emissions disclosed in CO2eq with methodology and verification status.' },
    { id: 'csrd-c11', controlId: 'ESRS E1-7', articleRef: 'ESRS E1, DR E1-7', title: 'GHG Removals and Carbon Credits', description: 'Disclose GHG removals and storage, and any use of carbon credits separately from gross emissions.', category: 'Climate Change (ESRS E1)', priority: 'High', status: 'required', evidenceTypes: ['Carbon Credit Registry', 'Removal/Sequestration Evidence', 'Credit Quality Assessment'], implementationGuidance: 'Report carbon credits separately from actual emission reductions. Disclose credit quality and certification standard.', assessmentCriteria: 'Carbon credits disclosed separately. Quality and certification of credits documented.' },
    { id: 'csrd-c12', controlId: 'ESRS E1-9', articleRef: 'ESRS E1, DR E1-9', title: 'Anticipated Financial Effects from Climate Change', description: 'Disclose anticipated financial effects of material physical and transition risks and opportunities from climate change.', category: 'Climate Change (ESRS E1)', priority: 'High', status: 'required', evidenceTypes: ['TCFD-Aligned Risk Assessment', 'Climate Scenario Analysis', 'Financial Impact Quantification'], implementationGuidance: 'Conduct climate scenario analysis (1.5°C, 2°C, 4°C). Quantify financial impact of physical and transition risks.', assessmentCriteria: 'Financial effects of climate risks and opportunities quantified under multiple scenarios.' },
    // ESRS E5 — Circular Economy
    { id: 'csrd-c13', controlId: 'ESRS E5-4', articleRef: 'ESRS E5, DR E5-4', title: 'Resource Inflows', description: 'Disclose total weight of products/materials used, percentage of recycled content, and renewable materials.', category: 'Resource Use & Circular Economy (ESRS E5)', priority: 'High', status: 'required', evidenceTypes: ['Material Flow Analysis', 'Recycled Content Certificates', 'Procurement Records'], implementationGuidance: 'Track material inputs by weight and type. Calculate recycled and renewable content percentages.', assessmentCriteria: 'Material inflows quantified with recycled/renewable content percentages.' },
    { id: 'csrd-c14', controlId: 'ESRS E5-5', articleRef: 'ESRS E5, DR E5-5', title: 'Resource Outflows', description: 'Disclose total waste generated by weight, hazardous/non-hazardous split, and waste treatment methods.', category: 'Resource Use & Circular Economy (ESRS E5)', priority: 'High', status: 'required', evidenceTypes: ['Waste Register', 'Waste Treatment Certificates', 'Recycling Rate Reports'], implementationGuidance: 'Track all waste streams. Calculate recycling, recovery, and disposal rates. Report hazardous waste separately.', assessmentCriteria: 'Waste generated disclosed by type and treatment method. Recycling rates calculated.' },
    // ESRS S1 — Own Workforce
    { id: 'csrd-c15', controlId: 'ESRS S1-6', articleRef: 'ESRS S1, DR S1-6', title: 'Characteristics of Employees', description: 'Disclose total number of employees by gender, country, and employment type (permanent/temporary, full-time/part-time).', category: 'Own Workforce (ESRS S1)', priority: 'Critical', status: 'required', evidenceTypes: ['HR Data Extract', 'Employee Demographics Report', 'Headcount Analysis'], implementationGuidance: 'Extract employee data by gender, geography, contract type. Report at reporting period end.', assessmentCriteria: 'Complete employee breakdown by gender, country, and employment type disclosed.' },
    { id: 'csrd-c16', controlId: 'ESRS S1-9', articleRef: 'ESRS S1, DR S1-9', title: 'Diversity Metrics', description: 'Disclose diversity metrics including gender pay gap, board gender diversity, and age distribution.', category: 'Own Workforce (ESRS S1)', priority: 'High', status: 'required', evidenceTypes: ['Gender Pay Gap Analysis', 'Board Diversity Report', 'Age Distribution Data'], implementationGuidance: 'Calculate gender pay gap (mean and median). Report board composition. Include disability and ethnic diversity where applicable.', assessmentCriteria: 'Gender pay gap calculated and disclosed. Board diversity metrics reported.' },
    { id: 'csrd-c17', controlId: 'ESRS S1-14', articleRef: 'ESRS S1, DR S1-14', title: 'Health and Safety Metrics', description: 'Disclose work-related injuries, fatalities, lost-time injury frequency rate (LTIFR), and occupational diseases.', category: 'Own Workforce (ESRS S1)', priority: 'Critical', status: 'required', evidenceTypes: ['H&S Incident Log', 'LTIFR Calculation', 'Fatality Records', 'Occupational Disease Registry'], implementationGuidance: 'Track all work-related injuries and fatalities. Calculate LTIFR per 1M hours worked. Report by severity.', assessmentCriteria: 'LTIFR, fatalities, and occupational disease rates disclosed with calculation methodology.' },
    // ESRS G1 — Business Conduct
    { id: 'csrd-c18', controlId: 'ESRS G1-1', articleRef: 'ESRS G1, DR G1-1', title: 'Business Conduct Policies and Culture', description: 'Disclose anti-corruption, anti-bribery policies, and how corporate culture integrates business conduct standards.', category: 'Business Conduct (ESRS G1)', priority: 'High', status: 'required', evidenceTypes: ['Anti-Corruption Policy', 'Code of Conduct', 'Ethics Training Records', 'Whistleblower Policy'], implementationGuidance: 'Establish and publish anti-corruption policies. Implement training programs. Provide whistleblower channels.', assessmentCriteria: 'Anti-corruption policies in place. Training coverage disclosed. Whistleblower mechanism operational.' },
    { id: 'csrd-c19', controlId: 'ESRS G1-4', articleRef: 'ESRS G1, DR G1-4', title: 'Confirmed Incidents of Corruption or Bribery', description: 'Disclose number of confirmed corruption or bribery incidents and related convictions during the reporting period.', category: 'Business Conduct (ESRS G1)', priority: 'High', status: 'required', evidenceTypes: ['Incident Log', 'Legal Proceedings Register', 'Investigation Reports'], implementationGuidance: 'Track all confirmed incidents. Include convictions and fines. Report investigation outcomes.', assessmentCriteria: 'All confirmed corruption/bribery incidents disclosed with outcomes.' },
    // Assurance & Reporting
    { id: 'csrd-c20', controlId: 'CSRD-Art29a', articleRef: 'Article 29a', title: 'Limited Assurance Engagement', description: 'Sustainability reporting must be subject to limited assurance by statutory auditor or audit firm.', category: 'Assurance & Reporting', priority: 'Critical', status: 'required', evidenceTypes: ['Assurance Report', 'Auditor Engagement Letter', 'Assurance Scope Document'], implementationGuidance: 'Engage statutory auditor for limited assurance. Prepare data and documentation for assurance process. Plan for reasonable assurance transition.', assessmentCriteria: 'Limited assurance opinion obtained from qualified auditor. Scope covers all material ESRS disclosures.' },
    { id: 'csrd-c21', controlId: 'CSRD-Art29b', articleRef: 'Article 29b', title: 'Digital Tagging (iXBRL/ESEF)', description: 'Sustainability report must be prepared in XHTML format with iXBRL markup per European Single Electronic Format (ESEF).', category: 'Assurance & Reporting', priority: 'High', status: 'required', evidenceTypes: ['XHTML Report File', 'iXBRL Tagging Validation', 'ESEF Compliance Check'], implementationGuidance: 'Prepare sustainability report in XHTML with iXBRL tags per ESRS taxonomy. Validate tagging accuracy.', assessmentCriteria: 'Report available in ESEF format with complete iXBRL tagging validated.' },
  ],
};

// =============================================================================
// ECODESIGN (ESPR) — Regulation (EU) 2024/1781
// =============================================================================

export const ECODESIGN_CONTROLS: FrameworkControlHierarchy = {
  frameworkId: 'ecodesign',
  frameworkName: 'Ecodesign for Sustainable Products Regulation',
  regulation: 'Regulation (EU) 2024/1781 (ESPR)',
  jurisdiction: 'EU',
  effectiveDate: '2024-07-18',
  categories: [
    'Product Performance Requirements',
    'Digital Product Passport (DPP)',
    'Substance Restrictions',
    'Durability & Repairability',
    'Energy Efficiency',
    'Recycled Content & End-of-Life',
    'Environmental Footprint',
    'Supply Chain Transparency',
    'Conformity Assessment',
    'Market Surveillance',
  ],
  articles: [
    { id: 'espr-art5', articleNumber: 'Article 5', title: 'Ecodesign Requirements', summary: 'Delegated acts may set performance and information requirements for product groups.', mandatory: true },
    { id: 'espr-art7', articleNumber: 'Article 7', title: 'Performance Requirements', summary: 'Requirements on product parameters: durability, reliability, reusability, upgradability, repairability, energy use, recycled content.', mandatory: true },
    { id: 'espr-art8', articleNumber: 'Article 8', title: 'Information Requirements', summary: 'Information made available through Digital Product Passport, product labels, and websites.', mandatory: true },
    { id: 'espr-art9', articleNumber: 'Article 9', title: 'Digital Product Passport', summary: 'Establishment of DPP requirements for product groups with standardized data and QR code access.', mandatory: true, deadline: '2027-01-01' },
    { id: 'espr-art10', articleNumber: 'Article 10', title: 'Substances of Concern', summary: 'Tracking and restricting substances of concern (SVHC, restricted, and emerging substances) in products.', mandatory: true },
    { id: 'espr-art21', articleNumber: 'Article 21', title: 'Unsold Consumer Products Ban', summary: 'Prohibition on destruction of unsold textile, footwear, and other consumer products.', mandatory: true, deadline: '2026-07-19' },
    { id: 'espr-annex3', articleNumber: 'Annex III', title: 'DPP Technical Design Requirements', summary: 'Technical specifications for Digital Product Passport data carrier, unique identifier, and interoperability.', mandatory: true },
    { id: 'espr-annex8', articleNumber: 'Annex VIII', title: 'DPP Information Requirements', summary: 'Mandatory information categories for Digital Product Passport including identification, environmental, and compliance data.', mandatory: true },
  ],
  controls: [
    // DPP Requirements (Annex VIII)
    { id: 'espr-c1', controlId: 'ESPR-DPP-1', articleRef: 'Article 9 + Annex VIII, (a)', title: 'Product Identification in DPP', description: 'DPP must contain unique product identifier, GTIN/serial number, manufacturing date, and manufacturing country.', category: 'Digital Product Passport (DPP)', priority: 'Critical', status: 'required', evidenceTypes: ['DPP Data Schema', 'Unique Identifier Assignment', 'Product Registration'], implementationGuidance: 'Assign unique DPP identifier per product unit. Register in EU DPP registry. Link to data carrier (QR code).', assessmentCriteria: 'Each product unit has unique DPP identifier. QR code links to complete DPP data.' },
    { id: 'espr-c2', controlId: 'ESPR-DPP-2', articleRef: 'Article 9 + Annex VIII, (b)', title: 'Manufacturer Information in DPP', description: 'DPP must identify the manufacturer, importer, and authorized representative with contact details and facility info.', category: 'Digital Product Passport (DPP)', priority: 'High', status: 'required', evidenceTypes: ['Manufacturer Registry Entry', 'Importer Declaration', 'Contact Information Record'], implementationGuidance: 'Include legal entity name, address, contact email, and facility of manufacture in DPP.', assessmentCriteria: 'Complete manufacturer and supply chain actor information in DPP.' },
    { id: 'espr-c3', controlId: 'ESPR-DPP-3', articleRef: 'Article 9 + Annex VIII, (c)', title: 'Compliance Documentation in DPP', description: 'DPP must reference EU Declaration of Conformity, applicable harmonized standards, and conformity assessment body.', category: 'Digital Product Passport (DPP)', priority: 'High', status: 'required', evidenceTypes: ['EU DoC Reference', 'Harmonized Standard List', 'Notified Body Certificate'], implementationGuidance: 'Link EU Declaration of Conformity document in DPP. Reference all applied harmonized standards with version numbers.', assessmentCriteria: 'Compliance documentation referenced and accessible via DPP.' },
    { id: 'espr-c4', controlId: 'ESPR-DPP-4', articleRef: 'Article 9 + Annex VIII, (d)', title: 'User Instructions and Safety', description: 'DPP must include or link to installation, use, maintenance, repair, and disposal instructions.', category: 'Digital Product Passport (DPP)', priority: 'High', status: 'required', evidenceTypes: ['User Manual', 'Repair Manual', 'Disposal Instructions', 'Safety Data Sheet'], implementationGuidance: 'Provide comprehensive user-facing documentation including repair guides, spare parts catalogs, and end-of-life instructions.', assessmentCriteria: 'Complete product lifecycle instructions available through DPP.' },
    { id: 'espr-c5', controlId: 'ESPR-DPP-5', articleRef: 'Article 9 + Annex VIII, (e)', title: 'Substances of Concern Disclosure in DPP', description: 'DPP must disclose SVHC above 0.1% w/w concentration, restricted substances, and their location in the product.', category: 'Digital Product Passport (DPP)', priority: 'Critical', status: 'required', evidenceTypes: ['SCIP Database Submission', 'Material Composition Report', 'SVHC Declaration'], implementationGuidance: 'Conduct full material composition analysis. Identify SVHC per REACH Candidate List. Submit to ECHA SCIP database.', assessmentCriteria: 'All SVHC above threshold identified and disclosed with location in product.' },
    { id: 'espr-c6', controlId: 'ESPR-DPP-6', articleRef: 'Article 9 + Annex VIII, (f)', title: 'Environmental Footprint in DPP', description: 'DPP must include environmental footprint data per applicable PEF/OEF methodology.', category: 'Digital Product Passport (DPP)', priority: 'High', status: 'required', evidenceTypes: ['PEF Study', 'Environmental Footprint Calculation', 'Third-Party Review'], implementationGuidance: 'Conduct Product Environmental Footprint (PEF) study per EU methodology. Include all impact categories.', assessmentCriteria: 'PEF results included in DPP with methodology reference and review status.' },
    // Durability & Repairability
    { id: 'espr-c7', controlId: 'ESPR-Art7-1', articleRef: 'Article 7(2)(a)', title: 'Product Durability', description: 'Products must meet minimum durability requirements including resistance to wear, stress, and aging.', category: 'Durability & Repairability', priority: 'High', status: 'required', evidenceTypes: ['Durability Test Report', 'Accelerated Aging Test', 'Mean Time Between Failures'], implementationGuidance: 'Conduct durability testing per applicable standards. Document MTBF and expected lifetime.', assessmentCriteria: 'Product durability demonstrated through testing. Expected lifetime documented.' },
    { id: 'espr-c8', controlId: 'ESPR-Art7-2', articleRef: 'Article 7(2)(b)', title: 'Repairability Requirements', description: 'Products must be designed for repair: accessible disassembly, spare parts availability, and repair manuals.', category: 'Durability & Repairability', priority: 'High', status: 'required', evidenceTypes: ['Repair Design Assessment', 'Spare Parts Catalog', 'Repair Manual', 'Repairability Score'], implementationGuidance: 'Design for disassembly with standard tools. Ensure spare parts available for support period. Publish repair manuals.', assessmentCriteria: 'Product repairable. Spare parts available for ≥support period. Repair manual public.' },
    { id: 'espr-c9', controlId: 'ESPR-Art7-3', articleRef: 'Article 7(2)(c)', title: 'Upgradability', description: 'Products must allow firmware/software updates and functional upgrades where technically feasible.', category: 'Durability & Repairability', priority: 'Medium', status: 'required', evidenceTypes: ['Update Mechanism Design', 'Upgrade Path Documentation', 'Software Update Policy'], implementationGuidance: 'Implement OTA/firmware update capability. Document upgrade paths for hardware components where applicable.', assessmentCriteria: 'Software updatable. Hardware upgrade paths documented where applicable.' },
    // Substance Restrictions
    { id: 'espr-c10', controlId: 'ESPR-Art10-1', articleRef: 'Article 10(1)', title: 'Substance of Concern Tracking', description: 'Track and disclose all substances of concern present in the product above specified thresholds.', category: 'Substance Restrictions', priority: 'Critical', status: 'required', evidenceTypes: ['Full Material Disclosure', 'REACH Compliance Report', 'Restricted Substance Test Results'], implementationGuidance: 'Conduct full material analysis. Cross-reference REACH Candidate List, Annex XIV, and Annex XVII. Test for restricted substances.', assessmentCriteria: 'All substances of concern identified, tracked, and disclosed per REACH thresholds.' },
    { id: 'espr-c11', controlId: 'ESPR-Art10-2', articleRef: 'Article 10(2)', title: 'SVHC Substitution Assessment', description: 'Assess feasibility of substituting Substances of Very High Concern with safer alternatives.', category: 'Substance Restrictions', priority: 'High', status: 'required', evidenceTypes: ['Substitution Analysis', 'Alternative Assessment Report', 'Phase-Out Plan'], implementationGuidance: 'For each identified SVHC, assess substitution feasibility. Document alternatives analysis and phase-out timeline.', assessmentCriteria: 'SVHC substitution assessed. Phase-out plans documented where alternatives exist.' },
    // Energy Efficiency
    { id: 'espr-c12', controlId: 'ESPR-Art7-4', articleRef: 'Article 7(2)(f)', title: 'Energy Efficiency Performance', description: 'Products must meet minimum energy efficiency requirements during use phase.', category: 'Energy Efficiency', priority: 'High', status: 'required', evidenceTypes: ['Energy Performance Test Report', 'Energy Label Verification', 'Standby Power Measurement'], implementationGuidance: 'Test energy consumption per applicable test standard. Meet or exceed minimum efficiency requirements. Measure standby power.', assessmentCriteria: 'Energy efficiency tested and verified. Meets minimum requirements per product category.' },
    // Recycled Content & End-of-Life
    { id: 'espr-c13', controlId: 'ESPR-Art7-5', articleRef: 'Article 7(2)(g)', title: 'Recycled Content Requirements', description: 'Products must incorporate minimum percentages of recycled content from post-consumer waste.', category: 'Recycled Content & End-of-Life', priority: 'High', status: 'required', evidenceTypes: ['Recycled Content Certification', 'Mass Balance Calculations', 'Supplier Declarations'], implementationGuidance: 'Track recycled content by material type. Obtain supplier certifications. Calculate percentage of post-consumer recycled content.', assessmentCriteria: 'Recycled content percentage calculated and certified per product category requirements.' },
    { id: 'espr-c14', controlId: 'ESPR-Art7-6', articleRef: 'Article 7(2)(h)', title: 'Recyclability Design', description: 'Products must be designed for recycling at end-of-life including material identification and easy separation.', category: 'Recycled Content & End-of-Life', priority: 'High', status: 'required', evidenceTypes: ['Design for Recycling Assessment', 'Material Identification Markings', 'Disassembly Guide'], implementationGuidance: 'Design for material separation. Mark materials per ISO 11469/1043. Avoid incompatible material combinations.', assessmentCriteria: 'Product designed for recycling. Materials identified and separable. Disassembly guide available.' },
    // Conformity Assessment
    { id: 'espr-c15', controlId: 'ESPR-Art38-1', articleRef: 'Article 38', title: 'Conformity Assessment Procedure', description: 'Products must undergo conformity assessment per applicable delegated act requirements before market placement.', category: 'Conformity Assessment', priority: 'Critical', status: 'required', evidenceTypes: ['Conformity Assessment Report', 'Internal Production Control Records', 'Notified Body Certificate'], implementationGuidance: 'Select appropriate conformity assessment module per product category. Engage notified body if required.', assessmentCriteria: 'Conformity assessment completed per applicable module. Documentation maintained for 10 years.' },
    // Unsold Products Ban
    { id: 'espr-c16', controlId: 'ESPR-Art21-1', articleRef: 'Article 21', title: 'Prohibition on Destruction of Unsold Products', description: 'Prohibition on destroying unsold consumer textiles, footwear, and other products with disclosure requirements.', category: 'Market Surveillance', priority: 'High', status: 'required', evidenceTypes: ['Unsold Product Policy', 'Destruction Prevention Records', 'Donation/Recycling Logs'], implementationGuidance: 'Implement policy prohibiting destruction of unsold products. Establish donation, recycling, or outlet channels. Disclose annually.', assessmentCriteria: 'No destruction of unsold products. Alternative disposition channels documented.' },
  ],
};

// =============================================================================
// NIS2 Directive — Directive (EU) 2022/2555 (Enhanced Controls)
// =============================================================================

export const NIS2_ENHANCED_CONTROLS: FrameworkControlHierarchy = {
  frameworkId: 'nis2',
  frameworkName: 'NIS2 Directive',
  regulation: 'Directive (EU) 2022/2555',
  jurisdiction: 'EU',
  effectiveDate: '2024-10-18',
  categories: [
    'Risk Management Measures (Art. 21)',
    'Incident Reporting (Art. 23-24)',
    'Supply Chain Security',
    'Management Accountability (Art. 20)',
    'Registration & Notification',
    'Cross-Border Cooperation',
    'Sector-Specific Requirements',
  ],
  articles: [
    { id: 'nis2-art20', articleNumber: 'Article 20', title: 'Governance', summary: 'Management bodies must approve and oversee cybersecurity risk-management measures. Members must undergo regular training.', mandatory: true },
    { id: 'nis2-art21', articleNumber: 'Article 21', title: 'Cybersecurity Risk-Management Measures', summary: 'Essential and important entities must take appropriate technical, operational, and organizational measures.', mandatory: true, deadline: '2024-10-18' },
    { id: 'nis2-art23', articleNumber: 'Article 23', title: 'Reporting Obligations', summary: 'Significant incidents must be reported: early warning (24h), notification (72h), final report (1 month).', mandatory: true },
    { id: 'nis2-art24', articleNumber: 'Article 24', title: 'Use of EU Certification Schemes', summary: 'Entities may use ICT products/services certified under EU cybersecurity certification schemes to demonstrate compliance.', mandatory: false },
    { id: 'nis2-art25', articleNumber: 'Article 25', title: 'Standardization', summary: 'Use of European and international standards for network and information system security implementation.', mandatory: false },
    { id: 'nis2-art29', articleNumber: 'Article 29', title: 'Peer Reviews', summary: 'Voluntary peer reviews for essential and important entities to assess cybersecurity capabilities.', mandatory: false },
  ],
  controls: [
    // Article 21(2)(a-j) — 10 Mandatory Measures
    { id: 'nis2-c1', controlId: 'NIS2-Art21-2a', articleRef: 'Article 21(2)(a)', title: 'Risk Analysis and Information System Security Policies', description: 'Establish comprehensive risk analysis framework and information security policies covering all business operations.', category: 'Risk Management Measures (Art. 21)', priority: 'Critical', status: 'required', evidenceTypes: ['Risk Assessment Framework', 'Information Security Policy', 'Risk Register', 'Risk Treatment Plan'], implementationGuidance: 'Implement ISO 27005-aligned risk assessment. Document policies covering all Annex I/II sectors. Annual review cycle.', assessmentCriteria: 'Risk analysis methodology documented. Security policies cover all operations. Annual review evidenced.' },
    { id: 'nis2-c2', controlId: 'NIS2-Art21-2b', articleRef: 'Article 21(2)(b)', title: 'Incident Handling', description: 'Establish incident detection, management, and response procedures including classification, escalation, and remediation.', category: 'Risk Management Measures (Art. 21)', priority: 'Critical', status: 'required', evidenceTypes: ['Incident Response Plan', 'Incident Classification Scheme', 'Response Team Charter', 'Incident Log'], implementationGuidance: 'Define incident categories and severity levels. Establish CSIRT or SOC capability. Test response procedures quarterly.', assessmentCriteria: 'Documented incident handling procedure. Response tested at least quarterly. All incidents logged.' },
    { id: 'nis2-c3', controlId: 'NIS2-Art21-2c', articleRef: 'Article 21(2)(c)', title: 'Business Continuity and Crisis Management', description: 'Establish business continuity management including backup management, disaster recovery, and crisis management.', category: 'Risk Management Measures (Art. 21)', priority: 'Critical', status: 'required', evidenceTypes: ['BCP/DRP Documents', 'Backup Policy', 'Recovery Test Results', 'Crisis Management Plan'], implementationGuidance: 'Define RTO/RPO per business function. Implement 3-2-1 backup strategy. Test DR annually. Establish crisis communication plan.', assessmentCriteria: 'BCP/DRP documented with defined RTO/RPO. Backup strategy implemented. DR tested annually.' },
    { id: 'nis2-c4', controlId: 'NIS2-Art21-2d', articleRef: 'Article 21(2)(d)', title: 'Supply Chain Security', description: 'Secure the supply chain including security aspects of relationships with direct suppliers and service providers.', category: 'Supply Chain Security', priority: 'Critical', status: 'required', evidenceTypes: ['Supplier Security Assessment', 'Vendor Risk Register', 'Contractual Security Requirements', 'SLA Monitoring'], implementationGuidance: 'Assess security of all critical suppliers. Include security requirements in contracts. Monitor supplier security posture continuously.', assessmentCriteria: 'Critical suppliers assessed. Security requirements in contracts. Ongoing monitoring evidenced.' },
    { id: 'nis2-c5', controlId: 'NIS2-Art21-2e', articleRef: 'Article 21(2)(e)', title: 'Security in Network and Information Systems Acquisition', description: 'Security in the acquisition, development, and maintenance of network and information systems including vulnerability handling.', category: 'Risk Management Measures (Art. 21)', priority: 'High', status: 'required', evidenceTypes: ['Secure Development Policy', 'Vulnerability Management Process', 'Change Management Records'], implementationGuidance: 'Integrate security into SDLC. Establish vulnerability management program. Implement change management controls.', assessmentCriteria: 'Security integrated into system lifecycle. Vulnerabilities tracked and remediated per SLA.' },
    { id: 'nis2-c6', controlId: 'NIS2-Art21-2f', articleRef: 'Article 21(2)(f)', title: 'Cybersecurity Risk-Management Effectiveness Assessment', description: 'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures.', category: 'Risk Management Measures (Art. 21)', priority: 'High', status: 'required', evidenceTypes: ['Security Metrics Dashboard', 'Penetration Test Reports', 'Audit Reports', 'KPI Tracking'], implementationGuidance: 'Define security KPIs. Conduct regular penetration testing. Perform internal audits. Report effectiveness to management.', assessmentCriteria: 'Security effectiveness metrics defined and tracked. Regular testing conducted. Management reporting evidenced.' },
    { id: 'nis2-c7', controlId: 'NIS2-Art21-2g', articleRef: 'Article 21(2)(g)', title: 'Basic Cyber Hygiene and Training', description: 'Basic cyber hygiene practices and cybersecurity training for all personnel.', category: 'Risk Management Measures (Art. 21)', priority: 'High', status: 'required', evidenceTypes: ['Security Awareness Program', 'Training Records', 'Phishing Simulation Results', 'Hygiene Checklist'], implementationGuidance: 'Implement security awareness training for all staff. Conduct phishing simulations. Define cyber hygiene baseline.', assessmentCriteria: 'All staff trained annually. Phishing simulation program active. Cyber hygiene standards documented.' },
    { id: 'nis2-c8', controlId: 'NIS2-Art21-2h', articleRef: 'Article 21(2)(h)', title: 'Cryptography and Encryption', description: 'Policies and procedures regarding the use of cryptography and, where appropriate, encryption.', category: 'Risk Management Measures (Art. 21)', priority: 'High', status: 'required', evidenceTypes: ['Cryptography Policy', 'Encryption Standards', 'Key Management Procedures', 'Certificate Management'], implementationGuidance: 'Define approved cryptographic algorithms. Implement key lifecycle management. Encrypt data per classification policy.', assessmentCriteria: 'Cryptography policy documented. Approved algorithms specified. Key management operational.' },
    { id: 'nis2-c9', controlId: 'NIS2-Art21-2i', articleRef: 'Article 21(2)(i)', title: 'Human Resources Security and Access Control', description: 'Human resources security, access control policies, and asset management procedures.', category: 'Risk Management Measures (Art. 21)', priority: 'High', status: 'required', evidenceTypes: ['Access Control Policy', 'HR Security Policy', 'Asset Register', 'Access Review Records'], implementationGuidance: 'Implement RBAC. Conduct regular access reviews. Manage joiners/movers/leavers process. Maintain asset inventory.', assessmentCriteria: 'Access control policy enforced. Regular access reviews. JML process documented. Asset inventory current.' },
    { id: 'nis2-c10', controlId: 'NIS2-Art21-2j', articleRef: 'Article 21(2)(j)', title: 'Multi-Factor Authentication and Secure Communications', description: 'Use of multi-factor authentication, secured voice/video/text communications, and secured emergency communication systems.', category: 'Risk Management Measures (Art. 21)', priority: 'Critical', status: 'required', evidenceTypes: ['MFA Implementation Evidence', 'Secure Communication Tools', 'Emergency Communication Plan'], implementationGuidance: 'Deploy MFA for all administrative access and remote access. Use E2E encrypted communication tools. Establish secure emergency comms.', assessmentCriteria: 'MFA deployed for all privileged access. Secure communications operational. Emergency comms tested.' },
    // Article 20 — Governance
    { id: 'nis2-c11', controlId: 'NIS2-Art20-1', articleRef: 'Article 20(1)', title: 'Management Body Approval', description: 'Management bodies must approve cybersecurity risk-management measures and be liable for non-compliance.', category: 'Management Accountability (Art. 20)', priority: 'Critical', status: 'required', evidenceTypes: ['Board Approval Minutes', 'Management Accountability Statement', 'Governance Charter'], implementationGuidance: 'Present cybersecurity measures to board for formal approval. Document management accountability. Annual governance review.', assessmentCriteria: 'Board approval of cybersecurity measures documented. Accountability structure defined.' },
    { id: 'nis2-c12', controlId: 'NIS2-Art20-2', articleRef: 'Article 20(2)', title: 'Management Body Training', description: 'Members of the management body must undergo regular cybersecurity training to assess risks and management practices.', category: 'Management Accountability (Art. 20)', priority: 'High', status: 'required', evidenceTypes: ['Board Training Records', 'Training Curriculum', 'Competency Assessment'], implementationGuidance: 'Provide annual cybersecurity briefings to board. Include threat landscape, risk posture, and regulatory updates.', assessmentCriteria: 'Board members trained annually. Training content covers current threats and regulatory requirements.' },
    // Article 23 — Incident Reporting
    { id: 'nis2-c13', controlId: 'NIS2-Art23-1', articleRef: 'Article 23(4)(a)', title: 'Early Warning (24 hours)', description: 'Submit early warning to CSIRT/competent authority within 24 hours of becoming aware of a significant incident.', category: 'Incident Reporting (Art. 23-24)', priority: 'Critical', status: 'required', evidenceTypes: ['Early Warning Template', 'Notification Records', 'Incident Timeline'], implementationGuidance: 'Establish 24-hour notification SOP. Pre-configure notification templates. Define significant incident criteria.', assessmentCriteria: 'Early warning submitted within 24 hours for all significant incidents. Process documented and tested.' },
    { id: 'nis2-c14', controlId: 'NIS2-Art23-2', articleRef: 'Article 23(4)(b)', title: 'Incident Notification (72 hours)', description: 'Submit detailed incident notification within 72 hours with initial assessment, severity, and impact.', category: 'Incident Reporting (Art. 23-24)', priority: 'Critical', status: 'required', evidenceTypes: ['Incident Notification Report', 'Impact Assessment', 'IoC Documentation'], implementationGuidance: 'Include initial assessment of severity and impact. Document indicators of compromise. Describe cross-border impact if applicable.', assessmentCriteria: 'Detailed notification within 72 hours. Severity assessment and IoCs included.' },
    { id: 'nis2-c15', controlId: 'NIS2-Art23-3', articleRef: 'Article 23(4)(d)', title: 'Final Report (1 month)', description: 'Submit final report within one month including detailed incident description, root cause, and mitigation measures.', category: 'Incident Reporting (Art. 23-24)', priority: 'High', status: 'required', evidenceTypes: ['Final Incident Report', 'Root Cause Analysis', 'Lessons Learned', 'Mitigation Evidence'], implementationGuidance: 'Conduct thorough root cause analysis. Document lessons learned. Verify mitigation effectiveness. Include cross-border impact assessment.', assessmentCriteria: 'Final report within 1 month. RCA complete. Mitigation measures verified and documented.' },
  ],
};

// =============================================================================
// Export all framework controls
// =============================================================================

export const ALL_FRAMEWORK_CONTROLS: Record<string, FrameworkControlHierarchy> = {
  'eu-cra': EU_CRA_CONTROLS,
  'csrd': CSRD_CONTROLS,
  'ecodesign': ECODESIGN_CONTROLS,
  'nis2': NIS2_ENHANCED_CONTROLS,
};

/**
 * Get controls for a specific framework
 */
export function getFrameworkControls(frameworkId: string): FrameworkControlHierarchy | undefined {
  return ALL_FRAMEWORK_CONTROLS[frameworkId];
}

/**
 * Get controls filtered by category
 */
export function getControlsByCategory(frameworkId: string, category: string): FrameworkControl[] {
  const fw = ALL_FRAMEWORK_CONTROLS[frameworkId];
  if (!fw) return [];
  return fw.controls.filter(c => c.category === category);
}

/**
 * Get controls filtered by article reference
 */
export function getControlsByArticle(frameworkId: string, articleRef: string): FrameworkControl[] {
  const fw = ALL_FRAMEWORK_CONTROLS[frameworkId];
  if (!fw) return [];
  return fw.controls.filter(c => c.articleRef.includes(articleRef));
}

/**
 * Get control statistics for a framework
 */
export function getFrameworkStats(frameworkId: string): {
  totalControls: number;
  criticalControls: number;
  requiredControls: number;
  categories: number;
  articles: number;
} {
  const fw = ALL_FRAMEWORK_CONTROLS[frameworkId];
  if (!fw) return { totalControls: 0, criticalControls: 0, requiredControls: 0, categories: 0, articles: 0 };
  return {
    totalControls: fw.controls.length,
    criticalControls: fw.controls.filter(c => c.priority === 'Critical').length,
    requiredControls: fw.controls.filter(c => c.status === 'required').length,
    categories: fw.categories.length,
    articles: fw.articles.length,
  };
}
