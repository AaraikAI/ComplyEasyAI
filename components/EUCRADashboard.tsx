/**
 * EU Cyber Resilience Act (CRA) Dashboard
 *
 * Comprehensive management interface for CRA compliance:
 * - Product security management and classification (Class I, II, Critical)
 * - Vulnerability disclosure with 24-hour ENISA notification tracking
 * - Security update lifecycle management
 * - Product security requirements checklist with progress
 * - Risk assessment for digital products
 * - CRA compliance score calculation
 *
 * Reference: Regulation (EU) 2024/2847
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  Shield, AlertTriangle, CheckCircle, X, Plus, FileText, Clock,
  Search, Filter, Bug, RefreshCw, Lock, Cpu, ChevronRight,
  BarChart3, Calendar, Bell, Download, Edit, Trash2, Eye,
  AlertCircle, ArrowUpRight, Package, Zap, Timer
} from 'lucide-react';

// ── Data Models ──────────────────────────────────────────────────────────

type ProductCategory = 'default' | 'class_i' | 'class_ii' | 'critical';
type ComplianceStatus = 'compliant' | 'non_compliant' | 'in_progress' | 'not_started';
type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low';
type VulnerabilityStatus = 'reported' | 'enisa_notified' | 'investigating' | 'patched' | 'disclosed';
type UpdateStatus = 'planned' | 'in_development' | 'testing' | 'released' | 'end_of_support';

interface CRAProduct {
  id: string;
  name: string;
  version: string;
  category: ProductCategory;
  hasDigitalElements: boolean;
  manufacturer: string;
  description: string;
  complianceStatus: ComplianceStatus;
  complianceScore: number;
  securityRequirements: SecurityRequirement[];
  lastAssessmentDate: string;
  supportEndDate: string;
  ceMarking: boolean;
  sbomAvailable: boolean;
  contactInfo: string;
}

interface SecurityRequirement {
  id: string;
  category: string;
  requirement: string;
  met: boolean;
  notes: string;
}

interface Vulnerability {
  id: string;
  productId: string;
  productName: string;
  cveId: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  reportedDate: string;
  enisaNotifiedDate: string | null;
  enisaDeadline: string;
  patchDate: string | null;
  disclosureDate: string | null;
  reporter: string;
  isActivelyExploited: boolean;
}

interface SecurityUpdate {
  id: string;
  productId: string;
  productName: string;
  version: string;
  status: UpdateStatus;
  releaseDate: string | null;
  plannedDate: string;
  vulnerabilitiesFixed: string[];
  securityImprovements: string[];
  supportDuration: string;
  isFreeOfCharge: boolean;
  autoUpdateEnabled: boolean;
}

interface ComplianceTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'deadline' | 'milestone' | 'obligation';
  status: 'upcoming' | 'active' | 'completed' | 'overdue';
}

type TabKey = 'overview' | 'products' | 'vulnerabilities' | 'updates' | 'timeline';

// ── Default Data ─────────────────────────────────────────────────────────

const DEFAULT_PRODUCTS: CRAProduct[] = [
  {
    id: 'prod-001',
    name: 'SmartHome Hub Pro',
    version: '3.2.1',
    category: 'class_ii',
    hasDigitalElements: true,
    manufacturer: 'TechSecure GmbH',
    description: 'Connected home automation controller with cloud integration and remote access capabilities.',
    complianceStatus: 'in_progress',
    complianceScore: 72,
    securityRequirements: [
      { id: 'sr-1', category: 'Design', requirement: 'Products shall be designed without known exploitable vulnerabilities', met: true, notes: 'Pen-tested Q4 2025' },
      { id: 'sr-2', category: 'Design', requirement: 'Secure by default configuration', met: true, notes: 'Factory defaults reviewed' },
      { id: 'sr-3', category: 'Data Protection', requirement: 'Data at rest and in transit encryption', met: true, notes: 'AES-256 + TLS 1.3' },
      { id: 'sr-4', category: 'Data Protection', requirement: 'Minimize data processing to what is necessary', met: false, notes: 'Telemetry data collection under review' },
      { id: 'sr-5', category: 'Updates', requirement: 'Provide security updates for expected product lifetime', met: true, notes: '5-year support committed' },
      { id: 'sr-6', category: 'Updates', requirement: 'Separate security updates from functionality updates', met: false, notes: 'Currently bundled; separation planned for v4.0' },
      { id: 'sr-7', category: 'Vulnerability', requirement: 'Coordinated vulnerability disclosure policy published', met: true, notes: 'Published on website' },
      { id: 'sr-8', category: 'Vulnerability', requirement: 'Address vulnerabilities without delay', met: true, notes: 'SLA: Critical 48h, High 7d' },
      { id: 'sr-9', category: 'Documentation', requirement: 'SBOM maintained and available', met: true, notes: 'CycloneDX format' },
      { id: 'sr-10', category: 'Documentation', requirement: 'Technical documentation for conformity assessment', met: false, notes: 'Draft in progress' },
    ],
    lastAssessmentDate: '2025-11-15',
    supportEndDate: '2030-11-15',
    ceMarking: false,
    sbomAvailable: true,
    contactInfo: 'security@techsecure.eu',
  },
  {
    id: 'prod-002',
    name: 'IndustrialPLC Controller',
    version: '5.0.3',
    category: 'critical',
    hasDigitalElements: true,
    manufacturer: 'TechSecure GmbH',
    description: 'Programmable logic controller for industrial automation with network connectivity.',
    complianceStatus: 'in_progress',
    complianceScore: 58,
    securityRequirements: [
      { id: 'sr-11', category: 'Design', requirement: 'Products shall be designed without known exploitable vulnerabilities', met: true, notes: 'Third-party audit completed' },
      { id: 'sr-12', category: 'Design', requirement: 'Secure by default configuration', met: false, notes: 'Default passwords still in use' },
      { id: 'sr-13', category: 'Data Protection', requirement: 'Data at rest and in transit encryption', met: false, notes: 'Legacy protocols need upgrading' },
      { id: 'sr-14', category: 'Access Control', requirement: 'Authentication and identity management', met: true, notes: 'Role-based access implemented' },
      { id: 'sr-15', category: 'Updates', requirement: 'Provide security updates for expected product lifetime', met: true, notes: '10-year lifecycle' },
      { id: 'sr-16', category: 'Vulnerability', requirement: 'Coordinated vulnerability disclosure policy published', met: true, notes: 'ISO 29147 compliant' },
      { id: 'sr-17', category: 'Documentation', requirement: 'SBOM maintained and available', met: false, notes: 'SBOM generation in progress' },
    ],
    lastAssessmentDate: '2025-10-20',
    supportEndDate: '2035-06-30',
    ceMarking: false,
    sbomAvailable: false,
    contactInfo: 'psirt@techsecure.eu',
  },
  {
    id: 'prod-003',
    name: 'CloudSync Desktop',
    version: '2.8.0',
    category: 'default',
    hasDigitalElements: true,
    manufacturer: 'TechSecure GmbH',
    description: 'Desktop file synchronization application with end-to-end encryption.',
    complianceStatus: 'compliant',
    complianceScore: 94,
    securityRequirements: [
      { id: 'sr-18', category: 'Design', requirement: 'Products shall be designed without known exploitable vulnerabilities', met: true, notes: 'Annual pentest clear' },
      { id: 'sr-19', category: 'Design', requirement: 'Secure by default configuration', met: true, notes: 'E2E encryption on by default' },
      { id: 'sr-20', category: 'Data Protection', requirement: 'Data at rest and in transit encryption', met: true, notes: 'AES-256 + TLS 1.3' },
      { id: 'sr-21', category: 'Updates', requirement: 'Provide security updates for expected product lifetime', met: true, notes: 'Auto-update enabled' },
      { id: 'sr-22', category: 'Vulnerability', requirement: 'Coordinated vulnerability disclosure policy published', met: true, notes: 'Bug bounty active' },
      { id: 'sr-23', category: 'Documentation', requirement: 'SBOM maintained and available', met: true, notes: 'SPDX format, updated with each release' },
    ],
    lastAssessmentDate: '2026-01-10',
    supportEndDate: '2029-12-31',
    ceMarking: true,
    sbomAvailable: true,
    contactInfo: 'security@techsecure.eu',
  },
  {
    id: 'prod-004',
    name: 'SecureRouter X1',
    version: '1.4.2',
    category: 'class_i',
    hasDigitalElements: true,
    manufacturer: 'TechSecure GmbH',
    description: 'Enterprise-grade VPN router with firewall and intrusion detection.',
    complianceStatus: 'in_progress',
    complianceScore: 81,
    securityRequirements: [
      { id: 'sr-24', category: 'Design', requirement: 'Products shall be designed without known exploitable vulnerabilities', met: true, notes: 'Quarterly scans' },
      { id: 'sr-25', category: 'Design', requirement: 'Secure by default configuration', met: true, notes: 'Hardened default config' },
      { id: 'sr-26', category: 'Data Protection', requirement: 'Data at rest and in transit encryption', met: true, notes: 'IPSec + WireGuard' },
      { id: 'sr-27', category: 'Access Control', requirement: 'Authentication and identity management', met: true, notes: 'MFA supported' },
      { id: 'sr-28', category: 'Logging', requirement: 'Security-relevant event logging', met: true, notes: 'Syslog + SIEM integration' },
      { id: 'sr-29', category: 'Updates', requirement: 'Provide security updates for expected product lifetime', met: true, notes: '7-year lifecycle' },
      { id: 'sr-30', category: 'Vulnerability', requirement: 'Coordinated vulnerability disclosure policy published', met: true, notes: 'Published' },
      { id: 'sr-31', category: 'Documentation', requirement: 'SBOM maintained and available', met: false, notes: 'In progress' },
    ],
    lastAssessmentDate: '2025-12-05',
    supportEndDate: '2032-12-31',
    ceMarking: false,
    sbomAvailable: false,
    contactInfo: 'psirt@techsecure.eu',
  },
];

const DEFAULT_VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-001', productId: 'prod-001', productName: 'SmartHome Hub Pro',
    cveId: 'CVE-2026-10234', title: 'Buffer overflow in Zigbee protocol handler',
    description: 'A stack-based buffer overflow in the Zigbee message parser allows remote code execution via crafted packets.',
    severity: 'critical', status: 'enisa_notified',
    reportedDate: '2026-02-15T08:30:00Z', enisaNotifiedDate: '2026-02-15T14:22:00Z',
    enisaDeadline: '2026-02-16T08:30:00Z', patchDate: null, disclosureDate: null,
    reporter: 'External Researcher', isActivelyExploited: true,
  },
  {
    id: 'vuln-002', productId: 'prod-002', productName: 'IndustrialPLC Controller',
    cveId: 'CVE-2026-09871', title: 'Authentication bypass in web management interface',
    description: 'Improper session validation allows unauthenticated access to the admin panel via crafted cookies.',
    severity: 'high', status: 'investigating',
    reportedDate: '2026-02-10T12:00:00Z', enisaNotifiedDate: '2026-02-10T18:45:00Z',
    enisaDeadline: '2026-02-11T12:00:00Z', patchDate: null, disclosureDate: null,
    reporter: 'Internal Security Team', isActivelyExploited: false,
  },
  {
    id: 'vuln-003', productId: 'prod-003', productName: 'CloudSync Desktop',
    cveId: 'CVE-2025-45678', title: 'Information disclosure via log file',
    description: 'Debug logging exposes user file paths and metadata in a world-readable log file.',
    severity: 'medium', status: 'patched',
    reportedDate: '2025-12-20T09:00:00Z', enisaNotifiedDate: '2025-12-20T15:30:00Z',
    enisaDeadline: '2025-12-21T09:00:00Z', patchDate: '2026-01-05T00:00:00Z', disclosureDate: '2026-01-15T00:00:00Z',
    reporter: 'Bug Bounty Program', isActivelyExploited: false,
  },
  {
    id: 'vuln-004', productId: 'prod-004', productName: 'SecureRouter X1',
    cveId: 'CVE-2026-11002', title: 'DNS rebinding in management interface',
    description: 'DNS rebinding attack allows cross-origin access to the router management API.',
    severity: 'high', status: 'reported',
    reportedDate: '2026-02-17T06:00:00Z', enisaNotifiedDate: null,
    enisaDeadline: '2026-02-18T06:00:00Z', patchDate: null, disclosureDate: null,
    reporter: 'Customer Report', isActivelyExploited: false,
  },
  {
    id: 'vuln-005', productId: 'prod-001', productName: 'SmartHome Hub Pro',
    cveId: 'CVE-2025-38910', title: 'Insecure firmware update verification',
    description: 'Firmware update signature verification can be bypassed, allowing malicious firmware installation.',
    severity: 'critical', status: 'disclosed',
    reportedDate: '2025-09-01T10:00:00Z', enisaNotifiedDate: '2025-09-01T16:00:00Z',
    enisaDeadline: '2025-09-02T10:00:00Z', patchDate: '2025-10-01T00:00:00Z', disclosureDate: '2025-11-01T00:00:00Z',
    reporter: 'External Researcher', isActivelyExploited: false,
  },
];

const DEFAULT_UPDATES: SecurityUpdate[] = [
  {
    id: 'upd-001', productId: 'prod-001', productName: 'SmartHome Hub Pro',
    version: '3.2.2', status: 'in_development', releaseDate: null, plannedDate: '2026-03-01',
    vulnerabilitiesFixed: ['CVE-2026-10234'],
    securityImprovements: ['Enhanced Zigbee message validation', 'Stack canary implementation'],
    supportDuration: '5 years from release', isFreeOfCharge: true, autoUpdateEnabled: true,
  },
  {
    id: 'upd-002', productId: 'prod-003', productName: 'CloudSync Desktop',
    version: '2.8.1', status: 'released', releaseDate: '2026-01-05', plannedDate: '2026-01-05',
    vulnerabilitiesFixed: ['CVE-2025-45678'],
    securityImprovements: ['Removed debug logging from production builds', 'Added log file permissions enforcement'],
    supportDuration: '4 years from release', isFreeOfCharge: true, autoUpdateEnabled: true,
  },
  {
    id: 'upd-003', productId: 'prod-002', productName: 'IndustrialPLC Controller',
    version: '5.1.0', status: 'planned', releaseDate: null, plannedDate: '2026-06-15',
    vulnerabilitiesFixed: ['CVE-2026-09871'],
    securityImprovements: ['Session management overhaul', 'TLS 1.3 for all management interfaces', 'Default password elimination'],
    supportDuration: '10 years from release', isFreeOfCharge: true, autoUpdateEnabled: false,
  },
  {
    id: 'upd-004', productId: 'prod-004', productName: 'SecureRouter X1',
    version: '1.5.0', status: 'testing', releaseDate: null, plannedDate: '2026-03-15',
    vulnerabilitiesFixed: [],
    securityImprovements: ['DNS rebinding protection', 'CSRF token implementation', 'Rate limiting for management API'],
    supportDuration: '7 years from release', isFreeOfCharge: true, autoUpdateEnabled: true,
  },
];

const DEFAULT_TIMELINE: ComplianceTimelineEvent[] = [
  { id: 'tl-1', date: '2024-12-10', title: 'CRA enters into force', description: 'Regulation (EU) 2024/2847 officially entered into force.', type: 'milestone', status: 'completed' },
  { id: 'tl-2', date: '2025-06-11', title: 'Vulnerability reporting obligations begin', description: 'Manufacturers must report actively exploited vulnerabilities to ENISA within 24 hours (Article 14).', type: 'obligation', status: 'completed' },
  { id: 'tl-3', date: '2025-09-11', title: 'Conformity assessment body notification', description: 'Member States shall notify conformity assessment bodies (Article 38).', type: 'deadline', status: 'completed' },
  { id: 'tl-4', date: '2026-09-11', title: 'Full application of CRA', description: 'All obligations for manufacturers, importers, and distributors apply. Products must bear CE marking.', type: 'deadline', status: 'upcoming' },
  { id: 'tl-5', date: '2026-06-01', title: 'Internal readiness deadline', description: 'Complete all product conformity assessments and prepare technical documentation.', type: 'milestone', status: 'upcoming' },
  { id: 'tl-6', date: '2026-08-01', title: 'CE marking preparation', description: 'Finalize CE marking and EU declaration of conformity for all products.', type: 'deadline', status: 'upcoming' },
  { id: 'tl-7', date: '2027-06-11', title: 'Market surveillance enforcement', description: 'Market surveillance authorities begin active enforcement and product checks.', type: 'obligation', status: 'upcoming' },
];

// ── Helper Functions ─────────────────────────────────────────────────────

const categoryLabel = (cat: ProductCategory): string => {
  switch (cat) {
    case 'default': return 'Default';
    case 'class_i': return 'Class I';
    case 'class_ii': return 'Class II';
    case 'critical': return 'Critical';
  }
};

const categoryColor = (cat: ProductCategory): string => {
  switch (cat) {
    case 'default': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'class_i': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'class_ii': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical': return 'bg-red-100 text-red-800 border-red-300';
  }
};

const severityColor = (sev: VulnerabilitySeverity): string => {
  switch (sev) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
  }
};

const vulnStatusColor = (s: VulnerabilityStatus): string => {
  switch (s) {
    case 'reported': return 'bg-red-100 text-red-800';
    case 'enisa_notified': return 'bg-orange-100 text-orange-800';
    case 'investigating': return 'bg-yellow-100 text-yellow-800';
    case 'patched': return 'bg-blue-100 text-blue-800';
    case 'disclosed': return 'bg-green-100 text-green-800';
  }
};

const updateStatusColor = (s: UpdateStatus): string => {
  switch (s) {
    case 'planned': return 'bg-gray-100 text-gray-800';
    case 'in_development': return 'bg-blue-100 text-blue-800';
    case 'testing': return 'bg-yellow-100 text-yellow-800';
    case 'released': return 'bg-green-100 text-green-800';
    case 'end_of_support': return 'bg-red-100 text-red-800';
  }
};

const complianceStatusBadge = (s: ComplianceStatus): string => {
  switch (s) {
    case 'compliant': return 'bg-green-100 text-green-800';
    case 'non_compliant': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'not_started': return 'bg-gray-100 text-gray-800';
  }
};

const hoursRemaining = (deadline: string): number => {
  return Math.max(0, (new Date(deadline).getTime() - Date.now()) / 3600000);
};

const formatDate = (d: string | null): string => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Component ────────────────────────────────────────────────────────────

export const EUCRADashboard: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [products, setProducts] = useState<CRAProduct[]>(DEFAULT_PRODUCTS);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(DEFAULT_VULNERABILITIES);
  const [updates, setUpdates] = useState<SecurityUpdate[]>(DEFAULT_UPDATES);
  const [timeline, setTimeline] = useState<ComplianceTimelineEvent[]>(DEFAULT_TIMELINE);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<VulnerabilitySeverity | 'all'>('all');
  const [vulnStatusFilter, setVulnStatusFilter] = useState<VulnerabilityStatus | 'all'>('all');

  // ── Load saved data from API ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await api.regulationData.getAll('eu-cra');
        if (saved && typeof saved === 'object') {
          if (saved.products) setProducts(saved.products);
          if (saved.vulnerabilities) setVulnerabilities(saved.vulnerabilities);
          if (saved.updates) setUpdates(saved.updates);
          if (saved.timeline) setTimeline(saved.timeline);
        }
      } catch (err: any) {
        console.error('Failed to load EU CRA data:', err);
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
      api.regulationData.save('eu-cra', 'products', products).catch(console.error);
      api.regulationData.save('eu-cra', 'vulnerabilities', vulnerabilities).catch(console.error);
      api.regulationData.save('eu-cra', 'updates', updates).catch(console.error);
      api.regulationData.save('eu-cra', 'timeline', timeline).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [products, vulnerabilities, updates, timeline, isLoading]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showVulnModal, setShowVulnModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CRAProduct | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  const [productForm, setProductForm] = useState({
    name: '', version: '', category: 'default' as ProductCategory, hasDigitalElements: true,
    manufacturer: '', description: '', contactInfo: '',
  });
  const [vulnForm, setVulnForm] = useState({
    productId: '', cveId: '', title: '', description: '',
    severity: 'high' as VulnerabilitySeverity, reporter: '', isActivelyExploited: false,
  });

  // ── Computed ──

  const overallComplianceScore = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round(products.reduce((s, p) => s + p.complianceScore, 0) / products.length);
  }, [products]);

  const urgentVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(v => v.status === 'reported' || (v.status === 'enisa_notified' && !v.patchDate));
  }, [vulnerabilities]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, categoryFilter]);

  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.cveId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSev = severityFilter === 'all' || v.severity === severityFilter;
      const matchesStatus = vulnStatusFilter === 'all' || v.status === vulnStatusFilter;
      return matchesSearch && matchesSev && matchesStatus;
    });
  }, [vulnerabilities, searchTerm, severityFilter, vulnStatusFilter]);

  const daysUntilDeadline = useMemo(() => {
    const target = new Date('2026-09-11');
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
  }, []);

  // ── Handlers ──

  const handleAddProduct = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: CRAProduct = {
      id: `prod-${Date.now()}`,
      name: productForm.name,
      version: productForm.version,
      category: productForm.category,
      hasDigitalElements: productForm.hasDigitalElements,
      manufacturer: productForm.manufacturer,
      description: productForm.description,
      complianceStatus: 'not_started',
      complianceScore: 0,
      securityRequirements: [],
      lastAssessmentDate: new Date().toISOString().split('T')[0],
      supportEndDate: new Date(Date.now() + 5 * 365 * 86400000).toISOString().split('T')[0],
      ceMarking: false,
      sbomAvailable: false,
      contactInfo: productForm.contactInfo,
    };
    setProducts(prev => [...prev, newProduct]);
    setShowProductModal(false);
    setProductForm({ name: '', version: '', category: 'default', hasDigitalElements: true, manufacturer: '', description: '', contactInfo: '' });
  }, [productForm]);

  const handleReportVulnerability = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === vulnForm.productId);
    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 3600000);
    const newVuln: Vulnerability = {
      id: `vuln-${Date.now()}`,
      productId: vulnForm.productId,
      productName: product?.name || 'Unknown',
      cveId: vulnForm.cveId,
      title: vulnForm.title,
      description: vulnForm.description,
      severity: vulnForm.severity,
      status: 'reported',
      reportedDate: now.toISOString(),
      enisaNotifiedDate: null,
      enisaDeadline: deadline.toISOString(),
      patchDate: null,
      disclosureDate: null,
      reporter: vulnForm.reporter,
      isActivelyExploited: vulnForm.isActivelyExploited,
    };
    setVulnerabilities(prev => [newVuln, ...prev]);
    setShowVulnModal(false);
    setVulnForm({ productId: '', cveId: '', title: '', description: '', severity: 'high', reporter: '', isActivelyExploited: false });
  }, [vulnForm, products]);

  const handleNotifyENISA = useCallback((vulnId: string) => {
    setVulnerabilities(prev => prev.map(v =>
      v.id === vulnId ? { ...v, status: 'enisa_notified' as VulnerabilityStatus, enisaNotifiedDate: new Date().toISOString() } : v
    ));
  }, []);

  const handleToggleRequirement = useCallback((productId: string, reqId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const updatedReqs = p.securityRequirements.map(r =>
        r.id === reqId ? { ...r, met: !r.met } : r
      );
      const metCount = updatedReqs.filter(r => r.met).length;
      const score = updatedReqs.length > 0 ? Math.round((metCount / updatedReqs.length) * 100) : 0;
      let status: ComplianceStatus = 'not_started';
      if (score === 100) status = 'compliant';
      else if (score > 0) status = 'in_progress';
      return { ...p, securityRequirements: updatedReqs, complianceScore: score, complianceStatus: status };
    }));
  }, []);

  const handleDownloadReport = useCallback(() => {
    const report = {
      generatedAt: new Date().toISOString(),
      reportType: 'EU CRA Compliance Report',
      overallScore: overallComplianceScore,
      products: products.map(p => ({
        name: p.name, category: categoryLabel(p.category), score: p.complianceScore,
        status: p.complianceStatus, ceMarking: p.ceMarking, sbomAvailable: p.sbomAvailable,
      })),
      openVulnerabilities: vulnerabilities.filter(v => v.status !== 'disclosed' && v.status !== 'patched').length,
      totalVulnerabilities: vulnerabilities.length,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cra-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [overallComplianceScore, products, vulnerabilities]);

  // ── Tab definitions ──

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: t('common.overview'), icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { key: 'vulnerabilities', label: 'Vulnerabilities', icon: <Bug className="w-4 h-4" /> },
    { key: 'updates', label: 'Security Updates', icon: <RefreshCw className="w-4 h-4" /> },
    { key: 'timeline', label: 'Compliance Timeline', icon: <Calendar className="w-4 h-4" /> },
  ];

  // ── Render Helpers ──

  const renderScoreBar = (score: number) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );

  // ── Tab: Overview ──

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall CRA Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{overallComplianceScore}%</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2">{renderScoreBar(overallComplianceScore)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Products Tracked</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{products.filter(p => p.ceMarking).length} with CE marking</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Vulnerabilities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{urgentVulnerabilities.length}</p>
            </div>
            <Bug className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{vulnerabilities.filter(v => v.isActivelyExploited && v.status !== 'patched').length} actively exploited</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Days Until Full Application</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{daysUntilDeadline}</p>
            </div>
            <Timer className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Sep 11, 2026 deadline</p>
        </div>
      </div>

      {/* ENISA 24hr Alerts */}
      {vulnerabilities.filter(v => v.status === 'reported' && v.isActivelyExploited).length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Urgent: ENISA Notification Required</h4>
          </div>
          {vulnerabilities.filter(v => v.status === 'reported' && v.isActivelyExploited).map(v => (
            <div key={v.id} className="flex items-center justify-between bg-white rounded p-3 mt-2 border border-red-200">
              <div>
                <p className="font-medium text-gray-900">{v.cveId}: {v.title}</p>
                <p className="text-sm text-red-700">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {hoursRemaining(v.enisaDeadline).toFixed(1)}h remaining of 24hr window
                </p>
              </div>
              <button
                onClick={() => handleNotifyENISA(v.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
              >
                <ArrowUpRight className="w-4 h-4" /> Notify ENISA
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Product Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
          <div className="space-y-3">
            {(['default', 'class_i', 'class_ii', 'critical'] as ProductCategory[]).map(cat => {
              const count = products.filter(p => p.category === cat).length;
              const pct = products.length > 0 ? (count / products.length) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{categoryLabel(cat)}</span>
                    <span className="text-gray-500">{count} product{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${cat === 'critical' ? 'bg-red-500' : cat === 'class_ii' ? 'bg-orange-500' : cat === 'class_i' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-40 text-sm font-medium text-gray-700 truncate">{p.name}</span>
                <div className="flex-1">{renderScoreBar(p.complianceScore)}</div>
                <span className="text-sm font-bold text-gray-900 w-12 text-right">{p.complianceScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Vulnerability Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Vulnerability Activity</h3>
        <div className="divide-y divide-gray-100">
          {vulnerabilities.slice(0, 5).map(v => (
            <div key={v.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColor(v.severity)}`}>{v.severity.toUpperCase()}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.cveId}: {v.title}</p>
                  <p className="text-xs text-gray-500">{v.productName} | Reported {formatDate(v.reportedDate)}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${vulnStatusColor(v.status)}`}>
                {v.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
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
            <input
              type="text" placeholder="Search products..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="default">Default</option>
            <option value="class_i">Class I</option>
            <option value="class_ii">Class II</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button onClick={() => setShowProductModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No products found matching your criteria.</p>
          </div>
        ) : filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                  <span className="text-sm text-gray-500">v{product.version}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColor(product.category)}`}>
                    {categoryLabel(product.category)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${complianceStatusBadge(product.complianceStatus)}`}>
                    {product.complianceStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1">
                  <Eye className="w-4 h-4" /> Details
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1"><Cpu className="w-4 h-4" /> {product.manufacturer}</span>
              <span className="flex items-center gap-1">
                {product.ceMarking ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}
                {t('euRegulations.ceMarking')}
              </span>
              <span className="flex items-center gap-1">
                {product.sbomAvailable ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}
                SBOM
              </span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Support until {formatDate(product.supportEndDate)}</span>
            </div>

            {/* Compliance Score */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Compliance Score</span>
                <span className="font-bold text-gray-900">{product.complianceScore}%</span>
              </div>
              {renderScoreBar(product.complianceScore)}
            </div>

            {/* Security Requirements Checklist */}
            {product.securityRequirements.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Security Requirements ({product.securityRequirements.filter(r => r.met).length}/{product.securityRequirements.length})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.securityRequirements.map(req => (
                    <label key={req.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox" checked={req.met}
                        onChange={() => handleToggleRequirement(product.id, req.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <div>
                        <span className={`text-sm ${req.met ? 'text-gray-900' : 'text-gray-600'}`}>{req.requirement}</span>
                        <span className="text-xs text-gray-400 ml-1">[{req.category}]</span>
                        {req.notes && <p className="text-xs text-gray-500 mt-0.5">{req.notes}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Tab: Vulnerabilities ──

  const renderVulnerabilities = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search CVE, title, product..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as VulnerabilitySeverity | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={vulnStatusFilter} onChange={(e) => setVulnStatusFilter(e.target.value as VulnerabilityStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="all">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="enisa_notified">ENISA Notified</option>
            <option value="investigating">Investigating</option>
            <option value="patched">Patched</option>
            <option value="disclosed">Disclosed</option>
          </select>
        </div>
        <button onClick={() => setShowVulnModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm whitespace-nowrap">
          <Plus className="w-4 h-4" /> Report Vulnerability
        </button>
      </div>

      {/* 24-hour ENISA Notification Tracker */}
      {vulnerabilities.filter(v => v.status === 'reported' || (v.status === 'enisa_notified' && !v.patchDate)).length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 flex items-center gap-2 mb-3">
            <Timer className="w-5 h-5" /> 24-Hour ENISA Notification Tracker
          </h4>
          <div className="space-y-2">
            {vulnerabilities.filter(v => v.status === 'reported' || v.status === 'enisa_notified').map(v => {
              const hrs = hoursRemaining(v.enisaDeadline);
              const overdue = hrs <= 0 && v.status === 'reported';
              return (
                <div key={v.id} className={`flex items-center justify-between p-3 rounded border ${overdue ? 'bg-red-50 border-red-300' : 'bg-white border-orange-200'}`}>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{v.cveId} - {v.title}</p>
                    <p className="text-xs text-gray-500">{v.productName} | {v.severity.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {v.status === 'reported' ? (
                      <>
                        <span className={`text-sm font-medium ${overdue ? 'text-red-700' : hrs < 6 ? 'text-orange-700' : 'text-gray-700'}`}>
                          {overdue ? 'OVERDUE' : `${hrs.toFixed(1)}h remaining`}
                        </span>
                        <button onClick={() => handleNotifyENISA(v.id)}
                          className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Notify ENISA
                        </button>
                      </>
                    ) : (
                      <span className="text-sm text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Notified {formatDate(v.enisaNotifiedDate)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vulnerability List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">CVE ID</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Title</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Product</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">{t('common.severity')}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Reported</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVulnerabilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No vulnerabilities match your filters.</td>
                </tr>
              ) : filteredVulnerabilities.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-blue-700">{v.cveId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                    {v.title}
                    {v.isActivelyExploited && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded font-medium">EXPLOITED</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{v.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColor(v.severity)}`}>{v.severity.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${vulnStatusColor(v.status)}`}>{v.status.replace('_', ' ').toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(v.reportedDate)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelectedVuln(v); setShowDetailModal(true); }}
                      className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Tab: Security Updates ──

  const renderUpdates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Security Update Pipeline</h3>
        <button onClick={() => setShowUpdateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Schedule Update
        </button>
      </div>

      {/* Update Pipeline Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['planned', 'in_development', 'testing', 'released'] as UpdateStatus[]).map(status => {
          const statusUpdates = updates.filter(u => u.status === status);
          return (
            <div key={status} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700 text-sm uppercase">{status.replace('_', ' ')}</h4>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{statusUpdates.length}</span>
              </div>
              <div className="space-y-3">
                {statusUpdates.map(upd => (
                  <div key={upd.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900 text-sm">{upd.productName}</p>
                    <p className="text-xs text-gray-500">v{upd.version}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {upd.releaseDate ? `Released: ${formatDate(upd.releaseDate)}` : `Planned: ${formatDate(upd.plannedDate)}`}
                    </p>
                    {upd.vulnerabilitiesFixed.length > 0 && (
                      <p className="text-xs text-red-600 mt-1">{upd.vulnerabilitiesFixed.length} vuln{upd.vulnerabilitiesFixed.length > 1 ? 's' : ''} fixed</p>
                    )}
                  </div>
                ))}
                {statusUpdates.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">None</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Update Details Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">All Security Updates</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Product</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Version</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Planned Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Vulns Fixed</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Free</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Auto-Update</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {updates.map(upd => (
                <tr key={upd.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{upd.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">v{upd.version}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${updateStatusColor(upd.status)}`}>
                      {upd.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(upd.plannedDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{upd.vulnerabilitiesFixed.length}</td>
                  <td className="px-4 py-3">
                    {upd.isFreeOfCharge ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                  </td>
                  <td className="px-4 py-3">
                    {upd.autoUpdateEnabled ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{upd.supportDuration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRA Update Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">CRA Security Update Requirements</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> Security updates must be provided free of charge for the expected product lifetime</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> Security updates shall be separated from functionality updates where possible</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> Automatic update mechanisms must be enabled by default</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> Updates must be accompanied by advisory information about fixed vulnerabilities</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> A minimum support period of 5 years from placing on the market</li>
        </ul>
      </div>
    </div>
  );

  // ── Tab: Compliance Timeline ──

  const renderTimeline = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">CRA Implementation Timeline</h3>
        <p className="text-sm text-gray-600 mb-6">Key dates and milestones for EU Cyber Resilience Act compliance. The regulation entered into force on 10 December 2024 with a phased implementation.</p>

        {/* Countdown Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Full Application Deadline</h4>
              <p className="text-indigo-200">11 September 2026 - All CRA obligations take effect</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{daysUntilDeadline}</p>
              <p className="text-indigo-200">days remaining</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-indigo-800 rounded-full h-3">
              <div className="bg-white rounded-full h-3" style={{ width: `${Math.max(0, Math.min(100, ((365 * 2 - daysUntilDeadline) / (365 * 2)) * 100))}%` }} />
            </div>
          </div>
        </div>

        {/* Timeline Events */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          {timeline.map((event, idx) => (
            <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                event.status === 'completed' ? 'bg-green-100' :
                event.status === 'active' ? 'bg-blue-100' :
                event.status === 'overdue' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {event.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                 event.status === 'active' ? <Clock className="w-6 h-6 text-blue-600" /> :
                 event.status === 'overdue' ? <AlertTriangle className="w-6 h-6 text-red-600" /> :
                 <Calendar className="w-6 h-6 text-gray-400" />}
              </div>
              <div className={`flex-1 p-4 rounded-lg border ${
                event.status === 'completed' ? 'bg-green-50 border-green-200' :
                event.status === 'active' ? 'bg-blue-50 border-blue-200' :
                event.status === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    event.type === 'deadline' ? 'bg-red-100 text-red-800' :
                    event.type === 'obligation' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>{event.type.toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
                <p className="text-xs text-gray-500 mt-2">{formatDate(event.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Checklist */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CRA Readiness Checklist</h3>
        <div className="space-y-3">
          {[
            { label: 'Product inventory completed with CRA classification', done: true },
            { label: 'Security requirements identified per product category', done: true },
            { label: 'Vulnerability handling process established', done: true },
            { label: 'SBOM generation automated for all products', done: false },
            { label: 'Coordinated vulnerability disclosure policy published', done: true },
            { label: 'ENISA notification process tested (24hr SLA)', done: true },
            { label: 'Conformity assessment procedures selected per category', done: false },
            { label: 'Technical documentation prepared', done: false },
            { label: 'EU Declaration of Conformity drafted', done: false },
            { label: 'CE marking process ready for all products', done: false },
            { label: 'Support period commitments documented', done: true },
            { label: 'Import/distribution chain obligations verified', done: false },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={item.done} readOnly className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className={`text-sm ${item.done ? 'text-gray-900 line-through' : 'text-gray-700'}`}>{item.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Overall Readiness</span>
            <span className="font-bold text-gray-900">50%</span>
          </div>
          {renderScoreBar(50)}
        </div>
      </div>
    </div>
  );

  // ── Main Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('euRegulations.eucra')}</h2>
          <p className="text-gray-600 mt-1">Manage product security compliance with Regulation (EU) 2024/2847</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> {t('common.export')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'vulnerabilities' && renderVulnerabilities()}
      {activeTab === 'updates' && renderUpdates()}
      {activeTab === 'timeline' && renderTimeline()}

      {/* ── Add Product Modal ── */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add Digital Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')} *</label>
                <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                  <input type="text" required value={productForm.version} onChange={(e) => setProductForm({ ...productForm, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="default">Default</option>
                    <option value="class_i">Class I (Annex III)</option>
                    <option value="class_ii">Class II (Annex IV)</option>
                    <option value="critical">Critical (Annex V)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
                <input type="text" required value={productForm.manufacturer} onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Contact</label>
                <input type="text" value={productForm.contactInfo} onChange={(e) => setProductForm({ ...productForm, contactInfo: e.target.value })}
                  placeholder="security@company.eu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={productForm.hasDigitalElements} onChange={(e) => setProductForm({ ...productForm, hasDigitalElements: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Product with digital elements</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Product</button>
                <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Report Vulnerability Modal ── */}
      {showVulnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Report Vulnerability</h3>
              <button onClick={() => setShowVulnModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReportVulnerability} className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                <strong>CRA Article 14:</strong> Actively exploited vulnerabilities must be notified to ENISA within 24 hours of awareness.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Product *</label>
                <select required value={vulnForm.productId} onChange={(e) => setVulnForm({ ...vulnForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVE ID</label>
                  <input type="text" value={vulnForm.cveId} onChange={(e) => setVulnForm({ ...vulnForm, cveId: e.target.value })}
                    placeholder="CVE-2026-XXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.severity')} *</label>
                  <select required value={vulnForm.severity} onChange={(e) => setVulnForm({ ...vulnForm, severity: e.target.value as VulnerabilitySeverity })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={vulnForm.title} onChange={(e) => setVulnForm({ ...vulnForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required value={vulnForm.description} onChange={(e) => setVulnForm({ ...vulnForm, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                <input type="text" value={vulnForm.reporter} onChange={(e) => setVulnForm({ ...vulnForm, reporter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={vulnForm.isActivelyExploited} onChange={(e) => setVulnForm({ ...vulnForm, isActivelyExploited: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-red-700 font-medium">Actively exploited (triggers 24hr ENISA notification)</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Report Vulnerability</button>
                <button type="button" onClick={() => setShowVulnModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Product / Vulnerability Detail Modal ── */}
      {showDetailModal && (selectedProduct || selectedVuln) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedProduct ? `Product: ${selectedProduct.name}` : `Vulnerability: ${selectedVuln?.cveId}`}
              </h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedProduct(null); setSelectedVuln(null); }}
                className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedProduct && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-700">Category</label><p className="text-gray-900 mt-1">{categoryLabel(selectedProduct.category)}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Compliance Score</label><p className="text-gray-900 mt-1">{selectedProduct.complianceScore}%</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Manufacturer</label><p className="text-gray-900 mt-1">{selectedProduct.manufacturer}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Version</label><p className="text-gray-900 mt-1">{selectedProduct.version}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">{t('euRegulations.ceMarking')}</label><p className="text-gray-900 mt-1">{selectedProduct.ceMarking ? 'Yes' : 'No'}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">SBOM Available</label><p className="text-gray-900 mt-1">{selectedProduct.sbomAvailable ? 'Yes' : 'No'}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Support Until</label><p className="text-gray-900 mt-1">{formatDate(selectedProduct.supportEndDate)}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Security Contact</label><p className="text-gray-900 mt-1">{selectedProduct.contactInfo}</p></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700">Description</label><p className="text-gray-900 mt-1">{selectedProduct.description}</p></div>
                </>
              )}
              {selectedVuln && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-700">CVE ID</label><p className="text-gray-900 mt-1 font-mono">{selectedVuln.cveId}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Severity</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColor(selectedVuln.severity)}`}>{selectedVuln.severity.toUpperCase()}</span></p></div>
                    <div><label className="text-sm font-medium text-gray-700">Product</label><p className="text-gray-900 mt-1">{selectedVuln.productName}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Status</label><p className="mt-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${vulnStatusColor(selectedVuln.status)}`}>{selectedVuln.status.replace('_', ' ').toUpperCase()}</span></p></div>
                    <div><label className="text-sm font-medium text-gray-700">Reported</label><p className="text-gray-900 mt-1">{formatDate(selectedVuln.reportedDate)}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">ENISA Notified</label><p className="text-gray-900 mt-1">{selectedVuln.enisaNotifiedDate ? formatDate(selectedVuln.enisaNotifiedDate) : 'Pending'}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Patch Date</label><p className="text-gray-900 mt-1">{formatDate(selectedVuln.patchDate)}</p></div>
                    <div><label className="text-sm font-medium text-gray-700">Reporter</label><p className="text-gray-900 mt-1">{selectedVuln.reporter}</p></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700">Description</label><p className="text-gray-900 mt-1">{selectedVuln.description}</p></div>
                  {selectedVuln.isActivelyExploited && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800">This vulnerability is actively exploited in the wild.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
