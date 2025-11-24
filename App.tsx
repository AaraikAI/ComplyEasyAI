import React, { useState } from 'react';
import { ViewState, User, ComplianceFramework, ComplianceStatus } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { AIReportGenerator } from './components/AIReportGenerator';
import { AuditTrail } from './components/AuditTrail';
import { Frameworks } from './components/Frameworks';
import { FrameworkDetails } from './components/FrameworkDetails';
import { RiskManagement } from './components/RiskManagement';
import { Settings } from './components/Settings';
import { PolicyGenerator } from './components/AIFeatures/PolicyGenerator';
import { ContractAnalyzer } from './components/AIFeatures/ContractAnalyzer';
import { GapAnalysis } from './components/AIFeatures/GapAnalysis';
import { RFPResponder } from './components/AIFeatures/RFPResponder';
import { PhishingGenerator } from './components/AIFeatures/PhishingGenerator';
import { VendorScorer } from './components/AIFeatures/VendorScorer';
import { DataMapper } from './components/AIFeatures/DataMapper';
import { BCPGenerator } from './components/AIFeatures/BCPGenerator';
import { INITIAL_FRAMEWORKS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>(INITIAL_FRAMEWORKS);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    setSelectedFrameworkId(null);
  };

  const handleAddFramework = (name: string, region?: string) => {
    const newFramework: ComplianceFramework = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      status: ComplianceStatus.IN_REVIEW,
      progress: 0,
      nextAuditDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      region: region
    };
    setFrameworks([...frameworks, newFramework]);
  };

  const handleSelectFramework = (id: string) => {
    setSelectedFrameworkId(id);
    setCurrentView('framework-details');
  };

  const getSelectedFramework = () => {
    return frameworks.find(f => f.id === selectedFrameworkId);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard frameworks={frameworks} onNavigate={setCurrentView} />;
      case 'reports':
        return <AIReportGenerator />;
      case 'audit':
        return <AuditTrail />;
      case 'frameworks':
        return (
          <Frameworks 
            activeFrameworks={frameworks} 
            onAddFramework={handleAddFramework} 
            onSelectFramework={handleSelectFramework}
          />
        );
      case 'framework-details':
        return (
          <FrameworkDetails 
            framework={getSelectedFramework()} 
            onBack={() => setCurrentView('frameworks')} 
          />
        );
      case 'risks':
        return <RiskManagement onBack={() => setCurrentView('dashboard')} />;
      case 'ai-policy':
        return <PolicyGenerator onBack={() => setCurrentView('dashboard')} />;
      case 'ai-contract':
        return <ContractAnalyzer onBack={() => setCurrentView('dashboard')} />;
      case 'ai-gap':
        return <GapAnalysis onBack={() => setCurrentView('dashboard')} />;
      case 'ai-rfp':
        return <RFPResponder onBack={() => setCurrentView('dashboard')} />;
      case 'ai-phishing':
        return <PhishingGenerator onBack={() => setCurrentView('dashboard')} />;
      case 'ai-vendor':
        return <VendorScorer onBack={() => setCurrentView('dashboard')} />;
      case 'ai-data-map':
        return <DataMapper onBack={() => setCurrentView('dashboard')} />;
      case 'ai-bcp':
        return <BCPGenerator onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        if (currentUser?.role !== 'admin') {
           return <div className="p-10 text-center text-red-500">Access Denied: You do not have permission to view Settings.</div>;
        }
        return <Settings />;
      default:
        return <Dashboard frameworks={frameworks} onNavigate={setCurrentView} />;
    }
  };

  if (currentView === 'landing') {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;