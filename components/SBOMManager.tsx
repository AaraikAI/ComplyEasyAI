import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';
import {
  ArrowLeft, Search, Plus, Download, Upload, Eye, Edit3, Trash2,
  AlertTriangle, ShieldAlert, ShieldCheck, Shield, CheckCircle, XCircle,
  Clock, Globe, FileText, Package, GitBranch, Loader2, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, Filter, Copy, BarChart3,
  Activity, Zap, Lock, Unlock, AlertOctagon, Bell, BookOpen, Archive,
  Server, Code, Box, Layers, Link, Tag, Hash, Info, Settings,
  TrendingUp, TrendingDown, Minus, GitMerge, FolderTree, Bug,
  Scale, Database, Cpu, X, Sparkles, Brain,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SBOMFormat = 'CycloneDX' | 'SPDX';
type VulnerabilitySeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
type LicenseRisk = 'High' | 'Medium' | 'Low' | 'None';
type ComponentType = 'library' | 'framework' | 'application' | 'operating-system' | 'device' | 'firmware';
type MainTab = 'overview' | 'components' | 'vulnerabilities' | 'licenses' | 'repositories' | 'reports';

interface SBOMComponent {
  id: string;
  name: string;
  version: string;
  latestVersion: string;
  type: ComponentType;
  supplier: string;
  license: string;
  licenseRisk: LicenseRisk;
  purl: string;
  cpe: string;
  directDependency: boolean;
  dependencyDepth: number;
  vulnerabilities: number;
  criticalVulns: number;
  highVulns: number;
  lastUpdated: string;
  size: string;
  hash: string;
}

interface Vulnerability {
  id: string;
  cveId: string;
  componentId: string;
  componentName: string;
  componentVersion: string;
  severity: VulnerabilitySeverity;
  cvssScore: number;
  cvssVector: string;
  description: string;
  publishedDate: string;
  modifiedDate: string;
  fixAvailable: boolean;
  fixVersion: string;
  exploitAvailable: boolean;
  status: 'open' | 'in_progress' | 'mitigated' | 'accepted' | 'false_positive';
  affectedProducts: string[];
  references: string[];
}

interface LicenseInfo {
  id: string;
  spdxId: string;
  name: string;
  category: 'Permissive' | 'Copyleft' | 'Weak Copyleft' | 'Proprietary' | 'Public Domain';
  risk: LicenseRisk;
  componentCount: number;
  obligations: string[];
  compatible: boolean;
  notes: string;
}

interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  lastScan: string;
  nextScan: string;
  totalComponents: number;
  vulnerabilities: number;
  status: 'healthy' | 'warning' | 'critical' | 'scanning' | 'error';
  sbomFormat: SBOMFormat;
  autoScan: boolean;
}

interface SBOMReport {
  id: string;
  name: string;
  generatedDate: string;
  format: SBOMFormat;
  version: string;
  componentCount: number;
  vulnerabilityCount: number;
  licenseCount: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'partial';
  craCompliant: boolean;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------
const DEMO_COMPONENTS: SBOMComponent[] = [
  { id: 'C001', name: 'react', version: '18.2.0', latestVersion: '18.3.1', type: 'library', supplier: 'Meta', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/react@18.2.0', cpe: 'cpe:2.3:a:facebook:react:18.2.0', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-06-15', size: '2.5 MB', hash: 'sha256:a1b2c3d4e5f6' },
  { id: 'C002', name: 'express', version: '4.18.2', latestVersion: '4.19.2', type: 'framework', supplier: 'OpenJS Foundation', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/express@4.18.2', cpe: 'cpe:2.3:a:expressjs:express:4.18.2', directDependency: true, dependencyDepth: 0, vulnerabilities: 1, criticalVulns: 0, highVulns: 1, lastUpdated: '2024-03-20', size: '1.8 MB', hash: 'sha256:b2c3d4e5f6a7' },
  { id: 'C003', name: 'lodash', version: '4.17.21', latestVersion: '4.17.21', type: 'library', supplier: 'Lodash', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/lodash@4.17.21', cpe: 'cpe:2.3:a:lodash:lodash:4.17.21', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2023-02-01', size: '1.4 MB', hash: 'sha256:c3d4e5f6a7b8' },
  { id: 'C004', name: 'jsonwebtoken', version: '9.0.0', latestVersion: '9.0.2', type: 'library', supplier: 'Auth0', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/jsonwebtoken@9.0.0', cpe: 'cpe:2.3:a:auth0:jsonwebtoken:9.0.0', directDependency: true, dependencyDepth: 0, vulnerabilities: 2, criticalVulns: 1, highVulns: 1, lastUpdated: '2023-06-15', size: '0.3 MB', hash: 'sha256:d4e5f6a7b8c9' },
  { id: 'C005', name: 'axios', version: '1.6.0', latestVersion: '1.7.2', type: 'library', supplier: 'Axios', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/axios@1.6.0', cpe: 'cpe:2.3:a:axios:axios:1.6.0', directDependency: true, dependencyDepth: 0, vulnerabilities: 1, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-01-10', size: '0.5 MB', hash: 'sha256:e5f6a7b8c9d0' },
  { id: 'C006', name: 'pg', version: '8.11.3', latestVersion: '8.12.0', type: 'library', supplier: 'Brian Carlson', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/pg@8.11.3', cpe: 'cpe:2.3:a:node-postgres:pg:8.11.3', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-02-18', size: '0.8 MB', hash: 'sha256:f6a7b8c9d0e1' },
  { id: 'C007', name: 'openssl', version: '3.1.4', latestVersion: '3.2.1', type: 'library', supplier: 'OpenSSL Project', license: 'Apache-2.0', licenseRisk: 'None', purl: 'pkg:generic/openssl@3.1.4', cpe: 'cpe:2.3:a:openssl:openssl:3.1.4', directDependency: false, dependencyDepth: 2, vulnerabilities: 3, criticalVulns: 1, highVulns: 2, lastUpdated: '2024-01-30', size: '15.2 MB', hash: 'sha256:a7b8c9d0e1f2' },
  { id: 'C008', name: 'winston', version: '3.11.0', latestVersion: '3.13.0', type: 'library', supplier: 'winstonjs', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/winston@3.11.0', cpe: 'cpe:2.3:a:winstonjs:winston:3.11.0', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-04-22', size: '0.6 MB', hash: 'sha256:b8c9d0e1f2a3' },
  { id: 'C009', name: 'redis', version: '4.6.10', latestVersion: '4.6.13', type: 'library', supplier: 'Redis Ltd', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/redis@4.6.10', cpe: 'cpe:2.3:a:redis:node-redis:4.6.10', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-03-01', size: '0.4 MB', hash: 'sha256:c9d0e1f2a3b4' },
  { id: 'C010', name: 'ffmpeg', version: '6.0', latestVersion: '6.1.1', type: 'application', supplier: 'FFmpeg', license: 'LGPL-2.1', licenseRisk: 'Medium', purl: 'pkg:generic/ffmpeg@6.0', cpe: 'cpe:2.3:a:ffmpeg:ffmpeg:6.0', directDependency: false, dependencyDepth: 1, vulnerabilities: 5, criticalVulns: 2, highVulns: 2, lastUpdated: '2024-01-05', size: '85.0 MB', hash: 'sha256:d0e1f2a3b4c5' },
  { id: 'C011', name: 'mysql2', version: '3.6.5', latestVersion: '3.9.4', type: 'library', supplier: 'sidorares', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/mysql2@3.6.5', cpe: 'cpe:2.3:a:mysql2:mysql2:3.6.5', directDependency: true, dependencyDepth: 0, vulnerabilities: 1, criticalVulns: 0, highVulns: 1, lastUpdated: '2024-02-28', size: '1.1 MB', hash: 'sha256:e1f2a3b4c5d6' },
  { id: 'C012', name: 'busboy', version: '1.6.0', latestVersion: '1.6.0', type: 'library', supplier: 'mscdex', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/busboy@1.6.0', cpe: 'cpe:2.3:a:busboy:busboy:1.6.0', directDependency: false, dependencyDepth: 1, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2023-12-15', size: '0.1 MB', hash: 'sha256:f2a3b4c5d6e7' },
  { id: 'C013', name: 'sharp', version: '0.33.2', latestVersion: '0.33.3', type: 'library', supplier: 'Lovell Fuller', license: 'Apache-2.0', licenseRisk: 'None', purl: 'pkg:npm/sharp@0.33.2', cpe: 'cpe:2.3:a:sharp:sharp:0.33.2', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-05-10', size: '25.3 MB', hash: 'sha256:a3b4c5d6e7f8' },
  { id: 'C014', name: 'libxml2', version: '2.11.5', latestVersion: '2.12.4', type: 'library', supplier: 'GNOME', license: 'MIT', licenseRisk: 'None', purl: 'pkg:generic/libxml2@2.11.5', cpe: 'cpe:2.3:a:xmlsoft:libxml2:2.11.5', directDependency: false, dependencyDepth: 3, vulnerabilities: 2, criticalVulns: 0, highVulns: 1, lastUpdated: '2024-01-20', size: '4.8 MB', hash: 'sha256:b4c5d6e7f8a9' },
  { id: 'C015', name: 'helmet', version: '7.1.0', latestVersion: '7.1.0', type: 'library', supplier: 'Adam Baldwin', license: 'MIT', licenseRisk: 'None', purl: 'pkg:npm/helmet@7.1.0', cpe: 'cpe:2.3:a:helmetjs:helmet:7.1.0', directDependency: true, dependencyDepth: 0, vulnerabilities: 0, criticalVulns: 0, highVulns: 0, lastUpdated: '2024-06-01', size: '0.2 MB', hash: 'sha256:c5d6e7f8a9b0' },
];

const DEMO_VULNERABILITIES: Vulnerability[] = [
  { id: 'V001', cveId: 'CVE-2024-29041', componentId: 'C002', componentName: 'express', componentVersion: '4.18.2', severity: 'High', cvssScore: 7.5, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N', description: 'Open redirect vulnerability in express before 4.19.2. Attackers can exploit URL handling to redirect users to malicious sites.', publishedDate: '2024-03-25', modifiedDate: '2024-04-01', fixAvailable: true, fixVersion: '4.19.2', exploitAvailable: false, status: 'open', affectedProducts: ['WebApp v2.1', 'API Server v3.0'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-29041'] },
  { id: 'V002', cveId: 'CVE-2024-33883', componentId: 'C004', componentName: 'jsonwebtoken', componentVersion: '9.0.0', severity: 'Critical', cvssScore: 9.8, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', description: 'Algorithm confusion vulnerability in jsonwebtoken allows attackers to forge tokens by exploiting key type confusion.', publishedDate: '2024-05-10', modifiedDate: '2024-05-15', fixAvailable: true, fixVersion: '9.0.2', exploitAvailable: true, status: 'in_progress', affectedProducts: ['Auth Service v1.5', 'WebApp v2.1'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-33883'] },
  { id: 'V003', cveId: 'CVE-2024-28849', componentId: 'C004', componentName: 'jsonwebtoken', componentVersion: '9.0.0', severity: 'High', cvssScore: 7.8, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N', description: 'Timing attack vulnerability in token verification allows extraction of secret key through repeated requests.', publishedDate: '2024-03-15', modifiedDate: '2024-03-20', fixAvailable: true, fixVersion: '9.0.1', exploitAvailable: false, status: 'open', affectedProducts: ['Auth Service v1.5'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-28849'] },
  { id: 'V004', cveId: 'CVE-2023-45853', componentId: 'C005', componentName: 'axios', componentVersion: '1.6.0', severity: 'Medium', cvssScore: 5.3, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', description: 'Server-Side Request Forgery in axios when following redirects allows access to internal network resources.', publishedDate: '2023-12-01', modifiedDate: '2024-01-10', fixAvailable: true, fixVersion: '1.6.2', exploitAvailable: false, status: 'mitigated', affectedProducts: ['WebApp v2.1', 'Data Pipeline v1.0'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-45853'] },
  { id: 'V005', cveId: 'CVE-2024-0727', componentId: 'C007', componentName: 'openssl', componentVersion: '3.1.4', severity: 'Critical', cvssScore: 9.1, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N', description: 'Buffer overflow in PKCS12 parsing could allow remote code execution.', publishedDate: '2024-01-15', modifiedDate: '2024-02-01', fixAvailable: true, fixVersion: '3.2.1', exploitAvailable: true, status: 'open', affectedProducts: ['All Products'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-0727'] },
  { id: 'V006', cveId: 'CVE-2024-0553', componentId: 'C007', componentName: 'openssl', componentVersion: '3.1.4', severity: 'High', cvssScore: 7.5, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', description: 'Timing side-channel in RSA implementation leaks key information.', publishedDate: '2024-01-20', modifiedDate: '2024-02-05', fixAvailable: true, fixVersion: '3.1.5', exploitAvailable: false, status: 'open', affectedProducts: ['All Products'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-0553'] },
  { id: 'V007', cveId: 'CVE-2024-2511', componentId: 'C007', componentName: 'openssl', componentVersion: '3.1.4', severity: 'High', cvssScore: 7.5, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', description: 'Memory leak in TLS session handling can lead to denial of service.', publishedDate: '2024-03-10', modifiedDate: '2024-03-18', fixAvailable: true, fixVersion: '3.2.0', exploitAvailable: false, status: 'in_progress', affectedProducts: ['All Products'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-2511'] },
  { id: 'V008', cveId: 'CVE-2024-31497', componentId: 'C010', componentName: 'ffmpeg', componentVersion: '6.0', severity: 'Critical', cvssScore: 9.8, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', description: 'Heap buffer overflow in libavcodec allows remote code execution via crafted media files.', publishedDate: '2024-04-05', modifiedDate: '2024-04-12', fixAvailable: true, fixVersion: '6.1.1', exploitAvailable: true, status: 'open', affectedProducts: ['Media Service v1.2'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-31497'] },
  { id: 'V009', cveId: 'CVE-2024-32484', componentId: 'C010', componentName: 'ffmpeg', componentVersion: '6.0', severity: 'High', cvssScore: 8.1, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N', description: 'Use-after-free in subtitle rendering allows arbitrary code execution.', publishedDate: '2024-04-15', modifiedDate: '2024-04-20', fixAvailable: true, fixVersion: '6.1', exploitAvailable: false, status: 'open', affectedProducts: ['Media Service v1.2'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-32484'] },
  { id: 'V010', cveId: 'CVE-2024-21626', componentId: 'C010', componentName: 'ffmpeg', componentVersion: '6.0', severity: 'Medium', cvssScore: 5.5, cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H', description: 'Integer overflow in AVI demuxer causes crash on specially crafted files.', publishedDate: '2024-02-20', modifiedDate: '2024-03-01', fixAvailable: true, fixVersion: '6.0.1', exploitAvailable: false, status: 'accepted', affectedProducts: ['Media Service v1.2'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-21626'] },
  { id: 'V011', cveId: 'CVE-2024-21096', componentId: 'C011', componentName: 'mysql2', componentVersion: '3.6.5', severity: 'High', cvssScore: 7.2, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H', description: 'SQL injection through parameter manipulation in prepared statements.', publishedDate: '2024-04-16', modifiedDate: '2024-04-25', fixAvailable: true, fixVersion: '3.9.0', exploitAvailable: false, status: 'open', affectedProducts: ['Data Service v2.0'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-21096'] },
  { id: 'V012', cveId: 'CVE-2024-25062', componentId: 'C014', componentName: 'libxml2', componentVersion: '2.11.5', severity: 'High', cvssScore: 7.5, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', description: 'Use-after-free in xmlValidatePopElement causes denial of service.', publishedDate: '2024-02-04', modifiedDate: '2024-02-15', fixAvailable: true, fixVersion: '2.12.0', exploitAvailable: false, status: 'open', affectedProducts: ['Document Processor v1.1'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-25062'] },
  { id: 'V013', cveId: 'CVE-2024-34459', componentId: 'C014', componentName: 'libxml2', componentVersion: '2.11.5', severity: 'Medium', cvssScore: 5.9, cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H', description: 'Stack-based buffer overflow in DTD validation with deeply nested entities.', publishedDate: '2024-05-01', modifiedDate: '2024-05-08', fixAvailable: true, fixVersion: '2.12.4', exploitAvailable: false, status: 'open', affectedProducts: ['Document Processor v1.1'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-34459'] },
  { id: 'V014', cveId: 'CVE-2024-32002', componentId: 'C010', componentName: 'ffmpeg', componentVersion: '6.0', severity: 'Medium', cvssScore: 6.5, cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:N/A:H', description: 'Null pointer dereference in MOV demuxer when processing truncated atoms.', publishedDate: '2024-04-22', modifiedDate: '2024-05-01', fixAvailable: true, fixVersion: '6.1', exploitAvailable: false, status: 'false_positive', affectedProducts: ['Media Service v1.2'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-32002'] },
  { id: 'V015', cveId: 'CVE-2024-33602', componentId: 'C010', componentName: 'ffmpeg', componentVersion: '6.0', severity: 'Low', cvssScore: 3.3, cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N', description: 'Information disclosure via error messages when processing invalid codec parameters.', publishedDate: '2024-05-05', modifiedDate: '2024-05-10', fixAvailable: false, fixVersion: '', exploitAvailable: false, status: 'accepted', affectedProducts: ['Media Service v1.2'], references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-33602'] },
];

const DEMO_LICENSES: LicenseInfo[] = [
  { id: 'L001', spdxId: 'MIT', name: 'MIT License', category: 'Permissive', risk: 'None', componentCount: 11, obligations: ['Include copyright notice', 'Include license text'], compatible: true, notes: 'Most permissive. No issues for commercial use.' },
  { id: 'L002', spdxId: 'Apache-2.0', name: 'Apache License 2.0', category: 'Permissive', risk: 'None', componentCount: 2, obligations: ['Include copyright notice', 'Include license text', 'State changes', 'Include NOTICE file'], compatible: true, notes: 'Patent grant included. Compatible with most other licenses.' },
  { id: 'L003', spdxId: 'LGPL-2.1', name: 'GNU Lesser General Public License v2.1', category: 'Weak Copyleft', risk: 'Medium', componentCount: 1, obligations: ['Provide source for LGPL components', 'Allow relinking', 'Include license text', 'State changes'], compatible: true, notes: 'Dynamic linking generally acceptable. Static linking may trigger copyleft.' },
  { id: 'L004', spdxId: 'GPL-3.0', name: 'GNU General Public License v3.0', category: 'Copyleft', risk: 'High', componentCount: 0, obligations: ['Provide complete source code', 'Include license text', 'State changes', 'No additional restrictions', 'Preserve installation information'], compatible: false, notes: 'Strong copyleft. May require full source disclosure of derivative works.' },
  { id: 'L005', spdxId: 'BSD-3-Clause', name: 'BSD 3-Clause License', category: 'Permissive', risk: 'None', componentCount: 0, obligations: ['Include copyright notice', 'Include license text'], compatible: true, notes: 'Very permissive. No endorsement clause.' },
  { id: 'L006', spdxId: 'ISC', name: 'ISC License', category: 'Permissive', risk: 'None', componentCount: 0, obligations: ['Include copyright notice'], compatible: true, notes: 'Functionally equivalent to MIT.' },
  { id: 'L007', spdxId: 'Proprietary', name: 'Proprietary License', category: 'Proprietary', risk: 'High', componentCount: 0, obligations: ['Comply with specific license terms', 'May require license fees', 'May restrict distribution'], compatible: false, notes: 'Requires careful review of specific terms.' },
];

const DEMO_REPOSITORIES: Repository[] = [
  { id: 'R001', name: 'webapp-frontend', url: 'https://github.com/org/webapp-frontend', branch: 'main', lastScan: '2026-02-15T10:30:00Z', nextScan: '2026-02-22T10:30:00Z', totalComponents: 245, vulnerabilities: 3, status: 'warning', sbomFormat: 'CycloneDX', autoScan: true },
  { id: 'R002', name: 'api-server', url: 'https://github.com/org/api-server', branch: 'main', lastScan: '2026-02-15T10:30:00Z', nextScan: '2026-02-22T10:30:00Z', totalComponents: 189, vulnerabilities: 8, status: 'critical', sbomFormat: 'CycloneDX', autoScan: true },
  { id: 'R003', name: 'auth-service', url: 'https://github.com/org/auth-service', branch: 'main', lastScan: '2026-02-14T08:00:00Z', nextScan: '2026-02-21T08:00:00Z', totalComponents: 92, vulnerabilities: 2, status: 'warning', sbomFormat: 'SPDX', autoScan: true },
  { id: 'R004', name: 'data-pipeline', url: 'https://github.com/org/data-pipeline', branch: 'main', lastScan: '2026-02-13T14:00:00Z', nextScan: '2026-02-20T14:00:00Z', totalComponents: 156, vulnerabilities: 0, status: 'healthy', sbomFormat: 'CycloneDX', autoScan: true },
  { id: 'R005', name: 'media-service', url: 'https://github.com/org/media-service', branch: 'develop', lastScan: '2026-02-12T16:00:00Z', nextScan: '2026-02-19T16:00:00Z', totalComponents: 78, vulnerabilities: 5, status: 'critical', sbomFormat: 'SPDX', autoScan: false },
];

const DEMO_REPORTS: SBOMReport[] = [
  { id: 'RPT001', name: 'Full SBOM - Q1 2026', generatedDate: '2026-02-15', format: 'CycloneDX', version: '1.5', componentCount: 760, vulnerabilityCount: 15, licenseCount: 7, complianceStatus: 'partial', craCompliant: false },
  { id: 'RPT002', name: 'API Server SBOM', generatedDate: '2026-02-10', format: 'CycloneDX', version: '1.5', componentCount: 189, vulnerabilityCount: 8, licenseCount: 4, complianceStatus: 'non_compliant', craCompliant: false },
  { id: 'RPT003', name: 'Frontend SBOM', generatedDate: '2026-02-08', format: 'SPDX', version: '2.3', componentCount: 245, vulnerabilityCount: 3, licenseCount: 3, complianceStatus: 'compliant', craCompliant: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const severityColor = (s: VulnerabilitySeverity) => {
  switch (s) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Low': return 'bg-green-100 text-green-800 border-green-300';
    case 'None': return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'open': case 'critical': case 'non_compliant': case 'error': return 'bg-red-100 text-red-800';
    case 'in_progress': case 'warning': case 'partial': case 'scanning': return 'bg-yellow-100 text-yellow-800';
    case 'mitigated': case 'healthy': case 'compliant': return 'bg-green-100 text-green-800';
    case 'accepted': case 'false_positive': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const licenseRiskColor = (r: LicenseRisk) => {
  switch (r) {
    case 'High': return 'bg-red-100 text-red-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-blue-100 text-blue-800';
    case 'None': return 'bg-green-100 text-green-800';
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface SBOMManagerProps {
  onBack: () => void;
}

export const SBOMManager: React.FC<SBOMManagerProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [componentSearch, setComponentSearch] = useState('');
  const [vulnSearch, setVulnSearch] = useState('');
  const [vulnSeverityFilter, setVulnSeverityFilter] = useState<string>('All');
  const [vulnStatusFilter, setVulnStatusFilter] = useState<string>('All');
  const [componentTypeFilter, setComponentTypeFilter] = useState<string>('All');
  const [selectedComponent, setSelectedComponent] = useState<SBOMComponent | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<SBOMFormat>('CycloneDX');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State variables backed by DEMO data as fallback
  const [components, setComponents] = useState<SBOMComponent[]>(DEMO_COMPONENTS);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(DEMO_VULNERABILITIES);
  const [licenses, setLicenses] = useState<LicenseInfo[]>(DEMO_LICENSES);
  const [repositories, setRepositories] = useState<Repository[]>(DEMO_REPOSITORIES);
  const [reports, setReports] = useState<SBOMReport[]>(DEMO_REPORTS);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [entries, repos] = await Promise.all([
        api.modules.sbom.listEntries(),
        api.modules.sbom.listRepositories(),
      ]);
      // The backend returns entries that contain components, vulnerabilities,
      // licenses, and reports in a unified list. If the API returns structured
      // data, map it accordingly. Fall back to DEMO data when the response is
      // empty or missing fields.
      if (Array.isArray(entries) && entries.length > 0) {
        // entries may contain components, vulnerabilities, licenses, reports
        // depending on backend shape. Accept arrays at known keys or at root.
        const comps: SBOMComponent[] = entries.filter((e: any) => e.type === 'component' || e.purl).length > 0
          ? entries.filter((e: any) => e.type === 'component' || e.purl) as SBOMComponent[]
          : (entries as any).components ?? DEMO_COMPONENTS;
        const vulns: Vulnerability[] = (entries as any).vulnerabilities ?? entries.filter((e: any) => e.cveId).length > 0
          ? entries.filter((e: any) => e.cveId) as Vulnerability[]
          : DEMO_VULNERABILITIES;
        const lics: LicenseInfo[] = (entries as any).licenses ?? entries.filter((e: any) => e.spdxId).length > 0
          ? entries.filter((e: any) => e.spdxId) as LicenseInfo[]
          : DEMO_LICENSES;
        const rpts: SBOMReport[] = (entries as any).reports ?? entries.filter((e: any) => e.complianceStatus).length > 0
          ? entries.filter((e: any) => e.complianceStatus) as SBOMReport[]
          : DEMO_REPORTS;
        setComponents(comps.length > 0 ? comps : DEMO_COMPONENTS);
        setVulnerabilities(vulns.length > 0 ? vulns : DEMO_VULNERABILITIES);
        setLicenses(lics.length > 0 ? lics : DEMO_LICENSES);
        setReports(rpts.length > 0 ? rpts : DEMO_REPORTS);
      }
      if (Array.isArray(repos) && repos.length > 0) {
        setRepositories(repos as Repository[]);
      }
    } catch (err: any) {
      setLoadError('Unable to connect to server. Showing demo data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Summary stats
  const totalComponents = components.length;
  const totalVulns = vulnerabilities.length;
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'Critical').length;
  const highVulns = vulnerabilities.filter(v => v.severity === 'High').length;
  const outdatedComponents = components.filter(c => c.version !== c.latestVersion).length;
  const licenseIssues = licenses.filter(l => l.risk === 'High' || l.risk === 'Medium').length;

  const filteredComponents = useMemo(() =>
    components.filter(c =>
      (c.name.toLowerCase().includes(componentSearch.toLowerCase()) || c.supplier.toLowerCase().includes(componentSearch.toLowerCase())) &&
      (componentTypeFilter === 'All' || c.type === componentTypeFilter)
    ), [components, componentSearch, componentTypeFilter]);

  const filteredVulns = useMemo(() =>
    vulnerabilities.filter(v =>
      (v.cveId.toLowerCase().includes(vulnSearch.toLowerCase()) || v.componentName.toLowerCase().includes(vulnSearch.toLowerCase()) || v.description.toLowerCase().includes(vulnSearch.toLowerCase())) &&
      (vulnSeverityFilter === 'All' || v.severity === vulnSeverityFilter) &&
      (vulnStatusFilter === 'All' || v.status === vulnStatusFilter)
    ), [vulnerabilities, vulnSearch, vulnSeverityFilter, vulnStatusFilter]);

  const runScan = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsScanning(false); loadData(); return 100; }
        return prev + Math.random() * 15;
      });
    }, 500);
  }, [loadData]);

  const [previewReport, setPreviewReport] = useState<SBOMReport | null>(null);

  const buildReportData = useCallback((rpt: SBOMReport) => ({
    bomFormat: rpt.format,
    specVersion: rpt.version,
    metadata: { timestamp: rpt.generatedDate, component: { name: rpt.name } },
    components: components.map(c => ({ type: c.type, name: c.name, version: c.version, purl: c.purl, license: c.license, supplier: c.supplier })),
    vulnerabilities: vulnerabilities.map(v => ({ id: v.cveId, source: { name: 'NVD' }, ratings: [{ score: v.cvssScore, severity: v.severity }], description: v.description })),
  }), [components, vulnerabilities]);

  const downloadReport = useCallback((rpt: SBOMReport, format: 'json' | 'xml') => {
    const data = buildReportData(rpt);
    let blob: Blob;
    let ext: string;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      ext = 'json';
    } else {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<bom xmlns="http://cyclonedx.org/schema/bom/1.5" version="1">\n  <metadata><timestamp>${data.metadata.timestamp}</timestamp></metadata>\n  <components>\n${data.components.map(c => `    <component type="${c.type}"><name>${c.name}</name><version>${c.version}</version><purl>${c.purl}</purl></component>`).join('\n')}\n  </components>\n  <vulnerabilities>\n${data.vulnerabilities.map(v => `    <vulnerability ref="${v.id}"><description>${v.description}</description></vulnerability>`).join('\n')}\n  </vulnerabilities>\n</bom>`;
      blob = new Blob([xmlContent], { type: 'application/xml' });
      ext = 'xml';
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rpt.name.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildReportData]);

  const generateReport = useCallback(() => {
    const newReport: SBOMReport = {
      id: `RPT-${Date.now()}`,
      name: `${selectedFormat} Report ${new Date().toISOString().split('T')[0]}`,
      generatedDate: new Date().toISOString().split('T')[0],
      format: selectedFormat,
      version: selectedFormat === 'CycloneDX' ? '1.5' : '2.3',
      componentCount: components.length,
      vulnerabilityCount: vulnerabilities.length,
      licenseCount: licenses.length,
      complianceStatus: criticalVulns === 0 && licenseIssues === 0 ? 'compliant' : licenseIssues > 0 ? 'partial' : 'non_compliant',
      craCompliant: criticalVulns === 0 && highVulns === 0,
    };
    setReports(prev => [newReport, ...prev]);
  }, [selectedFormat, components, vulnerabilities, licenses, criticalVulns, highVulns, licenseIssues]);

  // --- CRUD handlers wired to backend API ---
  const updateVulnStatus = useCallback(async (vulnId: string, newStatus: Vulnerability['status']) => {
    try {
      await api.modules.sbom.updateEntry(vulnId, { status: newStatus });
      setVulnerabilities(prev => prev.map(v => v.id === vulnId ? { ...v, status: newStatus } : v));
      setSelectedVuln(prev => prev && prev.id === vulnId ? { ...prev, status: newStatus } : prev);
    } catch {
      // Optimistic update even on failure so the UI stays responsive with demo data
      setVulnerabilities(prev => prev.map(v => v.id === vulnId ? { ...v, status: newStatus } : v));
      setSelectedVuln(prev => prev && prev.id === vulnId ? { ...prev, status: newStatus } : prev);
    }
  }, []);

  const deleteRepository = useCallback(async (repoId: string) => {
    try {
      await api.modules.sbom.deleteRepository(repoId);
    } catch {
      // proceed with optimistic removal
    }
    setRepositories(prev => prev.filter(r => r.id !== repoId));
  }, []);

  const createRepository = useCallback(async (data: Partial<Repository>) => {
    try {
      const created = await api.modules.sbom.createRepository(data);
      if (created && created.id) {
        setRepositories(prev => [...prev, created as Repository]);
        return;
      }
    } catch {
      // fallback: add locally with temp id
    }
    const tempRepo: Repository = {
      id: `R${Date.now()}`,
      name: data.name ?? 'New Repository',
      url: data.url ?? '',
      branch: data.branch ?? 'main',
      lastScan: new Date().toISOString(),
      nextScan: new Date(Date.now() + 7 * 86400000).toISOString(),
      totalComponents: 0,
      vulnerabilities: 0,
      status: 'healthy',
      sbomFormat: data.sbomFormat ?? 'CycloneDX',
      autoScan: data.autoScan ?? true,
    };
    setRepositories(prev => [...prev, tempRepo]);
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      await api.modules.sbom.deleteEntry(entryId);
    } catch {
      // proceed with optimistic removal
    }
    setComponents(prev => prev.filter(c => c.id !== entryId));
    setVulnerabilities(prev => prev.filter(v => v.componentId !== entryId));
  }, []);

  // ---------------------------------------------------------------------------
  // Tab Renderers
  // ---------------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <Package className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalComponents}</div>
          <div className="text-xs text-gray-500">{t('common.total')} Components</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <Bug className="w-5 h-5 text-red-600 mb-2" />
          <div className="text-2xl font-bold text-red-700">{totalVulns}</div>
          <div className="text-xs text-gray-500">Vulnerabilities</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <AlertOctagon className="w-5 h-5 text-red-600 mb-2" />
          <div className="text-2xl font-bold text-red-700">{criticalVulns}</div>
          <div className="text-xs text-gray-500">Critical CVEs</div>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-orange-700">{highVulns}</div>
          <div className="text-xs text-gray-500">High CVEs</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4">
          <TrendingUp className="w-5 h-5 text-yellow-600 mb-2" />
          <div className="text-2xl font-bold text-yellow-700">{outdatedComponents}</div>
          <div className="text-xs text-gray-500">Outdated</div>
        </div>
        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <Scale className="w-5 h-5 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-purple-700">{licenseIssues}</div>
          <div className="text-xs text-gray-500">License Issues</div>
        </div>
      </div>

      {/* CRA Compliance Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">EU Cyber Resilience Act - SBOM Requirement</h3>
            <p className="text-sm text-blue-700 mb-3">
              Mandatory SBOM generation and maintenance required by <strong>September 2026</strong>. All products with digital elements
              must include machine-readable SBOMs in CycloneDX or SPDX format.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-blue-200 rounded-full">
                  <div className="w-2/3 h-2 bg-blue-600 rounded-full" />
                </div>
                <span className="text-sm font-medium text-blue-800">67% Ready</span>
              </div>
              <span className="text-xs text-blue-600">~7 months until deadline</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vulnerabilities */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Critical & High Vulnerabilities</h3>
            <button onClick={() => setActiveTab('vulnerabilities')} className="text-xs text-blue-600 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {vulnerabilities.filter(v => v.severity === 'Critical' || v.severity === 'High').slice(0, 5).map(v => (
              <div key={v.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-medium text-gray-900">{v.cveId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${severityColor(v.severity)}`}>{v.severity}</span>
                </div>
                <div className="text-xs text-gray-500">{v.componentName}@{v.componentVersion} | CVSS: {v.cvssScore}</div>
                {v.exploitAvailable && <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700"><Zap className="w-3 h-3" />Exploit Available</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Repository Status */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Repository Health</h3>
            <button onClick={() => setActiveTab('repositories')} className="text-xs text-blue-600 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {repositories.map(repo => (
              <div key={repo.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm text-gray-900">{repo.name}</span>
                    <span className="text-xs text-gray-400">/{repo.branch}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(repo.status)}`}>{repo.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span><Package className="w-3 h-3 inline mr-1" />{repo.totalComponents} components</span>
                  <span><Bug className="w-3 h-3 inline mr-1" />{repo.vulnerabilities} vulns</span>
                  <span><Clock className="w-3 h-3 inline mr-1" />Scanned {formatDate(repo.lastScan)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Button */}
      <div className="flex items-center gap-4">
        <button onClick={runScan} disabled={isScanning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 font-medium">
          {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</> : <><RefreshCw className="w-4 h-4" />Run Full Scan</>}
        </button>
        <button onClick={() => setShowExportModal(true)}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2">
          <Download className="w-4 h-4" />{t('common.export')} SBOM
        </button>
        {isScanning && (
          <div className="flex-1">
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${Math.min(100, scanProgress)}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">{Math.min(100, Math.round(scanProgress))}% complete</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={componentSearch} onChange={e => setComponentSearch(e.target.value)}
            placeholder="Search components..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <select value={componentTypeFilter} onChange={e => setComponentTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option value="All">{t('common.all')} Types</option>
          <option value="library">Library</option>
          <option value="framework">Framework</option>
          <option value="application">Application</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Component</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">{t('common.version')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">{t('common.type')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">License</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Vulns</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Direct</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.map(comp => (
                <tr key={comp.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedComponent?.id === comp.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedComponent(selectedComponent?.id === comp.id ? null : comp)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{comp.name}</div>
                    <div className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{comp.purl}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{comp.version}</span>
                    {comp.version !== comp.latestVersion && (
                      <div className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                        <TrendingUp className="w-3 h-3" />{comp.latestVersion}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{comp.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{comp.supplier}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${licenseRiskColor(comp.licenseRisk)}`}>{comp.license}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {comp.vulnerabilities > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        {comp.criticalVulns > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">{comp.criticalVulns}C</span>}
                        {comp.highVulns > 0 && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">{comp.highVulns}H</span>}
                      </div>
                    ) : <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {comp.directDependency ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Direct</span> : <span className="text-xs text-gray-400">Depth {comp.dependencyDepth}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-gray-400 hover:text-blue-600 rounded"><Eye className="w-4 h-4" /></button>
                      <button className="p-1 text-gray-400 hover:text-blue-600 rounded"><ExternalLink className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Component Detail */}
      {selectedComponent && (
        <div className="bg-white border border-blue-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{selectedComponent.name}@{selectedComponent.version}</h3>
            <button onClick={() => setSelectedComponent(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><div className="text-xs text-gray-500">{t('common.type')}</div><div className="text-sm font-medium capitalize">{selectedComponent.type}</div></div>
            <div><div className="text-xs text-gray-500">Supplier</div><div className="text-sm font-medium">{selectedComponent.supplier}</div></div>
            <div><div className="text-xs text-gray-500">License</div><div className="text-sm font-medium">{selectedComponent.license}</div></div>
            <div><div className="text-xs text-gray-500">Size</div><div className="text-sm font-medium">{selectedComponent.size}</div></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><div className="text-xs text-gray-500">PURL</div><div className="text-xs font-mono text-gray-700 break-all">{selectedComponent.purl}</div></div>
            <div><div className="text-xs text-gray-500">CPE</div><div className="text-xs font-mono text-gray-700 break-all">{selectedComponent.cpe}</div></div>
            <div><div className="text-xs text-gray-500">Hash</div><div className="text-xs font-mono text-gray-700">{selectedComponent.hash}</div></div>
            <div><div className="text-xs text-gray-500">Last Updated</div><div className="text-sm font-medium">{formatDate(selectedComponent.lastUpdated)}</div></div>
          </div>
          {selectedComponent.vulnerabilities > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-1">Vulnerabilities ({selectedComponent.vulnerabilities})</div>
              <div className="space-y-1">
                {vulnerabilities.filter(v => v.componentId === selectedComponent.id).map(v => (
                  <div key={v.id} className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${severityColor(v.severity)}`}>{v.severity}</span>
                    <span className="font-mono">{v.cveId}</span>
                    <span className="text-gray-500">CVSS {v.cvssScore}</span>
                    {v.fixAvailable && <span className="text-green-600">Fix: {v.fixVersion}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderVulnerabilities = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={vulnSearch} onChange={e => setVulnSearch(e.target.value)}
            placeholder="Search by CVE, component, description..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <select value={vulnSeverityFilter} onChange={e => setVulnSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="All">{t('common.all')} Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={vulnStatusFilter} onChange={e => setVulnStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="All">{t('common.all')} {t('common.status')}</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="mitigated">Mitigated</option>
            <option value="accepted">Accepted</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Vulnerability Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['Critical', 'High', 'Medium', 'Low', 'None'] as VulnerabilitySeverity[]).map(sev => {
          const count = vulnerabilities.filter(v => v.severity === sev).length;
          return (
            <div key={sev} className={`p-3 rounded-lg border ${severityColor(sev)}`}>
              <div className="text-xl font-bold">{count}</div>
              <div className="text-xs">{sev}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredVulns.map(vuln => (
          <div key={vuln.id} className={`bg-white border rounded-lg overflow-hidden transition-all ${selectedVuln?.id === vuln.id ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="p-4 cursor-pointer" onClick={() => setSelectedVuln(selectedVuln?.id === vuln.id ? null : vuln)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${severityColor(vuln.severity)}`}>{vuln.severity}</span>
                  <span className="font-mono font-semibold text-gray-900">{vuln.cveId}</span>
                  <span className="text-sm text-gray-500">{vuln.componentName}@{vuln.componentVersion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(vuln.status)}`}>{vuln.status.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-gray-700">CVSS {vuln.cvssScore}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{vuln.description}</p>
              <div className="flex items-center gap-3 mt-2">
                {vuln.exploitAvailable && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700"><Zap className="w-3 h-3" />Exploit Known</span>}
                {vuln.fixAvailable && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Fix: {vuln.fixVersion}</span>}
                <span className="text-xs text-gray-400">Published {formatDate(vuln.publishedDate)}</span>
              </div>
            </div>
            {selectedVuln?.id === vuln.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">CVSS Vector</div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">{vuln.cvssVector}</code>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Affected Products</div>
                    <div className="flex flex-wrap gap-1">
                      {vuln.affectedProducts.map(p => <span key={p} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{p}</span>)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">References</div>
                    {vuln.references.map(r => <a key={r} href={r} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />{r.split('/').pop()}</a>)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateVulnStatus(vuln.id, 'in_progress')} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Mark In Progress</button>
                  <button onClick={() => updateVulnStatus(vuln.id, 'mitigated')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700">Mark Mitigated</button>
                  <button onClick={() => updateVulnStatus(vuln.id, 'accepted')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">Accept Risk</button>
                  <button onClick={() => updateVulnStatus(vuln.id, 'false_positive')} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50">False Positive</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderLicenses = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{licenses.filter(l => l.category === 'Permissive').length}</div>
          <div className="text-xs text-green-600">Permissive</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{licenses.filter(l => l.category === 'Weak Copyleft').length}</div>
          <div className="text-xs text-yellow-600">Weak Copyleft</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{licenses.filter(l => l.category === 'Copyleft').length}</div>
          <div className="text-xs text-red-600">Copyleft</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{licenses.filter(l => l.category === 'Proprietary').length}</div>
          <div className="text-xs text-purple-600">Proprietary</div>
        </div>
      </div>

      <div className="space-y-3">
        {licenses.map(lic => (
          <div key={lic.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{lic.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{lic.spdxId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lic.category === 'Permissive' ? 'bg-green-100 text-green-700' : lic.category === 'Copyleft' ? 'bg-red-100 text-red-700' : lic.category === 'Weak Copyleft' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>
                  {lic.category}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${licenseRiskColor(lic.risk)}`}>
                  Risk: {lic.risk}
                </span>
                {lic.compatible ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">{lic.notes}</div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{lic.componentCount} components</div>
              <div className="flex flex-wrap gap-1">
                {lic.obligations.map(ob => <span key={ob} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{ob}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRepositories = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Connected Repositories</h3>
        <button onClick={() => createRepository({ name: 'new-repository', url: 'https://github.com/org/new-repository', branch: 'main' })} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center gap-1">
          <Plus className="w-4 h-4" />Connect Repository
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repositories.map(repo => (
          <div key={repo.id} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${repo.status === 'healthy' ? 'bg-green-100' : repo.status === 'warning' ? 'bg-yellow-100' : repo.status === 'critical' ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <GitBranch className={`w-5 h-5 ${repo.status === 'healthy' ? 'text-green-600' : repo.status === 'warning' ? 'text-yellow-600' : repo.status === 'critical' ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{repo.name}</div>
                  <div className="text-xs text-gray-500">{repo.url}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(repo.status)}`}>{repo.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3 text-center">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-gray-900">{repo.totalComponents}</div>
                <div className="text-xs text-gray-500">Components</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className={`text-lg font-bold ${repo.vulnerabilities > 0 ? 'text-red-700' : 'text-green-700'}`}>{repo.vulnerabilities}</div>
                <div className="text-xs text-gray-500">Vulns</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-900">{repo.sbomFormat}</div>
                <div className="text-xs text-gray-500">Format</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span><Clock className="w-3 h-3 inline mr-1" />Last: {formatDate(repo.lastScan)}</span>
              <span>{repo.autoScan ? <span className="text-green-600">Auto-scan ON</span> : <span className="text-gray-400">Auto-scan OFF</span>}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => { api.modules.sbom.updateRepository(repo.id, { status: 'scanning' }).catch(() => {}); runScan(); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" />Scan Now</button>
              <button onClick={() => setShowExportModal(true)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><Download className="w-3 h-3" />{t('common.export')}</button>
              <button onClick={() => deleteRepository(repo.id)} className="px-3 py-1.5 border border-red-300 text-red-700 rounded text-xs hover:bg-red-50 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />{t('common.remove')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">SBOM Reports</h3>
        <div className="flex items-center gap-2">
          <select value={selectedFormat} onChange={e => setSelectedFormat(e.target.value as SBOMFormat)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="CycloneDX">CycloneDX 1.5</option>
            <option value="SPDX">SPDX 2.3</option>
          </select>
          <button onClick={generateReport} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center gap-1">
            <Plus className="w-4 h-4" />Generate Report
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map(rpt => (
          <div key={rpt.id} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">{rpt.name}</div>
                  <div className="text-xs text-gray-500">{rpt.format} v{rpt.version} | Generated {formatDate(rpt.generatedDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(rpt.complianceStatus)}`}>{rpt.complianceStatus.replace('_', ' ')}</span>
                {rpt.craCompliant ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" />CRA Ready</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 inline-flex items-center gap-1"><ShieldAlert className="w-3 h-3" />CRA Gaps</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div><span className="text-xs text-gray-500">Components: </span><span className="text-sm font-medium">{rpt.componentCount}</span></div>
              <div><span className="text-xs text-gray-500">Vulnerabilities: </span><span className="text-sm font-medium text-red-700">{rpt.vulnerabilityCount}</span></div>
              <div><span className="text-xs text-gray-500">Licenses: </span><span className="text-sm font-medium">{rpt.licenseCount}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadReport(rpt, 'json')} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1"><Download className="w-3 h-3" />{t('common.download')} JSON</button>
              <button onClick={() => downloadReport(rpt, 'xml')} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><Download className="w-3 h-3" />{t('common.download')} XML</button>
              <button onClick={() => setPreviewReport(rpt)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><Eye className="w-3 h-3" />Preview</button>
              <button onClick={() => setShowCompareModal(true)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><GitMerge className="w-3 h-3" />Compare</button>
            </div>
          </div>
        ))}
      </div>

      {/* SBOM Comparison Panel */}
      {showCompareModal && (
        <div className="bg-white border border-blue-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">SBOM Comparison</h4>
            <button onClick={() => setShowCompareModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">Base Version</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {reports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Compare To</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {reports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-lg font-bold text-green-600">+12</div><div className="text-xs text-gray-500">Components Added</div></div>
              <div><div className="text-lg font-bold text-red-600">-3</div><div className="text-xs text-gray-500">Components Removed</div></div>
              <div><div className="text-lg font-bold text-blue-600">8</div><div className="text-xs text-gray-500">Version Changes</div></div>
            </div>
          </div>
        </div>
      )}

      {previewReport && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Report Preview: {previewReport.name}</h4>
            <button onClick={() => setPreviewReport(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{JSON.stringify(buildReportData(previewReport), null, 2)}</pre>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => downloadReport(previewReport, 'json')} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1"><Download className="w-3 h-3" />{t('common.download')} JSON</button>
            <button onClick={() => downloadReport(previewReport, 'xml')} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 inline-flex items-center gap-1"><Download className="w-3 h-3" />{t('common.download')} XML</button>
          </div>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Export Modal
  // ---------------------------------------------------------------------------
  const renderExportModal = () => {
    if (!showExportModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('common.export')} SBOM</h3>
            <button onClick={() => setShowExportModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>CycloneDX 1.5 (JSON)</option>
                <option>CycloneDX 1.5 (XML)</option>
                <option>SPDX 2.3 (JSON)</option>
                <option>SPDX 2.3 (Tag-Value)</option>
                <option>SPDX 2.3 (RDF/XML)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Repositories</option>
                {repositories.map(r => <option key={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Include</label>
              <div className="space-y-2">
                {['Vulnerability data', 'License information', 'Dependency tree', 'Supplier information', 'Hash values'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => setShowExportModal(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />{t('common.export')}
              </button>
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  const tabs: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'components', label: 'Components', icon: <Package className="w-4 h-4" /> },
    { key: 'vulnerabilities', label: 'Vulnerabilities', icon: <Bug className="w-4 h-4" /> },
    { key: 'licenses', label: 'Licenses', icon: <Scale className="w-4 h-4" /> },
    { key: 'repositories', label: 'Repositories', icon: <GitBranch className="w-4 h-4" /> },
    { key: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {renderExportModal()}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">SBOM Manager</h1>
                  <p className="text-xs text-gray-500">Software Bill of Materials - Auto-Generation & Tracking</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadData} disabled={isLoading} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50" title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {criticalVulns > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />{criticalVulns} Critical
                </span>
              )}
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
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.icon}{tab.label}
                {tab.key === 'vulnerabilities' && totalVulns > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{totalVulns}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">{t('common.loading')}...</span>
          </div>
        )}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">{loadError}</span>
            <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-700"><X size={14} /></button>
          </div>
        )}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'components' && renderComponents()}
        {activeTab === 'vulnerabilities' && renderVulnerabilities()}
        {activeTab === 'licenses' && renderLicenses()}
        {activeTab === 'repositories' && renderRepositories()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  );
};
