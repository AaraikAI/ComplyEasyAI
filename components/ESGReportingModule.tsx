/**
 * ESG / CSRD Sustainability Reporting Module
 *
 * Comprehensive management interface for ESG compliance and CSRD reporting:
 * - Environmental metrics: GHG emissions (Scope 1/2/3), energy, water, waste, biodiversity
 * - Social metrics: employee wellbeing, D&I, human rights, community, privacy
 * - Governance metrics: board diversity, executive comp, anti-corruption, lobbying, tax
 * - ESRS topic-specific standards compliance (E1-E5, S1-S4, G1)
 * - Double materiality assessment integration
 * - ESG score calculation with industry benchmarks
 * - SDG alignment mapping
 * - Report generator with CSRD-compliant format
 * - Data collection workflows with evidence attachment
 * - Year-over-year trend visualization
 *
 * Reference: Corporate Sustainability Reporting Directive (EU) 2022/2464
 *            European Sustainability Reporting Standards (ESRS)
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft,
  BarChart3,
  Leaf,
  Users,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Eye,
  Download,
  Edit3,
  Target,
  Zap,
  Droplets,
  Trash2,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Layers,
  Scale,
  Building2,
  Heart,
  Lock,
  Briefcase,
  Percent,
  Flame,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ESGMetric {
  id: string;
  category: 'environmental' | 'social' | 'governance';
  subcategory: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  previousYear?: number;
  trend: 'up' | 'down' | 'stable';
  trendIsPositive: boolean;
  esrsStandard?: string;
  dataQuality: 'verified' | 'reported' | 'estimated';
  lastUpdated: string;
}

interface ESRSStandard {
  id: string;
  code: string;
  name: string;
  category: 'cross-cutting' | 'environmental' | 'social' | 'governance';
  disclosureRequirements: number;
  completedDisclosures: number;
  status: 'not_started' | 'in_progress' | 'complete' | 'not_material';
  materialityResult?: 'material' | 'not_material' | 'pending';
}

interface MaterialityTopic {
  id: string;
  topic: string;
  esrsStandard: string;
  financialMateriality: number;
  impactMateriality: number;
  overallMateriality: 'high' | 'medium' | 'low' | 'not_material';
  stakeholderRelevance: number;
  status: 'assessed' | 'pending' | 'under_review';
}

interface SDGAlignment {
  sdgNumber: number;
  sdgName: string;
  alignmentScore: number;
  contributingMetrics: string[];
  status: 'strong' | 'moderate' | 'weak' | 'not_aligned';
}

interface ESGReport {
  id: string;
  title: string;
  reportingPeriod: string;
  type: 'annual' | 'interim' | 'thematic';
  status: 'draft' | 'review' | 'approved' | 'published';
  csrdCompliant: boolean;
  createdAt: string;
  author: string;
  pages?: number;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_METRICS: ESGMetric[] = [
  // Environmental
  { id: 'env-001', category: 'environmental', subcategory: 'GHG Emissions', name: 'Scope 1 - Direct Emissions', value: 12450, unit: 'tCO2e', target: 11000, previousYear: 13200, trend: 'down', trendIsPositive: true, esrsStandard: 'E1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'env-002', category: 'environmental', subcategory: 'GHG Emissions', name: 'Scope 2 - Indirect Energy', value: 8300, unit: 'tCO2e', target: 7500, previousYear: 9100, trend: 'down', trendIsPositive: true, esrsStandard: 'E1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'env-003', category: 'environmental', subcategory: 'GHG Emissions', name: 'Scope 3 - Value Chain', value: 45600, unit: 'tCO2e', target: 42000, previousYear: 48200, trend: 'down', trendIsPositive: true, esrsStandard: 'E1', dataQuality: 'estimated', lastUpdated: '2026-02-05' },
  { id: 'env-004', category: 'environmental', subcategory: 'Energy', name: 'Total Energy Consumption', value: 156000, unit: 'MWh', target: 145000, previousYear: 162000, trend: 'down', trendIsPositive: true, esrsStandard: 'E1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'env-005', category: 'environmental', subcategory: 'Energy', name: 'Renewable Energy Share', value: 62, unit: '%', target: 75, previousYear: 48, trend: 'up', trendIsPositive: true, esrsStandard: 'E1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'env-006', category: 'environmental', subcategory: 'Water', name: 'Total Water Withdrawal', value: 2850, unit: 'ML', target: 2600, previousYear: 3100, trend: 'down', trendIsPositive: true, esrsStandard: 'E3', dataQuality: 'reported', lastUpdated: '2026-01-28' },
  { id: 'env-007', category: 'environmental', subcategory: 'Water', name: 'Water Recycled/Reused', value: 38, unit: '%', target: 50, previousYear: 32, trend: 'up', trendIsPositive: true, esrsStandard: 'E3', dataQuality: 'reported', lastUpdated: '2026-01-28' },
  { id: 'env-008', category: 'environmental', subcategory: 'Waste', name: 'Total Waste Generated', value: 4200, unit: 'tonnes', target: 3800, previousYear: 4500, trend: 'down', trendIsPositive: true, esrsStandard: 'E5', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'env-009', category: 'environmental', subcategory: 'Waste', name: 'Waste Diverted from Disposal', value: 72, unit: '%', target: 80, previousYear: 65, trend: 'up', trendIsPositive: true, esrsStandard: 'E5', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'env-010', category: 'environmental', subcategory: 'Biodiversity', name: 'Sites Near Protected Areas', value: 2, unit: 'sites', previousYear: 2, trend: 'stable', trendIsPositive: true, esrsStandard: 'E4', dataQuality: 'reported', lastUpdated: '2026-01-15' },
  { id: 'env-011', category: 'environmental', subcategory: 'Pollution', name: 'NOx Emissions', value: 145, unit: 'tonnes', target: 120, previousYear: 168, trend: 'down', trendIsPositive: true, esrsStandard: 'E2', dataQuality: 'verified', lastUpdated: '2026-01-31' },

  // Social
  { id: 'soc-001', category: 'social', subcategory: 'Employee Wellbeing', name: 'Employee Satisfaction Score', value: 78, unit: '%', target: 85, previousYear: 74, trend: 'up', trendIsPositive: true, esrsStandard: 'S1', dataQuality: 'reported', lastUpdated: '2026-02-01' },
  { id: 'soc-002', category: 'social', subcategory: 'Employee Wellbeing', name: 'Lost Time Injury Rate', value: 1.8, unit: 'per 200k hrs', target: 1.0, previousYear: 2.3, trend: 'down', trendIsPositive: true, esrsStandard: 'S1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'soc-003', category: 'social', subcategory: 'Employee Wellbeing', name: 'Training Hours per Employee', value: 42, unit: 'hours', target: 50, previousYear: 36, trend: 'up', trendIsPositive: true, esrsStandard: 'S1', dataQuality: 'reported', lastUpdated: '2026-01-31' },
  { id: 'soc-004', category: 'social', subcategory: 'Diversity & Inclusion', name: 'Gender Pay Gap', value: 5.2, unit: '%', target: 3.0, previousYear: 7.1, trend: 'down', trendIsPositive: true, esrsStandard: 'S1', dataQuality: 'verified', lastUpdated: '2026-01-15' },
  { id: 'soc-005', category: 'social', subcategory: 'Diversity & Inclusion', name: 'Women in Management', value: 38, unit: '%', target: 45, previousYear: 34, trend: 'up', trendIsPositive: true, esrsStandard: 'S1', dataQuality: 'verified', lastUpdated: '2026-01-15' },
  { id: 'soc-006', category: 'social', subcategory: 'Human Rights', name: 'Human Rights Due Diligence Coverage', value: 85, unit: '%', target: 100, previousYear: 72, trend: 'up', trendIsPositive: true, esrsStandard: 'S2', dataQuality: 'reported', lastUpdated: '2026-01-20' },
  { id: 'soc-007', category: 'social', subcategory: 'Community', name: 'Community Investment', value: 2.8, unit: 'M EUR', target: 3.5, previousYear: 2.4, trend: 'up', trendIsPositive: true, esrsStandard: 'S3', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'soc-008', category: 'social', subcategory: 'Privacy', name: 'Data Breach Incidents', value: 1, unit: 'incidents', target: 0, previousYear: 3, trend: 'down', trendIsPositive: true, esrsStandard: 'S4', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'soc-009', category: 'social', subcategory: 'Employee Wellbeing', name: 'Employee Turnover Rate', value: 12, unit: '%', target: 10, previousYear: 15, trend: 'down', trendIsPositive: true, esrsStandard: 'S1', dataQuality: 'reported', lastUpdated: '2026-02-01' },

  // Governance
  { id: 'gov-001', category: 'governance', subcategory: 'Board Diversity', name: 'Board Gender Diversity', value: 42, unit: '%', target: 50, previousYear: 38, trend: 'up', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-15' },
  { id: 'gov-002', category: 'governance', subcategory: 'Board Diversity', name: 'Independent Board Members', value: 67, unit: '%', target: 75, previousYear: 60, trend: 'up', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-15' },
  { id: 'gov-003', category: 'governance', subcategory: 'Executive Compensation', name: 'CEO-to-Worker Pay Ratio', value: 28, unit: ':1', previousYear: 32, trend: 'down', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-15' },
  { id: 'gov-004', category: 'governance', subcategory: 'Anti-Corruption', name: 'Anti-Corruption Training Completion', value: 94, unit: '%', target: 100, previousYear: 88, trend: 'up', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'reported', lastUpdated: '2026-02-01' },
  { id: 'gov-005', category: 'governance', subcategory: 'Anti-Corruption', name: 'Corruption Incidents Reported', value: 0, unit: 'incidents', previousYear: 1, trend: 'down', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'gov-006', category: 'governance', subcategory: 'Lobbying', name: 'Political Contributions', value: 0, unit: 'EUR', previousYear: 0, trend: 'stable', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'gov-007', category: 'governance', subcategory: 'Tax', name: 'Effective Tax Rate', value: 22.4, unit: '%', previousYear: 21.8, trend: 'up', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
  { id: 'gov-008', category: 'governance', subcategory: 'Tax', name: 'Country-by-Country Reporting', value: 100, unit: '%', target: 100, previousYear: 100, trend: 'stable', trendIsPositive: true, esrsStandard: 'G1', dataQuality: 'verified', lastUpdated: '2026-01-31' },
];

const DEMO_ESRS: ESRSStandard[] = [
  { id: 'esrs-e1', code: 'E1', name: 'Climate Change', category: 'environmental', disclosureRequirements: 9, completedDisclosures: 7, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-e2', code: 'E2', name: 'Pollution', category: 'environmental', disclosureRequirements: 6, completedDisclosures: 4, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-e3', code: 'E3', name: 'Water and Marine Resources', category: 'environmental', disclosureRequirements: 5, completedDisclosures: 3, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-e4', code: 'E4', name: 'Biodiversity and Ecosystems', category: 'environmental', disclosureRequirements: 6, completedDisclosures: 2, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-e5', code: 'E5', name: 'Resource Use and Circular Economy', category: 'environmental', disclosureRequirements: 6, completedDisclosures: 5, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-s1', code: 'S1', name: 'Own Workforce', category: 'social', disclosureRequirements: 17, completedDisclosures: 14, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-s2', code: 'S2', name: 'Workers in the Value Chain', category: 'social', disclosureRequirements: 5, completedDisclosures: 3, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-s3', code: 'S3', name: 'Affected Communities', category: 'social', disclosureRequirements: 5, completedDisclosures: 4, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-s4', code: 'S4', name: 'Consumers and End-Users', category: 'social', disclosureRequirements: 5, completedDisclosures: 2, status: 'in_progress', materialityResult: 'material' },
  { id: 'esrs-g1', code: 'G1', name: 'Business Conduct', category: 'governance', disclosureRequirements: 6, completedDisclosures: 5, status: 'in_progress', materialityResult: 'material' },
];

const DEMO_MATERIALITY: MaterialityTopic[] = [
  { id: 'mat-001', topic: 'Climate Change Mitigation', esrsStandard: 'E1', financialMateriality: 9.2, impactMateriality: 9.5, overallMateriality: 'high', stakeholderRelevance: 9.0, status: 'assessed' },
  { id: 'mat-002', topic: 'Climate Change Adaptation', esrsStandard: 'E1', financialMateriality: 8.5, impactMateriality: 8.8, overallMateriality: 'high', stakeholderRelevance: 8.2, status: 'assessed' },
  { id: 'mat-003', topic: 'Air Pollution', esrsStandard: 'E2', financialMateriality: 6.5, impactMateriality: 7.8, overallMateriality: 'medium', stakeholderRelevance: 7.0, status: 'assessed' },
  { id: 'mat-004', topic: 'Water Consumption', esrsStandard: 'E3', financialMateriality: 7.0, impactMateriality: 7.5, overallMateriality: 'medium', stakeholderRelevance: 6.8, status: 'assessed' },
  { id: 'mat-005', topic: 'Biodiversity Loss', esrsStandard: 'E4', financialMateriality: 5.5, impactMateriality: 8.0, overallMateriality: 'medium', stakeholderRelevance: 7.5, status: 'assessed' },
  { id: 'mat-006', topic: 'Circular Economy', esrsStandard: 'E5', financialMateriality: 7.5, impactMateriality: 8.2, overallMateriality: 'high', stakeholderRelevance: 7.8, status: 'assessed' },
  { id: 'mat-007', topic: 'Working Conditions', esrsStandard: 'S1', financialMateriality: 8.0, impactMateriality: 8.5, overallMateriality: 'high', stakeholderRelevance: 9.2, status: 'assessed' },
  { id: 'mat-008', topic: 'Equal Opportunities', esrsStandard: 'S1', financialMateriality: 7.2, impactMateriality: 8.0, overallMateriality: 'high', stakeholderRelevance: 8.5, status: 'assessed' },
  { id: 'mat-009', topic: 'Supply Chain Labour Rights', esrsStandard: 'S2', financialMateriality: 7.8, impactMateriality: 9.0, overallMateriality: 'high', stakeholderRelevance: 8.0, status: 'assessed' },
  { id: 'mat-010', topic: 'Community Engagement', esrsStandard: 'S3', financialMateriality: 5.0, impactMateriality: 6.5, overallMateriality: 'medium', stakeholderRelevance: 6.0, status: 'assessed' },
  { id: 'mat-011', topic: 'Data Privacy & Security', esrsStandard: 'S4', financialMateriality: 8.5, impactMateriality: 7.5, overallMateriality: 'high', stakeholderRelevance: 8.8, status: 'assessed' },
  { id: 'mat-012', topic: 'Business Ethics', esrsStandard: 'G1', financialMateriality: 9.0, impactMateriality: 8.5, overallMateriality: 'high', stakeholderRelevance: 8.5, status: 'assessed' },
  { id: 'mat-013', topic: 'Tax Transparency', esrsStandard: 'G1', financialMateriality: 6.0, impactMateriality: 5.5, overallMateriality: 'medium', stakeholderRelevance: 5.0, status: 'assessed' },
];

const DEMO_SDG: SDGAlignment[] = [
  { sdgNumber: 3, sdgName: 'Good Health and Well-being', alignmentScore: 72, contributingMetrics: ['Employee Satisfaction', 'LTIR', 'Training Hours'], status: 'moderate' },
  { sdgNumber: 5, sdgName: 'Gender Equality', alignmentScore: 68, contributingMetrics: ['Gender Pay Gap', 'Women in Management', 'Board Gender Diversity'], status: 'moderate' },
  { sdgNumber: 6, sdgName: 'Clean Water and Sanitation', alignmentScore: 58, contributingMetrics: ['Water Withdrawal', 'Water Recycled'], status: 'moderate' },
  { sdgNumber: 7, sdgName: 'Affordable and Clean Energy', alignmentScore: 75, contributingMetrics: ['Renewable Energy Share', 'Energy Consumption'], status: 'strong' },
  { sdgNumber: 8, sdgName: 'Decent Work and Economic Growth', alignmentScore: 80, contributingMetrics: ['Employee Turnover', 'Training Hours', 'LTIR'], status: 'strong' },
  { sdgNumber: 12, sdgName: 'Responsible Consumption and Production', alignmentScore: 70, contributingMetrics: ['Waste Diverted', 'Waste Generated'], status: 'moderate' },
  { sdgNumber: 13, sdgName: 'Climate Action', alignmentScore: 82, contributingMetrics: ['Scope 1/2/3 Emissions', 'Energy Consumption'], status: 'strong' },
  { sdgNumber: 15, sdgName: 'Life on Land', alignmentScore: 45, contributingMetrics: ['Sites Near Protected Areas'], status: 'weak' },
  { sdgNumber: 16, sdgName: 'Peace, Justice and Strong Institutions', alignmentScore: 88, contributingMetrics: ['Anti-Corruption Training', 'Corruption Incidents'], status: 'strong' },
];

const DEMO_REPORTS: ESGReport[] = [
  { id: 'rpt-001', title: 'Annual Sustainability Report FY2025', reportingPeriod: 'Jan 2025 - Dec 2025', type: 'annual', status: 'published', csrdCompliant: true, createdAt: '2026-01-15', author: 'ESG Team', pages: 142 },
  { id: 'rpt-002', title: 'Q4 2025 ESG Performance Update', reportingPeriod: 'Oct 2025 - Dec 2025', type: 'interim', status: 'approved', csrdCompliant: false, createdAt: '2026-01-30', author: 'ESG Team', pages: 38 },
  { id: 'rpt-003', title: 'Annual Sustainability Report FY2025 (Draft)', reportingPeriod: 'Jan 2025 - Dec 2025', type: 'annual', status: 'review', csrdCompliant: true, createdAt: '2026-02-10', author: 'ESG Team', pages: 156 },
  { id: 'rpt-004', title: 'Climate Risk & Opportunity Assessment', reportingPeriod: '2025-2030', type: 'thematic', status: 'draft', csrdCompliant: false, createdAt: '2026-02-14', author: 'Risk & Strategy' },
];

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------
const Badge: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {text}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, string> = {
    verified: 'bg-green-100 text-green-700 border-green-200',
    reported: 'bg-blue-100 text-blue-700 border-blue-200',
    estimated: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    not_started: 'bg-gray-100 text-gray-600 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    complete: 'bg-green-100 text-green-700 border-green-200',
    not_material: 'bg-gray-50 text-gray-500 border-gray-200',
    material: 'bg-purple-100 text-purple-700 border-purple-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    assessed: 'bg-green-100 text-green-700 border-green-200',
    under_review: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    review: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    strong: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    weak: 'bg-orange-100 text-orange-700 border-orange-200',
    not_aligned: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge text={label} className={config[status] || 'bg-gray-100 text-gray-700 border-gray-200'} />;
};

const ProgressBar: React.FC<{ value: number; max?: number; color?: string }> = ({ value, max = 100, color = 'bg-blue-500' }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subLabel?: string; color: string; trend?: { direction: 'up' | 'down' | 'stable'; isPositive: boolean; value?: string } }> = ({ icon, label, value, subLabel, color, trend }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.direction === 'up' && <TrendingUp size={14} />}
          {trend.direction === 'down' && <TrendingDown size={14} />}
          {trend.value}
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
    {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
  </div>
);

const MetricRow: React.FC<{ metric: ESGMetric }> = ({ metric }) => {
  const changeFromPrev = metric.previousYear ? ((metric.value - metric.previousYear) / metric.previousYear) * 100 : 0;
  const targetPct = metric.target ? (metric.value / metric.target) * 100 : undefined;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{metric.name}</p>
          <StatusBadge status={metric.dataQuality} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{metric.subcategory} | ESRS {metric.esrsStandard}</p>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-right w-24">
          <p className="font-semibold text-gray-900">{metric.value.toLocaleString()} <span className="text-xs font-normal text-gray-500">{metric.unit}</span></p>
        </div>
        {metric.target && (
          <div className="w-32">
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-gray-500">Target</span>
              <span className="text-gray-700">{metric.target.toLocaleString()}</span>
            </div>
            <ProgressBar value={metric.value} max={metric.target} color={targetPct && targetPct >= 100 ? 'bg-green-500' : targetPct && targetPct >= 80 ? 'bg-blue-500' : 'bg-orange-500'} />
          </div>
        )}
        <div className={`flex items-center gap-1 w-20 justify-end text-xs font-medium ${metric.trendIsPositive ? 'text-green-600' : 'text-red-600'}`}>
          {metric.trend === 'up' && <TrendingUp size={14} />}
          {metric.trend === 'down' && <TrendingDown size={14} />}
          {metric.trend === 'stable' && <span className="text-gray-400">-</span>}
          <span>{Math.abs(changeFromPrev).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ESGReportingModuleProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const ESGReportingModule: React.FC<ESGReportingModuleProps> = ({ onBack }) => {
  const { t } = useI18n();
  type TabId = 'overview' | 'environmental' | 'social' | 'governance' | 'materiality' | 'reports';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [metrics, setMetrics] = useState<ESGMetric[]>(DEMO_METRICS);
  const [esrsStandards, setEsrsStandards] = useState<ESRSStandard[]>(DEMO_ESRS);
  const [materialityTopics, setMaterialityTopics] = useState<MaterialityTopic[]>(DEMO_MATERIALITY);
  const [sdgAlignments, setSdgAlignments] = useState<SDGAlignment[]>(DEMO_SDG);
  const [reports, setReports] = useState<ESGReport[]>(DEMO_REPORTS);
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedESRS, setExpandedESRS] = useState<string | null>(null);

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // serverReachable mirrors API load success; when false the DEMO_* fallback fixtures stay visible
  const [serverReachable, setServerReachable] = useState<boolean>(true);

  // ----- Centralised data loader (reusable for refresh) -----
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        api.modules.esg.listMetrics(),
        api.modules.esg.listMateriality(),
        api.modules.esg.listReports(),
      ]);
      // If every endpoint failed the server is unreachable and DEMO fixtures remain visible
      const allFailed = results.every(r => r.status === 'rejected');
      setServerReachable(!allFailed);
      const apiMetrics = results[0].status === 'fulfilled' ? results[0].value : null;
      const apiMateriality = results[1].status === 'fulfilled' ? results[1].value : null;
      const apiReports = results[2].status === 'fulfilled' ? results[2].value : [];

      // --- Metrics ---
      if (apiMetrics && apiMetrics.length > 0) {
        setMetrics(apiMetrics.map((m: any) => ({
          id: m.id,
          category: m.category || 'environmental',
          subcategory: m.subcategory || '',
          name: m.name || '',
          value: m.value || 0,
          unit: m.unit || '',
          target: m.target,
          previousYear: m.previousYear,
          trend: m.trend || 'stable',
          trendIsPositive: m.trendIsPositive ?? false,
          esrsStandard: m.esrsStandard,
          dataQuality: m.dataQuality || 'reported',
          lastUpdated: m.updatedAt || m.lastUpdated || '',
        })));
      }

      // --- Materiality ---
      if (apiMateriality && apiMateriality.length > 0) {
        setMaterialityTopics(apiMateriality.map((item: any) => ({
          id: item.id,
          topic: item.topic || '',
          esrsStandard: item.esrsStandard || '',
          financialMateriality: item.financialMateriality || 0,
          impactMateriality: item.impactMateriality || 0,
          overallMateriality: item.overallMateriality || 'medium',
          stakeholderRelevance: item.stakeholderRelevance || 0,
          status: item.status || 'pending',
        })));
      }

      // --- ESRS Standards (derived from metrics response when available) ---
      // The API may include esrsStandards alongside metrics; accept if present.
      if ((apiMetrics as any)?.esrsStandards && (apiMetrics as any).esrsStandards.length > 0) {
        setEsrsStandards((apiMetrics as any).esrsStandards.map((s: any) => ({
          id: s.id,
          code: s.code || '',
          name: s.name || '',
          category: s.category || 'cross-cutting',
          disclosureRequirements: s.disclosureRequirements || 0,
          completedDisclosures: s.completedDisclosures || 0,
          status: s.status || 'not_started',
          materialityResult: s.materialityResult,
        })));
      }

      // --- SDG alignments (derived from metrics response when available) ---
      if ((apiMetrics as any)?.sdgAlignments && (apiMetrics as any).sdgAlignments.length > 0) {
        setSdgAlignments((apiMetrics as any).sdgAlignments.map((a: any) => ({
          sdgNumber: a.sdgNumber,
          sdgName: a.sdgName || '',
          alignmentScore: a.alignmentScore || 0,
          contributingMetrics: a.contributingMetrics || [],
          status: a.status || 'not_aligned',
        })));
      }

      // --- Reports (live from /modules/esg/reports) ---
      if (Array.isArray(apiReports) && apiReports.length > 0) {
        setReports(apiReports.map((r: any) => ({
          id: r.id,
          title: r.title || '',
          reportingPeriod: r.reportingPeriod || (r.periodStart && r.periodEnd ? `${String(r.periodStart).slice(0, 10)} – ${String(r.periodEnd).slice(0, 10)}` : ''),
          type: r.type || 'annual',
          status: r.status || 'draft',
          csrdCompliant: r.csrdCompliant ?? (r.framework?.toString().includes('ESRS') ?? false),
          createdAt: r.generatedAt || r.createdAt || '',
          author: r.author || '',
          pages: r.pages,
        })));
      }
    } catch (err: any) {
      setLoadError('Unable to connect to server. Showing local data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed
  const envMetrics = useMemo(() => metrics.filter(m => m.category === 'environmental'), [metrics]);
  const socMetrics = useMemo(() => metrics.filter(m => m.category === 'social'), [metrics]);
  const govMetrics = useMemo(() => metrics.filter(m => m.category === 'governance'), [metrics]);

  // Derive a 0–100 performance score for a set of metrics from their values vs.
  // targets, using each metric's trend/trendIsPositive to infer the desired
  // direction (lower-is-better vs higher-is-better). Returns the score plus the
  // point delta vs the prior reporting year.
  const scoreMetricGroup = useCallback((group: ESGMetric[]): { score: number; delta: number } => {
    if (group.length === 0) return { score: 0, delta: 0 };
    const attainment = (m: ESGMetric, value: number): number => {
      const lowerIsBetter = (m.trend === 'down' && m.trendIsPositive) || (m.trend === 'up' && !m.trendIsPositive);
      if (typeof m.target === 'number' && m.target > 0 && value >= 0) {
        const ratio = lowerIsBetter ? m.target / Math.max(value, 1e-9) : value / m.target;
        return Math.max(0, Math.min(1, ratio));
      }
      // No usable target: fall back to whether the latest movement is favourable.
      return m.trendIsPositive ? 0.75 : 0.5;
    };
    const current = group.reduce((s, m) => s + attainment(m, m.value), 0) / group.length;
    const withPrev = group.filter(m => typeof m.previousYear === 'number');
    let delta = 0;
    if (withPrev.length > 0) {
      const prev = withPrev.reduce((s, m) => s + attainment(m, m.previousYear as number), 0) / withPrev.length;
      const curForPrev = withPrev.reduce((s, m) => s + attainment(m, m.value), 0) / withPrev.length;
      delta = Math.round((curForPrev - prev) * 100);
    }
    return { score: Math.round(current * 100), delta };
  }, []);

  const esgScore = useMemo(() => {
    const env = scoreMetricGroup(envMetrics);
    const soc = scoreMetricGroup(socMetrics);
    const gov = scoreMetricGroup(govMetrics);
    return {
      overall: Math.round(env.score * 0.4 + soc.score * 0.3 + gov.score * 0.3),
      envScore: env.score, socScore: soc.score, govScore: gov.score,
      envDelta: env.delta, socDelta: soc.delta, govDelta: gov.delta,
    };
  }, [envMetrics, socMetrics, govMetrics, scoreMetricGroup]);

  const esrsProgress = useMemo(() => {
    const totalDisclosures = esrsStandards.reduce((s, e) => s + e.disclosureRequirements, 0);
    const completedDisclosures = esrsStandards.reduce((s, e) => s + e.completedDisclosures, 0);
    return { total: totalDisclosures, completed: completedDisclosures, pct: Math.round((completedDisclosures / totalDisclosures) * 100) };
  }, [esrsStandards]);

  // Tab definitions
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('common.overview'), icon: BarChart3 },
    { id: 'environmental', label: 'Environmental', icon: Leaf },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'governance', label: 'Governance', icon: Shield },
    { id: 'materiality', label: 'Materiality', icon: Scale },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  // ---------------------------------------------------------------------------
  // Render: Overview Tab
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* ESG Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">Overall ESG Score</p>
          <p className="text-5xl font-bold mt-2">{esgScore.overall}</p>
          <p className="text-sm opacity-70 mt-1">out of 100</p>
          <p className="text-xs opacity-60 mt-3">Industry benchmark: 62</p>
        </div>
        <StatCard icon={<Leaf size={20} className="text-green-600" />} label="Environmental Score" value={esgScore.envScore} subLabel="Weight: 40%" color="bg-green-50" trend={esgScore.envDelta !== 0 ? { direction: esgScore.envDelta > 0 ? 'up' : 'down', isPositive: esgScore.envDelta > 0, value: `${esgScore.envDelta > 0 ? '+' : ''}${esgScore.envDelta}pts` } : undefined} />
        <StatCard icon={<Users size={20} className="text-blue-600" />} label="Social Score" value={esgScore.socScore} subLabel="Weight: 30%" color="bg-blue-50" trend={esgScore.socDelta !== 0 ? { direction: esgScore.socDelta > 0 ? 'up' : 'down', isPositive: esgScore.socDelta > 0, value: `${esgScore.socDelta > 0 ? '+' : ''}${esgScore.socDelta}pts` } : undefined} />
        <StatCard icon={<Shield size={20} className="text-purple-600" />} label="Governance Score" value={esgScore.govScore} subLabel="Weight: 30%" color="bg-purple-50" trend={esgScore.govDelta !== 0 ? { direction: esgScore.govDelta > 0 ? 'up' : 'down', isPositive: esgScore.govDelta > 0, value: `${esgScore.govDelta > 0 ? '+' : ''}${esgScore.govDelta}pts` } : undefined} />
      </div>

      {/* ESRS Compliance Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ESRS Compliance Progress</h3>
            <p className="text-sm text-gray-500 mt-0.5">{esrsProgress.completed} of {esrsProgress.total} disclosure requirements completed ({esrsProgress.pct}%)</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{esrsProgress.pct}%</p>
          </div>
        </div>
        <ProgressBar value={esrsProgress.pct} color="bg-blue-500" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {esrsStandards.map(std => {
            const pct = std.disclosureRequirements > 0 ? Math.round((std.completedDisclosures / std.disclosureRequirements) * 100) : 0;
            const catColors: Record<string, string> = { environmental: 'border-green-300 bg-green-50', social: 'border-blue-300 bg-blue-50', governance: 'border-purple-300 bg-purple-50', 'cross-cutting': 'border-gray-300 bg-gray-50' };
            return (
              <div key={std.id} className={`p-3 rounded-lg border ${catColors[std.category]} cursor-pointer hover:shadow-sm transition-shadow`} onClick={() => setExpandedESRS(expandedESRS === std.id ? null : std.id)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">{std.code}</span>
                  <span className="text-xs font-medium text-gray-600">{pct}%</span>
                </div>
                <p className="text-xs text-gray-600 mb-2 truncate" title={std.name}>{std.name}</p>
                <ProgressBar value={pct} color={pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : 'bg-orange-500'} />
                <p className="text-xs text-gray-400 mt-1">{std.completedDisclosures}/{std.disclosureRequirements} disclosures</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Leaf size={18} className="text-green-600" />
            <h3 className="text-base font-semibold text-gray-900">Environmental Highlights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total GHG Emissions</span>
              <span className="text-sm font-semibold text-gray-900">66,350 tCO2e</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Renewable Energy</span>
              <span className="text-sm font-semibold text-green-600">62%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Waste Diversion Rate</span>
              <span className="text-sm font-semibold text-blue-600">72%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Water Recycled</span>
              <span className="text-sm font-semibold text-teal-600">38%</span>
            </div>
          </div>
        </div>

        {/* Social Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Social Highlights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Employee Satisfaction</span>
              <span className="text-sm font-semibold text-gray-900">78%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gender Pay Gap</span>
              <span className="text-sm font-semibold text-yellow-600">5.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Women in Management</span>
              <span className="text-sm font-semibold text-blue-600">38%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">HRDD Coverage</span>
              <span className="text-sm font-semibold text-green-600">85%</span>
            </div>
          </div>
        </div>

        {/* Governance Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-purple-600" />
            <h3 className="text-base font-semibold text-gray-900">Governance Highlights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Board Gender Diversity</span>
              <span className="text-sm font-semibold text-gray-900">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Independent Board Members</span>
              <span className="text-sm font-semibold text-green-600">67%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Anti-Corruption Training</span>
              <span className="text-sm font-semibold text-blue-600">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CEO-to-Worker Pay Ratio</span>
              <span className="text-sm font-semibold text-gray-900">28:1</span>
            </div>
          </div>
        </div>
      </div>

      {/* SDG Alignment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">UN Sustainable Development Goals Alignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sdgAlignments.map(sdg => {
            const barColor = sdg.alignmentScore >= 75 ? 'bg-green-500' : sdg.alignmentScore >= 50 ? 'bg-yellow-500' : 'bg-orange-500';
            return (
              <div key={sdg.sdgNumber} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{sdg.sdgNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{sdg.sdgName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${sdg.alignmentScore}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{sdg.alignmentScore}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Environmental Tab
  // ---------------------------------------------------------------------------
  const renderEnvironmental = () => {
    const subcategories = [...new Set(envMetrics.map(m => m.subcategory))];
    const totalGHG = envMetrics.filter(m => m.subcategory === 'GHG Emissions').reduce((s, m) => s + m.value, 0);

    return (
      <div className="space-y-6">
        {/* GHG Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Flame size={20} className="text-orange-600" />} label="Scope 1 Emissions" value="12,450 tCO2e" color="bg-orange-50" trend={{ direction: 'down', isPositive: true, value: '-5.7%' }} />
          <StatCard icon={<Zap size={20} className="text-yellow-600" />} label="Scope 2 Emissions" value="8,300 tCO2e" color="bg-yellow-50" trend={{ direction: 'down', isPositive: true, value: '-8.8%' }} />
          <StatCard icon={<Globe size={20} className="text-blue-600" />} label="Scope 3 Emissions" value="45,600 tCO2e" color="bg-blue-50" trend={{ direction: 'down', isPositive: true, value: '-5.4%' }} />
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80">Total GHG Emissions</p>
            <p className="text-3xl font-bold mt-1">{totalGHG.toLocaleString()}</p>
            <p className="text-xs opacity-70 mt-1">tCO2e</p>
            <div className="mt-2 flex items-center gap-1 text-xs">
              <TrendingDown size={14} />
              <span>-6.2% YoY</span>
            </div>
          </div>
        </div>

        {/* Emissions Breakdown Visual */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GHG Emissions Breakdown</h3>
          <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden mb-3">
            <div className="bg-orange-500 h-full transition-all" style={{ width: `${(12450 / totalGHG) * 100}%` }} title="Scope 1" />
            <div className="bg-yellow-500 h-full transition-all" style={{ width: `${(8300 / totalGHG) * 100}%` }} title="Scope 2" />
            <div className="bg-blue-500 h-full transition-all" style={{ width: `${(45600 / totalGHG) * 100}%` }} title="Scope 3" />
          </div>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500" />Scope 1: {((12450 / totalGHG) * 100).toFixed(1)}%</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500" />Scope 2: {((8300 / totalGHG) * 100).toFixed(1)}%</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" />Scope 3: {((45600 / totalGHG) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* All Environmental Metrics */}
        {subcategories.map(sub => (
          <div key={sub} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">{sub}</h3>
            <div className="space-y-2">
              {envMetrics.filter(m => m.subcategory === sub).map(m => <MetricRow key={m.id} metric={m} />)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Social Tab
  // ---------------------------------------------------------------------------
  const renderSocial = () => {
    const subcategories = [...new Set(socMetrics.map(m => m.subcategory))];

    return (
      <div className="space-y-6">
        {/* Social Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Heart size={20} className="text-pink-600" />} label="Employee Satisfaction" value="78%" color="bg-pink-50" trend={{ direction: 'up', isPositive: true, value: '+4pts' }} />
          <StatCard icon={<Users size={20} className="text-blue-600" />} label="Women in Management" value="38%" color="bg-blue-50" trend={{ direction: 'up', isPositive: true, value: '+4pts' }} />
          <StatCard icon={<Shield size={20} className="text-indigo-600" />} label="HRDD Coverage" value="85%" color="bg-indigo-50" trend={{ direction: 'up', isPositive: true, value: '+13pts' }} />
          <StatCard icon={<Lock size={20} className="text-red-600" />} label="Data Breaches" value="1" subLabel="Target: 0" color="bg-red-50" trend={{ direction: 'down', isPositive: true, value: '-67%' }} />
        </div>

        {/* Social Metrics by Subcategory */}
        {subcategories.map(sub => (
          <div key={sub} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">{sub}</h3>
            <div className="space-y-2">
              {socMetrics.filter(m => m.subcategory === sub).map(m => <MetricRow key={m.id} metric={m} />)}
            </div>
          </div>
        ))}

        {/* D&I Progress Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Diversity & Inclusion Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Gender Pay Gap Reduction</p>
              <div className="flex items-end gap-3">
                {[{ year: '2023', value: 9.8 }, { year: '2024', value: 7.1 }, { year: '2025', value: 5.2 }].map(item => (
                  <div key={item.year} className="flex-1 text-center">
                    <div className="bg-gray-100 rounded-t-lg relative h-32 flex items-end justify-center overflow-hidden">
                      <div className="bg-blue-500 w-full rounded-t-lg transition-all" style={{ height: `${(item.value / 12) * 100}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.year}</p>
                    <p className="text-xs font-semibold text-gray-900">{item.value}%</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Target: 3.0% by 2027</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Women in Leadership Positions</p>
              <div className="flex items-end gap-3">
                {[{ year: '2023', value: 30 }, { year: '2024', value: 34 }, { year: '2025', value: 38 }].map(item => (
                  <div key={item.year} className="flex-1 text-center">
                    <div className="bg-gray-100 rounded-t-lg relative h-32 flex items-end justify-center overflow-hidden">
                      <div className="bg-purple-500 w-full rounded-t-lg transition-all" style={{ height: `${(item.value / 50) * 100}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.year}</p>
                    <p className="text-xs font-semibold text-gray-900">{item.value}%</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Target: 45% by 2027</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Governance Tab
  // ---------------------------------------------------------------------------
  const renderGovernance = () => {
    const subcategories = [...new Set(govMetrics.map(m => m.subcategory))];

    return (
      <div className="space-y-6">
        {/* Governance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Building2 size={20} className="text-purple-600" />} label="Board Gender Diversity" value="42%" color="bg-purple-50" trend={{ direction: 'up', isPositive: true, value: '+4pts' }} />
          <StatCard icon={<Scale size={20} className="text-indigo-600" />} label="Independent Directors" value="67%" color="bg-indigo-50" trend={{ direction: 'up', isPositive: true, value: '+7pts' }} />
          <StatCard icon={<Shield size={20} className="text-green-600" />} label="Anti-Corruption Training" value="94%" color="bg-green-50" trend={{ direction: 'up', isPositive: true, value: '+6pts' }} />
          <StatCard icon={<Briefcase size={20} className="text-blue-600" />} label="CEO Pay Ratio" value="28:1" color="bg-blue-50" trend={{ direction: 'down', isPositive: true, value: '-12.5%' }} />
        </div>

        {/* Governance Metrics */}
        {subcategories.map(sub => (
          <div key={sub} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">{sub}</h3>
            <div className="space-y-2">
              {govMetrics.filter(m => m.subcategory === sub).map(m => <MetricRow key={m.id} metric={m} />)}
            </div>
          </div>
        ))}

        {/* Board Composition */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Board Composition Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Gender Split</p>
              <div className="flex items-center justify-center gap-2 h-6 rounded-lg overflow-hidden">
                <div className="bg-purple-500 h-full rounded-l-lg" style={{ width: '42%' }} />
                <div className="bg-gray-300 h-full rounded-r-lg" style={{ width: '58%' }} />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" />Women 42%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-300" />Men 58%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Independence</p>
              <div className="flex items-center justify-center gap-2 h-6 rounded-lg overflow-hidden">
                <div className="bg-green-500 h-full rounded-l-lg" style={{ width: '67%' }} />
                <div className="bg-gray-300 h-full rounded-r-lg" style={{ width: '33%' }} />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" />Independent 67%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-300" />Executive 33%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Tenure Distribution</p>
              <div className="flex items-center justify-center gap-1 h-6 rounded-lg overflow-hidden">
                <div className="bg-blue-400 h-full rounded-l-lg" style={{ width: '33%' }} />
                <div className="bg-blue-600 h-full" style={{ width: '42%' }} />
                <div className="bg-blue-800 h-full rounded-r-lg" style={{ width: '25%' }} />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" />&lt;3y</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600" />3-6y</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-800" />&gt;6y</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Materiality Tab
  // ---------------------------------------------------------------------------
  const renderMateriality = () => {
    const highTopics = materialityTopics.filter(mt => mt.overallMateriality === 'high');
    const mediumTopics = materialityTopics.filter(mt => mt.overallMateriality === 'medium');

    return (
      <div className="space-y-6">
        {/* Materiality Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Target size={20} className="text-red-600" />} label="High Materiality" value={highTopics.length} subLabel="Requires detailed disclosure" color="bg-red-50" />
          <StatCard icon={<Target size={20} className="text-yellow-600" />} label="Medium Materiality" value={mediumTopics.length} subLabel="Condensed disclosure" color="bg-yellow-50" />
          <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Assessed Topics" value={`${materialityTopics.filter(mt => mt.status === 'assessed').length}/${materialityTopics.length}`} subLabel="Double materiality complete" color="bg-green-50" />
        </div>

        {/* Double Materiality Matrix (visual) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Double Materiality Assessment Matrix</h3>
          <p className="text-sm text-gray-500 mb-4">Financial materiality (x-axis) vs Impact materiality (y-axis)</p>
          <div className="relative" style={{ height: '320px' }}>
            {/* Grid */}
            <div className="absolute inset-0 border-l-2 border-b-2 border-gray-300">
              {/* Quadrants */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-50 opacity-50" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-50 opacity-50" />
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-50 opacity-50" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-50 opacity-50" />

              {/* Plot points */}
              {materialityTopics.map(topic => {
                const left = `${(topic.financialMateriality / 10) * 100}%`;
                const bottom = `${(topic.impactMateriality / 10) * 100}%`;
                const dotColor = topic.overallMateriality === 'high' ? 'bg-red-500' : topic.overallMateriality === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
                return (
                  <div
                    key={topic.id}
                    className={`absolute w-5 h-5 rounded-full ${dotColor} border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform`}
                    style={{ left, bottom, transform: 'translate(-50%, 50%)' }}
                    title={`${topic.topic}: Financial ${topic.financialMateriality}, Impact ${topic.impactMateriality}`}
                  />
                );
              })}
            </div>
            {/* Axis Labels */}
            <p className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">Financial Materiality</p>
            <p className="absolute -left-1 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-500 origin-center">Impact Materiality</p>
          </div>
          <div className="flex gap-4 mt-8 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> High Materiality</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Medium Materiality</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Low Materiality</span>
          </div>
        </div>

        {/* Materiality Topics Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Materiality Assessment Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Topic</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">ESRS</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">Financial</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">Impact</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">Stakeholder</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Overall</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {materialityTopics.map(topic => (
                  <tr key={topic.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{topic.topic}</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-mono">{topic.esrsStandard}</span></td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-semibold ${topic.financialMateriality >= 8 ? 'text-red-600' : topic.financialMateriality >= 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {topic.financialMateriality.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-semibold ${topic.impactMateriality >= 8 ? 'text-red-600' : topic.impactMateriality >= 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {topic.impactMateriality.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-700">{topic.stakeholderRelevance.toFixed(1)}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={topic.overallMateriality} /></td>
                    <td className="py-2.5 px-3"><StatusBadge status={topic.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Reports Tab
  // ---------------------------------------------------------------------------
  const renderReports = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={20} className="text-blue-600" />} label="Total Reports" value={reports.length} color="bg-blue-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Published" value={reports.filter(r => r.status === 'published').length} color="bg-green-50" />
        <StatCard icon={<Shield size={20} className="text-purple-600" />} label="CSRD Compliant" value={reports.filter(r => r.csrdCompliant).length} color="bg-purple-50" />
        <StatCard icon={<Edit3 size={20} className="text-yellow-600" />} label="In Progress" value={reports.filter(r => r.status === 'draft' || r.status === 'review').length} color="bg-yellow-50" />
      </div>

      {/* Generate Report Button */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">CSRD Report Generator</h3>
            <p className="text-sm opacity-80 mt-1">Generate a CSRD-compliant sustainability report using collected ESG data and ESRS disclosure requirements.</p>
          </div>
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm">
            <FileText size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* Existing Reports */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainability Reports</h3>
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${report.status === 'published' ? 'bg-emerald-50' : report.status === 'approved' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <FileText size={20} className={report.status === 'published' ? 'text-emerald-600' : report.status === 'approved' ? 'text-green-600' : 'text-gray-500'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{report.reportingPeriod}</span>
                    <span>by {report.author}</span>
                    {report.pages && <span>{report.pages} pages</span>}
                    <span>{report.createdAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {report.csrdCompliant && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">CSRD</span>}
                <StatusBadge status={report.status} />
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Eye size={14} className="text-gray-500" /></button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Download size={14} className="text-gray-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Collection Workflows */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection Workflows</h3>
        <div className="space-y-3">
          {[
            { name: 'GHG Emissions Data (Scope 1/2/3)', owner: 'Sustainability Team', deadline: '2026-03-31', progress: 85, status: 'in_progress' },
            { name: 'Energy Consumption & Renewable Mix', owner: 'Facilities Management', deadline: '2026-03-15', progress: 92, status: 'in_progress' },
            { name: 'Water Withdrawal & Recycling Data', owner: 'Operations', deadline: '2026-03-20', progress: 70, status: 'in_progress' },
            { name: 'Employee Wellbeing Survey Results', owner: 'HR Department', deadline: '2026-02-28', progress: 100, status: 'complete' },
            { name: 'Supply Chain HRDD Assessment', owner: 'Procurement', deadline: '2026-04-15', progress: 55, status: 'in_progress' },
            { name: 'Board Composition & Governance Data', owner: 'Company Secretary', deadline: '2026-02-15', progress: 100, status: 'complete' },
          ].map((workflow, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{workflow.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Owner: {workflow.owner} | Deadline: {workflow.deadline}</p>
              </div>
              <div className="flex items-center gap-3 w-48">
                <div className="flex-1">
                  <ProgressBar value={workflow.progress} color={workflow.progress === 100 ? 'bg-green-500' : 'bg-blue-500'} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-8 text-right">{workflow.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Report generation handler
  // ---------------------------------------------------------------------------
  const [reportFormType, setReportFormType] = useState<'annual' | 'interim' | 'thematic'>('annual');
  const [reportFormStart, setReportFormStart] = useState('2025-01-01');
  const [reportFormEnd, setReportFormEnd] = useState('2025-12-31');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    setIsGeneratingReport(true);
    try {
      const newReport = await api.modules.esg.generateReport({
        type: reportFormType,
        periodStart: reportFormStart,
        periodEnd: reportFormEnd,
      });
      if (newReport && newReport.id) {
        setReports(prev => [newReport as ESGReport, ...prev]);
      }
      setShowReportModal(false);
    } catch (err: any) {
      setLoadError('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [reportFormType, reportFormStart, reportFormEnd]);

  // ---------------------------------------------------------------------------
  // Metric CRUD handlers
  // ---------------------------------------------------------------------------
  const handleCreateMetric = useCallback(async (data: Partial<ESGMetric>) => {
    try {
      const created = await api.modules.esg.createMetric(data);
      if (created && created.id) {
        setMetrics(prev => [...prev, created as ESGMetric]);
      }
    } catch (err: any) {
      setLoadError('Failed to create metric.');
    }
  }, []);

  const handleUpdateMetric = useCallback(async (id: string, data: Partial<ESGMetric>) => {
    try {
      const updated = await api.modules.esg.updateMetric(id, data);
      if (updated) {
        setMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      }
    } catch (err: any) {
      setLoadError('Failed to update metric.');
    }
  }, []);

  const handleDeleteMetric = useCallback(async (id: string) => {
    try {
      await api.modules.esg.deleteMetric(id);
      setMetrics(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setLoadError('Failed to delete metric.');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Materiality CRUD handlers
  // ---------------------------------------------------------------------------
  const handleCreateMateriality = useCallback(async (data: Partial<MaterialityTopic>) => {
    try {
      const created = await api.modules.esg.createMateriality(data);
      if (created && created.id) {
        setMaterialityTopics(prev => [...prev, created as MaterialityTopic]);
      }
    } catch (err: any) {
      setLoadError('Failed to create materiality topic.');
    }
  }, []);

  const handleUpdateMateriality = useCallback(async (id: string, data: Partial<MaterialityTopic>) => {
    try {
      const updated = await api.modules.esg.updateMateriality(id, data);
      if (updated) {
        setMaterialityTopics(prev => prev.map(mt => mt.id === id ? { ...mt, ...updated } : mt));
      }
    } catch (err: any) {
      setLoadError('Failed to update materiality topic.');
    }
  }, []);

  const handleDeleteMateriality = useCallback(async (id: string) => {
    try {
      await api.modules.esg.deleteMateriality(id);
      setMaterialityTopics(prev => prev.filter(mt => mt.id !== id));
    } catch (err: any) {
      setLoadError('Failed to delete materiality topic.');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------
  const renderReportModal = () => showReportModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Generate Sustainability Report</h3>
          <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select value={reportFormType} onChange={e => setReportFormType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="annual">Annual CSRD Report</option>
              <option value="interim">Interim ESG Update</option>
              <option value="thematic">Thematic Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={reportFormStart} onChange={e => setReportFormStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={reportFormEnd} onChange={e => setReportFormEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Include Sections</label>
            <div className="space-y-2">
              {['Environmental Metrics (E1-E5)', 'Social Metrics (S1-S4)', 'Governance Metrics (G1)', 'Materiality Assessment', 'SDG Alignment', 'YoY Trend Analysis'].map(section => (
                <label key={section} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  {section}
                </label>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">The report will be generated in CSRD-compliant XHTML format, including ESRS cross-references and assured data points.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
          <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESG & CSRD Reporting</h1>
            <p className="text-gray-600 mt-1">Sustainability metrics, ESRS compliance, and double materiality assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
          </button>
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
            <FileText size={16} /> Generate Report
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Loading ESG data...</span>
        </div>
      )}
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700">{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'environmental' && renderEnvironmental()}
      {activeTab === 'social' && renderSocial()}
      {activeTab === 'governance' && renderGovernance()}
      {activeTab === 'materiality' && renderMateriality()}
      {activeTab === 'reports' && renderReports()}

      {/* Modals */}
      {renderReportModal()}
    </div>
  );
};

export default ESGReportingModule;
