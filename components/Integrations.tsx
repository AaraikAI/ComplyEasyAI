import React, { useState, useEffect } from 'react';
import { Integration } from '../types';
import { CheckCircle, Power, Search, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { IntegrationModal } from './IntegrationModal';
import { useOnboardingTrigger } from '../hooks/useOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';

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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(ALL_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const connectedCount = integrations.filter(i => i.connected).length;
  const integrationLimitReached = isAtLimit(user?.organization?.plan, 'maxIntegrations', connectedCount);

  // Onboarding: trigger integration_setup flow on first visit (Essentials+ only)
  useOnboardingTrigger('integration_setup', true);

  // Load real integration status from API
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        const connectedIntegrations = await api.integrations.list();
        
        // Ensure connectedIntegrations is an array
        const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
        
        // Map connected integrations to our catalog - key by both name and provider
        const connectedMap = new Map();
        integrationsArray.forEach((int: any) => {
          const key1 = int.name?.toLowerCase() || '';
          const key2 = int.provider?.toLowerCase() || '';
          if (key1) connectedMap.set(key1, int);
          if (key2) connectedMap.set(key2, int);
        });

        setIntegrations(ALL_INTEGRATIONS.map(int => {
          // Check both name and id for matching
          const connected = connectedMap.get(int.name.toLowerCase()) || 
                           connectedMap.get(int.id.toLowerCase());
          
          // Only mark as connected if the integration exists AND is actually connected in DB
          if (connected && connected.connected === true) {
            return { 
              ...int, 
              connected: true, 
              lastSync: connected.lastSync ? new Date(connected.lastSync).toLocaleString() : 'Never' 
            };
          }
          return { ...int, connected: false, lastSync: 'Never' };
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
    if (!integration.connected && integrationLimitReached) {
      alert(getUpgradeMessage(user?.organization?.plan, 'maxIntegrations', connectedCount) || 'Integration limit reached. Upgrade in Settings → Billing.');
      return;
    }
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
        // Only mark as connected if the integration exists AND is actually connected in DB
        if (connected && connected.connected === true) {
          return { 
            ...int, 
            connected: true, 
            lastSync: connected.lastSync ? new Date(connected.lastSync).toLocaleString() : 'Never' 
          };
        }
        return { ...int, connected: false, lastSync: 'Never' };
      }));
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
    }
    
    setSelectedIntegration(null);
  };

  const handleDisconnect = async (integration?: Integration) => {
    // Handle case where integration might be undefined (called from modal)
    if (!integration) {
      // If called from modal, selectedIntegration should be set
      if (!selectedIntegration) {
        console.error('No integration selected for disconnect');
        return;
      }
      integration = selectedIntegration;
    }

    if (!integration.name) {
      console.error('Integration name is missing');
      return;
    }

    // Confirmation is already handled in IntegrationModal, skip here to avoid double popup
    // if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
    //   return;
    // }
    
    try {
      // Map integration name to provider ID
      const providerMap: Record<string, string> = {
        'AWS': 'aws',
        'Microsoft Azure': 'azure',
        'Google Cloud Platform': 'gcp',
        'Google Workspace': 'google',
        'GitHub': 'github',
        'GitLab': 'gitlab',
        'Bitbucket': 'bitbucket',
        'Slack': 'slack',
        'Jira': 'jira',
        'Confluence': 'confluence',
        'Trello': 'trello',
        'Asana': 'asana',
        'Monday.com': 'monday',
        'Microsoft Teams': 'microsoft-teams',
        'Discord': 'discord',
        'Okta': 'okta',
        'Auth0': 'auth0',
        'OneLogin': 'onelogin',
        'BambooHR': 'bamboohr',
        'Workday': 'workday',
        'ADP': 'adp',
        'Splunk': 'splunk',
        'Datadog': 'datadog',
        'New Relic': 'newrelic',
        'Sentry': 'sentry',
        'PagerDuty': 'pagerduty',
        'Qualys': 'qualys',
        'Tenable': 'tenable',
        'CrowdStrike': 'crowdstrike',
        'Palo Alto': 'paloalto',
        'MongoDB Atlas': 'mongodb',
        'PostgreSQL': 'postgresql',
        'MySQL': 'mysql',
        'Redis': 'redis',
        'Elasticsearch': 'elasticsearch',
        'Salesforce': 'salesforce',
        'HubSpot': 'hubspot',
        'Zendesk': 'zendesk',
        'Stripe': 'stripe',
        'PayPal': 'paypal',
        'Twilio': 'twilio',
        'SendGrid': 'sendgrid',
        'Heroku': 'heroku',
        'DigitalOcean': 'digitalocean',
        'Jenkins': 'jenkins',
        'CircleCI': 'circleci',
        'Travis CI': 'travis',
        'Docker Hub': 'docker',
        'Kubernetes': 'kubernetes',
      };
      
      const provider = providerMap[integration.name] || integration.id.toLowerCase().replace(/\s+/g, '-');
      
      await api.integrations.disconnect(provider);
      
      // Reload integrations to get updated status
      const connectedIntegrations = await api.integrations.list();
      const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
      const connectedMap = new Map(
        integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
        // Only mark as connected if the integration exists AND is actually connected
        return connected && connected.connected === true
          ? { ...int, connected: true, lastSync: connected.lastSync || 'Never' }
          : { ...int, connected: false, lastSync: 'Never' };
      }));
      
      setSelectedIntegration(null);
      
      // Show success message
      alert(`${integration.name} has been disconnected successfully.`);
    } catch (error: unknown) {
      console.error('Failed to disconnect integration:', error);
      alert(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      const providerMap: Record<string, string> = {
        'AWS': 'aws',
        'Microsoft Azure': 'azure',
        'Google Cloud Platform': 'gcp',
        'Google Workspace': 'google',
        'GitHub': 'github',
        'GitLab': 'gitlab',
        'Bitbucket': 'bitbucket',
        'Slack': 'slack',
        'Jira': 'jira',
        'Confluence': 'confluence',
        'Trello': 'trello',
        'Asana': 'asana',
        'Monday.com': 'monday',
        'Microsoft Teams': 'microsoft-teams',
        'Discord': 'discord',
        'Okta': 'okta',
        'Auth0': 'auth0',
        'OneLogin': 'onelogin',
        'BambooHR': 'bamboohr',
        'Workday': 'workday',
        'ADP': 'adp',
        'Splunk': 'splunk',
        'Datadog': 'datadog',
        'New Relic': 'newrelic',
        'Sentry': 'sentry',
        'PagerDuty': 'pagerduty',
        'Qualys': 'qualys',
        'Tenable': 'tenable',
        'CrowdStrike': 'crowdstrike',
        'Palo Alto': 'paloalto',
        'MongoDB Atlas': 'mongodb',
        'PostgreSQL': 'postgresql',
        'MySQL': 'mysql',
        'Redis': 'redis',
        'Elasticsearch': 'elasticsearch',
        'Salesforce': 'salesforce',
        'HubSpot': 'hubspot',
        'Zendesk': 'zendesk',
        'Stripe': 'stripe',
        'PayPal': 'paypal',
        'Twilio': 'twilio',
        'SendGrid': 'sendgrid',
        'Heroku': 'heroku',
        'DigitalOcean': 'digitalocean',
        'Jenkins': 'jenkins',
        'CircleCI': 'circleci',
        'Travis CI': 'travis',
        'Docker Hub': 'docker',
        'Kubernetes': 'kubernetes',
      };
      
      const provider = providerMap[integration.name] || integration.id.toLowerCase().replace(/\s+/g, '-');
      
      await api.integrations.sync(provider);
      
      // Reload integrations to get updated sync timestamp
      const connectedIntegrations = await api.integrations.list();
      const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
      const connectedMap = new Map(
        integrationsArray.map((int: any) => [int.name?.toLowerCase() || int.provider?.toLowerCase() || '', int])
      );

      setIntegrations(ALL_INTEGRATIONS.map(int => {
        const connected = connectedMap.get(int.name.toLowerCase()) || connectedMap.get(int.id.toLowerCase());
        // Only mark as connected if the integration exists AND is actually connected in DB
        if (connected && connected.connected === true) {
          return { 
            ...int, 
            connected: true, 
            lastSync: connected.lastSync ? new Date(connected.lastSync).toLocaleString() : 'Just now' 
          };
        }
        return { ...int, connected: false, lastSync: 'Never' };
      }));
      
      alert(`${integration.name} synced successfully!`);
    } catch (error: unknown) {
      console.error('Failed to sync integration:', error);
      alert(`Failed to sync: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const totalCount = integrations.length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-onboarding="integrations-page">
      {integrationLimitReached && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
          {getUpgradeMessage(user?.organization?.plan, 'maxIntegrations', connectedCount)} <a href="/settings?tab=billing" className="font-medium underline">Upgrade</a>
        </div>
      )}
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
              <div className="flex gap-2">
                {int.connected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(int);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center"
                    title="Sync Integration"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Sync
                  </button>
                )}
                <button
                  onClick={() => handleIntegrationClick(int)}
                  disabled={!int.connected && integrationLimitReached}
                  title={!int.connected && integrationLimitReached ? getUpgradeMessage(user?.organization?.plan, 'maxIntegrations', connectedCount) : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    int.connected
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : integrationLimitReached
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {int.connected ? 'Manage' : 'Connect'}
                </button>
              </div>
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

