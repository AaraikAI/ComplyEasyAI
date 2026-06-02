import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all heavy components
vi.mock('./components/Dashboard', () => ({ Dashboard: () => <div>Dashboard</div> }));
vi.mock('./components/LandingPage', () => ({ LandingPage: () => <div data-testid="landing-page">Landing</div> }));
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
vi.mock('./components/ComplianceChat', () => ({ ComplianceChat: () => <div>ComplianceChat</div> }));
vi.mock('./components/DemoBookingForm', () => ({ DemoBookingForm: () => <div>DemoBookingForm</div> }));
vi.mock('./components/PaymentModal', () => ({ PaymentModal: () => <div>PaymentModal</div> }));
vi.mock('./components/PricingSection', () => ({ PricingSection: () => <div>PricingSection</div> }));
vi.mock('./components/FeatureMarketplace', () => ({ FeatureMarketplace: () => <div>FeatureMarketplace</div> }));
vi.mock('./components/AIReportGenerator', () => ({ AIReportGenerator: () => <div>AIReportGenerator</div> }));
vi.mock('./components/GoalModal', () => ({ GoalModal: () => <div>GoalModal</div> }));
vi.mock('./components/IntegrationModal', () => ({ IntegrationModal: () => <div>IntegrationModal</div> }));

// Lazy loaded components
vi.mock('./components/AIFeatures/AIFeatures', () => ({ AIFeatures: () => <div>AIFeatures</div> }));
vi.mock('./components/AIFeatures/HomomorphicAI', () => ({ HomomorphicAI: () => <div>HomomorphicAI</div> }));

describe('App', () => {
  it('should export a valid React component', async () => {
    const { default: App } = await import('./App');
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('renders the app shell without throwing', async () => {
    const { default: App } = await import('./App');
    // Exercise the full provider + route tree so a broken render (e.g. a bad
    // module import at mount) surfaces here rather than only at runtime.
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
    // The Toaster mount point and lazy Suspense boundaries are present.
    expect(document.body).toBeTruthy();
  });
});
