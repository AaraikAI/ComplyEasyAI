import { OnboardingFlowConfig, OnboardingFlowName, TierName } from '../types';

/**
 * Complete onboarding flow configurations for all tiers.
 * Each flow contains fully-defined steps with titles, descriptions,
 * target selectors, positions, and actions.
 */

// ============================================================================
// WELCOME FLOW — All Tiers
// ============================================================================
export const welcomeFlow: OnboardingFlowConfig = {
  id: 'welcome',
  name: 'Welcome to ComplyEasy',
  description: 'Get introduced to the platform and understand your compliance journey.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'welcome-greeting',
      title: 'Welcome to ComplyEasy AI',
      description:
        'We are excited to have you on board. ComplyEasy AI is your intelligent compliance management platform that automates and streamlines your compliance workflows using cutting-edge AI technology.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'welcome-org-overview',
      title: 'Your Organization Dashboard',
      description:
        'This is your central command center. From here, you can monitor your compliance posture across all frameworks, track risks, and manage your team. Everything is updated in real-time so you always have the latest picture.',
      targetSelector: '[data-onboarding="dashboard-header"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'welcome-nav-tour',
      title: 'Navigation Sidebar',
      description:
        'The sidebar gives you quick access to all platform features. You will find your frameworks, risk management, AI tools, integrations, and admin settings organized here for easy navigation.',
      targetSelector: '[data-onboarding="sidebar-nav"]',
      position: 'right',
      action: 'observe',
    },
    {
      id: 'welcome-settings',
      title: 'Quick Settings Access',
      description:
        'Access your organization settings, team management, billing, and notification preferences from the settings panel. Admins can invite team members and configure integrations from here.',
      targetSelector: '[data-onboarding="settings-nav"]',
      position: 'right',
      action: 'observe',
    },
    {
      id: 'welcome-tier-benefits',
      title: 'Your Plan Benefits',
      description:
        'Your current subscription tier unlocks a specific set of features tailored to your organization size and compliance needs. Explore everything available to you and upgrade anytime as your needs grow.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'welcome-get-started',
      title: 'Let\'s Get Started!',
      description:
        'You are all set for a quick tour of the features available on your plan. After this, we will help you set up your first compliance framework and guide you through the essential workflows.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

// ============================================================================
// TIER TOUR FLOWS — Segmented by Tier
// ============================================================================

export const foundationTourSteps = [
  {
    id: 'tour-dashboard',
    title: 'Your Compliance Dashboard',
    description:
      'The dashboard provides a real-time overview of your compliance posture. You can see your overall compliance score, active frameworks, open risks, and upcoming audit dates all in one place.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-compliance-score',
    title: 'Compliance Score',
    description:
      'Your compliance score is calculated based on the status of controls across all your active frameworks. As you pass more controls and upload evidence, your score increases automatically.',
    targetSelector: '[data-onboarding="compliance-score"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-frameworks',
    title: 'Compliance Frameworks',
    description:
      'Frameworks like SOC 2, GDPR, HIPAA, and ISO 27001 organize compliance requirements into controls. On your Foundation plan, you can manage up to 3 frameworks simultaneously.',
    targetSelector: '[data-onboarding="frameworks-nav"]',
    position: 'right' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-risks',
    title: 'Risk Management',
    description:
      'Track and manage compliance risks with AI-powered priority scoring. Risks are automatically categorized by severity, and the AI engine suggests mitigation strategies based on your industry.',
    targetSelector: '[data-onboarding="risks-nav"]',
    position: 'right' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-ai-policy',
    title: 'AI Policy Generator',
    description:
      'One of your Foundation plan highlights: automatically generate compliance policies using AI. Simply select a framework and policy type, and the AI creates a comprehensive, audit-ready document.',
    targetSelector: '[data-onboarding="ai-policy-nav"]',
    position: 'right' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-monitoring',
    title: 'Continuous Monitoring',
    description:
      'Keep your compliance posture up to date with automated monitoring. Receive alerts when controls drift out of compliance or when new risks are detected by the platform.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-cta',
    title: 'Add Your First Framework',
    description:
      'Ready to begin? Navigate to the Frameworks page to add your first compliance framework. We recommend starting with the framework most relevant to your upcoming audit or customer requirements.',
    position: 'center' as const,
    action: 'navigate' as const,
    targetRoute: 'frameworks',
  },
];

export const essentialsTourExtraSteps = [
  {
    id: 'tour-personnel',
    title: 'Personnel Management',
    description:
      'Track employee onboarding, offboarding, access reviews, and security training. The personnel module ensures your team meets compliance requirements for access control and background checks.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-vendor-risk',
    title: 'Vendor Risk Management',
    description:
      'Assess and monitor third-party vendors with automated risk scoring. Track vendor assessments, due diligence documentation, and receive alerts when vendor risk profiles change.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-policy-library',
    title: 'Policy Library',
    description:
      'Manage your entire policy lifecycle with version control, approval workflows, and automated distribution. The policy library keeps all your compliance documentation organized and audit-ready.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-trust-center',
    title: 'Trust Center',
    description:
      'Showcase your compliance posture to customers and partners. The Trust Center provides a public-facing page with your certifications, security practices, and compliance status.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-issue-management',
    title: 'Issue Management',
    description:
      'Track and resolve compliance issues with built-in workflows. Assign issues to team members, set due dates, and link issues to specific controls for full traceability.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-advanced-reporting',
    title: 'Advanced Reporting',
    description:
      'Generate detailed compliance reports for stakeholders and auditors. Custom report templates, automated scheduling, and export options make reporting effortless.',
    targetSelector: '[data-onboarding="reports-nav"]',
    position: 'right' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-integrations',
    title: 'Integration Capabilities',
    description:
      'Connect your existing tools — AWS, Azure, GitHub, Slack, Jira, and more — to automate evidence collection and continuous monitoring. Your Essentials plan supports up to 15 integrations.',
    targetSelector: '[data-onboarding="integrations-nav"]',
    position: 'right' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-essentials-cta',
    title: 'Configure Your First Integration',
    description:
      'Maximize your compliance automation by connecting your first integration. Head to the Integrations page to connect a cloud provider, code repository, or communication tool.',
    position: 'center' as const,
    action: 'navigate' as const,
    targetRoute: 'integrations',
  },
];

export const growthTourExtraSteps = [
  {
    id: 'tour-acos-intro',
    title: 'aCOS — Autonomous Compliance',
    description:
      'Your Growth plan unlocks the Autonomous Compliance Orchestration System (aCOS). This AI-driven engine uses Observe-Act-Verify loops to continuously maintain your compliance posture with minimal manual effort.',
    targetSelector: '[data-onboarding="acos-nav"]',
    position: 'right' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-compliance-goals',
    title: 'Compliance Goals',
    description:
      'Set strategic compliance goals and let aCOS work towards achieving them automatically. Goals can target specific frameworks, compliance scores, or risk reduction milestones.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-control-loops',
    title: 'Control Loops',
    description:
      'The heart of aCOS: automated Observe-Act-Verify loops continuously monitor your controls, take corrective actions when drift is detected, and verify the results — all autonomously.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-evidence-truth',
    title: 'Evidence Truth System',
    description:
      'Advanced evidence verification including deepfake detection, cryptographic hashing, and liveness checks. Ensure every piece of evidence in your compliance repository is authentic and tamper-proof.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-regulatory-intelligence',
    title: 'Regulatory Intelligence',
    description:
      'Stay ahead of regulatory changes with AI-powered monitoring of global regulatory feeds. The system automatically assesses the impact of new regulations on your compliance posture.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-digital-twin',
    title: 'Digital Twin Preview',
    description:
      'Your compliance Digital Twin provides a real-time simulation of your entire compliance environment. Run what-if scenarios, predict audit outcomes, and identify vulnerabilities before they become issues.',
    targetSelector: '[data-onboarding="dashboard-content"]',
    position: 'bottom' as const,
    action: 'observe' as const,
  },
  {
    id: 'tour-growth-cta',
    title: 'Set Your First Compliance Goal',
    description:
      'Start harnessing aCOS by setting your first compliance goal. Navigate to the aCOS Dashboard and define a goal — the system will begin working towards it immediately using autonomous control loops.',
    position: 'center' as const,
    action: 'navigate' as const,
    targetRoute: 'acos',
    showConfetti: true,
  },
];

export const tierTourFlow = (tier: TierName): OnboardingFlowConfig => {
  let steps = [...foundationTourSteps];

  if (tier === 'Essentials' || tier === 'Growth' || tier === 'Visionary') {
    steps = [...steps, ...essentialsTourExtraSteps];
  }

  if (tier === 'Growth' || tier === 'Visionary') {
    steps = [...steps, ...growthTourExtraSteps];
  }

  return {
    id: 'tier_tour',
    name: `${tier} Plan Tour`,
    description: `Explore all the features available on your ${tier} plan.`,
    skippable: true,
    estimatedMinutes: tier === 'Growth' || tier === 'Visionary' ? 8 : tier === 'Essentials' ? 6 : 4,
    steps,
  };
};

// ============================================================================
// FIRST FRAMEWORK FLOW — All Tiers
// ============================================================================
export const firstFrameworkFlow: OnboardingFlowConfig = {
  id: 'first_framework',
  name: 'Set Up Your First Framework',
  description: 'Learn how to add and configure a compliance framework.',
  triggerCondition: 'first_visit_frameworks',
  skippable: true,
  estimatedMinutes: 4,
  steps: [
    {
      id: 'fw-navigate',
      title: 'Compliance Frameworks',
      description:
        'Welcome to the Frameworks page. This is where you manage all your compliance frameworks. Each framework contains a set of controls that your organization needs to satisfy for certification or regulatory compliance.',
      targetSelector: '[data-onboarding="frameworks-page"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'fw-available',
      title: 'Available Frameworks',
      description:
        'ComplyEasy supports major frameworks including SOC 2 Type II, GDPR, HIPAA, ISO 27001, PCI DSS, CCPA, and NIST 800-53. Choose the framework most relevant to your upcoming audit or customer requirements.',
      targetSelector: '[data-onboarding="add-framework-btn"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'fw-select',
      title: 'Selecting a Framework',
      description:
        'Click the "Add Framework" button to select and activate a new framework. You can choose from pre-built templates that come with all standard controls pre-configured and ready for assessment.',
      targetSelector: '[data-onboarding="add-framework-btn"]',
      position: 'bottom',
      action: 'click',
    },
    {
      id: 'fw-controls',
      title: 'Understanding Controls',
      description:
        'Each framework is organized into controls — specific requirements that need to be satisfied. Controls can be marked as Compliant, At Risk, Non-Compliant, or In Review. You will assign owners, upload evidence, and track progress for each.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'fw-progress',
      title: 'Progress Tracking',
      description:
        'Your framework progress bar shows the percentage of controls that are passing. As you work through controls and upload evidence, you will see your compliance score increase toward your goal.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'fw-ai-gap',
      title: 'AI Gap Analysis',
      description:
        'Use the AI Gap Analysis tool to automatically identify gaps in your compliance posture. The AI compares your current control status against the framework requirements and suggests specific remediation steps.',
      targetSelector: '[data-onboarding="ai-gap-nav"]',
      position: 'right',
      action: 'observe',
    },
    {
      id: 'fw-celebration',
      title: 'Framework Ready!',
      description:
        'Excellent! You now understand how frameworks work in ComplyEasy. Your next step is to upload evidence for your controls to start building your compliance posture. We will guide you through that process next.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
    {
      id: 'fw-next-steps',
      title: 'Next: Upload Evidence',
      description:
        'Open any framework to view its controls, then select a control and upload your first piece of evidence. Evidence can be documents, screenshots, configuration exports, or any file that demonstrates compliance.',
      position: 'center',
      action: 'observe',
    },
  ],
};

// ============================================================================
// FIRST EVIDENCE UPLOAD FLOW — All Tiers
// ============================================================================
export const firstEvidenceFlow: OnboardingFlowConfig = {
  id: 'first_evidence',
  name: 'Upload Your First Evidence',
  description: 'Learn how to upload and manage evidence for compliance controls.',
  triggerCondition: 'first_evidence_upload',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'ev-intro',
      title: 'Next: Upload Evidence',
      description:
        'Open any framework to view its controls, then select a control and upload your first piece of evidence. Evidence can be documents, screenshots, configuration exports, or any file that demonstrates compliance.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ev-controls',
      title: 'Framework Controls',
      description:
        'You are viewing a framework\'s controls. Each control represents a specific compliance requirement. Select any control to view its details, requirements, and existing evidence.',
      targetSelector: '[data-onboarding="control-list"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'ev-select-control',
      title: 'Select a Control',
      description:
        'Click on a control to expand its details. You will see the control description, its current status, the assigned owner, and any evidence that has already been uploaded.',
      targetSelector: '[data-onboarding="control-list"]',
      position: 'bottom',
      action: 'click',
    },
    {
      id: 'ev-requirements',
      title: 'Evidence Requirements',
      description:
        'Each control specifies what type of evidence is needed to demonstrate compliance. This could be policy documents, system configurations, screenshots, audit logs, or other documentation.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ev-upload',
      title: 'Upload Evidence',
      description:
        'Click the upload button to attach evidence files to this control. Supported formats include PDF, DOCX, XLSX, PNG, JPG, and more. Each upload is versioned so you can track changes over time.',
      targetSelector: '[data-onboarding="upload-evidence-btn"]',
      position: 'top',
      action: 'click',
    },
    {
      id: 'ev-versioning',
      title: 'Evidence Versioning',
      description:
        'ComplyEasy automatically versions your evidence uploads. This means you have a complete audit trail of every document submitted, who uploaded it, and when. Auditors love this traceability.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ev-organizing-tips',
      title: 'Tips for Organizing Evidence',
      description:
        'Use clear file names that include the control ID and date. Group related evidence together and keep your evidence current — stale evidence can raise red flags during audits. Aim to refresh evidence quarterly.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ev-ai-tips',
      title: 'AI Evidence Analysis',
      description:
        'The AI engine can analyze your uploaded evidence to assess completeness and relevance. It flags potential gaps and suggests additional documentation that may be needed to satisfy auditor requirements.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ev-celebration',
      title: 'Evidence Uploaded!',
      description:
        'Great work! You have uploaded your first piece of evidence. Keep building your evidence portfolio across all controls to improve your compliance score and be audit-ready at all times.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

// ============================================================================
// FIRST CONTROL PASS FLOW — All Tiers
// ============================================================================
export const firstControlFlow: OnboardingFlowConfig = {
  id: 'first_control',
  name: 'Pass Your First Control',
  description: 'Learn how to mark controls as passing and track your compliance score.',
  triggerCondition: 'first_control_pass',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'ctrl-navigate',
      title: 'Framework Controls',
      description:
        'Each framework contains controls that represent specific compliance requirements. Your goal is to move controls from "In Review" to "Compliant" by uploading evidence and having it verified.',
      targetSelector: '[data-onboarding="control-list"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'ctrl-status-types',
      title: 'Control Status Types',
      description:
        'Controls have four status levels: Compliant (green) means fully satisfied with evidence, At Risk (yellow) means approaching deadline or incomplete, Non-Compliant (red) means failing, and In Review (blue) means currently being assessed.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ctrl-mark-passing',
      title: 'Marking a Control as Passing',
      description:
        'Once you have uploaded sufficient evidence and verified the control requirements are met, update the control status to "Compliant." This immediately updates your framework compliance score.',
      targetSelector: '[data-onboarding="control-status-btn"]',
      position: 'top',
      action: 'click',
    },
    {
      id: 'ctrl-score-update',
      title: 'Compliance Score Updated!',
      description:
        'Your compliance score has increased. The score is a weighted calculation across all controls in the framework. Passing critical controls contributes more to your overall score.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
    {
      id: 'ctrl-celebration',
      title: 'First Control Passed!',
      description:
        'Congratulations on passing your first control! This is a significant milestone in your compliance journey. Keep working through your controls to achieve full compliance before your next audit.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

// ============================================================================
// INVITE TEAM FLOW — All Tiers
// ============================================================================
export const inviteTeamFlow: OnboardingFlowConfig = {
  id: 'invite_team',
  name: 'Invite Your Team',
  description: 'Learn how to invite team members and manage roles.',
  triggerCondition: 'visit_settings_team',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'team-settings',
      title: 'Team Management',
      description:
        'Welcome to the Settings page. From here, you can manage your team members, assign roles, and configure organization-wide preferences. Compliance is a team effort — invite your colleagues to collaborate.',
      targetSelector: '[data-onboarding="settings-content"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'team-section',
      title: 'Team Members',
      description:
        'The team section shows all members in your organization. You can see their roles, last login, and activity status. Use the invite button to add new members to your compliance team.',
      targetSelector: '[data-onboarding="team-section"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'team-roles',
      title: 'Understanding Roles',
      description:
        'ComplyEasy supports three roles: Admin (full access to all features and settings), Editor (can manage frameworks, controls, and evidence), and Viewer (read-only access to dashboards and reports).',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'team-invite',
      title: 'Invite a Team Member',
      description:
        'Click "Invite Member" to send an invitation via email. The new member will receive a magic link to join your organization. You can assign their role during the invitation process.',
      targetSelector: '[data-onboarding="invite-btn"]',
      position: 'bottom',
      action: 'click',
    },
    {
      id: 'team-permissions',
      title: 'Permission Guidelines',
      description:
        'Best practice: give team members the minimum role needed for their work. Assign "Editor" to compliance managers who need to update controls, and "Viewer" to stakeholders who only need visibility.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'team-collaboration',
      title: 'Collaboration Tips',
      description:
        'Assign control ownership to specific team members so everyone knows their responsibilities. Use the notification system to stay updated on changes, and leverage the built-in compliance chat for quick questions.',
      position: 'center',
      action: 'observe',
    },
  ],
};

// ============================================================================
// INTEGRATION SETUP FLOW — Essentials+
// ============================================================================
export const integrationSetupFlow: OnboardingFlowConfig = {
  id: 'integration_setup',
  name: 'Connect Your First Integration',
  description: 'Learn how to connect third-party tools for automated compliance monitoring.',
  requiredTier: ['Essentials', 'Growth', 'Visionary'],
  triggerCondition: 'visit_integrations',
  skippable: true,
  estimatedMinutes: 4,
  steps: [
    {
      id: 'int-navigate',
      title: 'Integrations Hub',
      description:
        'Welcome to the Integrations page. Connecting your existing tools to ComplyEasy enables automated evidence collection, continuous monitoring, and real-time compliance updates.',
      targetSelector: '[data-onboarding="integrations-page"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'int-available',
      title: 'Available Integrations',
      description:
        'ComplyEasy supports integrations with AWS, Azure, Google Cloud, GitHub, GitLab, Slack, Jira, Okta, and many more. Each integration type automates specific compliance evidence collection workflows.',
      targetSelector: '[data-onboarding="integrations-list"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'int-connect',
      title: 'Connecting an Integration',
      description:
        'Select an integration and follow the guided setup. You will typically need to provide API credentials or authorize via OAuth. The platform guides you through each step with clear instructions.',
      targetSelector: '[data-onboarding="integrations-list"]',
      position: 'bottom',
      action: 'click',
    },
    {
      id: 'int-data-sync',
      title: 'Data Synchronization',
      description:
        'Once connected, the integration begins syncing data automatically. You will see the last sync time and status for each integration. Data is encrypted in transit and at rest for security.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'int-monitoring',
      title: 'Continuous Monitoring',
      description:
        'Integrations power continuous compliance monitoring. The platform automatically checks your cloud configurations, code repositories, and security tools against your framework requirements.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'int-celebration',
      title: 'Integration Connected!',
      description:
        'Fantastic! Your first integration is ready. The platform will now automatically collect evidence and monitor compliance for this integration. Connect more tools to expand your automated coverage.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

// ============================================================================
// AI FEATURE TRIAL FLOW — All Tiers
// ============================================================================
export const aiFeatureTrialFlow: OnboardingFlowConfig = {
  id: 'ai_feature_trial',
  name: 'Try AI-Powered Features',
  description: 'Experience the power of AI-driven compliance automation.',
  triggerCondition: 'first_ai_use',
  skippable: true,
  estimatedMinutes: 4,
  steps: [
    {
      id: 'ai-intro',
      title: 'AI-Powered Compliance',
      description:
        'ComplyEasy AI includes powerful tools that automate compliance tasks using advanced language models. Your plan includes access to AI policy generation and gap analysis, with more tools available on higher tiers.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ai-navigate',
      title: 'AI Policy Generator',
      description:
        'Let\'s try the AI Policy Generator. This tool creates comprehensive, audit-ready compliance policies based on your selected framework and policy type. It saves hours of manual policy drafting.',
      targetSelector: '[data-onboarding="ai-policy-nav"]',
      position: 'right',
      action: 'navigate',
      targetRoute: 'ai-policy',
    },
    {
      id: 'ai-generate',
      title: 'Generate a Policy',
      description:
        'Select your target framework, choose a policy type (such as Information Security, Data Protection, or Access Control), and click Generate. The AI will produce a customized policy document in seconds.',
      targetSelector: '[data-onboarding="ai-generate-btn"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'ai-results',
      title: 'Review AI Results',
      description:
        'The generated policy includes all necessary sections, references to relevant controls, and industry best practices. Review the output and make any adjustments needed for your specific organization.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ai-refine',
      title: 'Refine and Customize',
      description:
        'You can iterate on the generated content by adjusting parameters or editing sections directly. The AI learns from your preferences over time to produce increasingly relevant output.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ai-save',
      title: 'Save Your Policy',
      description:
        'Once you are satisfied with the generated policy, save it to your policy library. It will be version-controlled and linked to the relevant framework controls automatically.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'ai-more-tools',
      title: 'More AI Tools Available',
      description:
        'Beyond policy generation, ComplyEasy AI offers Contract Analysis, RFP Response, Phishing Simulation, Vendor Scoring, Data Mapping, and Business Continuity Planning tools. Explore them from the AI Tools sidebar section.',
      position: 'center',
      action: 'observe',
    },
  ],
};

// ============================================================================
// ADVANCED FEATURES TOUR — Essentials+
// ============================================================================
export const advancedFeaturesFlow: OnboardingFlowConfig = {
  id: 'advanced_features',
  name: 'Advanced Features Tour',
  description: 'Explore enterprise-grade compliance features available on your plan.',
  requiredTier: ['Essentials', 'Growth', 'Visionary'],
  skippable: true,
  estimatedMinutes: 5,
  steps: [
    {
      id: 'adv-personnel',
      title: 'Personnel Management',
      description:
        'Track your workforce compliance end-to-end. Manage employee onboarding and offboarding processes, conduct access reviews, verify background checks, and ensure security training is completed and documented.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'adv-vendor',
      title: 'Vendor Risk Management',
      description:
        'Assess and continuously monitor third-party vendor risks. Send automated security questionnaires, track vendor compliance status, and maintain a comprehensive vendor risk register with AI-powered scoring.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'adv-policy-library',
      title: 'Policy Library',
      description:
        'Centralize all your compliance policies with full version control. Create, review, approve, and distribute policies to your team. Track acknowledgments and maintain a complete audit trail of policy changes.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'adv-trust-center',
      title: 'Trust Center',
      description:
        'Build trust with customers and partners by publishing your compliance posture. The Trust Center provides a customizable public page showcasing your certifications, security practices, and compliance status.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'adv-issues',
      title: 'Issue Management',
      description:
        'Track compliance issues from discovery to resolution. Create issues, assign owners, set priorities and due dates, and link them to specific controls. Full audit trail ensures nothing falls through the cracks.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'adv-reporting',
      title: 'Advanced Reporting',
      description:
        'Generate comprehensive compliance reports for executives, auditors, and board members. Choose from pre-built templates or create custom reports with the metrics and visualizations that matter most to your stakeholders.',
      targetSelector: '[data-onboarding="reports-nav"]',
      position: 'right',
      action: 'observe',
    },
    {
      id: 'adv-multi-workspace',
      title: 'Multi-Workspace Support',
      description:
        'Organize your compliance program across multiple workspaces for different business units, subsidiaries, or client engagements. Each workspace maintains its own frameworks, controls, and team members.',
      position: 'center',
      action: 'observe',
    },
  ],
};

// ============================================================================
// aCOS DIGITAL TWIN WALKTHROUGH — Growth+
// ============================================================================
export const acosDigitalTwinFlow: OnboardingFlowConfig = {
  id: 'acos_digital_twin',
  name: 'aCOS Digital Twin Walkthrough',
  description: 'Master the Autonomous Compliance Orchestration System and Digital Twin capabilities.',
  requiredTier: ['Growth', 'Visionary'],
  triggerCondition: 'visit_acos',
  skippable: true,
  estimatedMinutes: 8,
  steps: [
    {
      id: 'acos-navigate',
      title: 'aCOS Dashboard',
      description:
        'Welcome to the aCOS V3 Dashboard — the command center for your autonomous compliance operations. From here, you manage goals, control loops, compliance debt, and the Digital Twin simulation.',
      targetSelector: '[data-onboarding="acos-dashboard"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'acos-architecture',
      title: 'Observe-Act-Verify Architecture',
      description:
        'aCOS operates using a three-phase control loop: the Observe Agent monitors compliance state, the Act Agent takes corrective actions, and the Verify Agent confirms the actions achieved the desired result. This runs continuously.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-goals',
      title: 'Compliance Goals Setup',
      description:
        'Define strategic compliance goals that aCOS will work towards automatically. Goals can target specific compliance scores, framework completions, risk reductions, or audit readiness milestones. Set a goal and the system handles execution.',
      targetSelector: '[data-onboarding="acos-goals"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'acos-control-loops',
      title: 'Control Loops Configuration',
      description:
        'Control loops are the automation engine of aCOS. Each loop targets a specific compliance area and runs on a configured schedule. View active loops, their execution history, and performance metrics from this panel.',
      targetSelector: '[data-onboarding="acos-loops"]',
      position: 'bottom',
      action: 'observe',
    },
    {
      id: 'acos-debt',
      title: 'Compliance Debt Tracking',
      description:
        'Like technical debt, compliance debt accumulates when controls drift or policies become outdated. aCOS tracks compliance debt, estimates remediation effort, and prioritizes which debt to address first.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-change-impact',
      title: 'Change Impact Analysis',
      description:
        'When system changes occur, aCOS automatically assesses the impact on your compliance posture. It identifies which controls may be affected and recommends necessary re-assessments or evidence updates.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-evidence-truth',
      title: 'Evidence Truth System',
      description:
        'The Evidence Truth module verifies the authenticity of compliance evidence using deepfake detection, cryptographic hashing, and liveness verification. This ensures your evidence repository is tamper-proof and audit-ready.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-regulatory-intel',
      title: 'Regulatory Intelligence',
      description:
        'Stay ahead of regulatory changes with automated monitoring of global regulatory feeds. The AI analyzes new regulations, amendments, and guidance documents to assess their impact on your compliance programs.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-digital-twin-viz',
      title: 'Digital Twin Visualization',
      description:
        'The Digital Twin is a real-time simulation of your entire compliance environment. Run what-if scenarios to predict audit outcomes, simulate regulatory changes, and identify vulnerabilities before they materialize.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-agentic',
      title: 'Agentic Actions',
      description:
        'aCOS can take autonomous actions to maintain compliance — from updating control statuses to generating evidence requests and sending notifications. All agentic actions require configurable approval workflows.',
      position: 'center',
      action: 'observe',
    },
    {
      id: 'acos-cta',
      title: 'Configure Your First Goal',
      description:
        'Start by setting a compliance goal. Click "New Goal" in the aCOS Dashboard to define what you want to achieve. The system will create control loops and begin working towards your goal automatically.',
      targetSelector: '[data-onboarding="acos-new-goal"]',
      position: 'bottom',
      action: 'click',
    },
    {
      id: 'acos-celebration',
      title: 'aCOS Activated!',
      description:
        'You are now equipped to leverage the full power of autonomous compliance. aCOS will continuously optimize your compliance posture while you focus on your core business. Welcome to the future of compliance.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

// ============================================================================
// ENTERPRISE GRC MODULE FLOWS
// ============================================================================

export const riskHeatmapFlow: OnboardingFlowConfig = {
  id: 'risk_heatmap',
  name: 'Risk Heat Map',
  description: 'Visualize your risk landscape with an interactive heat map.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'risk-heatmap-intro',
      title: 'Risk Heat Map',
      description: 'The Risk Heat Map provides a visual overview of all identified risks plotted by likelihood and impact. Use it to quickly identify high-priority areas requiring immediate attention.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'risk-heatmap',
    },
    {
      id: 'risk-heatmap-explore',
      title: 'Explore Your Risk Landscape',
      description: 'Click on any cell to see the risks in that category. You can filter by framework, status, or owner. The heat map updates in real-time as risks are added or resolved.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const regulatoryTrackerFlow: OnboardingFlowConfig = {
  id: 'regulatory_tracker',
  name: 'Regulatory Change Tracker',
  description: 'Monitor and manage regulatory updates impacting your compliance posture.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'reg-tracker-intro',
      title: 'Regulatory Change Tracker',
      description: 'Stay ahead of regulatory changes with automated monitoring. Track new regulations, amendments, and enforcement actions across all your compliance frameworks.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'regulatory-changes',
    },
    {
      id: 'reg-tracker-ai',
      title: 'AI Impact Analysis',
      description: 'Use the AI Impact Analysis feature to automatically identify which controls are affected by a regulatory change and get remediation suggestions.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const vendorMonitoringFlow: OnboardingFlowConfig = {
  id: 'vendor_monitoring',
  name: 'Vendor Continuous Monitoring',
  description: 'Enable continuous monitoring of vendor compliance and security posture.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'vendor-mon-intro',
      title: 'Vendor Monitoring',
      description: 'Vendor Continuous Monitoring tracks the compliance status of your third-party vendors in real time. Set up alerts for security incidents, compliance lapses, and contract renewals.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'vendor-monitoring',
    },
    {
      id: 'vendor-mon-setup',
      title: 'Configure Monitoring',
      description: 'Add your vendors and configure monitoring rules. The system will automatically track their compliance certifications, security ratings, and alert you to any changes.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const privacyPlatformFlow: OnboardingFlowConfig = {
  id: 'privacy_platform',
  name: 'Privacy Management Platform',
  description: 'Manage consent records, data retention policies, and privacy compliance.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'privacy-intro',
      title: 'Privacy Management',
      description: 'The Privacy Management Platform centralizes consent management, data retention enforcement, and DPIA tracking. Stay compliant with GDPR, CCPA, and other privacy regulations.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'privacy',
    },
    {
      id: 'privacy-explore',
      title: 'Explore Privacy Features',
      description: 'Navigate through Consent Management, Data Retention, and Subject Access Requests. Each module helps you maintain full privacy compliance with automated tracking and enforcement.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const incidentManagementFlow: OnboardingFlowConfig = {
  id: 'incident_management',
  name: 'Incident Management',
  description: 'Track and resolve compliance incidents efficiently.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'incident-intro',
      title: 'Incident Management',
      description: 'Log, track, and resolve compliance incidents with a structured workflow. Set up severity levels, assign owners, and monitor resolution timelines.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'incidents',
    },
    {
      id: 'incident-create',
      title: 'Create Your First Incident',
      description: 'Click the "New Incident" button to log an incident. Include details like severity, category, affected systems, and assigned team members for proper tracking.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const controlTestingFlow: OnboardingFlowConfig = {
  id: 'control_testing',
  name: 'Control Testing',
  description: 'Set up automated and manual control testing to validate compliance effectiveness.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'control-test-intro',
      title: 'Control Testing',
      description: 'Control Testing validates that your compliance controls are working effectively. Create test plans, schedule recurring tests, and track pass/fail rates over time.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'control-testing',
    },
    {
      id: 'control-test-setup',
      title: 'Configure Tests',
      description: 'Create test cases for your critical controls. You can set up automated tests that run on a schedule, or manual tests that require reviewer sign-off.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const auditPrepFlow: OnboardingFlowConfig = {
  id: 'audit_prep',
  name: 'Audit Preparation Assistant',
  description: 'Prepare for audits with AI-powered readiness analysis and evidence packaging.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'audit-prep-intro',
      title: 'Audit Prep Assistant',
      description: 'The Audit Prep Assistant uses AI to analyze your readiness for upcoming audits. It identifies gaps, generates mock Q&A, and packages evidence for auditors.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'audit-prep',
    },
    {
      id: 'audit-prep-run',
      title: 'Run Readiness Analysis',
      description: 'Select a framework and run the readiness analysis. The AI will score your preparedness, highlight gaps, and provide an executive summary you can share with stakeholders.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

export const workflowAutomationFlow: OnboardingFlowConfig = {
  id: 'workflow_automation',
  name: 'Workflow Automation',
  description: 'Automate compliance workflows with triggers, conditions, and actions.',
  skippable: true,
  estimatedMinutes: 3,
  steps: [
    {
      id: 'workflow-intro',
      title: 'Workflow Automation',
      description: 'Automate repetitive compliance tasks with configurable workflows. Set up triggers based on events (new risk, control failure, audit due) and define automated actions.',
      position: 'center',
      action: 'navigate',
      targetRoute: 'workflow-automation',
    },
    {
      id: 'workflow-create',
      title: 'Create a Workflow',
      description: 'Build your first automation by selecting a trigger event, adding conditions, and defining actions like notifications, task creation, or status updates.',
      position: 'center',
      action: 'observe',
      showConfetti: true,
    },
  ],
};

// ============================================================================
// FLOW REGISTRY — Maps flow names to configs
// ============================================================================

export const getFlowConfig = (
  flowName: OnboardingFlowName,
  tier: TierName
): OnboardingFlowConfig | null => {
  switch (flowName) {
    case 'welcome':
      return welcomeFlow;
    case 'tier_tour':
      return tierTourFlow(tier);
    case 'first_framework':
      return firstFrameworkFlow;
    case 'first_evidence':
      return firstEvidenceFlow;
    case 'first_control':
      return firstControlFlow;
    case 'invite_team':
      return inviteTeamFlow;
    case 'integration_setup':
      return integrationSetupFlow;
    case 'ai_feature_trial':
      return aiFeatureTrialFlow;
    case 'advanced_features':
      return advancedFeaturesFlow;
    case 'acos_digital_twin':
      return acosDigitalTwinFlow;
    case 'risk_heatmap':
      return riskHeatmapFlow;
    case 'regulatory_tracker':
      return regulatoryTrackerFlow;
    case 'vendor_monitoring':
      return vendorMonitoringFlow;
    case 'privacy_platform':
      return privacyPlatformFlow;
    case 'incident_management':
      return incidentManagementFlow;
    case 'control_testing':
      return controlTestingFlow;
    case 'audit_prep':
      return auditPrepFlow;
    case 'workflow_automation':
      return workflowAutomationFlow;
    default:
      return null;
  }
};

/**
 * Returns the ordered list of flow names applicable to a given tier.
 */
export const getFlowsForTier = (tier: TierName): OnboardingFlowName[] => {
  const base: OnboardingFlowName[] = [
    'welcome',
    'tier_tour',
    'first_framework',
    'first_evidence',
    'first_control',
    'invite_team',
    'ai_feature_trial',
    // Enterprise GRC modules (available to all tiers)
    'risk_heatmap',
    'regulatory_tracker',
    'incident_management',
    'control_testing',
    'audit_prep',
  ];

  if (tier === 'Essentials' || tier === 'Growth' || tier === 'Visionary') {
    base.push('advanced_features', 'integration_setup', 'vendor_monitoring', 'privacy_platform', 'workflow_automation');
  }

  if (tier === 'Growth' || tier === 'Visionary') {
    base.push('acos_digital_twin');
  }

  return base;
};

/**
 * Maps checklist items to their associated flow names for click-to-start behavior.
 */
export const checklistToFlowMap: Record<string, OnboardingFlowName> = {
  profileCompleted: 'welcome',
  teamInvited: 'invite_team',
  firstFrameworkAdded: 'first_framework',
  firstEvidenceUploaded: 'first_evidence',
  firstControlPassed: 'first_control',
  integrationConnected: 'integration_setup',
  aiFeatureUsed: 'ai_feature_trial',
  firstReportGenerated: 'first_framework',
  acosConfigured: 'acos_digital_twin',
  digitalTwinActivated: 'acos_digital_twin',
  // Enterprise GRC modules
  riskHeatmapViewed: 'risk_heatmap',
  regulatoryTrackerViewed: 'regulatory_tracker',
  vendorMonitoringConfigured: 'vendor_monitoring',
  privacyPlatformViewed: 'privacy_platform',
  incidentManagementViewed: 'incident_management',
  controlTestingConfigured: 'control_testing',
  auditPrepStarted: 'audit_prep',
  workflowAutomationConfigured: 'workflow_automation',
};
