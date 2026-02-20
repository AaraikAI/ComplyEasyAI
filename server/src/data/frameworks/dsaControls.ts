import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Digital Services Act (DSA) - Regulation (EU) 2022/2065
 * Controls for online platforms covering content moderation, transparency, and user protection
 */
export const DSA_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Chapter I: General Provisions =====
  {
    controlId: 'DSA-1.1',
    name: 'Service Provider Classification',
    description: 'Organizations must determine their classification under DSA: intermediary service provider, hosting service provider, online platform, very large online platform (VLOP), or very large online search engine (VLOSE). Classification determines applicable obligations.',
    category: 'General Provisions',
    implementationGuidance: 'Analyze service characteristics against DSA definitions. Calculate user metrics for VLOP/VLOSE thresholds (45 million monthly active users in EU). Document classification rationale and update when services change.',
    evidenceRequirements: [
      'Service classification analysis documentation',
      'Monthly active user calculations for EU',
      'Legal opinion on classification if applicable',
      'Service change monitoring procedures'
    ],
    testProcedures: [
      'Review classification analysis for accuracy',
      'Verify user counting methodology compliance',
      'Confirm classification is reviewed when services change',
      'Test threshold monitoring alerting'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-1.2',
    name: 'Legal Representative Appointment',
    description: 'Under Article 13, providers not established in the EU but offering services to EU users must designate a legal representative in one of the Member States where services are offered.',
    category: 'General Provisions',
    implementationGuidance: 'Identify need for legal representative based on establishment status. Select qualified representative in appropriate Member State. Formalize appointment with documented powers. Publish representative information prominently.',
    evidenceRequirements: [
      'Legal representative appointment documentation',
      'Representative qualification verification',
      'Powers of attorney or mandate documentation',
      'Publication records of representative information'
    ],
    testProcedures: [
      'Verify representative is established in correct Member State',
      'Review representative qualifications and authority',
      'Confirm representative information is publicly accessible',
      'Test communication channels with representative'
    ],
    status: 'Not Started'
  },

  // ===== Chapter II: Due Diligence Obligations =====
  {
    controlId: 'DSA-2.1',
    name: 'Terms of Service Publication',
    description: 'Under Article 14, providers must include in their terms of service information on content moderation policies, including algorithmic decision-making and human review. Terms must be clear, understandable, and easily accessible.',
    category: 'Transparency Obligations',
    implementationGuidance: 'Draft clear, plain language terms of service. Include detailed content moderation policy explanations. Describe algorithmic decision-making processes. Ensure terms are accessible in all languages where service is offered.',
    evidenceRequirements: [
      'Current terms of service documentation',
      'Content moderation policy description',
      'Algorithmic decision-making explanations',
      'Accessibility and language availability records'
    ],
    testProcedures: [
      'Review terms of service for clarity and completeness',
      'Verify content moderation policies are adequately described',
      'Assess algorithmic decision-making disclosure adequacy',
      'Test terms accessibility across platforms and languages'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.2',
    name: 'Transparency Reporting',
    description: 'Under Article 15, providers must publish annual transparency reports containing information on content moderation activities, including orders received from authorities, notices processed, and actions taken.',
    category: 'Transparency Obligations',
    implementationGuidance: 'Establish data collection for transparency metrics. Define reporting categories aligned with Article 15 requirements. Implement annual report preparation process. Publish reports in machine-readable format.',
    evidenceRequirements: [
      'Annual transparency reports for review period',
      'Data collection methodology documentation',
      'Content moderation statistics by category',
      'Publication and accessibility records'
    ],
    testProcedures: [
      'Review transparency report completeness against Article 15',
      'Verify data accuracy through sampling',
      'Confirm timely publication',
      'Test machine-readable format compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.3',
    name: 'Notice and Action Mechanism',
    description: 'Under Article 16, hosting providers must implement mechanisms for users to submit notices about illegal content. Notices must be processed in a timely, diligent, non-arbitrary, and objective manner.',
    category: 'Content Moderation',
    implementationGuidance: 'Implement user-friendly notice submission interface. Define notice processing workflows and timelines. Train moderators on legal content assessment. Track notice metrics and outcomes.',
    evidenceRequirements: [
      'Notice submission mechanism documentation',
      'Notice processing procedures and timelines',
      'Moderator training materials and records',
      'Notice statistics and outcome tracking'
    ],
    testProcedures: [
      'Test notice submission user experience',
      'Review notice processing timeline compliance',
      'Verify moderator training completion',
      'Assess notice outcome consistency through sampling'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.4',
    name: 'Statement of Reasons',
    description: 'Under Article 17, when restricting content or accounts, providers must provide affected users with a clear statement of reasons including the legal or contractual grounds, facts, and information about redress possibilities.',
    category: 'Content Moderation',
    implementationGuidance: 'Design statement of reasons templates covering required elements. Implement automated and manual statement generation. Include clear redress information. Maintain records of statements issued.',
    evidenceRequirements: [
      'Statement of reasons templates',
      'Statement generation system documentation',
      'Redress mechanism descriptions included in statements',
      'Statement issuance records and samples'
    ],
    testProcedures: [
      'Review statement templates for completeness',
      'Verify statements include required elements through sampling',
      'Test redress information accuracy and accessibility',
      'Assess statement clarity through user feedback'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.5',
    name: 'Internal Complaint Handling System',
    description: 'Under Article 20, online platforms must provide users with access to an internal complaint handling system for decisions to remove content, suspend accounts, or other content moderation decisions.',
    category: 'User Protection',
    implementationGuidance: 'Implement complaint submission system accessible to affected users. Define complaint review process with human decision-making. Establish complaint resolution timelines. Track complaint metrics and outcomes.',
    evidenceRequirements: [
      'Complaint handling system documentation',
      'Complaint review procedures',
      'Resolution timeline commitments',
      'Complaint statistics and outcome analysis'
    ],
    testProcedures: [
      'Test complaint submission accessibility',
      'Verify human review in complaint process',
      'Review complaint resolution timelines',
      'Assess complaint outcome quality through sampling'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.6',
    name: 'Out-of-Court Dispute Settlement',
    description: 'Under Article 21, online platforms must engage with certified out-of-court dispute settlement bodies when users pursue dispute resolution. Platforms must bear reasonable costs.',
    category: 'User Protection',
    implementationGuidance: 'Identify certified dispute settlement bodies. Establish process for engaging with dispute bodies. Define cost-sharing arrangements compliant with DSA. Train staff on out-of-court dispute procedures.',
    evidenceRequirements: [
      'List of certified dispute settlement bodies',
      'Dispute engagement procedures',
      'Cost-sharing policy documentation',
      'Dispute resolution records and outcomes'
    ],
    testProcedures: [
      'Verify engagement with certified bodies',
      'Review dispute resolution process compliance',
      'Assess cost-sharing arrangement reasonableness',
      'Track dispute resolution outcomes and timelines'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.7',
    name: 'Trusted Flagger System',
    description: 'Under Article 22, online platforms must give priority to notices from trusted flaggers - entities designated by Digital Services Coordinators as having expertise in detecting illegal content.',
    category: 'Content Moderation',
    implementationGuidance: 'Implement trusted flagger identification and verification. Create priority processing queues for trusted flagger notices. Establish trusted flagger communication channels. Track trusted flagger notice metrics.',
    evidenceRequirements: [
      'Trusted flagger verification documentation',
      'Priority processing configuration',
      'Communication channel documentation',
      'Trusted flagger notice statistics'
    ],
    testProcedures: [
      'Verify trusted flagger status verification process',
      'Test priority processing implementation',
      'Review notice processing time differences',
      'Assess trusted flagger satisfaction and feedback'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-2.8',
    name: 'Suspension of Repeat Infringers',
    description: 'Under Article 23, online platforms must suspend for a reasonable period users who frequently provide manifestly illegal content. Platforms must also suspend notice abuse by users submitting manifestly unfounded notices.',
    category: 'Content Moderation',
    implementationGuidance: 'Define thresholds for frequent infringement. Implement suspension tracking and enforcement. Establish proportionate suspension periods. Create appeal process for suspended users.',
    evidenceRequirements: [
      'Infringement counting and threshold documentation',
      'Suspension policy and procedures',
      'Appeal process documentation',
      'Suspension statistics and appeal outcomes'
    ],
    testProcedures: [
      'Review infringement threshold reasonableness',
      'Verify suspension enforcement accuracy',
      'Test appeal process accessibility',
      'Assess suspension proportionality through sampling'
    ],
    status: 'Not Started'
  },

  // ===== Chapter III: Online Platform Obligations =====
  {
    controlId: 'DSA-3.1',
    name: 'Trader Verification (Know Your Business Customer)',
    description: 'Under Article 30, online marketplaces must collect and verify trader information before allowing them to offer products or services, including identity, contact details, and relevant registrations.',
    category: 'Marketplace Obligations',
    implementationGuidance: 'Implement trader onboarding with identity verification. Collect required information per Article 30. Verify information accuracy through appropriate checks. Maintain trader information records.',
    evidenceRequirements: [
      'Trader verification procedures',
      'Information collection forms and records',
      'Verification check documentation',
      'Trader information database records'
    ],
    testProcedures: [
      'Review trader onboarding process completeness',
      'Test verification check effectiveness',
      'Verify information collection against Article 30',
      'Assess trader database accuracy through sampling'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-3.2',
    name: 'Product Safety Information Display',
    description: 'Under Article 31, online marketplaces must design interfaces to allow traders to provide required product safety information and display it clearly to consumers.',
    category: 'Marketplace Obligations',
    implementationGuidance: 'Design product listing interfaces with safety information fields. Implement validation for required safety information. Display safety information prominently to consumers. Enable consumer reporting of unsafe products.',
    evidenceRequirements: [
      'Product listing interface design documentation',
      'Safety information field requirements',
      'Consumer-facing safety display mockups',
      'Unsafe product reporting mechanism documentation'
    ],
    testProcedures: [
      'Test product listing for safety information capture',
      'Review consumer-facing safety information display',
      'Verify unsafe product reporting functionality',
      'Assess trader compliance with safety requirements'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-3.3',
    name: 'Online Advertising Transparency',
    description: 'Under Article 26, online platforms displaying advertising must ensure each advertisement is clearly identifiable, shows the advertiser, and indicates meaningful parameters for targeting.',
    category: 'Advertising Obligations',
    implementationGuidance: 'Implement clear advertising labels and identifiers. Display advertiser identity with each ad. Show main targeting parameters to users. Create ad transparency archives for VLOP/VLOSE.',
    evidenceRequirements: [
      'Advertising labeling implementation documentation',
      'Advertiser identification display records',
      'Targeting parameter disclosure documentation',
      'Ad transparency archive (if VLOP/VLOSE)'
    ],
    testProcedures: [
      'Verify advertising is clearly labeled',
      'Test advertiser identification accuracy',
      'Review targeting parameter disclosure clarity',
      'Assess ad archive completeness (if applicable)'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-3.4',
    name: 'Recommender System Transparency',
    description: 'Under Article 27, platforms using recommender systems must clearly describe the main parameters used and provide options to modify or influence those parameters.',
    category: 'Algorithmic Transparency',
    implementationGuidance: 'Document recommender system parameters in plain language. Implement user controls for recommendation preferences. Provide non-profiling recommendation options. Update disclosures when algorithms change.',
    evidenceRequirements: [
      'Recommender system documentation for users',
      'User control implementation documentation',
      'Non-profiling option implementation',
      'Algorithm change notification records'
    ],
    testProcedures: [
      'Review recommender system disclosure clarity',
      'Test user control functionality',
      'Verify non-profiling option effectiveness',
      'Assess disclosure update timeliness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-3.5',
    name: 'Minor Protection Measures',
    description: 'Under Article 28, platforms accessible to minors must implement appropriate measures to ensure high level of privacy, safety, and security for minors, including not targeting advertising based on profiling using personal data.',
    category: 'User Protection',
    implementationGuidance: 'Implement age verification or inference mechanisms. Disable profiling-based ad targeting for identified minors. Apply enhanced privacy settings for minor accounts. Review content moderation for minor safety.',
    evidenceRequirements: [
      'Age verification/inference methodology',
      'Minor ad targeting restrictions documentation',
      'Enhanced privacy settings for minors',
      'Minor safety content moderation procedures'
    ],
    testProcedures: [
      'Test age verification mechanism effectiveness',
      'Verify ad targeting restrictions for minors',
      'Review privacy settings applied to minor accounts',
      'Assess content moderation for minor safety'
    ],
    status: 'Not Started'
  },

  // ===== Chapter IV: VLOP/VLOSE Additional Obligations =====
  {
    controlId: 'DSA-4.1',
    name: 'Systemic Risk Assessment',
    description: 'Under Article 34, VLOPs and VLOSEs must identify, analyze, and assess systemic risks stemming from their services, including illegal content dissemination, fundamental rights impacts, and electoral process effects.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Establish risk assessment methodology covering Article 34 categories. Conduct annual risk assessments with stakeholder input. Document identified risks and severity levels. Report risks to Digital Services Coordinator.',
    evidenceRequirements: [
      'Risk assessment methodology documentation',
      'Annual risk assessment reports',
      'Stakeholder consultation records',
      'Risk reporting to authorities'
    ],
    testProcedures: [
      'Review risk assessment methodology comprehensiveness',
      'Verify risk categories cover Article 34 requirements',
      'Assess stakeholder input adequacy',
      'Confirm risk reporting compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.2',
    name: 'Systemic Risk Mitigation Measures',
    description: 'Under Article 35, VLOPs and VLOSEs must implement reasonable, proportionate, and effective mitigation measures for identified systemic risks, including content moderation enhancements, algorithm adjustments, and cooperation with authorities.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Design mitigation measures for each identified risk. Implement technical and operational controls. Monitor mitigation effectiveness. Adjust measures based on risk evolution.',
    evidenceRequirements: [
      'Risk mitigation plan documentation',
      'Mitigation measure implementation records',
      'Effectiveness monitoring metrics',
      'Measure adjustment documentation'
    ],
    testProcedures: [
      'Review mitigation measure appropriateness',
      'Verify implementation of planned measures',
      'Assess effectiveness monitoring accuracy',
      'Test measure adjustment responsiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.3',
    name: 'Crisis Response Mechanism',
    description: 'Under Article 36, VLOPs and VLOSEs must respond promptly to Commission requests during crises (public security, public health) with specific measures to address the crisis impact of their services.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Establish crisis response team and procedures. Define communication channels with Commission. Prepare contingency measures for various crisis types. Document response capabilities and timelines.',
    evidenceRequirements: [
      'Crisis response procedures and team structure',
      'Commission communication channels',
      'Contingency measure playbooks',
      'Crisis response drill records'
    ],
    testProcedures: [
      'Review crisis response procedure adequacy',
      'Test communication channel effectiveness',
      'Assess contingency measure readiness',
      'Verify crisis drill completion and lessons learned'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.4',
    name: 'Independent Audit',
    description: 'Under Article 37, VLOPs and VLOSEs must undergo annual independent audits of compliance with DSA obligations. Audits must be performed by organizations meeting independence and competence requirements.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Select qualified independent auditors meeting Article 37 criteria. Define audit scope covering all DSA obligations. Implement audit finding remediation process. Publish audit reports as required.',
    evidenceRequirements: [
      'Auditor qualification and independence verification',
      'Audit scope documentation',
      'Annual audit reports',
      'Remediation action plans and completion records'
    ],
    testProcedures: [
      'Verify auditor independence requirements are met',
      'Review audit scope completeness',
      'Assess audit finding remediation effectiveness',
      'Confirm audit report publication compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.5',
    name: 'Ad Repository',
    description: 'Under Article 39, VLOPs and VLOSEs must maintain a publicly accessible repository of all advertisements displayed on their services, including content, advertiser, targeting parameters, and display period.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Implement ad repository with searchable interface. Capture required information for each advertisement. Retain ad records for at least one year after last display. Provide API access for researchers.',
    evidenceRequirements: [
      'Ad repository system documentation',
      'Information capture specifications',
      'Retention policy documentation',
      'API documentation for researcher access'
    ],
    testProcedures: [
      'Test ad repository search functionality',
      'Verify information completeness through sampling',
      'Confirm retention period compliance',
      'Assess API accessibility and usability'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.6',
    name: 'Data Access for Researchers',
    description: 'Under Article 40, VLOPs and VLOSEs must provide vetted researchers with access to data necessary to conduct research contributing to detection and understanding of systemic risks.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Establish researcher vetting process aligned with Article 40. Create data access mechanisms with appropriate privacy protections. Define data request and approval workflows. Maintain researcher access records.',
    evidenceRequirements: [
      'Researcher vetting procedures',
      'Data access mechanism documentation',
      'Privacy protection measures',
      'Data access request and approval records'
    ],
    testProcedures: [
      'Review researcher vetting process compliance',
      'Test data access mechanism functionality',
      'Verify privacy protection effectiveness',
      'Assess data request processing timeliness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.7',
    name: 'Compliance Function',
    description: 'Under Article 41, VLOPs and VLOSEs must establish an independent compliance function with sufficient authority and resources, headed by a compliance officer with direct reporting to management.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Create independent compliance function with clear mandate. Appoint qualified compliance officer with senior management reporting. Ensure adequate resourcing. Define compliance function responsibilities.',
    evidenceRequirements: [
      'Compliance function organizational documentation',
      'Compliance officer appointment and qualifications',
      'Resource allocation records',
      'Compliance function mandate and charter'
    ],
    testProcedures: [
      'Verify compliance function independence',
      'Review compliance officer qualifications',
      'Assess resource adequacy',
      'Confirm senior management reporting access'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'DSA-4.8',
    name: 'Enhanced Transparency Report',
    description: 'Under Article 42, VLOPs and VLOSEs must publish enhanced transparency reports every six months including additional information on content moderation resources, systemic risks, and audit outcomes.',
    category: 'VLOP/VLOSE Obligations',
    implementationGuidance: 'Establish semi-annual reporting process. Include enhanced information per Article 42. Publish in machine-readable format. Maintain reporting archive.',
    evidenceRequirements: [
      'Semi-annual transparency reports',
      'Enhanced information compilation process',
      'Machine-readable format documentation',
      'Publication and archive records'
    ],
    testProcedures: [
      'Review report completeness against Article 42',
      'Verify semi-annual publication compliance',
      'Test machine-readable format usability',
      'Assess report accessibility'
    ],
    status: 'Not Started'
  }
];
