/**
 * Corporate Sustainability Reporting Directive (CSRD) Dashboard
 *
 * Comprehensive management interface for CSRD compliance:
 * - ESG reporting with ESRS (European Sustainability Reporting Standards) topics
 * - Double materiality assessment (impact + financial materiality matrix)
 * - Environmental metrics: GHG emissions (Scope 1,2,3), water, waste, biodiversity
 * - Social metrics: workforce diversity, pay gap, health & safety, human rights
 * - Governance metrics: board composition, anti-corruption, lobbying
 * - CSRD compliance timeline tracking
 * - Sustainability statement generator
 *
 * Reference: Directive (EU) 2022/2464
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import {
  Leaf, BarChart3, Users, Building2, FileText, CheckCircle, AlertTriangle,
  X, Plus, Search, Download, Clock, Shield, TrendingUp, Droplets,
  Trash2, TreePine, Globe, Heart, Scale, Eye, Edit, ChevronRight,
  AlertCircle, ArrowUpRight, Zap, Factory, Recycle, Wind
} from 'lucide-react';

// ── Data Models ──────────────────────────────────────────────────────────

type MaterialityLevel = 'high' | 'medium' | 'low' | 'not_material';
type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_started';
type ReportStatus = 'draft' | 'in_review' | 'approved' | 'published';
type TabKey = 'overview' | 'materiality' | 'environmental' | 'social' | 'governance' | 'reports';

interface MaterialityTopic {
  id: string;
  esrsStandard: string;
  topic: string;
  category: 'environmental' | 'social' | 'governance';
  impactMateriality: MaterialityLevel;
  financialMateriality: MaterialityLevel;
  overallMateriality: MaterialityLevel;
  description: string;
  stakeholdersAffected: string[];
  dataCollectionStatus: ComplianceStatus;
}

interface GHGEmissions {
  scope1: { total: number; breakdown: { source: string; value: number; unit: string }[] };
  scope2: { locationBased: number; marketBased: number; unit: string };
  scope3: { total: number; categories: { name: string; value: number; unit: string; estimated: boolean }[] };
  baselineYear: number;
  reductionTarget: number;
  reductionAchieved: number;
}

interface EnvironmentalMetrics {
  ghg: GHGEmissions;
  waterUsage: { total: number; recycled: number; unit: string; waterStressAreas: boolean };
  waste: { totalGenerated: number; recycled: number; landfill: number; hazardous: number; unit: string };
  biodiversity: { sitesNearProtectedAreas: number; landUseChange: number; restorationProjects: number; score: number };
  energyConsumption: { total: number; renewable: number; nonRenewable: number; unit: string; efficiencyImprovement: number };
  pollution: { airEmissions: number; waterDischarges: number; microplastics: number; unit: string };
}

interface SocialMetrics {
  workforce: {
    totalEmployees: number;
    fullTime: number;
    partTime: number;
    contractors: number;
    femalePercentage: number;
    diversityIndex: number;
    turnoverRate: number;
  };
  payGap: { genderPayGap: number; ceoToMedianRatio: number; livingWageCompliance: number };
  healthSafety: {
    incidentRate: number;
    fatalityCount: number;
    lostTimeInjuryRate: number;
    trainingHoursPerEmployee: number;
    wellbeingProgramCoverage: number;
  };
  humanRights: {
    dueDiligenceCompleted: boolean;
    supplyChainAudits: number;
    grievancesReported: number;
    grievancesResolved: number;
    childLabourRisk: MaterialityLevel;
    forcedLabourRisk: MaterialityLevel;
  };
  communityEngagement: { investmentAmount: number; projectsSupported: number; stakeholderConsultations: number };
}

interface GovernanceMetrics {
  board: {
    totalMembers: number;
    independentMembers: number;
    femaleMembers: number;
    sustainabilityExpertise: number;
    meetingsPerYear: number;
    avgTenureYears: number;
  };
  antiCorruption: {
    policyInPlace: boolean;
    trainingCoverage: number;
    incidentsReported: number;
    whistleblowerProtection: boolean;
    politicalContributions: number;
  };
  lobbying: {
    totalSpend: number;
    topicsEngaged: string[];
    tradeAssociations: number;
    transparencyRegisterCompliant: boolean;
  };
  riskManagement: {
    esgRisksIdentified: number;
    mitigationPlansInPlace: number;
    climateScenarioAnalysis: boolean;
    transitionPlanPublished: boolean;
  };
}

interface SustainabilityReport {
  id: string;
  title: string;
  reportingYear: number;
  status: ReportStatus;
  createdDate: string;
  lastModified: string;
  assuranceProvider: string;
  assuranceLevel: 'limited' | 'reasonable' | 'none';
  esrsTopicsCovered: string[];
  completionPercentage: number;
}

// ── Default Data ─────────────────────────────────────────────────────────

const DEFAULT_MATERIALITY_TOPICS: MaterialityTopic[] = [
  { id: 'mt-1', esrsStandard: 'ESRS E1', topic: 'Climate Change', category: 'environmental', impactMateriality: 'high', financialMateriality: 'high', overallMateriality: 'high', description: 'GHG emissions, energy consumption, and climate change adaptation and mitigation.', stakeholdersAffected: ['Investors', 'Communities', 'Regulators'], dataCollectionStatus: 'partial' },
  { id: 'mt-2', esrsStandard: 'ESRS E2', topic: 'Pollution', category: 'environmental', impactMateriality: 'medium', financialMateriality: 'medium', overallMateriality: 'medium', description: 'Air, water, and soil pollution from operations and products.', stakeholdersAffected: ['Communities', 'Regulators', 'NGOs'], dataCollectionStatus: 'partial' },
  { id: 'mt-3', esrsStandard: 'ESRS E3', topic: 'Water and Marine Resources', category: 'environmental', impactMateriality: 'medium', financialMateriality: 'low', overallMateriality: 'medium', description: 'Water consumption, water stress, and impact on marine ecosystems.', stakeholdersAffected: ['Communities', 'Regulators'], dataCollectionStatus: 'not_started' },
  { id: 'mt-4', esrsStandard: 'ESRS E4', topic: 'Biodiversity and Ecosystems', category: 'environmental', impactMateriality: 'low', financialMateriality: 'low', overallMateriality: 'low', description: 'Impact on ecosystems, species, and natural habitats.', stakeholdersAffected: ['Communities', 'NGOs'], dataCollectionStatus: 'not_started' },
  { id: 'mt-5', esrsStandard: 'ESRS E5', topic: 'Resource Use and Circular Economy', category: 'environmental', impactMateriality: 'high', financialMateriality: 'medium', overallMateriality: 'high', description: 'Material use, waste generation, and circular economy practices.', stakeholdersAffected: ['Investors', 'Customers', 'Regulators'], dataCollectionStatus: 'partial' },
  { id: 'mt-6', esrsStandard: 'ESRS S1', topic: 'Own Workforce', category: 'social', impactMateriality: 'high', financialMateriality: 'high', overallMateriality: 'high', description: 'Working conditions, equal treatment, and employee well-being.', stakeholdersAffected: ['Employees', 'Unions', 'Regulators'], dataCollectionStatus: 'compliant' },
  { id: 'mt-7', esrsStandard: 'ESRS S2', topic: 'Workers in the Value Chain', category: 'social', impactMateriality: 'high', financialMateriality: 'medium', overallMateriality: 'high', description: 'Working conditions and human rights in the supply chain.', stakeholdersAffected: ['Supply Chain Workers', 'NGOs', 'Investors'], dataCollectionStatus: 'partial' },
  { id: 'mt-8', esrsStandard: 'ESRS S3', topic: 'Affected Communities', category: 'social', impactMateriality: 'medium', financialMateriality: 'low', overallMateriality: 'medium', description: 'Impact on communities where the company operates.', stakeholdersAffected: ['Local Communities', 'NGOs'], dataCollectionStatus: 'not_started' },
  { id: 'mt-9', esrsStandard: 'ESRS S4', topic: 'Consumers and End-Users', category: 'social', impactMateriality: 'medium', financialMateriality: 'medium', overallMateriality: 'medium', description: 'Product safety, data protection, and responsible marketing.', stakeholdersAffected: ['Customers', 'Regulators'], dataCollectionStatus: 'partial' },
  { id: 'mt-10', esrsStandard: 'ESRS G1', topic: 'Business Conduct', category: 'governance', impactMateriality: 'high', financialMateriality: 'high', overallMateriality: 'high', description: 'Corporate governance, anti-corruption, lobbying, and business ethics.', stakeholdersAffected: ['Investors', 'Regulators', 'Public'], dataCollectionStatus: 'compliant' },
];

const DEFAULT_ENVIRONMENTAL: EnvironmentalMetrics = {
  ghg: {
    scope1: { total: 12450, breakdown: [{ source: 'Natural Gas', value: 5200, unit: 'tCO2e' }, { source: 'Fleet Vehicles', value: 3800, unit: 'tCO2e' }, { source: 'Refrigerants', value: 2150, unit: 'tCO2e' }, { source: 'Process Emissions', value: 1300, unit: 'tCO2e' }] },
    scope2: { locationBased: 8900, marketBased: 6200, unit: 'tCO2e' },
    scope3: { total: 145000, categories: [
      { name: 'Purchased Goods & Services', value: 62000, unit: 'tCO2e', estimated: true },
      { name: 'Capital Goods', value: 18000, unit: 'tCO2e', estimated: true },
      { name: 'Business Travel', value: 3500, unit: 'tCO2e', estimated: false },
      { name: 'Employee Commuting', value: 5200, unit: 'tCO2e', estimated: true },
      { name: 'Use of Sold Products', value: 42000, unit: 'tCO2e', estimated: true },
      { name: 'End-of-Life Treatment', value: 14300, unit: 'tCO2e', estimated: true },
    ]},
    baselineYear: 2020,
    reductionTarget: 42,
    reductionAchieved: 18,
  },
  waterUsage: { total: 285000, recycled: 45000, unit: 'm3', waterStressAreas: true },
  waste: { totalGenerated: 4500, recycled: 2800, landfill: 900, hazardous: 350, unit: 'tonnes' },
  biodiversity: { sitesNearProtectedAreas: 2, landUseChange: 15, restorationProjects: 3, score: 62 },
  energyConsumption: { total: 185000, renewable: 74000, nonRenewable: 111000, unit: 'MWh', efficiencyImprovement: 8.5 },
  pollution: { airEmissions: 45, waterDischarges: 12, microplastics: 0.8, unit: 'tonnes' },
};

const DEFAULT_SOCIAL: SocialMetrics = {
  workforce: { totalEmployees: 4850, fullTime: 4200, partTime: 450, contractors: 200, femalePercentage: 42.3, diversityIndex: 0.68, turnoverRate: 12.5 },
  payGap: { genderPayGap: 8.2, ceoToMedianRatio: 45, livingWageCompliance: 97 },
  healthSafety: { incidentRate: 2.3, fatalityCount: 0, lostTimeInjuryRate: 0.8, trainingHoursPerEmployee: 24, wellbeingProgramCoverage: 85 },
  humanRights: { dueDiligenceCompleted: true, supplyChainAudits: 48, grievancesReported: 12, grievancesResolved: 9, childLabourRisk: 'low', forcedLabourRisk: 'low' },
  communityEngagement: { investmentAmount: 1200000, projectsSupported: 15, stakeholderConsultations: 8 },
};

const DEFAULT_GOVERNANCE: GovernanceMetrics = {
  board: { totalMembers: 12, independentMembers: 7, femaleMembers: 5, sustainabilityExpertise: 3, meetingsPerYear: 10, avgTenureYears: 4.5 },
  antiCorruption: { policyInPlace: true, trainingCoverage: 92, incidentsReported: 2, whistleblowerProtection: true, politicalContributions: 0 },
  lobbying: { totalSpend: 350000, topicsEngaged: ['Climate policy', 'Digital regulation', 'Trade standards', 'Tax transparency'], tradeAssociations: 8, transparencyRegisterCompliant: true },
  riskManagement: { esgRisksIdentified: 24, mitigationPlansInPlace: 19, climateScenarioAnalysis: true, transitionPlanPublished: false },
};

const DEFAULT_REPORTS: SustainabilityReport[] = [
  { id: 'rpt-1', title: 'Annual Sustainability Report FY2025', reportingYear: 2025, status: 'in_review', createdDate: '2026-01-15', lastModified: '2026-02-10', assuranceProvider: 'Deloitte', assuranceLevel: 'limited', esrsTopicsCovered: ['ESRS E1', 'ESRS E5', 'ESRS S1', 'ESRS S2', 'ESRS G1'], completionPercentage: 78 },
  { id: 'rpt-2', title: 'Climate Transition Plan 2025-2035', reportingYear: 2025, status: 'draft', createdDate: '2026-02-01', lastModified: '2026-02-14', assuranceProvider: '', assuranceLevel: 'none', esrsTopicsCovered: ['ESRS E1'], completionPercentage: 45 },
  { id: 'rpt-3', title: 'Annual Sustainability Report FY2024', reportingYear: 2024, status: 'published', createdDate: '2025-01-20', lastModified: '2025-03-15', assuranceProvider: 'Deloitte', assuranceLevel: 'limited', esrsTopicsCovered: ['ESRS E1', 'ESRS S1', 'ESRS G1'], completionPercentage: 100 },
];

// ── Helper Functions ─────────────────────────────────────────────────────

const materialityColor = (level: MaterialityLevel): string => {
  switch (level) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    case 'not_material': return 'bg-gray-100 text-gray-600';
  }
};

const statusColor = (s: ComplianceStatus): string => {
  switch (s) {
    case 'compliant': return 'bg-green-100 text-green-800';
    case 'partial': return 'bg-yellow-100 text-yellow-800';
    case 'non_compliant': return 'bg-red-100 text-red-800';
    case 'not_started': return 'bg-gray-100 text-gray-600';
  }
};

const reportStatusColor = (s: ReportStatus): string => {
  switch (s) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'in_review': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'published': return 'bg-green-100 text-green-800';
  }
};

const formatNumber = (n: number): string => n.toLocaleString('en-US');
const formatCurrency = (n: number): string => new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n);
const formatDate = (d: string): string => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Component ────────────────────────────────────────────────────────────

export const CSRDDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [topics, setTopics] = useState<MaterialityTopic[]>(DEFAULT_MATERIALITY_TOPICS);
  const [envMetrics, setEnvMetrics] = useState<EnvironmentalMetrics>(DEFAULT_ENVIRONMENTAL);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetrics>(DEFAULT_SOCIAL);
  const [govMetrics, setGovMetrics] = useState<GovernanceMetrics>(DEFAULT_GOVERNANCE);
  const [reports, setReports] = useState<SustainabilityReport[]>(DEFAULT_REPORTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'environmental' | 'social' | 'governance'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<MaterialityTopic | null>(null);

  const [reportForm, setReportForm] = useState({ title: '', reportingYear: 2025, assuranceProvider: '', assuranceLevel: 'limited' as 'limited' | 'reasonable' | 'none' });

  // ── Load saved data from API ──

  useEffect(() => {
    (async () => {
      try {
        const saved = await api.regulationData.getAll('csrd');
        if (saved && typeof saved === 'object') {
          if (saved.topics) setTopics(saved.topics);
          if (saved.environmental) setEnvMetrics(saved.environmental);
          if (saved.social) setSocialMetrics(saved.social);
          if (saved.governance) setGovMetrics(saved.governance);
          if (saved.reports) setReports(saved.reports);
        }
      } catch (err: any) {
        console.error('Failed to load CSRD data:', err);
        setLoadError('Using default template data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Debounced auto-save ──

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      api.regulationData.save('csrd', 'topics', topics);
      api.regulationData.save('csrd', 'environmental', envMetrics);
      api.regulationData.save('csrd', 'social', socialMetrics);
      api.regulationData.save('csrd', 'governance', govMetrics);
      api.regulationData.save('csrd', 'reports', reports);
    }, 2000);
    return () => clearTimeout(timer);
  }, [topics, envMetrics, socialMetrics, govMetrics, reports, isLoading]);

  // ── Computed ──

  const materialTopics = useMemo(() => topics.filter(t => t.overallMateriality !== 'not_material'), [topics]);
  const highMateriality = useMemo(() => topics.filter(t => t.overallMateriality === 'high'), [topics]);
  const dataReadiness = useMemo(() => {
    const total = materialTopics.length;
    if (total === 0) return 0;
    const ready = materialTopics.filter(t => t.dataCollectionStatus === 'compliant').length;
    const partial = materialTopics.filter(t => t.dataCollectionStatus === 'partial').length;
    return Math.round(((ready + partial * 0.5) / total) * 100);
  }, [materialTopics]);

  const totalGHG = useMemo(() => envMetrics.ghg.scope1.total + envMetrics.ghg.scope2.marketBased + envMetrics.ghg.scope3.total, [envMetrics]);

  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchesSearch = t.topic.toLowerCase().includes(searchTerm.toLowerCase()) || t.esrsStandard.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [topics, searchTerm, categoryFilter]);

  // ── Handlers ──

  const handleAddReport = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newReport: SustainabilityReport = {
      id: `rpt-${Date.now()}`, title: reportForm.title, reportingYear: reportForm.reportingYear,
      status: 'draft', createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0], assuranceProvider: reportForm.assuranceProvider,
      assuranceLevel: reportForm.assuranceLevel, esrsTopicsCovered: [], completionPercentage: 0,
    };
    setReports(prev => [newReport, ...prev]);
    setShowReportModal(false);
    setReportForm({ title: '', reportingYear: 2025, assuranceProvider: '', assuranceLevel: 'limited' });
  }, [reportForm]);

  const handleDownloadReport = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(), reportType: 'CSRD Sustainability Report',
      materialTopics: materialTopics.map(t => ({ standard: t.esrsStandard, topic: t.topic, materiality: t.overallMateriality })),
      environmental: { totalGHG, scope1: envMetrics.ghg.scope1.total, scope2: envMetrics.ghg.scope2.marketBased, scope3: envMetrics.ghg.scope3.total, renewableEnergy: Math.round((envMetrics.energyConsumption.renewable / envMetrics.energyConsumption.total) * 100), wasteRecycled: Math.round((envMetrics.waste.recycled / envMetrics.waste.totalGenerated) * 100) },
      social: { employees: socialMetrics.workforce.totalEmployees, genderPayGap: socialMetrics.payGap.genderPayGap, incidentRate: socialMetrics.healthSafety.incidentRate },
      governance: { boardIndependence: Math.round((govMetrics.board.independentMembers / govMetrics.board.totalMembers) * 100), antiCorruptionTraining: govMetrics.antiCorruption.trainingCoverage },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `csrd-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [materialTopics, totalGHG, envMetrics, socialMetrics, govMetrics]);

  const renderScoreBar = (score: number, color?: string) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${color || (score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500')}`}
        style={{ width: `${Math.min(100, score)}%` }} />
    </div>
  );

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'materiality', label: 'Double Materiality', icon: <Scale className="w-4 h-4" /> },
    { key: 'environmental', label: 'Environmental', icon: <Leaf className="w-4 h-4" /> },
    { key: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> },
    { key: 'governance', label: 'Governance', icon: <Building2 className="w-4 h-4" /> },
    { key: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  // ── Tab: Overview ──

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Material Topics</p><p className="text-2xl font-bold text-gray-900 mt-1">{materialTopics.length}</p></div>
            <Scale className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{highMateriality.length} high materiality</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total GHG Emissions</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalGHG)}</p></div>
            <Factory className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">tCO2e ({envMetrics.ghg.reductionAchieved}% reduction from baseline)</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Data Readiness</p><p className="text-2xl font-bold text-gray-900 mt-1">{dataReadiness}%</p></div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">{renderScoreBar(dataReadiness)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Workforce</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(socialMetrics.workforce.totalEmployees)}</p></div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{socialMetrics.workforce.femalePercentage}% female</p>
        </div>
      </div>

      {/* ESG Pillar Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Leaf className="w-5 h-5 text-green-600" /><h3 className="font-semibold text-gray-900">Environmental</h3></div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Renewable Energy</span><span className="font-medium">{Math.round((envMetrics.energyConsumption.renewable / envMetrics.energyConsumption.total) * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Waste Recycled</span><span className="font-medium">{Math.round((envMetrics.waste.recycled / envMetrics.waste.totalGenerated) * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Water Recycled</span><span className="font-medium">{Math.round((envMetrics.waterUsage.recycled / envMetrics.waterUsage.total) * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GHG Reduction Progress</span><span className="font-medium">{envMetrics.ghg.reductionAchieved}% of {envMetrics.ghg.reductionTarget}%</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Social</h3></div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Gender Pay Gap</span><span className="font-medium">{socialMetrics.payGap.genderPayGap}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Incident Rate</span><span className="font-medium">{socialMetrics.healthSafety.incidentRate}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Training Hours/Employee</span><span className="font-medium">{socialMetrics.healthSafety.trainingHoursPerEmployee}h</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Supply Chain Audits</span><span className="font-medium">{socialMetrics.humanRights.supplyChainAudits}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-900">Governance</h3></div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Board Independence</span><span className="font-medium">{Math.round((govMetrics.board.independentMembers / govMetrics.board.totalMembers) * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Board Gender Diversity</span><span className="font-medium">{Math.round((govMetrics.board.femaleMembers / govMetrics.board.totalMembers) * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Anti-Corruption Training</span><span className="font-medium">{govMetrics.antiCorruption.trainingCoverage}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">ESG Risks Mitigated</span><span className="font-medium">{govMetrics.riskManagement.mitigationPlansInPlace}/{govMetrics.riskManagement.esgRisksIdentified}</span></div>
          </div>
        </div>
      </div>

      {/* CSRD Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CSRD Reporting Timeline</h3>
        <div className="space-y-3">
          {[
            { year: '2025', desc: 'Large public-interest entities (>500 employees) - First reports due for FY2024', status: 'completed' as const },
            { year: '2026', desc: 'Other large companies (>250 employees or >40M revenue) - Reports due for FY2025', status: 'active' as const },
            { year: '2027', desc: 'Listed SMEs, small credit institutions, captive insurers - Reports due for FY2026', status: 'upcoming' as const },
            { year: '2029', desc: 'Non-EU companies with >150M EU revenue - Reports due for FY2028', status: 'upcoming' as const },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg border ${item.status === 'completed' ? 'bg-green-50 border-green-200' : item.status === 'active' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-100' : item.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {item.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> : item.status === 'active' ? <Clock className="w-5 h-5 text-blue-600" /> : <Clock className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.year}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Double Materiality ──

  const renderMateriality = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search topics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Pillars</option>
            <option value="environmental">Environmental</option>
            <option value="social">Social</option>
            <option value="governance">Governance</option>
          </select>
        </div>
      </div>

      {/* Materiality Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Double Materiality Matrix</h3>
        <p className="text-sm text-gray-600 mb-6">The matrix plots each ESRS topic based on its impact materiality (effect on people and environment) and financial materiality (effect on the company).</p>
        <div className="relative border border-gray-300 rounded-lg" style={{ height: 400 }}>
          {/* Axis Labels */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-gray-500 whitespace-nowrap">Financial Materiality</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs font-medium text-gray-500">Impact Materiality</div>
          {/* Grid */}
          <div className="absolute inset-4 grid grid-cols-3 grid-rows-3">
            <div className="border border-gray-100 bg-green-50 rounded-tl flex items-center justify-center text-xs text-gray-400">Low / High</div>
            <div className="border border-gray-100 bg-yellow-50 flex items-center justify-center text-xs text-gray-400">Med / High</div>
            <div className="border border-gray-100 bg-red-50 rounded-tr flex items-center justify-center text-xs text-gray-400">High / High</div>
            <div className="border border-gray-100 bg-green-50 flex items-center justify-center text-xs text-gray-400">Low / Med</div>
            <div className="border border-gray-100 bg-yellow-50 flex items-center justify-center text-xs text-gray-400">Med / Med</div>
            <div className="border border-gray-100 bg-orange-50 flex items-center justify-center text-xs text-gray-400">High / Med</div>
            <div className="border border-gray-100 bg-gray-50 rounded-bl flex items-center justify-center text-xs text-gray-400">Low / Low</div>
            <div className="border border-gray-100 bg-green-50 flex items-center justify-center text-xs text-gray-400">Med / Low</div>
            <div className="border border-gray-100 bg-yellow-50 rounded-br flex items-center justify-center text-xs text-gray-400">High / Low</div>
          </div>
          {/* Topic Dots */}
          {topics.map(topic => {
            const impactX = topic.impactMateriality === 'high' ? 83 : topic.impactMateriality === 'medium' ? 50 : 17;
            const financialY = topic.financialMateriality === 'high' ? 17 : topic.financialMateriality === 'medium' ? 50 : 83;
            const colors: Record<string, string> = { environmental: 'bg-green-500', social: 'bg-blue-500', governance: 'bg-purple-500' };
            return (
              <div key={topic.id} className="absolute group" style={{ left: `${impactX}%`, top: `${financialY}%`, transform: 'translate(-50%, -50%)' }}>
                <div className={`w-6 h-6 rounded-full ${colors[topic.category]} border-2 border-white shadow-md cursor-pointer`}
                  onClick={() => { setSelectedTopic(topic); setShowTopicModal(true); }} />
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {topic.esrsStandard}: {topic.topic}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 justify-center">
          <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded-full bg-green-500" /> Environmental</span>
          <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded-full bg-blue-500" /> Social</span>
          <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded-full bg-purple-500" /> Governance</span>
        </div>
      </div>

      {/* Topic List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200"><h4 className="font-semibold text-gray-900">ESRS Topics Assessment</h4></div>
        <div className="divide-y divide-gray-100">
          {filteredTopics.map(topic => (
            <div key={topic.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedTopic(topic); setShowTopicModal(true); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500 w-20">{topic.esrsStandard}</span>
                  <span className="font-medium text-gray-900">{topic.topic}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${materialityColor(topic.overallMateriality)}`}>{topic.overallMateriality.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(topic.dataCollectionStatus)}`}>{topic.dataCollectionStatus.replace('_', ' ').toUpperCase()}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-20">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Environmental ──

  const renderEnvironmental = () => (
    <div className="space-y-6">
      {/* GHG Emissions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Greenhouse Gas Emissions (ESRS E1)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Scope 1 (Direct)</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(envMetrics.ghg.scope1.total)}</p>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-gray-600">Scope 2 (Market-based)</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(envMetrics.ghg.scope2.marketBased)}</p>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Scope 3 (Indirect)</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(envMetrics.ghg.scope3.total)}</p>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>
        </div>

        {/* Scope 1 Breakdown */}
        <h4 className="font-medium text-gray-700 mb-2">Scope 1 Breakdown</h4>
        <div className="space-y-2 mb-6">
          {envMetrics.ghg.scope1.breakdown.map((item, idx) => {
            const pct = (item.value / envMetrics.ghg.scope1.total) * 100;
            return (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{item.source}</span><span className="font-medium">{formatNumber(item.value)} {item.unit} ({pct.toFixed(1)}%)</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>

        {/* Scope 3 Categories */}
        <h4 className="font-medium text-gray-700 mb-2">Scope 3 Categories</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Category</th>
              <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Emissions</th>
              <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">% of Scope 3</th>
              <th className="text-center text-xs font-medium text-gray-500 px-3 py-2">Data Quality</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {envMetrics.ghg.scope3.categories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{cat.name}</td>
                  <td className="px-3 py-2 text-sm text-right font-medium">{formatNumber(cat.value)} {cat.unit}</td>
                  <td className="px-3 py-2 text-sm text-right">{((cat.value / envMetrics.ghg.scope3.total) * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs ${cat.estimated ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{cat.estimated ? 'Estimated' : 'Measured'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reduction Target */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">GHG Reduction Progress (Baseline: {envMetrics.ghg.baselineYear})</h4>
          <div className="flex justify-between text-sm mb-1"><span className="text-green-700">Target: {envMetrics.ghg.reductionTarget}% reduction</span><span className="font-bold text-green-800">{envMetrics.ghg.reductionAchieved}% achieved</span></div>
          {renderScoreBar(Math.round((envMetrics.ghg.reductionAchieved / envMetrics.ghg.reductionTarget) * 100), 'bg-green-500')}
        </div>
      </div>

      {/* Water, Waste, Energy, Biodiversity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Droplets className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Water Usage (ESRS E3)</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Total Withdrawal</span><span className="font-medium">{formatNumber(envMetrics.waterUsage.total)} m3</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Recycled</span><span className="font-medium">{formatNumber(envMetrics.waterUsage.recycled)} m3 ({Math.round((envMetrics.waterUsage.recycled / envMetrics.waterUsage.total) * 100)}%)</span></div>
            {envMetrics.waterUsage.waterStressAreas && <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Operations in water stress areas</div>}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Recycle className="w-5 h-5 text-green-600" /><h3 className="font-semibold text-gray-900">Waste Management (ESRS E5)</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Total Generated</span><span className="font-medium">{formatNumber(envMetrics.waste.totalGenerated)} tonnes</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Recycled</span><span className="font-medium">{formatNumber(envMetrics.waste.recycled)} tonnes ({Math.round((envMetrics.waste.recycled / envMetrics.waste.totalGenerated) * 100)}%)</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Landfill</span><span className="font-medium">{formatNumber(envMetrics.waste.landfill)} tonnes</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Hazardous</span><span className="font-medium text-red-700">{formatNumber(envMetrics.waste.hazardous)} tonnes</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-yellow-600" /><h3 className="font-semibold text-gray-900">Energy Consumption (ESRS E1)</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Total</span><span className="font-medium">{formatNumber(envMetrics.energyConsumption.total)} MWh</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Renewable</span><span className="font-medium text-green-700">{formatNumber(envMetrics.energyConsumption.renewable)} MWh ({Math.round((envMetrics.energyConsumption.renewable / envMetrics.energyConsumption.total) * 100)}%)</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Efficiency Improvement</span><span className="font-medium">{envMetrics.energyConsumption.efficiencyImprovement}% YoY</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><TreePine className="w-5 h-5 text-green-700" /><h3 className="font-semibold text-gray-900">Biodiversity (ESRS E4)</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Sites Near Protected Areas</span><span className="font-medium">{envMetrics.biodiversity.sitesNearProtectedAreas}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Land Use Change</span><span className="font-medium">{envMetrics.biodiversity.landUseChange} hectares</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Restoration Projects</span><span className="font-medium">{envMetrics.biodiversity.restorationProjects}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Biodiversity Score</span><span className="font-medium">{envMetrics.biodiversity.score}/100</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Social ──

  const renderSocial = () => (
    <div className="space-y-6">
      {/* Workforce */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Own Workforce (ESRS S1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Employees</p><p className="text-xl font-bold">{formatNumber(socialMetrics.workforce.totalEmployees)}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Full-Time</p><p className="text-xl font-bold">{formatNumber(socialMetrics.workforce.fullTime)}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Female %</p><p className="text-xl font-bold">{socialMetrics.workforce.femalePercentage}%</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Turnover Rate</p><p className="text-xl font-bold">{socialMetrics.workforce.turnoverRate}%</p></div>
        </div>
        <h4 className="font-medium text-gray-700 mb-2">Workforce Composition</h4>
        <div className="space-y-2">
          {[
            { label: 'Full-Time', value: socialMetrics.workforce.fullTime, color: 'bg-blue-500' },
            { label: 'Part-Time', value: socialMetrics.workforce.partTime, color: 'bg-indigo-500' },
            { label: 'Contractors', value: socialMetrics.workforce.contractors, color: 'bg-purple-500' },
          ].map(item => {
            const pct = (item.value / socialMetrics.workforce.totalEmployees) * 100;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{item.label}</span><span className="font-medium">{formatNumber(item.value)} ({pct.toFixed(1)}%)</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${item.color}`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pay Gap */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pay Equity</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Gender Pay Gap</span><span className={`font-bold ${socialMetrics.payGap.genderPayGap > 5 ? 'text-red-600' : 'text-green-600'}`}>{socialMetrics.payGap.genderPayGap}%</span></div>
              {renderScoreBar(100 - socialMetrics.payGap.genderPayGap * 5, socialMetrics.payGap.genderPayGap > 5 ? 'bg-red-500' : 'bg-green-500')}
            </div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">CEO-to-Median Ratio</span><span className="font-medium">{socialMetrics.payGap.ceoToMedianRatio}:1</span></div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Living Wage Compliance</span><span className="font-bold text-green-600">{socialMetrics.payGap.livingWageCompliance}%</span></div>
              {renderScoreBar(socialMetrics.payGap.livingWageCompliance, 'bg-green-500')}
            </div>
          </div>
        </div>

        {/* Health & Safety */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Health & Safety</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Incident Rate</span><span className="font-medium">{socialMetrics.healthSafety.incidentRate} per 200k hours</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Fatalities</span><span className={`font-bold ${socialMetrics.healthSafety.fatalityCount === 0 ? 'text-green-600' : 'text-red-600'}`}>{socialMetrics.healthSafety.fatalityCount}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Lost Time Injury Rate</span><span className="font-medium">{socialMetrics.healthSafety.lostTimeInjuryRate}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Training Hours/Employee</span><span className="font-medium">{socialMetrics.healthSafety.trainingHoursPerEmployee}h</span></div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Wellbeing Program Coverage</span><span className="font-medium">{socialMetrics.healthSafety.wellbeingProgramCoverage}%</span></div>
              {renderScoreBar(socialMetrics.healthSafety.wellbeingProgramCoverage, 'bg-blue-500')}
            </div>
          </div>
        </div>
      </div>

      {/* Human Rights Due Diligence */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Human Rights Due Diligence (ESRS S2)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Due Diligence</p><p className="text-lg font-bold">{socialMetrics.humanRights.dueDiligenceCompleted ? 'Completed' : 'Pending'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Supply Chain Audits</p><p className="text-lg font-bold">{socialMetrics.humanRights.supplyChainAudits}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Grievances Reported</p><p className="text-lg font-bold">{socialMetrics.humanRights.grievancesReported}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Grievances Resolved</p><p className="text-lg font-bold">{socialMetrics.humanRights.grievancesResolved}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
            <span className="text-sm text-gray-600">Child Labour Risk:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${materialityColor(socialMetrics.humanRights.childLabourRisk)}`}>{socialMetrics.humanRights.childLabourRisk.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
            <span className="text-sm text-gray-600">Forced Labour Risk:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${materialityColor(socialMetrics.humanRights.forcedLabourRisk)}`}>{socialMetrics.humanRights.forcedLabourRisk.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Governance ──

  const renderGovernance = () => (
    <div className="space-y-6">
      {/* Board Composition */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Board Composition (ESRS G1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-gray-900">{govMetrics.board.totalMembers}</p><p className="text-xs text-gray-500">Total Members</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-700">{Math.round((govMetrics.board.independentMembers / govMetrics.board.totalMembers) * 100)}%</p><p className="text-xs text-gray-500">Independent</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-purple-700">{Math.round((govMetrics.board.femaleMembers / govMetrics.board.totalMembers) * 100)}%</p><p className="text-xs text-gray-500">Female</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-600">Sustainability Expertise</span><span className="font-medium">{govMetrics.board.sustainabilityExpertise} members</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-600">Meetings Per Year</span><span className="font-medium">{govMetrics.board.meetingsPerYear}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-600">Average Tenure</span><span className="font-medium">{govMetrics.board.avgTenureYears} years</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Anti-Corruption */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Anti-Corruption</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm items-center"><span className="text-gray-600">Policy in Place</span>{govMetrics.antiCorruption.policyInPlace ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}</div>
            <div className="flex justify-between text-sm items-center"><span className="text-gray-600">Whistleblower Protection</span>{govMetrics.antiCorruption.whistleblowerProtection ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}</div>
            <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Training Coverage</span><span className="font-medium">{govMetrics.antiCorruption.trainingCoverage}%</span></div>{renderScoreBar(govMetrics.antiCorruption.trainingCoverage, 'bg-blue-500')}</div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Incidents Reported</span><span className="font-medium">{govMetrics.antiCorruption.incidentsReported}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Political Contributions</span><span className="font-medium">{formatCurrency(govMetrics.antiCorruption.politicalContributions)}</span></div>
          </div>
        </div>

        {/* Lobbying */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Lobbying & Political Engagement</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Total Spend</span><span className="font-medium">{formatCurrency(govMetrics.lobbying.totalSpend)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Trade Associations</span><span className="font-medium">{govMetrics.lobbying.tradeAssociations}</span></div>
            <div className="flex justify-between text-sm items-center"><span className="text-gray-600">Transparency Register</span>{govMetrics.lobbying.transparencyRegisterCompliant ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}</div>
            <div><p className="text-sm text-gray-600 mb-1">Topics Engaged:</p><div className="flex flex-wrap gap-1">{govMetrics.lobbying.topicsEngaged.map((t, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{t}</span>)}</div></div>
          </div>
        </div>
      </div>

      {/* ESG Risk Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ESG Risk Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">ESG Risks Identified</p><p className="text-xl font-bold">{govMetrics.riskManagement.esgRisksIdentified}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Mitigation Plans</p><p className="text-xl font-bold">{govMetrics.riskManagement.mitigationPlansInPlace}/{govMetrics.riskManagement.esgRisksIdentified}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Climate Scenario Analysis</p><p className="text-xl font-bold">{govMetrics.riskManagement.climateScenarioAnalysis ? 'Done' : 'Pending'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Transition Plan</p><p className="text-xl font-bold">{govMetrics.riskManagement.transitionPlanPublished ? 'Published' : 'In Draft'}</p></div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Reports ──

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sustainability Reports</h3>
        <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> New Report</button>
      </div>
      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-gray-900">{report.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${reportStatusColor(report.status)}`}>{report.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-600">Reporting Year: {report.reportingYear} | Last Modified: {formatDate(report.lastModified)}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"><Eye className="w-4 h-4" /> View</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Completion</span><span className="font-medium">{report.completionPercentage}%</span></div>
              {renderScoreBar(report.completionPercentage)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {report.assuranceProvider && <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> {report.assuranceProvider} ({report.assuranceLevel} assurance)</span>}
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {report.esrsTopicsCovered.length} ESRS topics</span>
            </div>
            {report.esrsTopicsCovered.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">{report.esrsTopicsCovered.map(t => <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{t}</span>)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Statement Generator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sustainability Statement Generator</h3>
        <p className="text-sm text-gray-600 mb-4">Generate a CSRD-compliant sustainability statement based on your collected data and materiality assessment.</p>
        <button onClick={() => setShowGenerateModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Generate Statement
        </button>
      </div>
    </div>
  );

  // ── Main Render ──

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CSRD Compliance</h2>
          <p className="text-gray-600 mt-1">Corporate Sustainability Reporting Directive (EU) 2022/2464 with ESRS standards</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Download className="w-4 h-4" /> Export Data</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'materiality' && renderMateriality()}
      {activeTab === 'environmental' && renderEnvironmental()}
      {activeTab === 'social' && renderSocial()}
      {activeTab === 'governance' && renderGovernance()}
      {activeTab === 'reports' && renderReports()}

      {/* ── Topic Detail Modal ── */}
      {showTopicModal && selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedTopic.esrsStandard}: {selectedTopic.topic}</h3>
              <button onClick={() => { setShowTopicModal(false); setSelectedTopic(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">{selectedTopic.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700">Impact Materiality</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${materialityColor(selectedTopic.impactMateriality)}`}>{selectedTopic.impactMateriality.toUpperCase()}</span></p></div>
                <div><label className="text-sm font-medium text-gray-700">Financial Materiality</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${materialityColor(selectedTopic.financialMateriality)}`}>{selectedTopic.financialMateriality.toUpperCase()}</span></p></div>
                <div><label className="text-sm font-medium text-gray-700">Overall Materiality</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${materialityColor(selectedTopic.overallMateriality)}`}>{selectedTopic.overallMateriality.toUpperCase()}</span></p></div>
                <div><label className="text-sm font-medium text-gray-700">Data Collection</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(selectedTopic.dataCollectionStatus)}`}>{selectedTopic.dataCollectionStatus.replace('_', ' ').toUpperCase()}</span></p></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Stakeholders Affected</label><div className="flex flex-wrap gap-1 mt-1">{selectedTopic.stakeholdersAffected.map(s => <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{s}</span>)}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* ── New Report Modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Create Sustainability Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddReport} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label><input type="text" required value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reporting Year *</label><select value={reportForm.reportingYear} onChange={(e) => setReportForm({ ...reportForm, reportingYear: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value={2025}>2025</option><option value={2024}>2024</option><option value={2026}>2026</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Assurance Provider</label><input type="text" value={reportForm.assuranceProvider} onChange={(e) => setReportForm({ ...reportForm, assuranceProvider: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Assurance Level</label><select value={reportForm.assuranceLevel} onChange={(e) => setReportForm({ ...reportForm, assuranceLevel: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="limited">Limited</option><option value="reasonable">Reasonable</option><option value="none">None</option></select></div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Report</button>
                <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Generate Statement Modal ── */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Generate Sustainability Statement</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">This will generate a CSRD-compliant sustainability statement incorporating your materiality assessment, environmental data, social metrics, and governance information.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Data sources:</strong> {materialTopics.length} material topics, GHG data (Scopes 1-3), {socialMetrics.workforce.totalEmployees} employees, {govMetrics.board.totalMembers} board members.
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowGenerateModal(false); handleDownloadReport(); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Generate & Download</button>
                <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
