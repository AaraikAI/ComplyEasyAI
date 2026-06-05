/**
 * Digital Product Passport (DPP)
 *
 * Comprehensive management interface for EU Digital Product Passports:
 * - Product identity and traceability data
 * - Material composition and substance tracking
 * - Carbon footprint per product lifecycle stage
 * - Recyclability and repairability scores
 * - Supply chain transparency data
 * - QR code generation concept for product labeling
 * - Compliance with EU Ecodesign for Sustainable Products Regulation (ESPR)
 * - Product data sharing with authorized parties
 * - Version history of passport data
 *
 * Reference: EU Ecodesign for Sustainable Products Regulation (ESPR) 2024/1781
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import { generateQrMatrix, matrixToSvg, matrixToPngDataUrl } from './qrCode';
import {
  ArrowLeft,
  Package,
  Recycle,
  Leaf,
  Truck,
  QrCode,
  BarChart3,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  Eye,
  Download,
  Edit3,
  ExternalLink,
  Info,
  Layers,
  Droplets,
  Zap,
  Globe,
  Lock,
  Unlock,
  History,
  Share2,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DPPProduct {
  id: string;
  name: string;
  gtin: string;
  batchNumber: string;
  category: string;
  manufacturer: string;
  countryOfOrigin: string;
  passportStatus: 'draft' | 'active' | 'updated' | 'archived' | 'revoked';
  recyclabilityScore: number;
  repairabilityScore: number;
  carbonFootprintTotal: number;
  ecodesignCompliant: boolean;
  lastUpdated: string;
  createdAt: string;
  passportVersion: string;
  qrCodeGenerated: boolean;
}

interface MaterialComposition {
  id: string;
  productId: string;
  materialName: string;
  materialType: 'primary' | 'secondary' | 'recycled' | 'bio-based';
  percentage: number;
  weight: number;
  unit: string;
  isSVHC: boolean;
  reachCompliant: boolean;
  recyclable: boolean;
  origin: string;
  supplier: string;
}

interface CarbonFootprint {
  id: string;
  productId: string;
  lifecycleStage: string;
  emissionsKgCO2e: number;
  percentage: number;
  methodology: string;
  dataQuality: 'primary' | 'secondary' | 'estimated';
  verifiedBy?: string;
}

interface SupplyChainNode {
  id: string;
  productId: string;
  nodeName: string;
  nodeType: 'raw_material' | 'component' | 'assembly' | 'packaging' | 'distribution' | 'retail';
  location: string;
  country: string;
  certifications: string[];
  socialCompliance: boolean;
  environmentalCompliance: boolean;
  lastAudit?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface PassportVersion {
  version: string;
  date: string;
  changedBy: string;
  changeType: 'creation' | 'material_update' | 'carbon_update' | 'score_update' | 'status_change';
  description: string;
}

interface DataSharingRecord {
  id: string;
  partyName: string;
  partyType: 'regulator' | 'consumer' | 'recycler' | 'repair_service' | 'distributor';
  accessLevel: 'full' | 'summary' | 'restricted';
  grantedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'revoked';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PRODUCT_CATEGORIES = [
  'Electronics',
  'Textiles',
  'Batteries',
  'Furniture',
  'Construction Products',
  'Packaging',
  'Tyres',
  'Iron & Steel',
  'Plastics',
  'Chemicals',
];

const LIFECYCLE_STAGES = [
  'Raw Material Extraction',
  'Material Processing',
  'Manufacturing',
  'Packaging',
  'Distribution',
  'Use Phase',
  'End of Life',
];

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_PRODUCTS: DPPProduct[] = [
  {
    id: 'dpp-001',
    name: 'EcoSmart Wireless Headphones',
    gtin: '4006381333931',
    batchNumber: 'B2026-Q1-0142',
    category: 'Electronics',
    manufacturer: 'GreenTech Audio GmbH',
    countryOfOrigin: 'Germany',
    passportStatus: 'active',
    recyclabilityScore: 78,
    repairabilityScore: 82,
    carbonFootprintTotal: 12.4,
    ecodesignCompliant: true,
    lastUpdated: '2026-02-10',
    createdAt: '2025-09-15',
    passportVersion: '3.1',
    qrCodeGenerated: true,
  },
  {
    id: 'dpp-002',
    name: 'SustainCell LFP Battery Pack',
    gtin: '8712345678901',
    batchNumber: 'B2025-Q4-0789',
    category: 'Batteries',
    manufacturer: 'SustainCell Energy B.V.',
    countryOfOrigin: 'Netherlands',
    passportStatus: 'active',
    recyclabilityScore: 92,
    repairabilityScore: 65,
    carbonFootprintTotal: 48.7,
    ecodesignCompliant: true,
    lastUpdated: '2026-01-28',
    createdAt: '2025-06-20',
    passportVersion: '2.4',
    qrCodeGenerated: true,
  },
  {
    id: 'dpp-003',
    name: 'CircuWeave Organic Cotton T-Shirt',
    gtin: '5901234123457',
    batchNumber: 'B2026-Q1-0055',
    category: 'Textiles',
    manufacturer: 'CircuWeave Fashion S.r.l.',
    countryOfOrigin: 'Italy',
    passportStatus: 'active',
    recyclabilityScore: 88,
    repairabilityScore: 45,
    carbonFootprintTotal: 5.2,
    ecodesignCompliant: true,
    lastUpdated: '2026-02-05',
    createdAt: '2025-11-10',
    passportVersion: '1.2',
    qrCodeGenerated: true,
  },
  {
    id: 'dpp-004',
    name: 'ModuDesk Ergonomic Workstation',
    gtin: '7612345678905',
    batchNumber: 'B2025-Q3-0234',
    category: 'Furniture',
    manufacturer: 'ModuDesk Scandinavia AB',
    countryOfOrigin: 'Sweden',
    passportStatus: 'updated',
    recyclabilityScore: 85,
    repairabilityScore: 91,
    carbonFootprintTotal: 32.1,
    ecodesignCompliant: true,
    lastUpdated: '2026-02-12',
    createdAt: '2025-08-01',
    passportVersion: '4.0',
    qrCodeGenerated: false,
  },
  {
    id: 'dpp-005',
    name: 'EcoBuild Insulation Panel',
    gtin: '3456789012345',
    batchNumber: 'B2026-Q1-0301',
    category: 'Construction Products',
    manufacturer: 'EcoBuild Materials S.A.',
    countryOfOrigin: 'France',
    passportStatus: 'draft',
    recyclabilityScore: 72,
    repairabilityScore: 30,
    carbonFootprintTotal: 18.9,
    ecodesignCompliant: false,
    lastUpdated: '2026-02-14',
    createdAt: '2026-01-15',
    passportVersion: '0.3',
    qrCodeGenerated: false,
  },
];

const DEMO_MATERIALS: MaterialComposition[] = [
  { id: 'mat-001', productId: 'dpp-001', materialName: 'Recycled ABS Plastic', materialType: 'recycled', percentage: 35, weight: 42, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Germany', supplier: 'PlastiCycle GmbH' },
  { id: 'mat-002', productId: 'dpp-001', materialName: 'Virgin ABS Plastic', materialType: 'primary', percentage: 15, weight: 18, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'South Korea', supplier: 'LG Chem' },
  { id: 'mat-003', productId: 'dpp-001', materialName: 'Lithium Polymer Battery', materialType: 'primary', percentage: 20, weight: 24, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Japan', supplier: 'Murata Manufacturing' },
  { id: 'mat-004', productId: 'dpp-001', materialName: 'Copper Wiring', materialType: 'primary', percentage: 8, weight: 9.6, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Chile', supplier: 'Codelco' },
  { id: 'mat-005', productId: 'dpp-001', materialName: 'Neodymium Magnets', materialType: 'primary', percentage: 5, weight: 6, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: false, origin: 'China', supplier: 'JL MAG Rare-Earth' },
  { id: 'mat-006', productId: 'dpp-001', materialName: 'Recycled Aluminum', materialType: 'recycled', percentage: 10, weight: 12, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Norway', supplier: 'Norsk Hydro' },
  { id: 'mat-007', productId: 'dpp-001', materialName: 'Bio-based Protein Leather', materialType: 'bio-based', percentage: 5, weight: 6, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Italy', supplier: 'Vegea S.r.l.' },
  { id: 'mat-008', productId: 'dpp-001', materialName: 'Silicone Ear Tips', materialType: 'primary', percentage: 2, weight: 2.4, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: false, origin: 'Germany', supplier: 'Wacker Chemie' },
  { id: 'mat-009', productId: 'dpp-002', materialName: 'Lithium Iron Phosphate (LFP)', materialType: 'primary', percentage: 40, weight: 4800, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Finland', supplier: 'Umicore Finland' },
  { id: 'mat-010', productId: 'dpp-002', materialName: 'Aluminum Casing', materialType: 'recycled', percentage: 25, weight: 3000, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Norway', supplier: 'Norsk Hydro' },
  { id: 'mat-011', productId: 'dpp-002', materialName: 'Copper Foil', materialType: 'primary', percentage: 15, weight: 1800, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Germany', supplier: 'Aurubis AG' },
  { id: 'mat-012', productId: 'dpp-002', materialName: 'Electrolyte Solution', materialType: 'primary', percentage: 12, weight: 1440, unit: 'g', isSVHC: true, reachCompliant: true, recyclable: false, origin: 'Belgium', supplier: 'Solvay S.A.' },
  { id: 'mat-013', productId: 'dpp-003', materialName: 'Organic Cotton', materialType: 'bio-based', percentage: 95, weight: 152, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Turkey', supplier: 'Orta Anadolu' },
  { id: 'mat-014', productId: 'dpp-003', materialName: 'Natural Dyes', materialType: 'bio-based', percentage: 3, weight: 4.8, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'India', supplier: 'Rubia Natural Colors' },
  { id: 'mat-015', productId: 'dpp-003', materialName: 'Recycled Polyester Thread', materialType: 'recycled', percentage: 2, weight: 3.2, unit: 'g', isSVHC: false, reachCompliant: true, recyclable: true, origin: 'Japan', supplier: 'Teijin Limited' },
];

const DEMO_CARBON: CarbonFootprint[] = [
  { id: 'cf-001', productId: 'dpp-001', lifecycleStage: 'Raw Material Extraction', emissionsKgCO2e: 3.1, percentage: 25, methodology: 'PEF 3.0', dataQuality: 'secondary' },
  { id: 'cf-002', productId: 'dpp-001', lifecycleStage: 'Material Processing', emissionsKgCO2e: 2.5, percentage: 20.2, methodology: 'PEF 3.0', dataQuality: 'primary', verifiedBy: 'TUV Rheinland' },
  { id: 'cf-003', productId: 'dpp-001', lifecycleStage: 'Manufacturing', emissionsKgCO2e: 1.8, percentage: 14.5, methodology: 'PEF 3.0', dataQuality: 'primary', verifiedBy: 'TUV Rheinland' },
  { id: 'cf-004', productId: 'dpp-001', lifecycleStage: 'Packaging', emissionsKgCO2e: 0.4, percentage: 3.2, methodology: 'PEF 3.0', dataQuality: 'primary' },
  { id: 'cf-005', productId: 'dpp-001', lifecycleStage: 'Distribution', emissionsKgCO2e: 1.2, percentage: 9.7, methodology: 'PEF 3.0', dataQuality: 'estimated' },
  { id: 'cf-006', productId: 'dpp-001', lifecycleStage: 'Use Phase', emissionsKgCO2e: 2.8, percentage: 22.6, methodology: 'PEF 3.0', dataQuality: 'estimated' },
  { id: 'cf-007', productId: 'dpp-001', lifecycleStage: 'End of Life', emissionsKgCO2e: 0.6, percentage: 4.8, methodology: 'PEF 3.0', dataQuality: 'secondary' },
  { id: 'cf-008', productId: 'dpp-002', lifecycleStage: 'Raw Material Extraction', emissionsKgCO2e: 15.2, percentage: 31.2, methodology: 'GHG Protocol', dataQuality: 'primary', verifiedBy: 'DNV GL' },
  { id: 'cf-009', productId: 'dpp-002', lifecycleStage: 'Material Processing', emissionsKgCO2e: 10.8, percentage: 22.2, methodology: 'GHG Protocol', dataQuality: 'primary', verifiedBy: 'DNV GL' },
  { id: 'cf-010', productId: 'dpp-002', lifecycleStage: 'Manufacturing', emissionsKgCO2e: 8.5, percentage: 17.5, methodology: 'GHG Protocol', dataQuality: 'primary' },
  { id: 'cf-011', productId: 'dpp-002', lifecycleStage: 'Distribution', emissionsKgCO2e: 3.2, percentage: 6.6, methodology: 'GHG Protocol', dataQuality: 'secondary' },
  { id: 'cf-012', productId: 'dpp-002', lifecycleStage: 'Use Phase', emissionsKgCO2e: 6.1, percentage: 12.5, methodology: 'GHG Protocol', dataQuality: 'estimated' },
  { id: 'cf-013', productId: 'dpp-002', lifecycleStage: 'End of Life', emissionsKgCO2e: 4.9, percentage: 10.1, methodology: 'GHG Protocol', dataQuality: 'secondary' },
];

const DEMO_SUPPLY_CHAIN: SupplyChainNode[] = [
  { id: 'sc-001', productId: 'dpp-001', nodeName: 'JL MAG Rare-Earth Co.', nodeType: 'raw_material', location: 'Ganzhou', country: 'China', certifications: ['ISO 14001'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-08-15', riskLevel: 'medium' },
  { id: 'sc-002', productId: 'dpp-001', nodeName: 'PlastiCycle GmbH', nodeType: 'raw_material', location: 'Stuttgart', country: 'Germany', certifications: ['ISO 14001', 'EMAS', 'Blue Angel'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-11-20', riskLevel: 'low' },
  { id: 'sc-003', productId: 'dpp-001', nodeName: 'Murata Manufacturing Co.', nodeType: 'component', location: 'Kyoto', country: 'Japan', certifications: ['ISO 14001', 'ISO 45001'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-09-10', riskLevel: 'low' },
  { id: 'sc-004', productId: 'dpp-001', nodeName: 'GreenTech Audio Assembly', nodeType: 'assembly', location: 'Munich', country: 'Germany', certifications: ['ISO 9001', 'ISO 14001', 'EMAS'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2026-01-05', riskLevel: 'low' },
  { id: 'sc-005', productId: 'dpp-001', nodeName: 'EcoPack Solutions', nodeType: 'packaging', location: 'Amsterdam', country: 'Netherlands', certifications: ['FSC', 'ISO 14001'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-10-15', riskLevel: 'low' },
  { id: 'sc-006', productId: 'dpp-001', nodeName: 'DHL Supply Chain', nodeType: 'distribution', location: 'Bonn', country: 'Germany', certifications: ['ISO 14001', 'GoGreen'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-12-01', riskLevel: 'low' },
  { id: 'sc-007', productId: 'dpp-002', nodeName: 'Mineral Resources Ltd.', nodeType: 'raw_material', location: 'Perth', country: 'Australia', certifications: ['IRMA'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-07-20', riskLevel: 'medium' },
  { id: 'sc-008', productId: 'dpp-002', nodeName: 'Umicore Finland Oy', nodeType: 'component', location: 'Kokkola', country: 'Finland', certifications: ['ISO 14001', 'ISO 45001', 'EcoVadis Gold'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2025-11-15', riskLevel: 'low' },
  { id: 'sc-009', productId: 'dpp-002', nodeName: 'SustainCell Factory', nodeType: 'assembly', location: 'Eindhoven', country: 'Netherlands', certifications: ['ISO 9001', 'ISO 14001', 'IATF 16949'], socialCompliance: true, environmentalCompliance: true, lastAudit: '2026-01-20', riskLevel: 'low' },
];

const DEMO_VERSIONS: PassportVersion[] = [
  { version: '3.1', date: '2026-02-10', changedBy: 'Maria Schmidt', changeType: 'carbon_update', description: 'Updated carbon footprint data with Q4 2025 verified emissions from TUV Rheinland' },
  { version: '3.0', date: '2026-01-15', changedBy: 'Hans Mueller', changeType: 'material_update', description: 'Added bio-based protein leather material data, updated recycled content percentages' },
  { version: '2.2', date: '2025-12-01', changedBy: 'Maria Schmidt', changeType: 'score_update', description: 'Recalculated repairability score after design-for-repair improvements' },
  { version: '2.1', date: '2025-11-10', changedBy: 'System', changeType: 'status_change', description: 'Passport activated for market distribution' },
  { version: '2.0', date: '2025-10-20', changedBy: 'Hans Mueller', changeType: 'material_update', description: 'Complete material composition update with supplier verification data' },
  { version: '1.0', date: '2025-09-15', changedBy: 'Maria Schmidt', changeType: 'creation', description: 'Initial product passport creation with baseline product data' },
];

const DEMO_SHARING: DataSharingRecord[] = [
  { id: 'share-001', partyName: 'European Commission DG GROW', partyType: 'regulator', accessLevel: 'full', grantedDate: '2025-11-01', status: 'active' },
  { id: 'share-002', partyName: 'German Federal Environmental Agency', partyType: 'regulator', accessLevel: 'full', grantedDate: '2025-11-15', status: 'active' },
  { id: 'share-003', partyName: 'Consumer Portal (Public)', partyType: 'consumer', accessLevel: 'summary', grantedDate: '2025-12-01', status: 'active' },
  { id: 'share-004', partyName: 'Veolia E-Waste Recycling', partyType: 'recycler', accessLevel: 'restricted', grantedDate: '2026-01-10', status: 'active' },
  { id: 'share-005', partyName: 'iFixit Partner Network', partyType: 'repair_service', accessLevel: 'restricted', grantedDate: '2026-01-20', status: 'active' },
  { id: 'share-006', partyName: 'MediaMarkt Distribution', partyType: 'distributor', accessLevel: 'summary', grantedDate: '2025-10-01', expiryDate: '2026-03-31', status: 'active' },
];

// ---------------------------------------------------------------------------
// Empty product sentinel — used when no products are loaded yet.
// ---------------------------------------------------------------------------
const EMPTY_DPP_PRODUCT: DPPProduct = {
  id: '',
  name: '',
  gtin: '',
  batchNumber: '',
  category: '',
  manufacturer: '',
  countryOfOrigin: '',
  passportStatus: 'draft',
  recyclabilityScore: 0,
  repairabilityScore: 0,
  carbonFootprintTotal: 0,
  ecodesignCompliant: false,
  lastUpdated: '',
  createdAt: '',
  passportVersion: '1.0',
  qrCodeGenerated: false,
};

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
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    updated: 'bg-blue-100 text-blue-700 border-blue-200',
    archived: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    revoked: 'bg-red-100 text-red-700 border-red-200',
    expired: 'bg-orange-100 text-orange-700 border-orange-200',
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-red-100 text-red-700 border-red-200',
    primary: 'bg-blue-100 text-blue-700 border-blue-200',
    secondary: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    estimated: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge text={label} className={config[status] || 'bg-gray-100 text-gray-700 border-gray-200'} />;
};

const ScoreCircle: React.FC<{ score: number; label: string; size?: 'sm' | 'lg' }> = ({ score, label, size = 'sm' }) => {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : score >= 40 ? 'text-orange-600' : 'text-red-600';
  const bgColor = score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : score >= 40 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
  const circleSize = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const fontSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex flex-col items-center">
      <div className={`${circleSize} rounded-full border-2 ${bgColor} flex items-center justify-center`}>
        <span className={`${fontSize} font-bold ${color}`}>{score}</span>
      </div>
      <span className="text-xs text-gray-500 mt-1.5 text-center">{label}</span>
    </div>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string; showLabel?: boolean }> = ({ value, color = 'bg-blue-500', showLabel = false }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
    {showLabel && <span className="text-xs font-medium text-gray-600 w-10 text-right">{value}%</span>}
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subLabel?: string; color: string }> = ({ icon, label, value, subLabel, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
    {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DigitalProductPassportProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const DigitalProductPassport: React.FC<DigitalProductPassportProps> = ({ onBack }) => {
  const { t } = useI18n();
  type TabId = 'overview' | 'products' | 'materials' | 'carbon' | 'supply_chain';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [products, setProducts] = useState<DPPProduct[]>([]);
  const [materials, setMaterials] = useState<MaterialComposition[]>([]);
  const [carbonData, setCarbonData] = useState<CarbonFootprint[]>([]);
  const [supplyChain, setSupplyChain] = useState<SupplyChainNode[]>([]);
  const [versions, setVersions] = useState<PassportVersion[]>([]);
  const [sharingRecords, setSharingRecords] = useState<DataSharingRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DPPProduct>(EMPTY_DPP_PRODUCT);
  const [serverReachable, setServerReachable] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  // Create-modal form state
  const [createForm, setCreateForm] = useState({
    name: '',
    gtin: '',
    category: PRODUCT_CATEGORIES[0],
    countryOfOrigin: '',
    manufacturer: '',
    batchNumber: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Share-modal form state
  const [shareForm, setShareForm] = useState({
    partyName: '',
    partyType: 'regulator' as DataSharingRecord['partyType'],
    accessLevel: 'full' as DataSharingRecord['accessLevel'],
  });
  const [isSharing, setIsSharing] = useState(false);

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ----- helpers to normalise API responses into local types -----
  const normaliseProduct = (p: any): DPPProduct => ({
    id: p.id,
    name: p.name || p.productName || '',
    gtin: p.gtin || '',
    batchNumber: p.batchNumber || '',
    category: p.category || '',
    manufacturer: p.manufacturer || '',
    countryOfOrigin: p.countryOfOrigin || '',
    passportStatus: p.passportStatus || p.status || 'draft',
    recyclabilityScore: p.recyclabilityScore ?? 0,
    repairabilityScore: p.repairabilityScore ?? 0,
    carbonFootprintTotal: p.carbonFootprintTotal ?? 0,
    ecodesignCompliant: p.ecodesignCompliant ?? false,
    lastUpdated: p.updatedAt || p.lastUpdated || '',
    createdAt: p.createdAt || '',
    passportVersion: p.passportVersion || '1.0',
    qrCodeGenerated: p.qrCodeGenerated ?? false,
  });

  // ----- loadData: fetch products and detail from the backend -----
  const loadData = useCallback(async (showSyncIndicator = false) => {
    if (showSyncIndicator) setIsSyncing(true);
    else setIsLoading(true);
    try {
      const passports = await api.modules.dpp.listPassports();
      setServerReachable(true);
      const mapped = Array.isArray(passports) ? passports.map(normaliseProduct) : [];
      setProducts(mapped);

      if (mapped.length > 0) {
        setSelectedProduct(prev => {
          const match = mapped.find(p => p.id === prev?.id);
          return match || mapped[0];
        });

        // Fetch detail sub-resources for the first product
        const detailProductId = mapped[0].id;
        const [materialsRes, carbonRes, supplyChainRes, detailRes] = await Promise.allSettled([
          api.modules.dpp.getMaterials(detailProductId),
          api.modules.dpp.getCarbon(detailProductId),
          api.modules.dpp.getSupplyChain(detailProductId),
          api.modules.dpp.getPassport(detailProductId),
        ]);

        if (materialsRes.status === 'fulfilled' && Array.isArray(materialsRes.value)) {
          setMaterials(materialsRes.value);
        }
        if (carbonRes.status === 'fulfilled' && Array.isArray(carbonRes.value)) {
          setCarbonData(carbonRes.value);
        }
        if (supplyChainRes.status === 'fulfilled' && Array.isArray(supplyChainRes.value)) {
          setSupplyChain(supplyChainRes.value);
        }
        // Versions and sharing may be embedded in the detail response
        if (detailRes.status === 'fulfilled' && detailRes.value) {
          if (Array.isArray(detailRes.value.versions)) {
            setVersions(detailRes.value.versions);
          }
          if (Array.isArray(detailRes.value.sharingRecords)) {
            setSharingRecords(detailRes.value.sharingRecords);
          }
        }
      } else {
        // Server reachable but empty — show empty state, no fallback.
        setSelectedProduct(EMPTY_DPP_PRODUCT);
        setMaterials([]);
        setCarbonData([]);
        setSupplyChain([]);
        setVersions([]);
        setSharingRecords([]);
      }
      setLoadError(null);
    } catch (_err: any) {
      // Server unreachable — fall back to local sample data so the UI is usable.
      setServerReachable(false);
      setProducts(DEMO_PRODUCTS);
      setSelectedProduct(DEMO_PRODUCTS[0]);
      setMaterials(DEMO_MATERIALS);
      setCarbonData(DEMO_CARBON);
      setSupplyChain(DEMO_SUPPLY_CHAIN);
      setVersions(DEMO_VERSIONS);
      setSharingRecords(DEMO_SHARING);
      setLoadError('Unable to connect to server. Showing local data.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Fetch detail sub-resources when the selected product changes
  const loadProductDetail = useCallback(async (productId: string) => {
    if (!productId) return;
    try {
      const [materialsRes, carbonRes, supplyChainRes] = await Promise.allSettled([
        api.modules.dpp.getMaterials(productId),
        api.modules.dpp.getCarbon(productId),
        api.modules.dpp.getSupplyChain(productId),
      ]);
      if (materialsRes.status === 'fulfilled' && Array.isArray(materialsRes.value)) {
        setMaterials(prev => {
          const otherMats = prev.filter(m => m.productId !== productId);
          return [...otherMats, ...materialsRes.value];
        });
      }
      if (carbonRes.status === 'fulfilled' && Array.isArray(carbonRes.value)) {
        setCarbonData(prev => {
          const otherCarbon = prev.filter(c => c.productId !== productId);
          return [...otherCarbon, ...carbonRes.value];
        });
      }
      if (supplyChainRes.status === 'fulfilled' && Array.isArray(supplyChainRes.value)) {
        setSupplyChain(prev => {
          const otherChain = prev.filter(s => s.productId !== productId);
          return [...otherChain, ...supplyChainRes.value];
        });
      }
    } catch {
      // Keep existing data on failure
    }
  }, []);

  // ----- handleCreatePassport -----
  const handleCreatePassport = useCallback(async () => {
    if (!createForm.name) return;

    // Optimistic local product with provisional id
    const optimisticId = `dpp-local-${Date.now()}`;
    const optimistic: DPPProduct = {
      id: optimisticId,
      name: createForm.name,
      gtin: createForm.gtin,
      batchNumber: createForm.batchNumber,
      category: createForm.category,
      manufacturer: createForm.manufacturer,
      countryOfOrigin: createForm.countryOfOrigin,
      passportStatus: 'draft',
      recyclabilityScore: 0,
      repairabilityScore: 0,
      carbonFootprintTotal: 0,
      ecodesignCompliant: false,
      lastUpdated: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      passportVersion: '1.0',
      qrCodeGenerated: false,
    };
    setProducts(prev => [...prev, optimistic]);
    setShowCreateModal(false);
    setCreateForm({ name: '', gtin: '', category: PRODUCT_CATEGORIES[0], countryOfOrigin: '', manufacturer: '', batchNumber: '' });

    setIsCreating(true);
    try {
      const result = await api.modules.dpp.createPassport({
        name: optimistic.name,
        gtin: optimistic.gtin,
        category: optimistic.category,
        manufacturer: optimistic.manufacturer,
        countryOfOrigin: optimistic.countryOfOrigin,
        batchNumber: optimistic.batchNumber,
      });
      if (result && result.id) {
        const persisted = normaliseProduct(result);
        setProducts(prev => prev.map(p => p.id === optimisticId ? persisted : p));
      }
    } catch (_err: any) {
      // Keep optimistic entry in the list and surface a banner.
      setLoadError('Passport saved locally but failed to sync to server.');
    } finally {
      setIsCreating(false);
    }
  }, [createForm]);

  // ----- handleDeletePassport -----
  const handleDeletePassport = useCallback(async (id: string) => {
    const previous = products;
    // Optimistic removal
    setProducts(prev => prev.filter(p => p.id !== id));
    if (selectedProduct?.id === id) {
      const remaining = previous.filter(p => p.id !== id);
      setSelectedProduct(remaining[0] || EMPTY_DPP_PRODUCT);
    }

    // If this was an optimistic-only id (never reached the server), don't call the API.
    if (id.startsWith('dpp-local-')) return;

    try {
      await api.modules.dpp.deletePassport(id);
    } catch (_err: any) {
      // Restore on failure
      setProducts(previous);
      setLoadError('Failed to delete passport on server. Change reverted.');
    }
  }, [products, selectedProduct]);

  // ----- handleGrantAccess (share modal) -----
  const handleGrantAccess = useCallback(async () => {
    if (!selectedProduct?.id) return;
    setIsSharing(true);

    // Optimistic local update first
    const newRecord: DataSharingRecord = {
      id: `share-${Date.now()}`,
      partyName: shareForm.partyName,
      partyType: shareForm.partyType,
      accessLevel: shareForm.accessLevel,
      grantedDate: new Date().toISOString().slice(0, 10),
      status: 'active',
    };
    setSharingRecords(prev => [...prev, newRecord]);
    setShowShareModal(false);
    setShareForm({ partyName: '', partyType: 'regulator', accessLevel: 'full' });

    try {
      await api.modules.dpp.updatePassport(selectedProduct.id, {
        sharing: shareForm,
      });
    } catch (_err: any) {
      setLoadError('Sharing record saved locally but failed to sync to server.');
    } finally {
      setIsSharing(false);
    }
  }, [selectedProduct, shareForm]);

  // Fetch sub-resources when the selected product changes
  useEffect(() => {
    if (selectedProduct?.id) {
      loadProductDetail(selectedProduct.id);
    }
  }, [selectedProduct?.id, loadProductDetail]);

  // Computed
  const productMaterials = useMemo(() => materials.filter(m => m.productId === selectedProduct.id), [materials, selectedProduct]);
  const productCarbon = useMemo(() => carbonData.filter(c => c.productId === selectedProduct.id), [carbonData, selectedProduct]);
  const productSupplyChain = useMemo(() => supplyChain.filter(s => s.productId === selectedProduct.id), [supplyChain, selectedProduct]);
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.gtin.includes(searchQuery) || p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const overviewStats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.passportStatus === 'active').length;
    const safeDivisor = total > 0 ? total : 1;
    const avgRecyclability = total > 0 ? Math.round(products.reduce((s, p) => s + p.recyclabilityScore, 0) / safeDivisor) : 0;
    const avgRepairability = total > 0 ? Math.round(products.reduce((s, p) => s + p.repairabilityScore, 0) / safeDivisor) : 0;
    const totalCarbon = Math.round(products.reduce((s, p) => s + p.carbonFootprintTotal, 0) * 10) / 10;
    const ecoCompliant = products.filter(p => p.ecodesignCompliant).length;
    return { total, active, avgRecyclability, avgRepairability, totalCarbon, ecoCompliant };
  }, [products]);

  // Public passport URL encoded into the QR code for product labelling.
  const passportUrl = useMemo(() => {
    if (!selectedProduct.id) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/passport/${selectedProduct.id}`;
  }, [selectedProduct.id]);

  // Real QR module matrix for the selected passport (regenerated on change).
  const qrMatrix = useMemo(() => {
    if (!passportUrl) return null;
    try {
      return generateQrMatrix(passportUrl);
    } catch {
      return null;
    }
  }, [passportUrl]);

  const qrSvgMarkup = useMemo(() => (qrMatrix ? matrixToSvg(qrMatrix, 6) : ''), [qrMatrix]);

  const triggerDownload = useCallback((href: string, filename: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleDownloadQrPng = useCallback(() => {
    if (!qrMatrix) return;
    const dataUrl = matrixToPngDataUrl(qrMatrix, 8);
    if (dataUrl) triggerDownload(dataUrl, `dpp-${selectedProduct.gtin || selectedProduct.id}-qr.png`);
  }, [qrMatrix, selectedProduct, triggerDownload]);

  const handleDownloadQrSvg = useCallback(() => {
    if (!qrSvgMarkup) return;
    const blob = new Blob([qrSvgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `dpp-${selectedProduct.gtin || selectedProduct.id}-qr.svg`);
    URL.revokeObjectURL(url);
  }, [qrSvgMarkup, selectedProduct, triggerDownload]);

  // Tab definitions
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'materials', label: 'Materials', icon: Layers },
    { id: 'carbon', label: 'Carbon Footprint', icon: Leaf },
    { id: 'supply_chain', label: 'Supply Chain', icon: Truck },
  ];

  // ---------------------------------------------------------------------------
  // Render: Overview Tab
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<Package size={20} className="text-blue-600" />} label="Total Passports" value={overviewStats.total} color="bg-blue-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-600" />} label="Active Passports" value={overviewStats.active} color="bg-green-50" />
        <StatCard icon={<Recycle size={20} className="text-teal-600" />} label="Avg Recyclability" value={`${overviewStats.avgRecyclability}%`} color="bg-teal-50" />
        <StatCard icon={<Target size={20} className="text-indigo-600" />} label="Avg Repairability" value={`${overviewStats.avgRepairability}%`} color="bg-indigo-50" />
        <StatCard icon={<Leaf size={20} className="text-emerald-600" />} label="Total CO2e (kg)" value={overviewStats.totalCarbon} color="bg-emerald-50" />
        <StatCard icon={<Shield size={20} className="text-purple-600" />} label="Ecodesign Compliant" value={`${overviewStats.ecoCompliant}/${overviewStats.total}`} color="bg-purple-50" />
      </div>

      {/* Product Scores Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Sustainability Scores</h3>
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveTab('materials'); }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                  <StatusBadge status={product.passportStatus} />
                  {product.ecodesignCompliant && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">ESPR Compliant</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{product.manufacturer} | GTIN: {product.gtin}</p>
              </div>
              <div className="flex items-center gap-6">
                <ScoreCircle score={product.recyclabilityScore} label="Recyclability" />
                <ScoreCircle score={product.repairabilityScore} label="Repairability" />
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{product.carbonFootprintTotal}</p>
                  <p className="text-xs text-gray-500">kg CO2e</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Version History & Data Sharing side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Passport Version History</h3>
          </div>
          <div className="space-y-3">
            {versions.map((v, idx) => {
              const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
                creation: { icon: Plus, color: 'text-green-500 bg-green-50' },
                material_update: { icon: Layers, color: 'text-blue-500 bg-blue-50' },
                carbon_update: { icon: Leaf, color: 'text-emerald-500 bg-emerald-50' },
                score_update: { icon: Target, color: 'text-indigo-500 bg-indigo-50' },
                status_change: { icon: RefreshCw, color: 'text-purple-500 bg-purple-50' },
              };
              const cfg = typeConfig[v.changeType] || typeConfig.creation;
              const Icon = cfg.icon;
              return (
                <div key={idx} className="flex items-start gap-3 relative">
                  {idx < versions.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />}
                  <div className={`p-1.5 rounded-full ${cfg.color} flex-shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">v{v.version}</span>
                      <span className="text-xs text-gray-400">{v.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{v.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by {v.changedBy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Data Sharing Access</h3>
            </div>
            <button onClick={() => setShowShareModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Manage Access
            </button>
          </div>
          <div className="space-y-2">
            {sharingRecords.map(record => {
              const typeIcons: Record<string, React.ElementType> = { regulator: Shield, consumer: Users, recycler: Recycle, repair_service: Target, distributor: Truck };
              const Icon = typeIcons[record.partyType] || Users;
              return (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Icon size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.partyName}</p>
                      <p className="text-xs text-gray-500 capitalize">{record.partyType.replace(/_/g, ' ')} | Access: {record.accessLevel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.status === 'active' ? <Unlock size={14} className="text-green-500" /> : <Lock size={14} className="text-red-500" />}
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Products Tab
  // ---------------------------------------------------------------------------
  const renderProducts = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, GTIN, or manufacturer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80" />
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          <Plus size={16} /> Create Passport
        </button>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveTab('materials'); }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500">{product.manufacturer}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={product.passportStatus} />
                {product.qrCodeGenerated && (
                  <button onClick={e => { e.stopPropagation(); setSelectedProduct(product); setShowQRModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <QrCode size={16} className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div><p className="text-gray-500 text-xs">GTIN</p><p className="font-mono text-gray-700">{product.gtin}</p></div>
              <div><p className="text-gray-500 text-xs">Batch</p><p className="font-mono text-gray-700">{product.batchNumber}</p></div>
              <div><p className="text-gray-500 text-xs">{t('common.category')}</p><p className="text-gray-700">{product.category}</p></div>
              <div><p className="text-gray-500 text-xs">Origin</p><p className="text-gray-700">{product.countryOfOrigin}</p></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ScoreCircle score={product.recyclabilityScore} label="Recyclability" />
                <ScoreCircle score={product.repairabilityScore} label="Repairability" />
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{product.carbonFootprintTotal} <span className="text-xs font-normal text-gray-500">kg CO2e</span></p>
                <p className="text-xs text-gray-400">v{product.passportVersion} | {product.lastUpdated}</p>
              </div>
            </div>
            {product.ecodesignCompliant && (
              <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">ESPR Ecodesign Compliant</span>
              </div>
            )}
            {!product.ecodesignCompliant && (
              <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
                <AlertTriangle size={14} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Ecodesign compliance pending</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Materials Tab
  // ---------------------------------------------------------------------------
  const renderMaterials = () => {
    const totalWeight = productMaterials.reduce((s, m) => s + m.weight, 0);
    const recycledPct = productMaterials.filter(m => m.materialType === 'recycled').reduce((s, m) => s + m.percentage, 0);
    const bioPct = productMaterials.filter(m => m.materialType === 'bio-based').reduce((s, m) => s + m.percentage, 0);
    const svhcCount = productMaterials.filter(m => m.isSVHC).length;

    return (
      <div className="space-y-6">
        {/* Product Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Material Composition</h3>
            <select
              value={selectedProduct.id}
              onChange={e => { const p = products.find(pr => pr.id === e.target.value); if (p) setSelectedProduct(p); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Material Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Layers size={20} className="text-blue-600" />} label="Total Weight" value={`${totalWeight} g`} color="bg-blue-50" />
          <StatCard icon={<Recycle size={20} className="text-green-600" />} label="Recycled Content" value={`${recycledPct}%`} color="bg-green-50" />
          <StatCard icon={<Leaf size={20} className="text-emerald-600" />} label="Bio-Based Content" value={`${bioPct}%`} color="bg-emerald-50" />
          <StatCard icon={<AlertTriangle size={20} className="text-red-600" />} label="SVHC Substances" value={svhcCount} subLabel={svhcCount > 0 ? 'Requires disclosure' : 'None detected'} color="bg-red-50" />
        </div>

        {/* Material composition breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Composition Breakdown</h3>
          <div className="space-y-3 mb-6">
            {productMaterials.map(mat => {
              const typeColors: Record<string, string> = {
                primary: 'bg-blue-500',
                secondary: 'bg-gray-500',
                recycled: 'bg-green-500',
                'bio-based': 'bg-emerald-500',
              };
              return (
                <div key={mat.id} className="flex items-center gap-3">
                  <div className="w-48 text-sm text-gray-700 truncate" title={mat.materialName}>{mat.materialName}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                    <div className={`${typeColors[mat.materialType]} h-4 rounded-full transition-all`} style={{ width: `${mat.percentage}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">{mat.percentage}%</span>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{mat.weight} {mat.unit}</span>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> Primary</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-500" /> Secondary</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Recycled</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Bio-Based</span>
          </div>
        </div>

        {/* Detailed Material Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Detailed Material Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Material</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">{t('common.type')}</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-600">%</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Origin</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Supplier</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">SVHC</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">REACH</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">Recyclable</th>
                </tr>
              </thead>
              <tbody>
                {productMaterials.map(mat => (
                  <tr key={mat.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{mat.materialName}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={mat.materialType === 'bio-based' ? 'active' : mat.materialType} /></td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{mat.percentage}%</td>
                    <td className="py-2.5 px-3 text-gray-600">{mat.origin}</td>
                    <td className="py-2.5 px-3 text-gray-600">{mat.supplier}</td>
                    <td className="py-2.5 px-3 text-center">{mat.isSVHC ? <AlertTriangle size={14} className="inline text-red-500" /> : <CheckCircle size={14} className="inline text-green-500" />}</td>
                    <td className="py-2.5 px-3 text-center">{mat.reachCompliant ? <CheckCircle size={14} className="inline text-green-500" /> : <X size={14} className="inline text-red-500" />}</td>
                    <td className="py-2.5 px-3 text-center">{mat.recyclable ? <CheckCircle size={14} className="inline text-green-500" /> : <X size={14} className="inline text-gray-400" />}</td>
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
  // Render: Carbon Footprint Tab
  // ---------------------------------------------------------------------------
  const renderCarbon = () => {
    const totalEmissions = productCarbon.reduce((s, c) => s + c.emissionsKgCO2e, 0);
    const maxStageEmissions = Math.max(...productCarbon.map(c => c.emissionsKgCO2e), 1);

    return (
      <div className="space-y-6">
        {/* Product Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Carbon Footprint Analysis</h3>
            <select
              value={selectedProduct.id}
              onChange={e => { const p = products.find(pr => pr.id === e.target.value); if (p) setSelectedProduct(p); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Total and Lifecycle Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
            <Leaf size={32} className="text-green-500 mb-3" />
            <p className="text-4xl font-bold text-gray-900">{Math.round(totalEmissions * 10) / 10}</p>
            <p className="text-sm text-gray-500 mt-1">kg CO2 equivalent</p>
            <p className="text-xs text-gray-400 mt-2">{t('common.total')} product carbon footprint</p>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">PEF 3.0 Methodology</span>
              {productCarbon.some(c => c.verifiedBy) && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">Third-Party Verified</span>}
            </div>
          </div>

          {/* Lifecycle Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Emissions by Lifecycle Stage</h3>
            <div className="space-y-3">
              {productCarbon.map(stage => {
                const barWidth = (stage.emissionsKgCO2e / maxStageEmissions) * 100;
                const stageColors: Record<string, string> = {
                  'Raw Material Extraction': 'bg-orange-500',
                  'Material Processing': 'bg-yellow-500',
                  'Manufacturing': 'bg-blue-500',
                  'Packaging': 'bg-teal-500',
                  'Distribution': 'bg-indigo-500',
                  'Use Phase': 'bg-purple-500',
                  'End of Life': 'bg-gray-500',
                };
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-44 truncate" title={stage.lifecycleStage}>{stage.lifecycleStage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                      <div className={`${stageColors[stage.lifecycleStage] || 'bg-gray-400'} h-5 rounded-full transition-all`} style={{ width: `${barWidth}%` }} />
                    </div>
                    <div className="text-right w-28 flex items-center gap-2 justify-end">
                      <span className="text-sm font-medium text-gray-900">{stage.emissionsKgCO2e} kg</span>
                      <span className="text-xs text-gray-400">({stage.percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data Quality & Methodology */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Data Quality Assessment</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Lifecycle Stage</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-600">Emissions (kg CO2e)</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Methodology</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Data Quality</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Verified By</th>
                </tr>
              </thead>
              <tbody>
                {productCarbon.map(stage => (
                  <tr key={stage.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{stage.lifecycleStage}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{stage.emissionsKgCO2e}</td>
                    <td className="py-2.5 px-3 text-gray-600">{stage.methodology}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={stage.dataQuality} /></td>
                    <td className="py-2.5 px-3 text-gray-600">{stage.verifiedBy || <span className="text-gray-400">-</span>}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="py-2.5 px-3 text-gray-900">{t('common.total')}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-900">{Math.round(totalEmissions * 10) / 10}</td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Industry Benchmark */}
        {(() => {
          // Only render a benchmark comparison when a verified industry-average value is
          // available from the backend. Fabricated multipliers / fixed percentages and
          // hardcoded performance claims must never be presented as factual data.
          const industryAverageEmissions =
            (selectedProduct as { industryAverageEmissionsKgCO2e?: number } | undefined)
              ?.industryAverageEmissionsKgCO2e;
          if (industryAverageEmissions === null || industryAverageEmissions === undefined || industryAverageEmissions <= 0) {
            return (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Industry Benchmark Comparison</h3>
                <p className="text-sm text-gray-500">
                  No verified industry-average benchmark is available for this product category yet.
                </p>
              </div>
            );
          }
          const productPct = Math.min(100, (totalEmissions / industryAverageEmissions) * 100);
          const deltaPct = ((industryAverageEmissions - totalEmissions) / industryAverageEmissions) * 100;
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Industry Benchmark Comparison</h3>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">This Product</span>
                    <span className="text-sm font-medium text-green-600">{totalEmissions.toFixed(1)} kg CO2e</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 relative">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${productPct.toFixed(0)}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Industry Average</span>
                    <span className="text-sm font-medium text-yellow-600">{industryAverageEmissions.toFixed(1)} kg CO2e</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 relative">
                    <div className="bg-yellow-500 h-4 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
              {deltaPct > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <TrendingDown size={16} className="text-green-600" />
                  <p className="text-sm text-green-700">
                    This product performs <strong>{deltaPct.toFixed(1)}% better</strong> than the verified industry average for carbon footprint.
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Supply Chain Tab
  // ---------------------------------------------------------------------------
  const renderSupplyChain = () => {
    const nodeTypeOrder: Record<string, number> = { raw_material: 1, component: 2, assembly: 3, packaging: 4, distribution: 5, retail: 6 };
    const sortedNodes = [...productSupplyChain].sort((a, b) => (nodeTypeOrder[a.nodeType] || 99) - (nodeTypeOrder[b.nodeType] || 99));
    const nodeTypeLabels: Record<string, string> = { raw_material: 'Raw Material', component: 'Component', assembly: 'Assembly', packaging: 'Packaging', distribution: 'Distribution', retail: 'Retail' };
    const nodeTypeColors: Record<string, string> = { raw_material: 'bg-orange-100 text-orange-700', component: 'bg-blue-100 text-blue-700', assembly: 'bg-indigo-100 text-indigo-700', packaging: 'bg-teal-100 text-teal-700', distribution: 'bg-purple-100 text-purple-700', retail: 'bg-pink-100 text-pink-700' };

    return (
      <div className="space-y-6">
        {/* Product Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Supply Chain Transparency</h3>
            <select
              value={selectedProduct.id}
              onChange={e => { const p = products.find(pr => pr.id === e.target.value); if (p) setSelectedProduct(p); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Globe size={20} className="text-blue-600" />} label="Supply Chain Nodes" value={productSupplyChain.length} color="bg-blue-50" />
          <StatCard icon={<Shield size={20} className="text-green-600" />} label="Social Compliant" value={`${productSupplyChain.filter(n => n.socialCompliance).length}/${productSupplyChain.length}`} color="bg-green-50" />
          <StatCard icon={<Leaf size={20} className="text-emerald-600" />} label="Env. Compliant" value={`${productSupplyChain.filter(n => n.environmentalCompliance).length}/${productSupplyChain.length}`} color="bg-emerald-50" />
          <StatCard icon={<AlertTriangle size={20} className="text-orange-600" />} label="High Risk Nodes" value={productSupplyChain.filter(n => n.riskLevel === 'high').length} color="bg-orange-50" />
        </div>

        {/* Supply Chain Flow */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Supply Chain Map</h3>
          <div className="space-y-3">
            {sortedNodes.map((node, idx) => (
              <div key={node.id}>
                <div
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${nodeTypeColors[node.nodeType]}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{node.nodeName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${nodeTypeColors[node.nodeType]}`}>{nodeTypeLabels[node.nodeType]}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{node.location}, {node.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {node.socialCompliance ? <CheckCircle size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                      {node.environmentalCompliance ? <CheckCircle size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                    </div>
                    <StatusBadge status={node.riskLevel} />
                    {expandedNode === node.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expandedNode === node.id && (
                  <div className="ml-12 mt-2 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Certifications</p>
                        <div className="flex flex-wrap gap-1">
                          {node.certifications.map(cert => (
                            <span key={cert} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{cert}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Last Audit</p>
                        <p className="text-gray-700">{node.lastAudit || 'Not audited'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Social Compliance</p>
                        <div className="flex items-center gap-1">
                          {node.socialCompliance ? <><CheckCircle size={14} className="text-green-500" /><span className="text-green-700">Verified</span></> : <><X size={14} className="text-red-500" /><span className="text-red-700">Non-compliant</span></>}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Environmental Compliance</p>
                        <div className="flex items-center gap-1">
                          {node.environmentalCompliance ? <><CheckCircle size={14} className="text-green-500" /><span className="text-green-700">Verified</span></> : <><X size={14} className="text-red-500" /><span className="text-red-700">Non-compliant</span></>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {idx < sortedNodes.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-px h-4 bg-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------
  const renderQRModal = () => showQRModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Product QR Code</h3>
          <button onClick={() => setShowQRModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-8 flex flex-col items-center">
          <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center mb-4 p-2">
            {qrSvgMarkup ? (
              <div className="w-full h-full" aria-label={`QR code for ${selectedProduct.name}`} dangerouslySetInnerHTML={{ __html: qrSvgMarkup }} />
            ) : (
              <>
                <QrCode size={80} className="text-gray-300" />
                <p className="text-xs text-gray-400 mt-2">Select a saved passport to generate its QR code</p>
              </>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">{selectedProduct.name}</p>
          <p className="text-xs text-gray-500 mt-1">GTIN: {selectedProduct.gtin}</p>
          <p className="text-xs text-gray-400 mt-0.5">Passport v{selectedProduct.passportVersion}</p>
          {passportUrl && <p className="text-[10px] text-gray-400 mt-1 break-all text-center">{passportUrl}</p>}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg w-full">
            <p className="text-xs text-blue-700 text-center">
              Scan to access the Digital Product Passport with full material composition, carbon footprint, and recyclability data.
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleDownloadQrPng} disabled={!qrMatrix} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Download size={14} /> Download PNG
            </button>
            <button onClick={handleDownloadQrSvg} disabled={!qrMatrix} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Download size={14} /> Download SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShareModal = () => showShareModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Manage Data Sharing</h3>
          <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
            <input type="text" value={shareForm.partyName} onChange={e => setShareForm(f => ({ ...f, partyName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Organization name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Type</label>
            <select value={shareForm.partyType} onChange={e => setShareForm(f => ({ ...f, partyType: e.target.value as DataSharingRecord['partyType'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="regulator">Regulator</option>
              <option value="consumer">Consumer</option>
              <option value="recycler">Recycler</option>
              <option value="repair_service">Repair Service</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
            <select value={shareForm.accessLevel} onChange={e => setShareForm(f => ({ ...f, accessLevel: e.target.value as DataSharingRecord['accessLevel'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="full">Full Access</option>
              <option value="summary">Summary Only</option>
              <option value="restricted">Restricted (specific fields)</option>
            </select>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700">Data sharing is governed by the ESPR regulation. Authorized parties must be verified before granting access to sensitive product data.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
          <button
            onClick={handleGrantAccess}
            disabled={isSharing || !shareForm.partyName}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? 'Granting...' : 'Grant Access'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCreateModal = () => showCreateModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('common.create')} Digital Product Passport</h3>
          <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Product name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GTIN *</label>
              <input type="text" value={createForm.gtin} onChange={e => setCreateForm(f => ({ ...f, gtin: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Global Trade Item Number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.category')}</label>
              <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
              <input type="text" value={createForm.countryOfOrigin} onChange={e => setCreateForm(f => ({ ...f, countryOfOrigin: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g., Germany" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
            <input type="text" value={createForm.manufacturer} onChange={e => setCreateForm(f => ({ ...f, manufacturer: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Manufacturer name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input type="text" value={createForm.batchNumber} onChange={e => setCreateForm(f => ({ ...f, batchNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g., B2026-Q1-0001" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
          <button
            onClick={handleCreatePassport}
            disabled={isCreating || !createForm.name || !createForm.gtin}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Passport'}
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
            <h1 className="text-3xl font-bold text-gray-900">Digital Product Passport</h1>
            <p className="text-gray-600 mt-1">EU ESPR compliant product traceability and sustainability data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
            <Plus size={16} /> New Passport
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('common.loading')} product passport data...</span>
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
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'materials' && renderMaterials()}
      {activeTab === 'carbon' && renderCarbon()}
      {activeTab === 'supply_chain' && renderSupplyChain()}

      {/* Modals */}
      {renderQRModal()}
      {renderShareModal()}
      {renderCreateModal()}
    </div>
  );
};

export default DigitalProductPassport;
