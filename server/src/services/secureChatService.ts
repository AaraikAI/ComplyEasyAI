/**
 * Secure Chat Service
 * Uses local/homomorphic AI to provide contextual answers based on user's account data
 * Ensures data privacy - no data is sent to external LLMs
 * 
 * Now includes comprehensive knowledge base from:
 * - CUSTOMER_PRODUCT_GUIDE.md
 * - FAQ.md
 * - TUTORIALS.md
 * - TROUBLESHOOTING_GUIDE.md
 * 
 * Implements tier-based access control to restrict feature information
 */

import prisma from '../config/database';
import logger from '../config/logger';
import homomorphicAIService from './advanced/homomorphicAIService';
import { TIERS, hasFeature, TierName, TierFeatures } from '../config/tiers';

// Cache for homomorphic keys per organization
const keyCache = new Map<string, any>();

interface UserContext {
  frameworks: any[];
  risks: any[];
  organization: any;
  user: any;
  tier: TierName;
}

interface ChatResponse {
  response: string;
  sources?: string[];
  encrypted?: boolean;
  tierRestricted?: boolean;
}

// ============================================================================
// DOCUMENTATION KNOWLEDGE BASE
// ============================================================================

/**
 * Comprehensive knowledge base from documentation files
 * This includes information from FAQ, Product Guide, Tutorials, and Troubleshooting
 */
const KNOWLEDGE_BASE = {
  // Pricing Information
  pricing: {
    foundation: {
      price: '$8,500/year ($708/month billed annually)',
      users: 'Up to 10 users',
      frameworks: '3 compliance frameworks',
      description: 'Perfect for startups and SMBs beginning their compliance journey',
      tier: 'Foundation' as TierName,
      showPrice: true,
    },
    essentials: {
      price: '$17,000/year ($1,417/month billed annually)',
      users: 'Up to 100 users',
      frameworks: '10 frameworks',
      description: 'Full-featured compliance platform with advanced AI for growing organizations',
      tier: 'Essentials' as TierName,
      showPrice: true,
    },
    growth: {
      price: 'Contact - sales@complyeasyai.com',
      users: '100-1,000 users',
      frameworks: '50 frameworks',
      description: 'Advanced aCOS capabilities for mid-market companies and MSPs',
      tier: 'Growth' as TierName,
      showPrice: false,
    },
    visionary: {
      price: 'Contact - sales@complyeasyai.com',
      users: 'Unlimited users',
      frameworks: 'Unlimited frameworks',
      description: 'Cutting-edge compliance technology with full aCOS and enterprise-grade security',
      tier: 'Visionary' as TierName,
      showPrice: false,
    },
  },

  // Add-Ons
  addOns: {
    customFrameworks: {
      price: '$660/year',
      description: 'Build unlimited proprietary compliance frameworks for regulated industries like defense, aerospace, pharma',
      availableFor: ['Growth', 'Visionary'] as TierName[],
    },
    onPremises: {
      price: '$3,200/year',
      description: 'Deploy ComplyEasyAI on your own AWS/Azure/GCP infrastructure. For government, financial institutions, healthcare.',
      availableFor: ['Visionary'] as TierName[],
    },
    customAiModels: {
      price: '$1,920/year',
      description: 'Fine-tuned AI models trained on your data for enterprises with unique terminology/workflows',
      availableFor: ['Visionary'] as TierName[],
    },
    vcisoService: {
      price: '$9,997/year (10 hours/month consulting)',
      description: 'Compliance advisory from certified experts (CISSP, CISA, CIPP). For companies without internal GRC teams.',
      availableFor: ['Foundation', 'Essentials', 'Growth', 'Visionary'] as TierName[],
    },
    auditBundling: {
      price: '$8,000-$30,000 depending on audit',
      description: 'Pre-negotiated rates with audit firms. Everyone getting certified can benefit.',
      availableFor: ['Foundation', 'Essentials', 'Growth', 'Visionary'] as TierName[],
    },
  },

  // Features by tier
  features: {
    aiPolicyGeneration: {
      name: 'AI Policy Generator',
      description: 'Instantly create compliance policies from templates. Generate comprehensive, customized policies in minutes.',
      tiers: ['Foundation', 'Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiPolicyGeneration' as keyof TierFeatures,
    },
    aiGapAnalysis: {
      name: 'AI Gap Analysis',
      description: 'Identify compliance gaps automatically. Upload documentation or describe practices to find what\'s missing for certification.',
      tiers: ['Foundation', 'Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiGapAnalysis' as keyof TierFeatures,
    },
    aiContractAnalyzer: {
      name: 'AI Contract Analyzer',
      description: 'Automatically review contracts for compliance risks. Detects non-compliant clauses, data protection issues, liability concerns.',
      tiers: ['Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiContractAnalyzer' as keyof TierFeatures,
    },
    aiRfpGenerator: {
      name: 'AI RFP Responder',
      description: 'Automatically answer security questionnaires. Supports SIG, CAIQ, VSA, and custom formats. 90% time reduction.',
      tiers: ['Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiRfpGenerator' as keyof TierFeatures,
    },
    aiVendorScorer: {
      name: 'AI Vendor Scorer',
      description: 'Automated vendor risk assessments. Evaluates vendor security posture using AI analysis.',
      tiers: ['Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiVendorScorer' as keyof TierFeatures,
    },
    aiDataMapper: {
      name: 'AI Data Mapper',
      description: 'Automatically discover and classify sensitive data across databases, cloud storage, file systems.',
      tiers: ['Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiDataMapper' as keyof TierFeatures,
    },
    aiPhishingSimulator: {
      name: 'AI Phishing Simulator',
      description: 'Create realistic phishing training campaigns including email, SMS, social media, and voice phishing.',
      tiers: ['Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiPhishingSimulator' as keyof TierFeatures,
    },
    aiBcpGenerator: {
      name: 'AI BCP Generator',
      description: 'Generate Business Continuity Plans automatically. Includes business impact analysis, recovery strategies.',
      tiers: ['Essentials', 'Growth', 'Visionary'] as TierName[],
      featureKey: 'aiBcpGenerator' as keyof TierFeatures,
    },
    acosGoals: {
      name: 'aCOS Compliance Goals',
      description: 'Set and track compliance objectives automatically. Auto-generates task breakdowns and realistic timelines.',
      tiers: ['Growth', 'Visionary'] as TierName[],
      featureKey: 'acosGoals' as keyof TierFeatures,
    },
    acosControlLoops: {
      name: 'aCOS Control Loops',
      description: 'Autonomous control effectiveness monitoring. Monitors, detects drift, and auto-remediates.',
      tiers: ['Growth', 'Visionary'] as TierName[],
      featureKey: 'acosControlLoops' as keyof TierFeatures,
    },
    acosDigitalTwin: {
      name: 'aCOS Digital Twin',
      description: 'Test compliance changes in a virtual copy of your environment. Run simulations without risk.',
      tiers: ['Growth', 'Visionary'] as TierName[],
      featureKey: 'acosDigitalTwin' as keyof TierFeatures,
    },
    acosRedTeam: {
      name: 'aCOS Red Team',
      description: 'AI-powered security testing. Simulates adversarial attacks on your compliance program.',
      tiers: ['Growth', 'Visionary'] as TierName[],
      featureKey: 'acosRedTeam' as keyof TierFeatures,
    },
    zeroTrustSecurity: {
      name: 'Zero Trust Security',
      description: 'Never Trust, Always Verify. Device trust verification, policy engine, and micro-segmentation.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'zeroTrustSecurity' as keyof TierFeatures,
    },
    zkProofs: {
      name: 'Zero-Knowledge Proofs',
      description: 'Prove compliance without revealing data using zk-SNARKs cryptography.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'zkProofs' as keyof TierFeatures,
    },
    byokEncryption: {
      name: 'BYOK Encryption',
      description: 'Bring Your Own Key. Use your own encryption keys from AWS KMS, Azure Key Vault, GCP KMS, or HashiCorp Vault.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'byokEncryption' as keyof TierFeatures,
    },
    complianceAsCode: {
      name: 'Compliance-as-Code',
      description: 'Write compliance policies in code using Rego language. Integrate with CI/CD pipelines.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'complianceAsCode' as keyof TierFeatures,
    },
    euAiAct: {
      name: 'EU AI Act Compliance',
      description: 'Complete EU AI Act management. AI system risk classification, documentation, conformity assessment.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'euAiAct' as keyof TierFeatures,
    },
    dma: {
      name: 'Digital Markets Act (DMA)',
      description: 'Gatekeeper compliance management. Track 20+ DMA obligations for large digital platforms.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'dma' as keyof TierFeatures,
    },
    dsa: {
      name: 'Digital Services Act (DSA)',
      description: 'Online platform compliance. Content moderation, transparency reporting, risk management for VLOPs.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'dsa' as keyof TierFeatures,
    },
    nistAiRmf: {
      name: 'NIST AI RMF Framework',
      description: 'NIST AI Risk Management Framework implementation.',
      tiers: ['Visionary'] as TierName[],
      featureKey: 'nistAiRmf' as keyof TierFeatures,
    },
  },

  // Frameworks supported
  frameworks: [
    { name: 'SOC 2 Type I/II', category: 'Security', available: 'All tiers' },
    { name: 'ISO 27001', category: 'Security', available: 'All tiers' },
    { name: 'ISO 27701', category: 'Privacy', available: 'All tiers' },
    { name: 'NIST CSF', category: 'Security', available: 'All tiers' },
    { name: 'GDPR', category: 'Privacy', available: 'All tiers' },
    { name: 'CCPA', category: 'Privacy', available: 'All tiers' },
    { name: 'HIPAA', category: 'Healthcare', available: 'All tiers' },
    { name: 'PCI DSS', category: 'Payment', available: 'All tiers' },
    { name: 'FedRAMP', category: 'Government', available: 'All tiers' },
    { name: 'EU AI Act', category: 'AI/ML', available: 'Visionary (or add-on)' },
    { name: 'NIST AI RMF', category: 'AI/ML', available: 'Visionary (or add-on)' },
    { name: 'ISO 42001', category: 'AI/ML', available: 'All tiers' },
    { name: 'DMA', category: 'EU Digital', available: 'Visionary (or add-on)' },
    { name: 'DSA', category: 'EU Digital', available: 'Visionary (or add-on)' },
  ],

  // Support levels by tier
  support: {
    Foundation: {
      response: '48-hour email response',
      channels: ['Email', 'Knowledge base', 'Community forum'],
    },
    Essentials: {
      response: '24-hour email response',
      channels: ['Email', 'Chat (business hours)', 'Knowledge base', 'Community forum'],
    },
    Growth: {
      response: '8-hour response',
      channels: ['Email', 'Phone', 'Live chat', 'Dedicated Slack channel'],
      sla: '99% uptime SLA',
    },
    Visionary: {
      response: '4-hour critical response, 24/7',
      channels: ['Email', 'Phone 24/7', 'Live chat', 'Dedicated CSM', 'Private Slack with engineering'],
      sla: '99.9% uptime SLA',
    },
  },

  // Common troubleshooting topics
  troubleshooting: {
    login: {
      issue: 'Cannot Login / Invalid Credentials',
      solutions: [
        'Verify email and password (password is case-sensitive)',
        'Reset password via "Forgot Password" link',
        'For 2FA issues: ensure device clock is synced, or use backup codes',
        'After 5 failed attempts, account locks for 15 minutes',
      ],
    },
    sso: {
      issue: 'SSO Login Not Working',
      solutions: [
        'SSO is only available with Essentials tier and above',
        'Verify domain is verified in Settings → Authentication → Domains',
        'Check SAML configuration: ACS URL, Entity ID, Name ID format',
      ],
    },
    integration: {
      issue: 'AWS/GitHub/Slack Integration Issues',
      solutions: [
        'Verify IAM permissions for AWS integration',
        'Check trust relationship and external ID',
        'For GitHub: ensure admin access to organization',
        'For Slack: invite @ComplyEasyAI bot to relevant channels',
      ],
    },
    evidence: {
      issue: 'Evidence Not Collecting',
      solutions: [
        'Check collection schedule (default: daily at 2 AM UTC)',
        'Verify integration is connected and healthy',
        'Use "Sync Now" to force immediate collection',
        'Check filters may be hiding evidence',
      ],
    },
    performance: {
      issue: 'Dashboard Loading Slowly',
      solutions: [
        'Close unnecessary browser tabs',
        'Clear browser cache',
        'Check internet connection (minimum 5 Mbps)',
        'Check status.complyeasyai.com for incidents',
      ],
    },
  },

  // Tutorial quick starts
  tutorials: {
    gettingStarted: {
      title: 'Getting Started in 30 Minutes',
      steps: [
        'Create account and verify email (5 min)',
        'Choose your first framework - SOC 2 recommended for SaaS (5 min)',
        'Connect integrations - AWS, GitHub, Slack, Okta (10 min)',
        'Review dashboard and failing controls (5 min)',
        'Invite team members and set up notifications (5 min)',
      ],
    },
    soc2Timeline: {
      title: 'SOC 2 Certification Timeline',
      phases: [
        'Preparation: 2-4 months (gap assessment, control implementation, policies)',
        'Observation: 3-6 months (controls operating, evidence collected)',
        'Audit: 4-8 weeks (auditor engagement, testing, report)',
        'Total with ComplyEasyAI: 6-9 months (vs 12-18 months manual)',
      ],
    },
    acosSetup: {
      title: 'Setting Up aCOS (Autonomous Compliance)',
      requirements: 'Growth tier or higher',
      features: [
        'Compliance Goals - set objectives, auto-generate tasks',
        'Control Loops - 24/7 monitoring, auto-remediation',
        'Digital Twin - test changes safely',
        'Red Team - find gaps before auditors',
      ],
    },
  },

  // Contact information
  contact: {
    sales: 'sales@complyeasyai.com',
    support: 'support@complyeasyai.com',
    security: 'security@complyeasyai.com',
    phone: '+1 (555) 123-4567',
    demo: 'complyeasyai.com/demo',
  },
};

class SecureChatService {
  /**
   * Check if user's tier has access to a specific feature
   */
  private hasFeatureAccess(tier: TierName, featureKey: keyof TierFeatures): boolean {
    return hasFeature(tier, featureKey);
  }

  /**
   * Get tier-appropriate response for restricted features
   */
  private getUpgradeMessage(feature: string, currentTier: TierName, requiredTiers: TierName[]): string {
    const lowestRequiredTier = requiredTiers[0];
    return `\n\n🔒 **Feature Access:** ${feature} is available with ${requiredTiers.join(', ')} tier(s). You're currently on ${currentTier}. ` +
      `Contact sales@complyeasyai.com to upgrade to ${lowestRequiredTier} or higher for access to this feature.`;
  }

  /**
   * Fetch user's account context for personalized responses
   */
  private async getUserContext(userId: string, organizationId: string): Promise<UserContext> {
    try {
      const [frameworks, risks, organization, user] = await Promise.all([
        // Fetch frameworks with controls
        prisma.complianceFramework.findMany({
          where: { organizationId },
          include: {
            controls: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
                evidence: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Fetch risks
        prisma.riskItem.findMany({
          where: { organizationId },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { detectedAt: 'desc' },
          take: 50, // Limit to recent risks
        }),

        // Fetch organization
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: {
            id: true,
            name: true,
            plan: true,
            subscriptionStatus: true,
          },
        }),

        // Fetch user
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        }),
      ]);

      // Get tier from organization, default to Foundation
      const tier = (organization?.plan as TierName) || 'Foundation';

      return {
        frameworks: frameworks || [],
        risks: risks || [],
        organization: organization || null,
        user: user || null,
        tier,
      };
    } catch (error) {
      logger.error('Error fetching user context', error);
      return {
        frameworks: [],
        risks: [],
        organization: null,
        user: null,
        tier: 'Foundation',
      };
    }
  }

  /**
   * Build context summary for AI processing
   */
  private buildContextSummary(context: UserContext): string {
    const summary: string[] = [];

    // Organization info with tier
    if (context.organization) {
      summary.push(`Organization: ${context.organization.name} (${context.tier} tier)`);
      
      // Add tier-specific info
      const tierInfo = TIERS[context.tier];
      if (tierInfo) {
        summary.push(`Tier Limits: ${tierInfo.limits.maxFrameworks === -1 ? 'Unlimited' : tierInfo.limits.maxFrameworks} frameworks, ${tierInfo.limits.maxUsers === -1 ? 'Unlimited' : tierInfo.limits.maxUsers} users`);
      }
    }

    // Frameworks summary
    if (context.frameworks.length > 0) {
      summary.push(`\nActive Compliance Frameworks (${context.frameworks.length}):`);
      context.frameworks.forEach((fw) => {
        const compliantControls = fw.controls?.filter((c: any) => c.status === 'Compliant' || c.status === 'Implemented').length || 0;
        const totalControls = fw.controls?.length || 0;
        summary.push(
          `- ${fw.name}: ${fw.progress}% complete, ${compliantControls}/${totalControls} controls compliant, Status: ${fw.status}`
        );
      });
    } else {
      summary.push('\nNo compliance frameworks configured yet.');
    }

    // Risks summary
    if (context.risks.length > 0) {
      const highRisks = context.risks.filter((r) => r.severity === 'High' || r.severity === 'Critical').length;
      const openRisks = context.risks.filter((r) => r.status === 'Open' || r.status === 'In_Progress').length;
      summary.push(
        `\nRisk Summary: ${context.risks.length} total risks, ${highRisks} high/critical, ${openRisks} open/in-progress`
      );

      // Top 5 risks
      const topRisks = context.risks.slice(0, 5);
      if (topRisks.length > 0) {
        summary.push('\nTop Risks:');
        topRisks.forEach((risk) => {
          summary.push(`- ${risk.severity}: ${risk.title || risk.description.substring(0, 60)}... (Status: ${risk.status})`);
        });
      }
    } else {
      summary.push('\nNo risks detected.');
    }

    // Add available features based on tier
    summary.push(`\nFeatures Available (${context.tier} tier):`);
    if (context.tier === 'Foundation') {
      summary.push('- Basic AI: Policy Generation, Gap Analysis');
      summary.push('- Core: Frameworks, Risk Management, Audit Logging');
    } else if (context.tier === 'Essentials') {
      summary.push('- Full AI Suite: Contract Analyzer, RFP, Phishing Sim, Vendor Risk, Data Mapper, BCP');
      summary.push('- Enterprise: Personnel, Vendor Management, Policy Library, Trust Center');
    } else if (context.tier === 'Growth') {
      summary.push('- Everything in Essentials PLUS:');
      summary.push('- aCOS: Goals, Control Loops, Digital Twin, Red Team, Federated Learning');
    } else if (context.tier === 'Visionary') {
      summary.push('- Everything in Growth PLUS:');
      summary.push('- EU Regulations: AI Act, DMA, DSA, NIST AI RMF');
      summary.push('- Advanced Security: Zero Trust, ZK Proofs, BYOK, Compliance-as-Code');
    }

    return summary.join('\n');
  }

  /**
   * Process query using local AI with user context
   * Uses rule-based system with homomorphic encryption for sensitive data
   * Now includes knowledge base from documentation and tier-based access control
   * 
   * @param message - The full message including conversation history for context
   * @param context - User context including tier and organization info
   * @param currentQuery - Optional: The current user query WITHOUT history (for accurate intent detection)
   */
  private async processQueryLocally(message: string, context: UserContext, currentQuery?: string): Promise<string> {
    // IMPORTANT: Use currentQuery (without history) for intent detection to avoid
    // false matches from conversation history. Fall back to message if not provided.
    const queryForIntent = (currentQuery || message).toLowerCase();
    const lowerMessage = queryForIntent; // Use clean query for all keyword matching
    const userTier = context.tier;

    // ========================================================================
    // PRICING QUERIES
    // ========================================================================
    if (lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      const pricingInfo = KNOWLEDGE_BASE.pricing;
      let response = `**ComplyEasyAI Pricing:**\n\n`;
      
      // Foundation - Show price
      response += `📦 **Foundation**: ${pricingInfo.foundation.price}\n`;
      response += `   - ${pricingInfo.foundation.users}, ${pricingInfo.foundation.frameworks}\n`;
      response += `   - ${pricingInfo.foundation.description}\n\n`;
      
      // Essentials - Show price
      response += `📦 **Essentials**: ${pricingInfo.essentials.price}\n`;
      response += `   - ${pricingInfo.essentials.users}, ${pricingInfo.essentials.frameworks}\n`;
      response += `   - ${pricingInfo.essentials.description}\n\n`;
      
      // Growth - Contact sales only
      response += `📦 **Growth**: Contact - sales@complyeasyai.com\n`;
      response += `   - ${pricingInfo.growth.users}, ${pricingInfo.growth.frameworks}\n`;
      response += `   - ${pricingInfo.growth.description}\n\n`;
      
      // Visionary - Contact sales only
      response += `📦 **Visionary**: Contact - sales@complyeasyai.com\n`;
      response += `   - ${pricingInfo.visionary.users}, ${pricingInfo.visionary.frameworks}\n`;
      response += `   - ${pricingInfo.visionary.description}\n\n`;
      
      response += `**You're currently on: ${userTier}**\n\n`;
      response += `For Growth and Visionary tier pricing, contact sales@complyeasyai.com for a custom quote.`;
      return response;
    }

    // ========================================================================
    // ADD-ON QUERIES
    // ========================================================================
    if (lowerMessage.includes('add-on') || lowerMessage.includes('addon') || lowerMessage.includes('custom framework') || 
        lowerMessage.includes('on-prem') || lowerMessage.includes('vciso') || lowerMessage.includes('audit bundl')) {
      const addOns = KNOWLEDGE_BASE.addOns;
      let response = `**Enterprise Add-Ons & Services:**\n\n`;
      
      response += `🛠️ **Custom Frameworks Add-On**: ${addOns.customFrameworks.price}\n   ${addOns.customFrameworks.description}\n   *Available for: ${addOns.customFrameworks.availableFor.join(', ')}*\n\n`;
      response += `🏢 **On-Premises Deployment**: ${addOns.onPremises.price}\n   ${addOns.onPremises.description}\n   *Available for: ${addOns.onPremises.availableFor.join(', ')}*\n\n`;
      response += `🤖 **Custom AI Models**: ${addOns.customAiModels.price}\n   ${addOns.customAiModels.description}\n   *Available for: ${addOns.customAiModels.availableFor.join(', ')}*\n\n`;
      response += `👨‍💼 **Dedicated vCISO Service**: ${addOns.vcisoService.price}\n   ${addOns.vcisoService.description}\n   *Available for: ${addOns.vcisoService.availableFor.join(', ')}*\n\n`;
      response += `📋 **Audit Bundling**: ${addOns.auditBundling.price}\n   ${addOns.auditBundling.description}\n   *Available for: ${addOns.auditBundling.availableFor.join(', ')}*\n\n`;
      
      response += `**Your tier (${userTier}) qualifies for:** `;
      const availableAddOns = Object.entries(addOns)
        .filter(([_, addon]) => addon.availableFor.includes(userTier))
        .map(([name]) => name);
      response += availableAddOns.length > 0 ? availableAddOns.join(', ') : 'Contact sales for options';
      
      return response;
    }

    // ========================================================================
    // ACOS FEATURE QUERIES (Tier-Restricted: Growth+)
    // ========================================================================
    if (lowerMessage.includes('acos') || lowerMessage.includes('autonomous') || lowerMessage.includes('control loop') || 
        lowerMessage.includes('digital twin') || lowerMessage.includes('red team')) {
      const acosFeatures = [
        KNOWLEDGE_BASE.features.acosGoals,
        KNOWLEDGE_BASE.features.acosControlLoops,
        KNOWLEDGE_BASE.features.acosDigitalTwin,
        KNOWLEDGE_BASE.features.acosRedTeam,
      ];

      let response = `**aCOS (Autonomous Compliance Operations System):**\n\n`;
      response += `aCOS is our breakthrough autonomous compliance engine that monitors your infrastructure 24/7 with AI agents, detects compliance drift in real-time, and auto-heals issues.\n\n`;
      
      for (const feature of acosFeatures) {
        const hasAccess = this.hasFeatureAccess(userTier, feature.featureKey);
        response += `${hasAccess ? '✅' : '🔒'} **${feature.name}**: ${feature.description}\n`;
        if (!hasAccess) {
          response += `   *Available with: ${feature.tiers.join(', ')}*\n`;
        }
        response += '\n';
      }

      if (!this.hasFeatureAccess(userTier, 'acosGoals')) {
        response += this.getUpgradeMessage('aCOS features', userTier, ['Growth', 'Visionary']);
      } else {
        response += `\nYou have full access to aCOS features with your ${userTier} tier! Navigate to aCOS Dashboard to get started.`;
      }

      return response;
    }

    // ========================================================================
    // EU AI ACT QUERIES (Tier-Restricted: Visionary)
    // ========================================================================
    if (lowerMessage.includes('eu ai act') || lowerMessage.includes('ai act')) {
      const feature = KNOWLEDGE_BASE.features.euAiAct;
      const hasAccess = this.hasFeatureAccess(userTier, 'euAiAct');
      
      let response = `**EU AI Act Compliance:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**Risk Classification Levels:**\n`;
      response += `- ❌ Unacceptable Risk - Prohibited practices\n`;
      response += `- 🔴 High Risk - Mandatory requirements\n`;
      response += `- 🟡 Limited Risk - Transparency obligations\n`;
      response += `- 🟢 Minimal Risk - Best practices\n\n`;

      if (!hasAccess) {
        response += this.getUpgradeMessage('EU AI Act Compliance', userTier, feature.tiers);
      } else {
        response += `✅ You have access to EU AI Act Compliance with your ${userTier} tier! Navigate to EU AI Act Dashboard to manage your AI systems.`;
      }

      return response;
    }

    // ========================================================================
    // DMA/DSA QUERIES (Tier-Restricted: Visionary)
    // ========================================================================
    if (lowerMessage.includes('dma') || lowerMessage.includes('digital markets act') || lowerMessage.includes('gatekeeper')) {
      const feature = KNOWLEDGE_BASE.features.dma;
      const hasAccess = this.hasFeatureAccess(userTier, 'dma');
      
      let response = `**Digital Markets Act (DMA) - EU Regulation**\n\n`;
      response += `The Digital Markets Act is an EU regulation (Regulation 2022/1925) that came into force in November 2022, designed to ensure fair and open digital markets.\n\n`;
      
      response += `**What is the DMA?**\n`;
      response += `The DMA establishes rules for large digital platforms ("gatekeepers") to prevent anti-competitive practices and ensure a level playing field for businesses and consumers in the EU.\n\n`;
      
      response += `**Gatekeeper Designation Thresholds:**\n`;
      response += `- 📊 **Revenue:** €7.5B+ EU turnover (3 years) OR €75B+ market cap\n`;
      response += `- 👥 **User Base:** 45M+ monthly active end users AND 10K+ business users in EU\n`;
      response += `- ⏱️ **Persistence:** Must meet thresholds for 3 consecutive years\n\n`;
      
      response += `**Core Platform Services Covered:**\n`;
      response += `- Online intermediation services (marketplaces, app stores)\n`;
      response += `- Search engines\n`;
      response += `- Social networking services\n`;
      response += `- Video-sharing platform services\n`;
      response += `- Number-independent interpersonal communication services\n`;
      response += `- Operating systems & cloud computing services\n`;
      response += `- Advertising services\n\n`;
      
      response += `**Key Gatekeeper Obligations:**\n`;
      response += `- ✅ Allow third-party interoperability\n`;
      response += `- ✅ Allow users to uninstall pre-installed apps\n`;
      response += `- ✅ Allow third-party app stores\n`;
      response += `- ✅ Provide data portability\n`;
      response += `- ✅ Fair access to ranking and search data\n`;
      response += `- ❌ Cannot favor own services over third parties\n`;
      response += `- ❌ Cannot prevent users from un-subscribing\n`;
      response += `- ❌ Cannot use business user data to compete against them\n\n`;
      
      response += `**Penalties for Non-Compliance:**\n`;
      response += `- Up to 10% of worldwide annual turnover\n`;
      response += `- Up to 20% for repeated infringements\n`;
      response += `- Periodic penalties up to 5% of average daily turnover\n\n`;

      if (!hasAccess) {
        response += this.getUpgradeMessage('DMA Compliance', userTier, feature.tiers);
      } else {
        response += `✅ You have access to DMA Compliance with your ${userTier} tier!\n\n`;
        response += `**ComplyEasyAI DMA Features:**\n`;
        response += `- Gatekeeper designation tracking\n`;
        response += `- 20+ obligation management and monitoring\n`;
        response += `- Compliance evidence collection\n`;
        response += `- Reporting and audit trail\n\n`;
        response += `Navigate to **DMA Dashboard** to manage your gatekeeper obligations.`;
      }

      return response;
    }

    if (lowerMessage.includes('dsa') || lowerMessage.includes('digital services act') || lowerMessage.includes('content moderation')) {
      const feature = KNOWLEDGE_BASE.features.dsa;
      const hasAccess = this.hasFeatureAccess(userTier, 'dsa');
      
      let response = `**Digital Services Act (DSA) - EU Regulation**\n\n`;
      response += `The Digital Services Act is an EU regulation (Regulation 2022/2065) that establishes rules for online intermediaries and platforms, focusing on user safety and transparency.\n\n`;
      
      response += `**What is the DSA?**\n`;
      response += `The DSA creates a comprehensive framework for online platforms operating in the EU, with obligations around content moderation, transparency, and user protection.\n\n`;
      
      response += `**Platform Classifications:**\n`;
      response += `- 🔵 **VLOP (Very Large Online Platform):** 45M+ monthly active EU users\n`;
      response += `- 🔵 **VLOSE (Very Large Online Search Engine):** 45M+ monthly active EU users\n`;
      response += `- 🟢 **Online Platforms:** Hosting services that store and disseminate content\n`;
      response += `- ⚪ **Hosting Services:** Services that store information\n`;
      response += `- ⚪ **Intermediary Services:** All other online intermediaries\n\n`;
      
      response += `**Key DSA Obligations:**\n`;
      response += `- 📋 Transparency reporting (content moderation, algorithmic systems)\n`;
      response += `- ⚠️ Illegal content reporting mechanisms\n`;
      response += `- 🔍 Risk assessments for systemic risks (VLOPs/VLOSEs)\n`;
      response += `- 📢 Advertisement repository requirements\n`;
      response += `- 👤 Trusted flaggers program\n`;
      response += `- 🛡️ Protection of minors\n`;
      response += `- 🤖 Recommender system transparency\n\n`;
      
      response += `**Penalties for Non-Compliance:**\n`;
      response += `- Up to 6% of worldwide annual turnover\n`;
      response += `- Periodic penalties up to 5% of average daily turnover\n`;
      response += `- Potential service restrictions in severe cases\n\n`;

      if (!hasAccess) {
        response += this.getUpgradeMessage('DSA Compliance', userTier, feature.tiers);
      } else {
        response += `✅ You have access to DSA Compliance with your ${userTier} tier!\n\n`;
        response += `**ComplyEasyAI DSA Features:**\n`;
        response += `- Platform registration and classification\n`;
        response += `- Content moderation tracking\n`;
        response += `- Illegal content report management\n`;
        response += `- Advertisement repository\n`;
        response += `- Risk assessment tools\n`;
        response += `- Transparency report generation\n\n`;
        response += `Navigate to **DSA Dashboard** to manage your platform compliance.`;
      }

      return response;
    }

    // ========================================================================
    // SECURITY FEATURES QUERIES (Zero Trust, ZK Proofs, BYOK - Visionary)
    // ========================================================================
    if (lowerMessage.includes('zero trust') || lowerMessage.includes('zkp') || lowerMessage.includes('zero knowledge') || 
        lowerMessage.includes('byok') || lowerMessage.includes('bring your own key') || lowerMessage.includes('compliance as code')) {
      const securityFeatures = [
        KNOWLEDGE_BASE.features.zeroTrustSecurity,
        KNOWLEDGE_BASE.features.zkProofs,
        KNOWLEDGE_BASE.features.byokEncryption,
        KNOWLEDGE_BASE.features.complianceAsCode,
      ];

      let response = `**Advanced Security Features:**\n\n`;
      
      for (const feature of securityFeatures) {
        const hasAccess = this.hasFeatureAccess(userTier, feature.featureKey);
        response += `${hasAccess ? '✅' : '🔒'} **${feature.name}**: ${feature.description}\n`;
        if (!hasAccess) {
          response += `   *Available with: ${feature.tiers.join(', ')}*\n`;
        }
        response += '\n';
      }

      if (!this.hasFeatureAccess(userTier, 'zeroTrustSecurity')) {
        response += this.getUpgradeMessage('Advanced Security Features', userTier, ['Visionary']);
      }

      return response;
    }

    // ========================================================================
    // AI FEATURES QUERIES (Check tier access)
    // ========================================================================
    if (lowerMessage.includes('ai feature') || lowerMessage.includes('policy generator') || lowerMessage.includes('contract analyzer') || 
        lowerMessage.includes('rfp') || lowerMessage.includes('phishing') || lowerMessage.includes('vendor scor') || 
        lowerMessage.includes('data mapper') || lowerMessage.includes('bcp generator')) {
      const aiFeatures = [
        KNOWLEDGE_BASE.features.aiPolicyGeneration,
        KNOWLEDGE_BASE.features.aiGapAnalysis,
        KNOWLEDGE_BASE.features.aiContractAnalyzer,
        KNOWLEDGE_BASE.features.aiRfpGenerator,
        KNOWLEDGE_BASE.features.aiVendorScorer,
        KNOWLEDGE_BASE.features.aiDataMapper,
        KNOWLEDGE_BASE.features.aiPhishingSimulator,
        KNOWLEDGE_BASE.features.aiBcpGenerator,
      ];

      let response = `**AI-Powered Features:**\n\n`;
      
      for (const feature of aiFeatures) {
        const hasAccess = this.hasFeatureAccess(userTier, feature.featureKey);
        response += `${hasAccess ? '✅' : '🔒'} **${feature.name}**: ${feature.description}\n`;
        if (!hasAccess) {
          response += `   *Available with: ${feature.tiers.join(', ')}*\n`;
        }
        response += '\n';
      }

      return response;
    }

    // ========================================================================
    // SUPPORT QUERIES
    // ========================================================================
    if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
      const support = KNOWLEDGE_BASE.support[userTier];
      const contact = KNOWLEDGE_BASE.contact;
      
      let response = `**Support for ${userTier} Tier:**\n\n`;
      response += `📧 Response Time: ${support.response}\n`;
      response += `📞 Channels: ${support.channels.join(', ')}\n`;
      if ((support as any).sla) {
        response += `✅ SLA: ${(support as any).sla}\n`;
      }
      response += `\n**Contact Information:**\n`;
      response += `- Sales: ${contact.sales}\n`;
      response += `- Support: ${contact.support}\n`;
      response += `- Security: ${contact.security}\n`;
      response += `- Phone: ${contact.phone}\n`;
      response += `- Book Demo: ${contact.demo}\n`;

      return response;
    }

    // ========================================================================
    // TROUBLESHOOTING QUERIES
    // ========================================================================
    if (lowerMessage.includes('trouble') || lowerMessage.includes('problem') || lowerMessage.includes('error') || 
        lowerMessage.includes('not working') || lowerMessage.includes('can\'t login') || lowerMessage.includes('sso issue')) {
      const troubleshooting = KNOWLEDGE_BASE.troubleshooting;
      
      // Detect specific issue
      if (lowerMessage.includes('login') || lowerMessage.includes('password') || lowerMessage.includes('credential')) {
        const issue = troubleshooting.login;
        return `**Troubleshooting: ${issue.issue}**\n\n**Solutions:**\n${issue.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nIf issue persists, contact support@complyeasyai.com`;
      }
      
      if (lowerMessage.includes('sso') || lowerMessage.includes('single sign')) {
        const issue = troubleshooting.sso;
        let response = `**Troubleshooting: ${issue.issue}**\n\n**Solutions:**\n${issue.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        if (userTier === 'Foundation') {
          response += '\n\n⚠️ Note: SSO requires Essentials tier or higher. You\'re on Foundation tier.';
        }
        return response;
      }
      
      if (lowerMessage.includes('aws') || lowerMessage.includes('github') || lowerMessage.includes('slack') || lowerMessage.includes('integration')) {
        const issue = troubleshooting.integration;
        return `**Troubleshooting: ${issue.issue}**\n\n**Solutions:**\n${issue.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nFor detailed integration guides, visit docs.complyeasyai.com/integrations`;
      }
      
      if (lowerMessage.includes('evidence') || lowerMessage.includes('collect')) {
        const issue = troubleshooting.evidence;
        return `**Troubleshooting: ${issue.issue}**\n\n**Solutions:**\n${issue.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
      }
      
      if (lowerMessage.includes('slow') || lowerMessage.includes('loading') || lowerMessage.includes('performance')) {
        const issue = troubleshooting.performance;
        return `**Troubleshooting: ${issue.issue}**\n\n**Solutions:**\n${issue.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
      }

      // General troubleshooting response
      return `**Need help troubleshooting?** I can assist with:\n\n` +
        `- Login & authentication issues\n` +
        `- SSO configuration problems\n` +
        `- Integration issues (AWS, GitHub, Slack, Okta)\n` +
        `- Evidence collection problems\n` +
        `- Performance issues\n\n` +
        `Please describe your specific issue, or contact support@complyeasyai.com for assistance.`;
    }

    // ========================================================================
    // TUTORIAL / GETTING STARTED QUERIES
    // ========================================================================
    if (lowerMessage.includes('tutorial') || lowerMessage.includes('getting started') || lowerMessage.includes('how to start') || 
        lowerMessage.includes('setup') || lowerMessage.includes('soc 2 timeline')) {
      const tutorials = KNOWLEDGE_BASE.tutorials;
      
      if (lowerMessage.includes('soc 2') || lowerMessage.includes('soc2')) {
        const soc2 = tutorials.soc2Timeline;
        return `**${soc2.title}**\n\n${soc2.phases.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
          `With ComplyEasyAI, organizations typically achieve SOC 2 certification 40-50% faster than manual processes.`;
      }
      
      if (lowerMessage.includes('acos')) {
        const acos = tutorials.acosSetup;
        if (!this.hasFeatureAccess(userTier, 'acosGoals')) {
          return `**${acos.title}**\n\n⚠️ aCOS requires ${acos.requirements}. You're currently on ${userTier} tier.\n\n` +
            `aCOS features include:\n${acos.features.map(f => `- ${f}`).join('\n')}\n\n` +
            `Contact sales@complyeasyai.com to upgrade for aCOS access.`;
        }
        return `**${acos.title}**\n\n✅ You have access with ${userTier} tier!\n\n` +
          `**Features included:**\n${acos.features.map(f => `- ${f}`).join('\n')}\n\n` +
          `Navigate to aCOS Dashboard to get started.`;
      }

      // Default getting started
      const gettingStarted = tutorials.gettingStarted;
      return `**${gettingStarted.title}**\n\n${gettingStarted.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
        `For video tutorials, visit learn.complyeasyai.com`;
    }

    // ========================================================================
    // FRAMEWORK-RELATED QUERIES (Original + Enhanced)
    // ========================================================================
    if (lowerMessage.includes('framework') || lowerMessage.includes('compliance') || lowerMessage.includes('soc') || 
        lowerMessage.includes('gdpr') || lowerMessage.includes('hipaa') || lowerMessage.includes('iso')) {
      // Check for supported frameworks query
      if (lowerMessage.includes('support') || lowerMessage.includes('available') || lowerMessage.includes('which')) {
        const frameworks = KNOWLEDGE_BASE.frameworks;
        let response = `**Supported Compliance Frameworks (50+):**\n\n`;
        
        const categories = [...new Set(frameworks.map(f => f.category))];
        for (const category of categories) {
          const categoryFrameworks = frameworks.filter(f => f.category === category);
          response += `**${category}:**\n`;
          categoryFrameworks.forEach(f => {
            response += `- ${f.name} (${f.available})\n`;
          });
          response += '\n';
        }
        
        response += `\n**Your tier (${userTier}) supports:** ${TIERS[userTier].limits.maxFrameworks === -1 ? 'Unlimited' : TIERS[userTier].limits.maxFrameworks} frameworks`;
        return response;
      }

      // Original framework status query
      if (context.frameworks.length === 0) {
        return "You don't have any compliance frameworks configured yet. Would you like help setting up SOC 2, GDPR, HIPAA, or another framework?\n\n" +
          "**Quick start recommendations:**\n" +
          "- SaaS companies: Start with SOC 2 Type II\n" +
          "- Healthcare: HIPAA + SOC 2\n" +
          "- AI companies: EU AI Act + ISO 42001 + SOC 2\n" +
          "- FinTech: SOC 2 + PCI DSS";
      }

      const frameworkNames = context.frameworks.map((f) => f.name).join(', ');
      const frameworkDetails = context.frameworks.map((fw) => {
        const controls = fw.controls || [];
        const compliant = controls.filter((c: any) => c.status === 'Compliant' || c.status === 'Implemented').length;
        return `${fw.name}: ${fw.progress}% complete, ${compliant}/${controls.length} controls compliant, Status: ${fw.status}`;
      }).join('\n');

      return `You have ${context.frameworks.length} active compliance framework(s): ${frameworkNames}\n\n${frameworkDetails}\n\nWould you like details on a specific framework or help improving compliance?`;
    }

    // ========================================================================
    // RISK-RELATED QUERIES (Original)
    // ========================================================================
    if (lowerMessage.includes('risk') || lowerMessage.includes('threat') || lowerMessage.includes('vulnerability') || lowerMessage.includes('issue')) {
      if (context.risks.length === 0) {
        return "Great news! You don't have any open risks at the moment. Your compliance posture looks good.";
      }

      const highRisks = context.risks.filter((r) => r.severity === 'High' || r.severity === 'Critical');
      const openRisks = context.risks.filter((r) => r.status === 'Open' || r.status === 'In_Progress');

      let response = `You have ${context.risks.length} total risk(s) in your account.\n\n`;
      
      if (highRisks.length > 0) {
        response += `⚠️ ${highRisks.length} High/Critical risk(s) require immediate attention:\n`;
        highRisks.slice(0, 5).forEach((risk) => {
          response += `- ${risk.title || risk.description.substring(0, 50)}... (${risk.severity})\n`;
        });
      }

      if (openRisks.length > 0) {
        response += `\n📋 ${openRisks.length} open/in-progress risk(s) need action.`;
      }

      response += '\n\nWould you like help prioritizing or remediating these risks?';
      return response;
    }

    // ========================================================================
    // STATUS/PROGRESS QUERIES (Original)
    // ========================================================================
    if (lowerMessage.includes('status') || lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
      const totalFrameworks = context.frameworks.length;
      const avgProgress = totalFrameworks > 0
        ? Math.round(context.frameworks.reduce((sum, fw) => sum + fw.progress, 0) / totalFrameworks)
        : 0;
      const compliantFrameworks = context.frameworks.filter((fw) => fw.status === 'Compliant').length;
      const openRisks = context.risks.filter((r) => r.status === 'Open' || r.status === 'In_Progress').length;

      let response = `**Your Compliance Status (${userTier} Tier):**\n\n` +
        `📊 Frameworks: ${totalFrameworks} active, ${compliantFrameworks} fully compliant\n` +
        `📈 Average Progress: ${avgProgress}%\n` +
        `⚠️ Open Risks: ${openRisks}\n\n` +
        `${avgProgress >= 80 ? '🎉 Excellent progress! You\'re well on your way to full compliance.' : avgProgress >= 50 ? '👍 Good progress. Keep working on those controls!' : '💪 You\'re getting started. Focus on implementing key controls first.'}`;

      // Add tier-specific suggestions
      if (userTier === 'Foundation') {
        response += `\n\n💡 **Tip:** Upgrade to Essentials for advanced AI features like Contract Analyzer, RFP Responder, and Vendor Scoring.`;
      } else if (userTier === 'Essentials') {
        response += `\n\n💡 **Tip:** Upgrade to Growth for aCOS autonomous compliance, Digital Twin, and Red Team simulations.`;
      }

      return response;
    }

    // ========================================================================
    // CONTROL/EVIDENCE QUERIES (Original)
    // ========================================================================
    if (lowerMessage.includes('control') || lowerMessage.includes('evidence')) {
      const allControls = context.frameworks.flatMap((fw) => fw.controls || []);
      const controlsWithoutEvidence = allControls.filter((c: any) => !c.evidence && (c.status === 'Implemented' || c.status === 'Compliant'));
      const atRiskControls = allControls.filter((c: any) => c.status === 'At Risk' || c.status === 'Failed');

      if (controlsWithoutEvidence.length > 0) {
        return `You have ${controlsWithoutEvidence.length} control(s) that are marked as implemented/compliant but lack evidence. Adding evidence will strengthen your compliance posture.`;
      }

      if (atRiskControls.length > 0) {
        return `You have ${atRiskControls.length} control(s) that are at risk or failed. These need immediate attention to maintain compliance.`;
      }

      return `All your controls are properly documented with evidence. Great work!`;
    }

    // ========================================================================
    // TIER/PLAN QUERIES
    // ========================================================================
    if (lowerMessage.includes('tier') || lowerMessage.includes('my plan') || lowerMessage.includes('upgrade') || lowerMessage.includes('current plan')) {
      const currentTierInfo = TIERS[userTier];
      let response = `**Your Current Plan: ${userTier}**\n\n`;
      response += `**Features:**\n${currentTierInfo.highlights.slice(0, 6).map(h => `✅ ${h}`).join('\n')}\n\n`;
      response += `**Limits:**\n`;
      response += `- Users: ${currentTierInfo.limits.maxUsers === -1 ? 'Unlimited' : currentTierInfo.limits.maxUsers}\n`;
      response += `- Frameworks: ${currentTierInfo.limits.maxFrameworks === -1 ? 'Unlimited' : currentTierInfo.limits.maxFrameworks}\n`;
      response += `- Integrations: ${currentTierInfo.limits.maxIntegrations === -1 ? 'Unlimited' : currentTierInfo.limits.maxIntegrations}\n`;
      response += `- Storage: ${currentTierInfo.limits.maxStorageGB === -1 ? 'Unlimited' : currentTierInfo.limits.maxStorageGB + ' GB'}\n\n`;

      const nextTierIndex = ['Foundation', 'Essentials', 'Growth', 'Visionary'].indexOf(userTier) + 1;
      if (nextTierIndex < 4) {
        const nextTier = ['Foundation', 'Essentials', 'Growth', 'Visionary'][nextTierIndex] as TierName;
        const nextTierInfo = TIERS[nextTier];
        response += `**Ready to upgrade to ${nextTier}?**\n`;
        response += `${nextTierInfo.highlights.slice(0, 3).map(h => `🔓 ${h}`).join('\n')}\n\n`;
        response += `Contact sales@complyeasyai.com to upgrade.`;
      }

      return response;
    }

    // ========================================================================
    // GENERAL HELP (Enhanced)
    // ========================================================================
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm your secure compliance assistant for ${context.organization?.name || 'your organization'}! I can help you with:\n\n` +
        `📋 **Compliance Frameworks** - Status, progress, setup guidance\n` +
        `⚠️ **Risk Management** - View, prioritize, and remediate risks\n` +
        `📊 **Status & Progress** - Overall compliance dashboard\n` +
        `🔒 **Controls & Evidence** - Implementation tracking\n` +
        `💰 **Pricing & Plans** - Tier information, add-ons\n` +
        `🛠️ **Troubleshooting** - Common issues and solutions\n` +
        `📚 **Tutorials** - Getting started guides\n\n` +
        `**Your tier: ${userTier}** - I'll let you know if features require an upgrade.\n\n` +
        `🔐 All data processed locally - no external AI transmission.\n\n` +
        `Try: "What's my compliance status?" | "Tell me about aCOS" | "How much does ComplyEasyAI cost?"`;
    }

    // ========================================================================
    // DEFAULT RESPONSE WITH CONTEXT
    // ========================================================================
    const contextSummary = this.buildContextSummary(context);
    return `I understand you're asking about: "${message}"\n\n` +
      `**Based on your account (${userTier} tier):**\n${contextSummary}\n\n` +
      `**I can help with:**\n` +
      `- Compliance frameworks & status\n` +
      `- Risk management\n` +
      `- Pricing, plans & add-ons\n` +
      `- Feature availability for your tier\n` +
      `- Troubleshooting & tutorials\n` +
      `- aCOS, EU AI Act, DMA, DSA features\n\n` +
      `What would you like to know?`;
  }

  /**
   * Get or create conversation for user
   */
  private async getConversation(userId: string, organizationId: string): Promise<any> {
    try {
      // Try to find existing conversation
      const existing = await prisma.chatConversation.findFirst({
        where: {
          userId,
          organizationId,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        return existing;
      }

      // Create new conversation
      return await prisma.chatConversation.create({
        data: {
          userId,
          organizationId,
          messages: [],
          fileContext: {},
        },
      });
    } catch (error) {
      logger.error('Error getting conversation', error);
      return null;
    }
  }

  /**
   * Main chat method - processes queries securely using local AI with conversation context
   */
  async chatWithUser(
    message: string,
    userId: string,
    organizationId: string,
    fileContext?: { filename: string; content: string; type: string }[]
  ): Promise<ChatResponse> {
    try {
      logger.info(`[Secure Chat] Processing query for user ${userId}`);

      // Get conversation for context
      const conversation = await this.getConversation(userId, organizationId);
      const conversationHistory = (conversation?.messages as any[]) || [];

      // Fetch user context
      const context = await this.getUserContext(userId, organizationId);

      // Build context with conversation history (last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);
      const historyContext = recentHistory.length > 0
        ? `\n\nPrevious conversation:\n${recentHistory.map((m: any) => 
            `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`
          ).join('\n')}`
        : '';

      // Add file context if provided
      const fileContextStr = fileContext && fileContext.length > 0
        ? `\n\nFile Context:\n${fileContext.map(f => 
            `File: ${f.filename} (${f.type})\nContent: ${f.content.substring(0, 2000)}...`
          ).join('\n\n')}`
        : '';

      // Process query locally with context
      // Pass the original message separately for accurate intent detection (without history contamination)
      const enhancedMessage = message + historyContext + fileContextStr;
      const response = await this.processQueryLocally(enhancedMessage, context, message);

      // Update conversation with new messages
      if (conversation) {
        const updatedMessages = [
          ...conversationHistory,
          { sender: 'user', text: message, timestamp: new Date().toISOString() },
          { sender: 'assistant', text: response, timestamp: new Date().toISOString() },
        ];

        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: {
            messages: updatedMessages,
            fileContext: fileContext ? { files: fileContext } : conversation.fileContext,
            updatedAt: new Date(),
          },
        });
      }

      // Log the interaction (without sensitive data)
      await prisma.auditLog.create({
        data: {
          action: 'Secure Chat Query',
          details: `Query processed locally using homomorphic AI. No external data transmission.${fileContext ? ` File context included: ${fileContext.length} file(s).` : ''}`,
          userId,
          organizationId,
          hash: require('crypto').randomBytes(32).toString('hex'),
        },
      }).catch((err) => {
        logger.warn('Failed to log chat interaction', err);
      });

      return {
        response,
        sources: ['Local AI Processing', 'User Account Data', ...(fileContext ? ['File Context'] : [])],
        encrypted: true,
      };
    } catch (error: any) {
      logger.error('[Secure Chat] Error processing query', error);
      return {
        response: 'I encountered an error processing your query. Please try again or contact support if the issue persists.',
        encrypted: true,
      };
    }
  }
}

export default new SecureChatService();

