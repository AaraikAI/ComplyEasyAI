import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft, Search, Plus, Download, Eye, Edit3, Trash2,
  AlertTriangle, ShieldCheck, Shield, CheckCircle, XCircle,
  Clock, Globe, FileText, Loader2, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, Filter,
  BarChart3, Activity, Zap, Bell, Archive,
  TrendingUp, TrendingDown, Minus, X, Sparkles, Brain,
  Leaf, Recycle, Droplets, Wind, Sun, Flame,
  Factory, Truck, Home, Package, Trash, TreePine,
  Gauge, Target, Award, Info, Settings, Lightbulb,
  PieChart as PieChartIcon, ArrowRight, CircleDot, Scale,
  Thermometer, Cloud, Waves, Mountain, Gem, Hammer,
  Wrench, RotateCcw, Battery, Cpu, Layers,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LifecycleStage = 'raw_materials' | 'manufacturing' | 'distribution' | 'use' | 'end_of_life';
type ImpactCategory = 'climate_change' | 'ozone_depletion' | 'acidification' | 'eutrophication' | 'resource_depletion';
type MainTab = 'overview' | 'lifecycle_stages' | 'impact_assessment' | 'improvements' | 'reports';

interface LifecycleStageData {
  id: string;
  stage: LifecycleStage;
  label: string;
  icon: React.ReactNode;
  description: string;
  co2eKg: number;
  energyMJ: number;
  waterL: number;
  wasteKg: number;
  percentOfTotal: number;
  processes: ProcessData[];
}

interface ProcessData {
  name: string;
  co2eKg: number;
  energyMJ: number;
  description: string;
}

interface ImpactCategoryData {
  id: string;
  category: ImpactCategory;
  label: string;
  unit: string;
  icon: React.ReactNode;
  totalValue: number;
  benchmarkValue: number;
  stages: { stage: LifecycleStage; value: number }[];
  description: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  version: string;
  category: string;
  totalCO2e: number;
  recyclability: number;
  durabilityYears: number;
  repairabilityScore: number;
  energyEfficiency: string;
  certifications: string[];
  lastAssessment: string;
}

interface Improvement {
  id: string;
  title: string;
  stage: LifecycleStage;
  category: ImpactCategory;
  description: string;
  estimatedReduction: number;
  reductionUnit: string;
  effort: 'Low' | 'Medium' | 'High';
  cost: 'Low' | 'Medium' | 'High';
  timeline: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'implemented' | 'rejected';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  regulatoryDriver: string;
}

interface LCAReport {
  id: string;
  name: string;
  productId: string;
  generatedDate: string;
  methodology: string;
  scope: string;
  totalCO2e: number;
  complianceStatus: string;
  regulations: string[];
  status: 'draft' | 'review' | 'approved' | 'published';
}

interface CircularMetrics {
  recyclability: number;
  recycledContent: number;
  durability: number;
  repairability: number;
  reusability: number;
  energyRecovery: number;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_PRODUCTS: Product[] = [
  { id: 'EP001', name: 'ComplyEasy IoT Sensor Hub', version: '2.0', category: 'Hardware', totalCO2e: 45.8, recyclability: 72, durabilityYears: 8, repairabilityScore: 6.5, energyEfficiency: 'A', certifications: ['EU Ecolabel', 'Energy Star'], lastAssessment: '2026-01-15' },
  { id: 'EP002', name: 'SecureGate Access Controller', version: '3.1', category: 'Hardware', totalCO2e: 68.3, recyclability: 65, durabilityYears: 10, repairabilityScore: 7.2, energyEfficiency: 'B', certifications: ['Energy Star'], lastAssessment: '2025-11-20' },
  { id: 'EP003', name: 'ComplyEasy Platform (SaaS)', version: '2.5', category: 'Software/Cloud', totalCO2e: 12.4, recyclability: 100, durabilityYears: 0, repairabilityScore: 10, energyEfficiency: 'A+', certifications: ['Green Web Foundation'], lastAssessment: '2026-02-01' },
];

const DEMO_STAGES: LifecycleStageData[] = [
  {
    id: 'LS001', stage: 'raw_materials', label: 'Raw Materials', icon: <Mountain className="w-5 h-5" />,
    description: 'Extraction and processing of raw materials including metals, plastics, and rare earth elements.',
    co2eKg: 12.5, energyMJ: 180, waterL: 850, wasteKg: 3.2, percentOfTotal: 27,
    processes: [
      { name: 'Metal ore mining & refining', co2eKg: 5.8, energyMJ: 85, description: 'Copper, aluminum, steel extraction' },
      { name: 'Plastic resin production', co2eKg: 3.1, energyMJ: 42, description: 'ABS, polycarbonate synthesis' },
      { name: 'PCB substrate production', co2eKg: 2.0, energyMJ: 28, description: 'Fiberglass epoxy laminate' },
      { name: 'Rare earth element extraction', co2eKg: 1.6, energyMJ: 25, description: 'Neodymium, tantalum sourcing' },
    ],
  },
  {
    id: 'LS002', stage: 'manufacturing', label: 'Manufacturing', icon: <Factory className="w-5 h-5" />,
    description: 'Component assembly, PCB manufacturing, testing, and quality assurance processes.',
    co2eKg: 15.3, energyMJ: 220, waterL: 420, wasteKg: 2.8, percentOfTotal: 33,
    processes: [
      { name: 'PCB assembly (SMT)', co2eKg: 4.2, energyMJ: 55, description: 'Surface mount technology placement' },
      { name: 'Enclosure manufacturing', co2eKg: 3.8, energyMJ: 48, description: 'Injection molding, CNC machining' },
      { name: 'Final assembly & testing', co2eKg: 3.5, energyMJ: 45, description: 'Integration, burn-in testing, QA' },
      { name: 'Firmware programming', co2eKg: 0.8, energyMJ: 12, description: 'Flash programming, calibration' },
      { name: 'Packaging', co2eKg: 3.0, energyMJ: 60, description: 'Packaging materials and process' },
    ],
  },
  {
    id: 'LS003', stage: 'distribution', label: 'Distribution', icon: <Truck className="w-5 h-5" />,
    description: 'Transportation from manufacturing to distribution centers and end customers.',
    co2eKg: 5.2, energyMJ: 75, waterL: 15, wasteKg: 0.8, percentOfTotal: 11,
    processes: [
      { name: 'Sea freight (factory to hub)', co2eKg: 1.8, energyMJ: 25, description: 'Container shipping from Asia' },
      { name: 'Warehouse operations', co2eKg: 0.6, energyMJ: 10, description: 'Storage, handling, climate control' },
      { name: 'Last-mile delivery', co2eKg: 2.8, energyMJ: 40, description: 'Truck and van delivery to customers' },
    ],
  },
  {
    id: 'LS004', stage: 'use', label: 'Use Phase', icon: <Home className="w-5 h-5" />,
    description: 'Energy consumption and maintenance during product operational lifetime (8 years).',
    co2eKg: 8.5, energyMJ: 950, waterL: 0, wasteKg: 0.5, percentOfTotal: 19,
    processes: [
      { name: 'Electricity consumption', co2eKg: 6.8, energyMJ: 850, description: '5W average, 8-year lifetime, EU grid mix' },
      { name: 'Network connectivity', co2eKg: 1.2, energyMJ: 80, description: 'WiFi/Ethernet data transmission overhead' },
      { name: 'Maintenance & repairs', co2eKg: 0.5, energyMJ: 20, description: 'Replacement parts, firmware updates' },
    ],
  },
  {
    id: 'LS005', stage: 'end_of_life', label: 'End of Life', icon: <Recycle className="w-5 h-5" />,
    description: 'Collection, disassembly, recycling, and disposal of product at end of useful life.',
    co2eKg: 4.3, energyMJ: 35, waterL: 120, wasteKg: 1.2, percentOfTotal: 10,
    processes: [
      { name: 'Collection & logistics', co2eKg: 1.2, energyMJ: 15, description: 'Take-back program logistics' },
      { name: 'Disassembly', co2eKg: 0.4, energyMJ: 5, description: 'Manual and automated disassembly' },
      { name: 'Material recycling', co2eKg: -1.5, energyMJ: -25, description: 'Metal, plastic recovery (credit)' },
      { name: 'WEEE processing', co2eKg: 2.5, energyMJ: 20, description: 'Hazardous material handling' },
      { name: 'Landfill (non-recyclable)', co2eKg: 1.7, energyMJ: 20, description: 'Residual waste disposal' },
    ],
  },
];

const DEMO_IMPACT_CATEGORIES: ImpactCategoryData[] = [
  {
    id: 'IC001', category: 'climate_change', label: 'Climate Change (GWP)', unit: 'kg CO2-eq',
    icon: <Thermometer className="w-5 h-5" />, totalValue: 45.8, benchmarkValue: 55.0,
    stages: [
      { stage: 'raw_materials', value: 12.5 }, { stage: 'manufacturing', value: 15.3 },
      { stage: 'distribution', value: 5.2 }, { stage: 'use', value: 8.5 }, { stage: 'end_of_life', value: 4.3 },
    ],
    description: 'Global warming potential measured in CO2 equivalents over 100-year timeframe.',
    color: 'red',
  },
  {
    id: 'IC002', category: 'ozone_depletion', label: 'Ozone Depletion (ODP)', unit: 'kg CFC-11-eq',
    icon: <Sun className="w-5 h-5" />, totalValue: 0.000018, benchmarkValue: 0.000025,
    stages: [
      { stage: 'raw_materials', value: 0.000005 }, { stage: 'manufacturing', value: 0.000008 },
      { stage: 'distribution', value: 0.000001 }, { stage: 'use', value: 0.000002 }, { stage: 'end_of_life', value: 0.000002 },
    ],
    description: 'Destruction of the stratospheric ozone layer by anthropogenic emissions.',
    color: 'purple',
  },
  {
    id: 'IC003', category: 'acidification', label: 'Acidification (AP)', unit: 'mol H+-eq',
    icon: <Droplets className="w-5 h-5" />, totalValue: 0.38, benchmarkValue: 0.52,
    stages: [
      { stage: 'raw_materials', value: 0.12 }, { stage: 'manufacturing', value: 0.14 },
      { stage: 'distribution', value: 0.04 }, { stage: 'use', value: 0.05 }, { stage: 'end_of_life', value: 0.03 },
    ],
    description: 'Increased acidity in water and soil systems caused by SO2, NOx, and HCl emissions.',
    color: 'yellow',
  },
  {
    id: 'IC004', category: 'eutrophication', label: 'Eutrophication (EP)', unit: 'kg PO4-eq',
    icon: <Waves className="w-5 h-5" />, totalValue: 0.025, benchmarkValue: 0.035,
    stages: [
      { stage: 'raw_materials', value: 0.008 }, { stage: 'manufacturing', value: 0.009 },
      { stage: 'distribution', value: 0.002 }, { stage: 'use', value: 0.003 }, { stage: 'end_of_life', value: 0.003 },
    ],
    description: 'Excessive nutrient enrichment in aquatic and terrestrial ecosystems.',
    color: 'green',
  },
  {
    id: 'IC005', category: 'resource_depletion', label: 'Resource Depletion (ADP)', unit: 'kg Sb-eq',
    icon: <Gem className="w-5 h-5" />, totalValue: 0.00045, benchmarkValue: 0.00065,
    stages: [
      { stage: 'raw_materials', value: 0.00025 }, { stage: 'manufacturing', value: 0.0001 },
      { stage: 'distribution', value: 0.00001 }, { stage: 'use', value: 0.00002 }, { stage: 'end_of_life', value: 0.00007 },
    ],
    description: 'Consumption of non-renewable resources measured in antimony equivalents.',
    color: 'blue',
  },
];

const DEMO_IMPROVEMENTS: Improvement[] = [
  { id: 'IMP001', title: 'Switch to recycled aluminum enclosure', stage: 'raw_materials', category: 'climate_change', description: 'Replace virgin aluminum with 80% post-consumer recycled aluminum for the product enclosure. This reduces mining impact and smelting energy by approximately 40%.', estimatedReduction: 2.8, reductionUnit: 'kg CO2-eq', effort: 'Medium', cost: 'Medium', timeline: '6 months', status: 'approved', priority: 'High', regulatoryDriver: 'EU Ecodesign Regulation' },
  { id: 'IMP002', title: 'Implement lead-free soldering process', stage: 'manufacturing', category: 'acidification', description: 'Transition to SAC305 lead-free solder paste. Eliminates lead contamination risk and reduces acidification potential from solder waste.', estimatedReduction: 0.05, reductionUnit: 'mol H+-eq', effort: 'Low', cost: 'Low', timeline: '3 months', status: 'implemented', priority: 'Medium', regulatoryDriver: 'RoHS Directive' },
  { id: 'IMP003', title: 'Optimize packaging - reduce volume by 30%', stage: 'manufacturing', category: 'climate_change', description: 'Redesign packaging to reduce overall volume by 30%. Use recycled cardboard and eliminate plastic inserts. Improves shipping density.', estimatedReduction: 1.5, reductionUnit: 'kg CO2-eq', effort: 'Low', cost: 'Low', timeline: '2 months', status: 'in_progress', priority: 'Medium', regulatoryDriver: 'EU Packaging Regulation' },
  { id: 'IMP004', title: 'Shift to rail freight for EU distribution', stage: 'distribution', category: 'climate_change', description: 'Replace 60% of truck-based intra-EU distribution with rail freight. Reduces transport emissions by approximately 75% per km.', estimatedReduction: 1.2, reductionUnit: 'kg CO2-eq', effort: 'High', cost: 'Medium', timeline: '12 months', status: 'proposed', priority: 'Medium', regulatoryDriver: 'EU Green Deal' },
  { id: 'IMP005', title: 'Low-power sleep mode optimization', stage: 'use', category: 'climate_change', description: 'Implement advanced sleep mode that reduces standby power from 2W to 0.5W. With 60% idle time over 8-year lifetime, saves significant energy.', estimatedReduction: 3.2, reductionUnit: 'kg CO2-eq', effort: 'Medium', cost: 'Low', timeline: '4 months', status: 'in_progress', priority: 'High', regulatoryDriver: 'EU Ecodesign Regulation' },
  { id: 'IMP006', title: 'Design for Disassembly (DfD) revision', stage: 'end_of_life', category: 'resource_depletion', description: 'Redesign product to use snap-fit connections instead of adhesives. Reduces disassembly time from 45 min to 12 min. Increases recyclability from 72% to 88%.', estimatedReduction: 0.00012, reductionUnit: 'kg Sb-eq', effort: 'High', cost: 'High', timeline: '9 months', status: 'proposed', priority: 'High', regulatoryDriver: 'EU Ecodesign / WEEE Directive' },
  { id: 'IMP007', title: 'Renewable energy for manufacturing', stage: 'manufacturing', category: 'climate_change', description: 'Contract with renewable energy provider for 100% wind/solar power at primary manufacturing facility. Reduces scope 2 emissions from manufacturing.', estimatedReduction: 5.5, reductionUnit: 'kg CO2-eq', effort: 'Medium', cost: 'High', timeline: '6 months', status: 'approved', priority: 'Critical', regulatoryDriver: 'CSRD / Science-Based Targets' },
  { id: 'IMP008', title: 'Water recycling system for PCB etching', stage: 'manufacturing', category: 'eutrophication', description: 'Install closed-loop water recycling for PCB etching process. Reduces freshwater consumption by 80% and eliminates chemical discharge.', estimatedReduction: 0.006, reductionUnit: 'kg PO4-eq', effort: 'Medium', cost: 'Medium', timeline: '8 months', status: 'proposed', priority: 'Medium', regulatoryDriver: 'EU Water Framework Directive' },
  { id: 'IMP009', title: 'Extend product warranty to 10 years', stage: 'use', category: 'resource_depletion', description: 'Extend standard warranty from 5 to 10 years. Incentivizes durability-focused design and reduces replacement cycle.', estimatedReduction: 0.0001, reductionUnit: 'kg Sb-eq', effort: 'Low', cost: 'Medium', timeline: '1 month', status: 'approved', priority: 'Low', regulatoryDriver: 'EU Right to Repair' },
  { id: 'IMP010', title: 'Replace virgin plastics with ocean-bound plastic', stage: 'raw_materials', category: 'climate_change', description: 'Source 50% of plastic housing components from ocean-bound plastic (OBP) certified suppliers.', estimatedReduction: 1.1, reductionUnit: 'kg CO2-eq', effort: 'Medium', cost: 'Medium', timeline: '6 months', status: 'proposed', priority: 'Medium', regulatoryDriver: 'EU Green Claims Directive' },
];

const DEMO_REPORTS: LCAReport[] = [
  { id: 'LR001', name: 'Full LCA - IoT Sensor Hub v2.0', productId: 'EP001', generatedDate: '2026-01-15', methodology: 'ISO 14040/14044', scope: 'Cradle-to-Grave', totalCO2e: 45.8, complianceStatus: 'Compliant', regulations: ['EU Ecodesign', 'CSRD', 'PEF'], status: 'published' },
  { id: 'LR002', name: 'Carbon Footprint - SecureGate v3.1', productId: 'EP002', generatedDate: '2025-11-20', methodology: 'GHG Protocol', scope: 'Cradle-to-Gate', totalCO2e: 68.3, complianceStatus: 'Gaps Identified', regulations: ['EU Ecodesign', 'CSRD'], status: 'review' },
  { id: 'LR003', name: 'Cloud Carbon Assessment - Platform v2.5', productId: 'EP003', generatedDate: '2026-02-01', methodology: 'CCF Methodology', scope: 'Use Phase Only', totalCO2e: 12.4, complianceStatus: 'Compliant', regulations: ['CSRD', 'Green Claims'], status: 'approved' },
  { id: 'LR004', name: 'Comparative LCA - IoT Hub v1.0 vs v2.0', productId: 'EP001', generatedDate: '2026-01-20', methodology: 'ISO 14040/14044', scope: 'Cradle-to-Grave', totalCO2e: 45.8, complianceStatus: 'Compliant', regulations: ['EU Ecodesign'], status: 'draft' },
];

const DEMO_CIRCULAR: CircularMetrics = {
  recyclability: 72,
  recycledContent: 35,
  durability: 80,
  repairability: 65,
  reusability: 45,
  energyRecovery: 88,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const stageLabels: Record<LifecycleStage, string> = {
  raw_materials: 'Raw Materials', manufacturing: 'Manufacturing',
  distribution: 'Distribution', use: 'Use Phase', end_of_life: 'End of Life',
};

const stageColors: Record<LifecycleStage, string> = {
  raw_materials: 'bg-amber-500', manufacturing: 'bg-blue-500',
  distribution: 'bg-green-500', use: 'bg-purple-500', end_of_life: 'bg-gray-500',
};

const stageBgColors: Record<LifecycleStage, string> = {
  raw_materials: 'bg-amber-50 border-amber-200 text-amber-800',
  manufacturing: 'bg-blue-50 border-blue-200 text-blue-800',
  distribution: 'bg-green-50 border-green-200 text-green-800',
  use: 'bg-purple-50 border-purple-200 text-purple-800',
  end_of_life: 'bg-gray-50 border-gray-200 text-gray-700',
};

const effortColor = (e: string) => {
  switch (e) { case 'High': return 'bg-red-100 text-red-800'; case 'Medium': return 'bg-yellow-100 text-yellow-800'; case 'Low': return 'bg-green-100 text-green-800'; default: return 'bg-gray-100 text-gray-600'; }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'implemented': case 'published': case 'approved': return 'bg-green-100 text-green-800';
    case 'in_progress': case 'review': return 'bg-blue-100 text-blue-800';
    case 'proposed': case 'draft': return 'bg-gray-100 text-gray-600';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface EnvironmentalLifecycleProps {
  onBack: () => void;
}

export const EnvironmentalLifecycle: React.FC<EnvironmentalLifecycleProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [selectedStage, setSelectedStage] = useState<LifecycleStageData | null>(null);
  const [improvementStageFilter, setImprovementStageFilter] = useState<string>('All');
  const [improvementStatusFilter, setImprovementStatusFilter] = useState<string>('All');
  const [expandedImprovement, setExpandedImprovement] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Data state (server-first; DEMO_* used only when server is unreachable) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(DEMO_PRODUCTS[0]);
  const [stages, setStages] = useState<LifecycleStageData[]>([]);
  const [impactCategories, setImpactCategories] = useState<ImpactCategoryData[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [reports, setReports] = useState<LCAReport[]>([]);
  const [circularMetrics, setCircularMetrics] = useState<CircularMetrics>(DEMO_CIRCULAR);
  const [serverReachable, setServerReachable] = useState<boolean>(true);

  // Comparative-LCA selectors (compare two real products / versions)
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  // --- Load data from backend (falls back to DEMO data on error) ---
  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await api.modules.lifecycle.listAssessments();
      setServerReachable(true);

      if (data && typeof data === 'object') {
        // The API may return a flat list or a structured object — normalise both.
        const d: any = Array.isArray(data) ? (data as any)[0] ?? {} : data;

        if (Array.isArray(d.products)) {
          setProducts(d.products);
          if (d.products.length > 0) {
            setSelectedProduct((prev: Product) =>
              d.products.find((p: Product) => p.id === prev.id) || d.products[0]
            );
          }
        }
        if (Array.isArray(d.stages)) {
          // Re-attach React icons (API cannot serialise JSX)
          const iconMap: Record<LifecycleStage, React.ReactNode> = {
            raw_materials: <Mountain className="w-5 h-5" />,
            manufacturing: <Factory className="w-5 h-5" />,
            distribution: <Truck className="w-5 h-5" />,
            use: <Home className="w-5 h-5" />,
            end_of_life: <Recycle className="w-5 h-5" />,
          };
          setStages(d.stages.map((s: any) => ({ ...s, icon: iconMap[s.stage as LifecycleStage] ?? s.icon })));
        }
        if (Array.isArray(d.impactCategories)) {
          const catIconMap: Record<ImpactCategory, React.ReactNode> = {
            climate_change: <Thermometer className="w-5 h-5" />,
            ozone_depletion: <Sun className="w-5 h-5" />,
            acidification: <Droplets className="w-5 h-5" />,
            eutrophication: <Waves className="w-5 h-5" />,
            resource_depletion: <Gem className="w-5 h-5" />,
          };
          setImpactCategories(d.impactCategories.map((c: any) => ({ ...c, icon: catIconMap[c.category as ImpactCategory] ?? c.icon })));
        }
        if (Array.isArray(d.improvements)) setImprovements(d.improvements);
        if (Array.isArray(d.reports)) setReports(d.reports);
        if (d.circularMetrics && typeof d.circularMetrics === 'object') setCircularMetrics(d.circularMetrics);
      }
      setLoadError(null);
    } catch (err: any) {
      // Server unreachable — populate from DEMO_* so the UI is usable.
      setServerReachable(false);
      setProducts(DEMO_PRODUCTS);
      setSelectedProduct(DEMO_PRODUCTS[0]);
      setStages(DEMO_STAGES);
      setImpactCategories(DEMO_IMPACT_CATEGORIES);
      setImprovements(DEMO_IMPROVEMENTS);
      setReports(DEMO_REPORTS);
      setCircularMetrics(DEMO_CIRCULAR);
      setLoadError('Unable to connect to server. Showing local data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Default the comparison selectors to the first two products once loaded.
  useEffect(() => {
    if (products.length === 0) return;
    setCompareA(prev => (prev && products.some(p => p.id === prev)) ? prev : products[0].id);
    setCompareB(prev => (prev && products.some(p => p.id === prev)) ? prev : (products[1]?.id || products[0].id));
  }, [products]);

  const totalCO2e = useMemo(() => stages.reduce((sum, s) => sum + s.co2eKg, 0), [stages]);

  // Derived comparison metrics computed from the two selected products' real
  // assessment data (no static literals).
  const comparison = useMemo(() => {
    const a = products.find(p => p.id === compareA);
    const b = products.find(p => p.id === compareB);
    if (!a || !b) return null;
    const pctChange = (from: number, to: number) => (from === 0 ? 0 : Math.round(((to - from) / from) * 100));
    return {
      a, b,
      metrics: [
        { label: 'Climate Change', from: a.totalCO2e, to: b.totalCO2e, unit: 'kg', lowerIsBetter: true, change: pctChange(a.totalCO2e, b.totalCO2e) },
        { label: 'Recyclability', from: a.recyclability, to: b.recyclability, unit: '%', lowerIsBetter: false, change: pctChange(a.recyclability, b.recyclability) },
        { label: 'Repairability', from: a.repairabilityScore, to: b.repairabilityScore, unit: '/10', lowerIsBetter: false, change: pctChange(a.repairabilityScore, b.repairabilityScore) },
        { label: 'Durability', from: a.durabilityYears, to: b.durabilityYears, unit: 'yrs', lowerIsBetter: false, change: pctChange(a.durabilityYears, b.durabilityYears) },
      ],
    };
  }, [products, compareA, compareB]);
  const totalEnergy = useMemo(() => stages.reduce((sum, s) => sum + s.energyMJ, 0), [stages]);
  const totalWater = useMemo(() => stages.reduce((sum, s) => sum + s.waterL, 0), [stages]);
  const totalWaste = useMemo(() => stages.reduce((sum, s) => sum + s.wasteKg, 0), [stages]);

  const filteredImprovements = useMemo(() =>
    improvements.filter(imp =>
      (improvementStageFilter === 'All' || imp.stage === improvementStageFilter) &&
      (improvementStatusFilter === 'All' || imp.status === improvementStatusFilter)
    ), [improvements, improvementStageFilter, improvementStatusFilter]);

  const potentialReduction = useMemo(() =>
    improvements.filter(i => i.status !== 'rejected' && i.status !== 'implemented' && i.reductionUnit === 'kg CO2-eq')
      .reduce((sum, i) => sum + i.estimatedReduction, 0), [improvements]);

  // --- API action helpers ---
  const handleUpdateImprovement = useCallback(async (id: string, updates: Partial<Improvement>) => {
    // Optimistic local update
    const previous = improvements;
    setImprovements(prev => prev.map(imp => imp.id === id ? { ...imp, ...updates } : imp));
    setIsSaving(true);
    try {
      await api.modules.lifecycle.updateAssessment(id, { type: 'improvement', ...updates });
    } catch {
      // Revert and surface the error
      setImprovements(previous);
      setLoadError('Failed to update improvement on server. Change reverted.');
    } finally {
      setIsSaving(false);
    }
  }, [improvements]);

  const handleCreateAssessment = useCallback(async (payload: any) => {
    setIsSaving(true);
    try {
      const created = await api.modules.lifecycle.createAssessment(payload);
      if (created) await loadData({ silent: true });
      return created;
    } catch {
      setLoadError('Failed to create assessment on server.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  const handleDeleteAssessment = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      await api.modules.lifecycle.deleteAssessment(id);
      await loadData({ silent: true });
    } catch {
      setLoadError('Failed to delete assessment on server.');
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  // ── LCA report export helpers (client-side, derived from report data) ──────
  const buildReportRows = useCallback((rpt: LCAReport): string[][] => {
    const product = products.find(p => p.id === rpt.productId);
    const header = ['Field', 'Value'];
    const rows: string[][] = [
      ['Report Name', rpt.name],
      ['Product', product?.name || rpt.productId],
      ['Methodology', rpt.methodology],
      ['Scope', rpt.scope],
      ['Status', rpt.status],
      ['Compliance Status', rpt.complianceStatus],
      ['Total CO2e (kg)', String(rpt.totalCO2e)],
      ['Regulations', rpt.regulations.join('; ')],
      ['Generated', rpt.generatedDate],
    ];
    // Append the lifecycle-stage breakdown for the report's product, if loaded.
    stages.forEach(s => rows.push([`Stage: ${s.label} CO2e (kg)`, String(s.co2eKg)]));
    return [header, ...rows];
  }, [products, stages]);

  const handleExportReportCsv = useCallback((rpt: LCAReport) => {
    const escape = (v: string) => {
      const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const csv = buildReportRows(rpt).map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lca-report-${rpt.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildReportRows]);

  const buildReportHtml = useCallback((rpt: LCAReport): string => {
    const rows = buildReportRows(rpt).slice(1);
    const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    const body = rows.map(([k, v]) => `<tr><th style="text-align:left;padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#374151">${esc(k)}</th><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${esc(v)}</td></tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(rpt.name)}</title>` +
      `<style>body{font-family:system-ui,Arial,sans-serif;color:#111827;padding:32px;max-width:760px;margin:auto}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:16px}</style></head>` +
      `<body><h1>${esc(rpt.name)}</h1><p>Life Cycle Assessment report — ${esc(rpt.methodology)} (${esc(rpt.scope)})</p>` +
      `<table>${body}</table></body></html>`;
  }, [buildReportRows]);

  const handlePreviewReport = useCallback((rpt: LCAReport) => {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900');
    if (!win) { setLoadError('Unable to open preview window. Please allow pop-ups for this site.'); return; }
    win.document.open();
    win.document.write(buildReportHtml(rpt));
    win.document.close();
  }, [buildReportHtml]);

  const handleDownloadReportPdf = useCallback((rpt: LCAReport) => {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900');
    if (!win) { setLoadError('Unable to open the report for printing. Please allow pop-ups to save as PDF.'); return; }
    win.document.open();
    win.document.write(buildReportHtml(rpt) + '<script>window.onload=function(){window.print();};<' + '/script>');
    win.document.close();
  }, [buildReportHtml]);

  // ---------------------------------------------------------------------------
  // Tab Renderers
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select value={selectedProduct.id} onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value) || products[0])}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500">
              {products.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
            </select>
            <span className="text-sm text-gray-500">{selectedProduct.category}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedProduct.certifications.map(cert => (
              <span key={cert} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <Award className="w-3 h-3" />{cert}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-xs text-gray-500">Carbon Footprint</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCO2e.toFixed(1)}</div>
          <div className="text-xs text-gray-500">kg CO2-eq / unit</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingDown className="w-3 h-3" />17% vs benchmark
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">Energy Demand</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalEnergy.toFixed(0)}</div>
          <div className="text-xs text-gray-500">MJ / unit</div>
        </div>
        <div className="bg-white border border-cyan-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-cyan-500" />
            <span className="text-xs text-gray-500">Water Usage</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalWater.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Liters / unit</div>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trash className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-gray-500">Waste Generated</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalWaste.toFixed(1)}</div>
          <div className="text-xs text-gray-500">kg / unit</div>
        </div>
      </div>

      {/* Lifecycle Stage Breakdown (visual bar) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Carbon Footprint by Lifecycle Stage</h3>
        <div className="flex h-8 rounded-lg overflow-hidden mb-4">
          {stages.map(stage => (
            <div key={stage.id} className={`${stageColors[stage.stage]} relative group cursor-pointer transition-opacity hover:opacity-80`}
              style={{ width: `${stage.percentOfTotal}%` }} onClick={() => { setSelectedStage(stage); setActiveTab('lifecycle_stages'); }}>
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                {stage.percentOfTotal >= 12 ? `${stage.percentOfTotal}%` : ''}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {stages.map(stage => (
            <div key={stage.id} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-sm ${stageColors[stage.stage]}`} />
              <span className="text-gray-600">{stage.label}</span>
              <span className="font-medium">{stage.co2eKg} kg</span>
              <span className="text-gray-400">({stage.percentOfTotal}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Circular Economy Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Circular Economy Metrics</h3>
          <Recycle className="w-5 h-5 text-green-600" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(circularMetrics).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                    stroke={value >= 70 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444'}
                    strokeWidth="3" strokeDasharray={`${value}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{value}%</div>
              </div>
              <div className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Compliance */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Regulatory Compliance Mapping</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">EU Ecodesign Regulation</span>
            </div>
            <p className="text-sm text-green-700">Product meets energy efficiency (Class A) and durability requirements. SBOM and environmental footprint declaration in place.</p>
          </div>
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">CSRD Reporting</span>
            </div>
            <p className="text-sm text-yellow-700">Scope 1 and 2 emissions reported. Scope 3 product-level data needs improvement. LCA methodology alignment pending verification.</p>
          </div>
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">EU Green Claims Directive</span>
            </div>
            <p className="text-sm text-blue-700">Environmental claims must be substantiated with PEF-compliant LCA data. Current assessment covers 4 of 6 required impact categories.</p>
          </div>
        </div>
      </div>

      {/* Improvement Potential */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Improvement Potential</h3>
            <p className="text-sm text-green-700">Active improvement proposals could reduce carbon footprint by <strong>{potentialReduction.toFixed(1)} kg CO2-eq</strong> ({Math.round((potentialReduction / totalCO2e) * 100)}% reduction)</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('improvements')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm inline-flex items-center gap-2">
          <Leaf className="w-4 h-4" />View Improvements
        </button>
      </div>
    </div>
  );

  const renderLifecycleStages = () => (
    <div className="space-y-6">
      {/* Stage Navigation */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 gap-2 overflow-x-auto">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <button onClick={() => setSelectedStage(selectedStage?.id === stage.id ? null : stage)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm whitespace-nowrap ${selectedStage?.id === stage.id ? `${stageBgColors[stage.stage]} border font-medium` : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {stage.icon}
              <span>{stage.label}</span>
              <span className="font-bold">{stage.co2eKg} kg</span>
            </button>
            {i < stages.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Stage Details */}
      {stages.map(stage => (
        <div key={stage.id} className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${selectedStage?.id === stage.id ? 'ring-2 ring-blue-300' : ''}`}>
          <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedStage(selectedStage?.id === stage.id ? null : stage)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stageBgColors[stage.stage]}`}>{stage.icon}</div>
                <div>
                  <div className="font-semibold text-gray-900">{stage.label}</div>
                  <div className="text-sm text-gray-500">{stage.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-lg font-bold text-gray-900">{stage.co2eKg} kg</div>
                  <div className="text-xs text-gray-500">CO2-eq ({stage.percentOfTotal}%)</div>
                </div>
                {selectedStage?.id === stage.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {/* Mini stat bar */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <Flame className="w-3 h-3 text-red-400" />
                <span className="text-gray-500">CO2-eq:</span>
                <span className="font-medium">{stage.co2eKg} kg</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3 h-3 text-blue-400" />
                <span className="text-gray-500">Energy:</span>
                <span className="font-medium">{stage.energyMJ} MJ</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span className="text-gray-500">Water:</span>
                <span className="font-medium">{stage.waterL} L</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Trash className="w-3 h-3 text-orange-400" />
                <span className="text-gray-500">Waste:</span>
                <span className="font-medium">{stage.wasteKg} kg</span>
              </div>
            </div>
          </div>

          {selectedStage?.id === stage.id && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Process Breakdown</h4>
              <div className="space-y-2">
                {stage.processes.map((proc, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">{proc.name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={proc.co2eKg < 0 ? 'text-green-600 font-medium' : 'text-gray-700'}>{proc.co2eKg} kg CO2-eq</span>
                        <span className="text-gray-500">{proc.energyMJ} MJ</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{proc.description}</p>
                    <div className="mt-1.5">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${proc.co2eKg < 0 ? 'bg-green-400' : proc.co2eKg > 4 ? 'bg-red-400' : proc.co2eKg > 2 ? 'bg-orange-400' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min(100, Math.abs(proc.co2eKg / stage.co2eKg) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderImpactAssessment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Environmental Impact Categories</h3>
        <button onClick={() => setShowComparison(!showComparison)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm inline-flex items-center gap-1">
          <BarChart3 className="w-4 h-4" />{showComparison ? 'Hide' : 'Show'} Benchmark Comparison
        </button>
      </div>

      {impactCategories.map(cat => {
        const pctOfBenchmark = Math.round((cat.totalValue / cat.benchmarkValue) * 100);
        const isBetter = pctOfBenchmark < 100;

        return (
          <div key={cat.id} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${cat.color === 'red' ? 'bg-red-100 text-red-600' : cat.color === 'purple' ? 'bg-purple-100 text-purple-600' : cat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : cat.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {cat.icon}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{cat.label}</div>
                  <div className="text-xs text-gray-500">{cat.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{cat.totalValue < 0.01 ? cat.totalValue.toExponential(2) : cat.totalValue.toFixed(cat.totalValue < 1 ? 3 : 1)}</div>
                <div className="text-xs text-gray-500">{cat.unit}</div>
              </div>
            </div>

            {/* Stage breakdown bar */}
            <div className="mb-3">
              <div className="flex h-6 rounded-lg overflow-hidden">
                {cat.stages.map(s => {
                  const pct = (s.value / cat.totalValue) * 100;
                  return (
                    <div key={s.stage} className={`${stageColors[s.stage]} relative group`}
                      style={{ width: `${Math.max(1, pct)}%` }}
                      title={`${stageLabels[s.stage]}: ${s.value < 0.01 ? s.value.toExponential(2) : s.value} ${cat.unit}`}>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {cat.stages.map(s => (
                  <div key={s.stage} className="flex items-center gap-1 text-xs">
                    <div className={`w-2 h-2 rounded-sm ${stageColors[s.stage]}`} />
                    <span className="text-gray-500">{stageLabels[s.stage]}:</span>
                    <span className="font-medium">{s.value < 0.01 ? s.value.toExponential(2) : s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benchmark comparison */}
            {showComparison && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">vs. Industry Benchmark</span>
                  <span className={`text-sm font-medium ${isBetter ? 'text-green-600' : 'text-red-600'}`}>
                    {isBetter ? <TrendingDown className="w-3 h-3 inline mr-1" /> : <TrendingUp className="w-3 h-3 inline mr-1" />}
                    {Math.abs(100 - pctOfBenchmark)}% {isBetter ? 'below' : 'above'} benchmark
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full h-3 bg-gray-100 rounded-full">
                    <div className={`h-3 rounded-full ${isBetter ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, pctOfBenchmark)}%` }} />
                  </div>
                  <div className="absolute top-0 h-3 w-0.5 bg-gray-800 rounded" style={{ left: '100%', transform: 'translateX(-2px)' }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Your product: {cat.totalValue < 0.01 ? cat.totalValue.toExponential(2) : cat.totalValue}</span>
                  <span>Benchmark: {cat.benchmarkValue < 0.01 ? cat.benchmarkValue.toExponential(2) : cat.benchmarkValue} {cat.unit}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderImprovements = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select value={improvementStageFilter} onChange={e => setImprovementStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="All">All Stages</option>
            {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={improvementStatusFilter} onChange={e => setImprovementStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="All">All Statuses</option>
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>
        <button disabled={isSaving} onClick={() => handleCreateAssessment({ type: 'improvement', title: 'New Improvement', stage: 'manufacturing', category: 'climate_change', status: 'proposed', priority: 'Medium', effort: 'Medium', cost: 'Medium', timeline: 'TBD', estimatedReduction: 0, reductionUnit: 'kg CO2-eq', description: '', regulatoryDriver: '' })}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm inline-flex items-center gap-1 disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add Improvement
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-green-700">{improvements.filter(i => i.status === 'implemented').length}</div>
          <div className="text-xs text-green-600">Implemented</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-blue-700">{improvements.filter(i => i.status === 'in_progress').length}</div>
          <div className="text-xs text-blue-600">In Progress</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-yellow-700">{improvements.filter(i => i.status === 'approved').length}</div>
          <div className="text-xs text-yellow-600">Approved</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-gray-700">{improvements.filter(i => i.status === 'proposed').length}</div>
          <div className="text-xs text-gray-500">Proposed</div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredImprovements.map(imp => (
          <div key={imp.id} className={`bg-white border rounded-lg overflow-hidden transition-all ${expandedImprovement === imp.id ? 'border-green-400 ring-1 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="p-4 cursor-pointer" onClick={() => setExpandedImprovement(expandedImprovement === imp.id ? null : imp.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Lightbulb className={`w-5 h-5 ${imp.status === 'implemented' ? 'text-green-500' : imp.status === 'in_progress' ? 'text-blue-500' : 'text-yellow-500'}`} />
                  <div>
                    <div className="font-medium text-gray-900">{imp.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${stageBgColors[imp.stage]}`}>{stageLabels[imp.stage]}</span>
                      <span>{imp.regulatoryDriver}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-700">-{imp.estimatedReduction} {imp.reductionUnit}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(imp.status)}`}>{imp.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {expandedImprovement === imp.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <p className="text-sm text-gray-700 mb-4">{imp.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Effort</div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${effortColor(imp.effort)}`}>{imp.effort}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Cost</div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${effortColor(imp.cost)}`}>{imp.cost}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Timeline</div>
                    <span className="text-sm font-medium">{imp.timeline}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Priority</div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${imp.priority === 'Critical' ? 'bg-red-100 text-red-800' : imp.priority === 'High' ? 'bg-orange-100 text-orange-800' : imp.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{imp.priority}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Reduction</div>
                    <span className="text-sm font-bold text-green-700">-{imp.estimatedReduction} {imp.reductionUnit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  {imp.status === 'proposed' && (
                    <>
                      <button disabled={isSaving} onClick={() => handleUpdateImprovement(imp.id, { status: 'approved' })}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50">
                        {isSaving ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : null}Approve
                      </button>
                      <button disabled={isSaving} onClick={() => handleUpdateImprovement(imp.id, { status: 'rejected' })}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50">Reject</button>
                    </>
                  )}
                  {imp.status === 'approved' && (
                    <button disabled={isSaving} onClick={() => handleUpdateImprovement(imp.id, { status: 'in_progress' })}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50">
                      {isSaving ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : null}Start Implementation
                    </button>
                  )}
                  {imp.status === 'in_progress' && (
                    <button disabled={isSaving} onClick={() => handleUpdateImprovement(imp.id, { status: 'implemented' })}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : null}Mark Implemented
                    </button>
                  )}
                  <button disabled={isSaving} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 disabled:opacity-50">
                    <Edit3 className="w-3 h-3 inline mr-1" />Edit
                  </button>
                  <button disabled={isSaving} onClick={() => handleDeleteAssessment(imp.id)}
                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded text-xs hover:bg-red-50 disabled:opacity-50">
                    <Trash2 className="w-3 h-3 inline mr-1" />Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">LCA Reports</h3>
        <button disabled={isSaving} onClick={() => handleCreateAssessment({ type: 'report', name: 'New LCA Report', productId: selectedProduct.id, methodology: 'ISO 14040/14044', scope: 'Cradle-to-Grave', totalCO2e: totalCO2e, complianceStatus: 'Draft', regulations: [], status: 'draft', generatedDate: new Date().toISOString().split('T')[0] })}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm inline-flex items-center gap-1 disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Generate Report
        </button>
      </div>

      <div className="space-y-3">
        {reports.map(rpt => {
          const product = products.find(p => p.id === rpt.productId);
          return (
            <div key={rpt.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">{rpt.name}</div>
                    <div className="text-xs text-gray-500">{product?.name} | {rpt.methodology} | {rpt.scope}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(rpt.status)}`}>{rpt.status}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rpt.complianceStatus === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {rpt.complianceStatus}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                <div>
                  <span className="text-gray-500">Generated: </span>
                  <span className="font-medium">{formatDate(rpt.generatedDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total CO2-eq: </span>
                  <span className="font-medium">{rpt.totalCO2e} kg</span>
                </div>
                <div>
                  <span className="text-gray-500">Regulations: </span>
                  <span className="font-medium">{rpt.regulations.join(', ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadReportPdf(rpt)} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 inline-flex items-center gap-1">
                  <Download className="w-3 h-3" />Download PDF
                </button>
                <button onClick={() => handlePreviewReport(rpt)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" />Preview
                </button>
                <button onClick={() => handleExportReportCsv(rpt)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1">
                  <Download className="w-3 h-3" />Export CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative LCA Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Comparative LCA</h3>
        <p className="text-sm text-gray-600 mb-4">Compare environmental impact across products and versions to track improvements.</p>
        {products.length < 2 ? (
          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4">
            At least two assessed products are required to run a comparison.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Product Version A (baseline)</label>
                <select value={compareA} onChange={e => setCompareA(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Product Version B (comparison)</label>
                <select value={compareB} onChange={e => setCompareB(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {comparison ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  {comparison.metrics.map(m => {
                    const improved = m.lowerIsBetter ? m.change < 0 : m.change > 0;
                    const neutral = m.change === 0;
                    return (
                      <div key={m.label}>
                        <div className="text-sm text-gray-500 mb-1">{m.label}</div>
                        <div className={`text-lg font-bold ${neutral ? 'text-gray-500' : improved ? 'text-green-600' : 'text-red-600'}`}>
                          {m.change > 0 ? '+' : ''}{m.change}%
                        </div>
                        <div className="text-xs text-gray-400">{`${m.from} → ${m.to} ${m.unit}`}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select two products to compare.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  const tabs: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: t('common.overview'), icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'lifecycle_stages', label: 'Lifecycle Stages', icon: <RotateCcw className="w-4 h-4" /> },
    { key: 'impact_assessment', label: 'Impact Assessment', icon: <Activity className="w-4 h-4" /> },
    { key: 'improvements', label: 'Improvements', icon: <Lightbulb className="w-4 h-4" /> },
    { key: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Environmental Lifecycle Assessment</h1>
                  <p className="text-xs text-gray-500">Product LCA, Eco-Design & Circular Economy Metrics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRefreshing && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
              <button onClick={() => loadData({ silent: true })} disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50" title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300 inline-flex items-center gap-1">
                <Leaf className="w-3 h-3" />{totalCO2e.toFixed(1)} kg CO2-eq / unit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">{t('common.loading')}</span>
          </div>
        )}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">{loadError}</span>
            <button onClick={() => loadData({ silent: true })} className="ml-2 text-amber-600 hover:text-amber-800 text-sm underline">Retry</button>
            <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
          </div>
        )}
        {!isLoading && activeTab === 'overview' && renderOverview()}
        {!isLoading && activeTab === 'lifecycle_stages' && renderLifecycleStages()}
        {!isLoading && activeTab === 'impact_assessment' && renderImpactAssessment()}
        {!isLoading && activeTab === 'improvements' && renderImprovements()}
        {!isLoading && activeTab === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default EnvironmentalLifecycle;
