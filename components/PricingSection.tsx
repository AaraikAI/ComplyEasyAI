import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import TierCard from './TierCard';
import DemoBookingForm from './DemoBookingForm';
import { useI18n } from '../contexts/I18nContext';
import {
  TierName,
  Tier,
  TierAddOn,
  SubscriptionDetails,
  TierComparison,
  UpgradePreview,
  TIER_ORDER,
  formatPrice,
  formatLimit,
} from '../types';

// ============================================================================
// TIER DATA (Frontend copy - matches backend config/tiers.ts)
// ============================================================================

const TIERS: Record<TierName, Tier> = {
  Foundation: {
    name: 'Foundation',
    displayName: 'Foundation',
    tagline: 'Start Your Compliance Journey',
    description: 'Perfect for startups and SMBs beginning their compliance journey.',
    targetAudience: 'Startups/SMBs worldwide',
    pricing: {
      annualMin: 8500,
      annualMax: 8500,
      monthlyMultiplier: 2,
      monthlyMin: 1417, // (8500 * 2) / 12 = 1416.67
      monthlyMax: 1417,
      netAfterStripeMin: 8253, // Annual: 8500 - (8500 * 0.029 + 0.30) = 8253.20
      netAfterStripeMax: 8253,
      margin: '>92%',
    },
    limits: {
      maxUsers: 10,
      maxFrameworks: 3,
      maxWorkspaces: 1,
      maxQuestionnairesPerMonth: 5,
      maxVendors: 10,
      maxPolicies: 25,
      maxIntegrations: 3,
      maxCustomReports: 5,
      maxMonitors: 5,
      maxIssues: 50,
      maxRiskAssessments: 10,
      maxAiRequestsPerMonth: 100,
      maxStorageGB: 5,
      maxApiRequestsPerDay: 1000,
      dataRetentionDays: 365,
    },
    features: {
      authentication: true, twoFactorAuth: true, complianceFrameworks: true,
      riskManagement: true, auditLogging: true, dashboard: true, teamManagement: true,
      aiPolicyGeneration: true, aiGapAnalysis: true,
      aiContractAnalyzer: false, aiRfpGenerator: false, aiPhishingSimulator: false,
      aiVendorScorer: false, aiDataMapper: false, aiBcpGenerator: false,
      personnelManagement: false, vendorRiskManagement: false, policyLibrary: false,
      trustCenter: false, multiWorkspace: false, advancedReporting: false,
      continuousMonitoring: true, issueManagement: false,
      acosGoals: false, acosControlLoops: false, acosDebtTracking: false,
      acosChangeImpact: false, acosAgenticActions: false, acosEvidenceTruth: false,
      acosRegulatoryIntelligence: false, acosTemporalGraphs: false, acosDigitalTwin: false,
      acosRedTeam: false, acosFederatedLearning: false, acosMultiModal: false,
      customFrameworks: false,
      acosPhysicalAi: false, acosVrTraining: false, acosSwarmIntelligence: false,
      acosNeuroSymbolic: false, acosHomomorphicEncryption: false, acosMonteCarlo: false,
      acosRiskPrediction: false, acosJitCompliance: false, acosRealTimeCompliance: false,
      zeroTrustSecurity: false, zkProofs: false, byokEncryption: false,
      complianceAsCode: false, iotEdgeCompliance: false,
      nistAiRmf: false, euAiAct: false, dsa: false, dma: false,
      slaGuarantee: false, dedicatedSupport: false, onPremDeployment: false,
      customAiModels: false, prioritySupport: false, whiteGloveOnboarding: false,
      customFrameworksAddOn: false, onPremAddOn: false, customAiAddOn: false,
    },
    highlights: ['Core auth with 2FA', '3 frameworks', 'Basic AI', 'Audit logging'],
    growthDrivers: ['Entry tier', 'Low barrier', 'Upsell path'],
  },
  Essentials: {
    name: 'Essentials',
    displayName: 'Essentials',
    tagline: 'Complete Compliance Toolkit',
    description: 'Full-featured compliance platform with advanced AI.',
    targetAudience: 'Growing SMBs (10-100 users)',
    pricing: {
      annualMin: 17000,
      annualMax: 17000,
      monthlyMultiplier: 1.5,
      monthlyMin: 2125, // (17000 * 1.5) / 12 = 2125
      monthlyMax: 2125,
      netAfterStripeMin: 16507, // Annual: 17000 - (17000 * 0.029 + 0.30) = 16506.70
      netAfterStripeMax: 16507,
      margin: '90%+',
    },
    limits: {
      maxUsers: 100,
      maxFrameworks: 10,
      maxWorkspaces: 5,
      maxQuestionnairesPerMonth: 50,
      maxVendors: 100,
      maxPolicies: 250,
      maxIntegrations: 15,
      maxCustomReports: 50,
      maxMonitors: 50,
      maxIssues: 500,
      maxRiskAssessments: 100,
      maxAiRequestsPerMonth: 1000,
      maxStorageGB: 50,
      maxApiRequestsPerDay: 10000,
      dataRetentionDays: 730,
    },
    features: {
      authentication: true, twoFactorAuth: true, complianceFrameworks: true,
      riskManagement: true, auditLogging: true, dashboard: true, teamManagement: true,
      aiPolicyGeneration: true, aiGapAnalysis: true,
      aiContractAnalyzer: true, aiRfpGenerator: true, aiPhishingSimulator: true,
      aiVendorScorer: true, aiDataMapper: true, aiBcpGenerator: true,
      personnelManagement: true, vendorRiskManagement: true, policyLibrary: true,
      trustCenter: true, multiWorkspace: true, advancedReporting: true,
      continuousMonitoring: true, issueManagement: true,
      acosGoals: false, acosControlLoops: false, acosDebtTracking: false,
      acosChangeImpact: false, acosAgenticActions: false, acosEvidenceTruth: false,
      acosRegulatoryIntelligence: false, acosTemporalGraphs: false, acosDigitalTwin: false,
      acosRedTeam: false, acosFederatedLearning: false, acosMultiModal: false,
      customFrameworks: false,
      acosPhysicalAi: false, acosVrTraining: false, acosSwarmIntelligence: false,
      acosNeuroSymbolic: false, acosHomomorphicEncryption: false, acosMonteCarlo: false,
      acosRiskPrediction: false, acosJitCompliance: false, acosRealTimeCompliance: false,
      zeroTrustSecurity: false, zkProofs: false, byokEncryption: false,
      complianceAsCode: false, iotEdgeCompliance: false,
      nistAiRmf: false, euAiAct: false, dsa: false, dma: false,
      slaGuarantee: false, dedicatedSupport: false, onPremDeployment: false,
      customAiModels: false, prioritySupport: true, whiteGloveOnboarding: false,
      customFrameworksAddOn: false, onPremAddOn: false, customAiAddOn: false,
    },
    highlights: ['Full AI suite', 'Vendor management', 'Policy library', 'Multi-workspace'],
    growthDrivers: ['Superior AI', 'Lower cost than competitors'],
  },
  Growth: {
    name: 'Growth',
    displayName: 'Growth',
    tagline: 'Autonomous Compliance Excellence',
    description: 'Advanced aCOS for mid-market and MSPs.',
    targetAudience: 'Mid-market/MSPs (100-1k users)',
    pricing: {
      annualMin: 42500,
      annualMax: 65000,
      monthlyMultiplier: 1.0,
      monthlyMin: 3542,
      monthlyMax: 5417,
      netAfterStripeMin: 41233,
      netAfterStripeMax: 63115,
      margin: '88%',
    },
    limits: {
      maxUsers: 1000,
      maxFrameworks: 50,
      maxWorkspaces: 25,
      maxQuestionnairesPerMonth: 500,
      maxVendors: 1000,
      maxPolicies: 2500,
      maxIntegrations: 50,
      maxCustomReports: 250,
      maxMonitors: 250,
      maxIssues: 5000,
      maxRiskAssessments: 1000,
      maxAiRequestsPerMonth: 10000,
      maxStorageGB: 500,
      maxApiRequestsPerDay: 100000,
      dataRetentionDays: 1825,
    },
    features: {
      authentication: true, twoFactorAuth: true, complianceFrameworks: true,
      riskManagement: true, auditLogging: true, dashboard: true, teamManagement: true,
      aiPolicyGeneration: true, aiGapAnalysis: true,
      aiContractAnalyzer: true, aiRfpGenerator: true, aiPhishingSimulator: true,
      aiVendorScorer: true, aiDataMapper: true, aiBcpGenerator: true,
      personnelManagement: true, vendorRiskManagement: true, policyLibrary: true,
      trustCenter: true, multiWorkspace: true, advancedReporting: true,
      continuousMonitoring: true, issueManagement: true,
      acosGoals: true, acosControlLoops: true, acosDebtTracking: true,
      acosChangeImpact: true, acosAgenticActions: true, acosEvidenceTruth: true,
      acosRegulatoryIntelligence: true, acosTemporalGraphs: true, acosDigitalTwin: true,
      acosRedTeam: true, acosFederatedLearning: true, acosMultiModal: true,
      customFrameworks: true,
      acosPhysicalAi: false, acosVrTraining: false, acosSwarmIntelligence: false,
      acosNeuroSymbolic: false, acosHomomorphicEncryption: false, acosMonteCarlo: false,
      acosRiskPrediction: false, acosJitCompliance: false, acosRealTimeCompliance: false,
      zeroTrustSecurity: false, zkProofs: false, byokEncryption: false,
      complianceAsCode: false, iotEdgeCompliance: false,
      nistAiRmf: false, euAiAct: false, dsa: false, dma: false,
      slaGuarantee: true, dedicatedSupport: false, onPremDeployment: false,
      customAiModels: false, prioritySupport: true, whiteGloveOnboarding: true,
      customFrameworksAddOn: true, onPremAddOn: false, customAiAddOn: false,
    },
    highlights: ['Full aCOS v3.0', 'Agentic actions', 'Digital twin', 'Red team'],
    growthDrivers: ['MSP partnerships', 'Global appeal'],
  },
  Visionary: {
    name: 'Visionary',
    displayName: 'Visionary',
    tagline: 'Future-Proof Compliance Innovation',
    description: 'Cutting-edge compliance technology for enterprises.',
    targetAudience: 'Large corps/gov (1k+ users)',
    pricing: {
      annualMin: 68000,
      annualMax: 170000,
      monthlyMultiplier: 1.0,
      monthlyMin: 5667,
      monthlyMax: 14167,
      netAfterStripeMin: 66012,
      netAfterStripeMax: 165022,
      margin: '85%+',
    },
    limits: {
      maxUsers: -1,
      maxFrameworks: -1,
      maxWorkspaces: -1,
      maxQuestionnairesPerMonth: -1,
      maxVendors: -1,
      maxPolicies: -1,
      maxIntegrations: -1,
      maxCustomReports: -1,
      maxMonitors: -1,
      maxIssues: -1,
      maxRiskAssessments: -1,
      maxAiRequestsPerMonth: -1,
      maxStorageGB: -1,
      maxApiRequestsPerDay: -1,
      dataRetentionDays: 3650,
    },
    features: {
      authentication: true, twoFactorAuth: true, complianceFrameworks: true,
      riskManagement: true, auditLogging: true, dashboard: true, teamManagement: true,
      aiPolicyGeneration: true, aiGapAnalysis: true,
      aiContractAnalyzer: true, aiRfpGenerator: true, aiPhishingSimulator: true,
      aiVendorScorer: true, aiDataMapper: true, aiBcpGenerator: true,
      personnelManagement: true, vendorRiskManagement: true, policyLibrary: true,
      trustCenter: true, multiWorkspace: true, advancedReporting: true,
      continuousMonitoring: true, issueManagement: true,
      acosGoals: true, acosControlLoops: true, acosDebtTracking: true,
      acosChangeImpact: true, acosAgenticActions: true, acosEvidenceTruth: true,
      acosRegulatoryIntelligence: true, acosTemporalGraphs: true, acosDigitalTwin: true,
      acosRedTeam: true, acosFederatedLearning: true, acosMultiModal: true,
      customFrameworks: true,
      acosPhysicalAi: true, acosVrTraining: true, acosSwarmIntelligence: true,
      acosNeuroSymbolic: true, acosHomomorphicEncryption: true, acosMonteCarlo: true,
      acosRiskPrediction: true, acosJitCompliance: true, acosRealTimeCompliance: true,
      zeroTrustSecurity: true, zkProofs: true, byokEncryption: true,
      complianceAsCode: true, iotEdgeCompliance: true,
      nistAiRmf: true, euAiAct: true, dsa: true, dma: true,
      slaGuarantee: true, dedicatedSupport: true, onPremDeployment: true,
      customAiModels: true, prioritySupport: true, whiteGloveOnboarding: true,
      customFrameworksAddOn: true, onPremAddOn: true, customAiAddOn: true,
    },
    highlights: ['NIST AI RMF', 'EU AI Act', 'DSA & DMA', 'Zero Trust', 'On-prem'],
    growthDrivers: ['Enterprise positioning', 'Thought leadership'],
  },
};

const ALL_TIERS: TierName[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];

const TIER_ADD_ONS: TierAddOn[] = [
  {
    id: 'custom-frameworks',
    name: 'Custom Frameworks Add-On',
    description: 'Build unlimited proprietary compliance frameworks. For regulated industries (defense, aerospace, pharma).',
    priceAnnual: 2997,
    availableForTiers: [...ALL_TIERS],
  },
  {
    id: 'on-prem-deployment',
    name: 'On-Premises Deployment',
    description: "Deploy on customer's AWS/Azure/GCP. Government, financial institutions, healthcare.",
    priceOneTime: 19997,
    priceAnnual: 9997,
    availableForTiers: [...ALL_TIERS],
  },
  {
    id: 'custom-ai-models',
    name: 'Custom AI Models',
    description: 'Fine-tuned models on customer data. Enterprises with unique terminology/workflows.',
    priceOneTime: 14997,
    priceAnnual: 4997,
    availableForTiers: [...ALL_TIERS],
  },
  {
    id: 'vciso-service',
    name: 'Dedicated vCISO Service',
    description: 'Compliance advisory from certified experts. 10 hours/month consulting. For companies without internal GRC teams.',
    priceAnnual: 9997,
    startingFrom: true,
    availableForTiers: [...ALL_TIERS],
  },
  {
    id: 'audit-bundling',
    name: 'Audit Bundling (Partner Network)',
    description: 'Pre-negotiated rates with audit firms. Variable $8,000–$30,000 depending on audit. Everyone getting certified.',
    priceAnnual: 0,
    availableForTiers: [...ALL_TIERS],
  },
];

// ============================================================================
// PRICING SECTION COMPONENT
// ============================================================================

interface PricingSectionProps {
  currentTier?: TierName;
  onSelectTier?: (tier: TierName, billingCycle: 'monthly' | 'annual') => void;
  loading?: boolean;
  embedded?: boolean; // If true, shows a more compact version
}

const PricingSection: React.FC<PricingSectionProps> = ({
  currentTier,
  onSelectTier,
  loading = false,
  embedded = false,
}) => {
  const { t } = useI18n();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showComparison, setShowComparison] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDemoTier, setSelectedDemoTier] = useState<TierName | undefined>(undefined);

  const handleSelectTier = (tierName: TierName) => {
    if (onSelectTier) {
      onSelectTier(tierName, billingCycle);
    }
  };

  const handleBookDemo = (tierName?: TierName) => {
    setSelectedDemoTier(tierName);
    setShowDemoModal(true);
  };

  const currentTierIndex = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;

  return (
    <div className={embedded ? '' : 'py-16 px-4 sm:px-6 lg:px-8 bg-gray-50'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!embedded && (
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Compliance Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              From startups to enterprises, we have the perfect plan to help you achieve
              and maintain compliance excellence.
            </p>
            <button
              onClick={() => handleBookDemo()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Calendar size={20} />
              Book a Demo
            </button>
          </div>
        )}

        {/* Book a Demo CTA for embedded mode */}
        {embedded && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => handleBookDemo()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Calendar size={20} />
              Book a Demo
            </button>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="relative bg-gray-100 rounded-xl p-1 flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('subscription.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('subscription.annual')}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save 15-20%
              </span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="ml-3 text-gray-600">{t('common.loading')}</span>
          </div>
        )}

        {/* Tier Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {TIER_ORDER.map((tierName, index) => {
              const tier = TIERS[tierName];
              const isCurrentTier = currentTier === tierName;
              const isUpgrade = currentTierIndex >= 0 && index > currentTierIndex;
              const isDowngrade = currentTierIndex >= 0 && index < currentTierIndex;

              return (
                <TierCard
                  key={tierName}
                  tier={tier}
                  isCurrentTier={isCurrentTier}
                  isPopular={tierName === 'Growth'}
                  onSelect={handleSelectTier}
                  onBookDemo={handleBookDemo}
                  billingCycle={billingCycle}
                  isUpgrade={isUpgrade}
                  isDowngrade={isDowngrade}
                  canDowngrade={isDowngrade && !isCurrentTier}
                />
              );
            })}
          </div>
        )}

        {/* Feature Comparison Toggle */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-800 font-medium"
          >
            {showComparison ? 'Hide' : 'Show'} detailed feature comparison
            {showComparison ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Feature Comparison Table */}
        {showComparison && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  {TIER_ORDER.map((tierName) => (
                    <th
                      key={tierName}
                      className="px-4 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      {tierName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Core Features */}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">
                    Core Features
                  </td>
                </tr>
                <FeatureRow feature="2FA Authentication" tiers={TIERS} featureKey="twoFactorAuth" />
                <FeatureRow feature="Compliance Frameworks" tiers={TIERS} featureKey="complianceFrameworks" />
                <FeatureRow feature="Risk Management" tiers={TIERS} featureKey="riskManagement" />
                <FeatureRow feature="Audit Logging" tiers={TIERS} featureKey="auditLogging" />

                {/* AI Features */}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">
                    AI Features
                  </td>
                </tr>
                <FeatureRow feature="AI Policy Generation" tiers={TIERS} featureKey="aiPolicyGeneration" />
                <FeatureRow feature="AI Gap Analysis" tiers={TIERS} featureKey="aiGapAnalysis" />
                <FeatureRow feature="AI Contract Analyzer" tiers={TIERS} featureKey="aiContractAnalyzer" />
                <FeatureRow feature="AI RFP Generator" tiers={TIERS} featureKey="aiRfpGenerator" />
                <FeatureRow feature="AI Vendor Scorer" tiers={TIERS} featureKey="aiVendorScorer" />

                {/* Enterprise Features */}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">
                    Enterprise Features
                  </td>
                </tr>
                <FeatureRow feature="Personnel Management" tiers={TIERS} featureKey="personnelManagement" />
                <FeatureRow feature="Vendor Risk Management" tiers={TIERS} featureKey="vendorRiskManagement" />
                <FeatureRow feature="Multi-Workspace" tiers={TIERS} featureKey="multiWorkspace" />
                <FeatureRow feature="Advanced Reporting" tiers={TIERS} featureKey="advancedReporting" />

                {/* aCOS Features */}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">
                    aCOS v3.0 (Autonomous Compliance)
                  </td>
                </tr>
                <FeatureRow feature="Compliance Goals" tiers={TIERS} featureKey="acosGoals" />
                <FeatureRow feature="Control Loops" tiers={TIERS} featureKey="acosControlLoops" />
                <FeatureRow feature="Agentic Actions" tiers={TIERS} featureKey="acosAgenticActions" />
                <FeatureRow feature="Digital Twin" tiers={TIERS} featureKey="acosDigitalTwin" />
                <FeatureRow feature="Red Team Simulations" tiers={TIERS} featureKey="acosRedTeam" />

                {/* EU Regulations & AI Governance */}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">
                    EU Regulations & AI Governance
                  </td>
                </tr>
                <FeatureRow feature="NIST AI RMF Framework" tiers={TIERS} featureKey="nistAiRmf" />
                <FeatureRow feature="EU AI Act Compliance" tiers={TIERS} featureKey="euAiAct" />
                <FeatureRow feature="Digital Services Act (DSA)" tiers={TIERS} featureKey="dsa" />
                <FeatureRow feature="Digital Markets Act (DMA)" tiers={TIERS} featureKey="dma" />

                {/* Visionary Features */}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">
                    Visionary Features
                  </td>
                </tr>
                <FeatureRow feature="VR Training" tiers={TIERS} featureKey="acosVrTraining" />
                <FeatureRow feature="Zero Trust Security" tiers={TIERS} featureKey="zeroTrustSecurity" />
                <FeatureRow feature="ZK Proofs" tiers={TIERS} featureKey="zkProofs" />
                <FeatureRow feature="BYOK Encryption" tiers={TIERS} featureKey="byokEncryption" />
                <FeatureRow feature="On-Premises Deployment" tiers={TIERS} featureKey="onPremDeployment" />

              </tbody>
            </table>
          </div>
        )}

        {/* Add-ons Section */}
        {!embedded && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Enhance Your Plan with Add-ons
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TIER_ADD_ONS.map((addon) => (
                <div
                  key={addon.id}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-8 h-8 text-brand-600" />
                    <h4 className="text-lg font-semibold text-gray-900">{addon.name}</h4>
                  </div>
                  <p className="text-gray-600 mb-4">{addon.description}</p>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {addon.priceOneTime !== null && addon.priceOneTime > 0
                      ? `${formatPrice(addon.priceOneTime)} one-time + ${formatPrice(addon.priceAnnual)}/yr`
                      : addon.priceAnnual === 0
                        ? 'Variable (contact sales)'
                        : `${addon.startingFrom ? 'Starting from ' : ''}${formatPrice(addon.priceAnnual)}/yr`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Available for: {addon.availableForTiers.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Badges */}
        {!embedded && (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-6">
              Trusted by compliance teams worldwide
            </p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm">SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm">ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm">HIPAA Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Booking Modal */}
      <DemoBookingForm
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        preselectedTier={selectedDemoTier}
        source="pricing_page"
      />
    </div>
  );
};

// Helper Components
const FeatureRow: React.FC<{
  feature: string;
  tiers: Record<TierName, Tier>;
  featureKey: keyof Tier['features'];
}> = ({ feature, tiers, featureKey }) => (
  <tr>
    <td className="px-6 py-3 text-sm text-gray-700">{feature}</td>
    {TIER_ORDER.map((tierName) => (
      <td key={tierName} className="px-4 py-3 text-center">
        {tiers[tierName].features[featureKey] ? (
          <Check className="w-5 h-5 text-green-500 mx-auto" />
        ) : (
          <X className="w-5 h-5 text-gray-300 mx-auto" />
        )}
      </td>
    ))}
  </tr>
);

const LimitRow: React.FC<{
  label: string;
  tiers: Record<TierName, Tier>;
  limitKey: keyof Tier['limits'];
}> = ({ label, tiers, limitKey }) => (
  <tr>
    <td className="px-6 py-3 text-sm text-gray-700">{label}</td>
    {TIER_ORDER.map((tierName) => (
      <td key={tierName} className="px-4 py-3 text-center text-sm font-medium text-gray-900">
        {formatLimit(tiers[tierName].limits[limitKey])}
      </td>
    ))}
  </tr>
);

export default PricingSection;
