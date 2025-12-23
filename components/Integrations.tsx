import React, { useState, useEffect } from 'react';
import { Integration } from '../types';
import { CheckCircle, Power, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { IntegrationModal } from './IntegrationModal';

// Comprehensive list of ALL available integrations
const ALL_INTEGRATIONS: Integration[] = [
  // Cloud Providers
  { id: 'aws', name: 'AWS', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'aws' },
  { id: 'azure', name: 'Microsoft Azure', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'azure' },
  { id: 'gcp', name: 'Google Cloud Platform', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'gcp' },
  { id: 'heroku', name: 'Heroku', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'heroku' },
  { id: 'digitalocean', name: 'DigitalOcean', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'digitalocean' },
  
  // Development & DevOps
  { id: 'github', name: 'GitHub', category: 'Dev', connected: false, lastSync: 'Never', icon: 'github' },
  { id: 'gitlab', name: 'GitLab', category: 'Dev', connected: false, lastSync: 'Never', icon: 'gitlab' },
  { id: 'bitbucket', name: 'Bitbucket', category: 'Dev', connected: false, lastSync: 'Never', icon: 'bitbucket' },
  { id: 'jenkins', name: 'Jenkins', category: 'Dev', connected: false, lastSync: 'Never', icon: 'jenkins' },
  { id: 'circleci', name: 'CircleCI', category: 'Dev', connected: false, lastSync: 'Never', icon: 'circleci' },
  { id: 'travis', name: 'Travis CI', category: 'Dev', connected: false, lastSync: 'Never', icon: 'travis' },
  { id: 'docker', name: 'Docker Hub', category: 'Dev', connected: false, lastSync: 'Never', icon: 'docker' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'Dev', connected: false, lastSync: 'Never', icon: 'kubernetes' },
  
  // Project Management & Collaboration
  { id: 'jira', name: 'Jira', category: 'Dev', connected: false, lastSync: 'Never', icon: 'jira' },
  { id: 'confluence', name: 'Confluence', category: 'Dev', connected: false, lastSync: 'Never', icon: 'confluence' },
  { id: 'trello', name: 'Trello', category: 'Dev', connected: false, lastSync: 'Never', icon: 'trello' },
  { id: 'asana', name: 'Asana', category: 'Dev', connected: false, lastSync: 'Never', icon: 'asana' },
  { id: 'monday', name: 'Monday.com', category: 'Dev', connected: false, lastSync: 'Never', icon: 'monday' },
  { id: 'slack', name: 'Slack', category: 'Dev', connected: false, lastSync: 'Never', icon: 'slack' },
  { id: 'microsoft-teams', name: 'Microsoft Teams', category: 'Dev', connected: false, lastSync: 'Never', icon: 'teams' },
  { id: 'discord', name: 'Discord', category: 'Dev', connected: false, lastSync: 'Never', icon: 'discord' },
  
  // HR & Identity
  { id: 'google-workspace', name: 'Google Workspace', category: 'HR', connected: false, lastSync: 'Never', icon: 'google' },
  { id: 'microsoft-365', name: 'Microsoft 365', category: 'HR', connected: false, lastSync: 'Never', icon: 'microsoft' },
  { id: 'okta', name: 'Okta', category: 'HR', connected: false, lastSync: 'Never', icon: 'okta' },
  { id: 'auth0', name: 'Auth0', category: 'HR', connected: false, lastSync: 'Never', icon: 'auth0' },
  { id: 'onelogin', name: 'OneLogin', category: 'HR', connected: false, lastSync: 'Never', icon: 'onelogin' },
  { id: 'bamboohr', name: 'BambooHR', category: 'HR', connected: false, lastSync: 'Never', icon: 'bamboohr' },
  { id: 'workday', name: 'Workday', category: 'HR', connected: false, lastSync: 'Never', icon: 'workday' },
  { id: 'adp', name: 'ADP', category: 'HR', connected: false, lastSync: 'Never', icon: 'adp' },
  
  // Security & Monitoring
  { id: 'splunk', name: 'Splunk', category: 'Security', connected: false, lastSync: 'Never', icon: 'splunk' },
  { id: 'datadog', name: 'Datadog', category: 'Security', connected: false, lastSync: 'Never', icon: 'datadog' },
  { id: 'newrelic', name: 'New Relic', category: 'Security', connected: false, lastSync: 'Never', icon: 'newrelic' },
  { id: 'sentry', name: 'Sentry', category: 'Security', connected: false, lastSync: 'Never', icon: 'sentry' },
  { id: 'pagerduty', name: 'PagerDuty', category: 'Security', connected: false, lastSync: 'Never', icon: 'pagerduty' },
  { id: 'qualys', name: 'Qualys', category: 'Security', connected: false, lastSync: 'Never', icon: 'qualys' },
  { id: 'tenable', name: 'Tenable', category: 'Security', connected: false, lastSync: 'Never', icon: 'tenable' },
  { id: 'rapid7', name: 'Rapid7', category: 'Security', connected: false, lastSync: 'Never', icon: 'rapid7' },
  
  // Database & Storage
  { id: 'mongodb', name: 'MongoDB Atlas', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'mongodb' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'postgresql' },
  { id: 'mysql', name: 'MySQL', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'mysql' },
  { id: 'redis', name: 'Redis', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'redis' },
  { id: 'elasticsearch', name: 'Elasticsearch', category: 'Cloud', connected: false, lastSync: 'Never', icon: 'elasticsearch' },
  
  // CRM & Sales
  { id: 'salesforce', name: 'Salesforce', category: 'HR', connected: false, lastSync: 'Never', icon: 'salesforce' },
  { id: 'hubspot', name: 'HubSpot', category: 'HR', connected: false, lastSync: 'Never', icon: 'hubspot' },
  { id: 'zendesk', name: 'Zendesk', category: 'HR', connected: false, lastSync: 'Never', icon: 'zendesk' },
  
  // Payment & Finance
  { id: 'stripe', name: 'Stripe', category: 'Security', connected: false, lastSync: 'Never', icon: 'stripe' },
  { id: 'paypal', name: 'PayPal', category: 'Security', connected: false, lastSync: 'Never', icon: 'paypal' },
  
  // Communication
  { id: 'twilio', name: 'Twilio', category: 'Dev', connected: false, lastSync: 'Never', icon: 'twilio' },
  { id: 'sendgrid', name: 'SendGrid', category: 'Dev', connected: false, lastSync: 'Never', icon: 'sendgrid' },
];

interface IntegrationsProps {
  onBack?: () => void;
}

export const Integrations: React.FC<IntegrationsProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(ALL_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load real integration status from API
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        const connectedIntegrations = await api.integrations.list();
        
        // Ensure connectedIntegrations is an array
        const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
        
        // Map connected integrations to our catalog
        const connectedMap = new Map(
          integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
        );

        setIntegrations(ALL_INTEGRATIONS.map(int => {
          const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
          return connected 
            ? { ...int, connected: true, lastSync: connected.lastSync || 'Never' }
            : int;
        }));
      } catch (error) {
        console.error('Failed to load integrations:', error);
        // Fallback to catalog without connection status
        setIntegrations(ALL_INTEGRATIONS);
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrations();
  }, []);

  const categories = ['All', 'Cloud', 'Dev', 'HR', 'Security'];
  
  const filteredIntegrations = integrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || int.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIntegrationClick = (integration: Integration) => {
    setSelectedIntegration(integration);
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    
    // Reload integrations to get updated status
    try {
      const connectedIntegrations = await api.integrations.list();
      const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
      const connectedMap = new Map(
        integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
        return connected 
          ? { ...int, connected: true, lastSync: connected.lastSync || 'Never' }
          : int;
      }));
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
    }
    
    setSelectedIntegration(null);
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) return;
    
    // Reload integrations to get updated status
    try {
      const connectedIntegrations = await api.integrations.list();
      const connectedMap = new Map(
        connectedIntegrations.map(int => [int.name.toLowerCase(), int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase());
        return connected 
          ? { ...int, connected: true, lastSync: connected.lastSync }
          : int;
      }));
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
    }
    
    setSelectedIntegration(null);
  };

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalCount = integrations.length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations Catalog</h1>
          <p className="text-gray-500 mt-1">
            Connect your tools to automate compliance collection. {connectedCount} of {totalCount} connected.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
            <span>Close</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (cat === 'All' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIntegrations.map(int => (
          <div
            key={int.id}
            className={`p-5 border rounded-xl bg-white hover:shadow-md transition-all ${
              int.connected ? 'border-brand-200 bg-brand-50' : 'border-gray-200 hover:border-brand-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 border border-gray-100 flex-shrink-0">
                {/* Icon placeholder - in production, use actual icons */}
                <div className="font-bold text-sm">
                  {int.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => handleIntegrationClick(int)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  int.connected
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {int.connected ? 'Manage' : 'Connect'}
              </button>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{int.name}</h3>
              <div className="flex items-center space-x-2 text-sm mb-2">
                <span className="text-gray-500">{int.category}</span>
                {int.connected && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle size={12} className="mr-1" />
                      Connected
                    </span>
                  </>
                )}
              </div>
              {int.connected && (
                <p className="text-xs text-gray-500">Last sync: {int.lastSync}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No integrations found matching your search.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
            className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedIntegration && (
        <IntegrationModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
};

