import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Track mock authentication state
let mockIsAuthenticated = false;
const mockLogin = vi.fn(() => { mockIsAuthenticated = true; });
const mockLogout = vi.fn(() => { mockIsAuthenticated = false; });

// Mock AuthContext
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { id: '1', email: 'test@test.com', name: 'Test User', role: 'admin', organization: { plan: 'Growth' } } : null,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    verifyMagicLink: vi.fn(),
    register: vi.fn(),
    loginWithMagicLink: vi.fn(),
  }),
}));

// Mock OnboardingContext
vi.mock('./contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false }),
}));

// Mock sub-components to avoid loading all heavy deps
vi.mock('./components/Dashboard', () => ({ Dashboard: () => <div>Dashboard Component</div> }));
vi.mock('./components/LandingPage', () => ({ LandingPage: () => <div data-testid="landing-page">Landing Page</div> }));
vi.mock('./components/Layout', () => ({ Layout: ({ children }: any) => <div>{children}</div> }));
vi.mock('./components/Reports', () => ({ Reports: () => <div>Reports</div> }));
vi.mock('./components/AuditTrail', () => ({ AuditTrail: () => <div>AuditTrail</div> }));
vi.mock('./components/Frameworks', () => ({ Frameworks: () => <div>Frameworks</div> }));
vi.mock('./components/FrameworkDetails', () => ({ FrameworkDetails: () => <div>FrameworkDetails</div> }));
vi.mock('./components/RiskManagement', () => ({ RiskManagement: () => <div>RiskManagement</div> }));
vi.mock('./components/MyTasks', () => ({ MyTasks: () => <div>MyTasks</div> }));
vi.mock('./components/Integrations', () => ({ Integrations: () => <div>Integrations</div> }));
vi.mock('./components/Settings', () => ({ Settings: () => <div>Settings</div> }));
vi.mock('./components/ACOSDashboard', () => ({ default: () => <div>ACOSDashboard</div> }));
vi.mock('./components/SecurityFeatures', () => ({ default: () => <div>SecurityFeatures</div> }));
vi.mock('./components/RealTimeAnalytics', () => ({ default: () => <div>RealTimeAnalytics</div> }));
vi.mock('./components/AIRMFDashboard', () => ({ AIRMFDashboard: () => <div>AIRMFDashboard</div> }));
vi.mock('./components/AISystemList', () => ({ AISystemList: () => <div>AISystemList</div> }));
vi.mock('./components/AISystemDetails', () => ({ AISystemDetails: () => <div>AISystemDetails</div> }));
vi.mock('./components/AISystemCreate', () => ({ AISystemCreate: () => <div>AISystemCreate</div> }));
vi.mock('./components/AIRMFAssessments', () => ({ AIRMFAssessments: () => <div>AIRMFAssessments</div> }));
vi.mock('./components/EUAIActDashboard', () => ({ EUAIActDashboard: () => <div>EUAIActDashboard</div> }));
vi.mock('./components/DMAGatekeeperManagement', () => ({ DMAGatekeeperManagement: () => <div>DMAGatekeeperManagement</div> }));
vi.mock('./components/DSAPlatformManagement', () => ({ DSAPlatformManagement: () => <div>DSAPlatformManagement</div> }));
vi.mock('./components/VendorManagement', () => ({ default: () => <div>VendorManagement</div> }));
vi.mock('./components/PolicyManagement', () => ({ default: () => <div>PolicyManagement</div> }));
vi.mock('./components/MonitoringDashboard', () => ({ default: () => <div>MonitoringDashboard</div> }));
vi.mock('./components/WorkspaceManagement', () => ({ default: () => <div>WorkspaceManagement</div> }));
vi.mock('./components/QuestionnaireManagement', () => ({ default: () => <div>QuestionnaireManagement</div> }));
vi.mock('./components/IssueManagement', () => ({ default: () => <div>IssueManagement</div> }));
vi.mock('./components/SignupPage', () => ({ default: () => <div>SignupPage</div> }));
vi.mock('./components/LearnPage', () => ({ default: () => <div>LearnPage</div> }));
vi.mock('./components/CommunityPage', () => ({ default: () => <div>CommunityPage</div> }));
vi.mock('./components/StatusPage', () => ({ default: () => <div>StatusPage</div> }));
vi.mock('./components/DocsPage', () => ({ default: () => <div>DocsPage</div> }));
vi.mock('./components/AIFeatures/PolicyGenerator', () => ({ PolicyGenerator: () => <div>PolicyGenerator</div> }));
vi.mock('./components/AIFeatures/ContractAnalyzer', () => ({ ContractAnalyzer: () => <div>ContractAnalyzer</div> }));
vi.mock('./components/AIFeatures/GapAnalysis', () => ({ GapAnalysis: () => <div>GapAnalysis</div> }));
vi.mock('./components/AIFeatures/RFPResponder', () => ({ RFPResponder: () => <div>RFPResponder</div> }));
vi.mock('./components/AIFeatures/PhishingGenerator', () => ({ PhishingGenerator: () => <div>PhishingGenerator</div> }));
vi.mock('./components/AIFeatures/VendorScorer', () => ({ VendorScorer: () => <div>VendorScorer</div> }));
vi.mock('./components/AIFeatures/DataMapper', () => ({ DataMapper: () => <div>DataMapper</div> }));
vi.mock('./components/AIFeatures/BCPGenerator', () => ({ BCPGenerator: () => <div>BCPGenerator</div> }));

// Mock api calls
vi.mock('./services/api', () => ({
  api: {
    frameworks: { list: vi.fn().mockResolvedValue([]) },
    risks: { list: vi.fn().mockResolvedValue([]) },
  }
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    vi.clearAllMocks();
  });

  it('renders landing page when not authenticated', () => {
    mockIsAuthenticated = false;
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', () => {
    mockIsAuthenticated = true;
    render(<App />);
    expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
  });
});
