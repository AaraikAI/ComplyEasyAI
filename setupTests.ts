import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Suppress React act() warnings and other test-specific console output
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    // Suppress act() warnings and other known test warnings
    if (
      message.includes('not wrapped in act') ||
      message.includes('Warning: ReactDOM.render') ||
      message.includes('Warning: An update to') ||
      message.includes('inside a test was not wrapped in act') ||
      message.includes('Failed to load') ||
      message.includes('AI Error')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Failed to load')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test to prevent state leakage
afterEach(() => {
  cleanup();
});

// Global fetch mock to prevent real network calls during tests
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  // Silently return mock response without console warning
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  });
}) as unknown as typeof fetch;

// Mock the Google GenAI SDK to prevent actual API calls during tests
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: 'Mocked AI Response'
        })
      }
    })),
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        INTEGER: 'INTEGER',
        ARRAY: 'ARRAY'
    }
  };
});

// Helper to create a mock icon component
const mockIcon = (name: string) => {
  const Icon = React.forwardRef((props: any, ref: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, ref, ...props })
  );
  Icon.displayName = name;
  return Icon;
};

// Mock lucide-react globally to prevent slow module loading and Proxy-based mock hangs
vi.mock('lucide-react', () => ({
  // All icons used across the codebase
  Activity: mockIcon('Activity'),
  AlertCircle: mockIcon('AlertCircle'),
  AlertTriangle: mockIcon('AlertTriangle'),
  ArrowLeft: mockIcon('ArrowLeft'),
  ArrowRight: mockIcon('ArrowRight'),
  ArrowRightLeft: mockIcon('ArrowRightLeft'),
  ArrowUpDown: mockIcon('ArrowUpDown'),
  Award: mockIcon('Award'),
  Ban: mockIcon('Ban'),
  BarChart: mockIcon('BarChart'),
  BarChart3: mockIcon('BarChart3'),
  Bell: mockIcon('Bell'),
  Bookmark: mockIcon('Bookmark'),
  BookOpen: mockIcon('BookOpen'),
  Bot: mockIcon('Bot'),
  Brain: mockIcon('Brain'),
  BrainCircuit: mockIcon('BrainCircuit'),
  Briefcase: mockIcon('Briefcase'),
  Building: mockIcon('Building'),
  Building2: mockIcon('Building2'),
  Calendar: mockIcon('Calendar'),
  Check: mockIcon('Check'),
  CheckCircle: mockIcon('CheckCircle'),
  CheckCircle2: mockIcon('CheckCircle2'),
  CheckSquare: mockIcon('CheckSquare'),
  ChevronDown: mockIcon('ChevronDown'),
  ChevronLeft: mockIcon('ChevronLeft'),
  ChevronRight: mockIcon('ChevronRight'),
  ChevronUp: mockIcon('ChevronUp'),
  Circle: mockIcon('Circle'),
  ClipboardCheck: mockIcon('ClipboardCheck'),
  ClipboardList: mockIcon('ClipboardList'),
  Clock: mockIcon('Clock'),
  Cloud: mockIcon('Cloud'),
  Code: mockIcon('Code'),
  Copy: mockIcon('Copy'),
  Cpu: mockIcon('Cpu'),
  CreditCard: mockIcon('CreditCard'),
  Crown: mockIcon('Crown'),
  Database: mockIcon('Database'),
  DollarSign: mockIcon('DollarSign'),
  Download: mockIcon('Download'),
  Edit: mockIcon('Edit'),
  Edit2: mockIcon('Edit2'),
  Edit3: mockIcon('Edit3'),
  ExternalLink: mockIcon('ExternalLink'),
  Eye: mockIcon('Eye'),
  EyeOff: mockIcon('EyeOff'),
  Factory: mockIcon('Factory'),
  FileCheck: mockIcon('FileCheck'),
  FileCode: mockIcon('FileCode'),
  FileText: mockIcon('FileText'),
  FileWarning: mockIcon('FileWarning'),
  Filter: mockIcon('Filter'),
  Fingerprint: mockIcon('Fingerprint'),
  Folder: mockIcon('Folder'),
  FolderOpen: mockIcon('FolderOpen'),
  GitBranch: mockIcon('GitBranch'),
  GitGraph: mockIcon('GitGraph'),
  GitMerge: mockIcon('GitMerge'),
  Globe: mockIcon('Globe'),
  GraduationCap: mockIcon('GraduationCap'),
  Grid3x3: mockIcon('Grid3x3'),
  HardDrive: mockIcon('HardDrive'),
  Hash: mockIcon('Hash'),
  Heart: mockIcon('Heart'),
  HelpCircle: mockIcon('HelpCircle'),
  Info: mockIcon('Info'),
  Key: mockIcon('Key'),
  Landmark: mockIcon('Landmark'),
  Layout: mockIcon('Layout'),
  LayoutDashboard: mockIcon('LayoutDashboard'),
  Layers: mockIcon('Layers'),
  LifeBuoy: mockIcon('LifeBuoy'),
  Lightbulb: mockIcon('Lightbulb'),
  Link2: mockIcon('Link2'),
  ListChecks: mockIcon('ListChecks'),
  ListFilter: mockIcon('ListFilter'),
  Loader: mockIcon('Loader'),
  Loader2: mockIcon('Loader2'),
  Lock: mockIcon('Lock'),
  LogOut: mockIcon('LogOut'),
  Mail: mockIcon('Mail'),
  Megaphone: mockIcon('Megaphone'),
  Menu: mockIcon('Menu'),
  MessageCircle: mockIcon('MessageCircle'),
  MessageSquare: mockIcon('MessageSquare'),
  Mic: mockIcon('Mic'),
  Minus: mockIcon('Minus'),
  Monitor: mockIcon('Monitor'),
  Network: mockIcon('Network'),
  Paperclip: mockIcon('Paperclip'),
  Pause: mockIcon('Pause'),
  Phone: mockIcon('Phone'),
  PieChart: mockIcon('PieChart'),
  Plane: mockIcon('Plane'),
  Play: mockIcon('Play'),
  Plus: mockIcon('Plus'),
  Power: mockIcon('Power'),
  PowerOff: mockIcon('PowerOff'),
  Radio: mockIcon('Radio'),
  RefreshCw: mockIcon('RefreshCw'),
  Rocket: mockIcon('Rocket'),
  RotateCw: mockIcon('RotateCw'),
  Save: mockIcon('Save'),
  Search: mockIcon('Search'),
  Send: mockIcon('Send'),
  Server: mockIcon('Server'),
  Settings: mockIcon('Settings'),
  Share2: mockIcon('Share2'),
  Shield: mockIcon('Shield'),
  ShieldAlert: mockIcon('ShieldAlert'),
  ShieldCheck: mockIcon('ShieldCheck'),
  ShoppingCart: mockIcon('ShoppingCart'),
  Slack: mockIcon('Slack'),
  SortAsc: mockIcon('SortAsc'),
  SortDesc: mockIcon('SortDesc'),
  Sparkles: mockIcon('Sparkles'),
  Star: mockIcon('Star'),
  Table: mockIcon('Table'),
  Tag: mockIcon('Tag'),
  Target: mockIcon('Target'),
  Terminal: mockIcon('Terminal'),
  ThumbsUp: mockIcon('ThumbsUp'),
  Timer: mockIcon('Timer'),
  Trash2: mockIcon('Trash2'),
  TrendingDown: mockIcon('TrendingDown'),
  TrendingUp: mockIcon('TrendingUp'),
  Trophy: mockIcon('Trophy'),
  Unlock: mockIcon('Unlock'),
  Upload: mockIcon('Upload'),
  User: mockIcon('User'),
  UserPlus: mockIcon('UserPlus'),
  Users: mockIcon('Users'),
  Video: mockIcon('Video'),
  Webhook: mockIcon('Webhook'),
  Wifi: mockIcon('Wifi'),
  Workflow: mockIcon('Workflow'),
  X: mockIcon('X'),
  XCircle: mockIcon('XCircle'),
  Zap: mockIcon('Zap'),
}));

// Mock Recharts to avoid rendering complex SVG in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { className: "recharts-responsive-container" }, children),
  AreaChart: ({ children }: any) => React.createElement('div', null, children),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: any) => React.createElement('div', null, children),
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: any) => React.createElement('div', null, children),
  Bar: () => null,
  LineChart: ({ children }: any) => React.createElement('div', null, children),
  Line: () => null,
  RadialBarChart: ({ children }: any) => React.createElement('div', null, children),
  RadialBar: () => null,
  RadarChart: ({ children }: any) => React.createElement('div', null, children),
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  ComposedChart: ({ children }: any) => React.createElement('div', null, children),
  Scatter: () => null,
  Treemap: () => null,
  FunnelChart: ({ children }: any) => React.createElement('div', null, children),
  Funnel: () => null,
}));
