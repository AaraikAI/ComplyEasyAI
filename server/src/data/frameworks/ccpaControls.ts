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
];
