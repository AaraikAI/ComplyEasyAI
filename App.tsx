
import React, { useState, useEffect } from 'react';
import { ViewState, ComplianceFramework } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import { api } from './services/api';

const MainApp: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadFrameworks();
    }
  }, [isAuthenticated]);

  const loadFrameworks = async () => {
    const data = await api.frameworks.list();
    setFrameworks(data);
  };

  const handleAddFramework = async (name: string, region?: string) => {
    // Optimistic Update
    const newFw: any = { id: 'temp', name, region, status: 'In Review', progress: 0, nextAuditDate: '2025-01-01' };
    setFrameworks([...frameworks, newFw]);
    
    // API Call
    await api.frameworks.create(newFw);
    loadFrameworks(); // Refresh to get real ID
  };

  const handleSelectFramework = (id: string) => {
    setSelectedFrameworkId(id);
    setCurrentView('framework-details');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

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
            framework={frameworks.find(f => f.id === selectedFrameworkId)} 
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
        if (user?.role !== 'admin') return <div>Access Denied</div>;
        return <Settings />;
      default:
        return <Dashboard frameworks={frameworks} onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
