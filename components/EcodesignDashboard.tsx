/**
 * Ecodesign for Sustainable Products Regulation (ESPR) Dashboard
 *
 * Comprehensive management interface for ESPR compliance:
 * - Digital Product Passport (DPP) management
 * - Product lifecycle environmental assessment
 * - Repairability scoring and requirements
 * - Recyclability metrics
 * - Energy efficiency ratings
 * - Substance of concern tracking
 * - Product category compliance requirements
 *
 * Reference: Regulation (EU) 2024/1781
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  Recycle, Leaf, Package, FileText, CheckCircle, AlertTriangle,
  X, Plus, Search, Download, Clock, Shield, TrendingUp, Zap,
  Eye, Edit, QrCode, Wrench, Droplets, Flame, ChevronRight,
  BarChart3, Calendar, AlertCircle, Factory, Cpu, Trash2,
  ArrowUpRight, Settings, Battery, ThermometerSun
} from 'lucide-react';

// ── Data Models ──────────────────────────────────────────────────────────

type EnergyRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
type LifecyclePhase = 'raw_materials' | 'manufacturing' | 'transport' | 'use' | 'end_of_life';
type SubstanceConcernLevel = 'svhc' | 'restricted' | 'monitored' | 'safe';
type TabKey = 'overview' | 'products' | 'passports' | 'lifecycle' | 'compliance';

interface EcoProduct {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  productionDate: string;
  complianceStatus: ComplianceStatus;
  energyRating: EnergyRating;
  repairabilityScore: number;
  recyclabilityRate: number;
  recycledContentRate: number;
  carbonFootprint: number;
  carbonFootprintUnit: string;
  expectedLifespan: number;
  warrantyYears: number;
  dppId: string | null;
  substancesOfConcern: SubstanceOfConcern[];
  hasPassport: boolean;
}

interface DigitalProductPassport {
  id: string;
  productId: string;
  productName: string;
  qrCodeUrl: string;
  createdDate: string;
  lastUpdated: string;
  status: 'active' | 'draft' | 'expired' | 'revoked';
  dataCategories: {
    productIdentification: boolean;
    sustainability: boolean;
    circularEconomy: boolean;
    compliance: boolean;
    supplyChain: boolean;
  };
  accessLevel: 'public' | 'authorized' | 'restricted';
  version: string;
}

interface LifecycleAssessment {
  id: string;
  productId: string;
  productName: string;
  assessmentDate: string;
  methodology: string;
  phases: {
    phase: LifecyclePhase;
    co2Impact: number;
    waterUsage: number;
    energyUsage: number;
    wasteGenerated: number;
    percentage: number;
  }[];
  totalCarbonFootprint: number;
  totalWaterUsage: number;
  totalEnergyUsage: number;
  comparisonToBenchmark: number;
  certifications: string[];
}

interface SubstanceOfConcern {
  id: string;
  name: string;
  casNumber: string;
  concernLevel: SubstanceConcernLevel;
  concentration: number;
  unit: string;
  location: string;
  alternatives: string[];
  regulatoryBasis: string;
}

interface ComplianceRequirement {
  id: string;
  category: string;
  requirement: string;
  description: string;
  mandatory: boolean;
  met: boolean;
  deadline: string;
  applicableProducts: string[];
}

// ── Default Data ─────────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = [
  'Electronics', 'Textiles', 'Furniture', 'Construction Products',
  'Iron & Steel', 'Aluminium', 'Batteries', 'Packaging', 'Plastics', 'Chemicals',
];

const DEFAULT_PRODUCTS: EcoProduct[] = [
  {
    id: 'eco-001', name: 'EcoSmart Washing Machine X500', category: 'Electronics',
    manufacturer: 'GreenTech Appliances', model: 'X500-EU', productionDate: '2025-08-15',
    complianceStatus: 'compliant', energyRating: 'A', repairabilityScore: 8.2,
    recyclabilityRate: 87, recycledContentRate: 35, carbonFootprint: 450,
    carbonFootprintUnit: 'kg CO2e', expectedLifespan: 12, warrantyYears: 5,
    dppId: 'DPP-2025-X500-001', hasPassport: true,
    substancesOfConcern: [
      { id: 'soc-1', name: 'Lead', casNumber: '7439-92-1', concernLevel: 'restricted', concentration: 0.05, unit: '%w/w', location: 'Solder joints', alternatives: ['Tin-silver-copper solder'], regulatoryBasis: 'RoHS Directive' },
    ],
  },
  {
    id: 'eco-002', name: 'SmartDisplay 27" Monitor', category: 'Electronics',
    manufacturer: 'GreenTech Appliances', model: 'SD27-PRO', productionDate: '2025-10-01',
    complianceStatus: 'partial', energyRating: 'B', repairabilityScore: 6.5,
    recyclabilityRate: 72, recycledContentRate: 20, carbonFootprint: 280,
    carbonFootprintUnit: 'kg CO2e', expectedLifespan: 8, warrantyYears: 3,
    dppId: null, hasPassport: false,
    substancesOfConcern: [
      { id: 'soc-2', name: 'Mercury', casNumber: '7439-97-6', concernLevel: 'svhc', concentration: 0.001, unit: '%w/w', location: 'Backlight', alternatives: ['LED backlight (mercury-free)'], regulatoryBasis: 'REACH SVHC List' },
      { id: 'soc-3', name: 'Cadmium', casNumber: '7440-43-9', concernLevel: 'restricted', concentration: 0.008, unit: '%w/w', location: 'Quantum dots', alternatives: ['Indium phosphide QD'], regulatoryBasis: 'RoHS Directive' },
    ],
  },
  {
    id: 'eco-003', name: 'SustainTex Organic Cotton T-Shirt', category: 'Textiles',
    manufacturer: 'EcoFashion EU', model: 'OC-BASIC-M', productionDate: '2025-11-20',
    complianceStatus: 'compliant', energyRating: 'A', repairabilityScore: 9.0,
    recyclabilityRate: 95, recycledContentRate: 60, carbonFootprint: 5.2,
    carbonFootprintUnit: 'kg CO2e', expectedLifespan: 5, warrantyYears: 2,
    dppId: 'DPP-2025-OCT-003', hasPassport: true,
    substancesOfConcern: [],
  },
  {
    id: 'eco-004', name: 'ModularDesk Office L-Shape', category: 'Furniture',
    manufacturer: 'CircularOffice GmbH', model: 'MD-L2025', productionDate: '2025-09-10',
    complianceStatus: 'partial', energyRating: 'C', repairabilityScore: 7.8,
    recyclabilityRate: 82, recycledContentRate: 45, carbonFootprint: 120,
    carbonFootprintUnit: 'kg CO2e', expectedLifespan: 15, warrantyYears: 10,
    dppId: 'DPP-2025-MDL-004', hasPassport: true,
    substancesOfConcern: [
      { id: 'soc-4', name: 'Formaldehyde', casNumber: '50-00-0', concernLevel: 'monitored', concentration: 0.02, unit: 'mg/m3', location: 'Particle board adhesive', alternatives: ['PVA-based adhesive'], regulatoryBasis: 'ESPR Annex' },
    ],
  },
  {
    id: 'eco-005', name: 'PowerCell LFP Battery Pack', category: 'Batteries',
    manufacturer: 'EUBatt Solutions', model: 'PC-LFP-48', productionDate: '2026-01-05',
    complianceStatus: 'non_compliant', energyRating: 'B', repairabilityScore: 5.0,
    recyclabilityRate: 70, recycledContentRate: 12, carbonFootprint: 75,
    carbonFootprintUnit: 'kg CO2e/kWh', expectedLifespan: 10, warrantyYears: 8,
    dppId: null, hasPassport: false,
    substancesOfConcern: [
      { id: 'soc-5', name: 'Lithium hexafluorophosphate', casNumber: '21324-40-3', concernLevel: 'monitored', concentration: 15, unit: '%w/w', location: 'Electrolyte', alternatives: ['Solid-state electrolyte'], regulatoryBasis: 'Battery Regulation' },
    ],
  },
];

const DEFAULT_PASSPORTS: DigitalProductPassport[] = [
  { id: 'dpp-001', productId: 'eco-001', productName: 'EcoSmart Washing Machine X500', qrCodeUrl: '/api/dpp/DPP-2025-X500-001/qr', createdDate: '2025-08-20', lastUpdated: '2026-01-15', status: 'active', dataCategories: { productIdentification: true, sustainability: true, circularEconomy: true, compliance: true, supplyChain: true }, accessLevel: 'public', version: '2.1' },
  { id: 'dpp-002', productId: 'eco-003', productName: 'SustainTex Organic Cotton T-Shirt', qrCodeUrl: '/api/dpp/DPP-2025-OCT-003/qr', createdDate: '2025-11-25', lastUpdated: '2026-02-01', status: 'active', dataCategories: { productIdentification: true, sustainability: true, circularEconomy: true, compliance: true, supplyChain: false }, accessLevel: 'public', version: '1.3' },
  { id: 'dpp-003', productId: 'eco-004', productName: 'ModularDesk Office L-Shape', qrCodeUrl: '/api/dpp/DPP-2025-MDL-004/qr', createdDate: '2025-09-15', lastUpdated: '2025-12-10', status: 'draft', dataCategories: { productIdentification: true, sustainability: false, circularEconomy: true, compliance: false, supplyChain: false }, accessLevel: 'authorized', version: '0.8' },
];

const DEFAULT_LCAS: LifecycleAssessment[] = [
  {
    id: 'lca-001', productId: 'eco-001', productName: 'EcoSmart Washing Machine X500', assessmentDate: '2025-07-10',
    methodology: 'PEF (Product Environmental Footprint)',
    phases: [
      { phase: 'raw_materials', co2Impact: 135, waterUsage: 2200, energyUsage: 850, wasteGenerated: 45, percentage: 30 },
      { phase: 'manufacturing', co2Impact: 90, waterUsage: 1800, energyUsage: 1200, wasteGenerated: 30, percentage: 20 },
      { phase: 'transport', co2Impact: 45, waterUsage: 50, energyUsage: 300, wasteGenerated: 5, percentage: 10 },
      { phase: 'use', co2Impact: 157.5, waterUsage: 48000, energyUsage: 3600, wasteGenerated: 0, percentage: 35 },
      { phase: 'end_of_life', co2Impact: 22.5, waterUsage: 200, energyUsage: 150, wasteGenerated: 55, percentage: 5 },
    ],
    totalCarbonFootprint: 450, totalWaterUsage: 52250, totalEnergyUsage: 6100,
    comparisonToBenchmark: -15, certifications: ['EU Ecolabel', 'Energy Star'],
  },
  {
    id: 'lca-002', productId: 'eco-003', productName: 'SustainTex Organic Cotton T-Shirt', assessmentDate: '2025-10-05',
    methodology: 'PEF (Product Environmental Footprint)',
    phases: [
      { phase: 'raw_materials', co2Impact: 1.82, waterUsage: 4500, energyUsage: 15, wasteGenerated: 0.3, percentage: 35 },
      { phase: 'manufacturing', co2Impact: 1.56, waterUsage: 2800, energyUsage: 12, wasteGenerated: 0.5, percentage: 30 },
      { phase: 'transport', co2Impact: 0.52, waterUsage: 5, energyUsage: 3, wasteGenerated: 0.02, percentage: 10 },
      { phase: 'use', co2Impact: 1.04, waterUsage: 12000, energyUsage: 45, wasteGenerated: 0, percentage: 20 },
      { phase: 'end_of_life', co2Impact: 0.26, waterUsage: 50, energyUsage: 2, wasteGenerated: 0.15, percentage: 5 },
    ],
    totalCarbonFootprint: 5.2, totalWaterUsage: 19355, totalEnergyUsage: 77,
    comparisonToBenchmark: -42, certifications: ['GOTS', 'OEKO-TEX Standard 100'],
  },
];

const DEFAULT_REQUIREMENTS: ComplianceRequirement[] = [
  { id: 'req-001', category: 'Digital Product Passport', requirement: 'Product must have a Digital Product Passport accessible via QR code', description: 'All products within scope must provide a DPP with product identification, sustainability, and circularity information.', mandatory: true, met: false, deadline: '2027-01-01', applicableProducts: ['Electronics', 'Textiles', 'Batteries', 'Furniture'] },
  { id: 'req-002', category: 'Energy Efficiency', requirement: 'Product meets minimum energy performance standards', description: 'Energy-using products must meet the minimum energy efficiency requirements set by delegated acts.', mandatory: true, met: true, deadline: '2026-06-01', applicableProducts: ['Electronics'] },
  { id: 'req-003', category: 'Durability', requirement: 'Minimum product lifespan guarantee', description: 'Products must be designed for a minimum expected lifespan as specified per category.', mandatory: true, met: true, deadline: '2026-06-01', applicableProducts: ['Electronics', 'Textiles', 'Furniture'] },
  { id: 'req-004', category: 'Repairability', requirement: 'Repairability score displayed and spare parts available', description: 'Products must display a repairability score and ensure spare parts availability for minimum specified periods.', mandatory: true, met: true, deadline: '2026-06-01', applicableProducts: ['Electronics', 'Furniture'] },
  { id: 'req-005', category: 'Recycled Content', requirement: 'Minimum recycled content thresholds met', description: 'Products must contain minimum percentages of recycled materials as specified by delegated acts.', mandatory: true, met: false, deadline: '2027-01-01', applicableProducts: ['Electronics', 'Textiles', 'Batteries', 'Plastics'] },
  { id: 'req-006', category: 'Substances of Concern', requirement: 'Substances of concern tracked and disclosed', description: 'All substances of concern present above threshold concentrations must be identified and disclosed.', mandatory: true, met: true, deadline: '2026-06-01', applicableProducts: ['Electronics', 'Textiles', 'Batteries', 'Furniture', 'Chemicals'] },
  { id: 'req-007', category: 'Carbon Footprint', requirement: 'Product carbon footprint declared', description: 'Life cycle carbon footprint must be calculated per PEF methodology and declared publicly.', mandatory: true, met: true, deadline: '2026-06-01', applicableProducts: ['Electronics', 'Batteries', 'Iron & Steel', 'Aluminium'] },
  { id: 'req-008', category: 'Destruction Ban', requirement: 'No destruction of unsold consumer goods', description: 'Manufacturers and distributors are prohibited from destroying unsold consumer products.', mandatory: true, met: true, deadline: '2026-07-19', applicableProducts: ['Textiles', 'Electronics'] },
  { id: 'req-009', category: 'Recyclability', requirement: 'Product designed for recyclability', description: 'Products must be designed to facilitate recycling, including material identification and ease of disassembly.', mandatory: true, met: false, deadline: '2027-01-01', applicableProducts: ['Electronics', 'Furniture', 'Packaging', 'Plastics'] },
  { id: 'req-010', category: 'Information Requirements', requirement: 'Consumer information on sustainability features', description: 'Clear information about sustainability characteristics must be provided to consumers.', mandatory: true, met: true, deadline: '2026-06-01', applicableProducts: ['Electronics', 'Textiles', 'Batteries', 'Furniture'] },
];

// ── Helper Functions ─────────────────────────────────────────────────────

const energyRatingColor = (rating: EnergyRating): string => {
  const colors: Record<EnergyRating, string> = { A: 'bg-green-600', B: 'bg-green-500', C: 'bg-yellow-500', D: 'bg-yellow-600', E: 'bg-orange-500', F: 'bg-orange-600', G: 'bg-red-600' };
  return colors[rating];
};

const complianceColor = (s: ComplianceStatus): string => {
  switch (s) {
    case 'compliant': return 'bg-green-100 text-green-800';
    case 'partial': return 'bg-yellow-100 text-yellow-800';
    case 'non_compliant': return 'bg-red-100 text-red-800';
    case 'not_assessed': return 'bg-gray-100 text-gray-600';
  }
};

const concernColor = (level: SubstanceConcernLevel): string => {
  switch (level) {
    case 'svhc': return 'bg-red-100 text-red-800';
    case 'restricted': return 'bg-orange-100 text-orange-800';
    case 'monitored': return 'bg-yellow-100 text-yellow-800';
    case 'safe': return 'bg-green-100 text-green-800';
  }
};

const phaseLabel = (p: LifecyclePhase): string => {
  switch (p) {
    case 'raw_materials': return 'Raw Materials';
    case 'manufacturing': return 'Manufacturing';
    case 'transport': return 'Transport';
    case 'use': return 'Use Phase';
    case 'end_of_life': return 'End of Life';
  }
};

const phaseColor = (p: LifecyclePhase): string => {
  switch (p) {
    case 'raw_materials': return 'bg-amber-500';
    case 'manufacturing': return 'bg-blue-500';
    case 'transport': return 'bg-purple-500';
    case 'use': return 'bg-green-500';
    case 'end_of_life': return 'bg-gray-500';
  }
};

const formatNumber = (n: number): string => n.toLocaleString('en-US');
const formatDate = (d: string): string => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const renderScoreBar = (score: number, max: number = 100, color?: string) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div className={`h-2.5 rounded-full ${color || (score / max >= 0.8 ? 'bg-green-500' : score / max >= 0.5 ? 'bg-yellow-500' : 'bg-red-500')}`}
      style={{ width: `${Math.min(100, (score / max) * 100)}%` }} />
  </div>
);

// ── Component ────────────────────────────────────────────────────────────

export const EcodesignDashboard: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [products, setProducts] = useState<EcoProduct[]>([]);
  const [passports, setPassports] = useState<DigitalProductPassport[]>([]);
  const [lcas, setLcas] = useState<LifecycleAssessment[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [serverReachable, setServerReachable] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState<DigitalProductPassport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLCAModal, setShowLCAModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EcoProduct | null>(null);
  const [selectedLCA, setSelectedLCA] = useState<LifecycleAssessment | null>(null);

  const [productForm, setProductForm] = useState({
    name: '', category: 'Electronics', manufacturer: '', model: '',
    energyRating: 'C' as EnergyRating, repairabilityScore: 5,
    recyclabilityRate: 50, recycledContentRate: 20, carbonFootprint: 0,
    expectedLifespan: 5, warrantyYears: 2,
  });

  // ── Load saved data from API ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await api.regulationData.getAll('ecodesign');
        setServerReachable(true);
        if (saved && typeof saved === 'object') {
          setProducts(Array.isArray(saved.products) ? saved.products : DEFAULT_PRODUCTS);
          setPassports(Array.isArray(saved.passports) ? saved.passports : DEFAULT_PASSPORTS);
          setLcas(Array.isArray(saved.lcas) ? saved.lcas : DEFAULT_LCAS);
          setRequirements(Array.isArray(saved.requirements) ? saved.requirements : DEFAULT_REQUIREMENTS);
        } else {
          setProducts(DEFAULT_PRODUCTS);
          setPassports(DEFAULT_PASSPORTS);
          setLcas(DEFAULT_LCAS);
          setRequirements(DEFAULT_REQUIREMENTS);
        }
      } catch (err: any) {
        // Server unreachable — fall back to template data so the UI is usable.
        setServerReachable(false);
        setProducts(DEFAULT_PRODUCTS);
        setPassports(DEFAULT_PASSPORTS);
        setLcas(DEFAULT_LCAS);
        setRequirements(DEFAULT_REQUIREMENTS);
        setLoadError('Unable to connect to server. Using template data.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Debounced auto-save ──
  useEffect(() => {
    if (isLoading) return;
    if (!serverReachable) return;
    const timer = setTimeout(() => {
      Promise.allSettled([
        api.regulationData.save('ecodesign', 'products', products),
        api.regulationData.save('ecodesign', 'passports', passports),
        api.regulationData.save('ecodesign', 'lcas', lcas),
        api.regulationData.save('ecodesign', 'requirements', requirements),
      ]).then(results => {
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          setLoadError('Some changes failed to sync to the server.');
        } else if (loadError) {
          setLoadError(null);
        }
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [products, passports, lcas, requirements, isLoading, serverReachable, loadError]);

  // ── Computed ──

  const avgRepairability = useMemo(() => {
    if (products.length === 0) return 0;
    return +(products.reduce((s, p) => s + p.repairabilityScore, 0) / products.length).toFixed(1);
  }, [products]);

  const avgRecyclability = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round(products.reduce((s, p) => s + p.recyclabilityRate, 0) / products.length);
  }, [products]);

  const passportCoverage = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round((products.filter(p => p.hasPassport).length / products.length) * 100);
  }, [products]);

  const complianceRate = useMemo(() => {
    const met = requirements.filter(r => r.met).length;
    return requirements.length > 0 ? Math.round((met / requirements.length) * 100) : 0;
  }, [requirements]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, categoryFilter]);

  // ── Handlers ──

  const handleAddProduct = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: EcoProduct = {
      id: `eco-${Date.now()}`, name: productForm.name, category: productForm.category,
      manufacturer: productForm.manufacturer, model: productForm.model,
      productionDate: new Date().toISOString().split('T')[0],
      complianceStatus: 'not_assessed', energyRating: productForm.energyRating,
      repairabilityScore: productForm.repairabilityScore, recyclabilityRate: productForm.recyclabilityRate,
      recycledContentRate: productForm.recycledContentRate, carbonFootprint: productForm.carbonFootprint,
      carbonFootprintUnit: 'kg CO2e', expectedLifespan: productForm.expectedLifespan,
      warrantyYears: productForm.warrantyYears, dppId: null, hasPassport: false,
      substancesOfConcern: [],
    };
    setProducts(prev => [...prev, newProduct]);
    setShowProductModal(false);
    setProductForm({ name: '', category: 'Electronics', manufacturer: '', model: '', energyRating: 'C', repairabilityScore: 5, recyclabilityRate: 50, recycledContentRate: 20, carbonFootprint: 0, expectedLifespan: 5, warrantyYears: 2 });
  }, [productForm]);

  const handleCreatePassport = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const dppId = `DPP-${new Date().getFullYear()}-${product.model}-${Date.now().toString(36)}`;
    const newPassport: DigitalProductPassport = {
      id: `dpp-${Date.now()}`, productId, productName: product.name,
      qrCodeUrl: `/api/dpp/${dppId}/qr`, createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0], status: 'draft',
      dataCategories: { productIdentification: true, sustainability: false, circularEconomy: false, compliance: false, supplyChain: false },
      accessLevel: 'authorized', version: '0.1',
    };
    setPassports(prev => [...prev, newPassport]);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, hasPassport: true, dppId } : p));
  }, [products]);

  const handleToggleRequirement = useCallback((reqId: string) => {
    setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, met: !r.met } : r));
  }, []);

  const handleDownloadReport = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(), reportType: 'ESPR Ecodesign Compliance Report',
      summary: { totalProducts: products.length, passportCoverage: passportCoverage + '%', avgRepairability, avgRecyclability: avgRecyclability + '%', complianceRate: complianceRate + '%' },
      products: products.map(p => ({ name: p.name, category: p.category, energyRating: p.energyRating, repairability: p.repairabilityScore, recyclability: p.recyclabilityRate, carbonFootprint: p.carbonFootprint + ' ' + p.carbonFootprintUnit, hasPassport: p.hasPassport })),
      requirements: requirements.map(r => ({ requirement: r.requirement, met: r.met, deadline: r.deadline })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ecodesign-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [products, requirements, passportCoverage, avgRepairability, avgRecyclability, complianceRate]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { key: 'passports', label: 'Digital Passports', icon: <QrCode className="w-4 h-4" /> },
    { key: 'lifecycle', label: 'Lifecycle Assessment', icon: <Recycle className="w-4 h-4" /> },
    { key: 'compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> },
  ];

  // ── Tab: Overview ──

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Products Tracked</p><p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p></div>
            <Package className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{products.filter(p => p.complianceStatus === 'compliant').length} fully compliant</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">DPP Coverage</p><p className="text-2xl font-bold text-gray-900 mt-1">{passportCoverage}%</p></div>
            <QrCode className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2">{renderScoreBar(passportCoverage)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Avg Repairability</p><p className="text-2xl font-bold text-gray-900 mt-1">{avgRepairability}/10</p></div>
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2">{renderScoreBar(avgRepairability, 10)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Avg Recyclability</p><p className="text-2xl font-bold text-gray-900 mt-1">{avgRecyclability}%</p></div>
            <Recycle className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">{renderScoreBar(avgRecyclability)}</div>
        </div>
      </div>

      {/* Energy Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Rating Distribution</h3>
          <div className="space-y-2">
            {(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as EnergyRating[]).map(rating => {
              const count = products.filter(p => p.energyRating === rating).length;
              const pct = products.length > 0 ? (count / products.length) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm ${energyRatingColor(rating)}`}>{rating}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className={`h-4 rounded-full ${energyRatingColor(rating)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainability Metrics Overview</h3>
          <div className="space-y-4">
            {products.map(p => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 text-sm mb-2">{p.name}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">Repairability</span><p className="font-bold">{p.repairabilityScore}/10</p></div>
                  <div><span className="text-gray-500">Recyclability</span><p className="font-bold">{p.recyclabilityRate}%</p></div>
                  <div><span className="text-gray-500">Carbon</span><p className="font-bold">{p.carbonFootprint} {p.carbonFootprintUnit}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Substances of Concern Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Substances of Concern Summary</h3>
        {(() => {
          const allSubs = products.flatMap(p => p.substancesOfConcern.map(s => ({ ...s, productName: p.name })));
          if (allSubs.length === 0) return <p className="text-gray-500 text-sm">No substances of concern reported across products.</p>;
          return (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Substance</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">CAS No.</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Product</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Level</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Concentration</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Location</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {allSubs.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{s.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-600 font-mono">{s.casNumber}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{s.productName}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${concernColor(s.concernLevel)}`}>{s.concernLevel.toUpperCase()}</span></td>
                      <td className="px-3 py-2 text-sm text-gray-600">{s.concentration} {s.unit}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{s.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );

  // ── Tab: Products ──

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setShowProductModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p>No products found.</p>
        </div>
      ) : filteredProducts.map(product => (
        <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <div className={`w-7 h-7 rounded flex items-center justify-center text-white font-bold text-xs ${energyRatingColor(product.energyRating)}`}>{product.energyRating}</div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${complianceColor(product.complianceStatus)}`}>{product.complianceStatus.replace('_', ' ').toUpperCase()}</span>
              </div>
              <p className="text-sm text-gray-600">{product.manufacturer} | {product.model} | {product.category}</p>
            </div>
            <div className="flex gap-2">
              {!product.hasPassport && (
                <button onClick={() => handleCreatePassport(product.id)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs flex items-center gap-1"><QrCode className="w-3 h-3" /> Create DPP</button>
              )}
              <button onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Details</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Repairability</p>
              <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-500" /><span className="font-bold">{product.repairabilityScore}/10</span></div>
              {renderScoreBar(product.repairabilityScore, 10, 'bg-orange-500')}
            </div>
            <div>
              <p className="text-gray-500 text-xs">Recyclability</p>
              <div className="flex items-center gap-2"><Recycle className="w-4 h-4 text-green-500" /><span className="font-bold">{product.recyclabilityRate}%</span></div>
              {renderScoreBar(product.recyclabilityRate)}
            </div>
            <div>
              <p className="text-gray-500 text-xs">Recycled Content</p>
              <div className="flex items-center gap-2"><Leaf className="w-4 h-4 text-green-600" /><span className="font-bold">{product.recycledContentRate}%</span></div>
              {renderScoreBar(product.recycledContentRate)}
            </div>
            <div>
              <p className="text-gray-500 text-xs">Carbon Footprint</p>
              <div className="flex items-center gap-2"><Factory className="w-4 h-4 text-gray-500" /><span className="font-bold">{product.carbonFootprint}</span></div>
              <p className="text-xs text-gray-400">{product.carbonFootprintUnit}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Lifespan / Warranty</p>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /><span className="font-bold">{product.expectedLifespan}y / {product.warrantyYears}y</span></div>
            </div>
          </div>

          {product.substancesOfConcern.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Substances of Concern: {product.substancesOfConcern.length}</p>
              <div className="flex flex-wrap gap-1">
                {product.substancesOfConcern.map(s => (
                  <span key={s.id} className={`px-2 py-0.5 rounded text-xs font-medium ${concernColor(s.concernLevel)}`}>{s.name} ({s.concernLevel})</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── Tab: Digital Passports ──

  const renderPassports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Digital Product Passports (DPP)</h3>
          <p className="text-sm text-gray-600">Manage Digital Product Passports as required by the ESPR. Each product must have a DPP accessible via QR code.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{passports.length}</p><p className="text-sm text-gray-500">Total DPPs</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{passports.filter(p => p.status === 'active').length}</p><p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">{passports.filter(p => p.status === 'draft').length}</p><p className="text-sm text-gray-500">In Draft</p>
        </div>
      </div>

      <div className="space-y-4">
        {passports.map(passport => {
          const catEntries = Object.entries(passport.dataCategories);
          const completedCats = catEntries.filter(([, v]) => v).length;
          return (
            <div key={passport.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <QrCode className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">{passport.productName}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${passport.status === 'active' ? 'bg-green-100 text-green-800' : passport.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{passport.status.toUpperCase()}</span>
                    <span className="text-xs text-gray-500">v{passport.version}</span>
                  </div>
                  <p className="text-sm text-gray-600">Created: {formatDate(passport.createdDate)} | Updated: {formatDate(passport.lastUpdated)} | Access: {passport.accessLevel}</p>
                </div>
                <button onClick={() => { setSelectedPassport(passport); setShowPassportModal(true); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"><Eye className="w-4 h-4" /> View DPP</button>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Data Completeness</span><span className="font-medium">{completedCats}/{catEntries.length} categories</span></div>
                {renderScoreBar((completedCats / catEntries.length) * 100, 100, 'bg-purple-500')}
              </div>
              <div className="flex flex-wrap gap-2">
                {catEntries.map(([key, val]) => (
                  <span key={key} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${val ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                    {val ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Products Without DPP */}
      {products.filter(p => !p.hasPassport).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Products Without Digital Product Passport</h4>
          <div className="space-y-2">
            {products.filter(p => !p.hasPassport).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded p-3 border border-yellow-200">
                <div><p className="font-medium text-gray-900 text-sm">{p.name}</p><p className="text-xs text-gray-500">{p.category} | {p.manufacturer}</p></div>
                <button onClick={() => handleCreatePassport(p.id)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Create DPP</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Tab: Lifecycle Assessment ──

  const renderLifecycle = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Product Lifecycle Environmental Assessment</h3>
      </div>

      {lcas.map(lca => (
        <div key={lca.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">{lca.productName}</h4>
              <p className="text-sm text-gray-600">Methodology: {lca.methodology} | Assessed: {formatDate(lca.assessmentDate)}</p>
              <div className="flex items-center gap-2 mt-1">
                {lca.certifications.map(c => <span key={c} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-200">{c}</span>)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">vs. Benchmark</p>
              <p className={`text-lg font-bold ${lca.comparisonToBenchmark < 0 ? 'text-green-600' : 'text-red-600'}`}>{lca.comparisonToBenchmark > 0 ? '+' : ''}{lca.comparisonToBenchmark}%</p>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Carbon Footprint</p><p className="text-xl font-bold">{lca.totalCarbonFootprint}</p><p className="text-xs text-gray-400">kg CO2e</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Water Usage</p><p className="text-xl font-bold">{formatNumber(lca.totalWaterUsage)}</p><p className="text-xs text-gray-400">litres</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Energy Usage</p><p className="text-xl font-bold">{formatNumber(lca.totalEnergyUsage)}</p><p className="text-xs text-gray-400">kWh</p></div>
          </div>

          {/* Phase Breakdown - Stacked Bar */}
          <h5 className="font-medium text-gray-700 text-sm mb-2">Lifecycle Phase Breakdown</h5>
          <div className="flex h-8 rounded-lg overflow-hidden mb-2">
            {lca.phases.map(phase => (
              <div key={phase.phase} className={`${phaseColor(phase.phase)} relative group`} style={{ width: `${phase.percentage}%` }}>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {phaseLabel(phase.phase)}: {phase.percentage}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs mb-4">
            {lca.phases.map(phase => (
              <span key={phase.phase} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded ${phaseColor(phase.phase)}`} />
                {phaseLabel(phase.phase)} ({phase.percentage}%)
              </span>
            ))}
          </div>

          {/* Phase Detail Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Phase</th>
                <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">CO2 (kg CO2e)</th>
                <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Water (L)</th>
                <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Energy (kWh)</th>
                <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Waste (kg)</th>
                <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Share</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {lca.phases.map(phase => (
                  <tr key={phase.phase} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 flex items-center gap-2"><span className={`w-3 h-3 rounded ${phaseColor(phase.phase)}`} />{phaseLabel(phase.phase)}</td>
                    <td className="px-3 py-2 text-sm text-right">{phase.co2Impact}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatNumber(phase.waterUsage)}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatNumber(phase.energyUsage)}</td>
                    <td className="px-3 py-2 text-sm text-right">{phase.wasteGenerated}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium">{phase.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {lcas.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          <Recycle className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p>No lifecycle assessments available yet.</p>
        </div>
      )}
    </div>
  );

  // ── Tab: Compliance ──

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{requirements.filter(r => r.met).length}</p><p className="text-sm text-gray-500">Requirements Met</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{requirements.filter(r => !r.met).length}</p><p className="text-sm text-gray-500">Outstanding</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{complianceRate}%</p><p className="text-sm text-gray-500">Compliance Rate</p>
          <div className="mt-2">{renderScoreBar(complianceRate)}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200"><h4 className="font-semibold text-gray-900">ESPR Compliance Requirements</h4></div>
        <div className="divide-y divide-gray-100">
          {requirements.map(req => (
            <div key={req.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={req.met} onChange={() => handleToggleRequirement(req.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium text-sm ${req.met ? 'text-gray-900 line-through' : 'text-gray-900'}`}>{req.requirement}</p>
                    {req.mandatory && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded">Mandatory</span>}
                  </div>
                  <p className="text-sm text-gray-600">{req.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Deadline: {formatDate(req.deadline)}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Package className="w-3 h-3" /> {req.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {req.applicableProducts.map(p => <span key={p} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p}</span>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key ESPR Dates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ESPR Key Implementation Dates</h3>
        <div className="space-y-3">
          {[
            { date: '2024-07-18', event: 'ESPR entered into force', done: true },
            { date: '2025-07-19', event: 'Destruction ban for textiles and footwear applies', done: true },
            { date: '2026-07-19', event: 'Destruction ban extended to other product groups', done: false },
            { date: '2027-01-01', event: 'First product-specific delegated acts expected (textiles, electronics)', done: false },
            { date: '2030-01-01', event: 'Digital Product Passport mandatory for prioritized categories', done: false },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg border ${item.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              {item.done ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-gray-400" />}
              <div className="flex-1"><p className="font-medium text-gray-900 text-sm">{item.event}</p><p className="text-xs text-gray-500">{formatDate(item.date)}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Main Render ──

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('euRegulations.ecodesign')}</h2>
          <p className="text-gray-600 mt-1">Manage compliance with the ESPR (EU) 2024/1781 and Digital Product Passports</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Download className="w-4 h-4" /> Export Report</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setCategoryFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'passports' && renderPassports()}
      {activeTab === 'lifecycle' && renderLifecycle()}
      {activeTab === 'compliance' && renderCompliance()}

      {/* ── Add Product Modal ── */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">{PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label><input type="text" required value={productForm.manufacturer} onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Model *</label><input type="text" required value={productForm.model} onChange={(e) => setProductForm({ ...productForm, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Energy Rating</label><select value={productForm.energyRating} onChange={(e) => setProductForm({ ...productForm, energyRating: e.target.value as EnergyRating })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">{['A','B','C','D','E','F','G'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Repairability (0-10)</label><input type="number" min={0} max={10} step={0.1} value={productForm.repairabilityScore} onChange={(e) => setProductForm({ ...productForm, repairabilityScore: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Recyclability (%)</label><input type="number" min={0} max={100} value={productForm.recyclabilityRate} onChange={(e) => setProductForm({ ...productForm, recyclabilityRate: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Recycled Content (%)</label><input type="number" min={0} max={100} value={productForm.recycledContentRate} onChange={(e) => setProductForm({ ...productForm, recycledContentRate: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Carbon (kg CO2e)</label><input type="number" min={0} value={productForm.carbonFootprint} onChange={(e) => setProductForm({ ...productForm, carbonFootprint: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lifespan (years)</label><input type="number" min={1} value={productForm.expectedLifespan} onChange={(e) => setProductForm({ ...productForm, expectedLifespan: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Product</button>
                <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DPP Detail Modal ── */}
      {showPassportModal && selectedPassport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">Digital Product Passport — {selectedPassport.productName}</h3>
              </div>
              <button onClick={() => { setShowPassportModal(false); setSelectedPassport(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="font-medium text-gray-700">Passport ID</label><p className="text-gray-900">{selectedPassport.id}</p></div>
                <div><label className="font-medium text-gray-700">Product ID</label><p className="text-gray-900">{selectedPassport.productId}</p></div>
                <div><label className="font-medium text-gray-700">Status</label><p><span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedPassport.status === 'active' ? 'bg-green-100 text-green-800' : selectedPassport.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{selectedPassport.status.toUpperCase()}</span></p></div>
                <div><label className="font-medium text-gray-700">Version</label><p className="text-gray-900">v{selectedPassport.version}</p></div>
                <div><label className="font-medium text-gray-700">Created</label><p className="text-gray-900">{formatDate(selectedPassport.createdDate)}</p></div>
                <div><label className="font-medium text-gray-700">Last Updated</label><p className="text-gray-900">{formatDate(selectedPassport.lastUpdated)}</p></div>
                <div><label className="font-medium text-gray-700">Access Level</label><p className="text-gray-900 capitalize">{selectedPassport.accessLevel}</p></div>
                <div><label className="font-medium text-gray-700">QR Code URL</label><p className="text-gray-900 text-xs break-all">{selectedPassport.qrCodeUrl}</p></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Data Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedPassport.dataCategories).map(([key, val]) => (
                    <div key={key} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${val ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                      {val ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedProduct(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="font-medium text-gray-700">Category</label><p>{selectedProduct.category}</p></div>
                <div><label className="font-medium text-gray-700">Model</label><p>{selectedProduct.model}</p></div>
                <div><label className="font-medium text-gray-700">Manufacturer</label><p>{selectedProduct.manufacturer}</p></div>
                <div><label className="font-medium text-gray-700">Energy Rating</label><p><span className={`px-2 py-0.5 rounded text-white font-bold text-xs ${energyRatingColor(selectedProduct.energyRating)}`}>{selectedProduct.energyRating}</span></p></div>
                <div><label className="font-medium text-gray-700">Repairability</label><p>{selectedProduct.repairabilityScore}/10</p></div>
                <div><label className="font-medium text-gray-700">Recyclability</label><p>{selectedProduct.recyclabilityRate}%</p></div>
                <div><label className="font-medium text-gray-700">Recycled Content</label><p>{selectedProduct.recycledContentRate}%</p></div>
                <div><label className="font-medium text-gray-700">Carbon Footprint</label><p>{selectedProduct.carbonFootprint} {selectedProduct.carbonFootprintUnit}</p></div>
                <div><label className="font-medium text-gray-700">Expected Lifespan</label><p>{selectedProduct.expectedLifespan} years</p></div>
                <div><label className="font-medium text-gray-700">Warranty</label><p>{selectedProduct.warrantyYears} years</p></div>
                <div><label className="font-medium text-gray-700">DPP ID</label><p>{selectedProduct.dppId || 'Not created'}</p></div>
                <div><label className="font-medium text-gray-700">Compliance</label><p><span className={`px-2 py-0.5 rounded text-xs font-medium ${complianceColor(selectedProduct.complianceStatus)}`}>{selectedProduct.complianceStatus.replace('_', ' ').toUpperCase()}</span></p></div>
              </div>
              {selectedProduct.substancesOfConcern.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Substances of Concern</h4>
                  {selectedProduct.substancesOfConcern.map(s => (
                    <div key={s.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{s.name}</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${concernColor(s.concernLevel)}`}>{s.concernLevel.toUpperCase()}</span></div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>CAS: {s.casNumber} | Location: {s.location} | Concentration: {s.concentration} {s.unit}</p>
                        <p>Regulatory: {s.regulatoryBasis}</p>
                        {s.alternatives.length > 0 && <p>Alternatives: {s.alternatives.join(', ')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
