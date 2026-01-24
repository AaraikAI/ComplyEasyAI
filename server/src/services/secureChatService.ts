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
        lowerMessage.includes('digital twin') || lowerMessage.includes('red team') || lowerMessage.includes('debt tracking') ||
        lowerMessage.includes('change impact') || lowerMessage.includes('agentic') || lowerMessage.includes('federated learning')) {
      const acosCoreFeatures = [
        KNOWLEDGE_BASE.features.acosGoals,
        KNOWLEDGE_BASE.features.acosControlLoops,
        KNOWLEDGE_BASE.features.acosDigitalTwin,
        KNOWLEDGE_BASE.features.acosRedTeam,
      ];

      let response = `**aCOS (Autonomous Compliance Operations System):**\n\n`;
      response += `aCOS is our breakthrough autonomous compliance engine that monitors your infrastructure 24/7 with AI agents, detects compliance drift in real-time, and auto-heals issues.\n\n`;
      
      response += `**Core aCOS Features (Growth+):**\n`;
      for (const feature of acosCoreFeatures) {
        const hasAccess = this.hasFeatureAccess(userTier, feature.featureKey);
        response += `${hasAccess ? '✅' : '🔒'} **${feature.name}**: ${feature.description}\n`;
        if (!hasAccess) {
          response += `   *Available with: ${feature.tiers.join(', ')}*\n`;
        }
        response += '\n';
      }

      // Advanced aCOS features (Visionary tier)
      if (userTier === 'Visionary') {
        response += `**Advanced aCOS Features (Visionary):**\n`;
        response += `- 📊 Compliance Debt Tracking - Track and prioritize technical debt\n`;
        response += `- 🔄 Change Impact Analysis - Predict compliance impact of changes\n`;
        response += `- 🤖 Agentic Actions - AI agents that take autonomous actions\n`;
        response += `- ✅ Evidence Truth - Verify evidence authenticity and integrity\n`;
        response += `- 📰 Regulatory Intelligence - Real-time regulatory updates\n`;
        response += `- 📈 Temporal Graphs - Time-series compliance analysis\n`;
        response += `- 🌐 Federated Learning - Privacy-preserving ML across organizations\n`;
        response += `- 🎭 Multi-Modal AI - Process text, images, and structured data\n`;
        response += `- 🏭 Physical AI - IoT and edge device compliance\n`;
        response += `- 🥽 VR Training - Immersive compliance training\n`;
        response += `- 🐝 Swarm Intelligence - Collaborative AI agents\n`;
        response += `- 🧠 Neuro-Symbolic AI - Combining neural and symbolic reasoning\n`;
        response += `- 🔐 Homomorphic Encryption - Compute on encrypted data\n`;
        response += `- 🎲 Monte Carlo Simulation - Risk prediction modeling\n`;
        response += `- ⚡ JIT Compliance - Just-in-time compliance verification\n`;
        response += `- 📊 Real-Time Compliance - Continuous real-time verification\n\n`;
      }

      if (!this.hasFeatureAccess(userTier, 'acosGoals')) {
        response += this.getUpgradeMessage('aCOS features', userTier, ['Growth', 'Visionary']);
      } else {
        response += `\n✅ You have access to aCOS features with your ${userTier} tier! Navigate to **aCOS Dashboard** to get started.`;
        if (userTier === 'Growth') {
          response += `\n\n💡 **Upgrade to Visionary** for advanced aCOS features like Compliance Debt Tracking, Change Impact Analysis, Agentic Actions, and more!`;
        }
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
    // NIST AI RMF QUERIES (Tier-Restricted: Visionary)
    // ========================================================================
    if (lowerMessage.includes('nist ai rmf') || lowerMessage.includes('nist ai risk management') || 
        lowerMessage.includes('ai rmf') || lowerMessage.includes('ai risk management framework') ||
        (lowerMessage.includes('nist') && (lowerMessage.includes('rmf') || lowerMessage.includes('risk management framework'))) ||
        lowerMessage.includes('nist rmf')) {
      const feature = KNOWLEDGE_BASE.features.nistAiRmf;
      const hasAccess = this.hasFeatureAccess(userTier, 'nistAiRmf');
      
      let response = `**NIST AI Risk Management Framework (AI RMF 1.0)**\n\n`;
      response += `The NIST AI RMF is a voluntary framework developed by the National Institute of Standards and Technology to help organizations manage risks associated with AI systems throughout their lifecycle.\n\n`;
      
      response += `**What is the NIST AI RMF?**\n`;
      response += `The AI RMF provides a structured approach to managing AI risks, focusing on trustworthy AI systems that are valid, reliable, safe, secure, resilient, accountable, transparent, explainable, privacy-enhanced, and fair.\n\n`;
      
      response += `**4 Core Functions:**\n`;
      response += `- 🏛️ **GOVERN** - Develop organizational culture and structure to manage AI risks\n`;
      response += `- 🗺️ **MAP** - Understand context and characterize risks\n`;
      response += `- 📊 **MEASURE** - Quantify, benchmark, and monitor risks\n`;
      response += `- 🎯 **MANAGE** - Prioritize and respond to risks\n\n`;
      
      response += `**7 Trustworthiness Characteristics:**\n`;
      response += `- ✅ Valid and Reliable - AI systems perform as intended\n`;
      response += `- 🛡️ Safe - AI systems operate without causing harm\n`;
      response += `- 🔒 Secure and Resilient - AI systems are protected from threats\n`;
      response += `- 📋 Accountable and Transparent - Clear responsibility and visibility\n`;
      response += `- 🔍 Explainable and Interpretable - Understandable AI decisions\n`;
      response += `- 🔐 Privacy-Enhanced - Protects individual privacy\n`;
      response += `- ⚖️ Fair with Harmful Bias Managed - Reduces unfair outcomes\n\n`;
      
      response += `**AI System Lifecycle Stages:**\n`;
      response += `- 📐 Plan and Design - Initial planning and design phase\n`;
      response += `- 📥 Collect and Process - Data collection and processing\n`;
      response += `- 🔨 Build and Validate - System development and validation\n`;
      response += `- 🚀 Deploy and Operate - Deployment and operational use\n`;
      response += `- 📈 Monitor and Maintain - Ongoing monitoring and maintenance\n\n`;
      
      response += `**Key Benefits:**\n`;
      response += `- Comprehensive risk management across AI lifecycle\n`;
      response += `- Structured approach to trustworthy AI\n`;
      response += `- Flexible implementation for different use cases\n`;
      response += `- Supports compliance with AI regulations\n`;
      response += `- Enables continuous improvement of AI systems\n\n`;

      if (!hasAccess) {
        response += this.getUpgradeMessage('NIST AI RMF Compliance', userTier, feature.tiers);
      } else {
        response += `✅ You have access to NIST AI RMF Compliance with your ${userTier} tier!\n\n`;
        response += `**ComplyEasyAI NIST AI RMF Features:**\n`;
        response += `- Complete framework implementation (all 4 core functions)\n`;
        response += `- 16 categories and 60+ subcategories tracking\n`;
        response += `- 7 trustworthiness characteristics scoring\n`;
        response += `- AI system lifecycle management\n`;
        response += `- Risk assessment and mitigation tracking\n`;
        response += `- Evidence collection and documentation\n`;
        response += `- Custom profiles for different use cases\n`;
        response += `- Comprehensive reporting and analytics\n\n`;
        response += `Navigate to **NIST AI RMF Dashboard** to manage your AI systems and risks.`;
      }

      return response;
    }

    // ========================================================================
    // SECURITY FEATURES QUERIES (Zero Trust, ZK Proofs, BYOK - Visionary)
    // ========================================================================
    if (lowerMessage.includes('security features') || lowerMessage.includes('security feature') ||
        lowerMessage.includes('zero trust') || lowerMessage.includes('zkp') || lowerMessage.includes('zero knowledge') || 
        lowerMessage.includes('byok') || lowerMessage.includes('bring your own key') || lowerMessage.includes('compliance as code')) {
      const securityFeatures = [
        KNOWLEDGE_BASE.features.zeroTrustSecurity,
        KNOWLEDGE_BASE.features.zkProofs,
        KNOWLEDGE_BASE.features.byokEncryption,
        KNOWLEDGE_BASE.features.complianceAsCode,
      ];

      let response = `**Advanced Security Features:**\n\n`;
      response += `ComplyEasyAI offers enterprise-grade security features designed for organizations with the highest security requirements.\n\n`;
      
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
      } else {
        response += `✅ You have access to all Advanced Security Features with your ${userTier} tier!\n\n`;
        response += `**Additional Security Capabilities:**\n`;
        response += `- 🔐 End-to-end encryption\n`;
        response += `- 🛡️ Role-based access control (RBAC)\n`;
        response += `- 📋 Audit logging and compliance tracking\n`;
        response += `- 🔒 Data encryption at rest and in transit\n`;
        response += `- 🚨 Security monitoring and alerts\n\n`;
        response += `Navigate to **Settings** → **Security** to configure these features.`;
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
    // ISSUE MANAGEMENT QUERIES (Check before risk queries to avoid conflicts)
    // ========================================================================
    if (lowerMessage.includes('issue management') || lowerMessage.includes('issue tracking') || 
        (lowerMessage.includes('issue') && (lowerMessage.includes('management') || lowerMessage.includes('tracking') || lowerMessage.includes('ticket')))) {
      const hasAccess = this.hasFeatureAccess(userTier, 'issueManagement');
      
      let response = `**Issue Management:**\n\n`;
      response += `Track and manage compliance issues, findings, and remediation tasks.\n\n`;
      response += `**Key Features:**\n`;
      response += `- 📋 Issue creation and tracking\n`;
      response += `- 🎯 Prioritization and assignment\n`;
      response += `- ✅ Resolution workflows\n`;
      response += `- 📊 Issue analytics and reporting\n`;
      response += `- 🔗 Link to controls and frameworks\n`;
      response += `- 📧 Automated notifications\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Issue Management', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Issue Management with your ${userTier} tier! Navigate to **Issues** to track compliance findings.`;
      }
      
      return response;
    }

    // ========================================================================
    // RISK-RELATED QUERIES (Original)
    // ========================================================================
    // Note: Check for 'issue' only if NOT about issue management (handled above)
    if (lowerMessage.includes('risk') || lowerMessage.includes('threat') || lowerMessage.includes('vulnerability') || 
        (lowerMessage.includes('issue') && !lowerMessage.includes('management') && !lowerMessage.includes('tracking'))) {
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
    // ENTERPRISE FEATURES QUERIES (Personnel, Vendor, Policy Library, Trust Center)
    // ========================================================================
    if (lowerMessage.includes('personnel') || lowerMessage.includes('employee management') || lowerMessage.includes('access review') ||
        lowerMessage.includes('onboarding') || lowerMessage.includes('offboarding')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'personnelManagement');
      
      let response = `**Personnel & Access Management:**\n\n`;
      response += `Comprehensive personnel management system for tracking employees, access rights, and compliance requirements.\n\n`;
      response += `**Key Features:**\n`;
      response += `- 👤 Employee onboarding/offboarding workflows\n`;
      response += `- 🔐 Access reviews and certification\n`;
      response += `- 🔗 SSO/SCIM integration ready\n`;
      response += `- 📋 Compliance tracking (background checks, training)\n`;
      response += `- ⚡ Automated access revocation\n`;
      response += `- 📊 Personnel compliance summary and reporting\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Personnel Management', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Personnel Management with your ${userTier} tier! Navigate to **Personnel Dashboard** to manage your team.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('vendor') || lowerMessage.includes('third party') || lowerMessage.includes('supplier') ||
        lowerMessage.includes('vendor risk') || lowerMessage.includes('vendor assessment')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'vendorRiskManagement');
      
      let response = `**Vendor & Third-Party Risk Management:**\n\n`;
      response += `Comprehensive vendor risk management system for assessing, monitoring, and managing third-party security risks.\n\n`;
      response += `**Key Features:**\n`;
      response += `- 📦 Vendor inventory management\n`;
      response += `- 📋 Vendor onboarding workflows\n`;
      response += `- 🔍 Security assessments & questionnaires\n`;
      response += `- 📊 Continuous vendor monitoring\n`;
      response += `- 📈 Vendor scorecards & dashboards\n`;
      response += `- ✅ Compliance certification tracking (SOC 2, ISO 27001, GDPR, HIPAA)\n`;
      response += `- 🎯 Risk-based vendor categorization\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Vendor Risk Management', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Vendor Risk Management with your ${userTier} tier! Navigate to **Vendor Dashboard** to manage your third-party risks.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('policy library') || lowerMessage.includes('policy management') || lowerMessage.includes('policy template')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'policyLibrary');
      
      let response = `**Policy Library:**\n\n`;
      response += `Centralized policy management system with version control, approval workflows, and cross-framework control mapping.\n\n`;
      response += `**Key Features:**\n`;
      response += `- 📚 100+ pre-built policy templates\n`;
      response += `- 📝 Policy version control and history\n`;
      response += `- ✅ Approval workflows\n`;
      response += `- 🔗 Cross-framework control mapping\n`;
      response += `- 📊 Policy analytics and usage tracking\n`;
      response += `- 🔍 Search and categorization\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Policy Library', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Policy Library with your ${userTier} tier! Navigate to **Policy Library** to manage your compliance policies.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('trust center') || lowerMessage.includes('trust portal') || lowerMessage.includes('public portal')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'trustCenter');
      
      let response = `**Trust Center:**\n\n`;
      response += `Public-facing trust portal to showcase your security posture and compliance certifications to customers and prospects.\n\n`;
      response += `**Key Features:**\n`;
      response += `- 🌐 Public-facing security portal\n`;
      response += `- 🏆 Certificate management and display\n`;
      response += `- 📄 Document sharing (SOC 2 reports, ISO certificates)\n`;
      response += `- 📊 Status page integration\n`;
      response += `- 🔗 Customizable branding\n`;
      response += `- 📈 Compliance metrics dashboard\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Trust Center', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Trust Center with your ${userTier} tier! Navigate to **Trust Center** to configure your public portal.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('workspace') || lowerMessage.includes('multi workspace') || lowerMessage.includes('organization hierarchy')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'multiWorkspace');
      
      let response = `**Multi-Workspace Support:**\n\n`;
      response += `Manage multiple workspaces and organizational hierarchies for enterprise deployments.\n\n`;
      response += `**Key Features:**\n`;
      response += `- 🏢 Multiple workspace management\n`;
      response += `- 🌳 Organization hierarchy support\n`;
      response += `- 🔄 Cross-workspace operations\n`;
      response += `- 👥 Centralized user management\n`;
      response += `- 📊 Consolidated reporting\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Multi-Workspace Support', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Multi-Workspace Support with your ${userTier} tier! Navigate to **Workspace Settings** to manage your workspaces.`;
      }
      
      return response;
    }

    // ========================================================================
    // INDIVIDUAL AI FEATURE QUERIES (Detailed responses for each)
    // ========================================================================
    if (lowerMessage.includes('policy generator') || lowerMessage.includes('generate policy')) {
      const feature = KNOWLEDGE_BASE.features.aiPolicyGeneration;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiPolicyGeneration');
      
      let response = `**AI Policy Generator:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**How it works:**\n`;
      response += `- Select a policy template (SOC 2, ISO 27001, GDPR, etc.)\n`;
      response += `- AI analyzes your organization's context\n`;
      response += `- Generates customized policy in minutes\n`;
      response += `- Review and edit as needed\n`;
      response += `- Export to Word, PDF, or markdown\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI Policy Generator', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI Policy Generator with your ${userTier} tier! Navigate to **AI Tools** → **Policy Generator** to get started.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('gap analysis') || lowerMessage.includes('compliance gap')) {
      const feature = KNOWLEDGE_BASE.features.aiGapAnalysis;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiGapAnalysis');
      
      let response = `**AI Gap Analysis:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**How it works:**\n`;
      response += `- Upload your existing documentation\n`;
      response += `- AI analyzes against target framework requirements\n`;
      response += `- Identifies missing controls and evidence\n`;
      response += `- Provides prioritized remediation roadmap\n`;
      response += `- Tracks progress toward compliance\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI Gap Analysis', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI Gap Analysis with your ${userTier} tier! Navigate to **AI Tools** → **Gap Analysis** to get started.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('contract analyzer') || lowerMessage.includes('analyze contract')) {
      const feature = KNOWLEDGE_BASE.features.aiContractAnalyzer;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiContractAnalyzer');
      
      let response = `**AI Contract Analyzer:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**What it detects:**\n`;
      response += `- Non-compliant clauses and terms\n`;
      response += `- Data protection and privacy issues\n`;
      response += `- Liability and risk concerns\n`;
      response += `- Missing security requirements\n`;
      response += `- GDPR/CCPA compliance issues\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI Contract Analyzer', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI Contract Analyzer with your ${userTier} tier! Navigate to **AI Tools** → **Contract Analyzer** to analyze contracts.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('rfp') || lowerMessage.includes('security questionnaire') || lowerMessage.includes('sig') || 
        lowerMessage.includes('caiq') || lowerMessage.includes('vsa')) {
      const feature = KNOWLEDGE_BASE.features.aiRfpGenerator;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiRfpGenerator');
      
      let response = `**AI RFP Responder:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**Supported formats:**\n`;
      response += `- SIG (Standard Information Gathering)\n`;
      response += `- CAIQ (Consensus Assessments Initiative Questionnaire)\n`;
      response += `- VSA (Vendor Security Assessment)\n`;
      response += `- Custom questionnaire formats\n\n`;
      response += `**Benefits:**\n`;
      response += `- 90% time reduction in questionnaire completion\n`;
      response += `- Consistent, accurate responses\n`;
      response += `- Automatic evidence linking\n`;
      response += `- Response library for reuse\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI RFP Responder', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI RFP Responder with your ${userTier} tier! Navigate to **AI Tools** → **RFP Responder** to get started.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('vendor scorer') || lowerMessage.includes('vendor risk scorer') || lowerMessage.includes('vendor assessment')) {
      const feature = KNOWLEDGE_BASE.features.aiVendorScorer;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiVendorScorer');
      
      let response = `**AI Vendor Scorer:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**What it evaluates:**\n`;
      response += `- Security posture and certifications\n`;
      response += `- Compliance with frameworks (SOC 2, ISO 27001, etc.)\n`;
      response += `- Data handling and privacy practices\n`;
      response += `- Incident history and response\n`;
      response += `- Financial stability indicators\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI Vendor Scorer', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI Vendor Scorer with your ${userTier} tier! Navigate to **Vendor Management** → **AI Scoring** to evaluate vendors.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('data mapper') || lowerMessage.includes('data mapping') || lowerMessage.includes('data discovery')) {
      const feature = KNOWLEDGE_BASE.features.aiDataMapper;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiDataMapper');
      
      let response = `**AI Data Mapper:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**What it discovers:**\n`;
      response += `- Sensitive data across databases\n`;
      response += `- Data in cloud storage (S3, Azure Blob, GCP)\n`;
      response += `- Data in file systems and applications\n`;
      response += `- Automatic classification (PII, PHI, PCI)\n`;
      response += `- Data flow mapping\n`;
      response += `- GDPR Article 30 record of processing\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI Data Mapper', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI Data Mapper with your ${userTier} tier! Navigate to **AI Tools** → **Data Mapper** to discover your data.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('phishing') || lowerMessage.includes('phishing simulator') || lowerMessage.includes('security training')) {
      const feature = KNOWLEDGE_BASE.features.aiPhishingSimulator;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiPhishingSimulator');
      
      let response = `**AI Phishing Simulator:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**Campaign types:**\n`;
      response += `- 📧 Email phishing campaigns\n`;
      response += `- 💬 SMS phishing (smishing)\n`;
      response += `- 📱 Social media phishing\n`;
      response += `- 📞 Voice phishing (vishing)\n\n`;
      response += `**Features:**\n`;
      response += `- Realistic, AI-generated phishing templates\n`;
      response += `- Automated campaign management\n`;
      response += `- Click and response tracking\n`;
      response += `- Training assignment for users who click\n`;
      response += `- Detailed reporting and analytics\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI Phishing Simulator', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI Phishing Simulator with your ${userTier} tier! Navigate to **Security Training** → **Phishing Simulator** to create campaigns.`;
      }
      
      return response;
    }

    if (lowerMessage.includes('bcp') || lowerMessage.includes('business continuity') || lowerMessage.includes('disaster recovery')) {
      const feature = KNOWLEDGE_BASE.features.aiBcpGenerator;
      const hasAccess = this.hasFeatureAccess(userTier, 'aiBcpGenerator');
      
      let response = `**AI BCP Generator:**\n\n`;
      response += `${feature.description}\n\n`;
      response += `**What it includes:**\n`;
      response += `- Business Impact Analysis (BIA)\n`;
      response += `- Recovery Time Objectives (RTO)\n`;
      response += `- Recovery Point Objectives (RPO)\n`;
      response += `- Recovery strategies and procedures\n`;
      response += `- Communication plans\n`;
      response += `- Testing and maintenance schedules\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('AI BCP Generator', userTier, feature.tiers);
      } else {
        response += `✅ You have access to AI BCP Generator with your ${userTier} tier! Navigate to **AI Tools** → **BCP Generator** to create your plan.`;
      }
      
      return response;
    }

    // ========================================================================
    // SPECIFIC FRAMEWORK QUERIES
    // ========================================================================
    if (lowerMessage.includes('soc 2') || lowerMessage.includes('soc2') || lowerMessage.includes('soc type')) {
      let response = `**SOC 2 Type I & II Compliance:**\n\n`;
      response += `Service Organization Control 2 (SOC 2) is a framework for managing data security, availability, processing integrity, confidentiality, and privacy.\n\n`;
      response += `**Trust Service Criteria (TSC):**\n`;
      response += `- 🔒 Security - Protection against unauthorized access\n`;
      response += `- ⚡ Availability - System availability for operation\n`;
      response += `- ✅ Processing Integrity - Complete, valid, accurate processing\n`;
      response += `- 🔐 Confidentiality - Confidential information protection\n`;
      response += `- 👤 Privacy - Personal information collection and use\n\n`;
      response += `**ComplyEasyAI SOC 2 Features:**\n`;
      response += `- Automated evidence collection\n`;
      response += `- Control implementation tracking\n`;
      response += `- Gap analysis and remediation\n`;
      response += `- Audit preparation and reporting\n`;
      response += `- Continuous monitoring\n\n`;
      response += `✅ SOC 2 is available in all tiers! Navigate to **Frameworks** → **SOC 2** to get started.`;
      
      return response;
    }

    if (lowerMessage.includes('iso 27001') || lowerMessage.includes('iso27001')) {
      let response = `**ISO 27001 Information Security Management:**\n\n`;
      response += `ISO/IEC 27001 is the international standard for information security management systems (ISMS).\n\n`;
      response += `**Key Domains:**\n`;
      response += `- Information Security Policies\n`;
      response += `- Organization of Information Security\n`;
      response += `- Human Resource Security\n`;
      response += `- Asset Management\n`;
      response += `- Access Control\n`;
      response += `- Cryptography\n`;
      response += `- Physical and Environmental Security\n`;
      response += `- Operations Security\n`;
      response += `- Communications Security\n`;
      response += `- System Acquisition, Development, and Maintenance\n`;
      response += `- Supplier Relationships\n`;
      response += `- Information Security Incident Management\n`;
      response += `- Business Continuity Management\n`;
      response += `- Compliance\n\n`;
      response += `**ComplyEasyAI ISO 27001 Features:**\n`;
      response += `- Complete control mapping (114 controls)\n`;
      response += `- Statement of Applicability (SOA) generation\n`;
      response += `- Risk assessment and treatment\n`;
      response += `- Continuous improvement tracking\n`;
      response += `- Certification audit support\n\n`;
      response += `✅ ISO 27001 is available in all tiers! Navigate to **Frameworks** → **ISO 27001** to get started.`;
      
      return response;
    }

    if (lowerMessage.includes('gdpr') && !lowerMessage.includes('dsa') && !lowerMessage.includes('dma')) {
      let response = `**GDPR (General Data Protection Regulation):**\n\n`;
      response += `EU Regulation 2016/679 governing data protection and privacy for EU citizens.\n\n`;
      response += `**Key Requirements:**\n`;
      response += `- 📋 Lawful basis for processing\n`;
      response += `- 👤 Data subject rights (access, rectification, erasure, portability)\n`;
      response += `- 🔐 Data protection by design and by default\n`;
      response += `- 📊 Data Protection Impact Assessments (DPIA)\n`;
      response += `- 🚨 Breach notification (72 hours)\n`;
      response += `- 📝 Records of processing activities (Article 30)\n`;
      response += `- 🛡️ Technical and organizational measures\n`;
      response += `- 🌍 Data transfer mechanisms (SCCs, adequacy decisions)\n\n`;
      response += `**ComplyEasyAI GDPR Features:**\n`;
      response += `- Data mapping and classification\n`;
      response += `- DPIA automation\n`;
      response += `- Consent management tracking\n`;
      response += `- Data subject request handling\n`;
      response += `- Breach notification workflows\n`;
      response += `- Article 30 record generation\n\n`;
      response += `✅ GDPR is available in all tiers! Navigate to **Frameworks** → **GDPR** to get started.`;
      
      return response;
    }

    if (lowerMessage.includes('hipaa') || lowerMessage.includes('hitech')) {
      let response = `**HIPAA & HITECH Compliance:**\n\n`;
      response += `Health Insurance Portability and Accountability Act (HIPAA) and HITECH Act govern protected health information (PHI) in the US.\n\n`;
      response += `**Key Requirements:**\n`;
      response += `- 🔐 Administrative Safeguards (policies, procedures)\n`;
      response += `- 🛡️ Physical Safeguards (facility access, workstation security)\n`;
      response += `- 🔒 Technical Safeguards (access control, encryption, audit logs)\n`;
      response += `- 📋 Breach notification requirements\n`;
      response += `- 📝 Business Associate Agreements (BAAs)\n`;
      response += `- 👤 Patient rights and access\n\n`;
      response += `**ComplyEasyAI HIPAA Features:**\n`;
      response += `- PHI discovery and classification\n`;
      response += `- BAA management and tracking\n`;
      response += `- Access control monitoring\n`;
      response += `- Breach notification workflows\n`;
      response += `- Risk assessment automation\n\n`;
      response += `✅ HIPAA is available in all tiers! Navigate to **Frameworks** → **HIPAA** to get started.`;
      
      return response;
    }

    // ========================================================================
    // INTEGRATIONS QUERIES
    // ========================================================================
    if (lowerMessage.includes('integration') || lowerMessage.includes('integrate') || lowerMessage.includes('connect')) {
      let response = `**Integrations:**\n\n`;
      response += `ComplyEasyAI integrates with 20+ services for automated evidence collection and monitoring.\n\n`;
      response += `**Cloud & Infrastructure:**\n`;
      response += `- ☁️ AWS (EC2, S3, IAM, CloudTrail, Config)\n`;
      response += `- ☁️ Azure (Virtual Machines, Storage, AD, Monitor)\n`;
      response += `- ☁️ GCP (Compute, Storage, IAM, Cloud Logging)\n\n`;
      response += `**Development & DevOps:**\n`;
      response += `- 🔧 GitHub (repositories, commits, pull requests)\n`;
      response += `- 🔧 GitLab (repositories, CI/CD pipelines)\n`;
      response += `- 🔧 Jira (issues, workflows, compliance tracking)\n\n`;
      response += `**Communication & Collaboration:**\n`;
      response += `- 💬 Slack (notifications, channel monitoring)\n`;
      response += `- 📧 Email (SMTP for notifications)\n\n`;
      response += `**Identity & Access:**\n`;
      response += `- 🔐 Okta (SSO, user provisioning)\n`;
      response += `- 🔐 Azure AD (SSO, directory sync)\n`;
      response += `- 🔐 Google Workspace (SSO, user management)\n\n`;
      response += `**Security & Monitoring:**\n`;
      response += `- 🛡️ SIEM integrations\n`;
      response += `- 📊 Monitoring tools (Datadog, New Relic)\n\n`;
      response += `Navigate to **Settings** → **Integrations** to connect your services.`;
      
      return response;
    }

    // ========================================================================
    // CONTINUOUS MONITORING QUERIES
    // ========================================================================
    if (lowerMessage.includes('monitoring') || lowerMessage.includes('continuous monitoring') || lowerMessage.includes('real-time monitoring')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'continuousMonitoring');
      
      let response = `**Continuous Monitoring:**\n\n`;
      response += `24/7 automated monitoring of your infrastructure, applications, and compliance controls.\n\n`;
      response += `**Key Features:**\n`;
      response += `- ⏰ Real-time control monitoring\n`;
      response += `- 🚨 Automated alerts and notifications\n`;
      response += `- 📊 Compliance dashboard updates\n`;
      response += `- 🔍 Evidence collection automation\n`;
      response += `- 📈 Trend analysis and reporting\n`;
      response += `- 🔄 Auto-remediation (with aCOS)\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Continuous Monitoring', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Continuous Monitoring with your ${userTier} tier! Navigate to **Monitoring** to view real-time compliance status.`;
      }
      
      return response;
    }

    // ========================================================================
    // ADVANCED REPORTING QUERIES
    // ========================================================================
    if (lowerMessage.includes('report') || lowerMessage.includes('reporting') || lowerMessage.includes('analytics')) {
      const hasAccess = this.hasFeatureAccess(userTier, 'advancedReporting');
      
      let response = `**Advanced Reporting & Analytics:**\n\n`;
      response += `Comprehensive reporting and analytics for compliance, risk, and security metrics.\n\n`;
      response += `**Report Types:**\n`;
      response += `- 📊 Compliance status reports\n`;
      response += `- ⚠️ Risk assessment reports\n`;
      response += `- 📈 Trend analysis and forecasting\n`;
      response += `- 🎯 Control effectiveness reports\n`;
      response += `- 📋 Audit-ready reports\n`;
      response += `- 📉 Executive dashboards\n\n`;
      response += `**Features:**\n`;
      response += `- Custom report builder\n`;
      response += `- Scheduled report delivery\n`;
      response += `- Export to PDF, Excel, CSV\n`;
      response += `- Interactive dashboards\n`;
      response += `- Data visualization\n\n`;
      
      if (!hasAccess) {
        response += this.getUpgradeMessage('Advanced Reporting', userTier, ['Essentials', 'Growth', 'Visionary']);
      } else {
        response += `✅ You have access to Advanced Reporting with your ${userTier} tier! Navigate to **Reports** to create and view analytics.`;
      }
      
      return response;
    }

    // ========================================================================
    // GENERAL HELP (Enhanced)
    // ========================================================================
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm your secure compliance assistant for ${context.organization?.name || 'your organization'}! I can help you with:\n\n` +
        `📋 **Compliance Frameworks** - Status, progress, setup guidance (SOC 2, ISO 27001, GDPR, HIPAA, etc.)\n` +
        `⚠️ **Risk Management** - View, prioritize, and remediate risks\n` +
        `📊 **Status & Progress** - Overall compliance dashboard\n` +
        `🔒 **Controls & Evidence** - Implementation tracking\n` +
        `🤖 **AI Features** - Policy Generator, Gap Analysis, Contract Analyzer, RFP Responder, Vendor Scorer, Data Mapper, Phishing Simulator, BCP Generator\n` +
        `🏢 **Enterprise Features** - Personnel Management, Vendor Risk, Policy Library, Trust Center\n` +
        `🚀 **aCOS** - Autonomous Compliance Operations System\n` +
        `🌍 **EU Regulations** - AI Act, DMA, DSA, NIST AI RMF\n` +
        `🔐 **Security Features** - Zero Trust, ZK Proofs, BYOK, Compliance-as-Code\n` +
        `🔗 **Integrations** - AWS, Azure, GCP, GitHub, Slack, Jira, Okta, etc.\n` +
        `💰 **Pricing & Plans** - Tier information, add-ons\n` +
        `🛠️ **Troubleshooting** - Common issues and solutions\n` +
        `📚 **Tutorials** - Getting started guides\n\n` +
        `**Your tier: ${userTier}** - I'll let you know if features require an upgrade.\n\n` +
        `🔐 All data processed locally - no external AI transmission.\n\n` +
        `Try: "What's my compliance status?" | "Tell me about aCOS" | "How does AI Policy Generator work?" | "What integrations are available?"`;
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

