export interface FrameworkControlTemplate {
  controlId: string;
  name: string;
  description: string;
  category: string;
  implementationGuidance: string;
  evidenceRequirements: string[];
  testProcedures: string[];
  status: string;
}

export const CCPA_CONTROLS: FrameworkControlTemplate[] = [
  // ============================================================
  // CONSUMER RIGHTS
  // ============================================================
  {
    controlId: 'CCPA-CR-1',
    name: 'Right to Know - Categories of Personal Information',
    description:
      'Consumers have the right to request disclosure of the categories of personal information a business has collected about them in the preceding 12 months, including the categories of sources, the business or commercial purpose for collecting or selling, and the categories of third parties with whom the business shares personal information.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Implement a verifiable consumer request intake mechanism (web form, toll-free number, email) that captures the consumer identity, the type of request, and the date received. Build an internal workflow that routes the request to the data privacy team, queries the data inventory for the categories of PI collected about the consumer, and compiles a response within 45 calendar days (extendable by an additional 45 days with notice). Ensure the response is delivered in a portable, readily usable format and covers: categories of PI collected, categories of sources, business/commercial purposes, and categories of third parties.',
    evidenceRequirements: [
      'Documented consumer request intake procedures and channel configurations (web form URL, toll-free number, email address)',
      'Sample completed Right to Know requests with timestamps showing receipt, acknowledgment, and response delivery',
      'Data inventory or mapping document that enumerates PI categories, sources, purposes, and third-party sharing',
      'Training records for staff responsible for processing Right to Know requests',
      'Audit log or ticketing system records showing request lifecycle from intake through fulfillment',
    ],
    testProcedures: [
      'Submit a test Right to Know request through each intake channel and verify acknowledgment is received within 10 business days',
      'Review a sample of completed requests to confirm responses include all required disclosure categories',
      'Verify the response was delivered within the 45-day statutory window or that a valid extension notice was sent',
      'Confirm the response format is portable and readily usable (e.g., PDF, structured data export)',
      'Inspect the data inventory to validate completeness against known data collection points',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-2',
    name: 'Right to Know - Specific Pieces of Personal Information',
    description:
      'Consumers have the right to request the specific pieces of personal information a business has collected about them. The business must deliver the information in a portable, readily usable format that allows the consumer to transmit the data to another entity without hindrance.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Extend the verifiable consumer request process to support "specific pieces" requests. Implement enhanced identity verification (at least two-factor verification for specific-pieces requests to prevent unauthorized disclosure). Build data extraction queries that can pull the actual data records associated with a verified consumer from all relevant systems. Package the extracted data in a machine-readable format (JSON, CSV) and deliver it securely via encrypted download link or secure portal. Redact any data belonging to other consumers that may be intermingled.',
    evidenceRequirements: [
      'Enhanced identity verification procedures for specific-pieces requests (two or more verification factors)',
      'Technical documentation of data extraction queries and system integrations',
      'Sample responses showing specific pieces of PI delivered in machine-readable format',
      'Evidence of secure delivery mechanism (encrypted portal, expiring download links)',
      'Redaction procedures to protect other consumers\' data in shared records',
    ],
    testProcedures: [
      'Submit a test specific-pieces request and verify enhanced identity verification is triggered before fulfillment',
      'Review extracted data for completeness against known data points in the consumer profile',
      'Verify the response is delivered in a portable, machine-readable format (JSON, CSV, or equivalent)',
      'Confirm secure delivery via encrypted channel with appropriate access controls',
      'Attempt to submit a request with insufficient identity verification and confirm it is rejected',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-3',
    name: 'Right to Know - Sources of Personal Information',
    description:
      'Consumers have the right to know the categories of sources from which their personal information was collected, including directly from the consumer, from third-party data brokers, from public records, and from automated collection technologies.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Maintain a comprehensive data source registry that maps each category of personal information to its originating source(s). Categorize sources as: directly from consumers (forms, account creation, purchases), automatically collected (cookies, device fingerprinting, analytics), from third parties (data brokers, advertising networks, social media platforms), and public sources (government records, publicly available information). Integrate the source registry into the Right to Know response workflow so that source categories are automatically included in disclosures.',
    evidenceRequirements: [
      'Data source registry mapping PI categories to source categories',
      'Documentation of all third-party data sources and associated agreements',
      'Automated collection technology inventory (cookies, SDKs, pixels, beacons)',
      'Sample Right to Know responses demonstrating source category disclosure',
      'Periodic review records of the data source registry for accuracy',
    ],
    testProcedures: [
      'Review the data source registry for completeness against known data collection channels',
      'Cross-reference third-party data sources with executed data sharing agreements',
      'Verify automated collection technologies are accurately catalogued in the registry',
      'Review sample Right to Know responses to confirm source categories are disclosed',
      'Validate that new data collection channels trigger an update to the source registry',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-4',
    name: 'Right to Know - Business Purposes',
    description:
      'Consumers have the right to know the business or commercial purposes for which their personal information is collected, used, or sold. Purposes must be specific and not described in generic terms.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Define and document all business and commercial purposes for collecting and processing personal information. Map each purpose to the specific categories of PI used. Ensure purpose descriptions are specific and consumer-friendly (e.g., "to process your online order and arrange delivery" rather than "business operations"). Integrate purpose disclosures into the Right to Know response template and the privacy policy. Establish a review process when new processing purposes are introduced.',
    evidenceRequirements: [
      'Purpose specification document mapping PI categories to specific business/commercial purposes',
      'Privacy policy sections disclosing purposes in consumer-friendly language',
      'Right to Know response templates showing purpose disclosure',
      'Change management records for new processing purposes',
      'Approval workflow documentation for introducing new data uses',
    ],
    testProcedures: [
      'Review purpose descriptions for specificity and consumer comprehensibility',
      'Cross-reference stated purposes in the privacy policy with actual data processing activities',
      'Verify that Right to Know responses include all applicable purposes for the consumer\'s data',
      'Test the change management process by simulating introduction of a new processing purpose',
      'Confirm that purpose disclosures are consistent across the privacy policy, notice at collection, and Right to Know responses',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-5',
    name: 'Right to Know - Third-Party Sharing',
    description:
      'Consumers have the right to know the categories of third parties to whom the business has disclosed their personal information, including service providers, contractors, and any third parties to whom PI is sold or shared for cross-context behavioral advertising.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Maintain a third-party recipient registry that categorizes all entities receiving consumer PI. Distinguish between service providers (processing on behalf of the business), contractors, and true third parties. Track the categories of PI shared with each category of recipient and the purpose for sharing. Integrate this registry into Right to Know responses. Conduct periodic audits to confirm the registry reflects current sharing practices.',
    evidenceRequirements: [
      'Third-party recipient registry with entity categorization (service provider, contractor, third party)',
      'Data sharing agreements or addenda specifying PI categories and permitted uses',
      'Records of PI categories shared with each recipient category',
      'Sample Right to Know responses demonstrating third-party disclosure',
      'Audit reports validating the accuracy of the third-party registry',
    ],
    testProcedures: [
      'Review the third-party registry for completeness against accounts payable records and executed agreements',
      'Verify that each recipient is correctly categorized as service provider, contractor, or third party',
      'Confirm that data sharing agreements include required CCPA/CPRA contractual provisions',
      'Review sample Right to Know responses for accurate third-party category disclosure',
      'Trace a sample data flow from collection to third-party sharing to validate registry accuracy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-6',
    name: 'Right to Delete',
    description:
      'Consumers have the right to request deletion of their personal information collected by the business. The business must delete the PI from its records and direct service providers and contractors to delete the consumer\'s PI, subject to enumerated exceptions.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Implement a deletion request intake and verification process using the same channels as Right to Know requests. Build automated and manual deletion workflows that can purge consumer PI from all primary databases, backups (on next rotation cycle), third-party systems via API or documented notification, and analytics platforms. Maintain a record of deletion requests fulfilled (without retaining the deleted PI) for compliance documentation. Notify service providers and contractors of deletion obligations. Implement exception handling for the nine statutory exceptions (e.g., legal compliance, security, exercising legal rights).',
    evidenceRequirements: [
      'Deletion request intake and processing procedures',
      'Technical documentation of deletion workflows across all systems storing PI',
      'Service provider/contractor notification templates and delivery records',
      'Deletion confirmation records (request ID, date fulfilled, systems purged)',
      'Exception handling procedures with legal review documentation',
      'Backup rotation schedule demonstrating eventual purge of deleted data',
    ],
    testProcedures: [
      'Submit a test deletion request and verify PI is removed from all primary systems within 45 days',
      'Confirm service providers and contractors received deletion instructions',
      'Attempt to retrieve deleted consumer\'s PI from primary systems and confirm it returns no results',
      'Verify backup rotation schedule ensures deleted data is purged within documented timeframes',
      'Test exception handling by submitting a deletion request that triggers a statutory exception and verify appropriate denial with explanation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-7',
    name: 'Right to Opt-Out of Sale/Sharing',
    description:
      'Consumers have the right to direct a business that sells or shares their personal information to third parties to stop selling or sharing their PI. Under CPRA, "sharing" includes cross-context behavioral advertising. The business must provide a clear and conspicuous "Do Not Sell or Share My Personal Information" link.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Place a clear, conspicuous "Do Not Sell or Share My Personal Information" link on the homepage and every page where PI is collected. Implement an opt-out mechanism that records the consumer\'s preference and propagates it to all downstream systems performing sale or sharing (ad networks, data brokers, analytics providers). Process opt-out requests immediately upon receipt—no identity verification is required for opt-out. Wait at least 12 months before requesting the consumer to re-authorize sale/sharing. Maintain an internal suppression list of opted-out consumers.',
    evidenceRequirements: [
      'Screenshots of the "Do Not Sell or Share" link placement on homepage and collection pages',
      'Technical architecture of the opt-out signal propagation to downstream systems',
      'Suppression list management procedures and access controls',
      'Logs showing opt-out preferences are applied within the required timeframe',
      'Documentation confirming no identity verification is required for opt-out',
      'Evidence that opted-out consumers are not re-solicited within 12 months',
    ],
    testProcedures: [
      'Navigate the website and verify the opt-out link is visible on the homepage and all PI collection pages',
      'Submit an opt-out request and verify the preference is recorded without identity verification',
      'Confirm the opt-out signal propagates to all downstream sale/sharing systems within the required timeframe',
      'Verify the consumer\'s data is excluded from subsequent sale or sharing activities',
      'Test that opted-out consumers are not solicited to re-authorize within 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-8',
    name: 'Right to Non-Discrimination',
    description:
      'A business shall not discriminate against a consumer because the consumer exercised any of their CCPA rights. Discrimination includes denying goods or services, charging different prices, providing a different level of quality, or suggesting that exercising rights will result in different treatment.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Establish policies prohibiting discrimination against consumers who exercise their CCPA rights. Train customer-facing staff on non-discrimination requirements. Implement technical controls to ensure that consumers who opt out or submit deletion/access requests continue to receive the same service tier, pricing, and quality. Monitor for inadvertent discrimination (e.g., broken functionality after opt-out). Conduct periodic audits comparing service quality metrics between consumers who have and have not exercised their rights.',
    evidenceRequirements: [
      'Non-discrimination policy approved by legal and privacy leadership',
      'Training materials and completion records for customer-facing staff',
      'Technical controls documentation preventing service degradation post-opt-out',
      'Periodic audit reports comparing service metrics for rights-exercising vs. non-exercising consumers',
      'Complaint records and resolution documentation related to alleged discrimination',
    ],
    testProcedures: [
      'Review the non-discrimination policy for completeness against CCPA requirements',
      'Submit opt-out and deletion requests and verify no change in service quality, pricing, or functionality',
      'Review customer complaint logs for discrimination-related complaints and resolution adequacy',
      'Compare service metrics (page load times, feature access, pricing) between opted-out and standard users',
      'Interview customer-facing staff on non-discrimination training and awareness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-9',
    name: 'Right to Correct Inaccurate Personal Information',
    description:
      'Under CPRA, consumers have the right to request that a business correct inaccurate personal information that the business maintains about them. The business must use commercially reasonable efforts to correct the information as directed by the consumer.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Implement a correction request intake process through existing consumer rights channels. Verify the consumer\'s identity before processing corrections. Establish procedures to evaluate the correction request, determine accuracy, and apply corrections across all systems where the inaccurate data resides. Notify service providers and contractors to update their records. Document the correction and retain records of the request and actions taken. If the business denies the correction, provide the consumer with a written explanation and the right to submit a statement of disagreement.',
    evidenceRequirements: [
      'Correction request intake and processing procedures',
      'Identity verification procedures for correction requests',
      'Workflow documentation for evaluating and applying corrections across systems',
      'Service provider/contractor notification procedures for data corrections',
      'Sample correction request records showing before/after states and timestamps',
      'Denial procedures with consumer notification templates',
    ],
    testProcedures: [
      'Submit a test correction request and verify the data is updated across all relevant systems',
      'Verify identity verification is performed before corrections are applied',
      'Confirm service providers and contractors are notified of corrections',
      'Test a correction denial scenario and verify the consumer receives a written explanation',
      'Review correction request logs for timeliness (within 45 days)',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-10',
    name: 'Right to Limit Use of Sensitive Personal Information',
    description:
      'Under CPRA, consumers have the right to limit a business\'s use and disclosure of their sensitive personal information to only what is necessary to perform services or provide goods reasonably expected by an average consumer. Sensitive PI includes SSN, financial account info, precise geolocation, racial/ethnic origin, religious beliefs, biometric data, health data, sex life/orientation data, and contents of communications.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Identify and classify all sensitive personal information collected and processed. Provide a clear, conspicuous "Limit the Use of My Sensitive Personal Information" link on the homepage. Implement a mechanism to record and honor consumer preferences to limit sensitive PI use. Define the baseline "necessary" uses for each category of sensitive PI. Build controls to restrict processing of sensitive PI to necessary uses only when a consumer exercises this right. Train staff on sensitive PI handling and limitation requirements.',
    evidenceRequirements: [
      'Sensitive PI inventory and classification document',
      'Screenshots of the "Limit Use of Sensitive PI" link on homepage',
      'Technical documentation of limitation preference recording and enforcement',
      'Baseline "necessary uses" definitions for each sensitive PI category',
      'Staff training records on sensitive PI handling',
      'Audit logs showing limitation preferences are honored in downstream processing',
    ],
    testProcedures: [
      'Verify the "Limit Use" link is visible and functional on the homepage',
      'Submit a limitation request and verify the preference is recorded',
      'Confirm that sensitive PI processing is restricted to necessary uses after limitation',
      'Attempt to use limited sensitive PI for a non-necessary purpose and verify it is blocked',
      'Review the sensitive PI inventory for completeness against known data collection points',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-CR-11',
    name: 'Right to Opt-Out of Automated Decision-Making',
    description:
      'Under CPRA regulations, consumers have the right to opt out of automated decision-making technology, including profiling, that produces legal or similarly significant effects concerning the consumer. Businesses must provide meaningful information about the logic involved and a description of the likely outcome.',
    category: 'Consumer Rights',
    implementationGuidance:
      'Inventory all automated decision-making (ADM) processes that produce legal or similarly significant effects on consumers (credit decisions, insurance pricing, employment screening, etc.). For each ADM process, document the logic involved, the data inputs, and the likely outcomes. Provide consumers with pre-use notice of ADM and an opt-out mechanism. Implement manual review alternatives for consumers who opt out. Conduct regular fairness and accuracy assessments of ADM systems. Maintain records of opt-out requests and how they were fulfilled.',
    evidenceRequirements: [
      'Inventory of automated decision-making processes with legal/significant effects',
      'Logic documentation for each ADM process (data inputs, model type, decision criteria)',
      'Consumer-facing disclosures explaining ADM logic and likely outcomes',
      'Opt-out mechanism documentation and consumer notification procedures',
      'Manual review alternative procedures for opted-out consumers',
      'Fairness and accuracy assessment reports for ADM systems',
    ],
    testProcedures: [
      'Review the ADM inventory for completeness against known automated processes',
      'Verify consumer-facing disclosures accurately describe ADM logic and outcomes',
      'Submit an ADM opt-out request and verify the consumer is routed to manual review',
      'Confirm the manual review alternative produces a substantively equivalent outcome',
      'Review fairness assessment reports for statistical rigor and actionable findings',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // BUSINESS OBLIGATIONS
  // ============================================================
  {
    controlId: 'CCPA-BO-1',
    name: 'Notice at Collection',
    description:
      'A business must inform consumers at or before the point of collection about the categories of personal information to be collected, the purposes for which the categories will be used, whether the information is sold or shared, and the length of time the business intends to retain each category of PI.',
    category: 'Business Obligations',
    implementationGuidance:
      'Draft and publish a Notice at Collection for each collection point (website, mobile app, in-store, call center, employment application). The notice must include: categories of PI collected, purposes for each category, whether PI is sold or shared, and retention periods. Present the notice prominently before or at the point of collection—not buried in a general privacy policy. For online collection, use just-in-time notices, pop-ups, or prominently placed disclosures adjacent to data entry fields. Review and update notices whenever collection practices change.',
    evidenceRequirements: [
      'Notice at Collection documents for each collection channel',
      'Screenshots or recordings showing notice placement at point of collection',
      'Mapping of PI categories to purposes, sale/sharing status, and retention periods',
      'Change management records for notice updates',
      'Review and approval records from legal/privacy teams',
    ],
    testProcedures: [
      'Visit each collection point and verify a Notice at Collection is presented before or at the time of data entry',
      'Review notice content for completeness: PI categories, purposes, sale/sharing disclosure, and retention periods',
      'Verify notice language is clear, conspicuous, and consumer-friendly',
      'Confirm notices are updated when collection practices change',
      'Test mobile and desktop versions to ensure notice is accessible across platforms',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-2',
    name: 'Privacy Policy Requirements',
    description:
      'A business must make available a comprehensive privacy policy that discloses the categories of PI collected, the purposes, consumer rights, how to submit requests, categories of PI sold or shared, categories of third parties, and retention periods for each category. The policy must be updated at least every 12 months.',
    category: 'Business Obligations',
    implementationGuidance:
      'Draft a CCPA/CPRA-compliant privacy policy that includes all required disclosures. Organize the policy in a layered format with clear headings and a table of contents for readability. Include: a description of consumer rights and how to exercise them, categories of PI collected in the preceding 12 months, purposes for each category, categories of PI sold/shared and the recipients, retention periods, and contact information for the privacy team. Publish the policy on the website with a conspicuous link from the homepage footer. Review and update the policy at least annually and upon material changes.',
    evidenceRequirements: [
      'Current privacy policy document with all CCPA/CPRA required disclosures',
      'Privacy policy version history showing at least annual updates',
      'Legal review and approval records for the privacy policy',
      'Screenshot of homepage footer showing conspicuous privacy policy link',
      'Cross-reference document mapping policy disclosures to actual data practices',
    ],
    testProcedures: [
      'Review the privacy policy for all CCPA/CPRA required disclosures using a regulatory checklist',
      'Verify the policy has been updated within the last 12 months',
      'Confirm the privacy policy link is accessible from the homepage footer',
      'Cross-reference policy statements with actual data collection, use, and sharing practices',
      'Review the policy for readability and consumer comprehensibility',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-3',
    name: 'Data Inventory and Mapping',
    description:
      'Maintain a comprehensive inventory of all personal information collected, stored, used, and shared. The data map must identify the categories of PI, the sources, the business purposes, the recipients, the systems where PI is stored, and the retention periods.',
    category: 'Business Obligations',
    implementationGuidance:
      'Conduct a comprehensive data mapping exercise across all business units, systems, and processes that collect or process personal information. Use automated data discovery tools where feasible to identify PI in structured and unstructured data stores. Document data flows from collection through processing, storage, sharing, and deletion. Classify PI into CCPA categories and identify sensitive PI. Map each data element to its source, purpose, legal basis, retention period, and downstream recipients. Review and update the data map at least annually and whenever new systems or processes are introduced.',
    evidenceRequirements: [
      'Comprehensive data inventory/map covering all systems and PI categories',
      'Data flow diagrams showing PI movement from collection to disposal',
      'System inventory identifying all applications and databases storing PI',
      'Automated data discovery tool reports (if applicable)',
      'Annual review records and update logs for the data inventory',
      'PI classification scheme including sensitive PI identification',
    ],
    testProcedures: [
      'Review the data inventory for completeness against the IT system inventory',
      'Trace sample data flows from collection to disposal and verify the map is accurate',
      'Verify all PI categories defined under CCPA/CPRA are addressed in the inventory',
      'Confirm sensitive PI is identified and classified separately',
      'Check that the data map has been reviewed and updated within the last 12 months',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-4',
    name: 'Service Provider and Contractor Agreements',
    description:
      'Businesses must enter into written agreements with service providers and contractors that process PI on their behalf. Agreements must restrict the use of PI to the specified business purpose, prohibit selling or sharing, require compliance with CCPA/CPRA, and grant the business audit rights.',
    category: 'Business Obligations',
    implementationGuidance:
      'Develop CCPA/CPRA-compliant contract templates for service providers and contractors. Required provisions include: specification of the business purpose for PI processing, prohibition on selling or sharing PI, prohibition on retaining, using, or disclosing PI outside the direct business relationship, obligation to comply with CCPA/CPRA, cooperation with consumer rights requests (deletion, access, correction), notification of sub-processor engagement, data security requirements, breach notification obligations, audit rights, and certification of understanding. Remediate existing agreements to include required provisions. Maintain a contract management system tracking agreement status.',
    evidenceRequirements: [
      'CCPA/CPRA-compliant contract templates for service providers and contractors',
      'Inventory of all service providers and contractors processing PI with contract status',
      'Executed agreements with required CCPA/CPRA provisions',
      'Contract remediation tracker showing progress on legacy agreements',
      'Legal review records for service provider/contractor agreements',
      'Sub-processor disclosure and approval records',
    ],
    testProcedures: [
      'Review contract templates for all required CCPA/CPRA provisions',
      'Sample executed agreements and verify required provisions are included',
      'Verify the service provider/contractor inventory is complete against accounts payable records',
      'Confirm that legacy agreements have been remediated or are on a remediation schedule',
      'Test the sub-processor notification and approval process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-5',
    name: 'Reasonable Security Measures',
    description:
      'Businesses must implement and maintain reasonable security procedures and practices appropriate to the nature of the personal information to protect it from unauthorized or illegal access, destruction, use, modification, or disclosure. Failure to do so may give rise to a private right of action in the event of a data breach.',
    category: 'Business Obligations',
    implementationGuidance:
      'Implement a comprehensive information security program aligned with industry standards (e.g., CIS Controls, NIST CSF, ISO 27001). Key measures include: encryption of PI in transit and at rest, access controls with least privilege, multi-factor authentication for systems containing PI, network segmentation, intrusion detection and prevention, vulnerability management and patching, endpoint protection, security awareness training, incident response planning, and regular security assessments. Document the security program and conduct annual risk assessments to ensure measures remain appropriate to the nature of the PI.',
    evidenceRequirements: [
      'Information security program documentation aligned with an industry framework',
      'Encryption standards and implementation evidence (TLS certificates, database encryption configs)',
      'Access control policies and role-based access configuration evidence',
      'Vulnerability scan and penetration test reports',
      'Security awareness training program and completion records',
      'Incident response plan and tabletop exercise records',
      'Annual risk assessment reports',
    ],
    testProcedures: [
      'Review the information security program for alignment with an industry standard',
      'Verify encryption is implemented for PI in transit (TLS 1.2+) and at rest',
      'Test access controls by attempting to access PI with unauthorized credentials',
      'Review vulnerability scan results for critical or high findings and remediation status',
      'Verify security awareness training completion rates meet organizational thresholds',
      'Review the incident response plan and most recent tabletop exercise results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-6',
    name: 'Financial Incentive Programs',
    description:
      'A business may offer financial incentives (price or service differences) for the collection, sale, retention, or deletion of PI, provided the consumer opts in, the terms are clearly described in the privacy policy, the incentive is not unjust or coercive, and the business can demonstrate the value of the consumer data.',
    category: 'Business Obligations',
    implementationGuidance:
      'For any loyalty programs, discount programs, or other financial incentive programs tied to PI, document the program terms including: the categories of PI collected, the incentive offered, the value of the consumer\'s data (methodology for calculating value), and opt-in/opt-out procedures. Obtain explicit opt-in consent before enrolling consumers. Disclose the material terms of the program in the privacy policy. Allow consumers to opt out of the program at any time without penalty. Ensure the incentive is reasonably related to the value of the consumer\'s data and is not unjust, unreasonable, coercive, or usurious.',
    evidenceRequirements: [
      'Financial incentive program descriptions with material terms',
      'Data valuation methodology documentation',
      'Opt-in consent mechanism screenshots and configuration documentation',
      'Privacy policy sections disclosing financial incentive programs',
      'Opt-out mechanism documentation and testing records',
      'Legal review confirming incentives are not unjust, coercive, or usurious',
    ],
    testProcedures: [
      'Review financial incentive program terms for required disclosures',
      'Verify opt-in consent is obtained before enrollment',
      'Test the opt-out mechanism to confirm consumers can withdraw without penalty',
      'Review the data valuation methodology for reasonableness',
      'Confirm financial incentive programs are disclosed in the privacy policy',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-7',
    name: 'Honoring Global Privacy Control',
    description:
      'Businesses must treat user-enabled Global Privacy Control (GPC) signals as a valid opt-out of sale/sharing request. The GPC signal must be processed automatically without requiring the consumer to take additional steps.',
    category: 'Business Obligations',
    implementationGuidance:
      'Implement server-side detection of the Global Privacy Control (GPC) HTTP header (Sec-GPC: 1) and JavaScript API (navigator.globalPrivacyControl). When a GPC signal is detected, automatically apply opt-out of sale/sharing for that browser or device. Suppress all sale and sharing activities, including third-party cookies, advertising pixels, and data broker transmissions, for users with GPC enabled. Do not display a pop-up requiring additional confirmation. Log GPC signal detection and the resulting opt-out actions. Ensure GPC is mentioned in the privacy policy as a supported opt-out mechanism.',
    evidenceRequirements: [
      'Technical implementation documentation for GPC signal detection (HTTP header and JS API)',
      'Configuration evidence showing GPC triggers opt-out of sale/sharing',
      'Logs demonstrating GPC signal detection and automatic opt-out application',
      'Privacy policy language describing GPC support',
      'Testing records showing GPC signal is honored without additional consumer action',
    ],
    testProcedures: [
      'Enable GPC in a browser and visit the website; verify the GPC signal is detected server-side',
      'Confirm that sale/sharing activities (third-party cookies, pixels) are suppressed when GPC is active',
      'Verify no additional consent pop-up or confirmation is displayed for GPC users',
      'Review server logs to confirm GPC signals are logged and opt-out actions are recorded',
      'Test with GPC disabled and verify sale/sharing activities resume normally',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-8',
    name: 'Data Minimization (CPRA)',
    description:
      'Under CPRA, a business\'s collection, use, retention, and sharing of personal information must be reasonably necessary and proportionate to achieve the purposes for which the PI was collected or processed, or for another disclosed compatible purpose.',
    category: 'Business Obligations',
    implementationGuidance:
      'Conduct a data minimization review across all PI collection points and processing activities. For each data element collected, document the specific purpose it serves and evaluate whether it is reasonably necessary and proportionate. Eliminate collection of unnecessary data fields. Implement technical controls to prevent collection of PI beyond what is specified in the Notice at Collection. Establish a data minimization review process for new projects, features, and system implementations (privacy by design). Train product and engineering teams on data minimization principles.',
    evidenceRequirements: [
      'Data minimization assessment report for existing collection points',
      'Justification documentation for each PI data element collected',
      'Privacy by design review procedures for new projects and features',
      'Evidence of unnecessary data field elimination',
      'Training records for product and engineering teams on data minimization',
      'Periodic review schedule for ongoing minimization compliance',
    ],
    testProcedures: [
      'Review the data minimization assessment for thoroughness across all collection points',
      'Verify justification documentation exists for each PI element collected',
      'Test a sample of data collection forms to confirm only necessary fields are present',
      'Review new project/feature documentation for privacy by design reviews',
      'Confirm that identified unnecessary data fields have been eliminated',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-9',
    name: 'Purpose Limitation (CPRA)',
    description:
      'Under CPRA, personal information collected for a specified purpose shall not be further processed in a manner that is incompatible with that purpose. If a business intends to use PI for a new, incompatible purpose, it must provide notice and, where required, obtain consent.',
    category: 'Business Obligations',
    implementationGuidance:
      'Establish a purpose limitation framework that links each PI element to its declared collection purpose(s). Implement technical and procedural controls to prevent use of PI for incompatible purposes. Define criteria for evaluating purpose compatibility (relationship to original purpose, consumer expectations, nature of the PI, consequences for the consumer). Require a purpose compatibility assessment before any new use of existing PI. If a new use is incompatible, implement a process to update the Notice at Collection and privacy policy and obtain necessary consent before proceeding.',
    evidenceRequirements: [
      'Purpose limitation policy and framework documentation',
      'PI-to-purpose mapping for all data elements',
      'Purpose compatibility assessment template and completed assessments',
      'Technical controls preventing unauthorized secondary use of PI',
      'Consumer notification and consent records for new incompatible uses',
      'Training records on purpose limitation requirements',
    ],
    testProcedures: [
      'Review the purpose limitation framework for alignment with CPRA requirements',
      'Verify PI-to-purpose mappings are documented and current',
      'Review completed purpose compatibility assessments for rigor',
      'Test technical controls by attempting to use PI for an undeclared purpose',
      'Verify that new incompatible uses triggered consumer notification and consent',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-10',
    name: 'Storage Limitation (CPRA)',
    description:
      'Under CPRA, a business must not retain personal information for longer than is reasonably necessary for the disclosed purpose. The business must disclose retention periods or criteria for determining retention in the privacy policy.',
    category: 'Business Obligations',
    implementationGuidance:
      'Develop a data retention schedule that specifies retention periods for each category of PI based on the purpose of collection, legal requirements, and business necessity. Implement automated retention enforcement mechanisms (scheduled deletion jobs, archival processes, retention tags). Disclose retention periods or the criteria used to determine retention in the privacy policy and Notice at Collection. Conduct periodic reviews to ensure PI is deleted or de-identified when the retention period expires. Establish exception handling for legal holds and regulatory retention requirements.',
    evidenceRequirements: [
      'Data retention schedule mapping PI categories to retention periods with justification',
      'Automated retention enforcement configuration and job logs',
      'Privacy policy and Notice at Collection disclosures of retention periods',
      'Periodic review records confirming expired PI has been deleted or de-identified',
      'Legal hold procedures and active hold inventory',
      'Exception handling documentation for regulatory retention requirements',
    ],
    testProcedures: [
      'Review the data retention schedule for completeness across all PI categories',
      'Verify automated deletion/archival jobs are configured and running on schedule',
      'Confirm retention periods are disclosed in the privacy policy and Notice at Collection',
      'Query data stores for PI that has exceeded its retention period and verify it has been deleted',
      'Test the legal hold process to confirm it properly suspends automated deletion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-11',
    name: 'Sensitive Personal Information Processing',
    description:
      'Businesses processing sensitive personal information (SSN, financial account details, precise geolocation, racial/ethnic origin, religious beliefs, biometric data, health information, sex life/sexual orientation data, and contents of mail/email/texts) must provide enhanced protections and limit use to specified purposes unless consumer consent is obtained.',
    category: 'Business Obligations',
    implementationGuidance:
      'Identify and classify all sensitive PI processed by the business using the CPRA definition. Implement enhanced security controls for sensitive PI including stronger encryption, stricter access controls, enhanced logging, and segregated storage where feasible. Limit processing of sensitive PI to purposes explicitly authorized by the consumer or necessary to perform services. Provide the "Limit Use of Sensitive PI" link. Conduct data protection impact assessments for sensitive PI processing activities. Train employees who handle sensitive PI on enhanced handling requirements.',
    evidenceRequirements: [
      'Sensitive PI classification and inventory document',
      'Enhanced security controls documentation for sensitive PI (encryption, access, logging)',
      'Processing limitation procedures for sensitive PI',
      'Data protection impact assessments for sensitive PI processing',
      'Employee training records for sensitive PI handling',
      'Consent records where sensitive PI is processed beyond necessary purposes',
    ],
    testProcedures: [
      'Review the sensitive PI inventory for completeness against CPRA categories',
      'Verify enhanced encryption is applied to sensitive PI at rest and in transit',
      'Test access controls for sensitive PI data stores and confirm least privilege',
      'Review data protection impact assessments for sensitive PI processing activities',
      'Verify that processing of sensitive PI beyond necessary purposes requires consent',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-12',
    name: 'Children\'s Data Protections',
    description:
      'A business must not sell or share the personal information of consumers under 16 years of age unless the consumer (ages 13-16) or the parent/guardian (under 13) has affirmatively authorized (opted in to) the sale or sharing. Businesses with actual knowledge they are selling or sharing a minor\'s PI must comply with these requirements.',
    category: 'Business Obligations',
    implementationGuidance:
      'Implement age-gating mechanisms at data collection points where the audience may include minors. For known consumers under 16, default to no sale or sharing and implement an affirmative opt-in process. For consumers 13-16, obtain the minor\'s own affirmative authorization. For consumers under 13, obtain verifiable parental or guardian consent using an approved method (signed consent form, credit card verification, government ID, video conferencing). Maintain records of opt-in authorizations and parental consents. Train staff on children\'s data handling requirements. Conduct periodic reviews to ensure compliance.',
    evidenceRequirements: [
      'Age-gating mechanism documentation and implementation evidence',
      'Opt-in authorization procedures for minors aged 13-16',
      'Verifiable parental consent procedures for children under 13',
      'Records of opt-in authorizations and parental consents',
      'Training records for staff handling children\'s data',
      'Periodic compliance review records for children\'s data protections',
    ],
    testProcedures: [
      'Test the age-gating mechanism to verify it correctly identifies minors',
      'Verify that sale/sharing defaults to off for known minors',
      'Test the opt-in process for consumers aged 13-16',
      'Test the parental consent process for children under 13',
      'Review authorization and consent records for completeness and validity',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-13',
    name: 'Employee and B2B Data Rights',
    description:
      'Under CPRA, employees, job applicants, independent contractors, and business-to-business (B2B) contacts have the same consumer rights as general consumers, including the rights to know, delete, correct, and opt out. Businesses must provide notices and honor requests from these data subjects.',
    category: 'Business Obligations',
    implementationGuidance:
      'Extend all consumer rights processes (access, deletion, correction, opt-out) to cover employee, applicant, contractor, and B2B contact PI. Issue a workforce-specific Notice at Collection and update the privacy policy to address workforce and B2B data. Adapt request intake channels for internal use (HR portal, internal forms). Coordinate with HR, legal, and IT to ensure workforce PI is included in the data inventory. Address unique workforce data considerations such as legal retention requirements, employment law intersections, and benefits-related data.',
    evidenceRequirements: [
      'Workforce-specific Notice at Collection',
      'Privacy policy provisions covering employee, applicant, contractor, and B2B data',
      'Internal request intake channels for workforce data subjects (HR portal, forms)',
      'Data inventory sections covering workforce and B2B personal information',
      'Procedures addressing workforce-specific retention and legal requirements',
      'Training records for HR and recruiting staff on workforce data rights',
    ],
    testProcedures: [
      'Verify the workforce Notice at Collection is distributed to all employees and applicants',
      'Submit test employee and B2B access/deletion requests and verify processing',
      'Review the data inventory for completeness of workforce and B2B PI categories',
      'Confirm that workforce-specific legal retention requirements are honored during deletion requests',
      'Review HR staff training records on workforce data rights',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-14',
    name: 'Privacy Risk Assessment (CPRA)',
    description:
      'Under CPRA, businesses whose processing of personal information presents significant risk to consumer privacy or security must conduct regular privacy risk assessments (cybersecurity audits) and submit them to the California Privacy Protection Agency on a regular basis.',
    category: 'Business Obligations',
    implementationGuidance:
      'Establish a privacy risk assessment program that identifies processing activities presenting significant risk to consumer privacy or security. Conduct assessments that weigh the benefits of processing against the risks to consumers, considering: the nature and extent of processing, the purpose, the sensitivity of PI, the potential harm, and safeguards in place. Document findings, risk ratings, and mitigation measures. Obtain executive sign-off on assessments. Submit assessments to the CPPA as required by regulation. Update assessments when processing activities change materially.',
    evidenceRequirements: [
      'Privacy risk assessment methodology and criteria documentation',
      'Completed privacy risk assessments for high-risk processing activities',
      'Risk rating and mitigation measure documentation',
      'Executive sign-off on completed assessments',
      'Submission records to the California Privacy Protection Agency (when required)',
      'Schedule for periodic reassessment and trigger events for ad-hoc assessments',
    ],
    testProcedures: [
      'Review the privacy risk assessment methodology for alignment with CPRA requirements',
      'Verify assessments have been completed for all identified high-risk processing activities',
      'Review risk ratings and mitigation measures for appropriateness',
      'Confirm executive sign-off has been obtained on all completed assessments',
      'Verify assessments are updated when processing activities change',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-15',
    name: 'Annual Cybersecurity Audits (CPRA)',
    description:
      'Under CPRA, businesses whose processing presents significant risk to consumer privacy or security must perform annual cybersecurity audits. The scope and requirements of these audits will be defined by regulations from the California Privacy Protection Agency.',
    category: 'Business Obligations',
    implementationGuidance:
      'Establish an annual cybersecurity audit program that evaluates the effectiveness of security controls protecting personal information. Engage qualified independent auditors or maintain an internal audit function with appropriate independence and expertise. Define the audit scope to cover all systems, processes, and controls involved in PI processing. Conduct the audit at least annually and address findings through a remediation plan with tracked timelines. Retain audit reports and remediation evidence for regulatory review. Monitor CPPA rulemaking for specific audit requirements and adjust the program accordingly.',
    evidenceRequirements: [
      'Annual cybersecurity audit program charter and scope definition',
      'Auditor qualifications and independence documentation',
      'Completed annual cybersecurity audit reports',
      'Findings and remediation plan with status tracking',
      'Management response and sign-off on audit results',
      'Evidence of monitoring CPPA rulemaking for updated audit requirements',
    ],
    testProcedures: [
      'Review the cybersecurity audit program charter for scope and independence requirements',
      'Verify an audit has been completed within the last 12 months',
      'Review audit findings and confirm remediation plans are in place with defined timelines',
      'Verify management has reviewed and signed off on audit results',
      'Confirm remediation actions are tracked to completion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-16',
    name: 'Response Verification Procedures',
    description:
      'Businesses must establish, document, and comply with verification procedures for consumer requests. The level of verification must be appropriate to the type of request and the sensitivity of the information involved. Businesses must not require consumers to create an account for verification purposes.',
    category: 'Business Obligations',
    implementationGuidance:
      'Develop a tiered verification framework: (1) for categories-level requests (Right to Know categories), use reasonable degree of certainty (match at least two data points); (2) for specific-pieces requests, use reasonably high degree of certainty (match at least three data points plus a signed declaration under penalty of perjury); (3) for deletion requests, use reasonable or reasonably high certainty depending on sensitivity. Define acceptable verification data points (email, phone, account number, transaction history, government ID). Implement procedures for when verification fails (denial with explanation). Do not require account creation solely for verification. Document all verification decisions.',
    evidenceRequirements: [
      'Tiered verification framework documentation',
      'Acceptable verification data points and matching criteria',
      'Verification process workflow diagrams',
      'Sample verification records showing decision-making and outcomes',
      'Verification failure handling procedures',
      'Declaration under penalty of perjury template for specific-pieces requests',
    ],
    testProcedures: [
      'Review the verification framework for alignment with CCPA/CPRA regulations',
      'Test each verification tier by submitting requests at different sensitivity levels',
      'Verify that specific-pieces requests require a signed declaration under penalty of perjury',
      'Confirm that account creation is not required for verification',
      'Test the verification failure process and verify consumers receive an explanation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BO-17',
    name: 'Authorized Agent Procedures',
    description:
      'Consumers may designate an authorized agent to submit CCPA requests on their behalf. The business may require the authorized agent to provide proof of authorization (power of attorney or signed permission) and may require the consumer to verify their own identity directly with the business.',
    category: 'Business Obligations',
    implementationGuidance:
      'Establish procedures for processing consumer rights requests submitted by authorized agents. Accept authorized agent requests through the same channels as direct consumer requests. Define acceptable proof of authorization: (1) a power of attorney under California Probate Code sections 4000-4465, or (2) a signed written permission from the consumer plus direct consumer identity verification. Implement processes to verify the agent\'s authority, verify the consumer\'s identity (when not using power of attorney), and fulfill the request. Train staff on authorized agent processing. Maintain records of agent authorizations.',
    evidenceRequirements: [
      'Authorized agent processing procedures documentation',
      'Acceptable proof of authorization criteria (power of attorney, signed permission)',
      'Agent authorization verification workflow',
      'Consumer identity verification procedures for agent requests',
      'Training records for staff on authorized agent processing',
      'Sample completed authorized agent requests with authorization records',
    ],
    testProcedures: [
      'Submit a test request via authorized agent with signed permission and verify processing',
      'Submit a test request via authorized agent with power of attorney and verify processing',
      'Verify the business contacts the consumer directly for identity verification (non-POA requests)',
      'Test rejection of an agent request lacking proper authorization',
      'Review training records for staff involved in agent request processing',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // PRIVACY GOVERNANCE
  // ============================================================
  {
    controlId: 'CCPA-PG-1',
    name: 'Privacy Program Governance',
    description:
      'Establish a formal privacy program governance structure with defined roles, responsibilities, reporting lines, and accountability for CCPA/CPRA compliance. The governance structure should include executive sponsorship, a designated privacy officer, and clear escalation paths.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Create a privacy governance charter that defines the privacy program scope, objectives, and authority. Designate a Privacy Officer or Chief Privacy Officer with responsibility for CCPA/CPRA compliance. Establish a privacy steering committee or working group with representatives from legal, IT, security, HR, marketing, and business units. Define reporting cadence to executive leadership and the board. Document decision-making authority and escalation procedures for privacy matters.',
    evidenceRequirements: [
      'Privacy governance charter with defined scope and objectives',
      'Privacy Officer designation letter and job description',
      'Privacy steering committee charter and membership roster',
      'Organizational chart showing privacy reporting structure',
      'Meeting minutes from privacy steering committee sessions',
      'Executive and board privacy reporting materials',
    ],
    testProcedures: [
      'Review the privacy governance charter for completeness and executive approval',
      'Verify the Privacy Officer has appropriate authority and resources',
      'Confirm the privacy steering committee meets at defined intervals',
      'Review escalation procedures and test with a sample privacy issue',
      'Verify executive and board reporting occurs as scheduled',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-2',
    name: 'Privacy Policy Framework',
    description:
      'Develop and maintain a comprehensive set of privacy policies that govern the collection, use, retention, sharing, and protection of personal information in compliance with CCPA/CPRA requirements.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Create a privacy policy framework that includes: master privacy policy, data classification policy, data retention policy, consumer rights policy, vendor privacy requirements policy, incident response policy, and acceptable use policy. Ensure policies are approved by appropriate stakeholders (legal, privacy, executive). Implement a policy review cycle (at least annual). Communicate policies to all relevant staff and maintain acknowledgment records.',
    evidenceRequirements: [
      'Complete set of privacy policies covering all CCPA/CPRA requirements',
      'Policy approval records with stakeholder sign-off',
      'Policy version history and change logs',
      'Policy communication and distribution records',
      'Staff acknowledgment records for privacy policies',
      'Annual policy review schedule and completion records',
    ],
    testProcedures: [
      'Review privacy policies for coverage of all CCPA/CPRA requirements',
      'Verify policies have been approved by appropriate stakeholders',
      'Confirm policies have been reviewed within the last 12 months',
      'Sample staff acknowledgment records for completion',
      'Test staff awareness of key policy requirements through interviews',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-3',
    name: 'Privacy by Design',
    description:
      'Integrate privacy considerations into the design and development of new products, services, systems, and business processes from the outset, ensuring CCPA/CPRA compliance is built in rather than retrofitted.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Establish a privacy by design framework that requires privacy review at each stage of the development lifecycle. Create privacy design checklists covering data minimization, purpose limitation, consent requirements, consumer rights enablement, security controls, and retention management. Integrate privacy review gates into project management and change management processes. Train product managers, developers, and architects on privacy by design principles.',
    evidenceRequirements: [
      'Privacy by design framework documentation',
      'Privacy design checklists and templates',
      'Project management process documentation showing privacy gates',
      'Completed privacy design reviews for recent projects',
      'Training records for staff on privacy by design principles',
      'Evidence of privacy requirements in product specifications',
    ],
    testProcedures: [
      'Review the privacy by design framework for comprehensiveness',
      'Verify privacy gates are integrated into project management processes',
      'Sample recent projects and confirm privacy design reviews were completed',
      'Review training completion rates for relevant staff',
      'Interview developers and product managers on privacy by design awareness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-4',
    name: 'Privacy Impact Assessment',
    description:
      'Conduct privacy impact assessments (PIAs) for new or significantly changed processing activities that involve personal information to identify and mitigate privacy risks before implementation.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Develop a PIA methodology that evaluates: the nature, scope, and context of processing; the purposes and legal basis; data flows and recipients; privacy risks to consumers; and mitigation measures. Define triggers for when a PIA is required (new systems, new data collection, new third-party sharing, new purposes). Create PIA templates and guidance documents. Establish a review and approval process for completed PIAs. Track PIA findings and remediation to closure.',
    evidenceRequirements: [
      'Privacy Impact Assessment methodology documentation',
      'PIA trigger criteria and threshold definitions',
      'PIA templates and guidance documents',
      'Completed PIAs for applicable processing activities',
      'PIA review and approval records',
      'Findings tracking and remediation evidence',
    ],
    testProcedures: [
      'Review the PIA methodology for alignment with CCPA/CPRA requirements',
      'Verify PIA triggers are defined and integrated into change processes',
      'Sample completed PIAs for thoroughness and risk identification',
      'Confirm PIAs were completed before processing activities commenced',
      'Track sample PIA findings through remediation to closure',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-5',
    name: 'Privacy Compliance Monitoring',
    description:
      'Implement ongoing monitoring activities to ensure continued compliance with CCPA/CPRA requirements, identify compliance gaps, and drive continuous improvement of the privacy program.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Establish a privacy compliance monitoring program that includes: periodic control testing, metrics and KPI tracking, compliance dashboards, issue tracking and remediation, and trend analysis. Define monitoring frequency for key controls. Implement automated monitoring where feasible (consent rates, request response times, policy acknowledgments). Report monitoring results to the privacy steering committee and executive leadership.',
    evidenceRequirements: [
      'Privacy compliance monitoring program documentation',
      'Monitoring schedule and control testing procedures',
      'Privacy metrics and KPI definitions with targets',
      'Compliance dashboards and monitoring reports',
      'Issue tracking logs and remediation evidence',
      'Trend analysis reports showing program maturity over time',
    ],
    testProcedures: [
      'Review the monitoring program for coverage of key CCPA/CPRA controls',
      'Verify monitoring activities are performed at defined frequencies',
      'Review compliance dashboards for accuracy and completeness',
      'Sample issues and track through remediation process',
      'Confirm monitoring results are reported to appropriate stakeholders',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-6',
    name: 'Privacy Audit Program',
    description:
      'Conduct periodic internal and external audits of the privacy program to assess compliance with CCPA/CPRA requirements, identify weaknesses, and validate the effectiveness of privacy controls.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Develop a privacy audit program that includes: audit planning and risk assessment, audit scope and criteria, audit execution procedures, findings classification and reporting, and remediation tracking. Schedule internal privacy audits at least annually. Consider engaging external auditors periodically for independent assessment. Ensure auditors have appropriate independence and expertise. Report audit results to executive leadership and track findings to remediation.',
    evidenceRequirements: [
      'Privacy audit program charter and procedures',
      'Annual audit plan with scope and schedule',
      'Completed internal privacy audit reports',
      'External audit reports (if applicable)',
      'Audit findings and remediation tracking logs',
      'Management response and action plans for audit findings',
    ],
    testProcedures: [
      'Review the privacy audit program for comprehensiveness',
      'Verify audits have been conducted within the last 12 months',
      'Review audit findings for appropriate classification and prioritization',
      'Track sample audit findings through remediation to closure',
      'Confirm audit results were reported to executive leadership',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-7',
    name: 'Regulatory Change Management',
    description:
      'Monitor for changes to CCPA/CPRA regulations, California Privacy Protection Agency guidance, and related legal developments, and implement processes to assess and adapt to regulatory changes.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Establish a regulatory monitoring process that tracks: CPPA rulemaking activities, AG enforcement actions and guidance, court decisions affecting CCPA/CPRA interpretation, and related state and federal privacy legislation. Subscribe to legal updates and regulatory alerts. Conduct impact assessments when significant regulatory changes are identified. Update policies, procedures, and controls to reflect regulatory changes. Communicate changes to affected stakeholders.',
    evidenceRequirements: [
      'Regulatory monitoring procedures and responsibilities',
      'Sources monitored for regulatory changes',
      'Regulatory change log with identified changes',
      'Impact assessments for significant regulatory changes',
      'Evidence of policy and procedure updates in response to changes',
      'Communication records to affected stakeholders',
    ],
    testProcedures: [
      'Review the regulatory monitoring process for comprehensiveness',
      'Verify monitoring sources include CPPA, AG, and relevant legal resources',
      'Review the regulatory change log for recent entries',
      'Sample recent regulatory changes and verify impact assessments were completed',
      'Confirm policies and procedures were updated in response to changes',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-PG-8',
    name: 'Privacy Budget and Resources',
    description:
      'Allocate adequate budget and resources to support the privacy program, including staffing, technology, training, and external expertise necessary to achieve and maintain CCPA/CPRA compliance.',
    category: 'Privacy Governance',
    implementationGuidance:
      'Develop an annual privacy program budget that covers: personnel costs (privacy team, shared resources), technology investments (consent management, request automation, data discovery), training and awareness programs, external counsel and consultants, audit and assessment costs, and compliance tool subscriptions. Present budget requests to executive leadership with business justification. Track budget utilization and report variances. Adjust resources based on program needs and regulatory developments.',
    evidenceRequirements: [
      'Annual privacy program budget documentation',
      'Budget approval records from executive leadership',
      'Privacy team organizational structure and headcount',
      'Technology investment plans and implementations',
      'Budget utilization reports and variance analysis',
      'Resource adjustment documentation based on program needs',
    ],
    testProcedures: [
      'Review the privacy budget for coverage of key program elements',
      'Verify budget has been approved by executive leadership',
      'Confirm privacy team staffing is adequate for program scope',
      'Review budget utilization against plan',
      'Assess whether resources are sufficient to meet compliance obligations',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // DATA SECURITY
  // ============================================================
  {
    controlId: 'CCPA-DS-1',
    name: 'Information Security Program',
    description:
      'Establish and maintain a comprehensive information security program that protects personal information from unauthorized access, destruction, use, modification, or disclosure through appropriate administrative, technical, and physical safeguards.',
    category: 'Data Security',
    implementationGuidance:
      'Develop an information security program aligned with industry standards (NIST CSF, ISO 27001, CIS Controls). Define security policies covering access control, encryption, network security, endpoint protection, and incident response. Assign security responsibilities and ensure adequate staffing. Conduct regular risk assessments to identify threats to PI. Implement layered security controls and monitor their effectiveness.',
    evidenceRequirements: [
      'Information security program documentation',
      'Security policy suite covering key control areas',
      'Security organizational structure and role assignments',
      'Risk assessment reports identifying PI-related threats',
      'Security control implementation evidence',
      'Security program maturity assessment results',
    ],
    testProcedures: [
      'Review security program documentation for alignment with industry standards',
      'Verify security policies cover all key control areas',
      'Confirm security responsibilities are assigned and staffed',
      'Review risk assessment methodology and recent findings',
      'Test sample security controls for operational effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-2',
    name: 'Encryption of Personal Information',
    description:
      'Implement encryption for personal information at rest and in transit to protect against unauthorized access and support compliance with reasonable security requirements under CCPA.',
    category: 'Data Security',
    implementationGuidance:
      'Deploy encryption for all PI at rest using AES-256 or equivalent algorithms. Implement TLS 1.2 or higher for all data in transit. Manage encryption keys securely using a key management system with key rotation, access controls, and audit logging. Encrypt PI in databases, file systems, backups, and removable media. Monitor for unencrypted PI transmission or storage.',
    evidenceRequirements: [
      'Encryption policy and standards documentation',
      'At-rest encryption configuration evidence for databases and file systems',
      'TLS configuration evidence showing TLS 1.2+ enforcement',
      'Key management procedures and access controls',
      'Key rotation schedules and execution logs',
      'Monitoring reports for encryption compliance',
    ],
    testProcedures: [
      'Verify at-rest encryption is enabled on all systems storing PI',
      'Test TLS configuration using SSL scanning tools',
      'Review key management procedures for security and compliance',
      'Confirm key rotation occurs at defined intervals',
      'Scan for unencrypted PI in storage and transit',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-3',
    name: 'Access Control Management',
    description:
      'Implement access controls based on the principle of least privilege to ensure that only authorized personnel can access personal information, and only to the extent necessary for their job functions.',
    category: 'Data Security',
    implementationGuidance:
      'Implement role-based access control (RBAC) for all systems containing PI. Define access roles based on job functions and document role-to-permission mappings. Require manager approval for access requests. Conduct quarterly access reviews to identify and remove unnecessary access. Implement segregation of duties for sensitive functions. Log and monitor all access to PI.',
    evidenceRequirements: [
      'Access control policy documentation',
      'Role definitions and permission matrices',
      'Access request and approval workflows',
      'Quarterly access review reports',
      'Segregation of duties matrix',
      'Access logs and monitoring dashboards',
    ],
    testProcedures: [
      'Review access control policy for least privilege requirements',
      'Verify role-based access is implemented and documented',
      'Sample access requests and confirm approval workflows are followed',
      'Review quarterly access review reports for completeness',
      'Test access controls by attempting unauthorized access to PI',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-4',
    name: 'Multi-Factor Authentication',
    description:
      'Require multi-factor authentication (MFA) for access to systems and applications containing personal information to reduce the risk of unauthorized access from compromised credentials.',
    category: 'Data Security',
    implementationGuidance:
      'Implement MFA for all user access to systems containing PI, including remote access, administrative access, and access to sensitive PI. Support multiple MFA methods (authenticator apps, hardware tokens, biometrics). Require MFA re-authentication for sensitive operations. Monitor MFA enrollment rates and enforce compliance. Provide user guidance on MFA setup and use.',
    evidenceRequirements: [
      'MFA policy and requirements documentation',
      'MFA configuration evidence for PI-containing systems',
      'MFA enrollment rates and compliance reports',
      'User guidance and training materials for MFA',
      'Exception handling procedures for MFA',
      'MFA audit logs showing authentication events',
    ],
    testProcedures: [
      'Verify MFA is required for all access to systems with PI',
      'Test MFA enforcement by attempting access without second factor',
      'Review MFA enrollment rates against compliance targets',
      'Confirm MFA exception process requires documented approval',
      'Review MFA logs for anomalous authentication patterns',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-5',
    name: 'Vulnerability Management',
    description:
      'Implement a vulnerability management program to identify, assess, and remediate security vulnerabilities in systems that process or store personal information.',
    category: 'Data Security',
    implementationGuidance:
      'Conduct regular vulnerability scans of all systems containing PI (at least monthly for external-facing, quarterly for internal). Subscribe to vulnerability intelligence feeds relevant to your technology stack. Prioritize vulnerabilities based on risk, considering exploitability and PI exposure. Define remediation SLAs by severity (critical: 7 days, high: 30 days, medium: 90 days). Track vulnerabilities to closure and report metrics.',
    evidenceRequirements: [
      'Vulnerability management policy and procedures',
      'Vulnerability scanning schedule and tool configuration',
      'Vulnerability scan reports with findings',
      'Remediation SLAs by severity level',
      'Vulnerability tracking logs and closure evidence',
      'Vulnerability metrics and trend reports',
    ],
    testProcedures: [
      'Review vulnerability management policy for comprehensiveness',
      'Verify scans are conducted at required frequencies',
      'Sample vulnerabilities and track through remediation',
      'Confirm remediation meets defined SLAs',
      'Review vulnerability metrics for improvement trends',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-6',
    name: 'Penetration Testing',
    description:
      'Conduct periodic penetration testing of systems and applications that process or store personal information to identify security weaknesses that could be exploited to access PI.',
    category: 'Data Security',
    implementationGuidance:
      'Conduct penetration tests at least annually and after significant changes to PI-processing systems. Engage qualified third-party testers with appropriate expertise and certifications. Define test scope to include all systems accessing or storing PI. Test for common vulnerabilities (OWASP Top 10, authentication bypass, privilege escalation). Remediate findings based on severity. Re-test critical and high findings to confirm remediation.',
    evidenceRequirements: [
      'Penetration testing policy and schedule',
      'Tester qualifications and engagement letters',
      'Penetration test reports with findings',
      'Remediation plans and tracking logs',
      'Re-test reports confirming remediation effectiveness',
      'Executive summary reports for leadership',
    ],
    testProcedures: [
      'Verify penetration tests are conducted at least annually',
      'Review tester qualifications and scope documentation',
      'Examine penetration test findings and severity classifications',
      'Track sample findings through remediation and re-test',
      'Confirm critical and high findings are remediated promptly',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-7',
    name: 'Security Awareness Training',
    description:
      'Provide security awareness training to all employees and contractors who handle personal information to ensure they understand security policies, recognize threats, and follow secure practices.',
    category: 'Data Security',
    implementationGuidance:
      'Develop a security awareness program covering: phishing recognition, password security, social engineering, data handling procedures, incident reporting, and clean desk policies. Require training for all new hires within 30 days and annual refresher training. Include PI-specific modules for staff with access to consumer data. Conduct phishing simulations to test awareness. Track completion rates and address non-compliance.',
    evidenceRequirements: [
      'Security awareness training program documentation',
      'Training curriculum and materials',
      'Training completion records and rates',
      'Phishing simulation results and trends',
      'Non-compliance escalation procedures',
      'Training effectiveness assessments',
    ],
    testProcedures: [
      'Review training curriculum for coverage of key security topics',
      'Verify training completion rates meet organizational thresholds',
      'Review phishing simulation results for improvement trends',
      'Interview sample employees on security awareness topics',
      'Confirm non-compliant employees are addressed appropriately',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-8',
    name: 'Network Security Controls',
    description:
      'Implement network security controls to protect personal information from unauthorized network-based access, including firewalls, intrusion detection/prevention, and network segmentation.',
    category: 'Data Security',
    implementationGuidance:
      'Deploy firewalls to control traffic between network segments and at the perimeter. Implement network segmentation to isolate systems containing PI from general network traffic. Deploy intrusion detection/prevention systems (IDS/IPS) to monitor for malicious activity. Implement secure configurations for network devices. Monitor and log network traffic for anomalies. Conduct periodic reviews of firewall rules and network architecture.',
    evidenceRequirements: [
      'Network security architecture documentation',
      'Firewall rule sets and change management logs',
      'Network segmentation diagrams showing PI isolation',
      'IDS/IPS configuration and alert logs',
      'Network device hardening standards and compliance evidence',
      'Network traffic monitoring reports',
    ],
    testProcedures: [
      'Review network architecture for appropriate segmentation of PI',
      'Verify firewall rules follow least-privilege principles',
      'Test network segmentation by attempting cross-segment access',
      'Review IDS/IPS alerts for response and resolution',
      'Confirm network device configurations meet hardening standards',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-9',
    name: 'Endpoint Protection',
    description:
      'Implement endpoint protection controls on all devices that access or process personal information to prevent malware infections and unauthorized access.',
    category: 'Data Security',
    implementationGuidance:
      'Deploy endpoint protection platforms (EPP) with anti-malware, behavioral analysis, and exploit prevention on all endpoints accessing PI. Implement endpoint detection and response (EDR) for advanced threat detection. Enforce device encryption for laptops and mobile devices. Implement mobile device management (MDM) for company and BYOD devices accessing PI. Maintain current signature updates and patch levels.',
    evidenceRequirements: [
      'Endpoint protection policy and standards',
      'EPP deployment evidence and coverage reports',
      'EDR configuration and alert handling procedures',
      'Device encryption configuration evidence',
      'MDM enrollment and compliance reports',
      'Signature update and patch compliance reports',
    ],
    testProcedures: [
      'Verify EPP is deployed on all endpoints accessing PI',
      'Confirm EDR is configured and alerts are being monitored',
      'Test device encryption enforcement on sample devices',
      'Review MDM compliance for mobile devices accessing PI',
      'Verify signature updates are current across endpoints',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-DS-10',
    name: 'Security Logging and Monitoring',
    description:
      'Implement comprehensive security logging and monitoring for systems containing personal information to detect unauthorized access, security incidents, and policy violations.',
    category: 'Data Security',
    implementationGuidance:
      'Enable security logging on all systems accessing or storing PI, capturing authentication events, access attempts, privilege changes, and data exports. Aggregate logs in a centralized SIEM platform. Define monitoring use cases and alert thresholds for suspicious activity. Staff 24/7 monitoring or implement automated alerting for critical events. Retain logs for at least 12 months. Conduct periodic log reviews.',
    evidenceRequirements: [
      'Logging policy and standards documentation',
      'Log source inventory and configuration evidence',
      'SIEM configuration and monitoring dashboards',
      'Monitoring use cases and alert definitions',
      'Alert handling and escalation procedures',
      'Log retention configuration and compliance evidence',
    ],
    testProcedures: [
      'Verify logging is enabled on all systems with PI',
      'Confirm logs are aggregated in the SIEM platform',
      'Review monitoring use cases for coverage of key threats',
      'Test alert generation by simulating suspicious activity',
      'Verify log retention meets policy requirements',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // CONSUMER REQUEST PROCESSING
  // ============================================================
  {
    controlId: 'CCPA-RP-1',
    name: 'Request Intake Management',
    description:
      'Establish and maintain multiple channels for consumers to submit CCPA rights requests, ensuring accessibility, ease of use, and proper documentation of all requests received.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Implement at least two methods for consumers to submit requests: a toll-free telephone number and at minimum one other method (web form, email address, in-person). Ensure intake channels are prominently displayed and easy to find. Capture all required information at intake: consumer identity, request type, date received, and contact information. Issue immediate acknowledgment of receipt. Route requests to the appropriate processing team.',
    evidenceRequirements: [
      'Request intake channel documentation (web forms, toll-free numbers, email addresses)',
      'Channel accessibility and visibility evidence (screenshots, site maps)',
      'Intake form fields capturing required information',
      'Acknowledgment templates and delivery records',
      'Routing procedures and assignment rules',
      'Intake volume and channel utilization reports',
    ],
    testProcedures: [
      'Test each intake channel by submitting sample requests',
      'Verify acknowledgments are issued within required timeframes',
      'Confirm intake captures all information needed for processing',
      'Review routing procedures and test assignment logic',
      'Verify intake channels are accessible to users with disabilities',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-2',
    name: 'Request Tracking and Workflow',
    description:
      'Implement a request tracking system and workflow management process to ensure all consumer requests are processed completely, accurately, and within statutory timeframes.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Deploy a request tracking system (ticketing system, CRM, or dedicated privacy management platform) to manage the lifecycle of consumer requests. Configure workflow stages: intake, verification, processing, fulfillment, and closure. Implement SLA tracking with alerts for approaching deadlines. Assign clear ownership for each request. Generate status reports and dashboards for management visibility.',
    evidenceRequirements: [
      'Request tracking system configuration and documentation',
      'Workflow stage definitions and transition rules',
      'SLA configuration with 45-day primary deadline and extension rules',
      'Alert configuration for approaching deadlines',
      'Assignment rules and escalation procedures',
      'Status dashboards and management reports',
    ],
    testProcedures: [
      'Review request tracking system for complete lifecycle management',
      'Verify SLA tracking accurately calculates deadlines',
      'Test alert generation for approaching and exceeded deadlines',
      'Confirm escalation procedures are triggered appropriately',
      'Review management dashboards for accuracy and completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-3',
    name: 'Identity Verification for Requests',
    description:
      'Implement identity verification procedures to confirm the identity of consumers submitting requests, with verification rigor appropriate to the type of request and sensitivity of information involved.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Develop tiered verification procedures: basic verification (2+ data points) for categories-level requests, enhanced verification (3+ data points plus declaration under penalty of perjury) for specific-pieces requests. Define acceptable verification methods (account authentication, email/phone verification, knowledge-based questions, government ID). Prohibit requiring account creation solely for verification. Document all verification decisions and outcomes.',
    evidenceRequirements: [
      'Identity verification policy and procedures',
      'Verification tier definitions by request type',
      'Acceptable verification methods documentation',
      'Declaration under penalty of perjury templates',
      'Verification decision documentation and records',
      'Failed verification handling procedures',
    ],
    testProcedures: [
      'Review verification procedures for alignment with CCPA requirements',
      'Test each verification tier with sample requests',
      'Verify declaration requirements for specific-pieces requests',
      'Confirm account creation is not required for verification',
      'Test failed verification scenarios and consumer notification',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-4',
    name: 'Request Fulfillment Procedures',
    description:
      'Establish detailed procedures for fulfilling each type of consumer request (access, deletion, correction, opt-out, limit use) to ensure consistent, complete, and compliant responses.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Document step-by-step fulfillment procedures for each request type. For access requests: query all systems for consumer PI, compile disclosure, deliver in portable format. For deletion: purge PI from all systems, notify service providers, document exceptions. For correction: update records across all systems, notify downstream recipients. For opt-out: apply preference to all sale/sharing activities. Include quality assurance checks before response delivery.',
    evidenceRequirements: [
      'Fulfillment procedures for each request type',
      'System query and data extraction documentation',
      'Response templates for each request type',
      'Service provider notification procedures',
      'Exception handling documentation',
      'Quality assurance checklists and review records',
    ],
    testProcedures: [
      'Review fulfillment procedures for completeness and accuracy',
      'Execute test requests through the full fulfillment workflow',
      'Verify responses include all required disclosure elements',
      'Confirm service provider notifications are sent for applicable requests',
      'Test quality assurance checkpoints are enforced',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-5',
    name: 'Response Timing Compliance',
    description:
      'Monitor and ensure compliance with CCPA response timing requirements, including the 45-day initial response deadline, the 45-day extension provision, and immediate processing for opt-out requests.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Configure request tracking to calculate and monitor response deadlines. Implement alerts at 30 days, 40 days, and deadline for each request. For extensions, send consumer notice before initial deadline explaining reason and new deadline. Process opt-out requests immediately without delay. Track and report on response timing metrics. Investigate and remediate any deadline misses.',
    evidenceRequirements: [
      'Response deadline calculation methodology',
      'Alert configuration at milestone intervals',
      'Extension notice templates and delivery records',
      'Opt-out processing SLA documentation',
      'Response timing metrics and trend reports',
      'Deadline miss investigation and remediation records',
    ],
    testProcedures: [
      'Verify deadline calculations are accurate for various scenarios',
      'Test alert generation at milestone intervals',
      'Review extension notices for proper content and timing',
      'Verify opt-out requests are processed immediately',
      'Analyze response timing metrics for compliance trends',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-6',
    name: 'Request Denial Procedures',
    description:
      'Establish procedures for denying consumer requests when applicable statutory exceptions or verification failures apply, ensuring proper documentation and consumer notification.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Document all circumstances under which requests may be denied (verification failure, statutory exceptions, manifestly unfounded/excessive requests). Require legal review for denial decisions on novel or complex scenarios. Develop denial response templates that explain the reason for denial, cite the applicable exception, and inform consumers of their right to contest. Maintain records of all denial decisions and rationale.',
    evidenceRequirements: [
      'Denial criteria and exception documentation',
      'Legal review procedures for denial decisions',
      'Denial response templates with required elements',
      'Denial decision records with documented rationale',
      'Consumer right to contest notification procedures',
      'Denial rate tracking and analysis reports',
    ],
    testProcedures: [
      'Review denial criteria for alignment with statutory exceptions',
      'Verify legal review occurs for applicable denial scenarios',
      'Review denial responses for required disclosure elements',
      'Confirm denial records include complete rationale documentation',
      'Analyze denial rates for patterns requiring investigation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-7',
    name: 'Portable Response Format',
    description:
      'Deliver consumer data in response to access requests in a portable, machine-readable format that allows the consumer to transmit the data to another entity without hindrance.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Define portable format standards for consumer data delivery (JSON, CSV, XML). Implement data export capabilities that generate properly structured files. Ensure exported data is organized logically with clear labels and minimal technical jargon. Provide secure delivery mechanisms (encrypted download links, secure portal access). Include documentation explaining the data format and contents.',
    evidenceRequirements: [
      'Portable format standards and specifications',
      'Data export capability documentation',
      'Sample exported files demonstrating format compliance',
      'Secure delivery mechanism documentation',
      'Consumer guidance for understanding exported data',
      'Format accessibility testing records',
    ],
    testProcedures: [
      'Review exported data formats for machine-readability',
      'Verify data can be imported into common applications',
      'Test secure delivery mechanisms for proper access controls',
      'Review consumer guidance for clarity and completeness',
      'Confirm data labels and organization support consumer understanding',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-8',
    name: 'Service Provider Request Coordination',
    description:
      'Coordinate consumer request fulfillment with service providers and contractors who process personal information on behalf of the business, ensuring timely and complete execution.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Maintain a service provider inventory identifying all vendors who may hold consumer PI. Establish communication channels and procedures for transmitting deletion, correction, and opt-out instructions to service providers. Define SLAs for service provider response. Track service provider acknowledgment and completion. Include service provider coordination requirements in contracts.',
    evidenceRequirements: [
      'Service provider inventory with PI processing scope',
      'Communication procedures and templates for request transmission',
      'Service provider SLAs for request handling',
      'Acknowledgment and completion tracking records',
      'Contractual provisions for request coordination',
      'Service provider compliance monitoring reports',
    ],
    testProcedures: [
      'Review service provider inventory for completeness',
      'Test communication procedures with sample service providers',
      'Verify service provider SLAs are defined and monitored',
      'Track sample requests through service provider fulfillment',
      'Review contracts for required request coordination provisions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-9',
    name: 'Household and Joint Account Requests',
    description:
      'Establish procedures for handling requests related to household accounts or joint accounts where multiple consumers share access to the same account or service.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Define procedures for verifying that a request relates to a household account and that the requestor has authority to make requests on behalf of the household. For deletion requests affecting multiple account holders, obtain consent from all household members or limit deletion to the requesting individual\'s data only. Document household determination criteria and consent requirements. Address scenarios where household members have conflicting preferences.',
    evidenceRequirements: [
      'Household and joint account handling procedures',
      'Household verification criteria and methods',
      'Multi-member consent requirements and templates',
      'Individual vs. household data segregation procedures',
      'Conflict resolution procedures for conflicting preferences',
      'Household request handling records',
    ],
    testProcedures: [
      'Review household handling procedures for clarity and compliance',
      'Test household verification process with sample scenarios',
      'Verify multi-member consent is obtained when required',
      'Confirm individual data can be segregated from household data',
      'Test conflict resolution procedures with competing requests',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RP-10',
    name: 'Request Quality Assurance',
    description:
      'Implement quality assurance processes to ensure consumer request responses are accurate, complete, and compliant before delivery to the consumer.',
    category: 'Consumer Request Processing',
    implementationGuidance:
      'Establish a QA review process for request responses before delivery. Define QA checkpoints: verification completeness, data accuracy, response completeness, format compliance, timing compliance, and proper delivery method. Sample requests for detailed QA review (100% for high-sensitivity, random sample for others). Document QA findings and implement corrective actions for identified issues. Track QA metrics to identify systemic problems.',
    evidenceRequirements: [
      'Quality assurance procedures and checklists',
      'QA sampling methodology and rates',
      'QA review records with findings',
      'Corrective action documentation',
      'QA metrics and trend reports',
      'Training materials for QA reviewers',
    ],
    testProcedures: [
      'Review QA procedures for coverage of key compliance elements',
      'Verify QA reviews are performed at required rates',
      'Examine QA findings for proper documentation',
      'Track corrective actions through resolution',
      'Analyze QA metrics for improvement trends',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // THIRD-PARTY MANAGEMENT
  // ============================================================
  {
    controlId: 'CCPA-TP-1',
    name: 'Third-Party Inventory and Classification',
    description:
      'Maintain a comprehensive inventory of all third parties who receive personal information, classified by their relationship type (service provider, contractor, third party) and the nature of PI sharing.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Create a centralized third-party inventory that captures: entity name, relationship type (service provider, contractor, third party), categories of PI shared, purpose of sharing, contractual basis, data flow direction, and review status. Classify relationships according to CCPA definitions. Update the inventory when new third-party relationships are established or existing ones change. Conduct periodic reconciliation with procurement and accounts payable records.',
    evidenceRequirements: [
      'Third-party inventory with all required data elements',
      'Classification criteria documentation',
      'Relationship type determination records',
      'Inventory update procedures and change logs',
      'Reconciliation reports with procurement records',
      'Periodic review and validation records',
    ],
    testProcedures: [
      'Review third-party inventory for completeness against financial records',
      'Verify classification criteria align with CCPA definitions',
      'Sample third parties and confirm accurate classification',
      'Confirm inventory update procedures are followed',
      'Verify periodic reconciliation is performed',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-2',
    name: 'Service Provider Contract Requirements',
    description:
      'Ensure all service provider agreements include CCPA-required contractual provisions that restrict processing to specified purposes and prohibit unauthorized use, retention, or disclosure of personal information.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Develop CCPA-compliant service provider contract language covering: specification of business purpose, prohibition on selling or sharing PI, prohibition on retention/use/disclosure outside the direct business relationship, compliance with CCPA obligations, cooperation with consumer requests, notification of subcontractor engagement, data security requirements, breach notification, audit rights, and certification of compliance understanding. Review and update existing agreements. Track contract remediation progress.',
    evidenceRequirements: [
      'CCPA service provider contract template',
      'Executed agreements with required provisions',
      'Contract inventory with compliance status',
      'Remediation tracker for non-compliant agreements',
      'Legal review records for contract language',
      'Contract renewal and update procedures',
    ],
    testProcedures: [
      'Review contract template for all required CCPA provisions',
      'Sample executed agreements and verify required provisions are included',
      'Verify remediation progress for non-compliant agreements',
      'Confirm contract renewal process includes CCPA review',
      'Test contract compliance monitoring procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-3',
    name: 'Contractor Agreement Requirements',
    description:
      'Ensure all contractor agreements include CCPA-required contractual provisions similar to service provider requirements, with appropriate restrictions on PI processing and use.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Apply CCPA contractor requirements to all entities that receive PI and meet the contractor definition. Contractor agreements must include the same restrictions as service provider agreements plus certification that the contractor understands the restrictions. Distinguish contractors from service providers based on the nature of the relationship and processing activities. Monitor contractor compliance with contractual restrictions.',
    evidenceRequirements: [
      'CCPA contractor contract template',
      'Contractor vs. service provider classification criteria',
      'Executed contractor agreements with required provisions',
      'Contractor certification records',
      'Contractor compliance monitoring records',
      'Contractor remediation tracker',
    ],
    testProcedures: [
      'Review contractor contract template for required provisions',
      'Verify classification criteria distinguish contractors from service providers',
      'Sample contractor agreements for required provisions',
      'Confirm contractor certifications are obtained',
      'Review contractor compliance monitoring results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-4',
    name: 'Third-Party Sale/Share Agreements',
    description:
      'For third parties to whom PI is sold or shared (not service providers or contractors), ensure appropriate agreements are in place and that the sale/sharing is disclosed to consumers with opt-out rights.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Identify all third-party relationships that constitute sale or sharing under CCPA. For each, document the categories of PI sold/shared, the consideration received (monetary or other valuable), and the third party\'s intended use. Ensure the relationship is disclosed in the privacy policy and Notice at Collection. Honor consumer opt-out requests by ceasing sale/sharing to opted-out consumers. Include contractual provisions requiring the third party to comply with CCPA.',
    evidenceRequirements: [
      'Sale/share relationship inventory',
      'Consideration documentation for each relationship',
      'Privacy policy and notice disclosures of sale/sharing',
      'Third-party agreements with CCPA provisions',
      'Opt-out suppression procedures for third parties',
      'Sale/share compliance monitoring records',
    ],
    testProcedures: [
      'Review sale/share inventory for completeness',
      'Verify consideration is documented for each relationship',
      'Confirm privacy disclosures accurately reflect sale/sharing practices',
      'Test opt-out propagation to third parties',
      'Review third-party agreements for required provisions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-5',
    name: 'Third-Party Due Diligence',
    description:
      'Conduct due diligence on third parties before sharing personal information to assess their privacy and security practices and ability to comply with CCPA requirements.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Establish a third-party due diligence process that evaluates: privacy program maturity, security controls and certifications, CCPA compliance capabilities, breach history, and references. Require due diligence before contract execution. Define risk-based due diligence tiers (enhanced for high-risk, standard for lower-risk). Document due diligence findings and approval decisions. Conduct periodic re-assessment for ongoing relationships.',
    evidenceRequirements: [
      'Third-party due diligence procedures',
      'Due diligence questionnaires and assessment criteria',
      'Completed due diligence assessments',
      'Risk tiering methodology and assignments',
      'Approval records for third-party engagements',
      'Re-assessment schedule and completion records',
    ],
    testProcedures: [
      'Review due diligence procedures for comprehensiveness',
      'Sample completed assessments for thoroughness',
      'Verify risk tiering is applied consistently',
      'Confirm due diligence is completed before contract execution',
      'Verify re-assessments are conducted at required intervals',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-6',
    name: 'Third-Party Compliance Monitoring',
    description:
      'Monitor third-party compliance with CCPA requirements and contractual obligations on an ongoing basis, including verification of PI handling practices and response to consumer requests.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Implement a third-party monitoring program that includes: periodic compliance certifications, audit rights exercise, incident and breach notification review, consumer request fulfillment verification, and security assessment review. Define monitoring frequency based on risk tier. Require third parties to notify the business of material changes affecting CCPA compliance. Document monitoring findings and track remediation of identified issues.',
    evidenceRequirements: [
      'Third-party monitoring program documentation',
      'Monitoring frequency by risk tier',
      'Compliance certification records',
      'Audit reports from third-party assessments',
      'Consumer request fulfillment verification records',
      'Issue tracking and remediation documentation',
    ],
    testProcedures: [
      'Review monitoring program for coverage of key compliance areas',
      'Verify monitoring frequency aligns with risk tier assignments',
      'Sample third-party certifications for completeness',
      'Review audit findings and remediation status',
      'Test consumer request fulfillment with sample third parties',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-7',
    name: 'Subprocessor Management',
    description:
      'Manage subprocessors (downstream vendors used by service providers and contractors) to ensure PI shared with subprocessors is protected and CCPA requirements flow down through the supply chain.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Require service providers and contractors to notify the business of subprocessor engagement. Maintain a subprocessor inventory. Require contractual flow-down of CCPA requirements to subprocessors. Reserve the right to approve or reject subprocessors. Include subprocessors in monitoring and audit activities. Require service providers to remain liable for subprocessor compliance.',
    evidenceRequirements: [
      'Subprocessor notification requirements in contracts',
      'Subprocessor inventory and approval records',
      'Flow-down contract provisions',
      'Subprocessor approval/rejection documentation',
      'Subprocessor monitoring and audit records',
      'Liability provisions for subprocessor actions',
    ],
    testProcedures: [
      'Review contracts for subprocessor notification requirements',
      'Verify subprocessor inventory is maintained and current',
      'Confirm flow-down provisions are included in subprocessor agreements',
      'Test subprocessor approval process',
      'Review subprocessor monitoring results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-8',
    name: 'Data Broker Relationship Management',
    description:
      'Manage relationships with data brokers, including ensuring proper disclosure of data broker purchases and compliance with opt-out requirements for data purchased from brokers.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Identify all data broker relationships where the business purchases or licenses consumer PI. Verify data brokers are registered with the California Attorney General as required. Ensure data broker agreements require the broker to honor opt-out requests and provide clean data (excluding opted-out consumers). Implement procedures to propagate business opt-out requests to data brokers. Disclose data broker relationships in the privacy policy.',
    evidenceRequirements: [
      'Data broker relationship inventory',
      'Data broker registration verification records',
      'Data broker agreement provisions for opt-out compliance',
      'Opt-out propagation procedures and records',
      'Privacy policy disclosure of data broker relationships',
      'Data quality verification procedures for broker data',
    ],
    testProcedures: [
      'Review data broker inventory for completeness',
      'Verify data broker registration status',
      'Review agreements for required opt-out provisions',
      'Test opt-out propagation to data brokers',
      'Confirm privacy policy discloses data broker relationships',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-9',
    name: 'Third-Party Termination Procedures',
    description:
      'Establish procedures for terminating third-party relationships that include secure return or destruction of personal information and verification of compliance with termination obligations.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Define third-party termination procedures that include: notification of termination, cessation of PI sharing, return or destruction of all PI held by the third party, certification of destruction, revocation of system access, and retention of records for post-termination disputes. Include termination provisions in all third-party agreements. Conduct post-termination verification to confirm PI has been returned or destroyed.',
    evidenceRequirements: [
      'Third-party termination procedures',
      'Termination provisions in contracts',
      'Termination notification records',
      'Return/destruction certification records',
      'Access revocation verification records',
      'Post-termination audit or verification records',
    ],
    testProcedures: [
      'Review termination procedures for completeness',
      'Verify contracts include required termination provisions',
      'Review sample termination records for compliance',
      'Confirm access revocation is verified after termination',
      'Test post-termination verification process',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TP-10',
    name: 'Cross-Context Behavioral Advertising Partners',
    description:
      'Manage relationships with advertising and marketing partners who receive personal information for cross-context behavioral advertising, ensuring compliance with CPRA sharing restrictions and opt-out requirements.',
    category: 'Third-Party Management',
    implementationGuidance:
      'Identify all partners receiving PI for cross-context behavioral advertising (ad networks, demand-side platforms, data management platforms). Classify these relationships as "sharing" under CPRA. Implement opt-out mechanisms including the "Do Not Sell or Share" link and GPC signal handling. Propagate opt-out preferences to all advertising partners in real-time. Include CCPA/CPRA compliance provisions in advertising partner agreements. Monitor partner compliance with opt-out instructions.',
    evidenceRequirements: [
      'Advertising partner inventory',
      'Sharing classification documentation',
      'Opt-out propagation technical architecture',
      'Real-time opt-out signal transmission logs',
      'Advertising partner agreement provisions',
      'Partner compliance monitoring records',
    ],
    testProcedures: [
      'Review advertising partner inventory for completeness',
      'Verify sharing classification for each partner',
      'Test opt-out propagation timing and completeness',
      'Confirm GPC signals are transmitted to all partners',
      'Review partner agreements for required provisions',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // SENSITIVE DATA HANDLING
  // ============================================================
  {
    controlId: 'CCPA-SD-1',
    name: 'Sensitive Personal Information Identification',
    description:
      'Identify and classify all sensitive personal information (SPI) processed by the business according to CPRA definitions, including SSN, financial accounts, precise geolocation, race/ethnicity, religion, biometrics, health data, sex life/orientation, and communication contents.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Conduct a comprehensive data discovery and classification exercise to identify all SPI within the organization. Create an SPI inventory that maps each SPI category to the systems where it is stored, the sources of collection, the purposes of processing, and the recipients. Implement data classification tags or labels for SPI in data catalogs and systems. Update the inventory when new SPI collection or processing is introduced.',
    evidenceRequirements: [
      'Sensitive PI classification criteria aligned with CPRA definitions',
      'SPI inventory with all required data elements',
      'Data discovery methodology and tools documentation',
      'System mapping showing SPI locations',
      'Data classification tag/label implementation evidence',
      'Inventory update procedures and change logs',
    ],
    testProcedures: [
      'Review classification criteria for alignment with CPRA SPI definitions',
      'Verify SPI inventory is comprehensive across all systems',
      'Sample systems and confirm SPI is correctly identified',
      'Verify classification tags are applied in data catalogs',
      'Test inventory update process with sample new SPI',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-2',
    name: 'Sensitive PI Use Limitation',
    description:
      'Limit the use and disclosure of sensitive personal information to purposes that are necessary to perform services or provide goods reasonably expected by the consumer, unless the consumer consents to additional uses.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Define "necessary" purposes for each category of SPI based on the services provided and consumer expectations. Document permissible use cases for each SPI type. Implement access controls and data use policies that restrict SPI processing to permissible purposes. Require explicit consent for any use beyond necessary purposes. Monitor for unauthorized SPI use through logging and audit. Provide the "Limit Use of Sensitive PI" option to consumers.',
    evidenceRequirements: [
      'Necessary purpose definitions for each SPI category',
      'Permissible use case documentation',
      'Access control configurations limiting SPI access',
      'Consent collection mechanisms for additional uses',
      'SPI use monitoring and audit logs',
      'Limit Use option implementation evidence',
    ],
    testProcedures: [
      'Review necessary purpose definitions for reasonableness',
      'Verify access controls restrict SPI to permissible purposes',
      'Test attempt to use SPI for non-permissible purpose',
      'Confirm consent is collected for uses beyond necessary purposes',
      'Review monitoring logs for unauthorized SPI use detection',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-3',
    name: 'Precise Geolocation Data Handling',
    description:
      'Implement specific controls for precise geolocation data, which is defined as any data derived from a device that identifies geographic location within 1,850 feet (approximately 0.35 miles or 564 meters).',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify all collection points for precise geolocation data (mobile apps, websites, IoT devices). Implement consent mechanisms that clearly disclose geolocation collection and obtain affirmative consent. Provide granular controls for consumers to enable/disable location tracking. Implement the right to limit use of geolocation data. Define and enforce retention limits for geolocation data. Apply enhanced security controls to geolocation data stores.',
    evidenceRequirements: [
      'Geolocation data collection inventory',
      'Consent mechanism documentation and screenshots',
      'Consumer control interfaces for location tracking',
      'Retention policy and enforcement for geolocation data',
      'Enhanced security controls documentation',
      'Geolocation data access logs',
    ],
    testProcedures: [
      'Review geolocation collection points for completeness',
      'Test consent mechanisms for clarity and functionality',
      'Verify consumers can disable location tracking',
      'Confirm retention limits are enforced',
      'Verify enhanced security controls are implemented',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-4',
    name: 'Biometric Information Handling',
    description:
      'Implement specific controls for biometric information including fingerprints, face geometry, voice prints, iris scans, and other physiological or biological characteristics used for identification.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify all biometric data collection and processing activities. Implement explicit consent mechanisms for biometric collection with clear disclosure of purpose and retention. Apply enhanced security controls including encryption and access restrictions. Define strict retention limits and implement secure deletion. Prohibit sale or sharing of biometric data. Conduct data protection impact assessments for biometric processing.',
    evidenceRequirements: [
      'Biometric data inventory and processing documentation',
      'Consent mechanisms with purpose and retention disclosure',
      'Enhanced security controls for biometric data',
      'Retention policy and secure deletion procedures',
      'Prohibition of sale/sharing in policies and contracts',
      'Data protection impact assessments for biometric processing',
    ],
    testProcedures: [
      'Review biometric data inventory for completeness',
      'Test consent mechanisms for required disclosures',
      'Verify enhanced security controls are operational',
      'Confirm retention limits and secure deletion',
      'Review contracts for sale/sharing prohibition',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-5',
    name: 'Health Information Handling',
    description:
      'Implement specific controls for health information that is not subject to HIPAA but is covered as sensitive PI under CPRA, including personal health conditions, treatments, and related data.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify all non-HIPAA health information processed by the business (consumer health apps, wellness programs, fitness tracking). Apply CPRA sensitive PI protections to this data. Implement enhanced consent for health data collection. Restrict use to purposes directly related to the service provided. Apply enhanced security controls and access restrictions. Honor consumer requests to limit use of health information.',
    evidenceRequirements: [
      'Non-HIPAA health information inventory',
      'HIPAA vs. CPRA applicability analysis',
      'Enhanced consent mechanisms for health data',
      'Use restriction policies and enforcement evidence',
      'Enhanced security controls documentation',
      'Limit use implementation for health data',
    ],
    testProcedures: [
      'Review health information inventory for completeness',
      'Verify HIPAA applicability has been analyzed',
      'Test enhanced consent mechanisms',
      'Confirm use restrictions are enforced',
      'Verify limit use requests are honored for health data',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-6',
    name: 'Financial Account Information Handling',
    description:
      'Implement specific controls for financial account information including account numbers, login credentials, and access codes that permit access to financial accounts.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify all financial account information collected and processed. Implement PCI DSS-aligned controls where applicable. Apply encryption and tokenization to financial account data. Implement strict access controls and monitoring. Define and enforce minimal retention periods. Prohibit unnecessary disclosure of financial account information. Conduct regular security assessments of financial data handling.',
    evidenceRequirements: [
      'Financial account information inventory',
      'Encryption and tokenization implementation evidence',
      'Access control configurations and logs',
      'Retention policy and enforcement for financial data',
      'Security assessment reports for financial data handling',
      'Disclosure restriction policies and enforcement',
    ],
    testProcedures: [
      'Review financial account data inventory for completeness',
      'Verify encryption and tokenization are implemented',
      'Test access controls for financial data',
      'Confirm retention limits are enforced',
      'Review security assessment findings and remediation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-7',
    name: 'Racial and Ethnic Origin Data Handling',
    description:
      'Implement specific controls for personal information revealing racial or ethnic origin, ensuring appropriate consent, use limitations, and protection from discriminatory use.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify all collection and processing of racial/ethnic origin data. Evaluate whether collection is necessary and implement data minimization. Where collection is required, implement explicit consent with clear purpose disclosure. Restrict use to specified, legitimate purposes. Implement safeguards against discriminatory use. Prohibit sale or sharing of this data category. Apply enhanced security and access controls.',
    evidenceRequirements: [
      'Racial/ethnic origin data inventory',
      'Data minimization assessment documentation',
      'Consent mechanisms with purpose disclosure',
      'Use restriction policies and enforcement',
      'Anti-discrimination safeguards documentation',
      'Sale/sharing prohibition in policies and contracts',
    ],
    testProcedures: [
      'Review racial/ethnic origin data inventory',
      'Verify data minimization has been applied',
      'Test consent mechanisms for proper disclosure',
      'Confirm use restrictions are enforced',
      'Review anti-discrimination safeguards',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-8',
    name: 'Religious and Philosophical Beliefs Data Handling',
    description:
      'Implement specific controls for personal information revealing religious or philosophical beliefs, ensuring appropriate consent, use limitations, and protection.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify all collection and processing of religious or philosophical belief data. Apply strict data minimization—collect only if genuinely necessary. Implement explicit consent with clear purpose disclosure. Restrict use to specified purposes only. Implement safeguards against discriminatory treatment. Apply enhanced security and access controls. Prohibit sale or sharing of this data.',
    evidenceRequirements: [
      'Religious/philosophical belief data inventory',
      'Data minimization assessment and justification',
      'Consent mechanisms with purpose disclosure',
      'Use restriction policies and enforcement',
      'Anti-discrimination safeguards documentation',
      'Enhanced security controls evidence',
    ],
    testProcedures: [
      'Review religious/philosophical belief data inventory',
      'Verify necessity justification for collection',
      'Test consent mechanisms for proper disclosure',
      'Confirm use restrictions are enforced',
      'Review security controls for this data category',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-9',
    name: 'Sex Life and Sexual Orientation Data Handling',
    description:
      'Implement specific controls for personal information concerning sex life or sexual orientation, ensuring highest levels of consent, protection, and use restriction.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify any collection or processing of sex life or sexual orientation data. Apply strictest data minimization—avoid collection unless absolutely necessary for the service. Where collection occurs, implement explicit opt-in consent with clear disclosure. Apply strictest use limitations. Implement robust safeguards against discriminatory use. Apply highest security standards. Absolutely prohibit sale or sharing.',
    evidenceRequirements: [
      'Sex life/sexual orientation data inventory (if any)',
      'Necessity justification and data minimization documentation',
      'Explicit opt-in consent mechanisms',
      'Strictest use limitation policies',
      'Anti-discrimination safeguards',
      'Highest-tier security controls evidence',
    ],
    testProcedures: [
      'Verify minimal or no collection of this data category',
      'Review necessity justification if collected',
      'Test explicit opt-in consent if applicable',
      'Confirm strictest use limitations are enforced',
      'Verify sale/sharing is absolutely prohibited',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-SD-10',
    name: 'Communications Content Data Handling',
    description:
      'Implement specific controls for the contents of consumer mail, email, and text messages where the business is not the intended recipient of the communication.',
    category: 'Sensitive Data Handling',
    implementationGuidance:
      'Identify any processing of communication contents where the business is not the intended recipient (e.g., email scanning, message archiving for third parties). Apply strict data minimization and necessity evaluation. Implement explicit consent disclosing the nature of access to communication contents. Restrict use to disclosed purposes only. Apply enhanced security including encryption. Prohibit sale or sharing of communication contents.',
    evidenceRequirements: [
      'Communication contents processing inventory',
      'Necessity evaluation documentation',
      'Explicit consent mechanisms with full disclosure',
      'Use restriction policies and enforcement',
      'Enhanced security controls including encryption',
      'Sale/sharing prohibition evidence',
    ],
    testProcedures: [
      'Review communication contents processing inventory',
      'Verify necessity evaluation has been conducted',
      'Test consent mechanisms for complete disclosure',
      'Confirm use restrictions are enforced',
      'Verify encryption and security controls',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // ADVERTISING AND MARKETING
  // ============================================================
  {
    controlId: 'CCPA-AM-1',
    name: 'Cross-Context Behavioral Advertising Compliance',
    description:
      'Ensure compliance with CPRA requirements for cross-context behavioral advertising, including disclosure, opt-out mechanisms, and honoring consumer preferences.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Identify all cross-context behavioral advertising activities (targeting based on consumer activity across different websites, apps, or services). Disclose cross-context behavioral advertising in the privacy policy and Notice at Collection. Implement the "Do Not Sell or Share" link covering sharing for advertising. Process opt-out requests immediately. Transmit opt-out signals to all advertising partners. Implement GPC signal recognition.',
    evidenceRequirements: [
      'Cross-context behavioral advertising activity inventory',
      'Privacy policy and notice disclosures',
      'Do Not Sell or Share link implementation',
      'Opt-out processing procedures and timing evidence',
      'Advertising partner signal transmission logs',
      'GPC implementation documentation',
    ],
    testProcedures: [
      'Review advertising activity inventory for completeness',
      'Verify disclosures accurately describe advertising practices',
      'Test Do Not Sell or Share link functionality',
      'Verify opt-out processing occurs immediately',
      'Test GPC signal recognition and honoring',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-2',
    name: 'Advertising Technology Inventory',
    description:
      'Maintain a comprehensive inventory of all advertising technologies deployed, including pixels, tags, SDKs, and tracking mechanisms that collect or share personal information.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Create an inventory of all advertising technologies across web properties, mobile apps, and other digital channels. Document for each technology: the vendor, data collected, data shared, purposes, and opt-out mechanisms. Implement tag management systems to maintain control over deployed technologies. Conduct periodic scans to identify unauthorized or unknown tracking technologies. Update the inventory when technologies are added or removed.',
    evidenceRequirements: [
      'Advertising technology inventory with all data elements',
      'Tag management system configuration',
      'Technology scan reports identifying deployed trackers',
      'Vendor documentation for each advertising technology',
      'Inventory update procedures and change logs',
      'Unauthorized technology remediation records',
    ],
    testProcedures: [
      'Review advertising technology inventory for completeness',
      'Conduct independent scan and compare to inventory',
      'Verify tag management system controls are operational',
      'Sample technologies and confirm documentation is accurate',
      'Test inventory update process with sample change',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-3',
    name: 'Cookie and Tracking Consent',
    description:
      'Implement cookie consent mechanisms that provide consumers with clear information and meaningful choice regarding tracking technologies used for advertising purposes.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Deploy a cookie consent management platform that presents clear categories of cookies (strictly necessary, functional, analytics, advertising). Provide granular controls allowing consumers to accept or reject categories. Do not deploy non-essential cookies until consent is obtained (where required). Implement persistent consent preferences across sessions. Allow consumers to modify preferences at any time. Integrate consent signals with advertising technology.',
    evidenceRequirements: [
      'Cookie consent platform configuration',
      'Cookie categorization documentation',
      'Consent banner/interface screenshots',
      'Consent preference storage mechanism',
      'Integration with advertising technology evidence',
      'Consent rate and preference analytics',
    ],
    testProcedures: [
      'Review cookie categorization for accuracy',
      'Test consent banner functionality and clarity',
      'Verify non-essential cookies are blocked until consent',
      'Test preference modification capabilities',
      'Confirm consent signals reach advertising systems',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-4',
    name: 'Do Not Sell or Share Link Implementation',
    description:
      'Implement a clear and conspicuous "Do Not Sell or Share My Personal Information" link on the homepage and any page where personal information is collected.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Place the "Do Not Sell or Share My Personal Information" link prominently in the website footer on all pages. The link must be clearly labeled and easily distinguishable. The link should lead to a mechanism for consumers to exercise their opt-out right without requiring account creation or login. Process opt-out requests immediately upon submission. The link may be combined with a "Limit Use of Sensitive Personal Information" link as an alternative compliance option.',
    evidenceRequirements: [
      'Screenshots showing link placement on homepage and collection pages',
      'Link visibility and prominence assessment',
      'Opt-out mechanism functionality documentation',
      'Processing timing evidence showing immediate execution',
      'Combined link implementation documentation (if applicable)',
      'Accessibility compliance for the link and mechanism',
    ],
    testProcedures: [
      'Verify link visibility on homepage and collection pages',
      'Test link functionality leads to working opt-out mechanism',
      'Verify opt-out can be exercised without account creation',
      'Confirm opt-out is processed immediately',
      'Test accessibility of link and opt-out mechanism',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-5',
    name: 'Opt-Out Preference Signal Handling',
    description:
      'Detect and honor opt-out preference signals including Global Privacy Control (GPC), treating them as valid opt-out requests for sale and sharing of personal information.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Implement server-side detection of GPC signals via the Sec-GPC HTTP header and navigator.globalPrivacyControl JavaScript API. When a GPC signal is detected, automatically apply opt-out of sale/sharing without requiring additional consumer action. Suppress advertising tracking and data sharing for GPC-enabled browsers. Log GPC signal detection and response. Ensure GPC handling is disclosed in the privacy policy.',
    evidenceRequirements: [
      'GPC signal detection implementation documentation',
      'Server-side and client-side detection code/configuration',
      'Automatic opt-out application evidence',
      'Logging of GPC signals and responses',
      'Privacy policy disclosure of GPC support',
      'Testing records showing GPC is honored',
    ],
    testProcedures: [
      'Test GPC detection using GPC-enabled browser',
      'Verify automatic opt-out application without additional steps',
      'Confirm advertising tracking is suppressed for GPC users',
      'Review GPC logging for accuracy',
      'Verify privacy policy includes GPC disclosure',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-6',
    name: 'Advertising Partner Data Agreements',
    description:
      'Ensure agreements with advertising partners include provisions for CCPA/CPRA compliance, including opt-out signal transmission, data use restrictions, and compliance certifications.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Review and update advertising partner agreements to include CCPA/CPRA provisions. Required terms include: obligation to honor opt-out signals transmitted by the business, prohibition on using PI for purposes beyond the advertising arrangement, data security requirements, breach notification obligations, cooperation with consumer requests, and representations of CCPA compliance. Maintain an inventory of advertising agreements with compliance status.',
    evidenceRequirements: [
      'CCPA-compliant advertising agreement template',
      'Executed agreements with required provisions',
      'Agreement inventory with compliance status',
      'Partner compliance certification records',
      'Remediation tracker for non-compliant agreements',
      'Periodic agreement review schedule and records',
    ],
    testProcedures: [
      'Review agreement template for required provisions',
      'Sample executed agreements for compliance',
      'Verify agreement inventory is current',
      'Confirm partner certifications are obtained',
      'Track remediation of non-compliant agreements',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-7',
    name: 'Retargeting and Remarketing Compliance',
    description:
      'Ensure retargeting and remarketing advertising practices comply with CCPA/CPRA requirements, including proper disclosure and opt-out mechanisms.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Identify all retargeting and remarketing programs that use consumer PI to deliver targeted advertising. Disclose retargeting practices in the privacy policy. Implement opt-out mechanisms that cease retargeting for opted-out consumers. Transmit opt-out signals to retargeting platform partners. Respect consumer opt-out preferences across all retargeting channels. Monitor retargeting platforms for continued compliance with opt-out instructions.',
    evidenceRequirements: [
      'Retargeting program inventory',
      'Privacy policy disclosure of retargeting',
      'Opt-out mechanism implementation for retargeting',
      'Signal transmission to retargeting platforms',
      'Opt-out preference enforcement evidence',
      'Platform compliance monitoring records',
    ],
    testProcedures: [
      'Review retargeting program inventory for completeness',
      'Verify privacy policy accurately discloses retargeting',
      'Test opt-out mechanism for retargeting',
      'Verify opt-out signals reach retargeting platforms',
      'Monitor for retargeting ads after opt-out to verify compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-8',
    name: 'Lookalike and Audience Modeling Compliance',
    description:
      'Ensure lookalike audience creation and audience modeling practices that use personal information comply with CCPA/CPRA requirements.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Identify all lookalike audience and audience modeling activities that involve sharing PI with advertising platforms. Disclose these practices in the privacy policy and Notice at Collection. Classify audience data sharing appropriately (sale or sharing under CCPA). Honor opt-out requests by excluding opted-out consumers from seed audiences. Implement procedures to refresh audiences excluding opted-out consumers.',
    evidenceRequirements: [
      'Lookalike and audience modeling activity inventory',
      'Privacy policy and notice disclosures',
      'Classification of audience data sharing',
      'Opt-out exclusion procedures for seed audiences',
      'Audience refresh procedures and records',
      'Platform compliance documentation',
    ],
    testProcedures: [
      'Review audience modeling inventory for completeness',
      'Verify disclosures are accurate',
      'Confirm classification aligns with CCPA definitions',
      'Test opt-out exclusion from seed audiences',
      'Verify audience refresh excludes opted-out consumers',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-9',
    name: 'Email Marketing Compliance',
    description:
      'Ensure email marketing practices comply with CCPA/CPRA requirements regarding PI collection, use, sharing, and consumer rights, in addition to CAN-SPAM requirements.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Disclose email marketing data practices in the privacy policy. Honor access and deletion requests for email marketing data. Provide clear unsubscribe mechanisms. If email addresses are sold or shared with third parties, disclose this practice and honor opt-out requests. Maintain suppression lists for opted-out consumers. Coordinate with email service providers on consumer request fulfillment.',
    evidenceRequirements: [
      'Email marketing data practice documentation',
      'Privacy policy email marketing disclosures',
      'Unsubscribe mechanism implementation',
      'Third-party email sharing disclosure (if applicable)',
      'Suppression list management procedures',
      'ESP coordination procedures for consumer requests',
    ],
    testProcedures: [
      'Review email marketing practices against privacy policy',
      'Test unsubscribe mechanism functionality',
      'Verify suppression list is maintained and honored',
      'Test consumer request fulfillment for email data',
      'Confirm ESP coordination procedures are working',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-AM-10',
    name: 'Mobile Advertising Identifier Handling',
    description:
      'Implement controls for mobile advertising identifiers (IDFA, GAID) in compliance with CCPA/CPRA requirements and platform-specific privacy frameworks.',
    category: 'Advertising and Marketing',
    implementationGuidance:
      'Identify all mobile apps that collect or use mobile advertising identifiers. Comply with platform requirements (Apple ATT, Google privacy policies) for advertising identifier access. Disclose mobile advertising practices in the privacy policy. Honor device-level opt-out settings for mobile advertising. Implement opt-out mechanisms in mobile apps. Coordinate with mobile advertising partners on opt-out signal transmission.',
    evidenceRequirements: [
      'Mobile app advertising identifier inventory',
      'Platform compliance documentation (ATT, Google)',
      'Privacy policy mobile advertising disclosures',
      'Device opt-out setting honoring evidence',
      'In-app opt-out mechanism implementation',
      'Partner coordination documentation',
    ],
    testProcedures: [
      'Review mobile advertising identifier inventory',
      'Verify platform compliance (ATT consent, etc.)',
      'Test device-level opt-out is honored',
      'Test in-app opt-out mechanism',
      'Verify partner coordination is operational',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // RECORDKEEPING AND REPORTING
  // ============================================================
  {
    controlId: 'CCPA-RR-1',
    name: 'Consumer Request Recordkeeping',
    description:
      'Maintain records of all consumer requests received, including request type, date received, response date, and outcome, for at least 24 months to demonstrate compliance.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement a records management system that captures: unique request identifier, request type (access, deletion, correction, opt-out, limit use), date received, verification method and outcome, response date, request outcome (fulfilled, denied with reason), and any extensions granted. Retain records for at least 24 months from request completion. Implement access controls to protect request records. Enable reporting on request volumes and metrics.',
    evidenceRequirements: [
      'Request recordkeeping system documentation',
      'Data elements captured for each request',
      'Retention configuration showing 24-month minimum',
      'Access controls for request records',
      'Sample request records demonstrating completeness',
      'Reporting capabilities documentation',
    ],
    testProcedures: [
      'Review recordkeeping system for required data elements',
      'Verify retention period meets 24-month minimum',
      'Test access controls for request records',
      'Sample request records for completeness',
      'Generate reports on request metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-2',
    name: 'Consumer Request Metrics Reporting',
    description:
      'Compile and disclose consumer request metrics in the privacy policy if the business collects PI from 10 million or more California consumers, as required by CCPA regulations.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'If the business meets the 10 million California consumer threshold, compile annual metrics including: number of requests to know (categories), number of requests to know (specific pieces), number of requests to delete, number of requests to opt-out, and for each type: number received, complied with in whole or in part, and denied. Calculate and report median response time. Disclose metrics in the privacy policy or linked annual report.',
    evidenceRequirements: [
      'California consumer count determination',
      'Annual request metrics compilation',
      'Metrics by request type (received, fulfilled, denied)',
      'Median response time calculations',
      'Privacy policy disclosure of metrics',
      'Historical metrics for trend analysis',
    ],
    testProcedures: [
      'Verify California consumer count determination',
      'Review metrics compilation for accuracy',
      'Confirm metrics are calculated by required categories',
      'Verify median response time calculation methodology',
      'Confirm metrics are disclosed as required',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-3',
    name: 'Privacy Policy Version Control',
    description:
      'Maintain version control and archives of privacy policies to demonstrate compliance over time and enable response to regulatory inquiries about historical practices.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement privacy policy version control that captures: effective date, revision date, version number, summary of changes, and approver. Maintain archives of all prior privacy policy versions with their effective date ranges. Store archived policies in a secure, accessible repository. Enable quick retrieval of the policy version effective on any given date. Document the change management process for privacy policy updates.',
    evidenceRequirements: [
      'Privacy policy version control system',
      'Archived privacy policy versions with effective dates',
      'Change log documenting revisions',
      'Approval records for policy updates',
      'Secure repository for policy archives',
      'Retrieval procedures for historical policies',
    ],
    testProcedures: [
      'Review version control system for completeness',
      'Verify archives include all policy versions',
      'Confirm change logs accurately describe revisions',
      'Test retrieval of policy effective on a specific date',
      'Review approval records for policy updates',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-4',
    name: 'Training Records Management',
    description:
      'Maintain records of privacy and data protection training provided to employees who handle consumer personal information or respond to consumer requests.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement a training records system that captures: employee name, training completed, completion date, training content/version, and assessment results (if applicable). Retain training records for the duration of employment plus a defined post-employment period. Generate reports on training completion rates and compliance. Enable identification of employees requiring training or refresher courses. Document the training curriculum and updates.',
    evidenceRequirements: [
      'Training records management system',
      'Individual training completion records',
      'Training curriculum documentation',
      'Completion rate reports by department/role',
      'Training refresher schedules and compliance',
      'Retention policy for training records',
    ],
    testProcedures: [
      'Review training records system for completeness',
      'Sample individual training records for accuracy',
      'Verify completion rates meet organizational targets',
      'Confirm refresher training is tracked and required',
      'Test reporting capabilities for training metrics',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-5',
    name: 'Third-Party Agreement Records',
    description:
      'Maintain records of all third-party agreements related to personal information processing, including service provider, contractor, and data sharing agreements.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement a contract management system that tracks: third party name, agreement type, effective date, expiration/renewal date, CCPA provisions included, PI categories covered, and compliance status. Retain agreements for the duration of the relationship plus a defined post-termination period. Enable quick retrieval of agreements and compliance status. Track agreement amendments and renewals. Generate reports on third-party compliance status.',
    evidenceRequirements: [
      'Contract management system documentation',
      'Agreement inventory with all data elements',
      'Executed agreements (copies or references)',
      'Amendment and renewal tracking',
      'Compliance status tracking',
      'Retention policy for agreements',
    ],
    testProcedures: [
      'Review contract management system for functionality',
      'Verify agreement inventory is complete',
      'Sample agreements and confirm copies are accessible',
      'Test compliance status tracking accuracy',
      'Generate third-party compliance reports',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-6',
    name: 'Consent Records Management',
    description:
      'Maintain records of consumer consents obtained, including the scope of consent, date obtained, method of collection, and any subsequent withdrawals.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement a consent management system that captures: consumer identifier, consent type/scope, date and time of consent, method of consent (click-through, written, verbal), consent version/language presented, and withdrawal records. Retain consent records for the period required to demonstrate compliance. Enable lookup of consent status for individual consumers. Generate reports on consent rates and withdrawals.',
    evidenceRequirements: [
      'Consent management system documentation',
      'Consent record data elements',
      'Sample consent records demonstrating completeness',
      'Withdrawal tracking and records',
      'Consent lookup functionality',
      'Consent analytics and reporting',
    ],
    testProcedures: [
      'Review consent management system for required elements',
      'Sample consent records for completeness',
      'Test consent lookup for individual consumers',
      'Verify withdrawal records are maintained',
      'Generate consent rate and trend reports',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-7',
    name: 'Data Inventory Documentation',
    description:
      'Maintain comprehensive documentation of the data inventory, including PI categories, sources, purposes, recipients, retention periods, and system locations.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Document the complete data inventory covering: PI categories collected, sources of collection, business purposes, categories of recipients, retention periods, and systems where PI is stored. Include data flow diagrams showing PI movement through the organization. Update documentation when collection practices change. Conduct periodic reviews to validate documentation accuracy. Store documentation in an accessible, version-controlled repository.',
    evidenceRequirements: [
      'Comprehensive data inventory documentation',
      'Data flow diagrams',
      'PI category to system mapping',
      'Retention period documentation',
      'Version control and update history',
      'Periodic review and validation records',
    ],
    testProcedures: [
      'Review data inventory for completeness',
      'Validate data flows against actual system architecture',
      'Verify PI category mappings are accurate',
      'Confirm retention periods are documented',
      'Review update history for currency',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-8',
    name: 'Incident and Breach Records',
    description:
      'Maintain records of privacy incidents and data breaches, including incident details, investigation findings, notification decisions, and remediation actions.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement an incident tracking system that captures: incident date, discovery date, description, PI involved, consumers affected, root cause analysis, notification determination and rationale, notifications sent, and remediation actions. Retain incident records for regulatory inquiry purposes. Enable reporting on incident trends and metrics. Document lessons learned and control improvements.',
    evidenceRequirements: [
      'Incident tracking system documentation',
      'Incident records with all required elements',
      'Root cause analysis documentation',
      'Notification decision records and rationale',
      'Remediation action tracking',
      'Incident trend and metrics reports',
    ],
    testProcedures: [
      'Review incident tracking system for completeness',
      'Sample incident records for required documentation',
      'Verify root cause analysis is conducted',
      'Confirm notification decisions are documented',
      'Track remediation actions to completion',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-9',
    name: 'Regulatory Correspondence Records',
    description:
      'Maintain records of all correspondence with regulators including the California Privacy Protection Agency, Attorney General, and any enforcement-related communications.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Establish a system for tracking regulatory correspondence including: correspondent (CPPA, AG, other), date received/sent, subject matter, response deadline, response provided, and resolution. Implement alerts for response deadlines. Retain correspondence for the required period. Escalate regulatory inquiries to appropriate stakeholders. Document internal discussions and decisions related to regulatory matters.',
    evidenceRequirements: [
      'Regulatory correspondence tracking system',
      'Correspondence records with all elements',
      'Response deadline tracking and alerts',
      'Response documentation and copies',
      'Escalation and decision records',
      'Retention policy for regulatory records',
    ],
    testProcedures: [
      'Review correspondence tracking system functionality',
      'Verify correspondence records are complete',
      'Test deadline alerting mechanisms',
      'Confirm responses are documented and retained',
      'Review escalation and decision documentation',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-RR-10',
    name: 'Audit Trail and Evidence Preservation',
    description:
      'Maintain comprehensive audit trails and preserve evidence of compliance activities to support regulatory examinations, litigation, and internal audits.',
    category: 'Recordkeeping and Reporting',
    implementationGuidance:
      'Implement audit logging for key compliance activities: consumer request processing, consent collection, opt-out signal handling, data access, and policy changes. Preserve audit logs in tamper-evident storage. Define retention periods aligned with regulatory requirements and statute of limitations. Implement legal hold procedures for litigation preservation. Enable audit log analysis and reporting.',
    evidenceRequirements: [
      'Audit logging configuration documentation',
      'Audit log samples demonstrating completeness',
      'Tamper-evident storage implementation',
      'Retention schedule for audit logs',
      'Legal hold procedures',
      'Audit log analysis and reporting capabilities',
    ],
    testProcedures: [
      'Review audit logging configuration for completeness',
      'Sample audit logs for required events',
      'Verify tamper-evident storage controls',
      'Confirm retention meets required periods',
      'Test legal hold procedures',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // BREACH RESPONSE
  // ============================================================
  {
    controlId: 'CCPA-BR-1',
    name: 'Breach Response Plan',
    description:
      'Maintain a comprehensive data breach response plan that addresses detection, containment, investigation, notification, and remediation of security incidents involving personal information.',
    category: 'Breach Response',
    implementationGuidance:
      'Develop a breach response plan covering: incident detection and reporting mechanisms, initial triage and severity assessment, containment and eradication procedures, forensic investigation processes, notification decision framework, consumer and regulatory notification procedures, remediation actions, and post-incident review. Assign clear roles and responsibilities for breach response. Review and update the plan at least annually. Conduct tabletop exercises to test the plan.',
    evidenceRequirements: [
      'Breach response plan documentation',
      'Roles and responsibilities matrix',
      'Severity classification criteria',
      'Notification decision framework',
      'Annual plan review records',
      'Tabletop exercise documentation',
    ],
    testProcedures: [
      'Review breach response plan for completeness',
      'Verify roles and responsibilities are assigned',
      'Review severity classification criteria',
      'Test notification decision framework with scenarios',
      'Confirm annual review has been conducted',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-2',
    name: 'Breach Detection Capabilities',
    description:
      'Implement technical and procedural capabilities to detect security incidents and potential data breaches involving personal information in a timely manner.',
    category: 'Breach Response',
    implementationGuidance:
      'Deploy security monitoring tools that can detect unauthorized access, data exfiltration, and anomalous activity involving PI. Implement intrusion detection systems, SIEM alerts, data loss prevention alerts, and user behavior analytics. Define alert thresholds and triage procedures. Establish 24/7 monitoring capability or on-call rotation. Train staff to recognize and report potential security incidents.',
    evidenceRequirements: [
      'Security monitoring tool inventory',
      'Alert configuration and thresholds',
      'Triage procedures documentation',
      'Monitoring coverage schedule (24/7 or on-call)',
      'Staff training on incident recognition',
      'Detection capability testing records',
    ],
    testProcedures: [
      'Review monitoring tools for coverage of PI systems',
      'Test alert generation with simulated incidents',
      'Verify triage procedures are followed',
      'Confirm monitoring coverage meets requirements',
      'Test staff awareness of incident reporting',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-3',
    name: 'Breach Containment Procedures',
    description:
      'Establish procedures for rapidly containing security incidents to prevent further unauthorized access to or exfiltration of personal information.',
    category: 'Breach Response',
    implementationGuidance:
      'Define containment procedures for common incident types: compromised credentials, malware infection, unauthorized access, data exfiltration, and system compromise. Procedures should include: isolating affected systems, revoking compromised credentials, blocking malicious network traffic, preserving forensic evidence, and implementing temporary security measures. Establish authority for containment decisions and emergency changes. Document containment actions taken.',
    evidenceRequirements: [
      'Containment procedures by incident type',
      'Authority matrix for containment decisions',
      'Emergency change procedures',
      'Forensic evidence preservation procedures',
      'Containment action documentation templates',
      'Containment effectiveness testing records',
    ],
    testProcedures: [
      'Review containment procedures for common incident types',
      'Verify authority matrix is clear and current',
      'Test emergency change procedures',
      'Confirm forensic preservation procedures are defined',
      'Conduct containment exercise and assess effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-4',
    name: 'Breach Investigation Process',
    description:
      'Establish a formal process for investigating security incidents to determine the scope of the breach, the personal information affected, and the root cause.',
    category: 'Breach Response',
    implementationGuidance:
      'Define investigation procedures including: evidence collection and chain of custody, forensic analysis processes, scope determination (systems, data, consumers affected), root cause analysis, and documentation requirements. Establish criteria for engaging external forensic investigators. Define investigation timelines and escalation triggers. Ensure investigation findings feed into notification decisions and remediation planning.',
    evidenceRequirements: [
      'Investigation procedures documentation',
      'Evidence handling and chain of custody procedures',
      'Forensic analysis capabilities',
      'External forensics engagement criteria',
      'Investigation timeline guidelines',
      'Sample investigation reports',
    ],
    testProcedures: [
      'Review investigation procedures for thoroughness',
      'Verify evidence handling procedures exist',
      'Confirm forensic capabilities are available',
      'Review external engagement criteria',
      'Examine sample investigation reports for completeness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-5',
    name: 'Breach Notification Assessment',
    description:
      'Implement a process for assessing whether a security incident triggers notification obligations under California Civil Code Section 1798.82 and determining the required notification scope and timing.',
    category: 'Breach Response',
    implementationGuidance:
      'Establish a notification assessment process that evaluates: whether PI was acquired by an unauthorized person, whether the breach involves categories triggering notification (unencrypted PI including name plus SSN, driver license, financial account, medical info, health insurance, or unique biometric data), the number of California residents affected, and whether encryption or other circumstances reduce notification obligation. Engage legal counsel in notification decisions. Document the assessment and decision rationale.',
    evidenceRequirements: [
      'Notification assessment procedures',
      'PI category analysis for notification triggers',
      'Threshold determination criteria',
      'Legal counsel engagement procedures',
      'Assessment documentation templates',
      'Historical notification decisions and rationale',
    ],
    testProcedures: [
      'Review notification assessment procedures',
      'Verify PI categories are accurately mapped to triggers',
      'Test assessment process with sample scenarios',
      'Confirm legal counsel engagement procedures',
      'Review documentation of past notification decisions',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-6',
    name: 'Consumer Breach Notification',
    description:
      'Implement procedures for notifying affected California consumers of a data breach in the most expedient time possible and without unreasonable delay, as required by law.',
    category: 'Breach Response',
    implementationGuidance:
      'Develop consumer notification procedures covering: notification timing (most expedient time possible, without unreasonable delay), content requirements (what happened, what information involved, what we are doing, what you can do, contact information), delivery methods (written, electronic, substitute notice for large breaches), and special provisions for breaches involving credentials. Prepare notification templates in advance. Establish vendor relationships for large-scale notification. Coordinate with AG for breaches affecting 500+ residents.',
    evidenceRequirements: [
      'Consumer notification procedures',
      'Notification content templates',
      'Delivery method options and thresholds',
      'Large-scale notification vendor contracts',
      'AG notification procedures',
      'Historical notification records',
    ],
    testProcedures: [
      'Review notification procedures for compliance',
      'Verify templates include required content',
      'Confirm delivery methods are operational',
      'Test large-scale notification capabilities',
      'Review AG notification procedures',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-7',
    name: 'Regulatory Breach Notification',
    description:
      'Implement procedures for notifying the California Attorney General when a breach affects more than 500 California residents, as required by California Civil Code Section 1798.82.',
    category: 'Breach Response',
    implementationGuidance:
      'Establish procedures for AG notification when breaches affect 500+ California residents. Submit notification electronically through the AG\'s designated submission system. Provide the same information sent to consumers. Submit notification concurrently with or before consumer notification. Maintain records of AG notifications. Monitor for AG follow-up inquiries and respond promptly.',
    evidenceRequirements: [
      'AG notification procedures',
      'AG submission system registration/access',
      'Notification content preparation procedures',
      'Timing coordination with consumer notification',
      'AG notification records',
      'Follow-up inquiry response procedures',
    ],
    testProcedures: [
      'Review AG notification procedures',
      'Verify access to AG submission system',
      'Review notification content requirements',
      'Confirm timing coordination procedures',
      'Review historical AG notification records',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-8',
    name: 'Third-Party Breach Coordination',
    description:
      'Establish procedures for coordinating with service providers and third parties when a breach occurs at a third party affecting the business\'s consumer personal information.',
    category: 'Breach Response',
    implementationGuidance:
      'Define third-party breach coordination procedures including: contractual notification requirements, information sharing protocols, joint investigation procedures, notification responsibility determination, and remediation coordination. Ensure contracts require timely breach notification. Establish communication channels with key third parties for incident response. Coordinate consumer notification when third-party breach affects the business\'s consumers.',
    evidenceRequirements: [
      'Third-party breach coordination procedures',
      'Contractual breach notification requirements',
      'Communication channel documentation',
      'Joint investigation protocols',
      'Notification responsibility matrix',
      'Third-party breach response records',
    ],
    testProcedures: [
      'Review coordination procedures for completeness',
      'Verify contracts include breach notification provisions',
      'Test communication channels with key third parties',
      'Review joint investigation protocols',
      'Examine records of past third-party breach coordination',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-9',
    name: 'Post-Breach Remediation',
    description:
      'Implement procedures for remediating vulnerabilities and control weaknesses identified during breach investigation to prevent similar incidents in the future.',
    category: 'Breach Response',
    implementationGuidance:
      'Establish remediation procedures that address root causes identified during investigation. Define remediation timelines based on severity. Assign accountability for remediation actions. Track remediation to completion. Conduct post-remediation testing to verify effectiveness. Update security controls, policies, and procedures based on lessons learned. Brief leadership on remediation status.',
    evidenceRequirements: [
      'Remediation procedures documentation',
      'Remediation timeline guidelines by severity',
      'Accountability assignment records',
      'Remediation tracking and completion records',
      'Post-remediation testing evidence',
      'Lessons learned documentation',
    ],
    testProcedures: [
      'Review remediation procedures for thoroughness',
      'Verify remediation timelines are defined',
      'Confirm accountability is assigned for past incidents',
      'Track remediation completion rates',
      'Review post-remediation testing results',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-BR-10',
    name: 'Post-Incident Review',
    description:
      'Conduct formal post-incident reviews following significant security incidents to identify lessons learned and improve the breach response process.',
    category: 'Breach Response',
    implementationGuidance:
      'Establish a post-incident review process for significant incidents. Conduct reviews within a defined timeframe after incident closure. Include all stakeholders involved in the response. Document what went well, what could be improved, and specific action items. Update the breach response plan based on findings. Share lessons learned with relevant teams. Track action items to completion.',
    evidenceRequirements: [
      'Post-incident review procedures',
      'Review timeline requirements',
      'Stakeholder participation records',
      'Lessons learned documentation',
      'Breach response plan updates',
      'Action item tracking to completion',
    ],
    testProcedures: [
      'Review post-incident review procedures',
      'Verify reviews are conducted for significant incidents',
      'Confirm stakeholder participation',
      'Review lessons learned documentation',
      'Track action items from reviews to completion',
    ],
    status: 'Not Started',
  },

  // ============================================================
  // TRAINING AND AWARENESS
  // ============================================================
  {
    controlId: 'CCPA-TA-1',
    name: 'CCPA Awareness Training Program',
    description:
      'Develop and maintain a comprehensive CCPA/CPRA awareness training program for all employees who handle personal information or are involved in privacy-related activities.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Create a CCPA training program covering: overview of CCPA/CPRA requirements, consumer rights and how to recognize requests, PI definition and categories, sensitive PI requirements, data handling obligations, non-discrimination requirements, and incident reporting. Require training for all relevant employees within 30 days of hire. Require annual refresher training. Track completion and address non-compliance. Update content when regulations change.',
    evidenceRequirements: [
      'CCPA training program documentation',
      'Training curriculum and content',
      'New hire training requirements and timelines',
      'Annual refresher training schedule',
      'Training completion records and rates',
      'Content update procedures and history',
    ],
    testProcedures: [
      'Review training program for comprehensive coverage',
      'Verify training content is current with regulations',
      'Confirm new hire training timelines are met',
      'Review annual refresher completion rates',
      'Test employee knowledge through interviews or assessments',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-2',
    name: 'Consumer Request Handling Training',
    description:
      'Provide specialized training for employees responsible for processing consumer rights requests to ensure accurate and timely request fulfillment.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Develop specialized training for request handling staff covering: request types and their requirements, intake and acknowledgment procedures, identity verification methods, system access and data retrieval, response preparation and quality review, timing requirements and extension procedures, denial criteria and procedures, and authorized agent handling. Include hands-on exercises with sample requests. Require certification before handling live requests.',
    evidenceRequirements: [
      'Request handling training curriculum',
      'Hands-on exercise materials',
      'Certification requirements and records',
      'Training completion records for request handlers',
      'Competency assessment results',
      'Ongoing training update schedule',
    ],
    testProcedures: [
      'Review training curriculum for completeness',
      'Verify hands-on exercises cover key scenarios',
      'Confirm certification requirements are enforced',
      'Review competency assessment results',
      'Test request handler knowledge through practical exercises',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-3',
    name: 'Privacy by Design Training',
    description:
      'Train product managers, developers, and architects on privacy by design principles to ensure CCPA/CPRA compliance is built into new products, features, and systems.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Develop privacy by design training for product and technology teams covering: CCPA/CPRA requirements relevant to product design, data minimization principles, purpose limitation requirements, consumer rights enablement, consent and notice implementation, secure development practices, and privacy impact assessment processes. Integrate training into onboarding for relevant roles. Provide periodic refresher training.',
    evidenceRequirements: [
      'Privacy by design training curriculum',
      'Role-specific training requirements',
      'Training completion records by role',
      'Practical examples and case studies',
      'Integration with onboarding processes',
      'Refresher training schedule and completion',
    ],
    testProcedures: [
      'Review training curriculum for comprehensiveness',
      'Verify role-specific training assignments',
      'Confirm training is integrated into onboarding',
      'Review completion rates for relevant roles',
      'Assess knowledge through project review samples',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-4',
    name: 'Customer Service Privacy Training',
    description:
      'Train customer service representatives on CCPA/CPRA consumer rights to ensure they can recognize and properly route consumer requests and avoid discrimination.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Develop customer service privacy training covering: recognition of consumer rights requests (access, deletion, opt-out, correction), proper intake and routing procedures, non-discrimination requirements, what information can and cannot be disclosed, escalation procedures for complex requests, and handling of complaints related to privacy. Include scripts and job aids. Require training before handling consumer interactions.',
    evidenceRequirements: [
      'Customer service privacy training curriculum',
      'Scripts and job aids for request handling',
      'Training completion records for CS staff',
      'Non-discrimination training verification',
      'Escalation procedure training',
      'Quality monitoring for privacy-related interactions',
    ],
    testProcedures: [
      'Review training curriculum for customer service',
      'Verify scripts and job aids are available',
      'Confirm training completion before consumer contact',
      'Review quality monitoring results for privacy topics',
      'Test recognition of consumer requests through scenarios',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-5',
    name: 'Marketing and Sales Privacy Training',
    description:
      'Train marketing and sales personnel on CCPA/CPRA requirements related to data collection, consent, opt-out handling, and advertising practices.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Develop marketing and sales privacy training covering: consent requirements for marketing communications, opt-out handling and suppression lists, advertising technology and tracking compliance, cross-context behavioral advertising restrictions, data minimization in marketing campaigns, third-party data use requirements, and financial incentive program rules. Include practical examples relevant to marketing activities.',
    evidenceRequirements: [
      'Marketing/sales privacy training curriculum',
      'Practical examples and case studies',
      'Training completion records',
      'Consent and opt-out handling verification',
      'Advertising compliance training materials',
      'Campaign review procedures training',
    ],
    testProcedures: [
      'Review training curriculum for marketing/sales relevance',
      'Verify practical examples are included',
      'Confirm training completion for marketing staff',
      'Test knowledge of consent and opt-out requirements',
      'Review campaign procedures for privacy compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-6',
    name: 'IT and Security Privacy Training',
    description:
      'Train IT and security personnel on CCPA/CPRA requirements related to data security, breach response, and technical implementation of privacy controls.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Develop IT and security privacy training covering: reasonable security requirements under CCPA, data protection impact of security controls, breach detection and response procedures, technical implementation of consumer rights (deletion, access, opt-out), data inventory and classification requirements, encryption and access control requirements, and logging and monitoring for compliance. Include technical implementation guidance.',
    evidenceRequirements: [
      'IT/security privacy training curriculum',
      'Technical implementation guidance',
      'Training completion records for IT/security staff',
      'Breach response role-specific training',
      'Technical controls training materials',
      'Competency verification records',
    ],
    testProcedures: [
      'Review training curriculum for technical relevance',
      'Verify technical implementation guidance is included',
      'Confirm training completion for IT/security staff',
      'Test breach response knowledge through exercises',
      'Review technical controls implementation for training effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-7',
    name: 'HR and Recruiting Privacy Training',
    description:
      'Train HR and recruiting personnel on CCPA/CPRA requirements applicable to employee and applicant personal information.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Develop HR-specific privacy training covering: CPRA extension of rights to employees and applicants, workforce Notice at Collection requirements, handling of employee/applicant rights requests, coordination with legal for employment law intersections, retention requirements for employment records, background check compliance, and benefits-related data handling. Address unique considerations for workforce data.',
    evidenceRequirements: [
      'HR/recruiting privacy training curriculum',
      'Workforce-specific compliance guidance',
      'Training completion records for HR staff',
      'Employee rights request handling training',
      'Background check compliance training',
      'Benefits data handling training',
    ],
    testProcedures: [
      'Review training curriculum for HR relevance',
      'Verify workforce-specific guidance is included',
      'Confirm training completion for HR staff',
      'Test knowledge of employee rights handling',
      'Review HR procedures for training effectiveness',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-8',
    name: 'Executive and Board Privacy Briefings',
    description:
      'Provide regular privacy briefings to executive leadership and the board of directors on CCPA/CPRA compliance status, risks, and strategic privacy matters.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Establish a cadence for privacy briefings to executive leadership (quarterly) and the board (at least annually). Briefing content should include: compliance program status, key metrics (requests, response times, incidents), regulatory developments and their implications, privacy risks and mitigation status, budget and resource needs, and strategic privacy initiatives. Tailor content for executive audiences. Document briefings and action items.',
    evidenceRequirements: [
      'Executive briefing schedule and cadence',
      'Board briefing schedule and cadence',
      'Briefing materials and presentations',
      'Meeting minutes and attendance records',
      'Action item tracking from briefings',
      'Executive and board engagement metrics',
    ],
    testProcedures: [
      'Verify briefing schedule is maintained',
      'Review briefing materials for comprehensiveness',
      'Confirm attendance records are maintained',
      'Track action items to completion',
      'Assess executive engagement and support',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-9',
    name: 'Third-Party Privacy Training Requirements',
    description:
      'Establish privacy training requirements for service providers, contractors, and other third parties who process personal information on behalf of the business.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Define privacy training requirements for third parties based on their access to and processing of PI. Include training requirements in contracts. Require third parties to certify their personnel are trained on privacy and data protection. For high-risk third parties, provide business-specific training on your privacy requirements. Verify third-party training compliance through attestations or audits.',
    evidenceRequirements: [
      'Third-party training requirements documentation',
      'Contractual training provisions',
      'Third-party training certification records',
      'Business-specific training materials for third parties',
      'Training compliance verification records',
      'Third-party training monitoring procedures',
    ],
    testProcedures: [
      'Review third-party training requirements',
      'Verify contracts include training provisions',
      'Confirm third-party certifications are obtained',
      'Review business-specific training for high-risk vendors',
      'Audit third-party training compliance',
    ],
    status: 'Not Started',
  },
  {
    controlId: 'CCPA-TA-10',
    name: 'Training Effectiveness Measurement',
    description:
      'Measure the effectiveness of privacy training programs through assessments, metrics, and feedback to ensure training achieves its intended outcomes.',
    category: 'Training and Awareness',
    implementationGuidance:
      'Implement training effectiveness measurement including: pre- and post-training assessments, knowledge retention testing, practical competency evaluations, training feedback surveys, correlation with compliance metrics (request handling accuracy, incident rates), and periodic training needs assessments. Use measurement results to improve training content and delivery. Report on training effectiveness to leadership.',
    evidenceRequirements: [
      'Training assessment methodology',
      'Pre- and post-training assessment results',
      'Knowledge retention testing records',
      'Training feedback survey results',
      'Correlation analysis with compliance metrics',
      'Training improvement action plans',
    ],
    testProcedures: [
      'Review training assessment methodology',
      'Analyze pre- and post-assessment score improvements',
      'Review knowledge retention test results',
      'Examine feedback survey results and response rates',
      'Verify training improvements are implemented based on findings',
    ],
    status: 'Not Started',
  },
];
